# Playtest fixes and balance verification

Based on local `ui` commit `6b00b3b`, which includes the merged polishing and era-transition work. Changes are uncommitted in `/private/tmp/game-night-balance-fixes`; preview runs at http://127.0.0.1:8767/.

## Decisions implemented

1. Removed the product/feature-market layer, its simulation data and product-specific bots. Releases use the existing channel choices again. Historical appeal research remains reference material, not the current design.
2. Revenue is proportional to requests actually served. Zero service yields zero sales and no user growth; outages lose customers according to elapsed months. Spot coverage restores service and charges its bill. Model earnings reconcile with the company books. Budget, Money, HUD and finance projections use current service instead of stale ARR.
3. Critic scoring bounds the benchmark improvement and lead bonuses. Visible flaws remain a penalty even on a frontier release. Polishing retains its up-to-two-point benefit; concealed safety information stays concealed. The final balanced cohort averages 7.97/10.
4. Surviving endings now present six epilogue decisions before the first film. Each consequence appears in the recap; title priority no longer suppresses other decisions. All 384 authored combinations are tested. Replays retain choices.
5. Larger model sizes realize more of technique capability gains, with the same scaling applied to rivals. Era-four chip orders now fit the scale of power reservations. Prudent test bots reserve cash for upcoming contract bills. Treaty commitments cease to bind when the last rival leaves; a negotiated ending requires two commitments with both a rival and government still backing them. The UI explains that condition.

## Evidence

- Final `npm test`: 1,101 tests, 1,097 pass, zero failures, four documented TODO balance assertions.

- `node tools/balance.js 200`: 200 seeds for each of 11 strategies; zero rejected actions. Full report: [balance-results.json](2026-09-27-balance-results.json).
- Balanced wins: 55/200 (27.5%): 19 negotiated, 23 costly, 13 aligned. This passes the unchanged 36% ceiling.
- Spot-only wins: 6/200 (3%), below the unchanged 10% ceiling.
- Low/high safety catastrophe counts: 79 versus 55, passing the original safety-effect target.
- `node tools/ending-reachability.js 40`: all 11 endings found across 560 attempts. Four attempts with invalid actions are excluded. Every selected witness replays from fresh state with zero rejected actions. The probe uses selectable budgets and UI recipe/release sanitizers; successful transcripts are checked into `tests/fixtures/ending-witnesses.json` and exercised by the test suite.
- Browser verification: restored release selections, publishing and 5–7 critic scores; zero serving shows 0% requests and $0 income with immediate runway update; six epilogue choices, film playback/skip, and all six recap consequences. No browser console errors observed. This is targeted browser testing, not manual playthroughs of all 11 endings.
- Preview scenarios use bounded deterministic real playthroughs if the requested seed ends before the target screen, keeping the actual seed and financial history.

## Remaining calibration questions

Four pre-existing aspirational balance assertions remain TODO with unchanged thresholds. They are not proof of unreachable endings:

- The grid bot's conditional mean rank at era-four end is 1.409 versus 1.257 without grid. A direct regression proves powered capacity enables larger and more valuable runs, but the aggregate investment payoff still needs work. Next compare matched purchase plans and delivery dates, controlling for cash and survival selection.
- Compute is 73.1% of era-five spending, above the 70% target; eras one through four pass (46.3%, 48.2%, 59.2%, 66.0%).
- The safety bot has only 40/200 failures in eras three/four, against a 100/200 target. Cash and falling behind dominate. Speed now passes with 140/200. Next audit safety's spending and delayed releases without reducing safety's measured benefit.
- The intentionally overcommitting bot goes bankrupt in era two in all 200 runs; its target expects later failures. Its strategy deliberately bypasses affordability checks from the start.

No thresholds were weakened to hide these results. Reachability is established, but this does not establish that all strategies or endings are equally difficult.
