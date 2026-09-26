// Mockup-only projection for the finance planner. Reads the live state and projects every turn left in the run.
// Signed compute comes straight from the state's contracts, deliveries and power sites. The plan adds the compute
// the player has not signed yet, billed at the base price from the turn after this one (the earliest a new deal
// can arrive). Revenue is held at today's level, and a planned round raises at today's valuation (both stated on
// screen).
import { BALANCE } from '../../../sim/balance.js';
import { ERAS, eraById } from '../../../sim/data/eras.js';
import { SPOT_PRICE } from '../../../sim/data/compute.js';
import { leaseMonthly } from '../../../sim/power.js';
import { monthlyRevenue, INVESTORS } from '../../../sim/economy.js';

export const UNIT = BALANCE.unitMonthlyCost;
export const LAST_TURN = ERAS.reduce((sum, e) => sum + e.turns, 0) - 1;
export const eraStart = (era) => ERAS.slice(0, era - 1).reduce((sum, e) => sum + e.turns, 0);

export function eraOfTurn(turn) {
  let start = 0;
  for (const e of ERAS) {
    if (turn < start + e.turns) return e.id;
    start += e.turns;
  }
  return ERAS.at(-1).id;
}

export const monthOfTurn = (turn) => {
  let m = 0;
  for (let t = 0; t < turn; t++) m += eraById(eraOfTurn(t)).monthsPerTurn;
  return m;
};

export const opsMonthly = (era) => BALANCE.baseOpsMonthly * (1 + 0.25 * (era - 1));
export const roundSize = (state) => Math.round(state.valuation * INVESTORS.vc.share);

// What is already signed at a future turn: running contracts, deliveries due by then, and powered sites.
export function signedAt(state, turn) {
  const era = eraOfTurn(turn);
  const ahead = monthOfTurn(turn) - monthOfTurn(state.turn);
  const live = [
    ...state.compute.contracts.map((c) => ({ ...c, left: c.monthsLeft == null ? Infinity : c.monthsLeft - ahead })),
    ...state.compute.pipeline.filter((p) => p.arrivesTurn <= turn).map((p) => ({
      ...p, units: p.headline ?? p.units, left: p.termMonths - (monthOfTurn(turn) - monthOfTurn(p.arrivesTurn)),
      needsPower: p.needsPower ?? (p.supplier === 'verde' && era >= 4),
    })),
  ].filter((c) => c.left > 1e-9 && !c.dark);
  const sites = state.power.sites.filter((s) => s.online || s.arrivesTurn <= turn);
  const power = sites.reduce((sum, s) => sum + s.units, 0);
  const own = live.filter((c) => !c.needsPower).reduce((sum, c) => sum + c.units, 0);
  const needs = live.filter((c) => c.needsPower).reduce((sum, c) => sum + c.units, 0);
  const bill = live.reduce((sum, c) => sum + c.units * (c.supplier === 'spot' ? SPOT_PRICE[era] : c.price) * UNIT, 0)
    + sites.reduce((sum, s) => sum + leaseMonthly(s.units), 0);
  return { units: own + Math.min(needs, power), bill };
}

// plan: { goals: { [era]: units }, raises: { [era]: true } }. A goal holds until the next era's goal.
export function project(state, plan = {}) {
  const goals = plan.goals ?? {};
  const raises = plan.raises ?? {};
  const revenue = monthlyRevenue(state);
  const people = state.budget.spend;
  const round = roundSize(state);
  const rows = [];
  let cash = state.cash;
  let goal = 0;
  for (let turn = state.turn; turn <= LAST_TURN; turn++) {
    const era = eraOfTurn(turn);
    const months = eraById(era).monthsPerTurn;
    if (goals[era] != null) goal = goals[era];
    const signed = signedAt(state, turn);
    const planned = turn > state.turn ? Math.max(0, goal - signed.units) : 0;
    const planBill = planned * UNIT;
    const ops = opsMonthly(era);
    const burn = signed.bill + planBill + ops + people;
    const raised = raises[era] && turn === Math.max(state.turn, eraStart(era)) && state.flags.lastRoundEra !== era ? round : 0;
    const cashStart = cash;
    cash += raised + (revenue - burn) * months;
    rows.push({
      turn, era, month: monthOfTurn(turn), months, signed: signed.units, planned, goal,
      signedBill: signed.bill, planBill, ops, people, revenue, burn, raised, cashStart, cashEnd: cash,
    });
  }
  const out = rows.find((r) => r.cashEnd < 0);
  return { rows, round, runsOut: out ?? null, lowest: Math.min(...rows.map((r) => r.cashEnd)), end: rows.at(-1).cashEnd };
}

// Per-era summary of the projection: monthly averages (weighted by months) and era-end cash.
export function byEra(rows) {
  const eras = [...new Set(rows.map((r) => r.era))];
  return eras.map((era) => {
    const rs = rows.filter((r) => r.era === era);
    const m = rs.reduce((s, r) => s + r.months, 0);
    const avg = (k) => rs.reduce((s, r) => s + r[k] * r.months, 0) / m;
    return {
      era, months: m, revenue: avg('revenue'), signedBill: avg('signedBill'), planBill: avg('planBill'),
      people: avg('people'), ops: avg('ops'), burn: avg('burn'), raised: rs.reduce((s, r) => s + r.raised, 0),
      computeEnd: rs.at(-1).signed + rs.at(-1).planned, cashEnd: rs.at(-1).cashEnd,
    };
  });
}
