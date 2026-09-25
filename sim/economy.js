import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { clamp } from './util.js';
import { servingCost, PRICE_STANCE, REVENUE_PER_USER } from './serving.js';

export function activeModels(state) {
  return state.models.filter((m) => m.active && m.channel !== 'open' && state.turn >= m.activeFromTurn);
}

export const safetySpend = (state) => state.budget.spend * state.budget.split.safety;

export const revenuePerUser = (model) => REVENUE_PER_USER[model.channel] * PRICE_STANCE[model.priceStance].rev;

export function updateServing(state) {
  const runUnits = state.activeRun ? state.activeRun.units : 0;
  const capacity = Math.max(0.001, state.compute.online - runUnits);
  const models = activeModels(state);
  const unitsAt = (load) =>
    models.reduce((s, m) => {
      m.servingCost = servingCost(m.spec, state.era, load);
      return s + (m.users * m.servingCost) / BALANCE.unitMonthlyDollars;
    }, 0);
  const light = unitsAt(0);
  const load = light / capacity;
  const units = load > 0.8 ? unitsAt(load) : light;
  state.compute.servingUnits = units;
  state.compute.overflow = Math.max(0, units - capacity);
  return units;
}

export function growUsers(state) {
  const months = eraById(state.era).monthsPerTurn;
  for (const m of activeModels(state)) {
    const g = (0.12 * PRICE_STANCE[m.priceStance].growth + (state.growthBoost ?? 0)) * (months / 3);
    m.users = Math.min(m.userCap, Math.round(m.users * (1 + g)));
  }
}

export function monthlyRevenue(state) {
  return activeModels(state).reduce((s, m) => s + m.users * revenuePerUser(m), 0) / 1e6;
}

export function computeRent(state) {
  return state.compute.contracts.reduce((s, c) => s + c.units * c.costMult, 0) * BALANCE.unitMonthlyCost;
}

export function projectBurn(state) {
  const spot = state.compute.overflow * BALANCE.unitMonthlyCost * BALANCE.spotPremium;
  const ops = BALANCE.baseOpsMonthly * (1 + 0.25 * (state.era - 1));
  const arrivingRent = state.compute.pipeline
    .filter((deal) => deal.arrivesTurn <= state.turn)
    .reduce((sum, deal) => sum + deal.units * deal.costMult, 0) * BALANCE.unitMonthlyCost;
  return ops + computeRent(state) + arrivingRent + spot + state.budget.spend;
}

export function valuationOf(state) {
  const base = Math.max(state.arr, 80);
  const multiple = base < 500 ? 60 : Math.max(15, 60 - 10 * Math.log2(base / 500));
  return base * multiple * state.sentiment;
}

export function applyEconomy(state) {
  const era = eraById(state.era);
  const burn = projectBurn(state);
  state.burnPlanned = burn;
  state.burnHistory.push(burn);
  const recent = state.burnHistory.slice(-3);
  state.burnTrailing = recent.reduce((a, b) => a + b, 0) / recent.length;
  const revenue = monthlyRevenue(state);
  state.arr = revenue * 12;
  state.cash += (revenue - burn) * era.monthsPerTurn;
  state.valuation = valuationOf(state);
}

export function runway(state, which) {
  const burn = which === 'trailing' ? state.burnTrailing : state.burnPlanned;
  const net = burn - state.arr / 12;
  return net <= 0 ? Infinity : state.cash / net;
}

export function legalTick(state) {
  const paid = state.legalCases.filter((c) => c.dueTurn <= state.turn);
  state.legalCases = state.legalCases.filter((c) => c.dueTurn > state.turn);
  for (const c of paid) {
    state.cash -= c.cost;
    state.publicTrust -= 3;
  }
  return paid;
}

export const INVESTORS = {
  vc: { name: 'Growth fund', share: 0.1 },
  strategic: { name: 'Strategic cloud partner', share: 0.06, units: 10, costMult: 0.8 },
  sovereign: { name: 'Sovereign wealth fund', share: 0.15 },
};

export function raiseRound(state, archetype) {
  if (state.era < 2) return { ok: false, error: 'funding rounds open in era 2' };
  if (!Object.hasOwn(INVESTORS, archetype)) return { ok: false, error: `unknown investor ${archetype}` };
  const inv = INVESTORS[archetype];
  if (state.flags.lastRoundEra === state.era) return { ok: false, error: 'already raised a round this era' };
  const amount = Math.round(state.valuation * inv.share);
  state.cash += amount;
  state.flags.lastRoundEra = state.era;
  state.board = state.board.map((s) => s - 3);
  if (archetype === 'vc') state.board[0] += 8;
  if (archetype === 'strategic') {
    state.compute.pipeline.push({ supplier: 'strategic', units: inv.units, costMult: inv.costMult, failChance: 0, arrivesTurn: state.turn + 1 });
    state.flags.strategicStrings = true;
  }
  if (archetype === 'sovereign') {
    state.govFavor.us -= 5;
    state.publicTrust -= 4;
    state.staffTrust -= 3;
  }
  return { ok: true, amount };
}

export const inDangerZone = (state) => state.cash <= 0 || runway(state, 'planned') < BALANCE.dangerZoneRunwayMonths;

// Real-world models: docs/research/runway-history/runway_history.md
export const EMERGENCY_OPTIONS = {
  equityForCompute: 'Trade equity for compute: cash and cheap capacity now, less independence later.',
  structureChange: 'Change your corporate structure: a big raise with a deadline attached.',
  bridgeRound: 'Bridge round with forgiven debt: survive, at a lower valuation.',
  acquihire: 'Accept an acquihire: a tech giant licenses your models and hires your team. The run ends.',
};

export function useEmergency(state, option) {
  if (!Object.hasOwn(EMERGENCY_OPTIONS, option)) return { ok: false, error: `unknown option ${option}` };
  if (!inDangerZone(state)) return { ok: false, error: 'emergency options open only when runway is short' };
  const used = (state.flags.emergencyUsed ??= []);
  if (used.includes(option)) return { ok: false, error: 'already used' };
  used.push(option);
  if (option !== 'acquihire') state.flags.emergencyUsedThisTurn = true;
  if (option === 'equityForCompute') {
    state.cash += 300;
    state.compute.pipeline.push({ supplier: 'equity-partner', units: 10, costMult: 0.5, failChance: 0, arrivesTurn: state.turn + 1 });
    state.board = state.board.map((s) => s - 8);
    state.flags.independenceLost = true;
  }
  if (option === 'structureChange') {
    state.cash += Math.round(state.valuation * 0.2);
    state.flags.conversionDeadline = state.turn + 8;
    state.publicTrust -= 3;
    state.staffTrust -= 5;
  }
  if (option === 'bridgeRound') {
    state.cash += 150;
    state.sentiment = clamp(state.sentiment - 0.2, 0.5, 1.5);
  }
  if (option === 'acquihire') state.ending = 'acquihire';
  return { ok: true, option };
}
