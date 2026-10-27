// O7 · Stakes and fire sales. Buy into a supplier for first call on its capacity and a share of what rivals pay
// it; a control line at 50% (Offworld's majority buyouts, Capitalism Lab's 50% rule). A rival
// that runs out of money puts its fleet up on a dated sale everyone can bid in (COLD AISLE's liquidation lots,
// shown in advance). Numbers are illustrative.
import { board, team } from './harness.js';

export default async function () {
  const body = `
    <div class="mk-stake">
      <div class="mk-stake-who"><span class="company-monogram mk-cf">C</span><div><b>CoreFlame</b><span class="company-kind">Neocloud · 300 units · selling 20%</span></div></div>
      <div class="mk-own">
        <span class="mk-k">Who owns CoreFlame</span>
        <div class="mk-own-bar"><i class="mk-lodestar" style="flex:31"><b>Lodestar 31%</b></i><i class="mk-you" style="flex:20"><b>You +20%</b></i><i class="mk-founders" style="flex:49"><b>Founders 49%</b></i></div>
        <div class="mk-own-ticks"><span style="left:50%">50%: control</span></div>
      </div>
      <div class="mk-stake-terms">
        <div><span>Price</span><b>$300M once</b></div>
        <div><span>First call</span><b>60 units at 1.0×</b></div>
        <div><span>Your share of rivals' bills</span><b>about $9M/mo</b></div>
      </div>
      <div class="mk-warn"><b>OpenBrain can afford control.</b> If it buys 51%, its rivals' CoreFlame contracts end at renewal. Your 20% would block it only together with Lodestar.</div>
    </div>
    <div class="mk-sales">
      <span class="mk-k">Fire sales on the calendar</span>
      <div class="mk-sale mk-lodestar"><span class="mk-mono">L</span><div><b>Lodestar's fleet, 60 units</b><span>Its runway ends in about 2 quarters. If it does not raise, the fleet is auctioned in Q2 2025. Every lab can bid.</span></div><span class="mk-sale-when">Q2 2025</span></div>
      <div class="mk-sale mk-qilin"><span class="mk-mono">Q</span><div><b>Qilin's spare home chips</b><span>Sold when export rules change. Only labs outside the rules can buy.</span></div><span class="mk-sale-when">Q3 2025</span></div>
    </div>`;
  return board({
    title: 'Buy into a supplier',
    subtitle: 'Era 2 · The scale-up · own part of the market instead of renting it',
    body,
    left: team([
      ['Head of Research', 'Eager', 'First call on 60 units is two Medium runs a year.'],
      ['CFO', 'Uneasy', '$300M is a quarter of our cash. Rivals\' bills pay some of it back.'],
      ['Head of Safety', 'Calm', 'If OpenBrain controls CoreFlame, Lodestar loses its compute.'],
      ['Policy and Comms', 'Uneasy', 'Buying Lodestar\'s fleet in a fire sale looks like picking at bones.'],
    ]),
    rightTitle: 'Stakes',
    right: `<div class="mk-inplay">
      <div class="mk-ip-row mk-openbrain"><span class="mk-mono">O</span><div><b>OpenBrain</b><span>Cash $4.1B. Can buy control of CoreFlame or Azuria.</span></div></div>
      <div class="mk-ip-row mk-lodestar"><span class="mk-mono">L</span><div><b>Lodestar</b><span>31% of CoreFlame. Runway about 2 quarters.</span></div></div>
      <div class="mk-ip-row mk-deepthink"><span class="mk-mono">D</span><div><b>DeepThink</b><span>No stakes. Signed with Azuria for 2 years.</span></div></div>
      <div class="mk-ip-row mk-qilin"><span class="mk-mono">Q</span><div><b>Qilin</b><span>Owns its chip lines.</span></div></div>
    </div>`,
    ok: 'Buy 20%',
    note: 'Buying a stake uses 1 of your 2 team actions this quarter · pay $300M now',
  });
}
