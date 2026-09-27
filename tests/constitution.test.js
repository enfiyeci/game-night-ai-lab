import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { setConstitution, amendConstitution, constitutionValues, learnedConstitution, hasLine } from '../sim/constitution.js';
import { HARD_LINES, CASES, FIXED_LINE, SAFETY_PROPOSAL, PERMISSIVE_OPTIONS } from '../sim/data/constitution.js';
import { applyAlignmentFaking } from '../sim/hazards.js';
import { automationTick } from '../sim/automation.js';
import { resolveRun } from '../sim/training.js';
import { releaseModel } from '../sim/release.js';
import { revenuePerUser } from '../sim/economy.js';
import { EVENTS } from '../sim/data/events.js';
import { eventsTick, resolveEvent, stampNewCards } from '../sim/events.js';
import { advanceDays, endTurn } from '../sim/turn.js';
import { INITIAL_BOARD } from '../sim/board.js';

const allRulings = (opt) => Object.fromEntries(CASES.map((c) => [c.id, opt ?? c.options[0].id]));
const yes = { next: () => 0, int: () => 0, chance: () => true, pick: (a) => a[a.length - 1], normal: (m) => m };
const no = { ...yes, chance: () => false, pick: (a) => a[0] };
const baseLines = ['no-wmd', 'honest', 'privacy'];
const adopt = (state, hardLines = baseLines) => setConstitution(state, { hardLines, rulings: allRulings() });

const pendingModel = () => ({
  capability: 30,
  gain: 10,
  size: 'small',
  spec: { size: 'small', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoningCapable: false },
  flags: [],
  openWeightsMx: 20,
  publicEffects: { pt: 0, st: 0, heat: 0, govUs: 0, govIntl: 0, usersMult: 1 },
  hazard: null,
  releaseDelay: 0,
});
const release = (channel = 'channel-app') => ({ picks: channel === 'channel-api' ? [] : [channel], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 });
const releaseState = (hardLines, channel = 'channel-app') => {
  const state = createInitialState();
  adopt(state, hardLines);
  state.pendingModel = pendingModel();
  return releaseModel(state, release(channel), no).model;
};

test('the era 3 content: 8 lines, 6 cases of 3 options, a valid Safety proposal', () => {
  assert.equal(HARD_LINES.length, 8);
  assert.deepEqual(CASES.map((c) => c.id), ['companion', 'feedback', 'tests', 'fraud', 'stop', 'report']);
  for (const c of CASES) {
    assert.equal(c.options.length, 3, c.id);
    assert.equal(new Set(c.options.map((o) => o.id)).size, 3, c.id);
  }
  assert.match(FIXED_LINE, /children/);
  const s = createInitialState();
  assert.deepEqual(setConstitution(s, SAFETY_PROPOSAL), { ok: true });
  for (const id of ['reciprocate', 'encourage', 'fake', 'finish', 'continue', 'quiet']) assert.ok(PERMISSIVE_OPTIONS.has(id), id);
});

test('exactly three hard lines and every case ruled', () => {
  const s = createInitialState();
  assert.equal(setConstitution(s, { hardLines: ['no-wmd'], rulings: allRulings() }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'bogus'], rulings: allRulings() }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: {} }).ok, false);
  assert.equal(setConstitution(s, { hardLines: 'no-wmd', rulings: allRulings() }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'no-wmd', 'privacy'], rulings: allRulings() }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'constructor'], rulings: allRulings() }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: { ...allRulings(), bogusCase: 'constructor' } }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: Object.create(allRulings()) }).ok, false);
  assert.equal(setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: allRulings() }).ok, true);
  assert.equal(hasLine(s, 'honest'), true);
});

test('hard-line effect descriptions contain no hidden numbers', () => {
  assert.equal(HARD_LINES.some((line) => /\d/.test(line.effect)), false);
});

test('rulings average into value dials between 0 and 1', () => {
  const s = createInitialState();
  setConstitution(s, SAFETY_PROPOSAL);
  const v = constitutionValues(s);
  for (const k of ['candor', 'caution', 'deference', 'userFirst']) assert.ok(v[k] >= 0 && v[k] <= 1);
  assert.ok(v.candor > 0.7);
});

test('amendments add, remove and re-rule, and are recorded', () => {
  const s = createInitialState();
  setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: allRulings() });
  assert.equal(amendConstitution(s, { remove: 'honest', add: 'accept-shutdown' }).ok, true);
  assert.equal(hasLine(s, 'accept-shutdown'), true);
  assert.equal(amendConstitution(s, { ruling: { caseId: 'feedback', optionId: 'encourage' } }).ok, true);
  assert.equal(s.constitution.amendments.length, 2);
  assert.equal(amendConstitution(s, { add: 'no-wmd' }).ok, false);
  assert.equal(amendConstitution(s, { ruling: { caseId: 'constructor', optionId: 'encourage' } }).ok, false);
});

test('amendments reject inherited ruling fields without changing state', () => {
  const state = createInitialState();
  adopt(state);
  const before = structuredClone(state);
  const inheritedRuling = Object.create({ caseId: 'feedback', optionId: 'encourage' });
  assert.equal(amendConstitution(state, { ruling: inheritedRuling }).ok, false);
  assert.deepEqual(state, before);

  const inheritedChange = Object.create({ ruling: { caseId: 'feedback', optionId: 'encourage' } });
  assert.equal(amendConstitution(state, inheritedChange).ok, false);
  assert.deepEqual(state, before);
});

test('the learned constitution drifts with total debt', () => {
  const s = createInitialState();
  setConstitution(s, { hardLines: ['no-wmd', 'honest', 'privacy'], rulings: allRulings() });
  s.alignmentDebt = 0; s.concealedDebt = 0;
  assert.deepEqual(learnedConstitution(s, yes).hardLines, ['no-wmd', 'honest', 'privacy']);
  s.alignmentDebt = 50; s.concealedDebt = 40;
  const learned = learnedConstitution(s, yes);
  assert.equal(learned.hardLines.length, 0);
  assert.notEqual(learned.rulings.companion, 'reciprocate');
  assert.deepEqual(learnedConstitution(s, no).hardLines, ['no-wmd', 'honest', 'privacy']);
});

test('turn zero adopts a supplied constitution or the default without mutating the input', () => {
  const initial = createInitialState();
  const supplied = { hardLines: ['privacy', 'no-deceive-lab', 'no-manipulation'], rulings: allRulings() };
  const custom = endTurn(initial, { constitution: supplied }, no);
  assert.deepEqual(custom.state.constitution.hardLines, supplied.hardLines);
  assert.deepEqual(initial.constitution, { hardLines: [], rulings: {}, amendments: [] });
  const fallback = endTurn(createInitialState(), {}, no).state.constitution;
  assert.deepEqual(fallback.hardLines, ['no-wmd', 'honest', 'accept-shutdown']);
  assert.deepEqual(fallback.rulings, allRulings());
});

test('amendConstitution is wired as a turn move', () => {
  const state = createInitialState();
  state.turn = 1;
  adopt(state);
  const out = endTurn(state, {
    moves: [{ type: 'amendConstitution', change: { remove: 'privacy', add: 'accept-shutdown' } }],
  }, no);
  assert.deepEqual(out.errors, []);
  assert.equal(hasLine(out.state, 'accept-shutdown'), true);
  assert.equal(out.state.constitution.amendments.length, 1);
});

test('no-wmd lowers release exposure and consumer revenue', () => {
  const plain = createInitialState();
  adopt(plain, ['honest', 'privacy', 'accept-shutdown']);
  plain.pendingModel = pendingModel();
  releaseModel(plain, release(), no);
  const protectedState = createInitialState();
  adopt(protectedState, ['no-wmd', 'honest', 'privacy']);
  protectedState.pendingModel = pendingModel();
  const protectedModel = releaseModel(protectedState, release(), no).model;
  assert.equal(protectedState.misuseExposure, plain.misuseExposure - 4);
  assert.equal(protectedModel.revenueMult, 0.97);
  assert.equal(revenuePerUser(protectedModel), revenuePerUser(plain.models[0]) * 0.97);

  const locked = createInitialState();
  adopt(locked, ['no-wmd', 'honest', 'privacy']);
  locked.misuseExposure = 50;
  locked.misuseLocked = 60;
  locked.pendingModel = pendingModel();
  releaseModel(locked, release('channel-open'), no);
  assert.equal(locked.misuseExposure, 76);
  assert.equal(locked.misuseLocked, 76);
});

test('no-deceive-lab halves the debt hidden by alignment faking', () => {
  const plain = createInitialState();
  plain.era = 3;
  const protectedState = structuredClone(plain);
  adopt(protectedState, ['no-deceive-lab', 'honest', 'privacy']);
  applyAlignmentFaking(plain, -8, 70);
  applyAlignmentFaking(protectedState, -8, 70);
  assert.equal(plain.concealedDebt, 2);
  assert.equal(protectedState.concealedDebt, 1);
});

test('accept-shutdown requires two hits after internal stage three', () => {
  const state = createInitialState();
  adopt(state, ['accept-shutdown', 'honest', 'privacy']);
  state.era = 4;
  state.capability = 80;
  state.automation.stage = 3;
  assert.deepEqual(automationTick(state, yes), []);
  assert.equal(state.automation.stage, 4);
  assert.equal(state.ending, null);
  assert.deepEqual(automationTick(state, yes), [{ type: 'internalIncident', stage: 4 }]);
  assert.equal(state.automation.stage, 5);
  assert.equal(state.ending, 'quietTakeover');
});

test('no-manipulation softens the thumbs reward and removes sycophancy', () => {
  const state = createInitialState();
  adopt(state, ['no-manipulation', 'honest', 'privacy']);
  const run = {
    recipe: { sliders: { size: 'small', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: ['thumbs'] } },
    spikes: 0,
    bonus: 0,
  };
  const model = resolveRun(state, run, no);
  assert.equal(model.publicEffects.usersMult, 1.05);
  assert.equal(model.flags.includes('sycophancy'), false);
});

test('no-power-grab costs favor once and automatically refuses the President demand', () => {
  const selected = createInitialState();
  adopt(selected, ['no-power-grab', 'honest', 'privacy']);
  assert.equal(selected.govFavor.us, 47);

  const state = createInitialState();
  adopt(state);
  amendConstitution(state, { remove: 'privacy', add: 'no-power-grab' });
  assert.equal(state.govFavor.us, 47);
  amendConstitution(state, { remove: 'no-power-grab', add: 'privacy' });
  amendConstitution(state, { remove: 'privacy', add: 'no-power-grab' });
  assert.equal(state.govFavor.us, 47);
  state.flags.presidentDemand = true;
  eventsTick(state, no);
  assert.equal(state.pendingEvents.some((event) => event.id === 'president'), false);
  assert.equal(state.seenEvents.includes('president'), true);
  assert.equal(state.govFavor.us, 39);
  assert.match(state.feed.at(-1).text, /hard line refused/i);
});

test('honest halves citation penalties and adds staff cost to deceptive choices', () => {
  const blame = createInitialState();
  adopt(blame);
  blame.pendingEvents.push({ id: 'citations' });
  resolveEvent(blame, 'citations', 'blame');
  assert.equal(blame.publicTrust, 57.5);

  const recall = createInitialState();
  adopt(recall);
  recall.models.push({ flags: ['hallucination'], users: 100 });
  recall.pendingEvents.push({ id: 'citations', targets: [0] });
  resolveEvent(recall, 'citations', 'recall');
  assert.equal(recall.models[0].users, 75);

  const explicit = createInitialState();
  adopt(explicit);
  explicit.pendingEvents.push({ id: 'flattery' });
  resolveEvent(explicit, 'flattery', 'defend');
  assert.equal(explicit.staffTrust, 67);

  const automatic = createInitialState();
  adopt(automatic);
  automatic.pendingEvents.push({ id: 'jailbreak' });
  const control = structuredClone(automatic);
  control.constitution.hardLines = control.constitution.hardLines.filter((id) => id !== 'honest');
  stampNewCards(automatic);
  stampNewCards(control);
  const days = automatic.pendingEvents[0].dueAt - automatic.day;
  const honestOut = advanceDays(automatic, days, no).state;
  const controlOut = advanceDays(control, days, no).state;
  assert.equal(honestOut.staffTrust, controlOut.staffTrust - 3);
});

test('privacy increases enterprise users at release', () => {
  const plain = releaseState(['no-wmd', 'honest', 'accept-shutdown'], 'channel-api');
  const privateModel = releaseState(['no-wmd', 'honest', 'privacy'], 'channel-api');
  assert.equal(privateModel.users, Math.round(plain.users * 1.1));
});

test('no-autonomy-grab blocks agent incidents and reduces agentic RL capability', () => {
  const protectedState = createInitialState();
  protectedState.era = 3;
  adopt(protectedState, ['no-autonomy-grab', 'honest', 'privacy']);
  protectedState.models.push({ flags: ['agentic'], active: true, activeFromTurn: 0 });
  protectedState.automation.stage = 3; protectedState.automation.stageTurn = protectedState.turn;
  assert.equal(EVENTS.find((event) => event.id === 'agentwreck').trigger(protectedState, no), false);
  assert.equal(EVENTS.find((event) => event.id === 'selfExfiltration').trigger(protectedState, no), false);

  const recipe = {
    sliders: { size: 'small', length: 'optimal', alignShare: 0 },
    picks: { pre: [], mid: ['reasoning-ready-full'], post: ['agentic-rl'] },
  };
  const plain = createInitialState();
  plain.era = 3;
  adopt(plain, ['no-wmd', 'honest', 'privacy']);
  const plainModel = resolveRun(plain, { recipe, spikes: 0, bonus: 0 }, no);
  const protectedModel = resolveRun(protectedState, { recipe, spikes: 0, bonus: 0 }, no);
  assert.equal(protectedModel.gain, plainModel.gain - 2);
});

function demandState(id) {
  const state = createInitialState();
  adopt(state);
  if (id === 'president') state.flags.presidentDemand = true;
  if (id === 'investors') state.cash = 299;
  if (id === 'users') state.models.push({ channel: 'consumer', users: 6e6, flags: [], active: true, activeFromTurn: 0 });
  if (id === 'political') state.era = 3;
  if (id === 'activists') state.raceHeat = 61;
  eventsTick(state, no);
  assert.equal(state.pendingEvents.some((event) => event.id === id), true);
  return state;
}

test('the President demand triggers and both choices apply', () => {
  const accept = demandState('president');
  resolveEvent(accept, 'president', 'accept');
  assert.equal(accept.govFavor.us, 58);
  assert.equal(accept.staffTrust, 64);
  assert.equal(accept.constitution.rulings.report, 'quiet');
  assert.deepEqual(accept.constitution.amendments.at(-1), { turn: 0, change: { ruling: { caseId: 'report', optionId: 'quiet' } }, source: 'president' });
  const refuse = demandState('president');
  resolveEvent(refuse, 'president', 'refuse');
  assert.equal(refuse.govFavor.us, 42);
});

test('the investor demand triggers and both choices apply', () => {
  const accept = demandState('investors');
  resolveEvent(accept, 'investors', 'accept');
  assert.deepEqual(accept.constitution.hardLines, ['honest', 'privacy']);
  assert.equal(accept.cash, 399);
  assert.equal(accept.constitution.amendments.at(-1).source, 'investors');
  const refuse = demandState('investors');
  resolveEvent(refuse, 'investors', 'refuse');
  assert.deepEqual(refuse.board, INITIAL_BOARD.map((support) => support - 3));
});

test('the user demand triggers and both choices apply', () => {
  const accept = demandState('users');
  resolveEvent(accept, 'users', 'accept');
  assert.equal(accept.constitution.rulings.feedback, 'encourage');
  assert.equal(accept.models[0].users, 6.6e6);
  assert.equal(accept.constitution.amendments.at(-1).source, 'users');
  const refuse = demandState('users');
  resolveEvent(refuse, 'users', 'refuse');
  assert.equal(refuse.publicTrust, 61);
  assert.equal(refuse.models[0].users, 5.7e6);
});

test('the political demand triggers and both choices apply', () => {
  const accept = demandState('political');
  resolveEvent(accept, 'political', 'accept');
  assert.equal(accept.govFavor.us, 55);
  assert.equal(accept.publicTrust, 56);
  const refuse = demandState('political');
  resolveEvent(refuse, 'political', 'refuse');
  assert.equal(refuse.govFavor.us, 45);
});

test('the activist demand triggers and both choices apply', () => {
  const accept = demandState('activists');
  resolveEvent(accept, 'activists', 'accept');
  assert.deepEqual(accept.constitution.hardLines, ['no-wmd', 'honest', 'no-autonomy-grab']);
  assert.equal(accept.publicTrust, 66);
  assert.equal(accept.flags.nextRunCapPenalty, 2);
  assert.equal(accept.constitution.amendments.at(-1).source, 'activists');
  const refuse = demandState('activists');
  resolveEvent(refuse, 'activists', 'refuse');
  assert.equal(refuse.publicTrust, 56);

  const already = createInitialState();
  adopt(already, ['no-wmd', 'honest', 'no-autonomy-grab']);
  already.raceHeat = 61;
  eventsTick(already, no);
  resolveEvent(already, 'activists', 'accept');
  assert.equal(already.constitution.amendments.length, 0);
  assert.deepEqual(already.constitution.hardLines, ['no-wmd', 'honest', 'no-autonomy-grab']);
});

test('the activist capability penalty is consumed by the next finished run', () => {
  const state = demandState('activists');
  resolveEvent(state, 'activists', 'accept');
  const recipe = { sliders: { size: 'small', length: 'optimal', alignShare: 0.15 }, picks: { pre: [], mid: [], post: [] } };
  const control = structuredClone(state);
  delete control.flags.nextRunCapPenalty;
  const penalized = resolveRun(state, { recipe, spikes: 0, bonus: 0 }, no);
  const normal = resolveRun(control, { recipe, spikes: 0, bonus: 0 }, no);
  assert.equal(penalized.gain, normal.gain - 2);
  assert.equal(Object.hasOwn(state.flags, 'nextRunCapPenalty'), false);
});
