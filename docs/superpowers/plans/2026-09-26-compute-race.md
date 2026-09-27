# Compute Race (B + C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Per the owner's delegation rules, implementation tasks go to Codex first (`codex exec -m gpt-5.6-sol -s workspace-write -C ~/worktrees/game-night-ai-lab-compute-race`); UI tasks that need the design skill and screenshots go to an Opus subagent in a worktree.

**Goal:** Rivals hold compute, train on the player's own model-size ladder, and take cards from one shared deal board that the player can see and deny, so falling behind is possible again and the race reads the same for everyone.

**Architecture:** Rival fleets, targets, model size and launch gain live in `sim/rivals.js`, with first-pass numbers in a new `sim/data/race.js`. A new `sim/rivalDeals.js` names cards after each round's offers go up and takes them at the next round mark; `sim/contracts.js` keeps untaken cards between rounds. `sim/turn.js` (owned by gn-realtime) gains two calls. The UI adds a race tab in the HUD lane's Compute dialog and banners on the deal board.

**Tech Stack:** Plain ES modules, `node --test`, no dependencies. The game is served as static files (`python3 -m http.server 8741` from the worktree root).

**Spec:** `docs/superpowers/specs/2026-09-26-compute-race-design.md` (sections 2, 3, 6 and 7). Review page with the mockup copy: `docs/design/mockups/compute-race/plan.html`. Prototype: `docs/design/mockups/compute-race/prototype/`.

## Global Constraints

- Rival launches keep **the same random calls in the same order** as today: one `rng.next()` per rival per mark, plus one `rng.int(0, 4)` when it launches. Nothing else in the compute race draws from any random stream: card picks and off-board growth are deterministic ("No dice"). No new `sideRng` salts. (The spec's "salts 10 and 11" are dropped: 9 + card index already covers them in `sim/events.js` `stampNewCards`, and nothing needs them.)
- `FRONTIER = [25, 50, 150, 400, 450]`; `appetite = speed × (1.1 − 0.4 × caution)`; `safety = 0.05 + 0.25 × caution`; training units `= fleet × (1 − safety) × 0.7`.
- Launch gain `= (baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + roll − 2) × (1 − 0.5 × (0.1 + 0.2 × caution))`, `RIVAL_EDGE = −2`; no size fits: gain 2. XL only from era 2.
- Starting fleets (from the prototype; the spec does not list them): OpenBrain 14, Lodestar 10, DeepThink 12, Qilin 11.
- Off-board growth: a quarter of each rival's remaining shortfall, arriving next round. Qilin never takes a board card.
- Standing: `0.6 × (rounds within 0.5 of the top score ÷ the most any lab has) + 0.4 × compute share`. A rival ranks above the player if its score is more than 0.5 higher; within 0.5 the higher standing ranks higher; equal standing goes to the player.
- Race heat: +2 when a deal adds 25% or more to the signing lab's fleet (player included); +2 more when the player signs a card a rival named.
- Summit: a binding compute cap limits each signing rival's launch gain to 5.
- The design breaks the ±5-points-per-ending balance rule on purpose (owner decision 4). Every mechanic change is still measured with the bots before and after (memory rule "check mechanic dynamics").
- Do not merge into `ui` before 2026-09-27 12:00 AM PT; hand the SHA to gn-merge after that, unless the owner says otherwise.
- Copy rules: plain words, sentence case, full sentences in boxes and banners; no dice language ("rolls", "chance") for card picks.

## Choices this plan makes (not spelled out in the spec)

These are defaults picked while planning. Each is small to change; the owner may overrule any of them.

1. **Queue orders are capped at today's size.** The spec says rival queue orders follow their shortfall. Uncapped, OpenBrain's prepaid order in era 3 (a shortfall of about 106 to 125 units) would take the whole 56-unit supply every turn, so standard orders, including the player's, would never fill. The prototype never built this rule. This plan uses `min(shortfall, today's speed-relative order)`: a rival that is nearly full orders less, and the queue is never tighter than today.
2. **Which cards persist.** Only the six unit cards a rival can take (Verde, Azuria cloud, CoreFlame, spot, Gulf, the letter of intent) stay between rounds. The Azuria investment, the grid reservation and the queue entry are priced from the player's own state, so they are made fresh every round, as today.
3. **Fallbacks never steal another rival's named card.** Each rival's second choice comes from the cards nobody named. Two rivals can share a fallback; the one earlier in catch-up order gets it, and the other goes without a board card that round.
4. **Constants go in a new `sim/data/race.js`**, not `sim/balance.js`, following `sim/data/compute.js`. gn-merge and gn-realtime both edit `sim/balance.js` tonight; a separate file avoids conflicts.
5. **The "who can train what" advisor line** goes on the deal screen's advisor opinions (`ui/logic/compute.js`), which already read the state. The pools in `sim/data/advisorLines.js` are mood-banded random picks with no state, so a line naming sizes does not fit there.
6. **Standing is recorded once per round mark**, before rival launches are rolled, inside `rivalDealsTurn`.

## Not in this plan

Era 4 rival power (owner decision 5: second pass), export controls halving Qilin's growth, the planner's leader-fleet line, and a fleet band under the history race chart. All are optional in the spec.

## File map

| File | Change | Owner |
|---|---|---|
| `sim/data/race.js` | new: race constants | this lane |
| `sim/rivals.js` | fleet, pipeline, target, safety, training, size, `launchGain`, standing, `rank`, `computeShares` | this lane |
| `sim/rivalDeals.js` | new: `announceTargets`, `takeTargets`, `offBoardGrowth`, `landRivalCompute`, `rivalDealsTurn` | this lane |
| `sim/contracts.js` | `refreshOffers`; heat on big deals and denial in `signOffer` | this lane |
| `sim/queue.js` | fills go to rival pipelines; orders capped by shortfall | this lane |
| `sim/state.js` | `compute.offersEra`, `race`, first announce | this lane |
| `sim/turn.js` | two calls at the round mark | **gn-realtime** (agree first) |
| `sim/feed.js`, `sim/data/feed.js` | posts for big rival deals and denial | this lane (check gn-feed's `feed-live` shape first) |
| `tools/balance.js` | race metrics; speed, safety and denier bots | this lane |
| `ui/logic/race.js`, `ui/screens/race.js` | new: race tab | this lane |
| `ui/screens/computeInfo.js` | default `race` tab, copy | **gn-hud-money** file, after it lands in `ui` |
| `ui/logic/compute.js`, `ui/screens/compute.js`, `ui/styles.css` | banners, fallback line, round's-end strip, summaries, advisor line | this lane |
| `tools/demo-seeds.js` | re-find demo seeds | **gn-merge** (tell them; do not edit) |
| tests | `tests/race.test.js` (new), `tests/ui-race.test.js` (new), `tests/state.test.js`, `tests/queue.test.js`, `tests/compute-turn.test.js`, `tests/ui-compute.test.js`, `tests/feed.test.js`, `tests/balance.test.js` | this lane |

---

### Task 0: Gate — build order, rebase, baseline

**Files:** none changed.

- [ ] **Step 1: Confirm the build order.** Read the lane inbox: `~/claude-sync/bin/claude-sync.sh inbox ~/Desktop/game-night-ai-lab gn-compute-race`. gn-realtime was asked (2026-09-26 17:40 PT) which SHA lands in `ui` tonight (`realtime-stage2` `4cc3fcd` or `realtime-tune`) and whether `realtime-tune` changes `rivalsTurn`, `landRivals` or the `rivalLaunches` shape again. The proposed order: gn-realtime's work lands in `ui` first, and this branch rebases on top after midnight. If there is no reply, plan against whatever is in `origin/ui` after 2026-09-27 00:00 PT.
- [ ] **Step 2: Check the HUD lane.** Tasks 9 to 11 need gn-hud-money's `ui/screens/computeInfo.js` in `ui` (branch `hud-money`, `129c731` or later). Run `git -C ~/worktrees/game-night-ai-lab-compute-race fetch origin && git merge-base --is-ancestor origin/hud-money origin/ui && echo in-ui`. If it is not in `ui` yet, build Tasks 1 to 8 first and wait.
- [ ] **Step 3: Rebase.**

```bash
cd ~/worktrees/game-night-ai-lab-compute-race && git fetch origin && git rebase origin/ui
```

Expected: no conflicts (this branch holds only docs so far).

- [ ] **Step 4: Baseline tests.** Run `npm test`. Record pass, fail and todo counts in the "Measurements" section at the end of this file. (On `ui` at `9d51f8e`: 797 tests, 793 pass, 0 fail, 4 todo, about 32 s.)
- [ ] **Step 5: Look at the landed `rivalsTurn`.** Run `sed -n '/export function rivalsTurn/,/^}/p' sim/rivals.js` and `grep -n "rivalsTurn\|legalTick(state" sim/turn.js`. Both the `ui` form and the stage 2 form contain the line `const uncappedGain = (5 + rng.int(0, 4)) * (1 + 0.1 * state.era);` and the line `for (const c of legalTick(state)) events.push(...)` in `endRound`. Tasks 2 and 5 anchor on those two lines. If either is missing, stop and ask gn-realtime what replaced it.

### Task 1: Race metrics in the balance report, and the "before" numbers

**Files:**
- Modify: `tools/balance.js` (`freshMetrics`, `simulateMeasured`, `report`)
- Test: `tests/balance.test.js`
- Create: `docs/design/mockups/compute-race/measurements/before.json`

**Interfaces:**
- Produces: `report(n)[name]` gains `leftBehindByEra` (object era → count), `roundsAtFirst` (share of rounds at rank 1, 0 to 1) and `rivalDealsPerRun` (mean count of `rivalDeal` events per run). Task 8 compares these.

- [ ] **Step 1: Write the failing test** (append to `tests/balance.test.js`):

```js
test('the report measures the compute race', () => {
  const r = balanceApi.report(3);
  for (const [name, row] of Object.entries(r)) {
    assert.equal(typeof row.leftBehindByEra, 'object', name);
    assert.ok(row.roundsAtFirst >= 0 && row.roundsAtFirst <= 1, `${name}: ${row.roundsAtFirst}`);
    assert.ok(row.rivalDealsPerRun >= 0, name);
  }
});
```

- [ ] **Step 2: Run it.** `node --test --test-name-pattern="measures the compute race" tests/balance.test.js`. Expected: FAIL (`leftBehindByEra` is undefined).
- [ ] **Step 3: Implement.** In `tools/balance.js`:

```js
function freshMetrics() {
  return { perEra: {}, queueShortTurns: 0, queueTurns: 0, rankAtEra4End: null, rejectedActions: 0, rounds: 0, roundsAtFirst: 0, rivalDeals: 0 };
}
```

In `simulateMeasured`, right after `metrics.rejectedActions += result.errors.length;`:

```js
    metrics.rounds += 1;
    if (rank(state) === 1) metrics.roundsAtFirst += 1;
    metrics.rivalDeals += result.events.filter((event) => event.type === 'rivalDeal').length;
```

In `report`, next to `cashEndingsByEra`: declare `const leftBehindByEra = {}; let rounds = 0; let roundsAtFirst = 0; let rivalDeals = 0;`. In the seed loop, after the `acquihire` line:

```js
      if (r.ending === 'leftBehind') leftBehindByEra[r.era] = (leftBehindByEra[r.era] ?? 0) + 1;
      rounds += metrics.rounds;
      roundsAtFirst += metrics.roundsAtFirst;
      rivalDeals += metrics.rivalDeals;
```

In `result[name]`, add:

```js
      leftBehindByEra,
      roundsAtFirst: rounds > 0 ? roundsAtFirst / rounds : 0,
      rivalDealsPerRun: rivalDeals / n,
```

- [ ] **Step 4: Run it.** Same command. Expected: PASS.
- [ ] **Step 5: Record the before numbers.**

```bash
mkdir -p docs/design/mockups/compute-race/measurements && node tools/balance.js 100 > docs/design/mockups/compute-race/measurements/before.json
```

Fill the "Before" rows of the Measurements table at the end of this file for `speed`, `safety`, `balanced`, `random`: left behind (total and by era), out of money (`acquihire`), misalignment, rounds at 1st, rank at the end of era 4. These replace the spec's §4 "today" column, which was taken on an older `ui`.

- [ ] **Step 6: Commit.**

```bash
git add tools/balance.js tests/balance.test.js docs/design/mockups/compute-race/measurements/before.json docs/superpowers/plans/2026-09-26-compute-race.md
git commit -m "feat(tools): the balance report measures the compute race; record the before numbers"
```

### Task 2: Rivals hold compute; model size sets the launch gain

**Files:**
- Create: `sim/data/race.js`
- Modify: `sim/rivals.js`
- Test: `tests/race.test.js` (new), `tests/state.test.js`

**Interfaces:**
- Produces (all exported from `sim/rivals.js`): `appetite(r) → number`, `rivalTarget(state, r) → number`, `rivalSafety(r) → number`, `rivalTraining(r) → number`, `rivalPending(r) → number`, `rivalShortfall(state, r) → number` (never below 0), `rivalSize(state, r) → 'small'|'medium'|'large'|'xl'|null`, `launchGain(state, r, roll) → number`. Each rival object gains `fleet: number`, `pipeline: Array<{ units, turn, supplier?, source }>`, `named: null | { offerId, fallback }`, `lastSize`.
- Produces (from `sim/data/race.js`): `FRONTIER, START_FLEET, RIVAL_EDGE, SERVING_ROOM, OFF_BOARD_SHARE, NO_SIZE_GAIN, CAPPED_GAIN, BIG_DEAL_SHARE, BIG_DEAL_HEAT, DENIAL_HEAT, STANDING_TIE, STANDING_WEIGHTS, BOARD_SUPPLIERS, RUMOR_PROGRESS`.

- [ ] **Step 1: Create `sim/data/race.js`:**

```js
// Compute race tables. Spec: docs/superpowers/specs/2026-09-26-compute-race-design.md §2.
// First-pass numbers from the prototype (docs/design/mockups/compute-race/prototype/); plan Task 8 re-measures them.
export const FRONTIER = [25, 50, 150, 400, 450]; // units a frontier-pace lab wants online, per era
export const START_FLEET = { openbrain: 14, lodestar: 10, deepthink: 12, qilin: 11 };
export const RIVAL_EDGE = -2; // very sensitive: +6 left 63–88 of 100 bot runs behind
export const SERVING_ROOM = 0.7; // share of a rival's non-safety compute it trains with; the rest serves users
export const NO_SIZE_GAIN = 2; // a launch when not even a Small model fits
export const CAPPED_GAIN = 5; // the Geneva compute cap, as sim/training.js applies it to the player
export const OFF_BOARD_SHARE = 0.25; // of a rival's remaining shortfall, arriving next round
export const BIG_DEAL_SHARE = 0.25; // a deal this big against the lab's fleet heats the race
export const BIG_DEAL_HEAT = 2;
export const DENIAL_HEAT = 2; // the player signs a card a rival named
export const STANDING_TIE = 0.5; // score points within which standing decides rank
export const STANDING_WEIGHTS = { top: 0.6, compute: 0.4 }; // first pass (owner 2026-09-26: compute is a background part)
export const BOARD_SUPPLIERS = ['verde', 'azuria', 'coreflame', 'spot', 'gulf', 'loi']; // cards a rival can take
export const RUMOR_PROGRESS = 0.45; // a rival past this share of its launch bar is rumored to launch soon
```

- [ ] **Step 2: Write the failing tests** in a new `tests/race.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { SIZE_CAP } from '../sim/recipe.js';
import { RIVAL_EDGE, NO_SIZE_GAIN } from '../sim/data/race.js';
import { rivalsTurn, rivalSize, rivalTraining, rivalShortfall, launchGain } from '../sim/rivals.js';

const rivalOf = (s, id) => s.rivals.find((r) => r.id === id);
const expectedGain = (r, size, roll) => (BALANCE.baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + roll - 2) * (1 - 0.5 * (0.1 + 0.2 * r.caution));

test('rivals start with fleets and want more as the era grows', () => {
  const s = createInitialState({ seed: 1 });
  assert.deepEqual(s.rivals.map((r) => r.fleet), [14, 10, 12, 11]);
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(rivalShortfall(s, ob) - (25 * 1.3 * (1.1 - 0.4 * 0.25) - 14)) < 1e-9);
  ob.pipeline.push({ units: 100, turn: 1, source: 'offBoard' });
  assert.equal(rivalShortfall(s, ob), 0, 'compute on the way counts; the shortfall never goes below 0');
});

test('a rival trains the largest size its training compute fits, on the player ladder', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(rivalTraining(ob) - 14 * (1 - (0.05 + 0.25 * 0.25)) * 0.7) < 1e-9);
  assert.equal(rivalSize(s, ob), 'medium'); // about 8.7 units: Medium needs 5, Large 10
  ob.fleet = 3;
  assert.equal(rivalSize(s, ob), null); // about 1.9 units: Small needs 2
  ob.fleet = 1000;
  assert.equal(rivalSize(s, ob), 'large', 'XL waits for era 2');
  s.era = 2;
  assert.equal(rivalSize(s, ob), 'xl');
});

test('launch gain comes from model size; no size fits gives 2', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(launchGain(s, ob, 3) - expectedGain(ob, 'medium', 3)) < 1e-9);
  ob.fleet = 3;
  assert.equal(launchGain(s, ob, 3), NO_SIZE_GAIN);
});

test('rival launches draw the same random numbers in the same order', () => {
  const s = createInitialState({ seed: 1 });
  const calls = [];
  const spy = { next: () => { calls.push('next'); return 0; }, int: (a, b) => { calls.push(`int:${a},${b}`); return a; } };
  s.rivals[0].progress = 0.99;
  rivalsTurn(s, spy);
  assert.deepEqual(calls, ['next', 'int:0,4', 'next', 'next', 'next']);
});

test('a binding compute cap limits each signing rival to 5 per launch', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  for (const r of s.rivals) r.fleet = 1000;
  s.deal = { collapsed: false, binding: ['computeCap'], signed: { computeCap: ['openbrain'] } };
  assert.equal(launchGain(s, rivalOf(s, 'openbrain'), 4), 5);
  assert.ok(launchGain(s, rivalOf(s, 'deepthink'), 4) > 5, 'a lab that did not sign keeps its full gain');
  s.deal.collapsed = true;
  assert.ok(launchGain(s, rivalOf(s, 'openbrain'), 4) > 5, 'a collapsed deal binds nobody');
});
```

- [ ] **Step 3: Run them.** `node --test tests/race.test.js`. Expected: FAIL (`rivalSize` is not exported).
- [ ] **Step 4: Implement in `sim/rivals.js`.** Add imports:

```js
import { SIZES, SIZE_UNITS, SIZE_CAP } from './recipe.js';
import { eraScale } from './data/compute.js';
import { FRONTIER, START_FLEET, RIVAL_EDGE, SERVING_ROOM, NO_SIZE_GAIN, CAPPED_GAIN } from './data/race.js';
```

Replace `createRivals`:

```js
export function createRivals() {
  return RIVAL_TEMPLATES.map((r) => ({ ...r, progress: 0, releases: 0, fleet: START_FLEET[r.id], pipeline: [], named: null, lastSize: null }));
}
```

Add after `leastCarefulRival`:

```js
// Compute race (spec 2026-09-26 §2 rules 1–2): every lab turns compute into models the way the player does.
export const appetite = (r) => r.speed * (1.1 - 0.4 * r.caution);
export const rivalTarget = (state, r) => FRONTIER[state.era - 1] * appetite(r);
export const rivalSafety = (r) => 0.05 + 0.25 * r.caution;
export const rivalTraining = (r) => r.fleet * (1 - rivalSafety(r)) * SERVING_ROOM;
export const rivalPending = (r) => r.pipeline.reduce((sum, p) => sum + p.units, 0);
export const rivalShortfall = (state, r) => Math.max(0, rivalTarget(state, r) - r.fleet - rivalPending(r));

export function rivalSize(state, r) {
  const units = rivalTraining(r);
  let best = null;
  for (const size of SIZES) {
    if (size === 'xl' && state.era < 2) continue;
    if (SIZE_UNITS[size] * eraScale(state.era) <= units) best = size;
  }
  return best;
}

// The Geneva cap binds a rival that signed it, as sim/training.js binds the player's runs. Read from state.deal
// directly: sim/summit.js imports this file, so importing dealBinds here would be a cycle.
const capBinds = (state, r) => state.deal?.collapsed === false && state.deal.binding.includes('computeCap')
  && (state.deal.signed?.computeCap ?? []).includes(r.id);

export function launchGain(state, r, roll) {
  const size = rivalSize(state, r);
  r.lastSize = size;
  const gain = size
    ? Math.max(0, (BALANCE.baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + roll - 2) * (1 - 0.5 * (0.1 + 0.2 * r.caution)))
    : NO_SIZE_GAIN;
  return capBinds(state, r) ? Math.min(gain, CAPPED_GAIN) : gain;
}
```

In `rivalsTurn`, replace exactly one line (present in both the `ui` and the stage 2 form):

```js
      const uncappedGain = (5 + rng.int(0, 4)) * (1 + 0.1 * state.era);
```

with:

```js
      const uncappedGain = launchGain(state, r, rng.int(0, 4));
```

Keep the variable name so the stage 2 deferred path (`state.rivalLaunches.push({ id: r.id, gain: uncappedGain, ... })`) needs no other edit.

- [ ] **Step 5: Pin today's launch gain in `tests/state.test.js`.** In the test "a rival that finishes its cycle releases and heats the race", replace `assert.ok(s.rivals[0].capability > 26);` with:

```js
  const size = 'medium'; // OpenBrain's 14 starting units train about 8.7: Medium
  const gain = (BALANCE.baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + 0 - 2) * (1 - 0.5 * (0.1 + 0.2 * 0.25));
  assert.ok(Math.abs(s.rivals[0].capability - (26 + gain)) < 1e-9);
```

and add to its imports `import { SIZE_CAP } from '../sim/recipe.js';` and `import { RIVAL_EDGE } from '../sim/data/race.js';`. If stage 2 has landed and `rivalsTurn` without `deferTo` still applies the gain at once, this holds as written; if the landed form always defers, read the gain from `s.rivalLaunches.at(-1).gain` instead of the capability.

- [ ] **Step 6: Run.** `node --test tests/race.test.js tests/state.test.js`. Expected: PASS. Then `npm test`. Expected: the only new failures are balance-band tests (the game now plays differently). Note each by name in the Measurements section; Task 8 deals with them. For any other failure, decide which it is: a test that pins the old rival behavior (a fixed launch gain, a rival capability after N turns) gets its expected value updated with a comment naming this plan; anything else is a bug to fix before committing.
- [ ] **Step 7: Commit.**

```bash
git add sim/data/race.js sim/rivals.js tests/race.test.js tests/state.test.js
git commit -m "feat(sim): rivals hold compute and train on the player's size ladder; the compute cap binds signing rivals"
```

### Task 3: At the top, standing decides

**Files:**
- Modify: `sim/rivals.js` (`rank`, new `computeShares`, `standing`, `recordStanding`), `sim/state.js`
- Test: `tests/race.test.js`

**Interfaces:**
- Produces: `computeShares(state) → { you, openbrain, lodestar, deepthink, qilin }` (shares of all online compute, summing to 1); `standing(state) → same keys, 0 to 1`; `recordStanding(state)` (adds 1 to `state.race.atTop[id]` for each lab within 0.5 of the top score); `rank(state)` keeps its signature. `state.race = { atTop: {} }`.

- [ ] **Step 1: Write the failing tests** (append to `tests/race.test.js`; add `rank, computeShares, recordStanding` to the `../sim/rivals.js` import):

```js
test('compute shares cover every lab and add up to 1', () => {
  const s = createInitialState({ seed: 1 });
  const shares = computeShares(s);
  assert.ok(Math.abs(shares.you - 10 / 57) < 1e-9); // 10 of 10 + 14 + 10 + 12 + 11
  assert.ok(Math.abs(Object.values(shares).reduce((a, b) => a + b, 0) - 1) < 1e-9);
});

test('each round mark counts the labs within half a point of the top', () => {
  const s = createInitialState({ seed: 1 });
  s.capability = 26.4; // OpenBrain 26 is within 0.5; DeepThink 24 is not
  recordStanding(s);
  recordStanding(s);
  assert.deepEqual(s.race.atTop, { you: 2, openbrain: 2 });
});

test('score ranks first; within half a point, standing decides and ties go to you', () => {
  const s = createInitialState({ seed: 1 });
  s.capability = 25.4; // OpenBrain 0.6 ahead
  assert.equal(rank(s), 2);
  s.capability = 26.3; // within 0.5, you are higher on score
  s.race.atTop = { you: 2, openbrain: 4 };
  assert.equal(rank(s), 2, 'OpenBrain got there first and stayed');
  s.race.atTop = { you: 4, openbrain: 4 };
  assert.equal(rank(s), 2, 'same time at the top: OpenBrain holds more compute (14 against your 10)');
  s.compute.online = 14;
  assert.equal(rank(s), 1, 'equal standing goes to you');
});
```

- [ ] **Step 2: Run.** `node --test tests/race.test.js`. Expected: FAIL (`computeShares` is not exported).
- [ ] **Step 3: Implement.** In `sim/rivals.js`, extend the race import with `STANDING_TIE, STANDING_WEIGHTS` and replace `rank`:

```js
export function computeShares(state) {
  const fleets = { you: state.compute.online, ...Object.fromEntries(state.rivals.map((r) => [r.id, r.fleet])) };
  const total = Object.values(fleets).reduce((sum, units) => sum + units, 0);
  return Object.fromEntries(Object.entries(fleets).map(([id, units]) => [id, total > 0 ? units / total : 0]));
}

// Spec §2 rule 6: once per round mark, every lab within half a point of the top score earns a round at the top.
export function recordStanding(state) {
  const atTop = (state.race ??= { atTop: {} }).atTop;
  const labs = [['you', state.capability], ...state.rivals.map((r) => [r.id, r.capability])];
  const top = Math.max(...labs.map(([, capability]) => capability));
  for (const [id, capability] of labs) if (top - capability <= STANDING_TIE) atTop[id] = (atTop[id] ?? 0) + 1;
}

export function standing(state) {
  const atTop = state.race?.atTop ?? {};
  const most = Math.max(0, ...Object.values(atTop));
  const shares = computeShares(state);
  return Object.fromEntries(Object.keys(shares).map((id) => [id,
    STANDING_WEIGHTS.top * (most > 0 ? (atTop[id] ?? 0) / most : 0) + STANDING_WEIGHTS.compute * shares[id]]));
}

// A rival ranks above you when it is more than half a point ahead; within half a point, the higher standing does.
export function rank(state) {
  const s = standing(state);
  return 1 + state.rivals.filter((r) => r.capability > state.capability + STANDING_TIE
    || (Math.abs(r.capability - state.capability) <= STANDING_TIE && s[r.id] > s.you)).length;
}
```

In `sim/state.js`, add `race: { atTop: {} },` right after `rivals: createRivals(),`.

- [ ] **Step 4: Run.** `node --test tests/race.test.js tests/state.test.js`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add sim/rivals.js sim/state.js tests/race.test.js
git commit -m "feat(sim): within half a point, standing decides rank (time at the top 60%, compute share 40%)"
```

### Task 4: One board — cards stay until signed or taken

**Files:**
- Modify: `sim/contracts.js` (new `refreshOffers`), `sim/state.js`
- Test: `tests/race.test.js`

**Interfaces:**
- Produces: `refreshOffers(state, rng) → offers[]`. It draws exactly what `generateOffers` draws, in the same order. `state.compute.offersEra` holds the era the board was made in.
- Consumes: `BOARD_SUPPLIERS` (Task 2).

- [ ] **Step 1: Write the failing test** (append to `tests/race.test.js`; add `import { refreshOffers } from '../sim/contracts.js';`):

```js
const flat = { next: () => 0.5, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };

test('board cards stay; a signed or taken slot refills; an era change makes a new board', () => {
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.supplier === 'verde');
  s.compute.offers = s.compute.offers.filter((o) => o.supplier !== 'coreflame'); // signed or taken
  s.turn = 1;
  s.compute.offers = refreshOffers(s, flat);
  assert.deepEqual(s.compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot']);
  assert.equal(s.compute.offers.find((o) => o.supplier === 'verde'), verde, 'the untaken card is the same card');
  assert.equal(s.compute.offers.find((o) => o.supplier === 'coreflame').id, 'coreflame-1', 'the empty slot refills');
  s.era = 2;
  s.turn = 4;
  s.compute.offers = refreshOffers(s, flat);
  assert.ok(s.compute.offers.every((o) => o.id.endsWith('-4')), 'a new era makes a new board');
});

test('the investment and the grid are always made fresh', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  s.compute.offersEra = 2;
  s.compute.offers = refreshOffers(s, flat);
  const equity = s.compute.offers.find((o) => o.supplier === 'azuriaEquity');
  s.valuation *= 2;
  s.turn = 5;
  s.compute.offers = refreshOffers(s, flat);
  const next = s.compute.offers.find((o) => o.supplier === 'azuriaEquity');
  assert.notEqual(next.id, equity.id);
  assert.ok(next.credits > equity.credits);
});
```

- [ ] **Step 2: Run.** `node --test tests/race.test.js`. Expected: FAIL (`refreshOffers` is not exported).
- [ ] **Step 3: Implement.** In `sim/contracts.js`, add `import { BOARD_SUPPLIERS } from './data/race.js';` and, after `generateOffers`:

```js
// Spec 2026-09-26 compute race §2 rule 3: board cards stay until signed or taken, a taken slot refills next round,
// and an era change makes a new board. The investment, the grid and the queue are priced from the player's own
// state, so they are made fresh every round. A full board is drawn either way, so the draws never change.
export function refreshOffers(state, rng) {
  const fresh = generateOffers(state, rng);
  const sameEra = state.compute.offersEra === state.era;
  state.compute.offersEra = state.era;
  if (!sameEra) return fresh;
  return fresh.map((offer) => (BOARD_SUPPLIERS.includes(offer.supplier)
    ? state.compute.offers.find((kept) => kept.supplier === offer.supplier) ?? offer
    : offer));
}
```

A card whose supplier drops out of the fresh board (Gulf when US favor falls) is dropped, because only suppliers in `fresh` are kept. In `sim/state.js`, add `offersEra: 1,` to the `compute` object after `offers: [],`.

- [ ] **Step 4: Run.** `node --test tests/race.test.js`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add sim/contracts.js sim/state.js tests/race.test.js
git commit -m "feat(sim): board cards stay until signed or taken; taken slots refill; a new era makes a new board"
```

(`refreshOffers` is wired into the round mark in Task 5, together with the card picks, so the board never persists without rivals taking from it.)

### Task 5: Rivals name cards, take them at the round's end, and grow off the board

**Files:**
- Create: `sim/rivalDeals.js`
- Modify: `sim/turn.js` (**gn-realtime's file**: two edits, agreed in Task 0), `sim/state.js`, `sim/contracts.js` (`signOffer` heat)
- Test: `tests/race.test.js`, `tests/compute-turn.test.js`

**Interfaces:**
- Consumes: `rivalShortfall`, `recordStanding` (Tasks 2 and 3); `refreshOffers` (Task 4); `BOARD_SUPPLIERS, BIG_DEAL_SHARE, BIG_DEAL_HEAT, DENIAL_HEAT, OFF_BOARD_SHARE`.
- Produces: `announceTargets(state)` sets `offer.wantedBy = rivalId` and `offer.fallback = offerId | null` on named cards, and `r.named = { offerId, fallback }` (or `null`) on every rival. `takeTargets(state) → events[]`. `offBoardGrowth(state)`. `landRivalCompute(state)`. `rivalDealsTurn(state) → events[]` (standing, landing, taking, growth, in that order). Event: `{ type: 'rivalDeal', id, supplier, units, arrivesTurn, fallback: boolean, big: boolean }`. `signOffer`'s result gains `denied: rivalId | null`, so the player's `deal` event carries it.

- [ ] **Step 1: Write the failing tests** (append to `tests/race.test.js`; add `import { announceTargets, takeTargets, offBoardGrowth, landRivalCompute, rivalDealsTurn } from '../sim/rivalDeals.js';` and `import { signOffer, sideRng } from '../sim/contracts.js';`):

```js
// Lodestar (22) picks first, then DeepThink (24), then OpenBrain (26). Era 1 shortfalls: Lodestar about 7.6,
// DeepThink about 11.6, OpenBrain about 18.5, Qilin about 16.6.
function board() {
  const s = createInitialState({ seed: 1 });
  s.compute.offers = [
    { id: 'verde-0', supplier: 'verde', units: 40, arrivesIn: 3, upfront: 0, monthly: 1, price: 0.85, termMonths: 24, string: null },
    { id: 'azuria-0', supplier: 'azuria', units: 12, arrivesIn: 1, upfront: 0, monthly: 1, price: 2, termMonths: 24, string: 'exclusive' },
    { id: 'coreflame-0', supplier: 'coreflame', units: 9, arrivesIn: 1, upfront: 0, monthly: 1, price: 0.75, termMonths: 12, string: 'fragile' },
    { id: 'spot-0', supplier: 'spot', units: 4, arrivesIn: 0, upfront: 0, monthly: 1, price: 4, termMonths: null, string: 'bumpable' },
  ];
  announceTargets(s);
  return s;
}
const offer = (s, id) => s.compute.offers.find((o) => o.id === id);

test('rivals name cards in catch-up order: careful labs the nearest, bold labs the biggest', () => {
  const s = board();
  assert.equal(offer(s, 'coreflame-0').wantedBy, 'lodestar'); // careful: 9 is nearest its 7.6
  assert.equal(offer(s, 'azuria-0').wantedBy, 'deepthink'); // caution 0.5 counts as careful: 12 is nearest 11.6
  assert.equal(offer(s, 'verde-0').wantedBy, 'openbrain'); // bold: the biggest card left
  assert.equal(offer(s, 'spot-0').wantedBy, undefined);
  for (const id of ['coreflame-0', 'azuria-0', 'verde-0']) assert.equal(offer(s, id).fallback, 'spot-0');
  assert.equal(rivalOf(s, 'qilin').named, null, 'Qilin never takes a board card');
});

test('a rival takes exactly the card it named', () => {
  const s = board();
  const heat = s.raceHeat;
  const events = takeTargets(s);
  assert.deepEqual(events.map((e) => [e.id, e.supplier, e.units, e.fallback]),
    [['lodestar', 'coreflame', 9, false], ['deepthink', 'azuria', 12, false], ['openbrain', 'verde', 40, false]]);
  assert.deepEqual(s.compute.offers.map((o) => o.id), ['spot-0'], 'the untaken card stays');
  assert.deepEqual(rivalOf(s, 'openbrain').pipeline, [{ units: 40, turn: s.turn + 3, supplier: 'verde', source: 'board' }]);
  assert.equal(rivalOf(s, 'lodestar').pipeline[0].turn, s.turn + 1);
  assert.equal(s.raceHeat, heat + 6, 'each deal adds a quarter or more to its fleet: +2 each');
});

test('sign a named card first and that rival takes its second choice', () => {
  const s = board();
  s.compute.offers = s.compute.offers.filter((o) => o.id !== 'azuria-0');
  const events = takeTargets(s);
  assert.deepEqual(events.find((e) => e.id === 'deepthink'), { type: 'rivalDeal', id: 'deepthink', supplier: 'spot', units: 4, arrivesTurn: s.turn + 1, fallback: true, big: true });
});

test('two rivals share a fallback: the one earlier in catch-up order gets it', () => {
  const s = board();
  s.compute.offers = s.compute.offers.filter((o) => o.id !== 'coreflame-0' && o.id !== 'azuria-0');
  const events = takeTargets(s);
  assert.equal(events.find((e) => e.id === 'lodestar').supplier, 'spot');
  assert.equal(events.some((e) => e.id === 'deepthink'), false, 'DeepThink goes without a board card this round');
});

test('off the board, a quarter of what is still short arrives next round; Qilin grows only this way', () => {
  const s = board();
  takeTargets(s);
  offBoardGrowth(s);
  const qilin = rivalOf(s, 'qilin');
  assert.deepEqual(qilin.pipeline, [{ units: Math.round((25 * 1.15 * (1.1 - 0.4 * 0.35) - 11) * 0.25), turn: s.turn + 1, source: 'offBoard' }]);
  assert.equal(rivalOf(s, 'openbrain').pipeline.length, 1, 'OpenBrain is covered by its chip order');
});

test('compute lands in the rival fleet on its turn', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  ob.pipeline = [{ units: 5, turn: 0, source: 'offBoard' }, { units: 7, turn: 1, source: 'board' }];
  landRivalCompute(s);
  assert.equal(ob.fleet, 19);
  assert.deepEqual(ob.pipeline, [{ units: 7, turn: 1, source: 'board' }]);
});

test('denying a rival its card heats the race; so does a deal a quarter the size of your fleet', () => {
  const s = board();
  s.compute.online = 100;
  const heat = s.raceHeat;
  const r = signOffer(s, 'coreflame-0', sideRng(s, 1)); // Lodestar named it; 9 is under a quarter of 100
  assert.equal(r.denied, 'lodestar');
  assert.equal(s.raceHeat, heat + 2);
  s.compute.online = 10;
  signOffer(s, 'spot-0', sideRng(s, 1)); // nobody named it; 4 is over a quarter of 10
  assert.equal(s.raceHeat, heat + 4);
});

test('the round mark counts standing, then lands, takes and grows', () => {
  const s = board();
  const events = rivalDealsTurn(s);
  assert.equal(events.filter((e) => e.type === 'rivalDeal').length, 3);
  assert.deepEqual(s.race.atTop, { openbrain: 1 }, 'standing is counted at the mark');
  assert.ok(rivalOf(s, 'qilin').pipeline.some((p) => p.source === 'offBoard'));
});
```

In `tests/compute-turn.test.js`, replace the test "offers exist from turn 0 and refresh every turn" with:

```js
test('offers exist from turn 0; rivals take their named cards at the mark; the rest stay', () => {
  const s = createInitialState();
  assert.deepEqual(s.compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot']);
  assert.deepEqual(s.power, { sites: [], nextId: 1 });
  const named = s.compute.offers.filter((o) => o.wantedBy);
  assert.equal(named.length, 3, 'three Western rivals are short of compute on turn 0');
  const { state, events } = endTurn(s, {}, createRng(1));
  const deals = events.filter((e) => e.type === 'rivalDeal');
  assert.deepEqual(deals.map((e) => e.supplier).sort(), named.map((o) => o.supplier).sort());
  assert.deepEqual(state.compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot'], 'taken slots refill');
  const untaken = s.compute.offers.find((o) => !o.wantedBy);
  assert.equal(state.compute.offers.find((o) => o.supplier === untaken.supplier).id, untaken.id, 'the untaken card stays');
});
```

- [ ] **Step 2: Run.** `node --test tests/race.test.js tests/compute-turn.test.js`. Expected: FAIL (`../sim/rivalDeals.js` not found).
- [ ] **Step 3: Create `sim/rivalDeals.js`:**

```js
// The shared deal board (spec 2026-09-26 compute race §2 rules 3–5). No dice: rivals name cards in catch-up order,
// the player moves first, and at the round's end each rival takes what it named or its second choice.
import { BOARD_SUPPLIERS, BIG_DEAL_SHARE, BIG_DEAL_HEAT, OFF_BOARD_SHARE } from './data/race.js';
import { rivalShortfall, recordStanding } from './rivals.js';

const boardCards = (state) => state.compute.offers.filter((o) => BOARD_SUPPLIERS.includes(o.supplier) && o.units > 0);
// Lowest score picks first, as in Power Grid's catch-up rule. Qilin buys only home-made chips.
const catchUpOrder = (state) => state.rivals.filter((r) => !r.eastern)
  .sort((a, b) => a.capability - b.capability || a.id.localeCompare(b.id));

// Bold labs (caution below 0.5) want the biggest card; careful labs the card nearest their shortfall.
function choose(r, short, cards) {
  if (!cards.length) return null;
  const cost = r.caution < 0.5 ? (o) => -o.units : (o) => Math.abs(o.units - short);
  return cards.reduce((best, o) => (cost(o) < cost(best) ? o : best));
}

// After the round's offers go up. A second choice comes from cards nobody named, so it never takes another rival's.
export function announceTargets(state) {
  for (const o of state.compute.offers) {
    delete o.wantedBy;
    delete o.fallback;
  }
  for (const r of state.rivals) r.named = null;
  const free = [...boardCards(state)];
  const picks = [];
  for (const r of catchUpOrder(state)) {
    const short = rivalShortfall(state, r);
    if (short <= 0) continue;
    const pick = choose(r, short, free);
    if (!pick) break;
    free.splice(free.indexOf(pick), 1);
    picks.push([r, short, pick]);
  }
  for (const [r, short, pick] of picks) {
    const fallback = choose(r, short, free)?.id ?? null;
    pick.wantedBy = r.id;
    pick.fallback = fallback;
    r.named = { offerId: pick.id, fallback };
  }
}

// At the round mark. The player has already had the round to sign any card first.
export function takeTargets(state) {
  const events = [];
  const onBoard = (id) => (id ? state.compute.offers.find((o) => o.id === id) : null);
  for (const r of catchUpOrder(state)) {
    const plan = r.named;
    r.named = null;
    if (!plan) continue;
    const offer = onBoard(plan.offerId) ?? onBoard(plan.fallback);
    if (!offer) continue;
    state.compute.offers = state.compute.offers.filter((o) => o !== offer);
    const arrivesTurn = state.turn + Math.max(1, offer.arrivesIn ?? 1);
    r.pipeline.push({ units: offer.units, turn: arrivesTurn, supplier: offer.supplier, source: 'board' });
    const big = offer.units >= BIG_DEAL_SHARE * r.fleet;
    if (big) state.raceHeat += BIG_DEAL_HEAT;
    events.push({ type: 'rivalDeal', id: r.id, supplier: offer.supplier, units: offer.units, arrivesTurn, fallback: offer.id !== plan.offerId, big });
  }
  return events;
}

// Deals the player never sees: a quarter of what each rival is still short arrives next round.
export function offBoardGrowth(state) {
  for (const r of state.rivals) {
    const units = Math.round(rivalShortfall(state, r) * OFF_BOARD_SHARE);
    if (units > 0) r.pipeline.push({ units, turn: state.turn + 1, source: 'offBoard' });
  }
}

export function landRivalCompute(state) {
  for (const r of state.rivals) {
    r.pipeline = r.pipeline.filter((p) => {
      if (p.turn > state.turn) return true;
      r.fleet += p.units;
      return false;
    });
  }
}

// Called in endRound before the rival launches are rolled.
export function rivalDealsTurn(state) {
  recordStanding(state);
  landRivalCompute(state);
  const events = takeTargets(state);
  offBoardGrowth(state);
  return events;
}
```

- [ ] **Step 4: Heat on the player's deals.** In `sim/contracts.js`, extend the race import to `import { BOARD_SUPPLIERS, BIG_DEAL_SHARE, BIG_DEAL_HEAT, DENIAL_HEAT } from './data/race.js';`. In `signOffer`, right after `state.cash -= offer.upfront;`:

```js
  if (offer.wantedBy) state.raceHeat += DENIAL_HEAT;
  if (offer.units >= BIG_DEAL_SHARE * state.compute.online) state.raceHeat += BIG_DEAL_HEAT;
```

and change its final `return { ok: true, offerId, arrivesTurn };` to `return { ok: true, offerId, arrivesTurn, denied: offer.wantedBy ?? null };`.

- [ ] **Step 5: Wire the round mark and the first board.** In `sim/state.js`, add `import { announceTargets } from './rivalDeals.js';` and, right after `state.compute.offers = generateOffers(state, sideRng(state, 0));`, add `announceTargets(state);`.

In `sim/turn.js` (the two edits agreed with gn-realtime): add `import { rivalDealsTurn, announceTargets } from './rivalDeals.js';` next to the `./rivals.js` import, and add `refreshOffers` to the `./contracts.js` import (drop `generateOffers` from that import if nothing else in the file uses it: `grep -n generateOffers sim/turn.js`). Then:

(a) Right after the line `for (const c of legalTick(state)) events.push({ type: 'lawsuitPaid', cost: c.cost, source: c.source });` in `endRound`, add:

```js
      for (const e of rivalDealsTurn(state)) events.push(e); // compute race: rivals take their named cards
```

(b) Replace `state.compute.offers = generateOffers(state, sideRng(state, 5));` with:

```js
    state.compute.offers = refreshOffers(state, sideRng(state, 5));
    announceTargets(state);
```

- [ ] **Step 6: Run.** `node --test tests/race.test.js tests/compute-turn.test.js tests/contracts.test.js tests/turn.test.js`. Expected: PASS. Then `npm test`; balance-band failures go in the Measurements section. Sort any other failure as in Task 2 Step 6 (a test pinning the old every-round offer refresh or old rival numbers is updated with a comment naming this plan; anything else is a bug).
- [ ] **Step 7: Commit.**

```bash
git add sim/rivalDeals.js sim/turn.js sim/state.js sim/contracts.js tests/race.test.js tests/compute-turn.test.js
git commit -m "feat(sim): rivals name board cards, take them at the round's end, and grow off the board"
```

### Task 6: The era 3 queue feeds rival fleets

**Files:**
- Modify: `sim/queue.js` (`rivalOrders`, `queueTurn`)
- Test: `tests/queue.test.js`

**Interfaces:**
- Consumes: `rivalShortfall` (Task 2).
- Produces: queue rival rows unchanged in shape; each Western rival's `units` is `min(today's speed-relative order, its rounded shortfall)`. Fills push `{ units, turn: state.turn + 1, supplier: 'verde', source: 'queue' }` onto the rival's pipeline.

- [ ] **Step 1: Write the failing tests** (append to `tests/queue.test.js`; add `import { rivalShortfall } from '../sim/rivals.js';`):

```js
test('a rival that has enough compute coming orders less', () => {
  const s = fresh3();
  const ob = s.rivals.find((r) => r.id === 'openbrain');
  assert.equal(rivalOrders(s).find((x) => x.lab === 'openbrain').units, orderOf(SPEED.openbrain), 'short by more than today’s order: today’s order');
  ob.pipeline.push({ units: Math.ceil(rivalShortfall(s, ob)) - 5, turn: s.turn + 1, source: 'offBoard' });
  assert.equal(rivalOrders(s).find((x) => x.lab === 'openbrain').units, Math.round(rivalShortfall(s, ob)));
  ob.pipeline.push({ units: 1000, turn: s.turn + 1, source: 'offBoard' });
  assert.equal(rivalOrders(s).find((x) => x.lab === 'openbrain').units, 0);
});

test('what the queue gives a rival lands in its fleet next round', () => {
  const s = fresh3();
  queueTurn(s, lo);
  const rows = s.compute.queue.last.rows.filter((row) => row.lab !== 'you' && row.got > 0);
  assert.ok(rows.length > 0);
  for (const row of rows) {
    assert.deepEqual(s.rivals.find((r) => r.id === row.lab).pipeline.at(-1), { units: row.got, turn: s.turn + 1, supplier: 'verde', source: 'queue' });
  }
});
```

The existing tests stay as they are: with the pinned speeds, every rival's era 3 shortfall (about 106, 54 and 76 units) is above today's order (43, 30 and 35), so today's orders still apply.

- [ ] **Step 2: Run.** `node --test tests/queue.test.js`. Expected: FAIL (no pipeline rows).
- [ ] **Step 3: Implement.** In `sim/queue.js`, add `import { rivalShortfall } from './rivals.js';`. In `rivalOrders`, update the comment and the `units` line:

```js
// Today's order size is relative to the Western rivals' speeds, so a rival-speed re-tune does not change the queue.
// A rival orders no more than it is short of (compute race §5), so the queue is never tighter than before.
```

```js
    units: Math.min(Math.round(RIVAL_ORDER * (r.speed / mean) * eraScale(3)), Math.round(rivalShortfall(state, r))),
```

In `queueTurn`, right after the `q.last = { ... };` line:

```js
  for (const r of state.rivals) {
    if (got[r.id] > 0) r.pipeline.push({ units: got[r.id], turn: state.turn + 1, supplier: 'verde', source: 'queue' });
  }
```

- [ ] **Step 4: Run.** `node --test tests/queue.test.js tests/compute-turn.test.js tests/ui-compute.test.js`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add sim/queue.js tests/queue.test.js
git commit -m "feat(sim): the era 3 queue feeds rival fleets; a rival orders no more than it is short"
```

### Task 7: Bots that deny, and a bot that never does

**Files:**
- Modify: `tools/balance.js` (`sizedOffer`, `computeMove`, strategies, `PROBES`)
- Test: `tests/balance.test.js` (existing "every strategy sends only accepted actions" covers the new probe)

**Interfaces:**
- Produces: policy keys `deny: 'openbrain' | 'any'` and `avoidNamed: true`; new strategy `denier` in `STRATEGIES` and `PROBES`.

- [ ] **Step 1: Write the failing test** (append to `tests/balance.test.js`):

```js
test('the denier probe takes named cards; the safety bot never does', () => {
  assert.ok(balanceApi.PROBES.includes('denier'));
  let denied = 0;
  let safetyDenied = 0;
  for (const seed of [1, 2, 3]) {
    for (const [name, count] of [['denier', (n) => { denied += n; }], ['safety', (n) => { safetyDenied += n; }]]) {
      const rng = createRng(seed);
      let state = createInitialState({ seed });
      for (let turn = 0; turn < 12 && !state.ending; turn += 1) {
        const result = endTurn(state, balanceApi.STRATEGIES[name](state, rng), rng);
        count(result.events.filter((e) => e.type === 'deal' && e.denied).length);
        state = result.state;
      }
    }
  }
  assert.ok(denied > 0);
  assert.equal(safetyDenied, 0);
});
```

(Check the file's imports: add `createRng`, `createInitialState` and `endTurn` from `../sim/rng.js`, `../sim/state.js` and `../sim/turn.js` if missing.)

- [ ] **Step 2: Run.** `node --test --test-name-pattern="denier" tests/balance.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.** In `tools/balance.js`, give `sizedOffer` a fifth parameter and filter on it:

```js
function sizedOffer(state, suppliers, shortfall, mode, avoidNamed = false) {
  const offers = state.compute.offers.filter((offer) => suppliers.includes(offer.supplier) && canSign(state, offer) && !(avoidNamed && offer.wantedBy));
```

In `computeMove`, pass `policy.avoidNamed` as the fifth argument to each of the three `sizedOffer` calls in the `policy.offer === 'safe'` branch. Then insert this check after the era 3 queue branch and right before `if (policy.offer === 'verde')`, so the speed bot still builds its era 4 site and places its queue orders first:

```js
  // Compute race: deny a rival the card it named, when the bot can pay for it.
  if (policy.deny) {
    const named = state.compute.offers
      .filter((offer) => offer.wantedBy && (policy.deny === 'any' || offer.wantedBy === policy.deny) && canSign(state, offer))
      .sort((a, b) => b.units - a.units)[0];
    if (named) return { type: 'deal', offerId: named.id };
  }
```

Update the strategies:

```js
const speed = makeStrategy('speed', speedPrefs, { offer: 'verde', queue: 'prepaid', site: 'gas', pledge: 0.1, deny: 'openbrain' });
```

```js
const safety = makeStrategy('safety', safetyPrefs, { offer: 'safe', site: 'nuclear', pledge: 0.2, avoidNamed: true });
```

After `balancedPush`:

```js
const denier = makeStrategy('balanced', balancedPrefs, { offer: 'cheapest', queue: 'standard', grid: true, deny: 'any' });
```

Add `'denier'` to `PROBES` and `denier` to `STRATEGIES`.

- [ ] **Step 4: Run.** `node --test tests/balance.test.js`. Expected: the new test and "every strategy sends only accepted actions" PASS. Balance-band tests may fail; Task 8 handles them.
- [ ] **Step 5: Commit.**

```bash
git add tools/balance.js tests/balance.test.js
git commit -m "feat(tools): the speed bot denies OpenBrain, the safety bot never denies, and a denier probe"
```

### Task 8: Measure after, compare, and stop for the owner

**Files:**
- Create: `docs/design/mockups/compute-race/measurements/after.json`
- Modify: this plan's Measurements section; `tests/balance.test.js` and `tests/compute-balance.test.js` only as the owner approves.

- [ ] **Step 1: Measure.** `node tools/balance.js 100 > docs/design/mockups/compute-race/measurements/after.json`.
- [ ] **Step 2: Fill the "After" rows** of the Measurements table, next to "Before" (Task 1) and the prototype (spec §4): left behind by era, out of money, misalignment, rounds at 1st, rank at the end of era 4, rival deals per run, and the denier probe's row.
- [ ] **Step 3: Run `npm test` and list every failing test** by name with its message, plus the four `todo` tests' current values (the grid reservation one is expected to stay open until era 4 rival power).
- [ ] **Step 4: Stop and report to the owner** before changing any number or any test threshold. The report leads with the outcome, shows the table, says plainly that the standing weights 60 / 40 are this lane's first guess, and names what the prototype never covered (persistent board, denial heat, standing, denying bots). If "left behind" for any of speed, safety or random is above 20 of 100, or the balanced bot's win count moves by more than 5, say so first: `RIVAL_EDGE` is the likely lever (+6 left 63 to 88 of 100 behind), and the owner picks the retune.
- [ ] **Step 5: After the owner answers,** apply the agreed changes (constants in `sim/data/race.js`, test thresholds or new `todo` notes with the measured numbers, as for the existing todos), re-measure, and commit:

```bash
git add sim/data/race.js tests/balance.test.js tests/compute-balance.test.js docs/design/mockups/compute-race/measurements/after.json docs/superpowers/plans/2026-09-26-compute-race.md
git commit -m "test(balance): compute race measured before and after; owner-agreed retune"
```

### Task 9: Race tab logic

**Files:**
- Create: `ui/logic/race.js`
- Test: `tests/ui-race.test.js` (new)

**Interfaces:**
- Consumes: `computeShares`, `rivalSize`, `rivalTraining` (sim/rivals.js); `computeSlices` (sim/split.js); `SIZES`, `SIZE_UNITS` (sim/recipe.js); `eraScale`; `RUMOR_PROGRESS`; `computeAmount`, `roundWord`, `SUPPLIERS`.
- Produces: `SIZE_LABEL`; `playerSize(state) → size | null`; `raceModel(state) → { shares: [{ id, name, share, you }], rows: [{ id, name, you, score, compute, computeNote, size, word }], why: string, roundEnd: string[] }`; `roundEndItems(state) → [{ id, name, text }]`, used by the deal board strip (Task 11).

- [ ] **Step 1: Write the failing tests** in `tests/ui-race.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { SIZE_LABEL, playerSize, raceModel, roundEndItems } from '../ui/logic/race.js';

test('the share bar covers every lab, largest first', () => {
  const m = raceModel(createInitialState({ seed: 1 }));
  assert.equal(m.shares.length, 5);
  assert.ok(Math.abs(m.shares.reduce((s, x) => s + x.share, 0) - 1) < 1e-9);
  assert.equal(m.shares[0].id, 'openbrain'); // 14 of 57 units
  assert.ok(m.shares.find((x) => x.you));
});

test('the lab table reads score, compute, next model and the word around town', () => {
  const s = createInitialState({ seed: 1 });
  s.rivals.find((r) => r.id === 'deepthink').progress = 0.6;
  s.lastRivalReleases = [{ id: 'openbrain', gain: 6 }];
  const rows = raceModel(s).rows;
  const scores = rows.map((r) => r.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'highest score first');
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.openbrain.word, 'just launched');
  assert.equal(byId.deepthink.word, 'launch rumored soon');
  assert.equal(byId.lodestar.computeNote, 'careful: big safety share');
  assert.equal(byId.qilin.computeNote, 'home-made chips');
  assert.equal(byId.openbrain.size, SIZE_LABEL.medium);
  assert.equal(byId.you.word, 'no run yet');
});

test('the why box names what your users and safety take, and what the next size needs', () => {
  const s = createInitialState({ seed: 1 });
  const m = raceModel(s);
  const size = playerSize(s);
  assert.match(m.why, new RegExp(`^Why you ${size ? `only train ${SIZE_LABEL[size]}` : "can't train yet"}\\.`));
  assert.match(m.why, /needs \d+ free/);
});

test('the round-end box says who takes what, and what happens if you sign it first', () => {
  const s = createInitialState({ seed: 1 });
  const items = roundEndItems(s);
  assert.equal(items.filter((i) => i.id !== 'qilin').length, s.compute.offers.filter((o) => o.wantedBy).length);
  const named = s.compute.offers.find((o) => o.wantedBy && o.fallback);
  if (named) assert.match(raceModel(s).roundEnd.join(' '), /Sign it first and \w+ takes/);
  assert.ok(items.some((i) => i.id === 'qilin' && i.text === 'Qilin buys only home-made chips'));
});
```

- [ ] **Step 2: Run.** `node --test tests/ui-race.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3: Create `ui/logic/race.js`:**

```js
// The race tab (compute race spec §3): who holds the frontier's compute, who can train what, and what lands at the
// round's end. Pure: reads the state, never changes it.
import { computeShares, rivalSize, rivalTraining } from '../../sim/rivals.js';
import { computeSlices } from '../../sim/split.js';
import { SIZES, SIZE_UNITS } from '../../sim/recipe.js';
import { SUPPLIERS, eraScale } from '../../sim/data/compute.js';
import { RUMOR_PROGRESS } from '../../sim/data/race.js';
import { roundWord } from '../../sim/time.js';
import { computeAmount } from './format.js';

export const SIZE_LABEL = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'XL' };
const sizesFor = (era) => SIZES.filter((size) => size !== 'xl' || era >= 2);
const unitsFor = (size, era) => SIZE_UNITS[size] * eraScale(era);

export function playerSize(state) {
  const free = computeSlices(state).training;
  return sizesFor(state.era).filter((size) => unitsFor(size, state.era) <= free).at(-1) ?? null;
}

function rivalWord(state, r) {
  if ((state.lastRivalReleases ?? []).some((release) => release.id === r.id)) return 'just launched';
  return r.progress > RUMOR_PROGRESS ? 'launch rumored soon' : 'quiet';
}

function rivalNote(state, r) {
  if (r.eastern) return 'home-made chips';
  if (r.caution >= 0.7) return 'careful: big safety share';
  return `about ${computeAmount(Math.round(rivalTraining(r)), state.era)} for training`;
}

function why(state) {
  const slices = computeSlices(state);
  const size = playerSize(state);
  const ladder = sizesFor(state.era);
  const start = size ? ladder.indexOf(size) + 1 : 0;
  const next = ladder.slice(start, start + 2);
  const opening = size ? `Why you only train ${SIZE_LABEL[size]}.` : "Why you can't train yet.";
  if (!next.length) return `You can train ${SIZE_LABEL[size]}, the largest size.`;
  const amount = (units) => computeAmount(Math.round(units), state.era);
  const needs = next.map((s) => `${SIZE_LABEL[s]} needs ${Math.round(unitsFor(s, state.era))} free`).join('; ');
  return `${opening} Your users take ${amount(slices.serving)} of your ${amount(slices.online)} and safety takes ${amount(slices.safety)}. ${needs}.`;
}

export function roundEndItems(state) {
  const name = (id) => state.rivals.find((r) => r.id === id)?.name;
  const card = (id) => state.compute.offers.find((o) => o.id === id);
  const label = (o) => `${SUPPLIERS[o.supplier].name}'s ${computeAmount(o.units, state.era)}`;
  const items = state.compute.offers.filter((o) => o.wantedBy).map((o) => {
    const fallback = card(o.fallback);
    const rival = name(o.wantedBy);
    const second = fallback ? ` Sign it first and ${rival} takes ${label(fallback)} instead.` : ` Sign it first and ${rival} goes without a board card this ${roundWord(state.era)}.`;
    return { id: o.wantedBy, name: rival, text: `${rival} signs ${label(o)}.${second}` };
  });
  const qilin = state.rivals.find((r) => r.eastern);
  if (qilin) items.push({ id: qilin.id, name: qilin.name, text: `${qilin.name} buys only home-made chips` });
  return items;
}

export function raceModel(state) {
  const shares = computeShares(state);
  const labs = [{ id: 'you', name: 'You' }, ...state.rivals.map((r) => ({ id: r.id, name: r.name }))];
  const free = computeSlices(state).training;
  const rows = [
    { id: 'you', name: 'You', you: true, score: state.capability, compute: state.compute.online,
      computeNote: `${computeAmount(Math.round(free), state.era)} free after users and safety`,
      size: SIZE_LABEL[playerSize(state)] ?? 'none yet', word: state.activeRun ? 'training now' : 'no run yet' },
    ...state.rivals.map((r) => ({ id: r.id, name: r.name, you: false, score: r.capability, compute: r.fleet,
      // A copy: rivalSize records lastSize on the rival, and this model must not change the state.
      computeNote: rivalNote(state, r), size: SIZE_LABEL[rivalSize(state, { ...r })] ?? 'none yet', word: rivalWord(state, r) })),
  ].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return {
    shares: labs.map((lab) => ({ ...lab, share: shares[lab.id], you: lab.id === 'you' })).sort((a, b) => b.share - a.share),
    rows,
    why: why(state),
    roundEnd: roundEndItems(state).map((item) => item.text),
  };
}
```

- [ ] **Step 4: Run.** `node --test tests/ui-race.test.js`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add ui/logic/race.js tests/ui-race.test.js
git commit -m "feat(ui): race tab logic (shares, who trains what, why you train small, the round's end)"
```

### Task 10: The race tab screen

**Precondition:** gn-hud-money's `ui/screens/computeInfo.js` is in `ui` and this branch is rebased on it (Task 0 Step 2).

**Files:**
- Create: `ui/screens/race.js`
- Modify: `ui/screens/computeInfo.js` (default `race`, copy), `ui/styles.css` (new block at the end: `/* compute race tab (compute race plan Task 10) */`)

**Interfaces:**
- Consumes: `raceModel` (Task 9); `openComputeInfo(game, overlayRoot, { view, race })`, where `race` is `(game) => { body: HTMLElement, stacked: boolean }`.
- Produces: `raceTab(game) → { body, stacked: false }`.

- [ ] **Step 1: Load the skills.** Load the owner's `design` skill (`~/.claude/skills/design/`: `TASTE.md`, `LEARNINGS.md`) and the surface skill it names for game UI. Open the mockup in `docs/design/mockups/compute-race/plan.html` ("The race tab" picture) and match its layout: share bar on top, then the lab table (Lab, Score, Compute, Next model, Word around town), then the "Why you only train" box and the "At the round's end" box side by side.
- [ ] **Step 2: Create `ui/screens/race.js`:**

```js
// The Compute dialog's race tab (compute race spec §3). Mounted by ui/screens/computeInfo.js.
import { raceModel } from '../logic/race.js';
import { roundWord } from '../../sim/time.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function raceTab(game) {
  const state = game.state;
  const model = raceModel(state);
  const body = element('div', 'race-tab');
  body.append(element('h6', '', `Who holds the frontier's compute this ${roundWord(state.era)}`));
  const bar = element('div', 'race-share');
  for (const lab of model.shares) {
    const part = element('div', `race-share-part${lab.you ? ' you' : ''} lab-${lab.id}`);
    part.style.flexGrow = `${lab.share}`;
    part.title = `${lab.name}: ${Math.round(lab.share * 100)}%`;
    if (lab.share >= 0.08) part.append(element('b', '', `${Math.round(lab.share * 100)}%`), element('span', '', lab.name));
    bar.append(part);
  }
  body.append(bar);
  const table = element('table', 'race-table');
  const head = element('tr');
  for (const label of ['Lab', 'Score', 'Compute', 'Next model', 'Word around town']) head.append(element('th', '', label));
  table.append(head);
  for (const row of model.rows) {
    const tr = element('tr', row.you ? 'you' : '');
    const compute = element('td');
    compute.append(element('b', '', `${Math.round(row.compute)}`), element('small', '', row.computeNote));
    tr.append(element('td', '', row.name), element('td', 'n', `${Math.round(row.score)}`), compute,
      element('td', '', row.size), element('td', 'word', row.word));
    table.append(tr);
  }
  body.append(table);
  const boxes = element('div', 'race-boxes');
  const whyBox = element('div', 'race-box');
  whyBox.append(element('p', '', model.why));
  const endBox = element('div', 'race-box');
  endBox.append(element('h6', '', `At the ${roundWord(state.era)}'s end`));
  for (const line of model.roundEnd) endBox.append(element('p', '', line));
  boxes.append(whyBox, endBox);
  body.append(boxes);
  return { body, stacked: false };
}
```

- [ ] **Step 3: Mount it.** In `ui/screens/computeInfo.js`: replace `import { raceView } from './history.js';` with `import { raceTab } from './race.js';`; change the default to `race = raceTab`; rename the tab label `'The race so far'` to `'The race'` (update any test that pins the old label: `grep -rn "race so far" tests`); set the race view's subtitle to `` `Era ${state.era} · ${Math.round(state.compute.online)} units online · who can train what, and who takes which deal` ``; and replace the file's first comment's last sentence ("Rivals race on capability only; they hold no compute.") with "Rivals hold compute too (compute race plan)." The history screen keeps its own race chart.
- [ ] **Step 4: Styles.** Add the `race-*` classes in the new CSS block, reusing the dialog's existing tokens and the `history-race` dialog size (1320 × 688). Rival colors: reuse the rival colors the history race chart already uses (`grep -n "openbrain\|lodestar\|deepthink\|qilin" ui/styles.css`).
- [ ] **Step 5: Look at it.** Serve with `python3 -m http.server 8741` from the worktree root and open `http://localhost:8741/index.html?scenario=era2Deals#compute-race` in the browser pane at 1440 × 900. Screenshot, compare with the mockup, fix what reads worse, and shoot again. Check the share bar labels, the table's alignment, and that both boxes fit without scrolling. Record every piece of owner feedback in the design skill's `LEARNINGS.md` the same session.
- [ ] **Step 6: Run** `npm test`. Expected: no new failures.
- [ ] **Step 7: Commit.**

```bash
git add ui/screens/race.js ui/screens/computeInfo.js ui/styles.css
git commit -m "feat(ui): the race tab in the Compute dialog"
```

### Task 11: The deal board shows who takes what

**Files:**
- Modify: `ui/logic/compute.js` (`dealCards`, `rejectionReason`, `turnSummary`, `opinionText`), `ui/screens/compute.js` (`dealButton`, `openDeals`), `ui/styles.css`
- Test: `tests/ui-compute.test.js`

**Interfaces:**
- Consumes: `roundEndItems`, `playerSize`, `SIZE_LABEL` (Task 9); `rivalSize`.
- Produces: each deal card gains `takenBy: string | null` (rival name), `secondChoiceOf: string[]` (names of rivals whose second choice this is), `fallbackLine: string`. New `roundEndStrip(state) → [{ id, text }]`.

- [ ] **Step 1: Write the failing tests** (append to `tests/ui-compute.test.js`):

```js
test('deal cards say who takes them and what happens if you sign first', () => {
  const s = createInitialState({ seed: 1 });
  const cards = dealCards({ ...s, movesLeft: 2 });
  const named = s.compute.offers.filter((o) => o.wantedBy);
  for (const o of named) {
    const card = cards.find((c) => c.id === o.id);
    const rival = s.rivals.find((r) => r.id === o.wantedBy).name;
    assert.equal(card.takenBy, rival);
    assert.match(card.fallbackLine, new RegExp(`^If you sign it, ${rival} `));
  }
  for (const card of cards.filter((c) => !named.some((o) => o.id === c.id))) assert.equal(card.takenBy, null);
});

test('the round-end strip lists every named card and Qilin', () => {
  const s = createInitialState({ seed: 1 });
  const strip = roundEndStrip(s);
  assert.equal(strip.length, s.compute.offers.filter((o) => o.wantedBy).length + 2);
  assert.equal(strip.at(-1).text, 'Cards nobody takes stay on the board');
});

test('turn summaries report rival deals and your denial', () => {
  const s = createInitialState({ seed: 1 });
  const lines = turnSummary([
    { type: 'rivalDeal', id: 'openbrain', supplier: 'verde', units: 40, arrivesTurn: 3, fallback: false, big: true },
    { type: 'rivalDeal', id: 'deepthink', supplier: 'spot', units: 4, arrivesTurn: 1, fallback: true, big: true },
  ], s);
  assert.deepEqual(lines, ["OpenBrain signed Verde's 40 units", "DeepThink signed Spot market's 4 units, its second choice"]);
});

test('a card you cannot pay for says how much you have', () => {
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.supplier === 'verde');
  s.cash = verde.upfront - 1;
  const card = dealCards({ ...s, movesLeft: 2 }).find((c) => c.id === verde.id);
  assert.match(card.reason, /^Upfront is \$[\d.,]+[MB]; you have \$[\d.,]+[MB]\.$/);
});
```

(Import `roundEndStrip` alongside `dealCards` and `turnSummary`.) In `tests/ui-company.test.js` line 104, the old message `'Not enough cash for the upfront payment'` becomes a match on the new one: `assert.match(card.reason, /^Upfront is \$[\d.,]+[MB]; you have -?\$[\d.,]+[MB]\.$/);`.

- [ ] **Step 2: Run.** `node --test tests/ui-compute.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement in `ui/logic/compute.js`.** Add `import { roundEndItems, playerSize, SIZE_LABEL } from './race.js';` and extend the rivals import with `rivalSize`. In `rejectionReason`, change the cash line to:

```js
  if (offer.upfront > state.cash) return `Upfront is ${money(offer.upfront)}; you have ${money(state.cash)}.`;
```

Add above `dealCards`:

```js
const nameOf = (state, id) => state.rivals.find((r) => r.id === id)?.name ?? rivalName(id);

function fallbackLine(state, offer) {
  if (!offer.wantedBy) return '';
  const rival = nameOf(state, offer.wantedBy);
  const second = state.compute.offers.find((o) => o.id === offer.fallback);
  return second
    ? `If you sign it, ${rival} takes ${SUPPLIERS[second.supplier].name}'s ${computeAmount(second.units, state.era)}.`
    : `If you sign it, ${rival} goes without a board card this ${roundWord(state.era)}.`;
}

export function roundEndStrip(state) {
  const items = roundEndItems(state).map((item) => {
    const offer = state.compute.offers.find((o) => o.wantedBy === item.id);
    if (!offer) return { id: item.id, text: item.text };
    const later = offer.arrivesIn > 1 ? ` (arrives ${arrival(offer.arrivesIn, state.era)})` : '';
    return { id: item.id, text: `${item.name} +${computeAmount(offer.units, state.era)}${later}` };
  });
  return [...items, { id: 'rest', text: 'Cards nobody takes stay on the board' }];
}
```

In `dealCards`' returned object, add:

```js
        takenBy: offer.wantedBy ? nameOf(state, offer.wantedBy) : null,
        secondChoiceOf: state.compute.offers.filter((o) => o.fallback === offer.id).map((o) => nameOf(state, o.wantedBy)),
        fallbackLine: fallbackLine(state, offer),
```

In `turnSummary`, before the `rivalRelease` branch:

```js
    } else if (event.type === 'rivalDeal') {
      const name = rivalName(event.id);
      if (name) lines.push(`${name} signed ${supplierName(event.supplier)}'s ${computeAmount(event.units, state?.era ?? 1)}${event.fallback ? ', its second choice' : ''}`);
```

and in the existing `deal` branch, after its `lines.push(...)`:

```js
      if (event.denied) lines.push(`You took the card ${rivalName(event.denied)} wanted`);
```

In `opinionText`, change `dealLines.research` to name who can train what:

```js
  const leader = state.rivals.reduce((a, b) => (b.capability > a.capability ? b : a));
  const ours = SIZE_LABEL[playerSize(state)];
  const theirs = SIZE_LABEL[rivalSize(state, { ...leader })];
  // ...
    research: theirs && theirs !== ours
      ? `${leader.name} can train ${theirs}; we can train ${ours ?? 'nothing yet'}. More compute closes that.`
      : 'More compute lets us train a larger model sooner.',
```

(`arrival` and `computeAmount` are already defined or imported in this file; check with `grep -n "const arrival\|computeAmount" ui/logic/compute.js`.)

- [ ] **Step 4: Implement in `ui/screens/compute.js`.** In `dealButton`, before `button.append(who, ...)`:

```js
  if (card.takenBy) button.append(element('span', 'company-taken', `${card.takenBy} takes this`));
  else if (card.secondChoiceOf.length) button.append(element('span', 'company-second', `${card.secondChoiceOf.join(' and ')}'s second choice`));
```

and after `catchBlock.append(...)`: `if (card.fallbackLine) catchBlock.append(element('span', 'company-fallback', card.fallbackLine));`. In `openDeals`' `render`, after `body.replaceChildren(group);`, add the strip:

```js
    const strip = element('div', 'deal-round-end');
    strip.append(element('b', '', `At the ${roundWord(state.era)}'s end`));
    for (const item of roundEndStrip(state)) strip.append(element('span', `deal-round-end-item lab-${item.id}`, item.text));
    body.append(strip);
```

(import `roundEndStrip` from `../logic/compute.js`). Change the dialog subtitle to `` `Era ${initial.era} · ${eraById(initial.era).name} · rivals take the marked cards at the ${roundWord(initial.era)}'s end` ``.

- [ ] **Step 5: Styles and a look.** Add `company-taken`, `company-second`, `company-fallback` and `deal-round-end` styles in a new CSS block, following the mockup in `plan.html` ("The deal board" picture). Serve the worktree and open `index.html?scenario=era2Deals#deals` at 1440 × 900; screenshot, compare with the mockup, fix, re-shoot. Check that a banner never covers the supplier name and that the strip fits under the cards. Log owner feedback in the design skill's `LEARNINGS.md`.
- [ ] **Step 6: Run** `node --test tests/ui-compute.test.js` then `npm test`. Expected: PASS (other than balance bands handled in Task 8).
- [ ] **Step 7: Commit.**

```bash
git add ui/logic/compute.js ui/screens/compute.js ui/styles.css tests/ui-compute.test.js
git commit -m "feat(ui): deal cards say who takes them, the fallback, and what lands at the round's end"
```

### Task 12: Feed posts for big rival deals and denial

**Files:**
- Modify: `sim/data/feed.js` (new `RIVAL_DEAL_POSTS`, `DENIAL_POSTS`), `sim/feed.js`
- Test: `tests/feed.test.js`

**Precondition:** check whether gn-feed's `feed-live` (Flock and the persona feed) has landed in `ui` and moved `RIVAL_POSTS`: `grep -n "RIVAL_POSTS" sim/feed.js sim/data/*.js`. Put the new pools where `RIVAL_POSTS` lives and hook them the same way `rivalRelease` is hooked.

**Interfaces:**
- Consumes: the `rivalDeal` event's `id` and `big`; the player `deal` event's `denied`.

- [ ] **Step 1: Write the failing test** (append to `tests/feed.test.js`; use the file's existing imports of `feedPosts` and `createInitialState`):

```js
test('a big rival deal and your denial make feed posts', () => {
  const s = createInitialState({ seed: 3 });
  const prev = { raceHeat: s.raceHeat, publicTrust: s.publicTrust };
  const deal = feedPosts(prev, s, [{ type: 'rivalDeal', id: 'openbrain', supplier: 'verde', units: 40, arrivesTurn: 3, fallback: false, big: true }], { ambient: false, timeBased: false });
  assert.equal(deal.length, 1);
  assert.equal(deal[0].tag, 'rival');
  const denial = feedPosts(prev, s, [{ type: 'deal', offerId: 'coreflame-0', arrivesTurn: 1, denied: 'lodestar' }], { ambient: false, timeBased: false });
  assert.equal(denial.length, 1);
  const small = feedPosts(prev, s, [{ type: 'rivalDeal', id: 'openbrain', supplier: 'spot', units: 2, arrivesTurn: 1, fallback: false, big: false }], { ambient: false, timeBased: false });
  assert.equal(small.length, 0, 'a small deal stays quiet');
});
```

- [ ] **Step 2: Run.** `node --test --test-name-pattern="big rival deal" tests/feed.test.js`. Expected: FAIL.
- [ ] **Step 3: Add the pools** to `sim/data/feed.js`:

```js
// Compute race: a rival's deal that adds a quarter or more to its fleet.
export const RIVAL_DEAL_POSTS = {
  openbrain: [
    { handle: '@chipwatch', text: 'openbrain just bought a warehouse of gpus. the warehouse is also new.' },
    { handle: '@marketwire', text: 'openbrain signs another giant compute order. nobody at openbrain seems surprised.' },
  ],
  lodestar: [
    { handle: '@marketwire', text: 'lodestar quietly adds compute. its press release is mostly about safety.' },
    { handle: '@chipwatch', text: 'lodestar bought chips. careful chips, apparently.' },
  ],
  deepthink: [
    { handle: '@marketwire', text: 'deepthink signs a big compute deal and calls it "measured growth".' },
    { handle: '@chipwatch', text: 'deepthink just outbid two labs for a data center. neither will say which.' },
  ],
};

// Compute race: the player signed the card a rival had named.
export const DENIAL_POSTS = {
  openbrain: [
    { handle: '@marketwire', text: 'openbrain lost a chip deal at the last minute. sources say it is "fine".' },
    { handle: '@leakwire', text: 'openbrain staff are asking who took their compute. we know who.' },
  ],
  lodestar: [
    { handle: '@marketwire', text: 'lodestar missed out on a compute contract and wished the winner well.' },
    { handle: '@chipwatch', text: 'someone signed the deal lodestar wanted. lodestar says it will adjust.' },
  ],
  deepthink: [
    { handle: '@marketwire', text: 'deepthink was outpaced on a compute deal. its ceo calls it a timing issue.' },
    { handle: '@leakwire', text: 'deepthink had that contract drafted. then someone else signed it.' },
  ],
};
```

- [ ] **Step 4: Hook them** in `sim/feed.js`: import the two pools, and after the `rivalRelease` loop add:

```js
  for (const event of events) {
    if (posts.length >= MAX_POSTS) break;
    if (event.type === 'rivalDeal' && event.big) addFromPool(RIVAL_DEAL_POSTS[event.id], 'rival');
    if (event.type === 'deal' && event.denied) addFromPool(DENIAL_POSTS[event.denied], 'rival');
  }
```

- [ ] **Step 5: Run.** `node --test tests/feed.test.js` then `npm test`. Expected: PASS apart from Task 8's balance bands. A feed-count test elsewhere may now see extra posts at a mark; if one fails, check that the extra post comes from a `rivalDeal` event and update that test's expected count with a comment naming this plan.
- [ ] **Step 6: Commit.**

```bash
git add sim/data/feed.js sim/feed.js tests/feed.test.js
git commit -m "feat(sim): feed posts when a rival lands a big deal or you take its card"
```

### Task 13: Verify, review, hand to gn-merge

- [ ] **Step 1: Full suite.** `npm test`. Every failure is either fixed or an owner-agreed `todo` from Task 8. Record the final counts in the Measurements section.
- [ ] **Step 2: Real game check.** Serve the worktree and play the first two rounds from `index.html`: open the deal board, sign a card a rival named, end the round, and confirm the turn summary says "You took the card <Rival> wanted", the rival took its second choice, the race tab shows the change, and a new board keeps the untaken card. Screenshot each step.
- [ ] **Step 3: Tier 2 review (the orchestrator, not a subagent).** Snapshot the mutation guard (`git status --porcelain` plus `{ git diff HEAD; git ls-files --others --exclude-standard -z | xargs -0 git hash-object -- ; } | shasum`), run one Codex adversarial pass over `git diff origin/ui...HEAD` with `-m gpt-5.6-sol -s read-only --output-schema ~/.codex/review-schema.json -o <scratchpad>/findings.json`, compare the guard, adjudicate, apply one combined fix wave, and re-verify with `resume` (at most 3 rounds). Record every outcome in this plan's Review record section.
- [ ] **Step 4: Push the branch** (ask the owner first): `git push origin compute-race-design`.
- [ ] **Step 5: Hand to gn-merge after 2026-09-27 12:00 AM PT.** Message with the SHA, the Measurements table, the files touched in `sim/turn.js` and `ui/screens/computeInfo.js`, and the request that gn-merge re-find the demo seeds (`tools/demo-seeds.js`, its file) because every seed's story changes: `~/claude-sync/bin/claude-sync.sh msg ~/Desktop/game-night-ai-lab gn-merge gn-compute-race "<text>"`. Tier 3 (the straight review plus the adversarial pass, run concurrently) runs before the merge.
- [ ] **Step 6: Update the lane:** `claude-sync.sh claim ... gn-compute-race "doing=handed to gn-merge at <sha>"`.

---

## Measurements

| Bot | Measure | Prototype today (spec §4) | Before (Task 1) | Prototype B + C | After (Task 8) |
|---|---|---|---|---|---|
| speed | left behind | 0 | 0 (by era: —) | 8 | |
| speed | out of money | 44 | 30 | 37 | |
| speed | rounds at 1st | 82% | 88% | 54% | |
| safety | left behind | 2 | 5 (era 2: 5) | 6 | |
| safety | out of money | 96 | 93 | 93 | |
| safety | rank, end of era 4 | 1.02 | 1.02 | 1.70 | |
| balanced | left behind | 0 | 0 (by era: —) | 0 | |
| balanced | out of money | 11 | 9 | 11 | |
| balanced | rounds at 1st | 93% | 94% | 79% | |
| balanced | rank, end of era 4 | 1.00 | 1.00 | 1.65 | |
| random | left behind | 1 | 0 (by era: —) | 6 | |
| random | misalignment | 14 | 14 | 10 | |
| random | out of money | 64 | 64 | 61 | |
| all | rival deals per run | — | 0 | 9–15 | |
| denier | wins / left behind | — | — | — | |

Task 1 full suite (re-measured on `realtime-tune`, 2026-09-26): 820 tests, 816 pass, 0 fail, 4 todo.

Test baseline on `ui` at `9d51f8e` (2026-09-26): 797 tests, 793 pass, 0 fail, 4 todo, about 32 s.

## Review record

(Filled in Task 13.)
