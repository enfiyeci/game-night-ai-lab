import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENDINGS } from '../sim/endings.js';
import { createCollection } from '../ui/logic/collection.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test('records first-found ending details, counts repeats and reports progress', () => {
  const storage = memoryStorage();
  const collection = createCollection(storage);

  collection.record('aligned', { seed: 17, era: 5, turn: 20, model: 'Kestrel 3 Grand' });
  collection.record('aligned', { seed: 99, era: 1, turn: 2, model: 'A Later Model' });
  collection.record('pacingDeal', { seed: 23, era: 5, turn: 20, model: null });

  assert.deepEqual(collection.entries(), [
    { id: 'aligned', seed: 17, era: 5, turn: 20, model: 'Kestrel 3 Grand', count: 2 },
    { id: 'pacingDeal', seed: 23, era: 5, turn: 20, model: null, count: 1 },
  ]);
  assert.deepEqual(collection.progress(), { found: 2, total: Object.keys(ENDINGS).length });

  const restored = createCollection(storage);
  assert.deepEqual(restored.entries(), collection.entries());
});

test('ignores unknown ending ids', () => {
  const collection = createCollection(memoryStorage());
  collection.record('not-an-ending', { seed: 4, era: 2, turn: 8, model: null });

  assert.deepEqual(collection.entries(), []);
  assert.deepEqual(collection.progress(), { found: 0, total: Object.keys(ENDINGS).length });
});

test('keeps working in memory when storage throws', () => {
  const storage = {
    getItem() {
      throw new Error('storage unavailable');
    },
    setItem() {
      throw new Error('storage unavailable');
    },
  };
  const collection = createCollection(storage);

  collection.record('misuse', { seed: 8, era: 4, turn: 14, model: 'Finch 2 Core' });

  assert.deepEqual(collection.entries(), [
    { id: 'misuse', seed: 8, era: 4, turn: 14, model: 'Finch 2 Core', count: 1 },
  ]);
  assert.deepEqual(collection.progress(), { found: 1, total: Object.keys(ENDINGS).length });
});

test('recovers from corrupt stored JSON', () => {
  const storage = memoryStorage({ 'gnal.endings.v1': '{not json' });
  const collection = createCollection(storage);

  assert.deepEqual(collection.entries(), []);
  collection.record('boardRemoved', { seed: 5, era: 2, turn: 8, model: 'Wren 1 Swift' });

  assert.deepEqual(createCollection(storage).entries(), [
    { id: 'boardRemoved', seed: 5, era: 2, turn: 8, model: 'Wren 1 Swift', count: 1 },
  ]);
});
