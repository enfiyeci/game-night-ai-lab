export const ENTER_MS = 180;
export const EXIT_MS = 160;

const running = new WeakMap();

export function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function nextFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === 'function') return globalThis.requestAnimationFrame(callback);
  return globalThis.setTimeout(callback, 0);
}

function finishOnInput(layer, finish) {
  const skip = (event) => {
    if (event.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(event.key)) return;
    finish();
  };
  layer.addEventListener('pointerdown', skip, { capture: true });
  layer.addEventListener('keydown', skip, { capture: true });
  return () => {
    layer.removeEventListener('pointerdown', skip, { capture: true });
    layer.removeEventListener('keydown', skip, { capture: true });
  };
}

export function enterTransition(layer) {
  layer.classList.add('scene-transition', 'scene-entering');
  if (reducedMotion()) {
    layer.classList.remove('scene-entering');
    layer.classList.add('scene-ready', 'dialog-open');
    return;
  }

  let timer = null;
  let removeInput = () => {};
  const finish = () => {
    if (!layer.classList.contains('scene-entering')) return;
    if (timer !== null) globalThis.clearTimeout(timer);
    removeInput();
    layer.classList.remove('scene-entering');
    layer.classList.add('scene-ready', 'dialog-open');
  };
  removeInput = finishOnInput(layer, finish);
  nextFrame(() => {
    if (!layer.isConnected) return;
    layer.classList.add('scene-ready', 'dialog-open');
    timer = globalThis.setTimeout(finish, ENTER_MS);
  });
}

export function exitTransition(layer, { remove = true } = {}) {
  if (!layer) return Promise.resolve();
  if (running.has(layer)) return running.get(layer);
  const instant = reducedMotion() || !layer.isConnected;

  const transition = new Promise((resolve) => {
    let timer = null;
    let removeInput = () => {};
    const finish = () => {
      if (timer !== null) globalThis.clearTimeout(timer);
      removeInput();
      running.delete(layer);
      if (remove) layer.remove();
      resolve();
    };

    layer.classList.remove('scene-entering', 'scene-ready', 'dialog-open');
    layer.classList.add('scene-transition', 'scene-exiting');
    if (instant) {
      finish();
      return;
    }
    removeInput = finishOnInput(layer, finish);
    timer = globalThis.setTimeout(finish, EXIT_MS);
  });
  if (!instant) running.set(layer, transition);
  return transition;
}
