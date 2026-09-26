import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseSplit, budgetFromSliders, levelFor } from '../ui/logic/actions.js';
import { setBudget } from '../sim/turn.js';
import { createInitialState } from '../sim/state.js';

test('slider values normalise to shares that the sim accepts', () => {
  const split = normaliseSplit({ training: 78, safety: 45, security: 25, product: 30, talent: 22 });
  const sum = Object.values(split).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9);
  const b = budgetFromSliders({ training: 78, safety: 45, security: 25, product: 30, talent: 22 }, 'steady', 1);
  assert.equal(b.spend, 20);
  assert.equal(setBudget(createInitialState(), b).ok, true);
});

test('spend level scales by era', () => {
  assert.equal(budgetFromSliders({ training: 1, safety: 1, security: 1, product: 1, talent: 1 }, 'aggressive', 3).spend, 70);
});

test('normaliseSplit keeps exactly the input keys', () => {
  const split = normaliseSplit({ training: 4, security: 3, product: 2, talent: 1 });
  assert.deepEqual(Object.keys(split), ['training', 'security', 'product', 'talent']);
  assert.ok(Math.abs(Object.values(split).reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
});

test('all-zero input gives equal shares', () => {
  assert.deepEqual(normaliseSplit({ first: 0, second: 0, third: 0, fourth: 0 }), {
    first: 0.25,
    second: 0.25,
    third: 0.25,
    fourth: 0.25,
  });
});

test('levelFor finds the nearest era-scaled spend', () => {
  assert.equal(levelFor(40, 3), 'steady');
});
