import { resolveRun } from '../../sim/training.js';
import { project } from './format.js';

// Dice that never land, so the estimate adds no lawsuit or hazard and stays repeatable.
const NO_DICE = { chance: () => false };

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
  return resolveRun(structuredClone(state), structuredClone(run), NO_DICE).gain;
}

export function badgeCounts(state, lastAlignShare) {
  const run = state.activeRun;
  if (run) {
    const capability = Math.round(expectedGain(state) * (project(state).progress ?? 0));
    return { capability, alignment: alignmentFor(capability, run.recipe.sliders.alignShare) };
  }
  if (state.pendingModel) {
    const capability = Math.round(state.pendingModel.gain);
    return { capability, alignment: alignmentFor(capability, lastAlignShare ?? 0) };
  }
  return { capability: 0, alignment: 0 };
}

export function bubbleSpawns(from, to) {
  const spawns = [];
  const add = (kind, count, start, sources) => {
    for (let i = 0; i < count; i += 1) spawns.push({ kind, source: sources[(start + i) % sources.length] });
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

// Owner pick 2A: the only way into the menu is a click on the floor, so the note says it.
export function readyNote(state) {
  return releaseWaits(state) ? 'Ready · click the floor to release' : null;
}

// The ring on the floor is for the first release only; after one the player knows the way.
export function floorHint(state) {
  return releaseWaits(state) && state.models.length === 0;
}
