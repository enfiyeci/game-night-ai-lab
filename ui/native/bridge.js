// The iOS app's bridge (ios/README.md). In a browser there is no native handler and this file does nothing.
// In the app it sends the glance (cash, era, the running training) to the shell, and lets the shell pause
// the clock while the app is in the background.
const native = globalThis.webkit?.messageHandlers?.gameNight;

if (native) {
  const { money, project } = await import('../logic/format.js');
  const { ERAS } = await import('../../sim/data/eras.js');

  // main.js sets globalThis.game after the office and the first screens are mounted.
  const game = await new Promise((resolve) => {
    const check = () => (globalThis.game ? resolve(globalThis.game) : setTimeout(check, 100));
    check();
  });

  const glanceOf = (state) => {
    const run = project(state);
    return {
      labName: state.labName ?? null,
      cash: money(state.cash),
      era: state.era,
      eraName: ERAS[state.era - 1]?.name ?? '',
      training: { name: run.name, status: run.status, progress: run.progress },
      over: Boolean(state.ending),
    };
  };

  // The clock ticks many times a second at top speed; the glance needs at most two updates a second.
  let last = '';
  let timer = null;
  const send = () => {
    timer = null;
    const glance = glanceOf(game.state);
    const text = JSON.stringify(glance);
    if (text === last) return;
    last = text;
    native.postMessage({ type: 'glance', glance });
  };
  game.subscribe(() => { timer ??= setTimeout(send, 500); });

  globalThis.gameNightNative = {
    pause: () => game.clock.pause('native'),
    resume: () => game.clock.resume('native'),
  };
  if (globalThis.__gameNightShell?.background) game.clock.pause('native');
  send();
  native.postMessage({ type: 'ready' });
}
