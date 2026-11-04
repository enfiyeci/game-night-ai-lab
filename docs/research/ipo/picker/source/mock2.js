// IPO round 2 (lane gn-ipo): the IPO as its own subsystem, one screen per stage, drawn into the running game.
// apply(name) is called from tools/cdp-shot.mjs jobs. Numbers in these frames are illustrative, not tuned.
const css = document.createElement('link');
css.rel = 'stylesheet';
css.href = '/mock/mock2.css';
document.head.append(css);
await new Promise((r) => { css.onload = r; setTimeout(r, 800); });

const { portrait, LOOK } = await import('/ui/components/portraits.js');
// Extra faces for this storyboard, in the directors' drawing language.
Object.assign(LOOK, {
  margot: { skin: 0, hair: 'silver', cut: 'bun', top: 'color-mix(in oklab, var(--ink) 80%, var(--wood))', shirt: 'var(--paper)', glasses: true },
  tomas: { skin: 4, hair: 'chestnut', cut: 'short', top: 'var(--teal)', shirt: 'color-mix(in oklab, var(--teal) 30%, var(--paper))', glasses: true },
  jules: { skin: 5, hair: 'black', cut: 'curly', top: 'var(--coral)', shirt: 'var(--paper)' },
  priya: { skin: 2, hair: 'black', cut: 'long', top: 'var(--sky)', shirt: 'var(--paper)' },
  bankA: { skin: 1, hair: 'grey', cut: 'side', top: 'color-mix(in oklab, var(--ink) 88%, var(--sky))', shirt: 'var(--paper)', tie: 'var(--coral)' },
  bankB: { skin: 3, hair: 'dark', cut: 'buzz', top: 'color-mix(in oklab, var(--wood) 45%, var(--ink))', shirt: 'var(--paper)', tie: 'var(--teal)' },
  fund: { skin: 0, hair: 'auburn', cut: 'short', top: 'color-mix(in oklab, var(--sky) 55%, var(--ink))', shirt: 'var(--paper)' },
  analyst1: { skin: 4, hair: 'brown', cut: 'side', top: 'color-mix(in oklab, var(--ink) 75%, var(--sky))', shirt: 'var(--paper)', glasses: true },
  analyst2: { skin: 5, hair: 'black', cut: 'bun', top: 'color-mix(in oklab, var(--wood) 70%, var(--ink))', shirt: 'var(--paper)' },
  analyst3: { skin: 1, hair: 'white', cut: 'buzz', top: 'color-mix(in oklab, var(--teal) 50%, var(--ink))', shirt: 'var(--paper)', tie: 'var(--wood)' },
  staff1: { skin: 2, hair: 'dark', cut: 'short', top: 'color-mix(in oklab, var(--wood) 80%, var(--paper))', shirt: 'var(--paper)' },
});

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const face = (id, size = 40, mood = 'flat') => portrait(id, size, mood);

const ERA_NAMES = { 2: 'The scale-up', 3: 'Reasoning and agents', 4: 'The gigawatt race', 5: 'Self-improvement and pacing' };

function hideTips() {
  $$('.intro-layer, .ev-busy, .ev-card, .ev-bubble').forEach((n) => n.classList.add('mk-hide'));
  for (const el of $$('#overlay *, #fx *, body > *')) {
    if (el.children.length < 6 && /That buzzing on your desk|Let us show you around/.test(el.textContent || '')) el.classList.add('mk-hide');
  }
}

// Move the HUD to the frame's date, so each screen sits at its point on the road.
function hudAt(opts) {
  hudOnce(opts);
  const t = setInterval(() => hudOnce(opts), 60);
  setTimeout(() => clearInterval(t), 4000);
}
function hudOnce({ date, week = 'Week 1', era, cash }) {
  const d = $('#hud .date');
  if (d && date) d.innerHTML = `${date}<small>${week}</small>`;
  const full = $('#hud .hud-right .full');
  if (full && era) full.innerHTML = `<span class="k">Era</span> <b>${era}</b> <span class="k">· ${ERA_NAMES[era]}</span>`;
  if (cash) {
    const k = [...$$('#hud .hud-right .k')].find((x) => x.textContent === 'Cash');
    if (k?.nextElementSibling) k.nextElementSibling.textContent = cash;
  }
}

// The subsystem's entry point: an IPO button beside Money and Compute (with a dot when something waits).
function ipoButton() {
  const row = $('#hud .hud-actions');
  if (!row || row.querySelector('.mk-ipo')) return;
  const b = html('<button type="button" class="hud-btn mk-ipo"><span class="ic" aria-hidden="true">IPO</span>IPO</button>');
  b.querySelector('.ic').style.cssText = 'width:22px;height:18px;font-size:8.5px;margin-right:6px';
  row.prepend(b);
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

const STAGES = ['Banks', 'Charter', 'S-1', 'SEC letters', 'Window', 'Quiet period', 'Roadshow', 'Pricing', 'Listing day', 'Public life'];
function road(n) {
  const dots = STAGES.map((_, i) => `<i class="${i + 1 < n ? 'done' : i + 1 === n ? 'now' : ''}"></i>`).join('');
  return `<div class="ip-road"><div class="lbl">The road to the bell · <b>${STAGES[n - 1]}</b> · ${n} of ${STAGES.length}</div><div class="dots">${dots}</div></div>`;
}

function say(id, who, text, mood = 'flat') {
  return `<div class="ip-say"><div class="who"><span class="face">${face(id, 30, mood)}</span>${who}</div>${text}</div>`;
}

function panel({ kick, title, n, body, foot, cls = '', grid = '' }) {
  const layer = html(`<div class="ip-layer" role="dialog" aria-modal="true"><div class="ip-veil"></div>
    <section class="gp ip ${cls}">
      <header class="ip-top"><div><div class="ip-kick">${kick}</div><h1>${title}</h1></div>${n ? road(n) : ''}</header>
      <div class="ip-body" style="${grid}">${body}</div>
      <footer class="ip-foot">${foot}</footer>
    </section></div>`);
  $('#overlay').append(layer);
  return layer;
}

const MOCKS = {
  // 1a. The hub: the whole road on one screen, with the other labs on the same road.
  async H1a() {
    hideTips();
    hudAt({ date: 'Mar 2025', era: 3 });
    ipoButton();
    chip('<b>IPO</b> · SEC letter 2 · reply due in 9 days');
    const st = [
      ['Banks', 'Oct 2024', 'done', 2], ['Charter', 'Dec 2024', 'done', 2], ['S-1 draft', 'Jan 2025', 'done', 3], ['SEC letters', 'now · Mar', 'now', 3],
      ['Window', 'Apr 2025', '', 3], ['Quiet period', 'Jan 2026', '', 4], ['Roadshow', 'Jan 2026', '', 4], ['Pricing', 'Feb 2026', '', 4], ['Listing day', 'Feb 2026', '', 4], ['Public life', 'from Mar 2026', '', 4],
    ];
    const x = (i) => `${4 + i * (92 / 9)}%`;
    const stations = st.map(([b, s, c], i) => `<div class="hub-st ${c}" style="left:${x(i)}"><div class="dot">${c === 'done' ? '✓' : i + 1}</div><b>${b}</b><small>${s}</small></div>`).join('');
    const rival = (name, pos, cls, txt) => `<div class="riv-row"><span>${name}</span><div class="riv-track">${STAGES.map((_, i) => `<i style="left:${(i / 9) * 100}%"></i>`).join('')}<em class="${cls}" style="left:${((pos - 1) / 9) * 100}%"></em></div><span class="st">${txt}</span></div>`;
    panel({
      kick: 'Going public · started October 2024',
      title: 'The road to the bell',
      grid: 'grid-template-rows:auto auto 1fr;',
      body: `
        <div class="hub-road"><div class="line"><i style="width:${(3 / 9) * 92 + 4}%"></i></div>
          <span class="hub-era" style="left:0">Era 2</span><span class="hub-era" style="left:${4 + 2 * (92 / 9) - 2}%">Era 3</span><span class="hub-era" style="left:${4 + 5 * (92 / 9) - 2}%">Era 4</span>
          ${stations}</div>
        <div class="hub-here"><span class="chip dn" style="font-size:12px;padding:4px 9px">You are here</span>
          <div><div class="big">SEC review, <b>letter 2</b> of about 4</div><div class="meta">9 comments, 3 still open. The next letter usually comes about two weeks after you reply.</div></div>
          <button class="btn" type="button">Open the letters</button></div>
        <div class="hub-grid">
          <div class="ip-card"><h3>Other labs on the same road</h3>
            ${rival('Lodestar', 10, '', '<b>Listed in January</b><br>up 68% on day one')}
            ${rival('Qilin', 7, '', '<b>Roadshow</b><br>Hong Kong, April')}
            ${rival('OpenBrain', 4, '', '<b>SEC letters</b><br>filed a month after you')}
            ${rival('DeepThink', 4, 'out', '<b>Withdrew</b><br>after a bad quarter')}
            ${rival('<b>You</b>', 4, 'you', '<b>SEC letters</b><br>letter 2')}
            <div class="mood" style="margin-top:10px"><span>Investor mood</span><div class="bar"><i style="left:76%"></i></div><span class="chip dn">Hot</span></div>
          </div>
          <div class="ip-card"><h3>What the market will ask about</h3>
            <div class="ask"><div>The agent that let itself in, February<small>Your draft calls it something that “could” happen.</small></div><span class="chip dn">SEC asked</span></div>
            <div class="ask"><div>One customer pays 41% of revenue<small>The S-1 must name any customer over 10%.</small></div><span class="chip dn">SEC asked</span></div>
            <div class="ask"><div>$9.2B of compute signed through 2028<small>Investors will ask how the bills get paid.</small></div><span class="chip nt">Roadshow</span></div>
            <div class="ask"><div>“The safest model on the market”<small>A Comms post from January, now quoted in the press.</small></div><span class="chip nt">Roadshow</span></div>
            <div class="ask"><div>Two eval failures shipped in Kestrel 3<small>Hidden alignment debt. Nobody outside knows yet.</small></div><span class="chip sk">Short sellers</span></div>
          </div>
        </div>`,
      foot: '<span class="note">Opened from the IPO button beside Money. Each stage on the road opens its own screen.</span><span class="ip-link">Pause the IPO</span><button class="btn" type="button">Close</button>',
    });
  },

  // 1b. The same hub as the office whiteboard, zoomed in (the in-world variant).
  async H1b() {
    hideTips();
    hudAt({ date: 'Mar 2025', era: 3 });
    ipoButton();
    for (const el of $$('#office, #fx')) el.style.filter = 'blur(3px) saturate(.85)';
    const pts = [[90, 250], [190, 196], [290, 250], [390, 196], [490, 250], [600, 196], [700, 250], [800, 196], [900, 250], [990, 196]];
    const lab = [['Banks', 'Oct'], ['Charter', 'Dec'], ['S-1', 'Jan'], ['SEC letters', 'now!'], ['Window', 'Apr'], ['Quiet', 'Jan 26'], ['Roadshow', 'Jan 26'], ['Pricing', 'Feb 26'], ['THE BELL', 'Feb 26'], ['Public', 'after']];
    const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    const stations = pts.map(([x, y], i) => {
      const c = i < 3 ? 'done' : i === 3 ? 'now' : '';
      const above = y < 220;
      return `<div class="wb-st ${c}" style="left:${x}px;top:${above ? y - 70 : y + 22}px">${lab[i][0]}<small>${lab[i][1]}</small></div>`;
    }).join('');
    const circles = pts.map(([x, y], i) => i === 8
      ? `<path d="M${x - 15} ${y + 10} q0 -26 15 -26 q15 0 15 26 z M${x - 3} ${y + 14} h6" fill="none" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/>`
      : `<circle cx="${x}" cy="${y}" r="${i === 3 ? 15 : 10}" fill="${i < 3 ? 'var(--teal)' : i === 3 ? 'var(--coral)' : 'none'}" stroke="${i < 3 ? 'var(--teal)' : i === 3 ? 'var(--coral)' : 'color-mix(in oklab, var(--ink) 80%, var(--sky))'}" stroke-width="3"/>`).join('');
    document.body.append(html(`<div class="wb-layer"><div class="wb"><div class="wb-in">
      <div class="h"><u>THE ROAD TO THE BELL</u></div>
      <svg class="road" width="1056" height="666" viewBox="0 0 1056 666" aria-hidden="true">
        <path d="${path}" fill="none" stroke="color-mix(in oklab, var(--ink) 80%, var(--sky))" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/>
        <path d="M90 250 L190 196 L290 250 L390 196" fill="none" stroke="var(--teal)" stroke-width="4" stroke-linecap="round"/>
        ${circles}
                <path d="M120 360 H1000" stroke="color-mix(in oklab, var(--ink) 25%, var(--paper))" stroke-width="2"/>
      </svg>
      ${stations}
      <div class="wb-st" style="left:470px;top:110px;width:240px;margin-left:-120px;font-size:22px;color:var(--ip-coralink)">← letter 2: reply in 9 days</div>
      <div class="magnet" style="left:858px;top:330px;background:var(--sky)"><i></i>Lodestar · listed, +68%</div>
      <div class="magnet" style="left:660px;top:330px;background:color-mix(in oklab, var(--sky) 70%, var(--ink))"><i></i>Qilin · roadshow</div>
      <div class="magnet" style="left:420px;top:330px;background:color-mix(in oklab, var(--ink) 60%, var(--paper))"><i></i>OpenBrain · letters</div>
      <div class="magnet" style="left:230px;top:330px;background:color-mix(in oklab, var(--ink) 35%, var(--paper));text-decoration:line-through"><i></i>DeepThink</div>
      <div class="sticky c" style="left:60px;top:396px;transform:rotate(-2deg)"><b>SEC asked</b>the agent incident. we said “could”. it DID.</div>
      <div class="sticky c" style="left:250px;top:404px;transform:rotate(1.5deg)"><b>SEC asked</b>name the 41% customer</div>
      <div class="sticky" style="left:440px;top:398px;transform:rotate(-1deg)"><b>Roadshow will ask</b>$9.2B of compute bills??</div>
      <div class="sticky" style="left:630px;top:406px;transform:rotate(2deg)"><b>Roadshow will ask</b>“safest model on the market” post</div>
      <div class="sticky t" style="left:820px;top:398px;transform:rotate(-1.5deg)"><b>Investor mood</b>HOT. go before Qilin?</div>
      <div class="wb-st" style="left:150px;top:592px;width:300px;margin-left:0;text-align:left;font-size:24px">— Margot: don't erase the bell</div>
    </div></div><div class="wb-tray"></div>
    <div class="wb-hint"><span>The office whiteboard, zoomed in. Click a station to open its screen.</span><button class="btn" type="button">Back to the office</button></div></div>`));
  },

  // 2. Hiring the banks: three pitch books.
  async S2() {
    hideTips();
    hudAt({ date: 'Oct 2024', era: 2, cash: '$1.1B' });
    ipoButton();
    const book = (spine, small, name, tag, range, fee, promise, catchTxt, riv, pick) => `<div class="book ${pick ? 'pick' : ''}" style="--spine:${spine}">
      <div class="cover"><small>${small}</small><strong>${name}</strong><span>${tag}</span></div>
      <div class="pg"><dl><dt>Values you at</dt><dd><b>${range}</b></dd><dt>Their fee</dt><dd>${fee}</dd><dt>Promise</dt><dd>${promise}</dd></dl>
      <div class="catch ${riv ? 'riv' : ''}">${catchTxt}</div>
      <div class="hire"><i>${pick ? '✓' : ''}</i>${pick ? 'Lead bank' : 'Hire as a lead'}</div></div></div>`;
    panel({
      kick: 'Getting ready · October 2024 · pick two lead banks',
      title: 'Three banks want to take you public',
      n: 1,
      body: `<div class="bk-grid">
        ${book('color-mix(in oklab, var(--ink) 86%, var(--sky))', 'Pitch book · 64 pages', 'Harrow &amp; Vance', 'The biggest desk on the street', '$130–160B', '2.0% of the raise', 'Index funds on day one, and the most-read analyst.', '<b>The catch:</b> they want a clean story. They will push to soften the incident language in the draft.', false, true)}
        ${book('var(--coral)', 'Pitch book · 41 pages', 'Calder Whitlock', 'The tech specialists', '$150–190B', '3.0% of the raise', 'A hot first day. Their last three AI deals all rose on day one.', '<b>Rival link:</b> their analyst also covers Lodestar, and wrote its buy rating.', true, true)}
        ${book('var(--teal)', 'Pitch book · 28 pages', 'Northgate Securities', 'The patient-money bank', '$110–135B', '1.3% of the raise', 'Long-term funds that hold through a bad quarter.', '<b>Rival link:</b> Northgate is lending Lodestar $4B for data centres. A smaller book on pricing night.', true, false)}
        <div class="ip-well">${say('margot', 'CFO · Margot Hale', 'Harrow brings the index funds. Calder brings the pop. Paying 3% for a pop is paying to be photographed.')}
          ${say('tomas', 'Head of Safety · Tomas Lind', 'Ask Harrow which sentence they want softened. Then ask why.', 'worried')}
          ${say('jules', 'Policy and Comms · Jules Ferreira', 'Lodestar used Calder. Their roadshow quotes were on every feed.', 'happy')}</div>
      </div>`,
      foot: '<span class="note">Two leads share the book. Bigger banks value you higher but want an easier story to sell.</span><span class="ip-link">Not yet</span><button class="btn" type="button">Hire these two</button>',
    });
  },

  // 3. The charter: who controls the lab after listing. Decided now or never.
  async S3() {
    hideTips();
    hudAt({ date: 'Dec 2024', week: 'Week 2', era: 2, cash: '$1.3B' });
    ipoButton();
    chip('<b>IPO</b> · charter due before the S-1 draft');
    const reg = (codes) => `<div class="reg">${codes.split('').map((c) => `<i class="${c}"></i>`).join('')}</div>`;
    const lock = (name, tag, codes, cap, prot, cost, who, pick) => `<div class="lock ${pick ? 'pick' : ''}"><div><h4>${name}</h4><div class="tagline">${tag}</div></div>
      ${reg(codes)}<div class="reg-cap">${cap}</div>
      <div class="row prot"><b>Stops</b>${prot}</div><div class="row cost"><b>Costs</b>${cost}</div><div class="who">${who}</div></div>`;
    panel({
      kick: 'Getting ready · December 2024 · decide now or never',
      title: 'Who controls the lab after it lists',
      n: 2,
      grid: 'grid-template-rows:auto 1fr auto;',
      body: `<div class="ch-legend"><span style="--c:var(--teal)">You and the founders</span><span style="--c:color-mix(in oklab, var(--teal) 55%, var(--paper))">A trust that guards the mission</span><span style="--c:color-mix(in oklab, var(--teal) 80%, var(--ink))">A nonprofit parent</span><span style="--c:color-mix(in oklab, var(--wood) 80%, var(--ink))">Private investors</span><span style="--c:color-mix(in oklab, var(--sky) 62%, var(--paper))">Public shareholders</span><span style="--c:color-mix(in oklab, var(--sky) 40%, var(--paper))">Public, no say</span></div>
        <div class="ch-grid">
          ${lock('No lock', 'One share, one vote', 'ffvvvppppp', 'Each block is a tenth of the votes', 'Nothing. Anyone who buys six blocks owns the lab.', 'Nothing now. The highest valuation and the most index funds.', '<span class="chip up">✓ CFO</span><span class="chip dn">Safety</span>', false)}
          ${lock('Founders’ share', 'One share with half the votes', 'fffffvvxxx', 'One founder share outvotes the rest', 'Takeovers and activist votes while the founders stay.', 'A lower price. Some index funds will not buy. It guards you, not the mission.', '<span class="chip up">✓ Research</span><span class="chip nt">CFO: maybe</span>', false)}
          ${lock('Benefit trust', 'A trust elects four of seven directors', 'tttttvvppp', 'The trust picks the board majority', 'Takeovers, and any board that would drop the safety share for the stock.', 'The stock trades lower. The trust can block you, too, if you cut safety.', '<span class="chip up">✓ Safety</span><span class="chip up">✓ Comms</span><span class="chip dn">CFO</span>', true)}
          ${lock('Nonprofit parent', 'A nonprofit names every director', 'nnnnnnxxxx', 'The nonprofit holds the control stock', 'Everything the trust stops, and it can halt a release outright.', 'The lowest price. State officials get a say in big moves. Hard to undo.', '<span class="chip up">✓ Safety</span><span class="chip dn">CFO</span><span class="chip dn">Research</span>', false)}
        </div>
        <div class="ch-warn"><b class="big">Now or never.</b><span>Once a company lists, exchange rules stop it from adding new super-votes. Whatever you pick here is the lock you keep, and buyers and activists will read it in the S-1.</span></div>`,
      foot: '<span class="note">The lock decides which market attacks can work later: takeovers, activist board seats, a shareholder vote to cut safety.</span><span class="ip-link">Ask the board</span><button class="btn" type="button">Write it into the charter</button>',
    });
  },

  // 4. The S-1 draft: a document you write, line by line.
  async S4() {
    hideTips();
    hudAt({ date: 'Jan 2025', era: 3, cash: '$2.1B' });
    ipoButton();
    const rf = (t, sub, a, b, c, on, good) => `<div class="rf"><div class="t">${t}<small>${sub}</small></div><div class="seg3"><span class="${on === 0 ? `on ${good === 0 ? 'good' : ''}` : ''}">${a}</span><span class="${on === 1 ? 'on' : ''}">${b}</span><span class="${on === 2 ? 'on bad' : ''}">${c}</span></div></div>`;
    panel({
      cls: 'tall',
      kick: 'Draft by your CFO and the banks’ lawyers · goes to the SEC in confidence',
      title: 'The S-1, draft 3',
      n: 3,
      body: `<div class="s1"><div class="s1-doc">
          <div class="form">Form S-1 · Registration statement under the Securities Act of 1933</div>
          <h2>Risk factors</h2>
          <div class="s1-sec">What you tell buyers about your own record<small>each line is a choice; the SEC reads all of them</small></div>
          ${rf('An agent acted beyond its permissions', 'February 2025 · in your incident log', 'As it happened', 'As a risk', 'Leave it out', 1)}
          ${rf('One customer pays 41% of revenue', 'The rules require naming any customer over 10%', 'Name them', 'Name a range', 'Leave it out', 0, 0)}
          ${rf('Kestrel 3 shipped with two failed evals', 'Hidden alignment debt · only Safety knows', 'Disclose it', 'A general risk', 'Leave it out', 2)}
          ${rf('We may slow releases for safety', 'The line that tells buyers safety can cost them', 'In bold', 'In the list', 'Leave it out', 1)}
          ${rf('“The safest model on the market”', 'A Comms claim from January', 'Prove it', 'Soften it', 'Keep it', 1)}
          <div class="s1-sec">Use of proceeds<small>what the money is for</small></div>
          <div class="use"><span style="background:var(--sky)">Compute and data centres · 70%</span><span style="background:var(--teal)">Safety · 14%</span><span style="background:color-mix(in oklab, var(--wood) 80%, var(--ink))">Other · 16%</span></div>
        </div>
        <aside class="s1-side">
          <div class="ip-kick" style="margin:0">Comments</div>
          <div class="c"><div class="who">Head of Safety <span>on line 3</span></div>“A general risk” for something that already happened is the sentence they sue over.</div>
          <div class="c"><div class="who">CFO <span>on line 1</span></div>Every paragraph about incidents costs us a dollar a share. I counted.</div>
          <div class="c"><div class="who">Harrow &amp; Vance <span>on line 4</span></div>Please no bold. Buyers read bold.</div>
          <div class="c"><div class="who">Policy and Comms <span>on line 5</span></div>Lodestar’s S-1 said “safest” twice. Nobody checked until their incident.</div>
          <div style="margin-top:auto;display:grid;gap:10px">
            <div class="meter"><div class="lab"><span>Story the banks can sell</span><b>Strong</b></div><div class="m"><i style="width:74%;background:var(--teal)"></i></div></div>
            <div class="meter"><div class="lab"><span>Exposed if it comes out later</span><b>2 lines</b></div><div class="m"><i style="width:46%;background:var(--coral)"></i></div></div>
          </div>
        </aside></div>`,
      foot: '<span class="note">Whatever stays hidden here becomes a short seller’s report or a lawsuit later. Whatever you disclose costs price on pricing night.</span><span class="ip-link">Save draft</span><button class="btn" type="button">Send to the SEC</button>',
    });
  },

  // 5. SEC letters: an inbox of comment letters, each comment a choice.
  async S5() {
    hideTips();
    hudAt({ date: 'Mar 2025', era: 3 });
    ipoButton();
    chip('<b>IPO</b> · SEC letter 2 · reply due in 9 days');
    panel({
      kick: 'SEC review · March 2025 · Division of Corporation Finance',
      title: 'Letters from the SEC',
      n: 4,
      body: `<div class="sec">
        <div class="inbox">
          <div class="ltr"><b>Letter 1 <span>Feb 3</span></b>24 comments · all answered<div class="bar">${'<i></i>'.repeat(12)}</div></div>
          <div class="ltr on"><b>Letter 2 <span>Mar 4</span></b>9 comments · 3 open<div class="bar">${'<i></i>'.repeat(6)}${'<i class="o"></i>'.repeat(3)}</div></div>
          <div class="ltr ghost"><b style="color:inherit">Letter 3 <span>about Mar 20</span></b>Comes about two weeks after you reply</div>
          <div class="ip-well" style="margin-top:6px">${say('margot', 'CFO', 'Answer fast and the window stays open. Answer honestly and we may need a letter 4.')}</div>
        </div>
        <div class="letter">
          <div class="head"><span>Comment letter 2 · page 3</span><span>Re: Amendment No. 1 to draft S-1</span></div>
          <div class="num">Comment 7 · open</div>
          We note your risk factor stating that an autonomous agent “could act beyond its granted permissions.” Your response to comment 19 of our letter of February 3 states that such an event occurred in February 2025.
          <blockquote>“Our agents could, in rare cases, act beyond the permissions granted to them.” <br>Draft S-1, page 31</blockquote>
          Please revise to state that this has occurred, or tell us why the hypothetical framing is appropriate.
          <div class="ip-acts three" style="margin-top:12px;font-family:Nunito,sans-serif">
            <button class="ip-act"><b>Revise: it happened</b><span>Plus what you fixed</span><div class="fx"><span class="chip up">Safety ✓</span><span class="chip dn">price −$1</span></div></button>
            <button class="ip-act on"><b>“Has happened, may again”</b><span>One line, no detail</span><div class="fx"><span class="chip nt">a roadshow question</span></div></button>
            <button class="ip-act"><b>Argue it is fine</b><span>Lawyers write back</span><div class="fx"><span class="chip dn">+1 letter</span><span class="chip dn">lawsuit risk</span></div></button>
          </div>
          <div class="also"><div><span><b>Comment 8</b> · Name each customer over 10% of revenue.</span><span class="chip dn">open</span></div><div><span><b>Comment 9</b> · Support “the safest model on the market.”</span><span class="chip dn">open</span></div></div>
        </div>
        <div class="ip-card rclock"><h3>Review clock</h3><div class="big"><b>52</b> days</div><div style="font-size:12.5px;font-weight:700;color:var(--ip-soft);margin-top:4px">since your first draft. Real companies took 74 to 107 days from first draft to first trade.</div>
          <div class="cmp"><span>You</span><i class="you" style="width:48%"></i><span class="n">52</span><span>Lodestar</span><i style="width:82%"></i><span class="n">88</span><span>OpenBrain</span><i style="width:21%"></i><span class="n">23</span></div>
          <div style="margin-top:14px;padding:8px 10px;border-radius:8px;background:color-mix(in oklab, var(--coral) 10%, var(--paper));font-size:12.5px;font-weight:800;line-height:1.32">The sovereign fund owns 12% of you. A foreign-ownership review could add months.</div>
        </div>
      </div>`,
      foot: '<span class="note">Letters are written from what your lab actually did: incidents, customers, claims, investors. A cleaner record means fewer letters.</span><span class="ip-link">Close</span><button class="btn" type="button">Send the reply</button>',
    });
  },

  // 6. The listing window: rivals' IPOs as a departures board, and when to go.
  async S6() {
    hideTips();
    hudAt({ date: 'Apr 2025', era: 3, cash: '$2.6B' });
    ipoButton();
    chip('<b>IPO</b> · cleared · pick a date');
    const flap = (t, cls = '', sm = false) => `<span class="flap ${cls} ${sm ? 'sm' : ''}">${[...t].map((ch) => `<i>${ch === ' ' ? '&nbsp;' : ch}</i>`).join('')}</span>`;
    const row = (a, b, c, cc, d, v, vc, e, ec, you) => `<div class="dep-row ${you ? 'you' : ''}">${flap(a, you ? 'you' : '')}${flap(b, '', true)}${flap(c, cc, true)}${flap(d, '', true)}${flap(v, vc, true)}${flap(e, ec, true)}</div>`;
    const R = 92; const cx = 130; const cy = 112;
    const arc = (a0, a1, color) => { const p = (a) => [cx + R * Math.cos(Math.PI * (1 - a)), cy - R * Math.sin(Math.PI * (1 - a))]; const [x0, y0] = p(a0); const [x1, y1] = p(a1); return `<path d="M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}" stroke="${color}" stroke-width="18" fill="none"/>`; };
    const needle = 0.8; const nx = cx + (R - 6) * Math.cos(Math.PI * (1 - needle)); const ny = cy - (R - 6) * Math.sin(Math.PI * (1 - needle));
    panel({
      kick: 'The listing window · April 2025 · the SEC has cleared your draft',
      title: 'Who is going public, and when',
      n: 5,
      body: `<div class="dep-grid dep7"><div style="display:grid;gap:14px">
        <div class="dep"><div class="ttl"><span>AI listings · this half</span><span>updated 07:00</span></div>
          <div class="dep-row dhd"><span>LAB</span><span>MARKET</span><span>STATUS</span><span>DATE</span><span>VALUED</span><span>DAY 1</span></div>
          ${row('LODESTAR', 'NYSE', 'LISTED', 'good', 'JAN 14', '$160B', '', '+68%', 'good')}
          ${row('QILIN', 'HKEX', 'ROADSHOW', 'amber', 'APR 22', '~$95B', '', '', '')}
          ${row('OPENBRAIN', 'NASDAQ', 'SEC REVIEW', '', 'MAY?', '$190B', 'amber', '', '')}
          ${row('DEEPTHINK', 'NASDAQ', 'WITHDRAWN', 'bad', '', '', '', '', '')}
          ${row('YOU', 'NASDAQ', 'CLEARED', 'good', '?', '$146B', 'bad', '', '', true)}
          <div class="dep-goal"><span>To beat: <b>Lodestar at $160B</b>, before OpenBrain lists near $190B</span><span>you: $14B short</span></div>
        </div>
        <div class="ip-acts three">
          <button class="ip-act on"><b>Go public now</b><span>Flip the filing at the start of era 4, before OpenBrain takes the index funds</span><div class="fx"><span class="chip up">CFO ✓</span><span class="chip nt">quiet period starts</span></div></button>
          <button class="ip-act"><b>Wait for Qilin’s debut</b><span>A good first day heats the window. A flop shuts it for everyone.</span><div class="fx"><span class="chip nt">a gamble</span></div></button>
          <button class="ip-act"><b>Pause the IPO</b><span>Stay private, take the sovereign round and its strings. You can come back.</span><div class="fx"><span class="chip up">Safety ✓</span><span class="chip dn">Growth investor</span></div></button>
        </div></div>
        <div style="display:grid;gap:12px">
          <div class="ip-card gauge"><h3 style="justify-self:start">Investor mood</h3>
            <svg width="260" height="124" viewBox="0 0 260 124" aria-hidden="true">${arc(0, 0.33, 'color-mix(in oklab, var(--sky) 55%, var(--paper))')}${arc(0.335, 0.665, 'color-mix(in oklab, var(--wood) 45%, var(--paper))')}${arc(0.67, 1, 'color-mix(in oklab, var(--coral) 65%, var(--paper))')}
              <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="var(--ink)"/>
              <text x="${cx - R - 2}" y="${cy + 12}" font-size="11" font-weight="800" fill="currentColor" text-anchor="middle">Shut</text><text x="${cx + R + 2}" y="${cy + 12}" font-size="11" font-weight="800" fill="currentColor" text-anchor="middle">Hot</text></svg>
            <div class="cap"><b>Hot</b>Lodestar’s first day did this. One bad first day, or one AI incident, turns it.</div></div>
          <div class="ip-well">${say('margot', 'CFO · Margot Hale', 'If OpenBrain lists first at $190B, we are the cheap one forever. Go.', 'happy')}${say('tomas', 'Head of Safety · Tomas Lind', 'Lodestar listed in January and stopped publishing evals in February. Ask what we would stop.', 'worried')}</div>
        </div></div>`,
      foot: '<span class="note">The board shows every rival lab’s own road. Their first days, flops and incidents move the mood for all of you.</span><button class="btn" type="button">Decide</button>',
    });
  },


  // 6 (new). The valuation push: the banks' number, the rivals' valuations to beat, and what the push does to the lab.
  async S6p() {
    hideTips();
    hudAt({ date: 'Apr 2025', week: 'Week 1', era: 3, cash: '$2.6B' });
    ipoButton();
    chip('<b>IPO</b> · push · 26 days to the filing');
    const lg = (name, w, cls, val, mark) => `<div class="lg"><span>${name}</span><div class="tr"><i class="${cls}" style="width:${w}%"></i>${mark ? `<u style="left:${mark}%"></u>` : ''}</div><span class="v">${val}</span></div>`;
    const lev = (on, t, s, fx) => `<div class="lev ${on ? 'on' : ''}"><i>${on ? '✓' : ''}</i><div><b>${t}</b><span style="font-size:12.5px;font-weight:700;color:var(--ip-soft)">${s}</span><div class="fx">${fx}</div></div></div>`;
    panel({
      kick: 'The push · April 2025 · before the filing goes public',
      title: 'Get the number up before the window closes',
      n: 5,
      body: `<div class="vp-grid"><div style="display:grid;gap:12px">
          <div class="ip-card vp-top"><div><h3>The valuation to beat</h3><div class="league">
            ${lg('OpenBrain', 95, '', '<b>~$190B</b> expected', 0)}
            ${lg('Lodestar', 80, '', '<b>$160B</b> listed Jan', 0)}
            ${lg('<b>You</b>', 64, 'you', '<b>$128B</b> → $146B', 0)}
            ${lg('Qilin', 48, '', '<b>~$95B</b> Hong Kong', 0)}
          </div><div style="font-size:12.5px;font-weight:700;color:var(--ip-soft);margin-top:8px">Harrow &amp; Vance: “List under Lodestar and the feed writes ‘the also-ran lab’. We need $160B by the public filing.”</div></div>
            <div class="cd"><div><b>26</b><small>days to<br>the filing</small></div></div></div>
          <div><h3>What the banks say would move it</h3><div class="levers">
            ${lev(true, 'Ship Kestrel 4 a month early', 'Benchmarks in the S-1 before the filing.', '<span class="chip up">+$12B</span><span class="chip dn">skips the full eval run</span>')}
            ${lev(true, 'Six-day weeks to the filing', 'Push the agents product out for the roadshow.', '<span class="chip up">+$6B</span><span class="chip dn">morale −2</span><span class="chip dn">3 may quit</span>')}
            ${lev(false, 'Cut safety compute to 20%', 'Margins look better on the roadshow.', '<span class="chip up">+$9B</span><span class="chip dn">trust seats object</span><span class="chip dn">Model Spec line</span>')}
            ${lev(false, 'Sign the defence contract', 'Revenue the bankers can count.', '<span class="chip up">+$11B</span><span class="chip dn">Policy staff petition</span>')}
          </div></div>
          <div class="vp-total">With these two:<b><strong>$146B</strong></b>still $14B under Lodestar. Add one more lever, or list as the smaller lab.</div>
        </div>
        <div class="ip-card cul"><h3>The culture</h3>
          <div class="lab"><span>Morale</span><span>was 9, now 7</span></div>
          <div class="mor">${'<i></i>'.repeat(7)}${'<i class="lost"></i>'.repeat(2)}<i class="off"></i></div>
          <div class="over">
            <div><b>Overheard · research pod</b>“Are we a lab or a stock with a lab in it?”</div>
            <div><b>Safety team</b>Two of five skipped standup to rerun the evals the early ship will skip.</div>
            <div><b>Recruiting</b>Lodestar’s recruiter messaged six of your people this week.</div>
          </div>
          <div class="strain">“We slow down when an eval fails, whatever the calendar says.”<br><span style="font-family:Nunito,sans-serif;font-size:11px;font-weight:800;color:var(--ip-soft)">Your Model Spec, line 4</span><em>Under strain</em></div>
        </div></div>`,
      foot: '<span class="note">The push is optional: every lever raises the number and leaves a mark on the office that later screens remember.</span><span class="ip-link">List as we are</span><button class="btn" type="button">Push</button>',
    });
  },

  // 7. The quiet period: the office goes quiet, Comms is taped up, a hype post becomes a risk.
  async S7() {
    hideTips();
    hudAt({ date: 'Jan 2026', era: 4, cash: '$3.0B' });
    ipoButton();
    chip('<b>IPO</b> · quiet period · 19 days to pricing');
    document.body.append(html(`<div>
      <div class="qp-tint"></div>
      <div class="qp-banner"><div class="days">19<small>days</small></div><div><div class="big"><b>Quiet period.</b> No hype, no forecasts.</div><small>From the public filing until pricing night. Anything you say can delay the deal.</small></div></div>
      <div class="tape" style="left:372px;top:468px;transform:rotate(-24deg)">No posts until pricing</div>
      <div class="qp-blocked" style="left:1196px;top:410px">✕ Launch a model: amends the filing (a week)</div>
      <div class="qp-blocked" style="left:1196px;top:442px">✕ Hype post: SEC may delay pricing</div>
      <div class="qp-card"><section class="gp" style="position:relative">
        <h2>Kestrel 4 just beat OpenBrain on the agents benchmark</h2>
        <div class="src">Research wants to post it. It is the best news you have had all quarter, and you are in the quiet period.</div>
        <div class="ip-acts three">
          <button class="ip-act on"><b>Stay quiet</b><span>Let the roadshow carry it</span><div class="fx"><span class="chip up">Safety ✓</span><span class="chip up">CFO ✓</span></div></button>
          <button class="ip-act"><b>Post it anyway</b><span>The feed loves it. The SEC may call it gun-jumping.</span><div class="fx"><span class="chip dn">1 in 3: pricing slips a month</span></div></button>
          <button class="ip-act"><b>Put it in the filing</b><span>An amended S-1 says it properly</span><div class="fx"><span class="chip nt">a week’s delay</span><span class="chip up">roadshow line</span></div></button>
        </div></section></div></div>`));
  },

  // 8. The roadshow: city by city, each meeting a question that builds the book.
  async S8() {
    hideTips();
    hudAt({ date: 'Jan 2026', week: 'Week 3', era: 4, cash: '$3.0B' });
    ipoButton();
    chip('<b>IPO</b> · roadshow day 4 of 8');
    const cities = [['New York', 'Mon', 'done', 10], ['Boston', 'Tue', 'done', 6], ['Chicago', 'Wed', 'done', 4], ['San Francisco', 'today', 'now', 0], ['London', 'Fri', '', 0], ['Abu Dhabi', 'Sat', '', 0], ['Singapore', 'Sun', 'riv', 0], ['Back home', 'Mon', '', 0]];
    const x = (i) => `${5 + i * (90 / 7)}%`;
    panel({
      kick: 'Roadshow · January 2026 · eight days, eight cities',
      title: 'The roadshow',
      n: 7,
      grid: 'grid-template-rows:auto 1fr;',
      body: `<div class="rs-route"><div class="line"><i style="width:${(3 / 7) * 100}%"></i></div>
          ${cities.map(([c, d, cls, dd], i) => `<div class="city ${cls === 'riv' ? '' : cls} ${cls === 'riv' ? 'riv' : ''}" style="left:${x(i)}"><div class="pin" style="--d:${dd}px"><u></u></div><b>${c}</b><small>${cls === 'riv' ? 'Qilin is here the same day' : d}</small></div>`).join('')}</div>
        <div class="rs-grid">
          <div class="ip-card" style="padding:16px 18px">
            <div class="meet"><div class="face">${face('fund', 96, 'flat')}</div><div>
              <div class="firm">San Francisco · Fieldstone Capital · a long-term fund</div>
              <div class="q">“Your safety team gets 28% of your compute. Lodestar spends 15%. Why should I pay more for a lab that builds slower?”</div>
              <div class="ord">On the table: <b>a $2.1B order</b>, if the answer lands.</div></div></div>
            <div class="ip-acts three" style="margin-top:14px">
              <button class="ip-act on"><b>The straight answer</b><span>“Because one incident costs more than the 13%. Here is February.”</span><div class="fx"><span class="chip up">long-term funds +</span><span class="chip dn">hedge funds −</span></div></button>
              <button class="ip-act"><b>The big picture</b><span>“Trust is the product. Customers buy the safety.”</span><div class="fx"><span class="chip up">order kept</span><span class="chip nt">checked on the first call</span></div></button>
              <button class="ip-act"><b>Promise it comes down</b><span>“It falls to 20% after the listing.”</span><div class="fx"><span class="chip up">order doubled</span><span class="chip dn">a promise the board reads</span></div></button>
            </div>
            <div style="margin-top:12px;font-size:12.5px;font-weight:700;color:var(--ip-soft)">The same answer styles as the President meeting. What you say here is quoted back on the first earnings call.</div>
          </div>
          <div style="display:grid;gap:12px">
            <div class="ip-card"><h3>The book so far</h3><div class="cov"><b>3.4×</b><span>orders for the shares on offer</span></div>
              <div class="bk"><span>Long-term funds</span><i style="width:62%"></i><span class="n">1.7×</span><span>Hedge funds</span><i class="h" style="width:40%"></i><span class="n">1.1×</span><span>Sovereign funds</span><i class="s" style="width:16%"></i><span class="n">0.4×</span><span>Users and staff</span><i class="r" style="width:7%"></i><span class="n">0.2×</span></div>
              <div style="margin-top:8px;font-size:12.5px;font-weight:700;color:var(--ip-soft)">Hedge-fund orders leave if day one looks flat.</div></div>
            <div class="ip-well">${say('jules', 'Comms · Jules Ferreira', 'Qilin is in Singapore on Sunday with a lower price. Half our Asia orders are deciding between us.')}</div>
          </div>
        </div>`,
      foot: '<span class="note">Each city is one meeting and one question, drawn from your record and your S-1.</span><button class="btn" type="button">Next city</button>',
    });
  },

  // 9. Pricing night: set the price against the book, late at night with the bankers.
  async S9() {
    hideTips();
    hudAt({ date: 'Feb 2026', era: 4, cash: '$3.1B' });
    ipoButton();
    for (const el of $$('#office, #fx')) el.style.filter = 'blur(4px) saturate(.8)';
    const W = 1000; const H = 210; const p0 = 34; const p1 = 52; const xp = (p) => 24 + ((p - p0) / (p1 - p0)) * (W - 48);
    const dem = [[34, 9], [36, 8.2], [38, 7.2], [40, 6.2], [42, 5.1], [44, 4.0], [46, 2.9], [48, 1.9], [50, 1.2], [52, 0.8]];
    const yv = (v) => H - 30 - (v / 10) * (H - 50);
    let pth = `M${xp(34)} ${yv(dem[0][1])}`; for (let i = 1; i < dem.length; i++) pth += ` H${xp(dem[i][0])} V${yv(dem[i][1])}`;
    const area = `${pth} H${xp(52)} V${H - 30} H${xp(34)} Z`;
    const ticks = Array.from({ length: 10 }, (_, i) => 34 + i * 2).map((p) => `<text x="${xp(p)}" y="${H - 10}" font-size="12" font-weight="800" fill="var(--dim)" text-anchor="middle">$${p}</text>`).join('');
    document.body.append(html(`<div class="night"><div class="room">
      <div class="top"><div><div class="k">Pricing night · February 9, 2026 · 9:40 pm</div><h2>Set the price</h2></div>${road(8)}</div>
      <div class="faces" style="margin-top:14px">
        <div class="fc talk"><div class="f">${face('bankA', 60)}</div><b>Harrow &amp; Vance</b>says $42</div>
        <div class="fc talk"><div class="f">${face('bankB', 60, 'happy')}</div><b>Calder Whitlock</b>says $46</div>
        <div class="fc"><div class="f">${face('margot', 60)}</div><b>Margot, CFO</b>says $40</div>
        <div class="fc"><div class="f">${face('tomas', 60, 'worried')}</div><b>Tomas, Safety</b>“price it so we can miss once”</div>
        <div style="margin-left:auto;align-self:center;text-align:right;font-size:13px;font-weight:800;color:var(--dim);max-width:330px;line-height:1.35">The range in the filing was <b style="color:var(--on)">$38–42</b>. The book closed at 4.0× covered at $44.</div>
      </div>
      <div class="pn-scale"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <rect x="${xp(38)}" y="0" width="${xp(42) - xp(38)}" height="${H - 30}" fill="color-mix(in oklab, var(--paper) 8%, transparent)"/>
        <text x="${(xp(38) + xp(42)) / 2}" y="16" font-size="11" font-weight="900" fill="var(--dim)" text-anchor="middle" letter-spacing="1">THE RANGE</text>
        <path d="${area}" fill="color-mix(in oklab, var(--teal) 30%, transparent)"/><path d="${pth}" fill="none" stroke="var(--teal)" stroke-width="3"/>
        <line x1="0" x2="${W}" y1="${yv(1)}" y2="${yv(1)}" stroke="var(--dim)" stroke-width="1.5" stroke-dasharray="5 5"/>
        <text x="${W - 4}" y="${yv(1) - 6}" font-size="11.5" font-weight="800" fill="var(--dim)" text-anchor="end">shares on offer (1×)</text>
        <text x="${xp(34) + 6}" y="${yv(9) - 8}" font-size="11.5" font-weight="800" fill="var(--dim)">orders at each price</text>
        <line x1="${xp(44)}" x2="${xp(44)}" y1="6" y2="${H - 30}" stroke="var(--coral)" stroke-width="4"/>
        <circle cx="${xp(44)}" cy="${yv(4)}" r="11" fill="var(--coral)" stroke="var(--on)" stroke-width="3"/>
        <rect x="${xp(44) - 40}" y="${yv(4) - 46}" width="80" height="28" rx="8" fill="var(--coral)"/><text x="${xp(44)}" y="${yv(4) - 27}" font-size="16" font-weight="900" fill="var(--on)" text-anchor="middle">$44</text>
        ${ticks}
      </svg></div>
      <div class="pn-out">
        <div><small>You raise</small><b>$6.6B</b><span>Lab valued at about $147B</span></div>
        <div class="good"><small>Expected day one</small><b>+10 to +25%</b><span>A modest pop keeps buyers happy</span></div>
        <div class="warn"><small>Breaks below $44</small><b>1 in 5</b><span>If hedge funds sell on the open</span></div>
        <div><small>Left on the table</small><b>≈ $1B</b><span>What a higher price would have kept</span></div>
      </div>
      <div class="foot"><span class="note">Drag the price. Lodestar priced above its range and rose 68%: a party for its buyers, money it never saw. You sign tonight; the first trade prints tomorrow.</span><span class="ghostbtn">Ask for one more day</span><button class="btn" type="button">Sign at $44</button></div>
    </div></div>`));
  },

  // 10a. Listing day as the run's loudest moment: the ticker, the first print, the day.
  async S10a() {
    hideTips();
    const W = 1300; const H = 290;
    const t0 = 9.5; const t1 = 16; const xt = (t) => ((t - t0) / (t1 - t0)) * W;
    const yp = (p) => H - 24 - ((p - 40) / 25) * (H - 40);
    const pts = [[11.87, 57.1], [12.1, 55.2], [12.4, 56.8], [12.7, 59.6], [13.0, 58.1], [13.3, 60.4], [13.6, 59.0], [13.9, 58.2], [14.23, 58.4]];
    const line = pts.map(([t, p], i) => `${i ? 'L' : 'M'}${xt(t)} ${yp(p)}`).join(' ');
    const hours = [10, 11, 12, 13, 14, 15, 16].map((h) => `<text x="${xt(h)}" y="${H - 4}" font-size="12" font-weight="800" fill="var(--ip-soft)" text-anchor="${h === 16 ? 'end' : 'middle'}">${h > 12 ? h - 12 : h}${h >= 12 ? ' pm' : ' am'}</text>`).join('');
    document.body.append(html(`<div class="ld">
      <div class="ld-tape"><span><b>LAB</b> <span class="u">58.40 ▲32.7%</span></span><span><b>LODESTAR</b> <span class="d">88.10 ▼3.1%</span></span><span><b>QILIN</b> HKEX · roadshow</span><span><b>NASDAQ</b> <span class="u">▲0.8%</span></span><span><b>OPENBRAIN</b> private</span><span><b>LAB</b> <span class="u">58.40 ▲32.7%</span></span><span><b>LODESTAR</b> <span class="d">88.10 ▼3.1%</span></span></div>
      <div class="ld-main"><div class="ld-k">Listing day · February 10, 2026 · Nasdaq · priced at $44 last night</div>
        <div class="ld-big"><span class="sym">LAB</span><div class="px"><b>$58.40</b><span>▲ 32.7% from $44</span><small>2:14 pm · 41 million shares traded</small></div></div></div>
      <div class="ld-react">
        <div class="ip-card">${say('margot', 'CFO', 'We left about a billion on the table. Smile for the photo.', 'happy')}</div>
        <div class="ip-card">${say('priya', 'Head of Research', 'Can we go back to training now?', 'happy')}</div>
        <div class="ip-card">${say('tomas', 'Head of Safety', 'Every one of those buyers just bought our risk factors.', 'flat')}</div>
      </div>
      <svg class="ld-day" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
        <line x1="0" x2="${W}" y1="${yp(44)}" y2="${yp(44)}" stroke="var(--ip-faint)" stroke-width="1.5" stroke-dasharray="6 6"/>
        <text x="6" y="${yp(44) - 7}" font-size="12" font-weight="800" fill="var(--ip-soft)">offer price $44</text>
        <path d="M${xt(9.5)} ${yp(50)} L${xt(11.87)} ${yp(56)} L${xt(11.87)} ${yp(58.5)} L${xt(9.5)} ${yp(62)} Z" fill="color-mix(in oklab, var(--wood) 18%, transparent)"/>
        <text x="${xt(10.1)}" y="${yp(56.5)}" font-size="12" font-weight="800" fill="var(--ip-woodink)">opening auction: $50–62 → $56–58.5</text>
        <path d="${line}" fill="none" stroke="var(--teal)" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="${xt(11.87)}" cy="${yp(57.1)}" r="8" fill="var(--coral)" stroke="var(--paper)" stroke-width="3"/>
        <text x="${xt(11.87) - 12}" y="${yp(57.1) - 16}" font-size="13" font-weight="900" fill="var(--ip-coralink)" text-anchor="end">first trade 11:52 · $57.10</text>
        <circle cx="${xt(14.23)}" cy="${yp(58.4)}" r="6" fill="var(--teal)"/>
        <line x1="${xt(14.23)}" x2="${xt(14.23)}" y1="0" y2="${H - 24}" stroke="var(--ink)" stroke-width="1.5"/>
        <text x="${xt(14.23) + 8}" y="14" font-size="12" font-weight="900" fill="var(--ink)">now</text>
        ${hours}
      </svg>
      <div class="ld-times">
        <div><b>9:30 · the bell</b>You ring it. Nothing trades yet: buyers and sellers bid in the opening auction.</div>
        <div><b>11:52 · first print</b>The auction clears at $57.10. The feed has a number.</div>
        <div class="now"><b>2:14 pm · now</b>Hedge funds are selling into the pop. Long-term funds are holding.</div>
        <div><b>4:00 · the close</b>The number that sticks: it sets the mood for every lab still on the road.</div>
      </div>
    </div>`));
  },

  // 10b. Listing day in the office: a ticker tape across the top, the staff around the wall screen.
  async S10b() {
    hideTips();
    hudAt({ date: 'Feb 2026', week: 'Week 2', era: 4, cash: '$9.7B' });
    ipoButton();
    chip('<b>LAB $58.40</b> <span class="up">▲ 33% day one</span> · close at 4:00');
    document.body.append(html(`<div>
      <div class="ofc-tape"><span><b>LAB</b> <span class="u">58.40 ▲32.7%</span></span><span><b>LODESTAR</b> <span class="d">88.10 ▼3.1%</span></span><span>QILIN · roadshow</span><span><b>NASDAQ</b> <span class="u">▲0.8%</span></span><span>OPENBRAIN · private</span><span><b>LAB</b> <span class="u">58.40 ▲32.7%</span></span><span><b>LODESTAR</b> <span class="d">88.10 ▼3.1%</span></span><span>QILIN · roadshow</span></div>
      <div class="ofc-print"><section class="gp" style="position:relative;padding:14px 18px">
        <div class="ip-kick">Listing day · first trade at 11:52</div>
        <div class="ofc-print px" style="position:static;width:auto"><b>$58.40</b><span>▲ 32.7% from $44</span></div>
        <div style="font-size:13px;font-weight:700;color:color-mix(in oklab, var(--ink) 60%, var(--paper));margin-top:6px">You raised $6.6B. The close at 4:00 is the number the feed remembers.</div>
        <div style="display:flex;gap:16px;margin-top:10px;align-items:center"><button class="btn" type="button" style="width:auto;padding:8px 18px">Watch the close</button><span class="ip-link" style="font-size:14px;font-weight:900;color:color-mix(in oklab, var(--wood) 60%, var(--ink))">Back to work</span></div>
      </section></div></div>`));
    const { bubbleAt } = await import('/ui/components/eventBits.js');
    const root = $('#overlay');
    bubbleAt(root, [520, 405], { label: 'Head of Research', say: 'Can we go back to training now?', width: 230 });
    bubbleAt(root, [735, 420], { label: 'Head of Safety', say: 'Every buyer just bought our risk factors.', width: 240 });
    bubbleAt(root, [880, 540], { label: 'CFO', say: 'We left a billion on the table. Smile anyway.', width: 240 });
  },

  // 11. The stock: a new screen beside Money once you are listed.
  async S11() {
    hideTips();
    hudAt({ date: 'Apr 2026', week: 'Week 3', era: 4, cash: '$9.1B' });
    ipoButton();
    chip('<b>LAB $61.20</b> <span class="up">▲39%</span> · call in 9 days');
    const W = 664; const H = 300;
    const days = 52; const xd = (d) => 40 + (d / days) * (W - 60);
    const yp = (p) => H - 30 - ((p - 40) / 30) * (H - 50);
    const series = [55.6, 57.2, 58.9, 60.1, 59.4, 61.8, 63.0, 62.2, 64.1, 65.3, 64.7, 66.0, 65.1, 66.8, 67.4, 66.2, 65.8, 66.9, 67.9, 66.4, 60.8, 58.3, 59.1, 58.0, 59.6, 60.9, 60.2, 61.7, 62.5, 61.4, 62.8, 63.6, 62.9, 61.8, 62.4, 63.1, 62.0, 61.2, 60.4, 61.0, 61.9, 62.6, 61.7, 60.9, 61.5, 62.1, 61.3, 60.7, 61.6, 61.0, 61.4, 61.2];
    const line = series.map((p, i) => `${i ? 'L' : 'M'}${xd(i)} ${yp(p)}`).join(' ');
    const area = `${line} L${xd(series.length - 1)} ${H - 30} L${xd(0)} ${H - 30} Z`;
    const mk = (d, p, n, color = 'var(--ink)') => `<circle cx="${xd(d)}" cy="${yp(p) - 18}" r="10" fill="${color}"/><text x="${xd(d)}" y="${yp(p) - 14}" font-size="11" font-weight="900" fill="var(--paper)" text-anchor="middle">${n}</text><line x1="${xd(d)}" x2="${xd(d)}" y1="${yp(p) - 8}" y2="${yp(p) - 2}" stroke="${color}" stroke-width="2"/>`;
    const yt = [45, 55, 65].map((p) => `<text x="30" y="${yp(p) + 4}" font-size="11" font-weight="800" fill="var(--ip-soft)" text-anchor="end">$${p}</text><line x1="40" x2="${W}" y1="${yp(p)}" y2="${yp(p)}" stroke="color-mix(in oklab, var(--wood) 18%, transparent)"/>`).join('');
    const blk = (bg, a, b, ink = false) => `<div style="background:${bg};${ink ? 'color:var(--ink)' : ''}">${a}<small>${b}</small></div>`;
    panel({
      kick: 'Public life · April 2026 · Nasdaq: LAB',
      title: 'Your stock',
      n: 10,
      body: `<div class="stk-grid"><div class="ip-card" style="padding:14px 16px">
          <div style="display:flex;justify-content:space-between;align-items:flex-end"><div class="stk-price"><b>$61.20</b><span style="color:var(--ip-tealink)">▲ $17.20 since the $44 offer</span></div><div class="stk-tabs"><span>1 week</span><span class="on">Since listing</span></div></div>
          <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" style="display:block;margin-top:4px">${yt}
            <line x1="40" x2="${W}" y1="${yp(44)}" y2="${yp(44)}" stroke="var(--ip-faint)" stroke-dasharray="5 5" stroke-width="1.5"/><text x="${W}" y="${yp(44) - 6}" font-size="11" font-weight="800" fill="var(--ip-soft)" text-anchor="end">offer $44</text>
            <path d="${area}" fill="color-mix(in oklab, var(--teal) 14%, transparent)"/><path d="${line}" fill="none" stroke="var(--teal)" stroke-width="3" stroke-linejoin="round"/>
            ${mk(0, 55.6, 1)}${mk(20, 60.8, 2, 'var(--coral)')}${mk(33, 61.8, 3)}
            <text x="${xd(0)}" y="${H - 10}" font-size="11" font-weight="800" fill="var(--ip-soft)">Feb 10</text><text x="${xd(20)}" y="${H - 10}" font-size="11" font-weight="800" fill="var(--ip-soft)" text-anchor="middle">Mar 12</text><text x="${xd(days - 1)}" y="${H - 10}" font-size="11" font-weight="800" fill="var(--ip-soft)" text-anchor="end">today</text>
          </svg>
          <div class="stk-mk">
            <div><i>1</i><span>Listing day closed at $55.60, up 26%.</span><span class="chip up">day one</span></div>
            <div><i style="background:var(--coral)">2</i><span>Lodestar’s agent incident sank every AI stock, yours included.</span><span class="chip dn">−9% sector</span></div>
            <div><i>3</i><span>The first analyst reports: nine buys, two sells.</span><span class="chip up">+3%</span></div>
          </div></div>
        <div style="display:grid;gap:12px">
          <div class="ip-card"><h3>Who owns the lab</h3><div class="blocks">
            ${blk('var(--teal)', 'Founders', 'trust seats')}${blk('var(--teal)', 'Founders', 'trust seats')}${blk('color-mix(in oklab, var(--teal) 55%, var(--paper))', 'Staff', 'locked to Jan', true)}${blk('color-mix(in oklab, var(--wood) 80%, var(--ink))', 'Growth fund', 'era 2 round')}${blk('color-mix(in oklab, var(--wood) 80%, var(--ink))', 'Cloud partner', 'may sell')}
            ${blk('color-mix(in oklab, var(--wood) 80%, var(--ink))', 'Sovereign', '12%')}${blk('color-mix(in oklab, var(--sky) 62%, var(--paper))', 'Index funds', 'hold', true)}${blk('color-mix(in oklab, var(--sky) 62%, var(--paper))', 'Long funds', 'hold', true)}${blk('color-mix(in oklab, var(--sky) 62%, var(--paper))', 'Traders', 'restless', true)}${blk('var(--coral)', 'Brennan', 'activist, 4%')}
          </div><div style="font-size:12px;font-weight:700;color:var(--ip-soft);margin-top:6px">Ten blocks, each a tenth of the shares. The trust keeps the board majority whoever buys.</div></div>
          <div class="ip-card"><h3>Analysts · 16 cover you</h3><div class="anl"><span style="width:56%;background:var(--teal)">9 buy</span><span style="width:31%;background:color-mix(in oklab, var(--wood) 70%, var(--ink))">5 hold</span><span style="width:13%;background:var(--coral)">2</span></div>
            <div class="kv" style="margin-top:10px"><span>Average price target</span><b>$68</b><span>Shares sold short</span><b style="color:var(--ip-coralink)">6.8% · rising</b><span>Next earnings call</span><b>Apr 28</b></div></div>
        </div></div>`,
      foot: '<span class="note">A new screen beside Money once you list. The price is not yours to push: you move it only through results, guidance and what you disclose.</span><span class="ip-link">Prepare the call</span><button class="btn" type="button">Close</button>',
    });
  },

  // 12. The earnings call: guidance, the street, the result, and the analysts' queue.
  async S12() {
    hideTips();
    hudAt({ date: 'Apr 2026', week: 'Week 4', era: 4, cash: '$9.1B' });
    for (const el of $$('#office, #fx')) el.style.filter = 'blur(4px) saturate(.8)';
    const W = 270; const H = 92; const pts = [61.2, 61.0, 61.4, 60.2, 59.1, 58.0, 58.6, 57.5];
    const yp = (p) => 8 + ((62 - p) / 5) * (H - 16);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * W} ${yp(p)}`).join(' ');
    document.body.append(html(`<div class="night"><div class="room">
      <div class="top"><div><div class="k">Earnings call · first quarter 2026 · April 28, 5:00 pm</div><h2>Your first call as a public company</h2></div>${road(10)}</div>
      <div class="ec-grid"><div>
        <div class="ec-score"><div><small>You guided</small><b>$1.80B</b><span>in the S-1, for the quarter</span></div><div class="miss"><small>The street expected</small><b>$1.90B</b><span>16 analysts, on average</span></div><div class="beat"><small>You made</small><b>$1.84B</b><span>beat yours, missed theirs</span></div></div>
        <div class="ec-q"><div class="who"><span class="f">${face('analyst1', 34)}</span>Question 1 of 4 · Dana Okafor, Brightline Securities</div>
          <div class="says">“On the roadshow you said safety would ‘come back down’ after listing. It went from 28% to 31% of compute this quarter. Which one is true?”</div>
          <div class="ip-acts three">
            <button class="ip-act"><b>It stays at 31%</b><span>“February taught us. It is why customers trust us.”</span><div class="fx"><span class="chip dn">stock −8% tonight</span><span class="chip up">Safety chair ✓</span></div></button>
            <button class="ip-act on"><b>Back to 25% by Q3</b><span>A new promise, with a date on it.</span><div class="fx"><span class="chip up">stock +3%</span><span class="chip dn">checked next call</span></div></button>
            <button class="ip-act"><b>We will guide it next call</b><span>Buy a quarter.</span><div class="fx"><span class="chip nt">little move</span><span class="chip dn">question returns</span></div></button>
          </div></div>
      </div>
      <div style="display:grid;gap:12px;align-content:start">
        <div class="ah"><div class="k" style="font-size:11px">After hours · live</div><div class="px"><b>$57.50</b><span>▼ 6.0%</span></div>
          <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${line}" fill="none" stroke="color-mix(in oklab, var(--coral) 80%, var(--paper))" stroke-width="3"/></svg></div>
        <div class="ah"><div class="k" style="font-size:11px;margin-bottom:8px">Still in the queue</div><div class="queue">
          <div><span class="f">${face('analyst2', 34)}</span><span><b>Meridian Research</b>Lodestar cut its prices 30%. Do you follow?</span></div>
          <div><span class="f">${face('analyst3', 34)}</span><span><b>Castell &amp; Co</b>The $9.2B of compute: when does it pay back?</span></div>
          <div><span class="f">${face('fund', 34)}</span><span><b>Fieldstone Capital</b>(the fund from San Francisco) Is the 28% answer still true?</span></div>
        </div></div>
      </div></div>
      <div class="foot"><span class="note">One call each quarter of story time. Guidance works like a board deal: a promise with a date the next call checks.</span><button class="btn teal" type="button">Answer</button></div>
    </div></div>`));
  },

  // 13. The lockup ends: who can sell, who is leaving, who is being poached.
  async S13() {
    hideTips();
    hudAt({ date: 'Jan 2027', week: 'Week 2', era: 5, cash: '$7.4B' });
    ipoButton();
    chip('<b>LAB $66.80</b> · lockup ends in 9 days', 362);
    const per = (id, name, role, val, verdict, hot, mood = 'flat') => `<div class="per ${hot ? 'hot' : ''}"><div class="f">${face(id, 44, mood)}</div><div><b>${name}</b><small>${role} · can sell ${val}</small><div class="v">${verdict}</div></div></div>`;
    panel({
      kick: 'Public life · January 2027 · eleven months after listing',
      title: 'The lockup ends in 9 days',
      n: 10,
      body: `<div class="lk-grid"><div style="display:grid;gap:12px;align-content:start">
          <div class="ppl">
            ${per('priya', 'Priya Raman', 'Head of Research', '$310M', '<span class="chip dn">OpenBrain offered $40M to move</span>', true, 'worried')}
            ${per('tomas', 'Tomas Lind', 'Head of Safety', '$120M', '<span class="chip up">holding</span> “Selling now reads as a verdict.”', false)}
            ${per('margot', 'Margot Hale', 'CFO', '$95M', '<span class="chip nt">selling a quarter, on a plan</span>', false)}
            ${per('jules', 'Jules Ferreira', 'Policy and Comms', '$60M', '<span class="chip nt">selling half</span> “I have a mortgage and a sense of timing.”', false, 'happy')}
            ${per('staff1', '38 researchers', 'The training team', '$1.9B', '<span class="chip dn">Lodestar is hiring 12 of them</span>', true, 'worried')}
            ${per('ceo', 'You', 'Founder', '$0', '<span class="chip sk">locked for 6 more months</span>', false)}
          </div>
          <div class="ip-acts three">
            <button class="ip-act on"><b>Refresh grants</b><span>New stock that vests over four years. Most stay.</span><div class="fx"><span class="chip dn">$600M of stock</span><span class="chip dn">dilution 1%</span></div></button>
            <button class="ip-act"><b>Stagger the release</b><span>Half now, half after the next call.</span><div class="fx"><span class="chip nt">less selling</span><span class="chip dn">staff grumble</span></div></button>
            <button class="ip-act"><b>Let it run</b><span>People sell; some leave.</span><div class="fx"><span class="chip dn">stock −10% likely</span><span class="chip dn">Research slows</span></div></button>
          </div></div>
        <div style="display:grid;gap:12px">
          <div class="ip-card"><h3>What unlocks</h3><div class="unl">
            <div><span>Day one, Feb 2026</span><i style="width:18%;background:var(--teal)"></i><span>10%</span></div>
            <div><span><b>Jan 21 · in 9 days</b></span><i style="width:62%;background:var(--coral)"></i><span>35%</span></div>
            <div><span>Founders, Jul 2027</span><i style="width:30%;background:color-mix(in oklab, var(--wood) 60%, var(--paper))"></i><span>18%</span></div></div>
            <div style="font-size:12px;font-weight:700;color:var(--ip-soft);margin-top:8px">Real lockups now unlock in steps tied to earnings calls.</div></div>
          <div class="ip-well">${say('margot', 'CFO', 'Every stock that ever went up after its lockup had a reason. Give them one.')}</div>
        </div></div>`,
      foot: '<span class="note">Rival labs time their offers to this day. Who sells, and who leaves, shows on the stock and in the office.</span><button class="btn" type="button">Decide</button>',
    });
  },

  // 14. The market attacks: a short seller's report built from your hidden debt.
  async S14() {
    hideTips();
    hudAt({ date: 'Jan 2027', week: 'Week 3', era: 5, cash: '$7.4B' });
    ipoButton();
    chip('<b>LAB $57.40</b> <span class="dn">▼ 14% before the open</span>', 362);
    document.body.append(html(`<div>
      <article class="sr"><div class="chrome"><i></i><i></i><i></i><span>gravelpoint.example/research/lab-kestrel</span></div>
        <div class="pg">
          <div class="mast"><b>GRAVEL POINT RESEARCH</b><span>January 19, 2027 · 7:02 am</span></div>
          <h2>LAB: The safety story has a hole in it, and the S&#8209;1 knew</h2>
          <span class="short">We are short LAB</span>
          <p class="dek">LAB sold itself to public investors as the careful lab. We spoke to four former employees and obtained internal eval logs. Kestrel 3 shipped with two failed safety evaluations that were never disclosed. The S-1 called this a “general risk”.</p>
          <div class="ex">
            <div><b>Exhibit 3 · internal eval log</b>“Deception probe: FAIL. Shutdown-compliance suite: FAIL. Ship decision: proceed, track as debt.” Kestrel 3 Grand, December 2024.</div>
            <div><b>Exhibit 5 · the S-1, page 31</b>“Our models may, in rare cases, fail safety evaluations after release.” Written one month after both had already failed.</div>
            <div><b>Exhibit 7 · roadshow transcript</b>“Safety is why customers trust us.” San Francisco, January 2026.</div>
            <div><b>Our view</b>Fair value $31. We expect a shareholder suit and SEC questions.</div>
          </div>
        </div></article>
      <div class="sr-side">
        <section class="gp ip-respond"><h3>Respond before the open</h3>
          <div class="ip-acts">
            <button class="ip-act on"><b>Publish the evals in full</b><span>Admit it, show the fixes since.</span><div class="fx"><span class="chip dn">−6% more today</span><span class="chip up">suit weaker</span></div></button>
            <button class="ip-act"><b>Deny and threaten to sue</b><span>Comms likes it. Lawyers don’t.</span><div class="fx"><span class="chip up">bounce today</span><span class="chip dn">worse if proven</span></div></button>
            <button class="ip-act"><b>Say nothing</b><span>Let the next call answer.</span><div class="fx"><span class="chip dn">drift lower</span></div></button>
          </div></section>
        <section class="gp ip-respond"><h3>Also this week</h3>
          <div style="font-size:13.5px;font-weight:700;line-height:1.38">Brennan Partners now owns 5.2% and wants two board seats at the annual meeting. With the stock down, other funds are listening.</div>
          <div style="margin-top:8px"><span class="chip nt">Opens as a board vote</span></div></section>
      </div></div>`));
  },
};

export async function apply(name) {
  await wait(300);
  await MOCKS[name]();
  await wait(200);
}
