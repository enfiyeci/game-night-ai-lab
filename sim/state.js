import { BALANCE } from './balance.js';
import { generateOffers, sideRng } from './contracts.js';
import { createRivals } from './rivals.js';

export function createInitialState({ seed = 1 } = {}) {
  const state = {
    seed,
    turn: 0,
    era: 1,
    turnInEra: 0,
    monthsElapsed: 0,

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

    board: [70, 60, 65, 55, 80],
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
    internal: null,
    deal: null,
    models: [],
    warnings: {},
    pendingEvents: [],
    feed: [],
    seenEvents: [],
    lastRivalReleases: [],
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
  state.compute.offers = generateOffers(state, sideRng(state, 0));
  return state;
}
