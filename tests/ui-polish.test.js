import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startPolishing, advancePolishBy, applyFlawAction, FLAW_FIX_ROUNDS } from '../sim/polish.js';
import { roundSpan, nextRoundDay, storyDate } from '../sim/time.js';
import { project } from '../ui/logic/format.js';
import { readyNote } from '../ui/logic/training.js';
import {
  polishStatus, showFlawBadge, flawRows, rumorWindow, rivalRumor, rumorText, stripModel, polishIntro,
} from '../ui/logic/polish.js';

function polishing(flags = ['jailbreakWaiting', 'hallucination', 'sycophancy']) {
  const state = createInitialState({ seed: 1 });
  state.compute.split.safety = 0;
  state.pendingModel = { capability: 40, gain: 10, flags: [...flags], publicEffects: { usersMult: 1.15 }, size: 'medium', spec: {} };
  startPolishing(state.pendingModel, 2, state.day);
  state.rivalLaunches = [];
  return state;
}

test('the pill names the model and what polishing is doing', () => {
  const state = polishing();
  const pill = project(state);
  assert.match(pill.status, /^polishing · fixing flaws$/);
  assert.equal(pill.progress, 0);
  state.pendingModel.polishing.flaws = [];
  state.pendingModel.polish = 36.6;
  assert.equal(polishStatus(state.pendingModel), 'polishing · polish 37');
  state.pendingModel.polishing.paused = true;
  assert.equal(polishStatus(state.pendingModel), 'polishing · paused');
  assert.equal(readyNote(state), null, 'Publish replaces the floor note while a model polishes');
});

test('the Flaws badge shows only for a model that had fixable flaws', () => {
  assert.equal(showFlawBadge(polishing().pendingModel), true);
  assert.equal(showFlawBadge(polishing([]).pendingModel), false);
});

test('flaw rows list fixed, being fixed, next and left in, with advisor lines and moves', () => {
  const state = polishing();
  advancePolishBy(state, FLAW_FIX_ROUNDS);
  applyFlawAction(state, { flag: 'sycophancy', action: 'leaveIn' });
  const rows = flawRows(state);
  assert.deepEqual(rows.map((r) => [r.flag, r.state]), [
    ['jailbreakWaiting', 'done'], ['hallucination', 'work'], ['sycophancy', 'left'],
  ]);
  assert.equal(rows[0].name, 'Jailbreaks waiting');
  assert.match(rows[0].stateLabel, /^fixed [A-Z][a-z]{2} \d{1,2}$/);
  assert.equal(rows[0].who, 'Head of Safety');
  assert.deepEqual(rows[0].actions, []);
  assert.deepEqual(rows[1].actions.map((a) => a.action), ['leaveIn']);
  assert.deepEqual(rows[2].actions.map((a) => a.action), ['fix']);
  assert.equal(rows[2].stateLabel, 'left in');
});

test('a rumor names a window that holds the launch, never the day itself', () => {
  const state = polishing();
  const { start, end } = roundSpan(state.turn);
  assert.equal(end, nextRoundDay(state), 'roundSpan(turn) is the current round');
  const day = start + 30;
  const w = rumorWindow(state, day);
  assert.ok(w.start < day && day <= w.end);
  assert.ok(Math.abs((w.end - w.start) - (end - start) / 4) < 1e-9);
  state.rivalLaunches = [{ id: 'openbrain', day }];
  const rumor = rivalRumor(state);
  assert.deepEqual(rumor, { kind: 'rumor', name: 'OpenBrain', weeks: Math.max(1, Math.ceil((w.end - state.day) / 7)) });
  assert.match(rumorText(rumor), /^OpenBrain launch rumored within ~\d+ weeks?$/);
});

test('a rival that just landed shows for three days', () => {
  const state = polishing();
  state.pendingModel.polishing.rivals.push({ id: 'lodestar', day: state.day });
  assert.deepEqual(rivalRumor(state), { kind: 'landed', name: 'Lodestar' });
  assert.equal(rumorText(rivalRumor(state)), 'Lodestar launched today · the critics’ bar just went up');
  state.day += 3;
  assert.equal(rivalRumor(state), null);
});

test('the strip lays out fixes, bubbles past and coming, rivals and date ticks on one scale', () => {
  const state = polishing(['hallucination']);
  for (let i = 0; i < 40; i += 1) {
    advancePolishBy(state, 1 / 91);
    state.day += 1;
  }
  state.pendingModel.polishing.rivals.push({ id: 'openbrain', day: state.day - 5 });
  state.rivalLaunches = [{ id: 'lodestar', day: state.day + 10 }];
  const strip = stripModel(state);
  const xs = [strip.today.x, ...strip.blocks.flatMap((b) => [b.x0, b.x1]), ...strip.bubbles.map((b) => b.x), ...strip.landed.map((l) => l.x), ...strip.ticks.map((t) => t.x)];
  assert.ok(xs.every((x) => x >= 0 && x <= 1), 'everything on the strip');
  assert.equal(strip.blocks[0].label, 'wrong answers ✓');
  assert.ok(strip.bubbles.some((b) => b.past) && strip.bubbles.some((b) => !b.past));
  const past = strip.bubbles.filter((b) => b.past);
  assert.ok(past[0].size > past.at(-1).size, 'bubbles shrink');
  assert.deepEqual(strip.landed.map((l) => l.name), ['OpenBrain']);
  assert.deepEqual(strip.windows.map((w) => w.name), ['Lodestar']);
  assert.match(strip.today.label, /^today · polish \d+$/);
  assert.match(strip.ticks[0].label, /^[A-Z][a-z]{2} \d{1,2}$/);
});

test('storyDate also gives the day of the month', () => {
  assert.equal(storyDate(0).d, 1);
  assert.equal(storyDate(40).d, 10);
});

test('Research introduces polishing with the number of flaws', () => {
  assert.match(polishIntro(polishing()), /3 flaws to fix first/);
  assert.match(polishIntro(polishing(['sycophancy'])), /one flaw to fix first/);
  assert.doesNotMatch(polishIntro(polishing([])), /flaw/);
});


test('rumor windows contain every integer launch day, including fractional quarter boundaries', () => {
  const state = polishing();
  for (const turn of [0, 4, 8, 12, 16]) {
    state.turn = turn;
    const { start, end } = roundSpan(turn);
    for (let day = start + 1; day <= end; day += 1) {
      const window = rumorWindow(state, day);
      assert.ok(window.start < day && day <= window.end, `turn ${turn}, day ${day}: ${JSON.stringify(window)}`);
    }
  }
});
