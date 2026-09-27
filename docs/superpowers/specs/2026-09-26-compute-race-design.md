# Compute race — design spec (B + C)

**Date:** 2026-09-26 · **Owner:** Arda · **Status:** direction picked by the owner ("I like a mixture of B and C the
most"); the five open decisions answered the same day (section 7). Build after the 2026-09-27 12:00 AM PT deadline.
**Review pages:** options `https://claude.ai/artifact/VL28caDRHPKQyw2rcpj2mU`, plan
`https://claude.ai/artifact/5Qi2Y6KTi1vyxHnsRCpn2v` (copies in `docs/design/mockups/compute-race/`).
**Extends:** `docs/superpowers/specs/2026-09-25-compute-gathering-design.md`. Closes deferred item 3 of
`docs/superpowers/plans/2026-09-25-plan2c-compute.md` ("slowness should be punished mainly by rivals pulling ahead").

## 1. Problem

Only the player gathers compute. Rivals fill a hidden bar at a fixed speed and gain 5–9 points × (1 + 0.1 × era) per
launch; nothing the player buys changes them. Measured on `ui` at `9d51f8e` (100 seeds per bot): the balanced bot is
1st in 93% of rounds and reaches the score cap of 100 by round 10 on average; about two thirds of everyone's compute
sits idle; across the four bots only 3 of 400 runs end "left behind".

## 2. Rules

1. **Rivals hold compute.** Each rival has `fleet` (units online) and `pipeline` (arriving). Its target fleet per era is
   `FRONTIER[era] × appetite`, with `FRONTIER = [25, 50, 150, 400, 450]` and `appetite = speed × (1.1 − 0.4 × caution)`.
2. **Compute sets model size, for everyone.** A rival's training units are `fleet × (1 − safety) × 0.7` (0.7 leaves
   room for serving), with `safety = 0.05 + 0.25 × caution`. Its next model is the largest size on the player's own
   ladder (`SIZE_UNITS × eraScale`, XL from era 2) that fits. Speed still sets how often it launches. Launch gain:
   `(baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + roll − 2) × (1 − 0.5 × (0.1 + 0.2 × caution))`, `roll = rng.int(0, 4)`
   as today, `RIVAL_EDGE = −2`; no size fits: gain 2. The random draws are the same calls in the same order as today.
   From era 2, rivals copy your published models (owner pick B6, 2026-09-26): each launch gains
   `0.5 × max(0, your score − rival score − 10)` more, before the compute cap in rule 8. The rival's score here counts
   its launches rolled but not yet landed, so a lead is not copied twice.
3. **One shared board.** Offers stay until signed or taken; a taken slot refills next round; everything regenerates at
   an era change. After offers are made, each Western rival short of its target names one card (`wantedBy`), in
   catch-up order (lowest score first). Bold rivals (caution < 0.5) name the biggest card, careful ones the card nearest
   their shortfall. No dice. Qilin never takes a board card.
4. **The player moves first.** At the round's end each rival takes the card it named; if the player signed it, the
   rival takes its second choice (shown on the card as `fallback`). Taking a named card costs a team action and the
   card's bills, like any deal.
5. **Off-board growth.** After picks, a quarter of each rival's remaining shortfall arrives next round (deals the player
   never sees). Qilin grows only this way. The era 3 queue's rival fills also land in rival fleets.
6. **At the top, standing decides; compute is part of it.** `rank`: a rival ranks above the player if its score is more
   than 0.5 higher. Within 0.5 points, the lab with the higher standing ranks higher:
   `standing = 0.6 × (rounds spent within 0.5 of the top score, as a share of the most any lab has) + 0.4 × compute share`.
   Getting to the top first and staying there counts most; compute is a background factor, not the only one (owner
   2026-09-26: "that shouldn't be the only thing probably but be a bg component"). Weights are first-pass, for the
   balance run. Era gates and final endings keep their rules. Only the current era's rounds count (owner pick A5,
   2026-09-26): the count starts again at the first round mark of each era.
7. **Race heat.** +2 when the player signs a card a rival named (owner decision 3). Big deals add no heat (owner pick
   F, 2026-09-26: with +2 per big deal, rival disaster became the most common ending).
8. **Summit.** A binding compute cap limits every signing rival's launch gain to 5, as it limits the player's runs
   (today rivals ignore it). Breaking the deal stays as `dealWeek` models it.

## 3. What the player sees

- **The race tab** in the Compute dialog. The HUD lane built it on branch `hud-money` (`129c731`):
  `ui/screens/computeInfo.js` exports `openComputeInfo(game, overlayRoot, { view: 'where' | 'race', race })`, where
  `race` is a function `(game) => { body: HTMLElement, stacked: boolean }` (today `raceView` from `ui/screens/history.js`,
  the race chart). The tab uses the history-race dialog size (1320 × 688, or 820 tall when stacked) and prepends its own
  tab strip. This lane exports its own `race` function and changes the default there. Contents: a share bar of the frontier's
  compute, a lab table (score, compute, next model size, launch rumor from rival progress over 0.45), a "why you only
  train <size>" box and a "at the round's end" box.
- **The deal board:** "<Rival> takes this" banners, the fallback line, why a card can't be signed, and a strip listing
  what lands at the round's end.
- Feed posts when a rival's deal adds 25%+ to its fleet or the player takes a rival's card; advisor lines on who can
  train what; turn summary lines for rival deals.

## 4. Prototype measurements

Throwaway copy of `ui` at `9d51f8e`, 100 seeds per bot, `docs/design/mockups/compute-race/prototype/`.
Today → B + C (`RIVAL_EDGE = −2`):

| Bot | Left behind | Out of money | Other | Rounds at 1st | Rank, end of era 4 |
|---|---|---|---|---|---|
| speed | 0 → 8 | 44 → 37 | misalignment 32 → 31, board 24 → 24 | 82% → 54% | — |
| safety | 2 → 6 | 96 → 93 | | 44% → 22% | 1.02 → 1.70 |
| balanced | 0 → 0 | 11 → 11 | endings unchanged | 93% → 79% | 1.00 → 1.65 |
| random | 1 → 6 | 64 → 61 | misalignment 14 → 10 | 61% → 51% | 1.00 → 1.62 |

Rivals took 9–15 board cards per run. `RIVAL_EDGE = +6` left 63–88 of 100 runs behind: the size is sensitive.
Reserving the grid in era 2 still does not change rank (1.65 with, 1.61 without); era 4 rival power (decision 5) is the
likely fix. Not prototyped: persistent board, era 4 rival power, bots that take named cards.

## 5. Fit with other systems

Training sizes (shared ladder), rival launches (gain from size), deal offers (shared board), era 3 queue (fills count;
orders keep today's speed-relative size: owner, 2026-09-26), era 4 power (rivals build: OpenBrain gas, Lodestar nuclear,
DeepThink grid; second phase), safety split (rival caution = safety share), race heat (+2 for denial only), rank (fleet
tie-break), summit (cap binds rivals), export controls (optional: halve Qilin's growth for the era), board promise and
planner (optional leader-fleet line), advisors and feed (new lines). Unchanged: `launch.js` press, `advisors.js` gap
reading, `promises.js` rank checks, `events6c.js` rival breakthrough, weight theft.

## 6. Code changes

- `sim/rivals.js`: fleet, pipeline, target, safety, training, next size, gain formula, cap check, `rank` tie-break,
  `computeShares`.
- `sim/rivalDeals.js` (new): `announceTargets`, `takeTargets`, off-board growth, arrivals.
- `sim/contracts.js`: persistent board, `wantedBy` and `fallback` on offers.
- `sim/queue.js`: fills to rival fleets; orders keep today's speed-relative size.
- `sim/turn.js` (**gn-realtime owns**): about ten lines in `endRound`; new `sideRng` salts (10 picks, 11 growth).
  Compatible with stage 2 mid-round rival launches: the gain is fixed when the launch is rolled.
- `sim/balance.js`, `sim/data/feed.js`, `sim/data/advisorLines.js`, optional `sim/data/events6c.js`.
- `ui/logic/race.js`, `ui/screens/race.js` (new, mounted in **gn-hud-money**'s Compute dialog);
  `ui/logic/compute.js`, `ui/screens/compute.js` (banners, strip, summaries). Optional: `ui/screens/finance.js`,
  `ui/screens/history.js`.
- `tools/balance.js`: speed bot takes OpenBrain's named card when it can pay, safety never, new `denier` probe;
  report left behind by era, era 4 rank, rounds at 1st, rival deals. `tools/demo-seeds.js` (**gn-merge**): re-find seeds.
- Tests: named = taken, fallback, catch-up order, Qilin never takes, fills reach fleets, tie-break, cap binds rivals;
  update `tests/state.test.js` (launch gains) and `tests/queue.test.js` (speed-relative orders).

Estimate: 8–10 hours (sim 3–4, screens 3–4, balance and tests 2). Measure before and after with the bots and size
against existing effects before calling it done.

## 7. Owner decisions (2026-09-26)

1. **Score cap.** Compute must not be the only thing that decides the lead once labs reach the top; it is a background
   factor. Adopted as the standing blend in rule 6 (weights are this lane's first pass; the owner may adjust).
2. **Board persistence.** Cards stay on the board until signed or taken.
3. **Denial heat.** Taking a rival's named card adds +2 race heat.
4. **Drift accepted.** The design breaks the ±5-points-per-ending rule on purpose: more left-behind endings (prototype:
   +4 to +8 points for the speed, safety and random bots) and fewer out-of-money endings (−3 to −7). Retune once the
   full build exists and report the new numbers against these.
5. **Era 4 rival power.** Second pass, after the first build is measured.
6. **Big deals add no race heat** (option F, picked after the first build's measurement,
   `docs/design/mockups/compute-race/measurements/options.md`). Denial heat (decision 3) stays.
7. **Queue orders keep today's size.** Orders sized from each rival's shortfall let rivals, nearly full by era 3, order
   almost nothing, so the queue stopped rationing and the balanced bot bought itself broke (money investigation,
   2026-09-26). Rival fills still land in rival fleets.
8. **Rivals can catch up with and pass a leader** (picks B6 + A5, rules 2 and 6,
   `docs/design/mockups/compute-race/measurements/catch-up.md`). Nothing acts in era 1, so an idle lab is not left
   behind more often. Trade-off accepted: in era 5, compute share mostly decides ties at the top.
