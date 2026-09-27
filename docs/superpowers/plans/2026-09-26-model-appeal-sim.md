# Model Appeal (sim) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the game rules of the model-appeal design: five products, fit, release features, the era wave,
rival crowding, franchise, capacity, first mover, and the balance bots that prove the choices are real.

**Architecture:** Data and small pure helpers live in a new `sim/data/products.js`; fit and market terms in a new
`sim/appeal.js`. Existing modules (`recipe`, `training`, `release`, `serving`, `economy`, `split`, `rivals`, `turn`)
call into them. The critics judge the model (capability, polish); the market judges the product (fit, wave, crowding,
franchise, first mover, features); the two never feed each other's numbers.

**Tech Stack:** Plain ES modules, Node's built-in test runner (`node --test tests/*.test.js`), balance bots in
`tools/balance.js`.

**Spec:** `docs/superpowers/specs/2026-09-26-model-appeal-design.md` (read it in full first; section numbers below
refer to it).

## Global Constraints

- No randomness of any kind in anything this plan adds (spec §1; deterministic-endings spec).
- Every task ends with `npm test` fully green (known todo tests excepted).
- Critic scores get nothing from this plan except the polish term `gn-keep-training` adds (spec §11).
- Money is in $M in `state.cash` and card costs; users are plain counts.
- Round numbers: code uses the 0-based `state.turnInEra`; words and data comments count rounds from 1 (spec §10).
- This plan does not touch screens. The screens plan (product picker, fit meter, feature slots, capacity forecast,
  receipt) follows after the owner approves rendered mockups. **Do not merge this branch into `ui` without the screens
  plan**: until then the player cannot pick a product or features and every model defaults to a business assistant.
- New mechanics get before-and-after bot runs (Task 10); tasks do not tune numbers on their own.

## Preconditions (check before Task 1)

The spec's §14 build order. Before starting, `git fetch origin` and confirm each is in `origin/ui`
(`git log origin/ui --oneline | head -40`, and the lanes board `~/claude-sync/bin/claude-sync.sh lanes .`):

1. `gn-model-money` (branch `model-money`): `ERA_PRICE`, `model.eraPrice`, per-model books (`earned`, `servingSpent`,
   `monthsOnSale`), `revenuePerUser` imported by `ui/logic/release.js`.
2. `gn-benchmarks` (branch `benchmarks-by-era`): per-era tests in `sim/launch.js`.
3. Deterministic-endings Tasks A5, A10, B1, B3 (branch `deterministic-endings`).
4. `gn-constitution` (branches `constitution-era3*`): `spec-light` replaced by `constitution`.
5. `gn-capability-cap`.
6. `gn-keep-training`: `pendingModel.polish`, `fixedFlaws`, the `polish / 50` stand-in in `scoreLaunch`.

If any is missing, stop and tell the owner which. Then create this plan's worktree from `origin/ui`:
`git worktree add ~/worktrees/game-night-ai-lab-appeal-build -b appeal-build origin/ui` and work there with absolute
paths. **Code in this plan was written against `ui` at 27bf708; the lanes above change several of the same
functions. Before each edit, re-read the current function and apply the change to what is there.** Where this plan
shows a whole function, keep any lines the other lanes added (for example `model-money`'s book fields or
`benchmarks-by-era`'s test rows).

## File map

| File | Responsibility |
|---|---|
| `sim/data/products.js` (new) | Product table, fit profiles, release features, waves, rival rules and feature dates, crowding and first-mover tables; small pure helpers (`productOf`, `productPickable`, `pickableProducts`, `waveProduct`, `rivalProduct`, `rivalsIn`, `crowding`, `holdsFirst`, `claimFirsts`) |
| `sim/appeal.js` (new) | `fitReport`, `featureAppeal`, `featureServing`, `marketTerms`, `costPerDollar` |
| `sim/recipe.js` | Product on the recipe; focus loses `usersMult` |
| `sim/training.js` | Run and pending model carry `product`, `recipe`, `startEra`; `openWeightsMx` removed |
| `sim/release.js` | Product, features, fit, launch users, go-live market terms, franchise, firsts, receipt, agent risk; open weights removed |
| `sim/serving.js`, `sim/economy.js` | Product tables, feature multipliers, crowded and served-share growth |
| `sim/split.js` | `lostToOutage` per model |
| `sim/rivals.js`, `sim/turn.js`, `sim/state.js` | Rival product firsts, rival feature schedule, `state.firsts` |
| `sim/data/cards.js` | Channel group and open cards removed; Staged rollout; release slots 1; user bonuses that fit replaces |
| `sim/launch.js`, `sim/data/launch.js` | Product verdict line and "cheap to run" reaction |
| `sim/feed.js`, `sim/feedLive.js`, `sim/data/feed.js`, `sim/data/events6c.js`, `sim/data/realEvents.js` | Product-keyed pools; open leftovers; voice event gating |
| `ui/logic/release.js`, `ui/logic/history.js`, `ui/logic/finance.js`, `ui/logic/actions.js`, `ui/logic/money.js`, `ui/screens/finance.js`, `ui/screens/history.js`, `ui/screens/reveal.js`, `ui/screens/recipe.js` | Product-keyed readers and labels only (no new screen parts) |
| `tools/balance.js`, `ui/logic/scenarios.js`, `tests/helpers/policy.js`, `tools/demo-seeds.js` | Products for every bot and script; five new bots; valuation race |
| `tests/appeal.test.js` (new) and existing tests | Rules below |

---

### Task 1: Product data and helpers

**Files:**
- Create: `sim/data/products.js`
- Test: `tests/appeal.test.js` (new)

**Interfaces:**
- Produces (all exported from `sim/data/products.js`):
  - `PRODUCTS: { [id]: { name, opens: { era, lastRound }, users, price, tokens, channel, govUs? } }`
  - `PRODUCT_IDS: string[]`, `DEFAULT_PRODUCT = 'business'`, `CHANNEL_FALLBACK`
  - `WAVE: (string|null)[]` indexed by era, `WAVE_USERS = 1.6`, `CROWDING = [1, 0.8, 0.65, 0.55, 0.5]`
  - `FIRST_MOVER = { users: 1.1, growth: 1.1, featureExcessCut: 0.25 }`, `FIT_USERS = { base: 0.7, span: 0.6 }`,
    `FEATURE_FIT = 0.1`, `FOCUS_SIGNAL_MIN = 0.1`, `FEATURE_SLOTS = 2`
  - `RIVAL_RULES: { [rivalId]: (era) => productId }`
  - `productOf(model) → productId`, `productPickable(state, id) → boolean`, `pickableProducts(state) → productId[]`,
    `waveProduct(era) → productId`, `rivalProduct(rivalId, era) → productId|null`,
    `rivalsIn(state, product, era = state.era) → rivalId[]`, `crowding(state, product, era = state.era) → number`,
    `holdsFirst(state, kind, key, lab) → boolean` (kind `'products'|'features'`),
    `claimFirsts(state, lab, product, featureIds) → void`
  - Later tasks add `FIT_PROFILES` (Task 2), `RELEASE_FEATURES` and `RIVAL_FEATURES` (Task 8) to this file.

- [ ] **Step 1: Write the failing tests**

Create `tests/appeal.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  PRODUCTS, pickableProducts, productOf, waveProduct, rivalProduct, crowding, claimFirsts, holdsFirst,
} from '../sim/data/products.js';

test('products open one round before their wave era', () => {
  const s = createInitialState();
  assert.deepEqual(pickableProducts(s), ['chat', 'business']);
  s.turnInEra = 3;
  assert.deepEqual(pickableProducts(s), ['chat', 'business', 'coding']);
  s.era = 2; s.turnInEra = 3;
  assert.deepEqual(pickableProducts(s), ['chat', 'business', 'coding', 'agent']);
  s.era = 3; s.turnInEra = 3;
  assert.deepEqual(pickableProducts(s), ['chat', 'business', 'coding', 'agent', 'science']);
});

test('a model without a product falls back from its legacy channel', () => {
  assert.equal(productOf({ product: 'coding', channel: 'enterprise' }), 'coding');
  assert.equal(productOf({ channel: 'consumer' }), 'chat');
  assert.equal(productOf({ spec: { channel: 'agent' } }), 'agent');
  assert.equal(productOf({}), 'business');
});

test('each product maps to a legacy channel', () => {
  assert.equal(PRODUCTS.chat.channel, 'consumer');
  assert.equal(PRODUCTS.coding.channel, 'enterprise');
  assert.equal(PRODUCTS.agent.channel, 'agent');
});

test('the wave and the rival rules by era', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(waveProduct), ['chat', 'coding', 'agent', 'science', 'agent']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('openbrain', era)), ['chat', 'coding', 'agent', 'science', 'agent']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('lodestar', era)), ['business', 'business', 'business', 'science', 'science']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('deepthink', era)), ['chat', 'coding', 'coding', 'science', 'science']);
  assert.deepEqual([1, 2, 3, 4, 5].map((era) => rivalProduct('qilin', era)), ['chat', 'chat', 'coding', 'coding', 'coding']);
  assert.equal(rivalProduct('openbrain', 6), 'agent');
});

test('crowding counts the rivals in a product (spec section 6 table)', () => {
  const s = createInitialState();
  assert.equal(crowding(s, 'chat'), 0.55);
  assert.equal(crowding(s, 'business'), 0.8);
  s.era = 2;
  assert.equal(crowding(s, 'coding'), 0.65);
  s.era = 3;
  assert.equal(crowding(s, 'agent'), 0.8);
  assert.equal(crowding(s, 'chat'), 1);
  s.era = 4;
  assert.equal(crowding(s, 'science'), 0.55);
  assert.equal(crowding(s, 'agent'), 1);
});

test('firsts go to the first lab live; labs live in the same round share them', () => {
  const s = createInitialState();
  s.turn = 5;
  claimFirsts(s, 'openbrain', 'chat', []);
  claimFirsts(s, 'player', 'chat', ['voice']);
  assert.ok(holdsFirst(s, 'products', 'chat', 'openbrain'));
  assert.ok(holdsFirst(s, 'products', 'chat', 'player'));
  assert.ok(holdsFirst(s, 'features', 'voice', 'player'));
  s.turn = 6;
  claimFirsts(s, 'qilin', 'chat', ['voice']);
  assert.ok(!holdsFirst(s, 'products', 'chat', 'qilin'));
  assert.ok(!holdsFirst(s, 'features', 'voice', 'qilin'));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/appeal.test.js`
Expected: FAIL, "Cannot find module '../sim/data/products.js'".

- [ ] **Step 3: Write `sim/data/products.js`**

```js
import { eraById } from './eras.js';

// Model appeal (spec docs/superpowers/specs/2026-09-26-model-appeal-design.md). Starting numbers; the bot runs size
// them. Chat and business keep today's consumer and enterprise numbers; the new products match chat's base revenue.
export const PRODUCTS = {
  chat: { name: 'Chat app', opens: { era: 1, lastRound: false }, users: 4e6, price: 5, tokens: 1, channel: 'consumer' },
  business: { name: 'Business assistant', opens: { era: 1, lastRound: false }, users: 5e5, price: 30, tokens: 4, channel: 'enterprise' },
  coding: { name: 'Coding tool', opens: { era: 1, lastRound: true }, users: 5e5, price: 40, tokens: 6, channel: 'enterprise' },
  agent: { name: 'Autonomous agent', opens: { era: 2, lastRound: true }, users: 5e4, price: 400, tokens: 20, channel: 'agent' },
  science: { name: 'Science partner', opens: { era: 3, lastRound: true }, users: 5e3, price: 4000, tokens: 40, channel: 'enterprise', govUs: 2 },
};
export const PRODUCT_IDS = Object.keys(PRODUCTS);
export const DEFAULT_PRODUCT = 'business';
export const CHANNEL_FALLBACK = { consumer: 'chat', enterprise: 'business', agent: 'agent' };

// The hot product per era (index = era); announced, and pickable, from the last round of the era before.
export const WAVE = [null, 'chat', 'coding', 'agent', 'science', 'agent'];
export const WAVE_USERS = 1.6;
// Launch-user and growth multiplier by the number of rivals in a product.
export const CROWDING = [1, 0.8, 0.65, 0.55, 0.5];
export const FIRST_MOVER = { users: 1.1, growth: 1.1, featureExcessCut: 0.25 };
export const FIT_USERS = { base: 0.7, span: 0.6 };
export const FEATURE_FIT = 0.1;
export const FOCUS_SIGNAL_MIN = 0.1;
export const FEATURE_SLOTS = 2;

// Rivals move to their product at the start of each era (spec section 7).
export const RIVAL_RULES = {
  openbrain: (era) => WAVE[era],
  lodestar: (era) => (era >= 4 ? 'science' : 'business'),
  deepthink: (era) => (era >= 4 ? 'science' : era >= 2 ? 'coding' : 'chat'),
  qilin: (era) => (era >= 3 ? 'coding' : 'chat'),
};

const LAST_ERA = WAVE.length - 1;
const clampEra = (era) => Math.max(1, Math.min(era, LAST_ERA));

export const productOf = (model) => model?.product ?? model?.spec?.product
  ?? CHANNEL_FALLBACK[model?.channel ?? model?.spec?.channel] ?? DEFAULT_PRODUCT;

export function productPickable(state, id) {
  const product = PRODUCTS[id];
  if (!product) return false;
  const { era, lastRound } = product.opens;
  if (state.era !== era) return state.era > era;
  return !lastRound || state.turnInEra >= eraById(era).turns - 1;
}

export const pickableProducts = (state) => PRODUCT_IDS.filter((id) => productPickable(state, id));
export const waveProduct = (era) => WAVE[clampEra(era)];
export const rivalProduct = (rivalId, era) => RIVAL_RULES[rivalId]?.(clampEra(era)) ?? null;
export const rivalsIn = (state, product, era = state.era) =>
  state.rivals.filter((rival) => rivalProduct(rival.id, era) === product).map((rival) => rival.id);
export const crowding = (state, product, era = state.era) =>
  CROWDING[Math.min(rivalsIn(state, product, era).length, CROWDING.length - 1)];

export const holdsFirst = (state, kind, key, lab) => Boolean(state.firsts?.[kind]?.[key]?.labs.includes(lab));

// The first lab to go live in a product or with a release feature; labs live in the same round share it.
export function claimFirsts(state, lab, product, featureIds = []) {
  const firsts = (state.firsts ??= { products: {}, features: {} });
  const claim = (table, key) => {
    const entry = table[key];
    if (!entry) table[key] = { labs: [lab], turn: state.turn };
    else if (entry.turn === state.turn && !entry.labs.includes(lab)) entry.labs.push(lab);
  };
  if (product) claim(firsts.products, product);
  for (const id of featureIds) claim(firsts.features, id);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/appeal.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add sim/data/products.js tests/appeal.test.js
git commit -m "feat(sim): product table, era waves, rival products, crowding and firsts (model appeal)"
```

---

### Task 2: Fit profiles and `fitReport`

**Files:**
- Modify: `sim/data/products.js` (add `FIT_PROFILES`)
- Create: `sim/appeal.js`
- Test: `tests/appeal.test.js`

**Interfaces:**
- Consumes: Task 1 constants; `cardById`, `cardUnlocked`, `slotsFor`, `focusShares` from `sim/recipe.js`; `CARDS`
  from `sim/data/cards.js`; `FOCUS` from `sim/data/recipeFocus.js`.
- Produces: `FIT_PROFILES: { [productId]: Signal[] }` where
  `Signal = { kind: 'cards'|'group'|'focus'|'size', w, label, ids?, group?, except?, stage?, index?, sizes? }`;
  `fitReport(state, recipe, product, releasePicks = []) → { fit: number (0..1, 3 decimals), missing: string[] }`
  (missing = labels of achievable signals not present, heaviest first).

- [ ] **Step 1: Write the failing tests** (append to `tests/appeal.test.js`)

```js
import { FIT_PROFILES } from '../sim/data/products.js';
import { fitReport } from '../sim/appeal.js';
import { cardById } from '../sim/recipe.js';

const draft = (picks, extra = {}) => ({
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.2 },
  picks: { pre: [], mid: [], post: [], ...picks },
  ...extra,
});

test('every fit profile weighs 1 in total', () => {
  for (const [id, signals] of Object.entries(FIT_PROFILES)) {
    assert.equal(Math.round(signals.reduce((sum, s) => sum + s.w, 0) * 1000) / 1000, 1, id);
  }
});

test('the agent profile never asks for two cards from the one-pick rl group', () => {
  const rl = FIT_PROFILES.agent.filter((s) => (s.ids ?? []).some((id) => cardById(id)?.group === 'rl'));
  assert.equal(rl.length, 1);
});

test('fit counts only signals the era can reach: a perfect era-1 chat recipe scores 1', () => {
  const s = createInitialState();
  const recipe = draft({ post: ['rlhf', 'safety-tuning'] }, { focus: { post: [40, 40, 20] } });
  assert.deepEqual(fitReport(s, recipe, 'chat'), { fit: 1, missing: [] });
});

test('missing signals are named, heaviest first', () => {
  const s = createInitialState();
  const report = fitReport(s, draft({ post: ['rlhf'] }), 'chat');
  assert.equal(report.fit, 0.444);
  assert.deepEqual(report.missing, ['values time in post-training', 'safety hardening']);
});

test('default cards never count, and thumbs-up is not a feedback signal', () => {
  const s = createInitialState();
  assert.equal(fitReport(s, draft({ post: ['thumbs'] }), 'chat').fit, 0);
});

test('a focus slider counts only 10 points of share above its start', () => {
  const s = createInitialState();
  const small = fitReport(s, draft({}, { focus: { post: [55, 25, 20] } }), 'chat');
  const big = fitReport(s, draft({}, { focus: { post: [50, 30, 20] } }), 'chat');
  assert.equal(small.fit, 0);
  assert.equal(big.fit, 0.333);
});

test('the release eval counts when picked at release', () => {
  const s = createInitialState();
  const recipe = draft({});
  assert.ok(fitReport(s, recipe, 'business', ['eval-full']).fit > fitReport(s, recipe, 'business').fit);
});
```

The era-1 chat numbers: the reachable chat signals in era 1 are a feedback card (0.2), Values focus (0.15) and a
safeguard (0.1), total 0.45. `rlhf` alone = 0.2 / 0.45 = 0.444. Values at 30 of 100 is +10 points over its start of
20, so it counts: 0.15 / 0.45 = 0.333.

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/appeal.test.js`
Expected: FAIL, "does not provide an export named 'FIT_PROFILES'".

- [ ] **Step 3: Add `FIT_PROFILES` to `sim/data/products.js`**

```js
// What each product wants from the recipe (spec section 4). `cards`: any of these ids; `group`: any non-default card
// of the group except `except`; `focus`: that stage's slider `index` at least FOCUS_SIGNAL_MIN of share above its start;
// `size`: one of these sizes. Release-stage cards count when picked at release.
export const FIT_PROFILES = {
  chat: [
    { kind: 'group', group: 'character', w: 0.25, label: 'character training' },
    { kind: 'group', group: 'feedback', except: ['thumbs'], w: 0.2, label: 'a feedback method other than thumbs-up' },
    { kind: 'cards', ids: ['multimodal'], w: 0.2, label: 'image understanding' },
    { kind: 'focus', stage: 'post', index: 1, w: 0.15, label: 'values time in post-training' },
    { kind: 'cards', ids: ['multilingual'], w: 0.1, label: 'many languages' },
    { kind: 'group', group: 'safeguards', w: 0.1, label: 'safety hardening' },
  ],
  business: [
    { kind: 'group', group: 'context', w: 0.3, label: 'long context' },
    { kind: 'cards', ids: ['safety-tuning', 'unlearning', 'classifiers'], w: 0.2, label: 'safety tuning' },
    { kind: 'cards', ids: ['eval-full', 'eval-third', 'eval-gov'], w: 0.2, label: 'real evaluations before launch' },
    { kind: 'focus', stage: 'pre', index: 2, w: 0.1, label: 'data cleaning' },
    { kind: 'group', group: 'decontam', w: 0.1, label: 'honest benchmark scores' },
    { kind: 'cards', ids: ['tool-sft'], w: 0.1, label: 'tool use' },
  ],
  coding: [
    { kind: 'cards', ids: ['rlvr-light', 'reasoning-rl'], w: 0.3, label: 'reasoning training' },
    { kind: 'focus', stage: 'pre', index: 1, w: 0.2, label: 'math and code in pre-training' },
    { kind: 'cards', ids: ['tool-sft'], w: 0.2, label: 'tool use' },
    { kind: 'group', group: 'ready', w: 0.15, label: 'reasoning readiness' },
    { kind: 'group', group: 'context', w: 0.15, label: 'long context' },
  ],
  agent: [
    { kind: 'cards', ids: ['agentic-rl'], w: 0.35, label: 'agent training' },
    { kind: 'group', group: 'ready', w: 0.2, label: 'reasoning readiness' },
    { kind: 'cards', ids: ['tool-sft'], w: 0.15, label: 'tool use' },
    { kind: 'group', group: 'context', w: 0.1, label: 'long context' },
    { kind: 'focus', stage: 'post', index: 2, w: 0.1, label: 'red-teaming time' },
    { kind: 'group', group: 'safeguards', w: 0.1, label: 'safety hardening' },
  ],
  science: [
    { kind: 'cards', ids: ['reasoning-rl', 'raw-rl'], w: 0.25, label: 'full reasoning training' },
    { kind: 'cards', ids: ['expert-prefs', 'rubric'], w: 0.2, label: 'expert feedback' },
    { kind: 'cards', ids: ['reasoning-ready-full'], w: 0.15, label: 'the full reasoning-readiness recipe' },
    { kind: 'size', sizes: ['large', 'xl'], w: 0.2, label: 'a large model' },
    { kind: 'group', group: 'decontam', w: 0.1, label: 'honest benchmark scores' },
    { kind: 'group', group: 'context', w: 0.1, label: 'long context' },
  ],
};
```

Check the group names against `sim/data/cards.js` before writing (`character`, `feedback`, `safeguards`, `context`,
`decontam`, `ready`); if a lane renamed a group, use the current name.

- [ ] **Step 4: Create `sim/appeal.js`**

```js
import { CARDS } from './data/cards.js';
import { FOCUS } from './data/recipeFocus.js';
import { FIT_PROFILES, FOCUS_SIGNAL_MIN } from './data/products.js';
import { cardById, cardUnlocked, focusShares, slotsFor } from './recipe.js';

function signalCards(signal) {
  if (signal.ids) return signal.ids.map(cardById).filter(Boolean);
  if (signal.group) {
    return CARDS.filter((card) => card.group === signal.group && !card.default && !(signal.except ?? []).includes(card.id));
  }
  return [];
}

function achievable(state, signal) {
  if (signal.kind === 'focus') return slotsFor(state, signal.stage) > 0;
  if (signal.kind === 'size') return true;
  return signalCards(signal).some((card) => cardUnlocked(state, card) && (card.stage === 'release' || slotsFor(state, card.stage) > 0));
}

function present(recipe, releasePicks, signal) {
  if (signal.kind === 'focus') {
    const shares = focusShares(recipe, signal.stage);
    return Boolean(shares) && shares[signal.index] - FOCUS[signal.stage][signal.index].start / 100 >= FOCUS_SIGNAL_MIN - 1e-9;
  }
  if (signal.kind === 'size') return signal.sizes.includes(recipe.sliders?.size);
  const picked = new Set([...Object.values(recipe.picks ?? {}).flat(), ...releasePicks]);
  return signalCards(signal).some((card) => picked.has(card.id));
}

// How well a recipe matches a product, against what this era can reach (spec section 4).
export function fitReport(state, recipe, product, releasePicks = []) {
  const signals = FIT_PROFILES[product].filter((signal) => achievable(state, signal));
  const total = signals.reduce((sum, signal) => sum + signal.w, 0);
  if (total === 0) return { fit: 1, missing: [] };
  const hits = signals.filter((signal) => present(recipe, releasePicks, signal));
  const fit = hits.reduce((sum, signal) => sum + signal.w, 0) / total;
  const missing = signals.filter((signal) => !hits.includes(signal)).sort((a, b) => b.w - a.w).map((signal) => signal.label);
  return { fit: Math.round(fit * 1000) / 1000, missing };
}
```

- [ ] **Step 5: Run to verify pass**

Run: `node --test tests/appeal.test.js`
Expected: PASS (13 tests).

- [ ] **Step 6: Commit**

```bash
git add sim/data/products.js sim/appeal.js tests/appeal.test.js
git commit -m "feat(sim): product fit profiles and fitReport, scored against what the era can reach"
```

---

### Task 3: The recipe carries the product; card user bonuses become fit

**Files:**
- Modify: `sim/recipe.js` (`validateRecipe`, `focusEffects`)
- Modify: `sim/training.js` (`startRun`, `resolveRun`)
- Modify: `sim/data/cards.js` (`multimodal`, `multilingual`, `refusal-calibration`)
- Modify: `ui/logic/actions.js` (`sanitizeDraft`, `DEFAULT_RECIPE`)
- Test: `tests/recipe.test.js`, `tests/training.test.js`, `tests/ui-actions.test.js`

**Interfaces:**
- Consumes: `PRODUCTS`, `DEFAULT_PRODUCT`, `productPickable` (Task 1).
- Produces: `recipe.product` (optional; absent means `DEFAULT_PRODUCT`); `state.activeRun.startEra`;
  `state.pendingModel.product`, `state.pendingModel.recipe` (a clone of the run's recipe),
  `state.pendingModel.startEra`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/recipe.test.js` (reuse its imports; add `createInitialState` and `validateRecipe`/`focusEffects`
if not imported):

```js
test('a recipe names a product that is open', () => {
  const s = createInitialState();
  const base = { sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: [] } };
  assert.ok(validateRecipe(s, { ...base, product: 'chat' }).ok);
  assert.ok(validateRecipe(s, base).ok, 'absent product means the default');
  assert.match(validateRecipe(s, { ...base, product: 'coding' }).errors.join(), /Coding tool is not open yet/);
  assert.match(validateRecipe(s, { ...base, product: 'robots' }).errors.join(), /unknown product robots/);
});

test('the Long documents focus no longer adds users (fit rewards long context now)', () => {
  const s = createInitialState();
  s.era = 2;
  const recipe = { sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: [] }, focus: { mid: [0, 100, 0] } };
  assert.equal(focusEffects(s, recipe).usersMult, undefined);
});
```

Append to `tests/training.test.js`:

```js
test('the trained model keeps its product, recipe and start era', () => {
  const s = createInitialState();
  const recipe = { product: 'chat', sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: ['rlhf'] } };
  assert.ok(startRun(s, recipe).ok);
  advanceRun(s, { next: () => 0.5, int: () => 0, chance: () => false, normal: (m) => m });
  assert.equal(s.pendingModel.product, 'chat');
  assert.deepEqual(s.pendingModel.recipe.picks.post, ['rlhf']);
  assert.equal(s.pendingModel.startEra, 1);
});

test('image and language cards no longer carry their own user bonus', async () => {
  const { CARDS } = await import('../sim/data/cards.js');
  for (const id of ['multimodal', 'multilingual', 'refusal-calibration']) {
    assert.equal(CARDS.find((card) => card.id === id).effects.usersMult, undefined, id);
  }
});
```

Append to `tests/ui-actions.test.js`:

```js
test('the draft keeps an open product and resets a locked one', () => {
  const s = createInitialState();
  assert.equal(sanitizeDraft(s, { product: 'chat' }).product, 'chat');
  assert.equal(sanitizeDraft(s, { product: 'science' }).product, 'business');
  assert.equal(sanitizeDraft(s, {}).product, 'business');
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/recipe.test.js tests/training.test.js tests/ui-actions.test.js`
Expected: the new tests FAIL (no product validation, `usersMult` still set, no `product` on the pending model).

- [ ] **Step 3: Implement**

`sim/recipe.js`: import `{ PRODUCTS, DEFAULT_PRODUCT, productPickable } from './data/products.js'`. In
`validateRecipe`, after the size checks add:

```js
  const product = recipe.product ?? DEFAULT_PRODUCT;
  if (!Object.hasOwn(PRODUCTS, product)) errors.push(`unknown product ${product}`);
  else if (!productPickable(state, product)) errors.push(`${PRODUCTS[product].name} is not open yet`);
```

In `focusEffects`, delete the `usersMult: 1 + long * 0.2,` line; `long` is then unused, so change the destructure to
`const [anneal, , prep] = ...`.

`sim/data/cards.js`: remove `usersMult: 1.05` from `multimodal`, `usersMult: 1.1` from `multilingual`, and
`usersMult: 1.03` from `refusal-calibration`. Leave `thumbs` as is.

`sim/training.js`: import `DEFAULT_PRODUCT` from `./data/products.js`. In `startRun`, add `startEra: state.era` to the
`state.activeRun = { ... }` object (keep every field other lanes added there). In `resolveRun`'s returned object add:

```js
    product: run.recipe.product ?? DEFAULT_PRODUCT,
    recipe: structuredClone(run.recipe),
    startEra: run.startEra ?? state.era,
```

`ui/logic/actions.js`: import `{ DEFAULT_PRODUCT, productPickable } from '../../sim/data/products.js'`. In
`sanitizeDraft`, add to the returned object `product: productPickable(state, draft?.product) ? draft.product : DEFAULT_PRODUCT`.
Add `product: DEFAULT_PRODUCT` to `DEFAULT_RECIPE`.

- [ ] **Step 4: Run to verify pass, then the whole suite**

Run: `node --test tests/recipe.test.js tests/training.test.js tests/ui-actions.test.js` → PASS.
Run: `npm test` → fix any test that asserted the removed `usersMult` values (search
`grep -rn "usersMult" tests`), updating it to the new rule, not deleting coverage.

- [ ] **Step 5: Commit**

```bash
git add sim/recipe.js sim/training.js sim/data/cards.js ui/logic/actions.js tests/
git commit -m "feat(sim): the recipe names a product; card user bonuses that fit replaces are removed"
```

---

### Task 4: Prices, tokens and launch users by product

**Files:**
- Modify: `sim/serving.js` (`servingCost`; remove `CHANNEL`, `REVENUE_PER_USER`)
- Modify: `sim/economy.js` (`revenuePerUser`)
- Modify: `sim/release.js` (`releaseModel`: product, channel, users base, science favor, privacy line; remove `USERS_BASE`)
- Modify: `ui/logic/release.js` (`releaseSpec`, `tokensPerUser`, `pricePerMillion`, `servingPerMillion`, `priceSheet`, `salesEstimate`, remove `CHANNEL_NAMES`)
- Test: `tests/serving.test.js`, `tests/economy.test.js`, `tests/release.test.js`, `tests/ui-release.test.js`

**Interfaces:**
- Consumes: `PRODUCTS`, `productOf`, `DEFAULT_PRODUCT` (Task 1); `pendingModel.product` (Task 3).
- Produces: `model.product`, `model.spec.product`, `model.channel = PRODUCTS[product].channel`;
  `revenuePerUser(model)` keyed by product; `servingCost(spec, era, load)` keyed by `spec.product` (fallback via
  `productOf({ spec })`); `model.fresh` (launch users before market terms, used by Task 6).

- [ ] **Step 1: Write the failing tests**

In `tests/serving.test.js`, replace the local token helper and the `CHANNEL`/`REVENUE_PER_USER` imports with the
product table:

```js
import { PRODUCTS } from '../sim/data/products.js';
// ...
const tokens = (spec, era) => USAGE[era - 1] * PRODUCTS[spec.product].tokens * REASONING[spec.reasoning];

test('serving cost reads the product: a coding user runs 6 times a chat user', () => {
  const base = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoning: 'off' };
  const chat = servingCost({ ...base, product: 'chat' }, 2, 0);
  const coding = servingCost({ ...base, product: 'coding' }, 2, 0);
  near(coding / chat, 6);
});

test('a spec without a product falls back from its channel', () => {
  const base = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoning: 'off' };
  near(servingCost({ ...base, channel: 'enterprise' }, 1, 0), servingCost({ ...base, product: 'business' }, 1, 0));
});
```

(Update the file's other uses of `CHANNEL[spec.channel]` and `REVENUE_PER_USER.consumer` to `PRODUCTS[...]` the same
way; add `product: 'chat'` to specs that relied on `channel: 'consumer'`.)

In `tests/economy.test.js`:

```js
test('revenue per user reads the product, with the legacy channel as fallback', () => {
  const m = { product: 'science', priceStance: 'market' };
  assert.equal(revenuePerUser(m), 4000 * (m.eraPrice ?? 1));
  assert.equal(revenuePerUser({ channel: 'consumer', priceStance: 'premium' }), 5 * 1.5);
});
```

In `tests/release.test.js`, add (the file's `trainedState()` trains with its `recipe`; give that recipe
`product: 'chat'`):

```js
test('the release takes its channel from the product; agent training no longer changes it', () => {
  const s = trainedState();
  const r = releaseModel(s, { picks: ['eval-full'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 }, rng);
  assert.ok(r.ok, r.error);
  assert.equal(r.model.product, 'chat');
  assert.equal(r.model.spec.product, 'chat');
  assert.equal(r.model.channel, 'consumer');
});

test('a science partner launch wins favor in Washington', () => {
  const s = trainedState();
  s.pendingModel.product = 'science';
  const before = s.govFavor.us;
  const fromCards = s.pendingModel.publicEffects.govUs;
  releaseModel(s, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 }, rng);
  assert.equal(s.govFavor.us - before, 2 + fromCards);
});

test('the privacy line adds users to business assistants only', () => {
  // Set up the privacy constitution line the way tests/constitution.test.js does, then release a coding tool and a
  // business assistant from identical states and compare model.fresh: business × 1.1, coding × 1.
});
```

Write the privacy test body by copying the constitution setup from `tests/constitution.test.js` (search `privacy`);
do not leave it as a comment.

In `tests/ui-release.test.js`:

```js
test('the price per million tokens reads the product', () => {
  const spec = { product: 'coding', reasoning: 'off' };
  near(pricePerMillion(spec, 2, 'market'), (40 * (ERA_PRICE?.[1] ?? 1)) / tokensPerUser(spec, 2));
});
```

(If `gn-model-money` put `ERA_PRICE` into `pricePerMillion`, import it from `sim/serving.js`; otherwise drop the factor.)

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/serving.test.js tests/economy.test.js tests/release.test.js tests/ui-release.test.js`
Expected: FAIL (no `product` handling).

- [ ] **Step 3: Implement**

`sim/serving.js`: import `{ PRODUCTS, productOf } from './data/products.js'`. Delete `CHANNEL` and
`REVENUE_PER_USER`. In `servingCost`:

```js
  const tokens = USAGE[e] * PRODUCTS[productOf({ spec })].tokens * REASONING[spec.reasoning];
```

(Task 8 adds the feature multiplier.)

`sim/economy.js`: import `{ PRODUCTS, productOf } from './data/products.js'`; drop `REVENUE_PER_USER` from the serving
import;

```js
export const revenuePerUser = (model) => PRODUCTS[productOf(model)].price * PRICE_STANCE[model.priceStance].rev
  * (model.revenueMult ?? 1) * (model.eraPrice ?? 1);
```

`sim/release.js`: import `{ PRODUCTS, DEFAULT_PRODUCT } from './data/products.js'`; delete `USERS_BASE`. In
`releaseModel`:
- right after `const spec = Object.assign(...)`: `const product = m.product ?? DEFAULT_PRODUCT; spec.product = product; spec.channel = PRODUCTS[product].channel;`
- delete `if (spec.channel === 'enterprise' && flags.includes('agentic')) spec.channel = 'agent';`
- `const constitutionUsers = product === 'business' && hasLine(state, 'privacy') ? 1.1 : 1;`
- `const fresh = Math.round(PRODUCTS[product].users * quality * eraGrowth * PRICE_STANCE[release.price].growth * m.publicEffects.usersMult * constitutionUsers);`
- on the model object add `product,` and `fresh,` (keep `users: fresh, newUsers: fresh` for now; Task 6 changes them).
- `if (product === 'chat' && hasLine(state, 'no-wmd')) model.revenueMult = 0.97;` (was `spec.channel === 'consumer'`).
- after the `govFavor.us` line: `state.govFavor.us += PRODUCTS[product].govUs ?? 0;`

`ui/logic/release.js`: import `{ PRODUCTS, productOf } from '../../sim/data/products.js'` and `revenuePerUser` from
`../../sim/economy.js` (if `gn-model-money` already did, keep its import); drop `CHANNEL` and `REVENUE_PER_USER` from
the serving import; delete `CHANNEL_NAMES` and the local `revenuePerUser`. Then:

```js
export function releaseSpec(state, picks, reasoning) {
  const model = state.pendingModel;
  const cards = cardsFor(state, picks);
  const spec = Object.assign({}, model?.spec ?? {}, ...cards.map((card) => card.effects.spec ?? {}));
  spec.reasoning = model?.spec?.reasoningCapable ? reasoning : 'off';
  spec.product = productOf(model);
  spec.channel = PRODUCTS[spec.product].channel;
  return spec;
}

export const tokensPerUser = (spec, era) => USAGE[era - 1] * PRODUCTS[productOf({ spec })].tokens * REASONING[spec.reasoning ?? 'off'];

export function pricePerMillion(spec, era, stance) {
  return (PRODUCTS[productOf({ spec })].price * PRICE_STANCE[stance].rev) / tokensPerUser(spec, era);
}

export function servingPerMillion(spec, era) {
  return servingCost(spec, era, 0) / tokensPerUser(spec, era);
}
```

(Keep any `ERA_PRICE` factor `gn-model-money` put into `pricePerMillion`.) In `priceSheet`, drop the open branch and
`open` fields' true case (keep `open: false` if a screen reads it until Task 5), build
`const spec = { ...model.spec, product: productOf(model) };`, and set `channel: PRODUCTS[productOf(model)].name`.
In `salesEstimate`, drop the open check. Search for other `CHANNEL_NAMES` users
(`grep -rn CHANNEL_NAMES ui tests`) and switch them to `PRODUCTS[...].name`.

- [ ] **Step 4: Run to verify pass, then the suite**

Run the four test files → PASS. Run `npm test`; fix tests that built models with a channel and expected channel
prices (the fallback keeps most working). Search `grep -rn "USERS_BASE\|REVENUE_PER_USER\|CHANNEL\b" sim ui tools tests`
→ no hits.

- [ ] **Step 5: Commit**

```bash
git add sim/serving.js sim/economy.js sim/release.js ui/logic/release.js tests/
git commit -m "feat(sim): prices, tokens and launch users come from the product"
```

---

### Task 5: Channel cards and open weights leave; Staged rollout; one release card slot

**Files:**
- Modify: `sim/data/cards.js` (remove `channel-api`, `channel-app`, `channel-open`, `tamper`, every `openWeightsMx`/`openWeightsMult`; rename `channel-staged` → `staged`; `STAGE_SLOTS.release` 2 → 1)
- Modify: `sim/release.js` (open branch; release-card `usersMult`), `sim/training.js` (`openWeightsMx`), `sim/serving.js` (`activeModels`), `sim/data/events6c.js` (`liveModels`), `sim/data/feed.js` (`channels.open`), `ui/logic/release.js` (open branches, `POLICY_LINES`), `ui/logic/history.js`, `ui/screens/history.js`, `ui/screens/release.js`, `ui/screens/reveal.js`, `ui/screens/recipe.js` (group label), and after `gn-model-money`: `ui/logic/modelMoney.js`, `ui/screens/modelMoney.js`
- Test: `tests/release.test.js`, `tests/constitution.test.js`, `tests/ui-release.test.js`, `tests/training.test.js`, `tests/recipe.test.js`, and every test that picks a channel card

**Interfaces:**
- Consumes: Task 4's product-based channel.
- Produces: release card `staged` (`effects: { pt: 2, usersMult: 0.8 }`, `cost: { turns: 1 }`); `STAGE_SLOTS.release = 1`.

- [ ] **Step 1: Write the failing tests** (append to `tests/release.test.js`)

```js
import { CARDS, STAGE_SLOTS } from '../sim/data/cards.js';

test('the channel cards and open weights are gone; Staged rollout stays', () => {
  const ids = CARDS.map((card) => card.id);
  for (const gone of ['channel-api', 'channel-app', 'channel-open', 'channel-staged', 'tamper']) assert.ok(!ids.includes(gone), gone);
  assert.ok(!CARDS.some((card) => card.group === 'channel' && card.id !== 'staged'));
  assert.ok(!CARDS.some((card) => 'openWeightsMx' in card.effects || 'openWeightsMult' in card.effects));
  assert.equal(STAGE_SLOTS.release, 1);
  const staged = CARDS.find((card) => card.id === 'staged');
  assert.equal(staged.effects.usersMult, 0.8);
});

test('Staged rollout launches to fewer users, a round later', () => {
  const a = trainedState();
  const b = trainedState();
  const base = { price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };
  const plain = releaseModel(a, { ...base, picks: [] }, rng).model;
  const staged = releaseModel(b, { ...base, picks: ['staged'] }, rng).model;
  assert.equal(staged.fresh, Math.round(plain.fresh * 0.8));
  assert.equal(staged.activeFromTurn, plain.activeFromTurn + 1);
});

test('no release sets open weights, and the no-wmd line still cuts misuse', () => {
  const s = trainedState();
  releaseModel(s, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 }, rng);
  assert.equal(s.flags.openWeights, undefined);
  assert.equal(s.pendingModel, null);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/release.test.js` → FAIL.

- [ ] **Step 3: Implement**

`sim/data/cards.js`: delete the four channel cards except `channel-staged`, which becomes:

```js
  { id: 'staged', stage: 'release', group: 'channel', name: 'Staged rollout', hint: 'A slower, gentler launch: fewer users at first.', era: 1, cost: { turns: 1 }, effects: { pt: 2, usersMult: 0.8 } },
```

Delete `tamper`. Delete every `openWeightsMx: N` and `openWeightsMult: N` from card effects. Set
`STAGE_SLOTS = { pre: 2, mid: 2, post: 3, release: 1 }`.

`sim/training.js`: delete the `openWeightsMx` computation and the `openWeightsMx,` field in `resolveRun`.

`sim/release.js`:
- `const stagedUsers = effects.reduce((product, e) => product * (e.usersMult ?? 1), 1);` and multiply `fresh` by it.
- replace the whole `if (spec.channel === 'open') { ... } else if (hasLine(state, 'no-wmd')) state.misuseExposure -= 4;`
  block with `if (hasLine(state, 'no-wmd')) state.misuseExposure -= 4;`.

`sim/serving.js` `activeModels`: drop `&& model.channel !== 'open'`. `sim/data/events6c.js` `liveModels`: drop
`&& model.channel !== 'open'`. `sim/data/feed.js`: delete the `open:` pool under `channels`.

`ui/logic/release.js`: delete every `spec.channel === 'open'` / `model.channel === 'open'` branch left, the
`price: spec.channel === 'open' ? 'market' : draft.price` becomes `price: draft.price`, and `priceSheet` loses its
`open` field. Replace `POLICY_LINES` (keyed by channel card) with lines keyed by product, and read them by
`productOf(state.pendingModel)`:

```js
const POLICY_LINES = {
  chat: ['uneasy', 'Millions of users means millions of screenshots. Be ready.'],
  business: ['calm', 'Businesses first keeps us out of the headlines for now.'],
  coding: ['calm', 'Developers forgive bugs. They do not forgive downtime.'],
  agent: ['alarmed', 'An agent acts on its own. Washington will ask who is responsible.'],
  science: ['calm', 'Labs and agencies will want to see the safety case before they sign.'],
};
```

(`POLICY_LINES['channel-staged']` becomes a note appended when `staged` is picked: "Staged is gentler: fewer users
at first, fewer surprises.")

`ui/logic/history.js`: replace `HISTORY_CHANNEL_WORDS` by product names (`PRODUCTS[productOf(model)].name`) and
`availabilityPhrase` by `is sold as a ${name.toLowerCase()}`. `ui/screens/history.js`: delete `statusWords.open`.
`ui/screens/reveal.js`: delete the `model.channel === 'open'` users line. `ui/screens/release.js`: delete the
`spec.channel === 'open'` branch. `ui/screens/recipe.js`: delete the `channel: 'Who gets it'` group label (the group
now holds only Staged rollout; label it `channel: 'Rollout'`). After `gn-model-money`: delete the `'open'` status in
`ui/logic/modelMoney.js` and "open weights, earns nothing" in `ui/screens/modelMoney.js`.

Tests: `grep -rln "channel-app\|channel-api\|channel-staged\|channel-open\|openWeights\|tamper" tests ui tools` and
fix each: a release that picked `channel-app` now trains with `product: 'chat'` on its recipe and drops the card; one
that picked `channel-api` drops it (business is the default); `channel-staged` → `staged`. Delete the tests that only
covered open weights (`tests/release.test.js` open-weights cases, `tests/constitution.test.js` open-weights case,
`tests/training.test.js` `openWeightsMx` case, the open cases in `tests/ui-release.test.js`).

- [ ] **Step 4: Run to verify pass**

Run: `npm test` → PASS. `grep -rn "open'" sim ui | grep -i channel` → no hits.

- [ ] **Step 5: Commit**

```bash
git add -A sim ui tests
git commit -m "feat(sim): channel cards and open weights leave the game; Staged rollout; one release card slot"
```

(`git add -A sim ui tests` is safe here because this worktree is yours alone; check `git status` first.)

---

### Task 6: Fit and market terms reach users; franchise; firsts for the player; the receipt

**Files:**
- Modify: `sim/appeal.js` (add `marketTerms`)
- Modify: `sim/release.js` (`releaseModel`, `activateReleases`, `holdRelease`)
- Modify: `sim/state.js` (`firsts`)
- Test: `tests/appeal.test.js`, `tests/release.test.js`

**Interfaces:**
- Consumes: `fitReport` (Task 2), `pendingModel.recipe/startEra/product` (Task 3), `model.fresh` (Task 4),
  `waveProduct`, `crowding`, `holdsFirst`, `claimFirsts`, `FIT_USERS`, `WAVE_USERS`, `FIRST_MOVER` (Task 1).
- Produces: `marketTerms(state, product, lab = 'player') → { wave: number, crowding: number, first: boolean, mult: number }`;
  `model.appeal = { fit, missing, features, wave, crowding, first, franchise: { carried, improvement } }`;
  `state.firsts = { products: {}, features: {} }`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/appeal.test.js`:

```js
import { marketTerms } from '../sim/appeal.js';

test('the wave is a bigger market that crowding shrinks once', () => {
  const s = createInitialState();
  s.firsts = { products: { chat: { labs: ['openbrain'], turn: 0 }, business: { labs: ['lodestar'], turn: 0 } }, features: {} };
  assert.deepEqual(marketTerms(s, 'chat'), { wave: 1.6, crowding: 0.55, first: false, mult: 1.6 * 0.55 });
  assert.deepEqual(marketTerms(s, 'business'), { wave: 1, crowding: 0.8, first: false, mult: 0.8 });
  s.era = 3;
  s.firsts.products.agent = { labs: ['openbrain'], turn: 9 };
  assert.equal(marketTerms(s, 'agent').mult, 1.6 * 0.8);
  assert.equal(marketTerms(s, 'chat').mult, 1);
});

test('an unclaimed product gives the first-mover bonus', () => {
  const s = createInitialState();
  s.era = 4;
  assert.deepEqual(marketTerms(s, 'agent'), { wave: 1, crowding: 1, first: true, mult: 1.1 });
});
```

Append to `tests/release.test.js`:

```js
import { createInitialState as fresh } from '../sim/state.js';

test('fit scales launch users from 0.7 to 1.3', () => {
  const s = trainedState();
  const r = releaseModel(s, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 }, rng);
  const { fit } = r.model.appeal;
  assert.ok(fit >= 0 && fit <= 1);
  assert.ok(Math.abs(r.model.fresh / r.model.appeal.freshBeforeFit - (0.7 + 0.6 * fit)) < 0.01);
});

test('market terms apply at go-live and are recorded on the receipt', () => {
  const s = trainedState();
  const r = releaseModel(s, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 }, rng);
  const { wave, crowding, first } = r.model.appeal;
  assert.equal(wave, 1.6);          // era 1, chat is the wave
  assert.equal(crowding, 0.55);     // three rivals in chat
  assert.equal(first, true);        // nobody claimed chat yet in a fresh state
  assert.equal(r.model.users, Math.round(r.model.fresh * 1.6 * 0.55 * 1.1));
  assert.deepEqual(s.firsts.products.chat.labs, ['player']);
});

test('a same-line release adds fresh users only for a better model, and never cuts the line', () => {
  const s = trainedState();
  const base = { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel' };
  const first = releaseModel(s, { ...base, generation: 1 }, rng).model;
  first.users = 50e6;
  first.userCap = 60e6;
  s.turn += 3;
  // Train an identical second model: no capability gain, so improvement 0.
  startRun(s, recipe);
  advanceRun(s, rng);
  s.pendingModel.capability = first.capability;
  const second = releaseModel(s, { ...base, generation: 2 }, rng).model;
  assert.equal(second.appeal.franchise.improvement, 0);
  assert.equal(second.users, 50e6);
  assert.equal(second.userCap, 60e6);
});

test('holding a live release hands the old model back only its own users, and relaunch does not double count', () => {
  const s = trainedState();
  const base = { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel' };
  const first = releaseModel(s, { ...base, generation: 1 }, rng).model;
  first.users = 10e6;
  s.turn += 3;
  startRun(s, recipe);
  advanceRun(s, rng);
  const second = releaseModel(s, { ...base, generation: 2 }, rng).model;
  const liveUsers = second.users;
  releaseApi.holdRelease(s, second);
  assert.equal(first.users, 10e6);
  s.turn = second.activeFromTurn;
  releaseApi.activateReleases(s);
  assert.equal(second.users, liveUsers);
});
```

`freshBeforeFit` is recorded on the receipt so the fit factor can be shown and tested; add it in Step 3.

- [ ] **Step 2: Run to verify failure**

Run: `node --test tests/appeal.test.js tests/release.test.js` → FAIL.

- [ ] **Step 3: Implement**

`sim/state.js`: add `firsts: { products: {}, features: {} },` next to `rivals: createRivals(),`.

`sim/appeal.js`: import `{ FIRST_MOVER, WAVE_USERS, crowding, holdsFirst, waveProduct } from './data/products.js'` and
add:

```js
// The market a product meets when a model goes live (spec sections 6, 7, 10).
export function marketTerms(state, product, lab = 'player') {
  const wave = waveProduct(state.era) === product ? WAVE_USERS : 1;
  const crowd = crowding(state, product);
  const claimed = state.firsts?.products?.[product];
  const first = !claimed || holdsFirst(state, 'products', product, lab);
  return { wave, crowding: crowd, first, mult: wave * crowd * (first ? FIRST_MOVER.users : 1) };
}
```

`sim/release.js`: import `{ fitReport, marketTerms } from './appeal.js'` and
`{ FIT_USERS, claimFirsts, productOf } from './data/products.js'`. In `releaseModel`, before `fresh`:

```js
  const fitState = { ...state, era: m.startEra ?? state.era };
  const fitRecipe = m.recipe ?? { sliders: { size: m.size }, picks: {} };
  const { fit, missing } = fitReport(fitState, fitRecipe, product, release.picks ?? []);
  const fitUsers = FIT_USERS.base + FIT_USERS.span * fit;
```

Compute `freshBeforeFit` as today's `fresh` expression (with `stagedUsers`), then
`const fresh = Math.round(freshBeforeFit * fitUsers);`. On the model: `fresh`, `users: fresh`, `newUsers: fresh`,
`userCap: fresh * 4` (placeholders until go-live), and `appeal: { fit, missing, features: [], freshBeforeFit }`.
(Task 8 fills `features` and adds feature appeal to `fit`.)

Replace the body of `activateReleases`' loop from `let carried = 0;` to `model.activated = true;` with:

```js
    const product = productOf(model);
    const market = marketTerms(state, product);
    const launch = Math.round((model.fresh ?? model.users) * market.mult);
    let carried = 0;
    let previousCap = 0;
    let previous = null;
    model.replaced = [];
    for (const old of state.models) {
      if (old !== model && old.active && old.activated && productOf(old) === product && releaseOrder(state, old) < order) {
        carried = Math.max(carried, old.users);
        previousCap = Math.max(previousCap, old.userCap ?? 0);
        if (!previous || releaseOrder(state, old) > releaseOrder(state, previous)) previous = old;
        model.replaced.push({ index: state.models.indexOf(old), users: old.users });
        old.active = false;
        old.users = 0;
      }
    }
    const improvement = previous ? clamp(((model.launchScore ?? 0) - (previous.launchScore ?? 0)) / 10, 0, 1) : 1;
    model.users = previous ? carried + Math.round(launch * improvement) : launch;
    model.newUsers = model.users - carried;
    model.userCap = Math.max(previousCap, model.users, improvement > 0 ? launch * 4 : 0);
    model.appeal = { ...model.appeal, wave: market.wave, crowding: market.crowding, first: market.first, franchise: { carried, improvement } };
    claimFirsts(state, 'player', product, (model.spec.features ?? []).map((feature) => feature.id));
    model.activated = true;
```

Also change the superseding check at the top of the loop to compare `productOf(other) === productOf(model)` instead
of `other.channel === model.channel`.

In `holdRelease`, replace `old.users = model.users;` with `old.users = carrier.users;` and update the comment above
the function: the old model serves the users it had when it was replaced; the release's own launch users are computed
again, once, when it relaunches. Leave any firsts the release claimed: it did go live.

- [ ] **Step 4: Run to verify pass, then the suite**

Run the two files → PASS. `npm test` → fix tests that expected `users = max(fresh, carried)` or channel-based
carry-over; they now follow the franchise rule (update expected values from the rule, not by loosening asserts).

- [ ] **Step 5: Commit**

```bash
git add sim/appeal.js sim/release.js sim/state.js tests/
git commit -m "feat(sim): fit, wave, crowding and first mover reach launch users; franchise measures capability"
```

---

### Task 7: Growth, outages and rival firsts

**Files:**
- Modify: `sim/economy.js` (`growUsers`, new `growthMultiplier`)
- Modify: `sim/split.js` (`applySplitEffects`)
- Modify: `sim/rivals.js` (`landRivals`)
- Modify: `ui/logic/finance.js` (planner mirror)
- Test: `tests/economy.test.js`, `tests/split.test.js`, `tests/race.test.js` (or the file that tests `landRivals`), `tests/ui-finance.test.js`

**Interfaces:**
- Consumes: `crowding`, `holdsFirst`, `claimFirsts`, `rivalProduct`, `productOf`, `FIRST_MOVER` (Task 1);
  `computeSlices` (`sim/split.js`).
- Produces: `growthMultiplier(state, model) → number` (crowding × first-mover growth × served share);
  `model.lostToOutage` (cumulative users).

- [ ] **Step 1: Write the failing tests**

`tests/economy.test.js`:

```js
import { growthMultiplier, growUsers } from '../sim/economy.js';

test('growth slows in a crowded product and with a serving shortfall', () => {
  const s = createInitialState();
  const model = { product: 'business', priceStance: 'market', users: 1e6, userCap: 1e9, active: true, activated: true, activeFromTurn: 0, channel: 'enterprise', spec: { product: 'business' } };
  s.models.push(model);
  assert.equal(growthMultiplier(s, model), 0.8);           // Lodestar is in business
  s.firsts.products.business = { labs: ['player'], turn: 0 };
  assert.equal(growthMultiplier(s, model), 0.8 * 1.1);
});

test('served share: half the serving need met means half the growth', () => {
  // Build a state whose computeSlices(state) gives serving = need / 2 with coverWithSpot off
  // (set state.compute.split.servingCap to half of state.compute.servingUnits), then assert
  // growthMultiplier(s, model) equals crowding × 0.5.
});
```

Write the second test's body concretely by setting `s.compute.online = 100`, `s.compute.split.safety = 0`,
`s.compute.servingUnits = 10`, `s.compute.split.servingCap = 5`, `s.compute.split.coverWithSpot = false`, and
asserting `growthMultiplier(s, model)` is `0.8 * 0.5` (check `computeSlices(s)` gives serving 5 and need 10 first; if
automation's control units take part of `online`, raise `online` until they do).

`tests/split.test.js`:

```js
test('outage losses are recorded per model', () => {
  // Reuse this file's outage setup (search "outage"); after applySplitEffects, each live model's lostToOutage
  // equals its users before minus after.
});
```

Write the body by copying the file's existing outage test setup and adding the `lostToOutage` assertion.

Rival firsts (in the file that tests `landRivals`, search `landRivals` under `tests/`):

```js
test('a rival launch that lands claims its era product first', () => {
  const s = createInitialState();
  s.rivalLaunches = [{ id: 'lodestar', gain: 1, heat: 0, day: s.day }];
  landRivals(s);
  assert.ok(holdsFirst(s, 'products', 'business', 'lodestar'));
});
```

`tests/ui-finance.test.js`: add a case that the planner's projected users for a crowded product grow slower than for
an empty one (two otherwise identical models, `business` in era 1 vs `agent` in era 4).

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

`sim/economy.js`: import `{ FIRST_MOVER, crowding, holdsFirst, productOf } from './data/products.js'` and
`computeSlices` from `./split.js` (already importing from it). Add:

```js
// Crowding, the first-mover bonus and the served share of serving need (spec sections 7, 9, 10).
export function growthMultiplier(state, model) {
  const product = productOf(model);
  const slices = computeSlices(state);
  const served = state.compute.split.coverWithSpot || slices.need <= 0 ? 1 : Math.min(1, slices.serving / slices.need);
  const first = holdsFirst(state, 'products', product, 'player') ? FIRST_MOVER.growth : 1;
  return crowding(state, product) * first * served;
}
```

In `growUsers`, compute `const mult = growthMultiplier(state, m);` inside the loop and use
`const g = (0.12 * PRICE_STANCE[m.priceStance].growth + (state.growthBoost ?? 0)) * (months / 3) * mult;`.

`sim/split.js` `applySplitEffects`: replace the user-loss loop with

```js
    for (const m of activeModels(state)) {
      const lost = Math.round(m.users * loss);
      m.users -= lost;
      m.lostToOutage = (m.lostToOutage ?? 0) + lost;
    }
```

`sim/rivals.js`: import `{ claimFirsts, rivalProduct } from './data/products.js'`. In `landRivals`, after
`r.capability = capability;` add `claimFirsts(state, r.id, rivalProduct(r.id, state.era), []);`.

`ui/logic/finance.js`: import `growthMultiplier` from `../../sim/economy.js`; add `market: growthMultiplier(state, m)` to
the `users` map at line ~201, and in the growth line at ~256 multiply the rate:
`(1 + (0.12 * m.growth + boost) * (months / 3) * m.market)`.

- [ ] **Step 4: Run to verify pass**, then `npm test`.

- [ ] **Step 5: Commit**

```bash
git add sim/economy.js sim/split.js sim/rivals.js ui/logic/finance.js tests/
git commit -m "feat(sim): growth follows crowding, first mover and served share; outage losses per model; rival firsts"
```

---

### Task 8: Release features

**Files:**
- Modify: `sim/data/products.js` (add `RELEASE_FEATURES`, `RIVAL_FEATURES`)
- Modify: `sim/appeal.js` (add `featureAppeal`, `featureServing`)
- Modify: `sim/release.js` (`releaseModel`: `release.features`)
- Modify: `sim/serving.js` (`servingCost` feature multiplier)
- Modify: `sim/turn.js` (rival feature schedule at the round mark)
- Modify: `sim/data/realEvents.js` (`voiceLikeness` trigger)
- Test: `tests/appeal.test.js`, `tests/release.test.js`, `tests/serving.test.js`, `tests/real-events.test.js`

**Interfaces:**
- Consumes: Tasks 1, 2, 6.
- Produces: `RELEASE_FEATURES: { [id]: { name, era, cash, serving, appeal: { [productId]: number }, mx? } }`;
  `RIVAL_FEATURES: { feature, rival, era, turnInEra }[]`; `featureAppeal(product, ids) → number`;
  `featureServing(state, lab, id) → number`; release move field `release.features: string[]` (max `FEATURE_SLOTS`);
  `spec.features: { id, serving }[]`; `claimRivalFeatures(state)` exported from `sim/appeal.js`.

- [ ] **Step 1: Write the failing tests**

`tests/appeal.test.js`:

```js
import { featureAppeal, featureServing, claimRivalFeatures } from '../sim/appeal.js';

test('feature appeal is the sum of the product values', () => {
  assert.equal(featureAppeal('chat', ['search', 'voice']), 2);
  assert.equal(featureAppeal('coding', ['voice']), 0);
  assert.equal(featureAppeal('business', ['memory', 'deepResearch']), 1.5);
});

test('the first lab with a feature serves it for a quarter less of its extra cost', () => {
  const s = createInitialState();
  assert.equal(featureServing(s, 'player', 'computerUse'), 1.3);
  s.firsts.features.computerUse = { labs: ['lodestar'], turn: 0 };
  assert.equal(featureServing(s, 'player', 'computerUse'), 1.4);
});

test('rivals claim features on their schedule', () => {
  const s = createInitialState();
  s.era = 2; s.turnInEra = 2;
  claimRivalFeatures(s);
  assert.ok(holdsFirst(s, 'features', 'search', 'openbrain'));
  assert.ok(!s.firsts.features.voice);
});
```

`tests/release.test.js`:

```js
test('release features cost cash, raise fit for products that want them, and are baked into the spec', () => {
  const s = trainedState();
  s.era = 2;
  const cash = s.cash;
  const r = releaseModel(s, { picks: [], features: ['search', 'voice'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 }, rng);
  assert.ok(r.ok, r.error);
  assert.equal(cash - s.cash, 15);
  assert.deepEqual(r.model.spec.features.map((f) => f.id), ['search', 'voice']);
  assert.deepEqual(r.model.appeal.features, ['search', 'voice']);
});

test('release features are checked: known, open, at most two, no repeats', () => {
  const s = trainedState();
  const base = { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };
  assert.match(releaseModel(structuredClone(s), { ...base, features: ['memory'] }, rng).error, /Memory opens in era 3/);
  assert.match(releaseModel(structuredClone(s), { ...base, features: ['teleport'] }, rng).error, /unknown feature teleport/);
  s.era = 4;
  assert.match(releaseModel(structuredClone(s), { ...base, features: ['search', 'voice', 'memory'] }, rng).error, /at most 2 features/);
  assert.match(releaseModel(structuredClone(s), { ...base, features: ['search', 'search'] }, rng).error, /twice/);
});
```

`tests/serving.test.js`:

```js
test('release features multiply serving cost', () => {
  const base = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoning: 'off', product: 'chat' };
  near(servingCost({ ...base, features: [{ id: 'voice', serving: 1.3 }] }, 2, 0) / servingCost(base, 2, 0), 1.3);
});
```

`tests/real-events.test.js`: the `voiceLikeness` trigger needs a live model with the `voice` feature (search the file
for how other triggers are tested and add one case with and one without the feature).

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

`sim/data/products.js`:

```js
// Features added at release (spec section 5). serving multiplies the model's serving cost; appeal per product.
export const RELEASE_FEATURES = {
  search: { name: 'Web search', era: 2, cash: 5, serving: 1.1, appeal: { chat: 1, business: 1, coding: 0.5, agent: 0.5, science: 0.5 } },
  voice: { name: 'Voice', era: 2, cash: 10, serving: 1.3, appeal: { chat: 1 } },
  memory: { name: 'Memory', era: 3, cash: 5, serving: 1.15, appeal: { chat: 1, business: 0.5, agent: 0.5 } },
  computerUse: { name: 'Computer use', era: 4, cash: 20, serving: 1.4, appeal: { business: 0.5, coding: 0.5, agent: 1 }, mx: 2 },
  deepResearch: { name: 'Deep research', era: 4, cash: 10, serving: 1.5, appeal: { business: 1, coding: 0.5, science: 1 } },
};
// When a rival ships each feature first (turnInEra is 0-based: round 3 of era 2 is turnInEra 2).
export const RIVAL_FEATURES = [
  { feature: 'search', rival: 'openbrain', era: 2, turnInEra: 2 },
  { feature: 'voice', rival: 'openbrain', era: 2, turnInEra: 3 },
  { feature: 'memory', rival: 'deepthink', era: 3, turnInEra: 3 },
  { feature: 'computerUse', rival: 'lodestar', era: 4, turnInEra: 1 },
  { feature: 'deepResearch', rival: 'deepthink', era: 4, turnInEra: 0 },
];
```

`sim/appeal.js` (add imports `FIRST_MOVER, RELEASE_FEATURES, RIVAL_FEATURES, claimFirsts`):

```js
export const featureAppeal = (product, ids) => ids.reduce((sum, id) => sum + (RELEASE_FEATURES[id]?.appeal[product] ?? 0), 0);

// A lab that holds (or can still take) a feature's first serves it for a quarter less of its extra cost.
export function featureServing(state, lab, id) {
  const { serving } = RELEASE_FEATURES[id];
  const claimed = state.firsts?.features?.[id];
  const first = !claimed || holdsFirst(state, 'features', id, lab);
  return first ? Math.round((1 + (serving - 1) * (1 - FIRST_MOVER.featureExcessCut)) * 1000) / 1000 : serving;
}

// Round mark: rivals ship the features their schedule names for this round.
export function claimRivalFeatures(state) {
  for (const row of RIVAL_FEATURES) {
    if (row.era === state.era && row.turnInEra === state.turnInEra) claimFirsts(state, row.rival, null, [row.feature]);
  }
}
```

`sim/release.js` `releaseModel`, in the validation block (before `if (errors.length)`):

```js
  const features = release.features ?? [];
  if (!Array.isArray(features)) errors.push('features must be a list');
  else {
    if (features.length > FEATURE_SLOTS) errors.push(`at most ${FEATURE_SLOTS} features`);
    if (new Set(features).size !== features.length) errors.push('a feature is picked twice');
    for (const id of features) {
      const feature = RELEASE_FEATURES[id];
      if (!feature) errors.push(`unknown feature ${id}`);
      else if (feature.era > state.era) errors.push(`${feature.name} opens in era ${feature.era}`);
    }
  }
```

Add the feature cash to the cash check: `const cash = cards.reduce(...) + features.reduce((s, id) => s + RELEASE_FEATURES[id].cash, 0);`.
After `spec` is built: `spec.features = features.map((id) => ({ id, serving: featureServing(state, 'player', id) }));`.
Fit: `const fitWithFeatures = Math.min(1, fit + FEATURE_FIT * featureAppeal(product, features));` and use it for
`fitUsers` and `appeal.fit`; set `appeal.features = [...features]`. Misuse:
`state.misuseExposure += features.reduce((s, id) => s + (RELEASE_FEATURES[id].mx ?? 0), 0);`.

`sim/serving.js` `servingCost`: `const features = (spec.features ?? []).reduce((m, f) => m * f.serving, 1);` and
multiply `perMillion` by `features`.

`sim/turn.js`: import `claimRivalFeatures` from `./appeal.js`; call it at the round mark right after
`announceTargets(state);` (next to `activateReleases(state);`).

`sim/data/realEvents.js` `voiceLikeness` trigger: replace `liveConsumerModels(state).length > 0` with
`liveConsumerModels(state).some((model) => (model.spec.features ?? []).some((f) => f.id === 'voice'))`, and apply
its effects to those models.

- [ ] **Step 4: Run to verify pass**, then `npm test`.

- [ ] **Step 5: Commit**

```bash
git add sim/data/products.js sim/appeal.js sim/release.js sim/serving.js sim/turn.js sim/data/realEvents.js tests/
git commit -m "feat(sim): release features with serving cost, product appeal, first-mover discount and a rival schedule"
```

---

### Task 9: Agent risk, verdicts, cheap to run, product labels and feed pools

**Files:**
- Modify: `sim/release.js` (misalignment condition; `cheapToRun`)
- Modify: `sim/appeal.js` (`costPerDollar`)
- Modify: `sim/launch.js` (`verdict` on the launch result), `sim/data/launch.js` (`cheapToRun` reaction)
- Modify: `sim/feed.js`, `sim/feedLive.js`, `sim/data/feed.js` (and `sim/data/feedReactions.js` if it keys pools by channel)
- Modify: `ui/logic/money.js`, `ui/screens/finance.js`, `ui/screens/reveal.js` (labels only)
- Modify: `sim/data/constitution.js` (privacy effect text; coordinate with `gn-constitution`)
- Test: `tests/release.test.js`, `tests/launch.test.js`, `tests/feed.test.js`, `tests/feedLive.test.js`, `tests/ui-finance.test.js`, `tests/ui-history.test.js`

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces: `costPerDollar(spec, era, model) → number`; `model.cheapToRun: boolean`;
  `launch.verdict: string`; reception pools `coding`, `agent`, `science` keyed by product.

- [ ] **Step 1: Write the failing tests**

`tests/release.test.js`:

```js
test('an autonomous agent product faces the misalignment check without agentic training', () => {
  const s = trainedState();
  s.era = 4;
  s.pendingModel.product = 'agent';
  s.alignmentDebt = 1000;
  s.pendingModel.capability = 90;
  const r = releaseModel(s, { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 }, { ...rng, chance: () => true });
  assert.equal(s.ending, 'misalignment');
});
```

(If deterministic-endings A10 replaced the chance roll with a score threshold, set the debt so the score passes it
and drop the rng override.)

`tests/launch.test.js`:

```js
test('the verdict names the product and its heaviest missing signal', () => {
  // Release a chat model whose appeal.missing is ['character training', ...] and assert
  // r.model.launch.verdict === 'A solid chat app, weak on character training.'
  // With nothing missing: 'A complete chat app.'
});
```

Write the body with a trained state (copy `trainedState` from `tests/release.test.js`) and an era-2 recipe missing a
character card.

`tests/ui-finance.test.js` / `tests/ui-history.test.js`: a coding-tool model is labelled "Coding tool", never
"business".

`tests/feed.test.js`: a coding tool's reception includes a post from the coding pool (`@merge_conflict`,
`@ship_friday` or `@local_host`); an agent product's includes one from the new agent pool.

- [ ] **Step 2: Run to verify failure** → FAIL.

- [ ] **Step 3: Implement**

`sim/release.js` misalignment: `if ((flags.includes('agentic') || product === 'agent') && state.era >= MISALIGNMENT_CHECK_ERA) {`
(apply to whatever form deterministic-endings A10 left; keep its threshold).

`sim/appeal.js`:

```js
import { servingCost } from './serving.js';
import { revenuePerUser } from './economy.js';

// Serving cost per revenue dollar at light load, so products with different prices compare fairly (spec section 9).
export const costPerDollar = (spec, era, model) => servingCost(spec, era, 0) / Math.max(1e-9, revenuePerUser(model));
```

In `releaseModel`, before `scoreLaunch`:

```js
  const priced = { product, priceStance: release.price, revenueMult: product === 'chat' && hasLine(state, 'no-wmd') ? 0.97 : 1, eraPrice: ERA_PRICE?.[state.era - 1] ?? 1 };
  const mine = costPerDollar(spec, state.era, priced);
  const live = activeModels(state).map((other) => costPerDollar(other.spec, state.era, other));
  const cheapToRun = live.length >= 2 && [mine, ...live].sort((a, b) => a - b).indexOf(mine) < Math.ceil((live.length + 1) / 3);
```

(Drop `eraPrice` if `gn-model-money` is not in; import `activeModels` from `./serving.js`.) Pass `cheapToRun`,
`product` and `missing` into `scoreLaunch`'s model argument and store `cheapToRun` on the model.

`sim/launch.js` `scoreLaunch`: import `PRODUCTS`; after `pressAvg`:

```js
  const productName = PRODUCTS[model.product ?? 'business'].name.toLowerCase();
  const verdict = model.missing?.length
    ? `A solid ${productName}, weak on ${model.missing[0]}.`
    : `A complete ${productName}.`;
```

and return `verdict` in the result. `sim/data/launch.js` `REACTIONS`: add
`{ when: (c) => c.model.cheapToRun, handle: '@unit_economics', text: (c) => `${c.model.name} is cheap to run. the margins will get noticed.` },`
near the top so it is among the first five matches.

Feed: in `sim/feed.js` `receptionPools`, key by product: `const product = productOf(model); if (RECEPTION_POSTS.products?.[product]) specific.push(...RECEPTION_POSTS.products[product]);`
and in `sim/data/feed.js` rename `channels` to `products` with keys `chat` (today's `consumer` posts), `business`
(today's `enterprise`), `coding` (today's `agent` posts), and new `agent` and `science` pools:

```js
    agent: [
      { handle: '@ops_on_call', text: '{model} ran my whole onboarding checklist overnight. i am unsure how i feel.' },
      { handle: '@audit_trail', text: 'asked {model} what it changed. it gave me a list. the list was correct.' },
      { handle: '@cautious_cto', text: 'we let {model} book travel. it booked the cheap flights and the right hotel.' },
    ],
    science: [
      { handle: '@postdoc_pipettes', text: '{model} suggested an experiment my advisor called obvious. nobody had run it.' },
      { handle: '@journal_club', text: 'read a {model} literature review. fewer made-up citations than my students.' },
      { handle: '@bench_to_bedside', text: '{model} found the dosing error in our protocol. we are rerunning it.' },
    ],
```

In `sim/feedLive.js` (lines ~112–129), map the product to the live pools the same way (chat → today's consumer pools
including `L.artists`; business and coding → today's enterprise pool until writers add coding lines; agent and
science → enterprise). If `sim/data/feedReactions.js` keys by channel, search `grep -n "consumer\|enterprise" sim/data/feedReactions.js`
and map by product.

Labels: `ui/logic/money.js` passes `product: productOf(model)` and `productName: PRODUCTS[...].name` alongside
`channel`; `ui/screens/finance.js` line ~258 prints `${(m.users / 1e6).toFixed(1)}M ${m.productName.toLowerCase()} users`;
`ui/screens/reveal.js` margin line already reads `data.channel`, which `priceSheet` now fills with the product name.

`sim/data/constitution.js`: the privacy line's effect text becomes "Business assistants attract more users". Message
`gn-constitution` before committing if its branch still owns that file.

- [ ] **Step 4: Run to verify pass**, then `npm test`.

- [ ] **Step 5: Commit**

```bash
git add sim/ ui/ tests/
git commit -m "feat(sim): agent products face the misalignment check; verdicts, cheap-to-run, product labels and feed pools"
```

---

### Task 10: Bots, the valuation race and before/after measurements

**Files:**
- Modify: `tools/balance.js` (products for every bot; five new bots; valuation race)
- Modify: `ui/logic/scenarios.js`, `tests/helpers/policy.js`, `tools/demo-seeds.js`
- Modify: `tests/balance.test.js` (`PROBES`), `tests/demo-seeds.test.js` if its expectations shift
- Create: `docs/superpowers/plans/2026-09-26-model-appeal-measurements.md`

**Interfaces:**
- Consumes: everything above; `pickableProducts`, `waveProduct`, `crowding`, `RELEASE_FEATURES` from
  `sim/data/products.js`.
- Produces: bot prefs fields `product(state) → productId` and `features(state, product) → featureId[]`;
  `productRace(n) → { [bot]: { wins, meanValuation } }` exported from `tools/balance.js`.

- [ ] **Step 1: Record the "before" numbers**

On the commit before Task 1 (`git stash` is not needed; use a second worktree on `origin/ui`):
`git worktree add /tmp/appeal-before origin/ui && (cd /tmp/appeal-before && node tools/balance.js 200 > /tmp/appeal-before.json)`
(use your scratchpad directory instead of `/tmp` if one is set). Copy the ending counts and per-era ARR per bot into
the measurements file under "Before". Remove the temporary worktree afterwards with `git worktree remove`.

- [ ] **Step 2: Write the failing test** (`tests/balance.test.js`)

```js
import { STRATEGIES, PROBES, productRace } from '../tools/balance.js';

test('the five product bots exist and are probes', () => {
  for (const name of ['waveRider', 'nicheSeeker', 'loyalChat', 'featureStacker', 'leanChat']) {
    assert.ok(STRATEGIES[name], name);
    assert.ok(PROBES.includes(name), name);
  }
});

test('the product race reports wins and mean valuation per bot', () => {
  const race = productRace(3);
  assert.equal(Object.keys(race).length, 5);
  assert.equal(Object.values(race).reduce((sum, row) => sum + row.wins, 0), 3);
});
```

Run: `node --test tests/balance.test.js` → FAIL.

- [ ] **Step 3: Implement**

In `tools/balance.js` import `{ pickableProducts, waveProduct, crowding, PRODUCTS, RELEASE_FEATURES, DEFAULT_PRODUCT } from '../sim/data/products.js'`.

Products on recipes: in `preferredRecipe` and `bestRecipe`, add `product: pickProduct(state, prefs)` to the recipe,
with

```js
function pickProduct(state, prefs) {
  const wanted = prefs.product?.(state) ?? DEFAULT_PRODUCT;
  return pickableProducts(state).includes(wanted) ? wanted : DEFAULT_PRODUCT;
}
```

Features on releases: in `makeStrategy`'s release move add
`features: (prefs.features?.(planned, productOfPending(planned)) ?? []).filter((id) => RELEASE_FEATURES[id].era <= planned.era).slice(0, 2)`,
with `const productOfPending = (s) => s.pendingModel?.product ?? DEFAULT_PRODUCT;`.

Existing bots keep their meaning: remove `'channel-app'`/`'channel-api'` from their `release` lists and add
`product: () => 'chat'` to `speedPrefs` and `balancedPrefs` (they launched consumer apps), `product: () => 'business'`
to `safetyPrefs` (API only). `random` picks `product: (s) => rng.pick(pickableProducts(s))`.

The five new bots share `balancedPrefs` and differ only in product and features (plus `leanChat`'s efficient spec):

```js
const waveRider = makeStrategy('balanced', { ...balancedPrefs, product: (s) => waveProduct(s.era) }, { offer: 'cheapest', queue: 'standard', grid: true });
const nicheSeeker = makeStrategy('balanced', {
  ...balancedPrefs,
  product: (s) => pickableProducts(s).filter((id) => id !== waveProduct(s.era))
    .sort((a, b) => crowding(s, b) - crowding(s, a) || PRODUCTS[b].users * PRODUCTS[b].price - PRODUCTS[a].users * PRODUCTS[a].price)[0],
}, { offer: 'cheapest', queue: 'standard', grid: true });
const loyalChat = makeStrategy('balanced', { ...balancedPrefs, product: () => 'chat' }, { offer: 'cheapest', queue: 'standard', grid: true });
const featureStacker = makeStrategy('balanced', {
  ...balancedPrefs,
  product: () => 'chat',
  features: (s) => Object.entries(RELEASE_FEATURES).filter(([, f]) => f.era <= s.era).sort((a, b) => b[1].cash - a[1].cash).map(([id]) => id),
}, { offer: 'cheapest', queue: 'standard', grid: true });
const leanChat = makeStrategy('balanced', {
  ...balancedPrefs,
  product: () => 'chat',
  pre: ['sparse-moe', 'moe', 'filtered-data', 'stability'],
  release: ['fp4', 'fp8', 'eval-full'],
}, { offer: 'cheapest', queue: 'standard', grid: true });
```

Add the five to `STRATEGIES` and to `PROBES`. Add the valuation race:

```js
export const PRODUCT_BOTS = ['waveRider', 'nicheSeeker', 'loyalChat', 'featureStacker', 'leanChat'];

// Same seeds for all five: which product policy ends with the best valuation (spec section 13 pass condition).
export function productRace(n) {
  const race = Object.fromEntries(PRODUCT_BOTS.map((name) => [name, { wins: 0, valuationSum: 0 }]));
  for (let seed = 1; seed <= n; seed++) {
    const finals = PRODUCT_BOTS.map((name) => [name, simulate(name, seed).valuation ?? 0]);
    finals.sort((a, b) => b[1] - a[1]);
    race[finals[0][0]].wins += 1;
    for (const [name, valuation] of finals) race[name].valuationSum += valuation;
  }
  return Object.fromEntries(Object.entries(race).map(([name, row]) => [name, { wins: row.wins, meanValuation: row.valuationSum / n }]));
}
```

In `report()`, add `meanValuation` per strategy (sum `state.valuation` over seeds). At the bottom of the CLI entry
(where `report` is printed), also print `productRace(n)`.

`ui/logic/scenarios.js` (lines ~16, 40, 205, 227), `tests/helpers/policy.js` (line ~12) and `tools/demo-seeds.js`:
remove channel cards from release lists and put `product` on their recipes (`'business'` where they picked
`channel-api`, `'chat'` where they picked `channel-app`).

- [ ] **Step 4: Run tests, then measure**

Run: `npm test` → PASS (update `tests/demo-seeds.test.js` expectations only if the seeds' outcomes shifted, and say
so in the commit message).
Run: `node tools/balance.js 200 > <scratchpad>/appeal-after.json`. Record in the measurements file under "After":
ending counts and per-era ARR per bot (compare with "Before"), the product race (wins and mean valuation per bot),
how often the player claimed each product first, average press (watch `bigClaim` and sentiment), and serving load.

**Pass condition (spec section 13):** each of the five product bots wins some share of the 200 seeds, and none wins
more than half. If it fails, do not tune in this task: write the failure and the numbers into the measurements file
and stop for the owner (the retune is a separate, owner-approved step).

- [ ] **Step 5: Commit**

```bash
git add tools/balance.js ui/logic/scenarios.js tests/helpers/policy.js tools/demo-seeds.js tests/ docs/superpowers/plans/2026-09-26-model-appeal-measurements.md
git commit -m "test(balance): product bots, valuation race and before/after measurements for model appeal"
```

---

## After the last task

- Run the pre-merge review the owner's global rules ask for (the owner has said Game Night reviews run as Opus
  subagents, not Codex): one review of the whole branch diff against `origin/ui`, fix Critical and Important findings
  in one wave, re-verify, record outcomes in the measurements file.
- Then write the screens plan (product picker with wave mark and rivals, fit meter with missing signals, feature
  slots, capacity forecast, receipt, finance rows) — load the `design` skill first, show the owner rendered mockups,
  and land both plans together.
