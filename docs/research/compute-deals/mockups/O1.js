// O1 · Free compute you can always see. Frame A: the budget dialog's compute box as three rows with the
// free-for-training line and the rivals' runs beside it. Frame B: the stall card in the office.
// Numbers in frame A come from the era2Deals scenario, seed 7 (19 units online, users 4.7, safety 3.8,
// a 5-unit run, 5.5 idle); the rival runs are illustrative.
import { hideOfficeBubbles, ready, style, team } from './harness.js';

const rivals = `
  <div class="mk-rivals"><b>Training right now</b>
    <span class="mk-openbrain"><i class="mk-dot"></i>OpenBrain · Medium run on 40 units, 6 weeks in</span>
    <span class="mk-deepthink"><i class="mk-dot"></i>DeepThink · Small on 14</span>
    <span class="mk-qilin"><i class="mk-dot"></i>Qilin · Medium on 22</span>
    <span class="mk-lodestar"><i class="mk-dot"></i>Lodestar · waiting for chips</span>
  </div>`;

export async function frameA() {
  const layer = await ready();
  await style();
  const heads = [...layer.querySelectorAll('.compute-section')];
  heads.at(-1).textContent = 'Compute · 19 units online · bill $29M a month, used or not';
  layer.querySelector('.compute-box').innerHTML = `
    <div class="mk-body">
      <div class="mk-free">
        <div><div class="big">Free for training: <b>5.5 units</b>. A Small run needs 6.</div>
        <div class="sub mk-muted">Users take 4.7 and safety 3.8 of your 19 units. Serve 75% of users or sign a deal to start the next run.</div></div>
        <span class="mk-btn">Get compute</span>
      </div>
      <div class="mk-rows">
        <div class="mk-row"><b>Users</b>
          <div class="mk-seg"><span class="on">Serve everyone<small>4.7 units</small></span><span>Serve 75%<small>3.5 units</small></span><span>Serve 50%<small>2.4 units</small></span></div>
          <span class="note">Everyone served. 75% frees 1.2 units; <span class="mk-bad">about 4,000 users leave a month</span>.</span></div>
        <div class="mk-row"><b>Safety</b>
          <div class="mk-step"><i>−</i>20% · 3.8 units<i>+</i></div>
          <span class="note mk-good">Pledge 10% kept.</span></div>
        <div class="mk-row"><b>Training</b>
          <div class="mk-train"><span class="run" style="flex:5">Kestrel 3 · 5 units</span><span class="free" style="flex:5.5">5.5 free</span></div>
          <span class="note">Next run: Small needs 6, Medium 15.</span></div>
      </div>
      ${rivals}
    </div>`;
  layer.querySelector('.dialog-left .dialog-side-content').innerHTML = team([
    ['Head of Research', 'Eager', 'Half a unit short of a Small run. OpenBrain is six weeks into a Medium one.'],
    ['CFO', 'Calm', 'Serving 75% costs us users, not money. A deal costs money.'],
    ['Head of Safety', 'Calm', '20% keeps our 10% pledge.'],
    ['Policy and Comms', 'Uneasy', 'Turning users away makes the news.'],
  ]);
  return 'ok';
}

export async function frameB() {
  const card = await ready('.ev-card');
  await style();
  hideOfficeBubbles();
  card.querySelector('h1').textContent = 'No training run fits';
  card.querySelector('.ev-due span').textContent = 'OpenBrain is 6 weeks into a Medium run';
  card.querySelector('.ev-due-bar i').style.width = '45%';
  const src = card.querySelector('.ev-src');
  src.className = 'ev-src ev-src-letter';
  src.querySelector('.ev-src-name').textContent = 'Head of Research';
  src.querySelector('.ev-src-text').textContent = 'Users and safety leave us 5.5 free units. The smallest run needs 6. Pick one way out, or we sit this quarter out while OpenBrain trains.';
  card.querySelector('.ev-choices').innerHTML = `
    <button type="button" class="ev-choice"><span class="ev-choice-label">Sign CoreFlame's 30 units</span><span class="ev-choice-cost">Cost: <b>$48M a month for 12 months · online in 3 months</b></span><span class="ev-who"><span class="ev-chip mk-rivalchip">Lodestar takes it at the quarter's end</span><span class="ev-chip for">✓ Research</span><span class="ev-chip against" aria-label="CFO is against">CFO</span></span></button>
    <button type="button" class="ev-choice"><span class="ev-choice-label">Serve 75% of users</span><span class="ev-choice-cost">Cost: <b>about 4,000 users leave a month</b></span><span class="ev-who"><span class="ev-chip for">✓ CFO</span><span class="ev-chip against" aria-label="Comms is against">Comms</span></span></button>
    <button type="button" class="ev-choice"><span class="ev-choice-label">Rent spot for one Small run</span><span class="ev-choice-cost">Cost: <b>$18M for this run, 4× the price</b></span><span class="ev-who"><span class="ev-chip idle">Starts today</span><span class="ev-chip for">✓ Research</span><span class="ev-chip against" aria-label="CFO is against">CFO</span></span></button>`;
  return 'ok';
}
