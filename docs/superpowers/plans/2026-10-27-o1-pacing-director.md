# O1: one pacing director (plan, 2026-10-27)

Step 1 of the reward-loops build (`docs/research/reward-loops/options.md`, O1 with the quiet backstop; Arda's pick
2026-10-26). Baseline: `docs/playtests/2026-10-27-pacing-baseline.md` (every bot game has 4-5 clock-stopping prompts
inside 30 s; the stacks are era change + cash warning, era change + summit, President + training hazard, and cards
landing beside those).

## Shape

One sim module, `sim/pacing.js`, keeps a small ledger in `state.pacing`: the clock-stopping prompts ("stops") of the
last minute, the last day with a decision or a payoff, and the cash warning's checkpoint. Everything is in seconds of
running clock (`clockSeconds(day)` in `sim/time.js`: 90 s per round, so a story day is 90 / `ROUND_DAYS[era]` s), so the
rules hold for any era calendar, including a bigger era 5 or a new era 6.

The director only ever delays what it can move. It never moves the fixed beats (era change at the mark, the board
meeting the day before a vote mark, the summit's own opening day, the first training hazard, Geneva deal news), but it
counts them, and it looks ahead to the fixed ones it can predict.

| Stop | Kind | What the director does |
|---|---|---|
| Scenario card (`sim/scenarios.js`) | movable | waits until the rules allow it, at most to its latest day, where it lands anyway (no card is lost); the quiet backstop can pull the next one forward |
| Other cards (`stampNewCards`, `sim/events.js`) | movable | a card due to land on a blocked day lands a day later, its deadline a day later too, only while that keeps the card inside its round, under its hard deadline caps and, for a board card, clear of its meeting; otherwise it lands as before |
| President (`openDueMeeting`, `sim/turn.js`) | set piece, movable a little | waits while another stop is on the same day ("the day after the hazard"), at most 3 days; a call held past its round's first day lapses a round later, as any mid-round call does |
| Cash warning pause (`ui/logic/cashWarning.js` logic, now tracked in the sim) | movable | when the era change itself makes cash urgent it folds into the era recap as the CFO's last line and does not pause; when the player's own spending makes it urgent after the recap, or on another crowded day, it waits for a free day; the banner shows throughout |
| Era change, board meeting, summit (auto-open) | set piece, fixed | counted; predicted ahead |
| First training hazard, Geneva deal news, cards without a landing day | fixed | counted |

Rules for a movable stop on day d (constants at the top of `sim/pacing.js`, marked as targets from the research):

1. One stop per story day, counting predicted set pieces on that day.
2. At most two stops in any 30 s of running clock, counting predicted set pieces ahead.
3. Cards wait 30 s of clock after a set piece (the relax window; the options file says 30-45 s; 30 keeps the most cards).
   The cash warning and the President skip rule 3.
4. Quiet backstop: after 90 s of clock with no stop, no player decision and no payoff (a finished run, a release, a model
   going live), the next scenario card of the era is pulled forward to today if rules 1-3 allow.

## Not in this step (and why)

- The "2 waiting" chip: cards are delayed in the sim before the player sees them, so nothing visibly waits. No HUD change,
  so nothing to coordinate with gn-phone-redesign there.
- The backstop's non-pausing beat when no card is left (advisor aside or a phone pop-out): new on-screen element and new
  copy; O3's milestone toasts are the planned filler for quiet stretches.
- Set pieces 60 s apart: the President's second call sits 18 s before the era 4 board meeting and 21 s before the era
  change. Meeting it means moving his scheduled day about 11 days earlier, a balance-sensitive owner decision (2026-10-14
  lesson), so it is an open question for Arda, not part of this build.

## Steps

1. `clockSeconds` and `eraStartDay` in `sim/time.js`; cash warning logic moves to `sim/cashWarning.js`, with
   `ui/logic/cashWarning.js` re-exporting it (no UI import changes).
2. `sim/pacing.js` with tests first (`tests/pacing.test.js`): the ledger, the three rules, the lookahead, the backstop.
3. Wire it: `scenarioTick`, `stampNewCards` (records each card's deadline cap), `postLandedCards`, `openDueMeeting`,
   the end of each day and of `applyActions`.
4. UI: the cash warning screen pauses only on a stop the sim recorded; the era recap gets the folded cash line
   (copy marked `// OWNER WRITES`).
5. `tools/pacing/measure.mjs` reads the sim's cash pause when the build has one; it also reports crowding without a
   summit the player opened from the menu (a bot does that on era 5's first day).
6. Before/after: `node tools/pacing/measure.mjs 40 careful,balanced` and `node tools/balance.js 200`; full test suite.
7. One Opus review of step 0 + O1 (combined diff `28cdc52..HEAD` minus A1+A2), fix wave, report.
