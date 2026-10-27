# Compute and server capacity in tech-company and AI-lab tycoon games (as of 2026-10-26)

How to read this note. One section per game, most useful first. Each game section has: Takeaway, Cited Findings (grouped by the key questions: getting capacity, split and shortfall, price and market, rivals, reception, the screen, screenshots), Inferences, Gaps. A "Cross-game takeaways" section follows, then "Coverage". Every ⚠️ marks a claim resting on less than the whole source.

Games chosen (the real titles that exist, 2026): Startup Company (Hovgaard Games, released), Scaling Laws (HCK Labs, free alpha on itch.io, the closest match to Game Night), LLM Tycoon (Futt Studio, demo out, game unreleased), COLD AISLE: Data Center Tycoon (Velmirestudios, released 2026-08-28), recursion::alignment (alignment.inc, demo out), AI Lab Tycoon (BT Games, planned 2026-11-18). Titles checked and set aside are at the end of the Cross-game section.

Important tool caveat: for most Steam and itch.io pages I read the raw page text myself (downloaded with curl and stripped to text) or the Steam public store API and Steam News API. Where I used the WebFetch tool, it returns a model-written summary, not the page; those items are flagged in Coverage.

---

## 1. Startup Company (Hovgaard Games, Steam app 606800)

### Takeaway
The only game here with a long, documented history of a hosting system. Capacity is a single number (CU, compute units) produced by racks you build and tune yourself; running short shows up as a capacity percent and a response-time figure, and players call the hosting part "busy work". Rivals are passive: they exist to be bought out, and the only active moves are poaching offers and random events.

### Cited Findings

**Status and dates**
- Developer Hovgaard Games; full release 10 Apr 2020 after Early Access from 2017. — [Steam store API, app 606800](https://store.steampowered.com/api/appdetails?appids=606800&l=english)
- Latest Steam news post is 11 Apr 2023 ("Steam Deck-optimized version"); the latest numbered version post in the feed is "Version 1.18" on 24 Feb 2021; the studio moved on to Big Ambitions (Early Access 10 Mar 2023). The Steam news feed returned 100 items, so older ones are cut off. — [Steam News API](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=606800&count=100&maxlength=0&format=json) (title list read; ⚠️ only ~12 posts read in full, rest scanned by keyword)
- The pinned "Suggestions Thread" on the community hub shows activity on 27 Dec 2025, so the community is still alive; the game itself has had no developer update I could find since 2023. — [Steam Community discussions](https://steamcommunity.com/app/606800/discussions/)
- Steam score today: Very Positive, 80% of 2,899 English reviews. — [Steam store page](https://store.steampowered.com/app/606800/Startup_Company/?l=english)

**Getting capacity: buy, rent, build, and the terms**
- Beta 16 (25 Jun 2018, "biggest update yet") rewrote hosting. Three new hosting buildings (rented), where only hosting equipment may be placed; a rack is clicked to configure it. "Virtual Servers will continue to be part of the game, but a maximum CU cap will be implemented to force players into building their own hosting facilities." — [Beta 16 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2499943313644354101)
- Hotfix 16.6 raised the basement hosting building cost from 10k to 20k "to avoid new players renting the wrong building". A "Large Hosting Center" was added later (30x30 grid, initial temperature 10 degrees, the biggest and most expensive building). — [Beta 16 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2499943313644354101); [Devlog #20](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2499943313632932740)
- Three server types: web, database and cache. Each produces a specific throughput; "You'll have to balance these server types to get the most out of your hosting facility." Servers can be overclocked and produce heat. — [Devlog #17](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/3822871998313458911)
- The developer confirmed on the forum: "Lowest value sets the produced CU" (of the three throughputs). — [Steam thread "Jonas! Can we get an explanation of the new server setup?"](https://steamcommunity.com/app/606800/discussions/0/1727575977542193508/)
- Rack sizes announced for Beta 20: small 10, medium 20, large 42 units. Beta 20 (4 Jan 2019) added two big server types ("XServers", more heat and more power per throughput) and the Centralized Clockrate Controller (CCC): one unit controls the clock rate of up to 500 servers; example rule "if you reach 90% overall CU usage, the CCC will change the clockrate from 50% to 100%". Purpose stated: defend against DDoS and viral boosts. — [Devlog #32](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2415514774182914035); [Beta 20 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2417770561715109993)
- Devlog #34 describes the CCC interface: clock rate 0% normally, a rule triggers at 100% usage, and servers shut down again below 50%. — [Devlog #34](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2417769111294816363)
- Late-game gear: Fusion Server (first server making all three throughput types; expensive, hot) came with a "Tidal Power" investment project: $28,000,000 upfront, minimum daily budget $1,200,000 (Beta 29, Feb 2020). — [Devlog #59](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2609208878398734460)
- No delivery delay on hardware, no market price for capacity, no supplier choice found in any post I read; capacity is bought from a fixed catalogue and placed instantly. (Absence in the posts I read, not proof of absence in the game.) — see Gaps.

**Split between uses and what happens when capacity runs out**
- Each website feature needs CU per user ("required CU per user" shown on the features view); disabling features changes CU per user. — [Beta 17 post, incl. hotfixes 17.5 and 17.8](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2444779293791841415)
- Players describe two separate shortfall symptoms: "the percent in brackets" (capacity) and "the ms in front of the bracket" (response time); the forum fix for response time is to raise product efficiency, for capacity to build more balanced racks. — [Steam thread "Server capacities modify?"](https://steamcommunity.com/app/606800/discussions/0/1742227264205926546/) (player advice, not developer text)
- Beta 22 added a "bottleneck alert" in the hosting stats to show which throughput to raise. Rack overlays show name, status (green all OK, yellow reduced performance, red overheat protection) and used units. — [Beta 22 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/3140604542246097950); [Devlog #18](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2396358622000943884)
- Random events (Beta 18): Viral Boost, DDoS attacks on your servers, Poaching, employee raise demands. They only occur above 100K users, and viral boosts only if satisfaction is above 70%. — [Devlog #28](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2447035533305992625)
- I did not find an official statement of the exact user-loss rule when capacity is exceeded (see Gaps).

**Prices and market**
- No price movement or capacity market documented in the posts I read. Beta 16 added investor offers that "instantly transfer you a ton of cash" for a share of your product, to be used to buy competitors. — [Beta 16 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2499943313644354101)

**Rivals**
- Rivals are competitor websites. From Beta 16 you can buy their stock; at 100% ownership you can merge a competitor into your product and take its users; merging takes seven days and "you'll have to prepare your own product for new potential users and server demands before starting the merger" (so a rival move feeds back into capacity). — [Beta 16 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2499943313644354101)
- Rival moves that reach the player: employee poaching offers (a bug fix mentions "employee not to quit if ignoring competitor offer"), and outsourcing bids where "Each competitor has a different level of 'competitiveness'". — [Beta 22 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/3140604542246097950); [Trailer/Outsourcing post, 25 Jul 2019](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/3364670677178951296)
- A top-rated negative Steam review says of competition: "it is just there and does nothing besides waiting for you to bought up." — [Steam reviews, top-rated English](https://steamcommunity.com/app/606800/reviews/?browsefilter=toprated&filterLanguage=english)
- Rivals cannot take hardware or capacity from you in anything I read.

**Reception: what worked, was tedious or confusing**
- Same negative review on "Server Hosting: Just busy work, nothing more", and the background sound is annoying when you place "dozens of duplicated racks". Another review says milestone-driven progression is forced. A positive review lists "setting up your own hosting facility" as one of the investor goals. — [Steam reviews](https://steamcommunity.com/app/606800/reviews/?browsefilter=toprated&filterLanguage=english) (⚠️ read page 1 of the top-rated English list, about 10 reviews, not all 2,899)
- Confusion: players asked what web, cache and database do and how they combine (threads from 2018 to 2020); a player with "a billion servers" says capacity is "always out of wack"; one says "new subscribers [keep] coming always and server capacities cant handle it". The developer replied he would "start looking into a 'help' feature in-game", later shipped as "Help System" (Beta 29). Community solution: build one balanced tall rack and duplicate it. — [Servers ? WTF ?](https://steamcommunity.com/app/606800/discussions/0/3216031607500510540/); [Server Setup](https://steamcommunity.com/app/606800/discussions/0/1744521326156951129/); [Hosting thread](https://steamcommunity.com/app/606800/discussions/0/1741090651244950115/); [Devlog #59](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2609208878398734460) (⚠️ threads read only in their first lines; long threads not read to the end)
- Performance: with 100+ racks the game lagged; code made "80% faster" (Beta 20). — [Beta 20 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2417770561715109993)

**The screen**
- Hosting building view (isometric room of racks, built by drag and drop, with a stats strip along the bottom showing real-time web / database / cache throughput against capacity, plus temperature), a rack configuration view, the CCC rule editor, a city map with a one-click switcher between office and hosting buildings, and the product's "hosting" tab showing hosting expenses. Described from the devlog text; I did not view the images. — [Devlog #17](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/3822871998313458911); [Devlog #18](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2396358622000943884)

**Screenshots (not downloaded; image content NOT viewed, descriptions come from the heading above each image in the post) ⚠️**
- Hosting buildings with rack overlays (post heading "Hosting Buildings"): https://steamcdn-a.akamaihd.net/steamcommunity/public/images/clans/28693489/3dac57da7e3e65d8b549b99e4e7fd1ecdd09d3f0.jpg — from [Beta 16 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2499943313644354101)
- Rack/server configuration (heading "Racks and Servers"): https://steamcdn-a.akamaihd.net/steamcommunity/public/images/clans/28693489/8ada824476bc4dac300ec994e6748282425af962.png — same post
- CCC rule interface (heading "The CCC interface and rules"): https://steamcdn-a.akamaihd.net/steamcommunity/public/images/clans/28693489/53a992ecf2265f78dd58c5ced69483f650f24446.jpg — from [Devlog #34](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/2417769111294816363)
- Nine official Steam store screenshots exist (content unknown, no captions); first one: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/606800/ss_74de0b0d767febb4e7d11406b38e199884f3d678.1920x1080.jpg?t=1727681373 (the other eight are in the store API response) — [Steam store API](https://store.steampowered.com/api/appdetails?appids=606800&l=english)

### Inferences
- The long-run lesson is that a capacity system with several coupled throughputs needed repeated patching (bottleneck alert, help system, CCC) to be readable; players still read it as busy work. A Game Night version should show one number and its cause, not three coupled ones.
- The CCC (a player-written rule that bursts capacity at a threshold) is a pre-announced way to survive a seeded spike without dice; it works because the spike types (viral, DDoS) are named in the UI.
- Random events here are dice, gated by user count; the owner's rule would replace them with a visible calendar.

### Gaps
- Exact user-loss rule at capacity limit, virtual server price per CU, and hosting building rent: not found in official sources I could open (Fandom wiki blocked, see Coverage).
- Whether rivals can ever beat the player to hardware: nothing found, likely no.

---

## 2. Scaling Laws (Marcin "HCK" Firmuga, itch.io, free alpha; Steam release announced)

### Takeaway
The closest design cousin to Game Night: you rent or buy compute, a visible queue forms when you run short, you train and serve models, fourteen rival labs follow dated histories (and one copies you), and rivals can be proposed deals including "buy their capacity". The developer's public notes are an unusually clear record of which displays were missing and what happened when they were added.

### Cited Findings

**Status and dates**
- Free "name your own price" Windows alpha, version 0.7.0, page updated 19 Oct 2026; devlog posts at 2026-09-06 (0.2.0) and 2026-09-13 (0.4.0) read in full; developer says it is the last free build and later builds go to Steam. Rated 5.0 from 9 ratings. Public development since 2 Aug 2026. — [itch.io page](https://hcklab.itch.io/scaling-laws)

**Getting compute: rent, buy, wait, resell**
- Two routes: "Rent compute at cloud prices that lag the market by a hundred and eighty days and own nothing, or buy at roughly a third of the cost per FLOP and absorb the loss yourself." Twenty-two accelerator generations with real ship dates, launch prices, board power; "An accelerator bought on the day it launches is worth about half of what you paid, that same day. It loses another quarter every time a better one ships." — [itch.io page](https://hcklab.itch.io/scaling-laws)
- Delivery delay is a priced option: the BUY order window shows units, unit price, total, delivery date and days; one slider lets you pay "up to half again on the price for up to six sevenths off the wait". The developer states it is "the only place in this game where money buys calendar". — [itch.io page](https://hcklab.itch.io/scaling-laws)
- Physical limits: cabinets fill; "Fill a server cabinet completely and the heat throttles everything in it"; "Seven cards beat eight" because a fan costs a slot. Cabinets do not age but chips get hotter, so a room filled in 2023 loses throughput by 2027. Cabinet colours: white produces nothing, light blue has headroom, green normal, yellow full with no headroom, red past cooling limit and losing work. — [itch.io page](https://hcklab.itch.io/scaling-laws); [0.4.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1662867/040-the-best-strategy-in-my-game-was-cheating-and-i-only-found-it-by-measuring)
- 0.7.0 resale: a research ladder (eight levels, 1% of fleet per day up to 30%) sells idle capacity at half what it cost you; finished, it takes 14.7% off spend, and the developer shows arithmetic that overbuying never pays ("$139.5M against $270.0M"). Motivation was a measured campaign showing serving load at 0% for eight years with capacity 200 to 3,082 times demand and "a fleet bill of $5.8M a day against 4% utilisation", and "Nothing anywhere on screen showed a player that number." — [itch.io page](https://hcklab.itch.io/scaling-laws)

**Split and shortfall**
- "Every token a customer spends costs you real compute... Rent too little and the queue forms, response times climb and people leave. Rent too much and the bill eats the training run you were saving for. There is no correct number on that slider." A government contract "eats capacity your paying customers no longer have." Era-5 state sectors compete with paying users for the same cluster. — [itch.io page](https://hcklab.itch.io/scaling-laws)
- Display fix after a measured failure: a campaign lost three quarters of its audience in a month because a better model was four times heavier to serve and "nothing said so before the run was paid for". The scale page and release window now print "how many people your fleet keeps served on the model you are designing, against what it serves today", amber when the new model would serve fewer. — [itch.io page](https://hcklab.itch.io/scaling-laws)
- Rented versus reserved capacity is shown on a compute-usage screen with the queue. — [itch.io page](https://hcklab.itch.io/scaling-laws) (caption text; image not viewed)
- Training and serving share the cluster: "the cluster still owes the same petaflop-days"; a training run is about 200 days. — [itch.io page](https://hcklab.itch.io/scaling-laws); [0.2.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1654844/020-is-out-state-hands-you-a-country-your-rivals-hire-lawyers)

**Price and market**
- Cloud price lags the market ~180 days; token price falls by about half each half-year; demand saturates; "A company that ships one model and coasts is insolvent inside three years, and an automated test fails the build if that stops being true." Hardware costs also vary by the country you pick (177 countries). — [itch.io page](https://hcklab.itch.io/scaling-laws)

**Rivals**
- Fourteen rival labs, each with a dated history you can open, that "wait, rush and fall over on their own schedule rather than reacting to your score"; "Fourteen rival labs ship alongside you on the dates the real ones shipped." Three collapse during a campaign, from causes tied to your exposures. A dossier opened in 2023 cannot mention a 2024 collapse. — [itch.io page](https://hcklab.itch.io/scaling-laws); [0.4.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1662867/040-the-best-strategy-in-my-game-was-cheating-and-i-only-found-it-by-measuring)
- One lab "builds whatever you are selling rather than following the calendar, so specialising is something a competitor can take off you" (0.2.0). — [0.2.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1654844/020-is-out-state-hands-you-a-country-your-rivals-hire-lawyers)
- Four proposals you can put to a rival: publish together, joint evaluation, license your model through their distribution, **buy their capacity**. "You pay to send the proposal, they answer days later, and a refusal does not give the money back. Each card tells you how likely that lab is to agree before you spend anything." Alliance levels at 90, 180 and 365 days, which decay if neglected. — [itch.io page](https://hcklab.itch.io/scaling-laws)
- Aggressive moves provoke rivals: smear campaign, if traced, brings counsel's call and a notice with a figure and 30 days; refusing is 45% to reach a hearing, ignoring 60%. — [itch.io page](https://hcklab.itch.io/scaling-laws)
- Comparison display: "VS TOP MODEL" in the model creator puts the strongest rival model beside your projection, capability only; the developer refuses to invent rival cost or time because nobody publishes them. — [0.4.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1662867/040-the-best-strategy-in-my-game-was-cheating-and-i-only-found-it-by-measuring)
- Known weakness: in late game one rival holds 84% of served users while the player has 16 thousand (developer's measured three-seed result, "next real piece of work"). — [0.4.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1662867/040-the-best-strategy-in-my-game-was-cheating-and-i-only-found-it-by-measuring)
- Market share uses a nested logit so products from one company share an audience (a shipped fix after "ship the same model over and over under different names" gave 41 times the money). — [0.4.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1662867/040-the-best-strategy-in-my-game-was-cheating-and-i-only-found-it-by-measuring)

**Uncertainty design (relevant to the owner's no-dice rule)**
- Safety verdict is a roll, but telegraphed: "A serious safety incident does not fine you. It opens a file... Five days later the verdict is rolled against the protections that model shipped with... The five days are the point. They are the difference between a hard game and an arbitrary one." Locked controls explain what is missing and point to the research node. — [itch.io page](https://hcklab.itch.io/scaling-laws)

**Reception**
- Itch comments (roughly 20 to 57 days old): praise for depth and interface; one reader calls it "crazy deep"; requests for macOS/Linux; bug reports (crash on office upgrade, autosave, untranslated text). The developer asks players to report "the exact minute you stopped understanding". Very small sample. — [itch.io page](https://hcklab.itch.io/scaling-laws); [0.2.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1654844/020-is-out-state-hands-you-a-country-your-rivals-hire-lawyers)
- Tester feedback notes show the kinds of confusion that appeared (blank panels, silent locked controls, unreachable mechanisms: "Twelve complete mechanisms... a player could not reach at all"). — [0.2.0 devlog](https://hcklab.itch.io/scaling-laws/devlog/1654844/020-is-out-state-hands-you-a-country-your-rivals-hire-lawyers)

**The screen**
- The server room (3D basement with cabinets) plus a compute/serving screen, parts warehouse BUY window, creator "scale" page with served-people line, a rival/phone panel for the four proposals with odds. — [itch.io page](https://hcklab.itch.io/scaling-laws) (from captions)

**Screenshots (not downloaded; descriptions are the page's own captions or alt text, images not viewed) ⚠️**
All are on the page [https://hcklab.itch.io/scaling-laws](https://hcklab.itch.io/scaling-laws).
- "Rented capacity, reserved capacity, and the queue that forms when there is not enough of it": https://pcworkman.dev/hck-labs/scaling-laws/assets/images/anim/compute-usage.webp
- "The parts warehouse: price, delivery date, and the one slider that buys calendar": https://pcworkman.dev/hck-labs/scaling-laws/assets/images/anim/parts-warehouse.webp
- "A cluster at capacity: the response time climbs, the product stops being attractive, and people leave": https://pcworkman.dev/hck-labs/scaling-laws/assets/images/anim/servers-overload.webp
- "The scale stage: how many people your own cluster keeps served on the model you are designing": https://pcworkman.dev/hck-labs/scaling-laws/assets/images/anim/creator-scale.webp
- "Four things you can put to another lab, each with the odds they agree before you spend anything": https://img.itch.zone/aW1nLzMxMDc2MzQ2LmdpZg==/original/dz5%2Bmd.gif
- "The share of the fleet nobody is using, what it costs you every day, and what somebody else will pay for it" (selling spare capacity): https://img.itch.zone/aW1nLzMxMDc2MDAzLmdpZg==/original/PEWscd.gif

### Inferences
- The "buy calendar with money" slider and the "odds shown before you pay" card are both patterns for making a supplier deal a decision with no dice.
- Dated rival histories plus one reactive rival is a ready model for a visible seeded rival schedule (the schedule is the content; the reaction is a single, named exception).
- The developer found that unreadable capacity is a design bug: three of the key fixes (0% utilisation, 4x heavier model, silent locks) were all missing displays, not missing mechanics.

### Gaps
- 0.5.0 and 0.6.2 devlog bodies and the "should have shipped" post were not read. Source code on GitHub not opened, so exact formulas for rival acceptance odds are unknown.
- No Steam reviews yet; sample of players is tiny (9 ratings).

---

## 3. LLM Tycoon (Futt Studio, Steam app 4861430; demo app 5071100)

### Takeaway
A grand-strategy AI tycoon with a chip market and foundries; it advertises "haggle over chips, or sign with a foundry and skip the line", 15 rival companies reacting to you, and a social feed that shows rival moves. Only store text and four dev posts exist; no reviews.

### Cited Findings
- Status: unreleased (store says 2026); demo released 23 Sep 2026 (limited to 3 years of in-game time); latest update 0.8.0.0 on 19 Oct 2026. No user reviews. — [Steam news posts via API](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=4861430&count=30&maxlength=0&format=json); [Steam store API](https://store.steampowered.com/api/appdetails?appids=4861430&l=english)
- Getting compute: "Pick a headquarters. Put datacenters where power is cheap and regulators are friendly. Haggle over chips, or sign with a foundry and skip the line." Features: "datacenters, a chip market, foundries". The v0.3.0 post adds "fab your own chips", "chip foundries, datacenters, and a supply chain you can actually own." 0.7.0 added an energy source per datacenter (six options from coal to solar to small nuclear) which affects carbon footprint, protests, taxes. — [Steam store API](https://store.steampowered.com/api/appdetails?appids=4861430&l=english); [v0.3.0 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1839041357035379); [0.7.0 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1842212951310235)
- Price and market: "Demand, prices, regulation, and market share managed per country"; a chip market and "a global economy cycle swings between boom and recession" (dev post, 61 countries / 102 cities claimed; the store page says 30 countries / 75 cities: conflicting counts, likely scope change or stale text). — [store API](https://store.steampowered.com/api/appdetails?appids=4861430&l=english); [v0.3.0 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1839041357035379)
- Rivals: store text: "Rivals launch their own models, undercut you, and take whatever you leave undefended"; "Rival CEOs with their own models, ideals, and scandals, plus a social feed to broadcast them" (the feed is called Chirp: rival CEOs "hype their keynotes and mock your launches"). Also espionage/hacking minigame to steal research, buy shares in a rival or the whole company, and distil rivals' models with lawsuit risk (rivals can do the same to you). 15 rival companies each with a hidden ideology (v0.3.0 post). Rival behaviour updated in 0.7.0, no details. — [store API](https://store.steampowered.com/api/appdetails?appids=4861430&l=english); [0.7.0 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1842212951310235)
- Split of compute: 0.8.0.0 replaced "CP allocation" sliders with typed values and added a message when "you don't have enough CP for research or model training". CP is not defined in the post (probably a compute or capacity unit, unconfirmed). Notifications were "arriving too often", so a Mute button was added to the Chirp panel. — [0.8.0.0 post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1846651706690038)
- World events "land on their actual dates"; decision chains like EU4. — [store API](https://store.steampowered.com/api/appdetails?appids=4861430&l=english)
- Reception: none (no reviews; demo only 5 weeks old). One signal of tedium: too-frequent rival/world notifications led to the mute button.
- Screen: map-based country view with city names, Chirp feed panel, research tree, CP allocation panel. — from posts above.
- Screenshots (store gallery, content unknown, no captions) ⚠️: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4861430/db67380149e53779bdbb13954ad66e2115e43b1d/ss_db67380149e53779bdbb13954ad66e2115e43b1d.1920x1080.jpg?t=1792751906 (and five more in the API response) — page [store.steampowered.com/app/4861430](https://store.steampowered.com/app/4861430/)

### Inferences
- A rival "social feed" is a way to make each rival move visible and funny; the project itself found it needed a mute switch, so a Game Night feed needs a filter or low frequency.

### Gaps
- No detail on how chip purchases are priced, whether orders are delayed, whether rivals can buy the chips you wanted, or how foundry "skip the line" works: only marketing sentences. I did not play the demo.

---

## 4. COLD AISLE: Data Center Tycoon (Velmirestudios, Steam app 5036820)

### Takeaway
A first-person data-centre builder, released 28 Aug 2026 ($11.99), with negotiated customer contracts, 32 rival companies, a liquidation market that sells insolvent rivals' hardware, and a spare-capacity "AI products" side market. It is the best match for "contracts with terms", but almost nothing is documented beyond the store text and it has one review.

### Cited Findings
- Release 28 Aug 2026; only news post is a tutorial hotfix on 30 Aug 2026; one user review, no score. — [Steam store page](https://store.steampowered.com/app/5036820/?l=english); [Steam News API](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=5036820&count=30&maxlength=0&format=json)
- Getting capacity: "Order hardware, receive deliveries, move racks into position, install servers and GPUs, and connect power and networking yourself." Gear: racks, servers, GPUs, switches, power distribution, cooling, logistics. Hardware condition deteriorates, circuits overload, cooling uses power, incidents can violate SLAs. The first-hour tutorial includes incoming freight and a receiving area. — [Steam store page](https://store.steampowered.com/app/5036820/?l=english); [tutorial hotfix post](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1842212951307673)
- Contracts: "Negotiate price, duration, capacity, peak load, service level, and penalties. Schedule contract starts, run several jobs in parallel, handle follow-up offers, and earn detailed ratings based on measured reliability, performance, response time, value, and service." — [store page](https://store.steampowered.com/app/5036820/?l=english)
- Split: "Use spare infrastructure for simulated AI products. Choose research goals, reserve computing power, set prices, build reputation, and balance this second market against the needs of your hosting customers." — [store page](https://store.steampowered.com/app/5036820/?l=english)
- Rivals: "compete against 32 rival companies. When a competitor becomes insolvent, you can buy unknown lots of hardware from its liquidation." (rival failure releases hardware to the player; "unknown lots" implies you do not see contents before buying). — [store page](https://store.steampowered.com/app/5036820/?l=english)
- Reception: none beyond one unscored review; I did not read it. Screens: first-person facility, contracts and orders terminals. Screenshots (8 store images, unannotated; content not viewed) ⚠️: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5036820/2de0c648375f84fabc91fa70e75fc8cd40e5a581/ss_2de0c648375f84fabc91fa70e75fc8cd40e5a581.1920x1080.jpg?t=1787945958 — page [store.steampowered.com/app/5036820](https://store.steampowered.com/app/5036820/)

### Inferences
- Insolvent-rival liquidation lots are a rival-driven, schedulable supply event (a rival's failure date could be on the visible seeded calendar).

### Gaps
- How rivals are shown, whether rivals bid for the same customers or hardware, and how orders are priced/delayed: not in any source I could open. Demo not tried.

---

## 5. recursion::alignment (alignment.inc; Steam apps 4774420 / 5093000 playtest / 5198240 demo)

### Takeaway
A satirical AI-lab management sim whose store text explicitly describes ordering with delay ("Orders take time to arrive") and datacenter incidents; free demo released 10 Sep 2026, full game "coming soon". Only marketing text and two news posts available.

### Cited Findings
- Dates: playtest ended 10 Sep 2026 and moved to a free demo; a guided "Handover" onboarding mode was added 25 Aug 2026 ("taking over an AI company already in motion", 10 chapters, three in-game months, an "Operations Board"). Full release: "Coming soon". No reviews. — [Steam News API for app 5093000](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=5093000&count=30&maxlength=0&format=json); [store page](https://store.steampowered.com/app/5093000/?l=english)
- Store text: "Buy data, secure compute, hire researchers, choose research paths, and release models before your rivals do." "Commit resources now and live with the queue. Orders take time to arrive, hires need onboarding, and training can finish after the market has already moved." "The world reacts in real time. News cycles, internal Huddle threads, social feeds, and a moving market all respond to what you ship... Regulation becomes a deadline. Datacenter incidents become Mondays." Eight endings, including Debt Spiral and Acqui-hire. Events listed: "AI winter, regulation, datacenter incidents, competitor moves, and public sentiment". — [store page](https://store.steampowered.com/app/5093000/?l=english)
- Rivals appear only as a race ("before your rivals do") and as "competitor moves" events surfaced through News and Huddle feeds. — same page.
- Screenshots (8 official images, unannotated, content not viewed) ⚠️: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4774420/1476ce119a526249d7c254b934fceb57af6dda17/ss_1476ce119a526249d7c254b934fceb57af6dda17.1920x1080.jpg?t=1789691043 (page: [store.steampowered.com/app/5093000](https://store.steampowered.com/app/5093000/), which carries the images under app id 4774420)

### Inferences
- Its "news / Huddle feed" is a rival-visibility channel similar to Chirp in LLM Tycoon; both are text feeds, not panels.

### Gaps
- No pricing, delivery lengths, supplier choice, or rival hardware competition documented. Demo not played.

---

## 6. AI Lab Tycoon (BT Games, Steam app 5015590)

### Takeaway
Announced, not out. The page promises limited compute, an explicit "talent or compute" spend choice and a rival-lab tracker, but gives no mechanics.

### Cited Findings
- Planned release 18 Nov 2026; demo available; no news posts; no reviews. Tags include Real-Time with Pause. — [Steam store page](https://store.steampowered.com/app/5015590/)
- Text: "Do you spend on brilliant talent or the compute they need?"; "Acquire compute and decide where every GPU matters most"; "Track rival labs and adapt as the competitive landscape shifts"; victory by AI dominance or a race to ASI; "a strong launch can change your trajectory. A mistimed bet can leave rivals racing past you." — [Steam store API](https://store.steampowered.com/api/appdetails?appids=5015590&l=english)
- Screenshots (8 store images, unannotated, not viewed) ⚠️: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5015590/43767a92a857c8c1eb7ff900df38a89c4eb4e903/ss_43767a92a857c8c1eb7ff900df38a89c4eb4e903.1920x1080.jpg?t=1791645992 — page [store.steampowered.com/app/5015590](https://store.steampowered.com/app/5015590/)

### Gaps
- Everything mechanical. Demo not played.

---

## Cross-game takeaways (inferences, for the designer)

- Every game that makes capacity feel good shows one readable number for demand against capacity and states a model's serving cost before you commit (Scaling Laws' "people served on this model" line; Startup Company needed a bottleneck alert and help system).
- Rival visibility is mostly a feed: a dated dossier (Scaling Laws), a social feed (LLM Tycoon's Chirp), News and Huddle (recursion::alignment). Only Scaling Laws makes rivals into counterparties for capacity ("buy their capacity", with acceptance odds shown), and only COLD AISLE advertises a rival's failure freeing hardware (liquidation lots). No game I found lets a rival take the specific deal you wanted; that is open space for Game Night.
- Delivery delay appears as a purchasable option (Scaling Laws slider), an advertised constraint (recursion::alignment "Orders take time to arrive") and a freight/receiving step (COLD AISLE). Startup Company has none.
- Telegraphed uncertainty examples without dice: Scaling Laws' dated rival histories and its five-day verdict window; Startup Company's CCC rule against named spike types. Startup Company's own random events are dice.
- Pitfalls the developers reported: unreadable utilisation, hidden serving cost of a bigger model, an exploit from duplicated products, notification overload (LLM Tycoon mute), and hosting felt as "busy work".

Titles checked and set aside (reasons):
- AI Magnate (itch.io, Magnate Games, released 22 May 2026): lists compute management and rivals Titan Systems and NovaCore, but no compute detail on the page; one commenter toggled the API and "hit with -10m developers... bankrupting myself instantly"; developer promised a patch. Rating 2.5 from 2. — [itch.io page](https://magnate-games.itch.io/ai-magnate)
- HYPERSCALE (itch.io, r0ck3tman84, 14 Jul 2026): tap-to-earn idle comedy; GPUs and coolant bought with cash, rivals "ship models at the worst possible moment"; no deal or capacity structure. — [itch.io page](https://r0ck3tman84.itch.io/hyperscale)
- Data Center (Waseku, Steam, 31 Mar 2026): customers arrive with capacity targets, hardware ages and fails, reputation attracts bigger clients; no rival companies in the description; 76% of 992 reviews positive; latest update 1.1.12 on 9 Oct 2026. — [Steam store API](https://store.steampowered.com/api/appdetails?appids=4170200&l=english); [Steam News API](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=4170200&count=8&maxlength=0&format=json); [store page](https://store.steampowered.com/app/4170200/?l=english)
- AI Startup Manager: Race to AGI (Sivas Games, 2027): "divide scarce resources between capability and safety", track rival labs; no detail. — [Steam store API](https://store.steampowered.com/api/appdetails?appids=5275840&l=english)
- AI TYCOON (Icarus Games, Steam 5075960, Q1 2027): "Randomized market trends, tech routes, and rival strategies" (so dice-based) and "rival ambushes". — [Steam store API](https://store.steampowered.com/api/appdetails?appids=5075960&l=english)
- AI Lab (browser idle game, EA Forum post): rivals planned for a later phase; compute acquisition not described. — [EA Forum post](https://forum.effectivealtruism.org/posts/JQRYfHNaEFdBvkrvR/ai-lab-browser-idle-game-about-training-ai-models-looking) (⚠️ read as a WebFetch summary only)
- AI Tycoon (gravity-3d, itch.io): marketing blurb only, "Multiplayer Marketplace"; in development. — [itch.io page](https://gravity-3d.itch.io/ai-tycoon)

---

## Coverage

Read to the end (raw text I downloaded and read myself unless noted):
- Steam store API JSON for apps 606800, 5015590, 5036820, 5075960, 4861430, 5275840, 4170200, 5198240 (descriptions complete; screenshot URL lists).
- Steam store HTML pages for 606800 (review summary line only), 5036820 (full), 5093000/4774420 (full "About" text), 5198240, 4861430 (about text), 4170200 (review line only).
- Steam News API feeds: 606800 (100 items returned; titles for all; full text read for Beta 16, Beta 20, Devlog #9, #16, #17, #18, #20, #28, #32, #34, #59 (partial hosting paragraphs), full-release post (first ~5,500 characters); others scanned by keyword only ⚠️), 5036820 (1 post), 5093000 (2 posts), 4861430 (4 posts), 4170200 (titles only ⚠️), 5015590 and 5075960 (no posts).
- itch.io: Scaling Laws main page (entire), devlogs 0.4.0 and 0.2.0 (entire), AI Magnate page (entire), HYPERSCALE page (entire), AI Tycoon gravity-3d page (entire).
- Steam community: Startup Company discussion index page; thread pages for "Hosting" (15 comments), "Server Setup" (6), "Servers ? WTF ?" (17), "Jonas! Can we get an explanation..." (4), "Server capacities modify?" (2).

Partly read (⚠️):
- Startup Company forum threads: I printed only the first ~80 lines or ~900 characters per post, so the later comments of the longer threads were not read.
- Startup Company reviews: one page of the top-rated English list (about 10 reviews), not the 2,899.
- Startup Company news feed: only 100 newest items returned by the API; the 2018-01 to 2023 range is covered by title only for most items.
- Scaling Laws devlogs 0.5.0 and 0.6.2 and "It should have shipped a month ago" and "She took notes on paper": downloaded the 0.5.0 and 0.6.2 pages but my extraction cut off their bodies; not read. GitHub repo and pcworkman.dev pages: not opened.
- Summaries via the WebFetch tool (a model's summary of the page, not the page): the first pass on Scaling Laws and HYPERSCALE (superseded by raw reading), incrementaldb.com's AI Magnate page (used only for the release-date conflict: incrementaldb says 23 May, itch.io says 22 May), the EA Forum "AI Lab" post (author claim that rivals are planned; ⚠️ not read raw).
- Web search result snippets only (pages not opened): Data Center review counts from stmstat/gg.deals (superseded by the Steam page's 76% of 992), Japanese coverage (ITmedia, Denfaminicogamer) of Data Center, kotaku.com and nodal.gg pages for recursion::alignment and AI Lab Tycoon, gg.deals pages for AI Lab Tycoon and LLM Tycoon, TV Tropes and Game*Spark/Automaton pages for Startup Company's release date (the Steam API date, 10 Apr 2020, is used instead; sources conflict: 11 Apr and 20 Apr in the snippets).

Could not reach:
- Startup Company Fandom wiki (HTTP 403 by curl, 402 by WebFetch). No wiki data used.
- Reddit (r/startupcompany, r/LLMTycoon): blocked (403 and blocked in search); no Reddit evidence in this note.
- Hovgaard Games' own blog and website were not tried; I used the Steam-hosted devlogs, which the studio posted.
- Screenshot contents: no image was downloaded or viewed (per instruction), so every "what it shows" line is from captions, alt text or the heading above the image; Steam store images have no captions.
- No game was played; demo builds for LLM Tycoon, AI Lab Tycoon, recursion::alignment and COLD AISLE were not tried.
- Steam reviews exist in meaningful numbers only for Startup Company and Data Center; the other games have zero or one review.
- No email address was entered into any request. One itch.io comment and one Steam publisher block contain emails; I did not use or copy them.
