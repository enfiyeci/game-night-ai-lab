# Real time, stage 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 20 player-ended turns with a story calendar that runs by itself, day by day, as in Game Dev Tycoon. Actions apply the moment the player picks them. Money, users, budget effects and training progress move every day. Event cards land on their own day and keep their own deadlines.

**Architecture:** `sim/turn.js`'s single `endTurn` splits into three functions.
- `applyActions` applies player input immediately.
- `advanceDays` runs the daily continuous economy, training, budget and card deadlines.
- `endRound` runs everything else (rivals, event rolls, lawsuits, promises, contracts, board, endings, era gate) on hidden "round marks". A round is 91 story days in eras 1–2, 30 in eras 3–4 and 7 in era 5, the same story length as today's turns.

`endTurn(prev, actions, rng)` stays as `applyActions` plus advancing to the next round mark, so the balance tool, the debug scenarios and most of the 496 tests keep their meaning. A UI clock (`ui/clock.js`) turns real seconds into story days: one round takes 45 real seconds at ×1, so each era takes about 3 minutes. It pauses while any dialog or menu is open.

**Tech Stack:** Plain ES modules, `node --test`, no dependencies. The browser game is served statically from the repo root.

**Owner picks this plan implements (2026-09-26, `docs/research/realtime-time-flow/README.md`):**
- 1D, staged: week-by-week time. Rival launches, lawsuits, promises, contract arrivals and era changes stay on hidden round marks until stage 2.
- 2A: the same real time for every round, 45 s at ×1.
- 3C: each team does one thing at a time, with at most 2 new actions per round.
- 4C: no skip button; pause, ×1, ×2 and ×4 only.
- Warnings do not pause the clock; cards that need an answer do.

## Global Constraints

- The player never sees the word "turn". Dates show as `Y1 M3 W2` (Game Dev Tycoon's format); round lengths show as "quarter", "month" or "week".
- Balance must not drift. `npm run balance` before and after must agree within noise: the same ending mix ±5 percentage points per ending over 200 runs. Record both outputs in the task report.
- Determinism: for a fixed seed and the same sequence of `advanceDays(n)` and `applyActions` calls, results are identical. The sim must never read wall-clock time.
- `MAX_MOVES = 2` stays, now meaning 2 new actions per round.
- The UI never modifies sim state directly; it calls `game.*` methods only.
- Palette tokens and fonts come only from `ui/styles.css` (`--cream --paper --ink --teal --wood --coral --sky`, Nunito). No new colour literals.
- The visual reference for the clock is `docs/design/mockups/K2-realtime.html`, route `#skip-none`: date on the left, then pause, ×1, ×2, ×4, under the info box at `top: 90px; right: 15px`.
- Stage by explicit path; one commit per task; commit trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (or the implementer's own trailer).
- Test command: `npm test` (runs `node --test tests/*.test.js`). The baseline before this plan: 496 tests, 494 pass, 0 fail, 2 todo.

## File structure

| File | Responsibility |
|---|---|
| `sim/time.js` (new) | Round lengths, story dates, round-mark helpers. Pure; no state mutation. |
| `sim/teams.js` (new) | Which team owns each action; team-busy checks. |
| `sim/data/eventTiming.js` (new, content owned by the events lane) | `EVENT_TIMING = { [eventId]: { class, days } }`. Ship it as `{}`. |
| `sim/turn.js` | Split into `applyActions`, `advanceDays`, `endRound`; keep `endTurn` as the composition. |
| `sim/economy.js` | `accrueEconomy(state, months)` for daily cash, ARR and valuation; `recordBurn(state)` for the round-end burn history. `applyEconomy` stays as both together for callers outside the turn. |
| `sim/training.js` | `advanceRunBy(state, rng, fraction)`: fractional progress and a pro-rated spike chance. `advanceRun` stays as `advanceRunBy(state, rng, 1)`. |
| `sim/events.js` | New cards get `landsAt` and `dueAt`; new warnings get `day` and `dueAt`; `resolveDue(state)` applies fallbacks for missed deadlines. |
| `sim/state.js` | New fields: `day: 0`, `dayInRound: 0`, `round: { moves: 0, teams: {} }`, `roundStart: { arr, capability, cash }`, `holdOrShipChoice: 'hold'`. |
| `ui/game.js` | `advanceDays(n)`, `flush()`, `answerCard(id, choiceId)`; `addMove`, `setField` and `setBudget` apply at once; `movesLeft()` reads `state.round.moves`. |
| `ui/clock.js` (new) | Real time to story days, speeds, pause reasons, auto-pause on dialogs and menus. |
| `ui/hud.js` | Replace "Turn N of 20" with the era name; mount the clock control. |
| `ui/menu.js` | Remove "End turn"; action counter per round; team tags and busy reasons. |
| `ui/logic/format.js`, `ui/logic/eraIntro.js`, `ui/logic/actions.js`, `ui/logic/compute.js`, `ui/screens/*.js` | Copy pass: no "turn" wording; durations in story words. |
| `ui/main.js` | Create the clock, attach it as `game.clock`, remove the `#summary` endTurn route. |
| `ui/styles.css` | Clock control styles, appended at the end. |

---

## Track S — the sim (Tasks 1–3). Track U — the UI (Tasks 4–6).

Task 4 can start as soon as Task 1's interfaces exist, because it tests against a fake game. Tasks 5 and 6 need Task 1 merged.

### Task 1: Split the turn into actions, days and rounds

**Files:**
- Create: `sim/time.js`, `tests/time.test.js`
- Modify: `sim/state.js`, `sim/turn.js`, `sim/economy.js`, `sim/training.js`
- Test: `tests/time.test.js`, plus the existing `tests/turn.test.js`

**Interfaces:**
- Produces:
  - `sim/time.js`: `ROUND_DAYS = { 1: 91, 2: 91, 3: 30, 4: 30, 5: 7 }`, `roundDays(state)`, `nextRoundDay(state)` (the story day of the next round mark), `storyDate(day)` returning `{ y, m, w, label }` with `label` like `'Y1 M3 W2'`, and `roundWord(era)` returning `'quarter' | 'month' | 'week'`.
  - `sim/turn.js`: `applyActions(prev, actions, rng)`, `advanceDays(prev, days, rng)` and `endTurn(prev, actions, rng, observer)`, each returning `{ state, events, errors }` and never mutating `prev`. `MAX_MOVES` stays exported.
  - `sim/economy.js`: `accrueEconomy(state, months)` and `recordBurn(state)`.
  - `sim/training.js`: `advanceRunBy(state, rng, fraction)`.

- [ ] **Step 1: Write `tests/time.test.js` (failing).**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { applyActions, advanceDays, endTurn } from '../sim/turn.js';
import { ROUND_DAYS, storyDate, nextRoundDay } from '../sim/time.js';

test('story dates use year, month and week', () => {
  assert.equal(storyDate(0).label, 'Y1 M1 W1');
  assert.equal(storyDate(40).label, 'Y1 M2 W2');
  assert.equal(storyDate(365).label, 'Y2 M1 W1');
});

test('a round mark falls every ROUND_DAYS[era] days', () => {
  const rng = createRng(3);
  let s = createInitialState({ seed: 3 });
  s = advanceDays(s, ROUND_DAYS[1] - 1, rng).state;
  assert.equal(s.turn, 0);
  assert.equal(nextRoundDay(s), ROUND_DAYS[1]);
  s = advanceDays(s, 1, rng).state;
  assert.equal(s.turn, 1);
  assert.equal(s.dayInRound, 0);
  assert.equal(s.day, ROUND_DAYS[1]);
});

test('money moves every day, not only at the round mark', () => {
  const rng = createRng(4);
  const s0 = createInitialState({ seed: 4 });
  const s1 = advanceDays(s0, 10, rng).state;
  assert.notEqual(s1.cash, s0.cash);
  assert.equal(s1.turn, 0);
});

test('an action applies at once and counts toward the round', () => {
  const rng = createRng(5);
  const s0 = createInitialState({ seed: 5 });
  const r = applyActions(s0, { budget: { spend: 40, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } } }, rng);
  assert.equal(r.state.budget.spend, 40);
  assert.equal(r.state.round.moves, 0); // the budget is free
});

test('endTurn equals actions plus days to the next round mark', () => {
  const a = endTurn(createInitialState({ seed: 6 }), {}, createRng(6)).state;
  const rng = createRng(6);
  let b = applyActions(createInitialState({ seed: 6 }), {}, rng).state;
  b = advanceDays(b, ROUND_DAYS[1], rng).state;
  assert.equal(a.turn, b.turn);
  assert.equal(a.cash, b.cash);
  assert.equal(a.day, b.day);
});

test('a whole run still ends within 20 rounds', () => {
  const rng = createRng(7);
  let s = createInitialState({ seed: 7 });
  for (let i = 0; i < 30 && !s.ending; i += 1) s = endTurn(s, {}, rng).state;
  assert.ok(s.ending);
  assert.ok(s.turn <= 20);
});
```

- [ ] **Step 2: Run `node --test tests/time.test.js`.** Expected: FAIL, because `sim/time.js` doesn't exist.

- [ ] **Step 3: Create `sim/time.js`.**

```js
import { eraById } from './data/eras.js';

// Story days per hidden round mark: a quarter, a month, a week (today's turn lengths).
export const ROUND_DAYS = { 1: 91, 2: 91, 3: 30, 4: 30, 5: 7 };

export const roundDays = (state) => ROUND_DAYS[state.era];
export const nextRoundDay = (state) => state.day + ROUND_DAYS[state.era] - state.dayInRound;
export const roundWord = (era) => ({ 3: 'quarter', 1: 'month', 0.25: 'week' })[eraById(era).monthsPerTurn];
// Story months that one day covers in this era's money and growth maths.
export const monthsPerDay = (state) => eraById(state.era).monthsPerTurn / ROUND_DAYS[state.era];

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Game Dev Tycoon style: year, month, week of the month (weeks 1-4; days 29-31 count as week 4).
export function storyDate(day) {
  const y = Math.floor(day / 365) + 1;
  let rest = day - (y - 1) * 365;
  let m = 0;
  while (rest >= MONTH_DAYS[m]) { rest -= MONTH_DAYS[m]; m += 1; }
  const w = Math.min(4, Math.floor(rest / 7) + 1);
  return { y, m: m + 1, w, label: `Y${y} M${m + 1} W${w}` };
}
```

Note: `monthsPerDay` makes a round's worth of days add up to exactly `monthsPerTurn`, so money over one round equals today's per-turn amount.

- [ ] **Step 4: Add the new fields to `sim/state.js`.** Put them after `monthsElapsed: 0`:

```js
    day: 0,
    dayInRound: 0,
    round: { moves: 0, teams: {} },
    holdOrShipChoice: 'hold',
```

After the object is built, before `state.compute.offers = ...`, add:

```js
  state.roundStart = { arr: state.arr, capability: state.capability, cash: state.cash };
```

- [ ] **Step 5: Split the economy in `sim/economy.js`.** Replace `applyEconomy` with:

```js
// Daily: cash, ARR and valuation for `months` of story time.
export function accrueEconomy(state, months) {
  const burn = projectBurn(state);
  state.burnPlanned = burn;
  const revenue = monthlyRevenue(state);
  state.arr = revenue * 12;
  state.cash += (revenue - burn) * months;
  state.valuation = valuationOf(state);
}

// Round mark: the trailing-burn history the runway readout uses.
export function recordBurn(state) {
  state.burnHistory.push(state.burnPlanned);
  const recent = state.burnHistory.slice(-3);
  state.burnTrailing = recent.reduce((a, b) => a + b, 0) / recent.length;
}

export function applyEconomy(state) {
  accrueEconomy(state, eraById(state.era).monthsPerTurn);
  recordBurn(state);
}
```

Also give `growUsers` an optional fraction, so a day grows users by that day's share of the round's growth and rounding happens only at the mark:

```js
export function growUsers(state, fraction = 1, { round = true } = {}) {
  const months = eraById(state.era).monthsPerTurn;
  for (const m of activeModels(state)) {
    const g = (0.12 * PRICE_STANCE[m.priceStance].growth + (state.growthBoost ?? 0)) * (months / 3);
    const grown = Math.min(m.userCap, m.users * (1 + g) ** fraction);
    m.users = round ? Math.round(grown) : grown;
  }
}
```

- [ ] **Step 6: Make training progress fractional in `sim/training.js`.**

```js
export function advanceRunBy(state, rng, fraction) {
  const run = state.activeRun;
  if (!run) return null;
  if (computeSlices(state).training < run.units) return { type: 'runPaused' };
  if (rng.chance(1 - (1 - run.spikeChance) ** fraction)) run.spikes += 1;
  run.turnsLeft -= fraction;
  if (run.turnsLeft > 1e-9) return null;
  state.activeRun = null;
  state.pendingModel = resolveRun(state, run, rng);
  return state.pendingModel;
}

export const advanceRun = (state, rng) => advanceRunBy(state, rng, 1);
```

The pro-rated spike chance keeps the expected number of spikes per round the same as today.

- [ ] **Step 7: Split `sim/turn.js`.** Keep every existing import. Add these imports:

```js
import { ROUND_DAYS, monthsPerDay } from './time.js';
import { accrueEconomy, recordBurn } from './economy.js';
import { advanceRunBy } from './training.js';
import { resolveDue, stampNewCards } from './events.js';
import { TEAM_OF, teamBusyError } from './teams.js';
```

`resolveDue` and `stampNewCards` arrive in Task 2. Until then, export them from `sim/events.js` as no-op stubs: `export const resolveDue = () => [];` and `export const stampNewCards = () => {};`. Likewise ship `sim/teams.js` with `export const TEAM_OF = {}; export const teamBusyError = () => null;`. Task 2 replaces all three.

`budgetEffects` takes a fraction:

```js
function budgetEffects(state, fraction = 1) {
  const { spend, split } = state.budget;
  const k = (spend * eraById(state.era).monthsPerTurn) / 30;
  if (state.activeRun) state.activeRun.bonus += split.training * k * fraction;
  state.security += (split.security * k - 0.5) * fraction;
  state.growthBoost = split.product * k * 0.02; // a rate, applied by growUsers
  state.researchPoints += split.talent * k * 3 * fraction;
  state.staffTrust += (split.talent * k * 0.3 - 0.3) * fraction;
  if (safetySpend(state) >= INTERPRETABILITY_SPEND) exposeConcealed(state, 0.1 * fraction);
}
```

Write `applyActions(prev, actions, rng)`. It is today's lines 104–226, with four differences:
- The turn-0 constitution branch keeps its `state.turn === 0` check, but forcing the default constitution moves to `endRound` (below). A constitution action on turn 0 applies at once.
- The meeting-due check moves to `endRound`. A `meeting` move runs `runMeeting` whenever `state.meeting` is open.
- The pending-card fallback loop (today's lines 182–188) is removed; deadlines now resolve daily.
- Hold-or-ship becomes a standing choice: `if (Object.hasOwn(actions, 'holdOrShip')) { const e = holdOrShipError(actions.holdOrShip); if (e) errors.push(e); else state.holdOrShipChoice = actions.holdOrShip; }`.

The move loop enforces the round cap and team rule:

```js
  for (const move of actions.moves ?? []) {
    if (state.round.moves >= MAX_MOVES) { errors.push(`only ${MAX_MOVES} actions per round`); break; }
    const busy = teamBusyError(state, move);
    if (busy) { errors.push(busy); continue; }
    // ...today's body of the loop (meeting branch and applyMove), unchanged...
    // on success:
    state.round.moves += 1;
    const team = TEAM_OF[move.type];
    if (team) state.round.teams[team] = move.type;
  }
```

End `applyActions` with `activateReleases(state); updateServing(state); state.burnPlanned = projectBurn(state);`. If an action ended the run (`state.ending`, e.g. the acquihire option), run today's ending cleanup (lines 324–331: `judgeEndingPromises`, the promise-call filtering and `events.push({ type: 'ending', ending: state.ending })`) inside `applyActions` before returning. Move that cleanup into a helper `finishEnding(state, events)` and have `endRound` call the same helper.

Write `endRound(state, rng, observer)`, a mutating helper that is not exported. It is today's lines 102 and 119–129 (the round-start checks), then 228–331. Those lines change as follows:
- At the top: `const meetingIdAtStart = state.meeting?.id ?? null;`. If there is none, open a due meeting exactly as today's lines 124–128 do. If `state.turn === 0 && state.constitution.hardLines.length === 0`, force the default constitution exactly as today's lines 109–114 do.
- Today's line 228 expiry check stays: `if (meetingIdAtStart && state.meeting)`, then walkout.
- Hold-or-ship: `if (state.era === 5 && state.deal && state.turnInEra > 0) for (const e of holdOrShip(state, state.holdOrShipChoice, rng)) events.push(e);`
- Remove `budgetEffects`, `advanceRun`, `growUsers` and `applyEconomy` from the world step; `advanceDays` now does them daily. In place of `applyEconomy(state)`, call `observer.beforeEconomy?.(...)` exactly as today, then `recordBurn(state)`. After the growth position, call `growUsers(state, 0)`, which rounds user counts once per mark.
- `updateBoard(state, state.roundStart)` replaces `updateBoard(state, before)`.
- After the counters advance (`state.turn += 1` and so on): `state.dayInRound = 0; state.round = { moves: 0, teams: {} }; delete state.flags.emergencyUsedThisTurn; state.roundStart = { arr: state.arr, capability: state.capability, cash: state.cash };` Then call `stampNewCards(state, rng)`, which Task 2 fills in.

Write `advanceDays(prev, days, rng, observer = {})`:

```js
export function advanceDays(prev, days, rng, observer = {}) {
  const state = structuredClone(prev);
  const events = [];
  const errors = [];
  if (state.ending) return { state, events, errors: ['the run is over'] };
  for (let i = 0; i < days && !state.ending; i += 1) {
    const fraction = 1 / ROUND_DAYS[state.era];
    budgetEffects(state, fraction);
    const trained = advanceRunBy(state, rng, fraction);
    if (trained?.type === 'runPaused') { if (state.dayInRound === 0) events.push(trained); }
    else if (trained) events.push({ type: 'runComplete', gain: trained.gain });
    growUsers(state, fraction, { round: false });
    updateServing(state);
    accrueEconomy(state, monthsPerDay(state));
    for (const e of resolveDue(state)) events.push(e);
    state.day += 1;
    state.dayInRound += 1;
    if (state.dayInRound >= ROUND_DAYS[state.era]) endRound(state, rng, observer, events, errors);
  }
  return { state, events, errors };
}
```

Adjust `endRound`'s signature to `(state, rng, observer, events, errors)` so it pushes into the caller's arrays.

Write the composition:

```js
export function endTurn(prev, actions = {}, rng, observer = {}) {
  const acted = applyActions(prev, actions, rng);
  if (acted.state.ending) return acted;
  const left = ROUND_DAYS[acted.state.era] - acted.state.dayInRound;
  const moved = advanceDays(acted.state, left, rng, observer);
  return { state: moved.state, events: [...acted.events, ...moved.events], errors: [...acted.errors, ...moved.errors] };
}
```

- [ ] **Step 8: Run `node --test tests/time.test.js`.** Expected: PASS.

- [ ] **Step 9: Run `npm test`.** Fix any test that fails only because of these known, intended differences, and list each fix in the commit message:
- Cards now resolve by deadline, not at the next call. Before Task 2 the stub resolves nothing, so tests that expect a card auto-resolved on the next `endTurn` will fail. Mark those `test.todo` with the reason "deadline resolution arrives in Task 2", and restore them in Task 2.
- The 2-per-round cap and its error text are now `only 2 actions per round`.

Any other failure is a bug in this task; fix the code, not the test.

- [ ] **Step 10: Run `npm run balance` on the parent commit and on this commit.** Paste both outputs into the task report. The ending mix must agree within ±5 points per ending.

- [ ] **Step 11: Commit.**

```bash
git add sim/time.js sim/state.js sim/turn.js sim/economy.js sim/training.js sim/events.js sim/teams.js tests/time.test.js tests/turn.test.js
git commit -m "feat(sim): split the turn into actions, story days and hidden round marks"
```

(Add any other test file you changed in Step 9 by explicit path.)

### Task 2: Card landing days, deadlines, warning due days and teams

**Files:**
- Create: `sim/teams.js` (replacing the stub), `sim/data/eventTiming.js`, `tests/deadlines.test.js`, `tests/teams.test.js`
- Modify: `sim/events.js`
- Test: `tests/deadlines.test.js`, `tests/teams.test.js`, `tests/events.test.js`, `tests/events6c.test.js`

**Interfaces:**
- Consumes: `ROUND_DAYS` and `nextRoundDay` from `sim/time.js`; `sideRng` from `sim/contracts.js`.
- Produces:
  - `stampNewCards(state, rng)`: every pending card without `landsAt` gets `landsAt` and `dueAt`, and every warning without `dueAt` (and not deferred) gets `day` and `dueAt`.
  - `resolveDue(state)`: returns `eventResolved` events with `reason: 'deadline'`.
  - `TEAM_OF`, `TEAMS` and `teamBusyError(state, move)`.
  - `EVENT_TIMING`.

- [ ] **Step 1: Write `tests/deadlines.test.js` (failing).**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { advanceDays } from '../sim/turn.js';
import { stampNewCards, resolveDue } from '../sim/events.js';
import { DEFAULT_EVENT_TIMING } from '../sim/data/eventTiming.js';

const withCard = (seed) => {
  const s = createInitialState({ seed });
  s.pendingEvents.push({ id: 'lossSpike', title: 't', post: { handle: '@x', text: 'y' }, choices: [], targets: [] });
  return s;
};

test('a new card lands inside the next round and is due some days later', () => {
  const s = withCard(1);
  stampNewCards(s, createRng(1));
  const card = s.pendingEvents[0];
  assert.ok(card.landsAt >= s.day && card.landsAt < s.day + 91);
  assert.equal(card.dueAt, card.landsAt + DEFAULT_EVENT_TIMING.days);
});

test('a card past its deadline resolves with its fallback and says why', () => {
  const s = withCard(2);
  stampNewCards(s, createRng(2));
  s.day = s.pendingEvents[0].dueAt;
  const out = resolveDue(s);
  assert.equal(s.pendingEvents.length, 0);
  assert.equal(out[0].type, 'eventResolved');
  assert.equal(out[0].reason, 'deadline');
  assert.equal(out[0].auto, true);
});

test('a card can outlive a round in era 5', () => {
  const s = withCard(3);
  s.era = 5;
  stampNewCards(s, createRng(3));
  const due = s.pendingEvents[0].dueAt;
  const after = advanceDays(s, 7, createRng(3)).state;
  if (due > s.day + 7) assert.equal(after.pendingEvents.some((p) => p.id === 'lossSpike'), true);
});

test('a new warning gets the day it was raised and the next round mark', () => {
  const s = createInitialState({ seed: 4 });
  s.warnings.lossSpike = { turn: 0 };
  stampNewCards(s, createRng(4));
  assert.equal(s.warnings.lossSpike.day, 0);
  assert.equal(s.warnings.lossSpike.dueAt, 91);
});
```

- [ ] **Step 2: Write `tests/teams.test.js` (failing).**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { TEAM_OF, teamBusyError } from '../sim/teams.js';

test('every move type has a team', () => {
  for (const type of ['startRun', 'release', 'deal', 'queueOrder', 'buildSite', 'raise', 'research', 'emergency', 'deployInternal', 'stopInternal', 'amendConstitution', 'summit', 'meeting']) {
    assert.ok(TEAM_OF[type], type);
  }
});

test('a team that acted this round is busy until the next round mark', () => {
  const s = createInitialState({ seed: 1 });
  s.round.teams.cfo = 'deal';
  assert.match(teamBusyError(s, { type: 'raise' }), /finance team is busy until Y1 M4 W1/);
  assert.equal(teamBusyError(s, { type: 'amendConstitution' }), null);
});

test('research is busy while a training run is under way', () => {
  const s = createInitialState({ seed: 1 });
  s.activeRun = { turnsLeft: 1 };
  assert.match(teamBusyError(s, { type: 'research', techId: 'x' }), /research team is busy/);
});
```

- [ ] **Step 3: Run both test files.** Expected: FAIL.

- [ ] **Step 4: Create `sim/data/eventTiming.js`.**

```js
// Story days each event card waits for an answer. The events lane (branch events-build) owns these
// values and ships the same file; on merge, take theirs. Keep both exports' names identical.
export const DEFAULT_EVENT_TIMING = { class: 'normal', days: 21 };
export const EVENT_TIMING = {};
```

- [ ] **Step 5: Create `sim/teams.js`.**

```js
import { nextRoundDay, storyDate } from './time.js';

export const TEAMS = {
  research: 'research team',
  safety: 'safety team',
  policy: 'policy team',
  cfo: 'finance team',
  ceo: 'you',
};

export const TEAM_OF = {
  startRun: 'research', research: 'research', deployInternal: 'research', stopInternal: 'research',
  amendConstitution: 'safety',
  release: 'policy', summit: 'policy',
  deal: 'cfo', queueOrder: 'cfo', buildSite: 'cfo', raise: 'cfo', emergency: 'cfo',
  meeting: 'ceo',
};

export function teamBusyError(state, move) {
  const team = TEAM_OF[move.type];
  if (!team) return null;
  if (team === 'research' && state.activeRun && move.type !== 'stopInternal') return 'the research team is busy with the training run';
  if (state.round.teams[team]) return `the ${TEAMS[team]} is busy until ${storyDate(nextRoundDay(state)).label}`;
  return null;
}
```

- [ ] **Step 6: Add stamping and deadlines to `sim/events.js`.** Replace the Task 1 stubs:

```js
import { EVENT_TIMING, DEFAULT_EVENT_TIMING } from './data/eventTiming.js';
import { ROUND_DAYS, nextRoundDay } from './time.js';
import { sideRng } from './contracts.js';

export function stampNewCards(state) {
  const days = ROUND_DAYS[state.era];
  state.pendingEvents.forEach((card, index) => {
    if (card.landsAt != null) return;
    const rng = sideRng(state, 9 + index);
    card.landsAt = state.day + rng.int(0, Math.max(0, Math.floor(days * 0.8) - 1));
    card.dueAt = card.landsAt + (EVENT_TIMING[card.eventId ?? card.id] ?? DEFAULT_EVENT_TIMING).days;
  });
  for (const warning of Object.values(state.warnings)) {
    if (warning.deferred || warning.dueAt != null) continue;
    warning.day = state.day;
    warning.dueAt = nextRoundDay(state);
  }
}

export function resolveDue(state) {
  const out = [];
  for (const pending of [...state.pendingEvents]) {
    if (pending.dueAt == null || state.day < pending.dueAt) continue;
    const choiceId = fallbackChoice(pending.id, pending);
    const result = resolveEvent(state, pending.id, choiceId);
    if (result.ok) out.push({ type: 'eventResolved', id: pending.id, choiceId, auto: true, reason: 'deadline' });
  }
  return out;
}
```

Check `sim/rng.js` for the integer helper's real name and signature before using `rng.int`; `sim/power.js` uses `rng.int(0, 1)`. Also check that `sideRng` importing from `contracts.js` creates no import cycle with `events.js`. If it does, copy `sideRng`'s one-line body into `sim/time.js` and import it from there.

`stampNewCards` is called at the end of `endRound`, after the counters advance, so `state.day` is the round mark and the card lands in the new round. Cards in `state.pendingEvents` from before this plan (loaded scenarios) get stamped at the next mark.

- [ ] **Step 6b: Story words in two card costs.** In `sim/data/events6c.js` (`capabilityJump`, choice `audit`) change the cost `'$15M and a turn'` to `'$15M and a release delay'`. In `sim/data/events.js` (`siteOpposition`, choice `move`) change `'two turns'` to `'two months'`. Power sites exist only in era 4, where a round is a month. Find both with `grep -n "a turn'\\|two turns" sim/data/events*.js`.

- [ ] **Step 7: Run `tests/deadlines.test.js` and `tests/teams.test.js`.** Expected: PASS.

- [ ] **Step 8: Restore the `test.todo`s from Task 1, Step 9, then run `npm test`.** Restored tests pass if they advance at least `dueAt` days. When a test needs a card resolved "on the next call" in era 5, set `EVENT_TIMING` in the test or advance more days, and state the reason in a comment.

- [ ] **Step 9: Run `npm run balance`.** Compare with Task 1's output, within ±5 points per ending.

- [ ] **Step 10: Commit.**

```bash
git add sim/teams.js sim/data/eventTiming.js sim/events.js sim/data/events.js sim/data/events6c.js tests/deadlines.test.js tests/teams.test.js
git commit -m "feat(sim): cards land on their own day with story-day deadlines; teams do one thing at a time"
```

(Add restored test files by explicit path.)

### Task 3: Sim review fixes and the scenario helpers

**Files:**
- Modify: `ui/logic/scenarios.js` (only if a scenario no longer reaches its `stopWhen` condition)
- Test: `npm test`, `npm run balance`

- [ ] **Step 1:** Load every scenario in `SCENARIOS` for seeds 1–5 in a quick node script, and assert each returns a state without throwing. Every `state.pendingEvents` entry must have `landsAt` and `dueAt` after at least one round mark.
- [ ] **Step 2:** If `SCENARIOS.event` now returns a state whose only card has `landsAt > state.day`, change its `stopWhen` to `s.pendingEvents.some((p) => p.landsAt <= s.day)`, and advance days until that holds.
- [ ] **Step 3:** Run `npm test` and `npm run balance`; record both.
- [ ] **Step 4:** Commit with a message listing what changed.

### Task 4: The clock (UI, testable against a fake game)

**Files:**
- Create: `ui/clock.js`, `tests/ui-clock.test.js`

**Interfaces:**
- Consumes: `game.state` (with `era`, `day`, `dayInRound` and `ending`) and `game.advanceDays(n)`, both provided by Task 5; `ROUND_DAYS` and `storyDate` from `sim/time.js`.
- Produces: `createClock(game, { now = () => performance.now(), secondsPerRound = 45 } = {})`, which returns:
  - `step()`: advances by the real time since the last call; call it from `requestAnimationFrame`.
  - `start()` and `stop()`: begin or end the animation-frame loop.
  - `pause(reason)` and `resume(reason)`.
  - `setSpeed(n)`, for n in 0, 1, 2 and 4.
  - `now()`, returning `{ day, y, m, w, label, speed, paused, reasons }`.
  - `on('tick', fn)`, returning an unsubscribe function.
  - `watch(overlayEl)`: auto-pauses with reason `'dialog'` while `.dialog-layer` exists, and `'menu'` while `.menu-layer` exists, using a MutationObserver.

- [ ] **Step 1: Write `tests/ui-clock.test.js` (failing).**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClock } from '../ui/clock.js';

const fakeGame = () => {
  const state = { era: 1, day: 0, dayInRound: 0, ending: null };
  return { state, days: 0, advanceDays(n) { this.days += n; state.day += n; } };
};

test('at x1 one round of story days takes 45 real seconds', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.step();
  t = 45_000; clock.step();
  assert.equal(game.days, 91);
});

test('x4 runs four times as fast; pause stops time; reasons stack', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.setSpeed(4); clock.step();
  t = 45_000; clock.step();
  assert.equal(game.days, 364);
  clock.pause('dialog'); clock.pause('event-card');
  t = 90_000; clock.step();
  assert.equal(game.days, 364);
  clock.resume('dialog');
  t = 100_000; clock.step();
  assert.equal(game.days, 364);
  clock.resume('event-card');
  t = 101_000; clock.step();
  assert.ok(game.days > 364);
  assert.equal(clock.now().speed, 4);
});

test('the clock stops for good when the run ends', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.step();
  game.state.ending = 'acquihire';
  t = 45_000; clock.step();
  assert.equal(game.days, 0);
});

test('fractional days carry over between steps', () => {
  let t = 0;
  const game = fakeGame();
  const clock = createClock(game, { now: () => t });
  clock.step();
  for (let i = 1; i <= 100; i += 1) { t = i * 100; clock.step(); } // 10 s at 91 days / 45 s
  assert.equal(game.days, Math.floor((10 * 91) / 45));
});
```

- [ ] **Step 2: Run it.** Expected: FAIL.

- [ ] **Step 3: Create `ui/clock.js`.**

```js
import { ROUND_DAYS, storyDate } from '../sim/time.js';

const SPEEDS = [0, 1, 2, 4];
const MAX_STEP_MS = 1000; // a background tab resumes without a burst of days

export function createClock(game, { now = () => performance.now(), secondsPerRound = 45 } = {}) {
  let speed = 1;
  let last = null;
  let owed = 0;
  let frame = null;
  const reasons = new Set();
  const listeners = new Set();

  const snapshot = () => ({ ...storyDate(game.state.day), day: game.state.day, speed, paused: reasons.size > 0 || speed === 0, reasons: [...reasons] });
  const emit = () => { const s = snapshot(); for (const fn of listeners) fn(s); };

  function step() {
    const t = now();
    const dt = last === null ? 0 : Math.min(MAX_STEP_MS, t - last);
    last = t;
    if (game.state.ending || reasons.size > 0 || speed === 0) return;
    owed += (dt * speed * ROUND_DAYS[game.state.era]) / (secondsPerRound * 1000);
    const days = Math.floor(owed);
    if (days <= 0) return;
    owed -= days;
    game.advanceDays(days);
    emit();
  }

  return {
    step,
    start() { const loop = () => { step(); frame = requestAnimationFrame(loop); }; frame = requestAnimationFrame(loop); },
    stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; },
    pause(reason) { reasons.add(reason); emit(); },
    resume(reason) { reasons.delete(reason); last = now(); emit(); },
    setSpeed(n) { if (SPEEDS.includes(n)) { speed = n; last = now(); emit(); } },
    now: snapshot,
    on(type, fn) { if (type !== 'tick') return () => {}; listeners.add(fn); return () => listeners.delete(fn); },
    watch(overlay) {
      const sync = () => {
        for (const [sel, reason] of [['.dialog-layer', 'dialog'], ['.menu-layer', 'menu']]) {
          if (overlay.querySelector(sel)) reasons.add(reason); else reasons.delete(reason);
        }
        last = now();
        emit();
      };
      new MutationObserver(sync).observe(overlay, { childList: true, subtree: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) reasons.add('hidden'); else reasons.delete('hidden'); last = now(); emit(); });
      sync();
    },
  };
}
```

A day owed across a round mark is fine: `advanceDays` handles marks inside its loop. If the era changes mid-step, the leftover `owed` is at most one day, so the error is negligible.

- [ ] **Step 4: Run it.** Expected: PASS.

- [ ] **Step 5: Commit.** `git add ui/clock.js tests/ui-clock.test.js && git commit -m "feat(ui): the game clock (speeds, stacked pause reasons, auto-pause on dialogs)"`

### Task 5: The game wrapper, HUD clock and menu

**Files:**
- Modify: `ui/game.js`, `ui/hud.js`, `ui/menu.js`, `ui/main.js`, `ui/styles.css`, `tests/ui-game.test.js`

**Interfaces:**
- Consumes: `applyActions` and `advanceDays` from Task 1; `TEAM_OF`, `TEAMS` and `teamBusyError` from Task 2; `createClock` from Task 4.
- Produces on `game`:
  - `advanceDays(n)` and `flush()`. `flush` applies the queued actions now; the UI calls it after any screen closes.
  - `answerCard(id, choiceId)`, returning `{ ok, error }`.
  - `movesLeft()`, which equals `MAX_MOVES - state.round.moves - queue.moves.length`.
  - `clock`, set by `ui/main.js`.
  - `endTurn()`, kept for debug scenarios and tests only; no player control calls it.

- [ ] **Step 1: Update `tests/ui-game.test.js`.** Keep its existing checks where they still apply, and add:

```js
test('an action applies at once and the counter counts the round', () => {
  const g = createGame({ seed: 1 });
  assert.equal(g.movesLeft(), 2);
  const r = g.setBudget({ spend: 40, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } });
  assert.equal(r.ok, true);
  assert.equal(g.state.budget.spend, 40);
});

test('advancing days notifies subscribers and moves the date', () => {
  const g = createGame({ seed: 1 });
  let calls = 0;
  g.subscribe(() => { calls += 1; });
  g.advanceDays(5);
  assert.equal(g.state.day, 5);
  assert.equal(calls, 1);
});
```

- [ ] **Step 2: Rewrite `ui/game.js`.** Keep the queue shape (`initialQueue`) so screens that read `game.queue` still work, but flush it right away:

```js
import { applyActions, advanceDays as runDays, endTurn as runTurn, MAX_MOVES, setBudget as validateBudget } from '../sim/turn.js';
// ...initialQueue unchanged...

export function createGame({ seed = 1, state } = {}) {
  let currentState = structuredClone(state ?? createInitialState({ seed }));
  const rng = createRng(seed);
  let actions = initialQueue(currentState.budget);
  const subscribers = new Set();
  const rivalReleases = [];

  const publish = (update) => {
    currentState = update.state;
    for (const event of update.events) if (event.type === 'rivalRelease') rivalReleases.push({ turn: currentState.turn, id: event.id });
    const note = { state: currentState, events: update.events, errors: update.errors };
    for (const fn of subscribers) fn(note);
    return { ok: update.errors.length === 0, error: update.errors[0], events: update.events, errors: update.errors };
  };

  const game = {
    get state() { return currentState; },
    get queue() { return actions; },
    get rivalReleases() { return rivalReleases.map((r) => ({ ...r })); },
    clock: null,
    flush() {
      const queued = actions;
      actions = initialQueue(currentState.budget);
      return publish(applyActions(currentState, queued, rng));
    },
    setBudget(budget) {
      const candidate = structuredClone(currentState);
      const result = validateBudget(candidate, budget);
      if (!result.ok) return result;
      actions.budget = structuredClone(candidate.budget);
      return game.flush();
    },
    addMove(move) {
      if (game.movesLeft() <= 0) return { ok: false, error: `only ${MAX_MOVES} actions per round` };
      actions.moves.push(structuredClone(move));
      return game.flush();
    },
    removeMove(index) {
      if (!Number.isInteger(index) || index < 0 || index >= actions.moves.length) return { ok: false, error: 'unknown move' };
      actions.moves.splice(index, 1);
      return { ok: true };
    },
    setField(key, value) {
      actions[key] = structuredClone(value);
      return game.flush();
    },
    answerCard(id, choiceId) {
      actions.eventChoices = { ...actions.eventChoices, [id]: choiceId };
      return game.flush();
    },
    advanceDays(n) {
      if (actions.moves.length || Object.keys(actions.eventChoices).length) game.flush();
      return publish(runDays(currentState, n, rng));
    },
    endTurn() { // debug and tests only; players never skip
      const queued = actions;
      actions = initialQueue(currentState.budget);
      return publish(runTurn(currentState, queued, rng));
    },
    subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); },
    movesLeft() { return MAX_MOVES - (currentState.round?.moves ?? 0) - actions.moves.length; },
  };
  return game;
}
```

Note: `setField('moves', moves)` in `ui/screens/compute.js` replaces the queued list and flushes it. That is intended: the order applies at once.

- [ ] **Step 3: HUD (`ui/hud.js`).** Replace the "Turn N of 20" span with `<span class="k">Era</span> <b>${state.era}</b> <span class="k">· ${eraById(state.era).name}</span>`, importing `eraById` from `../sim/data/eras.js`. Then append a clock control after the info button. The markup follows `docs/design/mockups/K2-realtime.html`'s `clock('speeds')`:
  - a `.clock` element holding `.date` (the `storyDate(state.day).label`, with a `<small>` month name from `['Jan', …, 'Dec'][m - 1]`) and a thin `.beat` bar;
  - the bar's width is `state.dayInRound / ROUND_DAYS[state.era]`, labelled "new quarter / month / week on <date>";
  - four buttons: Pause (icon), `×1`, `×2`, `×4`, with the `.on` class on the active one and `aria-pressed`;
  - a "Paused" pill when `game.clock.now().paused`.

  Buttons call `game.clock.setSpeed(n)`, and Pause calls `setSpeed(0)`. The HUD root has `pointer-events: none` (`ui/styles.css:46`), so give `.clock` `pointer-events: auto`. Re-render on `game.subscribe` and on `game.clock.on('tick')` when a clock exists.

- [ ] **Step 4: Styles.** Copy the `.clock` rules from `docs/design/mockups/K2-realtime.html` (the block under "The clock under the info box") to the end of `ui/styles.css`, plus `.clock { pointer-events: auto; }` and `.clock button:focus-visible { outline: 2px solid var(--teal); outline-offset: 1px; }`.

- [ ] **Step 5: Menu (`ui/menu.js`).**
  - Remove the `endTurn` item and the divider before it, plus the `endTurn` click branch.
  - The counter reads `` `${used} of ${MAX_MOVES} team actions this ${roundWord(state.era)}` ``, with `roundWord` from `sim/time.js`.
  - `'Both moves are used this turn'` becomes `` `Both team actions are used this ${roundWord(state.era)}` `` (lines 95 and 173).
  - Every `unavailable` or disabled reason also checks `teamBusyError(game.state, { type: <move type for the item> })`, using this item-to-move map: `training → startRun`, `release → release`, `internal → deployInternal`, `constitution → amendConstitution`, `meeting → meeting`, `deals → deal`, `power → buildSite`, `raise → raise`, `research → research`, `emergency → emergency`. When it returns a message, show it as the reason, capitalizing the first letter.
  - Each enabled item gets a small team tag: `<span class="team">Finance team · free</span>` (`.team` styles from the mockup, appended to `ui/styles.css`).
  - `"… already queued this turn"` messages become `"… already started this ${roundWord(state.era)}"`.

- [ ] **Step 6: `ui/main.js`.** After `mountHud`:
  - `import { createClock } from './clock.js';`, then `game.clock = createClock(game); game.clock.watch(overlay); game.clock.start();`.
  - Start the clock only after the office has mounted.
  - Delete the `#summary` debug route.
  - If `params.has('paused')`, call `game.clock.setSpeed(0)`, for screenshots.

- [ ] **Step 7: Run `npm test`.** Expected: all pass (the menu and HUD tests may need copy updates; change the expected strings only).

- [ ] **Step 8: Run the game.** Serve the repo root (`python3 -m http.server <free port>`) and open `/?seed=10`.
  - At ×1, the date advances about 2 days per second in era 1.
  - Opening the menu pauses the clock ("Paused" shows); closing it resumes.
  - Starting a training run shows its bar moving within a few seconds.
  - Screenshot 1440×900 at `/?seed=10&scenario=era2Deals` with the menu open, and at `/?seed=10&scenario=midEra3`.

- [ ] **Step 9: Commit** the changed files by explicit path: `feat(ui): running clock with speeds, instant actions and team-aware menu`.

### Task 6: Copy pass — no turn wording anywhere

**Files:**
- Modify: `ui/logic/format.js`, `ui/logic/eraIntro.js`, `ui/logic/actions.js`, `ui/logic/compute.js`, `ui/screens/company.js`, `ui/screens/compute.js`, `ui/screens/sites.js`, `ui/screens/recipe.js`, `ui/screens/history.js`, and the matching `tests/ui-*.test.js` expectations

- [ ] **Step 1: Add a helper to `ui/logic/format.js`.**

```js
import { ROUND_DAYS } from '../sim/time.js';
// "+2 turns" in story words for the current era: about 6 months, about 2 weeks.
export function roundsToWords(era, n) {
  const days = n * ROUND_DAYS[era];
  if (days >= 60) return `about ${Math.round(days / 30.4)} months`;
  if (days >= 14) return `about ${Math.round(days / 7)} weeks`;
  return days === 1 ? '1 day' : `${days} days`;
}
```

- [ ] **Step 2: Replace wording.** Run `grep -rn -i "turn" ui --include='*.js'` and change every player-visible string. Leave code identifiers alone.
  - "uses 1 of 2 moves this turn" → "uses 1 of your 2 team actions this quarter" (use `roundWord`).
  - "+N turn(s)" and "Takes N turn(s)" → `roundsToWords(state.era, N)`.
  - "Arrives: next turn / in N turns" → "Arrives in " + `roundsToWords`.
  - "renews each turn" → "renews each " + `roundWord`.
  - "Building · N turn(s) left" → "Building · " + `roundsToWords` + " left".
  - "Online since turn N" → "Online since " + a story date.
  - The project pill's idle status "click the floor to plan your turn" → "click the floor to get to work".
  - The turn-summary title "This turn" → "Just now", and its dismiss label → "Dismiss".
  - `ui/logic/eraIntro.js` `PACE`: 3 → "The calendar runs by the quarter.", 1 → "Things speed up: every month counts now.", 0.25 → "Every week counts now."
  - The race chart's "Now · turn N" → "Now · " + a story date. Its x-axis label, if it says "turn", becomes "time".

  Only show the turn-summary toast when the step's events are non-empty; subscribers now fire every step.
- [ ] **Step 3: Run `npm test`**, updating only expected strings.
- [ ] **Step 4: Re-run the grep.** No player-visible "turn" may remain; list any left on purpose, with the reason.
- [ ] **Step 5: Commit** by explicit path: `fix(ui): story-time wording everywhere; no turns on screen`.

---

## Self-review

- Spec coverage: 1D stage 1 is covered by Tasks 1, 2 and 5. 2A (45 s per round) is in Task 4. 3C with 2 per round is in Tasks 1, 2 and 5. 4C (speeds, no skip) is in Task 5. Warnings not pausing is in Task 4: `watch` pauses only on dialogs and menus, and the events lane pauses on cards itself. Card deadlines are in Task 2. No turn wording is in Task 6.
- Known stage-2 items (not in this plan): rival launches, lawsuits, promises, contract arrivals, site builds and era changes on story days; retuning.
- Merge risk: the board-redesign branch changes `sim/turn.js` (`boardSnapshot`, board promise, `feedPosts`) and `sim/state.js`. When merging, port its additions into `endRound` (the world step) and `applyActions` (`actions.boardPromise`), and replace `state.roundStart` with `boardSnapshot(state)` at the round mark.

## Review record (2026-09-26, pre-merge into `ui`, tier 3)

Codex `gpt-5.6-sol`, straight `review --base ui` (session 01a0dd77-9fb1-75f2-9a21-4f0f597b6d31) and adversarial exec (session 01a0dd77-9fb1-7732-bc93-ea61b1ca9ff5), run concurrently; the mutation guard was clean in every round. The fix wave ran on `gpt-5.6-terra` because `gpt-5.6-sol` was at capacity.

Round 1: straight 6 findings, adversarial 6 (REVISE); 9 distinct after de-duplication.
- Fixed in 3684a11: training capacity rechecked after player actions; clock step capped at 1 s and converted day by day at the current era's rate; `game.advanceDays` publishes each day and stops on pause; no landing dates after the ending; previews leave pending cards alone; `releasedDay` recorded and shown; card feed posts on the landing day; warning bars use their own span.
- Won't fix: `endTurn` skips the one-action-per-team rule. Deliberate, so the balance tool's scripted two-move rounds keep their meaning; the team rule is balanced in playtests instead.
- Deviation: a daily capacity recheck (the reviewer's first suggestion) moved the balance by up to 16.5 points, so the round-level check stays, invalidated by player actions (the reviewer's second suggestion). Balance after the fix equals the baseline exactly.

Round 2: straight APPROVED. Adversarial REVISE with 3 findings, all fixed in ad0b40b: speed changes rescaled owed time; `advanceDays` returned only the last day's results; cards made on the final mark opened after the ending.

Round 3 (cap): adversarial REVISE with 1 finding. A card set aside before the ending stays actionable after it. Escalated to the owner per the 3-round cap.

Tests after round 2: 540, 538 pass, 0 fail, 2 known todo. Balance: identical to the pre-fix baseline.
