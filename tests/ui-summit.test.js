import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers/fakeDom.js';
import { createInitialState } from '../sim/state.js';
import { SUMMIT_OPEN_DAY } from '../sim/summit.js';
import { createGame } from '../ui/game.js';

const doc = installFakeDom();
doc.addEventListener = () => {};
doc.removeEventListener = () => {};
globalThis.MutationObserver = class { observe() {} disconnect() {} };
const { mountSummit, openSummit } = await import('../ui/screens/summit.js');

const frames = () => new Promise((resolve) => setTimeout(resolve, 5));
const summitWeek = () => {
  const state = createInitialState();
  state.era = 5;
  state.turnInEra = 0;
  state.dayInRound = SUMMIT_OPEN_DAY;
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
