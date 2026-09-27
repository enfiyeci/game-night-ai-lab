# Deterministic endings: measurements log

Base: `deterministic-endings` at 94b4703 (merge of `origin/ui`), plus Task 0's D1 pick (a): White House outside
testers cost a one-round release wait from era 3 on and nothing in eras 1-2. Each row is `node tools/balance.js 200`
(200 runs per bot); the raw JSON for each row sits next to this file as `<label>.json`.

Ending counts per bot:

| label | bot | endings |
|---|---|---|
| before | speed | boardRemoved 200 |
| before | safety | acquihire 188, leftBehind 11, pacingDeal 1 |
| before | balanced | pacingDeal 63, misalignment 102, acquihire 28, aligned 1, rivalDisaster 6 |
| before | random | acquihire 149, rivalDisaster 8, misuse 3, boardRemoved 25, aligned 1, misalignment 14 |
| before | overCommitter | acquihire 195, misalignment 5 |
| before | handToMouth | acquihire 129, aligned 1, misalignment 58, pyrrhic 2, rivalDisaster 10 |
| before | balancedNoGrid | pacingDeal 70, misalignment 109, acquihire 17, aligned 3, rivalDisaster 1 |
| before | balancedLowSafety | misalignment 140, pacingDeal 28, acquihire 29, rivalDisaster 2, aligned 1 |
| before | balancedHighSafety | pacingDeal 72, misalignment 86, acquihire 37, aligned 1, rivalDisaster 3, pyrrhic 1 |
| before | balancedPush | pacingDeal 51, acquihire 29, misalignment 103, quietTakeover 10, aligned 1, rivalDisaster 6 |
| a1 | speed | boardRemoved 200 |
| a1 | safety | acquihire 184, leftBehind 14, misalignment 1, pacingDeal 1 |
| a1 | balanced | misalignment 110, pacingDeal 57, acquihire 32, aligned 1 |
| a1 | random | acquihire 143, boardRemoved 35, aligned 1, rivalDisaster 4, misalignment 16, misuse 1 |
| a1 | overCommitter | acquihire 190, misalignment 10 |
| a1 | handToMouth | misalignment 50, acquihire 133, aligned 1, pacingDeal 5, pyrrhic 2, rivalDisaster 9 |
| a1 | balancedNoGrid | acquihire 21, pacingDeal 59, misalignment 119, pyrrhic 1 |
| a1 | balancedLowSafety | misalignment 149, pacingDeal 32, acquihire 16, pyrrhic 2, rivalDisaster 1 |
| a1 | balancedHighSafety | acquihire 33, pacingDeal 69, misalignment 93, rivalDisaster 2, aligned 3 |
| a1 | balancedPush | acquihire 39, misalignment 108, pacingDeal 45, rivalDisaster 2, quietTakeover 3, aligned 2, pyrrhic 1 |
| a2 | speed | boardRemoved 200 |
| a2 | safety | acquihire 184, leftBehind 14, misalignment 1, pacingDeal 1 |
| a2 | balanced | misalignment 110, pacingDeal 57, acquihire 32, rivalDisaster 1 |
| a2 | random | acquihire 144, boardRemoved 34, rivalDisaster 4, misalignment 14, misuse 4 |
| a2 | overCommitter | acquihire 190, misalignment 10 |
| a2 | handToMouth | misalignment 51, acquihire 134, aligned 1, pacingDeal 5, rivalDisaster 9 |
| a2 | balancedNoGrid | acquihire 21, pacingDeal 59, misalignment 119, rivalDisaster 1 |
| a2 | balancedLowSafety | misalignment 151, pacingDeal 32, acquihire 16, rivalDisaster 1 |
| a2 | balancedHighSafety | acquihire 33, pacingDeal 69, misalignment 93, rivalDisaster 4, aligned 1 |
| a2 | balancedPush | acquihire 39, misalignment 110, pacingDeal 45, rivalDisaster 3, quietTakeover 2, aligned 1 |
| a3 | speed | boardRemoved 200 |
| a3 | safety | acquihire 184, leftBehind 14, misalignment 1, pacingDeal 1 |
| a3 | balanced | misalignment 104, pacingDeal 56, acquihire 34, rivalDisaster 6 |
| a3 | random | acquihire 143, boardRemoved 39, rivalDisaster 2, misalignment 13, misuse 3 |
| a3 | overCommitter | acquihire 191, misalignment 8, rivalDisaster 1 |
| a3 | handToMouth | acquihire 142, misalignment 49, pacingDeal 1, rivalDisaster 8 |
| a3 | balancedNoGrid | acquihire 16, pacingDeal 54, misalignment 128, rivalDisaster 2 |
| a3 | balancedLowSafety | misalignment 137, pacingDeal 38, acquihire 21, rivalDisaster 4 |
| a3 | balancedHighSafety | misalignment 79, pacingDeal 69, acquihire 40, rivalDisaster 12 |
| a3 | balancedPush | misalignment 113, pacingDeal 50, acquihire 31, rivalDisaster 6 |
| a4 | speed | boardRemoved 200 |
| a4 | safety | acquihire 184, leftBehind 14, misalignment 1, pacingDeal 1 |
| a4 | balanced | misalignment 104, pacingDeal 56, acquihire 34, rivalDisaster 6 |
| a4 | random | acquihire 143, boardRemoved 39, rivalDisaster 2, misalignment 13, misuse 3 |
| a4 | overCommitter | acquihire 191, misalignment 8, rivalDisaster 1 |
| a4 | handToMouth | acquihire 142, misalignment 49, pacingDeal 1, rivalDisaster 8 |
| a4 | balancedNoGrid | acquihire 16, pacingDeal 54, misalignment 128, rivalDisaster 2 |
| a4 | balancedLowSafety | misalignment 139, pacingDeal 36, acquihire 21, rivalDisaster 4 |
| a4 | balancedHighSafety | misalignment 79, pacingDeal 69, acquihire 40, rivalDisaster 12 |
| a4 | balancedPush | misalignment 113, pacingDeal 50, acquihire 31, rivalDisaster 6 |
| a6 | speed | boardRemoved 200 |
| a6 | safety | acquihire 184, leftBehind 14, misalignment 1, pacingDeal 1 |
| a6 | balanced | misalignment 98, pacingDeal 59, acquihire 36, rivalDisaster 7 |
| a6 | random | acquihire 143, boardRemoved 39, rivalDisaster 2, misalignment 13, misuse 3 |
| a6 | overCommitter | acquihire 191, misalignment 8, rivalDisaster 1 |
| a6 | handToMouth | acquihire 142, misalignment 49, pacingDeal 1, rivalDisaster 8 |
| a6 | balancedNoGrid | acquihire 16, pacingDeal 54, misalignment 128, rivalDisaster 2 |
| a6 | balancedLowSafety | misalignment 139, pacingDeal 34, acquihire 21, rivalDisaster 6 |
| a6 | balancedHighSafety | misalignment 78, pacingDeal 69, acquihire 43, rivalDisaster 10 |
| a6 | balancedPush | misalignment 111, pacingDeal 50, acquihire 33, rivalDisaster 6 |
| a7 | speed | boardRemoved 200 |
| a7 | safety | acquihire 184, leftBehind 14, misalignment 1, pacingDeal 1 |
| a7 | balanced | misalignment 98, pacingDeal 59, acquihire 36, rivalDisaster 7 |
| a7 | random | acquihire 144, boardRemoved 40, rivalDisaster 2, misalignment 11, misuse 3 |
| a7 | overCommitter | acquihire 191, misalignment 8, rivalDisaster 1 |
| a7 | handToMouth | acquihire 142, misalignment 49, pacingDeal 1, rivalDisaster 8 |
| a7 | balancedNoGrid | acquihire 16, pacingDeal 54, misalignment 128, rivalDisaster 2 |
| a7 | balancedLowSafety | misalignment 139, pacingDeal 34, acquihire 21, rivalDisaster 6 |
| a7 | balancedHighSafety | misalignment 78, pacingDeal 69, acquihire 43, rivalDisaster 10 |
| a7 | balancedPush | misalignment 111, pacingDeal 50, acquihire 33, rivalDisaster 6 |
| a8 | speed | boardRemoved 200 |
| a8 | safety | acquihire 184, leftBehind 14, misalignment 1, pacingDeal 1 |
| a8 | balanced | misalignment 98, pacingDeal 59, acquihire 36, rivalDisaster 7 |
| a8 | random | acquihire 144, boardRemoved 36, rivalDisaster 3, misalignment 14, misuse 3 |
| a8 | overCommitter | acquihire 191, misalignment 8, rivalDisaster 1 |
| a8 | handToMouth | acquihire 142, misalignment 49, pacingDeal 1, rivalDisaster 8 |
| a8 | balancedNoGrid | acquihire 16, pacingDeal 54, misalignment 128, rivalDisaster 2 |
| a8 | balancedLowSafety | misalignment 139, pacingDeal 34, acquihire 21, rivalDisaster 6 |
| a8 | balancedHighSafety | misalignment 78, pacingDeal 69, acquihire 43, rivalDisaster 10 |
| a8 | balancedPush | misalignment 111, pacingDeal 50, acquihire 33, rivalDisaster 6 |
| m1 | speed | boardRemoved 172, misuse 25, misalignment 3 |
| m1 | safety | acquihire 171, leftBehind 20, rivalDisaster 5, pacingDeal 3, misalignment 1 |
| m1 | balanced | pacingDeal 69, misalignment 111, acquihire 12, rivalDisaster 8 |
| m1 | random | misalignment 19, misuse 8, acquihire 146, boardRemoved 18, leftBehind 2, rivalDisaster 7 |
| m1 | overCommitter | acquihire 172, misalignment 20, rivalDisaster 6, misuse 2 |
| m1 | handToMouth | misalignment 111, rivalDisaster 46, acquihire 41, pacingDeal 2 |
| m1 | balancedNoGrid | pacingDeal 58, misalignment 122, rivalDisaster 4, acquihire 16 |
| m1 | balancedLowSafety | misalignment 143, pacingDeal 32, leftBehind 8, acquihire 13, rivalDisaster 4 |
| m1 | balancedHighSafety | pacingDeal 86, misalignment 92, acquihire 12, rivalDisaster 10 |
| m1 | balancedPush | pacingDeal 58, misalignment 126, rivalDisaster 4, acquihire 12 |
| m1 | denier | misalignment 182, acquihire 11, pacingDeal 5, rivalDisaster 2 |
| a5 | speed | boardRemoved 171, misuse 26, misalignment 3 |
| a5 | safety | acquihire 166, leftBehind 14, misalignment 7, pacingDeal 5, rivalDisaster 5, aligned 3 |
| a5 | balanced | misalignment 126, pacingDeal 57, rivalDisaster 9, acquihire 8 |
| a5 | random | acquihire 147, boardRemoved 21, misalignment 19, rivalDisaster 6, misuse 5, leftBehind 2 |
| a5 | overCommitter | acquihire 176, misalignment 21, rivalDisaster 2, misuse 1 |
| a5 | handToMouth | misalignment 100, rivalDisaster 52, acquihire 48 |
| a5 | balancedNoGrid | misalignment 125, pacingDeal 55, acquihire 18, rivalDisaster 2 |
| a5 | balancedLowSafety | misalignment 143, pacingDeal 33, leftBehind 7, acquihire 12, rivalDisaster 5 |
| a5 | balancedHighSafety | pacingDeal 81, misalignment 97, rivalDisaster 11, acquihire 11 |
| a5 | balancedPush | misalignment 135, pacingDeal 53, acquihire 8, rivalDisaster 4 |
| a5 | denier | misalignment 181, acquihire 14, rivalDisaster 4, pacingDeal 1 |
| a9 | speed | boardRemoved 186, misuse 10, misalignment 4 |
| a9 | safety | acquihire 189, pacingDeal 2, leftBehind 1, aligned 3, rivalDisaster 1, misalignment 4 |
| a9 | balanced | pacingDeal 29, misalignment 165, acquihire 5, rivalDisaster 1 |
| a9 | random | acquihire 150, boardRemoved 23, misalignment 15, misuse 5, leftBehind 1, rivalDisaster 6 |
| a9 | overCommitter | acquihire 176, misalignment 24 |
| a9 | handToMouth | misalignment 162, rivalDisaster 16, acquihire 21, pacingDeal 1 |
| a9 | balancedNoGrid | pacingDeal 21, misalignment 173, acquihire 5, rivalDisaster 1 |
| a9 | balancedLowSafety | misalignment 164, leftBehind 9, pacingDeal 19, acquihire 8 |
| a9 | balancedHighSafety | pacingDeal 35, misalignment 156, acquihire 9 |
| a9 | balancedPush | pacingDeal 26, misalignment 165, acquihire 6, quietTakeover 3 |
| a9 | denier | misalignment 195, acquihire 5 |
| a10 | speed | boardRemoved 186, misuse 10, misalignment 4 |
| a10 | safety | acquihire 193, pacingDeal 2, leftBehind 1, aligned 3, rivalDisaster 1 |
| a10 | balanced | pacingDeal 20, misalignment 177, acquihire 3 |
| a10 | random | acquihire 148, boardRemoved 23, rivalDisaster 9, misalignment 14, misuse 5, leftBehind 1 |
| a10 | overCommitter | acquihire 175, misalignment 25 |
| a10 | handToMouth | misalignment 181, rivalDisaster 7, acquihire 12 |
| a10 | balancedNoGrid | pacingDeal 13, misalignment 184, acquihire 3 |
| a10 | balancedLowSafety | misalignment 168, leftBehind 9, pacingDeal 15, acquihire 8 |
| a10 | balancedHighSafety | pacingDeal 27, misalignment 168, acquihire 5 |
| a10 | balancedPush | pacingDeal 21, misalignment 175, acquihire 4 |
| a10 | denier | misalignment 198, acquihire 2 |
| p1 | speed | boardRemoved 185, misuse 15 |
| p1 | safety | acquihire 196, aligned 2, leftBehind 1, pacingDeal 1 |
| p1 | balanced | misalignment 174, acquihire 10, pacingDeal 16 |
| p1 | random | acquihire 168, boardRemoved 17, misalignment 12, rivalDisaster 3 |
| p1 | overCommitter | acquihire 199, misalignment 1 |
| p1 | handToMouth | acquihire 85, misalignment 113, rivalDisaster 1, aligned 1 |
| p1 | balancedNoGrid | misalignment 186, pacingDeal 9, acquihire 5 |
| p1 | balancedLowSafety | misalignment 184, acquihire 9, pacingDeal 7 |
| p1 | balancedHighSafety | misalignment 165, pacingDeal 25, acquihire 10 |
| p1 | balancedPush | misalignment 175, acquihire 9, pacingDeal 16 |
| p1 | denier | misalignment 194, acquihire 6 |

Notes:

- before: the careful (safety) bot's out-of-money endings by era are 15 / 3 / 7 / 158 / 5 (eras 1-5), so era 3 is back
  at 7, as it was before the WIP's eras 1-2 launch-users cut (which had moved it to 83).
- a1 (Task A1, event pop-ups and advisor noise on their own per-round streams, salts 970 and 971): no outcome rule
  changed; the main generator no longer feeds event triggers or advisor noise, so which events appear reshuffles once
  and every bot moves a little, as expected. The largest moves are small counts: balanced rivalDisaster 6 to 0,
  balancedPush quietTakeover 10 to 3, random boardRemoved 25 to 35, balancedLowSafety acquihire 29 to 16. No bot's
  leading ending changed.
- a2 (Task A2, misuse on the second round in a row over both lines, rival disaster on the third round in a row above
  heat 85, both counted instead of rolled): the speed bot is unchanged (the board removes it in all 200 runs, as before, so
  neither line ever decides its runs). Across all bots, rivalDisaster goes from 18 to 23 and misuse from 1 to 4 (all random bot),
  while pyrrhic goes from 6 to 0 and aligned from 8 to 3. The expected drop did not appear: a 20% roll let some runs sit
  above heat 85 for several rounds and still finish, while the count ends every run that stays there three rounds.
  Likely (not traced run by run) the lost pyrrhic and aligned endings are those late runs. Left for the retune (C3).
- a3 (Task A3, the quiet-takeover story as a running total of the per-round risk in `state.automation.pressure`, one
  stage each time it reaches 1; the log-sampling proposal offered every round monitors run): quiet takeovers go from 2
  to 0 (balancedPush was the only bot with any). The speed and random bots never reach even the first internal warning
  (largest running total in 200 runs: 0.90 for speed, 0.43 for random), so neither can end in a quiet takeover. In
  balancedPush, 49 of 200 runs reach stage 1 or higher and 5 reach stage 3, but none adds up to the fourth crossing it
  needs at capability 70 in era 4 (largest stage plus running total: 3.65). Removing this draw from the main random
  stream also reshuffles later rolls a little (misalignment, rivalDisaster), as expected; no bot's leading ending changed.
  Aligned endings go from 3 to 0 across all bots (one each in handToMouth, balancedHighSafety and balancedPush at a2);
  at these counts that is within the reshuffle, not traced run by run. Left for the retune (C3).
- a4 (Task A4, the summit's checks decide by level: a break by you is caught exactly under outside testers or
  inspectors, a rival's break is caught under the same levels, a sign is always left, and looking into a real sign
  finds it from self-reports up; a rival's weekly urge to break and a false alarm add up as running totals in
  `state.deal.breakPressure` and `state.deal.alarmPressure`; no noise on the vote): negotiated-pace (pacingDeal)
  counts are unchanged for the safety bot (1) and the balanced bot (56). Only balancedLowSafety moved: pacingDeal 38
  to 36, misalignment 137 to 139. Traced run by run (seeds 61 and 98): the same two cards bind in both builds, and the
  run ends in misalignment during era 5 instead of reaching the pace ending. The misalignment check on an agentic
  release is still a roll on the main random stream (a later task), and dealWeek no longer draws from that stream,
  so that roll lands differently. Across balancedLowSafety's 57 summits, removing the vote noise changed which cards
  bind in none of them; the lists of signers still in the deal at the end differ in 33. Two things feed that and were
  not split apart: the vote without noise can seat different signers, and rivals now break only once their running
  total reaches 1 (then always caught under testers or inspectors) where before each week was a fresh roll. The pace
  ending reads only which cards bind and whether you broke the deal, so these differences do not move the counts.
- a6 (Task A6, power sites have fixed terms: sizes are the middle of the old ranges rounded to 10, grid 350, gas 450,
  nuclear 300; a grid reservation arrives one round into era 4 when made in era 2 and three rounds in when made in era
  3, the rounded averages of the old draws; a nuclear restart opens on time at US favor 60 or more and one round late
  otherwise (D8); pushing through local opposition cuts the gas site 30% exactly when public trust is below 50 at the
  moment of the choice (D2)): only the four bots that reserve the grid in era 2 moved (balanced, balancedLowSafety,
  balancedHighSafety, balancedPush). Their grid is now always 350 units one round into era 4, where before it was
  250-450 units at the start of era 4 or one round later. balanced: misalignment 104 to 98, pacingDeal 56 to 59,
  acquihire 34 to 36, rivalDisaster 6 to 7; balancedLowSafety: pacingDeal 36 to 34, rivalDisaster 4 to 6;
  balancedHighSafety: acquihire 40 to 43, rivalDisaster 12 to 10, misalignment 79 to 78; balancedPush: misalignment 113
  to 111, acquihire 31 to 33. The site-building bots (speed, overCommitter on gas, safety on nuclear, random on either)
  and the no-grid bots keep the same ending counts, although their site sizes and dates did change. The old site draws
  came from side streams, so removing them shifts no other roll. No bot's leading ending changed. Not traced run by run.
- a7 (Task A7, rerun after the review ruling: a President promise that contradicts a line the constitution holds leaks
  on its fifth such round, `promise.contradictRounds` against `LEAK_ROUNDS = 5`, counted only in rounds where the old
  roll rolled; a stated term like D5, because a first build with a running total of the old 0.15 a round never
  reached 1 in play): only the random bot's counts moved (acquihire 143 to 144, boardRemoved 39 to 40, misalignment
  13 to 11), and the raw JSON matches the first build's run byte for byte. Only the speed and random bots ever take
  President promises. Runs with at least one leaked promise over the same 200 seeds (N picked as the one closest to
  the old roll's speed count, 93 at a6, within 1-5): N=1 speed 200, random 9; N=2 174, 7; N=3 174, 7; N=4 170, 7;
  N=5 162, 4; for reference N=6 gives 0 and 0 (no open contradicting promise lasts six such rounds), and the running
  total gave 0 and 0. Leaks do not change any bot's ending counts (speed still ends boardRemoved in all 200 runs), so
  random's small moves are the reshuffle from no longer drawing this roll from the main random stream.
- a8 (Task A8, board-event outcomes and the pooling risk follow the lab's state, D2: "Send a cleaned-up version" leaks
  the full report exactly when staff trust is below 50, `BALANCE.boardRequestLeakStaffTrust`; "Give a long interview"
  gives +6 public trust when hidden debt, alignment plus concealed, is under 40 and -6 otherwise; refusing Washington's
  compute pool marks supply-chain risk when US favor is below 40 after the refusal's own -8): measured on top of
  3d24f3b (A7's review fix, fifth-round leak). A run of 3d24f3b alone gives exactly the a7 counts, so every move below
  is this task's. Only the random bot's counts moved: boardRemoved 40 to 36, rivalDisaster 2 to 3, misalignment 11 to
  14. The other bots never take these three choices: the safety and balanced bots take the first choice (send, reply,
  accept), and the speed bot takes the last (stall, ignore, refuse) but ends boardRemoved in all 200 runs either way.
  The board stream still picks which board card is made, with the same first draw as before, so which card pops up
  did not change. The old pooling draw came from a side stream (salt 7, now unused), so removing it shifts no other
  roll. Not traced run by run.
- m1 (new base: merged origin/ui 04650e0 (capability cap, model-money, benchmarks, constitution), merge commit
  6456335): rows from here on compare against m1, not a8, because the merge brings many rule changes at once
  (capability counting past 100 with every danger reader capped at 100, benchmarks by era, model money, the era-3
  constitution, the compute race's rival deals, and ui's balance moves). The moves from a8 are not attributed to any
  one of them and were not traced run by run. The larger ones: the speed bot now ends in misuse in 25 runs (0 at a8)
  and boardRemoved in 172 (200); handToMouth's leading ending changed from acquihire (142) to misalignment (111), with
  rivalDisaster 8 to 46; balancedHighSafety's pacingDeal rose from 69 to 86 (misalignment 78 to 92, still its leading
  ending); acquihire fell in every balanced bot except balancedNoGrid (for example balanced 36 to 12; balancedNoGrid
  stayed at 16). The `denier` bot is new
  from origin/ui and has no a8 row.
- a5 (Task A5, launch benchmarks and press carry no noise, rule shape 3 average: the five draws in `scoreLaunch` were
  ±2 on the shown safety score, ±5 on the rival safety score, ±3 on each shown and each rival capability score, and ±1
  on each critic, all averaging to 0, so each is dropped): compared against m1. Several counts moved more than a
  handful: balanced misalignment 111 to 126 and pacingDeal 69 to 57; balancedPush misalignment 126 to 135;
  handToMouth misalignment 111 to 100 and acquihire 41 to 48; the safety bot gains 3 aligned endings and 6
  misalignment endings. To split the rule from the reshuffle, a scratch copy removed the noise but still drew the
  same five numbers in the same order and threw them away (not committed): every bot then lands within 4 of m1
  (largest: overCommitter acquihire 172 to 176 and misalignment 20 to 17; balanced, balancedNoGrid, balancedPush and
  speed identical to m1). So the noise itself decided almost nothing; the larger moves above come from no longer
  drawing 14 numbers per release (2 for the safety row, 2 for each of the 4 capability rows, 1 for each of the 4 critics) from the main random stream, which shifts every later roll on that stream.
  No bot's leading ending changed. Not traced run by run.
- a9 (Task A9 with its review fix, training hazards follow the recipe: reward hacking always happens on a hackable
  recipe (stated condition, spec "always happen when the causing choice is made"; was a 50% roll); the two web-crawl
  data cards are always sued at their full listed cost, scraping $200M and filtered $120M, and licensed or synthetic
  data never (D4, rule `legal.chance >= 0.3`); loss spikes: a run meets exactly one loss spike, on its first advance,
  when the spike risk its recipe chose (card spike terms plus the focus term, `run.spikeRisk`) is above 0, so
  stability engineering's -0.1 cancels mixture-of-experts' +0.1 (review ruling: stated condition, replacing the first
  build's per-run running total, which never reached 1 and zeroed spikes)): compared against a5. Rows are the fixed
  build (81a655c plus the fix, measured on a scratch export without Task A10's uncommitted edits). No bot's leading
  ending changed. Large moves: balanced misalignment 126 to 165 and pacingDeal 57 to 29; handToMouth misalignment 100
  to 162, rivalDisaster 52 to 16, acquihire 48 to 21; every other balanced probe's misalignment rises by 21 to 59
  (balancedHighSafety 97 to 156); denier 181 to 195; the safety bot's leftBehind 14 to 1 (acquihire 166 to 189); speed
  misuse 26 to 10 and boardRemoved 171 to 186. Split with scratch copies of the first build (not committed), each
  still drawing the old numbers in the old order so no roll reshuffles: reward hacking alone gives the misalignment
  surge (balanced 167, handToMouth 155, balancedHighSafety 151): hazards per 200 runs roughly double (balanced 442 to
  838), and the balanced bots answer every hazard with "ignore", which adds rewardHackSize (4 + 2 x era) of visible
  debt each time. The lawsuit rule alone moves every bot by at most 9 (balanced misalignment 117, pacingDeal 62).
  The safety bot's leftBehind drop comes, by elimination, from its loss spikes ending: its recipe (licensed data, no
  risky card) chooses no spike risk, so it never spikes now. Games with at least one loss spike over 200 seeds
  (before, the roll, at 1393e49 / first build, running total / fixed build): speed 143 / 0 / 196, safety 119 / 0 / 0,
  balanced 84 / 0 / 0, random 49 / 4 / 76, overCommitter 53 / 0 / 194, handToMouth 66 / 0 / 0, balancedNoGrid 76 / 0
  / 0, balancedLowSafety 80 / 0 / 0, balancedHighSafety 77 / 0 / 0, balancedPush 85 / 0 / 0, denier 50 / 0 / 0. In
  bot play (seed 1 checked) the balanced bot pairs mixture-of-experts with stability engineering (risk 0), while
  overCommitter's era 2 recipe has mixture-of-experts without it (only two pre-training slots) and speed picks
  sparse MoE, so those two spike. Against the first build only speed and random moved (speed misuse 35 to 10); the
  other nine bots are identical. Lawsuits from training data, runs sued at least once (before / after): speed 146 /
  200, safety 37 / 0, balanced 183 / 200, and every bot that trains on filtered or scraped data is now sued on every
  model (balanced 397 cases, $47.6B in total over 200 runs, to 1238 cases, $148.6B). Not traced run by run.
- a10 (Task A10, misalignment is a line, not a roll, stated condition from the spec: an agent release in era 3 or
  later goes wrong exactly when hidden debt, alignment plus concealed, times capability counted up to 100
  (`dangerCapability`, owner pick A) over 100 is at least `MISALIGNMENT_LINE = 40`, the old sigmoid's even-chance
  point in the same units; in era 3 that is the warning incident, from era 4 the ending; was a roll on
  `sigmoid((score - 40) / 8)`): compared against the a9 rows as re-measured with the A9 review fix (9b48ef7). Measured
  on a scratch snapshot whose sim, tools and ui files equal 9b48ef7 plus this task; the a9 rows were reproduced
  exactly from the same snapshot with this task's five source files restored. No bot's leading ending changed. Every
  balanced bot's misalignment rises and its pace-deal count falls: balanced misalignment 165 to 177 and pacingDeal 29
  to 20, balancedNoGrid 173 to 184 (pacingDeal 21 to 13), balancedHighSafety 156 to 168 (pacingDeal 35 to 27),
  balancedPush 165 to 175 (its 3 quietTakeover are gone), balancedLowSafety 164 to 168, denier 195 to 198; handToMouth
  misalignment 162 to 181 (rivalDisaster 16 to 7, acquihire 21 to 12). The safety bot's 4 misalignment endings are
  gone (acquihire 189 to 193): its era 4 agent releases score about 6, where the old roll still hit about 1 time in
  70. Speed is unchanged; random and overCommitter move by at most 3. Why the balanced bots rise: their era 4 agent
  releases score about 47 (median, from debt before the round, so slightly low), over the line, and the roll let about
  1 in 9 of those releases through (era 4 and 5 agent releases that did not end the run: balanced 21 to 0,
  balancedNoGrid 24 to 0, balancedHighSafety 19 to 0, balancedPush 21 to 0, denier 22 to 0, handToMouth 65 to 28,
  safety 217 to 222). Era 3 warning incidents, runs with at least one over 200 (a9 fixed build / a10): speed 196 / 196
  (one each, the only bot that ships agents in era 3 as a rule; all 4 of its misalignment endings follow one), random
  1 / 1, every other bot 0 / 0 (none ships an agent in era 3). Not traced run by run.
- p1 (Task P1, the press gives 10s only to outstanding releases, owner: "getting all 10s should be harder": a critic's
  raw score, the shared base plus its bias, counts in full up to `PRESS_KNEE = 8` and at `PRESS_TOP_SLOPE = 0.1` above
  it before rounding, so a 9 needs a raw 13 and a 10 a raw 23; scores at 8 or below are unchanged): compared against
  a10. Measured on scratch exports: c844afe (A9 review round 2) alone reproduces the a10 JSON exactly, and c844afe plus
  this task gives the same ending counts as e265872 plus this task (only random's era 3-4 compute bills differ, in the
  fourth digit). The brief's starting slope 0.4 was measured and rejected: raw critic scores run about 10-26 in era 1
  and 12-42 in eras 2-3 (10th to 90th percentile, four main bots), so with 0.4 (a 10 at raw 11.75) all four critics
  still gave 10 on 57-76% of each bot's releases (was 77-98%). Other slopes, share of releases with all four at 10 per
  bot: 0.2 44-63%, 0.15 19-58%, 0.1 1-37%, 0.07 0-28% (0.07 prints 8 on nearly every era 1 release, means 8.0-8.5, and
  overCommitter never sees a 10 in 200 runs). No bot's leading ending changed, but the endings move more than a handful,
  because the press feeds users and money (`sim/release.js`: users x `1 + (pressAvg - 6) / 8`, sentiment +
  `(pressAvg - 6) / 20`) and the average critic score falls from about 10 to 8.1-9.1 in era 1 and 8.5-10 in eras 2-3; era 1 revenue
  (ARR at era end) drops 14-16% for every bot and most later eras drop 5-17% (a few rise, from which runs survive).
  Out-of-money endings come sooner: the safety bot's acquihires in era 3 go 1 to 46 (era 5: 55 to 12; mean era 4.29 to
  3.83); handToMouth misalignment 181 to 113 and acquihire 12 to 85 (72 of them in era 2, was 6); overCommitter
  misalignment 25 to 1 (198 of its 200 runs sell in era 2, was 163); random acquihire 148 to 168. The balanced bots move
  by at most 16 (balancedLowSafety misalignment 168 to 184). Slope 0.2 moves the same endings about half as far (safety
  era 3 acquihires 22, handToMouth misalignment 163). Not traced run by run.
