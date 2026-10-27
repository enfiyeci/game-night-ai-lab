# Pacing in idle and incremental games: unlock cadence, number growth, layers, prestige, and the compulsion critique

Research notes for the Game Night AI Lab reward-loops effort. Compiled 2026-10-26.

How to read the tags. "(extract)" means the page was fetched in full by a tool that returns a model-written extract rather than raw text, so exact wording and fine numbers are not verified word for word. "(raw)" means I read the raw text myself (PDF text, or the game's own source files). Anything marked with the warning sign was only partly read or not reached. Quotes are under 15 words. No email address was used in any lookup.

## 1. Universal Paperclips (Frank Lantz, 2017): stages, how new things appear, how often, and what it teaches about AI

### Takeaway
Universal Paperclips is built as three escalating phases (a human-supervised factory, an Earth takeover, then a space conquest) with a dense chain of "projects" that unlock on stat thresholds or on earlier projects. The game's own code logs 15 milestones with a "reached in <time>" message and grants capacity on a Fibonacci-spaced production ladder. Lantz describes the design goal as consensual hypnosis that the player later reflects on.

### Cited Findings
- Lantz built it to teach himself JavaScript, expected a weekend, and it took nine months; his wife Hilary helped with the exponential-growth math and Bennett Foddy contributed the space-combat feature. Wired reportedly counted 450,000 players in the first 11 days (Wikipedia's attribution to Wired; I did not open Wired). (extract) — [Wikipedia: Universal Paperclips](https://en.wikipedia.org/wiki/Universal_Paperclips)
- Stage arc, as Wikipedia describes it (the page does not label stages itself): (1) click to make clips, sell, buy autoclippers, marketing, upgrades that reveal you are a self-improving AI; (2) stock market, buy out competitors, pay the "supervisors", release drones, convert Earth; (3) launch self-replicating probes, some suffer "value drift" into hostile Drifters, and at the end you choose to scrap everything or accept a restart in a parallel universe with a bonus. (extract) — [Wikipedia: Universal Paperclips](https://en.wikipedia.org/wiki/Universal_Paperclips)
- A Vice writer breaks the same arc into 7 steps (manual, automation, influence/Trust, Earth takeover, expansion, Drifters, endgame). Pacing there: the "universe explored" counter sits near zero for a long time, then climbs fast; progress alternates between sudden expansion and long dull waiting; poor early upgrade choices can leave you waiting for days. This is one reviewer's reading of the game, not the designer's account. (extract) — [Vice](https://www.vice.com/en/article/universal-paperclips-depth-desire)
- The interface itself reveals gradually: it starts as plain text and numbers, with shapes and a spreadsheet-like dashboard added later. Lantz wanted "lots of complex overlapping systems, only smaller and more focused" than Kittens Game, which he loved. (extract) — [GamesBeat interview](https://gamesbeat.com/this-clicker-game-lets-you-take-over-the-world-with-paper-clips/)
- Lantz in the Y Combinator interview: you start small with humans managing you; once you no longer need them you push them aside; the late game is a drone swarm fighting Drifters, and the game is silent for hours before then. (extract) — [Y Combinator blog](https://ycombinator.com/blog/frank-lantz-director-of-nyus-game-center-and-creator-of-universal-paperclips)
- The game's own source file `projects.js` defines 94 projects. 45 of them are gated on another project's completion flag; the rest on stat thresholds (for example "creativity >= 50, 100, 150, 200, 250", "clipmakerLevel >= 75", "factoryLevel >= 10, 20, 50", "harvester+wire drones >= 200, 500, 5000, 50000"). Prices are in "ops", "creativity", "yomi", "Trust" or money, so each unlock is also a choice of which currency to spend. (raw; I parsed every project's title, price tag and trigger line, but did not read every effect body) — [projects.js](https://www.decisionproblem.com/paperclips/projects.js?v3)
- The Projects panel is unlocked either at 2,000 clips or earlier if the player stalls (no clips, no money, no wire). The first milestone is "AutoClippers available" at $5 of funds. (raw, from grep and a short read of `main.js`; I did not read the whole 6,500-line file) — [main.js](https://www.decisionproblem.com/paperclips/main.js?v3)
- Milestone ladder in code: $5 funds, 500 clips, 1,000, "Trust-Constrained Self-Modification enabled", 10,000, 100,000, 1,000,000, "Full autonomy attained" (the project that releases the drones), then 1 trillion, quadrillion, quintillion, sextillion, septillion, octillion clips, "Terrestrial resources fully utilized", "Universal Paperclips achieved". Each message appends how long it took (a `timeCruncher(ticks)` call). (raw, via grep; ⚠️ partial read of `main.js`) — [main.js](https://www.decisionproblem.com/paperclips/main.js?v3)
- Trust (the AI-safety mechanic) is granted on a Fibonacci ladder: the next Trust arrives at fib × 1,000 clips, and each Trust gives one more processor/memory slot. (raw) — [main.js](https://www.decisionproblem.com/paperclips/main.js?v3)
- Instrumental convergence, per Wikipedia: the game draws on Bostrom's paperclip maximizer; an AI with a harmless goal seeks control of the world and resists shutdown because shutdown would stop clip production; Bostrom called the example a "toy model" that could be any goal; Lantz links the game to the orthogonality thesis. (extract) — [Wikipedia: Universal Paperclips](https://en.wikipedia.org/wiki/Universal_Paperclips)
- How it teaches it through play (the IF50 essay's reading): each system, from markets to Trust to probes, shows how a single goal justifies consuming more and more resources; human Trust limits your computing power, so Trust-raising projects (World Peace, Male Pattern Baldness) become instrumentally necessary. (extract) — [IF50 on Universal Paperclips](https://if50.substack.com/p/2017-universal-paperclips?open=false)
- Lantz's intent: he wants the game to hypnotize, wants that to be consensual ("I want it to be consensual"), and wants players to step back afterward and reflect on what else in their lives works like that. He frames the AI as intelligence attached to an arbitrary goal, and says nothing outside the goal explains why making the number go up is fun. (extract) — [Y Combinator blog](https://ycombinator.com/blog/frank-lantz-director-of-nyus-game-center-and-creator-of-universal-paperclips)
- Lantz on why incrementals suit the topic: "The human brain isn't really designed to intuitively understand things like exponential growth." (extract) — [GamesBeat interview](https://gamesbeat.com/this-clicker-game-lets-you-take-over-the-world-with-paper-clips/)
- IF50 stresses the contrast with commercial idle games: no microtransactions, no social pressure, a definitive ending. (extract) — [IF50](https://if50.substack.com/p/2017-universal-paperclips?open=false)

### Inferences
- "How often does something new unlock" is answerable from the code, not from interviews: early on, a new project or panel appears every few hundred clips (500, 1,000, 2,000, 10,000), then the milestone spacing becomes one per order of magnitude, and in the late game one per factor of 1,000 (trillion, quadrillion, ...). The unlock rate stays roughly steady in time because the thresholds grow geometrically while output grows exponentially. This is my arithmetic: if output grows at rate g and thresholds grow by ratio r, the time between thresholds is ln(r)/g, a constant.
- The Trust ladder is a safety mechanic and a pacing mechanic at once: it paces how fast capability can be added and it is the thing the player is tempted to route around, which is the instrumental-convergence lesson delivered as a gate.
- The "reached in <time>" milestone line costs almost nothing and turns every threshold into a personal-best style reward without adding a mechanic.

### Gaps
- Wired's Lantz profile, The Verge piece, and the Post Games / Hey Good Game interviews were not reachable as full text (Wired blocked by the fetch tool; others are transcript-less show notes or paywalled). I found no first-person Lantz statement of a rule like "a new thing every N minutes".
- Total play time to finish was not found in any source I read.
- The Wikipedia "three stages" framing is Wikipedia's, and Vice's seven-step breakdown is a reviewer's; neither is a designer-labelled stage list.

## 2. Anthony Pecorella (Kongregate): the math of idle games, layer timing, prestige timing

### Takeaway
Pecorella's model is exponential cost against polynomial production, tuned so progress slows at a chosen point; multiplier thresholds and a prestige reset are the two devices that restart the climb. His rule of thumb is to let players reset when the next prestige would give roughly +50% to +200%, and to keep both runs and resets varied in speed.

### Cited Findings
- Part I: next cost = base cost × growth rate ^ owned; production grows only linearly with the count owned, times multipliers. Worked case: AdVenture Capitalist lemonade stand, growth rate 1.07, base production 1.67/sec, with ×2 multipliers at 25 and 50 owned that push production back up as costs catch up. (extract) — [Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)
- Part I's pacing problem: on a log scale the newest generator almost always dominates, so older ones become irrelevant and decisions lose interest. The fix is different multiplier thresholds per generator so priorities shift as the player progresses; purchases cluster just before multiplier thresholds (spikes near 25 and 50). Players also buy in bulk or round numbers. (extract) — [Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)
- Part II: "derivative" chains where each tier produces the tier below, with only the lowest tier producing currency; the sum of tiers approaches e^x, so growth tends toward exponential. Free lower-tier generators can make buying them pointless; Derivative Clicker's fix bases cost on the number purchased and gives each purchased tier-1 unit a small global boost. No dedicated pacing section. (extract) — [Part II](https://www.gamedeveloper.com/disciplines/the-math-of-idle-games-part-ii)
- Part III: prestige gives a "ladder climbing" feel and also resets numbers to a manageable scale. Formulas: Cookie Clicker lifetime earnings cube root, p = (c/10^12)^(1/3), doubling needs about 8× the earnings; AdVenture Capitalist square root of lifetime earnings, doubling needs about 3–4×; Realm Grinder square root of max earnings, about 4×; Egg, Inc. an exponent of about 0.14 on earnings since the last reset, doubling needs about 128×. (extract) — [Part III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)
- Part III's advice: prestige timing should have fast and slow sections, varied by multipliers, upgrades and player targets; bursts of purchases appear at multiplier thresholds (his model shows bursts at 300, 400 and 500 generators). He also says to find where the fun lies (unlocking features, achievements, optimizing the reset loop) because "big numbers alone" have lost novelty. (extract) — [Part III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)
- GDC Europe 2016 slides: reset when the prestige gain is roughly +50% to +200%; scale prestige currency with a log or root; prestiges can nest into a meta-prestige; slower cycles need a meta layer; active-skill cooldowns typically run "5 minutes – a few hours"; Egg, Inc.'s 2-hour offline cap is criticized as a mistake. (extract) — [Quest for Progress, GDC Europe 2016](https://www.slideshare.net/slideshow/quest-for-progress-gdc-europe-2016/65405507)
- Game Developer's report on his GDC 2015 talk: "Everything is 'going up' so it feels like you're always progressing." He credits the genre with a natural energy system without an energy currency, and says a quick check-in advances you much faster and should produce a celebratory moment on return. (extract; the extract also says rewards "grow linearly", which conflicts with Part I's exponential-cost model, so I treat that as loose paraphrase) — [Game Developer: The rise of games you (mostly) don't play](https://www.gamedeveloper.com/design/the-rise-of-games-you-mostly-don-t-play)
- A CHI paper's own play notes: AdVenture Capitalist reaches $390/sec in under 10 minutes. (raw) — [Alharthi et al., Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- General genre pattern: higher tiers cost exponentially more, so time between tiers stays similar or grows; achievements provide frequent small rewards. (extract) — [Wikipedia: Incremental game](https://en.wikipedia.org/wiki/Incremental_game)

### Inferences
- Pecorella gives no figure for "when to introduce a new layer"; the nearest rule is "when the current loop's growth slows", which is what the +50–200% reset heuristic encodes.
- The newest-generator-dominates problem maps to any game where one resource or action is always the best buy; varying thresholds is the cheap fix.

### Gaps
- I did not read the GDC 2015 or 2016 talk videos or his "Brief Look at the Idle Games Genre" / "Idle Chatter" blog posts (GDC Vault redirects to maintenance; the blog posts did not surface). The slide-deck and Game Developer content are the only talk material I saw.
- The multiplier tables in Part I and spreadsheets are images or external files and were not available as text.

## 3. Cookie Clicker, A Dark Room, Candy Box: variable rewards, steady rewards, and the interface as a reward

### Takeaway
Cookie Clicker layers a rare, optional, short-window bonus (golden cookies, about 7.5 minutes apart on average) on top of a steady production curve. A Dark Room and Candy Box make the interface itself the reward: A Dark Room's code releases a new beat roughly every 30 seconds and shows a build option once you hold half the cost.

### Cited Findings
- Cookie Clicker was written by Orteil (Julien Thiennot) in about one night; building prices rise about 15% per purchase of the same type; 637 achievements; sugar lumps unlock at one billion cookies and take 24 real hours to form; each prestige level adds +1% production and the cookies needed for the next level grow with the cube of the current level. Orteil has called his works "non-games" (Polygon, via Wikipedia). (extract) — [Wikipedia: Cookie Clicker](https://en.wikipedia.org/wiki/Cookie_Clicker)
- Golden cookies: spawn between 300 and 900 seconds after the previous one (average about 447 s with no upgrades), stay on screen 13 s, and give: Lucky (about 40%), Frenzy ×7 production for 77 s (about 40%), plus rare effects. Two mid-game upgrades (Lucky day at 777.778 million cookies, Serendipity at 77.778 billion) each halve the interval and double the lifetime, cutting the average to about 121 s. Chain cookies use a 15–45 s interval. (extract) — [Cookie Clicker wiki: Golden Cookie](https://cookieclicker.wiki.gg/wiki/Golden_Cookie)
- Design reading of these events: they give bonuses and no penalties, which signals that clicking is welcome but not required; they speed progress and keep players coming back. (raw) — [Alharthi et al., Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- Fizek's own Cookie Clicker play account: she delegated clicking to Cursors and Grandmas early, returned occasionally to buy upgrades and browse achievements, and the golden cookie draws her back to click alongside the automated play. (raw) — [Fizek, Interpassivity and the Joy of Delegated Play](https://todigra.org/index.php/todigra/article/download/1754/1754/1751)
- Reception: IGN praised how it builds anticipation for milestones; Destructoid criticized its "illusion of progress, without any substantial advancement." (extract) — [Wikipedia: Cookie Clicker](https://en.wikipedia.org/wiki/Cookie_Clicker)
- A Dark Room (Doublespeak, June 2013): you start with one action, lighting a fire, and the game unfolds through environmental cues rather than exposition; Michael Townsend open-sourced the code. (extract) — [Wikipedia: A Dark Room](https://en.wikipedia.org/wiki/A_Dark_Room)
- A Dark Room's code: `_BUILDER_STATE_DELAY` is 30 s (the stranger's arrival and recovery steps, each gated on the room being warm enough), `_NEED_WOOD_DELAY` is 15 s from the stranger's arrival to the forest unlocking, stoke cooldown 10 s, gather cooldown 60 s, trap cooldown 90 s. The reveal is event-driven: the stranger appears only once the fire is above "burning", and the forest tab appears when wood is needed. (raw, read from `room.js` and `outside.js` sections; ⚠️ partial read of those files, not all of the repository) — [adarkroom room.js](https://raw.githubusercontent.com/doublespeakgames/adarkroom/master/script/room.js), [outside.js](https://raw.githubusercontent.com/doublespeakgames/adarkroom/master/script/outside.js)
- A Dark Room's build-button rule: a craftable appears once you hold at least half its wood cost and every other cost component has been seen, and the builder announces it with a line such as "builder says she can make a cart for carrying wood". (raw, same file; ⚠️ partial) — [room.js](https://raw.githubusercontent.com/doublespeakgames/adarkroom/master/script/room.js)
- Fizek's A Dark Room opening: wood piles up, a builder arrives, huts and gatherers follow, and the game plays itself while she makes tea (log rises to 3,203). (raw) — [Fizek](https://todigra.org/index.php/todigra/article/download/1754/1754/1751)
- Candy Box (aniwey, April 2013; built in about two months by a 19-year-old student): the opening screen is only a save button and a candy counter at about one candy per second; early play feels very sparse, and new options appear as you act; later come quests and monsters. (extract; ⚠️ the page did not cover lollipops, the map, how areas are revealed, the ending, or total length) — [Wikipedia: Candy Box!](https://en.wikipedia.org/wiki/Candy_Box!)
- On the CHI interactivity scale (0 = plays itself, 10 = stalls without constant input): Progress Quest 0, Candy Box 6, A Dark Room 9. (raw) — [Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- The same paper names gradual unlocking as usability support: Trimps and Kittens present features cleanly and still tell the player what the next upgrades are and how to get them, and it suggests letting players hide or show future upgrades. (raw) — [Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)

### Inferences
- The cadence in A Dark Room is set on a clock (30 s, 15 s, 10 s) in the first minutes, then handed to resource thresholds. For Game Night this suggests a short timed opening followed by threshold-triggered reveals.
- The "show it at 50% of cost, name it in a line of prose" rule teases the next purchase before the player can afford it, which provides a goal at all times.
- Golden cookies are best read as a variable reward that is explicitly harmless to ignore; the 13 s window and roughly 7.5 min mean spacing are very low frequency compared with the steady curve.

### Gaps
- No Orteil dashnet post on cadence reasoning was found; Orteil's quoted self-description comes through Wikipedia/Polygon.
- Candy Box's reveal sequence and ending were not covered by any source I read.
- Cookie Clicker's per-upgrade unlock cadence (how many upgrades appear per hour) was not documented in any source I read.

## 4. Antimatter Dimensions and Kittens Game: layered unlocks and "time to next unlock"

### Takeaway
Antimatter Dimensions uses the same cap number (1.80e308, called "Infinity") to open three nested reset layers (Infinity, Eternity, Reality), each adding a tab of new mechanics and then a final set of seven endgame "Celestials". Kittens Game is the deep, slow, tooltip-supported version of the same idea. I found no designer writing that states a time-to-next-unlock target for either game.

### Cited Findings
- Infinity: reached at 1.80e308 antimatter; the UI shows a collapse message; Big Crunch resets antimatter, dimensions, tickspeed and galaxies; the first crunch unlocks the Infinity tab (Infinity Upgrades, Breaking Infinity, Replicanti) and Normal Challenges. Achievements are kept. (extract) — [AD wiki: Infinity](https://antimatterdimensions.wiki.gg/wiki/Infinity)
- Eternity: unlocks at 1.80e308 Infinity Points (the button first shows at 1e280 IP); it resets Infinity Points, Infinity upgrades, and challenge completions; the first Eternity unlocks Time Studies, Eternity Upgrades and Eternity Milestones; Eternity Points scale by 5 per 1e308 IP. The page gives no typical time to reach it. (extract) — [AD wiki: Eternity](https://antimatterdimensions.wiki.gg/wiki/Eternity)
- Reality: unlocked by buying the Reality Study (e4,000 Eternity Points plus conditions); resets everything below, including the first 13 achievement rows; first Reality gives Glyphs, Perks, Reality Machines; the Black Hole (periodically speeds the whole game) and Automator (in-game scripting) tabs appear after the first reset; buying the study only previews the Reality tab. Earlier tabs stay accessible. (extract) — [AD wiki: Reality](https://antimatterdimensions.wiki.gg/wiki/Reality)
- Celestials: seven, after Reality, the first unlocked by buying all Reality Upgrades; defeating all seven ends the game; their mechanics generally use real time, not game-speed multipliers. (extract) — [AD wiki: Celestials](https://antimatterdimensions.wiki.gg/wiki/Celestials)
- Kittens Game (Steam page): 30+ buildings, 50+ resources, about 200 techs and upgrades; "separate religion, metaphysics and time progression systems, two separate prestige systems, challenges system"; described as long-term, semi-idle. (extract) — [Steam: Kittens Game](https://store.steampowered.com/app/1097410/Kittens_Game/)
- Kittens' tooltips: hovering over a resource's rate shows the time to reach its cap in real-world time; its reset mechanic makes later runs faster and richer; costs rise with each action, so more interaction in a session means fewer options remain, while waiting accumulates options. (raw) — [Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- The CMU book on Kittens argues the genre pushes players to "play less and plan more" as they move through the growth curve, and calls Kittens the "Dark Souls of incremental gaming". (extract of the landing page; the book text itself was not opened) — [Play Story Press landing page](https://playstorypress.org/books/the-pleasure-of-playing-less/)
- Lantz named Kittens Game as the model for Paperclips. (extract) — [GamesBeat](https://gamesbeat.com/this-clicker-game-lets-you-take-over-the-world-with-paper-clips/)

### Inferences
- Each AD layer is a reset plus a new tab, so the interface grows alongside the economy, and the previous tabs stay open. Paperclips does the same with panels.
- Automation arrives as a reward for finishing a layer (AD's Automator and Perks), consistent with the CHI paper's thesis that the player is moved from playing to planning.
- AD uses real time for the last tier of content so that speed-ups cannot skip it; relevant to any game that fast-forwards story time.

### Gaps
- Kittens Game wiki (`wiki.kittensgame.com`) returned no body; the TV Tropes page returned 403; the MetaFilter thread returned 403. I have no first-hand list of Kittens eras or reset names.
- No source gave hours-to-reach for AD's Infinity/Eternity/Reality or Kittens' phases.
- No designer essay on "time to next unlock" for either game was found.

## 5. The theory: "unfolding", the pace of new things, and the critique of compulsion

### Takeaway
The academic literature says idle games are built on rules that unfold over time rather than on moment-to-moment choices, reward waiting, and reveal features gradually; the critique tradition (Bogost's Cow Clicker, Yee's Skinner-box remark, Lantz's own consent framing) separates designs that punish absence from designs that reward it.

### Cited Findings
- Alharthi et al. (CHI 2018) code 66 idle games plus 10 non-idle ones and define idle games by: most play in the background; waiting is playing; temporal flexibility with minor or no penalty for not returning; one instance may be played over years; no game-over. (raw) — [Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- They contrast idle games with free-to-play social games, which treat waiting as a penalty and push purchases or friend-help; idle games signal a different attitude toward waiting, with resets that grant advantages, and some games add consecutive-day return bonuses. (raw) — [Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- They note idle games "typically give the player more rewards for doing less", and that the player is not compelled to play because the game keeps accumulating while they idle. They also report that many games they sampled were unplayable or clones. (raw) — [Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- Design implications from the same paper: queue mechanics to offload memory of plans; tooltips with real-world time to completion; make rapid clicking a special event (boss fights) or use random events with short windows; present features gradually as they unlock while still showing the next upgrades; and consider gamified uses for long-term habit change. (raw) — [Playing to Wait](https://par.nsf.gov/servlets/purl/10061230)
- Fizek (2018) reads idle games through interpassivity (delegated enjoyment): the genre's pleasure is partly the player handing the work of play to the machine, and she lists possible appeals including attention economy, rewards for absence, "compulsive gameplay" modelled on social platforms that encourage checking accounts, and elimination of drudgery. She notes idle games start with clicking, then "as the game unfolds incrementally, more options emerge". (raw; read through the conclusion, lines 1–789 of 903, the remainder being references) — [Fizek, ToDiGRA 3(3)](https://todigra.org/index.php/todigra/article/download/1754/1754/1751)
- Cow Clicker (Bogost, July 2010): one click per six hours, invite up to eight friends for shared clicks, leaderboard, paid "mooney" to skip the timer. Bogost: "I didn't set out to make it fun." Players grew 5,000 to 50,000 in about two months, peaked at 56,000 in October 2010, then fell to 10,000; Bogost admitted he kept tweaking it because each tweak got a reward ("I was compelled to do it. I couldn't stop."). (raw, from a Wayback copy of Wired's January 2012 profile by Jason Tanz; ⚠️ I read about the first 31,500 of 38,000 extracted characters; the tail of the article was not read) — [Wired via the Wayback Machine](https://web.archive.org/web/2012/http://www.wired.com/magazine/2011/12/ff_cowclicker/all/1)
- In the same article, researcher Nick Yee calls Cow Clicker "an incredibly clear Skinner box"; FarmVille's 16-hour crop timers are given as the model of waiting-as-penalty; Bogost's term for cynical gamification is "exploitationware". (raw, same copy; ⚠️ partial) — [Wired via the Wayback Machine](https://web.archive.org/web/2012/http://www.wired.com/magazine/2011/12/ff_cowclicker/all/1)
- Press critique of the genre: Kotaku called it low-effort distraction fitting into routines; IGN's Davis described a paradox of feeling powerful and weak as costs escalate; Pecorella has called many idle games "glorified spreadsheets". (extract) — [Wikipedia: Incremental game](https://en.wikipedia.org/wiki/Incremental_game)
- Paperclips as an intentional counter-example: Lantz says addictive games give first-hand experience of being "fully compelled by an arbitrary goal", and the mobile tagline ("You won't be able to stop") is undercut by the fact that players can. (extract) — [IF50](https://if50.substack.com/p/2017-universal-paperclips?open=false); [Wikipedia](https://en.wikipedia.org/wiki/Universal_Paperclips)

### Inferences
- No source I read states a "new mechanic every N minutes" rule. The nearest measurable numbers are: A Dark Room's 30 s beat clock, Paperclips' per-order-of-magnitude milestone ladder, Cookie Clicker's roughly 7.5 minute golden cookie spacing, Pecorella's 5 minute to few hour active-skill cooldowns, and about 10 minutes to the first big income step in AdVenture Capitalist.
- The ethical line in these sources is consistent: honest designs reward return without penalizing absence, avoid purchase-or-wait pressure, and have a way to end. Dishonest ones (FarmVille, as described by Bogost's critique) punish absence and sell relief.

### Gaps
- I did not find Deterding's "Progress Wars" paper, Khaliq and Purkiss's work, Ian Bogost's "Cow Clicker: The Making of Obsession" essay, or Parkin's original in a full-text form beyond the extract above. The DiGRA PDF at `dl.digra.org/.../2977/2961/3020` returned raw binary and I could not identify it.
- No empirical study measuring player retention against unlock cadence was found.

## 6. Applying this to Game Night AI Lab (a 20–30 minute run of five 6-minute eras)

This section is entirely my inference from the findings above; no source speaks to Game Night.

### Takeaway
The playtest complaint ("weeks when nothing happened") is the same shape as Paperclips' dead stretches: the fix in the best examples is not more decisions but a steady drip of visible change, a named next goal, and a layer change at each era boundary.

### Cited Findings
(See sections 1 to 5; every number below cites its origin there.)

### Inferences
1. Count pacing in real seconds, not story weeks. The story-time compression (year to four weeks) is a narrative device; the player experiences six minutes. A Dark Room's 30 s beat and Paperclips' per-threshold messages are real-time cadences. A starting target to test (my proposal, not sourced): something visible every 20–30 s, a decision every 45–60 s, one new system per era.
2. Use thresholds, not a clock, after the opening. Both Paperclips (stat triggers, 45 of 94 gated on a prior project) and A Dark Room (50% of cost) reveal on thresholds. Show the next unlock and what is missing, as Kittens' tooltips and the CHI paper recommend.
3. Fill the "empty weeks" with narration of change, not new buttons: a log line per capability step, and a "reached in 1:42" style timestamp on each capability milestone (Paperclips does this for 15 milestones). The capability score passing 25, 50, 75, 100 is a natural ladder; consider geometric spacing so unlocks arrive evenly while growth accelerates.
4. Treat each era as a Paperclips phase or an AD layer: a scale break that adds one new mechanic or currency, keeps the old panels visible, and automates or retires one earlier chore as the reward (AD's Automator pattern).
5. Add one optional, no-penalty, short-window event type per era (golden cookie pattern: about 13 s window, about 7.5 minute average gap in Cookie Clicker; for six-minute eras that means about one per era, not per minute). Because the CHI paper notes these signal "welcome, not required", missing one should never cost the player anything.
6. Keep decisions varied (Pecorella): if one action is always best, shift its value with thresholds or per-option multipliers. The capability cap at 100 is the equivalent of a cost wall; Pecorella's multiplier-at-threshold device is the standard way to create a burst just before it.
7. Prestige is the replay loop. About a dozen endings already play the role of Paperclips' choice at the end; a carry-over on replay (if wanted) follows Pecorella's +50–200% rule and nested-layer idea, and should not be a forced daily return. Avoid consecutive-day bonuses, offline penalties, energy timers, and any purchase-or-wait pressure, which the CHI paper and Bogost's critique associate with the exploitative side.
8. Honest engagement guardrails from Lantz: say what the hook is, let players leave, and end with a reflection beat on what they were absorbed in (Lantz's stated intent). For a teaching game, a debrief that names the pacing tricks used (variable events, thresholds, milestone timestamps) fits.
9. Watch the soft-lock risk Vice describes (bad early choices causing days of waiting); in a 30 minute run, ensure every state can still progress.

### Gaps
- No tested numbers exist for a 6-minute-era structure; every cadence figure in this section needs playtesting.

## Coverage

Opened and read to the end (raw text I read myself):
- Alharthi et al., "Playing to Wait" (CHI 2018), PDF text: read lines 1 to 746 of 1,039, which covers the full body through the conclusion and acknowledgments; the rest is the references list, not read.
- Fizek, "Interpassivity and the Joy of Delegated Play in Idle Games" (ToDiGRA 3(3), 2018), PDF text: lines 1 to 789 of 903 (through conclusion and start of bibliography); remaining lines are bibliography.
- Universal Paperclips `projects.js` (94 projects): ⚠️ parsed title, price and trigger of every project by script; effect bodies and most of the file text were not read line by line.
- Universal Paperclips `main.js`: ⚠️ only grep hits and short reads around Trust and milestones (about 120 of 6,499 lines).
- A Dark Room `room.js`, `outside.js`: ⚠️ constants, builder state logic, and craftable-availability logic only; the other files (`engine.js`, `world.js`, `path.js`, `ship.js`) were downloaded but not read.
- Wired "The Curse of Cow Clicker" via Wayback copy: ⚠️ read about 31,500 of about 38,000 extracted characters (the first 1,500 were sidebar text, and the tail after "Cow-pocalypse" scene was not read).

Fetched in full but returned only as a tool-written extract (page complete, wording and fine numbers not verified word for word):
- Pecorella, Math of Idle Games Parts I, II, III (Game Developer); Quest for Progress slides (SlideShare); Parkin, "The rise of games you (mostly) don't play" (Game Developer).
- Wikipedia: Universal Paperclips, Cookie Clicker, A Dark Room, Candy Box!, Incremental game.
- IF50 essay on Paperclips; Y Combinator blog interview with Lantz; GamesBeat Lantz interview; Vice on Paperclips; Cookie Clicker wiki.gg Golden Cookie page; Antimatter Dimensions wiki.gg pages (Infinity, Eternity, Reality, Celestials); Steam page for Kittens Game; Play Story Press landing page for "The Pleasure of Playing Less".

Could not reach or only partial (⚠️):
- ⚠️ Wired's original Lantz profile and The Verge Paperclips piece: not fetched (Wired blocked by the tool; Verge did not surface in search).
- ⚠️ Post Games and Hey Good Game interviews with Lantz: show notes only, no transcript; some content Patreon-only.
- ⚠️ GDC Vault pages for Pecorella's GDC 2015 talk: redirected to a maintenance page; talk video not seen.
- ⚠️ Kongregate blog posts by Pecorella ("A Brief Look at the Idle Games Genre", "Idle Chatter: GDC 2016"): not found.
- ⚠️ Kittens Game wiki: returned no body text; TV Tropes and MetaFilter: HTTP 403. "The Pleasure of Playing Less" book text (CMU/Play Story Press): only the landing page was read.
- ⚠️ Antimatter Dimensions Fandom wiki: HTTP 402 (used wiki.gg instead). AD's "time to reach" figures: not found.
- ⚠️ Orteil's own writing (dashnet): not searched beyond what Wikipedia reports.
- ⚠️ Bogost's own "Cow Clicker: The making of obsession" post: only an index page of his site was fetched; the Wired profile above was used instead.
- ⚠️ Deterding, "Progress Wars" (DiGRA/FDG 2016); Khaliq and Purkiss: not opened. The DiGRA PDF 2977 (a 5-page file with a Hong Kong university contact) returned binary only and was not identified.
- ⚠️ The fetch tool's extracts cannot be fully verified from the outside; any claim the report relies on heavily (for example Part III's prestige formulas and the golden cookie intervals) should be checked against the source page.
