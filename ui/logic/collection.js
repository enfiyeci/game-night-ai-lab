import { ENDINGS } from '../../sim/endings.js';

const STORAGE_KEY = 'gnal.endings.v1';
const META_KEYS = ['seed', 'era', 'turn', 'model'];

const blankMeta = (meta = {}) => Object.fromEntries(
  META_KEYS.map((key) => [key, meta[key] ?? null]),
);

function storedEntries(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw == null) return {};
    const parsed = JSON.parse(raw);
    if (parsed == null || Array.isArray(parsed) || typeof parsed !== 'object') return {};

    const entries = {};
    for (const id of Object.keys(ENDINGS)) {
      const saved = parsed[id];
      if (saved == null || typeof saved !== 'object' || !Number.isInteger(saved.count) || saved.count < 1) continue;
      entries[id] = { ...blankMeta(saved), count: saved.count };
    }
    return entries;
  } catch {
    return {};
  }
}

export function createCollection(storage) {
  const found = storedEntries(storage);

  function save() {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(found));
    } catch {
      // The in-memory collection remains usable when browser storage is unavailable.
    }
  }

  return {
    record(endingId, meta) {
      if (!Object.hasOwn(ENDINGS, endingId)) return;
      if (found[endingId]) found[endingId].count += 1;
      else found[endingId] = { ...blankMeta(meta), count: 1 };
      save();
    },

    entries() {
      return Object.keys(ENDINGS)
        .filter((id) => found[id])
        .map((id) => ({ id, ...found[id] }));
    },

    progress() {
      return { found: Object.keys(found).length, total: Object.keys(ENDINGS).length };
    },
  };
}
