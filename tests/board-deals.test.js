import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { BALANCE } from '../sim/balance.js';
import { seat, boardVoteThisRound, updateBoard, boardSnapshot } from '../sim/board.js';
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
  const state = voteRound({ board: [70, 70, 70, 50, 50, 52, 30], staffTrust: 10 });
  const rng = createRng(5);
  const without = endTurn(state, {}, rng).state.flags.lastBoardVote;
  const withDeal = endTurn(state, { boardDeals: [{ member: 'security', kind: 'security' }] }, createRng(5)).state.flags.lastBoardVote;
  assert.equal(withDeal.votes[seat('security')] || !without.votes[seat('security')], true);
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
