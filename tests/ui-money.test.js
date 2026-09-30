import test from 'node:test';
import { createInitialState } from '../sim/state.js';
import { updateServing } from '../sim/economy.js';
import assert from 'node:assert/strict';
import { SCENARIOS, scenarioHistory } from '../ui/logic/scenarios.js';
import { monthlyRevenue, projectBurn, runway } from '../sim/economy.js';
import { billChanges, cashLine, monthBill, weekFlows } from '../ui/logic/money.js';

const SCENES = ['start', 'era3Idle', 'danger', 'automation'];

test('the Money screen’s lines add up to the sim’s own revenue and spending', () => {
  for (const name of SCENES) {
    const state = SCENARIOS[name](1);
    const bill = monthBill(state);
    const sum = (lines) => lines.reduce((total, line) => total + line.amount, 0);
    assert.ok(Math.abs(sum(bill.income) - monthlyRevenue(state)) < 1e-6, `${name} income`);
    assert.ok(Math.abs(sum(bill.costs) - projectBurn(state)) < 1e-6, `${name} costs`);
    assert.ok(Math.abs(bill.net - (bill.moneyIn - bill.moneyOut)) < 1e-9, `${name} net`);
  }
});

test('a week of floating money is a quarter-ish of the month at today’s rates', () => {
  const state = SCENARIOS.era3Idle(1);
  const week = weekFlows(state);
  assert.ok(week.moneyOut > projectBurn(state) * 0.2 && week.moneyOut < projectBurn(state) * 0.3);
});

test('the cash line runs out when the Runway readout says it does', () => {
  const state = SCENARIOS.era3Idle(1);
  const line = cashLine(state, scenarioHistory(state));
  const months = runway({ ...state, burnPlanned: projectBurn(state) }, 'planned');
  assert.ok(Math.abs(line.runsOutIn - months) < 1e-6);
  assert.equal(line.projection.at(-1).cash, 0);
  assert.ok(line.points.some((point) => point.raise > 0), 'raises show as jumps');
});

test('What changed lists the raise and each release', () => {
  const state = SCENARIOS.era3Idle(1);
  const changes = billChanges(scenarioHistory(state), state.models);
  assert.ok(changes.some((change) => change.kind === 'raise'));
  assert.equal(changes.filter((change) => change.kind === 'release').length, state.models.filter((m) => m.releasedTurn != null).length);
  assert.deepEqual(changes.map((c) => c.turn), [...changes.map((c) => c.turn)].sort((a, b) => a - b));
});

test('out of cash: the cash line says so instead of drawing a run to zero', () => {
  const state = SCENARIOS.danger(1);
  state.cash = -50;
  const line = cashLine(state, []);
  assert.equal(line.outOfCash, true);
  assert.equal(line.runsOutIn, null);
});

test('a model released this round shows in What changed; an old one with no history row does not', () => {
  const models = [{ name: 'Old', releasedTurn: 2 }, { name: 'New', releasedTurn: 7 }];
  const changes = billChanges([], models, 30, 7);
  assert.deepEqual(changes.map((c) => c.name), ['New']);
  assert.equal(changes[0].month, 30);
});


test('income lines, runway and cash projection respond immediately to serving changes', () => {
  const state = createInitialState();
  state.models.push({
    name: 'Kestrel 1', active: true, activeFromTurn: 0, channel: 'consumer', priceStance: 'market', users: 2e6,
    spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
  });
  const need = updateServing(state);
  state.arr = 9999; // The last daily accounting entry must not override today's service changes.
  state.compute.split.coverWithSpot = false;
  for (const share of [1, 0.5, 0]) {
    state.compute.split.servingCap = need * share;
    const bill = monthBill(state);
    assert.equal(bill.servedShare, share);
    assert.equal(bill.income[0].amount, 10 * share);
    assert.equal(bill.moneyIn, 10 * share);
    const expectedRunway = state.cash / (projectBurn(state) - 10 * share);
    assert.equal(bill.runway, expectedRunway);
    assert.equal(cashLine(state, [], 100).runsOutIn, expectedRunway);
    assert.equal(weekFlows(state).moneyIn === 0, share === 0);
  }
  state.compute.split.coverWithSpot = true;
  const restored = monthBill(state);
  assert.equal(restored.servedShare, 1);
  assert.equal(restored.moneyIn, 10);
  assert.equal(cashLine(state, [], 100).runsOutIn, restored.runway);
});
