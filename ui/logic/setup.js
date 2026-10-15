// The words and numbers of the pre-game setup (owner pick SB, 2026-10-14; ui/screens/setup.js draws them): four
// résumé steps, one per seat, then the CFO's use-of-funds memo that sets the first year's budget split.
import { CANDIDATES, LEADS, SEATS, lead } from '../../sim/leads.js';
import { projectBurn, runway } from '../../sim/economy.js';
import { budgetFromSliders, budgetPreviewQueue, levelFor } from './actions.js';
import { projectQueue } from './compute.js';
import { money, months } from './format.js';

export const SEAT_NAMES = { research: 'Head of Research', safety: 'Head of Safety', cfo: 'CFO', policy: 'Policy and Comms' };
const SEAT_SHORT = { research: 'Research', safety: 'Safety', cfo: 'Finance', policy: 'Policy' };
// The memo's four rows: the budget split's keys in the budget dialog's order and colours (ui/screens/budget.js).
export const MEMO_ROWS = [
  { key: 'training', label: 'Training', colour: 'var(--coral)' },
  { key: 'security', label: 'Security', colour: 'color-mix(in oklab, var(--ink) 55%, var(--paper))' },
  { key: 'product', label: 'Product', colour: 'var(--wood)' },
  { key: 'talent', label: 'Talent', colour: 'var(--teal)' },
];
// The CFO's handwritten line under the memo, in their own voice.
const CFO_NOTES = {
  margot: 'You can change this later. You can’t un-spend it.',
  rafael: 'Spend it like there is a next round. There will be.',
};

// One résumé step: the seat, its two candidates (today's lead first) and the footer line.
export function resumeStep(state, index) {
  const seat = SEATS[index];
  const done = SEATS.slice(0, index).map((s) => `${lead(state, s).name} for ${SEAT_SHORT[s]}`);
  const already = done.length === 0 ? ''
    : done.length === 1 ? ` · ${done[0].replace(' for ', ' already hired for ')}`
      : ` · already hired: ${done.slice(0, -1).join(', ')} and ${done.at(-1)}`;
  return {
    seat,
    title: SEAT_NAMES[seat],
    candidates: CANDIDATES[seat].map((id) => LEADS[id]),
    foot: `${index + 1} of ${SEATS.length} · ${SEAT_NAMES[seat]}${already}`,
  };
}

// The memo: who sends it, the seed money, the four shares and the runway the game's own projector gives that split.
// values are the four marks (0-100 each, as the budget dialog's sliders); the shares are their normalised split.
export function memoModel(state, values, queue = {}) {
  const cfo = lead(state, 'cfo');
  const budget = budgetFromSliders(values, levelFor(state.budget.spend, state.era), state.era);
  const projected = projectQueue(state, budgetPreviewQueue(queue, { budget, computeSplit: state.compute.split, pledge: null, canPledge: false }));
  projected.burnPlanned = projectBurn(projected);
  return {
    from: `${cfo.name}, ${cfo.title}`,
    seed: money(state.cash),
    runway: months(runway(projected, 'planned')),
    budget,
    rows: MEMO_ROWS.map((row) => ({ ...row, value: values[row.key], share: Math.round((budget.split[row.key] ?? 0) * 100) })),
    note: `“${CFO_NOTES[cfo.id]}” — ${cfo.first[0]}.`,
  };
}

// The four marks where the budget split stands now (the default 50 / 10 / 20 / 20).
export const startValues = (state) => Object.fromEntries(MEMO_ROWS.map(({ key }) => [key, Math.round((state.budget.split[key] ?? 0) * 100)]));
