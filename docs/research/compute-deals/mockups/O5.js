// O5 · Supplier weather. Market changes are announced quarters ahead on a seeded schedule (Game Dev Tycoon's
// dated platform news: rumour, confirmation, date), every supplier card carries a health mark, and the side panel
// shows which rival rides which supplier, so a shock hurts some labs and not others. Numbers are illustrative.
import { board, team } from './harness.js';

const front = (when, head, what, cls = '') => `
  <div class="mk-front ${cls}"><span class="mk-front-when">${when}</span><b>${head}</b><span>${what}</span></div>`;

const card = ({ name, kind, mono, supplier, big, rows, health, healthCls, line, sel }) => `
  <div class="company-card supplier-${supplier} mk-c-card${sel ? ' selected' : ''}">
    <span class="company-who"><span class="company-monogram">${mono}</span><span><strong>${name}</strong><span class="company-kind">${kind}</span></span></span>
    <span class="company-big">${big}<small>units</small></span>
    <span class="company-kv">${rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('')}</span>
    <span class="mk-health ${healthCls}">${health}</span>
    <span class="company-explanation">${line}</span>
    ${sel ? '<span class="company-selected">Selected</span>' : ''}</div>`;

export default async function () {
  const body = `
    <div class="mk-fronts">
      <span class="mk-k">Coming to the market</span>
      ${front('in 2 quarters', 'Memory sold out', 'Chip orders signed after October arrive 2 quarters late.', 'bad')}
      ${front('in 3 quarters', 'Next chip generation ships', 'Older chips drop 40%. Contracts signed before then keep their price.')}
      ${front('next quarter', 'CoreFlame refinances', 'It missed a payment. If the refinancing fails, its customers lose a quarter.', 'bad')}
    </div>
    <div class="deal-cards mk-c-cards mk-w-cards">
      ${card({ name: 'Verde', kind: 'Chip order', mono: 'V', supplier: 'verde', big: 105, rows: [['Arrives', 'about 9 months'], ['Price', '0.85× base']],
        health: 'Sign before October', healthCls: 'warn', line: 'Signed now, it arrives on time. After October it slips 2 quarters.', sel: true })}
      ${card({ name: 'Azuria', kind: 'Cloud', mono: 'A', supplier: 'azuria', big: 36, rows: [['Arrives', 'about 3 months'], ['Price', '2× base']],
        health: 'Steady', healthCls: 'good', line: 'Owns its data centres. Untouched by the memory shortage.' })}
      ${card({ name: 'CoreFlame', kind: 'Neocloud', mono: 'C', supplier: 'coreflame', big: 30, rows: [['Arrives', 'about 3 months'], ['Price', '1.1× base']],
        health: 'Shaky · bonds at 15%', healthCls: 'bad', line: 'Cheap because it is fragile. The refinancing decides next quarter.' })}
      ${card({ name: 'Spot market', kind: 'Rent now', mono: 'S', supplier: 'spot', big: 12, rows: [['Arrives', 'now'], ['Price', '4× base']],
        health: 'Price jumps when memory runs out', healthCls: 'warn', line: 'Spot rises with the shortage, for everyone.' })}
    </div>`;
  return board({
    subtitle: 'Era 2 · The scale-up · announced changes arrive on their dates; nothing is rolled',
    body,
    left: team([
      ['Head of Research', 'Eager', 'Sign Verde before October or wait half a year longer for it.'],
      ['CFO', 'Uneasy', 'CoreFlame is cheap for a reason. Lodestar is betting on it.'],
      ['Head of Safety', 'Calm', 'Old chips get cheap in three quarters. Safety evals can run on those.'],
      ['Policy and Comms', 'Calm', 'If CoreFlame fails, the press will ask who was on it.'],
    ]),
    rightTitle: 'Who rides which supplier',
    right: `<div class="mk-inplay">
      <div class="mk-ip-row mk-openbrain"><span class="mk-mono">O</span><div><b>OpenBrain</b><span>Verde chips, ordered late. <em class="mk-bad">Hit by the memory shortage.</em></span></div></div>
      <div class="mk-ip-row mk-lodestar"><span class="mk-mono">L</span><div><b>Lodestar</b><span>Most of its fleet on CoreFlame. <em class="mk-bad">Loses a quarter if CoreFlame fails.</em></span></div></div>
      <div class="mk-ip-row mk-deepthink"><span class="mk-mono">D</span><div><b>DeepThink</b><span>Azuria. <em class="mk-good">Safe from all three.</em></span></div></div>
      <div class="mk-ip-row mk-qilin"><span class="mk-mono">Q</span><div><b>Qilin</b><span>Home-made chips. <em>Its own export-rule date: Q3 2025.</em></span></div></div>
      <div class="mk-ip-you"><b>You</b><span>Starter cloud and 9 CoreFlame units: 9 at risk next quarter.</span></div>
    </div>`,
    note: 'Signing uses 1 of your 2 team actions this quarter · pay $444M now',
  });
}
