import { cardById, pickableCards, resolveCards, slotsFor } from '../../sim/recipe.js';
import { modelName, releaseModel, tierWord } from '../../sim/release.js';
import { createRng } from '../../sim/rng.js';
import { CHANNEL, PRICE_STANCE, REASONING, REVENUE_PER_USER, USAGE, margin, servingCost } from '../../sim/serving.js';
import { projectQueue } from './compute.js';

export const PRICE_STOPS = ['free', 'undercut', 'market', 'premium'];
export const PRICE_NAMES = { premium: 'Premium', market: 'Market', undercut: 'Undercut', free: 'Free tier' };
export const REASONING_STOPS = ['off', 'low', 'medium', 'high'];
export const REASONING_NAMES = { off: 'Off', low: 'Low', medium: 'Medium', high: 'High' };
export const CHANNEL_NAMES = { enterprise: 'API only', consumer: 'Consumer app and API', agent: 'API for agents', open: 'Open weights' };
export const SIZE_ORDER = ['small', 'medium', 'large', 'xl'];

const cardsFor = (state, picks) => resolveCards(state, 'release', picks);
const capitalise = (text = '') => (text ? text[0].toUpperCase() + text.slice(1) : '');

// The spec the release would ship with; mirrors sim/release.js releaseModel.
export function releaseSpec(state, picks, reasoning) {
  const model = state.pendingModel;
  const cards = cardsFor(state, picks);
  const spec = Object.assign({}, model?.spec ?? {}, ...cards.map((card) => card.effects.spec ?? {}));
  spec.reasoning = model?.spec?.reasoningCapable ? reasoning : 'off';
  const flags = new Set([...(model?.flags ?? []), ...cards.flatMap((card) => card.effects.flags ?? [])]);
  if (spec.channel === 'enterprise' && flags.has('agentic')) spec.channel = 'agent';
  return spec;
}

// Millions of tokens one user runs each month (the same product as in sim/serving.js servingCost).
export const tokensPerUser = (spec, era) => USAGE[era - 1] * CHANNEL[spec.channel] * REASONING[spec.reasoning ?? 'off'];

// What a customer pays per million tokens: the monthly revenue per user spread over their tokens.
export function pricePerMillion(spec, era, stance) {
  if (spec.channel === 'open') return null;
  return (REVENUE_PER_USER[spec.channel] * PRICE_STANCE[stance].rev) / tokensPerUser(spec, era);
}

// What serving costs the lab per million tokens at light load.
export function servingPerMillion(spec, era) {
  if (spec.channel === 'open') return null;
  return servingCost(spec, era, 0) / tokensPerUser(spec, era);
}

export const perMillion = (value) => `$${value.toFixed(2)}`;

export function shipDelay(state, picks) {
  return cardsFor(state, picks).reduce((sum, card) => sum + (card.cost.turns ?? 0), state.pendingModel?.releaseDelay ?? 0);
}

export const shipWords = (delay) => (delay === 0 ? 'this turn' : delay === 1 ? 'next turn' : `in ${delay} turns`);

// The picks with this card in its group's place (or added).
export function withCard(picks, card) {
  const next = picks.filter((id) => cardById(id)?.group !== card.group);
  return [...next, card.id];
}

export const canSkip = (state) => state.models.length > 0;
export const nextGeneration = (state, skip) => (state.models.at(-1)?.generation ?? 0) + 1 + (skip && canSkip(state) ? 1 : 0);

export function releaseDraft(state, remembered = {}) {
  const pickable = new Set(pickableCards(state, 'release').map((card) => card.id));
  const picks = [];
  const groups = new Set();
  for (const id of remembered.picks ?? []) {
    const card = cardById(id);
    if (!card || !pickable.has(id) || groups.has(card.group) || picks.length >= slotsFor(state, 'release')) continue;
    picks.push(id);
    groups.add(card.group);
  }
  return {
    picks,
    price: Object.hasOwn(PRICE_STANCE, remembered.price) ? remembered.price : 'market',
    reasoning: REASONING_STOPS.includes(remembered.reasoning) ? remembered.reasoning : 'off',
    family: typeof remembered.family === 'string' ? remembered.family : state.models.at(-1)?.family ?? '',
    skip: remembered.skip === true && canSkip(state),
    tierWords: Object.fromEntries(SIZE_ORDER.map((size) => [
      size,
      typeof remembered.tierWords?.[size] === 'string' ? remembered.tierWords[size] : tierWord(size, state.tierWords),
    ])),
  };
}

export function releasePayload(state, draft) {
  return {
    picks: [...draft.picks],
    price: draft.price,
    reasoning: state.pendingModel?.spec?.reasoningCapable ? draft.reasoning : 'off',
    family: draft.family.trim().slice(0, 24),
    generation: nextGeneration(state, draft.skip),
    tierWords: { ...draft.tierWords },
  };
}

// The queue as it stands before the release: an existing release keeps its place, so only the moves ahead of it count.
export function queueBeforeRelease(queue) {
  const moves = queue?.moves ?? [];
  const index = moves.findIndex((move) => move.type === 'release');
  return { ...(queue ?? {}), moves: index < 0 ? moves : moves.slice(0, index) };
}

export function releasePreview(state, queue, draft) {
  const projected = projectQueue(state, queueBeforeRelease(queue));
  const errors = [];
  if (!draft.family.trim()) errors.push('Type a family name for the model');
  if (!projected.pendingModel) errors.push('There is no finished model to release');
  const payload = releasePayload(projected, draft);
  const cash = cardsFor(projected, draft.picks).reduce((sum, card) => sum + (card.cost.cash ?? 0), 0);
  if (errors.length === 0) {
    const result = releaseModel(structuredClone(projected), payload, createRng(0));
    if (!result.ok) errors.push(capitalise(result.error));
  }
  return {
    ok: errors.length === 0,
    errors,
    cash,
    delay: shipDelay(projected, draft.picks),
    name: modelName({ family: payload.family || '…', generation: payload.generation, size: projected.pendingModel?.size ?? 'medium', tierWords: payload.tierWords }),
  };
}

const SAFETY_LINES = {
  'quick-eval': ['uneasy', 'Quick checks tell us almost nothing about a model this strong. Run the full evals.'],
  'eval-full': ['calm', 'Full evals first. At least we will know what we built.'],
  'eval-third': ['calm', 'An outside evaluator will catch what we miss. Worth the turn.'],
  'eval-gov': ['calm', 'A government test buys goodwill, even if they ask us to wait.'],
  waive: ['alarmed', 'We promised that threshold. Waiving it will not stay quiet.'],
};
const POLICY_LINES = {
  'channel-api': ['calm', 'API only keeps us out of the headlines for now.'],
  'channel-app': ['uneasy', 'Millions of users means millions of screenshots. Be ready.'],
  'channel-open': ['alarmed', 'Open weights have no recall button. Washington will ask about misuse.'],
  'channel-staged': ['calm', 'Staged is gentler: businesses first, the app next turn.'],
};

export function releaseOpinions(state, draft) {
  const cards = cardsFor(state, draft.picks);
  const evalCard = cards.find((card) => card.group === 'eval');
  const channelCard = cards.find((card) => card.group === 'channel');
  const spec = releaseSpec(state, draft.picks, draft.reasoning);
  const price = pricePerMillion(spec, state.era, draft.price);
  const serve = servingPerMillion(spec, state.era);
  const delay = shipDelay(state, draft.picks);
  const [safetyMood, safetyText] = SAFETY_LINES[evalCard?.id] ?? SAFETY_LINES['quick-eval'];
  const [policyMood, policyText] = POLICY_LINES[channelCard?.id] ?? POLICY_LINES['channel-api'];
  let cfo;
  if (price === null) cfo = { mood: 'calm', text: 'Open weights earn nothing directly, and they cost us nothing to serve.' };
  else if (price < serve) cfo = { mood: 'alarmed', text: `At this price we lose money on every token: ${perMillion(price)} in, ${perMillion(serve)} out.` };
  else cfo = { mood: 'calm', text: `We charge ${perMillion(price)} per million tokens and serving costs ${perMillion(serve)}.` };
  return [
    delay > 0
      ? { id: 'research', mood: 'uneasy', text: 'A slower launch gives the rivals a turn. Ship when we can.' }
      : { id: 'research', mood: 'eager', text: 'Ship it this turn. The rivals will not wait.' },
    { id: 'safety', mood: safetyMood, text: safetyText },
    { id: 'cfo', ...cfo },
    { id: 'policy', mood: policyMood, text: policyText },
  ];
}

// Owner pick 5B: all five rows count, safety included; no badge without an earlier flagship.
export function beatCount(launch) {
  const rows = launch?.benchmarks ?? [];
  if (rows.length === 0 || rows.every((row) => row.flagship == null)) return null;
  return { beaten: rows.filter((row) => row.flagship != null && row.shown > row.flagship).length, of: rows.length };
}

export function checkLabel(flags = []) {
  if (flags.includes('govEval')) return 'Government tested';
  if (flags.includes('thirdPartyEval')) return 'Third-party checked';
  if (flags.includes('fullEval')) return 'Internal evals';
  return 'Self-reported';
}

const revenuePerUser = (model) => REVENUE_PER_USER[model.channel] * PRICE_STANCE[model.priceStance].rev * (model.revenueMult ?? 1);

export function priceSheet(model, era) {
  if (model.channel === 'open') return { open: true };
  const spec = { ...model.spec, channel: model.channel };
  const tokens = tokensPerUser(spec, era);
  const revenue = revenuePerUser(model);
  const cost = model.servingCost > 0 ? model.servingCost : servingCost(spec, era, 0);
  return {
    open: false,
    charge: revenue / tokens,
    serve: cost / tokens,
    margin: margin(cost, revenue),
    channel: CHANNEL_NAMES[model.channel],
    thinking: REASONING_NAMES[spec.reasoning ?? 'off'],
    live: model.activeFromTurn <= model.releasedTurn,
  };
}

export const salesEstimate = (model) => (model.channel === 'open' ? 0 : (model.newUsers * revenuePerUser(model)) / 1e6);

// The flagship this launch was compared with: the earlier model whose score set the bar.
export const flagshipBefore = (state, model) => state.models.find((other) => other.releaseSequence !== model.releaseSequence && other.launchScore === model.bar);
