import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { seat } from '../sim/board.js';
import { promiseEffects, makeBoardPromise, judgeBoardPromise } from '../sim/boardPromise.js';

test('the board reacts to a promise on a sliding scale around 75%', () => {
  assert.deepEqual(promiseEffects(0.75), { candor: 0, financier: 0, growth: 0, vote: false });
  assert.deepEqual(promiseEffects(0.85), { candor: 4, financier: 2, growth: 0, vote: false });
  assert.deepEqual(promiseEffects(1), { candor: 10, financier: 5, growth: 0, vote: false });
  assert.deepEqual(promiseEffects(1.5), promiseEffects(1));
  assert.deepEqual(promiseEffects(0.5), { candor: -10, financier: -5, growth: -5, vote: false });
  assert.deepEqual(promiseEffects(0.4), { candor: -14, financier: -7, growth: -7, vote: true });
  assert.deepEqual(promiseEffects(0), { candor: -16, financier: -8, growth: -8, vote: true });
});

test('making a promise pleases the money seats and allows only one open promise', () => {
  const s = createInitialState();
  const board = [...s.board];
  assert.deepEqual(makeBoardPromise(s, { units: 40, era: 2 }), { ok: true, units: 40, era: 2 });
  assert.equal(s.board[seat('financier')], board[seat('financier')] + 5);
  assert.equal(s.board[seat('growth')], board[seat('growth')] + 3);
  assert.deepEqual(s.boardPromise, { units: 40, era: 2, madeTurn: 0, status: 'open' });
  assert.equal(makeBoardPromise(s, { units: 50, era: 3 }).ok, false);
});

test('a promise needs whole units and an era that is still ahead', () => {
  const s = createInitialState();
  s.era = 2;
  assert.equal(makeBoardPromise(s, null).ok, false);
  assert.equal(makeBoardPromise(s, { units: 2.5, era: 3 }).ok, false);
  assert.equal(makeBoardPromise(s, { units: 0, era: 3 }).ok, false);
  assert.equal(makeBoardPromise(s, { units: 10, era: 1 }).ok, false);
  assert.equal(makeBoardPromise(s, { units: 10, era: 6 }).ok, false);
  s.turnInEra = 3;
  assert.equal(makeBoardPromise(s, { units: 10, era: 2 }).ok, false);
  assert.equal(s.boardPromise, null);
});

test('the promise is judged on the promised era\'s last turn only', () => {
  const s = createInitialState();
  makeBoardPromise(s, { units: 40, era: 2 });
  const board = [...s.board];
  s.era = 2;
  s.turnInEra = 2;
  assert.equal(judgeBoardPromise(s), null);
  s.turnInEra = 3;
  s.compute.online = 16;
  const judged = judgeBoardPromise(s);
  assert.equal(judged.ratio, 0.4);
  assert.equal(judged.vote, true);
  assert.equal(s.boardPromise.status, 'missed');
  assert.equal(s.flags.boardVoteDue, true);
  assert.equal(s.board[seat('candor')], board[seat('candor')] - 14);
  assert.equal(judgeBoardPromise(s), null);
});

test('a kept promise is marked kept', () => {
  const s = createInitialState();
  makeBoardPromise(s, { units: 40, era: 2 });
  s.era = 2;
  s.turnInEra = 3;
  s.compute.online = 50;
  assert.equal(judgeBoardPromise(s).ratio, 1.25);
  assert.equal(s.boardPromise.status, 'kept');
});

test('endTurn takes a board promise action and reports bad ones', () => {
  const ok = endTurn(createInitialState(), { boardPromise: { units: 40, era: 2 } }, createRng(3));
  assert.ok(ok.events.some((e) => e.type === 'boardPromise' && e.units === 40 && e.era === 2));
  assert.equal(ok.state.boardPromise.status, 'open');
  const bad = endTurn(createInitialState(), { boardPromise: { units: -1, era: 2 } }, createRng(3));
  assert.ok(bad.errors.includes('promise a whole number of compute units'));
  assert.equal(bad.state.boardPromise, null);
});

test('a promise missed by more than half calls a vote that is held the next turn, not the same turn', () => {
  const s = createInitialState();
  s.turnInEra = 3; // era 1's last turn; era 1 has no gate vote
  s.boardPromise = { units: 1000, era: 1, madeTurn: 0, status: 'open' };
  s.board = s.board.map(() => 10);
  s.flags.staffLetterUsed = true;
  const first = endTurn(s, {}, createRng(5));
  assert.ok(first.events.some((e) => e.type === 'boardPromiseJudged' && e.vote));
  assert.equal(first.state.ending, null);
  assert.equal(first.state.flags.boardVoteDue, true);
  const second = endTurn(first.state, {}, createRng(6));
  assert.equal(second.state.ending, 'boardRemoved');
});

test('support changes from a judged promise stay between 0 and 100', () => {
  const s = createInitialState();
  makeBoardPromise(s, { units: 40, era: 2 });
  s.era = 2;
  s.turnInEra = 3;
  s.compute.online = 0;
  s.board[seat('candor')] = 5;
  judgeBoardPromise(s);
  assert.equal(s.board[seat('candor')], 0);
});

test('on the run\'s last turn there is no next turn, so a badly missed era 5 promise is voted on at once', () => {
  const s = createInitialState();
  s.era = 5;
  s.turn = 19;
  s.turnInEra = 3;
  s.capability = 100;
  s.boardPromise = { units: 1000, era: 5, madeTurn: 16, status: 'open' };
  s.board = s.board.map(() => 10);
  s.flags.staffLetterUsed = true;
  const out = endTurn(s, {}, createRng(7));
  assert.ok(out.events.some((e) => e.type === 'boardPromiseJudged' && e.vote));
  assert.equal(out.state.ending, 'boardRemoved');
  assert.equal(out.state.flags.boardVoteDue, undefined);
});
