import { ENDINGS } from '../sim/endings.js';
import { createGame } from './game.js';
import { mountHud } from './hud.js';
import { mountOffice } from './office.js';
import { SCENARIOS } from './logic/scenarios.js';
import { dealCards, powerSitesAvailable, queueScreenAvailable } from './logic/compute.js';
import { openMenu } from './menu.js';
import { openBudget } from './screens/budget.js';
import { mountRecipe, openRecipe } from './screens/recipe.js';
import {
  mountCompany,
  mountTurnSummary,
  openDeals,
  openEmergency,
  openRaise,
  openResearch,
} from './screens/company.js';
import { openQueue } from './screens/compute.js';
import { openPowerSites } from './screens/sites.js';
import { mountHistory, openArticle, openHistory } from './screens/history.js';
import { mountTraining } from './screens/training.js';
import { mountHazard } from './screens/hazard.js';

const params = new URLSearchParams(location.search);

function seedForRun() {
  const requested = params.has('seed') ? Number(params.get('seed')) : NaN;
  if (Number.isInteger(requested)) return requested;
  try {
    const key = 'ai-lab-run-counter';
    const next = Number.parseInt(localStorage.getItem(key) ?? '0', 10) + 1;
    localStorage.setItem(key, `${next}`);
    return next;
  } catch {
    return 1;
  }
}

function fitToWindow() {
  const zoom = Math.min(innerWidth / 1440, innerHeight / 900, 1);
  if (zoom > 0) document.documentElement.style.zoom = `${zoom}`; // a hidden frame reports 0 x 0; wait for a real size
}

fitToWindow();
addEventListener('resize', fitToWindow);

const seed = seedForRun();
const scenarioName = params.get('scenario') ?? 'start';
const buildScenario = SCENARIOS[scenarioName] ?? SCENARIOS.start;
const game = createGame({ seed, state: buildScenario(seed) });
if (params.has('lab')) game.state.labName = params.get('lab');

const stage = document.querySelector('#stage');
const office = document.querySelector('#office');
const fx = document.querySelector('#fx');
const hud = document.querySelector('#hud');
const overlay = document.querySelector('#overlay');

mountHud(hud, game);
await mountOffice(office, fx, game).catch((error) => console.error(error));
mountCompany(game, overlay);
mountRecipe(game, overlay);
mountHistory(game, overlay);
mountTurnSummary(overlay, game);
const training = mountTraining(game, { stage, hud, overlay });
mountHazard(game, { stage, overlay });

function stagePoint(event) {
  const rect = stage.getBoundingClientRect();
  return [
    ((event.clientX - rect.left) / rect.width) * 1440,
    ((event.clientY - rect.top) / rect.height) * 900,
  ];
}

office.addEventListener('click', (event) => {
  if (event.target.closest?.('#person-ceo') && !overlay.querySelector('.dialog-layer')) {
    openArticle(game, overlay);
    return;
  }
  if (!event.target.closest?.('#floor') || overlay.querySelector('.dialog-layer')) return;
  openMenu(game, stagePoint(event), { overlay });
});

office.addEventListener('keydown', (event) => {
  if ((event.key !== 'Enter' && event.key !== ' ') || !event.target.closest?.('#person-ceo')) return;
  event.preventDefault();
  if (!overlay.querySelector('.dialog-layer')) openArticle(game, overlay);
});

async function openDebugRoute() {
  const recipeStage = location.hash.match(/^#recipe([123])$/)?.[1];
  if (recipeStage) {
    openRecipe(game, overlay, { stage: Number(recipeStage) });
    return;
  }
  if (location.hash === '#budget') {
    openBudget(game, overlay);
    return;
  }
  if (location.hash === '#deals') {
    openDeals(game, overlay);
    return;
  }
  if (location.hash === '#queue') {
    if (queueScreenAvailable(game.state)) openQueue(game, overlay);
    return;
  }
  if (location.hash === '#power') {
    if (powerSitesAvailable(game.state)) openPowerSites(game, overlay);
    return;
  }
  if (location.hash === '#raise') {
    openRaise(game, overlay);
    return;
  }
  if (location.hash === '#research') {
    openResearch(game, overlay);
    return;
  }
  if (location.hash === '#emergency') {
    openEmergency(game, overlay);
    return;
  }
  if (location.hash === '#summary') {
    const card = dealCards(game.state).find((offer) => !offer.disabled);
    if (card) game.addMove(card.move);
    game.endTurn();
    return;
  }
  if (location.hash === '#history') {
    openHistory(game, overlay);
    return;
  }
  if (location.hash === '#race') {
    openHistory(game, overlay, { view: 'race' });
    return;
  }
  if (location.hash === '#article') {
    openArticle(game, overlay);
    return;
  }
  if (location.hash === '#training') {
    training.replay();
    return;
  }
  if (location.hash !== '#menu' && location.hash !== '#company') return;
  const response = await fetch(`ui/assets/anchors-era${game.state.era}.json`);
  if (!response.ok) throw new Error(`could not load anchors for era ${game.state.era}`);
  const anchors = await response.json();
  openMenu(game, anchors.floorMenu, { overlay, companyOpen: location.hash === '#company' });
}

await openDebugRoute().catch((error) => console.error(error));
addEventListener('hashchange', () => openDebugRoute().catch((error) => console.error(error)));

if (game.state.ending && ENDINGS[game.state.ending]) {
  stage.setAttribute('aria-label', ENDINGS[game.state.ending].title);
}

globalThis.game = game;
