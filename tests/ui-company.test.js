import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inDangerZone, projectBurn, runway, updateServing } from '../sim/economy.js';
import { generateOffers, sideRng } from '../sim/contracts.js';
import { EQUITY_SHARE } from '../sim/data/compute.js';
import { createRng } from '../sim/rng.js';
import { createInitialState } from '../sim/state.js';
import { endTurn } from '../sim/turn.js';
import { researchTechnique } from '../sim/techniques.js';
import { createGame } from '../ui/game.js';
import { applyDealMove, dealCards, projectQueue, summaryItems, turnSummary } from '../ui/logic/compute.js';
import { computeAmount, money, pct } from '../ui/logic/format.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

test('deal cards describe truthful catches', () => {
  const cards = dealCards(createInitialState());
  assert.deepEqual(cards.map((card) => card.chip), [
    'No strings', 'Exclusive', 'Fragile', 'Can be taken back',
  ]);
});

test('the Azuria investment card shows credits, capacity and its visible costs', () => {
  const state = createInitialState();
  state.era = 2;
  state.compute.offers = generateOffers(state, sideRng(state, 5));
  const offer = state.compute.offers.find((candidate) => candidate.supplier === 'azuriaEquity');
  const card = dealCards(state).find((candidate) => candidate.id === offer.id);
  const rows = Object.fromEntries(card.rows);

  assert.equal(card.big, money(offer.credits));
  assert.equal(card.unit, '');
  assert.equal(card.per, `for ${pct(EQUITY_SHARE)} of your lab`);
  assert.deepEqual(Object.keys(rows), ['Arrives', 'Upfront', 'Units', 'Monthly', 'Term']);
  assert.equal(rows.Units, computeAmount(offer.units, state.era));
  assert.equal(rows.Monthly, money(offer.monthly));
  assert.match(card.explanation, /board loses some support/i);
  assert.doesNotMatch(card.rows.flat().join(' '), /Board|−3/);
});

test('deal card capacity uses the HUD unit formatter from era 4', () => {
  const state = createInitialState();
  state.era = 4;
  state.govFavor.us = 70;
  state.compute.offers = generateOffers(state, sideRng(state, 5));
  const cards = dealCards(state);
  for (const card of cards.filter((candidate) => candidate.supplier !== 'azuriaEquity')) {
    const offer = state.compute.offers.find((candidate) => candidate.id === card.id);
    assert.equal(`${card.big} ${card.unit}`, computeAmount(offer.units, state.era), card.id);
  }
  const investment = cards.find((card) => card.supplier === 'azuriaEquity');
  assert.equal(Object.fromEntries(investment.rows).Units, computeAmount(
    state.compute.offers.find((offer) => offer.id === investment.id).units,
    state.era,
  ));
});

test('runway after signing includes a future contract full monthly bill exactly once', () => {
  const state = createInitialState();
  const offer = state.compute.offers.find((candidate) => candidate.supplier === 'coreflame');
  const card = dealCards(state).find((candidate) => candidate.id === offer.id);
  const signed = structuredClone(state);
  assert.equal(applyDealMove(signed, card.move).ok, true);
  updateServing(signed);
  signed.burnPlanned = projectBurn(signed);
  const fullNet = signed.burnPlanned + offer.monthly - signed.arr / 12;
  assert.ok(Math.abs(card.runwayAfter - signed.cash / fullNet) < 1e-9);
  assert.ok(card.runwayAfter < runway(signed, 'planned'));

  const spotOffer = state.compute.offers.find((candidate) => candidate.supplier === 'spot');
  const spotCard = dealCards(state).find((candidate) => candidate.id === spotOffer.id);
  const spotSigned = structuredClone(state);
  assert.equal(applyDealMove(spotSigned, spotCard.move).ok, true);
  updateServing(spotSigned);
  spotSigned.burnPlanned = projectBurn(spotSigned);
  assert.ok(Math.abs(spotCard.runwayAfter - runway(spotSigned, 'planned')) < 1e-9);
});

test('every enabled adapter move resolves as a deal without an error', () => {
  const state = createInitialState();
  for (const card of dealCards(state)) {
    if (card.disabled) continue;
    const game = createGame({ seed: 4, state });
    assert.equal(game.addMove(card.move).ok, true, card.id);
    const result = game.endTurn();
    const event = result.events.find((candidate) => candidate.type === 'deal');
    assert.ok(event, card.id);
    assert.deepEqual(result.errors, [], card.id);
    const onlineIn = event.arrivesTurn - state.turn;
    assert.equal(
      Object.fromEntries(card.rows).Arrives,
      onlineIn === 0 ? 'now' : `in about ${onlineIn * 3} months`,
      card.id,
    );
  }
});

test('a deal card is disabled when cash cannot cover its prepayment', () => {
  const initial = createInitialState();
  const prepaid = dealCards(initial).find((card) => Object.fromEntries(card.rows).Upfront !== 'none');
  assert.ok(prepaid);
  initial.cash = 0;
  const card = dealCards(initial).find((candidate) => candidate.id === prepaid.id);
  assert.equal(card.disabled, true);
  assert.match(card.reason, /^Upfront is \$[\d.,]+[MB]; you have -?\$[\d.,]+[MB]\.$/);
});

test('queued prepayments are projected before another deal is offered', () => {
  const state = createInitialState();
  const offer = state.compute.offers.find((candidate) => candidate.supplier === 'verde');
  assert.ok(offer);
  state.cash = offer.upfront + Math.max(1, offer.monthly);
  const startingCash = state.cash;
  const first = dealCards(state).find((card) => card.name === 'Verde');
  assert.ok(first);
  assert.equal(first.disabled, false);

  const projected = projectQueue(state, { budget: state.budget, moves: [first.move] });
  const second = dealCards(projected).find((card) => card.id === first.id);
  assert.equal(second, undefined, 'a queued offer is single-use');
  assert.equal(projected.cash, startingCash - offer.upfront);
  assert.equal(state.cash, startingCash);

  const game = createGame({ seed: 4, state });
  game.addMove(first.move);
  game.addMove(first.move);
  const result = game.endTurn();
  assert.equal(result.events.filter((event) => event.type === 'deal').length, 1);
  assert.equal(result.errors.includes('the finance team is busy until Apr 2023'), true);
});

test('queued research spends points before checking the next technique', () => {
  const state = createInitialState();
  state.researchPoints = 50;
  const moves = [
    { type: 'research', techId: 'synthetic' },
    { type: 'research', techId: 'moe' },
  ];
  const projected = projectQueue(state, { budget: state.budget, moves: moves.slice(0, 1) });
  assert.equal(projected.researchPoints, 25);
  assert.equal(researchTechnique(structuredClone(projected), 'moe').ok, false);
  assert.equal(state.researchPoints, 50);

  const game = createGame({ seed: 4, state });
  moves.forEach((move) => game.addMove(move));
  const result = game.endTurn();
  assert.equal(result.events.filter((event) => event.type === 'research').length, 1);
  assert.equal(result.errors.includes('the research team is busy until Apr 2023'), true);
});

test('a queued raise is reflected in projected round availability', () => {
  const state = createInitialState();
  state.era = 2;
  const moves = [{ type: 'raise', archetype: 'vc' }];
  const projected = projectQueue(state, { budget: state.budget, moves });
  assert.equal(projected.flags.lastRoundEra, 2);
  assert.ok(projected.cash > state.cash);

  const game = createGame({ seed: 4, state });
  game.addMove(moves[0]);
  game.addMove({ type: 'raise', archetype: 'strategic' });
  const result = game.endTurn();
  assert.equal(result.events.filter((event) => event.type === 'raise').length, 1);
  assert.equal(result.errors.includes('the finance team is busy until Apr 2023'), true);
});

test('the queue projection applies new free actions before deterministic moves', () => {
  const state = createInitialState();
  const projected = projectQueue(state, {
    budget: { spend: 35, split: { training: 0.4, security: 0.2, product: 0.2, talent: 0.2 } },
    computeSplit: { safety: 0.2, resellIdle: true },
    pledge: 0.2,
    contractActions: [{ id: 'starter', action: 'scaleDown' }],
    moves: [],
  });
  assert.equal(projected.budget.spend, 35);
  assert.equal(projected.compute.split.safety, 0.2);
  assert.equal(projected.compute.split.resellIdle, true);
  assert.ok(projected.promises.some((promise) => promise.type === 'safetyCompute'));
  assert.ok(projected.compute.contracts[0].units < state.compute.contracts[0].units);
  assert.equal(state.budget.spend, 20, 'projection does not mutate the live state');
});

test('the queue projection uses sim functions for queue orders and site builds', () => {
  const queueState = createInitialState();
  queueState.era = 3;
  const queued = projectQueue(queueState, { moves: [{ type: 'queueOrder', units: 10, tier: 'standard' }] });
  assert.deepEqual(queued.compute.queue.order, { units: 10, tier: 'standard' });

  const siteState = createInitialState();
  siteState.era = 4;
  const built = projectQueue(siteState, { moves: [{ type: 'buildSite', source: 'gas' }] });
  assert.equal(built.power.sites[0].source, 'gas');
});

test('a queued deal can project the lab into the danger zone', () => {
  const state = createInitialState();
  state.cash = 300;
  const before = projectQueue(state, { budget: state.budget, moves: [] });
  assert.equal(inDangerZone(before), false);
  const verde = dealCards(before).find((card) => card.name === 'Verde');
  assert.ok(verde && !verde.disabled);

  const after = projectQueue(state, { budget: state.budget, moves: [verde.move] });
  assert.equal(inDangerZone(after), true);
});

test('turn summaries use player-facing words without guessing suppliers or showing rival gains', () => {
  const state = createInitialState();
  state.turn = 1;
  state.compute.pipeline.push({ supplier: 'azuria', arrivesTurn: 0 });
  const lines = turnSummary([
    { type: 'computeArrived', supplier: 'verde', units: 10 },
    { type: 'computeFailed', supplier: 'coreflame', units: 6 },
    { type: 'deal', offerId: 'verde-0', arrivesTurn: 4 },
    { type: 'deal', arrivesTurn: 0 },
    { type: 'spotWarning' },
    { type: 'spotPulled', units: 4 },
    { type: 'contractEnded', supplier: 'coreflame', units: 6 },
    { type: 'queueFilled', units: 10, waiting: 5 },
    { type: 'siteOnline', source: 'gas', units: 300 },
    { type: 'raise', amount: 500 },
    { type: 'research', techId: 'moe' },
    { type: 'rivalRelease', id: 'lodestar', gain: 999 },
    { type: 'eraStart', era: 2 },
    { type: 'error', error: 'not enough cash' },
    { type: 'mystery', raw: 'do not print me' },
  ], state);

  assert.deepEqual(lines, [
    "Verde's chips arrived (10 units)",
    'You signed with Verde — online from Jan 2024',
    'You signed a compute deal — online from Jan 2023',
    'Spot capacity may be pulled after next quarter',
    'Spot capacity was pulled',
    'CoreFlame contract ended',
    'Verde filled part of your order; the rest stays queued',
    'Gas turbines came online',
    'You raised $500M',
    'Your researchers cracked Mixture-of-experts',
    'Lodestar released a model',
    'Era 2 begins',
    "Couldn't do that: not enough cash",
  ]);
  assert.equal(lines.join(' ').includes('999'), false);
  assert.equal(lines.join(' ').includes('do not print me'), false);
});

test('turn summaries expose stable kind, name and figure metadata for visual treatments', () => {
  const state = createInitialState();
  const items = summaryItems([
    { type: 'computeArrived', supplier: 'verde', units: 10 },
    { type: 'raise', amount: 500 },
    { type: 'rivalRelease', id: 'lodestar', gain: 9 },
    { type: 'error', error: 'not enough cash' },
  ], state);

  assert.deepEqual(items, [
    { kind: 'compute', text: "Verde's chips arrived (10 units)", name: 'Verde', figure: '10 units' },
    { kind: 'money', text: 'You raised $500M', name: null, figure: '$500M' },
    { kind: 'rival', text: 'Lodestar released a model', name: 'Lodestar', figure: '+9 capability' },
    { kind: 'blocked', text: "Couldn't do that: not enough cash", name: null, figure: null },
  ]);
});

test('deal cards preserve offer order while leaving queue and grid offers to their screens', () => {
  const state = createInitialState();
  state.era = 3;
  state.compute.offers = [
    { id: 'verde-queue-8', supplier: 'verde', viaQueue: true },
    ...state.compute.offers,
    { id: 'grid-8', supplier: 'grid', upfront: 50, string: 'gridReservation' },
  ];
  assert.deepEqual(dealCards(state).map((card) => card.id), state.compute.offers
    .filter((offer) => !offer.viaQueue && offer.supplier !== 'grid')
    .map((offer) => offer.id));
});

test('Azuria exclusivity disables only the blocked cloud suppliers', () => {
  const state = createInitialState();
  const azuria = state.compute.offers.find((offer) => offer.supplier === 'azuria');
  const signed = endTurn(state, { moves: [{ type: 'deal', offerId: azuria.id }] }, createRng(1)).state;
  const cards = dealCards(signed);
  assert.equal(cards.find((card) => card.supplier === 'coreflame').disabled, true);
  assert.equal(cards.find((card) => card.supplier === 'verde').disabled, false);
});

test('the danger scenario reaches era 2 with emergency options open', () => {
  const state = SCENARIOS.danger(1);
  assert.ok(state.era >= 2);
  assert.equal(inDangerZone(state), true);
});

test('a queued release is projected with its cost, as the sim applies it', () => {
  const rng = createRng(1);
  let state = createInitialState({ seed: 1 });
  const run = { type: 'startRun', recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0.4 }, picks: { pre: [], mid: [], post: [] } } };
  ({ state } = endTurn(state, { moves: [run] }, rng));
  while (!state.pendingModel && state.turn < 10) ({ state } = endTurn(state, {}, rng));
  const release = { type: 'release', release: { picks: ['eval-full'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 } };
  const projected = projectQueue(state, { moves: [release] });
  const actual = endTurn(state, { moves: [release] }, createRng(5));
  assert.deepEqual(actual.errors, []);
  assert.equal(projected.pendingModel, null);
  assert.ok(projected.cash < state.cash);
});

test('a projected release never ends the projected run by itself', () => {
  const state = createInitialState();
  state.alignmentDebt = 1e6;
  state.pendingModel = {
    capability: 100,
    size: 'small',
    spec: { size: 'small', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoningCapable: false, channel: 'consumer' },
    flags: ['agentic'],
    openWeightsMx: 20,
    publicEffects: { pt: 0, st: 0, heat: 0, govUs: 0, govIntl: 0, usersMult: 1 },
    hazard: null,
    releaseDelay: 0,
  };
  const release = { type: 'release', release: { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 } };
  const projected = projectQueue(state, { moves: [release] });

  assert.equal(projected.ending, null);
  assert.equal(projected.pendingModel, null);
  assert.equal(projected.models.length, 1);
});

test('a queued acquihire ends the projected run', () => {
  const state = SCENARIOS.danger(1);
  assert.equal(projectQueue(state, { moves: [{ type: 'emergency', option: 'acquihire' }] }).ending, 'acquihire');
});

test('the turn summary reports board promises, the board\'s verdict and the staff letter', () => {
  assert.deepEqual(turnSummary([
    { type: 'boardPromise', units: 30, era: 3 },
    { type: 'boardPromiseJudged', ratio: 1.1, vote: false },
    { type: 'boardPromiseJudged', ratio: 0.6, vote: false },
    { type: 'boardPromiseJudged', ratio: 0.3, vote: true },
    { type: 'staffLetter' },
  ], createInitialState()), [
    'You promised the board 30 units by Apr 2025', // a later era is named by the clock date it ends (owner rule)
    'You kept your compute promise to the board',
    'You came up short of your compute promise to the board',
    'You missed your compute promise badly, and the board wants a vote',
    'Staff signed a letter to keep you, and the board backed down',
  ]);
});
