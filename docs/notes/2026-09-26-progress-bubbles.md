# Progress bubbles: denser motion, identical totals

## Scope and integration

Verified that anchor `04650e0ade1b8a57741c3c74d03f112413a2635d` was fetchable before editing. Created `progress-bubbles` in `/private/tmp/game-night-progress-bubbles` from the then-newest `origin/ui`, `a76020e`. During validation, origin advanced to `395a3a8` (keep-polishing); integrated that update before final checks. The requested merge is local only; nothing is pushed.

Five visual bubbles represent each capability/alignment point. A separate fractional-progress calculation emits between whole badge changes; daily batches stagger departures across the day at the selected speed. The original `badgeCounts` calculation and all simulation logic remain unchanged relative to `origin/ui`. Landing fractions cannot reverse or exceed the current badge target, and the settled HUD uses that exact target. Drops/releases invalidate outstanding flights. Reduced motion snaps directly to the target. Pop sound is limited to one per five bubbles, with an additional time throttle; landing ticks only sound on whole badge changes.

The first candidate used 4×. On the initial base, its era-1 training rate was 37.32/min (9.40 before), below the requested 40/min; 5× was chosen to clear that target. Research has no HUD readout; users/compute totals are inside the normally hidden stats panel, so no extra streams were added for them. Upstream polishing/flaw bubbles remain separate and unchanged. No CSS colors or tokens changed.

## Reproduce the measurements

Run `node tools/measure-bubbles.js 20`. The benchmark advances the real simulation daily for seeds 1–20 under balanced, safety, and speed strategies. Both visual schedules see the exact same states. The before schedule reproduces the original positive whole-badge deltas and drop/reset behavior; the after schedule uses `bubbleCounts` and `bubbleSpawns`. It stops after era 3 (or an earlier ending).

Rates use x1 running-clock seconds, 90 seconds per round, divided by `ROUND_DAYS[era]`. They exclude time paused for menus/cards or player decisions. Training minutes include capacity stalls while a run exists; overall minutes also include time between runs and polishing. This is a deterministic clock-based measurement, not a wall-clock browser playtest. Only capability/alignment training bubbles are counted; unchanged polishing/flaw effects are excluded. Aggregate counts need not be exactly 5× because fractional scheduling and whole rounding react at different times to changing forecasts and downward corrections; any fixed point increase produces exactly five visual units per point with unchanged settled totals.

## Final measurements on the integrated base

| Era | Completed runs | Training minutes | Overall running minutes | Before bubbles | After bubbles | Before/min training | After/min training | Before/min overall | After/min overall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 107 | 267.38 | 360.00 | 2425 | 12050 | 9.07 | 45.07 | 6.74 | 33.47 |
| 3 | 55 | 152.30 | 292.50 | 3015 | 15013 | 19.80 | 98.58 | 10.31 | 51.33 |

Both measured eras exceed 40 bubbles/minute during training and 20/minute overall. Raw output: `/private/tmp/progress-bubbles-integrated-measurement.txt`.

## Validation

- Test-first: the original code failed the density assertion (5 capability bubbles instead of 20 for the initial 4× candidate) and lacked fractional scheduling. The final 5× assertions pass.
- Pure tests cover exact per-kind spawn counts, fractional credit, state immutability, unchanged badge values, between-point emission, first-day behavior, and final totals.
- UI tests cover HUD redraws, monotonic counts, overlapping days landing out of order, release cancellation, reduced motion, daily staggering, and the shared sound budget. Final focused run: 20/20 passed.
- An independent read-only review approved the final diff against `395a3a8`, including the polishing integration.
- `sh tools/shot.sh midEra3 '#training'` generated 1440×900 and 1000×700 screenshots in `shots/`. Desktop captures were inspected before and after integration; bubbles are visible in the larger final image. These static screenshots do not verify temporal smoothness. Continuous pacing and the owner's motion taste are **not checked visually**; audible sound quality is not checked. No Claude process or external review workflow was invoked.
- Final integrated `npm test`: **1133 tests, 1127 pass, 1 fail, 5 existing TODOs**. The sole hard failure is `renting only spot almost never wins` (`tests/compute-balance.test.js:26`). It is already documented for upstream `395a3a8` in `docs/notes/2026-09-26-keep-polishing-balance.md`; the entire simulation, balance runner, and that test are byte-identical to upstream. No thresholds or TODOs were changed. Log: `/private/tmp/progress-bubbles-integrated-tests.log`.
- The earlier full suite on the initial base had 1095 passes, the same two base balance failures, and 5 TODOs. The upstream polishing merge resolves the win-rate failure, leaving the spot-rental failure above. A redundant isolated old-base rerun was stopped after upstream's baseline evidence became available; it is not counted as a completed check.
- Final `git diff --check` passed. Local `ui` is merged in `/private/tmp/game-night-progress-bubbles-ui`; the original `main` checkout is unchanged. Implementation and measurement source remain on `progress-bubbles` as well.
