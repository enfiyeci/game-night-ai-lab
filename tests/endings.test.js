import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { updateBoard, boardVote } from '../sim/board.js';
import { checkTurnEndings, eraGate, finalEnding, ENDINGS } from '../sim/endings.js';

const yes = { chance: () => true };
const no = { chance: () => false };

test('running out of cash grants one turn of emergency grace', () => {
  const s = createInitialState();
  s.cash = -1;
  assert.equal(checkTurnEndings(s, no), null);
  assert.equal(s.flags.insolvent, true);
  assert.equal(checkTurnEndings(s, no), 'acquihire');
});

test('insolvency ends immediately without unused rescue options and clears after recovery', () => {
  const s = createInitialState();
  s.cash = -1;
  s.flags.emergencyUsed = ['equityForCompute', 'structureChange', 'bridgeRound'];
  assert.equal(checkTurnEndings(s, no), 'acquihire');

  const recovered = createInitialState();
  recovered.flags.insolvent = true;
  assert.equal(checkTurnEndings(recovered, no), null);
  assert.equal(recovered.flags.insolvent, undefined);
});

test('misuse needs capability past the danger line and high exposure', () => {
  const s = createInitialState();
  s.capability = 60;
  s.misuseLocked = 75;
  assert.equal(checkTurnEndings(s, no), null);
  assert.equal(checkTurnEndings(s, yes), 'misuse');
});

test('race heat can end the world through a rival', () => {
  const s = createInitialState();
  s.raceHeat = 90;
  assert.equal(checkTurnEndings(s, yes), 'rivalDisaster');
});

test('era gate: left behind, then board vote', () => {
  const s = createInitialState();
  s.rivals.forEach((r) => (r.capability = 50));
  assert.equal(eraGate(s), 'leftBehind');
  const t = createInitialState();
  t.era = 2;
  t.board = [40, 40, 40, 60, 60];
  assert.equal(boardVote(t).passed, false);
  assert.equal(eraGate(t), 'boardRemoved');
});

test('board reacts to growth, capability, trust and cash', () => {
  const s = createInitialState();
  s.arr = 100;
  s.capability = 30;
  s.publicTrust = 75;
  updateBoard(s, { arr: 0, capability: 20, cash: 1000 });
  assert.deepEqual(s.board, [73, 63, 67, 56, 79]);
});

test('final endings', () => {
  const s = createInitialState();
  assert.equal(finalEnding(s), 'aligned');
  const t = createInitialState();
  t.alignmentDebt = 60;
  assert.equal(finalEnding(t), 'pyrrhic');
  const u = createInitialState();
  u.flags.pacingDeal = true;
  assert.equal(finalEnding(u), 'pacingDeal');
  for (const id of ['acquihire', 'boardRemoved', 'misalignment', 'misuse', 'leftBehind', 'rivalDisaster', 'aligned', 'pacingDeal', 'pyrrhic']) {
    assert.ok(ENDINGS[id], id);
  }
});
