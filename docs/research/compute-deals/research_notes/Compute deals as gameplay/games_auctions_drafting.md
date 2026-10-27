# Tabletop mechanics for acquiring a scarce shared resource: auctions, bidding, and drafting from a shared market

Scope note for the report writer. Two things shape how much weight each citation carries:

- **Power Grid Deluxe** is the one rulebook I read as raw text. The official Rio Grande PDF came back from WebFetch as binary, so I saved it and ran `pdftotext` on it. I then read the setup, Phase 1, 2, 3 and 5 sections directly (see the coverage statement for exactly which line ranges).
- **Every other "rulebook" citation** is a RulesPal transcription (rulespal.com, a third-party site that reproduces rules text) or an UltraBoardGames page, passed through WebFetch. WebFetch runs the page through a small summarising model. So "read in full" below means "the tool reported seeing the whole page", not that I saw the raw text. These are good enough for rule facts, but they are not publisher PDFs.
- **Corrections to the earlier file** (`docs/research/compute-mechanics/notes/procurement_game_mechanics.md`) are marked "CORRECTION" where I found them.

---

## 1. Auctions and bidding: which forms exist, what makes each work, and which resolve fast enough for real time

### Takeaway
The auction forms that resolve fast are the ones that cap each player at ONE decision per auction: once-around bidding (Ra, Medici, Modern Art's "one offer"), sealed simultaneous bids (Modern Art "hidden", For Sale phase 2), fixed-price take-it-or-leave-it (Modern Art), and bid-or-pass with a cheap exit (For Sale, High Society). What makes the best ones work is not the bidding itself but a **built-in cost or consolation on the exit**: High Society and For Sale let you leave with something, Ra makes the caller go last and sometimes forces them to bid, Modern Art forces the auctioneer to buy their own fixed price if nobody takes it. Ascending open English bidding (Power Grid's plant auction, Modern Art "open") is the slowest form and the least suited to a real-time game against bots.

### Cited Findings

**Power Grid (Friedemann Friese, 2004), plant auction. Source: official Rio Grande Deluxe rulebook, read as raw text via pdftotext.**
- Only the four plants in the "current market" can be auctioned. The four "future market" plants are visible but cannot be bid on. When a plant is bought, a replacement is drawn and the whole market is re-sorted ascending. — [Power Grid Deluxe rules (Rio Grande)](https://www.riograndegames.com/wp-content/uploads/2014/08/Power-Grid-Deluxe-Rules.pdf)
- The plant's printed number is the minimum bid. The starter may open higher. Bidding goes clockwise, each player raises or passes, and a player who passes cannot re-enter that auction. The last player left pays their highest bid to the bank and takes the plant. — same source
- Each player may buy at most one plant per round. Once you have bought one you cannot bid in or start another auction that round. If you do not want to start an auction you must opt out of the whole phase, and then you cannot bid in later auctions either. In round 1 nobody may opt out. — same source
- "The last player to start an auction in a round pays the minimum bid" for the plant they choose. — same source
- In the North America version, a discount token sits on the smallest plant in the current market at the start of Phase 2, cutting its minimum bid to 1 Elektro. If nobody buys it, it is removed from the game at the end of Phase 2. In the Europe version, if every player opts out, the lowest current-market plant is removed. — same source
- Any plant in the current market whose number is equal to or lower than the city count of ANY player is removed immediately and replaced. — same source
- A player may own at most 3 plants; buying a fourth forces scrapping one. — same source

**Power Grid, resource market (same rulebook).**
- Each resource has a price track. Players buy tokens at the printed price of the space the token sits on. Phase 3 is played in REVERSE player order (last player first). If a resource type runs out, nothing more of it can be bought until the next refill. — [Power Grid Deluxe rules](https://www.riograndegames.com/wp-content/uploads/2014/08/Power-Grid-Deluxe-Rules.pdf)
- Refill happens in Phase 5. The refill summary card gives a fixed amount per resource, by player count and game Step. "Starting with the highest (most expensive) space, place resource tokens on the empty symbols" until that amount is placed. If the supply runs short, the resource is not fully refilled. — same source
- The rulebook's own worked example: with 5 players in Step 1, 10 coal, 2 natural gas and 1 oil were bought in round one. After the refill, "the price for coal is higher at the end of the first round" (cheapest coal now 3), while natural gas, oil and uranium are cheaper. — same source
- CORRECTION to the earlier file: it said the "restock from the most expensive empty slots downward" rule was only snippet-sourced and its BGG source returned 403. The official rulebook text confirms the rule directly. The earlier file's "buy from cheapest open slot" is also confirmed (tokens bought are paid at the space price; the cheapest are on the bottom spaces). The rule that the refill amount is a FIXED number per round, not a replacement of what was bought, is what makes prices ratchet: buy more than the refill and the cheap slots are never refilled. This is stated by the worked example above; the general "ratchet" framing is my inference.

**Power Grid, designer intent.**
- Friese borrowed the resource market from older games (McMulti, Playboss). Playtesting tuned the replenishment rates. He wanted turn order to matter, and his stated approach was "the leading player gets the biggest disadvantage." — [Opinionated Gamers, "Funkenschlag at Fifteen" (Chris Wray interview with Friese)](https://opinionatedgamers.com/2016/07/11/funkenschlag-at-fifteen-the-story-of-power-grid/) (WebFetch reported the whole interview and legacy section seen; the article gives no reasoning for the plant auction itself.)
- A separate secondary search summary says Friese took the building-cost idea from Empire Builder and kept a fluctuating commodities market like Crude: The Oil Game and an auction intensity like The Princes of Florence. — [same article](https://opinionatedgamers.com/2016/07/11/funkenschlag-at-fifteen-the-story-of-power-grid/) ⚠️ this specific lineage claim came from the search-result summary of the page, not from the fetched text, which did not repeat it.

**Ra (Reiner Knizia, 1999). Source: RulesPal transcription of the rulebook (tool reported the whole page, with tables garbled).**
- Three actions per turn: draw a tile, invoke Ra, or spend God tiles to take tiles from the track. After any auction, play continues clockwise from the Ra player. — [RulesPal Ra rulebook](https://rulespal.com/ra/rulebook)
- Draw a tile: if it is a Ra tile, it is discarded, the Sun Boat advances one space, and an auction starts. Otherwise the tile goes into the leftmost open space of the auction track. You may not draw if the track is full. — same source
- Auction: bidding starts with the player to the Ra player's left. Each player bids with a face-up sun disk or passes, ONCE. The first bid can be any value, later bids must be higher, and the auction always ends with the Ra player. — same source
- Three conditions: (a) Ra tile drawn: everyone may pass; if all pass, the track tiles and the disk stay. (b) Invoke Ra with a full track: everyone may pass; if all pass, ALL track tiles are removed from the game. (c) Invoke Ra with a non-full track: everyone else may pass, but if all others pass the Ra player MUST bid. — same source
- Winner takes all track tiles. Other players take back their disks. The winner swaps the winning disk with the disk on the auction board and puts the obtained disk face down on their board (it is spent for the epoch). — same source
- An epoch ends when all disks are face down, or the instant the Sun Boat enters the final Ra-track space, "with no auction". A player with no face-up disks cannot act for the rest of the epoch. — same source
- Disasters (War, Earthquake, Funeral, Drought): when you take one, you discard two of your tiles of the matching type. At the end of Epoch 3, the highest total of sun-disk values gains 5 points and the lowest loses 5. — same source
- A review adds the push-your-luck read: when only one player is left in an auction, others are tempted to keep drawing because the next draw may be a Ra tile, and "holding high tiles isn't always good, since opponents can bid low to force you into taking a high-tile lot." It also recommends Ra for 3 players, maybe 4, and says 5 has "too much chaos and too little control". The review says sun tiles run 1 to 13. — [Theology of Games, "Here Comes the Flood" (Ra review)](https://www.theologyofgames.com/blog/2016/10/8/here-comes-the-flood-a-double-take-review-of-ra) (tool reported the whole page seen); contradicted on disk count by the RulesPal page, which lists 16 sun disks. I could not resolve 13 vs 16.
- The RulesPal page never states the Ra track length or the starting Sun Boat space by player count. Not found in any source I read.

**Modern Art (Knizia, 1992). Source: RulesPal rulebook page (tool reported the whole rulebook seen; it would not reproduce the text verbatim, so wording is the tool's paraphrase).**
- Bids move in $1 thousand steps. The winner pays the Auctioneer (or the bank if the Auctioneer wins their own auction). The Hammer passes left. — [RulesPal Modern Art rulebook](https://rulespal.com/modern-art/rulebook)
- Open: anyone bids aloud in any order until nobody raises. One Offer: clockwise from the Auctioneer's left, each player bids higher once or passes; the Auctioneer goes last. Hidden: all hold a bid in a closed hand and reveal together; ties go to the tied player closest clockwise to the Auctioneer, and the Auctioneer wins if tied. Fixed Price: the Auctioneer names a price (not above their cash) and offers it clockwise; first buyer wins. Double: the Auctioneer may add a second painting by the same artist, and both sell under the second card's type. — same source
- No-sale outcomes: in Open, One Offer and Hidden with no bids the Auctioneer takes the painting free. In Fixed Price, if nobody buys, the Auctioneer MUST buy at their own declared price. — same source
- The round ends when the fifth painting by any one artist is played; that painting is not auctioned. The top three artists by count get value tiles of $30, $20, $10 for the round. Paintings are sold to the bank at the artists' accumulated values and discarded. After round four the richest player wins. — same source
- Corroborating the earlier file: the auction types are keyed to the card, so each sale's format is chosen by the card played, not by the players. — [RulesPal Modern Art rulebook](https://rulespal.com/modern-art/rulebook)

**High Society (Knizia, 1995). Source: RulesPal rulebook page (tool reported the whole rulebook seen).**
- Deck: 16 status cards (10 luxury cards valued 1 to 10, 3 prestige cards, 3 disgrace cards). Each player gets one fixed set of 11 money cards in hand. There is no income. — [RulesPal High Society rulebook](https://rulespal.com/high-society/rulebook)
- On your turn: add one or more face-up money cards so your total beats the current high, or pass. If you had bid, passing returns all your face-up money to your hand and you are out of that round. The last player left takes the card, and all money still face-up on the table is discarded face down. — same source
- Disgrace cards reverse it: the round ends the instant any player passes. That player takes their money back AND the disgrace card. Everyone else discards their face-up money. — same source
- Disgrace effects: Faux Pas discards one of your own luxury cards, Passé is minus 5 status, Scandale halves your status at game end. Prestige cards double status (two cards x4, three cards x8). — same source
- Four status cards (the 3 prestige cards and Scandale) have dark green backgrounds. When the fourth is revealed, the game ends immediately. The player or players with the least money left are "cast out" and cannot win. — same source
- Edition caveat: the Osprey rulebook PDF (`ospreypublishing.com/media/1fohbutt/hisoc_rulebook_for_web.pdf`) failed with a TLS certificate error, so I used the RulesPal text, and the older edition names differ (per a search summary, ⚠️ not fetched).

**For Sale (Stefan Dorra, not Knizia). Source: UltraBoardGames rules page (tool reported the whole rules text seen).**
- Phase 1: reveal as many property cards as there are players. Starting with the player with the biggest house, each player bids (higher than the current bid) or passes, clockwise, until all but one have passed. A player who passes takes the LOWEST property still on the table, takes back HALF his current bid (rounded down) and the rest goes to the bank. A player who never bid can pass for the lowest card free. The last bidder takes the HIGHEST card and pays his full bid. — [UltraBoardGames For Sale rules](https://ultraboardgames.com/for-sale/game-rules.php)
- Phase 2: reveal as many currency cards as there are players. Everyone secretly picks one property card, all reveal at once, the highest property takes the highest currency card, and so on. — same source
- End: richest player wins (currency cards plus unspent coins). The page's own summary: "it isn't how much you pay for the properties, it is how much you sell them for." — same source (this was the tool's rendition of the page's emphasis; I did not see raw text).

**Medici (Knizia, 1995). Source: RulesPal transcription (tool reported whole page seen; some tables did not render).**
- On your turn you flip the top card, then optionally draw up to two more (a group is 1 to 3 cards and cannot be split). Bidding starts left of the selector. Each player gets ONE chance to bid or pass, and the selector always acts last. Highest bid takes the whole group. You cannot bid more than you have (no borrowing). If everyone passes, the group is discarded. — [RulesPal Medici rulebook](https://rulespal.com/medici/rulebook)
- Each ship holds five cards (seven with two players). A full ship takes you out for the rest of the day. You must pass if the group will not fit. The player with the fewest florins starts the next day. — same source
- The Wargamer interview says Knizia's own view (as summarised by the article) is that auctions "create an immediate interaction between the players," but that they can frustrate when one player snowballs or overbidding upsets the balance, so they need a stabilising mechanism "such as the limited cargo slots in Medici". — [Wargamer, Knizia on Medici](https://www.wargamer.com/medici/reiner-knizia-auction-board-games) (tool reported the whole article seen; the "stabilising mechanism" phrasing is the article's summary of Knizia, and the article does not name High Society or For Sale).

**Dutch / descending clock in a board game: Merchants of Amsterdam (Knizia, 2000).**
- The box includes a spring-driven clock that runs the auctions. A player who wants a card starts the clock and slaps down to stop it, paying the price shown at that moment. Each turn the active player draws three cards and removes one from the game, keeps one, or puts one up for auction. 3 to 5 players, about 90 minutes. — [Meeple Mountain, Merchants of Amsterdam](https://www.meeplemountain.com/boardgame/merchants-of-amsterdam/) (tool reported the whole page seen; the article is brief and says nothing about starting price, ties, or how well the clock plays.)
- Generic definition: a Dutch auction is a descending-price, open-outcry or clock auction in which the first bidder who accepts the current price wins. — [EconPort Dutch auction page](https://econport.gsu.edu/content/handbook/auctions/commntypes/dutchauction.html) ⚠️ this URL appeared in a search result only; I did not fetch it.
- Merchants of Andromeda is described as a sci-fi reskin with the same falling-price auctions. — via search result only ⚠️ not fetched.

**Knizia on auctions in his own words.** I found no source where Knizia explains why auctions work in depth. The Opinionated Gamers 2011 interview (tool reported the whole interview seen) has nothing on auctions; it says he "reduces redundancy by condensing the game into a few fundamental core principles" and that playtesting is "the lifeblood". — [Opinionated Gamers, Art of Design interview with Knizia](https://opinionatedgamers.com/2011/04/12/the-art-of-design-interviews-to-game-designers-6-%E2%80%93-reiner-knizia/). Wikipedia and a Meeple Mountain snippet call Modern Art one of his first auction games, starting an auction trilogy (Modern Art, Ra, High Society) — ⚠️ search-result summary only. Wargamer quotes him saying he would not make "another three or four auction games" because repeating himself makes no sense.

### What makes each mechanic work (cause and effect from the rules above)

These are my analysis of the cited rules. Each is "if you remove piece X, what breaks".

- **Power Grid plant auction.** The tension comes from three rules working together: (1) one plant per player per round, (2) you cannot re-enter after passing, and (3) a bidder who drops out of one auction can still start or join a later one. Remove "one plant per round" and the leader buys everything. Remove the visible future market and nobody can plan, because the next plant is a surprise. The "last starter pays the minimum" rule is the floor that guarantees the player order leader cannot starve the trailer. Scaling: one auction per player per round means up to N auctions of several bid steps each, so decision time grows with player count; that is the slowest form here.
- **Power Grid resource market.** Rival demand moves price with no negotiation. The fixed refill is the key: if refill were "replace what was bought", prices would never move and the market would just be a shop. With fixed refill, a heavily bought resource ratchets up. Remove reverse buying order and the leader (who already got first choice of plants) also gets cheapest resources. This is a one-click "buy now at today's price" decision.
- **Ra.** The tension is the track: each tile you draw makes the lot bigger, but any draw can be the Ra tile that forces an auction on terms you did not choose. The "call it yourself" option (invoke Ra) is an escape valve that the rules make costly (you must bid if everyone passes while the track is not full). The one-bid-each rule keeps every auction to N-1 decisions. Disks are both currency and score, and the disk you win with is swapped for the one on the board, so your future buying power is visible to everyone. That visibility is what makes low-balling to force a high-disk holder into a bad lot work (per the review above).
- **Modern Art.** The Auctioneer is both seller and a bidder, and the money goes to the seller. That is what makes bluffing and sandbagging possible. The forced self-purchase on a failed fixed price is what stops the Auctioneer from naming an absurd price. The auction format is dictated by the card, so players cannot always use their preferred format.
- **High Society.** Passing is the interesting move. You recover your money but lose the card, and the last bidder pays everything they put out. Because the money set is fixed (11 cards, no income), every spend is a bet on the whole game. The cast-out rule (poorest cannot win) stops the "spend everything on early cards" strategy. Disgrace cards invert the incentive: the first to blink eats the card. Remove the cast-out rule and the game collapses to "spend everything". The end trigger (4th dark card) hides the game length.
- **For Sale.** Each bid-or-pass has a built-in consolation: leaving gets you the cheapest card plus half your bid back. So the choice is "fight for the top card at full price" versus "escape with a cheap card and keep half". Because there are exactly as many cards as players, nobody goes home empty-handed. Phase 2 is simultaneous and takes seconds.
- **Medici.** Bundle size is the selector's push-your-luck, and the cargo limit is what keeps one player from buying every card.
- **Merchants of Amsterdam clock.** The only real-time-by-design auction I found. I could not verify how well it plays (no source I read evaluates it).

### Inferences (my analysis, not sourced)
- Ranking by speed for a real-time game against bots, fastest first: fixed-price take-it-or-leave-it; sealed simultaneous; once-around with the human last; Dutch clock; bid-or-pass with half-back exit (For Sale); open English. The last is the only one that needs repeated back-and-forth.
- The Power Grid "min bid = printed number, only a few biddable, visible next ones" structure is the part most worth borrowing: it gives rivals clear, legible preferences (the AI "names" a card, as today) without needing any back-and-forth.
- Ra's one-bid-each, caller-last auction is the best fit for "one human and three bots in real time": the human gets exactly one prompt per auction, and the three bots can decide instantly using visible disk (budget) values.
- For Sale's "exit with half your bid and the cheapest card" is a ready-made loser's consolation that would fix the current feel of "rival takes it at the end of the round and you get nothing".

### Gaps
- Knizia's own writing on why auctions work: not found. The only direct quotes are in the Wargamer article (via the article's paraphrase). The Think Like A Game Designer episode 52 page and the Opinionated Gamers/Tabletop Gaming interviews were returned by search, but I fetched only the Opinionated Gamers interview, and it did not discuss auctions.
- Engelstein and Shalev, Building Blocks of Tabletop Game Design (auction chapter): not accessible. A search confirmed Chapter 8 is "Auctions" and one blog review says the authors describe 18 types of auctions (single secondary source, ⚠️ unverified). I could not read the chapter.
- Elias, Garfield, Gutschera, Characteristics of Games: not searched or read.
- Official Ra and Modern Art publisher PDFs: the Rio Grande URLs I guessed returned 404. I relied on RulesPal.
- Ra track length by player count and sun-disk starting values per player count: not found.
- Merchants of Amsterdam: price start, tick rate, and how players react to the clock: not found.
- Power Grid resource refill numbers by player count: the refill tables are graphics in the rulebook and did not survive text extraction.

---

## 2. Drafting from a shared market: what makes "take it now or let it get cheaper while a rival may grab it" work

### Takeaway
The mechanics that produce the "wait or grab" tension all share one structure: the price of an item changes with its position or age, and the change is visible, predictable, and slow enough that a rival could take the item first. Splendor makes waiting free but exposes you to a one-action snipe; Suburbia and Century slide items along a price gradient as others are taken; Through the Ages discards items that sit at the cheap-to-expire end; Power Grid retires plants that fall below the leaders' city count. Remove the visible gradient or the expiry and there is no reason to ever act early.

### Cited Findings

**Splendor (Marc André, 2014). Source: RulesPal rulebook page (tool reported the whole document seen).**
- Four face-up development cards per level (three levels). Each turn, exactly one action: take 3 different gems, take 2 of one color (only if 4 or more remain), reserve one card and take one gold, or buy one card. — [RulesPal Splendor rulebook](https://rulespal.com/splendor/rulebook)
- Reserve: a face-up card or the unseen top of any deck; at most three reserved cards; the only way to get gold; you still reserve if no gold remains. A bought or reserved face-up card is replaced immediately from the same level. Ten-token limit at end of turn. 15 prestige points triggers the end of the round; tie goes to the player who bought the fewest cards. — same source
- A League of Game Makers contributor calls Splendor for two players an example of a game where "an engine-building path locks in early and makes the winner predictable". — [League of Game Makers, "Should games have a catch up mechanic"](https://leagueofgamemakers.com/ask-the-league-should-games-have-a-catch-up-mechanic) (tool reported the whole page seen)

**Century: Spice Road (Emerson Matsuuchi, 2017). Source: RulesPal rulebook page (tool reported the whole page seen).**
- A row of six merchant cards. To acquire one, place one cube from your caravan on EACH card to its left; the leftmost is free. The rulebook text I could read does not say what happens to those cubes afterward. — [RulesPal Century: Spice Road rulebook](https://rulespal.com/century-spice-road/rulebook)
- The caravan holds at most 10 cubes (excess returned at end of your turn). The point-card row works the same way, with gold and silver tokens on the two leftmost cards. — same source
- CORRECTION/GAP: the earlier file said the taker also receives the cubes left on the card as a bonus. This is true to my knowledge of the game, but the RulesPal text I read did not confirm it (it says it does not say what happens to the cubes), so I cannot cite it here. ⚠️

**Suburbia (Ted Alspach, 2012). Sources: RulesPal and UltraBoardGames rules pages (both reported whole page seen).**
- A turn: (1) acquire, (2) income, (3) population, (4) refresh the market. Acquiring a market tile costs the tile's price plus the market space's printed extra cost. — [RulesPal Suburbia rulebook](https://rulespal.com/suburbia/rulebook)
- "A tile is always removed from the market on each turn." If a player takes a basic tile or places an Investment Marker, he must discard a face-up market tile, paying only that space's extra cost. Remaining tiles slide right; a new tile from the current stack (A, then B, then C) enters at the far left. — [RulesPal Suburbia rulebook](https://rulespal.com/suburbia/rulebook); [UltraBoardGames Suburbia rules](https://ultraboardgames.com/suburbia/game-rules.php)
- CORRECTION to the earlier file: it described "the oldest tile is removed each turn". Neither rules page says "oldest". What the rules say is that one tile always leaves the market each turn (the one bought, or one the player chooses to discard), the rest slide, and the new one enters at the end. Price follows position, so a tile gets cheaper as it slides, but the player decides which tile is removed when they take a basic tile. Also, neither page gives the $10 to free price scale; one older-edition player review reportedly puts the new tile at "+$10" and says tiles shift down in price each turn, but that page (steemit mirror) failed to load for me, so I treat the $10 scale as ⚠️ unverified. I also could not confirm direction of the gradient from the pages I read beyond "slide right, new at far left", so "cheaper on the right" is inferred from the review snippet.
- League of Game Makers contributor Peter cites Suburbia's endgame "red lines" (population penalties that bite the leader) as an example of balance built into tiles rather than a bolt-on catch-up. — [League of Game Makers](https://leagueofgamemakers.com/ask-the-league-should-games-have-a-catch-up-mechanic)

**Through the Ages (Vlaada Chvátil, 2006). Source: RulesPal rulebook page (tool reported the whole page seen; it lacks the per-position costs).**
- A 13-card row. Each position costs 1, 2 or 3 civil actions (the text does not say which positions cost what). Before refilling, cards in the leftmost spaces are DISCARDED: three spaces with 2 players, two with 3, one with 4. Then the row slides left and refills from the deck. — [RulesPal Through the Ages rulebook](https://rulespal.com/through-the-ages/rulebook)
- Cards you pass on shift left and are discarded at the next replenish if they end up in the leftmost spaces. Discarded civil cards never re-enter. — same source

**Concordia (Mac Gerdts, 2013). Source: RulesPal rulebook page (tool reported the whole page seen).**
- A card's price is the goods in its red field plus the goods shown beneath its position on the board. The Senator action buys up to two cards at full price. The Consul buys one card paying only the red-field goods, ignoring the position cost. After a purchase, cards shift left and the display is refilled to 7. — [RulesPal Concordia rulebook](https://rulespal.com/concordia/rulebook)
- The page did not mention a "first card free" rule or discard-replacement, so I do not claim them.

**7 Wonders (Antoine Bauza, 2010). Source: RulesPal rulebook page (tool reported the whole document seen).**
- Each Age: deal 7 cards, pick one secretly, pass the rest; all reveal and resolve simultaneously. Passing is left in Ages I and III and right in Age II. The hand shrinks every turn until you receive a hand of 2; you keep one and discard the other face down. — [RulesPal 7 Wonders rulebook](https://rulespal.com/7-wonders/rulebook)
- Each pick can be built, used for a Wonder stage, or sold for 3 coins. You can buy common or rare resources from neighbors for 2 coins each. — same source
- On denial: a review argues "denial becomes stronger when the game is zero-sum", which is why two-player drafting favors denial. — [Miniature Market 7 Wonders Duel review](https://miniaturemarket.com/reviewcorner/7wondersduel-review) ⚠️ search-result snippet only; page not fetched. Another source frames each pick as "what do I want, and what can I afford to let my opponent have" — [BoardMatch drafting collection](https://boardmatch.app/es/collections/best-drafting-board-games) ⚠️ search snippet only. A Zatu article argues hate-drafting "is less to do with the mechanics of the game, and more to do with the mechanics of the people playing it" — [Zatu, Why we should all love hate drafting](https://zatu.com/en-au/blogs/features/why-we-should-all-love-hate-drafting) ⚠️ search snippet only; both of my fetches returned HTTP 429.

**Terraforming Mars (Jacob Fryxelius, 2016). Source: RulesPal rulebook page (tool reported the whole document seen, including the Game Variants section).**
- Standard research: draw 4 cards and buy any for 3 MC each, discarding the rest. The Draft variant is optional and "used only if more interaction is desired": 4 cards, keep one and pass the rest, repeat down to a final card, then pay 3 MC for any of your four. Passing alternates direction each generation. The first-player marker moves one step clockwise each generation. — [RulesPal Terraforming Mars rulebook](https://rulespal.com/terraforming-mars/rulebook)

**Race for the Galaxy:** I found no source on drafting or denial in it. The only result was a generic description.

### What makes "take it now vs. wait" work (analysis of the rules above)
- **A price that moves with position (Suburbia, Century, Concordia).** The "wait" option has a benefit (cheaper) and the "grab" option has a cost (pay more now). Remove the gradient and nobody ever waits.
- **Expiry at the cheap end (Through the Ages).** Cards that nobody takes are discarded from the leftmost spaces, so waiting has a real risk even if no rival wants the card. The discard count falls as player count rises (3, 2, 1 for 2, 3, 4 players). My inference: this keeps the amount of stuff leaving the row per round roughly constant as player count changes, which keeps the pressure steady. I have no designer source for that intent.
- **Obsolescence tied to leaders (Power Grid).** Plants at or below any player's city count are removed. As the leader grows, the cheap plants vanish, which puts a clock on trailing players too.
- **Single action per turn with an action-economy cost (Splendor).** Every reserve or gem take is a turn not spent buying. The reserve action is both denial (take a card before a rival) and the only source of gold, which makes denial a side effect of something you wanted anyway.
- **Hand shrinkage (7 Wonders).** The decision shrinks from 7 options to 2 over six picks, so early picks are slow, late picks are fast. Total decision time stays low because everyone picks simultaneously.
- **Time per decision.** Splendor, Century and Concordia: one pick per turn, usually seconds. Suburbia: a row of about 7 tiles with a visible price each. Typical decision is "which of the cheaper ones is good enough", one click.

### Inferences (my analysis, not sourced)
- A decaying-price row in real time can drop the "turn" altogether: price ticks down every N seconds as the card moves along the row; a rival bot grabs it when its personal threshold is met. The player sees the countdown and the bots' stated interest.
- To keep "wait" a real choice, there must be a visible chance a rival takes it. That is exactly the current "AI names a card, takes it at round end" mechanic. The gradient adds the benefit side of waiting.
- Century's cube-on-skipped-cards idea (if the bonus part is correct) is a way to pay the eventual taker for the tempo that others lost by skipping. I could not confirm it from a primary source.

### Gaps
- Per-position costs in Through the Ages and the direction of Concordia's price gradient: not in the text I read.
- Suburbia second edition (Bezier PDF) not found; the $10-to-free scale is unverified.
- Race for the Galaxy: nothing found.
- No rulebook PDF read for Splendor, Century, Suburbia, Concordia, 7 Wonders, Terraforming Mars (RulesPal only).
- No designer-authored source on why drafting denial works (the Zatu and BoardMatch material is reviewer opinion, snippet-only).

---

## 3. Denial and telegraphing: visible rival intent, blocking, and keeping denial from becoming a chore

### Takeaway
Games that telegraph an opponent's next move make decisions "puzzles" the player can solve rather than gambles. Into the Breach is the cleanest documented example: all enemy attacks are shown, with no chance-to-hit, and the developers say this is meant to make losses feel like the player's own fault. In board games, denial stays interesting when it is a by-product of a pick you wanted anyway (7 Wonders, Splendor reserve) or when it carries a cost to the denier (Power Grid bid-up); it becomes a chore when the only way to engage is a pure block with no upside.

### Cited Findings
- Subset Games (Justin Ma interview): telegraphed enemy attacks "became a core mechanic", drawing on lessons from FTL. The team wanted fewer random outcomes and wanted losses to feel like the player's own fault. Goals go beyond killing enemies (minimising damage matters, e.g. sacrificing a mech to save a city), weapons have side effects, and the player cannot max every upgrade. The interview does not use the term "perfect information" and does not address "chore". — [Game Developer, Road to the IGF: Subset Games' Into the Breach](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) (tool reported the whole interview seen)
- Critics describe the same design in a search summary: all enemy attacks are telegraphed, with arrows showing which tiles take damage and "no RNG %-chance to hit". — via search-result summary of Destructoid, Thinky Games, Games.gg ⚠️ pages not fetched.
- Slay the Spire: the Mega Crit Road to the IGF interview does NOT mention enemy intents (it only says enemies were designed to challenge different strategies, and that no single dominant strategy should exist). A PC Gamer award write-up is said to credit "transparent" information and enemy intents, ⚠️ search snippet only. — [Game Developer, Road to the IGF: Slay the Spire](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-)
- Power Grid shows rival intent through public state rather than a declaration: the player order track, the visible future market, and everyone's visible plants and resource storage. Players choose a plant to auction publicly and sequentially, so a rival's interest is visible when they open the bidding. — [Power Grid Deluxe rules](https://www.riograndegames.com/wp-content/uploads/2014/08/Power-Grid-Deluxe-Rules.pdf)
- Ra telegraphs buying power: sun disks are face up (until spent), so everyone can see who can still bid what. The review says opponents exploit this by "bid[ding] low to force you into taking a high-tile lot". — [Theology of Games Ra review](https://www.theologyofgames.com/blog/2016/10/8/here-comes-the-flood-a-double-take-review-of-ra)
- Century telegraphs by caravan: cubes in a caravan are open, so rivals can see which Point cards you can claim. — [RulesPal Century rulebook](https://rulespal.com/century-spice-road/rulebook)
- Worker-placement blocking, as a general pattern: blocking is "the core interaction" in many modern games, and is typically softened by limits or penalties on later placements, bumping workers off with a benefit to the bumped player, or non-exclusive spaces. — [Punchboard, "The joy of worker placement"](https://punchboard.beehiiv.com/p/the-joy-of-worker-placement) and forum/MetaFilter commenters ⚠️ search-result summary only; these are blog and forum posts, not designer essays.
- 7 Wonders: each pick is a dual decision (what do I want vs. what do I let my neighbor have). Sources cited above are snippet-only.
- High Society: the disgrace-card round ends on the first pass, so the "block" is forced onto whoever blinks first rather than being a deliberate attack. — [RulesPal High Society rulebook](https://rulespal.com/high-society/rulebook)

### Inferences (my analysis, not sourced)
- **Denial stays fun when it is a side effect.** Splendor's reserve, 7 Wonders' pick, High Society's bid-up all give the denier something. A pure "spend a turn to block" feels bad. This matches the worker-placement softening tactics above.
- **Denial stays cheap when the bot's intent is shown as a fact, not a guess.** The existing "AI names a card" is already a telegraph. The design question is what the player can do about it: if the only response is "sign it first", that is a race, not a block.
- **Keep it to one meaningful block per round.** All of the one-action-per-turn games (Splendor, Century, Concordia) cap how much you can do, so denial is always at the expense of something else.
- **Make the cost visible.** Power Grid: the player who bids up a rival pays if they win. High Society: you lose the card AND the money if you are last in.

### Gaps
- No designer essay on why denial feels like a chore. All worker-placement material is blog/forum opinion.
- Slay the Spire's intent design: not found in primary sources.
- Into the Breach: the GDC talk (if one exists) was not found; the interview does not use "perfect information".
- Race for the Galaxy denial: nothing found.

---

## 4. Catch-up rules in markets: Power Grid's turn order and price ladders, and other examples

### Takeaway
Power Grid is the best documented catch-up in a market because the catch-up is structural: the leader chooses plants FIRST but buys resources and builds LAST, so the leader's lead is taxed on the later steps. Medici, Ra and High Society use other forms: the poorest starts next, the lowest sun disk total loses points, the poorest is cast out. Design commentary is divided: several designers prefer "headwinds" built into the economy over bolt-on catch-up.

### Cited Findings
- Power Grid Phase 1: most cities goes first; ties broken by biggest plant. Phase 2 (auction) runs in that order. Phases 3 (resources) and 4 (build) run in REVERSE order. — [Power Grid Deluxe rules](https://www.riograndegames.com/wp-content/uploads/2014/08/Power-Grid-Deluxe-Rules.pdf)
- Friese's stated approach: "the leading player gets the biggest disadvantage." An Opinionated Gamers commenter says going first was "positively oppressive" in the predecessor Funkenschlag and eased in Power Grid. Another commenter (Matt Carlson) finds the leader penalty frustrating when a leader cannot fall back enough to lose the lead. — [Opinionated Gamers, Funkenschlag at Fifteen](https://opinionatedgamers.com/2016/07/11/funkenschlag-at-fifteen-the-story-of-power-grid/)
- Power Grid catch-up details already listed in Section 1: last auction starter pays the minimum bid; North American discount token puts the smallest plant at 1 Elektro; refill of resources is a fixed amount from the most expensive empty space; cheapest plants removed when any player's city count reaches them. — [Power Grid Deluxe rules](https://www.riograndegames.com/wp-content/uploads/2014/08/Power-Grid-Deluxe-Rules.pdf)
- Power Grid, endgame: only cities you can actually power count, which makes late-game plant purchases matter more than late-game building. — [Opinionated Gamers](https://opinionatedgamers.com/2016/07/11/funkenschlag-at-fifteen-the-story-of-power-grid/) (Friese "made only powered cities count at game end")
- Medici: the player with the fewest florins starts the next day. — [RulesPal Medici rulebook](https://rulespal.com/medici/rulebook)
- Ra: at the end of the third epoch, the highest sun total gains 5 points and the lowest loses 5; the sun disk you win with is swapped for the one on the board. — [RulesPal Ra rulebook](https://rulespal.com/ra/rulebook)
- Terraforming Mars: the first-player marker moves one step clockwise each generation. — [RulesPal Terraforming Mars rulebook](https://rulespal.com/terraforming-mars/rulebook)
- Through the Ages: the number of cards discarded from the row scales with player count (3, 2, 1). — [RulesPal Through the Ages rulebook](https://rulespal.com/through-the-ages/rulebook)
- League of Game Makers panel (seven designers): most are skeptical of catch-up. Luke: a runaway leader usually signals a design flaw, and a "headwind" such as Dominion's victory cards is more elegant. Peter: catch-up is a contrived patch; cites Power Grid (turn order adjusted for balance, players may hold back to score) and Suburbia's red lines. Christina: useful in long games, unnecessary in short ones. Steve: catch-up can create a "Stolen Win"; suggests an "Accelerated Ending" instead. Christian: "a bandage rather than a fix". — [League of Game Makers](https://leagueofgamemakers.com/ask-the-league-should-games-have-a-catch-up-mechanic) (tool reported the whole page seen)
- Other examples from search results (⚠️ snippet only, pages not fetched): Colony's "Catch the Leader" rule, which let trailing players convert a discard into resources equal to their distance behind (the guest author said it turned blowouts into nail-biters but argued for a headwind instead); Cubitos' race mechanic adding dice for players behind. — [Brandon the Game Dev, Colony guest post](https://brandonthegamedev.com/colony-letting-leaders-lead/); [Zatu, games with catch-up mechanics](https://zatu.com/games-with-catch-up-mechanics/) (my fetch of the Zatu page returned HTTP 429).

### Inferences (my analysis, not sourced)
- **The Power Grid pattern in one sentence:** first choice of the scarce thing is given to the leader, and the cost of that comes back on a later, separate step where the leader is last. It works because the two steps are separate and both visible, so the leader sees exactly what they gave up.
- **For a real-time game** there is no turn order, so the equivalent is a time-based lead. Examples: the leading lab's first window on a new deal opens later, or the leading lab pays a visible premium (the resource-market ratchet is a price-based version of this). I did not find a real-time precedent in the sources I read.
- **Price ladders as catch-up.** Power Grid's resource market does this indirectly: leaders have more plants, so they buy more resources, so prices rise for them first in reverse order.
- **The "headwind" critique matters here.** If the compute deals game has a runaway leader problem, the cheaper fix per the panel is to make winning deals make future deals cost more (a headwind), not to hand the trailer a discount.

### Gaps
- No reverse-turn-order example outside Power Grid and Medici/Terraforming Mars found beyond those listed.
- No source found on catch-up designed specifically for real-time games.

---

## 5. Adapting to one human versus three AI rivals in real time

### Takeaway
This is the report-writer's synthesis question, not a sourced question. The adaptation points below are inferences from the rules cited above; none of the games I read are real-time except Merchants of Amsterdam's clock, and I found no source evaluating it.

### Cited Findings
- Merchants of Amsterdam is the only game I found where a physical clock runs the auction in real time; the first to slap down pays the price shown. — [Meeple Mountain](https://www.meeplemountain.com/boardgame/merchants-of-amsterdam/)
- Power Grid itself ships a two-player rule where an automated "Trust" takes the biggest plant free and never bids, takes resources without paying, and is always second in player order. This is an official example of a bot standing in for opponents that never auctions. — [RulesPal Power Grid rulebook](https://rulespal.com/power-grid/rulebook) (the 2-player "Against the Trust" variant; tool reported the whole page seen with some tables garbled)

### Inferences (my analysis, not sourced)
- **One decision per auction for the human.** Ra's once-around auction (caller last) and Modern Art's fixed-price both give the human exactly one prompt. Three bots decide instantly from their stated budget and personality.
- **Convert "name a card, take it at round end" into a once-around sealed offer.** Each rival names a card and a bid (visible, telegraphed). The human may outbid one of them by a visible margin before round end, or let it ride. The loser gets a consolation (For Sale: cheapest remaining item plus half the bid back).
- **A descending clock fits real time.** A Dutch clock needs only "click now" from the human, and bots can take when their hidden reservation price is hit. The telegraph is the bot's visible interest, not its price.
- **Keep the pool small and the row short.** All the fast games here use 4 to 7 visible offers.
- **Avoid ascending open bidding against bots.** It needs many bid-and-raise steps per auction, and with three bots it either feels like watching a script or forces the human to babysit.
- **Fixed-pool currency visible to all (Ra's sun disks) gives bots something legible to bluff with** without simulating a hidden hand.
- **Fixed money with no income (High Society)** would conflict with a management game that has income; the transferable part is "passing recovers your money".

### Gaps
- No real-time board game evaluation found.
- I did not search for video games with real-time auctions, which could be useful precedents.

---

## Coverage statement

**Raw text read (pdftotext of the official PDF, saved by WebFetch):**
- Power Grid Deluxe rules (Rio Grande, `riograndegames.com/wp-content/uploads/2014/08/Power-Grid-Deluxe-Rules.pdf`). ⚠️ I read the extracted text for setup (about lines 76 to 135 including the market setup and removal table), Phase 1 to Phase 3 (lines 186 to 302), and the start of Phase 5 (roughly lines 385 to 440). I did NOT read the components section, the Phase 4 build text, the Step 2/Step 3 section in the raw text (I relied on the RulesPal rendition for those), the two-player rules, or the final summary page. The resupply table numbers are graphics and did not extract.

**Pages the tool reported as fully seen (via WebFetch's summarising model, not raw text):**
- RulesPal: Modern Art, High Society, Power Grid (including "Against the Trust" 2-player variant; some tables garbled), Splendor, Century: Spice Road, Suburbia, Concordia, Through the Ages, 7 Wonders, Terraforming Mars, Medici, Ra (tables garbled, track length missing).
- UltraBoardGames: For Sale rules; Suburbia rules.
- Opinionated Gamers: "Funkenschlag at Fifteen" (Friese interview); Knizia 2011 interview (no auction content).
- Wargamer: Knizia on Medici article.
- Game Developer: Into the Breach (Subset Games) and Slay the Spire (Mega Crit) Road to the IGF interviews.
- Meeple Mountain: Merchants of Amsterdam page (short).
- Theology of Games: Ra review.
- League of Game Makers: catch-up mechanics panel.
- designer-notes.com OTC Designer Notes #17 (confirmed it loads, not used here).
- FrontRowCrew: PAX West 2025 auctions lecture page (description only, no lecture content; not cited).

**Cited from search-result summaries only (⚠️ not opened):**
- Zatu hate-drafting article (two fetch attempts returned HTTP 429); Zatu catch-up games article (HTTP 429); Miniature Market 7 Wonders Duel review; BoardMatch drafting collection; EconPort Dutch auction page; Brandon the Game Dev Colony post; Punchboard worker placement article; the Destructoid/Thinky Games/Games.gg and PC Gamer Into the Breach/Slay the Spire material; Wikipedia/Meeple Mountain snippets on Knizia's auction trilogy.

**Could not reach:**
- Osprey High Society rulebook PDF (TLS certificate error); EDP Power Grid PDF (binary extracted to a 2-page stub, no rules text); Rio Grande Ra and Power Grid 2013 PDFs (404); steemit Suburbia review (page required JavaScript, tool saw only a loading screen); Zatu pages (429).
- Engelstein/Shalev Building Blocks (auction chapter), Elias/Garfield/Gutschera Characteristics of Games, any Vlaada Chvátil or Tom Lehmann writing, Shut Up and Sit Down reviews, Board Game Designers Forum threads, BoardGameGeek files: not searched or not reachable within the budget. I used well over the suggested 15 tool calls because the question set was large; even so, these remain gaps.
- No email address was placed in any URL or tool field.
