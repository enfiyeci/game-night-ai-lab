import { ERAS, eraById } from './data/eras.js';
import { seat } from './board.js';

// A public compute promise to the board, made from the finance planner (owner design 2026-09-26): "X units by era Y".
// It pays a little now, and on the promised era's last turn the board reacts on a sliding scale of how close you got.
export const PROMISE_NEUTRAL = 0.75;  // reach 75% of the promise and nobody moves
export const PROMISE_VOTE_BELOW = 0.5; // below half, the board calls a vote next turn
export const PROMISE_MADE = { financier: 5, growth: 3 };

const clampInt = (value, lo, hi) => Math.max(lo, Math.min(hi, Math.round(value)));

// Support changes for reaching `ratio` of the promise. Past 100% earns nothing more.
export function promiseEffects(ratio) {
  const r = Math.min(1, Math.max(0, ratio));
  const candor = clampInt(40 * (r - PROMISE_NEUTRAL), -16, 10);
  return {
    candor,
    financier: clampInt(candor / 2, -8, 5),
    growth: r < PROMISE_NEUTRAL ? clampInt(-20 * (PROMISE_NEUTRAL - r), -8, 0) : 0,
    vote: r < PROMISE_VOTE_BELOW,
  };
}

export function makeBoardPromise(state, promise) {
  if (typeof promise !== 'object' || promise === null) return { ok: false, error: 'a board promise needs units and an era' };
  const { units, era } = promise;
  if (!Number.isInteger(units) || units <= 0) return { ok: false, error: 'promise a whole number of compute units' };
  if (!Number.isInteger(era) || era < state.era || era > ERAS.length) return { ok: false, error: 'promise an era that is still ahead' };
  if (era === state.era && state.turnInEra >= eraById(era).turns - 1) return { ok: false, error: 'this era ends this turn' };
  if (state.boardPromise?.status === 'open') return { ok: false, error: 'you already have a promise open with the board' };
  state.boardPromise = { units, era, madeTurn: state.turn, status: 'open' };
  for (const [id, amount] of Object.entries(PROMISE_MADE)) state.board[seat(id)] += amount;
  return { ok: true, units, era };
}

// Runs inside endTurn on the promised era's last turn, with the compute that turn has online.
export function judgeBoardPromise(state) {
  const promise = state.boardPromise;
  if (promise?.status !== 'open' || promise.era !== state.era || state.turnInEra !== eraById(state.era).turns - 1) return null;
  const ratio = state.compute.online / promise.units;
  const effects = promiseEffects(ratio);
  for (const id of ['candor', 'financier', 'growth']) state.board[seat(id)] += effects[id];
  if (effects.vote) state.flags.boardVoteDue = true;
  promise.status = ratio >= 1 ? 'kept' : 'missed';
  promise.ratio = ratio;
  return { type: 'boardPromiseJudged', units: promise.units, era: promise.era, online: state.compute.online, ratio, ...effects };
}
