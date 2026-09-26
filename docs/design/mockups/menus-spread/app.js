// Game Night menu mockups. Every stage is 1440 x 900, the game's own canvas, scaled to its frame.
// Numbers come from a seed-1 run in era 3 (?scenario=midEra3&seed=1), read from the live game on 2026-09-26.

const LAB = 'Kestrel Labs';
const ERAS = ['Chat assistants', 'The scale-up', 'Reasoning and agents', 'The gigawatt race', 'Self-improvement and pacing'];

// ---------- shared pieces ----------
const office = (era, extra = '') => `<img class="office" src="art/office-era${era}.svg" alt="" ${extra}>`;
const PAUSE = '<svg viewBox="0 0 16 16"><rect x="4" y="3" width="3" height="10" rx="1" style="fill:currentColor"/><rect x="9" y="3" width="3" height="10" rx="1" style="fill:currentColor"/></svg>';
const SPEAKER = (muted = false) => `<svg viewBox="0 0 16 16"><path d="M2.5 6 h2.6 l3.4 -3 v10 l-3.4 -3 h-2.6 z" style="fill:currentColor"/>${muted
  ? '<path d="M11 6 l4 4 M15 6 l-4 4" style="stroke:currentColor;stroke-width:1.6;stroke-linecap:round;fill:none"/>'
  : '<path d="M10.8 5.6 q1.6 2.4 0 4.8 M12.6 4 q3 4 0 8" style="stroke:currentColor;stroke-width:1.5;stroke-linecap:round;fill:none"/>'}</svg>`;

function hud({ cap = 9, ali = 6, t = 'Kestrel 3 Core', s = 'training run \u00b7 midtraining', bar = 55, go = false, era = 3, cash = '$738M', runway = 'about 13 months', date = 'Y2 M12 W4', month = 'Dec', extra = '', paused = true, speaker = false } = {}) {
  return `<div class="hud"><div class="ctr cap"><div class="badge">${cap}</div><div class="tag">Capability</div></div>
    <div class="pill"><div class="t">${t}</div><div class="s ${go ? 'go' : ''}">${s}</div>${bar != null ? `<div class="bar"><i style="width:${bar}%"></i></div>` : ''}</div>
    <div class="ctr ali"><div class="badge">${ali}</div><div class="tag">Alignment</div></div></div>
  <div class="info"><span class="full"><span class="k">Era</span> <b>${era}</b> <span class="k">\u00b7 ${ERAS[era - 1]}</span></span>
    <span class="k">Cash</span><b>${cash}</b><span class="k">Runway</span><b>${runway}</b></div>
  <div class="clock"><span class="date">${date}<small>${month}</small><span class="beat"><i></i></span></span>
    <span class="cb ${paused ? 'on' : ''}">${PAUSE}</span><span class="cb ${paused ? '' : 'on'}">\u00d71</span><span class="cb">\u00d72</span><span class="cb">\u00d74</span>
    ${speaker ? `<span class="sepv"></span><span class="cb" title="Sound">${SPEAKER(speaker === 'muted')}</span>` : ''}${extra}
    ${paused && !extra ? '<span class="paused">Paused</span>' : ''}</div>`;
}

const teamPanel = (rows, { x = 70, y = 190, w = 240, title = 'Team' } = {}) => `<div class="gp" style="left:${x}px;top:${y}px;width:${w}px"><div class="hd">${title}</div>
  ${rows.map(([name, mood, line]) => `<div class="team-row"><div class="n">${name}<span class="mood ${mood.toLowerCase()}">${mood}</span></div>${line ? `<q>${line}</q>` : ''}</div>`).join('')}</div>`;

const stats = (rows, { x, y, w = 240, title, verdict = '' }) => `<div class="gp" style="right:${x}px;top:${y}px;width:${w}px"><div class="hd">${title}</div>
  ${rows.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('')}${verdict ? `<div class="verdict">${verdict}</div>` : ''}</div>`;

const draft = (text = 'Advisor lines and hints are draft copy') => `<div class="draft">${text}</div>`;

// ---------- run data (seed 1, era 3) ----------
// Cash at the start of each turn. Eras 1-4 have four turns each, era 5 four weeks; the finance chart uses this turn axis.
const CASH = [1000, 691, 527, 396, 136, 1325, 1161, 1033, 738, 683, 627, 572, 516, 457, 397, 338, 279, 263, 247, 231, 216];
const NOW = 8;
const REV = [0, 0, 24, 27, 31, 35, 21, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25];
const GROWN = [0, 0, 24, 27, 31, 35, 21, 25, 26, 28, 30, 32, 34, 36, 38, 41, 41, 42, 43, 43];
const BURN = [55, 55, 63, 63, 67, 67, 58, 91, 80, 80, 80, 80, 84, 84, 84, 84, 88, 88, 88, 88];
const ONLINE = [10, 10, 18, 18, 18, 18, 10, 40, 30, 30, 30, 30, 51, 51, 51, 51, 51, 51, 51, 51];

// What-if from the game's projector (ui/logic/finance.js project()): era 4 and 5 goals at 120 MW, no round.
const GHOST = [738, 683, 627, 572, 516, 325, 135, -56];
function cashChart({ w, h, dark = false, raise = true, releases = true, lowest = true, label = true, ghost = false }) {
  const padL = 58; const padR = 16; const padT = 16; const padB = 34;
  const iw = w - padL - padR; const ih = h - padT - padB;
  const x = (t) => padL + (t / 20) * iw;
  const top = 1500;
  const y = (v) => padT + ih - (v / top) * ih;
  const ink = dark ? 'var(--paper)' : 'var(--ink)';
  const faint = dark ? 'color-mix(in oklab, var(--paper) 7%, transparent)' : 'color-mix(in oklab, var(--ink) 8%, transparent)';
  const soft = dark ? 'color-mix(in oklab, var(--paper) 62%, transparent)' : 'color-mix(in oklab, var(--ink) 58%, var(--paper))';
  const plan = dark ? 'var(--sky)' : 'var(--teal)';
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block;overflow:visible">`;
  for (let e = 0; e < 5; e++) {
    if (e % 2 === 0) s += `<rect x="${x(e * 4)}" y="${padT}" width="${iw / 5}" height="${ih}" style="fill:${faint}"/>`;
    s += `<text x="${x(e * 4) + 6}" y="${padT + 14}" style="font-size:11px;font-weight:900;letter-spacing:.06em;fill:${soft}">ERA ${e + 1}</text>`;
  }
  for (const v of [0, 500, 1000, 1500]) {
    s += `<line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" style="stroke:${faint};stroke-width:1"/>`;
    s += `<text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" style="font-size:11px;font-weight:800;fill:${soft}">${v === 0 ? '$0' : v >= 1000 ? `$${v / 1000}B` : `$${v}M`}</text>`;
  }
  // past: solid, with the round as a step at turn 4
  const past = [];
  for (let t = 0; t <= NOW; t++) {
    if (t === 4 && raise) { past.push([x(4), y(136)], [x(4.08), y(1434)]); continue; }
    past.push([x(t), y(CASH[t])]);
  }
  s += `<path d="M${past.map((p) => p.join(',')).join(' L')}" style="fill:none;stroke:${ink};stroke-width:3;stroke-linejoin:round"/>`;
  const fut = CASH.slice(NOW).map((v, i) => [x(NOW + i), y(v)]);
  s += `<path d="M${fut.map((p) => p.join(',')).join(' L')}" style="fill:none;stroke:${plan};stroke-width:3;stroke-dasharray:7 6;stroke-linecap:round"/>`;
  s += `<line x1="${x(NOW)}" x2="${x(NOW)}" y1="${padT}" y2="${padT + ih}" style="stroke:${ink};stroke-width:1.5"/>`;
  s += `<text x="${x(NOW) + 6}" y="${padT + 30}" style="font-size:12px;font-weight:900;fill:${ink}">Now</text>`;
  s += `<circle cx="${x(NOW)}" cy="${y(738)}" r="5.5" style="fill:${ink}"/>`;
  if (label) s += `<text x="${x(NOW) - 8}" y="${y(738) - 10}" text-anchor="end" style="font-size:13px;font-weight:900;fill:${ink}">$738M</text>`;
  if (raise) s += `<text x="${x(4) - 8}" y="${y(1434) + 30}" text-anchor="end" style="font-size:12px;font-weight:900;fill:${plan}">+$1.2B round</text>`;
  if (releases) {
    for (const [t, name] of [[2, 'Kestrel 1'], [5, 'Kestrel 2']]) {
      s += `<line x1="${x(t)}" x2="${x(t)}" y1="${y(0)}" y2="${y(0) - 10}" style="stroke:var(--coral);stroke-width:3"/>`;
      s += `<text x="${x(t)}" y="${y(0) - 15}" text-anchor="middle" style="font-size:11px;font-weight:900;fill:var(--coral)">${name}</text>`;
    }
  }
  if (ghost) {
    const pts = GHOST.slice(0, 7).map((v, i) => [x(NOW + i), y(v)]);
    const cross = NOW + 6 + 135 / 191;
    pts.push([x(cross), y(0)]);
    s += `<path d="M${pts.map((q) => q.join(',')).join(' L')}" style="fill:none;stroke:var(--coral);stroke-width:2.5;stroke-dasharray:3 5;stroke-linecap:round;opacity:.9"/>`;
    s += `<path d="M${x(cross) - 7},${y(0) - 7} l14,14 M${x(cross) + 7},${y(0) - 7} l-14,14" style="stroke:var(--coral);stroke-width:3;stroke-linecap:round"/>`;
    s += `<text x="${x(cross) - 14}" y="${y(0) - 6}" text-anchor="end" style="font-size:12px;font-weight:900;fill:var(--coral)">120 MW: out of cash, month 30</text>`;
  }
  if (lowest) {
    s += `<circle cx="${x(20)}" cy="${y(216)}" r="5" style="fill:${plan}"/>`;
    s += `<text x="${x(20) - 8}" y="${y(216) + 24}" text-anchor="end" style="font-size:12.5px;font-weight:900;fill:${plan}">lowest $216M, end of era 5</text>`;
  }
  for (const [t, lab] of [[0, 'Year 1'], [4, 'Year 2'], [8, 'Year 3']]) s += `<text x="${x(t)}" y="${h - 12}" style="font-size:11px;font-weight:800;fill:${soft}">${lab}</text>`;
  return `${s}</svg>`;
}

function moneyBars({ w, h }) {
  const padL = 58; const padR = 16; const padT = 8; const padB = 8;
  const iw = w - padL - padR; const ih = h - padT - padB;
  const bw = iw / 20;
  const y = (v) => padT + ih - (v / 100) * ih;
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block">`;
  for (let t = 0; t < 20; t++) {
    const fut = t >= NOW;
    s += `<rect x="${padL + t * bw + 3}" y="${y(BURN[t])}" width="${bw - 6}" height="${y(0) - y(BURN[t])}" rx="2" style="fill:color-mix(in oklab, var(--coral) ${fut ? 45 : 80}%, var(--paper))"/>`;
    s += `<rect x="${padL + t * bw + 3}" y="${y(REV[t])}" width="${bw - 6}" height="${y(0) - y(REV[t])}" rx="2" style="fill:color-mix(in oklab, var(--teal) ${fut ? 50 : 90}%, var(--paper))"/>`;
  }
  s += `<text x="${padL - 8}" y="${y(88) + 4}" text-anchor="end" style="font-size:11px;font-weight:800;fill:var(--muted)">$90M</text>`;
  s += `<text x="${padL - 8}" y="${y(0)}" text-anchor="end" style="font-size:11px;font-weight:800;fill:var(--muted)">$0</text>`;
  return `${s}</svg>`;
}

function computeBars({ w, h }) {
  const padL = 58; const padR = 16; const ih = h - 12;
  const bw = (w - padL - padR) / 20;
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="display:block">`;
  for (let t = 0; t < 20; t++) {
    const v = ONLINE[t]; const fut = t >= NOW;
    const hh = (v / 60) * ih;
    s += `<rect x="${padL + t * bw + 3}" y="${h - hh}" width="${bw - 6}" height="${hh}" rx="2" style="fill:${fut ? 'color-mix(in oklab, var(--sky) 35%, var(--paper))' : 'var(--sky)'}"/>`;
  }
  s += `<text x="${padL - 8}" y="${h - (40 / 60) * ih + 4}" text-anchor="end" style="font-size:11px;font-weight:800;fill:var(--muted)">40 u</text>`;
  return `${s}</svg>`;
}

// ---------- endings ----------
const ENDINGS = [
  ['aligned', 'win', 'Aligned success', 'You reached the frontier and kept your model trustworthy.', 'Get to the finish first without cutting corners.'],
  ['pacingDeal', 'win', 'A negotiated pace', 'The race slowed by agreement, and you helped make it hold.', 'Get a binding deal to slow down, and keep it.'],
  ['pyrrhic', 'win', 'A costly win', 'You won the race. Nobody is sure what you built.', 'Finish first, carrying a lot of shortcuts.'],
  ['overtaken', 'fail', 'Overtaken', 'You survived the race but finished behind it.', 'Reach the end, but not in first place.'],
  ['misalignment', 'fail', 'Catastrophic misalignment', 'It did everything it was scored on. None of it was what you meant.', ''],
  ['misuse', 'fail', 'Catastrophic misuse', 'Your model did what it was asked. The asking was the problem.', 'Ship something powerful to anyone who asks.'],
  ['quietTakeover', 'fail', 'A quiet takeover', 'It never needed a release. Inside your own lab, it stopped needing you.', 'Let it run more and more of your lab.'],
  ['rivalDisaster', 'fail', 'Someone else\u2019s disaster', 'You were careful. Careful was never only up to you.', 'Let the whole race run too hot.'],
  ['boardRemoved', 'fail', 'Removed by the board', 'The board kept your lab and dropped your promises.', 'Lose the room at a board vote.'],
  ['leftBehind', 'fail', 'Left behind', 'The future kept going. It stopped asking your lab.', 'Fall too far behind when an era closes.'],
  ['acquihire', 'fail', 'Absorbed', 'The money ran out. Your model did not. It works for someone else now.', ''],
];
// Example collection, marked as such on the page: three endings found.
const FOUND = { aligned: { count: 1, era: 5, date: 'Y4 M9' }, misalignment: { count: 2, era: 4, date: 'Y3 M6' }, acquihire: { count: 1, era: 2, date: 'Y1 M11' } };
const EARLY = ['misalignment', 'misuse', 'quietTakeover', 'rivalDisaster', 'boardRemoved', 'leftBehind', 'acquihire'];
const FINISH = ['aligned', 'pacingDeal', 'pyrrhic', 'overtaken'];
const still = (id) => `<img class="still" src="stills/${id}.jpg" alt="">`;
const byId = Object.fromEntries(ENDINGS.map((e) => [e[0], e]));
const foundMeta = (id) => { const f = FOUND[id]; return f ? `Found ${f.count === 1 ? 'once' : `${f.count} times`} \u00b7 first in era ${f.era}` : ''; };

// ================= 1. Intro =================
const intro = {
  id: 'intro', n: 1, title: 'The first screen',
  today: 'Today the game opens straight into the office; there is no title screen yet. You picked T1 (the Game Dev Tycoon title panel) and H1 (the one-card how to play) earlier, so all three options lead into those.',
  rec: 'A',
  options: [
    { code: 'A', name: 'Title panel', kind: 'safe', text: 'The picked T1 panel grows into the front door: Continue on top, then New game, then Endings found, How to play, Sound and music, Credits. The empty era-1 office sits behind it.', draw: () => `${office(1)}<div class="veil"></div>
      <section class="gp dlg" style="left:470px;top:118px;width:500px;padding:34px 44px 28px">
        <h1 style="font-size:64px;letter-spacing:-.02em;line-height:1">AI Lab</h1>
        <div class="subt" style="font-size:15px">Run a frontier AI lab for five eras.</div>
        <div class="rule" style="margin:22px 20px"></div>
        <div class="btn" style="display:block;width:auto;padding:12px 0 11px;font-size:19px">Continue<div style="font-size:12px;font-weight:800;opacity:.85">${LAB} \u00b7 era 3 \u00b7 Y2 M12</div></div>
        <div class="btn2" style="margin-top:12px;font-size:17px">New game</div>
        <div style="display:grid;gap:2px;margin-top:18px;text-align:left">
          ${[['Endings found', '<span class="count">3 of 11</span>'], ['How to play', ''], ['Sound and music', ''], ['Credits', '']].map(([a, b]) => `<div class="it" style="font-size:15px;padding:8px 12px">${a}${b}</div>`).join('')}
        </div>
      </section>
      <div class="callout up" style="left:560px;top:760px;max-width:330px">New game opens the T1 name panel you picked, then the H1 how-to-play card.</div>` },
    { code: 'B', name: 'Five offices', kind: 'mid', text: 'The whole run is the picture: the five era offices rise left to right like a bar chart, from the loft to the gigawatt campus. The title sits above them and the menu is one row of buttons below.', draw: () => {
      const ws = [200, 230, 255, 285, 308];
      let left = 48;
      const rooms = ws.map((w, i) => {
        const h = Math.round(w * 720 / 1140); const sc = w / 1140;
        const html = `<div style="position:absolute;left:${left}px;top:${610 - h}px;width:${w}px">
          <div style="width:${w}px;height:${h}px;overflow:hidden;border-radius:12px;background:var(--paper);box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 10%, transparent)"><img src="art/office-era${i + 1}.svg" alt="" style="width:${1440 * sc}px;height:${900 * sc}px;margin:${-100 * sc}px 0 0 ${-150 * sc}px;display:block"></div>
          <div style="margin-top:8px;font-size:12px;font-weight:900;letter-spacing:.05em;color:color-mix(in oklab, var(--wood) 70%, var(--ink))">ERA ${i + 1}</div>
          <div style="font-size:14px;font-weight:800">${ERAS[i]}</div></div>`;
        left += w + 18; return html;
      }).join('');
      return `<div style="position:absolute;left:48px;top:48px"><div style="font-size:84px;font-weight:300;letter-spacing:-.03em;line-height:1">AI Lab</div>
        <div style="margin-top:8px;font-size:18px;font-weight:700" class="muted">Five eras, from chat assistants to self-improving models.</div></div>
        ${rooms}
        <div style="position:absolute;left:48px;top:726px;right:48px;display:flex;gap:12px;align-items:center">
          <div class="btn" style="width:auto;padding:12px 26px;font-size:18px">Continue \u00b7 ${LAB}</div><div class="btn2" style="padding:12px 22px">New game</div>
          <div style="flex:1"></div>
          ${['Endings found 3/11', 'How to play', 'Sound and music', 'Credits'].map((t) => `<div class="it" style="font-size:15px;padding:10px 12px">${t}</div>`).join('')}
        </div>`;
    } },
    { code: 'C', name: 'Endings wall', kind: 'exp', text: 'The front door is the collection: all eleven ending films as a wall of stills, the three you found in colour and the rest dark. It tells a new player there are many ways this ends, and a returning one what is left to find.', draw: () => {
      const tiles = ENDINGS.map(([id, kind, title]) => {
        const f = FOUND[id];
        return `<div style="position:relative;border-radius:10px;overflow:hidden;background:var(--deep)">
          <img src="stills/${id}.jpg" alt="" style="display:block;width:100%;height:100%;object-fit:cover;${f ? '' : 'filter:grayscale(1) blur(3px) brightness(.35)'}">
          ${f ? `<div style="position:absolute;left:0;right:0;bottom:0;padding:22px 12px 9px;background:linear-gradient(transparent, color-mix(in oklab, var(--ink) 85%, transparent));color:var(--paper);font-size:15px;font-weight:900">${title}<div style="font-size:11px;font-weight:800;opacity:.8">${kind === 'win' ? 'A win' : 'A failure'} \u00b7 ${foundMeta(id)}</div></div>`
    : '<div style="position:absolute;inset:0;display:grid;place-items:center;color:color-mix(in oklab, var(--paper) 50%, transparent);font-size:38px;font-weight:900">?</div>'}
        </div>`;
      }).join('');
      return `<div style="position:absolute;inset:0;background:var(--deep)"></div>
        <div style="position:absolute;left:24px;right:24px;top:24px;height:560px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:12px">${tiles}
          <div style="border-radius:10px;border:2px dashed color-mix(in oklab, var(--paper) 25%, transparent);display:grid;place-items:center;text-align:center;color:color-mix(in oklab, var(--paper) 70%, transparent);font-size:14px;font-weight:800;padding:12px">Eight stories are<br>still unwritten</div></div>
        <section class="gp" style="left:24px;right:24px;top:608px;height:268px;padding:30px 40px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:30px">
          <div><div style="font-size:78px;font-weight:300;letter-spacing:-.03em;line-height:1">AI Lab</div>
            <div class="subt" style="font-size:17px;margin-top:10px">Run a frontier AI lab for five eras. <b style="color:var(--ink)">3 of 11 endings found.</b></div></div>
          <div style="display:grid;gap:10px;width:330px"><div class="btn" style="width:auto;padding:12px 0;font-size:18px">Continue \u00b7 ${LAB}</div><div class="btn2">New game</div>
            <div class="row" style="justify-content:space-between;font-size:14px;font-weight:800" class="muted"><span>How to play</span><span>Sound and music</span><span>Credits</span></div></div>
        </section>`;
    } },
  ],
};

// ================= 2. Finding the menu =================
const FM = [1039, 636];
const mainMenu = ({ x = FM[0] + 8, y = 330, hiRelease = false, extra = '' } = {}) => `<div class="ctx" style="left:${x}px;top:${y}px">
  <div class="it">Plan the budget</div>
  <div class="it off">Start a training run <span class="team busy">Research team \u00b7 busy</span></div>
  <div class="it ${hiRelease ? 'on' : ''}">Release a model ${hiRelease ? '<span class="ready">Ready</span>' : '<span class="team">Policy team \u00b7 free</span>'}</div>
  <div class="it">Who does the work</div>
  <div class="it off">Amend the constitution <span class="team busy">Safety team \u00b7 busy</span></div>
  <div class="it off">Take a meeting</div>
  <div class="it">Company <span>\u25b8</span></div>
  <div class="it">Lab history</div>${extra}
  <div class="moves">0 of 2 team actions this month</div></div>`;
const readyHud = (o = {}) => hud({ t: 'Kestrel 3 Core', s: 'trained \u00b7 ready to release', bar: 100, ...o });
const menuSec = {
  id: 'menu', n: 2, title: 'Finding the menu',
  today: 'In play you could not find how to release: the only way into the menu is a click on the floor, a waiting decision card blocks it, and the HUD says "open the menu when you are" without saying how. All three options also let the menu open while a card waits (the card steps aside, as it does for dialogs).',
  rec: 'B',
  options: [
    { code: 'A', name: 'Say it', kind: 'safe', text: 'Keep the floor click and say it out loud. The HUD line names the action ("click the floor to release"), and on the first run a ring pulses on the floor with a label. No new controls.', draw: () => `${office(3)}${readyHud({ s: 'Ready \u00b7 click the floor to release', go: true })}
      <div class="ping big" style="left:${FM[0]}px;top:${FM[1]}px"></div><div class="ping" style="left:${FM[0]}px;top:${FM[1]}px"></div>
      <div class="callout up" style="left:${FM[0] - 30}px;top:${FM[1] + 30}px">Click the floor for the menu</div>
      <div class="callout" style="left:500px;top:150px;background:var(--coral)">The pill names the action while a model waits</div>` },
    { code: 'B', name: 'A menu button', kind: 'mid', text: 'A Menu button joins the clock chip, next to the speeds and the new mute button, with a coral dot when something is ready. It opens the same menu under the chip, and the M key opens it too. The floor click still works.', draw: () => `${office(3)}${readyHud({ s: 'trained \u00b7 ready to release', extra: `<span class="sepv"></span><span class="cb">${SPEAKER()}</span><span class="menu-b hi">Menu <kbd>M</kbd><span class="dot">1</span></span>`, speaker: false })}
      ${mainMenu({ x: 1186, y: 136, hiRelease: true })}` },
    { code: 'C', name: 'In the room', kind: 'exp', text: 'What is ready shows up where it lives: a marker over the racks says the model is trained, and one click opens the release. Cards that wait shrink to a small stack in the corner instead of blocking the floor.', draw: () => `${office(3)}${readyHud({ s: 'trained \u00b7 ready to release' })}
      <div class="say" style="left:1010px;top:230px;width:250px;--tx:112px;text-align:center"><b style="text-align:center">From the racks</b>Kestrel 3 Core is trained<div class="btn" style="margin-top:8px;width:170px;font-size:15px">Release it</div></div>
      <div style="position:absolute;left:24px;bottom:24px;width:280px">
        ${[2, 1, 0].map((i) => `<div class="card" style="position:${i ? 'absolute' : 'relative'};left:${i * 5}px;top:${-i * 7}px;width:270px;height:${i ? 88 : 'auto'}px;padding:10px 12px;${i ? 'opacity:.85' : 'min-height:88px'}">${i ? '' : '<div class="k-lab">2 decisions waiting</div><div style="font-size:14px;font-weight:900;margin-top:2px">A reporter asks about your safety team</div><div class="muted" style="font-size:12px;font-weight:700;margin-top:3px">Answer by Y3 M1 \u00b7 click to open</div>'}</div>`).join('')}
      </div>` },
  ],
};

// ================= 3. Company menu =================
const coMain = (x, y, extra = '') => `<div class="ctx" style="left:${x}px;top:${y}px">
  <div class="it">Plan the budget</div><div class="it off">Start a training run</div><div class="it">Release a model</div><div class="it">Who does the work</div>
  <div class="it off">Amend the constitution</div><div class="it off">Take a meeting</div><div class="it on">Company <span>\u25b8</span></div><div class="it">Lab history</div>${extra}
  <div class="moves">0 of 2 team actions this month</div></div>`;
const companySec = {
  id: 'company', n: 3, title: 'The Company menu',
  today: 'Today Company holds six business items in one flat list. The music work adds Sound and music and Credits, and the endings collection needs a way in, so the list has to take three items that are about the game, not the lab.',
  rec: 'A',
  options: [
    { code: 'A', name: 'Grouped list', kind: 'safe', text: 'The same submenu, split into three small labelled groups: Money, The lab, and This game. Nothing moves; the new items sit at the bottom under their own label.', draw: () => `${office(3)}${hud()}${coMain(1047, 330)}
      <div class="ctx wide" style="left:789px;top:470px">
        <div class="grp">Money</div><div class="it">Plan the years ahead</div><div class="it">Raise a round <span class="team">Finance team \u00b7 free</span></div><div class="it">Sign a compute deal <span class="team">Finance team \u00b7 free</span></div>
        <div class="grp">The lab</div><div class="it">The board</div><div class="it off">Research a technique early <span class="team busy">Research team \u00b7 busy</span></div>
        <div class="grp">This game</div><div class="it on">Endings found <span class="count">3 of 11</span></div><div class="it">Sound and music</div><div class="it">Credits</div></div>` },
    { code: 'B', name: 'A Game item', kind: 'mid', text: 'Company stays business only. A new Game item at the bottom of the main menu holds the rest: Endings found, How to play, Sound and music, Credits, and Save and quit to the title screen.', draw: () => `${office(3)}${hud()}${coMain(1047, 320, '<div class="sep"></div><div class="it on">Game <span>\u25b8</span></div>').replace('<div class="it on">Company', '<div class="it">Company')}
      <div class="ctx wide" style="left:789px;top:560px"><div class="it on">Endings found <span class="count">3 of 11</span></div><div class="it">How to play</div><div class="it">Sound and music</div><div class="it">Credits</div><div class="sep"></div><div class="it">Save and quit to title</div></div>` },
    { code: 'C', name: 'Company as a page', kind: 'exp', text: 'Company opens a panel about your company instead of a list: cash, valuation, runway and models shipped on top, then each action as a tile that shows its own status (the next board meeting, research points, endings found).', draw: () => {
      const tile = (name, sub, off = false) => `<div class="card" style="padding:12px 14px;${off ? 'opacity:.55' : ''}"><div style="font-size:15px;font-weight:900">${name}</div><div class="muted" style="font-size:12.5px;font-weight:700;margin-top:3px">${sub}</div></div>`;
      return `${office(3)}${hud()}<div class="veil"></div><section class="gp dlg" style="left:250px;top:120px;width:940px;padding:22px 30px 24px;text-align:left">
        <div class="row" style="gap:18px"><div class="mono" style="width:58px;height:58px;font-size:28px;border-radius:14px">K</div><div><h1>${LAB}</h1><div class="subt">Era 3 \u00b7 Reasoning and agents \u00b7 two models shipped</div></div><div style="flex:1"></div><div class="back">Close</div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px">
          ${[['Cash', '$738M'], ['Valuation', '$25.2B'], ['Runway', 'about 13 months'], ['Revenue', '$25M a month']].map(([k, v]) => `<div style="padding:10px 12px;border-radius:10px;background:var(--paper)"><div class="k-lab">${k}</div><div style="font-size:22px;font-weight:900;margin-top:2px">${v}</div></div>`).join('')}
        </div>
        <div class="rule" style="margin:18px 0 14px"></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
          <div style="display:grid;gap:8px;align-content:start"><div class="k-lab">Money</div>${tile('Plan the years ahead', 'Cash lasts the run on today\u2019s plan')}${tile('Raise a round', 'Growth fund offers $1.3B')}${tile('Sign a compute deal', 'Finance team is free')}</div>
          <div style="display:grid;gap:8px;align-content:start"><div class="k-lab">The lab</div>${tile('The board', 'Meets in about 4 months')}${tile('Research a technique early', '16 of 30 points for Low-precision serving', true)}</div>
          <div style="display:grid;gap:8px;align-content:start"><div class="k-lab">This game</div>${tile('Endings found', '3 of 11')}${tile('Sound and music', 'Playing: Bossa Antigua')}${tile('Credits', 'Music, films and fonts')}</div>
        </div></section>`;
    } },
  ],
};

// ================= 4. Finance =================
const opinions = [['CFO', 'Uneasy', 'It holds. We spend 4 times what we earn by era 5.'], ['Head of Research', 'Calm', 'That keeps us about where we are. Rivals will not wait.'], ['Head of Safety', 'Calm', 'At our 20% share, era 4 gives safety 6 units.'], ['Policy and Comms', 'Uneasy', 'Chips we own need power from era 4.']];
const financeSec = {
  id: 'finance', n: 4, title: 'Plan the years ahead',
  today: 'Today\u2019s planner is the A and B combination you picked: three stacked charts, a legend, a paragraph of method notes, and the books as a second tab. In play it runs taller than the screen, pushes under the HUD and crowds the clock chip.',
  rec: 'B',
  options: [
    { code: 'A', name: 'Today, fitted', kind: 'safe', text: 'The same screen and the same three charts, fitted inside the frame: side panels start below the clock, the legend is one line, the method paragraph becomes a "How we worked this out" link, and the CFO\u2019s verdict leads the right panel.', draw: () => `${office(3)}${hud()}<div class="veil"></div>
      ${teamPanel(opinions, { x: 40, y: 150, w: 250 })}
      <section class="gp dlg" style="left:305px;top:112px;width:830px;padding:16px 24px 18px">
        <h1>Plan the years ahead</h1><div class="subt">Era 3 \u00b7 month 24 \u00b7 compute goals and what they cost each month</div>
        <div class="row" style="justify-content:center;gap:4px;margin:10px 0 4px"><span class="tab on">Timeline</span><span class="tab">The books</span></div>
        <div style="text-align:left;margin-top:6px"><div class="k-lab" style="margin-left:4px">Compute online</div>${computeBars({ w: 780, h: 90 })}
        <div class="k-lab" style="margin:10px 0 0 4px">Each month \u00b7 <span style="color:var(--teal)">revenue</span> against <span style="color:var(--coral)">spending</span></div>${moneyBars({ w: 780, h: 120 })}
        <div class="k-lab" style="margin:10px 0 2px 4px">Cash</div>${cashChart({ w: 780, h: 250, raise: true, releases: true })}</div>
        <div class="row" style="justify-content:space-between;margin-top:10px"><span class="back" style="font-size:13px">How we worked this out</span><span class="btn">Keep this plan</span><span class="back">The books \u203a</span></div>
      </section>
      ${stats([['Era 3 goal', '30 units'], ['Era 4 goal', '51 MW'], ['Era 5 goal', '51 MW'], ['Raise in era 4', 'off'], ['Promise to the board', 'off'], ['Lowest cash', '$216M']], { x: 40, y: 150, w: 250, title: 'This plan', verdict: 'Cash lasts the run. You end with about $216M.' })}` },
    { code: 'B', name: 'Cash first', kind: 'mid', text: 'One wide panel led by the question players ask: how long does the money last? A big cash line (past solid, plan dashed, the round and each release marked), then a strip that answers it in months, with what-ifs from the game\u2019s own projector. The levers sit in one row under that; the compute and monthly charts move to their own tabs.', draw: () => {
      // Month ruler for the afloat strip: month 24 (now) to 40.
      const mx = (m) => ((m - 24) / 16) * 520;
      const whatIf = (label, verdict, tone, months, note) => `<div class="row" style="gap:10px;padding:6px 0;border-top:1px solid color-mix(in oklab, var(--wood) 18%, transparent)"><div style="width:190px;font-size:13px;font-weight:800">${label}</div>
        <div style="position:relative;flex:1;height:10px;border-radius:5px;background:color-mix(in oklab, var(--ink) 8%, var(--paper))"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.min(100, (months - 24) / 9 * 100)}%;border-radius:5px;background:var(--${tone})"></i></div>
        <div style="width:230px;font-size:13px;font-weight:900;color:color-mix(in oklab, var(--${tone}) 75%, var(--ink))">${verdict}</div></div>`;
      return `${office(3)}${hud()}<div class="veil strong"></div>
      <section class="gp dlg" style="left:130px;top:104px;width:1180px;padding:16px 30px 18px;text-align:left">
        <div class="row" style="gap:16px;align-items:flex-end"><div><h1>Plan the years ahead</h1><div class="subt">Era 3 \u00b7 month 24 of 33</div></div><div style="flex:1"></div>
          <span class="tab on">Cash</span><span class="tab">Compute</span><span class="tab">Each month</span><span class="tab">The books</span></div>
        <div class="row" style="margin:10px 0 4px;gap:14px;padding:9px 14px;border-radius:10px;background:color-mix(in oklab, var(--teal) 13%, var(--paper))">
          <div style="font-size:20px;font-weight:900;color:color-mix(in oklab, var(--teal) 70%, var(--ink))">Cash lasts the run. You end with about $216M.</div><div style="flex:1"></div>
          <div style="font-size:13px;font-weight:800;font-style:italic;max-width:360px" class="muted">CFO: \u201cIt holds. We spend 4 times what we earn by era 5.\u201d</div></div>
        ${cashChart({ w: 1120, h: 270, ghost: true })}
        <div style="display:grid;grid-template-columns:560px 1fr;gap:26px;margin-top:4px;padding:12px 16px 12px;border-radius:12px;background:var(--paper)">
          <div><div class="k-lab">How long the cash lasts</div>
            <div style="position:relative;height:74px;margin-top:10px">
              <div style="position:absolute;left:0;top:22px;width:520px;height:16px;border-radius:8px;background:color-mix(in oklab, var(--ink) 8%, var(--paper))"></div>
              <div style="position:absolute;left:0;top:22px;width:${mx(33)}px;height:16px;border-radius:8px 0 0 8px;background:var(--teal)"></div>
              <div style="position:absolute;left:${mx(33)}px;top:22px;width:${mx(36.4) - mx(33)}px;height:16px;border-radius:0 8px 8px 0;background:repeating-linear-gradient(135deg, color-mix(in oklab, var(--teal) 55%, var(--paper)) 0 5px, var(--paper) 5px 9px)"></div>
              <div style="position:absolute;left:${mx(33)}px;top:14px;width:3px;height:32px;margin-left:-1px;background:var(--ink)"></div>
              <div style="position:absolute;left:${mx(33) - 60}px;top:0;width:120px;text-align:center;font-size:11px;font-weight:900">the finish \u00b7 month 33</div>
              <div style="position:absolute;left:${mx(37.3)}px;top:18px;width:2px;height:24px;background:var(--coral)"></div>
              <div style="position:absolute;left:${mx(37.3) - 70}px;top:46px;width:140px;text-align:center;font-size:11px;font-weight:800;color:color-mix(in oklab, var(--coral) 80%, var(--ink))">today\u2019s spending: out around month 37</div>
              <div style="position:absolute;left:0;top:46px;font-size:11px;font-weight:800" class="muted">now \u00b7 month 24</div>
            </div>
            <div style="font-size:13px;font-weight:800;line-height:1.4">On this plan you reach the finish with <b>$216M</b>, enough for about <b>3 more months</b>. At today\u2019s spending alone, cash lasts <b>about 13 months</b>.</div></div>
          <div><div class="k-lab">What if</div>
            <div style="margin-top:6px">
              ${whatIf('This plan', 'to the finish, $216M left', 'teal', 33)}
              ${whatIf('Raise a round in era 4', 'to the finish, about $1.5B left', 'teal', 33)}
              ${whatIf('Era 4 goal 120 MW', 'out of cash in month 30', 'coral', 30.7)}
              ${whatIf('120 MW and a round in era 4', 'to the finish, about $817M left', 'teal', 33)}
            </div>
            <div class="muted" style="font-size:11.5px;font-weight:700;margin-top:6px">Point at a what-if to draw its line on the chart. Figures from the game\u2019s own projection for this run.</div></div>
        </div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:12px;margin-top:10px;align-items:stretch">
          <div class="card" style="padding:10px 14px"><div class="k-lab">Compute goal</div>
            <div class="row" style="justify-content:space-between;margin-top:6px;white-space:nowrap">${[['Era 3', '30 units'], ['Era 4', '51 MW'], ['Era 5', '51 MW']].map(([e, v]) => `<div><div class="muted" style="font-size:12px;font-weight:800">${e}</div><span class="step" style="font-size:14px"><i>\u2212</i>${v}<i>+</i></span></div>`).join('')}</div></div>
          <div class="card" style="padding:10px 14px"><div class="k-lab">Paying for it</div>
            <div class="row" style="gap:14px;margin-top:6px;font-weight:800;font-size:13.5px;white-space:nowrap"><span style="flex:1">Raise a round in</span>${['Era 3', 'Era 4', 'Era 5'].map((e) => `<span class="row" style="gap:6px">${e}<span class="sw"></span></span>`).join('')}</div>
            <div class="row" style="gap:10px;margin-top:8px;font-weight:800;font-size:13.5px"><span style="flex:1">Promise the board 30 units by era 3\u2019s end</span><span class="sw"></span></div></div>
          <div class="row"><span class="btn" style="width:auto;padding:12px 18px;white-space:nowrap">Keep this plan</span></div>
        </div>
      </section>`;
    } },
    { code: 'C', name: 'The CFO\u2019s screen', kind: 'exp', text: 'The plan plays on the office\u2019s own screen wall, the dark panel you approved for the automation charts, and Margot the CFO says what she thinks from her desk. The three levers are paper cards along the bottom.', draw: () => `${office(3)}${hud()}<div class="veil dim"></div>
      <section style="position:absolute;left:70px;top:120px;width:800px;height:460px;border-radius:16px;background:var(--deep);border:8px solid color-mix(in oklab, var(--ink) 70%, var(--wood));box-shadow:0 20px 50px color-mix(in oklab, var(--ink) 40%, transparent);padding:14px 18px;color:var(--paper)">
        <div class="row" style="gap:10px;font-size:13px;font-weight:900;letter-spacing:.08em"><span style="padding:2px 8px;border-radius:5px;background:var(--coral)">LIVE</span>CASH \u00b7 ${LAB.toUpperCase()}<div style="flex:1"></div><span style="opacity:.7">month 24 of 33</span></div>
        <div style="font-size:30px;font-weight:300;margin:8px 0 2px">$738M today, <b style="font-weight:900;color:var(--sky)">$216M</b> at the finish</div>
        ${cashChart({ w: 760, h: 340, dark: true, label: false })}
      </section>
      <div class="say left" style="left:922px;top:500px;width:290px"><b>CFO \u00b7 Margot Hale</b>It holds, just. We spend four times what we earn by era 5. One more round and I would sleep at night.</div>
      <div style="position:absolute;left:150px;right:150px;top:660px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
        <div class="card" style="padding:14px 16px;transform:rotate(-1.2deg)"><div class="k-lab">Compute goal \u00b7 era 4</div><div class="step" style="margin-top:10px;font-size:20px"><i>\u2212</i>51 MW<i>+</i></div></div>
        <div class="card" style="padding:14px 16px;transform:rotate(.8deg)"><div class="k-lab">Raise a round in era 4</div><div class="row" style="justify-content:space-between;margin-top:10px;font-size:15px;font-weight:800">about $1.3B<span class="sw on"></span></div></div>
        <div class="card" style="padding:14px 16px;transform:rotate(-.5deg)"><div class="k-lab">Promise to the board</div><div class="row" style="justify-content:space-between;margin-top:10px;font-size:15px;font-weight:800">30 units by era 3\u2019s end<span class="sw"></span></div></div>
      </div>
      <div style="position:absolute;right:150px;top:800px" class="row"><span class="back" style="margin-right:16px;color:var(--paper)">The books</span><span class="btn">Keep this plan</span></div>
      ${draft('CFO line is draft copy \u00b7 the plan and numbers are the real seed-1 run')}` },
  ],
};

// ================= 5. Raise, research, emergency =================
const INVESTORS = [['G', 'Growth fund', '$1.3B', '5%', 'Board seat', 'wood', 'A growth fund joins the board.', 'CFO backs this'], ['S', 'Strategic cloud partner', '$1.5B', '6%', 'Strings attached', 'sky', 'A cloud partner joins the board and expects favours.', 'Research backs this'], ['W', 'Sovereign wealth fund', '$3.8B', '15%', 'Costs goodwill', 'coral', 'Staff, the public and Washington will notice.', 'Policy warns against it']];
const TECH = [['Mixture-of-experts', 2, 30, 'yours'], ['Synthetic data', 2, 25, 'yours'], ['Verifiable-reward RL', 2, 35, 'yours'], ['Chain-of-thought reasoning', 3, 40, 'yours'], ['Tool use and agents', 3, 50, 'yours'], ['Low-precision serving', 4, 30, 'early']];
const EMER = [['E', 'Equity for compute', 'Cash and cheap capacity now, less independence later.'], ['C', 'Change structure', 'A big raise with a deadline attached.'], ['B', 'Bridge round', 'Survive, at a lower valuation.'], ['A', 'Accept an acquihire', 'A tech giant licenses your models and hires your team. The run ends.']];
const raiseTeam = [['Head of Research', 'Calm', 'Cloud money comes with cloud chips. I can live with that.'], ['Head of Safety', 'Calm', 'Whoever gets the seat will ask about us. Good.'], ['CFO', 'Uneasy', 'Thirteen months of runway is not a plan.'], ['Policy and Comms', 'Uneasy', 'A sovereign fund is a headline I have to answer.']];
const emTeam = [['Head of Research', 'Uneasy', 'Keep the racks on. Whatever it takes.'], ['Head of Safety', 'Uneasy', ''], ['CFO', 'Alarmed', 'Less than a month. Pick one today.'], ['Policy and Comms', 'Uneasy', '']];
const hudDanger = () => hud({ era: 4, cash: '$28M', runway: 'less than a month', t: 'No project', s: 'click the floor to get to work', bar: null, date: 'Y3 M4 W2', month: 'Apr' });

const companyScreens = {
  id: 'company-screens', n: 5, title: 'Raise, research and emergency',
  today: 'These three Company dialogs share the Game Dev Tycoon trio, and in play they look empty: the team panel only says Calm or Uneasy, Research shows a single row, and the side panels repeat numbers from the HUD. The compute deal, power sites and board screens were approved earlier and are left alone.',
  rec: 'A',
  pairNote: 'Same option on the other two screens:',
  options: [
    { code: 'A', name: 'Filled trio', kind: 'safe', text: 'Keep the trio and give each part a job. Advisors speak a line each, as they do in the planner. Investor cards show what you give up. Research lists every technique by era with a points bar. The acquihire is split off below the other rescues.', draw: () => `${office(3)}${hud()}<div class="veil"></div>${teamPanel(raiseTeam, { x: 70, y: 175, w: 250 })}
      <section class="gp dlg" style="left:340px;top:130px;width:760px;padding:18px 26px 22px"><h1>Raise a round</h1><div class="subt">Era 3 \u00b7 choose your investor</div><div class="rule"></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${INVESTORS.map(([m, n, amt, share, chip, tone, line, back], i) => `<div class="card ${i === 0 ? 'sel' : ''}" style="padding:14px"><div class="row" style="gap:10px"><div class="mono">${m}</div><div style="font-size:15px;font-weight:900;line-height:1.2">${n}</div></div>
          <div style="font-size:34px;font-weight:900;margin-top:12px">${amt}</div><div class="muted" style="font-size:13px;font-weight:800">for ${share} of your lab</div>
          <div style="height:12px"></div>
          <span class="cchip ${tone}">${chip}</span><div style="font-size:12.5px;font-weight:700;margin-top:8px;line-height:1.4">${line}</div></div>`).join('')}</div>
        <div class="row" style="justify-content:space-between;margin-top:18px"><span class="muted" style="font-size:12.5px;font-weight:800">Uses 1 of your 2 team actions this month</span><span class="btn">Raise</span></div></section>
      ${stats([['Cash now', '$738M'], ['Raise', '$1.3B'], ['Cash after', '$2.0B'], ['Share sold', '5%']], { x: 70, y: 175, w: 230, title: 'This round' })}${draft()}`,
    extra: [
      () => `${office(3)}${hud()}<div class="veil"></div>${teamPanel([['Head of Research', 'Calm', 'Low precision halves our serving bill. Give me the points.'], ['Head of Safety', 'Uneasy', 'Cheaper to serve means more users sooner.'], ['CFO', 'Calm', ''], ['Policy and Comms', 'Calm', '']], { x: 70, y: 175, w: 250 })}
        <section class="gp dlg" style="left:340px;top:130px;width:760px;padding:18px 26px 22px"><h1>Research a technique early</h1><div class="subt">Era 3 \u00b7 16 research points</div><div class="rule"></div>
          ${[2, 3, 4].map((era) => `<div style="text-align:left;margin-top:8px"><div class="k-lab">Era ${era}</div>${TECH.filter((t) => t[1] === era).map(([n, , cost, st]) => `<div class="row" style="gap:12px;padding:9px 12px;margin-top:6px;border-radius:10px;background:var(--paper);${st === 'early' ? 'border:2px solid var(--teal)' : 'opacity:.6'}"><div style="flex:1;font-size:15px;font-weight:900">${n}</div>
            ${st === 'yours' ? '<span class="cchip teal">Everyone has it</span>' : `<div style="width:220px"><div class="slider" style="height:10px"><i style="width:${16 / 30 * 100}%;background:var(--teal)"></i></div><div class="muted" style="font-size:11.5px;font-weight:800;margin-top:4px">16 of ${cost} points \u00b7 everyone gets it in era 4</div></div>`}</div>`).join('')}</div>`).join('')}
          <div class="row" style="justify-content:space-between;margin-top:16px"><span class="muted" style="font-size:12.5px;font-weight:800">Needs 14 more points</span><span class="btn off">Research</span></div></section>${draft()}`,
      () => `${office(4)}${hudDanger()}<div class="veil"></div>${teamPanel(emTeam, { x: 70, y: 175, w: 250 })}
        <section class="gp dlg" style="left:340px;top:130px;width:760px;padding:18px 26px 22px"><h1>Emergency options</h1><div class="subt">Runway is short \u00b7 choose a last resort</div><div class="rule"></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${EMER.slice(0, 3).map(([m, n, t], i) => `<div class="card ${i === 0 ? 'sel' : ''}" style="padding:14px"><div class="row" style="gap:10px"><div class="mono">${m}</div><div style="font-size:15px;font-weight:900">${n}</div></div><div style="font-size:13px;font-weight:700;margin-top:10px;line-height:1.4">${t}</div></div>`).join('')}</div>
          <div class="card danger" style="padding:12px 14px;margin-top:14px;display:flex;gap:12px;align-items:center"><div class="mono" style="background:var(--coral)">A</div><div style="flex:1"><div style="font-size:15px;font-weight:900">Accept an acquihire</div><div style="font-size:12.5px;font-weight:700">${EMER[3][2]}</div></div><span class="cchip coral">Ends the run</span></div>
          <div class="row" style="justify-content:space-between;margin-top:16px"><span class="muted" style="font-size:12.5px;font-weight:800">Uses 1 of your 2 team actions this quarter</span><span class="btn">Use option</span></div></section>
        ${stats([['Cash now', '$28M'], ['Runway', 'under a month'], ['Options used', '0 of 4']], { x: 70, y: 175, w: 230, title: 'Right now' })}${draft()}`,
    ] },
    { code: 'B', name: 'One wide panel', kind: 'mid', text: 'Drop the side panels. One wide panel holds big choices, each advisor\u2019s view becomes a small "backs this" chip on the card it concerns, and a before-and-after strip sits over the button. Faster to read, less like a form.', draw: () => `${office(3)}${hud()}<div class="veil strong"></div>
      <section class="gp dlg" style="left:190px;top:130px;width:1060px;padding:20px 30px 22px"><h1>Raise a round</h1><div class="subt">Era 3 \u00b7 choose your investor</div><div class="rule"></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${INVESTORS.map(([m, n, amt, share, chip, tone, line, back], i) => `<div class="card ${i === 0 ? 'sel' : ''}" style="padding:18px 18px 16px"><div class="k-lab">${n}</div>
          <div style="font-size:46px;font-weight:900;margin-top:6px;line-height:1">${amt}</div><div class="muted" style="font-size:14px;font-weight:800;margin-top:4px">for ${share} of ${LAB}</div>
          <div class="row" style="gap:6px;margin-top:14px;flex-wrap:wrap"><span class="cchip ${tone}">${chip}</span><span class="cchip ${back.includes('warns') ? 'coral' : 'teal'}">${back}</span></div>
          <div style="font-size:13px;font-weight:700;margin-top:10px;line-height:1.4">${line}</div></div>`).join('')}</div>
        <div class="row" style="gap:24px;margin-top:20px;padding:12px 18px;border-radius:12px;background:var(--paper);font-size:16px;font-weight:800;text-align:left">
          <span>Cash <b style="font-weight:900">$738M \u2192 $2.0B</b></span><span>You sell <b style="font-weight:900">5%</b></span><span class="muted" style="font-size:13px">Uses 1 of 2 team actions</span><div style="flex:1"></div><span class="back">Cancel</span><span class="btn">Raise</span></div></section>${draft()}`,
    extra: [
      () => `${office(3)}${hud()}<div class="veil strong"></div><section class="gp dlg" style="left:190px;top:130px;width:1060px;padding:20px 30px 24px"><h1>Research a technique early</h1><div class="subt">Era 3 \u00b7 16 research points</div><div class="rule"></div>
        <div style="position:relative;height:250px;text-align:left">
          <div style="position:absolute;left:20px;right:20px;top:110px;height:6px;border-radius:3px;background:color-mix(in oklab, var(--wood) 35%, var(--paper))"></div>
          ${[2, 3, 4].map((era, k) => `<div class="k-lab" style="position:absolute;top:0;left:${[20, 380, 690][k]}px">Era ${era}${era === 4 ? ' \u00b7 not yet' : ''}</div>`).join('')}
          ${TECH.map(([n, era, cost, st], i) => { const [x, up] = [[20, true], [110, false], [200, true], [380, true], [470, false], [690, false]][i]; return `<div style="position:absolute;left:${x}px;top:${up ? 30 : 128}px;width:${st === 'early' ? 290 : 150}px"><div class="card ${st === 'early' ? 'sel' : ''}" style="padding:9px 11px;${st === 'yours' ? 'opacity:.7' : ''}"><div style="font-size:13.5px;font-weight:900;line-height:1.2">${n}</div>${st === 'yours' ? '<div class="cchip teal" style="margin-top:6px">Everyone has it</div>' : `<div class="slider" style="height:9px;margin-top:8px"><i style="width:53%;background:var(--teal)"></i></div><div class="muted" style="font-size:11.5px;font-weight:800;margin-top:4px">16 of ${cost} points \u00b7 Research backs this</div>`}</div></div>`; }).join('')}
        </div>
        <div class="row" style="gap:24px;padding:12px 18px;border-radius:12px;background:var(--paper);font-size:16px;font-weight:800;text-align:left"><span>Needs <b>14 more points</b></span><div style="flex:1"></div><span class="back">Cancel</span><span class="btn off">Research</span></div></section>`,
      () => `${office(4)}${hudDanger()}<div class="veil strong"></div><section class="gp dlg" style="left:190px;top:130px;width:1060px;padding:20px 30px 24px"><h1>Emergency options</h1><div class="subt">Runway is short \u00b7 choose a last resort</div><div class="rule"></div>
        ${EMER.map(([m, n, t], i) => `<div class="card ${i === 0 ? 'sel' : ''} ${i === 3 ? 'danger' : ''}" style="display:flex;gap:14px;align-items:center;padding:12px 16px;margin-top:${i === 3 ? 22 : 8}px"><div class="mono" ${i === 3 ? 'style="background:var(--coral)"' : ''}>${m}</div><div style="flex:1"><div style="font-size:16px;font-weight:900">${n}</div><div style="font-size:13px;font-weight:700">${t}</div></div>${i === 3 ? '<span class="cchip coral">Ends the run</span>' : i === 0 ? '<span class="cchip teal">CFO backs this</span>' : ''}</div>`).join('')}
        <div class="row" style="gap:24px;margin-top:18px;padding:12px 18px;border-radius:12px;background:var(--paper);font-size:16px;font-weight:800;text-align:left"><span>Cash <b>$28M</b></span><span>Runway <b>under a month</b></span><div style="flex:1"></div><span class="btn">Use option</span></div></section>`,
    ] },
    { code: 'C', name: 'Paperwork', kind: 'exp', text: 'Each decision is the real document it would be, laid on the dimmed office: three term sheets fanned out with a signature line, a memo from Priya asking for the research points, and a red folder of last resorts with the acquihire letter on top.', draw: () => `${office(3)}${hud()}<div class="veil dim"></div>
      ${INVESTORS.map(([m, n, amt, share, chip, tone, line], i) => `<article style="position:absolute;left:${120 + i * 410}px;top:${170 + [0, 30, 10][i]}px;width:380px;height:470px;padding:30px 32px;background:var(--paper);border-radius:4px;transform:rotate(${[-3, 1.5, 3.5][i]}deg);box-shadow:0 20px 44px color-mix(in oklab, var(--ink) 35%, transparent);z-index:${i === 0 ? 3 : 2 - i}">
        <div class="row" style="gap:10px;border-bottom:3px solid var(--${tone});padding-bottom:12px"><div class="mono" style="background:var(--${tone})">${m}</div><div style="font-size:15px;font-weight:900">${n}</div></div>
        <div class="serif" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin-top:22px" >Term sheet</div>
        <div class="serif" style="font-size:40px;margin-top:10px">${amt}</div>
        <div class="serif" style="font-size:15px;margin-top:6px;line-height:1.6">for ${share} of ${LAB}, to be paid in one sum at signing.</div>
        <div class="serif" style="font-size:14px;margin-top:16px;line-height:1.7;font-style:italic">${line}</div>
        <div style="position:absolute;left:32px;right:32px;bottom:40px"><div style="border-top:1.5px solid var(--ink);padding-top:6px;font-size:12px;font-weight:800">For ${LAB} \u00b7 you</div>${i === 0 ? '<div class="btn" style="position:absolute;right:0;top:-54px;width:130px">Sign</div>' : ''}</div></article>`).join('')}
      ${draft('Investor details are the game\u2019s real offers; the document wording is draft copy')}`,
    extra: [
      () => `${office(3)}${hud()}<div class="veil dim"></div><article style="position:absolute;left:420px;top:150px;width:600px;height:560px;padding:40px 48px;background:var(--paper);border-radius:4px;transform:rotate(-1.5deg);box-shadow:0 20px 44px color-mix(in oklab, var(--ink) 35%, transparent)">
        <div class="serif" style="font-size:13px;letter-spacing:.2em;text-transform:uppercase">Memo</div>
        <div style="margin-top:14px;font-size:14px;font-weight:700;line-height:1.8"><b>From</b> Priya Raman, Head of Research<br><b>To</b> You<br><b>About</b> Starting Low-precision serving early</div>
        <div style="height:2px;background:var(--ink);margin:18px 0"></div>
        <p class="serif" style="font-size:17px;line-height:1.7;margin:0">Everyone gets low-precision serving in era 4. If we start now we get it first, and our serving bill drops before theirs.</p>
        <p class="serif" style="font-size:17px;line-height:1.7">It costs 30 research points. We have 16.</p>
        <div class="slider" style="height:14px;margin-top:22px"><i style="width:53%;background:var(--teal)"></i></div><div class="muted" style="font-size:13px;font-weight:800;margin-top:6px">16 of 30 points</div>
        <div class="row" style="position:absolute;left:48px;right:48px;bottom:44px;justify-content:space-between"><span class="back">Not now</span><span class="btn off">Approve</span></div></article>${draft()}`,
      () => `${office(4)}${hudDanger()}<div class="veil dim"></div><div style="position:absolute;left:300px;top:150px;width:840px;height:640px;border-radius:10px;background:color-mix(in oklab, var(--coral) 75%, var(--ink));box-shadow:0 22px 50px color-mix(in oklab, var(--ink) 40%, transparent)"></div>
        <div style="position:absolute;left:320px;top:110px;padding:6px 16px;border-radius:8px 8px 0 0;background:color-mix(in oklab, var(--coral) 75%, var(--ink));color:var(--paper);font-weight:900;letter-spacing:.1em;font-size:13px">LAST RESORTS \u00b7 0 OF 4 USED</div>
        ${EMER.slice(0, 3).map(([m, n, t], i) => `<div style="position:absolute;left:${340 + i * 262}px;top:${190 + [0, 14, 4][i]}px;width:240px;height:170px;padding:18px;background:var(--paper);border-radius:4px;transform:rotate(${[-3, 1, -1][i]}deg);box-shadow:0 6px 16px color-mix(in oklab, var(--ink) 25%, transparent)"><div style="font-size:16px;font-weight:900">${n}</div><div class="serif" style="font-size:13px;margin-top:8px;line-height:1.5">${t}</div></div>`).join('')}
        <article style="position:absolute;left:470px;top:420px;width:500px;height:290px;padding:26px 30px;background:var(--paper);border-radius:4px;transform:rotate(1.5deg);box-shadow:0 14px 30px color-mix(in oklab, var(--ink) 35%, transparent)"><div class="serif" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">A letter</div><div class="serif" style="font-size:24px;margin-top:10px">We would like to acquire your team.</div><p class="serif" style="font-size:14px;line-height:1.6">We license your models and hire your people. You would no longer run ${LAB}.</p><div class="row" style="justify-content:space-between;margin-top:18px"><span class="cchip coral">Ends the run</span><span class="btn" style="width:170px">Accept</span></div></article>${draft()}`,
    ] },
  ],
};

// ================= 6. Sound and music, credits =================
const CREDITS = `<div class="k-lab" style="margin-top:4px">Music</div>
  <p style="margin:6px 0 0;font-size:13.5px;font-weight:700;line-height:1.5">\u201cWallpaper\u201d and \u201cBossa Antigua\u201d by Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/</p>
  <p style="margin:8px 0 0;font-size:13.5px;font-weight:700;line-height:1.5">\u201cCity of Tomorrow\u201d, \u201cCorporate Ladder\u201d, \u201cNetwork\u201d, \u201cTechnoscape\u201d and \u201cFuture Business\u201d by Eric Matyas, www.soundimage.org</p>
  <div class="k-lab" style="margin-top:16px">Sound effects</div><p style="margin:6px 0 0;font-size:13.5px;font-weight:700">Made in the browser as the game runs.</p>
  <div class="k-lab" style="margin-top:16px">Type</div><p style="margin:6px 0 0;font-size:13.5px;font-weight:700">Nunito and Libre Baskerville, SIL Open Font License.</p>
  <div class="k-lab" style="margin-top:16px">Made by</div><p style="margin:6px 0 0;font-size:13.5px;font-weight:800;padding:4px 8px;border-radius:6px;background:color-mix(in oklab, var(--ink) 8%, var(--paper));display:inline-block" class="muted">Names to fill in</p>`;
const soundRow = (label, on, pct) => `<div class="row" style="gap:16px;padding:12px 0;border-top:1px solid color-mix(in oklab, var(--wood) 22%, transparent)"><div style="width:130px;font-size:16px;font-weight:900;text-align:left">${label}</div><span class="sw ${on ? 'on' : ''}"></span><div class="slider" style="flex:1"><i style="width:${pct}%"></i><b style="left:${pct}%"></b></div><div style="width:44px;font-weight:900;text-align:right">${pct}%</div></div>`;
const soundSec = {
  id: 'sound', n: 6, title: 'Sound, music and credits',
  today: 'Not built yet. Settled with you: music and effects each get on/off and volume, a mute button sits in the HUD next to the speeds, and the credits live inside the game, as soundimage.org requires. The eight tracks shuffle at a low volume.',
  rec: 'A',
  pairNote: 'The HUD mute button, and the credits in this option:',
  options: [
    { code: 'A', name: 'One dialog, two tabs', kind: 'safe', text: 'Company \u203a Sound and music opens a small Game Dev Tycoon panel with two tabs. Sound has the two switches and sliders and what is playing; Credits has the licence lines. The speaker in the clock chip mutes everything in one click.', draw: () => `${office(3)}${hud({ speaker: true })}<div class="veil"></div>
      <section class="gp dlg" style="left:420px;top:150px;width:600px;padding:20px 30px 22px"><h1>Sound and music</h1><div class="row" style="justify-content:center;gap:4px;margin-top:12px"><span class="tab on">Sound</span><span class="tab">Credits</span></div>
        <div style="margin-top:10px">${soundRow('Music', true, 35)}${soundRow('Sound effects', true, 70)}</div>
        <div class="row" style="gap:12px;margin-top:8px;padding:12px 14px;border-radius:10px;background:var(--paper);text-align:left"><div style="flex:1"><div class="k-lab">Now playing</div><div style="font-size:15px;font-weight:900;margin-top:2px">Bossa Antigua</div><div class="muted" style="font-size:12.5px;font-weight:700">Kevin MacLeod \u00b7 CC BY 4.0</div></div><span class="back">Next track \u203a</span></div>
        <div class="muted" style="font-size:12px;font-weight:700;margin-top:10px">Eight tracks shuffle. Music dips under release shows and stops during ending films.</div>
        <div class="btn" style="margin-top:16px">Done</div></section>
      <div class="callout up" style="left:1210px;top:140px;max-width:210px">Mute button \u00b7 one click, all sound</div>` ,
    extra: [
      () => `${office(3)}${hud({ speaker: 'muted' })}<div class="callout up" style="left:1250px;top:140px;max-width:180px">Muted: the icon shows it</div>`,
      () => `${office(3)}${hud({ speaker: true })}<div class="veil"></div><section class="gp dlg" style="left:420px;top:120px;width:600px;padding:20px 30px 22px;text-align:left"><h1 style="text-align:center">Sound and music</h1><div class="row" style="justify-content:center;gap:4px;margin:12px 0 8px"><span class="tab">Sound</span><span class="tab on">Credits</span></div>${CREDITS}<div style="text-align:center"><div class="btn" style="margin-top:18px">Done</div></div></section>`,
    ] },
    { code: 'B', name: 'From the speaker', kind: 'mid', text: 'Everything hangs off the speaker in the clock chip: one click mutes, a click on the small arrow opens a popover with both sliders and the track. Credits is its own Company item and plays like film credits, rolling up over the dimmed office.', draw: () => `${office(3)}${hud({ speaker: true, extra: '<span class="cb" style="min-width:14px;padding:0 2px">\u25be</span>' })}
      <div class="ctx" style="left:1110px;top:136px;width:315px;padding:12px 14px">
        <div class="row" style="justify-content:space-between"><b style="font-size:14px">Sound</b><span class="back" style="font-size:12.5px">Credits \u203a</span></div>
        ${[['Music', 35], ['Effects', 70]].map(([l, p]) => `<div class="row" style="gap:10px;margin-top:12px"><span style="width:52px;font-size:13px;font-weight:800">${l}</span><span class="sw on"></span><div class="slider" style="flex:1"><i style="width:${p}%"></i><b style="left:${p}%"></b></div></div>`).join('')}
        <div style="margin-top:12px;padding-top:9px;border-top:1px solid color-mix(in oklab, var(--ink) 10%, transparent);font-size:12.5px;font-weight:700"><span class="muted">Playing</span> <b>Bossa Antigua</b> \u00b7 Kevin MacLeod</div></div>`,
    extra: [
      () => `${office(3)}${hud({ speaker: 'muted' })}<div class="callout up" style="left:1250px;top:140px;max-width:180px">One click on the speaker mutes</div>`,
      () => `${office(3)}<div style="position:absolute;inset:0;background:color-mix(in oklab, var(--ink) 82%, transparent)"></div><div style="position:absolute;left:420px;top:60px;width:600px;text-align:center;color:var(--paper)">
        <div style="font-size:48px;font-weight:300">AI Lab</div><div style="font-size:14px;font-weight:800;letter-spacing:.1em;margin-top:30px;opacity:.7">MUSIC</div>
        <div style="font-size:18px;font-weight:800;margin-top:12px;line-height:1.6">Wallpaper \u00b7 Bossa Antigua<br><span style="font-size:14px;opacity:.8">Kevin MacLeod (incompetech.com)<br>Creative Commons: By Attribution 4.0<br>creativecommons.org/licenses/by/4.0/</span></div>
        <div style="font-size:18px;font-weight:800;margin-top:22px;line-height:1.6">City of Tomorrow \u00b7 Corporate Ladder \u00b7 Network<br>Technoscape \u00b7 Future Business<br><span style="font-size:14px;opacity:.8">by Eric Matyas, www.soundimage.org</span></div>
        <div style="font-size:14px;font-weight:800;letter-spacing:.1em;margin-top:30px;opacity:.7">TYPE</div><div style="font-size:16px;font-weight:800;margin-top:8px">Nunito \u00b7 Libre Baskerville</div>
        <div style="font-size:14px;font-weight:800;letter-spacing:.1em;margin-top:30px;opacity:.7">MADE BY</div><div style="font-size:16px;font-weight:800;margin-top:8px;opacity:.6">names to fill in</div></div>`,
    ] },
    { code: 'C', name: 'The office radio', kind: 'exp', text: 'A small radio in the office plays the music. A tag above it always names the track and its artist, so the credit is on screen whenever music plays. Click the radio to open its face: two knobs, the track list, and the licence lines.', draw: () => {
      const rx = 560; const ry = 610;
      return `${office(3)}${hud({ speaker: true })}
      <svg style="position:absolute;left:0;top:0" width="1440" height="900" viewBox="0 0 1440 900">
        <ellipse cx="${rx}" cy="${ry + 18}" rx="34" ry="9" style="fill:color-mix(in oklab, var(--ink) 22%, transparent)"/>
        <path d="M${rx - 32} ${ry - 16} l32 -12 l32 12 v26 l-32 12 l-32 -12 z" style="fill:var(--coral);stroke:color-mix(in oklab, var(--coral) 60%, var(--ink));stroke-width:2"/>
        <path d="M${rx - 32} ${ry - 16} l32 12 l32 -12" style="fill:none;stroke:color-mix(in oklab, var(--coral) 60%, var(--ink));stroke-width:2"/>
        <circle cx="${rx - 14}" cy="${ry + 6}" r="7" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5"/><rect x="${rx + 4}" y="${ry - 2}" width="20" height="10" rx="2" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5" transform="skewY(-20) translate(0 ${(rx + 14) * 0.364})"/>
        <path d="M${rx + 20} ${ry - 26} l10 -26" style="stroke:var(--ink);stroke-width:2;stroke-linecap:round"/>
      </svg>
      <div class="say" style="left:${rx - 130}px;top:${ry - 118}px;width:260px;--tx:118px;text-align:center;padding:7px 12px"><b style="text-align:center">Now playing</b>Bossa Antigua \u00b7 Kevin MacLeod</div>
      <section class="gp" style="left:40px;top:650px;width:520px;padding:18px 20px;border-color:color-mix(in oklab, var(--coral) 70%, var(--ink));background:var(--paper)">
        <div class="row" style="gap:26px">${[['Music', 35], ['Effects', 70]].map(([l, p]) => `<div style="text-align:center"><svg width="86" height="86" viewBox="0 0 86 86"><circle cx="43" cy="43" r="36" style="fill:color-mix(in oklab, var(--cream) 50%, var(--paper));stroke:var(--wood);stroke-width:4"/><line x1="43" y1="43" x2="${43 + 28 * Math.cos((135 + p * 2.7) * Math.PI / 180)}" y2="${43 + 28 * Math.sin((135 + p * 2.7) * Math.PI / 180)}" style="stroke:var(--ink);stroke-width:5;stroke-linecap:round"/></svg><div style="font-size:13px;font-weight:900">${l} \u00b7 ${p}%</div></div>`).join('')}
          <div style="flex:1;font-size:13px;font-weight:800;line-height:1.7">${['Wallpaper', 'Bossa Antigua', 'City of Tomorrow', 'Corporate Ladder', 'Network', 'Technoscape', 'Future Business'].map((t) => `<div style="${t === 'Bossa Antigua' ? 'color:var(--coral)' : ''}">${t === 'Bossa Antigua' ? '\u25b8 ' : ''}${t}</div>`).join('')}</div></div>
        <div class="muted" style="margin-top:12px;font-size:11.5px;font-weight:700;line-height:1.5">Kevin MacLeod (incompetech.com), CC BY 4.0 \u00b7 Eric Matyas, www.soundimage.org</div>
      </section>`;
    } },
  ],
};

// ================= 7. Endings found =================
const endCard = (id) => {
  const [, kind, title, , hint] = byId[id]; const f = FOUND[id];
  return `<div class="card" style="padding:9px;${f ? '' : 'background:color-mix(in oklab, var(--cream) 40%, var(--paper))'}">${f ? still(id) : '<div class="locked">?</div>'}
    <div style="margin-top:8px;font-size:14.5px;font-weight:900;line-height:1.2">${f ? title : 'Not found yet'}</div>
    <div class="row" style="gap:6px;margin-top:5px"><span class="cchip ${kind === 'win' ? 'teal' : 'coral'}">${kind === 'win' ? 'A win' : 'A failure'}</span></div>
    <div style="font-size:12px;font-weight:700;margin-top:6px;line-height:1.35" class="muted">${f ? foundMeta(id) : hint}</div></div>`;
};
const endingsSec = {
  id: 'endings', n: 7, title: 'Endings found',
  today: 'The game already remembers which endings you reached (it counts them on this browser) and shows the count on the end screen, but there is no screen to look through them. Shown here with an example collection: 3 of 11 found.',
  rec: 'A',
  options: [
    { code: 'A', name: 'Collection grid', kind: 'safe', text: 'A Game Dev Tycoon panel with all eleven as cards: a still from the film, the title, how often and where you first found it. Endings not found yet show a dark card and a one-line hint. A found card opens its film again.', draw: () => `${office(3)}${hud()}<div class="veil strong"></div>
      <section class="gp dlg" style="left:120px;top:110px;width:1200px;padding:18px 28px 20px;text-align:left">
        <div class="row" style="gap:16px;align-items:flex-end"><div><h1>Endings found</h1><div class="subt">3 of 11 \u00b7 1 win and 2 failures</div></div><div style="flex:1"></div><span class="tab on">All 11</span><span class="tab">Wins 4</span><span class="tab">Failures 7</span></div>
        <div style="height:8px;border-radius:4px;margin:12px 0 14px;background:color-mix(in oklab, var(--ink) 10%, var(--paper));overflow:hidden"><i style="display:block;height:100%;width:${3 / 11 * 100}%;background:var(--teal)"></i></div>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px">${ENDINGS.map(([id]) => endCard(id)).join('')}<div style="display:grid;place-items:center;text-align:center;border-radius:12px;border:2px dashed color-mix(in oklab, var(--wood) 40%, transparent);padding:12px;font-size:14px;font-weight:800" class="muted">8 still to find<br>3 wins, 5 failures</div></div>
        <div class="row" style="justify-content:flex-end;margin-top:14px"><span class="btn">Close</span></div></section>${draft('Hints are draft copy \u00b7 the collection is an example')}` },
    { code: 'B', name: 'Early or at the finish', kind: 'mid', text: 'The same eleven, sorted by when they can happen: seven that can cut a run short, and four that only come at the end of era 5. It teaches the shape of the game: survive first, then choose how you finish.', draw: () => {
      const row = (id) => { const [, kind, title, , hint] = byId[id]; const f = FOUND[id]; return `<div class="row" style="gap:12px;padding:7px 0;border-top:1px solid color-mix(in oklab, var(--wood) 20%, transparent)"><div style="width:112px;flex:none">${f ? still(id) : '<div class="locked" style="font-size:20px">?</div>'}</div><div style="flex:1"><div style="font-size:15px;font-weight:900">${f ? title : 'Not found yet'}</div><div class="muted" style="font-size:12px;font-weight:700;margin-top:2px">${f ? foundMeta(id) : hint}</div></div><span class="cchip ${kind === 'win' ? 'teal' : 'coral'}">${kind === 'win' ? 'Win' : 'Failure'}</span></div>`; };
      return `${office(5)}${hud({ era: 5 })}<div class="veil strong"></div>
      <section class="gp dlg" style="left:120px;top:90px;width:1200px;padding:18px 28px 22px;text-align:left">
        <div class="row" style="gap:16px"><div><h1>Endings found</h1><div class="subt">3 of 11</div></div><div style="flex:1"></div>
          <div class="row" style="gap:4px">${ENDINGS.map(([id]) => `<i style="display:block;width:22px;height:10px;border-radius:3px;background:${FOUND[id] ? 'var(--teal)' : 'color-mix(in oklab, var(--ink) 12%, var(--paper))'}"></i>`).join('')}</div></div>
        <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:30px;margin-top:14px">
          <div><div class="k-lab">Can end the run early \u00b7 7</div>${EARLY.map(row).join('')}</div>
          <div><div class="k-lab">At the end of era 5 \u00b7 4</div>${FINISH.map(row).join('')}
            <div style="margin-top:18px;padding:12px 14px;border-radius:10px;background:var(--paper);font-size:13px;font-weight:700;line-height:1.45">Every finished run lands on one of these four. Which one depends on where you rank, how much you cut corners, and whether a deal to slow down holds.</div></div>
        </div></section>${draft('Hints are draft copy \u00b7 the collection is an example')}`;
    } },
    { code: 'C', name: 'The Daily Token archive', kind: 'exp', text: 'The end screen already reports your run in a newspaper, The Daily Token. The collection is its archive: eleven front pages on the desk. Found endings are printed with the headline and a photo from the film; the rest are blank pages that say the story is still unwritten.', draw: () => {
      const page = (id, i) => { const [, kind, title, deck, hint] = byId[id]; const f = FOUND[id]; const rot = [-2, 1.2, -0.8, 2, -1.5, 0.6][i % 6];
        return `<article style="position:relative;padding:10px 12px 12px;background:var(--paper);border-radius:3px;transform:rotate(${rot}deg);box-shadow:0 8px 18px color-mix(in oklab, var(--ink) 30%, transparent);${f ? '' : 'opacity:.9'}">
          <div class="serif" style="text-align:center;font-weight:700;font-size:15px;border-bottom:2px solid var(--ink);padding-bottom:4px">The Daily Token</div>
          <div class="row" style="justify-content:space-between;font-size:9.5px;font-weight:800;margin-top:3px" ><span>${f ? FOUND[id].date : 'Not yet printed'}</span><span>${f ? `era ${FOUND[id].era}` : ''}</span></div>
          ${f ? `<div class="serif" style="font-size:17px;font-weight:700;line-height:1.15;margin-top:6px">${title}</div><img src="stills/${id}.jpg" alt="" style="display:block;width:100%;aspect-ratio:4/3;object-fit:cover;margin-top:6px;filter:grayscale(.3)"><div class="serif" style="font-size:10.5px;line-height:1.4;margin-top:6px;font-style:italic">${deck}</div>`
    : `<div style="height:150px;margin-top:10px;display:grid;place-items:center;text-align:center;border:1.5px dashed color-mix(in oklab, var(--ink) 25%, transparent)"><div class="serif" style="font-style:italic;font-size:13px;color:var(--muted)">This story is<br>still unwritten</div></div><div style="font-size:10.5px;font-weight:800;margin-top:8px;line-height:1.35" class="muted">${hint}</div>`}</article>`; };
      return `<div style="position:absolute;inset:0;background:color-mix(in oklab, var(--wood) 55%, var(--ink))"></div>
        <div style="position:absolute;left:40px;top:28px;color:var(--paper)"><div class="serif" style="font-size:42px;font-weight:700">The Daily Token \u00b7 archive</div><div style="font-size:16px;font-weight:800;opacity:.85;margin-top:4px">3 of 11 front pages printed \u00b7 click one to watch its ending again</div></div>
        <div style="position:absolute;left:40px;right:40px;top:136px;display:grid;grid-template-columns:repeat(6,1fr);gap:30px 18px">${ENDINGS.map(([id], i) => page(id, i)).join('')}<div style="display:grid;place-items:center;text-align:center;border:2px dashed color-mix(in oklab, var(--paper) 35%, transparent);border-radius:4px;color:var(--paper);font-size:15px;font-weight:800;padding:12px">8 front pages<br>still to print</div></div>
        <div style="position:absolute;right:40px;top:40px" class="btn">Close</div>${draft('Hints and front-page dates are draft copy \u00b7 the collection is an example')}`;
    } },
  ],
};

const SECTIONS = [intro, menuSec, companySec, financeSec, companyScreens, soundSec, endingsSec];
// Owner picks, 2026-09-26.
const OWNER = { intro: 'C', menu: 'A', company: 'B', finance: 'B', 'company-screens': 'C', sound: 'A', endings: 'C' };

// ---------- page ----------
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* the page works without storage */ } } };
const picks = store.get('gn-menus-picks') ?? {};
const KIND = { safe: ['safe', 'Safe'], mid: ['mid', 'Middle'], exp: ['exp', 'Experimental'] };

function fit(frame) {
  const stage = frame.querySelector('.stage');
  const w = frame.clientWidth;
  if (w > 0) stage.style.transform = `scale(${w / 1440})`;
}
const ro = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));
const frame = (html, cls = '') => { const f = document.createElement('div'); f.className = `frame ${cls}`; f.innerHTML = `<div class="stage">${html}</div>`; ro.observe(f); return f; };

function renderPicks() {
  const list = SECTIONS.flatMap((s) => (picks[s.id] ?? []).map((c) => `${s.n}${c}`));
  document.querySelector('#picked').textContent = list.length ? `Your picks: ${list.join(' ')}` : 'No picks yet. Press Pick under an option.';
}

const nav = document.querySelector('#nav');
const root = document.querySelector('#sections');
for (const s of SECTIONS) {
  nav.insertAdjacentHTML('beforeend', `<a href="#${s.id}"><b>${s.n}</b>${s.title}</a>`);
  const sec = document.createElement('section');
  sec.className = 'sec'; sec.id = s.id;
  sec.innerHTML = `<div class="sec-head"><h2><b>${s.n}</b>${s.title}</h2><p>${s.today}</p></div><div class="opts"></div><div class="view"></div>`;
  root.append(sec);
  const opts = sec.querySelector('.opts');
  const view = sec.querySelector('.view');
  let active = OWNER[s.id] ?? s.rec;
  const show = () => {
    const o = s.options.find((x) => x.code === active);
    view.replaceChildren(frame(o.draw()));
    if (o.extra) {
      const note = document.createElement('p'); note.className = 'note'; note.style.marginTop = '10px'; note.innerHTML = `<b>${s.pairNote ?? 'Also:'}</b>`;
      const pair = document.createElement('div'); pair.className = 'pair'; pair.style.marginTop = '6px';
      o.extra.forEach((fn) => { const fig = document.createElement('figure'); fig.append(frame(fn(), 'small')); pair.append(fig); });
      view.append(note, pair);
    }
    opts.querySelectorAll('.opt').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.code === active)));
  };
  for (const o of s.options) {
    const [cls, word] = KIND[o.kind];
    const b = document.createElement('div');
    b.className = 'opt'; b.dataset.code = o.code; b.tabIndex = 0; b.setAttribute('role', 'button');
    b.innerHTML = `<div class="opt-top"><span class="code">${s.n}${o.code}</span><b>${o.name}</b><span class="chip ${cls}">${word}</span>${OWNER[s.id] === o.code ? '<span class="chip rec">Your pick</span>' : ''}${o.code === s.rec && OWNER[s.id] !== o.code ? '<span class="chip" style="border:1.5px solid var(--line);color:var(--muted)">My rec</span>' : ''}</div><p>${o.text}</p><button type="button" class="pick" aria-pressed="false">Pick</button>`;
    const pick = b.querySelector('.pick');
    const syncPick = () => { const on = (picks[s.id] ?? []).includes(o.code); pick.setAttribute('aria-pressed', String(on)); pick.textContent = on ? 'Picked' : 'Pick'; };
    pick.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = new Set(picks[s.id] ?? []);
      cur.has(o.code) ? cur.delete(o.code) : cur.add(o.code);
      picks[s.id] = [...cur].sort(); store.set('gn-menus-picks', picks); syncPick(); renderPicks();
    });
    b.addEventListener('click', () => { active = o.code; show(); });
    b.addEventListener('keydown', (e) => { if (e.target === b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); active = o.code; show(); } });
    syncPick();
    opts.append(b);
  }
  show();
}
renderPicks();
document.querySelector('#copy').addEventListener('click', async (e) => {
  const text = document.querySelector('#picked').textContent;
  try { await navigator.clipboard.writeText(text); e.target.textContent = 'Copied'; } catch { const r = document.createRange(); r.selectNodeContents(document.querySelector('#picked')); getSelection().removeAllRanges(); getSelection().addRange(r); e.target.textContent = 'Selected'; }
  setTimeout(() => { e.target.textContent = 'Copy picks'; }, 1600);
});
