# Real time, stage 2: things land on their own days — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rival launches, lawsuit bills, President-promise thank-yous, compute deliveries and new power sites stop bunching on the hidden round mark and land on their own story days inside the round.

**Architecture:** Every scheduled item keeps its round field (`dueTurn`, `arrivesTurn`) exactly as today, and the mark code that fires it stays as a backstop. A new module, `sim/landings.js`, gives each item a landing day inside the round whose mark used to fire it, and fires it on that day from `advanceDays`. Rival rolls stay at the mark with the same random draws; a launch rolled there lands on the day its bar would fill during the next round.

**Tech Stack:** Plain ES modules, `node --test` (`npm test`), `npm run balance` (200 runs per strategy).

## Owner decisions (2026-09-26, this session)

1. **Durations: "Same round, a day in it."** Each thing comes due in the same round as today, on a day inside that round, like stage 1's cards.
2. **Random rolls: "Roll at the mark, play out daily."** Rival progress rolls at the mark as today; the launch happens on the day the bar fills. Event rolls stay at the mark (stage 1 already spreads their cards).
3. **Marks: "Keep marks and their beats."** Team slots, board votes, the President meetings, the summit and its weekly deal checks, automation, AI proposals and finance rows stay on the marks. Eras end on the same days (364, 728, 848, 968, 996).
4. **If late:** undecided. The owner decides around 7:30 PM PT. Build the tasks in order so each finished one can ship alone.
5. **Deliveries stay on the mark ("C", owner pick after Task 4's balance run).** Early compute starts billing early, and it moved 13 endings more than 5 points (the speed strategy swung about 20 points). Billing from the old date still moved 7 endings, with speed's going-broke rate up 13 points. Task 4 was reverted, compute and sites are no longer stamped, and Task 5 is dropped: the screens keep showing the mark dates, which stay true. Deliveries get a proper retune after the deadline.

## Global Constraints

- Work in `~/worktrees/game-night-ai-lab-realtime-stage2` on branch `realtime-stage2` (based on `origin/ui` `bbaa2ab`). Do not push `ui`; gn-merge merges extras one at a time. `ui` cutoff 8 PM PT.
- Do not change `sim/training.js` or `ui/clock.js`: gn-merge's parked `pacing` branch owns them.
- Do not move anything off the marks that decision 3 keeps there. `endTurn` stays `applyActions` plus advancing to the next mark.
- Keep the round fields (`dueTurn`, `arrivesTurn`) and every existing mark check. New code adds `landsDay` (the story day it lands) and `landsFor` (the round it was stamped for) beside them. Items created on other branches (gn-events adds lawsuits and site delays in `sim/data/realEvents.js`) get landing days with no edits to their creation code.
- Landing days never draw from the game's shared random numbers (`rng`). Use `landingDay`'s own hash so the main random order stays as it is.
- One commit per task, staged by explicit path, message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After each task, run `npm test` (baseline 796 tests: 792 pass, 0 fail, 4 todo) and `npm run balance`. Compare the ending mix with `scratchpad/balance-before.txt` (the `bbaa2ab` baseline) using the Task 6 script. The owner allows a deliberate retune ("we will balance it out"). Report the before and after, and flag any ending that moves more than 5 points.

## Round and day facts the tasks rely on

- `ROUND_DAYS = { 1: 91, 2: 91, 3: 30, 4: 30, 5: 7 }`, and there are four rounds per era, so there are 20 rounds and the run ends at the mark on day 996.
- A round's daily steps take `state.day` from `start + 1` to `end`. The mark code (`endRound`) runs inside the step that makes `state.day === end`, after that step's daily work. So a landing day `d` with `start < d <= end` fires inside the round, at the latest on the mark day, before `endRound`.
- Lawsuits (`legalTick`) and promises (`promiseUpkeep`) fire at the mark that ends round `dueTurn`. Their landing round is `dueTurn`.
- Deliveries (`deliverDue`) and sites (`powerTurn`) fire after `state.turn += 1`, at the mark that ends round `arrivesTurn - 1`. Their landing round is `arrivesTurn - 1`.

## File map

- Modify `sim/time.js`: add `eraOfRound(round)` and `roundSpan(round)`.
- Create `sim/landings.js`: `landingDay`, `stampLandings` and `landDue`.
- Modify `sim/economy.js` (`legalTick`), `sim/contracts.js` (`deliverDue`), `sim/power.js` (`powerTurn`) and `sim/promises.js` (split out `keepPromises`). Each gets an optional `due` predicate that defaults to today's check.
- Modify `sim/rivals.js`: `rivalsTurn(state, rng, { deferTo })` and `landRivals(state)`.
- Modify `sim/state.js`: `rivalLaunches: []` and `rivalLaunchesThisRound: []`.
- Modify `sim/turn.js`: call `landDue` daily, stamp at the end of `applyActions` and `endRound`, and defer rival launches.
- Modify `ui/logic/compute.js` and `ui/screens/sites.js`: show landing dates.
- Tests: `tests/time.test.js`, new `tests/landings.test.js`.

---

### Task 1: Round spans and landing days

**Files:**
- Modify: `sim/time.js`
- Create: `sim/landings.js`
- Test: `tests/time.test.js`, `tests/landings.test.js`

**Interfaces:**
- Produces: `eraOfRound(round) -> 1..5`; `roundSpan(round) -> { start, end }`; `landingDay(state, key, round) -> day`; `stampLandings(state)` (sets `landsDay` and `landsFor` on legal cases, President promises, pipeline items and unbuilt sites).

- [ ] **Step 1: Write the failing tests.** Append to `tests/time.test.js`:

```js
import { roundSpan, eraOfRound } from '../sim/time.js';

test('round spans walk the era lengths', () => {
  assert.deepEqual(roundSpan(0), { start: 0, end: 91 });
  assert.deepEqual(roundSpan(4), { start: 364, end: 455 });
  assert.deepEqual(roundSpan(8), { start: 728, end: 758 });
  assert.deepEqual(roundSpan(19), { start: 989, end: 996 });
  assert.equal(eraOfRound(3), 1);
  assert.equal(eraOfRound(16), 5);
  assert.equal(eraOfRound(25), 5);
});

test('every mark falls on its round span end', () => {
  const rng = createRng(8);
  let s = createInitialState({ seed: 8 });
  while (!s.ending && s.turn < 20) {
    const turn = s.turn;
    s = endTurn(s, {}, rng).state;
    if (!s.ending) assert.equal(s.day, roundSpan(turn).end);
  }
});
```

Create `tests/landings.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { roundSpan } from '../sim/time.js';
import { landingDay, stampLandings } from '../sim/landings.js';

test('a landing day falls inside its round and never in the past', () => {
  const s = createInitialState({ seed: 4 });
  const { start, end } = roundSpan(2);
  for (const key of ['a', 'b', 'c', 'd']) {
    const day = landingDay(s, key, 2);
    assert.ok(day > start && day <= end, `${key}: ${day}`);
    assert.equal(landingDay(s, key, 2), day); // same seed and key, same day
  }
  s.day = 150;
  const late = landingDay(s, 'a', 1);
  assert.ok(late > 150 && late <= roundSpan(1).end);
  s.day = 400;
  assert.equal(landingDay(s, 'a', 1), roundSpan(1).end); // a round already over lands at once
});

test('stamping gives each scheduled item a day and restamps a moved one', () => {
  const s = createInitialState({ seed: 4 });
  s.legalCases.push({ cost: 50, dueTurn: 3, source: 'test' });
  s.power.sites.push({ id: 'gas-t', source: 'gas', units: 40, arrivesTurn: 3, online: false, oppositionCut: null });
  stampLandings(s);
  const [legal] = s.legalCases;
  const site = s.power.sites.find((x) => x.id === 'gas-t');
  assert.equal(legal.landsFor, 3);
  assert.ok(legal.landsDay > roundSpan(3).start && legal.landsDay <= roundSpan(3).end);
  assert.equal(site.landsFor, 2);
  site.arrivesTurn += 1; // an event delays the build
  stampLandings(s);
  assert.equal(site.landsFor, 3);
  assert.ok(site.landsDay > roundSpan(3).start);
});
```

- [ ] **Step 2: Run them and confirm they fail.** Run `node --test tests/time.test.js tests/landings.test.js`. Expected: FAIL, because `roundSpan` is not exported and `sim/landings.js` does not exist.

- [ ] **Step 3: Implement.** Append to `sim/time.js`:

```js
// The era a round belongs to (ERAS[].turns rounds each); rounds past the run count as the last era.
export function eraOfRound(round) {
  let left = round;
  for (const era of ERAS) {
    if (left < era.turns) return era.id;
    left -= era.turns;
  }
  return ERAS.at(-1).id;
}

// Round `round` runs from the day after `start` to its mark on day `end`.
export function roundSpan(round) {
  let start = 0;
  for (let r = 0; r < round; r += 1) start += ROUND_DAYS[eraOfRound(r)];
  return { start, end: start + ROUND_DAYS[eraOfRound(round)] };
}
```

Create `sim/landings.js`:

```js
import { createRng } from './rng.js';
import { roundSpan } from './time.js';

// FNV-1a over the seed and a key, so a landing day never draws from the game's shared random numbers.
function hashKey(seed, key) {
  let h = 2166136261;
  for (const ch of `${seed}:${key}`) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// A day inside `round` that has not passed yet; the round's mark day when the round is already over.
export function landingDay(state, key, round) {
  const { start, end } = roundSpan(round);
  const from = Math.max(start, state.day);
  if (from >= end) return end;
  return from + 1 + createRng(hashKey(state.seed ?? 1, key)).int(0, end - from - 1);
}

function stamp(state, item, round, key) {
  if (item.landsFor === round && item.landsDay != null) return;
  item.landsFor = round;
  item.landsDay = landingDay(state, key, round);
}

// Owner pick (2026-09-26): each thing lands in the round whose mark used to fire it, on a day inside that round.
// Lawsuits and promises fired at the mark ending round dueTurn; deliveries and sites at the mark ending arrivesTurn - 1.
export function stampLandings(state) {
  for (const c of state.legalCases) stamp(state, c, c.dueTurn, `legal:${c.source}:${c.cost}:${c.dueTurn}`);
  for (const p of state.promises) {
    if (p.source === 'president' && p.dueTurn != null) stamp(state, p, p.dueTurn, `promise:${p.meeting}:${p.id}`);
  }
  for (const p of state.compute.pipeline) stamp(state, p, p.arrivesTurn - 1, `pipeline:${p.id}:${p.arrivesTurn}`);
  for (const s of state.power.sites) if (!s.online) stamp(state, s, s.arrivesTurn - 1, `site:${s.id}`);
}
```

- [ ] **Step 4: Run the tests and confirm they pass.** Run `node --test tests/time.test.js tests/landings.test.js`, then `npm test`. Expected: all pass; the full suite is still 792 pass, 0 fail, 4 todo, plus the new tests.

- [ ] **Step 5: Commit.**

```bash
git add sim/time.js sim/landings.js tests/time.test.js tests/landings.test.js
git commit -m "feat(sim): round spans and landing days for stage 2"
```

### Task 2: Rival launches land on the day the bar fills

**Files:**
- Modify: `sim/rivals.js`, `sim/state.js`, `sim/landings.js`, `sim/turn.js` (`endRound` rival lines, `advanceDays`)
- Test: `tests/landings.test.js`

**Interfaces:**
- Consumes: `roundSpan` (Task 1).
- Produces: `rivalsTurn(state, rng, { deferTo } = {})`. With no `deferTo`, it behaves as today (the existing `tests/state.test.js` cases keep passing). With `deferTo` set to a round, launches go to `state.rivalLaunches` as `{ id, gain, heat, day }`. `landRivals(state) -> [{ id, gain }]` applies launches due by `state.day` and records them in `state.rivalLaunchesThisRound`. `landDue(state) -> events` fires everything due today.

- [ ] **Step 1: Write the failing tests.** Append to `tests/landings.test.js`:

```js
import { createRng } from '../sim/rng.js';
import { advanceDays } from '../sim/turn.js';
import { rivalsTurn, landRivals } from '../sim/rivals.js';

test('a rolled launch waits for its day in the next round', () => {
  const s = createInitialState({ seed: 1 });
  const fake = { next: () => 0, int: () => 0 };
  s.rivals[0].progress = 0.99;
  const cap = s.rivals[0].capability;
  const rolled = rivalsTurn(s, fake, { deferTo: 1 });
  assert.equal(rolled.length, 1);
  assert.equal(s.rivals[0].capability, cap); // nothing yet
  const [launch] = s.rivalLaunches;
  assert.ok(launch.day > roundSpan(1).start && launch.day <= roundSpan(1).end);
  s.day = launch.day - 1;
  assert.deepEqual(landRivals(s), []);
  s.day = launch.day;
  const [landed] = landRivals(s);
  assert.equal(landed.id, 'openbrain');
  assert.ok(s.rivals[0].capability > cap);
  assert.deepEqual(s.rivalLaunchesThisRound.map((x) => x.id), ['openbrain']);
});

test('rival launches spread across the days, not only on marks', () => {
  const rng = createRng(3);
  let s = createInitialState({ seed: 3 });
  const marks = new Set(Array.from({ length: 20 }, (_, r) => roundSpan(r).end));
  const days = [];
  while (!s.ending && s.turn < 8) {
    const r = advanceDays(s, 1, rng);
    s = r.state;
    for (const e of r.events) if (e.type === 'rivalRelease') days.push(s.day);
  }
  assert.ok(days.length >= 3, `launches: ${days}`);
  assert.ok(days.some((day) => !marks.has(day)), `launch days: ${days}`);
});
```

- [ ] **Step 2: Run them and confirm they fail.** Run `node --test tests/landings.test.js`. Expected: FAIL, because `landRivals` is not exported.

- [ ] **Step 3: Implement.** In `sim/state.js`, beside `lastRivalReleases: []`, add:

```js
    rivalLaunches: [], // launches rolled at a mark, landing on their day in the next round (stage 2)
    rivalLaunchesThisRound: [],
```

In `sim/rivals.js`, add `import { roundSpan } from './time.js';` and replace `rivalsTurn`:

```js
// With deferTo (a round), a launch rolled at this mark lands on the day its bar would fill during that round.
// The random draws are the same as the immediate form, in the same order.
export function rivalsTurn(state, rng, { deferTo = null } = {}) {
  const releases = [];
  for (const r of state.rivals) {
    const before = r.progress;
    const step = r.speed * 0.35 * (1 + rng.next() * 0.3);
    r.progress += step;
    if (r.progress >= 1) {
      r.progress = 0;
      r.releases += 1;
      const uncappedGain = (5 + rng.int(0, 4)) * (1 + 0.1 * state.era);
      const heat = 4 * r.speed * (1 - r.caution);
      if (deferTo != null) {
        const { start, end } = roundSpan(deferTo);
        const fill = Math.min(1, (1 - before) / step);
        state.rivalLaunches.push({ id: r.id, gain: uncappedGain, heat, day: Math.min(end, start + Math.max(1, Math.ceil(fill * (end - start)))) });
        releases.push({ id: r.id });
        continue;
      }
      const capability = Math.min(BALANCE.maxCapability, r.capability + uncappedGain);
      const gain = capability - r.capability;
      r.capability = capability;
      state.raceHeat += heat;
      releases.push({ id: r.id, gain });
    }
  }
  return releases;
}

export function landRivals(state) {
  const landed = [];
  state.rivalLaunches = (state.rivalLaunches ?? []).filter((launch) => {
    if (launch.day > state.day) return true;
    const r = state.rivals.find((rival) => rival.id === launch.id);
    const capability = Math.min(BALANCE.maxCapability, r.capability + launch.gain);
    landed.push({ id: r.id, gain: capability - r.capability });
    r.capability = capability;
    state.raceHeat = Math.min(100, state.raceHeat + launch.heat);
    return false;
  });
  (state.rivalLaunchesThisRound ??= []).push(...landed);
  return landed;
}
```

Append `landDue` to `sim/landings.js` (the Task 3 and Task 4 lines join it later):

```js
import { landRivals } from './rivals.js';

// Everything that lands today (stage 2), fired from advanceDays before the mark code.
export function landDue(state) {
  stampLandings(state);
  const events = [];
  for (const r of landRivals(state)) events.push({ type: 'rivalRelease', ...r });
  return events;
}
```

In `sim/turn.js`, import `landDue` and `stampLandings` from `./landings.js`. In `endRound`, replace the two `rivalsTurn` lines with:

```js
      // Stage 2: the event cards read the launches that landed this round; the roll schedules next round's.
      state.lastRivalReleases = state.rivalLaunchesThisRound ?? [];
      state.rivalLaunchesThisRound = [];
      rivalsTurn(state, rng, { deferTo: state.turn + 1 });
```

In `advanceDays`, directly after `for (const e of resolveDue(state)) events.push(e);`, add:

```js
    const landed = landDue(state);
    if (landed.length) {
      events.push(...landed);
      updateServing(state);
      state.burnPlanned = projectBurn(state);
    }
```

At the end of `applyActions`, just before `recheckCapacity(state);`, add `stampLandings(state);` so the screens see the dates at once. At the very end of `endRound`, after the `finishEnding` block, add `if (!state.ending) stampLandings(state);`.

- [ ] **Step 4: Run the tests and confirm they pass.** Run `node --test tests/landings.test.js tests/state.test.js`, then `npm test`. Some existing tests may assert on a rival release at a mark, or compare whole state objects that now carry `landsDay` and `landsFor`. Update those assertions to the new timing only, and list each one in the task report.

- [ ] **Step 5: Measure the balance.** Run `npm run balance > scratchpad/balance-task2.txt` and compare it with the baseline using the Task 6 script. Put the table in the report.

- [ ] **Step 6: Commit.**

```bash
git add sim/rivals.js sim/state.js sim/landings.js sim/turn.js tests/landings.test.js <any test files updated in step 4>
git commit -m "feat(sim): rival launches land on the day their bar fills (stage 2)"
```

### Task 3: Lawsuit bills and promise thank-yous land on their day

**Files:**
- Modify: `sim/economy.js` (`legalTick`), `sim/promises.js`, `sim/landings.js`
- Test: `tests/landings.test.js`

**Interfaces:**
- Consumes: `stampLandings`, `landDue` (Tasks 1 and 2).
- Produces: `legalTick(state, due = (c) => c.dueTurn <= state.turn)`; `keepPromises(state, due = (p) => p.dueTurn <= state.turn)`, the first loop of `promiseUpkeep`, split out unchanged.

- [ ] **Step 1: Write the failing tests.** Append to `tests/landings.test.js`:

```js
import { applyActions } from '../sim/turn.js';
import { createPresidentPromise } from '../sim/promises.js';

function advanceTo(s, day, rng) {
  let events = [];
  while (s.day < day) {
    const r = advanceDays(s, 1, rng);
    s = r.state;
    events = r.events;
  }
  return { s, events };
}

test('a lawsuit is billed on its landing day, inside its round', () => {
  const rng = createRng(5);
  let s = createInitialState({ seed: 5 });
  s.legalCases.push({ cost: 50, dueTurn: 1, source: 'test' });
  s = applyActions(s, {}, rng).state;
  const due = s.legalCases.find((c) => c.source === 'test').landsDay;
  assert.ok(due > roundSpan(1).start && due <= roundSpan(1).end);
  let r = advanceTo(s, due - 1, rng);
  assert.ok(r.s.legalCases.some((c) => c.source === 'test'));
  r = advanceTo(r.s, due, rng);
  assert.ok(r.events.some((e) => e.type === 'lawsuitPaid' && e.source === 'test'));
  assert.ok(!r.s.legalCases.some((c) => c.source === 'test'));
});

test('a kept President promise is thanked on its landing day', () => {
  const rng = createRng(6);
  let s = advanceDays(createInitialState({ seed: 6 }), 91, rng).state; // the first mark sets the default constitution
  const promise = createPresidentPromise('killSwitch', 'second', s.turn, s); // due 2 rounds on; kept while 'accept-shutdown' holds
  s.promises.push(promise);
  s = applyActions(s, {}, rng).state;
  const day = s.promises.at(-1).landsDay;
  let r = advanceTo(s, day - 1, rng);
  assert.equal(r.s.promises.at(-1).status, 'open');
  r = advanceTo(r.s, day, rng);
  assert.equal(r.s.promises.at(-1).status, 'kept');
});
```

- [ ] **Step 2: Run them and confirm they fail.** Run `node --test tests/landings.test.js`. Expected: the two new tests FAIL, because both items still fire only at the mark.

- [ ] **Step 3: Implement.** In `sim/economy.js`:

```js
export function legalTick(state, due = (c) => c.dueTurn <= state.turn) {
  const multiplier = state.flags.statePreemption === true ? STATE_PREEMPTION_LEGAL_COST_MULTIPLIER : 1;
  const paid = state.legalCases
    .filter(due)
    .map((c) => ({ ...c, cost: c.cost * multiplier }));
  state.legalCases = state.legalCases.filter((c) => !due(c));
  for (const c of paid) {
    state.cash -= c.cost;
    state.publicTrust -= 3;
  }
  return paid;
}
```

In `sim/promises.js`, move the first loop of `promiseUpkeep` into:

```js
// Thanks the lab for each open President promise that has come due (by `due`) and is kept.
export function keepPromises(state, due = (promise) => promise.dueTurn <= state.turn) {
  for (const promise of state.promises) {
    if (!isPresidentPromise(promise)
      || promise.status !== 'open'
      || isEndgamePromise(promise)
      || !due(promise)) continue;
    if (!promiseDefinition(promise).check(state, promise)) continue;
    promise.status = 'kept';
    state.govFavor.us += 5;
    pushFeed(state, '@executive_office', `Thank you to the lab for keeping its promise: “${promise.text}”`, 'event');
  }
}
```

`promiseUpkeep` then starts with `keepPromises(state);` followed by its unchanged leak loop. A promise that is not kept on its landing day is still checked again at the mark, and it fails there as today, so the player keeps the same time to keep it.

In `sim/landings.js`, import `legalTick` from `./economy.js` and `keepPromises` from `./promises.js`, and extend `landDue`:

```js
  const landed = (item) => item.landsDay != null && item.landsDay <= state.day;
  for (const c of legalTick(state, landed)) events.push({ type: 'lawsuitPaid', cost: c.cost, source: c.source });
  keepPromises(state, landed);
```

- [ ] **Step 4: Run the tests and confirm they pass.** Run `node --test tests/landings.test.js tests/economy.test.js tests/promises.test.js`, then `npm test`. Update only assertions that depended on mark-day timing, and list them in the report.

- [ ] **Step 5: Measure the balance** as in Task 2, into `scratchpad/balance-task3.txt`.

- [ ] **Step 6: Commit.**

```bash
git add sim/economy.js sim/promises.js sim/landings.js tests/landings.test.js <updated tests>
git commit -m "feat(sim): lawsuits and kept promises land on their day (stage 2)"
```

### Task 4: Compute deliveries and power sites land on their day

**Files:**
- Modify: `sim/contracts.js` (`deliverDue`), `sim/power.js` (`powerTurn`), `sim/landings.js`
- Test: `tests/landings.test.js`

**Interfaces:**
- Produces: `deliverDue(state, rng, due = (p) => p.arrivesTurn <= state.turn)`; `powerTurn(state, due = (s) => s.arrivesTurn <= state.turn)`.

- [ ] **Step 1: Write the failing tests.** Append to `tests/landings.test.js`:

```js
import { addPipeline } from '../sim/contracts.js';

test('bought compute arrives on its landing day, a round before its old mark', () => {
  const rng = createRng(7);
  let s = createInitialState({ seed: 7 });
  const id = addPipeline(s, { supplier: 'verde', units: 8, price: 0.9, termMonths: 24, arrivesTurn: 2, needsPower: false });
  s = applyActions(s, {}, rng).state;
  const day = s.compute.pipeline.find((p) => p.id === id).landsDay;
  assert.ok(day > roundSpan(1).start && day <= roundSpan(1).end);
  let r = advanceTo(s, day - 1, rng);
  assert.ok(r.s.compute.pipeline.some((p) => p.id === id));
  r = advanceTo(r.s, day, rng);
  assert.ok(r.events.some((e) => e.type === 'computeArrived' && e.supplier === 'verde'));
  assert.ok(r.s.compute.contracts.some((c) => c.id === id));
});

test('a power site comes online on its landing day', () => {
  const rng = createRng(7);
  let s = createInitialState({ seed: 7 });
  s.power.sites.push({ id: 'gas-t', source: 'gas', units: 40, arrivesTurn: 2, online: false, oppositionCut: null });
  s = applyActions(s, {}, rng).state;
  const day = s.power.sites.find((x) => x.id === 'gas-t').landsDay;
  const r = advanceTo(s, day, rng);
  assert.ok(r.events.some((e) => e.type === 'siteOnline' && e.id === 'gas-t'));
  assert.equal(r.s.power.sites.find((x) => x.id === 'gas-t').online, true);
});
```

- [ ] **Step 2: Run them and confirm they fail.** Run `node --test tests/landings.test.js`. Expected: the two new tests FAIL.

- [ ] **Step 3: Implement.** In `sim/contracts.js`:

```js
export function deliverDue(state, rng, due = (p) => p.arrivesTurn <= state.turn) {
  const arrived = [];
  state.compute.pipeline = state.compute.pipeline.filter((p) => {
    if (!due(p)) return true;
    arrived.push(arrive(state, p, rng));
    return false;
  });
  syncContracts(state);
  refreshOnline(state);
  return arrived;
}
```

In `sim/power.js`, `powerTurn(state, due = (s) => s.arrivesTurn <= state.turn)` uses `if (!s.online && due(s))`. In `sim/landings.js`, import `deliverDue` and `sideRng` from `./contracts.js` and `powerTurn` from `./power.js`, and extend `landDue` after the promise line:

```js
  if (state.compute.pipeline.some(landed)) {
    for (const x of deliverDue(state, sideRng(state, 6), landed)) events.push({ type: 'computeArrived', supplier: x.supplier, units: x.units });
  }
  for (const e of powerTurn(state, landed)) events.push(e);
```

`powerTurn` flips `online` without refreshing the online compute. If the Task 4 site test shows the new power unused until the mark, call `refreshOnline(state)` (exported from `sim/contracts.js`) after a site lands.

- [ ] **Step 4: Run the tests and confirm they pass.** Run `node --test tests/landings.test.js tests/contracts.test.js tests/power.test.js tests/compute-turn.test.js tests/ui-compute.test.js`, then `npm test`. Update only mark-timing assertions, and list them.

- [ ] **Step 5: Measure the balance** into `scratchpad/balance-task4.txt`. Compute arriving about half a round earlier helps the player. Watch `acquihire` and `leftBehind`.

- [ ] **Step 6: Commit.**

```bash
git add sim/contracts.js sim/power.js sim/landings.js tests/landings.test.js <updated tests>
git commit -m "feat(sim): compute and power sites arrive on their day (stage 2)"
```

### Task 5: Screens show the landing dates

**Files:**
- Modify: `ui/logic/compute.js` (`sitesView`, `turnSummary`), `ui/screens/sites.js`
- Test: `tests/ui-compute.test.js`

**Interfaces:**
- Consumes: `landsDay` on pipeline items and sites (Tasks 1 and 4).
- Produces: `sitesView(state).nextArrival.day` (a story day); site status strings `Building · online Y.. M.. W..`.

- [ ] **Step 1: Write the failing test.** Append to `tests/ui-compute.test.js`:

```js
test('sites and signed deals show the landing date, not the old mark', () => {
  const s = createInitialState({ seed: 7 });
  s.power.sites.push({ id: 'gas-t', source: 'gas', units: 40, arrivesTurn: 2, online: false, oppositionCut: null, landsDay: 120, landsFor: 1 });
  const view = sitesView(s);
  assert.equal(view.nextArrival.day, 120);
  assert.match(view.sites.find((x) => x.id === 'gas-t').status, new RegExp(`online ${storyDate(120).label}`));
  s.compute.pipeline.push({ id: 'c9', supplier: 'verde', units: 8, arrivesTurn: 2, landsDay: 130, landsFor: 1 });
  const lines = turnSummary([{ type: 'deal', supplier: 'verde', arrivesTurn: 2 }], s);
  assert.ok(lines.some((line) => line.includes(storyDate(130).label)));
});
```

Import `storyDate` from `../sim/time.js` and `turnSummary` if the file doesn't import them already. If `turnSummary` returns an object rather than an array of lines, assert on its line list, and say so in the report.

- [ ] **Step 2: Run it and confirm it fails.** Run `node --test tests/ui-compute.test.js`. Expected: FAIL.

- [ ] **Step 3: Implement.** In `sitesView`:

```js
  const landing = (site) => site.landsDay ?? storyDayForTurn(site.arrivesTurn);
  const nextArrival = pending[0] ? {
    turn: pending[0].arrivesTurn,
    turns: Math.max(0, pending[0].arrivesTurn - state.turn),
    day: landing(pending[0]),
    units: pending[0].units,
    name: SITE_TYPES[pending[0].source]?.name ?? pending[0].source,
  } : null;
```

and in the `sites` map:

```js
      status: site.online
        ? `Online since ${storyDate(landing(site)).label}`
        : `Building · online ${storyDate(landing(site)).label}`,
```

(define `landing` once, above both uses). In `turnSummary`'s `deal` branch:

```js
      const day = state?.compute?.pipeline?.find((p) => p.arrivesTurn === event.arrivesTurn && p.landsDay != null)?.landsDay
        ?? storyDayForTurn(event.arrivesTurn);
      lines.push(`${subject} — online from ${storyDate(day).label}`);
```

In `ui/screens/sites.js`, import `storyDate` beside `roundWord` from `../../sim/time.js`, and replace the two `roundsToWords(…, view.nextArrival.turns)` texts with `Power from ${storyDate(view.nextArrival.day).label}` and `${view.nextArrival.name} online from ${storyDate(view.nextArrival.day).label}`. Drop the `roundsToWords` import only if nothing else in the file uses it.

- [ ] **Step 4: Run the tests and confirm they pass.** Run `node --test tests/ui-compute.test.js`, then `npm test`.

- [ ] **Step 5: Check it in the real game.** Drive a real run with Playwright (`~/Downloads/career-ops/node_modules/playwright-core` with system Chrome), because the browser pane runs hidden and pauses the clock. Reach era 4, build a gas site, and screenshot the sites screen showing the "online" date. Load the `design` skill before judging the screenshot.

- [ ] **Step 6: Commit.**

```bash
git add ui/logic/compute.js ui/screens/sites.js tests/ui-compute.test.js
git commit -m "feat(ui): sites and deals show their landing dates (stage 2)"
```

### Task 6: Balance before and after, demo seeds, and the lanes

**Files:**
- Modify: this plan (append the review record and the balance table)
- Retune only if the owner asks: `sim/balance.js` or `sim/rivals.js` constants

- [ ] **Step 1: Compare the ending mix.** Save this script as `scratchpad/compare.mjs` (outside the repo):

```js
import { readFileSync } from 'node:fs';
const load = (f) => JSON.parse(readFileSync(f, 'utf8').slice(readFileSync(f, 'utf8').indexOf('{')));
const [a, b] = process.argv.slice(2).map(load);
for (const s of Object.keys(a)) {
  const ends = new Set([...Object.keys(a[s].endings), ...Object.keys(b[s]?.endings ?? {})]);
  for (const e of ends) {
    const pa = ((a[s].endings[e] ?? 0) / 2), pb = ((b[s]?.endings[e] ?? 0) / 2); // 200 runs: count / 2 = percent
    const flag = Math.abs(pb - pa) > 5 ? '  <-- over 5 points' : '';
    console.log(`${s.padEnd(20)} ${e.padEnd(16)} ${pa.toFixed(1).padStart(5)}% -> ${pb.toFixed(1).padStart(5)}%${flag}`);
  }
}
```

Run `node scratchpad/compare.mjs scratchpad/balance-before.txt scratchpad/balance-task4.txt`.

- [ ] **Step 2: Decide the retune.** If no ending moves more than 5 points, record the table and stop. If some do, report the table to the owner with the likely cause per ending. For example: compute arriving earlier lowers `acquihire`, and rival launches one round later in the event triggers delay the Qilin export card. Do not retune without the owner's yes.

- [ ] **Step 3: Check the demo seeds.** Run `npm run demo-seeds` and compare its top seeds with the same run on `bbaa2ab`. If the demo's seeds changed, tell gn-merge before the extras merge.

- [ ] **Step 4: Review (tier 3, pre-merge).** Run the Codex pair concurrently from the worktree root, with one mutation-guard snapshot before both and after both: `codex exec -m gpt-5.6-sol -s read-only review --base origin/ui < /dev/null`, plus the adversarial `codex exec` with `--output-schema ~/.codex/review-schema.json -o <scratchpad>/findings.json`. Run one combined fix wave, re-verify with `resume`, and stop after 3 rounds. Record the outcomes below.

- [ ] **Step 5: Tell the lanes.** Tell gn-merge the SHA, test counts and the balance table. Tell gn-events that its new lawsuits and site delays land on days with no change to `realEvents.js`. Stage 2 keeps every mark, so gn-board, gn-automation and gn-summit-design need no change; send each a one-line note.

## Not in this plan (deferred)

- `recordAdvisors` runs before the era advances (a new era's first briefing can show an old-era line). The fix changes the random-number order; it stays deferred.
- Event rolls stay at the mark (decision 2). Training run lengths stay with gn-merge's `pacing` branch.
- Offer cards still say "arrives in about N months" before signing, because the landing day is only fixed once the deal exists.

## Review record

### Implementation (2026-09-26)

Codex `gpt-5.6-sol` (session 01a0dfd1-a751-7bc1-97d7-4f2e5fbfd533) implemented Tasks 1–4. Its sandbox could not write the worktree's git metadata, so it delivered the commits as a verified bundle, which was fetched onto the branch unchanged. Its deviations: a delivered contract keeps its planned `arrivedTurn`, and expiry and trouble rolls skip it until then (reverted with Task 4). Existing tests changed: `tests/events.test.js` (the Qilin card waits for the launch round) and `tests/ui-history.test.js` (the subscriber waits for the first deferred launch; the summit scenario's first model now leads all five benchmarks because rival capability lands later).

### Balance (`npm run balance`, 200 runs per strategy, against `bbaa2ab`)

| Build | Endings moving more than 5 points |
|---|---|
| Tasks 1–3 (shipping) | handToMouth acquihire 25.0% → 34.5%; balancedNoGrid rivalDisaster 7.5% → 1.5% |
| Task 4 as built (reverted) | 13, the largest speed acquihire 43.0% → 23.5% and boardRemoved 26.0% → 46.5% |
| Task 4 billing from the old date (experiment) | 7, the largest speed acquihire 43.0% → 56.0% |

Lawsuits and promises changed no ending (Tasks 2 and 3 outputs are identical). Rival-disaster endings dip 1–6 points in every balanced variant, because a rival's capability now lands on its day in the next round.

### Real-game check

A Playwright run of the served game (`?seed=3&scenario=era2Deals`, ×4, cards deferred with "Decide later") saw OpenBrain launch on day 542, day 87 of a 91-day round and four days before the mark. Its `@launch_tracker` post reached the feed the same day. There were no page or console errors. No screen changed, so there was no design pass.

### Pre-merge review (tier 3)

Codex `gpt-5.6-sol`, run concurrently against `origin/ui`; the mutation guard was clean in both rounds.

- Straight `review --base origin/ui` (session 01a0dfe6-4ce8-7e43-9a4b-c2e7791694c1): no findings.
- Adversarial (session 01a0dfe6-4d1e-7fc1-8932-c947c9479a20), round 1 REVISE:
  - Important, fixed in 1f56791: a daily lawsuit or kept promise could leave `publicTrust` or `govFavor.us` outside 0–100 until the mark. `landDue` now clamps both, with a test.
  - Minor, won't fix: at the final mark a rival launch can be queued for a day after the run. Nothing reads a rival's `releases` count, and nothing runs after the run ends, so it is never seen.
- Round 2 (resume): APPROVED, no findings.

Final: 805 tests, 801 pass, 0 fail, 4 todo. Balance unchanged by the fix (the same two endings over 5 points as Tasks 1–3).
