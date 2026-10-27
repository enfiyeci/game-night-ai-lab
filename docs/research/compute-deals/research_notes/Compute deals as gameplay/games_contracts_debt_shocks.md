# Games that turn contracts, timing bets, negotiation, debt and supply shocks into play

Scope: second-pass research for Game Night AI Lab (real-time browser management game; player signs take-or-pay compute contracts with strings attached). It goes deeper than `docs/research/compute-mechanics/notes/procurement_game_mechanics.md`, which I read in full first. That file already covers Power Grid's resource market, Brass loans in outline, 18xx rusting in outline, Container, Offworld's share buyout, and Century/Suburbia rows. I do not repeat those except where I add rule detail.

How to read the source flags (important):
- The WebFetch tool does not hand me raw page text. It returns an extraction written by a small model against my prompt. "Fetch tool reported the page complete" below means the tool said the text ran to its natural end. It does not mean I read the raw text myself. The one exception: the Quacks of Quedlinburg rules PDF, which I converted with `pdftotext` and read myself end to end (601 lines).
- Many rules claims below come from RulesPal pages (rulespal.com). When I fetched RulesPal's index page, it was titled "Board Game Rules Answered by AI". So RulesPal rule text is an AI-written condensed summary, not the publisher's rulebook. Every claim sourced from RulesPal is marked [RulesPal] and should be checked against the publisher's rulebook before it goes into a design doc. Several RulesPal pages also had gaps (missing tables, "TODO" icon placeholders); I note those where they matter.
- Designer-notes.com (Soren Johnson) pages are primary designer writing. Wikipedia and the CK3 wiki are secondary but stable.
- Search-snippet-only claims are marked with a warning sign and name what is missing.

---

## 1. Futures and timing bets: committing now, or betting on when a shock or generation change hits

### Takeaway
The games that make "lock in early vs. stay flexible" interesting share one structure: the commitment buys something now, its cost is paid in a currency that keeps draining later (income, salaries, a forced purchase), and the trigger that punishes waiting is partly caused by the other players, so it can be watched and raced. 18xx's train rush, Age of Steam's shares, Brass's loans and Food Chain Magnate's milestones each do this differently. I found no board game with a clean "pay now, receive later at a locked price" futures contract; the nearest are Sidereal Confluence's binding future-turn deals and loans.

### Cited Findings

**18xx / 1830 train rush and rusting**
- 1830 train types and prices: 2-train $80 (6 copies), 3-train $180 (5), 4-train $300 (4), 5-train $450 (3), 6-train $630 (2), Diesel $1,100 or $800 with a trade-in of a 4, 5 or 6. Trains of one type must be sold out before the next type becomes available. [RulesPal 1830](https://rulespal.com/1830/rulebook)
- A new phase starts "immediately when the first train of a new type is bought" (phase 3 on the first 3-train, and so on). Obsolescence is tied to phases: 2-trains are removed at phase 4, 3-trains at phase 6, 4-trains at the first diesel. The rulebook says "obsolete" and "removed from play", not "rust". [RulesPal 1830](https://rulespal.com/1830/rulebook)
- Train limits per company shrink as phases advance: 4 in phases 2-3, 3 in phase 4, 2 in phases 5-7. [RulesPal 1830](https://rulespal.com/1830/rulebook)
- Forced train purchase (rule 6.6.2): a company with a legal route and no train at the end of its turn must buy one. Payment order: company cash first, then the president pays the rest from personal money, then the president must sell shares or private companies. Bankruptcy happens when that still cannot be funded; "the game ends immediately" and the bankrupt player scores the value of the shares he could not sell. [RulesPal 1830](https://rulespal.com/1830/rulebook)
- Variants change who controls the clock. In System18's "UK Limited" the text says "Trains do not rust based on new train purchases"; instead a rust tracker advances each operating round and 2-trains rust at the end of the 3rd, 3-trains at the 4th, 4-trains at the 5th. In the Mississippi variant, each new non-permanent train "comes with a free token (warranty)" and "a train with a token does not rust until it has been removed", removed the first time the train runs. [System18 wiki](https://github.com/tobymao/18xx/wiki/System18)
- The author of the snellman.net blog (the page does not name a first name; it is a design diary for a stripped-down 18xx, not 1830 itself) says the goal was to "strip away everything possible from an 18xx game except for the train rush, but try to retain the feel of the rush", and names the core as the same player controlling several companies, "the delicious dilemma of companies being both assets and liabilities". The diary also says players must judge "how long a train will last". [Snellman design diary](https://www.snellman.net/blog/archive/2010-10-11-design-diary-minimal-18xx-train-rush-game-1.html)

**Age of Steam shares and income (all [RulesPal Age of Steam](https://rulespal.com/age-of-steam/rulebook))**
- Each issued share gives $5 and moves a disk on the Issued Shares Track. Expenses each turn are $1 per issued share plus $1 per link the locomotive can traverse. Any expense you cannot pay from cash reduces income by the shortfall; income below $0 eliminates you. Final scoring: 3 VP per $ of income, 1 VP per completed track section, minus 3 VP per issued share; cash is worth nothing.
- Turn order is an auction: bids of at least $1; the first player to drop out pays nothing, the last two bidders pay full, everyone else pays half rounded up.
- Income reduction after each round: income 11-20 loses 2, 21-30 loses 4, 31-40 loses 6, 41-49 loses 8, over 49 loses 10. The page lists nothing for income of 10 or less.
- Caveat: the page is a RulesPal summary and says it did not give a numeric cap on shares.

**Brass: Birmingham loans (all [RulesPal Brass](https://rulespal.com/brass-birmingham/rulebook))**
- Loan action: discard a card, take £30, and move the income marker "3 income levels (not spaces) backwards", landing on the highest space of the lower level. You cannot take a loan that would drop income level below -10.
- At the end of each round you collect money equal to your income level; negative income must be paid to the bank. If you cannot pay, you remove your own industry tiles from the board, each worth half its cost rounded down (removed tiles leave the game), and if still short you lose 1 VP per £1 short. Income cannot rise above level 30.
- The page marks some icons and values as "TODO", so this is incomplete.

**Food Chain Magnate milestones and salaries**
- Milestones are one-time achievements ("first to market a burger", "first to lower prices") that give a permanent bonus to whoever claims them first; a milestone claimed in a turn is removed from the game at clean-up. [RulesPal FCM](https://rulespal.com/food-chain-magnate/rulebook)
- Salaries are paid in the Payday phase: $5 per card showing a salary icon, including staff on the beach; you may fire people first. [RulesPal FCM](https://rulespal.com/food-chain-magnate/rulebook)
- Employees are chosen secretly each turn and revealed at once; the bank starts at $50 x players, each player secretly picks a reserve card that is added at the first bank break, and the game ends when the bank breaks a second time. [RulesPal FCM](https://rulespal.com/food-chain-magnate/rulebook). The RulesPal text contains nothing on loans, so I make no claim about whether the game has them.
- A milestone walkthrough calls "First to Train" (a $15 salary discount) "the most important milestone in the game", says milestone effects are often "most valuable early", and notes "We can't have it all" because milestones compete for limited actions and slots. It says aggressive strategies are "more fragile than those based on training". [Erik Twice, Understanding milestones](https://eriktwice.com/en/2021/06/18/food-chain-magnate-understanding-milestones/) (fetch tool reported the page complete; it does not cover every milestone)

**Sidereal Confluence: deals that cross turns**
- "Deals are binding, even across turn boundaries: if you promise to do something, you must do it." If you cannot deliver, compensation must be agreed by everyone involved; otherwise you complete as much as you can and lose points: 2 per card/octagon/point undelivered, 1 per cube or ship; scores can go negative. [RulesPal Sidereal Confluence](https://rulespal.com/sidereal-confluence/rulebook); same binding rule in [UltraBoardGames](https://ultraboardgames.com/sidereal-confluence/game-rules.php)
- Information is open except bids and victory points; points cannot be traded. Colony and research-team purchases are decided by simultaneous hidden ship bids, with only brief negotiation allowed about what is being bid on. [RulesPal Sidereal Confluence](https://rulespal.com/sidereal-confluence/rulebook)

**Pit (commodity trading)**
- Players blindly swap one to four cards of the same commodity; trading starts by calling out a number of cards until someone holds out an equal number; cards are exchanged face down; everyone plays at once with no turns. A player with nine of one commodity must reveal and calls "Corner". The Bear card forbids declaring a corner; the Bull is wild; at round end the Bear and Bull each cost a non-winner 20 points. Original 1904 Parker Brothers game, inspired by the Chicago Board of Trade. [Wikipedia, Pit (game)](https://en.wikipedia.org/wiki/Pit_(game))

**Ra (timing the end of a round)**
- The Ra track and the Ra tiles (30 in the bag) are a timer: drawing a Ra tile advances the Sun Boat and triggers an auction; when the boat reaches the last space the epoch "immediately ends without completing an auction". Each player has a fixed set of sun disks and an epoch also ends when all disks are played; players with no face-up disks can no longer act. In Ra, each auction is one bid per player, in order, ending with the Ra player. [RulesPal Ra](https://rulespal.com/ra/rulebook) (page has "TODO" placeholders)

### Inferences (what makes it work, and the single-player-vs-AI adaptation)
- 18xx works because the trigger is shared. Buying the first train of the next type changes the phase for everyone, so every purchase is both a bet and a move against rivals. Waiting is cheap until someone else triggers, after which your fleet is gone and the forced-purchase rule (company cash, then your own money) makes idle capital a debt. Without forced purchase, rusting would just be a stat drop; the forced purchase is what turns it into a rush. The UK Limited variant (fixed schedule) and Mississippi warranty token show the design dial: predictable rust turns the bet into a puzzle; player-triggered rust makes it a race.
- For a solo player vs AI rivals: tie the "chip generation" clock to rival purchases that are shown on screen ("Rival lab X took the first N+1 allocation"), with a count of how many N+1 batches remain before the old generation is "superseded". The player can trigger it themselves, which is the interesting bet.
- Age of Steam and Brass work because borrowed money is cheap early and costly late, and because the loss lands on something you cared about. Brass uses income levels that cannot be repaid, with a floor at -10 so you cannot borrow forever. Age of Steam shows the same loan as a running expense plus a score penalty (3 VP per share), so a share is only worth taking if it buys more than 3 VP of position. For a take-or-pay compute contract, the Brass shape (cash now, permanent income drag, with failure paid by selling assets at half value) is the closest match. The "sell assets at half cost when you cannot pay" rule is a soft landing that keeps a bad commitment from ending the game outright.
- Food Chain Magnate's milestones are a timing bet with a built-in expiry: they are removed when claimed, so the bet is "spend actions now on something that disappears". Salaries are the recurring cost that makes hiring a commitment. The relevance: a compute contract is closer to a salary than a purchase, and the milestone shape suggests limited-slot deals that vanish once an AI rival signs them.
- Sidereal Confluence's binding future deals work because failure has a fixed price that scales with what was promised. Without that penalty table, "binding" would be a social rule that an AI opponent does not feel. This is the best-documented example of a delivery promise with a penalty; the game does not model price locks.
- Pit and Ra show the "when to stop" version: Ra's timer is random but bounded (a known number of Ra tiles in a known bag), so players estimate risk. Pit's blind exchange forces trades at equal quantity with no price, so the information is who is hoarding what.

### Gaps
- Pax Pamir, Hansa Teutonica, Offworld's open market price dynamics and Twilight Imperium were not researched for this section; I found no direct source on whether any board game models a true locked-price forward contract. This looks like a real gap in board-game precedent, not a research miss, but I can only say I did not find one.
- I did not find a primary source (rulebook or designer essay) that explains why 1830's train rush is fun beyond Snellman's design diary, which is about a derivative game, not 1830 itself. The tension description for 1830 above is from the rulebook text; the explanation of why it works is my inference.
- I could not verify the Age of Steam turn order auction payments against the publisher's rulebook (the allplay PDF returned HTTP 404).

---

## 2. Negotiation with hidden information: which work against AI, which collapse

### Takeaway
Soren Johnson's own account is the strongest evidence in this set: a freely usable bargaining table against AI turned into a "vending machine" he called "a big mistake". The negotiation designs that survive against an AI either remove the table (event-driven, costed requests: Old World, Frostpunk 2 council, Crusader Kings hooks) or give the AI legible rules and a fixed price for broken promises. Board-game negotiation (Chinatown, Cosmic Encounter, Bohnanza, Diplomacy, Sidereal Confluence) depends on human bluffing and social enforcement and does not transfer directly.

### Cited Findings

**Board games**
- Chinatown: shop tiles are "kept face down until every player has drawn" and then "revealed simultaneously, so that trading can begin at the same time for all players"; money is kept secret; "anything can be traded", including buildings (with or without shops), shop tiles and money, in any combination; "All negotiations and trades take place simultaneously", with any player allowed to intervene; negotiations continue until all players agree to move on. The summary does not say whether deals are binding. Income per round depends on business size and completeness (for example a complete 6-shop business pays $140,000 against $10,000 for an incomplete 1-shop one). [RulesPal Chinatown](https://rulespal.com/chinatown/rulebook)
- Sidereal Confluence: see section 1. Trade Phase is open (everything except bids and victory points is public), all deals are binding across turns, a broken deal costs points by a fixed table, and "Players should avoid talking about potential future trades except during the Trade Phase" with "Negotiation is prohibited during the Economy Phase". [UltraBoardGames](https://ultraboardgames.com/sidereal-confluence/game-rules.php)
- Cosmic Encounter: a deal is only possible when both main players play Negotiate cards; they have one minute; a deal is either a card trade or an agreed colony. If no deal is reached in one minute, "each main player sends three of their own ships to the warp." The summary does not use the word "binding". [RulesPal Cosmic Encounter](https://rulespal.com/cosmic-encounter/rulebook)
- Bohnanza: only the active player trades; "The non-active players may not trade amongst themselves"; received cards cannot go into a hand and must be planted immediately; hand order cannot be changed, which makes you plant in the order you drew. [RulesPal Bohnanza](https://rulespal.com/bohnanza/rulebook)
- Pit: negotiation is by quantity only (see section 1). [Wikipedia, Pit](https://en.wikipedia.org/wiki/Pit_(game))
- Diplomacy: negotiation phase before simultaneous written orders; "Players are not bound to anything they say or promise, and no agreements are enforceable"; combat has no randomness; the article describes players spending "much of their time forming and betraying alliances". [Wikipedia, Diplomacy (game)](https://en.wikipedia.org/wiki/Diplomacy_(game)) (⚠️ the fetch tool read characters 0 to 100,000 of 115,473; the last ~15,000 characters, which it said were footer navigation, were not read)
- Twilight Imperium 4th edition: ⚠️ search snippet only, because the fan wiki returned HTTP 402 and the official Living Rules Reference was not reached. The snippets say a deal can be binding or non-binding, a transaction is limited to one with each neighbor on your turn, and once components change hands "the transaction cannot be undone". [Twilight Imperium Wiki, Transactions & Deals](https://twilight-imperium.fandom.com/wiki/Transactions_%26_Deals)

**Video games against AI**
- Soren Johnson calls the Civ 3 bargaining table "a big mistake": free tech trading "will always be problematic" because giving a tech cost the giver little, and AIs traded among themselves like "a cartel of AIs". Civ 4 added limits (AIs reluctant to trade with players they disliked or who led, no swapping lump sums for per-turn payments) but "Diplomacy did not feel like diplomacy; it felt like walking up to a vending machine." He later describes the follow-on problem as "exchanging a vending machine for a slot machine" when players keep asking until they get the answer they want. [Soren Johnson, Old World Designer Notes #10: Diplomacy](https://www.designer-notes.com/old-world-designer-notes-10-diplomacy) (fetch tool reported the page complete)
- Old World's answer, in Johnson's words as summarized by the fetch tool: diplomacy runs through events because events are "inherently unpredictable yet also reactive to the current game state"; requests cost Civics or Training; only one diplomatic mission runs at a time, through an Ambassador; missions take several years so they cannot be undone by reloading; the Ambassador can die mid-mission and the player is warned before sending a sick one; and he judges the system by the number of diplomatic events the writers produce. [Same Johnson page](https://www.designer-notes.com/old-world-designer-notes-10-diplomacy)
- Crusader Kings 3 hooks: a hook is "a favor owed or a means of coercion". A weak hook is single-use and mostly adds acceptance (Imprison gives +30); a strong hook "will force acceptance" for most interactions, has a five-year cooldown, and most weak hooks last 10 years. You can hold only one hook on a character at a time. Hooks cannot be used for Call to War, Offer Peace, Purchase Truce or Negotiate Settlement. Arrange Marriage gives +100 acceptance with a weak hook, +200 with a strong one. The page does not describe how the AI computes acceptance or any "will accept" preview. [CK3 Wiki, Hooks](https://ck3.paradoxwikis.com/Hooks) (fetch tool reported the main text complete; some table entries truncated)
- Frostpunk 2 council: 100 delegates, 51 votes to pass a law; one law per session, then a ten-week recess; you can buy faction votes by letting them choose the next law, promising to research and build a building they pick, or guaranteeing a policy; promises "usually come with a time limit"; breaking one "doesn't fare well with the Faction in question"; pressuring delegates guarantees more votes but "negatively impacts relations with every Faction" and avoids making a promise. No penalty numbers given. [PCGamesN, Frostpunk 2 council](https://www.pcgamesn.com/frostpunk-2/council) (fetch tool reported complete; this is a press guide, not an official wiki). A separate search snippet says the game shows which factions are open to persuasion. ⚠️ snippet only, [Twinfinite](https://twinfinite.net/guides/frostpunk-2-council-voting-explained-how-to-pass-every-vote-negotiate-more/) was not fetched (HTTP 500 on the first attempt for a different page; I did not retry).
- Stellaris: ⚠️ search snippets only from Paradox developer diaries (the diary pages returned HTTP 500). They say AI attitude is "primarily driven by opinion" and "affects ... what diplomatic offers they'll consider and how fair a shake they will give you in trade deals"; personality "matters more to diplomacy than anything else"; in 3.9 treaties were tied to trust; below 50 Trust the AI applies a -100 acceptance penalty to subject/overlord arrangements; trading favors between empires was removed in 3.9. [Stellaris Dev Diary 24](https://admin-forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-24-ai.912400) and [Dev Diary 315](https://admin-forum.paradoxplaza.com/forum/developer-diary/stellaris-dev-diary-315-the-velvet-glove.1600119)

### Inferences
- Why board-game negotiation collapses against an AI: Chinatown, Cosmic Encounter and Diplomacy get their drama from reading a human (bluffing about hidden shop tiles, hidden cash, one-minute deadlines, unenforceable promises). A scripted AI has no face to read, and the player quickly learns its acceptance rule. Johnson's "vending machine" is the same failure: once the AI's answer is a function of the offer, the player just searches for the best offer.
- What survives: (a) a price for asking (Old World's Civics/Training cost, Frostpunk 2's recess between laws, CK3's five-year hook cooldown) so the player cannot probe repeatedly; (b) a state-dependent outcome the player cannot fully predict (Old World events); (c) a stored, visible credit that changes acceptance (CK3 hooks; Stellaris trust) rather than a haggle over numbers; (d) a fixed, visible penalty for breaking a promise (Sidereal Confluence's point table; Frostpunk 2 promise deadlines).
- Sidereal Confluence's trade phase works because both sides hold different things and each side's value is private (every species converts goods differently). A player-vs-AI version of that needs the AI to have a visible need (say, a rival lab short of memory) the player can serve, with the AI's price moving with its need. Chinatown's trick of "reveal everyone's tiles simultaneously, then trade" is a useful rhythm for a real-time game: a short visible window where this period's offers all appear at once, rather than continuous haggling.
- For letters of intent and exclusivity clauses: CK3's hooks suggest modelling a signed deal as a stored "favor" with a strength and expiry, not as a menu item. The AI "supplier" can then call it in or refuse to honour a weak one.

### Gaps
- No official source on Twilight Imperium's binding-deal text, Stellaris' acceptance maths (dev diary pages failed), or Civilization 5/6 diplomacy; I did not reach Crusader Kings AI acceptance rules.
- I did not read any Shut Up and Sit Down, BoardGameGeek or GDC source on why negotiation games work; the explanation of why they work here is my inference from rules text.
- Whether Chinatown deals are binding is unstated in the RulesPal summary; BoardGameGeek's rules FAQ would settle it.

---

## 3. Debt and strings: obligations that tax the future

### Takeaway
The best documented design reasoning I found is Soren Johnson's on Offworld Trading Company: replace a permanent punishment with a debt that has visible interest tiers, and a hard worst tier, so players can see the commitment growing and choose when to fix it. The common thread in the other games is that the cost arrives automatically each round, is visible beforehand, and has a defined failure mode that costs something you value rather than ending the game.

### Cited Findings

**Offworld Trading Company debt**
- The first fix for unmet Power/Fuel/life-support needs was a stock-price penalty, and "each stock penalty lasted for the rest of the game"; Johnson says this pushed players toward a conservative strategy of always producing required resources first. Debt replaced it: each time a player buys a needed resource from the market it is recorded as debt, "acting as an unlimited line-of-credit". [OTC Designer Notes #5: Debt](https://designer-notes.com/otc-designer-notes-5-debt) (fetch tool reported the page complete)
- Bond ratings run AAA to D; ratings depend on debt relative to total assets and set the interest rate. AAA/AA/A carry 2-6% ("quite manageable"); at D "the interest rate jumped to 30%". D also locks you out of the black market. Players could "debt dive" (ignore debt and focus on cash-producing resources to buy out rivals), which Johnson calls "a dominant strategy" in the best players' hands; the ratings system made heavy borrowing expensive. The B and C thresholds are not given. [Same page](https://designer-notes.com/otc-designer-notes-5-debt)
- The "Cook the Books" black-market item can be used at a D rating and raise it to C, but does not work if the debt is too severe to qualify for D; the designer notes that cheap debt can still "spiral out of control". [OTC Designer Notes #14](https://www.designer-notes.com/otc-designer-notes-14-black-market-part-ii/) (fetch tool reported the page complete)

**Other board-game debts and strings**
- Brass loans, Age of Steam shares, Food Chain Magnate salaries: see section 1.
- Monopoly mortgages: an unimproved property can be mortgaged for the printed value; lifting the mortgage costs the value "plus 10% interest"; "A property that is mortgaged collects no rent"; buildings must be sold back (at half price) before mortgaging; bankruptcy hands your assets to the creditor. Deals between players are private "for any agreed amount". [RulesPal Monopoly](https://rulespal.com/monopoly/rulebook)
- Through the Ages corruption: at the end of the Production phase, the leftmost uncovered negative number on each section of your blue bank is your corruption, and you "lose resources equal to your corruption", then food if resources run out. Also: events are placed in a future-events deck as a political action, which reveals and evaluates the top current event. ⚠️ I read this from the official CGE rules PDF with `pdftotext`, but the font encoding dropped many letters, so I could only partly parse it; the corruption and event sentences above are reconstructed from the readable fragments. [CGE Through the Ages rules PDF](https://d.cge.as/tta_manual/through-the-ages-new-story-rules-en.pdf)
- Crusader Kings 3 hooks (above) are strings attached to a relationship: a favor owed that expires.
- Frostpunk 2 promises with deadlines (above) are strings attached to votes.

**Faustian bargains in roguelikes and deckbuilders**
- Slay the Spire: Neow's "Third Blessing" is "the only Neow option that pairs a drawback with a reward". Drawbacks: lose max HP, take damage (3 x floor(current HP / 10)), obtain a Curse, or lose all gold; rewards: remove 2 cards, transform 2 cards, gain 250 gold, choose a rare card, a rare colorless card, a random rare relic, or gain max HP. Exclusions: Remove 2 cards cannot pair with Obtain a Curse; Gain 250 Gold cannot pair with Lose all Gold; Gain Max HP cannot pair with lose max health. [Slay the Spire Wiki, Neow](https://slaythespire.wiki.gg/wiki/Neow) (fetch tool said visible text was complete but some ascension numbers garbled)
- Slay the Spire curses: Decay is an unplayable curse that discards itself at end of turn and deals 2 damage (blockable). Doubt applies 1 Weak at end of turn. Normality limits you to three cards per turn. [Slay the Spire Wiki, Decay](https://slaythespire.wiki.gg/wiki/Decay) (Decay page read by the fetch tool as complete); Doubt and Normality are from search snippets only ⚠️ ([Doubt](https://slaythespire.wiki.gg/wiki/Doubt), [Normality](https://slay-the-spire.fandom.com/wiki/Normality) not fetched). The Decay page notes it is blockable "as Decay deals damage rather than causing HP loss directly".
- Balatro jokers with a cost: Credit Card "Go up to -$20 in debt"; Ceremonial Dagger "destroy Joker to the right" when a Blind is selected; Gros Michel "1 in 6 chance this card is destroyed at end of round" (+15 Mult); Cavendish "1 in 1000" (X3 Mult); Burglar "+3 Hands and lose all discards"; Madness "gain X0.5 Mult and destroy a random Joker"; Luchador and Invisible Joker must be sold to work. [Balatro Wiki, Jokers](https://balatrowiki.org/w/Jokers) (fetch tool reported the list complete)
- Hades Pact of Punishment: ⚠️ search snippets only (the Prima Games page returned HTTP 403). Snippets say Heat raises difficulty in exchange for better rewards, each of 15 modifiers adds Heat, and after each escape with a weapon you must raise Heat again to earn the same rewards with that weapon. [Prima Games](https://primagames.com/gaming/hades-guide-pact-of-punishment-modifiers-heat); guide caveat: written for early access.

### Inferences
- What keeps a commitment from being a no-brainer or a trap, drawn from the above:
  1. The cost is visible and tiered before you sign (OTC bond ratings; Brass level -10 floor). If the cost is a hidden or uncapped number the commitment is a trap; if it is trivially small it is a no-brainer.
  2. The failure mode costs an asset you valued, at a discount (Brass: tiles sold at half cost; Monopoly: buildings sold at half price), so failure is painful but not game over.
  3. There is a clear cheap exit or fix (OTC: pay down debt to get back above D; Slay the Spire: blockable Decay, Omamori negates a curse; Hades: lower the Heat). Johnson's key lesson is that permanent penalties pushed players to play it safe, while repayable debt made early shortfalls survivable.
  4. A reason to take it even when you do not need it yet: Brass's early loan is cheap because income is small; Balatro's Credit Card buys $20 of runway at a time you are poor.
  5. Debt that the dominant strategy ignores must be priced (OTC's debt-diving exploit forced the rating tiers and the 30% D rate).
- Slay the Spire's Neow shape (one reward paired with one cost, with banned pairs that would cancel out) is a compact UI for "deal with strings": two or three offer lines, each = headline benefit + one randomly paired string, with the pairing rules checked so a string is never also an offset. That fits a compute-offer card, and "headline vs. what you actually get" can show up as the string.
- Balatro's Gros Michel (big bonus with a stated per-round destruction chance) is the cleanest known example of a probability-priced string: a contract that "might not be renewed" with a stated odds, rather than a flat penalty.

### Gaps
- Hansa Teutonica, Inscryption and a Through the Ages-specific designer account of corruption were not researched or not readable; Hades is snippet-only.
- I found no source on how OTC treats debt on top of the share system beyond Johnson's essay (the Gamepedia debt wiki page appeared only as a search result).

---

## 4. Supply shocks and push-your-luck: how the best games telegraph a shock

### Takeaway
The best shocks are bounded, countable and partly visible: players know how many there will be, roughly when, and can see enough of the deck, track or price to prepare. Pandemic, Power Grid's Step 3 and Ra do this with physical structure; Offworld does it with price signals. Push-your-luck games (Can't Stop, Quacks) differ in that the player controls how close to the shock they stand.

### Cited Findings

**Power Grid** (all [RulesPal Power Grid](https://rulespal.com/power-grid/rulebook); resupply numbers were missing from the page)
- Auction: the starting player opens an auction on one of the four plants in the current market (plants in the future market cannot be chosen); minimum bid equals the plant number; a player who passes cannot re-enter; a player who bought a plant cannot bid again that round; at most 3 plants per player.
- Setup: 8 face-up plants; the four lowest are the current market, the four higher the future market. In Steps 1 and 2 each round moves the highest future plant face down under the stack.
- Step 2 starts at the beginning of Bureaucracy once a player reaches the required connected cities (7 for 2-5 players). Step 3 starts when the Step 3 card is drawn: if drawn in Phase 2 it counts as the highest plant, and afterwards the lowest current plant and the card are removed with no replacement; the market shrinks to 6 plants with no future market; a third house per city costs 20 Elektro. Resource refill uses the left, centre or right column of the refill card for Steps 1, 2 and 3; refill fills the most expensive empty spaces first.
- ⚠️ Search snippet only, from a fan-hosted copy of the base-game rules ([world-of-board-games.com.sg](https://world-of-board-games.com.sg/docs/PowerGrid.pdf), not opened): the Step 3 card is removed from the deck, the rest shuffled into a supply stack, and the Step 3 card placed face down under the stack. The Rio Grande Recharged rules PDF exceeded the fetch size limit and was not read.

**Pandemic** (all [RulesPal Pandemic](https://rulespal.com/pandemic/rulebook))
- Epidemic card: Increase (infection rate marker up 1), Infect (draw the bottom card of the Infection deck, put 3 cubes on it; outbreak if the city already has cubes), Intensify (shuffle only the Infection discard pile and put it on top of the Infection deck). Epidemic cards are removed after use. Two drawn together: do all three steps twice.
- Setup: choose 4, 5 or 6 Epidemic cards; divide the player deck into piles of as equal size as possible, one per Epidemic card; shuffle one Epidemic into each pile and stack them. Players may examine either discard pile at any time, so Intensify tells you which cities are "likely to be infected again soon". Losing conditions: 8 outbreaks, cubes of a colour run out, or you cannot draw 2 player cards. The page does not print the infection rate numbers beyond the start at 2.

**Ra** ([RulesPal Ra](https://rulespal.com/ra/rulebook)): see section 1. The rulebook text has no explicit "push your luck" description; it does say a player who draws a tile cannot take the draw action if the auction track is full, and that Invoke Ra with a not-full track forces the Ra player to bid if all others pass. Disasters: 4 War, 2 Earthquake, 2 Funeral, 2 Drought tiles; winning an auction containing a disaster makes you discard tiles of that type.

**Can't Stop**: roll four dice and divide them into two pairs; neutral markers move on the column totals; if you stop, your markers replace the neutral ones; if no neutral marker can advance you "go bust" and lose "any advancement made this turn"; three columns win. [Wikipedia, Can't Stop](https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)) (fetch tool reported the page complete; the page does not use the "three runners" description)

**Quacks of Quedlinburg** (read myself, end to end: [Gus & Co. English rules PDF](https://gusandco.net/wp-content/uploads/2018/10/Quacksalber_Rules_English_v1.pdf))
- Players draw chips from their own bag simultaneously, placing each by its value; "If the sum of all white chips drawn exceeds the value of 7 ... the pot explodes"; the player must stop and the last chip is still placed. Only white chip values count toward the explosion. A flask can put the last chip back unless that chip would cause the explosion; it is refilled for 2 rubies at the end of a round.
- A player whose pot exploded must choose between the victory points on their scoring field or the coins of that field to buy chips; players who stopped in time get both, plus a bonus die if they have the highest scoring field.
- Rubber-banding: "Everyone, except for the player in the lead" can use rat tails to start their pot further along, by the number of rat tails between them and the leader.
- A new fortune-teller card is read each round and applies to everyone; before round 6 each player adds one white 1-chip to their bag, so explosion risk rises as the game goes on.

**Offworld Trading Company black market** (all from Soren Johnson's Designer Notes: [Part I](https://www.designer-notes.com/otc-designer-notes-13-black-market-part-i), [Part II](https://www.designer-notes.com/otc-designer-notes-14-black-market-part-ii/), [Part III](https://www.designer-notes.com/otc-designer-notes-15-black-market-part-iii/); fetch tool reported each page complete)
- The black market came after the economic game from a playtester's remark ("It would be cool if I could sabotage the other players' buildings"). Prices rise each time an item is bought by any player, so "When a Mutiny's price rises, everyone knows someone bought one, though not who or what they'll hit"; this prompts players to buy Goon Squads for protection. Without rising prices the designers feared players would "spend as much money as possible hurting each other".
- Attackers are hidden; a caught attacker is revealed to the defender; Goon Squad locations are permanently revealed once exposed because "taxing their memory" is not good design.
- Pirates originally relied on a 50% dice roll that "felt streaky"; the final version always hits but steals half. Power Surge was changed to avoid Goon Squads where possible because players called unlucky hits "bad bounce" outcomes. Core Sample odds are shown on mouseover: "If players are going to roll a virtual die, best to be as transparent as possible."
- Item selection rules ensure each sabotage type stays relevant (about seven of 19 items per game; always an EMP or Power Surge, a Dynamite or Mutiny, and Pirates or Magnetic Storms) because a Scientific player "didn't have to worry about Pirates or Magnetic Storms if neither one appeared".
- AI: Johnson judges mechanics by whether the AI can understand and use them; the Hologram was "completely unsuitable for the AI" because players would assume the AI is cheating, so Hologram, Spy and Auction Tile are "Advanced Sabotage" and off by default in single-player.

**Frostpunk storms**: ⚠️ search snippets only (the Prima Games and ArkTimes pages failed). Snippets say the first big blizzard arrives around day 15 and earlier cold snaps act as a warning, and that late in the game the city "learns of a massive storm headed your way" and players are advised to stockpile steam cores; Frostpunk 2 guides advise stockpiling Heat and Food before a Whiteout. I could not confirm a formal forecast timer. [Prima Games storm guide](https://primagames.com/tips/frostpunk-how-survive-storm) (snippet only); [Dot Esports on Whiteout](https://dotesports.com/frostpunk/news/how-to-survive-a-whiteout-in-frostpunk-2) (snippet only)

### Inferences
- Patterns for telegraphing a shock, ranked by how well they would work in a real-time, single-player game:
  1. A fixed number of shocks, shuffled into a known structure so spacing is controlled (Pandemic's equal piles; Power Grid's Step 3 card under the stack). The player knows "N shocks will come" and can budget for them; the trigger moment is uncertain but bounded.
  2. A visible discard or history that predicts the next hit (Pandemic's Intensify puts the already-infected cities back on top). Preparation is possible because the shock repeats the recent past.
  3. A lookahead row (Power Grid's future market of four plants) that shows what will be on sale next round. This is the cheapest telegraph: one row of items.
  4. A price signal that reveals other players' actions (Offworld's black-market price rises). In a compute game this maps to the spot price: a rival's hoarding shows up as a price jump before the shortage reaches you.
  5. A hard timer (Ra's Sun Boat track; Frostpunk's announced storm if a timer exists). Good for the "end of a window" shock.
- Offworld's lesson that matters most for a skeptical playtester: remove unexplained randomness. Johnson changed a 50% dice roll to a deterministic half-steal, and showed odds when randomness stays. A "letter of intent that delivers less than headline" is more fair if the shortfall is shown as a known range up front.
- Push-your-luck works when the player owns the decision of how close to stand to the shock (Can't Stop: stop whenever you like; Quacks: stop before white chips exceed 7, with the explosion costing you the choice between points and shopping rather than everything). Quacks' catch-up rats and rising white-chip count keep the tension up as the game progresses. A contract equivalent: "how many chips to commit to a single supplier" with a visible failure probability that rises through the game.
- Rubber-banding for the AI-rival setting: Quacks' rat tails (trailing players start further ahead) are a clean template for AI rivals who are behind getting a visible head start, so the player's lead is felt without hidden AI cheating.

### Gaps
- No primary source for Frostpunk's storm announcement timing (ArkTimes page: connection refused; Prima Games: 403). I could not confirm whether it is a forecast timer or scripted event dialogue.
- I did not verify Power Grid's resupply table or Step 3 shuffle rule from the publisher's rulebook (the PDF exceeded the fetch size limit; RulesPal omitted the numbers).
- Not researched: Quacks' official publisher PDF is the Gus & Co host copy, not Schmidt's own site; Incan Gold, Pandemic's later editions, and GDC/Game Developer talks on event telegraphing.

---

## Coverage statement

Opened and, per the fetch tool, read to the end (the tool's extraction, not raw text, except where noted):
- `docs/research/compute-mechanics/notes/procurement_game_mechanics.md` (read myself, in full, via Read, 139 lines).
- Soren Johnson, OTC Designer Notes #5 Debt; #13 Black Market Part I; #14 Part II; #15 Part III; Old World Designer Notes #10 Diplomacy (all fetched twice or once; fetch tool said each was complete).
- Quacks of Quedlinburg English rules PDF (Gus & Co host copy): converted with `pdftotext` and read myself end to end (601 lines).
- RulesPal rule summaries (AI-written, not publisher text): 1830, Age of Steam, Brass: Birmingham, Power Grid (resupply numbers missing), Pandemic, Sidereal Confluence, Chinatown, Ra, Cosmic Encounter, Bohnanza, Food Chain Magnate (no loans detail), Monopoly.
- Erik Twice (FCM milestones), Snellman's 18xx design diary, System18 GitHub wiki (rulebook links inside it not opened), Wikipedia (Pit, Can't Stop, Diplomacy), CK3 Wiki (Hooks), PCGamesN (Frostpunk 2 council), Slay the Spire Wiki (Neow, Decay), Balatro Wiki (Jokers), UltraBoardGames (Sidereal Confluence).

Partly read or reconstructed (flagged in the text):
- Wikipedia Diplomacy: last ~15,000 of 115,473 characters not read.
- CGE Through the Ages rules PDF: downloaded and converted, but the extraction lost many letters; only fragments readable.
- CK3 hooks page and Neow page: some table or number entries truncated or garbled.
- System18 wiki page: sidebar pages and the rulebook links inside it failed to load.

Snippet-only (search summary, not opened): Twilight Imperium transactions (fan wiki 402), Stellaris dev diaries 24 and 315 (500 errors), Frostpunk storms (403 and connection refused), Hades Pact of Punishment (403), Slay the Spire Doubt and Normality pages, Frostpunk 2 Twinfinite guide, Rio Grande Power Grid Recharged PDF (too large to fetch).

Could not reach: Designer Notes #18 (404), the allplay Age of Steam PDF (404), the Prima and ArkTimes Frostpunk pages. Not attempted: Pax Pamir, Hansa Teutonica, Inscryption, publisher rulebooks for Brass/Power Grid/Pandemic/Chinatown/Ra/Cosmic Encounter/Bohnanza, Mark Rosewater, GDC Vault, Shut Up and Sit Down, BoardGameGeek design threads. No email address was used in any request.

Overall caution for the report writer: because most rule text above comes from RulesPal's AI-written summaries and the fetch tool's extractions, treat exact numbers (prices, penalties, thresholds) as leads to verify against the publisher's rulebooks, and treat the designer-notes.com material (Soren Johnson) as the strongest sourced reasoning.
