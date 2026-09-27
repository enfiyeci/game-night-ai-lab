import { BALANCE } from './balance.js';
import { ERAS } from './data/eras.js';
import { eraOfRound, roundSpan } from './time.js';

const LAST_DAY = roundSpan(ERAS.reduce((sum, era) => sum + era.turns, 0) - 1).end;

// Provisional fictional names (spec §11 open question); rename freely.
export const RIVAL_TEMPLATES = [
  { id: 'openbrain', name: 'OpenBrain', capability: 26, speed: 1.3, caution: 0.25, eastern: false },
  { id: 'lodestar', name: 'Lodestar', capability: 22, speed: 0.9, caution: 0.8, eastern: false },
  { id: 'deepthink', name: 'DeepThink', capability: 24, speed: 1.05, caution: 0.5, eastern: false },
  { id: 'qilin', name: 'Qilin', capability: 18, speed: 1.15, caution: 0.35, eastern: true },
];

export function createRivals() {
  return RIVAL_TEMPLATES.map((r) => ({ ...r, progress: 0, releases: 0 }));
}

export function leaderCapability(state) {
  return Math.max(...state.rivals.map((r) => r.capability));
}

export function rank(state) {
  return 1 + state.rivals.filter((r) => r.capability > state.capability).length;
}

export function gapToLeader(state) {
  return Math.max(0, leaderCapability(state) - state.capability);
}

export function leastCarefulRival(state) {
  return state.rivals.reduce((a, b) => (b.caution < a.caution ? b : a));
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
      const uncappedGain = (5 + rng.int(0, 4)) * (1 + 0.1 * (deferTo == null ? state.era : eraOfRound(deferTo)));
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
      const capability = Math.min(BALANCE.maxCapability, r.capability + uncappedGain);
      const gain = capability - r.capability;
      r.capability = capability;
      state.raceHeat += heat;
      releases.push({ id: r.id, gain });
    }
  }
  return releases;
}

export function landRivals(state) {
  const landed = [];
  state.rivalLaunches = (state.rivalLaunches ?? []).filter((launch) => {
    if (launch.day > state.day) return true;
    const r = state.rivals.find((rival) => rival.id === launch.id);
    const capability = Math.min(BALANCE.maxCapability, r.capability + launch.gain);
    landed.push({ id: r.id, gain: capability - r.capability });
    r.capability = capability;
    state.raceHeat = Math.min(100, state.raceHeat + launch.heat);
    return false;
  });
  (state.rivalLaunchesThisRound ??= []).push(...landed);
  return landed;
}
