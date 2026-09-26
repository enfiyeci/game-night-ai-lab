// The board on the real-time engine (board port, 2026-09-26): what happens at the round mark and what applies at once.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { applyActions, advanceDays, endTurn } from '../sim/turn.js';
import { seat } from '../sim/board.js';
import { stampNewCards } from '../sim/events.js';
import { BOARD_EVENTS } from '../sim/data/boardEvents.js';
import { eraById } from '../sim/data/eras.js';
import { ROUND_DAYS, roundMarkDay } from '../sim/time.js';
import { meetingDueNow } from '../ui/logic/board.js';
import { createGame } from '../ui/game.js';
import { playerActions } from './helpers/policy.js';

test('boardLast and boardBefore are set at the round mark, never by an instant action', () => {
  const rng = createRng(4);
  const start = createInitialState({ seed: 4 });
  let s = advanceDays(start, 10, rng).state;
  const acted = applyActions(s, { boardPromise: { units: 100, era: 2 } }, rng).state; // financier +5, growth +3 at once
  assert.notDeepEqual(acted.board, s.board);
  assert.deepEqual(acted.boardLast, s.boardLast);
  assert.deepEqual(acted.boardBefore, s.boardBefore);
  s = advanceDays(acted, ROUND_DAYS[1] - acted.dayInRound, rng).state;
  assert.equal(s.turn, 1);
  // The read and L4 now compare with the round just ended: its start, before the instant promise.
  assert.deepEqual(s.boardLast, start.board);
  assert.equal(s.boardBefore.arr, start.arr);
  assert.equal(s.boardBefore.hardLines, start.constitution.hardLines.length);
  assert.equal(s.boardBefore.board, undefined);
  // The next round's updateBoard compares with the board at this mark.
  assert.deepEqual(s.roundStart.board, s.board);
});

// Era 3's vote round, one day before the mark: three seats sure, three lost, the security hawk the swing vote.
function voteRound(securitySupport) {
  const s = createInitialState({ seed: 21 });
  Object.assign(s, { era: 3, turn: 11, turnInEra: 3, day: 700, dayInRound: ROUND_DAYS[3] - 1, publicTrust: 60 });
  s.board = [95, 95, 95, 10, 10, securitySupport, 10];
  s.flags.staffLetterUsed = true; // no staff letter to reverse a lost vote
  s.roundStart = { ...s.roundStart, board: [...s.board] };
  return s;
}
const crossMark = (s, deals) => {
  const rng = createRng(21);
  const acted = deals ? applyActions(s, { boardDeals: deals }, rng).state : s;
  return advanceDays(acted, 1, rng).state;
};

test('deals made at once in the vote round count in that mark\'s vote and stay open until the next meeting', () => {
  const hawk = seat('security');
  const probe = crossMark(voteRound(50));
  const drift = probe.board[hawk] - 50; // what updateBoard does to the hawk at this mark
  const s = voteRound(52 - drift); // without a deal the hawk ends at 52 and votes to remove
  const without = crossMark(s);
  const withDeal = crossMark(s, [{ member: 'security', kind: 'security' }]);
  assert.equal(without.flags.boardVotesHeld, 1);
  assert.equal(withDeal.flags.boardVotesHeld, 1);
  assert.equal(without.flags.lastBoardVote.votes[hawk], false);
  assert.equal(withDeal.flags.lastBoardVote.votes[hawk], true, 'the deal\'s boost counted in the vote');
  assert.equal(without.flags.lastBoardVote.passed, false);
  assert.equal(withDeal.flags.lastBoardVote.passed, true);
  assert.equal(withDeal.boardDeals[0].status, 'open', 'judged at the next meeting, not this one');
});

test('deals are refused outside a round that holds a vote', () => {
  const s = createInitialState({ seed: 3 });
  const r = applyActions(s, { boardDeals: [{ member: 'growth', kind: 'growth' }] }, createRng(3));
  assert.match(r.errors[0], /board meeting/);
});

const markDays = (state) => Array.from({ length: 12 }, (_, k) => roundMarkDay(state, k + 1));

test('a board card is always due before the day its meeting opens', () => {
  for (const era of [2, 3, 4]) {
    for (const turnInEra of [2, 3]) { // the rounds after the marks ending the second and third rounds
      for (let seed = 1; seed <= 30; seed += 1) {
        const s = createInitialState({ seed });
        Object.assign(s, { era, turnInEra, turn: 4 * (era - 1) + turnInEra, day: 500 + seed, dayInRound: 0 });
        s.pendingEvents = BOARD_EVENTS.map((event) => ({ id: event.id, choices: [] }));
        stampNewCards(s);
        const voteMark = roundMarkDay(s, eraById(era).turns - turnInEra);
        for (const card of s.pendingEvents) {
          assert.ok(card.dueAt <= voteMark - 1, `${card.id} era ${era} round ${turnInEra} seed ${seed}`);
          assert.ok(card.dueAt >= card.landsAt);
        }
      }
    }
  }
});

test('the emergency-vote card is never due on a round mark, so its vote is known the day before', () => {
  for (const era of [2, 3, 4, 5]) {
    for (let seed = 1; seed <= 40; seed += 1) {
      const s = createInitialState({ seed });
      Object.assign(s, { era, turnInEra: seed % 4, turn: 4 * (era - 1) + (seed % 4), day: 400 + seed, dayInRound: 0 });
      s.pendingEvents = [{ id: 'boardRevolt', choices: [] }];
      stampNewCards(s);
      assert.equal(markDays(s).includes(s.pendingEvents[0].dueAt), false, `era ${era} seed ${seed}`);
    }
  }
});

test('in day-by-day play the meeting is due on the last day before every mark that holds a vote', () => {
  let votes = 0;
  for (let seed = 1; seed <= 5; seed += 1) {
    const rng = createRng(seed);
    let state = createInitialState({ seed });
    while (!state.ending && state.turn < 30) {
      if (state.dayInRound === 0) state = applyActions(state, playerActions(state), rng, { ignoreTeams: true }).state;
      if (state.ending) break;
      const due = meetingDueNow(state);
      const before = state.flags.boardVotesHeld ?? 0;
      state = advanceDays(state, 1, rng).state;
      const held = (state.flags.boardVotesHeld ?? 0) > before;
      if (held) {
        votes += 1;
        assert.ok(due, `vote held without the meeting, seed ${seed}, round ${state.turn}`);
      }
      if (due && !held) assert.ok(state.ending || state.flags.insolvent, `meeting without a vote, seed ${seed}, round ${state.turn}`);
    }
  }
  assert.ok(votes >= 4, `the runs reached ${votes} votes`);
});

test('the finance history gains a row at each round mark in real play', () => {
  const game = createGame({ seed: 5 });
  const cash = game.state.cash;
  game.advanceDays(30);
  assert.equal(game.financeHistory.length, 0);
  game.advanceDays(ROUND_DAYS[1] - 30);
  assert.equal(game.state.turn, 1);
  assert.equal(game.financeHistory.length, 1);
  const row = game.financeHistory[0];
  assert.equal(row.turn, 0);
  assert.equal(row.cashStart, cash);
  assert.equal(row.cashEnd, game.state.cash);
  game.advanceDays(ROUND_DAYS[1]);
  assert.equal(game.financeHistory.length, 2);
  assert.ok(Math.abs(game.financeHistory[1].cashStart - row.cashEnd) < 1e-9);
  game.endTurn(); // the debug skip crosses one mark too
  assert.equal(game.financeHistory.length, 3);
});

test('endTurn still composes instant actions and the days to the next mark for the board', () => {
  const rng = createRng(8);
  const s = endTurn(createInitialState({ seed: 8 }), {}, rng).state;
  assert.equal(s.turn, 1);
  assert.ok(Array.isArray(s.boardLast));
});
