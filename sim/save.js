import { createInitialState } from './state.js';

// The save format for a run in progress (F1, 2026-10-27). One JSON text: { version, shape, savedAt, run }.
// Bump SAVE_VERSION when the meaning of saved data changes; add a step to MIGRATIONS to carry older saves forward.
// A changed state shape (a field added, renamed or removed) is caught by `shape` without a bump: such saves are refused.
export const SAVE_VERSION = 1;
const MIGRATIONS = {}; // { [fromVersion]: (save) => save at fromVersion + 1 }

// JSON drops undefined fields and turns -0, NaN and the infinities into 0 or null; the sim keeps some of these
// (an undefined benchmark skill, a -0 training focus), so a resumed run would drift. They travel as tagged objects.
const TAG = '$save';
const SPECIAL = new Map([['undefined', undefined], ['-0', -0], ['NaN', NaN], ['Infinity', Infinity], ['-Infinity', -Infinity]]);

function specialName(value) {
  if (value === undefined) return 'undefined';
  if (typeof value !== 'number' || (Number.isFinite(value) && !Object.is(value, -0))) return null;
  return Object.is(value, -0) ? '-0' : String(value);
}

export function pack(value) {
  const name = specialName(value);
  if (name) return { [TAG]: name };
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(pack);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, pack(item)]));
}

export function unpack(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(unpack);
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === TAG && SPECIAL.has(value[TAG])) return SPECIAL.get(value[TAG]);
  return Object.fromEntries(keys.map((key) => [key, unpack(value[key])]));
}

// Every key path of a fresh state, array items folded together: two builds with the same paths save the same shape.
function paths(value, prefix, out) {
  if (value === null || typeof value !== 'object') return out;
  for (const [key, item] of Array.isArray(value) ? value.map((item) => ['[]', item]) : Object.entries(value)) {
    const path = `${prefix}.${key}`;
    out.add(path);
    paths(item, path, out);
  }
  return out;
}

let shape = null;
export function stateShape() {
  if (shape) return shape;
  const text = [...paths(createInitialState({ seed: 1 }), '', new Set())].sort().join('\n');
  let hash = 2166136261; // FNV-1a, enough to tell two shapes apart
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  shape = hash.toString(16);
  return shape;
}

// The same text as JSON.stringify of pack(run), written in one pass without the copy.
export function writeSave(run, { savedAt }) {
  return JSON.stringify({ version: SAVE_VERSION, shape: stateShape(), savedAt, run }, function tag(key, value) {
    const name = specialName(this[key]);
    return name ? { [TAG]: name } : value;
  });
}

// { ok: true, version, savedAt, run } or { ok: false, reason: 'missing' | 'corrupt' | 'version' | 'shape' }; never throws.
export function readSave(text) {
  if (text == null) return { ok: false, reason: 'missing' };
  let save;
  try {
    save = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'corrupt' };
  }
  if (!save || typeof save !== 'object' || !save.run || typeof save.run !== 'object') return { ok: false, reason: 'corrupt' };
  let migrated = false;
  while (save.version !== SAVE_VERSION && MIGRATIONS[save.version]) {
    save = MIGRATIONS[save.version](save);
    migrated = true;
  }
  if (save.version !== SAVE_VERSION) return { ok: false, reason: 'version' };
  if (!migrated && save.shape !== stateShape()) return { ok: false, reason: 'shape' };
  return { ok: true, version: save.version, savedAt: save.savedAt, run: unpack(save.run) };
}
