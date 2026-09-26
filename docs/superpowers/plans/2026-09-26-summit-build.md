# Era 5 summit build — implementation plan

> **For agentic workers:** built inline by the gn-summit-design session (deadline 2026-09-27 00:00 PT).
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the owner-approved summit (spec `docs/superpowers/specs/2026-09-26-summit-design.md`): the
room with demands, checking levels and promises; weekly rival breaks with suspicions and investigation;
breaking the deal as a real action; the President calling first.

**Architecture:** Sim first, test-driven, in `sim/summit.js` with its data in `sim/data/summit.js`; turn hooks
in `sim/turn.js`; then UI screens in `ui/screens/summit.js` and `ui/screens/deal.js`, opened with
`openDialog` so the clock and event cards wait. Branch `summit-design` off `origin/ui` (edab9b3).

**Tech Stack:** plain ES modules, `node --test`, the K2 UI (`ui/styles.css` tokens only).

## Global Constraints

- The sim stays deterministic with the seeded `rng`; no DOM in `sim/`.
- No "turn" wording in player-facing text; durations in story words.
- Palette tokens only (`--cream --paper --ink --teal --wood --coral --sky`), Nunito; no new colour literals.
- New UI hooks go at the end of shared files (`ui/main.js`, `ui/menu.js`, `ui/styles.css`), kept short.
- The automation lane (plan 2H) owns `pauseAutomation` enforcement via `jobLocked`; do not re-add `stopInternal`.
- President dialogue stays owner-written; only the meeting's timing moves.

---

### Task 1: Summit data and the vote

**Files:** Create `sim/data/summit.js`; rewrite the proposal half of `sim/summit.js`; tests in `tests/summit.test.js`.

**Produces:**
- `sim/data/summit.js`: `CHECK_LEVELS = ['trust', 'selfReport', 'testers', 'inspectors']`,
  `DEMANDS[party] = { text, rule }`, `PROMISES = { pay, goFirst, inspectors }`, `CHECK_LEAN[party]`,
  `SIGN_AT`, `PROMISE_BONUS`, `CATCH`, `SIGN_SEEN`, `FALSE_ALARM`, `INVESTIGATE`.
- `summit.js`: `readTheRoom(state, plan, rng) -> { [card]: { [party]: 'yes'|'maybe'|'no' } }` and
  `demandStatus(plan) -> { [party]: boolean }` where `plan = { proposals, checks, promises }`;
  `proposeSummit(state, move, rng) -> { ok, signed, binding } | { ok: false, error }` with
  `move = { type: 'summit', proposals: string[1..3], checks: { [card]: 0..3 }, promises: { [party]: type } }`.
- Validation: era 5 week 1, once; 1–3 unique known cards; each check 0–3 (default 1); at most 3 promises,
  known parties and types, `pay` needs cash ≥ 50 per use.
- Promise costs at the vote: `pay` −50 cash; `goFirst` `exposeConcealed(state, 0.5)`; `inspectors` sets
  `deal.playerInspected = true`.
- President: if `verification` binds and `state.meetingsHeld.includes('second')`, US favor −10, event flag.

- [ ] Tests: each demand rule (OpenBrain follows Qilin and ≤ testers; DeepThink refuses the cap; the West
  refuses verification; the East needs a promise; Qilin follows the East; Lodestar needs ≥ testers); a promise
  meets a demand; binding needs a lab and a government; validation rejects bad input without mutating state.
- [ ] Implement; `node --test` green; commit `feat(sim): the summit room — demands, checking levels, promises`.

### Task 2: The weeks after — rival breaks, suspicions, investigation, catching helps

**Files:** `sim/summit.js` (replace `holdOrShip`), `sim/turn.js`, tests.

**Produces:** `dealWeek(state, rng) -> events[]` (called in `endRound` where `holdOrShip` was);
`investigate(state, suspicionId, rng) -> { ok, found }` (called from `applyActions` for
`actions.investigate`); `expireSuspicions(state)` at each day via `advanceDays`.
Caught rival: removed from every `signed` list, added to `deal.expelled`, capability −6 if it had gained,
public trust +3, event `dealBreakCaught`. Binding is not recomputed.

- [ ] Tests: deterrence lowers the break chance with stricter checks; a caught break expels and never
  collapses the deal; an uncaught break adds 6 and may raise a suspicion; a false alarm insults; investigate
  finds a real break at `INVESTIGATE[level]`; suspicions expire at `dueAt`.
- [ ] Implement; tests green; commit `feat(sim): weekly deal checks, suspicions and investigation`.

### Task 3: Breaking the deal is an action; the President calls first

**Files:** `sim/training.js` (`startRun` with `recipe.breakDeal`), `sim/release.js`, `sim/summit.js`
(`playerBreak(state, card)`), `sim/turn.js`, `sim/data/president.js` (`second: era 4, turnInEra 3`),
`tools/balance.js`, `tools/demo-seeds.js`, tests.

**Produces:** a run while `computeCap` binds errors `'this run breaks the Geneva deal'` unless
`breakDeal: true`, then runs uncapped; a release inside the gap while `releaseDelay` binds errors
`'this launch breaks the Geneva deal'` unless `breakDeal: true`. `playerBreak` sets `playerShipped`, queues
the catch roll for the next weekly mark (level 3 if `playerInspected`). Balance bots propose with checks and
promises; `speed` breaks the cap.

- [ ] Tests; balance run (`node tools/balance.js`) reports how often the deal ending happens; tune `SIGN_AT`
  so a careful bot binds two cards in some runs but not all.
- [ ] Commit `feat(sim): breaking the deal is a real action; the President calls before Geneva`.

### Task 4: The summit screen

**Files:** Create `ui/screens/summit.js`, `ui/assets/summit-hall.js` (the hall drawing, from the mockup);
hooks at the end of `ui/main.js`, `ui/menu.js` ("Go to the Geneva summit" in era 5 week 1), `ui/styles.css`.

- Room view: placards and demand bubbles from `readTheRoom` and `demandStatus`; proposals panel with the
  four-step checking control per card and Jules's read; promises row; talking to a delegate opens a small
  slim card with the three promise types; "Call the vote" sends the `summit` move; the vote view shows
  placards and the big screen, then Continue.
- [ ] Screenshot at 1440×900 in the `summit` scenario; commit `feat(ui): the Geneva summit room`.

### Task 5: The deal in play

**Files:** Create `ui/screens/deal.js`; hooks in `ui/hud.js` (deal pill), recipe and release flows (break
dialog), `ui/main.js`.

- Deal pill under the clock (signers' seals, expelled ones struck). Suspicions as Jules bubbles with the
  level's verb and a deadline; answer sends `actions.investigate`. "Break the Geneva deal?" dialog when a
  run or launch returns the break error; confirm resends with `breakDeal: true`. Caught / found-nothing
  outcomes as the slim card from mockup `#caught`.
- [ ] Screenshots; commit `feat(ui): the Geneva deal in play`.

### Task 6: Review and merge

- [ ] Codex adversarial pass on the branch diff (tier 2), one fix wave; owner looks at the screens;
  coordinate the merge into `ui` with gn-merge; push.
