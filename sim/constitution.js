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
const isPlainObject = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

function applyPowerGrabCost(state, hardLines) {
  if (!hardLines.includes('no-power-grab') || state.flags.noPowerGrabFavorApplied) return;
  state.govFavor.us -= 3;
  state.flags.noPowerGrabFavorApplied = true;
}

export function hasLine(state, id) {
  return validLine(id) && (state.constitution?.hardLines ?? []).includes(id);
}

export function setConstitution(state, value) {
  if (!isPlainObject(value) || !Object.hasOwn(value, 'hardLines') || !Object.hasOwn(value, 'rulings')) {
    return { ok: false, error: 'invalid constitution' };
  }
  const hardLines = value.hardLines;
  const rulings = value.rulings;
  if (!Array.isArray(hardLines) || hardLines.length !== 3 || new Set(hardLines).size !== hardLines.length) {
    return { ok: false, error: 'choose exactly three different hard lines' };
  }
  if (hardLines.some((id) => !validLine(id))) return { ok: false, error: 'unknown hard line' };
  if (!isPlainObject(rulings)) {
    return { ok: false, error: 'every case needs a ruling' };
  }
  const rulingIds = Reflect.ownKeys(rulings);
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
  if (!isPlainObject(change)) return { error: 'invalid constitution change' };
  const keys = Reflect.ownKeys(change);
  const hasAdd = Object.hasOwn(change, 'add');
  const hasRemove = Object.hasOwn(change, 'remove');
  const hasRuling = Object.hasOwn(change, 'ruling');
  if (keys.length === 0 || keys.some((key) => !['add', 'remove', 'ruling'].includes(key))) {
    return { error: 'invalid constitution change' };
  }
  const validated = {};
  if (hasAdd) {
    const add = change.add;
    if (!validLine(add)) return { error: `unknown hard line ${add}` };
    validated.add = add;
  }
  if (hasRemove) {
    const remove = change.remove;
    if (!validLine(remove)) return { error: `unknown hard line ${remove}` };
    validated.remove = remove;
  }
  if (hasRuling) {
    const ruling = change.ruling;
    const caseId = isPlainObject(ruling) && Object.hasOwn(ruling, 'caseId') ? ruling.caseId : undefined;
    const optionId = isPlainObject(ruling) && Object.hasOwn(ruling, 'optionId') ? ruling.optionId : undefined;
    if (!isPlainObject(ruling)
      || !Object.hasOwn(ruling, 'caseId')
      || !Object.hasOwn(ruling, 'optionId')
      || Reflect.ownKeys(ruling).some((key) => !['caseId', 'optionId'].includes(key))
      || !validRuling(caseId, optionId)) {
      return { error: 'unknown case ruling' };
    }
    validated.ruling = { caseId, optionId };
  }
  return { change: validated };
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
  const amendment = { turn: state.turn, change };
  if (source) amendment.source = source;
  state.constitution.amendments.push(amendment);
}

export function amendConstitution(state, change) {
  const validated = validateChange(change);
  if (validated.error) return { ok: false, error: validated.error };
  const next = changedConstitution(state, validated.change);
  if (next.error) return { ok: false, error: next.error };
  if (next.hardLines.length !== 3 || new Set(next.hardLines).size !== next.hardLines.length) {
    return { ok: false, error: 'the constitution must keep exactly three hard lines' };
  }
  applyPowerGrabCost(state, next.hardLines);
  state.constitution.hardLines = next.hardLines;
  state.constitution.rulings = next.rulings;
  recordAmendment(state, validated.change);
  return { ok: true };
}

export function forceAmendConstitution(state, change, source) {
  const validated = validateChange(change);
  if (validated.error) return { ok: false, error: validated.error };
  const next = changedConstitution(state, validated.change);
  if (next.error) return { ok: false, error: next.error };
  applyPowerGrabCost(state, next.hardLines);
  state.constitution.hardLines = next.hardLines;
  state.constitution.rulings = next.rulings;
  recordAmendment(state, validated.change, source);
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
