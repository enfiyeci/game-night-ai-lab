# Why rivals can't catch the balanced bot, and what would let them (2026-09-26)

Measured on commit `277dd70` (branch `compute-race-design`), in scratch copies outside the repository. Following the
controller's new constraint, the main base is **RIVAL_EDGE = −2**. The earlier analysis at +2 (the commit as it is) is
kept in its own table. Every row is 100 seeds per bot (`node tools/balance.js 100`), plus an idle lab (a lab that
sends empty actions every round) on seeds 1 to 50. Nothing in the repository was changed.

## Outcome

**The root cause is the score cap. Scores stop at 100, so the balanced bot's lead is invisible but never shrinks.
Rivals can at best tie it at 100, and the tie rule then rewards the player for having got there first.**

1. **The lead is built in era 1, and the player's engine keeps outgrowing the rivals'.** In era 1 the balanced bot
   finishes two runs worth about +18 each, while each rival launches once for +7 to +11 (at −2). By the end of era 1 it
   leads the best rival by 24 points, and by the end of era 2 by 34. Its runs keep growing (raw, uncapped gain per run:
   18, 29, 44, 49 and 58 points in eras 1 to 5), while a rival launch adds 3 to 12. It reaches 100 at round 10 on
   average, halfway through the game. If points past 100 were counted, it would be about 124 points past the cap at
   the end of era 4, against 13 for OpenBrain.
2. **At −2, rivals mostly never reach the top.** The leading rival reaches 100 in only 39 of 100 balanced runs, and not
   until round 18 on average (era 5). Rules about ties at the top therefore have almost nothing to act on: the best
   of them moves the balanced bot from 93% to 87% of rounds at 1st.
3. **When rivals do reach 100, the tie rule keeps the player ahead.** In rounds where the balanced bot and OpenBrain
   are both at 100 (measured at +2, where this happens in 428 rounds), the player has spent 13.9 rounds at the top and
   OpenBrain 5.2. Standing is 0.64 for the player and 0.40 for OpenBrain, even though OpenBrain holds 43% of all
   compute and the player 10%. To win the tie, OpenBrain would need about 78% of the player's rounds at the top. Those
   rounds are counted from the first round of the game, and the player has been at the top since era 1.
4. **Why a bigger rival edge fails.** A flat edge boosts rivals equally against every player. The balanced bot leads by
   24 at the end of era 1, but the safety bot leads by only 0.5, so any boost big enough to erase 24 points buries the
   safety bot first. Even when rivals do reach 100, the leader keeps rank 1 through the tie rule. Era-dependent edges
   (−2 in era 1, higher later) leave the balanced bot at 92 to 93% at 1st and cut the safety bot's by 9 to 16 points.

The four hypotheses from the brief:

| Hypothesis | Verdict | Evidence |
|---|---|---|
| (1) The balanced bot hits 100 early; rivals can only tie; standing keeps it ahead | **Confirmed**, and it is half the cause | Player at 100 by round 10.1 in 100 of 100 runs. Rival at 100 in 39 runs, round 18.1 (at +2: 87 runs, round 13.8). Ties at 100 are won on the rounds-at-the-top term (numbers in point 3 above) |
| (2) Rival gains shrink late, or fleets stall past FRONTIER | **True but not what binds** | Late in the game FRONTIER falls behind the size ladder: Lodestar, DeepThink and Qilin drop to Small models in era 5, and their launches add 2.4 to 5 points. OpenBrain ends above its target anyway (740 against 531 in era 4). Raising FRONTIER (row D1) leaves the balanced bot at 93% |
| (3) Ties go to the player when standing is equal | **Rejected** | 0 ties were decided on equal standing in any era, at either base |
| (4) The player's own gains per run dwarf the rivals' | **Confirmed; the biggest factor** | Raw gain per run of 18 to 58 against rival launches of 3 to 12. The player runs twice as often as a rival launches in era 1 |

## Per-era diagnosis (balanced bot, RIVAL_EDGE −2, 100 seeds)

Sampled at the end of each round and averaged over the rounds played in that era. "Clear" means rank 1 with no rival
within half a point. "Tie" means a rival was within half a point and standing gave the player rank 1.

| Era | Rounds | Player score | Best rival score | Player at 100 | A rival at 100 | Rank 1 (clear + tie) | Player: runs per era × landed gain (raw gain) | OpenBrain: launches per era × gain | Other rivals' gain per launch |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 400 | 38.5 | 30.5 | 0% | 0% | 73% (71 + 2) | 2.00 × 18.1 (18.1) | 1.00 × 7.2 | 7.3 to 10.8 |
| 2 | 400 | 72.5 | 45.8 | 1% | 0% | 100% (100 + 0) | 1.29 × 23.0 (29.3) | 1.96 × 9.6 | 3.0 to 5.2 |
| 3 | 400 | 95.7 | 64.2 | 72% | 0% | 98% (98 + 0) | 1.92 × 5.0 (44.2) | 1.79 × 11.7 | 2.5 to 7.1 |
| 4 | 367 | 100.0 | 82.3 | 100% | 2% | 100% (98 + 2) | 0.94 × 0 (49.0) | 1.51 × 8.5 | 3.9 to 8.1 |
| 5 | 180 | 100.0 | 95.2 | 100% | 51% | 100% (47 + 53) | 0.15 × 0 (58.1) | 0.83 × 5.2 | 2.4 to 3.0 |

Gap between the player and the best rival: +23.8 at the end of era 1 and +33.9 at the end of era 2. For the safety bot
the gaps are +0.5 and +6.5. The same table at +2: best rival 32.3, 54.3, 79.0, 97.6 and 99.9; rank 1 in 60%, 97%, 94%,
97% and 93% of rounds; the tie share of rank 1 grows from 4% in era 3 to 62% in era 4 and 90% in era 5.

Rival fleets against their targets, with model size (1 = Small, 2 = Medium, 3 = Large, 4 = XL). These do not depend on
the edge, and the numbers are the same at −2 and +2:

| Era | OpenBrain | Lodestar | DeepThink | Qilin | Player online |
|---|---|---|---|---|---|
| 1 | 23 / 41, size 2.2 | 16 / 22, 1.9 | 22 / 30, 2.3 | 16 / 35, 2.0 | 32 |
| 2 | 76 / 98, 2.7 | 34 / 53, 1.5 | 49 / 71, 2.0 | 32 / 80, 1.5 | 25 |
| 3 | 244 / 276, 3.0 | 107 / 149, 1.5 | 137 / 201, 2.0 | 78 / 215, 1.4 | 137 |
| 4 | 740 / 531, 2.6 | 264 / 287, 1.3 | 388 / 386, 1.6 | 194 / 401, 1.0 | 222 |
| 5 | 1376 / 564, 2.6 | 391 / 302, 0.9 | 555 / 409, 1.2 | 333 / 416, 1.0 | 192 |

Size shrinks late because FRONTIER per unit of the size ladder falls from 25 in era 1 to 13 in era 4 and 6 in era 5.

## Candidate fixes, measured on RIVAL_EDGE −2

"Wins" means aligned, pacing deal and costly win added together. Era 4 rank is averaged over the runs that finish era 4:
safety 72, balanced 70, random only 9 (so random's figure is noisy). The speed bot never finishes era 4: the board
removes it in all 100 runs, at both bases, before any change. S, Sa, B and R are speed, safety, balanced and random.

What each candidate changes:

- **A1 to A7: tie rules at the top.** A1 to A3 change the standing weights. A4 uses compute share alone once both labs
  are at 100. A5 counts rounds at the top only within the current era (weights stay 0.6 / 0.4). A7: at 100, the lab
  whose frontier model is newest ranks higher.
- **B1 to B6: catch-up gains on rival launches.** B1 and B2 add to each launch in proportion to how far the rival
  trails the leader. B3 to B6 add in proportion to how far it trails you ("rivals copy your released models"). B6 adds
  +0.5 per point beyond a 10-point lead, from era 2 on.
- **C1 to C4: an era-dependent RIVAL_EDGE**, always −2 in era 1.
- **D1 to D3: other ideas.** D1 raises FRONTIER. D2 makes every lab's gains shrink above 60, reaching zero at 100.
  D3 counts points past 100 toward rank.

| Candidate | Idle left behind, era 1 (of 50) | 1st: speed / safety / balanced / random | Era 4 rank: safety / balanced / random | Wins (safety / balanced) | Left behind (S / Sa / B / R) | Rival disaster (S / Sa / B / R) | Out of money (S / Sa / B / R) | Misalignment (S / Sa / B / R) |
|---|---|---|---|---|---|---|---|---|
| **Base: RIVAL_EDGE −2, no change** | 31 | 79% / 65% / 93% / 72% | 1.01 / 1.00 / 1.00 | 10 / 34 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| A1 standing weights 0.4 / 0.6 | 31 | 79% / 64% / 93% / 72% | 1.04 / 1.00 / 1.00 | 10 / 34 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| A2 standing weights 0.3 / 0.7 | 31 | 79% / 62% / 89% / 72% | 1.08 / 1.07 / 1.00 | 5 / 33 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| A3 compute share only | 31 | 79% / 62% / 87% / 71% | 1.10 / 1.07 / 1.11 | 4 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| A4 at 100, more compute ranks above | 31 | 79% / 62% / 87% / 71% | 1.10 / 1.07 / 1.11 | 4 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| A5 time at the top counts this era only | 31 | 79% / 64% / 91% / 72% | 1.01 / 1.01 / 1.00 | 10 / 33 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| A6 = A5 + weights 0.4 / 0.6 | 31 | 79% / 63% / 88% / 72% | 1.03 / 1.04 / 1.00 | 8 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| A7 at 100, newest frontier model ranks above | 31 | 79% / 62% / 88% / 71% | 1.10 / 1.06 / 1.11 | 4 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| B1 +0.25 per point behind the leader, all eras | 45 | 69% / 59% / 89% / 65% | 1.11 / 1.03 / 1.00 | 9 / 33 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 74 | 0 / 2 / 46 / 4 |
| B2 = B1 from era 2 | 31 | 76% / 61% / 92% / 71% | 1.10 / 1.01 / 1.00 | 9 / 33 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 75 | 0 / 2 / 46 / 4 |
| B3 +0.25 per point behind you, all eras | 31 | 69% / 60% / 89% / 67% | 1.11 / 1.03 / 1.00 | 9 / 33 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 75 | 0 / 2 / 46 / 4 |
| B4 = B3 from era 2 | 31 | 76% / 61% / 92% / 72% | 1.10 / 1.01 / 1.00 | 9 / 33 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| B5 +0.5 per point behind you, from era 2 | 31 | 72% / 55% / 88% / 70% | 1.25 / 1.07 / 1.00 | 9 / 32 | 0 / 2 / 0 / 0 | 0 / 8 / 5 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| B6 +0.5 per point behind you beyond 10, from era 2 | 31 | 77% / 62% / 92% / 72% | 1.07 / 1.01 / 1.00 | 9 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 5 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| C1 edge by era −2 / 0 / 2 / 2 / 2 | 31 | 76% / 56% / 93% / 71% | 1.21 / 1.00 / 1.11 | 8 / 34 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 75 | 0 / 2 / 45 / 4 |
| C2 edge by era −2 / 2 / 2 / 2 / 2 | 31 | 75% / 53% / 92% / 70% | 1.25 / 1.01 / 1.11 | 8 / 34 | 0 / 4 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 78 / 17 / 75 | 0 / 1 / 45 / 4 |
| C3 edge by era −2 / 2 / 4 / 4 / 4 | 31 | 75% / 49% / 92% / 70% | 1.38 / 1.01 / 1.11 | 9 / 34 | 0 / 4 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 77 / 17 / 75 | 0 / 1 / 45 / 4 |
| C4 edge by era −2 / 0 / 2 / 4 / 6 | 31 | 76% / 56% / 93% / 71% | 1.22 / 1.00 / 1.11 | 8 / 34 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 75 | 0 / 2 / 45 / 4 |
| D1 FRONTIER 25 / 60 / 200 / 600 / 1200 | 31 | 79% / 66% / 93% / 72% | 1.01 / 1.00 / 1.00 | 21 / 31 | 0 / 2 / 0 / 0 | 0 / 6 / 3 / 4 | 0 / 66 / 12 / 74 | 0 / 5 / 54 / 6 |
| D2 every lab gains less above 60 | 31 | 79% / 65% / 93% / 72% | 1.00 / 1.00 / 1.00 | 10 / 35 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 44 / 4 |
| D3 points past 100 count for rank | 31 | 79% / 65% / 93% / 72% | 1.00 / 1.00 / 1.00 | 10 / 34 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 45 / 4 |
| C1 + A5 | 31 | 76% / 53% / 84% / 70% | 1.22 / 1.17 / 1.22 | 6 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 75 | 0 / 2 / 45 / 4 |
| C2 + A5 | 31 | 75% / 48% / 80% / 67% | 1.31 / 1.29 / 1.33 | 4 / 32 | 0 / 4 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 78 / 17 / 75 | 0 / 1 / 45 / 4 |
| C3 + A5 | 31 | 75% / 43% / 76% / 67% | 1.43 / 1.50 / 1.33 | 5 / 32 | 0 / 4 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 77 / 17 / 75 | 0 / 1 / 45 / 4 |
| C4 + A5 | 31 | 76% / 52% / 82% / 70% | 1.24 / 1.20 / 1.22 | 4 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 75 | 0 / 2 / 45 / 4 |
| B2 + A5 | 31 | 76% / 56% / 75% / 68% | 1.17 / 1.54 / 1.22 | 5 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 75 | 0 / 2 / 46 / 4 |
| B4 + A5 | 31 | 76% / 56% / 75% / 68% | 1.17 / 1.54 / 1.22 | 5 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| B5 + A5 | 31 | 72% / 48% / 62% / 65% | 1.40 / 2.29 / 1.78 | 5 / 31 | 0 / 2 / 0 / 0 | 0 / 8 / 5 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| B6 with a 5-point threshold + A5 | 31 | 74% / 54% / 67% / 67% | 1.22 / 1.86 / 1.44 | 4 / 31 | 0 / 2 / 0 / 0 | 0 / 7 / 5 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| **B6 + A5 (recommended)** | **31** | **78% / 58% / 75% / 69%** | **1.14 / 1.59 / 1.22** | **6 / 31** | 0 / 2 / 0 / 0 | 0 / 7 / 5 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| B6 with a 15-point threshold + A5 | 31 | 78% / 61% / 79% / 70% | 1.08 / 1.43 / 1.22 | 8 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| B6 from era 3 + A5 | 31 | 79% / 59% / 80% / 69% | 1.14 / 1.31 / 1.22 | 6 / 32 | 0 / 2 / 0 / 0 | 0 / 7 / 4 / 6 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 4 |
| B6 + A7 | 31 | 76% / 56% / 71% / 66% | 1.50 / 1.84 / 2.00 | 4 / 31 | 0 / 2 / 0 / 0 | 0 / 7 / 5 / 5 | 0 / 79 / 17 / 76 | 0 / 2 / 46 / 5 |

What the table shows:

- **No single rule works at −2.** Tie rules alone (A1 to A7) leave the balanced bot at 87 to 93%, because rivals seldom
  reach 100. Catch-up gains alone (B2 to B6) bring rivals to 100, but the banked rounds at the top still win the
  tie, so the balanced bot stays at 88 to 92%. Only the two together move it: B6 alone gives 92% and A5 alone 91%, but
  B6 + A5 gives 75%. With B6 + A5, a rival reaches 100 in 86 of 100 balanced runs (round 13.7 on average), against 39
  (round 18.1) without it.
- **Anything that acts in era 1 hurts the idle lab.** B1 raises idle left-behind from 31 to 45 of 50. Every rule that
  starts in era 2 or later, and every tie rule, leaves it at 31.
- **Era-dependent edges (C1 to C4) mostly hit the slower bots.** They cost the safety bot 9 to 16 points of rounds at
  1st while the balanced bot stays at 92 to 93%.
- **D1 had large side effects I did not trace**: the safety bot's wins rose from 10 to 21 and its out-of-money endings
  fell from 79 to 66, while the balanced bot's misalignment endings rose from 45 to 54.

### The same analysis at RIVAL_EDGE +2 (commit 277dd70 as it is)

| Candidate | Idle left behind, era 1 (of 50) | 1st: speed / safety / balanced / random | Era 4 rank: safety / balanced / random | Wins (safety / balanced) | Left behind (S / Sa / B / R) | Rival disaster (S / Sa / B / R) | Out of money (S / Sa / B / R) | Misalignment (S / Sa / B / R) |
|---|---|---|---|---|---|---|---|---|
| **Base: +2, no change** | 50 | 61% / 33% / 87% / 58% | 1.63 / 1.06 / 1.11 | 5 / 33 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 6 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 3 |
| A1 weights 0.4 / 0.6 | 50 | 61% / 31% / 78% / 58% | 1.71 / 1.45 / 1.33 | 5 / 32 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 6 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 3 |
| A2 weights 0.3 / 0.7 | 50 | 61% / 29% / 73% / 57% | 1.88 / 1.80 / 1.56 | 4 / 31 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 6 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 3 |
| A3 compute share only | 50 | 60% / 28% / 66% / 53% | 1.94 / 1.94 / 1.89 | 4 / 31 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 5 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 4 |
| A4 at 100, more compute ranks above | 50 | 60% / 28% / 66% / 53% | 1.94 / 1.94 / 1.89 | 4 / 31 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 5 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 4 |
| A5 time at the top counts this era only | 50 | 61% / 32% / 71% / 56% | 1.51 / 1.52 / 1.33 | 4 / 31 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 6 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 3 |
| A6 = A5 + weights 0.4 / 0.6 | 50 | 61% / 30% / 69% / 55% | 1.68 / 1.78 / 1.44 | 4 / 31 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 6 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 3 |
| A7 at 100, newest frontier model ranks above | 50 | 60% / 30% / 69% / 53% | 1.85 / 1.68 / 2.00 | 4 / 31 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 5 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 4 |
| B1 +0.25 per point behind the leader | 50 | 54% / 26% / 79% / 51% | 1.81 / 1.17 / 1.11 | 4 / 31 | 2 / 13 / 0 / 1 | 0 / 8 / 5 / 7 | 0 / 71 / 17 / 74 | 0 / 1 / 47 / 3 |
| B1 at +0.1 | 50 | 59% / 30% / 85% / 56% | 1.64 / 1.12 / 1.11 | 5 / 32 | 1 / 9 / 0 / 1 | 0 / 9 / 4 / 7 | 0 / 73 / 17 / 74 | 0 / 1 / 47 / 3 |
| B3 +0.25 per point behind you | 50 | 54% / 28% / 80% / 51% | 1.70 / 1.17 / 1.11 | 5 / 31 | 1 / 9 / 0 / 1 | 0 / 9 / 5 / 7 | 0 / 72 / 17 / 74 | 0 / 1 / 47 / 3 |
| B3 at +0.5 | 50 | 48% / 25% / 69% / 44% | 1.85 / 1.31 / 1.43 | 4 / 29 | 6 / 15 / 3 / 1 | 0 / 9 / 5 / 6 | 0 / 67 / 17 / 74 | 0 / 1 / 46 / 3 |
| B3 + A5 | 50 | 54% / 26% / 56% / 46% | 1.73 / 1.99 / 1.78 | 5 / 30 | 1 / 8 / 0 / 1 | 0 / 9 / 5 / 7 | 0 / 73 / 17 / 74 | 0 / 1 / 47 / 3 |
| D1 FRONTIER 25 / 60 / 200 / 600 / 1200 | 50 | 61% / 32% / 87% / 58% | 1.69 / 1.07 / 1.00 | 11 / 29 | 0 / 6 / 0 / 1 | 0 / 8 / 3 / 4 | 0 / 67 / 12 / 74 | 0 / 4 / 56 / 5 |
| D2 every lab gains less above 60 | 50 | 64% / 47% / 89% / 59% | 1.04 / 1.00 / 1.00 | 8 / 33 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 6 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 3 |
| D3 points past 100 count for rank | 50 | 62% / 43% / 88% / 58% | 1.13 / 1.00 / 1.22 | 8 / 33 | 0 / 6 / 0 / 0 | 0 / 9 / 4 / 6 | 0 / 76 / 17 / 74 | 0 / 1 / 46 / 3 |
| RIVAL_EDGE +4 (check of the brief) | 50 | 55% / 18% / 81% / 51% | 1.89 / 1.16 / 1.11 | 3 / 32 | 1 / 15 / 0 / 1 | 0 / 8 / 4 / 6 | 0 / 70 / 17 / 74 | 0 / 1 / 47 / 4 |

At +2 rivals already reach 100 in 87 runs, so the era-only count (A5) works by itself: the balanced bot drops to 71% at
1st and its era 4 rank rises from 1.06 to 1.52, while the safety bot's era 4 rank improves (1.63 to 1.51). But +2
leaves the idle lab behind at the era 1 gate in 50 of 50 runs, which the controller has ruled out. The +4 row
reproduces the brief's numbers (balanced 81%, safety 18%). A note on the brief: at `277dd70` the balanced bot wins 33
of 100, not 15 (31 pacing deals, 1 aligned, 1 costly win). Only the 2 aligned and costly wins depend on final rank.

## Recommendation (the owner picks)

**B6 + A5: two visible rules, both inactive in era 1.**

1. **Rivals copy the leader (from era 2).** Each rival launch gains +1 for every 2 points the rival trails you beyond
   10. For example, a rival 30 points behind gets +10. In sim terms: `0.5 × max(0, your score − rival score − 10)`,
   added to the launch gain when it is rolled. The race tab can show it as "copies your published models: +N".
2. **At the top, this era counts.** The "rounds at the top" part of standing counts only rounds in the current era.
   The weights stay 0.6 / 0.4, so compute stays a background factor in the formula.

Headline numbers against the −2 base:

- **Balanced bot:** 1st in 75% of rounds instead of 93%, era 4 rank 1.59 instead of 1.00.
- **Safety bot:** 58% instead of 65%, rank 1.14 instead of 1.01. **Random bot:** 69% instead of 72%, rank 1.22
  instead of 1.00 (on only 9 runs). **Speed bot:** 78% instead of 79%.
- **Unchanged:** idle left-behind stays at 31 of 50; left behind stays at 2 (safety) and 0 (the others); out of money
  and misalignment are within 1 for every bot.
- **Wins:** the balanced bot drops from 34 to 31 and the safety bot from 10 to 6 (4 of its runs now end "overtaken").

The threshold is what spares close races. The safety bot usually leads by less than 10, so it seldom triggers the
catch-up gain. With a 5-point threshold the safety bot falls to 54% at 1st; with 15 points the balanced bot stays at
79%.

**The trade-off.** In era 5 the balanced bot and OpenBrain both sit at 100 in nearly every round, so they have equal
time at the top that era. Compute share then decides the tie, and OpenBrain has 3 to 7 times the player's fleet (740 against 222 units in era 4, 1,376 against 192 in era 5). The
balanced bot is 1st in only 8% of era 5 rounds. The formula still weights compute at 40%, but in practice, at the top
in the last era, compute is what separates labs. A player can answer by buying compute, or by reaching the top earlier
in the era.

Two alternatives:

- **If compute should not decide there:** B6 + A7 (at 100, the lab with the newest frontier model leads). The balanced
  bot drops to 71%, but the rule is harder on slow bots: the safety bot's era 4 rank goes to 1.50.
- **A milder version:** start the catch-up gain in era 3 (balanced 80% and rank 1.31; safety 59% and rank 1.14).

## Coverage statement

Read end to end at `277dd70` (in the exported copy):

- The spec, `docs/superpowers/specs/2026-09-26-compute-race-design.md`, and the earlier notes,
  `docs/design/mockups/compute-race/measurements/options.md`.
- `sim/rivals.js`, `sim/rivalDeals.js`, `sim/data/race.js`, `sim/balance.js`, `sim/endings.js`, `sim/training.js`,
  `sim/turn.js`, `sim/state.js`, `sim/landings.js`, `sim/recipe.js`, `sim/data/compute.js`, `sim/time.js`,
  `sim/data/eras.js` and `tools/balance.js`.

Partial or not read:

- ⚠️ `sim/release.js`: read only lines 95 to 140, to place the "points past 100" switch. No claim rests on the rest.
- ⚠️ Not opened beyond grep matches: `sim/queue.js`, `sim/summit.js`, `sim/data/events6c.js`, `sim/data/events.js`,
  `sim/contracts.js` and `sim/promises.js`. They affect rival scores or rank only through the summit, events, queue
  fills and promise checks. Those effects are inside every simulation, but I did not trace them. In particular, the
  cause of D1's large side effects is not traced.

Measurement notes:

- Fleet targets are sampled after each round's mark, so on an era's last round the target is already the next era's.
- The player's raw gains per run were measured at +2 with the "points past 100" switch on. The player's training does
  not read RIVAL_EDGE.
- The balanced bot's per-era table uses 100 seeds. Its tie-standing figures come from the rounds in which both labs
  were at 100.
- The unchanged copy reproduced `node tools/balance.js 100` byte for byte at +2 and at −2.

Scripts and outputs: variant switches in
`<session scratchpad, not kept>/catchup/lab`
(environment variable `CU`, plus `CU_EDGE`, `CU_EDGES`, `CU_DISTIL`, `CU_T`, `CU_FROM`); diagnostics in `…/catchup/tools/`;
raw JSON in `…/catchup/out/`.
