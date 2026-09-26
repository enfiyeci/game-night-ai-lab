import { budgetFromSliders, levelFor, normaliseSplit, SPEND_LEVELS, spendFor } from '../logic/actions.js';
import { money, months } from '../logic/format.js';
import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { vslider } from '../components/vslider.js';

export const BUDGET_SLIDERS = [
  { key: 'training', label: 'Training', short: 'Training', token: 'coral' },
  { key: 'security', label: 'Security', short: 'Security', token: 'ink' },
  { key: 'product', label: 'Product and growth', short: 'Product', token: 'wood' },
  { key: 'talent', label: 'Talent and research', short: 'Talent', token: 'teal' },
];

function allocationBar(values) {
  const split = normaliseSplit(values);
  const root = document.createElement('div');
  root.className = 'budget-allocation';
  const label = document.createElement('div');
  label.className = 'budget-allocation-label';
  label.textContent = 'Time allocation (preview)';
  const bar = document.createElement('div');
  bar.className = 'budget-allocation-bar';
  const breakdown = BUDGET_SLIDERS.map(({ key, label: name }) => `${name}: ${Math.round(split[key] * 100)}%`).join(' · ');
  bar.title = breakdown;
  bar.setAttribute('aria-label', breakdown);

  for (const item of BUDGET_SLIDERS) {
    const share = split[item.key];
    const segment = document.createElement('span');
    segment.style.flex = `${share} 1 0%`;
    segment.style.background = `var(--${item.token})`;
    segment.title = `${item.label}: ${Math.round(share * 100)}%`;
    const text = item.short ?? item.label;
    if (share * 590 >= text.length * 6.2 + 12) segment.textContent = text;
    bar.append(segment);
  }
  root.append(label, bar);
  return root;
}

function thisTurnPanel(state, values, level) {
  const split = normaliseSplit(values);
  const spend = spendFor(level, state.era);
  const root = document.createElement('div');
  root.className = 'budget-summary';

  const total = document.createElement('div');
  total.className = 'budget-summary-total';
  total.innerHTML = '<span>Spend per month</span>';
  const totalValue = document.createElement('b');
  totalValue.textContent = money(spend);
  total.append(totalValue);
  root.append(total);

  const lines = document.createElement('div');
  lines.className = 'budget-summary-lines';
  for (const item of BUDGET_SLIDERS) {
    const row = document.createElement('div');
    const name = document.createElement('span');
    name.textContent = item.label;
    const amount = document.createElement('b');
    amount.textContent = money(spend * split[item.key]);
    row.append(name, amount);
    lines.append(row);
  }
  root.append(lines);

  const runway = document.createElement('p');
  runway.className = 'budget-runway';
  const cfo = (state.lastBriefing ?? []).find((reading) => reading.id === 'cfo');
  runway.textContent = cfo
    ? `Your CFO reads ${months(cfo.estimate)} of runway.`
    : 'Your CFO reports after the first turn.';
  root.append(runway);
  return root;
}

export function openBudget(game, overlayRoot) {
  const state = game.state;
  const queued = game.queue.budget ?? state.budget;
  const values = Object.fromEntries(BUDGET_SLIDERS.map(({ key }) => [key, (queued.split[key] ?? 0) * 100]));
  let level = levelFor(queued.spend, state.era);

  const body = document.createElement('div');
  body.className = 'budget-body';
  const sliders = document.createElement('div');
  sliders.className = 'budget-sliders';
  const controls = document.createElement('div');
  controls.className = 'budget-controls';
  const switchLabel = document.createElement('div');
  switchLabel.className = 'budget-switch-label';
  switchLabel.textContent = 'Monthly spend';
  const spendSwitch = document.createElement('div');
  spendSwitch.className = 'budget-spend-switch';
  spendSwitch.setAttribute('role', 'group');
  spendSwitch.setAttribute('aria-label', 'Monthly spend level');
  const preview = document.createElement('div');
  const error = document.createElement('div');
  error.className = 'dialog-error';
  error.setAttribute('role', 'alert');

  let rightContent;
  function renderPreview() {
    preview.replaceChildren(allocationBar(values));
    rightContent.replaceChildren(thisTurnPanel(state, values, level));
    for (const button of spendSwitch.querySelectorAll('button')) {
      button.classList.toggle('selected', button.dataset.level === level);
      button.setAttribute('aria-pressed', `${button.dataset.level === level}`);
    }
  }

  for (const item of BUDGET_SLIDERS) {
    sliders.append(vslider({
      label: item.label,
      value: values[item.key],
      min: 0,
      max: 100,
      step: 1,
      colour: item.token,
      onInput(value) {
        values[item.key] = value;
        renderPreview();
      },
    }));
  }

  for (const name of Object.keys(SPEND_LEVELS)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.level = name;
    button.innerHTML = `<span>${name[0].toUpperCase()}${name.slice(1)}</span><b>${money(spendFor(name, state.era))}/month</b>`;
    button.addEventListener('click', () => {
      level = name;
      renderPreview();
    });
    spendSwitch.append(button);
  }

  controls.append(switchLabel, spendSwitch);
  body.append(sliders, controls, preview, error);

  rightContent = document.createElement('div');
  let opened;
  opened = openDialog(overlayRoot, {
    title: "Plan this turn's budget",
    subtitle: `Era ${state.era} · Turn ${state.turn}`,
    left: { title: 'Team', content: teamPanel(state) },
    right: { title: 'This turn', content: rightContent },
    body,
    onOk() {
      const result = game.setBudget(budgetFromSliders(values, level, state.era));
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The budget could not be saved.';
    },
  });
  renderPreview();
  return opened;
}
