// Mockup harness: opens on top of the real game (index.html?scenario=...#deals) and swaps the deal board's
// content for an option's drawing, so every mockup sits in the real office, HUD and dialog frame.
// Run through tools/cdp-shot.mjs with a job script such as:
//   const m = await import('/docs/research/compute-deals/mockups/O2.js?' + Date.now()); return await m.default();
// Research only: nothing here is loaded by the game.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ready(selector = '.dialog-layer') {
  for (let i = 0; i < 60; i += 1) {
    const node = document.querySelector(selector);
    if (node) return node;
    await sleep(100);
  }
  throw new Error(`no ${selector}`);
}

export function style() {
  if (document.querySelector('#mockup-css')) return;
  const link = document.createElement('link');
  link.id = 'mockup-css';
  link.rel = 'stylesheet';
  link.href = `/docs/research/compute-deals/mockups/mockup.css?${Date.now()}`;
  document.head.append(link);
  return new Promise((r) => link.addEventListener('load', r, { once: true }));
}

// Replace parts of the open dialog. Any field left out keeps the real game's content.
export async function board({ title, subtitle, body, left, leftTitle, right, rightTitle, ok, note, layerClass }) {
  const layer = await ready();
  await style();
  if (layerClass) layer.classList.add(...layerClass.split(' '));
  if (title != null) layer.querySelector('.dlg h1').textContent = title;
  if (subtitle != null) layer.querySelector('.dlg .subt').textContent = subtitle;
  if (body != null) {
    const holder = layer.querySelector('.dialog-body');
    const footer = holder.querySelector('.company-footer');
    for (const child of [...holder.children]) if (child !== footer) child.remove();
    const wrap = document.createElement('div');
    wrap.className = 'mk-body';
    wrap.innerHTML = body;
    holder.insertBefore(wrap, footer);
  }
  const side = (pos, html, head) => {
    const panel = layer.querySelector(`.dialog-${pos}`);
    if (!panel) return;
    if (html != null) panel.querySelector('.dialog-side-content').innerHTML = html;
    if (head != null) panel.querySelector('.hd').textContent = head;
  };
  side('left', left, leftTitle);
  side('right', right, rightTitle);
  if (ok != null) layer.querySelector('.dialog-ok').textContent = ok;
  if (note != null) layer.querySelector('.company-footer-note').textContent = note;
  await sleep(150);
  return 'ok';
}

// Team panel rows in the game's own markup (ui/components/team.js, opinions mode).
export const team = (rows) => `<div class="budget-team">${rows.map(([who, mood, line]) => `
  <div class="compute-opinion"><div class="compute-opinion-heading"><span>${who}</span><span class="compute-mood ${mood.toLowerCase()}">${mood}</span></div>
  <q>${line}</q></div>`).join('')}</div>`;

// Close every dialog and show the office with HTML drawn into the overlay instead.
export async function office(html, cls = '') {
  await style();
  document.querySelectorAll('.dialog-layer').forEach((n) => n.remove());
  const host = document.querySelector('#overlay');
  const wrap = document.createElement('div');
  wrap.className = `mk-office ${cls}`;
  wrap.innerHTML = html;
  host.append(wrap);
  await sleep(150);
  return 'ok';
}

// Hide the speech bubbles a scenario's own event put over the office, so a frame shows only its option.
export function hideOfficeBubbles() {
  document.querySelectorAll('.ev-bubble').forEach((n) => { n.style.display = 'none'; });
  const gotIt = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Got it');
  if (gotIt) gotIt.closest('[class]').parentElement.style.display = 'none';
}

// Point the real Commitments panel at the mockup's pick: the striped "new" row, the bill after signing and
// the runway after signing.
export function commitments({ name, units, bill, when, billAfter, runwayAfter, from }) {
  const panel = document.querySelector('.commitments-panel');
  if (!panel) return;
  const row = panel.querySelector('.commitment-row.new');
  if (row) {
    const [n, b] = row.querySelectorAll('.r1 span');
    const [u, w] = row.querySelectorAll('.r2 span');
    n.textContent = name; b.textContent = bill; u.textContent = units; w.textContent = when;
  }
  const after = panel.querySelector('.compute-bill-row b.after');
  if (after && billAfter) after.textContent = billAfter;
  const afterLabel = panel.querySelector('.compute-bill-row b.after')?.previousElementSibling;
  if (afterLabel && from) afterLabel.textContent = `After signing, from ${from}`;
  const runway = panel.querySelector('.compute-runway-row.compact b');
  if (runway && runwayAfter) runway.textContent = runwayAfter;
}
