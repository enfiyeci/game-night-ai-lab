const root = process.argv[2]; const N = Number(process.argv[3] ?? 50);
const imp = (p) => import(`file://${root}/${p}`);
const { STRATEGIES, eventChoices, dailyRelease } = await imp('tools/balance.js');
const { playRound } = await imp('tools/play-round.js');
const { createInitialState } = await imp('sim/state.js');
const { enableScenarios } = await imp('sim/scenarios.js');
const { createRng } = await imp('sim/rng.js');
for (const name of ['balanced', 'careful', 'speed', 'random']) {
  let zero = 0, drop = 0, runs = 0, scaleBreak = 0;
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    let lastE2 = null, firstE3 = null;
    for (let i = 0; i < 30 && !state.ending; i++) {
      const acts = STRATEGIES[name](state, rng);
      scaleBreak += (acts.contractActions ?? []).length;
      const style = name === 'careful' ? 'careful' : ['speed','random'].includes(name) ? name : 'balanced';
      state = playRound(state, acts, rng, (s) => eventChoices(s, style, rng), { dailyActions: (s) => dailyRelease(name, s) }).state;
      if (state.era === 2) lastE2 = state.compute.online;
      if (state.era === 3 && firstE3 == null) firstE3 = state.compute.online;
    }
    if (firstE3 != null) { runs++; if (firstE3 === 0) zero++; if (lastE2 > 0 && firstE3 < lastE2 * 0.5) drop++; }
  }
  console.log(name, `reached era3 ${runs}/${N}; online 0 at first era-3 round: ${zero}; fell by half or more vs last era-2 round: ${drop}; contract actions (scale down/break/buyout) used: ${scaleBreak}`);
}
