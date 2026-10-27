# Side-by-side audit: this game against Game Dev Tycoon (2026-10-27)

Research, not legal advice. Written by the orchestrating Claude session for lane `gn-ip-risk`.

## How this was done

- **This game:** read `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` (whole file),
  `docs/research/ai-lab-mechanics/report.md` (whole file), `docs/research/game-dev-tycoon/office-progression-2026-09-25.md`
  and `secondary-screens-2026-09-25.md` (whole files), and grepped `ui/`, `sim/` and `tools/` for every mention of
  Game Dev Tycoon. Read `sim/data/launch.js` lines 70–100 (the four critics and their quips), `ui/assets/music/README.md`
  (whole file), `ui/sfx.js` lines 1–30 (header: sounds are synthesised), and `ui/screens/recipe.js` lines 161–234 (the
  focus sliders). ⚠️ The rest of `ui/` and `sim/` was searched, not read line by line.
- **Captures of this game** (main at 7f73b36, headless Chrome via `tools/cdp-shot.mjs`, 1440×900): title, era 1 office,
  floor menu, training run builder stage 1, an era 3 office with a run under way, the release reveal (benchmark step and
  all results), the end screen. Copies are in `shots/`.
- **Game Dev Tycoon:** the seven official screenshots on its Steam page
  (https://store.steampowered.com/app/239820/Game_Dev_Tycoon/, developer Greenheart Games, Steam release
  August 29, 2013), viewed at 1920×1080 in the built-in browser: garage with HUD, Development Stage 1 dialog,
  second office, Development Stage 2 dialog with Staff and Selected Features panels, "Complete!" dialog, Game History
  dialog, R&D lab Special Project dialog. Plus the repo's earlier GDT notes listed above (subagent research, not
  re-verified here).

## What Game Dev Tycoon's screens look like (from the Steam screenshots)

- **Office:** an isometric cut-away room, floating on a cream background with a soft radial glow. Garage first
  (with a car under a blue cloth), later offices with teal floors and pale walls.
- **HUD:** top centre, a pill with the game's name, genre and a progress bar. Left of it a large orange circle
  ("Design") and a small orange one ("Bugs"); right of it a large blue circle ("Technology") and a small blue one
  ("Research"). Each circle has a small label tab under it. Top right: a small white box with date and cash.
- **Dialogs:** a cream panel with an orange/amber edge, a large light-weight centred title ("Development Stage 1",
  "Game History", "Special Project"), and one wide orange button ("OK", "Release Game", "Start Project").
- **Development Stage dialog:** title "Development Stage N"; the game's name and genre under it; three vertical
  sliders with coloured fills (red, green, blue), each named after a work area with a level; under them a three-colour
  "Time Allocation (Preview)" bar; one orange OK button. In stage 2 the dialog is flanked by a "Staff" panel on the left
  and a "Selected Features" panel on the right.
- **Completion:** "<Game> Complete!" with the Design and Technology totals in orange and blue circles, then an
  experience list and "Release Game".

## Element-by-element ratings

Ratings: **fine** = idea, rule or genre convention; **look** = close in expression, worth changing if cheap;
**change** = the specific expression is copied closely enough that it should change before a paid store release.

| # | Element | This game (evidence) | Game Dev Tycoon | Rating | Fix |
|---|---|---|---|---|---|
| 1 | Core loop: choose a product mix, split effort across phases, release, get scored against your own best | Spec §6b, §6f; `sim/data/launch.js` | Same loop for games | fine | none needed (ideas and rules) |
| 2 | Eras and office moves | Five AI eras, lab moves (`tools/office/gen_office.py` comment) | 1980s to now; garage, offices, labs | fine | none |
| 3 | Research and technique unlocks | Techniques arrive by era (spec §6b) | Engine features, research points | fine | none |
| 4 | Review panel: four outlets, score 1–10 with a quip, ±1 noise | PitchCrunch, Strategery, AI Snake Eyes, Æon Review; quips written fresh (`sim/data/launch.js`) | Four outlets with scores and quips | fine | none; names and text are original |
| 5 | Release reveal | Three columns: benchmark bars against last flagship and best rival, press, reactions (capture 07) | "Complete!" dialog with two circles, then a review popup | fine | none; expression differs |
| 6 | Naming the product before work starts | `ui/logic/naming.js` | GDT names a game first | fine | none |
| 7 | Text, characters, advisors, events, feed | All written for this game; advisors are named composites (spec §6) | — | fine | none |
| 8 | Sound effects | Synthesised in Web Audio, no files (`ui/sfx.js`) | GDT's own sounds | fine | none |
| 9 | Music | Kevin MacLeod (CC BY 4.0) and Eric Matyas (Soundimage public licence) with in-game credits | — | fine | keep the in-game credits; both licences allow commercial use with credit (Soundimage licence page read in full 2026-10-27) |
| 10 | Office art | Original isometric SVG office drawn by our own generator; own characters, desks, server racks | Different drawn art | fine for the art itself | none |
| 11 | Office presentation | Isometric cut-away room floating on a cream radial glow; era 3 floor is teal tile (captures 02, 08) | Same staging; second office floor is teal | look | give the room a setting of its own (a backdrop, a night window, a different era palette) and move era 3 off teal |
| 12 | Top HUD | Coral "Capability" circle left and blue "Alignment" circle right, each with a label tab, flanking a centre project pill with a progress bar; date and cash box top right (captures 02, 10) | Orange "Design" circle left, blue "Technology" circle right, label tabs, centre project pill with progress bar; date and cash box top right | **change** | a different composition: for example one model card at top left with capability and alignment as two bars, or a split gauge; no pair of coloured circles flanking a pill. The phone layout's pick "3-H1 Game Dev Tycoon top strip" (`ui/phone.css` on branch `phone-redesign`) carries the same pattern |
| 13 | Point bubbles flying from desks to the HUD circles | Orange and blue bubbles on an arc (`ui/fx.js` line 3 cites GDT) | Same | look | changes with item 12: let progress land somewhere else (the model card, the server rack) in a shape of its own |
| 14 | Training-run builder dialog | Title "Training run · Stage 1", model and stage subtitle, three vertical sliders with coloured fills, a three-colour "Time allocation" bar, one orange button, flanked by a "Team" panel left and a "Selected techniques" panel right (capture 04; `ui/screens/recipe.js` line 161 says "Game Dev Tycoon's focus sliders") | "Development Stage N", game subtitle, three vertical fill sliders, "Time Allocation (Preview)" bar, one orange OK, flanked by "Staff" and "Selected Features" | **change** | the closest copy in the game. Keep the rule (split effort three ways); replace the expression: one horizontal bar whose two dividers are dragged, or a triangle mixer, or three steppers; drop the "Time allocation" label; put techniques in the body as cards and the team as a row of faces, not two flanking panels; new title wording |
| 15 | Dialog look used by every screen | Cream panel, amber edge, big light title, one wide orange button (spec §7b: "copy Game Dev Tycoon's dialog grammar") | Same | look | a frame of our own: for example a header band in ink with a left-aligned title, a different button shape and colour. The release reveal already leans this way |
| 16 | Code names and comments | Events named `gdt-dialog-closed`, `gdt-menu-closed`; comments citing GDT in about 10 files; they ship inside the app bundle | — | look | rename to neutral names (`dialog-closed`); not infringing, but it reads as intent to copy |
| 17 | Public design docs | The public repo's spec says "a faithful Game Dev Tycoon structure" and "copy Game Dev Tycoon's dialog grammar"; mockups named `K2-gdt-polished*` | — | look | do not rewrite history; once items 12, 14 and 15 change, add a dated note to the spec recording the change after this review. Making the repo private before launch is an option for the owner |
| 18 | Real names in text | Factual references (GPT-4, Llama, Grok cluster sizes) in `sim/data/recipeFocus.js`; parody outlets (PitchCrunch, AI Snake Eyes); an unnamed president in a recognisable style | — | fine | keep them factual or parodic; never use a real company's logo |
| 19 | Title "AI Lab Tycoon" | Title screen | — | see the trademark notes | — |

## The overall look

No single element above decides it, but the court in Tetris v. Xio (D.N.J. 2012) judged the "total concept and feel"
and objected to "wholesale copying of the Tetris look", not to items one by one (quotes checked in the opinion text). What brings this game closest to that line is the *combination* of 11, 12, 13, 14 and 15: the same
staging, the same HUD composition and colour mapping, and the same dialog grammar, with the spec saying in writing
that the dialog grammar was copied. Changing 12 and 14 (and ideally 15) breaks that combination, while the art, the
text, the themes and the systems stay original.
