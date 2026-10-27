// IPO direction mockups (lane gn-ipo), drawn into the running game. apply(name) is called from tools/cdp-shot.mjs jobs.
// Numbers in these frames are illustrative, not tuned.
const css = document.createElement('link');
css.rel = 'stylesheet';
css.href = '/mock/mock.css';
document.head.append(css);
await new Promise((r) => { css.onload = r; setTimeout(r, 800); });

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function hideTips() {
  $$('.intro-layer, .ev-busy').forEach((n) => n.classList.add('mk-hide'));
  for (const el of $$('#overlay *, #fx *, body > *')) {
    if (el.children.length < 6 && /That buzzing on your desk|Let us show you around/.test(el.textContent || '')) el.classList.add('mk-hide');
  }
}

// A chip under the board countdown, cloned from it so it keeps the game's look.
function chip(inner, top = 362) {
  const base = $('.bd-count');
  if (!base) return;
  base.hidden = false;
  const c = base.cloneNode(true);
  c.classList.add('mk-chip');
  c.style.top = `${top}px`;
  c.querySelector('span').innerHTML = inner;
  base.after(c);
}

function rewriteCard({ title, src, text, choices }) {
  const card = $('.ev-card');
  card.querySelector('h1').textContent = title;
  card.querySelector('.ev-src-name').textContent = src;
  card.querySelector('.ev-src-text').textContent = text;
  const btns = $$('.ev-choice', card);
  choices.forEach((ch, i) => {
    const b = btns[i];
    b.querySelector('.ev-choice-label').textContent = ch.label;
    b.querySelector('.ev-choice-cost').innerHTML = `Cost: <b>${ch.cost}</b>`;
    b.querySelector('.ev-who').innerHTML = ch.who.map(([kind, t]) => `<span class="ev-chip ${kind}">${kind === 'for' ? '✓ ' : ''}${t}</span>`).join('');
  });
}

function rewriteBubbles(map) {
  for (const b of $$('.ev-bubble:not([hidden])')) {
    const who = b.querySelector('b')?.textContent?.trim();
    const m = map[who];
    if (!m) { b.classList.add('mk-hide'); continue; }
    b.querySelector('.ev-say').textContent = m[0];
    b.querySelector('.ev-pick').textContent = `✓ ${m[1]}`;
  }
}

function dialog({ title, subt, body, ok = 'Close' }) {
  const layer = html(`<div class="dialog-layer dialog-open mk-dlg" role="dialog" aria-modal="true">
    <div class="dialog-veil" aria-hidden="true"></div>
    <section class="gp dlg dialog-centre" tabindex="-1">
      <h1>${title}</h1><div class="subt">${subt}</div><div class="rule"></div>
      <div class="dialog-body">${body}</div>
      <button class="btn dialog-ok" type="button">${ok}</button>
    </section></div>`);
  $('#overlay').append(layer);
  return layer;
}

const MOCKS = {
  // A: an SEC comment letter arrives as an event card, with the IPO track chip under the board countdown.
  async A1() {
    hideTips();
    rewriteCard({
      title: 'The SEC’s second letter: the agent that let itself in',
      src: 'SEC · Corporation Finance',
      text: 'Comment 7. Your risk factors say an agent “could” act beyond its permissions. Your incident log says one did, in February. Revise, or tell us why not.',
      choices: [
        { label: 'Disclose it in full', cost: 'a smaller book on pricing night', who: [['for', 'Safety'], ['for', 'Staff'], ['against', 'CFO']] },
        { label: 'Write “has happened, may again”', cost: 'one hard roadshow question', who: [['for', 'Comms'], ['for', 'CFO']] },
        { label: 'Keep it hypothetical', cost: 'nothing now; a lawsuit if it comes out', who: [['idle', 'If time runs out'], ['for', 'CFO'], ['against', 'Safety']] },
      ],
    });
    rewriteBubbles({
      'Head of Safety': ['It happened. Writing “could” is the line they sue you for.', 'Disclose it in full'],
      CFO: ['Every paragraph in there costs us a dollar a share.', 'Keep it hypothetical'],
      'Policy and Comms': ['Say it happened and what you fixed. Then it is old news.', 'Write “has happened, may again”'],
    });
    chip('<b>IPO</b> · SEC review, letter 2 · public filing in about 6 weeks');
  },

  // A: pricing night, drawn on the funding term sheets the player already knows.
  async A2() {
    hideTips();
    const sheets = $$('.term-sheet');
    const rows = [
      { mono: '↓', name: 'Price below the range', amt: '$34', for: 'a share, under the $38–42 range', clause: 'A safe first day', note: 'Every fund stays in. Expect a big gain on day one, money that could have been yours.', after: 'Raises $5.1B', cls: 'investor-vc' },
      { mono: '=', name: 'Price at the top', amt: '$42', for: 'a share, top of the $38–42 range', clause: 'The usual', note: 'Most long-term funds stay. Expect a modest gain on day one.', after: 'Raises $6.3B', cls: 'investor-strategic' },
      { mono: '↑', name: 'Raise the range', amt: '$49', for: 'a share, above the range', clause: 'Risks a broken deal', note: 'If the book is softer than it looks, day one closes under $49 and the feed calls it a flop.', after: 'Raises $7.4B', cls: 'investor-sovereign' },
    ];
    sheets.forEach((s, i) => {
      const r = rows[i];
      s.disabled = false;
      s.removeAttribute('title');
      s.querySelector('.term-mono').textContent = r.mono;
      s.querySelector('.term-letterhead strong').textContent = r.name;
      s.querySelector('.paper-kicker').textContent = 'Price sheet';
      s.querySelector('.term-amount').textContent = r.amt;
      s.querySelector('.term-for').textContent = r.for;
      s.querySelector('.term-clause').textContent = r.clause;
      s.querySelector('.term-note').textContent = r.note;
      s.querySelector('.term-after').textContent = r.after;
      s.querySelector('.term-sign').textContent = 'Signed tonight';
      s.querySelector('.company-card-reason')?.classList.add('mk-hide');
    });
    $('.paper-raise').append(html(`<div class="mk-price-head">
      <div class="k">Pricing night · the order book closed this evening</div>
      <h2>Orders for 6 times the shares on offer</h2>
      <div class="mk-book">
        <span>Long-term funds</span><i style="width:58%"></i><span class="n">2.9×</span>
        <span>Hedge funds</span><i class="hot" style="width:40%"></i><span class="n">2.0×</span>
        <span>Sovereign funds</span><i style="width:14%"></i><span class="n">0.7×</span>
        <span>Users and staff</span><i style="width:8%"></i><span class="n">0.4×</span>
      </div>
      <div class="sub">The bankers’ read, not a promise. Hedge-fund orders vanish if day one looks flat. Lodestar listed last month and closed day one up 68%.</div>
    </div>`));
    $('.paper-fan').style.transform = 'translateY(118px)';
    for (const el of $$('.paper-raise *')) {
      if (el.children.length === 0 && /team actions/.test(el.textContent)) el.textContent = 'The first trade prints tomorrow, around noon.';
    }
  },

  // B: the quarterly earnings call as a recurring set piece, with the stock ticker under the HUD.
  async B1() {
    hideTips();
    for (const el of $$('#office, #fx')) el.style.filter = 'blur(4px) saturate(.8)';
    chip('<b>LAB $142</b> <span class="dn">▼ 6% after hours</span> · next earnings in 3 months');
    const initials = ['MH', 'RS', 'JK', 'AT', 'PL', 'DN', 'EW', 'SC', 'TB', 'LV', 'GO', 'NM'];
    document.body.append(html(`<div class="mk-call-layer"><div class="mk-call">
      <div class="k">Earnings call · first quarter 2025</div>
      <h2>Your first call as a public company</h2>
      <div class="mk-faces">${initials.map((x) => `<span>${x}</span>`).join('')}<em>+26 analysts on the line</em></div>
      <div class="mk-score">
        <div><small>You guided</small><b>$1.80B</b></div>
        <div class="miss"><small>The street expected</small><b>$1.90B</b></div>
        <div><small>You made</small><b>$1.84B</b></div>
      </div>
      <div class="mk-q">
        <div class="who">Question from Brightline Securities</div>
        <div class="says">“Safety compute went from a quarter to nearly a third of your fleet this quarter. When does that come back down?”</div>
        <div class="mk-ans">
          <button><b>It doesn’t. It is why customers trust us.</b><span>Stock down tomorrow · Safety chair pleased</span></button>
          <button><b>By next quarter, back to growth.</b><span>Stock up · a promise the next call checks</span></button>
          <button><b>We will guide it next call.</b><span>Little move now · the question comes back</span></button>
        </div>
      </div>
      <div class="mk-tape"><span>Revenue beat your own guidance, missed the street</span><span class="dn">LAB after hours −6%</span></div>
    </div></div>`));
  },

  // C: the listing window shared with rival labs.
  async C1() {
    hideTips();
    const month = (m) => `${((m - 0.5) / 6) * 100}%`;
    dialog({
      title: 'The listing window',
      subt: 'Mar 2025 · which labs are going public, and how the market took it',
      ok: 'Decide later',
      body: `<div class="mk-two"><div>
        <div class="mk-cal">
          <div class="mk-months" style="margin-left:104px"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
          <div class="mk-lanes">
            <div class="mk-lane"><span>Lodestar</span><div class="mk-track"><span class="mk-ev good" style="left:${month(1.2)}">Listed · +68% day one</span></div></div>
            <div class="mk-lane"><span>OpenBrain</span><div class="mk-track"><span class="mk-ev" style="left:${month(2.1)}">Filed in confidence</span><span class="mk-ev ghost" style="left:${month(4.7)}">Lists?</span></div></div>
            <div class="mk-lane"><span>Qilin</span><div class="mk-track"><span class="mk-ev ghost" style="left:${month(3.6)}">Hong Kong debut</span></div></div>
            <div class="mk-lane"><span>DeepThink</span><div class="mk-track"><span class="mk-ev bad" style="left:${month(0.6)}">Withdrew</span></div></div>
            <div class="mk-lane"><span><b>You</b></span><div class="mk-track"><span class="mk-ev you" style="left:${month(2.9)}">Banks hired</span></div></div>
          </div>
        </div>
        <div class="mk-mood"><span>Investor mood</span><div class="bar"><i style="left:78%"></i></div><div class="lbl"><span>Shut</span><span>Cautious</span><span>Hot</span></div></div>
        <div class="mk-acts">
          <button><b>File in confidence now</b><span>Ride the heat; letters start in a month</span></button>
          <button><b>Wait for Qilin’s debut</b><span>A flop shuts the window for everyone</span></button>
          <button><b>Stay private</b><span>Take the sovereign round and its strings</span></button>
        </div>
      </div>
      <aside class="mk-side"><div class="who">CFO · Margot Hale</div>Books are covered many times over right now, and the first lab out gets the index funds. If OpenBrain lists first, we split the room.<br><br><div class="who">Head of Safety · Tomas Lind</div>Lodestar went public in January. Ask what it stopped testing in February.</aside>
      </div>`,
    });
  },

  // D: the share register, ten blocks; six against you is a takeover.
  async D1() {
    hideTips();
    const blk = (cls, a, b, lock = false) => `<div class="mk-blk ${cls}">${lock ? '<svg class="lock" width="12" height="14" viewBox="0 0 12 14" aria-label="locked"><rect x="1" y="6" width="10" height="7.5" rx="1.5" fill="currentColor"/><path d="M3.2 6V4.2a2.8 2.8 0 0 1 5.6 0V6" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>' : ''}<span>${a}</span><small>${b}</small></div>`;
    dialog({
      title: 'Who owns the lab',
      subt: 'Ten blocks of shares. If holders of six vote against you, the lab is theirs.',
      ok: 'Close',
      body: `<div class="mk-two"><div>
        <div class="mk-blocks">
          ${blk('you', 'Founders', 'founder share', true)}${blk('you', 'Founders', 'founder share', true)}${blk('staff', 'Staff', 'vests in 2026')}
          ${blk('inv', 'Growth fund', 'era 2 round')}${blk('inv', 'Cloud partner', 'sells to the top bid')}${blk('inv', 'Sovereign fund', 'era 2 round')}
          ${blk('pub', 'Public', 'index funds')}${blk('pub', 'Public', 'index funds')}${blk('pub', 'Public', 'traders')}${blk('riv', 'Lodestar', 'bought in March')}
        </div>
        <div class="mk-line">
          <span class="seg" style="left:0;width:29%;background:var(--teal)"></span><span class="lab" style="left:0">Safe with you: 3</span>
          <span class="seg" style="left:90.5%;width:9.5%;background:var(--coral)"></span><span class="lab" style="right:0">Lodestar: 1 of the 6 it needs</span>
        </div>
        <div class="mk-legend"><span style="--c:var(--teal)">You and founders</span><span style="--c:color-mix(in oklab, var(--wood) 85%, var(--ink))">Private investors</span><span style="--c:color-mix(in oklab, var(--sky) 70%, var(--paper))">Public float</span><span style="--c:var(--coral)">Rival lab</span></div>
        <div class="mk-acts">
          <button><b>Buy back a public block</b><span>$2.1B that compute and safety will miss</span></button>
          <button><b>Give the trust the oversight seats</b><span>No buyer can replace them · the stock drops</span></button>
          <button><b>Let it run</b><span>Lodestar needs five more blocks</span></button>
        </div>
      </div>
      <aside class="mk-side"><div class="who">CFO · Margot Hale</div>Lodestar bought a public block this month. The cloud partner will sell its block to whoever pays most; that would make two.<br><br><div class="who">Policy and Comms · Jules Ferreira</div>Two blocks is not a takeover. It is a seat at your board meeting.</aside>
      </div>`,
    });
  },
};

export async function apply(name) {
  await wait(300);
  await MOCKS[name]();
  await wait(200);
}
