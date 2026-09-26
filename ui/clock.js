import { ROUND_DAYS, storyDate } from '../sim/time.js';

const SPEEDS = [0, 1, 2, 4];
const MAX_STEP_MS = 1000;

export function createClock(game, { now = () => performance.now(), secondsPerRound = 45 } = {}) {
  let speed = 1;
  let last = null;
  let owed = 0;
  let frame = null;
  const reasons = new Set();
  const listeners = new Set();

  const snapshot = () => ({ ...storyDate(game.state.day), day: game.state.day, speed, paused: reasons.size > 0 || speed === 0, reasons: [...reasons] });
  const emit = () => { const s = snapshot(); for (const fn of listeners) fn(s); };

  function step() {
    const t = now();
    const dt = last === null ? 0 : Math.min(MAX_STEP_MS, Math.max(0, t - last));
    last = t;
    if (game.state.ending || reasons.size > 0 || speed === 0) return;
    owed += dt * speed; // speed-weighted, so a later speed change never rescales time already owed
    let advanced = false;
    while (true) {
      if (game.state.ending || reasons.size > 0 || speed === 0) {
        owed = 0;
        break;
      }
      const msPerDay = (secondsPerRound * 1000) / ROUND_DAYS[game.state.era];
      if (owed + 1e-9 < msPerDay) break;
      owed -= msPerDay;
      game.advanceDays(1);
      advanced = true;
    }
    if (advanced) emit();
  }

  return {
    step,
    start() { const loop = () => { step(); frame = requestAnimationFrame(loop); }; frame = requestAnimationFrame(loop); },
    stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; },
    pause(reason) { reasons.add(reason); emit(); },
    resume(reason) { reasons.delete(reason); last = now(); emit(); },
    setSpeed(n) { if (SPEEDS.includes(n)) { speed = n; last = now(); emit(); } },
    now: snapshot,
    on(type, fn) { if (type !== 'tick') return () => {}; listeners.add(fn); return () => listeners.delete(fn); },
    watch(overlay) {
      const sync = () => {
        for (const [sel, reason] of [['.dialog-layer', 'dialog'], ['.menu-layer', 'menu']]) {
          if (overlay.querySelector(sel)) reasons.add(reason); else reasons.delete(reason);
        }
        last = now();
        emit();
      };
      new MutationObserver(sync).observe(overlay, { childList: true, subtree: true });
      document.addEventListener('visibilitychange', () => { if (document.hidden) reasons.add('hidden'); else reasons.delete('hidden'); last = now(); emit(); });
      sync();
    },
  };
}
