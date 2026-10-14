import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eraGate } from '../sim/endings.js';
import {
  eraDaysLeft, leftBehindCall, raceBoardView, raceStanding, raceWarnDays, raceWarning, raceWarningStage,
} from '../ui/logic/raceWarning.js';
import { eraIntro } from '../ui/logic/eraIntro.js';
import { mountEnding } from '../ui/screens/end.js';

// Era `era`'s last round with `daysLeft` story days to its end; the lab at 44 and the rivals `behind` it (positive =
// ahead of the lab), as the pick page drew it: OpenBrain 62, DeepThink 50, the lab 44, Lodestar 32, Qilin 28.
const ROUND = { 1: 91, 2: 91, 3: 30, 4: 30, 5: 7 };
function raceAt({ era = 2, daysLeft = 42, ahead = { openbrain: 18, deepthink: 6, lodestar: -12, qilin: -16 } } = {}) {
  const state = createInitialState({ seed: 1 });
  state.era = era;
  state.turnInEra = 3;
  state.dayInRound = ROUND[era] - daysLeft;
  state.labName = 'Northwind';
  state.capability = 44;
  for (const rival of state.rivals) rival.capability = 44 + ahead[rival.id];
  return state;
}

test('the two warnings come at the same share of the last round in every era', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => raceWarnDays(era)), [
    { first: 42, second: 14 }, { first: 42, second: 14 }, { first: 14, second: 5 }, { first: 14, second: 5 }, { first: 3, second: 1 },
  ]);
  const early = raceAt({ daysLeft: 91 });
  early.turnInEra = 1;
  assert.equal(eraDaysLeft(early), 91 * 3);
});

test('Priya warns from about 6 weeks and again from about 2 weeks before the era ends, only while in danger', () => {
  assert.equal(raceWarningStage(raceAt({ daysLeft: 43 })), null);
  assert.equal(raceWarningStage(raceAt({ daysLeft: 42 })), 'first');
  assert.equal(raceWarningStage(raceAt({ daysLeft: 15 })), 'first');
  assert.equal(raceWarningStage(raceAt({ daysLeft: 14 })), 'second');
  assert.equal(raceWarningStage(raceAt({ era: 3, daysLeft: 15 })), null);
  assert.equal(raceWarningStage(raceAt({ era: 3, daysLeft: 14 })), 'first');
  assert.equal(raceWarningStage(raceAt({ era: 5, daysLeft: 1 })), 'second');
  // 2nd place is safe however far behind; so is 3rd within 12 points.
  assert.equal(raceWarningStage(raceAt({ ahead: { openbrain: 30, deepthink: -6, lodestar: -12, qilin: -16 } })), null);
  assert.equal(raceWarningStage(raceAt({ ahead: { openbrain: 12, deepthink: 6, lodestar: -12, qilin: -16 } })), null);
  // From 3 points short of the line (more than 12 behind) she warns already.
  assert.equal(raceWarningStage(raceAt({ ahead: { openbrain: 12.5, deepthink: 6, lodestar: -12, qilin: -16 } })), 'first');
  const ended = raceAt();
  ended.ending = 'leftBehind';
  assert.equal(raceWarning(ended), null);
});

test('the warning lines carry the real numbers (frames B1, B2)', () => {
  const first = raceWarning(raceAt());
  assert.equal(first.id, 'race:2:first');
  assert.equal(first.advisor, 'research');
  assert.equal(first.say, 'OpenBrain is 18 points ahead and we are third. If the era closes like this, nobody returns our calls.');
  assert.equal(first.aside, null);
  const near = raceWarning(raceAt({ ahead: { openbrain: 14, deepthink: 6, lodestar: -12, qilin: -16 } }));
  assert.equal(near.say, 'OpenBrain is 14 points ahead and we are third. More than 15 behind when the era closes, and nobody returns our calls.');
  const second = raceWarning(raceAt({ daysLeft: 14 }));
  assert.equal(second.id, 'race:2:second');
  assert.equal(second.say, 'Two weeks left in the era. We need a model out that beats theirs, or we are the lab people used to talk about.');
  assert.deepEqual(second.aside, { advisor: 'cfo', say: 'I have drafted the press release. Both versions.' });
  assert.match(raceWarning(raceAt({ era: 3, daysLeft: 5 })).say, /^Five days left in the era\./);
  assert.match(raceWarning(raceAt({ era: 5, daysLeft: 1 })).say, /^One day left in the era\./);
});

test('gaps are never rounded across the line, and agree with the sim', () => {
  const justOut = raceAt({ ahead: { openbrain: 15.3, deepthink: 6, lodestar: -12, qilin: -16 } });
  assert.deepEqual([raceStanding(justOut).out, raceStanding(justOut).shownGap, raceStanding(justOut).fromLine], [true, 16, 1]);
  assert.equal(eraGate(structuredClone(justOut)), 'leftBehind');
  const onLine = raceAt({ ahead: { openbrain: 15, deepthink: 6, lodestar: -12, qilin: -16 } });
  assert.deepEqual([raceStanding(onLine).out, raceStanding(onLine).shownGap], [false, 15]);
  assert.notEqual(eraGate(structuredClone(onLine)), 'leftBehind');
  assert.equal(raceStanding(raceAt({ ahead: { openbrain: 18, deepthink: 6, lodestar: 4, qilin: -16 } })).place, 4);
});

test('the whiteboard shows the lanes, the line 15 behind the leader and Priya\'s note (frames D1, D2)', () => {
  assert.equal(raceBoardView(raceAt({ daysLeft: 43 })), null);
  const view = raceBoardView(raceAt());
  assert.deepEqual(view.lanes.map((lane) => [lane.name, lane.score, lane.you]), [
    ['OpenBrain', 62, false], ['DeepThink', 50, false], ['Northwind', 44, true], ['Lodestar', 32, false], ['Qilin', 28, false],
  ]);
  assert.equal(view.line, 47);
  assert.equal(view.lineLabel, '15 behind OpenBrain');
  assert.equal(view.ends, 'era ends in 6 weeks!!');
  assert.equal(view.note, '3 points from the line!');
  assert.equal(raceBoardView(raceAt({ daysLeft: 14 })).ends, 'era ends in 2 weeks!!');
  assert.equal(raceBoardView(raceAt({ era: 5, daysLeft: 1 })).ends, 'era ends in 1 day!!');
  assert.equal(raceBoardView(raceAt({ ahead: { openbrain: 16, deepthink: 6, lodestar: -12, qilin: -16 } })).note, '1 point from the line!');
  assert.equal(raceBoardView(raceAt({ ahead: { openbrain: 13, deepthink: 6, lodestar: -12, qilin: -16 } })).note, 'only 2 points to spare!');
  const unnamed = raceAt();
  delete unnamed.labName;
  assert.equal(raceBoardView(unnamed).lanes[2].name, 'us');
});

test('the board\'s call names the finish; an era with no gate vote has no vote to call off (frame E-left)', () => {
  const ended = raceAt({ daysLeft: 0 });
  assert.deepEqual(leftBehindCall(ended), {
    line: 'The era is over · Northwind finished 3rd, 18 points behind OpenBrain',
    verdict: 'No vote today. The rivals moved on without you.',
  });
  assert.equal(leftBehindCall(raceAt({ era: 1, daysLeft: 0 })).verdict, 'The rivals moved on without you.');
  assert.equal(leftBehindCall(raceAt({ era: 5, daysLeft: 0 })).verdict, 'The rivals moved on without you.');
});

test('moving day states the rule precisely: the gate in every era, the vote in eras 2-4', () => {
  assert.equal(eraIntro(1).gate, 'Finish 2nd or better, or within 15 points of the leader.');
  for (const era of [2, 3, 4]) assert.equal(eraIntro(era).gate, 'Finish 2nd or better, or within 15 points of the leader, and keep the board\'s vote.');
  assert.equal(eraIntro(5).gate, 'The race ends here: finish first, or get the leading labs to agree to slow down.');
});

test('a left-behind loss with no meeting is explained before its film; after a meeting explained it, it is not', async () => {
  const run = async (meeting) => {
    const subscribers = [];
    const game = { state: createInitialState({ seed: 2 }), subscribe: (fn) => { subscribers.push(fn); return () => {}; } };
    const overlay = new EventTarget();
    overlay.querySelector = () => null;
    const order = [];
    mountEnding(game, overlay, {
      collection: { record: () => {}, entries: () => [] },
      loadFilm: async () => { order.push('film'); return { play: () => {} }; },
      explainLoss: async () => { order.push('call'); },
    });
    if (meeting) overlay.dispatchEvent(new Event('board-meeting-open'));
    game.state = { ...game.state, ending: 'leftBehind', era: meeting ? 2 : 1 };
    subscribers.forEach((fn) => fn({ state: game.state, events: [], errors: [] }));
    if (meeting) {
      overlay.dispatchEvent(new Event('left-behind-explained'));
      overlay.dispatchEvent(new Event('board-meeting-closed'));
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    return order;
  };
  assert.deepEqual(await run(false), ['call', 'film']);
  assert.deepEqual(await run(true), ['film']);
});
