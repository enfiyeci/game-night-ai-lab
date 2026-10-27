// O6 · The compute exchange. One live price per unit-month that every lab's buying moves; a spike says someone
// bought, never who (Offworld Trading Company). Drawn in the office as a HUD panel with its trade popover open.
// Numbers are illustrative.
import { hideOfficeBubbles, office } from './harness.js';

function spark() {
  const pts = [32, 31.6, 32.3, 31.8, 32.4, 32, 32.6, 32.1, 32.5, 32.2, 32.1, 36, 35.6, 35.2, 34.9, 35.3, 35.6, 37.8];
  const W = 290, H = 70, step = W / (pts.length - 1), y = (v) => H - 6 - (v - 30.5) * 7.5;
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${W},${H} L0,${H} Z`;
  const sx = 11 * step, ex = 17 * step;
  return `<svg viewBox="0 0 ${W} ${H}" class="mk-spark" aria-hidden="true">
    <path d="${area}" class="a"/><path d="${d}" class="l"/>
    <circle cx="${sx}" cy="${y(36)}" r="4" class="s"/><circle cx="${ex}" cy="${y(37.8)}" r="4.5" class="e"/></svg>`;
}

export default async function () {
  hideOfficeBubbles();
  return office(`
    <section class="gp mk-ticker">
      <div class="hd">Compute exchange</div>
      <div class="mk-tk-body">
        <div class="mk-tk-top"><span class="mk-tk-price">$1.52M</span><span class="mk-muted">per unit, per month</span><span class="mk-tk-up">▲ 18% this quarter</span></div>
        ${spark()}
        <div class="mk-tk-events">
          <span><i class="mk-tick"></i><b>Week 3</b> Someone bought 40 units. Price +12%.</span>
          <span><i class="mk-tick"></i><b>Today</b> Someone bought 24 units. Price +6%.</span>
        </div>
        <div class="mk-tk-row"><span>Your idle units</span><b>5.5 · sell at half price, $4M/mo</b></div>
        <div class="mk-tk-actions"><span class="mk-btn">Buy 6 now · $9M</span><span class="mk-btn ghost">Sell idle</span><span class="mk-btn ghost">Lock price · 12 months</span></div>
      </div>
    </section>
    <div class="mk-bubble" style="left:530px; top:268px"><span class="who">CFO</span>Someone just bought big. Lock today's price before the next spike, or wait for it to drift back down?</div>
    <div class="mk-bubble" style="left:910px; top:378px"><span class="who">Head of Research</span>Forty units at once? That is a Large run. Probably OpenBrain.</div>`);
}
