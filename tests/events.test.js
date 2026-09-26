import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, addressWarning, resolveEvent } from '../sim/events.js';
import { endTurn } from '../sim/turn.js';

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
  const out = endTurn(s, {}, no);
  const auto = out.events.filter((e) => e.type === 'eventResolved' && e.auto);
  assert.deepEqual(auto.map((e) => e.choiceId), ['deny', 'blame']);
});

test('an internal stage-2 incident becomes the oversight card', () => {
  const s = createInitialState();
  s.internal = { control: 0, stage: 2, turns: 1, stageTurn: 0 };
  eventsTick(s, no);
  assert.equal(s.pendingEvents[0].id, 'oversightTamper');
});

test('addressWarning cannot target an internal incident', () => {
  const s = createInitialState();
  s.internal = { control: 0, stage: 2, turns: 1, stageTurn: 0 };
  eventsTick(s, no);
  assert.equal(addressWarning(s, 'oversightTamper').ok, false);
  assert.equal(s.pendingEvents[0].id, 'oversightTamper');
});

test('event and warning ids do not match inherited object properties', () => {
  const s = withFlag('jailbreakWaiting');
  assert.equal(addressWarning(s, 'toString').ok, false);
  eventsTick(s, no); s.turn += 1; eventsTick(s, no);
  const inherited = Object.create({ jailbreak: 'patch' });
  const out = endTurn(s, { eventChoices: inherited }, no);
  const auto = out.events.find((event) => event.type === 'eventResolved');
  assert.equal(auto.choiceId, 'deny');
});

test('internal incident choices preserve escalation and enforce control compute', () => {
  const s = createInitialState();
  s.era = 3;
  s.models.push({ capability: 60 });
  s.internal = { control: 0, stage: 2, turns: 1 };
  s.pendingEvents.push({ id: 'oversightTamper' });
  assert.equal(resolveEvent(s, 'oversightTamper', 'shutdown').ok, true);
  assert.equal(s.internal, null);
  assert.equal(s.flags.internalStage, 2);

  const blocked = createInitialState();
  blocked.era = 3;
  blocked.models.push({ capability: 60 });
  blocked.compute.online = 0;
  blocked.internal = { control: 0, stage: 2, turns: 1 };
  blocked.pendingEvents.push({ id: 'oversightTamper' });
  const cash = blocked.cash;
  resolveEvent(blocked, 'oversightTamper', 'controls');
  assert.equal(blocked.internal.control, 0);
  assert.equal(blocked.cash, cash);
});

test('internal reporting still applies public effects after an earlier shutdown', () => {
  const s = createInitialState();
  s.internal = null;
  s.pendingEvents.push({ id: 'selfExfiltration' });
  resolveEvent(s, 'selfExfiltration', 'report');
  assert.equal(s.govFavor.us, 56);
  assert.equal(s.publicTrust, 56);
});

test('catalog amendments shift budgets, delay compute, and undercut active models', () => {
  const s = createInitialState();
  s.budget.split.training = 0.04;
  s.budget.split.safety = 0.46;
  s.pendingEvents.push({ id: 'openletter' });
  resolveEvent(s, 'openletter', 'meet');
  assert.equal(s.budget.split.training, 0);
  assert.equal(s.budget.split.safety, 0.5);

  s.compute.pipeline.push({ arrivesTurn: 8 }, { arrivesTurn: 4 }, { arrivesTurn: 6 });
  s.pendingEvents.push({ id: 'datacenter' });
  resolveEvent(s, 'datacenter', 'push');
  assert.deepEqual(s.compute.pipeline.map((entry) => entry.arrivesTurn), [8, 5, 6]);

  s.models.push({ active: true, priceStance: 'premium' }, { active: false, priceStance: 'market' });
  s.pendingEvents.push({ id: 'qilinshock' });
  resolveEvent(s, 'qilinshock', 'cutprices');
  assert.deepEqual(s.models.map((model) => model.priceStance), ['undercut', 'market']);
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
  s.internal = { control: 0, stage: 1, turns: 1, stageTurn: 0 };
  const out = endTurn(s, {}, yes);
  assert.equal(out.state.internal.stage, 2);
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
