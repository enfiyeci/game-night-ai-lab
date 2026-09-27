import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { BALANCE } from '../sim/balance.js';
import { SIZE_CAP } from '../sim/recipe.js';
import { RIVAL_EDGE, NO_SIZE_GAIN } from '../sim/data/race.js';
import { rivalsTurn, rivalSize, rivalTraining, rivalShortfall, launchGain } from '../sim/rivals.js';

const rivalOf = (s, id) => s.rivals.find((r) => r.id === id);
const expectedGain = (r, size, roll) => (BALANCE.baseRunGain + SIZE_CAP[size] + RIVAL_EDGE + roll - 2) * (1 - 0.5 * (0.1 + 0.2 * r.caution));

test('rivals start with fleets and want more as the era grows', () => {
  const s = createInitialState({ seed: 1 });
  assert.deepEqual(s.rivals.map((r) => r.fleet), [14, 10, 12, 11]);
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(rivalShortfall(s, ob) - (25 * 1.3 * (1.1 - 0.4 * 0.25) - 14)) < 1e-9);
  ob.pipeline.push({ units: 100, turn: 1, source: 'offBoard' });
  assert.equal(rivalShortfall(s, ob), 0, 'compute on the way counts; the shortfall never goes below 0');
});

test('a rival trains the largest size its training compute fits, on the player ladder', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(rivalTraining(ob) - 14 * (1 - (0.05 + 0.25 * 0.25)) * 0.7) < 1e-9);
  assert.equal(rivalSize(s, ob), 'medium'); // about 8.7 units: Medium needs 5, Large 10
  ob.fleet = 3;
  assert.equal(rivalSize(s, ob), null); // about 1.9 units: Small needs 2
  ob.fleet = 1000;
  assert.equal(rivalSize(s, ob), 'large', 'XL waits for era 2');
  s.era = 2;
  assert.equal(rivalSize(s, ob), 'xl');
});

test('the size ladder follows the era it is asked about', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  ob.fleet = 1000;
  assert.equal(rivalSize(s, ob), 'large', 'era 1 by default');
  assert.equal(rivalSize(s, ob, 2), 'xl', 'a roll made for an era 2 round uses the era 2 ladder');
});

test('launch gain comes from model size; no size fits gives 2', () => {
  const s = createInitialState({ seed: 1 });
  const ob = rivalOf(s, 'openbrain');
  assert.ok(Math.abs(launchGain(s, ob, 3) - expectedGain(ob, 'medium', 3)) < 1e-9);
  ob.fleet = 3;
  assert.equal(launchGain(s, ob, 3), NO_SIZE_GAIN);
});

test('rival launches draw the same random numbers in the same order', () => {
  const s = createInitialState({ seed: 1 });
  const calls = [];
  const spy = { next: () => { calls.push('next'); return 0; }, int: (a, b) => { calls.push(`int:${a},${b}`); return a; } };
  s.rivals[0].progress = 0.99;
  rivalsTurn(s, spy);
  assert.deepEqual(calls, ['next', 'int:0,4', 'next', 'next', 'next']);
});

test('a binding compute cap limits each signing rival to 5 per launch', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  for (const r of s.rivals) r.fleet = 1000;
  s.deal = { collapsed: false, binding: ['computeCap'], signed: { computeCap: ['openbrain'] } };
  assert.equal(launchGain(s, rivalOf(s, 'openbrain'), 4), 5);
  assert.ok(launchGain(s, rivalOf(s, 'deepthink'), 4) > 5, 'a lab that did not sign keeps its full gain');
  s.deal.collapsed = true;
  assert.ok(launchGain(s, rivalOf(s, 'openbrain'), 4) > 5, 'a collapsed deal binds nobody');
});
