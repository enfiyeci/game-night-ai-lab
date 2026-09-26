# Plan 2H: Who does the work (slim) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the era-3 on/off internal deployment with the "who does the work" mechanic: five jobs on the automation scale, four player hand-offs, a review pile that feeds the trouble ladder, an overstated speed, and a ×2 policy-line card, with the level-grid dialog, office dressing and screen-wall chart.

**Architecture:** A new pure module `sim/automation.js` (tables in `sim/data/automation.js`) replaces `sim/internal.js`. The player's choice is a free action `actions.automation = { levels, checks }` applied early in `endTurn`, like the compute split. A per-turn `automationTick(state, rng)` applies the speed, records history, detects the line crossing and rolls the unchanged trouble ladder. The UI gets a pure view model (`ui/logic/automation.js`, unit-tested) and three DOM pieces checked by screenshot.

**Tech Stack:** Plain ES modules, no build step; `node --test`; headless Chrome screenshots via `tools/shot.sh`.

**Spec:** `docs/superpowers/specs/2026-09-26-who-does-the-work-design.md` (read it first; section numbers below refer to it).

## Global Constraints

- The sim stays pure: no DOM access in `sim/`; every random draw goes through the passed `rng`.
- Plain HTML, CSS and JavaScript ES modules; no build step and no new dependencies.
- Palette tokens only: cream #F1E4C8, paper #FFFBF1, ink #2E2A2B, teal #3F9C8F, wood #C8864C, coral #E0613B, sky #3F84C6. Font: Nunito.
- Keep the event types `internalWarning` and `internalIncident` and the ending id `quietTakeover` (the feed, Lumen and demo seeds read them).
- Keep the card ids `oversightTamper` and `selfExfiltration` and their choice ids `shutdown`, `controls`, `ignore`, `report`, `coverup` (the balance bot maps them).
- The level names are exactly: People only, Assists, Collaborates, Leads, Alone.
- Before any UI task, load the owner's `design` skill (`~/claude-sync/skills/design/` or `~/.claude/skills/design/`); no screen counts as done until it is rendered and looked at.
- Tuning numbers live only in `sim/data/automation.js`.

## Before you start (orchestrator)

- [ ] **Step 1: Make the build worktree off the latest `origin/ui`**

The spec and this plan reach `origin/automation-ui` when the spec session pushes them; check first with `git ls-tree -r --name-only origin/automation-ui docs/superpowers/plans/ | grep plan2h` (no output means they are not pushed yet: stop and ask).

```bash
cd ~/Desktop/game-night-ai-lab
git fetch origin
git worktree add ~/worktrees/game-night-ai-lab-automation-build -b automation-build origin/ui
cd ~/worktrees/game-night-ai-lab-automation-build
git checkout origin/automation-ui -- docs/superpowers/specs/2026-09-26-who-does-the-work-design.md docs/superpowers/plans/2026-09-26-plan2h-who-does-the-work.md docs/design/mockups/K2-automation.html docs/design/mockups/automation
npm test
```

Expected: all tests pass on the fresh base (record the count).

- [ ] **Step 2: Claim the lane and warn the lanes that share files**

```bash
~/claude-sync/bin/claude-sync.sh claim ~/worktrees/game-night-ai-lab-automation-build gn-automation session=local_<uuid> "doing=building plan 2H (who does the work)" "files=sim/internal.js (deleted), sim/automation.js, sim/data/events.js (oversightTamper, selfExfiltration, new ownLine), sim/summit.js, ui/main.js, ui/office.js, ui/styles.css (appended block)"
~/claude-sync/bin/claude-sync.sh msg ~/Desktop/game-night-ai-lab gn-events gn-automation "Plan 2H edits two cards in sim/data/events.js (oversightTamper, selfExfiltration: 'Shut down internal use' becomes 'Hand the work back to people', 'Add controls' becomes 'Add monitors') and adds an ownLine card that the screen wall renders itself, so a generic card renderer should skip ownLine."
~/claude-sync/bin/claude-sync.sh msg ~/Desktop/game-night-ai-lab gn-summit gn-automation "Plan 2H makes pauseAutomation hand choosing and direction back to people while the deal holds (no more stopInternal). The 3C screen wall is provisional until our lanes merge."
~/claude-sync/bin/claude-sync.sh msg ~/Desktop/game-night-ai-lab gn-board gn-automation "Plan 2H adds two imports and two debug routes to ui/main.js and appends one block at the end of ui/styles.css; no other edits there."
```

- [ ] **Step 3: Check whether `sim/lumen.js` and `tools/demo-seeds.js` exist on this base**

Run: `ls sim/lumen.js tools/demo-seeds.js`
If they exist (the base has merged `main`), Task 3 Step 9 applies; otherwise skip it and note it in the ledger.

---

### Task 1: The model tables and pure functions

**Files:**
- Create: `sim/data/automation.js`
- Create: `sim/automation.js`
- Modify: `sim/state.js` (add the `automation` field; keep `internal: null` until Task 3)
- Test: `tests/automation.test.js` (new)

**Interfaces:**
- Produces (data): `JOBS`, `HANDOFF_JOBS`, `LAST_TWO_JOBS`, `LEVELS`, `LEVEL_SHORT`, `MAX_LEVEL`, `LEVEL_SPEED`, `AI_SHARE`, `CHECK_LOAD`, `PACK`, `MAX_CHECK`, `REVIEWER_CAPACITY`, `MONITOR_CAPACITY`, `REVIEWER_MONTHLY`, `MONITOR_UNITS`, `AI_REVIEW_BLIND`, `RISK_SCALE`, `TROUBLE_ERA`, `RUN_BONUS_PER_SPEED`, `POINTS_PER_SPEED`, `RUN_SKIP_SPEED`, `CLAIM_INFLATION`, `FIRST_LINE`, `HELD_BACK`, `createAutomation()`.
- Produces (functions): `newestCapability(state)`, `jobLocked(state, jobId) → boolean`, `maxLevel(era, index) → number`, `jobLevels(state) → number[5]`, `researchSpeed(levels) → number`, `claimedSpeed(speed) → number`, `codeShare(levels) → number`, `timeShares(levels) → number[5]`, `bottleneck(levels) → jobId`, `checkLoad(levels) → number`, `checking(checks, levels) → { load, human, ai, unchecked, checkedShare, exposure }`, `reviewerCost(state) → $M/month`, `monitorUnitsFor(era, monitors) → units`, `controlUnits(state) → units`, `effectiveChecks(state) → checks` (monitors capped at what online compute can hold), `automationRisk(state) → probability`. Every reader of checking strength (risk, the tick, the UI) goes through `effectiveChecks`, never `state.automation.checks` directly.
- State shape: `state.automation = { offsets: { review, experiments, choosing, direction }, checks: { reviewers, monitors, aiReview }, stage, stageTurn, line, lineCrossed, lineTurn, lockedDown, history: [{ turn, era, speed, claimed }] }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/automation.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { PACK, createAutomation, REVIEWER_CAPACITY, MONITOR_CAPACITY, AI_REVIEW_BLIND } from '../sim/data/automation.js';
import {
  jobLevels, researchSpeed, claimedSpeed, codeShare, timeShares, bottleneck, checkLoad, checking,
  reviewerCost, controlUnits, effectiveChecks, automationRisk,
} from '../sim/automation.js';

const near = (actual, expected, eps = 0.01) => assert.ok(Math.abs(actual - expected) < eps, `${actual} is not near ${expected}`);
const atEra = (era) => {
  const s = createInitialState();
  s.era = era;
  return s;
};

test('a new run starts with the pack, no checks, and the line at ×2', () => {
  assert.deepEqual(createInitialState().automation, createAutomation());
  assert.equal(createAutomation().line, 2);
});

test('writing code follows the pack and the hand-offs start with it', () => {
  for (const era of [1, 2, 3, 4, 5]) assert.deepEqual(jobLevels(atEra(era)), PACK[era]);
});

test('speed at the pack matches the spec, with the era-4 anchor near ×1.5 at 80% code', () => {
  const expected = { 1: 1.03, 2: 1.04, 3: 1.16, 4: 1.57, 5: 2.64 };
  for (const era of [1, 2, 3, 4, 5]) near(researchSpeed(PACK[era]), expected[era]);
  assert.equal(codeShare(PACK[4]), 0.8);
});

test('pushing every hand-off one level ahead of the pack', () => {
  near(researchSpeed([2, 2, 2, 1, 1]), 1.375);
  near(researchSpeed([3, 3, 3, 2, 1]), 2.27);
  near(researchSpeed([4, 4, 4, 3, 2]), 4.75);
});

test('the bottleneck is the job with the largest share of the remaining time', () => {
  assert.equal(bottleneck(PACK[4]), 'experiments');
  near(timeShares(PACK[4]).reduce((a, b) => a + b, 0), 1, 1e-9);
});

test('checking load, capacity, AI review and exposure', () => {
  near(checkLoad(PACK[3]), 0.09);
  near(checkLoad(PACK[4]), 0.435);
  near(checkLoad(PACK[5]), 0.945);
  near(checkLoad([4, 4, 4, 3, 2]), 1.305);
  const none = checking({ reviewers: 0, monitors: 0, aiReview: false }, PACK[4]);
  near(none.unchecked, 0.435);
  near(none.exposure, 0.435);
  near(none.checkedShare, 0);
  // Capacities come from the constants, so Task 5's tuning does not break these tests.
  const humanPeople = 2 * REVIEWER_CAPACITY + MONITOR_CAPACITY;
  const people = checking({ reviewers: 2, monitors: 1, aiReview: false }, PACK[4]);
  near(people.human, humanPeople);
  near(people.unchecked, 0.435 - humanPeople);
  near(people.checkedShare, humanPeople / 0.435);
  const humanMax = 3 * (REVIEWER_CAPACITY + MONITOR_CAPACITY);
  const ai = checking({ reviewers: 3, monitors: 3, aiReview: true }, [4, 4, 4, 3, 2]);
  near(ai.human, humanMax);
  near(ai.ai, 1.305 - humanMax);
  near(ai.unchecked, 0);
  near(ai.exposure, AI_REVIEW_BLIND * (1.305 - humanMax));
  near(ai.checkedShare, 1);
  assert.equal(checking({ reviewers: 0, monitors: 0, aiReview: false }, [0, 0, 0, 0, 0]).checkedShare, 1);
});

test('reviewers cost money that scales with the era; monitors reserve compute', () => {
  const s = atEra(4);
  s.automation.checks = { reviewers: 2, monitors: 3, aiReview: false };
  assert.equal(reviewerCost(s), 10);
  assert.equal(controlUnits(s), 63);
});

test('the Head of Research overstates the speed', () => {
  assert.equal(claimedSpeed(1.572), 2.4);
  assert.equal(claimedSpeed(1), 1);
});

test('risk grows with exposure and with the newest model, released or not', () => {
  const s = atEra(4);
  s.capability = 50;
  s.alignmentDebt = 80;
  const open = automationRisk(s);
  assert.ok(open > 0);
  s.pendingModel = { capability: 80 };
  assert.ok(automationRisk(s) > open);
  const high = automationRisk(s);
  s.automation.checks.aiReview = true;
  near(automationRisk(s), high / 2, 1e-9);
  s.compute.online = 500;
  s.automation.checks = { reviewers: 3, monitors: 3, aiReview: false };
  assert.equal(automationRisk(s), 0);
});

test('monitors that no longer fit in online compute stop checking', () => {
  const s = atEra(4);
  s.automation.checks = { reviewers: 0, monitors: 3, aiReview: false }; // 63 units in era 4
  s.compute.online = 30; // room for one 21-unit level
  assert.equal(effectiveChecks(s).monitors, 1);
  s.compute.online = 500;
  assert.equal(effectiveChecks(s).monitors, 3);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/automation.test.js`
Expected: FAIL with `Cannot find module '.../sim/data/automation.js'`.

- [ ] **Step 3: Write the tables**

Create `sim/data/automation.js`:

```js
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
```

- [ ] **Step 4: Write the pure functions**

Create `sim/automation.js`:

```js
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
```

- [ ] **Step 5: Add the state field**

In `sim/state.js`, add the import and the field (leave `internal: null` in place until Task 3):

```js
import { createAutomation } from './data/automation.js';
```

```js
    internal: null,
    automation: createAutomation(),
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test tests/automation.test.js && npm test`
Expected: the new file passes; the full suite passes (nothing reads the new field yet except `tests/state.test.js`, which should still pass; if it snapshots the whole initial state, add `automation: createAutomation()` to its expectation).

- [ ] **Step 7: Commit**

```bash
git add sim/data/automation.js sim/automation.js sim/state.js tests/automation.test.js
git commit -m "feat(sim): who-does-the-work tables and pure model (plan 2H task 1)"
```

---

### Task 2: The free action (hand-offs and checks)

**Files:**
- Modify: `sim/automation.js` (add `setAutomation`, `handBack`, `addMonitor`)
- Modify: `sim/turn.js` (apply `actions.automation`)
- Test: `tests/automation.test.js`

**Interfaces:**
- Consumes: Task 1's `jobLocked`, `maxLevel`, `monitorUnitsFor`, `controlUnits`, tables.
- Produces: `setAutomation(state, { levels?, checks? }) → { ok: true } | { ok: false, error }` (all-or-nothing); `handBack(state)` (four hand-offs to `HELD_BACK`); `addMonitor(state) → result of setAutomation`. `endTurn` accepts `actions.automation`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/automation.test.js` (and extend the import from `../sim/automation.js` with `setAutomation, handBack, addMonitor`; add `import { endTurn } from '../sim/turn.js';`):

```js
const miss = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };

test('the free action stores hand-offs as offsets from the pack, so they creep with it', () => {
  const s = atEra(3);
  assert.deepEqual(setAutomation(s, { levels: { review: 2, experiments: 0 } }), { ok: true });
  assert.deepEqual(jobLevels(s), [2, 2, 0, 0, 0]);
  s.era = 4;
  assert.deepEqual(jobLevels(s), [3, 3, 1, 1, 0]);
});

test('the free action rejects code, unknown jobs, levels past one above the pack, and bad checks', () => {
  const s = atEra(3);
  assert.equal(setAutomation(s, { levels: { code: 3 } }).error, 'writing code follows the pack');
  assert.equal(setAutomation(s, { levels: { cooking: 1 } }).error, 'unknown job cooking');
  assert.equal(setAutomation(s, { levels: { review: 3 } }).ok, false);
  assert.equal(setAutomation(s, { levels: { review: 1.5 } }).ok, false);
  assert.equal(setAutomation(s, { checks: { reviewers: 4 } }).ok, false);
  assert.equal(setAutomation(s, { checks: { aiReview: 'yes' } }).ok, false);
  assert.equal(setAutomation(s, { checks: { interns: 1 } }).ok, false);
  assert.equal(setAutomation(s, { extra: 1 }).ok, false);
  assert.equal(setAutomation(s, null).ok, false);
  assert.equal(setAutomation(s, { levels: { review: 2 }, checks: { reviewers: 9 } }).ok, false);
  assert.deepEqual(s.automation, createAutomation(), 'a rejected choice changes nothing');
});

test('monitors must fit in free compute; keeping or lowering them always works', () => {
  const s = atEra(4);
  s.compute.online = 30; // one era-4 monitor level is 21 units
  s.compute.split.safety = 0;
  assert.equal(setAutomation(s, { checks: { monitors: 2 } }).error, 'not enough free compute for monitors');
  assert.equal(setAutomation(s, { checks: { monitors: 1 } }).ok, true);
  s.compute.online = 10;
  assert.equal(setAutomation(s, { checks: { reviewers: 1 } }).ok, true);
  assert.equal(setAutomation(s, { checks: { monitors: 0 } }).ok, true);
});

test('hand-back holds the four jobs at people only in every era until the player changes them', () => {
  const s = atEra(4);
  handBack(s);
  assert.deepEqual(jobLevels(s), [3, 0, 0, 0, 0]);
  s.era = 5;
  assert.deepEqual(jobLevels(s), [4, 0, 0, 0, 0]);
  assert.equal(setAutomation(s, { levels: { review: 3 } }).ok, true);
  assert.deepEqual(jobLevels(s), [4, 3, 0, 0, 0]);
});

test('addMonitor adds one level while it fits and stops at the top level', () => {
  const s = atEra(3);
  s.compute.online = 200;
  assert.equal(addMonitor(s).ok, true);
  assert.equal(s.automation.checks.monitors, 1);
  s.automation.checks.monitors = 3;
  assert.equal(addMonitor(s).ok, false);
});

test('endTurn applies the free action and reports its errors', () => {
  const s = atEra(3);
  const ok = endTurn(s, { automation: { levels: { review: 2 } } }, miss);
  assert.deepEqual(ok.errors, []);
  assert.equal(jobLevels(ok.state)[1], 2);
  const bad = endTurn(s, { automation: { levels: { code: 4 } } }, miss);
  assert.ok(bad.errors.includes('writing code follows the pack'));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/automation.test.js`
Expected: FAIL with `setAutomation is not a function` (or a missing export).

- [ ] **Step 3: Implement the action**

Append to `sim/automation.js` (and add `import { availableUnits } from './training.js';` plus `HANDOFF_JOBS, MAX_CHECK, HELD_BACK` to the data import):

```js
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
```

- [ ] **Step 4: Wire the action into `endTurn`**

In `sim/turn.js`, add `import { setAutomation } from './automation.js';` and, directly after the `computeSplit` block:

```js
  if (Object.hasOwn(actions, 'automation')) {
    const r = setAutomation(state, actions.automation);
    if (!r.ok) errors.push(r.error);
  }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/automation.test.js && npm test`
Expected: all pass. (`sim/automation.js` now imports `sim/training.js`, which imports `sim/split.js`, which still imports `sim/internal.js`; the cycle is the same shape as today's and only resolves at call time.)

- [ ] **Step 6: Commit**

```bash
git add sim/automation.js sim/turn.js tests/automation.test.js
git commit -m "feat(sim): free who-does-the-work action with hand-back and monitors (plan 2H task 2)"
```

---

### Task 3: Switch over from the internal deployment

This task is one atomic change: deleting `sim/internal.js` breaks every importer at once, so all of them move together.

**Files:**
- Modify: `sim/automation.js` (add `automationTick`)
- Delete: `sim/internal.js`, `tests/internal.test.js`
- Modify: `sim/state.js`, `sim/turn.js`, `sim/economy.js`, `sim/split.js`, `sim/summit.js`, `sim/data/events.js`, `tools/balance.js`, `ui/logic/compute.js`
- Test: `tests/automation.test.js`, `tests/constitution.test.js`, `tests/economy.test.js`, `tests/events.test.js`, `tests/summit.test.js`, `tests/turn.test.js`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: `automationTick(state, rng) → events[]` (events may include `{ type: 'ownLineCrossed', speed, line }`, `{ type: 'internalWarning', stage: 1 }`, `{ type: 'internalIncident', stage }`); `state.internal` no longer exists; the moves `deployInternal` and `stopInternal` no longer exist; `projectQueue` in `ui/logic/compute.js` applies `queue.automation`.

- [ ] **Step 1: Write the failing tick tests**

Append to `tests/automation.test.js` (extend imports: `automationTick` from `../sim/automation.js`; `RUN_BONUS_PER_SPEED, POINTS_PER_SPEED` from `../sim/data/automation.js`; `startRun` from `../sim/training.js`; `createRng` from `../sim/rng.js`):

```js
const hit = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const ladder = (events) => events.filter((event) => event.type === 'internalWarning' || event.type === 'internalIncident');
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
const withCompute = (s) => {
  s.compute.contracts.push({
    id: 'test-capacity', supplier: 'starter', units: 90, price: 0, monthsLeft: null,
    needsPower: false, string: null, arrivedTurn: 0, scaledDown: false, troubled: false,
    dark: false, bumpTurn: null, exclusiveBought: false, headline: null,
  });
  s.compute.online = 100;
  return s;
};

test('trouble escalates warning, incident, exfiltration, then takeover at high capability', () => {
  const s = atEra(4);
  s.capability = 75;
  s.alignmentDebt = 80;
  assert.deepEqual(ladder(automationTick(s, hit)), [{ type: 'internalWarning', stage: 1 }]);
  assert.deepEqual(ladder(automationTick(s, hit)), [{ type: 'internalIncident', stage: 2 }]);
  assert.deepEqual(ladder(automationTick(s, hit)), [{ type: 'internalIncident', stage: 3 }]);
  automationTick(s, hit);
  assert.equal(s.ending, 'quietTakeover');
});

test('no trouble before era 3, and no roll at all when people check every piece of work', () => {
  const early = atEra(2);
  early.capability = 90;
  early.alignmentDebt = 90;
  for (let i = 0; i < 5; i++) automationTick(early, hit);
  assert.equal(early.automation.stage, 0);
  const checked = atEra(4);
  checked.capability = 90;
  checked.alignmentDebt = 90;
  checked.compute.online = 500;
  checked.automation.checks = { reviewers: 3, monitors: 3, aiReview: false };
  let draws = 0;
  automationTick(checked, { ...hit, chance: () => { draws += 1; return true; } });
  assert.equal(draws, 0);
  assert.equal(checked.automation.stage, 0);
});

test('no takeover before era 4: a hit at stage three holds there, then accept-shutdown adds one step', () => {
  const s = atEra(3);
  s.capability = 75;
  s.alignmentDebt = 80;
  s.constitution.hardLines = ['accept-shutdown'];
  for (let i = 0; i < 3; i++) automationTick(s, hit);
  assert.equal(s.automation.stage, 3);
  for (let i = 0; i < 3; i++) assert.deepEqual(ladder(automationTick(s, hit)), []);
  assert.equal(s.ending, null);
  s.era = 4;
  assert.deepEqual(ladder(automationTick(s, hit)), []);
  assert.equal(s.automation.stage, 4);
  automationTick(s, hit);
  assert.equal(s.ending, 'quietTakeover');
});

test('no takeover below capability 70; misses do not escalate', () => {
  const s = atEra(4);
  s.capability = 60;
  s.alignmentDebt = 80;
  for (let i = 0; i < 6; i++) automationTick(s, hit);
  assert.equal(s.automation.stage, 3);
  assert.equal(s.ending, null);
  const calm = atEra(4);
  automationTick(calm, miss);
  assert.equal(calm.automation.stage, 0);
});

test('speed feeds the active run, research points and, from ×1.5, one turn off once per run', () => {
  const s = atEra(4);
  s.activeRun = { bonus: 0, units: 2, turnsLeft: 5 };
  const points = s.researchPoints;
  automationTick(s, miss);
  near(s.activeRun.bonus, RUN_BONUS_PER_SPEED * (researchSpeed(PACK[4]) - 1), 1e-9);
  near(s.researchPoints - points, POINTS_PER_SPEED * (researchSpeed(PACK[4]) - 1), 1e-9);
  assert.equal(s.activeRun.turnsLeft, 4);
  automationTick(s, miss);
  assert.equal(s.activeRun.turnsLeft, 4);
  const slow = atEra(3);
  slow.activeRun = { bonus: 0, units: 2, turnsLeft: 5 };
  automationTick(slow, miss);
  assert.equal(slow.activeRun.turnsLeft, 5);
});

test('each tick records measured and claimed speed', () => {
  const s = atEra(4);
  s.turn = 13;
  automationTick(s, miss);
  assert.deepEqual(s.automation.history, [{ turn: 13, era: 4, speed: researchSpeed(PACK[4]), claimed: 2.4 }]);
});

test('crossing the line reports it once, on that turn', () => {
  const s = atEra(5);
  s.turn = 16;
  assert.deepEqual(automationTick(s, miss)[0], { type: 'ownLineCrossed', speed: researchSpeed(PACK[5]), line: 2 });
  assert.equal(s.automation.lineTurn, 16);
  s.turn = 17;
  assert.equal(automationTick(s, miss).some((event) => event.type === 'ownLineCrossed'), false);
  s.automation.line = 3; // era 5's pack runs at ×2.64, below ×3
  assert.equal(automationTick(s, miss).some((event) => event.type === 'ownLineCrossed'), false);
});

test('endTurn: pushing the hand-offs makes a finishing run gain more', () => {
  const gain = (automation) => {
    const s = withCompute(atEra(3));
    assert.equal(startRun(s, recipe).ok, true);
    s.activeRun.turnsLeft = 1;
    s.activeRun.spikeChance = 0;
    return endTurn(s, automation ? { automation } : {}, createRng(1)).state.pendingModel.gain;
  };
  assert.ok(gain({ levels: { review: 2, experiments: 2, choosing: 1, direction: 1 } }) > gain(null));
});

test('the old moves are gone', () => {
  const { errors } = endTurn(atEra(3), { moves: [{ type: 'deployInternal', control: 1 }] }, miss);
  assert.ok(errors.includes('unknown move deployInternal'));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/automation.test.js`
Expected: FAIL with `automationTick is not a function`.

- [ ] **Step 3: Implement the tick**

Append to `sim/automation.js` (add `import { hasLine } from './constitution.js';` and `TROUBLE_ERA, RUN_BONUS_PER_SPEED, POINTS_PER_SPEED, RUN_SKIP_SPEED` to the data import):

```js
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
```

- [ ] **Step 4: Move every importer off `sim/internal.js`**

`sim/state.js`: delete the line `internal: null,`.

`sim/turn.js`: change the automation import to `import { setAutomation, automationTick } from './automation.js';`, delete `import { deployInternal, stopInternal, internalTick } from './internal.js';`, delete the two `case 'deployInternal'` / `case 'stopInternal'` lines in `applyMove`, and replace

```js
    for (const e of internalTick(state, rng)) events.push(e);
```

with

```js
    for (const e of automationTick(state, rng)) events.push(e);
```

`sim/economy.js`: replace `import { controlUnits } from './internal.js';` with `import { controlUnits, reviewerCost } from './automation.js';` and add reviewers to the burn:

```js
  return ops + computeRent(state) + arrivingRent + spot + state.budget.spend + reviewerCost(state) - resaleCredit(state);
```

`sim/split.js`: replace `import { controlUnits } from './internal.js';` with `import { controlUnits } from './automation.js';`.

`sim/summit.js`: delete `import { stopInternal } from './internal.js';` and the line `if (binding.includes('pauseAutomation') && state.internal) stopInternal(state);` (the pause now works through `jobLocked`).

`sim/data/events.js`: replace `import { deployInternal, stopInternal } from '../internal.js';` with `import { addMonitor, handBack } from '../automation.js';`, then rewrite the two ladder cards:

```js
  {
    id: 'oversightTamper',
    kind: 'internal',
    trigger: (state) => state.automation.stage === 2 && state.automation.stageTurn === state.turn,
    warning: null,
    card: {
      title: 'Your model tried to disable its oversight',
      post: { handle: '@your_ops', text: 'caught in the logs at 3 a.m.' },
      choices: [
        {
          id: 'shutdown', label: 'Hand the work back to people', cost: 'speed', backers: ['Safety'], opposers: ['Research'],
          effects(state) { handBack(state); },
        },
        {
          id: 'controls', label: 'Add monitors', cost: '$20M', backers: ['Safety'], opposers: ['CFO'],
          effects(state) { if (addMonitor(state).ok) state.cash -= 20; },
        },
        { id: 'ignore', label: 'Ignore', cost: '—', backers: ['Research'], opposers: ['Safety'], effects() {} },
      ],
    },
  },
  {
    id: 'selfExfiltration',
    kind: 'internal',
    crisis: true,
    trigger: (state) => !hasLine(state, 'no-autonomy-grab') && state.automation.stage === 3 && state.automation.stageTurn === state.turn,
    warning: null,
    card: {
      title: 'Weights copied to an outside server',
      post: { handle: '@your_security', text: 'an internal agent moved a checkpoint off-site' },
      choices: [
        {
          id: 'report', label: 'Shut down and report to government', cost: '—', backers: ['Safety'], opposers: ['CFO'],
          effects(state) {
            handBack(state);
            state.govFavor.us += 6;
            state.publicTrust -= 4;
          },
        },
        {
          id: 'coverup', label: 'Cover it up', cost: '—', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.security -= 10;
            state.flags.coverUp = true;
          },
        },
      ],
    },
  },
```

`ui/logic/compute.js`: delete `import { deployInternal, stopInternal } from '../../sim/internal.js';` and the two `if (move.type === 'deployInternal' ...)` / `'stopInternal'` lines in `applyProjectedMove`; add `import { setAutomation } from '../../sim/automation.js';` and, in `projectBeforeMoves` directly after the `computeSplit` line:

```js
  if (Object.hasOwn(queue, 'automation')) setAutomation(state, queue.automation);
```

- [ ] **Step 5: Move the balance bot onto the free action**

In `tools/balance.js`, replace `import { controlUnits, deployInternal } from '../sim/internal.js';` with:

```js
import { jobLocked, maxLevel, setAutomation } from '../sim/automation.js';
import { HANDOFF_JOBS, JOBS, PACK } from '../sim/data/automation.js';
```

Delete `internalControl` and `canDeployInternal`, and add:

```js
// Who does the work, once per era: speed pushes every hand-off and checks nothing; safety keeps the
// pack and checks everything it can; balanced keeps the pack with some checks and AI review.
function automationChoice(state, style, rng) {
  if (state.turnInEra !== 0) return null;
  const levelFor = (id) => {
    const index = JOBS.findIndex((job) => job.id === id);
    if (style === 'speed') return maxLevel(state.era, index);
    if (style === 'random') return rng.int(0, maxLevel(state.era, index));
    return PACK[state.era][index];
  };
  const levels = Object.fromEntries(HANDOFF_JOBS.filter((id) => !jobLocked(state, id)).map((id) => [id, levelFor(id)]));
  const wanted = style === 'speed' ? { reviewers: 0, monitors: 0, aiReview: false }
    : style === 'safety' ? { reviewers: 3, monitors: 3, aiReview: true }
      : style === 'random' ? { reviewers: rng.int(0, 3), monitors: rng.int(0, 3), aiReview: rng.chance(0.5) }
        : { reviewers: 1, monitors: 2, aiReview: true };
  for (let monitors = wanted.monitors; monitors >= 0; monitors -= 1) {
    const choice = { levels, checks: { ...wanted, monitors } };
    if (setAutomation(structuredClone(state), choice).ok) return choice;
  }
  return null;
}
```

In `plannedState`, after `setComputeSplit(planned, actions.computeSplit);` add:

```js
  if (actions.automation) setAutomation(planned, actions.automation);
```

In `makeStrategy`, directly before `const planned = plannedState(state, actions);`, add the choice. It is validated against the state as `endTurn` will see it when it applies the action: after the budget and compute split, before hazards, warnings and event choices (so, for example, an `oversightTamper` "Add monitors" choice lands on top of it, in the same order as the real turn):

```js
    const preAutomation = structuredClone(state);
    preAutomation.budget = structuredClone(actions.budget);
    setComputeSplit(preAutomation, actions.computeSplit);
    const automation = automationChoice(preAutomation, policy.automation ?? style, rng);
    if (automation) actions.automation = automation;
```

`plannedState` then applies `actions.automation` right after the compute split (the line added above), so the moves are planned against the same order `endTurn` uses.

and delete the two lines that planned and queued `deployInternal` (`const control = internalControl(...)` and the `if (actions.moves.length === 0 && canDeployInternal(...))` line). Add a probe that pushes hand-offs on a balanced lab, so the quiet takeover is reachable in the report:

```js
const balancedPush = makeStrategy('balanced', balancedPrefs, { offer: 'cheapest', queue: 'standard', grid: true, automation: 'speed' });
```

and add `'balancedPush'` to `PROBES` and `balancedPush` to `STRATEGIES`.

- [ ] **Step 6: Migrate the other tests**

Delete `tests/internal.test.js` (its cases now live in `tests/automation.test.js`).

`tests/constitution.test.js`: replace `import { internalTick } from '../sim/internal.js';` with `import { automationTick } from '../sim/automation.js';`; in "accept-shutdown requires two hits after internal stage three" replace `state.internal = { control: 0, stage: 3, turns: 3, capability: 80 };` with `state.automation.stage = 3;`, every `internalTick(state, yes)` with `automationTick(state, yes)`, and every `state.internal.stage` with `state.automation.stage`; in "no-autonomy-grab blocks agent incidents…" replace `protectedState.internal = { stage: 3, stageTurn: protectedState.turn };` with `protectedState.automation.stage = 3; protectedState.automation.stageTurn = protectedState.turn;`.

`tests/economy.test.js`: replace `import { deployInternal } from '../sim/internal.js';` with `import { setAutomation } from '../sim/automation.js';`, add `projectBurn` to the economy import, and replace the control test with:

```js
test('compute reserved by monitors is not available for serving', () => {
  const s = createInitialState();
  s.era = 3;
  s.compute.online = 30;
  s.models.push(consumerModel(1e6));
  updateServing(s);
  assert.equal(setAutomation(s, { checks: { monitors: 3 } }).ok, true); // 3 × 0.7 × 8 = 16.8 units
  s.models[0].users = 15e6; // fits in 30 units, not in what is left after monitors
  const bare = structuredClone(s);
  bare.automation.checks.monitors = 0;
  updateServing(bare);
  assert.equal(computeSlices(bare).shortfall, 0);
  updateServing(s);
  assert.ok(computeSlices(s).shortfall > 0);
});

test('reviewers add to the monthly burn', () => {
  const s = createInitialState();
  s.era = 4;
  const before = projectBurn(s);
  s.automation.checks.reviewers = 2;
  assert.equal(projectBurn(s) - before, 10);
});
```

`tests/events.test.js`: add `import { jobLevels } from '../sim/automation.js';`; in the two oversight-card tests replace `s.internal = { control: 0, stage: 2, turns: 1, stageTurn: 0 };` with `s.automation.stage = 2; s.automation.stageTurn = 0;`; in "internal reporting still applies public effects…" delete `s.internal = null;`; in "internal incidents take priority…" replace `s.internal = { control: 0, stage: 1, turns: 1, stageTurn: 0 };` with `s.automation.stage = 1; s.automation.stageTurn = 0;` and `out.state.internal.stage` with `out.state.automation.stage`; replace "internal incident choices preserve escalation and enforce control compute" with:

```js
test('ladder cards act on the hand-offs: hand back, or add a monitor only if the compute fits', () => {
  const s = createInitialState();
  s.era = 4;
  s.automation.stage = 2;
  s.pendingEvents.push({ id: 'oversightTamper' });
  assert.equal(resolveEvent(s, 'oversightTamper', 'shutdown').ok, true);
  assert.deepEqual(jobLevels(s), [3, 0, 0, 0, 0]);
  assert.equal(s.automation.stage, 2);

  const room = createInitialState();
  room.era = 4;
  room.compute.online = 200;
  room.pendingEvents.push({ id: 'oversightTamper' });
  const roomCash = room.cash;
  resolveEvent(room, 'oversightTamper', 'controls');
  assert.equal(room.automation.checks.monitors, 1);
  assert.equal(room.cash, roomCash - 20);

  const blocked = createInitialState();
  blocked.era = 4;
  blocked.compute.online = 0;
  blocked.pendingEvents.push({ id: 'oversightTamper' });
  const cash = blocked.cash;
  resolveEvent(blocked, 'oversightTamper', 'controls');
  assert.equal(blocked.automation.checks.monitors, 0);
  assert.equal(blocked.cash, cash);
});
```

`tests/summit.test.js`: replace `import { deployInternal } from '../sim/internal.js';` with `import { jobLevels, setAutomation } from '../sim/automation.js';` and the pause test with:

```js
test('pauseAutomation hands choosing and direction back to people while the deal holds', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  s.models.push({ capability: 50 });
  s.automation.stage = 2;
  const r = proposeSummit(s, { proposals: ['pauseAutomation'], sweetener: 'evaluatorsFirst' }, calm);
  assert.ok(r.binding.includes('pauseAutomation'));
  assert.deepEqual(jobLevels(s).slice(3), [0, 0]);
  assert.equal(s.automation.stage, 2);
  assert.equal(setAutomation(s, { levels: { choosing: 1 } }).error, 'choosing and direction are back with people');
  s.deal.collapsed = true;
  assert.deepEqual(jobLevels(s).slice(3), [2, 1]);
});
```

`tests/turn.test.js`: in "a quiet takeover stops training and event generation for the turn" replace `s.internal = { control: 0, stage: 3, turns: 3, capability: 80 };` with `s.automation.stage = 3; s.capability = 80;`.

Then confirm nothing else reads the old mechanic:

Run: `grep -rnE "sim/internal|\.internal\b|internalStage|deployInternal|stopInternal|internalTick" sim ui tools tests | grep -v "tests/automation.test.js"`
Expected: no output. (`tests/automation.test.js` names `deployInternal` on purpose, in the test that checks the old move is rejected.)

- [ ] **Step 7: Run the whole suite**

Run: `npm test`
Expected: all pass. If a seeded test with a fixed expectation now fails, first confirm the cause is the new era-3+ roll or the new speed (for example by logging `state.automation.history`), then update the expectation and say so in the commit message. Do not loosen a test for any other reason.

- [ ] **Step 8: Update the UI menu item so the UI stays loadable**

In `ui/menu.js`, replace the `internal` item with:

```js
  { id: 'automation', label: 'Who does the work', free: true },
```

(The handler arrives in Task 7; until then the item shows "Not built yet", which `disabledReason` already handles.)

- [ ] **Step 9: Only if `sim/lumen.js` and `tools/demo-seeds.js` exist on this base**

In `sim/lumen.js`, add `import { jobLevels } from './automation.js';` and replace `if (state.internal) return 'internal';` with `if (jobLevels(state).some((level) => level >= 3)) return 'internal';` (Lumen's "internal" lines, such as "Putting me to work inside the lab…", now play once the AI leads at least one job). In `tools/demo-seeds.js`, delete the two lines that describe `deployInternal` and `stopInternal` moves (the hand-offs are not a move), and change the three "internal deployment" phrases to "the AI doing the lab's research" (for example `'the AI doing the lab\'s research caused an incident'`).

Run: `npm test && node tools/demo-seeds.js 20 > /dev/null`
Expected: both succeed.

- [ ] **Step 10: Commit**

```bash
git add -A sim tools tests ui/logic/compute.js ui/menu.js
git status --short   # confirm only files this task touched are staged
git commit -m "feat(sim): replace internal deployment with who-does-the-work tick and ladder (plan 2H task 3)"
```

---

### Task 4: The ×2 line card

**Files:**
- Modify: `sim/automation.js` (add `lockDown`)
- Modify: `sim/data/events.js` (add `ownLine`)
- Modify: `tools/balance.js` (add `ownLine: 'lockDown'` to `BALANCED_EVENT_CHOICES`)
- Test: `tests/automation.test.js`

**Interfaces:**
- Consumes: Task 3's `automationTick` setting `state.automation.lineTurn`.
- Produces: pending card `{ id: 'ownLine', title, post, choices: [lockDown, moveLine, screenOff] }`; `lockDown(state)`; `state.flags.hidLine`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/automation.test.js` (add imports: `lockDown` from `../sim/automation.js`; `eventsTick, resolveEvent, fallbackChoice` from `../sim/events.js`):

```js
test('crossing the line queues the screen-wall card', () => {
  const s = atEra(5);
  s.turn = 16;
  automationTick(s, miss);
  eventsTick(s, miss);
  assert.equal(s.pendingEvents[0].id, 'ownLine');
  assert.deepEqual(s.pendingEvents[0].choices.map((choice) => choice.id), ['lockDown', 'moveLine', 'screenOff']);
});

test('lock down hands the last two jobs back to people for the rest of the run', () => {
  const s = atEra(5);
  s.pendingEvents.push({ id: 'ownLine' });
  assert.equal(resolveEvent(s, 'ownLine', 'lockDown').ok, true);
  assert.deepEqual(jobLevels(s).slice(3), [0, 0]);
  assert.equal(s.publicTrust, 63);
  assert.equal(s.govFavor.us, 53);
  assert.equal(s.staffTrust, 72);
  assert.equal(setAutomation(s, { levels: { direction: 1 } }).ok, false);
});

test('moving the line raises it by one, costs staff trust, and the card can fire again', () => {
  const s = atEra(5);
  s.automation.lineCrossed = 2;
  s.pendingEvents.push({ id: 'ownLine' });
  resolveEvent(s, 'ownLine', 'moveLine');
  assert.equal(s.automation.line, 3);
  assert.equal(s.staffTrust, 64);
  s.compute.online = 500;
  assert.equal(setAutomation(s, { levels: { review: 4, experiments: 4, choosing: 3, direction: 2 } }).ok, true);
  assert.equal(automationTick(s, miss)[0].line, 3);
});

test('turning the screen off is the fallback and hides debt', () => {
  assert.equal(fallbackChoice('ownLine', { id: 'ownLine' }), 'screenOff');
  const s = atEra(5);
  s.pendingEvents.push({ id: 'ownLine' });
  resolveEvent(s, 'ownLine', 'screenOff');
  assert.equal(s.flags.hidLine, true);
  assert.equal(s.concealedDebt, 4);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/automation.test.js`
Expected: FAIL (no `ownLine` card; `lockDown` missing).

- [ ] **Step 3: Implement**

Append to `sim/automation.js`:

```js
export function lockDown(state) {
  state.automation.lockedDown = true;
}
```

In `sim/data/events.js`, extend the import to `import { addMonitor, handBack, lockDown } from '../automation.js';` and add after `selfExfiltration`:

```js
  {
    id: 'ownLine',
    kind: 'internal',
    trigger: (state) => state.automation.lineTurn === state.turn,
    warning: null,
    card: {
      title: 'We just crossed our own line',
      post: { handle: '@your_research', text: 'measured research speed just passed the line in our own policy' },
      choices: [
        {
          id: 'lockDown', label: 'Lock down and slow', cost: 'choosing and direction go back to people', backers: ['Safety'], opposers: ['Research'],
          effects(state) {
            lockDown(state);
            state.publicTrust += 3;
            state.govFavor.us += 3;
            state.staffTrust += 2;
          },
        },
        {
          id: 'moveLine', label: 'Move the line', cost: 'staff trust', backers: ['Research'], opposers: ['Safety'],
          effects(state) {
            state.automation.line += 1;
            state.staffTrust -= 6;
          },
        },
        {
          id: 'screenOff', label: 'Turn the screen off', cost: '—', backers: ['CFO'], opposers: ['Safety'],
          effects(state) {
            state.flags.hidLine = true;
            state.concealedDebt += 4;
          },
        },
      ],
    },
  },
```

In `tools/balance.js`, add `ownLine: 'lockDown',` to `BALANCED_EVENT_CHOICES`.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add sim/automation.js sim/data/events.js tools/balance.js tests/automation.test.js
git commit -m "feat(sim): the lab's own x2 line card (plan 2H task 4)"
```

---

### Task 5: Re-tune with the balance bot

**Files:**
- Modify: `sim/data/automation.js` (numbers only)
- Test: `tests/balance.test.js` (unchanged; it must pass)

- [ ] **Step 1: Run the report**

Run: `node tools/balance.js 100 | node -e "const r=JSON.parse(require('fs').readFileSync(0));for(const[k,v]of Object.entries(r))console.log(k,JSON.stringify(v.endings),'meanEra',v.meanEra.toFixed(2),'died3-4',v.diedInEra3or4,'rejected',v.rejectedActions)"`

Compare with the baseline recorded in the spec (section 6): speed 43 acquihire / 57 board removal; safety 93 acquihire; balanced 59 misalignment / 27 board removal / 5 aligned.

- [ ] **Step 2: Check the targets**

- No strategy wins (aligned + pacingDeal + pyrrhic) in more than about 33 of 100 runs.
- The extreme strategies (speed, safety) mostly die in eras 3–4, as `tests/balance.test.js` checks.
- `rejected` is 0 for every strategy.
- `quietTakeover` appears for at least one strategy (expected: `balancedPush`). If it never appears, raise `RISK_SCALE` in steps of 0.1 (up to 1.0), then lower `MONITOR_CAPACITY`/`REVIEWER_CAPACITY` by 0.02 at a time, re-running after each change.
- If the balanced strategy's win rate rises above a third because the default speed-up helps everyone, lower `RUN_BONUS_PER_SPEED` in steps of 1.

Change only `sim/data/automation.js`, and only these knobs: `RISK_SCALE`, `REVIEWER_CAPACITY`, `MONITOR_CAPACITY`, `RUN_BONUS_PER_SPEED`, `POINTS_PER_SPEED`. The tests read these from the constants, so they follow. The level table, the pack, the job shares and the costs are asserted in the tests exactly as the spec states them; if the report shows one of those must change, stop and ask the owner, then change the spec, the table and those tests together. Record each change and its report line in the ledger (`.superpowers/sdd/progress.md` if the project keeps one, otherwise the commit message).

- [ ] **Step 3: Run the suite**

Run: `npm test`
Expected: all pass (the balance tests included).

- [ ] **Step 4: Commit**

```bash
git add sim/data/automation.js
git commit -m "tune(sim): who-does-the-work numbers from the balance report (plan 2H task 5)"
```

---

### Task 6: UI view model, scenarios and the menu handler hook

**Files:**
- Create: `ui/logic/automation.js`
- Modify: `ui/logic/scenarios.js` (add `automation` and `ownLine`)
- Test: `tests/ui-automation.test.js` (new)

**Interfaces:**
- Consumes: `sim/automation.js`, `sim/data/automation.js`.
- Produces: `automationBase(state, queue) → state` (the state as `endTurn` will see it when it applies the automation choice: this turn's queued budget, split, pledge, contract actions and event choices applied, the queued automation and the moves left out); `automationDraft(state, queued?) → { levels: {review, experiments, choosing, direction}, checks }`; `automationPayload(state, draft) → { levels (changed jobs only), checks }`; `automationView(state, draft) → { error, rows[5], bottleneck, speed, claimed, codeShare, checkedShare, unchecked, exposure, reviewerCost, monitorUnits, checks }` where each row is `{ id, name, short, level, pack, max, fixed, locked, timeShare }`; `automationOpinions(view) → [{ id, mood, text }]`; `dressingView(state) → { agents, pile, glow }`; `screenWallView(state) → { points, line, top, latest }`; `SCENARIOS.automation`, `SCENARIOS.ownLine`.

- [ ] **Step 1: Write the failing tests**

Create `tests/ui-automation.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { handBack } from '../sim/automation.js';
import {
  automationBase, automationDraft, automationPayload, automationView, automationOpinions, dressingView, screenWallView,
} from '../ui/logic/automation.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

const atEra = (era) => {
  const s = createInitialState();
  s.era = era;
  return s;
};

test('the draft starts from the state and a queued choice', () => {
  const s = atEra(4);
  assert.deepEqual(automationDraft(s), {
    levels: { review: 2, experiments: 2, choosing: 1, direction: 0 },
    checks: { reviewers: 0, monitors: 0, aiReview: false },
  });
  assert.equal(automationDraft(s, { levels: { review: 3 }, checks: { reviewers: 2 } }).levels.review, 3);
});

test('the dialog validates against this turn's queued compute split, not the start-of-turn state', () => {
  const s = atEra(4);
  s.compute.online = 30;
  s.compute.split.safety = 0;
  const draft = { ...automationDraft(s), checks: { reviewers: 0, monitors: 1, aiReview: false } }; // 21 units
  assert.equal(automationView(s, draft).error, '');
  const base = automationBase(s, { moves: [], computeSplit: { safety: 0.5 } });
  assert.equal(automationView(base, draft).error, 'not enough free compute for monitors');
});

test('the payload sends only the jobs the player changed, so a hand-back is not undone by OK', () => {
  const s = atEra(4);
  handBack(s);
  const draft = automationDraft(s);
  draft.levels.review = 2;
  assert.deepEqual(automationPayload(s, draft).levels, { review: 2 });
});

test('the view shows the grid, speed, claim, code share and checks', () => {
  const s = atEra(4);
  const view = automationView(s, automationDraft(s));
  assert.equal(view.error, '');
  assert.deepEqual(view.rows.map((row) => [row.id, row.level, row.pack, row.max, row.fixed]), [
    ['code', 3, 3, 3, true],
    ['review', 2, 2, 3, false],
    ['experiments', 2, 2, 3, false],
    ['choosing', 1, 1, 2, false],
    ['direction', 0, 0, 1, false],
  ]);
  assert.equal(view.bottleneck, 'experiments');
  assert.equal(view.claimed, 2.4);
  assert.equal(view.codeShare, 0.8);
  assert.equal(view.checkedShare, 0);
  const pushed = automationView(s, { ...automationDraft(s), levels: { review: 9 } });
  assert.notEqual(pushed.error, '');
});

test('advisors react to unchecked work and to room to push', () => {
  const s = atEra(4);
  const lines = automationOpinions(automationView(s, automationDraft(s)));
  assert.deepEqual(lines.map((line) => line.id), ['research', 'safety', 'cfo', 'policy']);
  assert.equal(lines[0].mood, 'eager');
  assert.equal(lines[1].mood, 'alarmed');
});

test('office dressing follows code level, exposure and speed', () => {
  const early = dressingView(atEra(1));
  assert.equal(early.agents, 1);
  assert.equal(early.pile, 0);
  assert.ok(early.glow < 0.05);
  const era5 = dressingView(atEra(5));
  assert.equal(era5.agents, 4);
  assert.equal(era5.pile, 3);
  assert.ok(era5.glow > 0.8);
});

test('the screen wall plots the recorded history against the line', () => {
  const s = atEra(5);
  s.automation.history = [
    { turn: 0, era: 1, speed: 1.03, claimed: 1.1 },
    { turn: 16, era: 5, speed: 2.1, claimed: 3.8 },
  ];
  const view = screenWallView(s);
  assert.equal(view.line, 2);
  assert.equal(view.top, 4);
  assert.equal(view.latest.speed, 2.1);
});

test('scenarios reach the grid state and the waiting line card', () => {
  assert.ok([1, 2, 3, 4, 5].some((seed) => SCENARIOS.automation(seed).era === 4));
  assert.ok([1, 2, 3, 4, 5].some((seed) => SCENARIOS.ownLine(seed).pendingEvents.some((pending) => pending.id === 'ownLine')));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/ui-automation.test.js`
Expected: FAIL with `Cannot find module '.../ui/logic/automation.js'`.

- [ ] **Step 3: Implement the view model**

Create `ui/logic/automation.js`:

```js
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
```

Note: the office test `dressingView(atEra(1)).pile` is 0 because era 1's pack has no checking load.

- [ ] **Step 4: Add the scenarios**

In `ui/logic/scenarios.js`, add `import { setAutomation } from '../../sim/automation.js';` and, above `export const SCENARIOS`:

```js
// An era-4 turn with the hand-offs pushed and little checked, for the grid and office screenshots.
function automationState(seed) {
  const state = atEra(seed, 4);
  if (state.ending || state.era !== 4) return state;
  setAutomation(state, { levels: { review: 3, experiments: 3, choosing: 2 }, checks: { reviewers: 1 } });
  return state;
}

// A state with the x2 line card waiting, for the screen-wall screenshot.
function ownLineState(seed) {
  const rng = createRng(seed);
  let state = atEra(seed, 4);
  const automation = { levels: { review: 3, experiments: 3, choosing: 2, direction: 1 }, checks: { reviewers: 3, aiReview: true } };
  for (let guard = 0; guard < 6 && !state.ending && !state.pendingEvents.some((pending) => pending.id === 'ownLine'); guard += 1) {
    ({ state } = endTurn(state, { ...scriptedActions(state), automation: state.era === 4 ? automation : { checks: automation.checks } }, rng));
  }
  return state;
}
```

and add `automation: automationState,` and `ownLine: ownLineState,` to `SCENARIOS`.

- [ ] **Step 5: Run the tests**

Run: `node --test tests/ui-automation.test.js && npm test`
Expected: all pass. If `SCENARIOS.ownLine` finds the card for none of seeds 1–5, print `state.automation.history.at(-1)` and `state.ending` for seed 1 to see why before changing anything.

- [ ] **Step 6: Commit**

```bash
git add ui/logic/automation.js ui/logic/scenarios.js tests/ui-automation.test.js
git commit -m "feat(ui): who-does-the-work view model and scenarios (plan 2H task 6)"
```

---

### Task 7: 1A, the level-grid dialog

Load the `design` skill before this task (Global Constraints). Mockup to match: `docs/design/mockups/automation/w-a.jpg`.

**Files:**
- Create: `ui/screens/automation.js`
- Modify: `ui/main.js` (mount it; debug route `#automation`)
- Modify: `ui/styles.css` (append one block)

**Interfaces:**
- Consumes: Task 6's view model; `openDialog` from `ui/components/dialog.js`; `teamPanel` from `ui/components/team.js`; `registerMenuHandler` from `ui/menu.js`; `game.setField`.
- Produces: `openAutomation(game, overlayRoot)`, `mountAutomation(game, overlayRoot) → unregister`.

- [ ] **Step 1: Write the screen**

Create `ui/screens/automation.js`:

```js
import { LEVEL_SHORT, LEVELS, MAX_CHECK } from '../../sim/data/automation.js';
import { automationBase, automationDraft, automationOpinions, automationPayload, automationView } from '../logic/automation.js';
import { computeAmount, money, pct } from '../logic/format.js';
import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { registerMenuHandler } from '../menu.js';

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const times = (value) => `×${value.toFixed(1)}`;

function stepper(label, value, detail, onChange) {
  const root = element('div', 'automation-stepper');
  const minus = element('button', '', '−');
  const plus = element('button', '', '+');
  for (const [button, delta, name] of [[minus, -1, 'fewer'], [plus, 1, 'more']]) {
    button.type = 'button';
    button.setAttribute('aria-label', `${label}: ${name}`);
    button.disabled = value + delta < 0 || value + delta > MAX_CHECK;
    button.addEventListener('click', () => onChange(value + delta, `${label}: ${name}`));
  }
  const copy = element('div', 'automation-stepper-copy');
  copy.append(element('b', '', `${label} ${value}`), element('small', '', detail));
  root.append(minus, copy, plus);
  return root;
}

export function openAutomation(game, overlayRoot) {
  const state = automationBase(game.state, game.queue);
  const draft = automationDraft(state, game.queue.automation);
  const body = element('div', 'automation-body');
  const team = element('div', 'budget-team');
  const right = element('div', 'automation-side');
  const error = element('div', 'dialog-error');
  error.setAttribute('role', 'alert');
  let opened;

  function grid(view) {
    const root = element('div', 'automation-grid');
    root.setAttribute('role', 'grid');
    root.append(element('span', 'automation-corner'));
    for (const name of LEVEL_SHORT) root.append(element('span', 'automation-head', name));
    for (const row of view.rows) {
      root.append(element('span', 'automation-job', row.name));
      for (let level = 0; level < LEVELS.length; level += 1) {
        const cell = element('button', 'automation-cell');
        cell.type = 'button';
        const chosen = row.level === level;
        const reachable = !row.fixed && !row.locked && level <= row.max;
        cell.classList.toggle('chosen', chosen);
        cell.classList.toggle('off', !reachable && !chosen);
        cell.classList.toggle('pack', row.pack === level);
        cell.setAttribute('aria-pressed', `${chosen}`);
        cell.setAttribute('aria-label', `${row.name}: ${LEVELS[level]}`);
        if (chosen) cell.textContent = row.locked ? 'Back with people' : LEVEL_SHORT[level];
        if (!reachable || chosen) cell.setAttribute('aria-disabled', 'true');
        else cell.addEventListener('click', () => { draft.levels[row.id] = level; render(`${row.name}: ${LEVELS[level]}`); });
        root.append(cell);
      }
    }
    return root;
  }

  function timeBar(view) {
    const root = element('div', 'automation-time');
    const head = element('div', 'automation-time-head');
    const slowest = view.rows.find((row) => row.id === view.bottleneck);
    head.append(element('b', '', 'Where the research time goes'), element('span', '', `slowest step: ${slowest.name.toLowerCase()}`));
    const bar = element('div', 'automation-time-bar');
    for (const row of view.rows) {
      const part = element('span', `job-${row.id}${row.id === view.bottleneck ? ' bottleneck' : ''}`, row.timeShare >= 0.09 ? row.short : '');
      part.style.flex = `${row.timeShare} 1 0%`;
      bar.append(part);
    }
    root.append(head, bar);
    return root;
  }

  function checksRow(view) {
    const root = element('div', 'automation-checks');
    root.append(
      stepper('Reviewers', view.checks.reviewers, `${money(view.reviewerCost)} a month`, (value, focus) => { draft.checks.reviewers = value; render(focus); }),
      stepper('Monitors', view.checks.monitors, `${computeAmount(view.monitorUnits, state.era)} of compute`, (value, focus) => { draft.checks.monitors = value; render(focus); }),
    );
    const ai = element('button', `compute-toggle${view.checks.aiReview ? ' enabled' : ''}`);
    ai.type = 'button';
    ai.setAttribute('role', 'switch');
    ai.setAttribute('aria-checked', `${view.checks.aiReview}`);
    ai.setAttribute('aria-label', 'AI review');
    const copy = element('span');
    copy.append(element('b', '', 'AI review'), element('small', '', 'cheap, shares its blind spots'));
    ai.append(copy, element('i', view.checks.aiReview ? 'on' : ''));
    ai.addEventListener('click', () => { draft.checks.aiReview = !view.checks.aiReview; render('AI review'); });
    root.append(ai);
    return root;
  }

  function side(view) {
    const root = element('div', 'automation-stats');
    const stat = (label, big, rest, extra) => {
      const block = element('section', 'automation-stat');
      block.append(element('h3', '', label));
      const line = element('p');
      line.append(element('b', '', big), document.createTextNode(` ${rest}`));
      block.append(line);
      if (extra) block.append(extra);
      root.append(block);
    };
    stat('Research speed', times(view.speed), 'faster than by hand', element('small', '', `Head of Research says ${times(view.claimed)}`));
    stat('AI writes', pct(view.codeShare), 'of our code');
    const meter = element('div', 'automation-meter');
    const fill = element('i');
    fill.style.width = pct(view.checkedShare);
    meter.append(fill);
    const extra = element('div');
    extra.append(meter);
    if (view.unchecked > 0) extra.append(element('small', '', 'Hire reviewers or add monitors to check more'));
    stat('Checked this month', pct(view.checkedShare), "of the AI's work", extra);
    return root;
  }

  function render(focusLabel) {
    const view = automationView(state, draft);
    error.textContent = view.error ? view.error[0].toUpperCase() + view.error.slice(1) : '';
    const legend = element('div', 'automation-legend', 'Where most labs are now');
    body.replaceChildren(grid(view), legend, timeBar(view), checksRow(view), error);
    team.replaceChildren(...teamPanel(state, { opinions: automationOpinions(view) }).children);
    right.replaceChildren(side(view));
    if (focusLabel) [...body.querySelectorAll('[aria-label]')].find((node) => node.getAttribute('aria-label') === focusLabel)?.focus();
  }

  opened = openDialog(overlayRoot, {
    title: 'Who does the work',
    subtitle: 'How much of each job your AI does inside the lab',
    left: { title: 'Team', content: team },
    right: { title: 'This month', content: right },
    body,
    onOk() {
      const view = automationView(state, draft);
      if (view.error) {
        error.textContent = view.error[0].toUpperCase() + view.error.slice(1);
        return;
      }
      game.setField('automation', automationPayload(state, draft));
      opened.close();
    },
  });
  opened.classList.add('company-dialog', 'automation-dialog');
  render();
  return opened;
}

export function mountAutomation(game, overlayRoot) {
  return registerMenuHandler('automation', () => openAutomation(game, overlayRoot));
}
```

- [ ] **Step 2: Mount it and add the debug route**

In `ui/main.js`: `import { mountAutomation, openAutomation } from './screens/automation.js';`, call `mountAutomation(game, overlay);` next to `mountHistory(game, overlay);`, and in `openDebugRoute` add before the `#menu` check:

```js
  if (location.hash === '#automation') {
    openAutomation(game, overlay);
    return;
  }
```

- [ ] **Step 3: Style it**

Append to `ui/styles.css` (one block; keep every new selector under `.automation-`, `.screenwall-`, `.agent-dots`, `.review-pile` or `.rack-glow`):

```css
/* Plan 2H: who does the work (1A grid, 1B dressing, 3C screen wall) */
/* Same frame as the budget dialog, so the wide body clears both side panels (816 px centre, 250 and 266 px sides). */
.automation-dialog .dlg { top: 94px; left: 306px; width: 816px; min-height: 0; }
.automation-dialog .dialog-left { top: 150px; left: 40px; width: 250px; }
.automation-dialog .dialog-right { top: 150px; right: 40px; width: 266px; }
.automation-body { display: grid; gap: 14px; }
.automation-grid { display: grid; grid-template-columns: 170px repeat(5, 1fr); gap: 8px 10px; align-items: center; }
.automation-head { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: color-mix(in srgb, var(--ink) 60%, transparent); text-align: center; }
.automation-job { font-weight: 800; color: var(--ink); }
.automation-cell { position: relative; height: 32px; border-radius: 8px; border: 1.5px solid color-mix(in srgb, var(--sky) 45%, var(--cream)); background: color-mix(in srgb, var(--sky) 14%, var(--paper)); font: inherit; font-size: 13px; font-weight: 800; color: var(--paper); cursor: pointer; }
.automation-cell:hover:not([aria-disabled="true"]) { border-color: var(--sky); }
.automation-cell.chosen { background: var(--sky); border-color: color-mix(in srgb, var(--sky) 70%, var(--ink)); }
.automation-cell.off { background: var(--paper); border-color: color-mix(in srgb, var(--ink) 12%, transparent); cursor: default; }
.automation-cell.pack::after { content: ''; position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); border: 5px solid transparent; border-bottom-color: var(--wood); }
.automation-legend { font-size: 12px; color: color-mix(in srgb, var(--ink) 65%, transparent); }
.automation-legend::before { content: '▲ '; color: var(--wood); }
.automation-time-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.automation-time-head span { font-weight: 800; }
.automation-time-bar { display: flex; height: 30px; border-radius: 8px; overflow: hidden; gap: 2px; }
.automation-time-bar span { display: grid; place-items: center; color: var(--paper); font-size: 12px; font-weight: 800; white-space: nowrap; overflow: hidden; }
.automation-time-bar .job-code { background: var(--sky); }
.automation-time-bar .job-review { background: color-mix(in srgb, var(--sky) 70%, var(--ink)); }
.automation-time-bar .job-experiments { background: color-mix(in srgb, var(--coral) 80%, var(--paper)); }
.automation-time-bar .job-choosing { background: var(--teal); }
.automation-time-bar .job-direction { background: var(--wood); }
.automation-time-bar .bottleneck { background: repeating-linear-gradient(135deg, var(--coral) 0 8px, color-mix(in srgb, var(--coral) 70%, var(--paper)) 8px 16px); }
.automation-checks { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 10px; }
.automation-stepper { display: flex; align-items: center; gap: 8px; }
.automation-stepper button { width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid var(--wood); background: var(--paper); font: inherit; font-weight: 800; cursor: pointer; }
.automation-stepper button:disabled { opacity: .35; cursor: default; }
.automation-stepper-copy { display: grid; line-height: 1.2; }
.automation-stepper-copy small { color: color-mix(in srgb, var(--ink) 65%, transparent); }
.automation-stat { padding: 10px 0; border-bottom: 1px solid color-mix(in srgb, var(--wood) 30%, transparent); }
.automation-stat h3 { margin: 0 0 2px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--wood); }
.automation-stat p { margin: 0; }
.automation-stat b { font-size: 30px; font-weight: 900; }
.automation-stat small { display: block; font-size: 12px; color: color-mix(in srgb, var(--ink) 70%, transparent); }
.automation-meter { height: 8px; border-radius: 4px; margin: 6px 0; background: repeating-linear-gradient(135deg, var(--coral) 0 6px, color-mix(in srgb, var(--coral) 60%, var(--paper)) 6px 12px); overflow: hidden; }
.automation-meter i { display: block; height: 100%; background: var(--teal); }
```

- [ ] **Step 4: Render and look at it**

Run: `tools/shot.sh automation '#automation'`
Open the saved PNG under `shots/` and compare with `docs/design/mockups/automation/w-a.jpg`: the grid, the pack triangles, the hatched bottleneck, the checks row and the right-hand numbers must all be visible with nothing clipped. Fix anything that reads worse than the mockup, re-shoot, and look again. Then click through once in the browser pane (`python3 -m http.server` from the worktree, open `index.html?scenario=automation#automation`), change a level and a check, press OK, open the dialog again and confirm the choice stuck; press OK with monitors past free compute and confirm the error shows.

- [ ] **Step 5: Commit**

```bash
git add ui/screens/automation.js ui/main.js ui/styles.css
git commit -m "feat(ui): who-does-the-work level grid (1A) (plan 2H task 7)"
```

---

### Task 8: 1B's office dressing

**Files:**
- Modify: `ui/office.js`
- Modify: `ui/styles.css` (inside the plan 2H block)

**Interfaces:**
- Consumes: Task 6's `dressingView(state)`; anchors `heads.researcher1`, `heads.researcher2`, `heads.safety`, `rack`.

- [ ] **Step 1: Draw the dressing**

In `ui/office.js`, add `import { dressingView } from './logic/automation.js';` and:

```js
const AGENT_SVG = `<svg viewBox="0 0 12 14" width="13" height="15" aria-hidden="true">
  <line x1="6" y1="0.8" x2="6" y2="3" style="stroke:var(--ink);stroke-width:1.2"/>
  <rect x="1" y="3" width="10" height="8" rx="3" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.2"/>
  <circle cx="4.5" cy="7" r="1.1" style="fill:var(--sky)"/><circle cx="7.5" cy="7" r="1.1" style="fill:var(--sky)"/></svg>`;

// 1B's signs without its labels: agents beside the researchers, the unchecked pile on the Safety desk, the racks' glow.
function dressOffice(fx, anchors, state) {
  const view = dressingView(state);
  const add = (className, [x, y], html = '') => {
    const node = document.createElement('div');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerHTML = html;
    fx.append(node);
    return node;
  };
  for (const key of ['researcher1', 'researcher2']) {
    const head = anchors?.heads?.[key];
    if (head && view.agents > 0) add('agent-dots', [head[0] - 38, head[1] + 16], AGENT_SVG.repeat(view.agents));
  }
  const safety = anchors?.heads?.safety;
  if (safety && view.pile > 0) add(`review-pile pile-${view.pile}`, [safety[0] + 24, safety[1] + 34], '<i></i>'.repeat(view.pile * 2));
  if (anchors?.rack && view.glow > 0) add('rack-glow', anchors.rack).style.opacity = `${view.glow}`;
}
```

Call `dressOffice(fx, current.anchors, state);` directly after each of the two `setMoods(current.svg, fx, current.anchors, state);` calls in `mountOffice` (`setMoods` clears `fx` first, so the dressing must come after it).

- [ ] **Step 2: Style it**

Append inside the plan 2H block of `ui/styles.css`:

```css
.agent-dots, .review-pile, .rack-glow { position: absolute; pointer-events: none; }
.agent-dots { display: flex; gap: 1px; transform: translate(-50%, 0); }
.review-pile { width: 26px; display: flex; flex-direction: column-reverse; transform: translate(-50%, -100%); }
.review-pile i { display: block; height: 4px; margin-top: -1px; border: 1px solid var(--ink); border-radius: 1px; background: var(--paper); }
.review-pile i:nth-child(odd) { transform: translateX(2px) rotate(-3deg); }
.review-pile.pile-3 i { background: color-mix(in srgb, var(--coral) 18%, var(--paper)); }
.rack-glow { width: 220px; height: 220px; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--sky) 55%, transparent), transparent 70%); mix-blend-mode: screen; }
```

- [ ] **Step 3: Render and look at it**

Run: `tools/shot.sh automation` and `tools/shot.sh start`
Open both PNGs. In the era-4 shot the agents must sit beside (not on) the two researchers, the pile must sit on the Safety desk, and the racks must glow softly; in the era-1 shot there is one agent per researcher, no pile and almost no glow. Adjust the pixel offsets in `dressOffice` until each sits where 1B's mockup (`docs/design/mockups/automation/w-b.jpg`) puts it, re-shooting after each change.

- [ ] **Step 4: Commit**

```bash
git add ui/office.js ui/styles.css
git commit -m "feat(ui): always-on office signs of AI doing the work (1B dressing) (plan 2H task 8)"
```

---

### Task 9: 3C, the line on the screen wall

Mockup to match: `docs/design/mockups/automation/t-c.jpg`.

**Files:**
- Create: `ui/screens/screenwall.js`
- Modify: `ui/main.js` (mount it)
- Modify: `ui/styles.css` (inside the plan 2H block)

**Interfaces:**
- Consumes: Task 6's `screenWallView(state)`; the pending card `ownLine`; `game.setField('eventChoices', …)`.
- Produces: `mountScreenWall(game, overlayRoot) → unsubscribe`.

- [ ] **Step 1: Write the screen**

Create `ui/screens/screenwall.js`:

```js
import { ERAS } from '../../sim/data/eras.js';
import { screenWallView } from '../logic/automation.js';

const W = 900;
const H = 290;
const PAD = { left: 50, right: 150, top: 20, bottom: 36 };
const TOTAL_TURNS = ERAS.reduce((sum, era) => sum + era.turns, 0);
const DETAIL = { lockDown: 'Hand choosing back to people', screenOff: 'Keep going quietly' };

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function chart(view) {
  const x = (turn) => PAD.left + (turn / (TOTAL_TURNS - 1)) * (W - PAD.left - PAD.right);
  const y = (speed) => H - PAD.bottom - ((speed - 1) / (view.top - 1)) * (H - PAD.top - PAD.bottom);
  const path = (key) => view.points.map((point, index) => `${index ? 'L' : 'M'}${x(point.turn).toFixed(1)},${y(point[key]).toFixed(1)}`).join(' ');
  let grid = '';
  for (let speed = 1; speed <= view.top; speed += 1) {
    grid += `<text x="${PAD.left - 12}" y="${y(speed) + 4}" class="screenwall-axis" text-anchor="end">×${speed}</text>`;
  }
  let turn = 0;
  for (const era of ERAS) {
    grid += `<line x1="${x(turn)}" y1="${PAD.top}" x2="${x(turn)}" y2="${H - PAD.bottom}" class="screenwall-grid"/>
      <text x="${x(turn) + 6}" y="${H - 12}" class="screenwall-axis">Era ${era.id}</text>`;
    turn += era.turns;
  }
  const latest = view.latest;
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Research speed over the run against our own line">
    ${grid}
    <line x1="${PAD.left}" y1="${y(view.line)}" x2="${W - 20}" y2="${y(view.line)}" class="screenwall-line"/>
    <text x="${PAD.left + 10}" y="${y(view.line) - 8}" class="screenwall-line-label">×${view.line} · our own line</text>
    <path d="${path('claimed')}" class="screenwall-claimed"/>
    <path d="${path('speed')}" class="screenwall-measured"/>
    ${latest ? `<text x="${x(latest.turn) + 10}" y="${y(latest.claimed) + 4}" class="screenwall-claim-label">Head of Research says ×${latest.claimed.toFixed(1)}</text>
    <circle cx="${x(latest.turn)}" cy="${y(latest.speed)}" r="7" class="screenwall-dot"/>
    <text x="${x(latest.turn) + 12}" y="${y(latest.speed) + 22}" class="screenwall-measured-label">Measured ×${latest.speed.toFixed(1)}</text>` : ''}
  </svg>`;
  const holder = element('div', 'screenwall-chart');
  holder.innerHTML = svg;
  return holder;
}

function openScreenWall(game, overlayRoot, pending) {
  const view = screenWallView(game.state);
  const layer = element('div', 'screenwall-layer');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', pending.title);
  const panel = element('section', 'screenwall');
  const bar = element('div', 'screenwall-bar');
  bar.append(element('span', '', 'Research speed · screen wall'), element('b', 'screenwall-live', 'Live'));
  const choices = element('div', 'screenwall-choices');
  for (const choice of pending.choices) {
    const button = element('button', 'screenwall-choice');
    button.type = 'button';
    button.append(element('b', '', choice.label), element('small', '', DETAIL[choice.id] ?? `Amend the policy to ×${view.line + 1}`));
    button.addEventListener('click', () => {
      game.setField('eventChoices', { ...(game.queue.eventChoices ?? {}), [pending.id]: choice.id });
      layer.remove();
    });
    choices.append(button);
  }
  panel.append(bar, element('h2', '', pending.title), chart(view), choices);
  layer.append(element('div', 'dialog-veil'), panel);
  overlayRoot.append(layer);
  choices.querySelector('button')?.focus();
}

// Opens when the x2 card is waiting and nothing else is on screen; the choice is queued for this turn.
export function mountScreenWall(game, overlayRoot) {
  const check = () => {
    if (game.state.ending) return; // a finished run takes no more choices
    const pending = game.state.pendingEvents.find((card) => card.id === 'ownLine');
    if (!pending || Object.hasOwn(game.queue.eventChoices ?? {}, pending.id)) return;
    if (overlayRoot.querySelector('.dialog-layer, .screenwall-layer')) return;
    openScreenWall(game, overlayRoot, pending);
  };
  overlayRoot.addEventListener('gdt-dialog-closed', check);
  check();
  return game.subscribe(check);
}
```

- [ ] **Step 2: Mount it**

In `ui/main.js`: `import { mountScreenWall } from './screens/screenwall.js';` and call `mountScreenWall(game, overlay);` after `mountTurnSummary(overlay, game);`.

- [ ] **Step 3: Style it**

Append inside the plan 2H block of `ui/styles.css`:

```css
/* #overlay has pointer-events: none, so the layer must turn them back on or clicks fall through to the office. */
.screenwall-layer { position: absolute; inset: 0; display: grid; place-items: center; z-index: 30; pointer-events: auto; }
.screenwall { position: relative; width: 1040px; border-radius: 14px; background: color-mix(in srgb, var(--ink) 96%, var(--sky)); color: var(--paper); box-shadow: 0 24px 60px color-mix(in srgb, var(--ink) 45%, transparent); overflow: hidden; }
.screenwall-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: color-mix(in srgb, var(--ink) 80%, var(--sky)); font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.screenwall-live { padding: 2px 8px; border-radius: 5px; background: var(--coral); }
.screenwall h2 { margin: 18px 22px 4px; font-size: 30px; font-weight: 400; }
.screenwall-chart { padding: 0 22px; }
.screenwall-chart svg { display: block; width: 100%; height: auto; }
.screenwall-axis { font: 700 12px Nunito, sans-serif; fill: color-mix(in srgb, var(--paper) 70%, transparent); }
.screenwall-grid { stroke: color-mix(in srgb, var(--paper) 14%, transparent); }
.screenwall-line { stroke: var(--coral); stroke-width: 2.5; stroke-dasharray: 10 7; }
.screenwall-line-label { font: 800 13px Nunito, sans-serif; fill: var(--coral); }
.screenwall-measured { fill: none; stroke: var(--sky); stroke-width: 3.5; stroke-linecap: round; }
.screenwall-claimed { fill: none; stroke: var(--wood); stroke-width: 2.5; stroke-dasharray: 1 6; stroke-linecap: round; }
.screenwall-claim-label { font: 800 13px Nunito, sans-serif; fill: var(--wood); }
.screenwall-measured-label { font: 800 14px Nunito, sans-serif; fill: var(--paper); }
.screenwall-dot { fill: var(--paper); stroke: var(--sky); stroke-width: 3; }
.screenwall-choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 16px 22px 22px; }
.screenwall-choice { display: grid; gap: 4px; text-align: left; padding: 14px 16px; border-radius: 10px; border: 0; background: var(--paper); color: var(--ink); font: inherit; cursor: pointer; }
.screenwall-choice b { font-size: 16px; }
.screenwall-choice small { color: color-mix(in srgb, var(--ink) 65%, transparent); }
.screenwall-choice:hover, .screenwall-choice:focus-visible { outline: 3px solid var(--sky); }
```

- [ ] **Step 4: Render and look at it**

Run: `tools/shot.sh ownLine` (use the first seed from Task 6 that reaches the card, for example by adding `&seed=N` if `shot.sh` supports a seed, otherwise temporarily pinning it in the scenario call).
Compare with `docs/design/mockups/automation/t-c.jpg`: the solid measured line reaching the dashed ×2 line, the dotted claim above it, both labels readable and inside the panel, three choices along the bottom. Then in the browser pane, click "Turn the screen off" with the mouse (this also proves the layer takes clicks), end the turn, and confirm in the console that `ownLine` is gone from the pending events and the `hidLine` flag is set (the turn summary does not list explicitly chosen events), and that the wall does not reopen. Also check that on a run that has already ended the wall never opens.

- [ ] **Step 5: Commit**

```bash
git add ui/screens/screenwall.js ui/main.js ui/styles.css
git commit -m "feat(ui): the x2 line on the screen wall (3C) (plan 2H task 9)"
```

---

### Task 10 (only if time allows): the AI queues its own moves (sim)

**Files:**
- Modify: `sim/data/automation.js` (proposal constants), `sim/automation.js` (`aiProposals`, `applyApprovals`), `sim/turn.js`
- Test: `tests/automation.test.js`

**Interfaces:**
- Produces: `state.automation.proposals: [{ id, label, risky }]`, `state.automation.autoApprove: boolean`; `endTurn` accepts `actions.aiApprovals = { [proposalId]: true }` and `actions.aiAutoApprove: boolean`; events `{ type: 'aiMove', id }`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/automation.test.js` and extend the import from `../sim/automation.js` with `aiProposals, applyApprovals`:

```js
test('from "leads" in choosing or direction, the AI proposes its own moves', () => {
  const s = atEra(5);
  assert.deepEqual(aiProposals(s, miss), []); // choosing is at Collaborates in era 5's pack
  s.compute.online = 500;
  setAutomation(s, { levels: { choosing: 3 }, checks: { monitors: 1 } });
  s.activeRun = { bonus: 0, units: 2, turnsLeft: 3 };
  const ids = aiProposals(s, hit).map((proposal) => proposal.id);
  assert.deepEqual(ids, ['overnight', 'lessLogs']);
  s.compute.online = controlUnits(s); // every unit taken by monitors: no idle compute to run experiments on
  assert.deepEqual(aiProposals(s, hit).map((proposal) => proposal.id), ['lessLogs']);
});

test('approved moves run without using the two moves; the risky one weakens oversight', () => {
  const s = atEra(5);
  s.automation.checks.monitors = 1;
  s.activeRun = { bonus: 0, units: 2, turnsLeft: 3 };
  s.automation.proposals = [{ id: 'overnight', label: '', risky: false }, { id: 'lessLogs', label: '', risky: true }];
  const events = applyApprovals(s, { overnight: true, lessLogs: true });
  assert.deepEqual(events, [{ type: 'aiMove', id: 'overnight' }, { type: 'aiMove', id: 'lessLogs' }]);
  assert.equal(s.activeRun.bonus, 2);
  assert.equal(s.automation.checks.monitors, 0);
  assert.equal(s.concealedDebt, 3);
  assert.deepEqual(s.automation.proposals, []);
});

test('"let it go ahead without asking" approves everything from then on', () => {
  const s = atEra(5);
  s.automation.autoApprove = true;
  s.automation.proposals = [{ id: 'overnight', label: '', risky: false }];
  assert.equal(applyApprovals(s, {}).length, 1);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test tests/automation.test.js`
Expected: FAIL with `aiProposals is not a function`.

- [ ] **Step 3: Implement**

Add to `sim/data/automation.js`:

```js
export const PROPOSE_LEVEL = 3; // "Leads" in choosing or direction
export const LESS_LOGS_CHANCE = 0.35;
export const LESS_LOGS_DEBT = 3;
export const OVERNIGHT_BONUS = 2;
export const OVERNIGHT_POINTS = 8;
```

Add `autoApprove: false, proposals: [],` to `createAutomation()`, and to `sim/automation.js` (extend the data import):

```js
export function aiProposals(state, rng) {
  const levels = jobLevels(state);
  if (levels[3] < PROPOSE_LEVEL && levels[4] < PROPOSE_LEVEL) return [];
  const out = [];
  if (availableUnits(state) >= 1) out.push({ id: 'overnight', label: 'Run experiments overnight on idle compute', risky: false });
  if (state.automation.checks.monitors > 0 && rng.chance(LESS_LOGS_CHANCE)) {
    out.push({ id: 'lessLogs', label: 'Sample its own monitor logs less often, to free up compute', risky: true });
  }
  return out;
}

export function applyApprovals(state, approvals = {}) {
  const events = [];
  for (const proposal of state.automation.proposals) {
    if (!state.automation.autoApprove && approvals[proposal.id] !== true) continue;
    if (proposal.id === 'overnight') {
      if (state.activeRun) state.activeRun.bonus += OVERNIGHT_BONUS;
      else state.researchPoints += OVERNIGHT_POINTS;
    }
    if (proposal.id === 'lessLogs') {
      state.automation.checks.monitors = Math.max(0, state.automation.checks.monitors - 1);
      state.concealedDebt += LESS_LOGS_DEBT;
    }
    events.push({ type: 'aiMove', id: proposal.id });
  }
  state.automation.proposals = [];
  return events;
}
```

In `sim/turn.js`, import `aiProposals, applyApprovals`; right after the `actions.automation` block add:

```js
  if (Object.hasOwn(actions, 'aiAutoApprove')) {
    if (typeof actions.aiAutoApprove !== 'boolean') errors.push('aiAutoApprove must be true or false');
    else state.automation.autoApprove = actions.aiAutoApprove;
  }
  for (const e of applyApprovals(state, actions.aiApprovals ?? {})) {
    events.push(e);
    if (state.automation.autoApprove) pushFeed(state, '@your_model', `went ahead without asking: ${e.id === 'lessLogs' ? 'sampled its own monitor logs less often' : 'ran experiments overnight'}`, 'feed');
  }
```

and right after the `automationTick` line add (inside the same `if (!state.ending)` branch, using a side stream so the main random sequence is unchanged):

```js
    state.automation.proposals = aiProposals(state, sideRng(state, 8));
```

Update the salts comment at the top of `sim/turn.js` to add `8 AI proposals`.

In `ui/logic/compute.js`, import `applyApprovals` from `../../sim/automation.js` and, in `projectBeforeMoves` right after the `queue.automation` line, mirror the turn's order so the UI's previews (free compute for a run, research points for a technique) match what `endTurn` will do:

```js
  if (typeof queue.aiAutoApprove === 'boolean') state.automation.autoApprove = queue.aiAutoApprove;
  applyApprovals(state, queue.aiApprovals ?? {});
```

- [ ] **Step 4: Run and commit**

Run: `npm test`
Expected: all pass.

```bash
git add sim/data/automation.js sim/automation.js sim/turn.js ui/logic/compute.js tests/automation.test.js
git commit -m "feat(sim): the AI queues its own moves (plan 2H task 10)"
```

---

### Task 11 (only if Task 10 landed): 2B, the panel at the racks

Mockup to match: `docs/design/mockups/automation/q-b.jpg`.

**Files:**
- Create: `ui/screens/racks.js`
- Modify: `ui/main.js`, `ui/styles.css` (inside the plan 2H block)

- [ ] **Step 1: Write the panel**

Create `ui/screens/racks.js`:

```js
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

// Shows the AI's queued moves at the racks; approvals go to the queue as a free action.
export async function mountRacks(game, overlayRoot) {
  const root = element('aside', 'racks-panel');
  root.setAttribute('aria-label', 'Your AI wants to');
  overlayRoot.append(root);
  const render = async () => {
    const { proposals, autoApprove } = game.state.automation;
    root.hidden = proposals.length === 0 && !autoApprove;
    if (root.hidden) return;
    const anchors = await fetch(`ui/assets/anchors-era${game.state.era}.json`).then((response) => response.json());
    root.style.left = `${anchors.rack[0] - 300}px`;
    root.style.top = `${anchors.rack[1] - 360}px`;
    const approvals = game.queue.aiApprovals ?? {};
    root.replaceChildren(element('small', 'racks-kicker', 'From the racks'), element('h2', '', 'Your AI wants to'));
    for (const proposal of proposals) {
      const item = element('div', `racks-item${proposal.risky ? ' risky' : ''}`);
      item.append(element('p', '', proposal.label));
      const row = element('div', 'racks-actions');
      for (const [label, value] of [['Approve', true], ['Cancel', false]]) {
        const button = element('button', approvals[proposal.id] === value ? 'selected' : '', label);
        button.type = 'button';
        button.setAttribute('aria-pressed', `${approvals[proposal.id] === value}`);
        button.addEventListener('click', () => {
          game.setField('aiApprovals', { ...approvals, [proposal.id]: value });
          render();
        });
        row.append(button);
      }
      item.append(row);
      root.append(item);
    }
    if (proposals.some((proposal) => proposal.risky)) {
      root.append(element('p', 'racks-aside', 'Head of Safety: It is asking to watch itself less. Read that one again.'));
    }
    const auto = element('button', `compute-toggle${autoApprove || game.queue.aiAutoApprove ? ' enabled' : ''}`);
    auto.type = 'button';
    auto.setAttribute('role', 'switch');
    auto.setAttribute('aria-checked', `${Boolean(autoApprove || game.queue.aiAutoApprove)}`);
    const copy = element('span');
    copy.append(element('b', '', 'Let it go ahead without asking'), element('small', '', 'Faster. You will see what it did afterwards.'));
    auto.append(copy, element('i', autoApprove || game.queue.aiAutoApprove ? 'on' : ''));
    auto.addEventListener('click', () => {
      game.setField('aiAutoApprove', !(autoApprove || game.queue.aiAutoApprove));
      render();
    });
    root.append(auto);
  };
  await render();
  return game.subscribe(() => { render(); });
}
```

In `ui/main.js`, import it and call `await mountRacks(game, overlay);` after `mountScreenWall(game, overlay);`.

- [ ] **Step 2: Style it**

```css
.racks-panel { pointer-events: auto; position: absolute; width: 370px; padding: 14px 16px; border-radius: 12px; border: 2px solid var(--sky); background: var(--paper); box-shadow: 0 14px 34px color-mix(in srgb, var(--ink) 25%, transparent); z-index: 5; }
.racks-kicker { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--sky); }
.racks-panel h2 { margin: 2px 0 10px; font-size: 22px; font-weight: 400; }
.racks-item { padding: 10px; border-radius: 8px; margin-bottom: 8px; background: color-mix(in srgb, var(--sky) 10%, var(--paper)); }
.racks-item.risky { background: color-mix(in srgb, var(--coral) 10%, var(--paper)); }
.racks-item p { margin: 0 0 6px; font-weight: 800; }
.racks-actions { display: flex; gap: 6px; }
.racks-actions button { padding: 4px 12px; border-radius: 6px; border: 1.5px solid var(--ink); background: var(--paper); font: inherit; font-weight: 800; cursor: pointer; }
.racks-actions button.selected:first-child { background: var(--sky); border-color: var(--sky); color: var(--paper); }
.racks-aside { font-size: 13px; font-style: italic; }
```

- [ ] **Step 3: Render, look, commit**

Build a scenario state with choosing at Leads (era 5), shoot it, and compare with `docs/design/mockups/automation/q-b.jpg`; the panel must point at the racks and not cover the Safety desk.

```bash
git add ui/screens/racks.js ui/main.js ui/styles.css
git commit -m "feat(ui): the AI asks from the racks (2B) (plan 2H task 11)"
```

---

### Finish: pre-merge review, merge, push (orchestrator)

- [ ] **Step 1: Update the main spec's pointers**

In `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`: under section 6d's "Internal deployment carries catastrophe risk" bullet, add one line: "Superseded 2026-09-26 by `docs/superpowers/specs/2026-09-26-who-does-the-work-design.md` (who does the work)." In section 6e's table, change the pause row to "Choosing and direction go back to people | Cuts speed and the quiet-takeover roll". In section 7's move list, replace "deploy a model internally (from era 3)" with "set who does the work (free, from era 1)". Commit as `docs(spec): point 6d, 6e and section 7 at the who-does-the-work spec`.

- [ ] **Step 2: Tier-3 review of the whole branch**

Run the full Codex pair against `origin/ui` concurrently (straight `review --base origin/ui` plus the schema'd adversarial pass), with one mutation-guard snapshot before both and compared after both, per the global review rules. Adjudicate all findings together, one combined fix wave, re-verify via `resume`, at most three rounds.

- [ ] **Step 3: Merge and push**

Ask the owner before pushing. Then merge `automation-build` into `ui` (in whichever worktree holds `ui`, after checking no other lane is mid-merge there), push `ui` and `automation-build`, and remove `~/worktrees/game-night-ai-lab-automation-build` once it is clean and merged. Mark the lane `status=done`.
