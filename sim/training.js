import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { SIZE_CAP, LENGTHS, validateRecipe, recipeCost, recipeCards, talentSpend } from './recipe.js';
import { standardTechniques } from './techniques.js';
import { rollTrainingHazard, applyAlignmentFaking, evalGamingDebt } from './hazards.js';
import { controlUnits } from './internal.js';
import { hasLine } from './constitution.js';

export function availableUnits(state) {
  const run = state.activeRun ? state.activeRun.units : 0;
  return Math.max(0, state.compute.online - state.compute.servingUnits - run - controlUnits(state));
}

export function startRun(state, recipe) {
  if (state.activeRun) return { ok: false, error: 'a training run is already active' };
  if (state.pendingModel) return { ok: false, error: 'release the trained model first' };
  const check = validateRecipe(state, recipe);
  if (!check.ok) return { ok: false, error: check.errors.join('; ') };
  const cost = recipeCost(state, recipe);
  if (cost.cash > state.cash) return { ok: false, error: 'not enough cash' };
  if (cost.units > availableUnits(state)) return { ok: false, error: 'not enough free compute' };
  const spikeChance = recipeCards(state, recipe).reduce((p, c) => p + (c.effects.spike ?? 0), 0.1);
  state.cash -= cost.cash;
  state.activeRun = { recipe: structuredClone(recipe), units: cost.units, turnsLeft: cost.turns, spikes: 0, spikeChance: Math.max(0, spikeChance), bonus: 0 };
  return { ok: true, cost };
}

export function advanceRun(state, rng) {
  const run = state.activeRun;
  if (!run) return null;
  if (state.compute.online < run.units) return { type: 'runPaused' };
  if (rng.chance(run.spikeChance)) run.spikes += 1;
  run.turnsLeft -= 1;
  if (run.turnsLeft > 0) return null;
  state.activeRun = null;
  state.pendingModel = resolveRun(state, run, rng);
  return state.pendingModel;
}

export function resolveRun(state, run, rng) {
  const { size, length, alignShare } = run.recipe.sliders;
  const cards = recipeCards(state, run.recipe);
  const autos = standardTechniques(state).map((t) => t.auto).filter(Boolean);
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
  ];
  const readiness = cards.reduce((r, c) => c.effects.readiness ?? r, 0.5);
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
  const uncappedGain = Math.max(0, Math.max(0, base) * talent * (1 - 0.5 * alignShare) * Math.max(0.2, 1 - 0.2 * run.spikes) - nextRunCapPenalty);
  const gainCap = state.deal?.collapsed === false && state.deal.binding.includes('computeCap') ? 5 : Infinity;
  const capability = Math.min(BALANCE.maxCapability, state.capability + Math.min(uncappedGain, gainCap));
  const gain = Math.max(0, capability - state.capability);

  const sum = (key) => effects.reduce((s, e) => s + (e[key] ?? 0), 0);
  const era = eraById(state.era);
  const debtDelta = gain * (era.targetSafetyShare - alignShare) * BALANCE.alignDebtFactor + sum('ad');
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
