import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import {
  FLAW_FIX_ROUNDS, BUBBLE_ROUNDS, FIXABLE, startPolishing, advancePolishBy, applyFlawAction, flawsLeft,
  nextBubbleGain, polishForecast, notePolishLandings,
} from '../sim/polish.js';

function polishingState(flags = ['jailbreakWaiting', 'hallucination', 'sycophancy', 'scraped']) {
  const state = createInitialState({ seed: 1 });
  state.compute.split.safety = 0;
  state.pendingModel = { capability: 40, gain: 10, flags: [...flags], publicEffects: { usersMult: 1.15 }, size: 'medium', spec: {} };
  startPolishing(state.pendingModel, 2, state.day);
  return state;
}

test('only the three post-training flags are fixable, worst first', () => {
  assert.deepEqual(FIXABLE, ['jailbreakWaiting', 'hallucination', 'sycophancy']);
  const state = polishingState(['sycophancy', 'scraped', 'hallucination']);
  assert.deepEqual(state.pendingModel.polishing.flaws.map((f) => f.flag), ['hallucination', 'sycophancy']);
  assert.equal(state.pendingModel.polish, 0);
  assert.deepEqual(state.pendingModel.fixedFlaws, []);
  assert.equal(state.pendingModel.heldUnits, 2);
});

test('a flaw is fixed after a quarter of a round, and its flag goes', () => {
  const state = polishingState();
  assert.deepEqual(advancePolishBy(state, FLAW_FIX_ROUNDS / 2), []);
  const events = advancePolishBy(state, FLAW_FIX_ROUNDS / 2);
  assert.deepEqual(events, [{ type: 'flawFixed', flag: 'jailbreakWaiting' }]);
  assert.ok(!state.pendingModel.flags.includes('jailbreakWaiting'));
  assert.ok(state.pendingModel.flags.includes('scraped'), 'data flaws stay');
  assert.deepEqual(state.pendingModel.fixedFlaws, [{ flag: 'jailbreakWaiting', day: state.day }]);
  assert.equal(flawsLeft(state.pendingModel), 2);
});

test('fixing sycophancy takes the thumbs-up users with it', () => {
  const state = polishingState(['sycophancy']);
  advancePolishBy(state, FLAW_FIX_ROUNDS);
  assert.ok(Math.abs(state.pendingModel.publicEffects.usersMult - 1) < 1e-12);
});

test('polish starts once every flaw is fixed or left in, and its bubbles shrink', () => {
  const state = polishingState(['sycophancy']);
  assert.equal(applyFlawAction(state, { flag: 'sycophancy', action: 'leaveIn' }).ok, true);
  assert.equal(flawsLeft(state.pendingModel), 0);
  const gains = [];
  for (let i = 0; i < 3; i += 1) gains.push(...advancePolishBy(state, BUBBLE_ROUNDS).map((e) => e.gain));
  assert.deepEqual(gains.map((g) => Math.round(g * 10) / 10), [20, 16, 12.8]);
  assert.ok(Math.abs(state.pendingModel.polish - 48.8) < 1e-9);
  assert.equal(state.pendingModel.polishing.bubbles.length, 3);
  assert.ok(state.pendingModel.flags.includes('sycophancy'), 'a left-in flaw ships as it is');
  assert.ok(Math.abs(nextBubbleGain(state.pendingModel) - 0.2 * 51.2) < 1e-9);
});

test('one round of polish reaches about 93 and never 100', () => {
  const state = polishingState([]);
  for (let i = 0; i < 30; i += 1) advancePolishBy(state, 1 / 30);
  assert.ok(state.pendingModel.polish > 92 && state.pendingModel.polish < 94, `${state.pendingModel.polish}`);
  for (let i = 0; i < 300; i += 1) advancePolishBy(state, 1 / 30);
  assert.ok(state.pendingModel.polish < 100);
});

test('moving a flaw up keeps the work done on the one before', () => {
  const state = polishingState();
  advancePolishBy(state, FLAW_FIX_ROUNDS / 2);
  assert.equal(applyFlawAction(state, { flag: 'sycophancy', action: 'first' }).ok, true);
  assert.deepEqual(state.pendingModel.polishing.flaws.map((f) => f.flag), ['sycophancy', 'jailbreakWaiting', 'hallucination']);
  advancePolishBy(state, FLAW_FIX_ROUNDS);
  assert.deepEqual(state.pendingModel.fixedFlaws.map((f) => f.flag), ['sycophancy']);
  const events = advancePolishBy(state, FLAW_FIX_ROUNDS / 2);
  assert.deepEqual(events, [{ type: 'flawFixed', flag: 'jailbreakWaiting' }], 'half was already done');
});

test('a left-in flaw can be taken back', () => {
  const state = polishingState(['hallucination']);
  applyFlawAction(state, { flag: 'hallucination', action: 'leaveIn' });
  advancePolishBy(state, BUBBLE_ROUNDS);
  assert.equal(state.pendingModel.polishing.bubbles.length, 1);
  assert.equal(applyFlawAction(state, { flag: 'hallucination', action: 'fix' }).ok, true);
  const events = advancePolishBy(state, FLAW_FIX_ROUNDS);
  assert.deepEqual(events, [{ type: 'flawFixed', flag: 'hallucination' }]);
});

test('flaw actions are checked', () => {
  const state = polishingState(['hallucination']);
  assert.equal(applyFlawAction(state, { flag: 'scraped', action: 'first' }).ok, false);
  assert.equal(applyFlawAction(state, { flag: 'hallucination', action: 'shout' }).ok, false);
  state.pendingModel = null;
  assert.equal(applyFlawAction(state, { flag: 'hallucination', action: 'first' }).ok, false);
});

test('polishing pauses when the training compute falls below the held units', () => {
  const state = polishingState();
  state.pendingModel.heldUnits = state.compute.online + 1;
  assert.deepEqual(advancePolishBy(state, 1 / 30), [{ type: 'polishPaused' }]);
  assert.deepEqual(advancePolishBy(state, 1 / 30), [], 'the pause is reported once');
  assert.equal(state.pendingModel.polishing.flaws[0].progress, 0);
});

test('the forecast matches what polishing then does', () => {
  const state = polishingState(['hallucination']);
  const forecast = polishForecast(state.pendingModel, 30, state.day, 3);
  assert.deepEqual(forecast.map((e) => e.type), ['fix', 'bubble', 'bubble', 'bubble']);
  assert.ok(Math.abs(forecast[0].day - (state.day + 7.5)) < 1e-9);
  assert.ok(Math.abs(forecast[1].day - (state.day + 10)) < 1e-9);
  assert.deepEqual(forecast.slice(1).map((e) => Math.round(e.gain * 10) / 10), [20, 16, 12.8]);
});

test('rival landings while polishing are remembered with their day', () => {
  const state = polishingState();
  notePolishLandings(state, [{ type: 'rivalRelease', id: 'openbrain', gain: 7 }, { type: 'computeArrived' }]);
  assert.deepEqual(state.pendingModel.polishing.rivals, [{ id: 'openbrain', day: state.day }]);
});

test('no model, nothing to do', () => {
  const state = createInitialState({ seed: 1 });
  assert.deepEqual(advancePolishBy(state, 1), []);
  notePolishLandings(state, [{ type: 'rivalRelease', id: 'openbrain' }]);
  assert.equal(flawsLeft(null), 0);
});
