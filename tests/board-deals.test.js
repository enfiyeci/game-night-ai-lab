import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { BALANCE } from '../sim/balance.js';
import { seat, boardVoteThisRound, updateBoard, boardSnapshot } from '../sim/board.js';
import { EMERGENCY_OPTIONS } from '../sim/economy.js';
import { DEALS, judgeBoardDeals, loseDirector, makeBoardDeals } from '../sim/boardDeals.js';

// Era 2's last round holds the gate vote.
const voteRound = (patch = {}) => Object.assign(createInitialState({ seed: 5 }), { era: 2, turnInEra: 3, turn: 7 }, patch);

test('the catalogue has one deal per director', () => {
  assert.deepEqual(Object.keys(DEALS).sort(), ['candor', 'financier', 'growth', 'safety', 'security', 'sovereign', 'trustee']);
});

test('making deals raises support, allows many, one per director, only in a vote round', () => {
  const state = voteRound();
  const before = [...state.board];
  assert.equal(makeBoardDeals(state, [{ member: 'security', kind: 'security' }, { member: 'trustee', kind: 'trustee' }]).ok, true);
  assert.equal(state.board[seat('security')], before[seat('security')] + BALANCE.boardDealBoost);
  assert.equal(state.boardDeals.length, 2);
  assert.equal(makeBoardDeals(voteRound(), [{ member: 'growth', kind: 'growth' }, { member: 'growth', kind: 'growth' }]).ok, false);
  assert.equal(makeBoardDeals(voteRound({ turnInEra: 1 }), [{ member: 'growth', kind: 'growth' }]).ok, false);
  assert.equal(makeBoardDeals(voteRound(), [{ member: 'nobody', kind: 'nobody' }]).ok, false);
  const lost = voteRound();
  loseDirector(lost, 'growth');
  assert.equal(makeBoardDeals(lost, [{ member: 'growth', kind: 'growth' }]).ok, false);
});

test('deals apply before that round\'s vote', () => {
  // The security hawk sits just under the line: the deal's boost carries her over it in this round's vote.
  const state = voteRound({ board: [70, 70, 70, 50, 50, 52, 30], staffTrust: 10 });
  const without = endTurn(state, {}, createRng(5)).state;
  const withDeal = endTurn(state, { boardDeals: [{ member: 'security', kind: 'security' }] }, createRng(5)).state;
  assert.equal(without.flags.lastBoardVote.votes[seat('security')], false);
  assert.equal(withDeal.flags.lastBoardVote.votes[seat('security')], true);
  assert.equal(without.ending, 'boardRemoved');
  assert.equal(withDeal.ending, null);
});

test('kept deals add support; broken deals lose the director for good and cost candor', () => {
  const state = voteRound({ turn: 9 });
  state.boardDeals = [
    { member: 'security', kind: 'security', madeTurn: 7, baseline: { arr: 0, valuation: 0, candorHits: 0 }, status: 'open' },
    { member: 'trustee', kind: 'trustee', madeTurn: 7, baseline: { arr: 0, valuation: 0, candorHits: 0 }, status: 'open' },
  ];
  state.security = 50;
  state.publicTrust = 40;
  const board = [...state.board];
  const events = judgeBoardDeals(state);
  assert.deepEqual(events.map((e) => [e.member, e.kept]), [['security', true], ['trustee', false]]);
  assert.equal(state.board[seat('security')], board[seat('security')] + BALANCE.boardDealKept);
  assert.ok(state.board[seat('trustee')] <= BALANCE.boardLostCap);
  assert.equal(state.board[seat('candor')], board[seat('candor')] - BALANCE.boardDealBrokenCandor);
  assert.deepEqual(state.boardLost, ['trustee']);
  state.board[seat('trustee')] = 90;
  updateBoard(state, boardSnapshot(state));
  assert.ok(state.board[seat('trustee')] <= BALANCE.boardLostCap, 'a lost director stays capped');
});

test('deals made this round are not judged this round', () => {
  const state = voteRound();
  makeBoardDeals(state, [{ member: 'growth', kind: 'growth' }]);
  assert.deepEqual(judgeBoardDeals(state), []);
});

test('the candor deal breaks when a candor hit lands after it was made', () => {
  const state = voteRound({ turn: 9 });
  state.flags.candorHits = 1;
  state.boardDeals = [{ member: 'candor', kind: 'candor', madeTurn: 7, baseline: { arr: 0, valuation: 0, candorHits: 0 }, status: 'open' }];
  const [event] = judgeBoardDeals(state);
  assert.equal(event.kept, false);
  assert.deepEqual(state.boardLost, ['candor']);
});

test('final judging only records outcomes', () => {
  const state = voteRound({ turn: 19 });
  state.publicTrust = 10;
  state.boardDeals = [{ member: 'trustee', kind: 'trustee', madeTurn: 15, baseline: { arr: 0, valuation: 0, candorHits: 0 }, status: 'open' }];
  const board = [...state.board];
  const [event] = judgeBoardDeals(state, { final: true });
  assert.equal(event.kept, false);
  assert.deepEqual(state.board, board);
  assert.equal(state.boardDeals[0].status, 'broken');
});

test('endTurn judges open deals at the next meeting, before its vote', () => {
  let state = voteRound({ staffTrust: 90 });
  state = endTurn(state, { boardDeals: [{ member: 'sovereign', kind: 'sovereign' }] }, createRng(2)).state;
  assert.equal(state.boardDeals[0].status, 'open');
  const rng = createRng(2);
  while (!state.ending && !boardVoteThisRound(state)) state = endTurn(state, {}, rng).state;
  if (state.ending) return;
  state = endTurn(state, {}, rng).state;
  assert.notEqual(state.boardDeals[0].status, 'open');
});

test('a deal made in the round that ends the run is never judged', () => {
  // The vote removes the player in the meeting where the deal was made: the deal never had a next meeting.
  const state = voteRound({ board: [70, 70, 70, 50, 50, 52, 30], staffTrust: 10 });
  const out = endTurn(state, { boardDeals: [{ member: 'growth', kind: 'growth' }] }, createRng(5));
  assert.equal(out.state.ending, 'boardRemoved');
  assert.equal(out.state.boardDeals[0].status, 'open');
  assert.equal(out.events.filter((e) => e.type === 'boardDealJudged').length, 0);
});

test('final judging skips deals made at or after madeBefore', () => {
  const state = voteRound({ turn: 8 });
  state.boardDeals = [
    { member: 'trustee', kind: 'trustee', madeTurn: 7, madeAtVote: 0, baseline: { arr: 0, valuation: 0, candorHits: 0 }, status: 'open' },
    { member: 'security', kind: 'security', madeTurn: 3, madeAtVote: 0, baseline: { arr: 0, valuation: 0, candorHits: 0 }, status: 'open' },
  ];
  const events = judgeBoardDeals(state, { final: true, madeBefore: 7 });
  assert.deepEqual(events.map((e) => e.member), ['security']);
  assert.equal(state.boardDeals[0].status, 'open');
});

test('final judging at the run\'s end posts one feed line per judged deal', () => {
  // Era 2, second round: no meeting this round; the money runs out with no rescue left, so the run ends.
  const state = voteRound({ turnInEra: 1, turn: 5, cash: -1000 });
  state.flags.emergencyUsed = Object.keys(EMERGENCY_OPTIONS).filter((option) => option !== 'acquihire');
  state.boardDeals = ['security', 'trustee'].map((member) => (
    { member, kind: member, madeTurn: 3, madeAtVote: 0, baseline: { arr: 0, valuation: 0, candorHits: 0 }, status: 'open' }
  ));
  const out = endTurn(state, {}, createRng(5));
  assert.equal(out.state.ending, 'acquihire');
  assert.ok(out.state.boardDeals.every((deal) => deal.status !== 'open'));
  const minutes = (s) => s.feed.filter((post) => post.handle === '@board_minutes').length;
  assert.equal(minutes(out.state) - minutes(state), 2);
});

test('deals made when the vote waits for insolvency are judged only after that vote is held', () => {
  // Review I2: the vote is due but the lab is broke, so it waits a round; the deals made for it must wait too.
  let state = Object.assign(createInitialState({ seed: 5 }), { era: 3, turnInEra: 1, turn: 9, cash: -50, staffTrust: 90 });
  state.flags.boardVoteDue = true;
  assert.equal(boardVoteThisRound(state), true);
  let out = endTurn(state, { boardDeals: [{ member: 'trustee', kind: 'trustee' }] }, createRng(5));
  state = out.state;
  assert.equal(state.ending, null);
  assert.equal(state.flags.insolvent, true);
  assert.equal(state.flags.boardVotesHeld ?? 0, 0, 'the vote waited');
  assert.equal(state.boardDeals[0].madeAtVote, 0);
  assert.equal(boardVoteThisRound(state), true);
  state.cash = 500;
  out = endTurn(state, {}, createRng(6));
  assert.equal(out.state.flags.boardVotesHeld, 1, 'the deferred vote is held this round');
  assert.equal(out.events.filter((e) => e.type === 'boardDealJudged').length, 0);
  assert.equal(out.state.boardDeals[0].status, 'open', 'judged at the next meeting, not before the vote it was made for');
});

test('an empty deal list outside a meeting is not an error', () => {
  const state = voteRound({ turnInEra: 1, turn: 5 });
  const { errors } = endTurn(state, { boardDeals: [] }, createRng(5));
  assert.ok(!errors.includes('deals are made in a board meeting'), errors.join('; '));
});
