const root = process.argv[2]; const N = Number(process.argv[3] ?? 20);
const imp = (p) => import(`file://${root}/${p}`);
const { STRATEGIES, eventChoices, dailyRelease } = await imp('tools/balance.js');
const { playRound } = await imp('tools/play-round.js');
const { createInitialState } = await imp('sim/state.js');
const { enableScenarios } = await imp('sim/scenarios.js');
const { createRng } = await imp('sim/rng.js');
const { computeSlices } = await imp('sim/split.js');
const { rank } = await imp('sim/rivals.js');
for (const name of ['balanced', 'careful']) {
  const style = name === 'careful' ? 'careful' : 'balanced';
  const signs = {}; let sv = 0, sn = 0, r1 = 0, rn = 0;
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    for (let i = 0; i < 30 && !state.ending; i++) {
      const era = state.era;
      const acts = STRATEGIES[name](state, rng);
      for (const mv of acts.moves ?? []) if (mv.type === 'deal') { const o = state.compute.offers.find((x) => x.id === mv.offerId); const k = `e${era}:${o?.supplier}`; signs[k] = (signs[k] ?? 0) + 1; }
      const obs = { dailyActions: (st) => {
        if (st.era === 2) { const s = computeSlices(st); if (s.online > 0) { sv += s.serving / s.online; sn++; } }
        if (name === 'careful') { const d = dailyRelease(name, st); for (const mv of d?.moves ?? []) if (mv.type === 'deal') { const k = `e${st.era}:daily`; signs[k] = (signs[k] ?? 0) + 1; } return d; }
        return null; } };
      state = playRound(state, acts, rng, (st) => eventChoices(st, style, rng), obs).state;
      if (state.era === 2) { rn++; if (rank(state) === 1) r1++; }
    }
  }
  console.log(name, 'era2 daily serving share', (sv / sn).toFixed(2), 'rank1 at era-2 marks', `${r1}/${rn}`, JSON.stringify(signs));
}
