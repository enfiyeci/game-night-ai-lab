import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { handBack } from '../sim/automation.js';
import { roundWord } from '../sim/time.js';
import {
  automationBase, automationDraft, automationPayload, automationView, automationOpinions, dressingView, screenWallView,
} from '../ui/logic/automation.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

const atEra = (era) => {
  const s = createInitialState();
  s.era = era;
  return s;
};

test('the draft starts from the state and a queued choice', () => {
  const s = atEra(4);
  assert.deepEqual(automationDraft(s), {
    levels: { review: 2, experiments: 2, choosing: 1, direction: 0 },
    checks: { reviewers: 0, monitors: 0, aiReview: false },
  });
  assert.equal(automationDraft(s, { levels: { review: 3 }, checks: { reviewers: 2 } }).levels.review, 3);
});

test("the dialog validates against this turn's queued compute split, not the start-of-turn state", () => {
  const s = atEra(4);
  s.compute.online = 30;
  s.compute.split.safety = 0;
  const draft = { ...automationDraft(s), checks: { reviewers: 0, monitors: 1, aiReview: false } }; // 21 units
  assert.equal(automationView(s, draft).error, '');
  const base = automationBase(s, { moves: [], computeSplit: { safety: 0.5 } });
  assert.equal(automationView(base, draft).error, 'not enough free compute for monitors');
});

test('a refused draft keeps the level picks on the grid and still says why', () => {
  const s = atEra(4);
  s.compute.online = 10; // too little for one monitor level
  const draft = automationDraft(s);
  draft.levels.review = 3;
  draft.checks.monitors = 3;
  const view = automationView(s, draft);
  assert.equal(view.error, 'not enough free compute for monitors');
  assert.equal(view.rows.find((row) => row.id === 'review').level, 3);
  assert.deepEqual(view.checks, s.automation.checks);
  const picked = automationView(s, { ...draft, checks: { ...s.automation.checks } });
  assert.equal(picked.error, '');
  assert.equal(view.speed, picked.speed);
  assert.deepEqual(view.rows.map((row) => row.timeShare), picked.rows.map((row) => row.timeShare));
});

test('the payload sends only the jobs the player changed, so a hand-back is not undone by OK', () => {
  const s = atEra(4);
  handBack(s);
  const draft = automationDraft(s);
  draft.levels.review = 2;
  assert.deepEqual(automationPayload(s, draft).levels, { review: 2 });
});

test('the view shows the grid, speed, claim, code share and checks', () => {
  const s = atEra(4);
  const view = automationView(s, automationDraft(s));
  assert.equal(view.error, '');
  assert.deepEqual(view.rows.map((row) => [row.id, row.level, row.pack, row.max, row.fixed]), [
    ['code', 3, 3, 3, true],
    ['review', 2, 2, 3, false],
    ['experiments', 2, 2, 3, false],
    ['choosing', 1, 1, 2, false],
    ['direction', 0, 0, 1, false],
  ]);
  assert.equal(view.bottleneck, 'experiments');
  assert.equal(view.claimed, 2.4);
  assert.equal(view.codeShare, 0.8);
  assert.equal(view.checkedShare, 0);
  const pushed = automationView(s, { ...automationDraft(s), levels: { review: 9 } });
  assert.notEqual(pushed.error, '');
});

test('advisors react to unchecked work and to room to push', () => {
  const s = atEra(4);
  const lines = automationOpinions(automationView(s, automationDraft(s)));
  assert.deepEqual(lines.map((line) => line.id), ['research', 'safety', 'cfo', 'policy']);
  assert.equal(lines[0].mood, 'eager');
  assert.equal(lines[1].mood, 'alarmed');
});

test('the Safety line names the era\'s round, not always a month', () => {
  const s = atEra(1);
  const safety = automationOpinions(automationView(s, automationDraft(s)), roundWord(s.era)).find((line) => line.id === 'safety');
  assert.match(safety.text, /this quarter/);
  assert.doesNotMatch(safety.text, /month/);
});

test('office dressing follows code level, exposure and speed', () => {
  const early = dressingView(atEra(1));
  assert.equal(early.agents, 1);
  assert.equal(early.pile, 0);
  assert.ok(early.glow < 0.05);
  const era5 = dressingView(atEra(5));
  assert.equal(era5.agents, 4);
  assert.equal(era5.pile, 3);
  assert.ok(era5.glow > 0.8);
});

test('the screen wall plots the recorded history against the line', () => {
  const s = atEra(5);
  s.automation.history = [
    { turn: 0, era: 1, speed: 1.03, claimed: 1.1 },
    { turn: 16, era: 5, speed: 2.1, claimed: 3.8 },
  ];
  const view = screenWallView(s);
  assert.equal(view.line, 2);
  assert.equal(view.top, 4);
  assert.equal(view.latest.speed, 2.1);
});

test('scenarios reach the grid state and the waiting line card', () => {
  assert.ok([1, 2, 3, 4, 5].some((seed) => SCENARIOS.automation(seed).era === 4));
  assert.ok([1, 2, 3, 4, 5].some((seed) => SCENARIOS.ownLine(seed).pendingEvents.some((pending) => pending.id === 'ownLine')));
});
