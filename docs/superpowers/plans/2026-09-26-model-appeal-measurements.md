# Model appeal sim measurements — 2026-09-27

Implementation worktree: `~/worktrees/game-night-ai-lab-appeal-build`, branch `appeal-build`, base `04650e0ade1b8a57741c3c74d03f112413a2635d`. Owner requested a safe merge after the Opus attempt hit its session limit. The implementation is being committed for an isolated integration merge; `ui` promotion requires resolving the missing-controls limitation. No deployment is included.

Approved plan/spec imported from `d34a6885261476559b141ed0d1c15e35ab3fbdb6` after fetching that exact commit successfully over HTTPS (SSH authentication unavailable).

## Execution decisions

- Owner explicitly requested building now after the prerequisite audit. Model money, benchmarks, constitution and capability cap are in the base. Waiting for deterministic endings and keep-training was waived for this build.
- Existing stochastic launch, rival and hazard rules remain. Appeal mechanics add no random draws. Later deterministic-endings merges must preserve product-based agent risk and product/feature firsts.
- Optional polish defaults to zero. Releases preserve `polish` and `fixedFlaws`; critics apply the agreed `polish / 50` term. Keep-training can supply those fields later; avoid adding that critic term twice at merge.
- The existing benchmark lane made `launchScore` an era-independent skill. Franchise improvement uses that current value so changing benchmark tests cannot manufacture a franchise gain.
- Same-round first claims work in either action order. Delayed releases refresh feature serving multipliers at go-live so an earlier rival launch cannot leave them an unearned discount.
- UI changes are existing readers/labels only. Product picker, fit meter, feature picker, receipt and capacity presentation remain for the separately approved screens plan. Do not merge sim alone.
- Baseline and after runs use exactly seeds 1–200. No numbers were tuned and no failing threshold was weakened or marked TODO.

## Product race

| Policy | Wins / 200 | Share | Mean final valuation ($M) |
|---|---:|---:|---:|
| waveRider | 2 | 1.0% | 151,435.96 |
| nicheSeeker | 31 | 15.5% | 187,474.16 |
| loyalChat | 19 | 9.5% | 202,109.16 |
| featureStacker | 87 | 43.5% | 205,895.92 |
| leanChat | 61 | 30.5% | 218,856.73 |

**Pass:** every product bot wins at least one seed and none wins more than 100. Ties use the plan’s fixed `PRODUCT_BOTS` order.

## Existing difficulty gates

| Gate | Before | After | Limit |
|---|---:|---:|---:|
| Balanced win endings | 62/200 | 96/200 | ≤72/200 |
| Spot-only (`handToMouth`) win endings | 14/200 | 21/200 | ≤20/200 |

Both gates fail after the mechanics change. These remain active failures in `npm test`; tuning requires a separate owner decision. All 16 strategies have zero rejected actions over the 200-seed after run.

## Ending counts

| Strategy | Before | After |
|---|---|---|
| speed | boardRemoved: 167, misalignment: 4, misuse: 29 | boardRemoved: 194, misalignment: 1, misuse: 5 |
| safety | acquihire: 173, aligned: 2, leftBehind: 20, misalignment: 2, pacingDeal: 2, rivalDisaster: 1 | acquihire: 167, aligned: 2, leftBehind: 19, misalignment: 2, pacingDeal: 8, rivalDisaster: 2 |
| balanced | acquihire: 16, aligned: 2, leftBehind: 1, misalignment: 115, pacingDeal: 59, pyrrhic: 1, rivalDisaster: 6 | acquihire: 19, aligned: 4, leftBehind: 17, misalignment: 64, pacingDeal: 92, rivalDisaster: 4 |
| random | acquihire: 154, aligned: 1, boardRemoved: 18, leftBehind: 1, misalignment: 12, misuse: 9, pyrrhic: 1, rivalDisaster: 4 | acquihire: 145, aligned: 1, boardRemoved: 20, leftBehind: 1, misalignment: 23, rivalDisaster: 10 |
| overCommitter | acquihire: 168, misalignment: 25, pyrrhic: 2, rivalDisaster: 5 | acquihire: 128, misalignment: 60, misuse: 1, pyrrhic: 2, rivalDisaster: 9 |
| handToMouth | acquihire: 46, aligned: 10, misalignment: 104, overtaken: 1, pyrrhic: 4, rivalDisaster: 35 | acquihire: 25, aligned: 8, misalignment: 105, pacingDeal: 1, pyrrhic: 12, rivalDisaster: 49 |
| balancedNoGrid | acquihire: 18, aligned: 3, misalignment: 118, pacingDeal: 56, pyrrhic: 1, rivalDisaster: 4 | acquihire: 15, aligned: 1, leftBehind: 22, misalignment: 50, pacingDeal: 112 |
| balancedLowSafety | acquihire: 8, aligned: 2, leftBehind: 7, misalignment: 136, pacingDeal: 43, pyrrhic: 1, rivalDisaster: 3 | acquihire: 18, leftBehind: 26, misalignment: 86, pacingDeal: 65, rivalDisaster: 5 |
| balancedHighSafety | acquihire: 16, aligned: 3, leftBehind: 1, misalignment: 102, overtaken: 1, pacingDeal: 70, pyrrhic: 1, rivalDisaster: 6 | acquihire: 24, aligned: 2, leftBehind: 26, misalignment: 47, overtaken: 1, pacingDeal: 97, rivalDisaster: 3 |
| balancedPush | acquihire: 14, aligned: 1, misalignment: 122, pacingDeal: 52, pyrrhic: 1, quietTakeover: 5, rivalDisaster: 5 | acquihire: 19, leftBehind: 16, misalignment: 81, pacingDeal: 76, pyrrhic: 1, quietTakeover: 4, rivalDisaster: 3 |
| denier | acquihire: 14, misalignment: 174, pacingDeal: 2, pyrrhic: 2, rivalDisaster: 8 | acquihire: 18, misalignment: 156, pacingDeal: 12, pyrrhic: 3, rivalDisaster: 11 |
| waveRider | new probe | acquihire: 20, aligned: 1, leftBehind: 21, misalignment: 79, pacingDeal: 77, pyrrhic: 1, rivalDisaster: 1 |
| nicheSeeker | new probe | acquihire: 3, aligned: 4, leftBehind: 9, misalignment: 75, overtaken: 1, pacingDeal: 107, rivalDisaster: 1 |
| loyalChat | new probe | acquihire: 19, aligned: 4, leftBehind: 17, misalignment: 64, pacingDeal: 92, rivalDisaster: 4 |
| featureStacker | new probe | acquihire: 23, aligned: 2, leftBehind: 17, misalignment: 46, pacingDeal: 107, pyrrhic: 1, rivalDisaster: 4 |
| leanChat | new probe | acquihire: 44, aligned: 2, leftBehind: 4, misalignment: 126, pacingDeal: 12, pyrrhic: 3, rivalDisaster: 9 |

## Per-era ARR ($M)

Mean end-of-era ARR among runs reaching each era checkpoint; absent checkpoints are shown as —.

| Strategy | Era | Before | After |
|---|---:|---:|---:|
| speed | 1 | 587.63 | 351.63 |
| speed | 2 | 1,109.90 | 1,257.26 |
| speed | 3 | 1,899.55 | 3,478.69 |
| speed | 4 | 0.00 | 0.00 |
| speed | 5 | — | — |
| safety | 1 | 336.71 | 317.90 |
| safety | 2 | 587.07 | 524.02 |
| safety | 3 | 511.84 | 693.98 |
| safety | 4 | 2,323.77 | 4,473.76 |
| safety | 5 | 3,109.96 | 6,875.98 |
| balanced | 1 | 542.47 | 813.86 |
| balanced | 2 | 919.25 | 1,465.14 |
| balanced | 3 | 1,908.16 | 3,107.54 |
| balanced | 4 | 2,932.65 | 6,569.71 |
| balanced | 5 | 3,064.29 | 7,190.35 |
| random | 1 | 297.85 | 360.97 |
| random | 2 | 825.77 | 1,088.97 |
| random | 3 | 1,342.92 | 2,467.12 |
| random | 4 | 2,095.01 | 5,065.52 |
| random | 5 | 2,650.10 | 7,468.18 |
| overCommitter | 1 | 544.27 | 511.43 |
| overCommitter | 2 | 927.61 | 1,615.08 |
| overCommitter | 3 | 1,367.37 | 3,756.11 |
| overCommitter | 4 | 2,864.65 | 7,922.40 |
| overCommitter | 5 | 3,018.07 | 11,592.68 |
| handToMouth | 1 | 545.21 | 671.25 |
| handToMouth | 2 | 953.63 | 1,664.95 |
| handToMouth | 3 | 1,958.68 | 5,139.71 |
| handToMouth | 4 | 2,737.22 | 8,104.31 |
| handToMouth | 5 | 3,271.71 | 10,824.02 |
| balancedNoGrid | 1 | 542.47 | 813.86 |
| balancedNoGrid | 2 | 945.63 | 1,469.95 |
| balancedNoGrid | 3 | 2,018.59 | 3,163.63 |
| balancedNoGrid | 4 | 2,919.23 | 6,224.29 |
| balancedNoGrid | 5 | 3,011.68 | 6,566.23 |
| balancedLowSafety | 1 | 542.47 | 813.86 |
| balancedLowSafety | 2 | 962.60 | 1,505.21 |
| balancedLowSafety | 3 | 1,713.52 | 2,919.26 |
| balancedLowSafety | 4 | 2,675.47 | 5,545.18 |
| balancedLowSafety | 5 | 2,591.08 | 5,821.48 |
| balancedHighSafety | 1 | 542.47 | 812.05 |
| balancedHighSafety | 2 | 919.22 | 1,474.01 |
| balancedHighSafety | 3 | 1,889.86 | 2,985.09 |
| balancedHighSafety | 4 | 2,927.44 | 6,242.59 |
| balancedHighSafety | 5 | 3,050.06 | 7,089.72 |
| balancedPush | 1 | 542.94 | 814.31 |
| balancedPush | 2 | 920.09 | 1,465.43 |
| balancedPush | 3 | 1,924.93 | 3,049.25 |
| balancedPush | 4 | 2,930.12 | 6,531.20 |
| balancedPush | 5 | 3,038.98 | 7,433.81 |
| denier | 1 | 550.64 | 515.88 |
| denier | 2 | 957.48 | 1,762.76 |
| denier | 3 | 1,696.31 | 3,619.73 |
| denier | 4 | 3,083.03 | 8,482.64 |
| denier | 5 | 3,313.67 | 10,160.53 |
| waveRider | 1 | — | 813.86 |
| waveRider | 2 | — | 1,520.16 |
| waveRider | 3 | — | 1,638.96 |
| waveRider | 4 | — | 3,832.90 |
| waveRider | 5 | — | 4,508.02 |
| nicheSeeker | 1 | — | 594.30 |
| nicheSeeker | 2 | — | 1,175.44 |
| nicheSeeker | 3 | — | 1,880.73 |
| nicheSeeker | 4 | — | 5,070.99 |
| nicheSeeker | 5 | — | 5,640.86 |
| loyalChat | 1 | — | 813.86 |
| loyalChat | 2 | — | 1,465.14 |
| loyalChat | 3 | — | 3,107.54 |
| loyalChat | 4 | — | 6,569.71 |
| loyalChat | 5 | — | 7,190.35 |
| featureStacker | 1 | — | 813.86 |
| featureStacker | 2 | — | 1,497.25 |
| featureStacker | 3 | — | 3,245.35 |
| featureStacker | 4 | — | 6,850.60 |
| featureStacker | 5 | — | 7,871.18 |
| leanChat | 1 | — | 813.86 |
| leanChat | 2 | — | 1,466.27 |
| leanChat | 3 | — | 3,072.87 |
| leanChat | 4 | — | 7,120.55 |
| leanChat | 5 | — | 8,052.23 |

## First-mover claims and serving pressure (after)

Firsts count seeds in which the player holds the claim, including same-round ties. Press averages all model launches. Serving metrics sample end-of-round demand and capacity. Load is demand / capacity with denominator floor 0.001; exhausted capacity produces large ratios, so the need/allocated columns and limit frequency are more useful than that ratio alone.

| Strategy | Firsts: chat / business / coding / agent / science | Mean press / 10 | Mean load | Need units | Allocated units | Rounds at limit | Mean users at limit |
|---|---|---:|---:|---:|---:|---:|---:|
| speed | 200 / 0 / 0 / 0 / 0 | 9.947 | 0.487 | 30.63 | 29.15 | 21.30% | 15,449,298 |
| safety | 0 / 193 / 0 / 0 / 0 | 9.950 | 0.127 | 16.84 | 16.66 | 0.42% | 7,936,595 |
| balanced | 200 / 0 / 0 / 0 / 0 | 9.878 | 1355.824 | 32.87 | 24.14 | 25.69% | 26,667,866 |
| random | 80 / 104 / 1 / 1 / 1 | 9.824 | 0.220 | 19.08 | 18.33 | 2.01% | 13,576,578 |
| overCommitter | 200 / 0 / 0 / 0 / 0 | 9.850 | 0.415 | 72.86 | 65.05 | 11.61% | 19,125,148 |
| handToMouth | 200 / 0 / 0 / 0 / 0 | 9.562 | 160.412 | 14.23 | 13.31 | 4.30% | 52,929,114 |
| balancedNoGrid | 200 / 0 / 0 / 0 / 0 | 9.909 | 110.630 | 32.26 | 25.10 | 22.82% | 27,554,798 |
| balancedLowSafety | 200 / 0 / 0 / 0 / 0 | 9.873 | 1298.908 | 30.62 | 23.00 | 22.70% | 25,009,079 |
| balancedHighSafety | 200 / 0 / 0 / 0 / 0 | 9.912 | 1345.145 | 31.02 | 22.40 | 25.43% | 25,121,463 |
| balancedPush | 200 / 0 / 0 / 0 / 0 | 9.842 | 1388.381 | 32.65 | 23.89 | 24.86% | 24,179,870 |
| denier | 200 / 0 / 0 / 0 / 0 | 9.790 | 0.775 | 51.74 | 41.24 | 31.81% | 22,802,107 |
| waveRider | 200 / 0 / 8 / 0 / 0 | 9.918 | 1660.690 | 32.20 | 23.54 | 28.71% | 21,497,507 |
| nicheSeeker | 0 / 200 / 0 / 0 / 0 | 9.787 | 653.368 | 23.21 | 20.62 | 19.40% | 8,757,872 |
| loyalChat | 200 / 0 / 0 / 0 / 0 | 9.878 | 1355.824 | 32.87 | 24.14 | 25.69% | 26,667,866 |
| featureStacker | 200 / 0 / 0 / 0 / 0 | 9.906 | 1457.412 | 39.26 | 29.23 | 28.30% | 29,080,670 |
| leanChat | 200 / 0 / 0 / 0 / 0 | 9.744 | 1436.849 | 30.94 | 22.51 | 23.90% | 21,973,707 |

Press is already close to the cap without active polishing. Keep-training’s future polishing behavior needs a fresh balance run, especially for the `bigClaim` promise and sentiment.

## Validation and remaining work

- Baseline `npm test`: 1,042 passed, zero failed, five existing TODOs (1,047 total).
- Product/fit and integration suites: 40 passed, including franchise holds, delayed feature firsts, critic separation, optional polish, efficiency reactions and wave announcements.
- Final integrated `npm test`: **1,091 passed, 2 failed, 5 existing TODOs** (1,098 total; 76.75s). The only active failures are the two difficulty gates above. All functional tests pass. `git diff --check` is clean.
- `node tools/balance.js 200`: baseline and after JSON saved beside this report under `docs/design/model-appeal/measurements/`.
- Scenario fixtures now use a bounded deterministic search of real playthroughs for the live summit/second-meeting target. Successful original paths and actual seed/history are preserved.
- Owner explicitly authorized the external Opus review on 2026-09-27 ("you can"). The read-only Claude CLI attempt then exited with: "You've hit your session limit · resets 11pm (America/Los_Angeles)". No review was completed and no verdict was produced. External-sharing approval is already granted; retry after the Claude session limit resets without asking for that permission again. No substitute Codex review was performed.
- Next: resolve the two difficulty gates with an owner-approved retune; retry the authorized Opus review after the Claude session limit resets; reconcile later dependency merges; then proceed to separately approved screen mockups/plan.

## Commands

```sh
npm test
node --test tests/appeal.test.js tests/appeal-integration.test.js
node tools/balance.js 200
git diff --check
```
