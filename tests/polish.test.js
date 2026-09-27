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

import { startRun, advanceRunBy } from '../sim/training.js';
import { computeSlices } from '../sim/split.js';
import { applyActions, advanceDays } from '../sim/turn.js';
import { releaseModel } from '../sim/release.js';
import { scoreLaunch } from '../sim/launch.js';
import { createRng } from '../sim/rng.js';
import { POLISH_CRITIC_DIVISOR } from '../sim/polish.js';

const noLuck = { next: () => 0.99, int: () => 0, chance: () => false, normal: (m) => m, pick: (list) => list[0] };
const runRecipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data', 'stability'], mid: [], post: ['synthetic-sft', 'thumbs'] },
};

function trainedState() {
  const state = createInitialState({ seed: 1 });
  state.compute.split.safety = 0;
  assert.equal(startRun(state, runRecipe).ok, true);
  const units = state.activeRun.units;
  while (state.activeRun) advanceRunBy(state, noLuck, 1);
  return { state, units };
}

test('a finished run starts polishing and keeps its compute busy', () => {
  const { state, units } = trainedState();
  const model = state.pendingModel;
  assert.equal(model.heldUnits, units);
  assert.deepEqual(model.polishing.flaws.map((f) => f.flag), ['jailbreakWaiting', 'sycophancy']);
  const slices = computeSlices(state);
  assert.equal(slices.run, units);
  assert.equal(slices.idle, Math.max(0, slices.training - units));
});

test('the story days move polishing on, and the player can order the flaws', () => {
  const { state } = trainedState();
  const rng = createRng(1);
  const acted = applyActions(state, { flawActions: [{ flag: 'sycophancy', action: 'first' }] }, rng);
  assert.deepEqual(acted.errors, []);
  assert.equal(acted.state.pendingModel.polishing.flaws[0].flag, 'sycophancy');
  const days = Math.ceil(0.25 * 91) + 1; // era 1: a round is 91 days
  const moved = advanceDays(acted.state, days, rng);
  assert.ok(moved.events.some((e) => e.type === 'flawFixed' && e.flag === 'sycophancy'), JSON.stringify(moved.events.map((e) => e.type)));
  assert.ok(!moved.state.pendingModel.flags.includes('sycophancy'));
});

test('a bad flaw action is an error, not a crash', () => {
  const { state } = trainedState();
  const acted = applyActions(state, { flawActions: [{ flag: 'scraped', action: 'first' }] }, createRng(1));
  assert.equal(acted.errors.length, 1);
});

test('publishing carries polish and fixed flaws and frees the compute', () => {
  const { state } = trainedState();
  state.pendingModel.polish = 40;
  state.pendingModel.fixedFlaws = [{ flag: 'jailbreakWaiting', day: 3 }];
  const r = releaseModel(state, { picks: [], price: 'market', family: 'Kestrel', generation: 1 }, createRng(2));
  assert.equal(r.ok, true);
  assert.equal(r.model.polish, 40);
  assert.deepEqual(r.model.fixedFlaws, [{ flag: 'jailbreakWaiting', day: 3 }]);
  assert.equal(computeSlices(state).run, 0);
});

test('polish lifts every critic by polish / 50, and zero polish changes nothing', () => {
  const { state } = trainedState();
  // A weak model, so no critic sits at the 10-point ceiling before the lift.
  const model = { capability: 10, spec: state.pendingModel.spec, flags: [], name: 'Kestrel 1', generation: 1, skipped: 0 };
  const plain = scoreLaunch(structuredClone(state), model, noLuck);
  const same = scoreLaunch(structuredClone(state), { ...model, polish: 0 }, noLuck);
  const lifted = scoreLaunch(structuredClone(state), { ...model, polish: 100 }, noLuck);
  assert.deepEqual(same.press.map((p) => p.score), plain.press.map((p) => p.score));
  assert.equal(POLISH_CRITIC_DIVISOR, 50);
  const up = lifted.press.map((p, i) => p.score - plain.press[i].score);
  assert.ok(up.every((d) => d >= 1 && d <= 2), `each critic rises by about 2 (rounded, clamped): ${up}`);
});

test('publishing on the day training ends gives today\'s result', () => {
  const { state } = trainedState();
  const without = structuredClone(state);
  delete without.pendingModel.polishing;
  delete without.pendingModel.polish;
  delete without.pendingModel.fixedFlaws;
  delete without.pendingModel.heldUnits;
  const release = { picks: [], price: 'market', family: 'Kestrel', generation: 1 };
  const a = releaseModel(state, release, createRng(5));
  const b = releaseModel(without, release, createRng(5));
  assert.deepEqual(a.model.launch, b.model.launch);
  assert.equal(a.model.users, b.model.users);
});


test('a run finishing between round marks starts polishing on its completion day without advancing it', () => {
  const state = createInitialState({ seed: 1 });
  state.compute.split.safety = 0;
  assert.equal(startRun(state, runRecipe).ok, true);
  state.activeRun.turnsLeft = 1 / 91;
  const moved = advanceDays(state, 1, noLuck);
  const model = moved.state.pendingModel;
  assert.ok(moved.events.some((event) => event.type === 'runComplete'));
  assert.equal(model.polishing.startedDay, moved.state.day);
  assert.equal(model.polishing.flaws[0].progress, 0);
  assert.equal(model.polish, 0);
  const next = advanceDays(moved.state, 1, noLuck);
  assert.equal(next.state.pendingModel.polishing.flaws[0].progress, 1 / 91);
});

test('changing the compute split rechecks polishing capacity within the same round', () => {
  const state = polishingState();
  state.pendingModel.heldUnits = state.compute.online;
  advancePolishBy(state, 1 / 91);
  const acted = applyActions(state, { computeSplit: { safety: 0.5 } }, noLuck);
  assert.deepEqual(acted.errors, []);
  assert.deepEqual(advancePolishBy(acted.state, 1 / 91), [{ type: 'polishPaused' }]);
  const resumed = applyActions(acted.state, { computeSplit: { safety: 0 } }, noLuck);
  assert.deepEqual(resumed.errors, []);
  advancePolishBy(resumed.state, 1 / 91);
  assert.equal(resumed.state.pendingModel.polishing.paused, false);
  assert.equal(resumed.state.pendingModel.polishing.flaws[0].progress, 2 / 91);
});
