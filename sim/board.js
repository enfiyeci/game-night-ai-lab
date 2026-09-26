import { BALANCE } from './balance.js';
import { ERAS, eraById } from './data/eras.js';
import { PROMISE_VOTE_BELOW } from './boardPromise.js';
import { clamp } from './util.js';
import { inDangerZone, runway } from './economy.js';

// Owner redesign 2026-09-26, from docs/research/lab-boards/real-lab-boards-2026-09-26.md: three money seats and four
// oversight seats, each a fictional composite of a real kind of director. Money alone cannot keep you in charge
// (a vote needs four of seven), but the three money seats plus the security hawk can: an unsafe lab that keeps
// the money flowing and Washington happy can survive its board.
export const BOARD_MEMBERS = [
  { id: 'growth', name: 'Growth investor', kind: 'money', cares: 'revenue growth' },
  { id: 'financier', name: 'Infrastructure financier', kind: 'money', cares: 'valuation and the build-out' },
  { id: 'sovereign', name: 'Sovereign fund', kind: 'money', cares: 'cash that lasts' },
  { id: 'safety', name: 'Safety chair', kind: 'oversight', cares: 'safety compute and what ships' },
  { id: 'candor', name: 'Candor watchdog', kind: 'oversight', cares: 'being told the truth' },
  { id: 'security', name: 'Security hawk', kind: 'oversight', cares: 'security and Washington' },
  { id: 'trustee', name: 'Mission trustee', kind: 'oversight', cares: 'public trust and the constitution' },
];
export const INITIAL_BOARD = [70, 65, 60, 65, 70, 60, 70];
export const seat = (id) => BOARD_MEMBERS.findIndex((member) => member.id === id);
export const STAFF_LETTER_TRUST = 65;

// What updateBoard compares against: taken at each round mark (state.roundStart), for the round that follows.
export function boardSnapshot(state) {
  return {
    arr: state.arr,
    valuation: state.valuation,
    concealedDebt: state.concealedDebt,
    govUs: state.govFavor.us,
    hardLines: state.constitution.hardLines.length,
    leaked: state.promises.filter((promise) => promise.leaked).length,
    brokenPromise: state.flags.brokenPromise === true,
  };
}

export function updateBoard(state, before, events = []) {
  const b = [...state.board];
  const add = (id, amount) => { b[seat(id)] += amount; };
  add('growth', state.arr > before.arr ? 3 : -4);
  add('financier', state.valuation > before.valuation ? 2 : -2);
  add('sovereign', inDangerZone(state) ? -3 : runway(state, 'planned') >= 12 ? 3 : 1);
  add('safety', state.compute.split.safety + 1e-9 >= eraById(state.era).targetSafetyShare ? 2 : -3);
  if (events.some((event) => event.type === 'hazardResolved' && event.choice === 'ignore')) add('safety', -8);
  const candorHit = (amount) => {
    add('candor', amount);
    state.flags.candorHits = (state.flags.candorHits ?? 0) + 1; // the candor deal is judged by this count
  };
  if (before.concealedDebt - state.concealedDebt > 0.5) candorHit(-6);
  if (state.promises.filter((promise) => promise.leaked).length > before.leaked) candorHit(-6);
  if (state.flags.brokenPromise === true && !before.brokenPromise) candorHit(-8);
  add('security', state.govFavor.us >= 60 ? 2 : state.govFavor.us < 45 ? -2 : 0);
  if (state.security < 35) add('security', -2);
  if (state.govFavor.us > before.govUs) add('security', 1);
  else if (state.govFavor.us < before.govUs) add('security', -2);
  add('trustee', (state.publicTrust - 55) / 10);
  if (state.constitution.hardLines.length < before.hardLines) add('trustee', -8);
  const lost = new Set(state.boardLost ?? []);
  state.board = b.map((s, i) => clamp(lost.has(BOARD_MEMBERS[i].id) ? Math.min(s, BALANCE.boardLostCap) : s, 0, 100));
}

export function boardVote(state) {
  const yes = state.board.filter((s) => s >= BALANCE.boardSupportLine).length;
  return { yes, passed: yes >= BALANCE.boardPassMembers };
}

// A pure hash of (seed, turn, seat): the staff's misread, an integer in [-4, 4]. Never draws from an rng, so reading
// the board cannot shift any later roll.
export function misread(state, i, turn = state.turn) {
  let h = (Math.imul((state.seed >>> 0) + 1, 2654435761) ^ Math.imul(turn + 1, 40503) ^ Math.imul(i + 1, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  const span = 2 * BALANCE.boardReadMisread + 1;
  return (h % span) - BALANCE.boardReadMisread;
}

// The order the UI reveals votes in: most certain first, the closest to the cut-off last (spec §6.4), by the read's
// centre. Passed to the UI as an order, never as numbers. turn: the round the player saw the read in (the gate vote
// runs after endTurn has moved the turn on).
export function voteOrder(state, turn = state.turn) {
  const distance = (i) => Math.abs(state.board[i] + misread(state, i, turn) - BALANCE.boardSupportLine);
  return BOARD_MEMBERS.map((_, i) => i).sort((a, b) => distance(b) - distance(a) || a - b);
}

// True when the round now being played will hold a vote (spec §5.3). Era 5's promise vote is a forecast: the promise
// is judged at that round's end, and a bad miss votes at once.
export function boardVoteThisRound(state) {
  if (state.ending) return false;
  // true (a missed promise) or 'emergency' (the boardRevolt card, sim/data/events6c.js). Under real time that card is
  // answered at once or resolves on its due day, never on a round mark (sim/events.js stampNewCards), so the flag is
  // set by the day before the mark that holds its vote.
  if (state.flags.boardVoteDue) return true;
  const era = eraById(state.era);
  const lastRound = state.turnInEra === era.turns - 1;
  if (era.boardVoteAtGate && lastRound) return true;
  const promise = state.boardPromise;
  return state.era === ERAS.length && lastRound && promise?.status === 'open' && promise.era === state.era
    && state.compute.online < PROMISE_VOTE_BELOW * promise.units;
}

// A vote that would remove you. Once per run, staff who trust you enough threaten to quit together and the board
// backs down (OpenAI, November 2023: 745 of 770 staff). It costs staff trust, and the board is only just on side.
// The record keeps each director's real vote, so the UI reveals what happened, never its own guess.
export function holdVote(state, kind = 'gate', turn = state.turn) {
  const vote = boardVote(state);
  if (state.flags.lastBoardVote) state.flags.prevBoardVote = state.flags.lastBoardVote;
  state.flags.boardVotesHeld = (state.flags.boardVotesHeld ?? 0) + 1;
  state.flags.lastBoardVote = {
    turn: state.turn,
    yes: vote.yes,
    passed: vote.passed,
    votes: state.board.map((s) => s >= BALANCE.boardSupportLine),
    kind,
    order: voteOrder(state, turn),
  };
  delete state.flags.boardLeak; // the leak lasts until the meeting
  if (vote.passed || state.flags.staffLetterUsed || state.staffTrust < STAFF_LETTER_TRUST) return vote;
  state.flags.staffLetterUsed = true;
  state.flags.staffLetterPending = true; // endTurn announces it
  state.staffTrust -= 10;
  state.board = state.board.map((s) => Math.max(s, BALANCE.boardSupportLine));
  state.flags.lastBoardVote.reversedByStaff = true;
  return { ...boardVote(state), reversedByStaff: true };
}
