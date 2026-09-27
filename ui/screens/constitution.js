// The Head of Safety's constitution draft (the review page's look B): a paper document over the office, with the
// hard lines and worked examples in the main column and the advisors' comments in the margin. The player picks three
// lines and a ruling per example; "Adopt and train" stores the draft for the next run that trains on it.
// Picking the recipe's "Train on a written constitution" card opens it (mountConstitution below).
import { draftFor, hasConstitution } from '../../sim/constitution.js';
import { documentView } from '../logic/constitution.js';
import { registerCardOpener } from './recipe.js';

const MAX_LINES = 3;

// OWNER WRITES: the four margin comments (the review page's lines, look B).
const COMMENTS = [
  { who: 'Head of Safety', on: 'on line 4', text: '“Even if we ask” is the point. A rule we can switch off is a setting.' },
  { who: 'Head of Research', on: 'on line 6', text: 'You swapped this out. Thank you. The agents team sends a fruit basket.' },
  { who: 'CFO', on: 'on example 4', text: 'Can we define “concerns”? Our biggest customer has several.' },
  { who: 'Policy and Comms', on: 'on example 6', text: '“Answer fully” reads well until the government client reads it.' },
];

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const button = (className, text) => {
  const node = el('button', className, text);
  node.type = 'button';
  return node;
};

const focusable = (root) => [...root.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])')];

// onCancel runs when the document closes without Adopt (Close, Escape, or another copy opening over it).
export function openConstitution(game, overlayRoot, { onAdopt, onCancel } = {}) {
  overlayRoot.querySelector('.sd-layer')?.close?.();
  const stored = draftFor(game.state);
  const local = { hardLines: [...stored.hardLines], rulings: { ...stored.rulings } };
  const previousFocus = document.activeElement;
  const stage = overlayRoot.closest('#stage');
  let openCase = null; // the example whose three rulings are showing
  let error = '';

  // dialog-layer: the clock holds while the document is open and the floor ignores clicks (ui/clock.js, ui/main.js).
  const layer = el('div', 'dialog-layer sd-layer');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'sd-title');
  layer.tabIndex = -1; // a click on bare layer keeps focus inside, so Escape and the Tab trap keep working
  const veil = el('div', 'sd-veil');
  veil.setAttribute('aria-hidden', 'true');
  const doc = el('article', 'sd-doc');
  doc.tabIndex = -1;
  layer.append(veil, doc);
  // The veil can't take focus: without this a click on it would move focus to <body> and Escape would stop working.
  veil.addEventListener('mousedown', (event) => {
    event.preventDefault();
    if (!layer.contains(document.activeElement)) doc.focus();
  });

  let closed = false;
  const close = (adopted = false) => {
    if (closed) return;
    closed = true;
    stage?.classList.remove('sd-open');
    layer.remove();
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
    if (!adopted) onCancel?.();
  };
  Object.defineProperty(layer, 'close', { value: () => close() });

  function toggleLine(id) {
    const index = local.hardLines.indexOf(id);
    if (index >= 0) local.hardLines.splice(index, 1);
    else if (local.hardLines.length < MAX_LINES) local.hardLines.push(id);
    else return;
    error = '';
    render(`[data-line="${id}"]`);
  }

  function pick(caseId, optionId) {
    local.rulings[caseId] = optionId;
    openCase = null;
    error = '';
    render(`[data-change="${caseId}"]`);
  }

  function adopt() {
    const result = game.setField('constitutionDraft', { hardLines: [...local.hardLines], rulings: { ...local.rulings } });
    if (result && result.ok === false) {
      error = result.error ?? 'The draft could not be adopted.';
      render('.sd-adopt');
      return;
    }
    close(true);
    onAdopt?.();
  }

  function clause(line, full) {
    const row = button(`sd-line${line.on ? ' on' : ''}${!line.on && line.tag ? ' struck' : ''}`);
    row.dataset.line = line.id;
    row.setAttribute('role', 'checkbox');
    row.setAttribute('aria-checked', `${line.on}`);
    const blocked = full && !line.on;
    if (blocked) {
      row.setAttribute('aria-disabled', 'true');
      row.title = 'Untick a line first: the spec keeps three.';
    }
    const copy = el('span', 'sd-line-copy');
    copy.append(el('span', 'sd-line-text', line.text));
    if (line.tag) {
      const who = line.tag.endsWith('asked') ? ' ask' : line.tag.includes('you') ? ' you' : '';
      copy.append(el('span', `sd-tag${who}`, line.tag));
    }
    row.append(el('span', 'sd-box'), copy);
    row.addEventListener('click', () => toggleLine(line.id));
    return row;
  }

  function example(entry, index) {
    const row = el('div', `sd-case${entry.changedBy ? ' changed' : ''}${openCase === entry.id ? ' open' : ''}`);
    const text = el('div', 'sd-case-copy');
    text.append(el('q', 'sd-prompt', `${index + 1} · ${entry.prompt}`));
    const ruling = el('div', 'sd-ruling');
    const current = entry.options.find((option) => option.on);
    ruling.append(el('span', 'sd-ins', current?.label ?? 'No ruling yet'));
    if (entry.changedBy) ruling.append(el('span', 'sd-del', entry.proposed.label));
    text.append(ruling);
    const acts = el('div', 'sd-acts');
    if (entry.changedBy) acts.append(el('span', `sd-status${entry.changedBy.endsWith('asked') ? ' ask' : ''}`, entry.changedBy));
    const change = button('sd-change', openCase === entry.id ? 'Done' : 'Change');
    change.dataset.change = entry.id;
    change.setAttribute('aria-expanded', `${openCase === entry.id}`);
    change.addEventListener('click', () => {
      openCase = openCase === entry.id ? null : entry.id;
      render(`[data-change="${entry.id}"]`);
    });
    acts.append(change);
    row.append(text, acts);
    if (openCase === entry.id) {
      const options = el('div', 'sd-options');
      options.setAttribute('role', 'radiogroup');
      options.setAttribute('aria-label', `Ruling for example ${index + 1}`);
      for (const option of entry.options) {
        const choice = button(`sd-option${option.on ? ' on' : ''}`);
        choice.setAttribute('role', 'radio');
        choice.setAttribute('aria-checked', `${option.on}`);
        choice.append(el('i'), el('span', '', option.label));
        if (option.id === entry.proposed.id) choice.append(el('small', '', 'Safety’s ruling'));
        choice.addEventListener('click', () => pick(entry.id, option.id));
        options.append(choice);
      }
      row.append(options);
    }
    return row;
  }

  function render(focusSelector) {
    const view = documentView(game.state, { ...local, changes: stored.changes });
    const onCount = view.lines.filter((line) => line.on).length;
    doc.replaceChildren();

    const main = el('div', 'sd-main');
    main.append(el('div', 'sd-kicker', view.kicker));
    const title = el('h1', 'sd-title', view.title);
    title.id = 'sd-title';
    main.append(title);

    const linesHead = el('h2', 'sd-h');
    linesHead.append(el('span', '', 'Hard constraints'), el('small', '', view.linesNote));
    const clauses = el('div', 'sd-clauses');
    for (const line of view.lines) clauses.append(clause(line, onCount >= MAX_LINES));
    const fixed = el('div', 'sd-line fixed');
    const fixedCopy = el('span', 'sd-line-copy');
    fixedCopy.append(el('span', 'sd-line-text', `${view.fixed} (always)`));
    fixed.append(el('span', 'sd-box'), fixedCopy);
    clauses.append(fixed);
    main.append(linesHead, clauses);

    const casesHead = el('h2', 'sd-h');
    casesHead.append(el('span', '', 'Worked examples'), el('small', '', 'her proposed rulings, shown as changes'));
    const cases = el('div', 'sd-cases');
    view.cases.forEach((entry, index) => cases.append(example(entry, index)));
    main.append(casesHead, cases);

    const margin = el('aside', 'sd-margin');
    const notes = el('div', 'sd-notes'); // scrolls on its own, so the adopt button stays in view
    if (view.changes.length) {
      notes.append(el('h3', 'sd-margin-h', 'Changes'));
      for (const change of view.changes) {
        const card = el('div', 'sd-note change');
        const head = el('b');
        head.append(el('span', '', change.source), el('span', 'sd-when', change.when));
        card.append(head, el('span', '', change.text));
        notes.append(card);
      }
    }
    notes.append(el('h3', 'sd-margin-h', 'Comments'));
    for (const comment of COMMENTS) {
      const card = el('div', 'sd-note');
      const head = el('b');
      head.append(el('span', '', comment.who), el('span', 'sd-when', comment.on));
      card.append(head, el('span', '', comment.text));
      notes.append(card);
    }
    const foot = el('div', 'sd-foot');
    const note = el('p', `sd-foot-note${error || !view.valid ? ' warn' : ''}`,
      error || view.reason || 'Keep each ruling, or change it to one of the other two.');
    note.id = 'sd-foot-note';
    note.setAttribute('aria-live', 'polite');
    const adoptButton = button('btn sd-adopt', 'Adopt and train');
    adoptButton.disabled = !view.valid;
    adoptButton.setAttribute('aria-describedby', 'sd-foot-note');
    adoptButton.addEventListener('click', adopt);
    const closeButton = button('dialog-back sd-close', 'Close');
    closeButton.addEventListener('click', () => close());
    foot.append(note, adoptButton, closeButton);
    margin.append(notes, foot);

    doc.append(main, margin);
    const target = focusSelector && doc.querySelector(focusSelector);
    if (target) target.focus();
    doc.querySelector('.sd-options')?.scrollIntoView({ block: 'nearest' }); // the last examples open below the fold
  }

  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusable(layer);
    if (items.length === 0) return;
    const firstItem = items[0];
    const lastItem = items.at(-1);
    if (!items.includes(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? lastItem : firstItem).focus();
    } else if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault();
      lastItem.focus();
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault();
      firstItem.focus();
    }
  });

  render();
  stage?.classList.add('sd-open');
  overlayRoot.append(layer);
  layer.classList.add('dialog-open');
  doc.focus();
  return layer;
}

// The chip under the recipe card once a draft exists: which version the next run teaches, which version is live, and
// how many demands changed the draft since. None before the first draft. It names no model: a run without the card
// keeps the old live version, so the latest model is not always the one that learned it.
export function constitutionNote(state) {
  if (!state.constitutionDraft && !hasConstitution(state)) return null;
  const live = state.constitution?.version ?? 0;
  const count = state.constitutionDraft?.changes?.length ?? 0;
  const plural = `${count} change${count === 1 ? '' : 's'}`;
  // OWNER WRITES: the chip's wording (the review page's step 3 picture).
  const head = `v${live + 1} draft · ${live ? `v${live} is live` : 'no model has learned it yet'}`;
  const changes = count ? `${plural} ${live ? `since v${live}` : 'so far'}` : '';
  return { text: changes ? `${head}\n${changes}` : head, later: false }; // the changes go on a second line
}

// Picking the constitution card opens the draft; closing it without Adopt takes the card back out of the recipe.
export function mountConstitution(game, overlayRoot) {
  registerCardOpener('constitution', {
    open: (openGame, card, { unpick }) => openConstitution(openGame, overlayRoot, {
      onCancel() {
        unpick(); // redraws the list, so focus goes back to the card's new row
        [...overlayRoot.querySelectorAll('.tech-row')].find((row) => row.querySelector('.tech-name')?.textContent === card.name)?.focus();
      },
    }),
    note: (state) => constitutionNote(state),
  });
}
