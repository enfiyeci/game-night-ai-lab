// The money readouts (owner picks 2026-09-26: the HUD's in and out line with weekly floats and the cash line, the Money
// screen's "This month" bill with reasons and its "What changed" pins). Every figure comes from the sim's own sums, so
// the lines here always add up to monthlyRevenue and projectBurn.
import { activeModels, monthlyRevenue, projectBurn, revenuePerUser, runway } from '../../sim/economy.js';
import { reviewerCost } from '../../sim/automation.js';
import { monthsPerDay } from '../../sim/time.js';
import { computeBar, idleComputeCost } from './compute.js';
import { opsMonthly } from './finance.js';

const BUDGET_PARTS = [['training', 'training'], ['security', 'security'], ['product', 'product'], ['talent', 'talent']];

// This month's money in and out, one line per cause. Amounts are $M a month; `jump` names the screen that changes it.
export function monthBill(state) {
  const usage = state.compute.surge?.usage ?? 1;
  const income = activeModels(state).map((model) => ({
    key: `model-${model.name}`,
    label: model.name,
    amount: (model.users * revenuePerUser(model) / 1e6) * usage,
    users: model.users,
    channel: model.channel,
    price: model.priceStance,
  }));
  const burn = projectBurn(state);
  const ops = opsMonthly(state.era);
  const budget = state.budget.spend;
  const reviewers = reviewerCost(state);
  const idleUnits = computeBar(state).segments.find((segment) => segment.key === 'idle')?.units ?? 0;
  const costs = [
    {
      key: 'compute',
      label: 'Compute',
      amount: burn - ops - budget - reviewers, // contracts, leases, spot cover and credits: the rest of the sim's burn
      units: state.compute.online,
      idleUnits,
      idleCost: idleComputeCost(state),
      jump: 'deals',
    },
    {
      key: 'budget',
      label: 'Lab budget',
      amount: budget,
      split: BUDGET_PARTS.map(([key, word]) => ({ word, share: state.budget.split[key] ?? 0 })),
      jump: 'budget',
    },
    { key: 'ops', label: 'Staff and office', amount: ops },
  ];
  if (reviewers > 0) costs.push({ key: 'reviewers', label: 'Human reviewers', amount: reviewers, jump: 'automation' });
  const moneyIn = monthlyRevenue(state);
  return { income, costs, moneyIn, moneyOut: burn, net: moneyIn - burn, runway: runway({ ...state, burnPlanned: burn }, 'planned') };
}

// What one story week brings in and costs at today's rates, for the HUD's floating numbers.
export function weekFlows(state) {
  const months = 7 * monthsPerDay(state);
  return { moneyIn: monthlyRevenue(state) * months, moneyOut: projectBurn(state) * months };
}

// The cash line: history marks, a jump at each raise, today, then a straight run to zero at today's net burn.
export function cashLine(state, history, horizon = 24) {
  const now = state.monthsElapsed + state.dayInRound * monthsPerDay(state);
  const points = [];
  for (const row of history) {
    points.push({ month: row.month, cash: row.cashStart });
    if (row.raised > 0) points.push({ month: row.month, cash: row.cashStart + row.raised, raise: row.raised });
    points.push({ month: row.month + row.months, cash: row.cashEnd });
  }
  points.push({ month: now, cash: state.cash });
  // Out of cash already: no run to zero to draw.
  if (state.cash <= 0) return { points, now, projection: [{ month: now, cash: state.cash }, { month: now, cash: state.cash }], runsOutIn: null, outOfCash: true };
  // The same net burn as the Runway readout (spending less the last day's revenue), so the two never disagree.
  const netBurn = projectBurn(state) - state.arr / 12;
  const left = netBurn > 0 ? state.cash / netBurn : Infinity;
  const ahead = Math.min(horizon, left);
  const end = { month: now + ahead, cash: left <= horizon ? 0 : state.cash - netBurn * ahead };
  return { points, now, projection: [{ month: now, cash: state.cash }, end], runsOutIn: left <= horizon ? left : null, outOfCash: false };
}

// "What changed": each round where one of the player's decisions moved the monthly bill or brought money in.
// Rows are the finance history (one per round mark); models carry the round they were released in.
const MIN_CHANGE = 3; // $M a month; smaller moves are users drifting, not a decision

export function billChanges(history, models = [], nowMonth = null, nowTurn = null) {
  const changes = [];
  history.forEach((row, index) => {
    const before = history[index - 1];
    if (row.raised > 0) changes.push({ kind: 'raise', month: row.month, turn: row.turn, amount: row.raised });
    if (before && Math.abs(row.computeBill - before.computeBill) >= MIN_CHANGE) {
      changes.push({ kind: 'compute', month: row.month, turn: row.turn, from: before.computeBill, to: row.computeBill, unitsFrom: before.online, unitsTo: row.online });
    }
    if (before && Math.abs(row.people - before.people) >= MIN_CHANGE) {
      changes.push({ kind: 'budget', month: row.month, turn: row.turn, from: before.people, to: row.people });
    }
  });
  for (const model of models) {
    if (model.releasedTurn == null) continue;
    const row = history.find((r) => r.turn === model.releasedTurn);
    const next = history.find((r) => r.turn === model.releasedTurn + 1);
    // Released this round: no history row yet, so it sits at today.
    if (!row && (nowMonth == null || model.releasedTurn !== nowTurn)) continue;
    changes.push({ kind: 'release', month: row?.month ?? nowMonth, turn: model.releasedTurn, name: model.name, from: row?.revenue ?? null, to: next?.revenue ?? null });
  }
  return changes.sort((a, b) => a.turn - b.turn || a.kind.localeCompare(b.kind));
}
