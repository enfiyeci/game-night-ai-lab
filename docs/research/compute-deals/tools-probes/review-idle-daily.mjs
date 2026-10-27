const root = process.argv[2]; const N = Number(process.argv[3] ?? 20);
const imp = (p) => import(`file://${root}/${p}`);
const { STRATEGIES, eventChoices, dailyRelease } = await imp('tools/balance.js');
const { playRound } = await imp('tools/play-round.js');
const { createInitialState } = await imp('sim/state.js');
const { enableScenarios } = await imp('sim/scenarios.js');
const { createRng } = await imp('sim/rng.js');
const { computeSlices } = await imp('sim/split.js');
const { monthlyBills } = await imp('sim/contracts.js');
const { idleComputeCost } = await imp('ui/logic/compute.js').catch(() => ({}));
for (const name of ['balanced', 'careful', 'speed']) {
  const style = name === 'careful' ? 'careful' : name === 'speed' ? 'speed' : 'balanced';
  const d = {}; const r = {};
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    for (let i = 0; i < 30 && !state.ending; i++) {
      const era = state.era;
      const obs = { dailyActions: (st) => {
        const s = computeSlices(st); const row = (d[st.era] ??= { n: 0, u: 0, b: 0, bn: 0 });
        row.n++; row.u += s.online > 0 ? s.idle / s.online : 0;
        const bill = monthlyBills(st); if (idleComputeCost && bill > 0) { row.b += idleComputeCost(st) / bill; row.bn++; }
        return dailyRelease(name, st);
      } };
      state = playRound(state, STRATEGIES[name](state, rng), rng, (st) => eventChoices(st, style, rng), obs).state;
      const s = computeSlices(state); const rr = (r[era] ??= { n: 0, u: 0 }); rr.n++; rr.u += s.online > 0 ? s.idle / s.online : 0;
    }
  }
  console.log(name, 'daily idle unit share', Object.entries(d).map(([e, x]) => `${e}:${(x.u / x.n).toFixed(2)}`).join(' '), '| daily idle bill share (UI idleComputeCost)', Object.entries(d).map(([e, x]) => `${e}:${x.bn ? (x.b / x.bn).toFixed(2) : 'na'}`).join(' '), '| probe-style snapshot', Object.entries(r).map(([e, x]) => `${e}:${(x.u / x.n).toFixed(2)}`).join(' '));
}
