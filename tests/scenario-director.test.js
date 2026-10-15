import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIO_EVENTS } from '../sim/data/scenarioEvents.js';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { enableScenarios, scenarioEligible, scenarioTick } from '../sim/scenarios.js';
import { eventsTick, resolveEvent } from '../sim/events.js';
import { ROUND_DAYS } from '../sim/time.js';
import { startRun, advanceRunBy } from '../sim/training.js';
import { createGame } from '../ui/game.js';

const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data', 'stability'], mid: [], post: ['synthetic-sft', 'dpo', 'safety-tuning'] },
};

function richState(era = 1, seed = 1) {
  const state = enableScenarios(createInitialState({ seed }));
  state.era = era;
  state.cash = 10000;
  state.capability = 100;
  state.alignmentDebt = 60;
  state.staffTrust = 40;
  state.models = ['consumer', 'agentic'].map((channel) => ({ active: true, capability: 100, users: 10000000, channel, flags: ['scraped', 'jailbreakWaiting', 'sycophancy'] }));
  state.pendingModel = { capability: 100, flags: ['scraped'] };
  state.compute.online = 100;
  state.power.sites = [{ id: 'test-site', source: 'gas', online: true }];
  state.automation.offsets = { review: 3, experiments: 3, choosing: 3, direction: 3 };
  return state;
}

function schedule(era, seed) {
  const state = richState(era, seed);
  const cards = [];
  for (let day = 0; day < 4 * ROUND_DAYS[era]; day += 1) {
    state.day = day;
    state.turnInEra = Math.floor(day / ROUND_DAYS[era]);
    state.dayInRound = day % ROUND_DAYS[era];
    const events = scenarioTick(state);
    for (const event of events) cards.push({ id: event.id, day });
    state.pendingEvents = [];
  }
  return cards;
}

test('scenario selection and arrival days replay from the seed and vary across runs', () => {
  assert.deepEqual(schedule(1, 123), schedule(1, 123));
  const schedules = new Set(Array.from({ length: 12 }, (_, seed) => JSON.stringify(schedule(1, seed))));
  assert.ok(schedules.size > 1);
});

test('each era selects unique appropriate incidents when prerequisites are met: six or seven in the long eras 1 and 2, four or five after', () => {
  for (let era = 1; era <= 5; era += 1) {
    const [min, max] = era <= 2 ? [6, 7] : [4, 5];
    for (const seed of [1, 12, 83]) {
      const cards = schedule(era, seed);
      assert.ok(cards.length >= min && cards.length <= max, `era ${era}, seed ${seed}: ${cards.length}`);
      assert.equal(new Set(cards.map((card) => card.id)).size, cards.length);
      for (const card of cards) assert.ok(SCENARIO_EVENTS.find((row) => row.id === card.id).eras.includes(era));
    }
  }
});

test('in eras 1 and 2 no stretch without a scenario card runs much past a minute of clock (about 62 story days)', () => {
  for (const era of [1, 2]) {
    for (let seed = 1; seed <= 30; seed += 1) {
      const days = [0, ...schedule(era, seed).map((card) => card.day), 4 * ROUND_DAYS[era]];
      const longest = Math.max(...days.slice(1).map((day, i) => day - days[i]));
      assert.ok(longest <= 62, `era ${era}, seed ${seed}: ${longest} days`);
    }
  }
});

test('era 5 spreads its scenario cards over all four weeks, after the summit opens', () => {
  for (let seed = 1; seed <= 30; seed += 1) {
    const cards = schedule(5, seed);
    const weeks = new Set(cards.map((card) => Math.floor(card.day / 7)));
    assert.deepEqual([...weeks].sort(), [0, 1, 2, 3], `seed ${seed}: ${cards.map((card) => card.day)}`);
    assert.ok(cards[0].day >= 4, `seed ${seed}: the first card comes after the summit, day ${cards[0].day}`);
  }
});

// Review fix (2026-10-14): era 5's last card could land on day 26 with its deadline clamped to day 27, a one-day window.
test('no scenario card ever gets less than its era\'s normal answer window', () => {
  const normal = { 1: 21, 2: 21, 3: 10, 4: 10, 5: 3 };
  for (let era = 1; era <= 5; era += 1) {
    for (const holdOpen of [false, true]) {
      for (let seed = 1; seed <= 200; seed += 1) {
        const state = richState(era, seed);
        for (let day = 0; day < 4 * ROUND_DAYS[era]; day += 1) {
          state.day = day;
          state.turnInEra = Math.floor(day / ROUND_DAYS[era]);
          state.dayInRound = day % ROUND_DAYS[era];
          // An unanswered card stays until its deadline and holds the next one back; an answered one goes at once.
          state.pendingEvents = holdOpen ? state.pendingEvents.filter((card) => card.dueAt > day) : [];
          for (const event of scenarioTick(state)) {
            const card = state.pendingEvents.find((pending) => pending.id === event.id);
            assert.equal(card.dueAt - card.landsAt, normal[era], `era ${era}, seed ${seed}, day ${day}, held ${holdOpen}`);
            assert.ok(card.dueAt <= 4 * ROUND_DAYS[era] - 1, `era ${era}, seed ${seed}: due on the era's last day at the latest`);
          }
        }
      }
    }
  }
});

test('the pause coalition and White House commitments belong to era four, never era one', () => {
  const events = SCENARIO_EVENTS.filter((event) => /pause|white house/i.test(event.card.title));
  assert.ok(events.length >= 2);
  assert.ok(events.some((event) => /white house/i.test(event.card.title)));
  for (const event of events) {
    assert.equal(scenarioEligible(event, richState(1)), false, event.id);
    assert.ok(event.eras.every((era) => era >= 4), event.id);
  }
});

test('the director removes cards after the era or required deployment changes', () => {
  const state = richState(1);
  const empty = { ...state, models: [], pendingModel: null, activeRun: null };
  const conditional = SCENARIO_EVENTS.find((event) => scenarioEligible(event, state) && !scenarioEligible(event, empty));
  assert.ok(conditional, 'era one has a deployment-dependent incident');
  state.pendingEvents = [{ id: conditional.id }];
  state.models = [];
  state.pendingModel = null;
  scenarioTick(state);
  assert.equal(state.pendingEvents.some((event) => event.id === conditional.id), false);
  const firstEra = SCENARIO_EVENTS.find((event) => event.eras.includes(1) && !event.eras.includes(2));
  state.pendingEvents = [{ id: firstEra.id }];
  state.era = 2;
  scenarioTick(state);
  assert.equal(state.pendingEvents.some((event) => event.id === firstEra.id), false);
});

test('scenario mode suppresses historical cards while retaining training and internal incidents', () => {
  const state = richState(1);
  state.turnInEra = 1;
  state.activeRun = { spikes: 1, spikesAnswered: 0 };
  state.automation.stage = 2;
  state.automation.stageTurn = state.turn;
  eventsTick(state, createRng(2));
  assert.ok(state.pendingEvents.some((event) => event.id === 'lossSpike'));
  assert.ok(state.pendingEvents.some((event) => event.id === 'oversightTamper'));
  assert.equal(state.pendingEvents.some((event) => ['pauseLetter', 'whiteHouseCommitments'].includes(event.id)), false);
  assert.deepEqual(state.warnings, {});
});

test('unaffordable scenario responses leave the decision and cash untouched', () => {
  const state = richState(1);
  const event = SCENARIO_EVENTS.find((row) => scenarioEligible(row, state) && row.card.choices.some((choice) => choice.cashCost > 0));
  const choice = event.card.choices.find((row) => row.cashCost > 0);
  state.cash = choice.cashCost - 1;
  state.pendingEvents = [{ id: event.id }];
  const before = structuredClone(state);
  assert.equal(resolveEvent(state, event.id, choice.id).ok, false);
  assert.deepEqual(state, before);
});

test('a training pause prevents new runs and active progress until its deadline', () => {
  const state = createInitialState();
  state.flags.trainingPausedUntilDay = 10;
  const cash = state.cash;
  assert.equal(startRun(state, recipe).ok, false);
  assert.equal(state.cash, cash);
  state.day = 10;
  assert.equal(startRun(state, recipe).ok, true);
  state.flags.trainingPausedUntilDay = 20;
  const before = structuredClone(state.activeRun);
  assert.deepEqual(advanceRunBy(state, createRng(1), 0.1), { type: 'runPaused' });
  assert.deepEqual(state.activeRun, before);
  state.day = 20;
  advanceRunBy(state, createRng(1), 0.1);
  assert.ok(state.activeRun.turnsLeft < before.turnsLeft);
});

test('new gameplay enables scenarios while explicit debug states retain legacy events', () => {
  assert.equal(createGame({ seed: 8 }).state.eventMode, 'scenarios');
  assert.notEqual(createGame({ state: createInitialState() }).state.eventMode, 'scenarios');
  assert.equal(createGame({ state: createInitialState(), eventMode: 'scenarios' }).state.eventMode, 'scenarios');
});

test('every scenario has a free deadline fallback even when the lab has no cash', () => {
  for (const event of SCENARIO_EVENTS) {
    const fallback = event.card.choices.find((choice) => choice.id === event.fallback);
    assert.equal(fallback.cashCost, 0, event.id);
  }
});

test('accepting the era-four pause actually suspends active training', () => {
  const state = richState(1);
  state.pendingModel = null;
  assert.equal(startRun(state, recipe).ok, true);
  state.era = 4;
  const event = SCENARIO_EVENTS.find((row) => row.id === 'scenarioPauseLetter');
  const choice = event.card.choices.find((row) => /pause/i.test(row.label));
  assert.ok(choice);
  state.pendingEvents = [{ id: event.id }];
  assert.equal(resolveEvent(state, event.id, choice.id).ok, true);
  assert.ok(state.flags.trainingPausedUntilDay > state.day);
  const before = structuredClone(state.activeRun);
  assert.deepEqual(advanceRunBy(state, createRng(2), 0.1), { type: 'runPaused' });
  assert.deepEqual(state.activeRun, before);
});

test('free timeout responses still resolve when cash is negative', () => {
  const state = richState(1);
  const event = SCENARIO_EVENTS.find((row) => scenarioEligible(row, state));
  state.pendingEvents = [{ id: event.id, choices: event.card.choices }];
  state.cash = -10;
  assert.equal(resolveEvent(state, event.id, event.fallback).ok, true);
  assert.equal(state.pendingEvents.length, 0);
});
