# Game Night: AI Lab — events, warnings, advisors and event cards: what is already decided

Scope: local-documents research only, for plan 2B Task 8 ("Advisors, warnings and event cards").
Repository read: `/Users/ardaenfiyeci/worktrees/game-night-ai-lab-events`, branch `events-research`
(stated identical to branch `ui` at commit `282e130`). All paths below are relative to that repo
root unless a branch is named. All line numbers are from the files as read in this session.

---

## 1. Event delivery and presentation — what is decided

**The warning-then-card rule (owner pick).** Spec §6c states it directly:
"**Delivery: warning, then card (owner pick).** Incidents planted by the player's own choices
first appear as a small sign (a feed post, an advisor aside). Acting on the sign is cheap.
Ignoring it turns it into a full event card the next turn, with 2–3 costly choices." Rejected
alternatives, named in the same paragraph: "plain cards only (no chance to catch trouble early)"
and "multi-turn story chains (too much writing for 36 hours)." (`docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` §6c, lines 247–251)

**Card layout, per spec §6c** (lines 252–253): "Title, a feed-style post, 2–3 choices with visible
costs, each tagged with the advisors who back it. About 0–2 events per turn." The engine enforces
the "about 0–2" as a hard cap, not a soft average — see MAX_CARDS below.

**How the engine actually implements this** (`sim/events.js`, all of which I read in full,
150 lines):

- `MAX_CARDS = 2` (line 12) is a hard per-turn cap on `state.pendingEvents.length`.
- `eventsTick(state, rng)` (lines 63–103) walks `orderedEvents()` — `[...EVENTS, ...EVENTS_6C]`
  with `internal` then `training` kind rows checked first, everything else after (lines 13–22,
  15). For each event not already pending:
  - non-repeatable, non-internal events are skipped once their id is in `state.seenEvents`
    (line 71) — so a plain (non-repeatable) row fires **at most once per game**.
  - If the event has no open warning yet: its `trigger(state, rng)` is evaluated: on a hit, if
    the row defines a `warning`, the warning is recorded (`state.warnings[event.id] = { turn:
    state.turn }`), pushed to the feed with tag `'warning'`, and the tick **continues to the next
    event** (line 79–84) — i.e. a warning delays the card by (at least) one turn, exactly per
    spec §6c.
  - If the event already has an open warning from an earlier turn (`warned.turn < state.turn`),
    the warning is cleared and, for `kind: 'planted'` or `repeatable` rows, the trigger is
    re-checked before the card is built (line 74–76) — "a deferred repeatable row re-checks its
    trigger before it becomes a card" (plan 2G Task 1 test, `docs/superpowers/plans/2026-09-25-plan2g-events.md` lines 175–188).
  - Rows with **no** `warning` field skip straight to becoming a card the same tick they trigger
    (e.g. `pledgeDrop`, `agentSurge`, `pooling`, all training-kind rows, all of `events6c.js`'s
    world rows except none — none of the `events6c.js` rows carry a `warning` at all; only
    `whistleblower` and `safetyQuits` do, `sim/data/events6c.js` lines 155, 194).
- **The two-card cap and deferral.** If the event has cleared its trigger/warning stage but
  `state.pendingEvents.length >= MAX_CARDS` and the row does not set `bypassCardLimit`, the event
  is pushed back into `state.warnings[event.id] = { turn: state.turn, deferred: true }` (lines
  93–96) instead of becoming a card. A `deferred: true` warning has **no feed post** and
  `addressWarning` explicitly rejects it (`sim/events.js` line 108, `!warned || warned.deferred`
  guards the call). Plan 2A's contract (relayed in plan 2B, lines 27–29) states this plainly:
  "never render deferred entries as addressable warnings."
- **`pooling` bypasses the cap** (`bypassCardLimit: true`, `sim/data/events.js` line 694) — it is
  the one row exempted from MAX_CARDS, per plan 2C Task 6's interface note (line 1433).
- **Unanswered ("fallback") cards.** `endTurn` (`sim/turn.js` lines 182–188) resolves every
  still-pending card automatically at end of turn using `fallbackChoice(id, pending)`
  (`sim/events.js` lines 146–150): for a `kind: 'promise'` pending item this is
  `promiseFallback(pending)` (stall if offered, else refuse — `sim/promises.js` line 155); for
  everything else it is the row's own `fallback` field if set, else **its last card choice**
  (`event.card.choices.at(-1)?.id`). This is the "passive fallback" ruling plan 2A made and plan
  2G's Global Constraints restate: "an unanswered card resolves with its `fallback` choice, else
  its last choice… in this plan every row's passive choice is its last choice" (plan 2G lines
  39–41). Plan 2B's relayed plan-2A note (lines 28–29) gives concrete examples: "Unanswered cards
  resolve to a passive fallback, not the last choice (**jailbreak → deny, citations → blame,
  distill → deny**)" — these three rows set an explicit `fallback` field
  (`sim/data/events.js` lines 81, 118, 181) that differs from their last listed choice, so the
  "last choice" rule is the *default*, overridden per-row by an explicit `fallback`.
- **Cards resolved automatically emit an event** of `{ type: 'eventResolved', id, choiceId, auto:
  true }` (`sim/turn.js` line 187) for the UI's end-of-turn toast list.

**Number of choices.** Spec says "2–3"; the plan 2G Global Constraints widen this in the data
contract to "2–4 choices per card" (line 35) and a test enforces `n >= 2 && n <= 4` across
`EVENTS_6C` (`plan2g-events.md` lines 811–823). Counting the actual rows (below), most have 2 or 3
choices; none has 4 in the current catalogs.

**`addressWarnings`.** A warning is answered via `sim/events.js`'s exported `addressWarning(state,
id)` (lines 105–120): it costs a flat `5 × era` $M, is rejected for `kind: 'internal'`,
`kind: 'promise'`, a missing warning, or a `deferred` one; on success it clears the model flag the
row is keyed to (if any), runs the row's `addressEffects(state)` if defined, marks the id "seen",
and calls the row's `defuse?.(state)` if defined. In `sim/turn.js` this is driven by
`actions.addressWarnings` (an **array** of ids, line 162): `for (const id of actions.addressWarnings
?? []) addressWarning(state, id);`. Only `weightTheft`, `openletter`, and the seven `planted`
flag-events (`flattery`, `jailbreak`, `citations`, `contamination`, `distill`, `agentwreck`,
`companion`, `promise`) plus `whistleblower`, `safetyQuits`, and `neocloudTrouble` carry a
`warning` field at all — everything else either has `warning: null` (world/training/promise rows)
or is `kind: 'internal'` (never addressable).

**The per-turn flow, spec §7 "one turn, screen by screen"** (lines 378–396): step 4 is literally
"**Events.** Zero to two event cards with choices, drawn from risk pools fed by hidden variables
and from the era's deck." This sits after step 3 "Moves" and before step 5 "Training run" in the
spec's *presentation* order — but in the actual sim turn function (`sim/turn.js`), warnings/cards
answered via `actions.addressWarnings` / `actions.eventChoices` are consumed **near the top** of
`endTurn` (lines 162–188, before moves are applied at all), and **new** events for the *next* turn
are generated near the bottom via `eventsTick(state, rng)` (line 283, just before `normalize`,
`updateBoard`, `checkTurnEndings`). So mechanically: the events a player answers on turn *N* were
generated at the end of turn *N-1*; the spec's "step 4" ordering is about screen sequence within a
turn's UI, not the sim's internal call order. This distinction matters for building the events
screen: the cards to show at the start of a turn are `state.pendingEvents` as already present in
the state the UI receives after the *previous* `endTurn()` call, not something computed live
during the current turn's screens.

**Two separate "mini-event" pathways exist — do not conflate them.** Besides the
warnings/pendingEvents system above, there is a **training hazard** system that is architecturally
separate: `sim/hazards.js` (`resolveHazard`, read in full, 47 lines) and `state.pendingModel.hazard`
(`{ type: 'rewardHacking', size }`), resolved via `actions.hazardChoice` (`'penalize' | 'fix' |
'ignore'`) and reported via a `{ type: 'hazardResolved', choice, auto? }` event
(`sim/turn.js` lines 157–161, 221). This is spec §6d's "caught-cheating reasoning trace" mini-event
and plan 2B Task 5's dialog (not Task 8's), and it is **not** a row in `sim/data/events.js` or
`events6c.js` — it has its own dialog, separate from the event-card catalog described below. The
Task 8 events screen should not try to render it.

---

## 2. The full event inventory

Two static catalogs are concatenated by the engine (`sim/events.js` line 13:
`[...EVENTS, ...EVENTS_6C]`), plus one dynamically-generated "promise call" card kind. I read
`sim/events.js`, `sim/data/events.js` (777 lines) and `sim/data/events6c.js` (461 lines) in full.

### `sim/data/events.js` — `EVENTS` (25 rows)

Legend: **W** = has a `warning` step; **cr** = `crisis: true`; **rep** = `repeatable: true`.

| id | kind | W | cr/rep | choices (cost) | repeatable? |
|---|---|---|---|---|---|
| `flattery` | planted (flag `sycophancy`) | W | | rollback (lose users) / patch ($10M) / defend (—) | one-shot |
| `jailbreak` | planted (flag `jailbreakWaiting`) | W | | patch ($4M) / **deny** (fallback; public trust risk) / pull (lose most users) | one-shot |
| `citations` | planted (flag `hallucination`) | W | | checks (serving costs rise) / **blame** (fallback; —) / recall (lose users) | one-shot |
| `contamination` | planted (flag `contaminated`) | W | | admit (—) / stonewall (—, + lawsuit) | one-shot |
| `distill` | planted (flag `rivalDistill`) | W | | settle ($60M) / **deny** (fallback; —, + lawsuit) / countersue ($20M) | one-shot |
| `agentwreck` | planted (flag `agentic`, era ≥ 3, blocked by hard line `no-autonomy-grab`) | W | | compensate ($30M) / blame (—) | one-shot |
| `companion` | planted (flag `sycophancy` + consumer channel) | W | | settle ($50M) / fight (—, + lawsuit) | one-shot |
| `promise` | planted (flag `brokenPromise`) | W | | come clean (—) / cover up (—, sets `flags.coverUp`) | one-shot |
| `promiseCall` | **promise** (template row; see below) | none | rep\* | deliver / stall (once) / refuse | fires once per failed President promise |
| `president` | world (a policy "demand" card, see note below) | none | | accept (staff trust) / refuse (govt favor) | one-shot |
| `investors` | world (cash < $300M) | none | | accept (a hard line) / refuse (board support) | one-shot |
| `users` | world (a consumer model > 5M users) | none | | accept (model yields) / refuse (lose users) | one-shot |
| `political` | world (era === 3) | none | | accept (public trust) / refuse (govt favor) | one-shot |
| `activists` | world (raceHeat > 60) | none | | accept (next-run capability) / refuse (public trust) | one-shot |
| `openletter` | world (staffTrust < 45) | W | | meet (safety spend up) / ignore (—) | one-shot |
| `poached` | world (era ≥ 2, 15% roll) | none | | counter ($40M) / let go (—) | one-shot |
| `weightTheft` | world (capability ≥ 50, security < 45, 20% roll) | W | **cr** | report (public trust) / hunt ($30M) / silence (—, sets `coverUp`) | one-shot |
| `qilinshock` | world (Qilin released) | none | | cut prices (revenue down) / hold (lose users) | one-shot |
| `neocloudTrouble` | world (a contract is `troubled`) | W | **rep** | spot (spot prices) / rescue (3 months' bill) / let go (lose capacity) | **repeatable** (defuses itself out of `seenEvents`) |
| `siteOpposition` | world (a gas site, 15%→30% roll) | W | | benefits (1 month's lease) / move (2 turns) / push (public trust, may cut site 30%) | one-shot |
| `pledgeDrop` | world (era 2, a safety-compute promise exists) | none | | drop (staff trust, cash +5% valuation) / keep (board support) | one-shot |
| `agentSurge` | world (era 3, an active `agentic`-flagged model) | none | | spot (spot prices) / route (usage + public trust) / cap (users) | one-shot |
| `pooling` | world (last era-4 turn) — **bypasses MAX_CARDS** | none | | accept (30% of compute) / refuse (US favor) | one-shot |
| `oversightTamper` | internal (deployment stage 2) | none | | shutdown (—) / controls ($20M) / ignore (—) | one-shot per game (internal rows never check `seenEvents`, but the trigger itself only fires once at that stage) |
| `selfExfiltration` | internal (deployment stage 3, blocked by hard line `no-autonomy-grab`) | none | **cr** | report (govt favor, public trust) / cover up (security, sets `coverUp`) | one-shot |

\* `promiseCall` is not "repeatable" in the engine-flag sense; it is handled by a completely
separate code path, `queuePromiseCalls` (`sim/events.js` lines 39–61), called once per
`eventsTick` for the `promise`-kind row. It loops `failedPresidentPromises(state)`
(`sim/promises.js` lines 65–71) and queues **one card per currently-failed promise**, each with
its own composite id (see §3). So the "row" `promiseCall` is a template; the number of live
promise-call cards in a turn equals the number of the player's 9 possible President promises that
are currently open, past due, and unmet.

Note on `president` (id, not the office mechanic): this is a spec-§6 "amendment pressure" **demand
card** (`sim/data/constitution.js`'s `DEMANDS`), triggered by `state.flags.presidentDemand`. It is
**unrelated to the President meeting screen** (`sim/president.js`, `openMeeting`/`runMeeting`,
`state.meeting`, plan 2E), which is a wholly separate mechanic with its own move type (`{ type:
'meeting' }`) and its own UI (plan 2B Task 10, `ui/screens/president.js` — not yet built either).
Do not build the `president` event-card row and the President-meeting dialog as the same UI
component.

### `sim/data/events6c.js` — `EVENTS_6C` (11 rows, added by plan 2G)

| id | kind | W | cr/rep | choices (cost) |
|---|---|---|---|---|
| `lossSpike` | **training** | none | **rep** | rollback (one more turn) / slow (smaller gain) / push (weaker model) |
| `capabilityJump` | **training** | none | **rep** | celebrate (race heat) / audit ($15M + a turn) / quiet (—) |
| `whistleblower` | world (era ≥ 2, staff trust < 55, cover-up or debt ≥ 50) | W | **cr** | cooperate ($20M) / NDA (a lawsuit) / discredit (staff trust) |
| `safetyQuits` | world (after `promise` card + staff trust < 50) | W | **cr** | persuade ($30M) / smear (staff trust) / let go (public trust) |
| `boardRevolt` | world (era ≥ 2, crisis flag or board vote would fail) | none | **rep** | concede (staff trust) / lobby ($25M) / face (—) |
| `rivalBreakthrough` | world (era ≥ 2, a rival release ≥10 ahead) | none | | rush (alignment corners cut) / study ($15M) / steady (board patience) |
| `exportFlip` | world (era ≥ 2, 15% roll) | none | | back ($20M) / stay out (—) |
| `priceWar` | world (era ≥ 2, live models, 12% roll) | none | | match (revenue down) / upmarket (lose users) / wait (lose users) |
| `copyright` | world (era ≥ 2, a `scraped`-flagged model, 25% roll) | none | | license ($40M) / fight (a court fight) |
| `senateHearing` | world (era ≥ 3, low trust or high heat) | none | | candid (govt favor) / reassure (staff trust) / counsel (public trust) |
| `viralDemo` | world (a live model, 15% roll) | none | | ride (race heat) / early access (+$M) / stay humble (—) |

`lossSpike` and `capabilityJump` are the two **training mini-events** named in spec §6c ("loss
spike," "sudden capability jump"); `whistleblower`, `safetyQuits`, `boardRevolt` are the
**people-and-company** events (star researcher poached is `poached` above, from plan 2A; safety
open letter is `openletter` above); the remaining six are the **world-and-market** events. A test
(`plan2g-events.md` lines 811–823) pins `EVENTS_6C.length === 11` and that no id collides across
the two catalogs.

### Compute events (plan 2C Task 6)

The five rows `neocloudTrouble`, `siteOpposition`, `pledgeDrop`, `agentSurge`, `pooling` are all
listed above (they live in `sim/data/events.js`, not a separate file — plan 2C Task 6's own file
map, line 1428, confirms it modifies `sim/data/events.js` in place and that the old `datacenter`
row is deleted, replaced by `siteOpposition`). `sim/data/events.js` line 1447 in the plan text
("Delete the `datacenter` row") is corroborated by the code: no `datacenter` id exists in the file
I read. Plan 2C's own note: "The humanoid serving card of spec §5.5 is not built: the humanoid
line does not exist yet (open owner decision B7)" (`plan2c-compute.md` line 1448) — so nothing
about a humanoid-serving event should be assumed by the design.

### President promise calls (plan 2E, card id `promiseCall:<index>`)

Confirmed directly in `sim/promises.js` (108 lines, read in full):
`export const promiseCallKey = (state, promise) => \`promiseCall:${state.promises.indexOf(promise)}\`;`
(line 62). `promiseCallCard(state, event, promise)` (lines 78–98) builds the actual card object:
title and post come from the static `promiseCall` row in `sim/data/events.js`, but the post text is
overridden per-instance: `{ handle: '@executive_office', text: `You promised us: "${promise.text}"` }`.
Choices are filtered from the template row (`deliver`/`stall`/`refuse`), with `stall` dropped if
the promise was already stalled once, and `deliver`'s label swapped for the promise's own
`deliver.label` from `sim/data/promises.js`.

`sim/data/promises.js` (I read this file too) defines the 9 `PROMISES` exactly as plan 2E's table
specifies: `beatRivals`, `leadNextQuarter`, `beatChina`, `noWokeFilters`, `domesticChips`,
`killSwitch`, `humanSignoff`, `favorableModel`, `bigClaim` — each with `{ id, text, check, deliver:
{ label, effects }, contradicts }`. So at most 9 distinct promise-call cards can ever appear (one
per promise a President-meeting answer created), each a full card with its own post text and
tailored "deliver" label; `stall` and `refuse` choices are generic across all of them (`sim/data/events.js` lines 307–311).

### Counts

- `sim/data/events.js`: **25** rows (8 `planted`, 14 `world`, 1 `promise` template, 2 `internal`).
- `sim/data/events6c.js`: **11** rows (2 `training`, 9 `world`).
- **36** static catalog rows total, plus up to **9** dynamically-titled promise-call card
  instances (not separate catalog rows).
- 4 rows are explicitly `crisis: true` (`weightTheft`, `selfExfiltration`, `whistleblower`,
  `safetyQuits`); `boardRevolt` reacts to a crisis but is not itself flagged `crisis: true`.
- 4 rows are `repeatable: true` (`neocloudTrouble`, `lossSpike`, `capabilityJump`, `boardRevolt`).
- 1 row (`pooling`) is `bypassCardLimit: true`.

---

## 3. The data shape the UI receives

**A pending card**, as built by `publicCard(state, event)` (`sim/events.js` lines 26–32) and
pushed into `state.pendingEvents`:

```js
{
  id: event.id,                 // or 'promiseCall:<index>' for a promise call
  title: event.card.title,      // plain string, e.g. "Flattery blowup"
  post: event.card.post,        // { handle: '@screenshot_guy', text: '...' }
  choices: [{ id, label, cost, backers, opposers }],  // catalog fields the UI is allowed to see
  targets: [/* model indices, from event.flag */],    // "the UI can ignore" per plan 2A/2B
}
```

Note `publicCard` strips the `effects` function out of each choice before it reaches the UI
(destructuring only `{ id, label, cost, backers, opposers }`, line 30) — the UI never receives
executable code, only display strings and an id to send back.

**A warning**, `state.warnings[id]`:

```js
{ turn: number, deferred?: true, eventId?, promiseIndex?, promiseId?, promiseMeeting? }
```

The last four fields only appear for a deferred promise-call warning (`sim/events.js` lines
44–52). A warning has **no title/post/choices of its own** — the UI must read the *catalog* row's
`warning: { handle, text }` to render the toast text (plan 2B Task 8 says exactly this: "Each new
warning appears as a small feed toast... (handle and text)"). Since the sim never exports the
catalogs' `warning.text` through any public accessor other than the feed post it already pushed,
the simplest correct source for a warning's display text is the feed entry pushed at
`state.feed` when the warning was raised (tag `'warning'`), not a re-lookup of the catalog (the
catalog is internal to `sim/events.js`/`sim/data/*.js` and not re-exported per-id).

**The feed**, `state.feed` (array, capped at 40 entries, `pushFeed` in `sim/events.js` lines
34–37): `{ turn, handle, text, tag }`, tag ∈ `'warning' | 'event' | 'feed'`. This is the single
read-only log spec §6 calls "a read-only Twitter-like feed."

**Advisor briefing**, `state.lastBriefing` (`sim/advisors.js`, read in full, 46 lines): an array of
`{ id, truth, estimate, band, weird?, line }` for `id` ∈ `research | safety | cfo | policy`. `truth`
and `estimate` are **hidden numbers and must never be shown**; only `band` (`'calm' | 'uneasy' |
'alarmed'`) and `line` (a pre-written string from `sim/data/advisorLines.js`) are player-facing.
`office.js` already reads only `id`/`band` (see §4); nothing in the repo currently reads `.line`.

**Card text already exists, and does not leak hidden numbers — I checked every row.** Every
`title`, `post.text`, `choice.label`, and `choice.cost` string in both catalogs is fully written
prose (no placeholders), and every `cost` string is either a literal, always-visible dollar amount
(e.g. `'$10M'`, `'$60M'`, `'$15M and a turn'` — cash is one of the spec's "Always visible" state
fields, spec §4) or a qualitative phrase for a hidden/people variable (`'staff trust'`, `'board
support'`, `'public trust'`, `'race heat'`, `'government favor'`, `'security'`, `'a lawsuit'`,
`'lose users'`, `'—'`). No `cost` string contains a percentage or a raw number tied to a hidden
state field (alignment debt, misuse exposure, security, race heat, board support, government
favor, staff/public trust never appear as numbers in card text). This matches spec's constraint
and plan 2B's Global Constraints ("Hidden variables are never shown as numbers during play") and
plan 2G's ("Card text never shows a hidden number," line 43) exactly — **the design task can quote
these strings verbatim; no new card copy needs to be written for the 36 existing rows**, though
new copy would be needed for any additional events a design might propose, and the `promiseCall`
post text is templated (see §2) rather than fully static.

---

## 4. UI hooks that exist today

I grepped the entire `ui/` tree for `eventChoices`, `addressWarnings`, `warnings`, `pendingEvents`,
and `lastBriefing`; **the only hits are in `ui/office.js` (for `lastBriefing`) and `ui/game.js`**
(which doesn't reference any of these names directly — see below). **`ui/screens/briefing.js`,
`ui/screens/events.js`, and `ui/screens/feed.js` do not exist in the repository** (confirmed with
`ls ui/screens/`: only `budget.js`, `company.js`, `compute.js`, `history.js`, `recipe.js`,
`sites.js` exist). This directly confirms the premise of this research task: **the sim's events,
warnings and feed are fully implemented and tested, but plan 2B Task 8, which would build the
screens to show them, has not been started.**

**`ui/game.js`** (75 lines, read in full) does **not** expose dedicated `eventChoices` or
`addressWarnings` methods. It exposes one generic method, `setField(key, value)`
(`actions[key] = structuredClone(value); return { ok: true };`, lines 50–53), which is how the
plan expects those two action fields to be populated: plan 2B Task 8 says the "Act on it" button
calls `game.setField('addressWarnings', [...ids])` and that choosing a card "records
`eventChoices[id] = choiceId`" (lines 307–308). **Because `setField` replaces the whole field via
`structuredClone`, not a merge**, any events/warnings screen that lets the player answer more than
one card or warning per turn must read the *current* queued value first
(`game.queue.eventChoices`, `game.queue.addressWarnings` — both are plain objects/arrays on
`actions`, visible via the `queue` getter, lines 26–28) and write back the merged object/array,
e.g. `game.setField('eventChoices', { ...game.queue.eventChoices, [id]: choiceId })`. This is a
real implementation detail the design should account for, not an existing convenience method.

`ui/game.js`'s `initialQueue` (lines 5–13) confirms the shape the sim expects at end of turn:
`{ budget, moves: [], hazardChoice: undefined, addressWarnings: [], eventChoices: {},
constitution: undefined, holdOrShip: undefined }` — `addressWarnings` is an array of ids,
`eventChoices` is an id→choiceId map, matching `sim/turn.js`'s consumption (`for (const id of
actions.addressWarnings ?? [])`, `actions.eventChoices ?? {}`).

**`ui/office.js`** (115 lines, read in full) already implements the "!" / "!!" advisor markers
described in plan 2B Task 2/Task 8, entirely independent of any events screen:
- `moodMap(state)` (lines 6–8) builds a `Map` from `state.lastBriefing`'s `{ id, band }`, defaulting
  to `'calm'` for anything not in `['calm','uneasy','alarmed']`.
- `setMoods(svg, fx, anchors, state)` (lines 21–46) shows/hides the three baked-in
  `.face-calm/.face-uneasy/.face-alarmed` groups per advisor and, **only when the mood is not
  calm**, builds a marker: one exclamation "bang" shape for `uneasy`, **two** side-by-side bangs
  for `alarmed` (the `bang(x, w)` SVG path helper at lines 13–15, called once at x=0 for uneasy,
  twice at x=±4.6 for alarmed inside `markerSvg(alarmed)`, lines 16–19). This is computed purely
  from `state.lastBriefing`'s `band` field — **it does not read `pendingEvents` or `warnings` at
  all**, so the "!"/"!!" markers are advisor-mood markers, not event/warning indicators, and Task
  8's "the '!' marker clears once read this turn" behavior (reading a bubble) is **not yet wired**:
  there is no click handler on advisors anywhere in `ui/office.js`, and no code marks a briefing
  entry "read."
- Markers position at `anchors.heads[role]` offset `+22px, +0px` (line 41), matching the design
  note in the file's own comment (lines 10–12) taken from K2's mockup.
- `mountOffice` (lines 72–115) already swaps the whole office SVG/anchors on era change with a
  cross-fade, and re-subscribes to `game.subscribe` to re-run `setMoods` on every state update —
  so a future events/briefing screen can piggyback on the same subscription rather than adding a
  new one.

**`ui/components/dialog.js`** (162 lines, read in full) is a generic, already-built modal
primitive: `dialog({ title, subtitle, left, right, body, okLabel, backLabel, onOk, onBack,
onCancel })` returns a layer with an optional back button, and `openDialog(overlayRoot, opts)` /
`closeDialog(target)` manage focus-trapping, Escape-to-cancel, and a `gdt-dialog-closed` custom
event. This is generic infrastructure already used by other screens (budget, recipe, etc.) and
should be reused as-is for event cards and warnings — Task 8 does not need a new dialog shell,
only new *content* fed into this existing `dialog()`/`openDialog()` pair. Nothing in `dialog.js`
is specific to events; it has no awareness of `choices`, `backers`, `post`, etc.

**`ui/logic/compute.js`** (659 lines, read in full) exports `projectQueue(state, queue)` (a pure
"what would the state look like after this turn's queued actions" projector used by other screens
for live previews) and `turnSummary(events, state)` (lines 598–659), which converts the sim's
end-of-turn `events` array into short toast strings for the "This turn" panel. **`turnSummary`
currently has no branches for `'eventCard'`, `'warning'`, or `'eventResolved'`** — the three event
types `eventsTick`/`resolveEvent` push (`sim/events.js` lines 82, 90, 100; `sim/turn.js` line 187)
are silently dropped by the existing toast formatter. This is a second, independent confirmation
that the UI does not yet surface events: even the end-of-turn summary toast (already built, used
by Task 7's company screen) has no case for them. `projectQueue`'s `projectBeforeMoves` (lines
132–164) *does* already resolve `queue.eventChoices` and warnings during its projection (lines
152–160), for other screens' "what if" previews — so the projection plumbing for events already
exists and works, it's only the *rendering* that is missing.

---

## 5. Constraints that bind the design

**Plan 2B Task 8 itself** (`docs/superpowers/plans/2026-09-25-plan2b-ui.md` lines 298–310) — the
task this research supports:
- Files to create: `ui/screens/briefing.js`, `ui/screens/events.js`, `ui/screens/feed.js`.
- Consumes: `state.lastBriefing`, `state.warnings`, `state.feed`, `state.pendingEvents`.
- Specified behavior: advisor click → K2-style speech bubble at head anchor with line + mood word,
  clearing the "!" for the turn; each new warning → a feed toast top-left under the HUD with one
  "Act on it ($NM)" button; a "Feed" link in the info-box drop-down opens a read-only last-20-post
  panel; each `pendingEvents` card opens in turn as a GDT dialog (title, post styled as a feed
  post, choices as bordered rows with cost text and advisor chips — backers checked, opposers
  struck through, "never colour alone").
- Needs plan 2A Tasks 2–4 (already merged into this branch, per the plan's own note at line 27).

**Plan 2B Global Constraints** (lines 11–21), binding on every UI task including Task 8:
- Visual reference is `docs/design/mockups/K2-gdt-polished.html` (binding).
- Palette is fixed CSS tokens only (`--cream`, `--paper`, `--ink`, `--teal`, `--wood`, `--coral`,
  `--sky`) — "Every colour in CSS/JS/SVG is a token or a `color-mix()` of tokens."
- "No information by colour alone" — directly relevant to the backers/opposers chips (spec-mandated
  check/strikethrough, not colour-only).
- "**Hidden variables are never shown as numbers during play; only the end-of-run reveal shows
  truths.**" — matches what I found in the card cost strings (§3).
- Fit-to-window scaling, `prefers-reduced-motion` shortens animation to ≤150ms.
- "The sim is imported, never modified, by this plan" — the events UI must treat `sim/events.js`
  and the two data files as read-only.

**Plan 2B's "Other lanes' hooks"** (lines 37–40) does not mention events directly, but does specify
the feed/Lumen placement that Task 8's `ui/screens/feed.js` sits alongside: "Task 8's feed is the
owner's option A: a phone on the CEO desk that buzzes with a count and slides a phone panel up on
the left (mockup `K2-feed-lumen.html#a`), posts from `state.feed`." This ties the events plan's
"Feed" link/panel directly to a specific, owner-approved mockup route (see §6).

**Plan 2G's Global Constraints** (`plan2g-events.md` lines 21–48), binding on the event *data*
itself, most relevant to a design pass:
- "**Card shape (UI lane contract):** `{ id, title, post: { handle, text }, choices: [{ id, label,
  cost, backers, opposers }] }` with 2–4 choices per card." — confirmed in code (§3).
- Backer/opposer label set is closed: `Safety, Research, CFO, Comms, Product, Government,
  Security, Staff` — a design should not invent new advisor/faction labels for chips.
- "**Passive fallback (owner ruling, plan 2A Task 4):** an unanswered card resolves with its
  `fallback` choice, else its last choice." — a design must show the player, or at least make
  discoverable, which choice is "the one that happens if you do nothing," since that choice is
  functionally the default.
- "Fictional names only... Card text never shows a hidden number." (both confirmed in code, §3).
- "Effects that read a model or run must do nothing when it no longer exists" — a defensive rule
  in the sim, not a UI concern, but explains why some choices have no visible effect if their
  target model/run has since ended.

**Spec §6 (characters and systems)** — the four advisors (Head of Research, Head of Safety, CFO,
Policy and Comms Director), each seeing a noisy, biased slice of the truth and "speaks a line from
bands (calm / uneasy / alarmed); none ever shows a number" (lines 124–133). This is the
`lastBriefing` data described in §3/§4 above, already wired into `office.js`'s mood/marker system
but not yet into a clickable bubble.

**Spec §6c (events and incidents)** is the primary source document for the entire event list; see
§1 and §2 above for its text quoted directly. Its "Caused by your model" list (lines 254–268) maps
1:1 onto the `planted`-kind rows in `sim/data/events.js`; its "People and company" and "World and
market" lists (lines 271–277) map onto the `world`-kind rows split across both data files; its
"Training mini-events" list (lines 278–280) maps onto `lossSpike`/`capabilityJump` in
`events6c.js` plus the separate hazard dialog (§1) for the "caught-cheating reasoning trace" line.

**Spec §6d (misalignment during development)** describes the training-hazard mechanic (§1's
"caught cheating reasoning trace") and the internal-deployment escalation ladder ("warning →
incident card → weight self-exfiltration attempt → quiet takeover ending") that
`oversightTamper`/`selfExfiltration` implement as `kind: 'internal'` cards with no warning step
(confirmed: both rows have `warning: null`) — internal cards go straight to a dialog, per plan
2B's relayed plan-2A note: "Internal incidents (`oversightTamper`, `selfExfiltration`) go straight
to a card with no warning step" (plan2b-ui.md line 29).

---

## 6. Design history — approved designs and owner preferences relevant to events

I read `~/.claude/skills/design/TASTE.md` (72 lines), `LEARNINGS.md` (339 lines) and
`DESIGN-LOG.md` (63 lines) in full, and the two mockups named in the task on branch `side-feed`
(`docs/design/mockups/K2-feed-lumen.html`, 439 lines, and `K2-side-options.html`, 560 lines) —
see the Coverage statement for exactly how much of each mockup I read line-by-line versus located
by grep.

**Standing taste rules most relevant to event cards** (`TASTE.md`):
- Baseline direction is "Swiss-leaning restraint... one strong accent, zero decoration" (lines
  9–15), but the per-surface note for this exact game overrides toward in-world staging: "the
  world view with characters working at desks is the main screen (Game Dev Tycoon structure); the
  HUD is tiny and the first menu as minimal as possible; decisions open on demand, never as an
  always-visible dashboard" (lines 69–72).
- "No information by colour alone" is a repo-wide constraint already cited above and echoed in
  `TASTE.md`'s anti-signal about density-without-contrast.

**Directly on-topic LEARNINGS.md entries** (dated, most recent first is how the file is kept, I
quote the relevant ones):

- **2026-09-25, "the playable HUD and markers"** (lines 96–108): after seeing the built "!"/"!!"
  markers, the owner said "currently the marks and the bubble size seems a lil off," generalized
  as: "a mark lifted from a mockup still must be re-checked at its real rendered size next to the
  real heads, zoomed in, before shipping." **This is a direct, unresolved caveat on exactly the
  marker system Task 8 will extend with click-to-open bubbles** — the existing marker geometry in
  `office.js` may still need a pixel-level pass once the click target and bubble panel are added.
  The same entry is also the origin of the "other GDT sections" note: "i remember game dev tycoon
  had some other sections to look up or other financial tracking page... i think it might get a
  lil boring if they only see this" → generalized as "minimal-main-screen does not mean
  one-screen game... plan on-demand secondary screens." This is *why* `docs/research/game-dev-tycoon/secondary-screens-2026-09-25.md`
  exists (see below) and is the design lineage behind Task 13's lab-history screens, not directly
  Task 8, but shapes the expectation that an events/feed screen should feel like one of several
  rich on-demand views, not a token afterthought.

- **2026-09-25, "feed/Lumen placement, era card, endings"** (lines 133–137): "From a scrollable
  options page (feed and Lumen: A phone + monitor, B floating posts + subtitles, C lounge TV +
  robot; era card E1 dialog, E2 banner over the office, E3 newspaper, E4 five-era strip), the
  owner picked '**A with C's robot, E2**'" — **this is the exact combination the task description
  asked me to confirm**, and it matches plan 2B's text (line 39, quoted in §5) verbatim: feed = A
  (phone on the CEO desk, buzzes with a count, slides a panel up left), Lumen = the small floating
  robot from option C (not C's lounge-TV feed, just its robot), era card = E2 (a ribbon banner
  with each advisor's reaction in a bubble at their head anchor, plus three change-cards along the
  bottom). The generalized rule from this entry: "the owner keeps choosing options that leave the
  office on screen and put things IN the world... over panels and newspapers that cover it; mixes
  across options are welcome, so always design options as separable parts" — directly actionable
  for how an events/warnings screen should present itself (in-world, not a full-screen takeover
  panel, where possible) even though event **cards themselves** are explicitly specified as GDT
  dialogs (a full centred panel), so the in-world preference applies to the feed/warning-toast
  layer, not the card-resolution dialog itself.
- Same entry, one workflow note: "The owner could not open an HTML file linked from a worktree
  branch → publish review pages as a private artifact and give the link." (This matches the
  auto-memory file already in scope for this session.)

**No LEARNINGS.md entry is yet recorded specifically about event-card visual design** (backers/
opposers chips, cost-row styling, warning-toast styling) — the owner has not yet reviewed a
mockup of Task 8's screens. This is a genuine gap: Task 8 has not had a design pass yet, unlike
almost every other plan 2B/2C/2D task, which each have a dated LEARNINGS.md entry recording the
owner's reaction to a shown mockup. **A design session for Task 8 should follow the collaboration
workflow (mockup spread, at least one experimental option, screenshot critique) before building,
per the design skill's standing rules** — there is no prior owner decision to simply implement.

**DESIGN-LOG.md** confirms the K2 token palette and Nunito/Libre Baskerville typography are used
uniformly across every shipped game-UI screen so far (grep of the log's game-UI rows), including
the feed/Lumen mockup spread (line 19: "K2 tokens only (sky = Lumen, coral = new/live) · Nunito")
and the era-card/endings mockup (line 18). No entry yet exists for event cards specifically.

**What the approved mockups contain, directly inspected:**

`docs/design/mockups/K2-feed-lumen.html` (branch `side-feed`) is a single HTML file with three
mutually-exclusive route sections toggled by URL hash (`#a`, `#b`, `#c`), each a full-screen
office view with a different feed/Lumen placement overlaid on the same K2 room, plus the
already-approved `#menu`, `#dialog`, `#release` states reused from `K2-gdt-polished.html`. The
three routes (confirmed by reading the file's option-label divs directly, lines 398, 403, 434 of
the fetched file):
- `#a` — "**Phone and monitor**: A phone on your desk buzzes with new posts; click it to read.
  Lumen talks from your monitor at the start of each turn." Implemented as a `.phone` element
  (lines 197–204 of the CSS) docked at the CEO desk with a lock-screen-style notification badge
  ("3 new") and a notch/home-bar phone chrome.
- `#b` — "**Posts float by, Lumen narrates**: New posts drift into the empty margin and fade after
  a few seconds; click one for the full feed. Lumen speaks like film subtitles."
- `#c` — "**Lounge TV and a Lumen robot**: The feed plays on a TV in the lounge corner; click it to
  watch. Lumen is a small floating robot that floats around the office and speaks in bubbles."
  This route pairs a `.tvp` lounge-TV panel (with a "LIVE · The Feed · channel 4" chip) with a
  separate floating-robot Lumen element — plan 2B took **only the robot half** of this route, per
  the LEARNINGS.md entry above ("A with C's robot").

`docs/design/mockups/K2-side-options.html` (branch `side-feed`) similarly bundles multiple
hash-routed states in one file, including the era-card options `#e2`, `#e3`, `#e4` and the endings
options `#n2`, `#n3`, `#n4`, `#nmix`. I inspected `#e2` directly (lines 470–472 of the fetched
file): a `.ribbon` banner ("Era 3 of 5 begins / Reasoning and agents / Each turn is now a month"),
four `.sb` speech-bubble divs positioned at each advisor's approximate head coordinates with a
one-line reaction each (Priya/Research, Tomas/Safety, Jules/Policy, Margot/CFO — note these are
placeholder *character* names distinct from the four *role* ids `research/safety/cfo/policy` used
in `sim/advisors.js`; the design mockups had not yet been reconciled with `ADVISOR_PROFILES`'
naming at the time this mockup was built), and a `.unl` ("unlocked") card row of three plain-text
change items with a Continue button. This matches plan 2B's description of E2 exactly ("a ribbon
banner, each advisor's reaction in a bubble at their head anchor, the three changes as cards along
the bottom, Continue," line 39). This is not itself an events/warnings screen, but establishes the
precedent for "advisor reaction bubbles positioned at head anchors" that Task 8's advisor-click
bubble would reuse structurally.

I did not find a mockup file specifically for event cards, warning toasts, or the events dialog
anywhere in the repo or on `side-feed` — grepping mockup filenames under `docs/design/mockups/`
(not shown in full above, but checked via the file listings implied by the plans and design log)
turns up training-recipe, compute, lab-history, era-card, feed/Lumen, and ending mockups, but
nothing named for events/warnings. This corroborates the "no LEARNINGS.md entry yet" finding: **the
design pass for Task 8 has genuinely not happened.**

---

## 7. Open questions and contradictions

1. **Spec's "2–3 choices" vs. the plan 2G data contract's "2–4 choices."** Spec §6c says event
   cards have "2–3 costly choices" (line 249); plan 2G's Global Constraints and its own test widen
   this to "2–4" (line 35, test at lines 811–823). In practice every existing row has exactly 2 or
   3 choices, so this is latent, not yet a real conflict — but a design that assumes a fixed
   3-choice layout will need to handle a 2-choice and (potentially, per the data contract) a
   4-choice card gracefully.

2. **Spec's turn-flow ordering (events as step 4, between moves and training) vs. the sim's actual
   call order** (unresolved warnings/cards from last turn are consumed at the very top of
   `endTurn`, new cards for next turn are generated at the very bottom). I resolved this myself in
   §1 as "not a real conflict, just screen-sequence vs. call-order," but flag it because a naive
   reading of spec §7 could lead someone to try to generate and show events *mid-turn*, which the
   sim does not support — the pendingEvents a turn's UI shows must be the array already sitting in
   state when the turn begins.

3. **The "!" marker for events, described in Task 8 ("the '!' marker clears once read this turn"),
   does not exist yet** — the only "!"/"!!" system in the code is `office.js`'s advisor-mood
   marker, driven by `lastBriefing.band`, with no notion of "read" state and no click handler.
   Whether Task 8 intends a *second*, separate marker for "this advisor has an unread bubble" (as
   opposed to the mood marker) or intends to overload the existing mood marker for double duty is
   not specified anywhere I found, and no mockup resolves it. This is a genuine open design
   question, not something decided.

4. **How the events screen learns a warning's display text.** As noted in §3, `state.warnings[id]`
   carries no title/body text of its own; the catalog rows that define `warning: { handle, text }`
   are not exported per-id from `sim/events.js` (only `byId`, an unexported internal helper, looks
   them up). The practical options are (a) read the text back out of `state.feed` (the warning was
   pushed there when raised, tagged `'warning'`), or (b) export a small `warningText(id)` helper
   from `sim/events.js` for the UI to import. Nothing in the plans specifies which; plan 2B Task 8
   only says the toast needs "handle and text" without saying where the UI reads them from. This
   is a real implementation gap the design/implementation pass will need to close, not just a
   presentation choice.

5. **`president` (the demand-card id) is easy to confuse with the President-meeting screens** —
   both involve "the President" and both live partly in `sim/data/president.js`/`constitution.js`
   respectively, but they are different systems with different move types, different UI screens
   (Task 8 vs. Task 10), and different resolution paths (`eventChoices` vs. `presidentAnswers`). I
   did not find this distinction stated explicitly anywhere in the plans — it only became clear
   from reading the code (`sim/data/events.js`'s `president` row uses `DEMANDS`/`forceAmendConstitution`,
   entirely separate from `sim/president.js`'s `runMeeting`/`state.meeting`). Flagging this so a
   design pass does not accidentally merge the two into one "President" card type.

6. **No owner-approved mockup exists for the events/warnings screens themselves** (§6). Per the
   design skill's own gates (mockup spread with a genuinely experimental option, screenshot
   critique, LEARNINGS.md update), a Task 8 design should not skip straight to a single "faithful
   K2 extension" the way several already-approved compute/recipe screens did — those had the
   benefit of an already-established pattern from an earlier spread; events/warnings/feed do not
   yet have that anchor beyond the feed/Lumen and era-card precedents in §6, which cover placement
   of the feed and Lumen but not the event-card dialog or warning-toast styling specifically.

7. **`plan2c-compute.md`'s "Deferred balance work" section, named in this research task's
   assignment, does not exist in the branch I was asked to research.** ⚠️ I confirmed via `git log`
   that the commit which adds that section (`799368d`, "docs(plan): record the deferred balance
   work for after the first playthrough") is **not an ancestor of** `events-research`/`ui@282e130`
   — it exists only on `main`. I could not read a section that is not present in the assigned
   branch; see the Coverage statement for exactly what I read of `plan2c-compute.md` instead.

---

## Coverage statement

Files/documents opened and read to the end in full, in this session:
- `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` (444 lines) — full.
- `docs/superpowers/plans/2026-09-25-plan2b-ui.md` (387 lines) — full.
- `docs/superpowers/plans/2026-09-25-plan2g-events.md` (864 lines) — full.
- `docs/superpowers/plans/2026-09-25-plan2e-president-promises.md` (212 lines) — full.
- `sim/events.js` (150 lines) — full.
- `sim/data/events.js` (777 lines) — full.
- `sim/data/events6c.js` (461 lines) — full.
- `sim/turn.js` (333 lines) — full.
- `sim/promises.js` (108 lines) — full (not in the assigned file list, but needed to verify the
  `promiseCall:<index>` id format and `promiseCallCard` shape cited in §2/§3; read on my own
  initiative because the assigned files reference it directly).
- `sim/data/promises.js` (first ~150 lines, which is the entire `PROMISES` object; the file ends
  immediately after the `bigClaim` entry) — full, confirmed no content follows.
- `sim/hazards.js` (47 lines) — full (read to distinguish the training-hazard pathway from the
  event-card pathway in §1; not in the assigned file list, read on my own initiative).
- `ui/game.js` (74 lines) — full.
- `ui/office.js` (115 lines) — full.
- `ui/components/dialog.js` (162 lines) — full.
- `ui/logic/compute.js` (659 lines) — full.
- `docs/research/README.md` (38 lines) — full.
- `docs/research/ai-lab-mechanics/report.md` (218 lines) — full.
- `docs/research/game-dev-tycoon/secondary-screens-2026-09-25.md` (37 lines) — full.
- `~/.claude/skills/design/TASTE.md` (72 lines) — full.
- `~/.claude/skills/design/DESIGN-LOG.md` (63 lines) — full.
- `~/.claude/skills/design/LEARNINGS.md` (339 lines) — full.
- `sim/data/eras.js` (first ~8 lines, the entire file's substantive content — `ERAS` array plus
  `eraById`) — full.

Files read partially, flagged:

- ⚠️ **`docs/superpowers/plans/2026-09-25-plan2c-compute.md` (1,798 lines) — read only Task 6
  ("Compute events," lines 1425–1564) and the tail from Task 8 through the end of file (lines
  1675–1798, covering Task 8 "Balance with compute," the Self-review notes, and both Review
  records). I did NOT read lines 1–1424 (Tasks 1–5: compute tables, contracts, the era-3
  allocation queue, wiring contracts into the turn, and the compute split/pledge). The task
  assignment asked me to read "at minimum Task 6 compute events and the Deferred balance work
  section" — I found no section titled or resembling "Deferred balance work" anywhere in this
  file as it exists on the assigned branch (`events-research`/`ui@282e130`); `git log` confirms
  the commit that adds such a section (`799368d`) is on `main` only, not an ancestor of this
  branch, so it could not be read here. Everything I cited from this file in §1/§2/§5 comes only
  from the two ranges I did read.
- ⚠️ **`docs/design/mockups/K2-feed-lumen.html`** (branch `side-feed`, 439 lines fetched via `git
  show`): I read lines 1–99 (the `<head>`/CSS token block and general panel styles) directly with
  the Read tool, then used `grep -n` against the full fetched text to locate and read the specific
  route-label and structural lines I cite in §6 (lines ~172–434 per the grep output: the `#a`/
  `#b`/`#c` section markers, the `.phone`/`.opt` label text, the Lumen-glyph CSS comment). I did
  not read every intervening CSS/SVG line end-to-end. My claims about what each route "contains"
  rest on the option-label `<div class="opt">` text (which is written as a design-note summary of
  each route, e.g. "A · Phone and monitor..."), not a full visual read of the SVG markup.
- ⚠️ **`docs/design/mockups/K2-side-options.html`** (branch `side-feed`, 560 lines fetched via `git
  show`, saved to `/tmp/k2-side-options.html`): I grepped for section markers (`<div id="...">`,
  `<h1>`, `<h2>`) to find the `#e2`/`#e3`/`#e4`/`#n2`/`#n3`/`#n4`/`#nmix` routes, then read lines
  460–560 (the `#e2` era-card section through end of file, including `#e3`, `#e4`, and the four
  endings-screen routes) directly. I did not read lines 1–459 (the file's CSS/token block and the
  reused `#menu`/`#dialog`/`#release` states) line-by-line; I take on faith, from the file's own
  comment style and the plan text, that those reuse `K2-gdt-polished.html`'s existing, previously
  approved styling rather than reading it again.
- ⚠️ **`ui/screens/` directory** — I did not read the contents of `budget.js`, `company.js`,
  `compute.js`, `history.js`, `recipe.js`, or `sites.js`; I only listed the directory (`ls`) to
  confirm that `briefing.js`, `events.js`, and `feed.js` do not exist there. Any claim in this note
  about those six existing files' *contents* would need a fresh read; I make no such claims beyond
  their existence and filenames.
- I did not read `sim/data/president.js`, `sim/president.js`, `sim/data/constitution.js`,
  `sim/data/advisorLines.js`, `sim/rivals.js`, `sim/board.js`, `sim/split.js`,
  `sim/data/compute.js`, `sim/power.js`, `sim/contracts.js`, `sim/economy.js`, `sim/queue.js`, or
  `tools/balance.js` — these were not in the assigned reading list and I only reference their
  exported names as cited in the files I did read (`sim/turn.js`'s imports, `sim/events.js`'s
  imports, and the plans' own text). Any claim above that names a function from one of these files
  (e.g. `forceAmendConstitution`, `boardVote`, `rank`) is sourced from its call site in a file I
  did read, or from the plan text describing it — not from independently reading that file's own
  implementation.

No file I was asked to read was truncated by a tool; every ⚠️ above is a genuine partial-read
(either a subset of a large file's line range, or a grep-located subset of a fetched git-show
output) rather than a tool failure.
