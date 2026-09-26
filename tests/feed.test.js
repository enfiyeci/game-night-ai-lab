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
