import test from 'node:test';
import assert from 'node:assert/strict';
import { REACTIONS } from '../sim/data/feedReactions.js';
import { PEOPLE } from '../sim/data/feedPeople.js';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { BOARD_EVENTS } from '../sim/data/boardEvents.js';
import { PROMISES } from '../sim/data/promises.js';
import { MEETINGS } from '../sim/data/president.js';
import { labText, reactToEvents, reactToLandedCard, releaseDueFeed } from '../sim/feedLive.js';
import { createInitialState } from '../sim/state.js';

const ALL = [...EVENTS, ...EVENTS_6C, ...BOARD_EVENTS];
const shown = (list) => new Set(list.map(([, text]) => text.replaceAll('{model}', 'the new model')));
const handles = (node) => (Array.isArray(node) && typeof node[0] === 'string'
  ? [node[0], ...(node[2]?.replies ?? []).map(([handle]) => handle)]
  : Object.values(node).flatMap(handles));

test('every reaction comes from one of the 100 personas or the four news desks', () => {
  assert.equal(Object.keys(PEOPLE).length, 104);
  for (const handle of handles(REACTIONS)) assert.ok(PEOPLE[handle], `${handle} is a persona`);
});

test('every event and choice the reactions name exists in the game', () => {
  for (const [id, reactions] of Object.entries(REACTIONS.events)) {
    const event = ALL.find((candidate) => candidate.id === id);
    assert.ok(event, `event ${id}`);
    for (const choice of Object.keys(reactions.choices ?? {})) {
      assert.ok(event.card.choices.some((c) => c.id === choice), `${id} has choice ${choice}`);
    }
  }
  const labels = new Set(Object.values(PROMISES).map((p) => p.deliver.label.toLowerCase()));
  for (const label of Object.keys(REACTIONS.promise.delivered)) assert.ok(labels.has(label), `promise delivery "${label}"`);
  const styles = new Set(MEETINGS.flatMap((m) => m.exchanges.flatMap((e) => e.answers.map((a) => a.id.split('-').slice(1, 3).join('-')))));
  for (const style of Object.keys(REACTIONS.president.first.war)) assert.ok(styles.has(`war-${style}`), `war answer style ${style}`);
});

function stateOnDay(day = 30) {
  const state = createInitialState({ seed: 3 });
  state.day = day;
  state.feed = [];
  return state;
}

function runDays(state, days) {
  for (let k = 0; k < days; k += 1) {
    state.day += 1;
    releaseDueFeed(state);
  }
}

test('a landed card starts the talk today and keeps it going for a few days', () => {
  const state = stateOnDay();
  reactToLandedCard(state, { id: 'jailbreak' });
  releaseDueFeed(state);
  const today = state.feed.filter((post) => post.day === 30).length;
  assert.ok(today >= 1, 'some posts land the same day');
  assert.ok(state.feedQueue.length >= 1, 'more are waiting for later days');
  runDays(state, 4);
  assert.equal(state.feedQueue.length, 0);
  const breaks = shown(REACTIONS.events.jailbreak.breaks);
  assert.ok(state.feed.every((post) => breaks.has(post.text)));
  assert.ok(new Set(state.feed.map((post) => post.day)).size >= 2, 'posts spread over more than one day');
});

test('a choice on a card brings reactions to that choice', () => {
  const state = stateOnDay();
  reactToEvents(state, state, [{ type: 'eventResolved', id: 'jailbreak', eventId: 'jailbreak', choiceId: 'deny' }]);
  runDays(state, 3);
  const deny = shown(REACTIONS.events.jailbreak.choices.deny);
  assert.ok(state.feed.length >= 2);
  assert.ok(state.feed.every((post) => deny.has(post.text)));
});

test('things inside the lab only ever reach the feed as a rumour', () => {
  for (let seed = 1; seed <= 20; seed += 1) {
    const state = stateOnDay(seed);
    reactToLandedCard(state, { id: 'oversightTamper' });
    runDays(state, 3);
    assert.ok(state.feed.every((post) => post.tag === 'rumour'));
  }
});

test('the President meeting posts follow the answers the CEO gave', () => {
  const state = stateOnDay();
  reactToEvents(state, state, [{ type: 'meetingOutcome', id: 'first', walkedOut: false, stake: 'none', answers: ['first-war-hawk', 'first-woke-comedian', 'first-chips-plain'] }]);
  runDays(state, 4);
  const texts = new Set(state.feed.map((post) => post.text));
  const pool = (list) => list.map(([, text]) => text);
  assert.ok(pool(REACTIONS.president.first.war.hawk).some((text) => texts.has(text)), 'the hawk answer is talked about');
  assert.ok(pool(REACTIONS.president.first.woke.comedian).some((text) => texts.has(text)), 'so is the joke');
  assert.ok(!pool(REACTIONS.president.first.war.flatter).some((text) => texts.has(text)), 'flattery that never happened is not');
  const expired = stateOnDay();
  reactToEvents(expired, expired, [{ type: 'meetingOutcome', id: 'first', walkedOut: false, stake: 'none' }]);
  runDays(expired, 4);
  assert.equal(expired.feed.length, 0, 'a meeting that never happened gets no posts');
});

test('the lab name is filled in when the post is shown', () => {
  assert.equal(labText("{lab}'s CEO", 'Kestrel Labs'), "Kestrel Labs' CEO");
  assert.equal(labText("{lab}'s CEO", 'Nova'), "Nova's CEO");
  assert.equal(labText('congrats to the {lab} team', ''), 'congrats to Your lab team');
  assert.equal(labText('the {lab} board', 'Nova'), 'the Nova board');
});

test('a reply follows its post, on the same day or later, and names who it answers', () => {
  const state = stateOnDay();
  assert.ok(REACTIONS.world.some((post) => post[2]?.replies), 'some world news carries replies');
  // A quiet round mark, which is where world news comes from.
  reactToEvents({ raceHeat: 0, publicTrust: 50 }, state, [], { atMark: true });
  runDays(state, 120);
  for (const post of state.feed.filter((p) => p.replyTo)) {
    const parent = state.feed.find((p) => p.handle === post.replyTo && p.text === post.replyToText && p.day <= post.day);
    assert.ok(parent, `the post ${post.replyTo} answers came first`);
  }
});

test('seasonal posts only appear in their season', () => {
  const winterOnly = REACTIONS.everyday.filter((post) => post[2]?.season === 'winter');
  assert.ok(winterOnly.length > 0);
  for (let day = 150; day < 240; day += 1) { // June to August
    const state = stateOnDay(day);
    reactToEvents({ raceHeat: 0, publicTrust: 50 }, state, [], { atMark: true });
    const texts = new Set(state.feedQueue.map((post) => post.text));
    assert.ok(!winterOnly.some(([, text]) => texts.has(text)), `no winter post scheduled on day ${day}`);
  }
});

test('a seasonal post is checked against the day it lands, not the day it was picked', () => {
  const months = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], 'late summer': [7, 8], autumn: [8, 9, 10] };
  const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const monthOf = (day) => monthStarts.findLastIndex((start) => start <= day % 365);
  const season = new Map([...REACTIONS.everyday, ...REACTIONS.world].filter((post) => post[2]?.season).map(([, text, extra]) => [text, extra.season]));
  let checked = 0;
  for (let seed = 1; seed <= 40; seed += 1) {
    for (let day = 300; day < 420; day += 7) { // rounds that cross from autumn into winter and spring
      const state = createInitialState({ seed });
      state.day = day;
      state.feed = [];
      reactToEvents({ raceHeat: 0, publicTrust: 50 }, state, [], { atMark: true });
      for (const post of state.feedQueue.filter((p) => season.has(p.text))) {
        checked += 1;
        assert.ok(months[season.get(post.text)].includes(monthOf(post.day)), `"${post.text.slice(0, 40)}" lands on day ${post.day}`);
      }
    }
  }
  assert.ok(checked > 0, 'some seasonal posts were scheduled');
});

test('once the run is over, every post still waiting is released', () => {
  const state = stateOnDay();
  reactToLandedCard(state, { id: 'jailbreak' });
  releaseDueFeed(state);
  assert.ok(state.feedQueue.length >= 1, 'posts are waiting for later days');
  state.ending = 'aligned';
  releaseDueFeed(state);
  assert.equal(state.feedQueue.length, 0);
  assert.ok(state.feed.every((post) => post.day <= state.day), 'released posts carry the final day at the latest');
});

test('a summit with no binding commitments counts as failed, not signed', () => {
  const state = stateOnDay();
  reactToEvents(state, state, [{ type: 'summit', signed: {}, binding: [] }]);
  runDays(state, 3);
  const signed = shown(REACTIONS.summit.signed);
  const failed = shown(REACTIONS.summit.failed);
  assert.ok(state.feed.length >= 1);
  assert.ok(state.feed.every((post) => failed.has(post.text) && !signed.has(post.text)));
});

test('a release that is not live yet is announced at once', () => {
  const state = stateOnDay();
  const model = { name: 'Kestrel 2 Core', activated: false, flags: [] };
  reactToEvents(state, state, [{ type: 'release', model }]);
  runDays(state, 2);
  assert.ok(state.feed.some((post) => post.tag === 'announce'));
  assert.ok(!state.feed.some((post) => post.tag === 'launch'), 'launch posts wait for the model to go live');
});

test('a lab caught breaking the Geneva deal, or wrongly accused, gets the summit posts', () => {
  const state = stateOnDay();
  const rival = state.rivals[0];
  reactToEvents(state, state, [{ type: 'dealBreakCaught', party: rival.id, how: 'checks', level: 1 }]);
  runDays(state, 3);
  const caught = new Set(REACTIONS.summit.caught.map(([, text]) => text.replaceAll('{rival}', rival.name)));
  assert.ok(state.feed.length >= 1);
  assert.ok(state.feed.every((post) => caught.has(post.text)));

  const cleared = stateOnDay();
  reactToEvents(cleared, cleared, [{ type: 'investigated', party: rival.id, found: false, insulted: true, level: 0 }]);
  runDays(cleared, 3);
  const falseAlarm = new Set(REACTIONS.summit.falseAlarm.map(([, text]) => text.replaceAll('{rival}', rival.name)));
  assert.ok(cleared.feed.length >= 1);
  assert.ok(cleared.feed.every((post) => falseAlarm.has(post.text)));
});

test('a new run opens with the era-1 posts', async () => {
  const { advanceDays } = await import('../sim/turn.js');
  const { createRng } = await import('../sim/rng.js');
  const state = createInitialState({ seed: 5 });
  const out = advanceDays(state, 3, createRng(5)).state;
  const era1 = shown(REACTIONS.eras[1]);
  assert.ok([...out.feed, ...out.feedQueue].filter((post) => post.tag === 'era' && era1.has(post.text)).length >= 2);
});

test('the compute-supplier posts wait for the CoreFlame card to land', () => {
  const failed = shown(REACTIONS.company.computeFailed);
  const queued = stateOnDay();
  reactToEvents(queued, queued, [{ type: 'eventCard', id: 'neocloudTrouble' }]);
  runDays(queued, 3);
  assert.ok(!queued.feed.some((post) => failed.has(post.text)), 'nothing is said while the card is still on its way');
  const landed = stateOnDay();
  reactToLandedCard(landed, { id: 'neocloudTrouble' });
  runDays(landed, 2);
  assert.ok(landed.feed.some((post) => failed.has(post.text)));
});
