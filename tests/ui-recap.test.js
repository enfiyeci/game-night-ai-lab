import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../sim/rng.js';
import { advanceDays, applyActions } from '../sim/turn.js';
import { ROUND_DAYS } from '../sim/time.js';
import { SCENARIO_EVENTS } from '../sim/data/scenarioEvents.js';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { BOARD_EVENTS } from '../sim/data/boardEvents.js';
import { REAL_EVENTS } from '../sim/data/realEvents.js';
import { SCENARIOS } from '../ui/logic/scenarios.js';
import { STORIES } from '../ui/data/recapCopy.js';
import { bigCalls, explainFor, recapModel, storyFor, verdictOf } from '../ui/logic/recap.js';

const scenario = (id) => SCENARIO_EVENTS.find((row) => row.id === id);
const card = (id, state, dueIn) => {
  const row = scenario(id);
  return { id, title: row.card.title, post: row.card.post, targets: [],
    choices: row.card.choices.map(({ effects, ...choice }) => choice), landsAt: state.day, dueAt: state.day + dueIn };
};

test('the decision log keeps a player answer through a whole round, and counts a deadline answer as automatic', () => {
  const rng = createRng(1);
  let state = SCENARIOS.scenarioEvent(1); // the jailbreak card is waiting on day 0, in scenario mode
  state.pendingEvents.push(card('scenarioPrivacy', state, 3));
  ({ state } = applyActions(state, { eventChoices: { scenarioJailbreak: 'monitor' } }, rng));
  assert.deepEqual(state.decisions.map(({ eventId, choiceId, auto, era, day }) => ({ eventId, choiceId, auto, era, day })),
    [{ eventId: 'scenarioJailbreak', choiceId: 'monitor', auto: false, era: 1, day: 0 }]);
  ({ state } = advanceDays(state, ROUND_DAYS[1], rng)); // past the round mark
  assert.equal(state.turn, 1);
  const privacy = state.decisions.find((decision) => decision.eventId === 'scenarioPrivacy');
  assert.equal(privacy.auto, true);
  assert.equal(privacy.choiceId, 'decline'); // the card's last free choice
  assert.equal(privacy.day, 3);
  assert.equal(state.decisions[0].label, 'Monitor for now');
  assert.deepEqual(structuredClone(state.decisions), state.decisions, 'plain data');
});

test('every scenario card choice has written copy, an explanation, and a verdict', () => {
  let written = 0;
  for (const row of SCENARIO_EVENTS) {
    assert.ok(STORIES[row.id]?.about, `${row.id} explanation`);
    for (const choice of row.card.choices) {
      const story = storyFor({ era: row.eras[0], day: 1, eventId: row.id, choiceId: choice.id, auto: false });
      assert.ok(story.written, `${row.id}.${choice.id}`);
      assert.ok(story.head && story.story, `${row.id}.${choice.id}`);
      assert.doesNotMatch(story.head + story.story, /[{}]/, `${row.id}.${choice.id} placeholders`);
      if (choice.cashCost > 0 && STORIES[row.id][choice.id][1].includes('{cost}')) assert.match(story.story, new RegExp(`\\$${choice.cashCost}M`));
      assert.ok(['paid', 'costing', 'mixed'].includes(story.verdict));
      written += 1;
    }
  }
  assert.equal(written, 150);
});

test('verdicts follow the choice’s real effects', () => {
  assert.equal(verdictOf('scenarioCitations', 'verify'), 'paid'); // trust up; the $4M is the price
  assert.equal(verdictOf('scenarioJailbreak', 'monitor'), 'costing'); // trust down, misuse risk up
  assert.equal(verdictOf('scenarioLaunchQueue', 'waitlist'), 'mixed'); // users down, trust up
  assert.equal(verdictOf('scenarioPauseLetter', 'pause'), 'mixed'); // trust up, training held
  for (const row of [...EVENTS, ...EVENTS_6C, ...BOARD_EVENTS, ...REAL_EVENTS]) {
    for (const choice of row.card.choices) assert.ok(['paid', 'costing', 'mixed'].includes(verdictOf(row.id, choice.id)), `${row.id}.${choice.id}`);
  }
});

test('a card without written copy prints its title over its consequence line, or over the choice', () => {
  const story = storyFor({ era: 2, day: 400, eventId: 'boardWobble', choiceId: 'plan', auto: true, title: 'The growth investor had a bad quarter', label: 'Walk him through the long plan' });
  assert.equal(story.head, 'The growth investor had a bad quarter');
  assert.equal(story.story, 'You walked the growth investor through the long plan. He nodded, mostly.'); // eventCopy.js CONSEQUENCES
  assert.match(story.auto, /Nobody answered in time, so the lab went with “Walk him through the long plan”/);
  const bare = storyFor({ era: 2, day: 400, eventId: 'aNewCard', choiceId: 'yes', auto: false, title: 'A new card', label: 'Say yes' });
  assert.equal(bare.head, 'A new card');
  assert.equal(bare.story, 'Faced with “A new card”, the lab chose “Say yes”.');
  const explain = explainFor({ eventId: 'scenarioJailbreak', choiceId: 'monitor' });
  assert.match(explain.about, /jailbreak/);
  assert.ok(explain.lines.some((line) => /Tomas and Priya would have chosen “Patch and retest” \(\$5M\)/.test(line)));
  assert.ok(explain.lines.some((line) => /Margot backed your call/.test(line)));
});

test('the big calls: scenario and crisis cards first, then the biggest price, then most sides; skip trivial ones; date order', () => {
  const d = (eventId, day, choiceId) => ({ era: 1, day, eventId, choiceId, auto: false });
  const decisions = [
    d('boardWobble', 5, 'plan'), // a board card: after every scenario card
    d('scenarioDemoCost', 50, 'profile'), // biggest price $4
    d('scenarioCitations', 20, 'verify'), // biggest price $4, more sides than DemoCost
    d('scenarioJailbreak', 80, 'patch'), // biggest price $5
    d('scenarioLaunchQueue', 10, 'support'), // biggest price $3
    d('promiseCall', 2, 'deliver'), // no cash and no leads on any choice: trivial
  ];
  assert.deepEqual(bigCalls(decisions).map((item) => item.eventId), ['scenarioCitations', 'scenarioDemoCost', 'scenarioJailbreak']);
  assert.deepEqual(bigCalls([d('boardWobble', 5, 'plan'), d('promiseCall', 2, 'deliver')]).map((item) => item.eventId), ['boardWobble']);
  assert.deepEqual(bigCalls([]), []);
});

test('the era page reads only the era that ended and never names a later era’s content', () => {
  const state = SCENARIOS.scenarioEvent(1);
  state.labName = 'Northwind';
  state.decisions = [
    { era: 1, day: 30, eventId: 'scenarioJailbreak', choiceId: 'monitor', auto: false, title: null, label: 'Monitor for now' },
    { era: 1, day: 120, eventId: 'scenarioCitations', choiceId: 'verify', auto: true, title: null, label: 'Build citation checks' },
    { era: 2, day: 400, eventId: 'scenarioDelivery', choiceId: 'wait', auto: false, title: null, label: 'Wait for the supplier' },
  ];
  state.day = 364;
  const model = recapModel(state, 1);
  assert.deepEqual(model.stories.map((story) => story.eventId), ['scenarioJailbreak', 'scenarioCitations']);
  assert.equal(model.next, 'Turn the page: era 2 →');
  assert.deepEqual(model.dateline, ['Year in review · 2023', 'Northwind edition', 'Era 1 · Chat assistants']);
  assert.match(model.headline, /^Northwind ends 2023 /);
  assert.match(model.dek, /one paid off and one is still costing it/);
  assert.equal(model.critics.length, 4);
  assert.ok(model.critics.find((critic) => critic.role === 'safety').text.includes('Monitor for now'));
  assert.doesNotMatch(JSON.stringify(model), /agent|reasoning|gigawatt|Self-improvement|scale-up/i);
});

test('the critics and the click-to-explain lines are the leads the player hired, by name and face', () => {
  const state = SCENARIOS.scenarioEvent(1);
  state.labName = 'Northwind';
  state.leads = { research: 'dev', safety: 'hana', cfo: 'rafael', policy: 'amara' };
  state.decisions = [
    { era: 1, day: 30, eventId: 'scenarioJailbreak', choiceId: 'monitor', auto: false, title: null, label: 'Monitor for now' },
    { era: 1, day: 120, eventId: 'scenarioCitations', choiceId: 'verify', auto: true, title: null, label: 'Build citation checks' },
  ];
  state.day = 364;
  const model = recapModel(state, 1);
  assert.deepEqual(model.critics.map((critic) => [critic.role, critic.name, critic.look]), [
    ['safety', 'Hana', 'lead-hana'], ['research', 'Dev', 'lead-dev'], ['cfo', 'Rafael', 'lead-rafael'], ['policy', 'Amara', 'lead-amara'],
  ]);
  assert.doesNotMatch(JSON.stringify(model), /\b(Tomas|Priya|Margot|Jules)\b/);
  const today = recapModel({ ...state, leads: undefined }, 1);
  assert.deepEqual(today.critics.map((critic) => critic.name), ['Tomas', 'Priya', 'Margot', 'Jules']);
});
