import { BALANCE } from './balance.js';
import { roundSpan } from './time.js';

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

// With deferTo (a round), a launch rolled at this mark lands on the day its bar would fill during that round.
// The random draws are the same as the immediate form, in the same order.
export function rivalsTurn(state, rng, { deferTo = null } = {}) {
  const releases = [];
  for (const r of state.rivals) {
    const before = r.progress;
    const step = r.speed * 0.35 * (1 + rng.next() * 0.3);
    r.progress += step;
    if (r.progress >= 1) {
      r.progress = 0;
      r.releases += 1;
      const uncappedGain = (5 + rng.int(0, 4)) * (1 + 0.1 * state.era);
      const heat = 4 * r.speed * (1 - r.caution);
      if (deferTo != null) {
        const { start, end } = roundSpan(deferTo);
        const fill = Math.min(1, (1 - before) / step);
        state.rivalLaunches.push({ id: r.id, gain: uncappedGain, heat, day: Math.min(end, start + Math.max(1, Math.ceil(fill * (end - start)))) });
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
