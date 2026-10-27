// O3 · Contested deals. A big card shows how many labs want it and the day a named rival will take it (Football
// Manager's "2 Interested Clubs" and deadline line). The player signs at the printed price, stalls once for a fee,
// or lets it go. Interest and dates come from the seeded schedule, so nothing is rolled. Numbers are illustrative.
import { board, team } from './harness.js';

const card = ({ name, kind, mono, supplier, big, rows, interest, contested, selected }) => `
  <div class="company-card supplier-${supplier} mk-c-card${selected ? ' selected' : ''}${contested ? ' mk-contested' : ''}">
    ${contested ? `<span class="company-taken">Contested · ${contested}</span>` : ''}
    <span class="company-who"><span class="company-monogram">${mono}</span><span><strong>${name}</strong><span class="company-kind">${kind}</span></span></span>
    <span class="company-big">${big}<small>units</small></span>
    <span class="company-kv">${rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('')}</span>
    <span class="mk-interest">${interest}</span>
    ${selected ? '<span class="company-selected">Selected</span>' : ''}
  </div>`;

export default async function () {
  const cards = [
    card({ name: 'Verde', kind: 'Chip order', mono: 'V', supplier: 'verde', big: 105,
      rows: [['Arrives', 'about 9 months'], ['Price', '0.85× base'], ['Upfront', '$444M']],
      interest: '<span class="mk-openbrain"><i class="mk-dot"></i>OpenBrain asked about it. Its date comes in about 6 weeks.</span>' }),
    card({ name: 'Azuria', kind: 'Cloud', mono: 'A', supplier: 'azuria', big: 36,
      rows: [['Arrives', 'about 3 months'], ['Price', '2× base'], ['Upfront', 'none']],
      interest: '<span class="mk-muted">No other lab wants it.</span>' }),
    card({ name: 'CoreFlame', kind: 'Neocloud', mono: 'C', supplier: 'coreflame', big: 30, selected: true, contested: '2 labs interested',
      rows: [['Arrives', 'about 3 months'], ['Price', '1.1× base'], ['Upfront', 'none']],
      interest: `<span class="mk-offers">
        <span class="mk-deepthink"><i class="mk-dot"></i>DeepThink takes it on <b>day 18</b></span>
        <span class="mk-lodestar"><i class="mk-dot"></i>Lodestar also asked <b>day 30</b></span></span>
        <span class="mk-deadline"><span>CoreFlame answers DeepThink in <b>9 days</b></span><i><b style="width:70%"></b></i></span>
        <span class="mk-actions"><span class="mk-btn">Sign at 1.1×</span><span class="mk-btn ghost">Stall 10 days · $5M</span><span class="mk-btn ghost">Let it go</span></span>
        <span class="mk-muted">If you pass: DeepThink's fleet +30 units from July.</span>` }),
    card({ name: 'Spot market', kind: 'Rent now', mono: 'S', supplier: 'spot', big: 12,
      rows: [['Arrives', 'now'], ['Price', '4× base'], ['Upfront', 'none']],
      interest: '<span class="mk-muted">Never contested: anyone can rent.</span>' }),
  ].join('');
  const body = `
    <div class="deal-cards mk-c-cards">${cards}</div>
    <div class="deal-round-end mk-roundend"><b>How contests work</b>
      <span>Interest and dates are announced ahead; nothing is rolled.</span>
      <span>Sign before the date and the card is yours at its printed price.</span>
      <span>Stall once per card.</span></div>`;
  return board({
    subtitle: 'Era 2 · The scale-up · rivals want some cards too; each one shows who and by when',
    body,
    left: team([
      ['Head of Research', 'Eager', 'If DeepThink gets CoreFlame, its next run is Medium and ours waits.'],
      ['CFO', 'Uneasy', 'Stalling costs $5M and buys ten days. Only once.'],
      ['Head of Safety', 'Calm', 'Letting it go leaves Azuria. Dearer, but nobody wants it.'],
      ['Policy and Comms', 'Calm', 'Taking a card DeepThink asked for gets reported.'],
    ]),
    rightTitle: 'Rival interest',
    right: `<div class="mk-inplay">
      <div class="mk-ip-row mk-openbrain"><span class="mk-mono">O</span><div><b>OpenBrain</b><span>Asking Verde about 105 units. Answer due in about 6 weeks.</span></div></div>
      <div class="mk-ip-row mk-deepthink"><span class="mk-mono">D</span><div><b>DeepThink</b><span>Takes CoreFlame on day 18. Short of compute: its run is waiting.</span></div></div>
      <div class="mk-ip-row mk-lodestar"><span class="mk-mono">L</span><div><b>Lodestar</b><span>Asked CoreFlame for day 30, after DeepThink.</span></div></div>
      <div class="mk-ip-row mk-qilin"><span class="mk-mono">Q</span><div><b>Qilin</b><span>No interest. Buys only home-made chips.</span></div></div>
      <div class="mk-ip-you"><b>You</b><span>CoreFlame is yours if you sign before day 18.</span></div>
    </div>`,
    ok: 'Sign',
    note: 'Signing uses 1 of your 2 team actions this quarter · stalling is free of actions',
  });
}
