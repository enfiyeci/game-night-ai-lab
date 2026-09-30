# Combined-game balance

Worktree: `/private/tmp/game-night-combined-balance`. Base `655b945`, with the completed critic-scoring changes and the verified tour, cash warning, scenario/event and compute-preview integration. The product/feature layer is removed, the serving/summit/finale corrections are retained, and deterministic-endings `5fc19363d58be4fdd1b31628083ae15571431d1f` is integrated. The original checkout and the user's active preview are not modified. No commit or push has been made.

## What is measured

The balance runner now enables the same scenario mode as a new game. It answers timed cards during the round instead of silently taking timeout defaults, respects team availability, and uses public actions. The careful policy can publish or start training between round marks, like a player. Ending witnesses record the day and exact actions; replay has no policy RNG or injected state. Runs with rejected actions are excluded from reachability evidence.

Earlier balance measurements used legacy events or a different build and are not measurements of this combined game. Event selection/timing and cosmetic/advisor streams remain seeded; benchmarks, public reviews, economic review reception, rival progress/gains, contract terms, safety failures and summit outcomes have no outcome dice. Complete scenario-mode runs are tested with a throwing main RNG.

## Integration and tuning decisions

- Keep the completed bounded public critic formula and its exceptional-release eligibility. Economic reception reads the uncurved rounded/clamped average, preserving the P1 separation. Do not stack the older P1 display curve. The isolated P1 patch separately reproduced the entire a10 report exactly; integrated gameplay deliberately changes ending distributions.
- Preserve actual serving fulfillment in revenue, earnings, growth and forecasts. Zero serving cannot generate revenue. Outage losses accumulate by elapsed month.
- Training techniques scale with model size for both player and rivals; late chip batches fit a grid reservation. Bots reserve near-term contract bills before taking more capacity.
- Deterministic deals use rank for allocation, free site power with a 30% floor for LOI delivery, race heat 55 for tight-era spot withdrawal, and actual elapsed contract months for CoreFlame refinancing. CoreFlame warnings work in scenario mode, occur during month 12 before the contract expires, and refinancing restarts the clock. LOI previews show the powered delivery and bill, not two identical random-bound projections.
- Misalignment uses the existing visible/hidden-debt × capped-capability mechanism, with the warning/end line tuned from 40 to 35. Era 3 still warns; catastrophic outcomes start in era 4. The careful strategy retains low debt rather than receiving an exception.
- An attempted rival catch-up increase from 0.5 to 0.8 was reverted: the 40-run sample cut careful aligned outcomes to 6/40 without achieving a healthy general difficulty. No extra era-1 rival pressure was added.
- The careful policy was repaired before changing game constants: adequate staff allocation, era-appropriate safety compute, principles training when available, external evals (the same group as full internal evals, so they cannot be selected together), prompt publishing near reviews, affordable scenario responses, and a limited compute agreement. This is an ordinary selectable strategy, not a privileged mode.
- Coalitions must retain real rival/government backing. Final epilogue choices appear for surviving endings and describe tangible consequences.

## Calibration checks revised explicitly

The former late-death quotas for extreme strategies are not retained. Buying unaffordable multiyear contracts from the start should be allowed to fail early, and maximal safety spending without a commercial plan can run out of money early. Tests now assert the distinct failure modes instead of requiring a fixed era of death.

The grid comparison now compares whole-run success for the careful policy with and without grid investment, rather than rank conditional on surviving to an era boundary. Conditional survivor rank previously hid the no-grid failures. The late compute-cost ceiling moves from 70% to 95%: fixed GPU-month pricing and growing fleets make infrastructure dominate late budgets; tests still require meaningful people spending and a substantial compute share. These are changed calibration expectations, not newly passing evidence for the old targets.

The general scripted-win ceiling remains 36%, spot-only remains at most 10%, lower safety must cause materially more catastrophic outcomes, all policies must avoid rejected actions, and the deliberately careful policy must reach aligned in at least 120/200 runs.

## Final shortened validation

At the user's request to finish within ten minutes, the final reported cohort uses 40 seeds per policy (520 runs), rather than claiming a fresh 200-seed calibration report. All 520 runs finish with zero rejected actions.

| Policy | Outcomes (40 runs) |
|---|---|
| speed | 40 misalignment |
| safety | 39 acquihire, 1 leftBehind |
| balanced | 6 aligned, 27 misalignment, 2 pyrrhic, 1 rivalDisaster, 2 acquihire, 1 overtaken, 1 leftBehind |
| careful | 40 aligned |
| carefulNoGrid | 40 overtaken |
| random | 36 acquihire, 1 boardRemoved, 2 misalignment, 1 misuse |
| overCommitter | 40 acquihire |
| handToMouth | 15 overtaken, 22 rivalDisaster, 3 aligned |
| balancedNoGrid | 20 misalignment, 13 overtaken, 4 aligned, 2 pyrrhic, 1 rivalDisaster |
| balancedLowSafety | 38 misalignment, 1 rivalDisaster, 1 aligned |
| balancedHighSafety | 8 aligned, 2 rivalDisaster, 23 misalignment, 4 pyrrhic, 3 acquihire |
| balancedPush | 7 aligned, 26 misalignment, 2 pyrrhic, 1 rivalDisaster, 1 overtaken, 2 acquihire, 1 leftBehind |
| denier | 5 aligned, 27 misalignment, 1 pyrrhic, 2 rivalDisaster, 4 leftBehind, 1 overtaken |

CoreFlame now costs 1.1 per unit-month rather than 0.75: the previous rent undercut owned chips even before their power cost. Combined with tight-era spot withdrawal at heat 55, the paired careful policy now demonstrates a concrete benefit from power investment. The general balanced policy wins 8/40; spot-only wins 3/40. Low-safety catastrophes are 38/40 versus 23/40 with high safety. Compute shares rise from 51% in era 1 to 91% in era 5.

The careful policy was also corrected to fix a discovered hazard before a mid-round release and to reserve its two summit actions when the meeting opens. These are strategy corrections, not player bonuses. A careful scripted policy winning 40/40 demonstrates a repeatable route; it does not estimate first-time human win rates.

The final regression repair cancels queued President follow-up calls when the promise is fulfilled before the call lands, and matches calls by promise identity after array positions change. Previously a stale card could repeatedly reject every answer. Paid scenario responses now budget against remaining cash; the harness stops immediately when a daily choice ends the game.

Team actions now have an explicit tour step (two shared actions, one per team, examples and team assignments) plus persistent menu help showing the next reset date, the training exception and free actions. Browser verification confirmed the help is visible and fits the menu. The era-pool integration test now includes a careful player so era-5 coverage is not accidentally dependent on unsafe bots surviving.

Validation: 1,189 non-balance/non-witness tests pass, zero failures or TODOs; targeted promise/menu/tour tests pass; formerly failing random seeds 102/198 and careful seeds 120/133 complete without rejected-action logs. The P1-only comparison separately reproduced the full a10 report exactly. Combined gameplay changes intentionally produce different ending distributions. Final ending replay and balance-contract test results follow below.

All eleven final ending witnesses replay successfully through public actions (3 witness tests pass). The first 40-seed probe found ten endings; the unchecked-automation probe was corrected to retain model alignment and fix model hazards while leaving internal automation unchecked. It reaches quiet takeover at seed 26. This separates internal automation risk from public model risk and board removal. No game rules were relaxed for the witness.

Self-review: the prior P1 economic coupling, serving/billing mismatch, summit backing, action legality and stale phone-call regressions have passing focused checks. The sample is evidence for reachability and differentiated strategy outcomes, not exhaustive human-play balance.

Release completed: integrated source into /Users/ardaenf/Desktop/game-night-ai-lab (uncommitted), with a preserved source snapshot under releases/2026-09-27-combined and preintegration file backup /private/tmp/game-night-before-final-integration-20260927. ZIP: /Users/ardaenf/Downloads/ai-lab-tycoon-itchio-2026-09-27.zip (70,251,520 bytes, 297 files, index.html at root). ZIP CRC and local module imports verified; copied ZIP SHA-256 4c4036d4b3670bf27c230d4730b988d99f459414f597fe8dad0ba299781f1a65. Main-checkout smoke verification: 50 tests pass, including all eleven ending replays.

The optional fresh 200-seed balance-contract test run was stopped to honor the shortened validation request; its assertions are not claimed as passed. The completed final sample is 40 seeds across 13 strategies, with full legal ending witnesses checked separately. No unresolved important defects identified in the focused re-review; wider calibration remains a limitation of this time-boxed pass.

VERDICT: APPROVED
