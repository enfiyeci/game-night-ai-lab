import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { PACK, createAutomation, REVIEWER_CAPACITY, MONITOR_CAPACITY, AI_REVIEW_BLIND } from '../sim/data/automation.js';
import {
  jobLevels, researchSpeed, claimedSpeed, codeShare, timeShares, bottleneck, checkLoad, checking,
  reviewerCost, controlUnits, effectiveChecks, automationRisk,
} from '../sim/automation.js';

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
