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
