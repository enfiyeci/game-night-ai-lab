import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, addressWarning, resolveEvent, stampNewCards } from '../sim/events.js';
import { EVENTS } from '../sim/data/events.js';
import { advanceDays, endTurn } from '../sim/turn.js';
import { jobLevels } from '../sim/automation.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const withFlag = (flag, extra = {}) => {
  const s = createInitialState();
  const spec = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, channel: 'consumer', reasoning: 'off' };
  s.models.push({ name: 'Kestrel 1 Core', active: true, activated: true, activeFromTurn: 0, channel: 'consumer', flags: [flag], users: 1e6, userCap: 4e6, priceStance: 'market', spec, ...extra });
  return s;
};

test('a planted flag first shows a warning, then a card the next turn', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no);
  assert.ok(s.warnings.jailbreak);
  assert.equal(s.pendingEvents.length, 0);
  assert.equal(s.feed.at(-1).handle, '@devnull_ops');
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'jailbreak');
  assert.equal(s.pendingEvents[0].choices.length, 3);
});

test('acting on the warning is cheap and defuses the card', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no);
  const cash = s.cash;
  assert.equal(addressWarning(s, 'jailbreak').ok, true);
  assert.equal(s.cash, cash - 5);
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.length, 0);
  assert.ok(!s.models[0].flags.includes('jailbreakWaiting'));
});

test('resolving a card applies its effects and removes it', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  const cash = s.cash;
  assert.equal(resolveEvent(s, 'jailbreak', 'patch').ok, true);
  assert.equal(s.cash, cash - 4);
  assert.equal(s.pendingEvents.length, 0);
  assert.equal(resolveEvent(s, 'jailbreak', 'patch').ok, false);
});

test('at most two cards wait at once, and unanswered cards use passive fallbacks', () => {
  const s = withFlag('jailbreakWaiting');
  s.models[0].flags.push('hallucination', 'contaminated');
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  assert.equal(s.pendingEvents.length, 2);
  assert.ok(s.warnings.contamination, 'the third warning waits instead of being dropped');
  stampNewCards(s);
  const days = Math.max(...s.pendingEvents.map((event) => event.dueAt)) - s.day;
  const out = advanceDays(s, days, no);
  const auto = out.events.filter((e) => e.type === 'eventResolved' && e.auto);
  assert.deepEqual(auto.map((e) => e.choiceId), ['deny', 'blame']);
});

test('an internal stage-2 incident becomes the oversight card', () => {
  const s = createInitialState();
  s.automation.stage = 2; s.automation.stageTurn = 0;
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'oversightTamper');
});

test('addressWarning cannot target an internal incident', () => {
  const s = createInitialState();
  s.automation.stage = 2; s.automation.stageTurn = 0;
  eventsTick(s, no);
  assert.equal(addressWarning(s, 'oversightTamper').ok, false);
  assert.equal(s.pendingEvents[0].id, 'oversightTamper');
});

test('event and warning ids do not match inherited object properties', () => {
  const s = withFlag('jailbreakWaiting');
  assert.equal(addressWarning(s, 'toString').ok, false);
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  const inherited = Object.create({ jailbreak: 'patch' });
  stampNewCards(s);
  const acted = endTurn(s, { eventChoices: inherited }, no);
  const out = acted.events.some((event) => event.type === 'eventResolved')
    ? acted : advanceDays(acted.state, acted.state.pendingEvents[0].dueAt - acted.state.day, no);
  const auto = out.events.find((event) => event.type === 'eventResolved');
  assert.equal(auto.choiceId, 'deny');
});

test('ladder cards act on the hand-offs: hand back, or add a monitor only if the compute fits', () => {
  const s = createInitialState();
  s.era = 4;
  s.automation.stage = 2;
  s.pendingEvents.push({ id: 'oversightTamper' });
  assert.equal(resolveEvent(s, 'oversightTamper', 'shutdown').ok, true);
  assert.deepEqual(jobLevels(s), [3, 0, 0, 0, 0]);
  assert.equal(s.automation.stage, 2);

  const room = createInitialState();
  room.era = 4;
  room.compute.online = 200;
  room.pendingEvents.push({ id: 'oversightTamper' });
  const roomCash = room.cash;
  resolveEvent(room, 'oversightTamper', 'controls');
  assert.equal(room.automation.checks.monitors, 1);
  assert.equal(room.cash, roomCash - 20);

  const blocked = createInitialState();
  blocked.era = 4;
  blocked.compute.online = 0;
  blocked.pendingEvents.push({ id: 'oversightTamper' });
  const cash = blocked.cash;
  resolveEvent(blocked, 'oversightTamper', 'controls');
  assert.equal(blocked.automation.checks.monitors, 0);
  assert.equal(blocked.cash, cash);
});

test('internal reporting still applies public effects after an earlier shutdown', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'selfExfiltration' });
  resolveEvent(s, 'selfExfiltration', 'report');
  assert.equal(s.govFavor.us, 56);
  assert.equal(s.publicTrust, 56);
});

test('catalog events adjust safety compute and undercut active models', () => {
  const s = createInitialState();
  s.compute.split.safety = 0.46;
  s.pendingEvents.push({ id: 'openletter' });
  resolveEvent(s, 'openletter', 'meet');
  assert.equal(s.compute.split.safety, 0.5);

  s.models.push({ active: true, priceStance: 'premium' }, { active: false, priceStance: 'market' });
  s.pendingEvents.push({ id: 'qilinshock' });
  resolveEvent(s, 'qilinshock', 'cutprices');
  assert.deepEqual(s.models.map((model) => model.priceStance), ['undercut', 'market']);
});

test('the open-letter meeting adjusts the compute split submitted on the same turn', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'openletter' });
  const budget = { spend: 20, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } };
  const out = endTurn(s, { budget, computeSplit: { safety: 0.2 }, eventChoices: { openletter: 'meet' } }, no);
  assert.ok(Math.abs(out.state.budget.split.training - 0.5) < 1e-12);
  assert.ok(Math.abs(out.state.compute.split.safety - 0.3) < 1e-12);
});

test('rival releases are stored and a Qilin release triggers its card', () => {
  const s = createInitialState();
  s.era = 2;
  s.rivals.find((rival) => rival.id === 'qilin').progress = 1;
  const out = endTurn(s, {}, no);
  assert.equal(out.state.lastRivalReleases.some((release) => release.id === 'qilin'), true);
  assert.equal(out.state.pendingEvents.some((event) => event.id === 'qilinshock'), true);
});

test('event lawsuits use the event id and relative due turn', () => {
  const s = createInitialState();
  s.turn = 7;
  s.pendingEvents.push({ id: 'distill' });
  resolveEvent(s, 'distill', 'deny');
  assert.deepEqual(s.legalCases.at(-1), { cost: 150, dueTurn: 15, source: 'distill' });
});

test('internal incidents take priority when two warnings mature on the escalation turn', () => {
  const s = withFlag('jailbreakWaiting');
  s.models[0].flags.push('hallucination');
  s.era = 3;
  s.turn = 1;
  s.warnings.jailbreak = { turn: 0 };
  s.warnings.citations = { turn: 0 };
  s.automation.stage = 1; s.automation.stageTurn = 0;
  const out = endTurn(s, {}, yes);
  assert.equal(out.state.automation.stage, 2);
  assert.equal(out.state.pendingEvents[0].id, 'oversightTamper');
  assert.equal(out.state.warnings.citations.deferred, true);
});

test('a Qilin shock blocked by a full queue is deferred and cannot be addressed', () => {
  const s = createInitialState();
  s.era = 2;
  s.pendingEvents.push({ id: 'jailbreak' }, { id: 'citations' });
  s.lastRivalReleases = [{ id: 'qilin', gain: 6 }];
  eventsTick(s, no);
  assert.deepEqual(s.warnings.qilinshock, { turn: 0, deferred: true });
  assert.equal(addressWarning(s, 'qilinshock').ok, false);
  s.pendingEvents.shift();
  s.lastRivalReleases = [];
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.at(-1).id, 'qilinshock');
});

test('simultaneous flagged-model outcomes do not depend on eventChoices key order', () => {
  const resolveBoth = (eventChoices) => {
    const s = withFlag('sycophancy');
    eventsTick(s, no);
    s.turn += 1;
    eventsTick(s, no);
    return endTurn(s, { eventChoices }, no).state.models[0].users;
  };
  const catalogOrder = resolveBoth({ flattery: 'rollback', companion: 'settle' });
  const reverseOrder = resolveBoth({ companion: 'settle', flattery: 'rollback' });
  assert.equal(catalogOrder, 767040);
  assert.equal(reverseOrder, catalogOrder);
});

test('a staged sycophantic release does not trigger flattery before it is live', () => {
  const s = withFlag('sycophancy', { activeFromTurn: 2 });
  eventsTick(s, no);
  assert.equal(Object.hasOwn(s.warnings, 'flattery'), false);
});

test('customer incidents ignore staged and superseded models', () => {
  const staged = withFlag('jailbreakWaiting', { activeFromTurn: 2 });
  eventsTick(staged, no);
  assert.equal(Object.hasOwn(staged.warnings, 'jailbreak'), false);

  const superseded = withFlag('hallucination', { active: false, superseded: true });
  eventsTick(superseded, no);
  assert.equal(Object.hasOwn(superseded.warnings, 'citations'), false);
});

test('weight theft triggers only at the capability and security thresholds and its chance succeeds', () => {
  const event = EVENTS.find((candidate) => candidate.id === 'weightTheft');
  let rolls = 0;
  const rng = { chance: (probability) => { rolls += 1; assert.equal(probability, 0.2); return true; } };

  const eligible = createInitialState();
  eligible.capability = 50;
  eligible.security = 44;
  assert.equal(event.trigger(eligible, rng), true);
  assert.equal(rolls, 1);

  const lowCapability = createInitialState();
  lowCapability.capability = 49;
  lowCapability.security = 44;
  assert.equal(event.trigger(lowCapability, rng), false);
  const secure = createInitialState();
  secure.capability = 50;
  secure.security = 45;
  assert.equal(event.trigger(secure, rng), false);
  assert.equal(rolls, 1);

  assert.equal(event.trigger(eligible, { chance: () => false }), false);
});

test('weight theft warns first and becomes a one-shot card the next turn', () => {
  const state = createInitialState();
  state.capability = 50;
  state.security = 44;
  eventsTick(state, yes);
  assert.deepEqual(state.warnings.weightTheft, { turn: 0 });
  assert.equal(state.feed.at(-1).handle, '@your_security');
  assert.equal(state.pendingEvents.some((event) => event.id === 'weightTheft'), false);

  state.turn += 1;
  eventsTick(state, yes);
  const card = state.pendingEvents.find((event) => event.id === 'weightTheft');
  assert.equal(card.title, 'Weights stolen by a foreign state');
  assert.equal(card.post.handle, '@newsdesk');
  assert.equal(state.seenEvents.includes('weightTheft'), true);
});

test('addressing the weight-theft warning also raises security', () => {
  const state = createInitialState();
  state.era = 3;
  state.capability = 50;
  state.security = 40;
  eventsTick(state, yes);
  const cash = state.cash;
  assert.equal(addressWarning(state, 'weightTheft').ok, true);
  assert.equal(state.cash, cash - 15);
  assert.equal(state.security, 50);
  assert.equal(state.seenEvents.includes('weightTheft'), true);
});

test('every weight-theft choice steals and locks the weights before its response', () => {
  const cases = [
    ['report', { cash: 0, gov: 5, public: -5, security: 10, coverUp: false }],
    ['hunt', { cash: -30, gov: 0, public: 0, security: 15, coverUp: false }],
    ['silence', { cash: 0, gov: 0, public: 0, security: 0, coverUp: true }],
  ];
  for (const [choiceId, effects] of cases) {
    const state = createInitialState();
    state.misuseExposure = 20;
    state.misuseLocked = 25;
    const qilin = state.rivals.find((rival) => rival.id === 'qilin');
    state.pendingEvents.push({ id: 'weightTheft' });
    const before = {
      cash: state.cash,
      gov: state.govFavor.us,
      public: state.publicTrust,
      security: state.security,
      qilin: qilin.capability,
    };
    assert.equal(resolveEvent(state, 'weightTheft', choiceId).ok, true);
    assert.equal(state.misuseExposure, 30, choiceId);
    assert.equal(state.misuseLocked, 30, choiceId);
    assert.equal(qilin.capability, before.qilin + 5, choiceId);
    assert.equal(state.cash, before.cash + effects.cash, choiceId);
    assert.equal(state.govFavor.us, before.gov + effects.gov, choiceId);
    assert.equal(state.publicTrust, before.public + effects.public, choiceId);
    assert.equal(state.security, before.security + effects.security, choiceId);
    assert.equal(state.flags.coverUp === true, effects.coverUp, choiceId);
  }
});

test('unanswered weight theft falls back to silence and preserves a higher misuse lock', () => {
  const state = createInitialState();
  state.misuseExposure = 20;
  state.misuseLocked = 40;
  const qilin = state.rivals.find((rival) => rival.id === 'qilin');
  const beforeQilin = qilin.capability;
  state.pendingEvents.push({ id: 'weightTheft' });
  stampNewCards(state);
  const out = advanceDays(state, state.pendingEvents[0].dueAt - state.day, no);
  assert.equal(out.state.flags.coverUp, true);
  assert.equal(out.state.misuseExposure, 30);
  assert.equal(out.state.misuseLocked, 40);
  assert.equal(out.state.rivals.find((rival) => rival.id === 'qilin').capability, beforeQilin + 5);
  assert.equal(out.events.find((event) => event.id === 'weightTheft')?.choiceId, 'silence');
});
