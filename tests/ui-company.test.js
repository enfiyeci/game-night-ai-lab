import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inDangerZone } from '../sim/economy.js';
import { createRng } from '../sim/rng.js';
import { createInitialState } from '../sim/state.js';
import { endTurn } from '../sim/turn.js';
import { researchTechnique } from '../sim/techniques.js';
import { createGame } from '../ui/game.js';
import { dealCards, projectQueue, turnSummary } from '../ui/logic/compute.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

test('deal cards describe truthful catches', () => {
  const cards = dealCards(createInitialState());
  assert.deepEqual(cards.map((card) => card.chip), [
    'No strings', 'Pricier', 'Fragile', 'Costs goodwill',
  ]);
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
    const onlineIn = event.arrivesTurn + 1 - state.turn;
    assert.equal(
      Object.fromEntries(card.rows).Arrives,
      onlineIn === 1 ? 'next turn' : `in ${onlineIn} turns`,
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
  assert.equal(card.reason, 'Not enough cash for the prepayment');
});

test('queued prepayments are projected before another deal is offered', () => {
  const state = createInitialState();
  state.cash = 80;
  const first = dealCards(state).find((card) => card.name === 'Verde');
  assert.ok(first);

  const projected = projectQueue(state, { budget: state.budget, moves: [first.move] });
  const second = dealCards(projected).find((card) => card.id === first.id);
  assert.equal(second.disabled, true);
  assert.equal(second.reason, 'Not enough cash for the prepayment');
  assert.equal(state.cash, 80);

  const game = createGame({ seed: 4, state });
  game.addMove(first.move);
  game.addMove(second.move);
  const result = game.endTurn();
  assert.equal(result.events.filter((event) => event.type === 'deal').length, 1);
  assert.equal(result.errors.includes('not enough cash for the prepayment'), true);
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
  assert.equal(result.errors.includes('not enough research points'), true);
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
  assert.equal(result.errors.includes('already raised a round this era'), true);
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
    { type: 'deal', supplier: 'verde', arrivesTurn: 4 },
    { type: 'deal', arrivesTurn: 0 },
    { type: 'raise', amount: 500 },
    { type: 'research', techId: 'moe' },
    { type: 'rivalRelease', id: 'lodestar', gain: 999 },
    { type: 'eraStart', era: 2 },
    { type: 'error', error: 'not enough cash' },
    { type: 'mystery', raw: 'do not print me' },
  ], state);

  assert.deepEqual(lines, [
    "Verde's chips arrived (10 units)",
    'CoreFlame went under — 6 units lost',
    'You signed with Verde — online from turn 5',
    'You signed a compute deal — the compute is already online',
    'You raised $500M',
    'Your researchers cracked Mixture-of-experts',
    'Lodestar released a model',
    'Era 2 begins',
    "Couldn't do that: not enough cash",
  ]);
  assert.equal(lines.join(' ').includes('999'), false);
  assert.equal(lines.join(' ').includes('do not print me'), false);
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

test('a queued acquihire ends the projected run', () => {
  const state = SCENARIOS.danger(1);
  assert.equal(projectQueue(state, { moves: [{ type: 'emergency', option: 'acquihire' }] }).ending, 'acquihire');
});
