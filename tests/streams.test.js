import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { sideRng } from '../sim/contracts.js';
import { eventsTick, EVENT_TRIGGER_SALT } from '../sim/events.js';
import { recordAdvisors, ADVISOR_SALT } from '../sim/advisors.js';

// An rng whose every method goes through one counted next(), so a test can prove the rng was consulted.
function countingRng(next) {
  const counter = { draws: 0 };
  const draw = () => { counter.draws += 1; return next(); };
  return {
    counter,
    next: draw,
    int: (min, max) => min + Math.floor(draw() * (max - min + 1)),
    chance: (p) => draw() < p,
    pick: (arr) => arr[Math.floor(draw() * arr.length)],
    normal: (mean = 0, sd = 1) => {
      const u = 1 - draw();
      const v = draw();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}

// Era 1's first round never draws from the event rng; era 2's first round does (an event trigger rolls), so the test
// states are fresh starts moved to era 2, round 4.
function era2State(seed) {
  const state = createInitialState({ seed });
  state.era = 2;
  state.turn = 4;
  state.turnInEra = 0;
  return state;
}

// One round's tick draws only once or so, and a wrong stream changes that draw's outcome for roughly one seed in five,
// so the check runs over 40 seeds: a wrong default would slip through all of them about once in 10,000.
test('event triggers default to their own per-round stream', () => {
  const tick = (base, rng) => {
    const state = structuredClone(base);
    const result = rng === undefined ? eventsTick(state) : eventsTick(state, rng);
    return { result, pendingEvents: state.pendingEvents };
  };
  let neighbourDiffers = false;
  for (let seed = 1; seed <= 40; seed += 1) {
    const base = era2State(seed);
    // Precondition: this state's tick really draws from the rng it is given.
    const salted = sideRng(base, EVENT_TRIGGER_SALT);
    const counted = countingRng(() => salted.next());
    const expected = tick(base, counted);
    assert.ok(counted.counter.draws >= 1, `seed ${seed}: eventsTick drew nothing, so the default rng would go unchecked`);
    // The default is the salted per-round stream.
    assert.deepEqual(tick(base), expected, `seed ${seed}`);
    // The comparison can fail: the neighbouring stream (salt 971) gives a different tick on some seed.
    if (JSON.stringify(tick(base, sideRng(base, EVENT_TRIGGER_SALT + 1))) !== JSON.stringify(expected)) neighbourDiffers = true;
  }
  assert.ok(neighbourDiffers, 'no seed told the salted stream apart from its neighbour, so the default check proves nothing');
});

test('advisor noise defaults to its own per-round stream', () => {
  const a = createInitialState({ seed: 7 });
  const b = structuredClone(a);
  assert.deepEqual(recordAdvisors(a), recordAdvisors(b, sideRng(b, ADVISOR_SALT)));
});

test('the round loop does not feed its rng to advisors', () => {
  const start = createInitialState({ seed: 7 });
  const one = endTurn(start, {}, createRng(1)).state;
  const two = endTurn(start, {}, createRng(2)).state;
  assert.deepEqual(one.advisorHistory.at(-1), two.advisorHistory.at(-1));
});
