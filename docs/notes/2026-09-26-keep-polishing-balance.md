# Keep-polishing balance gate — stopped at Task 3

Baseline: `936bd94d6a537288c6e2680b98bee3fb55de457c`, fetched from origin before project changes. After: the Task 3 commit containing this note, on parent `b48a888a68d2ac8091c4a04d481e154eb7d55d51`; measured `tools/balance.js` blob `81d03b0182dd0277232028e88b402e2ceff0e08e`.

Both runs used `node tools/balance.js 200`, seeds 1–200 for each strategy. Raw reports remain at `/private/tmp/keep-polishing-before.json` and `/private/tmp/keep-polishing-after.json`. Baseline was recorded before code changes.

## Stop finding

Task 3 Step 4 requires stopping if a balance threshold fails; Step 6 also requires stopping if polishing materially increases left-behind endings or worsens rank. Both gates triggered. No test threshold, curve constant, critic divisor, or unrelated balance rule was changed.

- `difficulty target: no scripted strategy wins more than about a third of runs` (`tests/balance.test.js:75`): balanced wins 139/200 (69.5%), above the 36% limit; baseline wins were 61/200 (30.5%).
- `difficulty target: most runs of the extreme strategies end in eras 3 or 4` (`tests/balance.test.js:83`): safety has 66/200 (33%) qualifying failures, below the 50% minimum.
- Safety left-behind endings increased from 9/200 to 105/200; its measured mean rank at the end of era 4 worsened from 1.057 to 1.529.

Balanced wins increased while safety lost much more often to the capability race. Speed outcomes and share of rounds in first place stayed unchanged; random endings stayed unchanged, although its occasional delayed releases acquired polish.

`gn-model-appeal` tunes `polish / 50` from these numbers. Changing the curve constants or accepting new difficulty thresholds needs the owner; no tuning was attempted.

## Before / after measurements

Rank is conditional on runs reaching the era-4 endpoint; a dash means no such sample, not rank zero. First-place share covers observed rounds. The baseline script did not expose polishing or press metrics, so those before values are unmeasured.

| Bot | Mean rank at era-4 end, before → after | First-place rounds, before → after |
| --- | --- | --- |
| speed | — → — | 77.0% → 77.0% |
| safety | 1.057 → 1.529 | 58.3% → 13.4% |
| balanced | 1.625 → 1.056 | 75.3% → 64.0% |
| random | 1.143 → 1.136 | 67.7% → 67.6% |
| overCommitter | 1.083 → — | 63.5% → 37.2% |
| handToMouth | 1.581 → 1.190 | 78.5% → 55.8% |
| balancedNoGrid | 1.822 → 1.098 | 69.6% → 64.6% |
| balancedLowSafety | 1.710 → 1.042 | 76.8% → 67.0% |
| balancedHighSafety | 1.600 → 1.066 | 75.3% → 64.0% |
| balancedPush | 1.631 → 1.041 | 74.6% → 65.8% |
| denier | 1.163 → 1.092 | 74.8% → 63.3% |

| Bot | Days polished / release, after | Polish / release, after | Fixes / release, after | Critic average, after |
| --- | ---: | ---: | ---: | ---: |
| speed | 0.000 | 0.000 | 0.000 | 9.831 |
| safety | 85.108 | 93.492 | 0.128 | 9.911 |
| balanced | 42.129 | 70.720 | 0.496 | 9.982 |
| random | 5.379 | 5.832 | 0.016 | 9.784 |
| overCommitter | 91.000 | 93.128 | 0.000 | 9.991 |
| handToMouth | 75.477 | 81.372 | 0.067 | 9.996 |
| balancedNoGrid | 42.385 | 69.512 | 0.468 | 9.985 |
| balancedLowSafety | 41.380 | 69.640 | 0.490 | 9.978 |
| balancedHighSafety | 42.337 | 70.373 | 0.487 | 9.988 |
| balancedPush | 42.172 | 70.385 | 0.486 | 9.990 |
| denier | 43.328 | 68.878 | 0.464 | 9.976 |

Balanced critic average is 9.982 versus speed 9.831, a difference of +0.150 on the 10-point scale. Both are near the ceiling, and these strategies have different recipes and timing: this aggregate does not isolate whether a full polish offsets a leading rival launch.

| Bot | Endings before (counts / 200) | Endings after (counts / 200) |
| --- | --- | --- |
| speed | boardRemoved: 200 | boardRemoved: 200 |
| safety | acquihire: 165, aligned: 4, leftBehind: 9, misalignment: 2, overtaken: 6, pacingDeal: 7, rivalDisaster: 7 | acquihire: 95, leftBehind: 105 |
| balanced | acquihire: 38, misalignment: 93, overtaken: 1, pacingDeal: 61, rivalDisaster: 7 | acquihire: 11, leftBehind: 3, misalignment: 46, overtaken: 1, pacingDeal: 139 |
| random | acquihire: 144, boardRemoved: 31, misalignment: 11, misuse: 2, rivalDisaster: 12 | acquihire: 144, boardRemoved: 31, misalignment: 11, misuse: 2, rivalDisaster: 12 |
| overCommitter | acquihire: 187, misalignment: 9, overtaken: 1, pyrrhic: 1, rivalDisaster: 2 | acquihire: 200 |
| handToMouth | acquihire: 127, misalignment: 60, overtaken: 3, pacingDeal: 1, rivalDisaster: 9 | acquihire: 198, overtaken: 2 |
| balancedNoGrid | acquihire: 16, misalignment: 112, overtaken: 1, pacingDeal: 68, rivalDisaster: 3 | acquihire: 22, leftBehind: 5, misalignment: 23, overtaken: 2, pacingDeal: 147, rivalDisaster: 1 |
| balancedLowSafety | acquihire: 29, misalignment: 130, overtaken: 1, pacingDeal: 37, rivalDisaster: 3 | acquihire: 28, leftBehind: 4, misalignment: 74, pacingDeal: 93, rivalDisaster: 1 |
| balancedHighSafety | acquihire: 33, misalignment: 93, overtaken: 4, pacingDeal: 66, rivalDisaster: 4 | acquihire: 8, leftBehind: 2, misalignment: 39, pacingDeal: 151 |
| balancedPush | acquihire: 34, misalignment: 107, overtaken: 1, pacingDeal: 49, quietTakeover: 6, rivalDisaster: 3 | acquihire: 11, leftBehind: 6, misalignment: 49, pacingDeal: 134 |
| denier | acquihire: 48, aligned: 1, misalignment: 144, overtaken: 1, pacingDeal: 1, pyrrhic: 1, rivalDisaster: 4 | acquihire: 123, leftBehind: 1, misalignment: 52, overtaken: 2, pacingDeal: 17, pyrrhic: 2, rivalDisaster: 3 |

Every after-run strategy recorded zero rejected actions.

## Validation and continuation

- Clean baseline suite: 975 passing, 0 failing, 4 pre-existing TODOs (979 total).
- Task 1: expected missing-module failure, then 12/12 polishing tests passed; commit `90ea1af`.
- Task 2: expected integration failures, then 20/20 polishing tests passed; full suite 995 passing, 0 failing, 4 pre-existing TODOs (999 total); commit `b48a888`.
- Task 2 adds regressions for a run finishing between round marks (no polishing on its completion day) and compute changes within a round. Existing test assertions were unchanged.
- Task 3: expected missing-export failure, then the new bot rule test passed; balance suite 9 passing and the 2 difficulty failures above. Added only the bot rule test to `tests/balance.test.js`; no existing expectations were altered.
- Full suite was not rerun after the Task 3 stop gate. `git diff --check` passed.
- Tasks 4–7 and Task 8 Step 1 remain unperformed. No screenshots taken; the HUD, flaws list, bubbles, intro, strip, reduced motion and Publish dialog are not checked visually.
- Next: owner / Claude orchestrator adjudicates this balance gate with `gn-model-appeal`. Resume at the Task 3 gate after an approved resolution, then Tasks 4–7 and Task 8 Step 1. Task 8 Steps 2–4 remain with Claude. No push or lane messages were sent.
