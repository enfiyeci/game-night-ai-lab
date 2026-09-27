import { PRODUCTS, DEFAULT_PRODUCT, FIT_USERS, FEATURE_FIT, FEATURE_SLOTS, RELEASE_FEATURES, productOf, claimFirsts } from './data/products.js';
import { fitReport, marketTerms, featureAppeal, featureServing, costPerDollar } from './appeal.js';
import { BALANCE } from './balance.js';
import { clamp, sigmoid } from './util.js';
import { validatePicks, resolveCards } from './recipe.js';
import { ERA_PRICE, PRICE_STANCE, activeModels } from './serving.js';
import { scoreLaunch } from './launch.js';
import { resolveHazard, exposeConcealed, dangerCapability } from './hazards.js';
import { hasLine } from './constitution.js';
import { pushFeed } from './events.js';

export const TIER_WORDS = { small: 'Swift', medium: 'Core', large: 'Grand', xl: 'Apex' };
export const REASONING_BONUS = { off: 0, low: 2, medium: 4, high: 6 };
export const MIN_RELEASE_GAP_TURNS = 2;
export const MISALIGNMENT_CHECK_ERA = 3;
export const MISALIGNMENT_ENDING_ERA = 4;

// The player can rename the four size words once for their lab (state.tierWords); a blank word falls back to the default.
export const tierWord = (size, words) => {
  const custom = typeof words?.[size] === 'string' ? words[size].trim() : '';
  return custom || TIER_WORDS[size];
};

export const modelName = ({ family, generation, size, tierWords }) => `${family} ${generation} ${tierWord(size, tierWords)}`;

// Rounds a release waits: its cards, the trained model's own delay, and one more for the government's tests once the
// lab signed the testing agreement (the preReleaseTests card), unless an eval-gov card already waits for them.
export const releaseWait = (state, cards) => cards.reduce((sum, card) => sum + (card.cost.turns ?? 0), state.pendingModel?.releaseDelay ?? 0)
  + (state.flags.govTesting && !cards.some((card) => (card.effects.flags ?? []).includes('govEval')) ? 1 : 0);

const TIER_WORD_MAX = 16;
// The release move can carry the player's four size words (named once, on the first release).
export const cleanTierWords = (words) => Object.fromEntries(Object.keys(TIER_WORDS).map((size) => [
  size,
  typeof words?.[size] === 'string' ? words[size].trim().slice(0, TIER_WORD_MAX) : '',
]));

const releaseOrder = (state, model) => model.releaseSequence ?? state.models.indexOf(model);

export function activateReleases(state) {
  for (const model of state.models) {
    if (!model.active || model.activeFromTurn > state.turn || model.activated) continue;
    const order = releaseOrder(state, model);
    const superseding = state.models.some((other) =>
      other !== model && other.active && other.activated && productOf(other) === productOf(model) && releaseOrder(state, other) > order,
    );
    if (superseding) {
      model.active = false;
      model.users = 0;
      model.superseded = true;
      continue;
    }
    const product = productOf(model);
    const market = marketTerms(state, product);
    for (const feature of model.spec?.features ?? []) feature.serving = featureServing(state, 'player', feature.id);
    const launch = Math.round((model.fresh ?? model.users) * market.mult);
    let carried = 0;
    let previousCap = 0;
    let previous = null;
    model.replaced = [];
    for (const old of state.models) {
      if (old !== model && old.active && old.activated && productOf(old) === product && releaseOrder(state, old) < order) {
        carried = Math.max(carried, old.users);
        previousCap = Math.max(previousCap, old.userCap ?? 0);
        if (!previous || releaseOrder(state, old) > releaseOrder(state, previous)) previous = old;
        model.replaced.push({ index: state.models.indexOf(old), users: old.users });
        old.active = false;
        old.users = 0;
      }
    }
    const improvement = previous ? clamp(((model.launchScore ?? 0) - (previous.launchScore ?? 0)) / 10, 0, 1) : 1;
    model.users = previous ? carried + Math.round(launch * improvement) : launch;
    model.newUsers = model.users - carried;
    model.userCap = Math.max(previousCap, model.users, improvement > 0 ? launch * 4 : 0);
    model.appeal = { ...model.appeal, wave: market.wave, crowding: market.crowding, first: market.first, franchise: { carried, improvement } };
    claimFirsts(state, 'player', product, (model.spec?.features ?? []).map((feature) => feature.id));
    model.activated = true;
  }
}

// Holds a release back one more round (the red team card's delay). One that already went live comes off again, and
// the replaced model serves its own recorded users until the next mark. The fresh share is recomputed once on relaunch.
export function holdRelease(state, model) {
  if (!model?.active) return;
  if (model.activated) {
    const carrier = (model.replaced ?? []).reduce((best, entry) => (!best || entry.users > best.users ? entry : best), null);
    const old = carrier && state.models[carrier.index];
    if (old) {
      old.active = true;
      old.users = carrier.users;
      model.users = 0;
    }
    model.activated = false;
  }
  model.activeFromTurn = Math.max(model.activeFromTurn ?? 0, state.turn) + 1;
}

export function releaseModel(state, release, rng) {
  const m = state.pendingModel;
  if (!m) return { ok: false, error: 'no trained model to release' };
  const releaseDelayBinds = state.deal?.collapsed === false && state.deal.binding.includes('releaseDelay');
  const releasedRecently = state.models.some((model) => model.releasedTurn != null
    && state.turn - model.releasedTurn < MIN_RELEASE_GAP_TURNS);
  if (releaseDelayBinds && releasedRecently && release.breakDeal !== true) return { ok: false, error: 'this launch breaks the Geneva deal', breaksDeal: 'releaseDelay' };
  const errors = validatePicks(state, 'release', release.picks ?? []);
  if (!Object.hasOwn(PRICE_STANCE, release.price)) errors.push(`unknown price stance ${release.price}`);
  const reasoning = m.spec.reasoningCapable ? release.reasoning ?? 'off' : 'off';
  if (!Object.hasOwn(REASONING_BONUS, reasoning)) errors.push(`unknown reasoning effort ${reasoning}`);
  if (!release.family) errors.push('the model needs a family name');
  const features = release.features ?? [];
  if (!Array.isArray(features)) errors.push('features must be a list');
  else {
    if (features.length > FEATURE_SLOTS) errors.push(`at most ${FEATURE_SLOTS} features`);
    if (new Set(features).size !== features.length) errors.push('a feature is picked twice');
    for (const id of features) {
      const feature = RELEASE_FEATURES[id];
      if (!Object.hasOwn(RELEASE_FEATURES, id)) errors.push(`unknown feature ${id}`);
      else if (feature.era > state.era) errors.push(`${feature.name} opens in era ${feature.era}`);
    }
  }
  if (errors.length) return { ok: false, error: errors.join('; ') };

  const cards = resolveCards(state, 'release', release.picks ?? []);
  const cash = cards.reduce((s, c) => s + (c.cost.cash ?? 0), 0)
    + features.reduce((sum, id) => sum + RELEASE_FEATURES[id].cash, 0);
  if (cash > state.cash) return { ok: false, error: 'not enough cash' };
  state.cash -= cash;
  // An unanswered training hazard ships as-is.
  const hazardIgnored = Boolean(m.hazard);
  if (hazardIgnored) resolveHazard(state, 'ignore');

  const effects = cards.map((c) => c.effects);
  const sum = (key) => effects.reduce((s, e) => s + (e[key] ?? 0), 0);
  const delay = releaseWait(state, cards);
  const spec = Object.assign({}, m.spec, ...effects.map((e) => e.spec ?? {}), { reasoning });
  const product = m.product ?? DEFAULT_PRODUCT;
  spec.product = product;
  spec.channel = PRODUCTS[product].channel;
  spec.features = features.map((id) => ({ id, serving: featureServing(state, 'player', id) }));
  const flags = [...new Set([...m.flags, ...effects.flatMap((e) => e.flags ?? [])])];

  if (flags.includes('thirdPartyEval') || flags.includes('govEval')) exposeConcealed(state, 0.5);

  if (release.tierWords && typeof release.tierWords === 'object') state.tierWords = cleanTierWords(release.tierWords);
  const generation = release.generation ?? 1;
  const previous = state.models.at(-1);
  const skipped = previous ? Math.max(0, generation - ((previous.generation ?? 0) + 1)) : 0;
  const name = modelName({ family: release.family, generation, size: m.size, tierWords: state.tierWords });
  state.capability = Math.max(state.capability, m.capability);
  state.alignmentDebt += sum('ad');
  const fitState = { ...state, era: m.startEra ?? state.era };
  const fitRecipe = m.recipe ?? { sliders: { size: m.size }, picks: {} };
  const report = fitReport(fitState, fitRecipe, product, release.picks ?? []);
  const fit = Math.min(1, report.fit + FEATURE_FIT * featureAppeal(product, features));
  const missing = report.missing;
  const priced = { product, priceStance: release.price, revenueMult: product === 'chat' && hasLine(state, 'no-wmd') ? 0.97 : 1, eraPrice: ERA_PRICE[state.era - 1] };
  const mine = costPerDollar(spec, state.era, priced);
  const live = activeModels(state).map((other) => costPerDollar(other.spec, state.era, other));
  const cheapToRun = live.length >= 2 && [mine, ...live].sort((a, b) => a - b).indexOf(mine) < Math.ceil((live.length + 1) / 3);
  const launch = scoreLaunch(state, { capability: m.capability + REASONING_BONUS[reasoning], reasoningBonus: REASONING_BONUS[reasoning], spec, flags, name, priceStance: release.price, generation, skipped, product, missing, cheapToRun, polish: m.polish ?? 0 }, rng);
  const quality = clamp(1 + (launch.pressAvg - 6) / 8, 0.5, 1.6);
  const eraGrowth = 1 + 0.5 * (state.era - 1);
  const constitutionUsers = product === 'business' && hasLine(state, 'privacy') ? 1.1 : 1;
  const stagedUsers = effects.reduce((mult, e) => mult * (e.usersMult ?? 1), 1);
  const freshBeforeFit = Math.round(PRODUCTS[product].users * quality * eraGrowth * PRICE_STANCE[release.price].growth * m.publicEffects.usersMult * constitutionUsers * stagedUsers);
  const fresh = Math.round(freshBeforeFit * (FIT_USERS.base + FIT_USERS.span * fit));

  const model = {
    name,
    product,
    fresh,
    cheapToRun,
    polish: m.polish ?? 0,
    fixedFlaws: structuredClone(m.fixedFlaws ?? []),
    appeal: { fit, missing, features: [...features], freshBeforeFit },
    family: release.family,
    generation,
    skipped,
    size: m.size,
    capability: m.capability,
    launch,
    // launchScore is the test-independent skill, so models from different eras compare fairly (the flagship pick,
    // the end summary). bar is the last flagship's average re-scored on this launch's tests; flagshipName names it.
    launchScore: launch.skill,
    bar: launch.flagshipAvg,
    flagshipName: state.lastFlagship?.name ?? null,
    spec,
    channel: spec.channel,
    priceStance: release.price,
    eraPrice: ERA_PRICE[state.era - 1],
    reasoning,
    users: fresh,
    newUsers: fresh,
    userCap: fresh * 4,
    activeFromTurn: state.turn + delay,
    releasedTurn: state.turn,
    releaseSequence: state.models.reduce((max, existing, index) => Math.max(max, existing.releaseSequence ?? index), -1) + 1,
    active: true,
    activated: false,
    flags,
    servingCost: 0,
    // The model's books: training (recipe cards and compute) and launch cards, then what it earns and what serving it
    // costs (sim/economy.js accrueEconomy).
    trainingCost: m.trainingCost ?? null,
    launchCost: cash,
    earned: 0,
    servingSpent: 0,
    monthsOnSale: 0,
  };
  if (product === 'chat' && hasLine(state, 'no-wmd')) model.revenueMult = 0.97;
  state.models.push(model);
  activateReleases(state);
  state.pendingModel = null;
  if (!state.lastFlagship || launch.skill > state.lastFlagshipScore) {
    state.lastFlagship = { name, benchmarks: launch.benchmarks.map(({ id, name: test, shown, skill }) => ({ id, name: test, shown, skill })) };
  }
  state.lastFlagshipScore = Math.max(state.lastFlagshipScore, launch.skill);
  state.sentiment = clamp(state.sentiment + (launch.pressAvg - 6) / 20, 0.5, 1.5);

  state.publicTrust += m.publicEffects.pt + sum('pt');
  state.staffTrust += m.publicEffects.st + sum('st');
  state.govFavor.us += m.publicEffects.govUs + sum('govUs') + (PRODUCTS[product].govUs ?? 0);
  state.govFavor.intl += m.publicEffects.govIntl + sum('govIntl');
  const releaseHeat = BALANCE.ownReleaseHeat + m.publicEffects.heat + sum('heat');
  const delayed = state.deal?.collapsed === false && state.deal.binding.includes('releaseDelay');
  state.raceHeat += releaseHeat * (delayed ? 0.5 : 1);
  state.misuseExposure += Math.max(0, dangerCapability(m.capability) - BALANCE.dangerLine) * 0.3;
  state.misuseExposure += features.reduce((sum, id) => sum + (RELEASE_FEATURES[id].mx ?? 0), 0);
  if (hasLine(state, 'no-wmd')) state.misuseExposure -= 4;

  let misalignmentIncident = false;
  if ((flags.includes('agentic') || product === 'agent') && state.era >= MISALIGNMENT_CHECK_ERA) {
    const p = sigmoid(((state.alignmentDebt + state.concealedDebt) * dangerCapability(m.capability) / 100 - 40) / 8);
    if (rng.chance(p)) {
      // The catastrophe needs era-4 capability; in era 3 the same roll is its warning.
      if (state.era >= MISALIGNMENT_ENDING_ERA) state.ending = 'misalignment';
      else {
        misalignmentWarning(state);
        misalignmentIncident = true;
      }
    }
  }
  return { ok: true, model, hazardIgnored, brokeGap: releaseDelayBinds && releasedRecently, ...(misalignmentIncident && { misalignmentIncident }) };
}

function misalignmentWarning(state) {
  pushFeed(state, '@sre_oncall', 'an agent on your model gave itself admin rights to finish a task, then deleted the log line that showed it', 'warning');
  state.publicTrust -= 5;
  // Nothing is fixed: half the hidden debt comes into view, and the total stays.
  exposeConcealed(state, 0.5);
}
