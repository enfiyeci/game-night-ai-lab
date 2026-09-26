import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { projectQueue, turnSummary } from '../logic/compute.js';
import { money, months, pct } from '../logic/format.js';
import { registerMenuHandler } from '../menu.js';
import { openDeals, openQueue } from './compute.js';
import { openPowerSites } from './sites.js';
import {
  EMERGENCY_OPTIONS,
  INVESTORS,
  inDangerZone,
  projectBurn,
  runway,
} from '../../sim/economy.js';
import { TECHNIQUES, techAvailable } from '../../sim/techniques.js';
import { roundWord } from '../../sim/time.js';

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
    ? `Both team actions are used this ${roundWord(state.era)}`
    : queued ? `A funding round was already started this ${roundWord(state.era)}`
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
  const foot = footer(`Raising uses 1 of your 2 team actions this ${roundWord(state.era)}`);
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
      ? `Both team actions are used this ${roundWord(state.era)}`
      : queued.has(technique.id) ? `This technique was already started this ${roundWord(state.era)}`
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
  const foot = footer(`Researching early uses 1 of your 2 team actions this ${roundWord(state.era)}`);
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
        : noMoves ? `Both team actions are used this ${roundWord(state.era)}`
          : available ? 'Select a technique to research'
            : options.length === 0 ? 'Nothing to research early right now'
              : 'No listed technique is affordable or available right now';
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
      ? `Both team actions are used this ${roundWord(state.era)}`
      : covered ? 'A queued move already covers the shortfall'
        : outsideDangerZone ? 'Emergency options open only when runway is short'
          : usedBefore.has(option.id) ? 'Already used'
            : queued.has(option.id) ? `This emergency option was already started this ${roundWord(state.era)}`
              : used.has(option.id) ? 'Already used' : '',
  }));
  group.append(...buttons);
  const error = errorBox();
  const foot = footer(`Emergency help uses 1 of your 2 team actions this ${roundWord(state.era)}`);
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
    registerMenuHandler('queue', () => openQueue(game, overlayRoot)),
    registerMenuHandler('power', () => openPowerSites(game, overlayRoot)),
    registerMenuHandler('raise', () => openRaise(game, overlayRoot)),
    registerMenuHandler('research', () => openResearch(game, overlayRoot)),
    registerMenuHandler('emergency', () => openEmergency(game, overlayRoot)),
  ];
  return () => unregister.forEach((remove) => remove());
}

export { openDeals, openQueue };

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
      title.textContent = 'Just now';
      const close = document.createElement('button');
      close.type = 'button';
      close.setAttribute('aria-label', 'Dismiss');
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
    if (state.ending) { // the ending film and the end-of-run screen replace the summary
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
      pendingFrame = null;
      removeToast();
      pendingSummaries = null;
      return;
    }
    // Subscribers fire every story day; a quiet day keeps whatever toast is showing.
    const summaries = turnSummary([
      ...events,
      ...errors.map((error) => ({ type: 'error', error })),
    ], state);
    if (summaries.length === 0) return;
    if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    pendingFrame = null;
    removeToast();
    pendingSummaries = summaries;
    schedule();
  });

  return () => {
    unsubscribe();
    overlayRoot.removeEventListener('gdt-dialog-closed', onDialogClosed);
    dismiss();
  };
}
