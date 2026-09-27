import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { rollTrainingHazard, resolveHazard, applyAlignmentFaking, exposeConcealed, totalDebt, rewardHackSize, evalGamingDebt } from '../sim/hazards.js';
import { endTurn } from '../sim/turn.js';
import { releaseModel } from '../sim/release.js';
import { startRun, advanceRun, resolveRun } from '../sim/training.js';
import { safetySpend } from '../sim/economy.js';
import { eraScale } from '../sim/data/compute.js';

const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const no = { ...yes, chance: () => false };

test('reward hacking can appear only with verifiable-reward, reasoning or agentic RL', () => {
  const s = createInitialState();
  assert.equal(rollTrainingHazard(s, [{ id: 'synthetic-sft' }], []), null);
  assert.deepEqual(rollTrainingHazard(s, [{ id: 'rlvr-light' }], []), { type: 'rewardHacking', size: rewardHackSize(1) });
  assert.deepEqual(rollTrainingHazard(s, [], ['agentic']), { type: 'rewardHacking', size: rewardHackSize(1) });
});

test('a hackable recipe always meets reward hacking', () => {
  const s = createInitialState();
  s.era = 3;
  assert.deepEqual(rollTrainingHazard(s, [{ id: 'reasoning-rl' }], []), { type: 'rewardHacking', size: rewardHackSize(3) });
  assert.equal(rollTrainingHazard(s, [{ id: 'human-sft' }], []), null);
});

test('penalizing the thought hides the debt; fixing removes it; ignoring leaves it visible', () => {
  for (const [choice, visible, hidden] of [['penalize', 0, 6], ['fix', 0, 0], ['ignore', 6, 0]]) {
    const s = createInitialState();
    s.alignmentDebt = 0; s.concealedDebt = 0;
    s.pendingModel = { hazard: { type: 'rewardHacking', size: 6 }, releaseDelay: 0 };
    assert.equal(resolveHazard(s, choice).ok, true);
    assert.equal(s.alignmentDebt, visible);
    assert.equal(s.concealedDebt, hidden);
    assert.equal(s.pendingModel.hazard, null);
    if (choice === 'fix') assert.equal(s.pendingModel.releaseDelay, 1);
  }
});

test('alignment faking hides part of a debt reduction from era 3 on capable models', () => {
  const s = createInitialState();
  s.era = 2;
  assert.equal(applyAlignmentFaking(s, -8, 70), -8);
  s.era = 3; s.concealedDebt = 0;
  assert.equal(applyAlignmentFaking(s, -8, 40), -8);
  assert.equal(applyAlignmentFaking(s, -8, 70), -6);
  assert.equal(s.concealedDebt, 2);
  assert.equal(applyAlignmentFaking(s, 5, 70), 5);
});

test('exposure moves concealed debt back into view', () => {
  const s = createInitialState();
  s.alignmentDebt = 10; s.concealedDebt = 20;
  assert.equal(exposeConcealed(s, 0.5), 10);
  assert.equal(s.alignmentDebt, 20);
  assert.equal(s.concealedDebt, 10);
  assert.equal(totalDebt(s), 30);
});

test('endTurn applies hazardChoice to the pending model', () => {
  const s = createInitialState();
  s.pendingModel = { hazard: { type: 'rewardHacking', size: 6 }, releaseDelay: 0, capability: 30, flags: [], spec: {}, size: 'small', publicEffects: { pt: 0, st: 0, heat: 0, govUs: 0, govIntl: 0, usersMult: 1 }, openWeightsMx: 20 };
  const out = endTurn(s, { hazardChoice: 'penalize' }, yes);
  assert.equal(out.state.pendingModel.hazard, null);
  assert.ok(out.state.concealedDebt >= 6);
});

test('the Head of Safety cannot see concealed debt but the recorded truth includes it', async () => {
  const { advisorReadings } = await import('../sim/advisors.js');
  const s = createInitialState();
  s.alignmentDebt = 10; s.concealedDebt = 40; s.misuseExposure = 0;
  const safety = advisorReadings(s, { ...no, normal: (m) => m }).find((r) => r.id === 'safety');
  assert.equal(safety.truth, 50);
  assert.ok(safety.estimate < 30);
});

test('interpretability spend exposes a tenth of the concealed debt each turn', () => {
  const s = createInitialState();
  s.concealedDebt = 20;
  assert.equal(endTurn(s, {}, no).state.concealedDebt, 20);
  s.compute.online = 10 * eraScale(s.era);
  s.compute.split.safety = 0.5;
  assert.ok(safetySpend(s) >= 5);
  assert.equal(endTurn(s, {}, no).state.concealedDebt, 18);
});

test('exposure moves only what fits under the visible cap', () => {
  const s = createInitialState();
  s.alignmentDebt = 90; s.concealedDebt = 40;
  assert.equal(exposeConcealed(s, 0.5), 10);
  assert.equal(s.alignmentDebt, 100);
  assert.equal(s.concealedDebt, 30);
  assert.equal(totalDebt(s), 130);
});

// A real trained model (no hackable cards), with a hazard attached by hand.
function trainedState({ hazard = true } = {}) {
  const s = createInitialState();
  startRun(s, { sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 }, picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft'] } });
  advanceRun(s, no);
  s.pendingModel.hazard = hazard ? { type: 'rewardHacking', size: 6 } : null;
  return s;
}
const release = { picks: ['channel-app'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };

test('releasing over an unanswered hazard reports the automatic ignore', () => {
  const s = trainedState();
  const out = endTurn(s, { moves: [{ type: 'release', release }] }, no);
  assert.deepEqual(out.errors, []);
  assert.ok(out.events.some((e) => e.type === 'hazardResolved' && e.choice === 'ignore' && e.auto === true));
});

test('fixing the hazard delays activation by one turn', () => {
  const plain = trainedState({ hazard: false });
  const fixed = trainedState();
  resolveHazard(fixed, 'fix');
  const a = releaseModel(plain, release, no).model;
  const b = releaseModel(fixed, release, no).model;
  assert.equal(b.activeFromTurn, a.activeFromTurn + 1);
});

test('a finished run with a hackable recipe meets reward hacking and feeds alignment faking', () => {
  const s = createInitialState();
  const hackRun = { recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: ['rlvr-light'] } }, spikes: 0, bonus: 0 };
  assert.deepEqual(resolveRun(s, hackRun).hazard, { type: 'rewardHacking', size: rewardHackSize(1) });
  const t = createInitialState();
  t.era = 3; t.capability = 60; t.concealedDebt = 0;
  const safeRun = { recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0.5 }, picks: { pre: [], mid: [], post: ['synthetic-sft'] } }, spikes: 0, bonus: 0 };
  resolveRun(t, safeRun);
  assert.ok(t.concealedDebt > 0);
});

test('eval gaming adds concealed debt that grows with capability from era 3', () => {
  const s = createInitialState();
  s.era = 2;
  assert.equal(evalGamingDebt(s, 80), 0);
  s.era = 3;
  assert.ok(Math.abs(evalGamingDebt(s, 80) - 2) < 1e-9);
  const era3 = evalGamingDebt(s, 80);
  s.era = 4;
  assert.ok(evalGamingDebt(s, 80) > era3);
});

test('a finished run at era 3 adds eval-gaming debt without hackable cards or alignment training', () => {
  const t = createInitialState();
  t.era = 3; t.capability = 60; t.concealedDebt = 0;
  const run = { recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0 }, picks: { pre: [], mid: [], post: [] } }, spikes: 0, bonus: 0 };
  const model = resolveRun(t, run);
  assert.ok(t.concealedDebt > 0);
  assert.ok(Math.abs(t.concealedDebt - evalGamingDebt(t, model.capability)) < 1e-9);
});

test('a hazard choice with no pending hazard is a no-op', () => {
  const s = createInitialState();
  const out = endTurn(s, { hazardChoice: 'penalize' }, no);
  const ref = endTurn(s, {}, no);
  assert.deepEqual(out.errors, []);
  assert.equal(out.state.alignmentDebt, ref.state.alignmentDebt);
  assert.equal(out.state.concealedDebt, ref.state.concealedDebt);
});
