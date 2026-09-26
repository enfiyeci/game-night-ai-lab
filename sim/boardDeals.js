import { BALANCE } from './balance.js';
import { eraById } from './data/eras.js';
import { runway } from './economy.js';
import { BOARD_MEMBERS, boardVoteThisRound, seat } from './board.js';
import { clamp } from './util.js';

// One deal per director, from what moves them in updateBoard (spec §5.2). Judged at the next meeting.
export const DEALS = {
  growth: { text: 'Revenue up a fifth by the next meeting', kept: (state, deal) => state.arr >= 1.2 * deal.baseline.arr },
  financier: { text: 'A higher valuation by the next meeting', kept: (state, deal) => state.valuation > deal.baseline.valuation },
  sovereign: { text: 'A year of cash at the next meeting', kept: (state) => runway(state, 'planned') >= 12 },
  safety: { text: 'Safety compute at target by the next meeting', kept: (state) => state.compute.split.safety + 1e-9 >= eraById(state.era).targetSafetyShare },
  candor: { text: 'No hidden problems come out before the next meeting', kept: (state, deal) => (state.flags.candorHits ?? 0) <= deal.baseline.candorHits },
  security: { text: 'Security above 40 by the next meeting', kept: (state) => state.security >= 40 },
  trustee: { text: 'Public trust above 55 by the next meeting', kept: (state) => state.publicTrust >= 55 },
};

export const openDeal = (state, id) => (state.boardDeals ?? []).some((deal) => deal.member === id && deal.status === 'open');

// A broken deal costs that director for good: a drop now, and a cap updateBoard enforces for the rest of the run.
export function loseDirector(state, id) {
  state.boardLost = [...new Set([...(state.boardLost ?? []), id])];
  const i = seat(id);
  state.board[i] = clamp(Math.min(state.board[i] - BALANCE.boardLostDrop, BALANCE.boardLostCap), 0, 100);
}

export function makeBoardDeals(state, deals) {
  if (!Array.isArray(deals)) return { ok: false, error: 'board deals must be a list' };
  if (!boardVoteThisRound(state)) return { ok: false, error: 'deals are made in a board meeting' };
  const members = deals.map((deal) => deal?.member);
  if (members.some((id) => !Object.hasOwn(DEALS, id))) return { ok: false, error: 'unknown board member' };
  if (new Set(members).size !== members.length) return { ok: false, error: 'one deal per director per meeting' };
  if (members.some((id) => (state.boardLost ?? []).includes(id))) return { ok: false, error: 'that director no longer takes your calls' };
  if (members.some((id) => openDeal(state, id))) return { ok: false, error: 'that director already has a deal open' };
  state.boardDeals = state.boardDeals ?? [];
  for (const member of members) {
    const i = seat(member);
    state.board[i] = clamp(state.board[i] + BALANCE.boardDealBoost, 0, 100);
    state.boardDeals.push({
      member,
      kind: member,
      madeTurn: state.turn,
      baseline: { arr: state.arr, valuation: state.valuation, candorHits: state.flags.candorHits ?? 0 },
      status: 'open',
    });
  }
  return { ok: true };
}

// At the start of the next meeting's endTurn, before its vote. final: the run ended with deals open, so record the
// outcomes for the feed and end screen without moving anyone.
export function judgeBoardDeals(state, { final = false } = {}) {
  const events = [];
  for (const deal of state.boardDeals ?? []) {
    if (deal.status !== 'open' || deal.madeTurn >= state.turn) continue;
    const kept = DEALS[deal.member].kept(state, deal);
    deal.status = kept ? 'kept' : 'broken';
    events.push({ type: 'boardDealJudged', member: deal.member, kept });
    if (final) continue;
    if (kept) {
      const i = seat(deal.member);
      state.board[i] = clamp(state.board[i] + BALANCE.boardDealKept, 0, 100);
    } else {
      loseDirector(state, deal.member);
      if (deal.member !== 'candor') {
        const c = seat('candor');
        state.board[c] = clamp(state.board[c] - BALANCE.boardDealBrokenCandor, 0, 100);
      }
    }
  }
  return events;
}

export const dealText = (id) => DEALS[id]?.text ?? BOARD_MEMBERS.find((member) => member.id === id)?.name;
