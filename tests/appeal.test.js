import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  PRODUCTS, pickableProducts, productOf, waveProduct, rivalProduct, crowding, claimFirsts, holdsFirst,
} from '../sim/data/products.js';

test('products open one round before their wave era', () => {
  const s = createInitialState();
  assert.deepEqual(pickableProducts(s), ['chat', 'business']);
  s.turnInEra = 3;
  assert.deepEqual(pickableProducts(s), ['chat', 'business', 'coding']);
  s.era = 2; s.turnInEra = 3;
  assert.deepEqual(pickableProducts(s), ['chat', 'business', 'coding', 'agent']);
  s.era = 3; s.turnInEra = 3;
  assert.deepEqual(pickableProducts(s), ['chat', 'business', 'coding', 'agent', 'science']);
});

test('a model without a product falls back from its legacy channel', () => {
  assert.equal(productOf({ product: 'coding', channel: 'enterprise' }), 'coding');
  assert.equal(productOf({ channel: 'consumer' }), 'chat');
  assert.equal(productOf({ spec: { channel: 'agent' } }), 'agent');
  assert.equal(productOf({}), 'business');
});

test('each product maps to a legacy channel', () => {
  assert.equal(PRODUCTS.chat.channel, 'consumer');
  assert.equal(PRODUCTS.coding.channel, 'enterprise');
  assert.equal(PRODUCTS.agent.channel, 'agent');
});

test('the wave and the rival rules by era', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(waveProduct), ['chat', 'coding', 'agent', 'science', 'agent']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('openbrain', era)), ['chat', 'coding', 'agent', 'science', 'agent']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('lodestar', era)), ['business', 'business', 'business', 'science', 'science']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('deepthink', era)), ['chat', 'coding', 'coding', 'science', 'science']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('qilin', era)), ['chat', 'chat', 'coding', 'coding', 'coding']);
  assert.equal(rivalProduct('openbrain', 6), 'agent');
});

test('crowding counts the rivals in a product (spec section 6 table)', () => {
  const s = createInitialState();
  assert.equal(crowding(s, 'chat'), 0.55);
  assert.equal(crowding(s, 'business'), 0.8);
  s.era = 2;
  assert.equal(crowding(s, 'coding'), 0.65);
  s.era = 3;
  assert.equal(crowding(s, 'agent'), 0.8);
  assert.equal(crowding(s, 'chat'), 1);
  s.era = 4;
  assert.equal(crowding(s, 'science'), 0.55);
  assert.equal(crowding(s, 'agent'), 1);
});

test('firsts go to the first lab live; labs live in the same round share them', () => {
  const s = createInitialState();
  s.turn = 5;
  claimFirsts(s, 'openbrain', 'chat', []);
  claimFirsts(s, 'player', 'chat', ['voice']);
  assert.ok(holdsFirst(s, 'products', 'chat', 'openbrain'));
  assert.ok(holdsFirst(s, 'products', 'chat', 'player'));
  assert.ok(holdsFirst(s, 'features', 'voice', 'player'));
  s.turn = 6;
  claimFirsts(s, 'qilin', 'chat', ['voice']);
  assert.ok(!holdsFirst(s, 'products', 'chat', 'qilin'));
  assert.ok(!holdsFirst(s, 'features', 'voice', 'qilin'));
});

import { FIT_PROFILES } from '../sim/data/products.js';
import { fitReport } from '../sim/appeal.js';
import { cardById } from '../sim/recipe.js';

const draft = (picks, extra = {}) => ({
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.2 },
  picks: { pre: [], mid: [], post: [], ...picks },
  ...extra,
});

test('every fit profile weighs 1 in total', () => {
  for (const [id, signals] of Object.entries(FIT_PROFILES)) {
    assert.equal(Math.round(signals.reduce((sum, s) => sum + s.w, 0) * 1000) / 1000, 1, id);
  }
});

test('the agent profile never asks for two cards from the one-pick rl group', () => {
  const rl = FIT_PROFILES.agent.filter((s) => (s.ids ?? []).some((id) => cardById(id)?.group === 'rl'));
  assert.equal(rl.length, 1);
});

test('fit counts only signals the era can reach: a perfect era-1 chat recipe scores 1', () => {
  const s = createInitialState();
  const recipe = draft({ post: ['rlhf', 'safety-tuning'] }, { focus: { post: [40, 40, 20] } });
  assert.deepEqual(fitReport(s, recipe, 'chat'), { fit: 1, missing: [] });
});

test('missing signals are named, heaviest first', () => {
  const s = createInitialState();
  const report = fitReport(s, draft({ post: ['rlhf'] }), 'chat');
  assert.equal(report.fit, 0.444);
  assert.deepEqual(report.missing, ['values time in post-training', 'safety hardening']);
});

test('default cards never count, and thumbs-up is not a feedback signal', () => {
  const s = createInitialState();
  assert.equal(fitReport(s, draft({ post: ['thumbs'] }), 'chat').fit, 0);
});

test('a focus slider counts only 10 points of share above its start', () => {
  const s = createInitialState();
  const small = fitReport(s, draft({}, { focus: { post: [55, 25, 20] } }), 'chat');
  const big = fitReport(s, draft({}, { focus: { post: [50, 30, 20] } }), 'chat');
  assert.equal(small.fit, 0);
  assert.equal(big.fit, 0.333);
});

test('the release eval counts when picked at release', () => {
  const s = createInitialState();
  const recipe = draft({});
  assert.ok(fitReport(s, recipe, 'business', ['eval-full']).fit > fitReport(s, recipe, 'business').fit);
});

test('fit does not credit a locked alternative to an achievable signal', () => {
  const s = createInitialState();
  assert.deepEqual(fitReport(s, draft({ post: ['unlearning'] }), 'business'),
    fitReport(s, draft({}), 'business'));
  assert.deepEqual(fitReport(s, draft({}), 'business', ['eval-gov']),
    fitReport(s, draft({}), 'business'));
});

test('default safeguards and decontamination never satisfy fit', () => {
  const s = createInitialState();
  s.era = 2;
  assert.deepEqual(fitReport(s, draft({ post: ['no-safeguards'] }), 'chat'),
    fitReport(s, draft({}), 'chat'));
  assert.deepEqual(fitReport(s, draft({ mid: ['no-decontam'] }), 'business'),
    fitReport(s, draft({}), 'business'));
});

test('fit sees only release-stage picks from the release selection', () => {
  const s = createInitialState();
  assert.deepEqual(fitReport(s, draft({}), 'chat', ['rlhf']),
    fitReport(s, draft({}), 'chat'));
});
