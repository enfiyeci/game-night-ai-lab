import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { slotsFor } from '../sim/recipe.js';
import { placeOrder, released } from '../sim/queue.js';
import { createGame } from '../ui/game.js';
import {
  budgetPreviewQueue,
  cardCostWords,
  fitDraftToCompute,
  queuedMoveProblem,
  queuedRunProblem,
  recipePreview,
  sanitizeDraft,
} from '../ui/logic/actions.js';
import { opinions, projectQueue } from '../ui/logic/compute.js';
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

test('budget preview keeps a pledge local and updates allocation advice', () => {
  const state = createInitialState();
  const queue = { budget: structuredClone(state.budget), moves: [] };
  const snapshot = structuredClone(queue);
  const withSafety = (safety) => budgetPreviewQueue(queue, {
    budget: state.budget,
    computeSplit: { ...state.compute.split, safety },
    pledge: 0.2,
    canPledge: true,
  });

  const low = projectQueue(state, withSafety(0.1));
  const high = projectQueue(state, withSafety(0.2));
  assert.deepEqual(queue, snapshot);
  assert.equal(Object.hasOwn(queue, 'pledge'), false);
  assert.equal(withSafety(0.1).pledge, 0.2);
  assert.match(opinions(low, 'budget').find((item) => item.id === 'safety').text, /breaks/);
  assert.match(opinions(high, 'budget').find((item) => item.id === 'safety').text, /keeps/);
});

test('queuedMoveProblem rejects contract actions that break queued runs, deals, or orders', () => {
  const runState = createInitialState({ seed: 1 });
  const spot = runState.compute.offers.find((offer) => offer.supplier === 'spot');
  const runQueue = {
    moves: [
      { type: 'deal', offerId: spot.id },
      { type: 'startRun', recipe: recipe({ size: 'large' }) },
    ],
  };
  const runSnapshot = structuredClone(runState);
  assert.equal(queuedMoveProblem(runState, runQueue), '');
  assert.equal(queuedMoveProblem(runState, {
    ...runQueue,
    contractActions: [{ id: 'starter', action: 'scaleDown' }],
  }), 'not enough free compute');
  assert.deepEqual(runState, runSnapshot);

  const dealState = createInitialState({ seed: 1 });
  const verde = dealState.compute.offers.find((offer) => offer.supplier === 'verde');
  dealState.cash = verde.upfront;
  const dealQueue = { moves: [{ type: 'deal', offerId: verde.id }] };
  assert.equal(queuedMoveProblem(dealState, dealQueue), '');
  assert.match(queuedMoveProblem(dealState, {
    ...dealQueue,
    contractActions: [{ id: 'starter', action: 'break' }],
  }), /cash/);

  const orderState = createInitialState({ seed: 1 });
  orderState.era = 3;
  const order = { type: 'queueOrder', units: Math.min(10, released(orderState)), tier: 'prepaid' };
  const funded = structuredClone(orderState);
  funded.cash = Number.MAX_SAFE_INTEGER;
  const upfront = placeOrder(funded, order).upfront;
  orderState.cash = upfront;
  const orderQueue = { moves: [order] };
  assert.equal(queuedMoveProblem(orderState, orderQueue), '');
  assert.equal(queuedMoveProblem(orderState, {
    ...orderQueue,
    contractActions: [{ id: 'starter', action: 'break' }],
  }), 'not enough cash to prepay');
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

test('sanitizeDraft drops hidden cards even though the sim still unlocks them', () => {
  const state = SCENARIOS.era3Idle(1);
  const hiddenOnly = sanitizeDraft(state, recipe({ post: ['tamper'] }));
  assert.deepEqual(hiddenOnly.picks.post, []);

  const visibleKept = sanitizeDraft(state, recipe({ post: ['safety-tuning'] }));
  assert.deepEqual(visibleKept.picks.post, ['safety-tuning']);
});

test('cardCostWords formats public card costs and omits free parts', () => {
  assert.deepEqual(cardCostWords({ cost: { cash: 10 } }), ['$10M']);
  assert.deepEqual(cardCostWords({ cost: { computeMult: 0.8 } }), ['−20% compute']);
  assert.deepEqual(cardCostWords({ cost: { computeMult: 1.15 } }), ['+15% compute']);
  assert.deepEqual(cardCostWords({ cost: { turns: 1 } }), ['+about 3 months']);
  assert.deepEqual(cardCostWords({ cost: {} }), []);
});

test('sanitizeDraft keeps focus sliders and takes the alignment share from Values', () => {
  const state = createInitialState();
  const draft = { ...recipe({ alignShare: 0.2 }), focus: { pre: [50, 30, 20], post: [30, 60, 10] } };
  const clean = sanitizeDraft(state, draft);
  assert.deepEqual(clean.focus, { pre: [50, 30, 20], post: [30, 60, 10] });
  assert.equal(clean.sliders.alignShare, 0.5); // 60% of the time on values, capped at half
  assert.equal(sanitizeDraft(state, { ...draft, focus: { post: [50, 25, 25] } }).sliders.alignShare, 0.25);
  assert.equal(sanitizeDraft(state, { ...draft, focus: { post: [0, 0, 0] } }).focus, undefined);
});

test('fitDraftToCompute steps a remembered size down to the largest one that fits', () => {
  const state = createInitialState();
  assert.equal(recipePreview(state, recipe()).free, 9);
  assert.equal(fitDraftToCompute(state, recipe({ size: 'large' })).sliders.size, 'medium');
  assert.equal(fitDraftToCompute(state, recipe({ size: 'medium' })).sliders.size, 'medium');
  assert.equal(fitDraftToCompute(state, recipe({ size: 'small' })).sliders.size, 'small', 'never steps up');

  state.compute.servingUnits += 5; // users take 5 more units, so only 4 are free
  assert.equal(recipePreview(state, recipe()).free, 4);
  assert.equal(fitDraftToCompute(state, recipe({ size: 'medium' })).sliders.size, 'small');
});

test('fitDraftToCompute falls back to the smallest size when nothing fits, and keeps the rest of the draft', () => {
  const state = createInitialState();
  state.compute.servingUnits += 8; // 1 unit free: even the smallest model needs 2
  const draft = recipe({ size: 'medium', length: 'over', alignShare: 0.3, pre: ['filtered-data'] });
  const fitted = fitDraftToCompute(state, draft);
  assert.equal(fitted.sliders.size, 'small');
  assert.equal(fitted.sliders.length, 'over');
  assert.equal(fitted.sliders.alignShare, 0.3);
  assert.deepEqual(fitted.picks, draft.picks);
  assert.equal(recipePreview(state, fitted).fits, false);
  assert.equal(draft.sliders.size, 'medium', 'the input draft is not changed');
});

test('the Head of Research only suggests a run when the idle compute fits one', () => {
  const research = (state) => opinions(state, 'budget').find((item) => item.id === 'research').text;
  const state = createInitialState();
  assert.match(research(state), /enough to start a training run/);
  state.compute.servingUnits += 8; // 1 unit idle, the smallest run needs 2
  assert.match(research(state), /less than the smallest run needs/);
  assert.doesNotMatch(research(state), /bigger run/);
});
