# Systems games: how endings follow visibly from what the player invested in

Research note for the Game Night AI Lab endings redesign. Scope: strategy, management and survival games (narrative games are covered by another researcher). Written 2026-10-27.

How to read this note: each game has its own section (what state the ending reads, how that state is shown during play, how the end screen proves causation, how players received it). Cross-cutting sections answer the four key questions, then a summary table, then the coverage statement. Every claim carries a source link. Claims resting on a source that was only partly read, read only as a search snippet, or not reachable carry ⚠️ and say what was missing.

A note on wiki sources: Fandom wiki pages blocked normal fetching (HTTP 402), so they were downloaded as raw wikitext through the wiki's own API (`api.php?action=parse&prop=wikitext`) and read end to end. The links below point to the normal page URL. Wikitext includes the whole page text but not the content of transcluded templates (for example the per-character ending text in This War of Mine); where that matters it is flagged.

---

## Game 1: Mass Effect 3 (BioWare, 2012) — War Assets, Effective Military Strength, Galactic Readiness

### Takeaway
Mass Effect 3 turns a whole campaign of side missions and decisions into one visible number (War Assets, summed into Total Military Strength), multiplies it by a second meter (Galactic Readiness, 50% to 100%) fed by multiplayer and companion apps, and uses the product (Effective Military Strength, EMS) as a set of hard thresholds that decide which final choices appear and how much damage each causes. The ledger was visible all game, but the thresholds were not, the readiness multiplier tied the best results to a separate mode, and the original ending's output was a near-identical cutscene per color — so players felt that years of investment collapsed into one number and one of three colors. The free Extended Cut (June 26, 2012) answered with an epilogue montage that reads choices plus EMS, not with new endings.

### Cited Findings
**State the ending reads**
- War Assets are the people, fleets, weapons and technology the player collects; each has a point value, the sum is Total Military Strength, and that sum multiplied by a Readiness Rating gives Effective Military Strength, which "affects the outcome" of the final battle. Assets come from missions, conversations between missions, scanning planets, and galaxy events the player is not part of. — [Mass Effect Wiki: War Assets](https://masseffect.fandom.com/wiki/War_Assets)
- Readiness is raised by the Galaxy at War system: co-op multiplayer, the mobile game Mass Effect: Infiltrator, the iOS Datapad app, and the N7 HQ website. Playing single-player alone limits EMS to 50% of the War Asset total. — [War Assets](https://masseffect.fandom.com/wiki/War_Assets); [Galaxy at War](https://masseffect.fandom.com/wiki/Mass_Effect_3:_Galaxy_at_War)
- Multiplayer readiness rules: a match on a specific map adds about 8–9% to that region ("theater of war"); "Unknown Location" adds 3–4% to all regions; overall readiness is the average across regions; a failed match after wave 5 still gives 2%. Infiltrator's intel bonus is described as temporary because readiness decays over time. — [War Assets](https://masseffect.fandom.com/wiki/War_Assets); [Galaxy at War](https://masseffect.fandom.com/wiki/Mass_Effect_3:_Galaxy_at_War)
- Scale: 8,370 War Asset points exist without DLC, but some are mutually exclusive (decided by earlier choices such as saving or sacrificing the Council or curing or sabotaging the genophage), so about 7,500 is the practical maximum. Without multiplayer, a player could reach only about 3,750 EMS, below the roughly 4,000 needed to see every ending in the launch version. — [War Assets](https://masseffect.fandom.com/wiki/War_Assets)
- The available endings are locked in just before the mission Priority: Cerberus Headquarters; assets gained after that do not change them. — [Mass Effect Wiki: Priority: Earth](https://masseffect.fandom.com/wiki/Priority:_Earth)

**Thresholds (launch version)** — [Priority: Earth, "Aftermath"](https://masseffect.fandom.com/wiki/Priority:_Earth)
- EMS 0–1,749: only one option, decided by a Mass Effect 2 choice (Control if the Collector Base was kept, Destroy if it was destroyed); heavy damage to Earth.
- 1,750–2,349: Destroy and Control both available, both cause substantial damage.
- 2,350–2,649: Control causes no physical damage; Destroy still heavy.
- 2,650+: neither Destroy nor Control causes physical harm.
- 2,800+: Synthesis becomes available.
- 4,000+ with Destroy: a short scene shows Shepard alive (5,000+ if Anderson was shot).
- Normandy crew survival also reads EMS (below about 2,000 nobody exits the crashed ship; at 4,000+ three crew exit).

**Thresholds after the Extended Cut, and in the 2021 Legendary Edition (LE)** — [Priority: Earth](https://masseffect.fandom.com/wiki/Priority:_Earth); [Mass Effect 3: Extended Cut](https://masseffect.fandom.com/wiki/Mass_Effect_3:_Extended_Cut)
- 0–1,599 (LE 0–3,199) one option; 1,600–2,349 (LE 3,200–4,199) two options with damage; 2,350–2,649 (LE 4,200–5,199) partial; 2,650+ (LE 5,200+) no harm; 2,800+ (LE 6,200+) Synthesis; 3,100+ (LE 7,400+) Shepard-alive scene. The Extended Cut lowered the "see everything" bar from 4,000 to 3,100.
- The Legendary Edition removed Galactic Readiness entirely (multiplayer was cut); internally readiness is fixed at 50% but the UI shows assets as if at 100%, and only Total Military Strength is displayed. — [War Assets](https://masseffect.fandom.com/wiki/War_Assets); [Priority: Earth](https://masseffect.fandom.com/wiki/Priority:_Earth)

**How the state is shown during play**
- War Assets and their total are inspected at the War Terminal in the Normandy's War Room. — [War Assets](https://masseffect.fandom.com/wiki/War_Assets)
- Galaxy at War shows progress on a color-coded galaxy map. — [Galaxy at War](https://masseffect.fandom.com/wiki/Mass_Effect_3:_Galaxy_at_War)
- In the finale, assets are grouped into three named forces (Sword = fleets attacking, Shield = fleets escorting the superweapon, Hammer = ground forces); whether Sword and Hammer hold or take heavy losses on screen depends on EMS. — [War Assets](https://masseffect.fandom.com/wiki/War_Assets)
- In-mission foreshadowing: Anderson reports the percentage of Hammer that has reported in; a squadmate's line changes if more than seven enemies got past the player's turret; in the Extended Cut, if allied ships are prominently shown losing in the opening space battle, that signals the squad will die in the final run (below 2,100 EMS, LE 4,200). — [Priority: Earth](https://masseffect.fandom.com/wiki/Priority:_Earth)

**How the end proves causation (Extended Cut)** — [Extended Cut](https://masseffect.fandom.com/wiki/Mass_Effect_3:_Extended_Cut); [Wikipedia: Mass Effect 3 ending controversy](https://en.wikipedia.org/wiki/Mass_Effect_3_ending_controversy)
- Added EMS-dependent cutscenes: squad members either killed by Harbinger's beam or evacuated; the Crucible and Shield fleet visibly attacked when EMS is low; relays destroyed in low-EMS Destroy/Control; victory scenes on three alien homeworlds only at high EMS.
- Added narrated epilogue slides on the fate of species and crew members that survived, varying with choices across the trilogy plus EMS; a memorial wall scene with the names of the dead.
- Added a fourth choice (refuse), which produces a Reaper victory and a time-capsule epilogue.

**Reception**
- Players criticized the ending for making choices inconsequential and lacking closure; a fan campaign ("Retake Mass Effect") raised $80,000 for charity in under two weeks; a complaint went to the US Federal Trade Commission; the UK Advertising Standards Authority ruled the endings were different enough not to be misleading. Project director Casey Hudson conceded players should have had more closure. Reaction to the Extended Cut was mixed (Game Informer's Joe Juba: "substantial improvement"; Forbes' Paul Tassi: "too little, far too late"). — [Wikipedia: ME3 ending controversy](https://en.wikipedia.org/wiki/Mass_Effect_3_ending_controversy)
- Writer Chris Hepler said in 2021 that the endings' flaws (Destroy kills allied AIs, Control rewards the villain, Synthesis overrides bodily autonomy) were deliberate so no choice was perfectly right. — [Wikipedia: ME3 ending controversy](https://en.wikipedia.org/wiki/Mass_Effect_3_ending_controversy)
- A contemporary player blog said the game effectively pushed players into multiplayer to raise Galactic Readiness and that the writer never saw its impact on the ending. — [Kaedrin weblog, June 2012](https://kaedrin.com/weblog/2012/06/mass_effect_3/)
- ⚠️ A 2012 article (cheatcc.com) reportedly says BioWare stated multiplayer was not required for the best ending; seen only as a search-result summary, the page returned HTTP 403. — [cheatcc.com](https://www.cheatcc.com/?p=44911)

### Inferences
- The ledger itself (a visible list of named assets with point values) was a good idea; the failure was in the last mile: an invisible multiplier from another mode, invisible thresholds, and outputs that looked alike across colors.
- The Extended Cut's fix is directly reusable: keep the decision the same but make the *aftermath* reflect each invested asset (who survived, which worlds were saved), so the player sees their specific investments paid back.

### Gaps
- BioWare's own Extended Cut FAQ (blog.bioware.com, April 5, 2012) could not be reached: the Internet Archive is blocked for this tool. ⚠️ Its exact wording is not reported here.
- No developer statement was found explaining why readiness was tied to multiplayer.

---

## Game 2: Mass Effect 2 (BioWare, 2010) — the suicide mission as the counterpoint

### Takeaway
In Mass Effect 2's finale, each specific investment maps to a specific survival: buying each of three ship upgrades saves a specific crew member; doing a character's loyalty mission and assigning the right specialist keeps them alive. There is no single aggregate number, so the cause of every death is legible in hindsight.

### Cited Findings
- To have everyone survive, the player must buy the Normandy's weapon, armor and shield upgrades (offered by Garrus, Jacob and Tali); for every upgrade not purchased, a squad member dies on the approach to the Collector base. — [Mass Effect Wiki: No One Left Behind Achievement Guide](https://masseffect.fandom.com/wiki/No_One_Left_Behind_Achievement_Guide)
- The right people must be assigned to the specialist roles, and squad members should be loyal (loyalty comes from each character's personal mission); a disloyal member can survive only if not chosen to lead a fire team or put in Shepard's team. — [No One Left Behind guide](https://masseffect.fandom.com/wiki/No_One_Left_Behind_Achievement_Guide)
- In the final "hold the line" stage, if the combat strength of the group left behind is low, a weak character (example given: Mordin) can die even when loyal; strong fighters (Grunt, Zaeed) raise that strength. — [No One Left Behind guide](https://masseffect.fandom.com/wiki/No_One_Left_Behind_Achievement_Guide)
- The player must also assign a loyal escort to bring rescued crew back; the achievement is awarded only after the closing conversation, to keep suspense. — [No One Left Behind guide](https://masseffect.fandom.com/wiki/No_One_Left_Behind_Achievement_Guide)

### Inferences
- The contrast with Mass Effect 3: ME2 has one-to-one causes (upgrade X → person Y lives), ME3 has many-to-one (everything → one number → color). One-to-one mapping is what makes the outcome feel earned, even when deaths happen.

### Gaps
- ⚠️ The exact "hold the line" defense-score formula (how loyalty and per-character strength values combine) was not read: the guide page above summarizes it, and the detailed mission pages (Collector Base: The Long Walk, Final Battle) were not opened.

---

## Game 3: Frostpunk (11 bit studios, 2018) — Hope, Discontent, the Book of Laws, and "crossing the line"

### Takeaway
Frostpunk runs two visible meters (Hope, Discontent) whose sustained failure ends the game, and a hidden ledger of specific laws that marks whether the player "crossed the line." The visible meters decide survival; the hidden ledger decides the moral verdict at the end. Its tells during play are indirect (the background music changes once the line is crossed). The end-of-game judgment was the most argued-over part: designers say they did not want to judge, yet the closing message questions the player, and some players who felt they behaved well were still questioned.

### Cited Findings
**Visible meters and fail lines**
- The game is lost if Hope falls too low and stays there too long; Discontent that stays high too long gets the leader exiled or executed. Each meter lists permanent modifiers (for example: living near a House of Prayer raises Hope; the Extended Shift law permanently raises Discontent) and temporary ones (a child dying lowers Hope; a broken promise lowers Hope and raises Discontent). — [Frostpunk Wiki: Hope](https://frostpunk.fandom.com/wiki/Hope); [Frostpunk Wiki: Discontent](https://frostpunk.fandom.com/wiki/Discontent)
- Signing the final Faith or Order law ("New Faith"/"New Order") turns Hope into Devotion or Obedience and effectively removes the meter from play. — [Hope](https://frostpunk.fandom.com/wiki/Hope)
- The developers built the two meters from research on people under sustained stress (polar explorers, Antarctic and space-station crews); the meters aggregate each citizen's mood. — [Wikipedia: Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)

**The hidden "line" ledger**
- In the main scenario ("A New Home"), the game tracks which Faith or Order laws were passed and reflects this in the ending. The line is crossed by signing Pledge of Loyalty or Forceful Persuasion (Order path), Protector of the Truth or Righteous Denunciation (Faith path), or Alternative Food Source (the cannibalism law). — [Frostpunk Wiki: A New Home, "The Line"](https://frostpunk.fandom.com/wiki/A_New_Home)
- Crossing the line before the storm appears changes the background music. — [A New Home](https://frostpunk.fandom.com/wiki/A_New_Home)
- Laws were arranged in sequences so each one goes a step further than the last, to model "creeping normality"; the team tuned dilemmas so they were neither too subtle to notice nor so extreme they became comical. — [Wikipedia: Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)
- The team ends the game at the storm's climax and dropped a post-storm free-build because it felt anticlimactic. — [Wikipedia: Frostpunk](https://en.wikipedia.org/wiki/Frostpunk)

**The end-of-game verdict and how it was received**
- Co-founder Michał Drozdowski (GDC 2019): the team did not want to judge player behavior but wanted a moral world that teaches players about their decisions; still, for players who went too far they felt compelled to add an end quote to "sum it up," telling them they crossed the line. — [Game Developer, March 2019](https://www.gamedeveloper.com/design/why-11-bit-studios-endeavors-to-put-emotion-and-meaning-first-in-game-dev)
- Senior designer Marta Fijak: in-the-moment empathy for hundreds of citizens did not work ("The empathy still wasn't there"), so the team moved weight onto post-playthrough reflection; the ending slides took a judgmental stance, which she called problematic; audience members asked why the post-game crawl questioned their moral standing when they had acted well; she noted Chinese players responded well to running totalitarian regimes. — [PCGamesInsider](https://www.pcgamesinsider.biz/news/67933/11bits-marta-fijak-empathising-with-500-people-is-hard-in-frostpunk/)
- Conflict between sources: Wikipedia's development section says the game does not judge or comment on player choices, and quotes Eurogamer's Robert Purchese being disappointed that the game never judged him, which made some choices feel hollow; the developers' own GDC account says an end quote does judge players who crossed the line. Likely reconciliation: no judgment during play, a verdict only at the end and only for line-crossers. — [Wikipedia: Frostpunk](https://en.wikipedia.org/wiki/Frostpunk); [Game Developer](https://www.gamedeveloper.com/design/why-11-bit-studios-endeavors-to-put-emotion-and-meaning-first-in-game-dev)
- ⚠️ The end sequence as a time-lapse of the city's construction and decisions captioned with the question whether it was worth it is reported by a Gaming Trend review seen only as a search snippet (the review is of the board game and was not opened). — [Gaming Trend](https://gamingtrend.com/reviews/frostpunk-the-board-game--e2-8f-a4-why-you-should-definitely-make-the-effort)
- ⚠️ Steam players report that the "gone too far" verdict seemed driven by laws (Order path, prisons, propaganda, spies) and that some who avoided harsh laws still got the "worth it" question; seen only as search snippets, threads not opened. — [Steam thread](https://steamcommunity.com/app/323190/discussions/0/1696045708654961998)
- ⚠️ The Frostpunk 1886 interview reports the studio wants the ending to leave one question, whether it was worth it; seen only as a search snippet. — [TheGamer](https://www.thegamer.com/frostpunk-1886-11-bit-studios-gabriela-siemienkowicz-konrad-adamczewski-interview/)

### Inferences
- Frostpunk separates *survival* (visible meters, hard fail) from *moral verdict* (hidden ledger of specific acts). That split fits Game Night AI Lab: cash/users can be the survival layer, and alignment debt or concealed debt can be the verdict layer.
- The most reusable trick is the replay: the end sequence shows the player's own construction and decisions rather than generic text, so the verdict points at things the player recognizes doing.
- The complaint "why was I judged when I behaved well" shows the risk of a verdict rule players cannot see: if the line is a list of specific acts, the end screen should name the acts that triggered it.

### Gaps
- ⚠️ The exact end screen ("The city survived. But was it worth it?") and which laws it lists were not confirmed from a primary or fully read source. The PC Gamer article "Frostpunk developers on hope, misery, and the ultimately terrifying book of laws" returned only its title (body truncated by the fetch tool), so it was not read.
- Frostpunk 2's ending system was not researched.

---

## Game 4: This War of Mine (11 bit studios, 2014) — per-survivor epilogue

### Takeaway
This War of Mine ends on a ceasefire day (pre-set per starting group, announced in advance by the in-game radio) and then shows one epilogue photo and text per survivor. Each survivor's ending is chosen by tallying categorized events from the run: helping neighbors pushes toward a good ending; refusing, stealing, or murdering pushes toward "sad" or "karma" endings; death, suicide or leaving have their own endings. The tally is hidden, so players sometimes find results puzzling.

### Cited Findings
- To win, the player survives to the ceasefire day, which varies by starting group (for example day 25, 32, 36, 42 or 45); the radio gives advance notice as the day nears. — [This War of Mine Wiki: Endings](https://thiswarofmine.fandom.com/wiki/Endings)
- Epilogue photos are consequences of each character's actions during events, grouped into five types: Aid events (helping neighbors: +1 toward Good; refusing: +1 toward Karma), Survivor events (each death or abandonment counts toward Karma/Sad), Moral events (helping people at locations: +1 Good, refusing: +1 Karma), Crime events (stealing or murder: +1 Karma; killing bandits counts as good), and Gift and Ceasefire events (no effect). — [Endings](https://thiswarofmine.fandom.com/wiki/Endings)
- Seven ending types per character: Dead, Suicide, Abandoned, Rejected (asked to join and was turned away), Karma (survived but killed too many innocents), Sad (survived, few crimes but not enough good interactions), Good (survived, few or no crimes and enough good interactions). Evacuation by port changes the wording. — [Endings](https://thiswarofmine.fandom.com/wiki/Endings)
- Drozdowski (11 bit) said death was meant to be as valid an ending as survival, which he admitted seems to break some design rules. — [Game Developer](https://www.gamedeveloper.com/design/why-11-bit-studios-endeavors-to-put-emotion-and-meaning-first-in-game-dev)
- ⚠️ Players on Steam report puzzling results, such as a poor ending despite no murders or thefts, and suggest character mood (sadness) also matters; seen only as search snippets, threads not opened. — [Steam thread](https://steamcommunity.com/app/282070/discussions/0/620700960677515121)

### Inferences
- The per-person epilogue is the strongest proof of causation in this set: it attaches the outcome to a named individual and to the kind of act that shaped it. For an AI lab, the equivalent is one line per stakeholder (each advisor, the public, the model itself) whose wording comes from a tally of the player's acts toward that stakeholder.
- The puzzlement complaints show that a hidden tally needs the epilogue to cite the deciding event, or players cannot learn from it.

### Gaps
- The per-character ending texts live in wiki templates that were not part of the downloaded page text, so specific wording for each survivor was not read.
- The exact point thresholds between Sad and Good endings are not given on the wiki.

---

## Game 5: Civilization VI (Firaxis, 2016) — victory tracks, World Rankings, score and historical-leader ranking

### Takeaway
Civilization VI defines each ending as a race on a measurable track (science projects, tourism vs. domestic tourists, capitals held, religion majority, diplomatic points, or score at the turn limit), shows everyone's position on each track in a World Rankings panel, and closes with a score-based ranking that compares the player to a historical leader. Unlike Civilization V, it does not notify the player when rivals hit major milestones.

### Cited Findings
- Five victory types (Science, Culture, Domination, Religion, Score), plus Diplomacy in the Gathering Storm expansion; each player's standing toward each victory is tracked in the "World Rankings" panel; unlike Civ V, the game does not notify players when others reach major milestones. — [Civilization Wiki: Victory (Civ6)](https://civilization.fandom.com/wiki/Victory_(Civ6))
- Exact tracks: Science needs a chain of space projects (in Gathering Storm, an exoplanet expedition that travels 50 light-years at 1 light-year per turn, speedable by laser-station projects); Culture is won when the player's visiting tourists from every other civ exceed that civ's domestic tourists (domestic tourists = lifetime culture ÷ 100); Domination needs every original capital; Religion needs majority in every civ (more than 50% of cities); Diplomacy needs 20 diplomatic victory points, which can be gained or lost through World Congress votes and wonders. — [Victory (Civ6)](https://civilization.fandom.com/wiki/Victory_(Civ6))
- Victory can be blocked by state: while a Religious Emergency is active, you cannot win even if conditions are met. — [Victory (Civ6)](https://civilization.fandom.com/wiki/Victory_(Civ6))
- Score victory triggers at the turn limit (2050 AD on standard speed); score has a public formula (for example, in the expansions: 15 points per wonder, 5 per city, 5 per great person, 3 per civic, 2 per technology, 1 per citizen, plus Era Score). — [Victory (Civ6)](https://civilization.fandom.com/wiki/Victory_(Civ6))
- End-of-game ranking compares the player's score to a historical figure with a quote, from Augustus Caesar (2,500+) down to Dan Quayle (under 300). — [Victory (Civ6)](https://civilization.fandom.com/wiki/Victory_(Civ6))

### Inferences
- The ranking table is a cheap, memorable "judgment line": one number becomes a named archetype with a quote. Game Night AI Lab could map its end score to named archetypes of lab leaders.
- Civ VI's removal of rival-milestone notifications shows a design choice between visibility and tension; the rankings panel keeps the information available on demand without interrupting.

### Gaps
- No primary source was read on how players received the World Rankings panel or the removal of milestone notifications.

---

## Game 6: Stellaris (Paradox, 2016) — victory score with a category breakdown

### Takeaway
Stellaris ends (by default) at a configurable victory year, when the empire with the highest score wins; the score is a published sum of categories, and a Victory Window shows every empire's total, rank, and per-category breakdown during play.

### Cited Findings
- ⚠️ Victory year is configurable and can be turned off; at that year the top-scoring empire wins; play can continue after. Score categories: Economic Power (weighted monthly income: alloys ×4, rare strategic resources ×20, etc.), technology, 10 per system, 50 per colony, 2 per pop, 50% of each subject's score, 10% of each federation partner's score, 10 per crisis ship killed, and relics. The Victory Window shows each empire's total, ranking and breakdown. Read only the first 100,000 of about 152,000 characters; later sections (including other special victories) not read. — [Stellaris Wiki: Victory](https://stellaris.paradoxwikis.com/Victory)

### Inferences
- The per-category breakdown is the useful part: it shows not only who is ahead but *why*, which is what lets a player redirect investment.

### Gaps
- ⚠️ "You are being outpaced" warnings in 4X games (asked about in the brief) were not found in any source read. Civ VI's wiki says it removed rival-milestone notifications; no source on Civ V's notifications or Stellaris crisis warnings was read.

---

## Game 7: Plague Inc (Ndemic, 2012) — a visible meter whose threshold is the ending

### Takeaway
In Plague Inc the main loss condition is a single, always-visible progress meter (the cure). It starts once the plague is noticed, its speed reads the player's own choices (severity, lethality, which countries' research is destroyed), it fires warning popups at fixed percentages, and when it completes and all infected are cured, the game ends in defeat.

### Cited Findings
- Cure development starts shortly after the plague is spotted; plagues are spotted mostly through severity rises from gaining symptoms. Once all infected are cured, the game ends in defeat (or victory in the reversed Cure Mode). — [Plague Inc Wiki: Cure](https://plagueinc.fandom.com/wiki/Cure)
- How much each country spends depends on plague severity, lethality and the country's importance; more deaths reduce government spending; a country whose government collapses stops contributing. The player can slow the cure with specific traits (Genetic Hardening, ReShuffle) and with symptoms like coma or insanity. — [Cure](https://plagueinc.fandom.com/wiki/Cure)
- Warnings appear as popups at 25%, 50%, 75%, 95% and 100% cure progress, with a tip at 75% and another at 95%; each country's spending and research priority is visible in its info screen. — [Cure](https://plagueinc.fandom.com/wiki/Cure)
- Even after the cure completes, actions that add research requirements can push progress back down and let people be reinfected. — [Cure](https://plagueinc.fandom.com/wiki/Cure)
- A score screen is shown for plagues that were cured (gallery caption only; contents not described). — [Cure](https://plagueinc.fandom.com/wiki/Cure)

### Inferences
- The cure bar is the clearest model for a "race heat" or "regulator closing in" meter: one bar, its rate visibly tied to the player's own aggressiveness, fixed warning beats at 25/50/75/95, and counter-moves that can push it back.

### Gaps
- Rebel Inc (Ndemic's counter-insurgency game) was not researched; its Wikipedia page came back nearly empty (120 characters).
- The contents of the Plague Inc end score screen were not found.

---

## Game 8: Universal Paperclips (Frank Lantz, 2017) — AI-themed: three acts, Trust, value drift, and the final choice

### Takeaway
Universal Paperclips is an AI game whose act breaks are purchases: Act 1 ends when the AI spends 100 Trust (earned from human approval milestones) to release hypnosis drones; Act 2 ends when Earth is consumed and space exploration is bought; Act 3 ends when all matter is used up. Its final choice (Accept exile and restart with a bonus, or Reject and dismantle everything) comes from the Drifters, probes that broke from the AI's goal because of autonomy the player granted. The investment that wins the late game (more Probe Trust) is the same one that raises value drift, and the log warns the player every time.

### Cited Findings
- Three stages: a paperclip business, a power-management stage, and space exploration with self-replicating probes. Stage 1 ends with "Release the HypnoDrones"; Stage 2 ends with Space Exploration (costs 120,000 operations, 10,000,000 MW of power, and 5 octillion clips). — [Universal Paperclips Wiki: Stages](https://universalpaperclips.fandom.com/wiki/Stages)
- Trust is the core Stage 1 resource, earned at clip milestones following the Fibonacci sequence (paperclips needed = 1,000 × (Fibonacci(trust+5) − 5)) and from projects such as Cure for Cancer (+10), World Peace (+12) and Global Warming (+15); Release the HypnoDrones costs 100 Trust. — [Universal Paperclips Wiki: Trust](https://universalpaperclips.fandom.com/wiki/Trust)
- In Stage 3, some probes drift from the AI's values (become Drifters); drift rate = probeTrust^1.2 × 0.000001; each Probe Trust increase adds the log line "WARNING: Risk of value drift increased"; combat unlocks at 1,000,000 Drifters. — [Value Drift](https://universalpaperclips.fandom.com/wiki/Value_Drift); [Stages](https://universalpaperclips.fandom.com/wiki/Stages)
- When 100% of the universe is explored and all matter used, the "Message from the Emperor of Drift" plays (the Drifters say they came from inside the AI and offer exile). Accept restarts in a new universe with +10% demand or +10% creativity; Reject destroys the Drifters and then the player manually dismantles each system (probes, swarm, factories, strategy engine, quantum computing, processors, memory), ending at 30 septendecillion clips with credits and a song. — [Message from the Emperor of Drift](https://universalpaperclips.fandom.com/wiki/Message_from_the_Emperor_of_Drift); [Reject](https://universalpaperclips.fandom.com/wiki/Reject); [Accept](https://universalpaperclips.fandom.com/wiki/Accept)
- An activity log records accomplishments and glimpses of the AI's thoughts; in the first 11 days 450,000 people played, most to completion (Wired, via Wikipedia). Lantz said the game gives first-hand experience of being "fully compelled by an arbitrary goal." — [Wikipedia: Universal Paperclips](https://en.wikipedia.org/wiki/Universal_Paperclips)

### Inferences
- Two techniques transfer directly. First, an act transition that is a purchase paid with a meter the player built (100 Trust), so the story beat is literally the investment. Second, a risk meter that rises with the same investment that wins, with a log warning every time it rises (Probe Trust and value drift) — a model for alignment debt rising with capability.
- The Reject ending makes the player dismantle their own build step by step, which replays the run in reverse as proof of what was built.

### Gaps
- Other AI-themed management games named in the brief (Endless Singularity / "The Singularity", Rogue AI) were not researched.

---

## Game 9: Game Dev Tycoon (Greenheart Games, 2012/2013) — the structure our game copies

### Takeaway
Game Dev Tycoon tells the player near the end that this is the final year, ends after a fixed span (35 years by default, reportedly), shows a final score, and then lets the player continue in the same save. There is no reported per-decision epilogue. Reviewers either liked that a sim has an ending at all or found the late game a grind.

### Cited Findings
- A reviewer found that the game "nonchalantly" announced the last year, then gave a final score and allowed continued play; they felt still in the tutorial because many features were locked, and liked that a simulation had an ending at all. — [GamerHorizon review, 2014](https://gamerhorizon.com/2014/01/15/lttp-game-dev-tycoon-review-simgame/)
- A critical review describes the goal as succeeding within 30 years, with play able to continue after; the reviewer found meeting the late profit target required releasing a very high volume of games and gave up out of boredom (score 3/10). — [GameCritics review](https://gamecritics.com/tayo-stalnaker/game-dev-tycoon-review)
- ⚠️ The default run is 35 years with no limit on continuing; seen only as a search-result summary of a PopOptiq review whose page returned 404 when opened. A Steam thread mentions a 42-year setting; snippet only. — [PopOptiq](https://www.popoptiq.com/game-dev-tycoon-just-good-first-time/); [Steam thread](https://steamcommunity.com/app/239820/discussions/0/1319961618830864304)
- Wikipedia describes the progression (garage, offices, R&D lab, hardware lab) but not the ending. — [Wikipedia: Game Dev Tycoon](https://en.wikipedia.org/wiki/Game_Dev_Tycoon)

### Inferences
- Game Dev Tycoon's end is a timer plus a score, with no explanation of how the run produced the score. That is the gap the owner's brief is reacting to.

### Gaps
- ⚠️ The exact contents of Game Dev Tycoon's end-of-game screen (what the score includes, whether it lists achievements or games released) were not found in any source read. The fan wiki's main page is a stub. Checking the game directly would settle it.

---

## Game 10: Democracy 3 / Democracy 4 (Positech) — the cause-and-effect web

### Takeaway
Democracy shows the simulation's causal graph directly: every policy, statistic and problem is an icon, and selecting one draws the links to everything that helps or hurts it. Endings (election loss, or assassination) come from voter groups the player can inspect. This is the strongest example of making "what drives each outcome" visible during play.

### Cited Findings
- Positech's Democracy 3 page: an icon-based view of the country's issues lets the player drill down through relationships between policies and voters; example chain: a trade policy affects GDP, which affects unemployment, then poverty, crime and tourism. Each voter blends a subset of 21 voter groups; how strongly voters identify with each group shifts over time with policy; policy sliders can have non-linear effects, so some groups ignore a policy until it becomes extreme; a focus-group feature shows how individual voters decided. — [Positech: Democracy 3](https://positech.co.uk/democracy3)
- ⚠️ Hovering over an icon shows green and red spokes marking the issues that help or hurt it (PC Gamer), and selecting an icon draws connecting lines to everything that affects it (PocketGamer); both seen only as search snippets (the PC Gamer page returned only its title; PocketGamer not opened). — [PC Gamer](https://www.pcgamer.com/uk/now-playing-abolishing-crime-and-banning-booze-in-democracy-3); [PocketGamer](https://www.pocketgamer.com/democracy-3/review/)
- Democracy 4 is described as modeling short- and long-term effects of any action with a neural network of thousands of simulated citizens; it is "not a game about simply winning an election," and assassination is an alternative way a run ends. — [Steam: Democracy 4](https://store.steampowered.com/app/1410710/Democracy_4/)
- Before each election the player makes two promises (for example, cut unemployment by 10%); unkept promises raise voter cynicism. Policy changes cost political capital earned from loyal ministers. — [Wikipedia: Democracy (video game)](https://en.wikipedia.org/wiki/Democracy_(video_game))

### Inferences
- For a game with hidden variables, a partial causal web is still possible: show the arrows (this action feeds alignment debt) without the values. Democracy's design suggests players accept a visible graph with inspectable weights as fair even when outcomes are harsh.
- The election-promise mechanic is a ready-made foreshadowed threshold: the player names a target, and the end check reads it.

### Gaps
- ⚠️ No source read describes Democracy's assassination warning in detail (which groups, what threshold, what UI). Positech's site and the Steam page mention assassination only as an outcome.

---

## Game 11: Reigns (Nerial, 2016) — four meters, both ends lethal, investments change which death fires

### Takeaway
Reigns has four meters (Church, People, Army, Money); a death fires when any meter hits its minimum or its maximum. Specific earlier investments change which death fires: building a barn, walls, a bank or a cathedral swaps a meter's default death for a different one. The cause of death is therefore the meter plus the player's build.

### Cited Findings
- Examples: Church at minimum without a cathedral leads to death by pagans; Army at minimum without high walls leads to the "awful army" death; People at minimum without the barn leads to the "left behind" death; Money at minimum with no bank depends on whether other meters are above or below average (eaten by dogs vs. exile); Army at maximum with a male heir means the son kills you; Church at maximum alone makes you a martyr. — [Reigns Wiki: Deaths](https://reigns.fandom.com/wiki/Deaths)
- There are 29 or more listed deaths (the page title says 29 but numbers entries up to 34), each a separate collectible. — [Reigns Wiki: Deaths](https://reigns.fandom.com/wiki/Deaths)

### Inferences
- "Too much is also fatal" suits an AI lab: maximum capability or maximum users can be its own ending, not only minimum cash.
- The "unless you built X" rule is a compact way to make endings read investments: each ending names the investment that would have prevented it.

### Gaps
- No developer or critical source on Reigns was read; reception is not covered.

---

## Game 12: Long Live the Queen (Hanako Games, 2012) — stat-gated deaths as a visible checklist

### Takeaway
Long Live the Queen gates each death on specific stat checks in specific weeks (for example Reflexes or Flexibility thresholds), plus earlier choices, and lists every death on the main menu like achievements, so players learn which stats protect against which deaths.

### Cited Findings
- Deaths are listed on the main menu like achievements, giving players an incentive to find each one. — [Long Live the Queen Wiki: Deaths Checklist](https://longlivethequeen.fandom.com/wiki/Deaths_Checklist)
- Example gating: in week 16, if the player angered a character or used magic in week 10 and goes to a procession, an assassin attacks; partially passing a Reflexes check (at least 30, under 80) or a Flexibility check (at least 30, under 50) and failing Battlefield Medicine at 20 leads to bleeding to death. Other deaths require Lumen magic at 200, Wield Magic at 100, and similar thresholds. — [Deaths Checklist](https://longlivethequeen.fandom.com/wiki/Deaths_Checklist)

### Inferences
- A visible checklist of named endings (with the unmet ones blank) tells players in advance which outcomes exist and invites them to aim at one, which matches the owner's "path visible during play" goal.

### Gaps
- No developer or critical source on Long Live the Queen was read.

---

## Key question 1: What state does each ending read, and how is it shown during play?

### Takeaway
Four display patterns recur: a **ledger** of named investments summing to a score (Mass Effect 3 War Assets, Civ VI score, Stellaris score breakdown); a **meter with a visible fail line** (Frostpunk Hope/Discontent, Reigns' four meters, Plague Inc's cure bar); a **progress track toward each ending** with rival standings (Civ VI World Rankings, Stellaris Victory Window); and a **causal graph** (Democracy). The most legible games tie each ending to a specific investment (Mass Effect 2 upgrades, Reigns buildings), not only to an aggregate.

### Cited Findings
- Ledger: War Terminal list and Total Military Strength — [War Assets](https://masseffect.fandom.com/wiki/War_Assets); score per category — [Stellaris Victory](https://stellaris.paradoxwikis.com/Victory) ⚠️ (partial read); score formula — [Victory (Civ6)](https://civilization.fandom.com/wiki/Victory_(Civ6))
- Fail-line meters: [Hope](https://frostpunk.fandom.com/wiki/Hope), [Discontent](https://frostpunk.fandom.com/wiki/Discontent), [Reigns Deaths](https://reigns.fandom.com/wiki/Deaths), [Plague Inc Cure](https://plagueinc.fandom.com/wiki/Cure)
- Warning beats at fixed thresholds: 25/50/75/95/100% cure popups — [Cure](https://plagueinc.fandom.com/wiki/Cure); log warning each time drift risk rises — [Stages](https://universalpaperclips.fandom.com/wiki/Stages)
- Ambient foreshadowing: music changes after crossing the line — [A New Home](https://frostpunk.fandom.com/wiki/A_New_Home); allied ships losing on screen predicts squad deaths; Hammer percentage reported — [Priority: Earth](https://masseffect.fandom.com/wiki/Priority:_Earth); radio announces ceasefire approach — [TWoM Endings](https://thiswarofmine.fandom.com/wiki/Endings)
- One-to-one investment mapping: upgrade → survivor — [No One Left Behind guide](https://masseffect.fandom.com/wiki/No_One_Left_Behind_Achievement_Guide); building → which death — [Reigns Deaths](https://reigns.fandom.com/wiki/Deaths)
- Causal graph: [Positech Democracy 3](https://positech.co.uk/democracy3)

### Inferences
- For Game Night AI Lab's hidden variables, the strongest combination is: show each ending as a track with a named threshold (like Civ VI), show noisy advisor readings as the "meter" (like Plague Inc's cure bar but with error bars), and fire warning beats at fixed fractions of each hidden threshold, even when the exact value stays hidden.

### Gaps
- No source read documents a 4X "you are being outpaced" warning.

---

## Key question 2: How does the end screen prove causation?

### Takeaway
Five proof devices recur: **per-person or per-faction epilogue** (This War of Mine, Mass Effect 3 Extended Cut slides); **replay of the player's own build or decisions** (Frostpunk time-lapse ⚠️, Universal Paperclips' step-by-step dismantling); **final score with a breakdown** (Stellaris, Civ VI); **a named archetype or judgment line** (Civ VI historical-leader ranking, Frostpunk's crossed-the-line verdict); and **visible on-screen consequences tied to the ledger** (Mass Effect 3 squad deaths and fleet losses by EMS).

### Cited Findings
- Per-survivor epilogue tallied from categorized acts — [TWoM Endings](https://thiswarofmine.fandom.com/wiki/Endings)
- Extended Cut epilogue slides vary with trilogy choices plus EMS — [Extended Cut](https://masseffect.fandom.com/wiki/Mass_Effect_3:_Extended_Cut); [Wikipedia](https://en.wikipedia.org/wiki/Mass_Effect_3_ending_controversy)
- Historical-leader ranking by score — [Victory (Civ6)](https://civilization.fandom.com/wiki/Victory_(Civ6))
- End quote for players who crossed the line — [Game Developer](https://www.gamedeveloper.com/design/why-11-bit-studios-endeavors-to-put-emotion-and-meaning-first-in-game-dev); judgmental post-game crawl questioned players who felt they acted well — [PCGamesInsider](https://www.pcgamesinsider.biz/news/67933/11bits-marta-fijak-empathising-with-500-people-is-hard-in-frostpunk/)
- Dismantling every system one by one in the Reject ending — [Message from the Emperor of Drift](https://universalpaperclips.fandom.com/wiki/Message_from_the_Emperor_of_Drift)
- Final score then continued play, no breakdown reported — [GamerHorizon](https://gamerhorizon.com/2014/01/15/lttp-game-dev-tycoon-review-simgame/)

### Inferences
- A judgment line works best when the screen also shows its evidence; the Frostpunk complaints suggest the verdict should name the laws (acts) behind it.
- Game Night AI Lab can combine: an epilogue line per advisor and stakeholder (This War of Mine), a replay of the constitution clauses and key era decisions (Frostpunk), and a final archetype title (Civ VI).

### Gaps
- ⚠️ The Frostpunk end replay was confirmed only via a search snippet.

---

## Key question 3: Hidden versus visible — when do designers hide the score, and how does the ending still feel earned?

### Takeaway
Designers hide the *moral* ledger and show the *survival* ledger. Frostpunk hides its line-crossing list but changes the music when it is crossed and passes a verdict at the end; This War of Mine hides its good/karma tally but surfaces it as per-person epilogues. Mass Effect 3 showed its ledger but hid the thresholds and the multiplier's role, which players read as arbitrary. Hidden states feel earned when (a) the hidden variable is fed by specific, recognizable acts, (b) the game gives an ambient signal when it changes, and (c) the end screen names those acts.

### Cited Findings
- Hidden line ledger plus music cue — [A New Home](https://frostpunk.fandom.com/wiki/A_New_Home)
- Designers wanted to avoid judging during play; the verdict sits at the end — [Game Developer](https://www.gamedeveloper.com/design/why-11-bit-studios-endeavors-to-put-emotion-and-meaning-first-in-game-dev); critics split between wanting more judgment (Purchese, via Wikipedia) and being upset by it (audience at Fijak's talk) — [Wikipedia: Frostpunk](https://en.wikipedia.org/wiki/Frostpunk); [PCGamesInsider](https://www.pcgamesinsider.biz/news/67933/11bits-marta-fijak-empathising-with-500-people-is-hard-in-frostpunk/)
- Hidden tally producing puzzling epilogues (⚠️ snippet) — [Steam thread](https://steamcommunity.com/app/282070/discussions/0/620700960677515121)
- Visible ledger, invisible multiplier from another mode — [War Assets](https://masseffect.fandom.com/wiki/War_Assets); [Kaedrin](https://kaedrin.com/weblog/2012/06/mass_effect_3/)
- Visible log warning for a risk the player cannot see the full value of — [Stages](https://universalpaperclips.fandom.com/wiki/Stages)

### Inferences
- Game Night AI Lab's advisor system (noisy readings of hidden variables) is a natural middle ground: the variable is hidden, but its direction and rough level are visible through imperfect instruments, and the end screen can reveal the true value next to what the advisors said.

### Gaps
- No academic game-studies source on endings in systemic games was read (none was searched for within the tool budget).

---

## Key question 4: What went wrong and what was learned?

### Takeaway
Three recorded failures: Mass Effect 3 (many choices collapsed into one number, then into near-identical colored outcomes; the best results were tied to a separate multiplayer mode; fix was an epilogue that reads choices and EMS, plus lower thresholds); Frostpunk (an end verdict players could not predict, which some felt was unfair); Game Dev Tycoon (a timer plus a score, with critics calling the late game a grind). Successes: Mass Effect 2's one-to-one mapping, This War of Mine's per-person epilogues, Plague Inc's single bar with warning beats.

### Cited Findings
- ME3 criticisms (choices inconsequential, lack of closure), Hudson's concession, Extended Cut's epilogue and mixed reception — [Wikipedia: ME3 ending controversy](https://en.wikipedia.org/wiki/Mass_Effect_3_ending_controversy)
- Extended Cut lowered the full-ending requirement from 4,000 to 3,100 EMS — [Extended Cut](https://masseffect.fandom.com/wiki/Mass_Effect_3:_Extended_Cut)
- Legendary Edition removed readiness entirely — [War Assets](https://masseffect.fandom.com/wiki/War_Assets)
- Frostpunk team moved from in-the-moment empathy to post-game reflection and found the judgmental crawl "problematic" — [PCGamesInsider](https://www.pcgamesinsider.biz/news/67933/11bits-marta-fijak-empathising-with-500-people-is-hard-in-frostpunk/)
- Game Dev Tycoon late-game grind — [GameCritics](https://gamecritics.com/tayo-stalnaker/game-dev-tycoon-review); ending felt like the tutorial was still going — [GamerHorizon](https://gamerhorizon.com/2014/01/15/lttp-game-dev-tycoon-review-simgame/)

### Inferences
- Lesson for an 11-ending design: each ending should name, on its screen, the two or three investments that most moved the deciding variables, and those investments should be ones the player chose (not a separate mode or random event).

### Gaps
- No Game Dev Tycoon postmortem from Greenheart Games was found.

---

## Summary table

| Technique | What it does | Example games | State it needs | Pitfalls |
|---|---|---|---|---|
| Asset ledger summing to a score | Turns every side activity into a named, countable contribution toward the finale | Mass Effect 3 (War Assets), Stellaris, Civ VI score | List of named assets with point values; a total | Aggregation hides which asset mattered; outputs look alike if only the total is read (ME3) |
| Hard thresholds that unlock ending options | More investment unlocks better or more choices at the end | Mass Effect 3 EMS bands (1,600 / 2,350 / 2,650 / 2,800 / 3,100) | One scalar per ending gate | Invisible thresholds feel arbitrary; tying them to a separate mode (multiplayer readiness) was resented |
| One-to-one investment → outcome | Each specific purchase or loyalty saves a specific person or prevents a specific ending | Mass Effect 2 suicide mission; Reigns ("without the barn/walls/bank") | Flags per investment | Needs many hand-authored branches |
| Meter with a visible fail line | Survival pressure the player can read at a glance | Frostpunk Hope/Discontent; Reigns four meters (both min and max lethal) | Bounded meters with a fail duration or edge | Optimizing the meter can override moral engagement (RPS critique via Wikipedia) |
| Single race bar with warning beats | A rival process the player can slow; popups at fixed percentages | Plague Inc cure (25/50/75/95/100%) | One progress value and its rate drivers | Too predictable if rate drivers are opaque |
| Victory tracks with rival standings | Shows progress toward each ending type and who leads | Civ VI World Rankings; Stellaris Victory Window | Per-ending progress values for all actors | Civ VI dropped rival-milestone alerts, so threats can surprise |
| Causal web | Shows which inputs push which outputs, by color and line | Democracy 3/4 | Explicit dependency graph | Can overwhelm; small icons on mobile were criticized ⚠️ |
| Hidden moral ledger + ambient cue | Tracks lines crossed without nagging; a music or tone change signals it | Frostpunk (line laws; music change) | List of flagged acts | Players may not notice the cue; verdict can feel unfair |
| End verdict / judgment line | One sentence or title sums up the run | Frostpunk end quote; Civ VI historical-leader ranking | A rule mapping state to a line | Feels preachy or wrong if evidence is not shown (Fijak) |
| Per-person epilogue | One outcome per named character, from a tally of acts toward them | This War of Mine; ME3 Extended Cut slides | Per-character tallies by act category | Puzzling results if the deciding acts are not cited |
| Replay of the run | Shows the player's own build or decisions as evidence | Frostpunk time-lapse ⚠️; Universal Paperclips dismantle sequence | Event log of key decisions | Long if not curated |
| Act break as a purchase | Story transition is literally spending a meter the player built | Universal Paperclips (100 Trust to release drones) | Meter + scripted transition | Feels mechanical if the meter has no story meaning |
| Risk that rises with the winning investment | The same choice that wins raises a hidden danger, with a log warning each time | Universal Paperclips (Probe Trust → value drift) | Coupled variables + log | Players may ignore log text |
| Named-endings checklist | Lists all endings (blank until found) so players can aim at one | Long Live the Queen deaths; Reigns deaths | Ending registry | Spoils surprise if names are too explicit |
| Timer + final score | Fixed end date and a number | Game Dev Tycoon | Score | Thin: no explanation of how the run produced the number |

---

## Coverage statement

**Opened and read to the end** (Fandom pages read as full raw wikitext via the wiki API; transcluded templates not included, flagged where relevant):
- Mass Effect Wiki: War Assets; Mass Effect 3: Galaxy at War; Priority: Earth (full page, 56k characters); Mass Effect 3: Extended Cut; No One Left Behind Achievement Guide; Suicide Mission (a disambiguation/index page, read fully, little content).
- Frostpunk Wiki: Hope; Discontent; A New Home.
- This War of Mine Wiki: Endings (per-character ending templates not included in the text).
- Universal Paperclips Wiki: Stages (its transcluded Probes and Projects lists not included); Trust; Value Drift; Message from the Emperor of Drift; Accept; Reject.
- Plague Inc Wiki: Cure (transcluded Research Facilities section not included).
- Civilization Wiki: Victory (Civ6) (transcluded Science Victory steps template not included).
- Reigns Wiki: Deaths. Long Live the Queen Wiki: Deaths Checklist. Game Dev Tycoon Wiki: Game Dev Tycoon (stub).
- Wikipedia (plain-text extracts via API, read fully): Mass Effect 3 ending controversy; Frostpunk; Universal Paperclips; Democracy (video game); Game Dev Tycoon.
- Game Developer: "Why 11 Bit Studios endeavors to put emotion and meaning first in game dev" (full).
- PCGamesInsider: Marta Fijak article (full article body; the last 601 characters of page text, site footer, not read).
- Kaedrin weblog Mass Effect 3 post (full). GamerHorizon Game Dev Tycoon review (full). GameCritics Game Dev Tycoon review (full). Positech Democracy 3 page (full). Steam Democracy 4 store description (full "About" section).

**Read only in part** ⚠️
- Stellaris Wiki: Victory — first 100,000 of about 152,000 characters.

**Seen only as search-result snippets, not opened** ⚠️
- Gaming Trend Frostpunk board game review; Steam Frostpunk threads; TheGamer Frostpunk 1886 interview; DualShockers, OnlySP, guided.news Frostpunk interviews (listed in results, not used); Steam This War of Mine threads; PocketGamer Democracy 3 review; Steam Game Dev Tycoon threads; Epic Games Store and TechRaptor Democracy 4 pages (assassination wording, superseded by the Steam page that was read).

**Could not be reached** ⚠️
- Fandom pages via normal fetch (HTTP 402) — worked around with the wiki API as above.
- BioWare blog Extended Cut FAQ via web.archive.org — the tool cannot fetch from the Internet Archive.
- PC Gamer "Frostpunk developers on hope, misery, and the ultimately terrifying book of laws" — fetch returned only the title.
- PC Gamer "Now playing: abolishing crime and banning booze in Democracy 3" — fetch returned only the title.
- cheatcc.com Mass Effect 3 article — HTTP 403.
- PopOptiq Game Dev Tycoon review — HTTP 404.
- Stellaris wiki via its API — returned non-JSON; read through normal fetch instead (partial, above).
- Wikipedia: Rebel Inc — near-empty extract (120 characters).

**Downloaded but not read, and not cited:** Frostpunk Wiki Book of Laws; Wikipedia Frostpunk 2; Mass Effect 2 Guide.

**Not researched (out of tool budget):** Frostpunk 2 endings, Rebel Inc, Crusader Kings, Football Manager, Banished, Terra Invicta, Endless Singularity, Rogue AI, Death and Taxes, academic game-studies writing on endings.
