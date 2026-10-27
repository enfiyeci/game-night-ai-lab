# Compute deals: build plan

**Status:** ⚠️ written for the round 1 recommendation; round 2 (`options.md`, top) changed O3, O7 and the order, so this plan is rewritten from Arda's round 2 picks before anyone builds. Original status: DRAFT for the recommended combination (O1, then O4, then O2; O3 is the lighter alternative to O2). It is rewritten to match Arda's saved picks
from the picker (https://claude.ai/artifact/L5gX3dw7AZQ4gAGe9jPeoL) before anyone builds. Options are defined in
`options.md`; the problems they answer are measured in `diagnosis.md`.

## Ground rules for whoever builds this

- Work in your own worktree off `origin/main` (28cdc52 or later). Claim a lane on the lanes board first.
- Before and after each option: `node tools/balance.js 200` plus the daily probes in `tools-probes/`
  (`node docs/research/compute-deals/tools-probes/review-stall-check.mjs $PWD 20`, `review-idle-daily.mjs`,
  `review-nogrid.mjs`, `review-r2-serving-rank.mjs`). Report the change against the numbers in `diagnosis.md`, which
  come from these. `dealprobe.mjs` and `probe2.mjs` take round-end snapshots filed under the era the round started in
  (shifted by one round at era changes); use them only for deal counts. New mechanics are sized to match existing effects (project memory:
  check mechanic dynamics).
- Any screen change gets a mockup from real game captures first, agreed with `gn-phone-redesign`, which owns layout
  and CSS under `ui/`. Load the `design` skill before any visual work.
- Reviews run as fresh Opus subagents (project memory: reviews use Opus). Nothing reaches `main` without Arda's OK.
- Keep the owner rule from 2026-09-26: no dice. Anything uncertain comes from a seeded schedule the player can see.

## Step 1 · O1 Free compute you can always see

Goal: the player always sees "free for training" against what the next run needs, and always has a one-click way to
get more. The era 2 stall becomes a priced choice and the era 3 cliff is warned a round ahead.

1. `sim/split.js`: express the serving cap as a share (1, 0.75, 0.5) beside today's unit cap, so the UI can offer
   steps. Keep `servingCap` in units working for saved queues and tests.
2. `ui/logic/compute.js`: one function returning `{ free, needSmall, needChosen, servingCost }` for every compute
   screen; reuse it in `computeBar`, `opinions` and the training help.
3. `ui/screens/budget.js`: replace the two-handle bar with three rows (Users steps with printed costs, Safety in 5%
   steps, Training as the remainder) and the headline line. Mockup first.
4. `ui/screens/computeInfo.js` and `ui/screens/recipe.js` (`computeHelp`): the same headline and a Get compute button
   that opens the deal board (`openDeals`).
5. Stall card: a new event in `sim/data/events.js` (copy in `ui/data/eventCopy.js`, marked OWNER WRITES) fired when
   no run fits for a whole round with no run active and no model waiting. Three answers: sign the one-round card now
   (named, priced, only when one is on the board and affordable), serve fewer users, rent spot for one run.
6. Cliff warning: an advisor line in `sim/data/advisorLines.js` when contracts holding at least half of online compute
   end within the next round.
7. Tests: `tests/split.test.js` (share cap), `tests/ui-compute.test.js` (free line), a new stall-card test,
   `tests/advisors.test.js` (cliff line).

Expected effect to measure: era 2 "no run fits" days for the balanced bot (7,132 of 7,280 over 20 seeds today, via
`tools-probes/review-stall-check.mjs`); check that endings stay within the spec's targets. Teach the bots to answer
the stall card, or the measurement will only show the bots' own rules (see the diagnosis).

## Step 2 · O4 Forecast and commit

Goal: the deal board shows the next six rounds of committed compute against need, and each card's effect on it.

1. `ui/logic/compute.js`: `forecast(state, rounds = 6)` built from contracts' months left, the pipeline, power-site
   arrivals, `updateServing`'s growth and the next run's size. Pure function, unit-tested.
2. `ui/screens/compute.js`: the forecast strip in the right panel (mockup first, with `gn-phone-redesign`).
3. Picked sub-choice "firm or flexible": `sim/contracts.js` adds a `terms` field to offers and contracts; flexible
   costs more per unit and can be broken with one round's notice and no penalty. `sim/economy.js` `projectBurn` reads
   it. Price it so the over-committer probe still runs out of money in most runs (spec target 1).
4. CFO era-end grade in `sim/data/advisorLines.js` (idle share of the era's bill).
5. `tools/balance.js`: the balanced and careful bots pick terms from the forecast; add a probe that always picks
   flexible.

## Step 3 · O2 Size your own deal on a price ladder

Goal: the player chooses how much to buy, and everyone's buying moves the price.

1. `sim/data/compute.js`: per supplier, a ladder of blocks (block size × era scale, price steps such as 1.0, 1.2, 1.5,
   1.9, 2.4) and a fixed refill per round from the dearest empty step (Power Grid's rule).
2. `sim/contracts.js`: `generateOffers` builds ladders instead of fixed cards; `signOffer` takes a size and charges
   block by block; `refreshOffers` applies the refill. Draws stay seeded and in today's order.
3. `sim/rivalDeals.js`: rivals buy units from the ladders (cheapest steps first) instead of taking whole cards; the
   off-board quarter stays. **Agree this with `gn-improve` first**: rival fleets feed rival model sizes in
   `sim/rivals.js`, which that lane is changing for era 4–5 catch-up (its item A4).
4. UI: a size control on each supplier card with the price per block shown as you drag (`ui/logic/compute.js`
   `dealCards`, `ui/screens/compute.js`); mockup first with `gn-phone-redesign`.
5. `tools/balance.js`: bots buy what the next run needs (balanced, careful), the largest affordable block (speed), or
   one step past need (over-committer). Re-run the probes; idle share and the over-committer's cash endings are the
   numbers to watch.

If O2's rival change cannot be agreed, build O3 (the ripening row) here instead: five slot prices, cards slide one
slot cheaper a round and leave at the cheap end, rivals pick by slot, and the rival banner shows the day it signs.

## Overlaps to settle before building

- **gn-phone-redesign** owns every screen these steps change (budget dialog, Compute screen, deal board, training
  help). Agree mockups with that lane first.
- **gn-improve** owns late-game rival rules in `sim/rivals.js` and `sim/data/race.js` (its item A4, era 4–5
  catch-up). Step 3 changes how rivals gain compute, which feeds rival fleets and model sizes. Build Step 3 after A4
  lands, or agree the order with that lane.
- `sim/turn.js` is shared; none of the three steps should need it. If one does, coordinate.

## Not in this plan

O3, O5, O6 and O7 are not planned unless picked. O5 is the natural next step after these three.
