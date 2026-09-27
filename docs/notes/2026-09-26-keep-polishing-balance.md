# Keep-polishing balance measurements and build validation

Baseline: `936bd94d6a537288c6e2680b98bee3fb55de457c`, fetched from origin before project changes. After: Task 3 commit `e17da00a6f031ad1a7ac8b7ad7ebe01dc265a624`, on parent `b48a888a68d2ac8091c4a04d481e154eb7d55d51`; measured `tools/balance.js` blob `81d03b0182dd0277232028e88b402e2ceff0e08e`.

Both runs used `node tools/balance.js 200`, seeds 1–200 for each strategy. Raw reports remain at `/private/tmp/keep-polishing-before.json` and `/private/tmp/keep-polishing-after.json`. Baseline was recorded before code changes.

## Balance finding (unchanged after continuation)

Task 3 Step 4 requires stopping if a balance threshold fails; Step 6 also requires stopping if polishing materially increases left-behind endings or worsens rank. Both gates triggered. The owner subsequently authorized continuing the remaining build tasks despite this gate. No test threshold, curve constant, critic divisor, or unrelated balance rule was changed.

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

The owner authorized continuation after the Task 3 report ("you can contunie"). Tasks 1–7 are implemented, one commit per task. Task 8 Step 1 was run; its full-suite pass condition remains unmet only by the two documented balance thresholds. There was no balance tuning.

| Task | Commit | Evidence |
| --- | --- | --- |
| 1 | `90ea1af` | Expected missing-module failure, then 12/12 polishing tests pass. |
| 2 | `b48a888` | Expected integration failures, then 20/20 targeted tests; 995 pass, 0 fail, 4 pre-existing TODOs in full suite. |
| 3 | `e17da00` | Expected missing-export failure; new bot rule test passes, balance suite 9 pass / 2 difficulty failures. Measurements above. |
| 4 | `b7b05a3` | Expected missing-module failure; 37/37 targeted view/time/training/format tests pass. Fractional-quarter rumor boundary regression also failed before correction. |
| 5 | `6c3e213` | HUD checks pass; large/small screenshots, hidden-state checks, no console/runtime errors. |
| 6 | `fd4ade8` | Headless intro, flaw reorder/leave-in/fix, both animations, reduced motion, Publish entry and release cleanup checks pass; no console/runtime errors. |
| 7 | `347aafb` | Headless era-1/era-3 strips, daily updates, click/keyboard toggle, Escape, rival status and Publish checks pass; no console/runtime errors. |
| 8 Step 1 | Commit containing this report update | Full suite: **1003 pass, 2 fail, 4 pre-existing TODOs**, 1009 total. Whitespace and new-color-token checks pass. |

The full-suite failures are exactly the two unchanged balance assertions above. Baseline was 975 pass, 0 fail, 4 TODOs. Final log: `/private/tmp/keep-polishing-task8-full.log`; focused demo log: `/private/tmp/keep-polishing-task8-demo.log` (13/13 pass). The simulation has not changed since the recorded after measurement, so that measurement was not repeated.

### Tests changed and implementation corrections

- Added `tests/polish.test.js` (20 tests), including completion between round marks (no polishing on the completion day) and compute changes within a round.
- Added `tests/ui-polish.test.js` (9 tests), including quarter-window containment for every integer launch day in all five eras. The plan's original rounding missed launches just after fractional boundaries; the corrected calculation keeps them inside the displayed rumor window.
- Appended the planned bot-publication test to `tests/balance.test.js`; no existing balance expectations changed.
- Changed only the safety seed from 1 to 5 in `tests/demo-seeds.test.js`, test **"recording script describes the current compute actions from real strategy runs"**. Waiting to publish means seed 1 no longer reaches a nuclear build; seed 5 reaches it, so the existing nuclear-site assertion is preserved. The failure appeared in the first whole-suite run after Task 3 and the fixture correction passes all 13 demo tests.
- UI corrections found during checking: preserve hidden controls despite flex styles; center the four HUD pieces as in A; block polishing controls during modal flows; prevent the strip's today/title overlap, combine names sharing a rumor window, and bound labels at the track edge.

### Screenshots and visual scope

Screenshots are local, git-ignored files in `shots/`. Used `tools/shot.sh readyToRelease` for 1440×900 and 1000×700 captures, plus a disposable headless Chrome session for interactions and controlled simulation fixtures. The fixture clock stayed paused and advanced one story day per call; animation fixtures explicitly reserved compute. No persistent player state was changed.

| View | Screenshot |
| --- | --- |
| HUD | `shots/polish-task5-hud.png`; `shots/readyToRelease.png`, `shots/readyToRelease-small.png` |
| Research intro | `shots/polish-task6-intro.png` |
| Three-flaw list | `shots/polish-task6-flaws.png` |
| Coral fix and teal polish flights | `shots/polish-task6-flaw-flight.png`, `shots/polish-task6-polish-flight.png` |
| Reduced motion (no flying nodes) | `shots/polish-task6-reduced-motion.png` |
| First-time size naming from Publish | `shots/polish-task6-publish.png` |
| Era-3 strip at start / after fixes and bubbles | `shots/polish-task7-era3-start.png`, `shots/polish-task7-era3-strip.png` |
| Rival landed chip | `shots/polish-task7-rival-landed.png` |
| Era-1 strip after an actual small training run | `shots/polish-task7-era1-strip.png` |
| Main release dialog from Publish now | `shots/polish-task7-release-dialog.png` |

Compared HUD, flaw list, intro, and strip structure with the local A/A-start/A-flaws-open/D mockups. Headless interactions pass. The owner's formal design-skill gate, manual browser-pane review, and audible sound check are **not performed**; Task 8 Steps 2–4 remain with Claude. No Opus pre-merge review, push, or lane messages were performed.

### Branch scope and next action

The branch stays based on the requested `936bd94d6a537288c6e2680b98bee3fb55de457c`. `origin/ui` had advanced to `04650e0ade1b8a57741c3c74d03f112413a2635d` at final checking. Thus `git diff origin/ui --stat` also reports sibling-lane changes absent from this older base; it is not a clean integration comparison. The merge base is `27bf7085ca9544c3522a2b9eb39d609d9fa30b83`. `git diff origin/ui...HEAD --stat` and the diff against the requested starting commit confirm this lane's implementation scope (plus the documented demo-test fixture). No rebase or sibling-lane integration was attempted.

All newly added CSS is after the keep-polishing block at line 4473; the hex/rgb grep finds only pre-existing definitions before that block. No random draws were added to the mechanic.

Next: Claude orchestrator runs Task 8 Steps 2–4, accounts for the newer `ui` changes during integration, and keeps the balance findings visible for owner / `gn-model-appeal` adjudication. The build is locally committed and unpushed.
