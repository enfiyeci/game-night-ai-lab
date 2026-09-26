import { JOBS, HANDOFF_JOBS, PACK } from '../../sim/data/automation.js';
import {
  jobLevels, jobLocked, maxLevel, researchSpeed, claimedSpeed, codeShare, timeShares, bottleneck, checking,
  effectiveChecks, reviewerCost, controlUnits, setAutomation,
} from '../../sim/automation.js';
import { money, pct } from './format.js';
import { projectQueue } from './compute.js';

const indexOf = (id) => JOBS.findIndex((job) => job.id === id);

// endTurn applies the automation choice after the budget and split and before the moves, so validate against that.
export function automationBase(state, queue = {}) {
  const { automation, moves, ...rest } = queue;
  return projectQueue(state, { ...rest, moves: [] });
}

export function automationDraft(state, queued = null) {
  const levels = jobLevels(state);
  return {
    levels: { ...Object.fromEntries(HANDOFF_JOBS.map((id) => [id, levels[indexOf(id)]])), ...(queued?.levels ?? {}) },
    checks: { ...state.automation.checks, ...(queued?.checks ?? {}) },
  };
}

// Only changed jobs go to the sim, so an untouched hand-back (held at people only) is not turned into a creeping hold.
export function automationPayload(state, draft) {
  const current = jobLevels(state);
  const levels = Object.fromEntries(Object.entries(draft.levels).filter(([id, level]) => level !== current[indexOf(id)]));
  return { levels, checks: { ...draft.checks } };
}

export function automationView(state, draft) {
  const preview = structuredClone(state);
  const result = setAutomation(preview, automationPayload(state, draft));
  const shown = result.ok ? preview : state;
  const levels = jobLevels(shown);
  const speed = researchSpeed(levels);
  const check = checking(effectiveChecks(shown), levels);
  const shares = timeShares(levels);
  return {
    error: result.ok ? '' : result.error,
    rows: JOBS.map((job, index) => ({
      id: job.id,
      name: job.name,
      short: job.short,
      level: levels[index],
      pack: PACK[state.era][index],
      max: job.id === 'code' ? levels[index] : maxLevel(state.era, index),
      fixed: job.id === 'code',
      locked: jobLocked(state, job.id),
      timeShare: shares[index],
    })),
    bottleneck: bottleneck(levels),
    speed,
    claimed: claimedSpeed(speed),
    codeShare: codeShare(levels),
    checkedShare: check.checkedShare,
    unchecked: check.unchecked,
    exposure: check.exposure,
    reviewerCost: reviewerCost(shown),
    monitorUnits: controlUnits(shown),
    checks: { ...shown.automation.checks },
  };
}

export function automationOpinions(view) {
  const canPush = view.rows.some((row) => !row.fixed && !row.locked && row.level < row.max);
  const checked = Math.round(view.checkedShare * 100);
  return [
    canPush
      ? { id: 'research', mood: 'eager', text: 'Let it lead the experiments too. We are waiting on ourselves now.' }
      : { id: 'research', mood: 'calm', text: 'We are going as fast as the work allows.' },
    checked >= 100
      ? { id: 'safety', mood: 'calm', text: 'Everything it did this month was checked.' }
      : { id: 'safety', mood: checked < 50 ? 'alarmed' : 'uneasy', text: `We checked ${checked}% of what it did this month. I would like to know about the other ${100 - checked}%.` },
    view.checks.reviewers > 0
      ? { id: 'cfo', mood: 'calm', text: `Reviewers cost us ${money(view.reviewerCost)} a month. Agents do not ask for raises.` }
      : { id: 'cfo', mood: 'calm', text: 'Agents do not ask for raises. I am listening.' },
    view.codeShare >= 0.5 && checked < 100
      ? { id: 'policy', mood: 'uneasy', text: `Everyone brags that their AI writes ${pct(view.codeShare)} of their code. Nobody brags about who checks it.` }
      : { id: 'policy', mood: 'calm', text: 'Nothing to announce yet.' },
  ];
}

export function dressingView(state) {
  const levels = jobLevels(state);
  const { exposure } = checking(effectiveChecks(state), levels);
  const speed = researchSpeed(levels);
  return {
    agents: levels[0],
    pile: exposure <= 0 ? 0 : exposure < 0.15 ? 1 : exposure < 0.4 ? 2 : 3,
    glow: Math.max(0, Math.min(1, (speed - 1) / 2)),
  };
}

export function screenWallView(state) {
  const points = state.automation.history.map(({ turn, era, speed, claimed }) => ({ turn, era, speed, claimed }));
  const line = state.automation.line;
  const top = Math.max(4, Math.ceil(Math.max(line + 1, ...points.map((point) => point.claimed))));
  return { points, line, top, latest: points.at(-1) ?? null };
}
