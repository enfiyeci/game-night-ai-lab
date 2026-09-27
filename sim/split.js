import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { RESALE, eraScale, spotPrice } from './data/compute.js';
import { controlUnits } from './automation.js';
import { activeModels, safetyUnits } from './serving.js';

export const MAX_SAFETY = 0.5;
export const SAFETY_DEBT_RATE = 30; // alignment debt removed per quarter at a 100% share
export const PLEDGES = [0.05, 0.1, 0.2];
const SPLIT_KEYS = ['safety', 'servingCap', 'coverWithSpot', 'resellIdle'];
const UNIT = BALANCE.unitMonthlyCost;

export function setComputeSplit(state, split) {
  if (typeof split !== 'object' || split === null || Array.isArray(split)) return { ok: false, error: 'the compute split must be an object' };
  const unknown = Reflect.ownKeys(split).find((key) => !SPLIT_KEYS.includes(key));
  if (unknown !== undefined) return { ok: false, error: `unknown compute split key ${String(unknown)}` };
  const next = { ...state.compute.split };
  if (Object.hasOwn(split, 'safety')) {
    if (!Number.isFinite(split.safety) || split.safety < 0 || split.safety > MAX_SAFETY) return { ok: false, error: 'the safety share must be between 0% and 50%' };
    next.safety = split.safety;
  }
  if (Object.hasOwn(split, 'servingCap')) {
    const v = split.servingCap;
    if (v !== null && (!Number.isFinite(v) || v < 0)) return { ok: false, error: 'the serving cap must be a number of units or null' };
    next.servingCap = v;
  }
  for (const k of ['coverWithSpot', 'resellIdle']) {
    if (Object.hasOwn(split, k)) {
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
  const safety = safetyUnits(online, control, state.compute.split.safety);
  const cap = state.compute.split.servingCap ?? Infinity;
  const serving = Math.max(0, Math.min(need, cap, online - control - safety));
  const training = Math.max(0, online - control - safety - serving);
  // A polishing model keeps its run's compute busy until Publish.
  const run = state.activeRun ? state.activeRun.units : (state.pendingModel?.heldUnits ?? 0);
  return { online, need, control, safety, serving, shortfall: Math.max(0, need - serving), training, run, idle: Math.max(0, training - run) };
}

export const spotCover = (state) =>
  (state.compute.split.coverWithSpot ? computeSlices(state).shortfall * spotPrice(state) * UNIT : 0);

// Spec §5.3: idle units recover the era's share of the base price, but never more than they bill.
// Idle units are taken from the cheapest contracts first, so signing cheap capacity (such as the
// half-price rescue) and reselling it can never lower the burn.
export function resaleCredit(state) {
  if (!state.compute.split.resellIdle) return 0;
  let idle = computeSlices(state).idle;
  let credit = 0;
  for (const c of state.compute.contracts.filter((x) => !x.dark).sort((a, b) => a.price - b.price)) {
    const n = Math.min(idle, c.units);
    credit += n * Math.min(RESALE[state.era], c.price) * UNIT;
    idle -= n;
  }
  return credit;
}

export const safetyValue = (state) => (computeSlices(state).safety * UNIT) / eraScale(state.era);

export function applySplitEffects(state) {
  const months = eraById(state.era).monthsPerTurn;
  state.alignmentDebt -= state.compute.split.safety * SAFETY_DEBT_RATE * (months / 3);
  const s = computeSlices(state);
  const events = [];
  if (!state.compute.split.coverWithSpot && s.shortfall > 0 && s.need > 0) {
    const loss = (s.shortfall / s.need) * 0.1;
    for (const m of activeModels(state)) m.users = Math.round(m.users * (1 - loss));
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
  if (state.flags.safetyPledgeMade || state.promises.some((p) => p.type === 'safetyCompute')) return { ok: false, error: 'you already made a safety pledge' };
  state.promises.push({ type: 'safetyCompute', share, turn: state.turn });
  state.flags.safetyPledgeMade = true;
  state.publicTrust += 3;
  state.staffTrust += 5;
  return { ok: true, share };
}
