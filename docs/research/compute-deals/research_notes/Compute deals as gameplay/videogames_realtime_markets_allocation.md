# Real-time and pausable-real-time games: markets, contracts, timed offers, and shared-pool allocation UI

Researched 2026-10-26 for Game Night AI Lab (real-time browser management game, about 20 minutes, about 30 rounds; compute deals plus a two-handle training / serving / safety bar). Does not repeat `docs/research/compute-mechanics/notes/ai_themed_games.md` (read in full first; it covers AI-themed games only).

Method caveat that applies to every row below: the fetch tool returns a model-written extract of each page, not the raw page text. "Read" below therefore means "the fetch tool read the page and answered my extraction prompt", so direct quotes are short and come from that extract. Where a page was blocked, truncated or partly shown, the claim carries a warning sign naming what was missing.

---

## 1. Real-time markets against AI and rivals: what makes a price move feel tense instead of fiddly?

### Takeaway
The best-documented case is Offworld Trading Company (OTC, Soren Johnson, Mohawk Games, 2016): one game-wide price per resource, moved by every player's buying and selling in real time, with a roughly 20-minute match, orders allowed while paused, and an endgame (stock buyouts) that the designers deliberately turned into a visible countdown. Tension came from seeing a number move and knowing someone caused it; fiddliness (Anno 1800 trade routes) came from not being told what a route earns or why it failed.

### Cited Findings

**Offworld Trading Company: the market**
- The prototype had neutral colonies with different demand per location (steel could sell for $10 nearby and $100 far away), "Railroad Tycoon"-like. The final design replaced that with a single game-wide market where "if one player bought Wood, the price went up for everyone." Players felt the old version was "disconnected from the map". — [Designer Notes #2: Free Markets](https://www.designer-notes.com/otc-designer-notes-2-free-markets/). (Page extract says nothing about real-time pace or UI display of prices.)
- Johnson found a single price per resource "so much more powerful" than the two-price (buy at double the sell price) market from Age of Empires II, which had "greatly hindered" market play because the spread drained gold. — [Designer Notes #2](https://www.designer-notes.com/otc-designer-notes-2-free-markets/); [Matchstick Eyes interview, 2014](https://matchstickeyes.com/2014/10/01/offworld-trading-company-interview-with-soren-johnson).
- Matches are "about 30 minutes" in the 2014 interview, with several game speeds and orders issuable while paused "so tycoon-minded players can slow down"; resource shipping was automated "to shift attention from route micromanagement to the free market." — [Matchstick Eyes interview](https://matchstickeyes.com/2014/10/01/offworld-trading-company-interview-with-soren-johnson).
- The 2016 Early Access preview says a typical match is about 20 minutes and "demands rapid buy-or-sell decisions"; prices rise when rivals buy materials for construction and fall when a resource is flooded; the interface shows market values "front and center", so a player who can follow a changing number can plan "even without finance knowledge". — [Shacknews preview, "Taking Stock in Space"](https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space). (Early-access-era description, not final-game documentation.)
- The Offworld Market (late-game export) has prices that are "more stable" than onworld prices, because demand is "so high and widespread" that players cannot easily crash it. Designers say stable prices guarantee the game can end; onworld prices "swing" and could otherwise stall income. An uncapped number of Offworld buildings "extend[ed] the game far too long", so players are capped at two. — [Designer Notes #12: Offworld Market](https://www.designer-notes.com/otc-designer-notes-12-offworld-market/).

**Offworld Trading Company: Black Market (sabotage via the market)**
- Not in the original design; came from a playtester remark ("It would be cool if I could sabotage the other players' buildings"). Designers wanted sabotage without making the game about combat. Items are bought from a shared market; roughly seven are chosen randomly each game; each purchase raises that item's price for every player. — [Designer Notes #13: Black Market (Part I)](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i). (The page extract does not give lockout timers or price-recovery rules.)
- Why it is tense: a visible price spike tells everyone someone just bought that item; "the owner can only guess who attacked him"; a Goon Squad (counter-item) was added because players had no defense; Masquerade mode hides player identities. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i).

**Offworld Trading Company: stock buyouts as the endgame clock**
- First version: a buyout transferred the loser's whole company; players "inherited buildings they had no time to manage" and the game spiraled; making buyouts pricier made players hoard cash. Fix: the loser becomes a subsidiary run by a modified AI that only tries to make money (it avoids sabotage, patents, auctions and stock trading), so a clearly losing player can no longer disrupt the leader. — [Designer Notes #17: Stock Market](https://www.designer-notes.com/otc-designer-notes-17-stock-market/).
- Less than five months before shipping, the team let players buy an opponent's self-owned shares one at a time at double cost, so "remaining stock became a visible countdown" (shares as hit points) in response to players asking how close rivals were to a buyout. Final rule: one share at a time until five remain, last five bought together, third-party shares cost 20% more during a buyout. The article says most players did not notice the 20% change but it "felt better", and describes a rush / turtle / boom dynamic (buy your own fifth share to block). — [Designer Notes #17](https://www.designer-notes.com/otc-designer-notes-17-stock-market/). (The page extract states the countdown readability; it describes no specific interface changes.)

**Offworld Trading Company: how the AI competes and where it went wrong**
- The AI cannot use Holograms or Spies, and the game states this; Johnson: detecting a hologram would need visual pattern recognition beyond the AI, and if it did detect one humans would suspect cheating. — [Shacknews preview](https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space). The preview also says options to use certain tools against the AI carry a warning that AI opponents will not use them.
- Early Access player thread "SUPRISE- Stock buyouts" (Feb 2015): players lost within about 15 seconds of a buyout starting; one said they lost five games in a row; some reported an AI with about $20k cash buying them out for roughly $1.05M and AIs using the black market repeatedly "with no cooldown while broke"; a player proposed an intel building showing how much an AI could cash out instead of a timer. A developer reply: "We're aware of this problem and we'll be working to make it more transparent," and a fix from Soren would slow how fast the AI buys stock. — [Steam thread 618453594754245349](https://steamcommunity.com/app/271240/discussions/0/618453594754245349). ⚠️ The page showed only 15 of 49 comments; the reply is unlabeled on the page; the player-reported AI behaviors are unverified and from the 2015 pre-release build, not the shipped game.
- Johnson says the game is "an RTS" in structure: "money, not firepower, is the player's weapon", competition "without guns". — [Matchstick Eyes interview](https://matchstickeyes.com/2014/10/01/offworld-trading-company-interview-with-soren-johnson).

**Anno 1800 trade routes and AI traders**
- The designers' devblog: classic routes are hand-built (pick stations, set goods per ship, "Wait until full", "Throw overboard", draggable waypoints). Charter routes rent a neutral AI ship for one good between two own islands, cannot be controlled manually, can be attacked, and have higher upkeep. Stated intent is the opposite of "less micromanagement": "What we are aiming for is a complex system, which favors the freedom of the player," with charter routes as the fast option "when even the most seasoned logistics expert needs a fast and easy solution." — [Anno Union devblog "Your own trading empire"](http://www.anno-union.com/devblog-your-own-trading-empire/). The devblog notes the shown UI was "not final". It does not describe passive trade or AI trader behavior.
- Review: trade "feels fiddly and opaque", it "isn't readily clear" what goods are worth or how much a route earns, and the reviewer saw routes never deliver, possibly because one ship was assigned to several routes "which I was never notified about." AI rivals bring "less predictable" games but diplomacy is "rudimentary" and trade is the main interaction. — [PCGamesN Anno 1800 review](https://www.pcgamesn.com/anno-1800/review).
- Anno 1800 AI traders collect surplus stock you put up for sale above a minimum you set; players mostly use AI traders to dump overproduction. — ⚠️ search-engine summary of the Anno 1800 Fandom wiki and a Steam thread only; neither page was opened by me, so treat as unverified.

**OpenTTD (Transport Tycoon) subsidies against AI**
- A subsidy is announced in the newspaper to all players; the first company to provide the service before expiry gets it, then earns a bonus rate for the next year (1.5x to 4x depending on difficulty); awarded subsidies may belong to AI or human companies and both show on the Subsidies screen. — [OpenTTD wiki: Subsidy](https://wiki.openttd.org/en/Manual/Subsidy). The page gives no fixed offer length and does not say how the AI chooses subsidies.

**Stellaris galactic market**
- Prices move with supply and demand between 20% and 500% of base; large buys or sells in a month push the next months' prices; the Market screen offers bulk orders and monthly automated trade orders with optional price limits; trade orders execute at the month rollover; fees start at 30% with a 5% floor. — [Stellaris wiki: Trade](https://stellaris.paradoxwikis.com/Trade). The page says nothing about AI empires' influence and gives limited UI detail.

**EVE Online contracts**
- Three contract types: Item Exchange, Auction (starting bid, optional buyout price, duration in days), Courier (reward plus collateral posted by the hauler plus "Days to Complete"). Contracts cannot be edited once submitted, and items leave your possession but stay yours until accepted. — [EVE University wiki: Contracts](https://wiki.eveuniversity.org/Contracts). The page does not describe the browsing interface or maximum durations.

**Factorio-like throughput (shown here because it shapes the allocation section too)**
- See section 3. No separate market evidence was gathered for Factorio.

### Inferences
- OTC's recipe, in plain terms: (a) one shared price that every actor moves, (b) a short match, (c) a rival whose actions show up in the same price, not hidden, (d) an endgame state expressed as a number counting down. All four fit a 30-round run.
- AI trust failure is the recurring risk: the 2015 OTC thread shows players reading a fast, unexplained AI move as a bug or cheating, and Johnson himself avoided AI abilities that humans would suspect as cheating. For Game Night AI Lab this argues for rival labs that act through the same visible deal pool and are rate-limited, with the action announced.
- Anno 1800's complaint (not told what a route earns, no notice that a ship was double-assigned) is the "fiddly" pattern: setup cost plus no feedback on result. A one-click deal with a stated outcome ("+8 compute in 2 rounds, $40M") avoids it.
- Stellaris-style standing orders with price limits are a possible way to let a player act without watching, but I found no evidence on whether players find them clear.

### Gaps
- Official OTC wiki pages (Buyout, Black Market item list) were not reached; only the designer's notes and secondary previews. No GDC talk on OTC's real-time economy was found by search.
- Rise of Industry / Capitalism Lab contracts: search returned only generic law pages; nothing found. Railway Empire, X4 Foundations, Prison Architect: not researched beyond zero search hits; no findings.
- Anno 1800 AI-trader mechanics beyond the devblog and review are unverified (see warning above).

---

## 2. Timed offers and limited windows: what do games show, and how long do they last?

### Takeaway
Across the games checked, a timed offer works when the window is stated in the game's own clock units, the player can see what they gain, and the decision is small. Reported durations vary a lot: RimWorld orbital traders stay about 16 in-game hours of a 60-day year; OpenTTD subsidy offers are announced to everyone and last on the order of a year of game time; Against the Storm traders stay for a displayed countdown. I found no usable primary source on Slay the Spire shops, FTL stores, Startup Company or Two Point Hospital timed offers, so those are not claimed.

### Cited Findings
- RimWorld: orbital traders get one possible arrival every 15 days (7 days active, then 8 inactive) and stay 40,000 ticks (about 16 in-game hours) after arrival; land caravans stay 27,000 to 45,000 ticks; caravan visit dates are at least 6 days apart, five seeded dates per 60-day year; traders have limited silver, so goods beyond their budget are "given away for free"; sell price is 60% of market value and buy is 140%, adjusted by the negotiator's Social skill, with the tooltip showing "Your negotiator bonus: -x%"; items a trader does not want are grayed out at the bottom; buy/sell quantities use positive/negative numbers with ONE and ALL buttons. — [RimWorld Wiki: Trade](https://rimworldwiki.com/wiki/Trade). ⚠️ The page text is 115,032 characters; the extract covered only characters 0 to 100,000. The final 15,032 characters (gift section) were not read.
- Against the Storm: the trading screen shows a countdown of how long the trader remains in the settlement; the "Auto" button works out the goods needed for an acceptable deal; a red bar in the middle shows how fair a deal is for each side; 2 to 8 regular traders arrive roughly once a year, and the arrival timer stops during Storm; Orders are objectives rewarding Reputation and goods/villagers/Perks, chosen from 2 to 4 options in an order pack. — ⚠️ [Against the Storm wiki: Trading and Orders, wiki.hoodedhorse.com](https://wiki.hoodedhorse.com/Against_the_Storm/Trading) both returned HTTP 403 when I tried to fetch them; every statement here is from a search-engine summary of the pages, not the pages themselves. The same summary says the wiki was last updated for game version 1.8.13 while the game was on 1.9.8, so details may be stale. The results did not say what happens to goods unsold when the timer ends.
- OpenTTD: the Subsidies window lists "available" and "awarded" subsidies with the dates by which they "must be claimed or will end"; first provider wins; reward is 1.5x to 4x for the next year. — [OpenTTD wiki: Subsidy](https://wiki.openttd.org/en/Manual/Subsidy). ⚠️ A claim from a search summary of the OpenTTD source docs that the offer lasts 12 months (`SUBSIDY_OFFER_MONTHS = 12`) was not fetched or confirmed by me.
- EVE contracts: every contract has an explicit duration in days (auction time or expiration, plus "Days to Complete" for couriers), cannot be changed after submission, and public / private / corporation / alliance visibility controls who sees it. — [EVE University wiki: Contracts](https://wiki.eveuniversity.org/Contracts).
- Game Dev Tycoon contracts: community-reported that contracts ask for a number of design and tech points in a time frame, carry a penalty if missed, and new ones appear about every 6 months. — ⚠️ search-engine summary of Steam threads only; I did not open the Game Dev Tycoon wiki (the Fandom contracts page returned HTTP 402) and the search summary itself flagged the posts as anecdotal.
- Victoria 3: the 1.2 patch added a Message Settings window controlling how each notification displays and "whether it auto-pauses the game", moved Price Reports off by default, and split trade-route notifications into significant (on) and less significant (off); Paradox benchmarks a roughly 50% reduction in notifications for most countries. Principle stated: notifications "should be informative and have sensible default settings." — [Victoria 3 Dev Diary #74: UX Improvements](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements).
- OTC: the market can be given orders while paused, and a buyout can end the game in seconds, which players in the early build said felt too fast (see section 1 thread). — [Matchstick Eyes interview](https://matchstickeyes.com/2014/10/01/offworld-trading-company-interview-with-soren-johnson); [Steam thread](https://steamcommunity.com/app/271240/discussions/0/618453594754245349) (⚠️ 15 of 49 comments shown).

### Inferences
- Two design variables recur: the window's length in game-clock units, and what the offer shows (RimWorld shows the price modifier and gray-outs; Against the Storm shows time left plus a fairness bar plus an Auto button). A deal card in Game Night AI Lab can borrow: remaining time, a fairness indicator, and a one-click "make this acceptable".
- Windows that are in game-days and tied to arrival cycles (RimWorld's 7-day-on, 8-day-off rhythm) give the player a learnable rhythm, which a 30-round game can mimic by offering a deal type every N rounds.
- Pausing rule: in a pausable-real-time game, a notification that auto-pauses should be opt-in per type, and expiry should not run while a dialog is open (Victoria 3 made auto-pause configurable per message type; Against the Storm halts the trader arrival timer during Storms). This supports the clock-stops-in-dialogs behavior the prototype already has.

### Gaps
- No source for Slay the Spire shops, FTL stores, Startup Company contracts, Two Point Hospital challenges or Frostpunk timed events was opened; no claim made.
- Typical offer lengths in seconds of real time were not found for any game; the units are in-game days or hours.
- Against the Storm numbers need re-verification from a reachable copy of the wiki or the game.

---

## 3. Allocating one pool among uses: what works, what fails, and what fixes did designers ship?

### Takeaway
The failure patterns found are: a number the player needs is not visible at the point of action (Cities: Skylines day/night icons "too small"), a single control that silently reorders everything (Oxygen Not Included priorities, "if everything is 9, it's the same as everything being 1"), and linked sliders that lock each other out. The fixes designers shipped are to show consequences immediately (Factorio's satisfaction bar and proportional slowdown), explain what blocks an action (Victoria 3 Market Access tooltips), and simplify the rule (ONI's 2018 priority change).

### Cited Findings
**Oxygen Not Included priorities**
- The wiki: priorities run from "very high" down to "very low" plus "disabled" (never done); default is 5 and cannot be changed; sub-priority 1 to 9 breaks ties (9 first); an equal tie falls to a hidden priority the player cannot change, or to proximity if the "Enable Proximity" option is on; the page recommends the hidden tiebreaker for small colonies and proximity for larger ones. — [ONI wiki: Priority](https://oxygennotincluded.wiki.gg/wiki/Priority). The page does not confirm the numeric 1 to 9 range for the main priority level, does not describe the Jobs screen UI, and does not say the system is confusing.
- Developers' 2018 update note: they linked Jobs to priority because it seemed "a natural fit", found the result "hard to understand", and changed roles to only affect order within a single priority level; they postponed a fuller rework of priorities. — [ONI wiki: OC-253538](https://oxygennotincluded.wiki.gg/wiki/Versions/OC-253538).
- Player evidence: one player says they "have to raise the priority on everything or nothing gets done"; another says if everything is 9 "it's the same as everything being 1"; veterans advise keeping routine tasks at default and using 6-7 for important ones "so 8-9 stays available for emergencies". A 2025 poster says dupes still would not store meat in a fridge set to priority 9. No developer reply appears in the thread. — [Steam thread 1488861734118395135](https://steamcommunity.com/app/457140/discussions/0/1488861734118395135). ⚠️ The page showed 15 of 17 comments; two were not captured.

**Cities: Skylines budget sliders**
- A player asked why each utility on the Economy tab has two sliders, said the tooltips gave no hint, and kept losing money; the accepted reply pointed at the day and night icons; the poster: "Had no idea those were day and night icons. Too small." Replies mostly advised leaving the sliders alone because the real money drain was too many services. — [Steam thread 1776010325128559462](https://steamcommunity.com/app/255710/discussions/0/1776010325128559462). Single player report; no official developer statement was found.

**Game Dev Tycoon development sliders**
- A new player asked "I do not understand what the slider's are supposed to do when creating a game" and whether it was "just a guessing game with a random chance at the end"; explanations were that they set how much time goes into each category and rough percent targets; another player said the explanation of the "symbols" finally helped; others said they stopped re-tuning and "crank out the same 3 topic/genre combos so I don't have to keep changing the sliders." — [Steam thread 810938082588133863](https://steamcommunity.com/app/239820/discussions/0/810938082588133863). Contracts and time limits are not discussed in that thread. The page extract flagged that some of the page text read like scraped instructions, which I ignored.

**Frostpunk worker assignment**
- The 2018 review criticized having to "click around frantically" to adjust a factory's build queue or a guard post's staffing and wanted a quick way to check building status. — ⚠️ [Checkpoint Gaming review](https://checkpointgaming.net/reviews/2018/04/frost-punk-review-not-winter-wonderland/) returned HTTP 403; the quote is from a search-engine summary of the page, not the page.
- Frostpunk 2 players were confused by workforce limits, e.g. housing could not be turned on because workforce was overextended elsewhere. — ⚠️ search-summary of a Steam thread I did not open.

**Factorio power graph**
- Clicking a pole shows a satisfaction bar (how much demand is met; turns yellow then red as it drops), a production bar, an accumulator bar, and graphs by producer and consumer with a time window. When supply falls short, all machines on the network slow in proportion (180 kW for 300 kW demand runs everything at 60%). The page describes no alert for a shortfall. — [Factorio wiki: Electric system](https://wiki.factorio.com/Electric_system).

**Victoria 3 production methods and UX fixes**
- Dev Diary #74 listed problems and fixes: Market Access tooltips "explain why a State isn't fully connected"; Investment Pool made more prominent in the Buildings panel; Pop need tooltips reorganized so key information is higher up; a clearer AI Acceptance display and all diplomatic plays shown (not only startable ones) because it was "hard to see what blocked a Diplomatic Play"; Convoy balance added to the Top Bar. Principles: "information hierarchy: relevant information should appear higher up", reduce noise. — [Victoria 3 Dev Diary #74](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements).
- Players found production-method choices untrustworthy: each option is labeled as more profitable, and switching back and forth can look illogical because newer methods raise wage costs. — ⚠️ search-engine summary of a Steam thread I did not open; the Dev Diary #5 design-intent claim is also from the search summary only.

**Master of Orion sliders**
- The original game (1993) uses sliders to divide a colony's output among ship construction, planetary defense, factory construction, ecology and research, and research funding across six fields. — [Wikipedia: Master of Orion](https://en.wikipedia.org/wiki/Master_of_Orion). The page does not mention lockable sliders and gives no reception comment on the sliders. A search-engine result did describe "lockable sliders" in the first game, but I could not confirm that on a fetched page.

**Linked sliders that share a fixed total (implementation-forum evidence)**
- Developers report the dead-end: giving all remaining points to one slider locks the other nine out; if one slider is at 75%, two others can only trade 25% between them. Handling the remainder either splits the change equally among untouched sliders or scales the others proportionally, with a special case when all others are at zero. — search-result summaries of jQuery, Bubble, Cycling74 and AGS forum threads; ⚠️ none opened. These are programmer Q&A threads, not UX research.

**UX-writing sources**
- Celia Hodent in a GDC podcast: in games affordances are mostly cognitive ("signifiers"); players should be able to tell what something is for "just by looking at" it; designers should set expectations from the start. — [Game Developer: Games, psychology, and UX with Celia Hodent, GDC Podcast ep. 8](https://www.gamedeveloper.com/design/games-psychology-and-ux-with-celia-hodent---gdc-podcast-ep-8). The article does not discuss feedback, cognitive load or sliders. I could not read The Gamer's Brain itself.

### Inferences
- Likely cause of the playtester's stuck state, by analogy (not proven for this build): the pool had no visible "free" number and no obvious way to take compute from serving or safety, which is the same class of failure as ONI's hidden tiebreakers and Cities: Skylines' unlabelled day/night sliders. The linked-slider dead-end pattern (one handle at its cap locks the other) is a second candidate worth checking in the code.
- Factorio's solution fits a three-way compute split: show demand versus supply for each use, and show what happens to a use (slows to 60%) when it is short, instead of only a bar.
- Victoria 3's repeated fix type ("explain why something is blocked", "show what blocked a play") is the direct answer to "I couldn't find a way to free compute": when a training run cannot start, state the shortfall and offer the action that fixes it.
- Priority systems that offer a 1 to 9 scale decay as players push everything to the top (ONI); fewer coarse positions (the prototype's two-handle bar) are better only if the remainder is shown and reachable.

### Gaps
- No developer post found for Cities: Skylines, Game Dev Tycoon or ONI saying the allocation UI was redesigned because players found it confusing; only the ONI 2018 note on priority links.
- Mad Games Tycoon, Software Inc., Stellaris jobs, Frostpunk worker UI (beyond a 403-blocked review), and a user-research source on dual-handle allocation bars were not found.
- Hodent's book was not accessible; no feedback or cognitive-load guidance from her was obtained.
- The lock icon on Master of Orion sliders is unconfirmed.

---

## 4. The single most useful lesson for a 20-minute real-time run with about 30 rounds

### Takeaway
Make every constraint a number the player can see before they hit it, with the fix one click away: OTC turned its endgame into a readable shares countdown and priced everything in one shared number; Factorio shows satisfaction and slows machines proportionally; Victoria 3 added "why is this blocked" tooltips. For the compute pool that means a visible "Free" amount at all times and an immediate way to free it.

### Cited Findings
- OTC: the late change that made "remaining stock a visible countdown" was made because players asked how close rivals were to a buyout, and it made three-player games and the endgame "tense and readable" — [Designer Notes #17](https://www.designer-notes.com/otc-designer-notes-17-stock-market/).
- OTC matches are about 20 minutes and rely on a single shared price displayed prominently — [Shacknews preview](https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space).
- Factorio shows the shortfall as a satisfaction bar and proportional slowdown — [Factorio wiki](https://wiki.factorio.com/Electric_system).
- Victoria 3 fixed "what blocked it" visibility — [Dev Diary #74](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-74-ux-improvements).
- ONI: the developers called the old priority system "hard to understand" and simplified it — [ONI wiki: OC-253538](https://oxygennotincluded.wiki.gg/wiki/Versions/OC-253538).

### Inferences
- Suggested rules for Game Night AI Lab (all inferences from the above, not tested): (1) always show "Free: N" next to the bar and color the segments by use; (2) when a training run cannot start, say "needs N more; take it from serving (-X users) or safety" with a button; (3) never let a handle's cap lock the other handle; (4) rival moves should show up in the same visible prices or deals; (5) each timed deal shows time left in game units and stops with the clock; (6) a number counting down the endgame.
- To test the suspected cause, a short playtest of the current build with "Free" hidden versus shown would settle it.

### Gaps
- No evidence was found on how many decisions per minute players find comfortable in a pausable-real-time management game; OTC's 20-minute match and rapid buy-or-sell cadence is the only data point, and the extract gives no decisions-per-minute number.

---

## Coverage statement

**Opened and read by the fetch tool (extract of whole page returned):** designer-notes.com OTC #2, #12, #13, #17; Matchstick Eyes Johnson interview; Shacknews OTC preview; OpenTTD wiki Subsidy; EVE University wiki Contracts; Stellaris wiki Trade; Factorio wiki Electric system; ONI wiki Priority and OC-253538 version page; Anno Union devblog "Your own trading empire"; PCGamesN Anno 1800 review; Victoria 3 Dev Diary #74; Wikipedia Master of Orion; Game Developer Hodent podcast page.

**Opened but only partly shown:** RimWorld wiki Trade (last 15,032 of 115,032 characters not read); Steam OTC buyouts thread (15 of 49 comments); Steam ONI priority thread (15 of 17 comments); Steam Game Dev Tycoon sliders thread and Cities: Skylines thread (single threads, extracts only).

**Could not reach (HTTP error):** wiki.hoodedhorse.com Against the Storm pages Trading, Trader and Orders (403); Checkpoint Gaming Frostpunk review (403); Game Dev Tycoon Fandom contracts page (402). Everything attributed to those pages comes from search-engine summaries and carries a warning sign above.

**Seen only as search-engine summaries (not opened):** Anno 1800 Fandom / Steam trader pages; OpenTTD source docs (12-month offer length); Victoria 3 Dev Diary #5 and Steam threads; Frostpunk 2 Steam thread; linked-slider developer forums; Game Dev Tycoon wiki; Quarter to Three OTC thread; Stardock buyouts thread.

**Not researched or no results:** Rise of Industry / Capitalism Lab contracts; Railway Empire; X4 Foundations; Prison Architect; Slay the Spire / FTL shops; Startup Company contracts; Two Point Hospital; Mad Games Tycoon; Software Inc. allocation; Stellaris jobs; Cities: Skylines developer commentary; The Gamer's Brain (book).

**Contact fields:** no email address was put in any request, URL or API field.
