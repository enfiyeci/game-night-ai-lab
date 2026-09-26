import { EVENTS } from '../../sim/data/events.js';
import { EVENTS_6C } from '../../sim/data/events6c.js';
import { fallbackChoice } from '../../sim/events.js';
import {
  ARGUE, CONSEQUENCES, CRISIS_STAGING, DEFAULT_TIMING, JOKES, TIMING, WARNING_ADVISOR,
} from '../data/eventCopy.js';

export const ADVISOR_TITLE = { research: 'Head of Research', safety: 'Head of Safety', cfo: 'CFO', policy: 'Policy and Comms' };
export const TAG_TO_ADVISOR = { Research: 'research', Safety: 'safety', CFO: 'cfo', Comms: 'policy' };
const ARGUE_ORDER = ['safety', 'research', 'cfo', 'policy'];
const DAYS_PER_MONTH = 30.44;

const ALL = [...EVENTS, ...EVENTS_6C];
const baseId = (id) => (id.startsWith('promiseCall:') ? 'promiseCall' : id);

export const catalogRow = (id) => ALL.find((event) => event.id === baseId(id));

// The sim charges 5 × era $M to address a warning (sim/events.js addressWarning).
export const lookIntoCost = (state) => 5 * state.era;

export function openWarnings(state, queued = []) {
  return Object.entries(state.warnings ?? {}).flatMap(([id, warned]) => {
    const row = catalogRow(id);
    if (!row?.warning || warned?.deferred || queued.includes(id)) return [];
    if (row.kind === 'internal' || row.kind === 'promise') return [];
    return [{ id, advisor: WARNING_ADVISOR[id] ?? 'policy', handle: row.warning.handle, text: row.warning.text }];
  });
}

export function cardView(pending) {
  const row = catalogRow(pending.id);
  const fallback = fallbackChoice(pending.id, pending);
  return {
    id: pending.id,
    title: pending.title,
    post: pending.post,
    crisis: Boolean(row?.crisis),
    staging: CRISIS_STAGING[pending.id] ?? null,
    choices: pending.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      cost: choice.cost === '—' ? 'nothing up front' : choice.cost,
      backers: choice.backers ?? [],
      opposers: choice.opposers ?? [],
      fallback: choice.id === fallback,
    })),
  };
}

// A card with written lines (the crises) uses only those; null keeps an advisor silent.
// Other cards get one line per advisor who backs a choice, built from the backer tags.
export function argueLines(view, limit = 3) {
  const written = ARGUE[baseId(view.id)];
  const lines = [];
  for (const role of ARGUE_ORDER) {
    if (written) {
      const line = written[role];
      if (!line) continue;
      const pick = line.pick ? view.choices.find((choice) => choice.id === line.pick)?.label ?? null : null;
      lines.push({ role, say: line.say, pick });
      continue;
    }
    const backed = view.choices.find((choice) => choice.backers.some((tag) => TAG_TO_ADVISOR[tag] === role));
    if (!backed) continue;
    lines.push({ role, say: `My vote: ${backed.label.toLowerCase()}.`, pick: backed.label }); // OWNER WRITES
  }
  return lines.slice(0, limit);
}

export const timingFor = (id) => TIMING[baseId(id)] ?? DEFAULT_TIMING;

export function formatStoryTime(days) {
  if (days < 1) return 'less than a day';
  if (days < 14) {
    const whole = Math.round(days);
    return whole === 1 ? '1 day' : `${whole} days`;
  }
  if (days < 60) return `about ${Math.round(days / 7)} weeks`;
  return `about ${Math.round(days / DAYS_PER_MONTH)} months`;
}

export function daysLeft({ timingDays, landedMonths, nowMonths, daysUntilRound }) {
  const own = timingDays - (nowMonths - landedMonths) * DAYS_PER_MONTH;
  return Math.max(0, Math.min(own, daysUntilRound));
}

export const dueText = (id, days) => timingFor(id).due.replace('{time}', formatStoryTime(days));

export function consequenceLines({ before, answered, events }) {
  const auto = new Map(events.filter((event) => event.type === 'eventResolved' && event.auto).map((event) => [event.id, event.choiceId]));
  return before.flatMap((card) => {
    const handled = Object.hasOwn(answered, card.id);
    const choiceId = handled ? answered[card.id] : auto.get(card.id);
    if (!choiceId) return [];
    const choice = card.choices.find((candidate) => candidate.id === choiceId);
    const written = CONSEQUENCES[baseId(card.id)]?.[choiceId];
    const text = written ?? `${card.title}: it ended with “${choice?.label ?? choiceId}”.`;
    return [{ head: handled ? 'Handled' : 'Nobody answered', ok: handled, text }];
  });
}

// game.setField replaces a whole field, so merge before writing.
export function queueAnswer(game, id, choiceId) {
  game.setField('eventChoices', { ...(game.queue.eventChoices ?? {}), [id]: choiceId });
}

export function queueLookInto(game, id) {
  const ids = game.queue.addressWarnings ?? [];
  if (!ids.includes(id)) game.setField('addressWarnings', [...ids, id]);
}

export function jokeFor(role, band, turn) {
  const lines = JOKES[role]?.[band];
  return lines?.length ? lines[turn % lines.length] : null;
}
