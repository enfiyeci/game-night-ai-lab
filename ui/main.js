import { ENDINGS } from '../sim/endings.js';
import { createGame } from './game.js';
import { mountHud } from './hud.js';
import { mountOffice } from './office.js';
import { SCENARIOS } from './logic/scenarios.js';

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

const stage = document.querySelector('#stage');
const office = document.querySelector('#office');
const fx = document.querySelector('#fx');
const hud = document.querySelector('#hud');

mountHud(hud, game);
await mountOffice(office, fx, game).catch((error) => console.error(error));

if (game.state.ending && ENDINGS[game.state.ending]) {
  stage.setAttribute('aria-label', ENDINGS[game.state.ending].title);
}

globalThis.game = game;
