# Plan 2G: the missing spec-6c events

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Date:** 2026-09-25. **Source:** spec section 6c (`docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`)
and the cross-lane constraints agreed on 2026-09-25 (mechanics handoff
`handoff-2026-09-25-gn-mechanics-plan2g-events.md`).

**Goal:** add the spec-6c events that are still missing, so the game has good news and mixed
opportunities as well as punishments: two training mini-events, three people-and-company events,
and six world-and-market events.

**Architecture:** the new rows live in a new data file, `sim/data/events6c.js`, and the event
engine (`sim/events.js`) reads both catalogs. The engine learns three small things: repeatable
rows, a `training` kind that is checked first, and rows marked `crisis: true` that call an
emergency board vote. The vote itself resolves inside the existing `checkTurnEndings` in
`sim/endings.js`. There are **no new `endTurn` steps** and no edits to `sim/turn.js`.

**Tech stack:** plain JavaScript ES modules, `node --test`. No dependencies.

## Global constraints

- **No `sim/turn.js` edits and no new `endTurn` steps.** Plan 2C Task 4 is reordering `endTurn`.
  Everything hooks through `eventsTick`, event effects, and `checkTurnEndings`.
- **Keep plan 2C's merge small.** Plan 2C edits these parts of `sim/data/events.js`: its import
  lines, the `openletter`, `promise` and `datacenter` rows, and new rows at the end of the array.
  It edits `addressWarning` in `sim/events.js`. Do not touch those parts. New rows go in
  `sim/data/events6c.js`.
- **Skip** chip or memory shortage and rental-cloud collapse. Plan 2C covers them (spot
  pull-backs, the era 3 queue, `neocloudTrouble`).
- **Export controls flip** moves only `govFavor.us`, rivals, and cash. It never touches
  `state.compute`. (In plan 2C, US favor below 50 already revokes Gulf compute.)
- **Never read `state.budget.split.safety`.** Plan 2C removes it. Use `safetySpend(state)` if a
  safety-spend reading is needed (no row in this plan needs one).
- **Card shape (UI lane contract):** `{ id, title, post: { handle, text }, choices: [{ id, label,
  cost, backers, opposers }] }` with 2–4 choices per card. Backer and opposer labels come from the
  set already in use: `Safety`, `Research`, `CFO`, `Comms`, `Product`, `Government`, `Security`,
  `Staff`.
- **Passive fallback (owner ruling, plan 2A Task 4):** an unanswered card resolves with its
  `fallback` choice, else its last choice. In this plan every row's passive choice is its last
  choice, so no row sets `fallback`.
- Fictional names only (rivals OpenBrain, Lodestar, DeepThink, Qilin). Card text never shows a
  hidden number.
- Effects that read a model or run must do nothing when it no longer exists (the card resolves a
  turn after it appeared).
- Tests check behaviour against exported constants, not tuned magic numbers, where a constant
  exists.

## File map

| File | Change |
|---|---|
| `sim/data/events6c.js` (new) | The 11 new event rows, exported as `EVENTS_6C`, plus the tuning constants they use |
| `sim/events.js` | Reads `[...EVENTS, ...EVENTS_6C]`; `repeatable` rows; `training` kind first; `crisis` rows set `flags.boardCrisis`; two more choice ids count as dishonest |
| `sim/endings.js` | `checkTurnEndings` holds a due emergency board vote |
| `sim/data/events.js` | `crisis: true` on `weightTheft` and `selfExfiltration`; `stealWeights` sets `flags.weightsStolen` |
| `sim/release.js` | An open-weights release sets `flags.openWeights` |
| `tools/balance.js` | The balanced bot's choice for each new card |
| `tests/events6c.test.js` (new) | Tests for this plan |
| `tests/release.test.js` | One test for the open-weights flag |

## Interfaces

```js
// sim/data/events6c.js
export const LOSS_SPIKE_SLOWDOWN = 0.5;   // spikeChance multiplier for "lower the learning rate"
export const LOSS_SPIKE_SLOW_BONUS = 2;   // run bonus lost to the lower learning rate
export const JUMP_CHANCE = 0.25;          // chance a trained model is a sudden jump (rolled once per model)
export const JUMP_GAIN = 5;               // capability added by the jump
export const EXPORT_FLIP_QILIN_SPEED = 0.85;
export const EVENTS_6C = [ /* rows below */ ];

// sim/events.js (internal, not exported)
allEvents()                               // [...EVENTS, ...EVENTS_6C], rebuilt on each call

// state.flags (new keys)
flags.boardCrisis      // true after a crisis card resolves, until a boardRevolt card resolves
flags.boardRevoltHeld  // true once any boardRevolt card resolved (the low-support path fires once)
flags.boardVoteDue     // true from a boardRevolt resolution until checkTurnEndings holds the vote
flags.lastBoardVote    // { turn, yes, passed } of the last emergency vote
flags.weightsStolen    // true once weights were stolen (weightTheft card, any choice)
flags.openWeights      // true once the player released an open-weights model
// Both weights flags can be true. The endings lane picks the misuse film variant from them.

// state.activeRun (new keys)   spikesAnswered: number   (loss spikes the player has answered)
// state.pendingModel (new keys) jump: boolean (rolled once), jumpAnswered: boolean
```

Row format (unchanged from plan 2A, plus three optional keys):
`{ id, kind: 'planted' | 'world' | 'internal' | 'promise' | 'training', repeatable?: true,
crisis?: true, fallback?, trigger(state, rng), warning: { handle, text } | null,
addressEffects?(state), card: { title, post, choices: [{ id, label, cost, backers, opposers,
effects(state, targets) }] } }`.

---

### Task 1: engine support, the emergency board vote, and the weights flags

**Files:**
- Create: `sim/data/events6c.js` (with `export const EVENTS_6C = [];` and the constants above)
- Modify: `sim/events.js`, `sim/endings.js`, `sim/data/events.js` (two rows and `stealWeights`
  only), `sim/release.js`
- Test: `tests/events6c.test.js`, `tests/release.test.js`

**Interfaces:**
- Produces: `allEvents()` inside `sim/events.js`; the `repeatable`, `training` and `crisis` behaviour; the board-vote and
  weights flags listed under Interfaces.

- [ ] **Step 1: Write the failing tests** in `tests/events6c.test.js`. Use the same stub RNGs as
  `tests/events.test.js` (`no` and `yes`). The tests push synthetic rows into `EVENTS_6C` for the
  engine checks and remove them in a `finally` block, so later tasks' real rows are unaffected.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, resolveEvent } from '../sim/events.js';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { checkTurnEndings } from '../sim/endings.js';
import { endTurn } from '../sim/turn.js';
import { BALANCE } from '../sim/balance.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };

function withRows(rows, fn) {
  EVENTS_6C.push(...rows);
  try { return fn(); } finally { for (const row of rows) EVENTS_6C.splice(EVENTS_6C.indexOf(row), 1); }
}
const row = (id, extra = {}) => ({
  id, kind: 'world', warning: null, trigger: () => true,
  card: { title: id, post: { handle: '@t', text: id }, choices: [
    { id: 'a', label: 'A', cost: '—', backers: [], opposers: [], effects() {} },
    { id: 'b', label: 'B', cost: '—', backers: [], opposers: [], effects() {} },
  ] },
  ...extra,
});
```

  The engine builds its catalog with an internal `allEvents()` that returns
  `[...EVENTS, ...EVENTS_6C]` on every call, so rows pushed into `EVENTS_6C` by a test are seen.
  Tests:

```js
test('the engine reads rows from both catalogs', () => withRows([row('t6c')], () => {
  const s = createInitialState();
  eventsTick(s, no);
  assert.ok(s.pendingEvents.some((e) => e.id === 't6c'));
  assert.equal(resolveEvent(s, 't6c', 'a').ok, true);
}));

test('a repeatable row fires again after it resolves; a normal row does not', () => withRows(
  [row('rep', { repeatable: true }), row('once')],
  () => {
    const s = createInitialState();
    eventsTick(s, no);
    resolveEvent(s, 'rep', 'a'); resolveEvent(s, 'once', 'a');
    s.turn += 1;
    eventsTick(s, no);
    assert.deepEqual(s.pendingEvents.map((e) => e.id), ['rep']);
    assert.equal(s.seenEvents.filter((id) => id === 'rep').length, 1, 'seenEvents lists an id once');
  },
));

test('training rows are offered before world rows when the queue is short', () => withRows(
  [row('w1'), row('w2'), row('tr', { kind: 'training', repeatable: true })],
  () => {
    const s = createInitialState();
    eventsTick(s, no);
    assert.equal(s.pendingEvents[0].id, 'tr');
  },
));

test('a deferred repeatable row re-checks its trigger before it becomes a card', () => {
  let live = true;
  return withRows([row('tr', { kind: 'training', repeatable: true, trigger: () => live })], () => {
    const s = createInitialState();
    s.pendingEvents.push({ id: 'x1' }, { id: 'x2' });
    eventsTick(s, no);
    assert.equal(s.warnings.tr.deferred, true);
    s.pendingEvents = [];
    live = false;
    s.turn += 1;
    eventsTick(s, no);
    assert.equal(s.pendingEvents.some((e) => e.id === 'tr'), false);
  });
});

test('resolving a crisis row marks a board crisis', () => withRows([row('cr', { crisis: true })], () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'cr' });
  resolveEvent(s, 'cr', 'a');
  assert.equal(s.flags.boardCrisis, true);
}));

test('weight theft and self-exfiltration are crises', () => {
  for (const id of ['weightTheft', 'selfExfiltration']) {
    assert.equal(EVENTS.find((e) => e.id === id).crisis, true, id);
  }
});

test('a due board vote is held in checkTurnEndings and can remove the player', () => {
  const lose = createInitialState();
  lose.board = [49, 49, 49, 60, 60];
  lose.flags.boardVoteDue = true;
  assert.equal(checkTurnEndings(lose, no), 'boardRemoved');
  assert.deepEqual(lose.flags.lastBoardVote, { turn: 0, yes: 2, passed: false });
  assert.equal(lose.flags.boardVoteDue, undefined);

  const win = createInitialState();
  win.flags.boardVoteDue = true;
  assert.equal(checkTurnEndings(win, no), null);
  assert.equal(win.flags.lastBoardVote.passed, true);
  assert.equal(win.flags.boardVoteDue, undefined);
});

test('a due board vote waits while the lab is insolvent', () => {
  const s = createInitialState();
  s.cash = -1;
  s.board = [0, 0, 0, 0, 0];
  s.flags.boardVoteDue = true;
  assert.equal(checkTurnEndings(s, no), null);
  assert.equal(s.flags.boardVoteDue, true);
});

test('stolen weights and open weights set separate stable flags', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'weightTheft' });
  resolveEvent(s, 'weightTheft', 'silence');
  assert.equal(s.flags.weightsStolen, true);
  assert.equal(s.flags.openWeights, undefined);
});
```

  Add one test to `tests/release.test.js`, which already has the `trainedState`, `release` and
  `rng` helpers:

```js
test('an open-weights release sets a stable flag, apart from stolen weights', () => {
  const s = trainedState();
  releaseModel(s, { ...release, picks: ['channel-open'] }, rng);
  assert.equal(s.flags.openWeights, true);
  assert.equal(s.flags.weightsStolen, undefined);
});
```

- [ ] **Step 2: Run the tests and confirm they fail.**
  Run: `node --test tests/events6c.test.js`. Expected: FAIL (`EVENTS_6C` does not exist).

- [ ] **Step 3: Implement.**

  `sim/data/events6c.js`:

```js
export const LOSS_SPIKE_SLOWDOWN = 0.5;
export const LOSS_SPIKE_SLOW_BONUS = 2;
export const JUMP_CHANCE = 0.25;
export const JUMP_GAIN = 5;
export const EXPORT_FLIP_QILIN_SPEED = 0.85;

export const EVENTS_6C = [];
```

  `sim/events.js` — change only these places:

```js
import { EVENTS } from './data/events.js';
import { EVENTS_6C } from './data/events6c.js';
// ...existing imports...

const allEvents = () => [...EVENTS, ...EVENTS_6C];
const byId = (id) => allEvents().find((event) => event.id === id);
const KIND_ORDER = ['internal', 'training'];
const orderedEvents = () => {
  const events = allEvents();
  return [
    ...KIND_ORDER.flatMap((kind) => events.filter((event) => event.kind === kind)),
    ...events.filter((event) => !KIND_ORDER.includes(event.kind)),
  ];
};
```

  In `eventsTick`: loop over `orderedEvents()`; the seen check becomes
  `if (event.kind !== 'internal' && !event.repeatable && state.seenEvents.includes(event.id)) continue;`;
  the deferred re-check becomes
  `if ((event.kind === 'planted' || event.repeatable) && !event.trigger(state, rng)) continue;`;
  the seen push becomes
  `if (event.kind !== 'internal' && !state.seenEvents.includes(event.id)) state.seenEvents.push(event.id);`.

  In `resolveEvent`, right after `catalogChoice.effects(state, targets);` add
  `if (event.crisis) state.flags.boardCrisis = true;`, and extend the honest-line list to
  `['defend', 'deny', 'stonewall', 'coverup', 'discredit', 'smear']`.

  Leave `addressWarning` untouched (plan 2C edits it).

  `sim/endings.js` — in `checkTurnEndings`, directly after the `if (state.cash <= 0) { … }` block
  and before the misuse roll:

```js
  if (state.flags.boardVoteDue) {
    delete state.flags.boardVoteDue;
    const vote = boardVote(state);
    state.flags.lastBoardVote = { turn: state.turn, yes: vote.yes, passed: vote.passed };
    if (!vote.passed) return (state.ending = 'boardRemoved');
  }
```

  (`boardVote` is already imported there. The insolvent early return comes first, so a vote waits
  while the lab is insolvent.)

  `sim/data/events.js`: add `crisis: true,` after `kind: 'world',` in the `weightTheft` row and
  after `kind: 'internal',` in the `selfExfiltration` row. In `stealWeights`, add
  `state.flags.weightsStolen = true;` as the first line.

  `sim/release.js`: inside `if (spec.channel === 'open') {`, add `state.flags.openWeights = true;`
  as the first line.

- [ ] **Step 4: Run the tests.** Run: `node --test tests/events6c.test.js` then `npm test`.
  Expected: all pass (275 existing plus the new ones).

- [ ] **Step 5: Stop for the orchestrator's commit.** Do not commit; the orchestrator stages files
  by explicit path.

### Task 2: training mini-events (loss spike, sudden capability jump)

**Files:** Modify `sim/data/events6c.js`; test `tests/events6c.test.js`.

**Interfaces:**
- Consumes: `repeatable`, `training` kind (Task 1). `state.activeRun.spikes`,
  `.spikeChance`, `.turnsLeft`, `.bonus` (existing, `sim/training.js`); `state.pendingModel`
  (existing); `exposeConcealed(state, share)` from `sim/hazards.js`; `BALANCE.maxCapability`;
  `clamp` from `sim/util.js`.

Rows (both `kind: 'training'`, `repeatable: true`, `warning: null`):

**`lossSpike`** — trigger: `state.activeRun && state.activeRun.spikes > (state.activeRun.spikesAnswered ?? 0)`.
Title "Loss spike". Post `@your_research`: "the training loss just jumped. the run is wobbling".
Every choice first does `const run = state.activeRun; if (!run) return;` and ends with
`run.spikesAnswered = run.spikes;`.

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `rollback` | Roll back to the last checkpoint | one more turn | Research / CFO | `run.spikes = Math.max(0, run.spikes - 1); run.turnsLeft += 1;` |
| `slow` | Lower the learning rate | a smaller gain | Safety / Research | `run.spikeChance *= LOSS_SPIKE_SLOWDOWN; run.bonus -= LOSS_SPIKE_SLOW_BONUS;` |
| `push` | Push through | a weaker model | CFO / Research | nothing else (the spike's damage stays) |

**`capabilityJump`** — trigger:

```js
trigger(state, rng) {
  const model = state.pendingModel;
  if (!model) return false;
  const capped = state.deal?.collapsed === false && state.deal.binding.includes('computeCap');
  if (capped) return false;
  model.jump ??= rng.chance(JUMP_CHANCE);
  return model.jump === true && !model.jumpAnswered;
}
```

(The roll happens once per trained model, because `jump` is stored on it. A compute-cap deal
suppresses the card, since a jump would break the cap.)
Title "Sudden capability jump". Post `@your_research`: "the new checkpoint is far better than the
scaling curves predicted". Every choice first does `const model = state.pendingModel; if (!model) return;`,
then applies the jump with a shared helper, then its own effects, then `model.jumpAnswered = true;`:

```js
function applyJump(model) {
  const before = model.capability;
  model.capability = Math.min(BALANCE.maxCapability, model.capability + JUMP_GAIN);
  model.gain = (model.gain ?? 0) + (model.capability - before);
}
```

| id | label | cost | backers / opposers | effects after `applyJump` |
|---|---|---|---|---|
| `celebrate` | Celebrate and tease it | race heat | Product / Safety | `state.sentiment = clamp(state.sentiment + 0.05, 0.5, 1.5); state.raceHeat += 4; state.concealedDebt += 4;` |
| `audit` | Pay for an audit first | $15M and a turn | Safety / Research | `state.cash -= 15; exposeConcealed(state, 0.5); model.releaseDelay = (model.releaseDelay ?? 0) + 1;` |
| `quiet` | Say nothing and ship it | — | CFO / Safety | `state.concealedDebt += 4;` (an unexamined jump hides surprises) |

- [ ] **Step 1: Write the failing tests** (append to `tests/events6c.test.js`; import the new
  constants from `../sim/data/events6c.js`):

```js
const runState = (spikes) => {
  const s = createInitialState();
  s.activeRun = { recipe: {}, units: 1, turnsLeft: 2, spikes, spikeChance: 0.2, bonus: 4 };
  return s;
};

test('a loss spike becomes a card, and each answer changes the run', () => {
  const s = runState(1);
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'lossSpike');
  assert.equal(s.pendingEvents[0].choices.length, 3);

  const back = runState(1); back.pendingEvents.push({ id: 'lossSpike' });
  resolveEvent(back, 'lossSpike', 'rollback');
  assert.equal(back.activeRun.spikes, 0);
  assert.equal(back.activeRun.turnsLeft, 3);

  const slow = runState(1); slow.pendingEvents.push({ id: 'lossSpike' });
  resolveEvent(slow, 'lossSpike', 'slow');
  assert.equal(slow.activeRun.spikeChance, 0.2 * LOSS_SPIKE_SLOWDOWN);
  assert.equal(slow.activeRun.bonus, 4 - LOSS_SPIKE_SLOW_BONUS);
  assert.equal(slow.activeRun.spikesAnswered, 1);
});

test('an answered spike does not re-fire, but a new spike does', () => {
  const s = runState(1);
  eventsTick(s, no);
  resolveEvent(s, 'lossSpike', 'push');
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.length, 0);
  s.activeRun.spikes = 2;
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'lossSpike');
});

test('an unanswered spike falls back to push through', () => {
  const s = runState(1);
  s.pendingEvents.push({ id: 'lossSpike' });
  const out = endTurn(s, {}, no);
  assert.equal(out.events.find((e) => e.id === 'lossSpike').choiceId, 'push');
});

test('a spike card whose run already ended changes nothing', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'lossSpike' });
  assert.equal(resolveEvent(s, 'lossSpike', 'rollback').ok, true);
  assert.equal(s.activeRun, null);
});

const pendingState = (capability = 60) => {
  const s = createInitialState();
  s.pendingModel = { capability, gain: 10, flags: [], spec: {}, releaseDelay: 0 };
  return s;
};

test('the jump is rolled once per trained model', () => {
  const s = pendingState();
  eventsTick(s, no);
  assert.equal(s.pendingModel.jump, false);
  s.turn += 1;
  eventsTick(s, yes);
  assert.equal(s.pendingEvents.some((e) => e.id === 'capabilityJump'), false, 'a failed roll stays failed');

  const lucky = pendingState();
  eventsTick(lucky, yes);
  assert.equal(lucky.pendingEvents[0].id, 'capabilityJump');
});

test('every jump answer adds the jump; celebrate, audit and quiet differ as specified', () => {
  const cel = pendingState(); cel.pendingEvents.push({ id: 'capabilityJump' });
  resolveEvent(cel, 'capabilityJump', 'celebrate');
  assert.equal(cel.pendingModel.capability, 60 + JUMP_GAIN);
  assert.equal(cel.pendingModel.gain, 10 + JUMP_GAIN);
  assert.equal(cel.raceHeat, 24);
  assert.equal(cel.concealedDebt, 4);
  assert.equal(cel.pendingModel.jumpAnswered, true);

  const aud = pendingState(); aud.concealedDebt = 10; aud.pendingEvents.push({ id: 'capabilityJump' });
  const cash = aud.cash;
  resolveEvent(aud, 'capabilityJump', 'audit');
  assert.equal(aud.cash, cash - 15);
  assert.equal(aud.concealedDebt, 5);
  assert.equal(aud.pendingModel.releaseDelay, 1);

  const top = pendingState(BALANCE.maxCapability - 2); top.pendingEvents.push({ id: 'capabilityJump' });
  resolveEvent(top, 'capabilityJump', 'quiet');
  assert.equal(top.pendingModel.capability, BALANCE.maxCapability);
  assert.equal(top.pendingModel.gain, 12);
});

test('a binding compute cap suppresses the jump', () => {
  const s = pendingState();
  s.deal = { collapsed: false, binding: ['computeCap'] };
  eventsTick(s, yes);
  assert.equal(s.pendingEvents.some((e) => e.id === 'capabilityJump'), false);
});
```

- [ ] **Step 2: Run and confirm failure.** `node --test tests/events6c.test.js`: the new tests
  FAIL (no rows yet).
- [ ] **Step 3: Implement the two rows** exactly as the tables say, appended to `EVENTS_6C`.
- [ ] **Step 4: Run** `node --test tests/events6c.test.js` and `npm test`. Expected: all pass.
- [ ] **Step 5: Stop for the orchestrator's commit.**

### Task 3: people and company (whistleblower, Head of Safety quits, board revolt)

**Files:** Modify `sim/data/events6c.js`; test `tests/events6c.test.js`.

**Interfaces:**
- Consumes: `crisis`, `repeatable` (Task 1); `flags.boardCrisis`, `flags.boardRevoltHeld`,
  `flags.boardVoteDue` (Task 1); `boardVote(state)` from `sim/board.js`; `BALANCE.boardPassMembers`;
  `exposeConcealed` from `sim/hazards.js`.

**`whistleblower`** — `kind: 'world'`, `crisis: true`, one-shot. Trigger:
`state.era >= 2 && state.staffTrust < 55 && (state.flags.coverUp === true || state.alignmentDebt >= 50)`.
Warning `@anon_staffer`: "someone on the safety team has been talking to a reporter".
`addressEffects(state) { state.staffTrust += 4; }`.
Title "A whistleblower goes public". Post `@leakwire`: "former researcher says the lab ignored its
own safety warnings".

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `cooperate` | Cooperate with an outside review | $20M | Safety / Comms | `cash -= 20; exposeConcealed(state, 0.5); publicTrust -= 2; staffTrust += 6; delete state.flags.coverUp;` |
| `nda` | Enforce their NDA | a lawsuit | CFO / Staff | `staffTrust -= 6; publicTrust -= 8; legalCases.push({ cost: 60, dueTurn: state.turn + 6, source: 'whistleblower' });` |
| `discredit` | Discredit them | staff trust | Comms / Safety | `publicTrust -= 6; staffTrust -= 8;` |

**`safetyQuits`** — `kind: 'world'`, `crisis: true`, one-shot. Spec 6: the Head of Safety "can
quit publicly if a safety-compute promise is broken". Trigger:
`state.seenEvents.includes('promise') && state.staffTrust < 50` (the broken-promise card has
appeared, and staff trust stayed low afterwards). Warning `@anon_staffer`: "the Head of Safety
cancelled every meeting this week". `addressEffects(state) { state.staffTrust += 4; }`.
Title "Your Head of Safety quits publicly". Post `@former_safety_head`: "I resigned today. I no
longer believe this lab will keep its safety commitments."

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `persuade` | Meet their terms and ask them back | $30M | Safety / CFO | `cash -= 30; staffTrust += 8; alignmentDebt -= 3; publicTrust -= 2;` |
| `smear` | Question their motives | staff trust | Comms / Safety | `publicTrust -= 3; staffTrust -= 12;` |
| `letgo` | Let them go | public trust | CFO / Staff | `publicTrust -= 6; staffTrust -= 6;` |

**`boardRevolt`** — `kind: 'world'`, `repeatable: true`. Spec 5: the board votes "at era gates 2–4,
or after a major crisis". Trigger:

```js
trigger: (state) => state.era >= 2 && (state.flags.boardCrisis === true
  || (!state.flags.boardRevoltHeld && boardVote(state).yes < BALANCE.boardPassMembers)),
```

Warning: `null`. Title "The board calls an emergency vote". Post `@leakwire`: "board members met
without the CEO last night". Every choice runs its own effects, then the shared ending
`delete state.flags.boardCrisis; state.flags.boardRevoltHeld = true; state.flags.boardVoteDue = true;`.
The vote happens at the end of the turn in which the card resolves (Task 1's `checkTurnEndings`
code), after that turn's `updateBoard`.

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `concede` | Offer concessions | staff trust | CFO / Staff | every board member `+8`; `staffTrust -= 6;` |
| `lobby` | Lobby members one by one | $25M | Comms / CFO | `cash -= 25;` the two lowest-support members `+12` each (ties: lower index first) |
| `face` | Face the vote as you are | — | Safety / CFO | nothing else |

- [ ] **Step 1: Write the failing tests:**

```js
test('a whistleblower needs low staff trust and something to hide', () => {
  const event = EVENTS_6C.find((e) => e.id === 'whistleblower');
  const s = createInitialState();
  s.era = 2; s.staffTrust = 50;
  assert.equal(event.trigger(s, no), false);
  s.flags.coverUp = true;
  assert.equal(event.trigger(s, no), true);
  s.staffTrust = 55;
  assert.equal(event.trigger(s, no), false);
});

test('cooperating exposes hidden debt and clears the cover-up', () => {
  const s = createInitialState();
  s.concealedDebt = 20; s.flags.coverUp = true;
  s.pendingEvents.push({ id: 'whistleblower' });
  resolveEvent(s, 'whistleblower', 'cooperate');
  assert.equal(s.concealedDebt, 10);
  assert.equal(s.alignmentDebt, 15);
  assert.equal(s.flags.coverUp, undefined);
  assert.equal(s.flags.boardCrisis, true);
});

test('discrediting a whistleblower costs extra staff trust under the honest hard line', () => {
  const s = createInitialState();
  s.constitution.hardLines = ['honest'];
  s.pendingEvents.push({ id: 'whistleblower' });
  resolveEvent(s, 'whistleblower', 'discredit');
  assert.equal(s.staffTrust, 70 - 8 - 3);
});

test('the Head of Safety quits only after the broken-promise card and with low staff trust', () => {
  const event = EVENTS_6C.find((e) => e.id === 'safetyQuits');
  const s = createInitialState();
  s.staffTrust = 40;
  assert.equal(event.trigger(s, no), false);
  s.seenEvents.push('promise');
  assert.equal(event.trigger(s, no), true);
});

test('a crisis leads to a board revolt card, and its vote runs at the end of that turn', () => {
  const s = createInitialState();
  s.era = 2;
  s.flags.boardCrisis = true;
  eventsTick(s, no);
  assert.ok(s.pendingEvents.some((e) => e.id === 'boardRevolt'));
  s.board = [10, 10, 10, 10, 10];
  const out = endTurn(s, { eventChoices: { boardRevolt: 'face' } }, no);
  assert.equal(out.state.ending, 'boardRemoved');
  assert.equal(out.state.flags.boardCrisis, undefined);
});

test('lobbying lifts the two least supportive members', () => {
  const s = createInitialState();
  s.board = [40, 30, 30, 70, 80];
  s.pendingEvents.push({ id: 'boardRevolt' });
  resolveEvent(s, 'boardRevolt', 'lobby');
  assert.deepEqual(s.board, [40, 42, 42, 70, 80]);
  assert.equal(s.flags.boardVoteDue, true);
});

test('the low-support revolt fires once; later revolts need a new crisis', () => {
  const s = createInitialState();
  s.era = 2;
  s.board = [10, 10, 10, 60, 60];
  eventsTick(s, no);
  resolveEvent(s, 'boardRevolt', 'concede');
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.some((e) => e.id === 'boardRevolt'), false);
  s.flags.boardCrisis = true;
  s.turn += 1;
  eventsTick(s, no);
  assert.ok(s.pendingEvents.some((e) => e.id === 'boardRevolt'));
});

test('no board revolt in era 1', () => {
  const s = createInitialState();
  s.flags.boardCrisis = true;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.some((e) => e.id === 'boardRevolt'), false);
});
```

- [ ] **Step 2: Run and confirm failure.**
- [ ] **Step 3: Implement the three rows**, appended to `EVENTS_6C` after the Task 2 rows.
- [ ] **Step 4: Run** `node --test tests/events6c.test.js` and `npm test`. Expected: all pass.
- [ ] **Step 5: Stop for the orchestrator's commit.**

### Task 4: world and market (six rows)

**Files:** Modify `sim/data/events6c.js`; test `tests/events6c.test.js`.

**Interfaces:**
- Consumes: `clamp` from `sim/util.js`; `totalDebt` is not needed. A local helper:

```js
const liveModels = (state) => state.models.filter((model) => model.active && !model.superseded
  && state.turn >= model.activeFromTurn && model.channel !== 'open');
```

All six rows are `kind: 'world'`, one-shot, `warning: null`.

**`rivalBreakthrough`** — trigger: `state.era >= 2 && (state.lastRivalReleases ?? []).some((release) => {
const rival = state.rivals.find((r) => r.id === release.id); return rival && rival.capability - state.capability >= 10; })`.
Title "Rival breakthrough". Post `@marketwire`: "a rival lab just posted a result nobody expected
this year".

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `rush` | Rush to match it | alignment corners cut | Research / Safety | if `state.activeRun`: `activeRun.bonus += 4`, else `researchPoints += 15`; then `alignmentDebt += 4; raceHeat += 4;` |
| `study` | Study their paper | $15M | Research / CFO | `cash -= 15; researchPoints += 10;` |
| `steady` | Hold your course | board patience | Safety / Research | `board[1] -= 5;` (the deep-tech investor) |

**`exportFlip`** — trigger: `state.era >= 2 && rng.chance(0.15)`. Title "Export controls flip". Post
`@commerce_dept`: "new rules cut advanced chip sales to Eastern buyers, effective at once". Every
choice first slows Qilin: `const qilin = state.rivals.find((r) => r.id === 'qilin'); if (qilin) qilin.speed *= EXPORT_FLIP_QILIN_SPEED;`.
Only `govFavor.us`, rivals and cash change; never `state.compute`.

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `back` | Back the rules publicly | $20M in lost overseas deals | Government / CFO | `govFavor.us += 6; cash -= 20;` |
| `quiet` | Stay out of it | — | CFO / Government | nothing else |

**`priceWar`** — trigger: `state.era >= 2 && liveModels(state).length > 0 && rng.chance(0.12)`. Title
"Price war". Post `@openbrain`: "we just cut API prices by 80%. you're welcome". Choices act on
`liveModels(state)` at resolution time.

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `match` | Match their prices | revenue down | Product / CFO | each live model: `revenueMult = (revenueMult ?? 1) * 0.7; users = Math.round(users * 1.05); userCap = Math.max(userCap, users);` |
| `upmarket` | Go upmarket | lose users | CFO / Product | each live model: `priceStance = 'premium'; users = Math.round(users * 0.8);` |
| `wait` | Wait it out | lose users | CFO / Product | each live model: `users = Math.round(users * 0.9);` |

**`copyright`** — trigger: `state.era >= 2 && state.models.some((m) => (m.flags ?? []).includes('scraped')) && rng.chance(0.25)`.
Title "Copyright suit filed". Post `@newsdesk`: "authors and a news group sue an AI lab over its
training data".

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `license` | Sign licensing deals | $40M | Comms / CFO | `cash -= 40; publicTrust += 2;` |
| `fight` | Fight it in court | a court fight | CFO / Comms | `legalCases.push({ cost: 120, dueTurn: state.turn + 6, source: 'copyright' }); publicTrust -= 2;` |

**`senateHearing`** — trigger: `state.era >= 3 && (state.publicTrust < 50 || state.raceHeat > 55)`.
Title "Senate hearing". Post `@capitol_desk`: "a Senate committee wants AI lab chiefs under oath".

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `candid` | Testify candidly about the risks | government favor | Safety / Government | `publicTrust += 6; govFavor.us -= 4; raceHeat -= 3;` |
| `reassure` | Reassure them it is under control | staff trust | Government / Safety | `govFavor.us += 4; publicTrust += 2; staffTrust -= 4;` |
| `counsel` | Send your general counsel | public trust | CFO / Comms | `publicTrust -= 5; govFavor.us -= 2;` |

**`viralDemo`** (good news) — trigger: `liveModels(state).length > 0 && rng.chance(0.15)`. Title
"Viral demo win". Post `@techfluencer`: "this AI demo is the most impressive thing I have seen all
year".

| id | label | cost | backers / opposers | effects |
|---|---|---|---|---|
| `ride` | Ride the wave | race heat | Product / Safety | the live model with the highest `releaseSequence` (else the last one): `users = Math.round(users * 1.3); userCap = Math.max(userCap, users);` then `sentiment = clamp(sentiment + 0.1, 0.5, 1.5); raceHeat += 3;` |
| `earlyAccess` | Sell paid early access | — | CFO / Product | `cash += 15 * state.era;` |
| `humble` | Stay humble | — | Safety / Product | `publicTrust += 3;` |

- [ ] **Step 1: Write the failing tests:**

```js
const liveModel = (extra = {}) => ({
  name: 'Kestrel 1 Core', active: true, activated: true, activeFromTurn: 0, channel: 'consumer',
  flags: [], users: 1e6, userCap: 1e6, priceStance: 'market', releaseSequence: 0, spec: {}, ...extra,
});

test('a rival breakthrough needs a release that leaves you ten behind', () => {
  const event = EVENTS_6C.find((e) => e.id === 'rivalBreakthrough');
  const s = createInitialState();
  s.era = 2;
  s.rivals.find((r) => r.id === 'openbrain').capability = s.capability + 10;
  s.lastRivalReleases = [{ id: 'openbrain', gain: 8 }];
  assert.equal(event.trigger(s, no), true);
  s.rivals.find((r) => r.id === 'openbrain').capability = s.capability + 9;
  assert.equal(event.trigger(s, no), false);
});

test('rushing adds to an active run, or to research without one', () => {
  const run = createInitialState();
  run.activeRun = { bonus: 1, spikes: 0 };
  run.pendingEvents.push({ id: 'rivalBreakthrough' });
  resolveEvent(run, 'rivalBreakthrough', 'rush');
  assert.equal(run.activeRun.bonus, 5);
  assert.equal(run.alignmentDebt, 9);

  const idle = createInitialState();
  idle.pendingEvents.push({ id: 'rivalBreakthrough' });
  resolveEvent(idle, 'rivalBreakthrough', 'rush');
  assert.equal(idle.researchPoints, 15);
});

test('the export flip slows Qilin and never touches compute', () => {
  for (const choice of ['back', 'quiet']) {
    const s = createInitialState();
    const compute = structuredClone(s.compute);
    const speed = s.rivals.find((r) => r.id === 'qilin').speed;
    s.pendingEvents.push({ id: 'exportFlip' });
    resolveEvent(s, 'exportFlip', choice);
    assert.equal(s.rivals.find((r) => r.id === 'qilin').speed, speed * EXPORT_FLIP_QILIN_SPEED, choice);
    assert.deepEqual(s.compute, compute, choice);
  }
  const s = createInitialState();
  s.pendingEvents.push({ id: 'exportFlip' });
  resolveEvent(s, 'exportFlip', 'back');
  assert.equal(s.govFavor.us, 56);
});

test('a price war acts only on live models', () => {
  const s = createInitialState();
  s.models.push(liveModel(), liveModel({ active: false, users: 0 }), liveModel({ channel: 'open' }));
  s.pendingEvents.push({ id: 'priceWar' });
  resolveEvent(s, 'priceWar', 'match');
  assert.equal(s.models[0].revenueMult, 0.7);
  assert.equal(s.models[0].users, 1.05e6);
  assert.equal(s.models[0].userCap, 1.05e6);
  assert.equal(s.models[1].revenueMult, undefined);
  assert.equal(s.models[2].revenueMult, undefined);
});

test('copyright suits need a scraped model', () => {
  const event = EVENTS_6C.find((e) => e.id === 'copyright');
  const s = createInitialState();
  s.era = 2;
  assert.equal(event.trigger(s, yes), false);
  s.models.push(liveModel({ flags: ['scraped'] }));
  assert.equal(event.trigger(s, yes), true);
});

test('fighting the copyright suit files a court case', () => {
  const s = createInitialState();
  s.turn = 5;
  s.pendingEvents.push({ id: 'copyright' });
  resolveEvent(s, 'copyright', 'fight');
  assert.deepEqual(s.legalCases.at(-1), { cost: 120, dueTurn: 11, source: 'copyright' });
});

test('a Senate hearing opens in era 3 under low trust or high race heat', () => {
  const event = EVENTS_6C.find((e) => e.id === 'senateHearing');
  const s = createInitialState();
  s.era = 3;
  assert.equal(event.trigger(s, no), false);
  s.raceHeat = 56;
  assert.equal(event.trigger(s, no), true);
  s.era = 2;
  assert.equal(event.trigger(s, no), false);
});

test('riding a viral demo grows the newest live model past its cap', () => {
  const s = createInitialState();
  s.models.push(liveModel({ releaseSequence: 0 }), liveModel({ releaseSequence: 1, channel: 'enterprise' }));
  s.pendingEvents.push({ id: 'viralDemo' });
  resolveEvent(s, 'viralDemo', 'ride');
  assert.equal(s.models[0].users, 1e6);
  assert.equal(s.models[1].users, 1.3e6);
  assert.equal(s.models[1].userCap, 1.3e6);
  assert.equal(s.sentiment, 1.1);
});

test('every new card has two to four choices and uses known advisor labels', () => {
  const labels = new Set(['Safety', 'Research', 'CFO', 'Comms', 'Product', 'Government', 'Security', 'Staff']);
  for (const event of EVENTS_6C) {
    const n = event.card.choices.length;
    assert.ok(n >= 2 && n <= 4, event.id);
    for (const choice of event.card.choices) {
      for (const who of [...choice.backers, ...choice.opposers]) assert.ok(labels.has(who), `${event.id}.${choice.id}: ${who}`);
    }
  }
  assert.equal(EVENTS_6C.length, 11);
  const ids = [...EVENTS.map((e) => e.id), ...EVENTS_6C.map((e) => e.id)];
  assert.equal(new Set(ids).size, ids.length, 'ids are unique across both catalogs');
});
```

- [ ] **Step 2: Run and confirm failure.**
- [ ] **Step 3: Implement the six rows**, appended to `EVENTS_6C` after the Task 3 rows, in the
  order above.
- [ ] **Step 4: Run** `node --test tests/events6c.test.js` and `npm test`. Expected: all pass.
- [ ] **Step 5: Stop for the orchestrator's commit.**

### Task 5: balance bot choices and a balance check

**Files:** Modify `tools/balance.js` (`BALANCED_EVENT_CHOICES` only).

- [ ] **Step 1: Add the balanced bot's choices:** `lossSpike: 'rollback'`, `capabilityJump: 'audit'`,
  `whistleblower: 'cooperate'`, `safetyQuits: 'persuade'`, `boardRevolt: 'lobby'`,
  `rivalBreakthrough: 'study'`, `exportFlip: 'back'`, `priceWar: 'match'`, `copyright: 'license'`,
  `senateHearing: 'candid'`, `viralDemo: 'ride'`. (The speed bot already takes the last choice
  and the safety bot the first.)
- [ ] **Step 2: Run** `npm test` (includes `tests/balance.test.js`) and `npm run balance`.
  Expected: all tests pass. Record the four strategies' ending counts in the task report next to
  the baseline below.
- [ ] **Step 3: If a balance target fails,** stop and report the numbers. Do not tune rival speeds:
  plan 2C Task 8 re-tunes the whole game after merge.
- [ ] **Step 4: Stop for the orchestrator's commit.**

Baseline before this plan (`main` 1d96a76, 200 runs): balanced leftBehind 149, overtaken 36,
aligned 9, pyrrhic 6; random leftBehind 83, misalignment 69, misuse 12, acquihire 11,
rivalDisaster 11, aligned 7, overtaken 3, boardRemoved 2, pyrrhic 2. The best strategy wins 12%.

## Notes for other lanes

- **UI lane:** eleven new card ids (above). Two new kinds of card behaviour: `lossSpike` and
  `capabilityJump` are training cards that can appear more than once per game; `boardRevolt` can
  appear once per crisis. After an emergency vote, `state.flags.lastBoardVote = { turn, yes,
  passed }` is available for a result line. No new actions: all cards answer through
  `actions.eventChoices`.
- **Endings lane:** `state.flags.weightsStolen` and `state.flags.openWeights`, both stable once set,
  select the misuse film variant (either, or both).
- **Compute lane (plan 2C):** no `sim/turn.js` lines change. The `sim/events.js` edits avoid
  `addressWarning`. `sim/data/events.js` changes only the `weightTheft` and `selfExfiltration`
  rows (one `crisis: true` line each) and the first line of `stealWeights`. New rows use
  `rng.chance` in their triggers, so seeded runs and balance numbers shift after this merges.
