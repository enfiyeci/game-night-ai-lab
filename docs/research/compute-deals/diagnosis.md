# Compute deals today: a diagnosis

**Date:** 2026-10-26 · **Lane:** `gn-compute-deals` · **Build measured:** `origin/main` 28cdc52 · **Revised** the same
day after a fresh Opus review (verdict REVISE, all 21 findings accepted; see "Review" at the end).

This note says what the player decides about compute in the current build, which of those decisions are real, where
the system confuses, and where it is dull. It comes from three sources, all from this session:

- reading the specs (`docs/superpowers/specs/2026-09-25-compute-gathering-design.md`,
  `docs/superpowers/specs/2026-09-26-compute-race-design.md`), the earlier research
  (`docs/research/compute-mechanics/report.md` and its four notes) and the code (`sim/contracts.js`, `sim/split.js`,
  `sim/queue.js`, `sim/rivalDeals.js`, `sim/rivals.js`, `sim/power.js`, `sim/training.js`, `sim/data/compute.js`,
  `sim/data/race.js`, `ui/screens/compute.js`, `ui/screens/budget.js` (the compute bar), `ui/screens/computeInfo.js`,
  `ui/screens/sites.js`, `ui/screens/raceBoard.js`, and the parts of `ui/logic/compute.js` and `ui/screens/recipe.js`
  that build the deal cards, the advisor lines and the "not enough free compute" help);
- playing era 1 in the real game on 127.0.0.1:8763 (screenshots in `evidence/`);
- bot runs: `node tools/balance.js 200` (saved as `tools-probes/balance-200-seeds.json`) and read-only probes that
  drive the existing bots through `tools/play-round.js` (`tools-probes/`). The `review-*.mjs` probes were written by
  the reviewer and re-run here with the same output; they sample every story day, not only round ends.

**The bots are not players.** Every bot follows a fixed deal policy in `tools/balance.js` (`computeMove`): at most one
compute move a round, chosen by simple rules. Several findings below are as much about those rules as about the game.
Each finding says which.

Two files listed in the brief are not about compute deals: `ui/screens/deal.js` is the Geneva summit deal, and
`ui/screens/racks.js` is the AI-automation approvals panel. They were read in full and are left out below.

## 1. What the player decides about compute

| Decision | Where | How often | Real or obvious today |
|---|---|---|---|
| Which card to sign from the board (Verde chip order, Azuria cloud, CoreFlame neocloud, spot, equity, Gulf, letter of intent) | Floor menu, then Company, then "Sign a compute deal"; also a "Compute deals" link in "Plan the years ahead" | Up to once a round, costs one of two team actions | **Mostly obvious.** CoreFlame is cheap (1.1x base), fast (one round), has no upfront and only a mild string. The balanced bot signs it 276 times in 100 runs. Azuria at 2x is a worse CoreFlame unless you need its size. Spot at 4x is never worth it on purpose. The real choice is era 1's "Verde: cheap but 9 months away and $140M upfront" against "CoreFlame now". |
| Whether to take a card a rival has named | Same board | Every round | **Unclear, and probably a trap.** In era 1 every non-spot card was named in the play-through. Taking one costs +2 race heat; the rival takes its second choice, and a quarter of its shortfall arrives off the board anyway. The effect of incidental denial on endings was not measured (see section 2). |
| How much to buy | — | — | **Not a decision.** Card sizes are fixed by rank. The player picks a card, never a size. |
| Era 3 queue: standard or prepaid, and order size | Queue dialog | Era 3 rounds | **Real but narrow.** Prepaid buys priority for 15% upfront and race heat. |
| Grid reservation in era 2 or 3 | Strip under the board | Once | **Decisive and quiet** (section 2). |
| Era 4 site: gas or nuclear | Power sites dialog | Once or twice | **Real** (speed against public trust), but one-shot. |
| Safety share of compute | Budget, compute bar | Any time | **Real.** It drives alignment debt and the pledge. |
| Serving cap, cover with spot, resell idle | Budget, compute bar and toggles | Any time | **Set and forget.** Defaults are fine; the cap matters only when stuck (section 3). |
| Scale down, break, buy out a contract | Commitments panel | Any time | **Unmeasured.** No bot has a policy for these actions, so the bots never use them and say nothing about whether players would. |

So the deal board offers about one real choice per era (era 1 timing, era 3 tier, era 4 site), and most other deal
visits are "sign CoreFlame when short".

## 2. Measurements

### Idle compute is a large, steady share of the bill

Share of the monthly compute bill paying for idle units, averaged over every story day (20 seeds, the UI's own
`idleComputeCost` divided by the bill; `tools-probes/review-idle-daily-20-seeds.txt`):

| Era | balanced | careful | speed |
|---|---|---|---|
| 1 | 39% | 24% | 24% |
| 2 | 4% | 22% | 8% |
| 3 | 31% | 38% | 41% |
| 4 | 34% | 30% | 24% |
| 5 | 19% | 25% | — |

Deals arrive in lumps larger than the next run needs, so a quarter to two fifths of what the player pays for often
waits. An earlier version of this note used round-end snapshots (52%, 4%, 41%, 48%, 31% for balanced). Those fall
just after a run ends, are shifted by one round across era boundaries, and overstate the share; the daily averages
replace them.

### Era 2 stalls for some policies, and the way out is not shown

In era 2, run sizes triple (`ERA_SCALE` 1 to 3) while the first model's users grow. For the balanced bot, serving
takes about 84% of online compute on an average era 2 day, and no training run fits the free compute on 7,132 of
7,280 era 2 days (20 seeds, `review-stall-check-20-seeds.txt`). The speed bot stalls on 5,785 of 7,280 days.

But the stall is escapable. In 40 of the balanced bot's 60 stalled planning moments, a one-round CoreFlame or Azuria
card was on the board, affordable, and big enough for a Small run. For the speed bot it was 54 of 54. The bots miss
it because of their rules: one compute move a round; Verde chips still in transit count as free; the "cheapest
covering" rule picks a three-round Verde order sized for an XL run; and the speed bot signs only Verde. The careful
bot never stalls in era 2 (0 of 7,280 days), but not because of its deals (it signs only the grid reservation and a
Verde order there): its users take about 35% of its compute against the balanced bot's 84%
(`review-r2-serving-rank-20-seeds.txt`). In seed 7 (`trace-balanced-seed7.txt`), online
compute sits at 30, 30, then 21 units while users need 34 to 44, a 36-unit CoreFlame card stays unsigned for three
rounds, and the bot signs a grid reservation and a Verde order instead.

So the game's problem is not that the stall is unavoidable. It is that nothing tells the player the stall is
happening, why, or that a one-round card would end it. This matches the shape of the playtester's report
(`docs/playtests/2026-10-14-itch-feedback.md`, item 8, quoted as written: "I couldn't find a way to free computer to
start a new training run an basically got stuck"). The playtester does not say which era; tying it to era 2 is an
inference. The fix in 28cdc52 rechecks a paused run's compute; it does not address this.

The stall is also nearly invisible in the race: the balanced bot is still ranked first at 62 of 80 era 2 round marks
(78%), so being stuck costs little the player can see. A stall that hurts nothing reads as a bug, not as a squeeze.

### The era 2 to 3 contract cliff

The starter cloud (24 months) and CoreFlame (12 months) contracts end together at the era change. For the balanced
and careful bots, online compute is 0 at the first era 3 round mark on 50 of 50 seeds (`probe3.mjs`), and 0 for most
of that first round (514 and 513 of 600 days over 20 seeds). The cover-with-spot toggle then buys serving at 4x. The
speed bot avoids it because it ordered Verde chips earlier. The commitments panel shows months left per contract, but
nothing warns that they all end at once.

### Late money: affordable big deals in one traced run

In seed 7, era 4 jumps from 126 to 926 units online with about 730 idle after a raise, and cash reaches $5.6B in era
4 and $10.4B in era 5. Across seeds the picture is mixed: the balanced bot's median runway is lowest in eras 4–5
(5.3 and 5.6 months, against 9.2, 7.6 and 9.5 earlier), and compute is 82% and 91% of its burn there. So money still
binds in the aggregate; what the trace shows is that a single raise can make a very large, mostly idle deal
affordable.

### The era 2 grid reservation is a large, quiet lever

From the full report (`tools-probes/balance-200-seeds.json`):

| Bot | With the era 2 grid reservation | Without it |
|---|---|---|
| balanced | 5 overtaken of 200 | 69 overtaken of 200 |
| careful | 193 aligned, 7 rival disaster | 200 overtaken |

The balanced comparison is the fair one. The careful comparison is confounded: in `tools/balance.js` the `grid` flag
also switches on the careful bot's only era 4 buying rule (Verde chips sized to its power), so without it the
careful bot signs nothing at all in era 4 and stays at 126 units, although self-powered Azuria and CoreFlame cards
are on the board (`review-nogrid-10-seeds.txt`). Even so, 5 against 69 overtaken shows a cheap reservation
($50M, one team action, a full era before it pays off) moving the late game a lot. Nothing in era 2 tells the player
that. Planning ahead should pay (spec target 3), but a lever this strong and this quiet reads as a trap, not a plan.

### The denier probe is confounded

The `denier` probe (balanced, but takes the largest card any rival named) ends left behind 19 times and overtaken 15
times in 200 runs, against 0 and 5 for plain balanced. Its deny rule also skips the "can we carry this bill" check
the normal path uses, so the worse endings cannot be split between "denying rivals" and "signing the biggest card
without checking the bill". The mechanism (heat, worse cards, rivals still growing off the board) is plausible from
the code but not measured.

### Other balance-report readings

- The over-committer probe ends out of money in 200 of 200 runs, but all in era 2; spec target 1 asks for "mostly in
  eras 3–4". Hand-to-mouth (spot only) wins 21 of 200, 10.5%, just over target 2's 10% cap.
- The era 3 queue leaves a lab short in every era 3 round (800 of 800).
- Compute is 82% of the balanced bot's burn in era 4 and 91% in era 5, above the spec's 40–70% target band.
- The careful bot is starved in era 5: no run fits on 49% of its era 5 planning moments.

### The bots sign the same cards every run

Offer sizes depend only on the player's rank, with no random roll (owner rule 2026-09-26: no dice). The bots are
deterministic, so runs of one bot sign almost the same cards (100 grid reservations and 100 queue orders in 100
balanced runs). That shows the bots' rigidity more than the board's; the board itself changes only with rank, which
is still little variety for a human to read.

### Era 5 has few deals

Two cards remain (CoreFlame and spot). The planned bots sign nothing there; the random bot signs 0.73 deals a round.

## 3. Where it confuses

1. **The compute bar in the budget dialog** (`ui/screens/budget.js`, "Compute · drag the handles";
   `evidence/budget-compute-bar-era1.jpg`). Two handles sit on one bar. The left one is the safety share. The right
   one is the serving cap, but it sits at the far right edge when there is no cap, where it reads as "the end of
   training". The serving segment is drawn at the left, so dragging the right handle does nothing visible until it
   passes the small "users need" marker. Training has no handle; it is whatever is left. This is the most likely
   source of "confusing, I think it was bugged".
2. **The way to get compute is easy to miss.** The deal board is two menus deep (floor menu, Company, Sign a compute
   deal). The HUD's Compute button opens an information screen (`evidence/compute-info-era1.jpg`) that shows "Free
   for training, N units" but has no button to the deal board. Links to deals exist only in the training dialog's
   help line (`computeHelp` in `ui/screens/recipe.js`) and on the Compute line of "Plan the years ahead"
   (`ui/screens/finance.js`).
3. **The way out of a stall is hidden.** When serving takes everything, the bar's only lever is to cap serving, which
   means outages or spot bills, and the bar does not say so. Nothing says that a one-round card on the deal board
   would end the stall.
4. **Cards carry a lot of reading.** Each card shows size, arrival, upfront, monthly, term, price, a string chip,
   an explanation, a rival banner and a fallback line (`evidence/deal-board-era1.jpg`). Nine to eleven facts per
   card, four to six cards per board.
5. **No Cancel button on the deal board.** It closes on the veil or Escape. (Screen layout belongs to
   `gn-phone-redesign`; noted for them.)

## 4. Where it is dull

- **No timing pressure.** Cards stay until signed or taken, rivals take them on a fixed schedule at the round's end,
  and prices never move. There is no reason to act now rather than next round, except a rival's banner.
- **No reading of rivals.** Rival appetite is fixed and printed on the cards. Nothing hidden needs inferring.
- **Strings rarely bite.** CoreFlame's fragility is a refinancing card at month 11. Azuria's exclusivity blocks
  CoreFlame and the Gulf campus, which matters only if you wanted them. The Gulf string appears in eras 3–4 and the
  letter of intent in era 4 only; they are the most interesting strings and the latest.
- **Compute is a cost line, not a stake.** Being stuck in era 2 does not change rank, and the bots' late idle units
  do not show in the race. The decisions do not feed back into the race strongly enough to feel.

## 5. What a fix has to do (input to the options)

1. Put "free for training" against what the next run needs on every compute screen, with a one-click way to get more.
2. Make the era 2 stall visible as it happens, say why, and point at the ways out with their prices (a one-round
   card, serving fewer users, spot).
3. Warn about contract cliffs before they happen.
4. Give the deal board a reason to act now (timing, scarcity, moving prices) and something to read (rivals' intent).
5. Make sizing a choice, so over-buying and under-buying are both possible and both cost something.
6. Keep the card count and the reading load down; add tension through fewer, sharper numbers.
7. Keep compute tied to the race, so being short or long shows on the whiteboard.
8. Make the decisive long bets (the era 2 grid reservation) visible as bets, with a forecast of what they buy.
9. Either give denial a payoff the player can see, or stop presenting rival-named cards as something to fight over.

## Review

A fresh Opus reviewer checked this note, `options.md`, the picker and the probes against the code and the saved
outputs (verdict REVISE). All 21 findings were accepted and fixed in one wave. The main ones: the era 2 stall and the
careful grid comparison were partly bot-policy results; the idle table used biased round-end snapshots; the contract
actions were never measurable; the "money stops binding" and "no era 5 deals" claims contradicted the data; two UI
claims were wrong (a deals link exists in "Plan the years ahead", and "Free for training" is already shown); and the
denier probe is confounded. The reviewer's three probes are kept in `tools-probes/review-*.mjs` with their output.

## Coverage

Read to the end in this session: the two specs, the report and all four notes in `docs/research/compute-mechanics/`,
the playtest file, and every code file named in the brief. ⚠️ `ui/logic/compute.js` (717 lines) and
`ui/screens/recipe.js` (760 lines) were read only in the parts named above. ⚠️ `tools/balance.js` was read in the
parts that define the bots' compute policies and the measured loop, not its reporting code. ⚠️ `ui/screens/finance.js`
was not read; the deals link in it comes from the reviewer and a search hit (`ui/screens/finance.js:289`). The
play-through covered era 1 only. ⚠️ The era 2 stall and the era 3 cliff are measured with bots, not seen in a human
play-through.
