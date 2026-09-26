import { BALANCE } from './balance.js';
import { generateOffers, sideRng } from './contracts.js';
import { createRivals } from './rivals.js';
import { createAutomation } from './data/automation.js';
import { INITIAL_BOARD, boardSnapshot } from './board.js';

export function createInitialState({ seed = 1 } = {}) {
  const state = {
    seed,
    turn: 0,
    era: 1,
    turnInEra: 0,
    monthsElapsed: 0,
    day: 0,
    dayInRound: 0,
    round: { moves: 0, teams: {} },
    holdOrShipChoice: 'hold',

    cash: BALANCE.startCash,
    burnPlanned: 0,
    burnTrailing: 0,
    burnHistory: [],
    arr: 0,
    sentiment: 1,
    valuation: BALANCE.startValuation,
    compute: {
      online: BALANCE.startCompute,
      contracts: [{ id: 'starter', supplier: 'starter', units: BALANCE.startCompute, price: 1, monthsLeft: 24, needsPower: false, string: null,
        arrivedTurn: 0, scaledDown: false, troubled: false, dark: false, bumpTurn: null, exclusiveBought: false, headline: null }],
      pipeline: [],
      servingUnits: 0,
      split: { safety: 0.1, servingCap: null, coverWithSpot: true, resellIdle: false },
      offers: [],
      delays: {},
      nextId: 1,
      credits: 0,
      unpowered: 0,
      queue: null,
      surge: null,
      pooled: 0,
    },
    power: { sites: [], nextId: 1 },
    capability: BALANCE.startCapability,

    board: [...INITIAL_BOARD],
    boardPromise: null,
    boardDeals: [],
    boardLost: [],
    boardLast: null,
    boardBefore: null,
    govFavor: { us: 50, intl: 50 },
    staffTrust: 70,
    publicTrust: 60,

    alignmentDebt: 5,
    concealedDebt: 0,
    perceivedAdOffset: 0,
    misuseExposure: 5,
    misuseLocked: 0,
    security: 40,
    legalCases: [],
    raceHeat: 20,

    budget: { spend: 20, split: { training: 0.5, security: 0.1, product: 0.2, talent: 0.2 } },
    researchPoints: 0,
    researched: [],
    activeRun: null,
    pendingModel: null,
    automation: createAutomation(),
    deal: null,
    models: [],
    warnings: {},
    pendingEvents: [],
    feed: [],
    seenEvents: [],
    lastRivalReleases: [],
    rivalLaunches: [], // launches rolled at a mark, landing on their day in the next round (stage 2)
    rivalLaunchesThisRound: [],
    lastFlagshipScore: 0,
    lastFlagship: null,

    constitution: { hardLines: [], rulings: {}, amendments: [] },
    promises: [],
    promiseBaselines: {},
    meeting: null,
    meetingsHeld: [],
    flags: {},
    rivals: createRivals(),
    advisorHistory: [],
    lastBriefing: [],
    ending: null,
  };
  // The round's start, taken at each round mark: mood posts read raceHeat and publicTrust, the board reads the rest.
  state.roundStart = {
    ...boardSnapshot(state), capability: state.capability, cash: state.cash, raceHeat: state.raceHeat, publicTrust: state.publicTrust,
    board: [...state.board],
  };
  state.compute.offers = generateOffers(state, sideRng(state, 0));
  return state;
}
