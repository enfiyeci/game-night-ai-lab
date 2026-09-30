import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accrue } from '../sim/util.js';

test('accrue fires each time the running total reaches 1 and keeps the remainder', () => {
  const h = {};
  const fired = [];
  for (let i = 0; i < 8; i++) fired.push(accrue(h, 'p', 0.3));
  assert.deepEqual(fired, [false, false, false, true, false, false, true, false]);
  assert.ok(Math.abs(h.p - 0.4) < 1e-9);
});

test('accrue treats a negative chance as zero', () => {
  const h = { p: 0.5 };
  assert.equal(accrue(h, 'p', -1), false);
  assert.equal(h.p, 0.5);
});
