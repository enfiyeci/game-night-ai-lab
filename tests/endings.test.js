import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { updateBoard, boardVote, boardSnapshot, STAFF_LETTER_TRUST } from '../sim/board.js';
import { checkTurnEndings, eraGate, finalEnding, ENDINGS } from '../sim/endings.js';

test('running out of cash grants one turn of emergency grace', () => {
  const s = createInitialState();
  s.cash = -1;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.insolvent, true);
  assert.equal(checkTurnEndings(s), 'acquihire');
});

test('insolvency ends immediately without unused rescue options and clears after recovery', () => {
  const s = createInitialState();
  s.cash = -1;
  s.flags.emergencyUsed = ['equityForCompute', 'structureChange', 'bridgeRound'];
  assert.equal(checkTurnEndings(s), 'acquihire');

  const recovered = createInitialState();
  recovered.flags.insolvent = true;
  assert.equal(checkTurnEndings(recovered), null);
  assert.equal(recovered.flags.insolvent, undefined);
});

test('misuse ends the run on the second round in a row over both lines', () => {
  const s = createInitialState();
  s.capability = 60;
  s.misuseLocked = 75;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.misuseRounds, 1);
  assert.equal(checkTurnEndings(s), 'misuse');
});

test('a round back under either misuse line resets the count', () => {
  const s = createInitialState();
  s.capability = 60;
  s.misuseLocked = 75;
  checkTurnEndings(s);
  s.capability = 50;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.misuseRounds, 0);
  s.capability = 60;
  assert.equal(checkTurnEndings(s), null);
});

test('race heat above 85 for three rounds in a row ends the world through a rival', () => {
  const s = createInitialState();
  s.raceHeat = 90;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(checkTurnEndings(s), null);
  assert.equal(checkTurnEndings(s), 'rivalDisaster');
});

test('race heat at the line resets the heat count', () => {
  const s = createInitialState();
  s.raceHeat = 90;
  checkTurnEndings(s);
  checkTurnEndings(s);
  s.raceHeat = 85;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.heatRounds, 0);
});

test('era gate: left behind, then board vote', () => {
  const s = createInitialState();
  s.rivals.forEach((r) => (r.capability = 50));
  assert.equal(eraGate(s), 'leftBehind');
  const t = createInitialState();
  t.era = 2;
  t.board = [40, 40, 40, 60, 60, 60, 40];
  t.staffTrust = STAFF_LETTER_TRUST - 1;
  assert.deepEqual(boardVote(t), { yes: 3, passed: false });
  assert.equal(eraGate(t), 'boardRemoved');
});

test('once per run, a staff letter reverses a vote that would remove you', () => {
  const s = createInitialState();
  s.era = 2;
  s.board = [40, 40, 40, 60, 60, 60, 40];
  s.staffTrust = STAFF_LETTER_TRUST;
  assert.equal(eraGate(s), null);
  assert.equal(s.staffTrust, STAFF_LETTER_TRUST - 10);
  assert.deepEqual(s.board, [55, 55, 55, 60, 60, 60, 55]);
  assert.equal(s.flags.lastBoardVote.reversedByStaff, true);
  s.board = [40, 40, 40, 60, 60, 60, 40];
  s.staffTrust = 100;
  assert.equal(eraGate(s), 'boardRemoved');
});

test('the board does not reverse a vote when staff trust is too low', () => {
  const s = createInitialState();
  s.era = 2;
  s.board = [40, 40, 40, 60, 60, 60, 40];
  s.staffTrust = STAFF_LETTER_TRUST - 1;
  assert.equal(eraGate(s), 'boardRemoved');
  assert.equal(s.flags.staffLetterUsed, undefined);
});

test('each member reacts to what they care about: a good turn', () => {
  const s = createInitialState();
  const before = boardSnapshot(s);
  s.arr = 100;
  s.burnPlanned = 50; // 24 months of runway
  s.valuation = before.valuation + 1000;
  s.compute.split.safety = 0.15;
  s.govFavor.us = 60;
  s.publicTrust = 75;
  updateBoard(s, before);
  // growth +3, financier +2, sovereign +3, safety +2, candor 0, security +2 +1, trustee +2
  assert.deepEqual(s.board, [73, 67, 63, 67, 70, 63, 72]);
});

test('each member reacts to what they care about: a bad turn', () => {
  const s = createInitialState();
  s.arr = 100;
  s.concealedDebt = 10;
  s.constitution.hardLines = ['honest'];
  const before = boardSnapshot(s);
  s.arr = 50;
  s.valuation = before.valuation - 1000;
  s.cash = 500;
  s.burnPlanned = 200; // under three months of runway
  s.concealedDebt = 0;
  s.promises = [{ leaked: true }];
  s.flags.brokenPromise = true;
  s.security = 30;
  s.govFavor.us = 40;
  s.publicTrust = 45;
  s.constitution.hardLines = [];
  updateBoard(s, before, [{ type: 'hazardResolved', choice: 'ignore' }]);
  // growth -4, financier -2, sovereign -3, safety -3 -8, candor -6 -6 -8, security -2 -2 -2, trustee -1 -8
  assert.deepEqual(s.board, [66, 63, 57, 54, 50, 54, 61]);
});

test('final endings', () => {
  const s = createInitialState();
  s.capability = 100;
  assert.equal(finalEnding(s), 'aligned');
  const t = createInitialState();
  t.capability = 100;
  t.alignmentDebt = 60;
  assert.equal(finalEnding(t), 'pyrrhic');
  const u = createInitialState();
  u.capability = 100;
  u.deal = { signed: {}, binding: ['evaluators', 'sharedSafety'], trust: 2, collapsed: false, playerShipped: false };
  assert.equal(finalEnding(u), 'pacingDeal');
  const v = createInitialState();
  v.rivals[0].capability = v.capability + 1;
  assert.equal(finalEnding(v), 'overtaken');
  for (const id of ['acquihire', 'boardRemoved', 'misalignment', 'misuse', 'leftBehind', 'rivalDisaster', 'aligned', 'pacingDeal', 'pyrrhic', 'overtaken']) {
    assert.ok(ENDINGS[id], id);
  }
});
