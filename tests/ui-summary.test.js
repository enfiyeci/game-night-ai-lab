import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENDINGS } from '../sim/endings.js';
import { simulate } from '../tools/balance.js';
import { runSummary } from '../ui/logic/summary.js';

test('summarizes a real simulated run with sane fields', () => {
  const state = simulate('balanced', 7);
  const summary = runSummary(state);

  assert.equal(summary.endingId, state.ending);
  assert.equal(summary.title, ENDINGS[state.ending].title);
  assert.equal(summary.kind, ENDINGS[state.ending].kind);
  assert.equal(summary.era, state.era);
  assert.equal(summary.turn, state.turn);
  assert.equal(summary.models, state.models.length);
  assert.equal(summary.bestModel, state.models.reduce((best, model) => (
    best == null || model.launchScore > best.launchScore ? model : best
  ), null)?.name ?? null);
  assert.ok(summary.advisors.length > 0);
  assert.ok(summary.advisors.every(({ id, meanError, verdict }) => (
    ['research', 'safety', 'cfo', 'policy'].includes(id)
      && Number.isFinite(meanError)
      && ['reliable', 'mixed', 'misleading'].includes(verdict)
  )));
  assert.ok(summary.advisors.some(({ id }) => id === summary.mostReliable));
  assert.ok(summary.advisors.some(({ id }) => id === summary.mostMisleading));
  assert.match(summary.shareLine, new RegExp(`^${ENDINGS[state.ending].title} in era ${state.era} after ${state.models.length} models?;`));
});

test('normalizes advisor errors and applies verdict thresholds', () => {
  const state = {
    ending: 'acquihire',
    era: 3,
    turn: 11,
    models: [
      { name: 'Kestrel 1 Core', launchScore: 31 },
      { name: 'Kestrel 2 Grand', launchScore: 44 },
    ],
    advisorHistory: [
      { readings: [
        { id: 'research', estimate: 4.9, truth: 0 },
        { id: 'safety', estimate: 7.5, truth: 0 },
        { id: 'cfo', estimate: 6, truth: 0 },
      ] },
      { readings: [
        { id: 'research', estimate: -4.9, truth: 0 },
        { id: 'safety', estimate: -7.5, truth: 0 },
        { id: 'cfo', estimate: -6, truth: 0 },
      ] },
    ],
  };

  const summary = runSummary(state);

  assert.deepEqual(summary.advisors.map(({ id, verdict }) => ({ id, verdict })), [
    { id: 'research', verdict: 'reliable' },
    { id: 'safety', verdict: 'mixed' },
    { id: 'cfo', verdict: 'misleading' },
  ]);
  assert.ok(Math.abs(summary.advisors[0].meanError - 0.49) < Number.EPSILON);
  assert.equal(summary.advisors[1].meanError, 0.5);
  assert.equal(summary.advisors[2].meanError, 1);
  assert.equal(summary.bestModel, 'Kestrel 2 Grand');
  assert.equal(summary.mostReliable, 'research');
  assert.equal(summary.mostMisleading, 'cfo');
  assert.equal(summary.shareLine, 'Absorbed in era 3 after 2 models; Priya saw it coming, while Margot did not.');
});

test('skips advisors without history and handles a run with no models or readings', () => {
  const summary = runSummary({
    ending: 'leftBehind',
    era: 2,
    turn: 8,
    models: [],
    advisorHistory: [{ readings: [{ id: 'unknown', estimate: 1, truth: 0 }] }],
  });

  assert.equal(summary.bestModel, null);
  assert.deepEqual(summary.advisors, []);
  assert.equal(summary.mostReliable, null);
  assert.equal(summary.mostMisleading, null);
  assert.equal(summary.shareLine, 'Left behind in era 2 after 0 models.');
});
