// Pure timing for the ending films: which shot plays at time t, eased camera moves, keyframed values and typed
// text. No DOM here, so the player can seek to any time and the tests can check a film without a browser.

export const TITLE_DUR = 7;

export function buildTimeline(film) {
  let t = 0;
  // A title card over a clip or a still continues that take, so it cuts in rather than fading through black.
  const title = {
    kind: 'title', dur: film.titleDur ?? TITLE_DUR,
    ...(film.titleClip && { clip: film.titleClip, cut: true }),
    ...(film.titleStill && { image: film.titleStill, cam: film.titleCam, cut: true }),
  };
  const shots = [...film.shots, title].map((shot, index) => {
    const out = { ...shot, index, start: t, end: t + shot.dur };
    t += shot.dur;
    return out;
  });
  return { shots, total: t };
}

export function shotAt(timeline, t) {
  const clamped = Math.min(Math.max(t, 0), timeline.total);
  const shot = timeline.shots.find((s) => clamped < s.end) ?? timeline.shots.at(-1);
  return { shot, local: clamped - shot.start };
}

export const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const mix = (a, b, p) => a + (b - a) * p;

// A camera move over a shot: {from: {x, y, s}, to: {x, y, s}}, where (x, y) is the point at the frame's centre and
// s the zoom. Missing parts default to the full frame (640, 360, 1).
export function camAt(cam, p, reduced = false) {
  const base = { x: 640, y: 360, s: 1 };
  const from = { ...base, ...(cam?.from ?? {}) };
  const to = { ...from, ...(cam?.to ?? {}) };
  const q = reduced ? 1 : ease(Math.min(Math.max(p, 0), 1));
  return { x: mix(from.x, to.x, q), y: mix(from.y, to.y, q), s: mix(from.s, to.s, q) };
}

// Keyframes as [[t, {o, x, y, s, r}], ...] in shot seconds; values hold before the first and after the last key.
// With step, values jump at each key instead of blending (reduced motion).
export function sampleKeys(keys, t, step = false) {
  if (!keys?.length) return {};
  if (t <= keys[0][0]) return { ...keys[0][1] };
  const last = keys.at(-1);
  if (t >= last[0]) return { ...last[1] };
  const i = keys.findIndex(([kt]) => kt > t);
  const [t0, v0] = keys[i - 1];
  const [t1, v1] = keys[i];
  if (step) return { ...v0, ...Object.fromEntries(Object.keys(v1).filter((k) => !(k in v0)).map((k) => [k, v1[k]])) };
  const p = ease((t - t0) / (t1 - t0));
  const out = {};
  for (const k of new Set([...Object.keys(v0), ...Object.keys(v1)])) out[k] = mix(v0[k] ?? v1[k], v1[k] ?? v0[k], p);
  return out;
}

export function typedText(text, startAt, t, cps = 26) {
  if (t < startAt) return '';
  return text.slice(0, Math.floor((t - startAt) * cps));
}

// ---------------------------------------------------------------- stills (Blender renders, 1920 x 1080)
export const STILL = { w: 1920, h: 1080 };

// The camera on a still: {from: {x, y, s}, to: {...}} in image pixels, where (x, y) is the point at the frame's centre
// and s the zoom (1 shows the whole image). The centre is held in so the frame never runs past the image's edge.
export function stillCam(cam, p, reduced = false) {
  const base = { x: STILL.w / 2, y: STILL.h / 2, s: 1 };
  const from = { ...base, ...(cam?.from ?? {}) };
  const to = { ...from, ...(cam?.to ?? {}) };
  const q = reduced ? 1 : ease(Math.min(Math.max(p, 0), 1));
  const s = Math.max(1, mix(from.s, to.s, q));
  const hw = STILL.w / (2 * s);
  const hh = STILL.h / (2 * s);
  return {
    x: Math.min(Math.max(mix(from.x, to.x, q), hw), STILL.w - hw),
    y: Math.min(Math.max(mix(from.y, to.y, q), hh), STILL.h - hh),
    s,
  };
}

// A still can be several renders from one camera, crossfaded: frames = [{image, at, fade}], each fading in over
// fade seconds (default 1) from at. Returns each frame's opacity at shot time t; the first is always fully shown.
export function frameAlphas(frames, t, reduced = false) {
  return frames.map((f, i) => {
    if (i === 0) return 1;
    const fade = f.fade ?? 1;
    if (reduced) return t >= f.at ? 1 : 0;
    return Math.min(1, Math.max(0, (t - f.at) / fade));
  });
}

// A CSS matrix3d that maps a w x h box onto a quad (top-left, top-right, bottom-right, bottom-left), so a flat
// screen design can be laid over the screen in a render, in perspective.
export function quadMatrix(w, h, quad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = den ? (dx3 * dy2 - dx2 * dy3) / den : 0;
  const hh = den ? (dx1 * dy3 - dx3 * dy1) / den : 0;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(',')})`;
}

// ---------------------------------------------------------------- films that follow the run
// A film with a deal block (A negotiated pace) shows the deal the run made: {name} in a card, or in a plate's data-fill
// text, becomes the value of that name; a plate element with data-if="name" shows only when that value is set; and a
// shot's byDeal list ([[commitment, plate], ...]) picks the first plate whose commitment is binding. With no run, the
// film's own example deal is used. run = {deal: state.deal}: {binding: [...], signed: {commitment: [party ids]}}.
//
// The sim drops a rival that broke the deal from every signed list but leaves the terms binding, so the signers here
// are the ones who kept it (the signing-day ticker counts them too). Your lab always kept it: this ending needs you
// to have held, so it heads every signature list and hosts the 2 am scene when no rival still keeps its term.
const NUMBER_WORDS = ['NO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'];

export const fillText = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

export function resolveFilm(film, run) {
  const spec = film.deal;
  if (!spec) return { film, values: {} };
  const deal = run?.deal ?? spec.example;
  const binding = Object.keys(spec.terms).filter((c) => deal.binding.includes(c));
  const signers = (c) => deal.signed?.[c] ?? [];
  const labsKeeping = (terms) => Object.keys(spec.labs).filter((p) => terms.some((c) => signers(c).includes(p)));

  const pick = (shot) => shot.byDeal?.find(([c]) => binding.includes(c));
  const about = film.shots.map(pick).find(Boolean)?.[0];
  const rival = about && labsKeeping([about])[0];

  const total = Object.keys(spec.labs).length + 1;     // the rivals, and you
  const signing = labsKeeping(binding).length + 1;
  const count = signing === total ? `ALL ${NUMBER_WORDS[total]}` : `${NUMBER_WORDS[signing]} OF ${NUMBER_WORDS[total]}`;
  const ticker = [`${count} FRONTIER LABS SIGN`, ...binding.map((c) => spec.headlines[c])].join('  ·  ');
  const values = {
    lab: rival ? spec.labs[rival] : spec.you.lab,
    place: rival ? spec.labs[rival] : spec.you.place,
    evaluators: binding.includes('evaluators') ? 'yes' : '',
    ticker: `${ticker}  ·  `.repeat(4),
  };
  const parties = { ...spec.labs, ...spec.governments };
  binding.forEach((c, i) => {
    const names = [spec.you.lab, ...Object.keys(parties).filter((p) => signers(c).includes(p)).map((p) => parties[p])];
    values[`term${i + 1}`] = `${i + 1}.  ${spec.terms[c]}`;
    values[`signed${i + 1}`] = `Signed: ${names.join(', ')}`;
  });

  const shots = film.shots.map((shot) => ({
    ...shot,
    // a still puts the picked design on its first screen; a plate shot swaps the plate
    ...(pick(shot) && (shot.screens ? { screens: shot.screens.map((c, i) => (i ? c : { ...c, plate: pick(shot)[1] })) } : { plate: pick(shot)[1] })),
    ...(shot.card && { card: fillText(shot.card, values) }),
  }));
  return { film: { ...film, shots }, values };
}
