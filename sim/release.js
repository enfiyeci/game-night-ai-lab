import { BALANCE } from './balance.js';
import { clamp, sigmoid } from './util.js';
import { validatePicks, resolveCards } from './recipe.js';
import { PRICE_STANCE } from './serving.js';
import { scoreLaunch } from './launch.js';
import { resolveHazard, exposeConcealed } from './hazards.js';
import { hasLine } from './constitution.js';
import { pushFeed } from './events.js';

export const TIER_WORDS = { small: 'Swift', medium: 'Core', large: 'Grand', xl: 'Apex' };
export const REASONING_BONUS = { off: 0, low: 2, medium: 4, high: 6 };
export const USERS_BASE = { consumer: 4e6, enterprise: 5e5, agent: 5e4, open: 0 };
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
  const launch = scoreLaunch(state, { capability: m.capability + REASONING_BONUS[reasoning], spec, flags, name, priceStance: release.price, generation, skipped, polish: m.polish ?? 0 }, rng);
  const quality = clamp(1 + (launch.pressAvg - 6) / 8, 0.5, 1.6);
  const eraGrowth = 1 + 0.5 * (state.era - 1);
  const constitutionUsers = spec.channel === 'enterprise' && hasLine(state, 'privacy') ? 1.1 : 1;
  const fresh = Math.round(USERS_BASE[spec.channel] * quality * eraGrowth * PRICE_STANCE[release.price].growth * m.publicEffects.usersMult * constitutionUsers);

  const model = {
    name,
    family: release.family,
    generation,
    skipped,
    size: m.size,
    capability: m.capability,
    launch,
    launchScore: launch.capAvg,
    bar: state.lastFlagshipScore,
    spec,
    channel: spec.channel,
    priceStance: release.price,
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
    polish: m.polish ?? 0,
    fixedFlaws: m.fixedFlaws ?? [],
    servingCost: 0,
  };
  if (spec.channel === 'consumer' && hasLine(state, 'no-wmd')) model.revenueMult = 0.97;
  state.models.push(model);
  activateReleases(state);
  state.pendingModel = null;
  if (!state.lastFlagship || launch.capAvg > state.lastFlagshipScore) {
    state.lastFlagship = { name, benchmarks: launch.benchmarks.map(({ id, shown }) => ({ id, shown })) };
  }
  state.lastFlagshipScore = Math.max(state.lastFlagshipScore, launch.capAvg);
  state.sentiment = clamp(state.sentiment + (launch.pressAvg - 6) / 20, 0.5, 1.5);

  state.publicTrust += m.publicEffects.pt + sum('pt');
  state.staffTrust += m.publicEffects.st + sum('st');
  state.govFavor.us += m.publicEffects.govUs + sum('govUs');
  state.govFavor.intl += m.publicEffects.govIntl + sum('govIntl');
  const releaseHeat = BALANCE.ownReleaseHeat + m.publicEffects.heat + sum('heat');
  const delayed = state.deal?.collapsed === false && state.deal.binding.includes('releaseDelay');
  state.raceHeat += releaseHeat * (delayed ? 0.5 : 1);
  state.misuseExposure += Math.max(0, m.capability - BALANCE.dangerLine) * 0.3;
  if (spec.channel === 'open') {
    state.flags.openWeights = true;
    // Open weights add to whatever risk is already permanent, then lock the result.
    state.misuseExposure = Math.max(state.misuseExposure, state.misuseLocked) + m.openWeightsMx;
    if (hasLine(state, 'no-wmd')) state.misuseExposure -= 4;
    state.misuseLocked = state.misuseExposure;
  } else if (hasLine(state, 'no-wmd')) state.misuseExposure -= 4;

  let misalignmentIncident = false;
  if (flags.includes('agentic') && state.era >= MISALIGNMENT_CHECK_ERA) {
    const p = sigmoid(((state.alignmentDebt + state.concealedDebt) * m.capability / 100 - 40) / 8);
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
