import { BALANCE } from './balance.js';
import { createRivals } from './rivals.js';

export function createInitialState({ seed = 1 } = {}) {
  return {
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
      contracts: [{ supplier: 'starter', units: BALANCE.startCompute, costMult: 1, failChance: 0 }],
      pipeline: [],
      servingUnits: 0,
      overflow: 0,
    },
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

    budget: { spend: 20, split: { training: 0.3, safety: 0.2, security: 0.1, product: 0.2, talent: 0.2 } },
    researchPoints: 0,
    researched: [],
    activeRun: null,
    pendingModel: null,
    internal: null,
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
    flags: {},
    rivals: createRivals(),
    advisorHistory: [],
    lastBriefing: [],
    ending: null,
  };
}
