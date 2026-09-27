import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { SIZE_LABEL, playerSize, raceModel, roundEndItems } from '../ui/logic/race.js';

test('the share bar covers every lab, largest first', () => {
  const m = raceModel(createInitialState({ seed: 1 }));
  assert.equal(m.shares.length, 5);
  assert.ok(Math.abs(m.shares.reduce((s, x) => s + x.share, 0) - 1) < 1e-9);
  assert.equal(m.shares[0].id, 'openbrain'); // 14 of 57 units
  assert.ok(m.shares.find((x) => x.you));
});

test('the lab table reads score, compute, next model and the word around town', () => {
  const s = createInitialState({ seed: 1 });
  s.rivals.find((r) => r.id === 'deepthink').progress = 0.6;
  s.lastRivalReleases = [{ id: 'openbrain', gain: 6 }];
  const rows = raceModel(s).rows;
  const scores = rows.map((r) => r.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'highest score first');
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.openbrain.word, 'just launched');
  assert.equal(byId.deepthink.word, 'launch rumored soon');
  assert.equal(byId.lodestar.computeNote, 'careful: big safety share');
  assert.equal(byId.qilin.computeNote, 'home-made chips');
  assert.equal(byId.openbrain.size, SIZE_LABEL.medium);
  assert.equal(byId.you.word, 'no run yet');
});

test('the why box names what your users and safety take, and what the next size needs', () => {
  const s = createInitialState({ seed: 1 });
  const m = raceModel(s);
  const size = playerSize(s);
  assert.match(m.why, new RegExp(`^Why you ${size ? `only train ${SIZE_LABEL[size]}` : "can't train yet"}\\.`));
  assert.match(m.why, /needs \d+ free/);
});

test('the round-end box says who takes what, and what happens if you sign it first', () => {
  const s = createInitialState({ seed: 1 });
  const items = roundEndItems(s);
  assert.equal(items.filter((i) => i.id !== 'qilin').length, s.compute.offers.filter((o) => o.wantedBy).length);
  const named = s.compute.offers.find((o) => o.wantedBy && o.fallback);
  if (named) assert.match(raceModel(s).roundEnd.join(' '), /Sign it first and \w+ takes/);
  assert.ok(items.some((i) => i.id === 'qilin' && i.text === 'Qilin buys only home-made chips'));
});
