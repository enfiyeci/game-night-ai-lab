# Reward loops and event cadence in tycoon and management games (Game Dev Tycoon, Two Point Hospital, Frostpunk, plus Game Dev Story and Mad Games Tycoon 2)

Reading note: this is unverified research output (provenance record). Method limits are listed in the Coverage section at the end. In short: most web pages came back through a fetch tool that returns a model-written extraction of the page, not raw text, and several sources were blocked (Fandom wikis, PC Gamer bodies). Claims that rest only on a search-result snippet carry a ⚠️ inline. Direct quotes are kept under 15 words.

## 1. Game Dev Tycoon: loop, reward moments, recurring events, quiet periods

### Takeaway
Game Dev Tycoon (GDT) fills time mainly with its own development cycle (pick, slide, watch bubbles, release, read four reviews, watch sales) rather than with random events: the developers' own code defaults put random story events 36 to 84 weeks apart, and platform news and the annual G3 convention are the scheduled punctuation. Player and reviewer complaints cluster on two poles: "too fast, nothing to do in the gaps" on the long run and "dry and monotonous" in the early garage years.

### Cited Findings

Development loop and the bubbles
- The loop in one line: choose name, topic, genre and platform, then set sliders across three screens; the three phases split effort between engine/story/gameplay, then dialogue/level design/AI, then world design/graphics/sound. — [Destructoid review](https://destructoid.com/?p=150087); phase contents from [Milton Lane Substack](https://miltonlane.substack.com/p/game-dev-tycoon) and a search-result summary of a guide (⚠️ snippet only, no page fetched: [Steam discussion](https://steamcommunity.com/app/239820/discussions/0/2949168687310142484))
- Time given to one slider area comes out of the others. — [Milton Lane Substack](https://miltonlane.substack.com/p/game-dev-tycoon)
- Production "bubbles" float from the character's computer to a progress meter split into Design, Technology and Research; Design and Technology determine success, Research unlocks techniques (for example 3D graphics). — [Tekrevue review](https://www.tekrevue.com/game-dev-tycoon-review-minor-flaws-dont-kill-the-fun/)
- One critic calls the bubble-popping repetitive, social-game-style feedback (paraphrase of the fetch extraction, not a verbatim quote), and another says there is no clear preview of finished quality while sliding. — [Destructoid review](https://destructoid.com/?p=150087); [Game Critics review](https://gamecritics.com/tayo-stalnaker/game-dev-tycoon-review)
- Bugs accumulate during development and must be fixed before release; shipping with many bugs hurts reception. — [Tekrevue review](https://www.tekrevue.com/game-dev-tycoon-review-minor-flaws-dont-kill-the-fun/)
- Founders' stated intent: a game dev simulator "where the player would have finer control over the decisions of what to focus on during game development", inspired by Kairosoft's Game Dev Story. — [Greenheart blog, 5th Steam anniversary post, Patrick Klug, 31 Aug 2018](https://www.greenheartgames.com/blog/)
- In the paper/turn-based prototype they spent "a few months" building the algorithms for how points are generated, what decisions players make, and how virtual games are reviewed and judged; they then converted turn-based to real-time and moved to an always-visible isometric office. — [Greenheart blog](https://www.greenheartgames.com/blog/)
- Quote attributed to the developers in a Game Dev Story comparison review: they wanted a game "less random, more about your choices". ⚠️ Search snippet only; the page ([GameSkinny](https://www.gameskinny.com/reviews/game-dev-tycoon-retread-rip-off-or-rebirth/)) returned HTTP 403, so I could not verify the wording or context.

The review reveal, "hit" moment and sales graph
- After release, four virtual reviewers score the game on a ten-point scale with short feedback; sales then appear on a chart at the side of the screen with weekly revenue underneath. — [Tekrevue review](https://www.tekrevue.com/game-dev-tycoon-review-minor-flaws-dont-kill-the-fun/). Same review: it does not describe a dramatic reveal (the reviewer did not remark on suspense either way).
- Version 1.6 (9 Mar 2018) rebuilt the review screen "inspired by the mobile UI" with star animations. The patch note jokes that the sudden rush of anger from a bad score from the reviewer "All Games" is unchanged while the elation from amazing scores is increased. This is the only reviewer name I could confirm, and it is a first-party source. — [Greenheart blog, v1.6 post](https://www.greenheartgames.com/blog/)
- An Apple App Store editorial quoted by Patrick Klug describes the staging: after choosing platform, topic, genre and focus areas, "minutes later, your new game has launched", and "the thrill of releasing a monster hit that earns 10 out of 10 reviews" is the pay-off for the busy management. — [Greenheart blog, iOS sales report](https://www.greenheartgames.com/blog/)
- Players report scores above 10 are possible ("the 11 is described as random, working like the 10"). — [Steam thread on review scores](https://steamcommunity.com/app/239820/discussions/0/1639788130290877045) (anecdotal)
- Score mechanics are contested and community-derived, not documented: one poster says the score is set by how much better the game is than your previous best; the Design and Technology tallies on the post-development Finish screen predict the review; a record in one of the two gives about 8 to 9, and records in both give a 10. A second poster disputes this and a third calls the game "more of a slot machine than a simulation". — [Steam thread on review scores](https://steamcommunity.com/app/239820/discussions/0/1639788130290877045)
- Genre/topic fit is encoded as weightings between 0.6 and 1.0 (terrible to great) in six genre slots and three audience slots; example Game Dev topic fits Simulation at 1.0 and Action at 0.6. — [gdt-modAPI wiki, Weightings](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/Weightings.md)
- Reviewers complain the in-game reviews are uninformative ("everything is good or bad") so wins and losses feel like luck or formula-exploiting. — [Destructoid review](https://destructoid.com/?p=150087); [Game Critics review](https://gamecritics.com/tayo-stalnaker/game-dev-tycoon-review)
- Repeat protection: releasing the same genre/topic back to back gives below-average scores and reduced sales; a Game History tab tracks it. — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- Boom-bust loop that the developer himself describes: players "make a hit-game as a small team, make millions and then overstretch", then cannot pay staff and a publisher parody buys their IP. — [Greenheart blog, Patrick Klug](https://www.greenheartgames.com/blog/)
- Bankruptcy triggers at -$50,000 per a tips article. — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)

Marketing, hype, fans, G3 convention
- Marketing is only available during development; mid-development is the best time; a successful campaign adds fans and hype, and hype leads to more sales. — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- G3 invitation arrives mid-development and can be skipped; small booth $50,000, large over $1 million; attending builds hype and fans. — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- Timing of G3: a player post says a popup in month 4 offers a stall and the convention falls in month 6, week 2. — [Steam thread, G3 events](https://steamcommunity.com/app/239820/discussions/0/666826251155959074/) (anecdotal, from 2013)
- Developer statement on when G3 first appears: "I believe G3 unlocks somewhere late in year 8", and he says he tested the conference in 1.3.12. — [Greenheart forum, thread 1.3.12 no G3](https://forum.greenheartgames.com/t/1-3-12-no-g3-convention/5622) (Patrick Klug, hedged)
- ⚠️ Fan-wiki claims seen only in a search-result summary (Fandom page returned HTTP 402): G3 is annual; the booth prompt comes at the start of month 5 and the show at the start of month 6; payoff scales with fan count and visitors, with booth size a minor factor; a custom convention unlocks at 1,000,000 fans or in year 23 and may replace or add to G3. Source: [Fandom Convention page](https://gamedevtycoon.fandom.com/wiki/Convention).
- A player says hosting a convention or winning G3 "boosts hype of the game you're developing and increases MMO and console sales". — [Steam thread](https://steamcommunity.com/app/239820/discussions/0/864977564271764425/) (one anecdotal answer)
- One critic: the in-game E3 stand-in lets you raise hype by booth size, but it is unclear how much hype affects sales. — [Destructoid review](https://destructoid.com/?p=150087)

Contracts, research, offices, industry events
- Early income comes mainly from contract work, which also gives research points; a player says they use contracts "mostly for research points". — [Destructoid review](https://destructoid.com/?p=150087); [Steam discussion snippet ⚠️](https://steamcommunity.com/app/239820/discussions/0/540744935446628750)
- Contracts can pay over $20,000 early; failure costs about $8,000; publisher contracts name a genre/topic combination, platform, rating and minimum review score; completing one boosts fans. — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- Research point costs by technology level range from 10 (level 1) to 300 (level 14) in the mod docs table. — [gdt-modAPI wiki, addResearchItem](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addResearchItem().md)
- Trends appear at random, typically after moving to the big office; a news report announces when the market normalises. — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- Each new game brings a media interview (for example "Gameplay or Graphics?") with expert reactions that inform later games. — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- Platform stories are scripted news: the mod docs show a console announced with countdown phrasing ("in two months") and a release date, and say to use a helper that generates phrases like "later this month" or "later next year". Platforms have a start date, a retirement date and units-on-market; example platform ships with an announcement event dated before release. — [gdt-modAPI wiki, Date](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/Date.md); [gdt-modAPI wiki, addPlatform](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addPlatform().md)
- Parody consoles (GS, PlaySystem, mBox, Vena Oasis, TES, grPad) and staged office/era unlocks (new offices, R&D lab, hardware lab). — [Wikipedia, Game Dev Tycoon](https://en.wikipedia.org/wiki/Game_Dev_Tycoon)
- Progression unlocks gradually as games are made; the game starts in a garage in the early 1980s with no staff and few options. — [Wikipedia, Game Dev Tycoon](https://en.wikipedia.org/wiki/Game_Dev_Tycoon)

Random events: the developers' own rules (strongest cadence evidence)
- Default random-event rate: "random events happen every 36 + 48 * random() weeks by default", queried from a pool of events flagged random; non-random events with a custom trigger are checked "every second or so"; events can fire on a date, a trigger, with a maximum trigger count. — [gdt-modAPI wiki, GDT.addEvent](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addEvent().md)
- Date format is y/m/w (year/month/week), and the default game is 35 years via a 1.16667 length modifier over a 30-year base; 42 years is the slow option. — [gdt-modAPI wiki, Date](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/Date.md)
- Event writing guidance in the official example: events during development "work better if they don't fire right at the start or right at the end" (the example gates on 20 to 90 percent progress); split a story over two screens with {n}; choices capped at three; "it's best if every decision has a different outcome"; consequences can be delayed by a random 1 to 3 weeks (a kid breaks in again and costs 500 credits); hype swings of 5 to 15, or 15 to 40 for the best choice. — [gdt-modAPI wiki, GDT.addEvent](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addEvent().md)
- Notification types (platform news, industry news, new research available, company milestones, sales reports, game reports, events, auto-popup, others); since 1.6 they can sit in a sidebar instead of opening automatically; events with options count as Events. — [gdt-modAPI wiki, Notification](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/Notification.md)
- The 1.6 sidebar: messages "can stack", "gently pulse and disappear if you ignore them too long", defaults "tuned for first-time players", progression hints moved to auto-open as milestones. — [Greenheart blog, v1.6 post](https://www.greenheartgames.com/blog/)
- Hook points the game exposes include beforeGameReview, afterGameReview, salesCalculated, weekProceeded, contractFinished, researchCompleted, trainingFinished, staffHired. This shows the real beat list of the loop. — [gdt-modAPI wiki, GDT](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.md)

How often things happen in a typical year (estimates, all anecdotal)
- A Steam user: default 35 years is about 5 hours of play; another asks whether reaching year 20 in about 3 hours is too fast; one player reports 40+ games by year 20; another says the game "advances a couple of weeks" when you lean back after finishing a game. — [Steam thread on game speed](https://steamcommunity.com/app/239820/discussions/0/864977564053270644)
- Opinions split: "too fast" (several), "if it were any slower it would be boring", and requests for a speed setting, a slowdown of 10 to 15 percent, and research points from staff who are idle so "idle time still produces value". — [Steam thread on game speed](https://steamcommunity.com/app/239820/discussions/0/864977564053270644)
- Reviewer views of pacing: too fast, never reaches top-tier by the end ([Tekrevue](https://www.tekrevue.com/game-dev-tycoon-review-minor-flaws-dont-kill-the-fun/)); early game dry and monotonous, new elements arrive too slowly ([Destructoid](https://destructoid.com/?p=150087)); "peters out after a few hours", steady progress with little pressure keeps it comfortable ([Milton Lane](https://miltonlane.substack.com/p/game-dev-tycoon)); income plateaued and later games felt random ([Game Critics](https://gamecritics.com/tayo-stalnaker/game-dev-tycoon-review)).

### Inferences
- Arithmetic from the anecdotal 5 hours over 35 years: roughly 8.6 real minutes per game year (my calculation). If a year is 48 weeks (inference from y/m/w with weeks numbered up to about 4 per month), the 36 to 84 week random-event window means one random story event about every 6.5 to 15 real minutes. So even in GDT the random-event beat is sparse; most of the time is carried by the per-game cycle, not events.
- Using the "40+ games by year 20" report, a finished game with four reviews and a sales trace arrives about every 4 real minutes; this is anecdotal and likely varies by team size.
- The four-reviewer scene is the loop's main reward, and it is a relative one (score vs your own record per the contested forum theory), so the reward self-escalates and a "hit" needs a visible improvement. Whether or not that theory is exactly right, it explains why GDT players report 9 to 10 early and a plateau later.
- The cheapest anticipation tools in GDT are: a countdown phrase for platform releases ("in two months"), a mid-development G3 prompt with a cost, hype that visibly rises while a game is in development, and a review screen with staged star animations (added after launch, so the first design was less staged).
- Quiet-period fixes players actually ask for are not more events but ones that make idle time productive (research from idle staff) and a speed control.

### Gaps
- Exact reviewer names beyond "All Games", bubble counts or frequency, sliders-to-points math, and the sales-curve formula: no primary source found (Fandom/wiki.gg blocked; only forum anecdotes).
- No Greenheart interview or GDC talk transcript on pacing found. The only talk found is Klug's GCAP 2016 post-mortem session ([GCAP schedule page](https://gcap2016.sched.com/event/8k1F/playing-to-your-strengths-the-story-behind-game-dev-tycoon)), and only its description exists online; the Japanese Mynavi article covered piracy only ([Mynavi](https://news.mynavi.jp/article/svalley-513/)).
- Real seconds per in-game week: no official figure.
- Whether the G3 booth prompt is month 4 or month 5 is inconsistent between sources; treat as "early in the year".

## 2. Two Point Hospital: goals and stars, Kudosh, year-end awards, emergencies, VIPs, challenges, quiet-time fillers

### Takeaway
Two Point Hospital layers a fixed, visible goal ladder (three stars per hospital, only the first needed to advance), a steady currency drip (Kudosh) from many small tasks, and a scheduled year-end awards ceremony, then keeps quiet building time alive with unscheduled interruptions (VIP letters, emergencies, epidemics) and constant comedy from the announcer, radio and patient animation. Critics' main complaints are repetition across levels and an advisor who repeats himself.

### Cited Findings

Goals, stars and unlocks
- Each hospital can earn up to three stars; one star unlocks the next hospital; you can return at any time and later stars are easier after you unlock new rooms and items. — [Wikipedia, Two Point Hospital](https://en.wikipedia.org/wiki/Two_Point_Hospital); [bit-tech review](https://bit-tech.net/reviews/two-point-hospital-review/1/)
- Star payout is fixed at every hospital: 100 Kudosh for one star, 150 for two, 200 for three. — [TheGamer Kudosh guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/). One Steam player instead complains star rewards "stopped very early" (⚠️ snippet only; thread: [Steam](https://steamcommunity.com/app/535930/discussions/0/2590022385665527144)).
- Kudosh buys items for rooms and corridors; nearly all have a function or improve a rating; returning for later stars gives bonus items such as advanced diagnostic and treatment gear. — [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital); [bit-tech review](https://bit-tech.net/reviews/two-point-hospital-review/1/)
- Other Kudosh sources and sizes: career goals (called the easiest farm), repeatable research (20 Kudosh per 1,000 research points and $1,000), hospital level-ups (to level 30), staff challenges (10 Kudosh each, for example 90 days without a death), VIPs (10 or 20 Kudosh), emergencies and epidemics (10 to 15 Kudosh plus cash and reputation). — [TheGamer Kudosh guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/)
- Developer intent: "make it accessible but deep" (Webley); a UI that feels simple at first with complexity deeper down (Carr); a trait system that produces scenes players have not seen "even after long play sessions". — [MCV, "When we made Two Point Hospital"](https://mcvuk.com/development-news/when-we-made-two-point-hospital/)
- Developers on structure (2018 interview): progression is non-linear; several hospitals can be live at once; earlier hospitals can be revisited with newly unlocked equipment; each level has three stars "that guide the player and unlock content"; challenges keep appearing after a level is finished; the team was tuning for both short sessions and long play. — [The Sixth Axis interview](https://www.thesixthaxis.com/2018/04/24/interview-two-point-hospital-devs-on-their-favourite-diseases-and-slapstick-vomit/)

Year-end awards ceremony
- Held at the end of each in-game year. TheGamer says each hospital has eight awards drawn from twelve, paying $5,000 and 5 Kudosh each. — [TheGamer Kudosh guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/)
- A 2018 Steam thread lists eight awards for one hospital (no deaths in one year, rising star, best teaching, most research, employer, hospital of the year, patient's award, most prestigious); "no deaths in one year" is on every map; early maps use simpler "job of the year" awards and later ones research and training awards; awards do not have to be won at the same ceremony; one death blocks the "no deaths" award for the whole year. The thread does not describe a payout. — [Steam thread](https://steamcommunity.com/app/535930/discussions/0/2590022385672707474) (anecdotal)
- Reviews describe it as a yearly bonus tied to performance, with Doctor of the Year and Patient's Choice Hospital as examples, compared by the reviewer to the annual prizes in The Movies. — [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital); [Entertainium review](https://entertainium.co/2018/09/30/two-point-hospital-putting-on-a-clinic/)

Emergencies, epidemics, VIPs, challenges
- Epidemics begin in later hospitals; you find infected people yourself (they shuffle and sneeze), vaccinate them from an action bar, staff can be infected, and the best reward goes to winning with no more vaccines than necessary; failure costs reputation. — [Magic Game World epidemics guide](https://www.magicgameworld.com/?p=23650); Wikipedia adds that vaccines are limited and a clean outbreak finish earns a reward ([Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital)).
- "Influxes of patients with a specific disease occur from time to time." — [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital)
- Special events named by the developers: health inspectors, regional problems (for example broken legs at a mountain hospital), regular challenges that pop up, and per-hospital quirks. — [The Sixth Axis interview](https://www.thesixthaxis.com/2018/04/24/interview-two-point-hospital-devs-on-their-favourite-diseases-and-slapstick-vomit/)
- Hospital-specific hooks: a hospital near a university restricts hires to untrained junior doctors (unlocks a research centre); one near a power plant gets "freak lightning storms". — [bit-tech review](https://bit-tech.net/reviews/two-point-hospital-review/1/)
- VIPs: marked by a flashing red/blue light or a crown, they pay 10 or 20 Kudosh and other rewards, a bad review can cost reputation, and you can redecorate and train before they arrive. — [TheGamer Kudosh guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/). ⚠️ From a search snippet of the Fandom wiki (page returned HTTP 402): a letter in the inbox announces the visit, some can be refused, others arrive regardless, and the VIP walks through three to six rooms. Source: [Fandom VIP Visitors](https://two-point-hospital.fandom.com/wiki/VIP_Visitors).
- Staff challenges are small timed or counted goals (90 days without a death, earn an amount, train staff). The guide gives no schedule; "VIPs and emergencies arrive unpredictably". — [TheGamer Kudosh guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/)
- April 2019 added community challenges where collective goals unlock content. — [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital)

Announcer, radio and gags in quiet time
- A sarcastic announcer pages staff and nags patients; hospital radio has DJs and adverts; a digital advisor "can't be disabled and often repeats himself" (reviewer calls repetition a problem). — [Entertainium review](https://entertainium.co/2018/09/30/two-point-hospital-putting-on-a-clinic/)
- The tannoy is "passive-aggressive", with lines like apologising for the litter "that you left". — [bit-tech review](https://bit-tech.net/reviews/two-point-hospital-review/1/)
- Humour comes from invented ailments with visual puns (a lightbulb for a head), slapstick (vomit slips, exaggerated so the falls read from a distance), and ridiculous machines; micro-behaviour traits produce small emergent events; small touches such as characters knocking before entering make the world feel alive. — [The Sixth Axis interview](https://www.thesixthaxis.com/2018/04/24/interview-two-point-hospital-devs-on-their-favourite-diseases-and-slapstick-vomit/); [MCV](https://mcvuk.com/development-news/when-we-made-two-point-hospital/)
- Reception on pacing: "beautifully paced" with steady new content ([bit-tech](https://bit-tech.net/reviews/two-point-hospital-review/1/)); some missions "bleed together" per PC Gamer, and repetition per Metro, as summarised by [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital) (⚠️ I read the first 100,000 of 106,369 characters; the last 6,369 were not read). The same bit-tech reviewer says they were only ever idle while waiting for research.

### Inferences
- The ladder has three clocks running at once: a long clock (stars, three per hospital), a yearly clock (awards ceremony), and short unscheduled interrupts (VIP letters, emergencies, epidemics, challenges). The player is rarely more than one small task from a payout, which is the direct opposite of "weeks when nothing happens".
- Rewards are mostly fixed and published up front (100/150/200 per star; 10 to 20 per VIP; award payout flat) but the arrival times of the small ones are variable, so predictability sits in the size of the reward and surprise sits in the timing. The awards give a calendar anchor the player can plan for.
- The warning of VIPs by letter (with a refusal choice) gives anticipation plus a decision, and the "no deaths this year" award turns a whole year into a stake.
- Ambient comedy (announcer, radio, slapstick) is how the game covers idle time, but the advisor-repeats-himself complaint is a concrete risk for any reused line.

### Gaps
- Emergency and VIP frequency, timers and reward formulas: not found in any fetched source (Fandom, Fextralife and wiki mirrors blocked or 404).
- Per-level star goals (what the three stars require at each hospital): only general descriptions found.
- Whether the awards payout in TheGamer ($5,000 and 5 Kudosh, 8 of 12) matches the game: a single guide; the Steam thread does not confirm it.
- Announcer line frequency and cooldowns: no source.

## 3. Frostpunk: scenario timeline, Book of Laws cooldowns, Hope and Discontent, storm, quiet time

### Takeaway
Frostpunk's main scenario (A New Home, about 48 days) is a scheduled arc: build-up, a mid-game political crisis around the Londoners, then a storm climax at roughly days 39 to 47 that ends the game by design. Laws have cooldowns in in-game hours (18 to 72 in the table found), which in one recorded run meant about one law every one to two days, and Hope/Discontent turn each law into a trade-off with a visible price.

### Cited Findings

Structure and timeline
- The campaign has three acts: survival basics, internal conflict in a divided city, then a huge storm that tests earlier decisions. Developers considered letting players keep building after the storm but dropped it as anticlimactic, wanting it to end "at the climax, like a novel". — [Wikipedia, Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)
- A New Home lasts about 48 days; Act One ends when people learn what happened to Winterhome; Act Two is the Londoners faction and the Faith/Order choice; Act Three is the Final Storm at about -150 °C. — [TheGamer, scenarios explained](https://www.thegamer.com/frostpunk-all-scenarios-explained/)
- Player-recorded normal-mode run, phased: days 1 to 8 opening build and research; 9 to 14 automaton efficiency, heating, housing, infirmary; 15 to 19 Winterhome explored and the Londoners begin; 20 to 30 dealing with the Londoners; 31 to 38 last refugee groups and storm preparation; 39 to 47 storm. A cold snap on day 4 and another on day 15; temperature in the storm falls from -90 °C (day 42) to -150 °C (day 46 to 47); the storm ends day 47 at -30 °C. — [Steam guide, Frostpunk New Home normal mode](https://steamcommunity.com/sharedfiles/filedetails/?id=3343113747) (single run; the guide has internal inconsistencies noted by the extraction)
- The storm is not on a fixed date: the latest it can hit is day 43, the earliest a player triggered it was day 21, and delaying the main objective delays the storm; entering Winterhome before day 15 triggers the Londoners and pushes the storm earlier. — [Steam thread, storm timing](https://steamcommunity.com/app/323190/discussions/0/4140564923171498672/) (player reports)
- Players say the storm lasts about a week and that hunger is the top cause of death in it. — [Steam thread](https://steamcommunity.com/app/323190/discussions/0/3828661844171671613)
- The game telegraphs events: a deep freeze on the horizon means stockpiling coal, an incoming refugee group means preparing housing and food; crises "arrive together and compete for the same limited workers". Restarts keep the same story beats. — [Game Informer review](https://gameinformer.com/games/frostpunk/b/pc/archive/2018/04/23/frostpunk-review-a-frigid-unrelenting-survival-success)

Book of Laws and cooldowns
- Cooldown table from one guide (hours after passing a law before the next related signing): Sustain Life 18, Cemetery 18, Extended Shift 18, Child Labour all jobs 36, Fighting Arena 36, Care House 36, Medic Apprentices 36, Engineer Apprentices 36, Organ Transplants 36, Prosthetics 45. — [Gamers Decide, best laws](https://www.gamersdecide.com/articles/frostpunk-best-laws)
- Another guide gives 36 hours for Pledge of Loyalty and 72 for New Order and says the length varies by law; it does not say whether a cooldown is per law or global. — [MacMyths guide](https://macmyths.com/how-frostpunks-laws-and-hope-system-work/)
- ⚠️ Frostpunk 2 reportedly uses a ten-week cooldown after a law passes or fails; seen only in a search-result summary of [Gamer Guides](https://www.gamerguides.com/frostpunk-2/guide/communities-and-factions/laws).
- Recorded law adoptions in one run: about 20 distinct laws signed between day 1 (Emergency Shift) and day 25 (the guide says no further laws were worth adopting from day 27), typically one to two days apart. — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3343113747)
- Laws come in sequences: early ones mild, later ones harsher, which creates a "snowball effect"; the Order and Faith paths can lead to fanatic rule that sidelines Hope/Discontent. — [Wikipedia, Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)
- Some laws promise buildings; leaving a promise unmet "can displease residents". Purpose laws appear later and force a Faith or Order choice. — [MacMyths guide](https://macmyths.com/how-frostpunks-laws-and-hope-system-work/)
- Developers replaced an earlier citizen-request system with laws to give players more agency. — [Wikipedia, Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)

Hope and Discontent
- If hope stays too low or discontent too high for too long, citizens revolt and the game ends. — [Wikipedia, Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)
- Hope and discontent are separate pressures; "improving Hope does not automatically reduce Discontent". — [MacMyths guide](https://macmyths.com/how-frostpunks-laws-and-hope-system-work/)
- Designers: they "hired" hope and discontent "for the greater good of the game"; early builds were too subtle ("the grim tone wasn't clear enough") and pushing extremes made it "too comic". — [Xbox Wire, society system](https://news.xbox.com/en-us/?p=126631)
- ⚠️ From a search-result snippet (not fetched in full): discontent came first and hope was added later after research into survival stories; Stokalski said blending survival, resource management and city-building made it hard to get "a smooth good gameplay experience". Source: [Xbox Wire snippet](https://news.xbox.com/en-us/?p=126631). A critic says the weather forecast drives progression yet the pacing is "amazingly addictive". ⚠️ Source page blocked (HTTP 403), snippet only: [indienova critical play report](https://lab.indienova.com/indie-game-review/critical-play-report-frostpunk/).

Quiet building time and the storm as climax
- In the recorded run, the first 14 days and days 31 to 38 are quiet-building windows, and in 31 to 38 the player is explicitly waiting for the storm with scouts and outposts returning home. — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3343113747)
- Endless Mode drops the narrative, and its two difficulties differ mainly in how often harsh weather and shutdowns occur. — [Wikipedia, Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)

### Inferences
- Frostpunk's "quiet" time is not empty: it is the stretch between a visible warning (the cold forecast, a refugee group) and the hit, and the player spends it paying down known risk. Anticipation comes from telegraphing; the pay-off or punishment is staged on a schedule the player can see coming.
- The law cooldown functions as a pacing governor: it limits how many big decisions can stack up, so a decision is available about every one to two days of game time without flooding the player (inference from the cooldown table and the recorded run).
- A hard cap on the climax (the game stops at the storm) is a design choice the developers defended, which is directly relevant to an era-based run with a fixed number of eras.

### Gaps
- No primary-source design talk (GDC, postmortem) on Frostpunk pacing found; the PC Gamer "making of" and "developers on hope, misery and the book of laws" pages returned only titles to the fetch tool, so statements from Stokalski, Juszczyk and Fijak there were not read.
- Real-time length of a Frostpunk day and the total real minutes of a scenario: not found.
- Official Fandom Frostpunk wiki pages (A New Home, Book of Laws) returned HTTP 402/403. The day-by-day figures above come from a single player's recorded run and forum posts, not the developers.
- Law cooldown units and whether they are global or per-law: sources conflict or are silent.

## 4. Other games where useful: Game Dev Story (direct ancestor) and Mad Games Tycoon 2

### Takeaway
Game Dev Story established the "panel of critics" reveal and a scored Hall of Fame gate (Wikipedia: critics must give a score of at least 32). Reviewers say it is "super-casual" and nearly impossible to lose, and that it slows when games become too easy. Mad Games Tycoon 2's developer openly uses a small-chance negative event (0 to 4 percent by difficulty) as a variable-risk lever.

### Cited Findings
- Game Dev Story: each finished game gets a 1 to 10 score with a comment from a reviewer; scores generally affect weekly-ranked sales; reaching the Hall of Fame (score of at least 32 from critics) lets you make sequels. Pocket Gamer felt the game slowed toward the end because it became too easy to churn out hits. — [Wikipedia, Game Dev Story](https://en.wikipedia.org/wiki/Game_Dev_Story)
- Game Dev Story (Switch review): a panel of critics scores each game; very good games can win Game of the Year with a cash prize; strong reviews unlock sequels with a development head start; balanced so that losing is "almost impossible"; "neither a game to 'win' nor play endlessly". — [Digitally Downloaded](https://www.digitallydownloaded.net/2018/10/review-game-dev-story-nintendo-switch.html)
- Mad Games Tycoon 2: the developer (Eggcode) describes a negative "Commercial Flop" event as simulating real-world games that did not sell despite good ratings, meant to "raise the difficulty level slightly"; chance 0 to 4 percent depending on difficulty; the developer agreed to consider an "evergreen" counterpart event. — [Steam thread, Mad Games Tycoon 2](https://steamcommunity.com/app/1342330/discussions/0/3040481180148435900)
- ⚠️ Player theories seen only in search snippets: reviews in Mad Games Tycoon 2 depend on genre/topic fit, engine, features and four stats, with the last couple of percent left to chance. Source: [Steam discussion](https://steamcommunity.com/app/1342330/discussions/0/7607215340155700440).

### Inferences
- The shared pattern across GDS, GDT and MGT2 is a rated release that is mostly skill and fit but with a small random term, plus a unlock gate keyed to a score threshold (Hall of Fame at 32).
- A deliberate low-probability negative event, paired with a promised positive one, is a documented way to keep results unpredictable without making them unfair.

### Gaps
- Football Manager, Software Inc, Startup Company, Prison Architect: not researched (time and call budget; no sources opened). Mad Games Tycoon 2 yearly awards and magazine-score cadence: no source found.

## 5. Cross-game synthesis: fixed vs variable rewards, anticipation, period-end summaries

### Takeaway
Across these games the predictable parts are calendar anchors and published reward sizes (annual G3, yearly awards, star payouts, scripted storm), and the variable parts are arrival time or score of small events (random story events, VIP letters, review score). Anticipation is built by announcing ahead (console release countdowns, VIP letters, cold forecasts, G3 booth prompt) and then staging the resolution.

### Cited Findings
- GDT: fixed anchors are scripted platform releases and G3 each year; variable ones are the random event pool (36 to 84 weeks), trends, and the review score. — [gdt-modAPI wiki, addEvent](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addEvent().md); [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- GDT end-of-run: at year 35 the player gets a lifetime award and final score but can keep developing. — [Milton Lane Substack](https://miltonlane.substack.com/p/game-dev-tycoon). Another review says the game ends at the 30-year mark with play continuing "without events". — [Tekrevue](https://www.tekrevue.com/game-dev-tycoon-review-minor-flaws-dont-kill-the-fun/). The two reviews disagree on length (35 vs 30), probably game-length setting.
- TPH: fixed star ladder and flat Kudosh payouts, yearly awards, unscheduled VIP/emergency/epidemic. — [TheGamer Kudosh guide](https://www.thegamer.com/two-point-hospital-making-kudosh-guide/)
- Frostpunk: scripted storm that arrives within a window set by player pace (day 21 to day 43 reported), laws gated by cooldown. — [Steam thread](https://steamcommunity.com/app/323190/discussions/0/4140564923171498672/)
- Review-score suspense in GDT is sustained by a review UI with star animations ("100% more star-power") that was added after launch to heighten the elation and the anger. — [Greenheart blog, v1.6 post](https://www.greenheartgames.com/blog/)
- Year/era-end summaries: TPH awards ceremony (above), GDT end-of-run lifetime award (above), GDS Game of the Year. Frostpunk ends at the storm with no continuing play. Details on how GDT summarises a year (if at all) were not found.

### Inferences
- A reward calendar that the player can read in advance (stars, yearly awards, storm window) gives goals during quiet periods; unscheduled small events give surprise. The games that avoid "nothing happens" (TPH, Frostpunk) do both; GDT leans on the loop itself and is the one most criticised for flat stretches.
- For an era of about 6 minutes, GDT's own numbers suggest one random story event per 6.5 to 15 minutes is considered normal even in a game with a continuous per-game loop, so a 6-minute era would not need more than about one random event unless the per-game beat is missing.

### Gaps
- No source found on what GDT or TPH show in a year summary beyond the awards.

## 6. Recurrence: how often the same event repeats and how repeats are varied

### Takeaway
GDT caps repeated stories with a per-event maximum trigger count, rotates among many events through a random pool, and penalises repeating the same game combination; TPH varies awards and challenges by hospital; Frostpunk repeats the same arc but varies timing by player pace.

### Cited Findings
- GDT events have a maxTriggers property; non-random events fire on a date or trigger, and random ones come from a pool. — [gdt-modAPI wiki, addEvent](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addEvent().md)
- GDT stories use random ranges for effects and delays (hype 5 to 15, delayed fallout 1 to 3 weeks), and the guidance is that every choice should lead to a different outcome. — [gdt-modAPI wiki, addEvent](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GDT.addEvent().md)
- GDT penalises repetition mechanically (same combination back to back gives below-average scores and reduced sales). — [Pocket Gamer tips](https://www.pocketgamer.com/game-dev-tycoon/game-dev-tycoon-tips-and-tricks-everything-you-need-to-make-a-hit-game/)
- GDT uses a deterministic random generator seeded per save: "loading a game and following the same actions will result in the same random numbers". — [gdt-modAPI wiki, company](https://raw.githubusercontent.com/wiki/greenheartgames/gdt-modAPI/GameManager.company.md)
- GDT v1.6 notes a fix to story events always picking the same first staff member, and randomising the default character. — [Greenheart blog, v1.6 changelog](https://www.greenheartgames.com/blog/)
- TPH: the awards list differs by map; "no deaths in one year" appears on every map. — [Steam thread](https://steamcommunity.com/app/535930/discussions/0/2590022385672707474)
- TPH repetition criticisms: missions that "bleed together", an advisor that repeats lines, rebuilding rooms each level. — [Wikipedia](https://en.wikipedia.org/wiki/Two_Point_Hospital); [Entertainium](https://entertainium.co/2018/09/30/two-point-hospital-putting-on-a-clinic/)
- Frostpunk: restarts bring some variation in scouting finds and responses but "the campaign largely follows the same story beats". — [Game Informer review](https://gameinformer.com/games/frostpunk/b/pc/archive/2018/04/23/frostpunk-review-a-frigid-unrelenting-survival-success)
- Frostpunk's laws escalate along a path, so a repeated decision type (sign a law) gets harsher each time rather than repeating at the same level. — [Wikipedia, Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)

### Inferences
- The recurring event that must not feel repeated (review reveal, awards, G3) is varied by changing its inputs and stakes each cycle (new record to beat, new platform, new hospital's awards) rather than by changing its form.
- Seeded randomness gives GDT repeatable runs, which matters for any balance testing of a short, scripted run.

### Gaps
- How many distinct random events GDT ships with: not found (wiki blocked).
- How TPH varies its emergency types between levels: not found.

## Coverage

What I opened and read:
- Raw text via curl, read in full: gdt-modAPI wiki pages on GitHub (GDT.addEvent, Notification, Weightings, Home, Date, GameManager.company, Game, GDT, Advanced-Modding, GDT.addResearchItem, GDT.addPlatform; first 9,000 characters each for the longer ones, which covered them).
- Raw text via curl, read in part: Greenheart Games blog archive (https://www.greenheartgames.com/blog/, about 65,800 characters of text). ⚠️ I read the first roughly 16,000 characters (Switch announcement, 5th anniversary post, v1.6 patch notes) plus targeted excerpts around line 196-214, 470-482 and 560-575 and a keyword search; the Android and iOS sales-report sections and later posts were scanned, not read end to end.
- Through the web-fetch tool (returns a model-written extraction of the page, not the raw text, so "read in full" cannot be confirmed for any of these): Wikipedia Game Dev Tycoon, Wikipedia Frostpunk, Wikipedia Game Dev Story, Wikipedia Two Point Hospital (⚠️ extraction covered only characters 0 to 100,000 of 106,369; the last 6,369 not read), Tekrevue, Pocket Gamer tips, Destructoid, Game Chronicles, Game Critics, Milton Lane Substack, Cubix guide, Magic Game World tips and epidemics pages, Steam threads (GDT game speed, GDT review scores, G3 events, G3 hosting, Greenheart forum 1.3.12, Frostpunk storm timing, Frostpunk storm day thread, TPH awards thread, Mad Games Tycoon 2 thread, Steam guide for Frostpunk normal mode), Gamers Decide, MacMyths, TheGamer (Kudosh guide, Frostpunk scenarios), Xbox Wire Frostpunk, Game Informer Frostpunk review, bit-tech and Entertainium and MCV and Sixth Axis Two Point Hospital pieces, Digitally Downloaded Game Dev Story review, Magic Game World, GCAP 2016 schedule page, Mynavi Japanese article.

What I could not reach or only partly saw (⚠️):
- ⚠️ Fandom wikis for Game Dev Tycoon (Reviews, G3 Convention, Convention), Frostpunk (A New Home, Book of Laws) and Two Point Hospital (VIP Visitors, Awards, Emergencies): HTTP 402/403. wiki.gg for GDT showed a "Blocked" page. Fextralife Two Point Hospital pages returned 404. Archive.org was either blocked by the fetch tool or rate-limited (HTTP 429). Findings marked with a Fandom citation come only from search-result snippets.
- ⚠️ PC Gamer "making of Frostpunk" / "developers on hope, misery and the book of laws" and PC Gamer's Two Point Hospital review: the fetch returned only the title; the body was not read. The Frostpunk designer statements in these interviews are therefore missing.
- ⚠️ GameSkinny GDT review (HTTP 403), Softpedia review (HTTP 403), indienova Frostpunk report (HTTP 403), Techraptor Frostpunk piece (HTTP 403), Namu wiki Frostpunk scenario page (HTTP 403): not read; two claims rely on search snippets and are flagged inline.
- ⚠️ Nothing found from a GDC Vault talk or Game Developer postmortem on Frostpunk, Two Point Hospital or Game Dev Tycoon; the only talk located is Klug's GCAP 2016 session, and only its schedule description exists.
- Not researched at all: Football Manager, Software Inc, Startup Company, Prison Architect (call budget exceeded ahead of reaching them).
- Delegated-research caveat: none of these findings came from a subagent; all searches and fetches were done directly. The Wikipedia and review pages summarised through the fetch tool are "model-written extractions"; any figure the report writer will rely on (for example the 36 + 48 * random() weeks, the 100/150/200 Kudosh, the 18 to 72 hour law cooldowns) should be traced to the cited page directly. The GitHub wiki figure is from raw text and the TheGamer and Gamers Decide figures are from extractions.
- No email address was entered in any lookup or contact field.
