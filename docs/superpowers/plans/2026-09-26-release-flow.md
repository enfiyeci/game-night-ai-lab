# Release Flow Implementation Plan (plan 2B Task 6, as the owner picked it)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The player can release a trained model: a GDT release dialog (evaluation, channel, price, thinking effort, name) and, when the turn ends, an animated reveal (benchmarks, press, reactions, price sheet), exactly as the owner-approved final mockup shows.

**Architecture:** One small sim change (owner-approved 2026-09-26: version-number skipping raises the critics' bar by 1 point and draws posts about the jump; the release move carries the player's size words). All numbers the screens show come from pure helpers in a new `ui/logic/release.js`, unit-tested under `node --test`. Two DOM modules draw the screens: `ui/screens/release.js` (the dialog, built on `openDialog` and the recipe screen's card picker) and `ui/screens/reveal.js` (the reveal, opened from a `game.subscribe` listener when a `release` event arrives).

**Tech Stack:** Plain ES modules, no build step, `node --test` for tests, headless Chrome screenshots through `tools/shot.sh`.

## Global Constraints

- Visual reference, binding: `docs/design/mockups/release-flow-final.html` and its two PNGs, `docs/design/mockups/release-flow-final-dialog.png` and `docs/design/mockups/release-flow-final-reveal.png`. The reveal also stays faithful to K2 `#release` in `docs/design/mockups/K2-gdt-polished.html`.
- Every colour is a token from `ui/styles.css` `:root` (`--cream`, `--paper`, `--ink`, `--teal`, `--wood`, `--coral`, `--sky`) or a `color-mix()` of tokens. No new hex literals.
- Player-typed text (family name, size words, lab name) is set with `textContent` or an input's `value`, never `innerHTML`. `ui/components/dialog.js` `appendContent` uses `innerHTML` for string content, so always pass DOM nodes, never strings, when they contain player text.
- The sim changes only as Task 1 says (owner approval 2026-09-26, picks 3C and the naming decision). Nothing else in `sim/` changes.
- `npm test` passes after every task. One commit per task, staged by explicit path.
- Shared files: `ui/main.js`, `ui/styles.css`, `ui/logic/scenarios.js` and `ui/menu.js` are also edited by the events lane (plan 2B Task 8, branch `events-research` or its successor). Before editing one, message that lane's session with the file and the hunk you will touch; keep hunks small and appended at the end of blocks so merges stay clean.
- Every screen is screenshot-checked (`sh tools/shot.sh <scenario> '<#hash>'`, 1440×900 and 1000×700) and compared with the mockup PNG before its task counts as done (owner's design rule: nothing ships unlooked-at).
- Reduced motion: no animation when `prefers-reduced-motion: reduce`.

## The owner's picks (2026-09-26) and what each means for the build

Source: `docs/research/release-flow/suggestions-2026-09-26.md` and the review page (claude.ai artifact "Release Flow Picks", version 4). Final picks: **1C 2A 3C 4B 5B 6A 7B 8A**.

| Pick | Meaning |
|---|---|
| 1C | Price is a GDT vertical slider with four stops (Premium, Market, Undercut, Free tier). Beside each stop: what API customers pay per million tokens for this model; Free tier says "ads and upgrades". |
| 2A | The Team panel shows each advisor's opinion of the current picks; every evaluation card carries a "Ships this turn" / "Ships next turn" chip. |
| 3C | A "Skip ahead a number" box. Each skipped number raises the critics' comparison bar by 1 benchmark point. The feed always talks about the jump: impressed posts when the new model beats the last flagship's capability average by 5 or more points, mocking posts otherwise. (Sim change, Task 1.) |
| 4B | The reveal builds up over about four seconds: benchmark bars, then the four critics one at a time, then the reactions, then Continue. Any click or key skips to the end. |
| 5B | Badge: "Beats your last flagship on N of 5 benchmarks", counting all five rows (safety included); hidden on the first release. Next to it, a price sheet: customer price per million tokens, serving cost per million tokens, margin, with channel and thinking effort underneath. |
| 6A | The Jailbreak Gauntlet row carries a label naming who checked it: Government tested, Third-party checked, Internal evals, or Self-reported. |
| 7B | Footer: "New users this month: +X" plus "About $Y a month in sales (estimate)". |
| 8A | No extra "why the scores moved" line. |

Already decided earlier (unchanged): the player types the family; the number is automatic; the four size words are named once on the first release (pre-filled Swift, Core, Grand, Apex) with a "Rename sizes" link.

Correction recorded in the research notes: `sim/turn.js` runs `updateServing` right after a release move, so a model that ships this turn already has `servingCost` at the reveal. A launch delayed by a one-turn evaluation or the staged channel has none yet; the helpers fall back to the light-load formula for it.

## File structure

| File | Change | Responsibility |
|---|---|---|
| `sim/data/launch.js` | modify | Jump constants and the four jump reactions. |
| `sim/launch.js` | modify | The jump raises the press bar; reactions see `jump`. |
| `sim/release.js` | modify | `cleanTierWords`, `skipped`, `tierWords` from the release move. |
| `tests/launch.test.js`, `tests/release.test.js` | modify | Tests for the above. |
| `ui/logic/release.js` | create | Pure helpers: spec, per-token prices, draft, payload, preview, opinions, badge count, check label, price sheet, sales estimate. |
| `tests/ui-release.test.js` | create | Tests for `ui/logic/release.js`. |
| `ui/logic/scenarios.js` | modify | `readyToRelease` scenario (an era-3 state with a trained, unreleased model). |
| `ui/screens/recipe.js` | modify | Export `techniquePanel`, add a `cardNote` option and the release group names. |
| `ui/screens/release.js` | create | The release dialog (sizes stage and main stage). |
| `ui/screens/reveal.js` | create | The reveal and its build-up animation. |
| `ui/main.js` | modify | Mount both screens; debug routes `#release`, `#sizes`, `#reveal`. |
| `ui/styles.css` | modify | Styles for both screens, appended at the end. |

---

### Task 1: Sim — skipping a number, jump posts, size words on the release move

**Files:**
- Modify: `sim/data/launch.js` (constants above `CRITICS`; four entries at the top of `REACTIONS`; one guard on the existing `@lodestar_eng` entry)
- Modify: `sim/launch.js` (`scoreLaunch`)
- Modify: `sim/release.js` (`cleanTierWords`, `releaseModel`)
- Modify: `ui/logic/history.js` (`isControversyReaction`: the praise post is not a controversy)
- Test: `tests/launch.test.js`, `tests/release.test.js`

**Interfaces:**
- Produces: `JUMP_BAR_PER_NUMBER = 1`, `JUMP_EARNED_GAIN = 5` (from `sim/data/launch.js`); `cleanTierWords(words) → { small, medium, large, xl }` (from `sim/release.js`); the release move accepts `release.tierWords`; the released `model` gains `skipped` (0 or more); `scoreLaunch(state, model, rng)` reads optional `model.generation` and `model.skipped`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/launch.test.js`:

```js
const flagshipAt = (score) => ({
  name: 'Kestrel 3 Core',
  benchmarks: ['patchwork', 'doctorate', 'horizon', 'finalexam'].map((id) => ({ id, shown: score }))
    .concat({ id: 'gauntlet', shown: 80 }),
});
const named = { ...plain, name: 'Kestrel 5 Core', generation: 5 };

test('each skipped version number raises the critics bar by one benchmark point', () => {
  const s = createInitialState();
  s.lastFlagship = flagshipAt(54); // plain averages 42, so every critic lands between 6 and 9 (checked 2026-09-26)
  const a = scoreLaunch(s, { ...named, generation: 4, skipped: 0 }, zeroRng);
  const b = scoreLaunch(s, { ...named, generation: 7, skipped: 3 }, zeroRng);
  // Precondition: no critic sits at the 1 or 10 clamp, so a shift of exactly one point shows.
  assert.ok(a.press.every((p) => p.score > 1 && p.score < 10));
  // Three skipped numbers raise the bar by 3 points; the press base is (capAvg - bar) / 3, so it drops by exactly 1.
  a.press.forEach((p, i) => assert.equal(b.press[i].score, p.score - 1));
});

test('a skipped number that is earned draws impressed posts first', () => {
  const s = createInitialState();
  s.lastFlagship = flagshipAt(20); // plain scores a capability average of 42: a gain of 22
  const r = scoreLaunch(s, { ...named, skipped: 1 }, zeroRng);
  assert.equal(r.reactions[0].handle, '@benchwatch');
  assert.equal(r.reactions[0].text, 'ok, the jump to 5 is earned. this is not a point release.');
  assert.ok(r.reactions.some((x) => x.text === "if we're skipping numbers now, our next one is 7."));
});

test('a skipped number without a real gain draws mocking posts first', () => {
  const s = createInitialState();
  s.lastFlagship = flagshipAt(41); // a gain of 1
  const r = scoreLaunch(s, { ...named, skipped: 1 }, zeroRng);
  assert.equal(r.reactions[0].text, 'Kestrel 5 Core? the evals read more like a 3.1');
  assert.equal(r.reactions[1].text, 'so the version number is marketing now. cool cool.');
});

test('no jump posts when no number was skipped', () => {
  const s = createInitialState();
  s.lastFlagship = flagshipAt(41);
  const r = scoreLaunch(s, { ...named, skipped: 0 }, zeroRng);
  assert.ok(!r.reactions.some((x) => /skipping|jump to|evals read|version number/.test(x.text)));
});
```

Append to `tests/release.test.js`:

```js
test('skipping a version number is recorded on the released model', () => {
  const s = trainedState();
  s.models.push({ name: 'Kestrel 1 Core', family: 'Kestrel', generation: 1, active: false });
  const r = releaseModel(s, { ...release, generation: 3 }, rng);
  assert.equal(r.ok, true);
  assert.equal(r.model.skipped, 1);
  assert.equal(r.model.name, 'Kestrel 3 Core');
});

test('the first release never counts as skipping', () => {
  const s = trainedState();
  const r = releaseModel(s, { ...release, generation: 4 }, rng);
  assert.equal(r.model.skipped, 0);
});

test('the release move names the four sizes, trimmed and capped at 16 characters', () => {
  const s = trainedState();
  const words = { small: ' Haiku ', medium: 'Sonnet', large: '', xl: 'Opus-Maximum-Extra-Long-Name' };
  const r = releaseModel(s, { ...release, tierWords: words }, rng);
  assert.equal(r.ok, true);
  assert.deepEqual(s.tierWords, { small: 'Haiku', medium: 'Sonnet', large: '', xl: 'Opus-Maximum-Ext' });
  assert.equal(r.model.name, 'Kestrel 1 Sonnet');
});

test('a failed release leaves the size words alone', () => {
  const s = trainedState();
  const r = releaseModel(s, { ...release, price: 'constructor', tierWords: { medium: 'Sonnet' } }, rng);
  assert.equal(r.ok, false);
  assert.equal(s.tierWords, undefined);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test tests/launch.test.js tests/release.test.js`
Expected: six of the eight new tests FAIL (no jump logic, `skipped` undefined, `tierWords` not applied). "No jump posts when no number was skipped" and "a failed release leaves the size words alone" already pass; they guard against regressions.

- [ ] **Step 3: Implement**

In `sim/data/launch.js`, add above `export const CRITICS`:

```js
// Owner 2026-09-26 (release flow pick 3C): skipping a version number raises the critics' bar a
// little, and the feed always talks about the jump. Gain = new capability average minus the last flagship's.
export const JUMP_BAR_PER_NUMBER = 1;
export const JUMP_EARNED_GAIN = 5;
```

At the top of the `REACTIONS` array, before the `jailbreakWaiting` entry, insert:

```js
  { when: (c) => c.jump.skipped > 0 && c.jump.gain >= JUMP_EARNED_GAIN, handle: '@benchwatch', text: (c) => `ok, the jump to ${c.jump.to} is earned. this is not a point release.` },
  { when: (c) => c.jump.skipped > 0 && c.jump.gain < JUMP_EARNED_GAIN, handle: '@benchwatch', text: (c) => `${c.model.name}? the evals read more like a ${c.jump.from}.1` },
  { when: (c) => c.jump.skipped > 0 && c.jump.gain < JUMP_EARNED_GAIN, handle: '@ml_hobbyist', text: 'so the version number is marketing now. cool cool.' },
  { when: (c) => c.jump.skipped > 0, handle: '@lodestar_eng', text: (c) => `if we're skipping numbers now, our next one is ${c.jump.to + 2}.` },
```

Change the existing `@lodestar_eng` entry's condition so the rival does not post twice:

```js
  { when: (c) => c.rank <= 2 && c.jump.skipped === 0, handle: '@lodestar_eng', text: 'congrats. see you in 6 weeks.' },
```

In `sim/launch.js`, add `JUMP_BAR_PER_NUMBER` to the existing import from `./data/launch.js` (only the reactions use `JUMP_EARNED_GAIN`, and they live in the same data file). Then replace the three lines from `const prevAvg` to `const base` and the `rctx` line:

```js
  const prevAvg = prev ? prev.benchmarks.filter((b) => b.id !== 'gauntlet').reduce((s, b) => s + b.shown, 0) / caps.length : capAvg - 5;
  const rivalAvg = caps.reduce((s, b) => s + b.rival, 0) / caps.length;
  const skipped = Math.max(0, model.skipped ?? 0);
  const bar = prevAvg + JUMP_BAR_PER_NUMBER * skipped;
  const base = 7 + (capAvg - bar) / 3 + (capAvg - rivalAvg) / 6;
```

```js
  const generation = model.generation ?? 0;
  const jump = { skipped, gain: capAvg - prevAvg, to: generation, from: generation - skipped - 1 };
  const rctx = { ...ctx, launch: { ...launch, pressAvg }, spec, model, jump };
```

In `sim/release.js`, add below `modelName`:

```js
const TIER_WORD_MAX = 16;
// The release move can carry the player's four size words (named once, on the first release).
export const cleanTierWords = (words) => Object.fromEntries(Object.keys(TIER_WORDS).map((size) => [
  size,
  typeof words?.[size] === 'string' ? words[size].trim().slice(0, TIER_WORD_MAX) : '',
]));
```

In `releaseModel`, replace `const generation = release.generation ?? 1;` with:

```js
  if (release.tierWords && typeof release.tierWords === 'object') state.tierWords = cleanTierWords(release.tierWords);
  const generation = release.generation ?? 1;
  const previous = state.models.at(-1);
  const skipped = previous ? Math.max(0, generation - ((previous.generation ?? 0) + 1)) : 0;
```

(This line sits after the cash check, so a failed release never renames the sizes.) Pass the new fields to the scorer:

```js
  const launch = scoreLaunch(state, { capability: m.capability + REASONING_BONUS[reasoning], spec, flags, name, priceStance: release.price, generation, skipped }, rng);
```

and add `skipped,` to the `model` object right after `generation,`.

In `ui/logic/history.js`, `@benchwatch` is in `CONTROVERSY_HANDLES`, so the lab-history article would list the new praise post ("the jump to 5 is earned") as a controversy. In `isControversyReaction`, after the `@marketwire` line, add:

```js
  // Benchwatch also praises an earned version jump (release flow pick 3C); only its doubts are controversies.
  if (reaction.handle === '@benchwatch') return !reaction.text.includes('is earned');
```

The existing handle-classification test in `tests/ui-history.test.js` keeps passing: no new handles were added.

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all tests PASS, including the eight new ones.

- [ ] **Step 5: Check balance did not move**

Run: `npm run balance`
Expected: the same ending distribution as before, within noise (the scripted strategies never skip numbers, so `skipped` is always 0).

- [ ] **Step 6: Commit**

```bash
git add sim/data/launch.js sim/launch.js sim/release.js ui/logic/history.js tests/launch.test.js tests/release.test.js
git commit -m "feat(sim): skipping a version number raises the critics' bar by a point and draws posts about the jump; the release move names the sizes"
```

---

### Task 2: Release helpers and the ready-to-release scenario

**Files:**
- Create: `ui/logic/release.js`
- Modify: `ui/logic/scenarios.js` (add `readyToRelease`, register it in `SCENARIOS`)
- Test: `tests/ui-release.test.js`

**Interfaces:**
- Consumes: `cleanTierWords` is not needed here; `tierWord`, `modelName`, `releaseModel`, `TIER_WORDS` from `sim/release.js`; `resolveCards`, `pickableCards`, `slotsFor`, `cardById` from `sim/recipe.js`; the serving tables from `sim/serving.js`; `projectQueue` from `ui/logic/compute.js`.
- Produces (all exported from `ui/logic/release.js`):
  - `PRICE_STOPS = ['free', 'undercut', 'market', 'premium']` (slider value 0–3, bottom to top), `PRICE_NAMES`, `REASONING_STOPS = ['off', 'low', 'medium', 'high']`, `REASONING_NAMES`, `CHANNEL_NAMES`, `SIZE_ORDER`
  - `releaseSpec(state, picks, reasoning) → spec` (with `channel` and `reasoning`)
  - `tokensPerUser(spec, era) → number` (millions of tokens per user per month)
  - `pricePerMillion(spec, era, stance) → number | null` (null for open weights)
  - `servingPerMillion(spec, era) → number | null`
  - `perMillion(value) → '$1.25'`
  - `shipDelay(state, picks) → number`, `shipWords(delay) → 'this turn' | 'next turn' | 'in N turns'`, `withCard(picks, card) → picks`
  - `canSkip(state) → boolean`, `nextGeneration(state, skip) → number`
  - `releaseDraft(state, remembered) → { picks, price, reasoning, family, skip, tierWords }`
  - `releasePayload(state, draft) → release move payload`
  - `queueBeforeRelease(queue) → queue` (only the moves queued before an existing release, or all moves if none)
  - `releasePreview(state, queue, draft) → { ok, errors, cash, delay, name }`
  - `releaseOpinions(state, draft) → [{ id, mood, text }]` (for `teamPanel(state, { opinions })`)
  - `beatCount(launch) → { beaten, of } | null`, `checkLabel(flags) → string`, `priceSheet(model, era) → object`, `salesEstimate(model) → millions per month`, `flagshipBefore(state, model) → model | undefined`
  - `SCENARIOS.readyToRelease(seed)` in `ui/logic/scenarios.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui-release.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun } from '../sim/training.js';
import {
  beatCount, canSkip, checkLabel, nextGeneration, perMillion, priceSheet, pricePerMillion, queueBeforeRelease,
  releaseDraft, releaseOpinions, releasePayload, releasePreview, releaseSpec, salesEstimate,
  servingPerMillion, shipDelay, shipWords, tokensPerUser,
} from '../ui/logic/release.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

const rng = { next: () => 0.5, int: () => 0, chance: (p) => p > 0.5, normal: (m) => m };
const trained = () => {
  const s = createInitialState();
  startRun(s, {
    sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
    picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
  });
  advanceRun(s, rng);
  return s;
};
const withSpec = (spec, flags = []) => {
  const s = createInitialState();
  s.pendingModel = { size: 'medium', flags, spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoningCapable: true, ...spec } };
  return s;
};

test('the default release ships API only, and agentic models become agent API', () => {
  assert.equal(releaseSpec(withSpec({}), [], 'off').channel, 'enterprise');
  assert.equal(releaseSpec(withSpec({}), ['channel-app'], 'off').channel, 'consumer');
  assert.equal(releaseSpec(withSpec({}, ['agentic']), [], 'off').channel, 'agent');
  assert.equal(releaseSpec(withSpec({ reasoningCapable: false }), [], 'high').reasoning, 'off');
});

test('per-token prices follow the sim serving tables', () => {
  const spec = releaseSpec(withSpec({}), [], 'off'); // era 1, enterprise, no thinking
  assert.equal(tokensPerUser(spec, 1), 2); // 0.5 x 4 x 1
  assert.equal(pricePerMillion(spec, 1, 'market'), 15); // $30 a user a month over 2M tokens
  assert.equal(pricePerMillion(spec, 1, 'premium'), 22.5);
  assert.ok(Math.abs(servingPerMillion(spec, 1) - 4.8) < 1e-9); // $6 x medium 1 x dense 1 x short 0.8
  assert.equal(perMillion(1.249), '$1.25');
  const open = releaseSpec(withSpec({}), ['channel-open'], 'off');
  assert.equal(pricePerMillion(open, 1, 'market'), null);
  assert.equal(servingPerMillion(open, 1), null);
});

test('evaluation cards that cost a turn delay the launch', () => {
  const s = trained();
  s.era = 2;
  assert.equal(shipDelay(s, ['eval-full']), 0);
  assert.equal(shipDelay(s, ['eval-third']), 1);
  assert.equal(shipWords(0), 'this turn');
  assert.equal(shipWords(1), 'next turn');
  assert.equal(shipWords(2), 'in 2 turns');
});

test('the number counts up, and skipping is not offered on the first release', () => {
  const s = trained();
  assert.equal(canSkip(s), false);
  assert.equal(nextGeneration(s, true), 1);
  s.models.push({ family: 'Kestrel', generation: 3 });
  assert.equal(canSkip(s), true);
  assert.equal(nextGeneration(s, false), 4);
  assert.equal(nextGeneration(s, true), 5);
});

test('the draft keeps remembered choices that are still valid', () => {
  const s = trained();
  const draft = releaseDraft(s, { picks: ['eval-full', 'not-a-card'], price: 'premium', family: 'Kestrel' });
  assert.deepEqual(draft.picks, ['eval-full']);
  assert.equal(draft.price, 'premium');
  assert.equal(draft.family, 'Kestrel');
  assert.deepEqual(draft.tierWords, { small: 'Swift', medium: 'Core', large: 'Grand', xl: 'Apex' });
  assert.equal(releaseDraft(s, { price: 'constructor' }).price, 'market');
});

test('the payload is a valid sim release and carries the size words', () => {
  const s = trained();
  const draft = { ...releaseDraft(s), family: '  Kestrel ', tierWords: { small: 'A', medium: 'B', large: 'C', xl: 'D' } };
  const payload = releasePayload(s, draft);
  assert.deepEqual(payload, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1, tierWords: { small: 'A', medium: 'B', large: 'C', xl: 'D' } });
});

test('the preview needs a family name and reports the cash cost', () => {
  const s = trained();
  const blank = releasePreview(s, { moves: [] }, { ...releaseDraft(s), family: '' });
  assert.equal(blank.ok, false);
  assert.equal(blank.errors[0], 'Type a family name for the model');
  const ok = releasePreview(s, { moves: [] }, { ...releaseDraft(s), family: 'Kestrel', picks: ['eval-full'] });
  assert.equal(ok.ok, true);
  assert.equal(ok.cash, 10);
  assert.equal(ok.name, 'Kestrel 1 Core');
});

test('an already queued release keeps its place, so only the moves ahead of it are projected', () => {
  const queue = { moves: [{ type: 'deal' }, { type: 'release' }, { type: 'startRun' }] };
  assert.deepEqual(queueBeforeRelease(queue).moves, [{ type: 'deal' }]);
  assert.deepEqual(queueBeforeRelease({ moves: [{ type: 'deal' }] }).moves, [{ type: 'deal' }]);
});

test('advisors react to the picks', () => {
  const s = withSpec({});
  const waive = releaseOpinions(s, { ...releaseDraft(s), picks: ['waive'] });
  assert.equal(waive.find((o) => o.id === 'safety').mood, 'alarmed');
  const lossy = releaseOpinions(s, { ...releaseDraft(s), reasoning: 'high', price: 'market' });
  // Thinking hard multiplies tokens by 8, so $1.88 per million is charged against $4.80 of serving.
  assert.equal(lossy.find((o) => o.id === 'cfo').mood, 'alarmed');
  assert.match(lossy.find((o) => o.id === 'cfo').text, /lose money/);
});

test('the badge counts all five rows and hides on a first release', () => {
  assert.equal(beatCount({ benchmarks: [{ shown: 50, flagship: null }] }), null);
  const launch = { benchmarks: [
    { shown: 71, flagship: 58 }, { shown: 64, flagship: 55 }, { shown: 48, flagship: 30 },
    { shown: 14, flagship: 15 }, { shown: 88, flagship: 80 },
  ] };
  assert.deepEqual(beatCount(launch), { beaten: 4, of: 5 });
});

test('the safety label names the strongest check picked', () => {
  assert.equal(checkLabel(['fullEval', 'govEval']), 'Government tested');
  assert.equal(checkLabel(['fullEval', 'thirdPartyEval']), 'Third-party checked');
  assert.equal(checkLabel(['fullEval']), 'Internal evals');
  assert.equal(checkLabel(['quickEval']), 'Self-reported');
});

test('the price sheet uses the real serving cost when the sim has it', () => {
  const model = { channel: 'enterprise', priceStance: 'market', spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoning: 'medium', channel: 'enterprise' }, servingCost: 24, activeFromTurn: 5, releasedTurn: 5, newUsers: 1_000_000 };
  const sheet = priceSheet(model, 3); // era 3: 1.5 x 4 x 4 = 24M tokens a user
  assert.equal(sheet.charge, 1.25);
  assert.equal(sheet.serve, 1);
  assert.ok(Math.abs(sheet.margin - 0.2) < 1e-9);
  assert.equal(sheet.live, true);
  assert.ok(Math.abs(priceSheet({ ...model, servingCost: 0, activeFromTurn: 6 }, 3).serve - 0.8) < 1e-9); // light-load formula
  assert.equal(priceSheet({ ...model, servingCost: 0, activeFromTurn: 6 }, 3).live, false);
  assert.deepEqual(priceSheet({ ...model, channel: 'open' }, 3), { open: true });
  assert.equal(salesEstimate(model), 30); // 1M users x $30
});

test('the ready-to-release scenario has a trained model waiting in era 3', () => {
  const s = SCENARIOS.readyToRelease(1);
  assert.ok(s.pendingModel);
  assert.equal(s.era, 3);
  assert.ok(s.models.length >= 1);
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test tests/ui-release.test.js`
Expected: FAIL with "Cannot find module '../ui/logic/release.js'".

- [ ] **Step 3: Implement `ui/logic/release.js`**

```js
import { cardById, pickableCards, resolveCards, slotsFor } from '../../sim/recipe.js';
import { TIER_WORDS, modelName, releaseModel, tierWord } from '../../sim/release.js';
import { createRng } from '../../sim/rng.js';
import { CHANNEL, PRICE_STANCE, REASONING, REVENUE_PER_USER, USAGE, margin, servingCost } from '../../sim/serving.js';
import { projectQueue } from './compute.js';

export const PRICE_STOPS = ['free', 'undercut', 'market', 'premium'];
export const PRICE_NAMES = { premium: 'Premium', market: 'Market', undercut: 'Undercut', free: 'Free tier' };
export const REASONING_STOPS = ['off', 'low', 'medium', 'high'];
export const REASONING_NAMES = { off: 'Off', low: 'Low', medium: 'Medium', high: 'High' };
export const CHANNEL_NAMES = { enterprise: 'API only', consumer: 'Consumer app and API', agent: 'API for agents', open: 'Open weights' };
export const SIZE_ORDER = ['small', 'medium', 'large', 'xl'];

const cardsFor = (state, picks) => resolveCards(state, 'release', picks);
const capitalise = (text = '') => (text ? text[0].toUpperCase() + text.slice(1) : '');

// The spec the release would ship with; mirrors sim/release.js releaseModel.
export function releaseSpec(state, picks, reasoning) {
  const model = state.pendingModel;
  const cards = cardsFor(state, picks);
  const spec = Object.assign({}, model?.spec ?? {}, ...cards.map((card) => card.effects.spec ?? {}));
  spec.reasoning = model?.spec?.reasoningCapable ? reasoning : 'off';
  const flags = new Set([...(model?.flags ?? []), ...cards.flatMap((card) => card.effects.flags ?? [])]);
  if (spec.channel === 'enterprise' && flags.has('agentic')) spec.channel = 'agent';
  return spec;
}

// Millions of tokens one user runs each month (the same product as in sim/serving.js servingCost).
export const tokensPerUser = (spec, era) => USAGE[era - 1] * CHANNEL[spec.channel] * REASONING[spec.reasoning ?? 'off'];

// What a customer pays per million tokens: the monthly revenue per user spread over their tokens.
export function pricePerMillion(spec, era, stance) {
  if (spec.channel === 'open') return null;
  return (REVENUE_PER_USER[spec.channel] * PRICE_STANCE[stance].rev) / tokensPerUser(spec, era);
}

// What serving costs the lab per million tokens at light load.
export function servingPerMillion(spec, era) {
  if (spec.channel === 'open') return null;
  return servingCost(spec, era, 0) / tokensPerUser(spec, era);
}

export const perMillion = (value) => `$${value.toFixed(2)}`;

export function shipDelay(state, picks) {
  return cardsFor(state, picks).reduce((sum, card) => sum + (card.cost.turns ?? 0), state.pendingModel?.releaseDelay ?? 0);
}

export const shipWords = (delay) => (delay === 0 ? 'this turn' : delay === 1 ? 'next turn' : `in ${delay} turns`);

// The picks with this card in its group's place (or added).
export function withCard(picks, card) {
  const next = picks.filter((id) => cardById(id)?.group !== card.group);
  return [...next, card.id];
}

export const canSkip = (state) => state.models.length > 0;
export const nextGeneration = (state, skip) => (state.models.at(-1)?.generation ?? 0) + 1 + (skip && canSkip(state) ? 1 : 0);

export function releaseDraft(state, remembered = {}) {
  const pickable = new Set(pickableCards(state, 'release').map((card) => card.id));
  const picks = [];
  const groups = new Set();
  for (const id of remembered.picks ?? []) {
    const card = cardById(id);
    if (!card || !pickable.has(id) || groups.has(card.group) || picks.length >= slotsFor(state, 'release')) continue;
    picks.push(id);
    groups.add(card.group);
  }
  return {
    picks,
    price: Object.hasOwn(PRICE_STANCE, remembered.price) ? remembered.price : 'market',
    reasoning: REASONING_STOPS.includes(remembered.reasoning) ? remembered.reasoning : 'off',
    family: typeof remembered.family === 'string' ? remembered.family : state.models.at(-1)?.family ?? '',
    skip: remembered.skip === true && canSkip(state),
    tierWords: Object.fromEntries(SIZE_ORDER.map((size) => [
      size,
      typeof remembered.tierWords?.[size] === 'string' ? remembered.tierWords[size] : tierWord(size, state.tierWords),
    ])),
  };
}

export function releasePayload(state, draft) {
  return {
    picks: [...draft.picks],
    price: draft.price,
    reasoning: state.pendingModel?.spec?.reasoningCapable ? draft.reasoning : 'off',
    family: draft.family.trim().slice(0, 24),
    generation: nextGeneration(state, draft.skip),
    tierWords: { ...draft.tierWords },
  };
}

// The queue as it stands before the release: an existing release keeps its place, so only the moves ahead of it count.
export function queueBeforeRelease(queue) {
  const moves = queue?.moves ?? [];
  const index = moves.findIndex((move) => move.type === 'release');
  return { ...(queue ?? {}), moves: index < 0 ? moves : moves.slice(0, index) };
}

export function releasePreview(state, queue, draft) {
  const projected = projectQueue(state, queueBeforeRelease(queue));
  const errors = [];
  if (!draft.family.trim()) errors.push('Type a family name for the model');
  if (!projected.pendingModel) errors.push('There is no finished model to release');
  const payload = releasePayload(projected, draft);
  const cash = cardsFor(projected, draft.picks).reduce((sum, card) => sum + (card.cost.cash ?? 0), 0);
  if (errors.length === 0) {
    const result = releaseModel(structuredClone(projected), payload, createRng(0));
    if (!result.ok) errors.push(capitalise(result.error));
  }
  return {
    ok: errors.length === 0,
    errors,
    cash,
    delay: shipDelay(projected, draft.picks),
    name: modelName({ family: payload.family || '…', generation: payload.generation, size: projected.pendingModel?.size ?? 'medium', tierWords: payload.tierWords }),
  };
}

const SAFETY_LINES = {
  'quick-eval': ['uneasy', 'Quick checks tell us almost nothing about a model this strong. Run the full evals.'],
  'eval-full': ['calm', 'Full evals first. At least we will know what we built.'],
  'eval-third': ['calm', 'An outside evaluator will catch what we miss. Worth the turn.'],
  'eval-gov': ['calm', 'A government test buys goodwill, even if they ask us to wait.'],
  waive: ['alarmed', 'We promised that threshold. Waiving it will not stay quiet.'],
};
const POLICY_LINES = {
  'channel-api': ['calm', 'API only keeps us out of the headlines for now.'],
  'channel-app': ['uneasy', 'Millions of users means millions of screenshots. Be ready.'],
  'channel-open': ['alarmed', 'Open weights have no recall button. Washington will ask about misuse.'],
  'channel-staged': ['calm', 'Staged is gentler: businesses first, the app next turn.'],
};

export function releaseOpinions(state, draft) {
  const cards = cardsFor(state, draft.picks);
  const evalCard = cards.find((card) => card.group === 'eval');
  const channelCard = cards.find((card) => card.group === 'channel');
  const spec = releaseSpec(state, draft.picks, draft.reasoning);
  const price = pricePerMillion(spec, state.era, draft.price);
  const serve = servingPerMillion(spec, state.era);
  const delay = shipDelay(state, draft.picks);
  const [safetyMood, safetyText] = SAFETY_LINES[evalCard?.id] ?? SAFETY_LINES['quick-eval'];
  const [policyMood, policyText] = POLICY_LINES[channelCard?.id] ?? POLICY_LINES['channel-api'];
  let cfo;
  if (price === null) cfo = { mood: 'calm', text: 'Open weights earn nothing directly, and they cost us nothing to serve.' };
  else if (price < serve) cfo = { mood: 'alarmed', text: `At this price we lose money on every token: ${perMillion(price)} in, ${perMillion(serve)} out.` };
  else cfo = { mood: 'calm', text: `We charge ${perMillion(price)} per million tokens and serving costs ${perMillion(serve)}.` };
  return [
    delay > 0
      ? { id: 'research', mood: 'uneasy', text: 'A slower launch gives the rivals a turn. Ship when we can.' }
      : { id: 'research', mood: 'eager', text: 'Ship it this turn. The rivals will not wait.' },
    { id: 'safety', mood: safetyMood, text: safetyText },
    { id: 'cfo', ...cfo },
    { id: 'policy', mood: policyMood, text: policyText },
  ];
}

// Owner pick 5B: all five rows count, safety included; no badge without an earlier flagship.
export function beatCount(launch) {
  const rows = launch?.benchmarks ?? [];
  if (rows.length === 0 || rows.every((row) => row.flagship == null)) return null;
  return { beaten: rows.filter((row) => row.flagship != null && row.shown > row.flagship).length, of: rows.length };
}

export function checkLabel(flags = []) {
  if (flags.includes('govEval')) return 'Government tested';
  if (flags.includes('thirdPartyEval')) return 'Third-party checked';
  if (flags.includes('fullEval')) return 'Internal evals';
  return 'Self-reported';
}

const revenuePerUser = (model) => REVENUE_PER_USER[model.channel] * PRICE_STANCE[model.priceStance].rev * (model.revenueMult ?? 1);

export function priceSheet(model, era) {
  if (model.channel === 'open') return { open: true };
  const spec = { ...model.spec, channel: model.channel };
  const tokens = tokensPerUser(spec, era);
  const revenue = revenuePerUser(model);
  const cost = model.servingCost > 0 ? model.servingCost : servingCost(spec, era, 0);
  return {
    open: false,
    charge: revenue / tokens,
    serve: cost / tokens,
    margin: margin(cost, revenue),
    channel: CHANNEL_NAMES[model.channel],
    thinking: REASONING_NAMES[spec.reasoning ?? 'off'],
    live: model.activeFromTurn <= model.releasedTurn,
  };
}

export const salesEstimate = (model) => (model.channel === 'open' ? 0 : (model.newUsers * revenuePerUser(model)) / 1e6);

// The flagship this launch was compared with: the earlier model whose score set the bar.
export const flagshipBefore = (state, model) => state.models.find((other) => other.releaseSequence !== model.releaseSequence && other.launchScore === model.bar);
```

Note on `REVENUE_PER_USER`: it has no `open` key; `priceSheet` and `salesEstimate` return before using it for open weights.

- [ ] **Step 4: Add the scenario**

In `ui/logic/scenarios.js`, below `const midEra3 = ...`, add:

```js
// An era-3 state with a trained model waiting to be released (for the release dialog and reveal screenshots).
function readyToRelease(seed) {
  const rng = createRng(seed + 1000);
  let state = midEra3(seed);
  for (let guard = 0; guard < 8 && state.activeRun && !state.ending; guard += 1) {
    ({ state } = endTurn(state, { ...scriptedActions(state), moves: [] }, rng));
  }
  return state;
}
```

and add `readyToRelease,` to the `SCENARIOS` object (after `release: releaseState,`). Seeds 1 and 2 reach a pending model in era 3 at turn 9 (checked 2026-09-26 with empty-move turns); seeds 3 and 4 end the run first, so screenshots use seed 1 (the `tools/shot.sh` default).

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: all PASS. If the scenario test fails, print `SCENARIOS.readyToRelease(1)` fields (`era`, `turn`, `activeRun`, `pendingModel`, `ending`) and adjust the loop guard, not the test.

- [ ] **Step 6: Commit**

```bash
git add ui/logic/release.js ui/logic/scenarios.js tests/ui-release.test.js
git commit -m "feat(ui): release helpers (per-token prices, draft, preview, opinions, badge) and a ready-to-release scenario"
```

---

### Task 3: The release dialog

**Files:**
- Modify: `ui/screens/recipe.js` (export `techniquePanel`; `cardNote` option; three group names)
- Create: `ui/screens/release.js`
- Modify: `ui/menu.js` (keep "Release a model" open while a release is queued, so it can be changed)
- Modify: `ui/main.js` (mount, debug routes)
- Modify: `ui/styles.css` (append the release block)

**Interfaces:**
- Consumes: everything Task 2 exports; `queuedMoveProblem(state, queue) → ''|error` from `ui/logic/actions.js` (already in the repo; it projects the queue move by move and reports the first queued training run, deal or order that would fail); `openDialog` (`ui/components/dialog.js`); `teamPanel(state, { opinions })` (`ui/components/team.js`); `vslider` (`ui/components/vslider.js`); `techniquePanel` (`ui/screens/recipe.js`); `money` (`ui/logic/format.js`); `registerMenuHandler` (`ui/menu.js`).
- Produces: `openRelease(game, overlayRoot, { stage } = {})` and `mountRelease(game, overlayRoot)` from `ui/screens/release.js`; OK queues `{ type: 'release', release }` (replacing a release already queued this turn).

- [ ] **Step 1: Export the card picker from the recipe screen**

In `ui/screens/recipe.js`:
- add to `GROUP_NAMES`: `eval: 'How you check it', channel: 'Who gets it', precision: 'Serving',`
- change `function techniquePanel(state, stage, draft, onChange)` to `export function techniquePanel(state, stage, draft, onChange, { cardNote } = {})`
- inside the card loop, after `button.append(main, hint);`, add:

```js
      const note = cardNote?.(card);
      if (note) {
        const chip = document.createElement('span');
        chip.className = `release-ship ${note.later ? 'later' : 'now'}`;
        chip.textContent = note.text;
        button.append(chip);
      }
```

Default cards (`quick-eval`, `channel-api`) are not pickable, so the panel shows them only as an "If none: …" line, and owner pick 2A wants a ship chip on Quick internal checks too. In the same function, right after `section.append(defaultLine);` (inside `if (fallback)`), add:

```js
      const fallbackNote = cardNote?.(fallback);
      if (fallbackNote) {
        const chip = document.createElement('span');
        chip.className = `release-ship ${fallbackNote.later ? 'later' : 'now'}`;
        chip.textContent = fallbackNote.text;
        defaultLine.append(' ', chip);
      }
```

(This is the one visible departure from the mockup, which drew Quick internal checks as a full card: in the game it stays the "If none" line, now with its chip.)

Run `npm test` (the recipe tests must still pass) and `sh tools/shot.sh midEra3 '#recipe3'` (the recipe screen must look unchanged).

- [ ] **Step 2: Create `ui/screens/release.js`**

```js
import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { vslider } from '../components/vslider.js';
import { queuedMoveProblem } from '../logic/actions.js';
import { projectQueue } from '../logic/compute.js';
import { money } from '../logic/format.js';
import {
  PRICE_NAMES, PRICE_STOPS, REASONING_NAMES, REASONING_STOPS, SIZE_ORDER,
  canSkip, nextGeneration, perMillion, pricePerMillion, releaseDraft, releaseOpinions,
  queueBeforeRelease, releasePayload, releasePreview, releaseSpec, shipDelay, shipWords, withCard,
} from '../logic/release.js';
import { tierWord } from '../../sim/release.js';
import { registerMenuHandler } from '../menu.js';
import { techniquePanel } from './recipe.js';

const remembered = new WeakMap();
const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'Extra large' };

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

export function openRelease(game, overlayRoot, { stage } = {}) {
  const projected = () => projectQueue(game.state, queueBeforeRelease(game.queue));
  let draft = releaseDraft(projected(), remembered.get(game));
  let opened;

  function showSizes() {
    const body = el('div', 'release-sizes');
    body.append(el('p', 'release-note', 'You name these once. Every model takes one from its size, like Kestrel 4 Core.'));
    const inputs = {};
    for (const size of SIZE_ORDER) {
      const label = el('label', 'release-size');
      label.append(el('span', 'lbl', SIZE_LABELS[size]));
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `release-size-${size}`;
      input.maxLength = 16;
      input.value = draft.tierWords[size];
      label.append(input);
      inputs[size] = input;
      body.append(label);
    }
    opened = openDialog(overlayRoot, {
      title: 'Name your model sizes',
      subtitle: 'Small, medium, large and extra large models each get a word',
      body,
      okLabel: 'Save sizes',
      onOk() {
        for (const size of SIZE_ORDER) draft.tierWords[size] = inputs[size].value.trim() || tierWord(size);
        showMain();
      },
    });
    opened.classList.add('release-dialog', 'release-dialog-sizes');
  }

  function showMain() {
    const state = projected();
    const model = state.pendingModel;
    const body = el('div', 'release-body');
    const leftContent = el('div');
    const rightContent = el('div');

    // Name: family (typed), number (automatic), size word (from the model's size).
    body.append(el('div', 'lbl release-heading', 'Name'));
    const nameRow = el('div', 'release-name');
    const familyField = el('label', 'release-field');
    familyField.append(el('span', 'lbl', 'Family (you type it)'));
    const family = document.createElement('input');
    family.type = 'text';
    family.id = 'release-family';
    family.maxLength = 24;
    family.placeholder = 'Type a family name';
    family.value = draft.family;
    familyField.append(family);
    const numberField = el('div', 'release-field');
    numberField.append(el('span', 'lbl', 'Number'));
    const number = el('div', 'release-auto');
    numberField.append(number);
    const sizeField = el('div', 'release-field');
    sizeField.append(el('span', 'lbl', 'Size'));
    sizeField.append(el('div', 'release-auto', draft.tierWords[model?.size ?? 'medium']));
    nameRow.append(familyField, numberField, sizeField);

    const skipLabel = el('label', 'release-skip');
    const skip = document.createElement('input');
    skip.type = 'checkbox';
    skip.id = 'release-skip';
    skip.checked = draft.skip;
    skip.disabled = !canSkip(state);
    skipLabel.append(skip, el('span', null, 'Skip ahead a number'));
    const skipWarning = el('span', 'release-skip-warning', '· critics expect a bigger leap, and the feed will talk about it');
    skipLabel.append(skipWarning);

    const preview = el('div', 'release-preview');
    const previewName = el('b');
    const rename = el('button', 'release-link', 'Rename sizes');
    rename.type = 'button';
    rename.addEventListener('click', () => showSizes());
    preview.append('It will ship as ', previewName, ' · ', rename);
    body.append(nameRow, skipLabel, preview, el('div', 'rule'));

    // Price and thinking effort sliders.
    const sliders = el('div', 'release-sliders');
    const priceSlot = el('div');
    const thinkingSlot = el('div');
    sliders.append(priceSlot, thinkingSlot);
    body.append(sliders);

    const shipLine = el('div', 'release-shipline');
    const error = el('div', 'dialog-error release-error');
    error.setAttribute('role', 'alert');
    body.append(shipLine, error);

    const priceSlider = () => {
      const spec = releaseSpec(state, draft.picks, draft.reasoning);
      return vslider({
        label: 'Price',
        role: 'CFO',
        value: PRICE_STOPS.indexOf(draft.price),
        min: 0,
        max: PRICE_STOPS.length - 1,
        step: 1,
        colour: 'wood',
        formatValue: (value) => PRICE_NAMES[PRICE_STOPS[value]],
        ariaValueText: (value) => PRICE_NAMES[PRICE_STOPS[value]],
        notches: PRICE_STOPS.map((stop, index) => {
          const price = pricePerMillion(spec, state.era, stop);
          return {
            value: index,
            label: PRICE_NAMES[stop],
            detail: stop === 'free' ? 'ads and upgrades' : price === null ? 'free download' : `${perMillion(price)} per M tokens`,
          };
        }),
        onInput(value) {
          draft.price = PRICE_STOPS[value];
          refresh();
        },
      });
    };

    const thinkingSlider = () => {
      if (!model?.spec?.reasoningCapable) return el('p', 'release-note', 'This model cannot think longer. Train with reasoning RL to unlock thinking effort.');
      return vslider({
        label: 'Thinking effort',
        role: 'Head of Research',
        value: REASONING_STOPS.indexOf(draft.reasoning),
        min: 0,
        max: REASONING_STOPS.length - 1,
        step: 1,
        colour: 'coral',
        formatValue: (value) => REASONING_NAMES[REASONING_STOPS[value]],
        ariaValueText: (value) => REASONING_NAMES[REASONING_STOPS[value]],
        notches: REASONING_STOPS.map((stop, index) => ({ value: index, label: REASONING_NAMES[stop] })),
        onInput(value) {
          draft.reasoning = REASONING_STOPS[value];
          priceSlot.replaceChildren(priceSlider()); // per-token prices depend on thinking effort
          refresh();
        },
      });
    };

    function refresh() {
      const now = projected();
      const check = releasePreview(game.state, game.queue, draft);
      number.textContent = `${nextGeneration(now, draft.skip)}`;
      number.classList.toggle('skipped', draft.skip);
      skipWarning.hidden = !draft.skip;
      previewName.textContent = check.name;
      shipLine.replaceChildren(
        el('span', null, `Ships ${shipWords(check.delay)}`),
        el('span', null, `${check.cash > 0 ? `Costs ${money(check.cash)}` : 'No cash cost'} · uses 1 of your 2 moves`),
      );
      error.textContent = check.errors[0] ?? '';
      leftContent.replaceChildren(teamPanel(now, { opinions: releaseOpinions(now, draft) }));
      rightContent.replaceChildren(techniquePanel(now, 'release', { picks: { release: draft.picks } }, (picks) => {
        draft.picks = picks;
        priceSlot.replaceChildren(priceSlider()); // the channel changes per-token prices
        refresh();
      }, {
        cardNote: (card) => (card.group === 'eval'
          ? { text: `Ships ${shipWords(shipDelay(now, withCard(draft.picks, card)))}`, later: shipDelay(now, withCard(draft.picks, card)) > 0 }
          : null),
      }));
      const ok = opened?.querySelector('.dialog-ok');
      if (ok) ok.textContent = `Release ${check.name}`;
    }

    family.addEventListener('input', () => {
      draft.family = family.value;
      refresh();
    });
    skip.addEventListener('change', () => {
      draft.skip = skip.checked;
      refresh();
    });

    priceSlot.append(priceSlider());
    thinkingSlot.append(thinkingSlider());

    opened = openDialog(overlayRoot, {
      title: 'Release a model',
      subtitle: `Trained in era ${state.era} · ${model?.spec?.reasoningCapable ? 'a reasoning model' : 'a standard model'}`,
      left: { title: 'Team', content: leftContent },
      right: { title: 'Release choices', content: rightContent },
      body,
      okLabel: 'Release',
      onOk() {
        const check = releasePreview(game.state, game.queue, draft);
        if (!check.ok) {
          error.textContent = check.errors[0];
          return;
        }
        const move = { type: 'release', release: releasePayload(projected(), draft) };
        const moves = game.queue.moves.map((queued) => structuredClone(queued));
        const index = moves.findIndex((queued) => queued.type === 'release');
        // Check the whole queue as it would be, so a changed release cannot silently break a later move
        // (for example a training run that no longer fits the cash left after a pricier evaluation).
        const after = { ...game.queue, moves: index < 0 ? [...moves, move] : moves.map((queued, at) => (at === index ? move : queued)) };
        const problem = queuedMoveProblem(game.state, after);
        if (problem) {
          error.textContent = problem[0].toUpperCase() + problem.slice(1);
          return;
        }
        let result;
        if (index < 0) result = game.addMove(move);
        else {
          // Replace the queued release in place: a training run queued after it depends on it.
          for (let at = moves.length - 1; at >= index; at -= 1) game.removeMove(at);
          result = game.addMove(move);
          const rest = result.ok ? moves.slice(index + 1) : moves.slice(index);
          for (const queued of rest) game.addMove(queued);
        }
        if (!result.ok) {
          error.textContent = result.error[0].toUpperCase() + result.error.slice(1);
          return;
        }
        remembered.set(game, structuredClone(draft));
        opened.close();
      },
    });
    opened.classList.add('release-dialog');
    refresh();
    family.focus();
  }

  if (stage === 'sizes' || (stage !== 'main' && !game.state.tierWords)) showSizes();
  else showMain();
  return opened;
}

export function mountRelease(game, overlayRoot) {
  return registerMenuHandler('release', () => openRelease(game, overlayRoot));
}
```

- [ ] **Step 2b: Let the player reopen a queued release from the menu (`ui/menu.js`)**

The menu judges items against the projected queue, where a queued release has already used up `pendingModel`, and it disables every non-free item once both moves are queued. Both would lock the player out of changing a release they already queued. Change the `release` entry in `ITEMS` to:

```js
  { id: 'release', label: 'Release a model', editsQueued: (game) => game.queue.moves.some((move) => move.type === 'release'), unavailable: (state, game) => !game.queue.moves.some((move) => move.type === 'release') && !state.pendingModel && 'Release needs a finished model' },
```

and in `disabledReason`, change the move-limit line to:

```js
  if (!item.free && game.movesLeft() === 0 && !item.editsQueued?.(game)) return 'Both moves are used this turn';
```

(Changing a queued release replaces it in place and uses no extra move.)

- [ ] **Step 3: Mount it and add debug routes in `ui/main.js`**

Add the import `import { mountRelease, openRelease } from './screens/release.js';`, call `mountRelease(game, overlay);` after `mountRecipe(game, overlay);`, and in `openDebugRoute` before the `#budget` route:

```js
  if (location.hash === '#release' || location.hash === '#sizes') {
    if (game.state.pendingModel) openRelease(game, overlay, { stage: location.hash === '#sizes' ? 'sizes' : 'main' });
    return;
  }
```

- [ ] **Step 4: Append the styles to `ui/styles.css`**

```css
/* ---------- release dialog (plan 2B Task 6, docs/design/mockups/release-flow-final.html) ---------- */
.release-dialog .dialog-centre { width: 656px; }
.release-heading { text-align: center; }
.release-name { display: flex; justify-content: center; align-items: flex-end; gap: 10px; margin-top: 10px; }
.release-field { display: grid; gap: 4px; text-align: left; }
.release-field .lbl, .release-size .lbl { font-size: 10.5px; }
.release-field input, .release-size input {
  height: 42px; min-width: 170px; border-radius: 8px; border: 2px solid var(--wood); background: var(--paper);
  padding: 0 12px; font: 800 19px/1 Nunito, "Trebuchet MS", sans-serif; color: var(--ink);
}
.release-field input:focus-visible, .release-size input:focus-visible { outline: 3px solid var(--sky); outline-offset: 1px; }
.release-auto {
  height: 42px; display: flex; align-items: center; padding: 0 14px; border-radius: 8px; font-size: 19px; font-weight: 800;
  background: color-mix(in oklab, var(--ink) 7%, var(--paper)); color: color-mix(in oklab, var(--ink) 70%, var(--paper));
}
.release-auto.skipped { background: color-mix(in oklab, var(--wood) 18%, var(--paper)); color: var(--ink); }
.release-skip { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 10px; font-size: 13.5px; font-weight: 800; }
.release-skip-warning { color: color-mix(in oklab, var(--coral) 75%, var(--ink)); }
.release-preview { margin-top: 4px; font-size: 15px; font-weight: 700; }
.release-preview b { font-size: 22px; font-weight: 900; }
.release-link { border: 0; background: none; padding: 0; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer;
  color: color-mix(in oklab, var(--sky) 75%, var(--ink)); text-decoration: underline; text-underline-offset: 3px; }
.release-sliders { display: flex; justify-content: center; gap: 40px; align-items: flex-start; }
.release-shipline { display: flex; justify-content: space-between; margin-top: 14px; padding: 10px 12px; font-size: 14px; font-weight: 800;
  border-block: 1.5px solid color-mix(in oklab, var(--wood) 30%, transparent); }
.release-note { font-size: 13px; font-weight: 700; color: color-mix(in oklab, var(--ink) 60%, var(--paper)); max-width: 200px; }
.release-ship { justify-self: start; font-size: 10.5px; font-weight: 900; border-radius: 4px; padding: 1px 6px; margin-top: 3px; }
.release-ship.now { background: color-mix(in oklab, var(--teal) 18%, var(--paper)); color: color-mix(in oklab, var(--teal) 60%, var(--ink)); }
.release-ship.later { background: color-mix(in oklab, var(--coral) 14%, var(--paper)); color: color-mix(in oklab, var(--coral) 75%, var(--ink)); }
.release-sizes { display: grid; gap: 10px; justify-items: center; }
.release-size { display: grid; grid-template-columns: 110px 220px; align-items: center; gap: 12px; text-align: left; }
```

- [ ] **Step 5: Test and look**

Run: `npm test` — expected PASS.
Run: `sh tools/shot.sh readyToRelease '#release'` and `sh tools/shot.sh readyToRelease '#sizes'`.
Open `shots/readyToRelease#release.png` beside `docs/design/mockups/release-flow-final-dialog.png`. Check: the Team panel shows four opinions with mood chips; the right panel shows "How you check it" and "Who gets it" with Ships chips on the evaluation cards; the price slider has four stops with per-token prices (for seed 1's medium model on API only at the default Off thinking: $7.50 / $5.00 / $2.50 per M tokens and "ads and upgrades"; drag thinking to Medium and they become $1.88 / $1.25 / $0.63, as in the mockup); the name row, skip box and preview line; the ship line; the OK button reads "Release <name>". Fix differences and re-shoot (up to three rounds). Check the 1000×700 shot for clipping.
In the browser (`python3 -m http.server` from the repo root, then `index.html?scenario=readyToRelease&seed=1#release`), click an evaluation card, the channel cards, the skip box, type a family, drag both sliders, and press Release; then check `game.queue.moves` in the console holds one `release` move. Queue a training run after it (or any second move), open the floor menu again, and check "Release a model" is still enabled; change the evaluation card, press Release, and check the queue still holds the release first and the run second, and that picking an evaluation the queued run can no longer afford shows an error instead of changing the queue.

- [ ] **Step 6: Commit**

```bash
git add ui/screens/recipe.js ui/screens/release.js ui/menu.js ui/main.js ui/styles.css
git commit -m "feat(ui): release dialog with advisor opinions, ship-date chips, per-token price slider and version skipping"
```

---

### Task 4: The reveal

**Files:**
- Create: `ui/screens/reveal.js`
- Modify: `ui/main.js` (mount, `#reveal` route)
- Modify: `ui/styles.css` (append the reveal block)

**Interfaces:**
- Consumes: `beatCount`, `checkLabel`, `priceSheet`, `salesEstimate`, `flagshipBefore`, `perMillion`, `releaseDraft`, `releasePayload` (Task 2); `money`, `users`, `pct` (`ui/logic/format.js`); the `release` event `{ type: 'release', ok: true, model, hazardIgnored, misalignmentIncident? }` from `game.endTurn()`.
- Produces: `showReveal(overlayRoot, { state, model, misalignmentIncident })`, `mountReveal(game, overlayRoot)` from `ui/screens/reveal.js`.

- [ ] **Step 1: Create `ui/screens/reveal.js`**

```js
import { money, pct, users } from '../logic/format.js';
import { beatCount, checkLabel, flagshipBefore, perMillion, priceSheet, salesEstimate } from '../logic/release.js';

const AVATAR_TOKENS = ['ink', 'teal', 'sky', 'wood', 'coral'];
let nextRevealId = 0;

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const shortName = (model) => `${model.family} ${model.generation}`;

function bar(label, value, kind, mark, me = false) {
  const row = el('div', `reveal-bar${me ? ' me' : ''}`);
  const track = el('span', 'reveal-track');
  const fill = el('i', `reveal-fill ${kind}`);
  fill.style.width = `${value}%`;
  track.append(fill);
  if (mark != null) {
    const tick = el('span', 'reveal-mark');
    tick.style.left = `${mark}%`;
    track.append(tick);
  }
  row.append(el('span', 'reveal-bar-label', label), track, el('span', 'reveal-bar-value', `${value}`));
  return row;
}

function benchmarks(state, model) {
  const root = el('div', 'reveal-col');
  const flagship = flagshipBefore(state, model);
  const lastName = flagship ? shortName(flagship) : 'Last flagship';
  root.append(el('div', 'sec', 'Benchmarks'));
  const legend = el('div', 'reveal-legend');
  for (const [kind, text] of [['k-new', shortName(model)], ['k-last', `${lastName} (last flagship)`], ['k-rival', 'Best rival']]) {
    const item = el('span');
    item.append(el('i', `reveal-swatch ${kind}`), text);
    legend.append(item);
  }
  root.append(legend);
  for (const row of model.launch.benchmarks) {
    const block = el('div', 'reveal-bench');
    const head = el('div', 'reveal-bench-name');
    const title = el('span', null, row.name);
    if (row.kind === 'safety') title.append(el('span', 'reveal-check', checkLabel(model.flags)));
    head.append(title);
    if (row.flagship != null) {
      const delta = row.shown - row.flagship;
      head.append(el('em', delta < 0 ? 'down' : '', `${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta)}`));
    }
    block.append(head, bar(shortName(model), row.shown, 'k-new', row.flagship, true));
    if (row.flagship != null) block.append(bar(lastName, row.flagship, 'k-last'));
    block.append(bar('Best rival', row.rival, 'k-rival'));
    root.append(block);
  }
  return root;
}

function press(model) {
  const root = el('div', 'reveal-col');
  root.append(el('div', 'sec', 'Press'));
  for (const critic of model.launch.press) {
    const card = el('div', 'reveal-critic');
    const score = el('div', 'reveal-score', `${critic.score}`);
    score.append(el('small', null, '/10'));
    card.append(el('div', 'reveal-critic-name', critic.name), score, el('div', 'reveal-quip', `"${critic.quip}"`));
    root.append(card);
  }
  return root;
}

function reactions(state, model, misalignmentIncident) {
  const root = el('div', 'reveal-col');
  root.append(el('div', 'sec', 'Reactions'));
  const posts = [...model.launch.reactions];
  if (misalignmentIncident) {
    const warning = state.feed.findLast((post) => post.tag === 'warning');
    if (warning) posts.unshift({ handle: warning.handle, text: warning.text, warning: true });
  }
  posts.slice(0, 5).forEach((post, index) => {
    const row = el('div', `reveal-post${post.warning ? ' warning' : ''}`);
    const avatar = el('div', 'reveal-avatar', post.handle.replace('@', '')[0].toUpperCase());
    avatar.style.background = `var(--${post.warning ? 'coral' : AVATAR_TOKENS[index % AVATAR_TOKENS.length]})`;
    const text = el('div');
    text.append(el('div', 'reveal-handle', post.handle), el('div', 'reveal-text', post.text));
    row.append(avatar, text);
    root.append(row);
  });
  return root;
}

function sheet(model, era) {
  const data = priceSheet(model, era);
  const root = el('div', 'reveal-sheet');
  if (data.open) {
    const cell = el('span');
    cell.append(el('small', null, 'Open weights'), el('b', null, 'Free download'), el('small', null, "you don't serve it"));
    root.append(cell);
    return root;
  }
  const cells = [
    ['You charge', perMillion(data.charge), 'per million tokens'],
    ['Serving costs you', perMillion(data.serve), data.live ? 'per million tokens' : 'per million tokens, from next turn'],
    ['Margin', pct(data.margin), `${data.channel} · thinking ${data.thinking}`],
  ];
  for (const [label, value, note] of cells) {
    const cell = el('span');
    const number = el('b', label === 'Margin' ? (data.margin < 0 ? 'loss' : 'good') : '', value);
    cell.append(el('small', null, label), number, el('small', null, note));
    root.append(cell);
  }
  return root;
}

export function showReveal(overlayRoot, { state, model, misalignmentIncident = false, onClose }) {
  const layer = el('div', 'dialog-layer reveal-layer');
  const titleId = `reveal-title-${++nextRevealId}`;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', titleId);
  const veil = el('div', 'dialog-veil');
  veil.setAttribute('aria-hidden', 'true');
  const panel = el('section', 'gp rel reveal reveal-play');
  panel.tabIndex = -1;

  const top = el('div', 'reveal-top');
  const heading = el('div');
  const title = el('h1', null, `${model.name} is out`);
  title.id = titleId;
  heading.append(el('div', 'reveal-kick', 'Model release'), title);
  const side = el('div', 'reveal-side');
  const count = beatCount(model.launch);
  if (count) {
    const badge = el('div', 'reveal-beat');
    badge.append(el('span', 'up'), `Beats your last flagship on ${count.beaten} of ${count.of} benchmarks`);
    side.append(badge);
  }
  side.append(sheet(model, state.era));
  top.append(heading, side);

  const cols = el('div', 'reveal-cols');
  cols.append(benchmarks(state, model), press(model), reactions(state, model, misalignmentIncident));

  const foot = el('div', 'reveal-foot');
  const usersLine = el('div', 'reveal-users');
  usersLine.append('New users this month: ', el('b', null, `+${users(model.newUsers)}`));
  const left = el('div');
  left.append(usersLine);
  const sales = salesEstimate(model);
  if (sales > 0) {
    const estimate = el('div', 'reveal-estimate');
    estimate.append('About ', el('b', null, `${money(sales)} a month`), ' in sales (estimate)');
    left.append(estimate);
  }
  const done = el('button', 'btn reveal-continue', 'Continue');
  done.type = 'button';
  foot.append(left, done);

  panel.append(top, cols, foot);
  layer.append(veil, panel);

  // Owner pick 4B: the build-up runs about four seconds; any click or key during it jumps to the end.
  let finished = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timer = setTimeout(() => { finished = true; }, 4500);
  const finish = () => {
    finished = true;
    panel.classList.add('reveal-skip');
  };
  const close = () => {
    clearTimeout(timer);
    layer.remove();
    overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
    onClose?.();
  };
  // Capture phase, so a click on Continue or the veil during the build-up only skips.
  layer.addEventListener('click', (event) => {
    if (!finished) {
      event.preventDefault();
      event.stopPropagation();
      finish();
      return;
    }
    if (event.target === done) close();
  }, true);
  layer.addEventListener('keydown', (event) => {
    if (!finished) {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      done.focus();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  });

  overlayRoot.append(layer);
  // The shared dialog CSS keeps .dialog-layer at opacity 0 until .dialog-open is added (ui/styles.css).
  requestAnimationFrame(() => layer.classList.add('dialog-open'));
  done.focus();
  return layer;
}

export function mountReveal(game, overlayRoot) {
  return game.subscribe(({ state, events }) => {
    const release = events.find((event) => event.type === 'release' && event.ok);
    if (!release) return;
    showReveal(overlayRoot, { state, model: release.model, misalignmentIncident: Boolean(release.misalignmentIncident) });
  });
}
```

`mountTurnSummary` waits for `gdt-dialog-closed` whenever a `.dialog-layer` is open, so the turn summary appears after Continue without further code. The reveal layer is appended synchronously inside the subscriber, before the summary's `requestAnimationFrame` check runs.

- [ ] **Step 2: Mount it and add the `#reveal` route in `ui/main.js`**

Add `import { mountReveal } from './screens/reveal.js';` and `import { releaseDraft, releasePayload } from './logic/release.js';`, call `mountReveal(game, overlay);` after `mountRelease(game, overlay);`, and add before the `#budget` route:

```js
  if (location.hash === '#reveal') {
    if (!game.state.pendingModel) return;
    const draft = { ...releaseDraft(game.state), family: 'Kestrel', picks: ['eval-full'], reasoning: 'medium' };
    game.addMove({ type: 'release', release: releasePayload(game.state, draft) });
    game.endTurn();
    return;
  }
```

- [ ] **Step 3: Append the styles to `ui/styles.css`**

Copy the reveal rules from `docs/design/mockups/K2-gdt-polished.html` (the `/* release reveal */` block) and `docs/design/mockups/release-flow-final.html` (`.k2 .sheet`, `.k2 .bm .n .who`, `.k2 .foot .est` and the `anim-b` keyframes), renamed to the `reveal-*` classes above. The block must contain at least:

```css
/* ---------- release reveal (plan 2B Task 6, K2 #release + docs/design/mockups/release-flow-final.html) ---------- */
.reveal-layer .reveal { position: absolute; left: 188px; top: 100px; width: 1064px; height: 700px; padding: 0; }
.reveal-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 16px 26px 12px;
  border-bottom: 2px solid color-mix(in oklab, var(--wood) 35%, transparent); }
.reveal-top h1 { margin: 0; font-weight: 300; font-size: 38px; line-height: 1; }
.reveal-kick { font-size: 12px; font-weight: 800; color: color-mix(in oklab, var(--wood) 60%, var(--ink)); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
.reveal-side { display: grid; gap: 8px; justify-items: end; }
.reveal-beat { display: flex; align-items: center; gap: 8px; white-space: nowrap; font-weight: 900; font-size: 13.5px; padding: 7px 12px; border-radius: 10px;
  background: color-mix(in oklab, var(--teal) 16%, var(--paper)); border: 1.5px solid var(--teal); color: color-mix(in oklab, var(--teal) 60%, var(--ink)); }
.reveal-beat .up { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 9px solid var(--teal); }
.reveal-sheet { display: flex; background: var(--paper); border: 1.5px solid color-mix(in oklab, var(--ink) 12%, transparent); border-radius: 10px; overflow: hidden; }
.reveal-sheet span { display: grid; padding: 6px 12px; text-align: left; }
.reveal-sheet span + span { border-left: 1.5px solid color-mix(in oklab, var(--ink) 10%, transparent); }
.reveal-sheet small { font-size: 10.5px; font-weight: 800; color: color-mix(in oklab, var(--ink) 55%, var(--paper)); }
.reveal-sheet b { font-size: 18px; font-weight: 900; line-height: 1.15; }
.reveal-sheet b.good { color: color-mix(in oklab, var(--teal) 70%, var(--ink)); }
.reveal-sheet b.loss { color: color-mix(in oklab, var(--coral) 75%, var(--ink)); }
.reveal-cols { display: grid; grid-template-columns: 468px 1fr 262px; gap: 20px; padding: 10px 26px 0; }
.reveal-check { margin-left: 6px; font-size: 10.5px; font-weight: 900; border-radius: 5px; padding: 1px 7px;
  background: color-mix(in oklab, var(--wood) 20%, var(--paper)); color: color-mix(in oklab, var(--wood) 50%, var(--ink)); }
.reveal-foot { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; align-items: center; gap: 14px;
  padding: 14px 26px 16px; border-top: 2px solid color-mix(in oklab, var(--wood) 35%, transparent); }
.reveal-users { font-size: 16px; font-weight: 700; }
.reveal-users b { font-size: 22px; font-weight: 900; color: color-mix(in oklab, var(--teal) 70%, var(--ink)); }
.reveal-estimate { font-size: 14px; font-weight: 700; color: color-mix(in oklab, var(--ink) 65%, var(--paper)); }
.reveal-estimate b { color: var(--ink); font-weight: 900; }
.reveal-post.warning .reveal-text { color: color-mix(in oklab, var(--coral) 75%, var(--ink)); font-weight: 800; }

@keyframes reveal-grow { from { transform: scaleX(0); } }
@keyframes reveal-rise { from { opacity: 0; transform: translateY(8px); } }
@keyframes reveal-lit { from { filter: grayscale(1); opacity: .45; } }
.reveal-fill { transform-origin: 0 50%; }
.reveal-play .reveal-bar.me .reveal-fill { animation: reveal-grow .45s ease-out both; }
.reveal-play .reveal-bench:nth-of-type(4) .reveal-fill { animation-delay: .25s; }
.reveal-play .reveal-bench:nth-of-type(5) .reveal-fill { animation-delay: .5s; }
.reveal-play .reveal-bench:nth-of-type(6) .reveal-fill { animation-delay: .75s; }
.reveal-play .reveal-bench:nth-of-type(7) .reveal-fill { animation-delay: 1s; }
.reveal-play .reveal-beat { animation: reveal-rise .3s ease-out 1.3s both; }
.reveal-play .reveal-critic { animation: reveal-rise .35s ease-out both; }
.reveal-play .reveal-critic:nth-of-type(2) { animation-delay: 1.6s; }
.reveal-play .reveal-critic:nth-of-type(3) { animation-delay: 2s; }
.reveal-play .reveal-critic:nth-of-type(4) { animation-delay: 2.4s; }
.reveal-play .reveal-critic:nth-of-type(5) { animation-delay: 2.8s; }
.reveal-play .reveal-post { animation: reveal-rise .3s ease-out both; }
.reveal-play .reveal-post:nth-of-type(2) { animation-delay: 3.2s; }
.reveal-play .reveal-post:nth-of-type(3) { animation-delay: 3.4s; }
.reveal-play .reveal-post:nth-of-type(4) { animation-delay: 3.6s; }
.reveal-play .reveal-post:nth-of-type(5) { animation-delay: 3.8s; }
.reveal-play .reveal-post:nth-of-type(6) { animation-delay: 4s; }
.reveal-play .reveal-continue { animation: reveal-lit .3s ease-out 4.2s both; }
.reveal-skip *, .reveal-skip { animation: none !important; }
@media (prefers-reduced-motion: reduce) { .reveal * { animation: none !important; } }
```

`:nth-of-type` counts every `div` among the siblings, so the numbers above already skip the column's own labels: in the benchmarks column the `.sec` label is div 1 and the legend div 2, so the five benchmark blocks are divs 3–7 (the first bar has no delay); in the press and reactions columns the `.sec` label is div 1, so critics are 2–5 and posts 2–6. If you change the markup in `reveal.js`, recount.
Then port the remaining K2 reveal rules (legend swatches `k-new` coral, `k-last` outlined wood, `k-rival` striped sky; bench rows; the dashed last-flagship mark; critic cards with the round score; post rows with avatars) from `K2-gdt-polished.html` lines 133–171, renaming classes to the ones `reveal.js` emits.

- [ ] **Step 4: Test and look**

Run: `npm test` — expected PASS.
Run: `sh tools/shot.sh readyToRelease '#reveal'` and compare `shots/readyToRelease#reveal.png` with `docs/design/mockups/release-flow-final-reveal.png`. The headless shot is taken after 1.2 s of virtual time, so it shows the build-up mid-way; also take a settled shot by adding `--virtual-time-budget=6000` to a manual Chrome call, or temporarily add `reveal-skip` in the console. Check: the title, the badge (hidden if this is the first release; for seed 1 there are earlier models), the price sheet (three cells, or the open-weights cell), five benchmark rows with the "Internal evals" label on the safety row, four critics, up to five posts, the footer with users and the sales estimate, Continue.
In the browser, check: the reveal is visible (not stuck at opacity 0); the build-up runs in about four seconds; during it, a click anywhere (veil, panel or Continue) or any key, Enter included, jumps to the end without closing; after that, Continue, Enter or Escape closes the reveal and the turn summary toast appears; with the OS set to reduced motion nothing animates and the first Continue closes.

- [ ] **Step 5: Commit**

```bash
git add ui/screens/reveal.js ui/main.js ui/styles.css
git commit -m "feat(ui): release reveal with the four-second build-up, 4-of-5 badge, per-token price sheet and who-checked label"
```

---

### Task 5: Integration and review

**Files:**
- Possibly modify: `ui/screens/release.js` (queue check), `docs/research/release-flow/suggestions-2026-09-26.md` (record anything that changed)

- [ ] **Step 1: The compute lane's queue check.** Task 3 already guards the release edit with the existing `queuedMoveProblem`. The compute lane's in-flight `compute-ui-fix2` adds `queueChangeProblem(state, before, after)`, which also catches moves that were valid before the edit and fail after it. Run `grep -n "queueChangeProblem" ui/logic/actions.js`. If it exists on the branch you are building on, switch `ui/screens/release.js` to it: change the import to `import { queueChangeProblem } from '../logic/actions.js';` and replace the check in `onOk` with

```js
        const problem = queueChangeProblem(game.state, game.queue, after);
        if (problem) {
          const text = problem.error ?? 'a queued move would no longer work';
          error.textContent = text[0].toUpperCase() + text.slice(1);
          return;
        }
```

(`queueChangeProblem` returns the failing move's projected result object, or `null`; `queuedMoveProblem` returned a string. Read its definition in `ui/logic/actions.js` first and adjust if its shape differs.) If it does not exist yet, keep `queuedMoveProblem` and add a one-line note to the handoff that the switch is owed after `compute-ui-fix2` merges.
- [ ] **Step 2: Full check.** `npm test` (all pass), `npm run balance` (no change), and a playthrough from `index.html?seed=1`: train a model, release it twice (the second time skip a number), read the reveal and the jump posts, and continue to the next turn. Check the lab history (`#history`) lists the models with their names.
- [ ] **Step 3: Review.** Per the global review rules, run the pre-merge review on the whole branch before merging into `ui`: the straight Codex review (`review --base ui`) and the adversarial pass, concurrently, with the mutation guard. Fix Critical and Important findings in one wave; re-verify with `resume`.
- [ ] **Step 4: Owner look.** Publish screenshots of the dialog and the settled reveal to the owner (as a private artifact, never a worktree link) and record any feedback in `~/.claude/skills/design/LEARNINGS.md`.
- [ ] **Step 5: Merge and push.** Merge `release-flow` into `ui` (tell the events lane first), push `ui` and `release-flow`, then remove the worktree once it is clean and merged.

---

## Review record (plan review, 2026-09-26)

One Codex adversarial pass (gpt-5.6-sol, read-only, session `01a0dce8-0b69-7cc2-9c57-efab59aca846`), three rounds, the cap.

- Round 1, REVISE, seven findings, all fixed: the reveal stayed at opacity 0 (no `dialog-open`); editing a release reordered the queue; the one-point test's flagship value clamped every critic (now 54); the default Quick checks card had no ship chip; clicks and keys did not skip the build-up; the screenshot prices assumed Medium thinking; the RED step over-counted failures.
- Round 2, REVISE, two findings, both fixed: use the existing `queuedMoveProblem` before changing a queued release; Tab did not skip.
- Round 3, REVISE, two findings, both fixed but **not re-verified by Codex** (the cap was reached): the menu locked the player out of changing a queued release (Task 3 Step 2b now changes `ui/menu.js`); Task 5 Step 1's switch to `queueChangeProblem` lacked the import and return-shape change.

The builder's own review of Task 3 should check Step 2b and Task 5 Step 1 with extra care.
