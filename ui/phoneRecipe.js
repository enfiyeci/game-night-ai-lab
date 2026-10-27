// The training run builder on a phone (owner sign-off 2026-10-27, https://claude.ai/artifact/SKZKLiRAu5pxgYQaGWDr8n,
// R1-R12 with R9 changed). ui/phone.css lays the desktop dialog out on both halves without moving any of its nodes;
// this adds the few phone-only controls and keeps their words in step with what the dialog shows:
// a close button (R1), the size-and-length summary row that opens the chips over the right half (R9), the team row
// (R6), the picked techniques with "Choose techniques" (R7), the briefing that opens in full on a tap (R5), and the
// back rows and Done buttons of the sheets. A sheet is a class on the layer: pn-sheet-setup, -team, -list or -brief.
// Classes are only ever changed when they differ: the layer is a direct child of #overlay, whose observer in ui/phone.js
// calls back here, and even removing an absent class counts as a change.

const SHEETS = ['pn-sheet-setup', 'pn-sheet-team', 'pn-sheet-list', 'pn-sheet-brief'];
const OPENERS = { 'pn-sheet-setup': '.pn-setup', 'pn-sheet-team': '.pn-team', 'pn-sheet-list': '.pn-choose', 'pn-sheet-brief': '.recipe-brief' };
const WORDS = ['no', 'one', 'two', 'three', 'four'];
const QUIET = new Set(['calm', 'no briefing yet']);

// "Team · CFO alarmed, three calm" from the Team panel's rows; the leads who are not calm are named. Three parts, so
// the named ones can be set apart: [lead-in, who is not calm, the rest].
export function teamParts(rows) {
  const read = rows.filter((row) => row.mood.toLowerCase() !== 'no briefing yet');
  if (read.length === 0) return ['Team · no briefing yet', '', ''];
  const loud = read.filter((row) => !QUIET.has(row.mood.toLowerCase())).map((row) => `${row.name} ${row.mood.toLowerCase()}`);
  const calm = read.length - loud.length;
  if (loud.length === 0) return [`Team · ${calm === rows.length ? 'all ' : ''}${WORDS[calm] ?? calm} calm`, '', ''];
  return ['Team · ', loud.join(', '), calm ? `, ${WORDS[calm] ?? calm} calm` : ''];
}
export const teamSummary = (rows) => teamParts(rows).join('');

// A socket's small line reads "Group · cost"; the cost itself may hold more dots ("$20M · +15% compute").
export function pickPrice(detail) {
  const at = detail.indexOf(' · ');
  return at < 0 ? '' : detail.slice(at + 3);
}

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const setText = (node, text) => { if (node.textContent !== text) node.textContent = text; };

function setSheet(layer, sheet) {
  for (const name of SHEETS) if (layer.classList.contains(name) !== (name === sheet)) layer.classList.toggle(name, name === sheet);
  for (const [name, opener] of Object.entries(OPENERS)) {
    const node = layer.querySelector(opener);
    if (node?.hasAttribute('aria-expanded') && node.getAttribute('aria-expanded') !== `${name === sheet}`) node.setAttribute('aria-expanded', `${name === sheet}`);
  }
}

function openSheet(layer, sheet, focus) {
  setSheet(layer, sheet);
  focus?.focus({ preventScroll: true });
}

function closeSheets(layer) {
  const was = SHEETS.find((name) => layer.classList.contains(name));
  if (!was) return false;
  setSheet(layer, null);
  layer.querySelector(OPENERS[was])?.focus({ preventScroll: true });
  return true;
}

function button(className, label, onClick) {
  const node = make('button', className, label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

// Built once per dialog: the controls that do not depend on the stage.
function build(layer) {
  const centre = layer.querySelector('.dialog-centre');
  const left = layer.querySelector('.dialog-left');
  const right = layer.querySelector('.dialog-right');
  if (!centre) return;
  layer.dataset.pnBuilt = '1';

  const close = button('pn-close', '', () => layer.querySelector('.dialog-veil')?.click());
  close.setAttribute('aria-label', 'Close the training run');
  close.innerHTML = '<svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14"/></svg>';
  const chevron = () => {
    const node = make('span', 'pn-chev', '›');
    node.setAttribute('aria-hidden', 'true');
    return node;
  };
  const setup = button('pn-setup', '', () => openSheet(layer, 'pn-sheet-setup', layer.querySelector('.pn-setup-done')));
  setup.append(make('span', 'pn-setup-text'), chevron());
  setup.setAttribute('aria-expanded', 'false');
  const setupHead = make('div', 'pn-setup-head', 'Model size and training length');
  const setupDone = button('pn-setup-done', 'Done', () => closeSheets(layer));
  const team = button('pn-team', '', () => openSheet(layer, 'pn-sheet-team', left?.querySelector('.pn-sheet-back')));
  team.append(make('span', 'pn-team-text'), chevron());
  team.setAttribute('aria-expanded', 'false');
  const picks = make('div', 'pn-picks');
  picks.setAttribute('aria-label', 'Techniques picked for this stage');
  picks.setAttribute('role', 'list');
  const choose = button('pn-choose', '', () => openSheet(layer, 'pn-sheet-list', right?.querySelector('.pn-sheet-back')));
  choose.append(make('span', 'pn-choose-text', 'Choose techniques'), make('small', 'pn-choose-count'), chevron());
  choose.setAttribute('aria-expanded', 'false');
  centre.append(close, setup, setupHead, setupDone, team, picks, choose);

  if (left) {
    const back = button('pn-sheet-back', 'Team', () => closeSheets(layer));
    left.prepend(back);
  }
  if (right) {
    const back = button('pn-sheet-back', 'Techniques', () => closeSheets(layer));
    back.append(make('small', 'pn-list-count'));
    right.prepend(back);
    right.append(button('pn-done', 'Done', () => closeSheets(layer)));
  }

  // A key press closes an open sheet before it can close the dialog.
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.documentElement.classList.contains('phone') && closeSheets(layer)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

// The right half must keep its buttons on screen: when it runs long (a full set of picks, the compute help) the briefing
// gives up lines, then the pick rows go (the count stays on "Choose techniques"), then the briefing itself (it still
// opens from nowhere else, so this last step is a safety net for very short windows). The steps are classes on the centre panel, which the overlay's observer does not watch.
const TIGHT = ['pn-tight-1', 'pn-tight-2', 'pn-tight-3', 'pn-tight-4'];
export function fitRight(layer) {
  const root = document.documentElement;
  const centre = layer.querySelector('.dialog-centre');
  const actions = centre?.querySelector('.dialog-actions');
  if (!actions) return;
  centre.classList.remove(...TIGHT);
  if (!root.classList.contains('phone') || root.classList.contains('pn-tall')) return; // upright, the panel scrolls
  const fits = () => {
    const box = actions.getBoundingClientRect();
    return box.width === 0 || (box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1);
  };
  for (let level = 0; level < TIGHT.length && !fits(); level += 1) centre.classList.add(TIGHT[level]);
}

// The briefing shows its first lines on a small screen; a tap opens it in full over the right half with Done (R5). On
// the opened Duo, and on desktop, it is plain text again. Wired again with each stage's body.
function wireBrief(layer, brief, active) {
  if (!brief) return;
  if (!brief.dataset.pnWired) {
    brief.dataset.pnWired = '1';
    const open = () => {
      if (brief.getAttribute('role') !== 'button') return;
      if (layer.classList.contains('pn-sheet-brief')) closeSheets(layer);
      else openSheet(layer, 'pn-sheet-brief', layer.querySelector('.pn-setup-done'));
    };
    brief.addEventListener('click', open);
    brief.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (brief.getAttribute('role') !== 'button') return;
      event.preventDefault();
      open();
    });
  }
  if (active && brief.getAttribute('role') !== 'button') {
    brief.setAttribute('role', 'button');
    brief.tabIndex = 0;
    brief.setAttribute('aria-expanded', `${layer.classList.contains('pn-sheet-brief')}`);
  } else if (!active && brief.hasAttribute('role')) {
    brief.removeAttribute('role');
    brief.removeAttribute('tabindex');
    brief.removeAttribute('aria-expanded');
  }
}

// Called by ui/phone.js when the layout leaves phone mode (a tablet turning): the briefing is text again, sheets close.
export function undecorateRecipe(layer) {
  if (!layer.dataset.pnBuilt) return;
  setSheet(layer, null);
  wireBrief(layer, layer.querySelector('.recipe-brief'), false);
}

// Words that follow the dialog: called on every overlay change, so it writes only what differs.
export function decorateRecipe(layer, { roomy = false } = {}) {
  if (!layer.dataset.pnBuilt) build(layer);
  wireBrief(layer, layer.querySelector('.recipe-brief'), !roomy);
  // Sheets belong to small screens: a Duo unfolding shows all of it at once.
  if (roomy && SHEETS.some((name) => name !== 'pn-sheet-team' && layer.classList.contains(name))) setSheet(layer, null);

  const chosen = [...layer.querySelectorAll('.recipe-choice-row')]
    .map((row) => row.querySelector('.recipe-chip[aria-pressed="true"] span')?.textContent ?? '');
  const setupText = layer.querySelector('.pn-setup-text');
  if (setupText) setText(setupText, chosen.filter(Boolean).join(' · '));
  layer.querySelector('.pn-setup')?.setAttribute('aria-label', `Model size and training length: ${chosen.filter(Boolean).join(', ')}. Change`);
  if (!chosen.length && layer.classList.contains('pn-sheet-setup')) setSheet(layer, null); // stages 2 and 3 have no size or length

  const rows = [...layer.querySelectorAll('.dialog-left .budget-team-row')].map((row) => ({
    name: row.querySelector('.budget-team-name')?.textContent ?? '',
    mood: row.querySelector('.budget-team-mood')?.textContent ?? '',
  }));
  const teamText = layer.querySelector('.pn-team-text');
  const parts = teamParts(rows);
  if (teamText && teamText.dataset.key !== parts.join('|')) {
    teamText.dataset.key = parts.join('|');
    const loud = make('em', '', parts[1]);
    teamText.replaceChildren(parts[0], ...(parts[1] ? [loud] : []), parts[2]);
  }

  const count = layer.querySelector('.tech-sockets')?.getAttribute('aria-label') ?? '';
  const [picked = '0', slots = '0'] = count.match(/\d+/g) ?? [];
  setText(layer.querySelector('.pn-choose-count') ?? make('i'), `${picked} of ${slots}`);
  setText(layer.querySelector('.pn-list-count') ?? make('i'), `${picked} of ${slots} picked`);
  const list = layer.querySelector('.pn-picks');
  if (list) {
    const items = [...layer.querySelectorAll('.tech-socket:not(.empty)')].map((socket, index) => [
      `${index + 1}`, socket.querySelector('.tech-socket-words b')?.textContent ?? '', pickPrice(socket.querySelector('.tech-socket-words small')?.textContent ?? ''),
    ]);
    const key = JSON.stringify(items);
    if (list.dataset.key !== key) {
      list.dataset.key = key;
      list.replaceChildren(...items.map(([number, name, price]) => {
        const item = make('div', 'pn-pick');
        item.setAttribute('role', 'listitem');
        item.append(make('span', 'pn-pick-number', number), make('span', 'pn-pick-name', name), make('small', 'pn-pick-price', price));
        return item;
      }));
    }
  }

  // The Geneva deal's tick box sits above the buttons; the buttons keep room for it (ui/phone.css).
  const cap = layer.querySelector(':scope > .dl-cap-panel');
  // While a sheet hides the box it measures nothing; the last height is kept for when it comes back.
  const capHeight = !cap ? '' : cap.getClientRects().length ? `${Math.ceil(cap.getBoundingClientRect().height)}px` : layer.style.getPropertyValue('--pn-cap-h');
  if (layer.style.getPropertyValue('--pn-cap-h') !== capHeight) {
    if (capHeight) layer.style.setProperty('--pn-cap-h', capHeight);
    else layer.style.removeProperty('--pn-cap-h');
  }

  fitRight(layer);

  // On the opened Duo the technique list sits above the team row, the compute bar and the buttons, which keep the
  // bottom of the right half; measured, since the help box under the bar grows and shrinks.
  const team = layer.querySelector('.pn-team');
  if (roomy && team?.offsetParent) {
    const bottom = `${Math.max(0, Math.round(innerHeight - team.getBoundingClientRect().top + 10))}px`;
    if (layer.style.getPropertyValue('--pn-side-bottom') !== bottom) layer.style.setProperty('--pn-side-bottom', bottom);
  }
}
