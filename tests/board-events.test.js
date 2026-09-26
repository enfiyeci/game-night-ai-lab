import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { seat, boardVoteThisRound } from '../sim/board.js';
import { boardRead } from '../sim/boardRead.js';
import { eventsTick, resolveEvent } from '../sim/events.js';
import { BOARD_EVENTS, pickBoardEvent } from '../sim/data/boardEvents.js';

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
  const rng = createRng(8);
  let state = createInitialState({ seed: 8 });
  while (!state.ending && state.turn < 20) {
    state = endTurn(state, {}, rng).state;
    if (state.ending) break;
    const quiet = state.flags.boardQuiet === state.turn;
    if (quiet) assert.ok(boardVoteThisRound(state));
  }
});

test('board events never draw from the main rng', () => {
  const play = () => {
    const rng = createRng(13);
    let state = createInitialState({ seed: 13 });
    while (!state.ending && state.turn < 16) state = endTurn(state, {}, rng).state;
    return [rng.next(), state.seenEvents.filter((id) => IDS.includes(id))];
  };
  assert.deepEqual(play(), play());
});
