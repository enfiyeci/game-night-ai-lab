import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as demoSeeds from '../tools/demo-seeds.js';

const { findDemoSeeds, playTimeline, scoreStory } = demoSeeds;

const turns = (count, era = 1, events = []) => Array.from(
  { length: count },
  (_, index) => ({ turn: index + 1, era, actions: { moves: [] }, events: index === 0 ? events : [] }),
);

test('playTimeline is deterministic and records the strategy, actions and events', () => {
  const first = playTimeline('balanced', 7);
  const second = playTimeline('balanced', 7);

  assert.deepEqual(first, second);
  assert.equal(first.seed, 7);
  assert.equal(first.strategy, 'balanced');
  assert.equal(typeof first.ending, 'string');
  assert.ok(first.turns.length > 0);
  for (const turn of first.turns) {
    assert.equal(typeof turn.turn, 'number');
    assert.equal(typeof turn.era, 'number');
    assert.ok(Array.isArray(turn.actions.moves));
    assert.ok(Array.isArray(turn.events));
  }
});

test('scoreStory awards two points for each reached era from three onward', () => {
  assert.equal(scoreStory({ turns: turns(12, 2) }).score, 0);
  assert.equal(scoreStory({ turns: turns(12, 3) }).score, 2);
  assert.equal(scoreStory({ turns: turns(12, 4) }).score, 4);
  assert.equal(scoreStory({ turns: turns(12, 5) }).score, 6);
});

test('scoreStory recognises a late release whose safety test lied', () => {
  const release = {
    type: 'release',
    model: { launch: { benchmarks: [{ id: 'gauntlet', kind: 'safety', shown: 78, truth: 72 }] } },
  };
  const honest = structuredClone(release);
  honest.model.launch.benchmarks[0].shown = 76;

  assert.equal(scoreStory({ turns: turns(12, 2, [release]) }).score, 0, 'the release must be in era three or later');
  assert.equal(scoreStory({ turns: turns(12, 3, [honest]) }).score, 2, 'the era scores, but the small gap does not');
  assert.equal(scoreStory({ turns: turns(12, 3, [release]) }).score, 5);
});

test('scoreStory gives the listed event and ending points once each', () => {
  const storyTurns = turns(13, 5);
  storyTurns[0].events = [{ type: 'trainingHazard', id: 'reward-hacking' }];
  storyTurns[1].events = [{ type: 'warning', id: 'export-controls' }];
  storyTurns[2].events = [{ type: 'eventCard', id: 'export-controls' }];
  storyTurns[3].events = [{ type: 'internalIncident', stage: 2 }];
  storyTurns[4].events = [{ type: 'rivalRelease', id: 'qilin', leaderChanged: true }];
  storyTurns[5].events = [{ type: 'rivalRelease', id: 'lodestar', leaderChanged: true }];

  const scored = scoreStory({ ending: 'aligned', turns: storyTurns });
  assert.equal(scored.score, 16);
  assert.equal(scored.beats.length, 8);
});

test('scoreStory only awards warning-card points when the matching card follows', () => {
  const noCard = turns(12, 1, [{ type: 'warning', id: 'power-grid' }]);
  const wrongCard = structuredClone(noCard);
  wrongCard[1].events = [{ type: 'eventCard', id: 'chip-shortage' }];
  const cardFirst = structuredClone(noCard);
  cardFirst[0].events = [{ type: 'eventCard', id: 'power-grid' }];
  cardFirst[1].events = [{ type: 'warning', id: 'power-grid' }];
  const matchingCard = structuredClone(noCard);
  matchingCard[1].events = [{ type: 'eventCard', id: 'power-grid' }];

  assert.equal(scoreStory({ turns: noCard }).score, 0);
  assert.equal(scoreStory({ turns: wrongCard }).score, 0);
  assert.equal(scoreStory({ turns: cardFirst }).score, 0);
  assert.equal(scoreStory({ turns: matchingCard }).score, 3);
});

test('recording script describes every top-level strategy action and unknown keys', () => {
  assert.equal(typeof demoSeeds.describeActions, 'function');
  const line = demoSeeds.describeActions({
    moves: [],
    addressWarnings: ['power-grid'],
    eventChoices: { 'export-controls': 'negotiate' },
    constitution: { hardLines: ['honest', 'accept-shutdown'], rulings: { whistleblower: 'protect' } },
    presidentAnswers: ['be-direct', 'offer-audit'],
    investigate: ['s1'],
    surpriseAudit: { scope: 'full' },
  });

  assert.match(line, /address the power grid warning/);
  assert.match(line, /choose negotiate for export controls/);
  assert.match(line, /adopt a constitution with hard lines honest, accept shutdown/);
  assert.match(line, /rule protect for whistleblower/);
  assert.match(line, /answer the president: be direct, then offer audit/);
  assert.match(line, /look into 1 suspicion/);
  assert.match(line, /surprise audit: \{"scope":"full"\}/);
});

test('recording script describes the current compute actions from real strategy runs', () => {
  const balanced = playTimeline('balanced', 7);
  const balancedLines = balanced.turns.map((turn) => demoSeeds.describeActions(turn.actions));
  assert.ok(balancedLines.some((line) => /sign the CoreFlame compute deal/.test(line)));
  assert.ok(balancedLines.some((line) => /place a standard queue order/.test(line)));
  assert.ok(balancedLines.some((line) => /reserve 12% of compute for safety/.test(line)));
  assert.ok(balancedLines.some((line) => /take the President meeting/.test(line)));

  const safety = playTimeline('safety', 5);
  const safetyLines = safety.turns.map((turn) => demoSeeds.describeActions(turn.actions));
  assert.ok(safetyLines.some((line) => /build a nuclear power site/.test(line)));
});

test('recording script describes current contract, queue and split controls', () => {
  const line = demoSeeds.describeActions({
    computeSplit: { safety: 0.2, servingCap: 8, coverWithSpot: false, resellIdle: true },
    pledge: 0.2,
    contractActions: [{ id: 'starter', action: 'scaleDown' }],
    queueWithdraw: true,
    moves: [],
  });

  assert.match(line, /reserve 20% of compute for safety/);
  assert.match(line, /cap serving at 8 compute units/);
  assert.match(line, /do not cover serving shortfalls/);
  assert.match(line, /resell idle compute/);
  assert.match(line, /pledge 20% of compute to safety/);
  assert.match(line, /scale down contract starter/);
  assert.match(line, /withdraw the waiting queue order/);
});

test('recording script describes summit proposals, checks and promises', () => {
  const line = demoSeeds.describeActions({
    moves: [{ type: 'summit', proposals: ['evaluators', 'sharedSafety'], checks: { evaluators: 2 }, promises: { east: 'goFirst' } }],
  });

  assert.match(line, /propose a summit with evaluators, shared safety/);
  assert.match(line, /evaluators checked at level 2/);
  assert.match(line, /promises: go first for east/);
});

test('recording script describes every part of a constitution amendment', () => {
  const line = demoSeeds.describeActions({
    moves: [{
      type: 'amendConstitution',
      change: {
        remove: 'honest',
        add: 'accept-shutdown',
        ruling: { caseId: 'wrong', optionId: 'yield' },
      },
    }],
  });

  assert.match(line, /amend the constitution/);
  assert.match(line, /remove honest/);
  assert.match(line, /add accept shutdown/);
  assert.match(line, /rule yield for wrong/);
});

test('recording script preserves unknown move payloads', () => {
  const line = demoSeeds.describeActions({
    moves: [
      { type: 'moonshot', target: 'orbital', risk: 3 },
    ],
  });

  assert.match(line, /moonshot: \{"target":"orbital","risk":3\}/);
});

test('scoreStory rewards dramatic failures and penalises runs shorter than twelve turns', () => {
  assert.equal(scoreStory({ ending: 'misalignment', turns: turns(12) }).score, 2);
  assert.equal(scoreStory({ ending: 'quietTakeover', turns: turns(12) }).score, 2);
  assert.equal(scoreStory({ ending: 'rivalDisaster', turns: turns(12) }).score, 2);
  assert.equal(scoreStory({ ending: 'boardRemoved', turns: turns(12) }).score, 0);
  assert.equal(scoreStory({ ending: 'aligned', turns: turns(11) }).score, -2);
});

test('findDemoSeeds returns the requested top timelines sorted by score', () => {
  const found = findDemoSeeds(20);

  assert.equal(found.length, 10);
  for (let index = 1; index < found.length; index++) {
    assert.ok(found[index - 1].score >= found[index].score);
  }
  for (const result of found) {
    assert.equal(typeof result.seed, 'number');
    assert.equal(result.ending, playTimeline('balanced', result.seed).ending);
    assert.ok(Array.isArray(result.beats));
    assert.ok(Array.isArray(result.turns));
  }
});
