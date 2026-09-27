import { createInitialState } from './sim/state.js';
import { createRng } from './sim/rng.js';
import { endTurn } from './sim/turn.js';
import { STRATEGIES } from './tools/balance.js';
import { rank } from './sim/rivals.js';
const N = Number(process.argv[2] ?? 100);
const names = (process.argv[3] ?? 'speed,safety,balanced,random').split(',');
for (const name of names) {
  const endings = {}; let r1 = 0, turns = 0, gateRank = [], deals = 0, era = 0;
  for (let seed = 1; seed <= N; seed++) {
    const rng = createRng(seed); let s = createInitialState({ seed });
    for (let i = 0; i < 30 && !s.ending; i++) {
      const e0 = s.era, t0 = s.turnInEra;
      const res = endTurn(s, STRATEGIES[name](s, rng), rng); s = res.state;
      deals += res.events.filter((e) => e.type === 'rivalDeal').length;
      turns++; if (rank(s) === 1) r1++;
      if (e0 === 4 && t0 === 3) gateRank.push(rank(s));
    }
    const k = s.ending === "leftBehind" ? `leftBehind@e${s.era}` : s.ending; endings[k] = (endings[k] ?? 0) + 1; era += s.era;
  }
  const sorted = Object.fromEntries(Object.entries(endings).sort((a, b) => b[1] - a[1]));
  console.log(name.padEnd(9), 'rank1', (r1 / turns).toFixed(2), 'era4rank', gateRank.length ? (gateRank.reduce((a, b) => a + b, 0) / gateRank.length).toFixed(2) : '-', 'meanEra', (era / N).toFixed(2), 'deals/run', (deals / N).toFixed(1), JSON.stringify(sorted));
}
