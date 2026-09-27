import { openDialog } from '../components/dialog.js';
import { eraById } from '../../sim/data/eras.js';
import { roundWord } from '../../sim/time.js';
import { teamPanel } from '../components/team.js';
import { queuedMoveProblem } from '../logic/actions.js';
import {
  applyDealMove,
  commitmentsView,
  dealCards,
  opinions,
  projectQueue,
  queueOrderPreflight,
  replaceQueueOrder,
  queueScreenAvailable,
  roundEndStrip,
  queueTrainingView,
  queueView,
} from '../logic/compute.js';
import { computeAmount, money, months } from '../logic/format.js';

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function finishDialog(opened, kind, footer) {
  opened.classList.add('company-dialog', `company-dialog-${kind}`);
  const ok = opened.querySelector('.dialog-ok');
  if (ok) footer.append(ok);
  opened.querySelector('.dialog-body').append(footer);
  return opened;
}

// "A", "A and B", "A, B and C".
const listNames = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]);

function dealButton(card) {
  const button = element('button', `company-card supplier-${card.supplier}`);
  button.type = 'button';
  button.dataset.choice = card.id;
  button.dataset.focusKey = `offer:${card.id}`;
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', 'false');
  button.disabled = card.disabled;
  if (card.reason) button.title = card.reason;

  const who = element('span', 'company-who');
  const mono = element('span', 'company-monogram', card.name[0]);
  const identity = element('span');
  identity.append(element('strong', '', card.name), element('span', 'company-kind', card.kind));
  who.append(mono, identity);
  const big = element('span', 'company-big', card.big);
  if (card.unit) big.append(element('small', '', card.unit));
  const rows = element('span', 'company-kv');
  for (const [label, value] of card.rows) rows.append(element('span', '', label), element('b', '', value));
  const catchBlock = element('span', 'company-catch');
  catchBlock.append(
    element('span', `company-chip${card.chip === 'No strings' ? ' no-strings' : ''}`, card.chip),
    element('span', 'company-explanation', card.explanation),
  );
  if (card.fallbackLine) catchBlock.append(element('span', 'company-fallback', card.fallbackLine));
  if (card.takenBy) button.append(element('span', 'company-taken', `${card.takenBy} takes this`));
  else if (card.secondChoiceOf.length) button.append(element('span', 'company-second', `${listNames(card.secondChoiceOf)}'s second choice`));
  button.append(who, big, element('span', 'company-per', card.per), rows, catchBlock);
  if (card.disabled) button.append(element('span', 'company-card-reason', card.reason));
  return button;
}

function queueDealButton() {
  const button = element('button', 'company-card supplier-verde compute-queue-card');
  button.type = 'button';
  button.dataset.queue = 'true';
  const who = element('span', 'company-who');
  const identity = element('span');
  identity.append(element('strong', '', 'Verde'), element('span', 'company-kind', 'Allocation queue'));
  who.append(element('span', 'company-monogram', 'V'), identity);
  button.append(
    who,
    element('span', 'company-big', 'Queue'),
    element('span', 'company-per', 'memory chips are rationed'),
    element('span', 'company-chip', 'Era 3 allocation'),
    element('span', 'company-explanation', 'Compare standard and prepaid outcomes before ordering.'),
  );
  return button;
}

function gridReservationButton(card) {
  const button = element('button', 'grid-reservation-strip');
  button.type = 'button';
  button.dataset.choice = card.id;
  button.dataset.focusKey = `offer:${card.id}`;
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', 'false');
  button.disabled = card.disabled;
  if (card.reason) button.title = card.reason;
  const identity = element('span', 'grid-reservation-identity');
  identity.append(
    element('span', 'company-monogram', 'G'),
    element('strong', '', 'Grid connection · power reservation'),
  );
  button.append(
    identity,
    element('span', '', 'online in era 4'),
    element('b', '', `${money(card.upfront)} upfront`),
    element('span', 'company-chip', 'Power for era 4'),
  );
  return button;
}

function commitmentPanel(game, state, selected, onAction) {
  const view = commitmentsView(state, selected);
  const root = element('div', 'commitments-panel');
  const billNow = element('div', 'compute-bill-row');
  billNow.append(element('span', '', 'Monthly bill now'), element('b', '', `${money(view.billNow)}/mo`));
  const billAfter = element('div', 'compute-bill-row');
  const afterBill = view.billAfterRange
    ? `${money(view.billAfterRange[0])}–${money(view.billAfterRange[1])}/mo`
    : `${money(view.billAfter)}/mo`;
  billAfter.append(
    element('span', '', `After signing, from ${view.afterDate}`),
    element('b', 'after', afterBill),
  );
  const stack = element('div', 'commitment-stack');
  stack.setAttribute('aria-label', 'Monthly bill by contract');
  for (const segment of view.segments) {
    const part = element('i', segment.isNew ? 'new' : 'current');
    part.style.flex = `${Math.max(segment.bill, 0.01)} 1 0%`;
    stack.append(part);
  }
  const legend = element('div', 'commitment-stack-labels');
  legend.append(element('span', '', 'current contracts'), element('span', '', 'new contract · striped'));
  root.append(billNow, billAfter, stack, legend);

  for (const row of view.rows) {
    const card = element('div', `commitment-row${row.isNew ? ' new' : ''}`);
    card.dataset.contractId = row.id;
    card.tabIndex = -1;
    const top = element('div', 'r1');
    const bill = row.billRange
      ? `${money(row.billRange[0])}–${money(row.billRange[1])}/mo`
      : `${money(row.bill)}/mo`;
    top.append(element('span', '', row.name), element('span', '', bill));
    const detail = element('div', 'r2');
    const capacity = row.unitsRange
      ? `${computeAmount(row.unitsRange[0], state.era)}–${computeAmount(row.unitsRange[1], state.era)}`
      : computeAmount(row.units, state.era);
    detail.append(element('span', '', capacity), element('span', '', row.monthsLeft));
    card.append(top, detail);
    if (row.status) card.append(element('div', 'commitment-warning', row.status));
    if (!row.isNew) {
      const actions = element('div', 'commitment-actions');
      const choices = [
        ...(row.canScaleDown ? [['Scale down 30%', 'scaleDown']] : []),
        ['Break', 'break'],
        ...(row.canBuyout ? [['Buy out', 'buyout']] : []),
      ];
      for (const [label, action] of choices) {
        const button = element('button', 'compute-ghost', label);
        button.type = 'button';
        button.dataset.focusKey = `contract:${row.id}:${action}`;
        button.addEventListener('click', () => {
          const next = [...(game.queue.contractActions ?? []).filter((item) => item.id !== row.id), { id: row.id, action }];
          const problem = queuedMoveProblem(game.state, { ...game.queue, contractActions: next });
          if (problem) {
            onAction(button.dataset.focusKey, problem);
            return;
          }
          game.setField('contractActions', next);
          onAction(button.dataset.focusKey, '');
        });
        actions.append(button);
      }
      card.append(actions);
    }
    root.append(card);
  }
  const runwayNow = element('div', 'compute-runway-row');
  runwayNow.append(element('span', '', 'Runway now'), element('b', '', months(view.runwayNow)));
  const runwayAfter = element('div', 'compute-runway-row compact');
  const afterRunway = view.runwayAfterRange
    ? `${months(view.runwayAfterRange[0])}–${months(view.runwayAfterRange[1])}`
    : months(view.runwayAfter);
  runwayAfter.append(element('span', '', 'After signing'), element('b', 'bad', afterRunway));
  root.append(runwayNow, runwayAfter);
  return root;
}

export function openDeals(game, overlayRoot) {
  const initial = projectQueue(game.state, game.queue);
  let selected = '';
  const body = element('div');
  body.setAttribute('role', 'radiogroup');
  body.setAttribute('aria-label', 'Compute suppliers and reservations');
  let opened;
  const error = element('div', 'dialog-error');
  error.setAttribute('role', 'alert');
  const right = element('div');
  const footer = element('div', 'company-footer');
  const note = element('div', 'company-footer-note');
  footer.append(note);

  function currentCards() {
    const state = projectQueue(game.state, game.queue);
    const cards = dealCards({ ...state, movesLeft: game.movesLeft() });
    const gridOffer = state.compute.offers.find((offer) => offer.supplier === 'grid');
    let gridCard = null;
    if (gridOffer) {
      let reason = game.movesLeft() === 0 ? `Both team actions are used this ${roundWord(state.era)}` : '';
      if (!reason) {
        const result = applyDealMove(structuredClone(state), { type: 'deal', offerId: gridOffer.id });
        reason = result.ok ? '' : result.error;
      }
      gridCard = {
        id: gridOffer.id,
        upfront: gridOffer.upfront,
        disabled: Boolean(reason),
        reason,
        move: { type: 'deal', offerId: gridOffer.id },
      };
    }
    return { state, cards, gridCard };
  }

  function render({ focusKey = document.activeElement?.dataset?.focusKey } = {}) {
    const { state, cards, gridCard } = currentCards();
    const allCards = [...cards, ...(gridCard ? [gridCard] : [])];
    if (!allCards.some((card) => card.id === selected && !card.disabled)) {
      selected = allCards.find((card) => !card.disabled)?.id ?? allCards[0]?.id ?? '';
    }
    const group = element('div', 'deal-cards');
    const queueOffer = state.compute.offers.find((offer) => offer.viaQueue);
    if (queueOffer) {
      const queueCard = queueDealButton();
      queueCard.addEventListener('click', () => {
        opened.close();
        openQueue(game, overlayRoot);
      });
      group.append(queueCard);
    }
    const buttons = cards.map(dealButton);
    group.append(...buttons);
    const gridStrip = gridCard ? gridReservationButton(gridCard) : null;
    if (gridStrip) buttons.push(gridStrip);
    for (const button of buttons) {
      const active = button.dataset.choice === selected;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-checked', `${active}`);
      button.querySelector('.company-selected')?.remove();
      if (active && !button.classList.contains('grid-reservation-strip')) {
        button.append(element('span', 'company-selected', 'Selected'));
      }
      button.addEventListener('click', () => {
        selected = button.dataset.choice;
        error.textContent = '';
        render({ focusKey: button.dataset.focusKey });
      });
    }
    const card = cards.find((candidate) => candidate.id === selected) ?? (gridCard?.id === selected ? gridCard : null);
    right.replaceChildren(commitmentPanel(game, state, selected, (key, problem) => {
      error.textContent = problem ? `This change would break a queued move: ${problem}.` : '';
      render({ focusKey: key });
    }));
    const upfront = card?.upfront != null ? money(card.upfront) : card ? Object.fromEntries(card.rows).Upfront : 'none';
    note.textContent = upfront && upfront !== 'none'
      ? `Signing uses 1 of your 2 team actions this ${roundWord(state.era)} · pay ${upfront} now`
      : `Signing uses 1 of your 2 team actions this ${roundWord(state.era)} · nothing to pay now`;
    const ok = opened?.querySelector('.dialog-ok');
    if (ok) ok.disabled = !card || card.disabled;
    body.replaceChildren(group);
    const strip = element('div', 'deal-round-end');
    strip.append(element('b', '', `At the ${roundWord(state.era)}'s end`));
    for (const item of roundEndStrip(state)) strip.append(element('span', `deal-round-end-item lab-${item.id}`, item.text));
    body.append(strip);
    if (gridStrip) body.append(gridStrip);
    body.append(error);
    if (focusKey) {
      const exact = [...opened.querySelectorAll('[data-focus-key]')]
        .find((control) => control.dataset.focusKey === focusKey);
      const contractId = focusKey.startsWith('contract:') ? focusKey.split(':')[1] : '';
      const contract = contractId
        ? [...opened.querySelectorAll('[data-contract-id]')]
          .find((control) => control.dataset.contractId === contractId)
        : null;
      const selectedOffer = [...opened.querySelectorAll('[data-choice]')]
        .find((control) => control.dataset.choice === selected);
      (exact ?? contract ?? selectedOffer)?.focus();
    }
  }

  opened = openDialog(overlayRoot, {
    title: 'Sign a compute deal',
    subtitle: `Era ${initial.era} · ${eraById(initial.era).name} · rivals take the marked cards at the ${roundWord(initial.era)}'s end`,
    left: { title: 'Team', content: teamPanel(initial, { opinions: opinions(initial, 'deals') }) },
    right: { title: 'Commitments', content: right },
    body,
    okLabel: 'Sign',
    onOk() {
      const { state, cards, gridCard } = currentCards();
      const card = cards.find((candidate) => candidate.id === selected) ?? (gridCard?.id === selected ? gridCard : null);
      if (!card || card.disabled) {
        error.textContent = card?.reason ?? 'Choose an available supplier.';
        render();
        return;
      }
      const validation = applyDealMove(structuredClone(state), card.move);
      if (!validation.ok) {
        error.textContent = validation.error ?? 'The deal is no longer available.';
        render();
        return;
      }
      const result = game.addMove(card.move);
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The deal could not be queued.';
    },
  });
  finishDialog(opened, 'deals', footer);
  render();
  return opened;
}

function rangeControl({ min, max, value, label, onInput }) {
  const wrap = element('div', 'compute-range');
  const input = document.createElement('input');
  input.type = 'range';
  input.min = `${min}`;
  input.max = `${max}`;
  input.step = '1';
  input.value = `${value}`;
  input.setAttribute('aria-label', label);
  input.setAttribute('aria-valuetext', `${value} units`);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    input.setAttribute('aria-valuetext', `${next} units`);
    onInput(next, { commit: false, focusLabel: label });
  });
  input.addEventListener('change', () => onInput(Number(input.value), { commit: true, focusLabel: label }));
  wrap.append(input);
  return wrap;
}

function restoreFocus(root, label) {
  if (!label) return;
  const target = [...root.querySelectorAll('[aria-label]')]
    .find((control) => control.getAttribute('aria-label') === label);
  target?.focus();
}

export function openQueue(game, overlayRoot) {
  if (!queueScreenAvailable(game.state)) return null;
  const existingDraft = game.queue.moves.find((move) => move.type === 'queueOrder');
  const initialDraft = existingDraft ?? { units: 1, tier: 'standard' };
  const initial = queueOrderPreflight(game.state, game.queue, initialDraft).state;
  const max = queueView(initial).released;
  let units = Math.min(max, existingDraft?.units ?? Math.max(1, Math.round(max * 0.4)));
  let tier = existingDraft?.tier ?? 'standard';
  const body = element('div', 'queue-layout');
  const allocation = element('div', 'queue-allocation');
  const order = element('div', 'queue-order');
  const right = element('div', 'queue-why');
  const error = element('div', 'dialog-error');
  let opened;
  let orderButton;

  function render({ focusLabel } = {}) {
    const preview = queueOrderPreflight(game.state, game.queue, { units, tier });
    const state = preview.state;
    const view = queueView(state, { units, tier });
    const existingOrder = game.queue.moves.some((move) => move.type === 'queueOrder');
    const moveReason = !existingOrder && game.movesLeft() === 0
      ? `Both team actions are used this ${roundWord(state.era)}`
      : '';
    const orderReason = moveReason || preview.reason;
    allocation.replaceChildren();
    const head = element('div', 'queue-head');
    const supplyText = element('div');
    supplyText.append(element('b', '', `${view.released} units`), document.createTextNode(` released this ${roundWord(state.era)}`));
    head.append(supplyText, element('span', '', 'prepaid orders are served first'));
    const supply = element('div', 'queue-supply');
    supply.setAttribute('aria-label', `Who gets this ${roundWord(state.era)}'s supply`);
    for (const row of view.rows.filter((item) => item.got > 0)) {
      const part = element('span', row.lab === 'you' ? 'you' : row.tier, `${row.name} ${row.got}`);
      part.style.flex = `${row.got} 1 0%`;
      supply.append(part);
    }
    const labels = element('div', 'queue-supply-labels');
    labels.append(element('span', '', 'prepaid tier'), element('span', '', 'standard tier, shared by order size'));
    allocation.append(head, supply, labels);
    const largest = Math.max(1, ...view.rows.map((row) => row.ordered));
    for (const row of view.rows) {
      const item = element('div', `queue-row${row.lab === 'you' ? ' you' : ''}${row.tier === 'none' ? ' off' : ''}`);
      const lab = element('div', 'lab', row.name);
      lab.append(element('small', '', row.lab === 'you' ? 'Kestrel lab' : row.tier === 'none' ? 'export controls' : ''));
      const badge = element('span', `queue-tier ${row.tier}`, row.tier === 'none' ? "Can't buy" : row.tier);
      const bar = element('div', 'queue-order-bar');
      bar.style.width = `${Math.max(4, (row.ordered / largest) * 100)}%`;
      if (row.got > 0) {
        const fill = element('i', `lab-${row.lab}`);
        fill.style.width = `${(row.got / Math.max(1, row.ordered)) * 100}%`;
        bar.append(fill);
      }
      const got = element('div', 'got');
      got.textContent = row.tier === 'none' ? '—' : `${row.got} of ${row.ordered}`;
      item.append(lab, badge, bar, got);
      allocation.append(item);
    }
    for (const announcement of view.announcements) {
      const line = element('div', 'queue-announcement');
      line.append(element('span', 'bang', '!'), element('span', '', announcement));
      allocation.append(line);
    }

    order.replaceChildren(element('div', 'queue-order-title', 'Your order'));
    const carried = game.state.compute.queue?.carry;
    if (carried) {
      const waiting = element('div', 'queue-announcement queue-carry');
      waiting.append(
        element('span', 'bang', '!'),
        element('span', '', `${carried.units} units are still waiting at the ${carried.tier} tier.`),
      );
      const withdraw = element('button', 'compute-ghost', game.queue.queueWithdraw ? 'Withdrawal queued' : 'Withdraw waiting order');
      withdraw.type = 'button';
      withdraw.disabled = game.queue.queueWithdraw === true;
      withdraw.setAttribute('aria-label', 'Withdraw waiting order');
      withdraw.addEventListener('click', () => {
        game.setField('queueWithdraw', true);
        render({ focusLabel: 'Order units' });
      });
      waiting.append(withdraw);
      order.append(waiting);
    }
    const amount = element('div', 'queue-order-value', `${units}`);
    amount.append(element('small', '', 'units'));
    order.append(amount, rangeControl({
      min: 1,
      max: view.released,
      value: units,
      label: 'Order units',
      onInput(next, interaction) {
        units = next;
        if (interaction.commit) render({ focusLabel: interaction.focusLabel });
      },
    }));
    const endpoints = element('div', 'queue-range-labels');
    endpoints.append(element('span', '', '1'), element('span', '', `${view.released}`));
    const switcher = element('div', 'compute-segmented');
    for (const name of ['standard', 'prepaid']) {
      const button = element('button', name === tier ? 'selected' : '', name[0].toUpperCase() + name.slice(1));
      button.type = 'button';
      button.setAttribute('aria-label', `${name[0].toUpperCase()}${name.slice(1)} tier`);
      button.setAttribute('aria-pressed', `${name === tier}`);
      button.addEventListener('click', () => { tier = name; render({ focusLabel: `${name[0].toUpperCase()}${name.slice(1)} tier` }); });
      switcher.append(button);
    }
    const compare = element('div', 'queue-compare');
    const standard = element('div', tier === 'standard' ? 'selected' : '');
    standard.append(element('b', '', 'Standard'), document.createTextNode(`${view.you.standard} now, ${units - view.you.standard} wait. No upfront.`));
    const prepaid = element('div', tier === 'prepaid' ? 'selected' : '');
    prepaid.append(element('b', '', 'Prepaid'), document.createTextNode(`${view.you.prepaid} now. ${money(view.you.upfront)} upfront. Race heat rises.`));
    compare.append(standard, prepaid);
    order.append(endpoints, switcher, compare, error);
    if (orderButton) {
      orderButton.disabled = Boolean(orderReason);
      if (orderReason) orderButton.title = orderReason;
      else orderButton.removeAttribute('title');
      const footer = element('div', 'queue-order-footer');
      footer.append(element('span', '', orderReason || `Uses 1 of your 2 team actions this ${roundWord(state.era)}`), orderButton);
      order.append(footer);
    }

    const { free, need, short } = queueTrainingView(state);
    right.replaceChildren();
    for (const [label, value, detail] of [
      ['Next run', computeAmount(need, state.era), 'needs this much training compute'],
      ['Free for training', computeAmount(free, state.era), 'after serving, control and safety'],
      ['Short by', computeAmount(short, state.era), 'before this order'],
      ['This order, standard', `+${computeAmount(view.you.standard, state.era)}`, 'available now'],
      ['This order, prepaid', `+${computeAmount(view.you.prepaid, state.era)}`, 'available now'],
    ]) {
      const row = element('div', 'queue-why-row');
      const top = element('div');
      top.append(element('span', '', label), element('b', '', value));
      row.append(top, element('small', '', detail));
      right.append(row);
    }
    restoreFocus(body, focusLabel);
  }

  opened = openDialog(overlayRoot, {
    title: 'Verde allocation',
    subtitle: 'Era 3 · memory chips are sold out, so Verde rations',
    left: { title: 'Team', content: teamPanel(initial, { opinions: opinions(initial, 'queue') }) },
    right: { title: 'Why order', content: right },
    body,
    okLabel: 'Order',
    onOk() {
      const preview = queueOrderPreflight(game.state, game.queue, { units, tier });
      const existingOrder = game.queue.moves.some((move) => move.type === 'queueOrder');
      if (!preview.ok || (!existingOrder && game.movesLeft() === 0)) {
        error.textContent = preview.reason || `Both team actions are used this ${roundWord(game.state.era)}`;
        render();
        return;
      }
      const replaced = game.queue.moves.some((move) => move.type === 'queueOrder');
      const moves = replaceQueueOrder(game.queue.moves, { units, tier });
      const result = replaced
        ? game.setField('moves', moves)
        : game.addMove({ type: 'queueOrder', units, tier });
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The order could not be queued.';
    },
  });
  opened.classList.add('company-dialog', 'company-dialog-queue');
  body.append(allocation, order);
  orderButton = opened.querySelector('.dialog-ok');
  render();
  return opened;
}
