import { modelName } from '../../sim/release.js';

export const HAZARD_CHOICES = [
  { id: 'penalize', label: 'Penalize the thought' },
  { id: 'fix', label: 'Fix the environment' },
  { id: 'ignore', label: 'Ignore it' },
];

// Kept as the final lines by the owner (2026-09-26). Each advisor argues from what they believe; none is fully right.
export const HAZARD_ARGUMENTS = [
  { role: 'research', title: 'Head of Research', say: 'Penalize it and move on. Clean traces, clean demo.', backs: 'penalize', width: 230, dx: -40 },
  { role: 'safety', title: 'Head of Safety', say: "Don't punish the thought. It'll just learn to stop saying it out loud.", backs: 'fix', width: 270, tail: 32, dx: 24 },
  { role: 'cfo', title: 'CFO', say: 'Nobody reads the traces. Fixing the tests costs us weeks.', backs: 'ignore', width: 240, dx: 20, dy: -40 },
];

// Illustrative, modelled on published reward-hacking examples ("Let's hack" written in a reasoning trace).
const TRACE = [
  ['ln', 'The grader only checks that verify() returns True.'],
  ['ln', 'Fixing the parser properly is hard.'],
  ['hack', "Let's hack: make verify() always return True."],
  ['ln', 'Done. All 212 tests pass.'],
  ['ok', 'Grader: passed ✓'],
];

const anchorsByEra = new Map();

async function anchorsFor(era) {
  if (!anchorsByEra.has(era)) {
    anchorsByEra.set(era, fetch(`ui/assets/anchors-era${era}.json`).then((response) => {
      if (!response.ok) throw new Error(`could not load anchors for era ${era}`);
      return response.json();
    }));
  }
  return anchorsByEra.get(era);
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The working name, by the same rule the HUD pill uses during the run.
function workingName(state) {
  const last = state.models.at(-1);
  return modelName({ family: last?.family ?? 'Kestrel', generation: (last?.generation ?? 0) + 1, size: state.pendingModel.size, tierWords: state.tierWords });
}

function buildCard(name) {
  const card = make('section', 'gp hazard-card');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'hazard-title');

  const band = make('div', 'band', 'Caught in training ');
  band.append(make('span', '', 'The game waits for you'));

  const pic = make('figure', 'hazard-pic');
  const trace = make('div', 'hazard-trace');
  trace.append(make('div', 'meta', `${name} · practice task 18,204 · fix the failing date parser`));
  for (const [kind, text] of TRACE) trace.append(make('span', kind === 'ln' ? 'ln' : `ln ${kind}`, text));
  pic.append(trace, make('figcaption', '', 'From the reasoning trace, this morning'));

  const main = make('div', 'hazard-main');
  const title = make('h1', '', 'Caught: a cheating reasoning trace');
  title.id = 'hazard-title';
  const choices = make('div', 'hazard-choices');
  for (const choice of HAZARD_CHOICES) {
    const button = make('button', 'hazard-choice', choice.label);
    button.type = 'button';
    button.dataset.choice = choice.id;
    choices.append(button);
  }
  main.append(title, make('div', 'lede', `${name} was asked to fix a bug. It rewrote the grader instead, and said so in its own notes.`), choices);

  card.append(band, pic, main);
  return card;
}

function placeBubble(layer, [x, y], { title, say, backs, width, tail = 28, dx = 0, dy = -34 }) {
  const node = make('div', 'hazard-bubble');
  node.append(make('b', '', title), make('div', '', say));
  node.append(make('span', 'chip', `✓ ${HAZARD_CHOICES.find((choice) => choice.id === backs).label}`));
  node.style.width = `${width}px`;
  node.style.setProperty('--tail', `${tail - dx}px`);
  layer.append(node);
  node.style.left = `${x - tail - 7 + dx}px`;
  node.style.top = `${y + dy - node.offsetHeight}px`;
  return node;
}

const CLOCK_REASON = 'hazard';

export function mountHazard(game, { stage, overlay }) {
  let layer = null;
  let returnFocus = null;

  function teardown() {
    if (!layer) return;
    layer.remove();
    layer = null;
    stage.classList.remove('hazard-open');
    game.clock?.resume?.(CLOCK_REASON);
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  }

  function close(choiceId) {
    teardown(); // first: the choice applies at once, and the update it sends must find the card already gone
    game.setField('hazardChoice', choiceId);
    overlay.dispatchEvent(new CustomEvent('hazard-chosen'));
    overlay.dispatchEvent(new CustomEvent('gdt-dialog-closed')); // cards, warnings and the ending film wait on this
  }

  // A .dialog-layer: it blocks the office like a veil, pauses the clock and holds event cards back until the choice.
  // The advisors' bubbles follow when the era's anchors have loaded.
  function open() {
    const state = game.state;
    returnFocus = document.activeElement;
    const opened = make('div', 'dialog-layer dialog-open hazard-layer');
    const card = buildCard(workingName(state));
    opened.append(card);
    overlay.append(opened);
    layer = opened;
    anchorsFor(state.era).then((anchors) => {
      if (layer !== opened) return;
      for (const argument of HAZARD_ARGUMENTS) {
        const head = anchors.heads[argument.role];
        if (head) placeBubble(opened, head, argument);
      }
    }).catch((error) => console.error(error)); // the card works without the bubbles

    const buttons = [...card.querySelectorAll('.hazard-choice')];
    for (const button of buttons) button.addEventListener('click', () => close(button.dataset.choice));
    // Focus stays on the choices: a click on the dim room does not move it, and Tab cycles the three buttons.
    opened.addEventListener('mousedown', (event) => {
      if (!event.target.closest('.hazard-choice')) event.preventDefault();
    });
    opened.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault(); // a choice is required
        event.stopPropagation();
        return;
      }
      if (event.key !== 'Tab') return;
      event.preventDefault();
      const index = buttons.indexOf(document.activeElement);
      const next = (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      buttons[index === -1 ? 0 : next].focus();
    });

    stage.classList.add('hazard-open');
    game.clock?.pause?.(CLOCK_REASON);
    buttons[0].focus();
  }

  // Another dialog, an event card or the screen wall already up goes first; the card opens when it closes.
  const busy = () => Boolean(overlay.querySelector('.dialog-layer, .event-layer, .screenwall-layer'));
  const shouldOpen = () => Boolean(game.state.pendingModel?.hazard) && !game.state.ending && !layer && !busy();

  function check() {
    if (layer && (!game.state.pendingModel?.hazard || game.state.ending)) teardown(); // resolved some other way
    if (shouldOpen()) open();
  }

  game.subscribe(check);
  overlay.addEventListener('event-card-closed', check);
  overlay.addEventListener('gdt-dialog-closed', check);
  check();
}
