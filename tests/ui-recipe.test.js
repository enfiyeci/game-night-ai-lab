import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { slotsFor } from '../sim/recipe.js';
import { placeOrder, released } from '../sim/queue.js';
import { createGame } from '../ui/game.js';
import {
  budgetPreviewQueue,
  cardCostWords,
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
    post: ['synthetic-sft', 'thumbs', 'constitution', 'safety-tuning', 'rlvr-light'],
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
  const fourGroups = recipe({ post: ['synthetic-sft', 'thumbs', 'constitution', 'safety-tuning'] });

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
  const queuedRecipe = recipe({ post: ['synthetic-sft', 'thumbs', 'constitution', 'safety-tuning'] });
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
    post: ['synthetic-sft', 'thumbs', 'constitution', 'safety-tuning', 'missing-card', 'filtered-data'],
  }));
  assert.equal(slotsFor(state, 'post'), 3);
  assert.deepEqual(clean.picks.post, ['synthetic-sft', 'thumbs', 'constitution']);
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

import { CARDS } from '../sim/data/cards.js';
import { learnConstitution, setDraft } from '../sim/constitution.js';
import { SAFETY_PROPOSAL } from '../sim/data/constitution.js';
import { FakeEvent, installFakeDom } from './helpers/fakeDom.js';

const constitutionCard = CARDS.find((card) => card.id === 'constitution');

async function recipeWithConstitution() {
  const doc = installFakeDom();
  const { openRecipe } = await import('../ui/screens/recipe.js');
  const { mountConstitution } = await import('../ui/screens/constitution.js');
  const game = createGame({ state: SCENARIOS.era3Idle(1), seed: 1 });
  const overlay = doc.createElement('div');
  doc.body.append(overlay);
  mountConstitution(game, overlay);
  openRecipe(game, overlay, { stage: 3 });
  const row = () => overlay.querySelectorAll('.tech-row')
    .find((candidate) => candidate.querySelector('.tech-name')?.textContent === constitutionCard.name);
  return { game, overlay, row };
}

test('the constitution card opens a registered screen when picked', () => {
  assert.equal(constitutionCard.opens, 'constitution');
});

test('picking the constitution card opens Safety’s draft, and Adopt keeps the card picked', async () => {
  const { game, overlay, row } = await recipeWithConstitution();
  assert.ok(row(), 'the era 3 post-training stage offers the constitution card');
  row().click();
  assert.ok(overlay.querySelector('.sd-layer'), 'the draft opens');
  overlay.querySelector('.sd-adopt').click();
  assert.equal(overlay.querySelector('.sd-layer'), null);
  assert.ok(row().classList.contains('picked'));
  assert.deepEqual(game.state.constitutionDraft.hardLines, SAFETY_PROPOSAL.hardLines);
});

test('closing Safety’s draft without adopting unpicks the constitution card, by button or Escape', async () => {
  const { overlay, row } = await recipeWithConstitution();
  row().click();
  overlay.querySelector('.sd-close').click();
  assert.equal(overlay.querySelector('.sd-layer'), null);
  assert.equal(row().classList.contains('picked'), false);
  row().click();
  overlay.querySelector('.sd-layer').dispatchEvent(new FakeEvent('keydown', { key: 'Escape' }));
  assert.equal(overlay.querySelector('.sd-layer'), null);
  assert.equal(row().classList.contains('picked'), false);
});

test('the constitution card note names the draft version and the model that learned the last one', async () => {
  const { constitutionNote } = await import('../ui/screens/constitution.js');
  const state = SCENARIOS.era3Idle(1);
  assert.equal(constitutionNote(state), null, 'no chip before any draft exists');
  setDraft(state, SAFETY_PROPOSAL);
  assert.deepEqual(constitutionNote(state), { text: 'v1 draft · no model has learned it yet', later: false });
  learnConstitution(state, SAFETY_PROPOSAL);
  state.models.push({ ...state.models.at(-1), generation: 4 });
  assert.equal(constitutionNote(state).text, 'v2 draft · Kestrel 4 learned v1');
  state.constitutionDraft.changes.push({ turn: state.turn, change: { remove: 'privacy' }, source: 'investors' });
  assert.equal(constitutionNote(state).text, 'v2 draft · Kestrel 4 learned v1\n1 change since Kestrel 4');
  state.constitutionDraft.changes.push({ turn: state.turn, change: { add: 'privacy' }, source: 'users' });
  assert.equal(constitutionNote(state).text, 'v2 draft · Kestrel 4 learned v1\n2 changes since Kestrel 4');
  state.models = [];
  assert.match(constitutionNote(state).text, /^v2 draft · Kestrel learned v1/);
});
