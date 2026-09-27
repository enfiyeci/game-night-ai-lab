import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { applyActions, advanceDays, endTurn } from '../sim/turn.js';
import { ROUND_DAYS, storyDate, nextRoundDay } from '../sim/time.js';

test('story dates are real calendar dates, each era starting in its real year', () => {
  assert.equal(storyDate(0).label, 'Jan 2023');
  assert.equal(storyDate(40).label, 'Feb 2023');
  assert.deepEqual([storyDate(40).y, storyDate(40).m, storyDate(40).w], [2023, 2, 2]);
  assert.equal(storyDate(363).label, 'Dec 2023');
  assert.equal(storyDate(364).label, 'Jan 2024'); // era 2 starts at its fourth quarter mark
  assert.equal(storyDate(728).label, 'Jan 2025'); // era 3: reasoning and agents
  assert.equal(storyDate(848).label, 'Jan 2026'); // era 4: the gigawatt race
  assert.equal(storyDate(847).label, 'Apr 2025');
  // Era 5 moves a week at a time, so its dates name the week.
  assert.equal(storyDate(968).label, 'Jan 2027, week 1');
  assert.equal(storyDate(975).label, 'Jan 2027, week 2');
  assert.equal(storyDate(989).label, 'Jan 2027, week 4');
  assert.equal(storyDate(996).label, 'Jan 2027, week 5'); // the final mark is a week on, so it reads differently
});

test('a round mark falls every ROUND_DAYS[era] days', () => {
  const rng = createRng(3);
  let s = createInitialState({ seed: 3 });
  s = advanceDays(s, ROUND_DAYS[1] - 1, rng).state;
  assert.equal(s.turn, 0);
  assert.equal(nextRoundDay(s), ROUND_DAYS[1]);
  s = advanceDays(s, 1, rng).state;
  assert.equal(s.turn, 1);
  assert.equal(s.dayInRound, 0);
  assert.equal(s.day, ROUND_DAYS[1]);
});

test('money moves every day, not only at the round mark', () => {
  const rng = createRng(4);
  const s0 = createInitialState({ seed: 4 });
  const s1 = advanceDays(s0, 10, rng).state;
  assert.notEqual(s1.cash, s0.cash);
  assert.equal(s1.turn, 0);
});

test('an action applies at once and counts toward the round', () => {
  const rng = createRng(5);
  const s0 = createInitialState({ seed: 5 });
  const r = applyActions(s0, { budget: { spend: 40, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } } }, rng);
  assert.equal(r.state.budget.spend, 40);
  assert.equal(r.state.round.moves, 0); // the budget is free
});

test('endTurn equals actions plus days to the next round mark', () => {
  const a = endTurn(createInitialState({ seed: 6 }), {}, createRng(6)).state;
  const rng = createRng(6);
  let b = applyActions(createInitialState({ seed: 6 }), {}, rng).state;
  b = advanceDays(b, ROUND_DAYS[1], rng).state;
  assert.equal(a.turn, b.turn);
  assert.equal(a.cash, b.cash);
  assert.equal(a.day, b.day);
});

test('a whole run still ends within 20 rounds', () => {
  const rng = createRng(7);
  let s = createInitialState({ seed: 7 });
  for (let i = 0; i < 30 && !s.ending; i += 1) s = endTurn(s, {}, rng).state;
  assert.ok(s.ending);
  assert.ok(s.turn <= 20);
});

test('a round mark several rounds ahead walks across an era change', async () => {
  const { roundMarkDay } = await import('../sim/time.js');
  const s = createInitialState({ seed: 1 });
  s.era = 2; s.turnInEra = 3; s.day = 700; s.dayInRound = 0;
  assert.equal(roundMarkDay(s, 1), 791); // the last era-2 round
  assert.equal(roundMarkDay(s, 2), 821); // then a 30-day era-3 round
});
