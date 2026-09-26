import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../ui/clock.js';

const fakeGame = () => {
  const state = { era: 1, day: 0, dayInRound: 0, ending: null };
  return { state, days: 0, advanceDays(n) { this.days += n; state.day += n; } };
};

test('at x1 one round of story days takes 45 real seconds', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.step();
  t = 45_000; clock.step();
  assert.equal(game.days, 91);
});

test('x4 runs four times as fast; pause stops time; reasons stack', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.setSpeed(4); clock.step();
  t = 45_000; clock.step();
  assert.equal(game.days, 364);
  clock.pause('dialog'); clock.pause('event-card');
  t = 90_000; clock.step();
  assert.equal(game.days, 364);
  clock.resume('dialog');
  t = 100_000; clock.step();
  assert.equal(game.days, 364);
  clock.resume('event-card');
  t = 101_000; clock.step();
  assert.ok(game.days > 364);
  assert.equal(clock.now().speed, 4);
});

test('the clock stops for good when the run ends', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.step();
  game.state.ending = 'acquihire';
  t = 45_000; clock.step();
  assert.equal(game.days, 0);
});

test('fractional days carry over between steps', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.step();
  for (let i = 1; i <= 100; i += 1) { t = i * 100; clock.step(); } // 10 s at 91 days / 45 s
  assert.equal(game.days, Math.floor((10 * 91) / 45));
});
