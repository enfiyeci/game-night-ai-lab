// The board meeting as a video call (owner pick, round 2): the call rings over the office, the meeting plays with a
// private read of the room beside it, the seven votes are revealed one at a time, then the result dialog (4A) follows.
// mountMeeting(root, { step }) draws one still; playMeeting(root) runs the whole sequence with timing.
import { MEMBERS, EST, lean, READ, rangeBar, moodOf, portrait } from './board-data.js';

const byId = (id) => MEMBERS.find((x) => x.id === id);
const VOTE_ORDER = ['growth', 'safety', 'financier', 'trustee', 'sovereign', 'candor', 'security']; // swing seat last
const keeps = (id) => byId(id).vote >= 55;

// Each director on camera in their own room; flat props in the office's palette.
const SCENES = {
  growth: `<rect width="320" height="200" fill="color-mix(in oklab, var(--sky) 22%, var(--paper))"/>
    <rect x="190" y="20" width="110" height="120" rx="4" fill="color-mix(in oklab, var(--sky) 45%, var(--paper))"/><path d="M245,20 V140 M190,80 H300" stroke="var(--paper)" stroke-width="4"/>
    <path d="M30,200 C34,150 44,110 40,60" stroke="color-mix(in oklab, var(--wood) 60%, var(--ink))" stroke-width="5" fill="none"/>
    <path d="M40,60 q-30,-6 -44,10 M40,60 q26,-14 44,-4 M40,60 q-10,-26 -30,-30 M40,60 q18,-24 34,-22" stroke="var(--teal)" stroke-width="7" fill="none" stroke-linecap="round"/>
    <rect x="96" y="30" width="16" height="130" rx="8" fill="var(--coral)" transform="rotate(8 104 95)"/>`,
  financier: `<rect width="320" height="200" fill="color-mix(in oklab, var(--wood) 55%, var(--ink))"/>
    <path d="M0,40 H320 M0,120 H320" stroke="color-mix(in oklab, var(--wood) 45%, var(--ink))" stroke-width="3"/>
    <rect x="200" y="30" width="96" height="66" fill="var(--paper)"/><rect x="206" y="36" width="84" height="54" fill="color-mix(in oklab, var(--ink) 80%, var(--sky))"/>
    <g fill="color-mix(in oklab, var(--sky) 60%, var(--paper))">${[0, 1, 2, 3].map((i) => `<rect x="${214 + i * 19}" y="58" width="13" height="26"/>`).join('')}</g>
    <circle cx="44" cy="80" r="26" fill="color-mix(in oklab, var(--sky) 55%, var(--ink))"/><path d="M26,72 q18,8 36,0 M24,88 q20,-6 40,2" stroke="var(--teal)" stroke-width="4" fill="none"/>`,
  sovereign: `<rect width="320" height="200" fill="color-mix(in oklab, var(--coral) 30%, var(--wood))"/>
    <rect width="320" height="120" fill="color-mix(in oklab, var(--coral) 45%, var(--sky))"/>
    <g fill="color-mix(in oklab, var(--ink) 70%, var(--sky))">${[[20, 50], [60, 20], [96, 64], [150, 34], [196, 8], [232, 58], [270, 30]].map(([x, y]) => `<rect x="${x}" y="${y}" width="30" height="${140 - y}"/>`).join('')}</g>
    <path d="M0,120 H320" stroke="color-mix(in oklab, var(--ink) 50%, var(--wood))" stroke-width="6"/><path d="M107,0 V120 M213,0 V120" stroke="color-mix(in oklab, var(--ink) 55%, var(--wood))" stroke-width="5"/>`,
  safety: `<rect width="320" height="200" fill="color-mix(in oklab, var(--teal) 15%, var(--paper))"/>
    <rect x="30" y="18" width="260" height="120" rx="4" fill="var(--paper)" stroke="color-mix(in oklab, var(--ink) 30%, var(--paper))" stroke-width="3"/>
    <g stroke="color-mix(in oklab, var(--sky) 60%, var(--ink))" stroke-width="3" fill="none" stroke-linecap="round"><path d="M48,44 h60 M48,64 h90 M48,84 h40"/><path d="M160,110 L190,70 L220,90 L262,40"/></g>
    <text x="212" y="126" font-family="Caveat, cursive" font-size="34" font-weight="700" fill="var(--coral)">25%</text><ellipse cx="236" cy="116" rx="36" ry="20" fill="none" stroke="var(--coral)" stroke-width="3"/>`,
  candor: `<rect width="320" height="200" fill="color-mix(in oklab, var(--wood) 35%, var(--paper))"/>
    ${[20, 70, 120].map((y) => `<rect x="0" y="${y + 36}" width="320" height="6" fill="color-mix(in oklab, var(--wood) 70%, var(--ink))"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => `<rect x="${8 + i * 22 + (y % 3)}" y="${y + (i % 3) * 3}" width="${14 + (i % 2) * 4}" height="${36 - (i % 3) * 3}" fill="${['var(--coral)', 'var(--teal)', 'var(--sky)', 'var(--wood)', 'color-mix(in oklab, var(--ink) 70%, var(--paper))'][(i + y) % 5]}"/>`).join('')}`).join('')}`,
  security: `<rect width="320" height="200" fill="color-mix(in oklab, var(--sky) 45%, var(--ink))"/>
    <path d="M40,200 V20" stroke="color-mix(in oklab, var(--wood) 60%, var(--paper))" stroke-width="4"/>
    <g transform="translate(42,24)">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect y="${i * 11}" width="80" height="11" fill="${i % 2 ? 'var(--paper)' : 'var(--coral)'}"/>`).join('')}<rect width="34" height="44" fill="color-mix(in oklab, var(--sky) 60%, var(--ink))"/></g>
    <circle cx="250" cy="70" r="36" fill="color-mix(in oklab, var(--wood) 55%, var(--paper))"/><circle cx="250" cy="70" r="28" fill="color-mix(in oklab, var(--sky) 40%, var(--ink))"/><path d="M234,76 l16,-18 l16,18 z" fill="color-mix(in oklab, var(--wood) 55%, var(--paper))"/>`,
  trustee: `<rect width="320" height="200" fill="color-mix(in oklab, var(--cream) 70%, var(--paper))"/>
    <rect x="160" y="16" width="140" height="120" rx="6" fill="color-mix(in oklab, var(--teal) 30%, var(--paper))"/><path d="M230,16 V136 M160,76 H300" stroke="var(--paper)" stroke-width="5"/>
    <g fill="var(--teal)"><ellipse cx="190" cy="120" rx="30" ry="18"/><ellipse cx="270" cy="112" rx="34" ry="24"/></g>
    <rect x="40" y="96" width="36" height="40" rx="6" fill="var(--coral)"/><path d="M58,96 q-18,-40 -6,-60 M58,96 q10,-40 26,-50 M58,96 q2,-30 -2,-56" stroke="var(--teal)" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  ceo: `<rect width="320" height="200" fill="color-mix(in oklab, var(--teal) 55%, var(--paper))"/>
    <rect x="0" y="0" width="320" height="110" fill="color-mix(in oklab, var(--sky) 18%, var(--paper))"/>
    <rect x="200" y="20" width="90" height="70" fill="color-mix(in oklab, var(--ink) 85%, var(--sky))"/><rect x="36" y="30" width="44" height="58" fill="var(--paper)" stroke="var(--wood)" stroke-width="4"/>`,
};

function tile(id, { vote = null, speaking = false, dim = false } = {}) {
  const x = id === 'ceo' ? { id: 'ceo', name: 'You' } : byId(id);
  const mood = id === 'ceo' ? 'flat' : moodOf(vote ? x.vote : x.s);
  const card = vote ? `<div class="mt-card ${vote}">${vote === 'keep' ? 'Keep' : vote === 'remove' ? 'Remove' : '…'}</div>` : '';
  return `<div class="mt-tile ${speaking ? 'speaking' : ''} ${dim ? 'dim' : ''} ${vote ? 'voted ' + vote : ''}" data-id="${id}">
    <svg class="mt-scene" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENES[id]}</svg>
    <div class="mt-person">${portrait(id, 190, mood)}</div>
    <div class="mt-name">${x.name}</div>${card}
  </div>`;
}

const meter = (votes) => {
  const cells = VOTE_ORDER.map((id, i) => `<i class="${votes[id] ?? ''}" style="--i:${i}"></i>`).join('');
  const k = Object.values(votes).filter((v) => v === 'keep').length;
  const r = Object.values(votes).filter((v) => v === 'remove').length;
  return `<div class="mt-meter"><div class="mt-meter-cells">${cells}</div><div class="mt-meter-n"><b class="k">${k}</b> keep · <b class="r">${r}</b> remove · <span>4 keep you</span></div></div>`;
};

function rail(step) {
  const swing = ['sovereign', 'security', 'candor', 'trustee'];
  const deal = step === 'room'
    ? `<div class="mt-block mt-deal"><div class="mt-rk">Offer deals before the vote · any number</div>
        <button class="mt-opt"><b>Security hawk</b>Security above 40 by next era</button>
        <button class="mt-opt"><b>Mission trustee</b>No launches until public trust recovers</button>
        <button class="mt-opt"><b>Safety chair</b>Safety compute back to target next era</button>
        <button class="mt-opt quiet">No deal. Let the numbers talk.</button>
        <p class="mt-fine">Each deal you break later costs you that member for good.</p></div>`
    : `<div class="mt-block mt-deal made"><div class="mt-rk">Deals made · 1</div><p><b>Security hawk</b> Security above 40 by next era.</p><p class="mt-fine">He moved your way. By how much, your staff can’t say.</p></div>`;
  const est = (id) => (step !== 'room' && id === 'security' ? 'security-after' : id);
  return `<aside class="mt-rail">
    <div class="mt-rail-hd"><span class="mt-rec"></span>Your notes · only you see this</div>
    <div class="mt-block"><div class="mt-rk">Staff read <span>· can be wrong</span></div>
      <div class="mt-read"><b>${READ.lo} to ${READ.hi}</b> keep you <span>· you need 4</span></div></div>
    <div class="mt-block"><div class="mt-rk">What they’ll raise</div>
      <ul class="mt-issues"><li class="down">Safety share under target <span>Safety chair</span></li><li class="down">Public trust falling <span>Trustee</span></li><li class="up">Revenue up <span>Money seats</span></li><li class="up">Washington warm <span>Security hawk</span></li></ul></div>
    <div class="mt-block"><div class="mt-rk">Could go either way</div>
      ${swing.map((id) => `<div class="mt-swing">${portrait(id, 26, moodOf(byId(id).s))}<span>${byId(id).short}</span>${rangeBar(est(id), 118)}</div>`).join('')}
      <div class="mt-side"><span class="mt-dot"></span><b>Candor</b> and <b>Trustee</b> are messaging each other</div></div>
    ${deal}
  </aside>`;
}

const VOTE_LINES = {
  growth: 'Keep. Obviously. Can we be quick, I have a flight.',
  safety: 'Remove. I said twenty-five. I have said it for two eras.',
  financier: 'Keep. The build-out needs a steady hand.',
  trustee: 'Remove. I kept you last time. I read the news this time.',
  sovereign: 'Keep. For now.',
  candor: 'Remove. I keep learning things from the press first.',
  security: 'Keep. Washington likes you. That is most of my reason.',
};

const CAPTIONS = {
  room: ['safety', 'Twenty-one percent on safety. The target is twenty-five. We said this last era, and the era before.'],
  statement: ['security', 'Forty by next era. I will be counting, and so will some people in Washington.'],
};

// step: ring | room | statement | vote-N (N votes revealed, 0-7) | fails
export function mountMeeting(root, { step = 'room', officeSvg = null } = {}) {
  root.className = `mt-root step-${step.replace(/-\d$/, '')}`;
  if (step === 'ring') {
    root.innerHTML = `<div class="mt-office">${officeSvg ?? ''}</div><div class="mt-letterbox top"></div><div class="mt-letterbox bottom"></div>
      <div class="mt-ring">
        <div class="mt-ring-faces">${MEMBERS.map((x, i) => `<span style="--i:${i}">${portrait(x.id, 64, moodOf(x.s))}</span>`).join('')}</div>
        <div class="mt-ring-k">Incoming video call</div>
        <div class="mt-ring-t">Board of directors</div>
        <div class="mt-ring-s">Special meeting · end of era 3<br><b>Motion: remove the chief executive</b></div>
        <div class="mt-ring-b"><span class="decline" title="The board will minute that you declined.">Decline</span><span class="join">Join</span></div>
      </div>`;
    return;
  }
  const n = step.startsWith('vote-') ? Number(step.slice(5)) : step === 'fails' ? 7 : -1;
  const votes = {};
  VOTE_ORDER.slice(0, Math.max(0, n)).forEach((id) => { votes[id] = keeps(id) ? 'keep' : 'remove'; });
  const pending = n >= 0 && n < 7 ? VOTE_ORDER[n] : null;
  const last = n > 0 ? VOTE_ORDER[n - 1] : null;
  const cap = n > 0 ? [last, VOTE_LINES[last]] : n === 0 ? ['growth', ''] : step === 'statement' ? CAPTIONS.statement : CAPTIONS.room;
  const speakingId = n >= 0 ? (n === 7 ? 'security' : pending) : cap[0];
  const ids = [...MEMBERS.map((x) => x.id), 'ceo'];
  const head = n >= 0
    ? `<div class="mt-top"><div class="mt-top-t">${step === 'fails' ? 'The motion fails' : 'Voting'}</div>${meter(votes)}</div>`
    : `<div class="mt-top"><div class="mt-top-t">Motion: remove the chief executive</div>
        <div class="mt-lean"><span class="k" style="flex:${READ.sure}">${READ.sure} keep</span><span class="u" style="flex:${READ.maybe}">${READ.maybe} undecided</span><span class="r" style="flex:${READ.against}">${READ.against}</span></div>
        <div class="mt-clock"><span class="mt-rec"></span>Minutes are being recorded · vote opens in <b>0:${step === 'statement' ? '04' : '38'}</b></div></div>`;
  root.innerHTML = `<div class="mt-call">
    ${head}
    <div class="mt-grid">${ids.map((id) => tile(id, {
      vote: id === 'ceo' ? null : votes[id] ?? (id === pending ? 'pending' : null),
      speaking: id === speakingId,
      dim: n >= 0 && id !== 'ceo' && !votes[id] && id !== pending,
    })).join('')}</div>
    <div class="mt-caption">${n === 0 ? '<b>Chair of the board</b>The motion is on the floor. Votes in turn, please.' : `<b>${byId(cap[0]).name}</b>${cap[1]}`}</div>
    <div class="mt-bar"><span class="mt-btn"><svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg></span><span class="mt-btn"><svg viewBox="0 0 24 24"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg></span><span class="mt-btn end">Leave</span></div>
    ${step === 'fails' ? '<div class="mt-flash"><b>4 to 3</b><span>You stay.</span></div>' : ''}
  </div>${rail(step)}`;
}

// The full sequence for the artifact: timings in ms from the start. Reduced motion jumps straight to each still.
export const TIMELINE = [
  ['ring', 0], ['room', 3200], ['statement', 9000],
  // Each vote: about 2.4 s with the next voter thinking ("…") in between; the swing seat gets a long pause.
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => [`vote-${i}`, 12500 + i * 2400]),
  ['vote-7', 12500 + 6 * 2400 + 4200],
  ['fails', 12500 + 6 * 2400 + 6400],
  ['result', 12500 + 6 * 2400 + 10000],
];
