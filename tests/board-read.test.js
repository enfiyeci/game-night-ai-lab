import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { BALANCE } from '../sim/balance.js';
import { BOARD_MEMBERS, boardVoteThisRound, holdVote, misread, voteOrder } from '../sim/board.js';
import { boardRead } from '../sim/boardRead.js';

const at = (patch = {}) => Object.assign(createInitialState({ seed: 11 }), patch);

test('misread is a pure hash in [-4, 4], stable within a round and varying across rounds', () => {
  const state = at({ turn: 5 });
  for (let i = 0; i < 7; i += 1) {
    const value = misread(state, i);
    assert.ok(Number.isInteger(value) && value >= -4 && value <= 4);
    assert.equal(misread(state, i), value);
  }
  const perTurn = Array.from({ length: 12 }, (_, turn) => misread(at({ turn }), 0));
  assert.ok(new Set(perTurn).size > 1);
});

test('the read band contains the true support at base spread', () => {
  for (let seed = 1; seed <= 40; seed += 1) {
    const state = createInitialState({ seed });
    state.turn = seed % 7;
    state.boardLast = [...state.board];
    const read = boardRead(state);
    read.members.forEach((member, i) => {
      assert.ok(member.lo <= state.board[i] && state.board[i] <= member.hi, `${member.id} seed ${seed}`);
    });
  }
});

test('lean follows the band and the tally counts sure, maybe and against', () => {
  // 54 and 55 straddle the cut-off whatever the misread; 60 does too for the candor watchdog's wider band.
  const state = at({ board: [95, 95, 95, 5, 60, 55, 54], boardLast: [95, 95, 95, 5, 60, 55, 54] });
  const read = boardRead(state);
  assert.deepEqual(read.members.slice(0, 4).map((m) => m.lean), ['with', 'with', 'with', 'against']);
  assert.equal(read.tally.sure, 3);
  assert.equal(read.tally.against, 1);
  assert.equal(read.tally.maybe, 3);
  assert.deepEqual([read.tally.lo, read.tally.hi], [3, 6]);
});

test('movement, candor, the leak and going quiet widen the bands', () => {
  const base = at({ board: [60, 60, 60, 60, 60, 60, 60], boardLast: [60, 60, 60, 60, 60, 60, 60] });
  const width = (state, i) => { const m = boardRead(state).members[i]; return m.hi - m.lo; };
  assert.equal(width(base, 4) - width(base, 0), 2 * BALANCE.boardReadCandor);
  const moved = { ...structuredClone(base), boardLast: [50, 60, 60, 60, 60, 60, 60] };
  assert.equal(width(moved, 0) - width(base, 0), 2 * BALANCE.boardReadMoved);
  const leak = structuredClone(base);
  leak.flags.boardLeak = true;
  assert.equal(width(leak, 1) - width(base, 1), 2 * BALANCE.boardReadLeak);
  const quiet = structuredClone(base);
  quiet.flags.boardQuiet = quiet.turn;
  assert.equal(width(quiet, 1) - width(base, 1), 2 * BALANCE.boardReadQuiet);
  const pendingLeak = structuredClone(base);
  pendingLeak.pendingEvents = [{ id: 'boardLeak' }];
  assert.equal(width(pendingLeak, 1) - width(base, 1), 2 * BALANCE.boardReadLeak);
});

test('holdVote records a vote per director, the kind, the order and a count, and keeps them through the staff letter', () => {
  const state = at({ board: [70, 70, 70, 40, 40, 40, 40], staffTrust: 80 });
  holdVote(state, 'promise');
  const record = state.flags.lastBoardVote;
  assert.deepEqual(record.votes, [true, true, true, false, false, false, false]);
  assert.equal(record.votes.filter(Boolean).length, record.yes);
  assert.equal(record.kind, 'promise');
  assert.equal(record.reversedByStaff, true);
  assert.deepEqual([...record.order].sort(), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(state.flags.boardVotesHeld, 1);
  holdVote(state);
  assert.equal(state.flags.boardVotesHeld, 2);
  assert.deepEqual(state.flags.prevBoardVote.votes, record.votes);
  assert.equal(state.flags.lastBoardVote.kind, 'gate');
});

test('voteOrder puts the closest director last', () => {
  const state = at({ board: [100, 0, 90, 10, 80, 20, 56] });
  assert.equal(voteOrder(state).at(-1), 6);
});

test('boardVoteThisRound is true exactly in rounds that hold a vote', () => {
  const rng = createRng(1);
  let state = createInitialState({ seed: 1 });
  let checked = 0;
  while (!state.ending && state.turn < 20) {
    const expected = boardVoteThisRound(state);
    const votesBefore = state.flags.boardVotesHeld ?? 0;
    state = endTurn(state, {}, rng).state;
    const held = (state.flags.boardVotesHeld ?? 0) > votesBefore;
    if (held) assert.ok(expected, `vote held without forecast at turn ${state.turn}`);
    if (expected && !held) assert.ok(state.ending, 'a forecast vote round without a vote must have ended the run first');
    checked += 1;
  }
  assert.ok(checked > 4);
});

test('endTurn stores last round\'s board and snapshot', () => {
  const prev = createInitialState({ seed: 4 });
  const { state } = endTurn(prev, {}, createRng(4));
  assert.deepEqual(state.boardLast, prev.board);
  assert.equal(state.boardBefore.arr, prev.arr);
});

test('the read never draws from the main rng', () => {
  const play = (withRead) => {
    const rng = createRng(9);
    let state = createInitialState({ seed: 9 });
    const draws = [];
    while (!state.ending && state.turn < 12) {
      if (withRead) boardRead(state);
      state = endTurn(state, {}, rng).state;
      draws.push(rng.next());
    }
    return draws;
  };
  assert.deepEqual(play(true), play(false));
});
