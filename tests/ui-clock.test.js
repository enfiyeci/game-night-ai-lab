import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../ui/clock.js';

const fakeGame = () => {
  const state = { era: 1, day: 0, dayInRound: 0, ending: null };
  return { state, days: 0, advanceDays(n) { this.days += n; state.day += n; } };
};

const elapse = (clock, time, milliseconds, increment = 100) => {
  for (let elapsed = 0; elapsed < milliseconds; elapsed += increment) {
    time.value += Math.min(increment, milliseconds - elapsed);
    clock.step();
  }
};

test('at x1 one round of story days takes 45 real seconds', () => {
  const time = { value: 0 };
  const game = fakeGame();
  const clock = createClock(game, { now: () => time.value });
  clock.step();
  elapse(clock, time, 45_000);
  assert.equal(game.days, 91);
});

test('x4 runs four times as fast; pause stops time; reasons stack', () => {
  const time = { value: 0 };
  const game = fakeGame();
  const clock = createClock(game, { now: () => time.value });
  clock.setSpeed(4); clock.step();
  elapse(clock, time, 45_000);
  assert.equal(game.days, 364);
  clock.pause('dialog'); clock.pause('event-card');
  elapse(clock, time, 45_000);
  assert.equal(game.days, 364);
  clock.resume('dialog');
  elapse(clock, time, 10_000);
  assert.equal(game.days, 364);
  clock.resume('event-card');
  elapse(clock, time, 1_000);
  assert.ok(game.days > 364);
  assert.equal(clock.now().speed, 4);
});

test('the clock stops for good when the run ends', () => {
  const time = { value: 0 };
  const game = fakeGame();
  const clock = createClock(game, { now: () => time.value });
  clock.step();
  game.state.ending = 'acquihire';
  elapse(clock, time, 45_000);
  assert.equal(game.days, 0);
});

test('fractional days carry over between steps', () => {
  const time = { value: 0 };
  const game = fakeGame();
  const clock = createClock(game, { now: () => time.value });
  clock.step();
  elapse(clock, time, 10_000); // 10 s at 91 days / 45 s
  assert.equal(game.days, Math.floor((10 * 91) / 45));
});

test('a synchronous pause while advancing drops the rest of the days owed', () => {
  const time = { value: 0 };
  const state = { era: 1, day: 0, dayInRound: 0, ending: null };
  const game = {
    state,
    days: 0,
    advanceDays(n) {
      assert.equal(n, 1);
      this.days += n;
      state.day += n;
      if (this.days === 3) this.clock.pause('event-card');
    },
  };
  const clock = createClock(game, { now: () => time.value, secondsPerRound: 91 });
  game.clock = clock;
  clock.step();
  elapse(clock, time, 10_000, 1_000);
  assert.equal(game.days, 3);
});

test('a long stall advances no more than one second of story days', () => {
  const time = { value: 0 };
  const game = fakeGame();
  const clock = createClock(game, { now: () => time.value });
  clock.step();
  time.value += 60_000;
  clock.step();
  assert.equal(game.days, 2);
});

test('a step crossing into era 3 uses era 3 timing for remaining real time', () => {
  const time = { value: 0 };
  const state = { era: 2, day: 90, dayInRound: 90, ending: null };
  const game = {
    state,
    days: 0,
    advanceDays(n) {
      assert.equal(n, 1);
      this.days += 1;
      state.day += 1;
      if (state.era === 2) {
        state.era = 3;
        state.dayInRound = 0;
      } else state.dayInRound += 1;
    },
  };
  const clock = createClock(game, { now: () => time.value });
  clock.step();
  time.value += 1_000;
  clock.step();
  assert.equal(game.days, 1);
  assert.equal(state.era, 3);
});

test('a speed change does not rescale time already owed', () => {
  let t = 0;
  const game = { state: { era: 1, day: 0, dayInRound: 0, ending: null }, days: 0, advanceDays(n) { this.days += n; this.state.day += n; } };
  const clock = createClock(game, { now: () => t });
  clock.step();
  t = 400; clock.step(); // 400 ms at x1: less than one day (about 495 ms per day in era 1)
  clock.setSpeed(4);
  t = 401; clock.step();
  assert.equal(game.days, 0);
});
