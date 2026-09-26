# Release flow — what our own plans, specs and code already decide

Prepared 2026-09-26 for the release-flow lane (plan 2B Task 6: the release dialog and the
release reveal). Purpose: let a designer write release-flow suggestions and tag each as
"already decided", "cheap" or "costly" without re-reading the repo. Every claim below names its
exact file, section or line. Repo root for all relative paths:
`/Users/ardaenfiyeci/worktrees/game-night-ai-lab-release` (branch `release-flow`, off `ui` at
`282e130`).

---

## 1. Already decided

These are settled; a suggestion that contradicts one of them should be flagged as reopening a
decision, not proposed as fresh ground.

- **Visual reference is binding.** "Visual reference, binding: `docs/design/mockups/K2-gdt-polished.html` and its four PNGs (states `#menu`, `#dialog`, `#release`)." — `docs/superpowers/plans/2026-09-25-plan2b-ui.md:13`. The matching PNG is `docs/design/mockups/K2-gdt-polished-release.png` (confirmed on disk).
- **Palette tokens are fixed** (cream, paper, ink, teal, wood, coral, sky) and every colour must be a token or a `color-mix()` of tokens — plan2b-ui.md:14; spec `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md:410-411`.
- **The release reveal's structure is decided**, not just its look: "a three-column panel (benchmarks, press, reactions) with one Continue button" — spec §7b, `...design.md:407`. Task 6 spells out the exact reveal contents (see §4 below) — plan2b-ui.md:281.
- **Naming is decided (owner 2026-09-25).** The player types the model's **family** name; the **generation** number is automatic (previous + 1, or a "jump" toggle); the four **size** words are named once, on the first release, pre-filled with **Swift, Core, Grand, Apex**, stored as `state.tierWords = { small, medium, large, xl }`, with a "Rename sizes" link to reopen them later. Blank words fall back to the defaults. — plan2b-ui.md:281; confirmed again, with the rejected alternative, in the archived handoff `~/claude-sync/handoffs/archive/enfiyeci-game-night-ai-lab/handoff-2026-09-25-gn-ui-remaining-designs.md:29-33`: *"Rejected: fully free-form model names, because they lose order and size and would need another sim change."* This naming scheme is the **one owner-approved sim change** in plan 2B (plan2b-ui.md:281) and is already implemented in `sim/release.js:10,18-23` (see §2).
- **Player-typed text is always `textContent`, never `innerHTML`.** Stated as a hard rule in both handoffs (`handoff-2026-09-25-gn-ui-remaining-designs.md:34`, `handoff-2026-09-26-gn-release-research-first.md:19`), because the lab-history article broke this rule twice in an earlier draft.
- **Launch reviewers are decided:** benchmarks plus a press panel of four parody critics — `docs/open-decisions.md:33` ("DECIDED 2026-09-25"), matching the four `CRITICS` already coded in `sim/data/launch.js:20-29` (PitchCrunch, Strategery, AI Snake Eyes, Æon Review).
- **Design process for this screen:** "inside the approved K2 look, one faithful extension per new decision screen is enough" and a mockup is still wanted before any build — `handoff-2026-09-25-gn-ui-remaining-designs.md:41` and `handoff-2026-09-26-gn-release-research-first.md:20`.
- **Publish review pages as artifacts, not worktree links** — the owner cannot open worktree file links from chat (`handoff-2026-09-26-gn-release-research-first.md:20`; also recorded in this account's memory file, `worktree-file-links.md`).
- **The sim is imported, never modified, by plan 2B** except the one naming change above — plan2b-ui.md:20.
- **One commit per task**, staged by explicit path, `npm test` passing after every task, trailer `Co-Authored-By: Codex (gpt-5.6-sol) <noreply@openai.com>` — plan2b-ui.md:21.
- **The release event carries `hazardIgnored`**, and a separate `{ type: 'hazardResolved', choice: 'ignore', auto: true }` event fires when a hazard ships unresolved — plan2b-ui.md:32 ("Release and hazards (Tasks 5 and 6)"), matching `sim/release.js:72-74` and `sim/turn.js:221`.
- **Two moves per turn, max** (`MAX_MOVES = 2`, `sim/turn.js:34`); a release consumes one of them, same as any other move.
- **A minimum gap between releases exists in the sim** (not yet surfaced in any UI copy): `MIN_RELEASE_GAP_TURNS = 2` — `sim/release.js:13`, enforced only when the summit's `releaseDelay` commitment is binding (`sim/release.js:57-60`).

---

## 2. What the sim already provides for release

### `releaseModel(state, release, rng)` — `sim/release.js:54-158`

**Input** — `release` is a plain object built by the UI:
```
{ picks: [cardId, ...], price: 'premium'|'market'|'undercut'|'free', reasoning: 'off'|'low'|'medium'|'high', family: 'Kestrel', generation: 4 }
```
- `picks` are card ids from `pickableCards(state, 'release')` (release-stage cards), validated by `validatePicks` (imported from `sim/recipe.js`, not read line-by-line — see Coverage statement).
- `price` must be a key of `PRICE_STANCE` (`sim/serving.js:13-18`: `premium`, `market`, `undercut`, `free` — **not** `cheap`; see the contradiction flagged in §6).
- `reasoning` is only honoured if the trained model's spec is `reasoningCapable`; otherwise it is forced to `'off'` (`sim/release.js:63`). Values map to `REASONING_BONUS = { off: 0, low: 2, medium: 4, high: 6 }` (`sim/release.js:11`), added to capability for the launch score only.
- `family` is required; a missing value is a validation error (`sim/release.js:65`).
- `generation` defaults to `1` if omitted (`sim/release.js:85`) — the UI is expected to compute and pass "previous + 1" itself; the sim does not auto-increment.

**Preconditions checked, each returning `{ ok: false, error }` on failure:**
- There must be a `state.pendingModel` (a trained, unreleased model) — `sim/release.js:55-56`.
- If the summit's `releaseDelay` commitment is binding and a model was released within the last `MIN_RELEASE_GAP_TURNS` (2) turns, release is refused with `'the summit deal requires a gap between launches'` — `sim/release.js:57-60`.
- Card-pick validation errors, an unknown price stance, an unknown reasoning effort, and a missing family name are all collected and joined with `'; '` — `sim/release.js:61-66`.
- Not enough cash for the picked cards' combined cash cost — `sim/release.js:70`.

**What it changes on `state` (side effects), in order:**
1. Deducts card cash cost from `state.cash` (`:71`).
2. If the trained model shipped with an unresolved training hazard, it auto-resolves as `'ignore'` (`:73-74`) — the UI's hazard-choice dialog (Task 5) should normally have already set this before release.
3. Applies card effects (`ad`, `pt`, `st`, `govUs`, `govIntl`, `heat` deltas; a `spec` patch such as `channel` or `precision`; new `flags`) via `sum()`/`effects` (`:76-80`).
4. Delay from cards plus any `m.releaseDelay` on the trained model becomes the model's `activeFromTurn` offset (`:78,111`).
5. If any card sets `flags.thirdPartyEval` or `flags.govEval`, exposes 50% of concealed alignment debt (`:83`).
6. Builds the model's public `name` via `modelName()` (below) and raises `state.capability` to at least the trained capability (`:86-87`).
7. Adds to `state.alignmentDebt` (`:88`).
8. Calls `scoreLaunch()` (see below) to build the `launch` object — benchmarks, press, reactions, `capAvg`, `beats`, `pressAvg` (`:89`).
9. Computes `newUsers` from `USERS_BASE[channel]` (consumer 4M, enterprise 500K, agent 50K, open 0 — `:12`) times quality (from press average), era growth, price-stance growth, and the model's own public-effects multiplier, plus a small privacy-clause bonus for enterprise channel (`:90-93`).
10. Pushes the full `model` object onto `state.models` (`:95-120`; fields listed just below) and calls `activateReleases(state)` to resolve channel supersession/user-carryover across models on the same channel (`:27-52`).
11. Clears `state.pendingModel = null` (`:122`).
12. Updates `state.lastFlagship` / `state.lastFlagshipScore` if this is a new best (`:123-126`) and nudges `state.sentiment` from press average (`:127`).
13. Updates `publicTrust`, `staffTrust`, `govFavor.us`, `govFavor.intl`, `raceHeat` (halved if a release-delay deal is binding), and `misuseExposure` (with permanent lock-in and an extra bump for open weights) — `:129-143`.
14. From era ≥ 3, if the release is flagged `agentic`, rolls a misalignment check: `sigmoid(((alignmentDebt + concealedDebt) * capability / 100 − 40) / 8)`; a hit in era ≥ 4 sets `state.ending = 'misalignment'`; a hit in era 3 is a **warning** instead (pushes a feed post, `publicTrust -= 5`, exposes half the concealed debt) and returns `misalignmentIncident: true` — `sim/release.js:145-156`, matching spec §5's "Misalignment catastrophe" table row and §6d.

**The `model` object pushed onto `state.models`** (`sim/release.js:95-120`) — this is what a UI reveal or lab-history screen would read: `name, family, generation, size, capability, launch, launchScore, bar (= state.lastFlagshipScore before this release), spec, channel, priceStance, reasoning, users, newUsers, userCap, activeFromTurn, releasedTurn, releaseSequence, active, activated, flags, servingCost (0 until the next turn's `updateServing`)`.

**Return value:** `{ ok: true, model, hazardIgnored, misalignmentIncident? }` on success, `{ ok: false, error }` on failure (`sim/release.js:157`).

### `scoreLaunch(state, model, rng)` — `sim/launch.js:25-68`

Builds the `launch` object embedded in the model:
- **`benchmarks`**: one row per entry in `BENCHMARKS` (`sim/data/launch.js:2-12`) — four capability benchmarks (Patchwork/coding, Doctorate Quiz/science, Task Horizon/agents, Humanity's Final Final Exam) plus one safety benchmark (Jailbreak Gauntlet). Each row is `{ id, name, kind, shown, truth, flagship, rival }`. `truth` for capability benchmarks is `capability × fit(spec, flags)` minus a bug penalty for `scraped`/`quickEval`/`brokenPromise` flags; `shown` adds ±3 random noise and a contamination bonus on Patchwork/Doctorate if the `contaminated` flag is set. The safety benchmark's `truth` comes from `safetyTruth()` (falls with total alignment debt, `sim/launch.js:20-23`) and its `shown` value adds `evalGaming()` — zero before era 3, then growing with capability above a threshold and capped by concealed debt, cut by a third-party/gov eval gate or interpretability spend (`sim/launch.js:11-18`, matching spec §6f exactly). `flagship` is the previous flagship's `shown` score for the same benchmark id, or `null` on the very first release.
- **`capAvg`**: mean `shown` score over the four capability benchmarks only (excludes the safety benchmark) — `sim/launch.js:49`.
- **`beats`**: count of capability benchmarks where `shown > flagship` (or `flagship == null`, i.e. always counted on the first release) — `sim/launch.js:50`. **Denominator is 4**, not 5 — see the contradiction in §6.
- **`press`**: one score 1–10 plus a quip per entry in `CRITICS` (`sim/data/launch.js:20-29`: PitchCrunch, Strategery, AI Snake Eyes, Æon Review), each biased by agentic flags, rank, contamination, or safety score — `sim/launch.js:56-61`.
- **`pressAvg`**: mean of the four press scores — `sim/launch.js:62`.
- **`reactions`**: up to 5 posts, filtered from `REACTIONS` (`sim/data/launch.js:32-46`, 13 candidate templates keyed by flags/rank/price stance, with generic fallback posts) by a `when(ctx)` predicate, first 5 matches used — `sim/launch.js:65-66`.

### Feeding into the release move — `sim/turn.js`

- `applyMove` dispatches `case 'release': return releaseModel(state, move.release, rng);` — `sim/turn.js:61`.
- On success the turn's event list gets `{ type: 'release', ok: true, model, hazardIgnored, misalignmentIncident? }` (spread of the return value under `type: move.type` — `sim/turn.js:220`), plus a separate `{ type: 'hazardResolved', choice: 'ignore', auto: true }` event if `hazardIgnored` was true (`:221`). **A release UI's reveal screen should read the model off this `release` event from `endTurn()`'s returned `events` array — not recompute anything itself** — the reveal must show what `releaseModel` actually produced this turn, including its real per-turn `rng`, not a projected/preview value (see the rng caveat in §5).

---

## 3. UI patterns to reuse

- **Menu entry and gating** — `ui/menu.js:12`: `{ id: 'release', label: 'Release a model', unavailable: (state) => !state.pendingModel && 'Release needs a finished model' }`. A release dialog module registers its opener the same way `ui/screens/recipe.js:483-485` does for `'training'`: `registerMenuHandler('release', () => openRelease(game, overlayRoot))`, via the exported `registerMenuHandler(id, fn)` in `ui/menu.js:79-83`.
- **Dialog shell** — `ui/components/dialog.js`. `dialog({ title, subtitle, left, right, body, okLabel, backLabel, onBack, onOk, onCancel })` (`:25-93`) builds the GDT-style panel with optional left/right side panels (`sidePanel()`, `:9-23`) and an optional Back button next to OK (`:67-77`, added for `recipe.js`'s multi-stage flow). `openDialog(overlayRoot, opts)` (`:104-162`) wraps it with focus-trapping, Escape-to-cancel, and a `.dialog-open` transition class. The release reveal, however, is **not** a `dialog()` call in the mockup — K2's `#release` markup is a bespoked three-column `<section class="gp rel">` (see §4), so the release dialog (recipe-style, name/price/channel picks) and the release **reveal** (benchmarks/press/reactions) are two different components, matching Task 6's own file list: `ui/screens/release.js` (the dialog) and `ui/screens/reveal.js` (the reveal) — plan2b-ui.md:277.
- **Multi-stage GDT dialog pattern** — `ui/screens/recipe.js` is the explicit reference pattern named in the plan (plan2b-ui.md and the handoff both call it "the closest pattern"). Structure to copy for the release dialog's own stages (evaluation/channel, then naming, then price/reasoning — spec §7 step 6):
  - A `showStage(n)` closure rebuilds the dialog body per stage and calls `openDialog` fresh each time, replacing the previous one (`recipe.js:296-481`).
  - `stageStepper()` renders a small breadcrumb of stage names (`recipe.js:59-74`).
  - `techniquePanel(state, stage, draft, onChange)` renders a card-pick grid grouped by `card.group`, with a "N of M picked" counter from `slotsFor(state, stage)`, single-select-per-group swap logic, and a locked/blocked state once slots are full (`recipe.js:145-238`) — directly reusable for the release stage's `eval`, `channel`, and `precision` card groups (`sim/data/cards.js`, `stage: 'release'` rows: `quick-eval`/`eval-full`/`eval-third`/`eval-gov`/`waive` in group `eval`; `channel-api`/`channel-app`/`channel-open`/`channel-staged` in group `channel`; `fp8`/`fp4` in group `precision` — grepped directly, not read as part of a full file pass; see Coverage statement).
  - `computeFooter(state, preview, releaseEstimate)` renders the live compute-usage bar and cash/turns facts (`recipe.js:240-294`); the release dialog needs at least the cash-cost part, since release cards can cost cash (`sim/data/cards.js` `eval-full`: `cash: 10`, `eval-third`: `cash: 20`, etc.).
  - `workingName(state, draft)` composes a live preview name from `modelName()` (`recipe.js:49-57`) — the release dialog's name builder is the direct analogue, swapping in the player-typed family and the "Rename sizes" flow.
  - `vslider({ label, role, value, min, max, step, colour, notches, onInput })` (`ui/components/vslider.js`, imported by `recipe.js:15`) is the reusable vertical slider for price stance (if rendered as a slider rather than a switch) and the reasoning-effort dial.
  - `teamPanel(state, { lines: true } | { opinions })` (`ui/components/team.js:8-52`, read only through line 40 of 52 — partial, see Coverage statement) renders the left "Team" panel either from `state.lastBriefing` bands directly or from a screen-specific `opinions(state, screen)` array (the pattern `ui/logic/compute.js:573-581` uses for the compute screens) — a release-specific `opinions(state, 'release')` function following that same shape would let each advisor comment on price stance, channel, and evaluation-gate choices the way they already comment on compute deals and budget.
- **Live queued-move preview** — `ui/logic/compute.js:166-183`, `projectQueue(state, queue)`. It clones state, applies turn-start effects, then re-applies every already-queued move via `applyProjectedMove()` (`:107-130`), which **already has a `case` for `'release'`** (`:123-128`): it calls the real `releaseModel(state, move.release, createRng(0))` on the clone, then force-restores `state.ending` so a projected release can never fake-end the run in the preview. This is what a release dialog would call to preview cash-after-release, or to grey out choices that are no longer affordable given other moves already queued this turn — recipe.js does exactly this via `projected()` (`recipe.js:297`). **Caveat:** the preview always uses a fixed `createRng(0)`, so the previewed benchmark/press noise will not match the real committed release's noise (drawn from the turn's real `rng`) — see §5.
- **Menu-tree "Company" submenu pattern** — `ui/menu.js:22-77` (`COMPANY_ITEMS`) shows how a second-level GDT menu with its own `unavailable`/`hidden` predicates and its own reason tooltips is built, in case release-time sub-choices (e.g. an "Emergency" or "Company"-style side menu) are ever wanted, though nothing in the plan currently asks for that at release time.
- **`queueChangeProblem`, in flight, not yet on this branch** — see §5.

---

## 4. The approved release reveal design (K2 `#release`)

Source: `docs/design/mockups/K2-gdt-polished.html:261-326` (the `<div id="release" class="ov">` block); matching PNG `docs/design/mockups/K2-gdt-polished-release.png` (present on disk). Exact contents, top to bottom:

- **Header row** (`.top`): a small kicker label "Model release", an `<h1>` title reading **"Kestrel 4 is out"** (i.e. `<name> is out`), and on the right a pill-shaped **"beat" badge** reading **"Beats your last flagship on 5 of 5 benchmarks"** with a small upward triangle — `K2-gdt-polished.html:262-266`.
- **Three columns** (`.cols`, CSS grid `468px 1fr 262px` — `:138`):
  1. **Benchmarks** (left, widest column):
     - A **legend** with four swatches: solid coral square = "Kestrel 4" (the new model), outline/paper square = "Kestrel 3 (last flagship)", diagonal-striped sky square = "Lodestar (best rival)", and a dashed vertical tick = "Kestrel 3 mark" — `:269-274`.
     - **Five benchmark rows**, one per `BENCHMARKS` entry (Patchwork, Doctorate Quiz, Task Horizon, Humanity's Final Final Exam, Jailbreak Gauntlet), each with: a name plus a small "+N vs Kestrel 3" chip; three horizontal bars (new model solid coral with a dashed mark at the old flagship's position, last flagship outlined, best rival striped sky), each with its numeric value at the right — `:277-286`.
  2. **Press** (middle column): four critic cards (`.critic`), each with the critic's name, a circular score badge out of 10, and an italic one-line quip — `:290-294`. Names and quips match `sim/data/launch.js`'s `CRITICS` exactly (PitchCrunch, Strategery, AI Snake Eyes, Æon Review).
  3. **Reactions** (right column, narrowest): up to five feed-style posts (`.post`), each a coloured avatar-initial circle, a handle, and one line of text — `:298-303`. The mockup's five example posts (`@devnull_ops`, `@tired_parent`, `@marketwire`, `@lodestar_eng`, `@sen_whitfield`) are drawn from the same template pool as `sim/data/launch.js`'s `REACTIONS`.
- **Footer** (`.foot`, absolutely pinned to the bottom of the panel): on the left, "New users this month: **+2.1M**" (i.e. `newUsers`, formatted); on the right, a single orange **Continue** button — `:304-307`.
- **Panel geometry**: `.rel` is a `1064×676` cream-and-amber GDT panel positioned at `188,112` inside the 1440×900 stage (`K2-gdt-polished.html:131`), i.e. it fills nearly the whole stage, unlike the smaller `.dlg` (`492px` wide) used for the training-stage dialogs.
- The bars **animate in one after another** per Task 6's own text (plan2b-ui.md:281); the static mockup shows only the settled end state, not the animation.

---

## 5. Constraints

- **Deadline.** Submissions close **2026-09-27 12:00 AM PT** (spec header, `...design.md:5`; repeated in both handoffs). Judging weights: fun 40%, relevance to AI risk 40%, replayability 20% (spec:6).
- **`textContent`, not `innerHTML`, for any player-typed string** (family name, size words, lab name) — see §1; this applies directly to the family-name field and the "Rename sizes" inputs.
- **Shared files with other in-flight lanes.** The release-research handoff (`handoff-2026-09-26-gn-release-research-first.md:10`) names the exact files a release build will contend with:
  - `ui/menu.js`, `ui/main.js`, `ui/styles.css`, `ui/game.js`, `ui/logic/scenarios.js` are also touched by the **parallel event-cards lane** (plan 2B Task 8, its own handoff `handoff-2026-09-26-gn-events-research-first.md` in the same folder — not opened, out of this task's scope, but named here as the coordination point).
  - The **compute lane**'s in-flight branch `compute-ui-fix2` (worktree `~/worktrees/game-night-ai-lab-compute-uifix2`) is not yet merged into `ui` and changes `ui/logic/actions.js`, `ui/game.js`, `ui/screens/budget.js`, `ui/screens/compute.js` (see next bullet).
- **`queueChangeProblem(state, before, after)`** — defined only on branch `compute-ui-fix2`, **not present on this `release-flow` branch** (confirmed: `grep -n "queueChangeProblem" ui/logic/actions.js ui/game.js` on this worktree returns nothing). On `compute-ui-fix2`, `ui/logic/actions.js:105-114`:
  ```js
  export function queueChangeProblem(state, before = {}, after = {}) {
    const beforeResults = projectQueueReport(state, before).results;
    const afterResults = projectQueueReport(state, after).results;
    for (const prior of beforeResults) {
      if (!prior.ok) continue;
      const next = afterResults.find((result) => result.index === prior.index);
      if (next && !next.ok) return next;
    }
    return null;
  }
  ```
  It compares two full queue snapshots (`before`/`after`, each a `{ moves, budget, ... }` actions object) via a helper `projectQueueReport` (referenced here but its own body was not opened — see Coverage statement) and returns the first previously-*valid* queued move that the new queue would break, or `null` if nothing broke. It is called from `ui/game.js:34`, `ui/screens/budget.js:316`, and `ui/screens/compute.js:158,496` on that branch, each time a screen is about to accept an edit that changes the queue, to warn "this would break move #N" before committing it.
  **What a release move would need once this merges into `ui`:** any release-dialog code path that adds, edits, or removes the queued `{ type: 'release', release }` move (e.g. changing price stance after another move is already queued) should call `queueChangeProblem(game.state, game.queue, candidateQueue)` the same way `budget.js:316` and `compute.js:158,496` do, and surface its returned problem's error to the player before letting the edit through. Because `ui/logic/compute.js`'s `applyProjectedMove` (this branch, and presumably `projectQueueReport`'s equivalent on `compute-ui-fix2`) already has a `'release'` case, this should work automatically once the branches merge, without release-specific code in `queueChangeProblem` itself — but this was not verified directly (`projectQueueReport`'s own definition was not read; see Coverage statement).
- **RNG mismatch between preview and reveal.** `projectQueue`'s `applyProjectedMove` always signs a projected release with `createRng(0)` (fixed seed) — `ui/logic/compute.js:125`, `:104` — while the real committed release inside `endTurn()` uses the turn's actual `rng` (`sim/turn.js:217`, passed through from `game.endTurn()`). Any live preview of benchmark/press numbers shown before the player clicks OK will therefore not match the numbers the reveal ends up showing after the turn resolves. The release dialog can safely preview cash cost, card effects, and validity, but should not promise exact benchmark or press numbers before the turn actually ends.
- **The reveal must read the committed `release` event**, not recompute state — see §2's note on `sim/turn.js:220`.
- **Design-skill gate.** Per the owner's cross-cutting design rule (loaded automatically for this account, `~/.claude/skills/design/`), no release-flow visual work ships without a rendered screenshot critique, and any owner feedback on it must be appended to `LEARNINGS.md` in the same session.

---

## 6. Open questions and contradictions between documents

1. **"N of 4" vs. "5 of 5" for the beat badge.** Task 6's own spec text says the badge reads *"Beats your last flagship on N of 4 benchmarks"* (plan2b-ui.md:281), and the sim's `beats` field is explicitly computed over the four **capability** benchmarks only, excluding the safety benchmark (`caps.filter(...)`, `sim/launch.js:48-50`). But the approved K2 mockup's literal example text reads **"Beats your last flagship on 5 of 5 benchmarks"** (`K2-gdt-polished.html:264`) — i.e. the mockup's placeholder counts all five rows including the safety one, contradicting both the plan's own prose and the sim's actual field. Since the mockup is "binding" (plan2b-ui.md:13) and the plan text is not, this needs an owner call: does the shipped badge read "N of 4" (matching `launch.beats` and the plan's prose) or does it need a new "N of 5" computation to match the pixel-approved mockup text?
2. **Price-stance option count and naming mismatch.** Task 6's plan text says "price stance switch (cheap / market / premium)" (plan2b-ui.md:281) — three options, one of them named "cheap". But `PRICE_STANCE` in the sim (`sim/serving.js:13-18`) has **four** keys — `premium`, `market`, `undercut`, `free` — and `release.js`'s validation rejects any `release.price` that is not one of those four (`sim/release.js:62`). The training-options report's own recommendation (which the spec cites as this section's source, spec:188) also lists four options: Premium, Market, Undercut, Big free tier (`docs/research/training-options/report.md:171-174`). So the plan's own Task 6 prose is the outlier here, both in count (3 vs. 4) and naming ("cheap" vs. "undercut" / a missing "free" tier). A release dialog built strictly to the plan's literal words would not exercise two of the sim's four real price stances.
3. **Distilled sibling (report option R5) is not mentioned in Task 6 at all.** The training-options report proposes a "Distilled sibling" release-time choice (`report.md:179-181`, R5) with its own game effects, and `docs/open-decisions.md:60-62` lists "distilled sibling models" among features to cut first if time runs short — implying it is still notionally in scope, just low-priority. Task 6's interface description (plan2b-ui.md:280-281) never mentions a sibling-model option. Whether the release dialog needs an R5 card at all this cycle is undecided; if pursued, it would be a "costly" addition since `sim/release.js` has no code path for producing a second model from one release move (not verified beyond a keyword search — see Coverage statement).
4. **The task file the assignment named does not exist at the given path.** The assignment asked for `.../handoffs/enfiyeci-game-night-ai-lab/handoff-2026-09-25-gn-ui-remaining-designs.md`; that file has since been moved to `.../handoffs/archive/enfiyeci-game-night-ai-lab/handoff-2026-09-25-gn-ui-remaining-designs.md` (confirmed via `find`). The live `handoffs/enfiyeci-game-night-ai-lab/` folder now instead holds two newer, more specific handoffs dated 2026-09-26: `handoff-2026-09-26-gn-release-research-first.md` (this exact release lane's own starting brief — read in full, §s throughout this document draw on it) and `handoff-2026-09-26-gn-events-research-first.md` (the parallel events lane; not opened, out of scope here). This is not a contradiction in content, just a filesystem-location drift worth knowing before anyone searches for that path again.
5. **`queueChangeProblem` is genuinely unmerged, so today's `release-flow` branch cannot call it yet.** Confirmed empty grep result on this branch (§5). Any release-dialog code written now that needs it should either wait for the `compute-ui-fix2` merge or add a narrower, release-only version and let a later merge de-duplicate it — this is a sequencing question for the owner/orchestrator, not a design one.
6. **Whether reasoning effort is shown as a slider or a switch is unstated.** Task 6 calls it "a reasoning-effort vertical slider (from era 3)" (plan2b-ui.md:281), which matches `vslider.js`'s existing component, but the training-options report frames it as one of four discrete "Effort dial" values with no continuous meaning (`report.md:175`, "off, low, medium, high"). A vslider with four notches (as `recipe.js`'s size/length sliders already do, `recipe.js:345-352`) resolves this cleanly, but it is worth confirming that a notched vslider, not a free-drag one, is intended.
7. **Whether the release reveal's benchmark bars are literally per-benchmark bar charts (as coded) or something more abstracted is not open** — the mockup and the sim's `benchmarks` array line up exactly (5 rows, `shown`/`flagship`/`rival` fields map straight onto the mockup's three-bar-per-row layout) — flagged here only to note that no redesign of this part is actually warranted; a designer's suggestion to "simplify the benchmark rows" would be reopening an owner-approved, code-matched design, not proposing something new.

---

## Coverage statement

Files read to their end in this session:
- `docs/superpowers/plans/2026-09-25-plan2b-ui.md` (387 lines) — full.
- `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` (444 lines) — full.
- `sim/release.js` (165 lines) — full.
- `sim/turn.js` (333 lines) — full.
- `ui/menu.js` (337 lines) — full.
- `ui/components/dialog.js` (162 lines) — full.
- `ui/logic/compute.js` (659 lines) — full.
- `ui/screens/recipe.js` (485 lines) — full.
- `docs/research/README.md` (38 lines) — full.
- `docs/research/game-dev-tycoon/secondary-screens-2026-09-25.md` (37 lines) — full.
- `docs/research/training-options/report.md` (323 lines) — full.
- `docs/open-decisions.md` (62 lines) — full.
- `sim/launch.js` (68 lines) — full.
- `sim/data/launch.js` (46 lines) — full.
- `/Users/ardaenfiyeci/claude-sync/handoffs/enfiyeci-game-night-ai-lab/handoff-2026-09-26-gn-release-research-first.md` (63 lines) — full.
- `/Users/ardaenfiyeci/claude-sync/handoffs/archive/enfiyeci-game-night-ai-lab/handoff-2026-09-25-gn-ui-remaining-designs.md` (94 lines) — full (this is the file the assignment named, found at an archived path — see open question 4).
- `docs/design/mockups/K2-gdt-polished.html` (327 lines) — read end to end **except one single line**: line 173, a 142,525-character inlined SVG drawing of the office room. ⚠️ That one line was not read (the Read tool refused it as over its token budget even for a narrow offset/limit slice); everything else in the file, including the full `#menu`, `#dialog`, and `#release` markup and every CSS rule, was read directly. Line 173 is pure visual artwork (the room illustration) with no bearing on the release-flow structure, so this ⚠️ should not affect any claim above, but is flagged per the read-the-whole-source rule.

Files read only partially, each claim above resting on them marked ⚠️ inline where it matters:
- `ui/components/team.js` (52 lines) — only the first 40 lines were read (via `head -40`); the tail (`teamPanel`'s non-opinions branch, lines ~41-52) was not read. The description of `teamPanel` in §3 covers only the part that was read; the missing tail is unlikely to change the pattern described but was not verified.
- `ui/logic/actions.js`, current `release-flow` branch (this worktree) — not read in full; only its exported-function names were grepped (`normaliseSplit`, `recipePreview`, `cardCostWords`, `sanitizeDraft`, etc., §3 and §2's price-stance note draw on grep output only, not the function bodies).
- `ui/logic/actions.js`, on branch `compute-ui-fix2` (worktree `~/worktrees/game-night-ai-lab-compute-uifix2`) — only lines 105-118 (`queueChangeProblem` and `queuedMoveProblem`) were read via a targeted grep; `projectQueueReport`, which both functions call, was not opened at all. §5's account of `queueChangeProblem` is accurate to what was read, but its claim about `projectQueueReport`'s generic move handling is inferred from `ui/logic/compute.js`'s `projectQueue`/`applyProjectedMove` on this branch, not confirmed against the fix2 branch's actual `projectQueueReport` body.
- `sim/data/cards.js` — not read in full; only the eight `stage: 'release'` rows were grepped out (§2's card list, §3's card-group list). The file's pretraining/midtraining/post-training rows (which appeared in the same grep sweep as "release" hits) were not opened.
- `sim/recipe.js` — not read at all; a direct grep for the string "release" inside it returned zero matches, meaning `slotsFor`/`pickableCards`/`validatePicks`/`validateRecipe`'s handling of the `'release'` stage argument could not be located or verified by keyword search. Their existence and behaviour for the release stage is inferred only from how `sim/release.js` and `ui/screens/recipe.js` call them, not from reading their bodies. ⚠️ This means the exact **slot count** for release-stage picks (spec's "first pass: ... 2 in evaluation and release", `...design.md:224`) was not verified against code.
- `sim/serving.js` — only the `PRICE_STANCE` constant and the following few lines were read via grep with context; the rest of the file (servingCost calculation, `activeModels`, etc.) was not opened.
- `ui/game.js` — not opened directly in this session; its `createGame`/`endTurn` contract is described in plan2b-ui.md:144 (read as part of the plan) and its `queueChangeProblem` call site on `compute-ui-fix2` was only grepped, not read in context.

Grep-only sweep, not opened as files (per the assignment's own instruction to grep for "release", "reveal", "press", "benchmark", "tierWord", "modelName"): this matched effectively the entire `docs/research/`, `docs/superpowers/`, `sim/`, `tests/`, and `ui/` trees (the words are repo-wide vocabulary). Beyond the files listed above as read, no other grep hit (e.g. `sim/endings.js`, `sim/rivals.js`, `sim/queue.js`, `sim/hazards.js`, `sim/internal.js`, `sim/summit.js`, `sim/data/finale.js`, `sim/data/events*.js`, any `tests/*.js`, `ui/logic/history.js`, `ui/logic/summary.js`, `ui/screens/budget.js`, `ui/screens/compute.js`, `ui/screens/history.js`, `ui/screens/sites.js`, `tools/balance.js`, or any of the `docs/research/ai-lab-mechanics/`, `docs/research/compute-mechanics/`, or `docs/research/runway-history/` notes) was opened in this session. If any of those turn out to matter to the release flow specifically, they need a dedicated pass.

Could not open: nothing the assignment asked for was entirely unreachable; the one path mismatch (the ui-remaining-designs handoff) was resolved by finding the file's new archived location (see open question 4).
