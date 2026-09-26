import { clamp, sigmoid } from './util.js';
import { totalDebt } from './hazards.js';
import { eraScale } from './data/compute.js';
import {
  JOBS, LAST_TWO_JOBS, MAX_LEVEL, LEVEL_SPEED, AI_SHARE, CHECK_LOAD, PACK,
  REVIEWER_CAPACITY, MONITOR_CAPACITY, REVIEWER_MONTHLY, MONITOR_UNITS, AI_REVIEW_BLIND, RISK_SCALE,
  CLAIM_INFLATION,
} from './data/automation.js';

// The work is done by the newest trained model, released or not.
export const newestCapability = (state) => state.pendingModel?.capability ?? state.capability;

const summitPause = (state) => state.deal?.collapsed === false && state.deal.binding.includes('pauseAutomation');
export const jobLocked = (state, jobId) => LAST_TWO_JOBS.includes(jobId) && (state.automation.lockedDown || summitPause(state));
export const maxLevel = (era, index) => Math.min(MAX_LEVEL, PACK[era][index] + 1);

// Writing code follows the pack; each hand-off is stored as an offset from it, so it creeps up with the pack.
export function jobLevels(state) {
  const pack = PACK[state.era];
  return JOBS.map((job, index) => {
    if (job.id === 'code') return pack[index];
    if (jobLocked(state, job.id)) return 0;
    return clamp(pack[index] + (state.automation.offsets[job.id] ?? 0), 0, maxLevel(state.era, index));
  });
}

// Amdahl's law: the slowest job sets the speed.
export const researchSpeed = (levels) => 1 / JOBS.reduce((sum, job, index) => sum + job.share / LEVEL_SPEED[levels[index]], 0);
export const claimedSpeed = (speed) => Math.round((1 + CLAIM_INFLATION * (speed - 1)) * 10) / 10;
export const codeShare = (levels) => AI_SHARE[levels[0]];

export function timeShares(levels) {
  const times = JOBS.map((job, index) => job.share / LEVEL_SPEED[levels[index]]);
  const total = times.reduce((a, b) => a + b, 0);
  return times.map((time) => time / total);
}

export function bottleneck(levels) {
  const shares = timeShares(levels);
  return JOBS[shares.indexOf(Math.max(...shares))].id;
}

export const checkLoad = (levels) => JOBS.reduce((sum, job, index) => sum + job.share * CHECK_LOAD[levels[index]], 0);

// People check first; AI review, when on, checks the rest but shares the AI's blind spots.
export function checking(checks, levels) {
  const load = checkLoad(levels);
  const human = Math.min(load, checks.reviewers * REVIEWER_CAPACITY + checks.monitors * MONITOR_CAPACITY);
  const ai = checks.aiReview ? load - human : 0;
  const unchecked = load - human - ai;
  return {
    load,
    human,
    ai,
    unchecked,
    checkedShare: load > 0 ? (human + ai) / load : 1,
    exposure: unchecked + AI_REVIEW_BLIND * ai,
  };
}

export const reviewerCost = (state) => state.automation.checks.reviewers * REVIEWER_MONTHLY * (1 + 0.5 * (state.era - 1));
export const monitorUnitsFor = (era, monitors) => Math.round(monitors * MONITOR_UNITS * eraScale(era) * 10) / 10;
// The compute split's "control" slice.
export const controlUnits = (state) => monitorUnitsFor(state.era, state.automation.checks.monitors);

// The control slice is clamped to online compute, so only the monitor levels that fit there check anything.
export function effectiveChecks(state) {
  const { checks } = state.automation;
  const fit = Math.floor(state.compute.online / monitorUnitsFor(state.era, 1));
  return { ...checks, monitors: Math.min(checks.monitors, fit) };
}

export function automationRisk(state) {
  const base = sigmoid((totalDebt(state) * newestCapability(state) / 100 - 40) / 8);
  return base * Math.min(1, checking(effectiveChecks(state), jobLevels(state)).exposure) * RISK_SCALE;
}
