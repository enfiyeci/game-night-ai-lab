# Era transition — selected office move

Owner selected **B — Moving day** and removed the preview control. The office move now appears automatically at every successful era change (1→2 through 4→5), without a URL flag. The outgoing office becomes a keepsake photograph while the incoming office slides in and a canonical advisor speaks from their desk. A and C and their comparison controls have been removed from the implementation.

Motion plays once on opening. Reduced-motion users see the completed scene immediately. The only button is **Step inside →**; Escape also dismisses it. The clock pauses synchronously while the transition waits for any existing board meeting/dialog and remains paused until dismissal, then preserves the selected speed or manual pause. The initial team tour is unchanged, and no future-era roadmap is shown.

## Reproduce and verify

Run `node tools/era-transition-shots.mjs` with Node 22+ and Chrome installed. Set `CHROME` for an alternate Chrome executable, or `ERAS=2,4` to limit the incoming eras. The script starts a temporary localhost server and headless browser. All fixture states come from real simulation actions; it advances 1→2 with `game.advanceDays(1)` and completes the actual board meeting for later gates.

The harness verifies all four transitions in normal and reduced motion without a feature flag, automatic animation, a single primary button, focus containment, button/Escape dismissal, clock hold, and ×4/manual-pause restoration. It captures 1→2 and 3→4 at 1440×900 and 1000×700. Output is ignored by Git under `shots/era-transition-selected/`, including `verification.json`. A delivery copy is in the desktop checkout's same directory.

Interactive debug routes: `?scenario=beforeEra2&seed=1` opens the transition after one story day. `?scenario=beforeEra4&seed=1` begins at the board meeting; join, call the vote, then return to work. `beforeEra3` and `beforeEra5` cover the other gates. Add `&paused` to hold at the gate.

Selection validation: all 8 browser cases (4 era changes × normal/reduced motion) and 43 focused era-intro, clock, game, summary and board tests passed. Updated desktop and smaller-window screenshots were inspected.

## Build history

Anchor `04650e0ade1b8a57741c3c74d03f112413a2635d` was fetched before work. The comparison build started from `origin/ui` at `a76020e` in `/private/tmp/game-night-era-transition`, branch `codex/era-transition-variants`. It integrated `395a3a8` (polishing) and `44410bc` (training bubbles), then merged locally into `ui` at `6b00b3b`. No push.

The original 16-combination comparison matrix passed, as did 434 affected tests after polishing integration and 20 training-bubble tests. The original full suite had 1,091 passes, 2 balance failures and 5 TODOs. Both balance failures reproduced on untouched `a76020e` (15 passes, 2 failures, 5 TODOs across the two balance files; first failure: balanced wins 96/200). This UI change does not alter simulation outcomes.

The old A/B/C screenshots remain historical comparison artifacts in `shots/era-transitions/`; they no longer describe the active implementation.
