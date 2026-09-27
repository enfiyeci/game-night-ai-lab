# Why the balanced bot runs out of money after the compute race (2026-09-26)

Diagnosis only. No file in the repository was changed; every experiment ran in scratch copies under
`<session scratchpad, not kept>/money/`
("before" = `e8da33d`, "after" = `HEAD` of `compute-race-design`, and `sw/` = HEAD with environment switches).

## Outcome

The root cause is the era 3 queue, not the era 4 board. One line in `sim/queue.js` `rivalOrders` caps each rival's
queue order at its shortfall (`Math.min(speed-relative order, rivalShortfall)`). By era 3 the rivals are already
close to their era 3 targets, because board cards, off-board growth and the queue's first fill have filled them. So
after the first era 3 round they order almost nothing. Rival orders drop from 108 units a round to 27, against a
release of 56. The queue stops rationing. The code comment says the cap means "the queue is never tighter than
before". In practice it is much looser.

The balanced bot then does four things, in this order:

1. **It gets about 14 times the era 3 compute.** The bot places a new standard order whenever nothing is waiting
   (`computeMove`: `!queue.order && !queue.carry && need > 0`). Before the change, its first order sat half-filled
   in the carry, so it ordered once and received about 11 units per run. Now each 56-unit order fills completely, so
   it orders again every round and receives 150 to 156 units per run (queue orders: 100 per 100 runs before, 249
   to 279 after). These are 24-month Verde contracts, so they carry into eras 4 and 5.
2. **The extra orders crowd out its era 3 fundraise.** The bot makes at most two moves a round, and "raise" is its
   lowest-priority move. In era 3 rounds 2 and 3, the run or release takes one slot and the queue order takes the
   other. Era 3 raises fall from 89 to 58 of 100 runs; raises in rounds 2 and 3 fall from 33 to 5. The runs that miss
   it show "startRun+queueOrder" (41) or "release+queueOrder" (24) in the round where they are in the danger zone
   and have not raised yet.
3. **It enters era 4 poorer and with higher bills, so it raises in era 4 instead.** Mean cash at the start of era 4
   is 1,702 against 3,052 before. Compute bills at that point are 366 a month against 209, and 255 units are online
   against 148. Era 4 raises rise from 49 to 84. An era 4 raise lifts cash above the Verde order's upfront payment
   (about 4,000), and the bot's shortfall is always large (point 4). So it signs a Verde order of about 1,000 units,
   about 1,200 a month on top of that upfront payment, and runs out of money one or two rounds later. On 400 seeds,
   every era 4 out-of-money ending, before and after, is a Verde signing after an era 4 raise. After the change, 38
   of the 54 are runs that skipped the era 3 raise; before, it was 4 of 18.
4. **The bigger fleet puts its shortfall where the letter of intent covers it.** The bot always plans an XL run. The
   recipe's cash cost (about 55) does not depend on model size and is always under half its cash, so
   `preferredRecipe` returns XL every time. An XL run in era 4 needs about 640 to 690 units. Before, with about 215
   units online, the shortfall was 601 to 900 units in 229 of 355 era 4 rounds. Only Verde's card is that big, and
   its upfront was usually unaffordable, so the bot signed nothing in 192 of those rounds. Now, with about 363
   online, most shortfalls are 361 to 600 or under 360 units. There the letter of intent (600 headline, about 876
   a month) is the cheapest card that covers it. `committedFreeUnits` counts a letter of intent at only 30% of its
   headline, so the shortfall stays open and the bot signs another. Second and later letters of intent in the same
   run rise from 23 to 61. That is the rise in letters of intent (successful signings in era 4 by my counter: 44
   before, 113 after) and most of the doubled era 5 bills. It is not the main cause of bankruptcy.

**The era 5 summit is a knock-on of the same cause, not of the stance formula.** In every variant, every summit the
bot proposed produced a deal, and all but 3 of them bound two cards. So "fewer deals bind two or more cards" really
means "fewer summits are proposed". The summit round always has a President meeting, which takes one of the two
move slots. The bot then fills the other slot with a release or a new run before it considers the summit. After
the change it has more free compute at the start of era 5, so a new run takes that slot in 29 of 107 summit rounds,
against 4 of 154 before (400 seeds). Add the extra era 4 bankruptcies, and the bot proposes summits in 28 of 400
runs, against 85 before.

**Evidence that this is the cause:** switching only the queue cap back to the old rule restores the old game. With
no new race heat (option F), 400 seeds: wins go from 9 to 58 (63 before), out of money from 76 to 46 (44 before),
runs reaching era 5 from 107 to 162 (154), summits from 28 to 75 (85), and cash entering era 4 from 1,909 to 3,072
(3,153). With every new mechanic switched back at once, the 100-seed results match `e8da33d` exactly. That checks
the switch set.

The correction in the brief is right: the letter of intent was on the board in every era 4 round before the change
too, and its size is fixed (`size: [20, 20]`). So a kept letter of intent is the same as a fresh one, and board
persistence does not explain the jump.

## Per-switch table

The balanced bot, seeds 1 to 100, on top of "no new race heat" (`BIG_DEAL_HEAT` = 0 and `DENIAL_HEAT` = 0). Each row
switches one new mechanic back to its old behavior. "Wins" means aligned, pacing deal or costly win. "Summits" means
summits proposed; every one formed a deal binding two cards. Bills are the monthly compute bills per round.
Letters of intent are successful era 4 signings.

| Switch | Wins | Out of money (era 4 / 5) | Reached era 5 | Summits | Cash entering era 4 | Bills, era 4 | Bills, era 5 | Letters of intent |
|---|---|---|---|---|---|---|---|---|
| Before (`e8da33d`) | 18 | 9 (2 / 7) | 39 | 22 | 3,052 | 593 | 822 | 44 |
| None (no new heat only) | 2 | 24 (18 / 6) | 28 | 8 | 1,702 | 816 | 1,786 | 113 |
| **Rival queue orders back to the speed-relative rule** | **15** | **14 (8 / 6)** | **40** | **18** | **3,009** | **632** | **602** | **29** |
| Rivals take no cards | 6 | 14 (8 / 6) | 30 | 10 | 2,888 | 677 | 984 | 65 |
| Board refreshes every round | 1 | 21 (19 / 2) | 21 | 3 | 1,954 | 842 | 1,757 | 117 |
| Rival gains back to the old formula | 3 | 26 (18 / 8) | 28 | 10 | 1,732 | 824 | 1,760 | 112 |
| Rank back to score only | 2 | 24 (18 / 6) | 28 | 8 | 1,702 | 816 | 1,786 | 113 |
| No off-board growth | 3 | 19 (17 / 2) | 25 | 5 | 1,740 | 835 | 1,841 | 109 |
| All of the above together | 18 | 9 (2 / 7) | 39 | 22 | 3,052 | 593 | 822 | 44 |

"Rivals take no cards" helps only through the queue. Rivals that take no cards stay short, so they keep ordering
from the queue (88 units a round). The queue rations again, the bot gets 33 units per run, and it raises in era 3
in 87 runs. The rank tie-break changes nothing at all in these runs.

The spec-literal rule ("orders from shortfall, replacing the speed-relative rule", spec §5), with each rival
ordering exactly its shortfall, measures the same as the current code: 2 wins, 25 out of money. So the spec's
wording has the same problem.

What is left after the queue revert: on 100 seeds, 15 wins against 18. On 400 seeds that is 58 against 63, and
adding "board refreshes every round" as well gives 63. So the persistent board costs at most a few wins in 400.
That is within run-to-run noise, and I did not trace it.

## Seed traces

The runs below are condensed from `trace.mjs` output. "e3.1" means era 3, round 2 (rounds count from 0).

**Seed 17: pacing deal before, out of money in era 4 after (option F).**

| Round | Before | After (F) |
|---|---|---|
| e3.0 | cash 44; raise | cash 44; raise (the same) |
| e3.1 | run small + queue 56; the queue gives OpenBrain 43, the others 6 and 7, the bot 0 | the same; rival fleets now have 67 to 87 units pending |
| e3.2 | rivals order 43/30/35, the bot gets 0, 56 carried; the order stays waiting | rivals order 0/0/0; the bot's 56 fills; it orders another 56 |
| e3.3 | carry still waiting; runs a medium model | the 56 fills again; orders another 56; runs a large model |
| e4.0 | cash 1,128, 90 online, bills 112 a month; no raise | cash 920, 258 online, bills 320 a month; **raise** |
| e4.1 | no deal: XL shortfall, no card it can cover and afford | cash 5,673; **signs Verde, 960 units** (about 4,000 upfront) |
| e4.2 | coasting, cash 831 | cash 1,204; signs a letter of intent (600) |
| e4.3 | cash 716 | cash −234, bills 1,512 a month |
| End | era 5 summit, pacing deal, cash 6,037 | out of money (acquihire) in era 4, cash −1,780 |

**Seed 84: pacing deal before, out of money in era 4 after (option F).**

| Round | Before | After (F) |
|---|---|---|
| e3.0 | release + queue 56 | the same |
| e3.1 | the bot gets 6, 50 carried | the bot gets 14, 42 carried |
| e3.2 | gets 6, carry 44; **release + raise**, cash 1,018 → 3,936 | rivals order 0; the bot gets 42; **release + queue 56** (no slot for the raise) |
| e3.3 | gets 5, carry 39 | gets 56; run large + queue 56 |
| e4.0 | cash 3,542, 133 online, bills 165 a month; no raise, no deal | cash 614, 258 online, bills 320 a month; **raise** |
| e4.1 | no deal all era (Verde's upfront is more than its cash) | cash 4,734; **signs Verde, 1,050 units** |
| e4.2 | coasting | cash −127 |
| End | summit, pacing deal, cash 2,292 | out of money in era 4 |

## Proposed fix

**Smallest rule change (recommended):** in `sim/queue.js` `rivalOrders`, drop the `Math.min(…, rivalShortfall)` cap
and order the speed-relative amount as before. Queue fills still land in rival fleets (spec rule 5), so rivals keep
the compute. The only change is that the queue rations again.

Measured on the balanced bot, before → with the fix:

| Heat setting | Seeds | Wins | Out of money | Reached era 5 | Summits | Rival disaster |
|---|---|---|---|---|---|---|
| F (no big-deal heat) | 100 | 2 → 15 | 24 → 14 | 28 → 40 | 8 → 18 | 2 → 4 |
| F | 400 | 9 → 58 (63 before the compute race) | 76 → 46 (44) | 107 → 162 (154) | 28 → 75 (85) | 7 → 13 |
| B (rival deals add no heat) | 400 | 5 → 40 | 75 → 37 | 83 → 126 | 20 → 54 | 55 → 71 |
| A (as built) | 400 | 2 → 9 | 33 → 19 | 35 → 59 | 6 → 17 | 241 → 269 |

Under A, rival disaster still decides most runs, so a heat option is needed as well. The queue fix and the heat
option are independent levers.

If the owner wants to keep the "orders from shortfall" rule, the alternative is to cut the era 3 release
(`QUEUE_RELEASE`) until the queue rations again. I did not measure that.

**Bot-only alternative (weaker):** let the balanced bot place one queue order per era. F, 100 seeds: 9 wins and 13
out of money. F, 400 seeds: 48 wins and 66 out of money. Adding "one letter of intent at a time" on top changes
little (9 wins and 13 out of money on 100 seeds). Making the raise the bot's first move instead makes things worse
(summits fall to 0).

**Bot weaknesses this change exposed.** Before the change, the scarce queue and unaffordable cards hid them. I did
not change any of them.

- `preferredRecipe` always picks XL, because the recipe's cash cost does not depend on size. So the bot always
  wants as much compute as exists.
- It orders from the queue on `need` rather than `shortfall`.
- "Raise" is its lowest-priority move.
- It signs a Verde order right after a raise even when the monthly bill will sink it.
- It proposes the summit only when no release or new run takes the slot first.

Part of the bot's old 18 wins came from being unable to buy compute in era 4. It signed nothing in 192 of 355 era 4
rounds.

## Coverage statement

**Read end to end in this session:**
- `docs/design/mockups/compute-race/measurements/options.md`, `balanced-cards.json` and `heat-sources.json`.
- `docs/superpowers/specs/2026-09-26-compute-race-design.md`.
- At HEAD: `sim/contracts.js`, `sim/rivals.js`, `sim/queue.js`, `sim/data/compute.js`, `sim/summit.js`,
  `sim/launch.js`, `sim/economy.js`, `sim/recipe.js`, `sim/turn.js` (in two reads that together cover all 579
  lines), `sim/data/eras.js` and `tools/balance.js`.
- `sim/rivalDeals.js` and `sim/data/race.js`, as whole new files in the `e8da33d..HEAD` diff.
- The full `e8da33d..HEAD` diff of `sim/` and `tools/`.

**Read in part or not at all:**
- ⚠️ `sim/training.js`: only lines 1 to 60 were read.
- ⚠️ `sim/state.js`: only its diff hunks were read.
- ⚠️ `sim/feed.js` and `sim/data/feed.js`: only their diff hunks were read.
- ⚠️ `sim/endings.js`, `sim/split.js`, `sim/power.js`, `sim/release.js`, `sim/data/summit.js` and `sim/data/cards.js`
  were not opened. The recipe cash cost of about 55 was measured by calling `recipeCost`, not read from the card
  table. The raise amount comes from `raiseRound` in `sim/economy.js`.
- ⚠️ The other measurement files were not opened: `after.json`, `before.json`, `variant-*.json`, `idle.json` and
  `check-speed-no-deny.json`. Their numbers are quoted only through `options.md`.

**Scratch scripts**, all in the scratchpad folder above: `run.mjs`, `trace.mjs`, `era3.mjs`, `era4.mjs`,
`era4b.mjs`, `crowd.mjs`, `summit.mjs` and `oom4.mjs`. The switch patches are `patch.py`, `patch2.py` and
`patch3.py`, applied to `sw/`. With no switch set, `sw/` reproduces HEAD's balanced numbers exactly (0 wins, 64 rival
disasters, 9 out of money).
