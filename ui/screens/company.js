import { openDialog } from '../components/dialog.js';
import { projectQueue, summaryItems } from '../logic/compute.js';
import { money, months, pct } from '../logic/format.js';
import { noteText, pointsBar, usedLabel } from '../logic/paperwork.js';
import { outcomeLine } from '../logic/president.js';
import { registerMenuHandler } from '../menu.js';
import { openDeals, openQueue } from './compute.js';
import { openPowerSites } from './sites.js';
import {
  EMERGENCY_OPTIONS,
  INDEPENDENCE_ROUND_SHARE,
  INVESTORS,
  inDangerZone,
  projectBurn,
  roundAmount,
  runway,
} from '../../sim/economy.js';
import { ADVISOR_PROFILES } from '../../sim/data/advisorLines.js';
import { TECHNIQUES, techAvailable } from '../../sim/techniques.js';
import { roundWord, storyDate } from '../../sim/time.js';

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

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

function errorBox() {
  const error = make('div', 'dialog-error paper-error');
  error.setAttribute('role', 'alert');
  return error;
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

function setSelected(buttons, selected) {
  for (const button of buttons) {
    const active = button.dataset.choice === selected;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-checked', `${active}`);
    button.tabIndex = active || (!selected && !button.disabled) ? 0 : -1;
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
  button.append(make('span', 'company-card-reason', reason));
}

function choice(className, id) {
  const button = make('button', className);
  button.type = 'button';
  button.dataset.choice = id;
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', 'false');
  return button;
}

// Owner pick 5C: each decision is the paperwork it would be, laid on the dimmed office. openDialog still owns
// focus, Esc, the veil click and gdt-dialog-closed, so a stepped-aside event card returns as after any dialog.
function paperLayer(kind, { title, subtitle }) {
  const layer = make('div', `dialog-layer paper-layer paper-${kind}`);
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', `paper-title-${kind}`);
  const veil = make('div', 'dialog-veil paper-veil');
  veil.setAttribute('aria-hidden', 'true');
  const desk = make('section', 'dialog-centre paper-desk');
  desk.tabIndex = -1;
  const head = make('header', 'visually-hidden'); // the paperwork names itself; the title is for screen readers
  const heading = make('h1', null, title);
  heading.id = `paper-title-${kind}`;
  head.append(heading, make('p', null, subtitle));
  desk.append(head);
  layer.append(veil, desk);
  return { layer, desk };
}

// The team-action line, any error, and a way out, under the paperwork.
function paperFoot(note, error, close, ...actions) {
  const foot = make('div', 'paper-foot');
  const cancel = make('button', 'dialog-back paper-cancel', 'Not now');
  cancel.type = 'button';
  cancel.addEventListener('click', () => close());
  foot.append(make('span', 'paper-foot-note', note), error, cancel, ...actions);
  return foot;
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
      : projected.era < 2 ? 'Investors are not ready yet'
        : projected.flags.lastRoundEra === projected.era ? 'You already raised a round this era' : '';
  const options = Object.entries(INVESTORS).map(([id, investor]) => ({
    id,
    investor,
    amount: roundAmount(projected, id),
    ...INVESTOR_COPY[id],
  }));
  let selected = reason ? '' : options[0].id;
  const labName = typeof state.labName === 'string' ? state.labName.trim() : '';
  const { layer, desk } = paperLayer('raise', {
    title: 'Raise a round',
    subtitle: `Era ${state.era} · choose your investor`,
  });
  const actionNote = `Raising uses 1 of your 2 team actions this ${roundWord(state.era)}`;
  const fan = make('div', 'paper-fan');
  fan.setAttribute('role', 'radiogroup');
  fan.setAttribute('aria-label', 'Investors');
  const slots = [];
  const buttons = options.map((option, index) => {
    const slot = make('div', `paper-slot paper-slot-${index}`);
    const sheet = choice(`paper-sheet term-sheet investor-${option.id}`, option.id);
    const letterhead = make('span', 'term-letterhead');
    letterhead.append(make('span', 'term-mono', option.investor.name[0]), make('strong', null, option.investor.name));
    const terms = make('span', 'term-terms');
    terms.append(make('span', 'term-clause', option.chip), make('span', 'term-note', option.explanation));
    sheet.append(
      letterhead,
      make('span', 'paper-kicker', 'Term sheet'),
      make('span', 'term-amount', money(option.amount)),
      make('span', 'term-for', `for ${pct(option.investor.share)} of ${labName || 'your lab'}`),
      terms,
      make('span', 'term-after', `Cash after signing ${money(projected.cash + option.amount)}`),
      make('span', 'term-sign', labName ? `For ${labName}` : 'For the lab'),
    );
    disabledReason(sheet, reason);
    slot.append(sheet);
    slots.push(slot);
    return sheet;
  });
  fan.append(...slots);
  const sign = make('button', 'btn paper-action term-sign-button', 'Sign');
  sign.type = 'button';
  // Sign sits outside the radiogroup, in a holder that takes the chosen slot's place, so it never moves in the DOM.
  const signHolder = make('div', 'paper-slot paper-sign-holder selected');
  signHolder.append(sign);
  const error = errorBox();
  let opened;
  const close = () => opened.close();
  desk.append(fan, signHolder, paperFoot(projected.flags.independenceLost
    ? `${actionNote}. Rounds raise ${pct(1 - INDEPENDENCE_ROUND_SHARE)} less since you traded equity for compute.`
    : actionNote, error, close));

  function renderSelection() {
    setSelected(buttons, selected);
    const index = buttons.findIndex((button) => button.dataset.choice === selected);
    slots.forEach((slot, at) => slot.classList.toggle('selected', at === index));
    signHolder.className = `paper-slot paper-sign-holder selected paper-slot-${index}`;
    signHolder.hidden = index < 0;
  }
  wireChoices(fan, buttons, (id) => { selected = id; error.textContent = ''; renderSelection(); });
  sign.addEventListener('click', () => {
    if (!selected) { error.textContent = reason || 'Choose an investor.'; return; }
    const result = game.addMove({ type: 'raise', archetype: selected });
    if (result.ok) opened.close();
    else error.textContent = result.error ?? 'The round could not be queued.';
  });

  opened = openDialog(overlayRoot, { build: () => layer });
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
  const { layer, desk } = paperLayer('research', {
    title: 'Research a technique early',
    subtitle: `Era ${state.era} · ${Math.round(projected.researchPoints)} research points available`,
  });
  const memo = make('article', 'paper-memo');
  const lead = ADVISOR_PROFILES.research;
  const fields = make('div', 'memo-fields');
  for (const [label, value] of [['From', `${lead.name}, ${lead.role}`], ['To', 'You'], ['About', 'Starting a technique early']]) {
    const row = make('div');
    row.append(make('b', null, label), make('span', null, value));
    fields.append(row);
  }
  memo.append(make('div', 'paper-kicker', 'Memo'), fields, make('div', 'memo-rule'));
  memo.append(make('p', 'memo-body', options.length
    ? 'We can start one of these now. Everyone gets it later.'
    : 'Nothing can be researched early right now.'));
  const group = make('div', 'memo-list');
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Techniques available for early research');
  const buttons = options.map((technique) => {
    const button = choice('memo-item', technique.id);
    button.append(make('span', 'memo-box'), make('strong', null, technique.name), make('span', 'memo-cost', `${technique.researchCost} points`));
    const reason = noMoves
      ? `Both team actions are used this ${roundWord(state.era)}`
      : queued.has(technique.id) ? `This technique was already started this ${roundWord(state.era)}`
        : techAvailable(projected, technique.id) ? 'This technique is already available'
          : projected.researchPoints < technique.researchCost ? 'Not enough research points' : '';
    disabledReason(button, reason);
    return button;
  });
  group.append(...buttons);
  const bar = make('div', 'memo-bar');
  const barFill = make('i');
  bar.append(barFill);
  const barLabel = make('div', 'memo-bar-label');
  const barBlock = make('div', 'memo-points');
  barBlock.append(bar, barLabel);
  if (options.length) memo.append(group, barBlock);
  const approve = make('button', 'btn paper-action', 'Approve');
  approve.type = 'button';
  const error = errorBox();
  let opened;
  memo.append(paperFoot(`Researching early uses 1 of your 2 team actions this ${roundWord(state.era)}`, error, () => opened.close(), approve));
  desk.append(memo);

  function renderSelection() {
    setSelected(buttons, selected);
    // The bar follows the pick, or else the technique the lab is still saving toward.
    const tracked = options.find((technique) => technique.id === selected)
      ?? options.find((technique) => !queued.has(technique.id) && !techAvailable(projected, technique.id));
    barBlock.hidden = !tracked;
    if (tracked) {
      const points = pointsBar(projected.researchPoints, tracked.researchCost);
      barFill.style.width = `${points.fill * 100}%`;
      barLabel.textContent = `${tracked.name} · ${points.label} · ${points.rest}`;
    }
    const available = buttons.some((button) => !button.disabled);
    const actionReason = selected
      ? ''
      : noMoves ? `Both team actions are used this ${roundWord(state.era)}`
        : available ? 'Select a technique to research'
          : options.length === 0 ? 'Nothing to research early right now'
            : 'No listed technique is affordable or available right now';
    setActionDisabled(approve, actionReason);
  }
  wireChoices(group, buttons, (id) => { selected = id; error.textContent = ''; renderSelection(); });
  approve.addEventListener('click', () => {
    if (!selected) { error.textContent = 'Choose an affordable technique.'; return; }
    const result = game.addMove({ type: 'research', techId: selected });
    if (result.ok) opened.close();
    else error.textContent = result.error ?? 'The research could not be queued.';
  });

  opened = openDialog(overlayRoot, { build: () => layer });
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
  const { layer, desk } = paperLayer('emergency', {
    title: 'Emergency options',
    subtitle: 'Runway is short · choose a last resort',
  });
  const folder = make('div', 'paper-folder');
  const tab = make('div', 'folder-tab', usedLabel(used.size, options.length));
  const status = make('div', 'folder-status', `Cash ${money(projected.cash)} · runway ${months(runwayNow(projected))}`);
  const group = make('div', 'folder-papers');
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Emergency options');
  const buttons = options.map((option) => {
    const acquihire = option.id === 'acquihire';
    const button = choice(acquihire ? 'paper-letter' : 'paper-note', option.id);
    if (acquihire) {
      button.append(
        make('span', 'paper-kicker', 'A letter'),
        make('strong', 'letter-head', 'We would like to acquire your team.'),
        make('span', 'letter-body', noteText(option.consequence)),
        make('span', 'company-chip letter-chip', 'Ends the run'),
      );
    } else button.append(make('strong', null, EMERGENCY_NAMES[option.id]), make('span', 'note-body', noteText(option.consequence)));
    disabledReason(button, noMoves
      ? `Both team actions are used this ${roundWord(state.era)}`
      : covered ? 'A queued move already covers the shortfall'
        : outsideDangerZone ? 'Emergency options open only when runway is short'
          : usedBefore.has(option.id) ? 'Already used'
            : queued.has(option.id) ? `This emergency option was already started this ${roundWord(state.era)}`
              : used.has(option.id) ? 'Already used' : '');
    // Screen readers hear the option's own name; the letter's headline is its in-world voice.
    button.setAttribute('aria-label', `${EMERGENCY_NAMES[option.id]}. ${noteText(option.consequence)}${button.title ? ` ${button.title}` : ''}`);
    return button;
  });
  group.append(...buttons);
  const action = make('button', 'btn paper-action');
  action.type = 'button';
  const error = errorBox();
  let opened;
  folder.append(tab, status, group, paperFoot(`Emergency help uses 1 of your 2 team actions this ${roundWord(state.era)}`, error, () => opened.close(), action));
  desk.append(folder);

  function renderSelection() {
    setSelected(buttons, selected);
    action.textContent = selected === 'acquihire' ? 'Accept — the run ends' : 'Use option';
  }
  wireChoices(group, buttons, (id) => {
    selected = id;
    acquihireArmed = false;
    error.textContent = '';
    renderSelection();
  });
  action.addEventListener('click', () => {
    if (!selected) { error.textContent = 'Choose an unused option.'; return; }
    if (selected === 'acquihire' && !acquihireArmed) {
      acquihireArmed = true;
      error.textContent = 'Click again to confirm. This ends the run.';
      action.textContent = 'Confirm — end the run';
      return;
    }
    const result = game.addMove({ type: 'emergency', option: selected });
    if (result.ok) opened.close();
    else error.textContent = result.error ?? 'The emergency option could not be queued.';
  });

  opened = openDialog(overlayRoot, { build: () => layer });
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

// A is the quiet default; B borrows the wire-service paper language; C separates each update into its own strip.
const SUMMARY_LOOKS = ['A', 'B', 'C'];
const SUMMARY_LOOK_DEFAULT = 'A';
const SUMMARY_KINDS = {
  rival: 'Rival',
  lab: 'Your lab',
  money: 'Money',
  compute: 'Compute',
  era: 'Era',
  washington: 'Washington',
  blocked: 'Blocked',
};

function summaryLook() {
  const asked = new URLSearchParams(globalThis.location?.search ?? '').get('summary')?.toUpperCase();
  return SUMMARY_LOOKS.includes(asked) ? asked : SUMMARY_LOOK_DEFAULT;
}

function summaryRow({ kind, text, name, figure }) {
  const item = make('li', `turn-summary-item kind-${kind}`);
  const sentence = make('span', 'turn-summary-text');
  const marks = [name, figure].filter(Boolean)
    .map((part) => ({ part, at: text.indexOf(part), figure: part === figure }))
    .filter((mark) => mark.at >= 0)
    .sort((a, b) => a.at - b.at);
  let from = 0;
  for (const mark of marks) {
    if (mark.at < from) continue;
    sentence.append(text.slice(from, mark.at), make(mark.figure ? 'span' : 'b', mark.figure ? 'turn-summary-figure' : null, mark.part));
    from = mark.at + mark.part.length;
  }
  sentence.append(text.slice(from));
  const label = SUMMARY_KINDS[kind] ?? 'News';
  sentence.dataset.kind = label; // look B runs the kind into the sentence as a wire dateline
  item.append(make('span', 'turn-summary-kind', label), sentence);
  if (figure && !text.includes(figure)) item.append(make('span', 'turn-summary-extra', figure));
  return item;
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
      toast.className = `turn-summary look-${summaryLook().toLowerCase()}`;
      toast.setAttribute('aria-live', 'polite');
      const header = document.createElement('div');
      header.className = 'turn-summary-header';
      const title = document.createElement('strong');
      title.textContent = 'Just now';
      const when = make('span', 'turn-summary-date', storyDate(game.state.day).label);
      const close = document.createElement('button');
      close.type = 'button';
      close.setAttribute('aria-label', 'Dismiss');
      close.textContent = '×';
      close.addEventListener('click', dismiss);
      header.append(title, when, close);
      const list = document.createElement('ul');
      for (const summary of summaries) list.append(summaryRow(summary));
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
    const meetingEnded = events.some((event) => event.type === 'meetingOutcome');
    const skippedMeeting = 'take the President meeting with a meeting move';
    const skipped = meetingEnded && errors.includes(skippedMeeting);
    const summaries = summaryItems([
      ...events,
      ...errors.filter((error) => !(meetingEnded && error === skippedMeeting)).map((error) => ({ type: 'error', error })),
    ], state);
    for (const event of events) {
      if (event.type === 'meetingOutcome') summaries.push({ kind: 'washington', text: outcomeLine(event, { skipped }), name: 'The President', figure: null });
    }
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
