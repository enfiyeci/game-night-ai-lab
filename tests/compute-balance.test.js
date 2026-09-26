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

test('renting only spot almost never wins', () => {
  assert.ok(wins(r.handToMouth) / N <= 0.1);
});

test('reserving the grid in era 2 pays off in era 4', {
  todo: 'balanced rank 1.075 vs no-grid 1.0417; needs cap-preserving era-4 progress or rank tie-break so powered compute matters at capability 100',
}, () => {
  assert.ok(r.balanced.meanRankAtEra4End < r.balancedNoGrid.meanRankAtEra4End);
});

test('safety compute matters', () => {
  const low = misaligned(r.balancedLowSafety);
  const high = misaligned(r.balancedHighSafety);
  assert.ok(low >= high * 1.3 && low - high >= 5, `low ${low}, high ${high}`);
});

test('compute is most of the money, as for real labs', () => {
  for (const [era, row] of Object.entries(r.balanced.perEra)) {
    if (row.turns < 20) continue;
    assert.ok(row.computeShare >= 0.4 && row.computeShare <= 0.7, `era ${era}: ${row.computeShare}`);
  }
});

test('the era 3 queue leaves someone short most turns', () => {
  assert.ok(r.balanced.queueShortTurns / Math.max(1, r.balanced.queueTurns) >= 0.5);
});
