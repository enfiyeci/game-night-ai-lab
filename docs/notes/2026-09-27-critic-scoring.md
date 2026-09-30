# Critic scoring on the combined playable build

Base: `655b945`, combining `ui` and `playtest-fixes`. User asked to ensure critic 10s are not too easy. Changes are uncommitted in `/private/tmp/game-night-complete-playable`, served at port 8801.

The old unbounded benchmark-gain and rival-lead bonuses saturated review scores. Bound those bonuses, retain critic-specific biases and polish, and penalize visible flaws. A 10 additionally requires comparison with a previous flagship, at least 20 benchmark-average points of improvement (after the skipped-version penalty), a 30-point lead over rivals, polish at least 90, and no listed visible flaws, bug flags or contamination. Scores below 10 remain available without those conditions. Concealed safety information is not exposed.

Critic jitter no longer determines displayed ratings. Benchmark jitter is unchanged; this is not a wholesale deterministic-simulation migration. Consume the same random draws and retain the original rounded/clamped economic score separately for adoption and investor sentiment. Public reactions and claims about reviews use the displayed score.

## Measurement

200 seeds per strategy, 800 runs, 1,891 releases / 7,564 individual ratings. Perfect reviews are rare in these scripted cohorts, not guaranteed rare for every possible player strategy.

| Strategy | Before: individual 10s | After: individual 10s | Before: all four 10s | After: all four 10s |
| --- | ---: | ---: | ---: | ---: |
| Balanced | 99.88% | 2.79% | 99.52% | 1.59% |
| Speed | 94.60% | 0% | 83.04% | 0% |
| Safety | 94.70% | 0.99% | 80.79% | 0.99% |
| Random | 92.21% | 0.20% | 81.46% | 0.20% |

All four strategies retain exactly the same ending counts as baseline. The release regression retains the baseline 4,839,226 new users and sentiment 1.2 while public press average falls from 10 to 6.75. The launch regression proves four 10s remain achievable and that first releases, incremental improvements, insufficient polish, and visible flaws cannot get a perfect review. Final focused suite: 72 passed.

Reproduce the final cohort with `node tools/critic-scores.js 200`. Raw before/after counts are in `2026-09-27-critic-measurements.json`. Baseline full-suite failures remain the balanced-strategy win ceiling and spot-only win ceiling; this work does not fix those broader balance issues.

The user's already-loaded tab is not reloaded automatically: reloading resets the current run. Reload manually to use the new scoring.
