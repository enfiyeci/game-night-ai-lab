// The world as a contested hex map (lane gn-late-game, 2026-10-27, owner ask: "kind of like plague with the map").
// Each region's hexes are shared out between labs by a noisy sweep from each lab's side of the region, so control
// reads as patches spreading across it. Every share here is a stand-in, not sim output.
import { HEXES, HEX_R } from './worldmap.js';

const HW = Math.sqrt(3) * HEX_R;
const pos = ([col, row]) => [col * HW + (row % 2 ? HW / 2 : 0) + HW / 2, row * 1.5 * HEX_R + HEX_R];
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export const LABS = {
  you: { name: 'Your lab', color: 'var(--coral)' },
  openbrain: { name: 'OpenBrain', color: 'color-mix(in oklab, var(--ink) 62%, var(--paper))' },
  deepthink: { name: 'DeepThink', color: 'var(--sky)' },
  lodestar: { name: 'Lodestar', color: 'var(--teal)' },
  qilin: { name: 'Qilin', color: 'var(--wood)' },
  none: { name: 'Nobody yet', color: 'color-mix(in oklab, var(--wood) 34%, var(--paper))' },
};

// Shares in percent, first entry nearest the sweep's start; angle is the sweep's direction in degrees.
export const REGIONS = {
  na: { name: 'North America', shares: [['you', 52], ['openbrain', 38], ['none', 10]], angle: 0, label: [194, 97], backs: 'you' },
  latam: { name: 'Latin America', shares: [['openbrain', 35], ['you', 30], ['qilin', 15], ['none', 20]], angle: 90, label: [306, 262] },
  eu: { name: 'Europe', shares: [['openbrain', 46], ['you', 31], ['lodestar', 12], ['none', 11]], angle: 180, label: [430, 52], contested: true },
  af: { name: 'Africa', shares: [['qilin', 40], ['you', 8], ['deepthink', 7], ['none', 45]], angle: 200, label: [528, 215] },
  gulf: { name: 'The Gulf', shares: [['deepthink', 40], ['you', 25], ['openbrain', 20], ['none', 15]], angle: 30, label: [590, 146], backs: 'deepthink' },
  ru: { name: 'Russia and Central Asia', shares: [['qilin', 30], ['none', 70]], angle: 160, label: [745, 40] },
  sa: { name: 'South Asia', shares: [['qilin', 35], ['openbrain', 30], ['you', 15], ['none', 20]], angle: 120, label: [712, 182], contested: true },
  ea: { name: 'China', shares: [['qilin', 88], ['none', 12]], angle: 180, label: [790, 118], backs: 'qilin' },
  sea: { name: 'Asia-Pacific', shares: [['you', 34], ['openbrain', 28], ['qilin', 22], ['deepthink', 8], ['none', 8]], angle: 290, label: [860, 300] },
};

function owners() {
  const by = {};
  for (const h of HEXES) (by[h[2]] ??= []).push(h);
  const out = new Map();
  for (const [id, list] of Object.entries(by)) {
    const r = REGIONS[id];
    const a = (r.angle * Math.PI) / 180;
    const sorted = list.map((h) => { const [x, y] = pos(h); return [h, x * Math.cos(a) + y * Math.sin(a) + hash(h[0], h[1]) * 40]; }).sort((p, q) => p[1] - q[1]);
    let i = 0;
    for (const [lab, pct] of r.shares) {
      const n = Math.round((pct / 100) * sorted.length);
      for (let k = 0; k < n && i < sorted.length; k += 1, i += 1) out.set(sorted[i][0], lab);
    }
    for (; i < sorted.length; i += 1) out.set(sorted[i][0], r.shares.at(-1)[0]);
  }
  return out;
}

const hexPath = (cx, cy, r) => Array.from({ length: 6 }, (_, k) => { const t = (Math.PI / 3) * k + Math.PI / 6; return `${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`; }).join(' ');

// The map as an SVG string. `selected` outlines one region; `changed` rings hexes that moved at the last checkpoint.
export function mapSvg({ selected = 'eu', changed = 14, labels = true, arcs = true, view = '0 0 1030 424' } = {}) {
  const own = owners();
  const cells = HEXES.map((h) => {
    const [x, y] = pos(h);
    const lab = own.get(h);
    const sel = h[2] === selected;
    return `<polygon points="${hexPath(x, y, HEX_R - 0.6)}" fill="${LABS[lab].color}"${sel ? ' class="sel"' : ''}/>`;
  }).join('');
  // A few hexes on the front lines changed hands at the last checkpoint.
  const rings = HEXES.filter((h) => (h[2] === 'eu' || h[2] === 'sa') && own.get(h) === 'you' && hash(h[1], h[0]) < 0.3).slice(0, changed)
    .map((h) => { const [x, y] = pos(h); return `<polygon points="${hexPath(x, y, HEX_R + 1.2)}" class="ring"/>`; }).join('');
  const lab = (id) => {
    const r = REGIONS[id];
    const [x, y] = r.label;
    const bar = r.shares.reduce((acc, [l, p]) => { acc.out += `<rect x="${acc.x}" y="0" width="${p * 0.9}" height="5" fill="${LABS[l].color}"/>`; acc.x += p * 0.9; return acc; }, { x: 0, out: '' }).out;
    return `<g class="lbl${id === selected ? ' on' : ''}${r.contested ? ' hot' : ''}" transform="translate(${x - 45},${y})">
      <rect class="plate" x="-6" y="-15" width="102" height="${r.backs ? 36 : 27}" rx="6"/>
      <text x="0" y="-3">${r.name}</text><g transform="translate(0,3)">${bar}</g>
      ${r.backs ? `<text class="backs" x="0" y="17">★ backs ${LABS[r.backs].name}</text>` : ''}</g>`;
  };
  // Launch arcs: models going into a region this round (Plague's flight lines).
  const arc = (x1, y1, x2, y2, l) => `<path class="arc" d="M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - 60} ${x2},${y2}" stroke="${LABS[l].color}"/><circle cx="${x2}" cy="${y2}" r="4" fill="${LABS[l].color}" class="pin"/>`;
  const flights = arcs ? [arc(200, 112, 488, 98, 'openbrain'), arc(214, 122, 690, 168, 'you'), arc(782, 142, 540, 236, 'qilin')].join('') : '';
  return `<svg class="mk-map" viewBox="${view}" role="img" aria-label="World map of AI control by region">
    <g class="cells">${cells}</g><g>${rings}</g><g>${flights}</g>${labels ? Object.keys(REGIONS).map(lab).join('') : ''}</svg>`;
}

export const legend = () => `<div class="mk-legend">${Object.entries(LABS).map(([, l]) => `<span><i style="background:${l.color}"></i>${l.name}</span>`).join('')}</div>`;
