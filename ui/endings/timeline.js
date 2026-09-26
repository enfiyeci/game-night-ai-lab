// Pure timing for the ending films: which shot plays at time t, eased camera moves, keyframed values and typed
// text. No DOM here, so the player can seek to any time and the tests can check a film without a browser.

export const TITLE_DUR = 7;

export function buildTimeline(film) {
  let t = 0;
  // A title card over a clip continues that take, so it cuts in rather than fading through black.
  const title = { kind: 'title', dur: film.titleDur ?? TITLE_DUR, ...(film.titleClip && { clip: film.titleClip, cut: true }) };
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

// ---------------------------------------------------------------- films that follow the run
// A film with a deal block (A negotiated pace) shows the deal the run made: {name} in a card, or in a plate's data-fill
// text, becomes the value of that name, and a shot's byDeal list ([[commitment, plate], ..., ['*', plate]]) picks the
// first plate whose commitment is binding. The 2 am scene happens at a lab that signed what the scene is about. With
// no run, the film's own example deal is used. run = {deal: {binding: [...], signed: {commitment: [party ids]}}}.
const NUMBER_WORDS = ['NO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'];

export const fillText = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

export function resolveFilm(film, run) {
  const spec = film.deal;
  if (!spec) return { film, values: {} };
  const deal = run?.deal ?? spec.example;
  const binding = Object.keys(spec.terms).filter((c) => deal.binding.includes(c));
  const signedAny = (names, terms) => Object.keys(names).filter((p) => terms.some((c) => deal.signed?.[c]?.includes(p)));
  const labs = signedAny(spec.labs, binding);
  const govs = signedAny(spec.governments, binding);

  const pick = (shot) => shot.byDeal?.find(([c]) => c === '*' || binding.includes(c));
  const about = film.shots.map(pick).find(Boolean)?.[0];
  const lab = (about && about !== '*' ? signedAny(spec.labs, [about]) : labs)[0] ?? labs[0] ?? Object.keys(spec.labs)[0];

  const total = Object.keys(spec.labs).length + 1;     // the rivals, and you
  const signing = labs.length + 1;
  const count = signing === total ? `ALL ${NUMBER_WORDS[total]}` : `${NUMBER_WORDS[signing]} OF ${NUMBER_WORDS[total]}`;
  const ticker = [`${count} FRONTIER LABS SIGN`, ...binding.map((c) => spec.headlines[c])].join('  ·  ');
  const values = { lab: spec.labs[lab], ticker: `${ticker}  ·  `.repeat(4) };
  binding.forEach((c, i) => { values[`term${i + 1}`] = `${i + 1}.  ${spec.terms[c]}`; });
  [...labs.slice(0, 3 - govs.length), ...govs].forEach((p, i) => { values[`sig${i + 1}`] = spec.labs[p] ?? spec.governments[p]; });

  const shots = film.shots.map((shot) => ({
    ...shot,
    ...(pick(shot) && { plate: pick(shot)[1] }),
    ...(shot.card && { card: fillText(shot.card, values) }),
  }));
  return { film: { ...film, shots }, values };
}
