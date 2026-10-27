const root = process.argv[2]; const name = process.argv[3] ?? 'balanced'; const seed = Number(process.argv[4] ?? 1);
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
const rng = createRng(seed);
let state = enableScenarios(createInitialState({ seed }));
for (let i = 0; i < 30 && !state.ending; i++) {
  const actions = STRATEGIES[name](state, rng);
  const mv = (actions.moves ?? []).map((m) => m.type === 'deal' ? `deal:${m.offerId}` : m.type).join(',');
  const style = ['speed','safety','random'].includes(name) ? name : name === 'careful' ? 'careful' : 'balanced';
  const r = playRound(state, actions, rng, (s) => eventChoices(s, style, rng), { dailyActions: (s) => dailyRelease(name, s) });
  state = r.state;
  const s = computeSlices(state);
  const offers = state.compute.offers.filter(o=>o.units>0).map(o=>`${o.supplier}${o.units}${o.wantedBy?'*':''}`).join(' ');
  console.log(`t${state.turn} e${state.era} cash${Math.round(state.cash)} on${s.online} serve${Math.round(s.serving)}/${Math.round(s.need)} safe${s.safety} ctl${s.control} train${s.training} run${s.run} idle${s.idle} small${SIZE_UNITS.small*eraScale(state.era)} run?${state.activeRun?'Y':state.pendingModel?'P':'-'} bill${Math.round(monthlyBills(state))} cap${state.capability.toFixed(0)} | ${mv} | contracts ${state.compute.contracts.map(c=>c.supplier+c.units+'/'+(c.monthsLeft??'∞')).join(' ')} | offers ${offers}`);
}
console.log('END', state.ending);
