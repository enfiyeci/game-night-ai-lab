import { readSave, writeSave } from '../../sim/save.js';
import { storyDate } from '../../sim/time.js';

// The run in progress, kept under one localStorage key (F1, 2026-10-27). The iOS app mirrors every localStorage
// write into its own files and restores them at launch (ios/App/SaveStore.swift), so this one key covers both.
export const RUN_SAVE_KEY = 'ai-lab-run-save';
const MIN_GAP_MS = 2000; // each write copies the run and rewrites the iOS app's whole storage file

// Debug links and seeded runs play without touching the player's save.
export function savesAllowed({ search = '', hash = '' } = {}) {
  const params = new URLSearchParams(search);
  return !hash && !['seed', 'scenario', 'notitle', 'leads'].some((key) => params.has(key));
}

// { ok: true, run, savedAt } or { ok: false, reason } (sim/save.js readSave); a storage that throws reads as no save.
export function loadRun(storage) {
  let text = null;
  try {
    text = storage.getItem(RUN_SAVE_KEY);
  } catch {
    // a private window
  }
  const read = readSave(text);
  if (!read.ok) return read;
  const { run } = read;
  const state = run.checkpoint?.state;
  if (!state || typeof state !== 'object' || !Number.isInteger(state.day) || !Number.isInteger(run.checkpoint.rng) || !Array.isArray(run.inputs)) {
    return { ok: false, reason: 'corrupt' };
  }
  return { ok: true, run, savedAt: read.savedAt };
}

export function clearRun(storage) {
  try {
    storage.removeItem(RUN_SAVE_KEY);
  } catch {
    // a private window
  }
}

// The line under Continue on the title screen: where the run stands once its inputs have replayed.
export function continueNote(run) {
  const where = run.where ?? run.checkpoint.state;
  const lab = (typeof where.labName === 'string' && where.labName.trim()) || 'Your lab';
  return `${lab} · Era ${where.era} · ${storyDate(where.day).label}`;
}

// Saves the game a moment after each update (once screens have opened on it) and at once on save(). While nothing
// is open (isQuiet) the save is a fresh checkpoint; otherwise it is the last quiet checkpoint plus the inputs since,
// which a resumed game replays (ui/game.js), so a card, the era page or a reveal that was open opens again.
// noteQuiet() is for the moment something closes: it takes the checkpoint then, so screens already closed stay closed.
// Checkpoints copy the whole run, so they are taken only at writes and when the game turns quiet after being busy.
// checkpoint: the one a resumed game was made from, whose inputs it has replayed.
export function createAutosave({
  game, storage, isQuiet = () => true, checkpoint = null,
  now = () => performance.now(), setTimer = setTimeout, clearTimer = clearTimeout,
}) {
  let lastQuiet = checkpoint ?? game.checkpoint();
  if (game.state.ending) clearRun(storage); // a replay that reached the ending: that run is over
  let timer = null;
  let lastWrite = -Infinity;
  let stopped = false;
  let busy = checkpoint !== null; // something was open since the last checkpoint (a resumed game replayed inputs past it)

  function stop() {
    stopped = true;
    unsubscribe();
    if (timer !== null) clearTimer(timer);
    timer = null;
  }

  function save() {
    if (timer !== null) clearTimer(timer);
    timer = null;
    if (stopped) return;
    if (game.state.ending) {
      stop();
      clearRun(storage);
      return;
    }
    if (isQuiet()) {
      lastQuiet = game.checkpoint();
      busy = false;
    } else busy = true;
    lastWrite = now();
    const { labName, era, day } = game.state;
    const run = { checkpoint: lastQuiet, inputs: game.inputs, speed: game.clock?.now().speed ?? 1, where: { labName, era, day } };
    try {
      storage.setItem(RUN_SAVE_KEY, writeSave(run, { savedAt: Date.now() }));
    } catch {
      // a private window or a full storage: the run plays on unsaved
    }
  }

  function soon() {
    if (stopped || timer !== null) return;
    timer = setTimer(save, Math.max(0, lastWrite + MIN_GAP_MS - now()));
  }

  function noteQuiet() {
    if (stopped || game.state.ending) return;
    if (!isQuiet()) {
      busy = true;
      return;
    }
    if (!busy) return;
    busy = false;
    lastQuiet = game.checkpoint();
    soon();
  }

  const unsubscribe = game.subscribe(soon);

  return { save, stop, noteQuiet };
}
