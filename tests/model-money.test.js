import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { accrueEconomy, monthlyRevenue, unitMonthlyPrice, updateServing } from '../sim/economy.js';
import { BALANCE } from '../sim/balance.js';
import { startRun, advanceRunBy } from '../sim/training.js';
import { releaseModel } from '../sim/release.js';
import { recipeCost } from '../sim/recipe.js';
import { computeSlices, spotCover } from '../sim/split.js';

const consumerModel = (name, users) => ({
  name, active: true, activeFromTurn: 0, channel: 'consumer', priceStance: 'market',
  users, userCap: users * 4, servingCost: 0, earned: 0, servingSpent: 0,
  spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
});

test('each model earns its share of the revenue and pays for the compute that serves it', () => {
  const s = createInitialState();
  s.models.push(consumerModel('A 1 Core', 2e6), consumerModel('B 2 Core', 1e6));
  updateServing(s);
  const revenue = monthlyRevenue(s);
  const price = unitMonthlyPrice(s);
  accrueEconomy(s, 2);
  const [a, b] = s.models;
  assert.ok(Math.abs(a.earned + b.earned - revenue * 2) < 1e-9);
  assert.ok(Math.abs(a.earned - 2 * b.earned) < 1e-9);
  const units = (m) => (m.users * m.servingCost) / BALANCE.unitMonthlyDollars;
  assert.ok(Math.abs(a.servingSpent - units(a) * price * 2) < 1e-9);
  assert.ok(a.servingSpent > 0);
});

test('serving is charged for the compute it got, and spot cover for the rest', () => {
  const s = createInitialState();
  s.models.push(consumerModel('A 1 Core', 30e6)); // far more than the starting fleet can serve
  updateServing(s);
  const { serving, shortfall } = computeSlices(s);
  assert.ok(shortfall > 0);
  s.compute.split.coverWithSpot = false;
  accrueEconomy(s, 1);
  assert.ok(Math.abs(s.models[0].servingSpent - serving * unitMonthlyPrice(s)) < 1e-9);
  const covered = createInitialState();
  covered.models.push(consumerModel('A 1 Core', 30e6));
  covered.compute.split.coverWithSpot = true;
  updateServing(covered);
  accrueEconomy(covered, 1);
  assert.ok(Math.abs(covered.models[0].servingSpent - (serving * unitMonthlyPrice(covered) + spotCover(covered))) < 1e-9);
});

test('a model that is not on sale earns nothing', () => {
  const s = createInitialState();
  const off = { ...consumerModel('Old 1 Core', 1e6), active: false };
  s.models.push(off);
  updateServing(s);
  accrueEconomy(s, 1);
  assert.equal(off.earned, 0);
  assert.equal(off.servingSpent, 0);
});

test('a training run bills its compute as it runs, and the released model carries the bill', () => {
  const s = createInitialState();
  const recipe = { sliders: { size: 'small', length: 'optimal', alignShare: 0.1 }, picks: { pre: [], mid: [], post: [] } };
  const cost = recipeCost(s, recipe);
  assert.equal(startRun(s, recipe).ok, true);
  const price = unitMonthlyPrice(s);
  const rng = createRng(3);
  s.activeRun.spikeChance = 0;
  let guard = 0;
  while (s.activeRun && guard++ < 100) advanceRunBy(s, rng, 0.25);
  assert.ok(s.pendingModel);
  const months = cost.turns * 3; // era 1 is three months a round
  assert.ok(Math.abs(s.pendingModel.trainingCost - (cost.cash + cost.units * months * price)) < 1e-6);
  s.pendingModel.hazard = null;
  const r = releaseModel(s, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 });
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.model.trainingCost - s.models.at(-1).trainingCost) < 1e-9);
  assert.equal(r.model.launchCost, 0);
  assert.equal(r.model.earned, 0);
});

test('a model launched in a later era earns more per user, and keeps its launch price', async () => {
  const { ERA_PRICE, REVENUE_PER_USER } = await import('../sim/serving.js');
  const { revenuePerUser } = await import('../sim/economy.js');
  assert.equal(ERA_PRICE[0], 1);
  assert.ok(ERA_PRICE.every((price, i) => i === 0 || price >= ERA_PRICE[i - 1]));
  const s = createInitialState();
  s.era = 3;
  s.pendingModel = { size: 'small', capability: 30, spec: { size: 'small', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoningCapable: false, channel: 'consumer' }, flags: [], publicEffects: { pt: 0, st: 0, govUs: 0, govIntl: 0, heat: 0, usersMult: 1 }, openWeightsMx: 0, trainingCost: 50 };
  const r = releaseModel(s, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 });
  assert.equal(r.ok, true);
  assert.equal(r.model.eraPrice, ERA_PRICE[2]);
  s.era = 4;
  assert.equal(revenuePerUser(r.model), REVENUE_PER_USER[r.model.channel] * ERA_PRICE[2]);
});

test('a run paused for want of capacity still pays for the training compute it holds', () => {
  const s = createInitialState();
  const recipe = { sliders: { size: 'small', length: 'optimal', alignShare: 0.1 }, picks: { pre: [], mid: [], post: [] } };
  assert.equal(startRun(s, recipe).ok, true);
  s.activeRun.units = 1000; // more than the fleet: the run pauses
  const before = s.activeRun.spent.compute;
  const result = advanceRunBy(s, createRng(1), 0.5);
  assert.equal(result.type, 'runPaused');
  const held = computeSlices(s).training;
  assert.ok(held > 0);
  assert.ok(Math.abs(s.activeRun.spent.compute - before - held * 0.5 * 3 * unitMonthlyPrice(s)) < 1e-9);
});
