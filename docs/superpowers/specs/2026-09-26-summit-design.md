# Era 5 pacing summit — design (supersedes spec §6e where they differ)

**Date:** 2026-09-26 · **Owner:** Arda · **Status:** owner-approved in chat 2026-09-26 (picks 1C, 3B, 4B,
5A; the "room" summit; catching helps the player; demands fixed for now).
**Sources:** review page https://claude.ai/artifact/KJrh1kbwMqxt2egkGZhf1H; mockups
`docs/design/mockups/K2-summit.html` (states `#room`, `#promise`, `#vote`, `#caught`, `#arrive-c`, `#keep-b`,
`#watch-b`); research `docs/research/summit-games/reports/Summit mechanics in similar games.md`.

## 1. Where it sits in time

- Era 5 is four story weeks (hidden round marks every 7 days, 45 real seconds each at ×1).
- **The President calls first (1C).** His second meeting moves from era 5 week 2 to the last round of era 4
  (`MEETINGS.second = { era: 4, turnInEra: 3 }`), so it opens as era 5 begins. His demand, "sign nothing that
  helps China", follows the player into the summit as a note.
- **The summit opens in era 5 week 1** (`era === 5 && turnInEra === 0 && !deal`), as today. The clock stops
  while the President meeting and the summit are open (both are dialogs). Skipping keeps today's cost.
- **After the summit the deal is tested once a week (5A)**, at the three remaining round marks.

## 2. The summit screen (the room)

A front-on hall. Six delegates (OpenBrain, DeepThink, the West, the East, Qilin, Lodestar) sit at a curved
table. Each holds a placard (SIGN / ? / NO) for the selected proposal and has one named demand in a bubble,
marked "Met" or "Not met yet". A sticky note carries the President's demand (if his meeting happened).

The player makes four choices:

1. **Up to three proposals** from the six commitments (`evaluators`, `computeCap`, `releaseDelay`,
   `sharedSafety`, `pauseAutomation`, `verification`; player-facing names on the page).
2. **A checking level per proposal:** 0 on trust, 1 self-reports, 2 outside testers, 3 inspectors.
3. **Up to three promises, one per delegate.** A promise meets that delegate's demand, at a price:
   `pay` ($50M, needs cash ≥ 50), `goFirst` (testers in our lab now: exposes half the concealed debt),
   `inspectors` (the player accepts inspectors: the player's own catch chance uses level 3 on every card).
4. **Call the vote.** Placards go up; the big screen shows what binds.

### Fixed demands (data, `sim/data/summit.js`)

| Party | Demand (player-facing) | Rule |
|---|---|---|
| OpenBrain | "We sign if Qilin signs. Testers at most." | signs a card only if Qilin signs it and its level ≤ 2 |
| DeepThink | "No cap on runs. Anything else, we can talk." | never signs `computeCap` |
| The West | "Nothing that lets China inspect us." | never signs `verification` |
| The East | "Checks go both ways, or no deal." | signs nothing unless its demand is met by a promise |
| Qilin | "We sign what our government signs." | signs a card only if the East signs it |
| Lodestar | "Real checks: testers or better." | signs a card only if its level ≥ 2 |

A promise to a party meets its demand completely. Parties are resolved in dependency order
(East, West, DeepThink, Lodestar, then Qilin, then OpenBrain).

### Who signs

A party signs a proposal when its demand is met **and** its stance (with a little noise at the vote) clears
`SIGN_AT`. A follower (OpenBrain, Qilin) keeps its word instead: unpromised, it signs exactly when the party it
follows signs (and, for OpenBrain, the card is checked no harder than testers); promised, it signs on its stance. Stance keeps today's
terms (caution, gap to the leader, race heat, public trust, government favor, pooling, noise) plus:
a checking-level lean per party (Lodestar and the East like strict checks, OpenBrain and Qilin dislike them)
and a promise bonus for the promised party. `SIGN_AT` is tuned so a careful player can bind two cards.
Jules's read per proposal and party is `yes | maybe | no` (demand unmet reads `no`).

A proposal **binds** when at least one other lab and one government sign it (unchanged). Binding is fixed at
the vote; expelling a cheater later does not unbind a card. Card effects on binding are unchanged.
If `verification` binds and the President's meeting was held, US favor drops by 10 (his demand).

## 3. After the summit

### Rivals (4B)

At each weekly mark, each signing rival still in the deal may break it. Chance: today's terms (race heat,
gap to leader) plus 0.1 for the capability leader and 0.1 if insulted last week, minus 0.05 × the strictest
check on cards it signed (deterrence); Qilin keeps its ×0.3 when `verification` binds.

A break is **caught at once** with chance `CATCH[level]` = [0.1, 0.25, 0.6, 0.9] (level = strictest check on
cards that rival signed). If not caught, the rival gains 6 capability and a **suspicion** appears with chance
`SIGN_SEEN[level]` = [0.5, 0.6, 0.8, 1]. Signing rivals that did not break may raise a **false alarm** with
chance `FALSE_ALARM[level]` = [0.3, 0.2, 0.1, 0.02].

A suspicion is a Jules warning bubble with a 5-day deadline. The verb depends on the level: accuse in public
(0), demand their report (1), ask the testers (2), inspectors check (3). Investigating a real break catches it
with chance `INVESTIGATE[level]` = [0.4, 0.55, 0.85, 0.95]. Investigating a false alarm finds nothing: the
lab is insulted (+0.1 break chance next week) and, at level 0, public trust −2.

**Catching helps the player:** the cheater scraps the run (−6 capability if it had gained it), is removed
from every signed list, the deal stands, and public trust +3.

### The player (3B)

Breaking the deal is a real action, never a switch:

- a training run while `computeCap` binds is capped (the deal kept) unless the player ticks "Run past the cap"
  on the run's last stage, which sends `breakDeal: true` and runs uncapped;
- a release inside the launch gap while `releaseDelay` binds fails with "this launch breaks the Geneva deal";
  the release screen then offers "Launch anyway", which resends with `breakDeal: true`;
- (later, with plan 2H) turning automation back on while `pauseAutomation` binds.

Breaking sets `deal.playerShipped` (no deal ending) and queues a catch roll at the next weekly mark with
`CATCH[level of the broken card]` (level 3 if the player promised `inspectors`). Caught: public trust −8,
US favor −6, the deal collapses (unchanged penalties).

## 4. State and events

`state.deal = { proposals, checks: {card: level}, promises: {party: type}, signed, binding, expelled: [],
suspicions: [{ id, party, real, day, dueAt }], insulted: {party: true}, playerBreaks: [card],
collapsed, playerShipped }`.
Events: `summit`, `dealBreakCaught {party}`, `dealSuspicion {party}`, `investigated {party, found}`,
`playerBreak {card}`, `playerCaught`, `dealCollapsed`, `presidentAngry`.
Actions: `moves: [{ type: 'summit', proposals, checks, promises }]`; `actions.investigate: [suspicionId]`
(free, no team slot); `breakDeal: true` on `startRun` and `release` moves. `holdOrShip` is retired.

## 5. Out of scope now

Delegate demands drawn per run (owner: fixed for now); new demands for later eras; the ending film changes.
