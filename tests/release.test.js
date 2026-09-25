import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun } from '../sim/training.js';
import { releaseModel, modelName } from '../sim/release.js';

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
  assert.equal(r.model.outlets.length, 4);
  assert.ok(r.model.outlets.every((x) => x >= 1 && x <= 10));
  assert.ok(r.model.users > 0);
  assert.equal(s.pendingModel, null);
  assert.equal(s.cash, 1000 - 35 - 10);
  assert.equal(s.capability, r.model.capability);
  assert.equal(s.lastFlagshipScore, r.model.launchScore);
});

test('release needs a trained model and a family name', () => {
  const s = createInitialState();
  assert.equal(releaseModel(s, release, rng).ok, false);
  const t = trainedState();
  assert.equal(releaseModel(t, { ...release, family: '' }, rng).ok, false);
});

test('open weights lock in misuse exposure', () => {
  const s = trainedState();
  releaseModel(s, { ...release, picks: ['channel-open'] }, rng);
  assert.equal(s.misuseLocked, 20);
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

test('agentic releases can end the game in misalignment', () => {
  const s = trainedState();
  s.pendingModel.flags.push('agentic');
  s.pendingModel.capability = 90;
  s.alignmentDebt = 100;
  releaseModel(s, release, rng);
  assert.equal(s.ending, 'misalignment');
});
