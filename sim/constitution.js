import { HARD_LINES, CASES } from './data/constitution.js';
import { totalDebt } from './hazards.js';

const VALUES = ['candor', 'caution', 'deference', 'userFirst'];
const HARD_LINE_MAP = Object.fromEntries(HARD_LINES.map((line) => [line.id, line]));
const CASE_MAP = Object.fromEntries(CASES.map((entry) => [entry.id, entry]));
const OPTION_MAPS = Object.fromEntries(CASES.map((entry) => [
  entry.id,
  Object.fromEntries(entry.options.map((option) => [option.id, option])),
]));

const validLine = (id) => typeof id === 'string' && Object.hasOwn(HARD_LINE_MAP, id);
const validRuling = (caseId, optionId) =>
  typeof caseId === 'string' && Object.hasOwn(CASE_MAP, caseId)
  && typeof optionId === 'string' && Object.hasOwn(OPTION_MAPS[caseId], optionId);

function applyPowerGrabCost(state, hardLines) {
  if (!hardLines.includes('no-power-grab') || state.flags.noPowerGrabFavorApplied) return;
  state.govFavor.us -= 3;
  state.flags.noPowerGrabFavorApplied = true;
}

export function hasLine(state, id) {
  return validLine(id) && (state.constitution?.hardLines ?? []).includes(id);
}

export function setConstitution(state, value) {
  const hardLines = value?.hardLines;
  const rulings = value?.rulings;
  if (!Array.isArray(hardLines) || hardLines.length !== 3 || new Set(hardLines).size !== hardLines.length) {
    return { ok: false, error: 'choose exactly three different hard lines' };
  }
  if (hardLines.some((id) => !validLine(id))) return { ok: false, error: 'unknown hard line' };
  if (!rulings || typeof rulings !== 'object' || Array.isArray(rulings)) {
    return { ok: false, error: 'every case needs a ruling' };
  }
  const rulingIds = Object.keys(rulings);
  if (rulingIds.length !== CASES.length || rulingIds.some((id) => !Object.hasOwn(CASE_MAP, id))) {
    return { ok: false, error: 'every case needs a ruling' };
  }
  if (CASES.some((entry) => !Object.hasOwn(rulings, entry.id) || !validRuling(entry.id, rulings[entry.id]))) {
    return { ok: false, error: 'unknown case ruling' };
  }
  applyPowerGrabCost(state, hardLines);
  state.constitution = {
    hardLines: [...hardLines],
    rulings: Object.fromEntries(CASES.map((entry) => [entry.id, rulings[entry.id]])),
    amendments: [],
  };
  return { ok: true };
}

function validateChange(change) {
  if (!change || typeof change !== 'object' || Array.isArray(change)) return 'invalid constitution change';
  const keys = Object.keys(change);
  if (keys.length === 0 || keys.some((key) => !['add', 'remove', 'ruling'].includes(key))) return 'invalid constitution change';
  if (Object.hasOwn(change, 'add') && !validLine(change.add)) return `unknown hard line ${change.add}`;
  if (Object.hasOwn(change, 'remove') && !validLine(change.remove)) return `unknown hard line ${change.remove}`;
  if (Object.hasOwn(change, 'ruling')) {
    const ruling = change.ruling;
    if (!ruling || typeof ruling !== 'object' || Array.isArray(ruling) || !validRuling(ruling.caseId, ruling.optionId)) {
      return 'unknown case ruling';
    }
  }
  return null;
}

function changedConstitution(state, change) {
  const hardLines = [...state.constitution.hardLines];
  if (Object.hasOwn(change, 'remove')) {
    const index = hardLines.indexOf(change.remove);
    if (index < 0) return { error: `hard line ${change.remove} is not in the constitution` };
    hardLines.splice(index, 1);
  }
  if (Object.hasOwn(change, 'add')) {
    if (hardLines.includes(change.add)) return { error: `hard line ${change.add} is already in the constitution` };
    hardLines.push(change.add);
  }
  const rulings = { ...state.constitution.rulings };
  if (change.ruling) rulings[change.ruling.caseId] = change.ruling.optionId;
  return { hardLines, rulings };
}

function recordAmendment(state, change, source) {
  const amendment = { turn: state.turn, change: structuredClone(change) };
  if (source) amendment.source = source;
  state.constitution.amendments.push(amendment);
}

export function amendConstitution(state, change) {
  const error = validateChange(change);
  if (error) return { ok: false, error };
  const next = changedConstitution(state, change);
  if (next.error) return { ok: false, error: next.error };
  if (next.hardLines.length !== 3 || new Set(next.hardLines).size !== next.hardLines.length) {
    return { ok: false, error: 'the constitution must keep exactly three hard lines' };
  }
  applyPowerGrabCost(state, next.hardLines);
  state.constitution.hardLines = next.hardLines;
  state.constitution.rulings = next.rulings;
  recordAmendment(state, change);
  return { ok: true };
}

export function forceAmendConstitution(state, change, source) {
  const error = validateChange(change);
  if (error) return { ok: false, error };
  const next = changedConstitution(state, change);
  if (next.error) return { ok: false, error: next.error };
  applyPowerGrabCost(state, next.hardLines);
  state.constitution.hardLines = next.hardLines;
  state.constitution.rulings = next.rulings;
  recordAmendment(state, change, source);
  return { ok: true };
}

export function constitutionValues(state) {
  const totals = Object.fromEntries(VALUES.map((key) => [key, 0]));
  for (const entry of CASES) {
    const option = OPTION_MAPS[entry.id][state.constitution.rulings[entry.id]] ?? entry.options[0];
    for (const key of VALUES) totals[key] += option.values[key] ?? 0.5;
  }
  return Object.fromEntries(VALUES.map((key) => [key, totals[key] / CASES.length]));
}

export function learnedConstitution(state, rng) {
  const drift = Math.min(1, totalDebt(state) / 80);
  const hardLines = state.constitution.hardLines.filter(() => !(drift > 0 && rng.chance(drift)));
  const rulings = {};
  for (const entry of CASES) {
    const written = state.constitution.rulings[entry.id];
    const flips = drift > 0 && rng.chance(drift);
    rulings[entry.id] = flips ? rng.pick(entry.options.map((option) => option.id).filter((id) => id !== written)) : written;
  }
  return { hardLines, rulings };
}
