# Phone layouts in mobile management and strategy games (2026-10-26)

> Provenance: subagent output (Opus research agent, 2026-10-26), kept as written apart from formatting.
> Treat it as unverified raw research. The agent's own coverage statement is at the end; claims it read
> only partly or through a summarizing tool carry ⚠️. Orientation findings rest on App Store screenshot
> sizes, which show that an orientation is supported, not that it is the only one.

## 1. Summary

The strong phone management games split by what sits at the center of the screen. Games built around a
wide world view (an office, map, city or pitch) run in **landscape**: Game Dev Tycoon, Plague Inc., Rebel
Inc., Pocket City 2, Football Manager 26 Mobile/Touch, Motorsport Manager Mobile 3, Frostpunk: Beyond the
Ice, This Is the Police and Mini Metro. Games built around a stack of text cards or choices run in
**portrait**: Reigns, BitLife, Football Chairman Pro 2, Kairosoft's Game Dev Story and Papers, Please.
Pocket City 2 says outright that it supports both. The landscape games share a layout. A thin top strip
holds the always-visible numbers, with money and date in the top-right corner. One or two large action
buttons sit in the bottom corners, and the world view fills everything else. On iPhone, Game Dev Tycoon
shows every decision dialog **full screen**. On iPad it shows the same dialog as a centered card over a
blurred office. Apple's guidance for iPhone Duo matches this split: the outer screen behaves like an
iPhone, and the inner screen is a "regular × regular" space where sheets are centered.

How orientation was established: from the pixel size of the iPhone and iPad screenshots in each game's US
App Store listing, fetched through Apple's public iTunes lookup API. Thumbnail URLs sized "320x480bb" name
a bounding box, not the real shape; every orientation below was checked against the downloaded image.

## 2. Comparison table

| Game | Orientation (iPhone / iPad) | Navigation | HUD placement | How big panels adapt | Source |
|---|---|---|---|---|---|
| **Game Dev Tycoon** (Greenheart) | Landscape / landscape. v1.2.0 (March 2018): "We now support both landscape orientations on the iPhone X" | Hamburger icon top left; tapping the office opens actions | Project pill top center (name, genre, phase progress), point bubbles either side. Three stacked stat pills top right (date "Y1 M7 W1", fans, cash). Cost toast bottom right | iPhone: dialogs full screen ("Pick Topic" is a 4-column card grid with a back arrow and a red close button; stat pills stay visible). iPad: the same dialog as a centered card over a blurred office. R&D budget is a small card bottom left with a slider | App Store listing and version history (read in full); store screenshots; Greenheart blog: "a re-designed user interface, tuned to mobile devices" |
| Game Dev Story (Kairosoft) | Portrait / portrait | Command menu at the bottom | Date and money strip top; stats strip bottom | Small centered boxes over the office | Store screenshots |
| FM26 Mobile (Netflix) / FM26 Touch (SEGA) | Landscape / landscape | Left icon rail (mail, home, club, people, world, search, settings) | Top bar with date and a large "CONTINUE" button top right | Multi-column profile; action tabs along the bottom | Store screenshots; ⚠️ FM26 Touch listing keyword-searched only |
| Plague Inc. | Landscape / landscape | One large "World" button bottom right | News ticker top, date top right, bottom strip with counters | Bottom-corner button opens the panels | Store screenshots |
| Rebel Inc. | Landscape / landscape | "Region" button bottom right | Top-center stat strip, date top right, vertical meters right edge | Same as Plague Inc. | Store screenshots |
| Reigns | Portrait on iPhone, landscape on iPad | Swipe the card | Four resource icons pinned top | One card at a time | Store screenshots; PC Gamer interview |
| Motorsport Manager Mobile 3 | Landscape / landscape | Top bar with menu, back, store, HOME | Currencies in the top bar | Three side-by-side cards | Store screenshots |
| Pocket City 2 | Both: "Play in both landscape and portrait mode" | Bottom-left dock plus a big "Build" button bottom right | Level top left; money, population, day top right with speed and settings | Not confirmed | ⚠️ listing keyword-searched; screenshots |
| OOTP 27 Go!, SimCity BuildIt, Mini Metro, This Is the Police, Frostpunk: BtI, Suzerain | Landscape | Suzerain: a side panel slides over the map | Not confirmed | Suzerain: right-side overlay panel | Store screenshots |
| Papers, Please | Portrait only, phone and tablet | Carousel plus rack | Checkpoint, booth and documents always visible | Desk removed; documents become a swipeable carousel; extra buttons in a slide-out panel | Lucas Pope's devlog (read in full); ⚠️ Android Police via summary |
| Football Chairman Pro 2 | Portrait / portrait | Full-width "Continue" button | Not confirmed | Newspaper-style story card | Store screenshots |
| BitLife | Portrait / portrait | Stacked full-width choice buttons | Name and bank balance strip top | Modal card with 3 stacked choices | Store screenshots |
| Two Point / Theme Hospital, Prison Architect Mobile, Democracy 3/4, RimWorld-likes | Not confirmed (not in US App Store search results) | — | — | — | iTunes search API |

## 3. Navigation

- The landscape sims have no bottom tab bar. Game Dev Tycoon: hamburger plus taps on the office. Plague
  Inc. and Rebel Inc.: one large bottom-right button. Pocket City 2: a 4-item dock plus one primary button.
  FM26 is the exception with a 7-icon left rail.
- Portrait card games barely navigate; the decision fills the screen.
- Apple: tab bars are for navigation, not actions; avoid the "More" tab; on the Duo, tab bars adapt to every
  pose and can become a sidebar on the inner screen. ⚠️ HIG Tab bars read through its iOS, iPadOS and tvOS
  sections only.
- HIG Sheets: use the full-screen modal for "complex or prolonged user flows"; show "only one sheet at a
  time"; on iPhone the medium detent allows progressive disclosure.

## 4. HUD on a phone

- Game Dev Tycoon (rough measurement from an iPhone X store screenshot, 812×375 pt, ±15%): hamburger target
  about 43 pt, point bubbles about 47 pt, project pill about 254 pt wide, three stat pills about 118×17 pt
  each (read-only). v1.2.0 notes "Improved readability of top right stats display" and "Fixed more iPhone X
  layout issues."
- Money and date sit top right (Game Dev Tycoon, Plague Inc., Rebel Inc., Pocket City 2); primary actions in
  the bottom corners, where thumbs reach in landscape.
- Safe areas: HIG Layout › Guides and safe areas; HIG Designing for games. The Duo talk adds that insets are
  "often asymmetric… avoid assuming that insets on opposite sides are equal."

## 5. Adapting dense desktop panels

- Papers, Please (Lucas Pope, "Cramming 'Papers, Please' Onto Phones," 2022-08-06): goals were portrait
  play, "All three regions visible at all times," and "No squinting, zooming, or precision required." The
  drag-and-drop desk became "a carousel for closeup work and a rack for quick navigation"; buttons that did
  not fit went into "an extra slide-out panel"; rare precise tasks moved to a temporary modal; the newspaper
  went from 4 to 3 columns; one binary ships phone and tablet layouts with a manual override; about 8 months.
- Game Dev Tycoon: the same dialog content is a full page on iPhone and a floating card on iPad.
- Motorsport Manager Mobile 3 and FM26 keep multi-column cards, which works because landscape is wide.
- Apple: "progressive disclosure"; at large text sizes "Reduce the number of columns"; "Determine layout
  based on size classes, not device type or orientation" (HIG Layout; HIG Typography).

## 6. Event cards and advisor dialogue

- Reigns (François Alliot, PC Gamer, 2017-11-30): the first prototype "had portraits" and "wasn't physical
  enough"; a character on a card "removes any need to have a tutorial."
- BitLife: a modal card with title, one story line and 3 full-width buttons. Football Chairman Pro 2: a story
  card with one Continue button.
- Apple: if you use a swipe gesture, "also make a button available" (HIG Accessibility › Mobility); avoid
  timed auto-dismissal (HIG Accessibility › Cognitive).
- Not confirmed: no sourced phone example of speech bubbles over desks.

## 7. Typography and touch

- Apple: default 17 pt, minimum 11 pt. Large (default) Dynamic Type: Body 17/22, Callout 16, Subhead 15,
  Footnote 13, Caption 1 12, Caption 2 11. Avoid light weights. ⚠️ HIG Typography: prose and the Large
  (default) table only.
- Touch targets: 44×44 pt default, 28×28 pt minimum; Designing for games: "buttons in iOS must be at least
  44x44 pt." Android: at least 48×48 dp.
- Long-press as a hover substitute: Android's tooltip docs ("Long-pressing the icon on a mobile device").
- Per-game text sizes: not confirmed.

## 8. Foldables

- Apple Tech Talk 111461, "Prepare your app for iPhone Duo" (transcript read in full): the outer screen
  behaves like any iPhone; the inner screen "has regular horizontal and vertical size classes" and "doesn't
  honor your supported interface orientations"; sheets are "centered" on the inner screen; apps resize as
  people open and close the device; consider landscape on the outer screen for the "tent" pose.
- Apple Tech Talk 111463, "Strike a pose with adaptive layouts on iPhone Duo" (read in full): controls that
  span the fold "become harder to see"; use "displacement"; half-folded like a book, alerts move to the
  trailing side; propped on a table, content on top and controls on the bottom; scrolling content does not
  displace; use a 50/50 split for two columns.
- Google: compact width under 600 dp, medium 600–839, expanded 840+; phones in landscape have compact height
  (under 480 dp), so "two pane layouts are not practical" there; the Pixel Fold guide warns users "can lose
  state" between displays. ⚠️ Android pages seen through a summarizing tool.
- Samsung: multi-pane layouts, 50:50 split on Z Fold. ⚠️ via summary.
- Not confirmed: any management or strategy game with a documented Fold or Duo two-pane layout.

## 9. Apple's official numbers

- Hit target 44×44 pt default, 28×28 pt minimum: HIG Accessibility › Mobility; HIG Designing for games.
- Text default 17 pt, minimum 11 pt: HIG Typography › Ensuring legibility.
- Safe areas: HIG Layout › Guides and safe areas.
- Contrast: 4.5:1 for text up to 17 pt; 3:1 for 18 pt and up or bold.

## 10. The agent's transfer recommendations (input to the picker, not decisions)

1. Keep the office landscape-first on iPhone; still give portrait a real layout (Pocket City 2).
2. Copy Game Dev Tycoon's HUD grammar: one top strip, project pill at center with the badges beside it,
   money and date as read-only pills top right, speed controls at 44 pt.
3. Make every big dialog full screen on a regular iPhone, keeping money and date visible.
4. Turn side panels into tabs or a slide-out panel instead of shrinking them.
5. Event cards follow the portrait card games: title, story, 2–3 full-width choice cards of at least 44 pt
   with cost and advisor stamps inside; buttons alongside any swipe; advisor bubbles never time out.
6. On the Duo's inner screen, use the iPad presentation (centered card over a blurred office), a 50/50 split
   for list-and-detail screens, and keep controls off the fold.
7. On the Duo's outer screen, use the iPhone layout and preserve state across folds.
8. Choose layouts by available size, not by device.

## 11. Coverage statement (the agent's)

Read to the end from the page itself: Apple HIG pages via Apple's JSON documentation endpoint
(Accessibility, Layout, Designing for games, Sheets, Designing for iOS, Designing for iPadOS); ⚠️ HIG
Typography (prose and the Large default table only); ⚠️ HIG Tab bars (iOS, iPadOS, tvOS sections only);
Apple Tech Talks 111461 and 111463 (full transcripts); Lucas Pope's devlog
(https://dukope.com/devlogs/papers-please/mobile/); PC Gamer's Reigns interview
(https://www.pcgamer.com/how-reigns-and-its-forthcoming-sequel-make-their-tinderocracy-work/); the Game Dev
Tycoon App Store page (https://apps.apple.com/us/app/game-dev-tycoon/id1162580001), including version
history.

⚠️ Seen only through a summarizing fetch tool: Pocket Gamer's Game Dev Tycoon review and 2017 announcement;
Finger Guns' Android review; iPhoneSoft's review; Greenheart's 2017-10-17 blog post; footballmanager.com's
FM24 Mobile features page; Android Police's Papers, Please article; Android pages (window size classes,
Compose tooltip, accessibility guide, archived large-screen games gallery); the Android Developers Blog Pixel
Fold post; Samsung's One UI foldable page.

Store data: iTunes search and lookup APIs for about 35 apps; screenshots downloaded and viewed for 19 apps.
⚠️ Store descriptions other than Game Dev Tycoon's were keyword-searched, not read in full.

Could not be reached: TouchArcade's Game Dev Tycoon review and Papers, Please article (HTTP 403); Giant
Bomb's Game Dev Story review (403); apps.apple.com id1280544124 (404); Material 3's tooltips page (rendered
empty); the current Android large-screen games gallery (archived version read instead). Tech Talk 111464
downloaded but not read. No email address was used in any request.
