import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBalance, playRun } from '../tools/balance.js';
import { ENDINGS } from '../sim/endings.js';

test('every strategy finishes every run with a known ending', () => {
  const report = runBalance(3);
  for (const [name, r] of Object.entries(report)) {
    const total = Object.values(r.endings).reduce((a, b) => a + b, 0);
    assert.equal(total, 3, name);
    for (const id of Object.keys(r.endings)) assert.ok(ENDINGS[id], `${name}: ${id}`);
  }
});

test('runs are reproducible', () => {
  assert.deepEqual(playRun('random', 4), playRun('random', 4));
});
