import { cashWarning, cashWarningCheckpoint } from '../logic/cashWarning.js';
import { money } from '../logic/format.js';

const CLOCK_REASON = 'cash-warning';

function make(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function mountCashWarning(game, { stage, onFinance, onBudget, onFunding }) {
  const banner = make('section', 'gp cash-warning');
  banner.hidden = true;
  banner.setAttribute('aria-label', 'Cash warning');
  const words = make('div', 'cash-warning-copy');
  words.setAttribute('role', 'status');
  words.setAttribute('aria-live', 'polite');
  const title = make('strong', 'cash-warning-title');
  const detail = make('span', 'cash-warning-detail');
  const help = make('span', 'cash-warning-help');
  words.append(title, detail, help);
  const actions = make('div', 'cash-warning-actions');
  function button(label, handler) {
    const node = make('button', '', label);
    node.type = 'button';
    node.addEventListener('click', handler);
    actions.append(node);
    return node;
  }
  button('Finance', () => onFinance());
  button('Budget', () => onBudget());
  const funding = button('Funding', () => onFunding());
  const acknowledge = button('Continue — I understand', () => {
    waiting = false;
    game.clock?.resume(CLOCK_REASON);
    render();
  });
  banner.append(words, actions);
  stage.append(banner);
  let checkpoint = 0;
  let lastPause = null;
  let waiting = false;
  let previousCopy = '';

  // The pacing director (sim/pacing.js) decides when the warning may stop the clock: a pause it recorded today. On
  // moving day the warning folds into the era recap instead. A state from before the director keeps the old rule.
  function pausesNow(warning) {
    const paced = game.state.pacing?.cash;
    if (!paced) {
      const next = cashWarningCheckpoint(checkpoint, warning);
      checkpoint = next.checkpoint;
      return next.pause;
    }
    const key = paced.pause ? `${paced.pause.day}:${paced.pause.level}` : null;
    const fresh = key !== null && key !== lastPause && paced.pause.day === game.state.day;
    lastPause = key;
    return fresh;
  }

  function render() {
    const warning = cashWarning(game.state);
    const pause = pausesNow(warning);
    if (!warning) {
      banner.hidden = true;
      if (waiting) game.clock?.resume(CLOCK_REASON);
      waiting = false;
      return;
    }
    if (pause) {
      waiting = true;
      game.clock?.pause(CLOCK_REASON);
    }
    banner.hidden = false;
    banner.dataset.level = warning.level;
    const headline = warning.level === 'critical' ? 'Cash is almost gone' : warning.level === 'urgent' ? 'Cash is running low' : 'Plan ahead: cash is getting low';
    const runway = warning.runway < 1 ? 'less than 1 month' : `about ${warning.runway.toFixed(1)} months`;
    const detailText = `${money(warning.cash)} left · ${runway} at current net spending (${money(Math.max(0, warning.netBurn))}/month).`;
    const helpText = `${waiting ? 'Time is paused. ' : ''}Review spending and signed compute bills before buying more.${warning.fundingAvailable ? ' Funding options are available.' : game.state.era < 2 ? ' Funding rounds open in the next era.' : 'You have already raised this era.'}`;
    const copy = `${headline}|${detailText}|${helpText}`;
    if (copy !== previousCopy) {
      title.textContent = headline;
      detail.textContent = detailText;
      help.textContent = helpText;
      previousCopy = copy;
    }
    funding.textContent = warning.emergency ? 'Emergency funding' : 'Raise funding';
    funding.disabled = !warning.fundingAvailable;
    acknowledge.hidden = !waiting;
  }

  const unsubscribe = game.subscribe(render);
  render();
  return {
    render,
    destroy() {
      unsubscribe();
      banner.remove();
      if (waiting) game.clock?.resume(CLOCK_REASON);
    },
  };
}
