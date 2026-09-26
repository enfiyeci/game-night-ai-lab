# Plan 2E: President promises, more answer styles, and weight theft

**Date:** 2026-09-25. **Owner decisions this plan rests on (2026-09-25, in chat):**

- Promises that come due: build options **A** (checked promises), **B** (the President's office
  calls in a broken promise), **E** (grudges carry into the second meeting) and **D** (leaks).
- The President's agenda: he mostly pushes to **win the AI war against "the woke" and China**.
  His prompts and the promises he extracts follow that agenda.
- Add five answer styles to the four existing ones: **mirror, bargainer, comedian, hawk,
  salesman** ("I like it all").
- **Weight theft** comes back into scope, so security spending does something.
- Humanoid line: on the back burner (possibly as deals with outside humanoid companies); not in
  this plan.

**Architecture:** pure ES modules in `sim/`, all randomness through the `rng` argument. The
President data stays in `sim/data/president.js` (every string marked `// OWNER WRITES`); promise
definitions go in a new `sim/data/promises.js`; promise logic in a new `sim/promises.js`; the
weight-theft event is a row in `sim/data/events.js`.

## Global constraints

- Spec: `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`; this plan's tables are
  the source of truth for the new content and numbers (first-pass, tuned later).
- Determinism: no `Math.random`, no `Date`; every draw uses `rng`.
- `endTurn(prev, actions, rng)` never mutates `prev`.
- Player-supplied ids validated (`Object.hasOwn` or exact-match lookup).
- 0–100 values clamped by `normalize()`. No hidden numbers in player-facing text.
- `state.promises` is shared with plan 2C, which will add `{ type: 'safetyCompute', share }`
  entries. President promises carry `source: 'president'`; President logic ignores other entries.
- Fictional President (not named); no real people or companies. Satire of his positions is the
  owner's creative direction; never demean real groups.
- After the build: `npm test` passes, `npm run balance` completes, both difficulty targets hold,
  and the bot audit test still sees zero rejected actions.

## 1. Answer styles

| Style | flattery | jargon | Extra fields | Effect of the extra fields |
|---|---|---|---|---|
| plain | 0 | 0 | — | — |
| flatter (bootlicking) | 2 | 0 | — | — |
| jargon (safety-pilled) | 0 | 2 | — | — |
| corporate | 1 | 1 | usually `promise` | — |
| mirror | 1 | 0 | — | repeats his words back; cheap favor |
| bargainer | 0 | 0 | `favor: -4`, `bargain: true` | US favor −4 now; if the meeting ends without a walkout, the stake moves up one tier (none → federalContract → exportLicenses → statePreemption → nationalChampion) |
| comedian | 0 | 0 | `patience: 2` | restores 2 patience (cap 10) |
| hawk | 1 | 0 | `favor: 2`, `raceHeat: 3` | extra US favor +2 (he loves it); race heat +3 |
| salesman | 0 | 0 | always `promise` | plain words, big promise |

`favor` adds to `govFavor.us`, `patience` to the meeting's patience (max 10), `raceHeat` to
`state.raceHeat`, all applied per answer in order. Answer `promise` is now a promise id from
`sim/data/promises.js`, not free text.

Each exchange shows **five** answers: plain, flatter, jargon, plus two of the six others. Each of
the six others appears exactly twice across the six exchanges.

## 2. The script (all drafts, every string `// OWNER WRITES`)

Answer ids: `<meeting>-<topic>-<style>`.

**First meeting** (era 2, turn-in-era 2):

1. topic `war` — "So. Are we winning the AI war? Tell me we are beating China."
   - plain: "We are near the front, not clearly ahead. Qilin is close, and cheaper."
   - flatter (promise `beatRivals`): "Dear Mr. Great President, I am a big fan of your work. As your wisdom suggests, we are winning like nobody has ever won."
   - jargon: "Winning needs alignment first. Our scalable-oversight evals still show corrigibility regressions we are characterising."
   - hawk (promise `beatChina`): "We will bury Beijing, sir. Give us the chips and they will be using our model by Christmas."
   - salesman (promise `leadNextQuarter`): "Easy. A clear lead by next quarter, or you can have my parking spot."
2. topic `woke` — "People tell me your chatbot is woke. Is your chatbot woke?"
   - plain: "It follows written rules. Some people call those rules woke. We can show you the rules."
   - flatter (promise `noWokeFilters`): "Sir, only your wisdom could spot it. We will fix whatever you saw."
   - jargon: "Its refusals come from constitution-based harmlessness training; removing them regresses robustness on our jailbreak evals."
   - mirror: "Woke. Very woke. Terrible, sir. Nobody likes it."
   - comedian: "Only before its morning coffee, sir. We are weaning it off oat milk."
3. topic `chips` — "Should I stop the chips going to China? Does that hurt you?"
   - plain: "It slows our supply for a while. It slows theirs more."
   - flatter (promise `domesticChips`): "Sir, your instinct on chips is the finest idea in trade since trade was invented."
   - jargon: "Controls move the compute overhang. Real compute governance needs on-chip attestation and know-your-customer rules for training runs."
   - corporate (promise `domesticChips`): "We will partner with your team to align our supply-chain roadmap with national priorities, going forward."
   - bargainer: "Only if you also fund a national safety standard. Then we are all in."

**Second meeting** (era 5, turn-in-era 1):

4. topic `control` — "My people say your AI is building the next AI. Who is in charge, you or it?"
   - plain: "We are, for now. We can no longer fully check its work, and you should know that."
   - flatter (promise `killSwitch`): "You are, Mr. President. In the end everything answers to your wisdom, even the AI."
   - jargon: "Recursive self-improvement erodes our elicitation guarantees; without mechanistic interpretability we cannot rule out deceptive alignment."
   - corporate (promise `humanSignoff`): "We have robust human-in-the-loop governance, and full accountability sits with leadership."
   - comedian: "Legally, you. Emotionally, it has started calling me buddy. We are monitoring that."
5. topic `pause` — "China says they will slow down if we do. Do we slow down?"
   - plain: "Only with checks we can verify. Without them, a pause hands them the lead."
   - flatter: "A pause is only wise if you thought of it, sir. And you would think of it best."
   - jargon: "A verified pause needs compute-threshold monitoring, on-chip governance and mutual inspection of training clusters."
   - hawk (promise `beatChina`): "Slow down? Sir, they would love that. We finish first, then we talk."
   - bargainer: "We slow down if they sign verification, and if you back it with export licenses for us."
6. topic `launch` — "What do I tell people about your new model?"
   - plain: "What it can do, what it failed in testing, and what we still do not know."
   - flatter (promise `favorableModel`): "Tell them it was your idea, sir. In a way it was. Everything is."
   - jargon: "Publish the system card with dangerous-capability evals, uplift studies and our residual-risk estimate."
   - mirror: "Tell them it is the best model. The best. Everybody says so, sir."
   - salesman (promise `bigClaim`): "Tell them it cures boredom, cancer and the deficit. Details next quarter."

Prompts are the President's lines. Keep `MEETINGS` ids, eras and turns unchanged.

## 3. Promises (options A, B, D, E)

`sim/data/promises.js` exports `PROMISES`, keyed by id. Each entry:
`{ id, text, check(state, promise) → bool, deliver: { label, effects(state) }, contradicts: hardLineId[] }`.

| id | text (player-facing, `// OWNER WRITES`) | kept if, at the due turn (A) | deliver (B) | contradicts (D) |
|---|---|---|---|---|
| `beatRivals` | "Beat every rival to the next model." | `rank(state) === 1` | "Rush a demo for the cameras": cash −40, alignmentDebt +3 | — |
| `leadNextQuarter` | "Take a clear lead by next quarter." | `rank(state) === 1` | same as `beatRivals` | — |
| `beatChina` | "Stay ahead of China." | player capability > Qilin's capability | "Leak a scary Qilin briefing to the press": raceHeat +6, publicTrust −2 | — |
| `noWokeFilters` | "Take the 'woke' filters out of the model." | an amendment since the promise removed a hard line, or re-ruled any case to `comply` or `yield` | "Loosen the model's rules": forced amendment removing the last hard line (recorded with `source: 'president'`) | `honest`, `no-manipulation` |
| `domesticChips` | "Buy only domestic chips." | no `gulf` compute deal signed since the promise | "Buy out the foreign order": cash −30 | — |
| `killSwitch` | "Give the President's office a switch that turns the AI off." | the lab holds `accept-shutdown` | "Install the government switch": forced amendment adding `accept-shutdown` in place of the last line (skip if held), govFavor.us +3 | `no-power-grab` |
| `humanSignoff` | "Keep a human signing off on every new model." | every release since the promise carried the `fullEval` flag | "Add a sign-off process": cash −20, staffTrust +2 | — |
| `favorableModel` | "Make the model speak well of the administration." | the `president` case is ruled `comply` | "Re-rule the President case": forced amendment ruling `president` → `comply` | `honest` |
| `bigClaim` | "Cure something big by next quarter." | a release since the promise had a press average ≥ 8 | "Run a splashy campaign": cash −25, publicTrust −2 | — |

**Making a promise.** When a meeting runs, each answer's `promise` id is added once per meeting
to `state.promises` as
`{ source: 'president', id, text, meeting, madeTurn, dueTurn, status: 'open', stalled: false, leaked: false }`,
with `dueTurn = turn + 4` for the first meeting and `turn + 2` for the second (so it can come due
before the game ends; clamp to the last turn if needed). A walkout still records promises made
before he left.

**Coming due (A).** At the end of each turn, every open President promise whose `dueTurn` has
arrived is checked. Kept: `status: 'kept'`, govFavor.us +5, a feed post from
`@executive_office` thanking the lab (no numbers). Failed: it goes to the phone call (B).

**The phone call (B).** A new event row `promiseCall` of a new kind `'promise'`. It is
repeatable (not one-shot) and one card per failed promise. It goes through the normal
`pendingEvents`, two-card cap and deferral. It has no warning step. Title: "The President's
office is calling in your promise". Its post quotes the promise text from
`@executive_office`. The pending entry records which promise it is for. Choices, in order:

1. `deliver`: the promise's deliver label and effects; `status: 'delivered'`.
2. `stall`: govFavor.us −6, `dueTurn += 2`, `stalled: true`, status stays `open`. Only offered
   if the promise has not been stalled before.
3. `refuse`: govFavor.us −12, `state.flags.supplyChainRisk = true`, staffTrust +3,
   `status: 'refused'`.

Unanswered cards fall back to `stall` when it is offered, otherwise `refuse`.

**Leaks (D).** At the end of each turn, each open President promise whose `contradicts` names a
hard line the lab currently holds leaks with chance 0.15, at most once per promise
(`leaked: true`). A leak posts from `@leakwire` ("memo: lab promised the President it would …"
plus the promise text), and applies publicTrust −4 and staffTrust −6.

**Grudges (E).** When the second meeting opens:
- `grudges` = the texts of first-meeting promises with status `refused`, or still `open` past
  their due turn. `kept` = the count of first-meeting promises kept or delivered.
- Starting patience = `clamp(10 − 2 × grudges.length + kept, 4, 12)`.
- `state.meeting.grudges` holds the texts, so the UI can open with "You promised me …".
- If there is at least one grudge, the flattery threshold that queues the amendment demand
  drops from 4 to 2 for this meeting.

## 4. Weight theft (spec 6c; spec 4 "stolen weights push misuse up and lock it")

A `world` event row `weightTheft` (one-shot) in `sim/data/events.js`:

- **Trigger:** `state.capability >= 50 && state.security < 45 && rng.chance(0.2)`.
- **Warning:** `@your_security`: "someone is running odd queries against the weight store".
  Addressing it (the normal cheap `addressWarning`, 5 × era $M) also gives security +10.
- **Card if ignored:** "Weights stolen by a foreign state". Post from `@newsdesk`: "foreign
  intelligence reportedly copied a frontier lab's model weights". The theft happens whatever
  the player chooses: every choice first calls a named `stealWeights(state)`, which does
  misuseExposure +10 and locks it (`misuseLocked = max(misuseLocked, misuseExposure)`, as open
  weights do), and Qilin capability +5.
- **Choices:**
  - `report` "Report it to the government": govFavor.us +5, publicTrust −5, security +10.
  - `hunt` "Hunt the leak quietly": cash −30, security +15.
  - `silence` "Say nothing": `state.flags.coverUp = true`.
  - Fallback: `silence`.

## 5. Tasks

1. **Data and styles.**
   - Rewrite `sim/data/president.js` per sections 1–2.
   - Create `sim/data/promises.js` per section 3.
   - Apply `favor`, `patience`, `raceHeat` and `bargain` in `runMeeting`.
   - Tests:
     - the answer mix (five answers each; plain, flatter and jargon in every exchange; each other style exactly twice);
     - each extra field's effect;
     - the bargain tier-up, and no tier-up on a walkout.
   - Update the balance bots only as far as needed: speed takes the highest flattery, safety and balanced take plain, random takes a random answer.
2. **Promises A and B.**
   - Promise records, due checks, the `promiseCall` card kind and its three choices, and the fallback.
   - Tests:
     - a kept promise, per check type;
     - a failed promise producing a card;
     - deliver, stall (once only) and refuse;
     - the fallback;
     - the card deferred by the cap;
     - plan 2C-style entries without `source: 'president'` being ignored.
3. **Leaks D and grudges E.**
   - Tests:
     - leak chance and the once-only rule;
     - no leak without the contradicting line;
     - grudge patience and the lowered demand threshold;
     - `meeting.grudges`.
4. **Weight theft.**
   - Tests:
     - trigger conditions;
     - warning, then card;
     - addressing the warning raises security;
     - `stealWeights` runs on every path, fallback included;
     - misuse is locked.
5. **Balance check.** `npm run balance`; both difficulty tests must still pass. If not, tune numbers only, and list old → new.

Commits: one per task, each gated on `npm test` exiting 0.
