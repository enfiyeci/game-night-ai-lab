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
