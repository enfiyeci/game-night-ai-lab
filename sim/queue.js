import { BALANCE } from './balance.js';
import { SUPPLIERS, eraScale } from './data/compute.js';
import { addPipeline } from './contracts.js';

export const QUEUE_RELEASE = 7;      // × eraScale(3) units per turn
export const RIVAL_ORDER = 4.5;      // × eraScale(3) units ordered by a rival of average Western speed
export const PREPAY_SHARE = 0.15;    // of the order's 24-month term value
export const QUEUE_TERM_MONTHS = 24;
export const ANNOUNCE_CHANCE = 0.25; // a standard rival announces it will prepay next turn
const TIERS = ['standard', 'prepaid'];

export const released = () => QUEUE_RELEASE * eraScale(3);
const queueOf = (state) => (state.compute.queue ??= { order: null, carry: null, last: null });

// Relative to the Western rivals' speeds, so a rival-speed re-tune does not change the queue:
// the fastest Western rival prepays; the others order standard until they announce a switch.
export function rivalOrders(state) {
  const west = state.rivals.filter((r) => !r.eastern);
  const mean = west.reduce((sum, r) => sum + r.speed, 0) / west.length;
  const fastest = Math.max(...west.map((r) => r.speed));
  return west.map((r) => ({
    lab: r.id,
    units: Math.round(RIVAL_ORDER * (r.speed / mean) * eraScale(3)),
    tier: r.speed === fastest || r.prepayNext ? 'prepaid' : 'standard',
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
    upfront = Math.round(PREPAY_SHARE * units * SUPPLIERS.verde.price * BALANCE.unitMonthlyCost * QUEUE_TERM_MONTHS);
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
    if (filled > 0) addPipeline(state, { supplier: 'verde', units: filled, price: SUPPLIERS.verde.price, termMonths: QUEUE_TERM_MONTHS, arrivesTurn: state.turn + 1, string: null });
    q.carry = filled < mine.units ? { units: mine.units - filled, tier: mine.tier } : null;
    events.push({ type: 'queueFilled', units: filled, waiting: q.carry?.units ?? 0 });
  }
  q.order = null;
  const prepaid = new Set(orders.filter((o) => o.tier === 'prepaid').map((o) => o.lab));
  for (const r of state.rivals) {
    if (r.eastern || prepaid.has(r.id)) continue;
    if (rng.chance(ANNOUNCE_CHANCE)) {
      r.prepayNext = true;
      events.push({ type: 'rivalPrepays', lab: r.id });
    }
  }
  return events;
}
