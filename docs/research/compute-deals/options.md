# Compute deal options for Arda

**Date:** 2026-10-26 · **Lane:** `gn-compute-deals` · **Status:** round 2, on the picker page; nothing built.

**Round 2 (2026-10-26 night).** Arda asked for research on the closest genre peers (tycoon and management games) and
for rival labs to be felt in every option. That research is `reports/Tycoon games supplier deals and rivals.md`. It
changed the set: **O3 is now "Contested deals"** (replacing the ripening row, which no tycoon supports) and **O7 is
now "Stakes and fire sales"** (replacing sealed bids, which become a sub-choice of O3). Every option has a
**Rivals** line. Each option has an in-game mockup in `mockups/shots/` (drawn by `mockups/O*.js` over the real game)
and an official reference screenshot in `mockups/refs/` (sources in `mockups/refs/SOURCES.txt`).

Read `diagnosis.md` first. Each option below says how it plays minute to minute in real time, what it fixes from the
diagnosis (numbers refer to its section 5 list), the files it would touch, its size, its risk to balance, and the
named sources it rests on. Sources are cited through the research notes in
`research_notes/Compute deals as gameplay/` and the synthesis in `reports/Compute deals as gameplay.md`; flags (⚠️)
from those notes carry over.

Sizes: **S** = a few files, one sitting. **M** = a mockup plus a balance round. **L** = a design round, a mockup, a
balance round and new bot policies.

Lane boundaries: screen layout and CSS belong to `gn-phone-redesign`; late-game rival rules in `sim/rivals.js` and
`sim/data/race.js` belong to `gn-improve` (its item A4, era 4–5 catch-up). Every option that touches those is marked.

---

## O1 · Free compute you can always see (safe)

**The idea.** Replace the two-handle compute bar with plain rows and one headline number, and give every compute
screen a way out.

**How it plays.** The budget dialog's compute box shows three rows with steppers: *Users* (serve everyone, 75% or 50%,
each with its cost printed: "about 4,000 users leave a month" or "$18M a month of spot"), *Safety* (5% steps) and
*Training* (what is left). Above them one line: **"Free for training: 12 units. A Medium run needs 15."** The Compute
HUD screen and the training dialog carry the same line and a **Get compute** button that opens the deal board. (The
Compute screen already shows a "Free for training" segment; this moves that number to where decisions are made and
sets it against the next run's need.) When no run fits for a whole round, a card offers three priced ways out: sign
the one-round card on the board now (named, with its price), serve fewer users, or rent spot for this run. One round
before contracts end together, the CFO warns: "All our cloud capacity ends in March."

**Fixes.** 1, 2 (the stall becomes visible, with its ways out), 3. Answers the shape of playtest item 8.

**Grounded in.** Factorio's power satisfaction bar and proportional slowdown (the shortfall is a visible number);
Oxygen Not Included's 2018 priority simplification after the developers called it "hard to understand"; Victoria 3
Dev Diary #74 (explain why something is blocked); the Cities: Skylines and Game Dev Tycoon slider complaints; Offworld
Trading Company's "numbers front and centre" (`videogames_realtime_markets_allocation.md`).

**Touches.** `ui/screens/budget.js`, `ui/logic/compute.js` (`computeBar`, `opinions`), `ui/screens/computeInfo.js`,
`ui/screens/recipe.js` (`computeHelp`), `sim/split.js` (serving cap as a share), `sim/data/advisorLines.js`, one new
card in `sim/data/events.js` and `ui/data/eventCopy.js`. **Layout: agree with `gn-phone-redesign`.**

**Rivals.** A "Training right now" line shows each rival's current run beside free compute; the stall card names
the rival that keeps training while you wait (Scaling Laws' "VS TOP MODEL" view).

**Size.** M. **Balance risk.** Low. Prices do not change. The stall card adds an exit, so era 2 throughput may rise;
measure with the bots.

---

## O2 · Size your own deal on a price ladder (medium)

**The idea.** Suppliers stop offering fixed lumps. Each supplier card has a ladder of prices: the first units are
cheap, each further block costs more. Rivals buy from the same ladders, and each round the ladder refills from the
expensive end.

**How it plays.** On the deal board the player drags a size on a supplier card and watches the price per unit climb
step by step ("first 10 units 1.0x, next 10 1.2x, next 10 1.5x"). Rivals' buys at the round's end take the cheap
steps first, so a supplier everyone wants is dearer next round. Buying just what the next run needs is cheap; buying
a year ahead costs more per unit but saves the next scramble.

**Fixes.** 5 (sizing becomes a choice), 4 (prices move with demand, so the board differs every run), part of 2.

**Grounded in.** Power Grid's resource market, confirmed from the official rulebook: buyers take the cheapest open
space, and the market refills a fixed amount from the most expensive empty space, so heavy buying ratchets prices up
(`games_auctions_drafting.md`; ⚠️ only part of the rulebook was read). Offworld Trading Company's one shared price
per resource that every trade moves (`videogames_realtime_markets_allocation.md`). The report ranks "one shared price
moved by everyone's buying" second of nine mechanics. Real prices rose, not fell: SemiAnalysis shows the H100 one-year contract price up
about 40% from October 2025 to March 2026 with on-demand sold out (`real_contracts_allocation_financing.md`).

**Touches.** `sim/contracts.js` (`generateOffers`, `signOffer`), `sim/rivalDeals.js` (rivals buy units, not cards),
`sim/data/compute.js`, `ui/logic/compute.js` (`dealCards`), `ui/screens/compute.js` (a size control on the card).
**Layout: agree with `gn-phone-redesign`.**

**Rivals.** Rival buys show on the ladder as struck-out steps with the rival's monogram the moment they happen
(Offworld's price jump), and the quarter-end line says who buys next.

**Size.** L. **Balance risk.** Medium. Rival compute flows through the ladder, which feeds rival model sizes
(`sim/rivals.js`, owned by `gn-improve`): coordinate.

---

## O3 · Contested deals (medium, new in round 2)

**The idea.** A few big cards each era show how many labs want them and the day a named rival takes them. The player
signs at the printed price, stalls once for a fixed fee (the date moves once), or lets it go; the rival then takes
the card and the feed says what it gained. Interest and dates come from the seeded schedule, so nothing is rolled.
Replaces the ripening row: no tycoon in the round 2 research has offers that get cheaper as they wait.

**Fixes.** 4 (a reason to act now and rivals to read), 9 (denial becomes a timed choice, not a fight), and the
end-of-round banner that acts on things the player was not racing for.

**Rivals.** Directly: a named rival, a count of interested labs and a date on the card, a side panel of every lab's
interest, and the rival's gain in the feed.

**Sub-choice.** How a contest is settled: sign before the date and stall once (recommended); open offers (match or
raise); or sealed bids once a quarter for the era 3 queue only (the round 1 O7).

**Grounded in.** Football Manager's transfer offer ("2 Interested Clubs", the other side's deadline, Accept, Stall,
Reject; the official FM26 image was viewed). Rise of Industry's per-region contract auctions with rival bidders and
the slowdown to speed 1 (⚠️ probable-developer forum replies through a summarising fetch). Mad Games Tycoon 2's
declined deals going to rival publishers (⚠️ keyword-filtered patch line). See the round 2 report, section N1.

**Touches.** `ui/logic/compute.js` (`dealCards`), `ui/screens/compute.js`, `sim/rivalDeals.js` (dated interest),
`sim/data/feed.js`. **Layout: agree with `gn-phone-redesign`.**

**Size.** M. **Balance risk.** Medium. The rival schedule must be designed and sized against today's rival takes.

---

## O4 · Forecast and commit (medium, the real lab tension)

**The idea.** Put the player's own forecast on the deal board. A small chart shows, for the next six rounds, what the
lab will need (users growing, the next run's size) against what it has committed. Every contract is a bet on that
line.

**How it plays.** The deal board's right panel becomes a forecast strip: committed compute as a stepped bar, the need
as a line, gaps shaded. Below the line is a stall or spot at 4x; above it is idle compute you pay for. Each card shows
how it would change the strip before you sign. Contracts get one dial: **firm** (cheapest, you pay every month) or
**flexible** (dearer, you can walk away with a round's notice). At each era's end the CFO grades the forecast ("we
paid for 40% idle compute this era").

**Fixes.** 3 (cliffs show as a cliff in the strip), 5, 8 (the grid reservation shows the power it buys in era 4 as a
step on the strip), and it makes the idle share of the bill a number the player steers.

**Grounded in.** The research ranks "take-or-pay against your own forecast" as the most legible real tension: the
Abilene expansion cut and Microsoft's 2 GW walk-back were driven by the buyers' changing forecasts; Anthropic's
SpaceX deal pairs a large monthly headline with a 90-day exit ⚠️ (S-1 terms seen only as search snippets)
(`real_contracts_allocation_financing.md`). Game side: Brass's loans (£30 now for three income levels), where a
commitment taxes every later turn and costs least when taken early ⚠️ (rule text from RulesPal, an AI-generated rules
site; check against the publisher rulebook); Offworld Trading Company's debt redesign, where Soren Johnson replaced a
permanent stock-price penalty with visible bond ratings (2–6% interest at A, 30% at D) so players could see the cost of
borrowing (`games_contracts_debt_shocks.md`).

**Touches.** `ui/logic/compute.js` (forecast), `ui/screens/compute.js` (strip), `sim/contracts.js` (firm and flexible
terms), `sim/economy.js` (`projectBurn`), `sim/data/advisorLines.js`. **Layout: agree with `gn-phone-redesign`.**

**Rivals.** The rivals' fleets from the news (signed, rumoured, announced) sit on the same timeline as the forecast
(Software Inc.'s release calendar, Mad Games Tycoon 2's rival announcements).

**Size.** M. **Balance risk.** Medium. Flexible terms make over-committing safer; price them so the over-committer
probe still runs out of money in most runs.

---

## O5 · Supplier weather: telegraphed shocks and strings that come due (medium)

**The idea.** The market changes on a schedule the player can see coming. Announced two rounds ahead: "HBM sold out
from April: chip orders slip two rounds", "Rubin ships in three rounds: older chips drop 40%", "CoreFlame's biggest
customer missed a payment". Each supplier card carries a health mark. Strings stop being footnotes: they come due as
cards.

**How it plays.** A weather strip on the deal board shows the next two or three announced changes with a countdown.
The player times signings around them: buy before the shortage, wait for the new chip, move off a sickly neocloud.
The Gulf campus shows its licence expiry date and a regional-risk mark. Letters of intent show the headline and the
"usually delivers" range. Shocks come from a seeded schedule announced in advance, so nothing is a surprise roll
(keeps the owner's 2026-09-26 "no dice" rule).

**Fixes.** 4, the dull strings in section 4, and gives the board something to read.

**Grounded in.** Pandemic's epidemic cards, spread one per equal pile so their count and spacing are fixed ⚠️ (rule
text from RulesPal, AI-generated); Frostpunk's announced storms ⚠️ (search snippets only); 1830's train phases, where
buying the first train of a new type starts a phase for everyone and some phases remove older trains (2-trains at
phase 4, 3-trains at phase 6) ⚠️ (RulesPal); Soren Johnson's Offworld black market, where a 50% pirate roll that
"felt streaky" became a fixed half-steal, and players' "bad bounce" complaints about Power Surge pushed the same
way (`games_contracts_debt_shocks.md`). Real side: neocloud stress
in October 2026 (CoreWeave bonds near 14.8%, S&P B+; Gartner's forecast that most independent neoclouds lose
independence by 2030); Rubin's 2026 share cut from 29% to 22% (TrendForce); the UAE's trusted-tier status for named
parties with an authorisation that expires in April 2027; drone strikes on Gulf data centres in March 2026
(`real_contracts_allocation_financing.md`, `real_power_sovereign_controls.md`).

**Touches.** `sim/contracts.js`, `sim/data/compute.js`, a seeded schedule in a new `sim/data/computeWeather.js`,
`sim/data/feed.js`, `sim/data/events.js` and `ui/data/eventCopy.js` (string cards), `ui/logic/compute.js`,
`ui/screens/compute.js`. **Layout: agree with `gn-phone-redesign`.**

**Rivals.** A side panel shows which rival rides which supplier, so a shock hurts some labs and spares others; some
weather is rival-made (a rival campus coming online raises spot).

**Size.** M. **Balance risk.** Medium. Shocks move many runs at once; size each one against existing effects
(project memory: check mechanic dynamics before and after).

---

## O6 · The compute exchange (experimental)

**The idea.** One live price per unit of compute, moving every day. Every buy pushes it up, every sell pushes it
down, and it drifts back. Spot buying and selling happen any day, with no team action. Contracts lock today's price
for their term, like a future.

**How it plays.** A ticker on the HUD shows the unit price and its trend. Rivals' buys show as spikes ("someone just
bought 40 units"), without saying who. Idle compute can be sold into the market at a discount (half price in the mockup), which replaces the resale toggle. A
shortfall can be covered by buying on the day, at whatever the price is. The question every few days: lock the
price now with a contract, or ride the market?

**Fixes.** 4 strongly, idle compute (sell it), and makes the deal board live in real time.

**Grounded in.** Offworld Trading Company: one game-wide price per resource that every player's trade moves, numbers
front and centre, and a price spike that tells everyone that someone bought, but not who (Soren Johnson's designer
notes; `videogames_realtime_markets_allocation.md`). Real side: CME and Silicon Data's H100 and B200 rental-index
futures, announced for October 2026 ⚠️ (search synthesis; the CME release timed out) and shown on 21 October as
pending review for a 9 November start ⚠️ (that page came back truncated) (`real_contracts_allocation_financing.md`).

**Touches.** New `sim/market.js`; `sim/contracts.js`, `sim/rivalDeals.js`, the day loop in `sim/turn.js`, `sim/split.js`
(resale), `tools/balance.js` (market policies for every bot), a new HUD element. **Layout: agree with
`gn-phone-redesign`; rival compute: coordinate with `gn-improve`.**

**Rivals.** Anonymous price spikes ("someone bought 40 units"); the team guesses who.

**Size.** L. **Balance risk.** High. A live price touches every ending; it needs its own balance round.

---

## O7 · Stakes and fire sales (experimental, new in round 2)

**The idea.** The equity card grows into stakes in suppliers, bought in steps that each cost more, giving first call
on capacity and a share of what rivals pay. One ownership bar per supplier shows who holds what, with a control line
at 50%. A rival that runs out of money sells its fleet on a dated, announced fire sale with its contents shown.

**Fixes.** Late money that, in one traced run, bought mostly idle compute (section 2), and rivals that never fail in ways the market
feels.

**Rivals.** As co-owners and threats ("OpenBrain can afford control of CoreFlame"), and as sudden supply on a known
date when one collapses.

**Grounded in.** Offworld's buyouts and stock prices, Capitalism Lab's 50% hostile takeover, Anno 1800 and Railway
Empire share stakes (⚠️ community sources only), COLD AISLE's liquidation lots (store text only; its lots are
"unknown", so Game Night's would show their contents). Round 2 report, section N2.

**Touches.** Equity deals in `sim/contracts.js`, supplier ownership, rival cash and late-game rules (`sim/rivals.js`,
owned by `gn-improve`), the feed.

**Size.** L. **Balance risk.** High. Ownership must pay off early or it reads as dull (the report's warnings).

---

## Recommended combination (round 2)

**O1 → O3 → O4 → O5.** O1 first (visibility, low risk). O3 second: it is the rivalry Arda asked for, no tycoon in
the research fills that space, and it builds on the board's existing "rival takes this card" rule. O4 third, with
rival fleets on its timeline. O5 fourth, which the round 2 report lifted into the recommended set. The report itself
ranked O2 third; O2 moves below O3 because it changes how rivals gain compute and needs `gn-improve`'s agreement. It
stays a strong pick if sizing is wanted too. O6 and O7 are the experimental edge.

## Round 1 recommendation (superseded)

**O1 + O4 + O2**, in that order. Revised after the report and the review: the first draft recommended O3 in third
place.

1. **O1 first**, because it makes the stall and the cliff visible and points at the ways out, which is what the
   playtester lacked. Its balance risk is low (prices do not change), though era 2 may get faster.
2. **O4 next**, because it turns idle bills and era cliffs into the player's own forecast, the tension the research
   ranks first, and it shows the grid reservation as a bet.
3. **O2 third**, because a forecast only matters if the player can choose how much to buy. A shared price ladder makes
   size a decision and makes prices move with everyone's buying, which the report ranks second of the game mechanics
   and which fits real 2026 prices (rising). It is the largest of the three and changes how rivals gain compute, so it
   needs `gn-improve`'s agreement (its item A4 changes late-game rival rules).

Round 1's O3 (the ripening row, now replaced) was the lighter alternative to O2 if the rival coordination is a problem: it adds timing with fewer rule changes,
but its sources are weaker (AI-generated rule summaries) and real prices move the other way. O5 is the best add-on
after the three. O6 and round 1's O7 (sealed bids, now a sub-choice of O3) were the experimental edge: O6 is the most alive and the
most dangerous to balance; sealed bids were a smaller swap for the era 3 queue only.
