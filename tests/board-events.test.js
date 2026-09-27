import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { seat, boardVoteThisRound } from '../sim/board.js';
import { boardRead } from '../sim/boardRead.js';
import { eventsTick, resolveEvent } from '../sim/events.js';
import { BOARD_EVENTS, pickBoardEvent } from '../sim/data/boardEvents.js';
import { BALANCE } from '../sim/balance.js';
import { playerActions } from './helpers/policy.js';

const IDS = ['boardRequest', 'boardWobble', 'boardLeak', 'boardOped', 'boardBuyer', 'boardWashington'];
const inWindow = (patch = {}) => Object.assign(createInitialState({ seed: 21 }), { era: 3, turnInEra: 1, turn: 9 }, patch);

test('six board cards, each with a kicker, watchers and a fallback', () => {
  assert.deepEqual(BOARD_EVENTS.map((e) => e.id), IDS);
  for (const event of BOARD_EVENTS) {
    assert.equal(event.kind, 'board');
    assert.equal(event.bypassCardLimit, true);
    assert.equal(event.card.kicker, 'Before the board meets');
    assert.ok(event.card.watching.length > 0);
    assert.ok(event.card.choices.some((c) => c.id === event.fallback));
    for (const choice of event.card.choices) assert.doesNotMatch(choice.cost, /\d/, `${event.id}.${choice.id} shows a number`);
  }
});

test('board cards fire only in the window of eras with a gate vote', () => {
  assert.equal(pickBoardEvent(inWindow({ turnInEra: 0 })), null);
  assert.equal(pickBoardEvent(inWindow({ turnInEra: 3 })), null);
  assert.equal(pickBoardEvent(inWindow({ era: 1 })), null);
  assert.equal(pickBoardEvent(inWindow({ era: 5 })), null);
  assert.ok(IDS.includes(pickBoardEvent(inWindow())));
  assert.ok(IDS.includes(pickBoardEvent(inWindow({ turnInEra: 2 }))));
});

test('one board card per window, each at most once per run, passing watching and kicker to the card', () => {
  const state = inWindow();
  eventsTick(state, createRng(1));
  const board = state.pendingEvents.filter((p) => IDS.includes(p.id));
  assert.equal(board.length, 1);
  assert.equal(board[0].kicker, 'Before the board meets');
  assert.ok(Array.isArray(board[0].watching));
  const again = inWindow({ seenEvents: IDS });
  assert.equal(pickBoardEvent(again), null);
});

test('board cards land even when two cards are already pending', () => {
  const state = inWindow({ pendingEvents: [{ id: 'x1', choices: [] }, { id: 'x2', choices: [] }] });
  eventsTick(state, createRng(1));
  assert.ok(state.pendingEvents.some((p) => IDS.includes(p.id)));
});

test('eligibility follows the spec', () => {
  const only = (patch) => {
    const state = inWindow(patch);
    return BOARD_EVENTS.filter((e) => e.eligible(state)).map((e) => e.id);
  };
  const s = createInitialState({ seed: 1 });
  const hi = [...s.board];
  hi[seat('candor')] = 80;
  hi[seat('growth')] = 60;
  assert.deepEqual(only({ era: 2, board: hi, publicTrust: 70 }), ['boardLeak']);
});

test('every choice leaves state valid', () => {
  for (const event of BOARD_EVENTS) {
    for (const choice of event.card.choices) {
      const state = inWindow({ publicTrust: 50 });
      state.pendingEvents = [{ id: event.id, title: event.card.title, post: event.card.post, choices: event.card.choices }];
      assert.equal(resolveEvent(state, event.id, choice.id).ok, true, `${event.id}.${choice.id}`);
      for (const value of state.board) assert.ok(value >= 0 && value <= 100);
    }
  }
});

test('the leak widens the read while pending and until the meeting if ignored', () => {
  const state = inWindow();
  state.pendingEvents = [{ id: 'boardLeak' }];
  const wide = boardRead(state).members[0];
  state.pendingEvents = [];
  const narrow = boardRead(state).members[0];
  assert.ok(wide.hi - wide.lo > narrow.hi - narrow.lo);
  const event = BOARD_EVENTS.find((e) => e.id === 'boardLeak');
  event.card.choices.find((c) => c.id === event.fallback).effects(state, []);
  assert.equal(state.flags.boardLeak, true);
});

test('the board goes quiet in a close vote round, and only then', () => {
  // Seed 2 with a player who survives to the meetings: three vote rounds, one of them close.
  const rng = createRng(2);
  let state = createInitialState({ seed: 2 });
  let voteRounds = 0;
  let quietRounds = 0;
  while (!state.ending && state.turn < 30) {
    state = endTurn(state, playerActions(state), rng).state;
    if (state.ending) break;
    const quiet = state.flags.boardQuiet === state.turn;
    if (!boardVoteThisRound(state)) {
      assert.equal(quiet, false, `quiet outside a vote round at turn ${state.turn}`);
      continue;
    }
    voteRounds += 1;
    const unquiet = structuredClone(state);
    delete unquiet.flags.boardQuiet;
    assert.equal(quiet, boardRead(unquiet).tally.sure < BALANCE.boardPassMembers, `quiet must match a close read at turn ${state.turn}`);
    if (quiet) quietRounds += 1;
  }
  assert.ok(voteRounds > 0, 'the run reached a vote round');
  assert.ok(quietRounds > 0, 'the run went quiet at least once');
});

test('board events never draw from the main rng', () => {
  // eventsTick with and without the board cards (seen already), counting main-rng calls: board events come last in
  // the tick and draw nothing, so the counts match while a board card lands in one run only.
  let landed = 0;
  for (let seed = 1; seed <= 20; seed += 1) {
    const calls = (state) => {
      const real = createRng(seed);
      let count = 0;
      const spy = new Proxy(real, { get: (target, key) => (typeof target[key] === 'function' ? (...args) => { count += 1; return target[key](...args); } : target[key]) });
      eventsTick(state, spy);
      return count;
    };
    const withBoard = Object.assign(createInitialState({ seed }), { era: 3, turnInEra: 1 + (seed % 2), turn: 9 + (seed % 2) });
    const without = structuredClone(withBoard);
    without.seenEvents = [...without.seenEvents, ...IDS];
    assert.equal(calls(withBoard), calls(without), `seed ${seed}`);
    assert.equal(without.pendingEvents.some((p) => IDS.includes(p.id)), false);
    if (withBoard.pendingEvents.some((p) => IDS.includes(p.id))) landed += 1;
  }
  assert.equal(landed, 20, 'a board card landed in every in-window run');
});

test('the cleaned-up report coming out is a candor hit', () => {
  const event = BOARD_EVENTS.find((e) => e.id === 'boardRequest');
  let leaks = 0;
  for (let seed = 1; seed <= 30; seed += 1) {
    const state = inWindow({ seed, turn: 9 + seed });
    const hits = state.flags.candorHits ?? 0;
    event.card.choices.find((c) => c.id === 'tidy').effects(state, []);
    const leaked = (state.boardLost ?? []).includes('candor');
    assert.equal(state.flags.candorHits ?? 0, hits + (leaked ? 1 : 0), `seed ${seed}`);
    if (leaked) leaks += 1;
  }
  assert.ok(leaks > 0, 'the report came out in at least one run');
});
