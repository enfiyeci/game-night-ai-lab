# How market games keep "what to build" a real choice: research note

**Date:** 2026-09-26
**Question:** In games with markets, competition and shifting rules, what stops players from simply building whatever is "hot" right now? What could Game Night AI Lab borrow, given its no-randomness rule?

Produced by an Opus research subagent for lane `gn-model-appeal`; saved verbatim from its report. Its coverage
statement (bottom) is the subagent's own claim.

**How sources were read:** Web pages were read with WebFetch. WebFetch returns the whole page through a summarizing model rather than as raw text, and it reports whether the page came back truncated. Two PDFs were downloaded and turned into text with `pdftotext`, then read directly. Where a claim rests on less than a full read, it carries a ⚠️.

---

## 1. Offworld Trading Company (real-time economic strategy, Mohawk Games)

**What decides who wins a market.** Every company on the map shares one market. "Each time a resource is bought or sold, the price goes up or down accordingly" ([Mohawk design doc](https://mohawkgames.com/2014/06/16/offworld-rules/)). ⚠️ That design doc stops partway through section 14.2; the tool said the original page itself ends there. The official Almanac says prices move only when someone buys or sells. If equal amounts are bought and sold, the price does not move at all ([Almanac PDF](https://steamcdn-a.akamaihd.net/steam/apps/271240/manuals/Offworld_Trading_Company_Almanac.pdf?t=1516298308)). ⚠️ Read: the table of contents, the early strategy chapters (pp. 6–17) and the Designer's Notes (pp. 67–77). Not read: pp. 18–66 and pp. 78–96. Players on the forum confirm the same rule: producing a resource does not move its price, only selling it does ([Steam thread](https://steamcommunity.com/app/271240/discussions/0/1486613649679786014/)).

**Crowding, with numbers.** The clearest crowding rule is on the Pleasure Dome, a building that earns cash. One dome earns $4 per second per unit of colony population. When several domes exist, counting every company's, the average falls to $2.50 per population with two domes, $2 with three, and so on, down to a floor of $1 (Almanac p. 15, ⚠️ same partial read). The market price of a resource also punishes crowding. The designers pushed players to specialize: two neighbouring buildings of the same type get +50%, a third adds +25%, a fourth +10%, capped at +100% in total. The reason they give is that "if each player is building the same set of resources, the market is going to be less dynamic." A resource that everyone ignores can spike in price, which "would then reward the player who first noticed that no one else was making it" (Designer's Notes, p. 69–70). The original bonus had no diminishing returns, and players just scrapped and rebuilt the same buildings to chase prices. The designers added diminishing returns specifically to stop that dominant strategy.

**What stops a dominant strategy.** The design team said they "tried to build in an answer for whatever happens." A monopoly can be answered with sabotage, hacker-made price shortages and similar tools, and each of those has its own counter ([GameWatcher interview](https://www.gamewatcher.com/interviews/offworld-trading-company-interview/12129)). The choice of company type at the start of a match also shifts demand. For example, if many players pick the robotic company, which needs no food, water or oxygen, then life-support resources will "not be lucrative" (same interview). "Debt diving" (ignoring debt to chase cash) became a dominant strategy, so the team added bond ratings: interest of 2–6% at good ratings and 30% at a D rating (Designer's Notes, p. 72).

**Feedback to the player.** The game has no fog of war, so every rival's buildings are visible (GameWatcher). The designers removed a hidden demand curve and replaced it with a visible Colony whose modules show what it consumes. Their reason was that a complex, opaque system means "the computer is having the fun, not the player" (Designer's Notes, p. 75). One company type "receives warnings of upcoming shortages and surpluses" (Almanac p. 12), which shows that advance warning can itself be treated as a power. Offworld is not deterministic: colony modules and some events are random.

## 2. Motorsport Manager (racing-team management)

**Shifting rules.** Each season has rule votes. You can see at the start of the season which votes are coming ([Steam thread](https://steamcommunity.com/app/415200/discussions/0/208684375428273272/), ⚠️ read page 1 of 2). The organizing body lets you propose a rule for $1,000,000, and changes tend to take effect the next year or later ([Steam thread](https://steamcommunity.com/app/415200/discussions/0/133262487499789652/)). There are four political votes per season, drawn from a list of 122 rule types ([Steam thread](https://steamcommunity.com/app/415200/discussions/0/3800526046832406060/)). Players say the AI sometimes votes every part down to a standardized "spec" part, which kills car development. They disliked that outcome (the 208684375428273272 thread).

**Development trade-offs.** New parts come with trade-offs, such as better performance but lower reliability, or a "creative interpretation" of the rules that risks a penalty ([Strat Packer review](https://stratpack.blog/2021/08/27/motorsport-manager-review); [OverTake review](https://www.overtake.gg/threads/motorsport-manager-the-rd-review.128483/)). Only a part's developed performance carries into next season. Reliability, risk level and conditional bonuses are reset ([Steam thread](https://steamcommunity.com/app/415200/discussions/0/133255957994221612/), ⚠️ page 1 of 2; [Steam thread](https://steamcommunity.com/app/415200/discussions/0/133258593393940052/)).

**Feedback.** Both reviews say the game does not explain well *why* a car is fast or slow.

⚠️ Search-result snippets said three more things, but their sources could not be opened: the fan wiki (HTTP 402) and the official F1 Manager guide (HTTP 403). They said that rule changes cost engineers "expertise"; that parts reset once any team passes a threshold; and that F1 Manager gives the season's champion the fewest wind-tunnel hours. Treat all three as unverified.

## 3. Food Chain Magnate (board game, Splotter)

**Who wins a customer.** The game has no randomness after setup. A house buys only from a restaurant that can fill its entire order. It picks the lowest **unit price + distance**. Ties go first to the restaurant with more waitresses, then to turn order. The base price is $10. A pricing manager takes off $1, a discount manager $3, and a luxuries manager adds $10. Marketing campaigns are what create demand: billboards, mailboxes, airplanes and radio put demand tokens on houses, up to 3 per house or 5 with a garden, and a garden doubles the price paid ([UltraBoardGames rules](https://www.ultraboardgames.com/food-chain-magnate/game-rules.php)).

**First-mover milestones, which are deterministic.** Each milestone goes to whoever first meets its condition. Several players can claim the same one on the same turn. At the end of that turn, any milestone that was claimed is removed for everyone else ([UltraBoardGames milestones](https://www.ultraboardgames.com/food-chain-magnate/milestones.php)). Examples: first to market burgers gets +$5 per burger sold; first waitress raises waitress pay from $3 to $5; first to lower prices gets a permanent -$1. Erik Twice calls "First to Train" the most important milestone. He argues that milestones make fast strategies viable against slow ones, which the game already favours ([Erik Twice](https://eriktwice.com/en/2021/06/18/food-chain-magnate-understanding-milestones/)). The UltraBoardGames page lists 15 milestone entries, while other sources say there are 16.

## 4. Power Grid and Brass: Birmingham (board games)

**Power Grid.** The fuel market is a fixed track with 16 price spaces. Coal starts at 1 Elektro and uranium at 14. Every purchase empties the cheapest spaces, so the next unit costs more. Players buy fuel and build in **reverse** turn order, and the leader in cities goes first in turn order, so the leader buys last and pays the most ([UltraBoardGames rules](https://www.ultraboardgames.com/power-grid/game-rules.php)). ⚠️ That page refers to the restocking table and the payout table but does not print them. A strategy guide lists "rely on one plant type in high demand" as a mistake, because rivals will buy that fuel out ([My Board Game Guides](https://www.myboardgameguides.com/game-strategy/game-specific-strategy/power-grid-strategy-tips-dos-and-donts/)). The card deck adds some chance ([Wikipedia](https://en.wikipedia.org/wiki/Power_Grid)).

**Brass: Birmingham.** When you build a coal mine or iron works, its cubes go into the shared market starting at the most expensive empty spaces, and you are paid that price per cube. Buyers take from the cheapest spaces. An empty market still sells coal at £8 and iron at £6. The player who spent the least money this round goes first next round. The game has two eras, and at the end of the first (Canal) era every level-1 industry is removed from the board. That shift is known from the very first turn ([Esoteric Order of Gamers summary](https://www.orderofgamers.com/downloads/BrassBirmingham_v1.2.pdf)). Erik Twice says real choice in Brass comes from scarcity. Pottery is high-risk because it has only four board locations and is easy to block ([Erik Twice](https://eriktwice.com/en/2021/01/15/brass-birmingham-understanding-the-industries/)).

## 5. Capitalism Lab (business simulation)

**What decides sales.** A product's overall rating combines price, quality and brand. The weights differ by product class: cigarettes are 60% brand, 15% quality, 25% price; frozen meat is 20/40/40; for mobile phones quality counts for 40%. The store screen breaks the rating into those parts and shows sales against demand ([Beginners Guide](https://www.capitalismlab.com/beginners-guide-gameplay-basics/)).

**Switching cost.** Brand awareness must come before loyalty. Switching brand strategy "sets the brand ratings of all your products to zero" ([Branding FAQ](https://www.capitalismlab.com/resources/gameplay-faq/brand/)). Software that goes years without a new version "inevitably suffers poor sales," and each release is marked on the sales graph ([Software page](https://www.capitalismlab.com/digital-age-dlc/selling-software-products/)).

## 6. Game Dev Tycoon (game-studio management): a warning case

Each genre has an ideal balance of design points to tech points, roughly 67% in the favoured area, and ideal slider settings for each phase. You cannot release the same genre and topic combination twice in a row ([Baldwin cheatsheet](https://www.dbbaldwin.com/game-dev-tycoon-cheatsheet/)). Players say "you are competing with your previous scores," and that repeating genres "is usually seen as a rehash" ([Steam thread](https://steamcommunity.com/app/239820/discussions/0/864977564006487726/)). The game also adds a random value to review scores. Players who made identical games that scored 9 and then 6 concluded that reviews were random. The developer replied that the game is "less random than most people suspect" ([Steam thread](https://steamcommunity.com/app/239820/discussions/0/1738841319813687597/)). The lesson is that even a little hidden noise makes a fit system feel arbitrary.

(Cross-reference: the repo's fuller Game Dev Tycoon inventory is `docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`,
which records the same-combo rule as a −0.4 quality penalty rather than a ban.)

---

## Patterns across these games

- **Crowding is a formula that everyone can see.** Examples are Offworld's dome income ($4, then $2.50, then $2 per population), Power Grid's price track, and Brass's cheapest-space-first market. The hot option pays less the more players pile into it.
- **Diminishing returns stop "everything into one thing."** Offworld added the cap specifically because stacking one resource was dominant.
- **First-mover bonuses are one-time, exclusive, and allow same-turn ties.** Food Chain Magnate's milestones reward being early without letting one player lock out the rest forever.
- **Shifts are announced well ahead.** Brass announces its era-end removal from turn one. Motorsport Manager shows the season's votes at the start and applies them a year later.
- **The leader pays a structural tax.** Examples are reverse buying order in Power Grid and least-spent-goes-first in Brass.
- **Each product has its own weights.** Capitalism Lab's per-class weights mean the "best" product depends on what you are strong at.
- **Designers remove black boxes.** Offworld replaced a hidden demand curve with a visible one. Game Dev Tycoon shows the cost of keeping hidden noise.
- **Switching has a price.** Capitalism Lab zeroes brand on a switch. Motorsport Manager resets everything except base performance each season.

## What this suggests for Game Night AI Lab

1. **Crowding divisor on the era wave (from Offworld's Pleasure Dome).** The wave bonus is split by how many labs release into that product during the era: for example 100%, then 62%, then 50%, then 40%, with a floor. Rival release schedules are fixed, so show "3 labs are shipping coding tools this era" before the player commits. Being the only lab in an unfashionable product then becomes a real alternative.
2. **Firsts milestones (from Food Chain Magnate).** The first lab to ship each product, and each feature such as voice or computer use, gets a permanent small perk, for example lower serving cost for that feature. Labs that release in the same round all get it, and then it is retired. Rivals claim milestones on their public schedule, so the race is visible and deterministic.
3. **Weights per product (from Capitalism Lab).** Each product scores the same inputs with different weights. A chat app might weigh price and efficiency heavily, a coding tool capability, and an agent reliability plus computer use. Show the weighted breakdown on release so a loss can be explained ("lost to rival X on price, 40% weight").
4. **Next-era preview and legacy decay (from Brass and Motorsport Manager).** At the start of each era's round 3, reveal the next wave. At era end, models trained for the old wave take a fixed "legacy" penalty. The player then faces Motorsport Manager's tension: when to move training toward next year's product, set against switching cost (Capitalism Lab-style loyalty that resets).
5. **Rehash fatigue plus a leader tax (from Game Dev Tycoon and Power Grid).** A second consecutive release in the same product earns hype only on the amount it beats your own previous best. The market-share leader pays slightly more for serving compute. Keep all of it free of noise, the opposite of Game Dev Tycoon, and print each number.

---

## Coverage statement (the subagent's own)

**Read in full** (through WebFetch's summarizing reader, which reported the page as complete):
- https://www.shacknews.com/article/93533/offworld-trading-company-taking-stock-in-space (not cited above)
- https://www.gamewatcher.com/interviews/offworld-trading-company-interview/12129
- https://steamcommunity.com/app/271240/discussions/0/1486613649679786014/
- https://www.stardock.com/games/article/490528/beginners-guide-to-offworld-trading-company (not cited above)
- https://steamcommunity.com/app/415200/discussions/0/133262487499789652/
- https://steamcommunity.com/app/415200/discussions/0/3800526046832406060/
- https://steamcommunity.com/app/415200/discussions/0/133258593393940052/
- https://www.racefans.net/2016/08/10/meeting-man-behind-motorsport-manager/ (nothing usable)
- https://en.wikipedia.org/wiki/Motorsport_Manager (a stub with no mechanics)
- https://stratpack.blog/2021/08/27/motorsport-manager-review
- https://www.overtake.gg/threads/motorsport-manager-the-rd-review.128483/
- https://eriktwice.com/en/2021/06/18/food-chain-magnate-understanding-milestones/
- https://www.ultraboardgames.com/food-chain-magnate/milestones.php
- https://www.ultraboardgames.com/food-chain-magnate/game-rules.php
- https://en.wikipedia.org/wiki/Food_Chain_Magnate (a stub)
- https://en.wikipedia.org/wiki/Power_Grid
- https://www.myboardgameguides.com/game-strategy/game-specific-strategy/power-grid-strategy-tips-dos-and-donts/
- https://eriktwice.com/en/2021/01/15/brass-birmingham-understanding-the-industries/
- https://www.capitalismlab.com/beginners-guide-gameplay-basics/
- https://www.capitalismlab.com/resources/gameplay-faq/brand/
- https://www.capitalismlab.com/digital-age-dlc/selling-software-products/
- https://www.dbbaldwin.com/game-dev-tycoon-cheatsheet/
- https://steamcommunity.com/app/239820/discussions/0/1738841319813687597/
- https://steamcommunity.com/app/239820/discussions/0/864977564006487726/
- https://www.orderofgamers.com/downloads/BrassBirmingham_v1.2.pdf (all 4 pages, extracted with `pdftotext`)

Note: "read in full" for web pages means a fetch tool's summarising model processed the page; the subagent did not see
raw full text for those.

**Read partly:**
- ⚠️ https://steamcdn-a.akamaihd.net/steam/apps/271240/manuals/Offworld_Trading_Company_Almanac.pdf?t=1516298308 — 96 pages. Read: contents, pp. 6–17 and the Designer's Notes pp. 67–77. The rest was not read.
- ⚠️ https://mohawkgames.com/2014/06/16/offworld-rules/ — the page itself ends partway through section 14.2.
- ⚠️ https://steamcommunity.com/app/415200/discussions/0/208684375428273272/, https://steamcommunity.com/app/415200/discussions/0/1473096694438925979/ and https://steamcommunity.com/app/415200/discussions/0/133255957994221612/ — page 1 of 2 for each.
- ⚠️ https://www.ultraboardgames.com/power-grid/game-rules.php — the restocking and payout tables are not on the page.
- ⚠️ https://lehi-innovation.github.io/boardgame-rules/rules/brass-birmingham/ — market details are missing. The Order of Gamers PDF covered them instead.
- ⚠️ https://www.myboardgameguides.com/game-strategy/game-specific-strategy/food-chain-magnate-strategy-guide/ — the reader flagged it as incomplete. Not cited.

**Could not reach:**
- ⚠️ HTTP 402: https://offworldtradingcompany.fandom.com/wiki/Market, https://motorsportmanagerpc.fandom.com/wiki/Car_parts, https://gamedevtycoon.fandom.com/wiki/Review_Algorithm/1.4.4
- ⚠️ HTTP 403: https://www.f1manager.com/2024/news/car-development-research-guide, https://www.f1manager.com/en-US/2024/news/car-development-research-guide, https://cms.zaonce.net/en-GB/node/5806, https://boardgamegeek.com/blogpost/62868/power-grid-resource-market, https://boardgamegeek.com/thread/1594837/splotter-spellen-interview-for-the-goblin-magnific/page/2
- ⚠️ Bot-check page: https://simracingsetup.com/f1-manager/f1-manager-2024-research-vs-design/
- ⚠️ HTTP 429 (rate-limited on repeated tries): https://steamcommunity.com/sharedfiles/filedetails/?id=1146344676, https://steamcommunity.com/sharedfiles/filedetails/?id=216784744
- ⚠️ Not a thread (returned only the forum index): https://steamcommunity.com/app/271240/discussions/0/350542683193882628/
- Reaching the fan wikis and BoardGameGeek would need a logged-in browser session. Numbers that appeared only in search snippets, such as Offworld's "about 10 units bought raises the price by $1", are left out of this note.
