import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { deployInternal, stopInternal, internalTick, internalRisk, controlUnits } from '../sim/internal.js';
import { availableUnits, startRun, advanceRun } from '../sim/training.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { ENDINGS } from '../sim/endings.js';

const hit = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const miss = { ...hit, chance: () => false };
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
const withModel = () => {
  const s = createInitialState();
  s.era = 3;
  s.compute.contracts.push({
    id: 'test-capacity', supplier: 'starter', units: 90, price: 0, monthsLeft: null,
    needsPower: false, string: null, arrivedTurn: 0, scaledDown: false, troubled: false,
    dark: false, bumpTurn: null, exclusiveBought: false, headline: null,
  });
  s.compute.online = 100;
  s.models.push({ capability: 60 });
  return s;
};

test('internal deployment opens in era 3 and needs a model', () => {
  const s = createInitialState();
  assert.equal(deployInternal(s, 0.5).ok, false);
  const t = withModel();
  assert.equal(deployInternal(t, 0.5).ok, true);
  assert.deepEqual(t.internal, { control: 0.5, stage: 0, turns: 0, capability: t.capability });
  assert.equal(deployInternal(t, 2).ok, false);
  assert.equal(deployInternal(t, '0.5').ok, false);
});

test('internal deployment waits for a pending training hazard to be resolved', () => {
  const s = createInitialState();
  s.era = 3;
  s.pendingModel = { capability: 60, hazard: { type: 'rewardHacking', size: 10 } };
  assert.deepEqual(deployInternal(s, 0), { ok: false, error: 'resolve the training hazard first' });
  assert.equal(s.internal, null);
});

test('control reserves compute and lowers risk', () => {
  const s = withModel();
  s.alignmentDebt = 60; s.capability = 70;
  deployInternal(s, 0);
  const r0 = internalRisk(s);
  s.internal.control = 1;
  assert.ok(internalRisk(s) < r0);
  assert.equal(controlUnits(s), 20);
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
  assert.equal(s.internal.stage, 3);
  for (let i = 0; i < 3; i++) assert.deepEqual(internalTick(s, hit), []);
  assert.equal(s.ending, null);
  assert.equal(s.internal.stage, 3);
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

test('changing control keeps the turn the stage last rose', () => {
  const s = withModel();
  s.capability = 75; s.alignmentDebt = 80; s.turn = 7;
  deployInternal(s, 0);
  internalTick(s, hit);
  assert.equal(s.internal.stageTurn, 7);
  deployInternal(s, 0.5);
  assert.equal(s.internal.stageTurn, 7);
});

test('control must fit in free compute', () => {
  const s = withModel();
  s.activeRun = { bonus: 0, units: s.compute.online, turnsLeft: 2 };
  const r = deployInternal(s, 1);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'not enough free compute for control');
  assert.equal(deployInternal(s, 0).ok, true);
  const t = withModel();
  t.activeRun = { bonus: 0, units: t.compute.online - 20, turnsLeft: 2 };
  assert.equal(deployInternal(t, 0.5).ok, true);
  assert.equal(deployInternal(t, 1).ok, true);
  assert.equal(t.internal.control, 1);
});

test('risk follows the deployed model until a redeploy picks the newest one', () => {
  const s = withModel();
  s.capability = 60; s.alignmentDebt = 80;
  deployInternal(s, 0);
  const deployed = internalRisk(s);
  s.pendingModel = { capability: 80 };
  assert.equal(internalRisk(s), deployed);
  deployInternal(s, 0);
  assert.equal(s.internal.capability, 80);
  assert.ok(internalRisk(s) > deployed);
});

test('the takeover threshold reads the deployed model, not a later pending one', () => {
  const s = withModel();
  s.capability = 60; s.alignmentDebt = 80;
  deployInternal(s, 0);
  for (let i = 0; i < 3; i++) internalTick(s, hit);
  s.pendingModel = { capability: 80 };
  internalTick(s, hit);
  assert.equal(s.ending, null);
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

test('internal use finishes a run one turn sooner, once per run', () => {
  const turnsToFinish = (deployed) => {
    const s = withModel();
    if (deployed) deployInternal(s, 0);
    assert.equal(startRun(s, recipe).ok, true);
    s.activeRun.turnsLeft = 3;
    const rng = createRng(1);
    let turns = 0;
    while (s.activeRun) { internalTick(s, miss); advanceRun(s, rng); turns += 1; }
    return turns;
  };
  assert.equal(turnsToFinish(false), 3);
  assert.equal(turnsToFinish(true), 2);
  const s = withModel();
  s.activeRun = { bonus: 0, units: 2, turnsLeft: 5 };
  deployInternal(s, 0);
  internalTick(s, miss);
  internalTick(s, miss);
  assert.equal(s.activeRun.turnsLeft, 4);
});

test('a run on its last turn gets the internal bonus in endTurn', () => {
  const gain = (deployed) => {
    const s = withModel();
    if (deployed) deployInternal(s, 0);
    startRun(s, recipe);
    s.activeRun.turnsLeft = 1;
    s.activeRun.spikeChance = 0;
    return endTurn(s, {}, createRng(1)).state.pendingModel.gain;
  };
  assert.ok(gain(true) > gain(false));
});

test('risk with nothing deployed does not crash', () => {
  const s = withModel();
  s.alignmentDebt = 60;
  assert.ok(internalRisk(s) > 0);
});

test('endTurn wires the moves, control compute and the ending', () => {
  const prev = withModel();
  const { state, errors } = endTurn(prev, { moves: [{ type: 'deployInternal', control: 1 }] }, miss);
  assert.deepEqual(errors, []);
  assert.equal(prev.internal, null);
  assert.equal(state.internal.control, 1);
  assert.equal(state.internal.turns, 1);
  assert.equal(availableUnits(state), availableUnits({ ...state, internal: null }) - 20);
  const next = endTurn(state, { moves: [{ type: 'stopInternal' }] }, miss).state;
  assert.equal(next.internal, null);
  assert.ok(ENDINGS.quietTakeover);
});
