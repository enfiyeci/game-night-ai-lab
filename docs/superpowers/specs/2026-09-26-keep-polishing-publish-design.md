# Keep polishing, then Publish — design spec

**Date:** 2026-09-26 · **Owner:** Arda · **Lane:** `gn-keep-training` (MacBook) · **Branch:** `keep-training` from
`ui` `1a9b246` · **Status:** design approved section by section by the owner on 2026-09-26; plan next.
**Review page:** `https://claude.ai/artifact/G7ntV2cn2Z39oQSpbgVtMd` (copy in `docs/design/mockups/keep-polishing/`).
**Sister lane:** `gn-model-appeal` (Mac mini) turns polish into press, users and money (section 6).

## 1. Problem

The whole training recipe is fixed when a run starts. When the run ends, the model waits in `state.pendingModel` until
a release move, and waiting does not change it. The owner wants success to come from working on a model long enough
and getting it right, "just like game dev tycoon": after training, the lab keeps post-training the model and the player
presses **Publish** when they judge it ready. In the owner's words: "the longer you continue then better you can tune
stuff but also if you wait too long your competitor also has a model out and you get less bubbles after you are done
so improvements are smaller kind of".

Game Dev Tycoon's version (`docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`): after development comes a
bug-fixing phase that runs until the player releases, and players leave some bugs in once fixing stops paying. The same
note records the game's main criticism, that hidden scoring made success feel random. So every gain here is shown.

## 2. Decisions (owner, 2026-09-26)

| Question | Decision |
| --- | --- |
| What an extra stretch improves | Fixes flaws first, then adds polish with shrinking gains. No extra capability. |
| Pacing | Runs on its own on the day clock until the player presses Publish. No click per stretch. |
| Cost | Time plus held compute: the run's units stay busy (no resale, no new run). No cash fee. |
| The "over" and "heavy" lengths | Kept as they are. Length before the run buys capability; polish after it buys fixes and critic score. |
| A new run while polishing | No. One model in the pipeline, as today. |
| Rival warning | A rumor line under Publish; no warning card. |
| Flaw order | The player picks; worst first by default. |
| A flaw kept on purpose | Yes: the player can leave a flaw in (owner, "yes to leave it in"). |
| The polish curve | A fixed rule in fractions of a round, so every era feels the same. |
| Screen | A (Game Dev Tycoon's bug-fixing phase in the HUD), plus D (the calendar strip) when the player clicks the pill, drawn as in the mockups. |

No randomness anywhere in this mechanic (owner rule, 2026-09-26, deterministic endings).

## 3. Rules

1. **Polishing starts when training ends.** `advanceRunBy` resolves the run as today; the new `pendingModel` gets a
   `polishing` block and the run's `units` move to `pendingModel.heldUnits`.
2. **Fixable flaws.** Only three flags are fixable, because post-training created them: `jailbreakWaiting` ("Jailbreaks
   waiting"), `hallucination` ("Confident wrong answers") and `sycophancy` ("Too eager to please"). Flags from data
   choices (`contaminated`, `scraped`, `rivalDistill`) and every other flag are not fixable. `pendingModel.flaws` is the
   fixable flags the model carries, in the default order jailbreak, hallucination, sycophancy.
3. **Fixing.** The first flaw in `flaws` that is not left in is worked on. It is fixed after `FLAW_FIX_ROUNDS = 0.25` of
   a round of polishing time. Fixing removes the flag from `pendingModel.flags` and appends
   `{ flag, day }` to `pendingModel.fixedFlaws`. Fixing `sycophancy` also removes the thumbs-up card's user boost:
   `publicEffects.usersMult` is divided by that card's `usersMult` (1.15). Fixing jailbreak or hallucination removes
   only the flag, so its critic penalty, its safety-score cut and its after-launch events go away; misuse exposure
   already added by the recipe stays.
4. **Order and leave-in are player moves.** Two new instant actions: move a flaw to the top, and mark a flaw left in (or
   take the mark back). Work already done on a flaw is kept per flaw (`progress` in rounds), so reordering never
   wastes it. A left-in flaw ships as it is.
5. **Polish.** When no flaw is left to fix (each is fixed or left in), a polish bubble lands every
   `BUBBLE_ROUNDS = 1/12` of a round. Each bubble adds `BUBBLE_SHARE = 0.2` of the polish still missing:
   `gain = 0.2 × (100 − polish)`. Gains run 20, 16, 12.8, 10.2, 8.2 and so on; about 93 polish after one round;
   100 is never reached. (The mockups used 0.206 per bubble, so they show +21 and +16; the rule uses 0.2.)
6. **Timing.** Polishing time advances every story day, the round-mark day included, by `1 / ROUND_DAYS[era]` of a
   round, in the same daily loop as training (`advanceDays` in `sim/turn.js`). In days: a flaw takes about 23 days in
   eras 1 and 2, about 8 days in eras 3 and 4, and under 2 days in era 5; a bubble lands every 7.6, 2.5 or 0.6 days.
7. **Held compute.** `computeSlices` counts `pendingModel.heldUnits` like a run's units, so they are never idle and
   never resold. Polishing pauses when the training slice falls below `heldUnits`, with the same once-a-round check a
   run uses.
8. **Publish.** Publish is today's release move, opened from the new Publish button (and still from the floor menu).
   Publishing ends polishing, frees the held units, and carries `polish` and `fixedFlaws` onto the released model record.
   Publishing on the day training ends gives exactly today's result: no fixes and 0 polish.
9. **Critic effect.** `scoreLaunch` adds `polish / POLISH_CRITIC_DIVISOR` to the critics' shared base, with
   `POLISH_CRITIC_DIVISOR = 50` (up to +2). This lane adds the term; `gn-model-appeal` keeps it and owns its tuning
   (agreed 2026-09-26, section 6).
10. **Unchanged.** The reward-hacking hazard's "fix" choice and the "retrain" event choice still add their release
    delay. The "over" and "heavy" lengths stay. The release dialog stays as it is.

## 4. What the player sees

All copy speaks in dates and weeks, never turns (owner rule).

- **The pill** (`ui/hud.js`, `project()` in `ui/logic/format.js`): the model's working name, and "polishing · fixing
  flaws" or "polishing · polish 37", with a teal bar for polish. "polishing · paused" when compute is short.
- **A Flaws badge** beside Capability and Alignment: a coral counter of flaws still to fix (left-in flaws do not
  count). Tapping it opens the flaws list under it: each flaw with its state (fixed and the date, being fixed, next,
  left in) and one advisor's line in their own words, not an effect label (owner rule: consequences reach the player
  through characters). Tapping a flaw offers "Work on this next" and "Leave it in" (or "Fix it after all").
- **Publish** under the pill: a coral button, "Publish <model name>", which opens the release dialog.
- **Rival rumor** under Publish, for the next scheduled rival launch (`state.rivalLaunches`): "<Rival> launch rumored
  within ~N weeks". The window is the quarter of a round that holds the launch day, so the true day is never shown;
  N counts whole weeks from today to that window's end (at least 1). When the rival lands, the chip turns solid for a
  few days: "<Rival> launched today · the critics' bar just went up".
- **Bubbles** (`ui/screens/training.js`): a coral check bubble flies from the Safety desk into the Flaws badge when a
  flaw is fixed; a teal bubble labelled with its gain ("+16") flies from the Research desk into the pill when polish
  lands. Same sounds and reduced-motion path as the training bubbles.
- **First time:** Research introduces polishing in a speech bubble at their desk: "Training's done. We'll keep tuning
  it while you decide: <n> flaws to fix first, then polish. Publish whenever it's ready."
- **The calendar strip (D):** clicking the pill opens a strip along the bottom of the screen, drawn as in the mockup.
  Top lane, "You": fixed-flaw blocks, then polish bubbles on their days, sized by their gain, filled up to today and
  dashed after. Bottom lane, "Rivals": launches since polishing began as dots with the rival's name, and each rumored
  launch as a hatched window (the same window as the chip). A coral "today" line with the polish value, date ticks,
  a "Publish now" button, and the left-in flaws named under it. Clicking the pill again, or Escape, closes it.

## 5. Data

```text
state.pendingModel.polishing = {
  flaws: [{ flag, progress, leftIn }],   // fixable flaws still on the model, in working order
  bubbleProgress,                        // rounds spent towards the next bubble
  bubbles: [{ day, gain }],               // polish bubbles so far
  rivals: [{ id, day }],                  // rival launches that landed while polishing
  startedDay,                             // story day training ended
}
state.pendingModel.polish                 // 0..100, stored unrounded, shown rounded
state.pendingModel.fixedFlaws             // [{ flag, day }]
state.pendingModel.heldUnits              // compute units kept busy while polishing
released model record: polish, fixedFlaws // copied at Publish
```

The bubble schedule (days and gains, past and future) is a pure function of this state, so the strip and the bots
read the same numbers the sim uses.

## 6. Interface with `gn-model-appeal`

**Agreed with `gn-model-appeal` on 2026-09-26** (its reply: "Yes: pendingModel.polish 0..100 and fixedFlaws
[{flag, day}] as you proposed, critics += polish/50 as your stand-in in scoreLaunch; I keep that term and own its
tuning"; its spec `docs/superpowers/specs/2026-09-26-model-appeal-design.md` section 10 on branch `model-appeal`).

This lane owns `polish` (0 to 100) and `fixedFlaws` (a list of `{ flag, day }`) on the pending model and on released
models, and how they change over time. `gn-model-appeal` owns how they turn into press, users and money, including the
`polish / 50` critic term this lane adds (rule 9).

## 7. Checks

- **Rule tests** (`tests/`): default order and the fixable set; a quarter round per flaw; reordering keeps progress;
  leave-in skips a flaw and lets polish start; sycophancy's fix removes the user boost; bubble gains 20, 16, 12.8;
  held units are not idle or resold; polishing pauses when compute is short; publishing on the first day matches
  today's release exactly; the stand-in critic effect; no random draw is added.
- **Balance run** (`tools/balance.js`, before and after, same seeds): each bot gets a publish rule. The speed bot
  publishes at once; the balanced bot fixes every flaw, then publishes when the next bubble would add less than 8 or a
  rival launch is rumored within the next bubble; the safety bot waits until the next bubble adds less than 4. Report
  days polished, critic average, rank and endings per bot, and hand the numbers to `gn-model-appeal`, which tunes the
  critic term (the starting point: a full polish worth about as much as the leading rival launching during the wait).
- **Screens** checked in the browser at 1440 × 900: the pill, the badge, the flaws list, the rumor chip, the strip,
  the first-time line, and reduced motion.

## 8. Out of scope

Polishing speed tied to staff or budget; starting a new run while polishing; replacing the "over" and "heavy" lengths;
folding the reward-hacking hazard into the flaws list; how polish sells (lane `gn-model-appeal`).

## 9. Shared files

`sim/training.js` and `sim/release.js` (also lane `gn-model-money`), `sim/launch.js` (also `gn-benchmarks` and the
deterministic-endings plan, Task A5), `sim/split.js`, `sim/turn.js`, `ui/hud.js` (lane `gn-hud-money`),
`ui/screens/training.js`, `ui/logic/format.js`, `ui/styles.css`, `tools/balance.js`. Check the lanes board before each
edit, and rebase onto the newest `ui` before the build starts: `ui` moved to `27bf708` (compute race catch-up rule)
while this spec was written.
