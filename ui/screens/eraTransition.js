import { openDialog } from '../components/dialog.js';
import { loadAnchors } from '../components/eventBits.js';
import { eraIntro } from '../logic/eraIntro.js';
import { storyDate } from '../../sim/time.js';

const HOLDERS = '.dialog-layer:not(.et-wait), .event-layer, .ev-phone, .screenwall-layer, .menu-layer, .title-layer, .intro-layer';
const VOICES = {
  2: ['cfo', 'Margot · CFO', 'The desks arrived. Now everyone expects us to fill them.'],
  3: ['research', 'Priya · Head of Research', 'They can use tools now. We should probably watch which ones.'],
  4: ['cfo', 'Margot · CFO', 'We have the hardware. Now we need somewhere to plug it in.'],
  5: ['safety', 'Tomas · Head of Safety', 'The models are improving the models. Keep a human in the room.'],
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

let artId = 0;

async function officeArt(era) {
  const response = await fetch(`ui/assets/office-era${era}.svg`);
  if (!response.ok) throw new Error(`could not load transition office ${era}`);
  const svg = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
  // Keep gradient references local while excluding scenery copies from live-office selectors.
  const prefix = `et-art-${++artId}-`;
  const ids = new Map([...svg.querySelectorAll('[id]')].map(node => [node.id, prefix + node.id]));
  for (const node of [svg, ...svg.querySelectorAll('*')]) {
    if (ids.has(node.id)) node.id = ids.get(node.id);
    for (const attribute of [...node.attributes]) {
      if (attribute.name === 'id') continue;
      let value = attribute.value.replace(/url\(#([^)]*)\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
      if (attribute.name.endsWith('href') && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
      if (value !== attribute.value) node.setAttribute(attribute.name, value);
    }
  }
  svg.setAttribute('class', 'et-office');
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}

function buildLayer(variant, era, day, art, anchors) {
  const intro = eraIntro(era);
  const layer = el('div', `dialog-layer et-layer et-${variant}`);
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'et-title');
  layer.dataset.era = `${era}`;
  const veil = el('div', 'dialog-veil et-veil');
  const panel = el('section', 'dialog-centre et-stage');
  panel.tabIndex = -1;
  const header = el('header', 'et-header');
  header.append(el('span', 'et-kicker', `${storyDate(day).y} / ${variant === 'B' ? 'Moving day' : variant === 'C' ? 'First morning' : 'From the lab'}`));
  const title = el('h1', 'et-title', intro.name);
  title.id = 'et-title';
  header.append(title);
  const footer = el('footer', 'et-footer');
  footer.append(el('span', 'et-pause', 'The lab is waiting for you.'));
  const motion = el('button', 'et-motion', { A: 'Preview ink reveal', B: 'Preview office move', C: 'Preview lights on' }[variant]);
  motion.type = 'button';
  const enter = el('button', 'et-enter', variant === 'B' ? 'Step inside →' : variant === 'C' ? 'Back to the lab →' : 'Let’s get to work →');
  enter.type = 'button';
  footer.append(motion, enter);
  panel.append(header);

  if (variant === 'A') {
    const spread = el('div', 'et-spread');
    const lead = el('div', 'et-lead');
    lead.append(el('p', 'et-headline', intro.headline));
    const vignette = el('div', 'et-vignette');
    if (art[1]) vignette.append(art[1]);
    lead.append(vignette);
    const briefing = el('div', 'et-briefing');
    briefing.append(el('h2', 'et-label', 'On our desks'));
    intro.changes.forEach((line, i) => {
      const row = el('div', 'et-change');
      row.append(el('span', 'et-number', `0${i + 1}`), el('p', '', line));
      briefing.append(row);
    });
    const constraint = el('div', 'et-constraint');
    constraint.append(el('h2', 'et-label', 'The bottleneck'), el('p', '', intro.bottleneck));
    briefing.append(constraint, el('p', 'et-pace', intro.pace));
    spread.append(lead, briefing);
    panel.append(spread);
  } else if (variant === 'B') {
    header.append(el('p', 'et-subtitle', intro.headline));
    const scene = el('div', 'et-move-scene');
    const old = el('div', 'et-old-office');
    if (art[0]) old.append(art[0]);
    old.append(el('span', 'et-old-label', 'One last look'));
    const incoming = el('div', 'et-new-office');
    if (art[1]) incoming.append(art[1]);
    const [role, name, line] = VOICES[era];
    const bubble = el('div', 'et-desk-voice');
    bubble.append(el('strong', '', name), el('p', '', line));
    const [x, y] = anchors?.heads?.[role] ?? [800, 480];
    bubble.style.left = `${Math.max(80, Math.min(1030, x - 85))}px`;
    bubble.style.top = `${y - 152}px`;
    incoming.append(bubble);
    scene.append(old, incoming);
    panel.append(scene);
  } else {
    const background = el('div', 'et-night-office');
    if (art[1]) background.append(art[1]);
    const desk = el('div', 'et-desk');
    const paper = el('article', 'et-work-order');
    paper.append(el('div', 'et-paper-meta', 'OPERATIONS / TODAY'), el('h2', '', 'Before the coffee gets cold.'));
    paper.append(el('p', 'et-paper-intro', intro.headline));
    const concern = el('div', 'et-paper-concern');
    concern.append(el('span', 'et-label', 'What’s holding us up'), el('p', '', intro.bottleneck));
    paper.append(concern, el('div', 'et-signature', 'For your desk. — Margot'));
    const note = el('aside', 'et-note');
    note.append(el('span', 'et-label', 'From Research'), el('p', '', intro.changes[0]), el('span', 'et-note-sign', 'Let’s start here.'));
    desk.append(paper, note, el('div', 'et-coffee', ''));
    panel.append(background, desk);
  }
  panel.append(footer);
  layer.append(veil, panel);
  motion.addEventListener('click', () => {
    layer.classList.remove('et-play');
    void layer.offsetWidth;
    layer.classList.add('et-play');
  });
  return layer;
}

export function mountEraTransition(game, overlay, { variant } = {}) {
  if (!['A', 'B', 'C'].includes(variant)) return () => {};
  let seen = game.state.era;
  let pending = null;
  let opened = null;
  let disposed = false;
  let loading = false;
  let waiting = null;
  const release = () => { waiting?.remove(); waiting = null; game.clock?.resume('era-transition'); };

  async function showNext() {
    if (disposed || opened || loading || !pending) return;
    if (game.state.ending) { pending = null; release(); return; }
    if (overlay.querySelector(HOLDERS)) return;
    waiting ??= el('div', 'dialog-layer dialog-open et-wait', 'The lab is moving…');
    overlay.append(waiting);
    loading = true;
    const entry = pending;
    const results = await Promise.allSettled([officeArt(entry.era - 1), officeArt(entry.era), loadAnchors(entry.era)]);
    loading = false;
    if (disposed) return;
    if (game.state.ending) { pending = null; release(); return; }
    if (overlay.querySelector(HOLDERS)) return;
    const art = results.slice(0, 2).map((result) => result.status === 'fulfilled' ? result.value : null);
    const anchors = results[2].status === 'fulfilled' ? results[2].value : null;
    pending = null;
    waiting?.remove();
    waiting = null;
    opened = openDialog(overlay, { build: () => buildLayer(variant, entry.era, entry.day, art, anchors) });
    opened.querySelector('.et-enter').addEventListener('click', () => opened?.close());
    opened.querySelector('.et-enter').focus();
  }

  const check = () => {
    if (opened && !opened.isConnected) { opened = null; release(); }
    void showNext();
  };
  const observer = new MutationObserver(check);
  observer.observe(overlay, { childList: true });
  overlay.addEventListener('gdt-dialog-closed', check);
  const unsubscribe = game.subscribe(({ state, events }) => {
    if (state.ending) { pending = null; opened?.close(); release(); return; }
    const event = events.find((item) => item.type === 'eraStart' && item.era > seen && eraIntro(item.era));
    if (!event) return;
    seen = event.era;
    pending = { era: event.era, day: state.day };
    // Pause in the publish call, before the clock can spend another already-owed story day.
    game.clock?.pause('era-transition');
    queueMicrotask(check);
  });
  return () => {
    disposed = true;
    unsubscribe();
    observer.disconnect();
    overlay.removeEventListener('gdt-dialog-closed', check);
    opened?.close();
    release();
  };
}
