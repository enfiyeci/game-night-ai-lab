import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, FakeEvent } from './helpers/fakeDom.js';
import { ENTER_MS, EXIT_MS, enterTransition, exitTransition } from '../ui/components/transition.js';

test('the shared scene vocabulary stays inside the enter and exit budgets', () => {
  assert.ok(ENTER_MS <= 300);
  assert.ok(EXIT_MS <= 250);
});

test('input finishes an entering or exiting scene', async () => {
  const document = installFakeDom();
  globalThis.matchMedia = () => ({ matches: false });
  const layer = document.createElement('div');
  document.body.append(layer);

  enterTransition(layer);
  assert.equal(layer.classList.contains('scene-entering'), true);
  layer.dispatchEvent(new FakeEvent('pointerdown'));
  assert.equal(layer.classList.contains('scene-ready'), true);

  const leaving = exitTransition(layer);
  assert.equal(layer.isConnected, true, 'the closing layer keeps the stage during its exit');
  layer.dispatchEvent(new FakeEvent('keydown', { key: 'Enter' }));
  await leaving;
  assert.equal(layer.isConnected, false);
});

test('reduced motion enters and exits immediately', async () => {
  const document = installFakeDom();
  globalThis.matchMedia = () => ({ matches: true });
  const layer = document.createElement('div');
  document.body.append(layer);

  enterTransition(layer);
  assert.equal(layer.classList.contains('scene-entering'), false);
  assert.equal(layer.classList.contains('scene-ready'), true);
  await exitTransition(layer);
  assert.equal(layer.isConnected, false);
});
