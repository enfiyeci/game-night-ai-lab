# iOS shell review ledger

Tier 2 review (global CLAUDE.md), by a fresh Opus subagent (Game Night reviews run on Opus, owner
2026-09-26). Read-only; it did not build or run the app.

## Round 1, 2026-10-26, commit a7c88f7: REVISE

| # | Finding | Outcome |
|---|---|---|
| 1 | `.ambient` on AVAudioSession likely doesn't govern WebKit's `<audio>` | Fixed: `navigator.audioSession.type = 'ambient'` in native-shell.js. ⚠️ Silent-switch behaviour still untested (no device). |
| 2 | `--native-fold-*` are points, but the page draws under a root `zoom` | Fixed by contract: documented as CSS px before the root zoom (code comments, README); the redesign lane drops the legacy zoom. |
| 3 | Glance showed on the title screen and could hide the ending film | Fixed: bridge sends `inRun`; card only mid-run, closes when the run ends; VoiceOver skips the game behind it. |
| 4 | Snapshot could put an older page value over a newer copy | Fixed in round 2 (see below). |
| 5 | Saves after the background flush relied on a 400 ms timer | Fixed: every message is written at once. |
| 6 | Network block fails open if the rule list doesn't compile | Won't fix: constant rule list; the bundle has no http(s) loads left; failing closed would risk a blank app. |
| 7 | Scheme handler: symlinks, 404s, range edge cases | Fixed: standardize + resolve symlinks before the containment check, 404 response, `bytes=0-abc` rejected; tests added. |
| 8 | Viewport MutationObserver could run all session | Fixed: the swap moved into copy-web.sh (sed). |
| 9 | Info.plist named a missing launch image | Fixed: keys removed. |
| 10 | VoiceOver reached the game behind the glance | Fixed (with 3). |
| 11 | Build copied the working tree, not the commit | Fixed: Release refuses uncommitted `index.html`, `ui/`, `sim/`. |
| 12 | A fold recreating the scene, or several iPad windows | Won't fix now: single-window app; ⚠️ a real fold is untested, noted in the README. |
| 13 | Test gaps | Partly fixed: path-containment and symlink tests; the JS mirror is covered by manual simulator tests only. |
| 14 | Redundant `assumeIsolated` | Fixed. |
| 15 | Doc nits | Fixed. |

## Round 2, 2026-10-26, commit fcc0f33: APPROVED

| # | Finding | Outcome |
|---|---|---|
| 1 | Page and app disagreed on which value is newer (round 1 #4 moved, not fixed) | Fixed: the app's copy is the authority on both ends; the page restores any value that differs. Tested on a spare simulator: app copy 10, page 2, next launch counted 11. |
| 2 | Uncommitted `WEB_SOURCE` override could ship another branch's web code | Fixed: Release builds refuse `WEB_SOURCE`. |
