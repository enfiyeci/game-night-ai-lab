import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, addressWarning, isAnchorId, resolveEvent, stampNewCards } from '../sim/events.js';
import { EVENTS } from '../sim/data/events.js';
import { advanceDays, endTurn } from '../sim/turn.js';
import { jobLevels } from '../sim/automation.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const nonAnchors = (state) => state.pendingEvents.filter((event) => !isAnchorId(event.eventId ?? event.id));
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
  assert.equal(nonAnchors(s).length, 0);
  assert.equal(s.feed.at(-1).handle, '@devnull_ops');
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(nonAnchors(s)[0].id, 'jailbreak');
  assert.equal(nonAnchors(s)[0].choices.length, 3);
});

test('acting on the warning is cheap and defuses the card', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no);
  const cash = s.cash;
  assert.equal(addressWarning(s, 'jailbreak').ok, true);
  assert.equal(s.cash, cash - 5);
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(nonAnchors(s).length, 0);
  assert.ok(!s.models[0].flags.includes('jailbreakWaiting'));
});

test('resolving a card applies its effects and removes it', () => {
  const s = withFlag('jailbreakWaiting');
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  const cash = s.cash;
  assert.equal(resolveEvent(s, 'jailbreak', 'patch').ok, true);
  assert.equal(s.cash, cash - 4);
  assert.equal(nonAnchors(s).length, 0);
  assert.equal(resolveEvent(s, 'jailbreak', 'patch').ok, false);
});

test('at most two cards wait at once, and unanswered cards use passive fallbacks', () => {
  const s = withFlag('jailbreakWaiting');
  s.models[0].flags.push('hallucination', 'contaminated');
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  assert.equal(nonAnchors(s).length, 2);
  assert.ok(s.warnings.contamination, 'the third warning waits instead of being dropped');
  stampNewCards(s);
  const days = Math.max(...nonAnchors(s).map((event) => event.dueAt)) - s.day;
  const out = advanceDays(s, days, no);
  const auto = out.events
    .filter((event) => event.type === 'eventResolved' && event.auto && !isAnchorId(event.id))
    .map(({ id, choiceId }) => ({ id, choiceId }))
    .sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(auto, [
    { id: 'citations', choiceId: 'blame' },
    { id: 'jailbreak', choiceId: 'deny' },
  ]);
});

test('an internal stage-2 incident becomes the oversight card', () => {
  const s = createInitialState();
  s.automation.stage = 2; s.automation.stageTurn = 0;
  eventsTick(s, no);
  assert.equal(nonAnchors(s)[0].id, 'oversightTamper');
});

test('addressWarning cannot target an internal incident', () => {
  const s = createInitialState();
  s.automation.stage = 2; s.automation.stageTurn = 0;
  eventsTick(s, no);
  assert.equal(addressWarning(s, 'oversightTamper').ok, false);
  assert.equal(nonAnchors(s)[0].id, 'oversightTamper');
});

test('event and warning ids do not match inherited object properties', () => {
  const s = withFlag('jailbreakWaiting');
  assert.equal(addressWarning(s, 'toString').ok, false);
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  const inherited = Object.create({ jailbreak: 'patch' });
  stampNewCards(s);
  const acted = endTurn(s, { eventChoices: inherited }, no);
  const out = acted.events.some((event) => event.type === 'eventResolved')
    ? acted : advanceDays(acted.state, nonAnchors(acted.state)[0].dueAt - acted.state.day, no);
  const auto = out.events.find((event) => event.type === 'eventResolved' && event.id === 'jailbreak');
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

test('reporting a self-copy applies its public effects', () => {
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
  resolveEvent(s, 'openletter', 'adopt');
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
  const out = endTurn(s, { budget, computeSplit: { safety: 0.2 }, eventChoices: { openletter: 'adopt' } }, no);
  assert.ok(Math.abs(out.state.budget.split.training - 0.5) < 1e-12);
  assert.ok(Math.abs(out.state.compute.split.safety - 0.3) < 1e-12);
});

test('the Qilin shock is anchored at the start of era 3', () => {
  const s = createInitialState();
  s.era = 2;
  s.turnInEra = 3;
  s.turn = 7;
  const out = endTurn(s, {}, no);
  assert.equal(out.state.era, 3);
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
  assert.equal(nonAnchors(out.state)[0].id, 'oversightTamper');
  assert.equal(out.state.warnings.citations.deferred, true);
});

test('the Qilin shock bypasses a full queue and cannot be addressed', () => {
  const s = createInitialState();
  s.era = 2;
  s.turnInEra = 3;
  s.turn = 7;
  s.pendingEvents.push({ id: 'jailbreak' }, { id: 'citations' });
  eventsTick(s, no);
  assert.equal(s.pendingEvents.some((event) => event.id === 'qilinshock'), true);
  assert.equal(Object.hasOwn(s.warnings, 'qilinshock'), false);
  assert.equal(addressWarning(s, 'qilinshock').ok, false);
});

test('simultaneous flagged-model outcomes do not depend on eventChoices key order', () => {
  const resolveBoth = (eventChoices) => {
    const s = withFlag('sycophancy');
    s.era = 3; // flattery fires from era 3, the companion suit from era 2: both are live here
    s.seenEvents.push('political', 'exitGag', 'hateMeltdown'); // era 3 cards that would otherwise take the two slots
    eventsTick(s, no);
    s.turn += 1;
    eventsTick(s, no);
    assert.deepEqual(s.pendingEvents.map((card) => card.id).filter((id) => !isAnchorId(id)).sort(), ['companion', 'flattery']);
    const next = endTurn(s, { eventChoices }, no).state;
    assert.ok(['flattery', 'companion'].every((id) => !next.pendingEvents.some((card) => card.id === id)));
    return next.models[0].users;
  };
  const catalogOrder = resolveBoth({ flattery: 'rollback', companion: 'settle' });
  const reverseOrder = resolveBoth({ companion: 'settle', flattery: 'rollback' });
  assert.equal(catalogOrder, 707804);
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

test('the forum breach triggers only at the capability and security thresholds and its chance succeeds', () => {
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

test('the forum breach warns first and becomes a one-shot card the next turn', () => {
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
  assert.equal(card.title, 'A hacker got into your internal forum');
  assert.equal(card.post.handle, '@your_security');
  assert.equal(state.seenEvents.includes('weightTheft'), true);
});

test('addressing the forum-breach warning also raises security', () => {
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

test('forum-breach choices apply their response without stealing weights', () => {
  const cases = [
    ['report', { gov: 5, public: -3, staff: 0, security: 10, coverUp: false, hidden: false }],
    ['staffonly', { gov: 0, public: 0, staff: -2, security: 5, coverUp: false, hidden: true }],
    ['silent', { gov: 0, public: 0, staff: 0, security: 0, coverUp: true, hidden: false }],
  ];
  for (const [choiceId, effects] of cases) {
    const state = createInitialState();
    state.misuseExposure = 20;
    state.misuseLocked = 25;
    const qilin = state.rivals.find((rival) => rival.id === 'qilin');
    state.pendingEvents.push({ id: 'weightTheft' });
    const before = {
      gov: state.govFavor.us,
      public: state.publicTrust,
      staff: state.staffTrust,
      security: state.security,
      qilin: qilin.capability,
    };
    assert.equal(resolveEvent(state, 'weightTheft', choiceId).ok, true);
    assert.equal(state.misuseExposure, 20, choiceId);
    assert.equal(state.misuseLocked, 25, choiceId);
    assert.equal(qilin.capability, before.qilin, choiceId);
    assert.equal(state.govFavor.us, before.gov + effects.gov, choiceId);
    assert.equal(state.publicTrust, before.public + effects.public, choiceId);
    assert.equal(state.staffTrust, before.staff + effects.staff, choiceId);
    assert.equal(state.security, before.security + effects.security, choiceId);
    assert.equal(state.flags.coverUp === true, effects.coverUp, choiceId);
    assert.equal(state.flags.forumBreachHidden === true, effects.hidden, choiceId);
  }
});

test('an unanswered forum breach falls back to silence without stealing weights', () => {
  const state = createInitialState();
  state.misuseExposure = 20;
  state.misuseLocked = 40;
  const qilin = state.rivals.find((rival) => rival.id === 'qilin');
  const beforeQilin = qilin.capability;
  state.pendingEvents.push({ id: 'weightTheft' });
  stampNewCards(state);
  const card = state.pendingEvents.find((event) => event.id === 'weightTheft');
  const out = advanceDays(state, card.dueAt - state.day, no);
  assert.equal(out.state.flags.coverUp, true);
  assert.equal(out.state.misuseExposure, 20);
  assert.equal(out.state.misuseLocked, 40);
  assert.equal(out.state.rivals.find((rival) => rival.id === 'qilin').capability, beforeQilin);
  assert.equal(out.events.find((event) => event.id === 'weightTheft')?.choiceId, 'silent');
});
