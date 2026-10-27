# Screen inventory for the phone redesign (2026-10-26)

Every screen and overlay in `origin/main` 28cdc52, captured at 1440×900 from the real game with
`tools/cdp-shot.mjs` through the debug routes in `ui/main.js` (lines 220–391). Captures live outside the
repo in the session scratchpad; the picker page shows a selection.

## How the desktop layout works today

- `index.html` sets `<meta name="viewport" content="width=1440">`. `ui/styles.css:18-43` pins `html`, `body`,
  `#stage`, `#office`, `#fx`, `#hud` and `#overlay` to 1440×900 px.
- `ui/main.js:73` scales the whole stage down with `zoom = min(innerWidth/1440, innerHeight/900, 1)`.
- On a phone held upright, `ui/styles.css:4537` covers the game with "Turn your phone sideways to play" and
  `ui/main.js:104-108` pauses the clock behind it.
- What that zoom gives on the target devices (body text in the CSS is mostly 10.5–13 px; 461 of the 632
  `font-size` rules in `ui/styles.css` are 14 px or smaller):

| Device (measured or Apple spec) | Viewport, points | Zoom | 12 px desktop text becomes |
|---|---|---|---|
| iPhone 18 Pro, landscape | 874 × 402 | 0.45 | 5.4 pt |
| iPhone 18 Pro Max, landscape | 956 × 440 | 0.49 | 5.9 pt |
| iPhone Duo inner, landscape | 951 × 669 | 0.66 | 7.9 pt |
| iPhone Duo outer, landscape | 678 × 466 | 0.47 | 5.7 pt |
| iPad Air 11-inch, landscape | 1180 × 820 | 0.82 | 9.8 pt |

Apple's minimum text size is 11 pt and its default body size is 17 pt (HIG Typography, per `mobile-management-layouts.md`), so no
target phone can run the desktop layout scaled. iPad landscape is close enough to keep the desktop layout
with a type bump.

## Screens

"Hard" means the desktop layout depends on width (side panels, multi-column grids, wide charts) or on
hover/drag. Priority: P1 = seen every few minutes (core loop), P2 = regular management, P3 = set pieces.

### P1: the core loop

| Screen | File(s) | What it holds on desktop | Phone difficulty |
|---|---|---|---|
| Office (world view) | `ui/office.js`, `ui/assets/office-era1..5.svg`, `anchors-era*.json` | Isometric room ~880×750 px inside the 1440×900 canvas, staff at desks, desk phone, racks, whiteboard; grows each era | Medium: the room is nearly square, so it fits a phone at about half size either way; desk labels and click targets get small |
| HUD | `ui/hud.js` | Capability and alignment badges, project pill with progress, money box (era, cash, this month in/out, net, sparkline, runway, Money and Compute buttons), date, speed ×1 ×2 ×4, pause, sound, board-meets chip | Hard: today it spans the top edge and a 230 px column at top right |
| Floor menu | `ui/menu.js` | Popup at the click point: budget, training run, release, who does the work, meeting, Company ▸ (tour, plan, board, deal, raise, research), history, Game ▸; team-action count and a long help note | Medium: becomes a sheet |
| Advisor bubbles | `ui/screens/briefing.js` | Speech bubbles over desks with one or two answer chips; warnings stay up | Medium: bubbles over a half-size room collide; need a tap target per advisor |
| Event cards | `ui/screens/events.js` | Bottom card ~470×110: title, story, deadline bar, 2–3 choice tiles with cost and advisor stamps, "Decide later"; advisors' bubbles above their desks argue the options | Medium |
| Cash warning | `ui/logic/cashWarning.js` | Bottom-left card with Finance / Budget / Emergency buttons | Easy |
| Training recipe, 3 stages | `ui/screens/recipe.js` (760 lines) | Center dialog ~330 px with Team side panel (left) and Selected techniques panel (right, numbered sockets over a ruled pick list, hints on hover); chip rows; three vertical focus sliders; time bar; compute line | Hard: three columns, hover hints, vertical sliders |
| Model naming | `ui/screens/intro.js:261` | Card at the first run | Easy |
| Training run and polish | `ui/screens/training.js`, `polish.js`, `ui/fx.js` | Progress in the HUD pill, floating fx over the room, Flaws badge, Publish | Medium |
| Release | `ui/screens/release.js` | Release dialog, sizes stage | Medium |
| Reveal | `ui/screens/reveal.js` (771 lines) | Review-scores show with four cards in a row | Hard: four-across cards |
| Desk phone and Flock feed | `ui/screens/feed.js`, `flock.js` | Phone badge on the CEO desk; Flock is a full-page Twitter-style feed | Easy: it is already a phone layout |
| Screen wall, racks | `screenwall.js`, `racks.js` | Small prompts in the room | Medium |

### P2: management screens

| Screen | File(s) | What it holds | Phone difficulty |
|---|---|---|---|
| Finance (5 tabs: This month, Each model, What changed, The plan, The books) | `ui/screens/finance.js` (701), `modelMoney.js` | Team panel left, 3 stacked charts or wide tables, plan panel right with steppers and toggles | Hard: wide tables (5–6 columns), side panels |
| Compute (Where it goes, The race) | `computeInfo.js`, `race.js` | Split bar, rank bars, 5-column race table | Hard: race table |
| Budget | `budget.js` | Team panel, 4 vertical sliders, spend-level chips, draggable compute bar, toggles, summary panel | Hard: drag bar, three columns |
| Compute deals, queue, power sites | `compute.js` (578), `sites.js` | Team panel, card choices (3 across), order stepper, summary panel | Hard: three-across cards, side panels |
| Company paperwork: raise, research, emergency | `company.js` (547) | Fanned term sheets (3 across), memo, red folder of notes | Medium: fan becomes a swipe stack |
| The board, What moves the board | `board.js` (345) | Seat list with support bars, Team and Next meeting panels; node-and-line diagram | Hard: the diagram needs width |
| Who does the work (automation) | `automation.js` | 5×5 grid of job × autonomy level, time bar, steppers, side panels | Hard: 5-column grid |
| Lab history, race chart, encyclopedia article | `history.js` (452) | Model table, line chart, wiki page with infobox | Medium |
| Model spec (constitution) | `constitution.js` | Two-column checklist, worked examples, comments column | Medium |
| Hazard (cheating trace) | `hazard.js` | Bottom card with a code block and 3 choices; advisor bubbles | Medium |
| Deal pill, race board, race warning | `deal.js`, `raceBoard.js`, `ui/logic/raceWarning.js` | Small HUD pill; whiteboard overlay | Easy–medium |

### P3: set pieces

| Screen | File(s) | What it holds | Phone difficulty |
|---|---|---|---|
| Title | `title.js` | Endings wall of 11 tiles above a "New game" panel | Medium |
| Setup (hire leads, sign the year) | `setup.js` | Two résumés side by side, 4 rounds; budget memo | Medium |
| First-minute tour | `intro.js` | Spotlight bubble plus a 16-step bar | Easy |
| Board meeting (video call) | `boardMeeting.js` (868) | Incoming-call card; 4×2 face grid plus a notes column; result overlay | Medium: grid reflows to 2×4 |
| President | `president.js` (414) | Full illustrated Oval Office scene, numbered answer list | Medium |
| Summit | `summit.js` (393), `ui/assets/summitArt.js` | Illustrated chamber of six delegates, agenda board, 3×2 motion cards | Hard: wide illustration |
| Era transition and recap | `eraTransition.js`, `recap.js` | Moving-day screen; Daily Token front page | Medium |
| Ending, films, archive | `end.js`, `ui/endings/*`, `archive.js` | Run-over panel with a two-column page list; Blender stills films; 6×2 newspaper grid | Medium |
| Sound and credits | `sound.js` | Two-tab dialog | Easy |

## Interaction debts for touch

- 50 `:hover` rules in `ui/styles.css`, including the recipe pick list's hints (shown only on hover, owner pick
  R1). Each needs a tap or long-press equivalent.
- Drag interactions in `budget.js`, `board.js`, `finance.js`, `compute.js`, `briefing.js`, `vslider.js`:
  they use pointer events already, but the grips are 12–20 px; touch needs 44 pt grips.
- Keyboard shortcuts across ~30 files stay for desktop; nothing on a phone may depend on them.
- Fonts load from Google Fonts (`index.html:8`); an offline app must bundle Nunito, Libre Baskerville,
  IBM Plex Mono and Caveat locally.

## Device facts used by the redesign

Measured 2026-10-26 in the Xcode 27.1 simulators (Safari probe page, `innerWidth`, `devicePixelRatio`):

- iPhone 18 Pro: 402 × 874 pt, 3× pixels.
- iPhone Duo inner display: 951 × 669 pt in landscape, 3× pixels (2853 × 2007 px). In Safari on the inner
  display, `screen.width × screen.height` reports 466 × 678, the outer display, so layout code must use the
  viewport, never `screen.*`.
- iPhone Duo outer display: 1398 × 2034 px per Apple's screenshot specification, which is 466 × 678 pt at 3×
  (derived, not yet probed in a folded simulator).
- Apple's "Designing for iPhone Duo" page (read in full 2026-10-26,
  https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo): the Duo opens like a
  book, so the inner display's natural hold is landscape with the hinge down the middle; the outer display is
  "wider and shorter" than other iPhones and puts bars on the side; games may lock one orientation but must
  fill the screen in every pose and keep text and control sizes consistent; when partly folded, the folding
  region splits the inner display, so key controls stay off the centre line.
