import { flawsLeft, polishForecast } from '../../sim/polish.js';
import { MONTH_NAMES, ROUND_DAYS, roundSpan, storyDate } from '../../sim/time.js';
import { ADVISOR_TITLE } from './events.js';

// What the player sees of keep-polishing (docs/superpowers/specs/2026-09-26-keep-polishing-publish-design.md §4).
export const FLAW_NAMES = { jailbreakWaiting: 'Jailbreaks waiting', hallucination: 'Confident wrong answers', sycophancy: 'Too eager to please' };
export const FLAW_SHORT = { jailbreakWaiting: 'jailbreaks', hallucination: 'wrong answers', sycophancy: 'too eager' };
// Each flaw's cost, in one advisor's own words (owner rule: consequences reach the player through characters).
export const FLAW_LINES = { // OWNER WRITES
  jailbreakWaiting: { who: 'safety', say: 'Jailbreakers will find it first.' },
  hallucination: { who: 'research', say: 'It cites cases that do not exist, with confidence.' },
  sycophancy: { who: 'policy', say: 'Users love it. Æon Review won’t.' },
};
const LANDED_DAYS = 3;

const shortDate = (day) => {
  const date = storyDate(Math.floor(day));
  return `${MONTH_NAMES[date.m - 1]} ${date.d}`;
};
const rivalName = (state, id) => state.rivals.find((rival) => rival.id === id)?.name ?? id;

export function polishStatus(model) {
  if (model.polishing?.paused) return 'polishing · paused';
  if (flawsLeft(model) > 0) return 'polishing · fixing flaws';
  return `polishing · polish ${Math.round(model.polish)}`;
}

export const showFlawBadge = (model) => Boolean(model?.polishing && (model.polishing.flaws.length + model.fixedFlaws.length) > 0);

export function flawRows(state) {
  const model = state.pendingModel;
  if (!model?.polishing) return [];
  const row = (flag, rowState, stateLabel, actions) => ({
    flag, name: FLAW_NAMES[flag], who: ADVISOR_TITLE[FLAW_LINES[flag].who], say: FLAW_LINES[flag].say, state: rowState, stateLabel, actions,
  });
  const rows = model.fixedFlaws.map((fixed) => row(fixed.flag, 'done', `fixed ${shortDate(fixed.day)}`, []));
  let working = true;
  for (const flaw of model.polishing.flaws) {
    if (flaw.leftIn) {
      rows.push(row(flaw.flag, 'left', 'left in', [{ action: 'fix', label: 'Fix it after all' }]));
    } else if (working) {
      working = false;
      rows.push(row(flaw.flag, 'work', 'being fixed', [{ action: 'leaveIn', label: 'Leave it in' }]));
    } else {
      rows.push(row(flaw.flag, 'next', 'next', [{ action: 'first', label: 'Work on this next' }, { action: 'leaveIn', label: 'Leave it in' }]));
    }
  }
  return rows;
}

// A rumor names the quarter of a round that holds the launch day, so the day itself is never shown.
export function rumorWindow(state, day) {
  let round = state.turn;
  while (roundSpan(round).end < day) round += 1;
  const { start, end } = roundSpan(round);
  const size = (end - start) / 4;
  const index = Math.min(3, Math.max(0, Math.ceil((day - start) / size) - 1));
  return { start: start + index * size, end: start + (index + 1) * size };
}

export function rivalRumor(state) {
  const polishing = state.pendingModel?.polishing;
  if (!polishing) return null;
  const landed = polishing.rivals.at(-1);
  if (landed && state.day - landed.day < LANDED_DAYS) return { kind: 'landed', name: rivalName(state, landed.id) };
  const next = [...(state.rivalLaunches ?? [])].sort((a, b) => a.day - b.day)[0];
  if (!next) return null;
  const window = rumorWindow(state, next.day);
  return { kind: 'rumor', name: rivalName(state, next.id), weeks: Math.max(1, Math.ceil((window.end - state.day) / 7)) };
}

export function rumorText(rumor) {
  if (!rumor) return '';
  if (rumor.kind === 'landed') return `${rumor.name} launched today · the critics’ bar just went up`;
  return `${rumor.name} launch rumored within ~${rumor.weeks} week${rumor.weeks === 1 ? '' : 's'}`;
}

// The calendar strip (option D): one scale from the day polishing began to the eighth coming bubble.
export function stripModel(state) {
  const model = state.pendingModel;
  const polishing = model?.polishing;
  if (!polishing) return null;
  const forecast = polishForecast(model, ROUND_DAYS[state.era], state.day, 8);
  const start = polishing.startedDay;
  const end = Math.max(state.day + 1, Math.ceil(forecast.at(-1)?.day ?? state.day + 1));
  const x = (day) => Math.min(1, Math.max(0, (day - start) / (end - start)));
  const size = (gain) => Math.min(30, Math.max(8, 8 + gain * 1.1));

  const blocks = [];
  let from = start;
  for (const fixed of model.fixedFlaws) {
    blocks.push({ x0: x(from), x1: x(fixed.day), label: `${FLAW_SHORT[fixed.flag]} ✓`, done: true });
    from = fixed.day;
  }
  for (const fix of forecast.filter((entry) => entry.type === 'fix')) {
    blocks.push({ x0: x(from), x1: x(fix.day), label: FLAW_SHORT[fix.flag], done: false });
    from = fix.day;
  }
  const bubbles = [
    ...polishing.bubbles.map((bubble) => ({ x: x(bubble.day), gain: bubble.gain, size: size(bubble.gain), past: true })),
    ...forecast.filter((entry) => entry.type === 'bubble').map((bubble) => ({ x: x(bubble.day), gain: bubble.gain, size: size(bubble.gain), past: false })),
  ];
  const landed = polishing.rivals.map((rival) => ({ x: x(rival.day), name: rivalName(state, rival.id) }));
  const windows = (state.rivalLaunches ?? [])
    .map((launch) => ({ launch, window: rumorWindow(state, launch.day) }))
    .filter(({ window }) => window.end > start && window.start < end)
    .map(({ launch, window }) => ({ x0: x(window.start), x1: x(window.end), name: rivalName(state, launch.id) }));
  const span = end - start;
  const step = span <= 45 ? 7 : span <= 100 ? 14 : 30;
  const ticks = [];
  for (let day = start; day <= end; day += step) ticks.push({ x: x(day), label: shortDate(day) });
  const leftIn = polishing.flaws.filter((flaw) => flaw.leftIn).map((flaw) => FLAW_NAMES[flaw.flag]);
  return {
    title: 'post-training',
    today: { x: x(state.day), label: `today · polish ${Math.round(model.polish)}` },
    blocks, bubbles, landed, windows, ticks, leftIn,
  };
}

export function polishIntro(state) { // OWNER WRITES
  const n = flawsLeft(state.pendingModel);
  const flaws = n === 0 ? '' : `: ${n === 1 ? 'one flaw' : `${n} flaws`} to fix first, then polish`;
  return `Training’s done. We’ll keep tuning it while you decide${flaws}. Publish whenever it’s ready.`;
}
