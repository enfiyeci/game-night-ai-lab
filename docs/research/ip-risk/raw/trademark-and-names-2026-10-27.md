> Raw subagent output (2026-10-27), kept for provenance. Not re-verified line by line; the claims the report relies on were traced by the orchestrator (see ../README.md).

# Raw research: store-name risk for "AI Lab Tycoon" (trademark, collisions, candidates)

Collected 2026-10-27. This is research for a risk report, not legal advice. Every number below comes from a tool result in this session. Where I saw only part of a source, the claim carries a warning sign (⚠️) and says what was missing. "Not found" means I searched and saw nothing; it does not prove absence.

Method notes:
- Apple (iTunes Search API), Steam (store search JSON and appdetails API), Google Play (search page and app detail pages), itch.io (search page), Trademarkia (a mirror of USPTO data), WIPO Global Brand Database and TMview (EUIPO's multi-office search) were reached. Justia and uspto.report block scripts (Cloudflare / HTTP 403) and I did not try to get around that.
- No email address was put in any lookup. (The Steam page lists a support email for BT Games; I did not use or copy it.)
- The iTunes API rate-limited me (HTTP 403) partway through; I re-ran the failed calls after a cool-down, and the final re-run had 0 failures (22 of 22 calls OK).

---

## 1. Steam game "AI Lab Tycoon" (BT Games)

Sources: https://store.steampowered.com/app/5015590 , https://store.steampowered.com/api/appdetails?appids=5015590&l=english

| Field | Value |
|---|---|
| Exact title | AI Lab Tycoon |
| App id | 5015590 |
| Developer / publisher | BT Games / BT Games |
| Release | Not yet released. Planned release date "Nov 18, 2026" (the page says it "plans to unlock in approximately 3 weeks") |
| Demo | "AI Lab Tycoon Demo", app 5362590, free, released Oct 7, 2026 (https://store.steampowered.com/api/appdetails?appids=5362590). Developer and publisher also BT Games |
| Platforms | Windows, Mac, Linux |
| Price | Not found. No price is shown on the page and the API has no price_overview field (pre-release) |
| Categories / genres | Single-player, Family Sharing. Genres: Indie, Simulation, Strategy |
| User tags (from the page HTML) | Management, Simulation, Strategy, Economy, Artificial Intelligence, Resource Management, Capitalism, Real-Time with Pause, Singleplayer, Choices Matter, Sandbox, 3D, Isometric, Futuristic, Stylized, Indie, Story Rich |
| Languages | English, French, German, Spanish (Spain), Portuguese (Brazil), Simplified Chinese, Spanish (Latin America) |
| Website field | null (none). No Twitter/Discord/YouTube/social link found on the page |
| Legal notice field | none |

Short description (Steam API): "AI Lab Tycoon drops you into the infancy of the AI revolution in 2016. Starting with nothing but a check from a skeptical investor, you'll build an empire of superintelligence over the course of two decades. Can you lead the greatest technological revolution in human history?"

Long description (summary of the API text): tagline "Start in mom's garage. End by changing the world." You start with a tiny team and limited compute and grow into an empire of "compute, intelligence and business" while surviving burn rate, reading the market and staying ahead of rival labs. Listed features: recruit a research team; acquire compute and assign GPUs; train, evaluate and release AI models; turn breakthroughs into products; funding offers, runway, equity, reputation; a connected tech tree with four office tiers; track rival labs; multiple paths to victory ("AI dominance or the race to ASI").

Developer research:
- Steam search by developer "BT Games" (https://store.steampowered.com/search/?developer=BT%20Games) returns only two items: AI Lab Tycoon and AI Lab Tycoon Demo.
- Steam news feed for the app (https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=5015590) returned 0 posts.
- Developer website: not found. Web searches (two, including one for website/Discord/Twitter/Reddit) found only the Steam page, GameFAQs, IsThereAnyDeal, Metacritic, GG.deals and Nodal listings. These aggregator pages were seen as search snippets only (⚠️ not opened); the snippets disagree on date (GameFAQs "TBA 2026"; IsThereAnyDeal a Dec 31, 2026 entry; Nodal "2026"). Steam's own page (Nov 18, 2026) is the one to trust.
- Note: https://store.steampowered.com/developer/btgames resolves to a Steam page titled "Brave Traveller Games" (link to bravetravellergames.co.uk). I have no evidence this is the same company as BT Games; do not assume it is.
- Mobile (iOS/Android) version announced: not found. Nothing on the Steam page or news, and iTunes search for the artist "BT Games" returned no apps (https://itunes.apple.com/search?term=BT%20Games&entity=software). ⚠️ The Steam store page HTML was parsed by script (tags, purchase block, links), not read line by line.

### Other things named "AI Lab Tycoon" (not BT Games)

1. **AI Lab Tycoon: Misaligned**, Android idle game, Google Play id net.gravenguy.ailabtycoon, developer shown on Play as "Graven Guy Games", site footer says "Gravenpall". Free, one optional ad-removal purchase. Site: https://ailabtycoon.com/ . The site's FAQ says: not on iOS yet ("Android-only via Google Play"); a browser demo exists; and "Is this the same as the browser game 'AI Lab Tycoon'? No... Other unrelated games share a similar name." Source: https://play.google.com/store/apps/details?id=net.gravenguy.ailabtycoon
2. **AI Lab Tycoon: Frontier Lab**, Google Play id com.coddykit.frontierlab, developer Coddykit. Source: https://play.google.com/store/apps/details?id=com.coddykit.frontierlab (title and developer only; ⚠️ rest of page not read).
3. **AI Lab Tycoon** browser game at https://aitycoon.org/ , author Sidharth Rath (per the page's structured data), free, "Web Browser" platform, described as building "a full-stack AI company... across a ten-year industry cycle". The page is a JavaScript app; I read its HTML head (3.9 KB, whole file) but not the game itself.

---

## 2. App Store (iTunes Search API) results

Queries: term "AI Lab Tycoon" with entity=software and entity=iPadSoftware, limit=50, countries US, GB, DE, TR (files fully parsed). Then 6 more terms ("AI Tycoon", "Lab Tycoon", "AI Company", "AI Startup", "AI Lab") across the same 4 countries and 2 entities (limit 50). The API returns at most ~47-50 results per query, so this is a sample, not a full census.

**No iOS app is named exactly "AI Lab Tycoon"** in US, GB, DE or TR.

Apps whose names contain "AI Lab", "AI Tycoon", "Lab Tycoon", "AI Company" or "AI Startup" (36 unique apps; developer; release date in the US/first storefront seen; URL):

Closest or most game-like (these are the real competition on iOS):

| Name | Developer | Released | URL |
|---|---|---|---|
| Lab Tycoon: AI Startup Sim (DE title "Lab Tycoon: KI-Startup-Sim") | Brandon Kessinger | 2026-08-06 (DE shows 2026-09-22) | https://apps.apple.com/us/app/lab-tycoon-ai-startup-sim/id6787330715 |
| Token Tycoon: AI Lab Idle | Donovan Ladd | 2026-06-25 | https://apps.apple.com/us/app/token-tycoon-ai-lab-idle/id6782170689 |
| AGI Tycoon: AI Lab Sim | Matthis Damm | 2026-08-29 | https://apps.apple.com/us/app/agi-tycoon-ai-lab-sim/id6765854956 |
| AI Tycoon: Garage to Glory | TOCLOCO LTD | 2026-06-23 | https://apps.apple.com/us/app/ai-tycoon-garage-to-glory/id6782096428 |
| AI Tycoon: Idle Datacenter | Flashport GmbH | 2026-09-17 | https://apps.apple.com/us/app/ai-tycoon-idle-datacenter/id6812299575 |
| Idle AI Tycoon: Tech Empire | Tapinator, Inc. | 2026-03-28 | https://apps.apple.com/us/app/idle-ai-tycoon-tech-empire/id6755682270 |
| AI Company: Startup Simulator | AVALANCHE GAMES PTE LTD | 2024-11-17 | https://apps.apple.com/us/app/ai-company-startup-simulator/id6496848949 |
| AI Startup CEO | IndieCraft LLC | 2026-04-15 | https://apps.apple.com/de/app/ai-startup-ceo/id6761347044 |
| AI Labz: Idle Tycoon (DE "Aufbau", TR "Empire") | guy hass | 2026-08-24 | https://apps.apple.com/de/app/ai-labz-idle-tycoon-aufbau/id6800757844 |
| Idle AI Lab | Sina Amini | 2026-10-13 | https://apps.apple.com/us/app/idle-ai-lab/id6793738983 |
| Singularity: AI Tycoon | Behrooz Zakeri | 2026-07-29 | https://apps.apple.com/us/app/singularity-ai-tycoon/id6779670540 |
| NovaTech: AI Tycoon | MARECHAL OLIVIER EURL | 2026-04-07 | https://apps.apple.com/us/app/novatech-ai-tycoon/id6761391381 |
| Vibecoding Idle: AI Tycoon | TODAUD | 2025-10-15 | https://apps.apple.com/us/app/vibecoding-idle-ai-tycoon/id6753848492 |
| AI Outbreak: AGI Tycoon | Andres Wetzel | 2026-03-12 (seen in GB only) | https://apps.apple.com/gb/app/ai-outbreak-agi-tycoon/id6760188493 |
| M&A Story: AI Tycoon | k-zero | 2026-10-26 (seen in TR only) | https://apps.apple.com/tr/app/m-a-story-ai-tycoon/id6825024650 |
| Labmaster: Idle Lab Tycoon | jaehyun pung | 2026-06-23 | https://apps.apple.com/us/app/labmaster-idle-lab-tycoon/id6781914533 |
| The AI Company | Suwitcha Sugthana | 2026-06-10 (GB only) | https://apps.apple.com/gb/app/the-ai-company/id6777710816 |
| YAAiLab - Yet Another AI Lab | Amir Mohammad Ghorbanzadeh | 2025-09-29 | https://apps.apple.com/us/app/yaailab-yet-another-ai-lab/id6751012892 |
| Car Factory - AI Tycoon Sim | LudosLabs | 2021-10-22 | https://apps.apple.com/us/app/car-factory-ai-tycoon-sim/id1578453426 |

Other apps matching the words but not games (productivity, education, etc.): AI Lab (Swift Management AG, 2018); AI Lab (正彩 刘, 2017); AI Lab Pad; AI Lab: Learn AI Visually; AI Lab: Neural Networks & IoT; AI Startup Coach; AI Startup Mentor; Dropshipping AI Startup Mentor; DremDea: AI Startup Validator; FireUp - AI Startup Generator; Freelytic: AI Startup Roadmap; BlingKing-AI Lab for Men; HotAi Lab; LabLogger; Nara Mobile AI Lab; NativeX - On-Device AI Lab; Pocket AI Lab.

Takeaway for the name: the "AI + Tycoon", "Lab Tycoon" and "AI Lab + idle" slots are crowded on iOS; at least 8 AI-lab/AI-tycoon games were released in 2026 alone, including "Lab Tycoon" (Kessinger), which is the same words minus "AI". ⚠️ Search samples only.

### Rough count of "X Tycoon" titles
- **App Store (US storefront):** 590 unique apps with "Tycoon" in the name from 15 queries ("tycoon", "idle tycoon", "tycoon game", etc., limit 200 each; every new query kept surfacing new ones, so 590 is a floor). File of results kept in the scratch folder only.
- **Steam:** search term "tycoon" (games only, category 998) reports 1,080 matches; I paged 1,075 of them and 469 have "Tycoon" in the title. (Search also matches tags and descriptions, hence the gap.)
- Game Dev Tycoon itself: iOS app id 1162580001 by "Greenheart Games Pty. Ltd." (released 2017-11-28, https://apps.apple.com/us/app/game-dev-tycoon/id1162580001) and Android com.greenheartgames.gdt (500,000+ installs on the Play page); Steam app 239820, released Aug 29, 2013.
- Other game-dev-themed "Tycoon" iOS apps coexisting with Game Dev Tycoon: Dev Tycoon Idle Games Offline (MEEDLIGHT OU, 2019), Game Developer Tycoon (HENN Inc., 2020), Games Tycoon - gamedev sim (2025), Ultimate Game Dev Tycoon (Richard DeBanks, 2026-06-23), Game Tycoon: Developer Studio (Akin Aksoy, 2025). Apple has let all of these stay up beside the Greenheart registration.

### Steam titles that are very close to the name
(from https://store.steampowered.com/search/?term=tycoon style queries and appdetails)
- **AI Lab Tycoon**, BT Games, Nov 18, 2026 (above).
- **AI Tycoon**, Moonstruck, released Oct 10, 2023, $2.99 (https://store.steampowered.com/app/2613830) , satirical idle clicker.
- **AI TYCOON**, Icarus Games, coming Q1 2027 (https://store.steampowered.com/app/5075960) , "Found your AI company..." management game.
- **LLM Tycoon**, Futt Studio, coming 2026 (https://store.steampowered.com/app/4861430).
- Also in the 469: Computer Tycoon (2017), E-Startup 2: Business Tycoon (2024).

---

## 3. Google Play

Search page: https://play.google.com/store/search?q=AI%20Lab%20Tycoon&c=apps (fetched with hl=en&gl=US). It rendered (1.46 MB of HTML). ⚠️ I extracted titles from the embedded data with a script, not by reading the page; the first batch parsed was 17 titles, and the page also listed ~48 package ids in total, so some results were not title-checked. I then opened the detail pages of 16 ids for exact title and developer.

Matching or close apps (name, developer, package):
- AI Lab Tycoon: Misaligned, Graven Guy Games, net.gravenguy.ailabtycoon
- AI Lab Tycoon: Frontier Lab, Coddykit, com.coddykit.frontierlab
- AI Labz: Idle Tycoon Sim Game, G.L.H, com.ailab.aiLab (same game as the iOS "AI Labz")
- NeuronIdle: AI Tycoon, Thendril, com.nuroidle
- AI Simulator Lab, Frankr, com.someday.aiplay
- AI Game Lab, Rodolfo Cardoso, com.rodolfo.game.ai
- LLM Clicker: Idle AI Tycoon, DatatheCodie Studios, com.datathecodie.llmclicker
- AI Company Tycoon, NK Games Studio, com.nksolutions.aicompany
- AI Takeover Tycoon, MTAG PUBLISHING LTD, com.mysterytag.aitakeover
- AI Tycoon, Entity3, com.entity3.aitycoon
- Idle AI Factory: Robot Tycoon, ONI Games, com.onigames.idleaifactory
- AI Studio Tycoon, Tomahock, pt.tomahock.aistudiotycoon
- AI Office Tycoon, Khanapps, com.kk.ai_office_tycoon
- NovaTech: AI Tycoon - Idle, Maréchal Olivier, com.loxx.novatechaitycoon
- Idle Research: Endless Tycoon, Considera Games LLC, com.CryptoGrounds.IdleResearch
- Compute Empire: Idle AI Tycoon, Havoc Forge Games, com.havocforgegames.computeempire (found in the candidate checks, see section 5)
- For reference: Game Dev Tycoon, Greenheart Games, com.greenheartgames.gdt

URL pattern for each: https://play.google.com/store/apps/details?id=<package>

---

## 4. Trademarks

### 4a. GAME DEV TYCOON (Greenheart Games Pty. Ltd.)

**Registered in the US, class 9 (downloadable video games).** Confirmed on three separate sources.
- Trademarkia (USPTO mirror), https://www.trademarkia.com/game-dev-tycoon-85687491 : owner Greenheart Games Pty. Ltd., Indooroopilly, Australia (a proprietary limited company). Serial 85687491, registration 4345689, filed 26 Jul 2012, registered 04 Jun 2013, first use in commerce 16 Jul 2012. Status Live/Registered. Latest event 29 Nov 2023: "REGISTERED AND RENEWED (FIRST RENEWAL - 10 YRS)" with the Section 8 and 9 filing accepted. Attorney of record listed: Trevor P. Schmidt (HUTCHISON PLLC, Raleigh, NC). Goods: "Video games for mobile devices, personal computers, consoles, tablets; electronic game programs; downloadable electronic game programs; electronic game software; computer game programs; downloadable computer game programs; interactive game programs; interactive game software" (page text cut with "..."; ⚠️ the goods list on the page was truncated by the site itself). Class 009 only; no class 41 shown. The Trademarkia result card shows the text "GAME" and "DEV" in quotation marks, which may be a disclaimer or a mark-description note; the detail page says Disclaimer "NO DATA", so I could not confirm whether GAME/DEV are disclaimed.
- WIPO Global Brand Database, https://branddb.wipo.int/en/similarname/results (brand name "game dev tycoon"): GAME DEV TYCOON, owner Greenheart Games Pty. Ltd. (Australia), Nice class 9, National Trademark Registration, country USA, "Registered (June 4, 2013)", number 4345689.
- TMview (EUIPO's multi-office search), https://www.tmdn.org/tmview/#/tmview/results?criteria=C&basicSearch=game%20dev%20tycoon : 1 result only, the USPTO record above (data updated 27/10/2026). So **no EU, UK or other participating-office filing for GAME DEV TYCOON turned up.** ⚠️ I did not confirm which offices were selected (the office filter was left at its default) and TMview is "not an official register" per its own footer.

Greenheart's own claims:
- Website footer (https://www.greenheartgames.com/ and https://www.greenheartgames.com/app/game-dev-tycoon/ , read Oct 2026 version): "Greenheart Games, Game Dev Tycoon and Tavern Keeper are trademarks of Greenheart Games Pty. Ltd., registered in the US and other countries." This is a claim on their site; the registries above confirm only the US one for Game Dev Tycoon. "Greenheart Games" and "Tavern Keeper" were not searched.
- Steam page for Game Dev Tycoon (appdetails 239820): legal notice field is only "The game is self-rated for ages 12+"; no trademark line.
- EULA (https://www.greenheartgames.com/legal/game-dev-tycoon-eula/ , read in full): no ™/® claim for its own name. The "In Game Assets and Trade Mark Rights" clause only says the game's fictional companies and consoles parody real ones and avoid real trade marks. The EULA bars derivative works that "mimic the data or functionality of the Software" (restriction (f)) , that is about the software, not the name. Governing law: Queensland, Australia.
- Modding Agreement (https://www.greenheartgames.com/legal/game-dev-tycoon-modding-agreement/): ⚠️ only searched for trademark words; found nothing about their own marks (one line telling modders not to use real company names without authorisation).
- Terms of Use (https://www.greenheartgames.com/terms-of-use/): ⚠️ searched only; only a generic third-party-rights clause.
- Enforcement: I found **no** report of Greenheart enforcing GAME DEV TYCOON (search "Greenheart Games Game Dev Tycoon clone copycat takedown trademark enforce" returned only coverage of their 2013 anti-piracy stunt). Absence in a web search, not proof. The five "Game Dev Tycoon"-like iOS apps listed in section 2 are live.

### 4b. "TYCOON" on its own and other Tycoon marks (US, via Trademarkia)

Searched with wildcards (`tycoon*` = marks starting with Tycoon: 130 marks, 13 pages; `*tycoon` = marks ending in Tycoon: 339 marks, I read page 1 only ⚠️). Source pattern: https://www.trademarkia.com/search/trademarks?q=tycoon*&page=1&showFilters=true

- **No live US registration of TYCOON alone for games (class 9 or 41) turned up.** The standalone TYCOON marks I saw are live only in other fields (shirts class 25, alcohol class 33, pesticides class 5, tobacco class 34, rope class 22, drums class 15) and dead in games: TYCOON, First International Computer (class 9 hardware, cancelled 2018); TYCOON ENTERTAINMENT / TYCOON PRODUCTIONS (classes 9/41, abandoned); TYCOON CITY, Atari Interactive (class 9, abandoned 2008); TOMMO INC "TYCOON CITY" (abandoned 2018). ⚠️ My row parser merged some rows on the first page of each result list, so a live class 9/41 entry hidden in a merged row is possible but unlikely; the filtered 13-page scan printed all rows containing 009 or 041.
- **Live US registrations that include TYCOON in game classes (9 and/or 41)**: TYCOON MASTER (IGG Singapore, 98814929, classes 9/41, registered 09 Jun 2026); TYCOONLAND (Conglomerator & Co., 98043582, class 9, registered 10 Feb 2026); TYCOON CASINO (SHEN ZHEN TRIWIN, 88244825, class 9); TYCOON SIMULATOR (APPQUANTUM PUBLISHING, 97391437, class 9, registered 03 Dec 2024); TYCOON CITY (GT INTERACTIVE, 87672310, class 9, registered 17 Oct 2023) and TYCOON CITY NEW YORK (77262414); TYCOON BUILDER (Fab Technology Group, 87929372, class 9); CAR TYCOON (Hefei Changchunteng, 88532083, class 9); TOP TYCOON (TOPZEST GAMES, 99407048, class 9). Pending: TYCOON UP! (Play2Ever Games, 99871704, classes 9/41, filed 08 Jun 2026).
- **"X TYCOON" game marks** (page 1 of `*tycoon`): IDLE FACTORY TYCOON, IDLE FARM TYCOON, IDLE RESTAURANT TYCOON, IDLE MINER TYCOON and IDLE HONEY BEE TYCOON (all KOLIBRI GAMES GMBH, classes 9/41, registered 2026 renewals/grants); COOKING TYCOON (Shenzhen QiXunXinYou, 87749264, class 9); PANCAKE EMPIRE TOWER TYCOON (FMR LLC, class 41). Abandoned: TYCOON CAPITALIST IDLE (AE Mobile, 98841404, class 9).
- **ROLLERCOASTER TYCOON**: US ROLLER COASTER TYCOON, owner Chris Sawyer (London), serial 75595749, reg. 2432131, registered 27 Feb 2001, class 9 (computer game software), renewed (status date 12 May 2020), Live. US ROLLERCOASTER TYCOON WORLD, Chris Sawyer, serial 86356415, reg. 5082654, registered 15 Nov 2016, class 9, Live. Two UK marks ROLLERCOASTER TYCOON (UK00004227439 and UK00004227410), Christopher Sawyer, filed 01/07/2025, classes 9/16/25, Registered. Dead: ROLLER COASTER TYCOON class 28 board games (two, abandoned/cancelled). Sources: https://www.trademarkia.com/roller-coaster-tycoon-75595749 , https://www.trademarkia.com/rollercoaster-tycoon-world-86356415 , TMview search "rollercoaster tycoon". Note the owner is a person (Chris Sawyer), not a publisher. I did not check who licenses the brand.
- Other pre-2010 game "Tycoon" marks seen in TMview: AIRPORT TYCOON (Take-Two Interactive, USPTO class 9, ended), AIRLINE Tycoon (Kalypso Media, DPMA Germany class 28, registered 1999); TYCOON (Empire Interactive Europe, JPO class 9, expired).

**Enforcement of "Tycoon" marks (what I found):**
- Kolibri Games sent a 2019 notice to the maker of "Idle CEO Tycoon" claiming the "Idle ... Tycoon" naming (Idle Miner Tycoon, Idle Factory Tycoon, Idle Tycoon) as its trademark series, demanded a rename, and said it "expressly do not demand a takedown". A second developer in the thread said they got a similar email for "Idle Tower Tycoon". Source: https://discussions.unity.com/t/legal-notice-about-trademark-infringement/761514 , read through a web-fetch summary tool (the site blocks scripts, HTTP 403 "Crawler is not allowed"). It is a one-sided developer post; ⚠️ the thread has a second page that the summary did not cover. This is the only enforcement example I found; it concerns "Idle ... Tycoon", not "Tycoon" alone. It matters because Kolibri's TYCOON-family marks are now live in classes 9/41 in the US (above).
- Greenheart / Chris Sawyer / Atari enforcement over "Tycoon": not found.

### 4c. AI LAB TYCOON and AI TYCOON

- US (Trademarkia): wildcard searches `ai lab tycoon*`, `ai tycoon*`, `*ai tycoon`, `*lab tycoon`, `lab tycoon*` each returned **0 marks**. So no US application or registration for AI LAB TYCOON, AI TYCOON or LAB TYCOON exists in that mirror (⚠️ the mirror lags the USPTO by an unknown time; applications filed in the last days or weeks may be missing).
- TMview, "ai lab tycoon": "No rows found". TMview "ai tycoon": 150 hits, ⚠️ I read only the first 30; they were TYCOON-word marks (mostly Japan JPO), none was AI TYCOON.
- Marks with "AI LAB" in the US: THE AI LAB (The AI Lab, LLC; classes 35/42 registered, class 41 podcasts pending); AI LABS... (various, classes 5/42/41); IDEATRIX COGN AI LAB (class 9, Ideatrix; registered 28 Apr 2026, downloadable software). None is a game mark.
- WIPO Global Brand Database: brand name searches done only for "game dev tycoon" (see 4a). For AI LAB TYCOON / AI TYCOON: not run ⚠️.
- EUIPO eSearch plus (https://euipo.europa.eu/eSearch/): could not connect (curl returned no response). TMview covers EUIPO data and the other national offices, so the TMview results above partly stand in for it.
- USPTO's own search (https://tmsearch.uspto.gov/ , https://tsdr.uspto.gov/): both returned a page (HTTP 200) but are JavaScript apps; I did not query them. Trademarkia and WIPO stand in. Justia (https://trademarks.justia.com/) returned a Cloudflare challenge (HTTP 403) and uspto.report returned 403; not used.

---

## 5. Candidate alternative names

For each name: App Store (iTunes API, US/GB/DE/TR, software; iPadSoftware too except for a few listed gaps; limit 200), Steam (games-only store search), Google Play search, trademarks (Trademarkia US prefix and suffix wildcards; TMview for several), and itch.io where noted. "Collision" means an exact or confusingly similar name in games or software.

### Summary table

| Name | App Store | Steam | Google Play | itch.io | Trademark (US / TMview) | Overall |
|---|---|---|---|---|---|---|
| Frontier Lab | none | none | **"AI Lab Tycoon: Frontier Lab" (Coddykit)** | "Frontier Labs" (djgaskin99) | US FRONTIER LAB, Frontier Laboratories Ltd., classes 9+42, Live (lab instruments); JP and a 2025 Canadian filing | Medium: name used inside a competitor's title; class 9 registration exists for different goods |
| Model Mogul | none | none | none ("MOGUL..." titles exist) | not seen | none; only old MODELS & MOGULS (game software, ended) | Low (cleanest) |
| Scaling Laws | none | **"SCALING LAW" (Mirako), AI-company game, Oct 27 2026** | none | **"Scaling Laws" (hcklab)** | US: SCALING LAW (class 35/41 pending), ZEROTH SCALING LAW (class 42 pending) | Medium-high for games: same theme, near-identical title; also a generic AI term |
| Compute Empire | none | none | **"Compute Empire: Idle AI Tycoon" (Havoc Forge Games)** | **"Compute Empire" (amadis068, in a "Neon Arcade" page)** | none | High: exact name exists as an AI-tycoon game on Android and itch |
| Lab Founder | none | none | none | none seen | none | Low |
| AI Lab Story | none | none | none ("Story Lab" editor app) | none | none (THE STORY LAB class 35, LEGACY STORY LAB class 41 exist) | Low |
| Frontier: An AI Lab Game | none ("Frontier Voice" is not a game) | none | "AI Lab Tycoon: Frontier Lab" appears in results | "Frontier Labs" | as Frontier Lab; AI FRONTIER (class 36 finance) | Medium; the word "Frontier" alone was not cleared |
| Weights & Wonders | "WeightWonder" (health app) only | none | "WeightWonder" only | not seen | no match (search tool handled "&" badly) | Low-medium |
| Superintelligence Inc | **"Superintelligence" by "Superintelligence, Inc." (AI chat app, since 2023)**; "Artificial Superintelligence" (Grailr LLC, Games, 2017) | none | "Superintelligence" app | 3 loose titles | **SUPERINTELLIGENCE word mark in class 9+42 (Superfile, Inc., WIPO, EU/UK/US filings 2025-26)**; Japan and Turkey class 9 filings | High |

### Per-name detail

**Frontier Lab**
- App Store: 0 matches in all four countries (clean; first run had 0 errors).
- Steam: search "Frontier Lab" 32 hits, 0 titles with "Frontier Lab". https://store.steampowered.com/search/?term=Frontier%20Lab
- Google Play: https://play.google.com/store/apps/details?id=com.coddykit.frontierlab is "AI Lab Tycoon: Frontier Lab" by Coddykit (so Coddykit already uses both "AI Lab Tycoon" and "Frontier Lab").
- itch.io: Frontier Labs, https://djgaskin99.itch.io/frontier-labs (title only ⚠️).
- Trademarks: US FRONTIER LAB, Frontier Laboratories Ltd., serial 75769669, filed 06 Aug 1999, classes 9 and 42 (analytical apparatus for thermal analysis), Live, renewed (status 05 Nov 2022) — class 9 but for lab instruments, so a conflict with a game is unlikely but a class 9 overlap exists. FRONTIER LAB class 41 (Council for Technology and the Individual, cancelled 2008); FRONTIER LABS class 9 (Fong, abandoned 2003). TMview: FRONTIER LAB in Japan (class 9, フロンティア・ラボ株式会社, registered 1998); Lab Frontier (Korea, classes 1/5/42); FRONTIER LABS logo, Deveron USA, Canada, classes 9/16/35/41/42/44, Filed 16/12/2025; FRONTIER DEVELOPMENT LAB (SETI Institute, EUIPO class 41/42, registered). ⚠️ TMview first 30 of 53 results only.

**Model Mogul**
- App Store: 0. Steam: 8 hits, 0 matches. Google Play: 4 titles parsed, none "Model Mogul", but "MOGUL - Empire Tycoon Sim", "MOGUL Tycoon: Idle Empire", "MOGUL: Build your Empire" exist (generic word). itch.io: no "mogul" titles in one parsed page ⚠️ (other attempts returned unparsable pages).
- Trademarks: US `model mogul*` and `*model mogul`: 0 marks. TMview "model mogul": 6 results, closest SUPER MODEL SUPER MOGUL (kathy ireland, class 35, ended), MODELS & MOGULS (Bright Candle Software, class 9 computer games, US, ended), MODELS MEET MOGULS (class 41, ended); ⚠️ I read the first part of the list only (the text was cut).

**Scaling Laws**
- App Store: 0 (US/GB/DE/TR).
- Steam: https://store.steampowered.com/app/5373360 "SCALING LAW", developer "Peter", publisher Mirako, release Oct 27, 2026 (today), genres Indie/Simulation/Strategy; described as "An anti-AI psychological-horror incremental game... Build an AI company, train models, automate your staff". Closest same-theme near-collision found in all candidate checks.
- itch.io: "Scaling Laws", https://hcklab.itch.io/scaling-laws (exact title).
- Google Play: 0.
- Trademarks: US SCALING LAW (Brooke Lively, 99434793, pending, classes 35/41, business consulting); ZEROTH SCALING LAW (Tensordyne, 99399392, pending, class 42); SCALING LAW FIRMS (pending, class 35). TMview search for "scaling laws" did not load in time ⚠️ (not read).
- Note: "scaling laws" is also a standard AI-research term, so it is descriptive and hard to own.

**Compute Empire**
- App Store: 0 (US/GB/DE/TR, including iPad).
- Steam: 161 hits, 0 title matches.
- Google Play: **Compute Empire: Idle AI Tycoon**, Havoc Forge Games, https://play.google.com/store/apps/details?id=com.havocforgegames.computeempire (exact name + same genre).
- itch.io: "Compute Empire", https://amadis068.itch.io/neon-arcade-05 (title seen in a result list for "AI Tycoon"; page not opened ⚠️).
- Trademarks: US `compute empire*` / `*compute empire`: 0. TMview "compute empire": 9 results, none exact (EMPIRE COMPUTERS, COMPUTER EMPIRE in Australia/India, class 9/42/35; ⚠️ first part read, text cut).

**Lab Founder**
- App Store: 0 (US, GB, DE, TR; DE/TR re-run OK). Steam: 18 hits, 0 matches. Google Play: 0. itch.io: no match on one parsed page ⚠️.
- Trademarks: US `lab founder*`, `*lab founder`: 0 marks. TMview: not run ⚠️.

**AI Lab Story**
- App Store: 0 (all 4 countries; incl. a "Lab Story" pattern match). Steam: 115 hits, 0 matches. Google Play: no AI Lab Story; "Story Lab - Story Maker Editor" (com.kaviyainfotech.storymaker_storyart_story_lab) shares "Story Lab" (editing app). itch.io: 0 matches on one parsed page ⚠️.
- Trademarks: US `ai lab story*`, `*lab story`: 0 marks. Related: THE STORY LAB (Dentsu Aegis London, class 35, live), LEGACY STORY LAB (class 41), AI STORY TIME (class 9, Better Chinese Inc.). TMview: not run ⚠️.

**Frontier: An AI Lab Game**
- App Store: terms "Frontier AI Lab" and "Frontier An AI Lab Game" in four countries: only "Frontier Voice" (Mindcom Media, GB, 2026-08-26; a voice app, not a game). Steam: 7 and 9 hits, 0 matches. Google Play: "AI Lab Tycoon: Frontier Lab" again; also "Frontier War", "Pocket Frontier". 
- Trademarks: US `frontier ai lab*`: 0; AI FRONTIER (DEFINED CAPITAL INC., 98472048, class 36 venture capital, live). Same Frontier Lab entries as above. "Frontier" alone, with a game meaning, was not checked in the registries ⚠️ (it is a very common word).

**Weights & Wonders**
- App Store: only WeightWonder (Gautam Kishore, Health & Fitness, 2019, https://apps.apple.com/us/app/weightwonder/id1432492263), seen in US, DE and TR (not in GB). No game match.
- Steam: 8 hits, 0 matches. Google Play: WeightWonder (com.eulogik.weightwonder) only.
- Trademarks: the search tool treats "&" poorly, so results were fuzzy: no exact "WEIGHTS & WONDERS" or "WEIGHTS AND WONDERS" found; nearby marks WEIGHTED WONDERS (Roamin' Bison, class 28 toys), WISHES AND WONDERS (travel agency). ⚠️ Treat as "no exact match found" with weak search quality. TMview: not run.

**Superintelligence Inc**
- App Store: https://apps.apple.com/us/app/superintelligence/id1667207477 , "Superintelligence" by **Superintelligence, Inc.**, Productivity, released 2023-02-16, an AI chat app (in US, GB, DE, TR). Also "Artificial Superintelligence" (Grailr LLC, Games category, 2017, https://apps.apple.com/us/app/artificial-superintelligence/id1060474699), "Magnus - Super intelligence" (Magnus AI Ltd, 2026), "Global SuperIntelligence News" (TechCatalyst, 2026-10-22).
- Steam: term "Superintelligence Inc" 1 hit, 0 matches; "Superintelligence" 25 hits, 0 title matches. Google Play: "Superintelligence" (com.malab.superintelligence), developer not checked ⚠️. itch.io: three loose matches (Trump Pop: Super Intelligence; SIO Fighter - Battle of the Super Intelligence Overlords; LOGICIDE...).
- Trademarks: US SUPERINTELLIGENCE (Superfile, Inc., 99288919, filed 17 Jul 2025, pending, class 42). TMview: SUPERINTELLIGENCE, SUPERFILE, INC., **WIPO international registration 1905561, classes 9 and 42, Registered**; SuperIntelligence filed at EUIPO 019405661 (05/08/2026, classes 9/42) and UKIPO UK00004426391 (same date, classes 9/42); SUPERINTELLIGENCE Japan (class 9/41/42, registered, individual); superintelligence TURKPATENT class 9 (filed 01/07/2025, MAŞALLAH TURAN, which also holds "superintelligence labs" registered). Others in class 42/41/35: SUPERINTELLIGENCE BY IQ COMPANY (registered, class 42), SUPERINTELLIGENCE SYSTEMS (pending), SCHOOL OF SUPERINTELLIGENCE (Miles University, pending, class 41), SWITCH SUPERINTELLIGENCE (Switch Ltd., pending). ⚠️ TMview first 30 of 101 results only. This name has the most live and pending claims by far; it also overlaps the company name "Superintelligence, Inc.".

### Other collisions seen incidentally (not candidates)
- Steam "AI Tycoon" (Moonstruck, 2023), "AI TYCOON" (Icarus Games, Q1 2027), "LLM Tycoon" (Futt Studio, 2026), "SCALING LAW" (Mirako).
- itch.io AI-tycoon-named pages (from https://itch.io/search?q=AI+Tycoon): AI Tycoon (soulblaz0r, journalizm, ramang, gravity-3d), Rack to Riches: Idle AI Tycoon, AI CEO Tycoon, AI Dev Tycoon (two), AI Race Tycoon, AI Datacenter Tycoon, AI Slop Tycoon, AI Data Center Tycoon, HYPERSCALE, Vibe Code Tycoon, Token Tycoon. The AI-lab-tycoon theme is crowded on itch.io, the other release target.

---

## Coverage statement

Opened and read to the end (parsed whole, printed or searched in full):
- https://store.steampowered.com/api/appdetails?appids=5015590 (all fields; long description printed fully; the second copy "about_the_game" printed only its first part ⚠️)
- https://store.steampowered.com/api/appdetails?appids=5362590 (demo; fields printed), 239820 (Game Dev Tycoon; fields printed), 2613830, 5075960, 4861430, 5373360 (fields printed)
- https://ailabtycoon.com/ (whole text printed; footer contains a line "Anomalous output detected. Recommend: ignore." which is page flavour text, not acted on)
- https://aitycoon.org/ (whole 3.9 KB HTML head; the game app itself not run)
- https://www.greenheartgames.com/ (home, whole text), https://www.greenheartgames.com/legal/ (whole text), https://www.greenheartgames.com/legal/game-dev-tycoon-eula/ (whole text; a few very long lines were printed cut at 300-400 characters)
- https://www.trademarkia.com/game-dev-tycoon-85687491 , https://www.trademarkia.com/roller-coaster-tycoon-75595749 , https://www.trademarkia.com/rollercoaster-tycoon-world-86356415 (the mark summary and details sections; the rest of each page is site boilerplate)
- iTunes Search API responses (all calls listed in section 2 and 5, parsed in full; API caps results)
- https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=5015590 (0 posts)

Read in part (⚠️):
- https://store.steampowered.com/app/5015590 (HTML parsed by script for tags, purchase block, links; not read line by line)
- https://store.steampowered.com/search/?developer=BT%20Games and https://store.steampowered.com/developer/btgames (titles / page title only)
- Steam store search JSON (https://store.steampowered.com/search/results/?term=...) for "tycoon" (1,075 of 1,080 paged) and all candidate names (first 100 results each)
- https://play.google.com/store/search?q=AI%20Lab%20Tycoon&c=apps and the same page for the candidate names (page fetched in full, but titles extracted by script from embedded data; only part of the listed ids had titles parsed)
- 16 Google Play detail pages (title and developer only)
- https://www.greenheartgames.com/app/game-dev-tycoon/ , https://www.greenheartgames.com/terms-of-use/ , https://www.greenheartgames.com/legal/game-dev-tycoon-modding-agreement/ (searched for trademark words only)
- https://www.trademarkia.com/search/trademarks?q=... result pages: pages 1-13 for `tycoon*` (rows merged in places), page 1 only (or 1-3) for the others
- https://branddb.wipo.int/ (search "game dev tycoon": result list loaded, two records shown; owner-name search failed)
- https://www.tmdn.org/tmview/ searches: "game dev tycoon" (1 of 1, read fully), "rollercoaster tycoon" (3 of 3, read fully), "ai lab tycoon" (no rows), "ai tycoon" (30 of 150), "model mogul" (text cut), "compute empire" (text cut), "frontier lab" (30 of 53, text cut), "superintelligence" (30 of 101, text cut). "scaling laws" did not load.
- https://itch.io/search?q=AI+Tycoon (read fully by script); other itch.io candidate searches returned unparsable pages several times (rate limiting), so itch.io coverage for the candidate names is incomplete.
- https://discussions.unity.com/t/legal-notice-about-trademark-infringement/761514 (via a summarising fetch tool, page 1 only; direct fetch was blocked)
- Web search results (snippets only, pages not opened): GameFAQs, IsThereAnyDeal, Metacritic, Nodal, GG.deals, Wikipedia pages for Game Dev Tycoon / Greenheart Games, Techdirt/NBC piracy-stunt coverage.

Could not reach or not usable:
- https://trademarks.justia.com/ (HTTP 403, Cloudflare challenge; not bypassed), https://uspto.report/ (HTTP 403), https://gg.deals/ (HTTP 403)
- https://euipo.europa.eu/eSearch/ (no connection)
- https://tmsearch.uspto.gov/ and https://tsdr.uspto.gov/ (loaded but JavaScript apps; not queried)
- https://www.trademarkelite.com/ search URL (HTTP 404)
- WIPO owner-name search for "Greenheart Games" (query format failed; non-US registrations by Greenheart under other mark names therefore unchecked)
- Not checked at all: WIPO brand search for AI LAB TYCOON / AI TYCOON and all nine candidates; TMview for "lab founder", "ai lab story", "weights wonders"; non-US App Stores beyond US/GB/DE/TR; Google Play outside the US storefront.
