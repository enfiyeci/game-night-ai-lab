import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { SCENARIO_EVENTS } from '../sim/data/scenarioEvents.js';

const event = (id) => SCENARIO_EVENTS.find((item) => item.id === `scenario${id}`);
const released = (channel = 'consumer') => ({
  active: true, superseded: false, activeFromTurn: 0, channel, users: 2e6,
  flags: ['scraped', 'jailbreakWaiting', 'hallucination', 'contaminated'],
});
function ready(era) {
  const state = createInitialState();
  state.era = era;
  state.capability = 65;
  state.models = [released(), released('agent')];
  state.pendingModel = { capability: 70, flags: ['scraped'] };
  state.power.sites = [{ source: 'gas', online: false }];
  state.flags.conversionDeadline = 0;
  return state;
}

test('catalogue offers ten era-specific scenarios per era with affordable passive fallbacks', () => {
  assert.equal(SCENARIO_EVENTS.length, 50);
  assert.equal(new Set(SCENARIO_EVENTS.map((item) => item.id)).size, 50);
  for (let era = 1; era <= 5; era += 1) {
    assert.equal(SCENARIO_EVENTS.filter((item) => item.eras.includes(era)).length, 10);
  }
  for (const item of SCENARIO_EVENTS) {
    assert.equal(item.card.choices.length, 3, item.id);
    assert.equal(item.card.choices.find((pick) => pick.id === item.fallback).cashCost, 0, item.id);
    for (const pick of item.card.choices) {
      if (pick.cashCost > 0) assert.ok(pick.cost.startsWith(`$${pick.cashCost}M: `), item.id);
    }
  }
});

test('each scenario has reachable prerequisites and a strict era boundary', () => {
  for (const item of SCENARIO_EVENTS) {
    const era = item.eras[0];
    const state = ready(era);
    const before = structuredClone(state);
    assert.equal(item.trigger(state), true, `${item.id} must be reachable`);
    assert.deepEqual(state, before, `${item.id} eligibility must not mutate state`);
    for (let other = 1; other <= 5; other += 1) {
      if (other !== era) assert.equal(item.trigger(ready(other)), false, `${item.id} in era ${other}`);
    }
  }
});

test('agent incidents require a released agent and do not target unreleased or retired products', () => {
  const state = ready(3);
  const incident = event('AgentDatabase');
  assert.equal(incident.trigger(state), true);
  state.models = [released()];
  assert.equal(incident.trigger(state), false);
  state.models.push({ ...released('agent'), activeFromTurn: state.turn + 1 });
  assert.equal(incident.trigger(state), false);
  state.models[1].activeFromTurn = 0;
  state.models[1].superseded = true;
  assert.equal(incident.trigger(state), false);
  state.models[1].superseded = false;
  state.models[1].channel = 'enterprise';
  state.models[1].flags.push('agentic');
  assert.equal(incident.trigger(state), true);
});

test('grid and government scenarios require the relevant footprint', () => {
  const state = ready(4);
  state.power.sites = [];
  for (const id of ['GridConflict', 'GridDelay', 'GeneratorDispute']) assert.equal(event(id).trigger(state), false);
  state.capability = 5;
  state.models = [];
  for (const id of ['PauseLetter', 'WhiteHouse', 'GovernmentTests']) assert.equal(event(id).trigger(state), false);
  state.models = [released()];
  assert.equal(event('WhiteHouse').trigger(state), true);
});

test('every choice applies its stated cash cost and leaves numeric state finite', () => {
  for (const item of SCENARIO_EVENTS) {
    for (const pick of item.card.choices) {
      const state = ready(item.eras[0]);
      const cash = state.cash;
      pick.effects(state);
      assert.equal(state.cash, cash - pick.cashCost, `${item.id}/${pick.id}`);
      for (const key of ['publicTrust', 'staffTrust', 'security', 'alignmentDebt', 'concealedDebt', 'misuseExposure', 'researchPoints', 'raceHeat']) {
        assert.ok(Number.isFinite(state[key]), `${item.id}/${pick.id}: ${key}`);
        assert.ok(state[key] >= 0, `${item.id}/${pick.id}: negative ${key}`);
      }
    }
  }
});

test('pause decisions create the advertised hold and never shorten an existing hold', () => {
  const state = ready(4);
  state.day = 20;
  event('PauseLetter').card.choices.find((pick) => pick.id === 'pause').effects(state);
  assert.equal(state.flags.trainingPausedUntilDay, 50);
  event('PauseLetter').card.choices.find((pick) => pick.id === 'review').effects(state);
  assert.equal(state.flags.trainingPausedUntilDay, 50);
  state.era = 5;
  state.day = 70;
  event('ContinueResearch').card.choices.find((pick) => pick.id === 'pause').effects(state);
  assert.equal(state.flags.trainingPausedUntilDay, 77);
});

test('jailbreak repair closes the affected exploit without clearing unrelated risks', () => {
  const state = ready(1);
  event('Jailbreak').card.choices.find((pick) => pick.id === 'patch').effects(state);
  assert.equal(state.models[0].flags.includes('jailbreakWaiting'), false);
  assert.equal(state.models[0].flags.includes('hallucination'), true);
  assert.equal(state.misuseExposure, 0);
});
