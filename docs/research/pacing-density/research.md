# Pacing research: how other games time what happens (2026-09-26)

Why: the owner asked to "research how to best time different stuff happening in the game as game design and how
Game Dev Tycoon does it so we can adapt to some level — or add extra screens the user can look at", and then asked
for more bubbles. This file collects what the sources say. The measurements of our own game are in
`measurements.md`; the options are in `README.md`.

How to read the marks: **read in full** means the whole page (or the whole text layer of a PDF) was opened and read
in this session, from the page itself. ⚠️ marks anything read less than whole, with what was missing. Prior repo
research is cited as such and was read in full at the start of this session.

## 1. Game Dev Tycoon (GDT)

### What happens during one game's development

- Development has three stages: Preparation, Development and Bug-Fixing. The Development stage has three phases,
  each with its own three sliders: Engine, Gameplay and Story/Quests; then Dialogues, Level Design and AI; then World
  Design, Graphics and Sound. The sliders set how the phase's time is shared out.
  ([Tech and Design Points Generation Algorithm, GDT wiki](https://gamedevtycoon.fandom.com/wiki/Tech_and_Design_Points_Generation_Algorithm), read in full)
- **Every point is its own bubble.** The algorithm works out each staff member's points and then spawns them "each
  point ... separately"; a point becomes a Tech or Design point or, by chance, a Bug point, and there is an extra 5%
  chance of a random bug. Research points are spawned separately too, "and you always get all points". Boosted staff
  have a 25-50% chance of an extra point. (Same page, read in full.) The wiki's development guide describes the same
  thing from the screen: while a phase works on a design-heavy field, most of the bubbles your employees generate are
  design bubbles.
  ([Game Development Based on Experience/1.6.11, GDT wiki](https://gamedevtycoon.fandom.com/wiki/Game_Development_Based_on_Experience/1.6.11), read in full)
- So the player watches **four kinds of bubble** (tech, design, research, bug) come off each person, and the running
  totals are the whole story of "how good is this game going to be". The same guide says the hidden game score "is
  basically the sum of your Design + Tech", adjusted for size and quality checks. (Same page.)
- **How many bubbles.** A community guide aims the first garage games at 20 or more combined tech and design
  bubbles, the third at up to 30, and games 4-7 at 30-36 bubbles, so early games make roughly 20-36 each.
  ([Garage Guide, GDT wiki](https://gamedevtycoon.fandom.com/wiki/Garage_Guide), read in full; the page is tagged as
  written for version 1.3.9.) Late in a game (year 40) a medium game made "2536 total points" in one player's test.
  ([Game Development Based on Experience/1.6.11](https://gamedevtycoon.fandom.com/wiki/Game_Development_Based_on_Experience/1.6.11), read in full.)
  So the bubble count per game grows about a hundredfold over a playthrough, because staff, training and features all
  add points.
- **How long a game takes in real time is not documented.** ⚠️ The only figures are one critic's "a week will last
  around five seconds" and one critic's "approximately 2 months" per project (prior repo research,
  `docs/research/realtime-time-flow/notes/game_dev_tycoon_time.md`, both through summarized fetches). A player on
  Steam says "creating 1 game takes about 8 months of ingame time" and "an AAA title every ... 6 months", and
  complains that in-game time goes too fast
  ([slow down time mod?, Steam](https://steamcommunity.com/app/239820/discussions/0/1631916887482527517/), read in
  full). These disagree, so no bubbles-per-minute figure for GDT can be given honestly. A mod lists "Week duration in
  seconds" and "Bubble speed: Normal, Double, Disabled" as settings, which confirms that week length is a real
  constant, but does not give its value
  ([TweakMod, Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=298672508); ⚠️ description read
  in full, only page 1 of 8 of the comments read).
- GDT has no speed buttons; the TimeMod mod adds pause, slow (×0.5), play and fast (×2) by setting the game's
  `GameManager._timeModifier`
  ([dgalaktionov/TimeMod](https://github.com/dgalaktionov/TimeMod), README and `TimeMod/index.js` read in full).
  This agrees with the prior repo finding that vanilla GDT has no pause button.

### What the player looks at while waiting

From the pages above and the prior repo research (`docs/research/game-dev-tycoon/secondary-screens-2026-09-25.md`):
the bubbles and their running tech, design, research and bug counts; the phase sliders; the review popup a few ticks
after release, with four outlets; the game report; the Game History table; the yearly G3 booth popup; random events;
and contract work that runs in parallel after the third game. GDT has no finance chart, statistics screen or
competitor view (prior research, a subagent's sweep).

### What transfers

1. GDT's wait is never empty during development: bubbles come off every person all the time, and there are four
   kinds, so the counts themselves tell a story (too many bugs, not enough design).
2. The number of bubbles grows with the studio. Progress feels bigger because the numbers get bigger.
3. Research points are visible as bubbles while you work. In our game they are invisible until a menu is opened.
4. The player makes a decision at each phase (a new set of sliders), so a game has built-in decision points. ⚠️ No
   source read here says whether the game stops at each phase change to ask; the pages only show that each phase has
   its own sliders.
5. GDT's players complain that time goes too fast, not too slow, because a project is always running. The pressure
   comes from always being in the middle of something.

## 2. Storyteller and director systems

### RimWorld's storytellers

- The storyteller "will periodically create events for your colony". Event frequency and type depend on colony
  wealth, colonist count, recent deaths or wounds, "and how long it has been since the last major event". Cassandra
  pushes with dangerous events, then gives breathing room, then pushes again; Phoebe leaves long gaps between
  disasters; Randy is random.
  ([AI Storytellers, RimWorld Wiki](https://rimworldwiki.com/wiki/AI_Storytellers), read in full)
- Cassandra's numbers: the first cycle starts on day 11; a 4.6-day "On" phase with 1 or 2 major threats, at least
  1.9 days apart, then a 6-day "Off" phase, repeating every 10.6 days; about 8.5 major threats a year. Small events
  arrive separately with a mean time between them of 4.8 days (`mtbDays`). The early game is scripted: "a single mad
  animal, followed by a single raider" on day 5.
  ([Cassandra Classic, RimWorld Wiki](https://rimworldwiki.com/wiki/Cassandra_Classic), read in full)
- The version history notes that Phoebe's event density was reduced because it matched Cassandra's and so gave no
  extra breathing space, and Randy's was cut from 1.5× Cassandra's to about
  the same. (AI Storytellers page, read in full.) Density is tuned per storyteller as a deliberate knob.
- Scale for comparison: a RimWorld day is 60,000 ticks at 60 ticks a second at ×1, about 16.7 real minutes (prior
  repo research: `docs/research/realtime-time-flow/notes/turn_to_realtime_patterns.md`, from the RimWorld Wiki Time
  page read in full there). RimWorld's big beats are therefore many minutes apart; the colonists' constant visible
  work fills the time between.

What transfers: separate a "big beat" schedule (with guaranteed breathing room and a minimum spacing) from a stream
of small events, and let "time since the last event" drive the next one. Script the first minutes.

### Left 4 Dead's AI Director

From Michael Booth's talk "The AI Systems of Left 4 Dead" (Valve, 2009)
([slides PDF](https://steamcdn-a.akamaihd.net/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf); ⚠️ the whole text
layer was read, but the charts and screenshots are images and were not read):

- The goal is "dramatic game pacing". Counter-Strike's natural pacing is "spiky, with periods of quiet tension
  punctuated by unpredictable moments of intense combat". The slides say constant combat is fatiguing and long
  inactivity is boring.
- The director estimates each player's "emotional intensity" (it rises with damage and nearby kills and decays over
  time) and runs four states: **Build Up** (full threats until intensity peaks), **Sustain Peak** (3-5 seconds
  more), **Peak Fade** (minimal threats until intensity decays and the fight reaches a natural break), and **Relax**
  (minimal threats "for 30-45 seconds", or until the team has moved far enough), then Build Up again.
- "Structured unpredictability": for example, mobs "occur at randomized interval between 90 and 180 seconds".
  Several such functions are layered: frequent wanderers, medium-frequency mobs and specials, rare bosses.
- Boss encounters are left out of the adaptive pacing, because missing them would change the overall pacing too
  much.
- The algorithm adjusts pacing, not difficulty: the amplitude stays the same and the frequency changes. The slides
  add that the intensity estimate is crude, yet the pacing works.

What transfers: a quiet stretch has a maximum length (Relax is 30-45 s, then something builds). Schedules are random
inside designer-set windows, not free-for-all. Timing can adapt to the player while outcomes stay fixed, which fits
the owner's rule that outcomes are deterministic and only timing may be random.

## 3. Nested loops and interest curves

- **Halo's nested loops.** Jaime Griesemer on the "30 seconds of fun" quote: the full idea was a 3-second loop inside a 30-second loop inside a 3-minute loop that
  keeps changing. The AI owned the 30-second scale, the mission designers the 3-minute scale. He adds that the famous
  half of the quote is usually misread: the point was varying those 30 seconds so that no stretch repeats. He also
  describes Halo backing off when the player retreats, to let them catch their breath.
  ([Half-Minute Halo, Engadget, 2011](https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html), read in full)
- **Interest curves.** Jesse Schell's *The Art of Game Design*, chapter 16, describes plotting the player's interest
  over time: an early hook, then peaks and valleys that rise to a climax, and the same shape inside each level.
  ⚠️ The book itself was not read. This rests on two short summaries read in full:
  [Interest Curve, Game studies wiki](https://game-studies.fandom.com/wiki/Interest_Curve) and
  [Interest Curve, NotesByLex](https://notesbylex.com/interest-curve).

What transfers: our game has the 3-minute loop (a 90-second round, an era of four rounds) but no reliable 30-second
or 3-second loop outside training runs. Bubbles can be the 3-second loop; a beat every 30-45 seconds, at most, is the
middle loop.

## 4. Progress feel (idle games)

Anthony Pecorella's GDC Europe 2016 talk "Quest for Progress: The Math and Design of Idle Games"
([slides PDF](https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf);
⚠️ the whole text layer was read; the charts are images and were not read):

- Idle-game players' top motivators in a Quantic Foundry survey were Completion and Power, and the talk stresses
  that players must "feel" their growth in power.
- Multipliers give the player bumps and small local victories.
- On prestige cycles, it names quick progress through the early part as an important feeling of growing power.

What transfers: the same total progress feels larger when it arrives as many visible increments plus occasional
bumps. The early part must feel quick.

## 5. Other management games

- **Two Point Hospital, emergencies.** A letter offers a group of 4-12 patients outside the normal flow, with a time
  limit (usually 90 days) and a reward that grows if every patient is cured, or a reputation hit if fewer than half
  are. The player can ignore the notification until ready to accept the patients. ([Emergencies, Two Point Hospital Wiki](https://two-point-hospital.fandom.com/wiki/Emergencies), read in full; the page gives no frequency.)
  What transfers: an opt-in, time-limited offer with a known reward is a beat that gives agency, and the player
  chooses when to take it.
- **Mad Games Tycoon 2.** Development time is its own setting, separate from game speed. A developer says the
  "realistic" option is much slower and was already shortened once because it was too slow; a player who tested it
  writes that everything taking ages is not more challenge, "just more time". The same player finds random events
  that carry no real stakes to be small chores.
  ([How does "realistic development time" work?, Steam](https://steamcommunity.com/app/1342330/discussions/0/3833172420306767910/), read in full)
  What transfers: longer projects do not add interest by themselves, and filler events without stakes read as
  chores.
- **Frostpunk, Paradox games, Kairosoft.** Covered in the prior repo research
  (`docs/research/realtime-time-flow/notes/turn_to_realtime_patterns.md`), mostly through search summaries, marked
  ⚠️ there. Nothing new was read for them in this session.

## 6. What the sources agree on

1. **A maximum length for quiet.** Left 4 Dead caps relaxation at 30-45 seconds; RimWorld's Cassandra alternates
   fixed on and off phases. Neither lets silence run on by accident.
2. **Two layers of events.** A dense layer of small beats (L4D's wanderers, RimWorld's small events, GDT's bubbles)
   and a sparse layer of big beats with spacing rules (mobs every 90-180 s, bosses, raids with 1.9-day minimum
   spacing).
3. **Random timing inside designed windows**, not purely random and not fixed. This matches the owner's rule: timing
   may be random, outcomes may not.
4. **Progress must be felt, not just computed.** GDT spawns every point as a bubble; Pecorella says players must
   "feel" growth.
5. **Longer is not more interesting.** Mad Games Tycoon 2's players and developer, and GDT players who find time too
   fast because a project is always running.

## Coverage

Read in full this session: GDT wiki pages Tech and Design Points Generation Algorithm, Game Development Based on
Experience/1.6.11 and Garage Guide; the Steam thread "slow down time mod?"; the TimeMod repository README and
`TimeMod/index.js`; RimWorld Wiki pages AI Storytellers and Cassandra Classic; the Engadget interview with Jaime
Griesemer; the Two Point Hospital Wiki Emergencies page; the Mad Games Tycoon 2 Steam thread on development time; the
two interest-curve summary pages. Repo research read in full: `docs/research/game-dev-tycoon/*.md`,
`docs/research/realtime-time-flow/README.md`, `report.md` and all three `notes/`, and
`docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`.

Read in part (⚠️): the Booth and Pecorella slide PDFs (text layer in full; images and charts not read); the TweakMod
Workshop page (description in full; comments page 1 of 8 only); Schell's book (not read; summaries only).

Not reached: any official figure for GDT's real seconds per week or for how long one game takes; Greenheart has no
published design commentary on pacing (the prior repo research found the same). Two Point Hospital's emergency
frequency is not on the wiki page. Software Inc. and Kairosoft titles were not researched in this session.
