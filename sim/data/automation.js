// Who does the work. Spec: docs/superpowers/specs/2026-09-26-who-does-the-work-design.md.
// First-pass numbers; plan 2H Task 5 re-tunes them with the balance bot.
export const JOBS = [
  { id: 'code', name: 'Writing code', short: 'Code', share: 0.3 },
  { id: 'review', name: 'Reviewing code', short: 'Review', share: 0.15 },
  { id: 'experiments', name: 'Running experiments', short: 'Experiments', share: 0.3 },
  { id: 'choosing', name: 'Choosing experiments', short: 'Choosing', share: 0.15 },
  { id: 'direction', name: 'Setting direction', short: 'Direction', share: 0.1 },
];
export const HANDOFF_JOBS = ['review', 'experiments', 'choosing', 'direction'];
export const LAST_TWO_JOBS = ['choosing', 'direction'];

// Anthropic's automation scale, AL0-AL4.
export const LEVELS = ['People only', 'Assists', 'Collaborates', 'Leads', 'Alone'];
export const LEVEL_SHORT = ['People', 'Assists', 'Collaborates', 'Leads', 'Alone'];
export const MAX_LEVEL = 4;
export const LEVEL_SPEED = [1, 1.1, 1.5, 3, 8];
export const AI_SHARE = [0, 0.2, 0.5, 0.8, 0.97];
export const CHECK_LOAD = [0, 0, 0.3, 1, 1.5];

// Where most labs are, per era, in JOBS order.
export const PACK = {
  1: [1, 0, 0, 0, 0],
  2: [1, 1, 0, 0, 0],
  3: [2, 1, 1, 0, 0],
  4: [3, 2, 2, 1, 0],
  5: [4, 3, 3, 2, 1],
};

export const MAX_CHECK = 3;
export const REVIEWER_CAPACITY = 0.12;
export const MONITOR_CAPACITY = 0.15;
export const REVIEWER_MONTHLY = 2; // $M per level per month in era 1, times (1 + 0.5 × (era − 1))
export const MONITOR_UNITS = 0.7; // compute units per level, times the era's compute scale
export const AI_REVIEW_BLIND = 0.5; // share of AI-checked work that still counts as unchecked
export const RISK_SCALE = 0.6;
export const TROUBLE_ERA = 3;
export const RUN_BONUS_PER_SPEED = 5;
export const POINTS_PER_SPEED = 10;
export const RUN_SKIP_SPEED = 1.5;
export const CLAIM_INFLATION = 2.5;
export const FIRST_LINE = 2;
export const HELD_BACK = -MAX_LEVEL; // an offset that keeps a job at People only in every era

export const createAutomation = () => ({
  offsets: { review: 0, experiments: 0, choosing: 0, direction: 0 },
  checks: { reviewers: 0, monitors: 0, aiReview: false },
  stage: 0,
  stageTurn: null,
  line: FIRST_LINE,
  lineCrossed: 0,
  lineTurn: null,
  lockedDown: false,
  history: [],
});
