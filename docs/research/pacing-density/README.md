# Pacing density (2026-09-26)

The owner's playtest note: "The pacing is too slow with nothing happening", and later: "too few bubbles overall,
it's hard to get a sense of progress."

## What we found

- **Something asks for the player only about once every 40 seconds.** At ×1, cards, advisor warnings, "training
  complete" and meetings together come 1.4-2.6 times per running minute. In eras 1, 2 and 5 a typical run has at
  least one full 90-second round where nothing asks at all; the worst gap measured was 204 s. 84-91% of running time
  falls inside stretches longer than 20 s with no ask. The cause is structural: cards and warnings are only made at a round
  mark, at most two at a time, and land on random days, so they bunch up.
- **When nothing trains, nothing on the main screen moves.** While a run trains, bubbles keep visible change 3-5 s
  apart. But nothing is training for 21-46% of the running time, and those stretches produce visible silences of
  45-77 s in a typical run. Era 5 is the worst: a story day lasts 12.9 s there, so 70% of era 5 sits in silences over
  20 s.
- **Bubbles are thin.** Each capability point is one bubble (alignment bubbles add a few more): about 20 per
  first-era run (one every 6 s), 36-55 later,
  and none between runs. Research points, users and money grow every day with no bubble at all.
- **Ambient motion does not count as "happening".** Feed posts (the phone badge) and weekly money floats tick every
  few seconds in eras 1-2, and the owner still felt nothing was happening.
- **Every extra screen pauses the clock.** Money, Compute, the race view, Lab history, the board and even Flock open
  as dialogs, so none of them can be watched while time runs.

Assumptions: ×1 speed; the `balanced`, `safety` and `speed` balance bots, 20 seeds each, wrapped as an attentive
player who answers each card the day it lands; running-clock seconds only. Real first-time players are slower, so
treat these numbers as a floor. Details in `measurements.md`.

## What other games do (details and sources in `research.md`)

Left 4 Dead's director caps quiet at 30-45 s before building up again. RimWorld's Cassandra alternates fixed "on" and
"off" phases with a minimum spacing between big threats, plus a separate stream of small events. Halo's designers
talk about a 3-second loop inside a 30-second loop inside a 3-minute loop. Game Dev Tycoon spawns every point as its
own bubble (tech, design, research, bugs), about 20-36 per early game, growing about a hundredfold later. Two Point
Hospital's emergencies are opt-in offers the player takes when ready.

## Options, ranked

Targets are for ×1, measured with `measure.mjs`. None adds dice to outcomes; only timing and cosmetics may be random.

| # | Option | Size | Balance risk | Target |
|---|---|---|---|---|
| 1 | **Bubbles you can feel.** Split each capability point into 4 small bubbles (badges still tick at whole points, so the totals are unchanged). Spread each day's bubbles across the day's real length instead of one burst (fixes era 5's 12.9 s gaps). Add a research-point stream from the Research desk to a small research counter, so progress shows between runs too. Files: `ui/logic/training.js`, `ui/screens/training.js`, `ui/fx.js`, `ui/hud.js`. | S-M | None (cosmetic split of the same totals) | 40+ bubbles a minute while training with one at least every 2 s; 20+ a minute overall in every era (today 13 while training in era 1; 4.6-15 overall) |
| 2 | **A beat floor: spread the cards, let desks speak when it's quiet.** Land a round's cards on evenly spread days (random inside each slot) instead of anywhere in the round. When nothing has asked or changed for 25 s, a staff member speaks from their desk with a line drawn from the real state and one button ("Research: the racks are idle, start a run?"; the CFO on runway with "Open Money"; Policy on a trending post with "Open the phone"). Files: `sim/events.js` `stampNewCards`, a new `ui/logic/quiet.js`, `ui/screens/briefing.js`. | M | Low (landing days only; deadline tests need updating) | No stretch over 45 s without an ask or a desk voice; median under 20 s (today 19-41 s, worst 204 s) |
| 3 | **Keep research busy.** Let the player plan the next run while one trains; it starts when the model is released if compute and a move allow, and otherwise the Head of Research says why from the desk with a button (sign a deal, pick a smaller size). A few days before a run ends, warn if the next run will not fit. Optional, and a real rule change: starting a queued run costs no move, because release plus next run use a whole round's 2 moves today. Files: `ui/game.js`, `ui/screens/recipe.js`, `ui/screens/training.js`; `sim/turn.js` only for the move rule. | M (L with the move rule) | None as UI only; medium with the move rule (re-run `tools/balance.js`) | Nothing training under 10% of eras 1-4 (today 21-40%) |
| 4 | **Opportunities you can take.** Opt-in offers with a shown, fixed reward and a deadline, placed in quiet stretches: an enterprise pilot, a benchmark invitation, a conference keynote (Game Dev Tycoon's G3, Two Point Hospital's emergencies). Files: a new `sim/opportunities.js` and data, `sim/turn.js`, a card variant in `ui/screens/events.js`, feed reactions. | L | Medium (new money and user sources; needs before-and-after bot runs sized to existing effects) | At least 2 asks in every round |
| 5 | **A live window that does not stop time.** The "extra screens" idea. Today's screens (Money, Compute with its race view, Flock, Lab history, the board, Plan the years ahead) all pause. Add a drawer from the phone that stays open while time runs: the live feed, a race strip and this month's money line, each item linking to its action. It must be opt-in and collapsible, because the owner ruled out an always-visible dashboard. Files: `ui/screens/flock.js` (a drawer mode outside `.dialog-layer`), `ui/clock.js`, `ui/hud.js`, `ui/styles.css`. | M | None | Playtest: the player opens it during quiet stretches; the bots cannot measure this |
| 6 | **Experimental: a tension director.** Left 4 Dead style. Track tension from recent beats (cards, warnings, runway, rival launches) and shape each round into build-up, peak and relax by choosing when cards, rival launches, feed bursts and desk voices land, so that relaxing never runs past 30-45 s and a peak never stacks three cards. Only timing moves. Files: a new `sim/director.js` (pure timing, its own seeded stream), `sim/events.js`, `sim/landings.js`, `sim/feedLive.js`. | L | Low for outcomes; medium for timing tests and card deadlines | Longest ask gap 45 s; longest visible-change gap 15 s |

Quick knob, not ranked: rounds could be shorter in era 5 (for example 60 s instead of 90 s) through `ui/clock.js`
`secondsPerRound`. That shrinks every gap there with no balance effect, but it also shortens the era the story treats
as the climax. The owner already chose no skip button (pick 4C), so none is proposed.

My recommendation: do 1 and 2 first. Both are cheap, both are measurable with `measure.mjs`, and together they address
the two measured problems (thin progress and long silences). Then pick between 3 and 4 for agency, and try 6 as the
experiment.

## Reading order

1. This file.
2. `measurements.md`: the numbers, the assumptions and their limits.
3. `research.md`: what Game Dev Tycoon, RimWorld, Left 4 Dead, Halo, Two Point Hospital and others do, with sources.
4. `measure.mjs`: the script (run from the worktree root), with its printouts in `output-attentive.md` and
   `output-bot.md`.
