import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { cardById, cardUnlocked, slotsFor, pickableCards, validateRecipe, recipeCost } from '../sim/recipe.js';
import { availableUnits } from '../sim/training.js';
import { inDangerZone } from '../sim/economy.js';
import { HARD_LINES, CASES } from '../sim/data/constitution.js';
import { MEETINGS } from '../sim/data/president.js';
import { COMMITMENTS } from '../sim/summit.js';
import { controlUnits, deployInternal } from '../sim/internal.js';
import { resolveHazard } from '../sim/hazards.js';
import { addressWarning, resolveEvent } from '../sim/events.js';
import { runMeeting } from '../sim/president.js';
import { activateReleases, releaseModel } from '../sim/release.js';
import { updateServing } from '../sim/economy.js';
import { ENDINGS } from '../sim/endings.js';

const HAZARD_CHOICES = ['penalize', 'fix', 'ignore'];
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

function internalControl(state, style, rng) {
  if (style === 'safety' || state.era < 3 || state.internal || (state.models.length === 0 && !state.pendingModel)) return null;
  if (style === 'random') {
    if (!rng.chance(0.5)) return null;
    return rng.pick([0, 0.3, 0.6, 1]);
  }
  return style === 'speed' ? 0 : 0.6;
}

function canDeployInternal(state, control) {
  if (control == null || controlUnits({ internal: { control } }) > availableUnits(state)) return false;
  return deployInternal(structuredClone(state), control).ok;
}

function summitMove(state, style, rng) {
  if (state.era !== 5 || state.turnInEra !== 0 || state.deal || style === 'speed') return null;
  if (style === 'safety') return { type: 'summit', proposals: ['evaluators', 'sharedSafety', 'verification'] };
  if (style === 'balanced') return { type: 'summit', proposals: ['evaluators', 'sharedSafety'] };
  return { type: 'summit', proposals: shuffled(Object.keys(COMMITMENTS), rng).slice(0, rng.int(1, 3)) };
}

function plannedState(state, actions) {
  const planned = structuredClone(state);
  planned.budget = structuredClone(actions.budget);
  if (planned.meeting && actions.moves.some((move) => move.type === 'meeting') && actions.presidentAnswers) {
    runMeeting(planned, actions.presidentAnswers);
  }
  if (planned.pendingModel?.hazard && actions.hazardChoice) resolveHazard(planned, actions.hazardChoice);
  for (const id of actions.addressWarnings ?? []) addressWarning(planned, id);
  for (const [id, choiceId] of Object.entries(actions.eventChoices)) resolveEvent(planned, id, choiceId);
  activateReleases(planned);
  updateServing(planned);
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

function makeStrategy(style, prefs) {
  return (state, rng) => {
    const actions = {
      budget: { spend: prefs.spend, split: prefs.split },
      moves: [],
      eventChoices: eventChoices(state, style, rng),
    };
    if (state.turn === 0) actions.constitution = constitutionFor(style, rng);
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
    if (state.meeting) {
      actions.moves.push({ type: 'meeting' });
      actions.presidentAnswers = presidentAnswers(state, style, rng);
    }
    if (state.era === 5 && state.deal && state.turnInEra > 0) actions.holdOrShip = style === 'speed' ? 'ship' : 'hold';

    const planned = plannedState(state, actions);
    const summit = summitMove(planned, style, rng);
    if (summit) actions.moves.push(summit);
    if (planned.pendingModel && actions.moves.length < 2) {
      const move = {
        type: 'release',
        release: { picks: pickFrom(planned, 'release', prefs.release), price: 'market', reasoning: 'medium', family: 'Bot', generation: planned.models.length + 1 },
      };
      if (releaseModel(structuredClone(planned), move.release, VALIDATION_RNG).ok) actions.moves.push(move);
    } else if (!planned.activeRun && actions.moves.length < 2) {
      const recipe = bestRecipe(planned, prefs);
      if (recipe) actions.moves.push({ type: 'startRun', recipe });
    }
    const control = internalControl(planned, style, rng);
    if (actions.moves.length === 0 && canDeployInternal(planned, control)) actions.moves.push({ type: 'deployInternal', control });
    if (actions.moves.length < 2 && planned.era >= 2 && inDangerZone(planned) && planned.flags.lastRoundEra !== planned.era) {
      actions.moves.push({ type: 'raise', archetype: 'vc' });
    } else if (actions.moves.length < 2 && planned.cash >= 0 && availableUnits(planned) < 5) {
      actions.moves.push({ type: 'deal', supplierId: 'coreflame' });
    }
    return actions;
  };
}

const speed = makeStrategy('speed', {
  alignShare: 0,
  spend: 30,
  split: { training: 0.5, safety: 0.05, security: 0.05, product: 0.2, talent: 0.2 },
  pre: ['sparse-moe', 'moe', 'filtered-data', 'scrape-data'],
  mid: ['soup', 'reasoning-ready-full', 'reasoning-ready'],
  post: ['agentic-rl', 'reasoning-rl', 'rlvr-light', 'thumbs', 'rival-distil', 'synthetic-sft'],
  release: ['waive', 'channel-app'],
});

const safety = makeStrategy('safety', {
  alignShare: 0.4,
  spend: 25,
  split: { training: 0.2, safety: 0.4, security: 0.15, product: 0.1, talent: 0.15 },
  pre: ['licensed-data', 'hazard-filter-built', 'hazard-filter-reuse'],
  mid: ['decontaminate', 'anneal'],
  post: ['human-sft', 'cai', 'classifiers', 'safety-tuning', 'character', 'deliberative', 'spec-light'],
  release: ['eval-third', 'eval-full', 'channel-api'],
});

const balanced = makeStrategy('balanced', {
  alignShare: 0.2,
  spend: 25,
  split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 },
  pre: ['moe', 'filtered-data', 'stability'],
  mid: ['anneal', 'reasoning-ready', 'decontaminate'],
  post: ['synthetic-sft', 'rlvr-light', 'reasoning-rl', 'dpo', 'safety-tuning', 'classifiers'],
  release: ['eval-full', 'channel-app'],
});

function random(state, rng) {
  const ids = (stage) => shuffled(pickableCards(state, stage).map((c) => c.id), rng);
  const strategy = makeStrategy('random', {
    alignShare: Math.round(rng.next() * 50) / 100,
    spend: 15 + rng.int(0, 25),
    split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 },
    pre: ids('pre'),
    mid: ids('mid'),
    post: ids('post'),
    release: ids('release'),
  });
  return strategy(state, rng);
}

export const STRATEGIES = { speed, safety, balanced, random };

export function simulate(name, seed) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  for (let i = 0; i < 30 && !state.ending; i++) ({ state } = endTurn(state, STRATEGIES[name](state, rng), rng));
  return state;
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
    for (let seed = 1; seed <= n; seed++) {
      const r = playRun(name, seed);
      endings[r.ending] = (endings[r.ending] ?? 0) + 1;
      eraSum += r.era;
      if (ENDINGS[r.ending]?.kind === 'fail' && (r.era === 3 || r.era === 4)) diedInEra3or4 += 1;
    }
    result[name] = { endings, meanEra: eraSum / n, diedInEra3or4 };
  }
  return result;
}

export const runBalance = report;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(report(Number(process.argv[2] ?? 100)), null, 2));
}
