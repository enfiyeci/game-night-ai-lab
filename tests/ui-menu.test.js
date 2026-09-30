import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../ui/game.js';
import { projectQueue } from '../ui/logic/compute.js';
import { releaseDraft, releasePayload } from '../ui/logic/release.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { COMPANY_ITEMS, GAME_ITEMS, ITEMS, disabledReason } from '../ui/menu.js';
import { MEETINGS } from '../sim/data/president.js';

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
  assert.match(reasonFor(game, 'release'), /^The policy team is busy until [A-Z][a-z]{2} \d{4}(, week \d)?$/);
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
  for (const id of ['training', 'meeting']) {
    assert.notEqual(reasonFor(game, id), '', `${id} should be disabled`);
  }
  assert.equal(reasonFor(game, 'budget'), '', 'budget stays free');
  assert.equal(reasonFor(game, 'automation'), '', 'who does the work stays free');
  assert.equal(ITEMS.some((item) => item.id === 'endTurn'), false);
});

test('meeting availability uses the live meeting and closes once he has been met', () => {
  const game = createGame({ seed: 1, state: SCENARIOS.meeting(1) });
  assert.equal(reasonFor(game, 'meeting'), '');
  game.queue.presidentAnswers = MEETINGS[0].exchanges.map((exchange) => exchange.answers[0].id);
  const result = game.addMove({ type: 'meeting' });
  assert.equal(result.ok, true);
  // the answers ride in the same flush as the move, so this is a real meeting, not a walkout
  assert.equal(result.events.find((event) => event.type === 'meetingOutcome')?.walkedOut, false);
  assert.equal(game.state.meeting, null);
  assert.notEqual(reasonFor(game, 'meeting'), '');
});

// Owner pick 3B: Company stays about the business; a Game item at the bottom of the menu holds the rest.
test('the main menu ends with a divider and a Game submenu, and Company no longer holds the sound item', () => {
  const [divider, game] = ITEMS.slice(-2);
  assert.equal(divider.divider, true);
  assert.equal(game.id, 'game');
  assert.equal(game.label, 'Game');
  assert.equal(game.submenu, 'game');
  assert.equal(game.free, true);
  assert.equal(ITEMS.find((item) => item.id === 'company').submenu, 'company');
  assert.deepEqual(GAME_ITEMS.map((item) => item.id), ['endings', 'howto', 'sound', 'credits']);
  assert.equal(GAME_ITEMS.find((item) => item.id === 'howto').label, 'How to play');
  assert.ok(GAME_ITEMS.every((item) => item.free), 'nothing in Game costs a team action');
  assert.equal(COMPANY_ITEMS.some((item) => item.id === 'sound'), false);
});

test('Endings found shows how many of the endings this browser has found', () => {
  const endings = GAME_ITEMS.find((item) => item.id === 'endings');
  const game = createGame({ seed: 1, state: SCENARIOS.start(1) });
  assert.equal(endings.note(game), '', 'no collection, no count');
  game.collection = { progress: () => ({ found: 3, total: 11 }) };
  assert.equal(endings.note(game), '3 of 11');
});

test('the summit waits for the President’s waiting call, then opens once he has been met', () => {
  // meeting2(2): seed 1's run ends before the second meeting since the quiet-takeover roll became a running total
  // (deterministic endings A3 shifted the main random stream).
  const game = createGame({ seed: 1, state: SCENARIOS.meeting2(2) });
  // the projection expires an untaken call at the round's end, so the check must read the live meeting
  assert.equal(reasonFor(game, 'summit'), 'Take the President’s call first');
  game.queue.presidentAnswers = MEETINGS[1].exchanges.map((exchange) => exchange.answers[0].id);
  assert.equal(game.addMove({ type: 'meeting' }).ok, true);
  assert.equal(game.state.meeting, null);
  assert.equal(reasonFor(game, 'summit'), '');
});
