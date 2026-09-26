# Release flow suggestions (2026-09-26)

Offered to the owner with a mockup per option (review page, version 2, 2026-09-26). Tags: **decided** (settled; confirm only), **cheap**
(UI-only, fits the deadline), **costly** (needs a sim change or new systems). The recommended
option is marked (rec). Sources point at the notes in this folder or at repo files.

## Baseline, already decided

- One GDT dialog: Evaluation cards left, name builder centre, Channel and serving cards right,
  price stance, reasoning slider from era 3; OK queues `{ type: 'release', release }`
  (`docs/superpowers/plans/2026-09-25-plan2b-ui.md`, Task 6).
- Naming: the player types the family, the generation is automatic, the four size words are
  named once on the first release with a "Rename sizes" link (plan Task 6; archived UI handoff).
- The reveal is K2 `#release`: title, beat badge, five benchmark rows with three bars, four
  critics, up to five reactions, new users, Continue (`docs/design/mockups/K2-gdt-polished.html`).
- Player-typed text uses `textContent`.

## Suggestions

1. **Price stance switch.** (A) four buttons for the stances the sim accepts: Premium, Market,
   Undercut, Free tier. (B) the plan's three, mapping cheap to undercut and dropping free. (C, rec)
   a notched vertical slider with the four stances, as spec §6b asks for price and as the recipe
   screen's sliders look. All cheap.
   Source: `sim/serving.js:13-18`, plan Task 6, `docs/research/training-options/report.md`.
2. **Make "how sure are you" the dialog's headline decision.** (A, rec) each evaluation card shows
   when the model ships (this turn or next) and what it costs, and the Team panel gives the Head
   of Safety's and CFO's opinions, reusing `opinions(state, screen)` from `ui/logic/compute.js`.
   (B) plain cards as in the plan. (C) a "how much you'll know" meter (Little, Some, A lot, Most)
   that fills with stronger checks; combines with A. All cheap. Source: eval cards in `sim/data/cards.js:57-61`; no AI
   tycoon game researched makes ship-now-or-test-more a single release-screen choice
   (`ai-lab-and-tech-games-release.md`); Game Dev Tycoon offers only Release or Cancel.
3. **Generation "jump" toggle.** (A, rec) drop it; the number is always previous + 1. (B) keep it
   as a cosmetic choice. (C) make it matter as spec §6b says: a jump raises the launch bar and an
   empty rebrand draws a mocking post. Costly (sim change). Source: spec §6b; `sim/release.js`
   takes `generation` as given and has no jump logic.
4. **Reveal pacing.** (A) the plan's: benchmark bars animate in one after another. (B, rec) a
   short sequence: bars, then the four critics one at a time, then reactions, then Continue; one
   click skips to the end; no motion under reduced-motion. Cheap. (C) B plus one completion sound.
   Costly-ish (the game has no audio yet). Source: Game Dev Tycoon's completion "ding" was a
   reviewer's single high point; Game Dev Story reveals four critics together
   (`game-dev-tycoon-release.md`, `other-tycoon-games-release.md`). The one-at-a-time GDT review
   reveal rests on a search summary only (⚠️).
5. **Beat badge wording.** (A, rec) "Beats your last flagship on N of 4 benchmarks", hidden on the
   first release, as the plan and `launch.beats` say. (B) "N of 5" as the mockup's placeholder
   copy reads, which would count the safety score as a capability win. (C) a verdict in words
   ("Better than Kestrel 3", "Mixed", "Worse") with safety in its own small tag. Decided; confirm.
6. **Say who checked the safety score.** (A, rec) the Jailbreak Gauntlet row carries a small label
   from the evaluation pick: Self-reported (quick checks), Internal evals, Third-party checked,
   Government tested. The true score still waits for the end-of-run reveal. (B) no label. (C) a
   striped "could be lower" zone below the shown score, wide after quick checks and narrow after
   outside checks; it shows uncertainty from the pick, never the real gap. All cheap.
   Source: spec §6f (shown score can be gamed from era 3; an outside eval gate cuts the gaming);
   real launches pair benchmark tables with safety cards and name outside evaluators
   (`ai-lab-and-tech-games-release.md`, Gemini 3 post read via the fetch tool's summary ⚠️).
7. **Money at the reveal.** (A, rec) keep K2's footer (new users only); the running cost and margin
   appear from next turn, when the sim computes them. (B) add an estimated revenue per month next
   to new users. Cheap. (C) a full model card with running cost and margin, as spec §7 step 6
   says. Costly (serving cost is 0 until the next turn's update). Source: spec §7; `sim/release.js`.
8. **What the launch taught you.** (A) nothing extra. (B, rec) one plain line under the badge naming
   the biggest reason the scores moved, built from the model's flags ("Quick checks and scraped
   data cost points on every benchmark"). Cheap. (C) a launch report page, like Game Dev
   Tycoon's game report. Costly. Source: Game Dev Tycoon's text-only game report; Game Dev
   Story's fan letters (`game-dev-tycoon-release.md`, `other-tycoon-games-release.md`).

## Build notes (no pick needed)

- The reveal reads the committed `release` event from `endTurn()`, never a preview; the dialog
  previews cash and validity only, because `projectQueue` uses a fixed seed.
- When `misalignmentIncident` is set (era 3), the warning post leads the reactions; when the
  release sets `state.ending`, the ending takes over after the reveal.
- Once `compute-ui-fix2` merges into `ui`, every edit to a queued release calls
  `queueChangeProblem`.
- `ui/menu.js`, `ui/main.js`, `ui/styles.css`, `ui/game.js` and `ui/logic/scenarios.js` are shared
  with the events lane; tell that lane before editing them.

## Owner picks (2026-09-26)

`1B 2A 3C 4B 5B 6A 7B 8A`, plus: next to the badge, show cost per token and related numbers.

- 1B: three price buttons, Cheap / Market / Premium; Cheap sends `undercut`, and the free tier is
  not offered in the UI.
- 3C is a sim change and needs the owner's yes on the numbers. Proposal: each skipped number
  raises the critics' comparison bar by 5 points; a gain under 5 points per skipped number adds
  one mocking post.
- 5B: "Beats your last flagship on N of 5 benchmarks", counted over all five rows in the UI.
  Next to it goes a price sheet: price per million tokens (`revenuePerUser` over tokens per user),
  serving cost per million tokens (from `sim/serving.js`), and the margin. Open weights show a
  free-download note instead.
- Correction to suggestion 7: `sim/turn.js` runs `updateServing` right after a release move, so a
  model that ships this turn already has its `servingCost` at the reveal. Only delayed launches
  (a one-turn evaluation or staged channel) have none yet.

## Final picks (2026-09-26, later the same day)

`1C 2A 3C 4B 5B 6A 7B 8A`. The owner moved price from 1B to 1C ("a slider with the API cost per token
written next to it") and set the jump rule to 1 point per skipped number, with the feed doing most
of the work ("people should specifically mention the jump in the AI space"). Build plan:
`docs/superpowers/plans/2026-09-26-release-flow.md`.
