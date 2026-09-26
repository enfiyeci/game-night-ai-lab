import { BALANCE } from './balance.js';
import { BOARD_MEMBERS, misread } from './board.js';
import { openDeal } from './boardDeals.js';
import { clamp } from './util.js';

// The leak (board event) clouds the read from the moment its card lands; answering it ends that, and ignoring it
// sets flags.boardLeak, which lasts until the meeting (holdVote clears it).
export const leakActive = (state) => Boolean(state.flags.boardLeak) || state.pendingEvents.some((pending) => pending.id === 'boardLeak');

// What the player's staff think each director's support is (spec §5.1): a band, wrong by a stable misread, wider
// when the director is hard to read. The cut-off is used only here, to name each lean; the UI never receives it.
export function boardRead(state) {
  const line = BALANCE.boardSupportLine;
  const last = state.boardLast ?? state.board;
  const everyone = (leakActive(state) ? BALANCE.boardReadLeak : 0) + (state.flags.boardQuiet === state.turn ? BALANCE.boardReadQuiet : 0);
  const members = BOARD_MEMBERS.map((member, i) => {
    const support = state.board[i];
    const centre = support + misread(state, i);
    let spread = BALANCE.boardReadSpread + everyone;
    if (Math.abs(support - last[i]) >= 3) spread += BALANCE.boardReadMoved;
    if (member.id === 'candor') spread += BALANCE.boardReadCandor;
    if (openDeal(state, member.id)) spread += BALANCE.boardReadDeal;
    const lo = clamp(Math.round(centre - spread), 0, 100);
    const hi = clamp(Math.round(centre + spread), 0, 100);
    const lean = lo >= line ? 'with' : hi < line ? 'against' : centre >= line ? 'leanWith' : 'leanAway';
    return { id: member.id, lo, hi, lean };
  });
  const sure = members.filter((member) => member.lean === 'with').length;
  const against = members.filter((member) => member.lean === 'against').length;
  const maybe = members.length - sure - against;
  return { members, tally: { sure, maybe, against, lo: sure, hi: sure + maybe } };
}
