# Supplier contracts, procurement and rival competition for supply in business sims (Capitalism Lab, Rise of Industry, Big Pharma)

Reading note for the whole file. All pages were opened with a fetch tool that returns a model-written summary of the page, not the raw text. "Read" below means the fetch returned the whole page's content in that form. Where a page was blocked or only a search snippet was seen, the claim carries a warning sign. Community-written sources (forums, Steam threads, player guides, fan wikis) are named as such. Dates for community material are given where the page showed them.

---

## 1. Capitalism Lab / Capitalism II (Enlight, Trevor Chan)

### Takeaway
Capitalism Lab has no negotiated supplier contract at all. Supply is a standing "supply link" from a buying unit to a seller (your own factory, an AI company, or an "industrial seaport" that stands in for the world market), and it just keeps running until you change it. Rival competition shows up through (a) AI firms buying from you or from seaports and undercutting you, (b) natural-resource sites that get more expensive as they are bought, and (c) share-buying, where one holder reaching 50% ends the game. The official manual is strong on screens and tooling, thin on how AI firms decide things.

### Cited Findings

**How inputs are sourced (own production vs buying vs ports)**
- Early game: buy semi-products from industrial seaports "rather than trying to produce them yourself"; without seaport car parts, entering the car industry means funding every factory and mine for those parts, usually unaffordable at the start. Later, competitors sell on the open market and can be cheaper for small volumes, with better quality than seaports. Do not rely on seaports long term; "Seaport supplies may also stop depending on difficulty." — [Beginner's Guide: Gameplay Basics (official)](https://www.capitalismlab.com/beginners-guide-gameplay-basics/)
- Minimap marks industrial seaports (semi-products and raw materials) with "I" and commercial seaports (retail goods) with "C". Scout every seaport's product list at the start of each game. Difficulty rises when seaport quality drops or when there are fewer industrial seaports. — same page
- Farms can be built almost anywhere and cheaply; raw-material sites sit on fixed map locations, are expensive and run out. Raw-material quality is fixed by location; farm quality can be trained up to 100. — same page
- If you over-produce an input, you can cut output, widen to other products using the same input, or sell the surplus to competitors. — same page
- Selling to competitors happens automatically unless "Internal Sale" is on. Products with a high rating (low price, high quality) attract more buyers. A "View Clients" list shows who buys from you, how much, and what they make. Reasons to block rivals: keep capacity for yourself, or stop them using your quality advantage against you. — same page

**Terms and how size is chosen**
- There are no term lengths, volumes or penalties in the pages read. A supply relationship is a link; the buying unit takes what it needs. Existing links "continue after you set Internal Sale. To end them, demolish the factory or raise the price to a very high level." — [Gameplay Basics (official)](https://www.capitalismlab.com/beginners-guide-gameplay-basics/)
- Size is set indirectly: factories and farms should be "right-sized" to product and market demand; oversized ones waste construction and running cost. Supply/demand indicators compare a yellow supply bar against an orange demand bar; the guide warns demand can look high while inventory is still filling, so judge by actual customer sales. — same page
- The supplier selection screen "compar[es] quality and price against the seaport" (image alt text). A store's Sales Unit shows the supplier's purchase price plus freight; suppliers neither pay nor receive freight money. — same page
- Freight (Capitalism Lab 12.x "Improved Gameplay Balance"): buying from another city now combines three freight legs: supplier to nearest seaport, between the two cities, nearest seaport to buyer; the breakdown shows by hovering the Purchasing Unit's cost+freight display. — [Improved Gameplay Balance (official)](https://www.capitalismlab.com/improvements/improved-gameplay-balance/)
- Tools for changing suppliers in bulk: "Batch Switching Supplier" (at a Purchasing Unit, switches a whole group of your firms buying a product to a new supplier together) and "Redirect Supply Links" (at a Sales Unit, repoints your firms' purchasing links to that unit). Both pages are short and defer to separate "how it works" pages not read. — [Supply Management Tools (official)](https://www.capitalismlab.com/new-content/supply-management-tools/)
- Warehouse: a buffer between suppliers and factories/stores, input unit (purchasing), storage unit, output unit; the manual's own example is a warehouse holding a large quantity of crude oil "bought ahead of expected price increases", i.e. speculative stockpiling. — [Warehouse (official)](https://www.capitalismlab.com/new-content/warehouse/)

**How prices move and how it is shown**
- Consumer demand follows the macro economy: expansion raises wages and spending; downturn leaves goods unsold; a four-stage boom/bust cycle (growth, asset rally and inflation, rate hikes, bubble bursts) repeats over years. — [Enhanced Macroeconomic Simulation (official)](https://www.capitalismlab.com/new-features/enhanced-macroeconomic-simulation/)
- Shown on: a macroeconomic indicator panel under the minimap, and an "Economic Graphs" page in the Cities report with six series (GDP growth, unemployment, real wage rate, inflation, loan interest rate, consumer price index), 30 years by default. — same page
- That page does not explain how an input's price is set. ⚠️ I did not find an official page that states how seaport prices change over time.
- Natural resources: acquisition cost "rises sharply as more sites come into existence"; a site's price premium shows on hover in its info window; "An AI company that pays a premium usually raises its raw material selling price to recover the cost." New sites appear on the map shortly after existing ones are bought; green dots on the minimap are owned, white are available. Reserves deplete by default. — [Natural Resources (official)](https://www.capitalismlab.com/improvements/natural-resources/)
- Community only: a Steam guide says imported goods "can rise in price or stop being sold", so check seaports every 2-3 months. — [Steam guide "Master in Capitalism 2" (community)](https://steamcommunity.com/sharedfiles/filedetails/?id=2969285443)

**How AI rivals compete for supply, market and customers**
- A new game can have up to 50 AI companies; more rivals mean more variety of interactions and mergers and acquisitions, but the page "does not describe how AI firms decide on or carry out takeovers." Some AIs specialise in real-estate development and appear only when competitor start-up capital is High or Very High. — [Improved AI (official)](https://www.capitalismlab.com/improvements/improved-ai/)
- 12.5: AI companies now run "Radical R&D", picking technologies where they trail most, never the two most aggressive fast-track levels; sliders cap digital firms per AI. — [Version 12.5 (official)](https://www.capitalismlab.com/version125/)
- Rivals use your supply chain if you let them: community guide advice is to keep "Internal Sale" on for intermediate goods and raw materials so rivals cannot use your suppliers, and to buy raw-material sites; on minerals, buy the cheapest deposits and leave the dearest one because AIs will "think twice". Strategic investments (factories, resource sites, prime store locations) create barriers; share holdings do not. — [Steam guide "Master in Capitalism 2" (community)](https://steamcommunity.com/sharedfiles/filedetails/?id=2969285443)
- Forum anecdote (community, a 2016-onward thread): an AI firm bought mid-quality jackets from seaports and sold them at a steep discount, staying competitive even against a higher-brand, higher-tech product; the poster blamed an early mistake of letting AI buy his own jackets. Replies advise price wars cost everyone profit, diversifying, and that price can outweigh rating. — [Capitalism 2 / Lab forum thread](https://www.capitalism2.com/forum/viewtopic.php?f=11&t=3982)
- Stock side: if one person or corporation reaches 50% of your shares, "the game ends in a hostile takeover". Issuing shares raises cash from the current price and dilutes (manual example: 48 million raised, nearly 25% dilution). — [Gameplay Basics (official)](https://www.capitalismlab.com/beginners-guide-gameplay-basics/)
- Takeover tactics are community-sourced. The forum thread "Hostile take over" (3 posts, Feb 2016): a player at 29.64% needed 30% for a goal and the owner refused to sell; replies say pay far above value, or wait for the owner to run low on cash and price-war his key products to push him into issuing shares. — [forum thread (community)](https://www.capitalism2.com/forum/viewtopic.php?t=3387). The Steam guide describes buying a rival gradually (about 2.5% every month and a half) on the open market because buying from shareholders directly cost at least 50% more. — Steam guide above.
- 12.5 adds a "Holdings" tab in the Corporations report showing an indented ownership tree with stake, public/private status, stake value and "effective interest"; venture capitalists sell down once their holding reaches roughly 3x founding cost, in monthly slices. — [Version 12.5 (official)](https://www.capitalismlab.com/version125/)
- The stock-market screen carries a financial-news panel and can switch to a portfolio gain/loss view; filters All/Consumer/Tech/Real Estate/Media/Investment and Owned; a reverse split fires automatically below $1.00 per share. Image paths are dated 2026/08, so this page appears to have been updated in August 2026 (inference from the URL). — [Stock Market Enhancement (official)](https://www.capitalismlab.com/new-content/stock-market-enhancement/)

**What players found hard or frustrating**
- The beginner guide itself flags: check both sides of a supply/demand bar before acting; seaports can stop supplying; early bankruptcy is a main risk. — [Gameplay Basics (official)](https://www.capitalismlab.com/beginners-guide-gameplay-basics/)
- Community: AI firms that resell seaport goods cheaply dominate and are hard to dislodge; owner-refuses-to-sell makes 30% goals stall (forum threads above).
- ⚠️ No developer interview, postmortem or patch note explaining why the supply-link model has no negotiated contracts was found.

**Screens and official images**
- Screens named in the manual: supplier selection screen; Purchasing Unit / Sales Unit with cost+freight hover; View Clients list; Manufacturer's Guide (shows where an input is used, supply/demand indicators); minimap with seaport markers; Cities > Economic Graphs; stock market screen; Corporations report > Holdings tab.
- Images (official manual pages on capitalismlab.com; I could not find a Capitalism Lab Steam store page, see Gaps, so these are not steamstatic.com links). Descriptions are the manual's own alt text; I did not view the images.
  - Supplier selection screen, comparing quality and price against the seaport: https://www.capitalismlab.com/wp/wp-content/uploads/2025/07/beginners-guide-select-supplier.png (page: https://www.capitalismlab.com/beginners-guide-gameplay-basics/)
  - Client list, showing who buys from you and what they produce: https://www.capitalismlab.com/wp/wp-content/uploads/2025/07/beginners-guide-view-clients.png (same page)
  - Freight breakdown popup on a purchasing unit: https://www.capitalismlab.com/wp/wp-content/uploads/2017/07/freight-cost-breakdown.png (page: https://www.capitalismlab.com/improvements/improved-gameplay-balance/)
  - Also usable: seaport supplying car-body inputs https://www.capitalismlab.com/wp/wp-content/uploads/2025/07/beginners-guide-seaport.png ; minimap with I/C seaport markers https://www.capitalismlab.com/wp/wp-content/uploads/2025/07/beginners-guide-mini-map.png ; Economic Graphs https://www.capitalismlab.com/wp/wp-content/uploads/2017/07/Inflation-graph.png (page: https://www.capitalismlab.com/new-features/enhanced-macroeconomic-simulation/) ; stock market screen with news https://www.capitalismlab.com/wp/wp-content/uploads/2026/08/stock-news.png (page: https://www.capitalismlab.com/new-features/stock-market-enhancement/)

**Version history (what changed)**
- The "Recent Versions" page lists feature titles only, with no dates or change notes. Version 12.5 page lists the AI Radical R&D, Holdings tab, VC share sales and a Cash Flow Statement. Freight three-leg breakdown, Natural Resources rules, Stock Market Enhancement and Supply Management Tools are separate feature pages with no stated version number. ⚠️ I could not date when supply links, seaports or hostile-takeover rules first appeared; Capitalism Lab is described as an expanded Capitalism II released December 14, 2012 on Wikipedia, which does not discuss these systems. — [Recent Versions](https://www.capitalismlab.com/recent-versions/); [Wikipedia](https://en.wikipedia.org/wiki/Capitalism_(video_game))

### Inferences
- The strongest rivalry mechanism in this game is shared access to a fixed supply, not bidding. A "seaport" is an always-open, price-capped fallback that rivals also use, so the player's edge is owning something rivals cannot reach (Internal Sale, owned resource sites).
- The "price premium goes into the rival's selling price" rule is a clean visible link between a rival's purchase and a later price rise; it can be shown as a number on the thing being bought.
- The 50% hostile-takeover rule is a single visible threshold that ends the game; the Holdings tree makes it readable. The AI's side of takeovers is not documented.
- A standing link with no term avoids contract UI but removes sizing decisions; players then use Internal Sale as the lever, which is a design smell the community works around.

### Gaps
- How AI firms choose suppliers, when they take over a rival, or whether any AI ever tries to buy the player's shares: not in any page read. ⚠️ Official "Improved AI" page is explicitly silent on this.
- Capitalism Lab Steam store page and its official screenshots: not located (the one Steam app page opened by id 916440 was Anno 1800, not this game, and is not used).
- Official manual text on supply-link mechanics beyond the pages cited (e.g. "How Batch Switching Supplier Works", Pinned Windows (Supply Chain Insights), Initial Public Offering, Acquiring a Private Company, Version 12.0 page): listed in the site menu, not opened.
- Gamespot's Capitalism II review (hostile takeover mention in search summary only): HTTP 403, not read.

---

## 2. Rise of Industry (Dapper Penguin Studios, published by Kasedo Games)

### Takeaway
Contracts are not offers from a fixed supplier; since May 2019 they are region-level auctions where the player and AI companies bid the payout down, with the winner taking the job. Payment arrives only when the whole contract is delivered, so failure or an unwon auction leaves the player with a penalty and no income. Rivals are "entities" with personalities that bid in the same auctions, own region permits, and can be bought out by acquiring all their stock; the AI is immune to random events.

### Cited Findings

**Contracts: who offers, terms, penalties, failure**
- Steam store copy: "Bid for contracts to get the upper-hand over your rivals"; contracts and random events keep you adapting; AI rivals "compete for market share" and "beware of the hostile takeover". — [Steam store appdetails for Rise of Industry (official)](https://store.steampowered.com/api/appdetails?appids=671440&l=english)
- Developer replies on the Steam forum (account "Alex, Master Penguin"; the page does not label this account as developer, so ⚠️ treated as probable developer): a bug thread about a contract appearing twice (mission and auction), May 2019. First reply: contracts now work like auctions, companies bid against each other and payouts drop as bidding increases. After a player lost the auction and the signed contract expired with a penalty: "Fixed. All contracts are now with auction, cannot have 1:1 offers anymore." Later: "Contracts are Auctions per region, and PR events are per map." — [Steam thread, May 2019](https://steamcommunity.com/app/671440/discussions/1/1652169858542073842/)
- A moderator in a Jan 2021 thread: "The value you're bidding on IS how much you're getting paid", and bidders tend to underbid each other. — [Steam thread](https://steamcommunity.com/app/671440/discussions/0/5185299686169862094/)
- Payment: the "product price" shown on a contract is the reward itself; delivering to the town hall is not a sale; money arrives only when the whole contract completes (example from the dev: 10 apples at 250% of a 10k normal price pays 250k). The dev called contracts "high risk, high reward" by design and said players should accept only what they can finish; streamers going bankrupt on contracts was intended. — [Steam thread, Dec 2019](https://steamcommunity.com/app/671440/discussions/0/3124866920644349038/)
- Offers are random, not guaranteed: dev reply "Several things need to happen. They are not guaranteed. Keep playing"; players say contracts tend to appear "when products are not available in the inventory". — [Steam thread](https://steamcommunity.com/app/671440/discussions/0/1743346190283577965/) (the "not in inventory" point is a player claim)
- Penalty amount, exact time limits and the cap of three active contracts: ⚠️ only from a search-result snippet of the fan wiki ("time limit, the reward, and the penalties for failing to complete the objective", "Contract list can only hold three contracts"). The wiki page itself returned HTTP 402 and could not be read. — [Fandom wiki, Contracts (community, unread)](https://riseofindustry.fandom.com/wiki/Contracts)
- Experimental patch notes (build label "A11.0:0504d", thread in the game's Patch Notes forum; date not shown on the page): players and AI entities bid on Normal and Settlement Advancement Contracts, Region Permits and Marketing Events; "Buy Permit" became "Start Auction"; the starter automatically bids 100% and wins at 100% if nobody else bids; game speed drops to 1 when an auction spawns; settlements without a permit owner do not spawn advancement contracts and show "Waiting on Sponsor". — [Steam patch notes thread](https://steamcommunity.com/app/671440/discussions/4/1815422173033520728)
- Failure outcomes seen in threads: unwon auction voids a signed mission contract with a "Contract expired" alert and a penalty (May 2019 thread above); a separate fine event is paid automatically over 12 months and carries no interest. — [Steam thread, May 2019](https://steamcommunity.com/app/671440/discussions/0/1652169858530587995/)

**Auction effects (the "PR event" and permit layer)**
- Scope: 2019 thread: a town starts an auction but the effect applies map-wide unless the event names a town; the winner got the full effect and others a weaker one; a planned change for patch 1.3 would make it winner-only ("you only get the effect if you win the auction"). A player complained a 36% building-cost reduction from a won auction did not seem to apply, and the dev explained auctions are per region and PR events per map since 1.1. The thread does not confirm when these shipped, so current behaviour may differ. — [Steam thread, Auction Bonus](https://steamcommunity.com/app/671440/discussions/0/1651043320663454182/); [Steam thread, May 2019](https://steamcommunity.com/app/671440/discussions/1/1652169858542073842/)

**Own production vs buying; prices**
- Players build an industrial chain to supply what towns demand; "a global supply and demand system sets prices. Towns pay more for scarce goods." Trade routes use trucks, boats, trains or zeppelins. — [Wikipedia, Rise of Industry](https://en.wikipedia.org/wiki/Rise_of_Industry)
- Steam copy: more than 150 products, every step from raw material to end product. — Steam appdetails above.

**How AI rivals compete; takeover; visibility**
- A11.0 notes: each game starts with AI entities acting as rival corporations with most of the player's abilities; they cannot terraform, are immune to events, can research unlocks for free; each has a personality shaping its goals; progress is viewable in the "Entity panel"; "Amount of AI" setting; the baseline price of regions was doubled; planned: removing an AI when its home region's permit is bought. — [Steam patch notes thread](https://steamcommunity.com/app/671440/discussions/4/1815422173033520728)
- Region permits: a player found the AI rejecting every standard offer; dev reply: "Can't change what they offer", keep trying (the AI may only refuse regions critical to it), and the expensive alternative is to buy out the company by acquiring all its stocks, giving you its regions and assets. — [Steam thread](https://steamcommunity.com/app/671440/discussions/0/1643168364667129059/)
- A thread title shows a stock-buying snag: "AI used all their money on permits and now won't place a HQ so I can't buy his shares" (title only, thread not opened). — [Steam discussions list](https://steamcommunity.com/app/671440/discussions/)
- Early-access timeline: a "huge update" adding AI competition was announced just before the May 2, 2019 full release (no design detail in the article). — [GamingOnLinux, Feb 2019](https://www.gamingonlinux.com/2019/02/rise-of-industry-has-another-huge-update-full-release-date-announced/page=1/)

**What was confusing or tedious**
- Contract goods going to the wrong place: warehouse automation sent goods to the market or farmers market instead of the contract destination; fixes were a gameplay-option priority change (Auto-manual-logical to Manual-Auto), disabling automatic warehouse routes, or routing from the producer; players noted the automatic routes are not visible in the UI so they cannot see why goods go elsewhere. — [Steam thread](https://steamcommunity.com/app/671440/discussions/0/1644295067083908376/); [Steam thread, Contract Problems?](https://steamcommunity.com/app/671440/discussions/0/1729828401684206295/)
- Mission-and-auction duplication caused unfair penalties (fixed by auction-only contracts). Early-city contracts demanding Tier 3 goods the player could not yet make; the dev blamed planning. — threads above.
- Player asked how to know a contract's reward before bidding; answer was that the bid is the payout. — [Steam thread](https://steamcommunity.com/app/671440/discussions/0/5185299686169862094/)
- Thread title only: "Is there a way to stop it slowing down during contract bidding?" — [Steam discussions list](https://steamcommunity.com/app/671440/discussions/). The A11.0 notes later added the automatic drop to speed 1 on auction.

**Screens and official screenshots**
- Screens: the Auction panel (starter bids 100%, others undercut), the Contracts list in the town window, the Entity panel, the factory/warehouse panels with destination and route lines. The actual contract/auction window was not among the images I viewed.
- Screenshot list from Steam's own store data (all 1920x1080, page: https://store.steampowered.com/app/671440/Rise_of_Industry/ via https://store.steampowered.com/api/appdetails?appids=671440&l=english). I viewed two, because the fetch tool had already saved a local temporary copy of each when I tried to read them (a slip against the "do not download" instruction; I made no further copies). Neither shows contracts:
  - https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/671440/ss_e893563029cd3b5675a70c7e43907059e4b4e4e9.1920x1080.jpg — wide isometric view of farms, a smoking factory district, a town and harbour. No UI.
  - https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/671440/ss_2b769ca82a50bd798c9b5d67871f32f1a3d6bf2a.1920x1080.jpg — a "Cheese" factory selected: left panel with recipe chain (milk, water to cheese, 25 days) and a product list, coloured route lines on the map, cash at the bottom (-$239.61k), date "Aug 02, Y6", "Prospering" status at top.
  - Not viewed (⚠️ contents unknown; may include contract or auction windows): ss_c3ed94a170c1809e0a6c8894377ab5267ec4b16a, ss_38f033d14c188e985f13d6155b8522d468393760, ss_ff5b2b97af9e7ab608a09ba8d1a9eafc18fed98a, ss_e5d23e8260665cc01f2571b9f1fc5ee66716d234, ss_daf5b773724901f1ea48416ca2972df7553a856b, ss_c43c892cd224ba62afff8cbdaf2907916ffad89b, ss_757e8e990b91e2d999a1045f43781de3b62e4912, ss_96ba45f5bd27e8ef18a8e22fe86567d2ff7279a6 (each at https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/671440/<id>.1920x1080.jpg?t=1762525699).

**Changes over time**
- May 2019 (about v1.0 release): contracts became auctions only. Patch 1.1 (announced by dev, not verified): stocks, region overtake, PR events per map. Patch 1.3 (dev statement): auction effect winner-only. Experimental A11.0 notes: auction panel rework, AI "personality", doubled region baseline price. ⚠️ I could not read an official changelog, so these dates rest on dev forum replies. Rise of Industry 2 released June 3, 2025 (per Wikipedia); ⚠️ I found no source on its contract or rival systems and did not research it. The IP was sold to an unknown buyer in early 2022 (Wikipedia). — [Wikipedia](https://en.wikipedia.org/wiki/Rise_of_Industry)

### Inferences
- The one mechanic that maps directly to a deal board is "the offer is an auction and the rival is a bidder": your price falls as a rival bids, and the winner is decided in a visible panel. That makes rivalry felt without a banner.
- Pay-on-completion plus a penalty on failure is deliberately punishing; the dev's "high risk, high reward" reply shows the team accepts that cash-poor players can be ruined.
- The main confusion came from a hidden layer (automatic warehouse routes) fighting a visible one (the contract destination). A deal system that delivers on a schedule should show what is already committed.

### Gaps
- Exact failure penalty size, contract time limits and how rewards are scaled: wiki page blocked (HTTP 402); no other source found.
- Official patch-note pages for the 1.x series and a developer postmortem/interview: not found. Dev design intent comes only from forum replies.
- How the AI chooses bids and when it launches a takeover: not documented in any page read.
- Whether the 3-contract cap and per-region auctions still hold in the latest build: unverified.

---

## 3. Big Pharma (Twice Circled, published by Positech Games; expansion "Marketing and Malpractice" 2016)

### Takeaway
Big Pharma has no supplier deals. Raw ingredients arrive at a per-item cost you reduce with upgrades, so the rivalry is entirely in the drug market and the patent system: AI companies sell competing drugs, flood the market (prices fall as saturation rises), and file patents that can lock you out of a drug you were already making. Patents and visible price saturation are the two things players actually remembered.

### Cited Findings

**Inputs and procurement**
- Beta design notes (v0.40, 2015, so possibly changed): ingredients are shipped from around the world, each with a per-item cost and specific stats; "Explorers" unlock new ingredients and can be upgraded to lower ingredient costs; scientists unlock machines; advanced machines can cost several times more to run daily. — [Game Wisdom, "Big Pharma: Addicting" (community review, beta)](https://game-wisdom.com/?p=13372)
- Each raw material has effects that show only in a certain concentration range on a 0-to-20 scale; some formulas need a catalyst. — [Wikipedia](https://en.wikipedia.org/wiki/Big_Pharma_(video_game))
- The Marketing and Malpractice expansion (April 26, 2016) adds "stock gates": production halts at a set stock level (example: "halt production if we already have 100 boxes"), so one ingredient can feed several lines through branching conveyors as stock and prices change. — [Positech blog post](https://www.positech.co.uk/cliffsblog/2016/04/26/big-pharma-just-got-bigger-and-more-pharmier/)
- The Steam store page does not mention suppliers or patents. — [Steam store (official)](https://store.steampowered.com/app/344850/Big_Pharma/)

**How market prices move and how it is shown**
- Demand shifts with the season (a cold remedy may sell poorly in summer). — [Steam appdetails (official)](https://store.steampowered.com/api/appdetails?appids=344850&l=english)
- Beta note: the cure screen shows each known cure's cost and demand; starting cures, demand and prices are randomised per scenario; side effects lower a drug's value. — [Game Wisdom (beta)](https://game-wisdom.com/?p=13372)
- Community, citing the wiki: a drug's Cure Rating (S+ to F) changes its price, an E gives -20% and an A +20% (average rating C gives no bonus); competitors flooding the market with cheap drugs saturates it and drops prices; one player's single line of 30 liver-disease pills pushed saturation above 500% and the price to 0. — [Steam thread "Marketing & Sales" (community, Sep 2015)](https://steamcommunity.com/app/344850/discussions/0/520518688951336366/)
- Over-saturation in long games: a player reached the 14-year goal and found markets stayed saturated; developer (Twice Circled): the long-term oversaturation mechanics "fall down a bit" with three AIs and would be reviewed in a balance pass; a 2020 poster says demand drops about 1.0 per decade so small scenarios become unplayable past 20-30 years. — [Steam thread (community, 2015 and 2020)](https://steamcommunity.com/app/344850/discussions/0/483367798515815515/)
- The expansion lets you set your own price per drug, stockpile, sell at a loss to undercut rivals, or charge a premium; adds advertising, corporate gifts and sales executives. — [Positech blog post](https://www.positech.co.uk/cliffsblog/2016/04/26/big-pharma-just-got-bigger-and-more-pharmier/). Wikipedia describes executives that "manipulate and corner the market". — [Wikipedia](https://en.wikipedia.org/wiki/Big_Pharma_(video_game))

**How AI rivals compete (market and patents)**
- Rival firms release their own prescription drugs which can reduce your profits; an existing product can make a new one harder to sell. — [Wikipedia](https://en.wikipedia.org/wiki/Big_Pharma_(video_game))
- The AI can affect pricing (a thread reply confirms; community). Players also claim the AI cannot go bankrupt and ignores saturation, and that one early game had the AI holding ten patents and over $1 million profit in year one while the player had three medicines. — [Steam thread "AI has tremendous advantage" (community)](https://steamcommunity.com/app/344850/discussions/0/520518688940746578). A different thread says the AI "doesn't cheat beyond lacking a factory size limit", citing the developer; this second claim is a player quoting the developer, unverified.
- Patents (community threads, with a developer reply):
  - A patent covers the active effects plus the delivery form; you can sidestep one by switching a pill to a cream or syringe, or by adding a side effect. Patents cannot be renewed after expiry. — [Steam thread "Patents - Game Breaker" (community)](https://steamcommunity.com/app/344850/discussions/0/520518053442765849/)
  - Developer (Twice Circled) replied in that thread offering a mod to disable patents; custom games can adjust patent cost and time or turn patents off. — same thread, and [Steam search summary of "Are Patents Anti-Fun"](https://steamcommunity.com/app/344850/discussions/0/520518053447819104/)
  - Short 12-month patents are cheap and take about three months to draft, so they are recommended for critical cures; one guide says to patent a new cure on a spare line to push rivals out of a market. — [Steam guide, "General Tips and Tricks" (community, removed-for-guidelines notice shown)](https://steamcommunity.com/sharedfiles/filedetails/?id=513017406)
  - The patent mechanic is described in a thread as there "to add an interesting way of cutting out the competition from a market" rather than imitating real life; that quote reached me only via a search snippet, so ⚠️ attribution (developer or player) is unconfirmed.
- Visibility: patent notices arrive "with no warning" (complaint, 55-comment thread); suggested fixes were a warning period of about three months, a way to contest a patent, or limiting patents to drugs not already made. Another player used two patents to cripple an AI early and found it did not drive the AI out of business and cost money. — [Steam thread "Are Patents Anti-Fun" (community, 15 of 55 comments seen)](https://steamcommunity.com/app/344850/discussions/0/520518053447819104/)

**Takeovers and buy-outs**
- None found. Rivals do not buy the player or suppliers in the sources read.

**Developer commentary**
- Designer Tim Wicksteed says he wanted the game to "speak with its systems" and avoided narrative dilemmas; ingredients are the base of the planning puzzle. — [Game Developer, "How Big Pharma speaks with its systems"](https://www.gamedeveloper.com/business/how-i-big-pharma-i-speaks-with-its-systems)
- The sales article is only about return on investment and publishing, not design. — [Game Developer, sales analysis](https://gamedeveloper.com/business/an-analysis-of-big-pharma-s-sales-results)
- Beta review: the competitor AI "performed basic actions but did not truly compete with the player"; worried late game would feel like the early game. — [Game Wisdom (beta, 2015)](https://game-wisdom.com/?p=13372)

**Screens and official screenshots**
- Screens: the cure/market screen (cost, demand, saturation, rival products), the patent notice, the factory floor (machines, conveyors, stock gates), pricing window (expansion).
- Steam store screenshot IDs, from https://store.steampowered.com/api/appdetails?appids=344850&l=english (page: https://store.steampowered.com/app/344850/Big_Pharma/). ⚠️ I did not view any of these 12 images, so I cannot say which shows the market or patent screen. Full-size URLs follow the pattern https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/344850/<id>.1920x1080.jpg?t=1793008366 with ids: ss_09a204bd83991a0eeccc88610946072d84ea1539, ss_1791627c95df678db6ddd177cbde14954cc88a08, ss_2906afaa9940cd87b443fdc48ccd15a2141618ca, ss_7b8fa51881ab5be9f49316cce90841a9fac20758, ss_6c07c8017623269568cf75fdcee28fc636925d9f, ss_215049c7874e2fdad9b2b2608d80b304512b2eee, ss_c2a7602ef595e6504e0d65fc238cefd93b4a5e2b, ss_2dd54589a682e2c6e23482c147e520d4bbe6d3c5, ss_49f6ff2a6bbe4700a6709f87aa74b46cad3336e7, ss_69f5698bddfbe056f7327ff4e6e02dde84375a3b, ss_f7297d597f1b976189912308ceda80a9eab1c6bd, ss_b9c4b6ca40c93e25c387e1af7784ac336c359f36.

### Inferences
- Patents are the clearest "rival grabs something you rely on" mechanic in these three games, and the community's workaround (change the delivery form) shows the player needs an escape route that costs something but is not a wall. The pain was surprise; players asked for advance warning and a way to contest.
- Saturation as a visible number per product explains rivalry without naming a rival. The long-game complaint (price never recovers) is a warning for any shared-capacity or shared-price meter.
- No supplier layer exists, so Big Pharma offers little on supplier deals; value is in patents, saturation and price-setting.

### Gaps
- Official or fan-wiki pages (Fandom Big Pharma Wiki returned HTTP 402) for exact patent costs, durations, saturation formula and ingredient price ranges: not read. Hence the 12-month/3-month figures come from a player guide.
- Chemistry World and TechRaptor reviews: Chemistry World page returned only headline/byline; TechRaptor HTTP 403. Not read.
- Whether the base game or later patches changed AI patenting: no patch notes found.

---

## Coverage

**Opened and returned the page's content (read through the fetch tool's page summary; I consider these read to the end unless marked):**
- capitalismlab.com: home (link list), /beginners-guide-gameplay-basics/, /new-content/supply-management-tools/, /improvements/improved-ai/, /new-content/stock-market-enhancement/, /improvements/natural-resources/, /version125/, /new-features/enhanced-macroeconomic-simulation/, /new-content/warehouse/, /improvements/improved-gameplay-balance/. /resources/gameplay-faq/ opened but contained none of the relevant Q&As. /beginners_guide/ and /recent-versions/ returned mostly menu/title lists, not article text (so only partially useful).
- capitalism2.com forum: viewtopic t=3387 (full, 3 posts), viewtopic f=11 t=3982 (2 posters). Steam guide 2969285443 (community).
- Steam: Big Pharma store page and appdetails; Rise of Industry appdetails (screenshots, copy); Steam threads 1652169858542073842, 1651043320663454182, 5185299686169862094, 1729828401684206295, 1644295067083908376, 3166568651723823188, 1815422173033520728 (patch notes), 1643168364667129059, 1743346190283577965, 3124866920644349038, 1652169858530587995; discussions index (titles only); Big Pharma threads 483367798515815515, 520518688951336366, 520518053442765849 (15 of 17 comments), 520518053447819104 (15 of 55 comments), 520518688940746578; guide 513017406 (community, flagged as removed and "coming soon" sections missing).
- Wikipedia: Big Pharma, Rise of Industry, Capitalism (video game). Positech blog post (Apr 2016). Game Developer: both Big Pharma articles. Game Wisdom (beta review). GamingOnLinux (Feb 2019). waytoomany.games (ROI preview; no contract content). Steam store page for Rise of Industry (copy only).
- Two Rise of Industry screenshot JPEGs viewed (see Section 2).

**Partially read or ⚠️:**
- Steam threads 1729828401684206295 and 1644295067083908376 as summarised; Big Pharma threads showed only part of long threads (15 of 55, 15 of 17 comments).
- Steam store pages did not expose screenshot galleries in page text; screenshot URLs come from the Steam appdetails endpoint (JSON).
- Capitalism Lab "supplier selection" and other image descriptions come from official alt text only (not viewed).

**Could not be reached:**
- riseofindustry.fandom.com/wiki/Contracts (HTTP 402; only a search snippet was seen); bigpharma.fandom.com (HTTP 402); rise-of-industry.fandom.com (HTTP 402).
- GameSpot Capitalism II review (403); TechRaptor Big Pharma review (403); Chemistry World expansion review (body missing).
- Capitalism Lab Steam store page (not found; capitalismlab.com/manual/ returned 404; no PDF manual found). Steam app 916440 (opened by mistake) is Anno 1800 and was not used.
- Pages in the Capitalism Lab menu but not opened: Batch Switching Supplier and Redirect Supply Links detail pages, IPO, Privatization, Acquiring a Private Company, Pinned Windows (Supply Chain Insights), Version 12.0.
- Searches for Rise of Industry developer interviews or postmortems and Big Pharma patent/AI design docs returned nothing usable. Several web searches returned irrelevant material; no claim here rests on those.

**Process note:** no email address or personal identifier was sent to any service. One slip: while trying to view two Rise of Industry screenshots the fetch tool saved temporary copies to the session tool-results folder; I did not download any other images.
