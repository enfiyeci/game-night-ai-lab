import { LEVEL_SHORT, LEVELS, MAX_CHECK } from '../../sim/data/automation.js';
import { roundWord } from '../../sim/time.js';
import { automationBase, automationDraft, automationOpinions, automationPayload, automationView } from '../logic/automation.js';
import { computeAmount, money, pct } from '../logic/format.js';
import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { registerMenuHandler } from '../menu.js';

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const times = (value) => `×${value.toFixed(1)}`;

function stepper(label, value, detail, onChange) {
  const root = element('div', 'automation-stepper');
  const minus = element('button', '', '−');
  const plus = element('button', '', '+');
  for (const [button, delta, name] of [[minus, -1, 'fewer'], [plus, 1, 'more']]) {
    button.type = 'button';
    button.setAttribute('aria-label', `${label}: ${name}`);
    button.disabled = value + delta < 0 || value + delta > MAX_CHECK;
    button.addEventListener('click', () => onChange(value + delta, `${label}: ${name}`));
  }
  const copy = element('div', 'automation-stepper-copy');
  copy.append(element('b', '', `${label} ${value}`), element('small', '', detail));
  root.append(minus, copy, plus);
  return root;
}

export function openAutomation(game, overlayRoot) {
  const state = automationBase(game.state, game.queue);
  const draft = automationDraft(state, game.queue.automation);
  const body = element('div', 'automation-body');
  const team = element('div', 'budget-team');
  const right = element('div', 'automation-side');
  const error = element('div', 'dialog-error');
  error.setAttribute('role', 'alert');
  let opened;

  function grid(view) {
    const root = element('div', 'automation-grid');
    root.setAttribute('role', 'grid');
    root.append(element('span', 'automation-corner'));
    for (const name of LEVEL_SHORT) root.append(element('span', 'automation-head', name));
    for (const row of view.rows) {
      const job = element('span', 'automation-job', row.name);
      if (row.fixed) job.append(element('small', '', 'follows the pack'));
      root.append(job);
      for (let level = 0; level < LEVELS.length; level += 1) {
        const cell = element('button', 'automation-cell');
        cell.type = 'button';
        const chosen = row.level === level;
        const reachable = !row.fixed && !row.locked && level <= row.max;
        cell.classList.toggle('chosen', chosen);
        cell.classList.toggle('off', !reachable && !chosen);
        cell.classList.toggle('pack', row.pack === level);
        cell.setAttribute('aria-pressed', `${chosen}`);
        cell.setAttribute('aria-label', `${row.name}: ${LEVELS[level]}`);
        if (chosen) cell.textContent = row.locked ? 'Back with people' : LEVEL_SHORT[level];
        if (!reachable || chosen) cell.setAttribute('aria-disabled', 'true');
        else cell.addEventListener('click', () => { draft.levels[row.id] = level; render(`${row.name}: ${LEVELS[level]}`); });
        root.append(cell);
      }
    }
    return root;
  }

  function timeBar(view) {
    const root = element('div', 'automation-time');
    const head = element('div', 'automation-time-head');
    const slowest = view.rows.find((row) => row.id === view.bottleneck);
    head.append(element('b', '', 'Where the research time goes'), element('span', '', `slowest step: ${slowest.name.toLowerCase()}`));
    const bar = element('div', 'automation-time-bar');
    for (const row of view.rows) {
      const part = element('span', `job-${row.id}${row.id === view.bottleneck ? ' bottleneck' : ''}`, row.timeShare >= 0.09 ? row.short : '');
      part.style.flex = `${row.timeShare} 1 0%`;
      bar.append(part);
    }
    root.append(head, bar);
    return root;
  }

  function checksRow(view) {
    const root = element('div', 'automation-checks');
    root.append(
      stepper('Reviewers', view.checks.reviewers, `${money(view.reviewerCost)} a month`, (value, focus) => { draft.checks.reviewers = value; render(focus); }),
      stepper('Monitors', view.checks.monitors, `${computeAmount(view.monitorUnits, state.era)} of compute`, (value, focus) => { draft.checks.monitors = value; render(focus); }),
    );
    const ai = element('button', `compute-toggle${view.checks.aiReview ? ' enabled' : ''}`);
    ai.type = 'button';
    ai.setAttribute('role', 'switch');
    ai.setAttribute('aria-checked', `${view.checks.aiReview}`);
    ai.setAttribute('aria-label', 'AI review');
    const copy = element('span');
    copy.append(element('b', '', 'AI review'), element('small', '', 'cheap, shares its blind spots'));
    ai.append(copy, element('i', view.checks.aiReview ? 'on' : ''));
    ai.addEventListener('click', () => { draft.checks.aiReview = !view.checks.aiReview; render('AI review'); });
    root.append(ai);
    return root;
  }

  function side(view) {
    const root = element('div', 'automation-stats');
    const stat = (label, big, rest, extra) => {
      const block = element('section', 'automation-stat');
      block.append(element('h3', '', label));
      const line = element('p');
      line.append(element('b', '', big), document.createTextNode(` ${rest}`));
      block.append(line);
      if (extra) block.append(extra);
      root.append(block);
    };
    stat('Research speed', times(view.speed), 'faster than by hand', element('small', '', `Head of Research says ${times(view.claimed)}`));
    stat('AI writes', pct(view.codeShare), 'of our code');
    const meter = element('div', 'automation-meter');
    const fill = element('i');
    fill.style.width = pct(view.checkedShare);
    meter.append(fill);
    const extra = element('div');
    extra.append(meter);
    if (view.unchecked > 0) extra.append(element('small', '', 'Hire reviewers or add monitors to check more'));
    stat(`Checked this ${roundWord(state.era)}`, pct(view.checkedShare), "of the AI's work", extra);
    return root;
  }

  function render(focusLabel) {
    const view = automationView(state, draft);
    error.textContent = view.error ? view.error[0].toUpperCase() + view.error.slice(1) : '';
    const legend = element('div', 'automation-legend', 'Where most labs are now');
    body.replaceChildren(grid(view), legend, timeBar(view), checksRow(view), error);
    team.replaceChildren(...teamPanel(state, { opinions: automationOpinions(view, roundWord(state.era)) }).children);
    right.replaceChildren(side(view));
    if (focusLabel) [...body.querySelectorAll('[aria-label]')].find((node) => node.getAttribute('aria-label') === focusLabel)?.focus();
  }

  opened = openDialog(overlayRoot, {
    title: 'Who does the work',
    subtitle: 'How much of each job your AI does inside the lab',
    left: { title: 'Team', content: team },
    right: { title: `This ${roundWord(state.era)}`, content: right },
    body,
    onOk() {
      const view = automationView(state, draft);
      if (view.error) {
        error.textContent = view.error[0].toUpperCase() + view.error.slice(1);
        return;
      }
      // Real time: the choice applies at once; show the sim's reason if it is refused.
      const result = game.setField('automation', automationPayload(state, draft));
      if (result && result.ok === false) {
        error.textContent = result.error[0].toUpperCase() + result.error.slice(1);
        return;
      }
      opened.close();
    },
  });
  opened.classList.add('company-dialog', 'automation-dialog');
  render();
  return opened;
}

export function mountAutomation(game, overlayRoot) {
  return registerMenuHandler('automation', () => openAutomation(game, overlayRoot));
}
