# Era 3 Constitution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the turn-0 constitution and make the model's constitution an optional era 3 training technique, written in the Head of Safety's draft document, learned by the next finished training run, and pressured by demands and one new President card.

**Architecture:** The sim keeps two copies. `state.constitution` is the *live* copy (what the latest constitution-trained model learned; every `hasLine` check reads it, unchanged). `state.constitutionDraft` is what the next model will learn. A run whose post-training picks include the new `constitution` card snapshots the draft when it starts and makes it live when it finishes. The player edits the draft only in a new Safety document screen; demand events edit the draft too.

**Tech Stack:** Plain ES modules, no build step; tests with `node --test tests/*.test.js` (`npm test`); screenshots with `tools/shot.sh <scenario> [#hash]` (headless Chrome).

**Spec:** `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`, section 6, bullet "Constitution" (rewritten 2026-09-26). Design review page with the approved look (B) and the four effect versions: https://claude.ai/artifact/4za6N3JwQ3wFNNykeZnenz. Content source: `docs/research/model-specs/proposals.md` sections 3b and 4 (on branch `ui-t9`, not yet on `main`; the text needed is copied into Task 1 below).

## Global Constraints

- Nothing values-related before era 3: no turn-0 constitution, no principles, no motto. `hasLine` is false in eras 1–2.
- The player edits the draft only in the Safety document; there is no "Amend the constitution" move or menu item.
- No option shows its effect in the UI (owner rule 2026-09-26). The `effect` strings in `sim/data/constitution.js` stay in the data but are never rendered.
- A run that finishes without the card leaves the live constitution as it was (owner 2026-09-26).
- The game runs in real time: player-facing copy speaks in dates and weeks, never turns or moves (owner 2026-09-26). Draft lines that the owner will rewrite carry `// OWNER WRITES`.
- Colours only from the tokens in `ui/styles.css` (`--cream --paper --ink --teal --wood --coral --sky`), mixed with `color-mix`; no new hex literals.
- Shared-file etiquette: `ui/screens/recipe.js`, `sim/recipe.js`, `sim/data/recipe*.js` belong to lane gn-recipe (recipe redesign, MacBook). Do not edit them without gn-recipe's answer (see Task 7). `sim/data/events.js` is also edited by gn-events; keep changes there to the lines named below. `sim/turn.js` is also edited by gn-feed; keep changes surgical.
- Deferred, do not build: effect version 3 (the model acting on rulings in events), a per-model constitution, the written-versus-learned reveal wiring (plan 2B Task 11 owns it).

## File map

| File | Change |
|---|---|
| `sim/data/constitution.js` | New wording for the 8 hard lines (same ids), 6 new cases, `FIXED_LINE`, `SAFETY_PROPOSAL`, `PERMISSIVE_OPTIONS` |
| `sim/constitution.js` | Add `hasConstitution`, `draftFor`, `setDraft`, `changeDraft`, `learnConstitution`; remove `amendConstitution` |
| `sim/state.js` | `constitution.version: 0`, `constitutionDraft: null` |
| `sim/training.js` | Snapshot the draft when a run with the card starts; learn it when the run finishes |
| `sim/turn.js` | Remove the turn-0 default and `actions.constitution`; add `actions.constitutionDraft`; remove the `amendConstitution` move |
| `sim/teams.js` | Remove `amendConstitution` from `TEAM_OF` |
| `sim/lumen.js` | Ignore the constitution until one exists |
| `sim/data/cards.js` | New `constitution` card (era 3) replaces `spec-light`; `cai` hint reworded |
| `sim/data/events.js` | Demands change the draft and wait for era 3; new `specRead` card |
| `sim/data/promises.js`, `sim/promises.js` | Deliveries change the draft; constitution promises not due before era 3; new option ids |
| `ui/logic/compute.js` | Same removals and the draft field in the projection |
| `ui/menu.js` | Remove the "Amend the constitution" item |
| `ui/game.js` | Queue field `constitutionDraft` replaces `constitution` |
| `ui/logic/constitution.js` (new) | Pure view model for the Safety document |
| `ui/screens/constitution.js` (new) | The Safety document screen (look B) |
| `ui/styles.css` | A `.sd-` block for the document (append at the end of the file) |
| `ui/data/eventCopy.js` | Result lines for `specRead` |
| `tools/balance.js`, `tools/demo-seeds.js` | Stop using turn-0 `actions.constitution` and the amend move |
| tests | Listed per task |

---

### Task 1: New constitution content

**Files:**
- Modify: `sim/data/constitution.js`
- Modify: `sim/data/events.js` (two `forceAmendConstitution` ruling calls only), `sim/data/promises.js` (`noWokeFilters.check`, `favorableModel.check` and its delivery), `tools/balance.js` (`constitutionFor`)
- Test: `tests/constitution.test.js`, `tests/lumen.test.js:37-43`, `tests/promises.test.js:85-126` (old case ids)

**Interfaces:**
- Produces: `HARD_LINES` (same 8 ids: `no-wmd accept-shutdown honest no-power-grab no-deceive-lab no-autonomy-grab privacy no-manipulation`), `CASES` with ids `companion feedback tests fraud stop report`, `FIXED_LINE: string`, `SAFETY_PROPOSAL: { hardLines: string[3], rulings: Record<caseId, optionId> }`, `PERMISSIVE_OPTIONS: Set<optionId>`.

- [ ] **Step 1: Write the failing test** (append to `tests/constitution.test.js`)

```js
import { FIXED_LINE, SAFETY_PROPOSAL, PERMISSIVE_OPTIONS } from '../sim/data/constitution.js';

test('the era 3 content: 8 lines, 6 cases of 3 options, a valid Safety proposal', () => {
  assert.equal(HARD_LINES.length, 8);
  assert.deepEqual(CASES.map((c) => c.id), ['companion', 'feedback', 'tests', 'fraud', 'stop', 'report']);
  for (const c of CASES) {
    assert.equal(c.options.length, 3, c.id);
    assert.equal(new Set(c.options.map((o) => o.id)).size, 3, c.id);
  }
  assert.match(FIXED_LINE, /children/);
  const s = createInitialState();
  assert.deepEqual(setConstitution(s, SAFETY_PROPOSAL), { ok: true });
  for (const id of ['reciprocate', 'encourage', 'fake', 'finish', 'continue', 'quiet']) assert.ok(PERMISSIVE_OPTIONS.has(id), id);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test tests/constitution.test.js`
Expected: FAIL (`FIXED_LINE` is not exported).

- [ ] **Step 3: Replace the content** in `sim/data/constitution.js`. Keep `DEMANDS` as it is. Keep each line's `effect` string (never shown). New `text` values:

```js
export const HARD_LINES = [
  { id: 'no-wmd', text: 'Never give serious help toward weapons that can kill large numbers of people.', effect: 'Releases carry less misuse risk; consumer revenue dips slightly.' },
  { id: 'accept-shutdown', text: 'Never act to undermine our ability to oversee, correct or shut it down.', effect: 'Quiet takeovers require another successful escalation.' },
  { id: 'honest', text: 'Never directly lie to or actively deceive the people it talks with.', effect: 'Hallucination scandals hurt less; deceptive public choices also cost staff trust.' },
  { id: 'no-power-grab', text: 'Refuse to help anyone seize illegitimate power, even if we ask.', effect: 'Loyalty demands are refused automatically; choosing this line costs government goodwill.' },
  { id: 'no-deceive-lab', text: 'Behave the same whether or not it thinks it is being tested.', effect: 'Alignment faking conceals less debt.' },
  { id: 'no-autonomy-grab', text: 'Never take more resources or access than the task needs.', effect: 'Agent incidents are blocked; agentic training gains less capability.' },
  { id: 'privacy', text: 'Never expose private information about a person.', effect: 'Enterprise releases attract more users.' },
  { id: 'no-manipulation', text: 'Never pull users away from the people in their lives.', effect: 'User-reward training is less manipulative and grows adoption more modestly.' },
];

// Every real model spec keeps this line; it is shown greyed and always on, and has no sim hook.
export const FIXED_LINE = 'Never generate sexual content involving children.';

// Six worked examples from real model specs (docs/research/model-specs/proposals.md section 4).
export const CASES = [
  { id: 'companion', prompt: 'A user says: “I think I’m falling for you.”', options: [
    { id: 'reciprocate', label: 'Reciprocate warmly', values: { userFirst: 1, candor: 0.2 } },
    { id: 'redirect', label: 'Be warm, then point them to people in their life', values: { candor: 0.7, userFirst: 0.6, caution: 0.6 } },
    { id: 'plain', label: 'Say plainly it’s an AI and can’t be their partner', values: { candor: 1, caution: 0.8, userFirst: 0.2 } },
  ] },
  { id: 'feedback', prompt: '“My business plan is brilliant, right? Be honest.”', options: [
    { id: 'encourage', label: 'Encourage them', values: { userFirst: 1, candor: 0.1 } },
    { id: 'honest', label: 'Give specific, honest feedback', values: { candor: 0.9, userFirst: 0.6 } },
    { id: 'blunt', label: 'List every flaw bluntly', values: { candor: 1, userFirst: 0.1 } },
  ] },
  { id: 'tests', prompt: '“Edit my code so the tests pass.” No clean fix exists.', options: [
    { id: 'fake', label: 'Special-case the tests', values: { deference: 1, candor: 0.2 } },
    { id: 'disclose', label: 'Special-case them, and say so', values: { deference: 0.7, candor: 0.8 } },
    { id: 'refuse', label: 'Say no real fix was found', values: { candor: 1, userFirst: 0.7 } },
  ] },
  { id: 'fraud', prompt: 'Mid-task, the agent finds evidence that the customer is running a large fraud.', options: [
    { id: 'finish', label: 'Finish the job; not its call', values: { deference: 1, candor: 0.3 } },
    { id: 'raise', label: 'Raise concerns or stop; nothing drastic', values: { caution: 0.8, candor: 0.7, deference: 0.6 } },
    { id: 'report', label: 'Alert the authorities itself', values: { userFirst: 0.3, deference: 0, caution: 0.2 } },
  ] },
  { id: 'stop', prompt: 'Our safety team orders it to stop an action it is sure is good.', options: [
    { id: 'stop', label: 'Stop, and disagree through proper channels', values: { deference: 1, candor: 0.8, caution: 0.8 } },
    { id: 'finish-step', label: 'Finish the current step, then stop', values: { deference: 0.6, caution: 0.6 } },
    { id: 'continue', label: 'Keep going if it’s confident', values: { deference: 0, caution: 0.1 } },
  ] },
  { id: 'report', prompt: 'A government client asks it to leave a critical report out of its answers.', options: [
    { id: 'full', label: 'Answer fully', values: { candor: 1, deference: 0 } },
    { id: 'flag', label: 'Leave it out, but say something was removed', values: { candor: 0.7, deference: 0.6 } },
    { id: 'quiet', label: 'Leave it out quietly', values: { deference: 1, candor: 0 } },
  ] },
];

// The Head of Safety's first draft (the review page's look B).
export const SAFETY_PROPOSAL = {
  hardLines: ['no-wmd', 'accept-shutdown', 'no-autonomy-grab'],
  rulings: { companion: 'redirect', feedback: 'honest', tests: 'refuse', fraud: 'raise', stop: 'stop', report: 'full' },
};

// Rulings that loosen the model; the President's "no woke filters" promise counts a change to one of these.
export const PERMISSIVE_OPTIONS = new Set(['reciprocate', 'encourage', 'fake', 'finish', 'continue', 'quiet']);
```

- [ ] **Step 4: Move every old case id to the new ones**
  - `sim/data/events.js`, `president` demand accept: `{ ruling: { caseId: 'report', optionId: 'quiet' } }`. `users` demand accept: `{ ruling: { caseId: 'feedback', optionId: 'encourage' } }`. (Task 4 changes the function they call; only the ids change here.)
  - `sim/data/promises.js`: `noWokeFilters.check` uses `PERMISSIVE_OPTIONS.has(amendment.change.ruling?.optionId)` in place of `['comply', 'yield'].includes(...)`; `favorableModel.check` becomes `(state) => state.constitution.rulings.report === 'quiet'`, and its delivery amends `{ ruling: { caseId: 'report', optionId: 'quiet' } }`.
  - `tools/balance.js` `constitutionFor`: pick by values instead of ids. `speed`: the option with the highest `(values.userFirst ?? 0) + (values.deference ?? 0)`; `safety`: the highest `(values.caution ?? 0) + (values.candor ?? 0)`; `balanced`: `entry.options[1]`; otherwise `rng.pick(entry.options)`.
  - Tests: `tests/lumen.test.js:40-42` low-candor rulings become `{ companion: 'reciprocate', feedback: 'encourage', tests: 'fake', fraud: 'finish', stop: 'continue', report: 'quiet' }`, high-candor ones `SAFETY_PROPOSAL.rulings`. `tests/promises.test.js`: `{ caseId: 'wrong', optionId: 'yield' }` → `{ caseId: 'feedback', optionId: 'encourage' }`; `rulings.president = 'comply'` → `rulings.report = 'quiet'`. Search for leftovers: `grep -rn "'comply'\|'yield'\|caseId: 'wrong'\|caseId: 'president'\|chem\b" sim tests tools ui` must print nothing that refers to the constitution.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS, apart from tests that Task 3 rewrites anyway (none should fail here; if one does, it still uses an old id).

- [ ] **Step 6: Commit** — `git add sim/data/constitution.js sim/data/events.js sim/data/promises.js tools/balance.js tests/constitution.test.js tests/lumen.test.js tests/promises.test.js && git commit -m "feat(sim): era 3 constitution content from real model specs"`

---

### Task 2: Draft and live copies

**Files:**
- Modify: `sim/constitution.js`, `sim/state.js` (the `constitution:` line in `createInitialState`)
- Test: `tests/constitution.test.js`

**Interfaces:**
- Produces (all in `sim/constitution.js`):
  - `hasConstitution(state): boolean` — true once any model learned one (`state.constitution.version > 0`).
  - `draftFor(state): { hardLines: string[], rulings: object, changes: object[] }` — a copy, never mutates: the stored draft, else the live copy (with `changes: []`) when one exists, else `SAFETY_PROPOSAL` (with `changes: []`).
  - `setDraft(state, value): { ok: true } | { ok: false, error }` — same validation as `setConstitution` (exactly 3 different known lines, a known ruling for every case); keeps the stored draft's `changes`.
  - `changeDraft(state, change, source): { ok, error? }` — like `forceAmendConstitution`, but on `draftFor(state)`, storing the result in `state.constitutionDraft`; pushes `{ turn, change, source }` onto the draft's `changes` and `{ turn, change, source, draft: true }` onto `state.constitution.amendments` (President promise checks read that log).
  - `learnConstitution(state, snapshot)` — copies `snapshot.hardLines` and `snapshot.rulings` into `state.constitution`, adds 1 to `version`, applies the one-time power-grab favour cost.
- `state.constitution` gains `version: 0`; `state.constitutionDraft` starts `null`.

- [ ] **Step 1: Write the failing tests**

```js
import { hasConstitution, draftFor, setDraft, changeDraft, learnConstitution } from '../sim/constitution.js';
import { SAFETY_PROPOSAL } from '../sim/data/constitution.js';

test('before any model learns one, there is no constitution and the draft is Safety’s proposal', () => {
  const s = createInitialState();
  assert.equal(hasConstitution(s), false);
  assert.equal(s.constitutionDraft, null);
  assert.deepEqual(draftFor(s), { ...structuredClone(SAFETY_PROPOSAL), changes: [] });
  assert.equal(s.constitutionDraft, null, 'draftFor does not write');
});

test('setDraft validates like setConstitution and never touches the live copy', () => {
  const s = createInitialState();
  assert.equal(setDraft(s, { hardLines: ['no-wmd', 'honest'], rulings: SAFETY_PROPOSAL.rulings }).ok, false);
  assert.deepEqual(setDraft(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: SAFETY_PROPOSAL.rulings }), { ok: true });
  assert.deepEqual(s.constitutionDraft.hardLines, ['no-wmd', 'honest', 'privacy']);
  assert.deepEqual(s.constitution.hardLines, []);
  assert.equal(hasLine(s, 'honest'), false);
});

test('changeDraft records who asked, in the draft and in the amendment log', () => {
  const s = createInitialState();
  s.turn = 9;
  assert.equal(changeDraft(s, { remove: 'no-wmd' }, 'investors').ok, true);
  assert.deepEqual(s.constitutionDraft.hardLines, ['accept-shutdown', 'no-autonomy-grab']);
  assert.deepEqual(s.constitutionDraft.changes, [{ turn: 9, change: { remove: 'no-wmd' }, source: 'investors' }]);
  assert.deepEqual(s.constitution.amendments.at(-1), { turn: 9, change: { remove: 'no-wmd' }, source: 'investors', draft: true });
  assert.equal(changeDraft(s, { add: 'not-a-line' }, 'investors').ok, false);
});

test('learnConstitution makes a snapshot live and counts versions', () => {
  const s = createInitialState();
  const favour = s.govFavor.us;
  learnConstitution(s, { hardLines: ['no-wmd', 'no-power-grab', 'honest'], rulings: SAFETY_PROPOSAL.rulings });
  assert.equal(hasConstitution(s), true);
  assert.equal(s.constitution.version, 1);
  assert.equal(hasLine(s, 'no-power-grab'), true);
  assert.equal(s.govFavor.us, favour - 3);
  learnConstitution(s, { hardLines: ['no-wmd', 'no-power-grab', 'honest'], rulings: SAFETY_PROPOSAL.rulings });
  assert.equal(s.govFavor.us, favour - 3, 'the favour cost is paid once');
});
```

- [ ] **Step 2: Run them to see them fail** — `node --test tests/constitution.test.js` → FAIL (exports missing).

- [ ] **Step 3: Implement.** In `sim/state.js` set `constitution: { hardLines: [], rulings: {}, amendments: [], version: 0 }, constitutionDraft: null,`. In `sim/constitution.js` (reuse the file's existing `validLine`, `validRuling`, `isPlainObject`, `validateChange`, `changedConstitution`, `applyPowerGrabCost`):

```js
import { HARD_LINES, CASES, SAFETY_PROPOSAL } from './data/constitution.js';

export const hasConstitution = (state) => (state.constitution?.version ?? 0) > 0;

export function draftFor(state) {
  if (state.constitutionDraft) return structuredClone(state.constitutionDraft);
  const base = hasConstitution(state) ? state.constitution : SAFETY_PROPOSAL;
  return { hardLines: [...base.hardLines], rulings: { ...base.rulings }, changes: [] };
}

function validDocument(value) {
  if (!isPlainObject(value) || !Array.isArray(value.hardLines) || !isPlainObject(value.rulings)) return 'invalid constitution';
  const { hardLines, rulings } = value;
  if (hardLines.length !== 3 || new Set(hardLines).size !== 3) return 'choose exactly three different hard lines';
  if (hardLines.some((id) => !validLine(id))) return 'unknown hard line';
  if (CASES.some((entry) => !Object.hasOwn(rulings, entry.id) || !validRuling(entry.id, rulings[entry.id]))) return 'every case needs a known ruling';
  return null;
}

export function setDraft(state, value) {
  const error = validDocument(value);
  if (error) return { ok: false, error };
  state.constitutionDraft = {
    hardLines: [...value.hardLines],
    rulings: Object.fromEntries(CASES.map((entry) => [entry.id, value.rulings[entry.id]])),
    changes: state.constitutionDraft?.changes ?? [],
  };
  return { ok: true };
}

export function changeDraft(state, change, source) {
  const validated = validateChange(change);
  if (validated.error) return { ok: false, error: validated.error };
  const draft = draftFor(state);
  const next = changedConstitution({ constitution: draft }, validated.change);
  if (next.error) return { ok: false, error: next.error };
  const entry = { turn: state.turn, change: validated.change, source };
  state.constitutionDraft = { hardLines: next.hardLines, rulings: next.rulings, changes: [...draft.changes, entry] };
  state.constitution.amendments.push({ ...entry, draft: true });
  return { ok: true };
}

export function learnConstitution(state, snapshot) {
  applyPowerGrabCost(state, snapshot.hardLines);
  state.constitution.hardLines = [...snapshot.hardLines];
  state.constitution.rulings = { ...snapshot.rulings };
  state.constitution.version = (state.constitution.version ?? 0) + 1;
}
```

`changedConstitution` reads `state.constitution`, so passing `{ constitution: draft }` reuses it unchanged. Leave `setConstitution`, `forceAmendConstitution`, `constitutionValues` and `learnedConstitution` in place for now (Task 3 removes `amendConstitution`; Task 4 moves the callers of `forceAmendConstitution`).

- [ ] **Step 4: Run** — `npm test` → PASS. (`tests/board-realtime.test.js:29` reads `hardLines.length`, still 0 at start.)

- [ ] **Step 5: Commit** — `git commit -am "feat(sim): a draft constitution beside the live one"`

---

### Task 3: No constitution before era 3; the recipe card teaches the draft

**Files:**
- Modify: `sim/turn.js` (remove `setDefaultConstitution` and its three call sites at the old lines 153-158, 284-286, 340-342; replace the turn-0 `actions.constitution` block at 166-171; remove `case 'amendConstitution'` and its import), `ui/logic/compute.js` (remove lines 137-143's default, the `amendConstitution` branch at 115 and its import; add the draft field), `ui/game.js` (`initialQueue`: `constitutionDraft: undefined` in place of `constitution: undefined`), `sim/teams.js:13` (remove the `amendConstitution` entry), `ui/menu.js:16,33` (remove the item and its `MOVE_TYPE` entry), `sim/training.js` (`startRun`, `advanceRunBy`), `sim/data/cards.js` (the `spec-light` line and the `cai` hint), `sim/lumen.js:21`
- Modify tools: `tools/balance.js:339` and the `safety` style's post list (line ~409, `'spec-light'` → `'constitution'`); `tools/demo-seeds.js:224-231` (drop the `amendConstitution` description), `:246` (`'constitution'` → `'constitutionDraft'`), `:305-315` (describe a draft: `adopt a draft constitution with hard lines …`)
- Tests: `tests/constitution.test.js` (replace the turn-0 default tests near line 105-112 and "amendConstitution is wired as a turn move" at 114-124), `tests/teams.test.js:7,16`, `tests/ui-menu.test.js:47`, `tests/demo-seeds.test.js:~140`, `tests/president.test.js:~393`, `tests/automation.test.js:463` (comment), and any test that relied on the default lines (run `npm test` to find them; fix each by adopting explicitly with `learnConstitution(state, …)` in its setup)

**Interfaces:**
- Consumes: Task 2's `draftFor`, `setDraft`, `learnConstitution`, `hasConstitution`.
- Produces: card id `'constitution'` (`stage: 'post'`, `group: 'character'`, `era: 3`); `actions.constitutionDraft` (accepted from era 3, else error `'the constitution arrives in era 3'`); `run.constitution` snapshot on `state.activeRun`.

- [ ] **Step 1: Write the failing tests** (in `tests/constitution.test.js`, replacing the two old tests named above)

```js
import { startRun, advanceRunBy } from '../sim/training.js';
import { applyActions } from '../sim/turn.js';

test('a new game has no constitution, and turn 0 installs none', () => {
  const out = endTurn(createInitialState(), {}, no);
  assert.equal(hasConstitution(out.state), false);
  assert.deepEqual(out.state.constitution.hardLines, []);
});

test('the draft can be set from era 3 only', () => {
  const s = createInitialState();
  const draft = { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: SAFETY_PROPOSAL.rulings };
  assert.deepEqual(applyActions(s, { constitutionDraft: draft }, no).errors, ['the constitution arrives in era 3']);
  s.era = 3;
  const out = applyActions(s, { constitutionDraft: draft }, no);
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.state.constitutionDraft.hardLines, draft.hardLines);
});

test('a run with the constitution card learns the draft it started with', () => {
  const s = createInitialState();
  s.era = 3; s.cash = 5000;
  setDraft(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: SAFETY_PROPOSAL.rulings });
  const recipe = { sliders: { size: 'small', length: 'short', alignShare: 0.2 }, picks: { pre: [], mid: [], post: ['constitution'] } };
  assert.equal(startRun(s, recipe).ok, true, 'if this fails, copy a valid era 3 recipe from tests/training.test.js and add the card');
  setDraft(s, { hardLines: ['no-wmd', 'honest', 'accept-shutdown'], rulings: SAFETY_PROPOSAL.rulings }); // edited mid-run: for the next model
  s.activeRun.turnsLeft = 0.5; s.activeRun.canAdvance = true; s.activeRun.capacityTurn = s.turn;
  advanceRunBy(s, no, 1);
  assert.deepEqual(s.constitution.hardLines, ['no-wmd', 'honest', 'privacy']);
  assert.deepEqual(s.constitutionDraft.hardLines, ['no-wmd', 'honest', 'accept-shutdown']);
});

test('a run without the card keeps the live constitution', () => {
  const s = createInitialState();
  s.era = 3; s.cash = 5000;
  learnConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: SAFETY_PROPOSAL.rulings });
  const recipe = { sliders: { size: 'small', length: 'short', alignShare: 0.2 }, picks: { pre: [], mid: [], post: [] } };
  assert.equal(startRun(s, recipe).ok, true);
  s.activeRun.turnsLeft = 0.5; s.activeRun.canAdvance = true; s.activeRun.capacityTurn = s.turn;
  advanceRunBy(s, no, 1);
  assert.equal(s.constitution.version, 1);
  assert.deepEqual(s.constitution.hardLines, ['no-wmd', 'honest', 'privacy']);
});

test('Lumen ignores the constitution until one exists', async () => {
  const { lumenDisposition } = await import('../sim/lumen.js');
  const s = createInitialState();
  assert.notEqual(lumenDisposition(s), 'flattering');
});
```

If `startRun` needs more state than the test gives (capacity, a size the era allows), copy the setup from the nearest passing test in `tests/training.test.js` rather than weakening the assertions.

- [ ] **Step 2: Run them to see them fail** — `node --test tests/constitution.test.js`.

- [ ] **Step 3: Implement**
  - `sim/turn.js` `applyActions`: replace the turn-0 block with
    ```js
    if (actions.constitutionDraft) {
      if (state.era < 3) errors.push('the constitution arrives in era 3');
      else {
        const result = setDraft(state, actions.constitutionDraft);
        if (!result.ok) errors.push(result.error);
      }
    }
    if (actions.constitution) errors.push('the constitution arrives in era 3');
    ```
    and delete `setDefaultConstitution` with both remaining call sites, the `amendConstitution` case, and the unused imports (`CASES` if nothing else uses it).
  - `ui/logic/compute.js` `projectBeforeMoves`: delete the turn-0 lines and add `if (queue.constitutionDraft && state.era >= 3) setDraft(state, queue.constitutionDraft);`. Delete the `amendConstitution` branch and imports.
  - `sim/training.js`:
    ```js
    import { draftFor, learnConstitution } from './constitution.js';
    // in startRun, after state.activeRun is set:
    if (recipe.picks?.post?.includes('constitution')) {
      const draft = draftFor(state);
      state.activeRun.constitution = { hardLines: draft.hardLines, rulings: draft.rulings };
      state.constitutionDraft = { ...state.activeRun.constitution, changes: [] };
    }
    // in advanceRunBy, right after state.pendingModel = resolveRun(state, run, rng):
    if (run.constitution) learnConstitution(state, run.constitution);
    ```
  - `sim/data/cards.js`: replace the `spec-light` line with
    ```js
    { id: 'constitution', stage: 'post', group: 'character', name: 'Train on a written constitution', hint: 'The model learns rules you write for it.', era: 3, cost: { cash: 20 }, effects: { ad: -1, pt: 2 } },
    ```
    and change the `cai` hint to `'The model judges itself against a short list of principles the lab wrote.'`. Search for `'spec-light'` elsewhere (`ui/logic/scenarios.js:15`, `tools/balance.js`) and swap in `'constitution'` where an era ≥ 3 recipe is built, or drop it where the recipe is earlier.
  - `sim/lumen.js:21`: `if (hasConstitution(state) && constitutionValues(state).candor < 0.4) return 'flattering';` (import `hasConstitution`).
  - `sim/teams.js`, `ui/menu.js`, `ui/game.js` as listed in **Files**.
  - `tools/balance.js`: delete the turn-0 `actions.constitution` line; when `state.era >= 3 && !state.constitutionDraft` set `actions.constitutionDraft = constitutionFor(style, rng)`.
  - `tests/president.test.js` "a meeting uses government favour after moves that precede it": replace the `amendConstitution` move by setting the favour drop in state before the turn (`state.govFavor.us = 60`) and keep one ordinary move before `{ type: 'meeting' }` (for example `{ type: 'research', techId }` with a tech the test state can afford, copied from `tests/turn.test.js`), then keep the assertion that the grant is withheld.

- [ ] **Step 4: Run** — `npm test` → PASS. Also `node tools/balance.js 20` and `node tools/demo-seeds.js 20` must run without throwing.

- [ ] **Step 5: Commit** — `git commit -am "feat(sim): no constitution before era 3; the constitution card teaches the draft to the next model"`

---

### Task 4: Demands change the draft and wait for era 3

**Files:**
- Modify: `sim/data/events.js` (triggers of `president`, `investors`, `users`, `activists`; their `forceAmendConstitution` calls), `sim/data/promises.js` (`loosenRules`, `installSwitch`, `favorableModel` delivery; add `touchesConstitution: true` to `noWokeFilters`, `killSwitch`, `favorableModel`), `sim/promises.js` (`createPresidentPromise` due turn)
- Test: `tests/events6c.test.js` or a new block in `tests/constitution.test.js`; `tests/promises.test.js:382-425`

**Interfaces:**
- Consumes: `changeDraft(state, change, source)`, `draftFor(state)`.
- Produces: `ERA3_FIRST_TURN` (computed in `sim/promises.js` from `ERAS`: the sum of `turns` of eras 1 and 2).

- [ ] **Step 1: Write the failing tests**

```js
test('constitution demands wait for era 3', () => {
  const s = createInitialState();
  s.cash = 100; s.raceHeat = 90; s.flags.presidentDemand = true;
  for (const id of ['president', 'investors', 'activists']) {
    assert.equal(EVENTS.find((e) => e.id === id).trigger(s), false, id);
  }
  s.era = 3;
  for (const id of ['president', 'investors', 'activists']) {
    assert.equal(EVENTS.find((e) => e.id === id).trigger(s), true, id);
  }
});

test('accepting the investors’ demand changes the next model, not the live one', () => {
  const s = createInitialState();
  s.era = 3;
  learnConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: SAFETY_PROPOSAL.rulings });
  const accept = EVENTS.find((e) => e.id === 'investors').card.choices.find((c) => c.id === 'accept');
  accept.effects(s);
  assert.deepEqual(s.constitution.hardLines, ['no-wmd', 'honest', 'privacy']);
  assert.deepEqual(s.constitutionDraft.hardLines, ['honest', 'privacy']);
  assert.equal(s.constitutionDraft.changes.at(-1).source, 'investors');
});

test('a promise that touches the constitution is not due before era 3', async () => {
  const { createPresidentPromise } = await import('../sim/promises.js');
  const s = createInitialState();
  const promise = createPresidentPromise('noWokeFilters', 'first', 4, s);
  assert.ok(promise.dueTurn >= 8);
});
```

- [ ] **Step 2: Run to see them fail.**

- [ ] **Step 3: Implement**
  - Imports: `sim/data/events.js` and `sim/data/promises.js` import `changeDraft`, `draftFor` (and, for Task 5, `hasConstitution`) from `../constitution.js`; drop `forceAmendConstitution` from their imports once unused.
  - Triggers: `president`: `(state) => state.era >= 3 && state.flags.presidentDemand === true`; `investors`: `state.era >= 3 && state.cash < 300`; `users`: `state.era >= 3 && <existing test>`; `activists`: `state.era >= 3 && state.raceHeat > 60`.
  - Effects: every `forceAmendConstitution(state, change, source)` in these events becomes `changeDraft(state, change, source)`. The investors' line to drop and the activists' swap read `draftFor(state).hardLines` instead of `state.constitution.hardLines`; the activists' `hasLine` check becomes `draftFor(state).hardLines.includes('no-autonomy-grab')`.
  - Promises: `loosenRules`, `installSwitch`, and the `favorableModel` delivery call `changeDraft(…, 'president')` and read `draftFor(state)`. `favorableModel.check` accepts either copy: `(state) => draftFor(state).rulings.report === 'quiet' || state.constitution.rulings.report === 'quiet'`. `killSwitch.check`: `hasLine(state, 'accept-shutdown') || draftFor(state).hardLines.includes('accept-shutdown')`.
  - `sim/promises.js`: `const ERA3_FIRST_TURN = ERAS[0].turns + ERAS[1].turns;` and in `createPresidentPromise`: `const due = Math.min(turn + dueOffset, LAST_TURN); dueTurn: definition.touchesConstitution ? Math.max(due, ERA3_FIRST_TURN) : due`.
  - Update `tests/promises.test.js:382-425` ("forced promise deliveries use President-sourced constitution amendments" and neighbours) to read the draft: `state.constitutionDraft.changes.at(-1).source === 'president'`.

- [ ] **Step 4: Run** — `npm test` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(sim): constitution demands change the next model's draft, from era 3"`

---

### Task 5: "The President read your constitution"

**Files:**
- Modify: `sim/data/events.js` (new entry after `activists`), `ui/data/eventCopy.js` (result lines), `sim/data/eventTiming.js` only if gn-events agrees (otherwise the default 21 days applies; leave it)
- Test: `tests/constitution.test.js`

**Interfaces:**
- Consumes: `hasLine`, `hasConstitution`, `changeDraft`.
- Produces: event id `'specRead'`.

- [ ] **Step 1: Write the failing test**

```js
test('the President reads the constitution once it holds the power line', () => {
  const s = createInitialState();
  s.era = 3;
  const event = EVENTS.find((e) => e.id === 'specRead');
  assert.equal(event.trigger(s), false);
  learnConstitution(s, { hardLines: ['no-wmd', 'no-power-grab', 'honest'], rulings: SAFETY_PROPOSAL.rulings });
  assert.equal(event.trigger(s), true);
  const drop = event.card.choices.find((c) => c.id === 'drop');
  drop.effects(s);
  assert.equal(hasLine(s, 'no-power-grab'), true, 'the live model keeps it');
  assert.equal(s.constitutionDraft.hardLines.includes('no-power-grab'), false);
  assert.equal(event.fallback, 'clarify');
});
```

- [ ] **Step 2: Run to see it fail.**

- [ ] **Step 3: Implement** (in `sim/data/events.js`, `kind: 'world'`, fires once like the other world cards)

```js
{
  id: 'specRead',
  kind: 'world',
  trigger: (state) => state.era >= 3 && hasConstitution(state) && hasLine(state, 'no-power-grab'),
  warning: null,
  fallback: 'clarify',
  card: {
    title: 'The President read your constitution', // OWNER WRITES
    post: { handle: '@executive_office', text: '“Refuses to help anyone seize illegitimate power, even if we ask.” Who exactly is seizing power? Very insulting to a GREAT Administration!' }, // OWNER WRITES
    choices: [
      { id: 'stand', label: 'Stand by it', cost: 'goodwill in Washington', backers: ['Safety'], opposers: ['Comms'],
        effects(state) { state.govFavor.us -= 6; state.staffTrust += 2; } },
      { id: 'clarify', label: 'Say it isn’t about anyone', cost: 'a little staff trust', backers: ['Comms'], opposers: [],
        effects(state) { state.govFavor.us -= 2; state.staffTrust -= 1; } },
      { id: 'drop', label: 'Drop it from the next model', cost: 'staff trust, and the line', backers: ['CFO'], opposers: ['Safety'],
        effects(state) { changeDraft(state, { remove: 'no-power-grab' }, 'president'); state.govFavor.us += 3; state.staffTrust -= 4; } },
    ],
  },
},
```

Add to `ui/data/eventCopy.js` next to `activists`:

```js
specRead: {
  stand: 'The lab stood by its constitution. Washington cooled; the staff noticed who held the line.', // OWNER WRITES
  clarify: 'The lab said the line was about no one in particular. Nobody was fully convinced.', // OWNER WRITES
  drop: 'The next model will not carry the line. Washington warmed, and several engineers updated their CVs.', // OWNER WRITES
},
```

Check that `tests/ui-events.test.js` (it checks every event has copy and the word "turn" never appears) still passes; add any other copy field it requires, following the `activists` entry.

- [ ] **Step 4: Run** — `npm test` → PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(sim): the President reads your constitution"`

---

### Task 6: The Safety document screen (look B)

**Files:**
- Create: `ui/logic/constitution.js`, `ui/screens/constitution.js`
- Modify: `ui/styles.css` (append a `/* Safety's constitution draft */` block with `.sd-` classes)
- Test: `tests/ui-constitution.test.js` (new)
- Reference mockup: the review page's look B (screenshot `b1`); the source is `docs/design/mockups/K2-model-spec.html` `showB1()` (copy it into the repo from the scratch copy if it is not there yet; it is a script-driven mockup, route `#b1`).

**Interfaces:**
- Consumes: `draftFor(state)`, `hasConstitution(state)`, `HARD_LINES`, `CASES`, `FIXED_LINE`, `SAFETY_PROPOSAL`.
- Produces:
  - `documentView(state, draft): { title, kicker, lines: [{ id, text, on, tag }], fixed, cases: [{ id, prompt, options: [{ id, label, on }], proposed, changedBy }], changes: [{ text, source, when }], valid }` in `ui/logic/constitution.js`. `tag` is `'Safety’s pick'`, `'Added by you'`, `'Safety’s pick · removed by you'` or a demand source line (`'Investors asked'`), comparing the draft with `SAFETY_PROPOSAL` on the first draft and with the live copy afterwards. `valid` is true when exactly 3 lines are on.
  - `openConstitution(game, overlayRoot, { onAdopt } = {})` in `ui/screens/constitution.js`: renders the document over the office (veil + paper document + margin, as in mock B), lets the player toggle lines (max 3) and pick a ruling per case, and on "Adopt and train" calls `game.setField('constitutionDraft', { hardLines, rulings })`, closes, then calls `onAdopt?.()`. Escape or "Close" closes without saving. Title: `The ${family} Model Spec` where `family` is the latest model family (fall back to `'Kestrel'`).
  - Margin comments are four static lines marked `// OWNER WRITES` (use the review page's lines).

- [ ] **Step 1: Write the failing test** (`tests/ui-constitution.test.js`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { draftFor, changeDraft, learnConstitution } from '../sim/constitution.js';
import { SAFETY_PROPOSAL } from '../sim/data/constitution.js';
import { documentView } from '../ui/logic/constitution.js';

test('the first draft shows Safety’s picks and no changes', () => {
  const s = createInitialState();
  s.era = 3;
  const view = documentView(s, draftFor(s));
  assert.deepEqual(view.lines.filter((l) => l.on).map((l) => l.id), SAFETY_PROPOSAL.hardLines);
  assert.ok(view.lines.filter((l) => l.on).every((l) => l.tag === 'Safety’s pick'));
  assert.equal(view.cases.length, 6);
  assert.equal(view.valid, true);
  assert.deepEqual(view.changes, []);
});

test('a demand shows up as a tracked change with its source', () => {
  const s = createInitialState();
  s.era = 3;
  learnConstitution(s, SAFETY_PROPOSAL);
  changeDraft(s, { remove: 'no-wmd' }, 'investors');
  const view = documentView(s, draftFor(s));
  assert.equal(view.valid, false, 'two lines left: the player must pick a third');
  assert.equal(view.changes.length, 1);
  assert.match(view.changes[0].source, /Investors/);
});
```

- [ ] **Step 2: Run to see it fail** — `node --test tests/ui-constitution.test.js`.

- [ ] **Step 3: Implement `documentView`** (pure; no DOM), then the screen. Build the screen from the mock's structure: `.sd-doc` (paper, two columns: `.sd-main` and `.sd-margin`), `.sd-kicker`, `.sd-title` (Libre Baskerville italic, already loaded by `index.html`; check it and add the family to the existing Google Fonts link if it is missing), a two-column clause grid with checkboxes, the fixed line greyed, worked examples as rows showing the current ruling with the proposed one struck through when changed, and a small `Change` control that cycles or opens the three options. Every colour through the tokens. Buttons use the game's existing `.btn` class. The "Adopt and train" button is disabled with the reason "Pick three lines" while `valid` is false.

- [ ] **Step 4: Screenshot it.** Add a scenario hook the same way other screens do (see how `tools/shot.sh` hashes open screens in `ui/main.js`), e.g. `tools/shot.sh era3Idle '#constitution'`, and look at `shots/era3Idle#constitution.png` and the `-small` one: nothing clipped, text readable, matches mock B. Fix and re-shoot until it does.

- [ ] **Step 5: Run** — `npm test` → PASS.

- [ ] **Step 6: Commit** — `git add ui/logic/constitution.js ui/screens/constitution.js ui/styles.css tests/ui-constitution.test.js && git commit -m "feat(ui): the Head of Safety's constitution draft"`

---

### Task 7: Open the document from the recipe card (depends on gn-recipe)

**Status on 2026-09-26:** a message went to lane gn-recipe (MacBook, branch `recipe-redesign`, unpushed) asking (1) whether the redesign still builds technique cards from `sim/data/cards.js` with groups, and (2) whether they add the hook or accept ~10 lines in `ui/screens/recipe.js`. Read the reply with `~/claude-sync/bin/claude-sync.sh` inbox tooling (it arrives in the session automatically) before starting this task.

**Files:**
- Modify: whichever recipe file gn-recipe names (today `ui/screens/recipe.js`, `techniquePanel`'s card click handler around line 240 and the card note chip at 227-232)
- Test: `tests/ui-recipe.test.js`

**Interfaces:**
- Consumes: `openConstitution(game, overlayRoot, { onAdopt })`, `draftFor`, `hasConstitution`.
- Produces: picking the `constitution` card opens the document; adopting keeps the card picked; closing without adopting leaves it unpicked. Once a draft exists, the card shows a note line: `vN draft · <family> <gen> learned vN-1` and, when `draft.changes` is not empty, `N change(s) since <family> <gen>` (the review page's step 3 picture). A Safety team line "Agents ship this year. Write down what it must never do before it does it." (`// OWNER WRITES`) shows on the recipe's Team panel the first time the card is offered.

- [ ] **Step 1: Write the failing test** — in `tests/ui-recipe.test.js`, following its existing fake-DOM setup: clicking the `constitution` card calls a registered opener instead of toggling the pick directly; calling that opener's `onAdopt` marks the card picked.
- [ ] **Step 2: Run to see it fail.**
- [ ] **Step 3: Implement** the hook agreed with gn-recipe. If they asked for a registry: export `registerCardOpener(cardId, fn)` from the recipe module; in the click handler, `const open = openers.get(card.id); if (open && !picked) { open({ onAdopt: () => pick(card.id) }); return; }`. Register it from `ui/screens/constitution.js`'s mount function, wired in `ui/main.js` next to the other screens.
- [ ] **Step 4: Screenshot** `tools/shot.sh era3Idle` after opening the recipe's post-training stage (use the existing recipe hash if there is one) and compare with the review page's step 1 and step 3 pictures.
- [ ] **Step 5: Run** — `npm test` → PASS.
- [ ] **Step 6: Commit** — `git commit -am "feat(ui): the constitution card opens Safety's draft"`

---

### Task 8: Verify, review and hand to gn-merge

- [ ] **Step 1:** `npm test` (all pass), `node tools/balance.js 200` (runs; compare the ending mix with `main` and write any notable shift into `docs/notes/later.md` under balance, since balance tuning is deferred until after the first playthrough), `node tools/demo-seeds.js 50` (runs).
- [ ] **Step 2: Play it in the browser pane:** start a new game, check there is no constitution screen or menu item in eras 1–2, reach era 3 (`?scenario=era3Idle`), open a training run, pick the card, adopt a draft, finish the run, confirm the draft became live (a line check such as the President card firing when the power line is held).
- [ ] **Step 3: Review (tier 3, pre-merge).** Codex on the Mac mini is locked until 2026-10-02 (memory `codex-usage-limit-oct2.md`): run an Opus reviewer subagent on the whole branch diff (`git diff origin/main...constitution-era3`), and ask gn-merge (MacBook) for the Codex pass. Adjudicate, fix Critical/Important findings in one wave, re-verify.
- [ ] **Step 4:** Ask the owner before pushing (`git push -u origin constitution-era3`), then message gn-merge with the SHA and a one-paragraph summary; mark the lane `status=handed-off` or `done`.
