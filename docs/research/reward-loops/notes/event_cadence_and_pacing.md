# Event recurrence, cadence and pacing systems in games (for Game Night AI Lab)

Reading note on method: every web page below was fetched through a tool that returns a model-written extract of the page, not the raw text. The one exception is the Left 4 Dead slide deck, which I downloaded and read as raw extracted text, all 932 lines. Where an extract told me it was cut off, or I only had search snippets, the claim carries a warning sign. Coverage section at the end lists everything.

## 1. RimWorld storytellers (Cassandra, Phoebe, Randy): cycles, gaps, intent, threat points

### Takeaway
RimWorld schedules big threats with a fixed on/off cycle (Cassandra 4.6 days on / 6 off; Phoebe 8 on / 8 off), enforces a minimum gap between big threats (1.9 days for Cassandra, 8 for Phoebe), and sizes them by a formula of wealth, colonist count, difficulty scale and a slow "adaptation" factor. Randy has no cycle at all, only a random timer with a forced big threat after 13 days of silence.

### Cited Findings
- Cassandra Classic: first raid on day 5 at hour 15; major-threat cycles start on day 11 with a 4.6-day "On" phase, then a 6-day "Off" phase (10.6-day cycle). During an On phase there is a 50/50 chance of 1 or 2 major threats, at least 1.9 days apart. About 8.5 major threats per RimWorld year. Config values listed: minDaysPassed 11.0, onDays 4.6, offDays 6.0, minSpacingDays 1.9, numIncidentsRange 1~2, misc-events mtbDays 4.8. Phase dates are fixed, the same after save/reload or storyteller switch. — [RimWorld Wiki: Cassandra Classic](https://rimworldwiki.com/wiki/Cassandra_Classic) (page is tagged "unverified articles" and its code section is a stub; the meaning of the 4.8 misc figure is not explained there)
- Phoebe Chillax: 16-day cycle, 8 days On and 8 days Off; exactly one major threat per On phase (range 1~1), so one per 16 days. First On phase starts day 13, first Off phase day 21. Minimum spacing between major threats 8 days, maximum 24 days. Misc events mtbDays 4.8. Fewest major threats of the three storytellers. Same raid points as Cassandra. — [RimWorld Wiki: Phoebe Chillax](https://rimworldwiki.com/wiki/Phoebe_Chillax) (also "unverified articles"; stub code section)
- Randy Random: no On/Off cycle and no cooldown for major threats. An event check runs once per 1,000 game ticks (the page says 60 per day); average gap between fired events (mtbDays) 1.35 days; minDaysPassed 1. If no major threat has fired in 13 days (maxThreatBigIntervalDays), the next event is forced to be a major threat; average gap between major threats about 7.14 days. Raid points get a random 0.5x to 1.5x multiplier. Category weights: Misc 3.5, FactionArrival 2.4, ThreatBig 1.4, OrbitalVisitor 1.1, ThreatSmall 0.6, ShipChunkDrop 0.22. — [RimWorld Wiki: Randy Random](https://rimworldwiki.com/wiki/Randy_Random) (the 7.14 derivation is an image the extract could not show)
- Population intent: a shared curve gives a colonist-count factor of 8.0 at 0 colonists, 2.0 at 1, 1.0 at 5, 0.4 at 9, 0.0 at 12, -1.0 at 20; a days-at-location factor ramps 0 to 1.0 over the first 10 days; population intent is the product. A minimum incident-chance factor is 0.05 by default and 0.20 for Randy. Low population means more "good" events and fewer bad ones. The page itself says the section needs further investigation. — [RimWorld Wiki: AI Storytellers](https://rimworldwiki.com/wiki/AI_Storytellers) (page gave no per-storyteller cycle numbers and no wealth numbers)
- Raid points = (Wealth Points + Pawn Points) x Threat Scale x Starting Factor x Adaption Factor. Storyteller Wealth = items + creatures + 0.5 x buildings. Wealth points are 0 up to 14,000 wealth, 2,400 at 400,000, 3,600 at 700,000, 4,200 at 1,000,000 and flat above. Pawn points per colonist: 15 at low wealth, 140 at 400,000, 200 at 1,000,000. Threat scale presets: Peaceful 0.10, Community builder 0.30, Adventure story 0.60, Strive to survive 1.00, Blood and dust 1.55, Losing is fun 2.20. Starting factor 0.7 on day 10 and earlier, 1.0 from day 40. Adaption factor ranges 0.4 to 1.47 (default); colonist deaths and downings subtract "adapt days" (a death removes 20-30, being downed removes 3.5-8), so a struggling colony gets smaller raids. Raid points clamp to 35 minimum and 10,000 maximum. Only Randy applies a random 50-150% multiplier. — [RimWorld Wiki: Raid points](https://rimworldwiki.com/wiki/Raid_points) (the page says some details are unknown or ambiguous: starting factor between days 10 and 40, health scaling, a "halved" note)
- Designer intent (Tynan Sylvester, 2013 article): the storyteller is an algorithm generating events from a categorized database using a few statistics about game state, and it eases off when the colony population drops. Losses are softened (raiders who win steal or kidnap rather than killing everyone), so a decline plays out as a long arc. He also designed incidents to overlap so combinations (a trader arriving during a siege) produce stories. The article gives no event frequency numbers. — [Game Developer: How I RimWorld fleshes out the Dwarf Fortress formula](https://gamedeveloper.com/design/how-i-rimworld-i-fleshes-out-the-i-dwarf-fortress-i-formula)
- Wikipedia-level secondary description: Cassandra follows rising and falling tension, Phoebe adds downtime between events, Randy drops structure for randomness; the system's technical template was the Left 4 Dead director. (search-result paraphrase only; page not opened) — [Wikipedia: RimWorld](https://en.wikipedia.org/wiki/RimWorld)

### Inferences
- The cycle is a two-state timer (On/Off) plus a floor on spacing. Cassandra's 1.9-day floor is about 18% of her 10.6-day cycle; Phoebe's 8-day floor is 50% of her 16-day cycle. Those two ratios give a way to scale a "no two big things closer than X" rule to a 6-minute era (about 65 s at 18%, 180 s at 50%).
- Randy shows the failure mode your playtesters hit in reverse: pure timers produce both clusters and droughts, so Randy needs a hard backstop (13 days, about 1.8x its average gap of 7.14) to stop long silences. A backstop of roughly 1.8x the target average gap is a concrete rule to copy.
- Threat size is tied to player state (wealth, population, recent losses), which is a pacing lever as well as a difficulty lever: the game gets gentler after the player is hurt.

### Gaps
- Tynan Sylvester's book "Designing Games" and his GDC 2017 talk "RimWorld: Contrarian, Ridiculous, and Impossible Design Methods" could not be read (book is paywalled; the GDC Vault page is gated; I found only the abstract in search results). No direct Sylvester statements on tension/relief timing beyond the 2013 article.
- The Raid page's "Raid strength" section was not reached (the page is 479k characters; I read about 200k of it and the formula came from the Raid points page instead).
- Wealth-based storyteller incident chances for non-threat events (what the 4.8 "misc" number means) are not explained by the wiki.

## 2. Left 4 Dead's AI Director: build-up, sustain peak, peak fade, relax

### Takeaway
Booth's 2009 slides describe a four-state loop driven by a per-player "intensity" number: full threats until intensity peaks, 3-5 seconds more of full threats, a minimal-threat fade until the fight naturally ends, then a 30-45 second relax before building up again. It changes how often peaks happen, not how hard they are.

### Cited Findings
- Source document: Michael Booth, "The AI Systems of Left 4 Dead" (Valve, 2009), linked from Valve's publications page. I read all 932 lines of extracted text; charts and images in the deck could not be extracted. — [Slides PDF](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf), [Valve publications](https://www.valvesoftware.com/en/publications)
- Motivation: pacing in Counter-Strike is "spiky", quiet tension broken by unpredictable intense combat; constant combat is fatiguing and long inactivity is boring. The goal is to create "peaks and valleys" of intensity. — same PDF
- Algorithm: estimate each Survivor's emotional intensity, track the max of all four, and if too high remove major threats for a while, otherwise create an interesting population of threats. — same PDF
- Intensity estimation: goes up when injured (proportional to damage), when incapacitated, when pushed or pulled off a ledge, and when a nearby Infected dies (inversely proportional to distance). It decays toward zero over time, but does not decay while Infected are actively engaging the Survivor. — same PDF
- The four states: Build Up (full threat population until intensity crosses the peak threshold); Sustain Peak (full threats for 3-5 seconds after the peak, which guarantees a minimum build-up length); Peak Fade (minimal threats, wait for intensity to decay out of the peak range, so the current fight finishes without eating the relax period; the relax cannot start until a natural break); Relax (minimal threats for 30-45 seconds, or until the Survivors travel far enough toward the next safe room, then Build Up resumes). — same PDF
- Full threat population = wanderers, mobs, special infected. Minimal threat population = no wanderers until the team is calm, no mobs, no new specials (existing ones may still attack). Boss encounters (Tank, Witch) are exempt from adaptive pacing, because pacing would suffer without them and bosses are meant to change the rhythm. — same PDF
- Structured unpredictability: mobs spawn at randomized intervals of 90 to 180 seconds on Normal; a Boomer vomit forces a mob and resets the timer; mob size grows from a minimum right after a spawn to a maximum over time so that quick successive mobs stay balanced. Mobs are 20-30 Infected. 75% of mobs come from behind the team. Boss events (Tank, Witch, Nothing) are shuffled and dealt out like cards, and the same boss twice in a row is not allowed. — same PDF
- Designer's summary: "Amplitude (difficulty) is not changed, frequency (pacing) is"; a crude intensity estimate still produces working pacing. — same PDF

### Inferences
- The two lessons that transfer directly are (a) measure the player's recent load and gate new prompts on it, and (b) keep a hard floor on a relax period that cannot start until the current engagement resolves. Booth's decay-pauses-while-engaged rule is the analog of "do not start the quiet timer while a dialog is open or just closed."
- Quiet is a scheduled, named state of about 30-45 s (about 8-12% of a 6-minute era), not an accident. The shuffled-deck boss rule (including no immediate repeat) is a direct template for non-repeating story events.

### Gaps
- No Valve talk video transcript or Q&A was read, only the slide text. No data on how often players actually spent time in each state.

## 3. Interest curves, sawtooth tension, rhythm of tension and release

### Takeaway
The accessible sources agree on shape (peaks and valleys that trend upward, not a flat or constantly rising line) but I could not read Schell's own text, and none of the readable sources give hard numbers for how long the valleys should be, except Halo's three nested timescales and the L4D relax figure above.

### Cited Findings
- Jesse Schell's Lens of the Interest Curve (Art of Game Design, Lens #61 in the 3rd edition): a graph of expected player interest over time; the ideal shape starts with a strong early high point, then rises with peaks and valleys toward a final climax. This is a secondary description, not Schell's wording. — [Notes by Lex: Interest Curve](https://notesbylex.com/interest-curve) (page says nothing on "rest" or on fractals); the lens as a pacing question is confirmed by [Lost Garden review (Daniel Cook, 2009)](https://lostgarden.com/2009/02/19/review-of-the-art-of-game-design-by-jesse-schell/)
- Jaime Griesemer (Halo): talked about a "3-second loop inside of a 30-second loop inside of a 3-minute loop", with AI owning the 30-second timescale and mission designers owning the 3-minute one. When the player's shields drop and they take cover, the game backs off and lets them catch their breath, unlike most games where AI keeps pushing. He says people misread "30 seconds of fun": it meant varying the stretch, not repeating it. — [Engadget interview, 2011](https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html) (the interview as published is partial; the page says the full version would follow)
- Level-design framing: pacing is the choice of when to be quiet or intense, not a straight line up; calm lets players think and plan, and the contrast makes peaks hit harder (song build-up comparison). No numbers. — [Game Developer: Level Design First Blocks Part 2 (Max Pears, 2017)](https://www.gamedeveloper.com/design/level-design-first-blocks-part-2-level-design-theory) (the pacing graph is an image and was not readable)
- Academic mapping of pacing: pacing is the rhythm from recurring patterns of parameters over time; intensity is the main experience parameter; a paper's own tool scores narrative and gameplay intensity 0 to 100 each. It describes L4D's Director as a four-step repeating cycle governed by rules rather than a designed curve. The paper does not discuss tension and release or cite Schell. — [PaceMaker, arXiv 2408.15001](https://arxiv.org/html/2408.15001v1)
- Game Maker's Toolkit: I did not find a specific pacing episode I could open. — (no source)

### Inferences
- "Sawtooth" is not the same as "random": L4D and Halo both use a rule-based rhythm at roughly three scales (seconds, tens of seconds, minutes). For this game the scales map to: a single decision, a story week, an era.
- Your measured pattern (87-89% of weeks without a prompt, then a pile-up at the era 4 to 5 handover) is a curve with one huge valley and a spike glued to the next spike, which is the shape these sources say to avoid.

### Gaps
- Schell's primary text, any "sawtooth" definition with numbers, and a Mark Brown pacing episode were not found or opened.
- The Halo "30 seconds" source is an interview excerpt and gives no event-per-minute rule.

## 4. Event decks with recurrence control (Paradox, Frostpunk, FTL, Into the Breach)

### Takeaway
Paradox's own wiki shows the main toolkit: a mean-time-to-happen timer, scheduled pulses (yearly, five-year, quarterly), delays that re-check validity before firing, fire-once flags, flag checks, and weighted lists that include a "nothing happens" entry. No source I could read gives an official "one event per window" rule or a numeric cooldown policy.

### Cited Findings
- Stellaris MTTH: written in days, months or years; it is an average, actual delays "can vary considerably"; counting starts once all other triggers are true. A simple MTTH is rolled as a 50% chance within the stated period per scope item. Conditions with modifiers are checked every day per scope and are "considerably more expensive"; vanilla is removing MTTH uses for performance. Every event's triggers are checked at least once per game day unless it is `is_triggered_only`, and an event with no limiter fires every day its conditions hold. `fire_only_once` removes the event after it has run once. A delayed call such as `days = 200 random = 100` waits 200 to 300 days and conditions are checked just before it runs. — [Stellaris Wiki: Event modding](https://stellaris.paradoxwikis.com/Event_modding) (flagged potentially outdated, verified for version 3.6)
- CK2 MTTH: an MTTH of 90 days means a 50% chance the event has fired after 90 days. Events called from on_actions use weight_multiplier instead; low-delay weight-multiplier events queue and fire in a batch once a month. `only_playable` limits checks to about 1,000 playable characters instead of about 20,000. In `random_events`, only one event per named block fires, and a `0` entry means nothing may fire. — [CK2 Wiki: Event modding](https://ck2.paradoxwikis.com/Event_modding) (⚠️ the page was cut off: I read the first 100,000 of 117,330 characters; the last part, which covers offmap pulses, was not read)
- CK3 on_action machinery: pulses include yearly, random-yearly (once a year on a random date), quarterly, three-year, five-year, plus global and "everyone" variants; there is no monthly pulse (workaround: quarterly pulse with 1- and 2-month delays). `delay = { days = 365 }` or ranges such as `months = { 6 12 }` can be set. An event fires only if valid when the on_action runs and again when its delay ends. `random_events` accept `chance_to_happen = 25` and weights; a `0` weight adds a chance of no event. Cooldown syntax appears in templates (`cooldown = { years = 5 }`) with no explanation. The wiki warns that fallback loops can stop time advancing. — [CK3 Wiki: Event modding](https://ck3.paradoxwikis.com/Event_modding) (several sections are stubs; MTTH, fire_only_once and event windows are not covered)
- Repeat prevention in Stellaris docs is by flags and fire-once: an example guards an event with a trigger requiring the absence of a country flag, which works as a "seen" flag. — [Stellaris Wiki: Event modding](https://stellaris.paradoxwikis.com/Event_modding)
- Player-side evidence of repetition in CK3 and mod-author countermeasures (cooldowns, lower frequencies, random delays so two events do not fire together) were reported only in search results. ⚠️ (search snippets only; Steam threads and mod changelog pages were not opened) — [Steam discussion](https://steamcommunity.com/app/1158310/discussions/0/3838801919839423509)
- Into the Breach: a fixed number of turns per map (count not stated in the article) keeps battles short; Vek attacks are telegraphed, which also sped play; new Vek appear each turn; battles were meant to be much shorter than XCOM's up-to-an-hour. — [Wikipedia: Into the Breach](https://en.wikipedia.org/wiki/Into_the_Breach). The Game Developer write-up of the GDC 2019 talk had no turn-limit content. — [Game Developer](https://gamedeveloper.com/design/video-how-subset-games-designed-i-into-the-breach-i-)
- Frostpunk: an IGC 2018 write-up says designers added New Manchester to an Arks prototype that was too easy, foreshadowed the Winterhome generator failure with repeated notifications, and simplified a flow that had too many steps between breakdown and evacuation. It gives no numbers on event frequency or the storm timeline. — [Inven Global: Frostpunk scenario writing](https://www.invenglobal.com/articles/6528/igc-2018-empathize-with-numbers-the-process-of-frostpunk-scenario-writing)
- FTL: ⚠️ search snippets only. Per snippet, the rebel fleet advances as the player jumps (time mostly passes on jumps, not at beacons), sectors have roughly 20 beacons, and the starting sector's mix is roughly 1-2 stores, 1-2 distress beacons, 1 quest, 2-4 neutral and 4-6 hostile encounters. — [FTL wiki: Sectors](https://ftl.fandom.com/wiki/Sectors) (not opened; the Rebel Fleet page returned HTTP 402)

### Inferences
- Four reusable guards from the Paradox docs: a re-check of validity after any delay, a once-only flag, a weighted pick that includes a "nothing" slot, and a pulse cadence that is coarser than the event frequency you want. A "last shown at" timestamp plus a per-event cooldown is the missing piece to stop word-for-word repeats; I found no source that states a standard cooldown length.
- Paradox's own engines were reworked because dense polling is costly; the same principle in a small browser game is to drive prompts from a scheduler that picks from eligible events at known windows, not from every event testing its own conditions every tick.
- The CK2 note that frequent low-delay events "queue and fire in a batch" is a real-world example of a pile-up arising from the queue itself; a one-prompt-per-window rule would prevent it.

### Gaps
- Official numbers for FTL rebel fleet advance (units per jump), Frostpunk's storm schedule, and Into the Breach's turn count were not obtained.
- No Paradox developer diary on event frequency or event-fatigue was found or opened.

## 5. Real-time-with-pause games and notification overload

### Takeaway
I found player-side and patch-note evidence, not designer philosophy. Klei responded to notification spam with quieter, shorter repeat sounds; the Factorio community debate centers on severity tiers, auto-dismiss and filtering. I found no designer statement of "something interesting every N seconds or minutes" for these games.

### Cited Findings
- Oxygen Not Included update OU-234773 notes: notifications of the same type in quick succession play a quieter, shorter sound, and no sound when a notification's count decreases. — [ONI Wiki: OU-234773](https://oxygennotincluded.wiki.gg/wiki/Versions/OU-234773)
- Factorio forum thread (community members, not developers): worries about "screen-spam or information overload"; proposals include tiered notification levels (notification, sound, pause/zoom) by category, per-type auto-delete timeouts, and per-zone disabling of logistic warnings because frequent low-value warnings hide important ones. — [Factorio forums: Notifications System](https://forums.factorio.com/viewtopic.php?p=380556) (⚠️ truncated: 20 of 39 posts seen, page 1 of 2)
- A 2018 Klei forum reply says idle-duplicant alerts already appear constantly for harmless reasons. ⚠️ (search snippet only) — [Klei forums](https://forums.kleientertainment.com/forums/topic/98523-notify-the-player-if-a-duplicant-is-stuck/)
- Halo's rule that enemies back off when the player takes cover is the closest "relief" example in real time. — [Engadget](https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html)

### Inferences
- Notification systems converge on three fixes: collapse repeats of one type, rank by urgency (only the top tier may stop the clock), and expire stale ones. For this game that means a hard cap on clock-stopping dialogs per window and demoting the rest to a non-pausing feed.

### Gaps
- Two Point Hospital: searches found only emergency-mechanic descriptions, nothing on notification design or pacing. No statement.
- Paradox games' clock-stopping popup rules and any quote of the "something interesting every N seconds" kind were not found.

## 6. Quiet beats as a feature

### Takeaway
Designer writing agrees that downtime is deliberate and needed, but gives almost no durations. The only concrete durations I could read are L4D's 30-45 s relax and the Halo "catch your breath" behavior.

### Cited Findings
- Jon Shafer (Civilization designer), Game Developer, 29 January 2013: downtime ("negative space") is a deliberate part of pacing; his hypothetical 20-hour all-intense game would stress most players too much to finish; Civ 5 workers give a rhythmic break from strategic decisions; Walking Dead's exploration was included to slow the game; Unity of Command has no filler and long sessions cause anxiety. No numbers beyond the 20-hour hypothetical. — [Game Developer: Negative space](https://www.gamedeveloper.com/design/negative-space)
- Max Pears, Game Developer, 9 Nov 2017: calm before a peak builds anticipation and gives players time to plan; constant fighting stresses the player and weakens the impact of combat. — [Game Developer](https://www.gamedeveloper.com/design/level-design-first-blocks-part-2-level-design-theory)
- Booth (Valve): constant combat is fatiguing and long inactivity is boring, which is why the director has both a forced relax and a forced build-up. — [Slides PDF](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)
- RimWorld: Phoebe is designed as the long-gap storyteller, 8 days Off per 16-day cycle, and Cassandra Off phases are longer than On phases (6 vs 4.6 days). — [Phoebe Chillax](https://rimworldwiki.com/wiki/Phoebe_Chillax), [Cassandra Classic](https://rimworldwiki.com/wiki/Cassandra_Classic)

### Inferences
- Your playtest quote names two separate problems: overload (a pile-up at one moment) and drought (no prompts). The sources imply the fix is not "more events" or "fewer events" but rhythm: quiet should be a state with a minimum and a maximum length, as Phoebe's 8-24 day spacing window (min 8, max 24) and Randy's 13-day forced-threat backstop show.
- Quiet only works as relief if something in it still gives the player a job (Shafer's worker units, Pears' planning time). A quiet stretch with nothing to do reads as a drought, so the quiet beat should carry a visible planning or building task.

### Gaps
- No source states a recommended length of a quiet beat in management or strategy games, or "something interesting every N seconds" for a 6-minute session. Any number for Game Night AI Lab has to come from tuning, using the L4D (30-45 s relax, 90-180 s mob gap) and RimWorld ratios above only as starting points.

## Coverage

What I opened and what I got:

- Read in full, raw text: Booth, "The AI Systems of Left 4 Dead" PDF (932 lines of extracted text; images and charts not extractable).
- Fetched through a summarizing tool, page reported complete (I did not see the raw text): RimWorld Wiki pages Cassandra Classic, Phoebe Chillax, Randy Random, AI Storytellers, Raid points; Game Developer pieces (Sylvester 2013, Shafer 2013, Pears 2017, Subset GDC write-up); Wikipedia Into the Breach; Stellaris Wiki Event modding; CK3 Wiki Event modding (several stub sections); Inven Global Frostpunk talk write-up; Engadget Griesemer interview (partial interview by design); arXiv PaceMaker; ONI wiki OU-234773 patch notes; Lost Garden Schell review (one quote only); Notes by Lex interest-curve note.
- Partially read, flagged: ⚠️ CK2 Wiki Event modding (first 100,000 of 117,330 characters); ⚠️ RimWorld Wiki Raid page (about 200,000 of 479,684 characters, and the points section was not in the part read, so I used the Raid points page); ⚠️ Factorio forum thread (20 of 39 posts).
- Search snippets only, pages not opened: ⚠️ FTL sector and rebel fleet details; ⚠️ CK3 patch 1.12.5 and mod changelog repeat-prevention; ⚠️ Klei forum idle-alert reply; ⚠️ Wikipedia RimWorld description of storyteller styles; ⚠️ Halo 2010 GDC talk contents.
- Could not reach: RimWorld Wiki "Storytellers" and "Threat points" (404); FTL Fandom Rebel Fleet (402); FTL wiki.gg Rebel Fleet (401).
- Not found or not readable: Tynan Sylvester's "Designing Games" and GDC 2017 talk transcript; Jesse Schell's own interest-curve text; any Game Maker's Toolkit pacing episode; Frostpunk storm timeline numbers; Into the Breach turn count; Two Point Hospital design statements; any Paradox developer diary on event frequency.
- Subagent use: none. No email addresses were used in any lookup.
