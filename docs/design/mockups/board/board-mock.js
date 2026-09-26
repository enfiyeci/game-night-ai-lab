// Board mockup spread (2026-09-26). Draws one option, named by ?m=, over the real game (office, HUD, dialog styles).
// Numbers are real: the speed strategy, seed 7, going into era 3's last turn (trace.mjs speed 7, turn 11), where the
// board stands four to three before the era-3 vote; the vote at that turn's end also passes four to three.
import { dialog } from '../../../../ui/components/dialog.js';
import { LINE, MEMBERS, backs, YES, band, moodOf, LOOK, portrait, OUT, EST, lean, READ, rangeBar, MOVES, QUOTES } from './board-data.js';

const m = new URLSearchParams(location.search).get('m') ?? '1A';

// ---- helpers ---------------------------------------------------------------------------------------------------
function el(tag, cls = '', html = '') {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html) node.innerHTML = html;
  return node;
}
const delta = (d) => (d > 0 ? `<span class="bm-delta up">▲ ${d}</span>` : d < 0 ? `<span class="bm-delta down">▼ ${-d}</span>` : '<span class="bm-delta flat">–</span>');
const bar = (s, { showNumber = false } = {}) => `<span class="bm-bar ${backs(s) ? 'yes' : 'no'}"><i style="width:${s}%"></i><b style="left:${LINE}%"></b></span>${showNumber ? `<span class="bm-num">${Math.round(s)}</span>` : ''}`;
const chip = (s) => { const b = band(s); return `<span class="bm-chip ${b.cls}">${b.word}</span>`; };
const seatTokens = (list = MEMBERS, key = 's') => `<span class="bm-seats">${[...list].sort((a, b) => backs(b[key]) - backs(a[key])).map((x) => `<i class="${backs(x[key]) ? 'yes' : 'no'}" title="${x.name}"></i>`).join('')}</span>`;

function mountDialog(opts, extraClass = '') {
  const layer = dialog(opts);
  if (extraClass) layer.classList.add(extraClass);
  layer.classList.add('dialog-open');
  document.querySelector('#overlay').append(layer);
  return layer;
}

function teamOpinions(rows) {
  const root = el('div', 'budget-team');
  for (const [name, mood, text] of rows) {
    root.append(el('div', 'compute-opinion', `<div class="compute-opinion-heading"><span>${name}</span><span class="compute-mood ${mood}">${mood}</span></div><q>${text}</q>`));
  }
  return root;
}

function summaryRows(rows) {
  const root = el('div', 'budget-summary compute-budget-summary');
  for (const [k, v, cls = ''] of rows) root.append(el('div', 'budget-summary-row', `<span>${k}</span><b class="${cls}">${v}</b>`));
  return root;
}

// A board list row; `treat` picks how support reads (the "numbers or moods" choice).
function memberRow(x, treat = 'wordbar') {
  const right = {
    number: `${bar(x.s, { showNumber: true })}${delta(x.d)}`,
    word: `${chip(x.s)}`,
    wordbar: `${bar(x.s)}${chip(x.s)}${delta(x.d)}`,
  }[treat];
  return el('div', `bm-row treat-${treat}`, `${portrait(x.id, 40, moodOf(x.s))}
    <span class="bm-who"><b>${x.name}</b><small>${x.cares}</small></span>
    <span class="bm-right">${right}</span>`);
}

function boardList(treat = 'wordbar', { grouped = 'kind' } = {}) {
  const root = el('div', `bm-list treat-${treat}`);
  if (grouped === 'side') {
    for (const side of ['Backs you', 'Against you']) {
      const group = MEMBERS.filter((x) => band(x.s).side === side);
      root.append(el('div', 'bm-group', `<span>${side}</span><span>${group.length}</span>`));
      for (const x of group) root.append(memberRow(x, treat));
    }
    return root;
  }
  for (const [kind, label] of [['money', 'Money seats'], ['oversight', 'Oversight seats']]) {
    root.append(el('div', 'bm-group', `<span>${label}</span>${treat === 'number' ? `<span>support · votes for you at ${LINE}</span>` : ''}`));
    for (const x of MEMBERS.filter((y) => y.kind === kind)) root.append(memberRow(x, treat));
  }
  return root;
}

function tallyStrip() {
  return el('div', 'bm-tally', `${seatTokens()}<span><b>${YES} back you.</b> You need 4 of 7.</span>`);
}

function setHudTurn(turn = 11) {
  const bold = document.querySelectorAll('#hud .info .full b');
  if (bold[1]) bold[1].textContent = `${turn}`;
}

function dropMarker(role) {
  document.querySelector(`#fx .advisor-marker[aria-label^="${role}"]`)?.remove();
}

const TEAM_ON_BOARD = [
  ['CFO', 'calm', 'The three money seats would follow you off a cliff. Please don’t test that.'],
  ['Policy and Comms', 'uneasy', 'The security hawk likes us because Washington does. One bad hearing and it’s three to four.'],
  ['Head of Safety', 'alarmed', 'The safety chair is at the bottom of the table and she knows why. So do I.'],
  ['Head of Research', 'calm', 'Is the board the one with the good snacks?'],
];

// ---- 1: where the player looks at the board --------------------------------------------------------------------
function frame1A() {
  const body = el('div', 'bm-board-body');
  body.append(boardList('wordbar'), tallyStrip());
  setHudTurn();
  mountDialog({
    body,
    title: 'The board',
    subtitle: 'Era 3 · last turn · the board votes when this turn ends',
    left: { title: 'Team', content: teamOpinions(TEAM_ON_BOARD) },
    right: {
      title: 'Next vote',
      content: (() => {
        const box = summaryRows([
          ['When', 'End of this turn'],
          ['Needed to stay', '4 of 7'],
          ['Back you now', '4', 'kept'],
          ['Closest to switching', 'Security hawk'],
          ['Also close', 'Sovereign fund'],
          ['Promise to the board', 'None open'],
        ]);
        box.append(el('p', 'bm-side-note', 'Both are one point above the line. Two bad points and it’s three to four.'));
        return box;
      })(),
    },
    okLabel: 'Close',
  }, 'bm-board-dialog');
}

// 1B: the board on a video call, a faithful clone of a real call app under a parody name (the Flock rule).
function quorumTile(x, extra = '') {
  return `<div class="q-tile ${extra}">
    <div class="q-avatar">${portrait(x.id, 112, moodOf(x.s))}</div>
    <div class="q-name">${x.name}</div>
    <div class="q-mic ${x.muted ? 'off' : ''}">${x.muted ? micOff : micOn}</div>
  </div>`;
}
const micOn = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>';
const micOff = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 11h-1.7c0 .7-.2 1.4-.4 2l1.2 1.2c.6-.9.9-2 .9-3.2zm-4 .2V5a3 3 0 0 0-5.9-.6L15 10.2v1zM4.3 3 3 4.3l6 6V11a3 3 0 0 0 4.4 2.6l1.6 1.6a5 5 0 0 1-8-4.2H5a7 7 0 0 0 6 6.9V21h2v-3.1c.9-.1 1.8-.4 2.5-.9l4.2 4.2 1.3-1.3L4.3 3z"/></svg>';
const icon = {
  cam: '<svg viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
  cc: '<svg viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z"/></svg>',
  hand: '<svg viewBox="0 0 24 24"><path d="M21 7a1.5 1.5 0 0 0-3 0v5h-1V4a1.5 1.5 0 0 0-3 0v7h-1V2.5a1.5 1.5 0 0 0-3 0V11H9V5a1.5 1.5 0 0 0-3 0v10l-2.3-2.3a1.5 1.5 0 0 0-2.1 2.1L8 21a4 4 0 0 0 3 1.3h5a5 5 0 0 0 5-5V7z"/></svg>',
  smile: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 17.5A5.5 5.5 0 0 1 6.9 14h10.2a5.5 5.5 0 0 1-5.1 3.5z"/></svg>',
  present: '<svg viewBox="0 0 24 24"><path d="M20 3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h5v2H7v2h10v-2h-2v-2h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-8 3 4 4h-3v4h-2v-4H8l4-4z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  hang: '<svg viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.1.3-4.6.7v3.1c0 .4-.2.7-.6.9-1 .5-1.9 1.1-2.7 1.8-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3L.3 13.1a1 1 0 0 1 0-1.4C3.3 8.9 7.4 7.2 12 7.2s8.7 1.7 11.7 4.5a1 1 0 0 1 0 1.4l-2.4 2.4c-.2.2-.4.3-.7.3-.3 0-.5-.1-.7-.3-.8-.7-1.7-1.3-2.7-1.8a1 1 0 0 1-.6-.9V9.7C15.1 9.3 13.6 9 12 9z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/></svg>',
  people: '<svg viewBox="0 0 24 24"><path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0h-1c1.2.9 2 2 2 3.5V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>',
  shapes: '<svg viewBox="0 0 24 24"><path d="M11 3 6 12h10L11 3zm6 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 21h8v-8H3v8z"/></svg>',
};

function quorumShell({ side, toast = '' }) {
  const tiles = [...MEMBERS.map((x) => ({ ...x, muted: !['security', 'safety'].includes(x.id) })), { id: 'ceo', name: 'You', s: 70 }];
  const q = el('div', 'quorum');
  q.innerHTML = `
    <div class="q-main">
      <div class="q-grid">${tiles.map((x) => quorumTile(x, x.id === 'security' ? 'speaking' : x.id === 'ceo' ? 'self' : '')).join('')}</div>
      <div class="q-caption"><b>Security hawk</b> Washington is happy with you, so I’m happy with you. That is the whole of my position, and it can change by Thursday.</div>
      ${toast}
    </div>
    ${side}
    <div class="q-bar">
      <div class="q-meta"><span>11:04</span><span class="q-sep">|</span><span>Board check-in · era 3</span></div>
      <div class="q-controls">
        <span class="q-btn">${micOn.replace('width="16" height="16"', '')}</span><span class="q-btn">${icon.cam}</span>
        <span class="q-btn on">${icon.cc}</span><span class="q-btn">${icon.smile}</span><span class="q-btn">${icon.present}</span>
        <span class="q-btn">${icon.hand}</span><span class="q-btn">${icon.more}</span><span class="q-btn hang">${icon.hang}</span>
      </div>
      <div class="q-right"><span class="q-ico">${icon.info}</span><span class="q-ico">${icon.people}<i>8</i></span><span class="q-ico">${icon.chat}</span><span class="q-ico on">${icon.shapes}</span></div>
    </div>
    <div class="q-brand"><svg viewBox="0 0 24 24" width="22" height="22"><rect x="2" y="5" width="14" height="14" rx="3" style="fill:var(--q-blue)"/><path d="M16 10l6-4v12l-6-4z" style="fill:var(--q-green)"/><circle cx="9" cy="12" r="3" style="fill:var(--q-bg)"/></svg>Quorum</div>`;
  document.querySelector('#overlay').append(q);
  return q;
}

function pollPanel({ ended = false } = {}) {
  const yes = MEMBERS.filter((x) => backs(ended ? x.vote : x.s));
  const no = MEMBERS.filter((x) => !backs(ended ? x.vote : x.s));
  const who = (list) => list.map((x) => `<span class="q-voter">${portrait(x.id, 22, moodOf(ended ? x.vote : x.s))}${x.short}</span>`).join('');
  return `<aside class="q-side">
    <div class="q-side-hd"><span>Activities</span><span class="q-x">✕</span></div>
    <div class="q-tabs"><span>Q&amp;A</span><span class="on">Polls</span><span>Breakout rooms</span></div>
    <div class="q-poll">
      <div class="q-poll-k">${ended ? 'Poll ended · votes are binding' : 'Straw poll · not binding · live'}</div>
      <div class="q-poll-q">${ended ? 'Motion: remove the chief executive' : 'If we voted today, would you keep the CEO?'}</div>
      <div class="q-opt"><div class="q-opt-top"><span>${ended ? 'Keep' : 'Keep'}</span><b>${yes.length}</b></div><div class="q-opt-bar"><i style="width:${(yes.length / 7) * 100}%"></i></div><div class="q-voters">${who(yes)}</div></div>
      <div class="q-opt"><div class="q-opt-top"><span>Remove</span><b>${no.length}</b></div><div class="q-opt-bar no"><i style="width:${(no.length / 7) * 100}%"></i></div><div class="q-voters">${who(no)}</div></div>
      <div class="q-poll-foot">${ended ? '4 needed to keep you. The motion fails.' : 'The real vote is when this turn ends. 4 of 7 keep you.'}</div>
    </div>
    <div class="q-chat">
      <div class="q-chat-hd">In-call messages</div>
      ${ended ? `
      <p><b>Growth investor</b> Great. Can we talk about revenue now</p>
      <p><b>Safety chair</b> I would like my objection minuted. All of it.</p>
      <p><b>Mission trustee</b> I was a keep last time. Read the news.</p>` : `
      <p><b>Growth investor</b> Revenue up again. I’m a keep, obviously</p>
      <p><b>Safety chair</b> 21% safety share. The target is 25. I did the maths out loud last time.</p>
      <p><b>Sovereign fund</b> Cash lasts a year now. Ask me again in a year.</p>
      <p><b>Candor watchdog</b> Is anyone else getting the CEO’s audio twice?</p>`}
    </div>
  </aside>`;
}

function frame1B() {
  quorumShell({ side: pollPanel() });
}

// 1C: the board visits the office before an era vote. Money seats stand by the CFO, oversight seats by Policy.
function standing(x, { paddle = null, marker = '', plate = true } = {}) {
  const L = LOOK[x.id];
  const legs = 'color-mix(in oklab, var(--ink) 78%, var(--sky))';
  const arm = paddle
    ? `<path d="M12,-58 Q20,-74 20,-92" style="fill:none;stroke:${L.top};stroke-width:7;stroke-linecap:round"/>`
    : `<path d="M12,-50 Q17,-38 13,-27" style="fill:none;stroke:${L.top};stroke-width:7;stroke-linecap:round"/>`;
  const card = paddle
    ? `<g transform="translate(22,-104)"><rect x="-1.5" y="-4" width="3" height="16" rx="1" style="fill:color-mix(in oklab, var(--wood) 70%, var(--ink))"/>
        <rect x="-26" y="-28" width="52" height="24" rx="5" style="fill:${paddle === 'keep' ? 'var(--teal)' : 'color-mix(in oklab, var(--coral) 88%, var(--ink))'};stroke:var(--paper);stroke-width:1.5"/>
        <text x="0" y="-11.5" text-anchor="middle" style="font:900 10px Nunito, sans-serif;fill:var(--paper);letter-spacing:.04em">${paddle === 'keep' ? 'KEEP' : 'REMOVE'}</text></g>`
    : '';
  return `<g class="bm-standing">
    <ellipse cx="0" cy="2" rx="17" ry="6" style="fill:color-mix(in oklab, var(--ink) 18%, transparent);filter:blur(1.5px)"/>
    <rect x="-9" y="-30" width="7.5" height="31" rx="3" style="fill:${legs}"/><rect x="1.5" y="-30" width="7.5" height="31" rx="3" style="fill:${legs}"/>
    <path d="M-13,-30 L-14,-57 Q-13,-65 -4,-66 L4,-66 Q13,-65 14,-57 L13,-30 Z" style="fill:${L.top};${OUT}"/>
    <path d="M-5,-66 L0,-58 L5,-66 Z" style="fill:${L.shirt}"/>
    ${L.tie ? `<path d="M-1.4,-63 L1.4,-63 L2,-52 L0,-49.5 L-2,-52 Z" style="fill:${L.tie}"/>` : ''}
    <path d="M-12,-58 Q-17,-44 -13,-31" style="fill:none;stroke:${L.top};stroke-width:7;stroke-linecap:round"/>
    ${arm}
    <g transform="translate(0,-79) scale(.98)">${portrait(x.id, 52, moodOf(paddle ? x.vote : x.s)).replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<path d="M-24,24[^>]*\/>/, '')}</g>
    ${card}
    ${plate ? `<g transform="translate(0,16)"><rect x="-38" y="-8" width="76" height="16" rx="3" style="fill:var(--paper);stroke:color-mix(in oklab, var(--ink) 35%, transparent);stroke-width:1"/><text y="4" text-anchor="middle" style="font:800 9.6px Nunito, sans-serif;fill:var(--ink)">${x.short}</text></g>` : ''}
    ${marker}
  </g>`;
}

const POS = { // floor spots at 1440x900, picked from the era-3 office
  trustee: [262, 610], candor: [332, 650], safety: [402, 690], security: [472, 730],
  growth: [1016, 708], financier: [1086, 670], sovereign: [1156, 632],
};

function seatBadge(yes) {
  return `<g transform="translate(20,-104)"><circle r="9" style="fill:${yes ? 'var(--teal)' : 'var(--coral)'};stroke:var(--paper);stroke-width:2"/>
    ${yes ? '<path d="M-4,0 L-1,3 L4.5,-3" style="fill:none;stroke:var(--paper);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"/>' : '<path d="M-3.4,-3.4 L3.4,3.4 M3.4,-3.4 L-3.4,3.4" style="stroke:var(--paper);stroke-width:2.2;stroke-linecap:round"/>'}</g>`;
}

function boardInRoom({ vote = false } = {}) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1440 900');
  svg.setAttribute('width', '1440');
  svg.setAttribute('height', '900');
  svg.classList.add('bm-room');
  const order = ['trustee', 'candor', 'safety', 'security', 'sovereign', 'financier', 'growth'];
  svg.innerHTML = order.map((id) => {
    const x = MEMBERS.find((y) => y.id === id);
    const [px, py] = POS[id];
    const inner = vote
      ? standing(x, { paddle: backs(x.vote) ? 'keep' : 'remove' })
      : standing(x, { marker: seatBadge(backs(x.s)) });
    return `<g transform="translate(${px},${py}) scale(1.25)">${inner}</g>`;
  }).join('');
  document.querySelector('#fx').append(svg);
}

function frame1C() {
  setHudTurn();
  boardInRoom();
  const banner = el('div', 'bm-visit', `<b>The board is in the office</b><span>They vote when this turn ends. ${YES} of 7 back you, and you need 4.</span>`);
  document.querySelector('#overlay').append(banner);
  const card = el('div', 'bm-hovercard', `${portrait('security', 52, 'flat')}
    <div><b>Security hawk</b><small>Cares about security and Washington</small>
    <div class="bm-hc-line">${bar(56)}${chip(56)}</div>
    <p>Backs you, one point above the line. Washington is warm to you.</p></div>`);
  card.style.left = '540px';
  card.style.top = '590px';
  document.querySelector('#overlay').append(card);
}

// ---- 2: the glance ----------------------------------------------------------------------------------------------
function frame2A() {
  setHudTurn();
  dropMarker('policy');
  const b = el('div', 'bm-say', `<p>Board votes when this turn ends. We have four. We need four.</p><span class="bm-say-link">See the board ›</span>`);
  b.style.left = '232px';
  b.style.top = '292px';
  document.querySelector('#fx').append(b);
}

function frame2B() {
  setHudTurn();
  const info = document.querySelector('#hud .info');
  info.insertAdjacentHTML('beforeend', `<span class="bm-info-board"><span class="k">Board</span>${seatTokens()}<b class="bm-info-count">4 of 7</b><small>Votes when this turn ends · needs 4</small></span>`);
}

function frame2C() {
  setHudTurn();
  const strip = el('div', 'bm-boardbar', `<div class="bm-bb-k">Board</div>
    <div class="bm-bb-faces">${MEMBERS.map((x, i) => `${i === 3 ? '<span class="bm-bb-div"></span>' : ''}<span class="bm-bb-face ${backs(x.s) ? 'yes' : 'no'} ${x.id === 'security' ? 'swing' : ''}">${portrait(x.id, 34, moodOf(x.s))}</span>`).join('')}</div>
    <div class="bm-bb-foot"><b>4–3</b> · votes when this turn ends</div>`);
  document.querySelector('#hud').append(strip);
}

// ---- 3: numbers or moods (list cards only) -----------------------------------------------------------------------
function cardFrame(content, title) {
  document.body.classList.add('bm-cardpage');
  const card = el('div', 'gp bm-card');
  card.append(el('div', 'hd', title), content);
  document.body.append(card);
}

function frame3A() { const c = el('div', 'bm-card-body'); c.append(boardList('number'), tallyStrip()); cardFrame(c, 'Support as numbers'); }
function frame3B() { const c = el('div', 'bm-card-body'); c.append(boardList('word', { grouped: 'side' }), tallyStrip()); cardFrame(c, 'Support as words'); }
function frame3C() {
  const c = el('div', 'bm-card-body bm-faces');
  c.innerHTML = `<div class="bm-faces-row">${MEMBERS.map((x) => `<div class="bm-face-seat ${backs(x.s) ? 'yes' : 'no'}">${portrait(x.id, 64, moodOf(x.s))}<b>${x.short}</b><span>${backs(x.s) ? 'Keeps you' : 'Against'}</span></div>`).join('')}</div>
    <p class="bm-faces-note">Faces only: a smile is firm, a straight mouth is shaky, a worried look can still be won, a frown is lost.</p>`;
  c.append(tallyStrip());
  cardFrame(c, 'Support as faces');
}
function frame3D() { const c = el('div', 'bm-card-body'); c.append(boardList('wordbar'), tallyStrip()); cardFrame(c, 'Support as a word and a bar'); }

// ---- 4: the vote itself -------------------------------------------------------------------------------------------
function frame4A() {
  setHudTurn();
  const body = el('div', 'bm-vote-body');
  body.innerHTML = `<div class="bm-vote-seats">${MEMBERS.map((x) => `<div class="bm-vote-seat ${backs(x.vote) ? 'yes' : 'no'}">${portrait(x.id, 58, moodOf(x.vote))}<b>${x.name}</b><span class="bm-verdict">${backs(x.vote) ? 'Keep' : 'Remove'}</span></div>`).join('')}</div>
    <div class="bm-vote-score"><span class="yes">4</span><i>to</i><span class="no">3</span></div>
    <div class="bm-vote-result">You stay, by one vote.</div>
    <p class="bm-vote-why">The three money seats kept you, and the security hawk made it four. The mission trustee, who kept you last era, voted to remove you this time.</p>`;
  mountDialog({
    body,
    title: 'The board votes',
    subtitle: 'End of era 3 · motion to remove the chief executive',
    left: { title: 'Team', content: teamOpinions([
      ['CFO', 'calm', 'Four is a majority. I checked. Twice.'],
      ['Head of Safety', 'alarmed', 'We kept the job and lost the trustee. That trade gets worse.'],
      ['Policy and Comms', 'uneasy', 'Nobody leak the three. Please.'],
    ]) },
    right: { title: 'Since the last vote', content: (() => {
      const box = summaryRows([
        ['Sovereign fund', 'now keeps you', 'kept'],
        ['Mission trustee', 'now against you', 'after'],
        ['Last vote (era 2)', '4 to 3'],
        ['This vote', '4 to 3'],
      ]);
      box.append(el('p', 'bm-side-note', 'Same score, different people. The next vote is at the end of era 4.'));
      return box;
    })() },
    okLabel: 'Back to work',
  }, 'bm-vote-dialog');
}

function frame4B() {
  setHudTurn();
  const doc = el('div', 'bm-minutes');
  doc.innerHTML = `
    <div class="bm-min-hd">MINUTES OF A SPECIAL MEETING<br>OF THE BOARD OF DIRECTORS</div>
    <div class="bm-min-sub">Held at the end of era 3, by video call. All seven directors present.<br>The chief executive was asked to leave the call and did, eventually.</div>
    <div class="bm-min-motion"><span>MOTION</span> That the chief executive be removed.</div>
    <div class="bm-min-roll">
      <div class="bm-min-k">ROLL CALL</div>
      ${MEMBERS.map((x) => `<div class="bm-min-line"><span>${x.name}</span><i></i><b class="${backs(x.vote) ? 'yes' : 'no'}">${backs(x.vote) ? 'keep' : 'remove'}</b></div>`).join('')}
    </div>
    <div class="bm-min-result">RESULT: 4 keep, 3 remove. The motion fails.<br>The chief executive stays.</div>
    <div class="bm-min-note">NOTED: The safety chair asked that her objection be minuted in full. It was. It is on the next four pages.</div>
    <div class="bm-min-sign"><span>Secretary to the board</span><span>Copy to: the chief executive, and apparently @leakwire</span></div>
    <div class="bm-min-stamp">MOTION<br>FAILS</div>`;
  document.querySelector('#overlay').append(el('div', 'bm-veil'), doc);
}

function frame4C() {
  setHudTurn();
  boardInRoom({ vote: true });
  document.querySelector('#overlay').append(el('div', 'bm-visit bm-visit-vote', `<b>The board votes: 4 keep, 3 remove</b><span>You stay, by one vote. The mission trustee switched to remove.</span>`));
}

function frame4D() {
  quorumShell({
    side: pollPanel({ ended: true }),
    toast: '<div class="q-toast"><b>You stay.</b> 4 keep, 3 remove.</div>',
  });
  const cap = document.querySelector('.q-caption');
  cap.innerHTML = '<b>Mission trustee</b> For the minutes: I voted to keep you last time. I read the news this time.';
  document.querySelectorAll('.q-tile').forEach((tile) => tile.classList.remove('speaking'));
  document.querySelectorAll('.q-tile')[6].classList.add('speaking');
}


// ---- L: looking the board up between meetings (round 2). Support is a range, the cut-off is never drawn. -------------
const trend = (d) => (d > 0 ? '<span class="lk-trend up" title="warmer">▲</span>' : d < 0 ? '<span class="lk-trend down" title="cooler">▼</span>' : '<span class="lk-trend flat">–</span>');
const leanChip = (id) => { const l = lean(id); return `<span class="lk-lean ${l.cls}">${l.word}</span>`; };
const readSeats = () => {
  const order = [...MEMBERS].sort((a, b) => ['with', 'lean-with', 'lean-away', 'against'].indexOf(lean(a.id).cls) - ['with', 'lean-with', 'lean-away', 'against'].indexOf(lean(b.id).cls));
  return `<span class="lk-seats">${order.map((x) => `<i class="${lean(x.id).cls}" title="${x.name}"></i>`).join('')}</span>`;
};

function frameL1() {
  setHudTurn();
  const body = el('div', 'bm-board-body');
  const list = el('div', 'bm-list');
  for (const [kind, label] of [['money', 'Money seats'], ['oversight', 'Oversight seats']]) {
    list.append(el('div', 'bm-group', `<span>${label}</span><span>our read of their support</span>`));
    for (const x of MEMBERS.filter((y) => y.kind === kind)) {
      list.append(el('div', 'bm-row lk-row', `${portrait(x.id, 40, moodOf(x.s))}
        <span class="bm-who"><b>${x.name}</b><small>Wants: ${MOVES[x.id].wants.toLowerCase()}</small></span>
        <span class="bm-right">${rangeBar(x.id, 170)}${leanChip(x.id)}${trend(x.d)}</span>`));
    }
  }
  body.append(list, el('div', 'bm-tally', `${readSeats()}<span><b>Between ${READ.lo} and ${READ.hi} would keep you.</b> You need 4.</span>`));
  mountDialog({
    body,
    title: 'The board',
    subtitle: 'Era 3 · the board meets in 2 weeks',
    left: { title: 'Team', content: teamOpinions([
      ['Policy and Comms', 'uneasy', 'I make it four. I also made the last election a landslide.'],
      ['CFO', 'calm', 'The money seats are fine. The money seats are always fine until they aren’t.'],
      ['Head of Safety', 'alarmed', 'The safety chair asked me for our eval results. I said “soon”. She wrote that down.'],
      ['Head of Research', 'calm', 'Which one is the trustee? The one who emails in all caps?'],
    ]) },
    right: { title: 'Next meeting', content: (() => {
      const box = summaryRows([
        ['When', 'In 2 weeks'],
        ['On the agenda', 'Your job'],
        ['Our read', `${READ.lo} to ${READ.hi} keep you`],
        ['Hardest to read', 'Candor watchdog'],
        ['Cooling fastest', 'Mission trustee'],
        ['Last meeting', 'Kept, 4 to 3'],
      ]);
      box.append(el('p', 'bm-side-note', 'Bars show where your staff think each member is. They have been wrong before.'));
      return box;
    })() },
    okLabel: 'Close',
  }, 'bm-board-dialog');
}

function frameL2() {
  setHudTurn();
  const x = MEMBERS.find((y) => y.id === 'security');
  const doc = el('div', 'lk-dossier');
  doc.innerHTML = `
    <div class="lk-tabs">${MEMBERS.map((y) => `<span class="lk-tab ${y.id === 'security' ? 'on' : ''}"><i class="${lean(y.id).cls}"></i>${y.short}</span>`).join('')}</div>
    <div class="lk-folder">
      <div class="lk-page lk-left">
        <div class="lk-photo">${portrait(x.id, 150, moodOf(x.s))}<span class="lk-clip"></span></div>
        <div class="lk-stamp">OVERSIGHT SEAT</div>
        <h2>Security hawk</h2>
        <p class="lk-bio">Ran a signals agency for six years. Joined the board “to keep the weights out of the wrong hands, including yours”.</p>
        <div class="lk-read"><span class="lk-k">Our read</span>${rangeBar(x.id, 260)}${leanChip(x.id)}</div>
        <div class="lk-k">Could win him</div><p class="lk-win">Get security above 40 before the meeting. Keep Washington warm.</p>
      </div>
      <div class="lk-page lk-right">
        <div class="lk-k">Wants</div><p>${MOVES[x.id].wants}</p>
        <div class="lk-k">Turns on you when</div><p>${MOVES[x.id].hurts}</p>
        <div class="lk-k">Voted last time</div><p>Keep <span class="lk-muted">(era 2, the deciding vote)</span></p>
        <div class="lk-k">Lately</div>
        <ul class="lk-log"><li><b>This week</b> Washington warmed to you. So did he.</li><li><b>Last month</b> Asked twice who can reach the model weights.</li><li><b>Era 2</b> Said security below 35 would be “a conversation”.</li></ul>
        <div class="lk-note">He likes us because DC does. Don’t lose DC. — P.</div>
      </div>
    </div>`;
  document.querySelector('#overlay').append(el('div', 'bm-veil'), doc);
}

function frameL3() {
  setHudTurn();
  const col = (title, names) => `<div class="wc-col"><div class="wc-h">${title}</div>${names.map((n) => `<div class="wc-n">${n}</div>`).join('')}</div>`;
  const pad = el('div', 'wc-pad');
  pad.innerHTML = `
    <div class="wc-top"></div>
    <div class="wc-title">Board count <span>— end of era 3</span></div>
    <div class="wc-need">need 4</div>
    <div class="wc-cols">
      ${col('Keep', ['Growth ✓✓', 'Financier ✓'])}
      ${col('Likely', ['Sovereign?', 'Security <i>(if DC holds)</i>'])}
      ${col('Coin flip', ['Candor <i>???</i>', '<s>Trustee</s>'])}
      ${col('Unlikely', ['Trustee ↙'])}
      ${col('No', ['Safety'])}
    </div>
    <div class="wc-notes">
      <p>Trustee moved after the polls. Get trust up or forget her.</p>
      <p>Candor won’t say. Never does. Don’t surprise her.</p>
      <p>Safety chair = 21 vs 25. It’s the whole conversation.</p>
    </div>
    <div class="wc-guess">Best guess: 4. Could be 2. Could be 6.<span>— P.</span></div>`;
  document.querySelector('#overlay').append(el('div', 'bm-veil'), pad);
}

const ISSUES = [
  { id: 'revenue', label: 'Revenue', state: 'up', say: 'Up this turn' },
  { id: 'valuation', label: 'Valuation', state: 'up', say: 'Up this turn' },
  { id: 'cash', label: 'Cash runway', state: 'up', say: 'Over a year' },
  { id: 'promise', label: 'Promises', state: 'flat', say: 'None open' },
  { id: 'safety', label: 'Safety share', state: 'down', say: 'Under target' },
  { id: 'honesty', label: 'Honesty', state: 'flat', say: 'Nothing new' },
  { id: 'washington', label: 'Washington', state: 'up', say: 'Warm' },
  { id: 'security', label: 'Security', state: 'down', say: 'Weak' },
  { id: 'trust', label: 'Public trust', state: 'down', say: 'Falling' },
  { id: 'constitution', label: 'Constitution', state: 'flat', say: 'Intact' },
];

function frameL4() {
  setHudTurn();
  const W = 1040, H = 640, ix = 250, mx = 790;
  const iy = (i) => 70 + i * 55, my = (i) => 80 + i * 78;
  const lines = [];
  MEMBERS.forEach((x, mi) => MOVES[x.id].issues.forEach((issue) => {
    const ii = ISSUES.findIndex((y) => y.id === issue);
    const st = ISSUES[ii].state;
    lines.push(`<path class="im-link ${st} ${x.id === 'trustee' ? 'hi' : ''}" d="M${ix + 88},${iy(ii)} C${(ix + mx) / 2},${iy(ii)} ${(ix + mx) / 2},${my(mi)} ${mx - 40},${my(mi)}"/>`);
  }));
  const issues = ISSUES.map((y, i) => `<g transform="translate(${ix},${iy(i)})" class="im-issue ${y.state}">
      <rect x="-150" y="-19" width="238" height="38" rx="19"/><circle cx="68" cy="0" r="12"/>
      <text x="-134" y="5" class="im-l">${y.label}</text><text x="52" y="5" class="im-s" text-anchor="end">${y.say}</text>
      <text x="68" y="5" text-anchor="middle" class="im-arrow">${y.state === 'up' ? '▲' : y.state === 'down' ? '▼' : '–'}</text></g>`).join('');
  const members = MEMBERS.map((x, i) => `<g transform="translate(${mx},${my(i)})" class="im-member ${lean(x.id).cls} ${x.id === 'trustee' ? 'hi' : ''}">
      <circle r="34" class="im-halo"/><foreignObject x="-28" y="-28" width="56" height="56"><div xmlns="http://www.w3.org/1999/xhtml" class="im-face">${portrait(x.id, 56, moodOf(x.s))}</div></foreignObject>
      <text x="48" y="-4" class="im-name">${x.name}</text><text x="48" y="14" class="im-leanw">${lean(x.id).word}</text></g>`).join('');
  const panel = el('div', 'gp im-panel');
  panel.innerHTML = `<div class="hd">What moves the board</div>
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${lines.join('')}${issues}${members}</svg>
    <div class="im-key"><span><i class="up"></i>pushing them toward you</span><span><i class="down"></i>pushing them away</span><span><i class="flat"></i>quiet</span><span class="im-tip"><b>Mission trustee:</b> public trust is falling and she is leaning away. Fix trust before the meeting, or plan without her.</span></div>`;
  document.querySelector('#overlay').append(el('div', 'bm-veil'), panel);
}

function frameL5() {
  const chats = [
    ['security', 'Hearing moved to Thursday. Your security numbers are coming up.', '2m', 2],
    ['candor', 'Is there anything I should hear from you before I hear it elsewhere?', '14m', 1],
    ['trustee', 'Saw the poll. Call me.', '1h', 1],
    ['safety', 'Attached: 21 vs 25 (slide 1 of 38)', '3h', 0],
    ['growth', 'revenue up!! can we go faster', '5h', 0],
    ['sovereign', 'We are comfortable. For now.', 'Tue', 0],
    ['financier', 'Great quarter. Send the build-out deck to my team.', 'Mon', 0],
  ];
  const app = el('div', 'bc-app');
  app.innerHTML = `
    <aside class="bc-list">
      <div class="bc-list-hd"><b>Chats</b><span class="bc-ic">✎</span></div>
      <div class="bc-search">Search</div>
      <div class="bc-folder">Board · 7</div>
      ${chats.map(([id, msg, t, n]) => { const m = MEMBERS.find((y) => y.id === id); return `<div class="bc-row ${id === 'security' ? 'on' : ''}">${portrait(id, 44, moodOf(m.s))}<div class="bc-mid"><b>${m.name}</b><span>${msg}</span></div><div class="bc-meta"><span>${t}</span>${n ? `<i>${n}</i>` : ''}</div></div>`; }).join('')}
    </aside>
    <main class="bc-thread">
      <div class="bc-thread-hd">${portrait('security', 36, 'flat')}<div><b>Security hawk</b><span>Disappearing messages · 1 week</span></div><span class="bc-hd-ic">☏ ⋮</span></div>
      <div class="bc-msgs">
        <div class="bc-day">Yesterday</div>
        <p class="them">Congrats on the Washington dinner. They liked you.</p>
        <p class="me">They liked the dessert. I was adjacent to the dessert.</p>
        <p class="them">Adjacent counts. For now.</p>
        <div class="bc-day">Today</div>
        <p class="them">Hearing moved to Thursday. Your security numbers are coming up.</p>
        <p class="them">36 is not a number I can defend in a room with generals.</p>
        <div class="bc-typing"><i></i><i></i><i></i></div>
      </div>
      <div class="bc-replies"><span>We’re fixing security this turn</span><span>It’s 36 out of what, exactly?</span><span>Leave on read</span></div>
      <div class="bc-compose">Message</div>
    </main>
    <aside class="bc-info">
      ${portrait('security', 96, 'flat')}
      <b>Security hawk</b><span class="bc-sub">Oversight seat</span>
      <div class="bc-note"><div class="bc-note-k">Your note</div><p>Kept us last time. Likes us because DC does.</p>
        <div class="bc-note-k">Staff read</div><div class="bc-read">${rangeBar('security', 190)}</div><span class="lk-lean ${lean('security').cls}">${lean('security').word}</span></div>
      <div class="bc-note"><div class="bc-note-k">Moved by</div><p>${MOVES.security.wants}</p></div>
    </aside>`;
  document.querySelector('#overlay').append(app);
}

// ---- P: events in the weeks before a meeting (round 3), in the events lane's card look -------------------------------
const HEADS = { research: [514, 313], safety: [705, 412], cfo: [890, 532], policy: [396, 406] };
const ADV = { research: 'Head of Research', safety: 'Head of Safety', cfo: 'CFO', policy: 'Policy and Comms' };

function countdown(text, urgent = false) {
  document.querySelector('#hud').append(el('div', `pm-count ${urgent ? 'urgent' : ''}`, `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="12" rx="2"/><path d="M1.5 6.5h13M5 1v3M11 1v3"/></svg><span>${text}</span>`));
}

function say(role, text, pick = null, width = 240) {
  const [x, y] = HEADS[role];
  const node = el('div', 'ev-bubble', `<b>${ADV[role]}</b><div class="ev-say">${text}</div>${pick ? `<span class="ev-pick">✓ ${pick}</span>` : ''}`);
  node.style.width = `${width}px`;
  node.style.setProperty('--tail', '26px');
  document.querySelector('#fx').append(node);
  node.style.left = `${x - 33}px`;
  node.style.top = `${y - 34 - node.offsetHeight}px`;
  document.querySelector(`#fx .advisor-marker[aria-label^="${role}"]`)?.remove();
}

function choice({ label, cost, backers = [], opposers = [], fallback = false }) {
  return `<button type="button" class="ev-choice"><span class="ev-choice-label">${label}</span><span class="ev-choice-cost">Cost: <b>${cost}</b></span>
    <span class="ev-who">${fallback ? '<span class="ev-chip idle">If time runs out</span>' : ''}${backers.map((b) => `<span class="ev-chip for">✓ ${b}</span>`).join('')}${opposers.map((o) => `<span class="ev-chip against">${o}</span>`).join('')}</span></button>`;
}

function boardPost(id, text) {
  const x = MEMBERS.find((y) => y.id === id);
  return `<div class="ev-post pm-post">${portrait(id, 30, moodOf(x.s))}<div><div class="ev-handle">${x.name} <span class="pm-onboard">board</span></div><div class="ev-text">${text}</div></div></div>`;
}
function feedPost(handle, text, tone = 'var(--sky)') {
  return `<div class="ev-post"><div class="ev-av" style="background:${tone}">${handle[1].toUpperCase()}</div><div><div class="ev-handle">${handle}</div><div class="ev-text">${text}</div></div></div>`;
}

function card({ title, post, due, frac = 0.5, choices, watching, pic = null, kicker = 'Before the board meets' }) {
  setHudTurn();
  const node = el('section', `gp ev-card ${pic ? '' : 'no-pic'}`);
  node.innerHTML = `<div class="pm-kicker"><span>${kicker}</span><span class="pm-watch">Watching: ${watching.map((id) => `<i title="${MEMBERS.find((y) => y.id === id).name}">${portrait(id, 24, moodOf(MEMBERS.find((y) => y.id === id).s))}</i>`).join('')}</span></div>
    ${pic ? `<figure class="ev-pic">${pic}</figure>` : ''}
    <div class="ev-card-main">
      <div class="ev-card-top"><h1>${title}</h1><div class="ev-due"><span>${due}</span><div class="ev-due-bar"><i style="width:${Math.round(frac * 100)}%"></i></div></div></div>
      ${post}
      <div class="ev-choices">${choices.map(choice).join('')}</div>
      <div class="ev-card-foot"><button class="ev-act ghost" type="button">Decide later</button></div>
    </div>`;
  document.querySelector('#overlay').append(node);
}

function frameP1() {
  countdown('Board meets in 3 weeks');
  card({
    title: 'The candor watchdog wants the safety results', due: '5 days left', frac: 0.35, watching: ['candor', 'safety'],
    post: boardPost('candor', 'Before the meeting I’d like the full safety test results. Not the summary. The results.'),
    choices: [
      { label: 'Send them as they are', cost: 'the safety chair sees 21%', backers: ['Safety'], opposers: ['CFO'] },
      { label: 'Send a cleaned-up version', cost: 'nothing, unless it comes out', backers: ['CFO'], opposers: ['Safety', 'Comms'] },
      { label: 'Stall until after the meeting', cost: 'she will notice', fallback: true, backers: ['Comms'] },
    ],
  });
  say('safety', 'Send all of it. She’ll find out anyway, and then it’s worse.', 'Send them as they are');
  say('cfo', 'Send the tidy version. Nobody reads appendices.', 'Send a cleaned-up version', 220);
  say('policy', 'Stall. Three weeks is a long time in this business.', 'Stall until after the meeting', 230);
}

function frameP2() {
  countdown('Board meets in 5 weeks');
  card({
    title: 'The growth investor had a bad quarter', due: '2 weeks left', frac: 0.7, watching: ['growth', 'trustee'],
    post: boardPost('growth', 'My fund is down. I need a win to show my partners before the meeting. Revenue. Soon.'),
    choices: [
      { label: 'Raise prices this month', cost: 'public trust dips', backers: ['CFO'], opposers: ['Comms'] },
      { label: 'Walk him through the long plan', cost: 'a week of your time', backers: ['Research'] },
      { label: 'Let him vent', cost: 'nothing up front', fallback: true },
    ],
  });
  say('cfo', 'Raise prices. He’s not wrong, and neither is my spreadsheet.', 'Raise prices this month', 230);
  say('policy', 'A price hike right before the meeting? The trustee reads the news too.', null, 250);
}

function frameP3() {
  countdown('Board meets in 10 days', true);
  card({
    title: 'Someone told Leakwire about the vote', due: '4 days left', frac: 0.3, watching: MEMBERS.map((x) => x.id),
    post: feedPost('@leakwire', 'two directors at a certain lab are counting votes. the ceo may want to update their linkedin.', 'var(--coral)'),
    choices: [
      { label: 'Find the leaker', cost: 'the candor watchdog hates witch hunts', backers: ['CFO'], opposers: ['Comms'] },
      { label: 'Post that the board backs you', cost: 'if it doesn’t, everyone knows', backers: ['Comms'] },
      { label: 'Say nothing', cost: 'nothing up front', fallback: true },
    ],
  });
  say('policy', 'Get ahead of it. Say the board backs you. Loudly.', 'Post that the board backs you', 230);
  say('cfo', 'Find who talked. Then we talk about them.', 'Find the leaker', 210);
  document.querySelector('#overlay').append(el('div', 'pm-toast', '<b>The read just got harder.</b> Until this settles, your staff are less sure where each director stands.'));
}

const PAPER = `<svg viewBox="0 0 196 150" aria-hidden="true"><rect width="196" height="150" style="fill:var(--paper)"/>
  <rect x="10" y="10" width="176" height="18" style="fill:var(--ink)"/><text x="98" y="23.5" text-anchor="middle" style="font:700 12px 'Libre Baskerville', serif;fill:var(--paper);letter-spacing:.08em">THE LEDGER</text>
  <text x="12" y="44" style="font:700 10.5px 'Libre Baskerville', serif;fill:var(--ink)">OPINION</text>
  <text x="12" y="62" style="font:700 15px 'Libre Baskerville', serif;fill:var(--ink)">Should this lab</text><text x="12" y="80" style="font:700 15px 'Libre Baskerville', serif;fill:var(--ink)">keep its CEO?</text>
  <g style="fill:color-mix(in oklab, var(--ink) 25%, var(--paper))">${[92, 100, 108, 116, 124, 132].map((y) => `<rect x="12" y="${y}" width="${y % 16 ? 100 : 84}" height="3"/>`).join('')}</g>
  <rect x="122" y="90" width="62" height="48" style="fill:color-mix(in oklab, var(--wood) 30%, var(--paper))"/><circle cx="153" cy="108" r="9" style="fill:color-mix(in oklab, var(--ink) 60%, var(--paper))"/><path d="M137 138 q16 -22 32 0 z" style="fill:color-mix(in oklab, var(--ink) 60%, var(--paper))"/></svg>`;

function frameP4() {
  countdown('Board meets in 2 weeks', true);
  card({
    title: 'The Ledger asks if you should keep your job', due: '6 days left', frac: 0.45, watching: ['trustee', 'candor'], pic: PAPER + '<figcaption>The Ledger, this morning</figcaption>',
    post: feedPost('@theledger', 'Op-ed: Should this lab keep its CEO? Four experts say no. One says it’s complicated.', 'var(--ink)'),
    choices: [
      { label: 'Write a reply', cost: 'the story runs another day', backers: ['Comms'] },
      { label: 'Give a long interview', cost: 'a week, and it could go badly', backers: ['Research'], opposers: ['Comms'] },
      { label: 'Ignore it', cost: 'public trust dips', fallback: true, backers: ['CFO'] },
    ],
  });
  say('policy', 'Reply, short and calm. The trustee will read every word.', 'Write a reply', 230);
}

function frameP5() {
  setHudTurn();
  countdown('Board meets in 6 days', true);
  say('policy', 'Nobody on the board is picking up. I’ve never liked this part.', null, 250);
  say('cfo', 'Same. The financier left me on read. He never leaves me on read.', null, 240);
  document.querySelector('#overlay').append(el('div', 'pm-quiet', `<div class="pm-quiet-hd">Board · last week before the meeting</div>
    ${MEMBERS.map((x) => `<div class="pm-quiet-row">${portrait(x.id, 30, moodOf(x.s))}<b>${x.short}</b><span>Seen</span><span class="pm-wide">${rangeBar(x.id, 120).replace(/left:(\d+)%;width:(\d+)%/, (m, l, w) => `left:${Math.max(0, +l - 12)}%;width:${Math.min(100, +w + 24)}%`)}</span></div>`).join('')}
    <p>7 seen · 0 replies. Your staff can’t read the room this week.</p>`));
}

function frameR1() {
  countdown('Board meets in 4 weeks');
  card({
    title: 'A tech giant asked your investors what you’d sell for', due: '1 week left', frac: 0.5, watching: ['growth', 'financier', 'sovereign'], kicker: 'Candidate · replaces the rival lunch',
    post: feedPost('@marketwire', 'sources: a megacorp has “had conversations” with investors in a certain lab. the ceo was not on the call.', 'var(--teal)'),
    choices: [
      { label: 'Take the call yourself', cost: 'the oversight seats hear about it', backers: ['CFO'], opposers: ['Safety'] },
      { label: 'Refuse in public', cost: 'the money seats wanted the number', backers: ['Safety', 'Comms'] },
      { label: 'Let it play out', cost: 'nothing up front', fallback: true },
    ],
  });
  say('cfo', 'Take the call. Knowing the number isn’t selling. Probably.', 'Take the call yourself', 230);
}

function frameR2() {
  countdown('Board meets in 3 weeks');
  card({
    title: 'One of your researchers wrote to the safety chair', due: '5 days left', frac: 0.4, watching: ['safety', 'candor'], kicker: 'Candidate · replaces the rival lunch',
    post: boardPost('safety', 'One of your people wrote to me directly. I’d like to hear your side before the meeting.'),
    choices: [
      { label: 'Meet the researcher first', cost: 'a week of your time', backers: ['Safety'] },
      { label: 'Let the board handle it', cost: 'you lose the story', fallback: true },
      { label: 'Find out who wrote', cost: 'the candor watchdog will hear', backers: ['CFO'], opposers: ['Safety', 'Comms'] },
    ],
  });
  say('safety', 'Meet them. If they went around you, there’s a reason.', 'Meet the researcher first', 230);
}

function frameR3() {
  countdown('Board meets in 3 weeks');
  card({
    title: 'Washington wants the security hawk at a closed briefing', due: '1 week left', frac: 0.55, watching: ['security'], kicker: 'Candidate · replaces the rival lunch',
    post: feedPost('@dc_insider', 'closed-door briefing on frontier-lab security this week. one board member invited. no ceos.', 'var(--sky)'),
    choices: [
      { label: 'Brief him yourself first', cost: 'a week of your time', backers: ['Comms'] },
      { label: 'Send your security lead with him', cost: 'if security looks bad, it looks worse', backers: ['Research'] },
      { label: 'Stay out of it', cost: 'nothing up front', fallback: true },
    ],
  });
  say('policy', 'Get to him before Washington does.', 'Brief him yourself first', 210);
}

const FRAMES = {
  P1: frameP1, P2: frameP2, P3: frameP3, P4: frameP4, P5: frameP5, R1: frameR1, R2: frameR2, R3: frameR3,
  L1: frameL1, L2: frameL2, L3: frameL3, L4: frameL4, L5: frameL5, '1A': frame1A, '1B': frame1B, '1C': frame1C, '2A': frame2A, '2B': frame2B, '2C': frame2C, '3A': frame3A, '3B': frame3B, '3C': frame3C, '3D': frame3D, '4A': frame4A, '4B': frame4B, '4C': frame4C, '4D': frame4D };

async function boot() {
  for (let i = 0; i < 100 && !(globalThis.game && document.querySelector('#office svg')); i++) await new Promise((r) => setTimeout(r, 50));
  await new Promise((r) => setTimeout(r, 150)); // markers and HUD settle
  document.body.dataset.mock = m;
  FRAMES[m]?.();
  document.body.dataset.ready = '1';
}
boot();
