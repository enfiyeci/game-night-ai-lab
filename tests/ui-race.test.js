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
  assert.match(m.why, /needs .+ free/);
});

test('the why box speaks in the era\'s own compute units and skips users who take nothing', () => {
  const s = createInitialState({ seed: 1 });
  assert.equal(s.compute.servingUnits, 0);
  assert.doesNotMatch(raceModel(s).why, /Your users take/);
  assert.match(raceModel(s).why, /safety takes 1 unit of your 10 units/i);
  s.era = 4;
  s.compute.online = 800;
  s.compute.servingUnits = 200;
  const why = raceModel(s).why;
  assert.match(why, /Your users take [\d.]+ (MW|GW) of your [\d.]+ (MW|GW)/);
  assert.match(why, /needs [\d.]+ (MW|GW) free/);
  assert.doesNotMatch(why, /needs \d+ free/);
});

test('the round-end box says who takes what, and what happens if you sign it first', () => {
  const s = createInitialState({ seed: 1 });
  const items = roundEndItems(s);
  assert.equal(items.filter((i) => i.id !== 'qilin').length, s.compute.offers.filter((o) => o.wantedBy).length);
  const named = s.compute.offers.find((o) => o.wantedBy && o.fallback);
  if (named) assert.match(raceModel(s).roundEnd.join(' '), /Sign it first and \w+ takes/);
  assert.ok(items.some((i) => i.id === 'qilin' && i.text === 'Qilin buys only home-made chips.'));
});

test('the round-end box follows the projected board: a rival whose card you signed takes its second choice', () => {
  const s = createInitialState({ seed: 1 });
  const verde = s.compute.offers.find((o) => o.wantedBy === 'openbrain');
  const spot = s.compute.offers.find((o) => o.id === verde.fallback);
  s.compute.offers = s.compute.offers.filter((o) => o !== verde); // as projectQueue leaves it once Verde is queued
  const items = roundEndItems(s);
  const openbrain = items.find((i) => i.id === 'openbrain');
  assert.ok(openbrain, 'OpenBrain still takes a card');
  assert.equal(openbrain.offerId, spot.id);
  assert.equal(openbrain.second, true);
  assert.match(openbrain.text, /^OpenBrain signs Spot market's \d+ units?, its second choice\. Sign it first and OpenBrain goes without/);
  assert.ok(s.compute.offers.includes(spot), 'the model does not take cards off the real board');
  assert.equal(s.rivals.find((r) => r.id === 'openbrain').named.offerId, verde.id, 'the model does not clear rival plans');
});

test('the why box says what is left free and never rounds a slice away', () => {
  const s = createInitialState({ seed: 1 });
  assert.match(raceModel(s).why, /Safety takes 1 unit of your 10 units, leaving 9 units free\./);
  s.compute.online = 4; // safety 0.4, free 3.6
  const why = raceModel(s).why;
  assert.match(why, /Safety takes 0\.4 units of your 4 units, leaving 3\.6 units free\./);
  assert.match(raceModel(s).rows.find((row) => row.you).computeNote, /^3\.6 units free/);
});

test('the why box names what monitors take, so its numbers add up', () => {
  const s = createInitialState({ seed: 1 });
  s.era = 2;
  s.compute.online = 20;
  s.automation.checks.monitors = 1;
  const why = raceModel(s).why;
  assert.match(why, /monitors take/i);
  const n = (label) => Number(why.match(new RegExp(`${label} ([\\d.]+) units`, 'i'))[1]);
  const total = n('monitors take') + n('safety takes') + n('leaving');
  assert.ok(Math.abs(total - 20) <= 0.15, why);
  assert.match(raceModel(s).rows.find((row) => row.you).computeNote, /free after monitors, users and safety$/);
});
