import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { setComputeSplit, computeSlices, spotCover, resaleCredit, applySplitEffects, makePledge, safetyValue } from '../sim/split.js';
import { availableUnits } from '../sim/training.js';
import { setBudget } from '../sim/turn.js';
import { BALANCE } from '../sim/balance.js';
import { SPOT_PRICE, RESALE } from '../sim/data/compute.js';

// Tests check behaviour against the modules' own exports, not tuned constants (compute spec §11b).
const U = BALANCE.unitMonthlyCost;
const contract = (id, units, price) => ({ id, supplier: id, units, price, monthsLeft: 24, needsPower: false, dark: false, string: null });

const at = (online, need, safety = 0.12) => {
  const s = createInitialState();
  s.compute.online = online;
  s.compute.servingUnits = need;
  s.compute.split.safety = safety;
  return s;
};

test('online compute splits into serving, control, safety and training', () => {
  const s = at(200, 90);
  s.activeRun = { units: 50, bonus: 0, turnsLeft: 1, spikes: 0, spikeChance: 0 };
  assert.deepEqual(computeSlices(s), { online: 200, need: 90, control: 0, safety: 24, serving: 90, shortfall: 0, training: 86, run: 50, idle: 36 });
  assert.equal(availableUnits(s), 36);
});

test('safety is kept before serving; a short fleet leaves a serving shortfall', () => {
  const s = at(100, 95, 0.1);
  const x = computeSlices(s);
  assert.equal(x.safety, 10);
  assert.equal(x.serving, 90);
  assert.equal(x.shortfall, 5);
  assert.equal(x.training, 0);
});

test('a serving cap leaves more for training', () => {
  const s = at(200, 90, 0);
  setComputeSplit(s, { servingCap: 60 });
  assert.equal(computeSlices(s).shortfall, 30);
  assert.equal(computeSlices(s).training, 140);
});

test('the split is validated', () => {
  const s = at(100, 0);
  assert.match(setComputeSplit(s, null).error, /object/);
  assert.match(setComputeSplit(s, 'safety').error, /object/);
  assert.match(setComputeSplit(s, { safety: 0.2, bonus: 1 }).error, /bonus/);
  assert.equal(setComputeSplit(s, { safety: 0.6 }).ok, false);
  assert.equal(setComputeSplit(s, { safety: -0.1 }).ok, false);
  assert.equal(setComputeSplit(s, { servingCap: -1 }).ok, false);
  assert.equal(setComputeSplit(s, { coverWithSpot: 'yes' }).ok, false);
  assert.equal(setComputeSplit(s, { safety: 0.2, resellIdle: true }).ok, true);
  assert.equal(s.compute.split.safety, 0.2);
});

test('spot covers a shortfall at the era price, or users suffer an outage', () => {
  const s = at(100, 95, 0.1);
  s.era = 3;
  assert.ok(Math.abs(spotCover(s) - 5 * SPOT_PRICE[3] * U) < 1e-9);
  s.compute.split.coverWithSpot = false;
  assert.equal(spotCover(s), 0);
  s.models.push(
    { active: true, activeFromTurn: 0, channel: 'consumer', users: 1000000, flags: [] },
    { active: false, activeFromTurn: 0, channel: 'consumer', users: 1000000, flags: [] },
    { active: true, activeFromTurn: 1, channel: 'consumer', users: 1000000, flags: [] },
  );
  const pt = s.publicTrust;
  const ev = applySplitEffects(s);
  assert.ok(ev.some((e) => e.type === 'outage'));
  assert.ok(s.models[0].users < 1000000);
  assert.equal(s.models[1].users, 1000000);
  assert.equal(s.models[2].users, 1000000);
  assert.equal(s.publicTrust, pt - 2);
});

test('resale recovers the era share of idle compute', () => {
  const s = at(100, 0, 0);
  s.compute.contracts = [contract('verde', 100, 1)];
  s.compute.split.resellIdle = true;
  assert.ok(Math.abs(resaleCredit(s) - 100 * RESALE[1] * U) < 1e-9);
});

test('resale never earns more than the idle chips cost: the cheapest contracts are resold first', () => {
  const s = at(100, 50, 0); // 50 serving, 50 idle
  s.compute.contracts = [contract('verde', 50, 1), contract('rescue', 50, 0.5)];
  s.compute.split.resellIdle = true;
  assert.ok(Math.abs(resaleCredit(s) - 50 * Math.min(RESALE[1], 0.5) * U) < 1e-9);
  assert.ok(resaleCredit(s) <= 50 * 0.5 * U + 1e-9);
});

test('safety compute lowers alignment debt and is valued per era', () => {
  const s = at(100, 0, 0.2);
  const debt = s.alignmentDebt = 30;
  applySplitEffects(s);
  assert.ok(s.alignmentDebt < debt);
  assert.ok(Math.abs(safetyValue(s) - 20 * U) < 1e-9);
});

test('the pledge is offered once in eras 1 and 2, and a lower share breaks it', () => {
  const s = at(100, 0, 0.1);
  assert.equal(makePledge(s, 0.15).ok, false);
  assert.equal(makePledge(s, 0.2).ok, true);
  assert.equal(s.flags.safetyPledgeMade, true);
  assert.equal(makePledge(s, 0.1).ok, false);
  applySplitEffects(s);
  assert.equal(s.flags.brokenPromise, true);
  s.promises = s.promises.filter((p) => p.type !== 'safetyCompute');
  assert.equal(makePledge(s, 0.1).ok, false);
  const e3 = at(100, 0); e3.era = 3;
  assert.equal(makePledge(e3, 0.1).ok, false);
});

test('the safety readers use the compute share', async () => {
  const { safetySpend } = await import('../sim/economy.js');
  const s = at(10, 0, 0.5);
  assert.ok(Math.abs(safetySpend(s) - safetyValue(s)) < 1e-9);
  assert.ok(safetySpend(s) >= 5, 'half of the starting fleet clears the interpretability threshold');
  s.compute.split.safety = 0;
  assert.equal(safetySpend(s), 0);
});

test('the money budget has no safety slice any more', () => {
  const s = createInitialState();
  assert.equal(setBudget(s, { spend: 20, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } }).ok, true);
  const r = setBudget(s, { spend: 20, split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 } });
  assert.equal(r.ok, false);
  assert.match(r.error, /safety/);
});
