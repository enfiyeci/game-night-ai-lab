import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  updateServing, growUsers, applyEconomy, runway, valuationOf, legalTick,
  raiseRound, useEmergency, monthlyRevenue, projectBurn, accrueEconomy,
} from '../sim/economy.js';
import * as economyApi from '../sim/economy.js';
import { setAutomation } from '../sim/automation.js';
import { computeSlices } from '../sim/split.js';

const consumerModel = (users) => ({
  name: 'Kestrel 1 Core', active: true, activeFromTurn: 0, channel: 'consumer', priceStance: 'market',
  users, userCap: users * 4, servingCost: 0,
  spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
});

test('serving load uses compute and leaves a shortfall at scale', () => {
  const s = createInitialState();
  s.models.push(consumerModel(4e6));
  const units = updateServing(s);
  assert.ok(Math.abs(units - 4e6 * 2.4 / 1.46e6) < 1e-6);
  assert.equal(computeSlices(s).shortfall, 0);
  s.models[0].users = 8e6;
  updateServing(s);
  assert.ok(computeSlices(s).shortfall > 0);
});

test('compute reserved by monitors is not available for serving', () => {
  const s = createInitialState();
  s.era = 3;
  s.compute.online = 30;
  s.models.push(consumerModel(1e6));
  updateServing(s);
  assert.equal(setAutomation(s, { checks: { monitors: 3 } }).ok, true); // 3 × 0.7 × 8 = 16.8 units
  s.models[0].users = 15e6; // fits in 30 units, not in what is left after monitors
  const bare = structuredClone(s);
  bare.automation.checks.monitors = 0;
  updateServing(bare);
  assert.equal(computeSlices(bare).shortfall, 0);
  updateServing(s);
  assert.ok(computeSlices(s).shortfall > 0);
});

test('reviewers add to the monthly burn', () => {
  const s = createInitialState();
  s.era = 4;
  const before = projectBurn(s);
  s.automation.checks.reviewers = 2;
  assert.ok(Math.abs(projectBurn(s) - before - 10) < 1e-9); // 2 reviewers × $2M × 2.5 in era 4
});

test('serving load ignores training runs but accounts for reserved safety compute', () => {
  const s = createInitialState();
  s.compute.split.safety = 0;
  const model = consumerModel(9e6);
  model.spec.arch = 'moe';
  s.models.push(model);
  const baseline = updateServing(s);
  s.activeRun = { units: 5 };
  assert.equal(updateServing(s), baseline);
  s.compute.split.safety = 0.5;
  assert.ok(updateServing(s) > baseline);
});

test('revenue, burn, cash and valuation', () => {
  const s = createInitialState();
  s.models.push(consumerModel(4e6));
  assert.equal(monthlyRevenue(s), 20);
  updateServing(s);
  applyEconomy(s);
  // burn = ops 15 + rent 14.6 + spot 0 + spend 20 = 49.6; quarter = 3 months
  assert.ok(Math.abs(s.burnPlanned - 49.6) < 1e-9);
  assert.ok(Math.abs(s.cash - (1000 + (20 - 49.6) * 3)) < 1e-9);
  assert.equal(s.arr, 240);
  assert.equal(s.valuation, 240 * 60);
});

test('projected burn matches the burn applied by the economy', () => {
  const s = createInitialState();
  s.models.push(consumerModel(4e6));
  updateServing(s);
  assert.equal(typeof economyApi.projectBurn, 'function');
  const projected = economyApi.projectBurn(s);
  applyEconomy(s);
  assert.equal(projected, s.burnPlanned);
});

test('runway and valuation floors', () => {
  const s = createInitialState();
  s.burnPlanned = 50;
  assert.equal(runway(s, 'planned'), 20);
  assert.equal(runway(s, 'trailing'), Infinity);
  assert.equal(valuationOf(s), 80 * 60);
});

test('non-positive cash is in the danger zone even with infinite runway', () => {
  const s = createInitialState();
  s.cash = 0;
  s.arr = 1200;
  s.burnPlanned = 10;
  assert.equal(runway(s, 'planned'), Infinity);
  assert.equal(economyApi.inDangerZone(s), true);
});

test('users grow up to their cap', () => {
  const s = createInitialState();
  s.models.push(consumerModel(1e6));
  for (let i = 0; i < 50; i++) growUsers(s);
  assert.equal(s.models[0].users, 4e6);
});

test('lawsuits come due', () => {
  const s = createInitialState();
  s.legalCases.push({ cost: 120, dueTurn: 0, source: 'training data' }, { cost: 50, dueTurn: 5, source: 'x' });
  const paid = legalTick(s);
  assert.equal(paid.length, 1);
  assert.equal(s.cash, 880);
  assert.equal(s.publicTrust, 57);
  assert.equal(s.legalCases.length, 1);
});

test('state-law preemption discounts legal cases when they are paid', () => {
  const s = createInitialState();
  s.flags.statePreemption = true;
  s.legalCases.push({ cost: 100, dueTurn: 0, source: 'state safety law' });
  const paid = legalTick(s);
  assert.deepEqual(paid, [{ cost: 70, dueTurn: 0, source: 'state safety law' }]);
  assert.equal(s.cash, 930);
  assert.equal(s.publicTrust, 57);
});

test('one funding round per era, with strings attached', () => {
  const s = createInitialState();
  s.era = 2;
  assert.equal(raiseRound(s, 'sovereign').ok, true);
  assert.equal(s.cash, 1000 + 750);
  assert.equal(s.govFavor.us, 45);
  assert.equal(raiseRound(s, 'vc').ok, false);
});

test('funding rounds are rejected in era 1', () => {
  const s = createInitialState();
  assert.deepEqual(raiseRound(s, 'vc'), { ok: false, error: 'funding rounds open in era 2' });
  assert.equal(s.cash, 1000);
});

test('investor archetypes must be own table entries', () => {
  const s = createInitialState();
  s.era = 2;
  const before = structuredClone(s);
  assert.equal(raiseRound(s, 'constructor').ok, false);
  assert.deepEqual(s, before);
});

test('emergency options only in the danger zone, once each', () => {
  const s = createInitialState();
  s.burnPlanned = 50;
  assert.equal(useEmergency(s, 'bridgeRound').ok, false);
  s.cash = 200; // 4 months of runway
  assert.equal(useEmergency(s, 'bridgeRound').ok, true);
  assert.equal(s.cash, 350);
  s.cash = 200;
  assert.equal(useEmergency(s, 'bridgeRound').ok, false);
  assert.equal(useEmergency(s, 'acquihire').ok, true);
  assert.equal(s.ending, 'acquihire');
});

test('emergency options must be own table entries', () => {
  const s = createInitialState();
  s.cash = 100;
  s.burnPlanned = 50;
  const before = structuredClone(s);
  assert.equal(useEmergency(s, 'constructor').ok, false);
  assert.deepEqual(s, before);
});


test('customers only pay for delivered service, and spot cover restores billable requests', () => {
  const s = createInitialState();
  s.models.push(consumerModel(2e6));
  const need = updateServing(s);
  const full = monthlyRevenue(s);
  assert.equal(full, 10);
  s.compute.split.coverWithSpot = false;
  s.compute.split.servingCap = need / 2;
  assert.equal(monthlyRevenue(s), full / 2);
  s.compute.split.servingCap = 0;
  s.compute.split.resellIdle = true;
  assert.equal(monthlyRevenue(s), 0, 'reselling idle chips does not bill unserved customers');
  const outageBurn = projectBurn(s);
  s.compute.split.coverWithSpot = true;
  assert.equal(monthlyRevenue(s), full);
  assert.ok(projectBurn(s) > outageBurn, 'restored service pays the spot bill');
});

test('model earnings, ARR and cash reconcile during partial and total outages', () => {
  const s = createInitialState();
  s.models.push(consumerModel(1e6), { ...consumerModel(2e6), name: 'Kestrel 2 Core' });
  const need = updateServing(s);
  s.compute.split.coverWithSpot = false;
  s.compute.split.servingCap = need / 2;
  const before = s.cash;
  const burn = projectBurn(s);
  accrueEconomy(s, 0.5);
  assert.deepEqual(s.models.map((model) => model.earned), [1.25, 2.5]);
  assert.equal(s.arr, 90);
  assert.ok(Math.abs(s.cash - before - (3.75 - burn * 0.5)) < 1e-9);
  s.compute.split.servingCap = 0;
  accrueEconomy(s, 1);
  assert.equal(s.arr, 0);
  assert.deepEqual(s.models.map((model) => model.earned), [1.25, 2.5], 'an outage adds no imaginary model earnings');
});

test('a completely unavailable service cannot grow, while restored service can', () => {
  const s = createInitialState();
  s.models.push(consumerModel(1e6));
  updateServing(s);
  s.compute.split.coverWithSpot = false;
  s.compute.split.servingCap = 0;
  growUsers(s);
  assert.equal(s.models[0].users, 1e6);
  s.compute.split.coverWithSpot = true;
  growUsers(s);
  assert.ok(s.models[0].users > 1e6);
});
