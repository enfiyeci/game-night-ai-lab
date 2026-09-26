// Pure timing for the ending films: which shot plays at time t, eased camera moves, keyframed values and typed
// text. No DOM here, so the player can seek to any time and the tests can check a film without a browser.

export const TITLE_DUR = 7;

export function buildTimeline(film) {
  let t = 0;
  const shots = [...film.shots, { kind: 'title', dur: film.titleDur ?? TITLE_DUR }].map((shot, index) => {
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
