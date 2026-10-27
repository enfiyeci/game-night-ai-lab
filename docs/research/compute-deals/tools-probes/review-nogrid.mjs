const root = process.argv[2]; const N = Number(process.argv[3] ?? 10);
const imp = (p) => import(`file://${root}/${p}`);
const { STRATEGIES, eventChoices, dailyRelease } = await imp('tools/balance.js');
const { playRound } = await imp('tools/play-round.js');
const { createInitialState } = await imp('sim/state.js');
const { enableScenarios } = await imp('sim/scenarios.js');
const { createRng } = await imp('sim/rng.js');
const { rank } = await imp('sim/rivals.js');
for (const name of ['careful', 'carefulNoGrid']) {
  const signs = {}; let unpowered4 = 0, online4 = 0, n4 = 0, rank4 = 0; const ends = {};
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    for (let i = 0; i < 30 && !state.ending; i++) {
      const era = state.era;
      const acts = STRATEGIES[name](state, rng);
      for (const mv of acts.moves ?? []) if (['deal', 'queueOrder', 'buildSite'].includes(mv.type)) {
        const o = state.compute.offers.find((x) => x.id === mv.offerId); const k = `e${era}:${o?.supplier ?? mv.type}`; signs[k] = (signs[k] ?? 0) + 1; }
      state = playRound(state, acts, rng, (s) => eventChoices(s, 'careful', rng), { dailyActions: (s) => dailyRelease(name, s) }).state;
      if (state.era === 4) { n4++; unpowered4 += state.compute.unpowered ?? 0; online4 += state.compute.online; rank4 += rank(state); }
    }
    ends[state.ending] = (ends[state.ending] ?? 0) + 1;
  }
  console.log(name, JSON.stringify(ends), 'era4 avg online', (online4 / n4).toFixed(0), 'avg unpowered', (unpowered4 / n4).toFixed(0), 'avg rank', (rank4 / n4).toFixed(2), JSON.stringify(signs));
}
