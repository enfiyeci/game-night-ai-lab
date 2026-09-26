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
  assert.deepEqual(ERAS.map(({ id }) => eraIntro(id).pace), [
    'Each turn is a quarter.',
    'Each turn is now a quarter.',
    'Each turn is now a month.',
    'Each turn is now a month.',
    'Each turn is now a week.',
  ]);
});

test('later-era compute changes describe only options still available', () => {
  assert.equal(
    eraIntro(4).changes[2],
    'Gas turbines and nuclear restarts are the new site options; both take time.',
  );
  assert.equal(
    eraIntro(5).changes[1],
    'New Verde orders, power sites and Gulf deals close; only spot and CoreFlame remain.',
  );
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
