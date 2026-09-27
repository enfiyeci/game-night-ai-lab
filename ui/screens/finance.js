// The finance planner (owner pick 2026-09-26: mockups A and B of K2-finance-plan.html, as two views of one screen).
// Timeline: compute, money each month and cash on one turn axis, with a draggable goal per era. The books: the
// same plan as an era-by-era ledger next to the actual history. Goals and rounds are a plan only; they queue no move.
// The one exception is "Promise it to the board": keeping the plan with it switched on makes the board promise at once.
import { ERAS } from '../../sim/data/eras.js';
import { roundWord } from '../../sim/time.js';
import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { registerMenuHandler } from '../menu.js';
import { computeAmount, money } from '../logic/format.js';

// Compute is shown in the unit of the era the player is in: later eras' power units would hint at what is to come.
const amountNow = (state, units, era) => computeAmount(units, Math.min(era, state.era));
import {
  LAST_TURN, UNIT_PRICE, boardPromiseOffer, byEra, defaultPlan, eraEndWords, eraLabel, eraOfTurn, eraStart, eraTitle, futureEras, monthOfTurn,
  planOpinions, project,
  raiseAllowed, roundEras, setGoal,
} from '../logic/finance.js';

const MAX_GOAL = 1800;
const stepFor = (era) => (era >= 4 ? 30 : 10);
const perMonth = (m) => `${money(m)}/mo`;
const signedMoney = (m) => (m >= 0 ? `+${money(m)}` : money(m));
const unitPrice = `$${UNIT_PRICE.toFixed(2)}M`;
// Axis tops that split into round halves and quarters.
const niceCeil = (v) => {
  const step = 10 ** Math.floor(Math.log10(Math.max(1, v)));
  return [1, 2, 4, 8, 10].map((k) => k * step).find((c) => c >= v);
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const text = (x, y, s, style = '', anchor = 'start') => `<text x="${x}" y="${y}" text-anchor="${anchor}" style="font-size:10.5px;font-weight:700;fill:color-mix(in oklab, var(--ink) 58%, var(--paper));${style}">${s}</text>`;
const hatch = (id, token) => `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:color-mix(in oklab, var(${token}) 22%, var(--paper))"/><rect width="3" height="6" style="fill:var(${token})"/></pattern>`;

function verdict(p, state) {
  if (!p.runsOut) return { good: true, text: `Cash lasts the run. You end with about ${money(p.end)}.` };
  return { good: false, text: `Cash runs out in month ${Math.floor(p.runsOut.atMonth)}${p.runsOut.era <= state.era ? ` (era ${p.runsOut.era})` : ''}. You end ${money(-p.end)} short.` };
}

// A saved plan keeps only the eras still ahead; eras it never set start at today's compute.
function currentPlan(game) {
  const fresh = defaultPlan(game.state);
  const saved = game.financePlan;
  if (!saved) return fresh;
  const eras = futureEras(game.state);
  const goals = Object.fromEntries(eras.map((era) => [era, saved.goals?.[era] ?? fresh.goals[era]]));
  const raises = Object.fromEntries(roundEras(game.state).filter((era) => saved.raises?.[era]).map((era) => [era, true]));
  return { goals, raises };
}

export function openFinance(game, overlayRoot, { view = 'timeline' } = {}) {
  const state = game.state;
  const eras = futureEras(state);
  const rounds = roundEras(state);
  let plan = currentPlan(game);
  let promising = !!game.queue.boardPromise;
  let opened;
  let draw = () => {};
  let dragScale = null; // the compute axis holds still while a goal is dragged
  let lastMaxC = 800;

  const render = () => {
    const key = document.activeElement?.dataset?.focus;
    draw();
    if (key) opened?.querySelector(`[data-focus="${key}"]`)?.focus();
  };
  const changeGoal = (era, units) => {
    plan = setGoal(plan, era, Math.min(MAX_GOAL, Math.round(units / stepFor(era)) * stepFor(era)), eras);
    render();
  };
  const keep = () => {
    game.setFinancePlan(plan);
    const offer = boardPromiseOffer(state, plan);
    game.setField('boardPromise', promising && offer ? offer : undefined);
    opened.close();
  };

  function stepper(era) {
    const root = element('span', 'finance-step');
    const down = element('button', '', '−');
    down.type = 'button';
    down.dataset.focus = `down-${era}`;
    down.setAttribute('aria-label', `Lower the goal ${eraLabel(state, era).replace(/^From/, 'from').replace(/^Era/, 'for era')}`);
    down.addEventListener('click', () => changeGoal(era, plan.goals[era] - stepFor(era)));
    const value = element('output', 'finance-step-value', amountNow(state, plan.goals[era], era));
    value.setAttribute('aria-live', 'polite');
    const up = element('button', '', '+');
    up.type = 'button';
    up.dataset.focus = `up-${era}`;
    up.setAttribute('aria-label', `Raise the goal ${eraLabel(state, era).replace(/^From/, 'from').replace(/^Era/, 'for era')}`);
    up.addEventListener('click', () => changeGoal(era, plan.goals[era] + stepFor(era)));
    root.append(down, value, up);
    return root;
  }

  function raiseToggle(era, round, compact = false) {
    const allowed = raiseAllowed(state, era);
    const on = allowed && !!plan.raises[era];
    const button = element('button', 'compute-toggle finance-raise');
    button.type = 'button';
    button.dataset.focus = `raise-${era}`;
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-checked', `${on}`);
    button.disabled = !allowed;
    const words = element('span');
    words.append(
      element('b', '', compact ? `Raise about ${money(round)}` : `Raise a round${era === state.era ? ' this era' : ` ${eraLabel(state, era).replace(/^From/, 'from')}`}`),
      element('small', '', !allowed ? 'Already raised this era' : compact ? 'growth fund round' : `about ${money(round)} from a growth fund`),
    );
    const pill = element('i', on ? 'on' : '');
    button.append(words, pill);
    button.addEventListener('click', () => {
      plan = { ...plan, raises: { ...plan.raises, [era]: !plan.raises[era] } };
      render();
    });
    return button;
  }

  // Promises the nearest era's goal, so the number follows the goal as it is dragged. An open promise is shown as a
  // plain line at full strength rather than a greyed switch, since it says what the player owes the board.
  function promiseToggle() {
    const open = state.boardPromise?.status === 'open' ? state.boardPromise : null;
    if (open) {
      const row = element('div', 'compute-toggle finance-promised');
      const words = element('span');
      words.append(element('b', '', 'Promised to the board'), element('small', '', `${amountNow(state, open.units, open.era)} by ${eraEndWords(state, open.era)}`));
      row.append(words);
      return row;
    }
    const offer = boardPromiseOffer(state, plan);
    const on = !!offer && promising;
    const button = element('button', 'compute-toggle finance-raise');
    button.type = 'button';
    button.dataset.focus = 'promise';
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-checked', `${on}`);
    button.disabled = !offer;
    const words = element('span');
    words.append(
      element('b', '', 'Promise it to the board'),
      element('small', '', offer ? `${amountNow(state, offer.units, offer.era)} by ${eraEndWords(state, offer.era)}` : 'Set a goal above zero first'),
    );
    button.append(words, element('i', on ? 'on' : ''));
    button.addEventListener('click', () => {
      promising = !promising;
      render();
    });
    return button;
  }

  function goalRows(root) {
    for (const era of eras) {
      const row = element('div', 'finance-goal');
      // A later era shows only its first clock date (owner rule: it is not named yet).
      const label = element('span', '', eraTitle(state, era) ? eraLabel(state, era) : eraLabel(state, era).replace(/^From /, ''));
      label.append(element('small', '', eraTitle(state, era) || 'onwards'));
      row.append(label, stepper(era));
      root.append(row);
    }
  }

  // Goal handles: the chart keeps pointer capture because its SVG is redrawn on every move.
  function dragGoals(container, unitsAt) {
    let era = null;
    container.addEventListener('pointerdown', (event) => {
      const handle = event.target.closest('[data-era]');
      if (!handle) return;
      era = Number(handle.dataset.era);
      dragScale = lastMaxC;
      container.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    container.addEventListener('pointermove', (event) => {
      if (era == null) return;
      const svg = container.querySelector('svg');
      const rect = svg.getBoundingClientRect();
      changeGoal(era, unitsAt((event.clientY - rect.top) * (svg.viewBox.baseVal.height / rect.height)));
    });
    const end = () => {
      era = null;
      dragScale = null;
      render();
    };
    container.addEventListener('pointerup', end);
    container.addEventListener('pointercancel', end);
    container.addEventListener('keydown', (event) => {
      const handle = event.target.closest('[data-era]');
      const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
      if (!handle || !step) return;
      event.preventDefault();
      const k = Number(handle.dataset.era);
      changeGoal(k, plan.goals[k] + step * stepFor(k));
    });
  }

  function showTimeline() {
    const history = game.financeHistory;
    const W = 788, padL = 62, padR = 10;
    const x = (turn) => padL + (turn / (LAST_TURN + 1)) * (W - padL - padR);
    const bw = (W - padL - padR) / (LAST_TURN + 1);
    const hC = 150, hM = 132, hK = 104, gap = 26, top = 22;
    const H = top + hC + gap + hM + gap + hK + 34;
    let maxC = 800;
    const yC = (u) => top + hC - (u / maxC) * hC;

    const charts = element('div', 'finance-charts');
    dragGoals(charts, (py) => ((top + hC - py) / hC) * maxC);
    const key = element('div', 'finance-key');
    for (const [swatch, label] of [
      ['signed', 'Compute you signed'], ['planned', 'In the plan, not signed yet'], ['bill', 'Compute bill'],
      ['running', 'People and running costs'], ['revenue', 'Revenue'], ['grown', 'If users keep growing'],
    ]) {
      const item = element('span');
      item.append(element('i', `finance-swatch ${swatch}`), document.createTextNode(label));
      key.append(item);
    }
    const note = element('p', 'finance-note', `Revenue is held at today's level; the dotted line grows today's users at the game's own rate, with no new releases. Compute bills are after cloud credits, and today's spot cover and idle resale are held at today's level. Compute you haven't signed is billed at the base price, ${unitPrice} a unit each month, from next ${roundWord(state.era)}; a letter of intent counts only the 30% it is sure to deliver. Rounds raise at today's valuation.`);
    const body = element('div', 'finance-timeline-body');
    body.append(charts, key, note);
    const team = element('div');
    const panel = element('div', 'finance-plan');

    opened = openDialog(overlayRoot, {
      title: 'Plan the years ahead',
      subtitle: `Era ${state.era} · month ${state.monthsElapsed} · compute goals and what they cost each month`,
      left: { title: 'Team', content: team },
      right: { title: 'This plan', content: panel },
      body,
      backLabel: 'The books',
      okLabel: 'Keep this plan',
      onBack: showBooks,
      onOk: keep,
    });
    opened.classList.add('finance-timeline');

    draw = () => {
      const p = project(state, plan);
      const past = history.map((r) => ({ ...r, signed: r.online, planned: 0, signedBill: r.computeBill, planBill: 0, past: true }));
      const rows = [...past, ...p.rows];
      maxC = dragScale ?? niceCeil(Math.max(160, ...rows.map((r) => r.signed + r.planned), ...Object.values(plan.goals)) * 1.12);
      lastMaxC = maxC;
      const tM = top + hC + gap, tK = tM + hM + gap;
      const maxM = niceCeil(Math.max(100, ...rows.map((r) => Math.max(0, r.signedBill) + r.planBill + r.people + r.ops), ...rows.map((r) => r.grownRevenue ?? r.revenue)) * 1.08);
      // A net compute bill below zero (cloud credits plus idle resale) is income: it is drawn below the zero line.
      const lowM = Math.min(0, ...rows.map((r) => r.signedBill));
      const yM = (v) => tM + hM - ((v - lowM) / (maxM - lowM)) * hM;
      const cashes = rows.flatMap((r) => [r.cashStart + r.raised, r.cashEnd]);
      const lo = Math.min(0, ...cashes), hi = Math.max(1, ...cashes);
      const yK = (v) => tK + hK - ((v - lo) / (hi - lo)) * hK;
      let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Compute, money each month and cash from the start of the run to its end"><defs>${hatch('finance-plan-hatch', '--sky')}${hatch('finance-bill-hatch', '--coral')}</defs>`;
      ERAS.forEach((era, i) => {
        const x0 = x(eraStart(era.id)), x1 = x(eraStart(era.id) + era.turns);
        s += `<rect x="${x0}" y="${top - 18}" width="${x1 - x0}" height="${H - top - 2}" style="fill:${i % 2 ? 'color-mix(in oklab, var(--cream) 45%, var(--paper))' : 'var(--paper)'}"/>`;
        s += text(x0 + 5, top - 6, eraLabel(state, era.id).toUpperCase(), 'font-weight:900;font-size:10px;letter-spacing:.06em');
      });
      const tickC = maxC / 4;
      for (let v = 0; v < maxC; v += tickC) {
        s += `<line x1="${padL}" x2="${W - padR}" y1="${yC(v)}" y2="${yC(v)}" style="stroke:color-mix(in oklab, var(--ink) ${v ? 7 : 25}%, transparent)"/>`;
        s += text(padL - 6, yC(v) + 3.5, v ? `${Math.round(v)} u` : '0', '', 'end');
      }
      s += text(padL - 6, top - 6, 'COMPUTE', 'font-weight:900;font-size:10px;letter-spacing:.06em;fill:var(--ink)', 'end');
      for (const r of rows) {
        const x0 = x(r.turn) + 1.5, w = bw - 3;
        s += `<rect x="${x0}" y="${yC(r.signed)}" width="${w}" height="${yC(0) - yC(r.signed)}" style="fill:${r.past ? 'color-mix(in oklab, var(--sky) 55%, var(--paper))' : 'var(--sky)'}"/>`;
        if (r.planned) s += `<rect x="${x0}" y="${yC(r.signed + r.planned)}" width="${w}" height="${yC(r.signed) - yC(r.signed + r.planned)}" style="fill:url(#finance-plan-hatch)"/>`;
      }
      // Labels sit left of the Now line over the past, or right of it at the start of a run, clear of the bars.
      const early = x(state.turn) - padL < 150;
      const labelX = early ? x(state.turn) + 6 : x(state.turn) - 6;
      const labelAnchor = early ? 'start' : 'end';
      const pastSigned = Math.max(state.compute.online, ...past.map((r) => r.signed));
      // At the start of a run the label sits right of Now, under the first goal pill, so it goes above that pill.
      const firstGoalY = early && eras.length ? yC(Math.min(plan.goals[eras[0]], maxC)) - 16 : Infinity;
      s += text(labelX, Math.min(yC(0) - 16, yC(pastSigned) - 6, firstGoalY), `${state.compute.online} units signed`, 'fill:color-mix(in oklab, var(--sky) 70%, var(--ink));font-weight:900', labelAnchor);
      for (const era of eras) {
        const t0 = Math.max(state.turn + 1, eraStart(era)), t1 = eraStart(era) + ERAS[era - 1].turns;
        if (t0 >= t1) continue;
        const gy = yC(Math.min(plan.goals[era], maxC)), cx = (x(t0) + x(t1)) / 2;
        const label = amountNow(state, plan.goals[era], era);
        s += `<line x1="${x(t0)}" x2="${x(t1)}" y1="${gy}" y2="${gy}" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:5 4"/>`;
        s += `<g class="finance-goal-handle" data-era="${era}" data-focus="handle-${era}" tabindex="0" role="slider" aria-label="${eraLabel(state, era)} compute goal" aria-valuemin="0" aria-valuemax="${MAX_GOAL}" aria-valuenow="${plan.goals[era]}" aria-valuetext="${label}">
          <rect x="${cx - 38}" y="${gy - 11}" width="76" height="22" rx="11" style="fill:var(--ink)"/>
          <text x="${cx}" y="${gy + 4}" text-anchor="middle" style="font-size:11px;font-weight:900;fill:var(--paper)">${label}</text></g>`;
      }
      if (lowM < 0) s += text(padL - 6, yM(lowM) + 3.5, `+${money(-lowM)}`, 'fill:color-mix(in oklab, var(--teal) 78%, var(--ink))', 'end');
      for (let v = 0; v < maxM * 0.95; v += maxM / 2) {
        s += `<line x1="${padL}" x2="${W - padR}" y1="${yM(v)}" y2="${yM(v)}" style="stroke:color-mix(in oklab, var(--ink) ${v ? 7 : 25}%, transparent)"/>`;
        s += text(padL - 6, yM(v) + 3.5, v ? money(v) : '0', '', 'end');
      }
      s += text(padL - 6, tM - 6, 'EACH MONTH', 'font-weight:900;font-size:10px;letter-spacing:.06em;fill:var(--ink)', 'end');
      for (const r of rows) {
        const x0 = x(r.turn) + 4, w = bw - 8;
        let y0 = yM(0);
        const seg = (v, fill) => {
          if (v <= 0) return;
          const h = yM(0) - yM(v);
          s += `<rect x="${x0}" y="${y0 - h}" width="${w}" height="${h}" style="fill:${fill}"/>`;
          y0 -= h;
        };
        seg(r.people + r.ops, `color-mix(in oklab, var(--wood) ${r.past ? 45 : 70}%, var(--paper))`);
        seg(r.signedBill, r.past ? 'color-mix(in oklab, var(--coral) 55%, var(--paper))' : 'var(--coral)');
        if (r.signedBill < 0) s += `<rect x="${x0}" y="${yM(0)}" width="${w}" height="${yM(r.signedBill) - yM(0)}" style="fill:color-mix(in oklab, var(--teal) ${r.past ? 35 : 55}%, var(--paper))"/>`;
        seg(r.planBill, 'url(#finance-bill-hatch)');
      }
      s += `<path d="${rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.turn)} ${yM(r.revenue)} H${x(r.turn + 1)}`).join(' ')}" style="fill:none;stroke:var(--teal);stroke-width:3"/>`;
      s += `<path d="${p.rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.turn)} ${yM(r.grownRevenue)} H${x(r.turn + 1)}`).join(' ')}" style="fill:none;stroke:var(--teal);stroke-width:2;stroke-dasharray:2 4"/>`;
      const pastTop = Math.max(0, ...past.map((r) => r.signedBill + r.people + r.ops));
      s += text(labelX, Math.min(yM(0) - 24, yM(Math.max(pastTop, p.rows[0].burn)) - 6), `Revenue ${perMonth(p.rows[0].revenue)}`, 'fill:color-mix(in oklab, var(--teal) 78%, var(--ink));font-weight:900', labelAnchor);
      s += text(padL - 6, tK - 6, 'CASH', 'font-weight:900;font-size:10px;letter-spacing:.06em;fill:var(--ink)', 'end');
      if (lo < 0) s += `<rect x="${padL}" y="${yK(0)}" width="${W - padL - padR}" height="${tK + hK - yK(0)}" style="fill:color-mix(in oklab, var(--coral) 10%, transparent)"/>`;
      s += `<line x1="${padL}" x2="${W - padR}" y1="${yK(0)}" y2="${yK(0)}" style="stroke:color-mix(in oklab, var(--ink) 35%, transparent)"/>` + text(padL - 6, yK(0) + 3.5, '$0', '', 'end');
      s += text(padL - 6, yK(hi) + 14, money(hi), '', 'end');
      if (lo < 0) s += text(padL - 6, yK(lo) + 3.5, money(lo), 'fill:color-mix(in oklab, var(--coral) 78%, var(--ink))', 'end');
      const cashPath = (rs) => rs.map((r, i) => `${i ? 'L' : 'M'}${x(r.turn)} ${yK(r.cashStart + r.raised)} L${x(r.turn + 1)} ${yK(r.cashEnd)}`).join(' ');
      if (past.length) s += `<path d="${cashPath(past)}" style="fill:none;stroke:var(--ink);stroke-width:2.5"/>`;
      s += `<path d="${cashPath(p.rows)}" style="fill:none;stroke:var(--ink);stroke-width:2.5;stroke-dasharray:6 4"/>`;
      for (const r of rows.filter((q) => q.raised > 0)) {
        s += `<line x1="${x(r.turn)}" x2="${x(r.turn)}" y1="${yK(r.cashStart)}" y2="${yK(r.cashStart + r.raised)}" style="stroke:var(--teal);stroke-width:3"/>`;
        s += text(x(r.turn) + 5, yK(r.cashStart + r.raised) + 11, `+${money(r.raised)}`, 'fill:color-mix(in oklab, var(--teal) 78%, var(--ink));font-weight:900');
      }
      if (p.runsOut) {
        const rx = x(p.runsOut.turn + (p.runsOut.atMonth - p.runsOut.month) / p.runsOut.months);
        s += `<circle cx="${rx}" cy="${yK(0)}" r="5" style="fill:var(--coral)"/>`;
        s += text(Math.min(rx + 8, W - 150), yK(0) - 7, `Runs out · month ${Math.floor(p.runsOut.atMonth)}`, 'fill:color-mix(in oklab, var(--coral) 78%, var(--ink));font-weight:900;font-size:11.5px');
      }
      s += `<line x1="${x(state.turn)}" x2="${x(state.turn)}" y1="${top - 18}" y2="${tK + hK + 6}" style="stroke:var(--ink);stroke-width:1.5"/>` + text(x(state.turn) + 5, top + 10, 'Now', 'fill:var(--ink);font-weight:900;font-size:11px');
      const axisY = tK + hK + 20;
      for (const m of [0, 12, 24]) {
        const t = Array.from({ length: LAST_TURN + 1 }, (_, i) => i).find((i) => monthOfTurn(i) === m);
        if (t == null) continue;
        s += text(x(t), axisY, `Year ${m / 12 + 1}`, 'fill:var(--ink);font-weight:900') + text(x(t), axisY + 12, `month ${m}`);
      }
      s += text(x(LAST_TURN + 1), axisY, `month ${monthOfTurn(LAST_TURN + 1)}`, '', 'end');
      s += '</svg>';
      charts.innerHTML = s;
      key.querySelector('.finance-key-income')?.remove();
      if (lowM < 0) {
        const item = element('span', 'finance-key-income');
        item.append(element('i', 'finance-swatch income'), document.createTextNode('Compute income (credits and resale), below zero'));
        key.append(item);
      }

      team.replaceChildren(teamPanel(state, { opinions: planOpinions(state, p, plan) }));
      const summary = byEra(p.rows);
      const last = summary.at(-1);
      if (eras.length === 0) {
        panel.replaceChildren(element('p', 'finance-note', `This is the last ${roundWord(state.era)}, so no new compute can arrive.`));
      } else {
        panel.replaceChildren(element('h4', '', 'Compute goal'));
        goalRows(panel);
        panel.append(element('h4', '', 'The board'), promiseToggle());
      }
      if (rounds.length) {
        panel.append(element('h4', '', 'Paying for it'));
        for (const era of rounds) panel.append(raiseToggle(era, p.round));
      }
      const sums = element('div', 'finance-sums');
      for (const [label, value, cls] of [
        ['Revenue today', perMonth(p.rows[0].revenue), 'in'],
        [last.era <= state.era ? `Spending, era ${last.era}` : 'Spending at the end', perMonth(last.burn), 'out'],
        ['Lowest cash', money(p.lowest), p.lowest < 0 ? 'out' : ''],
      ]) {
        const row = element('div');
        row.append(element('span', '', label), element('b', cls, value));
        sums.append(row);
      }
      const v = verdict(p, state);
      panel.append(sums, element('div', `finance-verdict ${v.good ? 'good' : 'bad'}`, v.text));
    };
    render();
  }

  function showBooks() {
    const history = game.financeHistory;
    const body = element('div', 'finance-books-body');
    opened = openDialog(overlayRoot, {
      title: 'The books, era by era',
      subtitle: 'What happened, then the plan · every figure a monthly average unless it says otherwise',
      body,
      backLabel: 'Timeline',
      okLabel: 'Keep this plan',
      onBack: showTimeline,
      onOk: keep,
    });
    opened.classList.add('finance-books');
    const actual = byEra(history.filter((r) => r.era < state.era), { actual: true });

    draw = () => {
      const p = project(state, plan);
      const cols = [...actual, ...byEra(p.rows)];
      const maxMonth = Math.max(1, ...cols.map((c) => Math.max(c.revenue, c.burn)));
      const maxCash = Math.max(1, ...cols.map((c) => Math.abs(c.cashEnd)));
      const maxUnits = Math.max(1, ...cols.map((c) => c.computeEnd));
      const bar = (value, max, cls) => {
        const cell = element('div', 'finance-cell');
        const track = element('div', 'finance-bar');
        const fill = element('i', cls);
        fill.style.width = `${Math.min(100, (Math.abs(value) / max) * 100)}%`;
        track.append(fill);
        return [cell, track];
      };
      const cellWith = (value, max, cls, label) => {
        const [cell, track] = bar(value, max, cls);
        cell.append(track, element('b', '', label));
        return cell;
      };
      const plain = (label, cls = '') => {
        const cell = element('div', 'finance-cell');
        cell.append(element('span'), element('b', cls, label));
        return cell;
      };
      const dash = () => element('span', 'finance-muted', '—');

      const table = element('table', 'finance-table');
      const colgroup = element('colgroup');
      colgroup.append(element('col', 'finance-label-col'), ...cols.map(() => element('col')));
      const head = element('tr');
      head.append(element('th'));
      for (const c of cols) {
        const th = element('th', c.actual ? '' : 'plan');
        const month = c.actual ? history.find((r) => r.era === c.era)?.month ?? 0 : p.rows.find((r) => r.era === c.era).month;
        th.append(
          element('small', '', `Year ${Math.floor(month / 12) + 1}${c.era <= state.era ? ` · Era ${c.era}` : ''}${c.era === state.era ? ' · now' : ''}`),
          document.createTextNode(eraTitle(state, c.era) || eraLabel(state, c.era)),
          element('br'),
          element('span', `finance-tag ${c.actual ? 'actual' : 'plan'}`, `${c.actual ? 'actual' : 'plan'} · ${c.months} mo${!c.actual && c.era === state.era && state.turnInEra > 0 ? ' left' : ''}`),
        );
        head.append(th);
      }
      const thead = element('thead');
      thead.append(head);
      const tbody = element('tbody');
      const row = (label, make, cls = '') => {
        const tr = element('tr', cls);
        tr.append(element('td', '', label));
        for (const c of cols) {
          const td = element('td', c.actual ? '' : 'plan');
          const content = make(c);
          if (content) td.append(content);
          tr.append(td);
        }
        tbody.append(tr);
      };
      const section = (label) => row(label, () => null, 'finance-section');
      section('Compute');
      row('Online at the end of the era', (c) => cellWith(c.computeEnd, maxUnits, c.actual ? 'past-sky' : 'sky', amountNow(state, c.computeEnd, c.era)));
      row('Goal', (c) => (!c.actual && eras.includes(c.era) ? stepper(c.era) : dash()));
      section('Each month');
      row('Revenue', (c) => cellWith(c.revenue, maxMonth, 'teal', money(c.revenue)));
      row('Compute you signed', (c) => cellWith(c.signedBill, maxMonth, 'coral', money(-c.signedBill)));
      row('Compute in the plan', (c) => (c.actual ? dash() : cellWith(c.planBill, maxMonth, 'coral-hatch', money(-c.planBill))));
      row('People and programs', (c) => cellWith(c.people, maxMonth, 'wood', money(-c.people)));
      row('Running the lab', (c) => cellWith(c.ops, maxMonth, 'wood', money(-c.ops)));
      row('Net each month', (c) => plain(signedMoney(c.revenue - c.burn), c.revenue - c.burn < 0 ? 'out' : 'in'), 'finance-total');
      section('Over the whole era');
      row('Training runs and one-off costs', (c) => (c.actual ? plain(money(c.oneOffs)) : element('span', 'finance-muted', 'not planned')));
      row('Money raised', (c) => {
        if (c.actual) return plain(c.raised ? signedMoney(c.raised) : '—', c.raised ? 'in' : '');
        if (c.era < 2) return element('span', 'finance-muted', 'no rounds yet');
        if (!rounds.includes(c.era)) return dash();
        const toggle = raiseToggle(c.era, p.round, true);
        toggle.classList.add('finance-raise-compact');
        return toggle;
      });
      row('Cash at the end of the era', (c) => {
        const cell = element('div', 'finance-cell');
        const track = element('div', 'finance-bar diverging');
        const fill = element('i', c.cashEnd < 0 ? 'neg' : 'pos');
        fill.style.width = `${(Math.abs(c.cashEnd) / maxCash) * 50}%`;
        track.append(fill);
        cell.append(track, element('b', c.cashEnd < 0 ? 'out' : '', money(c.cashEnd)));
        return cell;
      }, 'finance-total');
      table.append(colgroup, thead, tbody);
      const v = verdict(p, state);
      const foot = element('p', 'finance-note', `Plan columns hold revenue at today's ${perMonth(p.rows[0].revenue)}, bill unsigned compute at ${unitPrice} a unit each month, and raise rounds at today's valuation. `);
      foot.append(element('b', v.good ? 'in' : 'out', v.text));
      body.replaceChildren(table, foot);
    };
    render();
  }

  if (view === 'books') showBooks();
  else showTimeline();
  return opened;
}

export function mountFinance(game, overlayRoot) {
  return registerMenuHandler('finance', () => openFinance(game, overlayRoot));
}
