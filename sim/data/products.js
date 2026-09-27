import { eraById } from './eras.js';

// Model appeal (spec docs/superpowers/specs/2026-09-26-model-appeal-design.md). Starting numbers; the bot runs size
// them. Chat and business keep today's consumer and enterprise numbers; the new products match chat's base revenue.
export const PRODUCTS = {
  chat: { name: 'Chat app', opens: { era: 1, lastRound: false }, users: 4e6, price: 5, tokens: 1, channel: 'consumer' },
  business: { name: 'Business assistant', opens: { era: 1, lastRound: false }, users: 5e5, price: 30, tokens: 4, channel: 'enterprise' },
  coding: { name: 'Coding tool', opens: { era: 1, lastRound: true }, users: 5e5, price: 40, tokens: 6, channel: 'enterprise' },
  agent: { name: 'Autonomous agent', opens: { era: 2, lastRound: true }, users: 5e4, price: 400, tokens: 20, channel: 'agent' },
  science: { name: 'Science partner', opens: { era: 3, lastRound: true }, users: 5e3, price: 4000, tokens: 40, channel: 'enterprise', govUs: 2 },
};
export const PRODUCT_IDS = Object.keys(PRODUCTS);
export const DEFAULT_PRODUCT = 'business';
export const CHANNEL_FALLBACK = { consumer: 'chat', enterprise: 'business', agent: 'agent' };

// The hot product per era (index = era); announced, and pickable, from the last round of the era before.
export const WAVE = [null, 'chat', 'coding', 'agent', 'science', 'agent'];
export const WAVE_USERS = 1.6;
// Launch-user and growth multiplier by the number of rivals in a product.
export const CROWDING = [1, 0.8, 0.65, 0.55, 0.5];
export const FIRST_MOVER = { users: 1.1, growth: 1.1, featureExcessCut: 0.25 };
export const FIT_USERS = { base: 0.7, span: 0.6 };
export const FEATURE_FIT = 0.1;
export const FOCUS_SIGNAL_MIN = 0.1;
export const FEATURE_SLOTS = 2;

// Rivals move to their product at the start of each era (spec section 7).
export const RIVAL_RULES = {
  openbrain: (era) => WAVE[era],
  lodestar: (era) => (era >= 4 ? 'science' : 'business'),
  deepthink: (era) => (era >= 4 ? 'science' : era >= 2 ? 'coding' : 'chat'),
  qilin: (era) => (era >= 3 ? 'coding' : 'chat'),
};

const LAST_ERA = WAVE.length - 1;
const clampEra = (era) => Math.max(1, Math.min(era, LAST_ERA));

export const productOf = (model) => model?.product ?? model?.spec?.product
  ?? CHANNEL_FALLBACK[model?.channel ?? model?.spec?.channel] ?? DEFAULT_PRODUCT;

export function productPickable(state, id) {
  if (!Object.hasOwn(PRODUCTS, id)) return false;
  const product = PRODUCTS[id];
  const { era, lastRound } = product.opens;
  if (state.era !== era) return state.era > era;
  return !lastRound || state.turnInEra >= eraById(era).turns - 1;
}

export const pickableProducts = (state) => PRODUCT_IDS.filter((id) => productPickable(state, id));
export const waveProduct = (era) => WAVE[clampEra(era)];
export const rivalProduct = (rivalId, era) => RIVAL_RULES[rivalId]?.(clampEra(era)) ?? null;
export const rivalsIn = (state, product, era = state.era) =>
  state.rivals.filter((rival) => rivalProduct(rival.id, era) === product).map((rival) => rival.id);
export const crowding = (state, product, era = state.era) =>
  CROWDING[Math.min(rivalsIn(state, product, era).length, CROWDING.length - 1)];

export const holdsFirst = (state, kind, key, lab) => Boolean(state.firsts?.[kind]?.[key]?.labs.includes(lab));

// The first lab to go live in a product or with a release feature; labs live in the same round share it.
export function claimFirsts(state, lab, product, featureIds = []) {
  const firsts = (state.firsts ??= { products: {}, features: {} });
  const claim = (table, key) => {
    const entry = table[key];
    if (!entry) table[key] = { labs: [lab], turn: state.turn };
    else if (entry.turn === state.turn && !entry.labs.includes(lab)) entry.labs.push(lab);
  };
  if (product) claim(firsts.products, product);
  for (const id of featureIds) claim(firsts.features, id);
}

// What each product wants from the recipe (spec section 4). `cards`: any of these ids; `group`: any non-default card
// of the group except `except`; `focus`: that stage's slider `index` at least FOCUS_SIGNAL_MIN of share above its start;
// `size`: one of these sizes. Release-stage cards count when picked at release.
export const FIT_PROFILES = {
  chat: [
    { kind: 'group', group: 'character', w: 0.25, label: 'character training' },
    { kind: 'group', group: 'feedback', except: ['thumbs'], w: 0.2, label: 'a feedback method other than thumbs-up' },
    { kind: 'cards', ids: ['multimodal'], w: 0.2, label: 'image understanding' },
    { kind: 'focus', stage: 'post', index: 1, w: 0.15, label: 'values time in post-training' },
    { kind: 'cards', ids: ['multilingual'], w: 0.1, label: 'many languages' },
    { kind: 'group', group: 'safeguards', w: 0.1, label: 'safety hardening' },
  ],
  business: [
    { kind: 'group', group: 'context', w: 0.3, label: 'long context' },
    { kind: 'cards', ids: ['safety-tuning', 'unlearning', 'classifiers'], w: 0.2, label: 'safety tuning' },
    { kind: 'cards', ids: ['eval-full', 'eval-third', 'eval-gov'], w: 0.2, label: 'real evaluations before launch' },
    { kind: 'focus', stage: 'pre', index: 2, w: 0.1, label: 'data cleaning' },
    { kind: 'group', group: 'decontam', w: 0.1, label: 'honest benchmark scores' },
    { kind: 'cards', ids: ['tool-sft'], w: 0.1, label: 'tool use' },
  ],
  coding: [
    { kind: 'cards', ids: ['rlvr-light', 'reasoning-rl'], w: 0.3, label: 'reasoning training' },
    { kind: 'focus', stage: 'pre', index: 1, w: 0.2, label: 'math and code in pre-training' },
    { kind: 'cards', ids: ['tool-sft'], w: 0.2, label: 'tool use' },
    { kind: 'group', group: 'ready', w: 0.15, label: 'reasoning readiness' },
    { kind: 'group', group: 'context', w: 0.15, label: 'long context' },
  ],
  agent: [
    { kind: 'cards', ids: ['agentic-rl'], w: 0.35, label: 'agent training' },
    { kind: 'group', group: 'ready', w: 0.2, label: 'reasoning readiness' },
    { kind: 'cards', ids: ['tool-sft'], w: 0.15, label: 'tool use' },
    { kind: 'group', group: 'context', w: 0.1, label: 'long context' },
    { kind: 'focus', stage: 'post', index: 2, w: 0.1, label: 'red-teaming time' },
    { kind: 'group', group: 'safeguards', w: 0.1, label: 'safety hardening' },
  ],
  science: [
    { kind: 'cards', ids: ['reasoning-rl', 'raw-rl'], w: 0.25, label: 'full reasoning training' },
    { kind: 'cards', ids: ['expert-prefs', 'rubric'], w: 0.2, label: 'expert feedback' },
    { kind: 'cards', ids: ['reasoning-ready-full'], w: 0.15, label: 'the full reasoning-readiness recipe' },
    { kind: 'size', sizes: ['large', 'xl'], w: 0.2, label: 'a large model' },
    { kind: 'group', group: 'decontam', w: 0.1, label: 'honest benchmark scores' },
    { kind: 'group', group: 'context', w: 0.1, label: 'long context' },
  ],
};

// Features added at release (spec section 5). serving multiplies the model's serving cost; appeal per product.
export const RELEASE_FEATURES = {
  search: { name: 'Web search', era: 2, cash: 5, serving: 1.1, appeal: { chat: 1, business: 1, coding: 0.5, agent: 0.5, science: 0.5 } },
  voice: { name: 'Voice', era: 2, cash: 10, serving: 1.3, appeal: { chat: 1 } },
  memory: { name: 'Memory', era: 3, cash: 5, serving: 1.15, appeal: { chat: 1, business: 0.5, agent: 0.5 } },
  computerUse: { name: 'Computer use', era: 4, cash: 20, serving: 1.4, appeal: { business: 0.5, coding: 0.5, agent: 1 }, mx: 2 },
  deepResearch: { name: 'Deep research', era: 4, cash: 10, serving: 1.5, appeal: { business: 1, coding: 0.5, science: 1 } },
};
// When a rival ships each feature first (turnInEra is 0-based: round 3 of era 2 is turnInEra 2).
export const RIVAL_FEATURES = [
  { feature: 'search', rival: 'openbrain', era: 2, turnInEra: 2 },
  { feature: 'voice', rival: 'openbrain', era: 2, turnInEra: 3 },
  { feature: 'memory', rival: 'deepthink', era: 3, turnInEra: 3 },
  { feature: 'computerUse', rival: 'lodestar', era: 4, turnInEra: 1 },
  { feature: 'deepResearch', rival: 'deepthink', era: 4, turnInEra: 0 },
];
