// Game › Endings found (owner pick 7C): The Daily Token's archive. Eleven front pages lie on a wooden desk; an
// ending this browser has reached is printed with its headline, a still from its film and the film's tagline,
// and clicking it plays the film again. The rest are blank pages with a one-line hint.
import { mountFilm } from '../endings/player.js';
import { music } from '../music.js';
import { archiveModel } from '../logic/archive.js';
import { registerMenuHandler } from '../menu.js';
import { filmHost } from './end.js';
import { enterTransition, exitTransition } from '../components/transition.js';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

// The films' own taglines (ui/endings/films/*.json), fetched once; a page without one keeps the sim's line.
const taglines = new Map();
function taglineFor(id) {
  if (!taglines.has(id)) {
    taglines.set(id, fetch(`ui/endings/films/${id}.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((film) => film?.tagline ?? null)
      .catch(() => null));
  }
  return taglines.get(id);
}

function frontPage(page, index, onWatch) {
  const node = make(page.found ? 'button' : 'article', `dt-page${page.found ? ' found' : ''}`);
  node.style.setProperty('--tilt', `${[-2, 1.2, -0.8, 2, -1.5, 0.6][index % 6]}deg`);
  node.append(make('div', 'dt-mast', 'The Daily Token'));
  const line = make('div', 'dt-dateline');
  line.append(make('span', null, page.found ? page.dateline : 'Not yet printed'), make('span', null, page.found ? page.times : ''));
  node.append(line);
  if (page.found) {
    node.type = 'button';
    node.setAttribute('aria-label', `${page.title}. ${page.times}. Watch this ending again`);
    const still = make('img', 'dt-still');
    still.src = page.still;
    still.alt = '';
    const deck = make('p', 'dt-deck');
    node.append(make('h2', 'dt-head', page.title), still, deck);
    taglineFor(page.id).then((tagline) => { if (tagline) deck.textContent = tagline; });
    node.addEventListener('click', () => onWatch(page, node));
  } else {
    node.setAttribute('aria-label', `An ending not found yet. ${page.hint}`);
    const blank = make('div', 'dt-blank');
    blank.append(make('span', null, 'This story is'), make('span', null, 'still unwritten'));
    node.append(blank, make('p', 'dt-hint', page.hint));
  }
  return node;
}

export function openArchive(game, overlay, { collection }) {
  overlay.querySelector('.archive-layer')?.remove();
  const entries = collection?.entries() ?? [];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const model = archiveModel(entries);
  const previousFocus = document.activeElement;
  let watching = false;

  const layer = make('section', 'dialog-layer dialog-open archive-layer');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'dt-title');
  const top = make('header', 'dt-top');
  const title = make('h1', 'dt-title', 'The Daily Token · archive');
  title.id = 'dt-title';
  const words = make('div');
  words.append(title, make('p', 'dt-sub', model.found ? `${model.printed} · click one to watch its ending again` : model.printed));
  const closeButton = make('button', 'btn dt-close', 'Close');
  closeButton.type = 'button';
  top.append(words, closeButton);

  const grid = make('div', 'dt-grid');
  model.pages.forEach((page, index) => grid.append(frontPage(page, index, watch)));
  if (model.toPrint) {
    const [count, rest] = model.toPrint.split(' still ');
    const left = make('div', 'dt-left');
    left.append(make('span', null, count), make('span', null, `still ${rest}`));
    grid.append(left);
  }
  layer.append(top, grid);

  function close() {
    if (watching) return;
    document.removeEventListener('keydown', onKey, true);
    exitTransition(layer).then(() => {
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
      overlay.dispatchEvent(new CustomEvent('gdt-dialog-closed')); // work that waited for the dialog layer can go on
    });
  }

  // The same film the ending played, in the end screen's host (it undoes the page zoom and holds focus while
  // the film loads); the archive stays open underneath and takes focus back on the page that was clicked.
  async function watch(page, button) {
    if (watching) return;
    watching = true;
    let skipped = false;
    music.hold('film');
    const done = () => {
      watching = false;
      music.release('film');
      host?.close();
      if (button.isConnected) button.focus();
    };
    const host = filmHost(() => {
      skipped = true;
      done();
    });
    try {
      const film = await mountFilm(host, {
        id: page.id,
        era: byId.get(page.id)?.era ?? 4,
        onDone: () => { if (!skipped) done(); },
      });
      if (skipped) {
        film.stop?.();
        return;
      }
      host?.querySelector('.film-host-loading')?.remove();
      film.play();
    } catch (error) {
      console.error(error);
      if (!skipped) done();
    }
  }

  // Esc closes the archive (the film handles its own keys); Tab stays inside it.
  function onKey(event) {
    if (watching) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...layer.querySelectorAll('button')];
    const first = items[0];
    const last = items.at(-1);
    if (!layer.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  closeButton.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  overlay.append(layer);
  enterTransition(layer);
  (grid.querySelector('.dt-page.found') ?? closeButton).focus();
  return { close, node: layer };
}

export function mountArchive(game, overlay, { collection }) {
  return registerMenuHandler('endings', () => openArchive(game, overlay, { collection }));
}
