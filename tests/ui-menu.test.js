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

// Real time: a release applies the moment it is confirmed, and the policy team is busy for the round.
test('a release applies at once, and the policy team is busy until the next round mark', () => {
  const game = readyGame();
  assert.equal(reasonFor(game, 'release'), '');
  assert.equal(game.addMove(releaseMove(game)).ok, true);
  assert.equal(game.state.pendingModel, null);
  assert.equal(game.movesLeft(), 1);
  assert.match(reasonFor(game, 'release'), /^The policy team is busy until Y\d+ M\d+ W\d$/);
});

test('release is closed with no finished model, and when both team actions went elsewhere', () => {
  const game = readyGame();
  game.state.pendingModel = null;
  assert.equal(reasonFor(game, 'release'), 'Release needs a finished model');

  const busy = readyGame();
  busy.state.round.moves = 2;
  assert.match(reasonFor(busy, 'release'), /^Both team actions are used this (quarter|month|week)$/);
});

test('other menu items close when both team actions are used; the budget stays free', () => {
  const game = readyGame();
  game.state.round.moves = 2;
  for (const id of ['training', 'constitution', 'meeting']) {
    assert.notEqual(reasonFor(game, id), '', `${id} should be disabled`);
  }
  assert.equal(reasonFor(game, 'budget'), '', 'budget stays free');
  assert.equal(ITEMS.some((item) => item.id === 'endTurn'), false);
});
