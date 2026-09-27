import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun } from '../sim/training.js';
import { releaseModel } from '../sim/release.js';
import { evalGaming, scoreLaunch, testScore } from '../sim/launch.js';
import { automationRisk } from '../sim/automation.js';
import { stealWeights } from '../sim/data/events.js';
import { dangerCapability } from '../sim/hazards.js';

// Owner pick A (2026-09-26): capability keeps counting past 100 so late progress shows; the danger rules read it only up to 100.
const noLuck = { next: () => 0.99, int: () => 0, chance: () => false, normal: (m) => m };
const recipe = (alignShare) => ({
  sliders: { size: 'medium', length: 'optimal', alignShare },
  picks: { pre: ['filtered-data', 'stability'], mid: [], post: ['synthetic-sft', 'dpo', 'safety-tuning'] },
});
const release = { picks: ['eval-full', 'channel-app'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };

function trainFrom(capability, { era = 1, alignShare = 0.15 } = {}) {
  const s = createInitialState();
  s.era = era;
  s.compute.online = 500;
  s.capability = capability;
  assert.equal(startRun(s, recipe(alignShare)).ok, true);
  const trained = advanceRun(s, noLuck);
  return { s, trained };
}

test('danger rules read capability up to 100', () => {
  assert.equal(dangerCapability(60), 60);
  assert.equal(dangerCapability(100), 100);
  assert.equal(dangerCapability(150), 100);
});

test('a run keeps adding capability past 100', () => {
  const { trained } = trainFrom(98);
  // Same run as the base training test: gain 15.725.
  assert.ok(Math.abs(trained.gain - 15.725) < 1e-9);
  assert.ok(Math.abs(trained.capability - 113.725) < 1e-9);
});

test('training debt counts only the capability gained up to 100', () => {
  const debtFrom = (capability) => {
    const { s } = trainFrom(capability, { alignShare: 0 });
    return s.alignmentDebt;
  };
  assert.equal(debtFrom(100), debtFrom(140));
  // From 90, only the first 10 points count: 10 × era 1 target 0.15 × alignDebtFactor 2.
  assert.ok(Math.abs(debtFrom(90) - debtFrom(100) - 3) < 1e-9);
});

test('hidden eval-gaming debt from training stops rising at capability 100', () => {
  const concealedFrom = (capability) => trainFrom(capability, { era: 3 }).s.concealedDebt;
  assert.ok(concealedFrom(100) > 0);
  assert.equal(concealedFrom(140), concealedFrom(100));
});

test('eval gaming on the launch benchmarks stops rising at capability 100', () => {
  const s = createInitialState();
  s.era = 3;
  s.concealedDebt = 100;
  assert.ok(evalGaming(s, 100, []) > 0);
  assert.equal(evalGaming(s, 150, []), evalGaming(s, 100, []));
});

test('the reasoning bonus still adds to eval gaming on top of the 100 ceiling', () => {
  const s = createInitialState();
  s.era = 3;
  s.concealedDebt = 100;
  // A model at 98 released with high reasoning (+6) games as 104, as before the change: (104 − 40) × era 3 rate 0.35.
  assert.ok(Math.abs(evalGaming(s, 104, [], 6) - 64 * 0.35) < 1e-9);
  // Past 100 only the model's own capability is capped: 150 + 6 games as 106.
  assert.ok(Math.abs(evalGaming(s, 156, [], 6) - 66 * 0.35) < 1e-9);
  const safetyShown = (capability, reasoningBonus) => scoreLaunch(s, { capability, reasoningBonus, spec: {}, flags: [] }, noLuck)
    .benchmarks.find((b) => b.id === 'gauntlet').shown;
  assert.ok(safetyShown(104, 6) > safetyShown(104, 0));
});

test('misuse exposure from a release stops rising at capability 100', () => {
  const exposureAfter = (capability) => {
    const { s } = trainFrom(20);
    s.pendingModel.capability = capability;
    const before = s.misuseExposure;
    assert.equal(releaseModel(s, release, noLuck).ok, true);
    return s.misuseExposure - before;
  };
  assert.ok(exposureAfter(100) > exposureAfter(90));
  assert.equal(exposureAfter(150), exposureAfter(100));
});

test('the misalignment check on an agent release reads capability up to 100', () => {
  const chanceAt = (capability) => {
    const { s } = trainFrom(20, { era: 3 });
    s.pendingModel.capability = capability;
    s.pendingModel.flags.push('agentic');
    s.alignmentDebt = 60;
    const seen = [];
    releaseModel(s, release, { ...noLuck, chance: (p) => { seen.push(p); return false; } });
    return seen.at(-1);
  };
  assert.ok(chanceAt(100) > chanceAt(90));
  assert.equal(chanceAt(150), chanceAt(100));
});

test('quiet-takeover risk reads the newest model up to 100', () => {
  const riskAt = (capability) => {
    const s = createInitialState();
    s.era = 4;
    s.alignmentDebt = 80;
    s.pendingModel = { capability };
    return automationRisk(s);
  };
  assert.ok(riskAt(100) > riskAt(90));
  assert.equal(riskAt(150), riskAt(100));
});

test('stolen weights lift Qilin past 100', () => {
  const s = createInitialState();
  const qilin = s.rivals.find((rival) => rival.id === 'qilin');
  qilin.capability = 98;
  stealWeights(s);
  assert.equal(qilin.capability, 103);
});

// Era 4-5 tests are sized for capability past 100 (bot runs 2026-09-26): the mid sits between the leading rival and the
// player at the era's opening, on a wider curve than the early tests, so the rival bar climbs and strong labs fill up.
test('a test can set its own curve width', () => {
  assert.equal(testScore(100, 110), 73); // TEST_WIDTH 10
  assert.equal(testScore(100, 110, 20), 62);
});

test('era 4 and 5 tests open low for a model past 100 and fill up for a much stronger one', () => {
  const lab = (era) => { const s = createInitialState(); s.era = era; return s; };
  const coding = (era, capability) => scoreLaunch(lab(era), { capability, spec: { reasoningCapable: true }, flags: ['agentic'] }, noLuck)
    .benchmarks.find((b) => b.id === 'patchwork');
  assert.ok(coding(4, 100).truth <= 35, `era 4 at 100: ${coding(4, 100).truth}`);
  assert.ok(coding(4, 250).truth >= 90, `era 4 at 250: ${coding(4, 250).truth}`);
  assert.ok(coding(5, 150).truth <= 30, `era 5 at 150: ${coding(5, 150).truth}`);
  assert.ok(coding(5, 330).truth >= 90, `era 5 at 330: ${coding(5, 330).truth}`);
  // The row carries its test's width, so the leaderboard and re-scored flagships use the same curve.
  assert.equal(coding(4, 100).width, 35);
  assert.equal(coding(4, 100).truth, testScore(130, 100, 35));
});

test('the best rival bar on an era 4 test climbs with the rival instead of sitting near zero', () => {
  const rivalBar = (rivalCapability) => {
    const s = createInitialState();
    s.era = 4;
    s.rivals.forEach((rival) => { rival.capability = rivalCapability; });
    return scoreLaunch(s, { capability: 200, spec: { reasoningCapable: true }, flags: ['agentic'] }, noLuck)
      .benchmarks.find((b) => b.id === 'patchwork').rival;
  };
  assert.ok(rivalBar(100) >= 20, `rival at 100: ${rivalBar(100)}`);
  assert.ok(rivalBar(150) >= 50, `rival at 150: ${rivalBar(150)}`);
});
