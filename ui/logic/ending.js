import { ENDINGS } from '../../sim/endings.js';
import { ADVISOR_PROFILES } from '../../sim/data/advisorLines.js';
import { runSummary } from './summary.js';

const ROLE = { research: 'Research', safety: 'Safety', cfo: 'CFO', policy: 'Policy' };
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
const word = (n) => WORDS[n] ?? String(n);
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const kindWords = (kind) => (kind === 'win' ? 'a win' : 'a failure');

// Where an advisor's average error sits on the reliable / mixed / misleading scale: the verdict thresholds
// in summary.js (0.5 and 1) fall on the thirds, and errors past 1.5 pin to the far end.
export const scalePosition = (meanError) => Math.min(96, Math.max(4, (meanError / 1.5) * 100));

function modelsLine(count, bestModel) {
  if (count === 0) return 'No models shipped.';
  if (count === 1) return bestModel ? `One model shipped: ${bestModel}.` : 'One model shipped.';
  return bestModel ? `${capital(word(count))} models shipped; the best was ${bestModel}.` : `${capital(word(count))} models shipped.`;
}

function stillMissing(locked) {
  if (locked.length === 0) return 'You have found every ending.';
  const wins = locked.filter((h) => h.kind === 'win').length;
  const fails = locked.length - wins;
  const parts = [wins && `${word(wins)} ${wins === 1 ? 'win' : 'wins'}`, fails && `${word(fails)} ${fails === 1 ? 'failure' : 'failures'}`].filter(Boolean);
  const stories = locked.length === 1 ? 'One story is' : `${capital(word(locked.length))} stories are`;
  return `${stories} still unwritten: ${parts.join(' and ')}.`;
}

// Everything the end-of-run screen shows, from the finished state and the endings collection (entries() after
// this run was recorded). newThisRun: this run saved the ending's first record. Model names can come from the
// player, so the screen must render every string as text.
export function endScreenModel(state, entries, { newThisRun = false } = {}) {
  const summary = runSummary(state);
  const ending = ENDINGS[state.ending] ?? { title: summary.title, text: '', kind: summary.kind };
  const foundById = new Map(entries.map((entry) => [entry.id, entry]));
  const headline = (id) => {
    const entry = foundById.get(id);
    const { kind, title } = ENDINGS[id];
    if (id === state.ending) {
      return { id, kind, found: true, title, isNew: newThisRun, meta: `this run · era ${state.era} · ${kindWords(kind)}` };
    }
    if (entry) return { id, kind, found: true, title, isNew: false, meta: `found in era ${entry.era ?? '?'} · ${kindWords(kind)}` };
    return { id, kind, found: false };
  };
  const ids = Object.keys(ENDINGS);
  const found = ids.filter((id) => id === state.ending || foundById.has(id));
  const headlines = [
    ...found.filter((id) => id === state.ending),
    ...found.filter((id) => id !== state.ending),
    ...ids.filter((id) => !found.includes(id) && ENDINGS[id].kind === 'win'),
    ...ids.filter((id) => !found.includes(id) && ENDINGS[id].kind !== 'win'),
  ].map(headline);
  const locked = headlines.filter((h) => !h.found);
  return {
    kicker: `Run over · era ${state.era}, turn ${state.turn}`,
    title: ending.title,
    kind: ending.kind,
    text: ending.text,
    modelsLine: modelsLine(summary.models, summary.bestModel),
    advisors: [...summary.advisors]
      .sort((a, b) => a.meanError - b.meanError)
      .map((a) => ({ id: a.id, name: ADVISOR_PROFILES[a.id]?.name ?? ROLE[a.id], role: ROLE[a.id], verdict: a.verdict, position: scalePosition(a.meanError) })),
    progress: { found: found.length, total: ids.length },
    headlines,
    footLine: stillMissing(locked),
  };
}
