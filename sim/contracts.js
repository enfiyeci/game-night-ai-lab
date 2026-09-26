import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { createRng } from './rng.js';
import {
  SUPPLIERS, SPOT_PRICE, eraScale, FRAGILE_MONTHLY, BUMP_CHANCE, GULF_OPEN, GULF_REVOKE, EQUITY_SHARE,
  SCALE_DOWN, SCALE_DOWN_PENALTY_MONTHS, BREAK_SHARE, BUYOUT_MONTHS,
} from './data/compute.js';
import { SITE_TYPES, reserveGrid, poweredUnits } from './power.js';

const UNIT = BALANCE.unitMonthlyCost;
const FAMILY = { azuriaEquity: 'azuria', loi: 'verde' };
export const family = (key) => (Object.hasOwn(FAMILY, key) ? FAMILY[key] : key);

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
      if (!state.power.sites.some((x) => x.source === 'grid')) offers.push({ id, supplier: key, upfront: SITE_TYPES.grid.upfront, string: s.string });
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
    needsPower: p.needsPower ?? (p.supplier === 'verde' && state.era >= 4), string: p.string, arrivedTurn: p.arrivesTurn ?? state.turn,
    scaledDown: false, troubled: false, dark: p.dark ?? false, bumpTurn: null, exclusiveBought: false, headline: p.headline ?? null,
  };
  state.compute.contracts.push(c);
  return c;
}

export function refreshOnline(state) {
  const p = poweredUnits(state);
  state.compute.online = Math.floor(p.online * (1 - (state.compute.pooled ?? 0)));
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
  state.compute.deals ??= [];
  state.compute.deals.push({ supplier: f, turn: state.turn });
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

// Called once the turn has advanced, so what is due on turn T is online while the player plans turn T.
export function deliverDue(state, rng, due = (p) => p.arrivesTurn <= state.turn) {
  const arrived = [];
  state.compute.pipeline = state.compute.pipeline.filter((p) => {
    if (!due(p)) return true;
    arrived.push(arrive(state, p, rng));
    return false;
  });
  syncContracts(state);
  refreshOnline(state);
  return arrived;
}

// No randomness. Runs only after delivery, at the start of a turn, so a new era's spot price and a
// changed Gulf license show in the state the player plans with and then hold for the whole turn:
// the compute a turn uses is the compute it is billed for.
export function syncContracts(state) {
  for (const c of state.compute.contracts) {
    if (c.supplier === 'spot') c.price = SPOT_PRICE[state.era]; // renewals pay today's spot price
    if (c.supplier === 'gulf') {
      if (state.govFavor.us < GULF_REVOKE || state.flags.supplyChainRisk) c.dark = true;
      else if (state.govFavor.us >= GULF_OPEN) c.dark = false;
    }
  }
  for (const p of state.compute.pipeline) {
    if (p.supplier === 'gulf') {
      if (state.govFavor.us < GULF_REVOKE || state.flags.supplyChainRisk) p.dark = true;
      else if (state.govFavor.us >= GULF_OPEN) p.dark = false;
    }
  }
}

// Called at turn end, before plan 2A's event tick, so a CoreFlame failure is warned about the same turn.
export function contractsTurn(state, rng) {
  const months = eraById(state.era).monthsPerTurn;
  const spots = state.compute.contracts.filter((c) => c.supplier === 'spot' && c.bumpTurn == null && c.arrivedTurn <= state.turn);
  const warnedBump = spots.length > 0 && rng.chance(BUMP_CHANCE[state.era] ?? 0);
  if (warnedBump) for (const c of spots) c.bumpTurn = state.turn + 1; // serves (and bills) one more turn
  for (const c of state.compute.contracts) {
    if (c.arrivedTurn > state.turn) continue;
    if (c.supplier === 'coreflame' && !c.troubled && rng.chance(perTurn(FRAGILE_MONTHLY, months))) c.troubled = true;
  }
  return { warnedBump };
}

// Called after the economy has billed the turn, so the last month of a term is still paid.
export function expireContracts(state) {
  const months = eraById(state.era).monthsPerTurn;
  const expired = [];
  state.compute.contracts = state.compute.contracts.filter((c) => {
    if (c.arrivedTurn > state.turn) return true;
    if (c.monthsLeft == null) return true; // spot rolls over
    c.monthsLeft -= months;
    if (c.monthsLeft > 1e-9) return true;
    expired.push(c);
    return false;
  });
  refreshOnline(state);
  return expired;
}

// Called after the economy, like expireContracts, so a pulled spot contract pays for its last turn.
export function pullBumped(state) {
  const pulled = state.compute.contracts.filter((c) => c.bumpTurn != null && c.bumpTurn <= state.turn);
  state.compute.contracts = state.compute.contracts.filter((c) => !pulled.includes(c));
  refreshOnline(state);
  return pulled;
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
    const supplier = family(c.supplier);
    if (state.compute.delays[supplier] !== 1) {
      for (const offer of state.compute.offers) {
        if (family(offer.supplier) === supplier && typeof offer.arrivesIn === 'number') offer.arrivesIn += 1;
      }
    }
    state.compute.delays[supplier] = 1;
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
