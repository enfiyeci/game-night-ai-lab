# Pacing density: what the current game measures (2026-09-26)

Why: after the evening playtest the owner said "the pacing is too slow with nothing happening", and later added
that there are "too few bubbles overall, it's hard to get a sense of progress". This file measures how much real
time passes between things that ask for the player or visibly change, in a normal run on branch `ui` at 04650e0.

Everything here comes from `measure.mjs` in this folder. It plays the game headlessly with the real sim and the UI's
own pure logic helpers. It changes nothing in the game. Run it from the worktree root:

```
node docs/research/pacing-density/measure.mjs 20 balanced,safety,speed attentive   # the numbers below
node docs/research/pacing-density/measure.mjs 20 balanced,safety,speed bot         # the sensitivity check
```

The full printouts are saved beside this file as `output-attentive.md` and `output-bot.md`.

## How time works today (read from the code)

- A round always takes **90 real seconds at ×1** (`ui/clock.js`, `secondsPerRound = 90`). ×2 and ×4 divide that.
- The sim moves one story day at a time. A round is 91 days in eras 1-2, 30 days in eras 3-4 and 7 days in era 5
  (`sim/time.js` `ROUND_DAYS`). So **one story day lasts about 1 s in eras 1-2, 3 s in eras 3-4 and 12.9 s in
  era 5**. Nothing in the sim can change more often than once per story day.
- 20 rounds make a full run: 30 minutes of running clock at ×1, plus whatever time the player spends paused.
- The clock stops whenever a card, a dialog, a menu, the President or the board meeting is open
  (`ui/clock.js` `watch`, `ui/screens/events.js`, `ui/screens/boardMeeting.js`). **Every extra screen pauses the
  clock too**: Money, Compute, the race view, Lab history, the board screen and even Flock, the phone feed, all open
  as a `.dialog-layer`. None of them can be watched while time runs.

What each kind of "beat" is and when it can happen:

| Beat | What the player sees | When the code makes it |
|---|---|---|
| Event card | A card pops up and the clock pauses | Made only at a round mark (`sim/events.js` `eventsTick`), at most 2 at a time (`MAX_CARDS`), then landed on a random day in the first 80% of the next round (`stampNewCards`) |
| Advisor warning | A bubble at an advisor's desk with "Look into it"; no pause | Raised only at a round mark |
| Training complete | "Ready · click the floor to release" and a "Just now" toast | When a run's last day passes |
| President / board meeting | A full meeting screen; the clock pauses | Fixed marks (the President at the end of era 2's third round and at the last era-4 mark; the board on the last day of a vote round) |
| "Just now" toast | A small list top-left: rival releases, compute arriving, contracts ending, lawsuits, era change | On the day the world event lands |
| Training bubbles | Bubbles fly from desks to the Capability and Alignment badges | See the bubble section below |
| Feed post | The phone badge number goes up by one | Posts arrive over the days after an event (`sim/feedLive.js`) |
| Money float | "+$X sales this week / −$Y costs this week" rises beside the money box | Once per story week (`ui/hud.js` `floatWeek`) |

## Assumptions

- **Speed ×1.** All seconds are running-clock seconds. Time spent inside a paused card or screen is not counted,
  because the story does not move then.
- **Players are the balance bots** from `tools/balance.js`: `balanced`, `safety` and `speed`, 20 seeds each (seeds
  1-20), 60 runs in all. The bots die often (the game is tuned so that no strategy wins more than a third), so later
  eras have fewer samples: era 5 was reached by 15 of the 60 runs (78 running minutes in total), and never by the
  speed bot.
- **The "attentive player" wrapper.** The balance bot normally acts once per round. Here it is asked again on any day
  when a card has just landed, a trained model is waiting, or nothing is training. It answers each card on the day
  the card lands. It releases a finished model and starts the next run first, and spends leftover moves on compute
  deals and raises. If its chosen run does not fit in free compute, it tries the next smaller size, as a person
  would. It still obeys the 2-moves-per-round cap and the one-job-per-team rule.
- **Sensitivity check.** The `bot` mode keeps the balance bot's own move order, where a compute deal can take the
  move the next run needed. Its dead gaps are within a few seconds of the attentive numbers; the main difference is
  more time with nothing training (see below).
- The board meeting's deals, the Money planner and other optional screens are not used. They only add paused time.

## Headline: something asks for you about once every 40 seconds, with full-round silences

"Asks" means an event card, an advisor warning, "training complete", or a meeting. All strategies pooled:

| Era | Asks per running minute | Median gap between asks | Typical longest gap in a run | Longest gap in any run | Share of era time spent in stretches over 20 s with no ask | over 45 s |
|---|---|---|---|---|---|---|
| 1 | 1.4 | 41 s | 90 s | 131 s | 89% | 73% |
| 2 | 2.5 | 19 s | 90 s | 136 s | 86% | 55% |
| 3 | 2.6 | 21 s | 69 s | 108 s | 84% | 34% |
| 4 | 1.7 | 24 s | 75 s | 204 s | 88% | 57% |
| 5 | 1.4 | 39 s | 90 s | 116 s | 91% | 71% |

("Typical longest gap" is the median, over runs, of each run's longest gap.)

In plain words: in every era, most of the running time is spent more than 20 seconds away from the last thing that
needed you, and in eras 1, 2 and 5 a typical run has at least one full round (90 s) where nothing asks at all. The
cause is structural. Cards and warnings are only made at a round mark, at most two at a time, and they land at random
days, so they often bunch up and leave a silent stretch.

## When nothing trains, nothing on the main screen moves

"Shows" adds the "Just now" toast and training bubbles to the asks: anything that visibly changes on the office
screen. All strategies pooled:

| Era | Median gap | Typical longest gap in a run | Longest gap in any run | Share of era time in stretches over 20 s | over 45 s |
|---|---|---|---|---|---|
| 1 | 5 s | 34 s | 70 s | 17% | 7% |
| 2 | 3 s | 45 s | 90 s | 31% | 11% |
| 3 | 3 s | 24 s | 60 s | 16% | 0% |
| 4 | 3 s | 39 s | 93 s | 44% | 15% |
| 5 | 13 s | 77 s | 103 s | 70% | 46% |

While a run trains, bubbles fill the gaps (a median of 3-5 s between visible changes). The long gaps are the
stretches with no run:

| Era | Share of time with nothing training (attentive player) | Same, bot's own move order |
|---|---|---|
| 1 | 21% | 34% |
| 2 | 35% | 50% |
| 3 | 21% | 20% |
| 4 | 40% | 24% |
| 5 | 46% | 48% |

Runs stop because compute or cash is short (the most common rejected action was "not enough free compute", 168
times over 60 runs, even after trying smaller sizes), and because both moves of a round were already used.

Era 5 is the quietest era by far: 70% of its running time sits in visible-change gaps over 20 s. Two things combine.
A story day there lasts 12.9 s, so every day-based effect (bubbles, feed posts, money floats) can arrive at most once
per 12.9 s. And nearly half of era 5 has nothing training.

## Ambient motion is plentiful but does not read as "something happening"

"Anything" adds feed posts (the phone badge ticking up) and the weekly money floats:

| Era | Feed posts per minute | Money floats per minute | Longest gap counting everything (any run) |
|---|---|---|---|
| 1 | 11.1 | 8.7 | 7 s |
| 2 | 16.5 | 8.7 | 7 s |
| 3 | 18.6 | 2.8 | 21 s |
| 4 | 13.7 | 2.8 | 21 s |
| 5 | 10.5 | 0.7 | 39 s |

So in eras 1-2 something ticks every few seconds, yet the owner still felt "nothing happening". A number on the
phone and a float by the money box are peripheral. They show change without asking anything or telling a story.
This matters for the options: more ambient noise alone will not fix the feeling.

The money floats also thin out 12× across the game (once per story week: every 7 s in eras 1-2, every 21 s in eras
3-4, every 90 s in era 5).

## Bubbles: about 20 per run early, and none between runs

What decides the count (`ui/logic/training.js`): the Capability badge shows `round(expected gain × run progress)`,
and one bubble flies each time that whole number goes up. So **one bubble is one capability point**. Alignment
bubbles follow the player's alignment slider: `capability × share / (1 − share)`, so a 20% slider adds one
alignment bubble per four capability bubbles. Bubbles in one step leave up to 0.42 s apart
(`ui/screens/training.js`, `gap = min(420, 3600 / spawns)`) and each flight takes 1 s (`ui/fx.js`).

Measured (attentive player, all strategies):

| Era a run started in | Runs | Median run length | Bubbles per run (median) | Bubbles per running minute while training | Median seconds between bubble moments |
|---|---|---|---|---|---|
| 1 | 147 | 90 s | 20 | 13 | 5.9 s |
| 2 | 104 | 90 s | 36 | 21 | 3 s |
| 3 | 86 | 180 s | 52 | 18 | 3 s |
| 4 | 19 | 90 s | 47 | 31 | 3 s |
| 5 | 3 | 90 s | 55 | 37 | 12.9 s |

Averaged over all running time, including the stretches with no run: 8.7 bubbles a minute in era 1, 10.1 in era 2,
15.1 in era 3, 12.6 in era 4 and 4.6 in era 5 (the bot-order check gives 7.6, 8.5, 16.1, 17.9 and 14.8; era 5 has
few samples in both).

Three things keep the bubble feel thin:

1. **The first run, the one a new player judges the game by, has the fewest bubbles**: about 20 over 90 seconds, a
   bubble moment every 6 seconds.
2. **Nothing flies between runs.** Progress that happens every day has no bubble at all: research points (1.2 per
   minute in era 1 rising to 9.6 in era 5), users gained (0.1-0.7 million a minute), compute arriving and money
   earned. Research points in particular are invisible until the player opens the research screen.
3. **In era 5, bubbles come in one burst per story day**, so the screen is still for 12.9 s between bursts even
   during a run.

For comparison, Game Dev Tycoon's first garage games make about 20-36 tech and design bubbles each, plus separate
research and bug bubbles, and a late medium game makes about 2,500 points (see `research.md`). Our first runs match
its first games; the difference is that its count grows about a hundredfold over a playthrough, ours about 2.5×.

## What the numbers suggest (the options are in README.md)

- Asks are capped by construction: at most 2 cards plus warnings per round, all decided at the mark. More asks need
  either more card slots, cards made between marks, or evenly spread landing days.
- Visible change depends almost entirely on a run being active. Idle research time (21-46%) is where the long visible
  gaps live.
- The day is the sim's only tick, so late eras need sub-day cosmetic spreading (bubbles and floats over the 12.9 s
  day) or they will always feel still.
- Extra screens cannot help "while I wait" as long as they pause the clock.

## Limits of this measurement

- Bots are not people. A real first-time player is slower than the attentive wrapper, so real idle time and dead
  gaps are likely longer than these numbers. Treat them as a floor.
- Seconds are running-clock seconds. A player who reads every card carefully spends more wall time, but the story
  is stopped then.
- The "shows" tier treats one toast line as a beat even when it is small, and counts a day with bubbles as one beat
  however many bubbles fly. The "Just now" toast also stays up until replaced, so a new line can go unnoticed.
- Era 4 and 5 samples are smaller (151 and 78 running minutes; only 3 attentive-mode runs started in era 5).
