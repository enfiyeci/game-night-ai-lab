# Pacing baseline before the pacing director (2026-10-27)

Step 0 of the reward-loops build (`docs/research/reward-loops/options.md`, picks O1-O4). It records where the bots
stand on the two numbers the pacing director (O1) is judged by, before any of O1-O4 is built.

- **Crowding** (`crowd30s`): the most clock-stopping prompts inside any 30 s of running clock. Target: at most 2.
- **Quiet** (`quietSeconds`): the longest stretch of running clock with neither a decision nor a visible payoff.
  Target: about 90 s. A decision is any prompt the tool logs or one of the player's own moves; a payoff is a release
  reveal, a "Just now" toast or a finished training run. Feed posts do not count.

Both use story-day resolution: everything on one day sits at that day's clock time, so prompts that share a day count
as inside the same 30 s.

Command: `node tools/pacing/measure.mjs 40 careful,balanced` (40 seeds per bot), on `improve` at `dd5a659` and, with
`REPO` pointed at it, on `main` at `28cdc52`. The two outputs match exactly, so the A1 and A2 test changes did not move
pacing. The 200-seed bot baseline for the same commit is the `balance.js 200` run kept with the gn-improve handoff
(`~/claude-sync/handoffs/enfiyeci-game-night-ai-lab/artifacts/gn-improve-a1a2-done/balance-a1a2.json`); its endings
match `main` for all 13 bots.

## Crowding

| Bot | Most in any 30 s, median / p90 / max | Same-day stacks per game | Most common stacks (games out of 40) |
|---|---|---|---|
| careful | 4 / 4 / 4 | 3.9 | era change + cash warning 40, era change + summit 40, President + training hazard 37 |
| balanced | 4 / 5 / 5 | 2.6 | era change + cash warning 43, era change + summit 24, cash warning + card 9 |

Every game breaks the 2-in-30-s target. The stacks are the set pieces the options file names (era change with the
cash warning or the summit, the President with the hazard); scenario cards make up most of the rest.

## Quiet

Longest stretch with no decision and no payoff, in seconds of running clock (median / p90 / max):

| Era | careful | balanced |
|---|---|---|
| 1 | 47.5 / 53.4 / 55.4 | 48.5 / 56.4 / 58.4 |
| 2 | 45.5 / 51.4 / 51.4 | 47.5 / 51.4 / 59.3 |
| 3 | 60 / 66 / 66 | 57 / 66 / 66 |
| 4 | 48 / 60 / 63 | 51 / 66 / 66 |
| 5 | 77.1 / 90 / 90 | 64.3 / 77.1 / 77.1 |
| Whole game | 77.1 / 90 / 90 | 64.3 / 77.1 / 77.1 |

With the player's own moves and payoffs counted, no bot goes past 90 s, and the longest stretches are in era 5. The
prompt-only gaps the tool already reported are longer (era 1 up to 139.5 s for the balanced bot), so the quiet that
players feel is a stretch without prompts, partly covered by the bots' own moves at each round mark. A human who does
not act at every mark sees something closer to the prompt-only numbers.
