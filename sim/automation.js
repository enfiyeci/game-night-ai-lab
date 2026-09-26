import { clamp, sigmoid } from './util.js';
import { totalDebt } from './hazards.js';
import { eraScale } from './data/compute.js';
import { availableUnits } from './training.js';
import { hasLine } from './constitution.js';
import {
  JOBS, HANDOFF_JOBS, LAST_TWO_JOBS, MAX_LEVEL, LEVEL_SPEED, AI_SHARE, CHECK_LOAD, PACK,
  REVIEWER_CAPACITY, MONITOR_CAPACITY, REVIEWER_MONTHLY, MONITOR_UNITS, AI_REVIEW_BLIND, RISK_SCALE,
  CLAIM_INFLATION, MAX_CHECK, HELD_BACK, TROUBLE_ERA, RUN_BONUS_PER_SPEED, POINTS_PER_SPEED, RUN_SKIP_SPEED,
  PROPOSE_LEVEL, LESS_LOGS_CHANCE, LESS_LOGS_DEBT, OVERNIGHT_BONUS, OVERNIGHT_POINTS,
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

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const CHECK_KEYS = ['reviewers', 'monitors', 'aiReview'];

// The free "who does the work" action. All or nothing: a rejected choice changes nothing.
export function setAutomation(state, input) {
  if (!isObject(input)) return { ok: false, error: 'the automation choice must be an object' };
  const unknown = Reflect.ownKeys(input).find((key) => key !== 'levels' && key !== 'checks');
  if (unknown !== undefined) return { ok: false, error: `unknown automation key ${String(unknown)}` };
  const offsets = { ...state.automation.offsets };
  if (Object.hasOwn(input, 'levels')) {
    if (!isObject(input.levels)) return { ok: false, error: 'levels must be an object' };
    for (const key of Reflect.ownKeys(input.levels)) {
      if (key === 'code') return { ok: false, error: 'writing code follows the pack' };
      if (!HANDOFF_JOBS.includes(key)) return { ok: false, error: `unknown job ${String(key)}` };
      const index = JOBS.findIndex((job) => job.id === key);
      const level = input.levels[key];
      if (!Number.isInteger(level) || level < 0 || level > maxLevel(state.era, index)) {
        return { ok: false, error: `${JOBS[index].name.toLowerCase()} can go from people only to one level above the pack` };
      }
      if (level > 0 && jobLocked(state, key)) return { ok: false, error: 'choosing and direction are back with people' };
      offsets[key] = level - PACK[state.era][index];
    }
  }
  const checks = { ...state.automation.checks };
  if (Object.hasOwn(input, 'checks')) {
    if (!isObject(input.checks)) return { ok: false, error: 'checks must be an object' };
    const bad = Reflect.ownKeys(input.checks).find((key) => !CHECK_KEYS.includes(key));
    if (bad !== undefined) return { ok: false, error: `unknown check ${String(bad)}` };
    for (const key of ['reviewers', 'monitors']) {
      if (!Object.hasOwn(input.checks, key)) continue;
      const value = input.checks[key];
      if (!Number.isInteger(value) || value < 0 || value > MAX_CHECK) return { ok: false, error: `${key} must be a whole number from 0 to ${MAX_CHECK}` };
      checks[key] = value;
    }
    if (Object.hasOwn(input.checks, 'aiReview')) {
      if (typeof input.checks.aiReview !== 'boolean') return { ok: false, error: 'aiReview must be true or false' };
      checks.aiReview = input.checks.aiReview;
    }
  }
  // Monitors run on compute; the current reservation is added back so a player can keep or lower it.
  if (checks.monitors > state.automation.checks.monitors
    && monitorUnitsFor(state.era, checks.monitors) > availableUnits(state) + controlUnits(state)) {
    return { ok: false, error: 'not enough free compute for monitors' };
  }
  state.automation.offsets = offsets;
  state.automation.checks = checks;
  return { ok: true };
}

export function handBack(state) {
  for (const id of HANDOFF_JOBS) state.automation.offsets[id] = HELD_BACK;
}

export function addMonitor(state) {
  const monitors = state.automation.checks.monitors + 1;
  if (monitors > MAX_CHECK) return { ok: false, error: 'monitors are already at the top level' };
  return setAutomation(state, { checks: { monitors } });
}

const TAKEOVER_CAPABILITY = 70;
// Owner decision 2026-09-25: the takeover ending needs era-4 capability.
const TAKEOVER_ERA = 4;

export function automationTick(state, rng) {
  const a = state.automation;
  const levels = jobLevels(state);
  const speed = researchSpeed(levels);
  a.history.push({ turn: state.turn, era: state.era, speed, claimed: claimedSpeed(speed) });
  const run = state.activeRun;
  if (run) {
    run.bonus += RUN_BONUS_PER_SPEED * (speed - 1);
    // Runs also get faster: one turn off, once per run.
    if (speed >= RUN_SKIP_SPEED && run.turnsLeft > 1 && !run.automationSped) {
      run.turnsLeft -= 1;
      run.automationSped = true;
    }
  }
  state.researchPoints += POINTS_PER_SPEED * (speed - 1);
  const events = [];
  if (speed >= a.line && a.lineCrossed < a.line) {
    a.lineCrossed = a.line;
    a.lineTurn = state.turn;
    events.push({ type: 'ownLineCrossed', speed, line: a.line });
  }
  // Fully checked work draws nothing, so eras 1-2 and checked labs keep the random sequence.
  if (state.era < TROUBLE_ERA || checking(effectiveChecks(state), levels).exposure <= 0) return events;
  if (!rng.chance(automationRisk(state))) return events;
  if (a.stage >= 3) {
    if (newestCapability(state) < TAKEOVER_CAPABILITY || state.era < TAKEOVER_ERA) return events;
    if (a.stage === 3 && hasLine(state, 'accept-shutdown')) {
      a.stage = 4;
      a.stageTurn = state.turn;
      return events;
    }
    if (hasLine(state, 'accept-shutdown')) a.stage = 5;
    state.ending = 'quietTakeover';
    return [...events, { type: 'internalIncident', stage: 4 }];
  }
  a.stage += 1;
  a.stageTurn = state.turn;
  return [...events, { type: a.stage === 1 ? 'internalWarning' : 'internalIncident', stage: a.stage }];
}

export function lockDown(state) {
  state.automation.lockedDown = true;
}

// The AI proposes its own moves only while choosing or direction is at Leads or above.
const proposing = (state) => {
  const levels = jobLevels(state);
  return levels[3] >= PROPOSE_LEVEL || levels[4] >= PROPOSE_LEVEL;
};

export function aiProposals(state, rng) {
  if (!proposing(state)) return [];
  const out = [];
  if (availableUnits(state) >= 1) out.push({ id: 'overnight', label: 'Run experiments overnight on idle compute', risky: false });
  if (state.automation.checks.monitors > 0 && rng.chance(LESS_LOGS_CHANCE)) {
    out.push({ id: 'lessLogs', label: 'Sample its own monitor logs less often, to free up compute', risky: true });
  }
  return out;
}

// Each answer applies at once: approved moves run, cancelled ones are dropped, unanswered ones keep waiting.
// A move that no longer makes sense when approved (no idle compute, no monitors left) is dropped without effect,
// and a lock-down withdraws everything that was waiting.
export function applyApprovals(state, approvals = {}) {
  if (!proposing(state)) {
    state.automation.proposals = [];
    return [];
  }
  const events = [];
  const answered = (proposal) => state.automation.autoApprove || typeof approvals[proposal.id] === 'boolean';
  for (const proposal of state.automation.proposals) {
    if (!state.automation.autoApprove && approvals[proposal.id] !== true) continue;
    if (proposal.id === 'overnight') {
      if (availableUnits(state) < 1) continue;
      if (state.activeRun) state.activeRun.bonus += OVERNIGHT_BONUS;
      else state.researchPoints += OVERNIGHT_POINTS;
    }
    if (proposal.id === 'lessLogs') {
      if (state.automation.checks.monitors === 0) continue;
      state.automation.checks.monitors -= 1;
      state.concealedDebt += LESS_LOGS_DEBT;
    }
    events.push({ type: 'aiMove', id: proposal.id });
  }
  state.automation.proposals = state.automation.proposals.filter((proposal) => !answered(proposal));
  return events;
}
