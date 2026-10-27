// O2 · Size your own deal on a shared price ladder. Each supplier sells blocks; the cheapest open block goes
// first, rivals bought from the same ladders last quarter (their monograms), and the ladder refills from the
// dearest end. Prices and block sizes are illustrative, scaled from the era 2 board (era2Deals, seed 7).
import { board, commitments, team } from './harness.js';

const LABS = { O: 'openbrain', D: 'deepthink', L: 'lodestar', Q: 'qilin' };

// steps: [price, state] where state is 'O'/'D'/'L'/'Q' (bought by that rival), 'you' (your pick) or '' (open).
function ladder({ name, kind, mono, supplier, arrives, term, block, steps, pick, note }) {
  const rows = steps.map(([price, who]) => {
    const lab = LABS[who];
    const cls = lab ? `taken mk-${lab}` : who === 'you' ? 'you' : 'open';
    const tag = lab ? `<span class="mk-mono">${who}</span>` : who === 'you' ? '<b>you</b>' : '';
    return `<div class="mk-step-row ${cls}"><span class="p">${price}×</span><span class="bar">${tag}</span></div>`;
  }).join('');
  return `<div class="company-card supplier-${supplier} mk-ladder-card${pick ? ' selected' : ''}">
    <span class="company-who"><span class="company-monogram">${mono}</span><span><strong>${name}</strong><span class="company-kind">${kind}</span></span></span>
    <span class="mk-ladder-meta">${arrives} · ${term} · blocks of ${block}</span>
    <div class="mk-ladder">${rows}</div>
    <span class="mk-ladder-pick">${pick ?? '<span class="mk-muted">Drag to pick a size</span>'}</span>
    ${note ? `<span class="company-explanation">${note}</span>` : ''}
    ${pick ? '<span class="company-selected">Selected</span>' : ''}
  </div>`;
}

export default async function () {
  const cards = [
    ladder({ name: 'Verde', kind: 'Chip order', mono: 'V', supplier: 'verde', arrives: 'about 9 months', term: '24 months', block: 20,
      steps: [['0.85', 'O'], ['0.9', 'O'], ['1.0', ''], ['1.15', ''], ['1.35', ''], ['1.6', '']], note: 'OpenBrain took the two cheapest blocks last quarter.' }),
    ladder({ name: 'Azuria', kind: 'Cloud', mono: 'A', supplier: 'azuria', arrives: 'about 3 months', term: '24 months', block: 12,
      steps: [['1.6', 'D'], ['1.8', ''], ['2.0', ''], ['2.3', ''], ['2.7', ''], ['3.2', '']] }),
    ladder({ name: 'CoreFlame', kind: 'Neocloud', mono: 'C', supplier: 'coreflame', arrives: 'about 3 months', term: '12 months', block: 10,
      steps: [['1.0', 'L'], ['1.1', 'you'], ['1.25', 'you'], ['1.45', ''], ['1.7', ''], ['2.0', '']],
      pick: '<b>20 units</b> · $34M/mo<br><span class="mk-muted">average 1.18× · next block 1.45×</span>' }),
    ladder({ name: 'Spot market', kind: 'Rent now', mono: 'S', supplier: 'spot', arrives: 'now', term: 'renews each quarter', block: 4,
      steps: [['4.0', '']], note: 'One flat price for any amount, no ladder. Pulled first when chips run short.' }),
  ].join('');
  const body = `
    <div class="deal-cards mk-ladders">${cards}</div>
    <div class="deal-round-end mk-roundend"><b>At the quarter's end</b>
      <span class="mk-openbrain"><i class="mk-dot"></i>OpenBrain buys 2 more Verde blocks (1.0× and 1.15×)</span>
      <span class="mk-deepthink"><i class="mk-dot"></i>DeepThink 1 Azuria block</span>
      <span>Every ladder refills 1 block at its dearest step</span></div>`;
  const done = await board({
    subtitle: 'Era 2 · The scale-up · buy blocks from the cheapest open step; rivals buy from the same ladders',
    body,
    left: team([
      ['Head of Research', 'Eager', 'Twenty units is a Medium run. Ten more costs us 1.45×.'],
      ['CFO', 'Uneasy', 'OpenBrain is buying Verde early. Wait and the cheap steps are gone.'],
      ['Head of Safety', 'Calm', 'Buy what the run needs, not a year ahead.'],
      ['Policy and Comms', 'Calm', 'Nobody reads ladders. They read who bought the most.'],
    ]),
    note: 'Signing uses 1 of your 2 team actions this quarter · CoreFlame 20 units, nothing to pay now',
  });
  commitments({ name: 'CoreFlame (new)', units: '20 units', bill: '$34M/mo', when: 'arrives in about 3 months', billAfter: '$63M/mo', runwayAfter: 'about 17 months', from: 'Jul 2024' });
  return done;
}
