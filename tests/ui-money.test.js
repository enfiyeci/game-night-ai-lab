import test from 'node:test';
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
