import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { enableScenarios, scenarioTick } from '../sim/scenarios.js';
import { clockSeconds, eraStartDay, ROUND_DAYS } from '../sim/time.js';
import { CROWD_MAX, CROWD_WINDOW_S, QUIET_S, RELAX_S, PRESIDENT_MAX_WAIT, canLand, ledger, noteBeat, noteStop, plannedSetPieces, presidentMayCall, quietFor } from '../sim/pacing.js';
import { STRATEGIES, eventChoices, dailyRelease } from '../tools/balance.js';
import { playRound } from '../tools/play-round.js';

// A state on story day `day` of era `era`, round `turnInEra`, with nothing recorded yet.
function at(era, turnInEra, dayInRound, seed = 1) {
  const state = enableScenarios(createInitialState({ seed }));
  state.era = era;
  state.turnInEra = turnInEra;
  state.dayInRound = dayInRound;
  state.turn = 4 * (era - 1) + turnInEra;
  state.day = eraStartDay(era) + turnInEra * ROUND_DAYS[era] + dayInRound;
  return state;
}
const moveTo = (state, day) => { state.dayInRound += day - state.day; state.day = day; return state; };

test('running clock: 90 s per round in every era, eras back to back', () => {
  assert.equal(clockSeconds(0), 0);
  assert.equal(clockSeconds(91), 90);
  assert.equal(clockSeconds(eraStartDay(2)), 360);
  assert.equal(clockSeconds(eraStartDay(3)), 720);
  assert.equal(clockSeconds(eraStartDay(3) + 30), 810);
  assert.equal(clockSeconds(eraStartDay(5) + 7), 4 * 360 + 90);
});

test('the targets match the picked option: two stops per 30 s, a 30 s relax, a 90 s quiet backstop', () => {
  assert.equal(CROWD_MAX, 2);
  assert.equal(CROWD_WINDOW_S, 30);
  assert.equal(RELAX_S, 30);
  assert.equal(QUIET_S, 90);
});

test('one stop per story day', () => {
  const state = at(3, 1, 5);
  assert.equal(canLand(state), true);
  noteStop(state, 'card');
  assert.equal(canLand(state), false);
  moveTo(state, state.day + 1);
  assert.equal(canLand(state), true);
});

test('at most two stops in any 30 s of clock (era 3: 3 s a day)', () => {
  const state = at(3, 1, 5);
  noteStop(state, 'card');
  moveTo(state, state.day + 1);
  noteStop(state, 'hazard');
  moveTo(state, state.day + 1);
  assert.equal(canLand(state), false, 'a third stop 6 s after the first');
  moveTo(state, state.day + 7); // 27 s after the first: still inside its window
  assert.equal(canLand(state), false);
  moveTo(state, state.day + 1); // 30 s after the first, 27 s after the second: two in that window with this one
  assert.equal(canLand(state), true);
});

test('cards wait 30 s of clock after a set piece; the cash warning and the President do not', () => {
  const state = at(3, 1, 5);
  noteStop(state, 'president', { setPiece: true });
  moveTo(state, state.day + 9); // 27 s
  assert.equal(canLand(state), false);
  assert.equal(canLand(state, { relax: false }), true);
  moveTo(state, state.day + 1); // 30 s
  assert.equal(canLand(state), true);
});

test('predicted set pieces count: the board meeting and the era change at the end of era 2', () => {
  const state = at(2, 3, 50); // a vote round: the meeting is the day before the mark, the era changes at the mark
  const mark = eraStartDay(3);
  const kinds = plannedSetPieces(state).map((piece) => `${piece.kind}@${piece.day}`);
  assert.ok(kinds.includes(`boardMeeting@${mark - 1}`), kinds.join());
  assert.ok(kinds.includes(`eraTransition@${mark}`), kinds.join());
  moveTo(state, mark - 20); // 20 s before the meeting: three stops inside 30 s
  assert.equal(canLand(state), false);
  moveTo(state, mark - 40);
  assert.equal(canLand(state), true);
  moveTo(state, mark - 1);
  assert.equal(canLand(state, { relax: false }), false, 'never on a set piece day');
});

test('the President waits while another stop is on his day, at most three days', () => {
  const state = at(2, 1, 0);
  const due = state.day;
  assert.equal(presidentMayCall(state, due), true);
  noteStop(state, 'hazard');
  assert.equal(presidentMayCall(state, due), false);
  moveTo(state, state.day + 1);
  assert.equal(presidentMayCall(state, due), true);
  noteStop(state, 'card');
  assert.equal(presidentMayCall(state, due), false);
  moveTo(state, due + PRESIDENT_MAX_WAIT);
  noteStop(state, 'card');
  assert.equal(presidentMayCall(state, due), true, 'three days late: he calls whatever else is on');
});

test('quiet counts from the last stop, decision or payoff', () => {
  const state = at(1, 1, 10);
  noteBeat(state);
  moveTo(state, state.day + 60);
  assert.ok(Math.abs(quietFor(state) - (60 * 90) / 91) < 1e-9);
  noteStop(state, 'card');
  assert.equal(quietFor(state), 0);
});

// The bots' games, with the director's ledger read every story day.
function playLogged(name, seed) {
  const rng = createRng(seed);
  let state = enableScenarios(createInitialState({ seed }));
  const stops = new Map();
  const record = (s) => { for (const stop of s.pacing?.stops ?? []) stops.set(`${stop.day}:${stop.kind}`, stop); };
  const style = ['careful', 'carefulNoGrid'].includes(name) ? 'careful' : 'balanced';
  for (let i = 0; i < 30 && !state.ending; i += 1) {
    const result = playRound(state, STRATEGIES[name](state, rng), rng, (current) => eventChoices(current, style, rng),
      { dailyActions: (current) => { record(current); return dailyRelease(name, current); } });
    state = result.state;
    record(state);
  }
  return { state, stops: [...stops.values()].sort((a, b) => a.day - b.day) };
}

test('in bot games no movable stop shares a day with another stop', { timeout: 300000 }, () => {
  for (const [name, seed] of [['careful', 1], ['careful', 2], ['balanced', 3]]) {
    const { stops } = playLogged(name, seed);
    assert.ok(stops.length > 20, `${name} ${seed}: ${stops.length} stops`);
    const byDay = Map.groupBy(stops, (stop) => stop.day);
    for (const [day, list] of byDay) {
      if (list.length < 2) continue;
      // Fixed beats may share a day (the era change and a board meeting never do; a hazard at the mark may); a card or
      // a cash pause the director placed never joins them, unless its deadline left it no later day.
      const placed = list.filter((stop) => stop.movable && !stop.forced);
      assert.equal(placed.length, 0, `${name} ${seed} day ${day}: ${list.map((s) => s.kind).join('+')}`);
    }
    assert.ok(!stops.some((stop) => stop.kind === 'cash' && byDay.get(stop.day).some((s) => s.kind === 'eraTransition')),
      'the cash warning folds into the era recap instead of pausing on moving day');
  }
});

test('quiet backstop: after 90 s with nothing, the era\'s next scenario card comes today', () => {
  const state = at(3, 1, 2, 7);
  state.cash = 10000;
  state.capability = 100;
  state.models = ['consumer', 'agentic'].map((channel) => ({ active: true, capability: 100, users: 10000000, channel, flags: ['scraped'] }));
  state.pendingModel = { capability: 100, flags: ['scraped'] };
  scenarioTick(state); // builds the era's schedule
  state.pendingEvents = [];
  const director = state.scenarioDirector;
  director.slots[director.index] = state.day + 25; // the next card is far off
  director.nextAttempt = 0;
  ledger(state).lastBeat = state.day - 29; // 87 s ago in era 3
  assert.deepEqual(scenarioTick(state), [], 'not yet quiet for 90 s');
  moveTo(state, state.day + 1); // 90 s
  const landed = scenarioTick(state);
  assert.equal(landed.length, 1, 'the card came early');
  assert.equal(state.pendingEvents[0].landsAt, state.day);
});

test('on moving day the cash warning is the era recap\'s last word, from the CFO', async () => {
  const { recapModel } = await import('../ui/logic/recap.js');
  const { projectBurn } = await import('../sim/economy.js');
  const state = at(2, 0, 0);
  state.cash = projectBurn(state) * 2;
  const plain = recapModel(state, 1);
  assert.notEqual(plain.critics.at(-1).role, 'cfo');
  ledger(state).cash.folded = { day: state.day, level: 'urgent' };
  const folded = recapModel(state, 1);
  assert.equal(folded.critics.length, plain.critics.length);
  assert.equal(folded.critics.at(-1).role, 'cfo');
  assert.match(folded.critics.at(-1).text, /cash lasts about 2 months/);
});

test('a cash warning that turns urgent on moving day after the recap waits for the next day instead of folding', async () => {
  const { SCENARIOS } = await import('../ui/logic/scenarios.js');
  const { advanceDays, applyActions } = await import('../sim/turn.js');
  const { projectBurn, monthlyRevenue } = await import('../sim/economy.js');
  const rng = createRng(1);
  const net = (s) => projectBurn(s) - monthlyRevenue(s);
  let state = SCENARIOS.beforeEra2(1);
  state.cash = net(state) * 5; // a "watch" warning: no pause
  state.pacing.cash = { checkpoint: 0, pause: null, folded: null, waitingSince: null };
  state.pacing.stops = []; // the scenario's own earlier pause would crowd the next 30 s
  state = advanceDays(state, 1, rng).state;
  assert.equal(state.era, 2);
  assert.equal(state.pacing.cash.folded, null);
  state.cash = net(state) * 2; // urgent, after the era recap was printed
  state = applyActions(state, {}, rng).state;
  assert.equal(state.pacing.cash.folded, null, 'not folded into a recap already on screen');
  assert.equal(state.pacing.cash.pause, null, 'not a second stop on moving day');
  state = advanceDays(state, 1, rng).state;
  assert.deepEqual(state.pacing.cash.pause, { day: state.day, level: 'urgent' });
});
