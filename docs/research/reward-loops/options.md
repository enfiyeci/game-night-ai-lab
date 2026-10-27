# Reward loop and cadence options (2026-10-26)

Seven changes for Game Night, from safe to experimental. Each one names the measured problem it fixes (from
`notes/todays_loops.md`), the outside source it borrows from (from `report.md` and the notes), how it plays in real
time, the files it touches, its size and its balance risk. Arda picks on the picker page; this file is the text
version for the `gn-improve` lane.

Size: S = under a day of build, M = one to two days, L = several days plus a balance pass.
Cadence numbers marked "target" are inferences scaled from the sources to Game Night's 6-minute eras. No source states
a decisions-per-minute rule, so each target needs a before-and-after bot run and a playtest.

## The measured problems these answer

1. Quiet stretches: in era 1, 84-86% of story weeks have no prompt and the longest quiet is 52-56 s at the median
   (61-140 s at worst) of running clock.
2. Pile-ups: era 2's first round holds 7-8 prompts; 2.6-3.9 days per game stack two or more clock-stopping dialogs
   (era change plus cash warning every game; era change plus summit; President plus training hazard). In the hand
   run, a card, a cash warning and the President landed on one day.
3. No feedback on a choice: after a card the player sees one sentence, no numbers, no advisor reaction; the first
   verdict ("Paid off") comes at the era recap, about six minutes later.
4. A dead beat after the best reward: after the release reveal the office sits at "No project" with nothing prompting
   the next run, and in the hand run the next run was blocked by compute.
5. Repeats: the second release's reaction posts repeated the first one's almost word for word.
6. Nothing keeps growing: the Capability badge drops to 0 after each release; the recap and the board vote are silent.
7. The finale has almost no core loop: no careful-bot run finishes in era 5 and only 0.3 reveals happen per game.

## Guardrails for every option (from the ethics research)

These are not options; they hold whatever is picked. They come from Zagal, Björk and Lewis (2013) and the
darkpattern.games catalog, read for a free game with no purchases:

- No streaks, daily rewards, login bonuses or penalties for leaving. The pause button always works.
- No fake near misses: the reveal's scores stay deterministic and explainable. Suspense comes from the order things
  are shown in, not from rigged odds.
- No timers that punish looking away; card deadlines stay in story days and the clock stops for every card.
- Any reward a player sees can be traced to a choice they made.

## O1. One pacing director for everything that stops the clock (safe to medium)

**What it is.** Today four systems schedule clock-stopping moments on their own: the scenario director
(`sim/scenarios.js`), the board (`ui/logic/board.js`), the President (`sim/president.js`, checked at round marks) and
the cash warning (`ui/logic/cashWarning.js`), plus the training hazard and the summit. O1 puts one rule set over all of
them:

- **Spacing.** At most two clock-stopping dialogs in any 30 s of running clock, and never two on one story day unless
  the second is a chained follow-up (target). Anything else that comes due waits in a small "2 waiting" chip next to the clock and opens in order, each after the one before closes.
- **Relax window.** After a cluster or a set piece (release reveal, board vote, President, summit), no new
  clock-stopping prompt for 30-45 s of clock, counted from when the last dialog closes (target).
- **Quiet backstop (sub-choice).** If about 90 s of clock pass with no decision and no visible payoff (target), the director pulls the next
  scheduled scenario card forward, or, when none is ready, fires a non-pausing beat: an advisor aside or a feed post
  that pops out of the phone.
- **Set-piece days.** The fixed stacks become one screen each: the cash warning folds into the era recap as its last
  item ("Margot: cash lasts 4 months"), and the President's call moves to the day after the hazard.

**How it plays.** No stretch of era 1 runs longer than about 90 s without a card or a beat, against 140 s at worst today. Era 2's first round
spreads its 7-8 prompts over the round instead of the first week. The player never sees two dialogs back to back.

**Fixes** problems 1 and 2.

**Grounded in.** Left 4 Dead's AI Director (Michael Booth, Valve, 2009 slides, read in full): build-up, a 3-5 s
peak, peak fade, then a 30-45 s relax before the next build-up; Booth says the director changes how often things happen,
not how big they are. RimWorld's storytellers (RimWorld wiki): Cassandra keeps at least 1.9 days between major threats;
Randy forces a major threat after 13 quiet days, about 1.8 times his average gap (⚠️ the average comes from an image
the wiki extract could not show); 1.8 times today's 50 s average gap gives the 90 s ceiling. Set pieces at least about
60 s apart follows Cassandra's spacing floor scaled to a 6-minute era. Factorio and RimWorld split one-shot alerts from persistent notices. CK2's wiki warns that low-delay events
queue and fire in a batch, the pile-up O1 removes.

**Touches.** New `sim/pacing.js` (the queue and the spacing rules); `sim/scenarios.js` (slots ask the director);
`sim/president.js` and `sim/turn.js` (the call's day); `ui/logic/cashWarning.js`; `ui/screens/eraTransition.js`;
`ui/screens/summit.js` (open day); `ui/hud.js` (the waiting chip); `tools/pacing/measure.mjs` (new metrics: dialogs per
12 s window, longest gap with no prompt or beat).

**Size** M. **Balance risk** low to medium. Card effects do not change, but cards land on different days, and the
summit and President timing interact with the bots' action budget (the 2026-10-15 fix showed one moved call can swing
endings). Needs `balance.js 200` and `measure.mjs 40` before and after.

## O2. Answer a card, see what it did (safe)

**What it is.** When the player answers a card:

1. The advisor who backed that choice nods in a speech bubble with one line, or the loudest opposer grumbles. The
   backers and opposers already exist for every scenario choice (`ADVISOR_VIEWS` in `sim/data/scenarioEvents.js`).
2. The "While you were busy" line adds direction words for what moved, in the game's no-hidden-numbers style:
   "Public trust: up a little. Cash: -$4M." Only visible quantities show as numbers.
3. A small verdict tag, the same one the era recap stamps later ("Paid off", "Costly for now", "Mixed"), computed by
   the existing `verdictOf` in `ui/logic/recap.js`. The recap then confirms what the player already saw.

Sub-choice: all three, or only the advisor reaction (the most in-world, least explicit).

**How it plays.** The card closes, an advisor speaks for two seconds, the line in the top-left box tells the player
which way things moved. No extra pause.

**Fixes** problem 3 and playtester 2's "no way to know which decision was the right one".

**Grounded in.** Deci, Koestner and Ryan (1999 meta-analysis, ⚠️ about a quarter read): informational feedback does
not undermine motivation the way expected tangible rewards do. Slay the Spire switched enemy intents to exact numbers
because playtesters preferred them. Reigns shows which of its four bars a swipe moved. Frostpunk words consequences as
"slightly" or "moderately" instead of numbers (from the older event-cards research). Greenheart's modding docs say a
choice's consequence can land one to three weeks later, so delayed effects keep flowing through the feed.

**Touches.** `ui/logic/events.js` (`consequenceLines`), `ui/screens/events.js`, `ui/data/eventCopy.js` (advisor nod and
grumble lines), `ui/office.js` (bubble), `ui/logic/recap.js` (export `verdictOf` for reuse).

**Size** S. **Balance risk** none (no sim change). Copy is owner-written; placeholder lines are marked
`// OWNER WRITES` as elsewhere.

## O3. Keep the core loop turning (safe to medium)

**What it is.** Two parts:

1. **Next run, offered.** When the reveal closes, the Head of Research says one line with a button: "Wren 3 is
   planned. Start it?" The button opens the recipe with the last recipe as the default. If compute is short, the same
   bubble offers the fix the recipe screen already has ("serve fewer users" or "rent compute").
2. **Milestone beats from data the game already has.** A model going live on its delayed date; user milestones (1M,
   10M, 100M); "Wren 2 paid back its training cost" (`paidBack` in `ui/logic/modelMoney.js` already computes it);
   taking #1 on the leaderboard; a rival taking #1 from you. Each is a "Just now" toast with a short sound and a feed
   post. None stops the clock.

**How it plays.** The 85-second reveal is followed by a one-click path into the next run instead of an idle office,
and between releases small earned beats arrive every minute or so, all from the player's own models.

**Fixes** problems 4 and 1 (beats fill quiet stretches without adding decisions) and playtester 3's compute dead end
after a release.

**Grounded in.** Universal Paperclips logs 15 milestones that step by 10x and says how long each took (its source
code, partly read). A Dark Room shows the next thing to build once you hold half its cost, so the next goal is always
visible (its source code, partly read). Game Dev Tycoon fills the gaps between games with contracts and a live sales
graph, and a Steam suggestion asks for idle staff to keep producing (⚠️ forum sources). Cookie Clicker's golden cookie
shows a small bonus that is welcome but never required (wiki.gg page and Alharthi et al., CHI 2018).

**Touches.** `ui/screens/reveal.js` (close hook), `ui/logic/training.js` and `ui/screens/recipe.js` (prefilled plan),
`ui/logic/modelMoney.js`, `ui/logic/compute.js` and `ui/screens/company.js` (toasts), `ui/sfx.js`, `sim/feedLive.js`
(milestone posts), `sim/rivals.js` (the "took #1" event).

**Size** M. **Balance risk** low. Milestones are cosmetic. The nudge may lead human players to train more often,
which the bots already do, so bot results should not move; a playtest shows whether people release more and whether
that raises misalignment endings.

## O4. No word-for-word repeats (safe)

**What it is.** The reveal's five reaction posts come from the model's own traits (the feed's launch reactions in
`sim/feedLive.js` already key on traits such as channel, price and press) instead of the release count. Every dialog
that can repeat in a run (training hazard, cash warning, rival launch toasts) gets a "recently shown" rule and two or
three wordings; a repeat of the same kind plays a quieter, shorter sound.

**How it plays.** The second and third releases read differently because the models differ. Nothing else changes.

**Fixes** problem 5.

**Grounded in.** Reigns removes recently played cards from its draw bag (Alliot, Game Developer). Left 4 Dead shuffles
boss events like a deck and bans the same boss twice in a row (Booth slides). Hades lines repeat only after about 20-30
runs (⚠️ an interviewer's reporting of Greg Kasavin, half the interview read). Klei made repeat notifications of the same type play quieter and shorter.

**Touches.** `ui/screens/reveal.js`, `sim/feedLive.js`, `ui/screens/hazard.js`, `ui/logic/cashWarning.js`,
`sim/data/feedReactions.js` (a few extra variants).

**Size** S. **Balance risk** none.

## O5. A number that only goes up, and era ends that land (medium)

**What it is.**

1. **Lab score.** The Capability badge keeps the lab's best model total and shows the current run's gain as a small
   "+N" riding on it, so the number the player watches never drops to 0.
2. **Era recap that counts up.** Before the Daily Token headline, one strip counts up the era: models shipped, new
   users, cash, rank change against the leader, with a rising tick per item and one chord at the end.
3. **Moving day shows what changes.** The three "what changes" bullets already written in `ui/logic/eraIntro.js` are
   shown on moving day.
4. **The board vote gets sound.** One tick per director's card, a low tone for "remove", the result chord.

**How it plays.** Every six minutes the run gets a ten-second celebration of what the player built, and the new era
tells them what is different before they step inside.

**Fixes** problem 6.

**Grounded in.** Balatro adds a hand's score one card at a time with rising sound, and its designer refuses a score preview
so the player commits and then watches it resolve (Game Maker's Toolkit analysis, read through a fetch summary). Greenheart rebuilt Game Dev Tycoon's review screen with star
animations to heighten the elation (v1.6 patch notes). Two Point Hospital holds a year-end awards ceremony (⚠️ one guide).
Incremental games make growth the reward itself (Pecorella's "Math of Idle Games", tool extract). The peak-end idea,
that people judge an experience by its peak and its end, comes from Kahneman (⚠️ abstract only).

**Touches.** `ui/hud.js`, `ui/logic/training.js`, `ui/screens/recap.js`, `ui/logic/recap.js`,
`ui/screens/eraTransition.js`, `ui/logic/eraIntro.js`, `ui/screens/boardMeeting.js`, `ui/sfx.js`.

**Size** M. **Balance risk** none.

## O6. Era 5 as a final race of weekly checkpoints (experimental)

**What it is.** Era 5 lasts 28 story days at 12.9 s per day, and today a training run takes at least a round, so the
finale has almost no releases. O6 makes era 5 a sprint of four weekly rounds:

- Training in era 5 ships **checkpoints**: a run of one week that adds a slice of capability, ready at the week mark.
- Each week mark plays a **short reveal** (about 10 s): the leaderboard only, your checkpoint and every rival's moving
  at once, then one line of press.
- A **race clock** sits on the HUD for the whole era ("3 weeks to the finish"), so the end is visible from the start.
- The summit and the President's second call become the two scheduled peaks of the era, with quiet weeks between
  them (this works with O1's director).

Sub-choice: the full version above, or only the short weekly leaderboard reveal without changing training.

**How it plays.** The last six minutes become four short build-ups, each ending in a leaderboard moment where the
player sees who is pulling ahead, then the ending.

**Fixes** problem 7, and it is the reward loop for `gn-improve`'s planned "final race for world dominance" and "more
model releases" in eras 4-5.

**Grounded in.** FTL: every jump spends fuel and moves the rebel fleet closer, so the end pressure is always visible
(Ma and Davis via Engadget). Frostpunk puts its storm as a scheduled climax after a quiet build-up (⚠️ one player's
recorded run and forum reports). Citizen Sleeper shows its pressures as visible clocks (⚠️ reviews). Left 4 Dead's
build-up, peak and relax cycle gives the shape of each week.

**Touches.** `sim/recipe.js` and `sim/training.js` (era-5 checkpoint runs), `sim/rivals.js` (weekly rival checkpoints),
`sim/turn.js` (week marks), `ui/screens/reveal.js` (a short variant), `ui/hud.js` (race clock), `sim/scenarios.js`
(era-5 slots), `sim/endings.js` and `tools/balance.js` (bots must learn checkpoints).

**Size** L. **Balance risk** high: capability past 100, the misalignment line at 36 and the ending mix all move. It
needs before-and-after bot runs sized to match existing effects (project memory: check mechanic dynamics) and should
be designed inside `gn-improve`'s era 4-5 round, not built alone.

## O7. Make the loop part of the lesson (experimental)

**What it is.** Two parts, either or both:

1. **"How this game kept you playing"** on the end screen: a short panel listing the reward tools the run used on the
   player, with counts from the run ("4 releases, 23 cards, 3 era recaps"), and the tools it chose not to use
   (no streaks, no daily rewards, no fear-of-missing-out timers), with one sentence on why labs face the same choice
   with their products.
2. **An engagement lever on releases** (sub-choice): a release option "Tune for engagement" that brings more users and
   revenue now, and later costs public trust and raises misuse exposure, the trade-off real chat products face.

**How it plays.** Part 1 adds one panel to the end screen. Part 2 adds one choice to the release dialog and a delayed
consequence through the feed and a card.

**Fixes** nothing measured; it turns the owner's question about the dopamine loop into teaching content.

**Grounded in.** Zagal, Björk and Lewis (2013, read in full) propose disclosure and "manipulation literacy": a pattern
the player understands and consents to stops being dark. Bad News and Harmony Square reward players for using a
manipulation technique, then test whether they spot it elsewhere; Harmony Square's randomized trial found effects of
about d 0.3-0.5 (⚠️ partly read). Universal Paperclips' designer Frank Lantz wants its pull to be "consensual" and its
players to reflect afterward (Y Combinator interview). The research found no game that shows players their own
engagement metrics, and no source on AI labs' engagement tuning was reachable (⚠️), so part 2's real-world framing
needs its own sourcing before copy is written.

**Touches.** Part 1: `ui/screens/end.js`, `ui/logic/ending.js`, a run counter in `sim/state.js`. Part 2:
`sim/release.js`, `sim/data/launch.js`, `ui/screens/release.js`, `sim/data/scenarioEvents.js` (one follow-up card),
`sim/feedLive.js`.

**Size** S for part 1, M for part 2. **Balance risk** none for part 1; medium for part 2 (a new money lever).

## Recommended combination

**O1 (with the quiet backstop) + O2 (all three parts) + O3 + O4 now, in that build order; O5 next; O6 inside
`gn-improve`'s era 4-5 design round; O7 part 1 with O5, part 2 not now.**

Why: O1 fixes both halves of the playtester's complaint (bursts and dead weeks) at the source. O2 and O4 are small
and fix feedback and repetition with no balance risk. O3 fills the quiet stretches with earned beats rather than more
decisions, which keeps the decision count where the measurement put it. O5 is pure polish and can follow. O6 is the
right loop for the finale, but it changes balance and belongs in the era 4-5 redesign. O7 part 1 costs little and
suits a teaching game; part 2 needs its own research first.
