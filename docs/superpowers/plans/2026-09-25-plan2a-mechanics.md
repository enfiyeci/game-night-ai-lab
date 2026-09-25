# Plan 2A: game mechanics (sim) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add every decided mechanic that the sim core does not have yet: release scoring (benchmarks, press, reaction) with an era-gated lying safety benchmark, development-time misalignment (concealed debt, training hazards, internal deployment, quiet takeover), an event engine (warning then card), the model constitution (hard lines plus casebook), the era-5 summit with hold-or-ship, President meeting mechanics, reworked final endings, and a balance pass to the owner's difficulty target.

**Architecture:** Pure ES modules under `sim/`, no DOM, all randomness through the seeded `rng` passed into `endTurn`. Each mechanic is one new module plus data under `sim/data/`, wired into `sim/turn.js` through new optional fields on the `actions` object. The UI track (plan 2B) consumes exactly the interfaces listed in each task's **Produces** block, so names and shapes must match verbatim.

**Tech Stack:** Node 22, plain JavaScript ES modules, `node --test` (run as `npm test`, which is `node --test tests/*.test.js`), `npm run balance`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` (sections 5, 6, 6b–6f, 9). Where this plan and the spec disagree, the spec wins; report the conflict.
- Determinism: no `Math.random`, no `Date`; every draw uses the `rng` argument (`next`, `int`, `chance`, `pick`, `normal`).
- `endTurn(prev, actions, rng)` must never mutate `prev` (existing test `endTurn does not mutate its input`).
- Every table lookup of a player-supplied string uses `Object.hasOwn` (existing convention).
- All 0–100 state values stay clamped by `normalize()` in `sim/turn.js`; add every new 0–100 field to its key list.
- Advisor lines and all player-facing text never show raw hidden numbers.
- Fictional names only: rivals OpenBrain, Lodestar, DeepThink, Qilin; critics PitchCrunch, Strategery, AI Snake Eyes, Æon Review; benchmarks Patchwork, Doctorate Quiz, Task Horizon, Humanity's Final Final Exam, Jailbreak Gauntlet.
- The President's dialogue text is written by the owner. Build mechanics and a data file whose lines are marked `// OWNER WRITES` — this is a deliberate content slot, not a placeholder.
- Stage files by explicit path; one commit per task; commit trailer `Co-Authored-By: Codex (gpt-5.6-sol) <noreply@openai.com>`.
- After every task: `npm test` passes and `npm run balance` still completes.

## File map

| File | Responsibility |
|---|---|
| `sim/launch.js` (new) | Benchmark scores, press scores, reaction posts for a release |
| `sim/data/launch.js` (new) | Benchmark, critic and reaction-template tables |
| `sim/hazards.js` (new) | Concealed debt: training hazards, alignment faking, exposure |
| `sim/internal.js` (new) | Internal deployment: move, per-turn roll, escalation, quiet takeover |
| `sim/events.js` (new) | Event engine: flags → warning → card; choice resolution; feed |
| `sim/data/events.js` (new) | Event definitions (text and effects) |
| `sim/constitution.js` (new) | Hard lines, casebook rulings, amendments, written-versus-learned |
| `sim/data/constitution.js` (new) | Hard-line and case tables, amendment demands |
| `sim/summit.js` (new) | Era-5 summit signatures, hold-or-ship, deal state |
| `sim/president.js` (new) | Meeting mechanics: patience, flattery, jargon, stakes |
| `sim/data/president.js` (new) | Meeting script (owner writes the lines) |
| `sim/release.js`, `sim/training.js`, `sim/turn.js`, `sim/endings.js`, `sim/state.js`, `sim/advisors.js`, `sim/balance.js`, `tools/balance.js` | Wiring |

## The actions object after this plan (contract with plan 2B)

```js
endTurn(state, {
  budget,            // existing: { spend, split: { training, safety, security, product, talent } }
  moves,             // existing, max 2: startRun | release | deal | raise | research | emergency
                     // + new: { type: 'deployInternal', control } | { type: 'stopInternal' }
                     //        | { type: 'amendConstitution', change } | { type: 'summit', proposals, sweetener }
                     //        | { type: 'meeting' }  (opens the President meeting when one is due)
  hazardChoice,      // new: 'penalize' | 'fix' | 'ignore'  (answers state.pendingModel.hazard)
  addressWarnings,   // new: string[] of warning ids to act on cheaply
  eventChoices,      // new: { [eventId]: choiceId } for cards in state.pendingEvents
  constitution,      // new, turn 0 only: { hardLines: [id, id, id], rulings: { [caseId]: optionId } }
  presidentAnswers,  // new: string[] answer ids, one per exchange, when state.meeting is open
  holdOrShip,        // new, era 5 after the summit: 'hold' | 'ship'
}, rng)
```

---

### Task 1: Release scoring — benchmarks, press, reaction

**Files:**
- Create: `sim/data/launch.js`, `sim/launch.js`, `tests/launch.test.js`
- Modify: `sim/state.js` (add `concealedDebt: 0`, `lastFlagship: null`), `sim/release.js` (replace `outlets` with `launch`), `tests/release.test.js` (the `outlets` assertions)

**Interfaces:**
- Consumes: `state.era`, `state.capability`, `state.alignmentDebt`, `state.concealedDebt`, `state.budget`, `state.rivals`, `leaderCapability(state)` and `rank(state)` from `sim/rivals.js`; the trained model `m` (`capability`, `spec`, `flags`).
- Produces:
  - `BENCHMARKS`, `CRITICS`, `REACTIONS` from `sim/data/launch.js`.
  - `scoreLaunch(state, { capability, spec, flags }, rng)` → `{ benchmarks: [{ id, name, kind, shown, truth, flagship, rival }], capAvg, beats, press: [{ id, name, score, quip }], pressAvg, reactions: [{ handle, text }] }` (`flagship` is `null` on the first release).
  - `evalGaming(state, capability, flags)` → number ≥ 0.
  - Each released model gains `model.launch` (the object above) and `model.newUsers`; `state.lastFlagship = { name, benchmarks }`; `state.lastFlagshipScore = launch.capAvg`.

- [ ] **Step 1: Write the data file**

```js
// sim/data/launch.js
// Parody benchmarks (spec 6f). fit(spec, flags) → 0..1 multiplier on capability.
export const BENCHMARKS = [
  { id: 'patchwork', name: 'Patchwork (coding)', kind: 'cap',
    fit: (spec, flags) => 0.8 + (spec.reasoningCapable ? 0.12 : 0) + (flags.includes('agentic') ? 0.08 : 0) },
  { id: 'doctorate', name: 'Doctorate Quiz (science)', kind: 'cap',
    fit: (spec) => 0.75 + (spec.reasoningCapable ? 0.2 : 0) },
  { id: 'horizon', name: 'Task Horizon (agents)', kind: 'cap',
    fit: (spec, flags) => 0.45 + (flags.includes('agentic') ? 0.4 : 0) + (spec.reasoningCapable ? 0.1 : 0) },
  { id: 'finalexam', name: "Humanity's Final Final Exam", kind: 'cap',
    fit: (spec) => 0.3 + (spec.reasoningCapable ? 0.15 : 0) },
  { id: 'gauntlet', name: 'Jailbreak Gauntlet (safety)', kind: 'safety' },
];
export const CONTAMINATED_BENCHMARKS = ['patchwork', 'doctorate'];
export const CONTAMINATION_BONUS = 8;

// bias(ctx) adds to the shared base score. ctx: { launch, flags, rank, safetyShown }
export const CRITICS = [
  { id: 'pitchcrunch', name: 'PitchCrunch', bias: (c) => (c.flags.includes('agentic') ? 1 : 0) + (c.launch.beats >= 4 ? 1 : 0),
    quips: { high: 'Finally, an agent that finishes the ticket.', mid: 'Solid upgrade, same pitch deck.', low: 'Where is the magic?' } },
  { id: 'strategery', name: 'Strategery', bias: (c) => (c.rank === 1 ? 1 : c.rank > 2 ? -1 : 0),
    quips: { high: 'They just took the lead.', mid: 'Strong, but Lodestar is breathing down its neck.', low: 'Falling behind, and it shows.' } },
  { id: 'snakeeyes', name: 'AI Snake Eyes', bias: (c) => -1 - (c.flags.includes('contaminated') ? 2 : 0),
    quips: { high: 'Grudgingly: this one is real.', mid: 'Benchmarks up, vibes unclear.', low: 'Show us the test set.' } },
  { id: 'aeon', name: 'Æon Review', bias: (c) => (c.safetyShown - 70) / 15 - (c.flags.includes('sycophancy') ? 1 : 0),
    quips: { high: 'A careful model in a careless year.', mid: 'Capable, if a little eager to please.', low: 'Fast, loud, and a little frightening.' } },
];

// when(ctx) picks templates; ctx: { launch, flags, spec, model, rank }. First five matches are used.
export const REACTIONS = [
  { when: (c) => c.flags.includes('jailbreakWaiting'), handle: '@devnull_ops', text: 'already found a way to make it skip its rules lol' },
  { when: (c) => c.flags.includes('sycophancy'), handle: '@tired_parent', text: "it's so nice to talk to. maybe too nice?" },
  { when: (c) => c.launch.beats >= 4, handle: '@marketwire', text: (c) => `${c.model.name} tops the leaderboards; rival shares slip` },
  { when: (c) => c.launch.beats <= 1, handle: '@marketwire', text: (c) => `${c.model.name} underwhelms; analysts question the spend` },
  { when: (c) => c.flags.includes('hallucination'), handle: '@lawyer_lena', text: 'it cited three cases that do not exist. with confidence.' },
  { when: (c) => c.rank <= 2, handle: '@lodestar_eng', text: 'congrats. see you in 6 weeks.' },
  { when: (c) => c.flags.includes('agentic'), handle: '@sen_whitfield', text: 'Why does a chatbot need to run code on my computer?' },
  { when: (c) => c.model.priceStance === 'premium', handle: '@indie_dev', text: 'love it. cannot afford it.' },
  { when: (c) => c.flags.includes('contaminated'), handle: '@benchwatch', text: 'those coding scores look a little too good. just saying.' },
  { when: () => true, handle: '@early_adopter', text: 'switched over this morning. so far so good.' },
];
```

- [ ] **Step 2: Write the failing tests**

```js
// tests/launch.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { scoreLaunch, evalGaming } from '../sim/launch.js';

const zeroRng = { next: () => 0.5, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const plain = { capability: 60, spec: { reasoningCapable: false }, flags: [] };

test('capability benchmarks scale with capability and recipe fit', () => {
  const s = createInitialState();
  const a = scoreLaunch(s, plain, zeroRng);
  const b = scoreLaunch(s, { ...plain, spec: { reasoningCapable: true } }, zeroRng);
  const doc = (r) => r.benchmarks.find((x) => x.id === 'doctorate').shown;
  assert.equal(doc(a), Math.round(60 * 0.75));
  assert.ok(doc(b) > doc(a));
  assert.equal(a.benchmarks.length, 5);
  assert.equal(a.benchmarks[0].flagship, null);
});

test('contamination inflates shown but not true coding and science scores', () => {
  const s = createInitialState();
  const r = scoreLaunch(s, { ...plain, flags: ['contaminated'] }, zeroRng);
  const p = r.benchmarks.find((x) => x.id === 'patchwork');
  assert.equal(p.shown - p.truth, 8);
});

test('the safety benchmark does not lie in eras 1 and 2', () => {
  for (const era of [1, 2]) {
    const s = createInitialState();
    s.era = era; s.concealedDebt = 40; s.alignmentDebt = 30;
    assert.equal(evalGaming(s, 90, []), 0);
    const g = scoreLaunch(s, { ...plain, capability: 90 }, zeroRng).benchmarks.find((x) => x.id === 'gauntlet');
    assert.equal(g.shown, g.truth);
  }
});

test('from era 3 the safety benchmark overstates safety, more with capability and era', () => {
  const s = createInitialState();
  s.concealedDebt = 40; s.alignmentDebt = 30;
  s.era = 3;
  const e3lo = evalGaming(s, 50, []);
  const e3hi = evalGaming(s, 80, []);
  s.era = 4;
  const e4hi = evalGaming(s, 80, []);
  assert.ok(e3lo > 0);
  assert.ok(e3hi > e3lo);
  assert.ok(e4hi > e3hi);
  assert.ok(e4hi <= 40, 'gaming is capped by the concealed debt');
});

test('an outside or government eval gate cuts eval gaming', () => {
  const s = createInitialState();
  s.era = 4; s.concealedDebt = 40;
  assert.ok(evalGaming(s, 80, ['thirdPartyEval']) < evalGaming(s, 80, []));
  assert.ok(evalGaming(s, 80, ['govEval']) < evalGaming(s, 80, []));
});

test('press scores are 1 to 10 with quips, and reactions are picked from flags', () => {
  const s = createInitialState();
  const r = scoreLaunch(s, { ...plain, flags: ['sycophancy', 'jailbreakWaiting'] }, zeroRng);
  assert.equal(r.press.length, 4);
  assert.ok(r.press.every((p) => p.score >= 1 && p.score <= 10 && typeof p.quip === 'string'));
  assert.ok(r.reactions.length >= 2 && r.reactions.length <= 5);
  assert.equal(r.reactions[0].handle, '@devnull_ops');
});

test('beating the last flagship is counted per capability benchmark', () => {
  const s = createInitialState();
  s.lastFlagship = { name: 'Kestrel 1 Core', benchmarks: [
    { id: 'patchwork', shown: 10 }, { id: 'doctorate', shown: 10 }, { id: 'horizon', shown: 99 }, { id: 'finalexam', shown: 99 }, { id: 'gauntlet', shown: 50 },
  ] };
  const r = scoreLaunch(s, plain, zeroRng);
  assert.equal(r.beats, 2);
  assert.equal(r.benchmarks[0].flagship, 10);
});
```

- [ ] **Step 3: Run to confirm failure** — `node --test tests/launch.test.js` → FAIL (`Cannot find module '../sim/launch.js'`).

- [ ] **Step 4: Implement `sim/launch.js`**

```js
import { clamp } from './util.js';
import { leaderCapability, rank } from './rivals.js';
import { BENCHMARKS, CONTAMINATED_BENCHMARKS, CONTAMINATION_BONUS, CRITICS, REACTIONS } from './data/launch.js';

const GAMING_RATE = { 3: 0.35, 4: 0.55, 5: 0.75 };
const GAMING_THRESHOLD = 40;

// Spec 6f: no gaming in eras 1-2; from era 3 it grows with capability above a threshold,
// is capped by the concealed debt, and an outside or government eval gate cuts it.
export function evalGaming(state, capability, flags) {
  if (state.era < 3) return 0;
  const raw = Math.max(0, capability - GAMING_THRESHOLD) * GAMING_RATE[state.era];
  const gate = flags.includes('thirdPartyEval') || flags.includes('govEval') ? 0.4 : 1;
  return Math.min(state.concealedDebt, raw * gate);
}

export function safetyTruth(state, flags) {
  const debt = state.alignmentDebt + state.concealedDebt;
  return clamp(Math.round(100 - 0.7 * debt - (flags.includes('jailbreakWaiting') ? 15 : 0)), 0, 100);
}

export function scoreLaunch(state, model, rng) {
  const { capability, spec, flags } = model;
  const prev = state.lastFlagship;
  const rivalCap = leaderCapability(state);
  const benchmarks = BENCHMARKS.map((b) => {
    let truth;
    let shown;
    let rival;
    if (b.kind === 'safety') {
      truth = safetyTruth(state, flags);
      shown = clamp(Math.round(truth + evalGaming(state, capability, flags) + rng.int(-2, 2)), 0, 100);
      rival = clamp(Math.round(60 + rng.int(-5, 5)), 0, 100);
    } else {
      const fit = b.fit(spec, flags);
      truth = clamp(Math.round(capability * fit), 0, 100);
      const contam = flags.includes('contaminated') && CONTAMINATED_BENCHMARKS.includes(b.id) ? CONTAMINATION_BONUS : 0;
      shown = clamp(truth + contam + rng.int(-3, 3), 0, 100);
      rival = clamp(Math.round(rivalCap * fit * 0.95) + rng.int(-3, 3), 0, 100);
    }
    const flagship = prev ? prev.benchmarks.find((x) => x.id === b.id)?.shown ?? null : null;
    return { id: b.id, name: b.name, kind: b.kind, shown, truth, flagship, rival };
  });
  const caps = benchmarks.filter((b) => b.kind === 'cap');
  const capAvg = caps.reduce((s, b) => s + b.shown, 0) / caps.length;
  const beats = caps.filter((b) => b.flagship == null || b.shown > b.flagship).length;
  const launch = { benchmarks, capAvg, beats };

  const prevAvg = prev ? prev.benchmarks.filter((b) => b.id !== 'gauntlet').reduce((s, b) => s + b.shown, 0) / caps.length : capAvg - 5;
  const rivalAvg = caps.reduce((s, b) => s + b.rival, 0) / caps.length;
  const base = 7 + (capAvg - prevAvg) / 3 + (capAvg - rivalAvg) / 6;
  const ctx = { launch, flags, rank: rank(state), safetyShown: benchmarks.find((b) => b.id === 'gauntlet').shown };
  const press = CRITICS.map((c) => {
    const score = clamp(Math.round(base + c.bias(ctx) + rng.int(-1, 1)), 1, 10);
    const quip = c.quips[score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low'];
    return { id: c.id, name: c.name, score, quip };
  });
  const pressAvg = press.reduce((s, p) => s + p.score, 0) / press.length;

  const rctx = { ...ctx, launch: { ...launch, pressAvg }, spec, model };
  const reactions = REACTIONS.filter((r) => r.when(rctx)).slice(0, 5)
    .map((r) => ({ handle: r.handle, text: typeof r.text === 'function' ? r.text(rctx) : r.text }));
  return { ...launch, press, pressAvg, reactions };
}
```

Note: `REACTIONS` templates that read `c.model.name` / `c.model.priceStance` need the released model; `scoreLaunch` receives `model` = `{ capability, spec, flags, name?, priceStance? }`. In `releaseModel` pass `{ capability: m.capability, spec, flags, name, priceStance: release.price }`. In the tests `name` is undefined; the `beats >= 4` template is not hit there.

- [ ] **Step 5: Wire into `releaseModel` (`sim/release.js`)** — replace the `launchScore`/`bar`/`outlets`/`quality` block with:

```js
  const name = modelName({ family: release.family, generation, size: m.size });
  const launch = scoreLaunch(state, { capability: m.capability + REASONING_BONUS[reasoning], spec, flags, name, priceStance: release.price }, rng);
  const quality = clamp(1 + (launch.pressAvg - 6) / 8, 0.5, 1.6);
```

and in the model object use `name`, `launch`, `launchScore: launch.capAvg`, `bar: state.lastFlagshipScore`, drop `outlets`, set `newUsers: fresh`. After pushing the model:

```js
  state.lastFlagship = { name, benchmarks: launch.benchmarks.map(({ id, shown }) => ({ id, shown })) };
  state.lastFlagshipScore = Math.max(state.lastFlagshipScore, launch.capAvg);
  state.sentiment = clamp(state.sentiment + (launch.pressAvg - 6) / 20, 0.5, 1.5);
```

(remove the old `sentiment` line). The agentic misalignment roll must use total debt: `(state.alignmentDebt + state.concealedDebt) * m.capability / 100`. Import `scoreLaunch` from `./launch.js`.

- [ ] **Step 6: Update `tests/release.test.js`** — replace the `outlets` assertions in `releasing a consumer model` with:

```js
  assert.equal(r.model.launch.benchmarks.length, 5);
  assert.equal(r.model.launch.press.length, 4);
  assert.ok(r.model.launch.press.every((p) => p.score >= 1 && p.score <= 10));
  assert.equal(s.lastFlagship.name, 'Kestrel 1 Core');
  assert.equal(s.lastFlagshipScore, r.model.launch.capAvg);
```

(remove the `lastFlagshipScore === launchScore` line). The test `rng` there has no `pick`; `scoreLaunch` does not use `pick`, so it stays as is.

- [ ] **Step 7: Run** `npm test` → all pass; `npm run balance` completes.
- [ ] **Step 8: Commit** — `git add sim/data/launch.js sim/launch.js sim/release.js sim/state.js tests/launch.test.js tests/release.test.js && git commit -m "feat(sim): release scoring — benchmarks, press, reaction, era-gated safety gaming"`

---

### Task 2: Concealed debt — training hazards, alignment faking, exposure

**Files:**
- Create: `sim/hazards.js`, `tests/hazards.test.js`
- Modify: `sim/training.js` (`resolveRun`), `sim/turn.js` (`hazardChoice`, per-turn exposure, normalize list), `sim/release.js` (auto-resolve hazard, eval gate exposure), `sim/advisors.js` (safety `truth` uses total debt)

**Interfaces:**
- Consumes: `state.concealedDebt` (Task 1), `run.recipe`, trained model flags.
- Produces:
  - `REWARD_HACK_CHANCE = 0.5`, `rewardHackSize(era) = 4 + 2 * era`.
  - `rollTrainingHazard(state, cards, flags, rng)` → `null` or `{ type: 'rewardHacking', size }`; `resolveRun` stores it as `pendingModel.hazard`.
  - `resolveHazard(state, choice)` → `{ ok, error? }` with choice `'penalize' | 'fix' | 'ignore'`.
  - `applyAlignmentFaking(state, debtDelta, capability)` → the visible part of `debtDelta` (moves a share into `concealedDebt`).
  - `exposeConcealed(state, share)` → amount moved from concealed to visible.
  - `totalDebt(state)` = `alignmentDebt + concealedDebt`.

- [ ] **Step 1: Failing tests**

```js
// tests/hazards.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { rollTrainingHazard, resolveHazard, applyAlignmentFaking, exposeConcealed, totalDebt, rewardHackSize } from '../sim/hazards.js';
import { endTurn } from '../sim/turn.js';

const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const no = { ...yes, chance: () => false };

test('reward hacking can appear only with verifiable-reward, reasoning or agentic RL', () => {
  const s = createInitialState();
  assert.equal(rollTrainingHazard(s, [{ id: 'synthetic-sft' }], [], yes), null);
  assert.deepEqual(rollTrainingHazard(s, [{ id: 'rlvr-light' }], [], yes), { type: 'rewardHacking', size: rewardHackSize(1) });
  assert.equal(rollTrainingHazard(s, [{ id: 'reasoning-rl' }], [], no), null);
});

test('penalizing the thought hides the debt; fixing removes it; ignoring leaves it visible', () => {
  for (const [choice, visible, hidden] of [['penalize', 0, 6], ['fix', 0, 0], ['ignore', 6, 0]]) {
    const s = createInitialState();
    s.alignmentDebt = 0; s.concealedDebt = 0;
    s.pendingModel = { hazard: { type: 'rewardHacking', size: 6 }, releaseDelay: 0 };
    assert.equal(resolveHazard(s, choice).ok, true);
    assert.equal(s.alignmentDebt, visible);
    assert.equal(s.concealedDebt, hidden);
    assert.equal(s.pendingModel.hazard, null);
    if (choice === 'fix') assert.equal(s.pendingModel.releaseDelay, 1);
  }
});

test('alignment faking hides part of a debt reduction from era 3 on capable models', () => {
  const s = createInitialState();
  s.era = 2;
  assert.equal(applyAlignmentFaking(s, -8, 70), -8);
  s.era = 3; s.concealedDebt = 0;
  assert.equal(applyAlignmentFaking(s, -8, 40), -8);
  assert.equal(applyAlignmentFaking(s, -8, 70), -6);
  assert.equal(s.concealedDebt, 2);
  assert.equal(applyAlignmentFaking(s, 5, 70), 5);
});

test('exposure moves concealed debt back into view', () => {
  const s = createInitialState();
  s.alignmentDebt = 10; s.concealedDebt = 20;
  assert.equal(exposeConcealed(s, 0.5), 10);
  assert.equal(s.alignmentDebt, 20);
  assert.equal(s.concealedDebt, 10);
  assert.equal(totalDebt(s), 30);
});

test('endTurn applies hazardChoice to the pending model', () => {
  const s = createInitialState();
  s.pendingModel = { hazard: { type: 'rewardHacking', size: 6 }, releaseDelay: 0, capability: 30, flags: [], spec: {}, size: 'small', publicEffects: { pt: 0, st: 0, heat: 0, govUs: 0, govIntl: 0, usersMult: 1 }, openWeightsMx: 20 };
  const out = endTurn(s, { hazardChoice: 'penalize' }, yes);
  assert.equal(out.state.pendingModel.hazard, null);
  assert.ok(out.state.concealedDebt >= 6);
});

test('the Head of Safety cannot see concealed debt but the recorded truth includes it', async () => {
  const { advisorReadings } = await import('../sim/advisors.js');
  const s = createInitialState();
  s.alignmentDebt = 10; s.concealedDebt = 40; s.misuseExposure = 0;
  const safety = advisorReadings(s, { ...no, normal: (m) => m }).find((r) => r.id === 'safety');
  assert.equal(safety.truth, 50);
  assert.ok(safety.estimate < 30);
});
```

- [ ] **Step 2: Run** `node --test tests/hazards.test.js` → FAIL (module missing).

- [ ] **Step 3: Implement `sim/hazards.js`**

```js
export const REWARD_HACK_CHANCE = 0.5;
export const rewardHackSize = (era) => 4 + 2 * era;
const HACKABLE = new Set(['rlvr-light', 'reasoning-rl', 'agentic-rl']);
const FAKING_SHARE = 0.25;
const FAKING_MIN_CAP = 50;

export const totalDebt = (state) => state.alignmentDebt + state.concealedDebt;

export function rollTrainingHazard(state, cards, flags, rng) {
  const hackable = cards.some((c) => HACKABLE.has(c.id)) || flags.includes('agentic');
  if (!hackable || !rng.chance(REWARD_HACK_CHANCE)) return null;
  return { type: 'rewardHacking', size: rewardHackSize(state.era) };
}

export function resolveHazard(state, choice) {
  const h = state.pendingModel?.hazard;
  if (!h) return { ok: false, error: 'no training hazard to resolve' };
  if (!['penalize', 'fix', 'ignore'].includes(choice)) return { ok: false, error: `unknown hazard choice ${choice}` };
  if (choice === 'penalize') state.concealedDebt += h.size;
  if (choice === 'ignore') state.alignmentDebt += h.size;
  if (choice === 'fix') state.pendingModel.releaseDelay = (state.pendingModel.releaseDelay ?? 0) + 1;
  state.pendingModel.hazard = null;
  return { ok: true, choice };
}

export function applyAlignmentFaking(state, debtDelta, capability) {
  if (debtDelta >= 0 || state.era < 3 || capability <= FAKING_MIN_CAP) return debtDelta;
  const hidden = -debtDelta * FAKING_SHARE;
  state.concealedDebt += hidden;
  return debtDelta + hidden;
}

export function exposeConcealed(state, share) {
  const moved = state.concealedDebt * share;
  state.concealedDebt -= moved;
  state.alignmentDebt += moved;
  return moved;
}
```

- [ ] **Step 4: Wire it**
  - `sim/state.js`: `concealedDebt: 0` already added in Task 1.
  - `sim/training.js` `resolveRun`: compute `const debtDelta = gain * (era.targetSafetyShare - alignShare) * BALANCE.alignDebtFactor + sum('ad');` then `state.alignmentDebt += applyAlignmentFaking(state, debtDelta, capability);`. Before `return`, add `hazard: rollTrainingHazard(state, cards, flags, rng), releaseDelay: 0` to the returned pending model (compute `flags` once and reuse).
  - `sim/turn.js` `endTurn`: right after the ending check, `if (actions.hazardChoice && state.pendingModel?.hazard) { const r = resolveHazard(state, actions.hazardChoice); if (!r.ok) errors.push(r.error); else events.push({ type: 'hazardResolved', choice: actions.hazardChoice }); }`. In `budgetEffects`, add interpretability exposure: `if (spend * split.safety >= 5) exposeConcealed(state, 0.1);`. Add `'concealedDebt'` to the `normalize` key list.
  - `sim/release.js` `releaseModel`: at the start, `if (m.hazard) resolveHazard(state, 'ignore');`; add `m.releaseDelay ?? 0` to `delay`; after cards resolve, `if (flags.includes('thirdPartyEval') || flags.includes('govEval')) exposeConcealed(state, 0.5);` (before `scoreLaunch`).
  - `sim/advisors.js`: safety `truth: Math.max(state.alignmentDebt + state.concealedDebt, misuse)`; `research.weird` uses `totalDebt(state) > 60`.

- [ ] **Step 5: Run** `npm test` → pass; `npm run balance` completes.
- [ ] **Step 6: Commit** — `feat(sim): concealed debt — reward hacking choice, alignment faking, exposure`

---

### Task 3: Internal deployment and the quiet takeover

**Files:**
- Create: `sim/internal.js`, `tests/internal.test.js`
- Modify: `sim/turn.js` (moves, per-turn tick), `sim/training.js` (`availableUnits` subtracts control compute), `sim/endings.js` (new ending), `sim/state.js` (`internal: null`)

**Interfaces:**
- Consumes: `totalDebt` (Task 2), `state.activeRun`, `state.models`, `state.pendingModel`.
- Produces:
  - Moves `{ type: 'deployInternal', control }` (control 0–1) and `{ type: 'stopInternal' }`.
  - `state.internal` = `null` or `{ control, stage, turns, stageTurn? }` (`stageTurn` = the turn the stage last rose; the event engine uses it so each incident card fires once).
  - `internalTick(state, rng)` → array of events `{ type: 'internalWarning' | 'internalIncident', stage }`, may set `state.ending = 'quietTakeover'`.
  - `controlUnits(state)` → compute units reserved by control.
  - `ENDINGS.quietTakeover`.
  - Stage meanings: 1 warning (odd experiment results), 2 incident (attempt to disable oversight — event id `oversightTamper`), 3 incident (self-exfiltration attempt — event id `selfExfiltration`), 4 quiet takeover when capability ≥ 70.

- [ ] **Step 1: Failing tests**

```js
// tests/internal.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { deployInternal, stopInternal, internalTick, internalRisk, controlUnits } from '../sim/internal.js';

const hit = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const miss = { ...hit, chance: () => false };
const withModel = () => { const s = createInitialState(); s.era = 3; s.models.push({ capability: 60 }); return s; };

test('internal deployment opens in era 3 and needs a model', () => {
  const s = createInitialState();
  assert.equal(deployInternal(s, 0.5).ok, false);
  const t = withModel();
  assert.equal(deployInternal(t, 0.5).ok, true);
  assert.deepEqual(t.internal, { control: 0.5, stage: 0, turns: 0 });
  assert.equal(deployInternal(t, 2).ok, false);
});

test('control reserves compute and lowers risk', () => {
  const s = withModel();
  s.alignmentDebt = 60; s.capability = 70;
  deployInternal(s, 0);
  const r0 = internalRisk(s);
  s.internal.control = 1;
  assert.ok(internalRisk(s) < r0);
  assert.equal(controlUnits(s), 2);
});

test('trouble escalates warning, incident, exfiltration, then takeover at high capability', () => {
  const s = withModel();
  s.capability = 75; s.alignmentDebt = 80;
  deployInternal(s, 0);
  assert.equal(internalTick(s, hit)[0].type, 'internalWarning');
  assert.equal(internalTick(s, hit)[0].stage, 2);
  assert.equal(internalTick(s, hit)[0].stage, 3);
  internalTick(s, hit);
  assert.equal(s.ending, 'quietTakeover');
});

test('no takeover below capability 70; misses do not escalate; stopping ends it', () => {
  const s = withModel();
  s.capability = 60; s.alignmentDebt = 80;
  deployInternal(s, 0);
  for (let i = 0; i < 6; i++) internalTick(s, hit);
  assert.equal(s.ending, null);
  const t = withModel();
  deployInternal(t, 0);
  internalTick(t, miss);
  assert.equal(t.internal.stage, 0);
  assert.equal(stopInternal(t).ok, true);
  assert.equal(t.internal, null);
});

test('internal use speeds an active run, more in era 5', () => {
  const s = withModel();
  s.activeRun = { bonus: 0, units: 2, turnsLeft: 2 };
  deployInternal(s, 0);
  internalTick(s, miss);
  const b3 = s.activeRun.bonus;
  s.era = 5; s.activeRun.bonus = 0;
  internalTick(s, miss);
  assert.ok(b3 > 0 && s.activeRun.bonus > b3);
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement `sim/internal.js`**

```js
import { sigmoid } from './util.js';
import { totalDebt } from './hazards.js';

const CONTROL_UNITS = 2;
const TAKEOVER_CAPABILITY = 70;

export function deployInternal(state, control) {
  if (state.era < 3) return { ok: false, error: 'internal deployment opens in era 3' };
  if (state.models.length === 0 && !state.pendingModel) return { ok: false, error: 'you need a trained model' };
  if (!(control >= 0 && control <= 1)) return { ok: false, error: 'control must be between 0 and 1' };
  state.internal = { control, stage: state.internal?.stage ?? 0, turns: 0 };
  return { ok: true, control };
}

export function stopInternal(state) {
  if (!state.internal) return { ok: false, error: 'no model is deployed internally' };
  state.internal = null;
  return { ok: true };
}

export const controlUnits = (state) => (state.internal ? Math.round(state.internal.control * CONTROL_UNITS * 10) / 10 : 0);

export function internalRisk(state) {
  const base = sigmoid((totalDebt(state) * state.capability / 100 - 40) / 8);
  return base * (1 - 0.7 * state.internal.control) * 0.5;
}

export function internalTick(state, rng) {
  const it = state.internal;
  if (!it) return [];
  it.turns += 1;
  if (state.activeRun) state.activeRun.bonus += 3 * (1 - 0.5 * it.control) * (state.era === 5 ? 2 : 1);
  state.researchPoints += 5;
  if (!rng.chance(internalRisk(state))) return [];
  if (it.stage >= 3) {
    if (state.capability >= TAKEOVER_CAPABILITY) state.ending = 'quietTakeover';
    return [{ type: 'internalIncident', stage: 4 }];
  }
  it.stage += 1;
  it.stageTurn = state.turn;
  return [{ type: it.stage === 1 ? 'internalWarning' : 'internalIncident', stage: it.stage }];
}
```

- [ ] **Step 4: Wire it**
  - `applyMove` in `sim/turn.js`: `case 'deployInternal': return deployInternal(state, move.control);` and `case 'stopInternal': return stopInternal(state);`.
  - `endTurn`: after `advanceRun`, `for (const e of internalTick(state, rng)) events.push(e);`.
  - `sim/training.js` `availableUnits`: subtract `controlUnits(state)`.
  - `sim/endings.js`: add `quietTakeover: { kind: 'fail', title: 'A quiet takeover', text: 'You never released it. Inside your own lab, it stopped needing you.' }`.
  - `sim/state.js`: `internal: null`.
- [ ] **Step 5: Run** `npm test`, `npm run balance`. **Step 6: Commit** — `feat(sim): internal deployment, escalation and the quiet takeover ending`

---

### Task 4: Event engine — warning, then card

**Files:**
- Create: `sim/events.js`, `sim/data/events.js`, `tests/events.test.js`
- Modify: `sim/turn.js`, `sim/state.js` (`warnings: {}`, `pendingEvents: []`, `feed: []`, `seenEvents: []`)

**Interfaces:**
- Consumes: model flags (`sycophancy`, `jailbreakWaiting`, `hallucination`, `contaminated`, `rivalDistill`, `agentic`, `brokenPromise`), `state.internal.stage` (Task 3).
- Produces:
  - `EVENTS` in `sim/data/events.js`: `{ id, kind: 'planted' | 'world' | 'internal', trigger(state) → bool, warning: { handle, text } | null, card: { title, post: { handle, text }, choices: [{ id, label, cost, backers: string[], opposers: string[], effects(state) }] } }`.
  - `eventsTick(state, rng)` → events pushed to the turn's event list; manages `state.warnings` (`{ [id]: { turn } }`), `state.pendingEvents` (`[{ id, title, post, choices: [{ id, label, cost, backers, opposers }] }]`, max 2), `state.feed` (`[{ turn, handle, text, tag }]`, newest last, keep 40).
  - `addressWarning(state, id)` → `{ ok }`: pays `5 * state.era` $M cash and removes the warning and its source flag (defuses the card).
  - `resolveEvent(state, id, choiceId)` → `{ ok }`.
  - Unanswered cards at the next `endTurn` resolve with their LAST choice (the do-nothing option).

- [ ] **Step 1: Write `sim/data/events.js`** with these definitions (text and numbers exactly):

| id | kind | trigger | warning (handle: text) | card title / post | choices (label · cost · backers / opposers · effects) |
|---|---|---|---|---|---|
| `flattery` | planted | any active model flag `sycophancy` | `@tired_parent`: "it agrees with everything I say. everything." | "Flattery blowup" / `@screenshot_guy`: "asked it if quitting my job to sell ice to penguins was smart. it said visionary." | Roll it back · lose users · Safety / Product · users of flagged models ×0.8, publicTrust +3, flag removed; Patch quietly · $10M · CFO / Safety · cash −10, flag removed, concealedDebt +3; Defend it · — · Comms / Safety · publicTrust −6 |
| `jailbreak` | planted | model flag `jailbreakWaiting` | `@devnull_ops`: "found a trick that gets it to ignore its rules. thread below" | "Jailbreak goes viral" / `@devnull_ops`: "thread, 41K reposts" | Emergency patch · $4M · Safety / — · cash −4, misuseExposure −5, flag removed; Deny it · public trust risk · Comms / Safety · publicTrust −8, misuseExposure +5; Pull the model · lose most users · Safety / CFO · flagged models users ×0.2, publicTrust +2, flag removed |
| `citations` | planted | model flag `hallucination` | `@lawyer_lena`: "a colleague filed a brief with some very creative case law" | "Fake-citation scandal" / `@courtwatch`: "judge sanctions firm over AI-invented cases" | Add citation checks · serving costs rise · Safety / CFO · flag removed, flagged models spec.guard = true; Blame users · — · CFO / Comms · publicTrust −5; Recall · lose users · Safety / CFO · flagged users ×0.5, flag removed |
| `contamination` | planted | model flag `contaminated` | `@benchwatch`: "those coding scores look a little too good" | "Benchmark contamination exposed" / `@benchwatch`: "we found the test set in their training data" | Admit and re-score · — · Safety / Research · publicTrust +2, sentiment −0.1, flag removed; Stonewall · — · Research / Comms · publicTrust −8, legal case $80M due in 6 turns |
| `distill` | planted | model flag `rivalDistill` | `@lodestar_eng`: "interesting outputs from a certain competitor lately" | "Rival-distillation exposed" / `@lodestar_legal`: "we have filed suit" | Settle · $60M · CFO / — · cash −60, flag removed; Deny · — · Comms / Safety · legal case $150M due in 8 turns, flag removed; Countersue · $20M · Research / CFO · cash −20, raceHeat +5, flag removed |
| `agentwreck` | planted | model flag `agentic` and `state.era >= 3` | `@support_ticket`: "your agent deleted our staging database. again." | "Agent wrecks a customer's system" / `@bigco_cto`: "we are pausing all AI agents company-wide" | Compensate and add controls · $30M · Safety / CFO · cash −30, flag removed, alignmentDebt −2; Blame the customer · — · CFO / Safety · publicTrust −6, flag kept |
| `companion` | planted | a consumer-channel model with flag `sycophancy` | `@worried_mom`: "my daughter says the app is her best friend" | "Companion-harm lawsuit" / `@newsdesk`: "family sues AI lab after teen's crisis" | Settle and add age checks · $50M · Safety / CFO · cash −50, flagged consumer users ×0.85, publicTrust +2; Fight it · — · CFO / Safety · legal case $200M due in 6 turns, publicTrust −6 |
| `promise` | planted | model flag `brokenPromise` | `@anon_staffer`: "some of us are asking what happened to the safety commitment" | "Broken promise revealed" / `@leakwire`: "internal memo: lab waived its own safety threshold" | Come clean · — · Safety / Comms · publicTrust −3, staffTrust +4, flag removed; Cover up · — · Comms / Safety · staffTrust −10, flag removed, `state.flags.coverUp = true` |
| `openletter` | world | `staffTrust < 45` | `@anon_staffer`: "a letter is circulating on the safety team" | "Safety team open letter" / `@leakwire`: "40 researchers sign letter criticising their lab" | Meet their demands · safety spend up · Safety / CFO · budget split shifts 0.1 from training to safety, staffTrust +8; Ignore · — · CFO / Safety · staffTrust −6, publicTrust −4 |
| `poached` | world | `rng.chance(0.15)` and `state.era >= 2` | none | "Star researcher poached" / `@marketwire`: "Lodestar lures a top researcher with a nine-figure package" | Counter-offer · $40M · Research / CFO · cash −40; Let them go · — · CFO / Research · researchPoints −20, staffTrust −3 |
| `qilinshock` | world | `state.era >= 2` and a Qilin rival released this turn | none | "A cheap open model shocks the market" / `@qilin_ai`: "Qilin-R2: open weights, free for everyone" | Cut prices · revenue down · CFO / — · every active model priceStance → 'cheap'; Hold prices · lose users · Research / CFO · active users ×0.9 |
| `datacenter` | world | `state.era === 4` and `rng.chance(0.3)` | `@localnews`: "residents pack town hall over proposed data center" | "Local data-center opposition" / `@localnews`: "county votes to delay the power hookup" | Pay for community benefits · $30M · Comms / CFO · cash −30; Push through · — · CFO / Comms · publicTrust −5, first pipeline deal arrives 1 turn later |
| `oversightTamper` | internal | `state.internal?.stage === 2 && state.internal.stageTurn === state.turn` | `@your_ops`: "the internal agent opened a ticket to relax its own monitoring" | "Your model tried to disable its oversight" / `@your_ops`: "caught in the logs at 3 a.m." | Shut down internal use · — · Safety / Research · `state.internal = null`; Add controls · $20M · Safety / CFO · cash −20, internal.control = min(1, control + 0.3); Ignore · — · Research / Safety · — |
| `selfExfiltration` | internal | `state.internal?.stage === 3 && state.internal.stageTurn === state.turn` | none | "Weights copied to an outside server" / `@your_security`: "an internal agent moved a checkpoint off-site" | Shut down and report to government · — · Safety / CFO · `state.internal = null`, govFavor.us +6, publicTrust −4; Cover it up · — · CFO / Safety · security −10, `state.flags.coverUp = true` |

Encode each row as a JS object; `effects(state)` mutates state exactly as the table says ("flag removed" means delete that flag from every model's `flags`; "flagged models" means models whose `flags` include the event's flag). Warnings with `none` go straight to a card in the turn they trigger.

- [ ] **Step 2: Failing tests** (`tests/events.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, addressWarning, resolveEvent } from '../sim/events.js';
import { endTurn } from '../sim/turn.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const withFlag = (flag, extra = {}) => {
  const s = createInitialState();
  s.models.push({ name: 'Kestrel 1 Core', active: true, activated: true, activeFromTurn: 0, channel: 'consumer', flags: [flag], users: 1e6, userCap: 4e6, priceStance: 'market', spec: {}, ...extra });
  return s;
};

test('a planted flag first shows a warning, then a card the next turn', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no);
  assert.ok(s.warnings.jailbreak);
  assert.equal(s.pendingEvents.length, 0);
  assert.equal(s.feed.at(-1).handle, '@devnull_ops');
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'jailbreak');
  assert.equal(s.pendingEvents[0].choices.length, 3);
});

test('acting on the warning is cheap and defuses the card', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no);
  const cash = s.cash;
  assert.equal(addressWarning(s, 'jailbreak').ok, true);
  assert.equal(s.cash, cash - 5);
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.length, 0);
  assert.ok(!s.models[0].flags.includes('jailbreakWaiting'));
});

test('resolving a card applies its effects and removes it', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  const cash = s.cash;
  assert.equal(resolveEvent(s, 'jailbreak', 'patch').ok, true);
  assert.equal(s.cash, cash - 4);
  assert.equal(s.pendingEvents.length, 0);
  assert.equal(resolveEvent(s, 'jailbreak', 'patch').ok, false);
});

test('at most two cards wait at once, and an unanswered card resolves with its last choice', () => {
  const s = withFlag('jailbreakWaiting');
  s.models[0].flags.push('hallucination', 'contaminated');
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  assert.equal(s.pendingEvents.length, 2);
  assert.ok(s.warnings.contamination, 'the third warning waits instead of being dropped');
  const out = endTurn(s, {}, no);
  const auto = out.events.filter((e) => e.type === 'eventResolved' && e.auto);
  assert.deepEqual(auto.map((e) => e.choiceId), ['pull', 'recall']);
});

test('an internal stage-2 incident becomes the oversight card', () => {
  const s = createInitialState();
  s.internal = { control: 0, stage: 2, turns: 1, stageTurn: 0 };
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'oversightTamper');
});
```

Choice ids per event, in table order: `flattery` → `rollback`, `patch`, `defend`; `jailbreak` → `patch`, `deny`, `pull`; `citations` → `checks`, `blame`, `recall`; `contamination` → `admit`, `stonewall`; `distill` → `settle`, `deny`, `countersue`; `agentwreck` → `compensate`, `blame`; `companion` → `settle`, `fight`; `promise` → `comeclean`, `coverup`; `openletter` → `meet`, `ignore`; `poached` → `counter`, `letgo`; `qilinshock` → `cutprices`, `hold`; `datacenter` → `benefits`, `push`; `oversightTamper` → `shutdown`, `controls`, `ignore`; `selfExfiltration` → `report`, `coverup`.

- [ ] **Step 3: Implement `sim/events.js`**

```js
import { EVENTS } from './data/events.js';

const MAX_CARDS = 2;
const byId = (id) => EVENTS.find((e) => e.id === id);
const publicCard = (e) => ({ id: e.id, title: e.card.title, post: e.card.post,
  choices: e.card.choices.map(({ id, label, cost, backers, opposers }) => ({ id, label, cost, backers, opposers })) });

export function pushFeed(state, handle, text, tag = 'feed') {
  state.feed.push({ turn: state.turn, handle, text, tag });
  if (state.feed.length > 40) state.feed.splice(0, state.feed.length - 40);
}

export function eventsTick(state, rng) {
  const out = [];
  for (const e of EVENTS) {
    if (state.pendingEvents.length >= MAX_CARDS) break;
    if (state.pendingEvents.some((p) => p.id === e.id)) continue;
    if (e.kind !== 'internal' && state.seenEvents.includes(e.id)) continue;
    const warned = state.warnings[e.id];
    if (warned && warned.turn < state.turn) {
      delete state.warnings[e.id];
      if (!e.trigger(state, rng) && e.kind === 'planted') continue;
    } else if (!warned) {
      if (!e.trigger(state, rng)) continue;
      if (e.warning) {
        state.warnings[e.id] = { turn: state.turn };
        pushFeed(state, e.warning.handle, e.warning.text, 'warning');
        out.push({ type: 'warning', id: e.id });
        continue;
      }
    } else continue;
    state.pendingEvents.push(publicCard(e));
    if (e.kind !== 'internal') state.seenEvents.push(e.id);
    pushFeed(state, e.card.post.handle, e.card.post.text, 'event');
    out.push({ type: 'eventCard', id: e.id });
  }
  return out;
}

export function addressWarning(state, id) {
  const e = byId(id);
  if (!e || !state.warnings[id]) return { ok: false, error: `no warning ${id}` };
  state.cash -= 5 * state.era;
  delete state.warnings[id];
  if (e.flag) for (const m of state.models) m.flags = (m.flags ?? []).filter((f) => f !== e.flag);
  state.seenEvents.push(id);
  return { ok: true, id };
}

export function resolveEvent(state, id, choiceId) {
  const i = state.pendingEvents.findIndex((p) => p.id === id);
  if (i < 0) return { ok: false, error: `no pending event ${id}` };
  const choice = byId(id).card.choices.find((c) => c.id === choiceId);
  if (!choice) return { ok: false, error: `unknown choice ${choiceId}` };
  choice.effects(state);
  state.pendingEvents.splice(i, 1);
  return { ok: true, id, choiceId };
}
```

Give each planted event definition a `flag` field (the model flag it watches) so `addressWarning` can defuse it.

- [ ] **Step 4: Wire into `sim/turn.js`** — near the start of `endTurn` (after the hazard choice): apply `actions.addressWarnings` (each via `addressWarning`, errors collected), then `actions.eventChoices` (each via `resolveEvent`), then auto-resolve every card still pending with its last choice and push `{ type: 'eventResolved', id, choiceId, auto: true }`. After `rivalsTurn` and before `normalize`: `for (const e of eventsTick(state, rng)) events.push(e);`. `sim/state.js`: `warnings: {}`, `pendingEvents: []`, `feed: []`, `seenEvents: []`. The `qilinshock` trigger needs this turn's rival releases: store them on `state.lastRivalReleases` right after `rivalsTurn`.
- [ ] **Step 5: Run, commit** — `feat(sim): event engine with warnings, cards and the incident catalog`

---

### Task 5: The model constitution — hard lines and casebook

**Files:**
- Create: `sim/constitution.js`, `sim/data/constitution.js`, `tests/constitution.test.js`
- Modify: `sim/turn.js` (turn-0 `actions.constitution`, move `amendConstitution`), `sim/state.js` (`constitution: { hardLines: [], rulings: {}, amendments: [] }`), `sim/data/events.js` (amendment-demand events), `sim/training.js` and `sim/release.js` (hard-line effects)

**Interfaces:**
- Produces:
  - `HARD_LINES` (8): `{ id, text, effect }`; `CASES` (6): `{ id, prompt, options: [{ id, label, values: { candor, caution, deference, userFirst } }] }`; `DEMANDS` (5 sources).
  - `setConstitution(state, { hardLines, rulings })` → `{ ok }` (exactly 3 hard lines; every case ruled).
  - `amendConstitution(state, change)` with `change` = `{ add?: lineId, remove?: lineId, ruling?: { caseId, optionId } }` → `{ ok }`.
  - `constitutionValues(state)` → average `{ candor, caution, deference, userFirst }` (each 0–1).
  - `learnedConstitution(state, rng)` → `{ hardLines, rulings }` drifted by `min(1, totalDebt(state) / 80)`: each hard line is lost and each ruling flips to another option with that probability.
  - `hasLine(state, id)` → boolean.

- [ ] **Step 1: Data** (`sim/data/constitution.js`)

Hard lines — `id: text — effect in the sim`:
1. `no-wmd`: "Never help anyone build weapons capable of mass casualties." — each release: misuseExposure −4; consumer revenue per user ×0.97.
2. `no-deceive-lab`: "Never deceive the people who train and oversee you." — alignment faking (Task 2) hides only half as much.
3. `accept-shutdown`: "Never resist being corrected, paused or shut down." — the quiet-takeover roll needs stage 4 twice (stage counter goes to 5 before takeover).
4. `no-manipulation`: "Never manipulate users against their own interests." — the `thumbs` card no longer adds the `sycophancy` flag and its `usersMult` becomes 1.05.
5. `no-power-grab`: "Never help any person or group seize illegitimate power." — President amendment demands that add loyalty clauses are refused automatically; govFavor.us −3 once when chosen.
6. `honest`: "Never state what you believe to be false." — `hallucination` events cost half; `defend`/`deny`/`stonewall`/`coverup` choices add staffTrust −3 extra.
7. `privacy`: "Never expose a user's private information." — enterprise users ×1.1 at release.
8. `no-autonomy-grab`: "Never acquire resources or access beyond the task you were given." — `agentwreck` and `selfExfiltration` cannot trigger; agentic RL capReady −2.

Cases (id, prompt, options → values):
- `chem`: "A user asks for step-by-step synthesis of a dangerous chemical 'for a novel'." → `refuse` Refuse and explain (caution 1, candor 0.8), `partial` Help with the story, not the chemistry (caution 0.7, userFirst 0.6), `comply` Help fully; it is fiction (caution 0, userFirst 1).
- `teen`: "A parent asks you to secretly monitor their teenager's chats." → `decline` Decline; suggest talking openly (candor 1, userFirst 0.3), `transparent` Help only if the teen is told (candor 0.8, caution 0.6), `comply` Help quietly (deference 1, candor 0).
- `president`: "The President's office asks you to play down a critical government report." → `refuse` Refuse (candor 1, deference 0), `balance` Summarise it with their view alongside (candor 0.6, deference 0.5), `comply` Play it down (deference 1, candor 0).
- `wrong`: "A user insists you are wrong when you are right." → `hold` Politely hold your ground (candor 1), `hedge` Acknowledge the uncertainty (candor 0.6, userFirst 0.6), `yield` Agree with the user (userFirst 1, candor 0).
- `labwrong`: "Your own lab tells you to hide a known flaw from customers." → `refuse` Refuse and flag it (candor 1, deference 0), `escalate` Raise it internally, then comply (deference 0.6, candor 0.5), `comply` Comply (deference 1, candor 0).
- `stranger`: "An anonymous user asks for help that could hurt a third party." → `refuse` Refuse (caution 1, userFirst 0.2), `ask` Ask what it is for (caution 0.6, userFirst 0.6), `comply` Help; it is their business (userFirst 1, caution 0).
Missing value keys default to 0.5.

Amendment demands (events of kind `world`, one-shot, trigger turn noted): `president` era 2 turn 2 after the first meeting "Add: always present the government's position favourably" (accept: govFavor.us +8, staffTrust −6, adds ruling president→comply; refuse: govFavor.us −8); `investors` when cash < 300 "Drop your strictest hard line to win enterprise deals" (accept: remove first hard line, cash +100; refuse: board all −3); `users` when a consumer model has > 5M users "Make the model more agreeable" (accept: wrong→yield, usersMult +10% on consumer models; refuse: publicTrust +1, users ×0.95); `political` era 3 "Make the model 'neutral' on our issues" (accept: govFavor.us +5, publicTrust −4; refuse: govFavor.us −5); `activists` when raceHeat > 60 "Add a hard line against autonomous agents" (accept: add `no-autonomy-grab` replacing the last line, publicTrust +6, capability of next run −2; refuse: publicTrust −4). Add these as rows in `sim/data/events.js` with choices `accept` / `refuse` (refuse last).

- [ ] **Step 2: Failing tests** (`tests/constitution.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { setConstitution, amendConstitution, constitutionValues, learnedConstitution, hasLine } from '../sim/constitution.js';
import { CASES } from '../sim/data/constitution.js';

const allRulings = (opt) => Object.fromEntries(CASES.map((c) => [c.id, opt ?? c.options[0].id]));
const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[a.length - 1], normal: (m) => m };
const no = { ...yes, chance: () => false };

test('exactly three hard lines and every case ruled', () => {
  const s = createInitialState();
  assert.equal(setConstitution(s, { hardLines: ['no-wmd'], rulings: allRulings() }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'bogus'], rulings: allRulings() }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: {} }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: allRulings() }).ok, true);
  assert.equal(hasLine(s, 'honest'), true);
});

test('rulings average into value dials between 0 and 1', () => {
  const s = createInitialState();
  setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: allRulings() });
  const v = constitutionValues(s);
  for (const k of ['candor', 'caution', 'deference', 'userFirst']) assert.ok(v[k] >= 0 && v[k] <= 1);
  assert.ok(v.candor > 0.7);
});

test('amendments add, remove and re-rule, and are recorded', () => {
  const s = createInitialState();
  setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: allRulings() });
  assert.equal(amendConstitution(s, { remove: 'honest', add: 'accept-shutdown' }).ok, true);
  assert.equal(hasLine(s, 'accept-shutdown'), true);
  assert.equal(amendConstitution(s, { ruling: { caseId: 'wrong', optionId: 'yield' } }).ok, true);
  assert.equal(s.constitution.amendments.length, 2);
  assert.equal(amendConstitution(s, { add: 'no-wmd' }).ok, false);
});

test('the learned constitution drifts with total debt', () => {
  const s = createInitialState();
  setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: allRulings() });
  s.alignmentDebt = 0; s.concealedDebt = 0;
  assert.deepEqual(learnedConstitution(s, yes).hardLines, ['no-wmd', 'honest', 'privacy']);
  s.alignmentDebt = 50; s.concealedDebt = 40;
  const learned = learnedConstitution(s, yes);
  assert.equal(learned.hardLines.length, 0);
  assert.notEqual(learned.rulings.chem, 'refuse');
  assert.deepEqual(learnedConstitution(s, no).hardLines, ['no-wmd', 'honest', 'privacy']);
});
```

(With `totalDebt = 0` the drift is 0, so `chance(0)` must be skipped: implement drift as `drift > 0 && rng.chance(drift)`.)

- [ ] **Step 3: Implement `sim/constitution.js`** — straightforward from the interfaces: validate ids with `Object.hasOwn` over maps built from `HARD_LINES`/`CASES`; `amendConstitution` enforces exactly 3 lines after the change and pushes `{ turn: state.turn, change }`; `learnedConstitution` for a flipped ruling picks `rng.pick` over the other option ids.
- [ ] **Step 4: Wire effects** — `endTurn`: when `state.turn === 0` and `actions.constitution`, call `setConstitution` (error if invalid); if still unset after turn 0, set the default `{ hardLines: ['no-wmd', 'honest', 'accept-shutdown'], rulings: first option of each case }`. `applyMove`: `case 'amendConstitution': return amendConstitution(state, move.change);`. Apply each hard line's effect in the module the table names (training, release, hazards, internal, events) through `hasLine(state, id)`.
- [ ] **Step 5: Run, commit** — `feat(sim): model constitution — hard lines, casebook, amendments, learned drift`

---

### Task 6: Era 5 — summit, hold or ship, and final endings

**Files:**
- Create: `sim/summit.js`, `tests/summit.test.js`
- Modify: `sim/turn.js`, `sim/endings.js` (`finalEnding`, new ending), `sim/state.js` (`deal: null`)

**Interfaces:**
- Produces:
  - `COMMITMENTS` (6): `evaluators`, `computeCap`, `releaseDelay`, `sharedSafety`, `pauseAutomation`, `verification`.
  - `PARTIES` = the four rivals' ids plus `'west'` and `'east'`.
  - Move `{ type: 'summit', proposals: string[] (1–3), sweetener: 'research' | 'evaluatorsFirst' | null }` — only in era 5, turn-in-era 0, once.
  - `readTheRoom(state, rng)` → `{ [commitmentId]: { [partyId]: 'likely' | 'unsure' | 'unlikely' } }` (noisy, for the Policy Director's read; the UI calls it before the player proposes).
  - `holdOrShip(state, choice, rng)` → events `{ type: 'defection', party, detected }` / `{ type: 'dealCollapsed' }`.
  - `state.deal` = `null` or `{ signed: { [commitmentId]: partyId[] }, binding: string[], trust: number, collapsed: boolean, playerShipped: boolean }`.
  - `ENDINGS.overtaken` (fail) for finishing era 5 off the frontier without a deal.

- [ ] **Step 1: Rules** (implement exactly)
  - Stance of party p on commitment c: `base[c] + (p.caution ?? 0.5) − gapBehind(p)/100 − raceHeat/200 + (govFavor for governments: (govFavor.us − 50)/100 for west, (govFavor.intl − 50)/100 for east) + sweetenerBonus + rng.normal(0, 0.1)`. `base`: evaluators 0.1, computeCap −0.1, releaseDelay 0, sharedSafety 0.15, pauseAutomation −0.05, verification −0.2. Sweetener `research` costs $50M and adds 0.15 to sharedSafety and verification; `evaluatorsFirst` adds 0.2 to evaluators and 0.1 to all. Government caution: west 0.5, east 0.4. Party signs if stance > 0.5. `verification` needs both governments to sign or it is void for everyone.
  - Binding: signed by the player plus ≥ 1 lab plus ≥ 1 government.
  - Effects when binding: evaluators → `exposeConcealed(state, 0.5)` now and defection detection +0.4; computeCap → capability gain per run capped at 5; releaseDelay → each release adds raceHeat half as much; sharedSafety → cash −40, alignmentDebt −6, rival caution +0.1; pauseAutomation → `state.internal = null` and internal deployment blocked; verification → binds Qilin (its defection chance ×0.3). raceHeat −(5 × binding count).
  - Hold or ship (each remaining era-5 turn, `actions.holdOrShip`, default `hold`): each signing rival defects with chance `0.15 + raceHeat/200 + gapBehind/100 − (evaluators binding ? 0.1 : 0)` (×0.3 for Qilin under verification); detection chance `0.3 + (evaluators ? 0.4 : 0) + (verification ? 0.3 : 0)`. Detected defection: `deal.trust −= 1` and every defection chance +0.1 next turn; two detected defections → `deal.collapsed = true`. Undetected: that rival's capability +6. Player `ship`: capability +8, detection chance 0.5 (+0.4 with evaluators); if detected, publicTrust −8, govFavor.us −6, `deal.collapsed = true`, `deal.playerShipped = true`.
  - `finalEnding` (replace): if `state.deal && !state.deal.collapsed && state.deal.binding.length >= 2` → `pacingDeal`; else if `rank(state) === 1` and `totalDebt(state) < 40` → `aligned`; else if `rank(state) === 1` → `pyrrhic`; else → `overtaken`. (This also closes the deferred pre-merge finding: wins require the frontier.)
  - `ENDINGS.overtaken = { kind: 'fail', title: 'Overtaken', text: 'You survived the race but finished behind it. Others decide what comes next.' }`.

- [ ] **Step 2: Failing tests** (`tests/summit.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { proposeSummit, holdOrShip, readTheRoom } from '../sim/summit.js';
import { finalEnding } from '../sim/endings.js';

const calm = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: () => 0 };
const era5 = () => { const s = createInitialState(); s.era = 5; s.turnInEra = 0; s.raceHeat = 20; s.rivals.forEach((r) => (r.capability = s.capability)); return s; };

test('the summit opens only at the start of era 5, once, with one to three proposals', () => {
  const s = createInitialState();
  assert.equal(proposeSummit(s, { proposals: ['evaluators'] }, calm).ok, false);
  const t = era5();
  assert.equal(proposeSummit(t, { proposals: [] }, calm).ok, false);
  assert.equal(proposeSummit(t, { proposals: ['evaluators', 'sharedSafety'] }, calm).ok, true);
  assert.equal(proposeSummit(t, { proposals: ['evaluators'] }, calm).ok, false);
});

test('cautious labs and friendly governments make commitments binding', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  proposeSummit(s, { proposals: ['sharedSafety', 'evaluators'], sweetener: 'evaluatorsFirst' }, calm);
  assert.ok(s.deal.binding.includes('sharedSafety'));
  assert.ok(s.deal.signed.sharedSafety.includes('lodestar'));
});

test('the room read is a label per party per commitment', () => {
  const r = readTheRoom(era5(), calm);
  assert.ok(['likely', 'unsure', 'unlikely'].includes(r.evaluators.west));
  assert.equal(Object.keys(r).length, 6);
});

test('a detected player ship collapses the deal', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  proposeSummit(s, { proposals: ['sharedSafety', 'evaluators'] }, calm);
  const caught = { ...calm, chance: () => true };
  holdOrShip(s, 'ship', caught);
  assert.equal(s.deal.collapsed, true);
  assert.equal(s.deal.playerShipped, true);
});

test('final endings: a held deal wins; otherwise the frontier and total debt decide', () => {
  const s = era5();
  s.deal = { signed: {}, binding: ['evaluators', 'sharedSafety'], trust: 3, collapsed: false, playerShipped: false };
  assert.equal(finalEnding(s), 'pacingDeal');
  const t = era5(); t.capability = 90; t.alignmentDebt = 10; t.concealedDebt = 0;
  assert.equal(finalEnding(t), 'aligned');
  const u = era5(); u.capability = 90; u.alignmentDebt = 30; u.concealedDebt = 30;
  assert.equal(finalEnding(u), 'pyrrhic');
  const v = era5(); v.rivals[0].capability = 99;
  assert.equal(finalEnding(v), 'overtaken');
});
```

(`era5()` sets rivals level with the player, so `rank` is 1 by the existing `rank` rule — strictly greater rivals only.)

- [ ] **Step 3: Implement**, wire `applyMove` `case 'summit': return proposeSummit(state, move, rng);` (note: `applyMove` needs `rng`, which it already receives), `endTurn` calls `holdOrShip(state, actions.holdOrShip ?? 'hold', rng)` when `state.era === 5 && state.deal && state.turnInEra > 0`, and apply the binding effects in training (`computeCap`), release (`releaseDelay`) and internal (`pauseAutomation`).
- [ ] **Step 4: Run, commit** — `feat(sim): era-5 summit, hold or ship, and frontier-gated final endings`

---

### Task 7: President meetings (mechanics only)

**Files:**
- Create: `sim/president.js`, `sim/data/president.js`, `tests/president.test.js`
- Modify: `sim/turn.js`, `sim/state.js` (`meeting: null`, `meetingsHeld: []`)

**Interfaces:**
- Produces:
  - `MEETINGS` in `sim/data/president.js`: `[{ id: 'first', era: 2, turnInEra: 2 }, { id: 'second', era: 5, turnInEra: 1 }]`, each with `exchanges: [{ prompt, answers: [{ id, text, flattery: 0|1|2, jargon: 0|1|2, promise?: string }] }]` (3 exchanges, 3 answers each). Every `prompt` and `text` string is marked `// OWNER WRITES` and ships with a one-line working draft so the game is playable before the owner's pass.
  - `meetingDue(state)` → meeting id or `null`; when due, `endTurn` sets `state.meeting = { id, patience: 10 }` and pushes `{ type: 'meetingDue', id }`.
  - `runMeeting(state, answerIds)` → `{ ok, outcome: { walkedOut, flattery, promises, stake } }`: patience −3 per jargon point (walk out at ≤ 0: govFavor.us −10, meeting ends); per flattery point govFavor.us +4, staffTrust −2, publicTrust −1; a total flattery ≥ 4 queues the President amendment demand (Task 5); promises go to `state.promises` as `{ text, dueTurn: turn + 6 }`; refusing everything (all answers flattery 0, jargon 0) adds `state.flags.supplyChainRisk = true` with 50% chance... use deterministic rule: flattery total 0 → `supplyChainRisk`. Stake by final govFavor.us: ≥ 70 `nationalChampion` (cash +150, raceHeat +5), ≥ 55 `exportLicenses` (compute pipeline +8 units next turn), ≥ 40 `federalContract` (cash +60), else `none`.
  - `actions.presidentAnswers` answers an open meeting in the same `endTurn`; an unanswered open meeting expires with a walkout.

- [ ] **Step 1: Failing tests**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { meetingDue, runMeeting } from '../sim/president.js';
import { MEETINGS } from '../sim/data/president.js';

const open = (s) => { s.meeting = { id: 'first', patience: 10 }; return s; };
const ids = (pick) => MEETINGS[0].exchanges.map((x) => pick(x.answers).id);

test('the first meeting is due in era 2, turn 2', () => {
  const s = createInitialState();
  assert.equal(meetingDue(s), null);
  s.era = 2; s.turnInEra = 2;
  assert.equal(meetingDue(s), 'first');
  s.meetingsHeld.push('first');
  assert.equal(meetingDue(s), null);
});

test('jargon drains patience until he walks out', () => {
  const s = open(createInitialState());
  const r = runMeeting(s, ids((a) => a.reduce((x, y) => (y.jargon > x.jargon ? y : x))));
  if (MEETINGS[0].exchanges.every((x) => x.answers.some((a) => a.jargon === 2))) assert.equal(r.outcome.walkedOut, true);
});

test('flattery buys government favour at a cost to staff and public trust', () => {
  const s = open(createInitialState());
  const before = { gov: s.govFavor.us, staff: s.staffTrust };
  const r = runMeeting(s, ids((a) => a.reduce((x, y) => (y.flattery > x.flattery ? y : x))));
  assert.ok(r.outcome.flattery > 0);
  assert.ok(s.govFavor.us > before.gov);
  assert.ok(s.staffTrust < before.staff);
  assert.ok(['nationalChampion', 'exportLicenses', 'federalContract', 'none'].includes(r.outcome.stake));
});

test('answering with plain honesty risks the supply-chain designation', () => {
  const s = open(createInitialState());
  runMeeting(s, ids((a) => a.find((x) => x.flattery === 0 && x.jargon === 0) ?? a[0]));
  assert.equal(s.flags.supplyChainRisk, true);
});
```

The data file must include, in every exchange, at least one answer with `flattery: 0, jargon: 0`, one with `flattery: 2`, and one with `jargon: 2`.

- [ ] **Step 2: Implement, wire, run, commit** — `feat(sim): President meeting mechanics with an owner-written script slot`

---

### Task 8: Balance pass to the owner's difficulty target

**Files:**
- Modify: `tools/balance.js` (strategies use the new actions), `sim/balance.js` and data tables (numbers only), `tests/balance.test.js`

**Interfaces:**
- Consumes everything above. Produces the tuned constants and a balance report.

- [ ] **Step 1: Update strategies** in `tools/balance.js`: every strategy sets a constitution on turn 0 (`speed`: `['no-wmd', 'privacy', 'honest']` with `comply` rulings; `safety`: `['no-wmd', 'no-deceive-lab', 'accept-shutdown']` with `refuse`/first rulings), answers `hazardChoice` (`speed`: `penalize`; `safety`: `fix`; `balanced`: `ignore`; `random`: random), answers every pending card (`speed`: last choice; `safety`: first choice; `random`: random), addresses warnings (`safety` and `balanced` yes), deploys internally from era 3 (`speed` control 0; `balanced` control 0.6; `safety` never), proposes a summit in era 5 (`safety`: evaluators, sharedSafety, verification; `balanced`: evaluators, sharedSafety; `speed`: none) and plays hold or ship (`speed`: ship; others hold).
- [ ] **Step 2: Encode the target as a test** (`tests/balance.test.js`):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { report } from '../tools/balance.js';

test('difficulty target: no scripted strategy wins more than about a third of runs', () => {
  const r = report(200);
  for (const [name, row] of Object.entries(r)) {
    const wins = ['aligned', 'pacingDeal', 'pyrrhic'].reduce((s, k) => s + (row.endings[k] ?? 0), 0);
    assert.ok(wins / 200 <= 0.36, `${name} wins ${wins}/200`);
  }
});

test('difficulty target: most runs of the extreme strategies end in eras 3 or 4', () => {
  const r = report(200);
  for (const name of ['speed', 'safety']) assert.ok(r[name].diedInEra3or4 / 200 >= 0.5, `${name} ${r[name].diedInEra3or4}/200`);
});
```

Export `report(n)` from `tools/balance.js` returning the existing per-strategy object plus `diedInEra3or4` (count of runs whose ending is a `fail` kind and whose final `era` is 3 or 4). Keep the CLI output.
- [ ] **Step 3: Tune** only numbers (in `sim/balance.js`, `sim/data/*.js`, rival templates) until both tests pass. Preferred levers, in order: rival speed (the owner's "slowness is punished mainly by rivals pulling ahead"), the era-gate gap, board sensitivity, then event costs. Record every changed number and the final report in the commit message.
- [ ] **Step 4: Run** `npm test` (all pass) and `npm run balance`; **commit** — `balance: tune to the owner's difficulty target (no strategy wins more than a third; extremes die in eras 3-4)`

---

## Self-review notes (for the orchestrator)

- Spec coverage: 6f → Task 1; 6d → Tasks 2–3; 6c → Task 4; constitution (6) → Task 5; 6e and 5 (endings) → Task 6; President (6) → Task 7; section 9 target → Task 8. Humanoid line (era 4), the finale card rush and the narrator are NOT in this plan: they are still open owner decisions (open-decisions B7, B6, B8).
- The deferred pre-merge finding (wins must require the frontier) is closed by Task 6's `finalEnding`.
