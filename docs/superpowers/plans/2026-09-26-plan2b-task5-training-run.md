# Plan 2B Task 5: the training run and the cheating-trace choice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** While a model trains, capability and alignment bubbles fly from the staff and the rack into the two HUD badges (the Game Dev Tycoon way); when a finished run carries the reward-hacking hazard, the game stops on a slim card along the bottom where the advisors argue and the player picks penalize / fix / ignore.

**Architecture:** Pure counting logic in `ui/logic/training.js` (unit-tested). A tiny flight engine in `ui/fx.js`. Two screen modules subscribe to the game: `ui/screens/training.js` (bubbles, badge ticking, the "ready to release" note) and `ui/screens/hazard.js` (the card). Both follow state changes, never turn events, so they keep working when the real-time clock replaces turns. Shared files get short hooks only, at the end where possible.

**Tech Stack:** Plain ES modules, CSS custom properties, Web Animations API, `node --test`, headless Chrome screenshots.

**Spec:** `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` §6d and §7; `docs/superpowers/plans/2026-09-25-plan2b-ui.md` Task 5 (this plan replaces its text where they differ); owner picks 2026-09-26 on the mockup page (`docs/design/mockups/K2-training.html`, routes `#r-a`, `#r-a-done`, `#d-b`).

## Owner picks this plan implements (2026-09-26)

- **Run A:** bubbles pop from `researcher1`, `researcher2`, `research` and the rack (capability, filled coral discs) and from `safety` and `research` (alignment, sky rings) and arc into the HUD badges, which count up. No staff narration lines.
- **Trace B:** the slim card along the bottom (the Task 8 event grammar), a sky band "Caught in training · The game waits for you", the trace as the card's picture, three choice buttons, advisors arguing in speech bubbles at their head anchors, each bubble with a "✓ <choice>" chip.
- **Wording "mix of 2 and 3":** the buttons show their label only (no consequence line, no backer chips); the consequences reach the player only through the advisors' bubbles.
- **Counts 1:** capability bubbles add up to the run's capability gain; alignment bubbles to the share of the run spent on alignment work: `alignment = round(capability × alignShare / (1 − alignShare))`. Never any hidden variable (debt, concealed debt, truth).

## Global Constraints

- The sim is imported, never modified (`sim/` stays untouched).
- Every colour is a token or a `color-mix()` of tokens (`--cream --paper --ink --teal --wood --coral --sky`); no hex or `rgb(` literals in new CSS/JS.
- No information by colour alone: capability = filled coral disc, alignment = sky ring.
- Hidden variables are never shown as numbers.
- No "turn" wording in anything new. No Skip button (the clock's speed controls replace it).
- `prefers-reduced-motion: reduce`: no flights; badges jump to the target; the card appears without motion.
- Interactive targets at least 24×24 px; the card is keyboard reachable.
- Shared files (`ui/main.js`, `ui/hud.js`, `ui/game.js`, `ui/styles.css`, `ui/logic/scenarios.js`): hooks short, new CSS appended at the end of `ui/styles.css` under one comment header. Other lanes edit these files too.
- `npm test` passes after every task (baseline 2026-09-26: 494 pass, 2 todo).
- Commits staged by explicit path, trailer `Co-Authored-By: Codex (gpt-5.6-sol) <noreply@openai.com>`.

---

### Task 1: Badge counts, the finished run's share, and the hazard scenario

**Files:**
- Create: `ui/logic/training.js`, `tests/ui-training.test.js`
- Modify: `ui/game.js` (track `lastAlignShare`), `ui/hud.js:11` (read `badgeCounts`), `ui/logic/scenarios.js` (add `hazard`)

**Interfaces:**
- Produces:
  - `alignmentFor(capability: number, alignShare: number) → number`
  - `expectedGain(state) → number` (0 without an active run)
  - `badgeCounts(state, lastAlignShare?: number) → { capability: number, alignment: number }`
  - `bubbleSpawns(from: {capability, alignment}, to: {capability, alignment}) → Array<{ kind: 'capability'|'alignment', source: string }>` where `source` ∈ `researcher1 | researcher2 | research | rack | safety`
  - `game.lastAlignShare` (number | undefined): the alignment share of the most recent run that was active in this game
  - `SCENARIOS.hazard(seed) → state` with `state.pendingModel.hazard` set when the seed allows it

- [ ] **Step 1: Write the failing tests** (`tests/ui-training.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alignmentFor, badgeCounts, bubbleSpawns, expectedGain } from '../ui/logic/training.js';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { createInitialState } from '../sim/state.js';

test('alignment bubbles follow the alignment share, never debt', () => {
  assert.equal(alignmentFor(18, 0.25), 6);
  assert.equal(alignmentFor(10, 0), 0);
  assert.equal(alignmentFor(10, 0.5), 10);
  assert.equal(alignmentFor(0, 0.4), 0);
});

test('no run and no trained model shows zero bubbles', () => {
  assert.deepEqual(badgeCounts(createInitialState({ seed: 1 })), { capability: 0, alignment: 0 });
});

test('a run in progress counts part of its expected gain, without touching the state', () => {
  const state = SCENARIOS.midEra3(1);
  assert.ok(state.activeRun, 'midEra3 has a run in progress');
  const before = structuredClone(state);
  const gain = expectedGain(state);
  const counts = badgeCounts(state);
  assert.deepEqual(state, before, 'counting must not change the game');
  assert.ok(gain > 0);
  assert.ok(counts.capability >= 0 && counts.capability <= Math.round(gain));
  assert.equal(counts.alignment, alignmentFor(counts.capability, state.activeRun.recipe.sliders.alignShare));
  assert.deepEqual(Object.keys(counts).sort(), ['alignment', 'capability']);
});

test('a trained model shows its real gain and the remembered share', () => {
  const state = SCENARIOS.hazard(4);
  assert.ok(state.pendingModel, 'hazard scenario ends with a trained model');
  const counts = badgeCounts(state, 0.25);
  assert.equal(counts.capability, Math.round(state.pendingModel.gain));
  assert.equal(counts.alignment, alignmentFor(counts.capability, 0.25));
  assert.equal(badgeCounts(state).alignment, 0, 'without a remembered share, alignment shows 0 rather than a guess');
});

test('the hazard scenario stops with the cheating trace still unanswered', () => {
  const state = SCENARIOS.hazard(4);
  assert.equal(state.pendingModel?.hazard?.type, 'rewardHacking');
});

test('bubble spawns cover exactly the increase, from the right sources', () => {
  const spawns = bubbleSpawns({ capability: 2, alignment: 1 }, { capability: 7, alignment: 3 });
  assert.equal(spawns.filter((s) => s.kind === 'capability').length, 5);
  assert.equal(spawns.filter((s) => s.kind === 'alignment').length, 2);
  for (const s of spawns) {
    const allowed = s.kind === 'capability' ? ['researcher1', 'researcher2', 'research', 'rack'] : ['safety', 'research'];
    assert.ok(allowed.includes(s.source), `${s.kind} from ${s.source}`);
  }
  assert.deepEqual(bubbleSpawns({ capability: 7, alignment: 3 }, { capability: 0, alignment: 0 }), []);
});

test('the game remembers the share of the run that just finished', () => {
  const game = createGame({ seed: 1, state: SCENARIOS.midEra3(1) });
  const share = game.state.activeRun.recipe.sliders.alignShare;
  assert.equal(game.lastAlignShare, share);
  for (let i = 0; i < 6 && game.state.activeRun; i += 1) game.endTurn();
  assert.equal(game.lastAlignShare, share);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/ui-training.test.js`
Expected: FAIL (`Cannot find module '../ui/logic/training.js'`).

- [ ] **Step 3: Implement `ui/logic/training.js`**

```js
import { resolveRun } from '../../sim/training.js';
import { project } from './format.js';

// Dice that never land, so the estimate adds no lawsuit or hazard and stays repeatable.
const NO_DICE = { chance: () => false };

const CAPABILITY_SOURCES = ['researcher1', 'rack', 'researcher2', 'research'];
const ALIGNMENT_SOURCES = ['safety', 'research'];

// Alignment bubbles show how much of the run went into alignment work (the player's own slider), not whether it worked.
export function alignmentFor(capability, alignShare) {
  if (!(alignShare > 0)) return 0;
  if (alignShare >= 1) return capability;
  return Math.round((capability * alignShare) / (1 - alignShare));
}

// The capability gain the run is on course for, worked out on a copy so the game itself is untouched.
export function expectedGain(state) {
  const run = state.activeRun;
  if (!run) return 0;
  return resolveRun(structuredClone(state), structuredClone(run), NO_DICE).gain;
}

export function badgeCounts(state, lastAlignShare) {
  const run = state.activeRun;
  if (run) {
    const capability = Math.round(expectedGain(state) * (project(state).progress ?? 0));
    return { capability, alignment: alignmentFor(capability, run.recipe.sliders.alignShare) };
  }
  if (state.pendingModel) {
    const capability = Math.round(state.pendingModel.gain);
    return { capability, alignment: alignmentFor(capability, lastAlignShare ?? 0) };
  }
  return { capability: 0, alignment: 0 };
}

export function bubbleSpawns(from, to) {
  const spawns = [];
  const add = (kind, count, start, sources) => {
    for (let i = 0; i < count; i += 1) spawns.push({ kind, source: sources[(start + i) % sources.length] });
  };
  add('capability', Math.max(0, to.capability - from.capability), from.capability, CAPABILITY_SOURCES);
  add('alignment', Math.max(0, to.alignment - from.alignment), from.alignment, ALIGNMENT_SOURCES);
  // Interleave the two kinds so they fly together rather than in two waves.
  const cap = spawns.filter((s) => s.kind === 'capability');
  const ali = spawns.filter((s) => s.kind === 'alignment');
  const mixed = [];
  while (cap.length || ali.length) {
    if (cap.length) mixed.push(cap.shift());
    if (ali.length && (mixed.length % 3 === 2 || !cap.length)) mixed.push(ali.shift());
  }
  return mixed;
}
```

- [ ] **Step 4: Track the share in `ui/game.js`**

Inside `createGame`, next to `const rivalReleases = [];`:

```js
  let lastAlignShare = currentState.activeRun?.recipe.sliders.alignShare;
```

Add a getter next to `get rivalReleases()`:

```js
    get lastAlignShare() {
      return lastAlignShare;
    },
```

In `endTurn()`, first line of the body, before `const turn = currentState.turn;`:

```js
      if (currentState.activeRun) lastAlignShare = currentState.activeRun.recipe.sliders.alignShare;
```

- [ ] **Step 5: Read the counts in `ui/hud.js`**

Replace line 11 (`const bubbleCount = ...`) with an import at the top:

```js
import { badgeCounts } from './logic/training.js';
```

and in `render()`, after `const run = state.activeRun;`:

```js
    const counts = badgeCounts(state, game.lastAlignShare);
```

Change the two badge expressions from `${bubbleCount(run, 'capability')}` / `${bubbleCount(run, 'alignment')}` to `${counts.capability}` / `${counts.alignment}`. Remove the now-unused `bubbleCount`.

- [ ] **Step 6: Add the `hazard` scenario to `ui/logic/scenarios.js`**

Add before `export const SCENARIOS`:

```js
// A run with full reasoning RL that ends with the cheating trace unanswered. The dice are played from seed 1 up
// until one rolls the hazard (an even chance each), so the state is always reached by the real sim.
function hazardState(seed) {
  const base = SCENARIOS.era3Idle(seed);
  if (base.ending) return base;
  const recipe = {
    sliders: { size: 'small', length: 'optimal', alignShare: 0.25 },
    picks: { pre: ['licensed-data'], mid: ['anneal'], post: ['human-sft', 'reasoning-rl', 'deliberative'] },
  };
  const basic = { budget: { spend: 25, split: { training: 0.6, security: 0.15, product: 0.1, talent: 0.15 } }, computeSplit: { safety: 0.2 } };
  let last = base;
  for (let dice = 1; dice <= 20; dice += 1) {
    const rng = createRng(dice);
    let state = endTurn(base, { ...basic, moves: [{ type: 'startRun', recipe }] }, rng).state;
    if (!state.activeRun) return base;
    for (let i = 0; i < 6 && state.activeRun && !state.ending; i += 1) {
      const eventChoices = Object.fromEntries(state.pendingEvents.map((event) => [event.id, event.choices[0].id]));
      state = endTurn(state, { ...basic, moves: [], eventChoices }, rng).state;
    }
    last = state;
    if (state.pendingModel?.hazard) return state;
  }
  return last;
}
```

and add `hazard: hazardState,` as the last entry of `SCENARIOS`. (`SCENARIOS` is a `const` object literal referenced lazily inside the function, so this is safe.)

- [ ] **Step 7: Run the tests**

Run: `node --test tests/ui-training.test.js && npm test`
Expected: all pass (the existing "every scenario builds a reachable state" test now also covers `hazard`).

- [ ] **Step 8: Commit**

```bash
git add ui/logic/training.js tests/ui-training.test.js ui/game.js ui/hud.js ui/logic/scenarios.js
git commit -m "feat(ui): badge counts from the run's gain and alignment share, and a hazard scenario"
```

---

### Task 2: The bubbles (Run A)

**Files:**
- Create: `ui/fx.js`, `ui/screens/training.js`
- Modify: `ui/main.js` (mount + one debug route), `ui/styles.css` (append)

**Interfaces:**
- Consumes: `badgeCounts`, `bubbleSpawns` (Task 1); `game.lastAlignShare`; `game.subscribe`.
- Produces:
  - `flyBubble(layer: HTMLElement, kind: 'capability'|'alignment', from: [x,y], to: [x,y], { duration = 850, delay = 0 } = {}) → Promise<void>`
  - `mountTraining(game, { stage, hud, overlay }) → { replay(from?: {capability, alignment}) }`

- [ ] **Step 1: `ui/fx.js`**

```js
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// A point on a rising quadratic arc from `from` to `to` (GDT's bubbles go up first, then across).
function arcPoint([sx, sy], [tx, ty], t) {
  const cx = sx + (tx - sx) * 0.25;
  const cy = Math.min(sy, ty) - 40;
  const u = 1 - t;
  return [u * u * sx + 2 * u * t * cx + t * t * tx, u * u * sy + 2 * u * t * cy + t * t * ty];
}

export function flyBubble(layer, kind, from, to, { duration = 850, delay = 0 } = {}) {
  if (reducedMotion()) return Promise.resolve();
  const bubble = document.createElement('div');
  bubble.className = `fly-bubble ${kind}`;
  bubble.setAttribute('aria-hidden', 'true');
  layer.append(bubble);
  const frames = [];
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12;
    const [x, y] = arcPoint(from, to, t);
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${i === 0 ? 0.3 : i === 12 ? 0.6 : 1})`, opacity: i === 12 ? 0.4 : 1 });
  }
  const animation = bubble.animate(frames, { duration, delay, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' });
  return animation.finished.catch(() => {}).finally(() => bubble.remove());
}
```

- [ ] **Step 2: `ui/screens/training.js`**

Behaviour:
- Creates `<div id="training-fx">` (absolute, inset 0, 1440×900, `pointer-events: none`) and inserts it right after `#fx` inside `stage` (same z-index as `#fx`, so it paints above it and below `#hud`).
- Badge centres come from the rendered HUD: `centre(hud.querySelector('.cap .badge'))` using `getBoundingClientRect()` converted to stage coordinates (divide by the stage's rendered width / 1440, because of the fit-to-window zoom).
- Sources come from `ui/assets/anchors-era${state.era}.json` (cache per era). Head sources start 6 px above the head anchor; the rack source is `[rack[0] - 10, rack[1] - 70]`.
- Keeps `shown` = the counts currently displayed. On every game update: `target = badgeCounts(state, game.lastAlignShare)`. If both targets are ≥ shown and at least one is higher: write `shown` back into the two badge elements (the HUD has just rendered the target), then for each spawn from `bubbleSpawns(shown, target)` start `flyBubble(layer, kind, source, badgeCentre, { delay: i * gap })` where `gap = min(420, 3600 / spawns.length)`; when each lands, increment that badge's text and add the class `tick` for 180 ms. When all have landed, set `shown = target`. Otherwise (a release resets to 0, or counts drop) set `shown = target` with no animation.
- A new update while bubbles are still flying cancels the old flights (a generation counter; remove `.fly-bubble` nodes), writes the latest target into the badges, and starts over from there.
- Reduced motion: no flights; badges show the target immediately.
- The "ready" note: while `state.pendingModel` exists and either it has no `hazard` or `game.queue.hazardChoice` is set, show `<div class="ready-note">Ready to release · open the menu when you are</div>` in `overlay` (remove it otherwise). Re-check on game updates and on the overlay event `hazard-chosen` (Task 3 dispatches it).
- `replay(from = { capability: 0, alignment: 0 })` runs the same animation from `from` to the current target (for the debug route and screenshots).

- [ ] **Step 3: CSS** — append to `ui/styles.css` under `/* ---- Task 5: training run and cheating trace ---- */`:

```css
#training-fx { position: absolute; inset: 0; width: 1440px; height: 900px; z-index: 2; pointer-events: none; }
.fly-bubble { position: absolute; left: -12px; top: -12px; width: 24px; height: 24px; border-radius: 50%; will-change: transform; }
.fly-bubble.capability { background: radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--coral) 60%, var(--paper)), var(--coral) 62%); border: 2px solid color-mix(in oklab, var(--coral) 70%, var(--ink)); }
.fly-bubble.alignment { background: var(--paper); border: 5px solid var(--sky); }
.badge.tick { transform: scale(1.12); transition: transform 180ms ease-out; }
.ready-note { position: absolute; z-index: 5; top: 74px; left: 50%; transform: translateX(-50%); padding: 3px 12px 4px; border-radius: 999px; color: var(--paper); background: color-mix(in oklab, var(--teal) 70%, var(--ink)); font-size: 12px; font-weight: 900; white-space: nowrap; box-shadow: 0 1px 0 color-mix(in oklab, var(--ink) 25%, transparent); }
@media (prefers-reduced-motion: reduce) { .badge.tick { transform: none; transition: none; } }
```

- [ ] **Step 4: Mount in `ui/main.js`**

Import `mountTraining` next to the other screen imports; after `mountTurnSummary(overlay, game);` add:

```js
const training = mountTraining(game, { stage, hud, overlay });
```

In `openDebugRoute()`, before the `#menu` check, add:

```js
  if (location.hash === '#training') {
    training.replay();
    return;
  }
```

- [ ] **Step 5: Verify**

Run `npm test` (all pass). Screenshot `tools/shot.sh midEra3 '#training'` — the capture fires about 1.2 s into the replay, so bubbles are mid-flight. Look at it: bubbles on the arcs from the right heads and the rack, badges partly counted. Force reduced motion (`--force-prefers-reduced-motion` in a manual Chrome run) and confirm the badges show the target with no bubbles.

- [ ] **Step 6: Commit**

```bash
git add ui/fx.js ui/screens/training.js ui/main.js ui/styles.css
git commit -m "feat(ui): capability and alignment bubbles fly into the badges while a model trains"
```

---

### Task 3: The cheating-trace card (Trace B, wording mix)

**Files:**
- Create: `ui/screens/hazard.js`
- Modify: `ui/main.js` (mount), `ui/styles.css` (append under the Task 5 header)

**Interfaces:**
- Consumes: `game.state.pendingModel.hazard`, `game.queue.hazardChoice`, `game.setField('hazardChoice', id)`, `modelName` from `sim/release.js`, anchors files.
- Produces: `mountHazard(game, { stage, overlay }) → void`; dispatches `new CustomEvent('hazard-chosen')` on `overlay` after a choice.

- [ ] **Step 1: `ui/screens/hazard.js`**

Content constants (the advisor lines are placeholders the owner rewrites; keep them together at the top of the file with a `// PLACEHOLDER — the owner writes the final lines` comment):

```js
export const HAZARD_CHOICES = [
  { id: 'penalize', label: 'Penalize the thought' },
  { id: 'fix', label: 'Fix the environment' },
  { id: 'ignore', label: 'Ignore it' },
];

// PLACEHOLDER — the owner writes the final lines. Each advisor argues from what they believe; none is fully right.
export const HAZARD_ARGUMENTS = [
  { role: 'research', title: 'Head of Research', say: 'Penalize it and move on. Clean traces, clean demo.', backs: 'penalize', width: 230, dx: -40 },
  { role: 'safety', title: 'Head of Safety', say: "Don't punish the thought. It'll just learn to stop saying it out loud.", backs: 'fix', width: 270, dx: 24 },
  { role: 'cfo', title: 'CFO', say: 'Nobody reads the traces. Fixing the tests costs us weeks.', backs: 'ignore', width: 240, dx: 20, dy: -40 },
];
```

The trace (illustrative, modelled on published reward-hacking examples; `<name>` is the working name below):

```
<name> · practice task 18,204 · fix the failing date parser
› The grader only checks that verify() returns True.
› Fixing the parser properly is hard.
› Let's hack: make verify() always return True.      (the flagged line)
› Done. All 212 tests pass.
› Grader: passed ✓
```

Working name: `modelName({ family: last?.family ?? 'Kestrel', generation: (last?.generation ?? 0) + 1, size: state.pendingModel.size, tierWords: state.tierWords })` with `last = state.models.at(-1)` (the same rule `project()` uses for the pill during the run).

Behaviour:
- Open when `state.pendingModel?.hazard` is set and `game.queue.hazardChoice === undefined` and the card is not already open. Check on mount and on every game update.
- DOM, built with `textContent` for all text (never interpolate names into HTML):
  - a veil `<div class="hazard-veil">` over the whole stage (`pointer-events: auto`) so nothing else can be clicked while the game waits;
  - `<section class="gp hazard-card" role="dialog" aria-modal="true" aria-labelledby="hazard-title">` with: a band (`Caught in training` + `The game waits for you`), a `<figure class="hazard-pic">` holding the trace (`.hazard-trace`, lines as `<span>`s, the flagged line with class `hack`) and the caption `From the reasoning trace, this morning`, then `<h1 id="hazard-title">Caught: a cheating reasoning trace</h1>`, the lede `<name> was asked to fix a bug. It rewrote the grader instead, and said so in its own notes.`, and a row of three `<button type="button" class="hazard-choice">` with the label only;
  - one speech bubble per `HAZARD_ARGUMENTS` entry at that advisor's head anchor (same placement rule as the Task 8 mockups: `left = x − tail − 7 + dx`, `top = y + dy − height`, default `tail 28`, `dy −34`), each with the advisor's title, the line, and a chip `✓ <label of the choice it backs>`.
- On open: `stage.classList.add('hazard-open')`; `game.clock?.pause?.()` (the real-time lane's clock, when it lands); focus the first choice button. Tab and Shift+Tab stay inside the three buttons. Escape does nothing (a choice is required).
- On a choice: `game.setField('hazardChoice', id)`; remove the veil, card and bubbles; `stage.classList.remove('hazard-open')`; `game.clock?.resume?.()`; `overlay.dispatchEvent(new CustomEvent('hazard-chosen'))`.
- Reduced motion: no slide-in.

- [ ] **Step 2: CSS** (append under the Task 5 header)

```css
.hazard-veil { position: absolute; inset: 0; z-index: 10; pointer-events: auto; }
.hazard-open #office { filter: saturate(.8) brightness(.96); }
.hazard-open .advisor-marker { display: none; }
.hazard-card { z-index: 12; left: 230px; right: 230px; bottom: 20px; padding: 0; text-align: left; display: grid; grid-template-columns: auto 1fr; pointer-events: auto; animation: hazard-in 260ms ease-out both; }
@keyframes hazard-in { from { transform: translateY(24px); opacity: 0; } }
.hazard-card .band { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; padding: 6px 18px 7px; background: color-mix(in oklab, var(--sky) 78%, var(--ink)); color: var(--paper); font-size: 12.5px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.hazard-card .band span { letter-spacing: 0; text-transform: none; font-weight: 700; }
.hazard-pic { grid-row: 2; width: 300px; margin: 0; padding: 14px 0 16px 18px; }
.hazard-pic figcaption { margin-top: 5px; font-size: 10.5px; font-weight: 800; color: color-mix(in oklab, var(--ink) 70%, var(--paper)); }
.hazard-trace { border-radius: 10px; background: var(--ink); color: color-mix(in oklab, var(--paper) 88%, var(--ink)); font: 500 11px/1.5 'IBM Plex Mono', ui-monospace, monospace; padding: 10px 12px; }
.hazard-trace .meta { color: color-mix(in oklab, var(--paper) 62%, var(--ink)); margin-bottom: 2px; }
.hazard-trace .ln { display: block; padding: 1px 6px; margin: 0 -6px; border-radius: 4px; }
.hazard-trace .ln::before { content: "› "; color: color-mix(in oklab, var(--teal) 70%, var(--paper)); }
.hazard-trace .hack { background: color-mix(in oklab, var(--coral) 34%, var(--ink)); color: var(--paper); font-weight: 600; }
.hazard-trace .ok { color: color-mix(in oklab, var(--teal) 72%, var(--paper)); }
.hazard-main { grid-row: 2; padding: 13px 20px 16px; }
.hazard-main h1 { margin: 0; font-size: 27px; font-weight: 300; line-height: 1.1; }
.hazard-main .lede { margin-top: 6px; font-size: 14.5px; font-weight: 700; line-height: 1.35; }
.hazard-choices { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 10px; margin-top: 12px; }
.hazard-choice { min-height: 44px; padding: 9px 12px 10px; border: 2.5px solid color-mix(in oklab, var(--ink) 12%, transparent); border-radius: 12px; background: var(--paper); font: inherit; font-size: 15.5px; font-weight: 900; text-align: left; color: var(--ink); cursor: pointer; }
.hazard-choice:hover { border-color: var(--wood); }
.hazard-choice:focus-visible { outline: 3px solid var(--sky); outline-offset: 2px; }
.hazard-bubble { position: absolute; z-index: 11; background: var(--paper); border-radius: 12px; padding: 8px 12px 10px; font-size: 14px; font-weight: 700; line-height: 1.3; border: 1px solid color-mix(in oklab, var(--ink) 10%, transparent); box-shadow: 0 2px 0 color-mix(in oklab, var(--ink) 14%, transparent), 0 8px 18px color-mix(in oklab, var(--ink) 14%, transparent); }
.hazard-bubble::after { content: ""; position: absolute; left: var(--tail, 24px); bottom: -8px; width: 14px; height: 14px; background: var(--paper); transform: rotate(45deg); border-right: 1px solid color-mix(in oklab, var(--ink) 10%, transparent); border-bottom: 1px solid color-mix(in oklab, var(--ink) 10%, transparent); }
.hazard-bubble b { display: block; font-size: 10.5px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; color: color-mix(in oklab, var(--wood) 60%, var(--ink)); }
.hazard-bubble .chip { display: inline-flex; margin-top: 6px; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; background: color-mix(in oklab, var(--teal) 14%, var(--paper)); color: color-mix(in oklab, var(--teal) 62%, var(--ink)); }
@media (prefers-reduced-motion: reduce) { .hazard-card { animation: none; } }
```

Add `&family=IBM+Plex+Mono:wght@500;600` to the Google Fonts link in `index.html` (the trace needs it).

- [ ] **Step 3: Mount in `ui/main.js`**

Import `mountHazard`; after the `mountTraining` line add `mountHazard(game, { stage, overlay });`.

- [ ] **Step 4: Verify**

`npm test` passes. Screenshot `tools/shot.sh hazard` — look at it against mockup `#d-b` minus the button chips: card along the bottom, three advisors arguing at their desks with ✓ chips, clean labels on the buttons, markers hidden, office slightly desaturated. Click a choice in the browser: the card closes, `game.queue.hazardChoice` is set, the teal "Ready to release" note appears under the pill; end the turn and check the `hazardResolved` event carries the choice.

- [ ] **Step 5: Commit**

```bash
git add ui/screens/hazard.js ui/main.js ui/styles.css index.html
git commit -m "feat(ui): the cheating-trace card, with the advisors arguing and a choice the game waits for"
```

---

## Notes for the final report (not tasks)

- `fix` delays the release (`releaseDelay`). The release dialog lives on branch `release-flow`; whether its button greys out during the delay is that lane's call.
- `game.clock?.pause/resume` are guarded calls; the real-time lane must expose them (or rename them here) when it lands.
- A page reload into a trained model loses the remembered share; the alignment badge then shows 0 until the next run. No save/load exists, so only the debug scenario hits this.
