import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENDINGS } from '../sim/endings.js';
import { createInitialState } from '../sim/state.js';
import { endScreenModel, scalePosition } from '../ui/logic/ending.js';
import { mountEnding } from '../ui/screens/end.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';

const endedState = (ending, patch = {}) => ({ ...createInitialState({ seed: 3 }), ending, era: 3, turn: 11, day: 800, ...patch });

test('the end screen names this run first, marks a first find as new, then locked wins before locked failures', () => {
  const state = endedState('acquihire');
  const model = endScreenModel(state, [
    { id: 'acquihire', era: 3, count: 1 },
    { id: 'boardRemoved', era: 2, count: 1 },
  ], { newThisRun: true });
  assert.equal(model.kicker, 'Run over · era 3, Mar 2025');
  assert.equal(model.title, ENDINGS.acquihire.title);
  assert.equal(model.text, ENDINGS.acquihire.text);
  assert.equal(model.headlines.length, Object.keys(ENDINGS).length);
  assert.deepEqual(model.headlines.slice(0, 2).map((h) => [h.id, h.isNew, h.meta]), [
    ['acquihire', true, 'this run · era 3 · a failure'],
    ['boardRemoved', false, 'found in era 2 · a failure'],
  ]);
  const locked = model.headlines.filter((h) => !h.found).map((h) => h.kind);
  const wins = Object.values(ENDINGS).filter((e) => e.kind === 'win').length;
  assert.deepEqual(locked, [...Array(wins).fill('win'), ...Array(locked.length - wins).fill('fail')]);
  assert.deepEqual(model.progress, { found: 2, total: Object.keys(ENDINGS).length });
  assert.equal(model.footLine, 'Nine stories are still unwritten: three wins and six failures.');
});

test('a repeat ending is not new, and a full collection says so', () => {
  const all = Object.keys(ENDINGS).map((id) => ({ id, era: 5, count: id === 'aligned' ? 3 : 1 }));
  const model = endScreenModel(endedState('aligned', { era: 5, turn: 20 }), all);
  assert.equal(model.headlines[0].id, 'aligned');
  assert.equal(model.headlines[0].isNew, false);
  assert.equal(model.footLine, 'You have found every ending.');
});

test('an ending shown without saving (a debug load) is never marked new', () => {
  const model = endScreenModel(endedState('misuse'), [{ id: 'misuse', era: 3, count: 1 }]);
  assert.equal(model.headlines[0].isNew, false);
});

test('advisors carry their names from the cast', () => {
  const model = endScreenModel(SCENARIOS.ending(1), []);
  assert.ok(model.advisors.some((a) => a.name === 'Margot Hale' && a.role === 'CFO'));
});

test('the models line keeps a player-typed name as plain text and counts in words', () => {
  const models = [{ name: 'Kestrel 1 Swift', launchScore: 40 }, { name: '<b>Wren</b> 2 Core', launchScore: 60 }];
  const model = endScreenModel(endedState('overtaken', { models }), []);
  assert.equal(model.modelsLine, 'Two models shipped; the best was <b>Wren</b> 2 Core.');
  assert.equal(endScreenModel(endedState('overtaken', { models: [] }), []).modelsLine, 'No models shipped.');
});

test('advisor dots sit on the scale thirds at the summary thresholds and stay inside the bar', () => {
  assert.equal(scalePosition(0.75), 50);
  assert.ok(Math.abs(scalePosition(0.5) - 100 / 3) < 1e-9);
  assert.equal(scalePosition(0), 4);
  assert.equal(scalePosition(9), 96);
});

test('a real finished run builds a complete end screen', () => {
  const state = SCENARIOS.ending(1);
  assert.ok(ENDINGS[state.ending], `seed 1 should end the run, got ${state.ending}`);
  const model = endScreenModel(state, []);
  assert.equal(model.headlines[0].id, state.ending);
  assert.ok(model.advisors.every((a) => a.position >= 4 && a.position <= 96 && a.name && a.role));
});

test('reaching an ending records it once and plays its film once', async () => {
  const subscribers = [];
  const game = { state: createInitialState({ seed: 2 }), subscribe: (fn) => { subscribers.push(fn); return () => {}; } };
  const recorded = [];
  const collection = { record: (id, meta) => recorded.push([id, meta.era]), entries: () => [] };
  const films = [];
  let played = 0;
  mountEnding(game, null, {
    collection,
    loadFilm: async (_root, options) => { films.push(options); return { play: () => { played += 1; } }; },
  });
  game.state = { ...game.state, ending: 'pacingDeal', era: 5, deal: { binding: ['compute', 'evals'] } };
  subscribers.forEach((fn) => fn({ state: game.state, events: [], errors: [] }));
  subscribers.forEach((fn) => fn({ state: game.state, events: [], errors: [] }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(recorded, [['pacingDeal', 5]]);
  assert.equal(films.length, 1);
  assert.deepEqual([films[0].id, films[0].era, films[0].run], ['pacingDeal', 5, { deal: { binding: ['compute', 'evals'] } }]);
  assert.equal(played, 1);
});

test('an ending reached while a board meeting is open waits for the meeting to close', async () => {
  const subscribers = [];
  const game = { state: createInitialState({ seed: 2 }), subscribe: (fn) => { subscribers.push(fn); return () => {}; } };
  const overlay = new EventTarget();
  overlay.querySelector = () => null;
  let loads = 0;
  mountEnding(game, overlay, {
    collection: { record: () => {}, entries: () => [] },
    loadFilm: async () => { loads += 1; return { play: () => {} }; },
  });
  overlay.dispatchEvent(new Event('board-meeting-open'));
  game.state = { ...game.state, ending: 'boardRemoved', era: 2 };
  subscribers.forEach((fn) => fn({ state: game.state, events: [], errors: [] }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(loads, 0);
  overlay.dispatchEvent(new Event('board-meeting-closed'));
  overlay.dispatchEvent(new Event('board-meeting-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(loads, 1);
});

test('after the board meeting closes, the film still waits for the release reveal the meeting held (review M3)', async () => {
  const subscribers = [];
  const game = { state: createInitialState({ seed: 2 }), subscribe: (fn) => { subscribers.push(fn); return () => {}; } };
  const overlay = new EventTarget();
  let revealOpen = false;
  overlay.querySelector = (sel) => (sel === '.dialog-layer' && revealOpen ? {} : null);
  overlay.addEventListener('board-meeting-closed', () => { revealOpen = true; }); // reveal.js opens on this same event
  let loads = 0;
  mountEnding(game, overlay, {
    collection: { record: () => {}, entries: () => [] },
    loadFilm: async () => { loads += 1; return { play: () => {} }; },
  });
  overlay.dispatchEvent(new Event('board-meeting-open'));
  game.state = { ...game.state, ending: 'boardRemoved', era: 2 };
  subscribers.forEach((fn) => fn({ state: game.state, events: [], errors: [] }));
  overlay.dispatchEvent(new Event('board-meeting-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(loads, 0, 'the release reveal is open');
  revealOpen = false;
  overlay.dispatchEvent(new Event('gdt-dialog-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(loads, 1);
});

test('the ending film waits for an open dialog (the release reveal), then plays once it closes', async () => {
  const subscribers = [];
  const game = { state: createInitialState({ seed: 2 }), subscribe: (fn) => { subscribers.push(fn); return () => {}; } };
  const collection = { record: () => {}, entries: () => [] };
  let played = 0;
  let dialogCount = 1; // the release reveal is already open when the ending arrives
  const overlay = new EventTarget();
  overlay.querySelector = (sel) => (sel === '.dialog-layer' && dialogCount > 0 ? {} : null);
  mountEnding(game, overlay, {
    collection,
    loadFilm: async () => ({ play: () => { played += 1; } }),
  });
  game.state = { ...game.state, ending: 'pacingDeal', era: 5 };
  subscribers.forEach((fn) => fn({ state: game.state, events: [], errors: [] }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(played, 0, 'the film must not start while a dialog is open');

  dialogCount = 0;
  overlay.dispatchEvent(new Event('gdt-dialog-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(played, 1, 'the film starts once the dialog closes');

  overlay.dispatchEvent(new Event('gdt-dialog-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(played, 1, 'a stray later close event must not start it again');
});

test('the ending film keeps waiting through a second dialog before playing', async () => {
  const subscribers = [];
  const game = { state: createInitialState({ seed: 2 }), subscribe: (fn) => { subscribers.push(fn); return () => {}; } };
  const collection = { record: () => {}, entries: () => [] };
  let played = 0;
  let dialogCount = 2; // two dialogs stacked when the ending arrives
  const overlay = new EventTarget();
  overlay.querySelector = (sel) => (sel === '.dialog-layer' && dialogCount > 0 ? {} : null);
  mountEnding(game, overlay, {
    collection,
    loadFilm: async () => ({ play: () => { played += 1; } }),
  });
  game.state = { ...game.state, ending: 'pacingDeal', era: 5 };
  subscribers.forEach((fn) => fn({ state: game.state, events: [], errors: [] }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(played, 0);

  dialogCount = 1; // the first dialog closes, but a second one is still open
  overlay.dispatchEvent(new Event('gdt-dialog-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(played, 0, 'a second dialog is still open, so the film still waits');

  dialogCount = 0;
  overlay.dispatchEvent(new Event('gdt-dialog-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(played, 1);
});

test('the ending subscriber checks for open dialogs only after every subscriber for the notification has run', async () => {
  const subscribers = [];
  const game = { state: createInitialState({ seed: 2 }), subscribe: (fn) => { subscribers.push(fn); return () => {}; } };
  const collection = { record: () => {}, entries: () => [] };
  let played = 0;
  let loadFilmCalls = 0;
  const overlay = new EventTarget();
  let layer = null;
  overlay.querySelector = (sel) => (sel === '.dialog-layer' ? layer : null);
  mountEnding(game, overlay, {
    collection,
    loadFilm: async () => { loadFilmCalls += 1; return { play: () => { played += 1; } }; },
  });
  // A second subscriber, registered AFTER mountEnding's own (like a release reveal reacting to the same
  // endTurn), opens a dialog layer during the same notification.
  subscribers.push(() => { layer = {}; });

  game.state = { ...game.state, ending: 'pacingDeal', era: 5 };
  const notification = { state: game.state, events: [], errors: [] };
  subscribers.forEach((fn) => fn(notification)); // mirrors game.js's synchronous notify loop over all subscribers

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(loadFilmCalls, 0, 'the film must not start: the reveal opened a dialog during the same notification');

  layer = null;
  overlay.dispatchEvent(new Event('gdt-dialog-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(loadFilmCalls, 1);
  assert.equal(played, 1);

  overlay.dispatchEvent(new Event('gdt-dialog-closed'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(loadFilmCalls, 1, 'a stray later close event must not start it again');
});


test('the epilogue waits for player decisions before the film and ignores duplicate play requests', async () => {
  let submit;
  let decisions = 0;
  const films = [];
  const game = { state: endedState('aligned'), subscribe: () => () => {} };
  const ending = mountEnding(game, null, {
    selectFinale: () => { decisions += 1; return new Promise((resolve) => { submit = resolve; }); },
    loadFilm: async (_root, options) => { films.push(options); return { play() {} }; },
  });
  const playing = ending.play();
  assert.equal(decisions, 1);
  assert.equal(films.length, 0);
  submit({ fullTitle: 'Aligned success — as a careful steward', legacy: [] });
  await playing;
  assert.equal(films.length, 1);
  assert.equal(films[0].fullTitle, 'Aligned success — as a careful steward');
  await ending.play();
  assert.equal(decisions, 1);
  assert.equal(films.length, 1, 'a second play request cannot interrupt the running film');
});
