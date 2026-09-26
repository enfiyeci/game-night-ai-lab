import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  PACK, createAutomation, REVIEWER_CAPACITY, MONITOR_CAPACITY, AI_REVIEW_BLIND, RUN_BONUS_PER_SPEED, POINTS_PER_SPEED,
} from '../sim/data/automation.js';
import {
  jobLevels, researchSpeed, claimedSpeed, codeShare, timeShares, bottleneck, checkLoad, checking,
  reviewerCost, controlUnits, effectiveChecks, automationRisk, setAutomation, handBack, addMonitor, automationTick,
} from '../sim/automation.js';
import { endTurn } from '../sim/turn.js';
import { startRun } from '../sim/training.js';
import { createRng } from '../sim/rng.js';

const near = (actual, expected, eps = 0.01) => assert.ok(Math.abs(actual - expected) < eps, `${actual} is not near ${expected}`);
const atEra = (era) => {
  const s = createInitialState();
  s.era = era;
  return s;
};

test('a new run starts with the pack, no checks, and the line at ×2', () => {
  assert.deepEqual(createInitialState().automation, createAutomation());
  assert.equal(createAutomation().line, 2);
});

test('writing code follows the pack and the hand-offs start with it', () => {
  for (const era of [1, 2, 3, 4, 5]) assert.deepEqual(jobLevels(atEra(era)), PACK[era]);
});

test('speed at the pack matches the spec, with the era-4 anchor near ×1.5 at 80% code', () => {
  const expected = { 1: 1.03, 2: 1.04, 3: 1.16, 4: 1.57, 5: 2.64 };
  for (const era of [1, 2, 3, 4, 5]) near(researchSpeed(PACK[era]), expected[era]);
  assert.equal(codeShare(PACK[4]), 0.8);
});

test('pushing every hand-off one level ahead of the pack', () => {
  near(researchSpeed([2, 2, 2, 1, 1]), 1.375);
  near(researchSpeed([3, 3, 3, 2, 1]), 2.27);
  near(researchSpeed([4, 4, 4, 3, 2]), 4.75);
});

test('the bottleneck is the job with the largest share of the remaining time', () => {
  assert.equal(bottleneck(PACK[4]), 'experiments');
  near(timeShares(PACK[4]).reduce((a, b) => a + b, 0), 1, 1e-9);
});

test('checking load, capacity, AI review and exposure', () => {
  near(checkLoad(PACK[3]), 0.09);
  near(checkLoad(PACK[4]), 0.435);
  near(checkLoad(PACK[5]), 0.945);
  near(checkLoad([4, 4, 4, 3, 2]), 1.305);
  const none = checking({ reviewers: 0, monitors: 0, aiReview: false }, PACK[4]);
  near(none.unchecked, 0.435);
  near(none.exposure, 0.435);
  near(none.checkedShare, 0);
  // Capacities come from the constants, so Task 5's tuning does not break these tests.
  const humanPeople = 2 * REVIEWER_CAPACITY + MONITOR_CAPACITY;
  const people = checking({ reviewers: 2, monitors: 1, aiReview: false }, PACK[4]);
  near(people.human, humanPeople);
  near(people.unchecked, 0.435 - humanPeople);
  near(people.checkedShare, humanPeople / 0.435);
  const humanMax = 3 * (REVIEWER_CAPACITY + MONITOR_CAPACITY);
  const ai = checking({ reviewers: 3, monitors: 3, aiReview: true }, [4, 4, 4, 3, 2]);
  near(ai.human, humanMax);
  near(ai.ai, 1.305 - humanMax);
  near(ai.unchecked, 0);
  near(ai.exposure, AI_REVIEW_BLIND * (1.305 - humanMax));
  near(ai.checkedShare, 1);
  assert.equal(checking({ reviewers: 0, monitors: 0, aiReview: false }, [0, 0, 0, 0, 0]).checkedShare, 1);
});

test('reviewers cost money that scales with the era; monitors reserve compute', () => {
  const s = atEra(4);
  s.automation.checks = { reviewers: 2, monitors: 3, aiReview: false };
  assert.equal(reviewerCost(s), 10);
  assert.equal(controlUnits(s), 63);
});

test('the Head of Research overstates the speed', () => {
  assert.equal(claimedSpeed(1.572), 2.4);
  assert.equal(claimedSpeed(1), 1);
});

test('risk grows with exposure and with the newest model, released or not', () => {
  const s = atEra(4);
  s.capability = 50;
  s.alignmentDebt = 80;
  const open = automationRisk(s);
  assert.ok(open > 0);
  s.pendingModel = { capability: 80 };
  assert.ok(automationRisk(s) > open);
  const high = automationRisk(s);
  s.automation.checks.aiReview = true;
  near(automationRisk(s), high / 2, 1e-9);
  s.compute.online = 500;
  s.automation.checks = { reviewers: 3, monitors: 3, aiReview: false };
  assert.equal(automationRisk(s), 0);
});

test('monitors that no longer fit in online compute stop checking', () => {
  const s = atEra(4);
  s.automation.checks = { reviewers: 0, monitors: 3, aiReview: false }; // 63 units in era 4
  s.compute.online = 30; // room for one 21-unit level
  assert.equal(effectiveChecks(s).monitors, 1);
  s.compute.online = 500;
  assert.equal(effectiveChecks(s).monitors, 3);
});

const miss = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };

test('the free action stores hand-offs as offsets from the pack, so they creep with it', () => {
  const s = atEra(3);
  assert.deepEqual(setAutomation(s, { levels: { review: 2, experiments: 0 } }), { ok: true });
  assert.deepEqual(jobLevels(s), [2, 2, 0, 0, 0]);
  s.era = 4;
  assert.deepEqual(jobLevels(s), [3, 3, 1, 1, 0]);
});

test('the free action rejects code, unknown jobs, levels past one above the pack, and bad checks', () => {
  const s = atEra(3);
  assert.equal(setAutomation(s, { levels: { code: 3 } }).error, 'writing code follows the pack');
  assert.equal(setAutomation(s, { levels: { cooking: 1 } }).error, 'unknown job cooking');
  assert.equal(setAutomation(s, { levels: { review: 3 } }).ok, false);
  assert.equal(setAutomation(s, { levels: { review: 1.5 } }).ok, false);
  assert.equal(setAutomation(s, { checks: { reviewers: 4 } }).ok, false);
  assert.equal(setAutomation(s, { checks: { aiReview: 'yes' } }).ok, false);
  assert.equal(setAutomation(s, { checks: { interns: 1 } }).ok, false);
  assert.equal(setAutomation(s, { extra: 1 }).ok, false);
  assert.equal(setAutomation(s, null).ok, false);
  assert.equal(setAutomation(s, { levels: { review: 2 }, checks: { reviewers: 9 } }).ok, false);
  assert.deepEqual(s.automation, createAutomation(), 'a rejected choice changes nothing');
});

test('monitors must fit in free compute; keeping or lowering them always works', () => {
  const s = atEra(4);
  s.compute.online = 30; // one era-4 monitor level is 21 units
  s.compute.split.safety = 0;
  assert.equal(setAutomation(s, { checks: { monitors: 2 } }).error, 'not enough free compute for monitors');
  assert.equal(setAutomation(s, { checks: { monitors: 1 } }).ok, true);
  s.compute.online = 10;
  assert.equal(setAutomation(s, { checks: { reviewers: 1 } }).ok, true);
  assert.equal(setAutomation(s, { checks: { monitors: 0 } }).ok, true);
});

test('hand-back holds the four jobs at people only in every era until the player changes them', () => {
  const s = atEra(4);
  handBack(s);
  assert.deepEqual(jobLevels(s), [3, 0, 0, 0, 0]);
  s.era = 5;
  assert.deepEqual(jobLevels(s), [4, 0, 0, 0, 0]);
  assert.equal(setAutomation(s, { levels: { review: 3 } }).ok, true);
  assert.deepEqual(jobLevels(s), [4, 3, 0, 0, 0]);
});

test('addMonitor adds one level while it fits and stops at the top level', () => {
  const s = atEra(3);
  s.compute.online = 200;
  assert.equal(addMonitor(s).ok, true);
  assert.equal(s.automation.checks.monitors, 1);
  s.automation.checks.monitors = 3;
  assert.equal(addMonitor(s).ok, false);
});

test('endTurn applies the free action and reports its errors', () => {
  const s = atEra(3);
  const ok = endTurn(s, { automation: { levels: { review: 2 } } }, miss);
  assert.deepEqual(ok.errors, []);
  assert.equal(jobLevels(ok.state)[1], 2);
  const bad = endTurn(s, { automation: { levels: { code: 4 } } }, miss);
  assert.ok(bad.errors.includes('writing code follows the pack'));
});

const hit = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const ladder = (events) => events.filter((event) => event.type === 'internalWarning' || event.type === 'internalIncident');
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
const withCompute = (s) => {
  s.compute.contracts.push({
    id: 'test-capacity', supplier: 'starter', units: 90, price: 0, monthsLeft: null,
    needsPower: false, string: null, arrivedTurn: 0, scaledDown: false, troubled: false,
    dark: false, bumpTurn: null, exclusiveBought: false, headline: null,
  });
  s.compute.online = 100;
  return s;
};

test('trouble escalates warning, incident, exfiltration, then takeover at high capability', () => {
  const s = atEra(4);
  s.capability = 75;
  s.alignmentDebt = 80;
  assert.deepEqual(ladder(automationTick(s, hit)), [{ type: 'internalWarning', stage: 1 }]);
  assert.deepEqual(ladder(automationTick(s, hit)), [{ type: 'internalIncident', stage: 2 }]);
  assert.deepEqual(ladder(automationTick(s, hit)), [{ type: 'internalIncident', stage: 3 }]);
  automationTick(s, hit);
  assert.equal(s.ending, 'quietTakeover');
});

test('no trouble before era 3, and no roll at all when people check every piece of work', () => {
  const early = atEra(2);
  early.capability = 90;
  early.alignmentDebt = 90;
  for (let i = 0; i < 5; i++) automationTick(early, hit);
  assert.equal(early.automation.stage, 0);
  const checked = atEra(4);
  checked.capability = 90;
  checked.alignmentDebt = 90;
  checked.compute.online = 500;
  checked.automation.checks = { reviewers: 3, monitors: 3, aiReview: false };
  let draws = 0;
  automationTick(checked, { ...hit, chance: () => { draws += 1; return true; } });
  assert.equal(draws, 0);
  assert.equal(checked.automation.stage, 0);
});

test('no takeover before era 4: a hit at stage three holds there, then accept-shutdown adds one step', () => {
  const s = atEra(3);
  s.capability = 75;
  s.alignmentDebt = 80;
  s.constitution.hardLines = ['accept-shutdown'];
  for (let i = 0; i < 3; i++) automationTick(s, hit);
  assert.equal(s.automation.stage, 3);
  for (let i = 0; i < 3; i++) assert.deepEqual(ladder(automationTick(s, hit)), []);
  assert.equal(s.ending, null);
  s.era = 4;
  assert.deepEqual(ladder(automationTick(s, hit)), []);
  assert.equal(s.automation.stage, 4);
  automationTick(s, hit);
  assert.equal(s.ending, 'quietTakeover');
});

test('no takeover below capability 70; misses do not escalate', () => {
  const s = atEra(4);
  s.capability = 60;
  s.alignmentDebt = 80;
  for (let i = 0; i < 6; i++) automationTick(s, hit);
  assert.equal(s.automation.stage, 3);
  assert.equal(s.ending, null);
  const calm = atEra(4);
  automationTick(calm, miss);
  assert.equal(calm.automation.stage, 0);
});

test('speed feeds the active run, research points and, from ×1.5, one turn off once per run', () => {
  const s = atEra(4);
  s.activeRun = { bonus: 0, units: 2, turnsLeft: 5 };
  const points = s.researchPoints;
  automationTick(s, miss);
  near(s.activeRun.bonus, RUN_BONUS_PER_SPEED * (researchSpeed(PACK[4]) - 1), 1e-9);
  near(s.researchPoints - points, POINTS_PER_SPEED * (researchSpeed(PACK[4]) - 1), 1e-9);
  assert.equal(s.activeRun.turnsLeft, 4);
  automationTick(s, miss);
  assert.equal(s.activeRun.turnsLeft, 4);
  const slow = atEra(3);
  slow.activeRun = { bonus: 0, units: 2, turnsLeft: 5 };
  automationTick(slow, miss);
  assert.equal(slow.activeRun.turnsLeft, 5);
});

test('each tick records measured and claimed speed', () => {
  const s = atEra(4);
  s.turn = 13;
  automationTick(s, miss);
  assert.deepEqual(s.automation.history, [{ turn: 13, era: 4, speed: researchSpeed(PACK[4]), claimed: 2.4 }]);
});

test('crossing the line reports it once, on that turn', () => {
  const s = atEra(5);
  s.turn = 16;
  assert.deepEqual(automationTick(s, miss)[0], { type: 'ownLineCrossed', speed: researchSpeed(PACK[5]), line: 2 });
  assert.equal(s.automation.lineTurn, 16);
  s.turn = 17;
  assert.equal(automationTick(s, miss).some((event) => event.type === 'ownLineCrossed'), false);
  s.automation.line = 3; // era 5's pack runs at ×2.64, below ×3
  assert.equal(automationTick(s, miss).some((event) => event.type === 'ownLineCrossed'), false);
});

test('endTurn: pushing the hand-offs makes a finishing run gain more', () => {
  const gain = (automation) => {
    const s = withCompute(atEra(3));
    assert.equal(startRun(s, recipe).ok, true);
    s.activeRun.turnsLeft = 1;
    s.activeRun.spikeChance = 0;
    return endTurn(s, automation ? { automation } : {}, createRng(1)).state.pendingModel.gain;
  };
  assert.ok(gain({ levels: { review: 2, experiments: 2, choosing: 1, direction: 1 } }) > gain(null));
});

test('the old moves are gone', () => {
  const { errors } = endTurn(atEra(3), { moves: [{ type: 'deployInternal', control: 1 }] }, miss);
  assert.ok(errors.includes('unknown move deployInternal'));
});
