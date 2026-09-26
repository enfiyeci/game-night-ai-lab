# Showing the board: design spec

Date: 2026-09-26. Branch: `board-redesign`. Status: design approved by the owner over three rounds of mockups; to be
implemented in a new session (owner, 2026-09-26: "after spec is done, we will implement it in a new session").

## 1. Goal

The player can be removed by a seven-member board (`sim/board.js`), but the game never shows the board. After this work,
the player:

1. can look the board up at any time and see who sits on it, roughly where each director stands, and what moves them;
2. feels a board meeting coming: a countdown, a warning when it is close, and events in the weeks before it that move
   the odds;
3. lives the vote as a staged event: a tense video-call meeting where they can offer deals, then a slow vote-by-vote
   reveal, then the result screen.

Support is never shown as a number and the cut-off is never drawn. The player sees an estimate that can be wrong.

## 2. Sources

- Pick page (private artifact, all three rounds): https://claude.ai/artifact/UfXJZwdeTWnybtnSUuTgnm
- Mockups: `docs/design/mockups/board/`. `board.html?m=<id>` draws a frame over the real game (serve the repo root);
  `meeting.html?step=<step>` or `?play` runs the meeting prototype. Frame ids used below: L1 (board screen), L4 (what
  moves the board), P1 to P5 and R1, R3 (pre-meeting events), 4A (the result dialog). Shared data and portraits:
  `docs/design/mockups/board/board-data.js`; the meeting: `meeting.js`, `meeting.css`.
- Research: `docs/research/lab-boards/real-lab-boards-2026-09-26.md` (who sits on real boards) and
  `docs/research/lab-boards/game-board-screens-2026-09-26.md` (what other games show; unverified raw research).
- Parked idea, not in scope: calling a director (`docs/notes/later.md`).

## 3. Owner decisions (2026-09-26)

| Topic | Decision |
|---|---|
| The vote | A video-call board meeting, staged "like a model release but with better aesthetics", then the result dialog (4A) "after the facetime reveal animation". |
| Vote pacing | "Each voting was a little bit too fast": about 2.4 s per vote, a thinking pause before each card, a longer pause before the deciding vote. |
| Meeting content | More than a yes/no poll: insights drawn from similar games, and it must be tense. |
| Looking it up | L1, the board screen, with L4, "what moves the board", as its second tab. |
| Support display | An estimated band, never the exact number ("with some confidence interval, to make the user more ambigious sometimes"). No threshold line. |
| The vote rule | "4 keep you" stays visible (the rule of the vote, not a director's cut-off). |
| Deals | Yes, offered in the meeting before the vote, and "lets allow multiple too". |
| Warning | Yes: about a month ahead, when the staff read says it is close, plus a countdown. |
| Pre-meeting events | Kept: the request (P1), the wobble (P2), the leak (P3), the op-ed (P4), going quiet (P5). The rival lunch is out; its replacements are a buyer circles (R1) and Washington calls (R3). R2 (whistleblower) is not in scope. |
| Calling a director | Parked in `docs/notes/later.md`. |
| Time | The game is moving to real time ("we stopped doing turns we are doing time"). No turn or move wording anywhere in this feature. |

## 4. Where the code stands, and what this builds on

- **The board sim exists** on this branch (`sim/board.js`, `sim/boardPromise.js`): seven directors with support 0 to
  100, a vote passes with 4 of 7 at 55 or above (`BALANCE.boardSupportLine`, `boardPassMembers`), votes at the era gate
  of eras 2, 3 and 4 (`boardVoteAtGate` in `sim/data/eras.js`) and the round after a badly missed compute promise
  (`flags.boardVoteDue`), a once-per-run staff letter that reverses a lost vote (`holdVote`).
- **The engine is still turn-based.** `endTurn` in `sim/turn.js` runs one round; eras have 4 rounds; `monthsPerTurn`
  is 3, 3, 1, 1, 0.25. The vote happens inside `endTurn`: `checkTurnEndings` (promise votes) and `eraGate` (gate votes,
  after `leftBehind` is checked).
- **Real time is not built on any branch.** The events lane and the real-time lane agreed an API for a clock that runs
  over the unchanged engine, attached as `game.clock`: `pause(reason)`, `resume(reason)`, `now()` →
  `{ monthsElapsed, y, m, w, day }`, `daysUntilNextRound()`, `on('tick' | 'round', fn)`, `speed`, `skip()`. Like the
  event cards, everything here must work with and without `game.clock`.
- **Event cards are built on `origin/events-build`** (plan 2B Task 8, Codex round 3 APPROVED, not yet merged into
  `ui`): `ui/screens/events.js`, `ui/screens/briefing.js`, `ui/logic/events.js`, `ui/data/eventCopy.js`,
  `ui/components/eventBits.js`. Cards come from `state.pendingEvents` in the sim and render generically, so new sim
  events appear as cards without UI changes, given entries in `eventCopy.js`.
- **`origin/ui` just merged the release flow** and is 14 commits ahead of this branch.

**First step of the build: merge `origin/ui`, then `origin/events-build`, into `board-redesign`.** A trial merge on
2026-09-26 (at `0cc56b7`) showed conflicts only where both sides appended to the end of `ui/styles.css` (ui merge) and
`ui/styles.css` plus `ui/main.js` (events merge). Resolve by keeping both appended blocks. Run `npm test` after each
merge.

## 5. The rules (sim)

All new numbers live in `BALANCE` (`sim/balance.js`) with a comment; the owner has deferred balance to after the first
playthrough, so pick sensible values, run the balance scripts, and record the shifts rather than tuning hard.

**Randomness.** Nothing here may draw from the main `rng`, which would shift every later roll and every balance test.
Use `sideRng(state, 8)` (`sim/contracts.js`; salts 0 to 7 are taken, see the comment in `sim/turn.js`) for event
picks and outcomes, and a pure hash of `(state.seed, state.turn, director index)` for the staff read's noise.

### 5.1 The staff read (estimated support)

`boardRead(state)` in a new `sim/boardRead.js`, pure, returns for each director `{ id, lo, hi, lean }` and a tally
`{ sure, maybe, against, lo, hi }`.

- Centre: true support plus a misread offset in [−4, 4] from the hash (stable for a round, changes each round).
- Spread (half-width): base 5; +4 if the director moved 3 or more points last round; +6 for the candor watchdog
  ("keeps her cards close"); +4 for a director with an open deal (5.2); +10 for everyone while the leak is active
  (P3); +8 for everyone while going quiet (P5). Clamp `lo`, `hi` to 0..100.
- `lean`: `with` if `lo >= 55`, `against` if `hi < 55`, else `leanWith` or `leanAway` by the centre. The cut-off (55)
  is used only inside the sim; the UI never receives it.
- Tally: `sure` = count of `with`, `against` = count of `against`, `maybe` = the rest; "between `sure` and
  `sure + maybe` would keep you".
- Needs last round's board: store `state.boardLast` (a copy of `state.board` at the start of `endTurn`) and
  `state.boardBefore = boardSnapshot(prev)` (already computed as `before` in `endTurn`) for the L4 issue trends.

### 5.2 Deals

New `sim/boardDeals.js`. Made in the meeting, as `actions.boardDeals = [{ member, kind }]`, applied at the start of
`endTurn` next to `actions.boardPromise`, so they count in that round's vote.

- Any number of deals, at most one per director per meeting.
- Making a deal: that director's support rises by `BALANCE.boardDealBoost` (suggest 5); their read spread widens
  (5.1). Store `state.boardDeals = [{ member, kind, madeTurn, baseline, status: 'open' }]`.
- Judged at the start of the next board meeting's `endTurn`, before its vote. Deals made at the last meeting (era 4)
  are judged at the run's end, for the feed and end screen only.
- Kept: +3 with that director. Broken: that director is lost for good (support −20 and capped at
  `BALANCE.boardLostCap`, suggest 40, for the rest of the run, enforced in `updateBoard`) and the candor watchdog loses
  6 (unless she is the one broken with).
- The catalogue, one kind per director, from what moves them in `updateBoard`:

| Director | Deal text (player-facing) | Kept if, at judging |
|---|---|---|
| Growth investor | Revenue up a fifth by the next meeting | `arr >= 1.2 × baseline.arr` |
| Infrastructure financier | A higher valuation by the next meeting | `valuation > baseline.valuation` |
| Sovereign fund | A year of cash at the next meeting | `runway(state, 'planned') >= 12` |
| Safety chair | Safety compute at target by the next meeting | `compute.split.safety >= era target` |
| Candor watchdog | No hidden problems come out before the next meeting | no concealed debt exposed, no leaked promise, no broken promise since `madeTurn` (compare `boardSnapshot` counts) |
| Security hawk | Security above 40 by the next meeting | `security >= 40` |
| Mission trustee | Public trust above 55 by the next meeting | `publicTrust >= 55` |

The mockup's "no launches until public trust recovers" became the trust target: blocking releases would need UI locks
across the release flow.

### 5.3 The vote record

`holdVote` adds to `state.flags.lastBoardVote`: `votes` (a boolean per director, in `BOARD_MEMBERS` order),
`kind: 'gate' | 'promise'`, and keeps `reversedByStaff`. The UI plays the reveal from this record, never from its own
guess.

`boardVoteThisRound(state)` (in `sim/board.js`), pure: true when the round now being played will hold a vote, i.e.
`eraById(era).boardVoteAtGate && turnInEra === turns - 1`, or `flags.boardVoteDue`, or, on era 5's last round, an
open compute promise for era 5 whose compute online now is under half the promise (the promise is judged at that
round's end and a bad miss votes at once; whether it will miss cannot be known exactly beforehand, so this is a
forecast). The UI uses it to open the meeting before that round ends. It can be true and still no
vote happens (another ending first, or `leftBehind` at the gate); the UI then skips the reveal and lets the ending play.

### 5.4 The warning and the countdown

`meetingInfo(state, clock)` in `ui/logic/board.js` (UI, pure): the next meeting's kind and time left. Without a clock,
time left = rounds left in the era × `monthsPerTurn`; with a clock, from `clock.now()` to the era's end. Only eras
with a gate vote have a scheduled meeting; a promise vote is a "special meeting" called for the end of the next round.

`boardWarning(state, clock)`: show when a meeting is at most a month away (without a clock: from the start of the
vote round) and the read's `sure` is below 4. "Going quiet" (P5) switches on at the same moment (sim flag set in the
vote round when the read is close; it widens every band by 8).

### 5.5 Pre-meeting events

New `sim/data/boardEvents.js`, included by `allEvents()` in `sim/events.js` (a one-line change). Same shape as
`EVENTS`: `id`, `trigger`, `card` (`title`, `post`, `choices` with `label`, `cost`, `backers`, `opposers`,
`effects`), `fallback`, plus two new optional card fields passed through `publicCard`: `watching` (director ids) and
`kicker` ("Before the board meets").

- Window: only in eras with a gate vote; one card may land when `endTurn` ends round 2 and one when it ends round 3 of
  the era (turnInEra 1 and 2), so each is on screen, and answerable, before the vote round ends. Pick with
  `sideRng(state, 8)` from the eligible ones; each fires at most once per run (`seenEvents`). Board cards set
  `bypassCardLimit: true`: a card deferred by the two-card limit would miss its meeting.
- Card copy (titles, posts, choice labels, costs) as in frames P1 to P4, R1, R3; costs must not show hidden numbers
  (the events lane rule). Advisor argue lines, timing and consequence lines go in `ui/data/eventCopy.js` as
  `// OWNER WRITES` placeholders, like every other card.

| Event | Eligible when | Choices and effects (suggested) |
|---|---|---|
| The request (P1) | candor watchdog support below 70 | Send as they are: candor +6; safety chair −4 if safety is under target. Send a cleaned-up version: nothing now, but a 35% `sideRng` chance it comes out before the meeting, and then the candor watchdog is lost (5.2's broken rule). Stall (fallback): candor −5. |
| The wobble (P2) | growth investor support 65 or more | Raise prices this month: growth +6, public trust −4. Walk him through the long plan: growth +2. Let him vent (fallback): growth −8. |
| The leak (P3) | any | Find the leaker: candor −6, staff trust −4, the leak ends. Post that the board backs you: directors at 55+ get +2, those below −3. Say nothing (fallback): the leak stays until the meeting (every band +10). |
| The op-ed (P4) | public trust below 60 | Write a reply: public trust +2. Give a long interview: public trust +6 or −6 (`sideRng`). Ignore it (fallback): public trust −4. |
| A buyer circles (R1) | eras 3 and 4 | Take the call yourself: the three money seats +4, safety chair and trustee −4. Refuse in public: money seats −5, trustee +4, public trust +2. Let it play out (fallback): money seats −2. |
| Washington calls (R3) | eras 3 and 4 | Brief him yourself first: security hawk +5. Send your security lead: security hawk +8 if security is 45 or more, else −8. Stay out of it (fallback): security hawk −4. |
| Going quiet (P5) | the vote round, when the warning shows | Not a card. Every band +8; the UI shows the quiet panel. |

## 6. The screens (UI)

Look: the game's K2 tokens only (`--cream`, `--paper`, `--ink`, `--teal`, `--wood`, `--coral`, `--sky` and
`color-mix()` of them); the meeting's dark is mixed from `--ink` and `--wood` (see `meeting.css`). Nunito; Caveat is
not needed in the build. All player copy in `ui/data/boardCopy.js`, with director lines, captions and jokes marked
`// OWNER WRITES` (the owner writes narration and joke copy; see the design learnings). A test forbids "turn", "move"
and "round" in that file.

**Portraits.** Port `portrait()`, `LOOK`, hair and face drawing from `docs/design/mockups/board/board-data.js` into
`ui/components/portraits.js`. Mood from the read's lean (with: smile, leanWith: flat, leanAway: worried, against:
frown), never from true support.

### 6.1 The board screen (L1) with "What moves the board" (L4)

Company submenu item "The board", free (no move), opens one dialog with two tabs, like the finance planner's Timeline
and The books.

- **The board tab (frame L1):** the GDT dialog trio. Centre: money seats and oversight seats; per director the portrait,
  name, "Wants: …", the band (`rb`), a lean word (With you / Leaning your way / Leaning away / Against you) and an arrow
  for which way they moved since last round (no digits). Bottom: seat dots and "Between N and M would keep you. You
  need 4." Left: Team opinions on the board. Right, "Next meeting": when, what is on the agenda, the read, the hardest to
  read, cooling fastest, the last meeting's result, open deals, and "Bars show where your staff think each member is.
  They have been wrong before."
- **What moves the board tab (frame L4):** issues on the left (revenue, valuation, cash runway, promises, safety share,
  honesty, Washington, security, public trust, constitution), each with its state this round from `state.boardBefore`
  versus now; the seven directors on the right with a lean halo; links from each issue to the directors it moves
  (straight from `updateBoard`), teal when it pushes them toward you, coral away, dashed when quiet; a tip naming the
  director to worry about. Draw it as SVG; zero crossings are not required, but keep the order from the mockup.

### 6.2 The countdown and the warning

- A small chip under the HUD's info box, "Board meets in 3 weeks" (weeks, then days in the last fortnight; red when the
  warning is on), in eras with a scheduled meeting; "Special board meeting at the end of the month" for a promise vote.
  Mount it in its own element: the HUD re-renders `#hud` wholesale.
- The warning: Policy and Comms' speech bubble at their desk, using the events lane's `bubbleAt`, for example "Board
  meets in four weeks. I count three sure. We need four." with "See the board ›". It does not pause the clock.
- Going quiet (P5): the advisors' lines and the small panel of seven faces with wide bands, "7 seen · 0 replies".

### 6.3 Pre-meeting event cards

They are events-lane cards (5.5). The only UI change: when a card has `watching` and `kicker`, `ui/screens/events.js`
draws the wood kicker bar with "Before the board meets" and the watching faces, as in frames P1 to P4. Keep the change
small and inside that module's render.

### 6.4 The board meeting (the vote)

A full-screen overlay, `ui/screens/boardMeeting.js`, ported from `docs/design/mockups/board/meeting.js`.

**Opening it.** Before the round that holds a vote ends (`boardVoteThisRound`), the meeting opens instead of the round
ending: from the menu's End turn, and, once real time lands, before the clock ends that round. Build this as a round
guard: `game.beforeRoundEnd` (a list of async functions) that End turn and the future clock both await before calling
`game.endTurn()`. The meeting pauses the clock (reason `'board-meeting'`).

**The sequence** (timings from `TIMELINE` in `meeting.js`):
1. **The call rings** over the blurred, letterboxed office: the seven faces, "Board of directors", "Special meeting ·
   end of era N", "Motion: remove the chief executive". Join; Decline only earns a joke line.
2. **The meeting:** a 4 × 2 grid, each director on camera in their own drawn room (the `SCENES` in `meeting.js`), you in
   the eighth tile. Top: "Motion: remove the chief executive", the keep / undecided / remove bar from the read's tally,
   "Minutes are being recorded". Captions cycle through the directors raising their issues. The private notes rail
   ("only you see this"): the staff read marked "can be wrong", what they will raise (from L4's issues), the swing
   directors as bands, a side-message line (two leaning-away directors "are messaging each other"), and **deals**: the
   catalogue (5.2) for every director, any number selectable, "Each deal you break later costs you that member for
   good." Then **Call the vote**.
3. **The vote:** the UI queues `boardDeals` with `game.setField` and calls `game.endTurn()`. From the new state's
   `flags.lastBoardVote` (only if its `turn` is this round), reveal the real votes: directors dim, then one at a time,
   most certain first and the closest last (order by the read's distance from the cut-off, computed in the sim and
   passed as an order, never as numbers), each with a thinking "…" beat, then a Keep or Remove card and their line. A
   running tally with seven slots and "4 keep you". About 2.4 s per vote, and a longer pause before the last.
4. **The result:** "4 to 3 · You stay" or "3 to 4 · The motion passes". If `reversedByStaff`, play the twist: the vote is
   lost, then a message that most of the lab signed a letter, and the board backs down.
5. **The result dialog (frame 4A):** the GDT dialog with seven seats, the score, one line on why, and "Since the last
   vote" (who switched, from the two vote records). OK is "Back to work". If the vote removed the player, the ending
   film follows: the ending screen must wait until the meeting closes (the meeting dispatches `board-meeting-open` and
   `board-meeting-closed` on the overlay; `mountEnding` holds while it is open).

If no vote was held (another ending first, or left behind at the gate), close the meeting and let the ending play.

**Reduced motion:** every step still shows, without animation; the vote reveals in one step per director.

## 7. Files

| File | Change |
|---|---|
| `sim/boardRead.js` | New: the staff read (5.1). |
| `sim/boardDeals.js` | New: the deal catalogue, making and judging (5.2). |
| `sim/data/boardEvents.js` | New: the six pre-meeting cards and going quiet (5.5). |
| `sim/board.js` | `holdVote` records votes and kind; `updateBoard` honours lost directors; `boardVoteThisRound`. |
| `sim/turn.js` | Store `boardLast` and `boardBefore`; apply `actions.boardDeals`; judge deals before a meeting's vote; set the going-quiet flag. |
| `sim/events.js` | Include board events; pass `watching` and `kicker` through `publicCard`. |
| `sim/state.js` | Initial `boardDeals: []`, `boardLast`, `boardBefore`. |
| `sim/balance.js` | The new numbers, commented. |
| `ui/components/portraits.js` | New: director portraits. |
| `ui/logic/board.js` | New, pure: meeting info, warning, L4 issues, vote order view, dialog models. |
| `ui/data/boardCopy.js` | New: all board copy, owner-writable placeholders. |
| `ui/screens/board.js` | New: the board dialog (two tabs), the countdown chip, the warning bubble, going quiet. |
| `ui/screens/boardMeeting.js` | New: the meeting overlay and the 4A result dialog. |
| `ui/menu.js` | "The board" in `COMPANY_ITEMS`; End turn awaits `game.beforeRoundEnd`. |
| `ui/game.js` | `beforeRoundEnd` list. |
| `ui/main.js` | Mount the board screens (append). Preview routes `#board`, `#board-moves`, `#meeting`. |
| `ui/screens/end.js` | Hold while a board meeting is open. |
| `ui/screens/events.js` | Draw the kicker and watching faces when present. |
| `ui/data/eventCopy.js` | Timing, argue and consequence lines for the six new cards. |
| `ui/styles.css` | One appended block, classes prefixed `bd-` (dialog, chip) and `mt-` (meeting). |
| `tests/board-read.test.js`, `tests/board-deals.test.js`, `tests/board-events.test.js`, `tests/ui-board.test.js` | New. |

## 8. Tests and checks

- **Sim:** the read is stable within a round and changes across rounds; bands contain the true value at base spread;
  the leak, quiet and deal widen them; no main-`rng` draws (balance runs are unchanged by the read alone); deals apply
  before the vote, one per director, judged before the next vote, broken ones cap the director and cost candor; the
  vote record's `votes` match the tally and survive the staff letter; `boardVoteThisRound` is true exactly in vote
  rounds; board events only fire in the window and at most once; every choice leaves state valid (`normalize`).
- **UI logic (node):** meeting info and the warning with and without a stub clock; L4 issue states from snapshots; the
  vote order comes from the sim; board copy has no "turn", "move" or "round"; no support digits in any board string.
- **Screens:** screenshot every state at 1440 × 900: L1, L4, the countdown (calm and red), the warning, going quiet, each
  new card, the meeting's ring, room with deals, voting, the last vote, the result (win, loss, staff letter) and 4A. The
  preview routes exist for this. Check reduced motion.
- **Balance:** run the scripts in
  `~/claude-sync/handoffs/enfiyeci-game-night-ai-lab/artifacts/gn-board-ui/balance-scripts/` (`ROOT=<worktree> node
  summary.mjs 200`) before and after; the strategies take card fallbacks and make no deals. Record removal rates per
  strategy in the commit message. If balance tests move, mark them known issues with a note, as the owner asked for the
  last two ("mark as known issue with a note and we will run the balance later").
- `npm test` green apart from known issues.

## 9. Build order

1. Merge `origin/ui`, then `origin/events-build` (section 4).
2. Sim: read, vote record and `boardVoteThisRound`, deals, board events, going quiet. Tests first.
3. UI logic and copy, portraits.
4. The board dialog (L1, L4), countdown, warning, going quiet.
5. The meeting overlay and 4A, the round guard, the ending hold.
6. The card kicker and watching faces; event copy entries.
7. Screenshots, balance run, review.

**Review:** each step is one substantive change: a reviewer pass plus one Codex adversarial pass per step batch, not
per commit (global review rules). Before merging `board-redesign` into `ui`, the tier-3 pair runs over the whole
branch; it also covers the finance planner fix `18883b0`, which was never re-reviewed.

## 10. Out of scope

Calling a director (`docs/notes/later.md`); the whistleblower card (R2); building the real-time clock itself (the
real-time lane owns `ui/clock.js`, `ui/hud.js`, `ui/menu.js`'s clock parts); rebalancing removal rates (deferred by
the owner).

## 11. Open points the build should raise, not decide

- The deal numbers and card effects above are suggestions; the owner will balance after the first playthrough.
- Director lines, captions and jokes are placeholders for the owner to write.
- If the real-time lane lands first with a different round-end hook than `beforeRoundEnd`, adapt to theirs and say so.
