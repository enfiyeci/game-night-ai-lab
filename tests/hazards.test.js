import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { rollTrainingHazard, resolveHazard, applyAlignmentFaking, exposeConcealed, totalDebt, rewardHackSize } from '../sim/hazards.js';
import { endTurn } from '../sim/turn.js';

const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const no = { ...yes, chance: () => false };

test('reward hacking can appear only with verifiable-reward, reasoning or agentic RL', () => {
  const s = createInitialState();
  assert.equal(rollTrainingHazard(s, [{ id: 'synthetic-sft' }], [], yes), null);
  assert.deepEqual(rollTrainingHazard(s, [{ id: 'rlvr-light' }], [], yes), { type: 'rewardHacking', size: rewardHackSize(1) });
  assert.equal(rollTrainingHazard(s, [{ id: 'reasoning-rl' }], [], no), null);
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
  s.budget.split = { training: 0.2, safety: 0.3, security: 0.1, product: 0.2, talent: 0.2 };
  assert.equal(endTurn(s, {}, no).state.concealedDebt, 18);
});
