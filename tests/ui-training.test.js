import * as trainingVisuals from '../ui/logic/training.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alignmentFor, badgeCounts, bubbleSpawns, expectedGain, floorHint, readyNote } from '../ui/logic/training.js';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { createInitialState } from '../sim/state.js';
import { setDraft } from '../sim/constitution.js';
import { SAFETY_PROPOSAL } from '../sim/data/constitution.js';
import { advanceRunBy, startRun } from '../sim/training.js';
import { recipeCost } from '../sim/recipe.js';
import { createRng } from '../sim/rng.js';
import { advanceDays, applyActions } from '../sim/turn.js';

test('alignment bubbles follow the alignment share, never debt', () => {
  assert.equal(alignmentFor(18, 0.25), 6);
  assert.equal(alignmentFor(10, 0), 0);
  assert.equal(alignmentFor(10, 0.5), 10);
  assert.equal(alignmentFor(0, 0.4), 0);
});

test('no run and no trained model shows zero bubbles', () => {
  assert.deepEqual(badgeCounts(createInitialState({ seed: 1 })), { capability: 0, alignment: 0 });
});

test('a run in progress counts part of its expected gain, without touching the state', () => {
  const state = SCENARIOS.midEra3(1);
  assert.ok(state.activeRun, 'midEra3 has a run in progress');
  const before = structuredClone(state);
  const gain = expectedGain(state);
  const counts = badgeCounts(state);
  assert.deepEqual(state, before, 'counting must not change the game');
  assert.ok(gain > 0);
  assert.ok(counts.capability >= 0 && counts.capability <= Math.round(gain));
  assert.equal(counts.alignment, alignmentFor(counts.capability, state.activeRun.recipe.sliders.alignShare));
  assert.deepEqual(Object.keys(counts).sort(), ['alignment', 'capability']);
});

test('the first bubble flies on the first day of a run, and the count never passes the final gain', () => {
  const state = SCENARIOS.midEra3(1);
  const run = state.activeRun;
  const total = recipeCost(state, run.recipe).turns;
  run.turnsLeft = total - 1 / 91; // one era-1-length story day into the run
  const gain = expectedGain(state);
  assert.ok(gain / (91 * total) < 0.5, 'rounding alone would still show no bubble');
  assert.equal(badgeCounts(state).capability, 1);
  run.turnsLeft = 1e-6; // all but done: never above the gain the finished model will show
  assert.equal(badgeCounts(state).capability, Math.round(gain));
});

test('the early first bubble adds no overcount when a loss spike trims the finished model', () => {
  // Mixture-of-experts without stability engineering is chosen spike risk, so the run meets its one loss spike on its
  // first day (deterministic endings A9 review rule; before, seed 35's dice spiked the run as it finished).
  const rng = createRng(35);
  let state = applyActions(SCENARIOS.era3Idle(35), { moves: [{ type: 'startRun', recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0.2 }, picks: { pre: ['moe'], mid: [], post: [] } } }] }, rng).state;
  assert.ok(state.activeRun, 'the risky run starts');
  let peak = 0;
  for (let day = 0; day < 40 && state.activeRun; day += 1) {
    peak = Math.max(peak, badgeCounts(state).capability);
    state = advanceDays(state, 1, rng).state;
  }
  assert.equal(state.pendingModel?.spikes, 1, 'the risky recipe\'s one loss spike trims the finished model');
  assert.ok(peak <= Math.round(state.pendingModel.gain), `peak ${peak} vs model ${Math.round(state.pendingModel.gain)}`);
});

test('the estimate counts the constitution the run will teach', () => {
  const state = createInitialState();
  state.era = 3; state.cash = 5000;
  state.compute.split.safety = 0; state.compute.online = 100;
  setDraft(state, { hardLines: ['no-autonomy-grab', 'honest', 'privacy'], rulings: SAFETY_PROPOSAL.rulings });
  const recipe = { sliders: { size: 'small', length: 'optimal', alignShare: 0 }, picks: { pre: [], mid: [], post: ['agentic-rl', 'constitution'] } };
  assert.equal(startRun(state, recipe).ok, true);
  const estimate = expectedGain(state);
  state.activeRun.turnsLeft = 0.5; state.activeRun.canAdvance = true; state.activeRun.capacityTurn = state.turn;
  advanceRunBy(state, { chance: () => false }, 1);
  assert.equal(estimate, state.pendingModel.gain);
});

test('a trained model shows its real gain and the remembered share', () => {
  // Under the compute race plan (docs/superpowers/plans/2026-09-26-compute-race.md) Task 5, none of seed 4's twenty dice reach the hazard; seed 5's did.
  // Since deterministic endings P1 (the press curve above 8: lower critic scores, fewer users and less cash), seed 5's
  // scripted lab plays on to an ending before it idles in era 3, so it never starts the hazard run; seed 1 reaches it.
  const state = SCENARIOS.hazard(1);
  assert.ok(state.pendingModel, 'hazard scenario ends with a trained model');
  const counts = badgeCounts(state, 0.25);
  assert.equal(counts.capability, Math.round(state.pendingModel.gain));
  assert.equal(counts.alignment, alignmentFor(counts.capability, 0.25));
  assert.equal(badgeCounts(state).alignment, 0, 'without a remembered share, alignment shows 0 rather than a guess');
});

test('the hazard scenario stops with the cheating trace still unanswered', () => {
  const state = SCENARIOS.hazard(1); // seed 5 no longer reaches the hazard (deterministic endings P1): see the test above
  assert.equal(state.pendingModel?.hazard?.type, 'rewardHacking');
});

test('bubble spawns cover exactly the increase, from the right sources', () => {
  const spawns = bubbleSpawns({ capability: 2, alignment: 1 }, { capability: 7, alignment: 3 });
  assert.equal(spawns.filter((s) => s.kind === 'capability').length, 25);
  assert.equal(spawns.filter((s) => s.kind === 'alignment').length, 10);
  assert.ok(Math.abs(spawns.filter((s) => s.kind === 'capability').reduce((sum, s) => sum + s.amount, 0) - 5) < 1e-9);
  assert.ok(Math.abs(spawns.filter((s) => s.kind === 'alignment').reduce((sum, s) => sum + s.amount, 0) - 2) < 1e-9);
  for (const s of spawns) {
    const allowed = s.kind === 'capability' ? ['researcher1', 'researcher2', 'research', 'rack'] : ['safety', 'research'];
    assert.ok(allowed.includes(s.source), `${s.kind} from ${s.source}`);
  }
  assert.deepEqual(bubbleSpawns({ capability: 7, alignment: 3 }, { capability: 0, alignment: 0 }), []);
});

test('the game remembers the share of the run that just finished', () => {
  const game = createGame({ seed: 1, state: SCENARIOS.midEra3(1) });
  const share = game.state.activeRun.recipe.sliders.alignShare;
  assert.equal(game.lastAlignShare, share);
  for (let i = 0; i < 6 && game.state.activeRun; i += 1) game.endTurn();
  assert.equal(game.lastAlignShare, share);
});

test('a run that starts and finishes in one step still records its share', () => {
  const game = createGame({ seed: 1, state: SCENARIOS.era3Idle(1) });
  game.addMove({ type: 'startRun', recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0.4 }, picks: { pre: [], mid: [], post: [] } } });
  game.endTurn();
  assert.ok(game.state.pendingModel && !game.state.activeRun, 'the run finished within the step');
  assert.equal(game.lastAlignShare, 0.4);
});

test('releasing and starting a one-step run in the same step records the new share', () => {
  const game = createGame({ seed: 1, state: SCENARIOS.era3Idle(1) });
  const oneStep = (alignShare) => ({ type: 'startRun', recipe: { sliders: { size: 'small', length: 'optimal', alignShare }, picks: { pre: [], mid: [], post: [] } } });
  game.addMove(oneStep(0.2));
  game.endTurn();
  assert.equal(game.lastAlignShare, 0.2);
  game.addMove({ type: 'release', release: { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 } });
  game.addMove(oneStep(0.4));
  const { errors } = game.endTurn();
  assert.deepEqual(errors, []);
  assert.ok(game.state.pendingModel && !game.state.activeRun, 'the new run finished within the step');
  assert.equal(game.lastAlignShare, 0.4);
});

test('in real time, a run started by an action and finished by the daily clock keeps its share', () => {
  const game = createGame({ seed: 1, state: SCENARIOS.era3Idle(1) });
  const result = game.addMove({ type: 'startRun', recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0.4 }, picks: { pre: [], mid: [], post: [] } } });
  assert.ok(result.ok, result.error);
  for (let day = 0; day < 400 && !game.state.pendingModel && !game.state.ending; day += 1) game.advanceDays(1);
  assert.ok(game.state.pendingModel, 'the daily clock finished the run');
  assert.equal(game.lastAlignShare, 0.4);
  const counts = badgeCounts(game.state, game.lastAlignShare);
  assert.equal(counts.alignment, alignmentFor(counts.capability, 0.4));
});

// Owner pick 2A: the release is found by clicking the floor, so the game says so.
test('a trained model waiting for release names the floor click', () => {
  const state = createInitialState({ seed: 1 });
  assert.equal(readyNote(state), null, 'nothing to release, no note');
  state.pendingModel = { gain: 12 };
  assert.equal(readyNote(state), 'Ready · click the floor to release');
  state.pendingModel = { gain: 12, hazard: { id: 'x' } };
  assert.equal(readyNote(state), null, 'a hazard choice comes first');
  state.pendingModel = { gain: 12 };
  state.ending = { id: 'x' };
  assert.equal(readyNote(state), null, 'no note once the run has ended');
});

test('the floor ring shows only while the first model of the run waits', () => {
  const state = createInitialState({ seed: 1 });
  assert.equal(floorHint(state), false);
  state.pendingModel = { gain: 12 };
  assert.equal(floorHint(state), true);
  state.models = [{ name: 'Kestrel 1' }];
  assert.equal(floorHint(state), false, 'the player has released before and knows the way');
});


test('visual progress advances between badge points, stays cosmetic, and finishes at five bubbles per point', () => {
  const state = SCENARIOS.midEra3(1);
  const run = state.activeRun;
  const total = recipeCost(state, run.recipe).turns;
  const finalCap = Math.round(expectedGain(state));
  const finalAli = alignmentFor(finalCap, run.recipe.sliders.alignShare);
  let previous = { capability: 0, alignment: 0 };
  let previousBadge = previous;
  const spawns = [];
  let betweenPoints = false;
  for (let i = 0; i <= 1000; i += 1) {
    run.turnsLeft = total * (1 - i / 1000);
    const before = structuredClone(state);
    const badge = badgeCounts(state);
    const visual = trainingVisuals.bubbleCounts(state);
    const batch = bubbleSpawns(previous, visual);
    if (batch.length && badge.capability === previousBadge.capability && badge.alignment === previousBadge.alignment) betweenPoints = true;
    spawns.push(...batch);
    assert.deepEqual(state, before);
    assert.deepEqual(badgeCounts(state), badge);
    previous = visual;
    previousBadge = badge;
  }
  assert.ok(betweenPoints, 'bubbles must also leave desks between whole badge changes');
  assert.equal(spawns.filter((s) => s.kind === 'capability').length, finalCap * 5);
  assert.equal(spawns.filter((s) => s.kind === 'alignment').length, finalAli * 5);
  assert.deepEqual(previous, { capability: finalCap, alignment: finalAli });
});
