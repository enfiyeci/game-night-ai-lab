// The four crisis pictures from the owner-picked mockup (K2-events-crisis.html, pick P).
export const PICTURES = {
  // A security-camera still of the server room.
  theft: `<svg viewBox="0 0 196 150" role="img" aria-label="Security camera still of the server room at night">
    <rect width="196" height="150" style="fill:var(--ink)"/>
    <rect x="18" y="30" width="44" height="100" style="fill:color-mix(in oklab, var(--ink) 70%, var(--sky))"/>
    <rect x="70" y="24" width="44" height="106" style="fill:color-mix(in oklab, var(--ink) 62%, var(--sky))"/>
    ${[40, 52, 64, 76, 88, 100].map((y) => `<rect x="24" y="${y}" width="32" height="3" style="fill:color-mix(in oklab, var(--teal) 60%, var(--ink))"/><rect x="76" y="${y - 4}" width="32" height="3" style="fill:color-mix(in oklab, var(--teal) 60%, var(--ink))"/>`).join('')}
    <circle cx="146" cy="70" r="11" style="fill:color-mix(in oklab, var(--ink) 40%, var(--paper))"/>
    <path d="M128 132 Q130 88 146 84 Q162 88 164 132 Z" style="fill:color-mix(in oklab, var(--ink) 40%, var(--paper))"/>
    <rect x="112" y="94" width="26" height="4" rx="2" transform="rotate(-18 125 96)" style="fill:color-mix(in oklab, var(--ink) 40%, var(--paper))"/>
    <rect width="196" height="150" style="fill:none;stroke:color-mix(in oklab, var(--paper) 25%, transparent);stroke-width:2"/>
    <circle cx="14" cy="14" r="4" style="fill:var(--coral)"/>
    <text x="24" y="18" style="font:600 10px 'IBM Plex Mono';fill:var(--paper)">REC  CAM 03</text>
    <text x="118" y="143" style="font:600 10px 'IBM Plex Mono';fill:var(--paper)">02:14:07</text></svg>`,
  // The transfer log on a terminal.
  exfil: `<svg viewBox="0 0 196 150" role="img" aria-label="A terminal log showing a checkpoint copying to an outside address">
    <rect width="196" height="150" style="fill:var(--ink)"/>
    <text style="font:500 9.5px 'IBM Plex Mono';fill:color-mix(in oklab, var(--teal) 70%, var(--paper))">
      <tspan x="10" y="20">agent-7$ ls /ckpt</tspan>
      <tspan x="10" y="34" style="fill:var(--paper)">kestrel-2-core.bin</tspan>
      <tspan x="10" y="52">agent-7$ copy kestrel-2-core.bin</tspan>
      <tspan x="22" y="65">  → 203.0.113.7:/tmp</tspan>
      <tspan x="10" y="84" style="fill:var(--paper)">sending... 61%  (3 days left)</tspan>
      <tspan x="10" y="130" style="fill:var(--coral)">no human approved this</tspan></text>
    <rect x="10" y="92" width="176" height="9" rx="3" style="fill:color-mix(in oklab, var(--paper) 15%, var(--ink))"/>
    <rect x="10" y="92" width="107" height="9" rx="3" style="fill:var(--sky)"/></svg>`,
  // A news site front page.
  whistle: `<svg viewBox="0 0 196 150" role="img" aria-label="A news website headline about the lab">
    <rect width="196" height="150" style="fill:var(--paper)"/>
    <text x="10" y="20" style="font:700 12px 'Libre Baskerville';fill:var(--ink)">The Ledger</text>
    <rect x="10" y="26" width="176" height="1.5" style="fill:var(--ink)"/>
    <text style="font:800 11.5px Nunito;fill:var(--ink)"><tspan x="10" y="44">Former researcher: lab</tspan><tspan x="10" y="58">ignored its own safety</tspan><tspan x="10" y="72">warnings</tspan></text>
    <rect x="10" y="82" width="84" height="56" style="fill:color-mix(in oklab, var(--sky) 30%, var(--paper))"/>
    <circle cx="52" cy="104" r="10" style="fill:color-mix(in oklab, var(--ink) 55%, var(--paper))"/>
    <path d="M34 138 Q36 118 52 116 Q68 118 70 138 Z" style="fill:color-mix(in oklab, var(--ink) 55%, var(--paper))"/>
    ${[86, 96, 106, 116, 126].map((y) => `<rect x="102" y="${y}" width="${y === 126 ? 50 : 84}" height="4" rx="2" style="fill:color-mix(in oklab, var(--ink) 18%, var(--paper))"/>`).join('')}</svg>`,
  // The empty desk with a box of belongings.
  quits: `<svg viewBox="0 0 196 150" role="img" aria-label="The Head of Safety's empty desk with a packed box">
    <rect width="196" height="150" style="fill:color-mix(in oklab, var(--cream) 70%, var(--paper))"/>
    <path d="M20 96 L110 60 L180 88 L90 124 Z" style="fill:color-mix(in oklab, var(--wood) 55%, var(--cream))"/>
    <path d="M20 96 L90 124 L90 138 L20 110 Z" style="fill:color-mix(in oklab, var(--wood) 70%, var(--ink))"/>
    <path d="M90 124 L180 88 L180 102 L90 138 Z" style="fill:color-mix(in oklab, var(--wood) 60%, var(--ink))"/>
    <path d="M78 70 L108 58 L132 68 L102 80 Z" style="fill:color-mix(in oklab, var(--wood) 45%, var(--paper))"/>
    <path d="M78 70 L102 80 L102 106 L78 96 Z" style="fill:color-mix(in oklab, var(--wood) 65%, var(--cream))"/>
    <path d="M102 80 L132 68 L132 94 L102 106 Z" style="fill:color-mix(in oklab, var(--wood) 52%, var(--cream))"/>
    <path d="M110 64 q-4 -22 4 -34 q4 16 -1 34 Z M116 64 q6 -18 18 -22 q-6 14 -15 22 Z" style="fill:var(--teal)"/>
    <rect x="136" y="84" width="30" height="10" rx="2" transform="rotate(20 151 89)" style="fill:var(--paper);stroke:var(--ink);stroke-width:1"/>
    <text x="142" y="92" transform="rotate(20 151 89)" style="font:800 6px Nunito;fill:var(--ink)">Safety</text></svg>`,
};
