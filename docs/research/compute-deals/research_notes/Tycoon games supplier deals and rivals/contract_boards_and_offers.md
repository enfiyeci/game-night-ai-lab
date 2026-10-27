# Contract boards and offer cards in management and strategy sims (for the Game Night deal board redesign)

Research date: 2026-10-26. Games kept: Against the Storm, Football Manager (FM26, FM27 announced), RimWorld, Anno 1800. Dropped: Industry Giant 2, Production Line, Two Point Hospital/Campus, Frostpunk 2 (reasons in "Game selection" below).

**How to read the tags.** Every factual claim has an inline source. Community-written sources (fan wikis, Steam threads, forums) are labelled "community". ⚠️ marks a claim resting on a source I read only in part, or only as a search-result snippet. All page reads went through a fetch tool that returns a model-written digest of the page rather than raw HTML, so "read to the end" below means the digest covered the whole page, not that I saw every character. See "Coverage" at the bottom.

## Game selection

### Takeaway
The best analogues are: Football Manager (rivals bidding for the same player, with a visible "interested clubs" count and a response deadline), Against the Storm (a small, seeded-per-season offers board and a "Timed Order" that is a card with a countdown and a fixed penalty), RimWorld (offers that arrive on a seeded calendar and leave on a timer), and Anno 1800 (rival buying of island shares, and AI attitude driving what you are allowed to trade).

### Cited findings
- Industry Giant 2: its Steam store page describes factories, products, wages, retail pricing and a transport network. It names no contracts, orders or competitors, so I dropped it. — [Steam store page](https://store.steampowered.com/app/271360/Industry_Giant_2/) (read via digest; ⚠️ I did not open the game manual or any wiki, so this only shows the store page does not advertise such a system).
- Production Line, Two Point Hospital/Campus, Frostpunk 2: not researched. No source opened. Dropped for lack of any confirmed contract-board system on my side, not because I proved they have none.

### Gaps
- A single search for Industry Giant 2 contract systems returned only irrelevant results, so I cannot say whether the game has delivery contracts.

## Against the Storm (Eremite Games, Hooded Horse; current build around 1.9.x)

### Takeaway
Against the Storm has three different "card" boards: the Offers board (trade routes; four facts per card, reset every season, seeded to the settlement's biome and your standing), the Queen's Order pick (a choice of 2 to 4 objectives per pack), and the Timed Order (a countdown card with one fixed, small penalty). It has no rival who snatches cards. Its pressure comes from timers and from the Queen's impatience, not from competitors.

### Screen and card contents
- Offers (the trade-routes screen) opens from an icon at the top right of the HUD and needs a Trading Post. Each offer has four parameters: desired goods, Amber payment, travel cost and travel time. A quantity is set with arrow buttons in the Offer Slot, in several size steps. — [Eremite, "Time is Money" update post](https://eremitegames.com/time-is-money-update/); [Eremite, Experimental update post, trade routes](https://eremitegames.com/experimental-trade-routes/page/7/) (the experimental post lists three parameters: payment, travel cost, travel time).
- Slots and reset: 2 Offers per settlement at the start, up to 5 by buying Offer Slots with Amber. Offers reset every season and depend on the settlement's biome and your relationship with it. — [Time is Money post](https://eremitegames.com/time-is-money-update/).
- Standing has five levels (neutral, known, friendly, honored, allied). Higher standing means better offers, more wanted goods and slightly shorter travel time. Hovering a settlement on the World Map shows the full list of goods it may want. — [Time is Money post](https://eremitegames.com/time-is-money-update/).
- Caravan strings: the caravan must be equipped with Packs of Provisions; goods take travel time; Amber is collected when the caravan returns, with an auto-collect checkbox. — [Time is Money post](https://eremitegames.com/time-is-money-update/).
- Design intent for offers: the old 1:1 goods exchange was "fair, but not really fun"; the new system is meant to create excitement when players find good deals and to give neighbours more meaning. — [Experimental update post](https://eremitegames.com/experimental-trade-routes/page/7/).
- Queen's Orders: a player picks which Order to commit to from 2 to 4 options in a pack; packs arrive at set intervals; rewards are Reputation plus goods, villagers or Perks. — [Fandom wiki, community](https://against-the-storm.fandom.com/wiki/Mechanics) ⚠️ search snippet only (page returned HTTP 402); partly matches the dev post below which says a Timed Order is "a third choice in the Order Pick Popup".
- Timed Orders (optional Queen missions in place of a regular Order): hard, time-limited and can be failed; failing loses the one Reputation Point the Order would have granted. There is a limited time to pick one; once picked, the timer starts. 60 were added. Some appear on Normal but most on Impossible or higher. Names include "Quick Transaction", "Hurried Expedition", "Greedy Merchant". Requirements and rewards are left for players to discover. — [Time is Money post](https://eremitegames.com/time-is-money-update/).
- Dev rationale for Timed Orders: "a sense of excitement" and a more rushed, reckless style; the roguelite needed more ways to take big risks. — [Time is Money post](https://eremitegames.com/time-is-money-update/).
- The post does not describe any penalty for a failed or unfulfilled Offer. — [Time is Money post](https://eremitegames.com/time-is-money-update/) (digest says none is described; the Experimental post also mentions none).

### Can a rival take the offer first? How is pressure shown?
- No rival bidding. Pressure sources found: (a) the offers board resets each season, so an unused offer expires at the season change; (b) a Timed Order countdown; (c) per the community wiki, reaching 14 impatience points loses the game. — [Time is Money post](https://eremitegames.com/time-is-money-update/); [Fandom wiki, community](https://against-the-storm.fandom.com/wiki/Mechanics) ⚠️ snippet only.
- Season lengths: the official wiki lists Drizzle at 4:00 and Clearance at 4:00, and a typical in-game year at 10 or 12 minutes depending on difficulty. Storm duration was not in the snippet. — [Hooded Horse wiki, Seasons](https://wiki.hoodedhorse.com/Against_the_Storm/Seasons) ⚠️ search snippet only (page returned HTTP 403 to me).
- Storm telegraphing: I found no devlog on a storm forecast. The one UI fact I could confirm is that after the 2022 interface hotfix, season indicators were added to the Forest Mystery icons on the HUD, the icons were enlarged, and inactive ones got a grey overlay. — [Eremite, interface hotfix post](https://eremitegames.com/interface-hotfix-we-hear-you/page/7/) (the digest says it does not mention storm timers). A community mod shows storm time remaining, which suggests the base HUD lacks it. — [Thunderstore mod "TraderTimer"](https://thunderstore.io/c/against-the-storm/p/DGH/TraderTimer/) ⚠️ snippet only.

### Strings and penalties
- Offers: the strings are cost-side and visible up front (travel cost in Amber, Provisions, travel time). No failure penalty described.
- Timed Orders: one fixed, named penalty (lose the Reputation Point), stated in the dev post. — [Time is Money post](https://eremitegames.com/time-is-money-update/). The press release says the penalty is "permanent loss of reputation" — [Games Press release](https://gamespress.com/Roguelite-city-builder-Against-the-Storm-signed-Hooded-Horse) ⚠️ snippet only.

### Player and developer reception
- Devs said the rework answered "some of the most prevalent pieces of feedback" and credit the Experimental Branch feedback. — [Time is Money post](https://eremitegames.com/time-is-money-update/).
- Goods were made about 25% cheaper so traders pay less, to stop players mass-producing one good and selling it all. — [Time is Money post](https://eremitegames.com/time-is-money-update/).
- Post-rework complaints (community): early offers feel like a loss ("I feel like I'm being scammed", 12 Clay plus a Provision for 2 Amber); replies say routes are weak at standing 0 and strong at standing 2 to 4 ("50+ amber per trade") and that at prestige 10 nearly every route beats selling to a trader. — [Steam thread, March 2024, community](https://steamcommunity.com/app/1336490/discussions/0/4286936717520753825) (the page showed 15 of 31 comments; ⚠️ rest unread).
- Earlier (Nov 2022, community): routes called "rather boring and inconsequential", a "half-hidden menu", needing a per-season check; provision costs make most offers barely profitable. — [Steam thread, community](https://steamcommunity.com/app/1336490/discussions/0/3547176090248233536).
- Orders: a player says some Queen's Orders can be impossible with their unlocks; a dev replied the generator should never issue orders the player cannot complete and that they would check; a player wants a pass option. — [Steam thread, April 2023, community](https://steamcommunity.com/app/1336490/discussions/0/7155698768546544954).
- Readability: after the April 2022 UI overhaul devs said "We hear you" and put readability first; fixes included larger Orders checkboxes, changed Order Pick Menu colours and a new Reputation icon. — [Eremite, interface hotfix post](https://eremitegames.com/interface-hotfix-we-hear-you/page/7/).
- Developer roadmap, Patch 1.1.6: update 1.2 planned a Production/Consumption trends window and Blightpost upgrades (not a storm forecast). — [Eremite, Patch 1.1.6 post](https://eremitegames.com/patch-1-1-6/page/49).

### Official screenshots (not downloaded; contents inferred from file names, NOT opened)
- Trade routes screen: `https://eremitegames.com/wp-content/uploads/2022/05/Trade-Routes-1920x1080-2.webp`, from the post [Time is Money update](https://eremitegames.com/time-is-money-update/). ⚠️ I did not open the image; only the file name says what it is.
- Order pick with a Timed Order: `https://eremitegames.com/wp-content/uploads/2022/05/Pick-an-Order-Timed-Order-1920x1080-1.webp`, same page. ⚠️ Same caveat.
- Steam store gallery, 10 official images (which one shows the board is not checked): from [Steam store page](https://store.steampowered.com/app/1336490/Against_the_Storm/), image list via the public Steam appdetails API, e.g. `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1336490/ss_c7a8ad6065ddaa4789935d28d99e24c940c2181c.1920x1080.jpg`.

### Inferences
- Four facts per card (goods, payment, cost, time), with standing and quantity handled outside the card, is a proven low-density pattern. Players still criticised the board, but for value and depth, not for density.
- A fixed, single penalty stated in the dev post ("lose the one Reputation Point") is a clean model for a string. Contrast with Game Night's multi-clause cards.
- Seasonal reset is a seeded, visible cadence that fits the owner's no-dice rule, but AtS offers are procedurally generated per season; I found no source stating whether the seed is visible to the player.

### Gaps
- Storm forecast: no source found. Official wiki pages blocked (403), Fandom blocked (402).
- Failed or expired Offer penalty: not described in the two dev posts.
- What exactly sits on the card as pixels: images not opened.

## Football Manager (FM26 current; FM27 announced, free play 29 Oct to 3 Nov)

### Takeaway
FM is the closest model for rival bidding. The offer-negotiation screen shows a "Transfer Status: Listed, 2 Interested Clubs" line, a Director of Football notes box that includes a deadline the other club has set, and action buttons including "Stall Offer". The rival pressure is shown as a count and a deadline, not as a bidding duel animation.

### Screen and card contents
- Screen: the "Transfer Offer" screen (Messages > Transfer Offer). Seen in the official screenshot (I opened it): left column with player name and age line, "Transfer Status: Listed" and "2 Interested Clubs", Player Info (club, nationality, positions, wage, contract expires, transfer value), a Director of Football Notes box; centre "Base Details" (Fee, Transfer Date, each with a lock icon), "Additional Fees", "Additional Clauses", a total line "Fee: £30M / Future & Potential Total Cost with Additional Fees"; right-hand action list: Accept Offer, Stall Offer, Reject Offer, Persuade to Join, Discuss Generating Market Interest, View Alternative Offers. Clause menu opened in the shot lists instalments (6 or 12 monthly), per-league-appearance bonuses, Players To Exchange, bonus after competition or player award achievement (GOAL50, World Footballer of the Year, and others). — [Official FM26 article image "FM26 Transfer Offer"](https://cdn.footballmanager.com/site/inline-images/4.%20EN%5B1%5D_opt.jpg), page: [Powered by TransferRoom: FM26's Recruitment Revamp](https://footballmanager.com/fm26/features/powered-transferroom-fm26s-recruitment-revamp).
- Facts count: the offer pane has two base fields (fee, date) plus expandable additional fees and clauses; the left pane carries about nine facts, but they are grouped into three labelled blocks (status, player info, advisor notes). My own count from the screenshot, not an official figure.
- The Director of Football box in that screenshot reads (text I could read, partly clipped): the buyer must register at least 8 home-trained players; "They have set a deadline of Saturday 20th September 2025 for Man City's decision"; "The transfer will go through in the next transfer window starting Thursday 1st January 2026"; a 1.5% solidarity-contribution note. — same image.
- FM26 transfer hub: scouting and transfers sit in one Recruitment hub; Requirements (you advertise a position, roles, playing time, transfer or loan, age range to every club); Pitch Opportunities (other clubs' adverts you can answer with a surplus player); a Pitch Activity tab that tracks players you offered and bids received. — [FM26 recruitment article](https://footballmanager.com/fm26/features/powered-transferroom-fm26s-recruitment-revamp) (digest of full article; it states it does not mention deadlines for adverts, offers or bids, nor how AI clubs decide to bid).
- New in FM26: clauses tied to individual player awards; more loans with future fees and buyback clauses; AI clubs affected more by Financial Fair Play. — same article.

### Can a rival take the offer first? How is pressure shown?
- "Attracting Interest" screen (FM22 Deadline Day hub): shows which of your players are being chased by other clubs, for sales and loans. When you get several offers for one player you can accept one and issue an ultimatum to other bidders to match the highest. — [Official FM Deadline Day feature page](https://www.footballmanager.com/features/deadline-day) ⚠️ search-result snippet only (page returned HTTP 403 to me).
- FM27 (announced): Deadline Day returns; agent offers are visible on the Recruitment screen throughout the window and increase as the window nears its close, "so they shouldn't appear unexpectedly"; the Transfers screen highlights top rumours and done deals; the Club screen lists each club's latest transfers. The page does not describe bidding wars. — [FM27 feature page](https://www.footballmanager.com/fm27/features/deeper-more-immersive-world).
- FM27 states a ramp (more agent offers as the deadline nears), which is a visible, seeded-looking cadence; whether it is seeded I could not determine.
- Stalling: a fan FAQ says Stall gives extra time past the response cutoff but the bidding club may withdraw. — [Vintage Is The New Old FAQ, community](https://www.vintageisthenewold.com/faq/what-is-the-stall-offer-on-football-manager) ⚠️ search snippet only; the site also covers non-FM topics, so weak.

### Strings and penalties
- Strings are first-class and optional on the card: a Clauses section the player adds from a menu, with a running "Future & Potential Total Cost" line at the bottom, so the player sees the all-in cost. — [Official FM26 screenshot](https://cdn.footballmanager.com/site/inline-images/4.%20EN%5B1%5D_opt.jpg).
- The article lists a clauses summary at the bottom of the Recruitment overview. — [FM26 Dugout "transfer market top tips"](https://www.footballmanager.com/the-dugout/transfer-market-top-tips-fm26).

### Player reception
- Community (FM13 to FM20 era, anecdotal): AI clubs often underbid, and multiple clubs sometimes bid as soon as you offer a player out; a player technique is to reject all but the top offer and relist one notch higher. — [FM Projects post, Jan 2024, community](https://fmprojects.substack.com/p/starting-a-bidding-war-for-your-player-0b6); [Steam FM19 thread, community](https://steamcommunity.com/app/872790/discussions/0/1644292444644563593) ⚠️ snippet only. The FM Projects post says it does not describe how competing bids are shown.
- I found no official dev diary or patch note about the transfer screen being too heavy or simplified. ⚠️ Not searched beyond the sources listed.

### Official screenshots (not downloaded)
- FM26 Transfer Offer (opened, described above): `https://cdn.footballmanager.com/site/inline-images/4.%20EN%5B1%5D_opt.jpg`, page: [FM26 recruitment article](https://footballmanager.com/fm26/features/powered-transferroom-fm26s-recruitment-revamp).
- FM26 Transfer Room: `https://cdn.footballmanager.com/site/inline-images/3.%20transfer%20room_opt.jpg`, same page. ⚠️ Not opened; alt text "FM26 Transfer Room".
- FM27 Deadline Day: `https://cdn.footballmanager.com/site/2026-09/DeadlineDay.png`, page: [FM27 feature page](https://www.footballmanager.com/fm27/features/deeper-more-immersive-world). ⚠️ Not opened; position under the Deadline Day heading only.
- Note: one of the other FM26 Steam gallery images that I fetched while testing (the first listed for app 3551340) is a World Cup match-tunnel shot and is irrelevant.

### Inferences
- An "N interested clubs" count plus an advisor line that gives the other side's deadline in plain words is a light way to show rivalry. It needs two facts, not a banner.
- Showing a running total cost with clauses folded in is the readability trick to keep the card itself simple while strings stay available.

### Gaps
- How FM decides which rival clubs go after a player, and whether the response deadline is fixed or calculated: not documented in any source I opened.
- Patch notes or dev diaries about the transfer UI being simplified: not found.

## RimWorld (Ludeon; current 1.6 line, including Royalty and Odyssey era content not checked)

### Takeaway
RimWorld is the best model for offers that arrive on a seeded calendar and leave on a visible clock. Under the Cassandra and Phoebe storytellers, trader arrival dates are computed from fixed rules, so they are predictable in principle. A visitor or ship leaves after a fixed number of ticks, with a notice when it goes. There is no rival taking the trade, but quests carry acceptance and completion timers and failure goodwill penalties.

### Screen and card contents
- Trader visit: orbital ships announce with a blue notice on the right of the screen; you trade by right-clicking the comms console. Caravan leaders carry a yellow question mark and you right-click them to trade. — [RimWorld Wiki: Trade, community](https://www.rimworldwiki.com/wiki/Trade) ⚠️ read to about 100,000 of 115,032 characters; the last 15,032 characters were not read.
- Pricing facts: sell at 60% and buy at 140% of market value; traders have limited silver; goods beyond their budget are given away free; the negotiator's Social skill improves prices. — same page.
- Quest card: quests come from factions, pawns or unaligned AI; some have a deadline for acceptance ("if not accepted, the quest will be rejected"), plus a completion timer; difficulty 1 to 3 stars; reward is either one reward or a pool of three to choose from; not accepting or not finishing in time counts as failure. — [RimWorld Wiki: Quests, community](https://rimworldwiki.com/wiki/Quests) ⚠️ read to about 100,000 of 128,592 characters; the last 28,592 were not read. The wiki does not list the quest card's fields.
- Quest frequency: about one per 10-day interval (without Royalty) or two per 12-day interval (with Royalty), marked "[Verify]" on the wiki. — same page.

### Can a rival take the offer first? How is pressure shown?
- No competitor takes the goods. Pressure is time: orbital ships stay 40,000 ticks (16 in-game hours) and a notice at the top of the screen says when a ship has left comms range. — [RimWorld Wiki: Orbital trader, community](https://rimworldwiki.com/wiki/Orbital_trader) ⚠️ read to about 100,000 of 115,147 characters.
- Land caravans stay 27,000 to 45,000 ticks (about 10.8 to 18 hours) after reaching camp; losing the trader or a pack animal makes the group leave immediately. — [RimWorld Wiki: Trade, community](https://www.rimworldwiki.com/wiki/Trade) ⚠️ partial as above.
- Seeded schedule (relevant to the owner's rule): under Cassandra and Phoebe, each settlement gets five seeded possible caravan dates per 60-day year, at least six days apart, none in the first five days; each date passes a faction-relations check (0 of 4 neutral or allied factions gives 0%, 1 of 4 gives 60%, 2 gives 73.3%, 3 gives 86.7%, 4 gives 100%). Orbital traders alternate seven active days and eight inactive days, giving four possible arrivals per 60 days. Randy Random does not use these fixed schedules. — [RimWorld Wiki: Trade, community](https://www.rimworldwiki.com/wiki/Trade) ⚠️ partial. The relations check is a dice-like step on top of a visible seed; the owner may want only the fixed-date part.

### Strings and penalties
- Quests list failure routes (late, hostile to the giver's faction, neutral with an enemy faction) and named goodwill losses (for example Deserter minus 200 capped at minus 100). Rewards already received are kept when a quest later fails. — [RimWorld Wiki: Quests, community](https://rimworldwiki.com/wiki/Quests) ⚠️ partial.
- Caravan goodwill: tending a visitor gives up to 10 goodwill; a possible gift after a visit depends on wealth and goodwill. — [RimWorld Wiki: Trade, community](https://www.rimworldwiki.com/wiki/Trade) ⚠️ partial; the wiki says the gift-category detail is truncated.

### Player reception
- Not researched: I did not open any official dev diary, patch note or forum thread about how readable the trade or quest screens are. ⚠️ Gap, not coverage.

### Official screenshots (not downloaded)
- Steam store gallery, 11 images (which one shows trade or quests is not checked): [Steam store page](https://store.steampowered.com/app/294100/RimWorld/); e.g. `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/294100/80e383ef19353058791efe17a6485849246c9c17/ss_80e383ef19353058791efe17a6485849246c9c17.1920x1080.jpg`. ⚠️ Not opened. I did not find an official image of the trade or quest screen.

### Inferences
- A short, always-visible "leaves in N" clock, plus a "has left" notice, tells the player exactly when an offer ends, and it needs no dice if the arrival date is itself pre-computed (as it is for Cassandra).
- Separating the acceptance timer from the completion timer (quests) keeps the card to two time facts with different meanings.

### Gaps
- Exact on-screen layout of the trade and quest windows; reception of the quest UI; Odyssey/1.6 changes.

## Anno 1800 (Ubisoft Mainz; Anno Union devblogs from 2018)

### Takeaway
Anno 1800 has no timed contract board in the sense Game Night needs. Its relevant parts are (1) AI characters who gate trade through a visible reputation and treaty system, and (2) island shares, where rivals can buy slices of your islands and, if they hold all of them, buy you out. The official material I could read covers diplomacy but not share buyouts, so the share rules are community-sourced.

### Screen and card contents
- Diplomacy: four treaty types (Alliance, Trade Rights, Peace, War). Reputation, which tracks each AI character's standing toward the player, pirates and other AIs, decides whether any diplomatic action succeeds. The AI may accept, refuse or ask for extra money. Friendly characters may propose treaties to the player. — [Anno Union devblog "Back-Room Politics", 22 Nov 2018](https://www.anno-union.com/?p=9984). Neutral factions are outside the system. The post shows a diplomacy window in a montage but does not describe its fields; reader comments (community) mention portraits, a military and economy comparison and a numeric reputation scale.
- Trade rights are a treaty, so what you may trade with a rival is gated behind a negotiated, reputation-based yes. — [Anno Union devblog](https://www.anno-union.com/?p=9984); community threads say you need a trade agreement even with allies. — [Steam thread, community](https://steamcommunity.com/app/916440/discussions/0/3725070812878094870) ⚠️ search snippet (the fetched digest of this thread says shares and buyouts are not mentioned).
- Trade route design (2018 devblog): classic multi-ship routes with stations and waypoints, plus a simple "charter route" for one good between your own islands. Shares, buyouts, trade agreements and contracts are not in that post. — [Anno Union devblog, 1 Feb 2018](https://www.anno-union.com/?p=9764).

### Can a rival take the offer first? How is pressure shown?
- Shares (community only): each share is 6% of an island's financial balance, so five shares are 30%; if you hold none you receive only 70% of the balance. Holding every share of an island unlocks a buyout, which is expensive, destroys all buildings except the trading post, and transfers control; the AI can do this to you, so keeping one share on each island prevents it. — [Steam thread, community](https://steamcommunity.com/app/916440/discussions/0/3767857515019307248). The thread's author is unsure whether money changes hands when the AI buys a share.
- A forum post reports AI traders appear and top up stock to your buy-order settings. — [Steam thread, community](https://steamcommunity.com/app/916440/discussions/0/3725070812878094870) (a player there found AI trade more "annoying then helpful").
- The pressure is slow and structural (accumulating shares), shown through a pie chart of share ownership per community post; no timers found. — [Steam search summary, community](https://steamcommunity.com/app/916440/discussions/0/4414172638910874273) ⚠️ snippet only.

### Strings and penalties
- Devblog: abandoning or failing quests hurts reputation; gifts and flattery raise it (overuse backfires). — [Anno Union devblog](https://www.anno-union.com/?p=9984).
- Buyout string: all buildings except the trading post are destroyed. — [Steam thread, community](https://steamcommunity.com/app/916440/discussions/0/3767857515019307248).

### Player reception
- A player says many skip trade routes because AI will "take care of it"; another found AI "more annoying then helpful". — [Steam thread, community](https://steamcommunity.com/app/916440/discussions/0/3725070812878094870). I found no official statement on how the diplomacy or share screens were simplified. ⚠️ Not searched beyond these.

### Official screenshots (not downloaded)
- Steam store gallery, 12 images (which show diplomacy or trade is not checked): [Steam store page](https://store.steampowered.com/app/916440/Anno_1800/); e.g. `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/916440/ecebd0ae477a204c46e3998be53fdd854cf3b089/ss_ecebd0ae477a204c46e3998be53fdd854cf3b089.1920x1080.jpg`. ⚠️ Not opened.
- Diplomacy window montage inside [Anno Union devblog "Back-Room Politics"](https://www.anno-union.com/?p=9984); no direct image URL captured. ⚠️

### Inferences
- The share system turns "rival interest" into a long-lived, countable stake rather than a one-turn race; it makes the rival felt on every card that touches the same asset. This is the only game here where rival progress is cumulative and visible as a number.
- Reputation as a visible per-rival number that decides "may I even make this deal" is a way to give rivals weight without dice.

### Gaps
- No official source for share and buyout rules; no official diplomacy-screen description; official wiki (Fandom) blocked (HTTP 402).

## What a designer could take from this (inferences only, not sourced findings)

- Cap each card's front face at four to six facts, as Against the Storm (four) and FM's grouped panes do, and let clauses sit behind an expander with a running all-in total, as FM does.
- Show rival pressure as a count plus one dated line ("2 other firms interested; one has set a deadline of day X"), as the FM screenshot does, instead of a banner.
- Seeded rival cadence can be shown as a visible calendar (RimWorld's fixed arrival windows; FM27's "agent offers ramp up as the window closes"), which fits the no-dice rule.
- Give each penalty one named, fixed cost, as AtS Timed Orders do.
- Add a "leaves in N" clock to every card; add a "has left" notice, as RimWorld does.

## Coverage

All fetches went through a tool that returns a model-written digest of the page; I could not inspect raw page text. "Read to end" means the digest covered the whole page.

**Opened and covered to the end (by digest):**
- [Eremite "Time is Money" update](https://eremitegames.com/time-is-money-update/)
- [Eremite Experimental trade routes post](https://eremitegames.com/experimental-trade-routes/page/7/)
- [Eremite interface hotfix post](https://eremitegames.com/interface-hotfix-we-hear-you/page/7/)
- [Eremite Patch 1.1.6 post](https://eremitegames.com/patch-1-1-6/page/49)
- [Anno Union devblog p=9764 (trade routes, 2018)](https://www.anno-union.com/?p=9764)
- [Anno Union devblog p=9984 (Back-Room Politics)](https://www.anno-union.com/?p=9984)
- [FM26 recruitment revamp article](https://footballmanager.com/fm26/features/powered-transferroom-fm26s-recruitment-revamp), plus its Italian version (same content, [link](https://www.footballmanager.com/it/fm26/features/alimentato-da-transferroom-la-rivoluzione-del-reclutamento-di-fm26))
- [FM26 Dugout transfer market top tips](https://www.footballmanager.com/the-dugout/transfer-market-top-tips-fm26)
- [FM27 feature page](https://www.footballmanager.com/fm27/features/deeper-more-immersive-world)
- [FM Projects Substack post](https://fmprojects.substack.com/p/starting-a-bidding-war-for-your-player-0b6)
- [Steam store page, Industry Giant 2](https://store.steampowered.com/app/271360/Industry_Giant_2/)
- Steam threads: [Anno 1800 shares](https://steamcommunity.com/app/916440/discussions/0/3767857515019307248), [Anno 1800 trade routes](https://steamcommunity.com/app/916440/discussions/0/3725070812878094870), AtS [598514698788350342](https://steamcommunity.com/app/1336490/discussions/0/598514698788350342), [7155698768546544954](https://steamcommunity.com/app/1336490/discussions/0/7155698768546544954), [3547176090248233536](https://steamcommunity.com/app/1336490/discussions/0/3547176090248233536)
- Official FM26 "Transfer Offer" image: opened and viewed (this was the one image I looked at; the fetch tool saved a copy in the session's tool-results folder, outside the repo; I did not save anything into the project). One FM26 Steam gallery image was also fetched by mistake and is irrelevant.

**Opened but only partly read:**
- [RimWorld Wiki: Trade](https://www.rimworldwiki.com/wiki/Trade): about the first 100,000 of 115,032 characters.
- [RimWorld Wiki: Orbital trader](https://rimworldwiki.com/wiki/Orbital_trader): about the first 100,000 of 115,147 characters.
- [RimWorld Wiki: Quests](https://rimworldwiki.com/wiki/Quests): about the first 100,000 of 128,592 characters.
- [AtS Steam thread 4286936717520753825](https://steamcommunity.com/app/1336490/discussions/0/4286936717520753825): 15 of 31 comments shown.

**Search-result snippets only (page not opened or blocked):**
- Hooded Horse AtS wiki (Seasons, Trade Routes, Timed Orders, Orders): HTTP 403 for both the fetch tool and a direct request; I did not try to get around the block.
- Fandom wikis (AtS Mechanics, Anno 1800 Trade): HTTP 402.
- [FM Deadline Day feature page](https://www.footballmanager.com/features/deadline-day): HTTP 403, so snippet only.
- FMScout "make an offer": HTTP 403. [FM19 Steam thread](https://steamcommunity.com/app/872790/discussions/0/1644292444644563593), [vintageisthenewold FAQ](https://www.vintageisthenewold.com/faq/what-is-the-stall-offer-on-football-manager), [Games Press AtS release](https://gamespress.com/Roguelite-city-builder-Against-the-Storm-signed-Hooded-Horse), [Thunderstore TraderTimer](https://thunderstore.io/c/against-the-storm/p/DGH/TraderTimer/), Anno 1800 Steam thread 4414172638910874273: snippet only.
- footballmanager.com "Tips to Rule Transfer Deadline Day" (node/582): fetch returned only a listing page, so the article was not read; the footballmanager.com/the-dugout slug I guessed returned 404.

**Not researched at all:** Production Line, Two Point Hospital/Campus, Frostpunk 2, Industry Giant 2 beyond its Steam store page. Orbital imperial trader and RimWorld Odyssey content not checked.

**Images:** only the FM26 Transfer Offer image was viewed. All other image URLs above come from page markup, the public Steam appdetails API, or file names; their contents are unverified. No images were saved into the project. No email address was used in any request.
