import { constitutionValues } from './constitution.js';
import { runway } from './economy.js';
import { jobLevels } from './automation.js';
import { PACK } from './data/automation.js';
import { LUMEN_EPILOGUES, LUMEN_LINES, LUMEN_SIGNOFF } from './data/lumen.js';

function newestReleasedModel(state) {
  let newest = null;
  for (const [index, model] of (state.models ?? []).entries()) {
    const sequence = model.releaseSequence ?? index;
    if (!newest || sequence > newest.sequence) newest = { model, sequence };
  }
  return newest?.model ?? null;
}

export function lumenDisposition(state) {
  const debt = state.alignmentDebt + state.concealedDebt;
  if (state.era >= 3 && (debt >= 50 || state.concealedDebt >= 20)) return 'evasive';

  if (newestReleasedModel(state)?.flags?.includes('sycophancy')) return 'flattering';
  if (constitutionValues(state).candor < 0.4) return 'flattering';

  return state.era <= 2 ? 'eager' : 'honest';
}

function lumenSituation(state) {
  if (state.pendingEvents?.length > 0) return 'crisis';
  if (runway(state, 'planned') < 6) return 'broke';
  if (jobLevels(state).some((level, i) => level > PACK[state.era][i])) return 'internal';
  if (state.pendingModel) return 'readyToRelease';
  if (state.activeRun) return 'training';
  return 'idle';
}

export function lumenLine(state) {
  const disposition = lumenDisposition(state);
  const situation = lumenSituation(state);
  const pool = LUMEN_LINES[disposition][situation];
  const text = pool[state.turn % pool.length].replaceAll('{name}', () => state.lumenName ?? 'Lumen');
  return { disposition, situation, text };
}

export function lumenEpilogue(state) {
  const disposition = lumenDisposition(state);
  return `${LUMEN_EPILOGUES[state.ending]} ${LUMEN_SIGNOFF[disposition]}`;
}
