import { ENDINGS } from '../sim/endings.js';
import { createClock } from './clock.js';
import { createGame } from './game.js';
import { mountHud } from './hud.js';
import { mountOffice } from './office.js';
import { SCENARIOS, scenarioHistory } from './logic/scenarios.js';
import { powerSitesAvailable, queueScreenAvailable } from './logic/compute.js';
import { meetingFor } from './logic/president.js';
import { openMenu } from './menu.js';
import { openBudget } from './screens/budget.js';
import { mountRecipe, openRecipe } from './screens/recipe.js';
import { mountRelease, openRelease } from './screens/release.js';
import { mountReveal, showReveal } from './screens/reveal.js';
import { mountSound, openSound } from './screens/sound.js';
import { music } from './music.js';
import { releaseDraft, releasePayload } from './logic/release.js';
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
import { mountPresident, openPresident } from './screens/president.js';
import { mountEvents } from './screens/events.js';
import { mountBriefing } from './screens/briefing.js';
import { mountFeed } from './screens/feed.js';
import { mountEnding } from './screens/end.js';
import { mountFinance, openFinance } from './screens/finance.js';
import { createCollection } from './logic/collection.js';
import { lumenEpilogue } from '../sim/lumen.js';
import { mountBoard, openBoard } from './screens/board.js';
import { mountTraining } from './screens/training.js';
import { mountHazard } from './screens/hazard.js';
import { mountAutomation, openAutomation } from './screens/automation.js';
import { mountScreenWall } from './screens/screenwall.js';
import { mountRacks } from './screens/racks.js';
import { mountTitle } from './screens/title.js';
import { cleanLabName, titleShows } from './logic/title.js';
import { mountIntro, mountNaming } from './screens/intro.js';
import { isFreshStart, tourSeen } from './logic/intro.js';

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
const initialState = buildScenario(seed);
const game = createGame({ seed, state: initialState, history: scenarioHistory(initialState) });
if (cleanLabName(params.get('lab'))) game.state.labName = cleanLabName(params.get('lab')); // same cap as the title screen
if (location.hash === '#board-warning') delete game.state.flags.boardQuiet; // debug still: the warning without going quiet

const stage = document.querySelector('#stage');
const office = document.querySelector('#office');
const fx = document.querySelector('#fx');
const hud = document.querySelector('#hud');
const overlay = document.querySelector('#overlay');

mountHud(hud, game);
game.clock = createClock(game);
await mountOffice(office, fx, game).catch((error) => console.error(error));
game.clock.watch(overlay);
if (params.has('paused')) game.clock.setSpeed(0);
// The title screen shows on a plain visit; debug links (?scenario=, a #route, ?notitle) go straight into the game.
const showTitle = titleShows({ search: location.search, hash: location.hash, ending: game.state.ending });
if (showTitle) game.clock.pause('title');
game.clock.start();
const collection = createCollection(browserStorage());
if (showTitle) {
  mountTitle(game, {
    stage,
    overlay,
    collection,
    music,
    openSound,
    onStart: () => {
      game.clock.resume('title');
      document.dispatchEvent(new CustomEvent('ai-lab:start')); // the guided intro starts here
    },
  });
}
mountCompany(game, overlay);
mountRecipe(game, overlay);
mountNaming(game, overlay); // after the recipe: the first run asks for the model's name
mountRelease(game, overlay);
mountReveal(game, overlay, {
  show(root, reveal) {
    music.duck(true);
    return showReveal(root, { ...reveal, onClose: () => music.duck(false) });
  },
});
mountSound(game, overlay);
mountPresident(game, overlay);
mountHistory(game, overlay);
mountAutomation(game, overlay);
mountTurnSummary(overlay, game);
mountScreenWall(game, overlay);
mountRacks(game, overlay).catch((error) => console.error(error));
mountFinance(game, overlay);
const training = mountTraining(game, { stage, hud, overlay });
mountHazard(game, { stage, overlay });
const events = mountEvents(game, { stage, overlay });
mountBriefing(game, { office, overlay });
mountFeed(game, { overlay, events });

function browserStorage() {
  try {
    return localStorage;
  } catch {
    const values = new Map();
    return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  }
}

// Play again starts a fresh run: drop the debug seed and scenario so the run counter picks the next seed.
const ending = mountEnding(game, overlay, {
  collection,
  onPlayAgain: () => location.assign(location.pathname),
  lumenNote: (state) => lumenEpilogue(state),
});
const board = mountBoard(game, { overlay, stage });

// The first-minute tour (owner pick B): on a fresh run it starts once nothing else holds the stage. #tour replays it.
const intro = mountIntro(game, { stage, overlay, storage: browserStorage() });
if (isFreshStart(game.state, { scenario: scenarioName, hash: location.hash }) && !tourSeen(browserStorage())) intro.start();
addEventListener('hashchange', () => { if (location.hash === '#tour' && !game.state.ending) intro.start(); });
if (location.hash === '#tour' && !game.state.ending) intro.start();

function stagePoint(event) {
  const rect = stage.getBoundingClientRect();
  return [
    ((event.clientX - rect.left) / rect.width) * 1440,
    ((event.clientY - rect.top) / rect.height) * 900,
  ];
}

const blocked = () => Boolean(overlay.querySelector('.dialog-layer, .event-layer, .ev-phone, .screenwall-layer, .intro-layer:not(.intro-open)'));

office.addEventListener('click', (event) => {
  if (event.target.closest?.('#person-ceo') && !blocked()) {
    openArticle(game, overlay);
    return;
  }
  if (!event.target.closest?.('#floor') || blocked()) return;
  openMenu(game, stagePoint(event), { overlay });
});

// Space pauses and resumes, 1 / 2 / 4 set the speed, while nothing else has the keyboard (no dialog, menu or card).
document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || blocked() || overlay.querySelector('.menu-layer')) return;
  if (event.target.closest?.('input, textarea, select, button, [role="button"], [contenteditable="true"]')) return;
  if (event.key === ' ') {
    event.preventDefault();
    game.clock.togglePause();
  } else if (['1', '2', '4'].includes(event.key)) game.clock.setSpeed(Number(event.key));
});

office.addEventListener('keydown', (event) => {
  if ((event.key !== 'Enter' && event.key !== ' ') || !event.target.closest?.('#person-ceo')) return;
  event.preventDefault();
  if (!blocked()) openArticle(game, overlay);
});

async function openDebugRoute() {
  if (game.state.ending) return; // a finished run shows only its end screen
  const previewId = location.hash.match(/^#event-(\w+)$/)?.[1];
  if (previewId) {
    await events.preview(previewId);
    return;
  }
  const recipeStage = location.hash.match(/^#recipe([123])$/)?.[1];
  if (recipeStage) {
    openRecipe(game, overlay, { stage: Number(recipeStage) });
    return;
  }
  if (location.hash === '#release' || location.hash === '#sizes') {
    if (game.state.pendingModel) openRelease(game, overlay, { stage: location.hash === '#sizes' ? 'sizes' : 'main' });
    return;
  }
  if (location.hash === '#reveal') {
    if (!game.state.pendingModel) return;
    const draft = { ...releaseDraft(game.state), family: 'Kestrel', picks: ['eval-full'], reasoning: 'medium' };
    game.addMove({ type: 'release', release: releasePayload(game.state, draft) }); // applies at once
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
  if (location.hash === '#finance' || location.hash === '#books') {
    openFinance(game, overlay, { view: location.hash === '#books' ? 'books' : 'timeline' });
    return;
  }
  if (location.hash === '#board' || location.hash === '#board-moves') {
    openBoard(game, overlay, { view: location.hash === '#board-moves' ? 'moves' : 'board' });
    return;
  }
  if (location.hash === '#board-say' || location.hash === '#board-warning') {
    // Stills of the board's bubbles: waiting cards are put aside, as "Decide later" does.
    await new Promise((resolve) => { setTimeout(resolve, 600); });
    for (let i = 0; i < 5 && overlay.querySelector('.ev-later'); i++) overlay.querySelector('.ev-later').click();
    board.refresh();
    return;
  }
  if (location.hash === '#president' || location.hash === '#president-q2') {
    const meeting = meetingFor(game.state);
    if (!meeting) return;
    const picked = location.hash === '#president-q2'
      ? [meeting.exchanges[0].answers.find((answer) => answer.style === 'jargon')?.id].filter(Boolean)
      : [];
    await openPresident(game, overlay, { picked });
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
  if (location.hash === '#automation') {
    openAutomation(game, overlay);
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
  ending.show({ save: false }); // already over when the page loaded: no click to start the film's sound, and not a run the player reached
}
game.subscribe(({ state }) => {
  if (state.ending && ENDINGS[state.ending]) stage.setAttribute('aria-label', ENDINGS[state.ending].title);
});

globalThis.game = game;

// The Geneva summit and the deal in play (plan 2026-09-26-summit-build).
const { mountSummit, openSummit } = await import('./screens/summit.js');
const { mountDeal } = await import('./screens/deal.js');
mountSummit(game, overlay);
mountDeal(game, overlay);
const summitRoute = () => { if (location.hash === '#summit') openSummit(game, overlay); };
summitRoute();
addEventListener('hashchange', summitRoute);

// The board meeting (board UI plan Task 6): opens on the last story day before a vote mark and holds the clock; the
// ending waits for it. Preview routes: #meeting (the ring; Call the vote plays a vote held on a copy), #meeting-room, #meeting-vote,
// #meeting-vote-last, #meeting-result, #meeting-result-loss, #meeting-result-staff, #meeting-result-backdown,
// #meeting-4a, #meeting-4a-loss, #meeting-4a-staff.
import { mountBoardMeeting } from './screens/boardMeeting.js';
import { boardVoteThisRound } from '../sim/board.js';
import { nextRoundDay } from '../sim/time.js';

const meeting = mountBoardMeeting(game, { overlay, stage });
// #meeting-live (debug): run the story days up to the last day before the next mark that holds a vote, where the real
// meeting opens by itself (in a round that holds one; load ?scenario=boardVote).
const liveMeetingRoute = () => {
  if (location.hash !== '#meeting-live' || game.state.ending || !boardVoteThisRound(game.state)) return;
  const turn = game.state.turn;
  while (!game.state.ending && game.state.turn === turn && nextRoundDay(game.state) - game.state.day > 1) game.advanceDays(1);
};
liveMeetingRoute();
addEventListener('hashchange', liveMeetingRoute);
const meetingRoute = () => {
  const step = location.hash.match(/^#meeting(?:-([\w-]+))?$/);
  if (step && step[1] !== 'live' && !game.state.ending) meeting.preview(step[1] ?? 'ring');
};
meetingRoute();
addEventListener('hashchange', meetingRoute);
