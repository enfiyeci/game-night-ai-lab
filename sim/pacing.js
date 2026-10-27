import { ERAS, eraById } from './data/eras.js';
import { MEETINGS } from './data/president.js';
import { boardVoteThisRound } from './board.js';
import { meetingDay } from './president.js';
import { SUMMIT_OPEN_DAY, summitOpensNow, summitPending } from './summit.js';
import { cashWarning, cashWarningCheckpoint } from './cashWarning.js';
import { clockSeconds, nextRoundDay, roundMarkDay } from './time.js';

// The pacing director (reward-loops O1, Arda's pick 2026-10-26): one rule set over everything that stops the clock.
// It keeps a ledger of the last minute's stops and only ever delays what it may move (scenario cards, other cards, the
// President's call by a few days, the cash warning's pause); the fixed beats (era change, board meeting, summit, the
// first training hazard, Geneva news) are counted and, where they can be predicted, looked ahead to. All targets are in
// seconds of running clock, so they hold for any era calendar. Targets, scaled from the research
// (docs/research/reward-loops/options.md, O1); each needs its before-and-after bot run.
export const CROWD_WINDOW_S = 30; // at most CROWD_MAX stops in any 30 s of clock
export const CROWD_MAX = 2;
export const RELAX_S = 30; // cards wait this long after a set piece (the options file says 30-45 s)
export const QUIET_S = 90; // after this long with no stop, decision or payoff, the next scenario card comes early
export const PRESIDENT_MAX_WAIT = 3; // story days the President's call may wait for a free day
const KEEP_S = 60; // the ledger forgets stops older than this

const DEAL_NEWS = (event) => ['dealBreakCaught', 'playerCaught', 'presidentAngry'].includes(event.type)
  || (event.type === 'dealCollapsed' && event.reason === 'noCoalition');
const PAYOFFS = ['runComplete', 'release', 'modelLive', 'usersMilestone', 'paidBack', 'tookFirst', 'lostFirst'];

export function ledger(state) {
  state.pacing ??= { stops: [], lastBeat: state.day ?? 0, cash: { checkpoint: 0, pause: null, folded: null, waitingSince: null }, summitNoted: false, hazardShown: false };
  return state.pacing;
}

const stopsOn = (state, day) => ledger(state).stops.filter((stop) => stop.day === day);

// A clock-stopping prompt on today's story day: once per kind per day, except cards, which each count. It also counts
// as a beat for the quiet backstop.
export function noteStop(state, kind, { setPiece = false, movable = false, forced = false } = {}) {
  const book = ledger(state);
  book.lastBeat = state.day;
  if (kind !== 'card' && book.stops.some((stop) => stop.day === state.day && stop.kind === kind)) return;
  book.stops.push({ day: state.day, kind, setPiece, movable, forced });
  const now = clockSeconds(state.day);
  book.stops = book.stops.filter((stop) => now - clockSeconds(stop.day) < KEEP_S);
}

// A player decision or a visible payoff: the quiet backstop counts from here.
export function noteBeat(state) {
  ledger(state).lastBeat = state.day;
}

export const quietFor = (state) => clockSeconds(state.day) - clockSeconds(ledger(state).lastBeat);

// The set pieces still to come that can be predicted from today: the era change at its last mark (none after the last
// era), the board meeting the day before a vote mark, the President's due calls, the summit's own opening day.
export function plannedSetPieces(state) {
  const pieces = [];
  const era = eraById(state.era);
  if (state.era < ERAS.at(-1).id) pieces.push({ kind: 'eraTransition', day: roundMarkDay(state, era.turns - state.turnInEra) });
  if (boardVoteThisRound(state)) pieces.push({ kind: 'boardMeeting', day: nextRoundDay(state) - 1 });
  if (!state.meeting) {
    for (const meeting of MEETINGS) {
      const day = meetingDay(meeting);
      if (!state.meetingsHeld.includes(meeting.id) && day >= state.day - PRESIDENT_MAX_WAIT) pieces.push({ kind: 'president', day: Math.max(day, state.day) });
    }
  }
  if (summitPending(state) && !ledger(state).summitNoted && state.dayInRound <= SUMMIT_OPEN_DAY) {
    pieces.push({ kind: 'summit', day: state.day - state.dayInRound + SUMMIT_OPEN_DAY });
  }
  return pieces.filter((piece) => piece.day >= state.day);
}

// May a movable stop open today? One per story day, after the day's mark if it has one; at most CROWD_MAX in any
// CROWD_WINDOW_S of clock, counting the set pieces ahead; and, for cards, not within RELAX_S after a set piece.
export function canLand(state, { relax = true } = {}) {
  const { stops } = ledger(state);
  const planned = plannedSetPieces(state);
  if (stops.some((stop) => stop.day === state.day) || planned.some((piece) => piece.day === state.day)) return false;
  // A round mark's day waits for the mark (a finished run's hazard, Geneva news, the era change); after it, it may land.
  if (nextRoundDay(state) === state.day) return false;
  const now = clockSeconds(state.day);
  if (relax && stops.some((stop) => stop.setPiece && now - clockSeconds(stop.day) < RELAX_S)) return false;
  const times = [...stops, ...planned].map((entry) => clockSeconds(entry.day)).concat(now).sort((a, b) => a - b);
  return times.every((start) => start > now || start <= now - CROWD_WINDOW_S
    || times.filter((t) => t >= start && t < start + CROWD_WINDOW_S).length <= CROWD_MAX);
}

// The President calls on the first free day from his own (`dueDay`): "the day after the hazard". He waits at most
// PRESIDENT_MAX_WAIT days and never past the day before his round's mark, where his call must still open. A call that
// opens after its round's first day lapses a round later, as any call opened mid-round does (sim/president.js).
export function presidentMayCall(state, dueDay) {
  if (state.day - dueDay >= PRESIDENT_MAX_WAIT || nextRoundDay(state) - state.day <= 1) return true;
  return stopsOn(state, state.day).length === 0
    && !plannedSetPieces(state).some((piece) => piece.kind !== 'president' && piece.day === state.day);
}

// Cards that are on screen with no landing day of their own (made between marks, or older saves) and any earlier card
// the director did not place: counted as fixed stops. A card landing today is placed by deferCrowdedCards
// (sim/events.js) later in the day's steps.
function noteLandedCards(state) {
  for (const card of state.pendingEvents) {
    if (card.paced || (Number.isFinite(card.landsAt) && card.landsAt >= state.day)) continue;
    card.paced = true;
    noteStop(state, 'card');
  }
}

// The cash warning's pause (sim/cashWarning.js). In the step that changes the era it folds into the era recap as its
// last line and does not stop the clock; on another crowded day (moving day after the recap was printed included) it
// waits, at most CROWD_WINDOW_S of clock, and never forced on a mark's day before the mark, which may change the era.
// The banner shows throughout.
function cashTick(state, events) {
  const { cash } = ledger(state);
  const warning = cashWarning(state);
  const next = cashWarningCheckpoint(cash.checkpoint, warning);
  if (!next.pause) {
    cash.checkpoint = next.checkpoint;
    cash.waitingSince = null;
    return;
  }
  if (events.some((event) => event.type === 'eraStart')) {
    cash.folded = { day: state.day, level: warning.level };
    cash.checkpoint = next.checkpoint;
    return;
  }
  cash.waitingSince ??= state.day;
  const forced = clockSeconds(state.day) - clockSeconds(cash.waitingSince) >= CROWD_WINDOW_S && nextRoundDay(state) !== state.day;
  if (!forced && !canLand(state, { relax: false })) return;
  cash.pause = { day: state.day, level: warning.level };
  cash.checkpoint = next.checkpoint;
  cash.waitingSince = null;
  noteStop(state, 'cash', { movable: true, forced });
}

// After a story day's steps or a player's actions: records the fixed stops and beats in `events` and the state, and
// decides the cash warning. Safe to call more than once a day.
export function paceDay(state, events = []) {
  if (state.ending) return;
  const book = ledger(state);
  for (const event of events) {
    if (event.type === 'eraStart') noteStop(state, 'eraTransition', { setPiece: true });
    else if (event.type === 'meetingDue') noteStop(state, 'president', { setPiece: true, movable: true });
    else if (event.type === 'summit') { book.summitNoted = true; noteBeat(state); } // the player opened it from the menu
    else if (DEAL_NEWS(event)) noteStop(state, 'dealNews');
    else if (PAYOFFS.includes(event.type)) noteBeat(state);
  }
  if (boardVoteThisRound(state) && nextRoundDay(state) - state.day === 1) noteStop(state, 'boardMeeting', { setPiece: true });
  if (summitOpensNow(state) && !state.meeting && !book.summitNoted) {
    book.summitNoted = true;
    noteStop(state, 'summit', { setPiece: true });
  }
  // The full hazard card shows only for a run's first trace (ui/logic/training.js); later ones wait under the HUD pill.
  const hazard = Boolean(state.pendingModel?.hazard);
  if (hazard && !book.hazardShown && !(state.flags.hazardsMet > 0)) noteStop(state, 'hazard');
  book.hazardShown = hazard;
  noteLandedCards(state);
  cashTick(state, events);
}
