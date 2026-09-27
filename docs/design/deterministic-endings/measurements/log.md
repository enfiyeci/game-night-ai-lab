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

Notes:

- before: the careful (safety) bot's out-of-money endings by era are 15 / 3 / 7 / 158 / 5 (eras 1-5), so era 3 is back
  at 7, as it was before the WIP's eras 1-2 launch-users cut (which had moved it to 83).
