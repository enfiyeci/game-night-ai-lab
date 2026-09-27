import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

test('the game allows at most two actions per round and keeps endTurn for tests', () => {
  const state = SCENARIOS.start(3);
  state.round.moves = 2;
  const g = createGame({ seed: 3, state });
  const offerId = g.state.compute.offers.find((offer) => offer.supplier === 'coreflame').id;
  assert.equal(g.movesLeft(), 0);
  assert.equal(g.addMove({ type: 'deal', offerId }).ok, false);
  const availableState = SCENARIOS.start(3);
  availableState.round.moves = 1;
  const available = createGame({ seed: 3, state: availableState });
  assert.equal(available.addMove({ type: 'deal', offerId }).ok, true);
  assert.equal(available.addMove({ type: 'deal', offerId }).ok, false);
  let seen = null;
  available.subscribe((u) => (seen = u));
  available.endTurn();
  assert.equal(available.state.turn, 1);
  assert.equal(seen.state.turn, 1);
  assert.equal(available.movesLeft(), 2);
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
  for (const seed of [1, 2, 3, 4]) {
    const s = SCENARIOS.summit(seed);
    assert.equal(s.ending, null, `seed ${seed}`);
    assert.equal(s.era, 5, `seed ${seed}`);
    assert.equal(s.turnInEra, 0, `seed ${seed}`);
    assert.equal(s.deal, null, `seed ${seed}`);
  }
  assert.deepEqual(SCENARIOS.summit(4), SCENARIOS.summit(4));
});

test('the event scenario stops on the first turn with a pending card', () => {
  const s = SCENARIOS.event(1);
  assert.ok(s.pendingEvents.length > 0);
});

test('the President scenarios stop with the requested meeting open', () => {
  for (const seed of [1, 2, 3, 4]) {
    for (const [name, meeting] of [['meeting', 'first'], ['meeting2', 'second']]) {
      const state = SCENARIOS[name](seed);
      assert.equal(state.ending, null, `${name} seed ${seed}`);
      assert.equal(state.meeting?.id, meeting, `${name} seed ${seed}`);
    }
  }
});

test('an action applies at once and the counter counts the round', () => {
  const g = createGame({ seed: 1 });
  assert.equal(g.movesLeft(), 2);
  const r = g.setBudget({ spend: 40, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } });
  assert.equal(r.ok, true);
  assert.equal(g.state.budget.spend, 40);
});

test('advancing days publishes every date and stops when the clock pauses', () => {
  const g = createGame({ seed: 1 });
  const days = [];
  g.clock = { now: () => ({ paused: days.length >= 3 }) };
  g.subscribe(({ state }) => { days.push(state.day); });
  g.advanceDays(5);
  assert.deepEqual(days, [1, 2, 3]);
  assert.equal(g.state.day, 3);
});

test('advancing several days reports every day\'s events, not only the last', () => {
  const g = createGame({ seed: 1 });
  const seen = [];
  g.subscribe((note) => seen.push(...note.events));
  const r = g.advanceDays(95); // crosses the first quarter mark
  assert.equal(g.state.turn, 1);
  assert.deepEqual(r.events, seen);
});
