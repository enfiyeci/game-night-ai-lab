import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { SIZE_CAP, LENGTHS, validateRecipe, recipeCost, recipeCards, talentSpend, focusEffects } from './recipe.js';
import { standardTechniques } from './techniques.js';
import { rollTrainingHazard, applyAlignmentFaking, evalGamingDebt, dangerCapability } from './hazards.js';
import { draftError, draftFor, hasLine, learnConstitution } from './constitution.js';
import { computeSlices } from './split.js';
import { unitMonthlyPrice } from './economy.js';

export const SHARED_SAFETY_DEBT_MULT = 0.7;

export const availableUnits = (state) => computeSlices(state).idle;

export function startRun(state, recipe) {
  if (state.activeRun) return { ok: false, error: 'a training run is already active' };
  if (state.pendingModel) return { ok: false, error: 'release the trained model first' };
  const check = validateRecipe(state, recipe);
  if (!check.ok) return { ok: false, error: check.errors.join('; ') };
  const cost = recipeCost(state, recipe);
  if (cost.cash > state.cash) return { ok: false, error: 'not enough cash' };
  if (cost.units > availableUnits(state)) return { ok: false, error: 'not enough free compute' };
  const teaches = recipe.picks?.post?.includes('constitution');
  const draft = teaches ? draftFor(state) : null;
  const draftProblem = draft && draftError(draft);
  if (draftProblem) return { ok: false, error: /ruling/.test(draftProblem) ? draftProblem : 'Safety’s draft needs exactly three hard lines' }; // OWNER WRITES
  // The spike risk the recipe chose: its cards' spike terms plus the focus term (stability's -0.1 cancels moe's +0.1).
  const spikeRisk = recipeCards(state, recipe).reduce((p, c) => p + (c.effects.spike ?? 0), 0) + focusEffects(state, recipe).spike;
  const spikeChance = 0.1 + spikeRisk;
  state.cash -= cost.cash;
  // Focus effects are fixed when the run starts, so a stage that opens mid-run cannot change them.
  const focus = focusEffects(state, recipe);
  state.activeRun = { recipe: structuredClone(recipe), units: cost.units, turnsLeft: cost.turns, spikes: 0, spikeChance: Math.max(0, spikeChance), spikeRisk, bonus: 0, focus, spent: { cash: cost.cash, compute: 0 } };
  if (teaches) {
    state.activeRun.constitution = { hardLines: draft.hardLines, rulings: draft.rulings };
    // The changes this model learns; they leave the draft's "who asked" list when the run finishes.
    state.activeRun.constitutionChanges = draft.changes.length;
    state.constitutionDraft = { ...structuredClone(state.activeRun.constitution), changes: structuredClone(draft.changes) };
  }
  return { ok: true, cost };
}

// _rng: kept so callers don't shift; training draws nothing (owner 2026-09-26)
export function advanceRunBy(state, _rng, fraction) {
  const run = state.activeRun;
  if (!run) return null;
  // Capacity is checked once per round, as the balance was tuned; a player action rechecks it.
  if (fraction >= 1 || run.capacityTurn !== state.turn) {
    run.capacityTurn = state.turn;
    run.canAdvance = computeSlices(state).training >= run.units;
  }
  // The run's own bill: the units it holds, at today's price of a unit. A paused run still holds what training has.
  const held = run.canAdvance ? run.units : Math.min(run.units, computeSlices(state).training);
  run.spent ??= { cash: 0, compute: 0 };
  run.spent.compute += held * fraction * eraById(state.era).monthsPerTurn * unitMonthlyPrice(state);
  if (!run.canAdvance) return { type: 'runPaused' };
  // Stated condition (A9 review): a run whose recipe chose spike risk above 0 meets exactly one loss spike, the first
  // time it advances, so the player sees it during the run. A rollback answer does not bring it back.
  if (!run.spikeMet && (run.spikeRisk ?? 0) > 1e-9) {
    run.spikes += 1;
    run.spikeMet = true;
  }
  run.turnsLeft -= fraction;
  if (run.turnsLeft > 1e-9) return null;
  state.activeRun = null;
  if (run.constitution) {
    learnConstitution(state, run.constitution);
    state.constitutionDraft.changes = state.constitutionDraft.changes.slice(run.constitutionChanges ?? 0);
  }
  state.pendingModel = resolveRun(state, run);
  state.pendingModel.trainingCost = (run.spent?.cash ?? 0) + (run.spent?.compute ?? 0);
  if (run.uncapped) state.pendingModel.uncapped = true; // run past the Geneva cap
  return state.pendingModel;
}

export const advanceRun = (state) => advanceRunBy(state, null, 1);

// A player action (a new compute split, a deal, a release) can change training capacity mid-round.
export function recheckCapacity(state) {
  if (state.activeRun) delete state.activeRun.capacityTurn;
}

export function resolveRun(state, run) {
  const { size, length, alignShare } = run.recipe.sliders;
  const cards = recipeCards(state, run.recipe);
  const autos = standardTechniques(state).map((t) => t.auto).filter(Boolean);
  const { readiness: focusReadiness, spike: _focusSpike, ...focus } = run.focus ?? focusEffects(state, run.recipe);
  const effects = [
    ...cards.map((card) => {
      if (card.id === 'thumbs' && hasLine(state, 'no-manipulation')) {
        return { ...card.effects, usersMult: 1.05, flags: (card.effects.flags ?? []).filter((flag) => flag !== 'sycophancy') };
      }
      if (card.id === 'agentic-rl' && hasLine(state, 'no-autonomy-grab')) {
        return { ...card.effects, capReady: (card.effects.capReady ?? 0) - 2 };
      }
      return card.effects;
    }),
    ...autos,
    focus,
  ];
  const readiness = Math.max(0, Math.min(1.2, cards.reduce((r, c) => c.effects.readiness ?? r, 0.5) + focusReadiness));
  const large = size === 'large' || size === 'xl';

  let base = BALANCE.baseRunGain + SIZE_CAP[size] + LENGTHS[length].cap + (run.bonus ?? 0);
  for (const e of effects) {
    base += (e.cap ?? 0) * (e.halfForLarge && large ? 0.5 : 1);
    base += (e.capReady ?? 0) * readiness;
  }
  // Each $20M/month of talent spend adds 1.0; the typical $4M spend preserves the old +0.2.
  const talent = 0.8 + talentSpend(state) / 20;
  const nextRunCapPenalty = state.flags.nextRunCapPenalty ?? 0;
  delete state.flags.nextRunCapPenalty;
  const spikeFactor = (n) => Math.max(0.2, 1 - 0.2 * n);
  const gainWith = (n) => Math.max(0, Math.max(0, base) * talent * (1 - 0.5 * alignShare) * spikeFactor(n) - nextRunCapPenalty);
  const uncappedGain = gainWith(run.spikes);
  // Past the Geneva cap only when the player chose to break the deal for this run.
  const gainCap = state.deal?.collapsed === false && state.deal.binding.includes('computeCap') && !run.uncapped ? 5 : Infinity;
  const gain = Math.min(uncappedGain, gainCap);
  const capability = state.capability + gain;
  const spikeLoss = run.spikes > 0 ? Math.max(0, Math.min(gainWith(run.spikes - 1), gainCap) - gain) : 0;

  const sum = (key) => effects.reduce((s, e) => s + (e[key] ?? 0), 0);
  const era = eraById(state.era);
  // Debt counts only the gain up to the danger ceiling, as when capability stopped at 100.
  const dangerGain = Math.max(0, dangerCapability(capability) - dangerCapability(state.capability));
  const rawDebtDelta = dangerGain * (era.targetSafetyShare - alignShare) * BALANCE.alignDebtFactor + sum('ad');
  const sharedSafety = state.deal?.collapsed === false && state.deal.binding.includes('sharedSafety');
  const debtDelta = rawDebtDelta > 0 && sharedSafety ? rawDebtDelta * SHARED_SAFETY_DEBT_MULT : rawDebtDelta;
  state.alignmentDebt += applyAlignmentFaking(state, debtDelta, capability);
  state.concealedDebt += evalGamingDebt(state, dangerCapability(capability));
  state.misuseExposure += sum('mx');
  state.perceivedAdOffset += sum('perceivedAdOffset');
  for (const e of effects) {
    // D4: web-crawl data is always sued, at full cost; licensed and synthetic never.
    if (e.legal && e.legal.chance >= 0.3) {
      state.legalCases.push({ cost: e.legal.cost, dueTurn: state.turn + e.legal.delay, source: 'training data' });
    }
  }

  const spec = Object.assign(
    { size, arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoningCapable: false },
    ...effects.map((e) => e.spec ?? {}),
  );
  const flags = [...new Set(effects.flatMap((e) => e.flags ?? []))];
  const openWeightsMx =
    cards.reduce((v, c) => c.effects.openWeightsMx ?? v, 20) * cards.reduce((m, c) => m * (c.effects.openWeightsMult ?? 1), 1);

  return {
    capability,
    gain,
    spikes: run.spikes,
    spikesAnswered: run.spikesAnswered ?? 0,
    spikeLoss,
    size,
    spec,
    flags,
    openWeightsMx,
    publicEffects: {
      pt: sum('pt'),
      st: sum('st'),
      heat: sum('heat'),
      govUs: sum('govUs'),
      govIntl: sum('govIntl'),
      usersMult: effects.reduce((m, e) => m * (e.usersMult ?? 1), 1),
    },
    hazard: rollTrainingHazard(state, cards, flags),
    releaseDelay: 0,
  };
}
