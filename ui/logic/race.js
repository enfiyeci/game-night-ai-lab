// The race tab (compute race spec §3): who holds the frontier's compute, who can train what, and what lands at the
// round's end. Pure: reads the state, never changes it.
import { computeShares, rivalSize, rivalTraining } from '../../sim/rivals.js';
import { computeSlices } from '../../sim/split.js';
import { SIZES, SIZE_UNITS } from '../../sim/recipe.js';
import { SUPPLIERS, eraScale } from '../../sim/data/compute.js';
import { RUMOR_PROGRESS } from '../../sim/data/race.js';
import { roundWord } from '../../sim/time.js';
import { computeAmount } from './format.js';

export const SIZE_LABEL = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'XL' };
const sizesFor = (era) => SIZES.filter((size) => size !== 'xl' || era >= 2);
const unitsFor = (size, era) => SIZE_UNITS[size] * eraScale(era);

export function playerSize(state) {
  const free = computeSlices(state).training;
  return sizesFor(state.era).filter((size) => unitsFor(size, state.era) <= free).at(-1) ?? null;
}

function rivalWord(state, r) {
  if ((state.lastRivalReleases ?? []).some((release) => release.id === r.id)) return 'just launched';
  return r.progress > RUMOR_PROGRESS ? 'launch rumored soon' : 'quiet';
}

function rivalNote(state, r) {
  if (r.eastern) return 'home-made chips';
  if (r.caution >= 0.7) return 'careful: big safety share';
  return `about ${computeAmount(Math.round(rivalTraining(r)), state.era)} for training`;
}

function why(state) {
  const slices = computeSlices(state);
  const size = playerSize(state);
  const ladder = sizesFor(state.era);
  const start = size ? ladder.indexOf(size) + 1 : 0;
  const next = ladder.slice(start, start + 2);
  const opening = size ? `Why you only train ${SIZE_LABEL[size]}.` : "Why you can't train yet.";
  if (!next.length) return `You can train ${SIZE_LABEL[size]}, the largest size.`;
  const amount = (units) => computeAmount(Math.round(units), state.era);
  const needs = next.map((s) => `${SIZE_LABEL[s]} needs ${Math.round(unitsFor(s, state.era))} free`).join('; ');
  return `${opening} Your users take ${amount(slices.serving)} of your ${amount(slices.online)} and safety takes ${amount(slices.safety)}. ${needs}.`;
}

export function roundEndItems(state) {
  const name = (id) => state.rivals.find((r) => r.id === id)?.name;
  const card = (id) => state.compute.offers.find((o) => o.id === id);
  const label = (o) => `${SUPPLIERS[o.supplier].name}'s ${computeAmount(o.units, state.era)}`;
  const items = state.compute.offers.filter((o) => o.wantedBy).map((o) => {
    const fallback = card(o.fallback);
    const rival = name(o.wantedBy);
    const second = fallback ? ` Sign it first and ${rival} takes ${label(fallback)} instead.` : ` Sign it first and ${rival} goes without a board card this ${roundWord(state.era)}.`;
    return { id: o.wantedBy, name: rival, text: `${rival} signs ${label(o)}.${second}` };
  });
  const qilin = state.rivals.find((r) => r.eastern);
  if (qilin) items.push({ id: qilin.id, name: qilin.name, text: `${qilin.name} buys only home-made chips` });
  return items;
}

export function raceModel(state) {
  const shares = computeShares(state);
  const labs = [{ id: 'you', name: 'You' }, ...state.rivals.map((r) => ({ id: r.id, name: r.name }))];
  const free = computeSlices(state).training;
  const rows = [
    { id: 'you', name: 'You', you: true, score: state.capability, compute: state.compute.online,
      computeNote: `${computeAmount(Math.round(free), state.era)} free after users and safety`,
      size: SIZE_LABEL[playerSize(state)] ?? 'none yet', word: state.activeRun ? 'training now' : 'no run yet' },
    ...state.rivals.map((r) => ({ id: r.id, name: r.name, you: false, score: r.capability, compute: r.fleet,
      // A copy: rivalSize records lastSize on the rival, and this model must not change the state.
      computeNote: rivalNote(state, r), size: SIZE_LABEL[rivalSize(state, { ...r })] ?? 'none yet', word: rivalWord(state, r) })),
  ].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return {
    shares: labs.map((lab) => ({ ...lab, share: shares[lab.id], you: lab.id === 'you' })).sort((a, b) => b.share - a.share),
    rows,
    why: why(state),
    roundEnd: roundEndItems(state).map((item) => item.text),
  };
}
