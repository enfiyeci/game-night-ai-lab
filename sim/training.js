import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { SIZE_CAP, LENGTHS, validateRecipe, recipeCost, recipeCards, talentSpend, focusEffects } from './recipe.js';
import { standardTechniques } from './techniques.js';
import { rollTrainingHazard, applyAlignmentFaking, evalGamingDebt } from './hazards.js';
import { hasLine } from './constitution.js';
import { computeSlices } from './split.js';

export const SHARED_SAFETY_DEBT_MULT = 0.7;

export const availableUnits = (state) => computeSlices(state).idle;

export function startRun(state, recipe) {
  if (state.day < (state.flags.trainingPausedUntilDay ?? 0)) return { ok: false, error: `training is paused for ${state.flags.trainingPausedUntilDay - state.day} more days` };
  if (state.activeRun) return { ok: false, error: 'a training run is already active' };
  if (state.pendingModel) return { ok: false, error: 'release the trained model first' };
  const check = validateRecipe(state, recipe);
  if (!check.ok) return { ok: false, error: check.errors.join('; ') };
  const cost = recipeCost(state, recipe);
  if (cost.cash > state.cash) return { ok: false, error: 'not enough cash' };
  if (cost.units > availableUnits(state)) return { ok: false, error: 'not enough free compute' };
  const spikeChance = recipeCards(state, recipe).reduce((p, c) => p + (c.effects.spike ?? 0), 0.1) + focusEffects(state, recipe).spike;
  state.cash -= cost.cash;
  // Focus effects are fixed when the run starts, so a stage that opens mid-run cannot change them.
  const focus = focusEffects(state, recipe);
  state.activeRun = { recipe: structuredClone(recipe), units: cost.units, turnsLeft: cost.turns, spikes: 0, spikeChance: Math.max(0, spikeChance), bonus: 0, focus };
  return { ok: true, cost };
}

export function advanceRunBy(state, rng, fraction) {
  const run = state.activeRun;
  if (!run) return null;
  if (state.day < (state.flags.trainingPausedUntilDay ?? 0)) return { type: 'runPaused' };
  // Capacity is checked once per round, as the balance was tuned; a player action rechecks it.
  if (fraction >= 1 || run.capacityTurn !== state.turn) {
    run.capacityTurn = state.turn;
    run.canAdvance = computeSlices(state).training >= run.units;
  }
  if (!run.canAdvance) return { type: 'runPaused' };
  run.spikeProgress = (run.spikeProgress ?? 0) + fraction;
  if (run.spikeProgress >= 1 - 1e-9) {
    const chance = Math.min(1, Math.max(0, run.spikeChance));
    if (rng.chance(chance)) run.spikes += 1;
    run.spikeProgress = Math.max(0, run.spikeProgress - 1);
  }
  run.turnsLeft -= fraction;
  if (run.turnsLeft > 1e-9) return null;
  state.activeRun = null;
  state.pendingModel = resolveRun(state, run, rng);
  if (run.uncapped) state.pendingModel.uncapped = true; // run past the Geneva cap
  return state.pendingModel;
}

export const advanceRun = (state, rng) => advanceRunBy(state, rng, 1);

// A player action (a new compute split, a deal, a release) can change training capacity mid-round.
export function recheckCapacity(state) {
  if (state.activeRun) delete state.activeRun.capacityTurn;
}

export function resolveRun(state, run, rng) {
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
  const capability = Math.min(BALANCE.maxCapability, state.capability + Math.min(uncappedGain, gainCap));
  const gain = Math.max(0, capability - state.capability);
  const spikeLoss = run.spikes > 0
    ? Math.max(0, Math.min(BALANCE.maxCapability, state.capability + Math.min(gainWith(run.spikes - 1), gainCap)) - capability)
    : 0;

  const sum = (key) => effects.reduce((s, e) => s + (e[key] ?? 0), 0);
  const era = eraById(state.era);
  const rawDebtDelta = gain * (era.targetSafetyShare - alignShare) * BALANCE.alignDebtFactor + sum('ad');
  const sharedSafety = state.deal?.collapsed === false && state.deal.binding.includes('sharedSafety');
  const debtDelta = rawDebtDelta > 0 && sharedSafety ? rawDebtDelta * SHARED_SAFETY_DEBT_MULT : rawDebtDelta;
  state.alignmentDebt += applyAlignmentFaking(state, debtDelta, capability);
  state.concealedDebt += evalGamingDebt(state, capability);
  state.misuseExposure += sum('mx');
  state.perceivedAdOffset += sum('perceivedAdOffset');
  for (const e of effects) {
    if (e.legal && rng.chance(e.legal.chance)) {
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
    hazard: rollTrainingHazard(state, cards, flags, rng),
    releaseDelay: 0,
  };
}
