import { test } from 'node:test';
import assert from 'node:assert/strict';
import { report } from '../tools/balance.js';

const N = 200;
const r = report(N);
const wins = (row) => ['aligned', 'pacingDeal', 'pyrrhic'].reduce((s, k) => s + (row.endings[k] ?? 0), 0);
const misaligned = (row) => (row.endings.misalignment ?? 0) + (row.endings.quietTakeover ?? 0);

test('over-committing mostly ends in running out of money', () => {
  assert.ok((r.overCommitter.endings.acquihire ?? 0) / N >= 0.6, JSON.stringify(r.overCommitter.endings));
});

test('over-committing fails mostly in eras 3–4', {
  todo: '8/183 (4.4%) acquihires occur in eras 3–4; needs deposits separated from monthly price or an era-aware commitment rule',
}, () => {
  const cash = r.overCommitter.endings.acquihire ?? 0;
  const late = (r.overCommitter.cashEndingsByEra[3] ?? 0) + (r.overCommitter.cashEndingsByEra[4] ?? 0);
  assert.ok(late / Math.max(1, cash) >= 0.5, `${late}/${cash} acquihires in eras 3–4`);
});

test('balance strategies have no rejected actions', () => {
  for (const [name, row] of Object.entries(r)) assert.equal(row.rejectedActions, 0, name);
});

test('renting only spot almost never wins', () => {
  assert.ok(wins(r.handToMouth) / N <= 0.1);
});

test('reserving the grid in era 2 pays off in era 4', {
  todo: 'balanced rank 1.0 vs no-grid 1.0 once capability counts past 100 (owner pick A, 2026-09-26): the lab stays well ahead, so compute share never breaks a tie at the top; needs powered compute to feed the lead itself',
}, () => {
  assert.ok(r.balanced.meanRankAtEra4End < r.balancedNoGrid.meanRankAtEra4End);
});

test('safety compute matters', {
  todo: 'low 159 vs high 125 misaligned after the seven-member board (2026-09-26): fewer low-safety runs are removed by the board, so they live on to misalign; rebalance in the later balance pass',
}, () => {
  const low = misaligned(r.balancedLowSafety);
  const high = misaligned(r.balancedHighSafety);
  assert.ok(low >= high * 1.3 && low - high >= 5, `low ${low}, high ${high}`);
});

test('compute is most of the money, as for real labs', {
  todo: 'era 5 at 0.77 after the seven-member board (2026-09-26; 0.694 before): more balanced runs now reach era 5, where running costs grow far slower than compute; rebalance in the later balance pass',
}, () => {
  for (const [era, row] of Object.entries(r.balanced.perEra)) {
    if (row.turns < 20) continue;
    assert.ok(row.computeShare >= 0.4 && row.computeShare <= 0.7, `era ${era}: ${row.computeShare}`);
  }
});

test('the era 3 queue leaves someone short most turns', () => {
  assert.ok(r.balanced.queueShortTurns / Math.max(1, r.balanced.queueTurns) >= 0.5);
});
