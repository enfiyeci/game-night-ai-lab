import { sigmoid } from './util.js';
import { totalDebt } from './hazards.js';

const CONTROL_UNITS = 2;
const TAKEOVER_CAPABILITY = 70;

// The deployed model is the newest trained one, released or not.
const internalCapability = (state) => state.pendingModel?.capability ?? state.capability;

export function deployInternal(state, control) {
  if (state.era < 3) return { ok: false, error: 'internal deployment opens in era 3' };
  if (state.models.length === 0 && !state.pendingModel) return { ok: false, error: 'you need a trained model' };
  if (typeof control !== 'number' || !(control >= 0 && control <= 1)) return { ok: false, error: 'control must be between 0 and 1' };
  // Stopping keeps the last stage, so a stop-and-redeploy cannot reset escalation.
  state.internal = { control, stage: state.internal?.stage ?? state.flags.internalStage ?? 0, turns: 0 };
  return { ok: true, control };
}

export function stopInternal(state) {
  if (!state.internal) return { ok: false, error: 'no model is deployed internally' };
  state.flags.internalStage = state.internal.stage;
  state.internal = null;
  return { ok: true };
}

export const controlUnits = (state) => (state.internal ? Math.round(state.internal.control * CONTROL_UNITS * 10) / 10 : 0);

export function internalRisk(state) {
  const base = sigmoid((totalDebt(state) * internalCapability(state) / 100 - 40) / 8);
  return base * (1 - 0.7 * state.internal.control) * 0.5;
}

export function internalTick(state, rng) {
  const it = state.internal;
  if (!it) return [];
  it.turns += 1;
  if (state.activeRun) state.activeRun.bonus += 3 * (1 - 0.5 * it.control) * (state.era === 5 ? 2 : 1);
  state.researchPoints += 5;
  if (!rng.chance(internalRisk(state))) return [];
  if (it.stage >= 3) {
    if (internalCapability(state) >= TAKEOVER_CAPABILITY) state.ending = 'quietTakeover';
    return [{ type: 'internalIncident', stage: 4 }];
  }
  it.stage += 1;
  it.stageTurn = state.turn;
  return [{ type: it.stage === 1 ? 'internalWarning' : 'internalIncident', stage: it.stage }];
}
