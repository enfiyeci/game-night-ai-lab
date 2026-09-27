import { BALANCE } from './balance.js';
import { ERAS } from './data/eras.js';
import { eraOfRound, roundSpan } from './time.js';
import { SIZES, SIZE_UNITS, SIZE_CAP } from './recipe.js';
import { eraScale } from './data/compute.js';
import {
  FRONTIER, START_FLEET, RIVAL_EDGE, SERVING_ROOM, NO_SIZE_GAIN, CAPPED_GAIN, STANDING_TIE, STANDING_WEIGHTS, CATCH_UP,
} from './data/race.js';

const LAST_DAY = roundSpan(ERAS.reduce((sum, era) => sum + era.turns, 0) - 1).end;

// Provisional fictional names (spec §11 open question); rename freely.
export const RIVAL_TEMPLATES = [
  { id: 'openbrain', name: 'OpenBrain', capability: 26, speed: 1.3, caution: 0.25, eastern: false },
  { id: 'lodestar', name: 'Lodestar', capability: 22, speed: 0.9, caution: 0.8, eastern: false },
  { id: 'deepthink', name: 'DeepThink', capability: 24, speed: 1.05, caution: 0.5, eastern: false },
  { id: 'qilin', name: 'Qilin', capability: 18, speed: 1.15, caution: 0.35, eastern: true },
];

export function createRivals() {
  return RIVAL_TEMPLATES.map((r) => ({ ...r, progress: 0, releases: 0, fleet: START_FLEET[r.id], pipeline: [], named: null, lastSize: null }));
}

export function leaderCapability(state) {
  return Math.max(...state.rivals.map((r) => r.capability));
}

export function computeShares(state) {
  const fleets = { you: state.compute.online, ...Object.fromEntries(state.rivals.map((r) => [r.id, r.fleet])) };
  const total = Object.values(fleets).reduce((sum, units) => sum + units, 0);
  return Object.fromEntries(Object.entries(fleets).map(([id, units]) => [id, total > 0 ? units / total : 0]));
}

// Spec §2 rule 6: once per round mark, every lab within half a point of the top score earns a round at the top.
// Only the current era's rounds count (owner pick A5): the first mark of a new era starts the count again, so rank
// does not flip at the era change itself.
export function recordStanding(state) {
  const race = (state.race ??= { atTop: {} });
  if (race.era != null && race.era !== state.era) race.atTop = {};
  race.era = state.era;
  const atTop = race.atTop;
  const labs = [['you', state.capability], ...state.rivals.map((r) => [r.id, r.capability])];
  const top = Math.max(...labs.map(([, capability]) => capability));
  for (const [id, capability] of labs) if (top - capability <= STANDING_TIE) atTop[id] = (atTop[id] ?? 0) + 1;
}

export function standing(state) {
  const atTop = state.race?.atTop ?? {};
  const most = Math.max(0, ...Object.values(atTop));
  const shares = computeShares(state);
  return Object.fromEntries(Object.keys(shares).map((id) => [id,
    STANDING_WEIGHTS.top * (most > 0 ? (atTop[id] ?? 0) / most : 0) + STANDING_WEIGHTS.compute * shares[id]]));
}

// A rival ranks above you when it is more than half a point ahead; within half a point, the higher standing does.
export function rank(state) {
  const s = standing(state);
  return 1 + state.rivals.filter((r) => r.capability > state.capability + STANDING_TIE
    || (Math.abs(r.capability - state.capability) <= STANDING_TIE && s[r.id] > s.you)).length;
}

export function gapToLeader(state) {
  return Math.max(0, leaderCapability(state) - state.capability);
}

export function leastCarefulRival(state) {
  return state.rivals.reduce((a, b) => (b.caution < a.caution ? b : a));
}

// Compute race (spec 2026-09-26 §2 rules 1–2): every lab turns compute into models the way the player does.
export const appetite = (r) => r.speed * (1.1 - 0.4 * r.caution);
export const rivalTarget = (state, r) => FRONTIER[state.era - 1] * appetite(r);
export const rivalSafety = (r) => 0.05 + 0.25 * r.caution;
export const rivalTraining = (r) => r.fleet * (1 - rivalSafety(r)) * SERVING_ROOM;
export const rivalPending = (r) => r.pipeline.reduce((sum, p) => sum + p.units, 0);
export const rivalShortfall = (state, r) => Math.max(0, rivalTarget(state, r) - r.fleet - rivalPending(r));

// era: the era whose size ladder applies. A deferred roll is made for a round that may open the next era.
export function rivalSize(state, r, era = state.era) {
  const units = rivalTraining(r);
  let best = null;
  for (const size of SIZES) {
    if (size === 'xl' && era < 2) continue;
    if (SIZE_UNITS[size] * eraScale(era) <= units) best = size;
  }
  return best;
}

// The Geneva cap binds a rival that signed it, as sim/training.js binds the player's runs. Read from state.deal
// directly: sim/summit.js imports this file, so importing dealBinds here would be a cycle.
const capBinds = (state, r) => state.deal?.collapsed === false && state.deal.binding.includes('computeCap')
  && (state.deal.signed?.computeCap ?? []).includes(r.id);

export function launchGain(state, r, roll, era = state.era) {
  const size = rivalSize(state, r, era);
  r.lastSize = size;
  const gain = size
    ? Math.max(0, (BALANCE.baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + roll - 2) * (1 - 0.5 * (0.1 + 0.2 * r.caution)))
    : NO_SIZE_GAIN;
  // A launch still waiting to land already copied part of the lead, so the gap counts it as landed.
  const waiting = (state.rivalLaunches ?? []).reduce((sum, launch) => sum + (launch.id === r.id ? launch.gain : 0), 0);
  const copied = era >= CATCH_UP.from
    ? CATCH_UP.perPoint * Math.max(0, state.capability - r.capability - waiting - CATCH_UP.lead) : 0;
  return capBinds(state, r) ? Math.min(gain + copied, CAPPED_GAIN) : gain + copied;
}

// With deferTo, the roll is for round deferTo, made at the mark before it (the first round's roll comes with the
// initial state). A launch lands half a round after the day its bar fills, so on average on the round's own mark,
// where the turn-based game put it (retune, 2026-09-26). The draws are the same as the immediate form's.
export function rivalsTurn(state, rng, { deferTo = null } = {}) {
  const releases = [];
  for (const r of state.rivals) {
    const before = r.progress;
    const step = r.speed * 0.35 * (1 + rng.next() * 0.3);
    r.progress += step;
    if (r.progress >= 1) {
      r.progress = 0;
      r.releases += 1;
      const uncappedGain = launchGain(state, r, rng.int(0, 4), deferTo == null ? state.era : eraOfRound(deferTo));
      const heat = 4 * r.speed * (1 - r.caution);
      if (deferTo != null) {
        const { start, end } = roundSpan(deferTo);
        const days = end - start;
        const fill = Math.min(1, (1 - before) / step);
        const day = Math.min(LAST_DAY, start + Math.max(1, Math.ceil(fill * days)) + Math.floor(days / 2));
        state.rivalLaunches.push({ id: r.id, gain: uncappedGain, heat, day });
        releases.push({ id: r.id });
        continue;
      }
      r.capability += uncappedGain;
      state.raceHeat += heat;
      releases.push({ id: r.id, gain: uncappedGain });
    }
  }
  return releases;
}

export function landRivals(state) {
  const landed = [];
  state.rivalLaunches = (state.rivalLaunches ?? []).filter((launch) => {
    if (launch.day > state.day) return true;
    const r = state.rivals.find((rival) => rival.id === launch.id);
    landed.push({ id: r.id, gain: launch.gain });
    r.capability += launch.gain;
    state.raceHeat = Math.min(100, state.raceHeat + launch.heat);
    return false;
  });
  (state.rivalLaunchesThisRound ??= []).push(...landed);
  return landed;
}
