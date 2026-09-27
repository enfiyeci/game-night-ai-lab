# Keep Polishing, then Publish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a training run ends, the lab keeps post-training the model on the day clock (fixing the recipe's post-training flaws in the player's order, then adding polish in shrinking bubbles) until the player presses Publish.

**Architecture:** One new sim module, `sim/polish.js`, holds the whole rule as plain functions on `state.pendingModel`; the turn engine calls it once per story day, the release carries its result, and the critics read it. One new UI logic module, `ui/logic/polish.js`, turns that state into words and positions; one new screen, `ui/screens/polish.js`, draws the flaws list, the calendar strip, the bubbles and the first-time line; the HUD shows the pill, the Flaws badge, Publish and the rumor chip.

**Tech Stack:** Plain ES modules, no build step; `node --test tests/*.test.js`; the browser game served by `python3 -m http.server` (launch config `keep-training-worktree`, port 62140).

**Spec:** `docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md` (owner-approved 2026-09-26). **Mockups:** `docs/design/mockups/keep-polishing/` (review page `https://claude.ai/artifact/G7ntV2cn2Z39oQSpbgVtMd`; options A and D are the picked ones).

## Global Constraints

- No randomness anywhere in this mechanic: no `rng` calls, no `Math.random` (owner rule, deterministic endings).
- `FLAW_FIX_ROUNDS = 0.25`, `BUBBLE_ROUNDS = 1 / 12`, `BUBBLE_SHARE = 0.2`, `POLISH_CRITIC_DIVISOR = 50`.
- Fixable flags, in default order: `jailbreakWaiting`, `hallucination`, `sycophancy`. No other flag is fixable.
- Player-facing names: "Jailbreaks waiting", "Confident wrong answers", "Too eager to please".
- Field names agreed with lane `gn-model-appeal`: `pendingModel.polish` (0 to 100, unrounded) and `pendingModel.fixedFlaws` (`[{ flag, day }]`), both copied onto the released model record. Do not rename them.
- Copy speaks in dates and weeks, never turns or rounds (owner rule). Consequences of a flaw reach the player only through an advisor's line, never an effect label.
- UI colours come only from the tokens in `ui/styles.css` `:root` (`--cream --paper --ink --teal --wood --coral --sky`) and `color-mix` of them. No new hex values.
- Lines marked `// OWNER WRITES` are placeholder copy the owner may rewrite; keep them in one place each.
- Stage only files you changed, by explicit path. Never `git add -A`.
- Shared files (check the lanes board with `~/claude-sync/bin/claude-sync.sh lanes /Users/ardaenfiyeci/Desktop/game-night-ai-lab` before editing each): `sim/training.js`, `sim/release.js` (lane `gn-model-money`), `sim/launch.js` (`gn-benchmarks`, deterministic-endings Task A5, `gn-model-appeal`), `sim/turn.js`, `sim/split.js`, `ui/hud.js` (`gn-hud-money`), `tools/balance.js`, `ui/styles.css`.

## File map

| File | Change | Responsibility |
| --- | --- | --- |
| `sim/polish.js` | create | The rule: start, advance, fix, bubbles, player flaw actions, forecast, rival landings. |
| `sim/training.js` | modify | Start polishing when a run ends; recheck polishing capacity after a player action. |
| `sim/split.js` | modify | Count a polishing model's held units like a run's. |
| `sim/turn.js` | modify | Advance polishing each story day; note rival landings; the `flawActions` instant action. |
| `sim/release.js` | modify | Carry `polish` and `fixedFlaws` to the released model; pass polish to the critics. |
| `sim/launch.js` | modify | Add `polish / POLISH_CRITIC_DIVISOR` to the critics' base. |
| `sim/time.js` | modify | `storyDate` also returns `d`, the day of the month (for strip ticks). |
| `tools/balance.js` | modify | Bot publish rules; polishing metrics in the report. |
| `docs/notes/2026-09-26-keep-polishing-balance.md` | create | Before and after bot measurements. |
| `ui/logic/polish.js` | create | Pill status, flaw rows, rumor chip, calendar strip model, intro line. |
| `ui/logic/format.js` | modify | `project()` shows a polishing model. |
| `ui/logic/training.js` | modify | No "click the floor" note while a model polishes (Publish replaces it). |
| `ui/hud.js` | modify | Flaws badge, Publish button, rumor chip, clickable pill. |
| `ui/fx.js` | modify | `flyBubble` takes an optional label. |
| `ui/screens/polish.js` | create | Flaws list, calendar strip, flying bubbles, first-time Research line. |
| `ui/main.js` | modify | Mount the polish screen. |
| `ui/styles.css` | modify | One "keep polishing" block at the end. |
| `tests/polish.test.js`, `tests/ui-polish.test.js` | create | Rule tests and view-logic tests. |

---

### Task 1: The polishing rule (`sim/polish.js`)

**Files:**
- Create: `sim/polish.js`
- Test: `tests/polish.test.js`

**Interfaces:**
- Consumes: `computeSlices(state)` from `sim/split.js` (returns `{ training, ... }`); `cardById(id)` from `sim/recipe.js`.
- Produces (later tasks rely on these exact names):
  - constants `FLAW_FIX_ROUNDS`, `BUBBLE_ROUNDS`, `BUBBLE_SHARE`, `POLISH_CRITIC_DIVISOR`, `FIXABLE`
  - `startPolishing(model, units, day) → model` — adds `polish: 0`, `fixedFlaws: []`, `heldUnits: units`, `polishing: { flaws: [{ flag, progress, leftIn }], bubbleProgress: 0, bubbles: [], rivals: [], startedDay: day }`
  - `advancePolishBy(state, fraction) → events[]` — events `{ type: 'flawFixed', flag }`, `{ type: 'polishBubble', gain }`, `{ type: 'polishPaused' }`
  - `applyFlawAction(state, { flag, action }) → { ok, error? }` — `action` is `'first' | 'leaveIn' | 'fix'`
  - `flawsLeft(model) → number` — flaws not fixed and not left in
  - `nextBubbleGain(model) → number`
  - `polishForecast(model, roundDays, fromDay, count = 8) → [{ type: 'fix', flag, day } | { type: 'bubble', gain, day }]`
  - `notePolishLandings(state, events)` — records `{ id, day }` in `polishing.rivals` for each `rivalRelease` event

- [ ] **Step 1: Record the balance baseline before any code change**

Run from the worktree root (`~/worktrees/game-night-ai-lab-keep-training`):
```bash
node tools/balance.js 200 > /tmp/keep-polishing-before.json && head -c 400 /tmp/keep-polishing-before.json
```
Expected: JSON with one key per strategy (`speed`, `safety`, `balanced`, …). Keep the file for Task 3.

- [ ] **Step 2: Write the failing tests**

Create `tests/polish.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  FLAW_FIX_ROUNDS, BUBBLE_ROUNDS, FIXABLE, startPolishing, advancePolishBy, applyFlawAction, flawsLeft,
  nextBubbleGain, polishForecast, notePolishLandings,
} from '../sim/polish.js';

function polishingState(flags = ['jailbreakWaiting', 'hallucination', 'sycophancy', 'scraped']) {
  const state = createInitialState({ seed: 1 });
  state.compute.split.safety = 0;
  state.pendingModel = { capability: 40, gain: 10, flags: [...flags], publicEffects: { usersMult: 1.15 }, size: 'medium', spec: {} };
  startPolishing(state.pendingModel, 2, state.day);
  return state;
}

test('only the three post-training flags are fixable, worst first', () => {
  assert.deepEqual(FIXABLE, ['jailbreakWaiting', 'hallucination', 'sycophancy']);
  const state = polishingState(['sycophancy', 'scraped', 'hallucination']);
  assert.deepEqual(state.pendingModel.polishing.flaws.map((f) => f.flag), ['hallucination', 'sycophancy']);
  assert.equal(state.pendingModel.polish, 0);
  assert.deepEqual(state.pendingModel.fixedFlaws, []);
  assert.equal(state.pendingModel.heldUnits, 2);
});

test('a flaw is fixed after a quarter of a round, and its flag goes', () => {
  const state = polishingState();
  assert.deepEqual(advancePolishBy(state, FLAW_FIX_ROUNDS / 2), []);
  const events = advancePolishBy(state, FLAW_FIX_ROUNDS / 2);
  assert.deepEqual(events, [{ type: 'flawFixed', flag: 'jailbreakWaiting' }]);
  assert.ok(!state.pendingModel.flags.includes('jailbreakWaiting'));
  assert.ok(state.pendingModel.flags.includes('scraped'), 'data flaws stay');
  assert.deepEqual(state.pendingModel.fixedFlaws, [{ flag: 'jailbreakWaiting', day: state.day }]);
  assert.equal(flawsLeft(state.pendingModel), 2);
});

test('fixing sycophancy takes the thumbs-up users with it', () => {
  const state = polishingState(['sycophancy']);
  advancePolishBy(state, FLAW_FIX_ROUNDS);
  assert.ok(Math.abs(state.pendingModel.publicEffects.usersMult - 1) < 1e-12);
});

test('polish starts once every flaw is fixed or left in, and its bubbles shrink', () => {
  const state = polishingState(['sycophancy']);
  assert.equal(applyFlawAction(state, { flag: 'sycophancy', action: 'leaveIn' }).ok, true);
  assert.equal(flawsLeft(state.pendingModel), 0);
  const gains = [];
  for (let i = 0; i < 3; i += 1) gains.push(...advancePolishBy(state, BUBBLE_ROUNDS).map((e) => e.gain));
  assert.deepEqual(gains.map((g) => Math.round(g * 10) / 10), [20, 16, 12.8]);
  assert.ok(Math.abs(state.pendingModel.polish - 48.8) < 1e-9);
  assert.equal(state.pendingModel.polishing.bubbles.length, 3);
  assert.ok(state.pendingModel.flags.includes('sycophancy'), 'a left-in flaw ships as it is');
  assert.ok(Math.abs(nextBubbleGain(state.pendingModel) - 0.2 * 51.2) < 1e-9);
});

test('one round of polish reaches about 93 and never 100', () => {
  const state = polishingState([]);
  for (let i = 0; i < 30; i += 1) advancePolishBy(state, 1 / 30);
  assert.ok(state.pendingModel.polish > 92 && state.pendingModel.polish < 94, `${state.pendingModel.polish}`);
  for (let i = 0; i < 300; i += 1) advancePolishBy(state, 1 / 30);
  assert.ok(state.pendingModel.polish < 100);
});

test('moving a flaw up keeps the work done on the one before', () => {
  const state = polishingState();
  advancePolishBy(state, FLAW_FIX_ROUNDS / 2);
  assert.equal(applyFlawAction(state, { flag: 'sycophancy', action: 'first' }).ok, true);
  assert.deepEqual(state.pendingModel.polishing.flaws.map((f) => f.flag), ['sycophancy', 'jailbreakWaiting', 'hallucination']);
  advancePolishBy(state, FLAW_FIX_ROUNDS);
  assert.deepEqual(state.pendingModel.fixedFlaws.map((f) => f.flag), ['sycophancy']);
  const events = advancePolishBy(state, FLAW_FIX_ROUNDS / 2);
  assert.deepEqual(events, [{ type: 'flawFixed', flag: 'jailbreakWaiting' }], 'half was already done');
});

test('a left-in flaw can be taken back', () => {
  const state = polishingState(['hallucination']);
  applyFlawAction(state, { flag: 'hallucination', action: 'leaveIn' });
  advancePolishBy(state, BUBBLE_ROUNDS);
  assert.equal(state.pendingModel.polishing.bubbles.length, 1);
  assert.equal(applyFlawAction(state, { flag: 'hallucination', action: 'fix' }).ok, true);
  const events = advancePolishBy(state, FLAW_FIX_ROUNDS);
  assert.deepEqual(events, [{ type: 'flawFixed', flag: 'hallucination' }]);
});

test('flaw actions are checked', () => {
  const state = polishingState(['hallucination']);
  assert.equal(applyFlawAction(state, { flag: 'scraped', action: 'first' }).ok, false);
  assert.equal(applyFlawAction(state, { flag: 'hallucination', action: 'shout' }).ok, false);
  state.pendingModel = null;
  assert.equal(applyFlawAction(state, { flag: 'hallucination', action: 'first' }).ok, false);
});

test('polishing pauses when the training compute falls below the held units', () => {
  const state = polishingState();
  state.pendingModel.heldUnits = state.compute.online + 1;
  assert.deepEqual(advancePolishBy(state, 1 / 30), [{ type: 'polishPaused' }]);
  assert.deepEqual(advancePolishBy(state, 1 / 30), [], 'the pause is reported once');
  assert.equal(state.pendingModel.polishing.flaws[0].progress, 0);
});

test('the forecast matches what polishing then does', () => {
  const state = polishingState(['hallucination']);
  const forecast = polishForecast(state.pendingModel, 30, state.day, 3);
  assert.deepEqual(forecast.map((e) => e.type), ['fix', 'bubble', 'bubble', 'bubble']);
  assert.ok(Math.abs(forecast[0].day - (state.day + 7.5)) < 1e-9);
  assert.ok(Math.abs(forecast[1].day - (state.day + 10)) < 1e-9);
  assert.deepEqual(forecast.slice(1).map((e) => Math.round(e.gain * 10) / 10), [20, 16, 12.8]);
});

test('rival landings while polishing are remembered with their day', () => {
  const state = polishingState();
  notePolishLandings(state, [{ type: 'rivalRelease', id: 'openbrain', gain: 7 }, { type: 'computeArrived' }]);
  assert.deepEqual(state.pendingModel.polishing.rivals, [{ id: 'openbrain', day: state.day }]);
});

test('no model, nothing to do', () => {
  const state = createInitialState({ seed: 1 });
  assert.deepEqual(advancePolishBy(state, 1), []);
  notePolishLandings(state, [{ type: 'rivalRelease', id: 'openbrain' }]);
  assert.equal(flawsLeft(null), 0);
});
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `node --test tests/polish.test.js`
Expected: FAIL, "Cannot find module '…/sim/polish.js'".

- [ ] **Step 4: Write `sim/polish.js`**

```js
import { cardById } from './recipe.js';
import { computeSlices } from './split.js';

// Keep polishing, then Publish (docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md). After a run
// ends the lab keeps post-training the model: it fixes the recipe's post-training flaws in the player's order, then
// adds polish in bubbles that shrink, until the player publishes. No random draws anywhere.
export const FLAW_FIX_ROUNDS = 0.25;
export const BUBBLE_ROUNDS = 1 / 12;
export const BUBBLE_SHARE = 0.2;
export const POLISH_CRITIC_DIVISOR = 50;
// Flags post-training created, so post-training can fix them; the order is the default working order.
export const FIXABLE = ['jailbreakWaiting', 'hallucination', 'sycophancy'];
const FLAW_ACTIONS = ['first', 'leaveIn', 'fix'];
const DONE = 1e-9;

export function startPolishing(model, units, day) {
  model.polish = 0;
  model.fixedFlaws = [];
  model.heldUnits = units;
  model.polishing = {
    flaws: FIXABLE.filter((flag) => model.flags.includes(flag)).map((flag) => ({ flag, progress: 0, leftIn: false })),
    bubbleProgress: 0,
    bubbles: [],
    rivals: [],
    startedDay: day,
  };
  return model;
}

const toFix = (polishing) => polishing.flaws.filter((flaw) => !flaw.leftIn);
export const flawsLeft = (model) => (model?.polishing ? toFix(model.polishing).length : 0);
export const nextBubbleGain = (model) => BUBBLE_SHARE * (100 - (model?.polish ?? 0));

function fixFlaw(model, flaw, day) {
  const polishing = model.polishing;
  polishing.flaws.splice(polishing.flaws.indexOf(flaw), 1);
  model.flags = model.flags.filter((flag) => flag !== flaw.flag);
  model.fixedFlaws.push({ flag: flaw.flag, day });
  // The thumbs-up card's extra users came from the flattery, so they go with it.
  if (flaw.flag === 'sycophancy') model.publicEffects.usersMult /= cardById('thumbs').effects.usersMult;
}

// Moves polishing on by `fraction` of a round. Compute is checked once per round, as a training run's is.
export function advancePolishBy(state, fraction) {
  const model = state.pendingModel;
  const polishing = model?.polishing;
  if (!polishing) return [];
  if (polishing.capacityTurn !== state.turn) {
    polishing.capacityTurn = state.turn;
    polishing.canAdvance = computeSlices(state).training >= model.heldUnits;
  }
  if (!polishing.canAdvance) {
    if (polishing.paused) return [];
    polishing.paused = true;
    return [{ type: 'polishPaused' }];
  }
  polishing.paused = false;
  const events = [];
  let left = fraction;
  while (left > DONE) {
    const flaw = toFix(polishing)[0];
    if (flaw) {
      const step = Math.max(0, Math.min(left, FLAW_FIX_ROUNDS - flaw.progress));
      flaw.progress += step;
      left -= step;
      if (flaw.progress >= FLAW_FIX_ROUNDS - DONE) {
        fixFlaw(model, flaw, state.day);
        events.push({ type: 'flawFixed', flag: flaw.flag });
      }
      continue;
    }
    const step = Math.max(0, Math.min(left, BUBBLE_ROUNDS - polishing.bubbleProgress));
    polishing.bubbleProgress += step;
    left -= step;
    if (polishing.bubbleProgress >= BUBBLE_ROUNDS - DONE) {
      const gain = nextBubbleGain(model);
      model.polish += gain;
      polishing.bubbleProgress = 0;
      polishing.bubbles.push({ day: state.day, gain });
      events.push({ type: 'polishBubble', gain });
    }
  }
  return events;
}

// The player's instant flaw moves: work on one next, leave one in, or take a left-in one back.
export function applyFlawAction(state, { flag, action } = {}) {
  const polishing = state.pendingModel?.polishing;
  if (!polishing) return { ok: false, error: 'no model is being polished' };
  if (!FLAW_ACTIONS.includes(action)) return { ok: false, error: `unknown flaw action ${action}` };
  const flaw = polishing.flaws.find((entry) => entry.flag === flag);
  if (!flaw) return { ok: false, error: `${flag} is not a flaw left to fix` };
  if (action === 'first') {
    polishing.flaws.splice(polishing.flaws.indexOf(flaw), 1);
    polishing.flaws.unshift(flaw);
    flaw.leftIn = false;
  }
  if (action === 'leaveIn') flaw.leftIn = true;
  if (action === 'fix') flaw.leftIn = false;
  return { ok: true };
}

// What polishing will do from `fromDay` if nothing changes: the fixes left, then `count` bubbles. Days are exact
// fractions; a bubble lands on the first story day at or after its day.
export function polishForecast(model, roundDays, fromDay, count = 8) {
  const polishing = model?.polishing;
  if (!polishing) return [];
  const forecast = [];
  let day = fromDay;
  for (const flaw of toFix(polishing)) {
    day += (FLAW_FIX_ROUNDS - flaw.progress) * roundDays;
    forecast.push({ type: 'fix', flag: flaw.flag, day });
  }
  let polish = model.polish;
  let wait = BUBBLE_ROUNDS - polishing.bubbleProgress;
  for (let i = 0; i < count; i += 1) {
    day += wait * roundDays;
    wait = BUBBLE_ROUNDS;
    const gain = BUBBLE_SHARE * (100 - polish);
    polish += gain;
    forecast.push({ type: 'bubble', gain, day });
  }
  return forecast;
}

// Rival launches that land while the model polishes, for the calendar strip and the rumor chip.
export function notePolishLandings(state, events) {
  const polishing = state.pendingModel?.polishing;
  if (!polishing) return;
  for (const event of events) if (event.type === 'rivalRelease') polishing.rivals.push({ id: event.id, day: state.day });
}
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `node --test tests/polish.test.js`
Expected: PASS, 12 tests. If "one round of polish reaches about 93" fails by landing on exactly 12 bubbles versus 11 because of float sums, check `DONE` handling in the bubble branch before touching the test.

- [ ] **Step 6: Commit**

```bash
git add sim/polish.js tests/polish.test.js
git commit -m "feat(sim): the keep-polishing rule (flaws first, then shrinking polish bubbles)"
```

---

### Task 2: Wire polishing into training, time, compute, release and the critics

**Files:**
- Modify: `sim/training.js` (imports; `advanceRunBy` after `state.pendingModel = resolveRun(...)`; `recheckCapacity`)
- Modify: `sim/split.js:47`
- Modify: `sim/turn.js` (imports; `applyActions` near the `hazardChoice` block at line 223; `advanceDays` after `state.dayInRound += 1;` and after `const landed = landDue(state);`)
- Modify: `sim/release.js` (`releaseModel`: the `scoreLaunch` call and the `model` record)
- Modify: `sim/launch.js` (`scoreLaunch`: `base`)
- Modify: `docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md` section 5 (data block)
- Test: `tests/polish.test.js` (append)

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces: `state.pendingModel.polishing` exists on every model trained by `advanceRunBy`; the instant action `actions.flawActions: [{ flag, action }]` on `applyActions`; released models carry `polish` and `fixedFlaws`; `scoreLaunch(state, model, rng)` reads `model.polish`.

- [ ] **Step 1: Write the failing integration tests** (append to `tests/polish.test.js`)

```js
import { startRun, advanceRunBy } from '../sim/training.js';
import { computeSlices } from '../sim/split.js';
import { applyActions, advanceDays } from '../sim/turn.js';
import { releaseModel } from '../sim/release.js';
import { scoreLaunch } from '../sim/launch.js';
import { createRng } from '../sim/rng.js';
import { POLISH_CRITIC_DIVISOR } from '../sim/polish.js';

const noLuck = { next: () => 0.99, int: () => 0, chance: () => false, normal: (m) => m, pick: (list) => list[0] };
const runRecipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data', 'stability'], mid: [], post: ['synthetic-sft', 'thumbs'] },
};

function trainedState() {
  const state = createInitialState({ seed: 1 });
  state.compute.split.safety = 0;
  assert.equal(startRun(state, runRecipe).ok, true);
  const units = state.activeRun.units;
  while (state.activeRun) advanceRunBy(state, noLuck, 1);
  return { state, units };
}

test('a finished run starts polishing and keeps its compute busy', () => {
  const { state, units } = trainedState();
  const model = state.pendingModel;
  assert.equal(model.heldUnits, units);
  assert.deepEqual(model.polishing.flaws.map((f) => f.flag), ['jailbreakWaiting', 'sycophancy']);
  const slices = computeSlices(state);
  assert.equal(slices.run, units);
  assert.equal(slices.idle, Math.max(0, slices.training - units));
});

test('the story days move polishing on, and the player can order the flaws', () => {
  const { state } = trainedState();
  const rng = createRng(1);
  const acted = applyActions(state, { flawActions: [{ flag: 'sycophancy', action: 'first' }] }, rng);
  assert.deepEqual(acted.errors, []);
  assert.equal(acted.state.pendingModel.polishing.flaws[0].flag, 'sycophancy');
  const days = Math.ceil(0.25 * 91) + 1; // era 1: a round is 91 days
  const moved = advanceDays(acted.state, days, rng);
  assert.ok(moved.events.some((e) => e.type === 'flawFixed' && e.flag === 'sycophancy'), JSON.stringify(moved.events.map((e) => e.type)));
  assert.ok(!moved.state.pendingModel.flags.includes('sycophancy'));
});

test('a bad flaw action is an error, not a crash', () => {
  const { state } = trainedState();
  const acted = applyActions(state, { flawActions: [{ flag: 'scraped', action: 'first' }] }, createRng(1));
  assert.equal(acted.errors.length, 1);
});

test('publishing carries polish and fixed flaws and frees the compute', () => {
  const { state } = trainedState();
  state.pendingModel.polish = 40;
  state.pendingModel.fixedFlaws = [{ flag: 'jailbreakWaiting', day: 3 }];
  const r = releaseModel(state, { picks: [], price: 'market', family: 'Kestrel', generation: 1 }, createRng(2));
  assert.equal(r.ok, true);
  assert.equal(r.model.polish, 40);
  assert.deepEqual(r.model.fixedFlaws, [{ flag: 'jailbreakWaiting', day: 3 }]);
  assert.equal(computeSlices(state).run, 0);
});

test('polish lifts every critic by polish / 50, and zero polish changes nothing', () => {
  const { state } = trainedState();
  // A weak model, so no critic sits at the 10-point ceiling before the lift.
  const model = { capability: 10, spec: state.pendingModel.spec, flags: [], name: 'Kestrel 1', generation: 1, skipped: 0 };
  const plain = scoreLaunch(structuredClone(state), model, noLuck);
  const same = scoreLaunch(structuredClone(state), { ...model, polish: 0 }, noLuck);
  const lifted = scoreLaunch(structuredClone(state), { ...model, polish: 100 }, noLuck);
  assert.deepEqual(same.press.map((p) => p.score), plain.press.map((p) => p.score));
  assert.equal(POLISH_CRITIC_DIVISOR, 50);
  const up = lifted.press.map((p, i) => p.score - plain.press[i].score);
  assert.ok(up.every((d) => d >= 1 && d <= 2), `each critic rises by about 2 (rounded, clamped): ${up}`);
});

test('publishing on the day training ends gives today\'s result', () => {
  const { state } = trainedState();
  const without = structuredClone(state);
  delete without.pendingModel.polishing;
  delete without.pendingModel.polish;
  delete without.pendingModel.fixedFlaws;
  delete without.pendingModel.heldUnits;
  const release = { picks: [], price: 'market', family: 'Kestrel', generation: 1 };
  const a = releaseModel(state, release, createRng(5));
  const b = releaseModel(without, release, createRng(5));
  assert.deepEqual(a.model.launch, b.model.launch);
  assert.equal(a.model.users, b.model.users);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test tests/polish.test.js`
Expected: FAIL on the new tests (`pendingModel.heldUnits` undefined, `flawActions` ignored, `r.model.polish` undefined).

- [ ] **Step 3: `sim/training.js`**

Add to the imports:
```js
import { startPolishing } from './polish.js';
```
In `advanceRunBy`, right after `state.pendingModel = resolveRun(state, run, rng);` add:
```js
  startPolishing(state.pendingModel, run.units, state.day); // the lab keeps post-training it until the player publishes
```
Replace `recheckCapacity` with:
```js
// A player action (a new compute split, a deal, a release) can change training capacity mid-round.
export function recheckCapacity(state) {
  if (state.activeRun) delete state.activeRun.capacityTurn;
  if (state.pendingModel?.polishing) delete state.pendingModel.polishing.capacityTurn;
}
```

- [ ] **Step 4: `sim/split.js`**

Replace line 47:
```js
  const run = state.activeRun ? state.activeRun.units : 0;
```
with:
```js
  // A model being polished keeps its run's units busy (keep-polishing spec, rule 7).
  const run = state.activeRun ? state.activeRun.units : (state.pendingModel?.heldUnits ?? 0);
```

- [ ] **Step 5: `sim/turn.js`**

Add to the imports:
```js
import { advancePolishBy, applyFlawAction, notePolishLandings } from './polish.js';
```
In `applyActions`, directly after the `if (actions.hazardChoice && state.pendingModel?.hazard) { … }` block, add:
```js
  for (const action of actions.flawActions ?? []) {
    const r = applyFlawAction(state, action);
    if (!r.ok) errors.push(r.error);
  }
```
In `advanceDays`, directly after `state.dayInRound += 1;` add:
```js
    for (const e of advancePolishBy(state, fraction)) events.push(e); // every story day, the mark day included
```
and change the landings block to:
```js
    const landed = landDue(state);
    notePolishLandings(state, landed);
    if (landed.length) {
```

- [ ] **Step 6: `sim/release.js`**

In `releaseModel`, change the `scoreLaunch` call to pass the polish:
```js
  const launch = scoreLaunch(state, { capability: m.capability + REASONING_BONUS[reasoning], spec, flags, name, priceStance: release.price, generation, skipped, polish: m.polish ?? 0 }, rng);
```
and add two fields to the `model` record, after `flags,`:
```js
    polish: m.polish ?? 0, // keep-polishing: owned by this lane, read by gn-model-appeal
    fixedFlaws: m.fixedFlaws ?? [],
```

- [ ] **Step 7: `sim/launch.js`**

Add to the imports:
```js
import { POLISH_CRITIC_DIVISOR } from './polish.js';
```
Replace:
```js
  const base = 7 + (capAvg - bar) / 3 + (capAvg - rivalAvg) / 6;
```
with:
```js
  // Polish from keeping the model in post-training (keep-polishing spec, rule 9; gn-model-appeal owns the tuning).
  const base = 7 + (capAvg - bar) / 3 + (capAvg - rivalAvg) / 6 + (model.polish ?? 0) / POLISH_CRITIC_DIVISOR;
```

- [ ] **Step 8: Update the spec's data block** (section 5) to match what was built: replace the `state.pendingModel.polishing = { … }` lines with
```text
state.pendingModel.polishing = {
  flaws: [{ flag, progress, leftIn }],   // fixable flaws still on the model, in working order
  bubbleProgress,                         // rounds spent towards the next bubble
  bubbles: [{ day, gain }],               // polish bubbles so far
  rivals: [{ id, day }],                  // rival launches that landed while polishing
  startedDay,                             // story day training ended
}
```

- [ ] **Step 9: Run the new tests, then the whole suite**

Run: `node --test tests/polish.test.js`
Expected: PASS (18 tests).

Run: `npm test 2>&1 | tail -15`
Expected: every test passes (932 before this branch, plus the new ones). Bots and scripted runs release on the first day after a run ends, so their results must not move. If a test fails, read its assertion first: a failure caused only by a model that polished between training and release (for example a test that waits a round before releasing) is expected behaviour — update that test's expectation and name each such test in the commit message. Any other failure is a bug in this task.

- [ ] **Step 10: Commit**

```bash
git add sim/training.js sim/split.js sim/turn.js sim/release.js sim/launch.js tests/polish.test.js docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md
git commit -m "feat(sim): trained models polish on the day clock until Publish; polish lifts the critics"
```

---

### Task 3: Bots publish by a rule, and the balance run measures polishing

**Files:**
- Modify: `tools/balance.js` (`makeStrategy`, `freshMetrics`, `simulateMeasured`, `report`)
- Create: `docs/notes/2026-09-26-keep-polishing-balance.md`
- Test: `tests/balance.test.js` (append one test)

**Interfaces:**
- Consumes: `flawsLeft(model)`, `nextBubbleGain(model)` from `sim/polish.js`; `nextRoundDay(state)` from `sim/time.js`.
- Produces: `readyToPublish(state, style) → boolean` (exported for the test); report fields `polishDaysPerRelease`, `meanPolishAtRelease`, `fixesPerRelease`, `meanPressAvg` per strategy.

- [ ] **Step 1: Write the failing test** (append to `tests/balance.test.js`, reusing its existing imports and adding these)

```js
import { readyToPublish } from '../tools/balance.js';
import { startPolishing } from '../sim/polish.js';

test('bots publish by a rule: speed at once, the others after fixing and some polish', () => {
  const state = createInitialState({ seed: 1 });
  state.pendingModel = { flags: ['hallucination'], publicEffects: { usersMult: 1 }, capability: 30 };
  startPolishing(state.pendingModel, 2, state.day);
  state.rivalLaunches = [];
  assert.equal(readyToPublish(state, 'speed'), true);
  assert.equal(readyToPublish(state, 'balanced'), false, 'a flaw is left');
  state.pendingModel.polishing.flaws = [];
  state.pendingModel.polish = 50; // next bubble adds 10
  assert.equal(readyToPublish(state, 'balanced'), false);
  state.pendingModel.polish = 65; // next bubble adds 7
  assert.equal(readyToPublish(state, 'balanced'), true);
  assert.equal(readyToPublish(state, 'safety'), false);
  state.pendingModel.polish = 85; // next bubble adds 3
  assert.equal(readyToPublish(state, 'safety'), true);
  state.pendingModel.polish = 0;
  state.rivalLaunches = [{ id: 'openbrain', day: state.day + 1 }];
  assert.equal(readyToPublish(state, 'balanced'), true, 'a rival lands before the next mark');
});
```
(If `createInitialState` is not yet imported in that file, add `import { createInitialState } from '../sim/state.js';`.)

- [ ] **Step 2: Run it to see it fail**

Run: `node --test tests/balance.test.js`
Expected: FAIL, "readyToPublish is not exported".

- [ ] **Step 3: Implement in `tools/balance.js`**

Add to the imports:
```js
import { flawsLeft, nextBubbleGain } from '../sim/polish.js';
import { nextRoundDay } from '../sim/time.js';
```
Above `makeStrategy`, add:
```js
// When a bot publishes (keep-polishing spec §7). Bots decide at round marks, so "wait" means another round.
// Speed and random publish at once; balanced once no flaw is left and the next bubble adds under 8, or when a rival
// lands before the next mark; safety once no flaw is left and the next bubble adds under 4.
const PUBLISH_BELOW = { balanced: 8, safety: 4 };
export function readyToPublish(state, style) {
  const model = state.pendingModel;
  const below = PUBLISH_BELOW[style];
  if (!model?.polishing || below == null) return true;
  if (flawsLeft(model) > 0) return false;
  if (nextBubbleGain(model) < below) return true;
  return style === 'balanced' && (state.rivalLaunches ?? []).some((launch) => launch.day <= nextRoundDay(state));
}
```
In `makeStrategy`, replace:
```js
    if (planned.pendingModel && actions.moves.length < 2) {
```
with:
```js
    if (planned.pendingModel && readyToPublish(planned, style) && actions.moves.length < 2) {
```
and replace:
```js
    } else if (!planned.activeRun && actions.moves.length < 2) {
```
with:
```js
    } else if (!planned.activeRun && !planned.pendingModel && actions.moves.length < 2) {
```
In `freshMetrics`, add `releases: 0, polishDaysSum: 0, polishSum: 0, fixesSum: 0, pressSum: 0` to the returned object.
In `simulateMeasured`, before `const result = endTurn(…)`, add `const pending = state.pendingModel; const decisionDay = state.day;` and after `state = result.state;` add:
```js
    for (const event of result.events.filter((e) => e.type === 'release')) {
      metrics.releases += 1;
      metrics.polishDaysSum += pending?.polishing ? decisionDay - pending.polishing.startedDay : 0;
      metrics.polishSum += event.model.polish ?? 0;
      metrics.fixesSum += event.model.fixedFlaws?.length ?? 0;
      metrics.pressSum += event.model.launch.pressAvg;
    }
```
In `report`, add sums next to `let rivalDeals = 0;`:
```js
    let releases = 0;
    let polishDaysSum = 0;
    let polishSum = 0;
    let fixesSum = 0;
    let pressSum = 0;
```
inside the seed loop, after `rivalDeals += metrics.rivalDeals;`:
```js
      releases += metrics.releases;
      polishDaysSum += metrics.polishDaysSum;
      polishSum += metrics.polishSum;
      fixesSum += metrics.fixesSum;
      pressSum += metrics.pressSum;
```
and in `result[name] = { … }`, after `rivalDealsPerRun`:
```js
      polishDaysPerRelease: releases ? polishDaysSum / releases : 0,
      meanPolishAtRelease: releases ? polishSum / releases : 0,
      fixesPerRelease: releases ? fixesSum / releases : 0,
      meanPressAvg: releases ? pressSum / releases : 0,
```

- [ ] **Step 4: Run the test and the suite**

Run: `node --test tests/balance.test.js`
Expected: PASS. Then `npm test 2>&1 | tail -15`. If a balance test with range thresholds fails because bots now wait to publish, do not widen its range: record the numbers and stop for the owner (see Step 6).

- [ ] **Step 5: Measure after, and write the note**

Run:
```bash
node tools/balance.js 200 > /tmp/keep-polishing-after.json
node -e "const b=require('/tmp/keep-polishing-before.json'),a=require('/tmp/keep-polishing-after.json');for(const k of ['speed','safety','balanced','random'])console.log(k,JSON.stringify({endingsBefore:b[k].endings,endingsAfter:a[k].endings,rankBefore:b[k].meanRankAtEra4End,rankAfter:a[k].meanRankAtEra4End,atFirstBefore:b[k].roundsAtFirst,atFirstAfter:a[k].roundsAtFirst,polishDays:a[k].polishDaysPerRelease,polish:a[k].meanPolishAtRelease,fixes:a[k].fixesPerRelease,press:a[k].meanPressAvg}))"
```
Write `docs/notes/2026-09-26-keep-polishing-balance.md` with: the commit measured, the command, a before/after table per bot (endings, mean rank at the end of era 4, share of rounds at first, days polished per release, polish at release, fixes per release, critic average), and two plain sentences on what moved. Name the critic-term handover: "`gn-model-appeal` tunes `polish / 50` from these numbers."

- [ ] **Step 6: Check the size of the effect against the spec's starting point**

The spec's starting point: a full polish should be worth about as much to the critics as the leading rival launching during the wait. From the after-run, compare the balanced bot's critic average with the speed bot's. If polishing bots end up with materially more "left behind" endings or a worse rank than before, write that in the note as the finding and stop there: tuning the critic term belongs to `gn-model-appeal`, and changing the curve constants needs the owner.

- [ ] **Step 7: Commit**

```bash
git add tools/balance.js tests/balance.test.js docs/notes/2026-09-26-keep-polishing-balance.md
git commit -m "feat(tools): bots publish by a polishing rule; balance run reports polish (before/after note)"
```

---

### Task 4: View logic for polishing (`ui/logic/polish.js`)

**Files:**
- Create: `ui/logic/polish.js`
- Modify: `ui/logic/format.js` (`project`), `ui/logic/training.js` (`readyNote`), `sim/time.js` (`storyDate` returns `d`)
- Test: `tests/ui-polish.test.js`

**Interfaces:**
- Consumes: `flawsLeft`, `polishForecast`, `FIXABLE` from `sim/polish.js`; `ROUND_DAYS`, `roundSpan`, `storyDate`, `MONTH_NAMES` from `sim/time.js`; `ADVISOR_TITLE` from `ui/logic/events.js`.
- Produces:
  - `FLAW_NAMES`, `FLAW_SHORT`, `FLAW_LINES`
  - `polishStatus(model) → string`
  - `showFlawBadge(model) → boolean`
  - `flawRows(state) → [{ flag, name, who, say, state: 'done'|'work'|'next'|'left', stateLabel, actions: [{ action, label }] }]`
  - `rumorWindow(state, day) → { start, end }`
  - `rivalRumor(state) → null | { kind: 'rumor', name, weeks } | { kind: 'landed', name }`
  - `rumorText(rumor) → string`
  - `stripModel(state) → null | { title, today: { x, label }, blocks, bubbles, landed, windows, ticks, leftIn }` with every `x` in 0..1
  - `polishIntro(state) → string`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui-polish.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startPolishing, advancePolishBy, applyFlawAction, FLAW_FIX_ROUNDS } from '../sim/polish.js';
import { roundSpan, nextRoundDay, storyDate } from '../sim/time.js';
import { project } from '../ui/logic/format.js';
import { readyNote } from '../ui/logic/training.js';
import {
  polishStatus, showFlawBadge, flawRows, rumorWindow, rivalRumor, rumorText, stripModel, polishIntro,
} from '../ui/logic/polish.js';

function polishing(flags = ['jailbreakWaiting', 'hallucination', 'sycophancy']) {
  const state = createInitialState({ seed: 1 });
  state.compute.split.safety = 0;
  state.pendingModel = { capability: 40, gain: 10, flags: [...flags], publicEffects: { usersMult: 1.15 }, size: 'medium', spec: {} };
  startPolishing(state.pendingModel, 2, state.day);
  state.rivalLaunches = [];
  return state;
}

test('the pill names the model and what polishing is doing', () => {
  const state = polishing();
  const pill = project(state);
  assert.match(pill.status, /^polishing · fixing flaws$/);
  assert.equal(pill.progress, 0);
  state.pendingModel.polishing.flaws = [];
  state.pendingModel.polish = 36.6;
  assert.equal(polishStatus(state.pendingModel), 'polishing · polish 37');
  state.pendingModel.polishing.paused = true;
  assert.equal(polishStatus(state.pendingModel), 'polishing · paused');
  assert.equal(readyNote(state), null, 'Publish replaces the floor note while a model polishes');
});

test('the Flaws badge shows only for a model that had fixable flaws', () => {
  assert.equal(showFlawBadge(polishing().pendingModel), true);
  assert.equal(showFlawBadge(polishing([]).pendingModel), false);
});

test('flaw rows list fixed, being fixed, next and left in, with advisor lines and moves', () => {
  const state = polishing();
  advancePolishBy(state, FLAW_FIX_ROUNDS);
  applyFlawAction(state, { flag: 'sycophancy', action: 'leaveIn' });
  const rows = flawRows(state);
  assert.deepEqual(rows.map((r) => [r.flag, r.state]), [
    ['jailbreakWaiting', 'done'], ['hallucination', 'work'], ['sycophancy', 'left'],
  ]);
  assert.equal(rows[0].name, 'Jailbreaks waiting');
  assert.match(rows[0].stateLabel, /^fixed [A-Z][a-z]{2} \d{1,2}$/);
  assert.equal(rows[0].who, 'Head of Safety');
  assert.deepEqual(rows[0].actions, []);
  assert.deepEqual(rows[1].actions.map((a) => a.action), ['leaveIn']);
  assert.deepEqual(rows[2].actions.map((a) => a.action), ['fix']);
  assert.equal(rows[2].stateLabel, 'left in');
});

test('a rumor names a window that holds the launch, never the day itself', () => {
  const state = polishing();
  const { start, end } = roundSpan(state.turn);
  assert.equal(end, nextRoundDay(state), 'roundSpan(turn) is the current round');
  const day = start + 30;
  const w = rumorWindow(state, day);
  assert.ok(w.start < day && day <= w.end);
  assert.ok(Math.abs((w.end - w.start) - (end - start) / 4) < 1e-9);
  state.rivalLaunches = [{ id: 'openbrain', day }];
  const rumor = rivalRumor(state);
  assert.deepEqual(rumor, { kind: 'rumor', name: 'OpenBrain', weeks: Math.max(1, Math.ceil((w.end - state.day) / 7)) });
  assert.match(rumorText(rumor), /^OpenBrain launch rumored within ~\d+ weeks?$/);
});

test('a rival that just landed shows for three days', () => {
  const state = polishing();
  state.pendingModel.polishing.rivals.push({ id: 'lodestar', day: state.day });
  assert.deepEqual(rivalRumor(state), { kind: 'landed', name: 'Lodestar' });
  assert.equal(rumorText(rivalRumor(state)), 'Lodestar launched today · the critics’ bar just went up');
  state.day += 3;
  assert.equal(rivalRumor(state), null);
});

test('the strip lays out fixes, bubbles past and coming, rivals and date ticks on one scale', () => {
  const state = polishing(['hallucination']);
  for (let i = 0; i < 40; i += 1) {
    advancePolishBy(state, 1 / 91);
    state.day += 1;
  }
  state.pendingModel.polishing.rivals.push({ id: 'openbrain', day: state.day - 5 });
  state.rivalLaunches = [{ id: 'lodestar', day: state.day + 10 }];
  const strip = stripModel(state);
  const xs = [strip.today.x, ...strip.blocks.flatMap((b) => [b.x0, b.x1]), ...strip.bubbles.map((b) => b.x), ...strip.landed.map((l) => l.x), ...strip.ticks.map((t) => t.x)];
  assert.ok(xs.every((x) => x >= 0 && x <= 1), 'everything on the strip');
  assert.equal(strip.blocks[0].label, 'wrong answers ✓');
  assert.ok(strip.bubbles.some((b) => b.past) && strip.bubbles.some((b) => !b.past));
  const past = strip.bubbles.filter((b) => b.past);
  assert.ok(past[0].size > past.at(-1).size, 'bubbles shrink');
  assert.deepEqual(strip.landed.map((l) => l.name), ['OpenBrain']);
  assert.deepEqual(strip.windows.map((w) => w.name), ['Lodestar']);
  assert.match(strip.today.label, /^today · polish \d+$/);
  assert.match(strip.ticks[0].label, /^[A-Z][a-z]{2} \d{1,2}$/);
});

test('storyDate also gives the day of the month', () => {
  assert.equal(storyDate(0).d, 1);
  assert.equal(storyDate(40).d, 10);
});

test('Research introduces polishing with the number of flaws', () => {
  assert.match(polishIntro(polishing()), /3 flaws to fix first/);
  assert.match(polishIntro(polishing(['sycophancy'])), /one flaw to fix first/);
  assert.doesNotMatch(polishIntro(polishing([])), /flaw/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test tests/ui-polish.test.js`
Expected: FAIL, "Cannot find module '…/ui/logic/polish.js'".

- [ ] **Step 3: `sim/time.js` — add the day of the month**

In `storyDate`, replace the return line with:
```js
  return { y, m, w, d: date.getUTCDate(), label: era.id === 5 ? `${month}, week ${w}` : month };
```

- [ ] **Step 4: Create `ui/logic/polish.js`**

```js
import { flawsLeft, polishForecast } from '../../sim/polish.js';
import { MONTH_NAMES, ROUND_DAYS, roundSpan, storyDate } from '../../sim/time.js';
import { ADVISOR_TITLE } from './events.js';

// What the player sees of keep-polishing (docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md §4).
export const FLAW_NAMES = { jailbreakWaiting: 'Jailbreaks waiting', hallucination: 'Confident wrong answers', sycophancy: 'Too eager to please' };
export const FLAW_SHORT = { jailbreakWaiting: 'jailbreaks', hallucination: 'wrong answers', sycophancy: 'too eager' };
// Each flaw's cost, in one advisor's own words (owner rule: consequences reach the player through characters).
export const FLAW_LINES = { // OWNER WRITES
  jailbreakWaiting: { who: 'safety', say: 'Jailbreakers will find it first.' },
  hallucination: { who: 'research', say: 'It cites cases that do not exist, with confidence.' },
  sycophancy: { who: 'policy', say: 'Users love it. Æon Review won’t.' },
};
const LANDED_DAYS = 3;

const shortDate = (day) => {
  const date = storyDate(Math.floor(day));
  return `${MONTH_NAMES[date.m - 1]} ${date.d}`;
};
const rivalName = (state, id) => state.rivals.find((rival) => rival.id === id)?.name ?? id;

export function polishStatus(model) {
  if (model.polishing?.paused) return 'polishing · paused';
  if (flawsLeft(model) > 0) return 'polishing · fixing flaws';
  return `polishing · polish ${Math.round(model.polish)}`;
}

export const showFlawBadge = (model) => Boolean(model?.polishing && (model.polishing.flaws.length + model.fixedFlaws.length) > 0);

export function flawRows(state) {
  const model = state.pendingModel;
  if (!model?.polishing) return [];
  const row = (flag, rowState, stateLabel, actions) => ({
    flag, name: FLAW_NAMES[flag], who: ADVISOR_TITLE[FLAW_LINES[flag].who], say: FLAW_LINES[flag].say, state: rowState, stateLabel, actions,
  });
  const rows = model.fixedFlaws.map((fixed) => row(fixed.flag, 'done', `fixed ${shortDate(fixed.day)}`, []));
  let working = true;
  for (const flaw of model.polishing.flaws) {
    if (flaw.leftIn) {
      rows.push(row(flaw.flag, 'left', 'left in', [{ action: 'fix', label: 'Fix it after all' }]));
    } else if (working) {
      working = false;
      rows.push(row(flaw.flag, 'work', 'being fixed', [{ action: 'leaveIn', label: 'Leave it in' }]));
    } else {
      rows.push(row(flaw.flag, 'next', 'next', [{ action: 'first', label: 'Work on this next' }, { action: 'leaveIn', label: 'Leave it in' }]));
    }
  }
  return rows;
}

// A rumor names the quarter of a round that holds the launch day, so the day itself is never shown.
export function rumorWindow(state, day) {
  let round = state.turn;
  while (roundSpan(round).end < day) round += 1;
  const { start, end } = roundSpan(round);
  const size = (end - start) / 4;
  const index = Math.min(3, Math.max(0, Math.floor((day - start - 1) / size)));
  return { start: start + index * size, end: start + (index + 1) * size };
}

export function rivalRumor(state) {
  const polishing = state.pendingModel?.polishing;
  if (!polishing) return null;
  const landed = polishing.rivals.at(-1);
  if (landed && state.day - landed.day < LANDED_DAYS) return { kind: 'landed', name: rivalName(state, landed.id) };
  const next = [...(state.rivalLaunches ?? [])].sort((a, b) => a.day - b.day)[0];
  if (!next) return null;
  const window = rumorWindow(state, next.day);
  return { kind: 'rumor', name: rivalName(state, next.id), weeks: Math.max(1, Math.ceil((window.end - state.day) / 7)) };
}

export function rumorText(rumor) {
  if (!rumor) return '';
  if (rumor.kind === 'landed') return `${rumor.name} launched today · the critics’ bar just went up`;
  return `${rumor.name} launch rumored within ~${rumor.weeks} week${rumor.weeks === 1 ? '' : 's'}`;
}

// The calendar strip (option D): one scale from the day polishing began to the eighth coming bubble.
export function stripModel(state) {
  const model = state.pendingModel;
  const polishing = model?.polishing;
  if (!polishing) return null;
  const forecast = polishForecast(model, ROUND_DAYS[state.era], state.day, 8);
  const start = polishing.startedDay;
  const end = Math.max(state.day + 1, Math.ceil(forecast.at(-1)?.day ?? state.day + 1));
  const x = (day) => Math.min(1, Math.max(0, (day - start) / (end - start)));
  const size = (gain) => Math.min(30, Math.max(8, 8 + gain * 1.1));

  const blocks = [];
  let from = start;
  for (const fixed of model.fixedFlaws) {
    blocks.push({ x0: x(from), x1: x(fixed.day), label: `${FLAW_SHORT[fixed.flag]} ✓`, done: true });
    from = fixed.day;
  }
  for (const fix of forecast.filter((entry) => entry.type === 'fix')) {
    blocks.push({ x0: x(from), x1: x(fix.day), label: FLAW_SHORT[fix.flag], done: false });
    from = fix.day;
  }
  const bubbles = [
    ...polishing.bubbles.map((bubble) => ({ x: x(bubble.day), gain: bubble.gain, size: size(bubble.gain), past: true })),
    ...forecast.filter((entry) => entry.type === 'bubble').map((bubble) => ({ x: x(bubble.day), gain: bubble.gain, size: size(bubble.gain), past: false })),
  ];
  const landed = polishing.rivals.map((rival) => ({ x: x(rival.day), name: rivalName(state, rival.id) }));
  const windows = (state.rivalLaunches ?? [])
    .map((launch) => ({ launch, window: rumorWindow(state, launch.day) }))
    .filter(({ window }) => window.end > start && window.start < end)
    .map(({ launch, window }) => ({ x0: x(window.start), x1: x(window.end), name: rivalName(state, launch.id) }));
  const span = end - start;
  const step = span <= 45 ? 7 : span <= 100 ? 14 : 30;
  const ticks = [];
  for (let day = start; day <= end; day += step) ticks.push({ x: x(day), label: shortDate(day) });
  const leftIn = polishing.flaws.filter((flaw) => flaw.leftIn).map((flaw) => FLAW_NAMES[flaw.flag]);
  return {
    title: 'post-training',
    today: { x: x(state.day), label: `today · polish ${Math.round(model.polish)}` },
    blocks, bubbles, landed, windows, ticks, leftIn,
  };
}

export function polishIntro(state) { // OWNER WRITES
  const n = flawsLeft(state.pendingModel);
  const flaws = n === 0 ? '' : `: ${n === 1 ? 'one flaw' : `${n} flaws`} to fix first, then polish`;
  return `Training’s done. We’ll keep tuning it while you decide${flaws}. Publish whenever it’s ready.`;
}
```

- [ ] **Step 5: `ui/logic/format.js` — the pill**

Add to the imports:
```js
import { polishStatus } from './polish.js';
```
In `project`, replace:
```js
    return state.pendingModel
      ? { name: 'Training complete', status: 'ready to release', progress: null }
      : { name: 'No project', status: 'click the floor to get to work', progress: null };
```
with:
```js
    const model = state.pendingModel;
    if (model?.polishing) return { name: workingName(state, model.size), status: polishStatus(model), progress: model.polish / 100 };
    return model
      ? { name: 'Training complete', status: 'ready to release', progress: null }
      : { name: 'No project', status: 'click the floor to get to work', progress: null };
```

- [ ] **Step 6: `ui/logic/training.js` — Publish replaces the floor note**

Replace `readyNote`:
```js
// Owner pick 2A: the only way into the menu is a click on the floor, so the note says it. A model being polished
// has its own Publish button under the pill instead.
export function readyNote(state) {
  return releaseWaits(state) && !state.pendingModel.polishing ? 'Ready · click the floor to release' : null;
}
```

- [ ] **Step 7: Run the tests**

Run: `node --test tests/ui-polish.test.js tests/ui-training.test.js tests/time.test.js tests/ui-format.test.js`
Expected: PASS. Then `npm test 2>&1 | tail -8` — all pass.

- [ ] **Step 8: Commit**

```bash
git add ui/logic/polish.js ui/logic/format.js ui/logic/training.js sim/time.js tests/ui-polish.test.js
git commit -m "feat(ui): polishing view logic (pill, flaw rows, rumor window, calendar strip, intro line)"
```

---

### Task 5: HUD — Flaws badge, Publish and the rumor chip (option A)

**Files:**
- Modify: `ui/hud.js` (the shell at lines 113-132, listeners after line 156, `render`)
- Modify: `ui/styles.css` (append the block)
- Test: browser check (no DOM test harness in this repo)

**Interfaces:**
- Consumes: `project`, `showFlawBadge`, `rivalRumor`, `rumorText`, `flawsLeft` (from `ui/logic/polish.js` / `sim/polish.js`).
- Produces: a `polish-act` CustomEvent on `#overlay` with `detail` `'publish' | 'flaws' | 'strip'` (Task 6 listens); DOM hooks `.hud-flaw .badge` (the badge, for bubble targets) and `.hud .pill` (the pill).

- [ ] **Step 1: Add the persistent pieces to the HUD shell**

In the `view.innerHTML` template, directly after `<div class="hud" aria-label="Current project"></div>`, add:
```html
    <button type="button" class="ctr hud-flaw" data-act="flaws" aria-label="Flaws" hidden><span class="badge"></span><span class="tag">Flaws</span></button>
    <div class="hud-polish" hidden>
      <button type="button" class="hud-publish" data-act="publish"></button>
      <span class="hud-rumor" hidden></span>
    </div>
```
Add to the imports:
```js
import { rivalRumor, rumorText, showFlawBadge } from './logic/polish.js';
import { flawsLeft } from '../sim/polish.js';
```

- [ ] **Step 2: One click handler for the three polishing controls**

After the `mute.addEventListener(…)` block, add:
```js
  // Keep polishing (spec §4): the pill opens the calendar strip, the badge the flaws list, the button the release.
  const polishAct = (act) => { if (!blocked()) overlay()?.dispatchEvent(new CustomEvent('polish-act', { detail: act })); };
  view.addEventListener('click', (event) => {
    const act = event.target.closest?.('[data-act]')?.dataset.act;
    if (act) polishAct(act);
  });
  centre.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('.pill-act')) {
      event.preventDefault();
      polishAct('strip');
    }
  });
```

- [ ] **Step 3: Render them**

In `render`, replace the pill line inside `centre.innerHTML`:
```js
      <div class="pill">
```
with:
```js
      <div class="pill${polishingModel ? ' pill-act' : ''}"${polishingModel ? ' data-act="strip" role="button" tabindex="0" aria-label="Show the polishing calendar"' : ''}>
```
and above `centre.innerHTML = …` add `const polishingModel = state.pendingModel?.polishing ? state.pendingModel : null;`. After `centre.querySelector('.pill .t').textContent = pill.name;` add:
```js
    const flawButton = view.querySelector('.hud-flaw');
    flawButton.hidden = !showFlawBadge(polishingModel);
    if (!flawButton.hidden) flawButton.querySelector('.badge').textContent = `${flawsLeft(polishingModel)}`;
    const polishRow = view.querySelector('.hud-polish');
    polishRow.hidden = !polishingModel || Boolean(polishingModel.hazard) || Boolean(state.ending);
    if (!polishRow.hidden) {
      polishRow.querySelector('.hud-publish').textContent = `Publish ${pill.name}`;
      const rumor = rivalRumor(state);
      const chip = polishRow.querySelector('.hud-rumor');
      chip.hidden = !rumor;
      chip.textContent = rumorText(rumor);
      chip.classList.toggle('landed', rumor?.kind === 'landed');
    }
```

- [ ] **Step 4: Styles** — append to `ui/styles.css`:

```css
/* Keep polishing, then Publish (spec docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md, option A). */
.pill-act { pointer-events: auto; cursor: pointer; }
.pill-act:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
.hud-flaw { position: absolute; top: 10px; left: calc(50% + 250px); padding: 0; border: 0; font: inherit; background: none; pointer-events: auto; cursor: pointer; }
.hud-flaw .badge { border: 3px solid var(--coral); color: color-mix(in oklab, var(--coral) 70%, var(--ink)); background: var(--paper); }
.hud-flaw .tag { background: color-mix(in oklab, var(--coral) 70%, var(--ink)); }
.hud-flaw:focus-visible .badge { outline: 3px solid var(--teal); outline-offset: 2px; }
.hud-polish { position: absolute; top: 86px; left: 50%; display: flex; flex-direction: column; align-items: center; gap: 7px; transform: translateX(-50%); }
.hud-publish { padding: 7px 16px 8px; border: 0; border-radius: 10px; color: var(--paper); background: var(--coral); font: inherit; font-size: 14px; font-weight: 900; box-shadow: 0 2px 0 color-mix(in oklab, var(--coral) 60%, var(--ink)); pointer-events: auto; cursor: pointer; }
.hud-publish:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }
.hud-rumor { display: inline-flex; align-items: center; gap: 6px; padding: 3px 11px 4px; border-radius: 999px; color: color-mix(in oklab, var(--wood) 55%, var(--ink)); background: color-mix(in oklab, var(--wood) 16%, var(--paper)); font-size: 11.5px; font-weight: 800; white-space: nowrap; box-shadow: 0 1px 0 color-mix(in oklab, var(--ink) 18%, transparent); }
.hud-rumor::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--wood); }
.hud-rumor.landed { color: var(--paper); background: color-mix(in oklab, var(--wood) 75%, var(--ink)); }
.hud-rumor.landed::before { background: var(--paper); }
```

- [ ] **Step 5: Check it in the browser**

Start the preview (`preview_start` name `keep-training-worktree`), set the viewport to 1440 × 900, and open `http://localhost:62140/?scenario=readyToRelease&paused&seed=1`. Before it loads the model is already trained, so press ×1 for a few seconds, then pause. Check with `read_page` and a screenshot: the pill reads "Kestrel 3 Core" (or the lab's working name) and "polishing · fixing flaws"; the Flaws badge sits right of Alignment and counts the flaws; "Publish …" and the rumor chip sit centred under the pill; nothing overlaps the money box. Compare with `docs/design/mockups/keep-polishing/img/A.jpg`. Check `read_console_messages` for errors. Force-reload changed JS and CSS before judging (the python server can serve stale files).

- [ ] **Step 6: Commit**

```bash
git add ui/hud.js ui/styles.css
git commit -m "feat(ui): HUD shows polishing (Flaws badge, Publish, rival rumor chip)"
```

---

### Task 6: The polish screen — flaws list, Publish, bubbles and the first-time line

**Files:**
- Create: `ui/screens/polish.js`
- Modify: `ui/fx.js` (`flyBubble` label), `ui/main.js` (mount), `ui/styles.css` (append)
- Test: browser check

**Interfaces:**
- Consumes: `polish-act` events from Task 5; `flawRows`, `polishIntro` from `ui/logic/polish.js`; `openRelease(game, overlayRoot)` from `ui/screens/release.js`; `bubbleAt`, `el`, `loadAnchors` from `ui/components/eventBits.js`; `ADVISOR_TITLE` from `ui/logic/events.js`; `sfx` from `ui/sfx.js`; `flyBubble(layer, kind, from, to, { duration, delay, label })`.
- Produces: `mountPolish(game, { stage, hud, overlay }) → { toggleStrip(open?) }`, and a `drawStrip` hook Task 7 fills in.

- [ ] **Step 1: `ui/fx.js` — an optional label on a flying bubble**

Change the signature and add one line after `bubble.className = …`:
```js
export function flyBubble(layer, kind, from, to, { duration = 1000, delay = 0, label = '' } = {}) {
```
```js
  if (label) bubble.textContent = label;
```

- [ ] **Step 2: Create `ui/screens/polish.js`**

```js
import { bubbleAt, el, loadAnchors } from '../components/eventBits.js';
import { flyBubble } from '../fx.js';
import { sfx } from '../sfx.js';
import { ADVISOR_TITLE } from '../logic/events.js';
import { flawRows, polishIntro } from '../logic/polish.js';
import { openRelease } from './release.js';

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const INTRO_KEY = 'gn-polish-introduced';

// Keep polishing, then Publish (spec §4): the flaws list under the badge, Publish, the flying bubbles, Research's
// first-time line, and the calendar strip on a pill click (drawStrip, Task 7).
export function mountPolish(game, { stage, hud, overlay }) {
  const layer = el('<div class="polish-layer"></div>');
  overlay.append(layer);
  const talk = el('<div class="ev-briefing"></div>');
  overlay.append(talk);
  const flights = document.createElement('div');
  flights.id = 'polish-fx';
  stage.querySelector('#fx').after(flights);
  let flawsOpen = false;
  let stripOpen = false;
  let intro = null;
  let introDone = false;
  try { introDone = localStorage.getItem(INTRO_KEY) === '1'; } catch { /* storage may be blocked */ }

  const polishing = () => Boolean(game.state.pendingModel?.polishing) && !game.state.ending;
  const busy = () => Boolean(overlay.querySelector('.dialog-layer, .event-layer, .screenwall-layer, .intro-layer, .title-layer'));

  // Stage coordinates (1440 × 900) of an element's centre, as the training bubbles use.
  function centre(node) {
    const s = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const k = s.width / 1440;
    return [(r.left + r.width / 2 - s.left) / k, (r.top + r.height / 2 - s.top) / k];
  }

  function drawFlaws() {
    layer.querySelector('.polish-flaws')?.remove();
    const rows = flawRows(game.state);
    const badge = hud.querySelector('.hud-flaw:not([hidden]) .badge');
    if (!flawsOpen || !rows.length || !badge) {
      flawsOpen = false;
      return;
    }
    const [x, y] = centre(badge);
    const card = el('<section class="polish-flaws" aria-label="Flaws"><div class="polish-flaws-head">Flaws · top one gets fixed next</div></section>');
    card.style.left = `${x - 70}px`;
    card.style.top = `${y + 42}px`;
    for (const row of rows) {
      const item = el(`<div class="polish-flaw ${row.state}"><i class="ico" aria-hidden="true"></i><div class="txt"><div class="n"></div><div class="q"></div></div><div class="st"></div></div>`);
      item.querySelector('.n').textContent = row.name;
      item.querySelector('.q').textContent = `${row.who}: “${row.say}”`;
      item.querySelector('.st').textContent = row.stateLabel;
      if (row.actions.length) {
        const acts = el('<div class="polish-flaw-acts"></div>');
        for (const { action, label } of row.actions) {
          const button = el('<button type="button" class="ev-act ghost"></button>');
          button.textContent = label;
          button.addEventListener('click', () => game.setField('flawActions', [{ flag: row.flag, action }]));
          acts.append(button);
        }
        item.querySelector('.txt').append(acts);
      }
      card.append(item);
    }
    layer.append(card);
  }

  // Filled in by Task 7.
  function drawStrip() {}

  function toggleStrip(open = !stripOpen) {
    stripOpen = open && polishing();
    drawStrip();
  }

  function closeAll() {
    flawsOpen = false;
    stripOpen = false;
    drawFlaws();
    drawStrip();
  }

  function endIntro({ done }) {
    intro?.remove();
    intro = null;
    if (!done || introDone) return;
    introDone = true;
    try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* storage may be blocked */ }
  }

  function maybeIntroduce() {
    if (introDone || intro || !polishing() || busy()) return;
    const era = game.state.era;
    loadAnchors(era).then((anchors) => {
      const head = anchors.heads?.research;
      if (!head || introDone || intro || !polishing() || busy() || game.state.era !== era) return;
      const row = el('<div class="ev-row"><button type="button" class="ev-act ghost">Got it</button></div>');
      intro = bubbleAt(talk, head, { label: ADVISOR_TITLE.research, say: polishIntro(game.state), width: 280, extra: row });
      row.querySelector('button').addEventListener('click', () => endIntro({ done: true }));
    }).catch((error) => console.error(error));
  }

  async function flyFor(events) {
    if (reducedMotion()) return;
    const wanted = events.filter((e) => e.type === 'flawFixed' || e.type === 'polishBubble');
    if (!wanted.length) return;
    const anchors = await loadAnchors(game.state.era);
    wanted.forEach((event, index) => {
      const fix = event.type === 'flawFixed';
      const target = fix ? hud.querySelector('.hud-flaw:not([hidden]) .badge') : hud.querySelector('.hud .pill');
      const head = anchors.heads?.[fix ? 'safety' : 'research'];
      if (!target || !head) return;
      const delay = index * 380;
      setTimeout(() => sfx.pop(-5, 0.04), delay);
      flyBubble(flights, fix ? 'flaw' : 'polish', [head[0], head[1] - 6], centre(target), { delay, duration: 1100, label: fix ? '✓' : `+${Math.round(event.gain)}` })
        .then(() => sfx.tick(fix ? 2 : 5, { base: fix ? 392 : 523.25, gain: 0.06 }));
    });
  }

  overlay.addEventListener('polish-act', (event) => {
    if (!polishing()) return;
    if (event.detail === 'publish') {
      closeAll();
      openRelease(game, overlay);
    } else if (event.detail === 'flaws') {
      flawsOpen = !flawsOpen;
      drawFlaws();
    } else if (event.detail === 'strip') toggleStrip();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || (!flawsOpen && !stripOpen) || busy()) return;
    event.preventDefault();
    closeAll();
  });
  overlay.addEventListener('gdt-dialog-closed', maybeIntroduce);
  game.subscribe(({ events }) => {
    if (!polishing()) {
      closeAll();
      endIntro({ done: false });
      return;
    }
    drawFlaws();
    drawStrip();
    maybeIntroduce();
    flyFor(events ?? []).catch((error) => console.error(error));
  });
  maybeIntroduce();
  return { toggleStrip, drawStrip: () => drawStrip() };
}
```

- [ ] **Step 3: `ui/main.js` — mount it**

Add to the imports:
```js
import { mountPolish } from './screens/polish.js';
```
After `const training = mountTraining(game, { stage, hud, overlay });` add:
```js
mountPolish(game, { stage, hud, overlay });
```

- [ ] **Step 4: Styles** — append to `ui/styles.css`:

```css
.polish-layer { position: absolute; inset: 0; pointer-events: none; }
.polish-flaws { position: absolute; z-index: 6; width: 310px; padding: 10px 14px 8px; border: 1px solid color-mix(in oklab, var(--ink) 8%, transparent); border-radius: 14px; background: var(--paper); box-shadow: 0 2px 0 color-mix(in oklab, var(--ink) 14%, transparent), 0 8px 22px color-mix(in oklab, var(--ink) 14%, transparent); pointer-events: auto; }
.polish-flaws-head { margin-bottom: 4px; color: color-mix(in oklab, var(--wood) 60%, var(--ink)); font-size: 10.5px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; }
.polish-flaw { display: grid; grid-template-columns: 18px 1fr auto; gap: 8px; align-items: start; padding: 7px 0; border-top: 1px solid color-mix(in oklab, var(--ink) 9%, transparent); font-size: 13px; }
.polish-flaw .n { font-weight: 900; }
.polish-flaw .q { margin-top: 1px; color: color-mix(in oklab, var(--ink) 58%, var(--paper)); font-size: 11.5px; font-weight: 700; font-style: italic; }
.polish-flaw .st { font-size: 11px; font-weight: 900; white-space: nowrap; color: color-mix(in oklab, var(--coral) 70%, var(--ink)); }
.polish-flaw.done .st { color: var(--teal); }
.polish-flaw.done .n { text-decoration: line-through; text-decoration-color: var(--teal); text-decoration-thickness: 2px; }
.polish-flaw .ico { width: 16px; height: 16px; margin-top: 1px; border-radius: 50%; box-sizing: border-box; }
.polish-flaw.done .ico { background: var(--teal); }
.polish-flaw.work .ico { border: 3px solid var(--coral); }
.polish-flaw.next .ico { border: 2px solid color-mix(in oklab, var(--coral) 70%, var(--ink)); }
.polish-flaw.left .ico { border: 2px dashed color-mix(in oklab, var(--coral) 70%, var(--ink)); }
.polish-flaw-acts { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 4px; }
.fly-bubble.polish, .fly-bubble.flaw { display: grid; place-items: center; width: 32px; height: 32px; left: -16px; top: -16px; color: var(--paper); font-size: 11.5px; font-weight: 900; }
.fly-bubble.polish { background: radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--teal) 55%, var(--paper)), var(--teal) 62%); border: 2px solid color-mix(in oklab, var(--teal) 70%, var(--ink)); }
.fly-bubble.flaw { background: radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--coral) 60%, var(--paper)), var(--coral) 62%); border: 2px solid color-mix(in oklab, var(--coral) 70%, var(--ink)); }
#polish-fx { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
```

- [ ] **Step 5: Check it in the browser**

Clear the intro flag first: `javascript_tool` → `localStorage.removeItem('gn-polish-introduced')`. Load `http://localhost:62140/?scenario=readyToRelease&seed=1` at 1440 × 900 and let the clock run at ×4. Check, with a screenshot each: Research's first-time line appears at the Research desk (compare `img/A-start.jpg`); "Got it" dismisses it; a coral ✓ bubble flies from Safety to the badge and the count drops when a flaw is fixed; teal "+N" bubbles fly into the pill once flaws are done; clicking the badge opens the list (compare `img/A-flaws-open.jpg`), "Leave it in" and "Work on this next" change the list at once; Publish opens the release dialog unchanged (compare `img/R.jpg`) and after releasing, the badge, the row and the list are gone. Force the reduced-motion preference and confirm no bubbles fly. Check `read_console_messages` for errors.

- [ ] **Step 6: Commit**

```bash
git add ui/screens/polish.js ui/fx.js ui/main.js ui/styles.css
git commit -m "feat(ui): polishing flaws list, Publish, flying bubbles and Research's first-time line"
```

---

### Task 7: The calendar strip on a pill click (option D)

**Files:**
- Modify: `ui/screens/polish.js` (replace the empty `drawStrip`)
- Modify: `ui/styles.css` (append)
- Test: browser check

**Interfaces:**
- Consumes: `stripModel(state)` from `ui/logic/polish.js` (all positions 0..1); `openRelease`.
- Produces: `.polish-strip` in the polish layer.

- [ ] **Step 1: Replace `drawStrip` in `ui/screens/polish.js`**

Add `stripModel` to the `../logic/polish.js` import, then replace `function drawStrip() {}` with:
```js
  // The calendar strip (option D), as drawn in docs/design/mockups/keep-polishing/img/D.jpg: your lane on top, rivals
  // under it, one date scale, today in coral, Publish on the right.
  const TRACK_LEFT = 36;
  const TRACK_WIDTH = 800;
  function drawStrip() {
    layer.querySelector('.polish-strip')?.remove();
    const strip = stripOpen && polishing() ? stripModel(game.state) : null;
    if (!strip) {
      stripOpen = false;
      return;
    }
    const X = (x) => TRACK_LEFT + x * TRACK_WIDTH;
    const card = el(`<section class="polish-strip" aria-label="Polishing calendar">
      <div class="ps-title"></div><div class="ps-sub">flaws, then polish</div>
      <div class="ps-lane you">YOU</div><div class="ps-lane rivals">RIVALS</div>
      <div class="ps-rule"></div></section>`);
    card.querySelector('.ps-title').textContent = `${hud.querySelector('.hud .pill .t')?.textContent ?? ''} · ${strip.title}`;
    const put = (html, left, extra = {}) => {
      const node = el(html);
      node.style.left = `${left}px`;
      for (const [key, value] of Object.entries(extra)) node.style[key] = value;
      card.append(node);
      return node;
    };
    put('<div class="ps-today"></div>', X(strip.today.x)); // drawn before the bubbles, so it paints under them
    put('<div class="ps-today-label"></div>', X(strip.today.x) + 7).textContent = strip.today.label;
    for (const block of strip.blocks) {
      put(`<div class="ps-block${block.done ? ' done' : ''}"></div>`, X(block.x0) + 1, { width: `${Math.max(12, (block.x1 - block.x0) * TRACK_WIDTH - 3)}px` }).textContent = block.label;
    }
    for (const bubble of strip.bubbles) {
      const node = put(`<div class="ps-bubble${bubble.past ? ' past' : ''}"></div>`, X(bubble.x) - bubble.size / 2, {
        width: `${bubble.size}px`, height: `${bubble.size}px`, top: `${53 - bubble.size / 2}px`,
      });
      if (bubble.size >= 19) node.textContent = `+${Math.round(bubble.gain)}`;
    }
    for (const landed of strip.landed) {
      put('<div class="ps-dot"></div>', X(landed.x) - 5);
      put('<div class="ps-landed"></div>', X(landed.x) + 9).textContent = `${landed.name} launched`;
    }
    for (const window of strip.windows) {
      put('<div class="ps-window"></div>', X(window.x0), { width: `${Math.max(8, (window.x1 - window.x0) * TRACK_WIDTH)}px` });
      put('<div class="ps-window-label"></div>', X(window.x0) + 4).textContent = `${window.name} rumored`;
    }
    for (const tick of strip.ticks) {
      put('<div class="ps-tick"></div>', X(tick.x));
      put('<div class="ps-tick-label"></div>', X(tick.x)).textContent = tick.label;
    }
    const publish = el('<button type="button" class="hud-publish ps-publish">Publish now</button>');
    publish.addEventListener('click', () => {
      closeAll();
      openRelease(game, overlay);
    });
    card.append(publish);
    if (strip.leftIn.length) card.append(el(`<div class="ps-left">${strip.leftIn.map((name) => `${name}: left in`).join('<br>')}</div>`));
    layer.append(card);
  }
```
Left-in names are fixed strings from `FLAW_NAMES`, so the `<br>` join is safe markup.

- [ ] **Step 2: Styles** — append to `ui/styles.css`:

```css
.polish-strip { position: absolute; left: 220px; top: 742px; z-index: 6; width: 1000px; height: 142px; overflow: hidden; border: 1px solid color-mix(in oklab, var(--ink) 8%, transparent); border-radius: 14px; background: var(--paper); box-shadow: 0 2px 0 color-mix(in oklab, var(--ink) 14%, transparent), 0 8px 22px color-mix(in oklab, var(--ink) 14%, transparent); pointer-events: auto; }
.polish-strip > * { position: absolute; }
.ps-title { left: 16px; top: 12px; color: color-mix(in oklab, var(--wood) 60%, var(--ink)); font-size: 10.5px; font-weight: 900; letter-spacing: .05em; text-transform: uppercase; }
.ps-sub { left: 230px; top: 12px; color: color-mix(in oklab, var(--ink) 58%, var(--paper)); font-size: 10.5px; font-weight: 800; }
.ps-lane { left: 10px; color: color-mix(in oklab, var(--ink) 58%, var(--paper)); font-size: 9px; font-weight: 900; writing-mode: vertical-rl; transform: rotate(180deg); }
.ps-lane.you { top: 44px; }
.ps-lane.rivals { top: 80px; }
.ps-rule { left: 36px; top: 80px; width: 800px; height: 1px; background: color-mix(in oklab, var(--ink) 12%, transparent); }
.ps-today { top: 30px; width: 3px; height: 82px; border-radius: 2px; background: var(--coral); }
.ps-today-label { top: 12px; color: var(--coral); font-size: 11px; font-weight: 900; white-space: nowrap; }
.ps-block { top: 40px; height: 26px; display: grid; place-items: center; overflow: hidden; border-radius: 6px; color: color-mix(in oklab, var(--coral) 60%, var(--ink)); background: color-mix(in oklab, var(--coral) 20%, var(--paper)); font-size: 11px; font-weight: 900; white-space: nowrap; }
.ps-block:not(.done) { background: repeating-linear-gradient(135deg, color-mix(in oklab, var(--coral) 20%, var(--paper)) 0 6px, var(--paper) 6px 12px); }
.ps-bubble { display: grid; place-items: center; border-radius: 50%; box-sizing: border-box; font-size: 9.5px; font-weight: 900; border: 2px dashed color-mix(in oklab, var(--teal) 70%, var(--paper)); color: color-mix(in oklab, var(--teal) 70%, var(--ink)); background: var(--paper); }
.ps-bubble.past { border: 2px solid color-mix(in oklab, var(--teal) 70%, var(--ink)); color: var(--paper); background: radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--teal) 55%, var(--paper)), var(--teal) 62%); }
.ps-dot { top: 84px; width: 10px; height: 10px; border-radius: 50%; background: var(--ink); }
.ps-landed { top: 82px; font-size: 11px; font-weight: 900; white-space: nowrap; }
.ps-window { top: 82px; height: 16px; border-radius: 4px; background: repeating-linear-gradient(135deg, color-mix(in oklab, var(--wood) 34%, transparent) 0 6px, transparent 6px 12px); }
.ps-window-label { top: 98px; color: color-mix(in oklab, var(--wood) 55%, var(--ink)); font-size: 11px; font-weight: 900; white-space: nowrap; }
.ps-tick { top: 110px; width: 1px; height: 6px; background: color-mix(in oklab, var(--ink) 30%, transparent); }
.ps-tick-label { top: 118px; color: color-mix(in oklab, var(--ink) 58%, var(--paper)); font-size: 10.5px; font-weight: 800; white-space: nowrap; }
.ps-publish { right: 18px; top: 40px; }
.ps-left { right: 18px; top: 80px; width: 170px; color: color-mix(in oklab, var(--ink) 58%, var(--paper)); font-size: 11px; font-weight: 700; text-align: right; }
```

- [ ] **Step 3: Check it in the browser**

Load `http://localhost:62140/?scenario=readyToRelease&seed=1`, run ×4 until at least two bubbles have landed, pause, click the pill. Screenshot and compare with `docs/design/mockups/keep-polishing/img/D.jpg`: two lanes, fixed blocks, filled bubbles up to the coral today line and dashed smaller ones after it, rival dots and a hatched rumor window, date ticks, Publish now, left-in names under it. Check nothing overflows the card (labels near the right edge), the strip closes on a second pill click and on Escape, and updates each day while open. Check era 1 too (`?scenario=start`, train a small model with the debug route `#recipe1`, let it finish) so the 91-day round spacing reads right.

- [ ] **Step 4: Commit**

```bash
git add ui/screens/polish.js ui/styles.css
git commit -m "feat(ui): the polishing calendar strip opens from the pill (owner pick A plus D)"
```

---

### Task 8: Whole-branch check and handover

**Files:** none new (fixes only, if the checks find something).

- [ ] **Step 1: Full suite and a clean diff**

Run: `npm test 2>&1 | tail -8` — all pass.
Run: `git diff origin/ui --stat` — only the files in the file map, plus `docs/notes/…` and the plan/spec.
Run: `grep -nE "#[0-9A-Fa-f]{3,8}\b|rgb\(" ui/styles.css | tail -20` and confirm none of the new block's lines appear (token lock).

- [ ] **Step 2: Design gate (owner's design skill, verification step)**

With the preview at 1440 × 900, take one screenshot each of: polishing start with the intro line, flaws list open, a bubble in flight, a rival landed (chip solid), the strip open in era 3 and in era 1, and the release dialog opened from Publish. Compare each with the matching mockup in `docs/design/mockups/keep-polishing/img/`. Fix anything that differs from the mockup in a way the owner did not ask for. Add one line to `~/.claude/skills/design/DESIGN-LOG.md` for the built UI.

- [ ] **Step 3: Pre-merge review (owner's review rules: Opus reviewer subagents for Game Night)**

Dispatch one Opus reviewer over `git diff origin/ui...HEAD` with the spec and this plan; adjudicate, run one combined fix wave for Critical and Important findings, re-verify, cap at 3 rounds.

- [ ] **Step 4: Push and hand over**

Push `keep-training` (ask the owner first; push in its own command). Update the lane: `~/claude-sync/bin/claude-sync.sh claim ~/worktrees/game-night-ai-lab-keep-training gn-keep-training session=local_<uuid> "doing=built and reviewed; sent to gn-merge" "files=…"`, and message `gn-merge` with the branch, the head SHA and the test count. Message `gn-model-appeal` that the fields and the `polish / 50` term are in, with the balance note's path.
