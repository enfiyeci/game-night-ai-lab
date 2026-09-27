# Playtest fixes integration — 2026-09-26

## Checkout and scope

- Branch: `playtest-fixes`, local only.
- Worktree: `/Users/ardaenf/worktrees/game-night-ai-lab-playtest-fixes`.
- Verified the handoff anchor `a76020eef0fa2b3f7a1454b322e09b11aa0521d1` by fetching that exact object from the requested origin before edits.
- Created the branch from the then-current `origin/ui` (`a76020e`); upstream advanced during work, so also merged `395a3a8` (training polish).
- No push and no merge into `ui`. Era-transition design, progress bubbles, and difficulty tuning remain separate lanes.

## Integrated branches

| Item | Branch tip |
| --- | --- |
| Phone waiting strip | `phone-strip` / `29ea827` |
| Stable recipe frame | `recipe-flow` / `e19f3c3` |
| Reveal score hold, title sound controls | `reveal-hold` / `a5a8335` |
| Signed compute stamp | `deal-signed` / `90e3998` |
| Event eras, warning explanations, emergency vote | `events-era` / `3d97d47` |
| Pacing research | `pacing-research` / `9b59a87` |
| Money/compute explainers and bounded planner | `explainers` / `d04b1b5` |
| Advisor areas and marks | `office-marks` / `b105194` |
| Screen transitions | `transitions` / `6c238dc` |
| Three Just now variants | `just-now` / `7332ce1` |

A–D ran as four concurrent Codex CLI jobs in their separate existing worktrees. Each job passed its own full suite and captured screenshots. Follow-up integration checks caught and fixed two issues: rapid A→B→C replacement left B connected; Not now dropped an unanswered warning's mark and prevented reopening it from the advisor.

Merge resolutions retain both release test groups, both voice-feature eligibility and era gating for voiceLikeness, and all independently appended CSS blocks. The recipe/deal tests now await `gdt-dialog-closed` after exits instead of asserting synchronous removal.

## Validation

- Final `PATH=/opt/homebrew/opt/node@22/bin:$PATH npm test`: **1,159 tests, 1,152 passed, 2 failed, 5 existing TODOs**. Log: `/private/tmp/gn-playtest-final-tests.log`.
- Final UI suite: **393 passed, 0 failed**. Log: `/private/tmp/gn-playtest-final-ui-tests.log`.
- `git diff --check`: clean.
- All simulation files were final before the last full suite; the final UI suite includes all A–D follow-up fixes.

### Remaining balance assertions

1. `tests/balance.test.js:75`: balanced strategy wins **78/200**, above the **72/200** limit. An isolated archive of upstream `395a3a8` wins **72/200**. The event-era integration changes the distribution; this guard is therefore not green on this branch.
2. `tests/compute-balance.test.js:24`: spot-only strategy exceeds its 10% win limit. Isolated upstream `395a3a8` already wins **27/200** and fails this guard. Baseline evidence: `/private/tmp/gn-playtest-upstream-balance.json`.

Do not describe the full suite as passing. Difficulty tuning was explicitly assigned elsewhere by the source handoff; no thresholds or game-balance constants were weakened here. Next validation action is for the balance lane to resolve these assertions, then rerun the two balance test files against this integration.

## Browser evidence

Screenshots are git-ignored under this worktree's `shots/`. Each lane's captures are copied here with a lane prefix; all three requested summary files are `shots/just-now-A.png`, `shots/just-now-B.png`, and `shots/just-now-C.png`. A is the default and recommended variant.

Integrated checks include:

- Recipe stages preserve the same layer and emit no close event between stages.
- A hurried reveal keeps its completed score visible.
- Phone waiting strip and SIGNED stamp appear correctly.
- Planner has current/past eras and a single generic Later column; compute explanation uses Research, money uses CFO.
- Advisor area click opens speech and clears a read mark; Not now retains the unresolved warning mark and clicking the advisor reopens it.
- Rapid Money→Compute→Books switching sampled 23 frames with **zero uncovered frames**, and only Books remained active.
- President exit retained its layer through approximately 157 ms of the 160 ms exit, then removed it.
- Actual browser reduced-motion emulation removed the President layer immediately.
- A/B/C summaries captured in the same era-2 scenario; Escape and × dismissal validated by the lane, Escape also checked after integration.

Useful files: `integrated-planner.png`, `integrated-compute.png`, `integrated-president.png`, `integrated-warning-reopened.png`, `integrated-phone.png`, `integrated-recipe.png`, `integrated-signed.png`, `integrated-reveal-hold.png`.

## Demo

Serve from the clean integration worktree with `python3 -m http.server 8800 --bind 127.0.0.1` and open `http://127.0.0.1:8800/`. Force-reload to avoid stale JavaScript/CSS from a previous demo. Runtime log and PID are in `/private/tmp/gn-playtest-demo.log` and `/private/tmp/gn-playtest-demo.pid`.
