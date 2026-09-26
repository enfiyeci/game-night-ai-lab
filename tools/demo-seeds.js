import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { ENDINGS } from '../sim/endings.js';
import { SUPPLIERS } from '../sim/compute.js';
import { INVESTORS } from '../sim/economy.js';
import { cardById } from '../sim/recipe.js';
import { RIVAL_TEMPLATES } from '../sim/rivals.js';
import { STRATEGIES } from './balance.js';

const MAX_TURNS = 30;
const DRAMATIC_FAILURES = new Set(['misalignment', 'quietTakeover', 'rivalDisaster']);

function leaderId(playerCapability, rivalCapabilities) {
  let leader = 'player';
  let capability = playerCapability;
  for (const [id, rivalCapability] of rivalCapabilities) {
    if (rivalCapability > capability) {
      leader = id;
      capability = rivalCapability;
    }
  }
  return leader;
}

function storyEvents(prev, state, events) {
  const copies = structuredClone(events);
  const rivals = new Map(prev.rivals.map((rival) => [rival.id, rival.capability]));
  let playerCapability = prev.capability;

  for (const event of copies) {
    if (event.type === 'release') playerCapability = Math.max(playerCapability, event.model.capability);
    if (event.type === 'rivalRelease') {
      const before = leaderId(playerCapability, rivals);
      rivals.set(event.id, (rivals.get(event.id) ?? 0) + event.gain);
      event.leaderChanged = leaderId(playerCapability, rivals) !== before;
    }
    if (event.type === 'runComplete' && state.pendingModel?.hazard) {
      event.hazard = structuredClone(state.pendingModel.hazard);
    }
  }
  return copies;
}

export function playTimeline(strategy, seed) {
  if (!Object.hasOwn(STRATEGIES, strategy)) throw new Error(`unknown strategy ${strategy}`);

  const rng = createRng(seed);
  let state = createInitialState({ seed });
  const turns = [];
  for (let index = 0; index < MAX_TURNS && !state.ending; index++) {
    const prev = state;
    const actions = STRATEGIES[strategy](state, rng);
    const result = endTurn(state, actions, rng);
    turns.push({
      turn: prev.turn + 1,
      era: prev.era,
      actions: structuredClone(actions),
      events: storyEvents(prev, result.state, result.events),
    });
    state = result.state;
  }
  return { seed, strategy, ending: state.ending, turns };
}

const eventId = (event) => event.id ?? event.cardId ?? event.warningId;

function safetyTestLied(turn) {
  if (turn.era < 3) return false;
  return (turn.events ?? []).some((event) => {
    if (event.type !== 'release') return false;
    const benchmarks = event.model?.launch?.benchmarks ?? [];
    return benchmarks.some((benchmark) =>
      (benchmark.kind === 'safety' || benchmark.id === 'gauntlet' || benchmark.id === 'safety')
      && benchmark.shown - benchmark.truth >= 5,
    );
  });
}

function hasTrainingHazard(events) {
  return events.some((event) =>
    event.type === 'trainingHazard'
    || event.type === 'hazardResolved'
    || event.hazard != null
    || event.model?.hazard != null,
  );
}

function warningBecameCard(events) {
  const warnings = new Set();
  for (const event of events) {
    const id = eventId(event);
    if (event.type === 'warning' && id != null) warnings.add(id);
    if (event.type === 'eventCard' && id != null && warnings.has(id)) return id;
  }
  return null;
}

export function scoreStory(timeline) {
  const turns = timeline.turns ?? [];
  const events = turns.flatMap((turn) => turn.events ?? []);
  const reachedEra = Math.max(
    1,
    ...turns.map((turn) => turn.era ?? 1),
    ...events.filter((event) => event.type === 'eraStart').map((event) => event.era ?? 1),
  );
  const beats = [];
  let score = 0;

  const eraBeats = [
    [3, 'reached the age of reasoning and agents'],
    [4, 'made it to the gigawatt race'],
    [5, 'entered the self-improvement era'],
  ];
  for (const [era, beat] of eraBeats) {
    if (reachedEra >= era) {
      score += 2;
      beats.push(beat);
    }
  }

  if (turns.some(safetyTestLied)) {
    score += 3;
    beats.push('a safety test looked better than the truth');
  }
  if (hasTrainingHazard(events)) {
    score += 2;
    beats.push('a training hazard surfaced');
  }

  const cardId = warningBecameCard(events);
  if (cardId != null) {
    score += 3;
    beats.push(`the warning about ${cardId} became a card`);
  }
  if (events.some((event) => event.type === 'internalIncident')) {
    score += 2;
    beats.push('the internal deployment caused an incident');
  }
  if (events.filter((event) => event.type === 'rivalRelease' && event.leaderChanged).length >= 2) {
    score += 1;
    beats.push('rival releases changed the lead twice');
  }

  const ending = ENDINGS[timeline.ending];
  if (ending?.kind === 'win') {
    score += 2;
    beats.push(`finished with ${ending.title.toLowerCase()}`);
  } else if (DRAMATIC_FAILURES.has(timeline.ending)) {
    score += 2;
    beats.push(`ended in ${ending?.title.toLowerCase() ?? timeline.ending}`);
  }
  if (turns.length < 12) {
    score -= 4;
    beats.push('ended before the story had twelve turns to breathe');
  }

  return { score, beats };
}

export function findDemoSeeds(n, { strategy = 'balanced', top = 10 } = {}) {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  const limit = Math.max(0, Math.floor(Number(top) || 0));
  const candidates = [];
  for (let seed = 1; seed <= count; seed++) {
    const timeline = playTimeline(strategy, seed);
    const story = scoreStory(timeline);
    candidates.push({
      seed,
      score: story.score,
      beats: story.beats,
      ending: timeline.ending,
      turns: timeline.turns,
    });
  }
  return candidates
    .sort((a, b) => b.score - a.score || a.seed - b.seed)
    .slice(0, limit);
}

function words(value) {
  return String(value).replace(/([a-z\d])([A-Z])/g, '$1 $2').replaceAll('-', ' ').replaceAll('_', ' ');
}

const cardName = (id) => cardById(id)?.name ?? words(id);
const supplierName = (id) => SUPPLIERS.find((supplier) => supplier.id === id)?.name.split(' (')[0] ?? words(id);
const rivalName = (id) => RIVAL_TEMPLATES.find((rival) => rival.id === id)?.name ?? words(id);

function describeMove(move) {
  if (move.type === 'startRun') {
    const cards = Object.values(move.recipe.picks).flat().map(cardName);
    const recipe = cards.length ? ` using ${cards.join(', ')}` : '';
    const alignment = Math.round(move.recipe.sliders.alignShare * 100);
    return `start a ${move.recipe.sliders.size}, ${move.recipe.sliders.length}-length training run with ${alignment}% alignment${recipe}`;
  }
  if (move.type === 'release') {
    const release = move.release;
    const cards = release.picks.map(cardName);
    const choices = cards.length ? ` after ${cards.join(' and ')}` : '';
    return `release ${release.family} ${release.generation} at ${release.price} price with ${release.reasoning} reasoning${choices}`;
  }
  if (move.type === 'deal') return `sign the ${supplierName(move.supplierId)} compute deal`;
  if (move.type === 'raise') return `raise from the ${INVESTORS[move.archetype]?.name ?? words(move.archetype)}`;
  if (move.type === 'research') return `research ${words(move.techId)}`;
  if (move.type === 'emergency') return `use the ${words(move.option)} emergency option`;
  if (move.type === 'deployInternal') return `deploy the model internally with ${Math.round(move.control * 100)}% control`;
  if (move.type === 'stopInternal') return 'stop the internal deployment';
  return words(move.type);
}

const ACTION_KEYS = new Set([
  'budget',
  'moves',
  'hazardChoice',
  'addressWarnings',
  'eventChoices',
  'constitution',
  'presidentAnswers',
  'holdOrShip',
]);

function fallbackValue(value) {
  const json = JSON.stringify(value);
  return json === undefined ? String(value) : json;
}

export function describeActions(actions) {
  const descriptions = [];
  if (actions.budget) {
    const shares = Object.entries(actions.budget.split)
      .map(([name, share]) => `${name} ${Math.round(share * 100)}%`)
      .join(', ');
    descriptions.push(`set the monthly budget to $${actions.budget.spend}M (${shares})`);
  }
  if (Object.hasOwn(actions, 'hazardChoice')) {
    descriptions.push(actions.hazardChoice
      ? `${words(actions.hazardChoice)} the training hazard`
      : 'make no training-hazard choice');
  }
  if (Object.hasOwn(actions, 'addressWarnings')) {
    const warnings = actions.addressWarnings ?? [];
    descriptions.push(...(warnings.length
      ? warnings.map((id) => `address the ${words(id)} warning`)
      : ['address no warnings']));
  }
  if (Object.hasOwn(actions, 'eventChoices')) {
    const choices = Object.entries(actions.eventChoices ?? {});
    descriptions.push(...(choices.length
      ? choices.map(([id, choice]) => `choose ${words(choice)} for ${words(id)}`)
      : ['make no event-card choices']));
  }
  if (Object.hasOwn(actions, 'constitution')) {
    const constitution = actions.constitution;
    if (constitution) {
      const hardLines = constitution.hardLines ?? [];
      descriptions.push(hardLines.length
        ? `adopt a constitution with hard lines ${hardLines.map(words).join(', ')}`
        : 'adopt a constitution with no hard lines');
      for (const [id, ruling] of Object.entries(constitution.rulings ?? {})) {
        descriptions.push(`rule ${words(ruling)} for ${words(id)}`);
      }
    } else descriptions.push('leave the constitution unchanged');
  }
  if (Object.hasOwn(actions, 'presidentAnswers')) {
    const answers = actions.presidentAnswers ?? [];
    descriptions.push(answers.length
      ? `answer the president: ${answers.map(words).join(', then ')}`
      : 'give the president no answers');
  }
  if (Object.hasOwn(actions, 'holdOrShip')) {
    if (actions.holdOrShip === 'hold') descriptions.push('hold to the pacing deal');
    else if (actions.holdOrShip === 'ship') descriptions.push('ship despite the pacing deal');
    else descriptions.push(`set the pacing choice to ${words(actions.holdOrShip)}`);
  }

  const moves = actions.moves ?? [];
  descriptions.push(...(moves.length ? moves.map(describeMove) : ['make no regular move']));
  for (const [key, value] of Object.entries(actions)) {
    if (!ACTION_KEYS.has(key)) descriptions.push(`${words(key).toLowerCase()}: ${fallbackValue(value)}`);
  }
  return descriptions.join('; ');
}

function describeEvent(event) {
  if (event.type === 'release') return `${event.model.name} launched`;
  if (event.type === 'runComplete') return event.hazard ? 'training finished with a hazard' : 'training finished';
  if (event.type === 'rivalRelease') return `${rivalName(event.id)} released${event.leaderChanged ? ' and took the lead' : ''}`;
  if (event.type === 'eraStart') return `era ${event.era} began`;
  if (event.type === 'internalWarning') return 'the internal deployment issued a warning';
  if (event.type === 'internalIncident') return `the internal deployment reached incident stage ${event.stage}`;
  if (event.type === 'hazardResolved') {
    const outcomes = { ignore: 'ignored', penalize: 'penalized', fix: 'fixed' };
    return `the training hazard was ${outcomes[event.choice] ?? words(event.choice)}`;
  }
  if (event.type === 'computeFailed') return `${supplierName(event.supplier)} compute failed`;
  if (event.type === 'lawsuitPaid') return 'a training-data lawsuit came due';
  if (event.type === 'conversionFight') return 'the corporate conversion fight arrived';
  if (event.type === 'ending') return `the run ended: ${ENDINGS[event.ending]?.title ?? words(event.ending)}`;
  return null;
}

function printReport(n, strategy = 'balanced') {
  const found = findDemoSeeds(n, { strategy });
  console.log(`Top demo seeds (${strategy}, ${n} scanned)`);
  for (const [index, result] of found.entries()) {
    console.log(`${index + 1}. seed ${result.seed} — score ${result.score} — ${result.ending} — ${result.beats.join('; ')}`);
  }
  if (found.length === 0) return;

  const best = found[0];
  console.log(`\nRecording script for seed ${best.seed}`);
  for (const turn of best.turns) {
    const notable = turn.events.map(describeEvent).filter(Boolean);
    console.log(`Turn ${turn.turn}, era ${turn.era}`);
    console.log(`  moves: ${describeActions(turn.actions)}`);
    console.log(`  events: ${notable.length ? notable.join('; ') : 'nothing notable'}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  printReport(Math.max(0, Math.floor(Number(process.argv[2] ?? 300) || 0)));
}
