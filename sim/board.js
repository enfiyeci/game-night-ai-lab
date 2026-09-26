import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { clamp } from './util.js';

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
export const STAFF_LETTER_TRUST = 70;

// What updateBoard compares against: taken at the start of endTurn.
export function boardSnapshot(state) {
  return {
    arr: state.arr,
    capability: state.capability,
    cash: state.cash,
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
  add('sovereign', state.cash < before.cash * 0.7 ? -6 : 1);
  add('safety', state.compute.split.safety + 1e-9 >= eraById(state.era).targetSafetyShare ? 2 : -3);
  if (events.some((event) => event.type === 'hazardResolved' && event.choice === 'ignore')) add('safety', -8);
  add('candor', 1);
  if (before.concealedDebt - state.concealedDebt > 0.5) add('candor', -6);
  if (state.promises.filter((promise) => promise.leaked).length > before.leaked) add('candor', -6);
  if (state.flags.brokenPromise === true && !before.brokenPromise) add('candor', -8);
  add('security', state.security >= 60 ? 2 : state.security < 40 ? -3 : 0);
  if (state.govFavor.us > before.govUs) add('security', 1);
  else if (state.govFavor.us < before.govUs) add('security', -2);
  add('trustee', (state.publicTrust - 55) / 10);
  if (state.constitution.hardLines.length < before.hardLines) add('trustee', -8);
  state.board = b.map((s) => clamp(s, 0, 100));
}

export function boardVote(state) {
  const yes = state.board.filter((s) => s >= BALANCE.boardSupportLine).length;
  return { yes, passed: yes >= BALANCE.boardPassMembers };
}

// A vote that would remove you. Once per run, staff who trust you enough threaten to quit together and the board
// backs down (OpenAI, November 2023: 745 of 770 staff). It costs staff trust, and the board is only just on side.
export function holdVote(state) {
  const vote = boardVote(state);
  state.flags.lastBoardVote = { turn: state.turn, yes: vote.yes, passed: vote.passed };
  if (vote.passed || state.flags.staffLetterUsed || state.staffTrust < STAFF_LETTER_TRUST) return vote;
  state.flags.staffLetterUsed = true;
  state.flags.staffLetterPending = true; // endTurn announces it
  state.staffTrust -= 10;
  state.board = state.board.map((s) => Math.max(s, BALANCE.boardSupportLine));
  state.flags.lastBoardVote.reversedByStaff = true;
  return { ...boardVote(state), reversedByStaff: true };
}
