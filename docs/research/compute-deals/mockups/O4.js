// O4 · Forecast and commit. The deal board opens on six quarters of your committed compute against what you
// will need, the selected card's effect drawn in, and the rivals' announced fleets on the same timeline (rumour,
// then confirmation, then online, like Game Dev Tycoon's dated platform news). Numbers are illustrative.
import { board, team } from './harness.js';

const Q = ['Q3 2024', 'Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'];
const current = [19, 10, 10, 0, 0, 0];   // starter cloud and CoreFlame end
const added = [30, 30, 30, 30, 0, 0];    // the selected CoreFlame card from July, firm 12 months
const need = [21, 24, 27, 30, 34, 38];   // users plus the next run

function chart() {
  const W = 740, H = 190, left = 34, top = 14, col = (W - left - 8) / 6, max = 50;
  const y = (v) => top + (H - top - 26) * (1 - v / max);
  let s = '';
  for (const v of [0, 25, 50]) s += `<line x1="${left}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" class="mk-grid"/><text x="${left - 6}" y="${y(v) + 4}" class="mk-axis" text-anchor="end">${v}</text>`;
  Q.forEach((q, i) => {
    const x = left + i * col + 14, w = col - 28;
    const c = current[i], a = added[i], n = need[i];
    if (c) s += `<rect x="${x}" y="${y(c)}" width="${w}" height="${y(0) - y(c)}" class="mk-cur"/>`;
    if (a) s += `<rect x="${x}" y="${y(c + a)}" width="${w}" height="${y(c) - y(c + a)}" class="mk-new"/>`;
    const have = c + a;
    if (have < n) s += `<rect x="${x}" y="${y(n)}" width="${w}" height="${y(have) - y(n)}" class="mk-short"/>`;
    s += `<line x1="${x - 8}" x2="${x + w + 8}" y1="${y(n)}" y2="${y(n)}" class="mk-need"/>`;
    s += `<text x="${x + w / 2}" y="${H - 6}" class="mk-axis" text-anchor="middle">${q}</text>`;
  });
  s += `<text x="${left + 3 * col + 14}" y="${y(30) - 8}" class="mk-anno">starter cloud ends</text>`;
  s += `<text x="${left + 5 * col + 14}" y="${y(38) - 8}" class="mk-anno mk-bad-fill">short 38</text>`;
  s += `<text x="${left + 0 * col + 14}" y="${y(49) - 6}" class="mk-anno">idle 28</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="mk-forecast" role="img" aria-label="Committed compute against need for six quarters">${s}</svg>`;
}

const rivalLane = `
  <span class="mk-k mk-lane-k">Rivals' fleets, from the news</span>
  <div class="mk-lane">
    <span class="mk-pin mk-deepthink" style="grid-area:1/2/2/4"><i class="mk-dot"></i>DeepThink +36 Azuria <em>signed</em></span>
    <span class="mk-pin mk-qilin" style="grid-area:2/3/3/5"><i class="mk-dot"></i>Qilin home chips <em>rumour</em></span>
    <span class="mk-pin mk-openbrain" style="grid-area:1/4/2/7"><i class="mk-dot"></i>OpenBrain Iowa campus, 120 units <em>announced</em></span>
  </div>`;

const small = (name, mono, supplier, big, line, sel) => `
  <div class="company-card supplier-${supplier} mk-s-card${sel ? ' selected' : ''}">
    <span class="company-who"><span class="company-monogram">${mono}</span><span><strong>${name}</strong></span></span>
    <span class="mk-s-big">${big}<small> units</small></span><span class="mk-s-line">${line}</span>
    ${sel ? '<span class="company-selected">Selected</span>' : ''}</div>`;

export default async function () {
  const body = `
    <div class="mk-fc-head"><span class="mk-k">Next six quarters</span>
      <span class="mk-legend"><i class="cur"></i>signed <i class="new"></i>this deal <i class="short"></i>short <i class="need"></i>you will need</span></div>
    ${chart()}
    ${rivalLane}
    <div class="deal-cards mk-s-cards">
      ${small('Verde', 'V', 'verde', 105, 'from Q2 2025 · 24 months')}
      ${small('Azuria', 'A', 'azuria', 36, 'from Q3 2024 · 24 months')}
      ${small('CoreFlame', 'C', 'coreflame', 30, 'from Q3 2024 · 12 months', true)}
      ${small('Spot market', 'S', 'spot', 12, 'now · each quarter')}
    </div>`;
  return board({
    subtitle: 'Era 2 · The scale-up · every contract is a bet on what you will need',
    body,
    left: team([
      ['Head of Research', 'Eager', 'CoreFlame covers the next run, then we are short again from Q3 2025.'],
      ['CFO', 'Uneasy', 'Twenty-eight idle units next quarter. Flexible lets us walk away.'],
      ['Head of Safety', 'Calm', 'OpenBrain\'s campus lands in Q2. Plan for a faster race after it.'],
      ['Policy and Comms', 'Calm', 'Announcements move the press. Signing quietly does not.'],
    ]),
    rightTitle: 'This deal',
    right: `<div class="mk-deal-side">
      <span class="mk-k">Terms</span>
      <div class="mk-seg"><span class="on">Firm<small>1.1× · pay every month</small></span><span>Flexible<small>1.3× · leave with a quarter's notice</small></span></div>
      <div class="mk-ds-row"><span>Bill after signing</span><b>$77M/mo</b></div>
      <div class="mk-ds-row"><span>Idle next quarter</span><b class="mk-bad">28 units · $44M/mo</b></div>
      <div class="mk-ds-row"><span>Short in Q4 2025</span><b class="mk-bad">38 units</b></div>
      <div class="mk-grade"><b>CFO's grade, era 1</b><span>39% of the compute bill paid for idle units (the balanced bot\'s measured era 1 share). Grade C.</span></div>
    </div>`,
    note: 'Signing uses 1 of your 2 team actions this quarter · nothing to pay now',
  });
}
