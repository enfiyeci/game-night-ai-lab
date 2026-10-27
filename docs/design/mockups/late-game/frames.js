// Late-game mockup frames (lane gn-late-game, 2026-10-27), drawn over the real game through tools/cdp-shot.mjs:
//   const m = await import('/docs/design/mockups/late-game/frames.js?' + Date.now()); return await m.frame('B-board');
// Desktop frames open on index.html?scenario=summit&seed=4&notitle&paused (era 5, week 1). Phone frames run on the
// phone-redesign build with ?layout=phone&insets=... Every number on these frames is illustrative, not from the sim.
// Research only: nothing here is loaded by the game.

import { mapSvg, legend, REGIONS, LABS } from './map.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const base = new URL('.', import.meta.url).href;

async function style() {
  if (document.querySelector('#mk-css')) return;
  const link = document.createElement('link');
  link.id = 'mk-css';
  link.rel = 'stylesheet';
  link.href = `${base}mockup.css?${Date.now()}`;
  document.head.append(link);
  await new Promise((r) => link.addEventListener('load', r, { once: true }));
}

// Clear the scenario's own bubbles, tour notes and dialogs so a frame shows only its option.
function quiet() {
  document.querySelectorAll('.dialog-layer, .ev-briefing .ev-bubble, .floor-hint, .intro-layer').forEach((n) => n.remove());
}

// The HUD's era line and clock date, as each direction's calendar would show them: swaps text in the HUD's text nodes.
function setHud({ era, eraName, date, week }) {
  const swaps = [['Self-improvement and pacing', eraName], ['Jan 2027', date], ['Week 1', week]].filter(([, to]) => to);
  const apply = () => {
    const walker = document.createTreeWalker(document.querySelector('#hud'), NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) for (const [from, to] of swaps) if (n.data.includes(from)) n.data = n.data.replace(from, to);
    const num = document.querySelector('#hud .info b');
    if (era && num && num.textContent !== String(era)) num.textContent = String(era);
  };
  apply();
  setInterval(apply, 50); // the HUD re-renders on its own; keep the frame's labels on it
}

// A dialog in the release reveal's frame (kicker, light title, sections, one foot).
function dialog({ kick, title, side = '', body, foot, cls = '' }) {
  const layer = document.createElement('div');
  layer.className = `dialog-layer dialog-open reveal-layer mk-layer ${cls}`;
  layer.innerHTML = `<div class="dialog-veil"></div>
    <section class="gp rel reveal${cls.includes('short') ? ' short' : ''}">
      <div class="reveal-top"><div><div class="reveal-kick">${kick}</div><h1>${title}</h1></div><div class="reveal-side">${side}</div></div>
      ${body}
      <div class="reveal-foot">${foot}</div>
    </section>`;
  document.querySelector('#overlay').append(layer);
  return layer;
}

// Office strips sit in the 1440 x 900 overlay on desktop and in window points on a phone (outside the scaled overlay).
function officeLayer(html) {
  const host = document.documentElement.classList.contains('phone') ? document.body : document.querySelector('#overlay');
  host.insertAdjacentHTML('beforeend', html);
}

// The map replaces the room under the HUD: it goes into the stage just before the HUD, and the desk phone hides.
function mapLayer(html) {
  document.querySelectorAll('.ev-phone-button').forEach((n) => { n.style.display = 'none'; });
  document.querySelector('#hud').insertAdjacentHTML('beforebegin', html);
}

const say = (who, mood, line) => `<div class="mk-say"><b><span>${who}</span><span class="compute-mood ${mood.toLowerCase()}">${mood}</span></b><q>${line}</q></div>`;
const mono = (lab, letter) => `<span class="mk-mono mk-${lab}">${letter}</span>`;

// ---------- Content shared by desktop and phone ----------

const FRONTS = [
  { name: 'Compute', what: 'Your share of the frontier\'s chips', band: 'Superior', stat: '41% of frontier compute', you: 5, rival: ['openbrain', 'O', 4], prev: 4,
    risk: 'Past 40% the East treats you as the lab to stop.', posted: [] },
  { name: 'Economy', what: 'Share of the world\'s paid desk work your models do', band: 'Overwhelming', stat: '9% of desk work', you: 6, rival: ['openbrain', 'O', 4], prev: 5,
    risk: 'Unions march; an antitrust probe opens next round.', posted: ['Kestrel 6', 'Kestrel 6 Mini'] },
  { name: 'Governments', what: 'Who backs you: watched, partner, national champion', band: 'Superior', stat: 'Partner, one step from champion', you: 5, rival: ['qilin', 'Q', 4], prev: 4,
    risk: 'Washington will ask for the weights in return.', posted: ['Kestrel 6 Gov'] },
  { name: 'Security', what: 'Who could steal your weights', band: 'Behind', stat: 'Stops criminal groups, not states', you: 2, rival: ['deepthink', 'D', 4], prev: 3,
    risk: 'You lead three fronts and guard like a startup.', posted: [] },
];
const BAND_CHIP = { Overwhelming: 'warn', Superior: 'ok', Even: '', Behind: '' };

function tug(front, { ends = true } = {}) {
  const cells = Array.from({ length: 7 }, (_, i) => `<i class="${i >= 5 ? 'win' : i <= 1 ? 'lose' : 'mid'}"></i>`).join('');
  const x = (pos) => `${((pos + 0.5) / 7) * 100}%`;
  const [lab, letter, rpos] = front.rival;
  return `<div class="mk-tug">
    <div class="lane">${cells}</div>
    ${front.prev !== front.you ? `<span class="tok prev" style="left:${x(front.prev)}">${mono('you', 'Y')}</span>` : ''}
    <span class="tok" style="left:${x(rpos)}">${mono(lab, letter)}</span>
    <span class="tok" style="left:${x(front.you)}">${mono('you', 'Y')}</span>
    ${ends ? '<div class="ends"><span class="mk-muted">Behind</span><span class="mk-muted">Even</span><span class="mk-bad">Overwhelming</span></div>' : ''}
  </div>`;
}

const SLOTS = [
  { slot: 'Flagship', name: 'Kestrel 6', users: '182M', margin: '61%', front: 'Economy', age: 70, note: 'Live 4 months. Its sales fade from month 6.' },
  { slot: 'Fast tier', name: 'Kestrel 6 Mini', users: '410M', margin: '74%', front: 'Economy', age: 40, note: 'Shipped one round after the flagship: cheap, most users.' },
  { slot: 'Government', name: 'Kestrel 6 Gov', users: '3 agencies', margin: '38%', front: 'Governments', age: 20, note: 'Runs on classified compute. Washington reads its logs.' },
  { slot: 'Internal', name: 'Kestrel 7 preview', users: 'your lab only', margin: '—', front: 'Inside the lab', age: 10, note: 'Not released. Writes 70% of your code.' },
];

const BOARD = [
  ['openbrain', 'O', 'OpenBrain', 82, 6, '+6'],
  ['you', 'Y', 'Your lab', 79, 8, '+8', true],
  ['deepthink', 'D', 'DeepThink', 71, 2, '+2'],
  ['qilin', 'Q', 'Qilin', 68, 5, '+5'],
  ['lodestar', 'L', 'Lodestar', 61, 0, 'held'],
];

function board(rows = BOARD) {
  return `<div class="mk-board">${rows.map(([lab, letter, name, score, gain, label, me]) => `
    <div class="mk-brow mk-${lab}${me ? ' me' : ''}">${mono(lab, letter)}<span>${name}</span>
      <span class="bar"><i style="width:${score - gain}%"></i><s style="left:${score - gain}%;width:${gain}%"></s></span>
      <span class="val">${score}<small class="${gain ? 'mk-good' : 'mk-muted'}">${label}</small></span></div>`).join('')}</div>`;
}

// ---------- Desktop frames ----------

const FRAMES = {};

// A · The long sprint: era 5 office with the frontier-lead track and the world's response filling.
FRAMES['A-office'] = async () => {
  quiet();
  setHud({ eraName: 'The intelligence explosion', date: 'Jul 2027', week: 'Round 6 of 8' });
  // Months behind the frontier: you sit at the front, the decisive line is a 3-month lead.
  const x = (months) => `${100 - (months / 8) * 100}%`;
  const tok = (lab, letter, months, you) => `<span class="tok${you ? ' you' : ''}" style="left:${x(months)}">${mono(lab, letter)}</span>`;
  const html = `<div class="mk-office">
    <div class="mk-strip">
      <div class="head"><b>Your lead: 1.8 months over OpenBrain</b><span>Oversight vote in October · 2 rounds</span></div>
      <div class="mk-track"><div class="rail"></div>
        <span class="tick" style="left:${x(3)}"><span>A 3-month lead is decisive</span></span>
        ${tok('lodestar', 'L', 6.8)}${tok('qilin', 'Q', 5.1)}${tok('deepthink', 'D', 4.2)}${tok('openbrain', 'O', 1.8)}${tok('you', 'Y', 0, true)}
      </div>
      <div class="mk-fill"><span>World attention</span><span class="bar"><i style="width:58%"></i><em style="left:25%"></em><em style="left:50%"></em><em style="left:75%"></em></span><span>58%</span></div>
      <div class="foot"><span class="mk-muted">25% rivals copy your recipe · 50% hearings: the committee can subpoena · 75% the state demands access. Your lead and every incident raise it.</span></div>
    </div>
    <div class="mk-toast"><span class="mk-k">World attention · 50%</span>Congress opens hearings on frontier labs. The committee will have subpoena power at the vote.</div>
  </div>`;
  officeLayer(html);
};

// A · the climax: the Oversight Committee votes (AI 2027's October 2027 branch point, shifted to era 5's last week).
FRAMES['A-vote'] = async () => {
  quiet();
  const seats = [
    ['President\'s office', 'race'], ['Defense', 'race'], ['Commerce', 'race'], ['Treasury', 'open'], ['State', 'slow'],
    ['Science adviser', 'slow'], ['Your lab · you', 'open'], ['Your lab · safety', 'slow'], ['OpenBrain', 'race'], ['Lodestar', 'slow'],
  ];
  const label = { race: 'Race on', slow: 'Slow down', open: 'Open' };
  const body = `<div class="reveal-cols" style="--cols: 1fr 300px">
    <div class="reveal-col">
      <div class="sec">The committee · ten seats · 4 race, 4 slow, 2 open</div>
      <div class="mk-seats">${seats.map(([who, lean], i) => `<div class="mk-seat${i === 3 ? ' lobby' : ''}"><span>${who}</span><span class="lean ${lean}">${label[lean]}</span></div>`).join('')}</div>
      <div class="sec">The motions</div>
      <div class="mk-choices">
        <div class="mk-choice"><h3>Race on</h3><ul><li>Keep every run going</li><li>Your lead stays; OpenBrain stays close</li><li class="minus">Concealed debt keeps growing</li></ul></div>
        <div class="mk-choice sel"><h3>Slow down and pool</h3><ul><li>Trailing labs' compute joins the leader</li><li>Outside testers read your next model</li><li class="minus">Qilin is not bound</li></ul></div>
        <div class="mk-choice"><h3>Hand it to the state</h3><ul><li>The government runs the next model</li><li>No more race for you</li><li class="minus">Who controls the state then?</li></ul></div>
      </div>
    </div>
    <div class="reveal-col">
      <div class="sec">Your team</div>
      ${say('Head of Safety', 'Alarmed', 'Our last checkpoint hid something from the testers. I can\'t say what.')}
      ${say('Policy and Comms', 'Uneasy', 'Treasury is open. One meeting there could swing it.')}
      ${say('Head of Research', 'Eager', 'Two more rounds and we pass OpenBrain for good.')}
      ${say('CFO', 'Calm', 'Pooling pays us for the compute we lend.')}
    </div>
  </div>`;
  dialog({
    kick: 'Era 5 · October 2027 · the scheduled climax', title: 'The Oversight Committee votes',
    side: '<div class="mk-pill warn">World attention: 74%. The committee can subpoena your logs.</div>',
    body,
    foot: '<span class="note">Your vote is one of ten. Lobby one open seat first (one team action).</span><span class="acts"><span class="mk-btn ghost">Lobby Treasury</span><span class="mk-btn">Cast your vote</span></span>',
  });
};

// B · Four fronts: the world board.
FRAMES['B-board'] = async () => {
  quiet();
  const rows = FRONTS.map((f, i) => `<div class="mk-front${i === 1 ? ' sel' : ''}">
      <div><h3>${f.name}</h3><div class="what mk-muted">${f.what}</div>
        <div class="posted">${f.posted.map((p) => `<span class="mk-chip">${p}</span>`).join('') || '<span class="mk-chip">No model posted</span>'}</div></div>
      ${tug(f)}
      <div class="risk"><span class="mk-chip ${BAND_CHIP[f.band]}">${f.band} · ${f.stat}</span>${f.risk}</div>
    </div>`).join('');
  const body = `<div class="reveal-cols" style="--cols: 1fr 270px">
    <div class="reveal-col"><div class="sec">Four fronts · you against the lab that leads each one</div><div class="mk-fronts">${rows}</div></div>
    <div class="reveal-col">
      <div class="sec">This round</div>
      ${say('Policy and Comms', 'Uneasy', 'We lead three fronts. That makes us the lab everyone aims at.')}
      ${say('Head of Safety', 'Alarmed', 'Someone probed our Texas site twice. We guard like a startup.')}
      ${say('CFO', 'Calm', 'The economy front pays for the other three. Don\'t give it up.')}
      <div class="sec" style="margin-top:10px">How the era ends</div>
      <div class="mk-say" style="border:0">The decisive month comes at checkpoint 6. Overwhelming on 3 fronts at two checkpoints in a row brings it early.</div>
    </div>
  </div>`;
  dialog({
    kick: 'Era 6 · The world stage · checkpoint 3 of 6', title: 'The world board',
    side: '<div class="mk-pill">Lead: 1.8 months over OpenBrain</div><div class="mk-weeks"><i class="done"></i><i class="done"></i><i class="now"></i><i></i><i></i><i class="peak"></i></div>',
    body,
    foot: '<span class="note">Post a live model to a front, or spend a team action on one. Fronts move at each checkpoint.</span><span class="acts"><span class="mk-btn ghost">Post a model</span><span class="mk-btn">Close</span></span>',
  });
};

// C · The Project: the President's offer at the era 4 to era 5 gate.
FRAMES['C-offer'] = async () => {
  quiet();
  setHud({ era: 4, eraName: 'The gigawatt race', date: 'Jun 2026', week: 'Round 6' });
  const body = `<div class="reveal-cols" style="--cols: 1fr 280px">
    <div class="reveal-col">
      <div class="sec">"We're doing this together, or you're doing it without us."</div>
      <div class="mk-choices">
        <div class="mk-choice sel"><h3>Join the Project</h3><div class="who">${mono('you', 'Y')}${mono('openbrain', 'O')}<span class="mk-chip">+ the government</span></div>
          <ul><li>Your compute and OpenBrain's pooled: about 3×</li><li>Classified sites, no power queue</li><li class="minus">A government board votes on every release</li><li class="minus">Qilin's state reads it as a race to win</li></ul></div>
        <div class="mk-choice"><h3>Stay independent</h3><div class="who">${mono('you', 'Y')}</div>
          <ul><li>Your releases, your schedule</li><li>Customers who distrust the state stay with you</li><li class="minus">"Supply chain risk" label and its lawsuits</li><li class="minus">OpenBrain joins without you</li></ul></div>
        <div class="mk-choice"><h3>Lead a consortium</h3><div class="who">${mono('you', 'Y')}${mono('lodestar', 'L')}<span class="mk-chip">+ the West, testers</span></div>
          <ul><li>Shared testers and a check channel with the East</li><li>The only path that can bind Qilin</li><li class="minus">Slowest: every run waits for the testers</li><li class="minus">The President is offended (US favor −15)</li></ul></div>
      </div>
    </div>
    <div class="reveal-col">
      <div class="sec">Your team</div>
      ${say('Head of Research', 'Eager', 'Three times the compute. Say yes.')}
      ${say('Head of Safety', 'Uneasy', 'A board of generals deciding when a model is safe enough?')}
      ${say('Policy and Comms', 'Uneasy', 'Saying no to him in public has a price. Ask the last lab that tried.')}
      ${say('CFO', 'Calm', 'Joining pays our power bills. Independence costs about $400M a quarter.')}
    </div>
  </div>`;
  dialog({
    kick: 'End of era 4 · The President calls', title: 'The national Project',
    side: '<div class="mk-pill warn">Decide before era 5 begins</div>',
    body,
    foot: '<span class="note">Your answer sets who you race with, and who you answer to, for all of era 5.</span><span class="acts"><span class="mk-btn">Join the Project</span></span>',
  });
};

// C · the escalation ladder over the era 5 office.
FRAMES['C-office'] = async () => {
  quiet();
  setHud({ eraName: 'Inside the Project', date: 'Apr 2027', week: 'Round 4 of 8' });
  const rungs = [
    ['Spying', 'theft of secrets'], ['Covert sabotage', 'quiet damage to runs'], ['Open cyberattack', 'sites go down'],
    ['Strike on a site', 'a datacenter is hit'], ['Open war', 'the run ends'],
  ];
  const html = `<div class="mk-office">
    <div class="mk-strip">
      <div class="head"><b>The world's escalation ladder</b><span>Rung 2 since March · shared by every lab and state</span></div>
      <div class="mk-ladder">${rungs.map(([b, s], i) => `<div class="mk-rung ${i < 1 ? 'past' : i === 1 ? 'now' : ''}${i === 4 ? ' end' : ''}"><b>${i + 1} ${b}</b><span>${s}</span></div>`).join('')}</div>
      <div class="foot"><span>Your lead pushes the East up a rung at each checkpoint. Whoever takes it to rung 5 loses the run.</span></div>
    </div>
    <div class="mk-toast hot"><span class="mk-k">Rung 2 · covert sabotage</span>A Qilin-linked group corrupted a DeepThink run. Tomas asks for a lockdown: training 15% slower.</div>
  </div>`;
  officeLayer(html);
};

// Releases R1: a point release with a short reveal (about 10 seconds).
FRAMES['R1-update'] = async () => {
  quiet();
  const rows = BOARD.map((r) => (r[1] === 'Y' ? [...r.slice(0, 4), 4, '+4 update', true] : [...r.slice(0, 4), 0, '']));
  dialog({
    cls: 'short', kick: 'Point release · Kestrel 6.1', title: 'Kestrel 6.1 is out',
    side: '<div class="mk-pill">+4 over Kestrel 6</div>',
    body: `<div style="padding:12px 26px 6px"><div class="sec">Leaderboard</div>${board(rows)}
      <div class="mk-press"><div class="reveal-avatar">S</div><div><b>Strategery</b> · 7/10 · "A tidy update, not a new model."</div></div>
      <div class="mk-press" style="border-top:0;margin-top:4px;padding-top:0"><div class="reveal-avatar" style="background:var(--wood)">M</div><div>Next: <b>Kestrel 6 Mini</b> ships next round, cheaper, for the users Kestrel 6 is too dear for.</div></div></div>`,
    foot: '<span class="note">+9M users this month · an update draws less press than a new generation</span><span class="mk-btn">Continue</span>',
  });
};

// Releases R2: the weekly checkpoint reveal (reward-loops O6).
FRAMES['R2-checkpoint'] = async () => {
  quiet();
  dialog({
    cls: 'short', kick: 'Era 5 · checkpoint 3 of 6', title: 'Checkpoint 3: you gain on OpenBrain',
    side: '<div class="mk-weeks"><i class="done"></i><i class="done"></i><i class="now"></i><i></i><i></i><i class="peak"></i></div>',
    body: `<div style="padding:12px 26px 6px"><div class="sec">Every lab's checkpoint this week</div>${board()}
      <div class="mk-press"><div class="reveal-avatar">P</div><div><b>PitchCrunch</b> · "Three points a week. Nobody can keep that up." Lodestar paused for its testers.</div></div></div>`,
    foot: '<span class="note">Your checkpoint ships to users at once · 3 checkpoints to the climax</span><span class="mk-btn">Continue</span>',
  });
};

// Releases R3: the lineup of live models in named slots.
FRAMES['R3-lineup'] = async () => {
  quiet();
  const cards = SLOTS.map((s, i) => `<div class="mk-slot${i === 0 ? ' sel' : ''}">
      <span class="mk-k">${s.slot}</span><span class="name">${s.name}</span>
      <div class="kv"><span>Users</span><b>${s.users}</b><span>Margin</span><b>${s.margin}</b><span>Posted to</span><b>${s.front}</b></div>
      <span class="mk-muted" style="font-weight:700">${s.note}</span>
      <div><span class="mk-muted" style="font-size:11px;font-weight:800">Age</span><div class="age"><i style="width:${s.age}%"></i></div></div>
      <div class="acts">${i === 0 ? '<span class="mk-btn">Ship 6.1 update</span><span class="mk-btn ghost">Route users to 6 Mini</span>' : i === 3 ? '<span class="mk-btn ghost">Release it</span><span class="mk-btn ghost">Keep it inside</span>' : '<span class="mk-btn ghost">Retire</span>'}</div>
    </div>`).join('');
  const body = `<div class="reveal-cols" style="--cols: 1fr 250px">
    <div class="reveal-col"><div class="sec">Four slots · live models and where each one works</div><div class="mk-slots">${cards}</div></div>
    <div class="reveal-col">
      <div class="sec">Your team</div>
      ${say('CFO', 'Uneasy', 'Two Kestrels shipped one round apart split the launch buzz. Space them two.')}
      ${say('Head of Research', 'Eager', 'Route 6 to Mini and its compute trains 7.')}
      ${say('Head of Safety', 'Alarmed', 'The preview is the one I worry about, and it isn\'t even out.')}
    </div>
  </div>`;
  dialog({
    kick: 'Era 5 · The intelligence explosion', title: 'Your lineup',
    side: '<div class="mk-pill">4 of 4 slots live · serving uses 38% of compute</div>',
    body,
    foot: '<span class="note">A slot frees when you retire a model or route its users to a newer one.</span><span class="acts"><span class="mk-btn">Done</span></span>',
  });
};

// ---------- Phone frames (run on the phone-redesign build) ----------

function phone(left, right) {
  document.querySelectorAll('.mk-ph').forEach((n) => n.remove());
  const node = document.createElement('div');
  node.className = 'mk-ph';
  node.innerHTML = `<div class="half">${left}</div><div class="half">${right}</div>`;
  document.body.append(node);
}

FRAMES['ph-B-board'] = async () => {
  quiet();
  const roomy = document.documentElement.classList.contains('pn-roomy');
  const f = FRONTS[1];
  const rows = FRONTS.map((x, i) => `<div class="mk-front${i === 1 ? ' sel' : ''}"><h3>${x.name}<small>${x.band}</small></h3>${tug(x)}</div>`).join('');
  phone(
    `<div class="titlebar"><span class="back">‹</span><div><div class="mk-k">Era 6 · check 3 of 6</div><h2>The world board</h2></div></div>
     <div class="mk-fronts grow">${rows}</div>`,
    `<div class="row" style="justify-content:space-between;align-items:center"><span class="mk-chip ok">Lead 1.8 months</span><span class="mk-weeks"><i class="done"></i><i class="done"></i><i class="now"></i><i></i><i></i><i class="peak"></i></span></div>
     <div class="detail"><span class="name">${f.name}</span><span class="mk-muted">${f.what}</span>
       <div class="kv"><span>You</span><b>${f.band}</b><span>Now</span><b>${f.stat}</b><span>Next lab</span><b>OpenBrain, 2 marks back</b><span>Posted</span><b>${f.posted.join(', ')}</b></div>
       <span>${f.risk}</span></div>
     ${roomy ? say('Policy and Comms', 'Uneasy', 'We lead three fronts. That makes us the lab everyone aims at.') : ''}
     <div class="grow"></div>
     <div class="row"><span class="mk-btn ghost">Post a model</span><span class="mk-btn">Spend an action</span></div>`,
  );
};

FRAMES['ph-R3-lineup'] = async () => {
  quiet();
  const roomy = document.documentElement.classList.contains('pn-roomy');
  const s = SLOTS[0];
  phone(
    `<div class="titlebar"><span class="back">‹</span><div><div class="mk-k">4 of 4 slots live</div><h2>Your lineup</h2></div></div>
     <div class="slotlist grow">${SLOTS.map((x, i) => `<div class="slotrow${i === 0 ? ' sel' : ''}"><b>${x.name}</b><span class="mk-chip">${x.slot}</span><span class="mk-muted">${x.users} · ${x.front}</span><span>${x.margin}</span></div>`).join('')}</div>`,
    `<div class="detail"><span class="mk-k">${s.slot}</span><span class="name">${s.name}</span>
       <div class="kv"><span>Users</span><b>${s.users}</b><span>Margin</span><b>${s.margin}</b><span>Posted to</span><b>${s.front}</b></div>
       <span class="mk-muted">${s.note}</span><div class="age" style="height:7px;border-radius:4px;background:color-mix(in oklab,var(--ink) 7%,transparent)"><i style="display:block;height:100%;width:70%;background:color-mix(in oklab,var(--wood) 55%,var(--paper))"></i></div></div>
     ${say('CFO', 'Uneasy', 'Two Kestrels one round apart split the buzz.')}
     ${roomy ? say('Head of Research', 'Eager', 'Route 6 to Mini and its compute trains 7.') : ''}
     <div class="grow"></div>
     <div class="row"><span class="mk-btn ghost">Route to 6 Mini</span><span class="mk-btn">Ship 6.1</span></div>`,
  );
};

FRAMES['ph-C-offer'] = async () => {
  quiet();
  setHud({ era: 4, eraName: 'The gigawatt race', date: 'Jun 2026', week: 'Round 6' });
  const layer = document.createElement('div');
  layer.className = 'event-layer';
  layer.innerHTML = `<div class="ev-card mk-evcard"><div class="mk-k">End of era 4 · The President calls</div>
    <h2 style="margin:2px 0 0;font-size:22px;font-weight:300">The national Project</h2>
    <div class="mk-opts">
      <div class="mk-opt sel"><b>Join the Project</b>About 3× compute with OpenBrain; a government board votes on every release.</div>
      <div class="mk-opt"><b>Stay independent</b>Your schedule; the "supply chain risk" label and its lawsuits.</div>
      <div class="mk-opt"><b>Lead a consortium</b>Shared testers with the West; the only path that binds Qilin. Slowest.</div>
    </div></div>`;
  document.querySelector('#overlay').append(layer);
};


// ---------- The world map (owner pick 2026-10-27: B's world board drawn as a contested map, like Plague Inc.) ----------

const shares = (id) => `<div class="mk-shares">${REGIONS[id].shares.map(([l, p]) => `<div><span>${LABS[l].name}</span><span class="bar"><i style="width:${p}%;background:${LABS[l].color}"></i></span><b>${p}%</b></div>`).join('')}</div>`;
const regionCard = (id) => `<div class="mk-regioncard">
    <span class="mk-k">Contested · Brussels wants outside testers</span><h3>${REGIONS[id].name}</h3>
    ${shares(id)}
    <span class="mk-muted">OpenBrain launched here this round. Past 50% for anyone, the AI Office opens a probe.</span>
    <div class="mk-moves">
      <span><b>Launch Kestrel 6 Mini here</b>About +6% next checkpoint · a team action</span>
      <span><b>Accept Brussels' testers</b>Government backing; your next run waits a round</span>
      <span><b>Build a site in Spain</b>Compute in 2 rounds · $1.2B</span>
    </div></div>`;
const mapBar = () => `<div class="mk-mapbar">
    <div class="me"><span class="mk-k">Era 6 · checkpoint 3 of 6</span><b>You lead 2 of 9 regions</b><span class="mk-muted">Lead: 1.8 months over OpenBrain</span></div>
    <div class="mid">${legend()}
      <div class="mk-fill"><span>World attention</span><span class="bar"><i style="width:58%"></i><em style="left:25%"></em><em style="left:50%"></em><em style="left:75%"></em></span><span>58%</span></div></div>
    <div class="glob"><div><span>Compute</span><span class="mk-chip ok">Superior · 41% of the frontier</span></div><div><span>Security</span><span class="mk-chip warn">Behind · stops criminals, not states</span></div></div>
  </div>`;

FRAMES['M1-map'] = async () => {
  quiet();
  setHud({ eraName: 'The world stage', era: 6, date: 'Nov 2027', week: 'Checkpoint 3 of 6' });
  mapLayer(`<div class="mk-mapview withcard"><div class="stage">${mapSvg({ selected: 'eu' })}</div>
    <div class="mk-cpnote"><span class="mk-k">Checkpoint 3 · what moved</span>You took 4% of Europe and 3% of South Asia (ringed). Qilin's open model spread into Africa. The decisive month comes at checkpoint 6.</div>
    ${regionCard('eu')}${mapBar()}</div>`);
};

FRAMES['M2-map'] = async () => {
  quiet();
  setHud({ eraName: 'The world stage', era: 6, date: 'Nov 2027', week: 'Checkpoint 3 of 6' });
  const list = Object.entries(REGIONS).map(([id, r]) => `<div class="${id === 'eu' ? 'on' : ''}"><span>${r.name}</span><span class="stack">${r.shares.map(([l, p]) => `<i style="width:${p}%;background:${LABS[l].color}"></i>`).join('')}</span></div>`).join('');
  const layer = dialog({
    kick: 'Era 6 · The world stage · checkpoint 3 of 6', title: 'The world board', cls: 'wide',
    side: '<div class="mk-pill">You lead 2 of 9 regions · 1.8 months ahead</div>',
    body: `<div class="reveal-cols" style="--cols: 1fr 270px"><div class="reveal-col"><div class="sec">Who runs the world's AI, region by region</div>${mapSvg({ selected: 'eu' })}${legend()}</div>
      <div class="reveal-col"><div class="sec">Regions</div><div class="mk-regionlist">${list}</div>
      <div class="sec" style="margin-top:10px">Europe</div>${say('Policy and Comms', 'Uneasy', 'OpenBrain launched in Europe this round. Brussels wants testers from whoever it backs.')}</div></div>`,
    foot: '<span class="note">Tap a region to launch a model there, make a government deal or build a site. Regions move at each checkpoint.</span><span class="acts"><span class="mk-btn ghost">Launch in Europe</span><span class="mk-btn">Close</span></span>',
  });
  return layer;
};

FRAMES['ph-M1-map'] = async () => {
  quiet();
  setHud({ eraName: 'The world stage', era: 6, date: 'Nov 2027', week: 'Check 3 of 6' });
  mapLayer(`<div class="mk-mapview"><div class="stage">${mapSvg({ selected: null })}</div>${mapBar()}</div>`);
};

FRAMES['ph-M1-region'] = async () => {
  quiet();
  setHud({ eraName: 'The world stage', era: 6, date: 'Nov 2027', week: 'Check 3 of 6' });
  mapLayer(`<div class="mk-mapview split"><div class="stage">${mapSvg({ selected: 'eu', view: '360 20 360 250' })}</div>${mapBar()}</div>`);
  // The region card rides in an event layer, so the phone layout gives it the decision half and moves the HUD.
  const layer = document.createElement('div');
  layer.className = 'event-layer';
  layer.innerHTML = `<div class="ev-card mk-evcard">${regionCard('eu').replace('class="mk-regioncard"', 'class="mk-regioncard inline"')}</div>`;
  document.querySelector('#overlay').append(layer);
};

FRAMES['ph-A-office'] = FRAMES['A-office'];
FRAMES['ph-C-office'] = FRAMES['C-office'];

export async function frame(name) {
  await style();
  await FRAMES[name]();
  window.dispatchEvent(new Event('resize'));
  await sleep(400);
  return `ok ${name}`;
}
