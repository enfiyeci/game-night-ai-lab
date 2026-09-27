// The finance planner's numbers: a per-turn record of what the lab earned and spent (the sim keeps only the burn),
// and a projection of every turn left in the run for a plan of compute goals and funding rounds.
//
// Signed compute follows the state's contracts, deliveries and power sites the way the sim runs them: terms end,
// warned spot contracts are pulled, pooled compute is set aside, cloud credits pay Azuria bills until spent, and a
// letter of intent counts only the 30% it is sure to deliver. This turn's row adds today's spot cover and idle
// resale exactly, so it equals the sim's burn. Later turns hold today's serving shortfall (minus the plan's new
// compute, which covers it first) and today's idle units at their level, priced for that era.
// Compute the player has not signed yet is billed at the base price from the next turn, the earliest a new deal can
// arrive. Revenue is held at today's level; a second, dotted series grows today's users the way growUsers does
// (no new releases). A planned round raises at today's valuation. Nothing here changes the state.
import { BALANCE } from '../../sim/balance.js';
import { ERAS, eraById } from '../../sim/data/eras.js';
import { RESALE, spotPrice } from '../../sim/data/compute.js';
import { leaseMonthly } from '../../sim/power.js';
import { activeModels, monthlyRevenue, revenuePerUser, roundAmount } from '../../sim/economy.js';
import { computeSlices, resaleCredit, spotCover } from '../../sim/split.js';
import { PRICE_STANCE } from '../../sim/serving.js';
import { reviewerCost } from '../../sim/automation.js';
import { roundSpan, storyDate } from '../../sim/time.js';
import { storyDayForTurn } from './format.js';

export const UNIT_PRICE = BALANCE.unitMonthlyCost;
export const LAST_TURN = ERAS.reduce((sum, era) => sum + era.turns, 0) - 1;
export const eraStart = (era) => ERAS.slice(0, era - 1).reduce((sum, e) => sum + e.turns, 0);

export function eraOfTurn(turn) {
  let start = 0;
  for (const era of ERAS) {
    if (turn < start + era.turns) return era.id;
    start += era.turns;
  }
  return ERAS.at(-1).id;
}

// Owner rule 2026-09-26: the planner never names an era the player has not reached. A later era is called by the
// clock date (the HUD's Y M W) of its first day, and a deadline in it by the date of its last day.
const firstDay = (era) => storyDate(storyDayForTurn(eraStart(era))).label;
const lastDay = (era) => storyDate(storyDayForTurn(eraStart(era) + eraById(era).turns) - 1).label;
export const eraLabel = (state, era) => (era <= state.era ? `Era ${era}` : `From ${firstDay(era)}`);
export const eraTitle = (state, era) => (era <= state.era ? eraById(era).name : '');
export const eraEndWords = (state, era) => (era <= state.era ? `the end of era ${era}` : lastDay(era));

export function monthOfTurn(turn) {
  let month = 0;
  for (let t = 0; t < turn; t++) month += eraById(eraOfTurn(t)).monthsPerTurn;
  return month;
}

export const opsMonthly = (era) => BALANCE.baseOpsMonthly * (1 + 0.25 * (era - 1));
export const roundSize = (state) => roundAmount(state, 'vc');
const roundOpen = (state, era) => era >= 2 && state.flags.lastRoundEra !== era;

// One row per finished turn, built from the state before and after endTurn and the turn's events.
export function turnRecord(before, after, events = []) {
  const months = eraById(before.era).monthsPerTurn;
  const revenue = after.arr / 12;
  const burn = after.lastRoundBurn ?? after.burnHistory.at(-1) ?? 0; // the round's day-by-day average (sim/turn.js)
  const ops = opsMonthly(before.era);
  // Reviewers are people too: their pay joins "people and programs", never the compute bill.
  const people = after.lastRoundPeople ?? after.budget.spend + reviewerCost({ automation: after.automation, era: before.era });
  const raised = events.filter((e) => e.type === 'raise' && e.ok).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  return {
    turn: before.turn,
    era: before.era,
    month: before.monthsElapsed,
    months,
    online: before.compute.online,
    revenue,
    burn,
    ops,
    people,
    computeBill: burn - ops - people, // net: credits and idle resale can take it below zero
    raised,
    oneOffs: after.cash - before.cash - (revenue - burn) * months - raised,
    cashStart: before.cash,
    cashEnd: after.cash,
  };
}

export const LOI_SURE_SHARE = 0.3; // sim/contracts.js arrive(): a letter of intent delivers 30-100% of its headline

// What is already signed at a future turn: running contracts, deliveries due by then, and powered sites. bill is
// the gross monthly bill; azuria is the part of it that cloud credits can pay.
// Stage 2: a delivery or site due at the start of round arrivesTurn lands on landsDay inside the round before it.
const landsIn = (item, turn) => item.landsDay != null && item.arrivesTurn === turn + 1;
// The share of row `turn` after the item lands (the sim bills it from the day after it lands to the mark).
function landedShare(item, turn) {
  const { start, end } = roundSpan(turn);
  return Math.max(0, Math.min(1, (end - item.landsDay) / (end - start)));
}
// The months of its term a delivery uses up before its old start date.
function earlyMonths(item) {
  if (item.landsDay == null) return 0;
  const { start, end } = roundSpan(item.arrivesTurn - 1);
  return Math.max(0, end - item.landsDay) * (eraById(eraOfTurn(item.arrivesTurn - 1)).monthsPerTurn / (end - start));
}

// The row's average monthly credit: at each moment the sim pays min(the Azuria bill running then, cap), where cap is
// the credits per month at the row's start (they are only spent at the mark).
function averageCredit(spans, cap) {
  const cuts = [...new Set([0, 1, ...spans.flatMap((span) => [span.from, span.to])])].sort((a, b) => a - b);
  let credit = 0;
  for (let i = 0; i < cuts.length - 1; i += 1) {
    const mid = (cuts[i] + cuts[i + 1]) / 2;
    const bill = spans.filter((span) => span.from <= mid && mid < span.to).reduce((sum, span) => sum + span.bill, 0);
    credit += (cuts[i + 1] - cuts[i]) * Math.min(bill, cap);
  }
  return credit;
}

export function signedAt(state, turn) {
  const era = eraOfTurn(turn);
  const ahead = monthOfTurn(turn) - monthOfTurn(state.turn);
  const live = [
    ...state.compute.contracts
      .filter((c) => c.bumpTurn == null || c.bumpTurn >= turn)
      .map((c) => ({ ...c, left: c.monthsLeft == null ? Infinity : c.monthsLeft - ahead })),
    ...state.compute.pipeline.filter((p) => p.arrivesTurn <= turn || (turn > state.turn && landsIn(p, turn))).map((p) => ({
      ...p,
      // Due now but not delivered yet, the sim bills the whole headline (arrivingBills); later, only what is sure.
      units: p.headline == null ? p.units : p.arrivesTurn <= state.turn ? p.headline : Math.round(p.headline * LOI_SURE_SHARE),
      // A term starts the day it lands (stage 2), so a delivery that lands early also ends that much earlier.
      left: p.termMonths == null ? Infinity : p.termMonths - (monthOfTurn(turn) - monthOfTurn(p.arrivesTurn)) - earlyMonths(p),
      landing: landsIn(p, turn) ? landedShare(p, turn) : 1,
      needsPower: p.needsPower ?? (p.supplier === 'verde' && era >= 4),
    })),
  ].filter((c) => c.left > 1e-9 && !c.dark);
  // Terms end on days (stage 2): in a later row, a contract that ends partway bills its share and adds no capacity.
  const rowMonths = eraById(era).monthsPerTurn;
  // In a later row, a contract that ends partway or lands partway bills its share and adds no capacity.
  const share = (c) => (turn > state.turn ? (Number.isFinite(c.left) ? Math.min(1, c.left / rowMonths) : 1) * (c.landing ?? 1) : 1);
  const whole = live.filter((c) => share(c) >= 1 - 1e-9);
  const sites = state.power.sites.filter((s) => s.online || s.arrivesTurn <= turn);
  const landingSites = turn > state.turn ? state.power.sites.filter((s) => !s.online && landsIn(s, turn)) : [];
  const power = sites.reduce((sum, s) => sum + s.units, 0);
  const own = whole.filter((c) => !c.needsPower).reduce((sum, c) => sum + c.units, 0);
  const needs = whole.filter((c) => c.needsPower).reduce((sum, c) => sum + c.units, 0);
  // Spot renews at the new price from the next turn (syncContracts); this turn it bills what it stored.
  const spotAt = (c) => (turn === state.turn ? c.price : spotPrice(state, era));
  const billOf = (c) => c.units * (c.supplier === 'spot' ? spotAt(c) : c.price) * UNIT_PRICE;
  const bill = live.reduce((sum, c) => sum + billOf(c) * share(c), 0) + sites.reduce((sum, s) => sum + leaseMonthly(s.units), 0)
    + landingSites.reduce((sum, s) => sum + leaseMonthly(s.units) * landedShare(s, turn), 0);
  const azuria = live.filter((c) => c.supplier === 'azuria').reduce((sum, c) => sum + billOf(c) * share(c), 0);
  // When each Azuria contract runs inside the row (0 = row start, 1 = its mark): credits pay only while one runs.
  const azuriaSpans = live.filter((c) => c.supplier === 'azuria').map((c) => ({
    from: turn > state.turn ? 1 - (c.landing ?? 1) : 0,
    to: turn > state.turn && Number.isFinite(c.left) ? Math.min(1, c.left / rowMonths) : 1,
    bill: billOf(c),
  }));
  const raw = own + Math.min(needs, power);
  const prices = whole.map((c) => ({ units: c.units, price: c.supplier === 'spot' ? spotAt(c) : c.price }));
  // refreshOnline: pooled compute goes to the government pool; it is still billed.
  return { units: Math.floor(raw * (1 - (state.compute.pooled ?? 0))), raw, bill, azuria, azuriaSpans, prices };
}

// Eras that still have a turn after this one: only those can take new compute (a deal signed now arrives next turn).
export const futureEras = (state) => [...new Set(Array.from({ length: Math.max(0, LAST_TURN - state.turn) }, (_, i) => eraOfTurn(state.turn + 1 + i)))];

// A plan starts by keeping today's compute for every era left.
export function defaultPlan(state) {
  return { goals: Object.fromEntries(futureEras(state).map((era) => [era, state.compute.online])), raises: {} };
}

// What "Promise it to the board" offers: the goal of the nearest era with a turn still ahead, so the board can judge
// it on that era's last turn. Null with a promise already open, no era left or a goal of zero.
export function boardPromiseOffer(state, plan) {
  const era = futureEras(state)[0];
  if (era == null || state.boardPromise?.status === 'open' || !(plan.goals[era] > 0)) return null;
  return { units: plan.goals[era], era };
}

// Goals never fall in later eras: raising one lifts the later ones, lowering one lowers the earlier ones.
export function setGoal(plan, era, units, eras) {
  const goals = { ...plan.goals, [era]: Math.max(0, Math.round(units)) };
  for (const e of eras) {
    if (e > era && goals[e] < goals[era]) goals[e] = goals[era];
    if (e < era && goals[e] > goals[era]) goals[e] = goals[era];
  }
  return { ...plan, goals };
}

export const raiseAllowed = roundOpen;

// Eras a round can still be planned in: this one (raiseRound is legal now, even on an era's last turn) and later ones.
export const roundEras = (state) => [...new Set([state.era, ...futureEras(state)])].filter((era) => era >= 2);

export function project(state, plan) {
  const goals = plan.goals ?? {};
  const raises = plan.raises ?? {};
  // A usage surge (sim/turn.js) scales revenue until its turns run out, then clears.
  const surge = state.compute.surge;
  const usageAt = (k) => (surge && k < surge.turnsLeft ? surge.usage ?? 1 : 1);
  const baseRevenue = monthlyRevenue(state) / usageAt(0);
  const budgetSpend = state.budget.spend;
  const round = roundSize(state);
  const pooled = state.compute.pooled ?? 0;
  const slices = computeSlices(state);
  const cover = state.compute.split.coverWithSpot;
  const resell = state.compute.split.resellIdle;
  const users = activeModels(state).map((m) => ({ users: m.users, cap: m.userCap, perUser: revenuePerUser(m), growth: PRICE_STANCE[m.priceStance].growth }));
  const rows = [];
  let cash = state.cash;
  let credits = state.compute.credits ?? 0;
  let goal = 0;
  for (let turn = state.turn; turn <= LAST_TURN; turn++) {
    const era = eraOfTurn(turn);
    const months = eraById(era).monthsPerTurn;
    if (goals[era] != null) goal = goals[era];
    const k = turn - state.turn;
    const revenue = baseRevenue * usageAt(k);
    const signed = signedAt(state, turn);
    const planned = turn > state.turn ? Math.max(0, goal - signed.units) : 0;
    // New compute is pooled like the rest: buy the fewest units whose total, after pooling, reaches the goal.
    let bought = 0;
    if (planned > 0) {
      const usable = (b) => Math.floor((signed.raw + b) * (1 - pooled));
      bought = Math.max(0, Math.ceil(goal / (1 - pooled) - signed.raw) - 1);
      while (usable(bought) < goal) bought += 1;
    }
    const planBill = bought * UNIT_PRICE;
    const ops = opsMonthly(era);
    const people = budgetSpend + reviewerCost({ automation: state.automation, era }); // reviewers' pay grows by era
    // creditOffset, spent the way spendCredits spends it, day by day: min(Azuria bill running now, credits per month)
    const credit = averageCredit(signed.azuriaSpans, credits / months);
    credits = Math.max(0, credits - credit * months);
    // Compute above today's level covers today's shortfall first and then sits idle; compute below it idles less first.
    const delta = signed.units + planned - state.compute.online;
    let shortfall = slices.shortfall;
    let idle = slices.idle;
    if (delta >= 0) {
      const used = Math.min(shortfall, delta);
      shortfall -= used;
      idle += delta - used;
    } else {
      const lost = Math.min(idle, -delta);
      idle -= lost;
      shortfall += -delta - lost;
    }
    // resaleCredit: idle units come from the cheapest contracts first and never earn more than they bill.
    let resale = 0;
    let left = idle;
    for (const c of [...signed.prices, { units: bought, price: 1 }].sort((a, b) => a.price - b.price)) {
      const n = Math.min(left, c.units);
      resale += n * Math.min(RESALE[era], c.price) * UNIT_PRICE;
      left -= n;
    }
    const today = turn === state.turn
      ? spotCover(state) - resaleCredit(state)
      : (cover ? shortfall * spotPrice(state, era) * UNIT_PRICE : 0) - (resell ? resale : 0);
    const signedBill = signed.bill - credit + today;
    const burn = signedBill + planBill + ops + people;
    const raised = raises[era] && roundOpen(state, era) && turn === Math.max(state.turn, eraStart(era)) ? round : 0;
    // growUsers runs before the economy bills the turn, so each turn's growth comes first.
    const boost = state.budget.split.product * ((state.budget.spend * months) / 30) * 0.02;
    for (const m of users) m.users = Math.min(m.cap, Math.round(m.users * (1 + (0.12 * m.growth + boost) * (months / 3))));
    const grown = (users.reduce((sum, m) => sum + m.users * m.perUser, 0) / 1e6) * usageAt(k);
    const cashStart = cash;
    cash += raised + (revenue - burn) * months;
    rows.push({
      turn, era, month: monthOfTurn(turn), months, signed: signed.units, planned, bought, goal: Math.max(goal, signed.units),
      signedBill, planBill, credit, ops, people, revenue, grownRevenue: grown, burn, raised, cashStart, cashEnd: cash,
    });
  }
  const out = rows.find((r) => r.cashEnd < 0);
  // The month the cash reaches zero, inside the turn where it goes negative (months counted from the run's start).
  const runsOut = out ? { ...out, atMonth: out.month + Math.max(0, out.cashStart + out.raised) / Math.max(1e-9, out.burn - out.revenue) } : null;
  return { rows, round, runsOut, lowest: Math.min(...rows.map((r) => r.cashEnd)), end: rows.at(-1).cashEnd };
}

// Monthly averages by era (weighted by months), era totals for rounds and one-offs, and era-end cash and compute.
export function byEra(rows, { actual = false } = {}) {
  return [...new Set(rows.map((r) => r.era))].map((era) => {
    const rs = rows.filter((r) => r.era === era);
    const months = rs.reduce((sum, r) => sum + r.months, 0);
    const avg = (key) => rs.reduce((sum, r) => sum + (r[key] ?? 0) * r.months, 0) / months;
    const last = rs.at(-1);
    return {
      era,
      months,
      actual,
      revenue: avg('revenue'),
      signedBill: actual ? avg('computeBill') : avg('signedBill'),
      planBill: actual ? 0 : avg('planBill'),
      people: avg('people'),
      ops: avg('ops'),
      burn: avg('burn'),
      raised: rs.reduce((sum, r) => sum + r.raised, 0),
      oneOffs: actual ? rs.reduce((sum, r) => sum + r.oneOffs, 0) : null,
      computeEnd: actual ? last.online : last.signed + last.planned,
      cashEnd: last.cashEnd,
    };
  });
}

// Burn over revenue, rounded: 1 reads "a little more than we earn", never "1 times".
const spendWords = (ratio) => (ratio <= 1 ? 'a little more than we earn' : `${ratio} times what we earn`);
const unitWords = (count) => `${count} ${count === 1 ? 'unit' : 'units'}`;

// The team's reading of a plan. Every line is computed from the projection or from the sim's own rules.
export function planOpinions(state, projection, plan) {
  const eras = byEra(projection.rows);
  const last = eras.at(-1);
  const today = Math.max(1, projection.rows[0].revenue);
  const ratio = Math.round(last.burn / today);
  const finalGoal = plan.goals[last.era] ?? state.compute.online;
  const growth = finalGoal / Math.max(1, state.compute.online);
  const era4Goal = plan.goals[4];
  const out = projection.runsOut;
  const byEnd = last.era <= state.era ? `by era ${last.era}` : 'by the end of the plan';
  const opinions = [
    {
      id: 'cfo',
      mood: out ? 'alarmed' : projection.lowest < 500 ? 'uneasy' : 'calm',
      text: projection.rows[0].revenue < 1
        ? `We earn nothing yet and spend ${Math.round(last.burn)} million a month ${byEnd}.${out ? ` We're out in month ${Math.floor(out.atMonth)}.` : ''}`
        : out
          ? `We spend ${spendWords(ratio)} ${byEnd}. Without more money we're out in month ${Math.floor(out.atMonth)}.`
          : last.burn <= last.revenue
            ? `It holds. ${byEnd[0].toUpperCase()}${byEnd.slice(1)} we earn more than we spend.`
            : `It holds. We spend ${spendWords(ratio)} ${byEnd}.`,
    },
    {
      id: 'research',
      mood: growth >= 3 ? 'eager' : 'calm',
      text: growth >= 1.5 ? `${Math.round(growth)} times the compute we run today.` : 'That keeps us about where we are. Rivals will not wait.',
    },
    {
      id: 'safety',
      mood: 'calm',
      text: era4Goal != null
        ? `At our ${Math.round(state.compute.split.safety * 100)}% share, ${state.era >= 4 ? 'this era' : 'later on'}, safety gets ${unitWords(Math.round(era4Goal * state.compute.split.safety))}.`
        : `At our ${Math.round(state.compute.split.safety * 100)}% share, safety gets ${unitWords(Math.round(finalGoal * state.compute.split.safety))}.`,
    },
  ];
  if (state.era <= 3 && era4Goal != null) {
    opinions.push({ id: 'policy', mood: 'uneasy', text: 'Chips we own will need power of their own later on, and grid reservations will not stay open forever.' });
  } else {
    opinions.push({ id: 'policy', mood: out ? 'uneasy' : 'calm', text: out ? 'Running out of money in public is the story I cannot spin.' : 'A plan that holds is one I can explain.' });
  }
  return opinions;
}
