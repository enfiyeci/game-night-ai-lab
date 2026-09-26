import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { dealCards, projectQueue, turnSummary } from '../logic/compute.js';
import { money, months, pct } from '../logic/format.js';
import { registerMenuHandler } from '../menu.js';
import {
  EMERGENCY_OPTIONS,
  INVESTORS,
  inDangerZone,
  projectBurn,
  runway,
} from '../../sim/economy.js';
import { TECHNIQUES, techAvailable } from '../../sim/techniques.js';

const INVESTOR_COPY = {
  vc: { chip: 'Board seat', explanation: 'A growth fund joins the board.' },
  strategic: { chip: 'Strings attached', explanation: 'A cloud partner joins the board and expects favours.' },
  sovereign: { chip: 'Costs goodwill', explanation: 'Staff, the public and Washington will notice.' },
};

const EMERGENCY_NAMES = {
  equityForCompute: 'Equity for compute',
  structureChange: 'Change structure',
  bridgeRound: 'Bridge round',
  acquihire: 'Accept an acquihire',
};

function statusPanel(rows, lead = '') {
  const root = document.createElement('div');
  root.className = 'company-status';
  if (lead) {
    const text = document.createElement('p');
    text.className = 'company-status-lead';
    text.textContent = lead;
    root.append(text);
  }
  for (const [label, value] of rows) {
    const row = document.createElement('div');
    const key = document.createElement('span');
    key.textContent = label;
    const answer = document.createElement('b');
    answer.textContent = value;
    row.append(key, answer);
    root.append(row);
  }
  return root;
}

function errorBox() {
  const error = document.createElement('div');
  error.className = 'dialog-error';
  error.setAttribute('role', 'alert');
  return error;
}

function footer(note) {
  const root = document.createElement('div');
  root.className = 'company-footer';
  const text = document.createElement('div');
  text.className = 'company-footer-note';
  text.textContent = note;
  root.append(text);
  return { root, text };
}

function finishDialog(opened, kind, footerRoot) {
  opened.classList.add('company-dialog', `company-dialog-${kind}`);
  const ok = opened.querySelector('.dialog-ok');
  footerRoot.append(ok);
  opened.querySelector('.dialog-body').append(footerRoot);
  return opened;
}

function rowValue(card, label) {
  return card.rows.find(([name]) => name === label)?.[1] ?? '';
}

function arrivalTurn(state, text) {
  if (text === 'now') return state.turn;
  if (text === 'next turn') return state.turn + 1;
  const turns = Number.parseInt(text.match(/\d+/)?.[0] ?? '1', 10);
  return state.turn + turns;
}

function runwayNow(state) {
  const clone = structuredClone(state);
  clone.burnPlanned = projectBurn(clone);
  return runway(clone, 'planned');
}

function setActionDisabled(button, reason) {
  button.querySelector('.button-disabled-reason')?.remove();
  button.disabled = Boolean(reason);
  if (!reason) {
    button.removeAttribute('title');
    return;
  }
  button.title = reason;
  const hidden = document.createElement('span');
  hidden.className = 'visually-hidden button-disabled-reason';
  hidden.textContent = `: ${reason}`;
  button.append(hidden);
}

function setSelected(buttons, selected, { showTag = false } = {}) {
  for (const button of buttons) {
    const active = button.dataset.choice === selected;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-checked', `${active}`);
    button.tabIndex = active || (!selected && !button.disabled) ? 0 : -1;
    button.querySelector('.company-selected')?.remove();
    if (active && showTag) {
      const tag = document.createElement('span');
      tag.className = 'company-selected';
      tag.textContent = 'Selected';
      button.append(tag);
    }
  }
}

function wireChoices(group, buttons, select) {
  const enabled = () => buttons.filter((button) => !button.disabled);
  for (const button of buttons) button.addEventListener('click', () => select(button.dataset.choice));
  group.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const choices = enabled();
    if (choices.length === 0) return;
    event.preventDefault();
    const current = Math.max(0, choices.indexOf(document.activeElement));
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % choices.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + choices.length) % choices.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = choices.length - 1;
    select(choices[next].dataset.choice);
    choices[next].focus();
  });
}

function disabledReason(button, reason) {
  if (!reason) return;
  button.disabled = true;
  button.title = reason;
  const text = document.createElement('span');
  text.className = 'company-card-reason';
  text.textContent = reason;
  button.append(text);
}

function dealCard(card) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `company-card deal-card supplier-${card.id}`;
  button.dataset.choice = card.id;
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', 'false');

  const who = document.createElement('span');
  who.className = 'company-who';
  const monogram = document.createElement('span');
  monogram.className = 'company-monogram';
  monogram.textContent = card.name[0];
  const identity = document.createElement('span');
  const name = document.createElement('strong');
  name.textContent = card.name;
  const kind = document.createElement('span');
  kind.className = 'company-kind';
  kind.textContent = card.kind;
  identity.append(name, kind);
  who.append(monogram, identity);

  const big = document.createElement('span');
  big.className = 'company-big';
  big.textContent = `${card.big}`;
  const unit = document.createElement('small');
  unit.textContent = ` ${card.unit}`;
  big.append(unit);
  const per = document.createElement('span');
  per.className = 'company-per';
  per.textContent = card.per;

  const rows = document.createElement('span');
  rows.className = 'company-kv';
  for (const [label, value] of card.rows) {
    const key = document.createElement('span');
    key.textContent = label;
    const answer = document.createElement('b');
    answer.textContent = value;
    rows.append(key, answer);
  }

  const catchBlock = document.createElement('span');
  catchBlock.className = 'company-catch';
  const chip = document.createElement('span');
  chip.className = `company-chip${card.chip === 'No strings' ? ' no-strings' : ''}`;
  chip.textContent = card.chip;
  const explanation = document.createElement('span');
  explanation.className = 'company-explanation';
  explanation.textContent = card.explanation;
  catchBlock.append(chip, explanation);
  button.append(who, big, per, rows, catchBlock);
  disabledReason(button, card.disabled ? card.reason : '');
  return button;
}

export function openDeals(game, overlayRoot) {
  const state = game.state;
  const projected = projectQueue(state, game.queue);
  const cards = dealCards({ ...projected, movesLeft: game.movesLeft() });
  let selected = cards.find((card) => !card.disabled)?.id ?? '';
  const body = document.createElement('div');
  const group = document.createElement('div');
  group.className = 'deal-cards';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Compute suppliers');
  const buttons = cards.map(dealCard);
  group.append(...buttons);
  const error = errorBox();
  const foot = footer('');
  body.append(group, error);
  const rightContent = document.createElement('div');

  function cardForSelection() {
    return cards.find((card) => card.id === selected);
  }

  function renderSelection() {
    setSelected(buttons, selected, { showTag: true });
    const card = cardForSelection();
    if (!card) {
      rightContent.replaceChildren(statusPanel([], 'No supplier can be signed right now.'));
      foot.text.textContent = 'Signing uses 1 of 2 moves this turn';
      return;
    }
    const upfrontText = rowValue(card, 'Upfront') || 'none';
    const rows = [
      ['Pay now', upfrontText],
      ['Monthly cost', rowValue(card, 'Monthly')],
      ['Online from', `turn ${arrivalTurn(projected, rowValue(card, 'Arrives'))}`],
      ['Runway now', months(runwayNow(projected))],
    ];
    if (Number.isFinite(card.runwayAfter)) rows.push(['After signing (full bill)', months(card.runwayAfter)]);
    rightContent.replaceChildren(statusPanel(rows));
    foot.text.textContent = upfrontText === 'none'
      ? 'Signing uses 1 of 2 moves this turn · nothing to pay now'
      : `Signing uses 1 of 2 moves this turn · pay ${upfrontText} now`;
  }

  wireChoices(group, buttons, (id) => {
    selected = id;
    error.textContent = '';
    renderSelection();
  });

  let opened;
  opened = openDialog(overlayRoot, {
    title: 'Sign a compute deal',
    subtitle: `Era ${state.era} · pick one supplier`,
    left: { title: 'Team', content: teamPanel(state) },
    right: { title: 'This deal', content: rightContent },
    body,
    okLabel: 'Sign',
    onOk() {
      const card = cardForSelection();
      if (!card || card.disabled) {
        error.textContent = card?.reason ?? 'Choose an available supplier.';
        return;
      }
      const result = game.addMove(card.move);
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The deal could not be queued.';
    },
  });
  finishDialog(opened, 'deals', foot.root);
  renderSelection();
  return opened;
}

function simpleCard({ id, monogram, name, kind, big, per, chip, explanation, disabled, reason }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'company-card company-option-card';
  button.dataset.choice = id;
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', 'false');
  const who = document.createElement('span');
  who.className = 'company-who';
  const disc = document.createElement('span');
  disc.className = 'company-monogram';
  disc.textContent = monogram;
  const identity = document.createElement('span');
  const title = document.createElement('strong');
  title.textContent = name;
  const type = document.createElement('span');
  type.className = 'company-kind';
  type.textContent = kind;
  identity.append(title, type);
  who.append(disc, identity);
  const amount = document.createElement('span');
  amount.className = 'company-big';
  amount.textContent = big;
  const detail = document.createElement('span');
  detail.className = 'company-per';
  detail.textContent = per;
  const catchBlock = document.createElement('span');
  catchBlock.className = 'company-catch';
  const catchChip = document.createElement('span');
  catchChip.className = 'company-chip';
  catchChip.textContent = chip;
  const copy = document.createElement('span');
  copy.className = 'company-explanation';
  copy.textContent = explanation;
  if (chip) catchBlock.append(catchChip);
  catchBlock.append(copy);
  button.append(who);
  if (big) button.append(amount);
  if (per) button.append(detail);
  button.append(catchBlock);
  disabledReason(button, disabled ? reason : '');
  return button;
}

export function openRaise(game, overlayRoot) {
  const state = game.state;
  const projected = projectQueue(state, game.queue);
  const queued = game.queue.moves.some((move) => move.type === 'raise')
    && state.flags.lastRoundEra !== state.era
    && projected.flags.lastRoundEra === projected.era;
  const reason = game.movesLeft() === 0
    ? 'Both moves are used this turn'
    : queued ? 'A round is already queued this turn'
      : projected.era < 2 ? 'Funding rounds open in era 2'
        : projected.flags.lastRoundEra === projected.era ? 'You already raised a round this era' : '';
  const options = Object.entries(INVESTORS).map(([id, investor]) => ({
    id,
    investor,
    amount: Math.round(projected.valuation * investor.share),
    ...INVESTOR_COPY[id],
  }));
  let selected = reason ? '' : options[0].id;
  const body = document.createElement('div');
  const group = document.createElement('div');
  group.className = 'company-option-grid';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Investors');
  const buttons = options.map((option) => simpleCard({
    id: option.id,
    monogram: option.investor.name[0],
    name: option.investor.name,
    kind: 'investor',
    big: money(option.amount),
    per: `for ${pct(option.investor.share)} of your lab`,
    chip: option.chip,
    explanation: option.explanation,
    disabled: Boolean(reason),
    reason,
  }));
  group.append(...buttons);
  const error = errorBox();
  const foot = footer('Raising uses 1 of 2 moves this turn');
  const rightContent = document.createElement('div');
  body.append(group, error);

  function renderSelection() {
    setSelected(buttons, selected);
    const option = options.find((entry) => entry.id === selected);
    rightContent.replaceChildren(option
      ? statusPanel([
        ['Cash now', money(projected.cash)],
        ['Raise', money(option.amount)],
        ['Cash after', money(projected.cash + option.amount)],
        ['Share of lab', pct(option.investor.share)],
      ])
      : statusPanel([], reason));
  }
  wireChoices(group, buttons, (id) => { selected = id; error.textContent = ''; renderSelection(); });

  let opened;
  opened = openDialog(overlayRoot, {
    title: 'Raise a round',
    subtitle: `Era ${state.era} · choose your investor`,
    left: { title: 'Team', content: teamPanel(state) },
    right: { title: 'This round', content: rightContent },
    body,
    okLabel: 'Raise',
    onOk() {
      if (!selected) { error.textContent = reason || 'Choose an investor.'; return; }
      const result = game.addMove({ type: 'raise', archetype: selected });
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The round could not be queued.';
    },
  });
  finishDialog(opened, 'raise', foot.root);
  renderSelection();
  return opened;
}

export function openResearch(game, overlayRoot) {
  const state = game.state;
  const projected = projectQueue(state, game.queue);
  const queued = new Set(game.queue.moves
    .filter((move) => move.type === 'research')
    .map((move) => move.techId));
  const options = TECHNIQUES.filter((technique) => (
    (!techAvailable(projected, technique.id) || queued.has(technique.id))
      && projected.era >= technique.era - 1
  ));
  const noMoves = game.movesLeft() === 0;
  let selected = options.find((technique) => (
    !noMoves
      && !queued.has(technique.id)
      && !techAvailable(projected, technique.id)
      && projected.researchPoints >= technique.researchCost
  ))?.id ?? '';
  const body = document.createElement('div');
  const group = document.createElement('div');
  group.className = 'research-list';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Techniques available for early research');
  const buttons = options.map((technique) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'research-row';
    button.dataset.choice = technique.id;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    const copy = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = technique.name;
    const available = document.createElement('span');
    available.textContent = `Available to everyone in era ${technique.era}`;
    copy.append(name, available);
    const cost = document.createElement('span');
    cost.className = 'research-cost';
    const amount = document.createElement('b');
    amount.textContent = `${technique.researchCost}`;
    const units = document.createTextNode(' research points');
    const affordability = document.createElement('em');
    affordability.textContent = projected.researchPoints >= technique.researchCost ? 'You can afford this' : 'Cannot afford yet';
    cost.append(amount, units, affordability);
    button.append(copy, cost);
    const reason = noMoves
      ? 'Both moves are used this turn'
      : queued.has(technique.id) ? 'This technique is already queued this turn'
        : techAvailable(projected, technique.id) ? 'This technique is already available'
          : projected.researchPoints < technique.researchCost ? 'Not enough research points' : '';
    disabledReason(button, reason);
    return button;
  });
  group.append(...buttons);
  if (options.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'company-empty';
    empty.textContent = 'Nothing can be researched early right now.';
    group.append(empty);
  }
  const error = errorBox();
  const foot = footer('Researching early uses 1 of 2 moves this turn');
  const rightContent = document.createElement('div');
  body.append(group, error);

  function renderSelection() {
    setSelected(buttons, selected);
    const technique = options.find((entry) => entry.id === selected);
    rightContent.replaceChildren(statusPanel(technique ? [
      ['Points now', `${Math.round(projected.researchPoints)}`],
      ['Cost', `${technique.researchCost}`],
      ['After research', `${Math.round(projected.researchPoints - technique.researchCost)}`],
      ['Industry access', `era ${technique.era}`],
    ] : [['Research points', `${Math.round(projected.researchPoints)}`]], technique ? '' : 'Pick an affordable technique.'));
    if (opened) {
      const available = buttons.some((button) => !button.disabled);
      const actionReason = selected
        ? ''
        : noMoves ? 'Both moves are used this turn'
          : available ? 'Select a technique to research'
            : options.length === 0 ? 'Nothing to research early right now'
              : 'No listed technique is affordable or available this turn';
      setActionDisabled(opened.querySelector('.dialog-ok'), actionReason);
    }
  }
  wireChoices(group, buttons, (id) => { selected = id; error.textContent = ''; renderSelection(); });

  let opened;
  opened = openDialog(overlayRoot, {
    title: 'Research a technique early',
    subtitle: `Era ${state.era} · ${Math.round(projected.researchPoints)} research points available`,
    left: { title: 'Team', content: teamPanel(state) },
    right: { title: 'Research', content: rightContent },
    body,
    okLabel: 'Research',
    onOk() {
      if (!selected) { error.textContent = 'Choose an affordable technique.'; return; }
      const result = game.addMove({ type: 'research', techId: selected });
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The research could not be queued.';
    },
  });
  finishDialog(opened, 'research', foot.root);
  renderSelection();
  return opened;
}

export function openEmergency(game, overlayRoot) {
  const state = game.state;
  const projected = projectQueue(state, game.queue);
  const usedBefore = new Set(state.flags.emergencyUsed ?? []);
  const used = new Set(projected.flags.emergencyUsed ?? []);
  const noMoves = game.movesLeft() === 0;
  const covered = inDangerZone(state) && !inDangerZone(projected);
  const outsideDangerZone = !inDangerZone(projected);
  const queued = new Set(game.queue.moves
    .filter((move) => move.type === 'emergency')
    .map((move) => move.option));
  const options = Object.entries(EMERGENCY_OPTIONS).map(([id, consequence]) => ({ id, consequence }));
  let selected = options.find((option) => (
    !noMoves && !covered && !outsideDangerZone && !used.has(option.id) && !queued.has(option.id)
  ))?.id ?? '';
  let acquihireArmed = false;
  const body = document.createElement('div');
  const group = document.createElement('div');
  group.className = 'company-option-grid emergency-grid';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Emergency options');
  const buttons = options.map((option) => simpleCard({
    id: option.id,
    monogram: EMERGENCY_NAMES[option.id][0],
    name: EMERGENCY_NAMES[option.id],
    kind: 'emergency option',
    chip: option.id === 'acquihire' ? 'Ends the run' : '',
    explanation: option.consequence,
    disabled: noMoves || covered || outsideDangerZone || used.has(option.id) || queued.has(option.id),
    reason: noMoves
      ? 'Both moves are used this turn'
      : covered ? 'A queued move already covers the shortfall'
        : outsideDangerZone ? 'Emergency options open only when runway is short'
          : usedBefore.has(option.id) ? 'Already used'
            : queued.has(option.id) ? 'This emergency option is already queued this turn'
              : used.has(option.id) ? 'Already used' : '',
  }));
  group.append(...buttons);
  const error = errorBox();
  const foot = footer('Emergency help uses 1 of 2 moves this turn');
  const rightContent = document.createElement('div');
  body.append(group, error);

  function renderSelection() {
    setSelected(buttons, selected);
    rightContent.replaceChildren(statusPanel([
      ['Cash now', money(projected.cash)],
      ['Runway', months(runwayNow(projected))],
      ['Options used', `${used.size}`],
    ]));
    const ok = opened?.querySelector('.dialog-ok');
    if (ok) ok.textContent = selected === 'acquihire' ? 'Accept — the run ends' : 'Use option';
  }
  wireChoices(group, buttons, (id) => {
    selected = id;
    acquihireArmed = false;
    error.textContent = '';
    renderSelection();
  });

  let opened;
  opened = openDialog(overlayRoot, {
    title: 'Emergency options',
    subtitle: 'Runway is short · choose a last resort',
    left: { title: 'Team', content: teamPanel(state) },
    right: { title: 'Right now', content: rightContent },
    body,
    okLabel: selected === 'acquihire' ? 'Accept — the run ends' : 'Use option',
    onOk() {
      if (!selected) { error.textContent = 'Choose an unused option.'; return; }
      if (selected === 'acquihire' && !acquihireArmed) {
        acquihireArmed = true;
        error.textContent = 'Click again to confirm. This ends the run.';
        opened.querySelector('.dialog-ok').textContent = 'Confirm — end the run';
        return;
      }
      const result = game.addMove({ type: 'emergency', option: selected });
      if (result.ok) opened.close();
      else error.textContent = result.error ?? 'The emergency option could not be queued.';
    },
  });
  finishDialog(opened, 'emergency', foot.root);
  renderSelection();
  return opened;
}

export function mountCompany(game, overlayRoot) {
  const unregister = [
    registerMenuHandler('deals', () => openDeals(game, overlayRoot)),
    registerMenuHandler('raise', () => openRaise(game, overlayRoot)),
    registerMenuHandler('research', () => openResearch(game, overlayRoot)),
    registerMenuHandler('emergency', () => openEmergency(game, overlayRoot)),
  ];
  return () => unregister.forEach((remove) => remove());
}

export function mountTurnSummary(overlayRoot, game) {
  let toast = null;
  let removeEscape = null;
  let pendingFrame = null;
  let pendingSummaries = null;

  const removeToast = () => {
    toast?.remove();
    toast = null;
    removeEscape?.();
    removeEscape = null;
  };

  const dismiss = () => {
    if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    pendingFrame = null;
    pendingSummaries = null;
    removeToast();
  };

  const schedule = () => {
    if (!pendingSummaries || pendingFrame !== null) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      if (!pendingSummaries || overlayRoot.querySelector('.dialog-layer')) return;
      const summaries = pendingSummaries;
      pendingSummaries = null;
      removeToast();
      toast = document.createElement('section');
      toast.className = 'turn-summary';
      toast.setAttribute('aria-live', 'polite');
      const header = document.createElement('div');
      header.className = 'turn-summary-header';
      const title = document.createElement('strong');
      title.textContent = 'This turn';
      const close = document.createElement('button');
      close.type = 'button';
      close.setAttribute('aria-label', 'Dismiss turn summary');
      close.textContent = '×';
      close.addEventListener('click', dismiss);
      header.append(title, close);
      const list = document.createElement('ul');
      for (const summary of summaries) {
        const item = document.createElement('li');
        item.textContent = summary;
        list.append(item);
      }
      toast.append(header, list);
      overlayRoot.append(toast);

      const onEscape = (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        dismiss();
      };
      addEventListener('keydown', onEscape);
      removeEscape = () => removeEventListener('keydown', onEscape);
    });
  };

  const onDialogClosed = () => schedule();
  overlayRoot.addEventListener('gdt-dialog-closed', onDialogClosed);
  const unsubscribe = game.subscribe(({ state, events, errors }) => {
    if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    pendingFrame = null;
    removeToast();
    const summaries = turnSummary([
      ...events,
      ...errors.map((error) => ({ type: 'error', error })),
    ], state);
    pendingSummaries = summaries.length > 0 ? summaries : null;
    schedule();
  });

  return () => {
    unsubscribe();
    overlayRoot.removeEventListener('gdt-dialog-closed', onDialogClosed);
    dismiss();
  };
}
