import { rivalRumor, rumorText, showFlawBadge } from './logic/polish.js';
import { flawsLeft } from '../sim/polish.js';
import { activeModels, projectBurn, runway, monthlyRevenue } from '../sim/economy.js';
import { eraById } from '../sim/data/eras.js';
import { rank } from '../sim/rivals.js';
import { ROUND_DAYS, roundWord, storyDate } from '../sim/time.js';
import { compute, money, months, project, users } from './logic/format.js';
import { cashLine, monthBill, weekFlows } from './logic/money.js';
import { badgeCounts } from './logic/training.js';
import { openFinance } from './screens/finance.js';
import { openComputeInfo } from './screens/computeInfo.js';
import { sfx } from './sfx.js';
import { sound } from './sound.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SPEAKER_ICON = (muted) => `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6 h2.6 l3.4 -3 v10 l-3.4 -3 h-2.6 z" style="fill:currentColor"/>${muted
  ? '<path d="M11 6 l4 4 M15 6 l-4 4" style="stroke:currentColor;stroke-width:1.6;stroke-linecap:round;fill:none"/>'
  : '<path d="M10.8 5.6 q1.6 2.4 0 4.8 M12.6 4 q3 4 0 8" style="stroke:currentColor;stroke-width:1.5;stroke-linecap:round;fill:none"/>'}</svg>`;
const PAUSE_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10" rx="1" style="fill:currentColor"/><rect x="7" y="1" width="3" height="10" rx="1" style="fill:currentColor"/></svg>';
// Why the game is waiting while a speed is still chosen (owner pick 3A: say the reason instead of "Paused").
const WAIT_WORDS = { dialog: 'screen open', menu: 'menu open', hidden: 'tab hidden', screenwall: 'card open', 'event-card': 'card open', 'event-card-loading': 'card open', hazard: 'card open', 'board-meeting': 'board meeting', intro: 'team tour' };
const SPARK_W = 212;
const SPARK_H = 40;

const ordinal = (value) => {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  return `${value}${value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th'}`;
};
const signed = (m) => (m >= 0 ? `+${money(m)}` : `−${money(-m)}`);
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// The cash line (pick 1C): cash since the start, jumps at raises, and a dashed run to zero at today's spending.
function sparkline(state, history) {
  const line = cashLine(state, history);
  const all = [...line.points, ...line.projection];
  const x0 = all[0].month;
  const x1 = Math.max(x0 + 1, line.projection[1].month);
  const hi = Math.max(1, ...all.map((p) => p.cash));
  const lo = Math.min(0, ...all.map((p) => p.cash));
  const x = (m) => ((m - x0) / (x1 - x0)) * (SPARK_W - 4) + 2;
  const y = (c) => 3 + (1 - (c - lo) / (hi - lo)) * (SPARK_H - 6);
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.month).toFixed(1)} ${y(p.cash).toFixed(1)}`).join(' ');
  const now = line.projection[0];
  const left = line.runsOutIn == null ? null : Math.max(1, Math.round(line.runsOutIn));
  const end = line.outOfCash ? 'Out of cash' : left == null ? 'lasts 2+ years' : `$0 in ~${left} mo`;
  const label = line.outOfCash ? 'Cash since the start; you are out of cash'
    : left == null ? 'Cash since the start; at today’s spending it lasts more than two years'
      : `Cash since the start; at today’s spending it reaches zero in about ${left} month${left === 1 ? '' : 's'}`;
  return `<span class="hud-spark" role="img" aria-label="${label}">
      <svg width="${SPARK_W}" height="${SPARK_H}" viewBox="0 0 ${SPARK_W} ${SPARK_H}" aria-hidden="true">
        <line x1="0" x2="${SPARK_W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" class="hud-spark-zero"/>
        <path d="${path(line.projection)}" class="hud-spark-ahead"/>
        <path d="${path(line.points)}" class="hud-spark-past"/>
        <circle cx="${x(now.month).toFixed(1)}" cy="${y(now.cash).toFixed(1)}" r="2.6" class="hud-spark-now"/>
      </svg>
      <span class="hud-spark-cap"><span>Start</span><span class="${left == null && !line.outOfCash ? '' : 'out'}">${end}</span></span>
    </span>`;
}

// The in and out line (pick 1B): this month's money in, money out, and the difference.
function flowLine(bill) {
  const top = Math.max(1, bill.moneyIn, bill.moneyOut);
  return `<span class="hud-flow">
      <span class="k">This month</span><span class="in">+${money(bill.moneyIn)} in</span><span class="out">−${money(bill.moneyOut)} out</span>
      <span class="hud-flow-bars" aria-hidden="true"><i class="in" style="width:${(bill.moneyIn / top) * 100}%"></i><i class="out" style="width:${(bill.moneyOut / top) * 100}%"></i></span>
      <span class="hud-flow-net"><span>Net this month</span><b class="${bill.net < 0 ? 'out' : 'in'}">${signed(bill.net)}</b></span>
    </span>`;
}

export function mountHud(root, game) {
  let expanded = false;
  let clock = null;
  let unsubscribeClock = () => {};
  let lastWeek = null;
  const view = document.createElement('div');
  view.className = 'hud-view';
  const floats = document.createElement('div');
  floats.className = 'hud-floats';
  floats.setAttribute('aria-hidden', 'true');
  root.append(view, floats);

  function connectClock() {
    if (clock === game.clock) return;
    unsubscribeClock();
    clock = game.clock;
    unsubscribeClock = clock?.on('tick', render) ?? (() => {});
  }

  // Each story week that passes while the clock runs, that week's money in and out float up beside the box.
  function floatWeek(state) {
    const week = Math.floor(state.day / 7);
    const passed = lastWeek !== null && week > lastWeek;
    lastWeek = week;
    if (!passed || reducedMotion() || state.ending) return;
    const box = view.querySelector('.info');
    const column = view.querySelector('.hud-right');
    if (!box || !column) return;
    const flows = weekFlows(state);
    const make = (kind, text, label, dy) => {
      const node = document.createElement('div');
      node.className = `hud-float ${kind}`;
      node.style.right = `${root.clientWidth - column.offsetLeft - box.offsetLeft + 12}px`;
      node.style.top = `${column.offsetTop + box.offsetTop + dy}px`;
      node.innerHTML = `${text}<small>${label}</small>`;
      node.addEventListener('animationend', () => node.remove());
      floats.append(node);
    };
    if (flows.moneyIn >= 0.5) make('in', `+${money(flows.moneyIn)}`, 'sales this week', 26);
    make('out', `−${money(flows.moneyOut)}`, 'costs this week', 72);
  }

  // The shell is built once so its buttons survive the daily redraw (a click that straddles a rebuild is lost);
  // each render only rewrites text and states inside it.
  view.innerHTML = `
    <div class="hud" aria-label="Current project"></div>
    <button type="button" class="ctr hud-flaw" data-act="flaws" aria-label="Flaws" hidden><span class="badge"></span><span class="tag">Flaws</span></button>
    <div class="hud-polish" hidden>
      <button type="button" class="hud-publish" data-act="publish"></button>
      <span class="hud-rumor" hidden></span>
    </div>
    <div class="lab-plate" aria-label="Your lab" hidden></div>
    <div class="hud-right">
      <button class="info" type="button" aria-controls="lab-stats"></button>
      <div class="hud-actions">
        <button type="button" class="hud-btn" data-open="money"><span class="ic money" aria-hidden="true">$</span>Money</button>
        <button type="button" class="hud-btn" data-open="compute"><span class="ic compute" aria-hidden="true"></span>Compute</button>
      </div>
      <div class="clock" aria-label="Game clock">
        <span class="date"></span>
        <button type="button" data-speed="0" aria-label="Pause">${PAUSE_ICON}</button>
        <button type="button" data-speed="1" aria-label="Speed 1">×1</button>
        <button type="button" data-speed="2" aria-label="Speed 2">×2</button>
        <button type="button" data-speed="4" aria-label="Speed 4">×4</button>
        <span class="sep" aria-hidden="true"></span>
        <button type="button" class="mute" aria-label="Mute all sound"></button>
        <span class="waiting" role="status" hidden></span>
      </div>
    </div>`;
  const centre = view.querySelector('.hud');
  const info = view.querySelector('.info');
  const date = view.querySelector('.clock .date');
  const waitingLabel = view.querySelector('.clock .waiting');
  const column = view.querySelector('.hud-right');
  const labPlate = view.querySelector('.lab-plate');
  const mute = view.querySelector('.clock .mute');
  const overlay = () => document.querySelector('#overlay');
  // Like the office's own clicks, the buttons wait while a card, the phone, the screen wall, the title or the team tour holds the stage.
  const blocked = () => Boolean(overlay()?.querySelector('.event-layer, .ev-phone, .screenwall-layer, .title-layer, .intro-layer'));

  info.addEventListener('click', () => {
    expanded = !expanded;
    render();
  });
  view.querySelector('[data-open="money"]').addEventListener('click', () => { if (!blocked()) openFinance(game, overlay(), { view: 'month' }); });
  view.querySelector('[data-open="compute"]').addEventListener('click', () => { if (!blocked()) openComputeInfo(game, overlay()); });
  for (const button of view.querySelectorAll('.clock button[data-speed]')) {
    button.addEventListener('click', () => game.clock?.setSpeed(Number(button.dataset.speed)));
  }
  mute.addEventListener('click', () => {
    sound.muted = !sound.muted; // re-renders through sound.subscribe
    if (sound.muted) sfx.hush();
  });

  // Keep polishing (spec §4): the pill opens the calendar strip, the badge the flaws list, the button the release.
  const polishAct = (act) => { if (!blocked() && !overlay()?.querySelector('.dialog-layer')) overlay()?.dispatchEvent(new CustomEvent('polish-act', { detail: act })); };
  view.addEventListener('click', (event) => {
    const act = event.target.closest?.('[data-act]')?.dataset.act;
    if (act) polishAct(act);
  });
  centre.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('.pill-act')) {
      event.preventDefault();
      polishAct('strip');
    }
  });

  function render() {
    connectClock();
    const state = game.state;
    const counts = badgeCounts(state, game.lastAlignShare);
    const pill = project(state);
    const totalUsers = activeModels(state).reduce((sum, model) => sum + model.users, 0);
    const plannedRunway = runway({ ...state, arr: monthlyRevenue(state) * 12, burnPlanned: projectBurn(state) }, 'planned'); // burnPlanned is 0 before the first turn
    const bill = monthBill(state);
    const day = storyDate(state.day);
    const nextMark = storyDate(state.day + ROUND_DAYS[state.era] - state.dayInRound);
    const clockState = game.clock?.now() ?? { speed: 1, paused: false, reasons: [] };
    const waiting = clockState.speed !== 0 && (clockState.reasons?.length ?? 0) > 0;
    const waitWord = waiting ? (WAIT_WORDS[clockState.reasons.find((r) => WAIT_WORDS[r])] ?? null) : null;
    const beat = Math.round((state.dayInRound / ROUND_DAYS[state.era]) * 100);
    const markLabel = `New ${roundWord(state.era)} on ${nextMark.label}`;

    const polishingModel = state.pendingModel?.polishing ? state.pendingModel : null;
    centre.innerHTML = `
      <div class="ctr cap"><div class="badge">${counts.capability}</div><div class="tag">Capability</div></div>
      <div class="pill${polishingModel ? ' pill-act' : ''}"${polishingModel ? ' data-act="strip" role="button" tabindex="0" aria-label="Show the polishing calendar"' : ''}>
        <div class="t"></div>
        <div class="s">${pill.status}</div>
        ${pill.progress === null ? '' : `<div class="bar"><i style="width:${Math.round(pill.progress * 100)}%"></i></div>`}
      </div>
      <div class="ctr ali"><div class="badge">${counts.alignment}</div><div class="tag">Alignment</div></div>`;
    centre.querySelector('.pill .t').textContent = pill.name; // player-typed names are text, never markup
    const flawButton = view.querySelector('.hud-flaw');
    flawButton.hidden = !showFlawBadge(polishingModel) || Boolean(state.ending);
    view.classList.toggle('has-polish-flaws', !flawButton.hidden);
    if (!flawButton.hidden) flawButton.querySelector('.badge').textContent = `${flawsLeft(polishingModel)}`;
    const polishRow = view.querySelector('.hud-polish');
    polishRow.hidden = !polishingModel || Boolean(polishingModel.hazard) || Boolean(state.ending);
    if (!polishRow.hidden) {
      polishRow.querySelector('.hud-publish').textContent = `Publish ${pill.name}`;
      const rumor = rivalRumor(state);
      const chip = polishRow.querySelector('.hud-rumor');
      chip.hidden = !rumor;
      chip.textContent = rumorText(rumor);
      chip.classList.toggle('landed', rumor?.kind === 'landed');
    }
    const labName = typeof state.labName === 'string' ? state.labName.trim() : '';
    labPlate.textContent = labName; // the name typed on the title screen, as text
    labPlate.hidden = !labName;

    info.setAttribute('aria-expanded', `${expanded}`);
    info.innerHTML = `
      <span class="full"><span class="k">Era</span> <b>${state.era}</b> <span class="k">· ${eraById(state.era).name}</span></span>
      <span class="k">Cash</span><b>${money(state.cash)}</b>
      ${flowLine(bill)}
      ${sparkline(state, game.financeHistory ?? [])}
      <span class="k">Runway</span><b>${state.cash <= 0 ? 'out of cash' : months(plannedRunway)}</b>
      <span id="lab-stats" class="info-more" ${expanded ? '' : 'hidden'}>
        <span class="k">ARR</span><b>${money(state.arr)}</b>
        <span class="k">Users</span><b>${users(totalUsers)}</b>
        <span class="k">Compute</span><b>${compute(state.compute, state.era)}</b>
        <span class="k">Capability rank</span><b>${ordinal(rank(state))} of 5</b>
        <span class="k">Valuation</span><b>${money(state.valuation)}</b>
      </span>`;

    date.innerHTML = `${MONTH_NAMES[day.m - 1]} ${day.y}<small>Week ${day.w}</small><span class="beat" role="progressbar" aria-label="${markLabel}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${beat}"><i style="width:${beat}%"></i></span>`;
    // While the game waits, the chosen speed shows as an outline, so a lit ×4 never contradicts a pause.
    for (const button of view.querySelectorAll('.clock button[data-speed]')) {
      const speed = Number(button.dataset.speed);
      const chosen = clockState.speed === speed;
      button.className = chosen ? (waiting && speed !== 0 ? 'held' : 'on') : '';
      button.setAttribute('aria-pressed', `${chosen}`);
    }
    if (mute.getAttribute('aria-pressed') !== `${sound.muted}`) { // the icon is rebuilt only when it changes, so a press on it is not lost
      mute.className = `mute${sound.muted ? ' on' : ''}`;
      mute.setAttribute('aria-pressed', `${sound.muted}`);
      mute.innerHTML = SPEAKER_ICON(sound.muted);
    }
    waitingLabel.hidden = !waiting;
    waitingLabel.textContent = waiting ? (waitWord ? `Waiting: ${waitWord}` : 'Waiting for you') : '';

    // Things placed under the clock (the Geneva deal pill) follow the column's height.
    document.documentElement.style.setProperty('--hud-under', `${column.offsetTop + column.offsetHeight + 8}px`);
    floatWeek(state);
  }

  render();
  queueMicrotask(render);
  const unsubscribeGame = game.subscribe(render);
  const unsubscribeSound = sound.subscribe(render);
  return () => {
    unsubscribeGame();
    unsubscribeSound();
    unsubscribeClock();
  };
}
