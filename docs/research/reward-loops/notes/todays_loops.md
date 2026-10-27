# Today's loops in Game Night (main 28cdc52, measured 2026-10-26)

Written by the orchestrating session from three sources: a bot measurement on current `main`, a hand-played run in
the real game, and a read-only code inventory by a Sonnet subagent (spot-checked, see the end).

## 1. Clock facts

- One round is 90 s of running clock at ×1 (`ui/clock.js:6`). Each era has four rounds, so every era is 6 minutes of
  clock and a full run is 30 minutes of clock, plus every pause.
- A story day lasts about 1 s in eras 1-2, 3 s in eras 3-4 and 12.9 s in era 5 (`sim/time.js`, `ROUND_DAYS`).
- Every card, dialog and menu stops the clock (`ui/clock.js:49-60`). The real time of an era is about 13-20 minutes
  for a first-time reader (measure.mjs time model, which is an assumption, not a measurement of people).

## 2. The loops, inside out

| Loop | Length at ×1 | What the player does | What pays them back |
|---|---|---|---|
| Moment | 1-10 s | Watch training bubbles fly to the Capability badge; read a toast; open the phone | Small pops and ticks (`ui/screens/training.js:66-82`); "Just now" toast text, no sound |
| Decision | every 50-60 s in eras 1-2 | Answer a scenario card (2-3 costly choices, advisors argue in bubbles) | A "While you were busy" line with one written consequence sentence or a generic "it ended with X"; no numbers, advisors silent afterwards (`ui/logic/events.js:123-134`) |
| Model (core loop) | 1-3 rounds of training (90-270 s) then polish | Plan recipe, train, polish, publish | The release reveal: five benchmark races, a leaderboard climb, four critic cards that flip, reactions, users and sales; about 85 s at full length (`ui/screens/reveal.js`) |
| Era | 6 min of clock | Meet the era goal shown on moving day ("Finish 2nd or better, or within 15 points of the leader, and keep the board's vote"); board vote in eras 2-4 | The Daily Token year-in-review: headline by standing, three biggest calls stamped Paid off / Still costing you / Mixed, leads' comments; then moving day with a new office (`ui/logic/recap.js`, `ui/screens/eraTransition.js`) |
| Run | 30 min of clock, 60-85 min real | Reach one of 11 endings | Ending film and end screen; "Endings found: n of 11" collection on the title screen (`ui/logic/collection.js`, localStorage `gnal.endings.v1`) |

Nothing on the player's side is random: training results, polish, critic scores, users and revenue are pure functions
of choices (`sim/launch.js:59-113`; spot-checked). Randomness lives in which card appears and when, and in feed posts.

## 3. Bot numbers on current main (`node tools/pacing/measure.mjs 40 careful,balanced`, 2026-10-26)

Careful bot / balanced bot, per game. "Prompts" = anything that asks the player something; "pausing" = stops the clock.

| Era | Prompts | Pausing | Per clock minute | Weeks with no prompt | Longest quiet, median (max) | Reveals | Training runs completed |
|---|---|---|---|---|---|---|---|
| 1 | 8.9 / 7.9 | 6.9 / 6.9 | 1.5 / 1.3 | 84% / 86% | 52 s (61) / 56 s (140) | 2 / 1 | 2 / 2 per game |
| 2 | 20.9 / 18.0 | 14.9 / 13.7 | 3.5 / 3.0 | 72% / 73% | 50 s (59) / 53 s (61) | 2 / 1 | 3 / 0 |
| 3 | 15.1 / 12.4 | 9.2 / 10.6 | 2.5 / 2.1 | 48% / 46% | 72 s (96) / 72 s (96) | 3 / 1 | 3 / 1 |
| 4 | 14.0 / 11.1 | 10.0 / 8.5 | 2.3 / 2.1 | 43% / 43% | 66 s (93) / 66 s (93) | 2 / 1 | 1.3 / 1.5 |
| 5 | 9.1 / 8.9 | 8.6 / 6.6 | 1.5 / 2.7 | 0% / 0% | 77 s (90) / 64 s (90) | 0.3 / 1 | 0 / 0.4 |

(Training runs per game are the `runs` counts divided by 40 seeds; `measure.mjs` counts only runs that finish, see
its line 361.) The core loop nearly disappears in era 5: no careful-bot run finishes there and only 0.3 reveals happen
per game, so the finale has almost no release moments. This is bot behaviour; a player could still try to train.

Shape inside an era: era 2's first round holds 7.4-8.2 prompts, its second round 2.1-2.3 (`roundShape`). Same-day
stacks of clock-stopping dialogs: 3.9 (careful) and 2.6 (balanced) per game. The fixed stacks are era transition plus
cash warning (every game), era transition plus summit (every careful game), and President plus training hazard (37 of
40 careful games). Feed posts: 45-81 per era; "Just now" toasts: 9-27 per era.

Endings: careful aligned 39, rival disaster 1; balanced misalignment 26 (11 in era 4), aligned 11, other 3.

## 4. What the hand-played run showed (era 1 and the start of era 2, 2026-10-26)

Played on 127.0.0.1:62190 from this worktree. Lab "Loopwork", model family "Wren". About 6 real minutes for era 1 at
×1 and ×4 with a skipped tour. Eras 3-5 were not played by hand; an autopilot that only answered cards reached the era
2 board meeting before it was stopped, so numbers for later eras come from the bots above.

1. Pre-game: four hiring cards (two candidates each), then the CFO's budget memo. Good set-up beats; the clock waits.
2. First training run: for about 25 s the only motion is the Capability badge ticking from 1 to 3 and a progress bar.
3. The first card arrived at day 47 (about 12 s at ×4). After answering, the only feedback is "Handled: ... it ended
   with 'Fund retention and research time'". I could not tell whether the choice helped.
4. Training finished at about day 105 together with a scenario card and a rival-launch rumour chip: three things in
   one moment, after about a minute with none.
5. The release reveal is the best moment in the game: bars race against the best rival, a "+10 over OpenBrain" chip,
   critics' scores flip, reactions, "+6M new users". It is long (about 7 s per benchmark) but skippable.
6. After the release the office sat idle with "No project". The game does not nudge a second run. The second run was
   blocked: "No run fits the free compute: even the smallest run is 2 units short", fixed by a link to serve fewer
   users. This is the playtester's compute complaint, and it adds a dead beat right after the biggest reward.
7. The second release's reaction posts repeated the first release's posts almost word for word (same handles, same
   "congrats. see you in 6 weeks"). Spot-checked: the reveal picks its five posts by release count, not by the model
   (`ui/screens/reveal.js`, per the inventory; same text seen in two reveals).
8. Era end: The Daily Token recap with "PAID OFF" stamps on my three biggest calls is the first time a choice is
   judged, six minutes after it was made. Then moving day showed the era goal.
9. Era 2, day 455: a scenario card, a cash warning and the President's call (three answers) landed on the same day.

## 5. Gaps the inventory found (spot-checked items marked ✔)

- ✔ The era intro's written "what changes" bullets exist in `ui/logic/eraIntro.js` (`changes:` at lines 17-57) but no
  screen reads them.
- ✔ The board vote is staged one director at a time but has no sound (`ui/screens/boardMeeting.js` imports no sfx).
- The capability badge shows only the current run's gain and drops to 0 after each release, so the lab never sees a
  number that keeps growing.
- A delayed release's go-live, a model paying back its training cost (`ui/logic/modelMoney.js` computes `paidBack`),
  and user milestones happen silently.
- The feed reacts to almost everything the player does, but only behind the phone's badge; there is no push toast.
- Nothing carries across runs except endings found; no best model or personal best.
- The office changes only at era changes; nothing grows as a reward inside an era.

Inventory coverage: the subagent read most named files in full; ⚠️ `sim/data/feedReactions.js` (4,917 lines) was
sampled, `ui/screens/release.js` only lines 1-50, `ui/screens/president.js`, `ui/screens/hazard.js`, `sim/finale.js`
and the ending films only grepped. Its full report is kept outside the repo in the session scratchpad.
