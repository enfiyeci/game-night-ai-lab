# How card-event games, roguelites and narrative choice games build loops, reward moments and event variety

Scope: Reigns, FTL, Slay the Spire, Balatro, Hades, 80 Days, Suzerain, Citizen Sleeper, plus brief Papers, Please and Inscryption. Purpose: inform Game Night AI Lab (real-time AI-lab management, five eras, 20-30 min runs, event cards with 2-3 costly choices that stop the clock, release reveal with review scores, board meetings, President, summit, social feed, about a dozen endings). Playtest problems: "bursts of decisions then quiet weeks" and "can't tell which decisions are right."

Reading conventions: ⚠️ marks a claim where I saw only a snippet, a summary, a truncated page, or a source I judge shaky; the reason follows the marker. "Inference" lines are mine, not the sources'. All fetches went through a summarising fetch tool (see Coverage), so quotes below are only those the tool returned verbatim, all under 15 words.

---

## 1. Reigns: swipe loop, four meters, card drawing, death and the next reign, objectives across reigns

### Takeaway
Reigns is a one-input loop (swipe yes/no) where each card changes four meters, and any meter hitting empty or full ends the reign and hands over to an heir. The deck is not a shuffled list but a state-filtered "bag": before every draw, cards that do not fit the kingdom's current state are removed, so cards always feel relevant and stories emerge. A hidden multi-reign devil arc gives the repeated short runs a long-term purpose.

### Cited Findings
- Four meters: army, people, church, king's wealth. If any meter becomes completely full or empty, the reign ends and a new king begins. — [Wikipedia: Reigns](https://en.wikipedia.org/wiki/Reigns_(video_game)); same rule per [Emily Short's review](https://emshort.blog/2016/08/20/reigns/) (heir starts "from the same point" with stats reset to average).
- Death causes are deliberately absurd or contrived; Short's example is a treasury so full a feast chokes the king. Short argues "too much" being fatal makes balancing more interesting than maximizing one stat. — [Emily Short](https://emshort.blog/2016/08/20/reigns/)
- Card selection ("the bag"), written by Alliot himself: before each draw, remove cards that do not fit the kingdom's state (queen cards when unmarried, church-dependent cards when church is weak, recently played cards). Each card has a "size"; larger cards are likelier to be drawn, and removing large cards raises the odds of smaller ones. — [François Alliot, Game Developer "Creating an adaptive narrative in Reigns"](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-) (fetched via summariser, article reported complete)
- Authoring order: single one-shot cards first, then card ranges forming short mini-storylines, then "add-ons" (new characters whose cards permanently join the pool), then the devil storyline, then moments meant to surprise. A war can weight about 10 related cards; dungeon and duel events lock play into a mini-system of a few cards; devil encounters can be linear, sometimes one card. — [Alliot, Game Developer](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-)
- Alliot describes the state values as "qualities" (a term from Failbetter's quality-based narrative). Short agrees: the structure is "quality-based narrative" with far fewer quality types than Fallen London; card text depends on current stats, so cause-and-effect chains can arise that nobody scripted (example: accepting a marriage to avert war led to a feast that bankrupted the kingdom). — [Alliot](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-); [Short](https://emshort.blog/2016/08/20/reigns/)
- Scale and pace: original game has 770 cards; the design allows "a hundred decisions in five minutes"; the prototype shown to the publisher had about a hundred cards and five characters. Players made up stories from an initial bundle of about 50 cards, which pushed Alliot to a probabilistic system rather than branching narrative. — [Alliot interview, Inverse](https://www.inverse.com/gaming/23117-reigns-francois-alliot-nerial-developer-interview) (edited for brevity); the 100-card/50-card details are from search-result snippets of AppUnwrapper and the Game Developer article, ⚠️ AppUnwrapper itself returned HTTP 403 and was never opened.
- Difficulty and recovery: Alliot calls it "so unforgiving" that it often kills quickly; the dynasty system (a king dies, the next ruler continues, about 2,000 years of dynasty) is his answer to the frustration. Choices in one reign can affect later rulers; players find deaths, characters and cards and can "trick the devil." — [Inverse](https://www.inverse.com/gaming/23117-reigns-francois-alliot-nerial-developer-interview)
- Long arc: main objective is breaking a curse from the Devil, who visits across several centuries; if the curse is not broken before his visits stop, the game resets. Completing tasks unlocks new cards; some cards have effects that carry across reigns (e.g. a crusade). The Devil plotline was added late to explain why characters repeat dialogue and why the player keeps starting new reigns. — [Wikipedia: Reigns](https://en.wikipedia.org/wiki/Reigns_(video_game))
- Alliot says high-score pressure and harder effects arrive "generally in the second third of the game" (search snippet attributed to AppUnwrapper). — ⚠️ snippet only, AppUnwrapper returned HTTP 403.
- Swipe preview: tilting a card without releasing shows outcome text (Short); MacStories reportedly notes partial swipes hint which meters will change — ⚠️ MacStories only seen as a search snippet. — [Short](https://emshort.blog/2016/08/20/reigns/)
- Why cards: an early version placed characters in portraits; the team moved to cards because players already know how to move cards, removing the need for a tutorial. Alliot says the format forced him to write "short, direct quips" instead of long sentences. — [Wikipedia: Reigns](https://en.wikipedia.org/wiki/Reigns_(video_game)); [Alliot, Game Developer](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-)
- Weaknesses, per Short: frequent deaths and low stakes make it a "sit back rather than sit forward" experience; randomness limits agency (watching the treasury climb toward a fatal cap with no card available to spend it); a player can die many times without reaching new content for the long arc. — [Short](https://emshort.blog/2016/08/20/reigns/)
- Her Majesty sequel: Alliot's philosophy summarised as "Tinder is a toy"; he moved past simple yes/no cards to more varied scenarios; co-writer Leigh Alexander said a good card must convey personality, world and enough hint to guess the outcome (the latter from a search snippet). — [Game Developer on Her Majesty](https://www.gamedeveloper.com/business/-i-reigns-her-majesty-s-i-francois-alliot-on-making-a-more-complex-swipe-em-up) ⚠️ page was short and relied on an embedded video not included in the text.

### Inferences
- The state-filtered bag is the direct answer to "events feel unrelated to what I just did": filter the pool by lab state (compute, cash, safety score, era, relations), then weight by "size."
- Reigns gets its "which choice was right?" feel from meter arrows plus absurd cause-of-death text; death is explained in the same vocabulary the player was already steering by. Game Night's endings could do the same (name the specific meter/decision chain).
- Short-run hand-off (heir, stats reset to average, long arc persists) is a template for "replay with a different ending" without losing momentum.

### Gaps
- GDC talk by Alliot: no accessible transcript found; the user-cited "GDC talk" was not located. No source on exact meter thresholds, or on how the end-of-reign screen summarises a reign.
- Exact structure of cross-reign quests (beyond Wikipedia's one-line summary): not found.

---

## 2. FTL: beacon-by-beacon structure, event text and blue options, rebel fleet pressure, rewards, pacing

### Takeaway
FTL turns a run into about eight sectors of roughly twenty beacons where every jump costs a resource (fuel) and also advances a chasing fleet, so there is no free "quiet" move. Between fights, beacons hold choose-your-own-adventure text events. I could not reach the GDC 2013 postmortem content, and the accessible write-ups say little about pacing numbers.

### Cited Findings
- Structure: one ship, an allied fleet to reach, a pursuing rebel fleet, eight procedurally generated sectors, about twenty beacons per sector; you jump without knowing what is at a beacon, aiming for the exit. Jumps use fuel and let the rebel fleet advance and take over beacons; jumping to a captured beacon triggers an elite rebel fighter, and defeating it grants fuel. Beacons generally cannot be revisited. — [Wikipedia: FTL](https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light)
- Rewards and risk per beacon: stores, distress calls, hostile ships; visiting more beacons yields scrap, equipment, crew but each encounter can damage ship or crew; later sectors have tougher enemies who pay more. Loss of ship or all crew ends the run and deletes the save. — [Wikipedia: FTL](https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light)
- Between fights the game is filled with "choose your own adventure"-style text events with many possible outcomes (Ma). Ma frames randomized events as an episodic sci-fi show where the crew never knows what follows the next jump (examples: a giant space whale, a Mantis attack). Davis cites Weird Worlds and Flotilla as inspirations. — [Engadget Joystiq Indie Pitch](https://www.engadget.com/2012-09-19-the-joystiq-indie-pitch-ftl-faster-than-light.html)
- Ma: each mechanic is simple alone but interactions produce "amazing and unpredictable situations" (blast doors, venting oxygen, fire). — [Engadget](https://www.engadget.com/2012-09-19-the-joystiq-indie-pitch-ftl-faster-than-light.html)
- Pausable real-time: Davis said they wanted a tactical design "fairly fast-paced, but you could stop at any moment"; Ma compares paused time to "like making a chess move." Disasters were meant to appear frequently and unpredictably; defeated ships drop random items. — [Episodic Content, Making of FTL ch. 2](https://episodiccontentmag.com/2015/06/10/anything-but-sports-the-making-of-ftl-chapter-2-of-4/) ⚠️ only chapter 2 of 4 was available and it did not cover beacons/rebel fleet.
- Design process (the GDC postmortem's headline lesson): Subset began with only a target atmosphere, no genre, pacing or scope; Davis: one singular focus let them abandon everything that did not fit; Ma: "We kept ditching things to keep moving towards the goal." — [Game Developer: Designing Without a Pitch](https://gamedeveloper.com/design/designing-without-a-pitch---an-em-ftl-em-postmortem). The article contains nothing on pacing, events or rewards.
- Intended brutality: designers reportedly tuned it as a "suicide mission" around a roughly 10% win rate; composer Ben Prunty cross-fades calm and battle versions of each track. — [Wikipedia: FTL](https://en.wikipedia.org/wiki/FTL:_Faster_Than_Light) ⚠️ Wikipedia secondary source; Wikipedia names "Jay Ma," elsewhere he is Justin Ma.
- Blue options (choices gated by crew/equipment) and fleet pacing detail: a wiki and Steam forum threads (2012-2017) say distress beacons and nebulae tend to have blue-option events, and that a rebel scout escaping speeds up the fleet; one wiki page notes a distress event that cannot trigger due to a missing tag. — ⚠️ search-result snippets only (Fandom wiki returned HTTP 402, Steam threads not opened); treat as anecdotal.
- GameStar (German) reports the pair regretted how little attention the hyperspace jump animation received. — ⚠️ search snippet only, not opened.

### Inferences
- FTL's way of "no quiet weeks" is mechanical: the clock (fleet) advances on the player's own action, so every beat of play is a decision under a visible pressure. Game Night's real-time clock stops for event cards; adding an advancing pressure that moves only when the player commits (e.g. a rival/regulator track) would keep quiet periods tense rather than empty.
- Blue options show a cheap way to reward earlier build choices: the event text offers a unique option because of what the player already owns, making past decisions visibly pay off.

### Gaps
- GDC 2013 "Designing Without a Pitch" video/transcript: not accessible (GDC Vault is members-only/under maintenance; YouTube not readable here). What Ma and Davis said about pacing there is unverified.
- Exact event frequency per beacon, blue-option rules, and rebel-fleet advance rate from a primary or complete wiki source: not obtained.

---

## 3. Slay the Spire: map, card reward, relics, elites, Ascension, metrics

### Takeaway
A visible branching map (explicitly inspired by FTL) turns each step into a risk/reward route choice; every fight ends in a "pick 1 of 3 or skip" reward, elites are an optional-risk route that always pay a relic, and Ascension adds stacked difficulty modifiers after wins. Mega Crit balanced using passive telemetry plus playtesters, with a stated caution that data misleads.

### Cited Findings
- Map: each act has 17 floors with up to six locations per floor, each room linking to 1-3 rooms above/below; a new map each run, seed-fixed. Fixed scaffolding in Act 1: floor 1 easy fights, floor 9 all treasure rooms, floor 15 all rest sites, floor 16 leads to the boss. Random room mix: normal 53%, elite 8%, rest 12%, merchant 5%, unknown 22% (unknown resolves to monster/shop/treasure/event, with chance shifting toward types not rolled). — [Slay the Spire wiki.gg: Map Generation](https://slaythespire.wiki.gg/wiki/Map_Generation) ⚠️ page is marked "under construction; may be wrong or incomplete," and its Act 2/3 floor notes were unclear.
- Location rewards: normal fights give 10-20 gold, a three-card choice, sometimes a potion. Elites "appear less often and always award a Relic," plus 25-35 gold and a three-card choice with better odds of rare/uncommon cards. Rest sites heal 30% max HP or upgrade a card (one choice); a rest site always precedes the boss. Treasure room guaranteed at the act's halfway point. Shop: 5 class cards, 2 colorless, 3 relics, 3 potions, one card removal. Acts 1 and 2 bosses give 95-105 gold, three rare cards, a chest with three boss relics. — [wiki.gg: Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations) (summarised page; individual sub-pages not opened)
- Gameplay summary: after a fight "you usually get gold and can add one of three randomly offered cards... or skip"; relics are permanent run-long buffs, potions single-use; events are random situations with uncertain outcomes; the map was inspired by FTL. — [Wikipedia: Slay the Spire](https://en.wikipedia.org/wiki/Slay_the_Spire); FTL inspiration also in [Road to the IGF: Slay the Spire](https://www.gamedeveloper.com/disciplines/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-) ("navigating the map adds an extra element of risk/reward and planning").
- Relic sourcing and rarity: from most sources Common 50% / Uncommon 33% / Rare 17%; chest sizes shift odds (small 75/25/0, medium 35/50/15, large 0/75/25); a relic "can only be encountered once in a run"; some relics are gated (e.g. bottled relics need a matching card type). — [wiki.gg: Relics](https://slaythespire.wiki.gg/wiki/Relics) ⚠️ summarised page; the draw-without-repeat mechanism was not described.
- Legibility lesson: enemies originally hid their next move; Mega Crit tried a "Next Turn" preview then switched to icon "Intents," and playtesters preferred seeing exact numbers. — [Wikipedia: Slay the Spire](https://en.wikipedia.org/wiki/Slay_the_Spire)
- Metrics: gameplay metrics showed which cards were too weak (rarely picked) or too strong (overrepresented in winning decks); Giovannetti used expert Netrunner players for testing and felt about 75 cards per character was right; Early Access began Nov 2017, full release Jan 2019. — [Wikipedia: Slay the Spire](https://en.wikipedia.org/wiki/Slay_the_Spire)
- GDC 2019 talk structure (chapters): origins, defining balance (every card has a role, avoid warping effects, single-player allows rare strong combos), Slack channel for playtesters plus a metric server for passive data, cautions that data deceives and "super playtesters" bias it, weekly updates, Discord feedback, beta branches, Ascension levels to tune difficulty for different player groups, live balancing of the Defect. — [Podwise outline of the talk](https://podwise.ai/episodes/1459444) ⚠️ third-party AI outline; transcript behind a sign-in wall; contains no verbatim Giovannetti quotes and no specific metrics, thresholds or before/after numbers.
- Giovannetti: replayability "off the charts" even in early playtesting, and getting players to "start carving out new strategies" quickly kept them motivated after losses; they "believe in rewarding player mastery." — [Road to the IGF](https://www.gamedeveloper.com/disciplines/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-)
- Podcast summary: Giovannetti says "The core design of Slay the Spire is risk versus reward" and discusses positive/negative outcomes to avoid tedium and the cadence of upgrades, treasures and fights. — [Think Like A Game Designer](https://justingarydesign.substack.com/p/anthony-giovannetti-crafting-slay) ⚠️ page had show notes only; transcript empty, so the cadence discussion is described but not read.
- Ascension (20 cumulative levels): A1 more elites (about 60%), A2-A4 regular/elite/boss deal more damage, A5 recover 75% of missing HP after bosses, A6 start with 10% HP missing, A7-A9 more HP/block on regular/elite/boss, A10 start with a curse card, A11 one fewer potion slot, A12 fewer upgraded card offers, A13 bosses drop 25% less gold, A14 lower max HP, A15 events have harsher outcomes, A16 shop prices +10%, A17-A19 harder movesets, A20 two bosses at end of Act 3. — [wiki.gg: Ascension](https://slaythespire.wiki.gg/wiki/Ascension) ⚠️ levels 17-19 had no description beyond headings on the page.
- Later-game structure: a fourth act reached by collecting three keys ends with the Heart; finished or failed runs earn points toward unlocks. — [Wikipedia: Slay the Spire](https://en.wikipedia.org/wiki/Slay_the_Spire)

### Inferences
- "Pick 1 of 3 or skip" works because the player compares options against a deck they can see; Game Night's equivalent is making the current lab state visible next to every event card so "right" is judgeable.
- Fixed scaffold floors (treasure at the midpoint, rest before the boss) are authored pacing beats inside random content; a Game Night era could pin a guaranteed breather and a guaranteed big decision per era.
- Elites as opt-in danger with a guaranteed prize are the clearest model for "costly choices" that feel fair: risk known, reward named.
- Ascension's incremental, stackable modifiers are a template for replay difficulty that does not change the content.

### Gaps
- Giovannetti's actual GDC numbers/examples (pick rates, thresholds, sample sizes): not accessible.
- Card-reward rarity odds and the "rare chance offset" rule: wiki.gg Card Rewards/Rewards pages returned 404; not verified.
- Map generator probabilities: only from an under-construction wiki page.

---

## 4. Balatro: score-chasing loop, escalating numbers, shop, jokers, why the big number feels good

### Takeaway
Balatro's loop is "beat a rising score target using limited hands," with a shop between blinds that lets the player assemble a rule-bending joker engine. The payoff is a staged, sequential score reveal, and the designer deliberately hides a score preview to preserve suspense, which critics flag as a tradeoff.

### Cited Findings
- Structure: runs are split into antes, each with Small, Big and Boss blinds of rising difficulty; Small/Big can be skipped for a tag (forfeiting cash payout and shop visit); Boss blinds have disabling special effects; completing ante 8 (a Showdown Blind) wins, with endless mode beyond. After beating a blind you earn cash and visit a shop for booster packs, jokers and vouchers (permanent upgrades). Jokers (150 at launch) add chips/mult or change rules, with limited slots. Planet, Tarot and Spectral cards level hands or transform cards. Completing runs unlocks decks and stakes (harder conditions). — [Wikipedia: Balatro](https://en.wikipedia.org/wiki/Balatro) ⚠️ tool read only the first 100,000 of 137,313 characters; gameplay and development sections appeared complete.
- Loop in the designer's words: scoring as many chips as possible to beat a steadily rising requirement, with interlocking mechanics; metastrategy is risk mitigation (a build hard to counter but still powerful). Early builds had no jokers; the main strategic mechanic was a shop that upgraded playing cards; jokers were added later and nearly all have been changed since release. The poker theme was added mainly as an onboarding tool; origin was an online version of Big Two. Balance changes are mostly numeric (cost, rarity, chip bonus, mult bonus). — [Rogueliker interview with LocalThunk](https://rogueliker.com/balatro-interview/) (fetched page reported complete; it does not discuss juice or the modern shop).
- Score reveal and hidden preview: after a hand is played, numbers climb with escalating sound, cards and jokers step forward one at a time adding points, and the multiplier can "burn hotter." The game does not show the final score before play; the designer wants the suspense of committing then watching it resolve; the author calls this a design flaw because the score is hidden yet calculable, so players use calculators and overlays. LocalThunk added a deck view after testers tracked their cards but refused a score preview. — [GMTK / Game Maker's Toolkit](https://gmtk.substack.com/p/balatros-cursed-design-problem) (page reported complete; blinds and shop not covered). The author's worked example: straight 30 chips ×4 mult, played cards add 47, a joker adds 30 per face card, total 137 × 4 = 548 just short of the ante.
- LocalThunk (per GMTK): "the game is more fun when you set up your Rube Goldberg machine"; Soren Johnson quote: "given the opportunity, players will optimize the fun out of a game." — [GMTK](https://gmtk.substack.com/p/balatros-cursed-design-problem)
- Feedback detail (third-party reading, not the developer): sequential joker animations (about 300 ms in the author's example) teach which combinations matter; each scored card plays a rising pitch note; colour language blue = chips, red = mult, gold = money. — [Blake Crosley analysis](https://blakecrosley.com/zh-Hans/guides/design/balatro) ⚠️ third-party; his code samples are illustrative CSS, not extracted from the game; numeric tiers (1,000/10,000) are his example, not game facts.
- LocalThunk, solo dev, about 2.5 years, Lua/LÖVE; avoided playing deckbuilders to prevent borrowing; played Slay the Spire late to study controls; praised the 52-card deck as a long-tested design tool. Sold over 1M copies in the first month. — [Wikipedia: Balatro](https://en.wikipedia.org/wiki/Balatro)
- Why players start another run: the sources describe fast, repeatable runs, unlocks of decks and stakes, and joker variety; none of the fetched sources quotes the designer on run length or "one more run." — see Gaps.

### Inferences
- The model-release reveal with review scores in Game Night is the natural Balatro moment: show component contributions one at a time (benchmarks, safety, hype, price) ticking the total up, with the target (the market/board expectation) visible beforehand. Whether to show a preview score is a real design fork: Balatro hides it for suspense, and GMTK argues the hidden-but-calculable middle is the worst of both worlds.
- Shop-between-blinds is a "spend the reward immediately" breather between pressure beats, which directly addresses quiet-week dead air by making the quiet phase a decision phase.

### Gaps
- TouchArcade interview with LocalThunk (HTTP 403) and the Game Maker's Toolkit video itself: not read. No direct LocalThunk quote about "juice" or run-length design found.

---

## 5. Hades: nested loops, dialogue as reward for dying, Mirror, keepsakes, Heat, statements by Supergiant

### Takeaway
Hades nests room, region, run and House (meta) loops, and treats death as the point where story progresses: you return to the House, characters react to what just happened, and permanent upgrades accrue. Narrative is "the opposite of scripted": many authored lines are selected by game state, with one-off story beats interleaved so the story moves forward on nearly every run.

### Cited Findings
- Loops: a run moves through rooms from pre-set layouts with randomized order/enemies; boons offered by gods are pick one of three; four regions with gating bosses; dying without defiance returns Zagreus to the House where abilities, weapons, relationships are improved; after one clear the Pact of Punishment raises difficulty for rare rewards, and God Mode instead strengthens after each failed run. — [Wikipedia: Hades](https://en.wikipedia.org/wiki/Hades_(video_game)) ⚠️ tool read first 100,000 of 118,331 characters; the article did not mention Mirror or keepsakes.
- Dialogue reacts to death and state: NPC conversations change with events in earlier runs and on what you see on return to the hub after a failed run (Wikipedia); Zagreus comments when you get farther than before, characters respond to boons you carry, and new lines and plot keep appearing after more than 25 runs. — [Wikipedia: Hades](https://en.wikipedia.org/wiki/Hades_(video_game)); [Engadget](https://www.engadget.com/2020-01-31-hades-early-access-believer.html)
- Kasavin (Oct 2019, GeekDad): the character is immortal, so death returns him to the House where he grows stronger and the player gains knowledge; bosses recur as "a rematch now" with conversation. Characters respond to the current state (health, location, which gods you have met); Kasavin calls the system "the opposite of scripted," with many authored contexts per character and the game picking the matching one; gods also react to each other within a run. Lines repeat only after many loops, roughly 20 to 30 runs, per the interviewer's reporting. Early Access launch treated "like a pilot episode," with story added in major updates every month or two; the final narrative outcome was reserved until Early Access ended. — [GeekDad](https://geekdad.com/2019/10/narrative-and-early-access-supergiants-greg-kasavin-discusses-hades-development/) ⚠️ only the second half of the interview was on the page; how the game tracks seen moments is not explained there.
- Kasavin, GDC podcast: roguelikes carry forward player knowledge; he asked what character could remember past deaths, imagining "a roguelike with narrative continuity, where every time you run into a boss, they remember." On difficulty walls he said systems should soften them so engaged players can still reach the story. — [Game Developer: Roguelikes and narrative design](https://www.gamedeveloper.com/design/roguelikes-and-narrative-design-with-i-hades-i-creative-director-greg-kasavin) ⚠️ page held only excerpts and pull quotes, not the full conversation.
- Choice of genre: Supergiant chose a roguelike because players replay it repeatedly, fitting branching narrative better than Pyre's single playthrough; writers drafted about ten hours of dialogue for many possible event chains. — [Wikipedia: Hades](https://en.wikipedia.org/wiki/Hades_(video_game))
- Inven interview (2021): Early Access feedback was "more important than any of our previous works," shaping balance, story and art; the team asked what happens "in the process of continuing the challenge after death." — [Inven Global](https://www.invenglobal.com/datalab/articles/14783/supergiant-games-how-indie-developers-made-goty-hades) ⚠️ page did not discuss meta progression, Heat or Mirror, despite its title.
- GDC 2021 "Breathing Life into Greek Myth" (Kasavin + Darren Korb): a studio under 20 people shipped a fully voiced game with more than 22,000 dialogue lines; Early Access was a boon for narrative. — ⚠️ from search-result descriptions of the [GDC Vault listing](https://gdcvault.com/play/1026975/Breathing-Life-into-Greek-Myth) only; the talk itself is members-only and was not read.
- Mirror of Night: permanent talents bought with Darkness (collected during runs), with later talents gated by Chthonic Keys in batches; one source lists 24 talents (12 primary, 12 alternate you swap in via Nyx). Examples: Death Defiance, Thick Skin, Olympian Favor. — [Fextralife Hades wiki: Mirror of Night](https://hades.wiki.fextralife.com/Mirror+of+Night) ⚠️ the tool flagged inconsistent cost tables on this page; use structure only, not costs.
- Keepsakes: giving Nectar to an NPC the first time yields that NPC's Keepsake; one regular keepsake equipped at a time plus a legendary companion; regular keepsakes have three ranks, reached after 25 and then 50 further cleared rooms with it equipped. — [Fextralife Hades wiki: Keepsakes](https://hades.wiki.fextralife.com/Keepsakes) ⚠️ per-rank values missing from page; one entry looked like a typo.
- Heat / Pact of Punishment: unlocked after a first clear; each modifier rank adds Heat; Heat is tied to the weapon used; higher Heat means better rewards; raising Heat one point at a time keeps every reward tier, jumping several skips those in between. — [RPGSite](https://rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards) ⚠️ the tool noted the page's modifier table had at least one internal inconsistency (Tight Deadline) and did not give reward amounts; I am not citing its modifier values.
- Amir Rao statements: not found (see Gaps).

### Inferences
- "Dialogue drip for dying" translates to Game Night as a post-failure debrief that reacts to the specific cause of death or ending, with new lines each replay; the board, President and feed are already a cast of recurring reactors.
- Heat shows opt-in difficulty that increases reward; Game Night's replay options could add visible "pressure dials" that pay out in unlock currency, not just harder numbers.
- The pilot-episode cadence (new story beat every month or two) matches an early-access-style content plan: ship many variants of reactions rather than many new mechanics.

### Gaps
- Amir Rao: no source found. Supergiant statement on "making failure rewarding" in their own words: only Kasavin's general remarks above; GDC dialogue talk not read.
- Any source on the run-end/death summary screen content: not obtained.

---

## 6. Narrative choice games: 80 Days, Suzerain, Citizen Sleeper

### Takeaway
All three expose the state their choices act on (money/time/luggage; resources/opinion/ideology and newspapers; dice/condition/clocks) and make consequences legible through visible numbers or timers. They space big decisions by letting the player pick when to commit (80 Days route planning, Citizen Sleeper's countdown clocks) or by forcing irreversible choices (Suzerain).

### 80 Days (inkle)
- Scale and "quit by fatigue": script about half a million words by Ingold and Meg Jayanth in about eight months; strategy is to include more content than any player will explore so players quit because they cannot keep up, not because they have seen everything; world of about 150 linked cities and roughly 450 written journeys; Ingold calls it a roguelike that is "randomly authored" rather than randomly generated. — [Game Developer: Threats, Luggage and Mild Peril (Leigh Alexander, Jan 2015)](https://gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-) (reported complete)
- Resources: money, luggage, a Fogg/Passepartout relationship stat, and time; Ingold contrasts with Sorcery!, whose consequences "could feel arbitrary and unplannable" (paraphrase by the summariser; resources here are things players can plan around). Using time as the main resource gave a skill element without quick-time events. Players first learn the rules, then want the game to show why their decisions mattered. — [Game Developer](https://gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)
- Visible branching: a map layer first used in Sorcery! shows a player's branching path; the globe shows where other players are, intended so choices "genuinely matter." The team found players did not mind failing after several attempts; mean and median trip lengths are close to 80 days; failure ending frames the trip as an epic journey. — [PocketGamer.biz](http://www.pocketgamer.biz/rewriting-the-text-adventure-the-making-of-80-days/)
- Analysis (secondary, not Ingold): the map "proves" branching; choices come in different sizes, many small ones pace the story; visible stats signal choices are registering; episodic city stories can be met in any order so the player controls rhythm; geography stages content (intro in Europe, advanced content later); consequences are often delayed or indirect. Reported scale there is over 700,000 words and about 16,000 choices. — [IF50 essay on 80 Days](https://if50.substack.com/p/2014-80-days) ⚠️ secondary analysis; its figures conflict with PocketGamer.biz/Game Developer (500,000 words, 10,000 choices) and Wikipedia (750,000 words, one circumnavigation shows about 2%); I do not resolve the conflict.
- Replayability (Ingold, 2023): 80 Days was designed to be replayed; one strategy is writing a lot; another is reusing material in different contexts. — [MCV/Develop interview](https://mcvuk.com/?p=224121) ⚠️ interview ahead of a talk he had not written yet; the terms "momentum," "storylets" and "quality-based narrative" did not appear in it.
- "Momentum": no source found where Ingold uses "momentum" as a design term. A search snippet (not fetched) says he compared the structure to blackjack where each new card makes the same choice riskier. — ⚠️ search-result snippet only, unverified.
- GDC talks "Adventures in Text" (2015) and "Narrative Sorcery" (2017): abstracts say they cover choices that matter, pacing and coercing narrative, and defensive scripting so a story stays coherent however the player arrives. — [Emily Short's GDC 2017 post](https://emshort.blog/2017/02/22/gdc-2017/) ⚠️ abstract only; [GDC Vault](https://gdcvault.com/play/1021775/Adventures-in-Text-Innovating-in) redirected to a maintenance page.

### Suzerain
- Decision structure: play centres on dialogue with ministers and officials, with multiple-choice responses; support material includes political maps, news, budget statistics and an optional briefing library; the base game has about 450,000 words and can be finished in under twelve hours; after the story a results screen shows an in-universe political compass and statistics; several endings. — [Wikipedia: Suzerain](https://en.wikipedia.org/wiki/Suzerain_(video_game)) (the summariser could not find how effects are delayed in that article)
- Irreversibility and consequences, reviewer's experience: one save file, no manual loading, choices "set in stone"; promises can be made without intent to keep them; consequences arrive later (economic gains undone, hardliners abandoning the president before an election, oligarchs threatening to leave); resources include economic strength, federal budget, personal wealth; newspapers with differing biases report reactions; ministers have goals and loyalties; endgame screen shows presidency details, a compass chart and statistics on how policies affected people. Limited gameplay variety noted (three resources do most of the work). — [KFJ Writes review](https://kfjwrites.substack.com/p/from-the-archive-suzerain-review) ⚠️ a personal review, not a developer statement
- Torpor lead Ata Sergey Nowak: resources, opinion and ideology were quantified after the narrative was written, and quantifying ideology was a major challenge. Some players vowed revenge after losing a vote. — [AV Club interview](https://www.avclub.com/suzerain-interview) ⚠️ capture was mostly navigation text; only a few details were visible.
- Marketing claims of nine major endings and 25+ sub-endings: ⚠️ store-page text seen only in a search snippet; not verified.

### Citizen Sleeper (Gareth Damian Martin)
- Cycle structure: one day (cycle) at a time; up to five six-sided dice rolled per cycle and placed into actions; you rest to start the next cycle; higher values generally mean better outcomes, low values suit data-cloud intel work; condition (body health) lowers the dice count (a deliberate "failure spiral"); clocks are circular progress bars tracking reputation, pursuers, relationships, things breaking down; most are under player control and advanced with effort each cycle; the designer calls this "exposing the variables to the player"; clocks come from Blades in the Dark. — [How To Make an RPG case study](https://howtomakeanrpg.com/r/a/case-study-citizen-sleeper.html) (the page lacked drives, events and endings)
- Martin: clocks "fundamentally expose variables to a player in an exciting way, but only if you handle it right"; he pre-rolls the daily dice pool so players commit "after seeing the stakes," a lesson from Blades in the Dark. — [Rascal News, part 1](https://www.rascal.news/tracing-citizen-sleepers-circuitous-vector-from-tabletop-to-hit-video-game/) (only first of two installments)
- Dice as abstraction: dice stand for luck or energy, clocks for progress or damage. — [Teeth RPG interview](https://teethrpg.substack.com/p/a-magical-little-ritual-an-interview) (note: that interview concerns Martin's tabletop games, not Citizen Sleeper's cycle)
- Drives, timed events and clocks in play (reviewers): drives replace quests so players choose which stories matter; some events carry countdowns of cycles before resolving or hurting; some clocks advance with actions or simply as cycles pass, and unmanaged ones bring bounty hunters; difficulty lies in deciding the best use of each cycle's dice. — ⚠️ search-result snippets of RPGamer and others only; RPGamer returned HTTP 403, so none of this is read in full.
- Endings: multiple, determined by choices, with scattered per-storyline endings (e.g. four endings in the Lem and Mina storyline). Developed by a one-person studio; three free DLC chapters followed. — [Wikipedia: Citizen Sleeper](https://en.wikipedia.org/wiki/Citizen_Sleeper) (Wikipedia gives little on systems)

### Inferences
- The shared pattern: a small number of readable state variables + a visible countdown + a plan-then-commit step. Pre-rolled dice in Citizen Sleeper is an exact analogue of "show the odds before the player chooses," which directly counters "can't tell which decisions are right."
- Spacing big decisions: 80 Days puts the spacing in the player's hands (when to leave a city); Citizen Sleeper uses clocks that count cycles. For a real-time lab game, visible clocks on pending consequences (a regulator hearing, a competitor launch) would fill "quiet weeks" with anticipation while still stopping the clock only for decisions.
- Suzerain shows the opposite choice: no undo makes decisions feel weighty but is reviewed as often punishing; Game Night's replay-for-different-endings suggests a preview or confirmation of the stakes instead.

### Gaps
- No designer statement found on Suzerain's delayed-consequence implementation or on how many decisions per chapter.
- Citizen Sleeper's design of drives, timed events and endings from Martin's own words: not found (part 2 of the Rascal interview and the Teeth interview did not cover the cycle).
- Ingold's "momentum" concept: not located.

---

## 7. Briefly: Papers, Please and Inscryption

### Takeaway
Papers, Please shows the cleanest end-of-day summary loop (pay, penalties, then spend on family needs) and rule drift that raises difficulty; Inscryption shows meta structure (death cards persist into later runs, acts change form).

### Cited Findings
- Papers, Please: each day is a time-limited shift with that day's entry rules set in advance and growing harder; citations arrive by fax after mistakes; end of day pays per entrant, adds bribes, subtracts penalties, then you allocate money to family needs (rent, food, heat, others); debt ends the game; new rules appear as diplomacy worsens; scripted encounters are mixed with random entrants; the story mode has twenty endings; EZIC admissions affect the ending. — [Wikipedia: Papers, Please](https://en.wikipedia.org/wiki/Papers,_Please) ⚠️ the tool described this as a summary without full family-needs list, endings list or day-by-day rule schedule.
- Inscryption Act I: four randomly generated maps (path among battles, card additions/removals, consumables; style resembles Slay the Spire); losing twice on a map or once in a boss fight has Leshy capture the character as a death card, which can reappear in later runs; Act III returns to roguelike format where P03's side draws on death cards from earlier runs, making fights harder; Act II has no loss penalty beyond not advancing. Game is framed as found footage, with an ARG; Mullins started it as a Ludum Dare 43 game. — [Wikipedia: Inscryption](https://en.wikipedia.org/wiki/Inscryption)

### Inferences
- Both convert past play into artifacts the player meets again (family bills, death cards). A Game Night ending could leave a recurring artifact (a former employee, a rival lab, a policy) that shows up in the next run's events.

### Gaps
- No design interviews (Lucas Pope, Daniel Mullins) were opened for these two.

---

## 8. Cross-cutting: variety rules and run-end summaries

### Takeaway
Across the sources, variety comes from (a) state-filtered pools with weights (Reigns), (b) fixed scaffold plus random fill (Slay the Spire), (c) enough authored content that no player exhausts it (80 Days), (d) many context-keyed lines with rare repeats (Hades), and (e) rule accretion (Papers, Please). Run-end summarising is thin in the sources I could read: the clearest examples are Suzerain's compass-and-statistics screen, Papers, Please's daily ledger, and 80 Days' framed final sequence.

### Cited Findings
- No-repeat and conditions: Reigns removes recently played cards and condition-failing cards from the bag ([Alliot](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-)); Slay the Spire relics "can only be encountered once in a run" ([wiki.gg Relics](https://slaythespire.wiki.gg/wiki/Relics)), the same elite can recur in an act but not back-to-back ([wiki.gg Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations)), and Unknown-room type odds rise each time a type is not rolled and reset when it appears ([wiki.gg Map Generation](https://slaythespire.wiki.gg/wiki/Map_Generation), ⚠️ under construction).
- Chains: Reigns multi-card mini-storylines and add-on characters ([Alliot](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-)); Hades boss rematches with conversation and one-off story moments alongside repeatable content ([GeekDad](https://geekdad.com/2019/10/narrative-and-early-access-supergiants-greg-kasavin-discusses-hades-development/)).
- Context-keyed commentary: Hades characters respond to health, location and which gods you have met ([GeekDad](https://geekdad.com/2019/10/narrative-and-early-access-supergiants-greg-kasavin-discusses-hades-development/)); Reigns card text depends on stats ([Short](https://emshort.blog/2016/08/20/reigns/)).
- Run-end: Suzerain endgame shows a political compass and policy-impact statistics ([Wikipedia](https://en.wikipedia.org/wiki/Suzerain_(video_game)), [KFJ Writes](https://kfjwrites.substack.com/p/from-the-archive-suzerain-review)); Papers, Please day ledger ([Wikipedia](https://en.wikipedia.org/wiki/Papers,_Please)); 80 Days frames loss as an epic journey ([PocketGamer.biz](http://www.pocketgamer.biz/rewriting-the-text-adventure-the-making-of-80-days/)); Slay the Spire elites add a "Score bonus" ([wiki.gg Map Locations](https://slaythespire.wiki.gg/wiki/Map_Locations)).
- What makes players start another run: Giovannetti says quickly letting players start carving out new strategies kept them motivated after losses ([Road to the IGF](https://www.gamedeveloper.com/disciplines/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-)); Alliot designed the dynasty to soften deaths and the Devil arc to explain new reigns ([Inverse](https://www.inverse.com/gaming/23117-reigns-francois-alliot-nerial-developer-interview), [Wikipedia](https://en.wikipedia.org/wiki/Reigns_(video_game))); Hades chose roguelike so story could be delivered across repeated runs ([Wikipedia](https://en.wikipedia.org/wiki/Hades_(video_game))); Ingold wants quitting from fatigue, not exhaustion of content ([Game Developer](https://gamedeveloper.com/design/threats-luggage-and-mild-peril-designing-i-80-days-i-)).

### Inferences
- Concrete rules a Game Night event deck could adopt: (1) per-run no-repeat on event IDs, (2) eligibility conditions on lab state and era, (3) weights that rise for events not yet seen and for chain follow-ups, (4) pinned beats per era (a guaranteed breather and a guaranteed big decision), (5) context-keyed reactions in feed/board/President for the same event.
- A summary that names the three or four decisions that most changed the ending (like Reigns' cause-of-death text or Suzerain's policy-impact statistics) would answer "which decisions were right."

### Gaps
- None of the opened sources describes in detail the death/run-over screens of Reigns, FTL, Slay the Spire, or Hades; this should be checked in-game or in a video if needed.

---

## Coverage

How fetching worked: every page below was fetched through a tool that converts the page and returns a summary produced by a small model, not the raw text. "Read to the end" therefore means the tool reported the page complete, not that I verified word for word. The tool itself flagged truncation where it saw it.

Opened and reported complete or near-complete by the tool:
- Wikipedia: Reigns, Slay the Spire, Citizen Sleeper (thin on systems), Suzerain (no delayed-effect detail), 80 Days (thin), Papers Please, Inscryption.
- Wikipedia: FTL (summary-level; reported as covering the requested sections).
- Alliot, Game Developer "adaptive narrative in Reigns"; Inverse Alliot interview (edited for brevity); Emily Short's Reigns review (comments truncated, review complete).
- Game Developer "Designing Without a Pitch" FTL postmortem article (complete but contains nothing on pacing); Engadget Joystiq Indie Pitch (excerpt; stray placeholder mid-answer).
- Rogueliker LocalThunk interview (complete; no juice content); GMTK Balatro article (complete).
- Game Developer 80 Days article (Alexander, 2015); PocketGamer.biz 80 Days; IF50 80 Days essay (comments cut off); MCV/Develop Ingold 2023 interview.
- wiki.gg Slay the Spire: Ascension, Map Locations (summary page), Map Generation (under construction), Relics (summary page).
- GeekDad Kasavin interview (second half only); Engadget Hades Early Access article; Inven Global Hades interview.
- How To Make an RPG Citizen Sleeper case study; Rascal News Citizen Sleeper part 1 and part 2 (each only one installment); Teeth RPG Martin interview (about tabletop games).
- KFJ Writes Suzerain review.

Opened but only partial or excerpt:
- ⚠️ Wikipedia: Hades (first 100,000 of 118,331 characters read) and Wikipedia: Balatro (first 100,000 of 137,313 characters read).
- ⚠️ Game Developer "Roguelikes and narrative design with Hades creative director" (excerpts and pull quotes only).
- ⚠️ Game Developer Road to the IGF: Slay the Spire (short Q&A; no relics/elites/events content).
- ⚠️ Podwise outline of Giovannetti's GDC 2019 talk (third-party AI outline; transcript behind sign-in).
- ⚠️ Think Like A Game Designer (Giovannetti podcast page; show notes only, transcript empty).
- ⚠️ Game Developer on Her Majesty (relies on embedded video).
- ⚠️ Episodic Content, The Making of FTL ch. 2 (only that chapter, without beacons or rebel fleet).
- ⚠️ AV Club Suzerain interview (capture mostly navigation text).
- ⚠️ Fextralife Hades pages (Keepsakes, Mirror of Night; tool flagged data-quality problems) and RPGSite Pact of Punishment (inconsistent table; rewards amounts missing).
- ⚠️ Blake Crosley Balatro analysis (third-party; illustrative code).
- ⚠️ Emily Short's GDC 2017 post (abstracts only).

Could not reach or never opened (do not treat as verified):
- ⚠️ GDC Vault pages and videos (FTL 2013 postmortem, Slay the Spire 2019 metrics talk, Hades 2021 dialogue talk, Ingold's talks): members-only or redirected to a maintenance page; talk content unseen. YouTube was not read.
- ⚠️ HTTP 403: AppUnwrapper Alliot interview, Construct forum post quoting Reigns bag logic (the same logic is in Alliot's own Game Developer article), TouchArcade LocalThunk interview, RPGamer Citizen Sleeper review, Screenhub Kasavin article, glasp transcript.
- ⚠️ HTTP 402: Fandom wikis (FTL "Rebel Fleet").
- ⚠️ HTTP 404 / 401: wiki.gg Slay the Spire "Map", "Card_Rewards", "Rewards" pages; hades.wiki.gg pages (401).
- ⚠️ PC Gamer "Tinderocracy" and GamesRadar Reigns articles returned only headlines (truncated); not used.
- ⚠️ Claims from search-result snippets only, not opened, are individually marked above: MacStories partial-swipe hint, Reigns "second third of the game," GameStar jump animation, FTL blue-option forum posts, 80 Days blackjack comparison, Suzerain store-page ending counts, Citizen Sleeper reviewer descriptions of drives/timed events, GDC Hades "22,000 lines."
- Not found at all: Amir Rao statements; Ingold's use of "momentum"; Alliot's GDC talk; any run-end summary content for Reigns, FTL, Slay the Spire, Hades.

Instruction compliance: no email address was used in any lookup. Quotes are under 15 words.
