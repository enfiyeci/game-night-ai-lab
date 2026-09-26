import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { slotsFor } from '../sim/recipe.js';
import { createGame } from '../ui/game.js';
import { cardCostWords, queuedRunProblem, recipePreview, sanitizeDraft } from '../ui/logic/actions.js';
import { projectQueue } from '../ui/logic/compute.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

const recipe = ({ size = 'small', length = 'optimal', alignShare = 0.2, pre = [], mid = [], post = [] } = {}) => ({
  sliders: { size, length, alignShare },
  picks: { pre, mid, post },
});

test('recipePreview preserves pick-count and duplicate-group errors from the sim', () => {
  const state = SCENARIOS.era3Idle(1);
  const tooMany = recipe({
    post: ['synthetic-sft', 'thumbs', 'spec-light', 'safety-tuning', 'rlvr-light'],
  });
  assert.ok(tooMany.picks.post.length > slotsFor(state, 'post'));
  assert.ok(recipePreview(state, tooMany).errors.includes(
    `post: ${tooMany.picks.post.length} picks but only ${slotsFor(state, 'post')} slots`,
  ));

  const duplicate = recipe({ post: ['synthetic-sft', 'human-sft'] });
  assert.ok(recipePreview(state, duplicate).errors.includes('post: two cards from group sft'));
});

test('recipePreview reports compute fit and a small starting recipe can run', () => {
  const state = createInitialState();
  const large = recipe({ size: 'large' });
  const preview = recipePreview(state, large);
  assert.equal(preview.free, 9);
  assert.equal(preview.cost.units, 10);
  assert.equal(preview.fits, false);
  assert.ok(preview.errors.includes('not enough free compute'));

  const small = recipe();
  assert.equal(recipePreview(state, small).ok, true);
  const game = createGame();
  assert.equal(game.addMove({ type: 'startRun', recipe: small }).ok, true);
  const result = game.endTurn();
  assert.deepEqual(result.errors, []);
  assert.ok(game.state.activeRun || game.state.pendingModel);
});

test('recipePreview keeps blocker order and avoids costing unknown sliders', () => {
  const state = createInitialState();
  state.activeRun = { units: 1 };
  state.pendingModel = {};
  const blocked = recipePreview(state, recipe());
  assert.deepEqual(blocked.errors.slice(0, 2), [
    'a training run is already active',
    'release the trained model first',
  ]);

  state.activeRun = null;
  state.pendingModel = null;
  const unknown = recipePreview(state, recipe({ size: 'colossal', length: 'forever' }));
  assert.equal(unknown.cost, null);
  assert.equal(unknown.fits, false);
  assert.deepEqual(unknown.errors.slice(0, 2), ['unknown size colossal', 'unknown training length forever']);
});

test('recipePreview sees a queued budget that changes post-training slots', () => {
  const game = createGame({ state: SCENARIOS.era3Idle(1), seed: 1 });
  const fourGroups = recipe({ post: ['synthetic-sft', 'thumbs', 'spec-light', 'safety-tuning'] });

  assert.equal(game.setBudget({
    spend: 20,
    split: { training: 0.4, security: 0.1, product: 0.3, talent: 0.2 },
  }).ok, true);
  let state = projectQueue(game.state, game.queue);
  assert.equal(slotsFor(state, 'post'), 3);
  assert.ok(recipePreview(state, fourGroups).errors.includes('post: 4 picks but only 3 slots'));

  assert.equal(game.setBudget({
    spend: 20,
    split: { training: 0.3, security: 0.1, product: 0.3, talent: 0.3 },
  }).ok, true);
  state = projectQueue(game.state, game.queue);
  assert.equal(slotsFor(state, 'post'), 4);
  assert.equal(recipePreview(state, fourGroups).errors.includes('post: 4 picks but only 3 slots'), false);
});

test('queuedRunProblem revalidates a queued run against a replacement budget', () => {
  const state = SCENARIOS.era3Idle(1);
  const queuedRecipe = recipe({ post: ['synthetic-sft', 'thumbs', 'spec-light', 'safety-tuning'] });
  const highTalent = {
    spend: 20,
    split: { training: 0.3, security: 0.1, product: 0.3, talent: 0.3 },
  };
  const lowTalent = {
    spend: 20,
    split: { training: 0.4, security: 0.1, product: 0.3, talent: 0.2 },
  };
  const queue = { budget: highTalent, moves: [{ type: 'startRun', recipe: queuedRecipe }] };
  const snapshot = structuredClone(queue);

  assert.equal(queuedRunProblem(state, queue), '');
  assert.equal(queuedRunProblem(state, { ...queue, budget: lowTalent }), 'post: 4 picks but only 3 slots');
  assert.equal(queuedRunProblem(state, { budget: lowTalent, moves: [] }), '');
  assert.deepEqual(queue, snapshot);
});

test('queuedRunProblem revalidates a queued run against the edited compute split', () => {
  const state = createInitialState();
  const queuedRecipe = recipe({ size: 'medium', post: ['rlhf'] });
  const queue = { moves: [{ type: 'startRun', recipe: queuedRecipe }] };

  assert.equal(queuedRunProblem(state, {
    ...queue,
    computeSplit: { ...state.compute.split, safety: 0.1 },
    pledge: 0.1,
  }), '');
  assert.equal(queuedRunProblem(state, {
    ...queue,
    computeSplit: { ...state.compute.split, safety: 0.5 },
    pledge: 0.2,
  }), 'not enough free compute');
});

test('sanitizeDraft drops invalid picks and repairs sliders without mutating input', () => {
  const state = createInitialState();
  const input = recipe({
    size: 'xl',
    length: 'heavy',
    alignShare: 0.83,
    pre: ['synthetic-data', 'filtered-data', 'licensed-data', 'stability'],
    mid: ['anneal'],
    post: ['synthetic-sft', 'human-sft', 'safety-tuning', 'classifiers'],
  });
  const clean = sanitizeDraft(state, input);
  assert.deepEqual(clean.sliders, { size: 'large', length: 'over', alignShare: 0.5 });
  assert.deepEqual(clean.picks.pre, ['filtered-data', 'stability']);
  assert.deepEqual(clean.picks.mid, []);
  assert.deepEqual(clean.picks.post, ['synthetic-sft', 'safety-tuning']);
  assert.equal(input.sliders.size, 'xl');

  assert.equal(sanitizeDraft(state, recipe({ alignShare: 0.224 })).sliders.alignShare, 0.2);
  assert.equal(sanitizeDraft(state, recipe({ alignShare: 0.075 })).sliders.alignShare, 0.1);
  assert.deepEqual(sanitizeDraft(state), recipe({ size: 'medium', alignShare: 0.2 }));
});

test('sanitizeDraft trims distinct unlocked picks to the projected slot count', () => {
  const state = SCENARIOS.era3Idle(1);
  state.budget = { spend: 20, split: { training: 0.4, security: 0.1, product: 0.3, talent: 0.2 } };
  const clean = sanitizeDraft(state, recipe({
    post: ['synthetic-sft', 'thumbs', 'spec-light', 'safety-tuning', 'missing-card', 'filtered-data'],
  }));
  assert.equal(slotsFor(state, 'post'), 3);
  assert.deepEqual(clean.picks.post, ['synthetic-sft', 'thumbs', 'spec-light']);
});

test('cardCostWords formats public card costs and omits free parts', () => {
  assert.deepEqual(cardCostWords({ cost: { cash: 10 } }), ['$10M']);
  assert.deepEqual(cardCostWords({ cost: { computeMult: 0.8 } }), ['−20% compute']);
  assert.deepEqual(cardCostWords({ cost: { computeMult: 1.15 } }), ['+15% compute']);
  assert.deepEqual(cardCostWords({ cost: { turns: 1 } }), ['+1 turn']);
  assert.deepEqual(cardCostWords({ cost: {} }), []);
});
