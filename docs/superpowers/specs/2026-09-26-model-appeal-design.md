# Model appeal: what makes a model popular and profitable

Lane `gn-model-appeal`, 2026-09-26. Owner-approved in the brainstorm the same day, then revised after two conflict
audits the owner asked for ("make sure it doesn't conflict with existing game dynamics"); section 16 records every
audit finding and what changed. Research behind the choices: `docs/research/model-appeal/` (README first) and
`docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`.

## 1. Goal

A model's success follows from making the right things, not luck. The owner (2026-09-27 handoff): success should be
"based on how good how polished the model is, and yes which features were added and also ... how efficient it is",
and "this means we have to give more options". Asked mid-brainstorm: "if each era has something and the user just
chooses that, how much of that is really choice or game dynamic?" The answer this design gives: **fit is a skill
floor, and the choice comes from what the rivals are building and what the player already owns.**

Two dilemmas carry the design:
- **Franchise or wave:** keep feeding the product line whose users you already have, or bet on the era's hot product
  and start that line from zero.
- **Lean or loaded:** a lean, cheap-to-serve model can hold every user a wave brings; a feature-stacked one may lose
  users to outages and starve the next training run of GPUs.

Hard constraints: no randomness (spec `2026-09-26-deterministic-endings-design.md`); every number that decides a
launch is shown on screen before and after the player commits.

**One separation keeps the numbers from counting twice.** The critics judge the *model*: capability and polish. The
market judges the *product*: fit, wave, crowding, franchise, first mover, features. Critics' scores reach users only
through today's existing press-quality multiplier; product terms reach users directly and never touch critic scores.

## 2. Decisions taken in the brainstorm

| # | Question | Owner's pick |
|---|---|---|
| 1 | What "efficient" means | Cheap to serve (not capability per training compute) |
| 2 | Where the saving shows up | Through the GPUs the lab already has, made visible (no new cloud bill) |
| 3 | Product list | Five products replace the channels; science stays; open weights is not a product |
| 3b | Open weights | Removed from the game entirely |
| 4 | When the product is chosen | When training starts, locked in |
| 5 | The era wave | A fixed historical wave per era, plus rival crowding |
| 6 | Counterweights | Crowding, franchise, capacity, first mover, receipt ("whatever you recommend"); scrutiny left out |
| 7 | Features | Existing cards count as features, plus release feature slots |

## 3. Products

A new data file `sim/data/products.js` holds the five products. Each model carries `product` from training start
to retirement, and `spec.product` too (serving cost reads only the spec).

| Product (`id`) | Pickable from | Launch users (base) | $ per user per month | Tokens per user (× chat) | Legacy `channel` |
|---|---|---|---|---|---|
| Chat app (`chat`) | start | 4,000,000 | 5 | 1 | consumer |
| Business assistant (`business`) | start | 500,000 | 30 | 4 | enterprise |
| Coding tool (`coding`) | era 1, last round | 500,000 | 40 | 6 | enterprise |
| Autonomous agent (`agent`) | era 2, last round | 50,000 | 400 | 20 | agent |
| Science partner (`science`) | era 3, last round | 5,000 | 4,000 | 40 | enterprise |

Chat and business keep today's consumer and enterprise numbers, so the default paths play as before. The three new
products are sized to the same base revenue as chat (about $20M a month) and differ in GPU load, user count and risk.
Starting points; the bot runs (section 13) size them. A product becomes pickable in the round its wave is announced
(section 6), so the announcement can be acted on. A science partner launch also gives `govFavor.us +2`.

**Every price and token reader switches from channel to product:** `revenuePerUser` (`sim/economy.js`, keeping
`gn-model-money`'s `× model.eraPrice`), `servingCost` tokens (`sim/serving.js`), and `tokensPerUser`,
`pricePerMillion`, `priceSheet` and `salesEstimate` (`ui/logic/release.js`). `USERS_BASE`, `CHANNEL` and
`REVENUE_PER_USER` stop being the source. A model without `product` (old saves, tests) falls back: consumer → chat,
enterprise → business, agent → agent.

**The legacy `channel` field** stays on the model, set from the product in `releaseModel` before scoring and serving,
for code that still reads it. Readers that would misfire are changed:
- The privacy constitution line (`sim/release.js`, text in `sim/data/constitution.js`) applies to the business
  assistant only; its effect text changes to match. Coordinate with `gn-constitution`, which owns that text.
- Labels show the product name, not the channel: finance "Each model" and users line (`ui/screens/finance.js`,
  `ui/logic/money.js`), history (`ui/logic/history.js`), the reveal margin line (`ui/screens/reveal.js`), the
  release screen's `CHANNEL_NAMES` and policy advisor lines (`ui/logic/release.js` `POLICY_LINES`, now keyed by
  product).
- Feed reception pools (`sim/feed.js`, `sim/feedLive.js`, `sim/data/feed.js`): the coding tool takes today's `agent`
  pool (bugs and repositories); the agent and science products get small new pools.
- `releaseSpec` in `ui/logic/release.js` drops its copy of the enterprise-plus-agentic rule.

Consumer-only events (citations, companion, the 5M-users demand event, unhinged, country ban, hate meltdown, state
lawsuits, jailbreak scandals) now fall only on chat products. That is intended: a chat line is the most exposed.

**Picking.** The product is part of the recipe (`recipe.product`), validated in `validateRecipe` (known and
pickable), kept by `sanitizeDraft` (`ui/logic/actions.js`), stored on the run, and copied onto `state.pendingModel`
in `resolveRun` together with the training-time fit and missing signals (the recipe is gone by release time). It
cannot change afterwards.

**Release cards.** The release-stage `channel` group goes away ("API only", "Consumer app and API", "Open weights").
The release stage drops from 2 card slots to 1 (plus 1 with talent spend), so removing the channel card does not
quietly free a slot for precision or evals. "Staged: API first, app later" survives as "Staged rollout" (+1 round
wait, public trust +2, 0.8 × launch users; `releaseModel` gains a read of release-card `usersMult` for this).

**Open weights leaves the game.** Remove: the `channel-open` and `tamper` cards; the `spec.channel === 'open'`
branch in `sim/release.js` (keeping the `no-wmd` misuse −4 for other releases); `openWeightsMx` on cards and in
`sim/training.js`; `USERS_BASE.open`; `channel !== 'open'` in `activeModels` (`sim/serving.js`) and `liveModels`
(`sim/data/events6c.js`); the `channels.open` feed pool; `CHANNEL_NAMES.open`, `HISTORY_CHANNEL_WORDS.open`,
`statusWords.open` and the open branches in `ui/logic/release.js`, `ui/logic/history.js`, `ui/screens/history.js`,
`ui/screens/release.js`, `ui/screens/reveal.js`; the recipe group label `channel: 'Who gets it'`
(`ui/screens/recipe.js`); after `gn-model-money` lands, the `'open'` status in `ui/logic/modelMoney.js` and
`ui/screens/modelMoney.js`; and the open-weights tests (`tests/release.test.js`, `tests/constitution.test.js`,
`tests/ui-release.test.js`, `tests/training.test.js`). `state.misuseLocked` stays (weight theft raises it); nothing
else reads `flags.openWeights`. Rival open-model events (Qilin-R1) stay as world news. The deterministic-endings
spec's misuse route "open weights at high capability" goes away; tell `gn-newplayer`.

## 4. Fit: the skill floor

Each product lists the recipe signals it wants, with weights. A signal is a picked card (or any card from a group),
a focus slider at least 10 points of share above its start split (absent focus earns nothing), a model size, or
reasoning capability.

**Fit = weight of signals present ÷ weight of signals achievable this era**, from 0 to 1. "Achievable" counts a
signal only if its card is unlocked (era, tech, a previous model) and its stage is open this era. So a perfect era-1
chat recipe scores 1.0 even though character cards open later. Slot limits are not counted: a science recipe that
wants three mid-stage cards needs the talent slot, which is intended.

| Product | Wanted signals (weight) |
|---|---|
| Chat app | a character-group card (0.25); a feedback card other than thumbs-up (0.2); multimodal (0.2); Values focus (0.15); multilingual (0.1); a non-default safeguard (0.1) |
| Business assistant | long or million context (0.3); safety-tuning, unlearning or classifiers (0.2); full, third-party or government eval at release (0.2); Cleaning focus (0.1); a decontamination card (0.1); tool-sft (0.1) |
| Coding tool | rlvr-light or reasoning-rl (0.3); Math and code focus (0.2); tool-sft (0.2); a reasoning-readiness card (0.15); long context (0.15) |
| Autonomous agent | agentic-rl (0.35); a reasoning-readiness card (0.2); tool-sft (0.15); long context (0.1); Red-teaming focus (0.1); a non-default safeguard (0.1) |
| Science partner | reasoning-rl or raw-rl (0.25); expert-prefs or rubric (0.2); reasoning-ready-full (0.15); size large or xl (0.2); a decontamination card (0.1); long context (0.1) |

"A character-group card" follows whatever that group holds (the constitution lane replaces `spec-light` with
`constitution`; a run refused for an invalid constitution draft earns nothing). The agent profile avoids asking for
two cards from the one-pick `rl` group. The eval signal is scored at release, when the eval card is picked.

**Effect: users only.** Launch users × `(0.7 + 0.6 × fit)` (0.7 to 1.3). Fit does not change critic scores.

**Cards that were user bonuses become fit.** `multimodal` (×1.05), `multilingual` (×1.1) and `refusal-calibration`
(×1.03) lose their `usersMult`, and the Long-documents focus loses its `usersMult` term (`sim/recipe.js`), because fit
now rewards them for the products that want them. `thumbs` keeps its ×1.15 (it is the sycophancy trap, and
`gn-keep-training` removes it when sycophancy is fixed) and is not a fit signal.

**Shown.** On the recipe screen, a fit meter updates as the player picks and lists the missing signals in plain
words ("no reasoning training yet"). In code the value is `productFit`, stored as `model.appeal.fit` (benchmarks
already use a local `fit`).

## 5. Features

**Training features** are existing cards the user can see (multimodal, long and million context, reasoning,
tool-sft, multilingual, classifiers). They count through fit and already raise serving cost through the spec.

**Release features** are new: two feature slots on the release screen, separate from the release card slot. Each
has an opening era, a cash cost, a serving multiplier and an appeal value per product (1 wanted, 0.5 useful, 0 not).

| Feature | Era | Cash | Serving × | Chat | Business | Coding | Agent | Science |
|---|---|---|---|---|---|---|---|---|
| Web search | 2 | $5M | 1.1 | 1 | 1 | 0.5 | 0.5 | 0.5 |
| Voice | 2 | $10M | 1.3 | 1 | 0 | 0 | 0 | 0 |
| Memory | 3 | $5M | 1.15 | 1 | 0.5 | 0 | 0.5 | 0 |
| Computer use | 4 | $20M | 1.4 | 0 | 0.5 | 0.5 | 1 | 0 |
| Deep research | 4 | $10M | 1.5 | 0 | 1 | 0.5 | 0 | 1 |

Voice opens in era 2, not 3 as first presented, because the existing era-2 real event about a voice that sounds
like an actress (`voiceLikeness`, `sim/data/realEvents.js`) needs it; that event now fires only on a live model with
the voice feature.

A release feature adds `0.1 × appeal` to fit (capped at 1). An unwanted feature adds only its cost. The serving
multipliers, with any first-mover reduction already applied, are stored in `spec.features` at release, and
`servingCost` multiplies them in. Computer use also adds misuse exposure +2.

## 6. The era wave

One hot product per era: era 1 chat app, era 2 coding tool, era 3 autonomous agent, era 4 science partner, era 5
autonomous agent. The next era's wave is announced in the feed and on the product picker in the last round of the era
before, and that product becomes pickable then.

**Effect: the wave is a bigger market.** The wave product's launch users × 1.6. Crowding (section 7) then shrinks it
once, like any product. It does not change critic scores. Worked through with the rival rules below (base revenue
$20M a month, before fit and franchise):

| Era | Wave: rivals in it → market | Best other product → market |
|---|---|---|
| 1 | chat: 3 → 1.6 × 0.55 = 0.88 | business: 1 → 0.8 (and a lower base) |
| 2 | coding: 2 → 1.6 × 0.65 = 1.04 | chat or business: 1 → 0.8 |
| 3 | agent: 1 → 1.6 × 0.8 = 1.28 | chat: 0 → 1.0 |
| 4 | science: 3 → 1.6 × 0.55 = 0.88 | agent or chat: 0 → 1.0 |
| 5 | agent: 1 → 1.28 | chat or business: 0 → 1.0 |

So the wave wins in eras 2, 3 and 5, loses to an empty product in era 4, and a franchise's carried users can beat it
in any era. That is the dilemma the audit found missing from the first draft.

## 7. Crowding

`crowding(product)` counts the rivals present in that product: 0 rivals 1.0, 1 rival 0.8, 2 rivals 0.65, 3 rivals
0.55, 4 rivals 0.5. It multiplies a launch's users once, and the daily growth rate of the player's live models in
that product (`growUsers`, `sim/economy.js`), so a product crowds and recovers as rivals move.

**Rival products follow the era rule from each era's first round** (not from their next release, which could be
three rounds late). Each rival carries `product`, set at game start and at every era change:

| Rival | Rule |
|---|---|
| OpenBrain (fast, least careful) | the era's wave product |
| Lodestar (careful) | business assistant; science partner from era 4 |
| DeepThink (balanced) | science partner from era 4, else coding tool from era 2, else chat app |
| Qilin (eastern) | chat app; coding tool from era 3 |

No random draw is involved. The product picker shows, per product, the rivals in it and where each rival goes next
era.

## 8. Franchise

Users carry over within a product line: `activateReleases` (`sim/release.js`) matches the previous model by
`product` instead of `channel`. A new product starts at its launch users only.

**A same-line release grows the line only if the model is better.** `improvement = clamp((launch.capAvg − previous
line model's capAvg) / 10, 0, 1)`, measured on capability (critic scores include things unrelated to the line). New
users = `carried + fresh × improvement`. The line's cap = `max(previous line cap, users, 4 × fresh if improvement >
0)`, set in `activateReleases`, replacing today's `max(userCap, users × 4)`, so a line is never cut on its first day.
This is more generous than today's `max(fresh, carried)`; the bot runs check serving load.

**Holding a release** (`holdRelease`, used by the red-team delay) hands the old model back only its own recorded
users (`model.replaced[].users`); the fresh share is computed once, when the release relaunches.

## 9. Capacity and efficiency

The existing outage rule stays (`applySplitEffects`, `sim/split.js`: at each round mark, users lost in proportion to
the serving shortfall, public trust −2, unless spot cover is on). Added:
- **Growth scales with the served share.** Each day, live models grow at their rate × `serving ÷ need` (1 when
  there is no shortfall). A player who caps serving on purpose (`servingCap`) slows growth on purpose; the compute
  screen says so. The finance planner's copy of `growUsers` (`ui/logic/finance.js`) mirrors this, crowding and the
  first-mover bonus.
- **Lost to outages.** `applySplitEffects` records each model's users lost (`model.lostToOutage`, cumulative). The
  finance "Each model" row shows it.
- **Forecast.** The release screen shows two numbers of serving room: before the active training run pauses
  (training slice − run units) and in total (`min(servingCap, online − control − safety) − need`), plus the new
  model's GPUs per million users at launch, and "can serve about X of the Y expected users".
- **Cost per user.** Computed at release from the release spec at light load (`servingCost(spec, era, 0)`, feature
  multipliers included). The critics add a "cheap to run" line when the model's serving cost per revenue dollar is in
  the lowest third of the lab's live models (per revenue dollar, so products with different prices compare fairly).
  The finance row can also show the billed figure `servingSpent ÷ (users × monthsOnSale)` from `gn-model-money`'s
  books.

## 10. First mover and polish

**First mover.** `state.firsts = { products: {}, features: {} }` (added to `createInitialState`) records who first
went live in each product and with each release feature (lab ids; labs that go live in the same round, by turn index,
share it). Claims happen at go-live: the player's in `activateReleases` (a held release claims nothing until it
relaunches), a rival's in `landRivals` when its launch lands, for the rival's current product. Perks:
- first in a product: that lab's line gets × 1.1 launch users and × 1.1 growth for the rest of the game;
- first with a release feature: that feature's serving multiplier loses a quarter of its excess (1.4 → 1.3) for that
  lab.

Because rivals claim a product only when a launch actually lands, the player has a window: a product becomes pickable
a round before its era, and OpenBrain lands its first launch in the new product one or two rounds into the era.

Rivals claim features on a fixed schedule in the product data, shown on the release screen (rounds counted from 1
within the era; code uses the 0-based `turnInEra`): web search, OpenBrain, era 2 round 3; voice, OpenBrain, era 2
round 4; memory, DeepThink, era 3 round 4; computer use, Lodestar, era 4 round 2; deep research, DeepThink, era 4
round 1.

**Polish.** Lane `gn-keep-training` supplies `state.pendingModel.polish`, a number from 0 to 100 (unrounded; absent
means 0), and `pendingModel.fixedFlaws` (`[{ flag, day }]` for jailbreakWaiting, hallucination or sycophancy), both
copied onto the released model (agreed 2026-09-27; its spec `2026-09-26-keep-polishing-publish-design.md` section 6).
Each critic's base score gains `polish / 50` (up to +2); that lane ships this term first as a stand-in in
`scoreLaunch`, and this design keeps it and owns its tuning. Watch it in the bot runs: a +2 on every critic pushes
scores toward the cap of 10, which the `bigClaim` President promise (press ≥ 8) and sentiment also read.

## 11. Critics, the receipt and the forecast

**Critic scores** keep today's formula (`scoreLaunch`, `sim/launch.js`: capability against the bar and the rivals,
plus each critic's bias) plus polish, and nothing else from this design. The deterministic-endings plan removes the
noise. Critics' quips name the product and what missed: the heaviest missing fit signal becomes the "weak" half
("a great coding tool, weak on long documents").

**Receipt.** `releaseModel` stores `model.appeal = { fit, missing, features }`; `activateReleases` adds the market
terms at go-live: `wave`, `crowding`, `franchise` (carried, improvement), `first`. The reveal lists each line with
its number; each opens its formula on hover or tap.

**When each term is read.** Fit, features and critic scores at the release move. Wave, crowding and first mover at
go-live, because a release can wait rounds (tester wait from era 3, staged rollout, polish) and may go live in the
next era. The release screen's forecast shows the terms as they would be if the model went live at its expected
go-live round.

**Forecast.** Once a product is picked, the recipe screen shows the same lines as a forecast from the current state.

## 12. Agent risks

The risk rules stay on the training choice and add the product:
- The misalignment check (`sim/release.js`) runs when the model has the `agentic` flag **or** is an autonomous agent
  product. Shipping agents is the risk the deterministic-endings spec's scenario names; coordinate with its Task A10,
  which edits that line.
- The autonomy-grab and agent-surge events, the hackable-recipe hazard, PitchCrunch's +1 bias and the agent-shaped
  benchmark fits stay on the `agentic` flag (they describe the training).

## 13. Code layout, testing and balance

**New:** `sim/data/products.js` (products, fit profiles, release features, waves, rival rules, rival feature dates,
crowding table) and `sim/appeal.js` (pure functions `productFit`, `missingSignals`, `crowding`, `rivalProduct`,
`marketTerms`; `claimFirsts` is the only one that changes state).

**Changed:** `sim/recipe.js` (product on the recipe, fit, focus usersMult removed), `sim/training.js` (product, fit
and missing onto the pending model; `openWeightsMx` removed), `sim/release.js` (product, users, franchise, features,
receipt, agent risk, open weights removed), `sim/launch.js` (quips), `sim/serving.js` and `sim/economy.js`
(product tables, feature multipliers, crowded and served-share growth), `sim/split.js` (lost to outages),
`sim/rivals.js` (rival product, firsts in `landRivals`), `sim/state.js` (`firsts`), `sim/data/cards.js` (channel group
and open cards removed, Staged rollout, release slots 1), `ui/logic/actions.js` (`sanitizeDraft`), the UI readers in
section 3, and the screens: recipe (product picker with wave mark and rivals, fit meter, forecast), release (feature
slots, capacity forecast), reveal (receipt), finance rows. Screens load the `design` skill first, and the owner sees
a rendered mockup before they ship.

**Tests:** `tests/appeal.test.js` plus the existing release, launch, economy, split and rivals tests: fit per profile
and per era, crowding and recovery, rival products per era, franchise improvement and cap, hold and relaunch without
double counting, served-share growth, firsts with same-round ties and holds, feature multipliers, the fallback for
models without a product, open weights gone. `npm test` fully green.

**Balance** (memory rule: new mechanics get before and after bot runs, sized to match existing effects):
- Every existing bot, every `ui/logic/scenarios.js` script, `tests/helpers/policy.js` and `tools/demo-seeds.js` gets
  a product (and focus settings where its strategy implies them); otherwise all of them silently get the default.
  Demo seeds are expected to shift.
- Five new bots share the balanced bot's base and differ only in product and feature policy: always the wave, never
  the wave, one loyal line, every feature, lean. They are listed in `PROBES` in `tests/balance.test.js`, so the
  existing "no strategy wins more than 36%" test does not apply to them.
- `report()` records final valuation. **Pass condition:** on the same seeds, each of the five has the best final
  valuation in some share of runs, and none in more than half.
- Also measured: how often the player claims each product first, users at the serving limit, average press (for
  `bigClaim` and sentiment), and serving load against today.

## 14. Coordination and build order

| Lane / plan | Overlap | Rule |
|---|---|---|
| `gn-model-money` (branch `model-money`) | `sim/serving.js`, `sim/economy.js`, `sim/release.js`, `sim/training.js` (`startRun`), per-model books | Build on top of it once it is in `ui`; product tables replace its channel keys |
| `gn-benchmarks` (branch `benchmarks-by-era`) | `sim/launch.js`, `sim/data/launch.js`, `sim/release.js` | Build after it lands in `ui` |
| Deterministic-endings plan (branch `deterministic-endings`) | A5 removes launch noise; A10 edits the misalignment line; B1 and B3 make rival pace and the start state deterministic | Build after A5, A10, B1 and B3 |
| `gn-keep-training` | `pendingModel.polish` and `fixedFlaws`; polish stand-in in `scoreLaunch`; Publish timing | Agreed 2026-09-27; confirm Publish changes no post-training card picks, so fit locked at training start stays true |
| `gn-constitution` (branches `constitution-era3*`) | `sim/data/cards.js` (`spec-light` → `constitution`), `sim/training.js` `startRun`, privacy line text, `tools/balance.js` | Build after it lands; agree the privacy line text |
| `gn-capability-cap` (worktree `game-night-ai-lab-capability-cap`, uncommitted) | `sim/training.js`, `sim/release.js`, `sim/launch.js`, `sim/rivals.js` | Build after it lands |
| `gn-compute-race` | `sim/rivals.js` | Rival product is a new field; its catch-up rule is untouched |

Build order: sim rules and tests first, then the balance bots and retune, then the screens. `scoreLaunch` is edited by
four lanes; this design only adds quips there, after the others are reconciled in `ui`.

## 15. Out of scope

- Scrutiny meter (Plague Inc idea): the existing safety meters already react to agentic training.
- Player-set prices beyond today's four price stances; rival prices.
- Rival features beyond their fixed first-claim dates.
- Randomness of any kind.

## 16. Conflict audit record (2026-09-27)

Two read-only Opus audits: one against the code on `ui` (branch `model-appeal` at 5aa71a3), one against in-flight
branches. Both read the spec in full; their coverage statements note partial reads (some screens, feed data and test
files were grep-only; the keep-training spec itself was not reachable). Outcomes:

| Finding | Outcome |
|---|---|
| The wave could never beat an empty product (crowding applied twice; OpenBrain always in the wave) | Fixed: the wave is a × 1.6 market that crowding shrinks once (section 6 table) |
| Fit, wave and crowding counted two or three times; card user bonuses duplicated fit | Fixed: critics judge the model, the market judges the product (section 1); card `usersMult` for fit signals removed (section 4) |
| New press terms would push scores to 10 | Fixed: only polish reaches critics; its size is watched in bot runs (section 10) |
| Franchise cap could cut users on day one; press was the wrong "better"; hold could double count | Fixed (section 8) |
| Era gates kept era 1 fit below 0.5; agent profile wanted two cards from one group | Fixed: fit relative to the achievable weight; agent profile changed (section 4) |
| Wave announced before its product could be picked | Fixed: products pickable from the announcement round (sections 3, 6) |
| Rival products lagged a release behind the era | Fixed: era rule from each era's first round (section 7) |
| Pending model has no recipe for fit | Fixed: product, fit and missing copied at `resolveRun` (section 3) |
| Three products share channel `enterprise`; price, token and label readers misfire | Fixed: readers switch to product; labels and feed pools changed; fallback defined (section 3) |
| Agent risks keyed on the `agentic` flag only | Decided: misalignment also checks the agent product; the rest stay on the flag (section 12) |
| "No growth while short" did not match the daily clock and froze every line | Changed: growth scales with the served share (section 9) |
| "Turned away" had no mechanic | Changed: users lost to outages, tracked per model (section 9) |
| Removing the channel group freed a release slot | Fixed: release card slots 2 → 1 (section 3) |
| Coding unprofitable at $20 and 8× tokens | Fixed: coding $40 and 6× tokens; new products sized to chat's base revenue (section 3) |
| Rival and firsts timing, round numbering, `state.firsts` init | Fixed (sections 7, 10) |
| `spec-light` being deleted by the constitution lane | Fixed: "a character-group card" (section 4) |
| Voice event fires in era 2 | Fixed: Voice opens in era 2 and the event needs the feature (section 5) |
| Bots, scenarios and demo seeds silently lose their strategy | Fixed (section 13) |
| Build order missed B1, B3, constitution, capability-cap | Fixed (section 14) |
| "Cheap to run" compared across products and read too early | Fixed: per revenue dollar, at release (section 9) |
| Open-weights leftovers | Fixed: full list (section 3) |
| `fit` name collides with benchmarks-by-era | Fixed: `productFit` (section 4) |
| Consumer events now land only on chat | Accepted as intended (section 3) |
| First-mover claims predictable (Lodestar is slow) | Accepted; measured in bot runs (section 13) |
