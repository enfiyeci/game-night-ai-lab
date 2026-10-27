// Read-only probe of how compute deals play out in the bots. Usage: node dealprobe.mjs <worktree> <seeds>
const root = process.argv[2];
const N = Number(process.argv[3] ?? 60);
const imp = (p) => import(`file://${root}/${p}`);
const { STRATEGIES, eventChoices, dailyRelease } = await imp('tools/balance.js');
const { playRound } = await imp('tools/play-round.js');
const { createInitialState } = await imp('sim/state.js');
const { enableScenarios } = await imp('sim/scenarios.js');
const { createRng } = await imp('sim/rng.js');
const { computeSlices } = await imp('sim/split.js');
const { SIZE_UNITS } = await imp('sim/recipe.js');
const { eraScale } = await imp('sim/data/compute.js');
const { monthlyBills } = await imp('sim/contracts.js');
const { rank } = await imp('sim/rivals.js');

const names = ['balanced', 'speed', 'safety', 'careful', 'random'];
const out = {};
for (const name of names) {
  const m = { runs: 0, endings: {}, perEra: {}, signsBySupplier: {}, signsByEra: {}, offersSeen: 0, rivalTakes: 0, denials: 0, contractActions: 0 };
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed);
    let state = enableScenarios(createInitialState({ seed }));
    for (let i = 0; i < 30 && !state.ending; i++) {
      const era = state.era;
      const actions = STRATEGIES[name](state, rng);
      const deals = (actions.moves ?? []).filter((mv) => mv.type === 'deal' || mv.type === 'queueOrder' || mv.type === 'buildSite');
      const offersBefore = state.compute.offers.filter((o) => o.units > 0).length;
      const style = ['careful'].includes(name) ? 'careful' : ['speed', 'safety', 'random'].includes(name) ? name : 'balanced';
      const before = structuredClone(state.compute.offers);
      const result = playRound(state, actions, rng, (s) => eventChoices(s, style, rng), { dailyActions: (s) => dailyRelease(name, s) });
      state = result.state;
      const row = (m.perEra[era] ??= { rounds: 0, online: 0, idle: 0, idleNoRun: 0, blockedNoFit: 0, runPaused: 0, billShare: 0, rank1: 0, dealsSigned: 0, offers: 0 });
      row.rounds += 1;
      row.offers += offersBefore;
      const s = computeSlices(state);
      row.online += s.online;
      row.idle += s.online > 0 ? s.idle / s.online : 0;
      const smallest = SIZE_UNITS.small * eraScale(state.era);
      if (!state.activeRun && !state.pendingModel && s.idle < smallest) row.blockedNoFit += 1;
      if (!state.activeRun && !state.pendingModel && s.idle >= smallest) row.idleNoRun += 1;
      if (state.activeRun && state.activeRun.canAdvance === false) row.runPaused += 1;
      if (rank(state) === 1) row.rank1 += 1;
      for (const mv of deals) {
        if (mv.type === 'deal') {
          const off = before.find((o) => o.id === mv.offerId);
          const sup = off?.supplier ?? '?';
          m.signsBySupplier[sup] = (m.signsBySupplier[sup] ?? 0) + 1;
          if (off?.wantedBy) m.denials += 1;
        } else {
          m.signsBySupplier[mv.type] = (m.signsBySupplier[mv.type] ?? 0) + 1;
        }
        row.dealsSigned += 1;
      }
      m.rivalTakes += result.events.filter((e) => e.type === 'rivalDeal').length;
    }
    m.runs += 1;
    const end = state.ending?.id ?? state.ending?.type ?? (state.ending ? JSON.stringify(state.ending).slice(0, 30) : 'none');
    m.endings[end] = (m.endings[end] ?? 0) + 1;
  }
  for (const [era, row] of Object.entries(m.perEra)) {
    m.perEra[era] = {
      rounds: row.rounds,
      avgOnline: +(row.online / row.rounds).toFixed(1),
      idleShare: +(row.idle / row.rounds).toFixed(2),
      roundsNoRunFits: +(row.blockedNoFit / row.rounds).toFixed(2),
      roundsIdleButNoRun: +(row.idleNoRun / row.rounds).toFixed(2),
      roundsRunPaused: +(row.runPaused / row.rounds).toFixed(2),
      dealsPerRound: +(row.dealsSigned / row.rounds).toFixed(2),
      offersOnBoard: +(row.offers / row.rounds).toFixed(1),
      rank1Share: +(row.rank1 / row.rounds).toFixed(2),
    };
  }
  out[name] = m;
}
console.log(JSON.stringify(out, null, 1));
