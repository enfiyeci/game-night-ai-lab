# Compute gathering — design spec

**Date:** 2026-09-25 · **Owner:** Arda · **Status:** design approved in chat 2026-09-25
("sounds good"); awaiting owner review of this written spec.
**Extends:** `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` (the main spec),
replacing its "Compute market" bullet in section 6 and the compute parts of section 7.
**Research basis:** `docs/research/compute-mechanics/report.md` (read its ⚠️ flags; many real
figures are snippet-level). First-pass numbers below are design proposals for the balance bot
to tune, not facts.

## 1. What the player does with compute

Compute is gathered through **binding contracts**, then **split** each turn between training,
serving users and safety work. Era 3 adds an **allocation queue** for the chip titan's
supply, and era 4 adds **power sites** with a **power cap**. Every piece maps to a real
dynamic: take-or-pay contracts, prepaying for priority, equity strings, power as the binding
limit, and the unmet OpenAI safety-compute pledge.

Owner decisions (2026-09-25):

| Decision | Choice |
|---|---|
| Designs to build | Contract ladder (all eras) + compute split + power pipeline, plus a light allocation queue in era 3 only |
| Safety spending | Moves from the money budget into the compute split; the money budget keeps four slices |
| Era 4 power cap | Yes: chips run only up to available power; unpowered chips are still billed |
| Display | Units in eras 1–3; megawatts and gigawatts from era 4, units in small print |
| Gulf deal | Needs US favor above a threshold; revoked if favor drops later |
| Cut order if late | (1) era 3 queue, (2) grid reservation in eras 2–3, (3) resale of idle compute |

## 2. Scale and display

- **Unit.** 1 unit = 1,000 GPUs of the era's top chip, base price `BALANCE.unitMonthlyCost`
  = $1.46M per unit-month ($2 per GPU-hour, which equals an owner's all-in cost at 2026
  scale). Unchanged.
- **Era scale.** Real frontier fleets grow about 25-fold from GPT-4 to a gigawatt campus.
  `ERA_SCALE = [1, 3, 10, 50, 150]` (first pass) multiplies both **deal sizes** and
  **training-run unit costs** (`SIZE_UNITS × ERA_SCALE[era]`). A same-size model therefore
  costs more compute each era, as frontier compute grows 4–5x a year. Capability gain per
  run is unchanged, because it depends on model size, not on units.
- **Money scale.** At era 4 scale a frontier fleet costs over $1B a month. Cash must grow
  roughly 30–100 times across the game through revenue, funding rounds and site financing
  (section 6). This is a balance requirement for the balance pass (section 11b), not a new
  mechanic.
- **Display.** Eras 1–3 show units ("40 units"). From era 4, compute shows as power with
  1 unit = 1.7 MW (about 600 units per gigawatt): "850 MW", "1.4 GW", with units in small print.
  The sim always counts units.

## 3. Contract ladder (all eras)

### 3.1 Offers

The "Sign a compute deal" move (one move) opens the offers for the current era. Each offer
card shows five things: **size, arrival, upfront cost, monthly bill with term, and one
string**. Sizes below are `base × ERA_SCALE`; costs are multiples of the base unit price.

| Supplier (fictional) | Size (units × ERA_SCALE) | Arrival | Upfront | Price | Term | String | Eras |
|---|---|---|---|---|---|---|---|
| Verde, chip titan order | 10–20 | 3 turns (eras 1–2); via queue (era 3); 2 turns and needs power (era 4) | 12% of term value | 1.0x | 24 months | none | 1–4 |
| Azuria, cloud landlord | 8–15 | 1 turn | 0 | 1.1x | 24 months | **Exclusive** | 1–4 |
| CoreFlame, neocloud | 5–10 | 1 turn | 0 | 1.0x | 12 months | **Fragile** | 1–5 |
| Spot market | 2–5 | now | 0 | 2.0x (eras 1–2), 2.5x (era 3), 3.0x (era 4), 3.5x (era 5) | one turn, renewable | **Bumpable** | 1–5 |
| Azuria equity-for-compute | credits = 8% of valuation | 1 turn | 0 | 1.0x | 24 months | **Money comes back** | 2–4 |
| Gulf sovereign campus | 10–30 | 2 turns | 10% | 1.0x | 36 months | **US-gated** | 3–4 |
| Verde letter of intent | headline 20 | 2 turns, needs power | 5% of headline | 1.0x | 24 months | **Headline shrinks** | 4 |

Exact sizes within each range are rolled per offer from the seeded random number generator,
so the market differs between runs. Contracts signed in era 3 or later can simply run past
the end of the game.

### 3.2 Strings

- **Exclusive (Azuria).** While any Azuria contract runs, the player cannot sign CoreFlame or
  Gulf contracts. Chip titan orders are still allowed. Buyout: pay 3 months of the Azuria bill
  to remove the lock. Real model: Microsoft's right of first refusal on OpenAI compute until
  2025.
- **Fragile (CoreFlame).** Failure risk is 2% per month, converted to the era's turn length
  as `1 − (1 − p)^monthsPerTurn`. A failure does not happen silently: it arrives through the
  warning-then-card flow. The warning is a feed post ("CoreFlame's biggest customer misses a
  payment"). The next turn brings a card: move the capacity to spot (pay the spot price),
  prepay 3 months to keep CoreFlame alive (the contract survives), or let it go (the units
  vanish, no further bills).
- **Bumpable (spot).** In the era's bottleneck turns (the event deck marks them), spot
  capacity can be withdrawn with one turn's warning.
- **Money comes back (equity-for-compute).** Azuria invests credits worth 8% of valuation in
  exchange for 8% of the company. The credits can only pay Azuria bills. Every board member loses
  3 support, and one board member switches to favoring speed. This replaces the current
  `raiseRound('strategic')` compute clause. Real model: circular deals such as Microsoft–OpenAI
  and Google–Anthropic.
- **US-gated (Gulf).** The offer appears only while `govFavor.us ≥ 60`. Signing costs 2 public
  trust. If US favor later drops below 50, the export license is revoked: the Gulf units go
  dark (no compute) and billing pauses until favor recovers to 60. This replaces the current
  Gulf entry that lowers US favor.
- **Headline shrinks (letter of intent).** On arrival, the delivered size is the headline ×
  a roll between 0.3 and 1.0. The monthly bill follows the delivered size. Real model:
  NVIDIA's "up to $100B" OpenAI letter of intent that closed at a reported $30B ⚠️.

### 3.3 Billing and commitments

- Every contract bills `units × price × unitMonthlyCost` each month from arrival until its
  term ends, **whether the compute is used or not** (take-or-pay). Upfront payments are paid
  at signing. Credits from equity-for-compute pay Azuria bills first.
- A **commitments strip** lists every contract (supplier, units, monthly bill, months left)
  and the total monthly bill, next to the CFO's runway readings.
- **Scale down** (free action, once per contract): cut 30% of the contract's units and its
  remaining bill. Penalty: 2 months of the removed part's bill, and that supplier's next
  offer arrives one turn later. Real model: the Abilene expansion cut and Microsoft's 2 GW
  walk-back.
- **Break** (free action): the contract ends now. Penalty: the upfront payment is lost and 25%
  of the remaining term value is paid at once.
- Burn projection (`projectBurn`) includes contract bills, spot charges and the pipeline's
  arriving bills, as today.

## 4. Era 3 allocation queue (light)

Era 3's bottleneck is wafers and HBM memory, so Verde's orders go through a queue in era 3
only. Everything else in section 3 works as usual.

- Each era 3 turn Verde releases `R = 15 × ERA_SCALE[3]` units (first pass: 150).
- Each Western rival places an order of `(2 + 4 × speed) × ERA_SCALE[3]` units. Rivals with
  speed ≥ 0.7 prepay. Qilin, the Eastern lab, cannot buy from Verde (export controls).
- The player places an order (a size) and picks a tier:
  - **Prepaid:** pay 15% of the order's 24-month term value upfront. Prepaid orders are filled
    first, pro rata if they exceed `R`.
  - **Standard:** no upfront payment. Standard orders share what is left, pro rata.
- Filled units arrive next turn as a normal Verde contract. The unfilled part stays in the
  queue at the same tier for the next turn. The player can withdraw it without penalty.
- The panel shows each lab's tier and order. A rival switching to prepaid is announced one
  turn ahead. Ordering more than needed to squeeze a rival (a spite order) is allowed, but the
  player pays for everything delivered. Every prepaid player order raises race heat by 2.
- Head of Research line when the player is short: "We're in the standard tier. <rival> gets
  served before us."
- Cut first if the build runs late: without the queue, era 3 Verde orders use the era 1–2
  rule with a 4-turn arrival.

## 5. Compute split (every turn)

### 5.1 The split

On the budget screen, one bar divides **online compute** into four slices:

| Slice | Who sets it | Effect |
|---|---|---|
| Serving | Defaults to the need (`updateServing`'s units); the player may cap it lower | Keeps users served |
| Control | Set by internal deployment (plan 2A `controlUnits`), from era 3 | Monitors and sandboxes the internally deployed model |
| Safety | Player, as a share of online compute (default 10%) | Lowers alignment debt; sharpens the Head of Safety's readings |
| Training | The rest | Active runs draw from it; `availableUnits` = training slice − active run units |

- **The money budget loses its safety slice.** It keeps training, security, product and
  talent. `setBudget`'s key list, the actions contract (`budget: { spend, split }`) and the UI's
  slider data change together, or the sim rejects the UI's budgets. Every place that read
  `budget.split.safety` reads the compute safety share (`state.compute.split.safety`, 0–0.5)
  instead:
  - plan 2A reads the safety money share only through one helper, `safetySpend(state)` in
    `sim/economy.js` (interpretability exposure and the Head of Safety's noise). Plan 2C
    swaps that one function to the compute safety share, with the exposure threshold
    `safety units ≥ 3 × ERA_SCALE`;
  - per-turn alignment-debt reduction (`sim/turn.js` budget effects), constant retuned;
  - plan 2A's `openletter` event: "Meet their demands" raises the compute safety share by 0.1.
- Control compute comes only from plan 2A's `controlUnits(state)`.
- The training run's capability-versus-alignment slider and the era's `targetSafetyShare`
  (alignment debt per run) are unchanged. They govern how a run trains; the split governs
  how the lab's standing compute is used.

### 5.2 Serving shortfall

If the serving slice is below the need (by the player's cap, or because compute ran out):

- With **"cover with spot"** on (default), the shortfall is bought at the era's spot price.
  This replaces today's `spotPremium` overflow charge.
- With it off, users see outages: each active model loses `shortfall share × 10%` of its users
  this turn, public trust −2, and the feed posts outage jokes.

### 5.3 Idle compute and resale

Training-slice units not used by an active run are idle and still billed. A "resell idle
compute" toggle recovers 70% (eras 1–2), 60% (era 3) or 50% (eras 4–5) of the base price for
those units this turn.

### 5.4 The safety-compute pledge

- Once, in eras 1–2, the budget screen offers a public pledge of 5%, 10% or 20% of compute to
  safety (no move needed). Effects: public trust +3, staff trust +5; stored in
  `state.promises` as `{ type: 'safetyCompute', share }`.
- Each turn the safety share is below the pledge, set `state.flags.brokenPromise`. That
  triggers the "broken promise revealed" warning-then-card event (plan 2A `promise`), which
  today keys on a model flag; plan 2C adds the lab-level flag as a second trigger. A cover-up
  there can lead to the Head of Safety quitting publicly (main spec section 6).
- Real model: OpenAI's 20% Superalignment pledge, which went unmet ⚠️.

### 5.5 Pressure cards (events)

| Era | Card | Choices |
|---|---|---|
| 2 | An investor asks you to drop the pledge | Drop it (cash +5% of valuation, staff trust −8, pledge removed) · Refuse (board −2 each) |
| 3 | An agent launch doubles serving demand for two turns | Buy spot · Cap serving and accept outages · Route users to a cheaper model (usage −30%, public trust −1) |
| 4 | Humanoid line adds serving load (if the humanoid line exists) | Same three choices |
| 5 | Government pooling: give 20–40% of compute to a national effort | Accept (that compute leaves for the rest of the game; US favor +10; summit stances toward the player +0.1) · Refuse (US favor −8; 20% chance of a "supply chain risk" designation, which revokes Gulf units) |

The era 5 pooling card is modeled on the Defense Production Act step in the AI 2027 scenario.

## 6. Era 4 power pipeline and power cap

### 6.1 Power cap

From era 4, **online compute = contracted units that have power**:

- Contracts that arrived before era 4, and all Azuria, CoreFlame, Gulf and spot capacity,
  bring their own power (the supplier's problem).
- Verde orders and letters of intent that arrive in era 4 or later need the player's **site
  power**. Units beyond available site power sit idle, still billed. The commitments strip
  shows "unpowered" units in red, and the Head of Research and CFO both comment.

### 6.2 Sites

Starting a site is a move ("Build a site", or a grid reservation card in the deal offers).
Each site has a power source, a size in units of power (absolute units, already at era 4
scale), an arrival turn, and costs:

| Site | Available | Size (units of power) | Arrival | Cost | Side effects |
|---|---|---|---|---|---|
| Grid reservation | eras 2–3 | 300–600 | era 4 turn 1–2 if reserved in era 2; era 4 turn 3–4 if reserved in era 3, with a 25% chance of slipping into era 5 | $50M upfront, then the facility lease from arrival | none |
| Gas turbines | era 4 | 300–600 | 4 turns | facility lease | public trust −3 at start; opposition warning chance 15% per turn while building |
| Nuclear restart | era 4 | 200–400 | 4 turns, 50% chance of slipping 1–2 more | facility lease | public trust +2 |
| Gulf campus | era 3–4 (see 3.2) | as its contract | 2 turns | as its contract | US-gated |

- **Facility lease.** Real labs finance sites off their balance sheets through special-purpose
  companies and leases (Meta's Hyperion, xAI's Colossus 2). A site costs about $19M of
  facility per unit of power (Epoch AI's $11.4B facility share per gigawatt ÷ 600). The game
  charges it as a lease: 20% of the facility value per year, billed monthly from arrival. First
  pass; the balance pass tunes it.
- **Construction display.** Each site shows as a scaffold with a progress bar, its power source,
  and "announced X / online Y".
- **Local opposition** (replaces plan 2A's `datacenter` event). Warning: "residents pack town
  hall over <site>". Card next turn: pay for community benefits (cash: 1 month of the site's
  lease), move the site (+2 turns), or push through (public trust −5; 30% chance the site
  loses 30% of its size). Real model: $64–68B of US projects blocked or delayed ⚠️ and the
  Abilene cut.

## 7. Era 5

- No new Verde orders, sites or Gulf contracts. Only spot, CoreFlame and capacity already in
  the pipeline (including slipped sites) deliver.
- The government pooling card (section 5.5) and plan 2A's summit `computeCap` commitment are
  the era's compute decisions.

## 8. State changes

```js
state.compute = {
  online, pipeline, contracts,          // existing
  servingUnits, overflow,               // existing
  split: { safety: 0.1, servingCap: null, coverWithSpot: true, resellIdle: false },
  offers: [],                           // this turn's offer cards (seeded)
  queue: null,                          // era 3: { released, orders: [{ lab, units, tier }] }
  credits: 0,                           // equity-for-compute credits ($M), Azuria only
  goodwill: { verde: 0, azuria: 0, coreflame: 0, gulf: 0 },
};
state.power = { sites: [] };            // { id, source, units, arrivesTurn, online, leaseMonthly, paused }
// contract: { id, supplier, units, price, monthlyBill, monthsLeft, upfront, needsPower,
//             string, scaledDown, arrivedTurn }
```

## 9. Screens (after the owner's K2 visual direction, main spec 7b)

Load the `design` skill before building these; every screen is rendered and looked at.

- **Sign a compute deal** (Company submenu): a Game Dev Tycoon dialog. Centre: the offer cards
  (five fields each). Right panel: **Commitments** (each contract with scale-down and break
  buttons, total monthly bill, unpowered units in era 4). Left panel: Team (advisor one-liners).
  In era 3 the Verde card opens the queue panel: tier bars per lab, the player's order slider
  and tier switch.
- **Budget dialog:** four money sliders (plan 2B Task 3 minus safety) plus a **compute
  allocation bar** in Game Dev Tycoon's time-allocation style: serving (with a floor marker),
  control, safety (with a pledge marker), training. Toggles: cover with spot, resell idle.
  Pledge offer in eras 1–2.
- **Build a site** (era 4, Company submenu): site options as cards; building sites appear as
  scaffolds on the sites list.
- **HUD info box:** "Compute online / arriving", in units or MW/GW by era.
- Plan 2B builds three seams for this: the budget dialog renders its sliders from a data array
  (key, label, colour token); the deal menu renders cards through one adapter,
  `dealCards(state)`; the HUD's compute line goes through one formatter. Plan 2C changes those
  three, not the screens around them.

## 10. Coordination with plans 2A and 2B

Plans 2A (branch `mechanics`) and 2B (branch `ui`) are executed by other sessions. Their
author estimates 2A merges to `main` early on 2026-09-26 PT and 2B's Tasks 2, 3 and 7 during
2026-09-26; the mechanics lane notifies this lane on merge. Plan 2C's sim tasks start from
`main` after 2A merges; its UI tasks start after 2B Tasks 2, 3 and 7 merge. Until then, plan 2C
work that touches only new files (`sim/contracts.js`, `sim/power.js`, tests) can proceed.
Plan 2C adapts:

| Plan 2A/2B item | Change in plan 2C |
|---|---|
| 2A `openletter` event (split 0.1 training→safety) | Raises the compute safety share by 0.1 |
| 2A interpretability exposure (`spend × split.safety ≥ 5`) and `advisors.js` safety noise | Read the compute safety share |
| 2A `datacenter` era 4 event | Becomes site opposition (section 6.2) |
| 2A `controlUnits` (internal deployment) | Becomes the control slice of the split |
| 2A summit `computeCap` | Unchanged; noted in section 7 |
| 2B Task 3 budget dialog (five sliders) | Four sliders plus the compute allocation bar |
| 2B Task 7 "Sign a compute deal" (four `SUPPLIERS` cards) | New offers, commitments panel, era 3 queue panel |
| `raiseRound('strategic')` compute clause | Replaced by the equity-for-compute offer |
| 2A Task 7 President `exportLicenses` stake (+8 units into the pipeline) | Becomes a Verde contract of `8 × ERA_SCALE` units at 0.9x, arriving next turn |
| 2A Task 8 balance re-tune | Runs first; plan 2C's last task re-tunes again (section 11) |

## 11. Testing and balance

Unit tests (`node --test`), at least:

- Offers scale with `ERA_SCALE`; run unit costs scale with it; capability gain does not.
- Contracts bill every month until the term ends, used or idle; upfront is paid at signing.
- Scale-down cuts 30% once with the penalty; break charges upfront loss plus 25% of remaining.
- Failure chance converts per month to per turn; CoreFlame failure goes warning → card.
- Azuria exclusivity blocks CoreFlame and Gulf until bought out.
- Gulf offer appears only at US favor ≥ 60; revoked below 50; restored at 60.
- Letter of intent delivers between 30% and 100% of its headline.
- Era 3 queue: prepaid orders fill first; standard orders share the rest pro rata; Qilin never
  orders; unfilled orders carry over.
- Split: training slice = online − serving − control − safety; `availableUnits` uses it;
  serving shortfall buys spot or loses users; idle resale recovers the era's share.
- Pledge: a safety share below the pledge sets `brokenPromise`.
- Era 4: units needing power run only up to site power; unpowered units are still billed.
- Sites: arrival, nuclear slip, grid-reservation slip, opposition warning → card.
- Money readers (alignment debt, advisor noise, interpretability) use the compute safety share.

## 11b. Balance integration (owner requirement 2026-09-25)

Compute must work with the whole game's balance, not as a side system. The main spec's targets
still hold: most first runs die in era 3–4; no scripted strategy wins more than about a third
of runs; slowness is punished mainly by rivals pulling ahead, then by the board.

**How compute feeds each ending.**

| Ending | Compute's role |
|---|---|
| Out of money | Take-or-pay bills, spot premiums and site leases are the largest part of burn. Over-committing is the main road here. |
| Left behind | Too little compute means smaller runs, since run costs grow with `ERA_SCALE`. Era 4 without power strands chips. |
| Misalignment and quiet takeover | A low safety share lets alignment debt grow; a small control slice raises internal-deployment risk. |
| Removed by the board | Equity-for-compute costs board support; broken pledges and outages cost trust. |
| Someone else's disaster | Prepaid queue orders and spite orders raise race heat. |

**Balance bot changes** (`tools/balance.js`). Each scripted strategy gains a compute policy:

- *speed:* the biggest Verde order each era, prepaid in the era 3 queue, gas sites in era 4,
  safety share 2%, pledge made and broken.
- *safety:* Azuria and CoreFlame contracts sized to need, 20% pledge kept, a nuclear site in
  era 4.
- *balanced:* grid reserved in era 2, safety share 12%, contracts sized to the next run.
- *random:* random offers, tiers, sites and safety share.
- Two compute probes, reported but excluded from the one-third rule: *over-committer* (signs
  the largest offer every turn) and *hand-to-mouth* (spot only).

**Compute targets** (checked by the balance report over at least 200 seeded runs per strategy):

1. The over-committer ends out of money in at least 60% of runs, mostly in eras 3–4.
2. Hand-to-mouth wins in at most 10% of runs (spot prices or falling behind kill it).
3. *balanced* with the era 2 grid reservation finishes era 4 with a better capability rank than
   *balanced* without it, in most seeds. Planning ahead must pay.
4. A safety share of 5% or less gives clearly more misalignment endings than 15% or more, with
   the rest of the strategy the same. Safety compute must matter.
5. In *balanced* runs, compute (bills, spot and leases) is 40–70% of burn in every era; real
   labs spend most of their money on compute.
6. The era 3 queue leaves at least one lab short in most turns (otherwise it is decoration).

**Money-scale check (first pass, before tuning).** A frontier-pace fleet per era, at the base
price, against what the economy can supply:

| Era | Fleet (units) | Monthly compute bill | Months in era | Era total |
|---|---|---|---|---|
| 1 | 20 | $29M | 12 | $0.35B |
| 2 | 60 | $88M | 12 | $1.05B |
| 3 | 175 | $256M | 4 | $1.0B |
| 4 | 1,000 (+ site leases about $0.3B a month) | $1.8B | 4 | $7.1B |
| 5 | 3,000 | $4.4B | 1 | $4.4B |

The run total is about $14B. Funding rounds are `valuation × share`, with valuation = ARR ×
a multiple (60 below $500M ARR, falling to about 40 at $2B). One 10% round at $300M ARR brings
about $1.8B; at $2B ARR about $8B. So a *balanced* run needs roughly $0.5B ARR by era 3 and
$2–4B by era 4, raising one round per era. That is below OpenAI's real path (about $3.7B revenue in
2024, projected in September 2024 per CNBC, cited in `docs/research/runway-history/runway_history.md`),
so it is plausible.
The balance report prints ARR and compute bills per era so this check is re-run, not assumed.

**Tuning levers, in order of preference:** (1) `ERA_SCALE` (fallback `[1, 3, 8, 30, 80]` if
money cannot keep up), (2) the site lease rate, (3) offer prices, (4) serving demand per user,
(5) round shares. Revenue and valuation formulas change last, because plan 2A's balance pass
tunes them for the rest of the game.

**Sequencing.** Plan 2A's Task 8 re-tunes first. Plan 2C's last task runs the full balance
report with the compute policies and re-tunes against both the main targets and the compute
targets above. Tests check behavior, not tuned constants, so re-tuning does not break them.

## 12. Out of scope

Buying individual chip generations, a Taiwan or TSMC disruption event (never researched), a
secondary market for contracts, multiplayer bidding, and a live GPU price index.
