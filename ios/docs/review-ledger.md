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

## Removed keys come back after a kill, 2026-11-04 (tier 2, fresh Opus subagent)

Reported by gn-save-resume and reproduced on the iPhone 18 Pro Max simulator: a key removed from the app's copy came back after one relaunch. Fix: once the app has a copy, it decides both ways (the restore removes page keys the copy lacks; the snapshot is taken only without a copy).

Round 1: REVISE. Round 2: APPROVED.

| # | Finding | Outcome |
|---|---|---|
| 1 | The JS half of the fix and the placeholder splice had no test (important) | Fixed: `tests/ios-native-shell.test.js` runs the script in `vm`; a Swift test checks the bundled script has the placeholder once. |
| 2 | Removing keys while walking `storage.key(i)` can skip keys | Fixed: keys listed first, each removal in try/catch. |
| 3 | A key named `__proto__` was lost through the object-literal splice | Fixed: the copy is spliced as a JS string and parsed with `JSON.parse`. |
| 4 | Keys written around the mirror are now removed at the next load | Fixed: README states the rule (only `setItem`, `removeItem`, `clear`, main frame). |
| R2-1 | Test lacks U+2028 | No change: the node test's value `'a b'` has it. |
| R2-2, R2-3 | `JSON.parse` outside try; fake storage keeps order | Won't fix: `JSONSerialization` output always parses; the fix no longer depends on order. |

Checked: web suite 1327/1327, iOS unit tests 15/15, the reproduction stayed removed in two runs, and a real run killed mid-way still offered Continue. ⚠️ Not checked at run level: killing right after New game (the attempt was inconclusive).
