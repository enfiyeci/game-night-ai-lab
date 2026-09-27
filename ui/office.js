import { dressingView } from './logic/automation.js';
import { constitutionOnWall } from './logic/office.js';
import { advisorMarks, hitAreas, markerSpot } from './logic/advisorMarks.js';

const ADVISORS = ['research', 'safety', 'cfo', 'policy'];
const MOODS = ['calm', 'uneasy', 'alarmed'];

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function readingMap(state) {
  return new Map((state.lastBriefing ?? []).map((reading) => [reading.id, reading]));
}

// K2's advisor marker (gen_K2.py), 20% larger, with the marks drawn as shapes so they sit centred and bold:
// one "!" when uneasy, "!!" when alarmed. The bubble's tail tip lands about 11 px toward the head from the bubble's
// centre; a mark on the left side is mirrored (ui/logic/advisorMarks.js, markerSpot).
const bang = (x, w) => `<path d="M${x - w / 2},-17.5 L${x + w / 2},-17.5 L${x + w * 0.3},-5.5 L${x - w * 0.3},-5.5 Z"
    style="fill:var(--coral);stroke:var(--coral);stroke-width:1.6;stroke-linejoin:round"/>
  <circle cx="${x}" cy="0" r="${w * 0.52}" style="fill:var(--coral)"/>`;
const markerSvg = (alarmed) => `<svg viewBox="-17 -25 34 45" width="41" height="54" aria-hidden="true">
  <path d="M-15,-16 Q-15,-23 -8,-23 L8,-23 Q15,-23 15,-16 L15,2 Q15,9 8,9 L-1,9 L-9,18 L-7,9 L-8,9 Q-15,9 -15,2 Z"
    style="fill:var(--paper);stroke:var(--ink);stroke-width:1.8;stroke-linejoin:round"/>
  ${alarmed ? bang(-4.6, 4.4) + bang(4.6, 4.4) : bang(0, 5)}</svg>`;

// Faces follow the band; the mark shows only until the player has heard the reading or answered the warning.
function setMoods(svg, fx, anchors, state) {
  const readings = readingMap(state);
  fx.replaceChildren();
  for (const role of ADVISORS) {
    const reading = readings.get(role);
    const mood = MOODS.includes(reading?.band) ? reading.band : 'calm';
    const person = svg.querySelector(`#person-${role}`);
    if (!person) continue;
    for (const name of MOODS) {
      const face = person.querySelector(`.face-${name}`);
      if (!face) continue;
      if (name === mood) face.removeAttribute('display');
      else face.setAttribute('display', 'none');
    }
    const mark = advisorMarks.markFor(role, reading);
    if (mark && anchors?.heads?.[role]) {
      const { x, y, side } = markerSpot(role, anchors.heads);
      const marker = document.createElement('div');
      marker.className = `advisor-marker ${mark} ${side}`;
      marker.setAttribute('role', 'img');
      marker.setAttribute('aria-label', advisorMarks.hasTask(role) ? `${role} has a warning for you` : `${role} is ${mood}`);
      marker.innerHTML = markerSvg(mark === 'alarmed');
      marker.style.left = `${x}px`;
      marker.style.top = `${y}px`;
      // Clicking the "!" does what clicking the person does (the briefing listens for clicks on the person).
      // Not during the team tour, which lets clicks through on its last step (ui/screens/intro.js).
      marker.addEventListener('click', () => {
        if (document.querySelector('#overlay .intro-layer')) return;
        person.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      fx.append(marker);
    }
  }
}

// Each advisor's click area (ui/logic/advisorMarks.js, hitAreas): invisible polygons drawn under every person and the
// rack, so a click on a colleague still lands on the colleague, and a click on the floor around a desk opens that
// advisor. Measured from the room's own drawing, so every era's layout gets its own areas.
const SVG_NS = 'http://www.w3.org/2000/svg';
function addHitAreas(svg, anchors) {
  const people = [...svg.querySelectorAll('[id^="person-"]')];
  const first = people[0];
  if (!first || !anchors?.heads || typeof first.getBBox !== 'function') return;
  const toStage = first.getCTM(); // the people share one parent; this maps it into the 1440 x 900 frame
  if (!toStage) return;
  const boxes = {};
  for (const group of people) {
    const box = group.getBBox();
    if (!box.width || !box.height) continue;
    const corners = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
      .map(([x, y]) => new DOMPoint(x, y).matrixTransform(toStage));
    const xs = corners.map((point) => point.x);
    const ys = corners.map((point) => point.y);
    boxes[group.id.slice('person-'.length)] = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  const marks = Object.fromEntries(ADVISORS.filter((role) => anchors.heads[role]).map((role) => {
    const { x, y } = markerSpot(role, anchors.heads);
    return [role, [x, y]];
  }));
  const avoid = [anchors.floorMenu];
  if (anchors.heads.ceo) avoid.push([anchors.heads.ceo[0] + 27, anchors.heads.ceo[1] + 121]); // the phone (ui/screens/feed.js)
  const areas = hitAreas({ boxes, heads: anchors.heads, marks, avoid: avoid.filter(Boolean) });

  const layer = document.createElementNS(SVG_NS, 'g');
  layer.setAttribute('class', 'advisor-hits');
  layer.setAttribute('aria-hidden', 'true');
  const back = toStage.inverse();
  layer.setAttribute('transform', `matrix(${[back.a, back.b, back.c, back.d, back.e, back.f].map((n) => +n.toFixed(5)).join(' ')})`);
  for (const [role, polygons] of Object.entries(areas)) {
    for (const polygon of polygons) {
      const shape = document.createElementNS(SVG_NS, 'polygon');
      shape.setAttribute('class', 'advisor-hit');
      shape.setAttribute('data-advisor', role);
      shape.setAttribute('points', polygon.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '));
      layer.append(shape);
    }
  }
  const parent = first.parentNode;
  const before = [...parent.children].find((child) => child.id === 'rack' || child.id.startsWith('person-'));
  parent.insertBefore(layer, before);
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
      current.svg.classList.toggle('shows-constitution', constitutionOnWall(state));
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
    current.svg.classList.toggle('shows-constitution', constitutionOnWall(state));
    setMoods(current.svg, fx, current.anchors, state);
    dressOffice(fx, current.anchors, state);
    root.append(current.svg);
    addHitAreas(current.svg, current.anchors); // measured once the room is in the page

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
  // A mark goes the moment the player hears the advisor or answers their warning, not at the next story day.
  const unsubscribeMarks = advisorMarks.subscribe(() => {
    if (current?.era !== game.state.era) return;
    setMoods(current.svg, fx, current.anchors, game.state);
    dressOffice(fx, current.anchors, game.state);
  });
  await render();
  return () => {
    unsubscribe();
    unsubscribeMarks();
  };
}
