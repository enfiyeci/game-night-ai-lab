# Decisions decide the ending (no dice on outcomes) — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every random draw that changes what happens to the lab with a rule the player's decisions drive,
keep event pop-ups and advisor noise random on streams of their own, make every game start the same, and tune until a
careful, well-funded strategy reaches the aligned ending reliably.

**Architecture:** The sim keeps its seeded generator (`sim/rng.js`), but only three things draw from it after this
change: event pop-ups and their landing days, advisor noise, and cosmetic feed picks. Each of those gets its own
per-round stream (`sideRng(state, salt)`), so removing an outcome roll never reshuffles which events appear. Every other
roll becomes one of four rule shapes (Global Constraints). The rng parameters of the round loop stay for callers but
feed nothing.

**Tech stack:** Plain ES modules, Node's built-in test runner (`node --test tests/*.test.js`, `npm test`), the bot
balance tool (`node tools/balance.js <runs>`).

**Spec:** `docs/superpowers/specs/2026-09-26-deterministic-endings-design.md` (owner-approved 2026-09-26).

## Global constraints

- Owner decisions from spec section 2 are binding: outcomes follow from decisions; cosmetic draws, **which event cards
  pop up and when**, and **advisor noise** stay random; **every game starts the same**; **no extra warning cards**
  before catastrophes (danger shows only through existing surfaces).
- **Rule shapes** (this plan's reading of "every roll becomes a rule"; each task names which one it uses):
  1. **Running total** for a chance that repeats every round or week: the chance adds up in a counter, and the thing
     happens each time the counter reaches 1 (then 1 is subtracted). Same long-run rate as the roll, no dice. Helper:
     `accrue(holder, key, chance)` in `sim/util.js` (Task A3).
  2. **Threshold** for a one-off chance that the code already computes from state (a sigmoid or a per-check-level
     table): it happens exactly when the chance is at least 0.5.
  3. **Average** for a random size, delay or amount: use the middle of the old range.
  4. **Stated condition** where the spec (section 4) or an owner decision (below) names the rule. These win over 1-3.
- The eleven scenarios in spec section 4 must stay true, in particular: misuse ends on the **second consecutive round**
  over both lines (capability > 55, misuse > 70); someone else's disaster on **race heat above 85 for three rounds**;
  misalignment when **hidden debt × capability / 100 is over the line** (era 3 agent release: warning; era 4: ending);
  a summit break by you is **always caught under outside testers or inspectors and never under trust or
  self-reports**; the aligned ending keeps its rule (end of era 5, ranked first, hidden debt < 40).
- **Positional rng slots stay**: a function whose rng parameter sits before other parameters (`advanceRunBy`,
  `rivalsTurn`, `deliverDue`) keeps the slot, renamed `_rng`, so no caller shifts. A trailing rng parameter is
  removed; callers that still pass one are harmless (JavaScript ignores extra arguments), but sim call sites are
  cleaned up in the same task.
- **Balance rule** (memory: new mechanics get before and after bot runs, sized to match existing effects): every
  task that changes outcomes runs `node tools/balance.js 200` afterwards and records the ending counts per bot in the
  measurements log (Task 0 creates it). The full retune happens in Task C3; tasks do not tune on their own.
- Every task ends with `npm test` fully green (known todo tests excepted). UI scenario tests (`tests/ui-*.test.js`)
  replay bot games through `ui/logic/scenarios.js`, so outcome changes can move their fixtures: when one fails, check
  that the failure is the intended rule change, then update the expected value in the test with a comment naming the
  rule. Never loosen an assertion to make it pass.
- Commits: one per task, message `feat(sim): <what> (no dice: <rule shape>)`, ending with the repo's co-author line.
  Stage files by explicit path; never `git add -A`.
- Push in its own Bash call (memory: the safety hook blocks a line with a push followed by any "-f" text). No force
  pushes: the owner's hook forbids them, so bring in `origin/ui` with `git merge`, never a rebase of pushed commits.

## Owner decisions (answered 2026-09-26)

Owner answers: D1 "sure" (option a), D2 "sure" (all four rules as written), D4 "lets make it more expensive" (see the
D4 line), D5 "sounds good" (12th month), D6 and D7 "whatever you recommend" (the bold defaults). The option lists
below are kept as the record.

- **D1. White House testers cost** (open since the handoff; WIP commit `1368f47`). Options: **(a) era 3 on only: a
  release waits one round unless an outside eval card is on it; nothing in eras 1-2 (measured: no bot changes)**;
  (b) a smaller eras 1-2 launch-users cut, for example 10% (not measured); (c) a one-time fee in eras 1-2 (not
  measured). The first build's 25% cut moved the careful bot's out-of-money deaths from era 4 to era 3 (7 → 83).
- **D2. Four outcome rolls the spec's table missed** (found while planning; all in event effects):
  - gas site "Push through" (`sim/data/events.js`, 30% chance the county cuts the site 30%): **the cut happens when
    public trust is below 50**;
  - refusing Washington's compute pool (`sim/data/events.js`, 20% chance of supply-chain risk): **the risk follows
    when US favor is below 40 after the refusal**;
  - board event "Send a cleaned-up version" (`sim/data/boardEvents.js`, 35% chance the full report leaks): **it leaks
    when staff trust is below 50**;
  - board event "Give a long interview" (`sim/data/boardEvents.js`, coin flip, +6 or −6 public trust): **+6 when
    hidden debt is under 40, −6 otherwise**.
- **D3. The spec's table row for `sim/data/events6c.js:104` is wrong.** It says "rival version jump"; the code is
  the player's own "Sudden capability jump" card (25% on a trained model). **It stays random, as an event card
  pop-up (decision 2).** Alternative: a threshold on something the player controls (not designed).
- **D4. Lawsuits** ("always happen when the causing choice is made"). Owner: "lets make it more expensive" than the
  proposed expected-cost settlement. Then "whichever is more realistic". **Picked: the two web-crawl cards are always sued at their full listed
  cost (scraping $200M, filtered $120M); licensed data and synthetic data from your own model are never sued.** Real
  lawsuits target training on crawled copyrighted work; licensing is what buys a lab out of them. Rule in code: a card
  is sued when its `legal.chance` is at least 0.3 (only those two), at `legal.cost`.
- **D8. Fixed numbers become decision-driven. Approved by the owner 2026-09-27 ("all sounds good as additions to the
  current system").** All sit in files Part B already edits; each is a few lines plus a test.
  - Deal sizes: instead of the middle of each supplier's range, the lab's rank picks the spot in the range (first place
    gets the top, last place the bottom): suppliers give the biggest allocations to the biggest buyers.
  - Verde's era 4 letter of intent (headline delivery, today 30-100%): delivers what the lab can power when it lands
    (online site power plus the grid), at least 30%. Building sites and reserving the grid decide it.
  - Spot pull-back in eras 3 and 5: pulled when race heat is 60 or more (demand spikes), instead of every fourth round.
  - Nuclear restart delay: on time when US favor is 60 or more (permits move), one round late otherwise.
  - Rival prepay announcements in era 3: a Western rival prepays when it is short of its compute target (the compute
    race tracks this), instead of every fourth round. Taking its deals makes it short.
  - Left fixed: rival pace (each rival's own character; the compute race already ties rivals to the deals you take or
    leave), CoreFlame's 12th-month trouble (D5), site sizes.
- **D5. CoreFlame trouble (Part B).** A running total of 2% a month never reaches 1 in a normal run (about 33
  months), so the fragile supplier would disappear. **Default: a CoreFlame contract runs into trouble in its 12th
  month, stated on the offer.** Alternative: the running total (CoreFlame never fails).
- **D6. Quiet takeover and the accept-shutdown line.** The spec's words are "unless the constitution holds the
  accept-shutdown line"; today the line buys one extra step, it does not block. **Default: keep today's one-step
  buffer.** Alternative: the line blocks the takeover outright.
- **D7. "Reliably" for the aligned ending: the careful bot ends aligned in at least 120 of 200 runs (60%).**
- Note, no decision needed: `learnedConstitution` (`sim/constitution.js:155`, the spec's "learned constitution
  drift") is never called anywhere. Nothing to change unless gn-constitution wires it up; then it becomes a
  threshold on `drift`.

## Coordination and order (lanes board)

Messages sent 2026-09-26 from lane `gn-newplayer`. Replies still pending when this plan was written; check
`~/claude-sync/bin/claude-sync.sh inbox <repo> gn-newplayer` before starting each part.

| File(s) | Owner lane (state) | This plan touches it in |
|---|---|---|
| `sim/rivals.js`, `sim/contracts.js`, `sim/queue.js`, `sim/state.js`, `tools/balance.js` | gn-compute-race (built on `compute-race-build` 6238e01, not in `ui`; lands after 2026-09-27 12:00 AM PT) | Part B and C only, after it lands |
| `sim/turn.js`, `sim/power.js`, `sim/landings.js` | gn-realtime (its retune 6429c63 is in `ui`; lane quiet) | A1-A10 (one-line call changes), A6, B2 |
| `sim/constitution.js`, `sim/turn.js` | gn-constitution (active, Mac mini) | not touched (dead code, see above); turn.js call lines only |
| `sim/training.js`, `sim/release.js` | gn-model-money (active, Mac mini) | A9, A10, after its work lands in `ui` |
| `sim/summit.js`, `sim/automation.js`, event data | summit, automation, events lanes (all done) | A3, A4, A6, A8 |

gn-compute-race replied 2026-09-27 02:54 UTC: the order is agreed; its build removes none of these draws; and its
owner-picked catch-up rule makes `launchGain` in `sim/rivals.js` depend on the player's score and on launches still
waiting in `state.rivalLaunches` (from era 2: +0.5 per point a rival trails you beyond 10). **Task B1 must keep that
term** when it replaces `rng.int(0, 4)`. It will message the SHA once `compute-race-build` is in `ui` (not before
2026-09-27 12:00 AM PT).

Order: **Task 0 → Part A (A1-A8) → A9-A10 once gn-model-money is in `ui` → Part B once `compute-race-build` is in
`ui` → Part C.** Part A never edits a gn-compute-race file. gn-compute-race agreed nothing yet; its build keeps "the
same random calls in the same order", which is compatible with this order.

## Measurements

Log: `docs/design/deterministic-endings/measurements/log.md` (a table of ending counts per bot after each task) plus
the raw JSON per step in the same folder. Summary command used everywhere below:

```bash
node -e "const r=JSON.parse(require('fs').readFileSync(process.argv[1]));for(const [b,v] of Object.entries(r))console.log(b.padEnd(20),JSON.stringify(v.endings))" docs/design/deterministic-endings/measurements/<label>.json
```

---

## Task 0: Base, testers cost, baseline

**Files:**
- Modify: `sim/release.js`, `sim/data/realEvents.js`, `ui/logic/release.js`, `ui/screens/release.js`,
  `tests/real-events.test.js` (the WIP commit `1368f47`'s files, per D1)
- Create: `docs/design/deterministic-endings/measurements/log.md`, `.../before.json`

- [ ] **Step 1: Confirm the base.** `newplayer-fixes` (572a1d0) must be in `origin/ui`. gn-merge reported on
  2026-09-27 02:47 UTC that `ui` 9432137 contains it (with menu-picks, president-gate and hud-money).

```bash
git -C ~/worktrees/game-night-ai-lab-testers fetch origin && git -C ~/worktrees/game-night-ai-lab-testers merge-base --is-ancestor origin/newplayer-fixes origin/ui && echo in-ui
```
Expected: `in-ui`. If not, stop and wait; do not build on `merge-ui`.

- [ ] **Step 2: Merge `origin/ui` into `deterministic-endings`** (no rebase: pushed commits).

```bash
git -C ~/worktrees/game-night-ai-lab-testers merge origin/ui
```
Resolve conflicts, if any, in favor of `ui` for files this branch did not change.

- [ ] **Step 3: Apply D1.** With the default (a), delete the eras 1-2 users cut from the WIP: in `sim/release.js`
  remove `TESTER_USERS_MULT`, `testerHeadStart` and the `testerUsers` factor, so `users` and `newUsers` are `fresh`
  again, and keep `testerWait` (era 3 on). Update the comment above `testerNeeds` to say the testers cost a one-round
  wait from era 3, where a round is a month or less, and nothing in eras 1-2. Remove the matching UI line in
  `ui/logic/release.js` and `ui/screens/release.js` that mentions fewer launch users, and the eras 1-2 test in
  `tests/real-events.test.js`. With (b) or (c), size the cost as the owner picked instead.

- [ ] **Step 4: Run the suite.**

Run: `npm test`
Expected: every test passes except the known todo tests. The six failures the WIP caused (ui-recipe
queuedRunProblem, the ui-training share tests, the recording-script test) must be gone with (a). If they are not,
investigate with superpowers:systematic-debugging before going on.

- [ ] **Step 5: Baseline measurement.**

```bash
mkdir -p docs/design/deterministic-endings/measurements && node tools/balance.js 200 > docs/design/deterministic-endings/measurements/before.json
```
Then print the summary (command in Measurements) and write `log.md` with a header line naming the base SHA and a
first table row `before` with the ending counts per bot.

- [ ] **Step 6: Commit.**

```bash
git add sim/release.js sim/data/realEvents.js ui/logic/release.js ui/screens/release.js tests/real-events.test.js docs/design/deterministic-endings/measurements
git commit -m "feat(sim): White House testers cost a round's wait from era 3 only (owner pick D1); baseline before no-dice"
```

---

# Part A — files no active lane holds (after Task 0)

## Task A1: Event pop-ups and advisor noise get streams of their own

Rule shape: none (these stay random); this task only moves them off the shared generator.

**Files:**
- Modify: `sim/events.js` (`eventsTick`), `sim/advisors.js` (`recordAdvisors`), `sim/turn.js` (the `eventsTick` call
  in `endRound`, both `recordAdvisors` calls, the salt-list comment)
- Create: `tests/streams.test.js`

**Interfaces:**
- Produces: `export const EVENT_TRIGGER_SALT = 970` and `eventsTick(state, rng = sideRng(state, EVENT_TRIGGER_SALT))`
  in `sim/events.js`; `export const ADVISOR_SALT = 971` and `recordAdvisors(state, rng = sideRng(state,
  ADVISOR_SALT))` in `sim/advisors.js`. Tests may still pass a stub rng to force a trigger.

- [ ] **Step 1: Write the failing tests** in `tests/streams.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { sideRng } from '../sim/contracts.js';
import { eventsTick, EVENT_TRIGGER_SALT } from '../sim/events.js';
import { recordAdvisors, ADVISOR_SALT } from '../sim/advisors.js';

test('event triggers default to their own per-round stream', () => {
  const a = createInitialState({ seed: 7 });
  const b = structuredClone(a);
  assert.deepEqual(eventsTick(a), eventsTick(b, sideRng(b, EVENT_TRIGGER_SALT)));
  assert.deepEqual(a.pendingEvents, b.pendingEvents);
});

test('advisor noise defaults to its own per-round stream', () => {
  const a = createInitialState({ seed: 7 });
  const b = structuredClone(a);
  assert.deepEqual(recordAdvisors(a), recordAdvisors(b, sideRng(b, ADVISOR_SALT)));
});

test('the round loop does not feed its rng to advisors', () => {
  const start = createInitialState({ seed: 7 });
  const one = endTurn(start, {}, createRng(1)).state;
  const two = endTurn(start, {}, createRng(2)).state;
  assert.deepEqual(one.advisorHistory.at(-1), two.advisorHistory.at(-1));
});
```

- [ ] **Step 2: Run them to see them fail.**

Run: `node --test tests/streams.test.js`
Expected: FAIL (`EVENT_TRIGGER_SALT` and `ADVISOR_SALT` are not exported; the third test differs in the advisor
estimates).

- [ ] **Step 3: Implement.** In `sim/events.js`, above `eventsTick`:

```js
// Event pop-ups stay random (owner 2026-09-26), on a per-round stream of their own, so an outcome rule never reshuffles
// which events appear.
export const EVENT_TRIGGER_SALT = 970;

export function eventsTick(state, rng = sideRng(state, EVENT_TRIGGER_SALT)) {
```
In `sim/advisors.js`, add `import { sideRng } from './contracts.js';` and:

```js
// Advisor noise stays random (owner 2026-09-26: "that should stay noisy"), on a per-round stream of its own.
export const ADVISOR_SALT = 971;

export function recordAdvisors(state, rng = sideRng(state, ADVISOR_SALT)) {
```
In `sim/turn.js`: `for (const e of eventsTick(state)) events.push(e);`, `recordAdvisors(state);` (in `applyActions`
and in `endRound`), and extend the salt-list comment with `970 event triggers (sim/events.js), 971 advisor noise
(sim/advisors.js)`.

- [ ] **Step 4: Run the new tests and the suite.**

Run: `node --test tests/streams.test.js && npm test`
Expected: PASS. If the third test still fails, something else in the first round draws from the main rng and moves
state the advisors read; find it (it belongs to a later task) and make the test compare after that task instead,
noting it in the test's comment.

- [ ] **Step 5: Measure** (`node tools/balance.js 200 > .../a1.json`, add a row to `log.md`: events reshuffle once
  here, so every bot moves a little; that is expected).

- [ ] **Step 6: Commit.**

```bash
git add sim/events.js sim/advisors.js sim/turn.js tests/streams.test.js docs/design/deterministic-endings/measurements
git commit -m "feat(sim): event pop-ups and advisor noise draw from streams of their own (no dice: groundwork)"
```

## Task A2: Misuse and someone else's disaster end on counted rounds

Rule shape 4 (spec section 4): misuse on the second consecutive round over both lines; rival disaster on the third
consecutive round with race heat above 85.

**Files:**
- Modify: `sim/endings.js` (`checkTurnEndings`), `sim/balance.js` (remove `misuseRollChance`,
  `rivalDisasterChance`), `sim/turn.js` (`checkTurnEndings(state)`)
- Test: `tests/endings.test.js`; also drop the rng argument from `checkTurnEndings` calls in
  `tests/events6c.test.js` and `tests/board-read.test.js`

**Interfaces:**
- Produces: `checkTurnEndings(state)`; `export const MISUSE_ROUNDS = 2`, `export const HEAT_ROUNDS = 3`;
  counters `state.flags.misuseRounds`, `state.flags.heatRounds` (absent means 0).

- [ ] **Step 1: Replace the two dice tests** in `tests/endings.test.js` ("misuse needs capability past the danger
  line and high exposure", "race heat can end the world through a rival") with:

```js
test('misuse ends the run on the second round in a row over both lines', () => {
  const s = createInitialState();
  s.capability = 60;
  s.misuseLocked = 75;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.misuseRounds, 1);
  assert.equal(checkTurnEndings(s), 'misuse');
});

test('a round back under either misuse line resets the count', () => {
  const s = createInitialState();
  s.capability = 60;
  s.misuseLocked = 75;
  checkTurnEndings(s);
  s.capability = 50;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.misuseRounds, 0);
  s.capability = 60;
  assert.equal(checkTurnEndings(s), null);
});

test('race heat above 85 for three rounds in a row ends the world through a rival', () => {
  const s = createInitialState();
  s.raceHeat = 90;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(checkTurnEndings(s), null);
  assert.equal(checkTurnEndings(s), 'rivalDisaster');
});

test('race heat at the line resets the heat count', () => {
  const s = createInitialState();
  s.raceHeat = 90;
  checkTurnEndings(s);
  checkTurnEndings(s);
  s.raceHeat = 85;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.heatRounds, 0);
});
```
Replace `checkTurnEndings(s, no)` and `checkTurnEndings(s, yes)` everywhere in the file with `checkTurnEndings(s)`,
and delete the `yes` and `no` constants.

- [ ] **Step 2: Run to see them fail.** Run: `node --test tests/endings.test.js`. Expected: FAIL (no counters; one
  call ends at once with the old code's missing rng throwing or returning null).

- [ ] **Step 3: Implement** in `sim/endings.js`:

```js
// Owner 2026-09-26, no dice: misuse ends the run on the second round in a row over both lines, and a rival's disaster
// on the third round in a row above the heat line. Rounds before that show only through existing surfaces.
export const MISUSE_ROUNDS = 2;
export const HEAT_ROUNDS = 3;

function countDangerRounds(state) {
  const overMisuse = state.capability > BALANCE.dangerLine && effectiveMisuse(state) > BALANCE.misuseDisasterLine;
  state.flags.misuseRounds = overMisuse ? (state.flags.misuseRounds ?? 0) + 1 : 0;
  state.flags.heatRounds = state.raceHeat > BALANCE.raceHeatDisaster ? (state.flags.heatRounds ?? 0) + 1 : 0;
}

export function checkTurnEndings(state) {
  if (state.cash > 0) delete state.flags.insolvent;
  if (state.ending) return state.ending;
  countDangerRounds(state);
  // ... the cash and board-vote checks stay exactly as they are ...
  if (state.flags.misuseRounds >= MISUSE_ROUNDS) return (state.ending = 'misuse');
  if (state.flags.heatRounds >= HEAT_ROUNDS) return (state.ending = 'rivalDisaster');
  return null;
}
```
Remove `misuseRollChance` and `rivalDisasterChance` from `sim/balance.js`. In `sim/turn.js`: `checkTurnEndings(state);`.

- [ ] **Step 4: Run the suite.** Run: `npm test`. Expected: PASS (fix fixture drift per Global Constraints).

- [ ] **Step 5: Measure** (`a2.json`, row in `log.md`). Expect fewer early misuse endings and fewer rival disasters
  for the speed bot; note the counts.

- [ ] **Step 6: Commit** (`sim/endings.js sim/balance.js sim/turn.js tests/endings.test.js tests/events6c.test.js
  tests/board-read.test.js docs/design/deterministic-endings/measurements`):
  `feat(sim): misuse and rival disaster end on counted rounds (no dice: stated condition)`.

## Task A3: A quiet takeover builds up; the AI always proposes sampling its logs less

Rule shapes: 1 (running total) for the takeover story; 4 for the proposal (spec: "offered whenever monitors run").
D6 default: accept-shutdown keeps its one-step buffer, unchanged.

**Files:**
- Modify: `sim/util.js` (new `accrue`), `sim/automation.js` (`automationTick`, `aiProposals`),
  `sim/data/automation.js` (remove `LESS_LOGS_CHANCE`), `sim/turn.js` (`automationTick(state)`,
  `aiProposals(state)`, remove `AI_PROPOSAL_SALT` and its salt-list entry)
- Create: `tests/util.test.js`
- Test: `tests/automation.test.js`

**Interfaces:**
- Produces: `export function accrue(holder, key, chance)` returning `true` when the event happens (used by A4, A7, A9,
  B1, B2); `automationTick(state)`; `aiProposals(state)`; counter `state.automation.pressure` (absent means 0).

- [ ] **Step 1: Write the failing tests.** `tests/util.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accrue } from '../sim/util.js';

test('accrue fires each time the running total reaches 1 and keeps the remainder', () => {
  const h = {};
  const fired = [];
  for (let i = 0; i < 8; i++) fired.push(accrue(h, 'p', 0.3));
  assert.deepEqual(fired, [false, false, false, true, false, false, true, false]);
  assert.ok(Math.abs(h.p - 0.4) < 1e-9);
});

test('accrue treats a negative chance as zero', () => {
  const h = { p: 0.5 };
  assert.equal(accrue(h, 'p', -1), false);
  assert.equal(h.p, 0.5);
});
```
In `tests/automation.test.js`, add below the `ladder` helper:

```js
test('unchecked AI work adds up: one stage each time the pressure reaches 1', () => {
  const s = withCompute(atEra(4));
  setAutomation(s, { levels: { experiments: maxLevel(4, 1) }, checks: { reviewers: 0, monitors: 0, aiReview: false } });
  s.alignmentDebt = 60;
  s.capability = 80;
  const risk = automationRisk(s);
  assert.ok(risk > 0 && risk < 1, `risk ${risk}`);
  const quiet = Math.ceil((1 - 1e-9) / risk) - 1;
  for (let i = 0; i < quiet; i++) assert.deepEqual(ladder(automationTick(s)), []);
  assert.deepEqual(ladder(automationTick(s)), [{ type: 'internalWarning', stage: 1 }]);
});

test('with monitors running, the AI always proposes sampling its logs less', () => {
  const s = proposingState(); // the existing setup used by 'from "leads" in choosing or direction, the AI proposes its own moves'
  s.automation.checks.monitors = 1;
  assert.ok(aiProposals(s).some((proposal) => proposal.id === 'lessLogs'));
});
```
If the file has no `proposingState` helper, extract the setup of the existing "from leads…" test into one
(`const proposingState = () => { ...that test's first lines...; return s; }`) and use it in both tests. If
`experiments` is not a hand-off job id in `sim/data/automation.js` `HANDOFF_JOBS`, use the first id that is.

Rewrite the dice in the existing tests: add `const hitTick = (s) => { s.automation.pressure = 1; return
automationTick(s); };`, replace every `automationTick(s, hit)` with `hitTick(s)` and every `automationTick(x, miss)`
with `automationTick(x)`. In 'no trouble before era 3, and no roll at all when people check every piece of work',
replace the draw counter with `assert.equal(checked.automation.pressure ?? 0, 0)`. Delete `hit` and `miss` once unused.

- [ ] **Step 2: Run to see them fail.** Run: `node --test tests/util.test.js tests/automation.test.js`. Expected:
  FAIL (`accrue` missing; the ladder test hits the old roll).

- [ ] **Step 3: Implement.** `sim/util.js`:

```js
// A repeating chance without dice (owner 2026-09-26, "decisions decide the ending"): the chance adds up in
// holder[key], and the thing happens each time the total reaches 1. Same long-run rate as rolling it.
export function accrue(holder, key, chance) {
  holder[key] = (holder[key] ?? 0) + Math.max(0, chance);
  if (holder[key] < 1 - 1e-9) return false;
  holder[key] -= 1;
  return true;
}
```
`sim/automation.js`: import `accrue`; `export function automationTick(state) {`; replace the comment above the
exposure check with `// Fully checked work adds nothing. Unchecked AI work adds its risk up round by round
(a.pressure); each time the total reaches 1 the story moves one stage.` and replace
`if (!rng.chance(automationRisk(state))) return events;` with
`if (!accrue(a, 'pressure', automationRisk(state))) return events;`. `aiProposals(state)`: replace
`state.automation.checks.monitors > 0 && rng.chance(LESS_LOGS_CHANCE)` with `state.automation.checks.monitors > 0`
and drop `LESS_LOGS_CHANCE` from the import and from `sim/data/automation.js`.

- [ ] **Step 4: Run the suite.** `npm test` → PASS.
- [ ] **Step 5: Measure** (`a3.json`, row in `log.md`; watch quiet-takeover counts for the speed and random bots).
- [ ] **Step 6: Commit** (`sim/util.js sim/automation.js sim/data/automation.js sim/turn.js tests/util.test.js
  tests/automation.test.js docs/design/deterministic-endings/measurements`):
  `feat(sim): a quiet takeover builds up and the log-sampling proposal always comes (no dice: running total)`.

## Task A4: The summit's checks decide by level

Rule shapes: 2 (threshold on the per-level tables) for catches, signs and investigations; 1 (running total) for a
rival's weekly urge to break and for false alarms; no noise on the vote (spec: "vote noise → rule by check level").

**Files:**
- Modify: `sim/summit.js` (`voteMotion`, `dealWeek`, `investigate`), `sim/turn.js` (`dealWeek(state)`,
  `investigate(state, id)`)
- Test: `tests/summit.test.js`

**Interfaces:**
- Produces: `dealWeek(state)`, `investigate(state, suspicionId)`; `state.deal.breakPressure`,
  `state.deal.alarmPressure` (objects keyed by party, created on first use).

- [ ] **Step 1: Write the failing tests** (append to `tests/summit.test.js`; add the imports it lacks:
  `createInitialState`, `dealWeek`, `investigate`, `voteMotion`):

```js
const dealAt = (check) => {
  const s = createInitialState();
  s.era = 5;
  s.deal = {
    motions: [], proposals: ['computeCap'], checks: { computeCap: check }, promises: {},
    signed: { computeCap: ['openbrain', 'west'] }, binding: ['computeCap'], expelled: [], suspicions: [],
    nextSuspicion: 1, insulted: {}, playerBreaks: [], playerInspected: false, collapsed: false, playerShipped: false,
  };
  return s;
};

test('your break is caught at once under outside testers, never under self-reports', () => {
  const testers = dealAt(2);
  testers.deal.playerBreaks = ['computeCap'];
  assert.ok(dealWeek(testers).some((e) => e.type === 'playerCaught'));
  const selfReport = dealAt(1);
  selfReport.deal.playerBreaks = ['computeCap'];
  assert.ok(!dealWeek(selfReport).some((e) => e.type === 'playerCaught'));
});

test('a rival breaks when its weekly pressure adds up to 1, and leaves a sign', () => {
  const s = dealAt(0);
  s.deal.breakPressure = { openbrain: 0.99 };
  const events = dealWeek(s);
  assert.ok(events.some((e) => e.type === 'defection' && e.party === 'openbrain'));
  assert.ok(events.some((e) => e.type === 'dealSuspicion' && e.party === 'openbrain'));
});

test('looking into a real sign finds it from self-reports up, not on trust', () => {
  for (const [check, found] of [[0, false], [1, true]]) {
    const s = dealAt(check);
    s.deal.suspicions = [{ id: 's1', party: 'openbrain', real: true, gain: 6, day: 0, dueAt: 99 }];
    assert.equal(investigate(s, 's1').found, found);
  }
});

test('the same summit votes the same way every time', () => {
  const a = createInitialState({ seed: 1 });
  const b = createInitialState({ seed: 2 });
  for (const s of [a, b]) s.era = 5;
  const motions = [{ card: 'evaluators', check: 2, promises: {} }];
  assert.deepEqual(voteMotion(a, motions, 0), voteMotion(b, motions, 0));
});
```
Then rewrite the existing tests that pass stub rngs to `dealWeek`/`investigate`: a stub that forced a break becomes
`s.deal.breakPressure = { [party]: 1 }`; a stub that forced a catch or a found investigation becomes a check level
whose table value is at least 0.5 (`CATCH`: testers or inspectors; `INVESTIGATE`: self-reports and up); a stub that
forced a false alarm becomes `s.deal.alarmPressure = { [party]: 1 }`. Drop the stub arguments.

- [ ] **Step 2: Run to see them fail.** `node --test tests/summit.test.js` → FAIL.

- [ ] **Step 3: Implement** in `sim/summit.js` (import `accrue` from `./util.js`):

```js
// Owner 2026-09-26, no dice: a check level decides each one-off outcome (a table value of one half or more is a yes);
// a rival's weekly urge to break and a false alarm add up week by week (sim/util.js accrue).
const sure = (table, level) => table[level] >= 0.5;
```
- `voteMotion`: replace the two noise lines with `const vote = resolveCard(state, card, plan, () => 0, true);` and
  remove the `sideRng` import if nothing else uses it.
- `dealWeek(state)`: player breaks use `if (!sure(CATCH, level)) continue;`. Before the rival loop add
  `deal.breakPressure ??= {}; deal.alarmPressure ??= {};`; each outcome is
  `{ party, level, broke: accrue(deal.breakPressure, party, clamp(chance, 0, 1)) }`; inside, `sure(CATCH, level)` for
  the catch, `sure(SIGN_SEEN, level)` for the sign, and `accrue(deal.alarmPressure, party, FALSE_ALARM[level])` for
  the false alarm.
- `investigate(state, suspicionId)`: `if (suspicion.real && sure(INVESTIGATE, level))`.
- `sim/turn.js`: `dealWeek(state)`, `investigate(state, id)`; drop the `2000 + motion index for summit votes` entry
  from the salt list.

- [ ] **Step 4: Run the suite.** `npm test` → PASS.
- [ ] **Step 5: Measure** (`a4.json`, row in `log.md`; watch the negotiated-pace counts for the safety and balanced
  bots).
- [ ] **Step 6: Commit** (`sim/summit.js sim/turn.js tests/summit.test.js docs/design/deterministic-endings/measurements`):
  `feat(sim): the summit's checks decide by level (no dice: threshold and running total)`.

## Task A5: Launch benchmarks and press carry no noise

Rule shape 3 (average: the old ±1 to ±5 noise averaged to 0).

**Files:**
- Modify: `sim/launch.js` (`scoreLaunch`)
- Test: `tests/launch.test.js`

**Interfaces:** Produces `scoreLaunch(state, model)` (A10 drops the argument in `sim/release.js`).

- [ ] **Step 1: Write the failing test** (append to `tests/launch.test.js`, adding the imports it lacks):

```js
test('the same model scores the same launch whatever rng is passed', () => {
  const s = createInitialState();
  const model = {
    capability: 50,
    spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoningCapable: false, channel: 'api' },
    flags: [], name: 'Bot 1', priceStance: 'market', generation: 1, skipped: 0,
  };
  assert.deepEqual(scoreLaunch(structuredClone(s), model, createRng(1)), scoreLaunch(structuredClone(s), model, createRng(2)));
});
```

- [ ] **Step 2:** `node --test tests/launch.test.js` → FAIL.
- [ ] **Step 3: Implement.** In `scoreLaunch(state, model)`:

```js
      shown = clamp(Math.round(truth + evalGaming(state, capability, flags)), 0, 100);
      rival = 60;
// ...
      shown = clamp(truth + contam, 0, 100);
      rival = clamp(Math.round(rivalCap * fit * 0.95), 0, 100);
// ...
    const score = clamp(Math.round(base + c.bias(ctx)), 1, 10);
```
Add above the function: `// Owner 2026-09-26, no dice: benchmarks show the truth (plus eval gaming and contamination)
and critics score without noise.`

- [ ] **Step 4:** `npm test` → PASS. Existing launch tests that stubbed `int: () => 0` pass unchanged; any that
  expected a noisy value get the noise-free value.
- [ ] **Step 5: Measure** (`a5.json`, row in `log.md`).
- [ ] **Step 6: Commit** (`sim/launch.js tests/launch.test.js docs/...`):
  `feat(sim): launch benchmarks and press carry no noise (no dice: average)`.

## Task A6: Power sites have fixed terms; the county's cut follows public trust

Rule shapes: 3 (average) for sizes and delays; 4 (D2) for the opposition cut.

**Files:**
- Modify: `sim/power.js` (`reserveGrid`, `buildSite`, `SITE_TYPES`), `sim/data/events.js` (`siteOpposition`
  trigger), `sim/turn.js` (`buildSite(state, move.source)`; remove `SITE_RNG_SALT_BASE` and the `1000 + site ID`
  salt-list entry)
- Test: `tests/power.test.js`, `tests/compute-turn.test.js`, `tests/compute-events.test.js`

**Interfaces:**
- Produces: `reserveGrid(state)`, `buildSite(state, source)`; `siteUnits(type)` (exported, the middle of the size
  range rounded to 10: grid 350, gas 450, nuclear 300); `SITE_TYPES.nuclear.slip = 1` (rounds late, replacing
  `slipChance`), which applies only while US favor is below `NUCLEAR_ON_TIME_FAVOR = 60` (D8: permits move for a lab
  Washington likes). Grid reservation arrives at `eraStartTurn(4) + 1` when made in era 2 and `eraStartTurn(4) + 3` in
  era 3 (the average of today's draws, rounded).
- `sim/contracts.js` still passes an rng to `reserveGrid`; that call is untouched here (gn-compute-race's file) and
  harmless.

- [ ] **Step 1: Write the failing tests** (append to `tests/power.test.js`):

```js
test('sites have fixed sizes and dates: the middle of the old ranges', () => {
  const s = createInitialState();
  s.era = 2;
  s.cash = 1000;
  assert.equal(reserveGrid(s).arrivesTurn, eraStartTurn(4) + 1);
  assert.equal(s.power.sites[0].units, 350);
  const t = createInitialState();
  t.era = 3;
  t.cash = 1000;
  assert.equal(reserveGrid(t).arrivesTurn, eraStartTurn(4) + 3);
  const u = createInitialState();
  u.era = 4;
  assert.equal(buildSite(u, 'gas').arrivesTurn, u.turn + SITE_TYPES.gas.turns);
  u.govFavor.us = 50;
  assert.equal(buildSite(u, 'nuclear').arrivesTurn, u.turn + SITE_TYPES.nuclear.turns + 1);
  assert.deepEqual(u.power.sites.map((site) => site.units), [450, 300]);
});

test('a nuclear restart opens on time when US favor is 60 or more', () => {
  const s = createInitialState();
  s.era = 4;
  s.govFavor.us = 60;
  assert.equal(buildSite(s, 'nuclear').arrivesTurn, s.turn + SITE_TYPES.nuclear.turns);
});
```
Import `eraStartTurn` if the file lacks it. Rewrite the existing assertions that read `SITE_TYPES.x.size[0]` or pass
a `lo` stub (`tests/power.test.js:31,45`, `tests/compute-turn.test.js:101`) to the fixed values via `siteUnits`.
In `tests/compute-events.test.js`, add a test that the opposition cut follows public trust when the player
pushes through (the pop-up itself stays random; only its outcome becomes a rule, read at the moment of the choice):

```js
test('pushing through: the county cuts the site 30% when public trust is below 50', () => {
  for (const [trust, units] of [[45, 280], [55, 400]]) {
    const s = createInitialState();
    s.era = 4;
    s.publicTrust = trust;
    s.flags.oppositionSite = 'gas-1';
    s.power.sites.push({ id: 'gas-1', source: 'gas', units: 400, arrivesTurn: s.turn + 4, online: false });
    EVENTS.find((e) => e.id === 'siteOpposition').card.choices.find((c) => c.id === 'push').effects(s);
    assert.equal(s.power.sites[0].units, units, `trust ${trust}`);
  }
});
```
Rewrite the existing push test (`tests/compute-events.test.js:183`, which sets `oppositionCut: true`) to set public
trust below 50 instead.

- [ ] **Step 2:** run the three files → FAIL.
- [ ] **Step 3: Implement** in `sim/power.js`:

```js
// Owner 2026-09-26, no dice: every site has fixed terms, the middle of the old ranges.
export const siteUnits = (type) => Math.round((type.size[0] + type.size[1]) / 2 / 10) * 10;
```
Replace `slipChance: 0.5` with `slip: 1` in `SITE_TYPES.nuclear`; delete `roll`. `reserveGrid(state)`:
`const arrivesTurn = eraStartTurn(4) + (state.era === 2 ? 1 : 3);` and `siteUnits(SITE_TYPES.grid)`.
`buildSite(state, source)`: `const slip = state.govFavor.us >= NUCLEAR_ON_TIME_FAVOR ? 0 : (t.slip ?? 0); // D8` and
`addSite(state, source, siteUnits(t), state.turn + t.turns + slip)`, with `export const NUCLEAR_ON_TIME_FAVOR = 60;`.
In `sim/data/events.js`: in `siteOpposition.trigger` keep the pop-up roll on its stream and delete the line
`site.oppositionCut = rng.chance(0.3);`; in the `push` choice, decide the cut before the trust loss:

```js
          effects(state) {
            const cut = state.publicTrust < 50; // D2: the county wins when the public is against you (was a 30% roll)
            state.publicTrust -= 5;
            const site = state.power.sites.find((candidate) => candidate.id === state.flags.oppositionSite);
            if (site && cut) site.units = Math.round(site.units * 0.7);
            if (site) refreshOnline(state);
          },
```
Remove `oppositionCut: null` from `addSite` in `sim/power.js` (nothing reads it any more; test fixtures that still
carry the field are harmless). Update the UI copy if any screen quotes a site size range (grep `ui/` for "250" and
"450" near "grid"; none known).

- [ ] **Step 4:** `npm test` → PASS. **Step 5:** measure (`a6.json`). **Step 6: Commit** (`sim/power.js
  sim/data/events.js sim/turn.js tests/power.test.js tests/compute-turn.test.js tests/compute-events.test.js
  docs/...`): `feat(sim): power sites have fixed terms and the county's cut follows public trust (no dice: average and
  stated condition)`.

## Task A7: A promise that contradicts a held line leaks on its seventh round

Rule shape 1 (running total of the old 15% a round).

**Files:** Modify `sim/promises.js` (`promiseUpkeep`), `sim/turn.js` (`promiseUpkeep(state)`). Test
`tests/promises.test.js`.

**Interfaces:** Produces `promiseUpkeep(state)`; `promise.leakPressure`; `export const LEAK_CHANCE = 0.15`.

- [ ] **Step 1: Write the failing test** (append; reuse the file's helper that makes an open President promise whose
  definition contradicts a held line; if there is none, build one from `sim/data/promises.js` the way the existing
  leak test does):

```js
test('a promise that contradicts a held line leaks on its seventh round, not before', () => {
  const s = contradictingPromiseState(); // the existing leak test's setup, extracted
  for (let round = 1; round <= 6; round++) {
    promiseUpkeep(s);
    assert.equal(s.promises[0].leaked ?? false, false, `round ${round}`);
  }
  promiseUpkeep(s);
  assert.equal(s.promises[0].leaked, true);
});
```
Rewrite existing tests that stub `chance` for leaks: a forced leak becomes `promise.leakPressure = 1`.

- [ ] **Step 2:** `node --test tests/promises.test.js` → FAIL.
- [ ] **Step 3: Implement:** import `accrue`; `export const LEAK_CHANCE = 0.15;` with the comment `// Owner
  2026-09-26, no dice: the old 15% a round, as a running total: a promise that contradicts a held line leaks on its
  seventh such round.`; replace `!rng.chance(0.15)` with `!accrue(promise, 'leakPressure', LEAK_CHANCE)`.
- [ ] **Step 4:** `npm test` → PASS. **Step 5:** measure (`a7.json`). **Step 6: Commit**:
  `feat(sim): contradicting promises leak on a counted round (no dice: running total)`.

## Task A8: Board-event outcomes and the pooling risk follow the lab's state

Rule shape 4 (D2).

**Files:**
- Modify: `sim/data/boardEvents.js` (the `tidy` and `interview` choices, the `boardRng` comment), `sim/balance.js`
  (replace `boardRequestLeakChance` with `boardRequestLeakStaffTrust: 50`), `sim/data/events.js` (`pooling` trigger
  and `refuse` choice; remove `POOLING_RNG_SALT`), `sim/turn.js` (remove `7 pooling` from the salt list)
- Test: `tests/board-events.test.js`, `tests/compute-events.test.js`

- [ ] **Step 1: Write the failing tests.** In `tests/board-events.test.js`:

```js
const choice = (eventId, choiceId) => BOARD_EVENTS.find((e) => e.id === eventId).card.choices.find((c) => c.id === choiceId);

test('a cleaned-up safety report comes out when staff trust is below 50', () => {
  for (const [trust, leaks] of [[45, 1], [55, 0]]) {
    const s = createInitialState();
    s.staffTrust = trust;
    choice('boardRequest', 'tidy').effects(s);
    assert.equal(s.flags.candorHits ?? 0, leaks, `trust ${trust}`);
  }
});

test('a long interview goes well when hidden debt is under 40', () => {
  for (const [debt, delta] of [[30, 6], [45, -6]]) {
    const s = createInitialState();
    s.alignmentDebt = debt;
    const before = s.publicTrust;
    choice('boardOped', 'interview').effects(s);
    assert.equal(s.publicTrust - before, delta);
  }
});
```
(`BOARD_EVENTS` is already imported in that file; skip the `choice` helper if one exists.)
In `tests/compute-events.test.js`:

```js
test('refusing the compute pool marks supply-chain risk when US favor ends below 40', () => {
  for (const [favor, risk] of [[45, true], [60, false]]) {
    const s = createInitialState();
    s.govFavor.us = favor;
    EVENTS.find((e) => e.id === 'pooling').card.choices.find((c) => c.id === 'refuse').effects(s);
    assert.equal(Boolean(s.flags.supplyChainRisk), risk);
  }
});
```

- [ ] **Step 2:** run both files → FAIL.
- [ ] **Step 3: Implement.** `tidy`: `if (state.staffTrust >= BALANCE.boardRequestLeakStaffTrust) return; // D2: it
  leaks when staff are unhappy`. `interview`: `state.publicTrust += totalDebt(state) < 40 ? 6 : -6; // D2: nothing to
  hide, it goes well` (import `totalDebt` from `../hazards.js`). Update the `boardRng` comment to say the stream now
  only picks which board event is made. `pooling.trigger`: delete the `poolingRisk` line. `refuse`: replace
  `state.flags.supplyChainRisk ||= state.flags.poolingRisk;` with `if (state.govFavor.us < 40)
  state.flags.supplyChainRisk = true; // D2: Washington remembers a refusal when favor is already low`.
- [ ] **Step 4:** `npm test` → PASS. **Step 5:** measure (`a8.json`). **Step 6: Commit**:
  `feat(sim): board-event outcomes and the pooling risk follow the lab's state (no dice: stated condition)`.

---

## Task A9 (after gn-model-money is in `ui`): Training hazards follow the recipe

Rule shapes: 1 (running total) for loss spikes; 4 for reward hacking (spec: "always happen when the causing choice is
made"); D4 for lawsuits (web-crawl cards always sued at full cost; licensed and synthetic never).

**Files:**
- Modify: `sim/training.js` (`advanceRunBy`, `resolveRun`), `sim/hazards.js` (`rollTrainingHazard`, remove
  `REWARD_HACK_CHANCE`), `sim/turn.js` (the two `advanceRunBy` calls keep their positional `rng`; nothing to change
  there), `ui/logic/training.js` (drop `NO_DICE`)
- Test: `tests/training.test.js`, `tests/hazards.test.js`

**Interfaces:** Produces `advanceRunBy(state, _rng, fraction)` (slot kept), `advanceRun(state)`,
`resolveRun(state, run)`, `rollTrainingHazard(state, cards, flags)`; `run.spikePressure`.

- [ ] **Step 1: Write the failing tests.** `tests/hazards.test.js`:

```js
test('a hackable recipe always meets reward hacking', () => {
  const s = createInitialState();
  s.era = 3;
  assert.deepEqual(rollTrainingHazard(s, [{ id: 'reasoning-rl' }], []), { type: 'rewardHacking', size: rewardHackSize(3) });
  assert.equal(rollTrainingHazard(s, [{ id: 'human-sft' }], []), null);
});
```
`tests/training.test.js`:

```js
test('loss spikes add up: a run spikes when its per-round chances reach 1', () => {
  const s = runningState(); // the file's setup for an active run; extract it if needed
  s.activeRun.spikeChance = 0.4;
  s.activeRun.turnsLeft = 10;
  for (let round = 0; round < 2; round++) advanceRunBy(s, null, 1);
  assert.equal(s.activeRun.spikes, 0);
  advanceRunBy(s, null, 1);
  assert.equal(s.activeRun.spikes, 1);
});

test('web-crawl data is always sued at full cost; licensed data never', () => {
  const s = finishedRunState(['scrape-data']); // a run about to resolve with that pre-training card
  const before = s.legalCases.length;
  resolveRun(s, s.activeRun);
  assert.equal(s.legalCases.length, before + 1);
  assert.equal(s.legalCases.at(-1).cost, 200);
  const clean = finishedRunState(['licensed-data']);
  const cases = clean.legalCases.length;
  resolveRun(clean, clean.activeRun);
  assert.equal(clean.legalCases.length, cases);
});
```
Build `runningState` and `finishedRunState` from the existing training tests' setup (they already start runs with
`startRun`). Rewrite existing tests that stub `chance` for spikes, lawsuits or hazards to the rules.

- [ ] **Step 2:** run both files → FAIL.
- [ ] **Step 3: Implement.** `advanceRunBy(state, _rng, fraction)` (comment: `// _rng: kept so callers don't shift;
  training draws nothing (owner 2026-09-26)`), spike block:
  `if (accrue(run, 'spikePressure', Math.min(1, Math.max(0, run.spikeChance)))) run.spikes += 1;`,
  `state.pendingModel = resolveRun(state, run);`, `advanceRun = (state) => advanceRunBy(state, null, 1)`.
  `resolveRun(state, run)`: lawsuits become
  `if (e.legal && e.legal.chance >= 0.3) state.legalCases.push({ cost: e.legal.cost, dueTurn: state.turn + e.legal.delay, source: 'training data' }); // D4: web-crawl data is always sued, at full cost; licensed and synthetic never`,
  and the hazard call becomes `rollTrainingHazard(state, cards, flags)`. `sim/hazards.js`:
  `if (!hackable) return null;` and delete `REWARD_HACK_CHANCE`. `ui/logic/training.js`: `resolveRun(structuredClone(state),
  structuredClone(run))` and delete `NO_DICE`. `ui/logic/scenarios.js` `hazardState` still works (the first dice seed
  now always meets the hazard); leave it.
- [ ] **Step 4:** `npm test` → PASS. **Step 5:** measure (`a9.json`). **Step 6: Commit**:
  `feat(sim): training hazards follow the recipe (no dice: running total and stated condition)`.

## Task A10 (after gn-model-money is in `ui`): Misalignment is a line, not a roll

Rule shape 4 (spec): an agent release in era 3 or later goes wrong when hidden debt × capability / 100 is at least 40
(the old sigmoid's midpoint); in era 3 it is the warning incident, from era 4 the ending.

**Files:** Modify `sim/release.js` (`releaseModel`), `sim/turn.js` (`releaseModel(state, move.release)`). Test
`tests/release.test.js`.

**Interfaces:** Produces `releaseModel(state, release)`, `export const MISALIGNMENT_LINE = 40`,
`export const misalignmentScore = (state, capability) => (state.alignmentDebt + state.concealedDebt) * capability / 100`.

- [ ] **Step 1: Write the failing test:**

```js
test('an agent release over the misalignment line warns in era 3 and ends the run in era 4', () => {
  for (const [era, ending] of [[3, null], [4, 'misalignment']]) {
    const s = agentReleaseState(era); // the file's setup for an agentic pending model; extract it if needed
    s.alignmentDebt = 50;
    s.pendingModel.capability = 90; // 50 × 90 / 100 = 45, over 40
    const r = releaseModel(s, release);
    assert.equal(s.ending ?? null, ending);
    if (era === 3) assert.equal(r.misalignmentIncident, true);
  }
});

test('an agent release under the line is quiet', () => {
  const s = agentReleaseState(4);
  s.alignmentDebt = 40;
  s.pendingModel.capability = 90; // 36, under 40
  releaseModel(s, release);
  assert.equal(s.ending ?? null, null);
});
```
Rewrite existing tests that stub `chance` to force the incident to use debt and capability over the line.

- [ ] **Step 2:** `node --test tests/release.test.js` → FAIL.
- [ ] **Step 3: Implement:** add the two exports with the comment `// Owner 2026-09-26, no dice: an agent release goes
  wrong when hidden debt × capability / 100 reaches the line (the old roll's even-chance point).`; replace the
  `const p = sigmoid(...)` and `if (rng.chance(p))` lines with
  `if (misalignmentScore(state, m.capability) >= MISALIGNMENT_LINE) {`; call `scoreLaunch(state, {...})` without the
  rng; drop the `sigmoid` import if unused; `sim/turn.js`: `releaseModel(state, move.release)`.
- [ ] **Step 4:** `npm test` → PASS. **Step 5:** measure (`a10.json`; this is the biggest single mover, expect the
  balanced bot's 102 misalignments in 200 to change a lot). **Step 6: Commit**:
  `feat(sim): misalignment is a line, not a roll (no dice: stated condition)`.

---

# Part B — gn-compute-race's files (after `compute-race-build` is in `ui`)

Line numbers below are from `origin/compute-race-build` 6238e01. First step of each task: re-read the current code of
the file; if the compute race changed a spot, apply the same rule there.

- [ ] **Start of Part B:** `git merge origin/ui` into `deterministic-endings`, run `npm test`, then take a fresh
  baseline `node tools/balance.js 200 > .../b0.json` (the compute race moves every bot) and add a `b0` row to
  `log.md` marked "new base: compute race".

## Task B1: Rivals move at a fixed pace; prepay announcements come on a fixed cadence

Rule shapes: 3 (average) for pace (`1 + rng.next() × 0.3` → 1.15) and the launch roll (`rng.int(0, 4)` → 2); D8 for
the prepay announcement: a Western rival announces a prepay when it is short of its compute target
(`rivalShortfall(state, r) > 0`, from the compute race), so taking its deals makes it short.

**Files:** Modify `sim/rivals.js:101-110` (`rivalsTurn`), `sim/queue.js:103` (`queueTurn`), `sim/turn.js`
(`queueTurn(state)`). Test `tests/state.test.js`, `tests/race.test.js`, `tests/landings.test.js`,
`tests/queue.test.js`.

**Interfaces:** Produces `rivalsTurn(state, _rng, opts)` (slot kept), `queueTurn(state)`,
`export const PACE_FACTOR = 1.15`, `export const LAUNCH_ROLL = 2`. `ANNOUNCE_CHANCE` is removed.

- [ ] **Step 1: Write the failing tests** (`tests/state.test.js`):

```js
test('rivals move the same way whatever rng is passed', () => {
  const a = createInitialState();
  const b = structuredClone(a);
  rivalsTurn(a, createRng(1));
  rivalsTurn(b, createRng(2));
  assert.deepEqual(a.rivals, b.rivals);
  assert.deepEqual(a.rivalLaunches, b.rivalLaunches);
});
```
(`tests/queue.test.js`):

```js
test('a Western rival announces a prepay exactly when it is short of its compute target', () => {
  const s = queueState(); // the file's era 3 setup
  const [short, full] = s.rivals.filter((r) => !r.eastern);
  short.fleet = 0;
  full.fleet = rivalTarget(s, full) + 1000; // nothing missing, whatever is still arriving
  const labs = queueTurn(s).filter((e) => e.type === 'rivalPrepays').map((e) => e.lab);
  assert.ok(labs.includes(short.id));
  assert.ok(!labs.includes(full.id));
});
```
Rewrite the stubbed tests (`tests/state.test.js:44,58`, `tests/race.test.js:57`, `tests/landings.test.js:56`,
`tests/queue.test.js:69,85,93,95,110`): expected gains use `LAUNCH_ROLL`, progress uses `PACE_FACTOR`, a forced
announcement becomes a rival with `fleet = 0`; a forced silence becomes a fleet above its target.

- [ ] **Step 2:** run the four files → FAIL.
- [ ] **Step 3: Implement.** `sim/rivals.js`:

```js
// Owner 2026-09-26, no dice: each rival moves at a fixed pace (the old roll's average) and launches with the old
// roll's middle value.
export const PACE_FACTOR = 1.15;
export const LAUNCH_ROLL = 2;
```
`rivalsTurn(state, _rng, { deferTo = null } = {})`: `const step = r.speed * 0.35 * PACE_FACTOR;` and
`launchGain(state, r, LAUNCH_ROLL, ...)`, keeping gn-compute-race's catch-up term untouched. `sim/queue.js` (import
`rivalShortfall` from `./rivals.js`): replace `if (rng.chance(ANNOUNCE_CHANCE)) {` with
`if (rivalShortfall(state, r) > 0) { // D8: a rival short of compute prepays for priority` and delete
`ANNOUNCE_CHANCE`.
`sim/turn.js`: `queueTurn(state)`; the `rivalsTurn(state, rng, ...)` call may stay.

- [ ] **Step 4:** `npm test` → PASS. **Step 5:** measure (`b1.json`). **Step 6: Commit**:
  `feat(sim): rivals move at a fixed pace and prepay when short of compute (no dice: average and stated condition)`.

## Task B2: Compute deals have fixed, stated terms

Rules (D8, D5): offer sizes follow the lab's rank (first place gets the top of the supplier's range, last place the
bottom); Verde's era 4 letter of intent delivers what the lab can power when it lands, at least 30% of the headline;
spot compute in eras 3 and 5 is pulled when race heat is 60 or more; CoreFlame runs into trouble in its 12th month.

**Files:** Modify `sim/contracts.js:50` (`generateOffers`), `:65` (`refreshOffers`), `:99` (`arrive`), `:194-198`
(`contractsTurn`), `signOffer`, `deliverDue`; `sim/data/compute.js` (`CORE_FLAME_TROUBLE_MONTHS = 12`, and the
CoreFlame offer `string` to say "runs into trouble in its 12th month"); `sim/turn.js` (`contractsTurn(state)`,
`refreshOffers(state)`, `signOffer(state, move.offerId)`); `sim/landings.js:72` (leave the `deliverDue` call: the slot
stays). Test `tests/contracts.test.js`, `tests/investor-strings.test.js`, `tests/race.test.js`, `tests/ui-compute.test.js`.

**Interfaces:** Produces `generateOffers(state)`, `refreshOffers(state)`, `signOffer(state, offerId)`,
`contractsTurn(state)`, `deliverDue(state, _rng, due, opts)` (slot kept), `export const LOI_FLOOR = 0.3`,
`export const SPOT_PULL_HEAT = 60` (in `sim/data/compute.js`), `c.monthsRun`.

- [ ] **Step 1: Write the failing tests** (`tests/contracts.test.js`):

```js
test('offer sizes follow rank: first place gets the top of the range, last place the bottom', () => {
  const s = createInitialState();
  const sized = (st) => generateOffers(st).find((o) => o.supplier === 'coreflame').units;
  const [lo, hi] = SUPPLIERS.coreflame.size;
  for (const r of s.rivals) r.capability = 0; // you lead
  assert.equal(sized(s), hi * eraScale(s.era));
  for (const r of s.rivals) r.capability = 100; // you trail everyone
  assert.equal(sized(s), lo * eraScale(s.era));
});

test('a letter of intent delivers what you can power, at least 30%', () => {
  const s = headlineState(); // the file's LOI setup: a pipeline item carrying headline 100, now due
  s.power.sites = [{ id: 'grid-1', source: 'grid', units: 70, arrivesTurn: 0, online: true }];
  deliverDue(s, null);
  assert.equal(s.compute.contracts.at(-1).units, 70);
  const dark = headlineState();
  dark.power.sites = [];
  deliverDue(dark, null);
  assert.equal(dark.compute.contracts.at(-1).units, 30);
});

test('spot compute is pulled in era 3 when race heat is 60 or more', () => {
  for (const [heat, pulled] of [[55, false], [60, true]]) {
    const s = spotState(3); // era 3 with one arrived spot contract
    s.raceHeat = heat;
    assert.equal(contractsTurn(s).warnedBump, pulled, `heat ${heat}`);
  }
});

test('a CoreFlame contract runs into trouble in its 12th month', () => {
  const s = coreflameState(3); // era 3 (one month a round) with one arrived CoreFlame contract
  for (let month = 1; month <= 11; month++) contractsTurn(s);
  assert.equal(s.compute.contracts[0].troubled, false);
  contractsTurn(s);
  assert.equal(s.compute.contracts[0].troubled, true);
});
```
Build the helpers from the file's existing setup; replace the `small` helper (`:17`, "the lo rng rolls the low end")
with a `mid` helper using the middle of the range, and rewrite `fire`/`lo` stubbed calls to the rules.

- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3: Implement.** `generateOffers(state)`: `const units = Math.round((s.size[0] + s.size[1]) / 2) *
  eraScale(era);`. `refreshOffers(state)`: `const fresh = generateOffers(state);`. `arrive(state, p)`:
  `const units = p.headline ? loiDelivery(state, p.headline) : p.units;` with

```js
// D8: a letter of intent delivers what the lab can power when it lands (online site power, the grid included, not
// already used by contracts that need power), and never less than 30% of the headline.
export const LOI_FLOOR = 0.3;
const freePower = (state) => Math.max(0, sitePower(state)
  - state.compute.contracts.filter((c) => c.needsPower && !c.dark).reduce((sum, c) => sum + c.units, 0));
const loiDelivery = (state, headline) => Math.max(Math.round(headline * LOI_FLOOR), Math.min(headline, Math.floor(freePower(state))));
```
  (import `sitePower` from `./power.js`). Offer sizes in `generateOffers(state)`, replacing the middle-of-range line
  above:

```js
    // D8: suppliers give the biggest allocations to the biggest buyers: first place gets the top of the range.
    const labs = state.rivals.length + 1;
    const standing = (labs - rank(state)) / (labs - 1);
    const units = Math.round(s.size[0] + (s.size[1] - s.size[0]) * standing) * eraScale(era);
```
  (import `rank` from `./rivals.js`; the import cycle is safe because both are only called at run time).
  `deliverDue(state, _rng, due, opts)` calls `arrive(state, p)`. (The first `generateOffers` line in this step, the
  middle of the range, is replaced by the rank rule above.) `signOffer(state, offerId)` (its `reserveGrid` call
  loses the rng). `contractsTurn(state)` (import `accrue`):

```js
  // D8: in the tight eras, spot capacity is pulled for prepaid customers when race heat is 60 or more.
  const warnedBump = spots.length > 0 && (BUMP_CHANCE[state.era] ?? 0) > 0 && state.raceHeat >= SPOT_PULL_HEAT;
  if (warnedBump) for (const c of spots) c.bumpTurn = state.turn + 1; // serves (and bills) one more turn
  for (const c of state.compute.contracts) {
    if (c.arrivedTurn > state.turn) continue;
    if (c.supplier !== 'coreflame' || c.troubled) continue;
    c.monthsRun = (c.monthsRun ?? 0) + months;
    if (c.monthsRun >= CORE_FLAME_TROUBLE_MONTHS - 1e-9) c.troubled = true; // D5: a stated term, not a 2% monthly roll
  }
```
Remove `FRAGILE_MONTHLY` if nothing else uses it; update the salt-list comment (`1 deals`, `3 contracts`,
`5 offers`, `6 deliveries` are gone once nothing passes them; keep any still used).

- [ ] **Step 4:** `npm test` → PASS. **Step 5:** measure (`b2.json`). **Step 6: Commit**:
  `feat(sim): compute deal terms follow rank, power, race heat and time (no dice: stated conditions)`.

## Task B3: Every game starts the same

Rule: owner decision 4. After B1 and B2 nothing at the start draws, so this task removes the seed from the start and
proves it.

**Files:** Modify `sim/state.js:103-104`. Test `tests/state.test.js`.

- [ ] **Step 1: Write the failing test:**

```js
test('every game starts the same, whatever the seed', () => {
  const one = createInitialState({ seed: 1 });
  const two = createInitialState({ seed: 99 });
  delete one.seed;
  delete two.seed;
  assert.deepEqual(one, two);
});
```
- [ ] **Step 2:** `node --test tests/state.test.js`. Expected: PASS already if B1-B2 removed every start draw; if it
  FAILS, the diff names the field that still depends on the seed. Fix that field's rule in the file that owns it.
- [ ] **Step 3: Implement:** `state.compute.offers = generateOffers(state);` and
  `rivalsTurn(state, null, { deferTo: 0 });`; remove `RIVAL_START_SALT`, the `sideRng` import if unused, and the
  `0 initial offers` and `950` entries from the salt list in `sim/turn.js`.
- [ ] **Step 4:** `npm test` → PASS. **Step 5: Commit**: `feat(sim): every game starts the same (owner decision 4)`.

---

# Part C — prove it, tune it, hand it on

## Task C1: No outcome draws anywhere (the invariant)

**Files:** Create `tests/determinism.test.js`; modify `sim/turn.js` only to remove now-dead rng passing it finds.

- [ ] **Step 1: Write the test:**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { STRATEGIES } from '../tools/balance.js';

// Any draw from the game's rng throws: after this change only event pop-ups, advisor noise and the feed draw, each
// from its own stream (owner 2026-09-26).
const NO_DICE = new Proxy({}, { get: (_, key) => () => { throw new Error(`the sim drew ${String(key)} from the game's rng`); } });

for (const name of ['speed', 'safety', 'balanced', 'random']) {
  test(`${name}: a whole run never draws from the game's rng`, () => {
    for (const seed of [1, 2, 3]) {
      const botRng = createRng(seed);
      let state = createInitialState({ seed });
      for (let i = 0; i < 30 && !state.ending; i++) state = endTurn(state, STRATEGIES[name](state, botRng), NO_DICE).state;
      assert.ok(state.ending, `seed ${seed} reached an ending`);
    }
  });
}
```
- [ ] **Step 2:** `node --test tests/determinism.test.js`. Expected: PASS. Each failure's message names the method;
  the stack names the file. Apply that file's rule shape (Global Constraints), add a unit test for it, and rerun.
- [ ] **Step 3:** `npm test` → PASS. **Step 4: Commit**: `test(sim): a whole run never draws outcome dice`.

## Task C2: A careful, well-funded bot

The spec's aligned scenario as a bot: the safety bot's choices (principles-based character training, full evals plus
a third-party evaluator, safety compute at or above the era target, first choices on event cards, which include
"Sign all of it") with the balanced bot's money habits.

**Files:** Modify `tools/balance.js` (new `careful` strategy, listed in `STRATEGIES` but not in `PROBES`). Test
`tests/balance.test.js`.

- [ ] **Step 1: Write the failing test:**

```js
test('the careful bot plays a whole run without rejected actions', () => {
  const report = runBalance(5);
  assert.ok(report.careful, 'careful is in the report');
  assert.equal(report.careful.rejectedActions, 0);
});
```
- [ ] **Step 2:** `node --test tests/balance.test.js` → FAIL (`careful` missing).
- [ ] **Step 3: Implement** after the `balanced` strategy:

```js
// The aligned-ending scenario (docs/superpowers/specs/2026-09-26-deterministic-endings-design.md section 4): the
// safety bot's choices, with the balanced bot's money habits so it can stay first.
const carefulPrefs = {
  ...safetyPrefs,
  alignShare: 0.3,
  spendLevel: 'aggressive',
  spendLevelByEra: { 1: 'steady' },
  split: balancedPrefs.split,
  computeSafety: Math.max(...ERAS.map((era) => era.targetSafetyShare)),
};
const careful = makeStrategy('safety', carefulPrefs, { offer: 'cheapest', queue: 'standard', grid: true, pledge: 0.2, avoidNamed: true });
```
Import `ERAS` from `../sim/data/eras.js`; add `careful` to `STRATEGIES`. If a run shows rejected actions, fix the
bot, not the sim.
- [ ] **Step 4:** `npm test` → PASS. **Step 5: Commit**: `feat(balance): a careful, well-funded bot for the aligned scenario`.

## Task C3: Tune until the aligned ending is reachable; report before and after

- [ ] **Step 1: Measure** `node tools/balance.js 200 > .../c3-start.json`; add the row.
- [ ] **Step 2: Check the careful bot plays the scenario.** Play one run with a print of the choices per round
  (`simulate('careful', 1)` in a scratch script outside the repo) and confirm: principles-based character training,
  eval-full and eval-third on releases, safety share at or above target, every White House line signed, red-team
  findings published. Fix the bot where it does not.
- [ ] **Step 3: Tune toward D7** (aligned in at least 120 of 200 careful runs) with levers in this order, one at a
  time, measuring after each and logging every try in `log.md` (including the ones reverted): (1) the careful bot's
  own knobs (`alignShare`, `computeSafety`, spend, offer policy); (2) the new rule lines (misalignment line 40,
  `MISUSE_ROUNDS`, `HEAT_ROUNDS`); (3) only then existing constants, sized against existing effects. The compute
  race's rule stands: add rival pressure only from era 2 and at the top, never in era 1.
- [ ] **Step 4: Report.** In `log.md`, a before-and-after table per bot and ending (`before`, `b0`, final), and a
  plain-language paragraph on each ending that moved more than 5 of 200. Amend the spec's section 3 table: correct the
  `events6c.js:104` row (D3), add the four rolls from D2, and record D1 and D4-D7 as picked.
- [ ] **Step 5:** `npm test` → PASS. **Step 6: Commit**: `chore(balance): tune for a reachable aligned ending; before
  and after numbers`.

## Task C4: Review and hand to gn-merge

- [ ] **Step 1: Tier 2 review of the whole branch diff against `origin/ui`** (one review of the combined diff, not
  per task). The owner routes reviews to Opus subagents as of 2026-09-26 (memory "Opus, not Codex"); if Codex is back
  in use, run the adversarial `codex exec` pass from `~/.claude/CLAUDE.md` with `< /dev/null`. Adjudicate, fix
  Critical and Important findings in one wave, re-verify, at most three rounds.
- [ ] **Step 2: Tier 3 pre-merge review** (the full pair, concurrently, with one mutation-guard snapshot around both).
- [ ] **Step 3: Push** `deterministic-endings` (own Bash call) and message gn-merge with the SHA, the files touched in
  other lanes' areas, and that `tools/demo-seeds.js` seeds must be re-found (outcomes changed).
- [ ] **Step 4:** set the lane: `claude-sync.sh claim <repo> gn-newplayer ... status=done` once gn-merge has it.
