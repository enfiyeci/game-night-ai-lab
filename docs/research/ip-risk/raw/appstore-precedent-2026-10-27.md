> Raw subagent output (2026-10-27), kept for provenance. Not re-verified line by line; the claims the report relies on were traced by the orchestrator (see ../README.md).

# Raw research: App Store rules and clone/look-alike precedent (for the AI Lab Tycoon risk report)

Prepared 2026-10-27 for a risk report. This is research, not legal advice. Raw notes: not yet adjudicated.
Conventions: a warning sign marker flags a claim resting on less than a full read of the source (what was missing is stated next to it). Quotes are under 15 words; otherwise close paraphrase. No email address was put into any lookup or API field. Downloaded pages were saved only under the scratchpad `dl/` folder.

Reading method note: pages fetched with curl were converted to plain text and read in the parts named below. Pages fetched with WebFetch were summarised by a helper model, so they are marked as "extraction, not raw read" in the coverage statement.

---------------------------------------------------------------------------------------------------

## PART A. Apple's rules

### A1. App Review Guidelines (page shows "Last Updated: October 16, 2026")
Source: https://developer.apple.com/app-store/review/guidelines/ (raw HTML downloaded; sections below read in full; the whole 100k-character document was NOT read end to end, see coverage).

**4.1 Copycats** (three sub-points)
- 4.1(a): "Come up with your own ideas." Do not simply copy the latest popular app, or make minor changes to another app's name or UI and pass it off as your own. Apple adds that doing so risks an intellectual property infringement claim, makes the store harder to navigate, and is unfair to other developers.
- 4.1(b): Apps that impersonate other apps or services violate the Developer Code of Conduct and "may result in removal from the Apple Developer Program."
- 4.1(c): "You cannot use another developer's icon, brand, or product name" in your app's icon or name, without that developer's approval.
- 4.1(c) is new. 9to5Mac (13 Nov 2025) and MacStories report Apple added it in a November 2025 update (one of nine changes). Sources: https://9to5mac.com/2025/11/13/apple-tightens-app-review-guidelines-to-crack-down-on-copycat-apps/ and https://www.macstories.net/?p=79852 .
- Apple's companion help page https://developer.apple.com/help/app-review/guideline-reference/4-1-prevent-copycat-rejection says App Review "rejects apps that copy other apps, and closes accounts that repeatedly submit copycat apps." Its "Don't" list includes: do not imitate the features and functionality of other apps, do not copy the look and feel of other apps, do not use protected material without permission, and do not include references to popular app names or trademarked terms in any metadata field. Its "Do" list includes creating "a unique spin on an existing concept." (Note the tension: "unique spin on an existing concept" is allowed, "imitate features and functionality" is not. Apple does not define where the line is.)

**5.2 Intellectual Property** (intro plus sub-points)
- Intro: include only content you created or have a licence to use; the app may be removed if you used content without permission; "someone else's app may be removed if they've 'borrowed' from your work." Rights holders are told to "submit a claim via our web form." Laws differ by country.
- 5.2.1 Generally: do not use protected third-party material such as trademarks, copyrighted works, or patented ideas without permission, and do not include "misleading, false, or copycat representations, names, or metadata in your app bundle or developer name." Apps must be submitted by the person or legal entity that owns or has licensed the IP.
- 5.2.2 Third-Party Sites/Services: if the app uses, accesses, monetises, or displays content from a third-party service, you must be permitted under that service's terms; authorisation must be provided on request. (Not about names; it concerns third-party services.)
- 5.2.3 Audio/Video Downloading: no illegal file sharing or saving/converting/downloading media from third parties without authorisation.
- 5.2.4 Apple Endorsements: (a) do not suggest Apple is a source or supplier of the app or endorses it; (b) Editor's Choice badge is applied by Apple automatically.
- 5.2.5 Apple Products: do not make an app that is confusingly similar to an Apple product, interface, app, or advertising theme; no Apple emoji; rules on iTunes/Apple Music previews, Activity rings, and Apple Weather attribution.
- No separate "parody" or "homage" carve-out appears in 5.2 as published.

**2.3.7 (app name and metadata)** — verbatim opening: "Choose a unique app name, assign keywords that accurately describe your app, and don't try to pack any of your metadata with trademarked terms, popular app names, pricing information, or other irrelevant phrases just to game the system."
- App names are limited to 30 characters.
- Subtitles "should not ... reference other apps."
- Apple "may modify inappropriate keywords at any time or take other appropriate steps to prevent abuse."
- 2.3.8 (adjacent): app name and icons should be consistent to avoid confusion (the sentence says metadata such as name and icons should be similar across sizes "to avoid creating confusion"; it concerns consistency within your own app, not other apps).
- App Store Connect field limits: name at least 2 and at most 30 characters, editable until submitted for review. Source: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information (read the Name/Subtitle rows only; see coverage).

**Names that duplicate or resemble other apps' names**
- The text that speaks to it: 2.3.7 ("unique app name"; no trademarked terms or popular app names in metadata), 4.1(a) ("minor changes to another app's name"), 4.1(c) (no other developer's brand or product name in your app name or icon), 5.2.1 (no misleading or copycat names or metadata).
- No rule gives a similarity test (for example a percentage or an edit distance). Enforcement is by reviewer judgement. Not found: any Apple statement defining "confusingly similar" for non-Apple names.

**Other guideline clause that matters for an AI-company theme** (found while reading, not asked for): 1.1.2 says game "enemies" "cannot solely target a specific race, culture, real government, corporation, or any other real entity." That is about violence targeting real entities, not about naming real companies, but it is the nearest rule if the game depicts real AI companies.

### A2. How a rights holder complains, and what Apple does
- Dispute-form hub: https://www.apple.com/legal/intellectual-property/dispute-forms/ (the old URL https://www.apple.com/legal/internet-services/itunes/appstorenotices/ now just redirects to it; the redirect stub was 119 bytes). It says forms are for Apple services, require contact details, identification and description of the alleged infringement, and "a representation, under penalty of perjury" that the filer is the authorised rights holder. Apple "in most cases" replies by email with a reference number.
- App Store form page: https://www.apple.com/legal/intellectual-property/dispute-forms/app-store/ . Two forms:
  1. **App Store Content Dispute** for an app or Search Ad that "violates your intellectual property rights." Apple says content in the store is "in most cases" made available by third-party providers and that "upon receiving your submission, we will contact the provider of the disputed content regarding your claim and ask that they work with you directly to resolve the issue." Apple does not investigate claims about branded terms used as Search Ads keywords.
  2. **App Name Dispute**: if an app "is preventing you from using your trademark as an app name." Apple identifies the blocking app(s) and "in most cases" contacts the provider and asks them to work with the claimant directly. If the blocking app is in the claimant's own or an associated developer account, the claimant is told to contact the App Store Connect team.
- What the page does NOT say: it does not state a removal timetable, a counter-notice process, or a standard that triggers removal. (Words "may remove" are not on this page; removal is described elsewhere, below.)
- What happens to the developer. Apple's help page "Respond to an app removal" https://developer.apple.com/help/app-review/safe-and-trusted-store/app-removals says apps may be removed for breaking the Guidelines, the Developer Program License Agreement, or law, and lists "Apple receives a legal, intellectual property, or government takedown request" among the causes. Developer is messaged in App Store Connect. Depending on severity: less severe issues may get 14 days to fix; "serious issues, such as safety or legal concerns, may be immediately removed" and a compliant update is needed to restore; a "fundamentally incompatible concept" is removed immediately and cannot be restored (a new app with a compatible concept is needed).
- Other pages: "Report an app" https://developer.apple.com/help/app-review/safe-and-trusted-store/report-an-app (anyone can report; Apple will not share the outcome with the reporter) and the Guidelines' own pointer to the IP web form.
- Developer Program License Agreement (https://developer.apple.com/support/terms/apple-developer-program-license-agreement/ , ⚠️ only sections 3.2, 6.9, 10, 11.2 located by search and read; whole agreement is ~640k characters and was not read end to end):
  - 3.2(4): developer represents, to the best of their knowledge and belief, the app does not infringe Apple or third-party copyrights, trademarks, or other rights.
  - 6.9: Apple may, "in its sole discretion," reject an app for distribution "for any reason," even if it meets requirements, and is not liable for resulting losses.
  - 10 (Indemnification): the developer agrees to indemnify, hold harmless and (on Apple's request) defend Apple against losses arising from claims that the app or its metadata infringes third-party IP rights.
  - 11.2: termination triggers include failing to cure a breach within 30 days and engaging in "misleading, fraudulent, improper, unlawful or dishonest" acts.
- Practical reading (my inference, not a source claim): Apple acts as a relay. It forwards IP complaints and asks the parties to resolve it, but pulls the app on its own discretion and puts IP-defence cost on the developer.

### A3. App name uniqueness and name squatting
- Apple help page "Add a new app" https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app , FAQ "What can I do if the app name I want to use on the App Store is unavailable?": "You can use an app name for one app per localization." If an app in your own account already uses it, either rename that app or remove it from App Store Connect. "If another developer is using the app name and you have trademark rights to it, you can submit a claim." (This is the official source. The page does not say how long a name is held.)
- Apple Support wording relayed by a forum user (secondhand, not Apple documentation), https://developer.apple.com/forums/thread/786340 (June 2025), via WebFetch extraction: names are "considered to be in use as soon as an app record is created in App Store Connect"; the name is reserved for the localizations saved to the record and "remains reserved while the app is in development"; if a name seems used but no app appears, "it's possible that the app isn't released ... yet."
- Forum users (not Apple), https://developer.apple.com/forums/thread/91335 (Nov 2017): developers can "reserve" names by creating a record without publishing; names can also be held by apps removed from sale or limited to another country; Apple has "previously allowed" names differing by one character or punctuation, "YMMV." Another thread https://developer.apple.com/forums/thread/691494 (Oct 2021) shows the "App Name ... has already been used" error even when no store listing exists; advice there is to contact App Store Connect support.
- History of squatting: Macworld, 2009, https://www.macworld.com/article/200561/namesquatting.html (via WebFetch extraction): developers could start a submission, leave it unfinished indefinitely, and hold a name; article describes Apple as "cavalier" about name registration. Not found: any current Apple statement on how long an unused record keeps a name, or any anti-squatting expiry policy. (A search snippet claimed names stay reserved 180 days; I could not find that on any Apple page I read, so I am NOT reporting it.)
- What happens if the name is taken: change the name; add a distinguishing word (the Guidelines limit names to 30 characters); or, if you hold trademark rights, use the App Name Dispute form (A2).
- One-off live check I ran (Apple's public iTunes Search API, US store, 2026-10-27, first 12 results per term; ⚠️ not an exhaustive list): the store already has many similarly-themed apps with "Tycoon" names, including "Lab Tycoon: AI Startup Sim" (Brandon Kessinger, released 2026-08-06), "Token Tycoon: AI Lab Idle" (Donovan Ladd, 2026-06-25), "Idle AI Lab" (2026-10-13), "AI Takeover Tycoon" (2026-02-11), "Ultimate Game Dev Tycoon" (Richard DeBanks, 2026-06-23), "Dev Tycoon" (Orkun Orbay, 2026-02-13), "Game Tycoon: Developer Studio" (2025-08-18), alongside Greenheart's "Game Dev Tycoon" (2017-11-28) and Kairosoft's "Game Dev Story" (2010-10-09) and "Game Dev Story+" (2021-06-17). The search for the exact phrase "ai lab tycoon" returned no app with exactly that name in the top results, but an unreleased record would not show. This shows Apple tolerates many "X Tycoon" names in the same niche; it does not show those developers were never challenged.

---------------------------------------------------------------------------------------------------

## PART B. What has actually happened

### B1. Apple/Google and clone removals (what was removed, why, how)

**Wordle clones, January 2022**
- Game Developer (12 Jan 2022), https://www.gamedeveloper.com/game-platforms/-i-wordle-i-clones-nuked-from-ios-app-store : after Wordle went viral, many cash-grab versions launched on the iOS App Store; Polygon noticed most were removed within days; Google had not yet done the same; Apple "hasn't made any official statement or offered explanation"; the article says it was "not clear" if a specific rule was violated. Same article says 2048 escaped Apple's ire despite close similarity to Threes.
- USA Today via TechXplore, https://techxplore.com/news/2022-01-copycats-apple-yanks-knockoffs-viral.amp : Apple confirmed by email that clones were removed but gave no count or names. The most visible developer (Zach Shakked, app named "Wordle") apologised on Twitter. Some similar-play-style apps stayed up.
- MacTrast (12 Jan 2022), https://www.mactrast.com/2022/01/apple-purges-app-store-of-wordle-game-clones-following-outcry/ : majority of clones removed; Google "reportedly" removed multiple clones; the removed apps had tens of thousands of downloads; "Wordle - the App" reportedly charged $30 per month (other outlets say yearly; I did not resolve the discrepancy). Notes each clone had been approved by Apple before removal.
- Pattern: removals targeted apps that used the original's exact name and monetised it. Later Wordle-like games with different names survived (per the TechXplore piece). Not found: any case where Apple removed a game for sharing only genre and mechanics with an inspiration while using a different name and presentation.

**Flappy Bird clones, February 2014**
- MacRumors (17 Feb 2014), https://macrumors.com/2014/02/17/flappy-bird-clones-rejected : Apple began rejecting new apps with "Flappy" in the title. Developer Ken Carpenter's "Flappy Dragon" was rejected under then-guideline 22.2 ("false, fraudulent, or misleading representations") for attempting to "leverage a popular app." Older apps with Flappy names (Flappy Fish, Pig, Plane, Puppy) stayed; "Flappy Bee" (which used stolen artwork) was renamed "Jumpy Bee."
- AppSpy, https://www.appspy.com/news/8196/apple-tells-new-games-with-flappy-in-their-titles-to-flap-off : quotes Apple's rejection text: "We found your app name attempts to leverage a popular app."
- TechCentral, https://www.techcentral.ie/apple-google-strike-back-against-flappy-bird-clones/ : Google also reportedly rejected or removed "flappy"-titled apps; top clones with non-Flappy names (Splashy Fish, Clumsy Bird) stayed top of the charts.
- Pattern: the enforcement hit the NAME, not the gameplay. Clones with different names, same gameplay, ranked #1 and #2 eight days later.

**Threes vs 2048 (2014)**
- TechCrunch (24 Mar 2014), https://techcrunch.com/2014/03/24/clones-clones-everywhere-1024-2048-and-other-copies-of-popular-paid-game-threes-fill-the-app-stores : 1024 and 2048 copied Threes (paid, $1.99); two-dozen-plus 2048 variants filled the App Store; Apple and Google had rejected "Flappy" titles but "these were not across-the-board rejections." Threes stayed top 10 in puzzle.
- Complex, https://www.complex.com/pop-culture/a/andrew-freedman/threes-developers-discuss-clones-2048 : Threes developers publicly complained of "the 'cloning feeling'"; Cirulli's 2048 site credited 1024 and said it was "conceptually similar to Threes."
- Game Developer, https://gamedeveloper.com/business/ubisoft-buys-publisher-of-notorious-game-clone-i-2048-i- : the Ketchapp free-to-play 2048 later led to Ubisoft buying Ketchapp; Threes' creator said it helped drive a free-to-play Threes in 2015. No Apple removal is reported.
- Not found: any report of Apple removing 2048 or its clones on IP grounds. (Giant Bomb "Meet the clones" returned HTTP 403; not read. A Chinese-language snippet said Google Play briefly pulled Threes in 2014 for mentioning "2048" in tags; I did not open it, so it is unverified.)

**Ridiculous Fishing vs Ninja Fishing (Vlambeer vs Gamenauts, 2011)**
- GamesBeat, https://gamesbeat.com/fishy-business-the-story-of-an-app-store-clone-war/ (⚠️ my extraction was cut at about 40 long paragraphs; the article's last paragraphs may have been missed): Gamenauts' Ninja Fishing copied Vlambeer's Flash game Radical Fishing; Gamenauts admitted it was "inspired by" it; offered credit, then an unspecified revenue share; Vlambeer declined both and proposed simultaneous release; Gamenauts refused; Ninja Fishing reached #7 in the iPhone App Store in mid-August 2011. The article includes a developer's argument (Ephraim Knight) that copying mechanics is not infringement.
- Pocket Gamer, https://www.pocketgamer.com/ridiculous-fishing/update-ridiculous-fishing-creator-writes-an-open-letter-to-gamenauts-over-clone/ and Engadget https://www.engadget.com/2011-08-11-new-ios-title-looks-eerily-similar-to-popular-flash-title-also-d.html confirm the chronology and Gamenauts' "inspired by" statement.
- Result: no removal by Apple is reported in any source I read. Vlambeer did not sue (per the sources, the practical response was public pressure). Ridiculous Fishing launched afterwards.

**Triple Town vs Yeti Town (Spry Fox vs 6waves/Lolapps, 2012)**
- MCV, https://mcvuk.com/development-news/triple-town-cloning-suit-settled/ ; Pocket Gamer https://www.pocketgamer.com/articles/045754/r/ ; Wikipedia https://en.wikipedia.org/wiki/Triple_Town : Spry Fox sued in January 2012 for copyright infringement; a US court denied 6waves' motion to dismiss, noting mechanics get little protection but "style and expression" of the clone were too similar (per Wikipedia's summary of the ruling); in October 2012 the parties settled with ownership of the Yeti Town IP going to Spry Fox, and Yeti Town was then pulled from the App Store (Pocket Gamer). A lawyer quoted by MCV attributes the settlement mainly to the denied dismissal and to 6waves' alleged "sharp dealing" (it had been developing an iOS port of Triple Town for Spry Fox while building its own clone).
- This is the clearest example of a rights holder winning against a look-alike. The facts were unusually strong (prior business relationship, close copying of presentation). The court ruling stated is from Wikipedia's secondary description; I did not read the opinion itself.

**NimbleBit Tiny Tower vs Zynga Dream Heights (Jan 2012)**
- Technologizer, https://technologizer.com/2012/01/25/everyone-rips-off-everyone-or-nimblebit-vs-zynga/index.html ; Engadget https://www.engadget.com/2012-01-25-nimblebit-calls-out-zynga-clone-of-tiny-tower.html : Zynga released Dream Heights in the Canadian iOS store; NimbleBit posted an open letter and a comparison infographic; Engadget says Zynga had earlier offered to buy NimbleBit. Not found: any report that Apple removed Dream Heights or that NimbleBit sued. The response was public shaming.
- Same Technologizer article reports that Atari had just had a Battlezone clone removed (next item).

**Atari vs Vector Tanks (Dec 2011 to Jan 2012)** — the best documented example of how Apple's process works
- GamesBeat, https://gamesbeat.com/exclusive-app-store-game-copycat-battle-zone-heats-up/ : the developer's account: on 26 Oct 2011 Apple told them Atari claimed infringement; they denied it and tried to license Battlezone; after almost two months, Atari sent Apple a second notice saying no agreement was reached; "two days after that Apple pulled the Vector Tanks apps." The developer said they got no reply from Apple or Atari afterward and that the cost of fighting would exceed the game's income. Atari's statement: it had spoken with the team "over a period of several months and ultimately determined that it was not a good solution for our Battlezone franchise."
- Technologizer, https://technologizer.com/2012/01/04/atari-shuts-down-vector-tanks-battlezone-clone/index.html ; Pocket Gamer https://www.pocketgamer.com/vector-tanks/atari-takes-legal-action-against-battlezone-inspired-vector-tanks-iphone-games-a/ : both games were removed for copyright infringement; the developer renamed the next title and swapped tanks for alien hovercraft. Technologizer notes the similarity was in look, sound effects and presentation (green wireframe tanks, scrolling title text), not only mechanics.
- Lesson: the removal followed a copyright claim to Apple about look/feel and assets, not a lawsuit; the developer had no practical appeal.

**Recent enforcement and uncertainty (2024 to 2026)**
- 9to5Mac (13 Nov 2025) says Apple "moved quickly" to remove or force renames of Sora 2 clones (this is the article's statement, not independently checked).
- MacStories lists copycat versions of Blue Prince, Palworld, Wordle, Cuphead, Balatro and Unpacking on the App Store in recent years.
- Apple Developer Forums thread https://developer.apple.com/forums/thread/774172 (WebFetch extraction; developer's account only): the mobile game "Backrooms: Escape", released 15 Oct 2024, was removed in about Feb 2025 under 4.1 Copycats. The developer says Apple pointed to a Steam game ("Backrooms: Escape Together") although "Backrooms" is a shared internet theme with many other App Store titles; after redesigning the characters, name, icons and UI the app was still rejected; it was resolved in March 2025 after escalation to an Apple manager. Apple staff text in the thread: "We're investigating and will contact you in App Store Connect." Other forum threads in my search results (750840, 775373, 793905, 730529) describe 4.1 rejections with vague feedback; I did not open them (⚠️ search snippet only).
- Takeaway for the report: 4.1 is applied at reviewer discretion, can hit a theme or concept shared with a PC game, and has produced vague rejections. It can also be appealed and was reversed in the case I found.

### B2. Greenheart Games / Game Dev Tycoon specifically

All Greenheart statements below come from greenheartgames.com pages that I downloaded and read (full text of the named posts; others only keyword-scanned, see coverage).

**Relationship to Kairosoft's Game Dev Story**
- Patrick Klug, "Happy 5th Steam Release Anniversary," 31 Aug 2018, https://www.greenheartgames.com/2018/08/31/happy-5th-steam-release-anniversary/ (read in full): in 2011 he and Daniel "were inspired by Game Dev Story on the iPhone (made by Kairosoft) and wanted to make a game in that genre with our own spin on it." The plan was a turn-based phone game; they pivoted to Windows 8 (real-time, isometric). Game launched on the Windows 8 Store on 11 Dec 2012, on their own site in late April 2013 (with the piracy experiment), and on Steam on 30 Aug 2013. The post says it has been "ported to iOS and Google Play."
- Klug interview with Leviathyn, 4 Dec 2012, read via Wayback Machine copy https://web.archive.org/web/20121208203304/http://leviathyn.com:80/games-2/pc/2012/12/04/interview-greenheart-games-about-their-upcoming-sim-game-dev-tycoon/ (the original URL now returns 404). He says Game Dev Story was probably the first game he truly enjoyed on his iPhone but he "wished GDS would work and look differently," and wanted it "less random, more about your choices and more realistic." That is Greenheart's own framing: inspiration, with a deliberate attempt to differ in mechanics. (This copy was read in the relevant Q&A; the whole page includes site chrome and unrelated links.)
- Klug, "Game Dev Tycoon - one month summary and outlook," 17 Jan 2013, https://www.greenheartgames.com/2013/01/17/game-dev-tycoon-one-month-summary-and-outlook/ (read in full): players pointed out similarities to Game Dev Story, "which served as the initial inspiration." Most were praise but "some called our game a rip-off. We respectfully disagree with the term." They state they have "been open about our inspiration" and that "our entire game is our own creation - from how games are developed, to how you progress and how you make a hit game."
- Steam forum thread "Game Dev Story Ripoff?" (Aug 15, 2014), https://steamcommunity.com/app/239820/discussions/0/35221031612387248 (⚠️ read 15 of 33 comments; page showed "1-15 of 33"): a user calls it a "blatant ripoff" and says "I have a feeling this will get taken down"; other users defend it. This is user opinion; no developer or Kairosoft response appears in the part I read.
- Wikipedia's Game Dev Tycoon article (https://en.wikipedia.org/wiki/Game_Dev_Tycoon) says it was "inspired by" Game Dev Story and that "many critics find substantial similarities." Wikipedia's Game Dev Story page lists Game Dev Tycoon as "a similar game made by Greenheart Games."
- TouchArcade's iOS review headline (linked from Greenheart's blog) is "If You Liked 'Game Dev Story' You'll Love 'Game Dev Tycoon'" (headline text taken from the Wikipedia citation and Greenheart's link; ⚠️ the TouchArcade page itself returned HTTP 403 and was not read).

**Their trademark**
- Greenheart's site footer (read in full) states "Greenheart Games, Game Dev Tycoon and Tavern Keeper are trademarks of Greenheart Games Pty. Ltd., registered in the US and other countries." (https://www.greenheartgames.com/ , Oct 2026 text.)
- ⚠️ Search-engine snippet only: Justia and TrademarkElite pages (HTTP 403, not opened) list a US mark GAME DEV TYCOON, serial 85687491, registration 4345689, filed July 2012, registered June 2013, with Section 8 and 15 accepted in July 2019, covering video game software, with "GAME" and "DEV" disclaimed. The same snippet showed Kairosoft's "GAME DEV STORY" mark as live with "continued use and incontestability accepted" (status date 6/9/2026). I could not reach USPTO TSDR (it now needs an API key). Verify on USPTO before relying on any of this.
- Relevance: "Game Dev Tycoon" is a registered name. "AI Lab Tycoon" differs in its distinctive words, but this is the registered mark of the game it is openly modelled on, so keep the name and store metadata clear of "Game Dev Tycoon."

**Greenheart's behaviour on clones, takedowns and DMCA**
- Found: NO statement, blog post, or news report of Greenheart filing a DMCA notice, an App Store IP dispute, a lawsuit, or a cease-and-desist against any look-alike. I keyword-scanned all four blog index pages (they list about 34 posts, 2012 to 2020) and fully read the posts named above for clone-related terms. The only clone-related passage is the January 2013 "rip-off" paragraph above.
- Greenheart has a pro-community stance on legal documents: in Nov 2013 they published their EULA and Modding Agreement under a Creative Commons Attribution-ShareAlike licence "free to adapt for your own projects" (https://www.greenheartgames.com/2013/11/12/new-eula-modding-agreement-game-dev-tycoon-free-adapt-projects/ , read in full). They allow monetised Let's Play videos and mods (Modding Agreement change: https://www.greenheartgames.com/2014/01/31/changes-modding-agreement/ , read in full). This is evidence of a permissive posture, not a promise; it says nothing about look-alike games.
- 2013 piracy stunt: https://www.greenheartgames.com/2013/04/29/what-happens-when-pirates-play-a-game-development-simulator-and-then-go-bankrupt-because-of-piracy/ (⚠️ read the opening and keyword-scanned the rest): on 28 Apr 2013 they uploaded a cracked version to a torrent site; players in the cracked copy were bankrupted by in-game piracy. It was an anti-piracy marketing and research stunt, not a legal action. Its own data in the post: over 93.6% of players used the cracked copy in the first day (line from the post, number as printed there).
- Greenheart's site-wide values: "games need to be more than thinly-disguised slot machines optimized solely to generate profit." Their Game Dev Tycoon app page lists no in-app purchases, no ads, no loot boxes, so a commercially similar monetised clone is likely to look especially bad to them (my inference).

**Mobile release of Game Dev Tycoon**
- Announced 17 Oct 2017: https://www.greenheartgames.com/2017/10/17/finally-game-dev-tycoon-is-coming-to-iphone-ipad-and-android-along-with-a-content-update-for-all-platforms/ and the matching PocketGamer news https://pocketgamer.com/game-dev-tycoon/the-video-game-piracy-experiment-game-dev-tycoon-arrives-on-iphone-and-ipad-nove (read in full).
- iOS: released 28 Nov 2017 (Greenheart feed entry "Now Available on iPhone and iPad"; post says the mobile port was "rewritten for mobile from scratch" by partner Rarebyte). Price $4.99 (GameGrin and Greenheart's blog). Apple gave it a "Game of the Day" feature in the US (https://www.greenheartgames.com/2017/12/06/gdt-mobile-release-report-3-game-of-the-day/ , scanned by keyword; the post says Apple editors wrote a multi-page feature and planned it 6 to 8 weeks ahead). The iOS release analysis says Greenheart checked with "our contact at Apple" before sharing sales data (https://www.greenheartgames.com/2017/12/01/mobile-release-day-1-analysis-a-rough-start/ , keyword-scanned).
- Android (Google Play): 31 Jan 2018 (Greenheart feed entry dated 31 Jan 2018). Greenheart reported Google silently removed over 77% of its positive Play Store reviews in Feb 2018 (https://www.greenheartgames.com/2018/02/13/curious-case-google-removing-77-positive-reviews/ , keyword-scanned). That is about review policy, not clones.
- Nintendo Switch: 8 Oct 2020 (https://www.greenheartgames.com/2020/08/26/game-dev-tycoon-is-coming-to-nintendo-switch/ , feed excerpt only).
- Their site now says the game is on Steam, Switch, and mobile with a 4.8 out of 5 rating (October 2026). The App Store product page is https://apps.apple.com/us/app/game-dev-tycoon/id1162580001 (listed in the iTunes API as released 2017-11-28).
- Significance for the report: Apple approved and editorially featured an openly "inspired by Game Dev Story" game in the same genre. That is precedent for Apple tolerating genre-level inspiration, but Greenheart changed the mechanics and presentation (their stated aim), and Kairosoft did not complain publicly in anything I found.

**Other Greenheart statements about clones**
- Not found: any statement by Patrick or Daniel Klug about being cloned, about Mad Games Tycoon, or about "Tycoon"-named games in general. A search for fake Game Dev Tycoon apps on the stores returned only coverage of the 2013 piracy stunt.

### B3. Kairosoft's reaction

- On Game Dev Tycoon: NOT FOUND. No Kairosoft statement about Game Dev Tycoon (any year) appeared in any source I read or in search results. The only Kairosoft-related reactions are user comments (Steam thread, B2) and one search-result mention of a 2014 reviewer opinion.
- On copycats of its own games: Kairosoft's 2021 open letter accused its Chinese publisher Beijing Shi Jun of breaching their 2017 contract and of using Kairosoft's source code to make copy-cat games ("Inn in Chang'an," "Three Kingdom Tale") while using Kairosoft's trademark and reputation. Kairosoft said it sent a termination notice in 2018 and was pursuing "legal measures." NME, 20 Oct 2021, https://www.nme.com/news/kairosoft-accuses-its-chinese-publisher-of-copyright-infringement-3075103 (read in full) and Automaton, 27 Oct 2021, https://automaton-media.com/en/news/20211027-5061/ (the relevant article section read in full; the file also contains site chrome) which also reports Kairosoft's new China partner, Leiting Games, announced 22 Oct 2021. This was a licensing and source-code dispute, not a look-alike dispute; it shows Kairosoft will go public when its code or trademark is used, not that it has policed inspired-by games. TechRaptor's report on the same story returned HTTP 403 (not read).
- A search snippet (not opened, ⚠️) mentioned a reviewer saying Kairosoft "really ought to have the right to sue" a Kairosoft-style clone called Bookstore Dream; that is commentary, not Kairosoft's position.
- Kairosoft still sells Game Dev Story on the App Store (listing from the iTunes API; the "+" version released 2021-06-17), so a Kairosoft-style game on iOS competes in the same store as an active Kairosoft title.

### B4. Takedowns/lawsuits in the tycoon and management genre

What I could verify:
- **Atari and "Haunted House Tycoon":** Atari filed a USPTO notice of opposition in 2011 against indie developer Hazy Dreams' use of "Haunted House" in "Haunted House Tycoon"; oral argument before the Trademark Trial and Appeal Board was set for April 2016 (Techdirt, 21 Apr 2016, read in full via Wayback copy: https://web.archive.org/web/20260425114459/https://www.techdirt.com/2016/04/21/ex-game-maker-atari-to-argue-to-us-pto-that-only-it-can-make-haunted-house-games/ ; the original returned HTTP 403). The claim was over "Haunted House" (an Atari 1982 title, filed as a mark in 2010), not the word "Tycoon." Techdirt is an opinion piece; the outcome is not stated in the article. Not found: any source showing Atari or anyone enforcing "Tycoon" as a trademark.
- **RollerCoaster Tycoon:** the disputes found are royalty and licensing fights (Frontier v. Atari, 2018, which led to RollerCoaster Tycoon 3 being pulled from Steam and GOG) and not look-alike enforcement. ⚠️ From search snippets only (GameInformer, CGMagazine, Overclock3D, not opened). Not found: any Atari or Chris Sawyer cease-and-desist against "tycoon"-named games.
- Atari/Vector Tanks (above) is the closest "retro publisher uses Apple's complaint channel" example.
- Zynga/NimbleBit, Spry Fox/6waves, Vlambeer/Gamenauts (above) are the main "cloning in mobile management or puzzle games" cases. Only Spry Fox went to court and won.

What I did not verify (⚠️ search snippets only, nothing opened):
- Two Point Hospital vs Theme Hospital: sources say it is a "spiritual successor" by former Bullfrog staff (Mark Webley, Gary Carr) published by Sega. No dispute or takedown was reported in the snippets. I did not find who owns the Theme Hospital IP or whether a licence exists.
- Mad Games Tycoon, Game Dev Studio, Startup Company, Software Inc: search found player and reviewer comparisons to Game Dev Tycoon (Steam forum posts, reviews), and no reports of takedowns, DMCA notices or lawsuits, and no Greenheart reaction. I did not open the sources, and I did not search separately for Startup Company or Software Inc beyond one combined query that returned unrelated cloning disputes (King v. 6waves, Zynga v. Vostu, Peak Games v. Hasbro, King/Stolen Goose "Pac-Avoid," and a World IP Review item "Google, Apple, and Alibaba named in video game clone suit," not opened).

---------------------------------------------------------------------------------------------------

## Patterns across the cases (for the adjudication step; my reading, not source claims)

1. Apple's visible removals cluster on (a) the same or deceptively close NAME as a hit (Wordle, Flappy), (b) copied art, sound or presentation reported by a rights holder (Vector Tanks, Flappy Bee stolen art), and (c) impersonation (Sora clones, now 4.1(c)).
2. Cases where the clone changed the name and kept similar mechanics (Ninja Fishing, 2048, Dream Heights) produced public outrage but no reported Apple removal. Only Triple Town v. Yeti Town led to a court ruling and a pull, and its facts included a broken business relationship and near-identical expression.
3. Apple's mechanism is a relay: complaint to Apple, Apple notifies the developer, developer replies, Apple may pull the app, the developer carries indemnity risk under DPLA section 10 (Vector Tanks timeline).
4. Greenheart's own record is open about its Game Dev Story inspiration and defensive about the "rip-off" charge, but there is no evidence they have enforced anything against others. Kairosoft's only public enforcement-type conduct is the China source-code dispute.
5. Names are the cheapest risk to remove: the available evidence (A1, A3, B1, B2) says avoid "Game Dev Tycoon," "Game Dev Story," and any other developer's brand, art, or sounds.

---------------------------------------------------------------------------------------------------

## COVERAGE STATEMENT

All URLs below were opened in this session unless marked "not reached." "Full" means read from the start to the end of the article or section I cite. ⚠️ means partial, extraction-only, or secondary.

### Read in full (article or section cited)
- https://www.apple.com/legal/intellectual-property/dispute-forms/ (full)
- https://www.apple.com/legal/intellectual-property/dispute-forms/app-store/ (full)
- https://developer.apple.com/help/app-review/guideline-reference/4-1-prevent-copycat-rejection (full, body text)
- https://developer.apple.com/help/app-review/safe-and-trusted-store/app-removals (full)
- https://developer.apple.com/help/app-review/safe-and-trusted-store/report-an-app (full)
- https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app (the main steps and FAQ read in full)
- https://www.greenheartgames.com/ , /legal/ , /app/game-dev-tycoon/ (full)
- https://www.greenheartgames.com/feed/ (full, but the feed shows only excerpts of each post)
- Greenheart posts read in full: 2018/08/31 happy-5th-steam-release-anniversary; 2013/01/17 one-month summary; 2013/11/12 new EULA and Modding Agreement; 2014/01/31 changes to Modding Agreement.
- https://pocketgamer.com/game-dev-tycoon/the-video-game-piracy-experiment-game-dev-tycoon-arrives-on-iphone-and-ipad-nove (full)
- https://www.gamegrin.com/news/game-dev-tycoon-is-finally-coming-to-android-devices/ (full)
- https://www.gamedeveloper.com/game-platforms/-i-wordle-i-clones-nuked-from-ios-app-store (full article)
- https://techxplore.com/news/2022-01-copycats-apple-yanks-knockoffs-viral.amp (full)
- https://www.mactrast.com/2022/01/apple-purges-app-store-of-wordle-game-clones-following-outcry/ (full)
- https://www.nme.com/news/kairosoft-accuses-its-chinese-publisher-of-copyright-infringement-3075103 (full)
- https://macrumors.com/2014/02/17/flappy-bird-clones-rejected (full)
- https://www.appspy.com/news/8196/apple-tells-new-games-with-flappy-in-their-titles-to-flap-off (full)
- https://www.techcentral.ie/apple-google-strike-back-against-flappy-bird-clones/ (full)
- https://techcrunch.com/2014/03/24/clones-clones-everywhere-1024-2048-and-other-copies-of-popular-paid-game-threes-fill-the-app-stores (full)
- https://www.complex.com/pop-culture/a/andrew-freedman/threes-developers-discuss-clones-2048 (full)
- https://gamedeveloper.com/business/ubisoft-buys-publisher-of-notorious-game-clone-i-2048-i- (full)
- https://www.pocketgamer.com/ridiculous-fishing/update-ridiculous-fishing-creator-writes-an-open-letter-to-gamenauts-over-clone/ (full)
- https://www.engadget.com/2011-08-11-new-ios-title-looks-eerily-similar-to-popular-flash-title-also-d.html (full)
- https://mcvuk.com/development-news/triple-town-cloning-suit-settled/ (full)
- https://www.pocketgamer.com/articles/045754/r/ (full)
- https://technologizer.com/2012/01/25/everyone-rips-off-everyone-or-nimblebit-vs-zynga/index.html (full)
- https://www.engadget.com/2012-01-25-nimblebit-calls-out-zynga-clone-of-tiny-tower.html (full)
- https://gamesbeat.com/exclusive-app-store-game-copycat-battle-zone-heats-up/ (full)
- https://technologizer.com/2012/01/04/atari-shuts-down-vector-tanks-battlezone-clone/index.html (article body full; reader comments partly)
- https://www.pocketgamer.com/vector-tanks/atari-takes-legal-action-against-battlezone-inspired-vector-tanks-iphone-games-a/ (full)
- https://9to5mac.com/2025/11/13/apple-tightens-app-review-guidelines-to-crack-down-on-copycat-apps/ (article body full)
- https://www.macstories.net/?p=79852 (full)
- Wayback copy of the Leviathyn interview (full Q&A section read): https://web.archive.org/web/20121208203304/http://leviathyn.com:80/games-2/pc/2012/12/04/interview-greenheart-games-about-their-upcoming-sim-game-dev-tycoon/
- Wayback copy of Techdirt (Atari/Haunted House Tycoon), article body full: https://web.archive.org/web/20260425114459/https://www.techdirt.com/2016/04/21/ex-game-maker-atari-to-argue-to-us-pto-that-only-it-can-make-haunted-house-games/
- iTunes Search API calls (US store, three terms) for the live name check.

### Read in part (⚠️)
- ⚠️ https://developer.apple.com/app-store/review/guidelines/ : downloaded the whole page (about 101,870 characters of text) but read only the sections cited (4.1, 2.3.7, 2.3.8, 5.2.1 to 5.2.5, 1.1.2 and the neighbouring text via targeted search). Not read: the rest of the Guidelines.
- ⚠️ https://developer.apple.com/support/terms/apple-developer-program-license-agreement/ : about 640k characters; only sections 3.2(4), 6.9, 10 and 11.2 were located and read. WebFetch alone covered only the first 100,000 characters and was cut off.
- ⚠️ https://developer.apple.com/help/app-store-connect/reference/app-information/app-information : read only the Name and Subtitle rows.
- ⚠️ https://developer.apple.com/forums/thread/91335 , /691494 , /786340 : read via WebFetch extraction (helper-model summary, not raw text); statements marked secondhand where Apple Support text was quoted by a user.
- ⚠️ https://developer.apple.com/forums/thread/774172 : WebFetch extraction only.
- ⚠️ https://www.macworld.com/article/200561/namesquatting.html : WebFetch extraction only (2009 article).
- ⚠️ https://gamesbeat.com/fishy-business-the-story-of-an-app-store-clone-war/ : extracted about 40 long paragraphs with a line cap; the end of the article may be missing.
- ⚠️ Greenheart posts keyword-scanned only (terms: clone, copycat, Kairosoft, Game Dev Story, DMCA, takedown, trademark, rip-off, inspired, similar, fake): 2013/04/29 piracy post (opening read plus scan), 2017/10/17 announcement, 2017/11/29 now-available post, 2017/12/01 to 2018/01/15 iOS release reports 1 to 4, 2018/02/02 Android day 1, 2018/02/13 Google reviews, 2015/02/10 and 2015/12/31 recaps. Also the four blog index pages (/blog/, /blog/page/2/ to /page/4/) were keyword-scanned only; the 2012 to 2013 posts on page 3 and 4 (about 20 posts, for example Steam Greenlight and update notes) were not read individually.
- ⚠️ https://steamcommunity.com/app/239820/discussions/0/35221031612387248 : first 15 of 33 comments only.
- ⚠️ https://www.automaton-media.com/en/news/20211027-5061/ : read the relevant article; the saved page is mostly site chrome.
- ⚠️ https://en.wikipedia.org/wiki/Game_Dev_Tycoon , https://en.wikipedia.org/wiki/Game_Dev_Story , https://en.wikipedia.org/wiki/Triple_Town : read only the lines matching inspiration, clone, and lawsuit terms.
- ⚠️ https://www.greenheartgames.com/2017/12/06/gdt-mobile-release-report-3-game-of-the-day/ and /2017/12/01/ : keyword-scanned (see above).

### Search-result snippets only, source not opened (⚠️)
- Game Dev Tycoon trademark registration details (Justia/TrademarkElite pages); Kairosoft "GAME DEV STORY" trademark status.
- Haunted House Tycoon outcome; RollerCoaster Tycoon royalty disputes (GameInformer, CGMagazine, Overclock3D, N4G).
- Two Point Hospital/Theme Hospital sources (Wikipedia, Neowin, DualShockers, AU Review, PC Games Insider, TheSixthAxis).
- Mad Games Tycoon / Game Dev Studio comparisons (Steam forums, Digitally Downloaded, Games Asylum, Everyeye).
- The Chinese-language item on Threes being briefly pulled from Google Play (wnhub.io); the reviewer commentary on Bookstore Dream.
- Apple Developer Forums 4.1 rejection threads 750840, 775373, 793905, 730529.
- World IP Review "Google, Apple, and Alibaba named in video game clone suit" and the other cloning-suit items (King v. 6waves, Zynga v. Vostu, Peak v. Hasbro).
- VideoGameGeek, Vandal, iPhon.fr, Droidgamers, iphonesoft.fr pages on Game Dev Tycoon's mobile release dates (dates were confirmed instead from Greenheart's own feed).

### Could not reach (HTTP 403 or 404, or no access)
- https://toucharcade.com/2017/10/17/game-dev-tycoon-mobile/ and the 2017/11/28 review (403)
- https://www.androidauthority.com/game-dev-tycoon-play-store-reviews-removed-837977 (403)
- https://gamespot.com/articles/caught-red-handed-punishing-pirates-in-a-virtual-world/1100-6407994/ (403)
- https://techraptor.net/... (Game Dev Tycoon bitter cartridges post, and the Kairosoft story) (403)
- https://mac.softpedia.com/blog/Apple-No-More-Flappy-Games-Please-427344.shtml (403)
- https://giantbomb.com/articles/meet-the-clones (403)
- https://trademarks.justia.com/... , https://www.trademarkelite.com/... , https://www.techdirt.com/2016/04/21/... (403 live; Techdirt read through Wayback instead)
- https://tsdrapi.uspto.gov/... (401, USPTO API now needs a key)
- http://leviathyn.com/games-2/pc/2012/12/04/... (404 live; read through Wayback instead)
- https://developer.apple.com/help/app-store-connect/manage-app-information/reserve-an-app-name/ (page not found; no such Apple page located)

### Not found despite searching
- Any DMCA notice, App Store IP dispute, lawsuit or cease-and-desist filed by Greenheart Games.
- Any Kairosoft statement about Game Dev Tycoon, or any Kairosoft takedown of a look-alike game.
- Any enforcement of "Tycoon" as a trademark by Atari or others.
- Any Apple policy giving a test for "confusingly similar" third-party app names.
- Any Apple statement on how long an unused app record keeps a reserved name.
