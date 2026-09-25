import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { deployInternal, stopInternal, internalTick, internalRisk, controlUnits } from '../sim/internal.js';
import { availableUnits } from '../sim/training.js';
import { endTurn } from '../sim/turn.js';
import { ENDINGS } from '../sim/endings.js';

const hit = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const miss = { ...hit, chance: () => false };
const withModel = () => { const s = createInitialState(); s.era = 3; s.models.push({ capability: 60 }); return s; };

test('internal deployment opens in era 3 and needs a model', () => {
  const s = createInitialState();
  assert.equal(deployInternal(s, 0.5).ok, false);
  const t = withModel();
  assert.equal(deployInternal(t, 0.5).ok, true);
  assert.deepEqual(t.internal, { control: 0.5, stage: 0, turns: 0 });
  assert.equal(deployInternal(t, 2).ok, false);
  assert.equal(deployInternal(t, '0.5').ok, false);
});

test('control reserves compute and lowers risk', () => {
  const s = withModel();
  s.alignmentDebt = 60; s.capability = 70;
  deployInternal(s, 0);
  const r0 = internalRisk(s);
  s.internal.control = 1;
  assert.ok(internalRisk(s) < r0);
  assert.equal(controlUnits(s), 2);
});

test('trouble escalates warning, incident, exfiltration, then takeover at high capability', () => {
  const s = withModel();
  s.capability = 75; s.alignmentDebt = 80;
  deployInternal(s, 0);
  assert.equal(internalTick(s, hit)[0].type, 'internalWarning');
  assert.equal(internalTick(s, hit)[0].stage, 2);
  assert.equal(internalTick(s, hit)[0].stage, 3);
  internalTick(s, hit);
  assert.equal(s.ending, 'quietTakeover');
});

test('no takeover below capability 70; misses do not escalate; stopping ends it', () => {
  const s = withModel();
  s.capability = 60; s.alignmentDebt = 80;
  deployInternal(s, 0);
  for (let i = 0; i < 6; i++) internalTick(s, hit);
  assert.equal(s.ending, null);
  const t = withModel();
  deployInternal(t, 0);
  internalTick(t, miss);
  assert.equal(t.internal.stage, 0);
  assert.equal(stopInternal(t).ok, true);
  assert.equal(t.internal, null);
});

test('stopping and redeploying keeps the escalation stage', () => {
  const s = withModel();
  s.capability = 75; s.alignmentDebt = 80;
  deployInternal(s, 0);
  internalTick(s, hit);
  internalTick(s, hit);
  assert.equal(s.internal.stage, 2);
  stopInternal(s);
  assert.equal(s.internal, null);
  deployInternal(s, 0.5);
  assert.equal(s.internal.stage, 2);
});

test('risk is judged at the deployed pending model’s capability', () => {
  const s = withModel();
  s.capability = 40; s.alignmentDebt = 80;
  deployInternal(s, 0);
  const released = internalRisk(s);
  s.pendingModel = { capability: 80 };
  assert.ok(internalRisk(s) > released);
});

test('internal use speeds an active run, more in era 5', () => {
  const s = withModel();
  s.activeRun = { bonus: 0, units: 2, turnsLeft: 2 };
  deployInternal(s, 0);
  internalTick(s, miss);
  const b3 = s.activeRun.bonus;
  s.era = 5; s.activeRun.bonus = 0;
  internalTick(s, miss);
  assert.ok(b3 > 0 && s.activeRun.bonus > b3);
});

test('endTurn wires the moves, control compute and the ending', () => {
  const prev = withModel();
  const { state, errors } = endTurn(prev, { moves: [{ type: 'deployInternal', control: 1 }] }, miss);
  assert.deepEqual(errors, []);
  assert.equal(prev.internal, null);
  assert.equal(state.internal.control, 1);
  assert.equal(state.internal.turns, 1);
  assert.equal(availableUnits(state), availableUnits({ ...state, internal: null }) - 2);
  const next = endTurn(state, { moves: [{ type: 'stopInternal' }] }, miss).state;
  assert.equal(next.internal, null);
  assert.ok(ENDINGS.quietTakeover);
});
