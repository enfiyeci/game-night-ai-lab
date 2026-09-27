// The race tab (compute race spec §3): who holds the frontier's compute, who can train what, and what lands at the
// round's end. Pure: reads the state, never changes it.
import { computeShares, rivalSize, rivalTraining } from '../../sim/rivals.js';
import { computeSlices } from '../../sim/split.js';
import { SIZES, SIZE_UNITS } from '../../sim/recipe.js';
import { SUPPLIERS, eraScale } from '../../sim/data/compute.js';
import { RUMOR_PROGRESS } from '../../sim/data/race.js';
import { takeTargets } from '../../sim/rivalDeals.js';
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
  // Not rounded to whole units: computeAmount keeps one decimal, so a small slice never reads as 0.
  const amount = (units) => computeAmount(units, state.era);
  const needs = next.map((s) => `${SIZE_LABEL[s]} needs ${amount(unitsFor(s, state.era))} free`).join('; ');
  // Every slice computeSlices takes before training is named, so the numbers add up to what is online.
  const parts = [
    ['Your users take', slices.serving],
    ['Monitors take', slices.control],
    ['Safety takes', slices.safety],
  ].filter(([label, units]) => label === 'Safety takes' || amount(units) !== amount(0))
    .map(([label, units], i) => (i ? `${label.toLowerCase()} ${amount(units)}` : `${label} ${amount(units)} of your ${amount(slices.online)}`));
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0];
  const taken = `${list}, leaving ${amount(slices.training)} free.`;
  return `${opening} ${taken} ${needs}.`;
}

// What rivals will really take at the round's end, from the board as shown (a projection may already have removed
// cards the player queued). Runs the sim's own takeTargets on a copy; without, when given, is a card the player
// signs first. No dice, so this is exactly what the round mark will do.
export function plannedTakes(state, without = null) {
  const copy = {
    turn: state.turn,
    raceHeat: state.raceHeat ?? 0,
    compute: { offers: structuredClone(state.compute.offers.filter((o) => o.id !== without)) },
    rivals: structuredClone(state.rivals),
  };
  const plans = new Map(copy.rivals.map((r) => [r.id, r.named]));
  return takeTargets(copy).map((event) => {
    const plan = plans.get(event.id);
    const offerId = event.fallback ? plan.fallback : plan.offerId;
    return { ...event, offerId, offer: state.compute.offers.find((o) => o.id === offerId) };
  });
}

// What the rival takes instead if the player signs the card it is about to take.
export function ifSignedFirst(state, take) {
  return plannedTakes(state, take.offerId).find((other) => other.id === take.id) ?? null;
}

export function roundEndItems(state) {
  const name = (id) => state.rivals.find((r) => r.id === id)?.name;
  const label = (o) => `${SUPPLIERS[o.supplier].name}'s ${computeAmount(o.units, state.era)}`;
  const items = plannedTakes(state).map((take) => {
    const rival = name(take.id);
    const instead = ifSignedFirst(state, take);
    const second = instead
      ? ` Sign it first and ${rival} takes ${label(instead.offer)} instead.`
      : ` Sign it first and ${rival} goes without a board card this ${roundWord(state.era)}.`;
    const signs = `${rival} signs ${label(take.offer)}${take.fallback ? ', its second choice' : ''}.`;
    return { id: take.id, name: rival, offerId: take.offerId, second: take.fallback, text: `${signs}${second}` };
  });
  const qilin = state.rivals.find((r) => r.eastern);
  if (qilin) items.push({ id: qilin.id, name: qilin.name, offerId: null, second: false, text: `${qilin.name} buys only home-made chips.` });
  return items;
}

export function raceModel(state) {
  const shares = computeShares(state);
  const labs = [{ id: 'you', name: 'You' }, ...state.rivals.map((r) => ({ id: r.id, name: r.name }))];
  const free = computeSlices(state).training;
  const rows = [
    { id: 'you', name: 'You', you: true, score: state.capability, compute: state.compute.online,
      computeNote: `${computeAmount(free, state.era)} free after monitors, users and safety`,
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
