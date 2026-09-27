import { polishStatus } from './polish.js';
import { recipeCost } from '../../sim/recipe.js';
import { workingName } from './naming.js';
import { MW_PER_UNIT } from '../../sim/data/compute.js';
import { ROUND_DAYS } from '../../sim/time.js';
import { ERAS } from '../../sim/data/eras.js';

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

// "+2 turns" in story words for the current era: about 6 months, about 2 weeks.
export function roundsToWords(era, n) {
  const days = n * ROUND_DAYS[era];
  if (days >= 60) return `about ${Math.round(days / 30.4)} months`;
  if (days >= 14) return `about ${Math.round(days / 7)} weeks`;
  return days === 1 ? '1 day' : `${days} days`;
}

export function storyDayForTurn(turn) {
  let remaining = Math.max(0, Math.floor(turn));
  let day = 0;
  for (const era of ERAS) {
    const rounds = Math.min(remaining, era.turns);
    day += rounds * ROUND_DAYS[era.id];
    remaining -= rounds;
    if (remaining === 0) break;
  }
  return day;
}

export const pct = (value) => `${Math.round(value * 100)}%`;

export function users(value) {
  const amount = Math.abs(value);
  if (amount >= 1e6) return `${trimOneDecimal(value / 1e6)}M`;
  if (amount >= 1e3) return `${trimOneDecimal(value / 1e3)}K`;
  return `${Math.round(value)}`;
}

export function computeAmount(units, era = 1) {
  if (era < 4) {
    const amount = trimOneDecimal(units);
    return `${amount} ${amount === '1' ? 'unit' : 'units'}`;
  }
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
    const model = state.pendingModel;
    if (model?.polishing) return { name: workingName(state, model.size), status: polishStatus(model), progress: model.polish / 100 };
    return model
      ? { name: 'Training complete', status: 'ready to release', progress: null }
      : { name: 'No project', status: 'click the floor to get to work', progress: null };
  }
  const name = workingName(state, run.recipe.sliders.size);
  const total = Math.max(1, run.turnsLeft, recipeCost(state, run.recipe).turns);
  const progress = (total - run.turnsLeft) / total;
  return { name, status: `training run · ${STAGE_WORDS[Math.min(2, Math.floor(progress * 3))]}`, progress };
}
