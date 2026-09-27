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
