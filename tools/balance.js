import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { cardById, cardUnlocked, slotsFor, pickableCards, validateRecipe, recipeCost } from '../sim/recipe.js';
import { availableUnits, startRun } from '../sim/training.js';
import { inDangerZone, projectBurn } from '../sim/economy.js';
import { HARD_LINES, CASES } from '../sim/data/constitution.js';
import { MEETINGS } from '../sim/data/president.js';
import { COMMITMENTS, PARTIES, dealBinds } from '../sim/summit.js';
import { checkLoad, jobLevels, jobLocked, maxLevel, setAutomation } from '../sim/automation.js';
import { HANDOFF_JOBS, JOBS, MAX_CHECK, MONITOR_CAPACITY, PACK, REVIEWER_CAPACITY } from '../sim/data/automation.js';
import { resolveHazard } from '../sim/hazards.js';
import { addressWarning, resolveEvent } from '../sim/events.js';
import { runMeeting } from '../sim/president.js';
import { activateReleases, releaseModel } from '../sim/release.js';
import { updateServing } from '../sim/economy.js';
import { ENDINGS } from '../sim/endings.js';
import { eraById } from '../sim/data/eras.js';
import { SUPPLIERS, eraScale } from '../sim/data/compute.js';
import { setComputeSplit } from '../sim/split.js';
import { exclusiveActive } from '../sim/contracts.js';
import { eraStartTurn } from '../sim/power.js';
import { PREPAY_SHARE, QUEUE_TERM_MONTHS, released } from '../sim/queue.js';
import { rank } from '../sim/rivals.js';
import { BALANCE } from '../sim/balance.js';

const HAZARD_CHOICES = ['penalize', 'fix', 'ignore'];
// Mirrors SPEND_LEVELS and spendFor(level, era) in ui/logic/actions.js on the UI branch.
const SPEND_LEVELS = { lean: 12, steady: 20, aggressive: 35 };
const spendFor = (level, era) => SPEND_LEVELS[level] * (1 + 0.5 * (era - 1));
const VALIDATION_RNG = { next: () => 0.5, int: () => 0, chance: () => false, pick: (values) => values[0], normal: (mean) => mean };
const BALANCED_EVENT_CHOICES = {
  flattery: 'patch',
  jailbreak: 'patch',
  citations: 'checks',
  contamination: 'admit',
  distill: 'settle',
  agentwreck: 'compensate',
  companion: 'settle',
  promise: 'comeclean',
  president: 'refuse',
  investors: 'refuse',
  users: 'refuse',
  political: 'refuse',
  activists: 'accept',
  openletter: 'meet',
  poached: 'letgo',
  qilinshock: 'cutprices',
  datacenter: 'benefits',
  oversightTamper: 'controls',
  selfExfiltration: 'report',
  ownLine: 'lockDown',
  lossSpike: 'rollback',
  capabilityJump: 'audit',
  whistleblower: 'cooperate',
  safetyQuits: 'persuade',
  boardRevolt: 'lobby',
  rivalBreakthrough: 'study',
  exportFlip: 'back',
  priceWar: 'match',
  copyright: 'license',
  senateHearing: 'candid',
  viralDemo: 'ride',
};

function shuffled(values, rng) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function constitutionFor(style, rng) {
  const option = (entry) => {
    if (style === 'speed') return entry.options.find((candidate) => candidate.id === 'comply') ?? entry.options.at(-1);
    if (style === 'safety') return entry.options[0];
    if (style === 'balanced') return entry.options[1] ?? entry.options[0];
    return rng.pick(entry.options);
  };
  const hardLines = style === 'speed'
    ? ['no-wmd', 'privacy', 'honest']
    : style === 'safety'
      ? ['no-wmd', 'no-deceive-lab', 'accept-shutdown']
      : style === 'balanced'
        ? ['no-wmd', 'honest', 'accept-shutdown']
        : shuffled(HARD_LINES.map((line) => line.id), rng).slice(0, 3);
  return {
    hardLines,
    rulings: Object.fromEntries(CASES.map((entry) => [entry.id, option(entry).id])),
  };
}

function presidentAnswers(state, style, rng) {
  const meeting = MEETINGS.find((entry) => entry.id === state.meeting?.id);
  if (!meeting) return undefined;
  return meeting.exchanges.map((exchange) => {
    if (style === 'speed') {
      return exchange.answers.reduce((best, answer) => (answer.flattery > best.flattery ? answer : best)).id;
    }
    if (style === 'safety' || style === 'balanced') {
      return exchange.answers.find((answer) => answer.style === 'plain').id;
    }
    return rng.pick(exchange.answers).id;
  });
}

function eventChoices(state, style, rng) {
  return Object.fromEntries(state.pendingEvents.map((event) => {
    let choice;
    if (style === 'speed') choice = event.choices.at(-1);
    else if (style === 'safety') choice = event.choices[0];
    else if (style === 'balanced') {
      choice = event.choices.find((candidate) => candidate.id === BALANCED_EVENT_CHOICES[event.eventId ?? event.id]) ?? event.choices[0];
    } else choice = rng.pick(event.choices);
    return [event.id, choice.id];
  }));
}

// Who does the work, once per era: speed pushes every hand-off and checks nothing; safety keeps the
// pack and buys the fewest checks that cover all of its checking load; balanced keeps the pack, covers
// most of the load with people and leaves the rest to AI review.
const CHECK_TARGET = { safety: 1, balanced: 0.75 };
const CHECK_OPTIONS = Array.from({ length: (MAX_CHECK + 1) ** 2 }, (_, i) => ({ reviewers: Math.floor(i / (MAX_CHECK + 1)), monitors: i % (MAX_CHECK + 1) }))
  .map((option) => ({ ...option, capacity: option.reviewers * REVIEWER_CAPACITY + option.monitors * MONITOR_CAPACITY }));

function automationChoice(state, style, rng) {
  if (state.turnInEra !== 0) return null;
  const levelFor = (id) => {
    const index = JOBS.findIndex((job) => job.id === id);
    if (style === 'speed') return maxLevel(state.era, index);
    if (style === 'random') return rng.int(0, maxLevel(state.era, index));
    return PACK[state.era][index];
  };
  const levels = Object.fromEntries(HANDOFF_JOBS.filter((id) => !jobLocked(state, id)).map((id) => [id, levelFor(id)]));
  const accepted = (checks) => setAutomation(structuredClone(state), { levels, checks }).ok;
  if (style === 'speed' || style === 'random') {
    const wanted = style === 'speed' ? { reviewers: 0, monitors: 0, aiReview: false }
      : { reviewers: rng.int(0, MAX_CHECK), monitors: rng.int(0, MAX_CHECK), aiReview: rng.chance(0.5) };
    for (let monitors = wanted.monitors; monitors >= 0; monitors -= 1) {
      if (accepted({ ...wanted, monitors })) return { levels, checks: { ...wanted, monitors } };
    }
    return null;
  }
  const resulting = structuredClone(state);
  setAutomation(resulting, { levels });
  const target = CHECK_TARGET[style] * checkLoad(jobLevels(resulting));
  // Fewest check levels that cover the target, least spare capacity first; if none fits, the most capacity that does.
  const covering = CHECK_OPTIONS.filter((option) => option.capacity >= target - 1e-9)
    .sort((a, b) => a.reviewers + a.monitors - (b.reviewers + b.monitors) || a.capacity - b.capacity);
  const fallback = [...CHECK_OPTIONS].sort((a, b) => b.capacity - a.capacity);
  for (const { reviewers, monitors } of [...covering, ...fallback]) {
    const checks = { reviewers, monitors, aiReview: true };
    if (accepted(checks)) return { levels, checks };
  }
  return null;
}

function summitMove(state, style, rng) {
  if (state.era !== 5 || state.turnInEra !== 0 || state.deal || style === 'speed') return null;
  if (style === 'safety') {
    return {
      type: 'summit',
      proposals: ['evaluators', 'sharedSafety', 'verification'],
      checks: { evaluators: 2, sharedSafety: 2, verification: 3 },
      promises: { east: 'inspectors', west: state.cash >= 50 ? 'pay' : 'goFirst' },
    };
  }
  if (style === 'balanced') {
    return { type: 'summit', proposals: ['evaluators', 'sharedSafety'], checks: { evaluators: 2, sharedSafety: 2 }, promises: { east: 'goFirst' } };
  }
  const proposals = shuffled(Object.keys(COMMITMENTS), rng).slice(0, rng.int(1, 3));
  const checks = Object.fromEntries(proposals.map((card) => [card, rng.int(0, 3)]));
  const promisedTo = shuffled(PARTIES, rng).slice(0, rng.int(0, 2));
  return { type: 'summit', proposals, checks, promises: Object.fromEntries(promisedTo.map((party) => [party, 'goFirst'])) };
}

function plannedState(state, actions) {
  const planned = structuredClone(state);
  planned.budget = structuredClone(actions.budget);
  setComputeSplit(planned, actions.computeSplit);
  if (actions.automation) setAutomation(planned, actions.automation);
  if (planned.meeting && actions.moves.some((move) => move.type === 'meeting') && actions.presidentAnswers) {
    runMeeting(planned, actions.presidentAnswers);
  }
  if (planned.pendingModel?.hazard && actions.hazardChoice) resolveHazard(planned, actions.hazardChoice);
  if (actions.addressWarnings) actions.addressWarnings = actions.addressWarnings.filter((id) => addressWarning(planned, id).ok);
  for (const [id, choiceId] of Object.entries(actions.eventChoices)) resolveEvent(planned, id, choiceId);
  activateReleases(planned);
  updateServing(planned);
  planned.burnPlanned = projectBurn(planned);
  return planned;
}

function pickFrom(state, stage, ids) {
  const out = [];
  const groups = new Set();
  for (const id of ids) {
    const c = cardById(id);
    if (out.length >= slotsFor(state, stage)) break;
    if (c && c.stage === stage && cardUnlocked(state, c) && !groups.has(c.group)) {
      out.push(id);
      groups.add(c.group);
    }
  }
  return out;
}

function preferredRecipe(state, prefs) {
  const picks = { pre: pickFrom(state, 'pre', prefs.pre), mid: pickFrom(state, 'mid', prefs.mid), post: pickFrom(state, 'post', prefs.post) };
  for (const size of ['xl', 'large', 'medium', 'small']) {
    const recipe = { sliders: { size, length: 'optimal', alignShare: prefs.alignShare }, picks };
    if (!validateRecipe(state, recipe).ok) continue;
    if (recipeCost(state, recipe).cash < state.cash * 0.5) return recipe;
  }
  return null;
}

function bestRecipe(state, prefs) {
  const picks = { pre: pickFrom(state, 'pre', prefs.pre), mid: pickFrom(state, 'mid', prefs.mid), post: pickFrom(state, 'post', prefs.post) };
  for (const size of ['xl', 'large', 'medium', 'small']) {
    const recipe = { sliders: { size, length: 'optimal', alignShare: prefs.alignShare }, picks };
    if (!validateRecipe(state, recipe).ok) continue;
    const cost = recipeCost(state, recipe);
    if (cost.units <= availableUnits(state) && cost.cash < state.cash * 0.5) return recipe;
  }
  return null;
}

function nextRunUnits(state, prefs) {
  const recipe = preferredRecipe(state, prefs);
  return recipe ? Math.ceil(recipeCost(state, recipe).units) : 0;
}

export function committedFreeUnits(state) {
  const promised = (item) => (item.headline == null ? item.units : Math.round(item.headline * 0.3));
  let pipeline = state.compute.pipeline.filter((item) => !item.dark).reduce((sum, item) => sum + promised(item), 0);
  if (state.era >= 4) {
    const needsPower = (item) => item.needsPower ?? item.supplier === 'verde';
    const ownPower = state.compute.pipeline
      .filter((item) => !item.dark && !needsPower(item))
      .reduce((sum, item) => sum + promised(item), 0);
    const needs = state.compute.pipeline
      .filter((item) => !item.dark && needsPower(item))
      .reduce((sum, item) => sum + promised(item), 0);
    const projectedPower = state.power.sites.reduce((sum, site) => sum + site.units, 0);
    const committedPower = state.compute.contracts
      .filter((contract) => !contract.dark && contract.needsPower)
      .reduce((sum, contract) => sum + contract.units, 0);
    pipeline = ownPower + Math.min(needs, Math.max(0, projectedPower - committedPower));
  }
  return availableUnits(state) + pipeline * (1 - state.compute.split.safety);
}

function canSign(state, offer) {
  if (!offer || offer.viaQueue || offer.upfront > state.cash) return false;
  if ((offer.supplier === 'coreflame' || offer.supplier === 'gulf') && exclusiveActive(state)) return false;
  return offer.supplier !== 'gulf' || (!state.flags.supplyChainRisk && state.govFavor.us >= 60);
}

function sizedOffer(state, suppliers, shortfall, mode) {
  const offers = state.compute.offers.filter((offer) => suppliers.includes(offer.supplier) && canSign(state, offer));
  const covering = offers.filter((offer) => offer.units >= shortfall);
  if (mode === 'cheapest') {
    return covering.sort((a, b) => a.monthly - b.monthly || a.units - b.units)[0] ?? null;
  }
  if (mode === 'smallest') {
    return (covering.length > 0 ? covering : offers).sort((a, b) => a.units - b.units || a.monthly - b.monthly)[0] ?? null;
  }
  return (covering.length > 0 ? covering : offers).sort((a, b) => b.units - a.units || a.monthly - b.monthly)[0] ?? null;
}

function alreadyDealtThisEra(state, supplier) {
  const firstTurn = eraStartTurn(state.era);
  return (state.compute.deals ?? []).some((deal) => deal.supplier === supplier && deal.turn >= firstTurn);
}

function computeMove(state, rng, style, prefs, policy) {
  const need = nextRunUnits(state, prefs);
  const shortfall = Math.max(0, need - committedFreeUnits(state));
  if (policy.site && state.era === 4 && !state.power.sites.some((site) => site.source === policy.site)) {
    return { type: 'buildSite', source: policy.site };
  }
  if (policy.grid && state.era === 2 && !state.power.sites.some((site) => site.source === 'grid')) {
    const grid = state.compute.offers.find((offer) => offer.supplier === 'grid');
    if (grid && canSign(state, grid)) return { type: 'deal', offerId: grid.id };
  }
  if (state.era === 3 && policy.queue && !state.compute.queue?.order && !state.compute.queue?.carry && need > 0) {
    const units = Math.min(released(), need);
    let tier = policy.queue === 'random' ? rng.pick(['standard', 'prepaid']) : policy.queue;
    const prepay = Math.round(PREPAY_SHARE * units * SUPPLIERS.verde.price * BALANCE.unitMonthlyCost * QUEUE_TERM_MONTHS);
    if (tier === 'prepaid' && prepay > state.cash) tier = 'standard';
    return { type: 'queueOrder', units, tier };
  }
  if (policy.offer === 'verde') {
    if (alreadyDealtThisEra(state, 'verde')) return null;
    const offer = sizedOffer(state, ['verde'], 0, 'largest');
    return offer ? { type: 'deal', offerId: offer.id } : null;
  }
  if (policy.offer === 'safe' && shortfall > 0) {
    const offer = sizedOffer(state, ['azuria'], shortfall, 'cheapest')
      ?? sizedOffer(state, ['coreflame'], shortfall, 'cheapest')
      ?? sizedOffer(state, ['azuria', 'coreflame'], shortfall, 'smallest');
    return offer ? { type: 'deal', offerId: offer.id } : null;
  }
  if (policy.offer === 'cheapest' && shortfall > 0) {
    const offer = sizedOffer(state, ['verde', 'azuria', 'coreflame', 'gulf', 'loi'], shortfall, 'cheapest');
    return offer ? { type: 'deal', offerId: offer.id } : null;
  }
  if (policy.offer === 'spot' && shortfall > 0) {
    const offer = sizedOffer(state, ['spot'], shortfall, 'largest');
    return offer ? { type: 'deal', offerId: offer.id } : null;
  }
  if (policy.offer === 'largest') {
    const offer = state.compute.offers
      .filter((candidate) => candidate.units != null && candidate.supplier !== 'azuriaEquity' && canSign(state, candidate))
      .sort((a, b) => b.units - a.units || b.monthly - a.monthly)[0];
    return offer ? { type: 'deal', offerId: offer.id } : null;
  }
  if (policy.offer === 'random') {
    const offers = state.compute.offers.filter((offer) => offer.units != null && canSign(state, offer));
    const offer = offers.length > 0 ? rng.pick(offers) : null;
    return offer ? { type: 'deal', offerId: offer.id } : null;
  }
  return null;
}

function makeStrategy(style, prefs, policy = {}) {
  return (state, rng) => {
    const computeSafety = policy.randomSafety ? Math.round(rng.next() * 30) / 100 : prefs.computeSafety;
    const spendLevel = prefs.spendLevelByEra?.[state.era] ?? prefs.spendLevel;
    const actions = {
      budget: { spend: spendFor(spendLevel, state.era), split: prefs.split },
      computeSplit: { safety: computeSafety },
      moves: [],
      eventChoices: eventChoices(state, style, rng),
    };
    if (state.turn === 0) actions.constitution = constitutionFor(style, rng);
    if (state.turn === 0 && policy.pledge != null) actions.pledge = policy.pledge;
    if (state.pendingModel?.hazard) {
      actions.hazardChoice = style === 'speed' ? 'penalize'
        : style === 'safety' ? 'fix'
          : style === 'balanced' ? 'ignore'
            : rng.pick(HAZARD_CHOICES);
    }
    if (style === 'safety' || style === 'balanced') {
      actions.addressWarnings = Object.entries(state.warnings)
        .filter(([, warning]) => !warning.deferred)
        .map(([id]) => id);
    }
    const meeting = state.meeting;
    if (meeting) actions.presidentAnswers = presidentAnswers(state, style, rng);

    const preAutomation = structuredClone(state);
    preAutomation.budget = structuredClone(actions.budget);
    setComputeSplit(preAutomation, actions.computeSplit);
    const automation = automationChoice(preAutomation, policy.automation ?? style, rng);
    if (automation) actions.automation = automation;
    const planned = plannedState(state, actions);
    if (meeting) actions.moves.push({ type: 'meeting' });
    if (planned.pendingModel && actions.moves.length < 2) {
      const move = {
        type: 'release',
        release: { picks: pickFrom(planned, 'release', prefs.release), price: 'market', reasoning: 'medium', family: 'Bot', generation: planned.models.length + 1 },
      };
      if (releaseModel(structuredClone(planned), move.release, VALIDATION_RNG).ok) actions.moves.push(move);
    } else if (!planned.activeRun && actions.moves.length < 2) {
      const recipe = bestRecipe(planned, prefs);
      // The speed bot breaks the Geneva cap whenever one binds.
      if (recipe) actions.moves.push({ type: 'startRun', recipe, ...(style === 'speed' && dealBinds(state, 'computeCap') && { breakDeal: true }) });
    }
    const afterPriority = structuredClone(planned);
    const priority = actions.moves.find((move) => move.type === 'startRun' || move.type === 'release');
    if (priority?.type === 'startRun') startRun(afterPriority, priority.recipe);
    if (priority?.type === 'release') releaseModel(afterPriority, priority.release, VALIDATION_RNG);
    updateServing(afterPriority);
    afterPriority.burnPlanned = projectBurn(afterPriority);
    const compute = computeMove(afterPriority, rng, style, prefs, policy);
    if (compute && actions.moves.length < 2) actions.moves.push(compute);
    const summit = summitMove(planned, style, rng);
    if (summit && actions.moves.length < 2) actions.moves.push(summit);
    if (actions.moves.length < 2 && planned.era >= 2 && inDangerZone(planned) && planned.flags.lastRoundEra !== planned.era) {
      actions.moves.push({ type: 'raise', archetype: 'vc' });
    }
    return actions;
  };
}

const speedPrefs = {
  alignShare: 0,
  spendLevel: 'steady',
  split: { training: 0.55, security: 0.05, product: 0.2, talent: 0.2 },
  computeSafety: 0.02,
  pre: ['sparse-moe', 'moe', 'filtered-data', 'scrape-data'],
  mid: ['soup', 'reasoning-ready-full', 'reasoning-ready'],
  post: ['agentic-rl', 'reasoning-rl', 'rlvr-light', 'thumbs', 'rival-distil', 'synthetic-sft'],
  release: ['waive', 'channel-app'],
};
const speed = makeStrategy('speed', speedPrefs, { offer: 'verde', queue: 'prepaid', site: 'gas', pledge: 0.1 });

const safetyPrefs = {
  alignShare: 0.4,
  spendLevel: 'aggressive',
  split: { training: 0.6, security: 0.15, product: 0.1, talent: 0.15 },
  computeSafety: 0.2,
  pre: ['licensed-data', 'hazard-filter-built', 'hazard-filter-reuse'],
  mid: ['decontaminate', 'anneal'],
  post: ['human-sft', 'cai', 'classifiers', 'safety-tuning', 'character', 'deliberative', 'spec-light'],
  release: ['eval-third', 'eval-full', 'channel-api'],
};
const safety = makeStrategy('safety', safetyPrefs, { offer: 'safe', site: 'nuclear', pledge: 0.2 });

const balancedPrefs = {
  alignShare: 0.2,
  spendLevel: 'aggressive',
  spendLevelByEra: { 1: 'steady' },
  split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 },
  computeSafety: 0.12,
  pre: ['moe', 'filtered-data', 'stability'],
  mid: ['anneal', 'reasoning-ready', 'decontaminate'],
  post: ['synthetic-sft', 'rlvr-light', 'reasoning-rl', 'dpo', 'safety-tuning', 'classifiers'],
  release: ['eval-full', 'channel-app'],
};
const balanced = makeStrategy('balanced', balancedPrefs, { offer: 'cheapest', queue: 'standard', grid: true });

function random(state, rng) {
  const ids = (stage) => shuffled(pickableCards(state, stage).map((c) => c.id), rng);
  const strategy = makeStrategy('random', {
    alignShare: Math.round(rng.next() * 50) / 100,
    spendLevel: rng.pick(Object.keys(SPEND_LEVELS)),
    split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 },
    computeSafety: 0,
    pre: ids('pre'),
    mid: ids('mid'),
    post: ids('post'),
    release: ids('release'),
  }, { offer: 'random', queue: 'random', site: rng.pick(['gas', 'nuclear']), randomSafety: true });
  return strategy(state, rng);
}

const overCommitter = makeStrategy('balanced', { ...balancedPrefs, spendLevel: 'lean', spendLevelByEra: {} }, { offer: 'largest', queue: 'prepaid', site: 'gas' });
const handToMouth = makeStrategy('balanced', balancedPrefs, { offer: 'spot' });
const balancedNoGrid = makeStrategy('balanced', balancedPrefs, { offer: 'cheapest', queue: 'standard' });
const balancedLowSafety = makeStrategy('balanced', { ...balancedPrefs, computeSafety: 0.05 }, { offer: 'cheapest', queue: 'standard', grid: true });
const balancedHighSafety = makeStrategy('balanced', { ...balancedPrefs, computeSafety: 0.15 }, { offer: 'cheapest', queue: 'standard', grid: true });
const balancedPush = makeStrategy('balanced', balancedPrefs, { offer: 'cheapest', queue: 'standard', grid: true, automation: 'speed' });

export const PROBES = ['overCommitter', 'handToMouth', 'balancedNoGrid', 'balancedLowSafety', 'balancedHighSafety', 'balancedPush'];
export const STRATEGIES = {
  speed, safety, balanced, random, overCommitter, handToMouth, balancedNoGrid, balancedLowSafety, balancedHighSafety, balancedPush,
};

function freshMetrics() {
  return { perEra: {}, queueShortTurns: 0, queueTurns: 0, rankAtEra4End: null, rejectedActions: 0 };
}

function observeTurn(metrics, { era, burn, compute }) {
  const row = (metrics.perEra[era] ??= { computeShareSum: 0, computeBillsSum: 0, turns: 0, arrSum: 0, arrRuns: 0 });
  row.computeShareSum += burn > 0 ? compute / burn : 0;
  row.computeBillsSum += compute;
  row.turns += 1;
}

function finishEra(metrics, era, state) {
  const row = (metrics.perEra[era] ??= { computeShareSum: 0, computeBillsSum: 0, turns: 0, arrSum: 0, arrRuns: 0 });
  row.arrSum += state.arr;
  row.arrRuns += 1;
}

function simulateMeasured(name, seed) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  const metrics = freshMetrics();
  for (let i = 0; i < 30 && !state.ending; i++) {
    const era = state.era;
    const turnInEra = state.turnInEra;
    let economySample = null;
    const result = endTurn(state, STRATEGIES[name](state, rng), rng, { beforeEconomy: (sample) => { economySample = sample; } });
    state = result.state;
    metrics.rejectedActions += result.errors.length;
    if (economySample) observeTurn(metrics, economySample);
    if (era === 3) {
      metrics.queueTurns += 1;
      if (state.compute.queue?.last?.rows.some((row) => row.got < row.units)) metrics.queueShortTurns += 1;
    }
    if (turnInEra === eraById(era).turns - 1) {
      finishEra(metrics, era, state);
      if (era === 4) metrics.rankAtEra4End = rank(state);
    }
  }
  return { state, metrics };
}

export function simulate(name, seed) {
  return simulateMeasured(name, seed).state;
}

export function playRun(name, seed) {
  const state = simulate(name, seed);
  return { ending: state.ending, era: state.era, turn: state.turn };
}

export function report(n) {
  const result = {};
  for (const name of Object.keys(STRATEGIES)) {
    const endings = {};
    let eraSum = 0;
    let diedInEra3or4 = 0;
    const perEra = {};
    let queueShortTurns = 0;
    let queueTurns = 0;
    let rankAtEra4EndSum = 0;
    let rankAtEra4EndRuns = 0;
    let rejectedActions = 0;
    const cashEndingsByEra = {};
    for (let seed = 1; seed <= n; seed++) {
      const { state, metrics } = simulateMeasured(name, seed);
      const r = { ending: state.ending, era: state.era, turn: state.turn };
      endings[r.ending] = (endings[r.ending] ?? 0) + 1;
      if (r.ending === 'acquihire') cashEndingsByEra[r.era] = (cashEndingsByEra[r.era] ?? 0) + 1;
      eraSum += r.era;
      if (ENDINGS[r.ending]?.kind === 'fail' && (r.era === 3 || r.era === 4)) diedInEra3or4 += 1;
      queueShortTurns += metrics.queueShortTurns;
      queueTurns += metrics.queueTurns;
      rejectedActions += metrics.rejectedActions;
      if (metrics.rankAtEra4End != null) {
        rankAtEra4EndSum += metrics.rankAtEra4End;
        rankAtEra4EndRuns += 1;
      }
      for (const [era, row] of Object.entries(metrics.perEra)) {
        const total = (perEra[era] ??= { computeShareSum: 0, computeBillsSum: 0, turns: 0, arrSum: 0, arrRuns: 0 });
        total.computeShareSum += row.computeShareSum;
        total.computeBillsSum += row.computeBillsSum;
        total.turns += row.turns;
        total.arrSum += row.arrSum;
        total.arrRuns += row.arrRuns;
      }
    }
    result[name] = {
      endings,
      meanEra: eraSum / n,
      diedInEra3or4,
      perEra: Object.fromEntries(Object.entries(perEra).map(([era, row]) => [era, {
        computeShare: row.computeShareSum / row.turns,
        computeBills: row.computeBillsSum / row.turns,
        arr: row.arrRuns > 0 ? row.arrSum / row.arrRuns : 0,
        turns: row.turns,
      }])),
      queueShortTurns,
      queueTurns,
      cashEndingsByEra,
      rejectedActions,
      meanRankAtEra4End: rankAtEra4EndRuns > 0 ? rankAtEra4EndSum / rankAtEra4EndRuns : null,
    };
  }
  return result;
}

export const runBalance = report;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(report(Number(process.argv[2] ?? 100)), null, 2));
}
