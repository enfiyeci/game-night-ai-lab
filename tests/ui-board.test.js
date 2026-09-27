import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../sim/state.js';
import { boardSnapshot, holdVote } from '../sim/board.js';
import { ROUND_DAYS } from '../sim/time.js';
import {
  boardView, boardWarning, countdownText, dealOptions, issuesView, meetingDueNow, meetingInfo, meetingModel, nextMeetingRows,
  resultModel, voteReveal, worryMember, worryTip,
} from '../ui/logic/board.js';
import { moodForLean, portrait } from '../ui/components/portraits.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { cardView } from '../ui/logic/events.js';
import { learnConstitution } from '../sim/constitution.js';
import { SAFETY_PROPOSAL } from '../sim/data/constitution.js';

const era = (patch) => Object.assign(createInitialState({ seed: 2 }), patch);

test('board copy never uses time-step words', () => {
  const text = readFileSync(new URL('../ui/data/boardCopy.js', import.meta.url), 'utf8');
  assert.doesNotMatch(text.replace(/^\s*\/\/.*$/gm, '').replaceAll('What moves the board', ''), /\b(turns?|moves?|rounds?)\b/i);
});

test('portraits draw every director and moods map from leans', () => {
  for (const id of ['growth', 'financier', 'sovereign', 'safety', 'candor', 'security', 'trustee', 'ceo']) assert.match(portrait(id), /^<svg/);
  assert.equal(moodForLean('with'), 'happy');
  assert.equal(moodForLean('against'), 'cross');
});

test('meeting info counts story days to the mark that holds the meeting, from the state', () => {
  assert.equal(meetingInfo(era({ era: 1 })), null);
  const info = meetingInfo(era({ era: 3, turnInEra: 1 }));
  assert.equal(info.kind, 'gate');
  assert.equal(info.thisRound, false);
  assert.equal(info.days, 3 * ROUND_DAYS[3]);
  assert.equal(meetingInfo(era({ era: 3, turnInEra: 3 })).thisRound, true);
  assert.equal(meetingInfo(era({ era: 3, turnInEra: 2, day: 10, dayInRound: 10 })).days, 20 + ROUND_DAYS[3]);
  assert.equal(meetingInfo(era({ era: 2, turnInEra: 3, day: 60, dayInRound: 60 })).days, ROUND_DAYS[2] - 60);
  const special = meetingInfo(era({ era: 1, day: 30, dayInRound: 30, flags: { boardVoteDue: true } }));
  assert.equal(special.kind, 'special');
  assert.equal(special.days, ROUND_DAYS[1] - 30);
  assert.equal(special.word, 'quarter');
});

test('countdown text uses months, weeks, then days', () => {
  assert.match(countdownText({ kind: 'gate', days: 90 }), /months/);
  assert.match(countdownText({ kind: 'gate', days: 21 }), /3 weeks/);
  assert.match(countdownText({ kind: 'gate', days: 6 }), /6 days/);
  assert.match(countdownText({ kind: 'special', days: 20, word: 'month' }), /Special board meeting at the end of the month/);
});

test('the warning shows only near a meeting (31 story days) when the read is short of four', () => {
  const close = era({ era: 3, turnInEra: 3, board: [60, 60, 50, 30, 50, 50, 30] });
  close.boardLast = [...close.board];
  assert.ok(boardWarning(close));
  const safe = era({ era: 3, turnInEra: 3, board: [95, 95, 95, 95, 95, 95, 95] });
  safe.boardLast = [...safe.board];
  assert.equal(boardWarning(safe), null);
  const early = era({ era: 3, turnInEra: 1, board: close.board, boardLast: close.board });
  assert.equal(boardWarning(early), null);
  // 20 days plus one more month-long round is too far; 20 days in the vote round is near.
  assert.equal(boardWarning(era({ era: 3, turnInEra: 2, day: 10, dayInRound: 10, board: close.board, boardLast: close.board })), null);
  assert.ok(boardWarning(era({ era: 3, turnInEra: 3, day: 10, dayInRound: 10, board: close.board, boardLast: close.board })));
  // Era 2's vote round is a quarter: the warning waits until the last month of it.
  assert.equal(boardWarning(era({ era: 2, turnInEra: 3, day: 59, dayInRound: 59, board: close.board, boardLast: close.board })), null);
  assert.ok(boardWarning(era({ era: 2, turnInEra: 3, day: 60, dayInRound: 60, board: close.board, boardLast: close.board })));
});

test('the meeting is due exactly on the last story day before a mark that holds a vote', () => {
  const lastDay = ROUND_DAYS[3] - 1;
  assert.equal(meetingDueNow(era({ era: 3, turnInEra: 3, day: lastDay, dayInRound: lastDay })), true);
  assert.equal(meetingDueNow(era({ era: 3, turnInEra: 3, day: lastDay - 1, dayInRound: lastDay - 1 })), false);
  assert.equal(meetingDueNow(era({ era: 3, turnInEra: 2, day: lastDay, dayInRound: lastDay })), false, 'no vote at this mark');
  assert.equal(meetingDueNow(era({ era: 1, day: ROUND_DAYS[1] - 1, dayInRound: ROUND_DAYS[1] - 1, flags: { boardVoteDue: 'emergency' } })), true);
  assert.equal(meetingDueNow(era({ era: 3, turnInEra: 3, day: lastDay, dayInRound: lastDay, ending: 'misuse' })), false);
});

test('board view and meeting strings carry no support numbers', () => {
  const state = SCENARIOS.boardVote(4);
  const strings = [];
  const walk = (value, key = '') => {
    if (['lo', 'hi', 'deals'].includes(key)) return; // deal texts name visible targets (spec 5.2), not support
    if (typeof value === 'string') strings.push(value);
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, k);
  };
  walk(boardView(state));
  walk(nextMeetingRows(state));
  walk(meetingModel(state));
  walk(issuesView(state));
  for (const text of strings) assert.doesNotMatch(text, /\b([89]|\d{2,})\b/, text);
});

test('issues read from last round\'s snapshot', () => {
  const state = era({ era: 2, arr: 200 });
  state.boardBefore = { ...boardSnapshot(state), arr: 100 };
  const revenue = issuesView(state).find((issue) => issue.id === 'revenue');
  assert.equal(revenue.state, 'up');
  assert.equal(issuesView(state).length, 10);
});

test('before any model learns a constitution, the board does not speak of one as intact', () => {
  const state = era({ era: 2 });
  const issue = () => issuesView(state).find((entry) => entry.id === 'constitution');
  const trustee = () => boardView(state).members.find((member) => member.id === 'trustee').wants;
  assert.equal(issue().say, 'None yet');
  assert.doesNotMatch(trustee(), /constitution/i);
  learnConstitution(state, { hardLines: [...SAFETY_PROPOSAL.hardLines], rulings: SAFETY_PROPOSAL.rulings });
  assert.equal(issue().say, 'Intact');
  assert.equal(trustee(), 'Public trust, the constitution intact');
});

test('the vote reveal comes from the sim record, in the sim order', () => {
  const before = era({ era: 2, board: [70, 70, 70, 40, 40, 40, 60] });
  const after = structuredClone(before);
  holdVote(after, 'gate');
  const reveal = voteReveal(before, after);
  assert.equal(reveal.order.length, 7);
  assert.equal(reveal.yes, 4);
  assert.equal(reveal.votes.growth, 'keep');
  assert.equal(voteReveal(after, after), null);
  const result = resultModel(after);
  assert.deepEqual([result.yes, result.no, result.passed], [4, 3, true]);
});

test('deal options list all seven directors', () => {
  assert.equal(dealOptions(SCENARIOS.boardVote(4)).length, 7);
});

test('board cards carry kicker and watching into the card view', () => {
  const view = cardView({ id: 'boardLeak', title: 't', post: { handle: '@x', text: 'y' }, choices: [], kicker: 'Before the board meets', watching: ['growth'] });
  assert.equal(view.kicker, 'Before the board meets');
  assert.deepEqual(view.watching, ['growth']);
});

test('the boardVote scenario is in a vote round', () => {
  const state = SCENARIOS.boardVote(4);
  assert.ok(!state.ending);
  assert.ok(meetingInfo(state).thisRound);
});

test('the worry tip names the director worryMember picks, so the map can highlight them', () => {
  const state = era({ era: 3, turnInEra: 1, arr: 100, board: [52, 70, 70, 70, 70, 70, 70] });
  state.boardLast = [...state.board];
  state.boardBefore = { ...boardSnapshot(state), arr: 200 }; // revenue fell, and the growth investor leans away
  const id = worryMember(state);
  assert.equal(id, 'growth');
  assert.match(worryTip(state), /^Growth investor: Revenue/);
  assert.match(worryTip(state), /and he is leaning away\. .* without him\.$/);
  const calm = era({ era: 3, board: [90, 90, 90, 90, 90, 90, 90] });
  calm.boardLast = [...calm.board];
  assert.equal(worryMember(calm), null);
  assert.equal(worryTip(calm), null);
});

test('a lost vote\'s why line does not read like a win', () => {
  const state = createInitialState({ seed: 2 });
  state.board = [70, 70, 70, 30, 30, 30, 30];
  state.flags.staffLetterUsed = true;
  holdVote(state, 'gate');
  const result = resultModel(state);
  assert.equal(result.passed, false);
  assert.doesNotMatch(result.why, /kept you\.$/);
  assert.match(result.why, /not enough/i);
});

test('the meeting reads its own round end: a vote, an ending, a vote put off, or not its notification', async () => {
  const { roundOutcome } = await import('../ui/screens/boardMeeting.js');
  const before = createInitialState({ seed: 2 });
  const same = structuredClone(before);
  assert.equal(roundOutcome(before, same), 'wait');
  const voted = structuredClone(before);
  voted.turn += 1;
  holdVote(voted, 'gate');
  assert.equal(roundOutcome(before, voted), 'reveal');
  const ended = { ...structuredClone(before), turn: before.turn + 1, ending: 'leftBehind' };
  assert.equal(roundOutcome(before, ended), 'ending');
  const sameTurnEnding = { ...structuredClone(before), ending: 'acquihire' };
  assert.equal(roundOutcome(before, sameTurnEnding), 'ending');
  const putOff = { ...structuredClone(before), turn: before.turn + 1 };
  assert.equal(roundOutcome(before, putOff), 'deferred');
});
