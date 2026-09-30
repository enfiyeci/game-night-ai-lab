import { simulate } from './balance.js';

const seeds = Number(process.argv[2] ?? 200);
if (!Number.isInteger(seeds) || seeds < 1) throw new Error('Pass a positive integer seed count.');
const report = { seeds, strategies: {} };
for (const strategy of ['balanced', 'speed', 'safety', 'random']) {
  const totals = { releases: 0, reviews: 0, tens: 0, perfect: 0, sum: 0, endings: {} };
  for (let seed = 1; seed <= seeds; seed++) {
    const state = simulate(strategy, seed);
    totals.endings[state.ending] = (totals.endings[state.ending] ?? 0) + 1;
    for (const model of state.models) {
      if (!model.launch) continue;
      const scores = model.launch.press.map((critic) => critic.score);
      totals.releases++;
      totals.reviews += scores.length;
      totals.tens += scores.filter((score) => score === 10).length;
      totals.perfect += scores.every((score) => score === 10) ? 1 : 0;
      totals.sum += scores.reduce((sum, score) => sum + score, 0);
    }
  }
  report.strategies[strategy] = totals;
}
console.log(JSON.stringify(report, null, 2));
