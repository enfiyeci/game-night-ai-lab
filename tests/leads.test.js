import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { startRun, advanceRun, resolveRun } from '../sim/training.js';
import { releaseModel } from '../sim/release.js';
import { resolveHazard } from '../sim/hazards.js';
import { raiseRound, roundAmount } from '../sim/economy.js';
import { CANDIDATES, LEADS, LEAD_EFFECTS, SEATS, TODAY, hireLead, lead, leadEffect, swapLeadNames } from '../sim/leads.js';
import { ADVISOR_PROFILES } from '../sim/data/advisorLines.js';
import { runSummary } from '../ui/logic/summary.js';
import { endScreenModel } from '../ui/logic/ending.js';
import { LOOK } from '../ui/components/portraits.js';

const rng = { next: () => 0.5, int: () => 0, chance: (p) => p > 0.5, normal: (m) => m };
const recipe = {
  sliders: { size: 'medium', length: 'optimal', alignShare: 0.15 },
  picks: { pre: ['filtered-data'], mid: [], post: ['synthetic-sft', 'safety-tuning'] },
};
const release = { picks: ['eval-full', 'channel-app'], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };
const ALTERNATES = { research: 'dev', safety: 'hana', cfo: 'rafael', policy: 'amara' };

function hired(leads = {}) {
  const state = createInitialState({ seed: 4 });
  for (const [seat, id] of Object.entries(leads)) assert.equal(hireLead(state, seat, id).ok, true);
  return state;
}

test('with no setup taken the seats hold today\'s four leads, with no effects and no renamed copy', () => {
  const state = createInitialState({ seed: 1 });
  assert.equal(state.leads, undefined, 'a new state carries no picks, so debug scenarios and the bots keep today\'s team');
  assert.deepEqual(SEATS.map((seat) => lead(state, seat).name), SEATS.map((seat) => ADVISOR_PROFILES[seat].name));
  for (const seat of SEATS) assert.deepEqual(leadEffect(state, seat), {});
  const copy = 'Tomas comes to check. The gate says his access was updated. Priya will say we are slow. She is right.';
  assert.equal(swapLeadNames(copy, state), copy);
  assert.equal(swapLeadNames(copy, hired(TODAY)), copy, 'hiring today\'s leads changes nothing either');
});

test('each seat offers today\'s lead and one alternate, and only those can be hired', () => {
  for (const seat of SEATS) {
    assert.deepEqual(CANDIDATES[seat], [TODAY[seat], ALTERNATES[seat]]);
    for (const id of CANDIDATES[seat]) assert.equal(LEADS[id].seat, seat);
  }
  const state = createInitialState();
  assert.equal(hireLead(state, 'safety', 'dev').ok, false);
  assert.equal(state.leads, undefined);
});

test('the picks are stored on the state, serialise, and survive a round', () => {
  const state = hired(ALTERNATES);
  assert.deepEqual(state.leads, ALTERNATES);
  assert.deepEqual(JSON.parse(JSON.stringify(state)).leads, ALTERNATES);
  const { state: next } = endTurn(state, { budget: state.budget, moves: [] }, createRng(4));
  assert.ok(next.turn > state.turn);
  assert.deepEqual(next.leads, ALTERNATES);
  assert.equal(lead(next, 'cfo').name, 'Rafael Ortiz');
});

test('every lead has a résumé (two lines and a quote) and a portrait; the résumé carries no effect words', () => {
  for (const person of Object.values(LEADS)) {
    assert.equal(person.known.length, 2, person.id);
    assert.ok(person.quote.length > 10, person.id);
    assert.ok(LOOK[person.look], `${person.id} has a portrait`);
    assert.doesNotMatch([...person.known, person.quote].join(' '), /%|\+\d|-\d|debt|favou?r|users per/i, person.id);
  }
});

test('the hired lead\'s name replaces today\'s in copy, pronouns included', () => {
  const state = hired(ALTERNATES);
  assert.equal(swapLeadNames('Tomas comes to check. The gate says his access was updated.', state), 'Hana comes to check. The gate says her access was updated.');
  assert.equal(swapLeadNames('Priya will say we are slow. She is right.', state), 'Dev will say we are slow. He is right.');
  assert.equal(swapLeadNames("Jules: 'Please don't.' Margot Hale, CFO", state), "Amara: 'Please don't.' Rafael Ortiz, CFO");
});

test('screens that name a lead ask the lookup: the run summary and "Who told you the truth"', () => {
  const state = hired(ALTERNATES);
  state.ending = 'acquihire';
  state.advisorHistory = [{ turn: 1, readings: [
    { id: 'research', estimate: 10, truth: 10 }, { id: 'safety', estimate: 10, truth: 60 },
    { id: 'cfo', estimate: 10, truth: 12 }, { id: 'policy', estimate: 10, truth: 14 },
  ] }];
  assert.match(runSummary(state).shareLine, /Dev saw it coming, while Hana did not\./);
  const names = endScreenModel(state, []).advisors.map((advisor) => advisor.name);
  assert.deepEqual(names.sort(), ['Amara Cole', 'Dev Okafor', 'Hana Sato', 'Rafael Ortiz']);
});

test('Dev Okafor: every run carries a small card\'s worth of care, a little less capability, one less debt', () => {
  assert.deepEqual(LEAD_EFFECTS.dev, { run: { cap: -0.25, ad: -0.5 } });
  const run = { recipe, spikes: 0, bonus: 0 };
  const today = createInitialState({ seed: 3 });
  const careful = hired({ research: 'dev' });
  careful.seed = today.seed;
  const a = resolveRun(today, structuredClone(run));
  const b = resolveRun(careful, structuredClone(run));
  assert.ok(b.gain < a.gain && b.gain > a.gain - 1, `gain ${a.gain} -> ${b.gain}`);
  assert.ok(careful.alignmentDebt < today.alignmentDebt, 'less alignment debt');
  assert.ok(today.alignmentDebt - careful.alignmentDebt <= 1.2, 'about one point less');
});

test('Hana Sato: fixing reward hacking costs no extra round, and a quarter of it stays hidden', () => {
  const run = (state) => { state.pendingModel = { hazard: { type: 'rewardHacking', size: 10 }, releaseDelay: 0 }; resolveHazard(state, 'fix'); return state; };
  const today = run(createInitialState());
  const weekly = run(hired({ safety: 'hana' }));
  assert.equal(today.pendingModel.releaseDelay, 1);
  assert.equal(weekly.pendingModel.releaseDelay, 0);
  assert.equal(weekly.concealedDebt - today.concealedDebt, 2.5);
});

test('Rafael Ortiz: rounds raise 10% more, and each costs every director two more points', () => {
  const today = createInitialState();
  const dealer = hired({ cfo: 'rafael' });
  for (const s of [today, dealer]) s.era = 2;
  assert.equal(roundAmount(dealer, 'vc'), Math.round(today.valuation * 0.05 * 1.1));
  const before = [...today.board];
  raiseRound(today, 'strategic');
  raiseRound(dealer, 'strategic');
  assert.deepEqual(today.board, before.map((s) => s - 3));
  assert.deepEqual(dealer.board, before.map((s) => s - 5));
});

test('Amara Cole: each release reaches 2.5% more users, and Washington likes it half a point less', () => {
  const launch = (state) => { startRun(state, recipe); advanceRun(state, rng); return releaseModel(state, release, rng); };
  const today = createInitialState();
  const comms = hired({ policy: 'amara' });
  const a = launch(today);
  const b = launch(comms);
  assert.equal(b.model.newUsers, Math.round(a.model.newUsers * 1.025));
  assert.equal(comms.govFavor.us, today.govFavor.us - 0.5);
});

test('hiring today\'s four on the résumés plays a whole bot run exactly as no setup does', async () => {
  const { enableScenarios } = await import('../sim/scenarios.js');
  const { playRound } = await import('../tools/play-round.js');
  const { STRATEGIES, eventChoices, dailyRelease } = await import('../tools/balance.js');
  const play = (leads) => {
    const choices = createRng(7);
    const dice = createRng(70);
    let state = enableScenarios(createInitialState({ seed: 7 }));
    for (const [seat, id] of Object.entries(leads)) hireLead(state, seat, id);
    for (let i = 0; i < 30 && !state.ending; i++) {
      state = playRound(state, STRATEGIES.balanced(state, choices), dice, (current) => eventChoices(current, 'balanced', choices),
        { dailyActions: (current) => dailyRelease('balanced', current) }).state;
    }
    return state;
  };
  const plain = play({});
  const today = play(TODAY);
  assert.deepEqual(today.leads, TODAY);
  delete today.leads;
  assert.ok(plain.ending);
  assert.deepEqual(today, plain);
});
