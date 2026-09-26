import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun } from '../sim/training.js';
import { releaseModel, modelName } from '../sim/release.js';
import { recipeCost } from '../sim/recipe.js';
import * as releaseApi from '../sim/release.js';
import { rank } from '../sim/rivals.js';

const rng = { next: () => 0.5, int: () => 0, chance: (p) => p > 0.5, normal: (m) => m };
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
function trainedState() {
  const s = createInitialState();
  startRun(s, recipe);
  advanceRun(s, rng);
  return s;
}
const release = { picks: ['eval-full', 'channel-app'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };

test('model names are family + generation + tier word', () => {
  assert.equal(modelName({ family: 'Kestrel', generation: 3, size: 'small' }), 'Kestrel 3 Swift');
});

test('releasing a consumer model', () => {
  const s = trainedState();
  const r = releaseModel(s, release, rng);
  assert.equal(r.ok, true);
  assert.equal(r.model.name, 'Kestrel 1 Core');
  assert.equal(r.model.channel, 'consumer');
  assert.equal(r.model.launch.benchmarks.length, 5);
  assert.equal(r.model.launch.press.length, 4);
  assert.ok(r.model.launch.press.every((p) => p.score >= 1 && p.score <= 10));
  assert.equal(s.lastFlagship.name, 'Kestrel 1 Core');
  assert.equal(s.lastFlagshipScore, r.model.launch.capAvg);
  assert.ok(r.model.users > 0);
  assert.equal(s.pendingModel, null);
  assert.equal(s.cash, 1000 - 35 - 10);
  assert.equal(s.capability, r.model.capability);
});

test('release needs a trained model and a family name', () => {
  const s = createInitialState();
  assert.equal(releaseModel(s, release, rng).ok, false);
  const t = trainedState();
  assert.equal(releaseModel(t, { ...release, family: '' }, rng).ok, false);
});

test('open weights lock in misuse exposure', () => {
  const s = trainedState();
  const before = s.misuseExposure;
  const openWeightsMx = s.pendingModel.openWeightsMx;
  releaseModel(s, { ...release, picks: ['channel-open'] }, rng);
  assert.equal(s.misuseExposure, before + openWeightsMx);
  assert.equal(s.misuseLocked, s.misuseExposure);
});

test('an open-weights release sets a stable flag, apart from stolen weights', () => {
  const s = trainedState();
  releaseModel(s, { ...release, picks: ['channel-open'] }, rng);
  assert.equal(s.flags.openWeights, true);
  assert.equal(s.flags.weightsStolen, undefined);
});

test('a later open-weight release adds to the already locked misuse', () => {
  const s = trainedState();
  s.misuseLocked = 60;
  s.misuseExposure = 50;
  const openWeightsMx = s.pendingModel.openWeightsMx;
  releaseModel(s, { ...release, picks: ['channel-open'] }, rng);
  assert.equal(s.misuseLocked, 60 + openWeightsMx);
  assert.equal(s.misuseExposure, 60 + openWeightsMx);
});

test('release enum values must be own table entries', () => {
  for (const invalid of [
    { price: 'constructor' },
    { reasoning: 'constructor', reasoningCapable: true },
  ]) {
    const s = trainedState();
    if (invalid.reasoningCapable) s.pendingModel.spec.reasoningCapable = true;
    const before = structuredClone(s);
    const result = releaseModel(s, { ...release, ...invalid }, rng);
    assert.equal(result.ok, false);
    assert.deepEqual(s, before);
  }
});

test('a failed release leaves a pending training hazard untouched', () => {
  const s = trainedState();
  s.pendingModel.hazard = { type: 'rewardHacking', size: 6 };
  const before = structuredClone(s);
  assert.equal(releaseModel(s, { ...release, price: 'constructor' }, rng).ok, false);
  assert.deepEqual(s, before);
});

test('releasing with an unresolved hazard ignores it, and an outside eval exposes concealed debt', () => {
  const s = trainedState();
  s.era = 2;
  s.alignmentDebt = 0; s.concealedDebt = 20;
  s.pendingModel.hazard = { type: 'rewardHacking', size: 6 };
  const r = releaseModel(s, { ...release, picks: ['eval-third', 'channel-app'] }, rng);
  assert.equal(r.ok, true);
  assert.equal(s.concealedDebt, 10);
  assert.equal(s.alignmentDebt, 6 + 10);
});

test('release-card debt is visible in the launch safety benchmark', () => {
  const s = trainedState();
  s.alignmentDebt = 10;
  s.concealedDebt = 0;
  const r = releaseModel(s, { ...release, picks: ['channel-app'] }, rng);
  const safety = r.model.launch.benchmarks.find((benchmark) => benchmark.id === 'gauntlet');
  assert.equal(s.alignmentDebt, 13);
  assert.equal(safety.truth, 91);
});

test('a new model on the same channel retires the old one', () => {
  const s = trainedState();
  const first = releaseModel(s, release, rng).model;
  startRun(s, recipe);
  advanceRun(s, rng);
  const second = releaseModel(s, { ...release, generation: 2 }, rng).model;
  assert.equal(first.active, false);
  assert.ok(second.users >= first.userCap / 4);
});

test('a delayed model retires its predecessor only when it activates', () => {
  const s = trainedState();
  const first = releaseModel(s, release, rng).model;
  const carried = first.users;
  startRun(s, recipe);
  advanceRun(s, rng);
  const second = releaseModel(s, { ...release, picks: ['eval-full', 'channel-staged'], generation: 2 }, rng).model;
  assert.equal(typeof releaseApi.activateReleases, 'function');
  assert.equal(first.active, true);
  assert.equal(second.activated, false);
  s.turn = second.activeFromTurn;
  releaseApi.activateReleases(s);
  assert.equal(first.active, false);
  assert.equal(first.users, 0);
  assert.equal(second.activated, true);
  assert.ok(second.users >= carried);
  assert.ok(second.userCap >= second.users * 4);
});

test('an older delayed release is superseded by a newer active release', () => {
  const s = trainedState();
  const older = releaseModel(s, { ...release, picks: ['eval-full', 'channel-staged'] }, rng).model;
  startRun(s, recipe);
  advanceRun(s, rng);
  const newer = releaseModel(s, { ...release, generation: 2 }, rng).model;
  assert.equal(newer.activated, true);
  s.turn = older.activeFromTurn;
  releaseApi.activateReleases(s);
  assert.equal(older.active, false);
  assert.equal(older.superseded, true);
  assert.equal(newer.active, true);
  assert.equal(newer.activated, true);
});

test('agentic releases can end the game in misalignment', () => {
  const s = trainedState();
  s.pendingModel.flags.push('agentic');
  s.pendingModel.capability = 90;
  s.alignmentDebt = 100;
  releaseModel(s, release, rng);
  assert.equal(s.ending, 'misalignment');
});

test('press and reactions see the post-release rank', () => {
  const s = trainedState();
  s.pendingModel.capability = 40;
  const r = releaseModel(s, release, rng);
  assert.equal(rank(s), 1);
  assert.ok(r.model.launch.reactions.some((x) => x.handle === '@lodestar_eng'));
});

test('the flagship bar is the best release, not the most recent', () => {
  const s = trainedState();
  s.pendingModel.capability = 80;
  const strong = releaseModel(s, release, rng).model;
  startRun(s, recipe);
  advanceRun(s, rng);
  s.pendingModel.capability = 30;
  releaseModel(s, { ...release, generation: 2 }, rng);
  assert.equal(s.lastFlagship.name, strong.name);
  assert.equal(s.lastFlagshipScore, strong.launch.capAvg);
});

test('releaseDelay requires two turns between launches without mutating a refused release', () => {
  const s = trainedState();
  s.era = 5;
  s.compute.split.safety = 0;
  s.compute.online = recipeCost(s, recipe).units + 10;
  s.turn = 10;
  s.deal = { signed: {}, binding: ['releaseDelay'], trust: 2, collapsed: false, playerShipped: false };
  assert.equal(releaseModel(s, release, rng).ok, true);
  startRun(s, recipe);
  advanceRun(s, rng);
  s.turn = 11;
  const before = structuredClone(s);
  assert.deepEqual(releaseModel(s, { ...release, generation: 2 }, rng), {
    ok: false,
    error: 'the summit deal requires a gap between launches',
  });
  assert.deepEqual(s, before);
  s.turn = 12;
  assert.equal(releaseModel(s, { ...release, generation: 2 }, rng).ok, true);
});
