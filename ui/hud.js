import { activeModels, projectBurn, runway } from '../sim/economy.js';
import { eraById } from '../sim/data/eras.js';
import { rank } from '../sim/rivals.js';
import { ROUND_DAYS, roundWord, storyDate } from '../sim/time.js';
import { compute, money, months, project, users } from './logic/format.js';
import { badgeCounts } from './logic/training.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PAUSE_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10" rx="1" style="fill:currentColor"/><rect x="7" y="1" width="3" height="10" rx="1" style="fill:currentColor"/></svg>';

const ordinal = (value) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  return `${value}${value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th'}`;
};

export function mountHud(root, game) {
  let expanded = false;
  let clock = null;
  let unsubscribeClock = () => {};

  function connectClock() {
    if (clock === game.clock) return;
    unsubscribeClock();
    clock = game.clock;
    unsubscribeClock = clock?.on('tick', render) ?? (() => {});
  }

  function render() {
    connectClock();
    const state = game.state;
    const run = state.activeRun;
    const counts = badgeCounts(state, game.lastAlignShare);
    const pill = project(state);
    const totalUsers = activeModels(state).reduce((sum, model) => sum + model.users, 0);
    const plannedRunway = runway({ ...state, burnPlanned: projectBurn(state) }, 'planned'); // burnPlanned is 0 before the first turn
    const infoId = 'lab-stats';
    const date = storyDate(state.day);
    const nextMark = storyDate(state.day + ROUND_DAYS[state.era] - state.dayInRound);
    const clockState = game.clock?.now() ?? { speed: 1, paused: false };
    const beat = Math.round((state.dayInRound / ROUND_DAYS[state.era]) * 100);
    const markLabel = `New ${roundWord(state.era)} on ${nextMark.label}`;
    const speedButton = (speed) => `<button type="button" data-speed="${speed}" class="${clockState.speed === speed ? 'on' : ''}" aria-label="Speed ${speed}" aria-pressed="${clockState.speed === speed}">×${speed}</button>`;

    root.innerHTML = `
      <div class="hud" aria-label="Current project">
        <div class="ctr cap"><div class="badge">${counts.capability}</div><div class="tag">Capability</div></div>
        <div class="pill">
          <div class="t"></div>
          <div class="s">${pill.status}</div>
          ${pill.progress === null ? '' : `<div class="bar"><i style="width:${Math.round(pill.progress * 100)}%"></i></div>`}
        </div>
        <div class="ctr ali"><div class="badge">${counts.alignment}</div><div class="tag">Alignment</div></div>
      </div>
      <button class="info" type="button" aria-expanded="${expanded}" aria-controls="${infoId}">
        <span class="full"><span class="k">Era</span> <b>${state.era}</b> <span class="k">· ${eraById(state.era).name}</span></span>
        <span class="k">Cash</span><b>${money(state.cash)}</b>
        <span class="k">Runway</span><b>${months(plannedRunway)}</b>
        <span id="${infoId}" class="info-more" ${expanded ? '' : 'hidden'}>
          <span class="k">ARR</span><b>${money(state.arr)}</b>
          <span class="k">Users</span><b>${users(totalUsers)}</b>
          <span class="k">Compute</span><b>${compute(state.compute, state.era)}</b>
          <span class="k">Capability rank</span><b>${ordinal(rank(state))} of 5</b>
          <span class="k">Valuation</span><b>${money(state.valuation)}</b>
        </span>
      </button>
      <div class="clock" aria-label="Game clock">
        <span class="date">${date.label}<small>${MONTH_NAMES[date.m - 1]}</small><span class="beat" role="progressbar" aria-label="${markLabel}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${beat}"><i style="width:${beat}%"></i></span></span>
        <button type="button" data-speed="0" class="${clockState.speed === 0 ? 'on' : ''}" aria-label="Pause" aria-pressed="${clockState.speed === 0}">${PAUSE_ICON}</button>
        ${speedButton(1)}${speedButton(2)}${speedButton(4)}
        ${clockState.paused ? '<span class="paused">Paused</span>' : ''}
      </div>`;

    root.querySelector('.pill .t').textContent = pill.name; // player-typed names are text, never markup

    root.querySelector('.info').addEventListener('click', () => {
      expanded = !expanded;
      render();
      root.querySelector('.info').focus();
    });

    for (const button of root.querySelectorAll('.clock button[data-speed]')) {
      button.addEventListener('click', () => game.clock?.setSpeed(Number(button.dataset.speed)));
    }
  }

  render();
  queueMicrotask(render);
  const unsubscribeGame = game.subscribe(render);
  return () => {
    unsubscribeGame();
    unsubscribeClock();
  };
}
