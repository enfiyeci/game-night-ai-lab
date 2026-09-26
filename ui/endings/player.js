// Plays an ending film: the player's own office, then world scenes (screens drawn by tools/endings/gen_plates.py and
// wide shots rendered in Blender by tools/endings/blender/), then the title card and Lumen's last line. Rendering is a
// pure function of time, so a film can start anywhere, freeze on a frame (for screenshots) and honour reduced motion.
//
//   const film = await mountFilm(document.body, { id: 'misalignment', era: 4, onDone });
//   film.play();            // from a click, so the sound may start
//   film.seek(12.5);        // or show one frame
//
// Assets: ui/endings/films/<id>.json (the shot list), ui/assets/endings/plates/<plate>.svg, ui/assets/endings/clips/<clip>.mp4,
// ui/assets/endings/<id>.m4a (sound), and the office art ui/assets/office-era<N>.svg with its anchors.
import { buildTimeline, shotAt, camAt, sampleKeys, typedText } from './timeline.js';

const OFFICE = { w: 1440, h: 810, cx: 720, cy: 450, fullH: 900 };
const PLATE = { w: 1280, h: 720, cx: 640, cy: 360, fullH: 720 };
const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const keysAttr = (keys) => `data-k='${JSON.stringify(keys)}'`;

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`could not load ${url}`);
  return response.text();
}

function parseSvg(text) {
  const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
  const node = document.importNode(svg, true);
  node.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  return node;
}

function wrap(text, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > width) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  return line ? [...lines, line] : lines;
}

// ---------------------------------------------------------------- office effects (drawn inside the office SVG)
function speech(x, y, text, at, to) {
  const lines = wrap(text, 24);
  const w = Math.max(...lines.map((l) => l.length)) * 9.6 + 34;
  const h = lines.length * 23 + 22;
  const bx = Math.min(Math.max(x - w * 0.3, 20), 1420 - w);
  const by = y - 52 - h;
  const tip = `M${x - 12},${by + h - 1} L${x + 2},${y - 26} L${x + 10},${by + h - 1} Z`;
  const text_ = lines.map((l, i) => `<text x="${bx + 17}" y="${by + 30 + i * 23}" style="font-size:17px;font-weight:800;fill:var(--ink)">${esc(l)}</text>`).join('');
  return `<g ${keysAttr([[at, { o: 0, s: 0.85 }], [at + 0.25, { o: 1, s: 1 }], [to - 0.2, { o: 1, s: 1 }], [to, { o: 0, s: 1 }]])} data-origin="bottom left">
    <rect x="${bx}" y="${by + 5}" width="${w}" height="${h}" rx="14" style="fill:color-mix(in oklab, var(--ink) 35%, transparent);filter:blur(6px)"/>
    <path d="${tip}" style="fill:var(--paper);stroke:color-mix(in oklab, var(--ink) 25%, transparent);stroke-width:1.4"/>
    <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="14" style="fill:var(--paper);stroke:color-mix(in oklab, var(--ink) 25%, transparent);stroke-width:1.4"/>
    <path d="${tip}" transform="translate(0,-2)" style="fill:var(--paper)"/>${text_}</g>`;
}

function chip(x, y, text, at) {
  const w = text.length * 9.4 + 40;
  return `<g ${keysAttr([[at, { o: 0, s: 0.6 }], [at + 0.25, { o: 1, s: 1 }]])}>
    <rect x="${x - w / 2}" y="${y - 13}" width="${w}" height="26" rx="13" style="fill:var(--teal)"/>
    <path d="M${x - w / 2 + 11},${y - 1} l4,4 l8,-9" style="fill:none;stroke:var(--paper);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round"/>
    <text x="${x - w / 2 + 28}" y="${y + 5}" style="font-size:13px;font-weight:900;letter-spacing:.05em;fill:var(--paper)">${esc(text.toUpperCase())}</text></g>`;
}

function lumenBot(x, y, turnAt) {
  return `<g transform="translate(${x},${y})">
    <ellipse cx="0" cy="58" rx="20" ry="7" style="fill:color-mix(in oklab, var(--ink) 30%, transparent)"/>
    <circle cx="0" cy="0" r="36" style="fill:url(#film-botglow)"/>
    <circle cx="0" cy="0" r="20" style="fill:var(--paper);stroke:var(--sky);stroke-width:4"/>
    <g ${keysAttr([[turnAt, { x: 5 }], [turnAt + 0.6, { x: -6 }]])}>
      <rect x="-8" y="-7" width="4" height="7" rx="2" style="fill:var(--ink)"/><rect x="4" y="-7" width="4" height="7" rx="2" style="fill:var(--ink)"/></g>
    <line x1="0" y1="-20" x2="0" y2="-29" style="stroke:var(--ink);stroke-width:2"/><circle cx="0" cy="-31" r="3.5" style="fill:var(--sky)"/></g>`;
}

function officeShot(svgText, anchors, shot) {
  const svg = parseSvg(svgText);
  const heads = anchors.heads;
  if (shot.empty) svg.querySelectorAll('.sitter').forEach((e) => e.setAttribute('display', 'none'));
  const tint = shot.tint === 'coral' ? 'var(--coral)' : shot.tint === 'teal' ? 'var(--teal)' : null;
  let fx = `<defs><radialGradient id="film-glow"><stop offset="0" style="stop-color:${tint ?? 'var(--sky)'};stop-opacity:.9"/>
    <stop offset="1" style="stop-color:${tint ?? 'var(--sky)'};stop-opacity:0"/></radialGradient>
    <radialGradient id="film-botglow"><stop offset="0" style="stop-color:var(--sky);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--sky);stop-opacity:0"/></radialGradient></defs>`;
  if (shot.dim) fx += `<rect x="-400" y="-400" width="2240" height="1700" style="fill:var(--ink)" ${keysAttr(shot.dim)}/>`;
  if (tint) {
    const glows = Object.entries(heads).filter(([role]) => !shot.empty || role === 'ceo')
      .map(([, [x, y]]) => `<ellipse cx="${x}" cy="${y + 30}" rx="96" ry="64" style="fill:url(#film-glow)"/>`).join('');
    fx += `<g style="mix-blend-mode:screen" ${keysAttr(shot.tintKeys ?? [[0, { o: 0.3 }]])}>${glows}
      <rect x="-400" y="-400" width="2240" height="1700" style="fill:${tint};opacity:.35"/></g>`;
  }
  if (shot.chips) {
    Object.entries(heads).filter(([role]) => role !== 'ceo')
      .forEach(([, [x, y]], i) => { fx += chip(x, y - 62, shot.chips.text, shot.chips.from + i * shot.chips.step); });
  }
  for (const b of shot.bubbles ?? []) {
    const [x, y] = heads[b.who] ?? [720, 450];
    fx += speech(x, y, b.text, b.at, b.to);
  }
  if (shot.robot) {
    const [x, y] = heads.ceo;
    fx += lumenBot(x + 96, y - 6, shot.robot.turn ?? 0);
  }
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = fx;
  svg.append(g);
  return svg;
}

// ---------------------------------------------------------------- the film
function resolveCam(cam, frame, heads) {
  const at = (v) => {
    if (!v) return undefined;
    const out = { ...v };
    if (v.focus && heads?.[v.focus]) [out.x, out.y] = heads[v.focus];
    delete out.focus;
    return out;
  };
  return { from: { x: frame.cx, y: frame.cy, s: 1, ...at(cam?.from) }, to: at(cam?.to) };
}

function viewBox({ x, y, s }, frame) {
  const w = frame.w / s;
  const h = frame.h / s;
  const cx = Math.min(Math.max(x, w / 2), frame.w - w / 2);
  const cy = Math.min(Math.max(y, h / 2), frame.fullH - h / 2);
  return `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}

function applyValues(el, v, still) {
  if ('o' in v) el.style.opacity = v.o;
  if (still) return; // reduced motion: things appear and disappear, but nothing moves
  if ('x' in v || 'y' in v || 's' in v || 'r' in v) {
    el.style.transformBox = 'fill-box';
    el.style.transformOrigin = el.dataset.origin ?? 'center';
    el.style.transform = `translate(${v.x ?? 0}px,${v.y ?? 0}px) rotate(${v.r ?? 0}deg) scale(${v.s ?? 1})`;
  }
}

export async function mountFilm(root, { id, era = 4, base = '', fullTitle, lumenLine, onDone, sound = true, audioUrl }) {
  const film = JSON.parse(await fetchText(`${base}ui/endings/films/${id}.json`));
  const timeline = buildTimeline(film);
  const needsOffice = film.shots.some((s) => s.kind === 'office');
  const [officeText, anchors] = needsOffice
    ? await Promise.all([fetchText(`${base}ui/assets/office-era${era}.svg`), fetchText(`${base}ui/assets/anchors-era${era}.json`).then(JSON.parse)])
    : [null, null];
  const plates = new Map();
  await Promise.all([...new Set(film.shots.filter((s) => s.plate).map((s) => s.plate))].map(async (name) => {
    plates.set(name, await fetchText(`${base}ui/assets/endings/plates/${name}.svg`));
  }));
  // Clips are fetched whole before the film starts, so playback never waits on the network mid-film.
  const clips = new Map();
  try {
    await Promise.all([...new Set(timeline.shots.filter((s) => s.clip).map((s) => s.clip))].map(async (name) => {
      const response = await fetch(`${base}ui/assets/endings/clips/${name}.mp4`);
      if (!response.ok) throw new Error(`could not load clip ${name}`);
      clips.set(name, URL.createObjectURL(await response.blob()));
    }));
  } catch (error) {
    for (const url of clips.values()) URL.revokeObjectURL(url);
    throw error;
  }

  const el = document.createElement('div');
  el.className = 'film';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', `Ending: ${fullTitle ?? film.title}`);
  el.innerHTML = `<div class="film-frame"><div class="film-shots"></div>
    <div class="film-fade" style="position:absolute;inset:0;background:var(--ink);z-index:2;pointer-events:none"></div>
    <div class="film-bar top"></div><div class="film-bar bottom"></div>
    <div class="film-card"></div><div class="film-sub"></div>
    <div class="film-title" hidden><h1>${esc(fullTitle ?? film.title)}</h1><p class="tagline">${esc(film.tagline ?? '')}</p>
      <p class="lumen"><small>Lumen</small><span></span></p></div>
    <button type="button" class="film-skip">Skip</button></div>`;
  const $ = (sel) => el.querySelector(sel);
  const shotsHost = $('.film-shots');

  const nodes = timeline.shots.map((shot) => {
    if (shot.clip) {
      const wrapEl = document.createElement('div');
      wrapEl.className = 'film-shot';
      const video = document.createElement('video');
      Object.assign(video, { src: clips.get(shot.clip), muted: true, playsInline: true, preload: 'auto' });
      video.setAttribute('aria-hidden', 'true');
      wrapEl.append(video);
      const dim = shot.kind === 'title' ? wrapEl.appendChild(document.createElement('div')) : null;
      if (dim) dim.className = 'film-dim';
      shotsHost.append(wrapEl);
      return { wrapEl, video, dim };
    }
    if (shot.kind === 'title') return null;
    const wrapEl = document.createElement('div');
    wrapEl.className = 'film-shot';
    const svg = shot.kind === 'office' ? officeShot(officeText, anchors, shot) : parseSvg(plates.get(shot.plate));
    wrapEl.append(svg);
    shotsHost.append(wrapEl);
    const frame = shot.kind === 'office' ? OFFICE : PLATE;
    return {
      wrapEl, svg, frame,
      cam: resolveCam(shot.cam, frame, anchors?.heads),
      keyed: [...svg.querySelectorAll('[data-k]')].map((e) => [e, JSON.parse(e.dataset.k)]),
      typed: [...svg.querySelectorAll('[data-type]')].map((e) => [e, Number(e.dataset.type), e.dataset.text ?? e.textContent]),
    };
  });

  const titleEl = $('.film-title');
  const lumenText = lumenLine ?? film.lumen ?? '';
  let current = null;
  let playing = false;

  // A clip follows the film's clock: it plays while the film plays and is re-seeked when it drifts; otherwise it shows
  // the frame for this moment. Reduced motion holds the clip's last frame, as the camera holds its final framing.
  function syncClip(video, local, dur, still) {
    const end = Math.min(dur, Number.isFinite(video.duration) ? video.duration : dur) - 0.01; // inside the last frame
    const target = still ? end : Math.min(local, end);
    if (playing && !still) {
      if (video.paused) { video.currentTime = target; video.play().catch(() => {}); }
      else if (Math.abs(video.currentTime - target) > 0.25) video.currentTime = target;
    } else {
      if (!video.paused) video.pause();
      if (Math.abs(video.currentTime - target) > 0.02) video.currentTime = target;
    }
  }

  function render(t) {
    const still = reducedMotion();
    const { shot, local } = shotAt(timeline, t);
    if (shot !== current) {
      if (current && nodes[current.index]) {
        nodes[current.index].wrapEl.classList.remove('on');
        nodes[current.index].video?.pause();
      }
      if (nodes[shot.index]) nodes[shot.index].wrapEl.classList.add('on');
      $('.film-card').textContent = shot.card ?? '';
      $('.film-sub').textContent = shot.sub ?? '';
      titleEl.hidden = shot.kind !== 'title';
      current = shot;
    }
    // shots fade through black unless the next one cuts in (a montage, or a title card that continues the take)
    const next = timeline.shots[shot.index + 1];
    const fadeIn = shot.cut ? 0 : Math.max(0, 1 - local / 0.35);
    const fadeOut = shot.kind === 'title' || next?.cut ? 0 : Math.max(0, 1 - (shot.dur - local) / 0.22);
    $('.film-fade').style.opacity = still ? 0 : Math.min(1, fadeIn + fadeOut);
    const node = nodes[shot.index];
    if (node?.video) syncClip(node.video, local, shot.dur, still);
    if (shot.kind === 'title') {
      const k = (a, b) => (still ? (local >= a ? 1 : 0) : Math.min(1, Math.max(0, (local - a) / (b - a))));
      if (node?.dim) node.dim.style.opacity = 0.6 * k(0, 1.2);
      titleEl.querySelector('h1').style.opacity = k(0.3, 1.4);
      titleEl.querySelector('.tagline').style.opacity = k(1.5, 2.4);
      titleEl.querySelector('.lumen').style.opacity = k(2.4, 2.8);
      titleEl.querySelector('.lumen span').textContent = still ? lumenText : typedText(lumenText, 2.8, local, 30);
      return;
    }
    if (node.video) return;
    node.svg.setAttribute('viewBox', viewBox(camAt(node.cam, local / shot.dur, still), node.frame));
    for (const [e, keys] of node.keyed) applyValues(e, sampleKeys(keys, local, still), still);
    for (const [e, start, text] of node.typed) e.textContent = still ? (local >= start ? text : '') : typedText(text, start, local);
  }

  const audio = sound ? new Audio(audioUrl ?? `${base}ui/assets/endings/${id}.m4a`) : null;
  let raf = 0;
  let started = 0;
  let done = false;
  // The picture follows the wall clock, so a stalled or blocked sound file can never freeze or rewind it; the sound
  // is nudged back into step with the picture when the two drift apart.
  function clock() {
    const t = (performance.now() - started) / 1000;
    if (audio && !audio.paused && !audio.ended && Math.abs(audio.currentTime - t) > 0.3 && t < audio.duration) audio.currentTime = t;
    return t;
  }
  let returnFocus = null;
  let inerted = [];

  function finish(reason) {
    if (done) return;
    done = true;
    playing = false;
    cancelAnimationFrame(raf);
    audio?.pause();
    document.removeEventListener('keydown', onKey);
    el.remove();
    for (const url of clips.values()) URL.revokeObjectURL(url);
    for (const child of inerted) child.inert = false;
    if (returnFocus?.isConnected) returnFocus.focus();
    onDone?.(reason);
  }
  function onKey(event) {
    if (event.key === 'Escape') finish('skipped');
    if (event.key === 'Tab') { event.preventDefault(); $('.film-skip').focus(); } // Skip is the film's only control
  }
  $('.film-skip').addEventListener('click', () => finish('skipped'));
  root.append(el);
  render(0);

  return {
    total: timeline.total,
    play(from = 0) {
      // while the film plays, everything else on the page is out of reach, and focus comes back afterwards
      returnFocus = document.activeElement;
      inerted = [...root.children].filter((child) => child !== el && !child.inert);
      for (const child of inerted) child.inert = true;
      // Escape and the Tab trap belong to the playing film, not to whatever page mounted it (Codex review round 3)
      document.addEventListener('keydown', onKey);
      playing = true;
      started = performance.now() - from * 1000;
      if (audio) { audio.currentTime = from; audio.play().catch(() => {}); }
      const loop = () => {
        const t = clock();
        render(t);
        if (t >= timeline.total) finish('ended');
        else raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      $('.film-skip').focus();
    },
    seek(t) { cancelAnimationFrame(raf); playing = false; audio?.pause(); render(t); },
    stop: () => finish('stopped'),
  };
}
