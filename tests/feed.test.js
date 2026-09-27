import test from 'node:test';
import assert from 'node:assert/strict';
import { feedPosts } from '../sim/feed.js';
import {
  AMBIENT_POSTS,
  COMPANY_POSTS,
  ERA_POSTS,
  MOOD_POSTS,
  RECEPTION_POSTS,
  RIVAL_POSTS,
} from '../sim/data/feed.js';
import { createRng } from '../sim/rng.js';
import { createInitialState } from '../sim/state.js';
import { endTurn } from '../sim/turn.js';
import { computeSlices } from '../sim/split.js';
import { REACTIONS } from '../sim/data/feedReactions.js';
import { PEOPLE } from '../sim/data/feedPeople.js';

const TRAINING_RECIPE = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};

function releaseThroughTurns({ price = 'market', seed = 5 } = {}) {
  const rng = createRng(seed);
  const initial = createInitialState({ seed });
  const trained = endTurn(initial, { moves: [{ type: 'startRun', recipe: TRAINING_RECIPE }] }, rng);
  const released = endTurn(trained.state, { moves: [{
    type: 'release',
    release: { picks: ['eval-full', 'channel-app'], price, reasoning: 'off', family: 'Kestrel', generation: 1 },
  }] }, rng);
  assert.deepEqual(trained.errors, []);
  assert.deepEqual(released.errors, []);
  return { rng, trained, released };
}

function rendered(pool, model) {
  return pool.map((template) => template.text.replaceAll('{model}', model.name));
}

function stateAt(turn = 4) {
  const state = createInitialState({ seed: 17 });
  state.turn = turn;
  state.era = 2;
  return state;
}

function releasedModel(overrides = {}) {
  return {
    name: 'Kestrel 3 Grand',
    active: true,
    activated: true,
    activeFromTurn: 3,
    releaseSequence: 1,
    channel: 'consumer',
    priceStance: 'market',
    reasoning: 'off',
    flags: [],
    launch: { pressAvg: 6, reactions: [] },
    ...overrides,
  };
}

test('feed posts are deterministic and do not mutate their inputs', () => {
  const prev = stateAt(4);
  const state = stateAt(5);
  state.models.push(releasedModel());
  const events = [{ type: 'rivalRelease', id: 'deepthink', gain: 9 }];
  const snapshots = [structuredClone(prev), structuredClone(state), structuredClone(events)];

  assert.deepEqual(feedPosts(prev, state, events), feedPosts(prev, state, events));
  assert.deepEqual(prev, snapshots[0]);
  assert.deepEqual(state, snapshots[1]);
  assert.deepEqual(events, snapshots[2]);
});

test('launch reactions come through first and unchanged', () => {
  const prev = stateAt(5);
  const state = stateAt(6);
  const reactions = [
    { handle: '@night_shift', text: 'the tiny one is weirdly good at recipes' },
    { handle: '@benchwatch', text: 'show us the test set' },
  ];
  const model = releasedModel({ activeFromTurn: 6, launch: { pressAvg: 8, reactions } });
  const posts = feedPosts(prev, state, [
    { type: 'release', model },
    { type: 'rivalRelease', id: 'openbrain', gain: 10 },
  ]);

  assert.deepEqual(posts.slice(0, 2), reactions.map((reaction) => ({
    turn: state.turn,
    ...reaction,
    tag: 'launch',
  })));
});

test('rival release posts name the rival', () => {
  const prev = stateAt();
  const state = stateAt();
  const posts = feedPosts(prev, state, [{ type: 'rivalRelease', id: 'openbrain', gain: 8 }]);

  assert.equal(posts.length, 1);
  assert.equal(posts[0].tag, 'rival');
  assert.match(posts[0].text, /openbrain/i);
});

test('an era start produces two era posts', () => {
  const prev = stateAt(7);
  const state = stateAt(8);
  state.era = 3;
  const posts = feedPosts(prev, state, [{ type: 'eraStart', era: 3 }]);

  assert.equal(posts.length, 2);
  assert.ok(posts.every((post) => post.tag === 'era'));
});

test('the feed never returns more than six posts', () => {
  const prev = stateAt(5);
  const state = stateAt(6);
  const reactions = Array.from({ length: 5 }, (_, index) => ({
    handle: `@reader_${index}`,
    text: `launch reaction number ${index}`,
  }));
  const model = releasedModel({ activeFromTurn: 6, launch: { pressAvg: 7, reactions } });
  const events = [
    { type: 'release', model },
    { type: 'rivalRelease', id: 'qilin', gain: 12 },
    { type: 'eraStart', era: 3 },
    { type: 'raise' },
    { type: 'emergency' },
  ];

  assert.equal(feedPosts(prev, state, events).length, 6);
});

test('text in the most recent twenty feed posts is skipped', () => {
  const prev = stateAt(5);
  const state = stateAt(6);
  const repeated = 'everybody is posting the same launch take';
  state.feed = [
    { text: 'old enough to fall outside the window' },
    ...Array.from({ length: 19 }, (_, index) => ({ text: `recent filler ${index}` })),
    { text: repeated },
  ];
  const model = releasedModel({
    activeFromTurn: 6,
    launch: {
      pressAvg: 5,
      reactions: [
        { handle: '@echo', text: repeated },
        { handle: '@fresh_take', text: 'a genuinely new launch take' },
      ],
    },
  });

  const posts = feedPosts(prev, state, [{ type: 'release', model }]);
  assert.deepEqual(posts.map((post) => post.text), ['a genuinely new launch take']);
});

test('an empty turn gets one era-appropriate ambient post', () => {
  const prev = stateAt();
  const state = stateAt();
  const posts = feedPosts(prev, state, []);

  assert.equal(posts.length, 1);
  assert.equal(posts[0].tag, 'ambient');
  assert.ok(AMBIENT_POSTS[state.era].some(({ text }) => text === posts[0].text));
});

test('reception posts appear only on turns one through three after activation', () => {
  for (const age of [1, 2, 3]) {
    const state = stateAt(10);
    state.models.push(releasedModel({ activeFromTurn: state.turn - age }));
    assert.ok(feedPosts(stateAt(9), state, []).some((post) => post.tag === 'reception'));
  }

  for (const age of [0, 4]) {
    const state = stateAt(10);
    state.models.push(releasedModel({ activeFromTurn: state.turn - age }));
    assert.equal(feedPosts(stateAt(9), state, []).some((post) => post.tag === 'reception'), false);
  }
});

test('all template banks meet their minimum sizes', () => {
  const receptionCount = [
    ...Object.values(RECEPTION_POSTS.flags),
    ...Object.values(RECEPTION_POSTS.channels),
    ...Object.values(RECEPTION_POSTS.press),
    ...Object.values(RECEPTION_POSTS.price),
    RECEPTION_POSTS.reasoningHigh,
    RECEPTION_POSTS.capacityTrouble,
    RECEPTION_POSTS.generic,
  ].flat().length;
  assert.ok(receptionCount >= 30);
  for (const rival of Object.values(RIVAL_POSTS)) {
    assert.ok(rival.big.length >= 3);
    assert.ok(rival.small.length >= 3);
  }
  for (const era of [2, 3, 4, 5]) assert.ok(ERA_POSTS[era].length >= 2);
  assert.ok(Object.values(COMPANY_POSTS).flat().length >= 10);
  assert.ok(Object.values(MOOD_POSTS).flat().length >= 8);
  for (const era of [1, 2, 3, 4, 5]) assert.ok(AMBIENT_POSTS[era].length >= 3);
});

test('raise and emergency posts describe the player lab, not a rival', () => {
  const rivalPattern = new RegExp(`\\b(?:another|rival|${Object.keys(RIVAL_POSTS).join('|')})\\b`, 'i');
  for (const template of [...COMPANY_POSTS.raise, ...COMPANY_POSTS.emergency]) {
    assert.match(template.text, /\b(?:a|the) lab\b/i);
    assert.doesNotMatch(template.text, rivalPattern);
  }
});

test('every authored template renders within the post length limit', () => {
  const texts = [];
  const collect = (value) => {
    if (Array.isArray(value)) for (const item of value) collect(item);
    else if (value && typeof value === 'object' && typeof value.text === 'string') texts.push(value.text);
    else if (value && typeof value === 'object') for (const item of Object.values(value)) collect(item);
  };
  for (const bank of [RECEPTION_POSTS, RIVAL_POSTS, ERA_POSTS, COMPANY_POSTS, MOOD_POSTS, AMBIENT_POSTS]) collect(bank);

  assert.ok(texts.length > 0);
  for (const text of texts) {
    const rendered = text.replaceAll('{model}', 'Kestrel 3 Grand');
    assert.ok(rendered.length <= 140, `${rendered.length} characters: ${rendered}`);
  }
});

test('building feed posts does not consume the game rng', () => {
  const initial = createInitialState({ seed: 29 });
  const rngWithFeed = createRng(41);
  const rngWithoutFeed = createRng(41);

  const firstWithFeed = endTurn(initial, {}, rngWithFeed);
  feedPosts(initial, firstWithFeed.state, firstWithFeed.events);
  const secondWithFeed = endTurn(firstWithFeed.state, {}, rngWithFeed);

  const firstWithoutFeed = endTurn(initial, {}, rngWithoutFeed);
  const secondWithoutFeed = endTurn(firstWithoutFeed.state, {}, rngWithoutFeed);

  assert.deepEqual(secondWithFeed, secondWithoutFeed);
});

// The live persona feed (sim/feedLive.js) schedules posts over the coming days: count the feed and the queue together.
const allPosts = (state) => [...state.feed, ...(state.feedQueue ?? [])];
const persona = (pool, state, model) => new Set(pool.map(([, text]) => text.replaceAll('{model}', model?.name ?? '')));

test('endTurn wires persona launch reactions and era changes into the feed', () => {
  const { released } = releaseThroughTurns();
  const launch = allPosts(released.state).filter((post) => post.tag === 'launch');
  assert.ok(launch.length >= 3, 'a launch draws several posts');
  assert.ok(launch.every((post) => PEOPLE[post.handle]), 'every launch post comes from a persona');
  const model = released.state.models[0];
  const consumer = persona(REACTIONS.launch.channel.consumer, released.state, model);
  assert.ok(launch.some((post) => consumer.has(post.text)), 'a consumer app draws consumer posts');

  // Under the compute race plan (docs/superpowers/plans/2026-09-26-compute-race.md) Task 5, rivals grow their fleets and train bigger models, so an idle lab is left behind at the
  // era 1 gate on most seeds (seed 2 among them); seed 3's idle run still reaches era 2.
  let state = createInitialState({ seed: 3 });
  const rng = createRng(3);
  let transition;
  for (let turn = 0; turn < 4; turn += 1) {
    transition = endTurn(state, {}, rng);
    state = transition.state;
  }
  assert.ok(transition.events.some((event) => event.type === 'eraStart' && event.era === 2));
  assert.equal(state.feed.filter((post) => post.day === state.day && post.tag === 'era').length, 2, 'two era posts on the day it starts');
  assert.ok(allPosts(state).filter((post) => post.tag === 'era').length >= 3, 'more era posts follow over the next days');
});

test('real undercut releases draw the cheap-price persona posts', () => {
  const { released } = releaseThroughTurns({ price: 'undercut' });
  const cheap = persona(REACTIONS.launch.price.cheap, released.state, released.state.models[0]);
  assert.ok(allPosts(released.state).some((post) => post.tag === 'launch' && cheap.has(post.text)));
});

test('real serving shortfalls use computeSlices for capacity-trouble reception', () => {
  const { rng, released } = releaseThroughTurns();
  const before = released.state;
  const model = before.models[0];
  before.compute.split.coverWithSpot = false;
  const result = endTurn(before, { computeSplit: { servingCap: 0, coverWithSpot: false } }, rng);
  const capacity = persona(REACTIONS.launch.capacity, result.state, model);
  assert.ok(computeSlices(result.state).shortfall > 0);
  assert.ok(result.events.some((event) => event.type === 'outage'));
  assert.ok(allPosts(result.state).some((post) => post.tag === 'reception' && capacity.has(post.text)));
});

test('a real CoreFlame trouble card draws the compute-supplier persona posts', () => {
  const rng = createRng(4);
  let state = createInitialState({ seed: 4 });
  const coreflame = state.compute.offers.find((offer) => offer.supplier === 'coreflame');
  let result = endTurn(state, { moves: [{ type: 'deal', offerId: coreflame.id }] }, rng);
  assert.deepEqual(result.errors, []);
  state = result.state;
  result = endTurn(state, {}, rng);
  assert.ok(result.events.some((event) => event.type === 'warning' && event.id === 'neocloudTrouble'));
  state = result.state;
  result = endTurn(state, {}, rng);
  const supplier = persona(REACTIONS.company.computeFailed, result.state);
  assert.ok(result.events.some((event) => event.type === 'eventCard' && event.id === 'neocloudTrouble'));
  const card = result.state.pendingEvents.find((c) => (c.eventId ?? c.id) === 'neocloudTrouble');
  const talk = (s) => allPosts(s).filter((post) => post.tag === 'company' && supplier.has(post.text));
  assert.ok(talk(result.state).every((post) => post.day >= card.landsAt), 'nobody talks about it before the card lands');
  result = endTurn(result.state, {}, rng); // the round the card lands in
  assert.ok(talk(result.state).length >= 1);
});

test('with time-based posts off, a quiet moment posts nothing', async () => {
  const { feedPosts } = await import('../sim/feed.js');
  const { createInitialState } = await import('../sim/state.js');
  const s = createInitialState({ seed: 4 });
  assert.deepEqual(feedPosts(s, s, [], { ambient: false, timeBased: false }), []);
});

test('a trust drop from an instant action still gets its mood post at the round mark', async () => {
  const { createInitialState } = await import('../sim/state.js');
  const { createRng } = await import('../sim/rng.js');
  const { advanceDays } = await import('../sim/turn.js');
  const s = createInitialState({ seed: 5 });
  s.roundStart.publicTrust = 41;
  s.publicTrust = 36; // dropped mid-round by an action
  const out = advanceDays(s, 91, createRng(5)).state;
  assert.ok([...out.feed, ...(out.feedQueue ?? [])].some((post) => post.tag === 'mood'), 'the low-trust mood post appears');
});

test('a big rival deal and your denial make feed posts', () => {
  const s = createInitialState({ seed: 3 });
  const prev = { raceHeat: s.raceHeat, publicTrust: s.publicTrust };
  const deal = feedPosts(prev, s, [{ type: 'rivalDeal', id: 'openbrain', supplier: 'verde', units: 40, arrivesTurn: 3, fallback: false, big: true }], { ambient: false, timeBased: false });
  assert.equal(deal.length, 1);
  assert.equal(deal[0].tag, 'rival');
  const denial = feedPosts(prev, s, [{ type: 'deal', offerId: 'coreflame-0', arrivesTurn: 1, denied: 'lodestar' }], { ambient: false, timeBased: false });
  assert.equal(denial.length, 1);
  const small = feedPosts(prev, s, [{ type: 'rivalDeal', id: 'openbrain', supplier: 'spot', units: 2, arrivesTurn: 1, fallback: false, big: false }], { ambient: false, timeBased: false });
  assert.equal(small.length, 0, 'a small deal stays quiet');
});
