import { dressingView } from './logic/automation.js';

const ADVISORS = ['research', 'safety', 'cfo', 'policy'];
const MOODS = ['calm', 'uneasy', 'alarmed'];

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function moodMap(state) {
  return new Map((state.lastBriefing ?? []).map(({ id, band }) => [id, MOODS.includes(band) ? band : 'calm']));
}

// K2's advisor marker (gen_K2.py), 20% larger, with the marks drawn as shapes so they sit centred and bold:
// one "!" when uneasy, "!!" when alarmed. As in K2, the bubble sits up and to the right of the head: its centre is
// 22 px right of the head anchor, and its tail tip lands about 11 px right of the head's centre, just above the hair.
const bang = (x, w) => `<path d="M${x - w / 2},-17.5 L${x + w / 2},-17.5 L${x + w * 0.3},-5.5 L${x - w * 0.3},-5.5 Z"
    style="fill:var(--coral);stroke:var(--coral);stroke-width:1.6;stroke-linejoin:round"/>
  <circle cx="${x}" cy="0" r="${w * 0.52}" style="fill:var(--coral)"/>`;
const markerSvg = (alarmed) => `<svg viewBox="-17 -25 34 45" width="41" height="54" aria-hidden="true">
  <path d="M-15,-16 Q-15,-23 -8,-23 L8,-23 Q15,-23 15,-16 L15,2 Q15,9 8,9 L-1,9 L-9,18 L-7,9 L-8,9 Q-15,9 -15,2 Z"
    style="fill:var(--paper);stroke:var(--ink);stroke-width:1.8;stroke-linejoin:round"/>
  ${alarmed ? bang(-4.6, 4.4) + bang(4.6, 4.4) : bang(0, 5)}</svg>`;

function setMoods(svg, fx, anchors, state) {
  const moods = moodMap(state);
  fx.replaceChildren();
  for (const role of ADVISORS) {
    const mood = moods.get(role) ?? 'calm';
    const person = svg.querySelector(`#person-${role}`);
    if (!person) continue;
    for (const name of MOODS) {
      const face = person.querySelector(`.face-${name}`);
      if (!face) continue;
      if (name === mood) face.removeAttribute('display');
      else face.setAttribute('display', 'none');
    }
    if (mood !== 'calm' && anchors?.heads?.[role]) {
      const [x, y] = anchors.heads[role];
      const marker = document.createElement('div');
      marker.className = `advisor-marker ${mood}`;
      marker.setAttribute('role', 'img');
      marker.setAttribute('aria-label', `${role} is ${mood}`);
      marker.innerHTML = markerSvg(mood === 'alarmed');
      marker.style.left = `${x + 22}px`;
      marker.style.top = `${y}px`;
      fx.append(marker);
    }
  }
}

const AGENT_SVG = `<svg viewBox="0 0 12 14" width="17" height="20" aria-hidden="true">
  <line x1="6" y1="0.8" x2="6" y2="3" style="stroke:var(--ink);stroke-width:1.2"/>
  <rect x="1" y="3" width="10" height="8" rx="3" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.2"/>
  <circle cx="4.5" cy="7" r="1.1" style="fill:var(--sky)"/><circle cx="7.5" cy="7" r="1.1" style="fill:var(--sky)"/></svg>`;

// 1B's signs without its labels: agents beside the researchers, the unchecked pile on the Safety desk, the racks' glow.
function dressOffice(fx, anchors, state) {
  const view = dressingView(state);
  const add = (className, [x, y], html = '') => {
    const node = document.createElement('div');
    node.className = className;
    node.setAttribute('aria-hidden', 'true');
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.innerHTML = html;
    fx.append(node);
    return node;
  };
  for (const key of ['researcher1', 'researcher2']) {
    const head = anchors?.heads?.[key];
    if (head && view.agents > 0) add('agent-dots', [head[0] + 38, head[1] + 4], AGENT_SVG.repeat(view.agents));
  }
  const safety = anchors?.heads?.safety;
  if (safety && view.pile > 0) add(`review-pile pile-${view.pile}`, [safety[0] - 38, safety[1] + 62], '<i></i>'.repeat(view.pile * 2));
  if (anchors?.rack && view.glow > 0) add('rack-glow', anchors.rack).style.opacity = `${view.glow}`;
}

async function loadEra(era) {
  const [svgText, anchorsResponse] = await Promise.all([
    fetch(`ui/assets/office-era${era}.svg`).then((response) => {
      if (!response.ok) throw new Error(`could not load office for era ${era}`);
      return response.text();
    }),
    fetch(`ui/assets/anchors-era${era}.json`).then((response) => {
      if (!response.ok) throw new Error(`could not load anchors for era ${era}`);
      return response.json();
    }),
  ]);
  const documentNode = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const svg = documentNode.documentElement;
  svg.classList.add('room', 'office-room');
  svg.dataset.era = `${era}`;
  const ceo = svg.querySelector('#person-ceo');
  if (ceo) {
    ceo.setAttribute('tabindex', '0');
    ceo.setAttribute('role', 'button');
    ceo.setAttribute('aria-label', 'Your monitor: the encyclopedia page about your models');
  }
  return { svg, anchors: anchorsResponse };
}

export async function mountOffice(root, fx, game) {
  let current = null;
  let loadVersion = 0;

  async function render() {
    const state = game.state;
    if (current?.era === state.era) {
      setMoods(current.svg, fx, current.anchors, state);
      dressOffice(fx, current.anchors, state);
      return;
    }

    const version = ++loadVersion;
    let loaded;
    try {
      loaded = await loadEra(state.era);
    } catch (error) {
      if (version === loadVersion) fx.replaceChildren(); // the old room's markers would point at the wrong heads
      throw error; // current keeps its era, so the next update tries this era again
    }
    if (version !== loadVersion) return;
    const previous = current;
    current = { era: state.era, ...loaded };
    setMoods(current.svg, fx, current.anchors, state);
    dressOffice(fx, current.anchors, state);
    root.append(current.svg);

    if (!previous || reducedMotion()) {
      previous?.svg.remove();
      current.svg.classList.add('office-room-current');
      return;
    }

    previous.svg.classList.add('office-room-leaving');
    current.svg.classList.add('office-room-entering');
    requestAnimationFrame(() => current.svg.classList.add('office-room-current'));
    globalThis.setTimeout(() => previous.svg.remove(), 420);
  }

  // Subscribe first, so a failed first load is retried on the next update.
  const unsubscribe = game.subscribe(() => {
    render().catch((error) => console.error(error));
  });
  await render();
  return unsubscribe;
}
