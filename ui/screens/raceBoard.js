// The race on the office whiteboard (owner pick D, 2026-10-14), ported from the pick page's mock-left.js. While the lab
// is in danger of being left behind (ui/logic/raceWarning.js), Priya's lanes cover the whiteboard in the room's own
// perspective with a "!" above it (frame D1); clicking the board, or "Open the race" on her warning, opens it flat and
// handwritten (frame D2). Every era's office has the board (tools/office/gen_office.py, whiteboard_art), so the drawing
// is placed on its face as drawn, never at fixed pixels.
import { openDialog } from '../components/dialog.js';
import { raceBoardView } from '../logic/raceWarning.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const INK = 'var(--ink)';
const CORAL = 'var(--coral)';
const SKY = 'var(--sky)';
const CORAL_INK = 'color-mix(in oklab, var(--coral) 82%, var(--ink))'; // the mock's darker coral for writing
const LANE = 'color-mix(in oklab, var(--sky) 30%, color-mix(in oklab, var(--ink) 28%, var(--paper)))';

const h = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};
const svgNode = (markup) => {
  const box = document.createElementNS(SVG_NS, 'g');
  box.innerHTML = markup.trim();
  return box.firstElementChild;
};
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// The wall board (frame D1): lanes across the face, the leader at the right, the out-of-the-race zone shaded from the
// left up to the line. The mock's 140 x 90 board, laid out in the face's own units (x0, y0, w, h).
function wallBoard(view, { x: x0, y: y0, width: w, height: hh }) {
  const leader = view.leaderCapability;
  const span = Math.max(32, ...view.lanes.map((lane) => leader - lane.capability + 2));
  const left = x0 + w * (14 / 140);
  const right = x0 + w * (130 / 140);
  const at = (behind) => right - 2 - (behind / span) * (right - left - 4);
  const top = y0 + hh * (8 / 90);
  const bottom = y0 + hh * (82 / 90);
  const rows = view.lanes.map((lane, i) => {
    const y = y0 + hh * (0.16 + (i * 0.68) / (view.lanes.length - 1));
    return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" style="stroke:${LANE};stroke-width:1"/>
      <circle cx="${at(leader - lane.capability)}" cy="${y}" r="${lane.you ? 4.2 : 3}" style="fill:${lane.you ? CORAL : SKY}"/>`;
  }).join('');
  return svgNode(`<g class="race-board" role="button" tabindex="0" aria-label="The race on the whiteboard: open it" style="cursor:pointer">
    <rect x="${x0}" y="${y0}" width="${w}" height="${hh}" rx="2" style="fill:var(--paper)"/>
    <rect x="${left}" y="${top}" width="${Math.max(0, at(view.leaderCapability - view.line) - left)}" height="${bottom - top}" style="fill:${CORAL};opacity:.16"/>
    ${rows}
    <line x1="${right}" y1="${top}" x2="${right}" y2="${bottom}" style="stroke:${INK};stroke-width:1.4"/></g>`);
}

// The "!" above the board (frame D1: a paper tag with an ink edge), in the room's 1440 x 900 frame.
function wallMark(face) {
  const ctm = face.getCTM();
  if (!ctm) return null;
  const x = face.x.baseVal.value;
  const y = face.y.baseVal.value;
  const corner = new DOMPoint(x, y).matrixTransform(ctm);
  const across = new DOMPoint(x + face.width.baseVal.value, y).matrixTransform(ctm);
  const left = corner.x + (across.x - corner.x) * 0.43;
  return svgNode(`<g class="race-mark" role="button" aria-label="The race on the whiteboard: open it" transform="translate(${left.toFixed(1)},${(corner.y - 34).toFixed(1)})" style="cursor:pointer">
    <rect x="0" y="3" width="34" height="40" rx="8" style="fill:${INK}"/>
    <rect x="1" y="1" width="32" height="38" rx="7" style="fill:var(--paper);stroke:${INK};stroke-width:2"/>
    <text x="17" y="28" text-anchor="middle" style="font:900 22px Nunito, sans-serif;fill:${CORAL}">!</text></g>`);
}

// The board opened flat and handwritten (frame D2). Scores across 150-870 of the 952 x 572 face.
function flatBoard(view) {
  const lo = Math.min(view.line, ...view.lanes.map((lane) => lane.capability)) - 8;
  const hi = view.leaderCapability + 3;
  const X = (score) => 150 + ((score - lo) / (hi - lo)) * 720;
  const youAt = view.lanes.findIndex((lane) => lane.you);
  const rows = view.lanes.map((lane, i) => {
    const y = 170 + i * 72;
    const size = Math.max(18, Math.min(30, Math.floor(300 / Math.max(10, lane.name.length))));
    return `<text x="40" y="${y + 9}" font-size="${size}" style="fill:${lane.you ? CORAL_INK : INK};font-weight:${lane.you ? 700 : 500}">${esc(lane.name)}</text>
      <path d="M150 ${y + 14} q 300 -6 720 2" style="stroke:${LANE};stroke-width:2.5;fill:none"/>
      <circle cx="${X(lane.capability)}" cy="${y + 12}" r="${lane.you ? 15 : 11}" style="fill:${lane.you ? CORAL : SKY};opacity:.9"/>
      <text x="${X(lane.capability) + (lane.you ? 22 : 18)}" y="${y + 21}" font-size="26" style="fill:${INK}">${lane.score}</text>`;
  }).join('');
  const lineX = X(view.line);
  // Priya's note points up at your dot from below the lanes (from the last two lanes it sits under them).
  const youX = X(view.lanes[youAt].capability);
  const dotY = 170 + youAt * 72 + 12;
  const noteY = youAt <= 2 ? 500 : 548;
  const from = noteY - 30;
  const to = youAt <= 2 ? dotY + 48 : dotY + 22;
  const arrow = from - to > 20 ? `<path d="M${youX - 40} ${from} q 30 ${-((from - to) * 0.42).toFixed(1)} 34 ${-(from - to)}" style="stroke:${CORAL_INK};stroke-width:3;fill:none"/>` : '';
  return `<svg width="952" height="572" viewBox="0 0 952 572" role="img" aria-label="${esc(`The race. ${view.ends} ${view.note}`)}">
      <text x="40" y="70" font-size="50" style="fill:${INK};font-weight:700">The race</text>
      <text x="300" y="68" font-size="32" style="fill:${INK}">${esc(view.ends)}</text>
      <rect x="150" y="128" width="${Math.max(0, lineX - 150)}" height="380" style="fill:${CORAL};opacity:.10"/>
      <path d="M${lineX} 120 l 3 395" style="stroke:${CORAL};stroke-width:4;stroke-dasharray:12 9;fill:none"/>
      <text x="${lineX}" y="116" font-size="27" text-anchor="middle" style="fill:${INK}">${esc(view.lineLabel)}</text>
      <text x="166" y="158" font-size="28" style="fill:${CORAL_INK}">out of the race</text>
      ${rows}
      ${arrow}
      <text x="${Math.max(160, youX - 210)}" y="${noteY}" font-size="30" style="fill:${CORAL_INK}">${esc(view.note)}</text>
      <text x="40" y="545" font-size="26" style="fill:${SKY}">— ${esc(view.signer)}</text>
    </svg>`;
}

// Opens the flat board as a dialog (it holds the clock as every dialog does). Nothing opens once the danger has passed.
export function openRaceBoard(game, overlay) {
  const view = raceBoardView(game.state);
  if (!view) return null;
  const opened = openDialog(overlay, {
    build: () => {
      const layer = h(`<div class="dialog-layer race-board-layer" role="dialog" aria-modal="true" aria-label="The race on the whiteboard">
        <div class="dialog-veil"></div>
        <div class="race-wb dialog-centre" tabindex="-1">${flatBoard(view)}<div class="race-wb-tray"></div><button class="race-wb-close" type="button">Back to work</button></div></div>`);
      return layer;
    },
  });
  opened.querySelector('.race-wb-close').addEventListener('click', () => opened.close());
  opened.querySelector('.race-wb-close').focus();
  return opened;
}

export function mountRaceBoard(game, { office, overlay }) {
  let drawnKey = null;
  const blocked = () => Boolean(overlay.querySelector('.dialog-layer, .event-layer, .ev-phone, .screenwall-layer, .intro-layer'));

  function draw(state) {
    const svg = office.querySelector(`svg.office-room[data-era="${state.era}"]:not(.office-room-leaving)`);
    const view = raceBoardView(state);
    const key = view && svg ? `${state.era}|${view.lanes.map((lane) => `${lane.id}:${lane.capability.toFixed(2)}`).join(',')}` : null;
    if (svg && key === drawnKey && Boolean(svg.querySelector('.race-board')) === Boolean(view)) return;
    for (const node of office.querySelectorAll('.race-board, .race-mark')) node.remove();
    drawnKey = null;
    const face = svg?.querySelector('.office-whiteboard-face');
    if (!view || !face) return; // an office with no whiteboard: Priya's "Open the race" still opens the flat board
    // Over the board's own drawing, under anything pinned to it (era 4's summit invite, the rotated card).
    const pinned = [...face.parentNode.children].find((child) => child.getAttribute('transform')?.includes('rotate'));
    face.parentNode.insertBefore(wallBoard(view, { x: face.x.baseVal.value, y: face.y.baseVal.value, width: face.width.baseVal.value, height: face.height.baseVal.value }), pinned ?? null);
    const mark = wallMark(face);
    if (mark) svg.append(mark);
    drawnKey = key;
  }

  const open = (target) => {
    if (!target.closest?.('.race-board, .race-mark') || blocked()) return false;
    openRaceBoard(game, overlay);
    return true;
  };
  office.addEventListener('click', (event) => open(event.target));
  office.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && open(event.target)) event.preventDefault();
  });
  // The office loads a new era's room after the publish that moved the era; draw again once it is in the page.
  new MutationObserver(() => draw(game.state)).observe(office, { childList: true });
  game.subscribe(({ state }) => draw(state));
  draw(game.state);
}
