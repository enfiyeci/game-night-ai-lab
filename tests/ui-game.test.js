import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

test('the game queues at most two moves and ends a turn through the sim', () => {
  const g = createGame({ seed: 3 });
  const offerId = g.state.compute.offers.find((offer) => offer.supplier === 'coreflame').id;
  assert.equal(g.movesLeft(), 2);
  assert.equal(g.addMove({ type: 'deal', offerId }).ok, true);
  assert.equal(g.addMove({ type: 'deal', offerId }).ok, true);
  assert.equal(g.addMove({ type: 'deal', offerId }).ok, false);
  let seen = null;
  g.subscribe((u) => (seen = u));
  g.endTurn();
  assert.equal(g.state.turn, 1);
  assert.equal(seen.state.turn, 1);
  assert.equal(g.movesLeft(), 2);
});

test('the same seed and inputs give the same state', () => {
  const a = createGame({ seed: 9 }); a.endTurn(); a.endTurn();
  const b = createGame({ seed: 9 }); b.endTurn(); b.endTurn();
  assert.deepEqual(a.state, b.state);
});

test('every scenario builds a reachable state', () => {
  for (const [name, build] of Object.entries(SCENARIOS)) {
    const s = build(1);
    assert.equal(typeof s.turn, 'number', name);
  }
  assert.ok(SCENARIOS.release(1).models.length >= 1);
});

test('midEra3 is an era-3 turn with a training run under way', () => {
  const s = SCENARIOS.midEra3(1);
  assert.equal(s.era, 3);
  assert.ok(s.activeRun);
});

test('the summit scenario stops on the opening turn of era 5', () => {
  // Under plan 2C Task 8's balance, seed 1's scripted run ends in era 4, so use a seed that reaches era 5.
  const s = SCENARIOS.summit(3);
  assert.equal(s.era, 5);
  assert.equal(s.turnInEra, 0);
  assert.equal(s.deal, null);
});

test('the event scenario stops on the first turn with a pending card', () => {
  const s = SCENARIOS.event(1);
  assert.ok(s.pendingEvents.length > 0);
});

test('the President scenarios stop with the requested meeting open', () => {
  assert.equal(SCENARIOS.meeting(1).meeting?.id, 'first');
  assert.equal(SCENARIOS.meeting2(1).meeting?.id, 'second');
});
