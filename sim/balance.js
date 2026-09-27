// First-pass tuning constants. tools/balance.js is how these get tuned.
export const BALANCE = {
  startCash: 1000,
  startCompute: 10,
  startCapability: 20,
  maxCapability: 100,
  startValuation: 5000,
  unitMonthlyCost: 1.46, // $M per compute unit per month ($2/GPU-hour × 730 h × 1,000 GPUs)
  unitMonthlyDollars: 1.46e6,
  spotPremium: 1.5,
  baseOpsMonthly: 15,
  baseRunGain: 10,
  alignDebtFactor: 2,
  dangerLine: 55,
  misuseDisasterLine: 70,
  raceHeatDisaster: 85,
  raceHeatDecay: 1,
  ownReleaseHeat: 3,
  dangerZoneRunwayMonths: 6,
  gateMaxRank: 2,
  gateMaxGap: 15,
  boardPassMembers: 4, // of seven (sim/board.js)
  boardSupportLine: 55,
  // The staff read (spec §5.1): a band around each director's support, never the number.
  boardReadMisread: 4, // the centre is off by up to this much, from a pure hash of seed, turn and seat
  boardReadSpread: 5, // base half-width
  boardReadMoved: 4, // wider when the director moved 3 or more points last round
  boardReadCandor: 6, // the candor watchdog keeps her cards close
  boardReadDeal: 4, // wider while a deal with that director is open
  boardReadLeak: 10, // everyone, while the leak (board event) is active
  boardReadQuiet: 8, // everyone, while the board goes quiet in a close vote round
  // Deals (spec §5.2). Suggestions; the owner balances after the first playthrough.
  boardDealBoost: 5,
  boardDealKept: 3,
  boardDealBrokenCandor: 6,
  boardLostDrop: 20,
  boardLostCap: 40,
  boardRequestLeakChance: 0.35, // the board event "Send a cleaned-up version"
};
