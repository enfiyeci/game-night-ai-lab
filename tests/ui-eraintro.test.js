import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ERAS } from '../sim/data/eras.js';
import { ERA_INTROS, eraIntro } from '../ui/logic/eraIntro.js';

test('every era has an intro with its simulation name', () => {
  assert.equal(ERA_INTROS.length, 5);
  assert.deepEqual(ERA_INTROS.map(({ era }) => era), [1, 2, 3, 4, 5]);

  for (const era of ERAS) {
    const intro = eraIntro(era.id);
    assert.equal(intro.era, era.id);
    assert.equal(intro.name, era.name);
  }
});

test('pace follows each era turn length', () => {
  const paceByMonths = new Map([
    [3, 'Each turn is now a quarter.'],
    [1, 'Each turn is now a month.'],
    [0.25, 'Each turn is now a week.'],
  ]);

  for (const era of ERAS) {
    assert.equal(eraIntro(era.id).pace, paceByMonths.get(era.monthsPerTurn));
  }
});

test('each intro has exactly three short, plain change lines', () => {
  for (const intro of ERA_INTROS) {
    assert.equal(intro.changes.length, 3, `era ${intro.era}`);
    for (const change of intro.changes) {
      assert.equal(typeof change, 'string');
      assert.ok(change.length > 0 && change.length <= 90, `era ${intro.era}: ${change}`);
    }
  }
});

test('era lookup rejects ids outside the five eras', () => {
  assert.equal(eraIntro(0), null);
  assert.equal(eraIntro(6), null);
});
