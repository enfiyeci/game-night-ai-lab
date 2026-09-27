# How tycoon games make "what product to build" a real choice

Research note, 2026-09-26. Written for Game Night AI Lab. Game Dev Tycoon is left out because it was already researched
(`docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`).

Produced by an Opus research subagent for lane `gn-model-appeal`; saved verbatim from its report. Its coverage
statement (bottom) is the subagent's own claim.

**A caveat that applies to the whole note.** ⚠️ Every source was read through the WebFetch tool. That tool turns the page into text and then answers questions about it using a small model, so the subagent saw a summary of each page rather than its raw text. Where the tool said a page was cut off, or showed only the first page of a thread, the claim carries its own ⚠️. For any page not flagged that way, "read in full" means the whole page was passed to the tool and no truncation was reported. Fandom wikis refused every request (HTTP 402), and Steam guide pages hit rate limits (HTTP 429), so several guides a researcher would normally use could not be reached.

**Swap made.** Startup Company had almost no reachable sources: TV Tropes and Niche Gamer returned 403, and the developer's competitor announcement page did not include the announcement itself. It was replaced with **Automation: The Car Company Tycoon Game**, which has the most relevant market design of the candidates.

---

## 1. Mad Games Tycoon 2 (MGT2)

**What decides success.** Each genre has fixed ideal design sliders, target groups and good topic pairings. For example, Action targets teenagers and adults with design priorities of 10/40/30/20 ([Steam wiki guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2371634667), ⚠️ the tool reported this page was cut off partway through its comments). Engine tech level also matters a lot: one player sat at 1% review scores until they replaced a tech-level-1 engine with a tech-level-5 one ([thread](https://steamcommunity.com/app/1342330/discussions/0/3114770279403115213/)). Fans act as a sales multiplier, and "every fan will buy every game" you make ([thread](https://steamcommunity.com/app/1342330/discussions/0/3805026824431282841/)).

**What stops the obvious pick.**
- *Genre saturation.* The more games of a genre exist on your target platforms (made by you and by AI rivals), the less a new one sells. The UI shows saturation as coloured bars, and players say saturation affects sales more than trends do. A strong IP (a franchise the player owns) or a 90%+ review score can override it ([oversaturation thread](https://steamcommunity.com/app/1342330/discussions/0/564785528365425066/); [trends thread](https://steamcommunity.com/app/1342330/discussions/0/6471190413147351053/)). The best timing players describe is "popular but underdeveloped": the genre is in demand and few rivals serve it.
- *"Bored fans" penalty.* Releasing the same genre too often is punished. The developer says players "used to have to branch out to at least 3 different genres" ([thread](https://steamcommunity.com/app/1342330/discussions/0/3130541756140022567/)). At the start of a game the player picks a "special genre" that is exempt from the penalty. Players then showed it was exploitable: one released 18 games of the same genre in a row and won Game of the Year. Others said "genre without limit is nonsense," and the developer asked whether to cap it at 5 ([special genre thread](https://steamcommunity.com/app/1342330/discussions/0/3076503022327603412/), ⚠️ only the first page, 15 of 39 comments, was read). ⚠️ A search snippet said the penalty checks your last five games and costs 50% of sales plus all new fans. That was not found in any page opened, so treat it as unverified.
- *Trends.* A marketing department predicts upcoming trends with about 80% accuracy. Players can force a trend by releasing 90%+ games in the same genre. Players say trends have a "minimal effect on sales" ([trends thread](https://steamcommunity.com/app/1342330/discussions/0/6471190413147351053/)).

**Random or deterministic.** Mostly deterministic, with optional randomness settings. Platform popularity can be randomised by up to ±25%, ±50%, ±75% or fully. The developer renamed those settings "Low/Medium/High/Full" after players found them confusing, and one player said full randomness broke immersion when obscure platforms became bestsellers ([thread](https://steamcommunity.com/app/1342330/discussions/0/6852856640101879867/)). On Legendary difficulty, which genres pair well can be randomised. Players rediscover the pairings by making cheap test games and reading QA reports ([thread](https://steamcommunity.com/app/1342330/discussions/0/600787351825021470/)).

**Feedback to the player.** QA reports, fan mail and the saturation bars ([thread](https://steamcommunity.com/app/1342330/discussions/0/3114770279403115213/)). Some players skip all of that and read the ideal values straight out of the game's GENRE.txt data file, which shows the optimisation is a fixed answer waiting to be looked up.

**What players said.** The anti-repetition devices produce the arguments. Players push back when a device is removed (the special genre). They also call "bored fans" a flat punishment, while describing trends and saturation as feeling "natural" and "rewarding to overcome" ([special genre thread](https://steamcommunity.com/app/1342330/discussions/0/3076503022327603412/), ⚠️ first page only).

## 2. Game Dev Story (Kairosoft)

**What decides success.** Each game has one genre and one type. Every pair has a fixed combo grade, from "Amazing!" (S) down to "Not Good" (F), shown with flavour text such as "your staff is very excited" ([genres and types page](https://kairosoft.wiki.gg/wiki/Genres_and_types_(Game_Dev_Story))). The game also builds up Fun, Creativity, Graphics and Sound points during development. Four critics score it out of 40 in total, and 32 or more enters the Hall of Fame and unlocks sequels, which start with some of the original's points ([creating games page](https://kairosoft.wiki.gg/wiki/Creating_games_(Game_Dev_Story))).

**What stops the obvious pick.** Genres and types level up the more you use them, and fans are tracked by age group and gender, which fan letters push up or down ([main page](https://kairosoft.wiki.gg/wiki/Game_Dev_Story)). Similar games released at the same time cut each other's sales, and oversaturating a category "will shrink fanbase" ([creating games page](https://kairosoft.wiki.gg/wiki/Creating_games_(Game_Dev_Story))). Combos are discovered by trying them: an untried pair is labelled "First Try" until you make it.

**Random or deterministic.** Combo grades are a fixed table. Mid-development boosts are random: a boost gives +25 to 32 points on success, or 20 to 30 bugs on failure ([creating games page](https://kairosoft.wiki.gg/wiki/Creating_games_(Game_Dev_Story))).

**What players and critics said.** It scores 86 on Metacritic. The main criticism is that the late game gets too easy once you know the good combos and can release hits one after another ([Wikipedia](https://en.wikipedia.org/wiki/Game_Dev_Story)). In other words, once discovery is finished, the choice disappears.

## 3. Software Inc.

**What decides success.** In the design document the player picks features, which add "market interest." Interest caps at 100%, and anything above that is "wasted interest" that adds no sales. The developer added the cap after early-access players hired huge teams to build every feature ([thread](https://steamcommunity.com/app/362620/discussions/0/594012133032742167/)). Each software type has sub-categories. If you split a product 20/20/60, it counts as the 60% category, and low saturation in that category means more sales ([moderator reply](https://steamcommunity.com/app/362620/discussions/0/4029096934193727719/)). A market analysis screen shows saturation per category ([thread](https://steamcommunity.com/app/362620/discussions/0/3829788180807282293/)). A feature counts as "innovation" if no competitor has it yet, and in the developer's early design, innovation set how long a product keeps selling ([dev blog](https://softwareinc.coredumping.com/fifth-update-gui-and-game-mechanic-details/)).

**Franchise and switching cost.** Market recognition grows with each sequel in an IP. Players report needing 5 or 6 sequels to reach full recognition ([search snippet from a Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2926392699), ⚠️ the guide itself could not be opened because of HTTP 429). Reputation, fans and marketing are said to drive sales more than quality alone ([thread](https://steamcommunity.com/app/362620/discussions/0/3133919999734467474/); [thread](https://steamcommunity.com/app/362620/discussions/0/592882992704132423/)). One player saw pre-marketing a sequel cut the current product's sales ([thread](https://steamcommunity.com/app/362620/discussions/0/6664812048263024906/), ⚠️ the tool described this thread as ongoing and may not have shown every reply).

**Random or deterministic.** The market's history is simulated and randomised for the 10 years before play starts ([dev blog](https://softwareinc.coredumping.com/fifth-update-gui-and-game-mechanic-details/)).

**What players said.** The rules are poorly explained. A 98%-interest "outstanding" game sold 3,600 of 60,000 copies, and its maker found that unfair ([thread](https://steamcommunity.com/app/362620/discussions/0/3425564314021273448/)). Another player's operating system collapsed with no visible cause ([thread](https://steamcommunity.com/app/362620/discussions/0/353915309334499343), ⚠️ first page only). One player called the wasted-interest rule bad design because it removes the incentive to build more features ([thread](https://steamcommunity.com/app/362620/discussions/0/594012133032742167/)).

## 4. Big Pharma

**What decides success.** The value of a drug comes from its active cures minus its side effects. Its CURE rating runs from S+ to F: an A adds 20% to the price, an E takes off 20%, and C, the default, changes nothing ([thread](https://steamcommunity.com/app/344850/discussions/0/520518688951336366/)). Removing side effects costs processing, so a weaker, cleaner drug can earn more than a stronger, dirtier one ([thread](https://steamcommunity.com/app/344850/discussions/0/451852225141049372/)).

**What stops the obvious pick.**
- *Saturation.* Supply is shown as a percentage of demand. In one guide's example, you sell 90 units at 90% saturation, then two AI rivals add 60 units each, pushing saturation to 210% and the price down sharply ([tips guide](https://steamcommunity.com/sharedfiles/filedetails/?id=513017406)). Cheap, weak rival drugs can drag down the price of a good one ([thread](https://steamcommunity.com/app/344850/discussions/0/520518688951336366/)).
- *Patents.* A patent takes 3 months to draft and holds rivals out of a market. The guide gives a worked case: a $20,000 twelve-month patent on a $90-a-month product pays for itself if it prevents a price drop of about $19 per unit ([tips guide](https://steamcommunity.com/sharedfiles/filedetails/?id=513017406)).
- *Expansion.* The Marketing and Malpractice expansion adds manual pricing (undercut rivals, or charge monopoly prices) and disease-awareness campaigns that create demand ([official page](https://www.bigpharmagame.com/mm_expansion.html)).

**What players and reviewers said.** Saturation can push a price all the way to zero while patients still need the drug. In long games with 3 AI rivals, prices never recovered even after a player stopped producing for a year, and the developer agreed the mechanic "falls down a bit in the long-term" ([thread](https://steamcommunity.com/app/344850/discussions/0/483367798515815515/)). One reviewer found that AI rivals barely moved the market compared with the player's own flooding. The same reviewer said strong late-game machines and tier-4 margins removed the pressure after the first 60 to 90 minutes ([Scientific Gamer](https://scientificgamer.com/thoughts-big-pharma/)). It scores 72 on Metacritic ([Wikipedia](https://en.wikipedia.org/wiki/Big_Pharma_(video_game))).

## 5. Automation: The Car Company Tycoon Game (replaces Startup Company)

**What decides success.** Each buyer group (a "demographic") weighs car stats such as performance, safety, prestige, comfort, off-road and utility differently. A car's competitiveness score is **relative**: 100 means it matches the best cars currently in that category. As the developer put it, if only bad cars exist in a market, a mediocre car "will look fantastic" ([dev reply](https://steamcommunity.com/app/293760/discussions/2/3203652426713426066/)). Affordability is the share of a demographic that will buy at your price ([thread](https://steamcommunity.com/app/293760/discussions/2/3078747189793560099/), ⚠️ only 15 of 22 posts were shown).

**What stops the obvious pick.** Rivals keep releasing better cars, so a score falls over time and players need a facelift every 24 to 36 months. Niche segments such as sports cars cannot fill even a small factory at the start, while the family and premium segments are where the volume is. An oversized factory loses money because its fixed costs stay the same. Raising prices can start a "death spiral" of falling volume. Similar trims (versions of one model) take sales from each other. Old car bodies carry an age penalty, so models need replacing every 10 to 15 years ([profit thread](https://steamcommunity.com/app/293760/discussions/2/3812907397169420847/)).

**Feedback to the player.** Clicking a demographic shows your car's stats next to the average of the top 3 competitors in that category ([dev reply](https://steamcommunity.com/app/293760/discussions/2/3203652426713426066/)). This is the clearest "why did it sell" screen found in any of these games. The complaint players raise is that the sales forecast misses rival cars released while yours is still in development ([profit thread](https://steamcommunity.com/app/293760/discussions/2/3812907397169420847/)).

---

## Patterns across these games

- **Crowding is the main device that keeps the choice open, and it works best when it is relative.** MGT2's saturation bars, Big Pharma's saturation percentage, Software Inc.'s sub-category saturation and Automation's score against the top 3 rivals all make the "best" product depend on what everyone else has already built.
- **A fixed "fit" table gets solved.** Game Dev Story combos, MGT2's ideal sliders (found in GENRE.txt) and similar tables are discovered once and then repeated. Critics describe the late game as "too easy" for exactly this reason. Fit works as a skill floor, but it does not create a strategic choice.
- **Anti-repetition rules need a clear cause and a gradual cost.** MGT2's flat "bored fans" penalty felt like punishment. Saturation, which rises and falls with the market, felt natural. Removing the rule (the special genre) led straight to 18 same-genre releases in a row.
- **A franchise creates a real trade-off only when it competes with something.** Software Inc. sequels build recognition but make competition tougher, and marketing the next sequel eats into the current product. In MGT2, a strong IP can simply override saturation, which removes the tension.
- **Relative scores need a comparison screen.** Automation's side-by-side view against the top 3 rivals makes relative scoring readable. Software Inc.'s unexplained flops ("98% interest, 3,600 sales") are what feel fake.
- **Caps on features are valued when they are visible.** Software Inc.'s 100% interest cap turns feature choice into targeting instead of stacking everything. It only frustrates players who cannot see why extra features do nothing.
- **Saturation that never recovers breaks the model.** Big Pharma's zero-price markets are the warning case: crowding needs a recovery path, or it becomes a permanent dead zone.
- **Randomness is where trust is lost.** Players criticised full random platform popularity. Deterministic crowding driven by rivals was accepted as fair.

## What this suggests for Game Night AI Lab

1. **Make the wave bonus shrink as rivals crowd in, and show it on screen.** (From MGT2's saturation, Big Pharma's saturation percentage and Automation's relative score.) Rival labs follow fixed, published scripts, for example "Rival B enters the coding tool in era 2, round 2." The wave bonus becomes the base bonus divided by the number of labs serving that product, shown as bars. That makes "the hot product last round" and "the under-served product next round" a real trade-off, stays deterministic, and can be announced a round ahead, much like MGT2's forecast but with 100% accuracy.
2. **Score fit relative to the rivals' best, with a comparison panel.** (From Automation.) Popularity for a product equals your model's fit against the best rival model's fit on that product, shown side by side on each stat such as reasoning or context. A merely decent chat app in an empty field then beats a great coding tool in a crowded one. The panel is the "why" screen.
3. **Cap how much feature appeal counts, per product, and show the overflow.** (From Software Inc.'s interest cap and sub-categories.) Each product has an appeal ceiling, for example chat 100 and agent 140. Features past the ceiling show up as "wasted appeal" that still costs serving compute. Each product also scores its own mix of features, for example the agent product counts computer use at full weight while chat counts it at a quarter. Feature slots then become a targeting decision.
4. **Treat a product line as momentum, with a cost to staying and a way back.** (From Software Inc.'s recognition and cannibalisation, MGT2's IP, and Big Pharma's failure case.) Users carry over within a product line, which is the switching cost. The line also collects a fixed "fatigue" from its own rising crowding. Any market the player leaves recovers by a set amount each round, so no market is ever permanently dead.
5. **Let safety systems act like patents, protecting a lead instead of only adding risk.** (From Big Pharma's patents and its side-effect trade-off.) Investing in a product's safety system could delay a scripted rival's entry into that product by one round, or cut the crowding penalty. That turns the per-product risk into a choice between defending your market and expanding into a new one.

---

## Coverage statement (the subagent's own)

⚠️ All pages were read through WebFetch, which returns a small model's summary of the converted page rather than the raw text (see the caveat at the top).

**Read in full (no truncation reported):**
- https://steamcommunity.com/app/1342330/discussions/0/6471190413147351053/
- https://steamcommunity.com/app/1342330/discussions/0/564785528365425066/ (short thread with no developer replies; the tool reported it lacked detail)
- https://steamcommunity.com/app/1342330/discussions/0/6852856640101879867/
- https://steamcommunity.com/app/1342330/discussions/0/3130541756140022567/
- https://steamcommunity.com/app/1342330/discussions/0/3805026824431282841/
- https://steamcommunity.com/app/1342330/discussions/0/3114770279403115213/
- https://steamcommunity.com/app/1342330/discussions/0/600787351825021470/
- https://wiki.beefsuplex.com/wiki/Mad_Games_Tycoon_2 (had no relevant content)
- https://kairosoft.wiki.gg/wiki/Genres_and_types_(Game_Dev_Story) (ends at its Trivia section)
- https://kairosoft.wiki.gg/wiki/Creating_games_(Game_Dev_Story) ⚠️ the tool called it "truncated", apparently because topics were missing rather than because the text was cut; its last section, "Sequel", was reached
- https://kairosoft.wiki.gg/wiki/Game_Dev_Story
- https://en.wikipedia.org/wiki/Game_Dev_Story
- https://steamcommunity.com/app/362620/discussions/0/3425564314021273448/
- https://steamcommunity.com/app/362620/discussions/0/3829788180807282293/
- https://steamcommunity.com/app/362620/discussions/0/592882992704132423/
- https://steamcommunity.com/app/362620/discussions/0/4029096934193727719/
- https://steamcommunity.com/app/362620/discussions/0/3133919999734467474/
- https://steamcommunity.com/app/362620/discussions/0/594012133032742167/
- https://softwareinc.coredumping.com/fifth-update-gui-and-game-mechanic-details/ (an early-access dev post, so it may be outdated)
- https://softwareinc.coredumping.com/wiki/index.php/Main_Page (covers modding only)
- https://steamcommunity.com/app/344850/discussions/0/451852225141049372/
- https://steamcommunity.com/app/344850/discussions/0/483367798515815515/
- https://steamcommunity.com/app/344850/discussions/0/520518688951336366/
- https://steamcommunity.com/sharedfiles/filedetails/?id=513017406 (ends with the author's own "coming soon" note)
- https://en.wikipedia.org/wiki/Big_Pharma_(video_game)
- https://scientificgamer.com/thoughts-big-pharma/
- https://www.bigpharmagame.com/mm_expansion.html
- https://steamcommunity.com/app/293760/discussions/2/3203652426713426066/
- https://steamcommunity.com/app/293760/discussions/2/3812907397169420847/
- https://steamcommunity.com/app/606800/eventcomments/1634166237653647707 (comments only; the announcement text was not on the page)

**Read partly:**
- ⚠️ https://steamcommunity.com/sharedfiles/filedetails/?id=2371634667: cut off partway through its comments.
- ⚠️ https://steamcommunity.com/app/1342330/discussions/0/3076503022327603412/: first page only, 15 of 39 comments.
- ⚠️ https://steamcommunity.com/app/362620/discussions/0/353915309334499343: first page only.
- ⚠️ https://steamcommunity.com/app/362620/discussions/0/6664812048263024906: the tool said the discussion continues, so not every reply may have been shown.
- ⚠️ https://steamcommunity.com/app/293760/discussions/2/3078747189793560099/: 15 of 22 posts.

**Could not reach:**
- ⚠️ HTTP 402 (Fandom): https://mad-games-tycoon-2.fandom.com/wiki/Game_Review, https://software-inc.fandom.com/wiki/Develop_Software, https://bigpharma.fandom.com/wiki/Cure_Rating
- ⚠️ HTTP 429 (Steam rate limit): https://steamcommunity.com/sharedfiles/filedetails/?id=3323666699, https://steamcommunity.com/sharedfiles/filedetails/?id=2926392699
- ⚠️ HTTP 403: https://www.neoseeker.com/big-pharma-game/faqs/1768576-big-pharma.html, https://en.namu.wiki/w/Software%20Inc., https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/StartupCompany, https://nichegamer.com/niche-spotlight-startup-company/
- ⚠️ HTTP 404: https://softwareinc.coredumping.com/wiki/index.php/Market

**Claims resting only on search snippets, marked ⚠️ in the text:** MGT2's "last five games, -50% sales" rule, and Software Inc.'s "5 to 6 sequels for full recognition". Reaching the Fandom and Steam guide pages would take a browser session or waiting out the rate limit.
