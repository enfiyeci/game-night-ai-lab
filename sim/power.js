import { ERAS } from './data/eras.js';

// Spec §6: sites supply power in era 4. Sizes are absolute units (already at era 4 scale).
export const SITE_TYPES = {
  grid: { name: 'Grid connection', size: [250, 450], upfront: 50 },
  gas: { name: 'Gas turbines', size: [300, 600], turns: 4, trust: -3 },
  nuclear: { name: 'Nuclear restart', size: [200, 400], turns: 4, trust: 2, slip: 1 }, // slip: rounds late without US favor
};
// D8 (owner 2026-09-27): permits move for a lab Washington likes, so a nuclear restart opens on time at this US favor.
export const NUCLEAR_ON_TIME_FAVOR = 60;
export const FACILITY_PER_UNIT = 19; // $M of facility per unit of power (Epoch AI: $11.4B per GW ÷ 600)
export const LEASE_RATE = 0.05;      // share of facility value paid per year
export const leaseMonthly = (units) => (units * FACILITY_PER_UNIT * LEASE_RATE) / 12;
export const eraStartTurn = (era) => ERAS.slice(0, era - 1).reduce((sum, e) => sum + e.turns, 0);

// Owner 2026-09-26, no dice: every site has fixed terms, the middle of the old ranges.
export const siteUnits = (type) => Math.round((type.size[0] + type.size[1]) / 2 / 10) * 10;

function addSite(state, source, units, arrivesTurn) {
  const site = { id: `${source}-${state.power.nextId++}`, source, units, arrivesTurn, online: false };
  state.power.sites.push(site);
  return site;
}

export function reserveGrid(state) {
  if (state.era !== 2 && state.era !== 3) return { ok: false, error: 'grid connections are reserved in eras 2 and 3' };
  if (state.power.sites.some((s) => s.source === 'grid')) return { ok: false, error: 'you already hold a grid reservation' };
  if (state.cash < SITE_TYPES.grid.upfront) return { ok: false, error: 'not enough cash for the reservation' };
  state.cash -= SITE_TYPES.grid.upfront;
  // The average of the old draws, rounded: era 2 was era 4 + 0-1 rounds; era 3 was era 4 + 2-3, or era 5 + 0-1 a quarter of the time.
  const arrivesTurn = eraStartTurn(4) + (state.era === 2 ? 1 : 3);
  const site = addSite(state, 'grid', siteUnits(SITE_TYPES.grid), arrivesTurn);
  return { ok: true, site: site.id, arrivesTurn };
}

export function buildSite(state, source) {
  if (state.era !== 4) return { ok: false, error: 'sites are built in era 4' };
  if (source !== 'gas' && source !== 'nuclear') return { ok: false, error: `unknown site type ${source}` };
  const t = SITE_TYPES[source];
  const slip = state.govFavor.us >= NUCLEAR_ON_TIME_FAVOR ? 0 : (t.slip ?? 0); // D8
  const site = addSite(state, source, siteUnits(t), state.turn + t.turns + slip);
  state.publicTrust += t.trust;
  return { ok: true, site: site.id, arrivesTurn: site.arrivesTurn };
}

export function powerTurn(state, due = (s) => s.arrivesTurn <= state.turn) {
  const events = [];
  for (const s of state.power.sites) {
    if (!s.online && due(s)) {
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
