import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, FakeEvent } from './helpers/fakeDom.js';
import { closeDialog, openDialog } from '../ui/components/dialog.js';
import { ENTER_MS, EXIT_MS, enterTransition, exitTransition } from '../ui/components/transition.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  globalThis.matchMedia = () => ({ matches: false });
  document.body.append(layer);
  const secondExit = exitTransition(layer);
  assert.equal(layer.isConnected, true, 'an instant exit leaves no cached completion behind');
  layer.dispatchEvent(new FakeEvent('pointerdown'));
  await secondExit;
  assert.equal(layer.isConnected, false);
});

test('exit cancels a pending enter frame so it cannot reopen the scene', async () => {
  const document = installFakeDom();
  globalThis.matchMedia = () => ({ matches: false });
  let pendingFrame = null;
  globalThis.requestAnimationFrame = (callback) => {
    pendingFrame = callback;
    return 42;
  };
  globalThis.cancelAnimationFrame = () => {};
  const layer = document.createElement('div');
  document.body.append(layer);

  enterTransition(layer);
  const leaving = exitTransition(layer);
  pendingFrame(); // a frame already queued by the browser may still be delivered after cancellation
  assert.equal(layer.classList.contains('scene-ready'), false);
  assert.equal(layer.classList.contains('dialog-open'), false);
  layer.dispatchEvent(new FakeEvent('keydown', { key: 'Enter' }));
  await leaving;
  assert.equal(layer.isConnected, false);
});

test('rapid dialog replacement closes each superseded layer and keeps only the latest active', async () => {
  const document = installFakeDom();
  globalThis.matchMedia = () => ({ matches: false });
  delete globalThis.cancelAnimationFrame;
  const root = document.createElement('div');
  document.body.append(root);

  openDialog(root, { title: 'A' });
  openDialog(root, { title: 'B' });
  openDialog(root, { title: 'C' });
  await wait(300);

  const remaining = root.querySelectorAll('.dialog-layer');
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].querySelector('h1').textContent, 'C');

  closeDialog(root);
  await wait(EXIT_MS + 20);
  assert.equal(root.querySelectorAll('.dialog-layer').length, 0);
});
