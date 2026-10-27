import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../ui/game.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { createRng } from '../sim/rng.js';
import { readSave, writeSave } from '../sim/save.js';
import { TEAM_OF, teamBusyError } from '../sim/teams.js';
import { usesAction } from '../sim/turn.js';
import { STRATEGIES, eventChoices, dailyRelease } from '../tools/balance.js';
import { RUN_SAVE_KEY, clearRun, continueNote, createAutosave, loadRun, savesAllowed } from '../ui/logic/save.js';

const styleOf = (name) => (['careful', 'carefulNoGrid'].includes(name) ? 'careful' : ['speed', 'safety', 'random'].includes(name) ? name : 'balanced');

// A bot that plays the real game object a story day at a time, the way tools/play-round.js plays the sim: its
// round's actions at each mark, answers on the day a card lands, then one day. Its own state (its random stream and
// the round it last planned) is saved beside the game, as a player's memory would be.
function bot(name, seed) {
  return { name, rng: createRng(seed * 31 + 7), planned: -1 };
}
function act(game, chosen) {
  const state = game.state;
  const occupied = new Set(Object.keys(state.round.teams));
  let slots = 2 - state.round.moves;
  const moves = (chosen.moves ?? []).filter((move) => {
    const team = TEAM_OF[move.type];
    if ((usesAction(move) && slots <= 0) || occupied.has(team) || teamBusyError(state, move)) return false;
    if (usesAction(move)) slots--;
    occupied.add(team);
    return true;
  });
  Object.assign(game.queue, structuredClone({ ...chosen, moves }));
  game.flush();
}
function playDay(game, player) {
  if (game.state.turn !== player.planned) {
    player.planned = game.state.turn;
    act(game, STRATEGIES[player.name](game.state, player.rng));
    if (game.state.ending) return;
  }
  const choices = eventChoices(game.state, styleOf(player.name), player.rng);
  if (Object.keys(choices).length) act(game, { eventChoices: choices });
  if (game.state.ending) return;
  const daily = dailyRelease(player.name, game.state);
  if (daily) act(game, daily);
  if (game.state.ending) return;
  game.advanceDays(1);
}
const playOut = (game, player) => { for (let day = 0; day < 3000 && !game.state.ending; day++) playDay(game, player); };
const freshGame = (seed) => {
  const state = SCENARIOS.start(seed);
  return createGame({ seed, state, eventMode: 'scenarios' });
};
const outcome = (game) => ({ state: game.state, finance: game.financeHistory, rivals: game.rivalReleases, align: game.lastAlignShare });
// The save travels as text, as it does through localStorage and the iOS app's copy of it.
const throughText = (run) => readSave(writeSave(run, { savedAt: 0 })).run;
const resume = (run) => {
  const game = createGame({ checkpoint: run.checkpoint });
  game.replay(run.inputs);
  return game;
};

for (const name of ['balanced', 'random', 'speed']) {
  test(`${name}: a game saved mid-round at a quiet moment and resumed plays out as the uninterrupted game`, () => {
    for (let seed = 1; seed <= 5; seed++) {
      const straight = freshGame(seed);
      playOut(straight, bot(name, seed));

      const game = freshGame(seed);
      const player = bot(name, seed);
      const stopDay = 40 + ((seed * 97) % 260);
      while (!game.state.ending && game.state.day < stopDay) playDay(game, player);
      const run = throughText({ checkpoint: game.checkpoint(), inputs: game.inputs, player: { rng: player.rng.state(), planned: player.planned } });
      assert.deepEqual(run.inputs, []);
      const resumed = resume(run);
      playOut(resumed, { name, rng: createRng(run.player.rng), planned: run.player.planned });

      assert.ok(straight.state.ending);
      assert.deepStrictEqual(outcome(resumed), outcome(straight), `${name} seed ${seed} saved on day ${stopDay}`);
    }
  });
}

test('a save from an older checkpoint replays the inputs since then: the same notifications, then the same game', () => {
  for (let seed = 1; seed <= 4; seed++) {
    const straight = freshGame(seed);
    playOut(straight, bot('balanced', seed));

    const game = freshGame(seed);
    const player = bot('balanced', seed);
    while (game.state.day < 30 + seed * 11) playDay(game, player);
    const checkpoint = game.checkpoint();
    const heard = [];
    game.subscribe(({ state, events, errors }) => heard.push({ day: state.day, turn: state.turn, events, errors }));
    while (game.state.day < 120 + seed * 23) playDay(game, player); // past at least one round mark
    assert.ok(game.inputs.length > 0);
    const run = throughText({ checkpoint, inputs: game.inputs, player: { rng: player.rng.state(), planned: player.planned } });

    const resumed = createGame({ checkpoint: run.checkpoint });
    const replayed = [];
    resumed.subscribe(({ state, events, errors }) => replayed.push({ day: state.day, turn: state.turn, events, errors }));
    resumed.replay(run.inputs);
    assert.deepStrictEqual(replayed, heard, `seed ${seed}: the replay repeats what screens heard`);
    assert.deepStrictEqual(resumed.inputs, game.inputs, 'the replayed inputs stay in the log until the next checkpoint');
    playOut(resumed, { name: 'balanced', rng: createRng(run.player.rng), planned: run.player.planned });
    assert.deepStrictEqual(outcome(resumed), outcome(straight), `seed ${seed}`);
  }
});

test('the input log keeps decisions and story days, and a checkpoint starts it afresh', () => {
  const game = freshGame(3);
  assert.deepEqual(game.inputs, []);
  game.advanceDays(1);
  game.advanceDays(2);
  const offerId = game.state.compute.offers.find((offer) => offer.supplier === 'coreflame').id;
  game.addMove({ type: 'deal', offerId });
  game.advanceDays(1);
  assert.deepEqual(game.inputs.map((input) => input.kind), ['days', 'actions', 'days']);
  assert.equal(game.inputs[0].n, 3);
  assert.deepEqual(game.inputs[1].actions.moves, [{ type: 'deal', offerId }]);
  game.checkpoint();
  assert.deepEqual(game.inputs, []);
});

test('a checkpoint is a copy: later changes to the game do not reach it', () => {
  const game = freshGame(2);
  const checkpoint = game.checkpoint();
  const day = checkpoint.state.day;
  game.state.labName = 'Changed';
  game.advanceDays(3);
  assert.equal(checkpoint.state.day, day);
  assert.notEqual(checkpoint.state.labName, 'Changed');
});

// --- the autosave ---

const memoryStorage = () => {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
};
const fakeTimers = () => {
  let at = 0;
  const due = [];
  return {
    now: () => at,
    setTimer: (fn, ms) => { const timer = { fn, when: at + ms }; due.push(timer); return timer; },
    clearTimer: (timer) => { const i = due.indexOf(timer); if (i >= 0) due.splice(i, 1); },
    advance(ms) {
      at += ms;
      for (let timer = due.find((t) => t.when <= at); timer; timer = due.find((t) => t.when <= at)) {
        due.splice(due.indexOf(timer), 1);
        timer.fn();
      }
    },
  };
};
const autosaveFor = (game, { quiet = () => true, storage = memoryStorage(), timers = fakeTimers() } = {}) => ({
  storage,
  timers,
  autosave: createAutosave({ game, storage, isQuiet: quiet, now: timers.now, setTimer: timers.setTimer, clearTimer: timers.clearTimer }),
});

test('story days are saved at most every two seconds, a little after they happen', () => {
  const game = freshGame(5);
  const { storage, timers } = autosaveFor(game);
  game.advanceDays(1);
  assert.equal(storage.getItem(RUN_SAVE_KEY), null, 'not inside the update: screens may still be opening');
  timers.advance(0);
  const first = storage.getItem(RUN_SAVE_KEY);
  assert.ok(first);
  game.advanceDays(1);
  game.advanceDays(1);
  timers.advance(1999);
  assert.equal(storage.getItem(RUN_SAVE_KEY), first);
  timers.advance(1);
  assert.notEqual(storage.getItem(RUN_SAVE_KEY), first);
  assert.equal(loadRun(storage).run.checkpoint.state.day, game.state.day);
});

test('save() writes at once, for the page or the app going to the background', () => {
  const game = freshGame(5);
  const { storage, autosave } = autosaveFor(game);
  game.advanceDays(2);
  autosave.save();
  assert.equal(loadRun(storage).run.checkpoint.state.day, game.state.day);
});

test('while something is open the save keeps the last quiet checkpoint and the inputs since', () => {
  const game = freshGame(6);
  let quiet = true;
  const { storage, autosave } = autosaveFor(game, { quiet: () => quiet });
  game.advanceDays(2);
  autosave.save();
  const quietDay = game.state.day;
  quiet = false;
  game.advanceDays(3);
  autosave.save();
  const busy = loadRun(storage).run;
  assert.equal(busy.checkpoint.state.day, quietDay);
  assert.deepEqual(busy.inputs, [{ kind: 'days', n: 3 }]);
  assert.equal(resume(busy).state.day, game.state.day);
  quiet = true;
  autosave.save();
  assert.deepEqual(loadRun(storage).run.inputs, []);
});

test('when the run ends its save is removed and nothing more is written', () => {
  const game = freshGame(7);
  const { storage, timers, autosave } = autosaveFor(game);
  game.advanceDays(1);
  autosave.save();
  assert.ok(storage.getItem(RUN_SAVE_KEY));
  game.state.ending = 'acquihire'; // as the sim sets it on the day the run ends
  game.advanceDays(1);
  timers.advance(2000);
  autosave.save();
  assert.equal(storage.getItem(RUN_SAVE_KEY), null);
});

test('after stop() nothing more is written, even once the save was cleared', () => {
  const game = freshGame(7);
  const { storage, timers, autosave } = autosaveFor(game);
  game.advanceDays(1);
  autosave.stop();
  clearRun(storage);
  game.advanceDays(1);
  timers.advance(2000);
  autosave.save();
  assert.equal(storage.getItem(RUN_SAVE_KEY), null);
});

test('a storage that throws (a private window) never breaks the game', () => {
  const game = freshGame(8);
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  const { timers, autosave } = autosaveFor(game, { storage: broken });
  game.advanceDays(1);
  timers.advance(0);
  autosave.save();
  assert.doesNotThrow(() => clearRun(broken));
  assert.deepEqual(loadRun(broken), { ok: false, reason: 'missing' });
});

test('loadRun refuses what it cannot continue, without throwing', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadRun(storage), { ok: false, reason: 'missing' });
  storage.setItem(RUN_SAVE_KEY, '{"version":999,"run":{}}');
  assert.deepEqual(loadRun(storage), { ok: false, reason: 'version' });
  storage.setItem(RUN_SAVE_KEY, 'garbage');
  assert.deepEqual(loadRun(storage), { ok: false, reason: 'corrupt' });
});

test('saves are kept only for plain visits: debug links and seeded runs neither load nor overwrite them', () => {
  assert.equal(savesAllowed({ search: '', hash: '' }), true);
  assert.equal(savesAllowed({ search: '?continue', hash: '' }), true);
  assert.equal(savesAllowed({ search: '?lab=Halcyon', hash: '' }), true);
  assert.equal(savesAllowed({ search: '?seed=4', hash: '' }), false);
  assert.equal(savesAllowed({ search: '?scenario=start', hash: '' }), false);
  assert.equal(savesAllowed({ search: '?notitle', hash: '' }), false);
  assert.equal(savesAllowed({ search: '?leads=dev', hash: '' }), false);
  assert.equal(savesAllowed({ search: '', hash: '#finance' }), false);
});

test('the Continue note names the lab and where the story stands', () => {
  const game = freshGame(4);
  game.state.labName = 'Northlight';
  game.advanceDays(40);
  const note = continueNote({ checkpoint: game.checkpoint(), inputs: [] });
  assert.equal(note, 'Northlight · Era 1 · Feb 2023');
});

test('the Continue note tells where the run stands, even when the save replays inputs past its checkpoint', () => {
  const game = freshGame(4);
  game.state.labName = 'Northlight';
  let quiet = true;
  const { storage, autosave } = autosaveFor(game, { quiet: () => quiet });
  quiet = false;
  game.advanceDays(40);
  autosave.save();
  const { run } = loadRun(storage);
  assert.equal(run.checkpoint.state.day, 0);
  assert.equal(continueNote(run), 'Northlight · Era 1 · Feb 2023');
});

test('noteQuiet() takes a checkpoint when the game turns quiet after something was open, and a write follows', () => {
  const game = freshGame(9);
  let quiet = false;
  const { storage, timers, autosave } = autosaveFor(game, { quiet: () => quiet });
  game.advanceDays(5);
  autosave.noteQuiet();
  assert.equal(game.inputs.length, 1, 'still busy: no checkpoint');
  quiet = true;
  autosave.noteQuiet();
  assert.deepEqual(game.inputs, []);
  game.advanceDays(1);
  autosave.noteQuiet();
  assert.equal(game.inputs.length, 1, 'still quiet since the last checkpoint: no copy is taken again');
  quiet = false; // something opens again before the write
  timers.advance(2000);
  const { run } = loadRun(storage);
  assert.equal(run.checkpoint.state.day, game.state.day - 1);
  assert.deepEqual(run.inputs, [{ kind: 'days', n: 1 }]);
});

test('a name the UI writes on the state is logged and replayed', () => {
  const game = freshGame(2);
  const checkpoint = game.checkpoint();
  game.annotate('modelFamily', 'Heron');
  assert.equal(game.state.modelFamily, 'Heron');
  assert.notEqual(checkpoint.state.modelFamily, 'Heron');
  const run = throughText({ checkpoint, inputs: game.inputs });
  assert.equal(resume(run).state.modelFamily, 'Heron');
});

// Review finding 1: a save taken after "Call the vote" replays the eve day (the meeting opens) and then the crossing
// days; the meeting must not stay on its ring for a vote already held, where a second call would skip a round.
test('a meeting reopened by a replay closes once the replay carries the game past its vote', async () => {
  const { installFakeDom } = await import('./helpers/fakeDom.js');
  const { mountBoardMeeting } = await import('../ui/screens/boardMeeting.js');
  const { nextRoundDay } = await import('../sim/time.js');
  globalThis.matchMedia = () => ({ matches: true }); // reduced motion: transitions end at once
  const mount = (game) => {
    const doc = installFakeDom();
    const stage = doc.createElement('main');
    const overlay = doc.createElement('div');
    stage.append(overlay);
    doc.body.append(stage);
    mountBoardMeeting(game, { overlay, stage });
    return overlay;
  };
  const game = createGame({ seed: 3, state: SCENARIOS.boardVote(3), eventMode: 'legacy' });
  const overlay = mount(game);
  while (nextRoundDay(game.state) - game.state.day > 2) game.advanceDays(1);
  const checkpoint = game.checkpoint();
  game.advanceDays(1);
  assert.ok(overlay.querySelector('.mt-ring'), 'the meeting opens on the eve of the vote');
  overlay.querySelector('.join')?.click();
  overlay.querySelector('.mt-call-vote').click();
  const run = throughText({ checkpoint, inputs: game.inputs });

  const resumed = createGame({ checkpoint: run.checkpoint });
  const again = mount(resumed);
  resumed.replay(run.inputs);
  await new Promise((resolve) => { setTimeout(resolve, 0); });
  assert.equal(again.querySelector('.mt-layer'), null, 'no meeting left waiting for a vote already held');
  assert.deepStrictEqual(resumed.state, game.state);
});

test('a resumed game that the replay carried to its ending leaves no save behind', () => {
  const game = freshGame(7);
  game.state.ending = 'acquihire';
  const storage = memoryStorage();
  storage.setItem(RUN_SAVE_KEY, 'an old save');
  autosaveFor(game, { storage });
  assert.equal(storage.getItem(RUN_SAVE_KEY), null);
});

test('loadRun refuses a save whose run is not shaped like a run, so the title never crashes on it', () => {
  const storage = memoryStorage();
  storage.setItem(RUN_SAVE_KEY, writeSave({ where: { day: 3 } }, { savedAt: 0 }));
  assert.deepEqual(loadRun(storage), { ok: false, reason: 'corrupt' });
  storage.setItem(RUN_SAVE_KEY, writeSave({ checkpoint: { state: {}, rng: 1 }, inputs: 'x' }, { savedAt: 0 }));
  assert.deepEqual(loadRun(storage), { ok: false, reason: 'corrupt' });
});
