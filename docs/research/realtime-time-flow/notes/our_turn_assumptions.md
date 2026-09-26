# Turn assumptions in Game Night AI Lab — inventory for the real-time redesign

Scope: every place the codebase, tests, spec and plans assume 20 discrete turns, and what a
"clock over the unchanged turn engine" design (time ticks; a turn's worth of story time calls the
existing `endTurn(actions)`; the clock pauses on any card/dialog) would and would not cover.

All files below were read in full in this session unless marked with a literal ⚠️ noting exactly
what was skipped. See the **Coverage statement** at the end for the complete list.

---

## 1. The turn engine: `sim/turn.js` (read in full, 333 lines)

### `endTurn(prev, actions, rng)` step by step (lines 97–333)

1. **Clone state; reset per-turn flags.** `structuredClone(prev)` (line 98); `delete
   state.flags.emergencyUsedThisTurn` (line 102, a genuinely per-turn flag: emergency options can
   be used at most once per turn, reset every turn). If `state.ending` is already set, return
   immediately with error `'the run is over'` (line 103).
2. **Turn-0 only: constitution.** If `state.turn === 0`, an `actions.constitution` payload is
   validated and applied via `setConstitution`; if the player supplied nothing, a default
   constitution is forced (lines 104–115). Any `actions.constitution` on a later turn is an error
   ("the constitution can only be set on turn 0", line 115). **This is a hard `state.turn === 0`
   check**, not "the first time the player acts" — see §3(H) below.
3. **Moves: read and cap.** `const moves = actions.moves ?? []`; if `moves.length > MAX_MOVES`
   push an error; `activeMoves = moves.slice(0, MAX_MOVES)` (lines 116–118). `MAX_MOVES = 2` is
   exported at line 34 and is the single hard hard-coded hard cap on strategic actions per call to
   `endTurn`.
4. **President meeting due-check.** If no meeting is already open, and the player did not try to
   answer one, check `meetingDue(state)` (era/turnInEra match against `MEETINGS`, `sim/president.js`
   lines 43–48) and open it if due (lines 119–129).
5. **Free, non-move actions applied in a fixed order, all before the move loop:** budget
   (`setBudget`, line 130), compute split (line 134), safety-compute pledge (line 138), contract
   actions — scale-down/break/buyout (line 142), queue-order withdrawal (line 146), a
   same-turn burn re-projection if any contract action ran (line 153), the training hazard choice
   (line 157), addressed warnings (line 162), event-card choices — explicit then leftover, in that
   order (lines 166–181), and the era-5 hold-or-ship choice, only when
   `state.era === 5 && state.deal && state.turnInEra > 0` (line 189).
6. **Releases activate; serving and burn refresh** (lines 196–198) before the move loop, so a
   model whose `activeFromTurn` has arrived shows up before this turn's moves run.
7. **The move loop** (lines 200–226): each of up to `MAX_MOVES` (2) queued moves is applied via
   `applyMove` (switch on `move.type`: `startRun`, `release`, `deal`, `queueOrder`, `buildSite`,
   `raise`, `research`, `emergency`, `deployInternal`, `stopInternal`, `amendConstitution`,
   `summit` — lines 58–74), with serving/burn re-projected after each successful move, and the loop
   stops early if a move ends the run (`state.ending`, line 225).
8. **If a meeting was open and never answered, it expires as a walkout** (lines 228–234).
9. **If the run isn't over:** `budgetEffects(state)` (line 237; see §2), split effects (safety
   compute, outage check, pledge-broken check, line 238), internal-deployment tick (line 242),
   training advance (`advanceRun`, line 244), contract turn-end risk (spot-pull warning, CoreFlame
   trouble roll, line 247), era-3 queue allocation (line 252), user growth (line 256), the economy
   (`applyEconomy`, line 263 — cash, ARR, valuation), compute-surge countdown (line 264), credit
   spend (line 268), contract expiry and spot pull-back (lines 269–270), the structure-change
   conversion-deadline check (`state.flags.conversionDeadline`, `state.turn >=` that deadline, line
   271), legal-case payouts (`legalTick`, line 278), rival turns (line 279), race-heat decay (line
   281), President-promise upkeep (`promiseUpkeep`, line 282), the event-card engine
   (`eventsTick`, line 283), normalization, board update, and the four "roll every turn" endings
   (`checkTurnEndings` — out of cash, board vote, misuse, race-heat disaster; line 286).
10. **Era-5 summit-skip penalty**, only if the player reached era 5, turn-in-era 0, and never
    proposed a summit (line 290).
11. **Advance the clock:** `normalize`; `recordAdvisors` (line 298); `state.turn += 1;
    state.turnInEra += 1; state.monthsElapsed += era.monthsPerTurn;` (lines 300–302).
12. **Era gate**, only when `state.turnInEra >= era.turns` (line 303 — `era.turns` is 4 in every
    era, so this fires exactly every 4th call): `eraGate(state)` (board-vote/left-behind checks);
    if still alive, either finish the run (era 5) or advance to the next era and reset
    `turnInEra = 0` (lines 304–316).
13. **End-of-turn delivery for the *new* turn:** power-site online checks, contract/queue
    deliveries due on the turn just entered, refreshed compute offers, and a final serving/burn
    re-projection — all only if the run did not just end (lines 317–323), so the state handed back
    to the player already includes everything due "today."
14. **Ending cleanup** (promise judging, feed filtering) if the run ended this call (lines
    324–330).

### `MAX_MOVES` — where it's enforced

Exported once, `sim/turn.js:34`. Enforced by truncation+error at `sim/turn.js:117-118`
(`activeMoves = moves.slice(0, MAX_MOVES)`), and mirrored in the UI at `ui/game.js:39`
(`addMove` refuses once `actions.moves.length >= MAX_MOVES`) and `ui/game.js:70-72`
(`movesLeft()`). The UI's move-counter widget (`ui/menu.js:287-290`, `"${used} of ${MAX_MOVES}
moves used"`) and every screen's "uses 1 of 2 moves this turn" footer line
(e.g. `ui/screens/company.js:222`, `:320`, `:405`; `ui/screens/compute.js:259`, `:454`;
`ui/screens/sites.js:167`) read `MAX_MOVES`/`movesLeft()` directly.

### The per-turn budget: how it's computed and consumed

`budgetEffects(state)` (`sim/turn.js:76-86`): `const k = (spend * eraById(state.era).monthsPerTurn)
/ 30;` — the discretionary-spend multiplier is explicitly scaled by the era's `monthsPerTurn`, so
a $30M/month spend over a 3-month turn (era 1) buys 3× the effect of the same spend over a
1-month turn (era 3/4), and 12× a 0.25-month turn (era 5) buys 1/12 the training bonus, security,
growth-boost, research-point and staff-trust effect of the same dollar figure in era 1. This `k`
feeds: `activeRun.bonus` (training), `state.security`, `state.growthBoost` (read by `growUsers`),
`state.researchPoints`, `state.staffTrust`. Interpretability exposure (`exposeConcealed`) is
gated on `safetySpend(state) >= INTERPRETABILITY_SPEND` (turn.js:85), not turn-scaled itself.
Budget is a **standing setting**, not a "move": it can be changed on any turn without consuming a
move slot (`ui/menu.js:9`, `{ id: 'budget', ..., free: true }`), and its effect is applied exactly
once per `endTurn` call regardless of how much real time elapsed since it was last touched.

### Per-turn (reset every turn) vs. accumulated state

- **Reset each `endTurn` call:** `flags.emergencyUsedThisTurn` (turn.js:102); the active-move
  slots (`actions.moves`, capped at `MAX_MOVES`); `state.burnPlanned` is recomputed fresh each call
  (not carried over) though it feeds into the rolling `burnTrailing` average
  (`economy.js:71-72`, last 3 turns).
- **Accumulated / monotonic:** `state.turn`, `state.turnInEra`, `state.monthsElapsed`
  (turn.js:300-302); `state.alignmentDebt`/`concealedDebt` (only ever adjusted, never reset);
  `state.raceHeat` (decays by a fixed `BALANCE.raceHeatDecay` per turn, turn.js:281, itself a flat
  per-turn amount, not months-scaled); `state.legalCases` (each carries a `dueTurn`, checked
  against raw `state.turn`, `economy.js:87-95`); `state.promises` (`dueTurn` in raw turns,
  `sim/promises.js:34`); `state.compute.contracts[].monthsLeft` (decremented by `monthsPerTurn`
  each turn, `contracts.js:170`, i.e. counted in months but only ever touched at a turn boundary);
  `state.board` (updated once per turn via `updateBoard`, `sim/board.js:13-21`, itself partly a
  function of the turn's start-of-turn `before` snapshot).

---

## 2. Eras: `sim/data/eras.js` (read in full, 9 lines)

| Era | Name | monthsPerTurn | turns | targetSafetyShare | boardVoteAtGate |
|---|---|---|---|---|---|
| 1 | Chat assistants | 3 (quarter) | 4 | 0.15 | false |
| 2 | The scale-up | 3 (quarter) | 4 | 0.2 | true |
| 3 | Reasoning and agents | 1 (month) | 4 | 0.25 | true |
| 4 | The gigawatt race | 1 (month) | 4 | 0.3 | true |
| 5 | Self-improvement and pacing | 0.25 (week) | 4 | 0.35 | false |

20 turns total (4 × 5). In story time: era 1 spans 12 months, era 2 another 12, era 3 spans 4
months, era 4 another 4, era 5 spans **1 month** (4 × 0.25). So the 20 turns are *not* evenly
spaced in story time at all: the last quarter of the game (5 turns' worth of screen time) covers
1/28th of the story's elapsed months. `eraById(id) = ERAS[id-1]` (line 9) is the only accessor;
every reader below goes through it.

**Every place in `sim/` that reads `monthsPerTurn`** (grepped and read at each site):

| File:line | What it does with `monthsPerTurn` |
|---|---|
| `sim/turn.js:79` | Discretionary-spend multiplier `k` (see §1) |
| `sim/turn.js:302` | `state.monthsElapsed += era.monthsPerTurn` — the only place months are accumulated |
| `sim/economy.js:39` | `growUsers`: user-growth rate multiplied by `months / 3` (era 1's 3-month turn is the baseline) |
| `sim/economy.js:75` | `applyEconomy`: `state.cash += (revenue - burn) * era.monthsPerTurn` — cash flow is a monthly rate multiplied by the turn's month count |
| `sim/contracts.js:154` | `contractsTurn`: CoreFlame trouble roll uses `perTurn(FRAGILE_MONTHLY, months)` — compounds a *monthly* failure chance over the turn's months (see below) |
| `sim/contracts.js:166` | `expireContracts`: `c.monthsLeft -= months` — term contracts (Verde 24mo, Azuria 24mo, CoreFlame 12mo, Gulf 36mo) count down by the era's months-per-turn each turn |
| `sim/contracts.js:188` | `creditOffset`: Azuria-equity credits are spent at a monthly rate × `months` |
| `sim/contracts.js:194` | `spendCredits`: same, to actually decrement `state.compute.credits` |
| `sim/split.js:72` | `applySplitEffects`: alignment-debt reduction from the safety compute share is `SAFETY_DEBT_RATE * (months / 3)` |

**`perTurn(monthly, months) = 1 - (1 - monthly) ** months`** (`sim/contracts.js:17`) is the one
place a per-turn *probability* is correctly compounded from a monthly rate over however many
months the current era's turn covers — so CoreFlame's failure chance is already story-time-correct
across eras. **Most other per-turn probabilities are not treated this way** — they are flat
per-`endTurn`-call chances regardless of how many months (3, 1, or 0.25) that call represents:
`rivalsTurn`'s progress increment (`sim/rivals.js:34`, `r.speed * 0.35 * (1 + rng.next()*0.3)`,
added once per call to `endTurn` with no `months` factor), `BUMP_CHANCE` (spot pull warning,
`sim/data/compute.js:10`, keyed by era but not by month-count), `poached` (15%/turn,
`sim/data/events.js:462`), `weightTheft` (20%/turn, `:487`), `exportFlip` (15%/turn,
`sim/data/events6c.js:301`), `priceWar` (12%/turn, `:329`), `viralDemo` (15%/turn, `:428`),
`internalTick`'s escalation roll (`sim/internal.js:61`, `rng.chance(internalRisk(state))` once per
call). **This is the crux of the "uneven clock speed" problem the owner flagged**: these systems
were tuned assuming a turn is a turn, roughly 4 turns per era regardless of length; under a
real clock, if the pace shown to the player is meant to track "a turn is a quarter/month/week,"
then the rate of rival releases, weight-theft rolls, price wars etc. **per real minute** would
speed up sharply in era 5 (each `endTurn` boundary — and therefore each roll — arrives 12× more
often per story-month than in era 1), even though nothing in the sim itself changed. See
Classification §7(C) and the Biggest design question §8.

Systems that scale by `monthsPerTurn` (money, training, compute, alignment): the discretionary
budget (`turn.js:79`), cash flow (`economy.js:75`), user growth (`economy.js:39`), contract terms
and credits (`contracts.js:154/166/188/194`), safety-compute alignment-debt reduction
(`split.js:72`). Systems that count raw turns instead (rivals, hazards, most events, training
duration, release cadence, promises, legal cases, sites, contracts' *arrival* delay as opposed to
their *term*): see the exhaustive per-file list in §3.

---

## 3. `sim/`: every turn-count assumption, file by file

Every file in `sim/` was read in full (see Coverage statement). Below: every duration, deadline,
"every K turns," or `state.turn`/`turnInEra` comparison, with file:line.

**`sim/turn.js`** — `MAX_MOVES = 2` (34); turn-0-only constitution gate (104, 115); era-5
turn-in-era-0 gate for the summit-skip penalty (189, 290) and for hold-or-ship (189: `turnInEra >
0`); `state.turn += 1; turnInEra += 1; monthsElapsed += ...` (300-302); era gate every
`turnInEra >= era.turns` i.e. every 4th call (303); `state.flags.conversionDeadline` compared to
raw `state.turn` (271, set in `economy.js` — see below).

**`sim/data/eras.js`** — the `turns: 4` field for every era (2-6) is the era-gate cadence; see §2.

**`sim/state.js`** — initial `turn: 0, turnInEra: 0, monthsElapsed: 0` (8, 10, 11); the starter
compute contract's `monthsLeft: 24` (22, a term counted in months, decremented by
`monthsPerTurn` each turn) and `arrivedTurn: 0` (23).

**`sim/rng.js`, `sim/util.js`, `sim/balance.js`, `sim/board.js`** — no turn-count assumptions of
their own; `sim/board.js`'s `updateBoard` runs once per `endTurn` call and compares to a
start-of-turn snapshot (`turn.js:101`, `:285`), so its cadence is "once per turn," not any
particular story-time interval.

**`sim/rivals.js`** — `rivalsTurn(state, rng)` (31-47) adds a flat per-turn progress increment
(34, no `monthsPerTurn` factor) and grants a capability jump `× (1 + 0.1 * state.era)` (38) when a
rival's progress bar fills — i.e. **rival release cadence is calibrated in turns, not months**;
under uneven real-time turn lengths this makes rivals release noticeably faster (per real minute)
in era 5 than era 1.

**`sim/training.js`** — `startRun` sets `activeRun.turnsLeft = cost.turns` (23), where
`cost.turns` (from `recipe.js`, see below) is **1 to 3 raw turns regardless of era** — a training
run that took one turn (one quarter, era 1) takes the same one turn (one week, era 5) later in the
game. `advanceRun` decrements `turnsLeft -= 1` (32) once per `endTurn` call; a run only *pauses*
(no progress) if that turn's serving load starves it of compute (30), it never partially completes
within a turn. `MIN_RELEASE_GAP_TURNS` lives in `release.js` (below) but gates training's sibling
system.

**`sim/release.js`** — `MIN_RELEASE_GAP_TURNS = 2` (13): a summit `releaseDelay` binding refuses a
second release less than 2 raw turns after the last (58-60) — 2 quarters in era 1, 2 weeks in era
5. `activateReleases` gates on `model.activeFromTurn > state.turn` (29) — a release can carry a
"turns to go live" delay from post-training cards (up to `cards.reduce(...cost.turns)`, `cost.turns`
from `sim/data/cards.js`). `model.activeFromTurn = state.turn + delay` (111) and
`model.releasedTurn = state.turn` (112) are both raw-turn stamps used later by `historyRows`
(era-of-release lookup, `ui/logic/history.js:40-47`) and by President-promise checks
(`releasesSince`, `sim/data/promises.js:5-10`, `model.releasedTurn >= promise.madeTurn`).

**`sim/hazards.js`** — no direct turn counting; `resolveHazard`'s `'fix'` choice adds
`releaseDelay += 1` (26), a one-*turn* release delay independent of era length.

**`sim/contracts.js`** — arrival delays (`arrivesIn`, `s.arrival`/`s.arrival[era]` in
`sim/data/compute.js:22-29`) are raw turn counts, e.g. Verde 3 turns in eras 1-2, 2 in era 4;
Azuria/CoreFlame/Gulf/loi 1-2 turns; `arrivesTurn = state.turn + offer.arrivesIn` (99);
`deliverDue` compares `p.arrivesTurn <= state.turn` (raw, 21/124); **contract *terms* are counted
in months** (`monthsLeft`, decremented by `monthsPerTurn` — see §2) but **contract *arrival
delays* are counted in raw turns** — the same asymmetry as training and release: a Verde order
placed in era 1 arrives in 3 turns (9 story-months); the identical order type placed in era 4
arrives in 2 turns (2 story-months) purely because `eras.js`'s turn-to-month ratio changed, not
because the delay itself was redefined in months. `BUMP_CHANCE` keyed per era but applied flat per
turn (BUMP_CHANCE[state.era], contracts.js:156). Scale-down's re-offer delay is `delays[supplier] =
1` (raw turn, 215). `contractAction`'s `break`/`buyout` costs read `c.monthsLeft` (a *months*
figure) but are themselves one-off, turn-boundary-only actions (217-225).

**`sim/queue.js`** — era-3-only gate (`state.era !== 3`, 51, 77); "one queue order per turn" (55);
a filled queue order's pipeline delivery is `arrivesTurn: state.turn + 1` (90, always exactly one
raw turn, i.e. between 3 story-months (never true, queue is era-3-only, so always 1 story-month)
later); `QUEUE_TERM_MONTHS = 24` (8) is a contract-term month count, handled like any other
contract term once it becomes a real contract (queue.js:90 passes it straight to `addPipeline`).

**`sim/power.js`** — `eraStartTurn(era)` (12, `ERAS.slice(0, era-1).reduce(sum, e.turns)`) —
raw-turn arithmetic across eras, used only by `reserveGrid`; `reserveGrid`'s arrival is
`eraStartTurn(4) + (era===2 ? 0 : 2) + rng.int(0,1)` or, on a 25% roll in era 3,
`eraStartTurn(5) + rng.int(0,1)` (27-28) — **entirely turn-indexed**, not months-indexed: a grid
reservation made in era 2 always arrives at "the start of era 4," a fixed turn number, regardless
of how many story-months separate era 2 from era 4. `buildSite`'s gas/nuclear construction time is
`t.turns` (4 raw turns each, `sim/data/cards... ` — actually `SITE_TYPES.gas.turns = 4`,
`SITE_TYPES.nuclear.turns = 4`, `sim/power.js:6-7`) plus a possible 1-2 turn slip (37-38); era 4's
`monthsPerTurn = 1`, so 4 turns = 4 months, but this is turns-first arithmetic, not a stated
"4 months" that happens to divide evenly. `powerTurn` brings a site online exactly when
`s.arrivesTurn <= state.turn` (46).

**`sim/economy.js`** — `legalTick`: `c.dueTurn <= state.turn` (87-90), where every `legalCases`
entry across the codebase is created as `state.turn + <N turns>` (e.g. `training.js` cards via
`sim/data/cards.js`'s `legal.delay` of 8 turns; event rows' lawsuits at +6 or +8 turns —
`sim/data/events.js:171,198,261`, `sim/data/events6c.js:176,383`) — **legal deadlines are
always raw turns**, so a lawsuit filed in era 1 (quarter turns) comes due many story-years later
than the identical lawsuit filed in era 5 (week turns). `useEmergency`'s `structureChange` option
sets `state.flags.conversionDeadline = state.turn + 8` (150) — checked in `turn.js:271` against
raw `state.turn`. `runway(state, which)` (79-83) itself has no turn dependence (a burn-rate ratio),
but its *display* (`ui/logic/format.js:months`) turns a $-per-month figure into "about N months" —
already story-time-native, no change needed.

**`sim/board.js`** — no turn counting beyond "once per `endTurn` call" (already covered).

**`sim/endings.js`** — `eraGate` and `checkTurnEndings` run once per `endTurn` call (turn.js:286,
304); no independent turn arithmetic of their own beyond what `turn.js` already gates on.

**`sim/advisors.js`** — `recordAdvisors` pushes one `{ turn: state.turn, readings }` entry per
call (49) and `lineFor` picks an advisor's specific line by `turn % lines.length` (advisors.js:15)
— **a cosmetic turn-count read**: which of 3 pre-written lines is shown cycles by raw turn number,
so under real time this would cycle by however many ticks have occurred, not by elapsed story time
— harmless, but worth flagging since it is turn-indexed, not state-indexed.

**`sim/president.js`** — `MEETINGS` (in `sim/data/president.js`) are scheduled by
`{ era, turnInEra }` pairs: first meeting `era: 2, turnInEra: 2`; second `era: 5, turnInEra: 1`
(`sim/data/president.js:4-5, 44-45`). `meetingDue` (43-48) matches on exact
`era === state.era && turnInEra === state.turnInEra`. **This is the single most turn-boundary-rigid
scheduling rule in the sim**: it fires on one specific `endTurn` call only (there is no "due within
this window" fallback), so a real-time clock that skips or double-fires a tick relative to the
sim's expectation would silently miss the President meeting entirely. `openMeeting`'s "second"
meeting sets grudge-based `patience` from first-meeting promise history (51-64), itself
turn-indexed via `dueTurn`.

**`sim/promises.js`** — `LAST_TURN = ERAS.reduce(sum, e.turns) - 1` = 19 (5); a promise's
`dueTurn = min(turn + dueOffset, LAST_TURN)` where `dueOffset` is 4 turns (first meeting) or 2
turns (second meeting) (27-38); `isEndgamePromise` = `promise.dueTurn >= LAST_TURN` (14) — a
special case skipped by the normal due-check so it isn't judged before the run ends;
`promiseUpkeep` checks `promise.dueTurn > state.turn` (46) and `<= state.turn` (70) each call;
`resolvePromiseCall`'s `stall` choice adds 2 more raw turns to `dueTurn` (127).

**`sim/constitution.js`** — no turn counting itself; amendments are stamped `{ turn: state.turn,
change }` (114) for history/promise-check purposes only (read by `sim/data/promises.js`'s
`amendmentsSince`).

**`sim/summit.js`** — `proposalError`: the summit can only be proposed when
`state.era !== 5 || state.turnInEra !== 0` is false, i.e. **exactly era 5, turn-in-era 0, once**
(73-74, `state.deal` already set is the "once" guard). `holdOrShip` runs every era-5 turn after
that (`turn.js:189`, `turnInEra > 0`).

**`sim/split.js`** — `PLEDGES` era-gated (`makePledge`: `state.era > 2` refused, 91) but not
turn-indexed within eras 1-2; `applySplitEffects`'s alignment-debt-reduction rate is months-scaled
(§2) — one of the few systems that is already story-time-correct.

**`sim/hazards.js` / `sim/internal.js`** — `internalTick`'s escalation (`it.stage`) advances at
most one stage per `endTurn` call, each on an independent `rng.chance(internalRisk(state))` roll
(61) with **no months factor** — same asymmetry as rivals/events (§2); `it.stageTurn = state.turn`
(66, 74) stamps *which* turn an escalation happened, read by `sim/data/events.js`'s
`oversightTamper`/`selfExfiltration` triggers (`state.internal.stageTurn === state.turn`,
`sim/data/events.js:727, 753`) — **these two cards fire only on the exact turn the stage rose**,
another rigid single-call trigger like the President meeting.

**`sim/events.js` / `sim/data/events.js` / `sim/data/events6c.js`** — the whole
warning-then-card mechanic is turn-indexed: a warning fires on turn N (`state.warnings[id] =
{turn: state.turn}`, `sim/events.js:80,732`); it can only become a card once `warned.turn <
state.turn` (74, i.e. **strictly the next call to `endTurn` or later**, never the same call) — so
the minimum "warning to card" latency is exactly one `endTurn` call, whatever story-time that
call represents (a quarter in era 1, a week in era 5). A `deferred: true` warning (two-card cap
already full) re-checks its trigger each subsequent call (76-77) rather than firing immediately
when a slot frees up mid-turn. Every one-shot event fires **at most once per game**
(`state.seenEvents`, checked by raw membership, no turn window) except the four rows marked
`repeatable: true` (`neocloudTrouble`, `lossSpike`, `capabilityJump`, `boardRevolt`), which can
recur on any later call once their trigger is true again — **there is no cooldown period in turns
or months for a repeatable row**, only "not currently pending."

**`sim/data/finale.js` / `sim/finale.js`** — no turn counting; the finale is a fixed
post-game card sequence (spec: "60-90 second finale"), entirely outside `endTurn`.

**`sim/data/compute.js` / `sim/data/cards.js` / `sim/data/launch.js` / `sim/data/president.js` /
`sim/data/promises.js` / `sim/data/constitution.js` / `sim/data/advisorLines.js`** — data tables
only; turn-relevant fields already covered above (`SUPPLIERS[...].arrival`/`termMonths`,
`CARDS[...].cost.turns`, `MEETINGS[...].era/turnInEra`, `PROMISES` check functions).

---

## 4. `ui/`: every place the UI shows or depends on turns

Every file in `ui/` was read in full (see Coverage statement).

- **`ui/hud.js:35`** — `"Era {state.era} · Turn {state.turn} of 20"` in the info-box header. This
  is the one place the UI literally prints a turn count out of 20; under real time this line would
  need to become a date/clock display (matching the K2 mockup's `Y2 M1 W2` format — see §6) or
  disappear.
- **`ui/menu.js`** — imports `MAX_MOVES` (line 1); every unavailability check for a strategic
  action reads `game.movesLeft() === 0` ("Both moves are used this turn", lines 95, 172-174, and
  the identical message reused across `ui/screens/company.js`, `ui/screens/compute.js`,
  `ui/screens/sites.js`); the moves-used counter footer, `"${used} of ${MAX_MOVES} moves used"`
  (287-290); the "End turn" menu item itself (`ITEMS`, line 19) which calls `game.endTurn()`
  directly and closes the menu first (275-277) — **this is the single explicit, player-initiated
  "commit this turn now" control** that a real-time clock would remove or repurpose (the clock
  would call `game.endTurn()` automatically on its own schedule instead).
- **`ui/main.js:124`** — the `#summary` debug route also calls `game.endTurn()` directly after
  queuing one deal move, for screenshot/test purposes only.
- **`ui/game.js`** — `createGame`'s `endTurn()` method (54-65) is the *only* caller of the sim's
  `endTurn`; it clones the returned state, resets the action queue (keeping `budget`,
  `initialQueue`, lines 5-13), and notifies subscribers. `movesLeft()` (70-72) and `addMove`'s
  `MAX_MOVES` guard (39) are the two places `MAX_MOVES` is enforced client-side before the sim
  even sees the queued moves (a UX nicety, not a security boundary — the sim re-checks at
  `turn.js:117`).
- **`ui/logic/format.js:project(state)` (47-59)** — the HUD's project pill status text
  ("training run · pretraining/midtraining/post-training") is computed from
  `run.turnsLeft`/`recipeCost(...).turns` as a fraction 0-1 (56-57), i.e. **training progress is
  already expressed as a turn-count ratio, not an absolute duration** — this fraction is what a
  real-time progress bar would need to be re-derived from (or the sim would need to expose
  sub-turn progress; see §7(C)).
- **`ui/logic/scenarios.js`** — every named debug scenario (`start`, `midEra3`, `release`, `event`,
  `summit`, `ending`, `danger`, `era2Deals`, `era3Queue`, `era3Budget`, `era4Power`) is built by
  looping raw `endTurn` calls up to a turn cap (`throughTurn(seed, targetTurn, stopWhen)`, 93-100;
  most default to `targetTurn: 20`) or until a `stopWhen(state)` predicate matches a
  turn/era/turnInEra condition (e.g. `midEra3`: `s.era === 3 && s.activeRun !== null`, 105;
  `summit`: `s.era === 5 && s.turnInEra === 0 && !s.deal`, 185). These are pure test/screenshot
  fixtures, but they hard-code the "loop `endTurn` up to N times" mental model throughout.
- **`ui/logic/eraIntro.js`** — `PACE` (a `Map` keyed by `monthsPerTurn` value: 3 → "Each turn is
  now a quarter," 1 → "a month," 0.25 → "a week," lines 3-7) and per-era `bottleneck`/`gate` copy
  (9-59) are shown once per era transition (the `eraStart` event, `turn.js:313`); this is exactly
  the player-facing sentence that states the turn-length-changes-by-era design and would need to
  become "the clock now runs at 1 real second per story-week" style copy, or be dropped, under a
  real clock.
- **`ui/logic/history.js:eraForTurn(turn)` (40-47)** — walks `ERAS`, accumulating `era.turns`,
  to find which era a given `releasedTurn` falls in; used only for display ("released in the
  gigawatt-race era"). **Would keep working unchanged** as long as `releasedTurn` stays a turn
  number under the new design (Classification A).
- **`ui/logic/history.js:raceChart`/`layoutRaceCards`** (`ui/screens/history.js:144-250`) — the
  whole "race so far" chart's x-axis is `turn` (0 to `totalTurns = 20`), with era bands drawn from
  `ERAS[i].turns`, and a "Now · turn N" vertical marker (`ui/screens/history.js:191-192`). This
  screen is purely retrospective (drawn from `state.models[].releasedTurn` and
  `game.rivalReleases`, an array of `{ turn, id }` recorded as turns end, `ui/game.js:20,60`), so
  it needs no sim change, only a possible axis relabeling if turns stop being the player-visible
  unit (Classification B).
- **`ui/screens/recipe.js`** — every card's cost line includes `"+N turn(s)"` when the card adds
  training/release delay (`cardCostWords`, `ui/logic/actions.js:167-179`, read by
  `ui/screens/recipe.js:124-126`'s `costText`); the compute-usage footer text
  ("Takes N turn(s)", `ui/screens/recipe.js:289-291`) is the direct player-facing translation of
  `recipeCost(...).turns`.
- **`ui/screens/compute.js`** — deal-card rows show `"Arrives: now / next turn / in N turns"`
  (`arrival(turns)`, `ui/logic/compute.js:62-66`) and contract rows show `"N months left"` or
  `"renews each turn"` (`commitmentRow`, `ui/logic/compute.js:260-263`) — **arrival delay is
  turn-phrased, contract term is month-phrased, in the same screen**, mirroring the sim's own
  asymmetry (§3). The queue screen literally names "turn" in its allocation copy
  ("prepaid orders are served first," `ui/screens/compute.js:365`) and shows "Your order" against
  a per-turn released supply (`released(state)`, era-3 only).
- **`ui/screens/sites.js`** — site construction progress bars are `1 - turnsLeft/duration`
  (`sitesView`, `ui/logic/compute.js:519-527`) and status text is `"Building · N turn(s) left"` /
  `"Online since turn N"` (526) — the same "turn-count ratio as a progress bar" pattern as
  training.
- **`ui/screens/budget.js` / `ui/screens/company.js`** — every "uses 1 of 2 moves this turn"
  footer (budget.js has none, since budget is free; company.js:222,320,405) is the same
  `MAX_MOVES`-derived copy already covered under `ui/menu.js`.
- **`ui/office.js`, `ui/components/*`** — no turn-count dependence at all; moods/markers are
  driven by `state.lastBriefing` (rebuilt every `endTurn`, but read as current-state, not
  turn-indexed) and era-driven asset swaps (`state.era`, not `state.turn`) — **era-intro screens
  and office-swap animations key off `state.era` changing, which still happens exactly once every
  4 `endTurn` calls under the unchanged engine, so they are unaffected** (Classification A).

No "animation between turns" beyond the office SVG cross-fade on era change
(`ui/office.js:97-106`, ~420ms, already real-time/wall-clock based, not turn-based) and the planned
(not yet built per plan 2B Task 5) training-run bubble animation, which plan text describes as "6s
per turn" (`plan2b-ui.md:270`) — i.e. **already designed as a fixed real-time animation played once
per `endTurn` call**, which is exactly the "clock pauses, tick happens, then a short animation
plays" model the proposed real-time redesign would need.

---

## 5. Tests that hard-code turn numbers or move counts

Not analyzed individually beyond what turned up in a grep for `turnInEra =`, `s.turn =`,
`state.turn =`, `era = N`, `dueTurn`, and `turn: N` (task asked only to note these, not analyze
each). Files that would need attention if the UI or sim changed its time model:

- **`tests/turn.test.js`** — builds states with `s.turn = 8` (line 90), `s.turnInEra = 2/3` (290,
  371), asserts `state.era === 2` and `state.monthsElapsed === 12` after exactly 4 scripted turns
  (line 356-364 area, "later eras use their accelerated turn lengths"), and a full-run harness that
  loops `endTurn` up to 30 times and asserts `a.turn <= 20` (384-391).
- **`tests/ui-game.test.js`** — asserts `g.movesLeft() === 2` before and after a turn, and
  `g.state.turn === 1` after one `endTurn()` call (read in full: lines 6-19).
- **`tests/constitution.test.js`, `tests/events.test.js`, `tests/events6c.test.js`,
  `tests/promises.test.js`, `tests/compute-events.test.js`** — all set `s.era = N` and/or
  `s.turn = N` / `s.turnInEra = N` directly to reach a trigger condition (era-gated or
  turn-in-era-gated events, President meetings, promise due-dates); `tests/promises.test.js`
  additionally asserts exact `dueTurn` values (`madeTurn: 7, dueTurn: 11`, lines 51-52, 64).
- **`tests/ui-history.test.js`, `tests/ui-collection.test.js`, `tests/ui-summary.test.js`** — build
  fixture objects with literal `turn: N` fields (rival-release logs, ending-collection metadata,
  run summaries) purely as display data, not gating logic; these would only need updating if the
  *shape* of a turn stamp changed, not if turns kept existing internally.

None of these would break under the proposed "clock over unchanged engine" design as long as
`endTurn` itself is untouched — they exercise the sim directly, not the clock.

---

## 6. Spec and plans: every requirement that assumes turns

### Spec (`docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`, read in full, 444 lines)

- §2 "Time structure (approved: hybrid)" (lines 25-32, quoted in full since it is the design this
  audit is about): "Decisions happen in **turns**. Each era has 4 turns; 20 turns total, about 1
  minute each. Training runs play as a short **animated real-time stretch** (about 30-40 seconds)
  ... **The pace accelerates:** a turn is a quarter in eras 1-2, a month in eras 3-4, and a week in
  era 5." — this is the exact design the real-time proposal would replace or reinterpret.
- §3's era table (35-41) repeats the "Turn length" column (quarter/quarter/month/month/week).
- §4's state sketch shows `turn: 0, era: 1, monthsPerTurn: 3` and `legalCases: [{cost, dueTurn,
  source}]` (57-58, 80) — turn-indexed from the state-shape level.
- §5's endings table: "Removed by the board: at a scheduled vote (era gates 2-4, or after a major
  crisis)" (112) — "scheduled" = turn-indexed.
- §6b: "talent spend can add one slot" and every recipe stage's option cards carry "extra turns" as
  a cost dimension (198-199, 220-226).
- §6c: "Delivery: warning, then card... Ignoring it turns it into a full event card **the next
  turn**" (247-249) — the exact one-`endTurn`-call latency implemented in `sim/events.js` (§3).
- §6d: "Each turn it runs internally, roll with the release formula..." (298-299) — internal
  deployment's per-turn roll cadence.
- §6e: summit timing — "The summit opens era 5 as a scheduled event" (309); "Each remaining turn
  the player holds... or ships" (330-331).
- §7 "One turn, screen by screen" (378-396) — the seven-step screen sequence (briefing, budget,
  moves, events, training run, launch, end of turn) *is* the spec's model of what happens inside
  one discrete turn; a real-time redesign either keeps this as the content of each automatic tick,
  or has to renegotiate which steps are always-on real-time panels versus tick-triggered dialogs.
- §9 "Testing and balance": "A balance bot plays scripted strategies... most first runs die in
  era 3-4" (429-431) — the balance tooling (`tools/balance.js`, not read in this session — see
  Coverage) is turn-count-based end to end (`report(n)` runs `n` full 20-turn games); untouched by
  a UI-only clock, since it calls the sim directly.

### Plans (each read as noted in the Coverage statement)

- **Plan 2B ("the playable game (UI)"), Global Constraints** (quoted in full, `plan2b-ui.md:11-21`):
  > - Visual reference, binding: `docs/design/mockups/K2-gdt-polished.html`...
  > - Palette tokens (verbatim, on `:root` in `ui/styles.css`)...
  > - The main screen shows only the office and the tiny HUD; decisions open on demand. Never put
  >   an always-visible dashboard back on screen (owner ruling, `~/.claude/skills/design/TASTE.md`
  >   per-surface note).
  > - No information by colour alone...
  > - Hidden variables are never shown as numbers during play; only the end-of-run reveal shows
  >   truths.
  > - Fit-to-window: the stage is designed at 1440 × 900 and scales down to any window...
  > - `prefers-reduced-motion: reduce` shortens every animation to at most 150 ms...
  > - **The sim is imported, never modified, by this plan; sim changes belong to plan 2A.**
  > - One commit per task, staged by explicit path, trailer...
  
  The bolded line is the constraint the real-time proposal explicitly wants to preserve. It is a
  **plan-level convention**, not a technical barrier — nothing stops a future plan from touching
  `sim/`, but it tells us the codebase's own division of labor already treats "UI reads/writes the
  sim's existing action shape" as the normal, low-friction path, which is exactly what "clock over
  unchanged turn engine" reuses.

- **Plan 2B, Task 3** (quoted in full, `plan2b-ui.md:210-246`) is the task that built
  `ui/menu.js`, the dialog shell, `ui/components/vslider.js`, and the budget screen. Its
  **Interfaces** bullet spells out the exact "moves greyed when `movesLeft() === 0`" behavior this
  audit found in the shipped code (§4), and its test file asserts `budgetFromSliders(...)` scales
  spend by era — i.e. Task 3 is where the `MAX_MOVES`/budget UI conventions originate that a
  real-time clock would inherit unchanged (Classification A) or have to renegotiate
  (Classification C), depending on whether "2 moves" survives as a per-tick cap.

- **Plan 2A** (mechanics) established `MAX_MOVES`, the event engine's warning-then-card one-call
  latency, the President-meeting exact-`turnInEra` scheduling, and the summit's exact
  `era===5 && turnInEra===0` gate — all covered with file:line in §3 against the *current* code,
  which matches the plan's originally specified behavior (the plan's own code listings for
  `sim/turn.js`, `sim/events.js`, `sim/president.js`, `sim/summit.js` are near-identical to what
  shipped, modulo the compute-system rewrite in plan 2C).

- **Plan 2C** (compute) — its Task 4 ("Wire contracts, queue, power and the era scale into the
  turn") and Task 6 ("Compute events") are where the era-scaled `eraScale(era)` multiplier and the
  `pooling` card's exact "last era-4 turn" trigger (`turnInEra === ERAS[3].turns - 1`,
  `plan2c-compute.md:1443`) were specified; its Review record documents four rounds of Codex
  adversarial review finding and fixing exactly this class of bug (contracts, queue fills and sites
  arriving "a turn late" relative to when the player could use them, `plan2c-compute.md:1774`) —
  i.e. **turn-boundary-exactness was already a repeated source of real bugs** in this codebase,
  which is a signal that a real-time redesign touching when things become "live" needs the same
  care.

- **Plan 2E** (President, promises) fixes `dueTurn = turn + 4` (first meeting) / `turn + 2`
  (second meeting) and the exact `MEETINGS` `era`/`turnInEra` scheduling (`plan2e-...md:44-45,
  102, 124-126`) — already covered in §3 against shipped code.

- **Plan 2F** (finale) is turn-agnostic by design (a post-game card rush, "sim-only, pure
  functions with no rng and no state mutation," `plan2f-finale.md:15-17`) — no turn assumptions to
  migrate.

- **Plan 2G** (missing spec-6c events) is the plan that most explicitly reasons about turn-boundary
  correctness as a design constraint, not just an implementation detail: its own text distinguishes
  the spec's presentation-order ("Events" is step 4 of 7) from the sim's actual call order (unresolved
  cards are consumed at the *top* of `endTurn`, new ones generated at the *bottom* — see the
  `our_plans_and_sim.md` research note quoted in §7 below, point 2 of its "Open questions"), which
  is precisely the kind of "screen sequence vs. call order" distinction a real-time redesign must
  also get right when deciding when, in wall-clock time, `pendingEvents` actually becomes visible.

- **`docs/superpowers/plans/2026-09-25-sim-core.md`** (the original foundational plan, superseded
  in code by 2A/2C/2E/2F/2G) — its Task 2 (`sim-core.md:190-427`) and Task 11
  (`sim-core.md:1972-2199`) show the turn engine's shape *before* any of the later mechanics: the
  original `endTurn` already had `MAX_MOVES = 2` (2083), `state.turn/turnInEra/monthsElapsed`
  (361-364, 2167-2169), and the era gate at `turnInEra >= era.turns` (2170) — i.e. **the
  turn/era/months-per-turn design is foundational, present since the very first sim skeleton, not
  a later addition** that could be more easily peeled back. ⚠️ Tasks 1, 3-10, 12 and the
  self-review notes of this 2395-line file were only grepped for `turn`/`era` mentions, not read in
  full — see Coverage statement.

---

## 7. The real-time mockup and the events research note (another branch)

**`docs/design/mockups/K2-events-crisis.html`** (branch `events-research`, fetched via `git show`
and read in full, 434 lines) is a design mockup for crisis event cards, but it also contains the
only concrete real-time clock mockup found anywhere in the repo tree (mockup-only, never wired to
a live game state):

- **The `#realtime` clock** (`.clock` CSS, lines 30-36; `clock()` JS, 177-185): a Game-Dev-Tycoon
  style `Y2 M1 W2` date readout with a small "Jan" sub-label, and three buttons — Pause, Play
  (rendered "on" by default), Fast (a double-chevron icon) — plus a `"Paused"` pill shown only when
  paused. The date format (`Year / Month / Week`) is calendar-native, not turn-indexed, matching
  the spec's story-time framing (quarters/months/weeks) rather than the sim's `turn`/`turnInEra`
  counters.
- **Pause-on-dialog behaviour is already the mockup's convention, not just a proposal**: every
  `crisis(kind, opts)` call (373-379) calls `clock({ paused: true })` before showing the crisis
  card, and the two non-crisis demo screens (`showRealtime`, `showBusy`, `showJoke`, 382-420) all
  call the *unpaused* `clock()` — i.e. the mockup already encodes "the clock pauses exactly when a
  crisis/dialog is on screen, and runs otherwise," matching the task's proposed design exactly.
- **Story-time deadline bars** (`.due` CSS, 38-43; `due(label, fraction, calm)`, 170-175): every
  crisis and the one "warning" mockup shows a countdown expressed in **story time, not turns**:
  "The leak goes public in about 2 weeks" (45% full, weight theft), "The copy finishes in 3 days"
  (82%, self-exfiltration), "The story runs in 9 days" (30%, whistleblower), "Their post is
  trending. Answer within a week" (60%, safety-quits-publicly), and, for the pre-crisis warning
  stage, "Becomes a crisis in about 3 weeks if nobody acts" (25%, `showRealtime`, 382-393) with a
  "Look into it ($NM)" / "Not now" button pair. **None of these numbers exist in the sim** — the
  sim's warning-to-card latency is exactly one `endTurn` call (§3), with no finer-grained deadline;
  the mockup's "2 weeks" / "3 days" / "9 days" / "1 week" are invented flavor-text durations for
  the mockup only, not read from any state field. This means: to make these countdown bars *real*
  (i.e. actually count down as the clock runs, rather than being a static illustration), either the
  UI has to interpolate a fake countdown between "warning raised" and "next `endTurn` call" (a
  UI-only fabrication, Classification B, since the true underlying event is still a same-turn
  coin-flip, not a real deadline), or the sim needs an actual sub-turn deadline field
  (Classification C, a real mechanic change).
- **"While you were busy" (`showBusy`, 396-411)**: a dismissible panel summarizing, in prose, what
  happened while the player didn't act — "The whistleblower story ran without your side of it...",
  "The flattery screenshots kept spreading...", "You refused the investors. The board is
  grumbling..." This is the mockup's answer to "what does the player see when several `endTurn`-worth
  of automatic ticks happen while they were away/idle" — i.e. it assumes **ticks can accumulate
  while the player is not actively looking**, which is consistent with "clock keeps running, pauses
  only on a dialog" but implies the UI needs to batch and summarize possibly-multiple turns' events
  into one narrative panel, not just show the latest turn's toast list (`turnSummary`,
  `ui/logic/compute.js:598-659`, currently built for exactly one turn's events at a time).

**`docs/research/event-cards/notes/our_plans_and_sim.md`** (branch `events-research`, fetched and
read in full, 686 lines) is a different researcher's prior note on the event-card system
specifically (not about real time), but two of its findings bear directly on this audit:

1. Its §1 confirms, independently of my own read of `sim/events.js`, that "a warning delays the
   card by (at least) one turn" and that this is a hard architectural choice ("MAX_CARDS = 2... a
   hard per-turn cap"), matching §3 above exactly.
2. Its §1 and Open-question #2 flag the same "spec's screen-sequence vs. the sim's actual call
   order" distinction cited in §6 above: cards a player answers on turn N were generated at the
   **end of turn N-1**, not "live" during turn N — a fact any real-time tick scheduler must respect
   (the cards shown when a tick pauses the clock are always "yesterday's" cards, from the sim's
   point of view, never freshly computed for "right now").

---

## 8. Classification: A (free) / B (UI-only) / C (needs a sim change), with size

**(A) Covered for free by "clock over unchanged turn engine":**

- The entire `endTurn` step order, `MAX_MOVES` enforcement, era gate, and all turn-indexed
  deadlines/schedules (President meetings, summit gate, promise due-turns, legal-case due-turns,
  contract terms/arrivals, event warning-then-card latency) — since the clock only decides *when*
  to call `endTurn(actions)`, not *what* it does. **Size: none** (zero sim work; this is the whole
  premise of the proposal).
- Budget-as-a-standing-setting (already applies at the next tick regardless of when it was last
  changed, `turn.js:130,237`) — no move-slot cost, so nothing to renegotiate.
- Era transitions, era-intro screens, office-swap animations (`ui/office.js`, `ui/logic/eraIntro.js`)
  — these already key off `state.era` changing, which still happens exactly every 4 ticks.
  **Size: none.**
- Retrospective displays that read a stored `turn` number purely for display (`historyRows`'
  `eraForTurn`, the race chart, `game.rivalReleases`, ending-collection metadata) — unaffected as
  long as `state.turn` keeps incrementing once per tick. **Size: none.**
- Balance tooling (`tools/balance.js`) — calls the sim directly, entirely bypassing the UI clock.
  **Size: none.**

**(B) Needs a UI-only change (no sim edit, but real design/build work):**

- Replacing `"Turn N of 20"` (`ui/hud.js:35`) with a date/clock readout — a straightforward text
  swap once a story-date formatter exists (`ERAS[].monthsPerTurn` and `state.turn`/`turnInEra`
  already carry enough information to derive "year/month/week," as the `K2-events-crisis.html`
  mockup's placeholder `Y2 M1 W2` shows). **Size: small.**
- The pause/play/fast clock control itself, and pausing on every dialog/card open — the mockup
  already prototypes this exact behavior (§7); it is pure UI state (a `setInterval`-driven
  countdown that calls `game.endTurn()` on schedule, paused whenever `overlay.querySelector(
  '.dialog-layer')` is non-null, mirroring the existing `openMenu`/`openDialog` "one dialog at a
  time" convention already in `ui/menu.js:123` and `ui/components/dialog.js:104-105`). **Size:
  medium** (needs care around what happens if the player is mid-dialog exactly when a scheduled
  tick would fire, and whether multiple ticks can be "owed" and fired back-to-back or must be
  strictly serialized).
- Reframing "2 moves per turn" as "2 actions per tick window," including all the "uses 1 of 2 moves
  this turn" copy across `ui/menu.js`, `ui/screens/company.js`, `ui/screens/compute.js`,
  `ui/screens/sites.js` — a copy/framing change only, since the sim still enforces `MAX_MOVES`
  identically. **Size: small,** *if* the design accepts "moves reset every tick, whatever the tick
  length" as the new mental model (see the Biggest design question, §9, for why this may not be
  acceptable as-is).
- A "while you were busy" narrative summary panel for however many ticks elapsed since the player
  last looked (the mockup's `showBusy`, §7) — `turnSummary` (`ui/logic/compute.js:598-659`)
  currently formats exactly one turn's `events` array; extending it to concatenate N turns' worth
  of events into one panel is additive UI work, no sim change. **Size: medium.**
- Smoothing progress bars (training, site construction, project pill) so they visibly creep forward
  in real time between ticks rather than jumping once per tick — since the underlying `turnsLeft`
  fraction (`ui/logic/format.js:56-58`) only changes at a tick boundary, the smooth-looking motion
  between ticks would have to be a *visual estimate* (interpolate from last-known fraction toward
  a projected next-tick fraction over the tick's real-time duration), not real progress —
  achievable with the existing `projectQueue`-style "what if" projector (`ui/logic/compute.js:166-
  183`) already used elsewhere for previews. **Size: medium**, and it is honest to flag that this
  is cosmetic interpolation, not the sim exposing real sub-turn state.

**(C) Needs a sim change to feel right in real time:**

- **Actions only take effect at the tick boundary.** Starting a training run, signing a deal,
  amending the constitution, etc. mid-tick produces no visible change until the next scheduled
  `endTurn()` call (§1 step 7, §4's project-pill fraction). If the design wants "you click, you see
  something start happening right now" (the actual Game Dev Tycoon feel), the sim's move-application
  timing would need to change (moves apply immediately, ticks only resolve the passive/random
  systems), which is a materially different `endTurn` contract, not a UI wrapper. **Size: large**
  (touches the core `endTurn` step order in §1, and every move handler's assumption that "the
  turn's before-snapshot" is meaningful).
- **Per-turn probabilities are flat, not months-scaled, for most systems** (§2's table: rival
  progress, most world/training events, internal-deployment escalation). Under uneven real
  tick-lengths (a "turn" = a quarter in era 1 but a week in era 5), these systems' *effective rate
  per real minute* would swing by roughly 12× across the game purely from `monthsPerTurn` shrinking,
  even though nothing else changed. Fixing this to feel intentional (rather than a side effect)
  means re-deriving each flat per-turn chance as a properly months-scaled one (the way
  `perTurn(monthly, months)` already does for CoreFlame failures, `sim/contracts.js:17`), which is
  sim/balance work, not UI work. **Size: large** (touches `sim/rivals.js`, most of
  `sim/data/events.js`/`events6c.js`'s trigger functions, `sim/internal.js`, and would need a full
  re-run of `tools/balance.js` per plan 2A/2C/2G's own precedent for any tuning change).
- **Deadlines that should be human-legible durations are currently raw turn counts with no months
  conversion** (legal cases at "+6/+8 turns," summit's `MIN_RELEASE_GAP_TURNS`, President-promise
  due-offsets of "+4/+2 turns," the grid reservation's `eraStartTurn`-relative arrival). Under real
  time these durations become wildly different lengths depending on which era they were created in
  (a lawsuit filed in era 1 takes 6-8 quarters = 1.5-2 years to come due; the identical lawsuit
  filed in era 5 takes 6-8 weeks) — arguably *already* a slightly odd design under the discrete
  model, but invisible there because "turns" reads as an abstract unit; under a real clock with
  a visible date, this inconsistency becomes directly visible to the player and would need either
  a deliberate re-tuning to months, or an explicit design decision that these systems are meant to
  stay turn-indexed (i.e. "count of decisions," not "elapsed time") on purpose. **Size: medium to
  large** depending how many of these the owner decides need fixing versus leaving as intentional
  abstraction.
- **The President meeting and internal-incident triggers fire on an exact single call to
  `endTurn`** (`meetingDue`'s exact `era===X && turnInEra===Y` match; `oversightTamper`/
  `selfExfiltration`'s exact `stageTurn === state.turn` match). A clock that could, for any reason,
  skip calling `endTurn` for the tick that would have matched (a dropped/coalesced tick, a
  fast-forward that jumps multiple ticks at once) would silently miss these one-shot triggers
  forever, with no game-visible sign anything went wrong. This needs either a guarantee that the
  clock never skips a tick (a UI-only constraint, but a fragile one to maintain by convention
  alone) or the sim relaxing these exact-match triggers to "due by this turn" windows (a small but
  real sim change to `meetingDue` and the two internal-event triggers). **Size: small if fixed in
  the sim (`>=` instead of `===`), large if the fix has to be "the UI must never skip a tick,"
  since that constraint would need to be verified, not just assumed.**
- **Story-time countdown bars invented by the mockup have no backing state field** (§7): if the
  design wants the countdown-bar UX shown in `K2-events-crisis.html`'s `#realtime` route to be
  real (not merely illustrative), the sim needs an actual sub-turn deadline concept it does not
  currently have anywhere (every warning-to-card transition is exactly "next `endTurn` call," with
  no finer timer). **Size: large**, and arguably optional — the same information could be
  presented honestly as "next check: in about N seconds" (tied to the tick scheduler) rather than
  a fabricated story-time countdown, which would fall back to Classification A/B.

---

## 9. The single biggest design question

**What does "2 moves per turn" mean once "turn" is no longer a thing the player explicitly ends?**

Today, `MAX_MOVES = 2` (`sim/turn.js:34`) is a hard per-`endTurn`-call cap, and the player controls
exactly when that call happens by clicking "End turn" (`ui/menu.js:19,275-277`). The 2-move budget
is legible because the player decides the window it applies to: they queue up to two moves, look
at everything, then choose to end the turn. Under the proposed design, `endTurn()` instead fires on
an automatic schedule (a quarter/month/week of story time, i.e. a real-time interval that shrinks
by roughly 12× from era 1 to era 5, per §2). Two consequences follow directly from the code read in
this audit, not speculation:

1. **The tick length is not constant**, so "2 moves per tick" quietly becomes "2 moves per quarter"
   early in the game and "2 moves per week" by era 5 — the player's *effective* decision-making
   bandwidth (moves per real minute, if the real-seconds-per-tick is held roughly constant across
   eras to keep pacing sane) would need to either shrink 12× (harder to plan multi-move
   combinations as the game accelerates, which may be an intentional "the world is moving too fast
   to plan carefully" feeling — see spec §6e's framing of era 5 as "the calendar has given up") or
   the tick's *real* duration would need to shrink in lockstep with `monthsPerTurn` (in which case
   the player gets the *same* 2 moves per tick, but ticks arrive faster and faster in real time,
   which is the "uneven clock speed" problem the task named directly).
2. **Nothing in `sim/turn.js` distinguishes "moves queued because the player deliberately acted"
   from "moves queued because the clock happened to tick"** — the sim only ever sees `actions.moves`
   at the moment `endTurn` is called; it has no notion of "the player is still deciding, hold the
   tick." So the *entire* weight of "does this feel like Game Dev Tycoon" now sits on the UI's
   tick scheduler getting exactly right: when to pause (already solved, on any dialog — §7), how
   long a tick's real-world duration should be at each era (unsolved: constant real-seconds ⇒ uneven
   pace acceleration; constant real-seconds-per-story-month ⇒ faster and faster ticks; something
   else), and whether "2 moves" should even survive as a fixed number once its time window is no
   longer player-chosen.

This is the same question the task's own framing anticipated ("what replaces MAX_MOVES and the
per-turn budget"), and this audit's code-level answer is: **nothing in the sim needs to replace it
— `MAX_MOVES` still works exactly as written — but the UI's tick-length policy is the one
undecided parameter that determines whether the redesign feels like a faithful clock over the
existing game, or like a different game wearing the same numbers.** Every other turn-count
assumption catalogued in this audit (§3) is either free under the clock (schedules, deadlines,
terms) or a bounded, separately-fixable cosmetic/rate-tuning issue (§8); this one is structural and
touches the core action-economy feel the spec explicitly designed around ("Two action slots per
turn," spec §7 point 3).

---

## Coverage statement

**Read in full, this session** (every file the audit's key questions named, plus every file in
`sim/` and `ui/`):

- `sim/turn.js`, `sim/data/eras.js`, `sim/state.js`, `sim/queue.js`, `sim/training.js`,
  `sim/economy.js`, `sim/rivals.js`, `sim/hazards.js`, `sim/contracts.js`, `sim/power.js`,
  `sim/release.js`, `sim/events.js`, `sim/data/events.js`, `sim/data/events6c.js`,
  `sim/promises.js`, `sim/president.js`, `sim/summit.js`, `sim/constitution.js`, `sim/internal.js`,
  `sim/endings.js`, `sim/finale.js`, `sim/data/finale.js`, `sim/split.js`, `sim/board.js`,
  `sim/launch.js`, `sim/recipe.js`, `sim/techniques.js`, `sim/serving.js`, `sim/balance.js`,
  `sim/advisors.js`, `sim/rng.js`, `sim/util.js`, `sim/data/compute.js`, `sim/data/president.js`,
  `sim/data/promises.js`, `sim/data/constitution.js`, `sim/data/cards.js`, `sim/data/launch.js`,
  `sim/data/advisorLines.js` — every file in `sim/`, no exceptions.
- `ui/hud.js`, `ui/menu.js`, `ui/main.js`, `ui/game.js`, `ui/office.js`, `ui/logic/actions.js`,
  `ui/logic/collection.js`, `ui/logic/compute.js`, `ui/logic/eraIntro.js`, `ui/logic/format.js`,
  `ui/logic/history.js`, `ui/logic/scenarios.js`, `ui/logic/summary.js`, `ui/screens/budget.js`,
  `ui/screens/company.js`, `ui/screens/compute.js`, `ui/screens/history.js`,
  `ui/screens/recipe.js`, `ui/screens/sites.js`, `ui/components/dialog.js`,
  `ui/components/team.js`, `ui/components/vslider.js` — every file in `ui/`, no exceptions.
- `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` (444 lines).
- `docs/superpowers/plans/2026-09-25-plan2b-ui.md` (387 lines).
- `docs/superpowers/plans/2026-09-25-plan2e-president-promises.md` (212 lines).
- `docs/superpowers/plans/2026-09-25-plan2f-finale.md` (106 lines).
- `docs/superpowers/plans/2026-09-25-plan2g-events.md` (864 lines).
- `docs/superpowers/plans/2026-09-25-plan2a-mechanics.md` (1065 lines, read across two Read calls
  because the tool paginated it at line 730).
- `docs/design/mockups/K2-events-crisis.html` (fetched via `git -C
  /Users/ardaenfiyeci/Desktop/game-night-ai-lab show events-research:docs/design/mockups/K2-events-crisis.html`,
  saved to `/tmp/K2-events-crisis.html`, 433 lines).
- `docs/research/event-cards/notes/our_plans_and_sim.md` (fetched via `git -C
  /Users/ardaenfiyeci/Desktop/game-night-ai-lab show
  events-research:docs/research/event-cards/notes/our_plans_and_sim.md`, saved to
  `/tmp/our_plans_and_sim.md`, 686 lines). Note: this file's own Coverage statement (quoted
  indirectly in my §7) records what *that* researcher read partially in *their* session
  (`plan2c-compute.md`'s Tasks 1-5, two design mockups on the `side-feed` branch) — I did not
  re-verify those partial reads myself; I am citing that document's own findings, attributed to it,
  per the delegated-research rule, not re-deriving them from the underlying files myself.

**Read partially, flagged with ⚠️:**

- ⚠️ **`docs/superpowers/plans/2026-09-25-plan2c-compute.md`** (1,798 lines). Read: lines 1-734
  (Global Constraints, sequencing, file map, actions contract, Task 1 "Compute tables, era scale
  and power sites," most of Task 2 "Contracts"); lines 746-1173 (Task 3 "Era 3 allocation queue,"
  Task 4 "Wire contracts, queue, power and the era scale into the turn," through its Step 8); lines
  1174-1254 (Task 5's Interfaces and opening tests only); lines 1425-1798 (Task 6 "Compute events,"
  Task 8 "Balance with compute," Self-review notes, and the full Review record). **Not read:** the
  bulk of Task 5's implementation body (roughly lines 1254-1425: `sim/split.js`'s full test suite
  and implementation listing) and Task 7's implementation body (roughly lines 1573-1675: the four
  compute screens' detailed interface/markup listing, beyond its opening Interfaces line already
  quoted). Everything I cited from this file in §3/§6 comes only from the ranges I did read; I
  cross-checked the plan's Task-1/2/3/4/6 code listings against the *shipped* `sim/` code (which I
  did read in full) and found them materially matching (the plan text is the origin of the shipped
  behavior, not a separate spec that might disagree).
- ⚠️ **`docs/superpowers/plans/2026-09-25-sim-core.md`** (2,395 lines, the original foundational
  plan, superseded by 2A/2C/2E/2F/2G in the shipped code). Read in full: lines 1-66 (intro, Global
  Constraints, File structure) and lines 190-427 (Task 2: balance constants, eras, rivals, initial
  state) and lines 1972-2199 (Task 11: the original turn orchestrator). **Not read in full:** Task
  1 (scaffold/RNG), Task 3 (serving cost), Task 4 (techniques/recipe cards), Task 5 (training runs),
  Task 6 (releases/naming/launch), Task 7 (compute market — since superseded wholesale by plan 2C),
  Task 8 (economy), Task 9 (board/endings), Task 10 (advisors), Task 12 (balance bot), and the
  closing self-review notes — I instead grepped the whole file for `turn`/`era` occurrences
  (reported in §6's table) and read only the handful of matching lines directly relevant to
  duration/deadline claims (e.g. `sim/training.js`'s original `turnsLeft`/`legal.delay` listing,
  quoted at sim-core.md:938-976; the original `raiseRound`/`useEmergency` pipeline/deadline code at
  1562-1601). Every claim sourced from this file's un-read Tasks is a grep-located line, not a
  full-file read, and is marked as such inline in §6's bullet for this file.
- ⚠️ **`tools/balance.js`** — never opened this session. Referenced only via what the spec (§9) and
  the plans (2A Task 8, 2C Task 8, 2G Task 5) say it does (scripted strategies, `report(n)`,
  difficulty targets). Any claim about its exact contents would need a fresh read; I make none
  beyond "it exists, is turn-count-based end to end, and is unaffected by a UI-only clock since it
  calls `endTurn` directly" (an inference from the plans' text, not from reading the file).
- ⚠️ **Individual test files beyond what §5 quotes.** I grepped every file listed in §5 for a small
  set of turn-related patterns and read only the matching lines plus immediate context (and read
  `tests/ui-game.test.js` in full, 53 lines, since it was short and directly on-topic for
  `MAX_MOVES`/`movesLeft`). Per the task's own instruction ("only note, do not run a full analysis
  of each"), I did not read `tests/turn.test.js`, `tests/constitution.test.js`, `tests/events.test.js`,
  `tests/events6c.test.js`, `tests/promises.test.js`, `tests/compute-events.test.js`,
  `tests/ui-collection.test.js`, `tests/ui-compute.test.js`, `tests/ui-history.test.js`, or
  `tests/ui-summary.test.js` end to end.
- ⚠️ **The `~/.claude/skills/design/TASTE.md`/`LEARNINGS.md`/`DESIGN-LOG.md` files and the
  `K2-feed-lumen.html`/`K2-side-options.html` mockups** cited in §7 were **not read by me** — they
  are cited only as findings *attributed to* `our_plans_and_sim.md`'s own Coverage statement (that
  document's author read them, not me). I flag this explicitly per the delegated-research rule:
  these are secondhand, not independently verified in this session.

**Test baseline confirmed by running the suite once**, as the task permitted: `node --test
tests/*.test.js` (== `npm test`) → **496 tests, 494 pass, 0 fail, 2 todo, 0 skipped/cancelled**, run
from a clean worktree with no changes made. (The 2 `todo` entries are pre-existing markers in
`tests/balance.test.js`, unrelated to this audit — I did not investigate them further, per the
task's "only note" instruction for tests.)

**Nothing in this note was written from memory of these files from outside this session** — every
file:line citation was produced from a Read or Bash/grep call made during this research pass.
