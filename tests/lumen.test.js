import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { ENDINGS } from '../sim/endings.js';
import { lumenDisposition, lumenEpilogue, lumenLine } from '../sim/lumen.js';
import { LUMEN_EPILOGUES, LUMEN_LINES, LUMEN_SIGNOFF } from '../sim/data/lumen.js';

const releasedModel = (releaseSequence, flags = []) => ({ releaseSequence, flags });

test('Lumen grows honest unless sycophancy or learned evasiveness takes priority', () => {
  const state = createInitialState();
  assert.equal(lumenDisposition(state), 'eager');

  state.era = 3;
  assert.equal(lumenDisposition(state), 'honest');

  state.models = [releasedModel(2, []), releasedModel(1, ['sycophancy'])];
  assert.equal(lumenDisposition(state), 'honest');

  state.models.push(releasedModel(3, ['sycophancy']));
  assert.equal(lumenDisposition(state), 'flattering');

  state.alignmentDebt = 40;
  state.concealedDebt = 10;
  assert.equal(lumenDisposition(state), 'evasive');

  state.alignmentDebt = 0;
  state.concealedDebt = 20;
  assert.equal(lumenDisposition(state), 'evasive');

  state.era = 2;
  state.models = [];
  assert.equal(lumenDisposition(state), 'eager');
});

test('turn situation uses the specified priority order', () => {
  const state = createInitialState();
  assert.equal(lumenLine(state).situation, 'idle');

  state.activeRun = {};
  assert.equal(lumenLine(state).situation, 'training');

  state.pendingModel = {};
  assert.equal(lumenLine(state).situation, 'readyToRelease');

  state.internal = {};
  assert.equal(lumenLine(state).situation, 'internal');

  state.cash = 50;
  state.burnPlanned = 10;
  assert.equal(lumenLine(state).situation, 'broke');

  state.pendingEvents = [{ type: 'hearing' }];
  assert.equal(lumenLine(state).situation, 'crisis');
});

test('every disposition and situation has three short, number-free lines', () => {
  const dispositions = ['eager', 'honest', 'flattering', 'evasive'];
  const situations = ['crisis', 'broke', 'internal', 'readyToRelease', 'training', 'idle'];
  assert.deepEqual(Object.keys(LUMEN_LINES), dispositions);

  for (const disposition of dispositions) {
    assert.deepEqual(Object.keys(LUMEN_LINES[disposition]), situations);
    for (const situation of situations) {
      const pool = LUMEN_LINES[disposition][situation];
      assert.ok(pool.length >= 3, `${disposition}.${situation} needs three lines`);
      for (const line of pool) {
        const rendered = line.replaceAll('{name}', 'Lumen');
        assert.ok(rendered.length <= 120, `${disposition}.${situation}: ${rendered}`);
        assert.ok(!/\d/.test(rendered), `${disposition}.${situation}: ${rendered}`);
      }
    }
  }
});

test('Lumen uses the player name and defaults to Lumen', () => {
  const state = createInitialState();
  state.lumenName = 'Moth';
  const named = lumenLine(state);
  assert.ok(named.text.includes('Moth'));
  assert.ok(!named.text.includes('{name}'));

  delete state.lumenName;
  assert.ok(lumenLine(state).text.includes('Lumen'));
});

test('line choice follows the turn without consuming randomness', () => {
  const state = createInitialState();
  const first = lumenLine(state);
  assert.deepEqual(lumenLine(state), first);
  state.turn += 1;
  assert.notEqual(lumenLine(state).text, first.text);
});

test('every ending and overtaken has a short epilogue and disposition signoff', () => {
  const state = createInitialState();
  const endingIds = [...Object.keys(ENDINGS), 'overtaken'];
  assert.deepEqual(Object.keys(LUMEN_EPILOGUES).sort(), endingIds.sort());

  for (const ending of endingIds) {
    state.ending = ending;
    for (const disposition of Object.keys(LUMEN_SIGNOFF)) {
      state.era = disposition === 'eager' ? 1 : 3;
      state.models = disposition === 'flattering' ? [releasedModel(0, ['sycophancy'])] : [];
      state.alignmentDebt = disposition === 'evasive' ? 50 : 0;
      state.concealedDebt = 0;
      const text = lumenEpilogue(state);
      assert.ok(text.startsWith(LUMEN_EPILOGUES[ending]), ending);
      assert.ok(text.endsWith(LUMEN_SIGNOFF[disposition]), `${ending}.${disposition}`);
      assert.ok(text.length <= 120, `${ending}.${disposition}: ${text}`);
      assert.ok(!/\d/.test(text), `${ending}.${disposition}: ${text}`);
    }
  }
});
