import { recipeCost } from '../../sim/recipe.js';
import { modelName } from '../../sim/release.js';
import { MW_PER_UNIT } from '../../sim/data/compute.js';

const trimOneDecimal = (value) => value.toFixed(1).replace(/\.0$/, '');

export function money(millions) {
  const sign = millions < 0 ? '-' : '';
  const value = Math.abs(millions);
  if (value >= 1000) return `${sign}$${trimOneDecimal(value / 1000)}B`;
  return `${sign}$${Math.round(value)}M`;
}

export function months(value) {
  if (!Number.isFinite(value) || value >= 36) return 'over 3 years';
  if (value < 1) return 'less than a month';
  return `about ${Math.round(value)} months`;
}

export const pct = (value) => `${Math.round(value * 100)}%`;

export function users(value) {
  const amount = Math.abs(value);
  if (amount >= 1e6) return `${trimOneDecimal(value / 1e6)}M`;
  if (amount >= 1e3) return `${trimOneDecimal(value / 1e3)}K`;
  return `${Math.round(value)}`;
}

export function computeAmount(units, era = 1) {
  if (era < 4) return `${trimOneDecimal(units)} units`;
  const megawatts = units * MW_PER_UNIT;
  if (megawatts < 1000) return `${trimOneDecimal(megawatts)} MW`;
  return `${(megawatts / 1000).toFixed(2)} GW`;
}

export function compute(value, era = 1) {
  const online = value?.online ?? 0;
  // Pooled compute goes to the government pool, so only the rest of an arrival becomes usable (sim/contracts.js refreshOnline).
  const gross = (value?.pipeline ?? []).reduce((sum, deal) => sum + (deal.units ?? 0), 0);
  const arriving = Math.floor(gross * (1 - (value?.pooled ?? 0)));
  return `${computeAmount(online, era)} online · ${computeAmount(arriving, era)} arriving`;
}

const STAGE_WORDS = ['pretraining', 'midtraining', 'post-training'];

// What the HUD pill says: the run's working name (the next model in the family), its stage and progress.
export function project(state) {
  const run = state.activeRun;
  if (!run) {
    return state.pendingModel
      ? { name: 'Training complete', status: 'ready to release', progress: null }
      : { name: 'No project', status: 'click the floor to plan your turn', progress: null };
  }
  const last = state.models.at(-1);
  const name = modelName({ family: last?.family ?? 'Kestrel', generation: (last?.generation ?? 0) + 1, size: run.recipe.sliders.size, tierWords: state.tierWords });
  const total = Math.max(1, run.turnsLeft, recipeCost(state, run.recipe).turns);
  const progress = (total - run.turnsLeft) / total;
  return { name, status: `training run · ${STAGE_WORDS[Math.min(2, Math.floor(progress * 3))]}`, progress };
}
