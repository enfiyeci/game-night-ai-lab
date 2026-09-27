# Decisions decide the ending — design spec (no dice on outcomes)

**Date:** 2026-09-26 · **Owner:** Arda · **Status:** direction and all eleven scenarios approved by the owner the same
day ("i decided i dont want randomness", "all sounds good"). Not built. Build after the 2026-09-26 8:30 PM demo.
**Lane:** gn-newplayer (MacBook). **Came from:** a new-player playtest of `merge-ui` and a 200-run balance report
(tools/balance.js) on `ui` at `e86a630`.

## 1. Problem

Every random draw goes through one seeded generator (`sim/rng.js`, `sideRng` in `sim/contracts.js:16`). Today dice
decide several endings outright and move the numbers that lead to the rest, so the same choices can end differently.
Evidence: the scripted `balanced` bot, which follows fixed rules, ends 102 × misalignment, 63 × negotiated pace, 28 ×
absorbed, 6 × rival disaster and 1 × aligned over 200 seeds. Across every bot strategy the good ending ("Aligned
success") comes up at most 3 times in 200.

## 2. Owner decisions (2026-09-26)

1. **Outcomes follow from decisions.** Every random draw that changes what happens to the lab becomes a rule.
2. **What stays random:** cosmetic draws (feed post wording and order, release reactions, reveal animations, music
   order) and **which event cards pop up and when** (the chance triggers and the day a card lands in its round).
3. **Advisors stay noisy.** `sim/advisors.js` readings keep their `rng.normal` error. This is where the player's
   uncertainty lives: the rules are fixed, but the player reads them through advisors who can be wrong.
4. **Every game starts the same.** Today the seed changes the starting deal offers and the rivals' first roll
   (`sim/state.js:100-101`), and `ui/main.js` `seedForRun` gives each new game a new seed. The start state must not
   depend on the seed. (Because event pop-ups stay random, games still diverge after the start.)
5. **No extra warning cards.** Catastrophes are not announced by a new, exact warning card; the player learns of the
   danger only through the existing surfaces (noisy advisors, feed, existing event cards). Rejected alternative: one
   exact warning card per catastrophe (recommended by Claude so the endings don't feel unannounced; the owner said no).
6. **The eleven scenarios in section 4 are approved as written.**

## 3. Random draws: stays or becomes a rule

Keep a separate random stream for what stays random, so removing an outcome roll never reshuffles which events appear.

| Where | Today | Decision |
|---|---|---|
| `sim/endings.js:40` misuse | 25% a round over both lines | rule (section 4) |
| `sim/endings.js:43` rival disaster | 20% a round, heat > 85 | rule |
| `sim/release.js:185` misalignment | sigmoid chance on agent releases, era 3 warning, era 4 ending | rule |
| `sim/automation.js:167` quiet takeover | chance from unchecked AI work | rule |
| `sim/automation.js:198` "sample logs less" proposal | chance | rule (offered whenever monitors run) |
| `sim/summit.js` catches, breaks, investigations, vote noise | chances by check level | rule by check level |
| `sim/training.js:41` loss spikes, `:110` lawsuits; `sim/hazards.js:16` reward hacking | chances | always happen when the causing choice is made |
| `sim/contracts.js:49,79,173,177` deal sizes, chip-order delivery 30-100%, spot pull-back, CoreFlame failing | chances | fixed, stated terms per supplier |
| `sim/power.js:27-37` site size, grid arrival, slips | chances | fixed terms |
| `sim/rivals.js:42,47` rival pace jitter and launch gain roll | chances | fixed per rival (fits the compute race spec: size from held compute) |
| `sim/launch.js:36-43,60` benchmark and press noise | ±1 to ±5 | none |
| `sim/promises.js:61` promise leaks | 15% | rule |
| `sim/constitution.js:157-162` learned constitution drift | chance from debt | rule from debt |
| `sim/queue.js:98` rival prepay announcements | chance | fixed per rival |
| `sim/data/events6c.js:104` rival version jump | chance | fixed per rival |
| event triggers with `rng.chance` (events.js:523, events6c.js, realEvents.js), `sim/events.js:185` landing day | chance | **stays random** (decision 2) |
| `sim/advisors.js:23-36` | noise | **stays random** (decision 3) |
| `sim/feed.js`, `sim/feedLive.js`, `ui/screens/reveal.js`, `ui/music.js`, `ui/sfx.js` | cosmetic | **stays random** |

## 4. The eleven scenarios (owner-approved)

Grounded in the code's own conditions (`sim/endings.js`, `sim/release.js`, `sim/board.js`, `sim/data/cards.js`).
"Rule" is what replaces a roll; endings marked "already a rule" keep their current check.

**Wins**
- **Aligned success, the careful lab that also wins the race.** Principles-based character training, full evals plus
  a third-party evaluator, safety compute at or above the era target, publishing red-team findings, signing every
  White House line, compute deals big enough to stay first. Already a rule: end of era 5, ranked first, hidden debt < 40.
- **A negotiated pace, the international deal.** Low race heat, goodwill in Washington, outside testers or inspectors
  at the summit, never shipping above the cap. Rule: at least two binding commitments, the deal holds, no break by
  you; a break is always caught under outside testers or inspectors and never under trust or self-reports.
- **A costly win, first but nobody can vouch for it.** User thumbs-up reward (+8 debt), raw reward RL, skipping
  hardening, "penalize" on reward hacking, leaving findings out of reports. Already a rule: ranked first, debt ≥ 40.

**Losing the race or the company**
- **Overtaken, safe but not first.** Careful choices without enough compute; rivals take the deals you pass on
  (compute race). Already a rule.
- **Left behind, missed the shift to reasoning or agents.** Long idle stretches, few runs, compute given up. Already a
  rule: at an era gate, rank worse than 2 and more than 15 points behind.
- **Absorbed, bought for the team** (like the 2024 license-and-hire deals). Too many take-or-pay contracts, or so
  cautious that revenue never comes. Already a rule: cash at zero after the rescue options.
- **Removed by the board** (like the November 2023 board crisis). Broken promises to the board, emergency options,
  hiding safety results from the candor watchdog, burning the sovereign fund's cash. Already a rule: a failed vote;
  the staff letter reverses one.

**Catastrophes (today dice)**
- **Catastrophic misalignment.** Agentic RL with a low alignment share, eval gaming, red-team findings left out,
  shipping agents anyway. Rule: hidden debt × capability over a line; an era 3 agent release above it is the warning
  incident (as today), the first era 4 agent release above it is the ending.
- **Catastrophic misuse.** Open weights at high capability, "skip hardening" (+6 misuse), image and agent features
  without classifiers, dropping the weapons line. Rule: the second consecutive round over both lines (capability > 55,
  misuse > 70) is the ending; the first round shows only through existing surfaces (decision 5).
- **A quiet takeover.** AI does the research with no reviewers or monitors, and the lab accepts "sample its own logs
  less often". Rule: unchecked AI work accumulates round by round to a threshold, unless the constitution holds the
  accept-shutdown line.
- **Someone else's disaster.** Prepaid queue orders, huge deals, rapid releases, declining pauses and the summit,
  yes to the President's race asks. Rule: race heat above 85 for three rounds.

## 5. Constraints for the build

- **The aligned ending must be reachable.** After the change, tune until a careful, well-funded strategy reaches it
  reliably; report before-and-after bot numbers per ending (memory rule: new mechanics get before/after runs and are
  sized to match existing effects).
- **Balance tooling.** `tools/balance.js` still varies seeds, which now vary only events and advisor noise; add bot
  choice variants where a strategy needs spread.
- **Shared files.** `sim/rivals.js`, `sim/contracts.js`, `sim/queue.js` belong to gn-compute-race (Mac mini);
  `sim/turn.js` and `sim/landings.js` to gn-realtime; `sim/summit.js` to the summit lane; event data to gn-events;
  `sim/automation.js` to gn-automation (done). Agree order and ownership on the lanes board before editing.
- The White House "Sign all of it" release wait (owner: "add it", not before the demo) is WIP on this branch
  (commit 1368f47): too strong as measured, see the handoff.
