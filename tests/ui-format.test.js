import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compute, computeAmount, money, months, pct, roundsToWords, users } from '../ui/logic/format.js';

test('money, months, percentages and user counts', () => {
  assert.equal(money(412), '$412M');
  assert.equal(money(1234), '$1.2B');
  assert.equal(months(7.2), 'about 7 months');
  assert.equal(months(40), 'over 3 years');
  assert.equal(months(0.4), 'less than a month');
  assert.equal(months(Infinity), 'over 3 years');
  assert.equal(pct(0.4), '40%');
  assert.equal(users(14.2e6), '14.2M');
  assert.equal(users(950e3), '950K');
  assert.equal(compute({ online: 120, pipeline: [{ units: 10 }, { units: 30 }] }), '120 units online · 40 units arriving');
});

test('compute uses power units from era 4', () => {
  assert.equal(computeAmount(40, 2), '40 units');
  assert.equal(computeAmount(500, 4), '850 MW');
  assert.equal(computeAmount(900, 4), '1.53 GW');
  assert.equal(compute({ online: 500, pipeline: [{ units: 100 }] }, 4), '850 MW online · 170 MW arriving');
});

test('round counts use story-time words for the current era', () => {
  assert.equal(roundsToWords(1, 2), 'about 6 months');
  assert.equal(roundsToWords(5, 2), 'about 2 weeks');
  assert.equal(roundsToWords(5, 1), '7 days');
});

test('the project pill names the run after the next model in the family and tracks its stage', async () => {
  const { project } = await import('../ui/logic/format.js');
  const { createInitialState } = await import('../sim/state.js');
  const s = createInitialState();
  assert.deepEqual(project(s), { name: 'No project', status: 'click the floor to get to work', progress: null });
  s.activeRun = { recipe: { sliders: { size: 'large', length: 'optimal', alignShare: 0.2 }, picks: { pre: [], mid: [], post: [] } }, turnsLeft: 3 };
  s.models.push({ family: 'Kestrel', generation: 3 });
  const p = project(s);
  assert.equal(p.name, 'Kestrel 4 Grand');
  assert.equal(p.status, 'training run · pretraining');
  assert.ok(p.progress >= 0 && p.progress < 1);
  s.activeRun = null; s.pendingModel = {};
  assert.equal(project(s).status, 'ready to release');
});

test('arriving compute counts only the share left after pooling', () => {
  assert.equal(compute({ online: 50, pooled: 0.3, pipeline: [{ units: 100 }] }), '50 units online · 70 units arriving');
});
