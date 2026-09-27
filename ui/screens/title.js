// The front door (owner picks 2026-09-26). First the main menu, 1C in the gn-polish menu spread: a wall of the eleven
// ending-film stills, the ones this browser has reached in colour and the rest dark. New game then shows E1
// (docs/design/mockups/K2-title-menu.html#e1): the office the night before opening day, empty and dark, with a wooden
// board lowered over the room. The lab's name is lettered on the board as the player types it. "Turn the lights on"
// lifts the board away, lights the room, brings the staff in and starts the game. The board is drawn the way the office is drawn (tools/office/gen_office.py): flat isometric
// polygons, the thin ink outline, token colour mixes, the lettering set into the wall's angle like the desk cards.
import { NAME_MAX, cleanLabName, wallModel } from '../logic/title.js';

const NS = 'http://www.w3.org/2000/svg';
const WAKE_MS = 1100;

// The office's frame: the back floor corner, and the right-wall and left-wall directions.
const O = [687.8, 320.3];
const R = [0.866, 0.5];
const L = [-0.866, 0.5];

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};
const svgNode = (tag, attrs = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};
const points = (list) => list.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');

// The board: W wide along the right wall's direction, H tall, T thick, hung by two cables from the top of the screen.
const BOARD = { a: -99, b: 99, up: 262, W: 470, H: 118, T: 16 };

function drawBoard() {
  const { a, b, up, W, H, T } = BOARD;
  const o = [O[0] + a * R[0] + b * L[0], O[1] + a * R[1] + b * L[1] - up];
  const at = (along, down = 0, back = 0) => [o[0] + along * R[0] - back * L[0], o[1] + along * R[1] - back * L[1] + down];
  const svg = svgNode('svg', { class: 'title-sign', viewBox: '0 0 1440 900', 'aria-hidden': 'true' });
  const board = svgNode('g', { class: 'title-board' });
  for (const along of [70, W - 70]) {
    const p = at(along, 0, T / 2);
    board.append(svgNode('line', { class: 'title-cable', x1: p[0], y1: p[1] - 900, x2: p[0], y2: p[1] }));
  }
  const faces = [
    ['title-top', [at(0), at(W), at(W, 0, T), at(0, 0, T)]],
    ['title-end', [at(W), at(W, 0, T), at(W, H, T), at(W, H)]],
    ['title-front', [at(0), at(W), at(W, H), at(0, H)]],
    ['title-inset', [at(10, 10), at(W - 10, 10), at(W - 10, H - 10), at(10, H - 10)]],
  ];
  for (const [cls, list] of faces) board.append(svgNode('polygon', { class: `title-face ${cls}`, points: points(list) }));
  const lettering = svgNode('g', { transform: `matrix(${R[0]},${R[1]},0,1,${o[0].toFixed(1)},${o[1].toFixed(1)})` });
  const kicker = svgNode('text', { class: 'title-kicker', x: W / 2, y: 34, 'text-anchor': 'middle' });
  kicker.textContent = 'OPENING SOON';
  const name = svgNode('text', { class: 'title-name', x: W / 2, y: 92, 'text-anchor': 'middle' });
  lettering.append(kicker, name);
  board.append(lettering);
  svg.append(board);
  return { svg, board, name };
}

// Letters the name on the board, shrinking long names to fit inside the frame.
function letter(name, value) {
  name.textContent = value || 'Your lab';
  name.classList.toggle('empty', !value);
  name.style.fontSize = '';
  const room = BOARD.W - 44;
  const width = name.getComputedTextLength?.() ?? 0;
  if (width > room) name.style.fontSize = `${Math.floor(58 * (room / width))}px`;
}

// The main menu: the endings wall and the title panel under it.
function buildWall(collection) {
  const model = wallModel(collection?.entries() ?? []);
  const scene = make('div', 'title-wall');
  const grid = make('div', 'title-wall-grid');
  for (const tile of model.tiles) {
    const node = make('figure', `title-tile${tile.found ? ' found' : ''}`);
    const img = make('img');
    img.src = `ui/assets/endings/stills/${tile.id}.jpg`;
    img.alt = '';
    node.append(img);
    if (tile.found) {
      const caption = make('figcaption', null, tile.title);
      caption.append(make('small', null, tile.kind));
      node.append(caption);
      node.setAttribute('aria-label', `Found: ${tile.title}`);
    } else {
      node.append(make('span', 'title-tile-q', '?'));
      node.setAttribute('aria-label', 'An ending not found yet');
    }
    grid.append(node);
  }
  grid.append(make('div', 'title-tile title-tile-note', model.note));

  const panel = make('section', 'gp title-menu');
  const words = make('div', 'title-words');
  const heading = make('h1', null, 'AI Lab Tycoon');
  const sub = make('p', 'title-sub', 'Run a frontier AI lab for five eras. ');
  sub.append(make('b', null, `${model.found} of ${model.total} endings found.`));
  words.append(heading, sub);
  const actions = make('div', 'title-actions');
  const play = make('button', 'btn title-new', 'New game');
  play.type = 'button';
  const links = make('div', 'title-links');
  const sound = make('button', 'title-link', 'Sound and music');
  const credits = make('button', 'title-link', 'Credits');
  sound.type = 'button';
  credits.type = 'button';
  links.append(sound, credits);
  actions.append(play, links);
  panel.append(words, actions);
  scene.append(grid, panel);
  return { scene, play, sound, credits };
}

// The naming scene: the board over the dark office and the name field under it.
function buildNaming(game) {
  const scene = make('div', 'title-naming');
  const { svg, name } = drawBoard();
  const panel = make('section', 'gp title-panel');
  const label = make('label', 'title-field');
  const input = make('input');
  input.id = 'title-lab-name';
  input.maxLength = NAME_MAX;
  input.placeholder = 'Your lab';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.value = typeof game.state.labName === 'string' ? game.state.labName.slice(0, NAME_MAX) : '';
  label.append(make('span', null, 'Name your lab'), input);
  const start = make('button', 'btn title-start', 'Turn the lights on');
  start.type = 'button';
  const back = make('button', 'title-link title-back', 'Back');
  back.type = 'button';
  panel.append(label, start, back);
  scene.append(svg, panel);
  const refresh = () => letter(name, input.value.trim());
  input.addEventListener('input', refresh);
  refresh();
  if (document.fonts?.ready) document.fonts.ready.then(refresh).catch(() => {});
  return { scene, input, start, back, refresh };
}

export function mountTitle(game, { stage, overlay, collection, music, openSound = () => null, onStart = () => {} }) {
  const root = document.documentElement;
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sky = make('div', 'title-sky');
  stage.prepend(sky);
  root.classList.add('title-night');

  // Everything under the title is out of reach until the lights come on, keyboard focus included: the office,
  // the HUD, and anything other screens add to the overlay meanwhile (the phone button, cards). Only the title and
  // the dialogs it opens stay live.
  const benched = new Set();
  const own = new Set();
  const bench = (node) => {
    if (node.inert || own.has(node)) return;
    node.inert = true;
    benched.add(node);
  };
  for (const node of stage.querySelectorAll(':scope > #office, :scope > #fx, :scope > #hud')) bench(node);
  const benchOverlay = () => { for (const child of overlay.children) bench(child); };
  const watcher = new MutationObserver(benchOverlay);

  const layer = make('div', 'title-layer on-wall');
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-label', 'AI Lab Tycoon');
  const wall = buildWall(collection);
  const naming = buildNaming(game);
  naming.scene.inert = true;
  layer.append(naming.scene, wall.scene);
  own.add(layer);
  overlay.append(layer);
  benchOverlay();
  watcher.observe(overlay, { childList: true });
  music?.playTitle?.();

  // Sound and Credits open the Sound and music dialog above the title.
  const sound = (tab) => {
    const dialog = openSound(game, overlay, { tab });
    if (!dialog) return;
    own.add(dialog);
    dialog.style.zIndex = '46';
  };
  wall.sound.addEventListener('click', () => sound('sound'));
  wall.credits.addEventListener('click', () => sound('credits'));

  const toNaming = () => {
    layer.classList.replace('on-wall', 'on-naming');
    wall.scene.inert = true;
    naming.scene.inert = false;
    naming.refresh();
    naming.input.focus({ preventScroll: true });
  };
  const toWall = () => {
    layer.classList.replace('on-naming', 'on-wall');
    wall.scene.inert = false;
    naming.scene.inert = true;
    wall.play.focus({ preventScroll: true });
  };
  wall.play.addEventListener('click', toNaming);
  naming.back.addEventListener('click', toWall);

  let started = false;
  function begin() {
    if (started) return;
    started = true;
    const value = cleanLabName(naming.input.value);
    if (value) game.state.labName = value;
    music?.startGame?.();
    layer.inert = true; // nothing on the title answers during the wake transition
    layer.classList.add('leaving');
    root.classList.add('title-waking');
    root.classList.remove('title-night');
    const finish = () => {
      layer.remove();
      sky.remove();
      watcher.disconnect();
      for (const node of benched) node.inert = false;
      root.classList.remove('title-waking');
      onStart({ labName: value });
    };
    if (reduced) finish();
    else setTimeout(finish, WAKE_MS);
  }
  naming.start.addEventListener('click', begin);
  naming.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') begin();
  });
  wall.play.focus({ preventScroll: true });
  return { begin, toNaming, layer };
}
