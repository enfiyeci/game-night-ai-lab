const root = process.argv[2]; const N = Number(process.argv[3] ?? 20);
const imp = (p) => import(`file://${root}/${p}`);
const { STRATEGIES, eventChoices, dailyRelease } = await imp('tools/balance.js');
const { playRound } = await imp('tools/play-round.js');
const { createInitialState } = await imp('sim/state.js');
const { enableScenarios } = await imp('sim/scenarios.js');
const { createRng } = await imp('sim/rng.js');
const { computeSlices } = await imp('sim/split.js');
const { SIZE_UNITS } = await imp('sim/recipe.js');
const { eraScale } = await imp('sim/data/compute.js');
const { exclusiveActive } = await imp('sim/contracts.js');
for (const name of ['balanced', 'careful', 'speed']) {
  const style = name === 'careful' ? 'careful' : name === 'speed' ? 'speed' : 'balanced';
  // planning-state measures (state BEFORE each round, bucketed by its own era)
  const plan = {}; let e2fastEscape = 0, e2noFitPlan = 0;
  let e3days = 0, e3zeroDays = 0, e3firstRounds = 0, e3zeroAllRound = 0;
  let e2daysNoFit = 0, e2days = 0, e2runsStarted = 0;
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    for (let i = 0; i < 30 && !state.ending; i++) {
      const era = state.era, tie = state.turnInEra;
      const s = computeSlices(state);
      const row = (plan[era] ??= { n: 0, noFit: 0, idle: 0 });
      row.n++;
      const small = SIZE_UNITS.small * eraScale(era);
      const free = !state.activeRun && !state.pendingModel;
      if (free && s.idle < small) row.noFit++;
      row.idle += s.online > 0 ? s.idle / s.online : 0;
      if (era === 2 && free && s.idle < small) {
        e2noFitPlan++;
        // is there a 1-round, signable card that would let a small run fit?
        const ok = state.compute.offers.some((o) => o.units > 0 && o.arrivesIn === 1 && ['coreflame', 'azuria'].includes(o.supplier) && o.upfront <= state.cash
          && !(o.supplier === 'coreflame' && exclusiveActive(state)) && (o.units + s.online - s.control - s.safety - s.need) >= small);
        if (ok) e2fastEscape++;
      }
      let zeroThisRound = 0, daysThisRound = 0;
      const acts = STRATEGIES[name](state, rng);
      if ((acts.moves ?? []).some((m) => m.type === 'startRun') && era === 2) e2runsStarted++;
      const obs = { dailyActions: (st) => {
        if (st.era === 3 && st.turnInEra === 0) { daysThisRound++; if (st.compute.online === 0) zeroThisRound++; }
        if (st.era === 2) { e2days++; const x = computeSlices(st); if (!st.activeRun && !st.pendingModel && x.idle < SIZE_UNITS.small * eraScale(2)) e2daysNoFit++; }
        return dailyRelease(name, st);
      } };
      state = playRound(state, acts, rng, (st) => eventChoices(st, style, rng), obs).state;
      if (era === 3 && tie === 0) { e3firstRounds++; e3days += daysThisRound; e3zeroDays += zeroThisRound; if (zeroThisRound === daysThisRound && daysThisRound > 0) e3zeroAllRound++; }
    }
  }
  console.log(name, 'planning-state by era:', JSON.stringify(Object.fromEntries(Object.entries(plan).map(([e, r]) => [e, { noFit: +(r.noFit / r.n).toFixed(2), idle: +(r.idle / r.n).toFixed(2) }]))));
  console.log(`  era2 planning states with no fit: ${e2noFitPlan}; of those a 1-round CoreFlame/Azuria card on the board would fit a Small run: ${e2fastEscape}; era-2 startRun moves: ${e2runsStarted}; era-2 days no fit ${e2daysNoFit}/${e2days}`);
  console.log(`  first era-3 round: ${e3firstRounds} rounds, online 0 on ${e3zeroDays}/${e3days} days; whole round at 0: ${e3zeroAllRound}`);
}
