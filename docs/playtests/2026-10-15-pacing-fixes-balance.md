# Pacing fixes: bot balance before and after (2026-10-15)

This file records what the playtest-pacing review fixes did to the bots. It compares three builds:

- **main**: `17f0192`, the live itch.io build. It was run from a `git archive` copy, not a checkout.
- **branch**: `39669f5`, the five pacing fixes before review.
- **final**: `8895772`, after both review fix waves.

The final build has these rules:

- The President's call and the Geneva summit never use a team action. They still keep their team busy: you (the CEO) for the call, Policy for the summit.
- A move over the two-action cap is skipped on its own, and the moves after it still run.
- The summit waits for a free Policy team.
- Every scenario card keeps its full answer window, and the schedule no longer squeezes out a card. (A card can still go unplayed if no scenario is eligible near the era's end, as before.)
- The bots follow the same rules as players.

Commands: `node tools/balance.js 200` (200 seeds per bot) and `node tools/pacing/measure.mjs 40 careful,balanced` (40 seeds).
The raw outputs are in `/private/tmp/claude-501/pacing-fix/` (`main-*.txt`, `before-*.txt`, `final-*.txt`), which is
scratch space and not kept.

## Endings per bot (`balance.js`, 200 seeds)

| Bot | main 17f0192 | branch 39669f5 | final 8895772 |
|---|---|---|---|
| speed | misalignment 198, misuse 2 | misalignment 193, misuse 7 | misalignment 193, misuse 7 |
| safety | acquihire 198 (195 in era 2), leftBehind 2 | acquihire 11, leftBehind 189 | acquihire 193 (all in era 2), leftBehind 4, overtaken 1, pacingDeal 2 |
| balanced | aligned 26, misalignment 147, leftBehind 12, pyrrhic 5, acquihire 5, overtaken 3, rivalDisaster 2 | aligned 24, misalignment 152, leftBehind 13, acquihire 4, overtaken 3, pyrrhic 3, rivalDisaster 1 | aligned 41, misalignment 139, leftBehind 13, pyrrhic 4, overtaken 3 |
| careful | aligned 196, overtaken 3, rivalDisaster 1 | aligned 190, rivalDisaster 5, overtaken 4, acquihire 1 | aligned 174, overtaken 21, rivalDisaster 5 |
| carefulNoGrid | overtaken 199, rivalDisaster 1 | aligned 71, overtaken 129 | aligned 1, overtaken 199 |
| random | acquihire 161, boardRemoved 17, misalignment 14, leftBehind 3, misuse 3, rivalDisaster 2 | acquihire 158, misalignment 18, boardRemoved 12, leftBehind 6, rivalDisaster 4, misuse 2 | acquihire 174, misalignment 9, boardRemoved 8, leftBehind 3, misuse 3, rivalDisaster 3 |
| overCommitter | acquihire 200 | acquihire 200 | acquihire 200 |
| handToMouth | rivalDisaster 103, overtaken 74, aligned 22, misalignment 1 | rivalDisaster 158, misalignment 28, leftBehind 10, overtaken 4 | rivalDisaster 57, overtaken 57, aligned 45, misalignment 41 |
| balancedNoGrid | misalignment 86, overtaken 66, aligned 34, pyrrhic 11, rivalDisaster 3 | misalignment 87, overtaken 66, aligned 33, pyrrhic 11, rivalDisaster 3 | same as branch |
| balancedLowSafety | misalignment 186, aligned 10, overtaken 2, pyrrhic 1, rivalDisaster 1 | misalignment 189, aligned 7, overtaken 2, pyrrhic 1, acquihire 1 | misalignment 187, aligned 9, overtaken 2, pyrrhic 2 |
| balancedHighSafety | misalignment 129, aligned 35, pyrrhic 15, acquihire 12, rivalDisaster 8, overtaken 1 | misalignment 141, aligned 28, pyrrhic 15, acquihire 11, rivalDisaster 4, overtaken 1 | misalignment 126, aligned 53, pyrrhic 18, overtaken 3 |
| balancedPush | misalignment 146, aligned 27, leftBehind 12, pyrrhic 6, acquihire 5, overtaken 2, rivalDisaster 2 | misalignment 150, aligned 24, leftBehind 13, pyrrhic 5, acquihire 4, overtaken 3, rivalDisaster 1 | misalignment 139, aligned 40, leftBehind 13, pyrrhic 5, overtaken 3 |
| denier | misalignment 146, aligned 17, overtaken 15, leftBehind 14, pyrrhic 5, rivalDisaster 3 | misalignment 146, leftBehind 19, overtaken 15, aligned 15, pyrrhic 3, rivalDisaster 2 | misalignment 131, aligned 31, leftBehind 19, overtaken 15, pyrrhic 4 |

No bot had a rejected action in any build.

## Pacing (`measure.mjs`, 40 seeds)

On main, the script falls back to its old-build assumptions: the summit opens with the era transition, and its words are an assumed count.

| Metric | Bot | main | branch | final |
|---|---|---|---|---|
| Endings | careful | aligned 40 | aligned 37, rivalDisaster 2, overtaken 1 | aligned 34, overtaken 5, rivalDisaster 1 |
| Endings | balanced | misalignment 27, aligned 6, pyrrhic 2, acquihire 2, other 3 | misalignment 29, aligned 5, acquihire 2, other 4 | misalignment 26, aligned 11, other 3 |
| Era 5 scenario card answer windows (days) | both | 3 | 1, 2 or 3 | 3 |
| Era 1 / era 2 longest stretch with no prompt (max days) | careful | 94 / 93 | 62 / 60 | 62 / 60 |
| Era 2 prompts per game | careful | 17.8 | 18.4 | 20.4 |
| Era 2 player moves per game | careful | 7.3 | 5.9 | 8.6 |
| Era 5 prompts per game | careful | 13.7 | 11.4 | 9.7 |
| Era 5 weeks with 4+ prompts | careful | 49% | 23% | 18% |
| Era 5 weeks with 4+ prompts | balanced | 62% | 49% | 41% |
| Era 5 player moves per game | careful | 6.2 | 5.7 | 3.8 |
| Same-day pausing stacks per game | careful / balanced | 5 / 2.7 | 4 / 2.4 | 4.3 / 2.5 |
| Estimated real minutes, era 2 | careful | 17.8 | 17.4 | 19.3 |
| Estimated real minutes, era 5 | careful | 17.7 | 15.2 | 13.8 |
| Clock minutes to the end (median) | careful / balanced | 30 / 25.5 | 30 / 25.5 | 30 / 25.5 |

## What drives the big shifts

Most of the "branch to final" swing comes from one change: the President's call no longer uses one of the round's two actions. The branch had moved the first call to era 2's second round, and there it cost an action. That was an accident that held the bots back. With the call free, most bots look like main again.

- **Safety bot dies of cash in era 2.** In the round with the first call, the bot now signs a compute deal next to its training run. Before, the call took that slot. The deal drains its cash and it is bought out in era 2 (acquihire 193). This matches main, where it was bought out in era 2 in 195 of 200 runs.
- **handToMouth (spot compute only) wins 22.5%.** The second call is taken in the summit week. While it cost an action, this bot had no slot left for the summit: it went in 3 of 184 runs on the branch, and 102 of 200 now. Going to Geneva cuts its rival disasters, so its wins (aligned) went from 0 to 45. On main it already won 22 of 200 (11%).
- **careful and carefulNoGrid.** Here the shift comes from the rule itself, not from how the bots plan. A round with a set piece no longer counts as fully used, so the careful bots' daily run-and-release step starts more runs and signs more deals. They end stronger, but the rivals race further ahead too:
  - careful: aligned 190 → 174, overtaken 4 → 21.
  - carefulNoGrid: falls back to its main result, overtaken 199 of 200.
- **Balanced-family bots win more** (aligned 24 → 41 for balanced). They now reach the summit in the week the second call is taken: balanced went in all 132 runs that reached era 5, against 88 on the branch.
- **Era 5 pacing is calmer.** Era 5's cards keep their full three-day window, and the schedule drops none. Fewer weeks pile up four or more prompts.

## Known balance items

- **The "renting only spot almost never wins" check fails.** That is `tests/compute-balance.test.js`, which caps handToMouth at 10% wins; it gets 45 of 200 here. The check already failed on main (22 of 200). The owner chose to keep the rule (bots play like real players) and to change no tuning here. This is handed to the gn-rebalance lane, which retunes on the combined build.
- **The misalignment line differs between builds.** It is 35 here (`sim/release.js` `MISALIGNMENT_LINE`) and 38 on the `rebalance` branch, so these numbers will move when the two builds are combined.
