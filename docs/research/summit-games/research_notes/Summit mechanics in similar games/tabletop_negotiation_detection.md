# Tabletop negotiation, voting, non-binding deals, betrayal, and cheat-detection mechanics

## Twilight Imperium 4 agenda phase: voting with influence, riders/promissory notes, binding vs non-binding deals

### Takeaway
TI4's Agenda Phase is a formal legislature bolted onto a negotiation game: players spend a resource (planet "influence," exhausted like currency) to vote on pre-scripted outcomes, laws persist as permanent rule changes while directives are one-shot, and separately the game has an explicit binding/non-binding split for private deals, with promissory notes acting as the one enforceable commitment device. This maps well onto a summit where votes are cheap talk unless backed by a tangible token that survives the vote.

### Cited Findings
- The Speaker draws one agenda card and reads it aloud with all its possible outcomes; players vote in turn order starting left of the Speaker — [Agenda Phase | Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Agenda_Phase)
- To vote, a player exhausts any number of planets; each planet contributes votes equal to its influence value, trade goods cannot be spent to vote, and a player may abstain — [Agenda Phase | Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Agenda_Phase)
- "Each player may negotiate up to one transaction with each other player while resolving the vote for each agenda" — i.e., side-deals are capped per-agenda, per-pair, forcing players to prioritize whom to bribe — [Galactic Council | UltraBoardGames](https://www.ultraboardgames.com/twilight-imperium/galactic-council.php)
- If outcomes tie, the Speaker alone decides which tied outcome resolves — a built-in tie-break that hands one player outsized power — [Agenda Phase | Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Agenda_Phase); confirmed independently at [Galactic Council | UltraBoardGames](https://www.ultraboardgames.com/twilight-imperium/galactic-council.php)
- Two agendas are resolved per round, back to back, then planets ready — [Galactic Council | UltraBoardGames](https://www.ultraboardgames.com/twilight-imperium/galactic-council.php)
- Laws that pass become "a permanent part of the game," while directives resolve once and are discarded — the game's own binding/non-binding distinction is baked into agenda *type*, not just player promises — [Galactic Council | UltraBoardGames](https://www.ultraboardgames.com/twilight-imperium/galactic-council.php)
- Separately, general deals in TI4 are explicitly typed: "Deals are either binding or non-binding. If the terms of a deal cannot be resolved immediately, it is a non-binding deal. When a deal is non-binding, a player does not have to adhere to any part of the agreement" — [Transactions & Deals | Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Transactions_%26_Deals) (search-snippet only, page itself returned HTTP 402 on fetch)
- Promissory notes are the enforceable instrument: each player starts with generic notes matching their color plus one unique faction note, and trading one to another player is a resolvable, immediate transaction (unlike a bare verbal promise) — [Promissory Notes | Twilight Imperium Wiki](https://twilight-imperium.fandom.com/wiki/Promissory_Notes) (search-snippet only, not fetched)
- "Riders" (an Action Card or Promissory Note, e.g. the *Political Secret* note) can be attached to an agenda immediately after it's revealed and played during that same agenda's "after an agenda is revealed" step, letting a player buy an extra effect tied to that specific vote; if the agenda itself is discarded (e.g., by a Veto), any played Political Secret is returned and its restriction lifted — [BGG thread: Using Promissory Notes](https://boardgamegeek.com/thread/750441/using-promissory-notes) (search-snippet only)

### Inferences
- The influence-as-currency vote mirrors "monitoring level" as a spendable stake: a summit could let each party commit a scarce resource (budget, political capital) to a monitoring-level vote, so voting for stricter monitoring is materially costly, not just a stance.
- The binding-vs-non-binding split (law/directive; promissory note/verbal promise) is a directly portable pattern: let the player and each AI party exchange a small number of "binding tokens" (like promissory notes) during the summit's negotiation step; only commitments backed by a token are enforced by the simulation, everything else is flavor-text cheap talk that can be broken without mechanical penalty (though possibly with a reputation cost).
- The per-agenda, per-pair transaction cap ("one transaction per pair per agenda") is a good tension device for a 6-party summit: it forces the player to choose only 1-2 parties to actively bargain with per topic rather than lobbying everyone at once, which fits a short single-player session.
- The rider mechanic (an extra card played only in reaction to the specific agenda just revealed) suggests a "conditional rider" for the summit: a party could attach a secret condition to its vote on the monitoring level (e.g., "I only vote for high monitoring if the player also commits fewer compute-limit clauses"), revealed only when triggered.

### Gaps
- I could not fetch the Fandom wiki pages for "Transactions & Deals" or "Promissory Notes" directly (HTTP 402 on both) or the Agenda Phase page itself (HTTP 402); all TI4 claims above beyond the UltraBoardGames fetch are ⚠️ based on WebSearch-generated snippets of those pages, not a full read of the source page.
- Whether TI4 has any formal mechanic for *punishing* a broken non-binding deal (reputation, retaliation) is not established by the sources found; TI4 seems to rely entirely on social consequences at the table, not a rule.

## Diplomacy, Cosmic Encounter, A Game of Thrones board game, Rex: simultaneous orders, alliances/deals, betrayal reveal

### Takeaway
These four games share a structure useful for a summit: negotiate freely and privately, then commit written or card-based orders that resolve simultaneously, so betrayal is discovered only at reveal, not during the talking. Cosmic Encounter additionally has an explicit rule that spoken promises are non-binding and only a physically transferred token or card is real; Rex adds a hidden-traitor variant on top.
### Cited Findings
- In Diplomacy, players secretly negotiate, then "write orders for their military units, and then reveal those orders simultaneously" with no dice; negotiation phases before each move are the game's defining feature, and alliances are "formed and betrayed" throughout — [The Game of Diplomacy, Wikipedia](https://en.wikipedia.org/wiki/The_Game_of_Diplomacy); [Diplomacy Rules, officialgamerules.org](https://officialgamerules.org/game-rules/diplomacy/)
- Support orders decide contested spaces: "If two pieces move to the same space but one of those pieces has support from a third piece, the piece with support will win" — meaning a promised support order can simply not be written, and the betrayal is invisible until the simultaneous reveal — [Diplomacy Rules, officialgamerules.org](https://officialgamerules.org/game-rules/diplomacy/)
- In Cosmic Encounter, allies can be invited into an encounter and commit ships to it, but if both main players play a Negotiate card, allied ships are returned and the two main players get one minute to strike a private deal — [Ally / Negotiate card, Cosmic Encounter Wiki](https://cosmicencounter.fandom.com/wiki/Negotiate_card) (search-snippet)
- Cosmic Encounter's deal rule explicitly separates binding from non-binding content: "Players may also offer promises and other non-tangible things, but such actions are never binding and are not considered part of the deal — there must be at least one granted colony or traded card for a deal to be successful"; failing to reach a deal in the time limit costs both main players three ships to the warp — [Negotiate card, Cosmic Encounter Wiki](https://cosmicencounter.fandom.com/wiki/Negotiate_card) (search-snippet)
- In A Game of Thrones: The Board Game, the "Messenger Raven" token — held by whoever leads the King's Court influence track — lets its holder change one already-placed, face-down order to an unused order after all orders are revealed, i.e. a limited, trackable way to punish or dodge a betrayal after the simultaneous reveal — [Messenger Raven, Fantasy Flight Games](https://www.fantasyflightgames.com/en/news/2019/4/3/messenger-raven/) (search-snippet)
- Rex: Final Days of an Empire layers a hidden-traitor mechanic onto alliance play: "one or more of your Leaders may secretly be in the employ of an enemy, and if your forces in combat are commanded by such a traitor, defeat is all but assured" — betrayal here is a hidden unit-level property, not just a broken promise — [Rex: Final Days of an Empire, There Will Be Games / BGG description](https://boardgamegeek.com/boardgame/104363/rex-final-days-of-an-empire) (search-snippet)

### Inferences
- The simultaneous-order pattern (negotiate freely → commit secretly → reveal together) is a strong fit for the pacing summit's "afterwards any party may secretly break the deal" design: model each party's post-summit compliance as a hidden order chosen at the same moment the deal is struck, resolved later, rather than as something decided live — this keeps the betrayal genuinely secret from the player until a detection check runs.
- Cosmic Encounter's rule that spoken promises are "never binding" and only a tangible transfer counts is the cleanest one-line justification for why the summit's monitoring/verification clauses need to be an explicit mechanical commitment (a monitoring level chosen and locked in) rather than just narrative dialogue options.
- The Game of Thrones Raven — a single scarce "revise your order after seeing everyone else's" token — is a good model for a limited "renegotiate" ability the player could earn (e.g., from high standing with one lab) to adjust their own compliance after seeing initial reactions, without giving it to everyone.

### Gaps
- I did not find a citable primary source (rulebook or wiki) describing Rex's hidden-traitor mechanic's exact detection/reveal timing (when a traitor's employer is disclosed); the finding above is a general description only. ⚠️ Based on search snippets, not a full rulebook read.
- I searched for a Diplomacy variant with formal, rule-based cheating verification (e.g., a moderator-enforced anti-collusion mechanic) and found nothing citable — search results returned only generic "sites detect cheating" commentary and an unrelated video game. This is a genuine gap, not just an unread source.

## Sheriff of Nottingham, Coup, Love Letter: inspection cost, bluff and challenge

### Takeaway
Sheriff of Nottingham is the closest existing mechanic to "inspection whose trigger is a deliberate spend decision with real downside for guessing wrong," which is exactly the shape needed for a monitoring-catches-everyone system. Coup and Love Letter contribute the "claim now, prove only if challenged" bluff/reveal structure that keeps hidden information cheap to bluff about until someone spends a resource to check it.

### Cited Findings
- In Sheriff of Nottindham, the merchant declares one good type and an exact count and may lie (only "Legal Goods" may legally be declared as the goods type); the Sheriff then chooses, bag by bag and in any order, to let it pass or inspect it, and may inspect none, some, or all bags — [Sheriff of Nottingham rules, UltraBoardGames](https://www.ultraboardgames.com/sheriff-of-nottingham/game-rules.php)
- If a merchant told the truth and gets inspected anyway, the Sheriff must pay the merchant Gold equal to the penalty value printed on each Legal Good card — i.e., wrongly inspecting has a fixed, priced cost to the inspector, not just wasted time — [Sheriff of Nottingham rules, UltraBoardGames](https://www.ultraboardgames.com/sheriff-of-nottingham/game-rules.php)
- If the bag doesn't match the declaration, truthfully declared goods go to the merchant's stand, undeclared goods are confiscated, and the merchant pays the Sheriff fines equal to each confiscated card's penalty value — so both sides face a symmetric, card-printed price for being wrong — [Sheriff of Nottingham rules, UltraBoardGames](https://www.ultraboardgames.com/sheriff-of-nottingham/game-rules.php)
- Before deciding, the Sheriff may solicit or entertain a bribe (Gold, goods, or "future favors"); accepting a bribe means letting the bag pass without inspecting, and "agreements are binding except for future promises and goods not actually in the bag" — future favors are explicitly unenforceable, only goods physically in hand at the table are enforceable — [Sheriff of Nottingham rules, UltraBoardGames](https://www.ultraboardgames.com/sheriff-of-nottingham/game-rules.php)
- In Coup, a player claiming a character's power does not have to reveal any card unless challenged; if challenged and unable to prove the claim, they lose an influence card automatically, but if the challenge is wrong the *challenger* loses a card instead — challenging is a costed, risky act of "inspection," not a free look — [Coup rules summary via search](https://gamerules.com/rules/coup/) (search-snippet); consistent with [Coup (card game), Wikipedia](https://en.wikipedia.org/wiki/Coup_(card_game))
- In Love Letter, each turn a player holds two cards, plays one face-up (publicly declaring commitment to that action) and keeps one hidden; because the full deck composition is public knowledge, every played card narrows what opponents can infer is still in hand — bluffing here is entirely about *information leakage from forced disclosure*, not an inspect/accuse action — [Love Letter card game, various rules summaries](https://officialgamerules.org/game-rules/love-letter/) (search-snippet)

### Inferences
- Sheriff of Nottingham's symmetric penalty-value system (a truthful merchant wrongly inspected costs the Sheriff; a caught liar costs the merchant) is a strong direct model for "monitoring also catches the player": build the summit's detection check as a single roll/table that can embarrass either side — a party that invests in monitoring and inspects a compliant actor should pay some cost (wasted trust, diplomatic friction), mirroring the Sheriff's fixed penalty for a wrong inspection, not just be free vigilance.
Coup's "claim now, pay only if disproven" pattern suggests the summit's compliance claims (e.g., "I did not build the weapon") should default to being taken at face value and only tested against the hidden truth by a detection roll gated on the agreed monitoring level, exactly like a challenge that costs the challenger something (diplomatic capital, an accusation that damages relations if wrong) if it turns out unfounded.
- Bribery in Sheriff of Nottingham being split into "binding if physically transferred now, non-binding if a future favor" is the same binding/non-binding split seen in TI4 and Cosmic Encounter — three independent games converge on this rule, which is good evidence it's a robust pattern worth reusing for the summit's side-deals.

### Gaps
- I did not verify the exact printed Gold values used for Sheriff of Nottingham's penalties (they vary per good), only that the mechanic exists; the report can note the structural rule but not exact numbers. ⚠️ Not a full rulebook read — the official rules PDF returned HTTP 403 and the Fandom-hosted alternative required payment (402); findings rely on the UltraBoardGames rules page, which was fetched in full.
- Love Letter's bluffing claim is based on general secondary descriptions, not a full rulebook read (the PDF rulebook link was found but not fetched). ⚠️

## Secret Hitler, The Resistance, Werewolf: hidden defectors and investigation powers

### Takeaway
All three games solve "some players are secretly working against the group" with an information-asymmetric power (investigate/night-kill/seer-vision) that is scarce, one-shot or once-per-player, and whose result can be lied about by whoever receives it — meaning detection is never fully reliable even when it fires.

### Cited Findings
- In Secret Hitler, the President chooses one player per use of the power to investigate; that player privately hands over their Party Membership card (not their Secret Role card) for the President alone to see, and "no player may be investigated twice in the same game" — investigation is capped, one-shot per target, and the investigator can freely lie about what they saw — [Secret Hitler rules PDF (via search summary)](https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf) (search-snippet)
- Because a Party Membership card only shows Liberal/Fascist and not the Hitler special role, even a truthful investigation result is ambiguous about whether the investigated Fascist is the leader — imperfect detection is built into what the check can even reveal — [Secret Hitler rules summary](https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf) (search-snippet)
- In The Resistance, roughly one-third of players are secretly Spies who know each other, while the Resistance only knows the *count* of spies, not identities; each round a leader proposes a team, the group votes to approve it, and the mission then succeeds only if every team member submitted a Success card (fails are anonymous among the team) — [The Resistance (game), Wikipedia](https://en.wikipedia.org/wiki/The_Resistance_(game)) (search-snippet); consistent with the official rules PDF title/content found at [gamers-hq.de rules PDF](https://gamers-hq.de/media/pdf/78/dd/0a/The_Resisance_consolidated_rules_v1-1.pdf) (not fetched)
- Spies additionally win outright if five consecutive team votes fail, giving a second win condition tied to *social* failure to cooperate, not just sabotage — [The Resistance (game), Wikipedia](https://en.wikipedia.org/wiki/The_Resistance_(game)) (search-snippet)
- In Werewolf, the Seer wakes each night and points at one player; the moderator silently confirms or denies werewolf status, but the Seer must then decide whether and how to disclose this to the group without revealing themselves as the Seer (since Seers are the Werolves' priority kill) — detection exists but sharing it is itself risky — [The Seer, Werewolf Wiki](https://werewolf.chat/Seer) (search-snippet)
- Some Werewolf variants deliberately corrupt the Seer's information: cursed villagers register as wolves, and a "Lycan" reads as a werewolf without being one — turning a Seer's "check" into a probabilistic report rather than ground truth — [Aura/Apprentice Seer, Gridbeast](https://gridbeast.gg/ultimate-werewolf-aura-seer/) (search-snippet)

### Inferences
- The "once per player, capped total uses" investigation budget (Secret Hitler) is a good model for a scarce, spend-it-wisely detection resource in the summit if the player is ever given an active "investigate a lab" action rather than a passive monitoring-level dial.
- The Resistance's core insight — the *result* of cooperation (mission success/fail) is public, but *who* caused the failure among the team stays hidden unless someone confesses or is caught by a separate mechanism — is directly analogous to "a break in the deal is detected as an event, but attribution to a specific party depends on the monitoring level," suggesting the summit could split "was there a break" (loud, monitoring-independent) from "who broke it" (quiet, monitoring-dependent) as two separate probabilities.
- Werewolf's corrupted-Seer variant (a check that sometimes lies) is a good precedent for making the detection roll noisy even at high monitoring — supports building in a nonzero false-negative (and optionally false-positive) rate rather than a hard threshold, echoing the inspection-game literature below.

### Gaps
- None of the three official rulebooks were fetched in full (Secret Hitler and The Resistance PDFs were found via search but not opened; Werewolf has no single canonical rulebook since it's a folk game with many published variants). ⚠️ All claims in this section rely on WebSearch-generated summaries of these pages/PDFs, not a full read of the documents themselves.

## Twilight Struggle, Pax Pamir, John Company, Root, Diplomacy verification: arms race, coalitions, loyalty

### Takeaway
Twilight Struggle's DEFCON track is the clearest existing "arms-race tension dial" model — a shared, visible number both sides push around that can end the game outright if it hits bottom. Pax Pamir's loyalty/coalition system shows how switching sides can be made costly (you lose accumulated investment), which is a useful betrayal-deterrent pattern distinct from detection. John Company's coalition mechanics and Root's or Diplomacy's formal verification tools were not found with citable specificity in the time available.

### Cited Findings
- DEFCON starts at 5 (peace) and only ever moves down via events/coups or back up (never above 5); reaching DEFCON 1 ends the game immediately in a loss for whichever player's action caused the drop — a shared, visible escalation track with an instant-loss floor — [Twilight Struggle Wikipedia summary via search](https://en.wikipedia.org/wiki/Twilight_Struggle) (search-snippet); consistent across multiple sources including [GMT Games rules PDF listing](https://www.gmtgames.com/nnts/TS_Rules-2015.pdf) (not fetched)
- A coup attempt against a battleground country reduces DEFCON by one each time, and players lose victory points each turn if they don't conduct military operations at least equal to the current DEFCON level — meaning both de-escalation avoidance and forced continued "activity" are baked into the same track — [Twilight Struggle DEFCON summary via search](https://twilightstrategy.com/2011/12/12/general-strategy-defcon/) (search-snippet)
- In Pax Pamir, a player's coalition loyalty (British/Russian/Afghan) is measured by an influence total (patriots in court + prizes + gifts); switching to a different coalition requires gaining an influence point tied to that new coalition, but doing so forces the player to lose all gifts, prizes, and associated patriots accumulated under the old loyalty — switching sides has a real, mechanical sunk-cost penalty — [Pax Pamir loyalty mechanic, UltraBoardGames](https://www.ultraboardgames.com/pax-pamir/game-elements.php) (search-snippet)
- Victory points in Pax Pamir are awarded at "Dominance Checks": if one coalition is dominant, loyal players score by influence; if no coalition dominates, all players instead score by board presence — coalition payoff is conditional and can flip based on the collective outcome, not just individual loyalty — [Pax Pamir, UltraBoardGames](https://www.ultraboardgames.com/pax-pamir/game-elements.php) (search-snippet)
- John Company is described as a game where "it is difficult to do anything alone, and players will often need to negotiate with one another, with most everything being up for negotiation," but no source found gave a specific, citable coalition-formation rule (e.g., how a coalition is declared, what binds its members) — [John Company (board game) description](https://boardgamegeek.com/boardgame/211716/john-company) (search-snippet, general only)

### Inferences
- DEFCON is the single best transferable pattern for the summit's overall tension: a shared, visible "trust/tension" track that both the player's compliance and each lab/government's compliance push, where hitting the floor ends the summit's cooperative frame outright, gives the player a legible reason to care about the aggregate effect of the deal even before any individual break is detected.
- Pax Pamir's "switching sides costs your accumulated investment" is a good design lever distinct from detection probability: even if a break is *never caught*, a party that abandons the deal could forfeit accumulated benefits from having been compliant (an intrinsic, detection-independent cost of defection), giving the summit two separate levers — being caught, and losing sunk cooperative value — rather than relying on detection alone to deter betrayal.

### Gaps
- Root and Diplomacy-with-formal-verification-variants yielded no citable, specific mechanic in the searches run; Root's base game has no hidden-traitor or verification subsystem I could confirm from any source opened in this research pass, so I am treating this as an open gap rather than asserting Root has nothing relevant — I did not exhaustively search for Root's various third-party or Underworld-expansion hidden-agenda mechanics. ⚠️ Root was not directly searched at all due to time budget; this is a gap, not a checked absence.
- John Company's specific coalition-formation and binding rules were not found with citable specificity; only a general "negotiation is central" description was available. ⚠️
- No rulebook in this section (Twilight Struggle, Pax Pamir, John Company) was fetched in full; all findings are WebSearch-summary based. ⚠️

## Game-theory inspection games and arms-control verification models

### Takeaway
The academic "inspection game" literature (Rudolf Avenhaus and collaborators) models exactly the summit's core problem — an inspector deciding how much to check, an inspectee deciding whether to violate, detection probability tied to inspection effort — and treats deterrence as an equilibrium property: a rational inspectee complies specifically because expected detection makes violation not worth it, not because detection is certain.

### Cited Findings
- An inspection game is defined as "a mathematical model of a situation in which an inspector verifies the adherence of an inspectee to some legal obligation, such as an arms control treaty, where the inspectee may have an interest in violating that obligation," analyzed as a non-cooperative two-player game between inspector and inspectee — [Inspection games in arms control, Semantic Scholar listing of Avenhaus & Canty](https://www.semanticscholar.org/paper/Inspection-games-in-arms-control-Avenhaus-Canty/46d6b133757ff5423d7894f09f5f5c1011914a89) (search-snippet)
- The field's historical development moved through three phases tied to real treaties: 1961-1968 nuclear test ban verification (game-theoretic emphasis), 1968-1985 Non-Proliferation Treaty era (material-accountancy verification), and 1985-present shaped by INF, CFE, and the Chemical Weapons Convention — [Inspection games, EconPapers/RePEc summary](https://econpapers.repec.org/RePEc:eee:gamchp:3-51) (search-snippet)
- Deterrence in these models is achieved via a Nash equilibrium in which the inspectee's rational best response is to behave legally, given the inspector's chosen (and often mixed/randomized) inspection strategy — [search summary of Avenhaus/von Stengel/Zamir inspection game literature](http://www.maths.lse.ac.uk/personal/stengel/TEXTE/insp.pdf) (link found but the fetch failed with an SSL error; claim is from the WebSearch summary of this and related sources, not the PDF text directly)
- Detection probability can be computed for a given inspector/proliferator strategy pair and then weighted by the quantity and quality of diverted material to produce a scenario payoff — i.e., these models don't just ask "caught or not" but "caught early enough, with how much material" — [A Game Theoretic Approach to Nuclear Safeguards Selection, Science & Global Security summary](https://scienceandglobalsecurity.org/archive/2016/01/a_game_theoretic_approach_to_n.html) (search-snippet)
- A concrete numeric finding cited in the literature: "a quota of 5 inspections will approximately double the actual chance of finding a clandestine test," and is argued to contribute more than a doubling to deterrence once psychological (over and above purely statistical) effects on the would-be violator are included — [search summary, likely drawing on Avenhaus-era nuclear test ban analysis](http://www.maths.lse.ac.uk/personal/stengel/TEXTE/insp.pdf) (⚠️ this is a WebSearch-generated summary claim; I could not open the underlying PDF to confirm wording or exact context — the fetch attempt returned an SSL/TLS error, and a second attempt at the Wikipedia "Inspection game" article returned HTTP 404, so this specific numeric claim should be treated as unverified pending a successful full read)

### Inferences
- The equilibrium framing — parties comply because expected detection cost exceeds the gain from violating, not because detection is guaranteed — is the correct mental model for the summit's "chance a break is caught should depend on the monitoring level everyone agreed to": monitoring level should set a detection *probability*, not a certainty, and the AI parties' (and player's) incentive to comply should come from that probability times the penalty for being caught, exactly as in the inspection-game payoff structure.
- The "quota of inspections roughly doubles detection chance" style of finding (even unverified in exact wording) supports building monitoring level as a small number of discrete tiers (e.g., none/low/medium/high) each roughly doubling detection odds, rather than a continuous slider — this matches how these games and the literature both discretize inspection effort into countable events (bag checks, investigations, inspection quotas).
- Because the model treats inspector and inspectee symmetrically as strategic agents, it directly justifies "monitoring also catches the player": the mechanism doesn't distinguish between the player-as-party and an AI-lab-as-party — both are inspectees under the same shared inspection scheme once a monitoring level is agreed, so the detection roll should run identically regardless of who is being checked.

### Gaps
- I was unable to fetch either the Avenhaus inspection-games PDF (SSL error) or the Wikipedia "Inspection game" article (404, suggesting it may not exist under that exact title or was moved/deleted) despite two attempts. ⚠️ Every claim in this section is therefore based on WebSearch's own summarization of source pages, not a direct read of the primary academic text — this is the weakest-sourced section in this report and should be treated as directionally correct (the field and its basic framing are corroborated across multiple independent search results) but not verbatim-verified. If precise formulas or theorem statements are needed for design work, someone should access the LSE-hosted PDF or a library copy of Avenhaus, von Stengel & Zamir's "Inspection Games" chapter in the *Handbook of Game Theory* directly.
- No specific board game explicitly built on/citing the inspection-game literature was found in this research pass (the assignment asked to note "any games built on them"); I found none with a confirmed direct lineage, so this should be treated as "not found" rather than "does not exist."

## Conditional commitments / "I will if you will" mechanics

### Takeaway
The formal game-theory term for this is the assurance game (also called stag hunt), a coordination game where mutual cooperation is the best outcome for both sides but is only rational to choose if you're confident the other side will also cooperate; conditional cooperation strategies (cooperate only if others are seen to be cooperating) are empirically the most successful strategy type in experimental populations. I did not find a named tabletop board game whose rules explicitly implement a player-facing "I commit to X only if you commit to Y" contract clause as a first-class mechanic distinct from the binding/non-binding deal-typing already covered above (TI4 promissory notes, Cosmic Encounter's tangible-vs-promise split, Sheriff of Nottingham's bribe-now-vs-future-favor split).

### Cited Findings
- The stag hunt / assurance game has two pure-strategy Nash equilibria (mutual cooperation, mutual defection) plus a mixed-strategy equilibrium where each player cooperates with some probability — formally capturing why a party might rationally withhold cooperation purely out of uncertainty about the other side, even without any incentive to defect if trust were established — [Cooperation and Shared Beliefs about Trust in the Assurance Game, PLOS One](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0144191) (search-snippet)
- "First- and second-order beliefs about how much people trust each other are important for cooperation in risky coordination games," and across experimental strategy populations, "conditionally cooperative strategies consistently achieve the highest equilibrium frequencies" — [Cooperation and Shared Beliefs about Trust, PLOS One](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0144191) (search-snippet)
- No citable tabletop game rulebook describing an explicit in-rules conditional-commitment contract clause ("I pledge X, contingent on your pledge of Y, verified at a set time") was located in this research pass.

### Inferences
- The academic assurance-game framing supports designing the summit's monitoring-level vote itself as an assurance game: each party should prefer high monitoring if and only if it believes others will also commit to high monitoring (since high monitoring is only individually costly if others aren't also constrained), which justifies making the player's job partly about signaling credible commitment to raise every party's confidence, not just extracting concessions.
- Given no board game was found with a first-class "conditional pledge" mechanic, the summit's design here would be a genuine adaptation rather than a direct port — the closest existing building blocks are (a) TI4's per-agenda rider that only fires reactively to a specific vote outcome, and (b) the binding/non-binding deal-typing pattern seen across TI4, Cosmic Encounter, and Sheriff of Nottingham, which could be combined into "a pledge becomes binding only once a triggering condition — such as another named party's matching pledge — is also locked in."

### Gaps
- This key question turned up strong game-theory grounding but weak tabletop-specific grounding; I could not confirm whether any published board game implements conditional/contingent pledges as a distinct rules mechanic (as opposed to informal table talk). This should be treated as a likely genuine absence in mainstream tabletop design rather than a research shortfall, but I did not exhaustively search (e.g., did not check negotiation-heavy Euro games like Chinatown, Republic of Rome, or Kemet specifically for this). ⚠️

---

## COVERAGE STATEMENT

Sources consulted, and how fully each was read:

**Fetched and read in full (via WebFetch):**
- [Agenda Phase / Galactic Council, UltraBoardGames](https://www.ultraboardgames.com/twilight-imperium/galactic-council.php) — read in full.
- [Sheriff of Nottingham game rules, UltraBoardGames](https://www.ultraboardgames.com/sheriff-of-nottingham/game-rules.php) — read in full.

**Attempted to fetch but failed (content not read; relied on WebSearch-generated summaries only, flagged ⚠️ throughout):**
- ⚠️ `http://www.maths.lse.ac.uk/personal/stengel/TEXTE/insp.pdf` (Avenhaus, "Inspection Games") — SSL/TLS error on fetch; not read.
- ⚠️ `https://en.wikipedia.org/wiki/Inspection_game` — HTTP 404; page may not exist under this title; not read.
- ⚠️ `https://twilight-imperium.fandom.com/wiki/Agenda_Phase` — HTTP 402; not read.
- ⚠️ `https://fgbradleys.com/wp-content/uploads/rules/Sherriff%20of%20Nottingham%20-%20rules.pdf` — HTTP 403; not read.
- ⚠️ `https://twilight-imperium.fandom.com/wiki/Transactions_%26_Deals` — HTTP 402; not read.

**Not fetched at all — findings are based only on WebSearch result snippets/summaries (each individually flagged ⚠️ above where used as a source):**
- Twilight Imperium Wiki: "Promissory Notes" page
- BoardGameGeek thread on using Promissory Notes
- Fantasy Flight Games news post on the Messenger Raven (A Game of Thrones board game)
- Cosmic Encounter Wiki: "Negotiate card" and "Ally" pages
- BoardGameGeek page for Rex: Final Days of an Empire
- Secret Hitler official rules PDF (secrethitler.com)
- The Resistance Wikipedia article and consolidated rules PDF (gamers-hq.de)
- Werewolf Wiki "Seer" page and Gridbeast "Aura/Apprentice Seer" pages
- Wikipedia article on Twilight Struggle; twilightstrategy.com DEFCON strategy post; GMT Games rules PDF listing (not opened)
- UltraBoardGames Pax Pamir "game elements" page
- BoardGameGeek page and Wikipedia article on John Company
- Wikipedia "The Game of Diplomacy" and officialgamerules.org Diplomacy rules summary
- officialgamerules.org and other Love Letter rules summaries
- Semantic Scholar listing, EconPapers/RePEc summary, and Science & Global Security archive summary on inspection-game literature
- PLOS One article "Cooperation and Shared Beliefs about Trust in the Assurance Game"

**Topics searched with no citable, specific result found (treated as gaps, not fabricated):**
- Root: not directly searched in this pass; its potential hidden-role/verification mechanics (base game or expansions) remain unchecked.
- A formally verified or moderator-enforced anti-cheat/verification variant of Diplomacy: searched, nothing citable found.
- A tabletop board game with an explicit, rules-level "conditional pledge" / "I will if you will" contract mechanic: searched, nothing citable found.
- Exact wording/context of the "5 inspections roughly doubles detection chance" claim in the arms-control literature: could not verify against primary text.

Overall, this note's two most load-bearing rules pages (Twilight Imperium's agenda phase and Sheriff of Nottingham's inspection/bribery rules) were read in full from a working source. Every other citation in this file rests on WebSearch's own summarization of a source page or PDF rather than a direct full read by me, because the specific pages/PDFs I attempted to open for deeper verification (the Fandom wiki, the official Sheriff of Nottingham PDF, and the Avenhaus academic paper) were unreachable (402/403/404/SSL errors) within this research pass. Any finding drawn from those unread sources carries an inline ⚠️ note above; treat the underlying facts as plausible and corroborated by multiple independent search snippets, but not verbatim-confirmed.
