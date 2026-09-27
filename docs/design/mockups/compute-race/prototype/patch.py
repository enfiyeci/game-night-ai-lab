p='sim/rivals.js'; s=open(p).read()
s=s.replace("import { BALANCE } from './balance.js';", """import { BALANCE } from './balance.js';
import { SIZE_UNITS, SIZE_CAP } from './recipe.js';
import { eraScale } from './data/compute.js';
export const RACE = process.env.RACE === '1';
const START_FLEET = { openbrain: 14, lodestar: 10, deepthink: 12, qilin: 11 };
const FRONTIER = (process.env.FRONTIER ?? '25,50,150,400,450').split(',').map(Number);
const EDGE = Number(process.env.EDGE ?? 6);
const BG = Number(process.env.BG ?? 0.25);
export const appetite = (r) => r.speed * (1.1 - 0.4 * r.caution);
export const rivalTarget = (state, r) => FRONTIER[state.era - 1] * appetite(r);
export const rivalSafety = (r) => 0.05 + 0.25 * r.caution;
export function rivalTraining(r) { return r.fleet * (1 - rivalSafety(r)) * 0.7; }
export function rivalSize(state, r) {
  const t = rivalTraining(r);
  let best = null;
  for (const size of ['small', 'medium', 'large', 'xl']) if (SIZE_UNITS[size] * eraScale(state.era) <= t && (size !== 'xl' || state.era >= 2)) best = size;
  return best;
}""",1)
s=s.replace("return RIVAL_TEMPLATES.map((r) => ({ ...r, progress: 0, releases: 0 }));","return RIVAL_TEMPLATES.map((r) => ({ ...r, progress: 0, releases: 0, fleet: START_FLEET[r.id], pipeline: [] }));")
s=s.replace("""export function rank(state) {
  return 1 + state.rivals.filter((r) => r.capability > state.capability).length;
}""","""export function rank(state) {
  if (!RACE) return 1 + state.rivals.filter((r) => r.capability > state.capability).length;
  const you = state.compute.online;
  return 1 + state.rivals.filter((r) => r.capability > state.capability + 0.5 || (Math.abs(r.capability - state.capability) <= 0.5 && r.fleet > you)).length;
}""")
old="""      const uncappedGain = (5 + rng.int(0, 4)) * (1 + 0.1 * state.era);"""
assert old in s
s=s.replace(old,"""      const roll = rng.int(0, 4);
      let uncappedGain = (5 + roll) * (1 + 0.1 * state.era);
      if (RACE) {
        const size = rivalSize(state, r);
        const align = 0.1 + 0.2 * r.caution;
        uncappedGain = size ? Math.max(0, (BALANCE.baseRunGain + SIZE_CAP[size] + EDGE + roll - 2) * (1 - 0.5 * align)) : 2;
        r.lastSize = size;
      }""")
s += """
export function rivalComputeTurn(state, rng, offers) {
  const events = [];
  for (const r of state.rivals) {
    r.pipeline = r.pipeline.filter((p) => { if (p.turn <= state.turn) { r.fleet += p.units; return false; } return true; });
  }
  const board = offers.filter((o) => ['verde', 'azuria', 'coreflame', 'spot', 'gulf', 'loi'].includes(o.supplier) && o.units);
  const order = [...state.rivals].filter((r) => !r.eastern).sort((a, b) => a.capability - b.capability);
  for (const r of order) {
    const pending = r.pipeline.reduce((s, p) => s + p.units, 0);
    const short = rivalTarget(state, r) - r.fleet - pending;
    if (short <= 0 || !board.length) continue;
    const pick = r.caution < 0.5 ? board.reduce((a, b) => (b.units > a.units ? b : a)) : board.reduce((a, b) => (Math.abs(b.units - short) < Math.abs(a.units - short) ? b : a));
    board.splice(board.indexOf(pick), 1);
    r.pipeline.push({ units: pick.units, turn: state.turn + Math.max(1, pick.arrivesIn ?? 1) });
    events.push({ type: 'rivalDeal', id: r.id, supplier: pick.supplier, units: pick.units });
  }
  for (const r of state.rivals) {
    const pending = r.pipeline.reduce((s, p) => s + p.units, 0);
    const short = rivalTarget(state, r) - r.fleet - pending;
    if (short > 0) r.pipeline.push({ units: Math.round(short * BG), turn: state.turn + 1 });
  }
  return events;
}
"""
open(p,'w').write(s)
p='sim/turn.js'; s=open(p).read()
a="import { rivalsTurn } from './rivals.js';"; assert a in s
s=s.replace(a,"import { rivalsTurn, rivalComputeTurn, RACE } from './rivals.js';")
a="      state.lastRivalReleases = rivalsTurn(state, rng);"; assert a in s
s=s.replace(a,"      if (RACE) for (const e of rivalComputeTurn(state, sideRng(state, 10), state.compute.offers)) events.push(e);\n"+a)
open(p,'w').write(s)
p='sim/queue.js'; s=open(p).read()
a="  q.last = { released: supply, rows: orders.map((o) => ({ ...o, got: got[o.lab] })) };"; assert a in s
s=s.replace(a, a+"\n  if (process.env.RACE === '1') for (const r of state.rivals) if (got[r.id]) r.pipeline.push({ units: got[r.id], turn: state.turn + 1 });")
open(p,'w').write(s)
print('patched')
