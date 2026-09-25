import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../sim/rng.js';
import { clamp, sigmoid } from '../sim/util.js';

test('same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 20; i++) assert.equal(a.next(), b.next());
});

test('next stays in [0, 1) and int stays in bounds', () => {
  const r = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const x = r.next();
    assert.ok(x >= 0 && x < 1);
    const n = r.int(-1, 1);
    assert.ok(n >= -1 && n <= 1 && Number.isInteger(n));
  }
});

test('chance respects 0 and 1', () => {
  const r = createRng(3);
  for (let i = 0; i < 100; i++) {
    assert.equal(r.chance(0), false);
    assert.equal(r.chance(1), true);
  }
});

test('normal has roughly the requested mean', () => {
  const r = createRng(11);
  let sum = 0;
  for (let i = 0; i < 5000; i++) sum += r.normal(10, 2);
  assert.ok(Math.abs(sum / 5000 - 10) < 0.2);
});

test('clamp and sigmoid', () => {
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(-5, 0, 100), 0);
  assert.equal(sigmoid(0), 0.5);
});
