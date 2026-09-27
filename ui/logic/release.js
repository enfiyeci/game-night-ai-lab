import { roundsToWords } from './format.js';
import { cardById, pickableCards, resolveCards, slotsFor } from '../../sim/recipe.js';
import { modelName, releaseModel, releaseWait, tierWord } from '../../sim/release.js';
import { createRng } from '../../sim/rng.js';
import { scoreOnTest, testScore } from '../../sim/launch.js';
import { CHANNEL, ERA_PRICE, PRICE_STANCE, REASONING, REVENUE_PER_USER, USAGE, margin, servingCost } from '../../sim/serving.js';
import { revenuePerUser } from '../../sim/economy.js';
import { applyProjectedMove, projectQueue } from './compute.js';
import { familyName } from './naming.js';

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
  return (REVENUE_PER_USER[spec.channel] * PRICE_STANCE[stance].rev * ERA_PRICE[era - 1]) / tokensPerUser(spec, era);
}

// What serving costs the lab per million tokens at light load.
export function servingPerMillion(spec, era) {
  if (spec.channel === 'open') return null;
  return servingCost(spec, era, 0) / tokensPerUser(spec, era);
}

export const perMillion = (value) => `$${value.toFixed(2)}`;

export function shipDelay(state, picks) {
  return releaseWait(state, cardsFor(state, picks));
}

// A ship delay counts hidden rounds; say it in story time for the current era.
export const shipWords = (delay, era = 1) => (delay === 0 ? 'right away' : `in ${roundsToWords(era, delay)}`);

// The picks with this card in its group's place (or added).
export function withCard(picks, card) {
  const next = picks.filter((id) => cardById(id)?.group !== card.group);
  return [...next, card.id];
}

export const canSkip = (state) => state.models.length > 0;
export const nextGeneration = (state, skip) => (state.models.at(-1)?.generation ?? 0) + 1 + (skip && canSkip(state) ? 1 : 0);

// Owner 2026-09-26: open weights are off for now (no revenue model yet); hidden cards are not offered in the UI.
export const offeredCards = (state, stage) => pickableCards(state, stage).filter((card) => !card.hidden);

export function releaseDraft(state, remembered = {}) {
  const pickable = new Set(offeredCards(state, 'release').map((card) => card.id));
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
    family: typeof remembered.family === 'string' ? remembered.family : familyName(state),
    skip: remembered.skip === true && canSkip(state),
    tierWords: Object.fromEntries(SIZE_ORDER.map((size) => [
      size,
      typeof remembered.tierWords?.[size] === 'string' ? remembered.tierWords[size] : tierWord(size, state.tierWords),
    ])),
  };
}

export function releasePayload(state, draft) {
  const spec = releaseSpec(state, draft.picks, draft.reasoning);
  return {
    picks: [...draft.picks],
    // Open weights are a free download; the price slider's stance would otherwise still tag
    // along and mislabel the launch (see sim/data/launch.js, sim/economy.js).
    price: spec.channel === 'open' ? 'market' : draft.price,
    reasoning: state.pendingModel?.spec?.reasoningCapable ? draft.reasoning : 'off',
    family: draft.family.trim().slice(0, 24),
    generation: nextGeneration(state, draft.skip),
    tierWords: { ...draft.tierWords },
    ...(draft.breakDeal === true && { breakDeal: true }),
  };
}

// The queue as it stands before the release: an existing release keeps its place, so only the moves ahead of it count.
export function queueBeforeRelease(queue) {
  const moves = queue?.moves ?? [];
  const index = moves.findIndex((move) => move.type === 'release');
  return { ...(queue ?? {}), moves: index < 0 ? moves : moves.slice(0, index) };
}

// Every move queued after the release must still work after the release changes, whatever its type.
// Returns the failing move's error, or '' (a move that already failed before the edit is ignored).
export function laterMoveProblem(state, before, after) {
  const afterMoves = after?.moves ?? [];
  const releaseIndex = afterMoves.findIndex((move) => move.type === 'release');
  if (releaseIndex < 0) return '';
  const beforeMoves = before?.moves ?? [];
  for (let index = releaseIndex + 1; index < afterMoves.length; index += 1) {
    const move = afterMoves[index];
    const projected = projectQueue(state, { ...after, moves: afterMoves.slice(0, index) });
    const result = applyProjectedMove(structuredClone(projected), move, after);
    if (result && result.ok === false) {
      const beforeMove = beforeMoves[index];
      let failedBefore = false;
      if (beforeMove) {
        const projectedBefore = projectQueue(state, { ...before, moves: beforeMoves.slice(0, index) });
        const beforeResult = applyProjectedMove(structuredClone(projectedBefore), beforeMove, before);
        failedBefore = Boolean(beforeResult && beforeResult.ok === false);
      }
      if (!failedBefore) return result.error ?? 'a queued move would no longer work';
    }
  }
  return '';
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
  'eval-third': ['calm', 'An outside evaluator will catch what we miss. Worth the wait.'],
  'eval-gov': ['calm', 'A government test buys goodwill, even if they ask us to wait.'],
  waive: ['alarmed', 'We promised that threshold. Waiving it will not stay quiet.'],
};
const POLICY_LINES = {
  'channel-api': ['calm', 'API only keeps us out of the headlines for now.'],
  'channel-app': ['uneasy', 'Millions of users means millions of screenshots. Be ready.'],
  'channel-open': ['alarmed', 'Open weights have no recall button. Washington will ask about misuse.'],
  'channel-staged': ['calm', 'Staged is gentler: businesses first, the app a little later.'],
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
      ? { id: 'research', mood: 'uneasy', text: 'A slower launch gives the rivals an opening. Ship when we can.' }
      : { id: 'research', mood: 'eager', text: 'Ship it now. The rivals will not wait.' },
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
    live: model.servingCost > 0,
  };
}

export const salesEstimate = (model) => (model.channel === 'open' ? 0 : (model.newUsers * revenuePerUser(model)) / 1e6);

// The flagship this launch was compared with.
export const flagshipBefore = (state, model) => state.models.find((other) => other.releaseSequence !== model.releaseSequence && other.name === model.flagshipName);

export const oneDecimal = (value) => Math.round(value * 10) / 10;

// The launch leaderboard (owner pick 2026-09-26: reveal option B plus the leaderboard climb).
// Scores are averages of the four capability benchmarks on this launch's tests. The sim scores the "best rival"
// bars from the leading lab, so the leader's row is those bars; another lab's score on each test moves from the
// leader's by what its own capability would score there. Your two latest earlier models are re-scored on this
// launch's tests (scoreOnTest).
export function leaderboard(state, model) {
  const caps = model.launch.benchmarks.filter((row) => row.kind === 'cap');
  const leader = state.rivals.reduce((best, rival) => (rival.capability > best.capability ? rival : best));
  const on = (row, capability) => testScore(row.mid, capability * row.fit * 0.95);
  const labScore = (rival) => caps.reduce((sum, row) => sum
    + Math.min(100, Math.max(0, row.rival + on(row, rival.capability) - on(row, leader.capability))), 0) / caps.length;
  const ownScore = (other) => caps.reduce((sum, row) => sum
    + scoreOnTest(row, other.launch.benchmarks.find((before) => before.id === row.id)), 0) / caps.length;
  const rivals = state.rivals.map((rival) => ({ name: rival.name, kind: 'rival', score: oneDecimal(labScore(rival)) }));
  const own = state.models
    .map((other, index) => ({ other, order: other.releaseSequence ?? index }))
    .filter(({ other }) => other.releaseSequence !== model.releaseSequence && other.launch)
    .sort((a, b) => a.order - b.order)
    .slice(-2)
    .map(({ other }) => ({ name: other.name, kind: 'own', score: oneDecimal(ownScore(other)) }));
  return {
    leader: leader.name,
    rows: [...rivals, ...own].sort((a, b) => b.score - a.score),
    mine: { name: model.name, kind: 'new', score: oneDecimal(model.launch.capAvg) },
  };
}
