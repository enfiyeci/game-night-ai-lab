import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fakeDom.js';
import { createInitialState } from '../sim/state.js';
import { SUMMIT_OPEN_DAY } from '../sim/summit.js';
import { roundSpan } from '../sim/time.js';
import { createGame } from '../ui/game.js';
import { projectQueue } from '../ui/logic/compute.js';

const doc = installFakeDom();
doc.addEventListener = () => {};
doc.removeEventListener = () => {};
globalThis.MutationObserver = class { observe() {} disconnect() {} };
const { mountSummit, openSummit } = await import('../ui/screens/summit.js');
const { ITEMS, disabledReason } = await import('../ui/menu.js');

const frames = () => new Promise((resolve) => setTimeout(resolve, 5));
const summitWeek = () => {
  const state = createInitialState();
  state.era = 5;
  state.turnInEra = 0;
  state.dayInRound = SUMMIT_OPEN_DAY;
  state.day = roundSpan(16).start + SUMMIT_OPEN_DAY; // era 5 starts at round 16
  return createGame({ seed: 1, state });
};
const stage = () => {
  const overlay = document.createElement('div');
  document.body.append(overlay);
  return overlay;
};
const summits = (overlay) => overlay.querySelectorAll('.sm-layer');

// Review fix (2026-10-14): only the summit's own opening set the "offered" flag, so after the menu showed it, it could
// pop up by itself again.
test('the summit pops up by itself once, and never again after being left', async () => {
  const game = summitWeek();
  const overlay = stage();
  mountSummit(game, overlay);
  await frames();
  assert.equal(summits(overlay).length, 1, 'it opens by itself in the summit week');
  summits(overlay)[0].remove();
  game.setField('budget', game.state.budget); // a publish: the screen re-checks whether to open
  await frames();
  assert.equal(summits(overlay).length, 0);
});

test('a summit already shown from the menu does not pop up by itself again', async () => {
  const game = summitWeek();
  const overlay = stage();
  assert.ok(openSummit(game, overlay), 'the menu (and the #summit route) open it directly');
  summits(overlay)[0].remove();
  mountSummit(game, overlay);
  game.setField('budget', game.state.budget);
  await frames();
  assert.equal(summits(overlay).length, 0);
});

// Owner decision (2026-10-15): the summit waits for a free Policy team instead of opening into a vote it cannot hold.
test('the summit waits while the Policy team is busy, shows why on the menu, and pops up once Policy is free', async () => {
  const game = summitWeek();
  game.state.round.teams.policy = 'release';
  const overlay = stage();
  mountSummit(game, overlay);
  await frames();
  assert.equal(summits(overlay).length, 0, 'no pop-up while Policy is busy');
  const item = ITEMS.find((entry) => entry.id === 'summit');
  assert.match(disabledReason(item, game, () => {}, projectQueue(game.state, game.queue)), /^The policy team is busy until Jan 2027, week 2$/);
  delete game.state.round.teams.policy; // Policy frees up within the summit week
  game.setField('budget', game.state.budget);
  await frames();
  assert.equal(summits(overlay).length, 1, 'the blocked try did not count as shown');
  assert.equal(disabledReason(item, game, () => {}, projectQueue(game.state, game.queue)), '');
});
