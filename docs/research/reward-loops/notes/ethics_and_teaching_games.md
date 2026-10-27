# Ethics of reward loops, and how serious games use loops to teach (research notes for Game Night AI Lab)

Scope: a free, no-monetization, real-time browser management game (five eras, about 20-30 minutes a run) that teaches how AI labs decide about training, safety, money, governments and race pressure. Everything under "Inferences" is my reasoning from the cited findings, not a sourced claim. Marks: ⚠️ means I did not read the full source (reason stated inline). Quotes are kept under 15 words.

## 1. Dark patterns in games: definitions, catalog, regulation, and which apply to a free game

### Takeaway
The standard definition (Zagal, Björk and Lewis 2013) turns on intent plus harm plus lack of consent, and its three categories are time, money and social capital. Almost all regulation targets money and children, so a free game with no purchases sits outside nearly every legal rule. The patterns that still apply to it are the temporal and psychological ones: appointments, streaks, fear of missing out, treadmills, and not being able to stop.

### Cited Findings

**The founding paper (read in full).**
- Zagal et al. (FDG 2013) define a dark game design pattern as one "used intentionally by a game creator" to cause negative experiences "against their best interests" and likely without the player's consent. They separate "Bad Design" (honest mistake) from "Designing for Bad" (intended), so intent is part of the test. — [Zagal, Björk, Lewis 2013](https://gup.ub.gu.se/file/101018)
- Their proto-definitions failed on consent. Games that hurt on purpose (Painstation, extreme role-play, brutally hard games) are not dark if the player knowingly opts in. The test is a "meeting of minds", like a contract. — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Tricking the player can be acceptable when it serves the player. Examples: Eternal Darkness fake "crash" messages, AI that secretly cheats, rubber-band AI in racing games. — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Three categories, each with guiding questions: (a) Temporal: grinding, playing by appointment. (b) Monetary: pay to skip, pre-delivered content, monetized rivalries ("pay to win"). (c) Social capital: social pyramid schemes, impersonation. — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Temporal guiding questions: can the player judge the time commitment? Is the real time needed far from what they expected? How likely are they to feel they "wasted their time"? — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Playing by appointment becomes dark with a "withering" mechanic (crops that die if you do not return, mostly within 24 hours in FarmVille). The paper says the darkness is nullified if appointments are not required for progression, giving Pokémon night-only creatures and optional WoW rare spawns as the light cases. — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Context decides darkness: a pattern becomes dark for a player "when the pattern does not support her chosen play style". — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Section 5.2 asks where the line is between engaging design and "exploiting player's cognitive biases", and cites Madigan's SimCity Social analysis, including the fake-scarcity text "One Time Offer! You will NEVER see this offer again!" It leaves the question open. — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Section 5.3 warns that serious games and "games with a purpose" can also manipulate if the player is not told the real goal. It separates inviting someone to play and learn from tricking them into learning. — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Section 6 adopts a "disclosure principle" from persuasive-technology ethics: disclose motives and methods. It argues for "manipulation literacy": once players can understand a pattern and consent, it is "no longer dark". It quotes a designer warning that manipulative tricks are "poisoning the well". — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Caveat from the paper itself: there are "no bright-line tests"; judgments depend on context, audience and implementation. — [Zagal et al.](https://gup.ub.gu.se/file/101018)

**The darkpattern.games catalog.**
- Definition: a dark pattern is "deliberately added to a game to cause an unwanted negative experience for the player with a positive outcome for the game developer." Four groups: Temporal, Social, Monetary, Psychological. — [DarkPattern.games home](https://www.darkpattern.games/)
- Pattern IDs I opened show the full catalog (one-line descriptions are the site's): Temporal: Playing by Appointment, Daily Rewards, Grinding, Advertisements, Infinite Treadmill, Can't Pause or Save, Wait To Play. Monetary: Premium Currency, Pay to Win, Pay to Skip, Accidental Purchases, Recurring Fee, Gambling/Loot Boxes, Power Creep, Pay Wall, Artificial Scarcity. Social: Social Pyramid Scheme, Social Obligation/Guilds, Friend Spam/Impersonation, Reciprocity, Encourages Anti-Social Behavior. Psychological: Invested/Endowed Value, Badges/Endowed Progress, Complete the Collection, Illusion of Control, Variable Rewards, Waste Aversion, Anchoring Tricks, Aesthetic Manipulations, Fear of Missing Out, Competition, Optimism and Frequency Biases. — [pattern pages, e.g. #11](https://www.darkpattern.games/pattern/11/x.html), [#14](https://www.darkpattern.games/pattern/14/x.html), [#28](https://www.darkpattern.games/pattern/28/x.html), [#30](https://www.darkpattern.games/pattern/30/x.html), [#53](https://www.darkpattern.games/pattern/53/x.html)
- Daily Rewards: streak bonuses create "a strong urge to check the game every day"; the stated aim is a habit, which is "harder to stop". It gets worse when a streak can be bought back. — [Daily Rewards](https://www.darkpattern.games/pattern/11/x.html)
- Infinite Treadmill: a game that cannot be completed denies the satisfaction of finishing; the site ties this to endowed progress and the Zeigarnik effect, and notes new content keeps "Fear of Missing Out" alive. — [Infinite Treadmill](https://www.darkpattern.games/pattern/14/x.html)
- Can't Pause or Save: a pattern where the game "does not allow you to stop playing whenever you want". Its mitigation advice for unpausable games is timed matches, so the player knows what they commit to. — [Can't Pause or Save](https://www.darkpattern.games/pattern/28/x.html)
- Grinding is not automatically dark: it is "the core mechanic of many games, and some people enjoy it". It turns dark when combined with pay-to-skip or wait timers. — [Grinding](https://www.darkpattern.games/pattern/12/x.html)
- Caveat on source quality: this is a community review site (user reviews rate mobile games from +5 healthy to -5 dark), not peer-reviewed. A 2024 peer-reviewed study (1,496 games, user-generated data) found dark patterns "widespread" in games seen as problematic and also present in games seen as benign. — [Niknejad et al. 2024, arXiv](https://arxiv.org/html/2412.05039v1) ⚠️ read only the abstract, intro and a few passages, not the full paper.

**Madigan's catalog of psychological tricks (SimCity Social).**
- Seven: reciprocity, funny money (virtual currency), status quo effect (pre-ticked defaults), artificial scarcity, endowed progress, availability heuristic, benign and malicious envy. He explicitly does not claim bad intent: "not saying Playfish set out to brainwash you." In a comment he says designers "can certainly debate the ethics." A commenter adds that variable reinforcement works "like a slot machine." — [Madigan, Psychology of Games, 2012](https://www.psychologyofgames.com/2012/07/seven-psychological-sins-of-simcity-social/) ⚠️ I read the fetched page in part (post body for sins 1-2 and the closing, plus a keyword search of the rest) and a fetch-tool summary for sins 3-7; I did not read his book "Getting Gamers" or his separate reward-schedule posts.

**Celia Hodent (ex-Epic UX lead), 2019 interview (read in full).**
- She wants the industry to self-regulate and to move away from engagement built on fear of missing out (FOMO). — [Game Developer, May 2019](https://gamedeveloper.com/design/former-i-fortnite-i-ux-lead-digs-into-ethical-game-design)
- Concrete design advice: "reward breaks" or at least do not punish players who are away. She cites WoW's rest bonus (XP fills faster after time away) and Animal Crossing running out of tasks as "not punishing breaks". — [Hodent interview](https://gamedeveloper.com/design/former-i-fortnite-i-ux-lead-digs-into-ethical-game-design)
- Her ethics argument is a collective-action problem: if one studio uses retention tricks "everybody has to do it". She ties it to Tristan Harris on the attention economy (autoplay). — [Hodent interview](https://gamedeveloper.com/design/former-i-fortnite-i-ux-lead-digs-into-ethical-game-design)
- She pushes back on casual use of "addiction": high engagement is not addiction, and she cites Przybylski (2016) that under 1% of gamers might meet the criteria for internet gaming disorder. This conflicts in emphasis with the 3% (plus 8.4% at risk) among regularly gaming European adolescents quoted from Müller et al. 2015 in Niknejad et al. — [Hodent interview](https://gamedeveloper.com/design/former-i-fortnite-i-ux-lead-digs-into-ethical-game-design); [Niknejad et al.](https://arxiv.org/html/2412.05039v1) ⚠️ (second figure read only in the intro; prevalence studies themselves not opened).
- ⚠️ Her book "The Gamer's Brain" and her GDC ethics talk were not accessed (only a GDC Vault listing surfaced in search).

**Regulation (mostly about money and children).**
- FTC v. Epic Games (Dec 19, 2022): $520M total ($275M COPPA civil penalty plus $245M refunds). Alleged dark patterns: counterintuitive, inconsistent buttons so one press could buy (e.g., waking from sleep, during loading, previewing an item); hard-to-find cancel/refund; locking accounts of players who disputed charges; ignoring over a million complaints. Order bars charging "through dark patterns" or without affirmative consent. These are allegations settled by consent order. — [FTC press release](https://www.ftc.gov/news-events/news/press-releases/2022/12/fortnite-video-game-maker-epic-games-pay-more-half-billion-dollars-over-ftc-allegations)
- EU Consumer Protection Cooperation (CPC) Network, 21 March 2025: seven non-binding "Key Principles" on in-game virtual currencies: clear real-money pricing; avoid obscuring cost (several currencies, repeated exchanges); do not force unwanted currency purchases; clear pre-contract information; respect the 14-day withdrawal right; plain-language terms; design respectful of vulnerabilities such as children's (parental controls, friendly defaults). In scope: currencies bought with real money. Out of scope: currencies "solely obtained through gameplay". The games industry body statement called the principles misguided. — [Reed Smith, 27 March 2025](https://www.reedsmith.com/articles/qas-on-the-eu-consumer-protection-authorities-joint-guidance-paper/) ⚠️ law-firm summary; I did not reach the Commission's own text (my guessed Commission URL returned "page not found"; Bird & Bird returned 402).
- EU "addictive design" thinking beyond money: in the Digital Fairness Act consultation (2025) the Commission describes addictive designs as features "that make consumers spend more time and money online than intended". Its examples include infinite scroll, ephemeral stories, autoplay, "penalties for disengagement – such as breaking a streak", and engagement-steered recommenders. Options floated: user controls, off by default, banned for minors. Osborne Clarke notes this is not yet regulated as such and argues for guidance and case-by-case review over blanket bans. — [Osborne Clarke, 5 Aug 2025](https://www.osborneclarke.com/insights/digital-fairness-act-unpacked-addictive-design) (law-firm source; page read in full). ⚠️ I could not verify whether the Commission's actual Digital Fairness Act proposal has been published as of 2026-10; search results only showed the consultation and an expectation of a Q3 2026 draft.
- ⚠️ UK DCMS loot box response (July 2022): search snippets (SCL summary) say the government chose not to bring loot boxes under gambling law, wants loot box purchases blocked for children without parental enablement, and will convene an industry working group. I did not open the gov.uk page or the SCL article. [SCL](https://www.scl.org/12652-uk-government-issues-response-to-call-for-evidence-on-loot-boxes-in-video-games/)
- ⚠️ FTC v. HoYoverse (Genshin Impact, Jan 2025, $20M, ban on loot boxes for under-16s without parental consent, odds and exchange-rate disclosure): only search snippets seen; the FTC pages I tried returned "not found". [FTC business blog](https://ftc.gov/business-guidance/blog/2025/01/level-tips-businesses-ftcs-settlement-genshin-impact-developer-hoyoverse) (not reached).

### Inferences
- Legal exposure for a free game with no purchases is near zero under the cited instruments (Epic order, CPC principles, loot box rules all need money or minors). The live standards are the designer-ethics tests (intent, consent, time honesty) and the EU's emerging "addictive design" list (streak penalties, autoplay-style hooks).
- Patterns that still bite in a free game: Daily Rewards/streaks, Playing by Appointment, Fear of Missing Out, Artificial Scarcity (fake urgency), Infinite Treadmill, Can't Pause, Endowed Progress/Complete the Collection, Variable Rewards (catalog item), Waste Aversion. Zagal's own mitigations apply: tell the player the time cost, make appointments non-required, give a pause, and give the run a real end.
- Patterns a real-time five-era run needs to check: it is already a single sitting with a stated end (good against the treadmill); the risk is a mid-run timer that punishes stepping away, so a pause or auto-slow is the cheap fix (Hodent: "not punishing breaks"; darkpattern.games: Can't Pause).

### Gaps
- No primary Commission document, gov.uk DCMS page, or FTC Genshin page was read.
- I found no published taxonomy of dark patterns specifically for educational or non-monetized games; Zagal's section 5.3 is the closest.

---

## 2. Designer positions

### Takeaway
Blow frames scheduled rewards as "drugs" versus game depth as "food"; Hecker adds the psychology of why extrinsic rewards can drain interest and offers a harm-reduction list; Bogost's Cow Clicker proves that stripped-down hooks work even when meant as satire; Hodent frames it as a collective-action problem; Cook's loop model separates mastery loops (build understanding) from one-shot arcs.

### Cited Findings
- Jonathan Blow, Montreal Games Summit, 27 Nov 2007 ("Design Reboot"): designers lack discernment about why players play; most retention tools fall into one category, "scheduled rewards" (collectibles, unlockables, achievements, story advancement). MMOs keep players hooked with "constant fake rewards" (the "treadmill"). — [Game Developer report of the talk](https://www.gamedeveloper.com/game-platforms/migs-2007-jonathan-blow-on-the-i-wow-i-drug-meaningful-games) (secondary report by Brandon Boyer and Leigh Alexander, read in full; not a transcript or the slides.)
- Same report: "Rewards are a way of lying to the player so they feel good". Rewards divide into food (naturally beneficial) and drugs; "As game designers, we don't know how to make food" (so we resort to drugs). He states the industry is "exploiting them in an unethical way" and says a CEO of McDonald's should not feel good about the job; he frames it as a scale / public mental health issue. His test: strip out the scheduled rewards and ask whether the gameplay still stands. — [same report](https://www.gamedeveloper.com/game-platforms/migs-2007-jonathan-blow-on-the-i-wow-i-drug-meaningful-games)
- Also in that report: "Games by definition teach, the only question is – what?" and the game rules are the "meaning of life" the player learns (in WoW, time sunk over skill); his BioShock example is that the game throttles rewards the same way whether you save or harvest the Little Sisters, so the ethical dilemma "doesn't matter". — [same report](https://www.gamedeveloper.com/game-platforms/migs-2007-jonathan-blow-on-the-i-wow-i-drug-meaningful-games)
- Chris Hecker, "Achievements Considered Harmful?" (GDC 2010): the only two findings both sides of the reward debate accept are (1) for interesting tasks, tangible, expected, contingent rewards reduce free-choice intrinsic motivation; (2) verbal, unexpected, informational feedback raises it. He says no study of game achievements specifically existed that he knew of, and he warns of a "nightmare scenario" where metrics-driven design pushes toward extrinsic motivators and drains the reason to play. Quote: "The intrinsic reward for knifing dudes is knifing dudes." — [Hecker's page (archive copy, 2011)](http://chrishecker.com/Achievements_Considered_Harmful%3F) (page read in full; slides and mp3 not opened).
- Hecker's harm-reduction list: don't make a fuss; use unexpected rewards; use absolute not relative measures; use endogenous rewards (the reward is part of the activity); make them informational not controlling. He says following it still lowers intrinsic motivation somewhat, "but it's at least something you can do." He also says that if you build dull games with variable-ratio extrinsic motivators to take people's money, "you have my pity". — [Hecker](http://chrishecker.com/Achievements_Considered_Harmful%3F)
- Ian Bogost, Cow Clicker (2010): a Facebook game where you click a cow once every six hours; friends' cows give bonus clicks; premium currency ("Mooney") skips the timer. Meant as satire of FarmVille-style mechanics, it got over 50,000 players. Bogost says he began to feel "compulsively attached" himself, worrying about the clickers while away, and "disturbed by the product". He then built an end ("Cowpocalypse") whose countdown speeds up when people play and resets when they pay, so players "accelerate their own demise" (his words, paraphrased here) and are tempted to buy their way out. A fan said the game was no longer fun; he replied "It wasn't very fun before." — [NPR/On the Media transcript, 18 Nov 2011](https://www.npr.org/transcripts/142518949) (read in full); [Wikipedia: Cow Clicker](https://en.wikipedia.org/wiki/Cow_Clicker) for mechanics and credit prices (secondary; two Wikipedia-derived date versions of the Cowpocalypse conflict, so I give no date). ⚠️ Bogost's own Wired essay "Cow Clicker: The Making of Obsession" could not be fetched (blocked), so his written account is unread.
- Hodent (above): the downward spiral of retention tricks is a collective-action problem that regulation or self-regulation must break. — [Hodent interview](https://gamedeveloper.com/design/former-i-fortnite-i-ux-lead-digs-into-ethical-game-design)
- Daniel Cook (Lost Garden), "Loops and Arcs" (2012): a loop is expectation, action, system, feedback, updated mental model; loops build "wisdom", a holistic understanding of a complex system; arcs (books, movies, cutscenes) deliver a payload and then burn out, so businesses chain arcs and end up on a "content treadmill". He notes in-app purchases reward keeping the player engaged for long periods and may favor loop-heavy games. His suggested test: ask "What repeats and what does not?" — [Lost Garden](https://lostgarden.com/2012/04/30/loops-and-arcs) (read in full). Note: this essay is a design-structure essay, not an ethics essay; I found no Cook essay explicitly on ethical loops (a search found none). ⚠️ His "Chemistry of Game Design" (skill atoms, burnout) appeared only as a search result and was not opened.
- Jamie Madigan: see section 1 (catalog of seven tricks; non-accusatory framing; he leaves the ethics question open).
- Ryan, Rigby and Przybylski (2006): game appeal comes from satisfying autonomy, competence and relatedness, each independently predicting enjoyment and future play. ⚠️ Search-result summary only (the PDF was downloaded but I did not read it). [Rochester copy](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf)

### Inferences
- Blow's "strip the scheduled rewards and see what is left" and Hecker's "endogenous rewards" give one practical test: the reward must be part of the thing being learned (a model that finishes, a safety result that changes what is possible), not a separate badge.
- Cook's loop-versus-arc split matches the teaching goal: loops teach causal systems ("wisdom"); a lab game that only ran arcs (event cards, cutscenes) would teach stories, not dynamics.

### Gaps
- No direct primary text from Blow (slides, audio), Hecker's slides, or Bogost's own essay was read.
- Madigan's "Getting Gamers" reward-schedule material not reached.

---

## 3. Evidence: overjustification and gamification meta-analyses

### Takeaway
The best-known meta-analysis finds that expected, tangible, task-contingent rewards reduce later voluntary engagement with interesting tasks, while unexpected rewards and informational positive feedback do not harm or help. The learning-gamification meta-analysis finds small positive effects that are robust only for cognitive learning; nothing in it isolates badges or points.

### Cited Findings
- Deci, Koestner and Ryan (1999): 128 experiments. Engagement-, completion- and performance-contingent rewards undermined free-choice intrinsic motivation (d = -0.40, -0.36, -0.28). Self-reported interest was undermined by engagement- and completion-contingent rewards (d = -0.15, -0.17). Positive feedback raised free-choice behavior (d = 0.33) and self-reported interest (d = 0.31). Tangible rewards hurt children more than college students. — [Deci et al. 1999, third-party PDF copy](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf) (DOI 10.1037/0033-2909.125.6.627)
- Same paper: unexpected rewards and task-noncontingent rewards did not significantly undermine; people in a performance-contingent group who got less than the maximum reward showed the largest undermining of any group (d = -0.88); undermining was not just transitory (child studies, delayed assessments more than a week later, d = -0.53). The effect was shown for interesting tasks; their supplementary analysis of boring tasks did not show undermining. They explain it with controlling versus informational reward styles and suggest rewards are safer when low-pressure, choice-giving, and focused on interesting or challenging aspects of the task. — [Deci et al. 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf) ⚠️ I read the abstract, the theory section, the "Is Undermining Transitory?" section, the discussion's opening, and the "Implications for Use of Rewards" section (roughly 25% of the paper via keyword navigation); the full methods and results tables were not read. Boring-task result taken from methods text and Hecker's summary, not from the results tables.
- Controversy: Hecker notes the debate (Cameron and Pierce versus Deci) is contentious and so relies only on the two points both sides accept. The abstract of the Deci paper itself says it disputes earlier meta-analyses. — [Hecker](http://chrishecker.com/Achievements_Considered_Harmful%3F); [Deci et al. 1999](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf) ⚠️ Cameron and Pierce 1994 and Cameron et al. 2001 not read.
- Sailer and Homner (2020, Educational Psychology Review 32:77-112, open access): gamification of learning has small positive effects: cognitive g = .49 (k = 19, N = 1686), motivational g = .36 (k = 16, N = 2246), behavioral g = .25 (k = 9, N = 951). In a subsplit of high-rigor studies only the cognitive effect held; motivational and behavioral were not robust. — [Sailer and Homner 2020](https://opus.bibliothek.uni-augsburg.de/opus4/files/109056/109056.pdf)
- Moderators: game fiction and social interaction significantly moderated behavioral outcomes; competition combined with collaboration beat competition alone ("mere competition might be problematic"). The authors flag that behavioral outcomes were mostly measured during the intervention, so transfer outside the gamified context is uncertain. They did not code individual elements such as badges or leaderboards as a moderator; they cite other work (Landers et al. 2017 on leaderboards; Groening and Binnewies 2019 on achievements) showing effects depend on design details. They recommend badges awarded for helping others and a fictional world with an avatar as examples. — [Sailer and Homner](https://opus.bibliothek.uni-augsburg.de/opus4/files/109056/109056.pdf) ⚠️ I read the abstract, the discussion on social interaction, limitations and conclusion (via a text extraction with keyword navigation); the methods and tables were not read in full.
- Applicability limits: Deci's studies were lab experiments with money, marshmallows and similar tangible rewards; Hecker says no study on game achievements existed as of 2010. So extending Deci to in-game score or badges is an inference.

### Inferences
- Design reading of Deci + Hecker for this game: feedback should be informational (what your choice did to the lab), not controlling ("keep it up!"); avoid an end score that punishes anyone below a maximum (the d = -0.88 group); reward through consequences inside the sim rather than collectible medals.
- Sailer: fictional framing helps, and "compete plus cooperate" beats pure competition. For a single-player lab sim, the analogue is rival labs plus government and public stakeholders that can also cooperate (an inference; the meta-analysis studied classroom teams).
- Neither source says "a score is bad". Honest reading: evidence is mixed, effect sizes small, and mostly not about commercial-style game loops.

### Gaps
- No study found on whether a short (20-30 minute) game's reward pacing changes learning transfer.
- No evidence found on the effect of badges or points alone from these two sources.

---

## 4. Teaching games and games about systems: how the loop carries the lesson

### Takeaway
The strongest teaching games make the player act inside the system's incentives and feel its pull through ordinary loop rewards (followers, money, clips, pay per correct decision), then name or reveal the mechanism. Evidence of learning exists for the misinformation "inoculation" games (large pre/post, one randomized trial); for Papers, Please, Plague Inc and Universal Paperclips the evidence I found is design commentary, not learning outcomes.

### Cited Findings
- Procedural rhetoric (Bogost, Persuasive Games, 2007): games persuade through rules and processes; Wikipedia quotes Bogost defining it as "the art of using processes persuasively". — [Wikipedia: Procedural rhetoric](https://en.wikipedia.org/wiki/Procedural_rhetoric) ⚠️ secondary source; I did not open the book.
- Bad News (Roozenbeek and van der Linden 2019): about 15 minutes; you play a fake news producer, earning followers and credibility by using six techniques (impersonation, emotional content, polarisation, conspiracy theories, discrediting opponents, trolling). You earn six badges, one per technique, and are "punished" for acting like an ethical journalist. Pre/post survey, 14,266 paired responses: perceived reliability of manipulative items dropped significantly (about g = 0.26 to 0.33 per badge; average d = 0.52, g = 0.43 over the fake items) while two real-news controls did not change meaningfully. Largest gains for the most susceptible at pre-test. Limits: no randomized control group, self-selected sample (75% male, 47% highly educated), single-item outcomes, durability unknown. — [Roozenbeek and van der Linden 2019](https://doi.org/10.1057/s41599-019-0279-9) (PDF read in full)
- Harmony Square (Roozenbeek and van der Linden 2020): about 10 minutes; you are "Chief Disinformation Officer" collecting "likes" while dividing a town. Randomized trial (N = 681, Tetris control): reliability d = 0.51 for real fake news, confidence d = 0.30, willingness to share d = 0.28; no interaction with political ideology. Longevity not evaluated in that study. Built with CISA/State Department partners. — [HKS Misinformation Review](https://misinforeview.hks.harvard.edu/article/breaking-harmony-square-a-game-that-inoculates-against-political-misinformation/) ⚠️ I read the page via text extraction with long lines truncated for display; methods details and the supplement were not read in full.
- Design pattern shared by the two games: players are rewarded (followers, likes, badges) for using the manipulative technique, then tested on spotting it in other contexts ("refutational-different"). The authors argue the gain is attuned detection rather than blanket cynicism, because control items' ratings did not move. They also address the "teaching manipulation" worry (techniques are not secret; no motive provided). — [Roozenbeek and van der Linden 2019](https://doi.org/10.1057/s41599-019-0279-9)
- Universal Paperclips (Frank Lantz, 2017, free browser game): you play an AI optimizing paperclip output; the late-game supply of matter, drones, "trust" and "value drift" make the alignment thought experiment playable. Lantz described it as "playable philosophy" (per Reed). Reed reports two million players, many unable to stop, and that Lantz's intention was to divorce addictive play from recurring costs: no microtransactions, no social recruitment, and a definite ending. — [Aaron A. Reed, 50 Years of Text Games](https://if50.substack.com/p/2017-universal-paperclips) (read nearly in full; a few long lines were truncated in my display)
- Papers, Please (Lucas Pope, 2013): you are a border inspector paid per correct decision; family needs (rent, food, heat) turn each error into a family cost; bribes and moral dilemmas intrude; many endings. Pope says he built mechanics first and narrative later, and gives the design advice "focus on the gameplay and integrate it with the message". He was surprised by how players "express their loyalty to Arstotzka", the regime that "tightens the screws" on them. — [Reason interview with Pope, 2013](https://reason.com/2013/09/26/papers-please-politics-in-games-and-the/) (read in full); [Wikipedia: Papers, Please](https://en.wikipedia.org/wiki/Papers,_Please) for mechanics (secondary, skimmed).
- Plague Inc: the CDC reportedly invited creator James Vaughan to speak on 20 March 2013; sources describe interest in using the game to raise public awareness; I found no controlled learning evaluation, only classroom case descriptions (Harvard lab exercise, University of Derby module, a lesson plan). — [TouchArcade](https://toucharcade.com/2013/03/08/center-for-disease-control-invites-plague-inc-creator-to-speak-at-its-headquarters) ⚠️ search snippet only (page not opened); CDC's own blog page returned "Website Temporarily Unavailable" when fetched. Classroom uses: [Harvard ABL Connect](https://ablconnect.harvard.edu/book/plague-inc-immunology-lab) ⚠️ search snippet only.
- This War of Mine, Fate of the World, Democracy series: ⚠️ not researched (no sources opened).

### Inferences
- The pattern "reward the player for doing the thing the system rewards, then reveal it" appears in all strong cases: followers for manipulation (Bad News, Harmony Square), money for compliant inspection (Papers, Please), clip output for an optimizer (Paperclips). The pull is the lesson. For Game Night AI Lab this suggests letting lab metrics (revenue, capability, market share) pay out visibly while costs show up in other meters.
- The two misinformation games are the only ones here with randomized or large pre/post evidence; Paperclips and Papers, Please are better viewed as design precedents than as proven teachers.
- Durable learning from loops (Cook's "wisdom") likely needs repeated runs; Bad News authors list "booster shots" (replay) as unknown, so replay value is a research question, not a settled benefit.

### Gaps
- No source found measuring learning from Universal Paperclips, Papers, Please, or Plague Inc.
- No source found evaluating a management/strategy game about AI labs.

---

## 5. A game whose engagement loop is itself part of the lesson

### Takeaway
There is real precedent: Cow Clicker and Progress Quest were built as critiques of the loop; Universal Paperclips both uses and comments on the loop; the misinformation games make the player run the manipulation loop and then be debriefed. I found no game that shows a live "your product metrics are pulling you" overlay and no test of whether such a debrief works.

### Cited Findings
- Cow Clicker (see section 2): satire that became sincere engagement; Bogost felt the pull himself and ended the game with a Cowpocalypse whose timer speeds up when you play, as "the player's own act of play accelerates their demise" (paraphrase) and resets when you pay. — [NPR](https://www.npr.org/transcripts/142518949)
- Progress Quest (2002) mocked the grind of RPGs and EverQuest's auto-attack, running by itself; Reed notes it was "unexpectedly popular". Also from Reed: Cookie Clicker–style games were covered as dangerous ("You must never ever play Cookie Clicker"). — [Reed](https://if50.substack.com/p/2017-universal-paperclips)
- Universal Paperclips as a meta-comment on the player: Lantz says you are "completely and utterly entranced by this arbitrary goal", i.e., the player is shown their own absorption in an arbitrary number. A think-piece quoted by Reed asks "Can manipulative mechanics ever truly act as successful commentary on themselves?" Reed also records Lantz's wish for players to reflect on their "relationship to gaming itself". — [Reed](https://if50.substack.com/p/2017-universal-paperclips)
- Zagal et al.'s disclosure principle supports telling players about persuasive mechanisms; they also note persuasion that is disclosed and understood is not dark ("manipulation literacy"). — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- The Stanley Parable: critics read the narrator as a stand-in for the designer steering a compliant player; this comes only from critic essays, not Wreden, and nothing I found concerns reward loops or achievements. — ⚠️ [Electron Dance](https://www.electrondance.com/the-stanley-paradox/) search snippet only (not opened); no developer statement read.
- The "AI lab" angle: I did not retrieve a source on engagement-optimization at AI labs (OpenAI's April 2025 sycophancy post returned HTTP 403). ⚠️ Not researched beyond that failed fetch.
- "Kids" attention games: ⚠️ not researched.

### Inferences
- Combining Zagal (disclosure), Bad News (reward then reveal), and Paperclips (loop that stops by design) suggests three low-risk ways to make the loop part of the lesson: (a) make the reward visible as a metric the lab itself is optimizing, (b) have the ending screen name which hooks pulled the player and when they were used, (c) keep the run finite and pausable. These are design hypotheses, not tested.
- Risk named by Bad News authors and Bogost: teaching a technique can be misused, and a satire can be played sincerely. Cow Clicker shows irony players leave and sincere ones stay.

### Gaps
- No evidence on whether in-game disclosure of hooks reduces their pull or improves learning.
- No sourced example of a game that surfaces its own engagement metrics to the player in real time.

---

## 6. What separates a satisfying loop from a manipulative one (synthesis of the sources)

### Takeaway
Across designers, researchers and regulators, the line is not the mechanism (a reward schedule, a timer, a streak) but who benefits, whether the player can see and consent to it, and whether it takes more time or money than the player expected.

### Cited Findings
- Researchers: intent plus harm plus no consent; context and play style matter; no bright line. — [Zagal et al.](https://gup.ub.gu.se/file/101018)
- Community catalog: same mechanic is fine when enjoyed, dark when combined with others or used to extract; Grinding "some people enjoy it". — [darkpattern.games](https://www.darkpattern.games/pattern/12/x.html)
- Designers: Blow (food versus drugs: does the game stand without scheduled rewards); Hecker (rewards that are unexpected, endogenous, informational do least harm); Hodent (reward breaks, do not punish absence, avoid FOMO); Cook (loops that build understanding versus treadmills). — sections 2 above.
- Regulators: financial transparency and children's protection are the enforceable core (FTC v. Epic; CPC Network); the EU is moving toward a time-based notion of "addictive design" (features causing time and money use "than intended", streak penalties) but has not yet legislated it. — [FTC](https://www.ftc.gov/news-events/news/press-releases/2022/12/fortnite-video-game-maker-epic-games-pay-more-half-billion-dollars-over-ftc-allegations); [Reed Smith](https://www.reedsmith.com/articles/qas-on-the-eu-consumer-protection-authorities-joint-guidance-paper/); [Osborne Clarke](https://www.osborneclarke.com/insights/digital-fairness-act-unpacked-addictive-design)
- Evidence: informational feedback and unexpected rewards do not harm intrinsic motivation; expected contingent tangible rewards do (lab studies). — [Deci et al.](https://leeds-faculty.colorado.edu/dahe7472/deci%201999.pdf)

### Inferences (a possible checklist for the designer; not sourced as such)
1. Time honesty: show run length and era count up front; no hidden extension (Zagal temporal questions).
2. Nothing penalizes absence or pausing; no streaks, daily bonuses or fake urgency (Hodent; Commission's streak example; darkpattern.games).
3. Rewards are consequences inside the simulation and informational, not controlling medals (Hecker; Deci).
4. A real ending and no endless treadmill (darkpattern.games Infinite Treadmill; Paperclips precedent).
5. Disclose the hooks used, ideally as part of the lesson (Zagal disclosure; Bad News pattern).
6. Beware that "satisfying" feedback (variable rewards, near-misses) is exactly what Madigan and the catalog flag; use it knowingly and say so.

### Gaps
- No source quantifies how much reward-pacing a 20-30 minute teaching game can add before it reads as manipulative; this is a design judgment.

---

## Coverage

**Read to the end (full text opened in this session):**
- Zagal, Björk, Lewis, "Dark Patterns in the Design of Games" (FDG 2013), PDF text extracted locally, all pages including references.
- Roozenbeek and van der Linden, Bad News paper (Palgrave Communications 2019), PDF text extracted and read through the discussion, limitations and start of the references.
- Hodent interview (Game Developer, May 2019).
- NPR/On the Media Cow Clicker transcript (Nov 2011).
- Game Developer report of Blow's MIGS 2007 talk (a report, not the primary slides or audio).
- Hecker, "Achievements Considered Harmful?" page (Internet Archive copy).
- Cook, "Loops and Arcs" (Lost Garden, 2012).
- Osborne Clarke, "Digital Fairness Act Unpacked: Addictive Design" (Aug 2025).
- Reed Smith, Q&A on the CPC Key Principles (Mar 2025).
- Reason interview with Lucas Pope (2013).
- FTC press release on Epic Games (Dec 2022), via fetch tool (a summarized read; the page itself was not displayed to me in raw form).
- darkpattern.games home page and the pattern pages cited (#11, #12, #14, #27, #28, #30, #53 and one-line descriptions of others).

**Read partially (⚠️):**
- ⚠️ Deci, Koestner and Ryan 1999: abstract, theory section, "Is Undermining Transitory?", discussion opening, and "Implications for Use of Rewards in the Real World". Methods, full results tables, and the later parts of the discussion not read.
- ⚠️ Sailer and Homner 2020: abstract, discussion sections on stability, social interaction, limitations and conclusion. Methods and results tables not read in full.
- ⚠️ Harmony Square (HKS Misinformation Review): read from text extraction with long lines cut at about 900 characters for display; supplementary materials not read.
- ⚠️ Reed on Universal Paperclips: read most of the page; several long lines were cut in my display.
- ⚠️ Madigan's SimCity Social post: first and last sections read directly; the seven-item list otherwise verified through a fetch-tool summary.
- ⚠️ Niknejad et al. 2024 (arXiv): only abstract, introduction start and keyword hits.
- ⚠️ Wikipedia pages for Cow Clicker, Papers, Please, Procedural rhetoric: skimmed key passages only.

**Could not reach / search snippets only (⚠️):**
- ⚠️ Primary EU Commission text of the CPC Key Principles (my guessed URL 404; Bird & Bird 402). Used a law-firm summary.
- ⚠️ Star Stable coordinated action (appeared only in a search summary of a law-firm page; not opened, so not cited as a finding).
- ⚠️ UK DCMS loot box government response (July 2022): SCL snippet only.
- ⚠️ FTC v. HoYoverse (Genshin Impact): search snippets only; FTC page URLs I tried were not found.
- ⚠️ Digital Fairness Act proposal text and status (as of 2026-10): not verified.
- ⚠️ Bogost's Wired essay and the book "Persuasive Games"; Blow's slides and audio; Hecker's slides and audio; Hodent's book and GDC talk; Madigan's book; Cook's other essays ("The Chemistry of Game Design"); Ryan, Rigby and Przybylski 2006 (PDF downloaded but unread); CDC's own page on Plague Inc (site unavailable); Harvard and Derby Plague Inc classroom pages (snippets only); The Stanley Parable essays (snippets only).
- ⚠️ Springer and nature.com sources partly blocked (Springer returned a challenge page; used the open-access Augsburg repository copy for Sailer and Homner).
- Not researched at all: This War of Mine, Fate of the World, Democracy series, "Kids" attention games, any source on AI labs' engagement-maximizing products.

**Search tool note:** no email address was used in any lookup. Several WebFetch results are small-model summaries rather than raw page text; where I relied on those, it is flagged above.
