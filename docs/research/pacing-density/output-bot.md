# Pacing density measurement

Seeds 1-20; strategies: balanced, safety, speed; player: bot; x1 speed (90 s per round); running-clock seconds.

## How far the runs got

| Strategy | Runs | Reached era 5 | Median running minutes | Rejected actions per run |
|---|---|---|---|---|
| balanced | 20 | 2 | 19.6 | 1.6 |
| safety | 20 | 11 | 28.7 | 1.6 |
| speed | 20 | 0 | 18 | 0 |

## Beats per running minute, by era (all runs pooled)

| Era | Running minutes (sum) | card | warning | runComplete | president | boardMeeting | toast | bubbles | feed | moneyFloat | rival releases | player releases | round marks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 360 | 0.8 | 0.2 | 0.3 | 0 | 0 | 1.6 | 7.6 | 10.6 | 8.7 | 0.7 | 0.3 | 0.7 |
| 2 | 360 | 1.5 | 0.3 | 0.2 | 0.2 | 0.2 | 1.9 | 8.5 | 16.3 | 8.7 | 0.8 | 0.2 | 0.7 |
| 3 | 340.5 | 1.9 | 0.2 | 0.2 | 0 | 0.2 | 2 | 16.1 | 18.7 | 2.8 | 1.1 | 0.2 | 0.7 |
| 4 | 120.6 | 1.4 | 0.1 | 0.4 | 0.1 | 0.1 | 2.3 | 17.9 | 17.1 | 2.8 | 1 | 0.4 | 0.6 |
| 5 | 75.4 | 1.2 | 0.1 | 0.2 | 0 | 0 | 1.4 | 14.8 | 12.2 | 0.7 | 0.9 | 0.2 | 0.7 |

## Dead gaps, tier "asks" (card, warning, runComplete, president, boardMeeting)

| Strategy | Era | Median gap (s) | Median of each run's longest gap (s) | Longest gap in any run (s) | Share of era time inside gaps over 20 s | over 45 s |
|---|---|---|---|---|---|---|
| balanced | 1 | 41 | 90 | 131 | 90% | 71% |
| balanced | 2 | 23 | 92 | 141 | 91% | 67% |
| balanced | 3 | 23 | 69 | 105 | 84% | 28% |
| balanced | 4 | 9 | 41 | 141 | 83% | 49% |
| balanced | 5 | 39 | 96 | 116 | 89% | 71% |
| safety | 1 | 51 | 110 | 110 | 95% | 85% |
| safety | 2 | 17 | 89 | 126 | 87% | 58% |
| safety | 3 | 24 | 84 | 108 | 90% | 47% |
| safety | 4 | 27 | 78 | 114 | 88% | 52% |
| safety | 5 | 26 | 90 | 103 | 89% | 67% |
| speed | 1 | 25 | 90 | 98 | 84% | 66% |
| speed | 2 | 16 | 90 | 90 | 82% | 42% |
| speed | 3 | 21 | 45 | 63 | 80% | 9% |
| all | 1 | 41 | 90 | 131 | 90% | 74% |
| all | 2 | 18 | 90 | 141 | 87% | 56% |
| all | 3 | 24 | 66 | 108 | 85% | 29% |
| all | 4 | 21 | 66 | 141 | 87% | 51% |
| all | 5 | 26 | 90 | 116 | 89% | 67% |

## Dead gaps, tier "shows" (card, warning, runComplete, president, boardMeeting, toast, bubbles)

| Strategy | Era | Median gap (s) | Median of each run's longest gap (s) | Longest gap in any run (s) | Share of era time inside gaps over 20 s | over 45 s |
|---|---|---|---|---|---|---|
| balanced | 1 | 5 | 56 | 76 | 30% | 21% |
| balanced | 2 | 3 | 49 | 70 | 51% | 13% |
| balanced | 3 | 3 | 33 | 45 | 24% | 0% |
| balanced | 4 | 3 | 5 | 48 | 18% | 2% |
| balanced | 5 | 13 | 71 | 77 | 61% | 36% |
| safety | 1 | 9 | 23 | 70 | 17% | 5% |
| safety | 2 | 6 | 50 | 89 | 31% | 12% |
| safety | 3 | 6 | 35 | 66 | 20% | 2% |
| safety | 4 | 6 | 36 | 57 | 33% | 7% |
| safety | 5 | 13 | 64 | 90 | 45% | 22% |
| speed | 1 | 5 | 54 | 54 | 28% | 11% |
| speed | 2 | 3 | 39 | 59 | 29% | 4% |
| speed | 3 | 3 | 6 | 42 | 5% | 0% |
| all | 1 | 5 | 54 | 76 | 25% | 12% |
| all | 2 | 3 | 45 | 89 | 37% | 10% |
| all | 3 | 3 | 30 | 66 | 17% | 1% |
| all | 4 | 3 | 6 | 57 | 29% | 6% |
| all | 5 | 13 | 64 | 90 | 48% | 24% |

## Dead gaps, tier "anything" (card, warning, runComplete, president, boardMeeting, toast, bubbles, feed, moneyFloat)

| Strategy | Era | Median gap (s) | Median of each run's longest gap (s) | Longest gap in any run (s) | Share of era time inside gaps over 20 s | over 45 s |
|---|---|---|---|---|---|---|
| balanced | 1 | 3 | 7 | 7 | 0% | 0% |
| balanced | 2 | 2 | 7 | 7 | 0% | 0% |
| balanced | 3 | 3 | 15 | 21 | 1% | 0% |
| balanced | 4 | 3 | 3 | 21 | 2% | 0% |
| balanced | 5 | 13 | 32 | 39 | 20% | 0% |
| safety | 1 | 3 | 7 | 7 | 0% | 0% |
| safety | 2 | 2 | 7 | 7 | 0% | 0% |
| safety | 3 | 3 | 16 | 21 | 3% | 0% |
| safety | 4 | 3 | 18 | 21 | 5% | 0% |
| safety | 5 | 13 | 13 | 26 | 7% | 0% |
| speed | 1 | 3 | 7 | 7 | 0% | 0% |
| speed | 2 | 2 | 7 | 7 | 0% | 0% |
| speed | 3 | 3 | 6 | 18 | 0% | 0% |
| all | 1 | 3 | 7 | 7 | 0% | 0% |
| all | 2 | 2 | 7 | 7 | 0% | 0% |
| all | 3 | 3 | 15 | 21 | 1% | 0% |
| all | 4 | 3 | 6 | 21 | 4% | 0% |
| all | 5 | 13 | 13 | 39 | 9% | 0% |

## Training runs (start to "Training complete"), running seconds

| Era the run started in | Runs | Median length (s) | Shortest | Longest | Bubbles per run (median) | Bubbles per running minute while training (median) | Median seconds between bubble moments |
|---|---|---|---|---|---|---|---|
| 1 | 120 | 90 | 90 | 398 | 22 | 13.3 | 5.9 |
| 2 | 85 | 90 | 90 | 360 | 38 | 18 | 3 |
| 3 | 93 | 90 | 90 | 633 | 54 | 28.7 | 3 |
| 4 | 22 | 90 | 90 | 101 | 58 | 38.7 | 3 |
| 5 | 12 | 90 | 90 | 90 | 55 | 36.7 | 12.9 |

## Time with nothing training, and time a trained model waited for a free move (share of era time, all runs)

| Era | Nothing training | Model ready but no move or team free |
|---|---|---|
| 1 | 34% | 0% |
| 2 | 50% | 1% |
| 3 | 20% | 0% |
| 4 | 24% | 0% |
| 5 | 48% | 5% |

## Progress with no bubble today, per running minute (all runs pooled)

| Era | Research points gained | Users gained (millions) |
|---|---|---|
| 1 | 1.2 | 0.3 |
| 2 | 2.1 | 0.8 |
| 3 | 2.2 | 0.4 |
| 4 | 4.6 | 0.3 |
| 5 | 9.4 | 0.1 |

## Feed posts by tag (all runs, total)

event: 6332, launch: 2334, world: 2237, rival: 1617, company: 1437, era: 1433, ambient: 894, reception: 845, everyday: 535, announce: 314, warning: 289, president: 259, mood: 230, summit: 115, feed: 97, rumour: 84

## Example: balanced seed 1, the 8 longest gaps with nothing asking and nothing visibly changing

| Era | From (running min:s) | Gap (s) | Ended by |
|---|---|---|---|
| 1 | 4:51 | 61 | toast |
| 1 | 1:50 | 53 | toast |
| 2 | 7:37 | 39 | toast |
| 2 | 10:31 | 30 | bubbles |
| 2 | 8:18 | 25 | toast |
| 3 | 12:03 | 24 | card |
| 3 | 16:06 | 24 | toast |
| 2 | 11:30 | 22 | toast |

## Rejected actions by message (all runs, top 8)

- 27: the finance team is busy until Jan N
- 20: the run is over
- 9: the finance team is busy until Mar N
- 7: the finance team is busy until Apr N
