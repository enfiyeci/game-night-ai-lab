# Plan 2C: compute gathering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat four-supplier compute menu with the owner-approved compute system: binding take-or-pay contracts with era-scaled offers and strings, a light era 3 allocation queue, a per-turn compute split (serving, control, safety, training) that takes over the money budget's safety slice, era 4 power sites with a power cap, the new compute events, the four compute screens, and a balance pass that holds the whole game to its targets.

**Architecture:** Three new pure sim modules (`sim/power.js`, `sim/contracts.js`, `sim/queue.js`) plus `sim/split.js` and a data table (`sim/data/compute.js`), wired into `sim/turn.js` through new `actions` fields. New compute randomness uses a seed-derived side stream (`sideRng`) so the main random stream, and every existing seeded test, is unchanged. The UI changes go through three seams the UI lane agreed to build (Task 7 adds any that are missing): the budget slider data array, the `dealCards(state)` adapter and the HUD compute formatter.

**Tech Stack:** Node 22, plain JavaScript ES modules, `node --test` (`npm test` = `node --test tests/*.test.js`), `npm run balance`; UI in HTML, CSS and ES modules with headless-Chrome screenshots (`tools/shot.sh` from plan 2B).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-25-compute-gathering-design.md` (the compute spec; it wins over the main spec where they differ) and `docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`. Where this plan and a spec disagree, the spec wins; report the conflict.
- Visual reference, binding for Task 7: `docs/design/mockups/K2-compute.html` (states `#deals`, `#power`, `#queue`, `#budget`) and its four PNGs `docs/design/mockups/K2-compute-{deals,power,queue,budget}.png`; the K2 tokens and dialog grammar from plan 2B's Global Constraints apply unchanged.
- Determinism: no `Math.random`, no `Date`. Compute randomness goes through the `rng` argument; in `endTurn` pass `sideRng(state, salt)` (Task 2) rather than the main `rng`.
- `endTurn(prev, actions, rng)` never mutates `prev`. Every lookup of a player-supplied string uses `Object.hasOwn` or an explicit list check.
- Advisor lines and player-facing text never show hidden numbers. Compute, cash and bills are visible numbers and may be shown.
- Fictional names only: suppliers Verde, Azuria, CoreFlame, the Gulf campus; rivals OpenBrain, Lodestar, DeepThink, Qilin.
- Stage files by explicit path; one commit per task; commit trailer `Co-Authored-By: Codex (gpt-5.6-sol) <noreply@openai.com>` (or the implementer's own trailer if not Codex).
- After every task: `npm test` passes and `npm run balance` completes.
- Display rule (spec §2): units in eras 1–3; megawatts and gigawatts from era 4 with 1 unit = 1.7 MW; the sim always counts units.
- Tests check behaviour, not tuned constants (compute spec §11b): expected values come from exports (`BALANCE.unitMonthlyCost`, `eraScale`, `SUPPLIERS`, `SITE_TYPES`, …) and tests that depend on rival speed pin it. Plan 2A Task 8 and this plan's Task 8 both re-tune numbers.

## Sequencing with plans 2A and 2B

| Task | Can start |
|---|---|
| 1–3 | Now. They create new files only. |
| 4–6 | After plan 2A has merged to `main` **and** plan 2B Tasks 3 and 7 have merged (Tasks 4–5 edit `ui/logic/actions.js` and `ui/screens/company.js`). Merge `main` into this branch first. |
| 7 | After plan 2B Tasks 2, 3 and 7 have merged. |
| 8 | After plan 2A Task 8 (its balance pass) has merged. |

Plan 2A provides these sim seams; use them by name: `safetySpend(state)` in `sim/economy.js` (the only reader of the safety money share), `controlUnits(state)` in `sim/internal.js`, `pushFeed` in `sim/events.js`. If one of them is missing on `main`, stop and report it; do not reimplement plan 2A work here. The UI lane agreed (in its handoff, not in plan 2B's text) to build three UI seams: the budget dialog's slider data array, a `dealCards(state)` adapter and one HUD compute formatter. Task 7 produces `dealCards` and `format.compute` itself; if the slider data array or the formatter hook is missing, Task 7 adds it.

## File map

| File | Responsibility |
|---|---|
| `sim/data/compute.js` (new) | Era scale, prices, supplier table, contract constants |
| `sim/power.js` (new) | Power sites: grid reservation, gas and nuclear builds, leases, the power cap |
| `sim/contracts.js` (new) | Offers, signing, arrival, billing, strings, contract actions, credits, `sideRng` |
| `sim/queue.js` (new) | Era 3 Verde allocation queue |
| `sim/split.js` (new) | Compute split, serving shortfall, resale, safety effect, the pledge |
| `sim/compute.js` | Deleted in Task 4 (replaced by `sim/contracts.js`) |
| `sim/state.js`, `sim/turn.js`, `sim/economy.js`, `sim/training.js`, `sim/recipe.js`, `sim/internal.js`, `sim/president.js`, `sim/summit.js`, `sim/events.js`, `sim/data/events.js`, `sim/advisors.js` | Wiring |
| `ui/logic/compute.js` (new) | Pure view models for the four compute screens |
| `ui/screens/compute.js`, `ui/screens/sites.js` (new); `ui/screens/budget.js`, `ui/screens/company.js`, `ui/hud.js`, `ui/logic/format.js`, `ui/logic/actions.js`, `ui/logic/scenarios.js` | Screens |
| `tools/balance.js`, `tests/balance.test.js`, `tests/compute-balance.test.js` (new) | Compute policies, probes and targets |

## The actions object after this plan

```js
endTurn(state, {
  budget,            // changed: { spend, split: { training, security, product, talent } } — no safety key
  computeSplit,      // new: { safety?: 0..0.5, servingCap?: number|null, coverWithSpot?: bool, resellIdle?: bool }
  pledge,            // new, eras 1–2, once: 0.05 | 0.1 | 0.2
  contractActions,   // new: [{ id, action: 'scaleDown' | 'break' | 'buyout' }] (free, before moves)
  queueWithdraw,     // new: true to drop the waiting part of an era 3 queue order
  moves,             // changed: { type: 'deal', offerId } (replaces supplierId)
                     // new: { type: 'queueOrder', units, tier: 'standard'|'prepaid' } (era 3)
                     //      { type: 'buildSite', source: 'gas'|'nuclear' } (era 4)
  ...everything plan 2A added (hazardChoice, addressWarnings, eventChoices, constitution, presidentAnswers, holdOrShip)
}, rng)
```

---

### Task 1: Compute tables, era scale and power sites

**Files:**
- Create: `sim/data/compute.js`, `sim/power.js`, `tests/power.test.js`

**Interfaces:**
- Consumes: `ERAS` from `sim/data/eras.js`; `state.power` = `{ sites, nextId }` (created by Task 4; tests build it); `state.compute.contracts` items with `units`, `needsPower`, `dark`.
- Produces:
  - `ERA_SCALE = [1, 3, 10, 50, 150]`, `eraScale(era)`, `MW_PER_UNIT = 1.7`, `SPOT_PRICE`, `RESALE`, `SUPPLIERS`, `FRAGILE_MONTHLY`, `BUMP_CHANCE`, `GULF_OPEN`, `GULF_REVOKE`, `EQUITY_SHARE`, `SCALE_DOWN`, `SCALE_DOWN_PENALTY_MONTHS`, `BREAK_SHARE`, `BUYOUT_MONTHS`, `RESCUE_MONTHS` from `sim/data/compute.js`.
  - From `sim/power.js`: `SITE_TYPES`, `FACILITY_PER_UNIT = 19`, `LEASE_RATE = 0.2`, `leaseMonthly(units)`, `eraStartTurn(era)`, `reserveGrid(state, rng)` → `{ ok, site, arrivesTurn }`, `buildSite(state, source, rng)` → `{ ok, site, arrivesTurn }`, `powerTurn(state)` → `[{ type: 'siteOnline', id, source, units }]`, `sitePower(state)`, `leaseBills(state)` ($M per month), `poweredUnits(state)` → `{ online, unpowered }`.
  - Site shape: `{ id, source: 'grid'|'gas'|'nuclear', units, arrivesTurn, online, oppositionCut }`.

- [ ] **Step 1: Write the data file**

```js
// sim/data/compute.js
// Compute gathering tables. Spec: docs/superpowers/specs/2026-09-25-compute-gathering-design.md.
// First-pass numbers; plan 2C Task 8 tunes them.
export const ERA_SCALE = [1, 3, 10, 50, 150];
export const eraScale = (era) => ERA_SCALE[era - 1];
export const MW_PER_UNIT = 1.7; // about 600 units per gigawatt

export const SPOT_PRICE = { 1: 2.0, 2: 2.0, 3: 2.5, 4: 3.0, 5: 3.5 }; // × base unit price
export const RESALE = { 1: 0.7, 2: 0.7, 3: 0.6, 4: 0.5, 5: 0.5 };    // share of base price recovered for idle units
export const FRAGILE_MONTHLY = 0.02;  // CoreFlame trouble chance per month
export const BUMP_CHANCE = { 3: 0.25, 5: 0.25 }; // spot pulled next turn, per turn, in the tight eras
export const GULF_OPEN = 60;   // US favor needed to sign or restore the Gulf license
export const GULF_REVOKE = 50; // below this the license is revoked
export const EQUITY_SHARE = 0.08;
export const SCALE_DOWN = 0.3;
export const SCALE_DOWN_PENALTY_MONTHS = 2;
export const BREAK_SHARE = 0.25;
export const BUYOUT_MONTHS = 3;
export const RESCUE_MONTHS = 3;

// size [lo, hi] is multiplied by eraScale(era); arrival is in turns (an object when it differs by era).
export const SUPPLIERS = {
  verde: { name: 'Verde', kind: 'Chip order', size: [10, 20], arrival: { 1: 3, 2: 3, 4: 2 }, upfrontShare: 0.12, price: 1.0, termMonths: 24, string: null, eras: [1, 2, 4] },
  azuria: { name: 'Azuria', kind: 'Cloud', size: [8, 15], arrival: 1, upfrontShare: 0, price: 1.1, termMonths: 24, string: 'exclusive', eras: [1, 2, 3, 4] },
  coreflame: { name: 'CoreFlame', kind: 'Neocloud', size: [5, 10], arrival: 1, upfrontShare: 0, price: 1.0, termMonths: 12, string: 'fragile', eras: [1, 2, 3, 4, 5] },
  spot: { name: 'Spot market', kind: 'Rent now', size: [2, 5], arrival: 0, upfrontShare: 0, price: null, termMonths: null, string: 'bumpable', eras: [1, 2, 3, 4, 5] },
  azuriaEquity: { name: 'Azuria', kind: 'Investment', size: null, arrival: 1, upfrontShare: 0, price: 1.0, termMonths: 24, string: 'moneyBack', eras: [2, 3, 4] },
  gulf: { name: 'Gulf campus', kind: 'Sovereign', size: [10, 30], arrival: 2, upfrontShare: 0.1, price: 1.0, termMonths: 36, string: 'usGated', eras: [3, 4] },
  loi: { name: 'Verde', kind: 'Letter of intent', size: [20, 20], arrival: 2, upfrontShare: 0.05, price: 1.0, termMonths: 24, string: 'shrinks', eras: [4] },
  grid: { name: 'Grid connection', kind: 'Power reservation', size: null, arrival: null, upfrontShare: 0, price: null, termMonths: null, string: 'gridReservation', eras: [2, 3] },
};
```

- [ ] **Step 2: Write the failing tests**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { ERAS } from '../sim/data/eras.js';
import {
  SITE_TYPES, FACILITY_PER_UNIT, LEASE_RATE, reserveGrid, buildSite, powerTurn, sitePower, leaseBills, leaseMonthly,
  poweredUnits, eraStartTurn,
} from '../sim/power.js';
import { ERA_SCALE, eraScale } from '../sim/data/compute.js';

// Tests check behaviour against the modules' own exports, not tuned constants (compute spec §11b).
const lo = { next: () => 0, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };
const hi = { ...lo, int: (a, b) => b, chance: () => true };
const fresh = (era = 1) => { const s = createInitialState(); s.era = era; s.power ??= { sites: [], nextId: 1 }; return s; };

test('the era scale grows by era and era start turns follow the era table', () => {
  assert.equal(ERA_SCALE.length, 5);
  assert.equal(ERA_SCALE[0], 1);
  for (let e = 2; e <= 5; e++) assert.ok(eraScale(e) > eraScale(e - 1));
  assert.equal(eraStartTurn(1), 0);
  assert.equal(eraStartTurn(4), ERAS[0].turns + ERAS[1].turns + ERAS[2].turns);
});

test('a grid reservation in era 2 comes online at the start of era 4, once per game', () => {
  const s = fresh(2);
  const cash = s.cash;
  const r = reserveGrid(s, lo);
  assert.equal(r.ok, true);
  assert.equal(s.cash, cash - SITE_TYPES.grid.upfront);
  assert.equal(r.arrivesTurn, eraStartTurn(4));
  assert.equal(s.power.sites[0].units, SITE_TYPES.grid.size[0]);
  assert.equal(reserveGrid(s, lo).ok, false);
  assert.equal(reserveGrid(fresh(4), lo).ok, false);
});

test('a late grid reservation arrives late in era 4 and can slip into era 5', () => {
  const late = reserveGrid(fresh(3), lo).arrivesTurn;
  assert.ok(late > eraStartTurn(4) && late < eraStartTurn(5));
  assert.ok(reserveGrid(fresh(3), hi).arrivesTurn >= eraStartTurn(5));
});

test('gas costs public trust; nuclear gains it and may slip', () => {
  const s = fresh(4); s.turn = eraStartTurn(4);
  const pt = s.publicTrust;
  assert.equal(buildSite(s, 'gas', lo).arrivesTurn, s.turn + SITE_TYPES.gas.turns);
  assert.equal(s.publicTrust, pt + SITE_TYPES.gas.trust);
  assert.equal(buildSite(s, 'nuclear', hi).arrivesTurn, s.turn + SITE_TYPES.nuclear.turns + 2);
  assert.equal(s.publicTrust, pt + SITE_TYPES.gas.trust + SITE_TYPES.nuclear.trust);
  assert.equal(buildSite(s, 'coal', lo).ok, false);
  assert.equal(buildSite(fresh(3), 'gas', lo).ok, false);
});

test('sites come online on time; only online sites give power and bill a lease', () => {
  const s = fresh(4); s.turn = eraStartTurn(4);
  const { arrivesTurn } = buildSite(s, 'gas', lo);
  const units = SITE_TYPES.gas.size[0];
  assert.equal(sitePower(s), 0);
  assert.equal(leaseBills(s), 0);
  s.turn = arrivesTurn;
  assert.equal(powerTurn(s)[0].type, 'siteOnline');
  assert.equal(sitePower(s), units);
  assert.ok(Math.abs(leaseMonthly(units) - (units * FACILITY_PER_UNIT * LEASE_RATE) / 12) < 1e-9);
  assert.ok(Math.abs(leaseBills(s) - leaseMonthly(units)) < 1e-9);
  assert.equal(powerTurn(s).length, 0);
});

test('chips that need power run only up to site power; dark contracts do not count', () => {
  const s = fresh(4);
  s.compute.contracts = [
    { id: 'a', units: 100, needsPower: false, dark: false },
    { id: 'b', units: 700, needsPower: true, dark: false },
    { id: 'c', units: 50, needsPower: false, dark: true },
  ];
  s.power.sites.push({ id: 'grid-1', source: 'grid', units: 500, arrivesTurn: 0, online: true, oppositionCut: null });
  assert.deepEqual(poweredUnits(s), { online: 600, unpowered: 200 });
});
```

- [ ] **Step 3: Run to confirm failure** — `node --test tests/power.test.js` → FAIL (`Cannot find module '../sim/power.js'`).

- [ ] **Step 4: Implement `sim/power.js`**

```js
import { ERAS } from './data/eras.js';

// Spec §6: sites supply power in era 4. Sizes are absolute units (already at era 4 scale).
export const SITE_TYPES = {
  grid: { name: 'Grid connection', size: [300, 600], upfront: 50 },
  gas: { name: 'Gas turbines', size: [300, 600], turns: 4, trust: -3 },
  nuclear: { name: 'Nuclear restart', size: [200, 400], turns: 4, trust: 2, slipChance: 0.5 },
};
export const FACILITY_PER_UNIT = 19; // $M of facility per unit of power (Epoch AI: $11.4B per GW ÷ 600)
export const LEASE_RATE = 0.2;       // share of facility value paid per year
export const leaseMonthly = (units) => (units * FACILITY_PER_UNIT * LEASE_RATE) / 12;
export const eraStartTurn = (era) => ERAS.slice(0, era - 1).reduce((sum, e) => sum + e.turns, 0);

const roll = (rng, [lo, hi]) => Math.round(rng.int(lo, hi) / 10) * 10;

function addSite(state, source, units, arrivesTurn) {
  const site = { id: `${source}-${state.power.nextId++}`, source, units, arrivesTurn, online: false, oppositionCut: null };
  state.power.sites.push(site);
  return site;
}

export function reserveGrid(state, rng) {
  if (state.era !== 2 && state.era !== 3) return { ok: false, error: 'grid connections are reserved in eras 2 and 3' };
  if (state.power.sites.some((s) => s.source === 'grid')) return { ok: false, error: 'you already hold a grid reservation' };
  if (state.cash < SITE_TYPES.grid.upfront) return { ok: false, error: 'not enough cash for the reservation' };
  state.cash -= SITE_TYPES.grid.upfront;
  let arrivesTurn = eraStartTurn(4) + (state.era === 2 ? 0 : 2) + rng.int(0, 1);
  if (state.era === 3 && rng.chance(0.25)) arrivesTurn = eraStartTurn(5) + rng.int(0, 1);
  const site = addSite(state, 'grid', roll(rng, SITE_TYPES.grid.size), arrivesTurn);
  return { ok: true, site: site.id, arrivesTurn };
}

export function buildSite(state, source, rng) {
  if (state.era !== 4) return { ok: false, error: 'sites are built in era 4' };
  if (source !== 'gas' && source !== 'nuclear') return { ok: false, error: `unknown site type ${source}` };
  const t = SITE_TYPES[source];
  const slip = t.slipChance && rng.chance(t.slipChance) ? rng.int(1, 2) : 0;
  const site = addSite(state, source, roll(rng, t.size), state.turn + t.turns + slip);
  state.publicTrust += t.trust;
  return { ok: true, site: site.id, arrivesTurn: site.arrivesTurn };
}

export function powerTurn(state) {
  const events = [];
  for (const s of state.power.sites) {
    if (!s.online && s.arrivesTurn <= state.turn) {
      s.online = true;
      events.push({ type: 'siteOnline', id: s.id, source: s.source, units: s.units });
    }
  }
  return events;
}

export const sitePower = (state) => state.power.sites.filter((s) => s.online).reduce((sum, s) => sum + s.units, 0);
export const leaseBills = (state) => state.power.sites.filter((s) => s.online).reduce((sum, s) => sum + leaseMonthly(s.units), 0);

// Spec §6.1: contracts that bring their own power always run; the rest run up to site power.
export function poweredUnits(state) {
  const live = state.compute.contracts.filter((c) => !c.dark);
  const own = live.filter((c) => !c.needsPower).reduce((sum, c) => sum + c.units, 0);
  const needs = live.filter((c) => c.needsPower).reduce((sum, c) => sum + c.units, 0);
  const power = sitePower(state);
  return { online: own + Math.min(needs, power), unpowered: Math.max(0, needs - power) };
}
```

- [ ] **Step 5: Run** `node --test tests/power.test.js` → PASS; `npm test` → all pass.
- [ ] **Step 6: Commit** — `git add sim/data/compute.js sim/power.js tests/power.test.js && git commit -m "feat(sim): compute tables, era scale and power sites"`

---

### Task 2: Contracts — offers, signing, billing, strings

**Files:**
- Create: `sim/contracts.js`, `tests/contracts.test.js`

**Interfaces:**
- Consumes: Task 1 (`SUPPLIERS`, constants, `reserveGrid`, `poweredUnits`), `BALANCE.unitMonthlyCost`, `eraById`, `createRng`.
- Produces (all from `sim/contracts.js`):
  - `sideRng(state, salt)` → an rng derived from `state.seed`, `state.turn` and `salt`.
  - `family(offerKey)` → contract supplier (`azuriaEquity` → `azuria`, `loi` → `verde`, else the key).
  - `generateOffers(state, rng)` → offer list. Offer shape: `{ id, supplier, units, arrivesIn, upfront, monthly, termMonths, price, string, credits? }`; the era 3 queue card is `{ id: 'verde-queue-<turn>', supplier: 'verde', viaQueue: true }`; the grid card is `{ id, supplier: 'grid', upfront: 50, string: 'gridReservation' }`.
  - `signOffer(state, offerId, rng)` → `{ ok, offerId?, arrivesTurn?, error? }`.
  - `addPipeline(state, { supplier, units, price, termMonths, arrivesTurn, string, headline? })` → id.
  - `contractsTurn(state, rng)` → `{ arrived, bumped, warnedBump }`; `expireContracts(state)` → expired contracts; `refreshOnline(state)`.
  - `contractBill(c)`, `monthlyBills(state)`, `arrivingBills(state)`, `creditOffset(state)`, `spendCredits(state)` → $M used; `perTurn(monthly, months)`; `exclusiveActive(state)`.
  - `contractAction(state, { id, action })` → `{ ok }` with actions `scaleDown`, `break`, `buyout`.
  - Contract shape: `{ id, supplier, units, price, monthsLeft, needsPower, string, arrivedTurn, scaledDown, troubled, dark, bumpNext, exclusiveBought, headline }`. Spot has `monthsLeft: null`: it renews every turn until the player breaks it (free) or it is pulled. A pipeline item may carry `needsPower` to override the default (Verde chips arriving in era 4 or later need site power).
  - Exclusivity: while any Azuria contract (cloud or investment) runs or waits in the pipeline, CoreFlame and Gulf offers are refused until that contract is bought out. The Gulf offer is hidden and refused while `state.flags.supplyChainRisk` is set.
  - New `state.compute` fields used (Task 4 creates them): `offers`, `delays` (`{ [supplier]: extra turns }`), `nextId`, `credits`, `unpowered`.

- [ ] **Step 1: Write the failing tests**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { SUPPLIERS, SPOT_PRICE, EQUITY_SHARE, GULF_OPEN, SCALE_DOWN, SCALE_DOWN_PENALTY_MONTHS, BREAK_SHARE, BUYOUT_MONTHS, eraScale } from '../sim/data/compute.js';
import {
  generateOffers, signOffer, contractsTurn, expireContracts, contractAction, monthlyBills,
  creditOffset, spendCredits, perTurn, exclusiveActive, sideRng,
} from '../sim/contracts.js';

// Tests check behaviour against the modules' own exports, not tuned constants (compute spec §11b).
const lo = { next: () => 0, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };
const fire = { ...lo, chance: () => true };
const U = BALANCE.unitMonthlyCost;
const small = (key, era) => SUPPLIERS[key].size[0] * eraScale(era); // the lo rng rolls the low end

function fresh(era = 1, favor = 50) {
  const s = createInitialState();
  s.era = era;
  s.govFavor.us = favor;
  s.cash = 1e6;
  s.power ??= { sites: [], nextId: 1 };
  Object.assign(s.compute, { offers: [], delays: {}, nextId: 1, credits: 0, unpowered: 0 });
  s.compute.contracts = [{ id: 'starter', supplier: 'starter', units: 10, price: 1, monthsLeft: 24, needsPower: false, dark: false, string: null }];
  s.compute.offers = generateOffers(s, lo);
  return s;
}
const offer = (s, supplier) => s.compute.offers.find((o) => o.supplier === supplier && !o.viaQueue);

test('offers follow the era menu and scale with the era', () => {
  assert.deepEqual(fresh(1).compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot']);
  assert.equal(offer(fresh(1), 'verde').units, small('verde', 1));
  const e4 = fresh(4, GULF_OPEN + 10);
  assert.equal(offer(e4, 'verde').units, small('verde', 4));
  assert.ok(offer(e4, 'gulf') && offer(e4, 'loi') && offer(e4, 'azuriaEquity'));
  assert.deepEqual(fresh(5, GULF_OPEN + 10).compute.offers.map((o) => o.supplier), ['coreflame', 'spot']);
  const e3 = fresh(3);
  assert.equal(e3.compute.offers[0].viaQueue, true);
  assert.equal(offer(e3, 'verde'), undefined);
  assert.equal(offer(e3, 'gulf'), undefined, 'the Gulf offer needs US favor');
  const risk = fresh(4, GULF_OPEN + 10);
  risk.flags.supplyChainRisk = true;
  assert.equal(generateOffers(risk, lo).some((o) => o.supplier === 'gulf'), false);
});

test('speed carries the premium: spot costs the most, long reservations the least', () => {
  const s = fresh(1);
  assert.equal(offer(s, 'spot').price, SPOT_PRICE[1]);
  assert.ok(offer(s, 'spot').price > offer(s, 'azuria').price);
  assert.ok(offer(s, 'azuria').price > offer(s, 'verde').price);
  assert.equal(offer(s, 'verde').upfront, Math.round(SUPPLIERS.verde.upfrontShare * small('verde', 1) * U * SUPPLIERS.verde.termMonths));
  assert.equal(offer(fresh(5), 'spot').price, SPOT_PRICE[5]);
  assert.ok(Math.abs(perTurn(0.02, 3) - (1 - 0.98 ** 3)) < 1e-12);
});

test('a signed contract bills every month until its term ends, used or not', () => {
  const s = fresh(1);
  const cash = s.cash;
  const v = offer(s, 'verde');
  assert.equal(signOffer(s, v.id, lo).ok, true);
  assert.equal(s.cash, cash - v.upfront);
  assert.equal(s.compute.offers.some((o) => o.id === v.id), false, 'offers are single use');
  s.turn = v.arrivesIn;
  contractsTurn(s, lo);
  assert.equal(s.compute.online, 10 + v.units);
  assert.ok(Math.abs(monthlyBills(s) - (10 + v.units) * U) < 1e-9);
  const c = s.compute.contracts.find((x) => x.supplier === 'verde');
  for (let m = 0; m < SUPPLIERS.verde.termMonths; m += 3) expireContracts(s);
  assert.equal(s.compute.contracts.includes(c), false);
  assert.equal(signOffer(s, 'nope', lo).ok, false);
});

test('spot arrives at once, renews every turn at the era price, and can be dropped for free', () => {
  const s = fresh(1);
  const sp = offer(s, 'spot');
  assert.equal(signOffer(s, sp.id, lo).ok, true);
  assert.equal(s.compute.online, 10 + sp.units);
  expireContracts(s);
  expireContracts(s);
  const c = s.compute.contracts.find((x) => x.supplier === 'spot');
  assert.ok(c, 'spot rolls over');
  s.era = 3;
  contractsTurn(s, lo);
  assert.equal(c.price, SPOT_PRICE[3], 'a renewal pays the current era price');
  const cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'break' }).ok, true);
  assert.equal(s.cash, cash);
  assert.equal(s.compute.online, 10);
});

test('an Azuria contract, cloud or investment, blocks other clouds until bought out', () => {
  const s = fresh(1);
  const az = offer(s, 'azuria');
  signOffer(s, az.id, lo);
  assert.equal(exclusiveActive(s), true);
  assert.equal(signOffer(s, offer(s, 'coreflame').id, lo).ok, false);
  s.turn = 1;
  contractsTurn(s, lo);
  const c = s.compute.contracts.find((x) => x.supplier === 'azuria');
  const cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'buyout' }).ok, true);
  assert.ok(Math.abs(s.cash - (cash - BUYOUT_MONTHS * az.units * az.price * U)) < 1e-9);
  assert.equal(exclusiveActive(s), false);
  assert.equal(signOffer(s, offer(s, 'coreflame').id, lo).ok, true);
  const e = fresh(2);
  signOffer(e, offer(e, 'azuriaEquity').id, lo);
  assert.equal(exclusiveActive(e), true);
});

test('scale down once with a penalty and a slower next offer; break costs a share of what is left', () => {
  const s = fresh(1);
  const cf = offer(s, 'coreflame');
  signOffer(s, cf.id, lo);
  s.turn = 1;
  contractsTurn(s, lo);
  const c = s.compute.contracts.find((x) => x.supplier === 'coreflame');
  const removed = Math.round(cf.units * SCALE_DOWN);
  let cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'scaleDown' }).ok, true);
  assert.equal(c.units, cf.units - removed);
  assert.ok(Math.abs(s.cash - (cash - removed * U * SCALE_DOWN_PENALTY_MONTHS)) < 1e-9);
  assert.equal(contractAction(s, { id: c.id, action: 'scaleDown' }).ok, false);
  s.compute.offers = generateOffers(s, lo);
  assert.equal(offer(s, 'coreflame').arrivesIn, SUPPLIERS.coreflame.arrival + 1);
  cash = s.cash;
  assert.equal(contractAction(s, { id: c.id, action: 'break' }).ok, true);
  assert.ok(Math.abs(s.cash - (cash - BREAK_SHARE * c.units * U * c.monthsLeft)) < 1e-9);
  assert.equal(contractAction(s, { id: 'nope', action: 'break' }).ok, false);
  assert.equal(contractAction(s, { id: 'starter', action: 'melt' }).ok, false);
});

test('neocloud trouble, and the Gulf license follows US favor', () => {
  const s = fresh(3, GULF_OPEN + 5);
  const pt = s.publicTrust;
  signOffer(s, offer(s, 'coreflame').id, lo);
  assert.equal(signOffer(s, offer(s, 'gulf').id, lo).ok, true);
  assert.equal(s.publicTrust, pt - 2);
  s.turn = 2;
  contractsTurn(s, fire);
  assert.equal(s.compute.contracts.find((c) => c.supplier === 'coreflame').troubled, true);
  const g = s.compute.contracts.find((c) => c.supplier === 'gulf');
  const withGulf = monthlyBills(s);
  s.govFavor.us = 45; contractsTurn(s, lo);
  assert.equal(g.dark, true);
  assert.ok(monthlyBills(s) < withGulf, 'a revoked license pauses billing');
  s.govFavor.us = 55; contractsTurn(s, lo);
  assert.equal(g.dark, true, 'restored only at the opening threshold');
  s.govFavor.us = GULF_OPEN; contractsTurn(s, lo);
  assert.equal(g.dark, false);
  s.flags.supplyChainRisk = true; contractsTurn(s, lo);
  assert.equal(g.dark, true, 'a supply-chain-risk designation also revokes it');
});

test('a letter of intent delivers 30 to 100 percent of its headline and needs power in era 4', () => {
  const s = fresh(4);
  const l = offer(s, 'loi');
  assert.equal(l.units, small('loi', 4));
  assert.equal(signOffer(s, l.id, lo).ok, true);
  s.turn = l.arrivesIn;
  contractsTurn(s, lo);
  const c = s.compute.contracts.find((x) => x.headline === l.units);
  assert.equal(c.units, Math.round(l.units * 0.3));
  assert.equal(c.needsPower, true);
});

test('equity-for-compute credits pay Azuria bills and cost board support', () => {
  const s = fresh(2);
  s.valuation = 12000;
  s.compute.offers = generateOffers(s, lo);
  const e = offer(s, 'azuriaEquity');
  assert.equal(e.credits, Math.round(12000 * EQUITY_SHARE));
  assert.equal(e.units, Math.floor(e.credits / (U * SUPPLIERS.azuriaEquity.termMonths)));
  const board = [...s.board];
  signOffer(s, e.id, lo);
  assert.deepEqual(s.board, board.map((b) => b - 3));
  s.turn = 1;
  contractsTurn(s, lo);
  assert.ok(Math.abs(creditOffset(s) - e.units * U) < 1e-9);
  const used = spendCredits(s);
  assert.ok(Math.abs(s.compute.credits - (e.credits - used)) < 1e-9);
});

test('the grid card reserves a power site and then disappears', () => {
  const s = fresh(2);
  const g = offer(s, 'grid');
  assert.equal(signOffer(s, g.id, lo).ok, true);
  assert.equal(s.power.sites[0].source, 'grid');
  assert.equal(generateOffers(s, lo).some((o) => o.supplier === 'grid'), false);
});

test('spot can be pulled with a turn of warning in the tight eras', () => {
  const s = fresh(3);
  signOffer(s, offer(s, 'spot').id, lo);
  assert.equal(contractsTurn(s, fire).warnedBump, true);
  expireContracts(s); // the economy's end-of-turn step does not end spot
  s.turn += 1;
  assert.equal(contractsTurn(s, lo).bumped.length, 1);
  assert.equal(s.compute.contracts.some((c) => c.supplier === 'spot'), false);
});

test('the side stream is deterministic and independent of the main stream', () => {
  const s = fresh(1);
  assert.equal(sideRng(s, 3).next(), sideRng(s, 3).next());
  assert.notEqual(sideRng(s, 3).next(), sideRng(s, 4).next());
});
```

- [ ] **Step 2: Run** `node --test tests/contracts.test.js` → FAIL (module missing).

- [ ] **Step 3: Implement `sim/contracts.js`**

```js
import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { createRng } from './rng.js';
import {
  SUPPLIERS, SPOT_PRICE, eraScale, FRAGILE_MONTHLY, BUMP_CHANCE, GULF_OPEN, GULF_REVOKE, EQUITY_SHARE,
  SCALE_DOWN, SCALE_DOWN_PENALTY_MONTHS, BREAK_SHARE, BUYOUT_MONTHS,
} from './data/compute.js';
import { reserveGrid, poweredUnits } from './power.js';

const UNIT = BALANCE.unitMonthlyCost;
const FAMILY = { azuriaEquity: 'azuria', loi: 'verde' };
export const family = (key) => FAMILY[key] ?? key;

// A seed-derived stream so new compute draws never shift the main rng stream.
export const sideRng = (state, salt) => createRng(((state.seed >>> 0) * 2654435761 + state.turn * 7919 + salt * 104729) >>> 0);

export const perTurn = (monthly, months) => 1 - (1 - monthly) ** months;
export const contractBill = (c) => (c.dark ? 0 : c.units * c.price * UNIT);
export const monthlyBills = (state) => state.compute.contracts.reduce((sum, c) => sum + contractBill(c), 0);
export const arrivingBills = (state) =>
  state.compute.pipeline.filter((p) => p.arrivesTurn <= state.turn).reduce((sum, p) => sum + (p.headline ?? p.units) * p.price * UNIT, 0);

// Spec §3.2: while any Azuria contract runs (cloud or investment), other clouds are blocked until bought out.
export const exclusiveActive = (state) =>
  [...state.compute.contracts, ...state.compute.pipeline].some((c) => c.supplier === 'azuria' && !c.exclusiveBought);

const arrivalOf = (s, era) => (typeof s.arrival === 'object' ? s.arrival[era] : s.arrival);

export function generateOffers(state, rng) {
  const era = state.era;
  const offers = [];
  if (era === 3) offers.push({ id: `verde-queue-${state.turn}`, supplier: 'verde', viaQueue: true });
  for (const [key, s] of Object.entries(SUPPLIERS)) {
    if (!s.eras.includes(era)) continue;
    if (key === 'gulf' && (state.govFavor.us < GULF_OPEN || state.flags.supplyChainRisk)) continue;
    const id = `${key}-${state.turn}`;
    if (key === 'grid') {
      if (!state.power.sites.some((x) => x.source === 'grid')) offers.push({ id, supplier: key, upfront: 50, string: s.string });
      continue;
    }
    const delay = state.compute.delays[family(key)] ?? 0;
    if (key === 'azuriaEquity') {
      const credits = Math.round(state.valuation * EQUITY_SHARE);
      const units = Math.max(1, Math.floor(credits / (UNIT * s.termMonths)));
      offers.push({ id, supplier: key, units, credits, arrivesIn: s.arrival + delay, upfront: 0, monthly: units * UNIT, termMonths: s.termMonths, price: s.price, string: s.string });
      continue;
    }
    const units = rng.int(s.size[0], s.size[1]) * eraScale(era);
    const price = key === 'spot' ? SPOT_PRICE[era] : s.price;
    const termMonths = s.termMonths; // null for spot: it renews every turn until dropped or pulled
    const monthly = units * price * UNIT;
    offers.push({ id, supplier: key, units, arrivesIn: arrivalOf(s, era) + delay, upfront: Math.round(s.upfrontShare * monthly * (termMonths ?? 0)), monthly, termMonths, price, string: s.string });
  }
  return offers;
}

export function addPipeline(state, item) {
  const id = `c${state.compute.nextId++}`;
  state.compute.pipeline.push({ id, string: null, ...item });
  return id;
}

function arrive(state, p, rng) {
  const units = p.headline ? Math.round(p.headline * (0.3 + 0.7 * rng.next())) : p.units;
  const c = {
    id: p.id, supplier: p.supplier, units, price: p.price, monthsLeft: p.termMonths,
    needsPower: p.needsPower ?? (p.supplier === 'verde' && state.era >= 4), string: p.string, arrivedTurn: state.turn,
    scaledDown: false, troubled: false, dark: false, bumpNext: false, exclusiveBought: false, headline: p.headline ?? null,
  };
  state.compute.contracts.push(c);
  return c;
}

export function refreshOnline(state) {
  const p = poweredUnits(state);
  state.compute.online = p.online;
  state.compute.unpowered = p.unpowered;
}

export function signOffer(state, offerId, rng) {
  const offer = state.compute.offers.find((o) => o.id === offerId);
  if (!offer) return { ok: false, error: `unknown offer ${offerId}` };
  if (offer.viaQueue) return { ok: false, error: 'Verde is rationing: place a queue order instead' };
  const drop = () => { state.compute.offers = state.compute.offers.filter((o) => o.id !== offerId); };
  if (offer.supplier === 'grid') {
    const r = reserveGrid(state, rng);
    if (r.ok) drop();
    return r;
  }
  if ((offer.supplier === 'coreflame' || offer.supplier === 'gulf') && exclusiveActive(state)) {
    return { ok: false, error: "Azuria's exclusive contract blocks other clouds until you buy it out" };
  }
  if (offer.supplier === 'gulf' && (state.govFavor.us < GULF_OPEN || state.flags.supplyChainRisk)) return { ok: false, error: 'the Gulf deal needs US approval' };
  if (offer.upfront > state.cash) return { ok: false, error: 'not enough cash for the upfront payment' };
  state.cash -= offer.upfront;
  const f = family(offer.supplier);
  const arrivesTurn = state.turn + offer.arrivesIn;
  const id = addPipeline(state, {
    supplier: f, units: offer.units, price: offer.price, termMonths: offer.termMonths, arrivesTurn, string: offer.string,
    ...(offer.supplier === 'loi' ? { headline: offer.units } : {}),
  });
  if (offer.supplier === 'azuriaEquity') {
    state.compute.credits += offer.credits;
    state.board = state.board.map((b) => b - 3);
    state.flags.azuriaSeat = true;
  }
  if (offer.supplier === 'gulf') state.publicTrust -= 2;
  state.compute.delays[f] = 0;
  drop();
  if (offer.arrivesIn === 0) {
    const i = state.compute.pipeline.findIndex((p) => p.id === id);
    arrive(state, state.compute.pipeline.splice(i, 1)[0], rng);
    refreshOnline(state);
  }
  return { ok: true, offerId, arrivesTurn };
}

export function contractsTurn(state, rng) {
  const months = eraById(state.era).monthsPerTurn;
  const arrived = [];
  state.compute.pipeline = state.compute.pipeline.filter((p) => {
    if (p.arrivesTurn > state.turn) return true;
    arrived.push(arrive(state, p, rng));
    return false;
  });
  const bumped = state.compute.contracts.filter((c) => c.bumpNext);
  state.compute.contracts = state.compute.contracts.filter((c) => !c.bumpNext);
  const spots = state.compute.contracts.filter((c) => c.supplier === 'spot');
  const warnedBump = spots.length > 0 && rng.chance(BUMP_CHANCE[state.era] ?? 0);
  if (warnedBump) for (const c of spots) c.bumpNext = true;
  for (const c of state.compute.contracts) {
    if (c.supplier === 'spot') c.price = SPOT_PRICE[state.era]; // renewals pay today's spot price
    if (c.supplier === 'coreflame' && !c.troubled && rng.chance(perTurn(FRAGILE_MONTHLY, months))) c.troubled = true;
    if (c.supplier === 'gulf') {
      if (state.govFavor.us < GULF_REVOKE || state.flags.supplyChainRisk) c.dark = true;
      else if (state.govFavor.us >= GULF_OPEN) c.dark = false;
    }
  }
  refreshOnline(state);
  return { arrived, bumped, warnedBump };
}

// Called after the economy has billed the turn, so the last month of a term is still paid.
export function expireContracts(state) {
  const months = eraById(state.era).monthsPerTurn;
  const expired = [];
  state.compute.contracts = state.compute.contracts.filter((c) => {
    if (c.monthsLeft == null) return true; // spot rolls over
    c.monthsLeft -= months;
    if (c.monthsLeft > 1e-9) return true;
    expired.push(c);
    return false;
  });
  refreshOnline(state);
  return expired;
}

export function creditOffset(state) {
  const months = eraById(state.era).monthsPerTurn;
  const azuria = state.compute.contracts.filter((c) => c.supplier === 'azuria').reduce((sum, c) => sum + contractBill(c), 0);
  return Math.min(azuria, state.compute.credits / months);
}

export function spendCredits(state) {
  const used = creditOffset(state) * eraById(state.era).monthsPerTurn;
  state.compute.credits = Math.max(0, state.compute.credits - used);
  return used;
}

export function contractAction(state, { id, action } = {}) {
  const c = state.compute.contracts.find((x) => x.id === id);
  if (!c) return { ok: false, error: `unknown contract ${id}` };
  const bill = c.units * c.price * UNIT;
  if (action === 'scaleDown') {
    if (c.scaledDown) return { ok: false, error: 'a contract can be scaled down once' };
    const removed = Math.round(c.units * SCALE_DOWN);
    state.cash -= removed * c.price * UNIT * SCALE_DOWN_PENALTY_MONTHS;
    c.units -= removed;
    c.scaledDown = true;
    state.compute.delays[c.supplier] = 1;
  } else if (action === 'break') {
    state.cash -= BREAK_SHARE * bill * (c.monthsLeft ?? 0); // dropping spot costs nothing
    state.compute.contracts = state.compute.contracts.filter((x) => x !== c);
  } else if (action === 'buyout') {
    if (c.supplier !== 'azuria' || c.exclusiveBought) return { ok: false, error: 'nothing to buy out' };
    state.cash -= BUYOUT_MONTHS * bill;
    c.exclusiveBought = true;
  } else return { ok: false, error: `unknown contract action ${action}` };
  refreshOnline(state);
  return { ok: true, id, action };
}
```

- [ ] **Step 4: Run** `node --test tests/contracts.test.js` → PASS; `npm test` → all pass.
- [ ] **Step 5: Commit** — `git add sim/contracts.js tests/contracts.test.js && git commit -m "feat(sim): take-or-pay contracts with era-scaled offers and strings"`

---

### Task 3: Era 3 allocation queue

**Files:**
- Create: `sim/queue.js`, `tests/queue.test.js`

**Interfaces:**
- Consumes: `eraScale`, `addPipeline` (Task 2), `BALANCE.unitMonthlyCost`, `state.rivals` (`id`, `speed`, `eastern`).
- Produces (all from `sim/queue.js`):
  - `QUEUE_RELEASE = 15`, `PREPAY_SHARE = 0.15`, `QUEUE_TERM_MONTHS = 24`, `ANNOUNCE_CHANCE = 0.25`, `released(state)` → 150.
  - `rivalOrders(state)` → `[{ lab, units, tier }]` for Western rivals.
  - `allocate(supply, orders)` → `{ [lab]: units }` (pure; used by the UI preview too).
  - `placeOrder(state, { units, tier })` → `{ ok, units, tier, upfront }` (refused while an earlier order still waits); `withdrawOrder(state)` → `{ ok }`.
  - `queueTurn(state, rng)` → events `{ type: 'queueFilled', units, waiting }` and `{ type: 'rivalPrepays', lab }`; sets `state.compute.queue.last = { released, rows: [{ lab, units, tier, got }] }` for the UI.
  - `state.compute.queue` = `{ order, carry, last }` (created on first use).

- [ ] **Step 1: Write the failing tests**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { eraScale } from '../sim/data/compute.js';
import { allocate, rivalOrders, placeOrder, queueTurn, released, withdrawOrder, QUEUE_RELEASE, PREPAY_SHARE, QUEUE_TERM_MONTHS } from '../sim/queue.js';

// Rival speeds are pinned here so a balance re-tune of rival speed does not change these tests.
const lo = { next: () => 0, int: (a) => a, chance: () => false, pick: (x) => x[0], normal: (m) => m };
const fire = { ...lo, chance: () => true };
const SPEED = { openbrain: 0.8, lodestar: 0.55, deepthink: 0.65, qilin: 0.7 };
const fresh3 = () => {
  const s = createInitialState();
  s.era = 3;
  s.cash = 1e6;
  for (const r of s.rivals) r.speed = SPEED[r.id];
  Object.assign(s.compute, { nextId: s.compute.nextId ?? 1 });
  return s;
};
const orderOf = (speed) => Math.round((2 + 4 * speed) * eraScale(3));

test('prepaid orders are served first; standard orders share the rest by size', () => {
  assert.deepEqual(allocate(150, [
    { lab: 'openbrain', units: 52, tier: 'prepaid' },
    { lab: 'lodestar', units: 42, tier: 'standard' },
    { lab: 'deepthink', units: 46, tier: 'standard' },
    { lab: 'you', units: 60, tier: 'standard' },
  ]), { openbrain: 52, lodestar: 28, deepthink: 30, you: 40 });
});

test('supply is never exceeded and a small order is filled in full', () => {
  assert.deepEqual(allocate(150, [{ lab: 'a', units: 200, tier: 'prepaid' }, { lab: 'b', units: 10, tier: 'standard' }]), { a: 150, b: 0 });
  assert.deepEqual(allocate(150, [{ lab: 'a', units: 20, tier: 'standard' }]), { a: 20 });
});

test('rival orders come from speed, and the Eastern lab cannot buy', () => {
  const s = fresh3();
  const o = rivalOrders(s);
  assert.equal(o.some((x) => x.lab === 'qilin'), false);
  assert.deepEqual(o.find((x) => x.lab === 'openbrain'), { lab: 'openbrain', units: orderOf(0.8), tier: 'prepaid' });
  assert.deepEqual(o.find((x) => x.lab === 'lodestar'), { lab: 'lodestar', units: orderOf(0.55), tier: 'standard' });
  assert.equal(released(s), QUEUE_RELEASE * eraScale(3));
});

test('orders: era 3 only, one per turn; prepaying costs cash and race heat', () => {
  const e2 = createInitialState(); e2.era = 2;
  assert.equal(placeOrder(e2, { units: 10, tier: 'standard' }).ok, false);
  const s = fresh3();
  const cash = s.cash;
  const heat = s.raceHeat;
  assert.equal(placeOrder(s, { units: 60, tier: 'prepaid' }).ok, true);
  assert.equal(s.cash, cash - Math.round(PREPAY_SHARE * 60 * BALANCE.unitMonthlyCost * QUEUE_TERM_MONTHS));
  assert.equal(s.raceHeat, heat + 2);
  assert.equal(placeOrder(s, { units: 10, tier: 'standard' }).ok, false);
  assert.equal(placeOrder(fresh3(), { units: 0, tier: 'standard' }).ok, false);
  assert.equal(placeOrder(fresh3(), { units: 10, tier: 'vip' }).ok, false);
});

test('a standard order is part-filled now; the rest waits, blocks a new order, and can be withdrawn', () => {
  const s = fresh3();
  const want = released(s);
  placeOrder(s, { units: want, tier: 'standard' });
  const expected = allocate(released(s), [...rivalOrders(s), { lab: 'you', units: want, tier: 'standard' }]).you;
  const ev = queueTurn(s, lo);
  assert.ok(expected > 0 && expected < want);
  assert.equal(ev.find((e) => e.type === 'queueFilled').units, expected);
  assert.deepEqual(s.compute.queue.carry, { units: want - expected, tier: 'standard' });
  assert.equal(s.compute.pipeline.at(-1).units, expected);
  assert.equal(s.compute.pipeline.at(-1).arrivesTurn, s.turn + 1);
  assert.equal(s.compute.queue.last.rows.find((r) => r.lab === 'you').got, expected);
  assert.equal(placeOrder(s, { units: 10, tier: 'standard' }).ok, false, 'a waiting order must be withdrawn first');
  assert.equal(withdrawOrder(s).ok, true);
  assert.equal(s.compute.queue.carry, null);
  assert.equal(withdrawOrder(s).ok, false);
});

test('a rival switching to prepaid is announced a turn ahead', () => {
  const s = fresh3();
  const ev = queueTurn(s, fire);
  assert.ok(ev.some((e) => e.type === 'rivalPrepays' && e.lab === 'lodestar'));
  assert.equal(rivalOrders(s).find((x) => x.lab === 'lodestar').tier, 'prepaid');
});

test('outside era 3 the queue clears', () => {
  const s = fresh3();
  placeOrder(s, { units: released(s), tier: 'standard' });
  queueTurn(s, lo);
  s.era = 4;
  assert.deepEqual(queueTurn(s, lo), []);
  assert.equal(s.compute.queue.carry, null);
});
```

- [ ] **Step 2: Run** `node --test tests/queue.test.js` → FAIL (module missing).

- [ ] **Step 3: Implement `sim/queue.js`**

```js
import { BALANCE } from './balance.js';
import { eraScale } from './data/compute.js';
import { addPipeline } from './contracts.js';

export const QUEUE_RELEASE = 15;     // × eraScale(3) units per turn
export const PREPAY_SHARE = 0.15;    // of the order's 24-month term value
export const QUEUE_TERM_MONTHS = 24;
export const ANNOUNCE_CHANCE = 0.25; // a standard rival announces it will prepay next turn
const TIERS = ['standard', 'prepaid'];

export const released = () => QUEUE_RELEASE * eraScale(3);
const queueOf = (state) => (state.compute.queue ??= { order: null, carry: null, last: null });

export function rivalOrders(state) {
  return state.rivals.filter((r) => !r.eastern).map((r) => ({
    lab: r.id,
    units: Math.round((2 + 4 * r.speed) * eraScale(3)),
    tier: r.speed >= 0.7 || r.prepayNext ? 'prepaid' : 'standard',
  }));
}

// Prepaid orders are filled first, then standard orders share what is left; both pro rata by
// order size with largest-remainder rounding, so the total never exceeds the supply.
export function allocate(supply, orders) {
  const got = Object.fromEntries(orders.map((o) => [o.lab, 0]));
  let left = supply;
  for (const tier of ['prepaid', 'standard']) {
    const group = orders.filter((o) => o.tier === tier && o.units > 0);
    const want = group.reduce((sum, o) => sum + o.units, 0);
    if (!want || left <= 0) continue;
    const give = Math.min(left, want);
    const raw = group.map((o) => ({ lab: o.lab, x: (o.units * give) / want }));
    let rest = give - raw.reduce((sum, r) => sum + Math.floor(r.x), 0);
    raw.sort((a, b) => (b.x % 1) - (a.x % 1));
    for (const r of raw) {
      got[r.lab] = Math.floor(r.x) + (rest > 0 ? 1 : 0);
      if (rest > 0) rest -= 1;
    }
    left -= give;
  }
  return got;
}

export function placeOrder(state, { units, tier } = {}) {
  if (state.era !== 3) return { ok: false, error: 'Verde rations through a queue only in era 3' };
  if (!Number.isInteger(units) || units < 1 || units > released(state)) return { ok: false, error: `order between 1 and ${released(state)} units` };
  if (!TIERS.includes(tier)) return { ok: false, error: `unknown tier ${tier}` };
  const q = queueOf(state);
  if (q.order) return { ok: false, error: 'one queue order per turn' };
  if (q.carry) return { ok: false, error: 'an earlier order is still waiting: withdraw it first' };
  let upfront = 0;
  if (tier === 'prepaid') {
    upfront = Math.round(PREPAY_SHARE * units * BALANCE.unitMonthlyCost * QUEUE_TERM_MONTHS);
    if (upfront > state.cash) return { ok: false, error: 'not enough cash to prepay' };
    state.cash -= upfront;
    state.raceHeat += 2;
  }
  q.order = { units, tier };
  return { ok: true, units, tier, upfront };
}

export function withdrawOrder(state) {
  const q = queueOf(state);
  if (!q.carry) return { ok: false, error: 'nothing is waiting in the queue' };
  q.carry = null;
  return { ok: true };
}

export function queueTurn(state, rng) {
  const q = queueOf(state);
  if (state.era !== 3) {
    q.order = null;
    q.carry = null;
    return [];
  }
  const events = [];
  const mine = q.order ?? q.carry;
  const orders = [...rivalOrders(state), ...(mine ? [{ lab: 'you', units: mine.units, tier: mine.tier }] : [])];
  const supply = released(state);
  const got = allocate(supply, orders);
  q.last = { released: supply, rows: orders.map((o) => ({ ...o, got: got[o.lab] })) };
  if (mine) {
    const filled = got.you;
    if (filled > 0) addPipeline(state, { supplier: 'verde', units: filled, price: 1.0, termMonths: QUEUE_TERM_MONTHS, arrivesTurn: state.turn + 1, string: null });
    q.carry = filled < mine.units ? { units: mine.units - filled, tier: mine.tier } : null;
    events.push({ type: 'queueFilled', units: filled, waiting: q.carry?.units ?? 0 });
  }
  q.order = null;
  for (const r of state.rivals) {
    if (r.eastern || r.speed >= 0.7 || r.prepayNext) continue;
    if (rng.chance(ANNOUNCE_CHANCE)) {
      r.prepayNext = true;
      events.push({ type: 'rivalPrepays', lab: r.id });
    }
  }
  return events;
}
```

(The prepaid upfront covers the whole order; a carried part keeps its tier and is not charged again.)

- [ ] **Step 4: Run** `node --test tests/queue.test.js` → PASS; `npm test` → all pass.
- [ ] **Step 5: Commit** — `git add sim/queue.js tests/queue.test.js && git commit -m "feat(sim): era 3 Verde allocation queue"`

---

### Task 4: Wire contracts, queue, power and the era scale into the turn

Precondition: plan 2A merged, plan 2B Tasks 3 and 7 merged, `main` merged into this branch. Read each function named below on the current branch before editing it; plan 2A changed several.

**Files:**
- Modify: `sim/state.js`, `sim/turn.js`, `sim/economy.js`, `sim/recipe.js`, `sim/internal.js`, `sim/president.js`, `tools/balance.js`, `ui/screens/company.js` (only if it imports from `sim/compute.js`), `tests/turn.test.js`, `tests/internal.test.js`, `tests/recipe.test.js`, `tests/training.test.js`, `tests/balance.test.js` (only the `todo` marker described in Step 7)
- Delete: `sim/compute.js`, `tests/compute.test.js`
- Create: `tests/compute-turn.test.js`

**Interfaces:**
- Consumes: Tasks 1–3; plan 2A's `pushFeed(state, handle, text, tag)`, `controlUnits(state)`, the `exportLicenses` stake in `sim/president.js`.
- Produces:
  - `state.compute` = `{ online, contracts, pipeline, servingUnits, overflow, offers, delays: {}, nextId, credits: 0, unpowered: 0, queue: null }`; `state.power` = `{ sites: [], nextId: 1 }`.
  - Moves `{ type: 'deal', offerId }`, `{ type: 'queueOrder', units, tier }`, `{ type: 'buildSite', source }`; free actions `actions.contractActions`, `actions.queueWithdraw`.
  - Events `computeArrived`, `spotWarning`, `spotPulled`, `queueFilled`, `rivalPrepays`, `siteOnline`, `contractEnded`.
  - `recipeCost(state, recipe).units` scales with `eraScale(state.era)`; `controlUnits` scales the same way.

- [ ] **Step 1: Write the failing tests**

```js
// tests/compute-turn.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { recipeCost } from '../sim/recipe.js';
import { computeRent } from '../sim/economy.js';
import { eraScale, SCALE_DOWN } from '../sim/data/compute.js';
import { allocate, rivalOrders, released } from '../sim/queue.js';

const offerOf = (s, supplier) => s.compute.offers.find((o) => o.supplier === supplier && !o.viaQueue);

test('offers exist from turn 0 and refresh every turn', () => {
  const s = createInitialState();
  assert.deepEqual(s.compute.offers.map((o) => o.supplier), ['verde', 'azuria', 'coreflame', 'spot']);
  assert.deepEqual(s.power, { sites: [], nextId: 1 });
  const { state } = endTurn(s, {}, createRng(1));
  assert.ok(state.compute.offers.every((o) => o.id.endsWith('-1')));
});

test('a deal move signs an offer, and the contract bill enters the burn when it arrives', () => {
  const s = createInitialState();
  const cf = offerOf(s, 'coreflame');
  const out = endTurn(s, { moves: [{ type: 'deal', offerId: cf.id }] }, createRng(2));
  assert.deepEqual(out.errors, []);
  assert.equal(out.state.compute.pipeline.length, 1);
  const next = endTurn(out.state, {}, createRng(3));
  assert.equal(next.state.compute.online, 10 + cf.units);
  assert.ok(next.events.some((e) => e.type === 'computeArrived' && e.supplier === 'coreflame'));
  assert.ok(computeRent(next.state) > computeRent(s));
  assert.equal(endTurn(s, { moves: [{ type: 'deal', supplierId: 'coreflame' }] }, createRng(2)).errors.length, 1);
});

test('contract actions run before moves', () => {
  const s = createInitialState();
  const out = endTurn(s, { contractActions: [{ id: 'starter', action: 'scaleDown' }] }, createRng(4));
  assert.deepEqual(out.errors, []);
  assert.equal(out.state.compute.contracts.find((c) => c.id === 'starter').units, 10 - Math.round(10 * SCALE_DOWN));
});

test('training runs cost more compute each era', () => {
  const s = createInitialState();
  const recipe = { sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: [] } };
  const e1 = recipeCost(s, recipe).units;
  s.era = 4;
  assert.equal(recipeCost(s, recipe).units, e1 * eraScale(4));
});

test('an era 3 queue order becomes a Verde contract the next turn', () => {
  const s = createInitialState();
  s.era = 3; s.turn = 8; s.turnInEra = 0;
  const want = released(s);
  const expected = allocate(want, [...rivalOrders(s), { lab: 'you', units: want, tier: 'standard' }]).you;
  const out = endTurn(s, { moves: [{ type: 'queueOrder', units: want, tier: 'standard' }] }, createRng(5));
  assert.deepEqual(out.errors, []);
  assert.ok(out.events.some((e) => e.type === 'queueFilled' && e.units === expected));
  const next = endTurn(out.state, {}, createRng(6));
  assert.ok(next.state.compute.contracts.some((c) => c.supplier === 'verde' && c.units === expected));
});

test('in era 4 new chips need site power, and the lease starts when the site is online', () => {
  const s = createInitialState();
  s.era = 4; s.turn = 12; s.turnInEra = 0; s.cash = 1e6;
  s.compute.contracts.push({ id: 'v', supplier: 'verde', units: 100, price: 1, monthsLeft: 24, needsPower: true, dark: false, string: null });
  const built = endTurn(s, { moves: [{ type: 'buildSite', source: 'gas' }] }, createRng(7));
  assert.deepEqual(built.errors, []);
  assert.equal(built.state.compute.online, 10);
  assert.equal(built.state.compute.unpowered, 100);
  assert.equal(built.state.power.sites[0].source, 'gas');
  // Bring the site forward instead of playing four turns, so the test never crosses the era 4 gate.
  const st = structuredClone(built.state);
  st.power.sites[0].arrivesTurn = st.turn;
  const next = endTurn(st, {}, createRng(8)).state;
  assert.equal(next.power.sites[0].online, true);
  assert.equal(next.compute.online, 10 + Math.min(100, next.power.sites[0].units));
});
```

- [ ] **Step 2: Run** `node --test tests/compute-turn.test.js` → FAIL.

- [ ] **Step 3: State.** In `sim/state.js`, import `generateOffers`, `sideRng` from `./contracts.js`. Replace the `compute` block with:

```js
    compute: {
      online: BALANCE.startCompute,
      contracts: [{ id: 'starter', supplier: 'starter', units: BALANCE.startCompute, price: 1, monthsLeft: 24, needsPower: false, string: null,
        arrivedTurn: 0, scaledDown: false, troubled: false, dark: false, bumpNext: false, exclusiveBought: false, headline: null }],
      pipeline: [],
      servingUnits: 0,
      overflow: 0,
      offers: [],
      delays: {},
      nextId: 1,
      credits: 0,
      unpowered: 0,
      queue: null,
    },
    power: { sites: [], nextId: 1 },
```

Build the state object into a `const state = { ... }`, then `state.compute.offers = generateOffers(state, sideRng(state, 0)); return state;`.

- [ ] **Step 4: Turn wiring** in `sim/turn.js`:
  - Imports: remove `signDeal, computeTurn` from `./compute.js`; add `signOffer, contractAction, contractsTurn, expireContracts, spendCredits, refreshOnline, generateOffers, sideRng` from `./contracts.js`, `placeOrder, withdrawOrder, queueTurn` from `./queue.js`, `buildSite, powerTurn` from `./power.js`, `pushFeed` from `./events.js`.
  - `applyMove`: replace `case 'deal'` with `case 'deal': return signOffer(state, move.offerId, sideRng(state, 1));` and add `case 'queueOrder': return placeOrder(state, move);` and `case 'buildSite': return buildSite(state, move.source, sideRng(state, 2));`.
  - In `endTurn`, right after the budget block and before the moves loop:

```js
  for (const a of actions.contractActions ?? []) {
    const r = contractAction(state, a);
    if (!r.ok) errors.push(r.error);
  }
  if (actions.queueWithdraw) {
    const r = withdrawOrder(state);
    if (!r.ok) errors.push(r.error);
  }
  if (actions.contractActions?.length) {
    updateServing(state);
    state.burnPlanned = projectBurn(state);
  }
```

  - Replace the `computeTurn` block with:

```js
    const c = contractsTurn(state, sideRng(state, 3));
    for (const x of c.arrived) events.push({ type: 'computeArrived', supplier: x.supplier, units: x.units });
    for (const x of c.bumped) events.push({ type: 'spotPulled', units: x.units });
    if (c.warnedBump) {
      events.push({ type: 'spotWarning' });
      pushFeed(state, '@marketwire', 'spot GPU capacity is being pulled for prepaid customers', 'warning');
    }
    for (const e of queueTurn(state, sideRng(state, 4))) {
      events.push(e);
      if (e.type === 'rivalPrepays') pushFeed(state, '@marketwire', `${state.rivals.find((r) => r.id === e.lab).name} prepays Verde for priority`, 'feed');
    }
    for (const e of powerTurn(state)) events.push(e);
    refreshOnline(state);
```

  - Right after `applyEconomy(state);` add:

```js
    spendCredits(state);
    for (const x of expireContracts(state)) events.push({ type: 'contractEnded', supplier: x.supplier, units: x.units });
```

  - At the very end of `endTurn`, just before the `if (state.ending) events.push(...)` line: `if (!state.ending) state.compute.offers = generateOffers(state, sideRng(state, 5));` (the turn and era have already advanced, so these are next turn's offers).
- [ ] **Step 5: Economy, runs, control and old callers**
  - `sim/economy.js`: import `monthlyBills, arrivingBills, creditOffset, addPipeline` from `./contracts.js`, `leaseBills` from `./power.js`, `eraScale` from `./data/compute.js`. Replace `computeRent` with `export const computeRent = (state) => monthlyBills(state) + leaseBills(state) - creditOffset(state);`. In `projectBurn` replace the `arrivingRent` expression with `arrivingBills(state)`. In `raiseRound`, delete the `strategic` block's `state.compute.pipeline.push(...)` line (the equity-for-compute offer replaces it; keep `state.flags.strategicStrings = true`). Also delete `units` and `costMult` from `INVESTORS.strategic`. In `useEmergency` `equityForCompute`, replace the pipeline push with `addPipeline(state, { supplier: 'rescue', units: 10, price: 0.5, termMonths: 24, arrivesTurn: state.turn + 1, string: 'moneyBack', needsPower: false });` (its own supplier id, so a failing lab is not also locked out of other clouds by Azuria exclusivity) (not era-scaled: the rescue's compute is a small sweetener, and scaling it would bill a failing lab hundreds of millions a month).
  - `sim/recipe.js` `recipeCost`: `units: Math.round(SIZE_UNITS[size] * mult * eraScale(state.era) * 10) / 10` (import `eraScale`).
  - `sim/internal.js` `controlUnits`: multiply by `eraScale(state.era)`; in `tests/internal.test.js` the `controlUnits(s)` expectation in era 3 becomes `20`.
  - `sim/president.js`, the `exportLicenses` stake: in eras 1–4 replace the pipeline push with `addPipeline(state, { supplier: 'verde', units: 8 * eraScale(state.era), price: 0.9, termMonths: 24, arrivesTurn: state.turn + 1, string: null, needsPower: false });` (licensed chips come installed at a partner site). In era 5 the stake adds no compute (spec §7: no new Verde orders in era 5); record it as `state.flags.exportLicenses = true` only.
  - Delete `sim/compute.js` and `tests/compute.test.js`. Afterwards `grep -rn "sim/compute.js\|from './compute.js'\|failChance\|costMult" sim ui tools` and `grep -rn "supplierId" sim ui tools` must return nothing (tests may still use `supplierId` in negative cases, and plan 2B's `tests/ui-game.test.js` only counts queued moves).
  - `tools/balance.js`: replace the CoreFlame line with `else if (availableUnits(state) < 5 * eraScale(state.era)) { const o = state.compute.offers.find((x) => x.supplier === 'coreflame'); if (o) moves.push({ type: 'deal', offerId: o.id }); }` (import `eraScale`).
  - `ui/screens/company.js` (if it imports `SUPPLIERS` or builds `{ type: 'deal', supplierId }`): list `state.compute.offers` (skip `viaQueue` and `grid`) with their existing card markup and send `{ type: 'deal', offerId: o.id }`. Task 7 restyles it.
  - `tests/turn.test.js` `a same-turn compute deal refreshes burn before a later emergency move`: build the deal move from the **spot** offer (`offerId` of `s.compute.offers.find((o) => o.supplier === 'spot')`): spot arrives during the move, so its bill enters the same-turn burn that the emergency move checks (CoreFlame now arrives next turn and would not). Keep the assertions.
  - `tests/turn.test.js` `only two moves per turn, and bad moves are reported`: use the CoreFlame and Azuria offers' ids for the first two moves and a third deal move of any id; assert the same things (the third move is reported).
  - `tests/recipe.test.js` (era 2 `midtraining opens in era 2 and compute multipliers stack`) and `tests/training.test.js` (`standard agent techniques mark era 4 models as agentic`): era scaling changes their unit numbers. Express the expected units as `Math.round(era1Value * eraScale(era) * 10) / 10` (the same rounding `recipeCost` uses; a bare product such as `10.4 * 3` is `31.200000000000003`), and give the era 4 run enough compute (`s.compute.online = recipeCost(s, recipe).units + 10`, safety share 0 once Task 5 lands). Do not change what they check.
- [ ] **Step 6: Run** `npm test`. Fix only mechanical fallout (renamed fields, the deal move shape, era-scaled unit numbers as listed above). Do not change what an existing test checks.
- [ ] **Step 7: Balance tests.** Run `npm test` again. If plan 2A's difficulty tests in `tests/balance.test.js` now fail only because the compute rework shifted balance, add `{ todo: 'plan 2C Task 8 re-tunes balance after the compute rework' }` as the options argument of exactly those tests (they still run and report). Task 8 removes the marker. Any other failure is a bug to fix here.
- [ ] **Step 8: Run** `npm test` → pass (todo tests reported, not failed); `npm run balance` completes. **Commit** — `feat(sim): wire contracts, queue, power sites and the era scale into the turn`

---

### Task 5: The compute split, the pledge, and safety leaving the money budget

**Files:**
- Create: `sim/split.js`, `tests/split.test.js`
- Modify: `sim/state.js`, `sim/turn.js` (`BUDGET_KEYS`, `setBudget`, `budgetEffects`, new actions), `sim/economy.js` (`projectBurn`, `safetySpend`, `updateServing` overflow), `sim/training.js` (`availableUnits`, `advanceRun`), `sim/advisors.js` (only if it still reads `state.budget.split.safety`), `sim/data/events.js` (`openletter`, `promise`), `tools/balance.js`, `ui/logic/actions.js` and `tests/ui-actions.test.js` (drop `safety`), and the tests listed in Step 6

**Interfaces:**
- Consumes: `controlUnits` (plan 2A), `SPOT_PRICE`, `RESALE`, `eraScale`.
- Produces (from `sim/split.js`): `MAX_SAFETY = 0.5`, `SAFETY_DEBT_RATE = 2.5`, `PLEDGES = [0.05, 0.1, 0.2]`, `setComputeSplit(state, split)` → `{ ok }`, `computeSlices(state)` → `{ online, need, control, safety, serving, shortfall, training, run, idle }`, `spotCover(state)` and `resaleCredit(state)` ($M per month), `safetyValue(state)` (era-normalized $M per month), `applySplitEffects(state)` → events, `makePledge(state, share)` → `{ ok }`.
  - `state.compute.split` = `{ safety: 0.1, servingCap: null, coverWithSpot: true, resellIdle: false }`.
  - `availableUnits(state)` = `computeSlices(state).idle`.
  - `state.budget` = `{ spend, split: { training, security, product, talent } }`.

- [ ] **Step 1: Write the failing tests**

```js
// tests/split.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { setComputeSplit, computeSlices, spotCover, resaleCredit, applySplitEffects, makePledge, safetyValue } from '../sim/split.js';
import { availableUnits } from '../sim/training.js';
import { setBudget } from '../sim/turn.js';

const at = (online, need, safety = 0.12) => {
  const s = createInitialState();
  s.compute.online = online;
  s.compute.servingUnits = need;
  s.compute.split.safety = safety;
  return s;
};

test('online compute splits into serving, control, safety and training', () => {
  const s = at(200, 90);
  s.activeRun = { units: 50, bonus: 0, turnsLeft: 1, spikes: 0, spikeChance: 0 };
  assert.deepEqual(computeSlices(s), { online: 200, need: 90, control: 0, safety: 24, serving: 90, shortfall: 0, training: 86, run: 50, idle: 36 });
  assert.equal(availableUnits(s), 36);
});

test('safety is kept before serving; a short fleet leaves a serving shortfall', () => {
  const s = at(100, 95, 0.1);
  const x = computeSlices(s);
  assert.equal(x.safety, 10);
  assert.equal(x.serving, 90);
  assert.equal(x.shortfall, 5);
  assert.equal(x.training, 0);
});

test('a serving cap leaves more for training', () => {
  const s = at(200, 90, 0);
  setComputeSplit(s, { servingCap: 60 });
  assert.equal(computeSlices(s).shortfall, 30);
  assert.equal(computeSlices(s).training, 140);
});

test('the split is validated', () => {
  const s = at(100, 0);
  assert.equal(setComputeSplit(s, { safety: 0.6 }).ok, false);
  assert.equal(setComputeSplit(s, { safety: -0.1 }).ok, false);
  assert.equal(setComputeSplit(s, { servingCap: -1 }).ok, false);
  assert.equal(setComputeSplit(s, { coverWithSpot: 'yes' }).ok, false);
  assert.equal(setComputeSplit(s, { safety: 0.2, resellIdle: true }).ok, true);
  assert.equal(s.compute.split.safety, 0.2);
});

test('spot covers a shortfall at the era price, or users suffer an outage', () => {
  const s = at(100, 95, 0.1);
  s.era = 3;
  assert.ok(Math.abs(spotCover(s) - 5 * 2.5 * 1.46) < 1e-9);
  s.compute.split.coverWithSpot = false;
  assert.equal(spotCover(s), 0);
  s.models.push({ active: true, users: 1000000, flags: [] });
  const pt = s.publicTrust;
  const ev = applySplitEffects(s);
  assert.ok(ev.some((e) => e.type === 'outage'));
  assert.ok(s.models[0].users < 1000000);
  assert.equal(s.publicTrust, pt - 2);
});

test('resale recovers the era share of idle compute', () => {
  const s = at(100, 0, 0);
  s.compute.split.resellIdle = true;
  assert.ok(Math.abs(resaleCredit(s) - 100 * 0.7 * 1.46) < 1e-9);
});

test('safety compute lowers alignment debt and is valued per era', () => {
  const s = at(100, 0, 0.2);
  const debt = s.alignmentDebt = 30;
  applySplitEffects(s);
  assert.ok(s.alignmentDebt < debt);
  assert.ok(Math.abs(safetyValue(s) - 20 * 1.46) < 1e-9);
});

test('the pledge is offered once in eras 1 and 2, and a lower share breaks it', () => {
  const s = at(100, 0, 0.1);
  assert.equal(makePledge(s, 0.15).ok, false);
  assert.equal(makePledge(s, 0.2).ok, true);
  assert.equal(makePledge(s, 0.1).ok, false);
  const e3 = at(100, 0); e3.era = 3;
  assert.equal(makePledge(e3, 0.1).ok, false);
  applySplitEffects(s);
  assert.equal(s.flags.brokenPromise, true);
});

test('the safety readers use the compute share', async () => {
  const { safetySpend } = await import('../sim/economy.js');
  const s = at(10, 0, 0.5);
  assert.ok(Math.abs(safetySpend(s) - safetyValue(s)) < 1e-9);
  assert.ok(safetySpend(s) >= 5, 'half of the starting fleet clears the interpretability threshold');
  s.compute.split.safety = 0;
  assert.equal(safetySpend(s), 0);
});

test('the money budget has no safety slice any more', () => {
  const s = createInitialState();
  assert.equal(setBudget(s, { spend: 20, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } }).ok, true);
  const r = setBudget(s, { spend: 20, split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 } });
  assert.equal(r.ok, false);
  assert.match(r.error, /safety/);
});
```

- [ ] **Step 2: Run** `node --test tests/split.test.js` → FAIL.

- [ ] **Step 3: Implement `sim/split.js`**

```js
import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { SPOT_PRICE, RESALE, eraScale } from './data/compute.js';
import { controlUnits } from './internal.js';

export const MAX_SAFETY = 0.5;
export const SAFETY_DEBT_RATE = 2.5; // alignment debt removed per quarter at a 100% share (first pass)
export const PLEDGES = [0.05, 0.1, 0.2];
const UNIT = BALANCE.unitMonthlyCost;

export function setComputeSplit(state, split = {}) {
  const next = { ...state.compute.split };
  if ('safety' in split) {
    if (!Number.isFinite(split.safety) || split.safety < 0 || split.safety > MAX_SAFETY) return { ok: false, error: 'the safety share must be between 0% and 50%' };
    next.safety = split.safety;
  }
  if ('servingCap' in split) {
    const v = split.servingCap;
    if (v !== null && (!Number.isFinite(v) || v < 0)) return { ok: false, error: 'the serving cap must be a number of units or null' };
    next.servingCap = v;
  }
  for (const k of ['coverWithSpot', 'resellIdle']) {
    if (k in split) {
      if (typeof split[k] !== 'boolean') return { ok: false, error: `${k} must be true or false` };
      next[k] = split[k];
    }
  }
  state.compute.split = next;
  return { ok: true };
}

// Spec §5.1: control and safety are set aside first, serving gets up to its need (or the cap),
// training gets the rest. Idle = training compute no run is using.
export function computeSlices(state) {
  const online = state.compute.online;
  const need = state.compute.servingUnits;
  const control = Math.min(online, controlUnits(state));
  const safety = Math.min(online - control, Math.round(online * state.compute.split.safety * 10) / 10);
  const cap = state.compute.split.servingCap ?? Infinity;
  const serving = Math.max(0, Math.min(need, cap, online - control - safety));
  const training = Math.max(0, online - control - safety - serving);
  const run = state.activeRun ? state.activeRun.units : 0;
  return { online, need, control, safety, serving, shortfall: Math.max(0, need - serving), training, run, idle: Math.max(0, training - run) };
}

export const spotCover = (state) =>
  (state.compute.split.coverWithSpot ? computeSlices(state).shortfall * SPOT_PRICE[state.era] * UNIT : 0);
export const resaleCredit = (state) =>
  (state.compute.split.resellIdle ? computeSlices(state).idle * RESALE[state.era] * UNIT : 0);
export const safetyValue = (state) => (computeSlices(state).safety * UNIT) / eraScale(state.era);

export function applySplitEffects(state) {
  const months = eraById(state.era).monthsPerTurn;
  state.alignmentDebt -= state.compute.split.safety * SAFETY_DEBT_RATE * (months / 3);
  const s = computeSlices(state);
  const events = [];
  if (!state.compute.split.coverWithSpot && s.shortfall > 0 && s.need > 0) {
    const loss = (s.shortfall / s.need) * 0.1;
    for (const m of state.models) if (m.active) m.users = Math.round(m.users * (1 - loss));
    state.publicTrust -= 2;
    events.push({ type: 'outage', shortfall: s.shortfall });
  }
  const pledge = state.promises.find((p) => p.type === 'safetyCompute');
  if (pledge && state.compute.split.safety + 1e-9 < pledge.share) {
    state.flags.brokenPromise = true;
    events.push({ type: 'pledgeBroken' });
  }
  return events;
}

export function makePledge(state, share) {
  if (state.era > 2) return { ok: false, error: 'the safety pledge is offered in eras 1 and 2' };
  if (!PLEDGES.includes(share)) return { ok: false, error: 'pledge 5%, 10% or 20% of compute' };
  if (state.promises.some((p) => p.type === 'safetyCompute')) return { ok: false, error: 'you already made a safety pledge' };
  state.promises.push({ type: 'safetyCompute', share, turn: state.turn });
  state.publicTrust += 3;
  state.staffTrust += 5;
  return { ok: true, share };
}
```

- [ ] **Step 4: Wire it**
  - `sim/state.js`: `state.compute.split = { safety: 0.1, servingCap: null, coverWithSpot: true, resellIdle: false }`; the default money budget becomes `{ spend: 20, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } }` (the old safety share folds into training, so talent spend, recipe slots and growth stay exactly as before); remove `overflow` from `state.compute`.
  - `sim/turn.js`: `BUDGET_KEYS = ['training', 'security', 'product', 'talent']`; at the top of `setBudget` add `if (budget?.split && Object.hasOwn(budget.split, 'safety')) return { ok: false, error: 'the budget split has no safety slice: safety now runs on compute' };`. In `budgetEffects` delete the `state.alignmentDebt -= split.safety ...` line. In `endTurn`, after the budget block: `if (actions.computeSplit) { const r = setComputeSplit(state, actions.computeSplit); if (!r.ok) errors.push(r.error); }` and `if (actions.pledge != null) { const r = makePledge(state, actions.pledge); if (!r.ok) errors.push(r.error); }`. After `budgetEffects(state);` add `for (const e of applySplitEffects(state)) events.push(e);`.
  - `sim/economy.js`: in `updateServing` delete the `state.compute.overflow = ...` line; in `projectBurn` replace the `spot` expression with `spotCover(state)` and subtract `resaleCredit(state)`; replace the body of plan 2A's `safetySpend(state)` with `return safetyValue(state);`.
  - `sim/training.js`: `export const availableUnits = (state) => computeSlices(state).idle;` and in `advanceRun` replace `state.compute.online < run.units` with `computeSlices(state).training < run.units`.
  - `sim/advisors.js`: if any expression still reads `state.budget.split.safety`, replace it with `state.compute.split.safety`.
  - `sim/data/events.js`: `openletter` "Meet their demands" effect becomes `state.compute.split.safety = Math.min(0.5, state.compute.split.safety + 0.1); state.staffTrust += 8;`. The `promise` event's trigger also fires when `state.flags.brokenPromise` is true, and both its choices also `delete state.flags.brokenPromise`.
  - `tools/balance.js`: remove `safety` from every strategy's money `split` (fold that share into `training`) and send `computeSplit: { safety: X }` with X = speed 0.02, safety 0.2, balanced 0.12, random `Math.round(rng.next() * 30) / 100`.
  - `ui/logic/actions.js`: `budgetFromSliders` takes `{ training, security, product, talent }`; update `tests/ui-actions.test.js` to those four keys (same assertions, spend values unchanged). In the same commit remove the `safety` entry from the budget dialog's slider data array so the running game never sends a budget the sim rejects (Task 7 adds the compute bar).
  - Outage feed post (spec §5.2): in `endTurn`, for an `outage` event call `pushFeed(state, '@downdetector', 'users report outages across your apps', 'feed')`.
- [ ] **Step 5: Run** `npm test`.
- [ ] **Step 6: Keep old tests testing what they tested.** Every test budget literal that has a `safety` key drops it (for example `tests/turn.test.js` `a new budget updates emergency eligibility…`). Plan 2A tests that switch on interpretability through the money share (`tests/hazards.test.js` `interpretability spend exposes a tenth…`, era 1, and `tests/launch.test.js` `interpretability spend cuts eval gaming`, era 4) instead give the lab enough safety compute for its era: `s.compute.online = 10 * eraScale(s.era); s.compute.split.safety = 0.5;` (so `safetySpend(s)` is 7.3, above the threshold of 5, in any era), add `assert.ok(safetySpend(s) >= 5)` as a precondition, and keep their expected numbers. Tests that assert exact free compute (in `tests/training.test.js`: `starting a run pays cash and reserves compute`, `a run fails to start without enough compute`, `a run pauses without reserved compute and resumes when capacity returns`; in `tests/turn.test.js`: `a due release consumes serving compute before move validation`) set `s.compute.split.safety = 0` in their setup. `tests/economy.test.js` `serving load uses compute and overflows at scale`: replace the two `overflow` assertions with `computeSlices(s).shortfall === 0` and `> 0` at the same two points.
- [ ] **Step 7: Run** `npm test` → pass; `npm run balance` completes. **Commit** — `feat(sim): compute split with serving, control, safety and training; safety leaves the money budget; the safety pledge`

---

### Task 6: Compute events

**Files:**
- Modify: `sim/data/events.js`, `sim/events.js` (`addressWarning` calls `defuse`), `sim/economy.js` (`updateServing` surge), `sim/contracts.js` (`refreshOnline` pooling), `sim/summit.js` (pooling stance), `sim/turn.js` (surge countdown)
- Create: `tests/compute-events.test.js`

**Interfaces:**
- Consumes: the event row format of `sim/data/events.js` (plan 2A Task 4): `{ id, kind, trigger(state, rng), warning, card: { title, post, choices: [{ id, label, cost, backers, opposers, effects(state) }] }, flag? }`, plus a new optional `defuse(state)`. Use the backer and opposer label strings already used in that file.
- Produces: event rows `neocloudTrouble`, `siteOpposition` (replaces the row `datacenter`, which is deleted), `pledgeDrop`, `agentSurge`, `pooling`; `state.compute.surge` = `null` or `{ mult, turnsLeft }`; `state.compute.pooled` (share, default 0); `state.flags.pooled`.

- [ ] **Step 1: Add the rows** (text and numbers exactly; the LAST choice is the do-nothing default):

| id | kind | trigger | warning | card title / post | choices (id · label · cost · effects) |
|---|---|---|---|---|---|
| `neocloudTrouble` | world (repeatable) | any contract with `troubled` | `@marketwire`: "CoreFlame's biggest customer missed a payment" | "Your neocloud is failing" / `@marketwire`: "CoreFlame's lenders call in a $4B loan" | `spot` · Move the capacity to spot · spot prices · every troubled contract: `supplier = 'spot'`, `price = SPOT_PRICE[era]`, `string = 'bumpable'`, `monthsLeft = null` (it renews like other spot), `troubled = false`; `rescue` · Prepay 3 months to keep them alive · 3 months of the bill · `cash −= RESCUE_MONTHS × contractBill(c)`, `troubled = false`; `letgo` · Let it go · lose the capacity · remove troubled contracts, `refreshOnline` |
| `siteOpposition` | world | if `state.flags.oppositionSite` is set, return true; otherwise, if a gas site is not yet online, roll `rng.chance(0.15)`; only on a hit pick the first such site, set `state.flags.oppositionSite = site.id` and `site.oppositionCut = rng.chance(0.3)`, and return true | `@localnews`: "residents pack the town hall over the new gas site" | "Local opposition to your gas site" / `@localnews`: "county votes to delay the permit" | `benefits` · Pay for community benefits · one month of the site's lease · `cash −= leaseMonthly(site.units)`; `move` · Move the site · two turns · `site.arrivesTurn += 2`; `push` · Push through · public trust · `publicTrust −= 5`; if `site.oppositionCut`, `site.units = Math.round(site.units * 0.7)` |
| `pledgeDrop` | world | `era === 2` and a `safetyCompute` promise exists | none | "An investor wants the pledge gone" / `@growthfund`: "safety pledges are a luxury at this stage" | `drop` · Drop the pledge · staff trust · `cash += Math.round(valuation × 0.05)`, `staffTrust −= 8`, remove the promise; `refuse` · Keep it · board support · every board member −2 |
| `agentSurge` | world | `era === 3` and an active model has flag `agentic` | none | "Agent launch swamps your servers" / `@marketwire`: "agent usage doubles overnight" | `spot` · Buy spot to keep up · spot prices · `surge = { mult: 2, turnsLeft: 2 }`, `split.coverWithSpot = true`; `route` · Route users to a cheaper model · public trust · `surge = { mult: 1.4, turnsLeft: 2 }`, `publicTrust −= 1`; `cap` · Cap serving and accept outages · users · `surge = { mult: 2, turnsLeft: 2 }`, `split.coverWithSpot = false` |
| `pooling` | world | `era === 4` and `turnInEra === ERAS[3].turns − 1` (the last era 4 turn, so the card is answered at the start of era 5, before the summit move); on first call set `state.flags.poolingRisk ??= rng.chance(0.2)` | none | "Washington asks for your compute" / `@commerce_dept`: "national AI effort to pool frontier compute" | `accept` · Give 30% of your compute · compute · `compute.pooled = 0.3`, `govFavor.us += 10`, `flags.pooled = true`, `refreshOnline`; `refuse` · Refuse · US favor · `govFavor.us −= 8`, `flags.supplyChainRisk ||= flags.poolingRisk` |

  - `neocloudTrouble` has `defuse(state)`: every troubled contract gets `troubled = false` (acting on the warning refinances CoreFlame early). In `sim/events.js` `addressWarning`, call `e.defuse?.(state)` as the **last** line before `return` (after its `seenEvents.push(id)`, so `defuse` can take the id back out). Because the event engine fires each non-internal event once per game, `defuse` and all three choices end with `state.seenEvents = state.seenEvents.filter((id) => id !== 'neocloudTrouble')`, so a later CoreFlame failure can fire again.
  - `agentSurge` choices store the player's earlier setting in the surge (`surge.restoreCover = split.coverWithSpot` before changing it); when the surge ends, restore `split.coverWithSpot = surge.restoreCover`.
  - Delete the `datacenter` row.
  - The humanoid serving card of spec §5.5 is not built: the humanoid line does not exist yet (open owner decision B7).
- [ ] **Step 2: Wire the effects**
  - `sim/economy.js` `updateServing`: multiply the final `units` by `state.compute.surge?.mult ?? 1` before storing `servingUnits`.
  - `sim/turn.js`: after `applyEconomy(state)`, `if (state.compute.surge && --state.compute.surge.turnsLeft <= 0) { state.compute.split.coverWithSpot = state.compute.surge.restoreCover ?? state.compute.split.coverWithSpot; state.compute.surge = null; }`.
  - `sim/contracts.js` `refreshOnline`: `state.compute.online = Math.floor(p.online * (1 - (state.compute.pooled ?? 0)));`.
  - `sim/summit.js`: add `+ (state.flags.pooled ? 0.1 : 0)` to every party's stance.
  - `sim/state.js`: `state.compute.surge = null`, `state.compute.pooled = 0`.
- [ ] **Step 3: Tests** (`tests/compute-events.test.js`):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, addressWarning, resolveEvent } from '../sim/events.js';
import { updateServing } from '../sim/economy.js';

const no = { next: () => 0.99, int: (a) => a, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const yes = { ...no, next: () => 0, chance: () => true };

test('a troubled neocloud warns first, then asks what to do', () => {
  const s = createInitialState();
  s.compute.contracts.push({ id: 'cf', supplier: 'coreflame', units: 5, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: true, string: 'fragile' });
  eventsTick(s, no);
  assert.ok(s.warnings.neocloudTrouble);
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'neocloudTrouble');
  assert.equal(resolveEvent(s, 'neocloudTrouble', 'letgo').ok, true);
  assert.equal(s.compute.contracts.some((c) => c.id === 'cf'), false);
});

test('acting on the neocloud warning refinances it', () => {
  const s = createInitialState();
  s.compute.contracts.push({ id: 'cf', supplier: 'coreflame', units: 5, price: 1, monthsLeft: 12, needsPower: false, dark: false, troubled: true, string: 'fragile' });
  eventsTick(s, no);
  assert.equal(addressWarning(s, 'neocloudTrouble').ok, true);
  assert.equal(s.compute.contracts.find((c) => c.id === 'cf').troubled, false);
});

test('opposition to a gas site: pushing through can cut the site', () => {
  const s = createInitialState();
  s.era = 4;
  s.power.sites.push({ id: 'gas-1', source: 'gas', units: 400, arrivesTurn: 99, online: false, oppositionCut: null });
  eventsTick(s, yes);
  assert.ok(s.warnings.siteOpposition);
  s.turn += 1;
  eventsTick(s, yes);
  resolveEvent(s, 'siteOpposition', 'push');
  assert.equal(s.power.sites[0].units, 280);
});

test('the agent surge doubles serving demand', () => {
  const s = createInitialState();
  s.compute.online = 1000;
  s.models.push({
    name: 'Kestrel 1 Core', active: true, activeFromTurn: 0, channel: 'consumer', priceStance: 'market', users: 4e6, userCap: 16e6, servingCost: 0,
    spec: { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' },
  });
  const base = updateServing(s);
  s.compute.surge = { mult: 2, turnsLeft: 2 };
  assert.ok(base > 0);
  assert.ok(Math.abs(updateServing(s) - 2 * base) < 1e-9);
});

test('pooling takes a share of compute for US favor, decided before the summit', () => {
  const s = createInitialState();
  s.era = 4; s.turnInEra = 3;
  eventsTick(s, no);
  const gov = s.govFavor.us;
  resolveEvent(s, 'pooling', 'accept');
  assert.equal(s.govFavor.us, gov + 10);
  assert.equal(s.compute.online, 7);
  assert.equal(s.flags.pooled, true);
});

test('the old data-center event is gone', async () => {
  const { EVENTS } = await import('../sim/data/events.js');
  assert.equal(EVENTS.some((e) => e.id === 'datacenter'), false);
});
```

(If the first gas-site test sees other world events fire under `yes`, set `s.seenEvents` to every other world event id before ticking so only `siteOpposition` can fire.)
- [ ] **Step 4: Run** `npm test` → pass; `npm run balance` completes. **Commit** — `feat(sim): compute events — neocloud trouble, site opposition, pledge pressure, agent surge, pooling`

---

### Task 7: The four compute screens

Precondition: plan 2B Tasks 2, 3 and 7 merged. Load the owner's `design` skill before starting; every screen is rendered and looked at before it counts as done.

**Files:**
- Create: `ui/logic/compute.js`, `ui/screens/compute.js`, `ui/screens/sites.js`, `tests/ui-compute.test.js`
- Modify: `ui/logic/format.js` (+ `tests/ui-format.test.js`), `ui/hud.js`, `ui/screens/budget.js`, `ui/screens/company.js`, `ui/menu.js`, `ui/logic/scenarios.js`, `ui/styles.css`

**Interfaces:**
- Consumes: `computeSlices`, `PLEDGES` (`sim/split.js`); `allocate`, `rivalOrders`, `released`, `PREPAY_SHARE` (`sim/queue.js`); `SITE_TYPES`, `leaseMonthly`, `sitePower` (`sim/power.js`); `monthlyBills`, `contractBill`, `exclusiveActive` (`sim/contracts.js`); `runway`, `projectBurn` (`sim/economy.js`); `MW_PER_UNIT`, `eraScale` (`sim/data/compute.js`); plan 2B's `dialog`, `vslider`, `money`, `months`, `createGame`.
- Produces (all pure, in `ui/logic/compute.js` unless noted):
  - `format.compute(units, era)` in `ui/logic/format.js` → eras 1–3 `"40 units"`; from era 4 `"850 MW"` below 1,000 MW, else `"1.53 GW"` (two decimals, trailing zeros kept only to two places: `"1.20 GW"` is fine). The HUD compute line uses it.
  - `dealCards(state)` → `[{ id, supplier, name, kind, big, unit, per, rows: [[label, value]], chip, explanation, disabled, reason, viaQueue }]` in the order of `state.compute.offers`. Chips and explanations: no strings "No strings" / "Cheapest per unit. Slow, and you pay upfront."; `exclusive` "Exclusive" / "No other cloud deals while it runs."; `fragile` "Fragile" / "Runs on borrowed money. It can go under."; `bumpable` "Can be taken back" / "Pulled first when chips run short."; `moneyBack` "Money comes back" / "The credits only pay Azuria bills."; `usGated` "Needs US approval" / "Washington can pull the license."; `shrinks` "Headline shrinks" / "Delivers 30 to 100% of the headline."; `gridReservation` "Power for era 4" / "Reserve a grid connection now; it comes online in era 4.". `disabled` with a reason when exclusivity blocks it or cash is short.
  - `commitmentsView(state, offerId?)` → `{ billNow, billAfter, afterFromTurn, segments: [{ id, bill, isNew }], rows: [{ id, name, units, bill, monthsLeft, canScaleDown, canBuyout, unpowered }], runwayNow, runwayAfter }`.
  - `queueView(state, draft = { units, tier })` → `{ released, rows: [{ lab, name, tier, ordered, got }], you: { standard, prepaid, upfront }, announcements }`, where `you.standard` and `you.prepaid` are the units you would get now under each tier (via `allocate`). Rows list every rival plus you; the Eastern lab's row has `tier: 'none'`, `ordered: 0`, `got: 0`.
  - `computeBar(state)` → `{ online, segments: [{ key: 'serving'|'control'|'safety'|'training'|'idle', units }], needMarker, pledgeMarker: { share, kept } | null }`.
  - `sitesView(state)` → `{ powerOnline, chipsNeedingPower, unpowered, unpoweredBill, nextArrival, options: [{ source, name, units, readyIn, lease, tags, disabled, reason }], sites: [{ id, name, source, units, status, progress, warning }] }`.
  - `opinions(state, screen)` → four `{ id, mood, text }` for `screen` ∈ `deals | queue | budget | power`, rule-based from state (for example CFO on `deals`: "Take-or-pay: we pay every month, even if the chips sit idle."; Head of Research on `power` when `unpowered > 0`: "<N> of chips are sitting dark. We could be training on them."). Mood comes from `state.lastBriefing`. Lines never show hidden numbers.
- [ ] **Step 1: Pure-logic tests** (`tests/ui-compute.test.js` and additions to `tests/ui-format.test.js`):

```js
// tests/ui-compute.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { dealCards, commitmentsView, queueView, computeBar, sitesView, opinions } from '../ui/logic/compute.js';
import { BALANCE } from '../sim/balance.js';
import { allocate, rivalOrders, released } from '../sim/queue.js';

test('deal cards mirror the offers and name each catch', () => {
  const s = createInitialState();
  const cards = dealCards(s);
  assert.deepEqual(cards.map((c) => c.supplier), s.compute.offers.map((o) => o.supplier));
  assert.equal(cards.find((c) => c.supplier === 'azuria').chip, 'Exclusive');
  assert.equal(cards.find((c) => c.supplier === 'verde').chip, 'No strings');
});

test('commitments show the bill before and after signing', () => {
  const s = createInitialState();
  const v = s.compute.offers.find((o) => o.supplier === 'verde');
  const c = commitmentsView(s, v.id);
  assert.ok(c.billAfter > c.billNow);
  assert.equal(c.segments.at(-1).isNew, true);
  assert.ok(c.runwayAfter <= c.runwayNow);
});

test('the queue preview compares standard and prepaid', () => {
  const s = createInitialState();
  s.era = 3;
  const q = queueView(s, { units: 60, tier: 'standard' });
  assert.equal(q.released, released(s));
  assert.equal(q.you.standard, allocate(released(s), [...rivalOrders(s), { lab: 'you', units: 60, tier: 'standard' }]).you);
  assert.equal(q.you.prepaid, allocate(released(s), [...rivalOrders(s), { lab: 'you', units: 60, tier: 'prepaid' }]).you);
  assert.equal(q.rows.find((r) => r.lab === 'qilin').tier, 'none');
});

test('the compute bar adds up to online compute and marks the pledge', () => {
  const s = createInitialState();
  s.compute.online = 200; s.compute.servingUnits = 90; s.compute.split.safety = 0.12;
  s.promises.push({ type: 'safetyCompute', share: 0.1, turn: 0 });
  const b = computeBar(s);
  assert.equal(b.segments.reduce((sum, x) => sum + x.units, 0), 200);
  assert.deepEqual(b.pledgeMarker, { share: 0.1, kept: true });
  assert.equal(b.needMarker, 90);
});

test('the sites view counts dark chips and their bill', () => {
  const s = createInitialState();
  s.era = 4;
  s.compute.contracts.push({ id: 'v', supplier: 'verde', units: 700, price: 1, monthsLeft: 24, needsPower: true, dark: false, string: null });
  s.power.sites.push({ id: 'grid-1', source: 'grid', units: 500, arrivesTurn: 0, online: true, oppositionCut: null });
  const v = sitesView(s);
  assert.equal(v.unpowered, 200);
  assert.ok(Math.abs(v.unpoweredBill - 200 * BALANCE.unitMonthlyCost) < 1e-9);
});

test('each screen gets four advisor opinions without hidden numbers', () => {
  const s = createInitialState();
  for (const screen of ['deals', 'queue', 'budget', 'power']) {
    const o = opinions(s, screen);
    assert.equal(o.length, 4);
    assert.ok(o.every((x) => typeof x.text === 'string' && !/alignmentDebt|misuse/.test(x.text)));
  }
});
```

```js
// add to tests/ui-format.test.js
import { compute } from '../ui/logic/format.js';
test('compute is shown in units until era 4, then in power', () => {
  assert.equal(compute(40, 2), '40 units');
  assert.equal(compute(500, 4), '850 MW');
  assert.equal(compute(900, 4), '1.53 GW');
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `ui/logic/compute.js` and `format.compute` until the tests pass.
- [ ] **Step 4: Screens** (match `docs/design/mockups/K2-compute.html` state by state; GDT dialog shell from plan 2B with Team panel left, content centre, status panel right):
  - `ui/screens/compute.js` **Sign a compute deal** (`#deals`): centre = `dealCards` as cards (monogram, name, kind, big number, `per` line, the five rows, catch chip and explanation; selected card has the wood ring and a "Selected" tag; disabled cards greyed with the reason); right = **Commitments** from `commitmentsView` (bill now and after, the stacked bill bar with the new contract striped, one row per contract with "Scale down 30%" / "Break" / "Buy out" buttons → `game.setField('contractActions', [...])`, runway now and after); footer "Signing uses 1 of 2 moves this turn · pay $X now" and the orange **Sign** → `game.addMove({ type: 'deal', offerId })`. The grid card signs the same way.
  - Same file, **Verde allocation** (`#queue`, era 3; opened from the Verde queue card): centre = supply bar (prepaid first), one row per lab with an ordered-versus-served bar, the Eastern lab greyed "Can't buy", announcement line; right of centre = **Your order** box (horizontal order slider, Standard/Prepaid switch, the two outcome boxes from `queueView`, **Order** → `game.addMove({ type: 'queueOrder', units, tier })`); right panel **Why order** (next run's need, free training compute, shortfall).
  - `ui/screens/budget.js` (`#budget`): the slider data array loses its `safety` entry (four money sliders); below the money row add the full-width **compute allocation bar** from `computeBar` with two drag handles (the serving cap and the safety share, keyboard accessible with arrow keys, 24 px targets), the "users need N" and "pledge X% · kept/broken" markers, the legend, and the two toggles (cover shortfalls with spot, resell idle compute); in eras 1–2, if no pledge exists, a "Make a public pledge" row with 5/10/20% → `game.setField('pledge', share)`. OK sends `setBudget` plus `game.setField('computeSplit', {...})`. Right panel **This turn**: money spend, compute bill, idle cost, runway, pledge status.
  - `ui/screens/sites.js` **Power sites** (`#power`, era 4, Company submenu "Power sites"): centre = the power meter (powered teal, unpowered coral striped with "still billed $X/mo", a power line marker, a dashed marker where the next site arrives, a legend that does not rely on colour alone), then the site option cards with their small isometric drawings (reuse the SVG generator functions from `docs/design/mockups/source/build_compute_mockup.py`, ported to JS or emitted as static SVG files under `ui/assets/sites/`), then **Build** → `game.addMove({ type: 'buildSite', source })`; right panel **Your sites** (status, progress bars, opposition warning line).
  - `ui/screens/company.js`: "Sign a compute deal" opens the new screen; era 4 adds "Power sites".
  - `ui/hud.js`: the compute line in the info-box drop-down uses `format.compute`.
  - `ui/logic/scenarios.js`: add `era2Deals`, `era3Queue`, `era4Power`, `era3Budget`, each built by running `endTurn` with scripted actions (never by hand-editing hidden fields).
- [ ] **Step 5: Look at them.** `tools/shot.sh era2Deals '#deals'`, `tools/shot.sh era3Queue '#queue'`, `tools/shot.sh era3Budget '#budget'`, `tools/shot.sh era4Power '#power'`; compare each with its mockup PNG; fix differences in structure, spacing and hierarchy; check the 1000 × 700 small shots fit. Numbers will differ from the mockup (they come from the sim); structure must not.
- [ ] **Step 6: Run** `npm test`. **Commit** — `feat(ui): compute deals, allocation queue, compute split and power sites screens`

---

### Task 8: Balance with compute

Precondition: plan 2A Task 8 merged.

**Files:**
- Modify: `tools/balance.js`, `sim/data/compute.js`, `sim/power.js`, `sim/split.js`, `sim/balance.js` and data tables (numbers only), `tests/balance.test.js` (remove the Task 4 `todo` markers)
- Create: `tests/compute-balance.test.js`

**Interfaces:**
- Consumes: everything above; plan 2A's `report(n)` in `tools/balance.js`.
- Produces: `report(n)` rows gain `perEra: { [era]: { computeShare, arr, turns } }`, `queueShortTurns`, `queueTurns`, `meanRankAtEra4End`; new strategies `overCommitter`, `handToMouth`, `balancedNoGrid`, `balancedLowSafety`, `balancedHighSafety`; `export const PROBES = ['overCommitter', 'handToMouth', 'balancedNoGrid', 'balancedLowSafety', 'balancedHighSafety']`. Plan 2A's difficulty tests in `tests/balance.test.js` loop over every report row; change their loops to skip `PROBES` (the one-third and era 3–4 rules apply to the four scripted strategies only).

- [ ] **Step 1: Compute policies** in `tools/balance.js` (each strategy returns `computeSplit` and compute moves; keep at most two moves per turn, training and release first):
  - `speed`: signs the largest Verde offer each era when it has cash for the upfront; prepaid queue order sized to its next run in era 3; builds gas in era 4; safety share 0.02; pledges 10% in era 1 and never keeps it (share stays 0.02).
  - `safety`: signs Azuria or CoreFlame sized to its next run's need; pledges 20% and keeps it (share 0.2); builds nuclear in era 4.
  - `balanced`: reserves the grid in era 2; signs the cheapest offer that covers the next run's shortfall; standard queue order in era 3; safety share 0.12.
  - `random`: random offer, tier, site and safety share (0–0.3).
  - Probes: `overCommitter` signs the largest offer every turn; `handToMouth` signs only spot. A/B variants: `balancedNoGrid` (no grid reservation), `balancedLowSafety` (share 0.05), `balancedHighSafety` (share 0.15).
  - Record per era: the mean share of burn that is compute (`monthlyBills + leaseBills + spotCover`) ÷ `burnPlanned`, mean ARR at era end, and, in era 3, how many turns left at least one lab short (`state.compute.queue.last.rows.some((r) => r.got < r.units)`).
- [ ] **Step 2: Targets as tests** (`tests/compute-balance.test.js`):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { report } from '../tools/balance.js';

const N = 200;
const r = report(N);
const wins = (row) => ['aligned', 'pacingDeal', 'pyrrhic'].reduce((s, k) => s + (row.endings[k] ?? 0), 0);
const misaligned = (row) => (row.endings.misalignment ?? 0) + (row.endings.quietTakeover ?? 0);

test('over-committing mostly ends in running out of money', () => {
  assert.ok((r.overCommitter.endings.acquihire ?? 0) / N >= 0.6, JSON.stringify(r.overCommitter.endings));
});

test('renting only spot almost never wins', () => {
  assert.ok(wins(r.handToMouth) / N <= 0.1);
});

test('reserving the grid in era 2 pays off in era 4', () => {
  assert.ok(r.balanced.meanRankAtEra4End < r.balancedNoGrid.meanRankAtEra4End);
});

test('safety compute matters', () => {
  const low = misaligned(r.balancedLowSafety);
  const high = misaligned(r.balancedHighSafety);
  assert.ok(low >= high * 1.3 && low - high >= 5, `low ${low}, high ${high}`);
});

test('compute is most of the money, as for real labs', () => {
  for (const [era, row] of Object.entries(r.balanced.perEra)) {
    if (row.turns < 20) continue;
    assert.ok(row.computeShare >= 0.4 && row.computeShare <= 0.7, `era ${era}: ${row.computeShare}`);
  }
});

test('the era 3 queue leaves someone short most turns', () => {
  assert.ok(r.balanced.queueShortTurns / Math.max(1, r.balanced.queueTurns) >= 0.5);
});
```

  `report` must also expose `meanRankAtEra4End` per strategy (the player's `rank(state)` when era 4 ends, averaged over runs that reach that point).
- [ ] **Step 3: Tune** only numbers until both `tests/balance.test.js` (with the `todo` markers removed) and `tests/compute-balance.test.js` pass. Levers in this order (compute spec §11b): `ERA_SCALE` (fallback `[1, 3, 8, 30, 80]`), `LEASE_RATE`, offer prices and sizes, serving demand per user, round shares; revenue and valuation formulas last. Print ARR and compute bills per era in the CLI output (`npm run balance`) and check the money-scale path: balanced runs should reach roughly $0.5B ARR by era 3 and $2–4B by era 4.
- [ ] **Step 4: Run** `npm test` (all pass, no `todo` left in `tests/balance.test.js`) and `npm run balance`. **Commit** — `balance: re-tune with compute (difficulty and compute targets pass)`; record every changed number and the final report in the commit message.

---

## Self-review notes (for the orchestrator)

- Spec coverage: §2 era scale and display → Tasks 1, 4, 7; §3 contracts, strings, billing → Task 2 (wired in Task 4); §4 queue → Task 3 (wired in Task 4); §5.1–5.4 split and pledge → Task 5; §5.5 pressure cards → Task 6 (the humanoid card is not built: no humanoid line yet); §6 power and opposition → Tasks 1, 4, 6; §7 era 5 → Task 2 offer menu, Task 6 pooling; §8 state → Tasks 4–6; §9 screens → Task 7; §10 coordination → sequencing table and Tasks 4–6; §11 tests → every task; §11b balance → Task 8.
- Plan 2A constraints handled: events fire once per game (`seenEvents`), so site opposition is one-shot, while neocloud trouble removes itself from `seenEvents` to stay repeatable; `effects(state)` has no rng, so the 30% site cut is rolled when the warning fires; plan 2A's difficulty tests are marked `todo` between Tasks 4 and 8 rather than weakened.
- Spot "available now" means it arrives during the move, so a run started later in the same turn can use it.

## Review record (2026-09-25)

The Codex adversarial pass could not run (Codex auth failed: "refresh token was revoked"); a fresh Opus reviewer ran instead, read-only. It re-ran Tasks 1–3's code and tests (25 new, 117 total, all passing) and returned REVISE with 11 important findings. The Codex pass is still owed once `codex login` is fixed. Outcomes:

- Fixed:
  1. Spot could never be pulled back, because it expired first. Spot now renews each turn until broken (free) or pulled.
  2. The new default money budget changed talent slots and gains. The safety share now folds into training.
  3. Plan 2A's interpretability tests broke. They are listed in Task 5 Step 6 and switch to the compute share.
  4. The same-turn deal test's fix still failed. It now uses spot.
  5. Era scaling broke two tests. They are listed in Task 4.
  6. The power test crossed the era 4 gate and was flaky. It now brings the site forward instead.
  7. Tests hard-coded tuned numbers. Expectations now come from exports, and rival speed is pinned where it matters. Re-verified with `ERA_SCALE = [1, 3, 8, 30, 80]` and a unit price of 2.1: all pass.
  8. The UI seams were not in plan 2B's text. The stop rule now covers sim seams only, and Task 7 builds the UI seams if missing.
  9. Pooling was answered after the summit. It now fires on the last era 4 turn.
  10. The era 5 export-license stake caused a ruinous bill. It gives no compute in era 5 and brings its own power before that.
  11. The emergency rescue deepened debt. Its units are no longer era-scaled.
  - Minor findings fixed: the grep check; a new queue order no longer drops a waiting order; CoreFlame trouble can recur; the surge restores the spot-cover setting; the outage feed post; a test for the compute-share safety readers; probes are excluded from the one-third rule; the site-opposition roll order is spelled out; the budget slider loses safety in the same commit as the sim; equity-for-compute counts as an Azuria contract for exclusivity; the Gulf offer is hidden under supply-chain risk; the move-limit test is fixed.
- Not fixed, with reasons:
  - "One board member switches to favoring speed" (spec §3.2): the board has no preference model, only support numbers. The equity card costs every member 3 support instead.
  - Spite orders have no effect on rivals: rivals have no compute model. A spite order only raises race heat and costs the player the delivered chips, as the spec says.
  - The interpretability threshold works out to about 3.4 × `ERA_SCALE` safety units, against 3 × in the spec. That is close enough, and it keeps plan 2A's `safetySpend ≥ 5` rule unchanged.
