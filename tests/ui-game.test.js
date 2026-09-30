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
  // Under plan 2C Task 8's balance, seed 1's scripted run ends in era 4, so use a seed that reaches era 5.
  // Seed 3 stopped reaching it for two reasons: the quiet-takeover roll became a running total (deterministic
  // endings A3), which shifted the main random stream so seed 3's era-4 agent release hits the misalignment check;
  // and under the compute race plan (docs/superpowers/plans/2026-09-26-compute-race.md) Task 5, seed 3's run ends
  // in era 4 anyway (race heat from rival deals). Seed 4 reaches era 5.
  const s = SCENARIOS.summit(4);
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
  // Seed 1 (run seed 3) ends in era 4 before the second meeting for two reasons: deterministic endings A3 (the
  // quiet-takeover roll became a running total, shifting the main random stream into a misalignment ending) and
  // the compute race plan (docs/superpowers/plans/2026-09-26-compute-race.md) Task 5. The second meeting uses seed 2.
  assert.equal(SCENARIOS.meeting2(2).meeting?.id, 'second');
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

test('target scenarios replay deterministically to live states across unlucky seeds', () => {
  for (const seed of [1, 2, 4, 5]) {
    for (const [name, atTarget] of [
      ['era3Queue', (state) => state.era === 3],
      ['midEra3', (state) => state.era === 3 && state.activeRun !== null],
      ['summit', (state) => state.era === 5 && state.turnInEra === 0 && !state.deal],
      ['meeting2', (state) => state.meeting?.id === 'second'],
    ]) {
      const state = SCENARIOS[name](seed);
      assert.equal(state.ending, null, `${name}, seed ${seed}`);
      assert.ok(atTarget(state), `${name}, seed ${seed}`);
      assert.ok(state.seed >= seed && state.seed < seed + 20);
      assert.deepEqual(SCENARIOS[name](seed), state);
    }
  }
});
