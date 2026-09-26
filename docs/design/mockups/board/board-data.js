// Shared board data and portraits for the board mockups (board-mock.js, meeting.js). Numbers: trace.mjs speed 7.
// ---- the board, as the sim has it (sim/board.js order), at that moment ----------------------------------------
export const LINE = 55;
export const MEMBERS = [
  { id: 'growth', name: 'Growth investor', short: 'Growth', kind: 'money', cares: 'Revenue growth', s: 94, d: +3, why: 'Revenue grew again this turn.', last: 80, vote: 97 },
  { id: 'financier', name: 'Infrastructure financier', short: 'Financier', kind: 'money', cares: 'Valuation and the build-out', s: 68, d: +2, why: 'Your valuation went up.', last: 65, vote: 70 },
  { id: 'sovereign', name: 'Sovereign fund', short: 'Sovereign', kind: 'money', cares: 'Cash that lasts', s: 56, d: +3, why: 'Your cash now lasts over a year.', last: 50, vote: 59 },
  { id: 'safety', name: 'Safety chair', short: 'Safety', kind: 'oversight', cares: 'Safety compute and what ships', s: 21, d: -3, why: 'Safety gets less than this era’s 25% share.', last: 33, vote: 18 },
  { id: 'candor', name: 'Candor watchdog', short: 'Candor', kind: 'oversight', cares: 'Being told the truth', s: 51, d: 0, why: 'Nothing new this turn.', last: 54, vote: 51 },
  { id: 'security', name: 'Security hawk', short: 'Security', kind: 'oversight', cares: 'Security and Washington', s: 56, d: +2, why: 'Washington is warm to you.', last: 55, vote: 59 },
  { id: 'trustee', name: 'Mission trustee', short: 'Trustee', kind: 'oversight', cares: 'Public trust and the constitution', s: 53, d: -3, why: 'Public trust keeps falling.', last: 64, vote: 49 },
];
export const backs = (x) => x >= LINE;
export const YES = MEMBERS.filter((x) => backs(x.s)).length; // 4

// Words for support, if the owner picks words: firm / shaky on your side, close / lost against you.
export function band(s) {
  if (s >= 65) return { word: 'Firm', cls: 'firm', side: 'Backs you' };
  if (s >= LINE) return { word: 'Shaky', cls: 'shaky', side: 'Backs you' };
  if (s >= 45) return { word: 'Close', cls: 'close', side: 'Against you' };
  return { word: 'Lost', cls: 'lost', side: 'Against you' };
}
export const moodOf = (s) => (s >= 65 ? 'happy' : s >= LINE ? 'flat' : s >= 45 ? 'worried' : 'cross');

// ---- portraits in the office's drawing language (K2: paper skin mixes, 0.8 ink-30% outline, round heads) ------
export const OUT = 'stroke:color-mix(in oklab, var(--ink) 30%, transparent);stroke-width:.8';
export const SKIN = [
  'color-mix(in oklab, var(--wood) 26%, var(--paper))',
  'color-mix(in oklab, var(--wood) 52%, var(--paper))',
  'color-mix(in oklab, var(--wood) 80%, var(--ink) 20%)',
  'color-mix(in oklab, var(--wood) 55%, var(--ink))',
];
export const HAIR = {
  dark: 'color-mix(in oklab, var(--ink) 85%, var(--wood))',
  brown: 'color-mix(in oklab, var(--wood) 45%, var(--ink))',
  grey: 'color-mix(in oklab, var(--ink) 30%, var(--paper))',
  white: 'color-mix(in oklab, var(--cream) 60%, var(--paper))',
  auburn: 'color-mix(in oklab, var(--coral) 58%, var(--ink))',
};
export const LOOK = {
  growth: { skin: 1, hair: 'brown', cut: 'short', top: 'var(--sky)', shirt: 'var(--paper)', vest: true },
  financier: { skin: 0, hair: 'grey', cut: 'side', top: 'color-mix(in oklab, var(--ink) 82%, var(--sky))', shirt: 'var(--paper)', tie: 'var(--wood)' },
  sovereign: { skin: 2, hair: 'dark', cut: 'bun', top: 'var(--coral)', shirt: 'color-mix(in oklab, var(--cream) 50%, var(--paper))' },
  safety: { skin: 3, hair: 'dark', cut: 'curly', top: 'var(--teal)', shirt: 'color-mix(in oklab, var(--teal) 30%, var(--paper))', glasses: true },
  candor: { skin: 0, hair: 'auburn', cut: 'long', top: 'color-mix(in oklab, var(--sky) 60%, var(--ink))', shirt: 'var(--paper)' },
  security: { skin: 1, hair: 'grey', cut: 'buzz', top: 'color-mix(in oklab, var(--ink) 88%, var(--teal))', shirt: 'var(--paper)', tie: 'color-mix(in oklab, var(--sky) 70%, var(--ink))', pin: true },
  trustee: { skin: 2, hair: 'white', cut: 'side', top: 'color-mix(in oklab, var(--wood) 70%, var(--paper))', shirt: 'color-mix(in oklab, var(--cream) 40%, var(--paper))', glasses: true },
  ceo: { skin: 0, hair: 'dark', cut: 'short', top: 'color-mix(in oklab, var(--ink) 85%, var(--sky))', shirt: 'var(--paper)', tie: 'var(--coral)' },
};

export function hairShape(cut, fill) {
  const st = `style="fill:${fill};${OUT}"`;
  switch (cut) {
    case 'short': return `<path d="M-13.6,-5 Q-15,-21.5 0,-21.5 Q14.5,-21.5 13.6,-5 L11.4,-7.5 Q10,-14.5 1,-15 Q-5,-15 -8,-12.5 Q-11,-10 -11.4,-6 Z" ${st}/>`;
    case 'side': return `<path d="M-13.6,-4 Q-15,-21 -1,-21.5 Q14.5,-21.5 13.6,-4 L11.6,-7 Q11,-13 4,-15.2 L-6,-15 Q-10.5,-12 -11.6,-6 Z" ${st}/><path d="M-3,-21 Q-4,-17 -6,-15" style="fill:none;stroke:color-mix(in oklab, var(--ink) 35%, transparent);stroke-width:.7"/>`;
    case 'bun': return `<circle cx="0" cy="-22" r="6.2" ${st}/><path d="M-13.8,-4 Q-15,-21 0,-21 Q15,-21 13.8,-4 L11.8,-8 Q9,-15 0,-15.5 Q-9,-15 -11.8,-8 Z" ${st}/>`;
    case 'curly': return [[-11, -12], [-6, -18], [0, -20], [6, -18], [11, -12], [-13, -5], [13, -5]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.6" ${st}/>`).join('');
    case 'long': return `<path d="M-14.2,-5 Q-15.5,-22 0,-22 Q15.5,-22 14.2,-5 L15.2,11 L9.6,11 L10.6,-8 Q8,-14.8 0,-15.2 Q-8,-14.8 -10.6,-8 L-9.6,11 L-15.2,11 Z" ${st}/>`;
    case 'buzz': return `<path d="M-13.2,-7.5 Q-13.5,-20 0,-20 Q13.5,-20 13.2,-7.5 Q8,-14.5 0,-14.8 Q-8,-14.5 -13.2,-7.5 Z" ${st}/>`;
    case 'swept': return `<path d="M-13.6,-4 Q-16,-19 -3,-21.5 Q12,-23 14.2,-9 Q15,-5 13.6,-3 L11.8,-7 Q9,-13 -2,-13.8 Q-9,-13 -11.6,-6 Z" ${st}/>`;
    default: return '';
  }
}

export function faceMarks(mood) {
  const ink = 'var(--ink)';
  const brow = (d) => `<path d="${d}" style="fill:none;stroke:color-mix(in oklab, var(--ink) 92%, var(--wood));stroke-width:1.3;stroke-linecap:round"/>`;
  const eyes = `<ellipse cx="-4.6" cy="-5" rx="1.6" ry="2.1" style="fill:${ink}"/><ellipse cx="4.6" cy="-5" rx="1.6" ry="2.1" style="fill:${ink}"/>
    <circle cx="-4.1" cy="-5.8" r=".55" style="fill:var(--paper)"/><circle cx="5.1" cy="-5.8" r=".55" style="fill:var(--paper)"/>`;
  const mouth = (d) => `<path d="${d}" style="fill:none;stroke:${ink};stroke-width:1.3;stroke-linecap:round"/>`;
  const cheeks = '<ellipse cx="-8" cy="0" rx="2.2" ry="1.3" style="fill:color-mix(in oklab, var(--coral) 35%, transparent)"/><ellipse cx="8" cy="0" rx="2.2" ry="1.3" style="fill:color-mix(in oklab, var(--coral) 35%, transparent)"/>';
  switch (mood) {
    case 'happy': return eyes + cheeks + brow('M-7,-9.6 L-2.6,-10') + brow('M2.6,-10 L7,-9.6') + mouth('M-4.2,1.6 Q0,5.4 4.2,1.6');
    case 'flat': return eyes + brow('M-7,-9.6 L-2.6,-9.6') + brow('M2.6,-9.6 L7,-9.6') + mouth('M-3.4,3 L3.4,3');
    case 'worried': return eyes + brow('M-7,-9 L-2.6,-10.6') + brow('M2.6,-10.6 L7,-9') + mouth('M-3.6,3.8 Q0,2 3.6,3.8');
    case 'cross': return eyes + brow('M-7,-11 L-2.4,-8.8') + brow('M2.4,-8.8 L7,-11') + mouth('M-4,4.6 Q0,1.4 4,4.6');
    default: return eyes;
  }
}

// A head-and-shoulders portrait. viewBox is centred on the face.
export function portrait(id, size = 40, mood = 'flat') {
  const L = LOOK[id];
  const skin = SKIN[L.skin];
  const shade = `color-mix(in oklab, ${skin} 85%, var(--ink))`;
  const hair = HAIR[L.hair];
  const back = L.cut === 'long' ? hairShape('long', hair) : '';
  return `<svg class="portrait" width="${size}" height="${size}" viewBox="-26 -30 52 52" aria-hidden="true">
    ${back}
    <path d="M-24,24 Q-24,11 -10,8.6 L10,8.6 Q24,11 24,24 Z" style="fill:${L.top};${OUT}"/>
    ${L.vest ? `<path d="M-6,8.6 L-9,24 L-15,24 Q-15,12 -9,9.4 Z M6,8.6 L9,24 L15,24 Q15,12 9,9.4 Z" style="fill:color-mix(in oklab, var(--sky) 55%, var(--paper))"/>` : ''}
    <path d="M-5.6,8.6 L0,17 L5.6,8.6 Z" style="fill:${L.shirt}"/>
    ${L.tie ? `<path d="M-1.6,10.5 L1.6,10.5 L2.4,20 L0,22.5 L-2.4,20 Z" style="fill:${L.tie}"/>` : ''}
    ${L.pin ? '<circle cx="-12" cy="14" r="1.4" style="fill:var(--coral)"/>' : ''}
    <rect x="-4" y="2" width="8" height="8" rx="3" style="fill:${shade}"/>
    <ellipse cx="-12.6" cy="-4" rx="2.4" ry="3.2" style="fill:${shade};${OUT}"/>
    <ellipse cx="12.6" cy="-4" rx="2.4" ry="3.2" style="fill:${shade};${OUT}"/>
    <circle cx="0" cy="-5" r="12.8" style="fill:${skin};${OUT}"/>
    ${L.cut === 'long' ? hairShape('buzz', hair).replace('-7.5 Q-13.5', '-5 Q-14.5') : hairShape(L.cut, hair)}
    ${faceMarks(mood)}
    ${L.glasses ? '<g style="fill:none;stroke:var(--ink);stroke-width:.9"><circle cx="-4.6" cy="-5" r="3.5"/><circle cx="4.6" cy="-5" r="3.5"/><path d="M-1.1,-5.3 Q0,-6.2 1.1,-5.3"/></g>' : ''}
  </svg>`;
}


// ---- what the player is allowed to see: an estimate, never the number (owner, 2026-09-26) ----------------------
// Proposed rule for the build: the shown range is the member's support plus or minus a spread, with its centre nudged
// by your staff's misread. Spread 5 at base, wider when the member moved a lot this turn, and wider still for members
// who keep their cards close (the candor watchdog). A range that straddles the hidden cut-off is a real toss-up.
// The cut-off itself (55) is never drawn.
export const EST = {
  growth: [84, 100], financier: [58, 76], sovereign: [47, 65], safety: [12, 30],
  candor: [38, 64], security: [49, 65], trustee: [41, 59],
  'security-after': [50, 74], // after the deal: moved your way, and the read got wider
};
export function lean(id) {
  const [lo, hi] = EST[id];
  if (lo >= LINE) return { word: 'With you', cls: 'with' };
  if (hi < LINE) return { word: 'Against you', cls: 'against' };
  return (lo + hi) / 2 >= LINE ? { word: 'Leaning your way', cls: 'lean-with' } : { word: 'Leaning away', cls: 'lean-away' };
}
export const READ = { sure: 2, maybe: 4, against: 1, lo: 2, hi: 6 }; // "between 2 and 6 would keep you"

// A 0-100 track with a soft band where the member probably is. No threshold line, no digits.
export function rangeBar(id, width = 150) {
  const [lo, hi] = EST[id];
  return `<span class="rb ${lean(id).cls}" style="width:${width}px"><i style="left:${lo}%;width:${hi - lo}%"></i></span>`;
}

// What moves each member, straight from updateBoard in sim/board.js, in player words.
export const MOVES = {
  growth: { wants: 'Revenue up, every turn', hurts: 'A turn where revenue falls', issues: ['revenue'] },
  financier: { wants: 'A rising valuation', hurts: 'Valuation slipping; a missed compute promise', issues: ['valuation', 'promise'] },
  sovereign: { wants: 'A year or more of cash in the bank', hurts: 'Running short of cash', issues: ['cash'] },
  safety: { wants: 'Safety compute at this era’s target', hurts: 'Ignoring a hazard; safety under target', issues: ['safety'] },
  candor: { wants: 'Being told everything, first', hurts: 'Hidden problems coming out; leaks; broken promises', issues: ['honesty', 'promise'] },
  security: { wants: 'Friends in Washington, tight security', hurts: 'Washington cooling; weak security', issues: ['washington', 'security'] },
  trustee: { wants: 'Public trust, the constitution intact', hurts: 'Public trust falling; hard lines dropped', issues: ['trust', 'constitution'] },
};

export const QUOTES = {
  growth: 'Revenue up again. I’m a keep, obviously. Can we go faster?',
  financier: 'The build-out story is good. Keep the story good.',
  sovereign: 'Cash lasts a year now. Ask me again in a year.',
  safety: 'Twenty-one percent. The target is twenty-five. I have a slide.',
  candor: 'I’ll decide in the room. I always do.',
  security: 'Washington likes you, so I like you. That can change by Thursday.',
  trustee: 'I kept you last time. I read the news this time.',
};
