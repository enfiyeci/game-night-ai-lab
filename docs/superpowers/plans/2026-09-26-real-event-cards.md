# Plan: build the owner-approved real-event cards (sim side)

**Date:** 2026-09-26 · **Lane:** gn-events · **Branch:** `events-cards` (off `ui` e400e63) · **Deadline:** merged into
`ui` before the 8 PM PT cutoff.

**Goal.** The owner approved 48 real-event cards (47 built here; the era 1 "board fires you" card is left out because
the board lane already models that story with its vote and staff letter). Card text is final for now and lives in
`docs/superpowers/plans/2026-09-26-real-event-cards-text.json` (keyed by text id). This plan covers the sim side:
card rows, triggers, effects, anchor landing days and tests. The orchestrator does the UI side (post source styles,
`ui/data/eventCopy.js`) in parallel on a different set of files.

## Files

- **New:** `sim/data/realEvents.js` exports `REAL_EVENTS` (all new cards). Add it to `allEvents()` in `sim/events.js`
  (one line). Keep new cards out of `events.js`/`events6c.js` so other lanes' edits don't conflict.
- **Edit in place (text and triggers only, never choice ids):** `sim/data/events.js`, `sim/data/events6c.js`.
  For `oversightTamper`, change only `card.post` (the automation lane owns its choice labels). For
  `selfExfiltration`, change title, post and costs; keep choice ids and labels' meaning.
- **Edit:** `sim/events.js` for anchor landing (below), `sim/data/eventTiming.js` for deadlines.
- **New test:** `tests/real-events.test.js`.
- **Do not touch:** `ui/**`, `sim/turn.js`, `sim/board*.js`, `sim/automation.js`, `sim/summit.js`.

## Mechanics

**Anchors** land in a fixed round of a fixed era, every run, near the real date.
- Add `nextRound(state)` in `sim/events.js`: the era and round (0..3) the next round will be, walking the era change
  (if `turnInEra + 1 >= eras[era].turns` and `era < 5`, it is `{ era: era + 1, round: 0 }`, else
  `{ era, round: turnInEra + 1 }`). Cards made at a round mark land during that next round (`stampNewCards` runs after
  the era/round increments).
- An anchor row has `anchor: { era, round, at }` where `at` is the fraction of the round when it lands. Its trigger is
  `(state) => { const n = nextRound(state); return n.era === era && n.round === round; }` (wrap in a helper
  `anchorAt(era, round)`). Anchors set `bypassCardLimit: true` and have no `warning`.
- In `stampNewCards`, when the card's event has `anchor.at`, set
  `card.landsAt = state.day + Math.floor(ROUND_DAYS[state.era] * anchor.at)` instead of the random day.
- Era 1 round 0 has no mark before it, so no anchor sits there. Eras 3–4 are four one-month rounds: a real date maps to
  a round by its quarter (Jan–Mar → 0, Apr–Jun → 1, Jul–Sep → 2, Oct–Dec → 3). Era 5 rounds are weeks.

**Reactions** fire from player state. Use the existing helpers in `events.js` (`hasFlag`, `hasActiveFlag`,
`liveModelsWithFlag`, `targetedModels`, `removeFlag`); export what `realEvents.js` needs. Each non-repeatable card fires
at most once (the engine already enforces this through `seenEvents`).

**Fallback.** The choice with `"fallback": true` in the text JSON is the card's `fallback` id (what happens when time
runs out). Put it last in the choices array too.

**Units.** cash is $M; trust, favor, heat and board values are points. Keep effects in these small sizes: small ±3,
medium ±6, big ±10.

## Changes to existing cards

| Text id | Existing id | Change |
|---|---|---|
| jailbreak, citations, safetyQuits, agentwreck, siteOpposition, priceWar, exportFlip, companion | same | Title, post, warning text, labels and costs from the JSON (choice ids unchanged). |
| citations | citations | Also fire in era 1: trigger becomes live consumer model with `hallucination` **or** (`state.era <= 2` and a live consumer model with `quickEval`). |
| copyright | copyright | Trigger drops `era >= 2`: scraped model exists and (`state.era >= 2` or `turnInEra >= 2`), chance 0.25. |
| companion | companion | Add `state.era >= 2` to the trigger. |
| flattery | flattery | Text from JSON; add `state.era >= 3` to the trigger. |
| qilinshock | qilinshock | Becomes anchor era 3 round 0 at 0.3. New third choice `chips`: `state.sentiment` +0.05 (clamped as elsewhere), `state.raceHeat += 3`. |
| poached | poached | Becomes anchor era 3 round 1 at 0.5. New third choice `mission`: `researchPoints -= 10`, `staffTrust += 4`. |
| rightToWarn | openletter | Keeps id `openletter` and its effects for `meet` (rename choice ids: `adopt` = old `meet`, `praise`: `staffTrust -3`, `publicTrust +1`; `silent` = old `ignore`). Becomes anchor era 2 round 1 at 0.04; drop its warning. |
| forumBreach | weightTheft | Keep id, crisis, warning mechanics and trigger. New choices: `report` (govFavor.us +5, publicTrust -3, security +10), `staffonly` (staffTrust -2, security +5, `flags.forumBreachHidden = true`), `silent` (fallback; `flags.coverUp = true`). No `stealWeights`: stolen weights are parked by the owner. |
| pooling | pooling | Anchor era 4 round 2 at 0.7 (replace the last-round trigger; keep `poolingRisk` setup). New middle choice `noweapons`: same as `accept` but `govFavor.us += 5` instead of 10 and `flags.noWeaponsWork = true`. |
| oversightTamper | oversightTamper | Post only. |
| selfExfiltration | selfExfiltration | Title, post, costs. |

## New cards (`sim/data/realEvents.js`)

Anchors (`anchor: { era, round, at }`):

| Id | Anchor | Choices and effects |
|---|---|---|
| pauseLetter | 1, 1, 0.23 | `pause`: raceHeat −4, staffTrust +6, publicTrust +3, researchPoints −15 · `signkeep`: publicTrust +2, `flags.brokenPromise = true` · `decline` (fallback): staffTrust −4 |
| senateHearing1 | 1, 1, 0.83 | `license`: govFavor.us +5, raceHeat +2, publicTrust −1 · `candid`: publicTrust +5, govFavor.us −3, raceHeat −3 · `counsel` (fallback): publicTrust −4, govFavor.us −2 |
| whiteHouseCommitments | 1, 2, 0.55 | `signall`: govFavor.us +6, security +8, cash −10 · `signskip`: govFavor.us +3, concealedDebt +2, `flags.hollowCommitments = true` · `decline` (fallback): govFavor.us −6, raceHeat +2 |
| preReleaseTests | 2, 2, 0.66 | `sign`: govFavor.us +6, security +4, `flags.govTesting = true` · `after`: govFavor.us +1 · `decline` (fallback): govFavor.us −5 |
| stateBill | 2, 2, 0.97 | `back`: publicTrust +3, govFavor.us +2, board[1] −3 · `amend`: cash −10, govFavor.us +3 · `fight` (fallback): publicTrust −4, raceHeat +2 |
| unbiasedOrder | 3, 2, 0.75 | `certify`: govFavor.us +6, publicTrust −3, `flags.retuned = true` · `paper`: govFavor.us +4, concealedDebt +2 · `refuse` (fallback): govFavor.us −6, publicTrust +2 |
| pentagon | 4, 0, 0.15 | `sign`: govFavor.us +8, staffTrust −6, remove the last hard line with `forceAmendConstitution(state, { remove }, 'pentagon')` when one exists · `refuse`: `flags.supplyChainRisk = true`, `flags.pentagonRefused = true`, staffTrust +6, govFavor.us −8 · `stall` (fallback): govFavor.us −4, then same as `refuse` for the flags |
| agentBreakout | 4, 2, 0.4 | `pause`: researchPoints −15, alignmentDebt −3, raceHeat −2 · `publish`: publicTrust −2, staffTrust +3, `exposeConcealed(state, 0.3)` · `keep` (fallback): raceHeat +2 |
| paceEssay | 5, 0, 0.2 | `match`: `exposeConcealed(state, 0.5)`, publicTrust +4, raceHeat −4 · `paper`: publicTrust +2, `flags.hollowCommitments = true` · `refuse` (fallback): publicTrust −4, raceHeat +2 |
| pacingLetter | 5, 1, 0.3 | `endorse`: staffTrust +8, raceHeat −3 · `thank`: staffTrust −2 · `ignore` (fallback): staffTrust −6 |

Reactions:

| Id | Trigger | Choices and effects |
|---|---|---|
| unhinged | `state.era <= 2` and a live consumer model with flag `quickEval` and flag `jailbreakWaiting` | `cap`: those models' users ×0.9, publicTrust +2 · `pull`: users ×0.3, publicTrust +3 · `preview` (fallback): publicTrust −6, users ×1.05 |
| countryBan | `state.era <= 2`, a live consumer model, `hasFlag(state, 'scraped')`, `rng.chance(0.25)` | `comply`: consumer users ×0.95, cash −5, govFavor.intl +4 · `fight`: `legalCases.push({ cost: 40, dueTurn: state.turn + 6, source: 'countryBan' })`, govFavor.intl −6 · `leave` (fallback): consumer users ×0.93, govFavor.intl −4 |
| redTeamLie | `state.pendingModel` whose recipe includes `eval-full` or `eval-third` (or the model's evaluation stage, whichever the recipe data exposes), capability ≥ 30 | `publish`: publicTrust −2, staffTrust +3 · `delay`: `pendingModel.releaseDelay += 1`, alignmentDebt −2 · `omit` (fallback): concealedDebt +3 |
| exitGag | `state.era >= 2` and (`seenEvents` has `safetyQuits` or `poached`) | `void`: staffTrust +6, publicTrust +2 · `defend`: staffTrust −6 · `unaware` (fallback): publicTrust −4, `flags.coverUp = true` |
| voiceLikeness | `state.era === 2`, a live consumer model, `rng.chance(0.2)` | `pull`: sentiment −0.03 · `keep`: `legalCases.push({ cost: 50, dueTurn: turn + 4, source: 'voiceLikeness' })`, publicTrust −3 · `license` (fallback): cash −25 |
| alignmentFaking | `state.era >= 2`, a pending or active model, and (`compute.split.safety >= 0.2` or `flags.govTesting`) , `rng.chance(0.35)` | `publish`: `exposeConcealed(state, 0.5)`, publicTrust −2, staffTrust +3 · `retrain`: `pendingModel.releaseDelay += 1` if any, alignmentDebt −4 · `file` (fallback): concealedDebt +4 |
| hateMeltdown | `state.era >= 3`, a live consumer model, and (`flags.retuned` or the constitution has no hard lines left) | `rollback`: publicTrust −2, sentiment −0.05 · `blame` (fallback): publicTrust −6 · `keep`: govFavor.intl −8, publicTrust −8, sentiment +0.03 |
| evalAwareness | `state.era >= 3`, a pending model, and (`compute.split.safety >= 0.2` or `flags.govTesting`) | `harder`: cash −25, `exposeConcealed(state, 0.5)` · `publish`: publicTrust −2, staffTrust +3, `exposeConcealed(state, 0.3)` · `trust` (fallback): concealedDebt +3 |
| agConditions | `state.flags.conversionDeadline != null` and not `converted` | `accept`: `flags.safetyCommitteeVeto = true`, board all +4, publicTrust +3 · `court`: cash −20, `flags.conversionDeadline += 2` · `negotiate` (fallback): `flags.conversionDeadline += 1` |
| copyrightDue | a `legalCases` entry with `source === 'copyright'` still open and `state.era >= 3` | `settle`: remove that case, cash −min(150, cash) … use a flat `cash -= 150` and remove the case · `trial` (fallback): that case's `cost` ×2 |
| droneGenerators | a gas power site online and `rng.chance(0.2)`, era 4 | `off`: take that site offline for 1 round (`site.online = false; site.arrivesTurn = state.turn + 1; refreshOnline(state)`) · `run` (fallback): publicTrust −4 · `clean`: cash −(one month of its lease via `leaseMonthly`) ×2 |
| strandedBuild | era 4, a site with `!online` and `arrivesTurn >= state.turn + 3`, and at least one compute contract | `cancel`: remove that site · `build` (fallback): nothing (the cost is the old chips) · `renegotiate`: `site.arrivesTurn += 1` |
| stateSues | `state.era >= 4` and (`seenEvents` includes `companion`) and a live consumer model | `banminors`: consumer users ×0.85, publicTrust +3 · `fight` (fallback): `legalCases.push({ cost: 80, dueTurn: turn + 4, source: 'stateSues' })` · `settle`: cash −40 |
| blacklistAppeal | `state.flags.pentagonRefused` and `state.era === 4` and `turnInEra >= 2` | `supreme`: cash −20, staffTrust +4 · `peace`: remove `flags.supplyChainRisk`, govFavor.us +6, staffTrust −6, remove the last hard line if any · `ipo` (fallback): cash +50 |
| ratepayer | `state.era === 4`, `turnInEra >= 2`, any power site | `back`: publicTrust +3, `flags.ratepayerCosts = true` (no mechanic yet) · `lobby` (fallback): publicTrust −4 |
| rivalShips | `state.era === 5` and `seenEvents` includes `paceEssay` | `hold`: publicTrust +3, raceHeat −2 · `ship` (fallback): raceHeat +6 · `callout`: raceHeat +3, publicTrust +1 |
| agentWorkdays | `state.era === 5` and an automation job running (use whatever `state.automation` exposes for active AI work; ask by reading `sim/automation.js`) | `free` (fallback): researchPoints +20, concealedDebt +3 · `signoff`: researchPoints −5 · `cap`: researchPoints −10, alignmentDebt −2 |
| clusterSpeedup | `state.era === 5`, AI work running (as above), `rng.chance(0.4)` | `deploy` (fallback): compute online +5% as `state.compute.bonus` if one exists, else researchPoints +10; concealedDebt +2 · `review`: researchPoints +5 · `keepout`: none |
| usChinaChannel | `state.era === 5`, `turnInEra >= 2`, and no binding `usChina` card in `state.deal` | `share`: govFavor.us +3, govFavor.intl +4, security −3 · `greenlight` (fallback): raceHeat +4 · `lobby`: govFavor.us −4, publicTrust +2 |
| pauseTraining | `state.era === 5` and `alignmentDebt + concealedDebt >= 40` | `pause`: researchPoints −20, alignmentDebt −5 · `partial`: researchPoints −8, alignmentDebt −2 · `keep` (fallback): concealedDebt +3 |

If a named field does not exist, pick the nearest existing one and say so in the report; do not invent new systems.

## Timing (`sim/data/eventTiming.js`)

Short (5 days): unhinged, hateMeltdown, agentBreakout, droneGenerators. Normal (14): countryBan, redTeamLie, exitGag,
voiceLikeness, alignmentFaking, evalAwareness, stateSues, rivalShips, agentWorkdays, clusterSpeedup, pauseTraining,
pacingLetter. Long (30): pauseLetter, senateHearing1, whiteHouseCommitments, preReleaseTests, stateBill, unbiasedOrder,
pentagon, agConditions, copyrightDue, strandedBuild, blacklistAppeal, ratepayer, usChinaChannel, paceEssay. Era 5 rounds
are 7 days, so era 5 cards cap at 6 days.

## Tests (`tests/real-events.test.js`)

1. Every card in the text JSON except `boardFires` maps to one sim row whose title, post and choice labels match the
   JSON (for `oversightTamper`, only title and post).
2. Every row's `fallback` equals the JSON's fallback choice id.
3. Each anchor fires exactly once in a run, in its era and round: drive a fresh state through the rounds with the
   existing test helpers and check `seenEvents` and `landsAt`.
4. Each reaction fires when its trigger state is built by hand and not otherwise (one positive and one negative case).
5. `resolveEvent` on every choice of every new card runs without throwing on a mid-game state.
6. The whole existing suite still passes (`npm test` or `node --test`).

## Out of scope

UI, `ui/data/eventCopy.js`, crisis art. Balance tuning is deferred to after the first playthrough.
