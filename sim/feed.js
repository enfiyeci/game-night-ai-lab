import { createRng } from './rng.js';
import { computeSlices } from './split.js';
import {
  AMBIENT_POSTS,
  COMPANY_POSTS,
  ERA_POSTS,
  MOOD_POSTS,
  RECEPTION_POSTS,
  RIVAL_POSTS,
} from './data/feed.js';

const MAX_POSTS = 6;
const COMPANY_EVENTS = new Set([
  'raise',
  'emergency',
  'lawsuitPaid',
  'conversionFight',
  'runComplete',
]);

function render(template, model) {
  return template.text.replaceAll('{model}', () => model?.name ?? 'the new model');
}

function newestActiveModel(state) {
  let newest = null;
  let newestOrder = -Infinity;
  for (let index = 0; index < (state.models ?? []).length; index += 1) {
    const model = state.models[index];
    if (!model.active || !model.activated) continue;
    const order = model.releaseSequence ?? index;
    if (order >= newestOrder) {
      newest = model;
      newestOrder = order;
    }
  }
  return newest;
}

function receptionPools(model, state) {
  const specific = [];
  for (const flag of model.flags ?? []) {
    if (RECEPTION_POSTS.flags[flag]) specific.push(...RECEPTION_POSTS.flags[flag]);
  }
  const channel = model.channel ?? model.spec?.channel;
  if (RECEPTION_POSTS.channels[channel]) specific.push(...RECEPTION_POSTS.channels[channel]);

  const traits = [];
  if (model.launch?.pressAvg >= 7) traits.push(...RECEPTION_POSTS.press.high);
  if (model.launch?.pressAvg <= 4) traits.push(...RECEPTION_POSTS.press.low);
  const price = model.priceStance === 'undercut' || model.priceStance === 'free' ? 'cheap' : model.priceStance;
  if (RECEPTION_POSTS.price[price]) traits.push(...RECEPTION_POSTS.price[price]);
  if (model.reasoning === 'high' || model.spec?.reasoning === 'high') traits.push(...RECEPTION_POSTS.reasoningHigh);
  if (!state.compute.split.coverWithSpot && computeSlices(state).shortfall > 0) {
    traits.push(...RECEPTION_POSTS.capacityTrouble);
  }

  return { specific, traits };
}

function moodPool(prev, state) {
  if (prev.raceHeat < 75 && state.raceHeat >= 75) return MOOD_POSTS.raceHeat75;
  if (prev.raceHeat < 50 && state.raceHeat >= 50) return MOOD_POSTS.raceHeat50;
  if (prev.publicTrust >= 40 && state.publicTrust < 40) return MOOD_POSTS.trustLow;
  if (prev.publicTrust < 75 && state.publicTrust >= 75) return MOOD_POSTS.trustHigh;
  return null;
}

export function feedPosts(prev, state, events, { ambient = true } = {}) {
  const rng = createRng((state.seed ?? 1) * 7919 + state.turn);
  const blocked = new Set((state.feed ?? []).slice(-20).map((post) => post.text));
  const posts = [];

  const add = (handle, text, tag) => {
    if (posts.length >= MAX_POSTS || blocked.has(text)) return false;
    posts.push({ turn: state.turn, handle, text, tag });
    blocked.add(text);
    return true;
  };
  const addFromPool = (pool, tag, model = null) => {
    if (!pool?.length || posts.length >= MAX_POSTS) return false;
    const available = pool.filter((template) => !blocked.has(render(template, model)));
    if (!available.length) return false;
    const template = rng.pick(available);
    return add(template.handle, render(template, model), tag);
  };

  for (const event of events) {
    if (event.type !== 'release') continue;
    for (const reaction of event.model?.launch?.reactions ?? []) {
      add(reaction.handle, reaction.text, 'launch');
      if (posts.length >= MAX_POSTS) break;
    }
    if (posts.length >= MAX_POSTS) break;
  }

  if (posts.length < MAX_POSTS) {
    const model = newestActiveModel(state);
    const age = model ? state.turn - model.activeFromTurn : null;
    if (age >= 1 && age <= 3) {
      const count = rng.int(1, 2);
      const { specific, traits } = receptionPools(model, state);
      if (!addFromPool([...specific, ...traits], 'reception', model)) {
        addFromPool(RECEPTION_POSTS.generic, 'reception', model);
      }
      if (count === 2) {
        addFromPool([...traits, ...specific, ...RECEPTION_POSTS.generic], 'reception', model);
      }
    }
  }

  for (const event of events) {
    if (posts.length >= MAX_POSTS) break;
    if (event.type !== 'rivalRelease') continue;
    const rival = RIVAL_POSTS[event.id];
    if (rival) addFromPool(event.gain >= 8 ? rival.big : rival.small, 'rival');
  }

  for (const event of events) {
    if (posts.length >= MAX_POSTS) break;
    if (event.type !== 'eraStart') continue;
    const pool = ERA_POSTS[event.era] ?? [];
    addFromPool(pool, 'era');
    addFromPool(pool, 'era');
  }

  for (const event of events) {
    if (posts.length >= MAX_POSTS) break;
    const type = event.type === 'eventCard' && event.id === 'neocloudTrouble' ? 'computeFailed' : event.type;
    if (COMPANY_EVENTS.has(type) || type === 'computeFailed') addFromPool(COMPANY_POSTS[type], 'company');
  }

  if (posts.length < MAX_POSTS) addFromPool(moodPool(prev, state), 'mood');
  if (ambient && posts.length === 0) addFromPool(AMBIENT_POSTS[state.era], 'ambient');

  return posts;
}
