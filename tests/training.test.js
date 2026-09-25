import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun, availableUnits } from '../sim/training.js';

const noLuck = { next: () => 0.99, int: () => 0, chance: () => false, normal: (m) => m };
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data', 'stability'], mid: [], post: ['synthetic-sft', 'dpo', 'safety-tuning'] },
};

test('starting a run pays cash and reserves compute', () => {
  const s = createInitialState();
  const r = startRun(s, recipe);
  assert.equal(r.ok, true);
  assert.equal(s.cash, 1000 - 53);
  assert.equal(s.activeRun.units, 5);
  assert.equal(availableUnits(s), 5);
  assert.equal(startRun(s, recipe).ok, false); // one run at a time
});

test('a run fails to start without enough compute', () => {
  const s = createInitialState();
  s.compute.online = 3;
  assert.equal(startRun(s, recipe).ok, false);
});

test('a finished run produces a trained model with hidden effects applied', () => {
  const s = createInitialState();
  startRun(s, recipe);
  const trained = advanceRun(s, noLuck);
  // base 10 + filtered 3 + synthetic-sft 2 + dpo 2 = 17; talent 0.8 + 0.2 = 1.0; × (1 − 0.5 × 0.15)
  assert.ok(Math.abs(trained.gain - 15.725) < 1e-9);
  assert.ok(Math.abs(trained.capability - 35.725) < 1e-9);
  assert.equal(s.activeRun, null);
  assert.equal(s.pendingModel, trained);
  assert.equal(s.alignmentDebt, 7); // 5 + dpo 2 + zero from the safety-share term
  assert.equal(s.misuseExposure, 2); // 5 − 3
  assert.equal(s.legalCases.length, 0); // chance() is false in this rng
  assert.equal(trained.spec.arch, 'dense');
  assert.equal(trained.openWeightsMx, 20);
});

test('low alignment share adds alignment debt; lawsuits are seeded by chance', () => {
  const s = createInitialState();
  const r2 = { ...recipe, sliders: { ...recipe.sliders, alignShare: 0 } };
  startRun(s, r2);
  const sure = { ...noLuck, chance: () => true };
  const trained = advanceRun(s, sure);
  // gain 17 × 1.0 × 1 × (1 − 0.2 × 1 spike) = 13.6; debt += 13.6 × 0.15 × 2 + 2
  assert.ok(Math.abs(trained.gain - 13.6) < 1e-9);
  assert.ok(Math.abs(s.alignmentDebt - (5 + 13.6 * 0.3 + 2)) < 1e-9);
  assert.equal(s.legalCases.length, 1);
  assert.equal(s.legalCases[0].dueTurn, 8);
});
