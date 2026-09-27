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

test('the player can rename the size words; blank or missing words fall back', () => {
  const words = { small: 'Haiku', medium: 'Sonnet', large: '  ', xl: 42 };
  assert.equal(modelName({ family: 'Kestrel', generation: 2, size: 'small', tierWords: words }), 'Kestrel 2 Haiku');
  assert.equal(modelName({ family: 'Kestrel', generation: 2, size: 'large', tierWords: words }), 'Kestrel 2 Grand');
  assert.equal(modelName({ family: 'Kestrel', generation: 2, size: 'xl', tierWords: words }), 'Kestrel 2 Apex');
  const s = trainedState();
  s.tierWords = { medium: ' Sonnet ' };
  const r = releaseModel(s, release);
  assert.equal(r.model.name, 'Kestrel 1 Sonnet');
  assert.equal(s.lastFlagship.name, 'Kestrel 1 Sonnet');
});

test('releasing a consumer model', () => {
  const s = trainedState();
  const r = releaseModel(s, release);
  assert.equal(r.ok, true);
  assert.equal(r.model.name, 'Kestrel 1 Core');
  assert.equal(r.model.channel, 'consumer');
  assert.equal(r.model.launch.benchmarks.length, 5);
  assert.equal(r.model.launch.press.length, 4);
  assert.ok(r.model.launch.press.every((p) => p.score >= 1 && p.score <= 10));
  assert.equal(s.lastFlagship.name, 'Kestrel 1 Core');
  assert.equal(s.lastFlagshipScore, r.model.launch.skill);
  assert.ok(r.model.users > 0);
  assert.equal(s.pendingModel, null);
  assert.equal(s.cash, 1000 - 35 - 10);
  assert.equal(s.capability, r.model.capability);
});

test('release needs a trained model and a family name', () => {
  const s = createInitialState();
  assert.equal(releaseModel(s, release).ok, false);
  const t = trainedState();
  assert.equal(releaseModel(t, { ...release, family: '' }).ok, false);
});

test('open weights lock in misuse exposure', () => {
  const s = trainedState();
  const before = s.misuseExposure;
  const openWeightsMx = s.pendingModel.openWeightsMx;
  releaseModel(s, { ...release, picks: ['channel-open'] });
  assert.equal(s.misuseExposure, before + openWeightsMx);
  assert.equal(s.misuseLocked, s.misuseExposure);
});

test('an open-weights release sets a stable flag, apart from stolen weights', () => {
  const s = trainedState();
  releaseModel(s, { ...release, picks: ['channel-open'] });
  assert.equal(s.flags.openWeights, true);
  assert.equal(s.flags.weightsStolen, undefined);
});

test('a later open-weight release adds to the already locked misuse', () => {
  const s = trainedState();
  s.misuseLocked = 60;
  s.misuseExposure = 50;
  const openWeightsMx = s.pendingModel.openWeightsMx;
  releaseModel(s, { ...release, picks: ['channel-open'] });
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
    const result = releaseModel(s, { ...release, ...invalid });
    assert.equal(result.ok, false);
    assert.deepEqual(s, before);
  }
});

test('a failed release leaves a pending training hazard untouched', () => {
  const s = trainedState();
  s.pendingModel.hazard = { type: 'rewardHacking', size: 6 };
  const before = structuredClone(s);
  assert.equal(releaseModel(s, { ...release, price: 'constructor' }).ok, false);
  assert.deepEqual(s, before);
});

test('releasing with an unresolved hazard ignores it, and an outside eval exposes concealed debt', () => {
  const s = trainedState();
  s.era = 2;
  s.alignmentDebt = 0; s.concealedDebt = 20;
  s.pendingModel.hazard = { type: 'rewardHacking', size: 6 };
  const r = releaseModel(s, { ...release, picks: ['eval-third', 'channel-app'] });
  assert.equal(r.ok, true);
  assert.equal(s.concealedDebt, 10);
  assert.equal(s.alignmentDebt, 6 + 10);
});

test('release-card debt is visible in the launch safety benchmark', () => {
  const s = trainedState();
  s.alignmentDebt = 10;
  s.concealedDebt = 0;
  const r = releaseModel(s, { ...release, picks: ['channel-app'] });
  const safety = r.model.launch.benchmarks.find((benchmark) => benchmark.id === 'gauntlet');
  assert.equal(s.alignmentDebt, 13);
  assert.equal(safety.truth, 91);
});

test('a new model on the same channel retires the old one', () => {
  const s = trainedState();
  const first = releaseModel(s, release).model;
  startRun(s, recipe);
  advanceRun(s, rng);
  const second = releaseModel(s, { ...release, generation: 2 }).model;
  assert.equal(first.active, false);
  assert.ok(second.users >= first.userCap / 4);
});

test('a delayed model retires its predecessor only when it activates', () => {
  const s = trainedState();
  const first = releaseModel(s, release).model;
  const carried = first.users;
  startRun(s, recipe);
  advanceRun(s, rng);
  const second = releaseModel(s, { ...release, picks: ['eval-full', 'channel-staged'], generation: 2 }).model;
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
  const older = releaseModel(s, { ...release, picks: ['eval-full', 'channel-staged'] }).model;
  startRun(s, recipe);
  advanceRun(s, rng);
  const newer = releaseModel(s, { ...release, generation: 2 }).model;
  assert.equal(newer.activated, true);
  s.turn = older.activeFromTurn;
  releaseApi.activateReleases(s);
  assert.equal(older.active, false);
  assert.equal(older.superseded, true);
  assert.equal(newer.active, true);
  assert.equal(newer.activated, true);
});

// An agentic trained model with no hidden debt yet; each test sets the debt and capability it needs.
function agentReleaseState(era) {
  const s = trainedState();
  s.era = era;
  s.pendingModel.flags.push('agentic');
  s.alignmentDebt = 0;
  s.concealedDebt = 0;
  return s;
}
function riskyAgenticState(era) {
  const s = agentReleaseState(era);
  s.pendingModel.capability = 90;
  s.alignmentDebt = 100;
  return s;
}

// Owner 2026-09-26, no dice: an agent release goes wrong when hidden debt × capability / 100 reaches the line.
test('an agent release over the misalignment line warns in era 3 and ends the run in era 4', () => {
  for (const [era, ending] of [[3, null], [4, 'misalignment']]) {
    const s = agentReleaseState(era);
    s.alignmentDebt = 50;
    s.pendingModel.capability = 90; // 50 × 90 / 100 = 45, over 40
    const r = releaseModel(s, release);
    assert.equal(s.ending ?? null, ending, `era ${era}`);
    if (era === 3) assert.equal(r.misalignmentIncident, true);
  }
});

test('an agent release under the line is quiet', () => {
  const s = agentReleaseState(4);
  s.alignmentDebt = 40;
  s.pendingModel.capability = 90; // 36, under 40
  releaseModel(s, release);
  assert.equal(s.ending ?? null, null);
});

test('an agent release exactly on the line goes wrong', () => {
  const s = agentReleaseState(4);
  s.alignmentDebt = 50;
  s.pendingModel.capability = 80; // 50 × 80 / 100 = 40, on the line
  releaseModel(s, release);
  assert.equal(releaseApi.MISALIGNMENT_LINE, 40);
  assert.equal(s.ending, 'misalignment');
});

test('the misalignment line reads capability only up to 100', () => {
  const s = agentReleaseState(4);
  s.alignmentDebt = 38;
  s.pendingModel.capability = 150; // counts as 100: 38 × 100 / 100 = 38, under 40
  assert.equal(releaseApi.misalignmentScore(s, 150), 38);
  releaseModel(s, release);
  assert.equal(s.ending ?? null, null);
});

test('hidden debt counts toward the line', () => {
  const s = agentReleaseState(4);
  s.alignmentDebt = 20;
  s.concealedDebt = 30;
  s.pendingModel.capability = 90; // (20 + 30) × 90 / 100 = 45
  releaseModel(s, release);
  assert.equal(s.ending, 'misalignment');
});

test('agentic releases can end the game in misalignment from era 4', () => {
  for (const era of [4, 5]) {
    const s = riskyAgenticState(era);
    const r = releaseModel(s, release);
    assert.equal(s.ending, 'misalignment', `era ${era}`);
    assert.equal(r.misalignmentIncident, undefined, `era ${era}`);
  }
});

test('no misalignment ending before era 4, however risky the release', () => {
  for (const era of [1, 2, 3]) {
    const s = riskyAgenticState(era);
    const r = releaseModel(s, release);
    assert.equal(s.ending, null, `era ${era}`);
    // Checks start in era 3, so an agent researched early is not checked at all.
    assert.equal(r.misalignmentIncident, era === 3 ? true : undefined, `era ${era}`);
  }
});

test('in era 3 crossing the misalignment line becomes a warning incident instead', () => {
  const s = riskyAgenticState(3);
  s.alignmentDebt = 60;
  s.concealedDebt = 40;
  // The same release without the agent flag is never checked, so it shows what the incident changes.
  const quiet = structuredClone(s);
  quiet.pendingModel.flags = quiet.pendingModel.flags.filter((flag) => flag !== 'agentic');
  const r = releaseModel(s, release);
  const q = releaseModel(quiet, release);
  assert.equal(s.ending, null);
  assert.equal(r.misalignmentIncident, true);
  assert.equal(q.misalignmentIncident, undefined);
  assert.equal(s.publicTrust, quiet.publicTrust - 5);
  // Half the hidden debt comes into view; none of it goes away.
  assert.equal(s.concealedDebt, quiet.concealedDebt / 2);
  assert.equal(s.alignmentDebt + s.concealedDebt, quiet.alignmentDebt + quiet.concealedDebt);
  assert.deepEqual(s.feed.at(-1), { turn: s.turn, day: s.day, handle: '@sre_oncall', text: s.feed.at(-1).text, tag: 'warning' });
  assert.equal(quiet.feed.some((post) => post.handle === '@sre_oncall'), false);
});

test('the era-3 incident uses the ending line, so a low-debt release stays quiet', () => {
  const s = trainedState();
  s.era = 3;
  s.pendingModel.flags.push('agentic');
  s.alignmentDebt = 0;
  const r = releaseModel(s, release);
  assert.equal(r.misalignmentIncident, undefined);
  assert.equal(s.feed.some((post) => post.handle === '@sre_oncall'), false);
});

test('press and reactions see the post-release rank', () => {
  const s = trainedState();
  s.pendingModel.capability = 40;
  const r = releaseModel(s, release);
  assert.equal(rank(s), 1);
  assert.ok(r.model.launch.reactions.some((x) => x.handle === '@lodestar_eng'));
});

test('the flagship bar is the best release, not the most recent', () => {
  const s = trainedState();
  s.pendingModel.capability = 80;
  const strong = releaseModel(s, release).model;
  startRun(s, recipe);
  advanceRun(s, rng);
  s.pendingModel.capability = 30;
  releaseModel(s, { ...release, generation: 2 });
  assert.equal(s.lastFlagship.name, strong.name);
  assert.equal(s.lastFlagshipScore, strong.launch.skill);
});

test('a stronger model on harder tests becomes the flagship, though its raw scores are lower', () => {
  const s = trainedState();
  s.pendingModel.capability = 60;
  const early = releaseModel(s, release).model;
  startRun(s, recipe);
  advanceRun(s, rng);
  s.era = 4; // harder tests on every capability row
  s.pendingModel.capability = 70;
  const late = releaseModel(s, { ...release, generation: 2 }).model;
  assert.ok(late.launch.capAvg < early.launch.capAvg, 'the harder tests score it lower');
  assert.equal(s.lastFlagship.name, late.name);
  assert.equal(late.flagshipName, early.name);
  assert.equal(late.bar, late.launch.flagshipAvg, 'the feed judges a version jump against the flagship re-scored on these tests');
  assert.equal(late.launchScore, late.launch.skill);
  assert.ok(s.lastFlagship.benchmarks.every((b) => typeof b.name === 'string'));
});

test('releaseDelay requires two turns between launches without mutating a refused release', () => {
  const s = trainedState();
  s.era = 5;
  s.compute.split.safety = 0;
  s.compute.online = recipeCost(s, recipe).units + 10;
  s.turn = 10;
  s.deal = { signed: {}, binding: ['releaseDelay'], trust: 2, collapsed: false, playerShipped: false };
  assert.equal(releaseModel(s, release).ok, true);
  startRun(s, recipe);
  advanceRun(s, rng);
  s.turn = 11;
  const before = structuredClone(s);
  assert.deepEqual(releaseModel(s, { ...release, generation: 2 }), {
    ok: false,
    error: 'this launch breaks the Geneva deal',
    breaksDeal: 'releaseDelay',
  });
  assert.deepEqual(s, before);
  const broken = structuredClone(s);
  const early = releaseModel(broken, { ...release, generation: 2, breakDeal: true });
  assert.equal(early.ok, true);
  assert.equal(early.brokeGap, true);
  s.turn = 12;
  assert.equal(releaseModel(s, { ...release, generation: 2 }).ok, true);
});

test('skipping a version number is recorded on the released model', () => {
  const s = trainedState();
  s.models.push({ name: 'Kestrel 1 Core', family: 'Kestrel', generation: 1, active: false });
  const r = releaseModel(s, { ...release, generation: 3 });
  assert.equal(r.ok, true);
  assert.equal(r.model.skipped, 1);
  assert.equal(r.model.name, 'Kestrel 3 Core');
});

test('the first release never counts as skipping', () => {
  const s = trainedState();
  const r = releaseModel(s, { ...release, generation: 4 });
  assert.equal(r.model.skipped, 0);
});

test('the release move names the four sizes, trimmed and capped at 16 characters', () => {
  const s = trainedState();
  const words = { small: ' Haiku ', medium: 'Sonnet', large: '', xl: 'Opus-Maximum-Extra-Long-Name' };
  const r = releaseModel(s, { ...release, tierWords: words });
  assert.equal(r.ok, true);
  assert.deepEqual(s.tierWords, { small: 'Haiku', medium: 'Sonnet', large: '', xl: 'Opus-Maximum-Ext' });
  assert.equal(r.model.name, 'Kestrel 1 Sonnet');
});

test('a failed release leaves the size words alone', () => {
  const s = trainedState();
  const r = releaseModel(s, { ...release, price: 'constructor', tierWords: { medium: 'Sonnet' } });
  assert.equal(r.ok, false);
  assert.equal(s.tierWords, undefined);
});
