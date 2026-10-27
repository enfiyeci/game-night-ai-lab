# iOS app (iPhone, iPad, iPhone Duo)

A small SwiftUI app that runs the web game offline in a full-screen `WKWebView`. The web code has one
source: the build copies `index.html`, `ui/` and `sim/` from the repo root into the app.

Release decisions and the App Store checklist: `ios/docs/release.html` (also published for Arda as a
claude.ai artifact).

## Build and run

Needs Xcode 27.1 (iOS 27.1 SDK, macOS Tahoe 26.6 or later) and XcodeGen.

```sh
cd ios
xcodegen generate
xcodebuild -project GameNight.xcodeproj -scheme GameNight -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone Duo' -derivedDataPath build/DerivedData build
xcrun simctl install booted build/DerivedData/Build/Products/Debug-iphonesimulator/GameNight.app
xcrun simctl launch booted com.enfiyeci.ailabtycoon
```

To bundle the web game from another checkout, add the build setting
`WEB_SOURCE=<that checkout's root>` to the `xcodebuild` line (Debug builds only). `GameNight.xcodeproj` and `build/` are generated and ignored by git. A Release build refuses to copy `index.html`, `ui/` or `sim/` with uncommitted changes. Unit tests:
`xcodebuild … test` with the same flags. Debug builds also accept two launch arguments:

- `-startQuery "scenario=midEra3"` opens one of the game's debug scenarios (`ui/logic/scenarios.js`).
- `-debugPostures closed@25,open@45` sets the Duo posture that many seconds after launch, for testing
  the glance where the hinge can't be moved. Real folding is in Device Hub (Xcode › Open Developer Tool).

Release builds drop both.

## How it fits together

| Piece | File | What it does |
|---|---|---|
| Web files | `scripts/copy-web.sh` | Build phase. Copies the web game into `GameNight.app/web/` and removes the Google Fonts links (no network). The phone-redesign lane is moving the fonts into `ui/fonts`, which the copy carries. |
| Serving | `App/BundleSchemeHandler.swift` | Serves `web/` at `gamenight://app/…`. WebKit refuses `fetch()` and module scripts from `file://` pages, and the game uses both. Supports byte ranges for the videos and music. A content rule blocks every `http(s)` load. |
| Saves | `App/SaveStore.swift`, `App/Web/native-shell.js` | The game keeps everything it remembers (endings found, settings, the run counter, intros seen) in `localStorage`, which iOS can clear. The shell mirrors every write into `Application Support/GameNight/storage.json` at once and restores it over the page at the next page load wherever the two differ: the app's copy is the authority, since WebKit writes its storage to disk later. A run in progress is not saved: the game itself has no mid-run save. |
| Lifecycle | `App/GameNightApp.swift`, `App/ShellModel.swift` | Background pauses the game clock (`game.clock.pause('native')`) and suspends media; foreground resumes. Audio is set to ambient twice: the app's `AVAudioSession` and, for the page's own `<audio>`/`<video>`, WebKit's `navigator.audioSession.type`. ⚠️ Whether the music then follows the silent switch and mixes with other apps is not tested: simulators have no silent switch. Check on a device. Status bar and home indicator hidden; the bottom edge's system gesture is deferred. |
| Bridge | `ui/native/bridge.js` | Loaded by one line in `index.html`; does nothing in a browser. Sends the glance (cash, era, training progress, built with the HUD's own formatting, and whether a run is under way) at most twice a second, and exposes `pause`/`resume`. |
| Duo | `App/DuoLayout.swift`, `App/GlanceView.swift` | Reads the hinge (`onHingeChange`) and the crease (`GeometryProxy.reservedRegions(kind: .division)`). Fold and unfold only resize the web view, so the game is never reloaded. Closing the Duo mid-run shows the glance card (not on the title screen); opening it again, tapping Keep playing, or the run ending returns to the game. Scenes: the app is single-window, and the web view lives as long as its scene; ⚠️ a real fold has not been tested, so it is unconfirmed that a fold never recreates the scene. |

## Viewport contract with the phone redesign

Agreed with lane `gn-phone-redesign` (the note lives in the side-session notes folder):

- The web view is edge to edge; the page uses `env(safe-area-inset-*)` once its viewport has
  `viewport-fit=cover`.
- `<html data-native="ios" data-native-posture="none|closed|open|partial">`, CSS variables
  `--native-fold-x/-y/-width/-height` (the crease while half-folded, else `0px`; CSS pixels before any `zoom` the page sets on `<html>`, so the legacy `fitToWindow()` zoom scales them), and a `native-layout`
  event on `window` with the same values.
- While `index.html` still says `width=1440`, `scripts/copy-web.sh` swaps it in the bundled copy for
  `width=device-width, initial-scale=1, maximum-scale=1`, so `fitToWindow()` sees the real window (on an
  iPhone the bottom of the office was cut off otherwise). Any other viewport is left alone.
- Orientation (Arda's pick): iPhone and the closed Duo are landscape-only; iPad and the open Duo take
  every orientation.

## Display sizes seen in the simulators

| Display | Points | Notes |
|---|---|---|
| iPhone 18 Pro, landscape | 874 × 402 | Dynamic Island on one side |
| iPhone Duo inner, landscape | 951 × 669 | 669 × 951 upright; the open Duo ignores the orientation lock |
| iPhone Duo outer (closed), landscape | 678 × 466 | Measured by gn-phone-redesign on 2026-10-27 (2034 × 1398 px at 3x); the page gets a left safe-area inset |
| iPad Pro 11-inch (M5), landscape | 1210 × 834 | |

## What the outer display can and cannot show

Verified against the iOS 27.1 SDK and Apple's docs on 2026-10-26: the only way to draw on the Duo's
outer display while it is open is `CameraCaptureAccessory`, which the system shows only while a camera
capture session runs. `ExternalNonInteractiveAccessory` is for external displays and AirPlay. A game
with no camera use can't show anything there, so the glance shows when the Duo is closed, on the outer
display the game is already running on. (The Duo Simulator has a known bug that shows
`CameraCaptureAccessory` without a camera, so a simulator test of that route would mislead.)
