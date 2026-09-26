import { monthlyBills } from '../../sim/contracts.js';
import { projectBurn, runway } from '../../sim/economy.js';
import { PLEDGES } from '../../sim/split.js';
import {
  budgetFromSliders,
  budgetPreviewQueue,
  levelFor,
  queuedRunProblem,
  SPEND_LEVELS,
  spendFor,
} from '../logic/actions.js';
import { computeBar, idleComputeCost, opinions, pledgeAvailable, projectQueue } from '../logic/compute.js';
import { computeAmount, money, months, pct } from '../logic/format.js';
import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { vslider } from '../components/vslider.js';

export const BUDGET_SLIDERS = [
  { key: 'training', label: 'Training', short: 'Training', role: 'Research', token: 'coral' },
  { key: 'security', label: 'Security', short: 'Security', role: 'CISO', token: 'ink' },
  { key: 'product', label: 'Product and growth', short: 'Product', role: 'Product', token: 'wood' },
  { key: 'talent', label: 'Talent and research', short: 'Talent', role: 'People', token: 'teal' },
];

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function switchButton(label, detail, checked, onChange) {
  const button = element('button', `compute-toggle${checked ? ' enabled' : ''}`);
  button.type = 'button';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-checked', `${checked}`);
  button.setAttribute('aria-label', label);
  const copy = element('span');
  copy.append(element('b', '', label), element('small', '', detail));
  copy.append();
  button.append(copy, element('i', checked ? 'on' : ''));
  button.addEventListener('click', () => onChange(!button.classList.contains('enabled')));
  return button;
}

function handle({ label, value, min, max, step, leftForValue, valueText, onInput }) {
  const grip = element('button', 'compute-handle');
  grip.type = 'button';
  grip.setAttribute('role', 'slider');
  grip.setAttribute('aria-label', label);
  grip.setAttribute('aria-valuemin', `${min}`);
  grip.setAttribute('aria-valuemax', `${max}`);
  const clamp = (next) => Math.max(min, Math.min(max, next));
  const places = label === 'Serving cap' ? 1 : 0;
  let current = value;
  let dragging = false;

  function reflect(next) {
    current = Number(clamp(next).toFixed(places));
    grip.style.left = `${leftForValue(current)}%`;
    grip.setAttribute('aria-valuenow', `${Number(current.toFixed(1))}`);
    grip.setAttribute('aria-valuetext', valueText(current));
  }

  function update(next, commit) {
    reflect(next);
    onInput(current, { commit, focusLabel: label });
  }

  grip.addEventListener('keydown', (event) => {
    const delta = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step }[event.key];
    if (delta == null && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    update(event.key === 'Home' ? min : event.key === 'End' ? max : current + delta, true);
  });
  grip.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    dragging = true;
    grip.setPointerCapture(event.pointerId);
  });
  grip.addEventListener('pointermove', (event) => {
    if (!grip.hasPointerCapture(event.pointerId)) return;
    const rect = grip.parentElement.getBoundingClientRect();
    update(min + ((event.clientX - rect.left) / rect.width) * (max - min), false);
  });
  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    onInput(current, { commit: true, focusLabel: label });
  };
  grip.addEventListener('pointerup', finishDrag);
  grip.addEventListener('pointercancel', finishDrag);
  reflect(current);
  return grip;
}

function restoreFocus(root, label) {
  if (!label) return;
  const target = [...root.querySelectorAll('[aria-label]')]
    .find((control) => control.getAttribute('aria-label') === label);
  target?.focus();
}

function summaryPanel(state, values, level) {
  const root = element('div', 'budget-summary compute-budget-summary');
  const spend = spendFor(level, state.era);
  const bar = computeBar(state);
  const pledge = bar.pledgeMarker;
  const projected = structuredClone(state);
  projected.burnPlanned = projectBurn(projected);
  const rows = [
    ['Money spend', `${money(spend)}/mo`],
    ['Compute bill', `${money(monthlyBills(state))}/mo`],
    ['of which idle', `${money(idleComputeCost(state))}/mo`, 'after'],
    ['Runway (CFO)', months(runway(projected, 'planned'))],
  ];
  if (pledge) rows.push([`Pledge ${pct(pledge.share)}`, `${pledge.kept ? 'kept' : 'broken'} at ${pct(state.compute.split.safety)}`, pledge.kept ? 'kept' : 'after']);
  for (const [label, value, className = ''] of rows) {
    const row = element('div', 'budget-summary-row');
    row.append(element('span', '', label), element('b', className, value));
    root.append(row);
  }
  return root;
}

export function openBudget(game, overlayRoot) {
  const state = game.state;
  const queuedBudget = game.queue.budget ?? state.budget;
  const values = Object.fromEntries(BUDGET_SLIDERS.map(({ key }) => [key, (queuedBudget.split[key] ?? 0) * 100]));
  let level = levelFor(queuedBudget.spend, state.era);
  let split = { ...state.compute.split, ...(game.queue.computeSplit ?? {}) };
  const canPledge = pledgeAvailable(state);
  let pledge = canPledge ? game.queue.pledge ?? null : null;
  const body = element('div', 'budget-body compute-budget-body');
  const moneyBand = element('div');
  const moneyHeading = element('div', 'compute-section');
  const moneyRow = element('div', 'budget-money-row');
  const sliders = element('div', 'budget-sliders');
  const moneySide = element('div', 'budget-money-side');
  moneySide.append(element('div', 'budget-money-title', 'Spend level'));
  const spendSwitch = element('div', 'budget-spend-switch');
  spendSwitch.setAttribute('role', 'group');
  spendSwitch.setAttribute('aria-label', 'Monthly spend level');
  moneySide.append(spendSwitch, element('p', '', 'Money pays for people and programs. Safety work now runs on compute, below.'));
  moneyRow.append(sliders, moneySide);
  moneyBand.append(moneyHeading, moneyRow);
  const computeBand = element('div');
  const computeHeading = element('div', 'compute-section', 'Compute · drag the handles');
  const computeBox = element('div', 'compute-box');
  const error = element('div', 'dialog-error');
  error.setAttribute('role', 'alert');
  const team = element('div', 'budget-team');
  const right = element('div');
  body.append(moneyBand, computeBand, error);
  let opened;

  for (const item of BUDGET_SLIDERS) {
    sliders.append(vslider({
      label: item.short,
      value: values[item.key],
      min: 0,
      max: 100,
      step: 1,
      colour: item.token,
      onInput(value) { values[item.key] = value; render(); },
    }));
  }

  for (const name of Object.keys(SPEND_LEVELS)) {
    const button = element('button');
    button.type = 'button';
    button.dataset.level = name;
    button.append(element('span', '', name[0].toUpperCase() + name.slice(1)), element('b', '', `${money(spendFor(name, state.era))}/month`));
    button.addEventListener('click', () => { level = name; render(); });
    spendSwitch.append(button);
  }

  function previewState() {
    return projectQueue(state, budgetPreviewQueue(game.queue, {
      budget: budgetFromSliders(values, level, state.era),
      computeSplit: split,
      pledge,
      canPledge,
    }));
  }

  function renderCompute(projected) {
    const view = computeBar(projected);
    computeBox.replaceChildren();
    const top = element('div', 'compute-box-top');
    const online = element('div');
    online.append(element('b', '', computeAmount(view.online, projected.era)), document.createTextNode(' online'));
    top.append(online, element('span', '', `bill ${money(monthlyBills(projected))} a month, used or not`));
    const bar = element('div', 'compute-allocation-bar');
    bar.setAttribute('aria-label', 'Compute split');
    const labels = { serving: 'Serving', control: 'Control', safety: 'Safety', training: 'Training', idle: 'Idle, still billed' };
    const total = Math.max(1, view.online);
    for (const segment of view.segments) {
      const part = element('span', segment.key);
      part.style.flex = `${Math.max(segment.units, 0.0001)} 1 0%`;
      const estimatedWidth = (segment.units / total) * 730;
      if (segment.key === 'idle') {
        if (estimatedWidth >= 66) {
          part.append(element('small', 'idle-pill', `idle ${computeAmount(segment.units, projected.era)}`));
        }
      } else if (estimatedWidth >= labels[segment.key].length * 6.5 + 28) {
        part.append(element('b', '', labels[segment.key]), element('small', '', computeAmount(segment.units, projected.era)));
      }
      bar.append(part);
    }
    const servingCap = split.servingCap == null ? Math.min(view.needMarker, total) : Math.min(split.servingCap, total);
    bar.append(
      handle({
        label: 'Serving cap',
        value: servingCap,
        min: 0,
        max: total,
        step: 1,
        leftForValue: (next) => (next / total) * 100,
        valueText: (next) => computeAmount(next, projected.era),
        onInput(next, interaction) {
          split.servingCap = next;
          if (interaction.commit) render({ focusLabel: interaction.focusLabel });
        },
      }),
      handle({
        label: 'Safety share',
        value: Math.round(split.safety * 100),
        min: 0,
        max: 50,
        step: 1,
        leftForValue: (next) => ((view.segments[0].units + view.segments[1].units + total * (next / 100)) / total) * 100,
        valueText: (next) => `${Number(next.toFixed(1))} percent`,
        onInput(next, interaction) {
          split.safety = next / 100;
          if (interaction.commit) render({ focusLabel: interaction.focusLabel });
        },
      }),
    );
    const need = element('i', 'compute-marker up');
    need.style.left = `${Math.min(100, (view.needMarker / total) * 100)}%`;
    need.append(element('em', '', `users need ${computeAmount(view.needMarker, projected.era)}`));
    bar.append(need);
    if (view.pledgeMarker) {
      const marker = element('i', 'compute-marker down');
      marker.style.left = `${Math.min(100, ((view.segments[0].units + view.segments[1].units + total * view.pledgeMarker.share) / total) * 100)}%`;
      marker.append(element('em', '', `pledge ${pct(view.pledgeMarker.share)} · ${view.pledgeMarker.kept ? 'kept' : 'broken'}`));
      bar.append(marker);
    }
    const foot = element('div', 'compute-box-foot');
    const legend = element('div', 'compute-legend');
    for (const key of ['serving', 'control', 'safety', 'training', 'idle']) {
      const item = element('span');
      item.append(element('i', key), document.createTextNode(labels[key]));
      legend.append(item);
    }
    const toggles = element('div', 'compute-toggles');
    toggles.append(
      switchButton('Cover shortfalls with spot', 'rent at today’s spot price when serving runs short', split.coverWithSpot, (checked) => { split.coverWithSpot = checked; render({ focusLabel: 'Cover shortfalls with spot' }); }),
      switchButton('Resell idle compute', 'recover part of the cost of idle units', split.resellIdle, (checked) => { split.resellIdle = checked; render({ focusLabel: 'Resell idle compute' }); }),
    );
    foot.append(legend, toggles);
    computeBox.append(top, bar, foot);

    if (canPledge) {
      const pledgeRow = element('div', 'pledge-row');
      pledgeRow.append(element('span', '', 'Make a public pledge'));
      const choices = element('div', 'compute-segmented');
      for (const share of PLEDGES) {
        const button = element('button', pledge === share ? 'selected' : '', pct(share));
        button.type = 'button';
        button.setAttribute('aria-label', `Pledge ${pct(share)}`);
        button.setAttribute('aria-pressed', `${pledge === share}`);
        button.addEventListener('click', () => {
          pledge = share;
          render({ focusLabel: `Pledge ${pct(share)}` });
        });
        choices.append(button);
      }
      pledgeRow.append(choices);
      computeBox.append(pledgeRow);
    }
  }

  function render({ focusLabel } = {}) {
    error.textContent = '';
    moneyHeading.textContent = `Money · ${money(spendFor(level, state.era))} a month`;
    for (const button of spendSwitch.querySelectorAll('button')) {
      const active = button.dataset.level === level;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', `${active}`);
    }
    const projected = previewState();
    computeBand.replaceChildren(computeHeading, computeBox);
    renderCompute(projected);
    const nextTeam = teamPanel(projected, { opinions: opinions(projected, 'budget') });
    team.replaceChildren(...nextTeam.children);
    right.replaceChildren(summaryPanel(projected, values, level));
    restoreFocus(body, focusLabel);
  }

  opened = openDialog(overlayRoot, {
    title: "Plan this turn's budget",
    subtitle: `Era ${state.era} · money for people and programs, compute for everything that runs`,
    left: { title: 'Team', content: team },
    right: { title: 'This turn', content: right },
    body,
    onOk() {
      const budget = budgetFromSliders(values, level, state.era);
      const candidateQueue = budgetPreviewQueue(game.queue, {
        budget,
        computeSplit: split,
        pledge,
        canPledge,
      });
      const problem = queuedRunProblem(game.state, candidateQueue);
      if (problem) {
        const message = problem[0].toUpperCase() + problem.slice(1);
        error.textContent = `Your queued training run would no longer work: ${message}. Change the run first.`;
        return;
      }
      const result = game.setBudget(budget);
      if (!result.ok) {
        error.textContent = result.error ?? 'The budget could not be saved.';
        return;
      }
      game.setField('computeSplit', split);
      if (pledge && canPledge) game.setField('pledge', pledge);
      opened.close();
    },
  });
  opened.classList.add('company-dialog', 'company-dialog-budget');
  const footer = element('div', 'company-footer budget-dialog-footer');
  footer.append(
    element('div', 'company-footer-note', 'Budget changes are free · they apply from this turn'),
    opened.querySelector('.dialog-ok'),
  );
  opened.querySelector('.dialog-body').append(footer);
  render();
  return opened;
}
