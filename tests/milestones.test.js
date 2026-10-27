import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { milestonesTick } from '../sim/milestones.js';
import { summaryItems } from '../ui/logic/compute.js';
import { nextRunOffer } from '../ui/logic/training.js';

// Reward-loops O3 (Arda's pick 2026-10-26): earned beats from the player's own models, none of them stopping the clock.
const live = (fields = {}) => ({ name: 'Wren 2 Core', family: 'Wren', generation: 2, active: true, activated: true, activeFromTurn: 0, releasedTurn: 1, users: 0, trainingCost: 50, launchCost: 10, earned: 0, servingSpent: 0, ...fields });

test('users passing 1M, 10M and 100M each make one beat, once', () => {
  const state = createInitialState({ seed: 1 });
  state.models.push(live({ users: 900000 }));
  assert.deepEqual(milestonesTick(state), []);
  state.models[0].users = 1.2e6;
  assert.deepEqual(milestonesTick(state), [{ type: 'usersMilestone', users: 1e6 }]);
  assert.deepEqual(milestonesTick(state), [], 'once');
  state.models[0].users = 2.5e8; // a jump past two marks names the highest
  assert.deepEqual(milestonesTick(state), [{ type: 'usersMilestone', users: 1e8 }]);
  state.models[0].users = 5e5; // falling back never replays one
  milestonesTick(state);
  state.models[0].users = 1.5e6;
  assert.deepEqual(milestonesTick(state), []);
});

test('a model that has earned back its training and launch cost says so once', () => {
  const state = createInitialState({ seed: 1 });
  state.models.push(live({ earned: 40, servingSpent: 5 }));
  assert.deepEqual(milestonesTick(state).filter((e) => e.type === 'paidBack'), []);
  state.models[0].earned = 66;
  assert.deepEqual(milestonesTick(state).filter((e) => e.type === 'paidBack'), [{ type: 'paidBack', name: 'Wren 2 Core' }]);
  assert.deepEqual(milestonesTick(state).filter((e) => e.type === 'paidBack'), []);
  state.models.push(live({ name: 'Old', trainingCost: null, earned: 500 })); // no book: no claim
  assert.deepEqual(milestonesTick(state).filter((e) => e.type === 'paidBack'), []);
});

test('taking #1 and losing it are beats; the first look only records the rank', () => {
  const state = createInitialState({ seed: 1 });
  state.models.push(live());
  state.capability = 0;
  assert.deepEqual(milestonesTick(state).filter((e) => e.type.endsWith('First')), [], 'the first look sets the baseline');
  state.capability = 1000;
  assert.deepEqual(milestonesTick(state).filter((e) => e.type.endsWith('First')), [{ type: 'tookFirst' }]);
  state.capability = 0;
  const lost = milestonesTick(state).filter((e) => e.type.endsWith('First'));
  assert.equal(lost.length, 1);
  assert.equal(lost[0].type, 'lostFirst');
  assert.ok(state.rivals.some((rival) => rival.name === lost[0].leader));
});

test('no beats before the first release, and none once the run is over', () => {
  const state = createInitialState({ seed: 1 });
  state.capability = 1000;
  assert.deepEqual(milestonesTick(state), []);
  state.models.push(live({ users: 5e6 }));
  state.ending = 'aligned';
  assert.deepEqual(milestonesTick(state), []);
});

test('each beat and a model going live get a "Just now" line', () => {
  const state = createInitialState({ seed: 1 });
  const items = summaryItems([
    { type: 'usersMilestone', users: 1e7 }, { type: 'paidBack', name: 'Wren 2 Core' }, { type: 'tookFirst' },
    { type: 'lostFirst', leader: 'DeepThink' }, { type: 'modelLive', model: { name: 'Wren 3 Core' } },
  ], state);
  assert.deepEqual(items.map((item) => item.kind), ['lab', 'lab', 'lab', 'rival', 'lab']);
  assert.match(items[0].text, /10M/);
  assert.match(items[1].text, /Wren 2 Core/);
  assert.match(items[3].text, /DeepThink/);
  assert.match(items[4].text, /Wren 3 Core/);
});

test('the next run is offered only when the research team is free', () => {
  const state = createInitialState({ seed: 1 });
  state.models.push(live());
  const offer = nextRunOffer(state);
  assert.equal(offer.name, 'Wren 3');
  assert.equal(typeof offer.short, 'boolean');
  assert.equal(nextRunOffer({ ...state, activeRun: {} }), null);
  assert.equal(nextRunOffer({ ...state, pendingModel: {} }), null);
  assert.equal(nextRunOffer({ ...state, round: { ...state.round, teams: { research: 'startRun' } } }), null);
  assert.equal(nextRunOffer({ ...state, ending: 'aligned' }), null);
  assert.equal(nextRunOffer({ ...state, round: { ...state.round, moves: 2 } }), null, 'both team actions used: Train is greyed out');
});

test('in a bot game the beats fire, post to the feed, and replay the same from the seed', { timeout: 300000 }, async () => {
  const { createRng } = await import('../sim/rng.js');
  const { enableScenarios } = await import('../sim/scenarios.js');
  const { STRATEGIES, eventChoices, dailyRelease } = await import('../tools/balance.js');
  const { playRound } = await import('../tools/play-round.js');
  const play = (seed) => {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    const beats = [];
    for (let i = 0; i < 30 && !state.ending; i += 1) {
      const result = playRound(state, STRATEGIES.careful(state, rng), rng, (current) => eventChoices(current, 'careful', rng), { dailyActions: (current) => dailyRelease('careful', current) });
      state = result.state;
      beats.push(...result.events.filter((e) => ['usersMilestone', 'paidBack', 'tookFirst', 'lostFirst'].includes(e.type)).map((e) => `${e.type}:${e.users ?? e.name ?? e.leader ?? ''}`));
    }
    return { state, beats };
  };
  const a = play(2);
  assert.ok(a.beats.some((beat) => beat.startsWith('usersMilestone')), a.beats.join());
  assert.deepEqual(play(2).beats, a.beats);
  const texts = new Set(Object.values((await import('../sim/data/milestonePosts.js')).MILESTONE_POSTS).flat().map(([, text]) => text.split('{')[0].slice(0, 12)));
  assert.ok(a.state.feed.some((post) => [...texts].some((start) => start && post.text.startsWith(start))), 'a milestone post reached the feed');
});
