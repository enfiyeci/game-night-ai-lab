# Model appeal: what makes a model popular and profitable

Lane `gn-model-appeal`, 2026-09-26. Owner-approved in the brainstorm the same day (answers quoted where they
decided something). Research behind the choices: `docs/research/model-appeal/` (README first) and
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
- **Lean or loaded:** a lean, cheap-to-serve model can hold every user a wave brings; a feature-stacked one may have
  to turn users away and starve the next training run of GPUs.

Hard constraints: no randomness (spec `2026-09-26-deterministic-endings-design.md`); every number that decides a
launch is shown on screen before and after the player commits.

## 2. Decisions taken in the brainstorm

| # | Question | Owner's pick |
|---|---|---|
| 1 | What "efficient" means | Cheap to serve (not capability per training compute) |
| 2 | Where the saving shows up | Through the GPUs the lab already has, made visible (no new cloud bill) |
| 3 | Product list | Five products replace the channels; science stays; open weights is not a product |
| 3b | Open weights | Removed from the game entirely ("yes") |
| 4 | When the product is chosen | When training starts, locked in |
| 5 | The era wave | A fixed historical wave per era, plus rival crowding (from the counterweights discussion) |
| 6 | Counterweights | Crowding, franchise, capacity, first mover, receipt ("whatever you recommend"); scrutiny left out |
| 7 | Features | The design as presented: existing cards count as features, plus two release feature slots |

## 3. Products

A new data file `sim/data/products.js` holds the five products. Each model carries `product` from training start
to retirement. The old `channel` field stays on the model, derived from the product, so code that reads it keeps
working (the privacy constitution line, feed reactions, history, finance).

| Product (`id`) | Opens | Launch users (base) | $ per user per month | Tokens per user (× consumer) | Legacy `channel` |
|---|---|---|---|---|---|
| Chat app (`chat`) | era 1 | 4,000,000 | 5 | 1 | consumer |
| Business assistant (`business`) | era 1 | 500,000 | 30 | 4 | enterprise |
| Coding tool (`coding`) | era 2 | 1,000,000 | 20 | 8 | enterprise |
| Autonomous agent (`agent`) | era 3 | 50,000 | 200 | 20 | agent |
| Science partner (`science`) | era 4 | 5,000 | 2,000 | 40 | enterprise |

Starting points only; the bot runs (section 11) size them. The table replaces `USERS_BASE` (`sim/release.js`) and the
`CHANNEL` and `REVENUE_PER_USER` tables (`sim/serving.js`) as the source of these numbers. A science partner launch
also gives `govFavor.us +2`. The era price growth that lane `gn-model-money` adds (`ERA_PRICE`, stamped on a model
at launch) multiplies the per-user price unchanged.

**Picking.** The recipe screen asks for the product first; the choice is stored on the run and on
`state.pendingModel` and cannot change afterwards. Only opened products are offered.

**Channel cards.** The release-stage `channel` group goes away: "API only", "Consumer app and API" and "Open
weights" are removed. "Staged: API first, app later" survives as an optional release card named "Staged rollout"
(+1 round wait, public trust +2, 0.8 × launch users). The agentic card no longer turns a model into an agent; the
product decides.

**Open weights leaves the game.** Remove the `channel-open` and `tamper` cards (both already hidden from the player),
the `spec.channel === 'open'` branch in `sim/release.js` (the `flags.openWeights` flag and the `misuseLocked` update
there), `openWeightsMx` on cards and in `sim/training.js`, and the open-weights branches in `ui/logic/release.js`,
`ui/logic/history.js`, `ui/screens/release.js` and `ui/screens/reveal.js`. `state.misuseLocked` itself stays: events
also raise it. Rival open-model events (Qilin-R1) stay as world news.

## 4. Fit: the skill floor

Each product lists the recipe signals it wants, with weights summing to 1. A signal is a picked card (or any card
from a group), a focus slider moved above its start split, a model size, or reasoning capability. Fit is the sum of
the weights of the signals present, from 0 to 1.

Starting profiles (the plan may refine the exact card ids; the shape is fixed):

| Product | Wanted signals (weight) |
|---|---|
| Chat app | character card: spec-light, refusal-calibration or character (0.25); feedback card: rlhf, cai or thumbs (0.2); multimodal (0.2); Values focus above start (0.15); multilingual (0.1); any non-default safeguard (0.1) |
| Business assistant | long or million context (0.3); safety-tuning, unlearning or classifiers (0.2); full, third-party or government eval at release (0.2); Cleaning focus above start (0.1); a decontamination card (0.1); tool-sft (0.1) |
| Coding tool | rlvr-light or reasoning-rl (0.3); Math and code focus above start (0.2); tool-sft (0.2); a reasoning-readiness card (0.15); long context (0.15) |
| Autonomous agent | agentic-rl (0.35); reasoning-rl (0.2); tool-sft (0.15); long context (0.1); Red-teaming focus above start (0.1); any non-default safeguard (0.1) |
| Science partner | reasoning-rl or raw-rl (0.25); expert-prefs or rubric (0.2); reasoning-ready-full (0.15); size large or xl (0.2); a decontamination card (0.1); long context (0.1) |

**Effects.** Press: each critic's base score gains `(fit − 0.5) × 4` (so ±2). Launch users: × `(0.6 + 0.8 × fit)`
(0.6 to 1.4).

**Shown.** On the recipe screen, a fit meter updates as the player picks, and lists the missing signals in plain words
("no reasoning training yet"). Fit is the lookup-table part the research warns gets solved; that is fine, because it
is the floor, not the decision.

## 5. Features

**Training features** are existing cards the user can see: multimodal, long context, million context, reasoning
(reasoning-rl and the reasoning effort picked at release), tool-sft, multilingual, classifiers. They count through
fit (section 4) and already raise serving cost through the model spec.

**Release features** are new: two slots on the release screen. Each has an opening era, a cash cost, a serving cost
multiplier (on the model's serving cost per user) and an appeal value per product (1 wanted, 0.5 useful, 0 not).

| Feature | Era | Cash | Serving × | Chat | Business | Coding | Agent | Science |
|---|---|---|---|---|---|---|---|---|
| Web search | 2 | $5M | 1.1 | 1 | 1 | 0.5 | 0.5 | 0.5 |
| Voice | 3 | $10M | 1.3 | 1 | 0 | 0 | 0 | 0 |
| Memory | 3 | $5M | 1.15 | 1 | 0.5 | 0 | 0.5 | 0 |
| Computer use | 4 | $20M | 1.4 | 0 | 0.5 | 0.5 | 1 | 0 |
| Deep research | 4 | $10M | 1.5 | 0 | 1 | 0.5 | 0 | 1 |

A release feature adds `0.1 × appeal` to fit (fit still caps at 1). An unwanted feature adds nothing but its cost,
so "take every feature" is never automatically right. Computer use also adds misuse exposure +2.

## 6. The era wave

One hot product per era: era 1 chat app, era 2 coding tool, era 3 autonomous agent, era 4 science partner, era 5
autonomous agent (the owner accepted this default). The next era's wave is announced in the feed and marked on the
product picker from the last round of the era before.

**Effect.** A launch into the wave product gets × 1.3 launch users and +1 on every critic's score, both scaled by
crowding (section 7): the bonus is `0.3 × crowding` on users and `crowding` critic points.

## 7. Crowding

`crowding(product)` counts the rival labs currently live in that product and looks up a multiplier:
0 rivals 1.0, 1 rival 0.8, 2 rivals 0.65, 3 rivals 0.55, 4 rivals 0.5.

It multiplies a launch's users and wave bonus, and every round it multiplies the growth rate of the player's live
models in that product (`growUsers` in `sim/economy.js`), so a product crowds and recovers as rivals come and go.

**Rival products.** Each rival carries `product`: the product of its latest release, chosen by a fixed rule:

| Rival | Rule |
|---|---|
| OpenBrain (fast, least careful) | the era's wave product |
| Lodestar (careful) | business assistant; science partner once open |
| DeepThink (balanced) | science partner once open, else coding tool once open, else chat app |
| Qilin (eastern) | chat app; coding tool from era 3 |

With these rules the landscape shifts each era (era 1: chat crowded, business nearly empty; era 3: chat empty, agent
led by OpenBrain alone; era 4: science crowded, agent empty). No random draw is involved; when a rival releases is set
by the rival pace code, which the deterministic-endings plan makes deterministic.

**Shown.** The product picker shows, per product, the rivals live in it and each rival's next product by rule.

## 8. Franchise

Users carry over within a product line: `activateReleases` (`sim/release.js`) matches the previous model by
`product` instead of `channel`. A new product starts at its launch users only.

A same-line release grows the line only if it is better. Today the new model takes `max(fresh, carried)`. New rule:
users = `carried + fresh × improvement`, where `improvement = clamp((pressAvg − previous line model's pressAvg) / 3,
0, 1)`. The line's user cap (today 4 × launch users) rises to 4 × the new launch only when improvement is above 0.
The critics already score beating your own last flagship; this makes it matter for users too.

## 9. Capacity and efficiency

The existing outage rule stays (`applySplitEffects` in `sim/split.js`: users lost in proportion to the serving
shortfall, public trust −2, unless spot cover is on). Added:
- **No growth while short.** In a round with a serving shortfall and no spot cover, live models do not grow.
- **Forecast.** The release screen shows the serving room left (`online − control − safety − current serving`), the
  new model's GPUs per million users at launch, and "can serve about X of the Y expected users".
- **Turned away.** The release receipt and each model's row on the finance page show users turned away.
- **Cost per user.** Each model shows its serving cost per user (the GPU cost that lane `gn-model-money` already
  bills to each model), and critics' quips include a "cheap to run" line when cost per user is in the lowest third of
  the lab's live models.

Serving cost multipliers from release features (section 5) multiply `servingCost` in `sim/serving.js` through a new
`spec.features` list.

## 10. First mover and polish

**First mover.** `state.firsts = { products: {}, features: {} }` records who shipped each product and each release
feature first (lab ids; labs that ship in the same round share it). Perks:
- first in a product: that lab's line gets × 1.1 launch users and × 1.1 growth for the rest of the game;
- first with a release feature: that feature's serving multiplier is reduced by a quarter of its excess
  (1.4 → 1.3) for that lab.

Rivals claim products when they release. Rivals claim features on a fixed schedule in the product data, shown on
the release screen so the race is visible. Starting schedule (round = round within the era): web search, OpenBrain,
era 2 round 3; voice, OpenBrain, era 3 round 2; memory, DeepThink, era 3 round 4; computer use, Lodestar, era 4
round 2; deep research, DeepThink, era 4 round 1.

**Polish.** Lane `gn-keep-training` supplies `state.pendingModel.polish`, proposed range 0 to 1, absent means 0.
Each critic's base score gains `polish × 2`. The field name and range must be agreed with that lane before either
builds.

## 11. Critics, the receipt and the forecast

**Critic score** becomes `7 + (capAvg − bar) / 3 + (capAvg − rivalAvg) / 6 + (fit − 0.5) × 4 + wave points +
polish × 2 + critic bias`, clamped 1 to 10 (today's formula in `sim/launch.js` `scoreLaunch`, plus the new terms; the
deterministic-endings plan removes the `rng.int(-1, 1)` noise). Critics name the product and what missed: the
lowest-weight missing fit signal becomes the "weak" half of a quip ("a great coding tool, weak on long documents").

**Receipt.** `releaseModel` stores `model.appeal = { fit, missing, wave, crowding, franchise, first, features,
polish, turnedAway }`, each with its number. The release reveal lists them one line each, with the formula on hover
or tap.

**Forecast.** Once a product is picked, the recipe screen shows the same lines as a forecast from the current state
(fit, wave, crowding, franchise, first-mover status).

## 12. Code layout

- New `sim/data/products.js`: products, fit profiles, release features, wave per era, rival rules, rival feature
  dates, crowding table.
- New `sim/appeal.js`: pure functions `fitScore(state, recipe, product)`, `missingSignals`, `crowding(state,
  product)`, `rivalProduct(state, rival)`, `appealBreakdown(state, model)`, `claimFirsts(state, lab, product,
  features)`. No state changes except `claimFirsts`.
- Changed: `sim/recipe.js` and `sim/training.js` (product on the run and pending model; remove `openWeightsMx`),
  `sim/release.js` (product, users formula, franchise, features, firsts, receipt; remove open weights),
  `sim/launch.js` (new press terms and quips), `sim/serving.js` and `sim/economy.js` (per-product tables, feature
  multipliers, crowded growth, no growth while short), `sim/rivals.js` (rival product, firsts), `sim/data/cards.js`
  (channel group removed, Staged rollout kept, open and tamper removed).
- Screens (load the `design` skill first; owner sees a rendered mockup before it ships): recipe screen (product
  picker with wave mark and rivals, fit meter, forecast), release screen (feature slots, capacity forecast), reveal
  (receipt), finance "Each model" rows (turned away, cost per user).

## 13. Testing and balance

- Unit tests per rule in `tests/appeal.test.js` and the existing release, launch, economy and rivals tests: fit
  scoring per profile, crowding lookup and recovery, rival product rules per era, franchise improvement, no growth
  while short, firsts with same-round ties, feature serving multipliers, open weights gone.
- `npm test` fully green.
- Balance (memory rule: new mechanics get before and after bot runs, sized to match existing effects): add five
  fixed-strategy bots to `tools/balance.js`: always the wave, never the wave, one loyal line, every feature, lean
  (no release features, efficient spec). Record before and after runs of `node tools/balance.js 200`. **Pass
  condition:** each strategy wins (best final valuation) in some share of runs, and no strategy wins more than half.

## 14. Coordination and build order

| Lane / plan | Overlap | Rule |
|---|---|---|
| `gn-model-money` (Mac mini, branch `model-money`) | `sim/serving.js`, `sim/economy.js`, `sim/release.js`, `sim/training.js` | Build on top of it once it is in `ui`; agree that product tables replace its channel keys |
| `gn-benchmarks` (Mac mini, branch `benchmarks-by-era`) | `sim/launch.js`, `sim/data/launch.js`, `sim/release.js` | Build after it lands in `ui` |
| Deterministic-endings plan (branch `deterministic-endings`) | Task A5 removes launch noise; A10 edits `sim/release.js`; Part B makes rival pace deterministic | This design assumes those are in; build after A5 and A10 |
| `gn-keep-training` (MacBook) | `state.pendingModel.polish` | Agree name and range first |
| `gn-compute-race` | `sim/rivals.js` | Rival product is a new field; no change to its catch-up rule |

Build order: sim rules and tests first, then the balance bots and retune, then the screens.

## 15. Out of scope

- Scrutiny meter (Plague Inc idea): the existing safety meters already react to agentic training.
- Player-set prices beyond today's four price stances; rival prices.
- Rival features beyond their fixed first-claim dates.
- Randomness of any kind.
