// Mockup injector: runs inside the live game page (era 3, a trained model waiting) and draws one option.
// Uses the game's own tokens only (--cream --paper --ink --teal --wood --coral --sky).
window.__mock = function mock(option, moment = 'main') {
  const overlay = document.querySelector('#overlay');
  const fx = document.querySelector('#fx');
  // Clear first-time tips, waiting cards and the old ready pill.
  overlay.querySelectorAll('.ev-briefing, .ready-note, .bd-say, .dl-pill, .dl-bubbles, .ev-bubble').forEach((n) => n.remove());
  document.querySelectorAll('.advisor-marker').forEach((n) => (n.style.display = 'none'));
  document.querySelectorAll('.mk').forEach((n) => n.remove());

  const css = document.createElement('style');
  css.className = 'mk';
  css.textContent = `
  .mk-abs{position:absolute;pointer-events:none}
  .mk-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px 8px;border-radius:10px;border:0;font:inherit;font-size:14px;font-weight:900;color:var(--paper);background:var(--coral);box-shadow:0 2px 0 color-mix(in oklab,var(--coral) 60%,var(--ink))}
  .mk-btn.small{padding:4px 12px 5px;font-size:12.5px;border-radius:8px}
  .mk-rumor{display:inline-flex;align-items:center;gap:6px;padding:3px 11px 4px;border-radius:999px;font-size:11.5px;font-weight:800;color:color-mix(in oklab,var(--wood) 55%,var(--ink));background:color-mix(in oklab,var(--wood) 16%,var(--paper));box-shadow:0 1px 0 color-mix(in oklab,var(--ink) 18%,transparent)}
  .mk-rumor i{width:7px;height:7px;border-radius:50%;background:var(--wood)}
  .mk-card{background:var(--paper);border-radius:14px;border:1px solid color-mix(in oklab,var(--ink) 8%,transparent);box-shadow:0 2px 0 color-mix(in oklab,var(--ink) 14%,transparent),0 8px 22px color-mix(in oklab,var(--ink) 14%,transparent)}
  .mk-lbl{font-size:10.5px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:color-mix(in oklab,var(--wood) 60%,var(--ink))}
  .mk-muted{color:color-mix(in oklab,var(--ink) 58%,var(--paper))}
  .mk-flaw{display:grid;grid-template-columns:18px 1fr auto;gap:8px;align-items:start;padding:7px 0;border-top:1px solid color-mix(in oklab,var(--ink) 9%,transparent);font-size:13px}
  .mk-flaw .n{font-weight:900}
  .mk-flaw .q{font-size:11.5px;font-weight:700;font-style:italic;color:color-mix(in oklab,var(--ink) 58%,var(--paper));margin-top:1px}
  .mk-flaw .st{font-size:11px;font-weight:900;white-space:nowrap}
  .mk-flaw.done .n{text-decoration:line-through;text-decoration-color:var(--teal);text-decoration-thickness:2px}
  .mk-flaw .ico{width:16px;height:16px;border-radius:50%;margin-top:1px}
  .mk-flaw.done .ico{background:var(--teal)}
  .mk-flaw.work .ico{border:3px solid var(--coral);background:conic-gradient(var(--coral) 0 60%,transparent 0)}
  .mk-flaw.left .ico{border:2px dashed color-mix(in oklab,var(--coral) 70%,var(--ink))}
  .mk-flaw.queued .ico{border:2px solid color-mix(in oklab,var(--coral) 70%,var(--ink))}
  .mk-bub{position:absolute;display:grid;place-items:center;border-radius:50%;font-weight:900;color:var(--paper)}
  .mk-bub.teal{background:radial-gradient(circle at 35% 30%,color-mix(in oklab,var(--teal) 55%,var(--paper)),var(--teal) 62%);border:2px solid color-mix(in oklab,var(--teal) 70%,var(--ink))}
  .mk-bub.coral{background:radial-gradient(circle at 35% 30%,color-mix(in oklab,var(--coral) 60%,var(--paper)),var(--coral) 62%);border:2px solid color-mix(in oklab,var(--coral) 70%,var(--ink))}
  .mk-bub.ghost{background:transparent;border:2px dashed color-mix(in oklab,var(--teal) 70%,var(--paper));color:color-mix(in oklab,var(--teal) 70%,var(--ink))}
  .mk-say{position:absolute;width:250px}
  .mk-veil{position:absolute;inset:0;background:color-mix(in oklab,var(--ink) 52%,transparent)}
  .mk-hand{font-family:'Caveat',cursive;font-weight:700}
  `;
  document.head.append(css);
  if (!document.querySelector('link.mk-font')) {
    const link = document.createElement('link');
    link.className = 'mk-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap';
    document.head.append(link);
  }

  const layer = document.createElement('div');
  layer.className = 'mk mk-abs';
  layer.style.inset = '0';
  layer.style.zIndex = '20';
  overlay.append(layer);
  const add = (html, style = '') => {
    const d = document.createElement('div');
    d.className = 'mk-abs';
    d.style.cssText = style;
    d.innerHTML = html;
    layer.append(d);
    return d;
  };

  // Freeze the HUD: the game redraws it on every tick, so swap in a detached copy for the mock.
  const liveHud = document.querySelector('#hud');
  if (!liveHud.dataset.frozen) {
    const frozen = liveHud.cloneNode(true);
    frozen.dataset.frozen = '1';
    liveHud.replaceWith(frozen);
  }
  // HUD pill and clock at the mocked moment.
  const pill = document.querySelector('#hud .pill');
  const setPill = (title, status, pct, extra = '') => {
    pill.innerHTML = `<div class="t">${title}</div><div class="s">${status}</div>${pct == null ? '' : `<div class="bar"><i style="width:${pct}%"></i></div>`}${extra}`;
  };
  const walker = document.createTreeWalker(document.querySelector('#hud'), NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (/Jan 2025/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace('Jan 2025', 'Feb 2025');
    if (/Week \d/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/Week \d/, 'Week 4');
  }

  const flawRows = (compact = false) => `
    <div class="mk-flaw done"><i class="ico"></i><div><div class="n">Jailbreaks waiting</div>${compact ? '' : '<div class="q">Safety: “Jailbreakers would have found it first.”</div>'}</div><div class="st" style="color:var(--teal)">fixed Feb 10</div></div>
    <div class="mk-flaw done"><i class="ico"></i><div><div class="n">Confident wrong answers</div>${compact ? '' : '<div class="q">Research: “It stopped citing cases that don’t exist.”</div>'}</div><div class="st" style="color:var(--teal)">fixed Feb 18</div></div>
    <div class="mk-flaw left"><i class="ico"></i><div><div class="n">Too eager to please</div>${compact ? '' : '<div class="q">Policy: “Users love it. Æon Review won’t.”</div>'}</div><div class="st" style="color:color-mix(in oklab,var(--coral) 70%,var(--ink))">left in</div></div>`;

  if (option === 'A') {
    // Game Dev Tycoon's bug-fixing phase: the project pill carries it, a Flaws counter joins the badges, Publish sits under the pill.
    const flawsLeft = { start: 3, flawfix: 2 }[moment] ?? 1;
    const status = moment === 'start' || moment === 'flawfix' ? 'polishing · fixing flaws' : 'polishing · polish 37';
    setPill('Kestrel 3 Core', status, moment === 'start' || moment === 'flawfix' ? 0 : 37);
    const hud = document.querySelector('#hud .hud');
    const flaw = document.createElement('div');
    flaw.className = 'ctr mk';
    flaw.innerHTML = `<div class="badge" style="border:3px solid var(--coral);color:color-mix(in oklab,var(--coral) 70%,var(--ink));background:var(--paper)">${flawsLeft}</div><div class="tag" style="background:color-mix(in oklab,var(--coral) 70%,var(--ink))">Flaws</div>`;
    hud.append(flaw);
    const pr = document.querySelector('#hud .pill').getBoundingClientRect();
    const cx = pr.left + pr.width / 2;
    const rumor = moment === 'rival'
      ? '<span class="mk-rumor" style="color:var(--paper);background:color-mix(in oklab,var(--wood) 75%,var(--ink))"><i style="background:var(--paper)"></i>Lodestar launched today · the critics’ bar just went up</span>'
      : moment === 'start' ? '' : '<span class="mk-rumor"><i></i>Lodestar launch rumored within ~2 weeks</span>';
    add(`<div style="display:flex;flex-direction:column;align-items:center;gap:7px">
      <button class="mk-btn">Publish Kestrel 3 Core</button>${rumor}</div>`, `left:${cx}px;top:86px;transform:translateX(-50%)`);
    const badge = flaw.querySelector('.badge').getBoundingClientRect();
    if (moment === 'start') {
      add(`<div class="ev-bubble" style="position:relative;width:270px;--tail:96px"><b>Research</b>Training’s done. We’ll keep tuning it while you decide: three flaws to fix first, then polish. Publish whenever it’s ready.</div>`, 'left:418px;top:196px');
    } else if (moment === 'flawfix') {
      add('<div class="mk-bub coral" style="width:30px;height:30px;font-size:14px;left:0;top:0">✓</div>', `left:${badge.left - 150}px;top:${badge.top + 150}px`);
      add('<div class="mk-bub coral" style="width:20px;height:20px;font-size:0;left:0;top:0;opacity:.5"></div>', `left:${badge.left - 215}px;top:${badge.top + 250}px`);
      add(`<div class="ev-bubble" style="position:relative;width:240px;--tail:150px"><b>Safety</b>Jailbreak holes patched. Hallucinations next, unless you want something else first.</div>`, 'left:555px;top:302px');
    } else {
      // A polish bubble in flight from the Research desk to the pill.
      add('<div class="mk-bub teal" style="width:34px;height:34px;font-size:12px;left:0;top:0">+16</div>', 'left:585px;top:180px');
      add('<div class="mk-bub teal" style="width:24px;height:24px;font-size:0;left:0;top:0;opacity:.55"></div>', 'left:548px;top:246px');
    }
    if (moment === 'flaws-open') {
      add(`<div class="mk-card" style="width:300px;padding:10px 14px 8px">
        <div class="mk-lbl" style="margin-bottom:4px">Flaws · top one gets fixed next</div>${flawRows()}
        <div class="mk-muted" style="font-size:11px;font-weight:700;margin-top:6px">Tap a flaw to move it up, or to leave it in.</div></div>`, `left:${badge.left - 60}px;top:${badge.bottom + 18}px`);
    }
  }

  if (option === 'B') {
    // A docked post-training card on the left, like the GDT side panels.
    setPill('Kestrel 3 Core', 'polishing · day 20', 37);
    const past = [[21, 30], [16, 26]];
    const future = [[13, 23], [10, 20], [8, 18], [6, 16], [5, 14], [4, 13]];
    const bubbles = [...past.map(([v, s]) => `<span class="mk-bub teal" style="position:relative;width:${s}px;height:${s}px;font-size:${s > 24 ? 10 : 9}px">+${v}</span>`),
      ...future.map(([v, s]) => `<span class="mk-bub ghost" style="position:relative;width:${s}px;height:${s}px;font-size:${s > 22 ? 9 : 0}px">+${v}</span>`)].join('');
    add(`<div class="mk-card" style="width:318px;padding:14px 16px 14px">
      <div class="mk-lbl">Post-training</div>
      <div style="font-size:18px;font-weight:900;margin:2px 0 8px">Kestrel 3 Core</div>
      <div class="mk-lbl" style="font-size:9.5px">Flaws</div>${flawRows()}
      <div style="border-top:1px solid color-mix(in oklab,var(--ink) 9%,transparent);margin-top:4px;padding-top:10px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="mk-lbl" style="font-size:9.5px">Polish</span><span style="font-size:20px;font-weight:900;color:color-mix(in oklab,var(--teal) 75%,var(--ink))">37</span></div>
        <div style="display:flex;align-items:center;gap:5px;margin:7px 0 4px">${bubbles}</div>
        <div class="mk-muted" style="font-size:11.5px;font-weight:700">Next bubble +13 in about 2 days</div>
      </div>
      <div style="margin-top:10px"><span class="mk-rumor"><i></i>Lodestar launch rumored within ~2 weeks</span></div>
      <div class="mk-muted" style="font-size:11.5px;font-weight:700;margin-top:6px">OpenBrain launched Feb 14. Critics now compare you with it.</div>
      <button class="mk-btn" style="margin-top:12px;width:100%;justify-content:center">Publish Kestrel 3 Core</button>
    </div>`, 'left:14px;top:62px');
  }

  if (option === 'C') {
    // In-world: the whiteboard on the wall is the post-training board; clicking it opens it flat, like the paperwork.
    setPill('Kestrel 3 Core', 'polishing on the whiteboard', null);
    if (moment === 'office') {
      add(`<div style="position:absolute;left:-44px;top:-26px;width:88px;height:52px;border:2.5px solid var(--teal);border-radius:10px;box-shadow:0 0 0 7px color-mix(in oklab,var(--teal) 18%,transparent)"></div>`, 'left:968px;top:322px');
      add(`<div class="ev-bubble" style="position:relative;width:250px;--tail:150px"><b>Safety</b>Crossed off the hallucinations. The eager-to-please one stays up there unless you say so.</div>`, 'left:548px;top:304px');
      add('<button class="mk-btn">Publish</button>', 'left:720px;top:86px;transform:translateX(-50%)');
    } else {
      add('<div class="mk-veil"></div>', 'inset:0');
      const note = (text, tint, rot, extra = '') => `<div class="mk-hand" style="width:150px;min-height:92px;padding:10px 12px;background:color-mix(in oklab,${tint} 30%,var(--paper));transform:rotate(${rot}deg);font-size:21px;line-height:1.05;box-shadow:0 2px 0 color-mix(in oklab,var(--ink) 16%,transparent);${extra}">${text}</div>`;
      add(`<div style="width:1040px;height:540px;background:color-mix(in oklab,var(--paper) 88%,var(--sky));border:14px solid color-mix(in oklab,var(--ink) 72%,var(--paper));border-radius:8px;box-shadow:0 18px 40px color-mix(in oklab,var(--ink) 35%,transparent);position:relative;color:var(--ink)">
        <div class="mk-hand" style="position:absolute;left:34px;top:18px;font-size:40px">Kestrel 3 Core · polish</div>
        <div class="mk-hand" style="position:absolute;left:36px;top:78px;font-size:24px;color:color-mix(in oklab,var(--coral) 70%,var(--ink))">FLAWS (top one first)</div>
        <div style="position:absolute;left:34px;top:118px;display:flex;flex-direction:column;gap:14px">
          ${note('<s style="text-decoration-thickness:3px;text-decoration-color:var(--teal)">jailbreaks</s><br><span style="font-size:17px">fixed Feb 10</span>', 'var(--coral)', -2)}
          ${note('<s style="text-decoration-thickness:3px;text-decoration-color:var(--teal)">confident wrong answers</s><br><span style="font-size:17px">fixed Feb 18</span>', 'var(--coral)', 1.5)}
          ${note('too eager to please<br><span style="font-size:17px">leaving it in?</span>', 'var(--coral)', -1)}
        </div>
        <div class="mk-hand" style="position:absolute;left:300px;top:78px;font-size:24px;color:color-mix(in oklab,var(--teal) 70%,var(--ink))">POLISH</div>
        <svg viewBox="0 0 520 300" width="520" height="300" style="position:absolute;left:290px;top:118px;overflow:visible">
          <g fill="none" stroke="color-mix(in oklab, var(--ink) 80%, transparent)" stroke-width="3" stroke-linecap="round">
            <path d="M20 280 L20 20 M20 280 L510 280"/>
            <path d="M20 280 C 90 150, 140 110, 200 92 S 360 58, 510 50" stroke="var(--teal)" stroke-width="4"/>
            <path d="M200 92 S 360 58, 510 50" stroke="var(--paper)" stroke-width="5" stroke-dasharray="2 12"/>
          </g>
          <g font-family="Caveat" font-weight="700" font-size="22" fill="var(--ink)">
            <circle cx="95" cy="175" r="16" fill="var(--teal)"/><text x="80" y="160" dx="-14">+21</text>
            <circle cx="160" cy="112" r="13" fill="var(--teal)"/><text x="150" y="98">+16</text>
            <circle cx="220" cy="88" r="11" fill="none" stroke="var(--teal)" stroke-width="3"/><text x="212" y="74">+13?</text>
            <text x="30" y="46" font-size="28">37</text>
            <line x1="200" y1="20" x2="200" y2="290" stroke="var(--coral)" stroke-width="3" stroke-dasharray="6 8"/>
            <text x="206" y="304" fill="var(--coral)">today</text>
            <rect x="330" y="20" width="120" height="260" fill="color-mix(in oklab, var(--wood) 22%, transparent)"/>
            <text x="340" y="220" fill="color-mix(in oklab, var(--wood) 60%, var(--ink))">Lodestar?</text>
            <text x="340" y="244" fill="color-mix(in oklab, var(--wood) 60%, var(--ink))" font-size="20">within ~2 weeks</text>
            <line x1="130" y1="20" x2="130" y2="280" stroke="var(--ink)" stroke-width="2"/>
            <text x="92" y="16" font-size="18">OpenBrain out</text>
          </g>
        </svg>
        <div style="position:absolute;right:30px;bottom:26px;display:flex;align-items:center;gap:14px">
          <span class="mk-hand" style="font-size:24px">ready when you are →</span><button class="mk-btn" style="font-size:16px;padding:10px 22px">Publish Kestrel 3 Core</button></div>
      </div>`, 'left:200px;top:180px');
    }
  }

  if (option === 'D') {
    // A calendar strip along the bottom, like GDT's time bar: what each day of waiting buys, and when rivals land.
    setPill('Kestrel 3 Core', 'polishing · polish 37', 37);
    const x0 = 36; const perDay = 20; // Feb 3 at x0
    const X = (d) => x0 + d * perDay;
    const today = 20;
    const bubbles = [[17.5, 21, 30], [20, 16, 27], [22.5, 13, 24], [25, 10, 21], [27.5, 8, 19], [30, 6, 17], [32.5, 5, 15], [35, 4, 13], [37.5, 3, 12], [40, 3, 11]];
    const days = ['Feb 3', 'Feb 10', 'Feb 17', 'Feb 24', 'Mar 3', 'Mar 10'];
    const ticks = [0, 7, 14, 21, 28, 35].map((d, i) => `<div style="position:absolute;left:${X(d)}px;top:118px;font-size:10.5px;font-weight:800" class="mk-muted">${days[i]}</div><div style="position:absolute;left:${X(d)}px;top:110px;width:1px;height:6px;background:color-mix(in oklab,var(--ink) 30%,transparent)"></div>`).join('');
    const block = (a, b, text) => `<div style="position:absolute;left:${X(a) + 1}px;top:40px;width:${X(b) - X(a) - 3}px;height:26px;border-radius:6px;background:color-mix(in oklab,var(--coral) 20%,var(--paper));font-size:11px;font-weight:900;display:grid;place-items:center;color:color-mix(in oklab,var(--coral) 60%,var(--ink))">${text}</div>`;
    add(`<div class="mk-card" style="width:1000px;height:142px;position:relative;overflow:hidden">
      <div class="mk-lbl" style="position:absolute;left:16px;top:12px">Kestrel 3 Core · post-training</div>
      <div class="mk-muted" style="position:absolute;left:230px;top:12px;font-size:10.5px;font-weight:800">flaws, then polish</div>
      <div style="position:absolute;left:${X(today)}px;top:30px;width:3px;height:82px;background:var(--coral);border-radius:2px"></div>
      <div style="position:absolute;left:${X(today) + 7}px;top:12px;font-size:11px;font-weight:900;color:var(--coral)">today · polish 37</div>
      ${block(0, 7.5, 'jailbreaks ✓')}${block(7.5, 15, 'wrong answers ✓')}
      ${bubbles.map(([d, v, sz]) => `<div class="mk-bub ${d <= today ? 'teal' : 'ghost'}" style="left:${X(d) - sz / 2}px;top:${53 - sz / 2}px;width:${sz}px;height:${sz}px;font-size:${sz >= 19 ? 9.5 : 0}px;background-color:${d <= today ? '' : 'var(--paper)'}">+${v}</div>`).join('')}
      <div style="position:absolute;left:${X(0)}px;top:80px;width:${X(40) - X(0)}px;height:1px;background:color-mix(in oklab,var(--ink) 12%,transparent)"></div>
      <div style="position:absolute;left:${X(11) - 5}px;top:84px;width:10px;height:10px;border-radius:50%;background:var(--ink)"></div>
      <div style="position:absolute;left:${X(11) + 9}px;top:82px;font-size:11px;font-weight:900">OpenBrain launched</div>
      <div style="position:absolute;left:${X(26)}px;top:82px;width:${X(34) - X(26)}px;height:16px;background:repeating-linear-gradient(135deg,color-mix(in oklab,var(--wood) 34%,transparent) 0 6px,transparent 6px 12px);border-radius:4px"></div>
      <div style="position:absolute;left:${X(26) + 4}px;top:98px;font-size:11px;font-weight:900;color:color-mix(in oklab,var(--wood) 55%,var(--ink))">Lodestar rumored</div>
      <div class="mk-muted" style="position:absolute;left:${X(0) - 26}px;top:44px;font-size:9px;font-weight:900;writing-mode:vertical-rl;transform:rotate(180deg)">YOU</div>
      <div class="mk-muted" style="position:absolute;left:${X(0) - 26}px;top:80px;font-size:9px;font-weight:900;writing-mode:vertical-rl;transform:rotate(180deg)">RIVALS</div>
      ${ticks}
      <button class="mk-btn" style="position:absolute;right:18px;top:40px">Publish now</button>
      <div class="mk-muted" style="position:absolute;right:18px;top:80px;width:170px;font-size:11px;font-weight:700;text-align:right">Too eager to please: left in</div>
    </div>`, 'left:220px;top:742px');
  }
};
