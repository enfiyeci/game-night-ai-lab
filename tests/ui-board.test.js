import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../sim/state.js';
import { boardSnapshot, holdVote } from '../sim/board.js';
import {
  boardView, boardWarning, countdownText, dealOptions, issuesView, meetingInfo, meetingModel, nextMeetingRows,
  resultModel, voteReveal, worryMember, worryTip,
} from '../ui/logic/board.js';
import { moodForLean, portrait } from '../ui/components/portraits.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { cardView } from '../ui/logic/events.js';

const stubClock = (days) => ({ daysUntilNextRound: () => days, now: () => ({}), pause() {}, resume() {} });
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

test('meeting info without a clock counts rounds left in months', () => {
  assert.equal(meetingInfo(era({ era: 1 })), null);
  const info = meetingInfo(era({ era: 3, turnInEra: 1 }));
  assert.equal(info.kind, 'gate');
  assert.equal(info.thisRound, false);
  assert.ok(Math.abs(info.days - 3 * 30.44) < 1);
  assert.equal(meetingInfo(era({ era: 3, turnInEra: 3 })).thisRound, true);
  const special = meetingInfo(era({ era: 1, flags: { boardVoteDue: true } }));
  assert.equal(special.kind, 'special');
});

test('meeting info with a clock counts days to the era end', () => {
  const info = meetingInfo(era({ era: 3, turnInEra: 2 }), stubClock(10));
  assert.ok(Math.abs(info.days - (10 + 30.44)) < 1);
});

test('countdown text uses months, weeks, then days', () => {
  assert.match(countdownText({ kind: 'gate', days: 90 }), /months/);
  assert.match(countdownText({ kind: 'gate', days: 21 }), /3 weeks/);
  assert.match(countdownText({ kind: 'gate', days: 6 }), /6 days/);
  assert.match(countdownText({ kind: 'special', days: 20, monthsPerRound: 1 }), /Special board meeting/);
});

test('the warning shows only near a meeting when the read is short of four', () => {
  const close = era({ era: 3, turnInEra: 3, board: [60, 60, 50, 30, 50, 50, 30] });
  close.boardLast = [...close.board];
  assert.ok(boardWarning(close));
  const safe = era({ era: 3, turnInEra: 3, board: [95, 95, 95, 95, 95, 95, 95] });
  safe.boardLast = [...safe.board];
  assert.equal(boardWarning(safe), null);
  const early = era({ era: 3, turnInEra: 1, board: close.board, boardLast: close.board });
  assert.equal(boardWarning(early), null);
  // With a clock the gate is a month away only in the vote round: 20 days plus one more month-long round is too far.
  assert.equal(boardWarning(era({ era: 3, turnInEra: 2, board: close.board, boardLast: close.board }), stubClock(20)), null);
  assert.ok(boardWarning(era({ era: 3, turnInEra: 3, board: close.board, boardLast: close.board }), stubClock(20)));
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
  const calm = era({ era: 3, board: [90, 90, 90, 90, 90, 90, 90] });
  calm.boardLast = [...calm.board];
  assert.equal(worryMember(calm), null);
  assert.equal(worryTip(calm), null);
});
