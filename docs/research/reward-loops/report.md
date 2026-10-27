# Game Night needs rhythm, not more events

Game Night's playtest complaint ("so many decisions it overwhelmed me, then weeks when nothing happened") describes a problem with rhythm, not with the number of events. The games that handle this well treat quiet as a scheduled state with a minimum and a maximum length. They cap how many clock-stopping decisions can land together, and they make sure every quiet stretch still has a job and a visible payoff. The bot measurement on current `main` shows both halves of the complaint. **Era 2 packs 7.4 to 8.2 prompts into its first 90-second round and only 2.1 to 2.3 into its second**, and every game stacks **2.6 to 3.9 clock-stopping dialogs onto single story days**. The "empty weeks" come mostly from eras 1 and 2, where a story day lasts one second. An ordinary 50 to 60 second gap between cards therefore shows on the calendar as seven or eight blank weeks. The hand-played run adds a second cause of the drought: stretches where nothing visible changes, decisions that report no numbers and are first judged six minutes later, and a dead beat right after the release reveal, which is the game's best moment. Left 4 Dead's AI Director, RimWorld's storytellers and Paradox's event tools supply concrete templates: an enforced 30 to 45 second relax, minimum spacing between big events, a forced event after a long silence, and decks that never repeat. Game Dev Tycoon, Two Point Hospital, Balatro, Slay the Spire and Hades show that the main reward should be a staged reveal the player can read, fed by small visible loops. The science behind "dopamine loops" is much weaker than design folklore claims. Dopamine tracks wanting and prediction error rather than pleasure. Decision fatigue, understood as used-up willpower, failed a 23-lab replication (⚠️ abstract only). No source gives a correct number of decisions per minute, so every target in this report is a starting point to tune in playtests. For a teaching game, the line between a satisfying loop and a manipulative one is set by consent, disclosure and honest time cost rather than by any single mechanic. Game Night is already on the right side on most counts: the run is finite, the player's results are deterministic, and nothing is sold. The one clear gap is time honesty: a run of 30 clock minutes takes an estimated 60 to 85 real minutes.

*How to read the source marks.* This report combines six research notes written by delegated researchers with the orchestrator's first-hand map of the current game (`notes/todays_loops.md`). Findings from the six notes are the researchers' readings. I did not reopen their sources, so any number the owner will build on should be traced to its source first. **⚠️** means the researcher read less than the whole source (an abstract, a truncated page, a search snippet), and the gap is named next to it. **(extract)** means the page came through a fetch tool that returns a model-written extract instead of the raw text, so wording and fine numbers are not verified word for word. Claims with neither mark come from raw text the researcher read in full.

## Game Night's drought is a racing calendar plus empty hands

Game Night already has the nested loops that design writers describe ([todays_loops.md](notes/todays_loops.md)):

- **Moment loop (1 to 10 seconds):** training bubbles fly to the Capability badge and "Just now" toasts appear.
- **Decision loop:** a scenario card arrives every 50 to 60 seconds in eras 1 and 2.
- **Model loop:** this is the core loop, the activity the player repeats most. It runs one to three 90-second training rounds and ends in a release reveal of about 85 seconds.
- **Era loop (six minutes):** it closes with The Daily Token recap and moving day.
- **Run loop (30 clock minutes):** it ends in one of 11 endings.

Nothing on the player's side is random. Training results, polish, critic scores, users and revenue are pure functions of the player's choices. Randomness lives only in which card appears when, and in the feed posts ([todays_loops.md](notes/todays_loops.md)). That fact matters for the ethics section below: the game's biggest reward is deterministic, so it sits outside the variable-reward territory the critics worry about.

The bot measurement (`node tools/pacing/measure.mjs 40 careful,balanced`, 40 seeds per bot) gives the shape of an average run ([todays_loops.md](notes/todays_loops.md)):

| Era | Seconds per story day | Clock-stopping prompts per era (careful / balanced bot) | All prompts per clock minute | Weeks with no prompt | Longest quiet stretch, median (max) |
|---|---|---|---|---|---|
| 1 | about 1 | 6.9 / 6.9 | 1.5 / 1.3 | 84% / 86% | 52 s (61) / 56 s (140) |
| 2 | about 1 | 14.9 / 13.7 | 3.5 / 3.0 | 72% / 73% | 50 s (59) / 53 s (61) |
| 3 | about 3 | 9.2 / 10.6 | 2.5 / 2.1 | 48% / 46% | 72 s (96) / 72 s (96) |
| 4 | about 3 | 10.0 / 8.5 | 2.3 / 2.1 | 43% / 43% | 66 s (93) / 66 s (93) |
| 5 | 12.9 | 8.6 / 6.6 | 1.5 / 2.7 | 0% / 0% | 77 s (90) / 64 s (90) |

**The overload half is concentrated, not spread.** Era 2 runs at roughly twice era 1's prompt rate. Within era 2, the first round carries 7.4 to 8.2 prompts against 2.1 to 2.3 in the second. The same-day stacks are partly structural ([todays_loops.md](notes/todays_loops.md)):

- An era transition plus a cash warning happens in every game.
- An era transition plus the summit happens in every careful-bot game.
- The President's call plus a training hazard happens in 37 of 40 careful-bot games.

The hand-played run hit the same pattern twice ([todays_loops.md](notes/todays_loops.md)). At day 105, training finished together with a scenario card and a rival-launch rumour chip: three things in one moment, after about a minute with none. On era 2's day 455, a scenario card, a cash warning and the President's three-answer call landed on the same day.

**The drought half is mostly a story-clock effect.** Measured in seconds of running clock, the gaps are not extreme. The median longest quiet stretch is 50 to 77 seconds per era. That sits inside the range Left 4 Dead treats as normal: a 30 to 45 second relax, and mobs every 90 to 180 seconds (see the next section). But in eras 1 and 2 a story day lasts about one second, so a 52-second gap reads on the calendar as seven or more empty weeks, and 84 to 86 percent of era 1's weeks hold no prompt. In era 5 a day lasts 12.9 seconds, so a week is about 90 seconds of clock. No week in era 5 is empty, even though the real gaps are similar. My inference is that the playtester's "weeks" are literal: the calendar advertises emptiness most loudly exactly where it races fastest.

**The other cause of the drought is empty hands.** The hand-played run found these dead or unclear beats ([todays_loops.md](notes/todays_loops.md)):

- **Thin first run.** During the first training run, for about 25 seconds the only motion is the Capability badge ticking from 1 to 3.
- **No readable feedback.** After a card is answered, the only feedback is a line such as "it ended with 'Fund retention and research time'". It has no numbers, so the player could not tell whether the choice helped. The first time any choice is judged is the era-end recap, six minutes later.
- **Dead beat after the reveal.** After the first release the office sat idle with "No project", and the game did not nudge a second run. The second run was blocked because even the smallest run was two compute units short.
- **Repeated reactions.** The second release's reaction posts repeated the first release's posts almost word for word. The reveal picks its five posts by release count, not by the model.

The code inventory adds more gaps ([todays_loops.md](notes/todays_loops.md)):

- The Capability badge drops to 0 after each release, so no number keeps growing.
- A delayed release going live, a model paying back its training cost, and user milestones all happen silently.
- The feed reacts to almost everything, but only behind the phone's badge.
- The era intro's written "what changes" bullets exist in `ui/logic/eraIntro.js`, but no screen reads them.

These numbers have limits. They come from two bots, not people. The figure of 13 to 20 real minutes per era for a first-time reader comes from the measurement tool's time model, which is an assumption. The hand-played run covered only era 1 and the start of era 2. ⚠️ The code inventory behind the gap list was partial: it sampled `sim/data/feedReactions.js` (4,917 lines), read only lines 1 to 50 of `ui/screens/release.js`, and only grepped `ui/screens/president.js`, `ui/screens/hazard.js`, `sim/finale.js` and the ending films ([todays_loops.md](notes/todays_loops.md)).

## Good pacing systems treat quiet as a state with a floor and a ceiling

### Left 4 Dead's Director

The clearest production account of pacing is Michael Booth's 2009 description of Left 4 Dead's AI Director. The researchers read it as raw slide text; charts and images could not be extracted. The Director keeps a running "intensity" estimate for each player. Intensity rises with damage and nearby kills and decays over time, but it does not decay while enemies are still engaging. The Director cycles through four states ([Booth, Valve 2009](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)):

1. **Build-up:** full threats until intensity peaks.
2. **Sustain peak:** 3 to 5 more seconds of full threats.
3. **Peak fade:** minimal threats until the current fight ends on its own.
4. **Relax:** minimal threats for 30 to 45 seconds.

Two details transfer directly to Game Night. First, the relax period cannot start until the current engagement has resolved; the equivalent is not starting a quiet timer while a dialog is still open. Second, boss encounters are exempt from adaptive pacing. They are dealt from a shuffled set like cards, the same boss never comes twice in a row, and their job is to change the rhythm. Ordinary mobs arrive at random intervals of 90 to 180 seconds, which Booth calls structured unpredictability. His summary of the whole system: "Amplitude (difficulty) is not changed, frequency (pacing) is" ([Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)). Game Night's era-transition, summit and President set pieces are its bosses. At present they stack with ordinary cards instead of being spaced around them.

### RimWorld's storytellers

RimWorld turns the same idea into timers (extract; the wiki pages are tagged "unverified articles" and their code sections are stubs) ([Cassandra Classic](https://rimworldwiki.com/wiki/Cassandra_Classic), [Phoebe Chillax](https://rimworldwiki.com/wiki/Phoebe_Chillax), [Randy Random](https://rimworldwiki.com/wiki/Randy_Random)):

- **Cassandra** runs a 10.6-day cycle: 4.6 days "on" and 6 days "off". Each on-phase brings one or two major threats, at least 1.9 days apart.
- **Phoebe** runs 8 days on and 8 days off. Her major threats are at least 8 and at most 24 days apart.
- **Randy** has no cycle, only a random timer averaging one event every 1.35 days. If 13 days pass without a major threat, the next event is forced to be one.

⚠️ Randy's average gap of about 7.14 days between major threats comes from an image the extract could not show. The researcher's ratio of 13 days to 7.14 days (about 1.8 times the average gap) therefore rests on that unseen derivation.

Two ratios fall out of these numbers. Cassandra's minimum spacing is about 18 percent of her cycle, and Phoebe's is 50 percent. Scaled to a six-minute era, that is about 65 seconds or 180 seconds between big events. Randy shows that a pure random timer produces both clusters and droughts, and needs a backstop to stop long silences. RimWorld also sizes threats by the colony's state and eases off after losses. Designer Tynan Sylvester described this in 2013 as a deliberate softening, so that a decline plays out as a long arc ([Game Developer, Sylvester 2013](https://gamedeveloper.com/design/how-i-rimworld-i-fleshes-out-the-i-dwarf-fortress-i-formula), extract).

### Paradox's event bookkeeping

Paradox's modding documentation shows the bookkeeping that keeps event decks under control (extract):

- Stellaris events use a mean time to happen (MTTH: an average delay rather than a fixed one) ([Stellaris event modding](https://stellaris.paradoxwikis.com/Event_modding)).
- They also use a fire-only-once flag, and delays that recheck an event's conditions just before it fires (same source).
- Crusader Kings 3's weighted event lists can include a weight-zero "nothing happens" entry ([CK3 event modding](https://ck3.paradoxwikis.com/Event_modding)).

The most useful cautionary detail comes from Crusader Kings 2. There, low-delay events called from game pulses queue up and fire together once a month ([CK2 event modding](https://ck2.paradoxwikis.com/Event_modding); ⚠️ the researcher read the first 100,000 of 117,330 characters, missing the part on offmap pulses). The queue itself creates the pile-up, the same shape as Game Night's era-transition stacks.

### Game Dev Tycoon

Game Dev Tycoon, the closest genre ancestor, fills most of its time with its own development cycle rather than with events. Its official mod documentation, read as raw text, sets the default random story event at **one every 36 + 48 × random() weeks** ([gdt-modAPI: GDT.addEvent](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addEvent().md)). The same document gives these rules for writing events:

- Events during development should fire between 20 and 90 percent of a project's progress, not at its start or end.
- Each event has at most three choices, and every choice should lead to a different outcome.
- Consequences can be delayed by a random one to three weeks.
- Each event has a maximum trigger count, which stops repeats.

One player reported that the default 35 game years take about five hours of play. From that, the researcher estimated one random story event every 6.5 to 15 real minutes; the conversion rests on anecdotal forum numbers ([Steam thread on game speed](https://steamcommunity.com/app/239820/discussions/0/864977564053270644), extract).

Game Dev Tycoon is also the game in this set most criticized for flat stretches. One reviewer found the early garage years dry and slow to add new elements ([Destructoid](https://destructoid.com/?p=150087), extract). Players asked not for more events but for idle staff to keep producing research, so that waiting time still pays ([Steam thread](https://steamcommunity.com/app/239820/discussions/0/864977564053270644), extract). Version 1.6 moved notifications into a sidebar, where they stack and fade if ignored instead of opening automatically ([Greenheart blog](https://www.greenheartgames.com/blog/); ⚠️ the researcher read about the first 16,000 of 65,800 characters of the blog archive, plus targeted excerpts).

### Frostpunk and Two Point Hospital

Frostpunk and Two Point Hospital fill quiet differently: they announce what is coming.

Frostpunk's main scenario is a scripted three-act arc that ends in a storm. The developers ended the game at the storm because they wanted it to stop at the climax ([Wikipedia: Frostpunk](https://en.wikipedia.org/wiki/Frostpunk), extract). The game telegraphs threats: a cold forecast means stockpile coal, and a refugee group means prepare housing. The quiet before a hit is spent paying down a known risk ([Game Informer](https://gameinformer.com/games/frostpunk/b/pc/archive/2018/04/23/frostpunk-review-a-frigid-unrelenting-survival-success), extract). Its Book of Laws puts a cooldown of 18 to 72 in-game hours on signing the next law. In one recorded run, that meant about one law every one to two days ([Gamers Decide](https://www.gamersdecide.com/articles/frostpunk-best-laws), [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3343113747), both extracts). The guide records a single run, and sources disagree on whether cooldowns apply per law or globally. Either way, the cooldown acts as a governor on how many big decisions can stack.

Two Point Hospital runs three clocks at once: a visible ladder of three stars per hospital, a yearly awards ceremony, and unscheduled interruptions such as VIP visits and emergencies. Reward sizes are fixed and published (100, 150 and 200 Kudosh for one, two and three stars), while arrival times vary ([TheGamer Kudosh guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/), extract; a single guide). ⚠️ The claim that VIPs are announced by letter in advance, and that some can be refused, comes only from a search snippet of the Fandom wiki, which returned HTTP 402. One reviewer said the only idle time came while waiting for research ([bit-tech](https://bit-tech.net/reviews/two-point-hospital-review/1/), extract).

### Other real-time cadences

- **Halo:** designer Jaime Griesemer described combat as a 3-second loop inside a 30-second loop inside a 3-minute loop. The AI backs off when the player's shields drop, so they can catch their breath ([Engadget, 2011](https://www.engadget.com/2011-07-14-half-minute-halo-an-interview-with-jaime-griesemer.html), extract; the interview was published only in part).
- **Civilization:** designer Jon Shafer argued that downtime is deliberate "negative space" in pacing. His example is Civilization 5's workers, a rhythmic break from strategic decisions ([Game Developer, Shafer 2013](https://www.gamedeveloper.com/design/negative-space), extract).
- **Notification-heavy management games** converge on three fixes: collapse repeats of one type, rank by urgency, and let stale notifications expire. Oxygen Not Included plays a quieter, shorter sound for repeated notifications ([ONI patch notes](https://oxygennotincluded.wiki.gg/wiki/Versions/OU-234773), extract). A Factorio forum thread proposes severity tiers ([Factorio forum](https://forums.factorio.com/viewtopic.php?p=380556); ⚠️ 20 of 39 posts read).
- **A Dark Room:** this idle game is one of only two sources of real-time cadence numbers found outside Left 4 Dead. Its source code steps the opening on a 30-second builder timer, with a 15-second delay before the forest unlocks ([room.js](https://raw.githubusercontent.com/doublespeakgames/adarkroom/master/script/room.js); ⚠️ raw code, but only the constants and builder logic in `room.js` and `outside.js` were read, not the whole repository).
- **Cookie Clicker:** golden cookies are an optional bonus that costs nothing to ignore. They appear every 300 to 900 seconds (about 447 on average) and stay for 13 seconds ([Cookie Clicker wiki](https://cookieclicker.wiki.gg/wiki/Golden_Cookie), extract).

| Game | Pacing device | Number | Reading status |
|---|---|---|---|
| Left 4 Dead | Relax after a peak, starting only once the fight ends; bosses exempt and never repeated | Relax 30-45 s; mobs every 90-180 s | Raw slides |
| RimWorld (Cassandra / Phoebe) | On/off cycle plus minimum spacing between big threats | 1.9-day floor in a 10.6-day cycle; 8-24 days apart | Extract, wiki unverified |
| RimWorld (Randy) | Forced big event after a long silence | 13 days, about 1.8× the average gap | Extract; ⚠️ average from an unseen image |
| Game Dev Tycoon | Sparse random events, maximum trigger count, events mid-project only | 36-84 story weeks apart; 20-90% of progress | Raw mod docs |
| Frostpunk | Cooldown after each law; telegraphed threats; scripted climax | 18-72 in-game hours | Extract, conflicting guides |
| Two Point Hospital | Fixed reward sizes, variable arrival; yearly awards | 100/150/200 Kudosh per star | Extract, single guide |
| Halo | Nested combat loops; AI backs off when the player is hurt | 3 s, 30 s, 3 min | Extract, partial interview |
| A Dark Room | Timed opening beats, then thresholds | 30 s and 15 s steps | Raw code; ⚠️ two files only |
| Cookie Clicker | Optional, penalty-free bonus with a short window | Every 300-900 s, 13 s on screen | Extract |

None of these sources gives a rule like "something interesting every N seconds" for a management game; the researcher looked and found none ([event cadence note](notes/event_cadence_and_pacing.md)). What the sources agree on is the shape. Quiet is a named state with a minimum length (Left 4 Dead's relax, RimWorld's spacing floors) and a maximum length (Randy's backstop, Phoebe's 24-day ceiling). And quiet only reads as relief if the player still has something to do in it.

## The best reward moments are staged reveals that explain themselves

### The rated release

Every tycoon in this set builds its peak around a rated release, and Game Night's reveal already follows that tradition. Game Dev Tycoon shows four virtual reviewers scoring each game out of ten, then a sales chart ([Tekrevue](https://www.tekrevue.com/game-dev-tycoon-review-minor-flaws-dont-kill-the-fun/), extract). Its developers rebuilt the review screen in version 1.6 with staged star animations, joking in the patch notes that the elation from great scores had gone up ([Greenheart blog](https://www.greenheartgames.com/blog/); ⚠️ partial read of the blog archive, as above). The recurring criticism is that the reviews are hard to read. Reviewers found the in-game reviews uninformative, so wins and losses felt like luck or formula-gaming ([Destructoid](https://destructoid.com/?p=150087), [Game Critics](https://gamecritics.com/tayo-stalnaker/game-dev-tycoon-review), both extracts).

The hand-played run found Game Night's reveal to be the best moment in the game: benchmark bars race the best rival, a "+10 over OpenBrain" chip appears, critic scores flip, and "+6M new users" lands ([todays_loops.md](notes/todays_loops.md)). The reveal itself is not the problem; what surrounds it is.

### Staging and readability

Balatro shows how much staging can carry. After a hand is played, each card and joker steps forward in turn to add its points while the numbers climb with rising sound. The designer deliberately shows no final-score preview, so the player commits and then watches the result resolve ([Game Maker's Toolkit](https://gmtk.substack.com/p/balatros-cursed-design-problem), extract). The same article argues that a score that is hidden but calculable is the worst of both worlds, because players reach for calculators and overlays.

Other games chose to show more:

- **Slay the Spire:** enemies once hid their next move. After trying a "next turn" preview, the team settled on intent icons, and playtesters preferred exact numbers ([Wikipedia: Slay the Spire](https://en.wikipedia.org/wiki/Slay_the_Spire), extract).
- **Citizen Sleeper:** the designer pre-rolls each day's dice, so the player commits only after seeing the stakes. Visible clocks expose the game's variables ([Rascal News](https://www.rascal.news/tracing-citizen-sleepers-circuitous-vector-from-tabletop-to-hit-video-game/), extract; ⚠️ only the first of two installments was available).
- **80 Days:** Jon Ingold of inkle said players first learn the rules and then want the game to show why their decisions mattered ([Game Developer, 2015](https://gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-), extract).

Game Night's own reveal is deterministic, so it is fully calculable from the player's choices. The open question these sources raise is how much of that calculation the player gets to see, before the reveal and after it.

### Small loops between the peaks

Small loops keep the player close to a payoff between peaks:

- **Two Point Hospital** rarely leaves the player more than one small task from a reward. That is the direct opposite of "weeks when nothing happened" (inference from the [TheGamer guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/), extract).
- **Balatro** follows every blind with a shop, so the moment after a reward is a decision about spending it ([Wikipedia: Balatro](https://en.wikipedia.org/wiki/Balatro), extract; ⚠️ the extract covered the first 100,000 of 137,313 characters, though the gameplay sections appeared complete).
- **Slay the Spire** ends every fight with "pick one of three cards or skip". Its act maps pin authored beats inside random content: a treasure room at the act's midpoint and a rest site before the boss ([wiki.gg: Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations), extract; ⚠️ the [Map Generation](https://slaythespire.wiki.gg/wiki/Map_Generation) page is marked under construction).
- **John Hopson's 2001 article** on behavioral game design advises keeping several activities available, so that when one runs dry another takes up the slack. It also warns that a sudden drop in reward is punishing ([Hopson, 2001](https://www.gamedeveloper.com/design/behavioral-game-design)).

Game Night's post-release "No project" office breaks both of Hopson's rules at once. The biggest reward is followed by the steepest drop, and the one obvious next activity is blocked by compute.

### Numbers that only go up

Idle games treat the interface itself as a reward and keep one number climbing:

- **Universal Paperclips**, a free browser game about an AI optimizing paperclips, defines 94 projects in its source. 45 of them unlock when an earlier project finishes; the rest unlock at stat thresholds ([projects.js](https://www.decisionproblem.com/paperclips/projects.js?v3); ⚠️ the researcher parsed every project's title, price and trigger, but not the effect code).
- Paperclips' milestone messages, from "AutoClippers available" up through trillions of clips, each append how long the milestone took to reach. Trust, the game's safety mechanic, arrives on a Fibonacci-spaced ladder that limits how fast capability can grow ([main.js](https://www.decisionproblem.com/paperclips/main.js?v3); ⚠️ only about 120 of 6,499 lines were read, via grep and short reads). Thresholds grow geometrically while output grows exponentially, so unlocks arrive at a roughly steady pace in real time (the researcher's arithmetic).
- **A Dark Room** shows a buildable item once the player holds half its wood cost, and has a character announce it, so the next goal is always visible ([room.js](https://raw.githubusercontent.com/doublespeakgames/adarkroom/master/script/room.js); ⚠️ partial read, as above).
- **Anthony Pecorella** of Kongregate describes the genre's pull as everything always going up. He warns that the newest item tends to dominate, so earlier choices stop mattering unless thresholds shift priorities ([Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i), [GDC 2015 report](https://www.gamedeveloper.com/design/the-rise-of-games-you-mostly-don-t-play), both extracts). The second extract paraphrases him in a way that conflicts with Part I, so treat its wording loosely.
- **Antimatter Dimensions** opens a new tab of mechanics at each reset layer and keeps the earlier tabs available ([AD wiki: Reality](https://antimatterdimensions.wiki.gg/wiki/Reality), extract).

Game Night's Capability badge does the opposite: it drops to 0 after every release.

### Variety and memory

Variety and memory decide whether a repeated beat feels repeated:

- **Reigns** draws from a "bag" that is filtered before every draw. Cards that do not fit the kingdom's current state are removed, and so are cards played recently. Larger cards are likelier to be drawn ([Alliot, Game Developer](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-), extract).
- **Hades** picks each character's line from many authored versions according to the game state. According to the interviewer, lines repeat only after roughly 20 to 30 runs ([GeekDad, 2019](https://geekdad.com/2019/10/narrative-and-early-access-supergiants-greg-kasavin-discusses-hades-development/), extract; ⚠️ only the second half of the interview was on the page).
- **Two Point Hospital's** reviewers singled out an advisor who repeats himself as a flaw ([Entertainium](https://entertainium.co/2018/09/30/two-point-hospital-putting-on-a-clinic/), extract).
- **Game Dev Tycoon** penalizes releasing the same genre and topic twice in a row ([Pocket Gamer](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/), extract).

Game Night's reveal posts, picked by release count rather than by what the model did, fail exactly this test ([todays_loops.md](notes/todays_loops.md)).

One caution from the same set: Reigns allows about a hundred decisions in five minutes ([Inverse](https://www.inverse.com/gaming/23117-reigns-francois-alliot-nerial-developer-interview), extract). But critic Emily Short found that frequent deaths and random draws made it a lean-back experience, in which the player often had no card that could act on what they saw coming ([Emily Short](https://emshort.blog/2016/08/20/reigns/), extract). More decisions add speed, not a sense of control.

### Loop vocabularies

Design writers describe these nested loops in different vocabularies, none of them tested. Daniel Cook defines a loop as: act, receive feedback, update your mental model. He notes that loops nest at several frequencies, and contrasts them with arcs, one-time experiences that burn out once consumed. His cheap test is to ask what repeats and what does not ([Cook, Loops and Arcs](https://lostgarden.com/2012/04/30/loops-and-arcs/)). Pete Collier proposes short, medium and long loops running at once. He singles out the hand-off from the short loop to the medium one as the point where attachment can break ([Collier, 2011](https://gamedeveloper.com/design/opinion-compulsion-loops-in-the-short-medium-and-long-term)). In Game Night, that hand-off is the step from answering a card to seeing it change the lab, and it is the weakest link the hand-played run found.

## Dopamine talk outruns the evidence on almost every claim

The phrase "compulsion loop" has no agreed origin or definition:

- Hopson's 2001 article is often credited as the source, but it never uses the word "compulsion"; it speaks of behavioral momentum ([Hopson](https://www.gamedeveloper.com/design/behavioral-game-design)).
- Joseph Kim's widely read 2014 explainer credits the idea to Hopson anyway. Kim defines the loop as a chain of activities repeated to gain a neurochemical reward, which builds a contested brain claim into the definition ([Kim, 2014](https://www.gamedeveloper.com/business/the-compulsion-loop-explained)).
- In 2011, Collier had already written that the term had no official definition ([Collier](https://gamedeveloper.com/design/opinion-compulsion-loops-in-the-short-medium-and-long-term)).

The table sets the common claims against what the sources found.

| Folk claim | What the evidence says | Strength |
|---|---|---|
| Games feel good because they release dopamine | Dopamine drives "wanting" (motivation), not "liking" (pleasure). Rats with almost no brain dopamine still like sugar but stop working for it ([Berridge & Robinson 2016](https://pmc.ncbi.nlm.nih.gov/articles/PMC5171207/)). A peer-reviewed industry essay says dopamine is probably not the cause of the pleasure of play ([Lewis-Evans 2013](https://www.gamedeveloper.com/game-platforms/dopamine-and-games-liking-learning-or-wanting-to-play-)). | Strong against the claim |
| Brain scans prove games deliver a dopamine hit | One PET study (a scan that tracks a chemical tracer) found signs of dopamine release during a video game, and the release tracked task performance. The abstract says nothing about enjoyment ([Koepp et al. 1998](https://europepmc.org/article/MED/9607763); ⚠️ abstract only, sample size unchecked). | Narrow: release during skilled play, not pleasure |
| Dopamine is the reward signal | In monkeys, dopamine neurons signal reward prediction errors, the gap between the reward expected and the reward received ([Schultz et al. 1997](https://europepmc.org/article/MED/9054347); ⚠️ abstract only). They also show a separate ramp during uncertain waits, largest at a 50 percent chance ([Fiorillo et al. 2003](https://europepmc.org/search?query=%22Discrete%20coding%20of%20reward%20probability%20and%20uncertainty%20by%20dopamine%20neurons%22); ⚠️ abstract only). | Solid in animals; applying it to a management sim is extrapolation |
| Variable-ratio schedules (rewards after an unpredictable number of actions) are the best | They produce the highest activity rates in lab animals, which Hopson says does not make them the best ([Hopson](https://www.gamedeveloper.com/design/behavioral-game-design)). On fixed-interval schedules, adults behaved markedly differently from infants and animals ([Lowe et al. 1983](https://europepmc.org/search?query=%22infant%20performance%20on%20fixed-interval%20schedules%22); ⚠️ abstract only, and about a different schedule). | Animal data; untested in management games |
| Near misses keep players hooked | In a slot-machine task, near misses felt less pleasant than full misses yet raised the wish to keep playing, but only when the player controlled the gamble. The brain-imaging group was 15 people ([Clark et al. 2009](https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737/); ⚠️ abstract, introduction and part of the discussion read; methods and results not). | Real but narrow: gambling, personal control |
| Randomized rewards cause problem gambling | In a survey of 7,422 gamers, loot-box spending was related to problem-gambling severity (η² = 0.054), with the direction of cause unknown ([Zendle & Cairns 2018](https://doi.org/10.1371/journal.pone.0206767); ⚠️ methods not read). A review reports 12 of 13 studies positive, mean r = 0.27 ([Spicer et al.](https://pureportal.bcu.ac.uk/en/publications/loot-boxes-problem-gambling-and-problem-video-gaming-a-systematic/); ⚠️ search summary only). | Correlation, and only for paid randomized rewards |
| Many decisions drain willpower ("decision fatigue") | A 23-lab preregistered replication with 2,141 people found a pooled ego-depletion effect of d = 0.04, with a confidence interval that includes zero ([Hagger et al. 2016](https://europepmc.org/search?query=%22multilab%20preregistered%20replication%20of%20the%20ego-depletion%22); ⚠️ abstract only). | The willpower mechanism failed to replicate; overload can still hurt for other reasons |
| Too many options paralyze people | A meta-analysis of 50 experiments found the average choice-overload effect close to zero, with wide variation ([Scheibehenne et al. 2010](https://archive-ouverte.unige.ch/unige:76440); ⚠️ abstract via a tool summary). A later analysis found real effects once set complexity, task difficulty and preference uncertainty are accounted for ([Chernev et al. 2015](https://www.kellogg.northwestern.edu/faculty/research/detail/2015/when-product-assortment-leads-to-choice-overload-a-conceptual); ⚠️ search summary only). | Depends on conditions: hard, unclear choices matter, not menu length |
| People juggle seven things at once | Working memory holds about four chunks, not seven ([Cowan 2001](https://europepmc.org/article/MED/11515286); ⚠️ abstract only). | Lab memory tasks; applying it to cards is extrapolation |
| Players remember the peak and the end | People judged a longer cold-water trial with a milder ending as better than a shorter one ([Kahneman et al. 1993](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.1993.tb00589.x/); ⚠️ abstract via a tool summary). | Pain studies; no game test found |
| Rewards boost motivation | Across 128 experiments, expected rewards for doing or completing an interesting task lowered later free-choice interest (d = −0.40 and −0.36). Positive informational feedback raised it (d = 0.33) ([Deci, Koestner & Ryan 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf); ⚠️ about a quarter of the paper read, results tables not). | Lab tasks with tangible rewards; extending it to game scores is inference |

Two positive frameworks have better support than the dopamine story:

- **Self-determination theory** holds that people enjoy activities that satisfy three needs: autonomy (choosing), competence (getting better) and relatedness (connection to others). In an online-game sample of 730 players, those three needs together explained 45 percent of the variation in enjoyment, but only 10 percent of the variation in intended future play ([Ryan, Rigby & Przybylski 2006](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf); ⚠️ abstract, introduction and general discussion read, not the study sections).
- **Flow theory's** "flow zone", between anxiety and boredom, is widely cited, but its game evidence is thin. Jenova Chen's viewpoint article notes that players tolerate a lull if they hope more is on the way, and warns that frequent forced choices can hurt flow ([Chen 2007](https://khoury.northeastern.edu/~lieber/courses/csu670/f08/materials/p31-chen-flow-in-games.pdf); ⚠️ about the first 7,500 of 18,600 characters read). A review summary describes dynamic difficulty adjustment as having mixed results ([Guo et al., summary](https://www.universityxp.com/research/2026/5/11/rethinking-dynamic-difficulty-adjustment-for-video-game-design); ⚠️ search summary only).

Raph Koster's view, that games teach patterns and that learning is the reward, is a designer framework, not a tested theory ([Koster slides](https://www.raphkoster.com/wp-content/uploads/2026/07/Theory-of-Fun-10-Years-Later.pdf); ⚠️ about the first 6,000 of 42,000 characters read).

The honest reading for Game Night is narrow:

- **Anticipation is where the pull lives.** The animal data place dopamine's pull in the anticipation before an uncertain outcome. For Game Night, that means the moments before the release reveal and before a board vote, which is also where honest staging matters most.
- **The near-miss and loot-box findings mostly do not apply.** Near-miss effects need gambling-like personal control, which Game Night does not have. The loot-box literature concerns paid rewards, which Game Night does not sell.
- **The population evidence is calmer than headlines suggest.** Across four surveys of 18,932 people, between 0.3 and 1.0 percent might meet criteria for internet gaming disorder ([Przybylski et al. 2017](https://europepmc.org/article/MED/27809571); ⚠️ abstract only).
- **No source gives a comfortable number of decisions per minute** for any real-time game; the loop-theory researcher looked specifically and found none ([loop theory note](notes/loop_theory_and_evidence.md)).

The defensible method is Lewis-Evans's practical advice: be skeptical of neuroscience claims and watch players in playtests instead ([Lewis-Evans](https://www.gamedeveloper.com/game-platforms/dopamine-and-games-liking-learning-or-wanting-to-play-)).

## Consent, disclosure and honest time draw the ethical line

### The academic definition

The founding academic definition comes from Zagal, Björk and Lewis (2013), read in full. A dark game design pattern is one that a designer uses intentionally to create experiences against the player's best interests, likely without their consent ([Zagal et al. 2013](https://gup.ub.gu.se/file/101018)). The paper's main points:

- **Consent is the hinge.** Painful or brutally hard games are not dark when players knowingly opt in.
- **Appointments are dark only with a penalty.** "Playing by appointment" becomes dark only when combined with a withering mechanic, such as FarmVille crops that die if the player does not return. Optional appointments are fine.
- **Time honesty is a test.** The paper asks whether the player can judge the time commitment, and whether the real time needed differs much from what they expected. Both questions apply directly to a timed run.
- **Serious games can manipulate too,** if they hide their real goal.
- **Disclosure helps.** Once a player understands a pattern and consents to it, it stops being dark.
- **There is no bright line.** The paper admits it offers no bright-line tests.

The community catalog at darkpattern.games is not peer-reviewed. It lists temporal patterns (daily rewards, appointments, infinite treadmill, can't pause) and psychological ones (variable rewards, complete the collection, fear of missing out). It notes that grinding is fine for those who enjoy it, and turns dark only when paired with wait timers or pay-to-skip ([darkpattern.games](https://www.darkpattern.games/), [Grinding](https://www.darkpattern.games/pattern/12/x.html)).

### Designers' practical tests

- **Celia Hodent**, former Fortnite UX lead, asks studios to reward breaks, or at least not punish them. Her example is World of Warcraft's rest bonus ([Hodent interview, 2019](https://gamedeveloper.com/design/former-i-fortnite-i-ux-lead-digs-into-ethical-game-design)).
- **Jonathan Blow's** 2007 talk is known through a published report rather than his slides. He called scheduled rewards drugs rather than food, and proposed stripping them out to see whether the gameplay still stands ([Game Developer report](https://www.gamedeveloper.com/game-platforms/migs-2007-jonathan-blow-on-the-i-wow-i-drug-meaningful-games)).
- **Chris Hecker's** harm-reduction list says rewards should be unexpected, absolute rather than relative, part of the activity itself, and informational rather than controlling ([Hecker, GDC 2010](http://chrishecker.com/Achievements_Considered_Harmful%3F)). This matches the Deci finding: informational feedback raises interest, while expected contingent rewards lower it.
- **Ian Bogost** built Cow Clicker as a satire of FarmVille's timers. 50,000 people played it sincerely, and he himself felt compulsively attached ([NPR, 2011](https://www.npr.org/transcripts/142518949)). A stripped-down hook works even when it is meant as a joke.
- **Frank Lantz** framed Universal Paperclips the other way. He wants the game to hypnotize, but consensually, and wants players to step back afterwards and reflect on what else in their lives works like that ([Y Combinator interview](https://ycombinator.com/blog/frank-lantz-director-of-nyus-game-center-and-creator-of-universal-paperclips), extract). He kept it free, with no social recruitment and a definite ending ([Reed, 50 Years of Text Games](https://if50.substack.com/p/2017-universal-paperclips); ⚠️ a few long lines were cut in the researcher's display).

### Regulation

Regulation barely reaches a free game:

- The FTC's $520 million Epic Games settlement targeted purchase flows and children's privacy ([FTC, 2022](https://www.ftc.gov/news-events/news/press-releases/2022/12/fortnite-video-game-maker-epic-games-pay-more-half-billion-dollars-over-ftc-allegations), extract).
- The EU consumer network's 2025 principles on virtual currencies exclude currencies earned only through play ([Reed Smith summary](https://www.reedsmith.com/articles/qas-on-the-eu-consumer-protection-authorities-joint-guidance-paper/); ⚠️ a law-firm summary; the Commission's own text was not reached).
- The live standard is the EU's emerging idea of "addictive design": features that make people spend more time online than they intended, with penalties for breaking a streak as one example ([Osborne Clarke, 2025](https://www.osborneclarke.com/insights/digital-fairness-act-unpacked-addictive-design)). ⚠️ Whether the Digital Fairness Act proposal had been published as of October 2026 was not verified.

### Teaching games

Teaching games supply the strongest precedent for using a loop's pull as the lesson:

- **Bad News** is a 15-minute game in which players earn followers and badges by using six misinformation techniques. A pre/post survey of 14,266 paired responses found that people rated manipulative items as less reliable afterwards (average d = 0.52), while their ratings of real news did not move. The study had no randomized control group, and the sample was self-selected ([Roozenbeek & van der Linden 2019](https://doi.org/10.1057/s41599-019-0279-9)).
- **Harmony Square**, its successor, ran a randomized trial with 681 people and found a similar effect (d = 0.51) ([HKS Misinformation Review](https://misinforeview.hks.harvard.edu/article/breaking-harmony-square-a-game-that-inoculates-against-political-misinformation/); ⚠️ read from a text extraction with long lines cut; supplement not read).
- **Papers, Please:** Lucas Pope built the mechanics first and advised integrating gameplay with the message ([Reason, 2013](https://reason.com/2013/09/26/papers-please-politics-in-games-and-the/)).

The shared pattern is to reward the player for doing what the system rewards, then reveal it. A meta-analysis of gamified learning is a useful brake on enthusiasm: effects were small and positive, and in the high-rigor subset only the cognitive learning effect held ([Sailer & Homner 2020](https://opus.bibliothek.uni-augsburg.de/opus4/files/109056/109056.pdf); ⚠️ methods and tables not read in full).

### Where Game Night stands

Measured against these tests, Game Night is mostly in good shape. The run has a real end, the player's results are deterministic rather than variable rewards, every card stops the clock so stepping away costs nothing, and nothing is sold. Two items deserve attention:

1. **Time honesty.** The run is 30 minutes of clock, but by the measurement tool's time model it takes 60 to 85 real minutes. That model is an assumption, not a measurement of people. A gap like this is exactly what Zagal's time questions ask about ([todays_loops.md](notes/todays_loops.md); [Zagal et al.](https://gup.ub.gu.se/file/101018)).
2. **The endings counter.** "Endings found: n of 11" on the title screen is a light case of the catalog's complete-the-collection pattern. With no timer, streak or penalty attached, it passes Zagal's consent test, and it should stay that way.

⚠️ One angle the research did not reach: how real AI labs optimize engagement in their own products. That would make the reward-then-reveal pattern directly on-topic for Game Night. The researcher tried to source it, but the one fetch attempted returned HTTP 403, and the topic was not researched further ([ethics note](notes/ethics_and_teaching_games.md)).

## Conclusion

The research changes the question from "how many events" to "what shape, and what fills the gaps". The games that avoid both overload and drought do it with spacing rules: a floor between big beats, a ceiling on silence, and a relax that starts only once the last dialog closes. They also make sure the quiet phase is never idle, because it holds a visible goal, a countdown or a reward to spend. Game Night's numbers say its prompt gaps are already in a reasonable range when measured in seconds. Three things make them feel like empty weeks: a calendar racing at one day per second, decisions that vanish without a readable result, and a core loop that stalls right after its peak. Those are cheaper to fix than the event count, and fixing them needs none of the mechanisms the ethics literature flags.

The evidence base also changes what Game Night can honestly claim to be doing. "Dopamine loop" is folklore with a kernel of animal science about wanting and anticipation. The defensible design vocabulary is feedback that teaches: Cook's loops, Deci's informational feedback, and self-determination theory's competence, checked in playtests rather than justified by neuroscience. For a game about AI labs, this leaves an opening that none of the precedents fully used. The lab's own pull toward the next release and the next user milestone is the race dynamic the game is trying to teach. The end-of-run debrief is the natural place to name that pull, as Bad News and Paperclips do.

## Implications for Game Night

Five principles follow from the sources, each tied to a measured problem:

1. **Pace in seconds of running clock, not story weeks.** The same 50 to 60 second gap reads as seven empty weeks in era 1 and as no empty week in era 5 ([todays_loops.md](notes/todays_loops.md)). A Dark Room, Left 4 Dead and Halo all set their cadence in real time.
2. **Treat quiet as a state with a floor and a ceiling.** This follows Left 4 Dead's relax and RimWorld's spacing floors and backstop. Era 2's first round and the fixed same-day stacks are clusters with no enforced relax after them.
3. **Give every quiet stretch a job and a visible change.** This follows Hopson's rule of keeping several activities available, Shafer's negative space, and the Game Dev Tycoon players who asked for idle time to produce value. Today the measured quiet is filled by a ticking badge and a "No project" office.
4. **Make every decision and every reveal explain itself.** This follows Deci's informational feedback, Slay the Spire's intents, Citizen Sleeper's exposed variables and 80 Days' players. Cards currently report no numbers and are first judged six minutes later.
5. **Keep the pull honest.** Results stay deterministic. There are no streaks, no penalties for stepping away and no near-miss framing. The time cost is stated up front, and the hooks are named at the end. This follows Zagal's consent and disclosure tests, Hodent, Clark's near-miss findings and the Bad News pattern.

The targets below turn those principles into numbers to test. No source gives a validated cadence for a real-time management game, so each figure is a starting point derived from the named source's ratios, to be checked against the measurement tool and against people.

| Target | Aim | Basis in sources | Measured problem it answers |
|---|---|---|---|
| Average clock-stopping density | About one clock-stopping prompt per 45 to 60 s of running clock, in every era | Era 1's current rate (one per about 52 s) is not the overloaded part. Game Dev Tycoon and Left 4 Dead set slower gaps for their big beats ([gdt-modAPI](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addEvent().md), [Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)). No source gives a decisions-per-minute figure. | Era 2 runs at 13.7 to 14.9 clock-stopping prompts per six minutes, about one per 25 s |
| Cluster cap | No more than two clock-stopping prompts inside any 30 s of running clock, and never two on one story day unless the second is a chained follow-up | Left 4 Dead's 3 to 5 s sustain peak, then fade; CK2's batching queue as the cause of pile-ups; about four chunks of working memory (⚠️ abstract only, extrapolated) | 2.6 to 3.9 same-day stacks per game; the hand-played triples at day 105 and day 455 |
| Enforced relax | 30 to 45 s of running clock with no new clock-stopping prompt after any cluster or set piece, counted only from when the last dialog closes | Left 4 Dead's relax length, and its rule that relax cannot start until the fight ends ([Booth](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf)) | Era 2's first round (7.4 to 8.2 prompts) followed by its near-empty second round |
| Set-piece spacing | Era transition, summit, President, board meeting, cash warning and training hazard at least about 60 s of running clock apart, placed as fixed scaffolding that random cards yield to | Cassandra's spacing floor at 18 percent of her cycle, scaled to a six-minute era (extract); Left 4 Dead's bosses, exempt from pacing and never repeated; Slay the Spire's pinned floors (⚠️ wiki under construction) | Era transition plus cash warning in every game; President plus training hazard in 37 of 40 careful-bot games |
| Quiet ceiling | No stretch longer than about 90 s of running clock without either a decision or a visible payoff | Randy's forced event after about 1.8 times the average gap (⚠️ the average comes from an image the extract could not show), applied to a 50 s average gap | Longest quiet reaches 140 s (era 1, balanced bot) and 96 s (era 3); at one day per second, 90 s is 13 empty weeks |
| Visible beat | Something the player cares about changes on screen at least every 30 s: a milestone line, a go-live, a payback, a user count, or a feed reaction surfaced as a toast | A Dark Room's 30 s step (⚠️ partial code read); Halo's 30-second middle loop (extract); Paperclips' timed milestone lines (⚠️ partial code read) | 25 s of only a ticking badge in the first run; go-live, payback and user milestones happen silently; feed reactions hide behind the phone badge |
| Decision feedback | Within a couple of seconds of answering, one line naming what moved and by how much; a first verdict on the choice before the round ends, not six minutes later | Deci's informational feedback (d = 0.33; ⚠️ partial read); Hecker's informational rewards; Slay the Spire players preferring exact numbers (extract); 80 Days players wanting to see why choices mattered (extract); Game Dev Tycoon's delayed consequences of one to three weeks | "Handled: ... it ended with ..." with no numbers; first judgment at The Daily Token recap |
| Core-loop peak | About two release reveals per era for typical play, each followed at once by an available next step: a run that fits the free compute, or a choice about spending the reward | Game Dev Tycoon's per-game cycle carrying its time (a finished game about every 4 real minutes, anecdotal arithmetic); Balatro's shop after every blind (⚠️ partial extract); Hopson's warning against sharp drops in reward | Balanced bot makes one reveal per era, careful bot 0.3 in era 5; "No project" and a compute-blocked second run right after the first reveal |
| No repeats within a run | No event card and no reveal reaction text shown twice in one run; reactions keyed to what the model did | Reigns' bag removing recent and irrelevant cards (extract); Game Dev Tycoon's maximum trigger count; Hades' state-keyed lines (⚠️ half the interview read); Two Point Hospital's repeating advisor criticized (extract) | The second reveal's posts repeated the first's almost word for word |
| A number that only goes up, and an era that announces itself | One lab-level measure that never resets during a run; each era opens by naming what changes and adds one new system while earlier panels stay | Pecorella's everything-goes-up (extract); Paperclips' milestone ladder (⚠️ partial read); Antimatter Dimensions' layers (extract); Collier's long loop | Capability badge drops to 0 after each release; the `eraIntro.js` "what changes" bullets exist but no screen reads them; nothing grows inside an era |
| Telegraphed set pieces | Every scheduled set piece announced ahead with a countdown or clock, so quiet stretches carry anticipation | Frostpunk's forecasts (extract); Game Dev Tycoon's countdown phrasing for console launches (raw mod docs); Citizen Sleeper's clocks (extract); dopamine's cue-triggered wanting (Berridge & Robinson) | The rival-launch rumour chip arrived in the same moment as a training finish and a card |
| Honest pull | Keep player-side results deterministic; frame losses by their causes, never as "so close"; no streaks, daily bonuses or penalties for stepping away; state the real run length up front; name the hooks in the end-of-run debrief | Zagal's time questions and disclosure principle; Clark's near-miss findings (⚠️ partial read); Hodent; the Bad News reward-then-reveal pattern; Lantz's consent framing (extract) | The run is 30 clock minutes but an estimated 60 to 85 real minutes (time-model assumption); the endings counter is a light collection pattern |

Two additions to the measurement tool would let each target be checked in the bot runs as well as in playtests:

- the largest number of clock-stopping prompts in any 30-second window;
- the longest stretch with neither a decision nor a visible payoff.

The loop-theory researcher's advice applies to both. Log time-stamped decisions and count them per 60-second window. Set a maximum per window and a maximum gap with no decision. Then compare against what playtesters report, since no published figure replaces that ([loop theory note](notes/loop_theory_and_evidence.md)).

## Coverage

I read all seven notes in `docs/research/reward-loops/notes/` to the end: `todays_loops.md`, `event_cadence_and_pacing.md`, `loop_theory_and_evidence.md`, `tycoon_and_management_games.md`, `card_roguelite_narrative_games.md`, `idle_incremental_games.md` and `ethics_and_teaching_games.md`. I did not reopen any source the notes cite, so every external finding above is the researchers' reading.

As instructed, I did not open the two older background documents (`docs/research/event-cards/report.md` and `docs/playtests/2026-10-14-pacing-measurement.md`). The event-cadence note quotes an older measurement: 87 to 89 percent of weeks without a prompt, and a pile-up at the hand-over from era 4 to era 5. This report uses the current `main` numbers in `todays_loops.md` instead.

No email address was used in any lookup, by me or (per their own statements) by the researchers.

### Today's loops (orchestrator's first-hand map)

This map was built from three sources: a bot measurement on `main` 28cdc52 (40 seeds, careful and balanced bots), a hand-played run of era 1 and the start of era 2, and a code inventory by a subagent, with spot-checks. Its coverage limits:

- ⚠️ Eras 3 to 5 were not played by hand.
- ⚠️ The inventory sampled `sim/data/feedReactions.js` (4,917 lines), read only lines 1 to 50 of `ui/screens/release.js`, and only grepped `ui/screens/president.js`, `ui/screens/hazard.js`, `sim/finale.js` and the ending films.
- The real-time figures (13 to 20 minutes per era, 60 to 85 minutes per run) come from the tool's time model, which is an assumption.

### Event cadence and pacing

**Read in full as raw text:** Booth's Left 4 Dead slides (932 lines; images and charts not extractable).

**Read through a model-written extract, reported complete:**
- the RimWorld wiki pages (Cassandra Classic, Phoebe Chillax, Randy Random, AI Storytellers, Raid points);
- Game Developer pieces by Sylvester, Shafer and Pears;
- the Stellaris and CK3 modding wikis (CK3 has stub sections);
- the Inven Global Frostpunk write-up;
- the Engadget Griesemer interview (partial by design);
- the PaceMaker paper;
- the Oxygen Not Included patch notes;
- the Notes by Lex and Lost Garden pages on Schell.

**⚠️ Read in part:**
- the CK2 modding wiki (first 100,000 of 117,330 characters);
- the RimWorld Raid page (about 200,000 of 479,684 characters);
- the Factorio forum thread (20 of 39 posts).

**⚠️ Search snippets only:** FTL sector and rebel fleet details, CK3 repeat-prevention reports, a Klei forum reply, Wikipedia's description of RimWorld's storytellers, and Halo's 2010 GDC talk.

**⚠️ Not reached:**
- RimWorld "Storytellers" and "Threat points" pages (404);
- FTL Rebel Fleet pages (402, 401);
- Sylvester's book and GDC 2017 talk;
- Schell's own text;
- any Game Maker's Toolkit pacing episode;
- Frostpunk storm numbers;
- Into the Breach turn count;
- Two Point Hospital design statements;
- Paradox developer diaries.

### Loop theory and evidence

**Read in full as raw text:**
- Hopson 2001;
- Cook's "Loops and Arcs" (article body; reader comments only partly);
- Lewis-Evans 2013;
- Kim 2014;
- Collier 2011;
- Berridge and Robinson 2016 (through the conclusion);
- Booth's slides.

**⚠️ Abstracts only (read completely, but not the papers):** Schultz 1997, Koepp 1998, Przybylski 2017, Hagger 2016, Fiorillo 2003, Berridge 2012, Anselme 2013, Cowan 2001, Iyengar and Lepper 2000, Lowe 1983.

**⚠️ Read in part:**
- Clark 2009 (abstract, introduction opening, first part of the discussion);
- Zendle and Cairns 2018 (methods not read);
- Ryan, Rigby and Przybylski 2006 (study sections not read);
- Zagal 2013 (abstract plus two sections in this note; read in full in the ethics note);
- Chen 2007 (first 7,500 of 18,600 characters);
- Koster's slides (first 6,000 of about 42,000 characters);
- Broome 1996 (about half);
- Nielsen and Blom (abstract page only).

**⚠️ Tool or search summaries only:** Scheibehenne 2010, Kahneman 1993, Chernev 2015, Spicer 2022, Garea, Sailer 2017, Guo on difficulty adjustment, Schell via a blog, Adams and Dormans, and the listing for Hodent's book.

**⚠️ Not reached:**
- Cook's "Chemistry of Game Design";
- Crowe and Buchanan, Beresford, and Katkoff;
- Reid 1986;
- the full texts of the abstract-only papers;
- the books by Csikszentmihalyi, Schell, Hodent and Koster;
- Danziger 2011;
- the Burnett and Blanchard critique (not used).

### Tycoon and management games

**Read in full as raw text:** the Game Dev Tycoon mod API wiki pages on GitHub (addEvent, Notification, Weightings, Date, company, GDT, addResearchItem, addPlatform and others).

**⚠️ Read in part as raw text:** the Greenheart Games blog archive (about the first 16,000 of 65,800 characters, plus targeted excerpts).

**Read through a model-written extract:**
- Wikipedia pages for Game Dev Tycoon, Frostpunk, Game Dev Story and Two Point Hospital (⚠️ the last covered 100,000 of 106,369 characters);
- reviews and guides: Tekrevue, Pocket Gamer, Destructoid, Game Critics, Milton Lane, TheGamer, Gamers Decide, MacMyths, Game Informer, bit-tech, Entertainium, MCV, The Sixth Axis, Xbox Wire, Digitally Downloaded;
- Steam threads and a Steam guide.

**⚠️ Search snippets only:** Fandom wiki claims on G3 timing, VIP letters and conventions; a GameSkinny developer quote; the indienova Frostpunk report; the Frostpunk 2 cooldown; Mad Games Tycoon 2 review theories.

**⚠️ Not reached:**
- Fandom and wiki.gg pages (402, 403, blocked);
- PC Gamer's Frostpunk and Two Point Hospital pieces (title only);
- any GDC talk or postmortem on these games.

**Not researched:** Football Manager, Software Inc, Startup Company, Prison Architect.

### Card games, roguelites and narrative games

Every page came through a summarizing fetch tool, so "complete" means the tool reported it complete.

**Reported complete:**
- Wikipedia pages for Reigns, Slay the Spire, Citizen Sleeper, Suzerain, 80 Days, Papers, Please, Inscryption and FTL;
- Alliot's Reigns article, the Inverse Alliot interview, and Emily Short's review;
- the FTL postmortem article and the Engadget pitch;
- the Rogueliker LocalThunk interview and the Game Maker's Toolkit Balatro article;
- the Game Developer, PocketGamer.biz, IF50 and MCV pieces on 80 Days;
- Slay the Spire's wiki.gg summary pages;
- the GeekDad, Engadget and Inven pieces on Hades;
- the Citizen Sleeper case study and the Rascal installments;
- a Suzerain review.

**⚠️ Read in part:**
- Wikipedia's Hades page (100,000 of 118,331 characters) and Balatro page (100,000 of 137,313);
- the Hades narrative-design excerpt;
- Road to the IGF;
- the Podwise AI outline of the Slay the Spire GDC talk;
- a podcast page with show notes only;
- the Her Majesty article (its video not included);
- chapter 2 only of the FTL making-of;
- the AV Club Suzerain capture;
- the Fextralife and RPGSite Hades pages (flagged inconsistencies);
- a third-party Balatro analysis;
- Emily Short's GDC abstracts.

**⚠️ Not reached:**
- GDC Vault talks for FTL, Slay the Spire, Hades and Ingold;
- AppUnwrapper, TouchArcade, RPGamer and other pages that returned 403;
- the FTL Fandom Rebel Fleet page (402);
- several wiki.gg and hades.wiki.gg pages (404, 401).

Claims that rested on search snippets only were not used as findings in this report: MacStories, the Reigns "second third", FTL blue options, the 80 Days blackjack comparison, Suzerain ending counts, Citizen Sleeper drives, and Hades' 22,000 lines.

### Idle and incremental games

**Read in full as raw text:**
- Alharthi et al., "Playing to Wait" (CHI 2018; body through the conclusion; references not read);
- Fizek 2018 (through the conclusion; bibliography not read).

**⚠️ Read in part as raw text:**
- Universal Paperclips `projects.js` (titles, prices and triggers of all 94 projects parsed; effect code not read) and `main.js` (about 120 of 6,499 lines);
- A Dark Room `room.js` and `outside.js` (constants and builder logic only; other files not read);
- Wired's Cow Clicker profile via the Wayback Machine (about 31,500 of 38,000 characters).

**Read through a model-written extract:**
- Pecorella's three "Math of Idle Games" articles and his GDC Europe 2016 slides;
- the Game Developer report on his 2015 talk;
- Wikipedia pages for Universal Paperclips, Cookie Clicker, A Dark Room, Candy Box and incremental games;
- the IF50, Y Combinator, GamesBeat and Vice pieces on Paperclips;
- the Cookie Clicker golden-cookie wiki page;
- Antimatter Dimensions wiki.gg pages;
- the Kittens Game Steam page;
- a book landing page.

**⚠️ Not reached:**
- Wired's and The Verge's Lantz pieces;
- podcast transcripts;
- Pecorella's GDC Vault video and Kongregate blog posts;
- the Kittens Game wiki;
- TV Tropes and MetaFilter (403);
- Bogost's own Cow Clicker essay;
- Deterding's "Progress Wars";
- an unidentified DiGRA PDF that returned binary data.

### Ethics and teaching games

**Read in full:**
- Zagal, Björk and Lewis 2013 (all pages);
- the Bad News paper (through the discussion and limitations);
- the Hodent interview;
- the NPR Cow Clicker transcript;
- the Game Developer report of Blow's 2007 talk (a report, not his slides);
- Hecker's page (archive copy);
- Cook's "Loops and Arcs";
- the Osborne Clarke and Reed Smith law-firm pieces;
- the Reason interview with Pope;
- the darkpattern.games home page and the cited pattern pages;
- the FTC Epic press release (⚠️ through a summarizing fetch, not raw).

**⚠️ Read in part:**
- Deci, Koestner and Ryan 1999 (about a quarter; results tables not read);
- Sailer and Homner 2020 (methods and tables not read in full);
- Harmony Square (text extraction with long lines cut; supplement not read);
- Reed on Paperclips (a few long lines cut);
- Madigan's SimCity Social post (first and last sections read directly, the middle via a tool summary);
- Niknejad et al. 2024 (abstract, introduction and keyword hits);
- Wikipedia pages for Cow Clicker, Papers, Please and procedural rhetoric (skimmed).

**⚠️ Not reached:**
- the EU Commission's own text of the virtual-currency principles;
- the UK loot-box response;
- the FTC HoYoverse pages;
- the status of the Digital Fairness Act proposal as of October 2026;
- Bogost's essay and book;
- Blow's and Hecker's slides and audio;
- Hodent's book and talk;
- Madigan's book;
- Ryan 2006 in this note (read in part in the loop-theory note);
- the CDC and classroom Plague Inc pages;
- The Stanley Parable essays;
- any source on AI labs' own engagement optimization (one fetch returned 403).

**Not researched:** This War of Mine, Fate of the World, the Democracy series.
