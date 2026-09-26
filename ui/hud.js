import { activeModels, projectBurn, runway } from '../sim/economy.js';
import { rank } from '../sim/rivals.js';
import { compute, money, months, project, users } from './logic/format.js';

const ordinal = (value) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  return `${value}${value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th'}`;
};

const bubbleCount = (run, kind) => run?.bubbles?.[kind] ?? run?.[`${kind}Bubbles`] ?? 0;

export function mountHud(root, game) {
  let expanded = false;

  function render() {
    const state = game.state;
    const run = state.activeRun;
    const pill = project(state);
    const totalUsers = activeModels(state).reduce((sum, model) => sum + model.users, 0);
    const plannedRunway = runway({ ...state, burnPlanned: projectBurn(state) }, 'planned'); // burnPlanned is 0 before the first turn
    const infoId = 'lab-stats';

    root.innerHTML = `
      <div class="hud" aria-label="Current project">
        <div class="ctr cap"><div class="badge">${bubbleCount(run, 'capability')}</div><div class="tag">Capability</div></div>
        <div class="pill">
          <div class="t">${pill.name}</div>
          <div class="s">${pill.status}</div>
          ${pill.progress === null ? '' : `<div class="bar"><i style="width:${Math.round(pill.progress * 100)}%"></i></div>`}
        </div>
        <div class="ctr ali"><div class="badge">${bubbleCount(run, 'alignment')}</div><div class="tag">Alignment</div></div>
      </div>
      <button class="info" type="button" aria-expanded="${expanded}" aria-controls="${infoId}">
        <span class="full"><span class="k">Era</span> <b>${state.era}</b> <span class="k">· Turn</span> <b>${state.turn}</b> <span class="k">of 20</span></span>
        <span class="k">Cash</span><b>${money(state.cash)}</b>
        <span class="k">Runway</span><b>${months(plannedRunway)}</b>
        <span id="${infoId}" class="info-more" ${expanded ? '' : 'hidden'}>
          <span class="k">ARR</span><b>${money(state.arr)}</b>
          <span class="k">Users</span><b>${users(totalUsers)}</b>
          <span class="k">Compute</span><b>${compute(state.compute, state.era)}</b>
          <span class="k">Capability rank</span><b>${ordinal(rank(state))} of 5</b>
          <span class="k">Valuation</span><b>${money(state.valuation)}</b>
        </span>
      </button>`;

    root.querySelector('.info').addEventListener('click', () => {
      expanded = !expanded;
      render();
      root.querySelector('.info').focus();
    });
  }

  render();
  return game.subscribe(render);
}
