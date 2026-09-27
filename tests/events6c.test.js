import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { eventsTick, isAnchorId, resolveEvent, stampNewCards } from '../sim/events.js';
import { EVENTS } from '../sim/data/events.js';
import {
  EVENTS_6C,
  LOSS_SPIKE_SLOW_BONUS,
  JUMP_GAIN,
  EXPORT_FLIP_QILIN_SPEED,
} from '../sim/data/events6c.js';
import { checkTurnEndings } from '../sim/endings.js';
import { advanceDays, endTurn } from '../sim/turn.js';
import { INITIAL_BOARD, STAFF_LETTER_TRUST } from '../sim/board.js';
import { startRun, resolveRun, advanceRunBy } from '../sim/training.js';

const no = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: (m) => m };
const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[0], normal: (m) => m };
const nonAnchors = (state) => state.pendingEvents.filter((event) => !isAnchorId(event.eventId ?? event.id));

function withRows(rows, fn) {
  EVENTS_6C.push(...rows);
  try { return fn(); } finally { for (const row of rows) EVENTS_6C.splice(EVENTS_6C.indexOf(row), 1); }
}
const row = (id, extra = {}) => ({
  id, kind: 'world', warning: null, trigger: () => true,
  card: { title: id, post: { handle: '@t', text: id }, choices: [
    { id: 'a', label: 'A', cost: '—', backers: [], opposers: [], effects() {} },
    { id: 'b', label: 'B', cost: '—', backers: [], opposers: [], effects() {} },
  ] },
  ...extra,
});

test('the engine reads rows from both catalogs', () => withRows([row('t6c')], () => {
  const s = createInitialState();
  eventsTick(s, no);
  assert.ok(s.pendingEvents.some((e) => e.id === 't6c'));
  assert.equal(resolveEvent(s, 't6c', 'a').ok, true);
}));

test('a repeatable row fires again after it resolves; a normal row does not', () => withRows(
  [row('rep', { repeatable: true }), row('once')],
  () => {
    const s = createInitialState();
    eventsTick(s, no);
    resolveEvent(s, 'rep', 'a'); resolveEvent(s, 'once', 'a');
    s.turn += 1;
    eventsTick(s, no);
    assert.deepEqual(nonAnchors(s).map((e) => e.id), ['rep']);
    assert.equal(s.seenEvents.filter((id) => id === 'rep').length, 1, 'seenEvents lists an id once');
  },
));

test('training rows are offered before world rows when the queue is short', () => withRows(
  [row('w1'), row('w2'), row('tr', { kind: 'training', repeatable: true })],
  () => {
    const s = createInitialState();
    eventsTick(s, no);
    assert.equal(nonAnchors(s)[0].id, 'tr');
  },
));

test('a deferred repeatable row re-checks its trigger before it becomes a card', () => {
  let live = true;
  return withRows([row('tr', { kind: 'training', repeatable: true, trigger: () => live })], () => {
    const s = createInitialState();
    s.pendingEvents.push({ id: 'x1' }, { id: 'x2' });
    eventsTick(s, no);
    assert.equal(s.warnings.tr.deferred, true);
    s.pendingEvents = [];
    live = false;
    s.turn += 1;
    eventsTick(s, no);
    assert.equal(s.pendingEvents.some((e) => e.id === 'tr'), false);
  });
});

test('resolving a crisis row marks a board crisis', () => withRows([row('cr', { crisis: true })], () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'cr' });
  resolveEvent(s, 'cr', 'a');
  assert.equal(s.flags.boardCrisis, true);
}));

test('weight theft and self-exfiltration are crises', () => {
  for (const id of ['weightTheft', 'selfExfiltration']) {
    assert.equal(EVENTS.find((e) => e.id === id).crisis, true, id);
  }
});

test('a due board vote is held in checkTurnEndings and can remove the player', () => {
  const lose = createInitialState();
  lose.board = [49, 49, 49, 60, 60, 60, 49];
  lose.staffTrust = STAFF_LETTER_TRUST - 1;
  lose.flags.boardVoteDue = true;
  assert.equal(checkTurnEndings(lose), 'boardRemoved');
  const { turn, yes, passed } = lose.flags.lastBoardVote;
  assert.deepEqual({ turn, yes, passed }, { turn: 0, yes: 3, passed: false });
  assert.equal(lose.flags.boardVoteDue, undefined);

  const win = createInitialState();
  win.flags.boardVoteDue = true;
  assert.equal(checkTurnEndings(win), null);
  assert.equal(win.flags.lastBoardVote.passed, true);
  assert.equal(win.flags.boardVoteDue, undefined);
});

test('a due board vote waits while the lab is insolvent', () => {
  const s = createInitialState();
  s.cash = -1;
  s.board = INITIAL_BOARD.map(() => 0);
  s.flags.boardVoteDue = true;
  assert.equal(checkTurnEndings(s), null);
  assert.equal(s.flags.boardVoteDue, true);
});

test('a forum breach does not set either weights flag', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'weightTheft' });
  resolveEvent(s, 'weightTheft', 'silent');
  assert.equal(s.flags.weightsStolen, undefined);
  assert.equal(s.flags.openWeights, undefined);
  assert.equal(s.flags.coverUp, true);
});

const runState = (spikes) => {
  const s = createInitialState();
  s.activeRun = { recipe: {}, units: 1, turnsLeft: 2, spikes, spikeChance: 0.2, bonus: 4 };
  return s;
};

test('a loss spike becomes a card, and each answer changes the run', () => {
  const s = runState(1);
  eventsTick(s, no);
  assert.equal(nonAnchors(s)[0].id, 'lossSpike');
  assert.equal(nonAnchors(s)[0].choices.length, 3);

  const back = runState(1); back.pendingEvents.push({ id: 'lossSpike' });
  resolveEvent(back, 'lossSpike', 'rollback');
  assert.equal(back.activeRun.spikes, 0);
  assert.equal(back.activeRun.turnsLeft, 3);

  const slow = runState(1); slow.pendingEvents.push({ id: 'lossSpike' });
  resolveEvent(slow, 'lossSpike', 'slow');
  assert.equal(slow.activeRun.bonus, 4 - LOSS_SPIKE_SLOW_BONUS);
  assert.equal(slow.activeRun.spikesAnswered, 1);
});

// A mixture-of-experts run (chosen spike risk, so one loss spike on its first advance), answered mid-run.
function answeredRunGain(recipe, choice) {
  const s = createInitialState();
  s.researched.push('moe');
  s.compute.split.safety = 0; s.compute.online = 100; s.cash = 5000;
  assert.equal(startRun(s, recipe).ok, true);
  s.activeRun.turnsLeft = 3;
  advanceRunBy(s, null, 1);
  assert.equal(s.activeRun.spikes, 1);
  s.pendingEvents.push({ id: 'lossSpike' });
  assert.equal(resolveEvent(s, 'lossSpike', choice).ok, true);
  let model;
  while (s.activeRun) model = advanceRunBy(s, null, 1);
  return model;
}

test('lowering the learning rate mid-run recovers half the spike loss, at the bonus cost (A9 review round 2)', () => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);
  // Base 20 (10 + large 5 + overtraining 3 + synthetic SFT 2 + DPO 2 - default scraped data 2), talent 1.0.
  // push keeps the spike: 20 x 0.8 = 16. slow pays 2 of base, then gets half of its spike loss back:
  // 18 x 0.8 + 18 x 0.2 / 2 = 16.2. rollback removes the spike: 20.
  const big = { sliders: { size: 'large', length: 'over', alignShare: 0 }, picks: { pre: ['moe'], mid: [], post: ['synthetic-sft', 'dpo'] } };
  const push = answeredRunGain(big, 'push');
  const slow = answeredRunGain(big, 'slow');
  const rollback = answeredRunGain(big, 'rollback');
  close(push.gain, 16);
  close(push.spikeLoss, 4);
  close(slow.gain, 16.2);
  assert.equal(slow.spikeLoss, 0); // recovered, as the pending-model answer marks it
  close(rollback.gain, 20);
  assert.ok(push.gain < slow.gain && slow.gain < rollback.gain);
  // On a small run (base 8) the 2-point bonus cost outweighs half the loss: slow 6 x 0.9 = 5.4 against push's
  // 8 x 0.8 = 6.4. slow beats push only when the base is above 18.
  const small = { sliders: { size: 'medium', length: 'optimal', alignShare: 0 }, picks: { pre: ['moe'], mid: [], post: [] } };
  close(answeredRunGain(small, 'push').gain, 6.4);
  close(answeredRunGain(small, 'slow').gain, 5.4);
});

test('an answered spike does not re-fire, but a new spike does', () => {
  const s = runState(1);
  eventsTick(s, no);
  resolveEvent(s, 'lossSpike', 'push');
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(nonAnchors(s).length, 0);
  s.activeRun.spikes = 2;
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(nonAnchors(s)[0].id, 'lossSpike');
});

test('an unanswered spike falls back to push through', () => {
  const s = runState(1);
  s.pendingEvents.push({ id: 'lossSpike' });
  stampNewCards(s);
  const out = advanceDays(s, s.pendingEvents[0].dueAt - s.day, no);
  assert.equal(out.events.find((e) => e.id === 'lossSpike').choiceId, 'push');
});

test('a spike card whose run already ended changes nothing', () => {
  const s = createInitialState();
  s.pendingEvents.push({ id: 'lossSpike' });
  assert.equal(resolveEvent(s, 'lossSpike', 'rollback').ok, true);
  assert.equal(s.activeRun, null);
});

const pendingState = (capability = 60) => {
  const s = createInitialState();
  s.pendingModel = { capability, gain: 10, flags: [], spec: {}, releaseDelay: 0 };
  return s;
};

test('the jump is rolled once per trained model', () => {
  const s = pendingState();
  eventsTick(s, no);
  assert.equal(s.pendingModel.jump, false);
  s.turn += 1;
  eventsTick(s, yes);
  assert.equal(s.pendingEvents.some((e) => e.id === 'capabilityJump'), false, 'a failed roll stays failed');

  const lucky = pendingState();
  eventsTick(lucky, yes);
  assert.equal(nonAnchors(lucky)[0].id, 'capabilityJump');
});

test('every jump answer adds the jump; celebrate, audit and quiet differ as specified', () => {
  const cel = pendingState(); cel.pendingEvents.push({ id: 'capabilityJump' });
  resolveEvent(cel, 'capabilityJump', 'celebrate');
  assert.equal(cel.pendingModel.capability, 60 + JUMP_GAIN);
  assert.equal(cel.pendingModel.gain, 10 + JUMP_GAIN);
  assert.equal(cel.raceHeat, 24);
  assert.equal(cel.concealedDebt, 4);
  assert.equal(cel.pendingModel.jumpAnswered, true);

  const aud = pendingState(); aud.concealedDebt = 10; aud.pendingEvents.push({ id: 'capabilityJump' });
  const cash = aud.cash;
  resolveEvent(aud, 'capabilityJump', 'audit');
  assert.equal(aud.cash, cash - 15);
  assert.equal(aud.concealedDebt, 5);
  assert.equal(aud.pendingModel.releaseDelay, 1);

  const top = pendingState(98); top.pendingEvents.push({ id: 'capabilityJump' });
  resolveEvent(top, 'capabilityJump', 'quiet');
  assert.equal(top.pendingModel.capability, 103); // counts past 100 (owner pick A)
  assert.equal(top.pendingModel.gain, 15);
});

test('a binding compute cap suppresses the jump', () => {
  const s = pendingState();
  s.deal = { collapsed: false, binding: ['computeCap'] };
  eventsTick(s, yes);
  assert.equal(s.pendingEvents.some((e) => e.id === 'capabilityJump'), false);
});

test('a whistleblower needs low staff trust and something to hide', () => {
  const event = EVENTS_6C.find((e) => e.id === 'whistleblower');
  const s = createInitialState();
  s.era = 2; s.staffTrust = 50;
  assert.equal(event.trigger(s, no), false);
  s.flags.coverUp = true;
  assert.equal(event.trigger(s, no), true);
  s.staffTrust = 55;
  assert.equal(event.trigger(s, no), false);
});

test('cooperating exposes hidden debt and clears the cover-up', () => {
  const s = createInitialState();
  s.concealedDebt = 20; s.flags.coverUp = true;
  s.pendingEvents.push({ id: 'whistleblower' });
  resolveEvent(s, 'whistleblower', 'cooperate');
  assert.equal(s.concealedDebt, 10);
  assert.equal(s.alignmentDebt, 15);
  assert.equal(s.flags.coverUp, undefined);
  assert.equal(s.flags.boardCrisis, true);
});

test('discrediting a whistleblower costs extra staff trust under the honest hard line', () => {
  const s = createInitialState();
  s.constitution.hardLines = ['honest'];
  s.pendingEvents.push({ id: 'whistleblower' });
  resolveEvent(s, 'whistleblower', 'discredit');
  assert.equal(s.staffTrust, 70 - 8 - 3);
});

test('the Head of Safety quits only after the broken-promise card and with low staff trust', () => {
  const event = EVENTS_6C.find((e) => e.id === 'safetyQuits');
  const s = createInitialState();
  s.staffTrust = 40;
  assert.equal(event.trigger(s, no), false);
  s.seenEvents.push('promise');
  assert.equal(event.trigger(s, no), true);
});

test('a crisis leads to a board revolt card, and its vote runs at the end of that turn', () => {
  const s = createInitialState();
  s.era = 2;
  s.flags.boardCrisis = true;
  eventsTick(s, no);
  assert.ok(s.pendingEvents.some((e) => e.id === 'boardRevolt'));
  s.board = INITIAL_BOARD.map(() => 10);
  s.flags.staffLetterUsed = true;
  const out = endTurn(s, { eventChoices: { boardRevolt: 'face' } }, no);
  assert.equal(out.state.ending, 'boardRemoved');
  assert.equal(out.state.flags.boardCrisis, undefined);
});

test('lobbying lifts the two least supportive members', () => {
  const s = createInitialState();
  s.board = [40, 30, 30, 70, 80, 70, 70];
  s.pendingEvents.push({ id: 'boardRevolt' });
  resolveEvent(s, 'boardRevolt', 'lobby');
  assert.deepEqual(s.board, [40, 42, 42, 70, 80, 70, 70]);
  assert.equal(s.flags.boardVoteDue, 'emergency');
});

test('the low-support revolt fires once; later revolts need a new crisis', () => {
  const s = createInitialState();
  s.era = 2;
  s.board = [10, 10, 10, 10, 60, 60, 60];
  eventsTick(s, no);
  resolveEvent(s, 'boardRevolt', 'concede');
  s.turn += 1;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.some((e) => e.id === 'boardRevolt'), false);
  s.flags.boardCrisis = true;
  s.turn += 1;
  eventsTick(s, no);
  assert.ok(s.pendingEvents.some((e) => e.id === 'boardRevolt'));
});

test('no board revolt in era 1', () => {
  const s = createInitialState();
  s.flags.boardCrisis = true;
  eventsTick(s, no);
  assert.equal(s.pendingEvents.some((e) => e.id === 'boardRevolt'), false);
});

const liveModel = (extra = {}) => ({
  name: 'Kestrel 1 Core', active: true, activated: true, activeFromTurn: 0, channel: 'consumer',
  flags: [], users: 1e6, userCap: 1e6, priceStance: 'market', releaseSequence: 0, spec: {}, ...extra,
});

test('a rival breakthrough needs a release that leaves you ten behind', () => {
  const event = EVENTS_6C.find((e) => e.id === 'rivalBreakthrough');
  const s = createInitialState();
  s.era = 2;
  s.rivals.find((r) => r.id === 'openbrain').capability = s.capability + 10;
  s.lastRivalReleases = [{ id: 'openbrain', gain: 8 }];
  assert.equal(event.trigger(s, no), true);
  s.rivals.find((r) => r.id === 'openbrain').capability = s.capability + 9;
  assert.equal(event.trigger(s, no), false);
});

test('rushing adds to an active run, or to research without one', () => {
  const run = createInitialState();
  run.activeRun = { bonus: 1, spikes: 0 };
  run.pendingEvents.push({ id: 'rivalBreakthrough' });
  resolveEvent(run, 'rivalBreakthrough', 'rush');
  assert.equal(run.activeRun.bonus, 5);
  assert.equal(run.alignmentDebt, 9);

  const idle = createInitialState();
  idle.pendingEvents.push({ id: 'rivalBreakthrough' });
  resolveEvent(idle, 'rivalBreakthrough', 'rush');
  assert.equal(idle.researchPoints, 15);
});

test('the export flip slows Qilin and never touches compute', () => {
  for (const choice of ['back', 'quiet']) {
    const s = createInitialState();
    const compute = structuredClone(s.compute);
    const speed = s.rivals.find((r) => r.id === 'qilin').speed;
    s.pendingEvents.push({ id: 'exportFlip' });
    resolveEvent(s, 'exportFlip', choice);
    assert.equal(s.rivals.find((r) => r.id === 'qilin').speed, speed * EXPORT_FLIP_QILIN_SPEED, choice);
    assert.deepEqual(s.compute, compute, choice);
  }
  const s = createInitialState();
  s.pendingEvents.push({ id: 'exportFlip' });
  resolveEvent(s, 'exportFlip', 'back');
  assert.equal(s.govFavor.us, 56);
});

test('a price war acts only on live models', () => {
  const s = createInitialState();
  s.models.push(liveModel(), liveModel({ active: false, users: 0 }), liveModel({ channel: 'open' }));
  s.pendingEvents.push({ id: 'priceWar' });
  resolveEvent(s, 'priceWar', 'match');
  assert.equal(s.models[0].revenueMult, 0.7);
  assert.equal(s.models[0].users, 1.05e6);
  assert.equal(s.models[0].userCap, 1.05e6);
  assert.equal(s.models[1].revenueMult, undefined);
  assert.equal(s.models[2].revenueMult, undefined);
});

test('copyright suits need a scraped model', () => {
  const event = EVENTS_6C.find((e) => e.id === 'copyright');
  const s = createInitialState();
  s.era = 2;
  assert.equal(event.trigger(s, yes), false);
  s.models.push(liveModel({ flags: ['scraped'] }));
  assert.equal(event.trigger(s, yes), true);
});

test('fighting the copyright suit files a court case', () => {
  const s = createInitialState();
  s.turn = 5;
  s.pendingEvents.push({ id: 'copyright' });
  resolveEvent(s, 'copyright', 'fight');
  assert.deepEqual(s.legalCases.at(-1), { cost: 120, dueTurn: 11, source: 'copyright' });
});

test('a Senate hearing opens in era 3 under low trust or high race heat', () => {
  const event = EVENTS_6C.find((e) => e.id === 'senateHearing');
  const s = createInitialState();
  s.era = 3;
  assert.equal(event.trigger(s, no), false);
  s.raceHeat = 56;
  assert.equal(event.trigger(s, no), true);
  s.era = 2;
  assert.equal(event.trigger(s, no), false);
});

test('riding a viral demo grows the newest live model past its cap', () => {
  const s = createInitialState();
  s.models.push(liveModel({ releaseSequence: 0 }), liveModel({ releaseSequence: 1, channel: 'enterprise' }));
  s.pendingEvents.push({ id: 'viralDemo' });
  resolveEvent(s, 'viralDemo', 'ride');
  assert.equal(s.models[0].users, 1e6);
  assert.equal(s.models[1].users, 1.3e6);
  assert.equal(s.models[1].userCap, 1.3e6);
  assert.equal(s.sentiment, 1.1);
});

test('every new card has two to four choices and uses known advisor labels', () => {
  const labels = new Set(['Safety', 'Research', 'CFO', 'Comms', 'Product', 'Government', 'Security', 'Staff']);
  for (const event of EVENTS_6C) {
    const n = event.card.choices.length;
    assert.ok(n >= 2 && n <= 4, event.id);
    for (const choice of event.card.choices) {
      for (const who of [...choice.backers, ...choice.opposers]) assert.ok(labels.has(who), `${event.id}.${choice.id}: ${who}`);
    }
  }
  assert.equal(EVENTS_6C.length, 11);
  const ids = [...EVENTS.map((e) => e.id), ...EVENTS_6C.map((e) => e.id)];
  assert.equal(new Set(ids).size, ids.length, 'ids are unique across both catalogs');
});

const oneTurnRecipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};

test('a loss spike in a run that finishes the same round becomes a pending card', () => {
  const s = createInitialState();
  // Less cleaning than the start split is chosen spike risk, so the run meets its one loss spike (deterministic
  // endings A9 review rule; was: dice that always landed on the final tick).
  assert.equal(startRun(s, { ...oneTurnRecipe, focus: { pre: [60, 40, 0] } }).ok, true);
  const out = endTurn(s, {}, yes);
  assert.ok(out.state.pendingModel);
  assert.equal(out.state.activeRun, null);
  assert.equal(out.state.pendingModel.spikes, 1);
  assert.ok(out.state.pendingModel.spikeLoss > 0);
  assert.ok(out.state.pendingEvents.some((event) => event.id === 'lossSpike'));
});

test('pending-model spike answers restore the specified loss and do not re-fire', () => {
  const cases = [
    ['rollback', 4, 1],
    ['slow', 2, 0],
    ['push', 0, 0],
  ];
  for (const [choiceId, restored, delay] of cases) {
    const s = createInitialState();
    s.pendingModel = {
      capability: 50,
      gain: 10,
      flags: [],
      spec: {},
      releaseDelay: 0,
      spikes: 1,
      spikesAnswered: 0,
      spikeLoss: 4,
    };
    s.pendingEvents.push({ id: 'lossSpike' });
    assert.equal(resolveEvent(s, 'lossSpike', choiceId).ok, true);
    assert.equal(s.pendingModel.capability, 50 + restored, choiceId);
    assert.equal(s.pendingModel.gain, 10 + restored, choiceId);
    assert.equal(s.pendingModel.spikeLoss, choiceId === 'push' ? 4 : 0, choiceId);
    assert.equal(s.pendingModel.releaseDelay, delay, choiceId);
    assert.equal(s.pendingModel.spikesAnswered, 1, choiceId);
    eventsTick(s, no);
    assert.equal(s.pendingEvents.some((event) => event.id === 'lossSpike'), false, choiceId);
  }
});

test('resolveRun spikeLoss equals the capability lost to the last spike', () => {
  const spikedState = createInitialState();
  const clearState = createInitialState();
  const run = {
    recipe: oneTurnRecipe,
    units: 5,
    turnsLeft: 0,
    spikeChance: 0.1,
    bonus: 0,
    spikes: 1,
  };
  const spiked = resolveRun(spikedState, structuredClone(run), no);
  const clear = resolveRun(clearState, { ...structuredClone(run), spikes: 0 }, no);
  assert.ok(spiked.spikeLoss > 0);
  assert.ok(Math.abs(spiked.spikeLoss - (clear.capability - spiked.capability)) < 1e-12);
});
