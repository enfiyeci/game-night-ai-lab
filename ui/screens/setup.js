// Before the clock starts (owner pick SB, 2026-10-14; mockup frames SB1 and SB2): the player hires a lead for each of
// the four seats from two paper résumés fanned on the dimmed office, one seat at a time, then signs the CFO's
// use-of-funds memo that sets the first year's budget split. The same paperwork as the funding round (company.js
// openRaise): sheets in a radio group, the button on the chosen sheet. There is no way out: the lab needs its leads.
import { SEATS, hireLead } from '../../sim/leads.js';
import { portrait } from '../components/portraits.js';
import { enterTransition, exitTransition } from '../components/transition.js';
import { memoModel, resumeStep, startValues } from '../logic/setup.js';
import { handle } from './budget.js';
import { choice, paperLayer, setSelected, wireChoices } from './company.js';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const focusable = (root) => [...root.querySelectorAll('button:not([disabled])')]
  .filter((node) => node.tabIndex >= 0 && !node.closest('[hidden]'));

function resumeSheet(person, step, labName) {
  const sheet = choice(`paper-sheet resume-sheet resume-${person.id}`, person.id); // the rule's colour: ui/styles.css
  sheet.setAttribute('aria-label', `${person.name}, for ${step.title}. ${person.known.join('. ')}. “${person.quote}”`);
  const head = make('span', 'resume-head');
  const face = make('span', 'resume-face');
  face.innerHTML = portrait(person.look, 64, 'happy');
  const who = make('span');
  who.append(make('span', 'paper-kicker', 'Résumé'), make('strong', 'resume-name', person.name));
  head.append(face, who);
  const known = make('span', 'resume-known');
  for (const line of person.known) known.append(make('span', null, line));
  const sign = make('span', 'resume-sig');
  sign.append(make('span', null, 'References on request'), make('span', 'resume-sig-hire', 'Hire'));
  sheet.append(head, make('span', 'resume-for', `for ${step.title}, ${labName || 'your lab'}`), known,
    make('span', 'resume-quote', `“${person.quote}”`), sign);
  return sheet;
}

// onDone() runs once the memo is signed and the paperwork has left.
export function openSetup(game, overlayRoot, { onDone } = {}) {
  const labName = typeof game.state.labName === 'string' ? game.state.labName.trim() : '';
  const { layer, desk } = paperLayer('setup', { title: 'Hire your leads', subtitle: 'Before the lab opens: four leads, then the first year’s money' });
  const previousFocus = document.activeElement;
  game.clock?.pause('setup');

  function resumes(index) {
    const step = resumeStep(game.state, index);
    let selected = step.candidates[0].id;
    const fan = make('div', 'paper-fan setup-fan');
    fan.setAttribute('role', 'radiogroup');
    fan.setAttribute('aria-label', `Résumés for ${step.title}`);
    const slots = [];
    const sheets = step.candidates.map((person, at) => {
      const slot = make('div', `paper-slot setup-slot setup-slot-${at}`);
      const sheet = resumeSheet(person, step, labName);
      slot.append(sheet);
      slots.push(slot);
      return sheet;
    });
    fan.append(...slots);
    const hire = make('button', 'btn paper-action resume-hire');
    hire.type = 'button';
    // As the raise's Sign: outside the radio group, in a holder that takes the chosen sheet's place.
    const holder = make('div', 'paper-slot setup-slot paper-sign-holder selected');
    holder.append(hire);
    const foot = make('div', 'paper-foot setup-foot');
    foot.append(make('span', 'paper-foot-note', step.foot));
    desk.replaceChildren(desk.firstElementChild, fan, holder, foot);

    function render() {
      setSelected(sheets, selected);
      const at = step.candidates.findIndex((person) => person.id === selected);
      slots.forEach((slot, i) => slot.classList.toggle('selected', i === at));
      holder.className = `paper-slot setup-slot paper-sign-holder selected setup-slot-${at}`;
      hire.textContent = `Hire ${step.candidates[at].first}`;
    }
    wireChoices(fan, sheets, (id) => { selected = id; render(); });
    hire.addEventListener('click', (event) => {
      // The next seat's Hire button lands under the pointer, so a double-click's second click must not hire for it.
      if (event.detail > 1) return;
      hireLead(game.state, step.seat, selected); // before the clock starts: no round to queue it in
      document.dispatchEvent(new CustomEvent('ai-lab:leads')); // the office seats the new lead (ui/office.js)
      if (index + 1 < SEATS.length) resumes(index + 1);
      else memo();
    });
    render();
    sheets.find((sheet) => sheet.tabIndex === 0)?.focus({ preventScroll: true });
  }

  function memo() {
    const values = startValues(game.state);
    const paper = make('article', 'paper-memo setup-memo');
    const fields = make('div', 'setup-memo-meta');
    const intro = make('p', 'setup-memo-body');
    const rows = make('div', 'setup-memo-rows');
    const note = make('p', 'setup-memo-hand');
    const sign = make('button', 'btn paper-action setup-memo-sign', 'Sign and open the lab');
    sign.type = 'button';
    const error = make('div', 'dialog-error paper-error');
    error.setAttribute('role', 'alert');
    const signRow = make('div', 'setup-memo-foot');
    signRow.append(error, sign);
    paper.append(fields, intro, rows, note, signRow);
    desk.replaceChildren(desk.firstElementChild, paper);

    const first = memoModel(game.state, values, game.queue);
    for (const [label, value] of [['From:', first.from], ['To:', 'You'], ['About:', 'Use of funds, first year']]) {
      const row = make('div');
      row.append(make('b', null, label), ` ${value}`);
      fields.append(row);
    }
    note.textContent = first.note;
    const parts = first.rows.map((row) => {
      const line = make('div', 'setup-memo-row');
      const bar = make('div', 'setup-memo-bar');
      const fill = make('i');
      fill.style.background = row.colour;
      const share = make('b', 'setup-memo-share');
      bar.append(fill, handle({
        label: `${row.label} share`,
        value: row.value,
        min: 0,
        max: 100,
        step: 1,
        leftForValue: (next) => next,
        valueText: (next) => `${Math.round(next)} of 100`,
        onInput(next) { values[row.key] = next; render(); },
      }));
      line.append(make('span', null, row.label), bar, share);
      rows.append(line);
      return { key: row.key, fill, share };
    });

    function render() {
      const model = memoModel(game.state, values, game.queue);
      intro.replaceChildren('The seed money is in: ', make('b', null, model.seed),
        '. Drag the marks to tell me where it goes. At our steady pace that lasts ', make('b', null, model.runway), '.');
      for (const part of parts) {
        const row = model.rows.find((item) => item.key === part.key);
        part.fill.style.width = `${row.value}%`;
        part.share.textContent = `${row.share}%`;
      }
      return model;
    }
    sign.addEventListener('click', () => {
      const result = game.setBudget(render().budget);
      if (!result.ok) { error.textContent = result.error ?? 'The budget could not be set.'; return; }
      finish();
    });
    render();
    rows.querySelector('[role="slider"]')?.focus({ preventScroll: true });
  }

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    exitTransition(layer).then(() => {
      game.clock?.resume('setup');
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
      overlayRoot.dispatchEvent(new CustomEvent('gdt-dialog-closed'));
      onDone?.();
    });
  }

  // Focus stays on the paperwork; Esc and the veil do nothing, as there is nothing to go back to.
  layer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); return; }
    if (event.key !== 'Tab') return;
    const items = focusable(layer);
    if (items.length === 0) return;
    const at = items.indexOf(document.activeElement);
    event.preventDefault();
    items[(at + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
  });
  overlayRoot.append(layer);
  enterTransition(layer);
  resumes(0);
  return layer;
}
