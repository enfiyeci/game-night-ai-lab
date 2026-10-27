import { warningResponse } from '../../sim/data/warningResponses.js';
import { EVENTS } from '../../sim/data/events.js';
import { EVENTS_6C } from '../../sim/data/events6c.js';
import { BOARD_EVENTS } from '../../sim/data/boardEvents.js';
import { REAL_EVENTS } from '../../sim/data/realEvents.js';
import { SCENARIO_EVENTS } from '../../sim/data/scenarioEvents.js';
import { DEFAULT_EVENT_TIMING, EVENT_TIMING } from '../../sim/data/eventTiming.js';
import { fallbackChoice } from '../../sim/events.js';
import {
  ARGUE, CONSEQUENCES, CRISIS_STAGING, DEFAULT_DUE, DUE, JOKES, REACTIONS, WARNING_ADVISOR, WARNING_SAY,
} from '../data/eventCopy.js';
import { money } from './format.js';

export const ADVISOR_TITLE = { research: 'Head of Research', safety: 'Head of Safety', cfo: 'CFO', policy: 'Policy and Comms' };
export const TAG_TO_ADVISOR = { Research: 'research', Safety: 'safety', CFO: 'cfo', Comms: 'policy' };
const ARGUE_ORDER = ['safety', 'research', 'cfo', 'policy'];
const DAYS_PER_MONTH = 30.44;

const ALL = [...EVENTS, ...EVENTS_6C, ...BOARD_EVENTS, ...REAL_EVENTS, ...SCENARIO_EVENTS];
const baseId = (id) => (id.startsWith('promiseCall:') ? 'promiseCall' : id);

export const catalogRow = (id) => ALL.find((event) => event.id === baseId(id));

export const lookIntoCost = (state, id) => warningResponse(id, state).cost;

const hasModelFlag = (state, flag) => state.models.some((model) => (model.flags ?? []).includes(flag));
// Which cause a warning with several names (eventCopy.js WARNING_SAY) is about.
const WARNING_CAUSE = {
  promise: (state) => (hasModelFlag(state, 'brokenPromise') ? 'waived' : 'pledge'),
  citations: (state) => (hasModelFlag(state, 'hallucination') ? 'reasoning' : 'quick'),
  whistleblower: (state) => (state.flags.coverUp ? 'coverup' : 'debt'),
};

// The advisor's line for a warning bubble; the post itself is only a fallback.
export function warningSay(state, id) {
  const written = WARNING_SAY[id];
  const line = typeof written === 'object' ? written[WARNING_CAUSE[id](state)] : written;
  const row = catalogRow(id);
  if (!line) return `Heads up: “${row?.warning?.text ?? ''}”`;
  return line.replace('{cost}', money(lookIntoCost(state, id)));
}

export function openWarnings(state, queued = []) {
  return Object.entries(state.warnings ?? {}).flatMap(([id, warned]) => {
    const row = catalogRow(id);
    if (!row?.warning || warned?.deferred || queued.includes(id)) return [];
    if (row.kind === 'internal' || row.kind === 'promise') return [];
    return [{ id, advisor: WARNING_ADVISOR[id] ?? 'policy', handle: row.warning.handle, text: row.warning.text, say: warningSay(state, id), response: warningResponse(id, state) }];
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
    kicker: pending.kicker ?? null,
    watching: pending.watching ?? [],
    choices: pending.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      cost: choice.cost === '—' ? 'nothing up front' : choice.cost,
      cashCost: choice.cashCost,
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

export const timingFor = (id) => ({
  ...(EVENT_TIMING[baseId(id)] ?? DEFAULT_EVENT_TIMING),
  due: DUE[baseId(id)] ?? DEFAULT_DUE,
});

export function formatStoryTime(days) {
  if (days < 1) return 'less than a day';
  if (days < 14) {
    const whole = Math.round(days);
    return whole === 1 ? '1 day' : `${whole} days`;
  }
  if (days < 60) return `about ${Math.round(days / 7)} weeks`;
  return `about ${Math.round(days / DAYS_PER_MONTH)} months`;
}

// Under week-by-week time (owner pick 1D) the sim gives each pending card landsAt and dueAt in
// story days, and state.day counts them. Without those fields (turns) every card is shown at
// once and has no deadline bar.
export const hasLanded = (pending, state) => !Number.isFinite(pending.landsAt)
  || !Number.isFinite(state.day) || state.day >= pending.landsAt;

export function daysLeft(pending, state) {
  if (!Number.isFinite(pending.dueAt) || !Number.isFinite(state.day)) return null;
  return Math.max(0, pending.dueAt - state.day);
}

export const dueText = (id, days) => timingFor(id).due.replace('{time}', formatStoryTime(days));

// After an answer (reward-loops O2): the advisor who backed the choice nods, or, with no backer, the first who argued
// against it grumbles. Tags without an advisor seat (Product) are skipped; the line turns with the story day.
export function reactionLine(view, choiceId, day = 0) {
  const choice = view.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return null;
  const seat = (tags) => tags.map((tag) => TAG_TO_ADVISOR[tag]).find(Boolean);
  const backer = seat(choice.backers ?? []);
  const role = backer ?? seat(choice.opposers ?? []);
  if (!role) return null;
  const kind = backer ? 'nod' : 'grumble';
  const lines = REACTIONS[role][kind];
  return { role, kind, say: lines[Math.abs(Math.trunc(day)) % lines.length] };
}

// What moved between two states, in the game's no-hidden-numbers style: direction words for the measures the player
// can see or the cards name, cash as a number. Hidden risks (safety debt, concealed risk, misuse) never show here.
const MOVED = [
  ['Public trust', (s) => s.publicTrust],
  ['Staff trust', (s) => s.staffTrust],
  ['Investors', (s) => (s.sentiment ?? 1) * 100],
  ['Washington', (s) => s.govFavor.us],
  ['The world', (s) => s.govFavor.intl],
  ['The board', (s) => s.board.reduce((sum, support) => sum + support, 0)], // all seats, so one director's move shows
  ['Race heat', (s) => s.raceHeat],
];
const usersOf = (s) => s.models.reduce((sum, model) => sum + (model.users ?? 0), 0);
const amount = (delta, little, plain) => (Math.abs(delta) < little ? 'a little' : Math.abs(delta) < plain ? '' : 'a lot');
const word = (delta, size) => [delta > 0 ? 'up' : 'down', size].filter(Boolean).join(' ');

export function movedLine(before, after) {
  const parts = [];
  for (const [label, measure] of MOVED) {
    const delta = measure(after) - measure(before);
    if (Math.abs(delta) >= 0.5) parts.push(`${label}: ${word(delta, amount(delta, 3, 8))}.`);
  }
  const users = usersOf(after) - usersOf(before);
  const share = Math.abs(users) / Math.max(1, usersOf(before));
  if (share >= 0.01) parts.push(`Users: ${word(users, amount(share, 0.05, 0.2))}.`);
  const cash = after.cash - before.cash;
  if (Math.abs(cash) >= 0.5) parts.push(`Cash: ${cash > 0 ? '+' : ''}${money(cash)}.`);
  return parts.join(' ');
}

// verdict(eventId, choiceId) gives the era recap's word for the choice (ui/logic/recap.js verdictOf, passed in so this
// file does not import the recap); stateBefore and stateAfter, for an answered card, add what moved.
export function consequenceLines({ before, answered, events, verdict = null, stateBefore = null, stateAfter = null }) {
  const auto = new Map(events.filter((event) => event.type === 'eventResolved' && event.auto).map((event) => [event.id, event.choiceId]));
  return before.flatMap((card) => {
    const handled = Object.hasOwn(answered, card.id);
    const choiceId = handled ? answered[card.id] : auto.get(card.id);
    if (!choiceId) return [];
    const choice = card.choices.find((candidate) => candidate.id === choiceId);
    const written = CONSEQUENCES[baseId(card.id)]?.[choiceId];
    const text = written ?? `${card.title}: it ended with “${choice?.label ?? choiceId}”.`;
    const said = verdict?.(baseId(card.id), choiceId);
    const moved = handled && stateBefore && stateAfter ? movedLine(stateBefore, stateAfter) : '';
    return [{ head: [handled ? 'Handled' : 'Nobody answered', said].filter(Boolean).join(' · '), ok: handled, text: [text, moved].filter(Boolean).join(' ') }];
  });
}

// Under real time the game answers a card at once (game.answerCard). With turns the answer waits
// in the queue for endTurn; game.setField replaces a whole field, so merge before writing.
export function queueAnswer(game, id, choiceId) {
  if (typeof game.answerCard === 'function') return game.answerCard(id, choiceId);
  game.setField('eventChoices', { ...(game.queue.eventChoices ?? {}), [id]: choiceId });
  return { ok: true };
}

export function queueLookInto(game, id) {
  const ids = game.queue.addressWarnings ?? [];
  if (!ids.includes(id)) game.setField('addressWarnings', [...ids, id]);
}

export function jokeFor(role, band, turn) {
  const lines = JOKES[role]?.[band];
  return lines?.length ? lines[turn % lines.length] : null;
}
