import { BALANCE } from './balance.js';

// Provisional fictional names (spec §11 open question); rename freely.
export const RIVAL_TEMPLATES = [
  { id: 'openbrain', name: 'OpenBrain', capability: 26, speed: 0.8, caution: 0.25, eastern: false },
  { id: 'lodestar', name: 'Lodestar', capability: 22, speed: 0.55, caution: 0.8, eastern: false },
  { id: 'deepthink', name: 'DeepThink', capability: 24, speed: 0.65, caution: 0.5, eastern: false },
  { id: 'qilin', name: 'Qilin', capability: 18, speed: 0.7, caution: 0.35, eastern: true },
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

export function rivalsTurn(state, rng) {
  const releases = [];
  for (const r of state.rivals) {
    r.progress += r.speed * 0.35 * (1 + rng.next() * 0.3);
    if (r.progress >= 1) {
      r.progress = 0;
      r.releases += 1;
      const uncappedGain = (5 + rng.int(0, 4)) * (1 + 0.1 * state.era);
      const capability = Math.min(BALANCE.maxCapability, r.capability + uncappedGain);
      const gain = capability - r.capability;
      r.capability = capability;
      state.raceHeat += 4 * r.speed * (1 - r.caution);
      releases.push({ id: r.id, gain });
    }
  }
  return releases;
}
