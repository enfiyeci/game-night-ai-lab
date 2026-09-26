import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { proposeSummit, holdOrShip, readTheRoom, COMMITMENTS, PARTIES } from '../sim/summit.js';
import { finalEnding } from '../sim/endings.js';
import { startRun, advanceRun } from '../sim/training.js';
import { releaseModel } from '../sim/release.js';
import { deployInternal } from '../sim/internal.js';
import { endTurn } from '../sim/turn.js';
import { recipeCost } from '../sim/recipe.js';

const calm = { next: () => 0.99, int: () => 0, chance: () => false, pick: (a) => a[0], normal: () => 0 };
const era5 = () => {
  const s = createInitialState();
  s.era = 5;
  s.compute.online = recipeCost(s, recipe).units + 200;
  s.turnInEra = 0;
  s.raceHeat = 20;
  s.rivals.forEach((r) => (r.capability = s.capability));
  return s;
};
const deal = (overrides = {}) => ({
  signed: {}, binding: [], trust: 2, collapsed: false, playerShipped: false, ...overrides,
});
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
const release = { picks: ['eval-full', 'channel-app'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };

test('the summit opens only at the start of era 5, once, with one to three proposals', () => {
  const s = createInitialState();
  assert.equal(proposeSummit(s, { proposals: ['evaluators'] }, calm).ok, false);
  const t = era5();
  assert.equal(proposeSummit(t, { proposals: [] }, calm).ok, false);
  assert.equal(proposeSummit(t, { proposals: ['evaluators', 'sharedSafety'] }, calm).ok, true);
  assert.equal(proposeSummit(t, { proposals: ['evaluators'] }, calm).ok, false);
});

test('skipping the opening summit costs race heat and government favor once', () => {
  const s = era5();
  const first = endTurn(s, {}, calm);
  assert.equal(first.events.some((event) => event.type === 'summitSkipped'), true);
  assert.equal(first.state.raceHeat, 27);
  assert.deepEqual(first.state.govFavor, { us: 45, intl: 45 });

  const second = endTurn(first.state, {}, calm);
  assert.equal(second.events.some((event) => event.type === 'summitSkipped'), false);
  assert.deepEqual(second.state.govFavor, { us: 45, intl: 45 });
});

test('summit inputs reject non-arrays, duplicate and inherited ids, bad sweeteners, and unaffordable research', () => {
  for (const move of [
    { proposals: 'evaluators' },
    { proposals: ['evaluators', 'evaluators'] },
    { proposals: [{ toString: () => 'evaluators' }] },
    { proposals: ['constructor'] },
    { proposals: ['evaluators'], sweetener: 'constructor' },
  ]) {
    const s = era5();
    const before = structuredClone(s);
    assert.equal(proposeSummit(s, move, calm).ok, false);
    assert.deepEqual(s, before);
  }
  const poor = era5();
  poor.cash = 49;
  assert.equal(proposeSummit(poor, { proposals: ['verification'], sweetener: 'research' }, calm).ok, false);
  assert.equal(poor.cash, 49);
});

test('cautious labs and friendly governments make commitments binding', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  proposeSummit(s, { proposals: ['sharedSafety', 'evaluators'], sweetener: 'evaluatorsFirst' }, calm);
  assert.ok(s.deal.binding.includes('sharedSafety'));
  assert.ok(s.deal.signed.sharedSafety.includes('lodestar'));
});

test('Qilin signs verification only and cannot bind other commitments', () => {
  const s = era5();
  s.publicTrust = 100;
  s.govFavor = { us: 100, intl: 100 };
  s.rivals.find((rival) => rival.id === 'qilin').caution = 1;
  const r = proposeSummit(s, { proposals: ['evaluators', 'sharedSafety', 'verification'], sweetener: 'evaluatorsFirst' }, calm);
  assert.equal(r.signed.evaluators.includes('qilin'), false);
  assert.equal(r.signed.sharedSafety.includes('qilin'), false);
  assert.equal(r.signed.verification.includes('qilin'), true);

  const onlyQilin = era5();
  onlyQilin.publicTrust = 100;
  onlyQilin.govFavor = { us: 100, intl: 100 };
  for (const rival of onlyQilin.rivals) {
    rival.capability = 0;
    rival.caution = 0;
  }
  Object.assign(onlyQilin.rivals.find((rival) => rival.id === 'qilin'), { capability: onlyQilin.capability, caution: 1 });
  const nonVerification = proposeSummit(onlyQilin, { proposals: ['sharedSafety'], sweetener: 'evaluatorsFirst' }, calm);
  assert.equal(nonVerification.signed.sharedSafety.includes('qilin'), false);
  assert.equal(nonVerification.binding.includes('sharedSafety'), false);
});

test('the room read is a label per party per commitment', () => {
  const r = readTheRoom(era5(), calm);
  assert.ok(['likely', 'unsure', 'unlikely'].includes(r.evaluators.west));
  assert.deepEqual(Object.keys(r), Object.keys(COMMITMENTS));
  assert.deepEqual(Object.keys(r.evaluators), PARTIES);
});

test('public trust changes both the room read and actual signatures', () => {
  const low = era5();
  low.publicTrust = 0;
  const high = era5();
  high.publicTrust = 100;
  assert.equal(readTheRoom(low, calm).evaluators.deepthink, 'unlikely');
  assert.equal(readTheRoom(high, calm).evaluators.deepthink, 'likely');
  assert.equal(proposeSummit(low, { proposals: ['evaluators'] }, calm).signed.evaluators.includes('deepthink'), false);
  assert.equal(proposeSummit(high, { proposals: ['evaluators'] }, calm).signed.evaluators.includes('deepthink'), true);
});

test('evaluators expose half of concealed debt when they bind', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  s.alignmentDebt = 10;
  s.concealedDebt = 20;
  const r = proposeSummit(s, { proposals: ['evaluators'], sweetener: 'evaluatorsFirst' }, calm);
  assert.ok(r.binding.includes('evaluators'));
  assert.equal(s.alignmentDebt, 20);
  assert.equal(s.concealedDebt, 10);

  s.deal.signed = { evaluators: ['lodestar'] };
  let draw = 0;
  const chances = [];
  const rng = { ...calm, chance: (p) => { chances.push(p); return ++draw === 1; } };
  holdOrShip(s, 'hold', rng);
  assert.equal(chances[1], 0.7);
});

test('computeCap limits a completed run to five capability points', () => {
  const s = era5();
  s.deal = deal({ binding: ['computeCap'] });
  assert.equal(startRun(s, recipe).ok, true);
  s.activeRun.bonus = 100;
  const trained = advanceRun(s, calm);
  assert.equal(trained.gain, 5);
  assert.equal(trained.capability, s.capability + 5);
});

test('releaseDelay halves all race heat added by a release', () => {
  const makeTrained = () => {
    const s = era5();
    startRun(s, recipe);
    advanceRun(s, calm);
    s.raceHeat = 20;
    return s;
  };
  const plain = makeTrained();
  const delayed = makeTrained();
  delayed.deal = deal({ binding: ['releaseDelay'] });
  releaseModel(plain, release, calm);
  releaseModel(delayed, release, calm);
  assert.equal(delayed.raceHeat - 20, (plain.raceHeat - 20) / 2);
});

test('sharedSafety funds safety work and increases every rival caution', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  s.alignmentDebt = 20;
  const cautions = s.rivals.map((r) => r.caution);
  const r = proposeSummit(s, { proposals: ['sharedSafety'] }, calm);
  assert.ok(r.binding.includes('sharedSafety'));
  assert.equal(s.cash, 960);
  assert.equal(s.alignmentDebt, 14);
  assert.equal(s.raceHeat, 15);
  assert.deepEqual(s.rivals.map((r) => r.caution), cautions.map((c) => Math.min(1, c + 0.1)));
});

test('sharedSafety slows positive alignment-debt growth from training', () => {
  const plain = era5();
  const protectedState = era5();
  protectedState.deal = deal({ binding: ['sharedSafety'] });
  assert.equal(startRun(plain, recipe).ok, true);
  assert.equal(startRun(protectedState, recipe).ok, true);
  const plainBefore = plain.alignmentDebt;
  const protectedBefore = protectedState.alignmentDebt;
  advanceRun(plain, calm);
  advanceRun(protectedState, calm);
  const plainIncrease = plain.alignmentDebt - plainBefore;
  const protectedIncrease = protectedState.alignmentDebt - protectedBefore;
  assert.ok(plainIncrease > 0);
  assert.ok(Math.abs(protectedIncrease - plainIncrease * 0.7) < 1e-12);
});

test('pauseAutomation stops internal use without resetting its stage and blocks redeployment', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  s.models.push({ capability: 50 });
  s.internal = { control: 0.5, stage: 2, turns: 3, capability: 50 };
  const r = proposeSummit(s, { proposals: ['pauseAutomation'], sweetener: 'evaluatorsFirst' }, calm);
  assert.ok(r.binding.includes('pauseAutomation'));
  assert.equal(s.internal, null);
  assert.equal(s.flags.internalStage, 2);
  assert.deepEqual(deployInternal(s, 0.5), { ok: false, error: 'the summit deal pauses internal automation' });
  s.deal.collapsed = true;
  assert.equal(deployInternal(s, 0.5).ok, true);
  assert.equal(s.internal.stage, 2);
});

test('verification reduces Qilin defection chance to thirty percent', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  const proposal = proposeSummit(s, { proposals: ['verification'], sweetener: 'research' }, calm);
  assert.ok(proposal.binding.includes('verification'));
  assert.equal(s.cash, 950);
  s.turnInEra = 1;
  s.raceHeat = 20;
  s.deal.signed = { verification: ['qilin'] };
  const chances = [];
  const rng = { ...calm, chance: (p) => { chances.push(p); return false; } };
  assert.deepEqual(holdOrShip(s, 'hold', rng), []);
  assert.ok(Math.abs(chances[0] - 0.075) < 1e-12);
});

test('verification is void for everyone unless both governments sign', () => {
  const s = era5();
  s.govFavor = { us: 100, intl: 50 };
  const r = proposeSummit(s, { proposals: ['verification'], sweetener: 'evaluatorsFirst' }, calm);
  assert.deepEqual(r.signed.verification, []);
  assert.equal(r.binding.includes('verification'), false);
});

test('an undetected rival defection raises that rival capability by six', () => {
  const s = era5();
  s.turnInEra = 1;
  s.deal = deal({ signed: { computeCap: ['openbrain'] } });
  let draw = 0;
  const rng = { ...calm, chance: () => ++draw === 1 };
  const before = s.rivals[0].capability;
  assert.deepEqual(holdOrShip(s, 'hold', rng), [{ type: 'defection', party: 'openbrain', detected: false }]);
  assert.equal(s.rivals[0].capability, before + 6);
});

test('two detected rival defections collapse the deal', () => {
  const s = era5();
  s.turnInEra = 1;
  s.deal = deal({ signed: { sharedSafety: ['openbrain', 'lodestar'] } });
  const caught = { ...calm, chance: () => true };
  const events = holdOrShip(s, 'hold', caught);
  assert.equal(events.filter((event) => event.type === 'defection' && event.detected).length, 2);
  assert.deepEqual(events.at(-1), { type: 'dealCollapsed' });
  assert.equal(s.deal.trust, 0);
  assert.equal(s.deal.collapsed, true);
});

test('hold or ship snapshots rival odds, ignores rival order, and still rolls rivals when a ship is detected', () => {
  const play = (signers, reverseRivals = false) => {
    const s = era5();
    s.turnInEra = 1;
    if (reverseRivals) s.rivals.reverse();
    s.deal = deal({ signed: { sharedSafety: signers } });
    const draws = [true, false, false];
    const chances = [];
    const rng = { ...calm, chance: (p) => { chances.push(p); return draws.shift() ?? false; } };
    const events = holdOrShip(s, 'hold', rng);
    return {
      chances,
      events,
      capabilities: Object.fromEntries(s.rivals.map((rival) => [rival.id, rival.capability])),
    };
  };
  const forward = play(['openbrain', 'lodestar']);
  const reversed = play(['lodestar', 'openbrain'], true);
  assert.deepEqual(reversed, forward);
  assert.deepEqual(forward.chances, [0.25, 0.3, 0.25]);
  assert.equal(forward.capabilities.openbrain, 26);
  assert.equal(forward.capabilities.lodestar, 20);

  const shipped = era5();
  shipped.turnInEra = 1;
  shipped.deal = deal({ signed: { sharedSafety: ['openbrain', 'lodestar'] } });
  const events = holdOrShip(shipped, 'ship', { ...calm, chance: () => true });
  assert.ok(events.some((event) => event.party === 'player' && event.detected));
  assert.deepEqual(events.filter((event) => event.party !== 'player' && event.type === 'defection').map((event) => event.party), ['openbrain', 'lodestar']);
});

test('a detected player ship collapses the deal', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  proposeSummit(s, { proposals: ['sharedSafety', 'evaluators'] }, calm);
  const caught = { ...calm, chance: () => true };
  const events = holdOrShip(s, 'ship', caught);
  assert.ok(events.some((event) => event.type === 'defection' && event.party === 'player' && event.detected));
  assert.equal(s.deal.collapsed, true);
  assert.equal(s.deal.playerShipped, true);
});

test('an undetected ship still marks the deal broken and cannot earn a pacing deal ending', () => {
  const s = era5();
  s.turnInEra = 1;
  s.alignmentDebt = 60;
  s.deal = deal({ binding: ['evaluators', 'sharedSafety'] });
  assert.deepEqual(holdOrShip(s, 'ship', calm), []);
  assert.equal(s.deal.playerShipped, true);
  assert.equal(s.deal.collapsed, false);
  assert.equal(finalEnding(s), 'pyrrhic');
});

test('endTurn runs hold or ship only in era 5 after the summit turn', () => {
  const caught = { ...calm, chance: () => true };
  for (const [era, turnInEra, hasDeal] of [[4, 1, true], [5, 0, true], [5, 1, false]]) {
    const s = era5();
    s.era = era;
    s.turnInEra = turnInEra;
    if (hasDeal) s.deal = deal();
    const out = endTurn(s, { holdOrShip: 'ship' }, caught);
    assert.equal(out.events.some((event) => event.type === 'defection' && event.party === 'player'), false);
    assert.equal(out.state.capability, s.capability);
  }

  const active = era5();
  active.turnInEra = 1;
  active.deal = deal();
  const out = endTurn(active, { holdOrShip: 'ship' }, caught);
  assert.equal(out.events.some((event) => event.type === 'defection' && event.party === 'player' && event.detected), true);
  assert.equal(out.events.some((event) => event.type === 'dealCollapsed'), true);
  assert.equal(out.state.capability, active.capability + 8);
  assert.equal(active.deal.playerShipped, false);
});

test('endTurn emits the summit result and rejects an unknown hold or ship choice', () => {
  const s = era5();
  s.govFavor = { us: 80, intl: 80 };
  const summit = endTurn(s, { moves: [{ type: 'summit', proposals: ['evaluators'] }] }, calm);
  const event = summit.events.find((entry) => entry.type === 'summit');
  assert.deepEqual(Object.keys(event).sort(), ['binding', 'signed', 'type']);

  const next = structuredClone(summit.state);
  next.deal.signed = Object.fromEntries(Object.keys(COMMITMENTS).map((id) => [id, id === 'evaluators' ? ['openbrain'] : []]));
  const before = structuredClone(next);
  const invalid = endTurn(next, { holdOrShip: 'constructor' }, { ...calm, chance: () => true });
  assert.ok(invalid.errors.some((error) => error.includes('hold or ship')));
  assert.equal(invalid.events.some((entry) => entry.type === 'defection' && entry.party === 'openbrain'), true);
  assert.equal(invalid.state.deal.playerShipped, before.deal.playerShipped);
  assert.equal(invalid.state.deal.trust, before.deal.trust - 1);
});

test('final endings: a held deal wins; otherwise the frontier and total debt decide', () => {
  const s = era5();
  s.deal = deal({ binding: ['evaluators', 'sharedSafety'], trust: 3 });
  assert.equal(finalEnding(s), 'pacingDeal');
  const t = era5(); t.capability = 90; t.alignmentDebt = 10; t.concealedDebt = 0;
  assert.equal(finalEnding(t), 'aligned');
  const u = era5(); u.capability = 90; u.alignmentDebt = 30; u.concealedDebt = 30;
  assert.equal(finalEnding(u), 'pyrrhic');
  const v = era5(); v.rivals[0].capability = 99;
  assert.equal(finalEnding(v), 'overtaken');
});
