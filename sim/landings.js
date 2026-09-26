import { createRng } from './rng.js';
import { roundSpan } from './time.js';

// FNV-1a over the seed and a key, so a landing day never draws from the game's shared random numbers.
function hashKey(seed, key) {
  let h = 2166136261;
  for (const ch of `${seed}:${key}`) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// A day inside `round` that has not passed yet; the round's mark day when the round is already over.
export function landingDay(state, key, round) {
  const { start, end } = roundSpan(round);
  const from = Math.max(start, state.day);
  if (from >= end) return end;
  return from + 1 + createRng(hashKey(state.seed ?? 1, key)).int(0, end - from - 1);
}

function stamp(state, item, round, key) {
  if (item.landsFor === round && item.landsDay != null) return;
  item.landsFor = round;
  item.landsDay = landingDay(state, key, round);
}

// Owner pick (2026-09-26): each thing lands in the round whose mark used to fire it, on a day inside that round.
// Lawsuits and promises fired at the mark ending round dueTurn; deliveries and sites at the mark ending arrivesTurn - 1.
export function stampLandings(state) {
  for (const c of state.legalCases) stamp(state, c, c.dueTurn, `legal:${c.source}:${c.cost}:${c.dueTurn}`);
  for (const p of state.promises) {
    if (p.source === 'president' && p.dueTurn != null) stamp(state, p, p.dueTurn, `promise:${p.meeting}:${p.id}`);
  }
  for (const p of state.compute.pipeline) stamp(state, p, p.arrivesTurn - 1, `pipeline:${p.id}:${p.arrivesTurn}`);
  for (const s of state.power.sites) if (!s.online) stamp(state, s, s.arrivesTurn - 1, `site:${s.id}`);
}
