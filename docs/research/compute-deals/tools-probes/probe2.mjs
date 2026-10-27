const root = process.argv[2]; const N = Number(process.argv[3] ?? 50);
const imp = (p) => import(`file://${root}/${p}`);
const { STRATEGIES, eventChoices, dailyRelease } = await imp('tools/balance.js');
const { playRound } = await imp('tools/play-round.js');
const { createInitialState } = await imp('sim/state.js');
const { enableScenarios } = await imp('sim/scenarios.js');
const { createRng } = await imp('sim/rng.js');
const { computeSlices } = await imp('sim/split.js');
const { monthlyBills } = await imp('sim/contracts.js');
const { projectBurn } = await imp('sim/economy.js');
const out = {};
for (const name of ['balanced', 'careful', 'speed']) {
  const per = {};
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    for (let i = 0; i < 30 && !state.ending; i++) {
      const era = state.era;
      const board = state.compute.offers.filter((o) => o.units > 0 && !o.viaQueue && o.supplier !== 'grid');
      const named = board.filter((o) => o.wantedBy).length;
      const style = name === 'careful' ? 'careful' : name === 'speed' ? 'speed' : 'balanced';
      state = playRound(state, STRATEGIES[name](state, rng), rng, (s) => eventChoices(s, style, rng), { dailyActions: (s) => dailyRelease(name, s) }).state;
      const s = computeSlices(state);
      const bill = monthlyBills(state);
      const idleBill = s.online > 0 ? bill * s.idle / s.online : 0;
      const burn = Math.max(1, projectBurn(state) - state.arr / 12);
      const row = (per[era] ??= { n: 0, idleBillShare: 0, runwayMonths: [], namedShare: 0, servingShare: 0, onlineDrop: 0 });
      row.n++; row.idleBillShare += bill > 0 ? idleBill / bill : 0; row.runwayMonths.push(state.cash / burn);
      row.namedShare += board.length ? named / board.length : 0; row.servingShare += s.online > 0 ? s.serving / s.online : 0;
    }
  }
  out[name] = Object.fromEntries(Object.entries(per).map(([e, r]) => { const m = r.runwayMonths.sort((a, b) => a - b); return [e, { rounds: r.n, idleBillShare: +(r.idleBillShare / r.n).toFixed(2), medianRunwayMonths: +m[Math.floor(m.length / 2)].toFixed(1), servingShareOfOnline: +(r.servingShare / r.n).toFixed(2), boardCardsNamedByRivals: +(r.namedShare / r.n).toFixed(2) }]; }));
}
console.log(JSON.stringify(out, null, 1));
