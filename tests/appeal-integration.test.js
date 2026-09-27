import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { startRun, advanceRun } from '../sim/training.js';
import { validateRecipe, focusEffects } from '../sim/recipe.js';
import { sanitizeDraft } from '../ui/logic/actions.js';
import { releaseModel, activateReleases, holdRelease } from '../sim/release.js';
import { CARDS, STAGE_SLOTS } from '../sim/data/cards.js';
import { servingCost } from '../sim/serving.js';
import * as economy from '../sim/economy.js';
import { computeSlices, applySplitEffects } from '../sim/split.js';
import { landRivals } from '../sim/rivals.js';
import { scoreLaunch } from '../sim/launch.js';

const rng = { next: () => 0.5, int: () => 0, chance: () => false, normal: (m) => m };
const recipe = { product: 'chat', sliders: { size: 'medium', length: 'optimal', alignShare: 0.2 }, picks: { pre: [], mid: [], post: ['safety-tuning', 'dpo'] } };
const release = { picks: [], price: 'market', reasoning: 'off', family: 'Kestrel', generation: 1 };
function trained(product = 'chat') {
  const s = createInitialState();
  assert.ok(startRun(s, recipe).ok);
  advanceRun(s, rng);
  s.pendingModel.product = product;
  return s;
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('recipes validate product availability and drafts retain it', () => {
  const s = createInitialState();
  assert.ok(validateRecipe(s, recipe).ok);
  assert.match(validateRecipe(s, { ...recipe, product: 'coding' }).errors.join(), /Coding tool is not open yet/);
  for (const product of ['robots', 'constructor']) assert.match(validateRecipe(s, { ...recipe, product }).errors.join(), /unknown product/);
  assert.equal(sanitizeDraft(s, { ...recipe, product: 'chat' }).product, 'chat');
  assert.equal(sanitizeDraft(s, { ...recipe, product: 'science' }).product, 'business');
});

test('training locks the product, cloned recipe and starting era', () => {
  const s = createInitialState();
  const draft = structuredClone(recipe);
  assert.ok(startRun(s, draft).ok);
  draft.product = 'business'; draft.picks.post = [];
  s.era = 2;
  advanceRun(s, rng);
  assert.equal(s.pendingModel.product, 'chat');
  assert.equal(s.pendingModel.startEra, 1);
  assert.deepEqual(s.pendingModel.recipe, recipe);
});

test('fit replaces image, language, refusal and long-document user bonuses', () => {
  for (const id of ['multimodal', 'multilingual', 'refusal-calibration']) assert.equal(CARDS.find(c => c.id === id).effects.usersMult, undefined);
  const s = createInitialState(); s.era = 2;
  assert.equal(focusEffects(s, { ...recipe, focus: { mid: [0, 100, 0] } }).usersMult, undefined);
  assert.equal(CARDS.find(c => c.id === 'thumbs').effects.usersMult, 1.15);
});

test('product determines price and token use with legacy fallbacks', () => {
  const base = { size: 'medium', arch: 'dense', context: 'short', precision: 'bf16', guard: false, reasoning: 'off' };
  near(servingCost({ ...base, product: 'coding' }, 2, 0) / servingCost({ ...base, product: 'chat' }, 2, 0), 6);
  near(servingCost({ ...base, channel: 'enterprise' }, 1, 0), servingCost({ ...base, product: 'business' }, 1, 0));
  assert.equal(economy.revenuePerUser({ product: 'science', priceStance: 'market', eraPrice: 2 }), 8000);
  assert.equal(economy.revenuePerUser({ channel: 'consumer', priceStance: 'premium' }), 7.5);
});

test('release carries product and fit receipt; agentic training does not change product', () => {
  const s = trained(); s.pendingModel.flags.push('agentic');
  const r = releaseModel(s, release, rng); assert.ok(r.ok, r.error);
  assert.equal(r.model.product, 'chat'); assert.equal(r.model.spec.product, 'chat'); assert.equal(r.model.channel, 'consumer');
  const a = r.model.appeal;
  assert.equal(r.model.fresh, Math.round(a.freshBeforeFit * (0.7 + 0.6 * a.fit)));
  assert.equal(a.wave, 1.6); assert.equal(a.crowding, 0.55); assert.equal(a.first, true);
  assert.equal(r.model.users, Math.round(r.model.fresh * 1.6 * 0.55 * 1.1));
  assert.deepEqual(s.firsts.products.chat.labs, ['player']);
});

test('channel cards and open-weights effects are removed; release has one slot', () => {
  for (const id of ['channel-api', 'channel-app', 'channel-open', 'channel-staged', 'tamper']) assert.ok(!CARDS.some(c => c.id === id), id);
  assert.ok(!CARDS.some(c => 'openWeightsMx' in c.effects || 'openWeightsMult' in c.effects));
  assert.equal(STAGE_SLOTS.release, 1);
});

test('staged rollout discounts fresh users and waits a round without claiming firsts', () => {
  const a = trained(), b = trained();
  const plain = releaseModel(a, release, rng).model;
  const staged = releaseModel(b, { ...release, picks: ['staged'] }, rng).model;
  assert.ok(Math.abs(staged.fresh - plain.fresh * 0.8) <= 1);
  assert.equal(staged.activeFromTurn, plain.activeFromTurn + 1);
  assert.equal(b.firsts.products.chat, undefined);
  b.turn = staged.activeFromTurn; b.era = 2;
  activateReleases(b);
  assert.equal(staged.appeal.wave, 1);
  assert.deepEqual(b.firsts.products.chat.labs, ['player']);
});

test('franchise retains users and cap, grows only for a better same-product model', () => {
  const s = trained();
  const first = releaseModel(s, release, rng).model;
  first.users = 50e6; first.userCap = 60e6;
  s.turn += 3;
  startRun(s, recipe); advanceRun(s, rng);
  s.pendingModel.capability = first.capability;
  const second = releaseModel(s, { ...release, generation: 2 }, rng).model;
  assert.equal(second.appeal.franchise.improvement, 0);
  assert.equal(second.users, 50e6); assert.equal(second.userCap, 60e6);
  assert.equal(first.active, false);
});

test('business and coding remain independent franchises despite sharing a channel', () => {
  const s = trained('business');
  const first = releaseModel(s, release, rng).model;
  s.turn += 3; startRun(s, recipe); advanceRun(s, rng); s.pendingModel.product = 'coding';
  const second = releaseModel(s, { ...release, generation: 2 }, rng).model;
  assert.equal(first.active, true); assert.equal(second.appeal.franchise.carried, 0);
});

test('hold restores only the replaced users; relaunch adds fresh users once', () => {
  const s = trained(); const first = releaseModel(s, release, rng).model;
  first.users = 10e6;
  s.turn += 3; startRun(s, recipe); advanceRun(s, rng);
  const second = releaseModel(s, { ...release, generation: 2 }, rng).model;
  const users = second.users;
  holdRelease(s, second); assert.equal(first.users, 10e6);
  s.turn = second.activeFromTurn; activateReleases(s);
  assert.equal(second.users, users);
});

test('growth respects crowding, first mover and actual served share', () => {
  const s = createInitialState();
  const m = { product: 'business' };
  near(economy.growthMultiplier(s, m), 0.8);
  s.firsts.products.business = { labs: ['player'], turn: 0 };
  near(economy.growthMultiplier(s, m), 0.88);
  s.compute.online = 100; s.compute.split.safety = 0; s.compute.servingUnits = 10; s.compute.split.servingCap = 5; s.compute.split.coverWithSpot = false;
  assert.equal(computeSlices(s).serving, 5);
  near(economy.growthMultiplier(s, m), 0.44);
  s.compute.split.coverWithSpot = true; near(economy.growthMultiplier(s, m), 0.88);
});

test('outage losses accumulate per live model', () => {
  const s = trained(); const m = releaseModel(s, release, rng).model;
  s.compute.online = 100; s.compute.servingUnits = 10; s.compute.split.servingCap = 5; s.compute.split.coverWithSpot = false;
  const initial = m.users;
  applySplitEffects(s); const firstLoss = initial - m.users;
  assert.equal(m.lostToOutage, firstLoss);
  applySplitEffects(s); assert.equal(m.lostToOutage, initial - m.users);
});

test('rivals claim product firsts when their launches land', () => {
  const s = createInitialState();
  s.rivalLaunches = [{ id: 'lodestar', gain: 1, heat: 0, day: s.day }];
  landRivals(s);
  assert.deepEqual(s.firsts.products.business.labs, ['lodestar']);
});

test('features cost cash, improve wanted fit, and multiply serving cost', () => {
  const a = trained(), b = trained(); a.era = b.era = 2;
  const cash = a.cash;
  const r = releaseModel(a, { ...release, features: ['search', 'voice'] }, rng);
  const plain = releaseModel(b, release, rng).model;
  assert.ok(r.ok, r.error); assert.equal(cash - a.cash, 15);
  assert.deepEqual(r.model.appeal.features, ['search', 'voice']);
  near(r.model.appeal.fit, Math.min(1, plain.appeal.fit + 0.2));
  const multiplier = r.model.spec.features.reduce((v, f) => v * f.serving, 1);
  near(servingCost(r.model.spec, 2, 0) / servingCost(plain.spec, 2, 0), multiplier);
});

test('invalid or unaffordable feature lists fail without state changes', () => {
  const s = trained();
  for (const features of [['memory'], ['teleport'], ['constructor'], ['search', 'voice', 'memory'], ['search', 'search'], 'voice']) {
    const before = structuredClone(s);
    assert.equal(releaseModel(s, { ...release, features }, rng).ok, false, String(features));
    assert.deepEqual(s, before);
  }
  s.era = 2; s.cash = 1;
  const before = structuredClone(s);
  assert.equal(releaseModel(s, { ...release, features: ['voice'] }, rng).ok, false);
  assert.deepEqual(s, before);
});

test('science adds Washington favor and autonomous products face agent risk without training flag', () => {
  const s = trained('science'), before = s.govFavor.us;
  const cardFavor = s.pendingModel.publicEffects.govUs;
  releaseModel(s, release, rng); assert.equal(s.govFavor.us - before, cardFavor + 2);
  const agent = trained('agent'); agent.era = 4; agent.alignmentDebt = 1000; agent.pendingModel.capability = 90;
  assert.ok(!agent.pendingModel.flags.includes('agentic'));
  releaseModel(agent, release, { ...rng, chance: () => true });
  assert.equal(agent.ending, 'misalignment');
});

test('a release verdict identifies its product and missing recipe signal', () => {
  const s = trained('chat'); const m = releaseModel(s, release, rng).model;
  assert.equal(m.launch.verdict, `A solid chat app, weak on ${m.appeal.missing[0]}.`);
});

test('polish is optional, preserved and adds only its agreed critic term', () => {
  const a = trained(), b = structuredClone(a); b.pendingModel.polish = 100; b.pendingModel.fixedFlaws = [{ flag: 'hallucination', day: b.day }];
  const plain = releaseModel(a, release, rng).model;
  const polished = releaseModel(b, release, rng).model;
  assert.equal(plain.polish, 0); assert.equal(polished.polish, 100);
  assert.deepEqual(polished.fixedFlaws, [{ flag: 'hallucination', day: b.day }]);
  polished.launch.press.forEach((p, i) => assert.equal(p.score, Math.min(10, plain.launch.press[i].score + 2)));
});

test('a player shares same-round product and feature firsts even when a rival claims earlier in that round', () => {
  const s = trained(); s.era = 2;
  s.firsts = { products: { chat: { labs: ['openbrain'], turn: s.turn } }, features: { voice: { labs: ['openbrain'], turn: s.turn } } };
  const m = releaseModel(s, { ...release, features: ['voice'] }, rng).model;
  assert.equal(m.appeal.first, true);
  assert.equal(m.spec.features[0].serving, 1.225);
  assert.deepEqual(s.firsts.products.chat.labs, ['openbrain', 'player']);
});

test('a delayed feature cannot keep a first-mover discount if the rival ships in an earlier round', () => {
  const s = trained(); s.era = 2;
  const m = releaseModel(s, { ...release, picks: ['staged'], features: ['voice'] }, rng).model;
  assert.equal(s.firsts.features.voice, undefined);
  s.firsts.features.voice = { labs: ['openbrain'], turn: s.turn };
  s.turn = m.activeFromTurn; activateReleases(s);
  assert.equal(m.spec.features[0].serving, 1.3);
  assert.deepEqual(s.firsts.features.voice.labs, ['openbrain']);
});

test('rival release features follow the zero-based round schedule', async () => {
  const { claimRivalFeatures } = await import('../sim/appeal.js');
  const s = createInitialState(); s.era = 2; s.turn = 6; s.turnInEra = 2;
  claimRivalFeatures(s);
  assert.deepEqual(s.firsts.features.search, { labs: ['openbrain'], turn: 6 });
  assert.equal(s.firsts.features.voice, undefined);
  s.turn = 7; s.turnInEra = 3; claimRivalFeatures(s);
  assert.deepEqual(s.firsts.features.voice, { labs: ['openbrain'], turn: 7 });
});

test('cheap-to-run compares cost per revenue dollar and emits a reaction', () => {
  const s = trained('coding'); s.era = 3;
  const spec = { size: 'xl', arch: 'dense', context: 'million', precision: 'bf16', guard: false, reasoning: 'high', product: 'chat' };
  for (let i = 0; i < 2; i++) s.models.push({ name: `Old ${i}`, active: true, activated: true, activeFromTurn: 0, product: 'chat', spec, users: 1e6, priceStance: 'market' });
  const m = releaseModel(s, release, rng).model;
  assert.equal(m.cheapToRun, true);
  assert.ok(m.launch.reactions.some(r => r.handle === '@unit_economics'));
});

test('market product and feature fit do not enter critic scores', () => {
  const a = trained('chat'), b = structuredClone(a); a.era = b.era = 2; b.pendingModel.product = 'business';
  const chat = releaseModel(a, { ...release, features: ['voice'] }, rng).model;
  const business = releaseModel(b, release, rng).model;
  assert.deepEqual(chat.launch.press, business.launch.press);
});

test('the next wave is announced when its product opens', async () => {
  const { endTurn } = await import('../sim/turn.js');
  const { pickableProducts } = await import('../sim/data/products.js');
  const s = createInitialState(); s.turn = 2; s.turnInEra = 2;
  const result = endTurn(s, {}, rng).state;
  assert.ok(pickableProducts(result).includes('coding'));
  assert.equal(result.feed.filter(p => p.text.includes('next wave is coding tool')).length, 1);
});
