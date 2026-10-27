# How tycoon games make rival-company competition felt (Offworld, Railway Empire 1 and 2, Railroad Tycoon 3 / Sid Meier's Railroads, Airline Tycoon 2, Airline Club, Transport Fever 2)

Written 2026-10-26. Provenance: raw research notes, not yet adjudicated. Fetches were made with a summarizing fetch tool (it returns a small model's digest of the page, not the raw page text), so "read in full" below means "the tool reported the page complete and untruncated", not "I saw every character". Pages that came back cut off, comment-less, or search-snippet-only carry a ⚠️ on the claim.

Headline finding for the designer: the best-documented rival tools in this set are Offworld's, and they work through three ideas that fit a "no dice, seeded and visible schedule" rule: (1) a rival action is announced to everyone by a public price change, (2) the target can pre-empt it by paying for protection that also reveals the attacker, (3) the designer removed dice from a sabotage item after players called it streaky. The two Railway Empire games and Railroad Tycoon 3 show the opposite lesson: rival AI that is simply "present" (building track, holding shares) is described by players as easy, messy, or ignorable. No game in this set was found to run real airport-slot or contract bidding against rivals (see Airline section).

---

## 1. Offworld Trading Company (Mohawk Games, 2016; rivalry tools only)

### Takeaway
Rivalry is made of two layers: a stock-market buyout race (the win condition) and a black market of sabotage items. The black market's design is unusually well documented by Soren Johnson himself: rising global prices double as a warning bell, hidden buyers create paranoia, and a counter item (Goon Squad) was added because players had no defense.

### What is scarce and how the winner is decided
- The win condition is to hold a majority of every other company's stock; losing majority control of your own company (or a very expensive hostile takeover) eliminates you. — [Wikipedia: Offworld Trading Company](https://en.wikipedia.org/wiki/Offworld_Trading_Company) (community-written; flag)
- Owning at least half of your own stock protects you from an easy buyout; hostile takeover of every other company in the area is the win condition; a match is about 20 minutes. — [Shacknews, "Taking Stock in Space"](https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space) (2016 preview, read complete per fetch tool)
- Claims (buildable tiles) are also scarce. A Bribe Claim adds one claim for $4K (an HQ upgrade for $8K gives three claims), and Auction Tile lets a player sell a tile, with its building, to the highest bidder; buyers can overbid with debt. The cash goes to the seller (or to the bank for neutral tiles). — [Designer Notes #14](https://www.designer-notes.com/otc-designer-notes-14-black-market-part-ii/)
- Winner of a black-market purchase is simply whoever can pay the current price; there is no first-come queue. A lockout timer follows each purchase so nobody can chain-sabotage with all their cash, and owning several black-market buildings shortens the gap. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i)

### How the player sees what a rival is about to do or has done (telegraphing)
- The game warns you when a rival has enough money to buy you out; the rival is not told that you got the warning. Wikipedia says this produces "tense, desperate races to earn money". — [Wikipedia](https://en.wikipedia.org/wiki/Offworld_Trading_Company)
- Every black-market purchase raises that item's price for everyone; the raised price is visible, so every player learns that someone just bought, say, a Mutiny, and can guess the target. That prompts defensive buys (a Goon Squad on a Geothermal Plant), which raise the Goon Squad price in turn. Johnson calls this out as information. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i)
- Who bought is hidden: a victim sees that something happened but not who did it. Johnson calls the resulting paranoia and wrong accusations a memorable part of play; "crude diplomacy" (naming whom others should hit) emerged. Masquerade mode hides identities until a player is eliminated or wins. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i)
- Goon Squad (the defense): when it catches a sabotage it reveals the attacker, returns that item to the defender (to encourage revenge), and the protected tile is revealed permanently once triggered. Buying a Goon Squad also raises its price, which tells opponents one exists. — [Designer Notes #15](https://www.designer-notes.com/page/13) (listing page; the Part III text was present, read per fetch tool)
- Spy reveals hidden Goon Squads, activity inside advanced buildings, and building stockpiles; Hologram hides structures. The designer made Hologram, Spy and Auction Tile "Advanced Sabotage", off by default in single-player, because guessing hidden placements would either be weak or look like cheating for the AI. Information-only items (Spy, Hologram) had their cooldowns removed; Auction Tile kept one after a player used it to stall a game. — [Designer Notes #14](https://www.designer-notes.com/otc-designer-notes-14-black-market-part-ii/); also [Shacknews](https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space) (single-player AI cannot use Hologram or Spy)

### What the player can do against a rival, and what it costs
- Buy a rival's stock toward a buyout (cost is market-driven; no formula found, ⚠️ Shacknews says it gives "no buyout costs, no share price formulas").
- Black-market items: original six were Bribe Claim, EMP, Power Surge, Stasis Field, Mutiny, Underground Nuke; early-access launch had seven (Bribe Claim, EMP, Power Surge, Underground Nuke, Mutiny, Dynamite, Pirates); twelve more were added later and each game now draws about seven at random before play. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i)
- Effects (selection): Dynamite destroys a building and the owner pays half the build cost to repair; Mutiny seizes a building for a time; Underground Nuke is the only permanent damage (players often wait for someone else to strike first; tiles fall to Trace levels, not zero); Pirates steal from freighters until 100 total is taken; Magnetic Storm destroys all freighters in a large radius; EMP shuts buildings down within a radius, weakening with distance. — [Designer Notes #14](https://www.designer-notes.com/otc-designer-notes-14-black-market-part-ii/) and [#15](https://www.designer-notes.com/page/13)
- Cost control: the price of an item rises for everyone after any purchase, by less than a doubling, scaled by player count, and slightly more for the buyer; Johnson says sabotage "eventually became too expensive to be worth it" when overused. The team's stated fear was that players would drain economies into attacking each other. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i)
- Specific dollar prices of items other than Bribe Claim ($4K) and the HQ upgrade ($8K) were not stated in the notes I read.

### How the game keeps rivals fair and readable (developer statements)
- Removed dice: Pirates originally used a 50% roll per shot, which felt streaky; the final version always hits but takes half the cargo. Goon Squads no longer randomly kill Power Surges (players called it a "bad bounce"). Design goals listed in Part III: avoid randomness after a player's choice, avoid options that are always worse, cap items that can end a game outright, reveal information permanently to reduce memory load. — [Designer Notes #14](https://www.designer-notes.com/otc-designer-notes-14-black-market-part-ii/); [#15](https://www.designer-notes.com/page/13)
- Core Sample odds depend on terrain and are shown in the tooltip "for transparency". — [Designer Notes #15](https://www.designer-notes.com/page/13)
- Randomised pool, but with guarantees: a pure random draw from the item deck made the game chaotic, so every game always includes an EMP or Power Surge, a Dynamite or Mutiny, Pirates or Magnetic Storms, and Goon Squads whenever at least two items that trigger them are present. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i)
- Goon Squad was added "after months of play" because players had no real defense. — [Designer Notes #13](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i)
- Black market can be switched off in a custom game for players who want less competition; Johnson describes the game as "a competitive RTS at the core" with no combat. — [Matchstick Eyes interview, 2014](https://matchstickeyes.com/2014/10/01/offworld-trading-company-interview-with-soren-johnson) (pre-release; final game may differ)
- On AI buyout behavior: Johnson posted on 2016-01-19 that, watching Daily Challenge replays, the AI was "doing a pretty poor job of defending itself from majority buyouts"; he changed the AI logic "some" and asked players to test. — [Stardock forum, "New next-version"](https://www.stardock.com/games/article/474785/new-next-version) ⚠️ only the opening post was captured; the page lists 9 comments that were not shown, so what changed and how players reacted is unknown.
- Player-facing complaint example: a player replaced by an AI after a disconnect found that AI bought out the poster's company, and the poster could not buy their own stock back; asked "bug or intended?" — [Stardock forum thread](https://www.stardock.com/games/article/461932/buyout-ai-bugged) ⚠️ only the opening post was captured; 2 replies not shown, so no answer found.
- ⚠️ Snippet-only (search result, pages not opened): a Quarter to Three thread has players saying the AI buys them out at default difficulty ([thread](https://forum.quartertothree.com/t/offworld-trading-company-from-mohawk-games/74837?page=22)), and a Steam thread argues the AI does not cheat but says the issue is inconclusive without a replay ([thread](https://steamcommunity.com/app/271240/discussions/0/1679189548056399798)). Treat both as unverified.

### Screen
The in-match HUD: a left panel of resource rows (stock, price, trend), top bar with cash and debt, a right panel of market prices with buy/sell buttons, and a bottom-right row of black-market item icons, with an event/chat log at bottom. Before a match, an "Expansion Opportunities" screen lists the competing companies with a stock-price column on a planet map. (Reading of screenshots below; ⚠️ screenshot detail is from a low-resolution view, so exact element names are my reading, not official labels.)

Screenshots (Steam store page: https://store.steampowered.com/app/271240/Offworld_Trading_Company/ ; not downloaded; viewed through the browser pane):
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271240/ss_4abb55fcbca515790d0a12e71510b3426ef6d2da.1920x1080.jpg : a blue shockwave ring over a cluster of buildings (an EMP-style effect) with the left resource panel, top cash readout, right-hand price panel and bottom-right ability icons all visible.
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271240/ss_fdb1d1301e763bd7cdbed153a2e83a2801bbdc67.1920x1080.jpg : full match HUD with rocket launch, a running text log at bottom, colored per-company rows in the right panel, and the icon row at bottom right.
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271240/ss_5aeb9171396080d02276a67b3566400aa08cfd09.1920x1080.jpg : "Expansion Opportunities" pre-match screen: planet with franchise sites, and a small list of companies with a stock price next to each.

### Inferences
- The public price bump is the cheapest telegraph in the set: it needs no panel, only a number everyone already watches. For Game Night, a visible "pressure" number on a supplier's deal card that rises when a rival buys would work the same way and needs no dice.
- A counter that both blocks and reveals the culprit (Goon Squad) turns a hidden threat into a decision, which is more readable than a banner.
- Johnson's removal of the 50% dice in Pirates is direct precedent for the owner's no-dice rule.

### Gaps
- The GDC 2017 talk ("Offworld Trading Company: An RTS Without Guns") was found only as an announcement page ([designer-notes.com](https://designer-notes.com/offworld-trading-company-gdc-postmortem)); that page contains no talk content, and the GDC Vault pages were not opened. ⚠️ I have no statement from the talk about rival design.
- No primary source found on the AI's buyout decision rules or on how a buyout's cost is computed.
- Designer Notes #13 to #15 are excerpts; Johnson's full notes are in the Game Almanac free DLC (per the fetch digest of #14), not read.

---

## 2. Railway Empire (2018) and Railway Empire 2 (2023; Gaming Minds / Kalypso)

### Takeaway
Rivals are present as AI companies that lay track, build stations near yours, hold shares you can buy, and can be sabotaged; but players in 2019-2023 threads describe the AI as messy, easy, and a "money sink" rather than a real racer. No official dev diary on rival-AI design was found.

### What is scarce and how the winner is decided
- Official copy for Railway Empire 1: compete with up to three rival companies, sabotage them with bandits and spies ("raids and industrial espionage"). — [Steam: Railway Empire](https://store.steampowered.com/app/503940/Railway_Empire/) (store text only; no mention of shares or takeovers there, so ⚠️ absence is not evidence of absence)
- Railway Empire 2's Steam copy says only "outsmart your competitors" and mentions neither sabotage, shares nor takeovers. — [Steam: Railway Empire 2](https://store.steampowered.com/app/1644320/Railway_Empire_2/) (marketing text, fetch tool judged complete)
- City station slots: a RE1 player says cities are limited to two stations, so a player can block competitors by taking those slots early and can add a second station in border towns or claim rural station and warehouse sites so the AI wastes money on bridges and tunnels. — [Steam thread "Competitors rail connections"](https://steamcommunity.com/app/503940/discussions/0/1640919737479133376) (player claims, RE1; all 5 posts shown)
- Winner is first to build / who can afford it; there is no auction mechanic documented for rival bidding. A RE2 player says the AI "rarely or never bids on industries", which implies industries are bought by bidding or purchase, but the thread does not explain the mechanic. — [Steam thread "true spiritual successor of RRT2/3"](https://steamcommunity.com/app/1644320/discussions/1/3810657811760998526) (single player's claim, RE2)
- ⚠️ Snippet-only: a Plugged In review says rival firms race to lay track and claim territory, so players work "against the clock" ([review](https://www.pluggedin.com/?p=29198)); Family Gaming Database says rivals appear after the first few scenarios and build stations near yours to steal customers ([page](https://www.familygamingdatabase.com/game/Railway+Empire+2)). I did not open either page, so these are second-hand search extracts.

### How the player sees what a rival is about to do or has done
- ⚠️ No source found describing rival-intent telegraphs (ticker, warnings before a rival claims a city) in either game. Player threads describe the result (rival track and stations tangled with yours) rather than a notification. See Gaps.

### What the player can do and what it costs
- Buy shares in a rival: through Company, then Competitors; each purchase raises the marginal share price; a compiled guide quoted in the thread gives about 150% of company value for buying everything at once (the poster's test: 160%); Merge buys the rest with a 10% premium; 100% ownership is needed to merge or liquidate; after merging you can demolish or take over the infrastructure, or let the company run and send you profits. — [Steam thread, RE1 shares](https://steamcommunity.com/app/503940/discussions/0/3799284366977733496) (all 9 posts shown; RE1, player guide, not official)
- Advanced Options has a "Mergers" setting; a player says it exists so the AI never buys out the human even when it owns all their shares. — same thread (one player's claim)
- RE2: a 1% share was estimated at over $155k; the share option is locked early in the campaign and some players report it missing even with money (a bug on one optional mission, per replies). — [Steam thread "Trading company shares currently not possible"](https://steamcommunity.com/app/1644320/discussions/1/3843305417840722946) ⚠️ page said "1-15 of 16 comments" and one comment was not captured.
- RE2 sabotage: hire a saboteur from the personnel screen; spending more speeds hiring and raises skill; takes at least 50 days before it can be deployed; targets are tracks/trains/stations (delays), rural businesses or factories (halts production), or a competitor's headquarters (steals research). — [Magic Game World guide](https://www.magicgameworld.com/?p=128167) (third-party review site; the fetch tool noted the page "may be incomplete"; no costs, detection chances or defenses given)

### Fairness and readability: what players said
- RE1: competitor track building is "pretty terrible"; you can outgrow rivals in a couple of in-game years then buy them out and replace their track; merging with an AI is "really awful" because you cannot cleanly connect networks, so one player sells off the AI's assets and builds fresh. Players asked for shared networks with fees per passing train (as in Railroad Tycoon 3) and a "much better AI competition". No developer response in the thread. — [Steam thread](https://steamcommunity.com/app/503940/discussions/0/1640919737479133376)
- RE2: "Does anyone actually find the AI challenging?" Replies: the AI is a challenge for the first 3-4 years; it never upgrades its trains so separate freight and express trains win; after that it is a money sink (buying its shares, costly mergers) and a distraction for sabotage; one calls the AI the weakest part of the game; one dislikes its sabotage and blackmail mechanics; another quit around year 10 after beating every rival. — [Steam thread](https://steamcommunity.com/app/1644320/discussions/1/7187237851765602048) (all 4 posts shown; small sample)
- One RE2 poster praised the AI competitors for creating "competition and urgency". — [Steam thread](https://steamcommunity.com/app/1644320/discussions/1/3810657811760998526)

### Screen
The company screen (shares per competitor with arrows, merge button) and the personnel screen (hire saboteur) are described in threads only. ⚠️ No official image of either was found.

Screenshots (Steam pages: https://store.steampowered.com/app/503940/Railway_Empire/ and https://store.steampowered.com/app/1644320/Railway_Empire_2/). I viewed all of them; none shows a rival, shares or sabotage screen. The closest:
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/503940/ss_495b38a9e53a576544236fb27011653acbc31a2c.1920x1080.jpg : map view with a list of train lines on the left (for example "Baltimore - Syracuse") and a city panel with goods and tariffs on the right. Shows line management, not rivals.
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/503940/ss_6529dbc6972af1bdabda616da33c5ef653f3e3eb.1920x1080.jpg : strategic map with track lines over terrain (a territory overview; where rival track would show).
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1644320/ss_725e0a5c99830091fc3fb14284c59e0f839b0386.1920x1080.jpg : locomotive customization with a stats card (price, speed, reliability). Not rival-related. The other RE2 store images are scenic train views; one (the third in list order, ss_3d148bd6a07e7e04041406d61f9da30194a96064) failed to load for me.

### Inferences
- Both threads suggest that a rival who is only a passive "other builder" reads as clutter, not rivalry; the pressure players liked was time pressure ("urgency").
- Share purchase with a rising marginal price and a premium to finish a buyout is a concrete cost curve that could be borrowed for a compute-supplier "equity" or "reserve" mechanic.

### Gaps
- No Kalypso / Gaming Minds dev diary, GDC talk or developer interview on rival AI found (search returned only the first game's store pages and player threads). ⚠️
- Not found: how rival companies pick which city to connect next, whether the player is warned, or what the sabotage cost is.
- Search-snippet-only items above remain unverified.

---

## 3. Railroad Tycoon 3 (PopTop, 2003) and Sid Meier's Railroads! (Firaxis, 2006)

### Takeaway
Both games make the rival a financial predator: you start owning part of your own company, rivals can buy your shares, and you win by buying them out. RT3's player-thread evidence also says AI placement is random and can take your best connections. I found no evidence of formal "cargo contracts" in either game (they use supply/demand and price differences), so that part of the brief is not confirmed.

### What is scarce and how the winner is decided
- SMR: every railroad, including yours, has stock on the public market; you start with 50% of yours; you can sell in 10% increments when short of cash but unsold shares give rivals more chances to buy you out; buy all of a competitor's stock and you own it; if rivals buy all of yours you are out of business. — [Shacknews SMR preview](https://shacknews.com/article/44281/sid-meiers-railroads-preview) (read per fetch tool; no designer quotes in it)
- SMR: technology is sold at auction; the winner gets a 10-year patent, then it becomes public. The writer says bidding can get "quite ludicrous" and passing can mean missing an advantage for ten years. — same source
- SMR cargo: no formal contracts; cities have supplies and demands shown on hover, and you can build up to three industries per city to create demand. — same source
- RT3: cargo moves on its own along a price gradient; revenue depends on the price gap between pickup and delivery; players can buy industries or build processing plants anywhere. — [Wikipedia: Railroad Tycoon 3](https://en.wikipedia.org/wiki/Railroad_Tycoon_3) (community-written; ⚠️ the fetched text says the article says nothing about the stock market or AI rivals, and parts looked abbreviated)
- RT3 rival competition for location: AI placement is random and can take your best connections; scenarios are time-limited because of a tipping point around year 10; a common approach is buy businesses first, then expand rail and buy out AI rivals. — [Steam group thread "Railroad Tycoon 3 - greatest tycoon game"](https://steamcommunity.com/groups/explorminate/discussions/7/3010053344574436550) (player opinion, 8 comments, all shown)
- RT3 shared track: a RE1 player (not an RT3 source) says in RT3 you can use rival track and stations for a rental fee with no congestion from rival traffic. — [Steam RE1 thread](https://steamcommunity.com/app/503940/discussions/0/1640919737479133376)
- ⚠️ Snippet-only: RT3's stock market is advertised with margin buying, short selling, hostile takeovers and mergers (search extract of a third-party profile; the Steam page at https://store.steampowered.com/app/7610 was not opened for text). ⚠️ Also snippet-only: the 1990 original's manual says a Jay Gould-style rival raids your stock; a search summary says rivals drive up auction prices. I could not tell which result page held the auction claim, so I do not rely on it.

### How the player sees what a rival is about to do
- ⚠️ No source found on warnings before a stock raid or a rival claiming a connection in either game. I found no developer interview on RT3 or SMR rival AI. SMR's rivals are described by Steam copy only as "all-out corporate warfare against rival tycoons, slick entrepreneurs, and robber barons". — [Steam: SMR](https://store.steampowered.com/app/7600/Sid_Meiers_Railroads/) (marketing; says nothing about stock or contracts)

### What the player can do and what it costs
- Buy a rival's stock (up to all of it); sell your own stock for cash at a takeover risk (10% steps); bid at technology auctions (cost is the bid). No numbers beyond those found.

### Fairness and readability
- RT3 players call AI rivals "competent" for locations; the same thread says the early game is hard to start and mistakes slowly lead to bankruptcy. — [Steam group thread](https://steamcommunity.com/groups/explorminate/discussions/7/3010053344574436550)
- ⚠️ GamesRadar's SMR review page 2 returned only its title, so no reviewer evaluation of the rivals was read.

### Screen
Not located: no official screenshot of an SMR/RT3 stock or rival screen. Steam store images I viewed (RT3 app 7610: https://store.steampowered.com/app/7610/ ; SMR app 7600: https://store.steampowered.com/app/7600/Sid_Meiers_Railroads/) show only the map view and a small bottom-left control panel:
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/7610/0000001802.1920x1080.jpg (⚠️ filename read from a low-resolution view; verify): city view with the bottom-left control panel with a minimap and building buttons.
- https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/7610/0000001803.1920x1080.jpg (⚠️ same): the control panel with a list of three green rows (likely trains or stations; I could not confirm).
- SMR store images (0000001761 to 0000001766, ⚠️ filenames read from a low-resolution view) are scenic train and bridge views, two with a small minimap corner; none shows stock or auction screens.

### Inferences
- The "own 50% of yourself, rivals can buy the rest" structure makes the rival's threat visible as a number you can defend; it is comparable to Offworld's majority-stake rule.
- Technology auctions with a 10-year patent are the one "winner-takes-scarce-supply" mechanic described here; its flaw (bids get ludicrous) is a warning about uncapped bidding.

### Gaps
- Contracts: no source found in either game. Stock-market thresholds and AI buying rules for SMR/RT3: not found. Developer statements: none found.

---

## 4. Airline and transport tycoons (slot or contract competition: what I could and could not confirm)

### Takeaway
I could not confirm real airport-slot or contract bidding against rivals in any game I checked. What I did find: Airline Tycoon 2 has a share-trading and hostile-takeover system (free play only) plus sabotage; Airline Club has competitor data panels and airport-loyalty competition but its page does not describe slots; Transport Fever 2 is single-player with no AI competitor companies, which makes it a contrast case.

### Airline Tycoon 2 (Steam app 201490)
- Rivals and sabotage: opponents are "crafty", and sabotage slows them down, though they may retaliate. Steam copy does not explain how rivals compete for routes, gates or flights. — [Steam: Airline Tycoon 2](https://store.steampowered.com/app/201490)
- Share trading (Steam update notes): sell shares of your airline at a high price, invest in profitable competitors, or force a rival out through a hostile takeover; trading is done at the airport bank's banker or the office laptop, which shows company values, share distribution and projections; shareholders get dividends in proportion to daily profit; trading exists only in free play. A "Bad Bank" buys shares from Tycoons and offers them to all; with at least 75% of an enemy airline a player can dissolve it and either sell its planes and fire staff or add its planes to their fleet. The notes also say computer opponents now use larger planes when possible, manage credit better and organize personnel more skillfully. The notes mention no notification of rival actions. — [Steam news: Airline Tycoon 2 Updated](https://store.steampowered.com/news/7102/) (read in full per fetch tool)
- Original Airline Tycoon: you compete with three rival CEOs (named characters) at the same airport; sabotage exists; Evolution added five. ⚠️ Wikipedia's page says nothing about gates, travel agency, auctions or how rivals are controlled. — [Wikipedia: Airline Tycoon](https://en.wikipedia.org/wiki/Airline_Tycoon) (community-written)
- ⚠️ Snippet-only: Steam reviews were "mostly negative" (381 reviews) on one language snapshot. Not verified.
- Screenshots (Steam page https://store.steampowered.com/app/201490):
  - https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/201490/ss_3e40eba1bcf9e08b7b60580dab41044048808b19.1920x1080.jpg : a boardroom with four cartoon airline CEOs seated at a table facing a wall chart, the closest thing to a "rivals together" screen.
  - https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/201490/ss_a16c6bf607d60108c276de35d1fbf6bc10cee4d4.1920x1080.jpg : a globe/map of Africa and the Middle East with route lines between airports.
  Neither shows the share-trading or sabotage UI.

### Airline Club (airline-club.com, a browser multiplayer airline game)
- Competition is for passengers through airport loyalty (affected by loyalists, national or partnered airline status, and temporary event or negotiation boosts); route planning shows direct competitors' price, capacity, frequency, quality and load factor; route and country relations use negotiations with delegates; base office staff and frequency caps limit flights per base. A "Rivals" section has a Direct Competitions panel (month/quarter toggle), rankings, competitor flights on airport pages, and ticket price and capacity history. — [Airline Club home page](https://www.airline-club.com/) ⚠️ the fetched page was a UI dump with blank values and loading spinners, a truncated reputation list, and no text describing slots; it does not say whether other airlines are AI or human.
- A forum post about Airline Club saying AI airlines take over half of a Palermo airport's slots could not be read (HTTP 403 on [airlineclub.createaforum.com](https://airlineclub.createaforum.com/under-development-wish-list-suggestions/ai-airlines-slots-and-mechanics/)); I know it only from a search snippet. ⚠️ I did not read the thread, so I do not know whether it concerns slots as a game mechanic.
- Screenshots: not collected (not a Steam game, no press kit found).

### Transport Fever 2 (contrast)
- Steam copy lists rail, road, water and air networks, a dynamic economy and city simulation, and the page does not mention AI competitor companies or multiplayer. — [Steam: Transport Fever 2](https://store.steampowered.com/app/1066780/Transport_Fever_2/) (store text). Players in the RT3 thread describe TF2 as having no AI opposition and call it a "toy sim" versus RT3's "business sim" (opinion). — [Steam group thread](https://steamcommunity.com/groups/explorminate/discussions/7/3010053344574436550). A RE2 poster also lists TF2 as having no AI competitors. — [Steam RE2 thread](https://steamcommunity.com/app/1644320/discussions/1/7187237851765602048)
- Screenshots: not relevant (no rival screen exists); one store image URL was seen but not viewed: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1066780/ss_2daa5380ff04a3eaa7c835260e295b2ade6b50b0.1920x1080.jpg

### Inferences
- The brief asked for games with real slot or contract bidding. From what I could read, those would have to be sought elsewhere (for example older Airline Tycoon manuals or other airline sims); none of the games here document slot bidding.
- The "Bad Bank" (an extra neutral participant that buys shares and resells to everyone) is a concrete way to model a market-maker that moves a price without a named rival.

### Gaps
- Airline Tycoon 2 rival AI behavior for flights/gates: no source. Original Airline Tycoon travel agency / flight-offer competition: not confirmed by any page I opened.
- Airline Manager (browser) was not researched.

---

## Cross-game inferences for the Game Night compute-deals designer

These are my inferences from the cited findings above, not sourced facts.
1. Telegraph by price, not by banner: Offworld's public price rise after any rival purchase tells every player what happened, who might be targeted, and what counter to buy. A "demand pressure" number on each deal card that visibly climbs on a seeded schedule would do the same job and stay dice-free.
2. Give the player a counter that also reveals the rival: Goon Squad blocks sabotage, reveals the attacker, and gives the item back; players asked for a defense after months of play.
3. A rising cost per rival action keeps rivalry from becoming the whole game: Offworld caps sabotage by raising item prices (less than doubling per buy).
4. A seeded pre-game draw with guaranteed slots (Offworld's item pool rules) keeps a random-looking set readable and fair; Offworld also removed per-shot dice from Pirates.
5. Passive rivals read as clutter: Railway Empire players describe rival track as messy and the AI as a money sink; the part players liked was urgency.
6. Share-style buyouts have a clear cost curve: RE1 buys at a rising marginal price (about 150-160% of company value for a full buyout; merge adds 10%); Offworld and SMR use a majority-stake threshold with a visible defender share (50%).
7. A neutral buyer (Airline Tycoon 2's Bad Bank) can stand in for "the market took it" without naming a rival.

---

## Coverage

Fetch tool note: every "opened" source below was read through a summarizing fetch (a small model's digest of the page), not the raw text. "Complete" means the tool said so.

Opened and reported complete (per the fetch tool):
- https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i (complete)
- https://www.designer-notes.com/otc-designer-notes-14-black-market-part-ii/ (complete, but an excerpt of larger notes; covers Bribe Claim to Power Surge only)
- https://www.designer-notes.com/page/13 (listing page; Part III text present and complete to the Goon Squad section)
- https://designer-notes.com/offworld-trading-company-gdc-postmortem (complete, but it is only a talk announcement with no talk content)
- https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space (complete; no buyout costs)
- https://matchstickeyes.com/2014/10/01/offworld-trading-company-interview-with-soren-johnson (complete; little on rivals)
- https://en.wikipedia.org/wiki/Offworld_Trading_Company (complete for gameplay and reception; no AI section)
- https://shacknews.com/article/44281/sid-meiers-railroads-preview (complete)
- https://steamcommunity.com/app/503940/discussions/0/1640919737479133376 (all 5 posts)
- https://steamcommunity.com/app/503940/discussions/0/3799284366977733496 (all 8 replies plus opener)
- https://steamcommunity.com/app/1644320/discussions/1/3810657811760998526 (opener plus 3 comments)
- https://steamcommunity.com/app/1644320/discussions/1/7187237851765602048 (all 4 posts)
- https://steamcommunity.com/groups/explorminate/discussions/7/3010053344574436550 (all 8 comments)
- https://store.steampowered.com/news/7102/ (Airline Tycoon 2 update notes, share-trading section complete)
- Steam store text pages: https://store.steampowered.com/app/503940/Railway_Empire/, /app/1644320/Railway_Empire_2/, /app/201490, /app/7600/Sid_Meiers_Railroads/, /app/1066780/Transport_Fever_2/ (marketing text; the first four say nothing about shares or contracts or explain rival behavior)
- https://en.wikipedia.org/wiki/Airline_Tycoon (rival mechanics not covered)
- https://www.magicgameworld.com/?p=128167 (short third-party article; the digest said it may be incomplete)
- https://www.airline-club.com/ (UI dump; no values)

Opened but incomplete or truncated (⚠️):
- https://steamcommunity.com/app/1644320/discussions/1/3843305417840722946 (15 of 16 comments shown)
- https://www.stardock.com/games/article/474785/new-next-version (opening post only; 9 comments missing)
- https://www.stardock.com/games/article/461932/buyout-ai-bugged (opening post only; 2 comments missing)
- https://en.wikipedia.org/wiki/Railroad_Tycoon_3 (digest said it had no stock/AI content and the text looked abbreviated)
- https://gamesradar.com/sid-meiers-railroads-review/2 (title only, no review text)

Could not be reached:
- https://airlineclub.createaforum.com/under-development-wish-list-suggestions/ai-airlines-slots-and-mechanics/ (HTTP 403)
- GDC Vault session pages for the Offworld talk (not opened; members-only per search result)

Search-result snippets only (pages not opened; every claim from them is flagged ⚠️ above): Plugged In RE2 review; Family Gaming Database RE2 page; Quarter to Three Offworld thread; Steam Offworld thread 1679189548056399798; Steam RT3 store page text (app 7610) and a third-party RT3 profile; RT3/Railroad Tycoon manual claims; Airline Tycoon 2 Steam review snapshot; Kalypso product pages for Railway Empire 1.

Screenshots: viewed through the browser pane via a local contact sheet that hot-linked the Steam image URLs (nothing was saved as an image file). URLs were taken from each store page's HTML. Offworld, Railway Empire 1 and 2, and Airline Tycoon 2 images were all viewed; RT3 and SMR images were viewed at low resolution, and their filenames carry a ⚠️.

Not found anywhere: Kalypso or Gaming Minds developer diaries on rival AI; any developer interview on Railroad Tycoon 3 or Sid Meier's Railroads rival AI; any confirmed airport-slot or contract-bidding system against rivals; any official screenshot of a rival, stock or sabotage screen for the railway games or Airline Tycoon 2.
