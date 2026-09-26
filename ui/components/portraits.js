// Director portraits in the office's drawing language (board UI plan Task 4, spec §6). Ported verbatim from
// docs/design/mockups/board/board-data.js (K2: paper skin mixes, 0.8 ink-30% outline, round heads).
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

// The face shows the staff read's lean, never true support (spec §6).
const LEAN_MOOD = { with: 'happy', leanWith: 'flat', leanAway: 'worried', against: 'cross' };
export const moodForLean = (lean) => LEAN_MOOD[lean] ?? 'flat';
