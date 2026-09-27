import { PRODUCTS, productOf } from '../sim/data/products.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  servingCost, margin, HW, USAGE, SIZE, ARCH, CONTEXT, REASONING, PRECISION,
} from '../sim/serving.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} ≉ ${b}`);
const base = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' };
const expectedCost = (spec, era, load) => {
  const guard = spec.guard ? (era >= 4 ? 1.01 : 1.24) : 1;
  return USAGE[era - 1] * PRODUCTS[productOf({ spec })].tokens * REASONING[spec.reasoning]
    * HW[era - 1] * SIZE[spec.size] * ARCH[spec.arch][load > 0.8 ? 1 : 0]
    * CONTEXT[spec.context] * PRECISION[spec.precision] * guard;
};

test('era 1 medium dense consumer model', () => {
  const cost = expectedCost(base, 1, 0);
  near(servingCost(base, 1, 0), cost);
  near(margin(cost, PRODUCTS.chat.price), 1 - cost / PRODUCTS.chat.price);
});

test('era 2 large MoE, long context, FP8, light and heavy load', () => {
  const spec = { ...base, size: 'large', arch: 'moe', context: 'long', precision: 'fp8' };
  near(servingCost(spec, 2, 0.5), expectedCost(spec, 2, 0.5));
  near(servingCost(spec, 2, 0.9), expectedCost(spec, 2, 0.9));
});

test('era 3 reasoning model with classifiers', () => {
  const spec = { ...base, size: 'large', arch: 'sparse', context: 'long', precision: 'fp8', guard: true, reasoning: 'medium' };
  near(servingCost(spec, 3, 0.5), expectedCost(spec, 3, 0.5));
});

test('era 4 agent seat', () => {
  const spec = { size: 'large', arch: 'sparse', context: 'million', precision: 'fp4', guard: true, channel: 'agent', reasoning: 'medium' };
  near(servingCost(spec, 4, 0.5), expectedCost(spec, 4, 0.5));
});
