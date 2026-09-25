import { createInitialState } from '../sim/state.js';
import { createRng } from '../sim/rng.js';
import { endTurn } from '../sim/turn.js';
import { cardById, cardUnlocked, slotsFor, pickableCards, validateRecipe, recipeCost } from '../sim/recipe.js';
import { availableUnits } from '../sim/training.js';
import { inDangerZone } from '../sim/economy.js';

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

function makeStrategy(prefs) {
  return (state) => {
    const moves = [];
    if (state.pendingModel) {
      moves.push({
        type: 'release',
        release: { picks: pickFrom(state, 'release', prefs.release), price: 'market', reasoning: 'medium', family: 'Bot', generation: state.models.length + 1 },
      });
    } else if (!state.activeRun) {
      const recipe = bestRecipe(state, prefs);
      if (recipe) moves.push({ type: 'startRun', recipe });
    }
    if (inDangerZone(state) && state.flags.lastRoundEra !== state.era) moves.push({ type: 'raise', archetype: 'vc' });
    else if (availableUnits(state) < 5) moves.push({ type: 'deal', supplierId: 'coreflame' });
    return { budget: { spend: prefs.spend, split: prefs.split }, moves: moves.slice(0, 2) };
  };
}

const speed = makeStrategy({
  alignShare: 0,
  spend: 30,
  split: { training: 0.5, safety: 0.05, security: 0.05, product: 0.2, talent: 0.2 },
  pre: ['sparse-moe', 'moe', 'filtered-data', 'scrape-data'],
  mid: ['soup', 'reasoning-ready-full', 'reasoning-ready'],
  post: ['agentic-rl', 'reasoning-rl', 'rlvr-light', 'thumbs', 'rival-distil', 'synthetic-sft'],
  release: ['waive', 'channel-app'],
});

const safety = makeStrategy({
  alignShare: 0.4,
  spend: 25,
  split: { training: 0.2, safety: 0.4, security: 0.15, product: 0.1, talent: 0.15 },
  pre: ['licensed-data', 'hazard-filter-built', 'hazard-filter-reuse'],
  mid: ['decontaminate', 'anneal'],
  post: ['human-sft', 'cai', 'classifiers', 'safety-tuning', 'character', 'deliberative', 'spec-light'],
  release: ['eval-third', 'eval-full', 'channel-api'],
});

const balanced = makeStrategy({
  alignShare: 0.2,
  spend: 25,
  split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 },
  pre: ['moe', 'filtered-data', 'stability'],
  mid: ['anneal', 'reasoning-ready', 'decontaminate'],
  post: ['synthetic-sft', 'rlvr-light', 'reasoning-rl', 'dpo', 'safety-tuning', 'classifiers'],
  release: ['eval-full', 'channel-app'],
});

function random(state, rng) {
  const ids = (stage) => pickableCards(state, stage).map((c) => c.id).sort(() => rng.next() - 0.5);
  const strategy = makeStrategy({
    alignShare: Math.round(rng.next() * 50) / 100,
    spend: 15 + rng.int(0, 25),
    split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 },
    pre: ids('pre'),
    mid: ids('mid'),
    post: ids('post'),
    release: ids('release'),
  });
  return strategy(state);
}

export const STRATEGIES = { speed, safety, balanced, random };

export function playRun(name, seed) {
  const rng = createRng(seed);
  let state = createInitialState({ seed });
  for (let i = 0; i < 30 && !state.ending; i++) ({ state } = endTurn(state, STRATEGIES[name](state, rng), rng));
  return { ending: state.ending, era: state.era, turn: state.turn };
}

export function runBalance(n) {
  const report = {};
  for (const name of Object.keys(STRATEGIES)) {
    const endings = {};
    let eraSum = 0;
    for (let seed = 1; seed <= n; seed++) {
      const r = playRun(name, seed);
      endings[r.ending] = (endings[r.ending] ?? 0) + 1;
      eraSum += r.era;
    }
    report[name] = { endings, meanEra: eraSum / n };
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runBalance(Number(process.argv[2] ?? 100)), null, 2));
}
