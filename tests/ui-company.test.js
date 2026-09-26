import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../sim/balance.js';
import { SUPPLIERS } from '../sim/compute.js';
import { inDangerZone } from '../sim/economy.js';
import { createInitialState } from '../sim/state.js';
import { createGame } from '../ui/game.js';
import { dealCards, turnSummary } from '../ui/logic/compute.js';
import { money } from '../ui/logic/format.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

test('deal cards preserve supplier order, moves, catches and sim pricing', () => {
  const cards = dealCards(createInitialState());
  assert.deepEqual(cards.map((card) => card.id), SUPPLIERS.map((supplier) => supplier.id));
  assert.deepEqual(cards.map((card) => card.move), SUPPLIERS.map((supplier) => ({
    type: 'deal', supplierId: supplier.id,
  })));
  assert.deepEqual(cards.map((card) => card.chip), [
    'No strings', 'Exclusive', 'Fragile', 'Costs goodwill',
  ]);

  for (const [index, supplier] of SUPPLIERS.entries()) {
    const monthly = supplier.units * supplier.costMult * BALANCE.unitMonthlyCost;
    const upfront = monthly * supplier.prepayMonths;
    const rows = Object.fromEntries(cards[index].rows);
    assert.equal(rows.Monthly, money(monthly));
    assert.equal(rows.Upfront, upfront === 0 ? 'none' : money(upfront));
  }
});

test('every enabled deal card queues a deal event through the game', () => {
  for (const card of dealCards(createInitialState())) {
    if (card.disabled) continue;
    const game = createGame({ seed: 4 });
    assert.equal(game.addMove(card.move).ok, true, card.id);
    const result = game.endTurn();
    assert.equal(result.events.some((event) => event.type === 'deal'), true, card.id);
  }
});

test('a deal card is disabled when cash cannot cover its prepayment', () => {
  const state = createInitialState();
  state.cash = 1;
  const verde = dealCards(state).find((card) => card.id === 'verde');
  assert.equal(verde.disabled, true);
  assert.equal(verde.reason, 'Not enough cash for the prepayment');
});

test('turn summaries use player-facing words and skip unknown and hidden rival gains', () => {
  const state = createInitialState();
  const lines = turnSummary([
    { type: 'computeArrived', supplier: 'verde', units: 10 },
    { type: 'computeFailed', supplier: 'coreflame', units: 6 },
    { type: 'deal', supplier: 'verde', arrivesTurn: 4 },
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
    'You signed with Verde — chips arrive on turn 4',
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
