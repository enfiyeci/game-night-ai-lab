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

test('early over-commitment exposes its cash cost before the late game', () => {
  const early = (r.overCommitter.cashEndingsByEra[1] ?? 0) + (r.overCommitter.cashEndingsByEra[2] ?? 0);
  assert.ok(early / N >= 0.6, JSON.stringify(r.overCommitter.cashEndingsByEra));
});

test('balance strategies have no rejected actions', () => {
  for (const [name, row] of Object.entries(r)) assert.equal(row.rejectedActions, 0, name);
});

test('renting only spot almost never wins', () => {
  assert.ok(wins(r.handToMouth) / N <= 0.1);
});

test('reserving the grid improves whole-run outcomes over the same policy without it', () => {
  assert.ok(wins(r.careful) > wins(r.carefulNoGrid), `${wins(r.careful)} vs ${wins(r.carefulNoGrid)}`);
});

test('safety compute matters', () => {
  const low = misaligned(r.balancedLowSafety);
  const high = misaligned(r.balancedHighSafety);
  assert.ok(low >= high * 1.3 && low - high >= 5, `low ${low}, high ${high}`);
});

test('compute stays a major expense while the lab still funds its people', () => {
  for (const [era, row] of Object.entries(r.balanced.perEra)) {
    if (row.turns < 20) continue;
    assert.ok(row.computeShare >= 0.4 && row.computeShare <= 0.95, `era ${era}: ${row.computeShare}`);
  }
});

test('the era 3 queue leaves someone short most turns', () => {
  assert.ok(r.balanced.queueShortTurns / Math.max(1, r.balanced.queueTurns) >= 0.5);
});
