// The Head of Safety's constitution draft, as the document screen shows it. Pure: no DOM.
// Lines and rulings are compared with Safety's proposal on the first draft and with the live copy afterwards.
// A line's `effect` is never part of the view (owner rule 2026-09-26: no option shows its effect).
import { hasConstitution } from '../../sim/constitution.js';
import { CASES, FIXED_LINE, HARD_LINES, SAFETY_PROPOSAL } from '../../sim/data/constitution.js';
import { storyDate } from '../../sim/time.js';
import { storyDayForTurn } from './format.js';

const SOURCES = {
  president: 'The President asked',
  investors: 'Investors asked',
  users: 'Users asked',
  political: 'Political groups asked',
  activists: 'Activists asked',
  pentagon: 'The Pentagon asked', // OWNER WRITES
  blacklistAppeal: 'Agreed to end the blacklist fight', // OWNER WRITES
};

export const sourceLabel = (source) => SOURCES[source]
  ?? (typeof source === 'string' && source ? `${source[0].toUpperCase()}${source.slice(1)} asked` : 'Someone asked');

const lineText = (id) => HARD_LINES.find((line) => line.id === id)?.text ?? id;

function changeText(change) {
  const parts = [];
  if (change.remove) parts.push(`Removed: “${lineText(change.remove)}”`);
  if (change.add) parts.push(`Added: “${lineText(change.add)}”`);
  if (change.ruling) {
    const index = CASES.findIndex((entry) => entry.id === change.ruling.caseId);
    const option = CASES[index]?.options.find((o) => o.id === change.ruling.optionId);
    parts.push(`Example ${index + 1} now: ${option?.label ?? change.ruling.optionId}`);
  }
  return parts.join(' ');
}

export function documentView(state, draft) {
  const first = !hasConstitution(state);
  const base = first ? SAFETY_PROPOSAL : state.constitution;
  const version = state.constitution?.version ?? 0;
  const changes = draft.changes ?? [];
  const onLines = new Set(draft.hardLines ?? []);
  const baseLines = new Set(base.hardLines);
  const lastChange = (test) => changes.findLast((entry) => test(entry.change));

  const lines = HARD_LINES.map(({ id, text }) => {
    const on = onLines.has(id);
    const inBase = baseLines.has(id);
    let tag = null;
    if (on === inBase) tag = on ? (first ? 'Safety’s pick' : `In v${version}`) : null;
    else {
      const demand = lastChange((change) => (on ? change.add === id : change.remove === id));
      if (demand) tag = sourceLabel(demand.source);
      else if (on) tag = 'Added by you';
      else tag = first ? 'Safety’s pick · removed by you' : 'Removed by you';
    }
    return { id, text, on, tag };
  });

  const cases = CASES.map((entry) => {
    const current = draft.rulings?.[entry.id];
    const proposedOption = entry.options.find((option) => option.id === base.rulings[entry.id]) ?? entry.options[0];
    let changedBy = null;
    if (current !== proposedOption.id) {
      const demand = lastChange((change) => change.ruling?.caseId === entry.id && change.ruling.optionId === current);
      changedBy = demand ? sourceLabel(demand.source) : 'Changed by you';
    }
    return {
      id: entry.id,
      prompt: entry.prompt,
      options: entry.options.map((option) => ({ id: option.id, label: option.label, on: option.id === current })),
      proposed: { id: proposedOption.id, label: proposedOption.label },
      changedBy,
    };
  });

  const last = state.models?.at(-1);
  const family = last?.family ?? 'Kestrel';
  // A trained model awaiting release has already learned the current version, so the draft is for the one after it.
  const next = (last?.generation ?? 0) + (state.pendingModel ? 2 : 1);
  const knownOn = lines.filter((line) => line.on).length;
  const valid = knownOn === 3 && onLines.size === 3 && cases.every((entry) => entry.options.some((option) => option.on));
  const over = knownOn - 3;
  let reason = null;
  if (over > 0) reason = over === 1 ? 'Untick one line' : `Untick ${over} lines`;
  else if (!valid) reason = 'Pick three lines';
  const linesNote = knownOn === 3 ? 'three, plus the one every lab keeps'
    : over > 0 ? `${knownOn} ticked: the spec keeps three, plus the one every lab keeps`
      : `${knownOn} of 3 picked, plus the one every lab keeps`;
  return {
    title: `The ${family} Model Spec`,
    kicker: `${first ? '' : `Version ${version + 1} · `}Draft by your Head of Safety · for ${family} ${next} onward`,
    lines,
    fixed: FIXED_LINE,
    cases,
    changes: changes.map((entry) => ({
      text: changeText(entry.change),
      source: sourceLabel(entry.source),
      when: storyDate(storyDayForTurn(entry.turn ?? 0)).label,
    })),
    valid,
    reason, // why "Adopt and train" is disabled, or null
    linesNote, // the hard constraints heading's side note
  };
}
