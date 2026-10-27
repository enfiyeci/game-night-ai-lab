> Raw subagent output (2026-10-27), kept for provenance. Not re-verified line by line; the claims the report relies on were traced by the orchestrator (see ../README.md).

# Game clones and the idea/expression line: case research for AI Lab Tycoon

Research notes for a risk report. This is not legal advice. Prepared 2026-10-27.

## How the sources were read

- **Primary sources read in full, by me, from the raw text.** US opinions came from the Caselaw Access Project's static JSON (`static.case.law`), from GovInfo, and from CourtListener's RECAP document store. UK judgments came from the National Archives "Find Case Law" XML. CJEU judgments came from the EU Publications Office (cellar). Each is marked "read in full" in the coverage statement.
- **Secondary sources (news, law-firm blogs, a Japanese government case summary)** were read through a fetch tool that hands back a model-written summary of the page, not the raw page text. I never saw those pages word for word, so every claim resting on them carries ⚠️.
- Quotations are from court opinions and statutes only, and each is under 15 words. Secondary sources are paraphrased.
- The courtlistener.com opinion pages, law.justia.com, BAILII, EUR-Lex and curia.europa.eu all blocked automated access (see "could not reach" in the coverage statement). I used the mirrors above for the same documents.

---

## 1. United States

### 1.1 The statute and the root case

**17 U.S.C. §102(b).** Copyright does not extend to "any idea, procedure, process, system, method of operation, concept, principle, or discovery", however it is "described, explained, illustrated, or embodied". §102(a) lists "motion pictures and other audiovisual works" as protected categories, and every video game case below treats the game's screen output as an audiovisual work. Source: https://www.law.cornell.edu/uscode/text/17/102

**Baker v. Selden, 101 U.S. 99 (U.S. Supreme Court, October Term 1879).**
- *What was copied:* Selden's book explained a bookkeeping system and included blank ruled forms. Baker sold account books built on substantially the same system, with the columns arranged differently.
- *Holding:* A copyright in a book explaining a system gives no exclusive right to the system itself, or to the forms that have to be used to practise it. Those forms are "necessary incidents" of the art, and the art is the business of patent law. The Court carved out "ornamental designs, or pictorial illustrations addressed to the taste", whose form is their essence.
- *Short holding:* "The object of the one is explanation; the object of the other is use."
- *Why it matters:* This is the root of §102(b), of merger, and of the "game rules are a system" line used in DaVinci (2016).
- Source: https://static.case.law/us/101/cases/0099-01.json

### 1.2 The cases in date order

#### Atari, Inc. v. North American Philips Consumer Electronics Corp., 672 F.2d 607 (7th Cir. 1982): PAC-MAN v. K.C. Munchkin
- *Court and posture:* Seventh Circuit, decided 2 March 1982, opinion by Judge Harlington Wood Jr. The district court had denied a preliminary injunction. The Seventh Circuit reversed and ordered one entered.
- *What was copied:* K.C. Munchkin was a maze-chase game with a "gobbler" and "ghost monsters", power capsules and role reversal. It differed in its maze, its moving dots, its number of dots and its colours.
- *Unprotected:* The court restated PAC-MAN's game as an abstract idea, described "much in the same way as one would articulate the rules": a maze-chase game in which the player scores points while avoiding pursuers and can temporarily turn the tables. It also stated flatly that "copyright protection does not extend to games as such." The maze, the scoring table, the tunnel exits ("wrap around") and the dots are scènes à faire (stock elements a genre needs). They are protected "only from virtually identical copying".
- *Protected:* The audio and "the concrete details of the visual presentation". Above all, the gobbler and ghost-monster characters, which are "wholly fanciful creations" not dictated by the game. The court found the two games' characters similar in size, shape, mouth action, eye and leg movement, and in their death and regeneration sequences.
- *Test:* Learned Hand's abstractions test (Nichols v. Universal) to locate the idea. Scènes à faire and idea-expression unity (merger) then narrow protection. Finally comes the "ordinary observer" test of whether the "total concept and feel" was captured, focused on similarities rather than differences.
- *Other points:* The court said "PAC-MAN's distinctive characters alone may constitute material of substantial value." It also said that playing differently (moving dots) does not excuse copying the protected expression. Footnote 78 adds an unfair competition point: retailer ads saying "like PAC-MAN" may be legitimate comparative advertising, but "Odyssey's PAC-MAN" or "a PAC-MAN game" is different.
- Source: https://static.case.law/f2d/672/cases/0607-01.json

#### Data East USA, Inc. v. Epyx, Inc., 862 F.2d 204 (9th Cir. 1988): Karate Champ v. World Karate Championship
- *Court and posture:* Ninth Circuit, 30 November 1988, opinion by Judge Trott. The district court had found infringement and ordered a recall. The Ninth Circuit reversed in full.
- *What was copied:* Both games showed two karate fighters (one in white, one in red), a referee with speech balloons, changing backgrounds, 30-second rounds, a bonus round, 14 moves, and half-point and full-point scoring.
- *Unprotected:* The district court's list of 15 shared features. They "necessarily follow from the idea" of a karate game, or come from limits of the Commodore hardware (sprites, limited colour). The court held that "karate is not susceptible of a wholly fanciful presentation." It quoted Krofft: "When idea and expression coincide, there will be protection against nothing other than identical copying."
- *Protected:* Only Data East's own contribution, which was the scoreboard and the background scenes. The backgrounds were "quite dissimilar" and the scoring similarity was "inconsequential". Judged by the games' actual audience, "a discerning 17.5 year-old boy could not regard the works as substantially similar."
- *Test:* The Ninth Circuit's two steps: an "extrinsic" (objective) test of similar ideas and an "intrinsic" (ordinary observer, total concept and feel) test of expression. Before comparing, "analytic dissection" filters out similarities that come from shared ideas or scènes à faire.
- Source: https://static.case.law/f2d/862/cases/0204-01.json

#### Lewis Galoob Toys, Inc. v. Nintendo of America, Inc., 964 F.2d 965 (9th Cir. 1992): Game Genie
- *What it is:* Not a clone case. Galoob's Game Genie altered a few data values on the fly (extra lives, speed and so on) while a Nintendo cartridge was running.
- *Holding:* The altered displays are not derivative works, because a derivative work "must incorporate a protected work in some concrete or permanent form", and the Game Genie neither contains nor replaces Nintendo's output. In the alternative, consumers' private, noncommercial use was fair use, and Nintendo showed no real market for altered versions.
- *Relevance here:* Low. It confirms that games are protected as audiovisual works. It is about modifying someone else's running game, not about making a similar one.
- Source: https://static.case.law/f2d/964/cases/0965-01.json

#### Computer Associates International, Inc. v. Altai, Inc., 982 F.2d 693 (2d Cir. 1992): the abstraction-filtration-comparison test
- *Facts:* An Altai programmer had copied about 30% of CA's ADAPTER code into OSCAR 3.4, and Altai conceded liability for that version. The rewritten OSCAR 3.5 contained no copied code. CA argued it still copied ADAPTER's structure.
- *Holding:* The non-literal structure of a program can be protected, but only after a three-step analysis. OSCAR 3.5 did not infringe. Separately, the court held that CA's trade secret claim was not preempted by copyright and sent it back to the trial court.
- *The test:*
  1. **Abstraction.** Break the program into levels, from code up to its ultimate function, as in Learned Hand's abstractions test.
  2. **Filtration.** At each level, remove:
     - (a) elements dictated by efficiency, where merger applies (rooted in Baker v. Selden);
     - (b) elements dictated by external factors, which is scènes à faire. Examples are hardware specifications, compatibility needs, manufacturer standards, the demands of the industry being served, and accepted practices;
     - (c) public-domain material.
  3. **Comparison.** Compare what is left, the "golden nugget" of protectable expression, and weigh how important the copied part is to the whole program.
- *Important caveat in the opinion itself:* The court said its test did not govern screen displays, which are audiovisual works with their own copyright. Data East is cited for the point that a display is protected only as far as its expression is protectable.
- *Policy:* Feist killed "sweat of the brow", so effort alone earns no protection. Whelan's "one idea per program" approach was rejected.
- Source: https://static.case.law/f2d/982/cases/0693-01.json

#### Capcom U.S.A., Inc. v. Data East Corp., No. C 93-3259 WHO, 1994 WL 1751482 (N.D. Cal. 16 March 1994): Street Fighter II v. Fighter's History
⚠️ The opinion itself is available only on Westlaw, and I could not reach it. Everything below is second-hand. It comes from (a) the DaVinci (2016) opinion's description of Capcom, a primary source I read in full, and (b) a Patent Arcade case brief, ⚠️ read through the summarising fetch tool.
- *What was copied (Patent Arcade ⚠️):* Capcom claimed the look of 7 of its 8 characters, 27 special moves, fighting styles, combination attacks and control sequences. Data East's own nine-page design proposal referred to Street Fighter II 22 times, so access to Capcom's game was easy to prove.
- *Unprotected (per DaVinci):*
  - tracking a fighter's health or vitality, which is commonplace;
  - stock moves such as kicks and punches, which are unoriginal and carry little expressive detail.
- *Unprotected (per Patent Arcade ⚠️):*
  - joystick and button control sequences, where idea and expression merge;
  - attract mode, "VS." screens, character selection, winner screens and vitality bars, all scènes à faire.
- *Protected (per DaVinci):* Some fanciful special moves, such as E. Honda's humanly impossible rapid slap. But a similar magic-projectile move did not count, because the projectiles looked different and the idea was not original to Capcom.
- *Result (Patent Arcade ⚠️):* The court found similar protectable expression in only 3 characters and 5 moves. That was not "bodily appropriation", and the preliminary injunction was denied.

#### Incredible Technologies, Inc. v. Virtual Technologies, Inc., 400 F.3d 1007 (7th Cir. 2005): Golden Tee v. PGA Tour Golf (added: a later game decision)
- *What was copied:* Global VR set out to make a game Golden Tee players could pick up with "no appreciable learning curve". It reproduced the trackball control scheme, the control panel layout and instructions, and the shot-shaping options.
- *Holding:* The Seventh Circuit affirmed the denial of a preliminary injunction.
  - The trackball system is functional and a "method of operation" under §102(b), so it belongs to patent law, not copyright.
  - The control panel instructions show "less than minimal" creativity and are protected only against identical copying.
  - Golf, like karate, "is not a game subject to totally 'fanciful presentation'": courses, clubs, a wind meter and menus are scènes à faire. The display is therefore protected "only from virtually identical copying". Real courses, real golfers and different announcer lines were enough difference.
  - The trade dress claim on the control panel failed because the panel is functional.
- Source: https://static.case.law/f3d/400/cases/1007-01.json

#### Tetris Holding, LLC v. Xio Interactive, Inc., 863 F. Supp. 2d 394 (D.N.J. 2012): Tetris v. Mino (required)
- *Court and posture:* District of New Jersey, 30 May 2012, Judge Freda L. Wolfson, cross-motions for summary judgment. Summary judgment went to Tetris on both copyright and federal trade dress.
- *What was copied:* Xio admitted downloading the Tetris iPhone app and building Mino from it. It argued that it had copied only "rules and functionality" after researching IP law. Tetris listed 14 elements, including:
  - the seven tetrimino shapes;
  - the visibly delineated blocks and bright colours;
  - the 10 × 20 playfield;
  - the next-piece preview and the ghost (shadow) piece;
  - the colour change when a piece locks;
  - garbage lines;
  - the end-of-game fill animation;
  - the multiplayer screen layout.
- *Unprotected:* The rules and abstract idea. Tetris is a game where falling block-pieces are rotated to complete horizontal lines, completed lines clear and score, and reaching the top ends the game. Expression "inseparable" from that idea is unprotected too.
- *Protected (expressly held):*
  - the style, design, shape and movement of the pieces;
  - the exact 20 × 10 playfield dimensions (a "higher than wide" board is a free idea, the exact dimensions are not);
  - the display of garbage lines, the ghost piece and the next-piece preview;
  - the colour change on lock-down;
  - the end-of-game fill animation.
- *What the court left open:* It did not decide the remaining listed elements. It said that "standing alone" the smaller elements might not prove infringement. What mattered was "the wholesale copying of the Tetris look that the Court finds troubling".
- *Reasoning and test:*
  - The court found the Whelan and Altai approaches converge. Its job was to separate ideas and rules from expression and then compare.
  - **Merger** "is rare" and did not apply, because there were "almost unlimited" ways to design pieces and boards. Xio's own expert admitted this, and Dr. Mario was cited as a different expression of Tetris-like rules.
  - **Scènes à faire** had little weight, because Tetris is "purely fanciful", unlike karate or golf.
  - The court rejected Xio's theory that any expression tied to a rule or function is free. It said "Any game expression can always be defined as relating to a game rule."
  - **Comparison:** Viewed as a layperson would, on gross features and total look and feel, the games were nearly indistinguishable. "If one has to squint to find distinctions only at a granular level," the works are likely substantially similar.
  - Fair use failed.
- *Trade dress:* Brightly coloured four-block pieces and a tall rectangular playfield were non-functional "arbitrary flourishes" under the TrafFix test (a feature is functional if it is essential to use or affects cost or quality). Dastar (a ruling that the Lanham Act cannot be used to sue over copying public-domain material) was no bar, because the claim rested on confusing packaging and advertising.
- Source: https://static.case.law/f-supp-2d/863/cases/0394-01.json (the same opinion as the CourtListener page, which returned an empty page to my tools)

#### Spry Fox, LLC v. LOLApps, Inc., No. C12-147RAJ (W.D. Wash. 18 September 2012), 2012 WL 5290158: Triple Town v. Yeti Town (required)
- *Court and posture:* Western District of Washington, Order (Dkt. 24) by Judge Richard A. Jones, dated 18 September 2012. Some secondary sources give 29 October 2012, but the order itself is dated 18 September. This was a motion to dismiss. It was **denied** on copyright and **granted without prejudice** on the Lanham Act (trademark) claim. Only plausibility was at issue, not a final finding.
- *What was copied (as alleged):*
  - a 6 × 6 grid and match-three merging up an object hierarchy (Triple Town: grass → bush → tree → hut; Yeti Town: sapling → tree → tent → cabin);
  - a bear antagonist versus a yeti, and "Imperial Bots" versus campfires as destroyers;
  - coins and an in-game store with the same prices and purchase limits;
  - near-paraphrased tutorial dialogue;
  - a similar arrangement of margin displays.
  - 6Waves had privileged access to the game under an NDA during publishing talks.
- *Unprotected:*
  - The **idea**: a hierarchical matching game with antagonists and destroyer objects.
  - **Scènes à faire**: points and coins as rewards, game tips in the margins (though their visual style is protectable), and an in-game marketplace.
  - **Functional choices**: the 6 × 6 grid, the store pricing structure and the purchase limits.
  - **Rules**: "the rules of the game are entitled to (at best) thin protection."
- *Protected:* Spry Fox's chosen expression: the "object hierarchy that progresses from grass to bushes to trees to houses and beyond", the bear, the bot, their visual depictions, and the meadow setting. The court treated a game as having "plot, theme, dialogue, mood, setting, pace, and character" like a screenplay. It gave the Gone with the Wind analogy: renaming the hero and moving him to Alaska does not avoid infringement.
- *Thin protection:* Dialogue text explaining the rules is protected only against "nearly identical copying". Footnote 2 notes that an original selection and arrangement of otherwise unprotected elements can also be protected.
- *Other points:* The court said the title "Yeti Town" was itself evidence one could infer copying from. On the Lanham Act it observed that consumers might see Yeti Town as a Triple Town "knockoff" yet still know different companies made them, and that trademark similarity is a "starkly different standard".
- *Outcome after the order:* Settled out of court in October 2012. Spry Fox took ownership of the Yeti Town IP, and Yeti Town was pulled from sale; the terms are confidential. ⚠️ PocketGamer.biz, 15 October 2012, read via the summarising fetch tool: https://www.pocketgamer.biz/spry-foxs-triple-town-triumph-sees-studio-pick-up-yeti-town-ip/
- Source: https://storage.courtlistener.com/recap/gov.uscourts.wawd.181650.24.0.pdf

#### DaVinci Editrice S.R.L. v. Ziko Games, LLC, 183 F. Supp. 3d 820 (S.D. Tex. 2016): Bang! v. Legends of the Three Kingdoms (required)
- *Court and posture:* Southern District of Texas, Memorandum and Opinion (Dkt. 73) of 27 April 2016, Judge Lee H. Rosenthal. Summary judgment of no infringement went to the defendants, and DaVinci's motion was denied. An earlier 2014 ruling (Dkt. 44), described in the 2016 opinion, had already held that shared rules could not support the claim. It had kept the character claim alive and dismissed the Texas unfair-competition claims as preempted by copyright.
- *What was copied:* Undisputed: the rules were "nearly identical".
  - The roles matched function for function: Sheriff, Deputy, Outlaw, Renegade became Monarch, Minister, Rebel, Turncoat.
  - Winning conditions, hidden roles, range-based attacks and mount cards were the same.
  - Character special abilities and life points carried over.
  - The setting (Wild West versus ancient China), the art, the names and the written instructions were different. The parties agreed those visual elements were not substantially similar.
- *Unprotected:*
  - **Rules, procedures and winning conditions**, which are §102(b) systems. The court quoted the Copyright Office's FL-108 circular: copyright does not protect "the idea for a game... or the method or methods for playing it". It held that "game rules, procedures, and winning conditions create the environment for expression."
  - **The role alignment.** Sheriff and Deputies against Outlaws and a Renegade is a stock "spaghetti Western" arrangement.
  - **Character abilities and life points.** They are stock (enhanced range or strength) and are "essentially rules of game play". Rose Doolan's longer attack range is likened to a chess rook's reach.
- *Protected but not copied:* Character names, appearances, colour schemes and setting.
- *Reasoning:* The court accepted Spry Fox's point that games can have protectable plot and character progression, using the Legend of Zelda as an example. But it put Bang! in a second category, alongside basketball: competitive, unscripted play with no fixed sequence of events. Any character can hold any role, so the character-role interactions "change from game to game". Under Nichols, underdeveloped characters get little protection. A player-expert's declaration was excluded, because similarity is judged on protectable elements only.
- *Note on method:* The court did not apply Altai by name. It used the Fifth Circuit's filter-then-compare approach (Nola Spice, Peel & Co.), which works the same way in practice.
- Source: https://www.govinfo.gov/content/pkg/USCOURTS-txsd-4_13-cv-03415/pdf/USCOURTS-txsd-4_13-cv-03415-1.pdf (the same opinion as the law.justia.com docket page, which returned 403)

#### PUBG Corp. v. NetEase, Inc., No. 4:18-cv-02010 (N.D. Cal.): battle royale "genre" clone suit, settled with no ruling (added)
- *Docket facts (CourtListener API metadata):* Filed 2 April 2018 and terminated 8 April 2019. Nature of suit: copyright.
- *Claims and arguments (⚠️ McArthur Law blog, read via the summarising fetch tool):*
  - PUBG claimed copyright infringement, unfair competition and trade dress infringement over NetEase's *Knives Out* and *Rules of Survival*, citing overall look, feel and audiovisual style.
  - NetEase moved to dismiss, arguing one company cannot monopolise the battle royale genre.
  - The case settled on confidential terms before any ruling on that motion or on the merits.
- *Takeaway:* It produced no precedent on whether a "genre" can be protected.
- Sources: https://smcarthurlaw.com/?p=1833 ⚠️; docket metadata from https://www.courtlistener.com/api/rest/v4/search/?q=docket_id:6354837&type=r

### 1.3 The doctrines in one place (US)
- **Idea/expression (§102(b), Baker):** rules, systems, methods of play and game concepts are free. Their particular artistic expression is protected.
- **Merger:** if an idea can be expressed in only one or a few ways, the expression is unprotected, or protected only against identical copying (Atari, Data East, Altai step 2(a)). Tetris says merger "is rare" and fails where designers had "almost unlimited" alternatives.
- **Scènes à faire:** stock or standard elements of a genre, or elements dictated by realism and hardware, are unprotected or "thin". Examples are the maze, scoreboard and dots (Atari), karate moves and referee (Data East), golf courses and wind meter (Incredible Technologies), points, coins and in-game stores (Spry Fox), and stock Western roles (DaVinci). Fanciful games get more protection than realistic simulations (Atari, Tetris).
- **Abstraction-filtration-comparison (Altai):** the dominant software test. Courts use it, or close equivalents like the Ninth Circuit's "analytic dissection" or the Fifth Circuit's filter-then-compare, to strip ideas, functional and efficiency-driven elements, externally dictated elements and public-domain matter before comparing.
- **Substantial similarity:** what remains is compared through the eyes of an ordinary observer, judging "total concept and feel" and focusing on similarities rather than differences (Atari, Data East, Tetris, Spry Fox).
- **Selection and arrangement:** an original selection and arrangement of unprotected elements can itself be protected (Spry Fox footnote 2). This is noted but has not been the decisive basis of a US game ruling in the sources I read.

---

## 2. Later notable game-clone decisions outside the US

### Korea: King.com v. Avocado Entertainment (*Farm Heroes Saga* v. *Forest Mania*)
⚠️ Everything here comes from secondary sources read through the summarising fetch tool. I did not open the judgments.
- *Seoul High Court, 12 January 2017, 2015Na2063761 (per JETRO's Japanese case summary ⚠️):*
  - Game rules are ideas, and scènes à faire excludes a similar "feel". Comparing element by element, the court found no copyright infringement.
  - The district court had found unfair competition under the Unfair Competition Prevention Act's general clause on misappropriating another's work product. The High Court reversed that: liability needs special circumstances (theft, breach of trust, intent to harm, or copying with no creative additions), and the defendant had independently developed many original elements.
- *Supreme Court of Korea, 27 June 2019 (per Newstomato, 1 July 2019 ⚠️, and the JETRO case history ⚠️):*
  - The Supreme Court reversed and remanded.
  - A game can have creative individuality protected as a whole through the selection, arrangement and combination of its components "according to the production intent and scenario", whether or not each element is creative alone.
  - The defendant kept that selection and arrangement, so the games were substantially similar, with only the characters differing.
  - The case went back to the Seoul High Court (2019Na2029356).
  - This is reported as the first Korean Supreme Court finding that copyright can reach a game clone's copied combination of rules.
- *Name discrepancy:* The task brief named the defendant's game "Farmery". The sources I read name it *Forest Mania*.
- *Sources:* https://www.jetro.go.jp/world/asia/kr/ip/case/2017/3bb7ad70d7d41964.html ⚠️; https://newstomato.com/ReadNews.aspx?no=905040 ⚠️

### Korea: Nexon v. Ironmace (*P3* project v. *Dark and Darker*)
⚠️ News reports only, read through the summarising fetch tool. I did not open any judgment.
- *Seoul Central District Court, February 2025:* No copyright infringement. Trade secret liability, with about 8.5 billion won in damages.
- *Appeals court:* Damages cut to 5.7 billion won because the trial court's figure rested on revenue estimates. Per JoongAng Daily, the appeals court also found unfair competition.
- *Supreme Court of Korea, 30 April 2026:*
  - It upheld the 5.7 billion won award for unauthorised acquisition and use of trade secrets: source code, graphic resources and internal data.
  - It agreed there was no copyright infringement, reasoning that Nexon's project was a battle royale game while *Dark and Darker* is an extraction game.
  - JoongAng Daily says it is unclear whether the Supreme Court addressed the unfair-competition finding. Ironmace's own statement says the court found no unfair use of Nexon's work product.
  - A criminal trade-secret case reportedly remains open.
- *Takeaway:* Former employees taking assets is where the money came from, not copyright in the game design.
- *Sources:* https://www.koreajoongangdaily.com/business/supreme-court-rules-in-favor-of-nexon-orders-dark-and-darker-developer-to-pay-38-million/12580996 ⚠️; https://www.invenglobal.com/articles/21470/ironmace-copyright-non-infringement-confirmed-will-prove-innocence-regarding-trade-secrets-in-criminal-trial ⚠️ (the latter is Ironmace's own characterisation)

### China: Blizzard and NetEase affiliate v. Unico (*Hearthstone* v. a Three Kingdoms-themed card game)
⚠️ The only source I reached was a Shanghai Daily digest on a Shanghai IP office page, and the fetch tool reported it as truncated. It says the Shanghai No. 1 Intermediate People's Court, announcing in November 2014, ordered Unico to stop selling the game and to pay compensation. It gives no reasoning, no amount, and does not say which claims succeeded. I could not verify what was held protectable. Source: https://touch.shio.gov.cn/jsp/zfxw_detail_en.jsp?id=735 ⚠️

---

## 3. EU and UK (brief)

**Infopaq International v. Danske Dagblades Forening, C-5/08 (CJEU 2009): the EU originality test.**
- Copyright under the InfoSoc Directive (2001/29) applies only to subject matter that is original "in the sense that it is its author's own intellectual creation" (para 37).
- Parts of a work are protected if they contain elements expressing that creation (para 39).
- Words in isolation are not protected. Creativity lies in "the choice, sequence and combination" of them (para 45).
- Source: http://publications.europa.eu/resource/celex/62008CJ0005 ⚠️ I read the summary and paras 33–48 only, not the rest of the judgment.

**SAS Institute v. World Programming Ltd, C-406/10 (CJEU Grand Chamber, 2 May 2012).**
- *Facts:* WPL rebuilt SAS's functionality, accepting SAS-language scripts and SAS data formats, by observing and testing SAS's program and reading its manuals. It never accessed SAS's source code.
- *Ruling 1:* Under the Software Directive, the functionality of a program, its programming language and its data file formats are not "a form of expression" of the program and are not protected (paras 39, 46). Protecting functionality "would amount to making it possible to monopolise ideas" (para 40). The Commission's explanatory memo is quoted: the Directive leaves others free to create "similar or even identical programs" provided they do not copy (para 41).
- *Caveats:*
  - Copying the actual source or object code behind those features could be partial reproduction (para 43).
  - The language or file formats might still be protected as works under the InfoSoc Directive if they are original (para 45).
- *Ruling 2:* A licensee may observe, study and test a program to find its underlying ideas, within the acts its licence permits, and a contract cannot take that right away (paras 59–62).
- *Ruling 3:* Copying elements described in a user manual (keywords, syntax, options, defaults) infringes the manual only if what is copied expresses the manual author's intellectual creation. Isolated words, figures and mathematical concepts are not (paras 66–70).
- Source: http://publications.europa.eu/resource/celex/62010CJ0406

**Nintendo v. PC Box, C-355/12 (CJEU, 23 January 2014): video games as "complex matter".**
- Video games "constitute complex matter comprising not only a computer program but also graphic and sound elements" (para 23).
- Those graphic and sound elements are protected, with the whole work, under the InfoSoc Directive and its "own intellectual creation" originality standard, not only under the Software Directive.
- Source: http://publications.europa.eu/resource/celex/62012CJ0355 ⚠️ I read paras 21–24 only (the rest concerns technological protection measures).

**Nova Productions Ltd v. Mazooma Games Ltd [2007] EWCA Civ 219 (Court of Appeal, 14 March 2007): the main UK game-clone case.**
- *Facts:* Nova's coin-operated pool game *Pocket Money* against *Jackpot Pool* and *Trick Shot*.
- *Trial findings:* Most features were commonplace, such as the pulsing power meter, aiming line and cue rotating round the ball. Only a few ideas, like synchronising the pulsing cue with the power meter, were "inspired" by Nova's game, and they were implemented very differently.
- *Artistic works:*
  - Individual screen frames are graphic works, but the defendants' frames were very different.
  - A *series* of frames is not an extra artistic work beyond the individual frames ("a series of stills is just that"). Moving images are protected only as films.
- *Literary works (the program):*
  - What was taken was ideas at too high a level to be a substantial part.
  - "An idea consisting of a combination of ideas is still just an idea."
  - Software Directive Art. 1(2) and TRIPS Art. 9(2) put ideas outside copyright. A written design specification is protected as text, but the functions it describes are not.
- *Policy:* Protecting such general ideas would make copyright "an instrument of oppression rather than the incentive for creation". Nova's counsel warned that, if the decision stood, games would have no protection against a rival who copies the rules but not the graphics. Lord Justice Jacob sided with the defendants instead: copyright must not stop works that are actually very different (paras 54–55).
- Source: https://caselaw.nationalarchives.gov.uk/ewca/civ/2007/219/data.xml (the same judgment as BAILII [2007] EWCA Civ 219, which blocked automated access)

**Navitaire Inc. v. easyJet Airline Co. [2004] EWHC 1725 (Ch) (Pumfrey J).**
- easyJet had a new booking system built to look and behave like Navitaire's, without access to its code. The main non-textual copying claim failed: a program's "business logic" and its overall functions are not protected through the program's literary copyright. Some on-screen "buttons" were held to infringe artistic copyright.
- The Court of Appeal in Nova endorsed this: making a program that emulates another, without copying its code or graphics, is legitimate (Nova para 52).
- ⚠️ All of this comes from the extracts and summary quoted in *Nova* (paras 45–52). I downloaded Navitaire itself (https://caselaw.nationalarchives.gov.uk/ewhc/ch/2004/1725/data.xml) but did not read it.

**UK originality today.** ⚠️ Not researched. Nova (2007) predates Infopaq and frames the question as "substantial part" and skill and effort. I did not open a source on how UK courts state originality now, after Infopaq and after Brexit, so I make no claim about it.

**An EU-level game-clone decision.** I did not find one. The closest CJEU authorities are SAS (functionality is not protected) and Nintendo v. PC Box (game audiovisual elements are protected). This is a gap in what I searched, not proof that no national EU court has ruled on a game clone.

### 3.1 Beyond copyright: trade dress, passing off and unfair competition

- **US trade dress (Lanham Act §43(a)).** The test is non-functional plus distinctive (secondary meaning) plus likely confusion.
  - *Tetris* won here: piece colours and style and the board proportions were non-functional "arbitrary flourishes", and the claim was about confusing packaging and advertising.
  - *Incredible Technologies* lost: the control panel and trackball were functional.
  - *Spry Fox* shows the limit. Trademark similarity is a "starkly different standard", and a buyer who sees a knockoff may still know it comes from a different company.
  - *Atari* footnote 78: state unfair competition law can require clear labelling of a visually similar product. Marketing it as "Odyssey's PAC-MAN" differs from saying it is "like PAC-MAN".
- **UK passing off.** *Moroccanoil Israel v. Aldi* [2014] EWHC 1686 (IPEC), HHJ Hacon, 29 May 2014:
  - A lookalike that merely brings the original "to mind" is not a misrepresentation. The claimant must show the public is likely to think the products are the same, or come from the same maker or a licensee.
  - Get-up cases rarely succeed when the brand names differ, Jif Lemon being one of the few exceptions. The action was dismissed.
  - Source: https://caselaw.nationalarchives.gov.uk/ewhc/ipec/2014/1686/data.xml ⚠️ I read the opening, paras 30–35 ("bringing to mind" and "living dangerously") and the conclusion only.
- **Germany: §4 Nr. 3 UWG (supplementary protection against imitation).**
  - *The statute:* It is unfair to offer goods or services that imitate a competitor's when one of three things is true: (a) it causes avoidable deception about commercial origin; (b) it unfairly exploits or damages the original's reputation; or (c) the knowledge or documents needed for the imitation were obtained dishonestly. Source: https://www.gesetze-im-internet.de/uwg_2004/__4.html
  - *Case law, via a HÄRTING law-firm note ⚠️ on OLG Hamburg, 6 February 2025, 15 U 43/24, a jewellery case (not a game):*
    - The original must have "competitive individuality" (wettbewerbliche Eigenart, roughly a distinctive character that signals origin or quality).
    - Individuality, the closeness of the copy and the special circumstances are weighed together.
    - A basic idea is free; only its concrete realisation is protected.
    - Average individuality plus a merely similar, not near-identical, copy failed.
    - Source: https://haerting.de/en/insights/no-unfair-imitation-of-dice-chains/ ⚠️
  - *Why it matters for games:* Lit. (c) can reach a clone built from information obtained dishonestly, such as confidential builds or design documents. That echoes the Spry Fox NDA facts and Ironmace.
- **The German "Bauhaus" doctrine named in the brief.** I found no German doctrine or case by that name tied to game or software imitation. The relevant German concept is the supplementary protection against imitation in §4 Nr. 3 UWG above. I did not research the separate German copyright case law on Bauhaus furniture and applied art, and I make no claim about it.

---

## 4. Synthesis: what got developers in trouble and what got through

In the decisions I read, developers lost when they reproduced concrete, chosen expression, and above all when they took a lot of it at once:
- In Tetris, the near-identical screen and piece design, the exact board dimensions and a set of visual flourishes produced a look "akin to literal copying", plus trade dress liability for confusing packaging.
- In Atari, the fanciful characters, with their shapes, animations and death and regeneration sequences, carried the case.
- In Spry Fox, the specific themed progression ladder, the antagonist and setting, the near-paraphrased tutorial text and even a giveaway title survived a motion to dismiss.
- In Capcom, a few fanciful special moves and three characters were protectable but not enough.
- Abroad, Korea's Supreme Court let a copied combination of rules and components count as substantial similarity (King, 2019). The large damages awards came through trade secrets and unfair competition where people walked out with source code and assets (Ironmace), not through copyright in the design.

What courts consistently let through:
- **Rules, mechanics and win conditions:** DaVinci, with "nearly identical" rules; Nova; SAS on functionality; Galoob.
- **Genre structure and stock devices:** mazes, scoreboards, points, coins, shops, health bars, menus and versus screens (Atari, Spry Fox, Capcom).
- **Realistic subject matter:** karate, golf (Data East, Incredible Technologies).
- **Stock role alignments:** DaVinci.
- **Functional choices:** grid size, store pricing, control schemes (Spry Fox, Incredible Technologies).
- **Emulating behaviour without copying code or graphics:** Navitaire, Nova, SAS.
- **Ideas of eras, progression and genre:** the PUBG–NetEase dispute over the battle royale genre settled with no ruling, and Korea's Supreme Court treated battle royale versus extraction as a reason for no copyright infringement.

Two warnings cut across all of this:
- **Thin protection can still be infringed by near-verbatim copying.** Thin rule-text and scènes à faire elements are still protected against near-identical copies.
- **Access through a confidential relationship changes the picture.** It makes copying easy to prove (Spry Fox's NDA, Data East's design document citing Street Fighter II 22 times) and opens trade secret and unfair competition claims that do not depend on the idea/expression line at all (Altai's remand, Ironmace, UWG §4 Nr. 3(c)).

### Application notes for AI Lab Tycoon
These are my inferences from the cases above, not findings of any court.
- **Low risk:** The *ideas* openly borrowed from Game Dev Tycoon sit on the free side of the line in every jurisdiction above. That covers starting in a garage, moving offices across eras, picking topic and setting combinations, a team building a product, and release with review scores.
- **Where the risk lies:** Any one-to-one mirror of Game Dev Tycoon's *concrete* expression. That means its exact progression ladder of named stages, its screen layouts and UI art, its specific numbers presented the same way, or its tutorial, review or event text. Spry Fox and Tetris are the warning cases.
- **Korea specifically:** The King decision means a near-identical *combination* of components, even with a re-theme, carries more risk there than in the US, UK or EU.
- **Marketing:** Saying "inspired by Game Dev Tycoon" is comparative, and Atari footnote 78 suggests that is tolerated. Anything suggesting the game is a Greenheart product or an official sequel, by name, logo, store art or screenshots styled to match, is the trade dress and passing off exposure.

---

## Coverage statement

**Primary sources read in full, end to end, from raw text:**
1. https://static.case.law/f-supp-2d/863/cases/0394-01.json (Tetris v. Xio, 2012)
2. https://static.case.law/f2d/862/cases/0204-01.json (Data East v. Epyx, 1988)
3. https://static.case.law/f2d/672/cases/0607-01.json (Atari v. North American Philips, 1982)
4. https://static.case.law/f2d/964/cases/0965-01.json (Lewis Galoob v. Nintendo, 1992)
5. https://static.case.law/f2d/982/cases/0693-01.json (Computer Associates v. Altai, 1992; majority and the two-sentence partial dissent)
6. https://static.case.law/us/101/cases/0099-01.json (Baker v. Selden)
7. https://static.case.law/f3d/400/cases/1007-01.json (Incredible Technologies v. Virtual Technologies, 2005)
8. https://www.govinfo.gov/content/pkg/USCOURTS-txsd-4_13-cv-03415/pdf/USCOURTS-txsd-4_13-cv-03415-1.pdf (DaVinci v. Ziko, Memorandum and Opinion of 27 April 2016)
9. https://storage.courtlistener.com/recap/gov.uscourts.wawd.181650.24.0.pdf (Spry Fox v. LOLApps, Order of 18 September 2012)
10. https://caselaw.nationalarchives.gov.uk/ewca/civ/2007/219/data.xml (Nova v. Mazooma, 2007, including the legislation appendix)
11. http://publications.europa.eu/resource/celex/62010CJ0406 (SAS Institute v. WPL, C-406/10)
12. https://www.gesetze-im-internet.de/uwg_2004/__4.html (§4 UWG)

**Read in part (⚠️):**
- https://www.law.cornell.edu/uscode/text/17/102 ⚠️: I read the full statutory text of §102(a) and (b). I read only the start of the House Report notes below it.
- http://publications.europa.eu/resource/celex/62008CJ0005 (Infopaq) ⚠️: I read the case summary and paras 33–48 only. The facts, the other questions and the operative part were not read.
- http://publications.europa.eu/resource/celex/62012CJ0355 (Nintendo v. PC Box) ⚠️: I read paras 21–24 only.
- https://caselaw.nationalarchives.gov.uk/ewhc/ipec/2014/1686/data.xml (Moroccanoil v. Aldi) ⚠️: I read the header, paras 1–2 and 30–35, and the conclusion passages found by keyword search. The goodwill and evidence sections were not read.
- https://caselaw.nationalarchives.gov.uk/ewhc/ch/2004/1725/data.xml (Navitaire v. easyJet) ⚠️: downloaded but not read. Every claim about Navitaire rests on the extracts quoted in Nova.
- https://www.govinfo.gov/content/pkg/USCOURTS-txsd-4_13-cv-03415/pdf/USCOURTS-txsd-4_13-cv-03415-0.pdf (DaVinci 2014 motion-to-dismiss opinion) ⚠️: downloaded, and only the caption and heading seen. Its holdings are cited only as the 2016 opinion describes them.
- https://www.govinfo.gov/content/pkg/USCOURTS-txsd-4_13-cv-03415/pdf/USCOURTS-txsd-4_13-cv-03415-2.pdf (DaVinci final judgment, 1 page) ⚠️: only the caption seen. Not relied on.
- Secondary sources read only through the summarising fetch tool, so the raw text was never seen (⚠️ on every claim that rests on them):
  - https://patentarcade.com/2005/08/case-capcom-v-data-east-nd-cal-1994-c.html (Capcom brief; the tool reported it complete)
  - https://smcarthurlaw.com/?p=1833 (PUBG v. NetEase; reported complete)
  - https://www.pocketgamer.biz/spry-foxs-triple-town-triumph-sees-studio-pick-up-yeti-town-ip/ (reported complete)
  - https://newstomato.com/ReadNews.aspx?no=905040 (Korean Supreme Court, King; reported complete)
  - https://www.jetro.go.jp/world/asia/kr/ip/case/2017/3bb7ad70d7d41964.html (Seoul High Court, King; reported complete)
  - https://www.koreajoongangdaily.com/business/supreme-court-rules-in-favor-of-nexon-orders-dark-and-darker-developer-to-pay-38-million/12580996 (reported complete)
  - https://www.invenglobal.com/articles/21470/ironmace-copyright-non-infringement-confirmed-will-prove-innocence-regarding-trade-secrets-in-criminal-trial (reported complete; a party statement)
  - https://haerting.de/en/insights/no-unfair-imitation-of-dice-chains/ (reported complete except the final sentence)
  - https://touch.shio.gov.cn/jsp/zfxw_detail_en.jsp?id=735 (the tool reported it **truncated**)
- Data, not documents: https://www.courtlistener.com/api/rest/v4/search/ queries (docket metadata for Spry Fox, DaVinci and PUBG v. NetEase); the static.case.law `CasesMetadata.json` and `ReportersMetadata.json` index files.

**Could not reach:**
- https://www.courtlistener.com/opinion/8715588/tetris-holding-llc-v-xio-interactive-inc/: an empty page, from both curl and the fetch tool. The same opinion was read via static.case.law.
- https://law.justia.com/cases/federal/district-courts/texas/txsdce/4:2013cv03415/1134359/74: HTTP 403. The same documents were read via GovInfo.
- https://www.bailii.org/ew/cases/EWCA/Civ/2007/219.html and https://www.bailii.org/ew/cases/EWHC/Ch/2004/3487.html: an anti-bot proof-of-work wall. Nova was read via the National Archives instead.
- https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62010CJ0406 (and the same for 62008CJ0005 and 62012CJ0355): HTTP 202 with an empty body, which is bot protection. The judgments were read via publications.europa.eu instead.
- https://curia.europa.eu/juris/document/document.jsf?docid=122362 (and docid 72482 and 146686): a redirect to infocuria, and an empty page by curl.
- https://www.govinfo.gov/content/pkg/USCOURTS-wawd-2_12-cv-00147/… (all four variants tried): HTML error pages, not PDFs.
- https://legal500.com/developments/?p=20912 (Lee & Ko note on King v. Avocado): HTTP 404.
- **Capcom v. Data East, 1994 WL 1751482:** the opinion itself (Westlaw only) was not reached.
- **The Korean judgments in King v. Avocado and Nexon v. Ironmace, and the Shanghai Hearthstone judgment:** not reached. All claims about them are second-hand.
- **Not researched:** current UK originality case law, and the German "Bauhaus" doctrine named in the brief (no such game-related doctrine was found).

Search-result snippets (Wikipedia, Quimbee and other listings) were seen during searching but are not cited for any claim.
