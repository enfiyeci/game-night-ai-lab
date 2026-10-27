import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enableScenarios } from '../sim/scenarios.js';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { playRound } from '../tools/play-round.js';
import { STRATEGIES, eventChoices, dailyRelease } from '../tools/balance.js';
import { SAVE_VERSION, pack, readSave, unpack, writeSave } from '../sim/save.js';

const styleOf = (name) => (['careful', 'carefulNoGrid'].includes(name) ? 'careful' : ['speed', 'safety', 'random'].includes(name) ? name : 'balanced');
const round = (name, state, rng) => playRound(state, STRATEGIES[name](state, rng), rng, (current) => eventChoices(current, styleOf(name), rng), { dailyActions: (current) => dailyRelease(name, current) }).state;

test('pack and unpack keep what JSON alone loses: undefined fields, negative zero, NaN and infinities', () => {
  const value = { a: undefined, list: [1, undefined, -0], z: -0, nan: NaN, up: Infinity, down: -Infinity, nested: { keep: 'x', gone: undefined } };
  const back = unpack(JSON.parse(JSON.stringify(pack(value))));
  assert.deepStrictEqual(back, value);
  assert.ok(Object.hasOwn(back, 'a'));
  assert.ok(Object.is(back.z, -0));
  assert.ok(Object.is(back.list[2], -0));
});

test('pack does not change the value it is given', () => {
  const value = { a: undefined, z: -0 };
  pack(value);
  assert.ok(Object.hasOwn(value, 'a'));
  assert.ok(Object.is(value.z, -0));
});

test('a written save reads back with its version and contents', () => {
  const state = createInitialState({ seed: 4 });
  const text = writeSave({ state, rng: 123 }, { savedAt: 1000 });
  const read = readSave(text);
  assert.equal(read.ok, true);
  assert.equal(read.version, SAVE_VERSION);
  assert.equal(read.savedAt, 1000);
  assert.deepStrictEqual(read.run, { state, rng: 123 });
});

test('a save from another version, another state shape, or not a save at all is refused without throwing', () => {
  const good = JSON.parse(writeSave({ x: 1 }, { savedAt: 1 }));
  assert.deepEqual(readSave(JSON.stringify({ ...good, version: SAVE_VERSION + 1 })), { ok: false, reason: 'version' });
  assert.deepEqual(readSave(JSON.stringify({ ...good, version: 0 })), { ok: false, reason: 'version' });
  assert.deepEqual(readSave(JSON.stringify({ ...good, shape: 'something else' })), { ok: false, reason: 'shape' });
  assert.deepEqual(readSave('{not json'), { ok: false, reason: 'corrupt' });
  assert.deepEqual(readSave('"a string"'), { ok: false, reason: 'corrupt' });
  assert.deepEqual(readSave(JSON.stringify({ ...good, run: undefined })), { ok: false, reason: 'corrupt' });
  assert.deepEqual(readSave(null), { ok: false, reason: 'missing' });
});

test('the random stream resumes from its saved position', () => {
  const rng = createRng(77);
  for (let i = 0; i < 13; i++) rng.next();
  const resumed = createRng(rng.state());
  assert.deepEqual(Array.from({ length: 20 }, () => resumed.next()), Array.from({ length: 20 }, () => rng.next()));
});

// The proof the owner asked for: play N rounds, save, read the save back into a fresh run, play on, and compare
// with the same seed played straight through. Bots draw their choices from the same stream as the sim.
for (const name of ['speed', 'safety', 'balanced', 'careful', 'random']) {
  test(`${name}: a run saved and resumed mid-run ends exactly as the uninterrupted run`, () => {
    for (let seed = 1; seed <= 12; seed++) {
      const straightRng = createRng(seed);
      let straight = enableScenarios(createInitialState({ seed }));
      for (let i = 0; i < 30 && !straight.ending; i++) straight = round(name, straight, straightRng);

      const stopAt = 1 + (seed * 7) % 17; // round marks from 1 to 17, spread over the eras
      let rng = createRng(seed);
      let state = enableScenarios(createInitialState({ seed }));
      let i = 0;
      for (; i < stopAt && !state.ending; i++) state = round(name, state, rng);
      const read = readSave(writeSave({ state, rng: rng.state() }, { savedAt: 0 }));
      assert.equal(read.ok, true);
      state = read.run.state;
      rng = createRng(read.run.rng);
      for (; i < 30 && !state.ending; i++) state = round(name, state, rng);

      assert.ok(straight.ending);
      assert.deepStrictEqual(state, straight, `${name} seed ${seed} saved after round ${stopAt}`);
    }
  });
}
