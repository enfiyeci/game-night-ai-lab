import { resolveRun } from '../../sim/training.js';
import { learnConstitution } from '../../sim/constitution.js';
import { project } from './format.js';

const CAPABILITY_SOURCES = ['researcher1', 'rack', 'researcher2', 'research'];
const ALIGNMENT_SOURCES = ['safety', 'research'];

// Alignment bubbles show how much of the run went into alignment work (the player's own slider), not whether it worked.
export function alignmentFor(capability, alignShare) {
  if (!(alignShare > 0)) return 0;
  if (alignShare >= 1) return capability;
  return Math.round((capability * alignShare) / (1 - alignShare));
}

// The capability gain the run is on course for, worked out on a copy so the game itself is untouched.
export function expectedGain(state) {
  const run = state.activeRun;
  if (!run) return 0;
  const copy = structuredClone(state);
  if (run.constitution) learnConstitution(copy, run.constitution); // as the finished run will
  return resolveRun(copy, structuredClone(run)).gain;
}

export function badgeCounts(state, lastAlignShare) {
  const run = state.activeRun;
  if (run) {
    // The first bubble flies on the run's first day rather than after half a point; later counts round as before, so
    // the early bubble adds no overcount of its own (a loss spike at the end can still trim the count, as it always could).
    const gain = expectedGain(state);
    const progress = project(state).progress ?? 0;
    const capability = Math.max(Math.round(gain * progress), progress > 0 && Math.round(gain) >= 1 ? 1 : 0);
    return { capability, alignment: alignmentFor(capability, run.recipe.sliders.alignShare) };
  }
  if (state.pendingModel) {
    const capability = Math.round(state.pendingModel.gain);
    return { capability, alignment: alignmentFor(capability, lastAlignShare ?? 0) };
  }
  return { capability: 0, alignment: 0 };
}

export const BUBBLES_PER_POINT = 5;

// Visual fractions progress independently of the HUD's whole-point rounding.
export function bubbleCounts(state, lastAlignShare) {
  if (!state.activeRun) return badgeCounts(state, lastAlignShare);
  const capability = Math.round(expectedGain(state));
  const alignment = alignmentFor(capability, state.activeRun.recipe.sliders.alignShare);
  const progress = Math.max(0, Math.min(1, project(state).progress ?? 0));
  const fractions = (total) => Math.floor(total * progress * BUBBLES_PER_POINT + 1e-9) / BUBBLES_PER_POINT;
  return { capability: fractions(capability), alignment: fractions(alignment) };
}

export function bubbleSpawns(from, to) {
  const spawns = [];
  const add = (kind, count, start, sources) => {
    for (let i = 0; i < Math.round(count * BUBBLES_PER_POINT); i += 1) {
      spawns.push({ kind, source: sources[(Math.round(start * BUBBLES_PER_POINT) + i) % sources.length], amount: 1 / BUBBLES_PER_POINT });
    }
  };
  add('capability', Math.max(0, to.capability - from.capability), from.capability, CAPABILITY_SOURCES);
  add('alignment', Math.max(0, to.alignment - from.alignment), from.alignment, ALIGNMENT_SOURCES);
  // Interleave the two kinds so they fly together rather than in two waves.
  const cap = spawns.filter((s) => s.kind === 'capability');
  const ali = spawns.filter((s) => s.kind === 'alignment');
  const mixed = [];
  while (cap.length || ali.length) {
    if (cap.length) mixed.push(cap.shift());
    if (ali.length && (mixed.length % 3 === 2 || !cap.length)) mixed.push(ali.shift());
  }
  return mixed;
}

const releaseWaits = (state) => Boolean(state.pendingModel && !state.pendingModel.hazard && !state.ending);

// A polishing model has its own Publish button; other waiting models use the floor menu.
export function readyNote(state) {
  return releaseWaits(state) && !state.pendingModel.polishing ? 'Ready · click the floor to release' : null;
}

// The ring on the floor is for the first release only; after one the player knows the way.
export function floorHint(state) {
  return releaseWaits(state) && state.models.length === 0;
}
