import { test } from 'node:test';
import assert from 'node:assert/strict';
import { servingCost, margin } from '../sim/serving.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≉ ${b}`);
const base = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' };

test('era 1 medium dense consumer model', () => {
  near(servingCost(base, 1, 0), 2.4);
  near(margin(2.4, 5), 0.52);
});

test('era 2 large MoE, long context, FP8, light and heavy load', () => {
  const spec = { ...base, size: 'large', arch: 'moe', context: 'long', precision: 'fp8' };
  near(servingCost(spec, 2, 0.5), 2.1);
  near(servingCost(spec, 2, 0.9), 2.94);
});

test('era 3 reasoning model with classifiers', () => {
  const spec = { ...base, size: 'large', arch: 'sparse', context: 'long', precision: 'fp8', guard: true, reasoning: 'medium' };
  near(servingCost(spec, 3, 0.5), 5.4684);
});

test('era 4 agent seat', () => {
  const spec = { size: 'large', arch: 'sparse', context: 'million', precision: 'fp4', guard: true, channel: 'agent', reasoning: 'medium' };
  near(servingCost(spec, 4, 0.5), 61.08);
});
