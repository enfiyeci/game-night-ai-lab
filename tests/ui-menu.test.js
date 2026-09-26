import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../ui/game.js';
import { projectQueue } from '../ui/logic/compute.js';
import { releaseDraft, releasePayload } from '../ui/logic/release.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { ITEMS, disabledReason } from '../ui/menu.js';

const handler = () => {};
const reasonFor = (game, id) => disabledReason(ITEMS.find((item) => item.id === id), game, handler, projectQueue(game.state, game.queue));

function readyGame() {
  const game = createGame({ seed: 1, state: SCENARIOS.readyToRelease(1) });
  assert.ok(game.state.pendingModel, 'the scenario has a model waiting to be released');
  return game;
}

const releaseMove = (game) => {
  const draft = { ...releaseDraft(game.state), family: 'Kestrel' };
  return { type: 'release', release: releasePayload(game.state, draft) };
};

test('release stays open while a queued release can still be changed, even with both moves used', () => {
  const game = readyGame();
  assert.equal(reasonFor(game, 'release'), '');
  game.addMove(releaseMove(game));
  assert.equal(projectQueue(game.state, game.queue).pendingModel, null);
  assert.equal(reasonFor(game, 'release'), '');
  game.addMove({ type: 'constitution' });
  assert.equal(game.movesLeft(), 0);
  assert.equal(reasonFor(game, 'release'), '');
});

test('release is closed with no finished model and nothing queued, and when both moves went elsewhere', () => {
  const game = readyGame();
  game.state.pendingModel = null;
  assert.equal(reasonFor(game, 'release'), 'Release needs a finished model');

  const busy = readyGame();
  busy.addMove({ type: 'constitution' });
  busy.addMove({ type: 'constitution' });
  assert.equal(reasonFor(busy, 'release'), 'Both moves are used this turn');
});

test('other menu items still close when both moves are used, even with a release queued', () => {
  const game = readyGame();
  game.addMove(releaseMove(game));
  game.addMove({ type: 'constitution' });
  for (const id of ['training', 'internal', 'constitution', 'meeting']) {
    assert.notEqual(reasonFor(game, id), '', `${id} should be disabled`);
  }
  for (const id of ['budget', 'endTurn']) assert.equal(reasonFor(game, id), '', `${id} stays free`);
  assert.equal(ITEMS.filter((item) => item.editsQueued).map((item) => item.id).join(), 'release');
});
