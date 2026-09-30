import { BALANCE } from './balance.js';
import { clamp } from './util.js';
import { validatePicks, resolveCards } from './recipe.js';
import { ERA_PRICE, PRICE_STANCE } from './serving.js';
import { scoreLaunch } from './launch.js';
import { resolveHazard, exposeConcealed, dangerCapability } from './hazards.js';
import { hasLine } from './constitution.js';
import { pushFeed } from './events.js';
import { eraById } from './data/eras.js';

export const TIER_WORDS = { small: 'Swift', medium: 'Core', large: 'Grand', xl: 'Apex' };
export const REASONING_BONUS = { off: 0, low: 2, medium: 4, high: 6 };
export const USERS_BASE = { consumer: 4e6, enterprise: 5e5, agent: 5e4, open: 0 };
export const MIN_RELEASE_GAP_TURNS = 2;
export const MISALIGNMENT_CHECK_ERA = 3;
export const MISALIGNMENT_ENDING_ERA = 4;
// Owner 2026-09-26, no dice: an agent release goes wrong when hidden debt × capability / 100 reaches the line (the old
// roll's even-chance point). Capability counts only up to 100 here (owner pick A, the capability cap).
export const MISALIGNMENT_LINE = 35;
export const misalignmentScore = (state, capability) => (state.alignmentDebt + state.concealedDebt) * dangerCapability(capability) / 100;

// The player can rename the four size words once for their lab (state.tierWords); a blank word falls back to the default.
export const tierWord = (size, words) => {
  const custom = typeof words?.[size] === 'string' ? words[size].trim() : '';
  return custom || TIER_WORDS[size];
};

export const modelName = ({ family, generation, size, tierWords }) => `${family} ${generation} ${tierWord(size, tierWords)}`;

// Outside testing the lab promised: the government's tests (the preReleaseTests card) and the White House's outside
// testers (whiteHouseCommitments, "Sign all of it"; owner 2026-09-26 "add it"). The testers get a few weeks first. Where
// a round is a month or less (era 3 on) that is one round's wait; in the three-month rounds of eras 1-2 they cost
// nothing (owner pick D1, 2026-09-26). One round covers both promises, and a release whose own eval card already waits
// for outsiders (eval-gov; eval-third for the testers) adds nothing more.
function testerNeeds(state, cards) {
  const flags = new Set(cards.flatMap((card) => card.effects.flags ?? []));
  const government = Boolean(state.flags.govTesting) && !flags.has('govEval');
  const testers = Boolean(state.flags.outsideTesters) && !flags.has('govEval') && !flags.has('thirdPartyEval');
  return { government, testers, shortRounds: eraById(state.era).monthsPerTurn <= 1 };
}

export function testerWait(state, cards) {
  const need = testerNeeds(state, cards);
  return need.government || (need.testers && need.shortRounds) ? 1 : 0;
}

export const releaseWait = (state, cards) => cards.reduce((sum, card) => sum + (card.cost.turns ?? 0), state.pendingModel?.releaseDelay ?? 0)
  + testerWait(state, cards);

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
      other !== model && other.active && other.activated && other.channel === model.channel && releaseOrder(state, other) > order,
    );
    if (superseding) {
      model.active = false;
      model.users = 0;
      model.superseded = true;
      continue;
    }
    let carried = 0;
    // Remembered so a release pulled back before its next round (holdRelease) can hand the channel back.
    model.replaced = [];
    for (const old of state.models) {
      if (old !== model && old.active && old.activated && old.channel === model.channel && releaseOrder(state, old) < order) {
        carried = Math.max(carried, old.users);
        model.replaced.push({ index: state.models.indexOf(old), users: old.users });
        old.active = false;
        old.users = 0;
      }
    }
    model.users = Math.max(model.users, carried);
    model.userCap = Math.max(model.userCap, model.users * 4);
    model.activated = true;
  }
}

// Holds a release back one more round (the red team card's delay). One that already went live comes off again, and
// the model it replaced serves the channel's users as they are now (after anything that happened while it was live)
// until the release relaunches at the next mark, when activateReleases carries them over again.
export function holdRelease(state, model) {
  if (!model?.active) return;
  if (model.activated) {
    const carrier = (model.replaced ?? []).reduce((best, entry) => (!best || entry.users > best.users ? entry : best), null);
    const old = carrier && state.models[carrier.index];
    if (old) {
      old.active = true;
      old.users = model.users;
      model.users = 0;
    }
    model.activated = false;
  }
  model.activeFromTurn = Math.max(model.activeFromTurn ?? 0, state.turn) + 1;
}

export function releaseModel(state, release) {
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
  if (errors.length) return { ok: false, error: errors.join('; ') };

  const cards = resolveCards(state, 'release', release.picks ?? []);
  const cash = cards.reduce((s, c) => s + (c.cost.cash ?? 0), 0);
  if (cash > state.cash) return { ok: false, error: 'not enough cash' };
  state.cash -= cash;
  // An unanswered training hazard ships as-is.
  const hazardIgnored = Boolean(m.hazard);
  if (hazardIgnored) resolveHazard(state, 'ignore');

  const effects = cards.map((c) => c.effects);
  const sum = (key) => effects.reduce((s, e) => s + (e[key] ?? 0), 0);
  const delay = releaseWait(state, cards);
  const spec = Object.assign({}, m.spec, ...effects.map((e) => e.spec ?? {}), { reasoning });
  const flags = [...new Set([...m.flags, ...effects.flatMap((e) => e.flags ?? [])])];
  if (spec.channel === 'enterprise' && flags.includes('agentic')) spec.channel = 'agent';

  if (flags.includes('thirdPartyEval') || flags.includes('govEval')) exposeConcealed(state, 0.5);

  if (release.tierWords && typeof release.tierWords === 'object') state.tierWords = cleanTierWords(release.tierWords);
  const generation = release.generation ?? 1;
  const previous = state.models.at(-1);
  const skipped = previous ? Math.max(0, generation - ((previous.generation ?? 0) + 1)) : 0;
  const name = modelName({ family: release.family, generation, size: m.size, tierWords: state.tierWords });
  state.capability = Math.max(state.capability, m.capability);
  state.alignmentDebt += sum('ad');
  const launch = scoreLaunch(state, { capability: m.capability + REASONING_BONUS[reasoning], reasoningBonus: REASONING_BONUS[reasoning], spec, flags, name, priceStance: release.price, generation, skipped, polish: m.polish ?? 0 });
  const quality = clamp(1 + (launch.economyPressAvg - 6) / 8, 0.5, 1.6);
  const eraGrowth = 1 + 0.5 * (state.era - 1);
  const constitutionUsers = spec.channel === 'enterprise' && hasLine(state, 'privacy') ? 1.1 : 1;
  const fresh = Math.round(USERS_BASE[spec.channel] * quality * eraGrowth * PRICE_STANCE[release.price].growth * m.publicEffects.usersMult * constitutionUsers);

  const model = {
    polish: m.polish ?? 0,
    fixedFlaws: structuredClone(m.fixedFlaws ?? []),
    name,
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
  if (spec.channel === 'consumer' && hasLine(state, 'no-wmd')) model.revenueMult = 0.97;
  state.models.push(model);
  activateReleases(state);
  state.pendingModel = null;
  if (!state.lastFlagship || launch.skill > state.lastFlagshipScore) {
    state.lastFlagship = { name, benchmarks: launch.benchmarks.map(({ id, name: test, shown, skill }) => ({ id, name: test, shown, skill })) };
  }
  state.lastFlagshipScore = Math.max(state.lastFlagshipScore, launch.skill);
  state.sentiment = clamp(state.sentiment + (launch.economyPressAvg - 6) / 20, 0.5, 1.5);

  state.publicTrust += m.publicEffects.pt + sum('pt');
  state.staffTrust += m.publicEffects.st + sum('st');
  state.govFavor.us += m.publicEffects.govUs + sum('govUs');
  state.govFavor.intl += m.publicEffects.govIntl + sum('govIntl');
  const releaseHeat = BALANCE.ownReleaseHeat + m.publicEffects.heat + sum('heat');
  const delayed = state.deal?.collapsed === false && state.deal.binding.includes('releaseDelay');
  state.raceHeat += releaseHeat * (delayed ? 0.5 : 1);
  state.misuseExposure += Math.max(0, dangerCapability(m.capability) - BALANCE.dangerLine) * 0.3;
  if (spec.channel === 'open') {
    state.flags.openWeights = true;
    // Open weights add to whatever risk is already permanent, then lock the result.
    state.misuseExposure = Math.max(state.misuseExposure, state.misuseLocked) + m.openWeightsMx;
    if (hasLine(state, 'no-wmd')) state.misuseExposure -= 4;
    state.misuseLocked = state.misuseExposure;
  } else if (hasLine(state, 'no-wmd')) state.misuseExposure -= 4;

  let misalignmentIncident = false;
  if (flags.includes('agentic') && state.era >= MISALIGNMENT_CHECK_ERA) {
    if (misalignmentScore(state, m.capability) >= MISALIGNMENT_LINE) {
      // The catastrophe needs era-4 capability; in era 3 crossing the same line is its warning.
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
