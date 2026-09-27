import { BALANCE } from './balance.js';
import { hasLine } from './constitution.js';

export const REWARD_HACK_CHANCE = 0.5;
export const rewardHackSize = (era) => 4 + 2 * era;
export const INTERPRETABILITY_SPEND = 5;
const HACKABLE = new Set(['rlvr-light', 'reasoning-rl', 'agentic-rl']);
const FAKING_SHARE = 0.25;
const FAKING_MIN_CAP = 50;
export const GAMING_THRESHOLD = 40;
export const EVAL_GAMING_DEBT = { 3: 0.05, 4: 0.08, 5: 0.12 };

export const totalDebt = (state) => state.alignmentDebt + state.concealedDebt;
// The capability the danger rules see: progress past 100 still shows in the race and the benchmarks, not in the risk.
export const dangerCapability = (capability) => Math.min(capability, BALANCE.dangerCapabilityMax);

export function rollTrainingHazard(state, cards, flags, rng) {
  const hackable = cards.some((c) => HACKABLE.has(c.id)) || flags.includes('agentic');
  if (!hackable || !rng.chance(REWARD_HACK_CHANCE)) return null;
  return { type: 'rewardHacking', size: rewardHackSize(state.era) };
}

export function resolveHazard(state, choice) {
  const h = state.pendingModel?.hazard;
  if (!h) return { ok: false, error: 'no training hazard to resolve' };
  if (!['penalize', 'fix', 'ignore'].includes(choice)) return { ok: false, error: `unknown hazard choice ${choice}` };
  if (choice === 'penalize') state.concealedDebt += h.size;
  if (choice === 'ignore') state.alignmentDebt += h.size;
  if (choice === 'fix') state.pendingModel.releaseDelay = (state.pendingModel.releaseDelay ?? 0) + 1;
  state.pendingModel.hazard = null;
  return { ok: true, choice };
}

export function applyAlignmentFaking(state, debtDelta, capability) {
  if (debtDelta >= 0 || state.era < 3 || capability <= FAKING_MIN_CAP) return debtDelta;
  const hidden = -debtDelta * FAKING_SHARE * (hasLine(state, 'no-deceive-lab') ? 0.5 : 1);
  state.concealedDebt += hidden;
  return debtDelta + hidden;
}

// Gaming evals is hidden by definition, so all of it goes to the concealed portion.
export function evalGamingDebt(state, capability) {
  return state.era < 3 ? 0 : Math.max(0, capability - GAMING_THRESHOLD) * EVAL_GAMING_DEBT[state.era];
}

export function exposeConcealed(state, share) {
  // Move only what fits under the visible cap, so the clamp never erases debt.
  const moved = Math.min(state.concealedDebt * share, Math.max(0, 100 - state.alignmentDebt));
  state.concealedDebt -= moved;
  state.alignmentDebt += moved;
  return moved;
}
