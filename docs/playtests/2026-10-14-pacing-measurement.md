# Decision pacing in AI Lab Tycoon (scenario mode)

Measured 2026-10-14 for the playtest feedback in `docs/playtests/2026-10-14-itch-feedback.md` ("so many decisions ... then weeks when nothing happened"). Build: `main` 17f0192 (the itch.io build). 40 seeds each of the `careful` and `balanced` bots.

Provenance: the measurement and this write-up were produced by a delegated Opus subagent; the orchestrator spot-checked three claims against the code (`ui/clock.js:6,30` 90 s per round; `sim/scenarios.js:19-26` 4–5 cards per era spread evenly; `sim/data/president.js:44-46` second meeting keyed to the last era-4 mark) and they hold. The rest is the subagent's reading; its coverage notes are at the end. Re-run: `node tools/pacing/measure.mjs 40 careful,balanced > out.json` (`FAST=1` for the skimmer time model).

## What counts as a prompt

**Stop the clock until answered:** event cards (scenario, board, internal/training/promise/contract), the screen wall, the board meeting, the President meeting, the Geneva summit, the era transition ("Moving day"), the training hazard, the cash warning (urgent or critical only) and the Geneva deal outcome dialogs. Any `.dialog-layer` or `.menu-layer` also pauses the clock (`ui/clock.js:49-60`), so all of the player's own screens pause it too.

**Ask without pausing:** advisor warning bubbles, the board warning bubble, "training finished, ready to release", Geneva suspicion bubbles and the "Your AI wants to" panel (never fired with these bots).

**Context only, not counted:** "Just now" toasts (17–27 per era), feed posts (44–72 per era), the release reveal and the one-time tour (16 steps, 593 words).

## Per era (careful / balanced)

| Era | Story days | Clock at ×1 | Prompts per game | Per in-game week | Weeks with 0 | Weeks with 4+ | Longest quiet stretch, median | Biggest 7-day burst, median (max) | Per clock minute |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 364 | 6 min (1 s/day) | 6.9 / 5.9 | 0.13 / 0.11 | 87% / 89% | 0% | 77–82 days ≈ 76–81 s (max 94 / 158 s) | 1 (2) | 1.1 / 1.0 |
| 2 | 364 | 6 min | 17.8 / 15.9 | 0.34 / 0.31 | 74% / 75% | 0% | 67–74 days ≈ 66–73 s | 3 (4) | **3.0 / 2.6** |
| 3 | 120 | 6 min (3 s/day) | 12.6 / 12.5 | 0.74 / 0.73 | 47% / 46% | 0.4% / 0.6% | 23–24 days ≈ 69–72 s | 3 (4) | 2.1 / 2.1 |
| 4 | 120 | 6 min | 13.7 / 11.6 | 0.81 / 0.68 | 47% / 44% | 1.8% / 0.2% | 22–23 days ≈ 66–69 s | 3 (4) | 2.3 / 2.0 |
| 5 | 28 | 6 min (12.9 s/day) | 13.7 / 10.7 | 3.4 / 3.9 | 2.5% / 2% | 49% / 57% | 5 days ≈ 64 s | 7 (8) / 5 (7) | 2.3 / 2.9 |

What makes up the bursts: era 2, "training finished" + hazard + President meeting (careful) or era transition + cash warning (balanced); eras 3–4, "training finished" + hazard + a scenario or board card; era 5, scenario cards + Geneva deal dialogs + the screen wall, or President + transition + summit.

Across the whole run, in 60-second slices of running clock: 7% (careful) / 11% (balanced) of minutes have no prompt; 18% / 16% have 4 or more; 10% / 7% have 4 or more that stop the clock. Days with two or more clock-stopping prompts together: 5.0 / 3.3 per game. Careful ended at the end of era 5 in 40 of 40 games, balanced in 37 of 40.

## Real-world time

Measured from the code: a round is 90 s of running clock in every era at default speed, each era has 4 rounds, so every era is 6.0 minutes and a full run 30 minutes of clock. A story week passes in 6.9 s in era 1 and 90 s in era 5. A training run lasts at least one round (`sim/recipe.js:132`).

Assumed (clock paused): first-time reader 230 words/min and 5 s per decision; skimmer 400 words/min and 2 s; board meeting 90/45 s; summit 150/75 s; release reveal 30/12 s; each own action 30/15 s. Card word counts come from the game text; meeting and summit times are guesses.

| Clock paused, minutes | Era 1 | Era 2 | Era 3 | Era 4 | Era 5 | Whole run |
|---|---|---|---|---|---|---|
| Reader, careful | 12.8 | 17.8 | 16.4 | 16.8 | 17.7 | ≈ 85 min (with the tour) |
| Skimmer, careful | 9.4 | 12.0 | 11.2 | 11.4 | 12.0 | ≈ 57 min |
| Reader, balanced | 11.7 | 15.4 | 14.3 | 15.0 | 16.8 | ≈ 76 min |

Reading alone is about 28–30 minutes per run for a first-time reader; scenario cards average 96 words with their three advisor bubbles. An ending at the era-2 board vote comes about 20–30 minutes in, which matches the tester's "20+ minutes".

## The biggest pacing problems

1. **Era 1 is thin.** 5.9–6.9 prompts in 6 minutes, only scenario cards and "training finished"; 87–89% of story weeks empty, quiet stretches up to 94–158 s, first card about 60 s in. Causes: the scenario director makes 4–5 cards per era spread evenly whatever the era's length (`sim/scenarios.js:19-26`); scenario mode drops the older event families (`sim/events.js:107`); board cards, board vote and the President all start in era 2 (`sim/data/eras.js:2`, `sim/data/boardEvents.js:207-210`, `sim/data/president.js:4`).
2. **The era 4 → 5 handover piles up.** Within 2 story days (about 16 s of clock) 4.1–4.6 clock-stopping dialogs: board meeting, then moving day, the President's second meeting and the Geneva summit, sometimes a hazard. Transition, President and summit fell on the same day in 35 of 40 careful games. The President calling just before Geneva is the owner's pick 1C (2026-09-26), so the fix is spacing, not removing it. Causes: `sim/data/president.js:44-46`, checked only at the round mark (`sim/turn.js:332-339`, `sim/president.js:43-49`); the summit opens in era 5's first week (`ui/screens/summit.js:372`); the board meeting opens the day before the mark (`ui/logic/board.js:46`). Era 2's last round is a smaller copy (President's first meeting, two board cards, board warning, board meeting).
3. **The cheating-trace hazard repeats.** Same dialog, same text, about 6.7 times per careful game and 3 per balanced game, always on the "training finished" day, usually the round mark (with the President meeting in 30 of 40 careful games). Causes: rolled every time the recipe qualifies (`sim/hazards.js:17-21`, `sim/training.js:174`); fixed text (`ui/screens/hazard.js:11-24, 66-75`).
4. **Era 2 is a big step up.** From 1.0–1.1 prompts per clock minute in era 1 to 2.6–3.0, the densest era in real time; round 1 of era 2 alone holds about 6.3. Board cards and vote, the President, repeatable contract-trouble warnings (2.7–3 per game, `sim/data/events.js:610-615`, CoreFlame troubled after 12 months `sim/data/compute.js:9`), hazards, and cash warnings partly caused by the bots' own spending.
5. **Era 5 front-loads its prompts.** 4–5 scenario cards with 3-day retries and windows (`sim/scenarios.js:40,48`) and Geneva deal checks at each weekly mark (`sim/turn.js:346-348`, `sim/summit.js:315`); 65–75% of era 5's prompts fall in its first two weeks.

## Caveats

- Bots answer instantly, act mainly at round marks (balanced releases only at marks), never press "Decide later" and never change speed.
- The era-2 cash-warning pause comes from the bots' own budget raise; at day 364 the runway is 4.4–5.5 months, which alone gives only a non-pausing warning.
- Not logged: the polish intro, phone intro, first-open explainers and the board's "going quiet" panel.
- All real-world time beyond the clock is the assumed model above.

## Subagent coverage notes

Read in full: `ui/clock.js`, `ui/game.js`, `ui/main.js`; `ui/screens/` events, briefing, feed, cashWarning, hazard, polish, eraTransition, screenwall, training, deal, racks; `ui/logic/` events, cashWarning, training, summary, president, intro, eraIntro, explainers; `tools/balance.js`, `tools/play-round.js`; `sim/` turn, events, landings, scenarios, time, hazards, president, board; `sim/data/` scenarioEvents, eventTiming, eras.

⚠️ Read only in part: `ui/screens/president.js` (1–80, 300–409), `ui/screens/boardMeeting.js` (200–260, 740–795), `ui/screens/summit.js` (340–389), `ui/screens/company.js` (480–547), `ui/screens/reveal.js` (140–200, 740–771), `ui/screens/intro.js` (140–266), `ui/screens/board.js` (250–345), `ui/logic/board.js` (1–20, 35–102), `ui/logic/compute.js` (560–717), `sim/data/president.js` (1–40), `sim/data/boardEvents.js` (1–80, 190–219), `sim/data/events.js` (605–620), `sim/summit.js` (296–345), `sim/automation.js` (195–225), `sim/feedLive.js` (104–119). ⚠️ Grep only: `sim/data/events6c.js`, `sim/training.js`, `sim/recipe.js`, `sim/contracts.js`, `sim/data/compute.js`.
