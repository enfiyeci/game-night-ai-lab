import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { clamp } from './util.js';
import { startRun, advanceRun } from './training.js';
import { activateReleases, releaseModel } from './release.js';
import { signDeal, computeTurn } from './compute.js';
import { updateServing, growUsers, applyEconomy, legalTick, projectBurn, raiseRound, useEmergency } from './economy.js';
import { researchTechnique } from './techniques.js';
import { rivalsTurn } from './rivals.js';
import { updateBoard } from './board.js';
import { checkTurnEndings, eraGate, finalEnding } from './endings.js';
import { recordAdvisors } from './advisors.js';

export const MAX_MOVES = 2;
const BUDGET_KEYS = ['training', 'safety', 'security', 'product', 'talent'];

export function setBudget(state, budget) {
  const spend = budget?.spend;
  if (!Number.isFinite(spend) || spend < 0 || spend > 200) return { ok: false, error: 'spend must be between 0 and 200 $M per month' };
  const values = BUDGET_KEYS.map((k) => budget?.split?.[k]);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return { ok: false, error: 'budget split values must be finite and non-negative' };
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 1) > 0.001) return { ok: false, error: 'the budget split must add up to 100%' };
  state.budget = { spend, split: Object.fromEntries(BUDGET_KEYS.map((k, i) => [k, values[i]])) };
  return { ok: true };
}

function applyMove(state, move, rng) {
  switch (move.type) {
    case 'startRun': return startRun(state, move.recipe);
    case 'release': return releaseModel(state, move.release, rng);
    case 'deal': return signDeal(state, move.supplierId);
    case 'raise': return raiseRound(state, move.archetype);
    case 'research': return researchTechnique(state, move.techId);
    case 'emergency': return useEmergency(state, move.option);
    default: return { ok: false, error: `unknown move ${move.type}` };
  }
}

// Discretionary spend buys points each turn: $30M/month for a quarter ≈ 3 points.
function budgetEffects(state) {
  const { spend, split } = state.budget;
  const k = (spend * eraById(state.era).monthsPerTurn) / 30;
  if (state.activeRun) state.activeRun.bonus += split.training * k;
  state.alignmentDebt -= split.safety * k * 0.5;
  state.security += split.security * k - 0.5;
  state.growthBoost = split.product * k * 0.02;
  state.researchPoints += split.talent * k * 3;
  state.staffTrust += split.talent * k * 0.3 - 0.3;
}

function normalize(state) {
  for (const key of ['alignmentDebt', 'misuseExposure', 'misuseLocked', 'security', 'raceHeat', 'publicTrust', 'staffTrust']) {
    state[key] = clamp(state[key], 0, 100);
  }
  state.perceivedAdOffset = clamp(state.perceivedAdOffset, 0, 100);
  state.govFavor.us = clamp(state.govFavor.us, 0, 100);
  state.govFavor.intl = clamp(state.govFavor.intl, 0, 100);
}

export function endTurn(prev, actions = {}, rng) {
  const state = structuredClone(prev);
  const events = [];
  const errors = [];
  delete state.flags.emergencyUsedThisTurn;
  if (state.ending) return { state, events, errors: ['the run is over'] };

  activateReleases(state);
  updateServing(state);
  state.burnPlanned = projectBurn(state);

  if (actions.budget) {
    const r = setBudget(state, actions.budget);
    if (!r.ok) errors.push(r.error);
    else state.burnPlanned = projectBurn(state);
  }
  const moves = actions.moves ?? [];
  if (moves.length > MAX_MOVES) errors.push(`only ${MAX_MOVES} moves per turn`);
  for (const move of moves.slice(0, MAX_MOVES)) {
    const r = applyMove(state, move, rng);
    if (r.ok) {
      events.push({ type: move.type, ...r });
      updateServing(state);
      state.burnPlanned = projectBurn(state);
    } else errors.push(r.error);
    if (state.ending) break;
  }

  if (!state.ending) {
    const before = { arr: state.arr, capability: state.capability, cash: state.cash };
    budgetEffects(state);
    const trained = advanceRun(state, rng);
    if (trained) events.push({ type: 'runComplete', gain: trained.gain });
    const { arrived, failed } = computeTurn(state, rng);
    for (const a of arrived) events.push({ type: 'computeArrived', supplier: a.supplier, units: a.units });
    for (const f of failed) events.push({ type: 'computeFailed', supplier: f.supplier, units: f.units });
    growUsers(state);
    updateServing(state);
    applyEconomy(state);
    if (state.flags.conversionDeadline != null && state.turn >= state.flags.conversionDeadline && !state.flags.converted) {
      state.flags.converted = true;
      state.board = state.board.map((support) => support - 6);
      state.publicTrust -= 4;
      state.staffTrust -= 6;
      events.push({ type: 'conversionFight' });
    }
    for (const c of legalTick(state)) events.push({ type: 'lawsuitPaid', cost: c.cost, source: c.source });
    for (const r of rivalsTurn(state, rng)) events.push({ type: 'rivalRelease', ...r });
    state.raceHeat -= BALANCE.raceHeatDecay;
    normalize(state);
    updateBoard(state, before);
    checkTurnEndings(state, rng);
  }

  recordAdvisors(state, rng);
  const era = eraById(state.era);
  state.turn += 1;
  state.turnInEra += 1;
  state.monthsElapsed += era.monthsPerTurn;
  if (!state.ending && state.turnInEra >= era.turns) {
    eraGate(state);
    if (!state.ending) {
      if (state.era === 5) {
        if (state.flags.insolvent && state.cash <= 0) state.ending = 'acquihire';
        else finalEnding(state);
      }
      else {
        state.era += 1;
        state.turnInEra = 0;
        events.push({ type: 'eraStart', era: state.era });
      }
    }
  }
  if (state.ending) events.push({ type: 'ending', ending: state.ending });
  return { state, events, errors };
}
