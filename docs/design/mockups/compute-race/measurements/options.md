# Compute race: retune options for the owner (2026-09-26)

## Outcome

Rival disaster is now the most common ending, and the heat from rival card deals causes most of it. Taking that heat
away (option B) cuts the balanced bot's rival disasters from 64 to 15 of 100, and the safety bot's from 22 to 2. It
does not bring the wins back. The balanced bot won 18 of 100 runs before the compute race and wins 0 to 2 under every
option measured here. So a second cause is at work: in eras 4 and 5 the balanced bot signs about twice as many compute
deals as before, its compute bills rise by 38% in era 4 and more than double in era 5, and it runs out of money more
often. Fewer of its runs reach the era 5 summit, and fewer summits end in a deal. No heat option fixes that.

Two more findings the owner should see first:

1. **The new speed bot runs out of money in era 2 on all 100 seeds.** Task 7 told it to sign any card OpenBrain names
   whenever it can pay the upfront cost. It does that about 2.4 times a run, and those are all the deals it signs.
   With that rule turned off, the speed bot plays as it did after Tasks 2 to 6 (out of money 31, rival disaster 27,
   removed by the board 28, misalignment 14). This breaks the test "most runs of the extreme strategies end in eras 3
   or 4" (speed: 0 of 200). The denier probe has the same problem: 35 of its 100 runs run out of money in era 2.
2. **`RIVAL_EDGE` is not the lever for the win drop.** Option E (edge −4 instead of −2) leaves every ending count
   within 4 of option A. It does fix a different problem: an idle player is left behind at the era 1 gate on 8 of
   seeds 1 to 50 with edge −4, against 31 of 50 now and 9 of 50 before the compute race.

My recommendation is option B, possibly with E: details and the trade-off are at the end.

No constant and no test threshold was changed. Every variant ran in a scratch copy of the repository with temporary
switches; the committed code is option A, exactly as built.

## The options

| Option | What changes | Spec rule 7 kept? |
|---|---|---|
| A | Nothing: as built, to the spec. | Yes |
| B | Rival card deals add no heat. The player's big deals (+2) and denials (+2) still do. | Player half only |
| C | Big-deal heat from rivals counts at most once per round in total (+2 a round at most). | Softened |
| D | A rival's deal is "big" only at 50% of its fleet, not 25%. The player's line stays at 25%. | Softened |
| E | As built, but `RIVAL_EDGE` = −4 (was −2). Shows how much of the win drop comes from rival gains. | Yes |
| F (extra) | No big-deal heat at all, from rivals or the player. Denial heat stays. Added because B left 15 rival disasters. | Denial heat only |
| B + E (extra) | B and E together, to check whether they combine cleanly. | Player half only |

"Wins" below means aligned + pacing deal + costly win (`pyrrhic`). All runs: 100 seeds, `node tools/balance.js 100`.

## Summary: rival disaster and wins, out of 100

| Bot | Before (Task 1) | A | B | C | D | E | F | B + E |
|---|---|---|---|---|---|---|---|---|
| speed: rival disaster / wins | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| safety: rival disaster / wins | 0 / 0 | 22 / 1 | 2 / 0 | 11 / 1 | 19 / 0 | 22 / 1 | 0 / 1 | 2 / 0 |
| balanced: rival disaster / wins | 1 / 18 | 64 / 0 | 15 / 1 | 52 / 0 | 52 / 0 | 64 / 0 | 2 / 2 | 15 / 1 |
| random: rival disaster / wins | 2 / 0 | 24 / 0 | 7 / 0 | 10 / 0 | 19 / 0 | 20 / 0 | 0 / 1 | 8 / 0 |
| denier: rival disaster / wins | — | 39 / 0 | 16 / 0 | 32 / 0 | 40 / 0 | 39 / 0 | 3 / 0 | 16 / 0 |
| idle player, left behind at era 1 (of 50) | 9 | 31 | 31 | 31 | 31 | 8 | 31 | 8 |

## Full tables per option

"Before (Task 1)" is `before.json`, measured on the code before the compute race (commit `e8da33d`). It has no
denier row because that bot did not exist.

### Before (Task 1), for reference

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 30 (era 2: 30) | 40 | 30 | 0 (0 / 0 / 0) | 88% | — | 0.0 |
| safety | 0 | 5 (era 2: 5) | 93 (era 1: 4, era 2: 3, era 3: 25, era 4: 40, era 5: 21) | 2 | 0 | 0 (0 / 0 / 0) | 53% | 1.02 | 0.0 |
| balanced | 1 | 0 | 9 (era 4: 2, era 5: 7) | 65 | 7 | 18 (3 / 15 / 0) | 94% | 1.00 | 0.0 |
| random | 2 | 0 | 64 (era 1: 20, era 2: 41, era 3: 1, era 4: 1, era 5: 1) | 14 | 19 | 0 (0 / 0 / 0) | 69% | 1.13 | 0.0 |

Random also had 1 misuse ending.

### A: as built (`after.json`)

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 100 (era 2: 100) | 0 | 0 | 0 (0 / 0 / 0) | 68% | — | 8.4 |
| safety | 22 | 2 (era 2: 2) | 75 (era 2: 3, era 3: 42, era 4: 25, era 5: 5) | 0 | 0 | 1 (1 / 0 / 0) | 59% | 1.00 | 12.2 |
| balanced | 64 | 0 | 9 (era 4: 8, era 5: 1) | 20 | 7 | 0 (0 / 0 / 0) | 91% | 1.00 | 14.4 |
| random | 24 | 0 | 71 (era 1: 19, era 2: 50, era 3: 2) | 0 | 4 | 0 (0 / 0 / 0) | 58% | 1.00 | 8.6 |
| denier | 39 | 0 | 36 (era 2: 35, era 5: 1) | 15 | 10 | 0 (0 / 0 / 0) | 82% | 1.00 | 12.4 |

Random also had 1 misuse ending. The speed bot never reaches the end of era 4, so it has no rank there.

### B: rival deals add no heat (`variant-B.json`)

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 100 (era 2: 100) | 0 | 0 | 0 (0 / 0 / 0) | 68% | — | 8.4 |
| safety | 2 | 2 (era 2: 2) | 95 (era 2: 3, era 3: 41, era 4: 38, era 5: 13) | 1 | 0 | 0 (0 / 0 / 0) | 61% | 1.02 | 12.7 |
| balanced | 15 | 0 | 24 (era 4: 18, era 5: 6) | 52 | 8 | 1 (1 / 0 / 0) | 92% | 1.00 | 16.0 |
| random | 7 | 0 | 70 (era 1: 19, era 2: 48, era 3: 2, era 5: 1) | 7 | 10 | 0 (0 / 0 / 0) | 61% | 1.00 | 9.3 |
| denier | 16 | 0 | 39 (era 2: 35, era 4: 3, era 5: 1) | 33 | 12 | 0 (0 / 0 / 0) | 83% | 1.00 | 13.3 |

Random also had 6 misuse endings.

### C: rival big-deal heat at most +2 a round (`variant-C.json`)

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 100 (era 2: 100) | 0 | 0 | 0 (0 / 0 / 0) | 68% | — | 8.4 |
| safety | 11 | 2 (era 2: 2) | 86 (era 2: 3, era 3: 41, era 4: 33, era 5: 9) | 0 | 0 | 1 (1 / 0 / 0) | 60% | 1.02 | 12.7 |
| balanced | 52 | 0 | 16 (era 4: 14, era 5: 2) | 23 | 9 | 0 (0 / 0 / 0) | 92% | 1.00 | 15.6 |
| random | 10 | 0 | 71 (era 1: 19, era 2: 48, era 3: 2, era 4: 2) | 7 | 11 | 0 (0 / 0 / 0) | 60% | 1.00 | 9.1 |
| denier | 32 | 0 | 39 (era 2: 35, era 4: 3, era 5: 1) | 18 | 11 | 0 (0 / 0 / 0) | 83% | 1.00 | 12.9 |

Random also had 1 misuse ending.

### D: a rival's big-deal line at 50% of its fleet (`variant-D.json`)

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 100 (era 2: 100) | 0 | 0 | 0 (0 / 0 / 0) | 68% | — | 8.4 |
| safety | 19 | 2 (era 2: 2) | 79 (era 2: 3, era 3: 41, era 4: 27, era 5: 8) | 0 | 0 | 0 (0 / 0 / 0) | 59% | 1.00 | 12.5 |
| balanced | 52 | 0 | 11 (era 4: 10, era 5: 1) | 30 | 7 | 0 (0 / 0 / 0) | 91% | 1.00 | 15.2 |
| random | 19 | 0 | 69 (era 1: 19, era 2: 48, era 3: 2) | 2 | 9 | 0 (0 / 0 / 0) | 58% | 1.00 | 8.7 |
| denier | 40 | 0 | 38 (era 2: 35, era 4: 1, era 5: 2) | 12 | 10 | 0 (0 / 0 / 0) | 82% | 1.00 | 12.5 |

Random also had 1 misuse ending. Most rival deals still add half the rival's fleet or more, so D helps little.

### E: `RIVAL_EDGE` = −4 (`variant-E.json`)

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 100 (era 2: 100) | 0 | 0 | 0 (0 / 0 / 0) | 77% | — | 8.4 |
| safety | 22 | 1 (era 2: 1) | 76 (era 2: 3, era 3: 42, era 4: 26, era 5: 5) | 0 | 0 | 1 (1 / 0 / 0) | 68% | 1.00 | 12.3 |
| balanced | 64 | 0 | 9 (era 4: 8, era 5: 1) | 20 | 7 | 0 (0 / 0 / 0) | 92% | 1.00 | 14.4 |
| random | 20 | 0 | 71 (era 1: 19, era 2: 48, era 3: 3, era 4: 1) | 1 | 7 | 0 (0 / 0 / 0) | 67% | 1.00 | 8.7 |
| denier | 39 | 0 | 36 (era 2: 35, era 5: 1) | 15 | 10 | 0 (0 / 0 / 0) | 88% | 1.00 | 12.4 |

Random also had 1 misuse ending.

### F (extra): no big-deal heat at all (`variant-F.json`)

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 100 (era 2: 100) | 0 | 0 | 0 (0 / 0 / 0) | 68% | — | 8.4 |
| safety | 0 | 2 (era 2: 2) | 95 (era 2: 3, era 3: 41, era 4: 38, era 5: 13) | 2 | 0 | 1 (1 / 0 / 0) | 61% | 1.02 | 12.7 |
| balanced | 2 | 0 | 24 (era 4: 18, era 5: 6) | 60 | 12 | 2 (1 / 1 / 0) | 92% | 1.00 | 16.0 |
| random | 0 | 0 | 70 (era 1: 19, era 2: 48, era 3: 1, era 4: 2) | 13 | 14 | 1 (1 / 0 / 0) | 62% | 1.00 | 9.2 |
| denier | 3 | 0 | 42 (era 2: 35, era 4: 4, era 5: 3) | 40 | 15 | 0 (0 / 0 / 0) | 84% | 1.00 | 13.4 |

Random also had 2 misuse endings.

### B + E (extra) (`variant-BE.json`)

| Bot | Rival disaster | Left behind | Out of money | Misalignment | Board removed | Wins (aligned / pacing deal / costly) | Rounds at 1st | Rank, end of era 4 | Rival deals per run |
|---|---|---|---|---|---|---|---|---|---|
| speed | 0 | 0 | 100 (era 2: 100) | 0 | 0 | 0 (0 / 0 / 0) | 77% | — | 8.4 |
| safety | 2 | 1 (era 2: 1) | 95 (era 2: 3, era 3: 41, era 4: 39, era 5: 12) | 2 | 0 | 0 (0 / 0 / 0) | 69% | 1.00 | 12.8 |
| balanced | 15 | 0 | 24 (era 4: 18, era 5: 6) | 52 | 8 | 1 (1 / 0 / 0) | 93% | 1.00 | 16.1 |
| random | 8 | 0 | 69 (era 1: 19, era 2: 46, era 3: 2, era 4: 1, era 5: 1) | 9 | 9 | 0 (0 / 0 / 0) | 70% | 1.00 | 9.4 |
| denier | 16 | 0 | 39 (era 2: 35, era 4: 3, era 5: 1) | 33 | 12 | 0 (0 / 0 / 0) | 89% | 1.00 | 13.4 |

Random also had 5 misuse endings. Every count is within 2 of option B.

## Where the heat comes from

Heat added per round played, by source, for the balanced bot (100 seeds; `heat-sources.json`, which also has the
safety bot). Heat decays by 1 a round; rival disaster becomes possible above 85.

| Source | Before | A | B | F |
|---|---|---|---|---|
| Own model releases | 3.45 | 3.57 | 3.65 | 3.65 |
| Rival launches | 3.18 | 2.92 | 3.17 | 3.19 |
| Rival big deals (new) | — | 1.79 | — | — |
| Player big deals (new) | — | 0.76 | 0.75 | — |
| Player denials (new) | — | 0.17 | 0.14 | 0.14 |
| Heat on entering era 5 (mean) | 74.9 | 98.9 | 91.6 | 78.5 |
| Runs that reached era 5 | 39 | 7 | 24 | 28 |
| Summit deals that bound two or more cards | 22 | 2 | 7 | 8 |

Rival big deals are the largest new source. The player's own big deals are the second: that is why B still leaves
15 balanced rival disasters and F leaves 2. Under F, heat on entering era 5 is back near the old level (78.5 against
74.9), yet only 8 summit deals form against 22 before. So the summit shortfall under F is not heat. I did not trace it;
the stance formula also subtracts each rival's gap behind the leader, which the new rival fleets change.

## Why the wins do not come back

Under F, with rival disasters back at the old level, the balanced bot still wins only 2 of 100. What changed is money
and survival in eras 4 and 5:

- Out of money: 24 (18 in era 4) under B and F, against 9 (2 in era 4) before.
- Compute bills per round: era 4 816 against 593 before (+38%); era 5 1,786 against 822 (×2.2).
- In era 4 the bot signs about 198 deals per 100 runs against 112 before. Letters of intent alone: 134 against 54
  (`balanced-cards.json`).

My guess, not checked: the board now keeps its cards between rounds, so the letter of intent is on offer every round
in era 4, where before it came and went with the random refresh; and rivals take the big Verde cards first. The bot
covers its shortfall with whatever is cheapest on the board, and that is now the letter of intent again and again.
This needs its own look before any heat option is judged on wins.

## The speed bot and the denier probe (Task 7)

The Task 7 rule "deny OpenBrain whenever the bot can pay" has no check on whether the bot needs the compute or can
carry the monthly bill. The speed bot signs about 2.4 denials a run (at most 3), and it signs no other deal. It runs
out of money in era 2 on 100 of 100 seeds. With the rule off (`check-speed-no-deny.json`), it returns to its Tasks 2
to 6 numbers. The denier probe runs out of money in era 2 on 35 of 100 for the same reason. The safety bot's new
"never take a named card" rule works as meant: it signs no named card (the Task 7 test checks this on seeds 1 to 3, and
`heat-sources.json` shows no denial heat for it). Its rival disasters fell from 35 (after Tasks 2 to 6) to 22 and its
out-of-money endings rose from 57 to 75, most likely because it no longer adds denial heat by accident; I did not
measure that link directly.

This may be the bots overdoing it rather than a game problem: denying a rival costs real money, which is the design.
A deny rule that fires only when the bot also has a shortfall, or once an era, would show what a sensible denier does.
That is a bot change the owner should pick; I did not make it.

## Idle player, left behind at the era 1 gate

Empty actions every round, seeds 1 to 50 (`idle.json`): before the compute race 9 of 50; A, B, C, D and F 31 of 50;
E and B + E 8 of 50. Heat plays no part here. Rival fleets grow and train bigger models in era 1, and a smaller
`RIVAL_EDGE` offsets that.

## Recommendation

**Option B: rival card deals stop adding heat; the player's big deals and denials still do.** It is the smallest change
that removes most of the new rival disasters (balanced 64 to 15, safety 22 to 2, random 24 to 7, denier 39 to 16), and
it keeps the half of rule 7 the player controls, so a big deal or a denial is still a choice with a cost. Rival deals
still show in the feed as news.

The trade-off: B still leaves the balanced bot at 15 rival disasters against 1 before, because its own big deals add
about 0.75 heat a round. F (no big-deal heat at all) brings rival disasters back to 0 to 3 for every bot, but drops the
rule that a big deal heats the race, which the owner chose in decision 3. C and D help much less than B.

Add E (`RIVAL_EDGE` −4) only if the owner wants the idle player to survive era 1 as often as before. B + E gives endings within
2 of B, with rounds at 1st 7 to 9 points higher for speed, safety and random.

None of these options restores the balanced bot's wins (18 before, 0 to 2 now). That needs the era 4 money problem above
looked at first, and the speed bot's deny rule decided, before any win-count target is set.

Four things the prototype never covered, so these numbers are the first measure of them: the persistent board, denial
heat, standing, and bots that deny. The standing weights (60% time at the top, 40% compute share) are this lane's first
guess, not a measured choice.

## How this was measured

- A is the committed code: `node tools/balance.js 100`, saved as `after.json`.
- B to F and B + E ran in a scratch copy of the repository, outside the repo, with an environment switch in
  `sim/rivalDeals.js`, `sim/contracts.js` and `sim/data/race.js`. The switch left option A byte-for-byte the same as
  `after.json`. None of it is in the repository.
- `heat-sources.json`, `balanced-cards.json` and `idle.json` come from small scratch scripts that count heat by source,
  the cards the balanced bot signs, and idle-run endings. "Before" in those files is commit `e8da33d`.
