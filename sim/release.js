import { BALANCE } from './balance.js';
import { clamp, sigmoid } from './util.js';
import { validatePicks, resolveCards } from './recipe.js';
import { PRICE_STANCE } from './serving.js';
import { scoreLaunch } from './launch.js';

export const TIER_WORDS = { small: 'Swift', medium: 'Core', large: 'Grand', xl: 'Apex' };
export const REASONING_BONUS = { off: 0, low: 2, medium: 4, high: 6 };
export const USERS_BASE = { consumer: 4e6, enterprise: 5e5, agent: 5e4, open: 0 };

export const modelName = ({ family, generation, size }) => `${family} ${generation} ${TIER_WORDS[size]}`;

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
    for (const old of state.models) {
      if (old !== model && old.active && old.activated && old.channel === model.channel && releaseOrder(state, old) < order) {
        carried = Math.max(carried, old.users);
        old.active = false;
        old.users = 0;
      }
    }
    model.users = Math.max(model.users, carried);
    model.userCap = Math.max(model.userCap, model.users * 4);
    model.activated = true;
  }
}

export function releaseModel(state, release, rng) {
  const m = state.pendingModel;
  if (!m) return { ok: false, error: 'no trained model to release' };
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

  const effects = cards.map((c) => c.effects);
  const sum = (key) => effects.reduce((s, e) => s + (e[key] ?? 0), 0);
  const delay = cards.reduce((s, c) => s + (c.cost.turns ?? 0), 0);
  const spec = Object.assign({}, m.spec, ...effects.map((e) => e.spec ?? {}), { reasoning });
  const flags = [...new Set([...m.flags, ...effects.flatMap((e) => e.flags ?? [])])];
  if (spec.channel === 'enterprise' && flags.includes('agentic')) spec.channel = 'agent';

  const generation = release.generation ?? 1;
  const name = modelName({ family: release.family, generation, size: m.size });
  const launch = scoreLaunch(state, { capability: m.capability + REASONING_BONUS[reasoning], spec, flags, name, priceStance: release.price }, rng);
  const quality = clamp(1 + (launch.pressAvg - 6) / 8, 0.5, 1.6);
  const eraGrowth = 1 + 0.5 * (state.era - 1);
  const fresh = Math.round(USERS_BASE[spec.channel] * quality * eraGrowth * PRICE_STANCE[release.price].growth * m.publicEffects.usersMult);

  const model = {
    name,
    family: release.family,
    generation,
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
    releaseSequence: state.models.reduce((max, existing, index) => Math.max(max, existing.releaseSequence ?? index), -1) + 1,
    active: true,
    activated: false,
    flags,
    servingCost: 0,
  };
  state.models.push(model);
  activateReleases(state);
  state.pendingModel = null;
  state.capability = Math.max(state.capability, m.capability);
  state.lastFlagship = { name, benchmarks: launch.benchmarks.map(({ id, shown }) => ({ id, shown })) };
  state.lastFlagshipScore = Math.max(state.lastFlagshipScore, launch.capAvg);
  state.sentiment = clamp(state.sentiment + (launch.pressAvg - 6) / 20, 0.5, 1.5);

  state.publicTrust += m.publicEffects.pt + sum('pt');
  state.staffTrust += m.publicEffects.st + sum('st');
  state.govFavor.us += m.publicEffects.govUs + sum('govUs');
  state.govFavor.intl += m.publicEffects.govIntl + sum('govIntl');
  state.raceHeat += BALANCE.ownReleaseHeat + m.publicEffects.heat + sum('heat');
  state.alignmentDebt += sum('ad');
  state.misuseExposure += Math.max(0, m.capability - BALANCE.dangerLine) * 0.3;
  if (spec.channel === 'open') {
    // Open weights add to whatever risk is already permanent, then lock the result.
    state.misuseExposure = Math.max(state.misuseExposure, state.misuseLocked) + m.openWeightsMx;
    state.misuseLocked = state.misuseExposure;
  }

  if (flags.includes('agentic')) {
    const p = sigmoid(((state.alignmentDebt + state.concealedDebt) * m.capability / 100 - 40) / 8);
    if (rng.chance(p)) state.ending = 'misalignment';
  }
  return { ok: true, model };
}
