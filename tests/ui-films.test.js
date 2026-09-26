import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { buildTimeline, shotAt, camAt, sampleKeys, typedText, resolveFilm, fillText, TITLE_DUR } from '../ui/endings/timeline.js';
import { ENDINGS } from '../sim/endings.js';
import { COMMITMENTS, PARTIES } from '../sim/summit.js';
import { RIVAL_TEMPLATES } from '../sim/rivals.js';

const films = readdirSync('ui/endings/films').filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`ui/endings/films/${f}`, 'utf8')));

test('the timeline adds a title card and finds the shot at any time', () => {
  const tl = buildTimeline({ shots: [{ dur: 2 }, { dur: 3 }] });
  assert.equal(tl.total, 5 + TITLE_DUR);
  assert.equal(shotAt(tl, 0).shot.index, 0);
  assert.equal(shotAt(tl, 1.99).shot.index, 0);
  assert.deepEqual([shotAt(tl, 2).shot.index, shotAt(tl, 2).local], [1, 0]);
  assert.equal(shotAt(tl, 5).shot.kind, 'title');
  assert.equal(shotAt(tl, 999).shot.kind, 'title');
  assert.equal(shotAt(tl, -4).shot.index, 0);
});

test('a title card over a clip cuts in from the last shot instead of fading', () => {
  const plain = buildTimeline({ shots: [{ dur: 2 }] }).shots.at(-1);
  assert.equal(plain.cut, undefined);
  const over = buildTimeline({ shots: [{ dur: 2 }], titleClip: 'x' }).shots.at(-1);
  assert.deepEqual([over.kind, over.clip, over.cut], ['title', 'x', true]);
});

test('camera moves default to the full frame and ease between ends', () => {
  assert.deepEqual(camAt(undefined, 0.5), { x: 640, y: 360, s: 1 });
  const cam = { from: { x: 0, s: 1 }, to: { x: 100, s: 2 } };
  assert.deepEqual(camAt(cam, 0), { x: 0, y: 360, s: 1 });
  assert.deepEqual(camAt(cam, 1), { x: 100, y: 360, s: 2 });
  assert.equal(camAt(cam, 0.5).x, 50);
  assert.deepEqual(camAt(cam, 0, true), { x: 100, y: 360, s: 2 }, 'reduced motion holds the final framing');
});

test('keyframes hold outside their range and blend inside it', () => {
  const keys = [[1, { o: 0 }], [3, { o: 1, s: 2 }]];
  assert.deepEqual(sampleKeys(keys, 0), { o: 0 });
  assert.deepEqual(sampleKeys(keys, 5), { o: 1, s: 2 });
  assert.equal(sampleKeys(keys, 2).o, 0.5);
  assert.deepEqual(sampleKeys([], 2), {});
});

test('reduced motion steps keyframes instead of blending them', () => {
  const keys = [[1, { o: 0 }], [3, { o: 1, s: 2 }]];
  assert.deepEqual(sampleKeys(keys, 2, true), { o: 0, s: 2 });
  assert.deepEqual(sampleKeys(keys, 3, true), { o: 1, s: 2 });
});

test('no timed light flickers faster than three flashes a second', () => {
  for (const file of readdirSync('ui/assets/endings/plates')) {
    for (const [, json] of readFileSync(`ui/assets/endings/plates/${file}`, 'utf8').matchAll(/data-k='([^']*)'/g)) {
      const keys = JSON.parse(json).filter(([, v]) => 'o' in v);
      for (let i = 2; i < keys.length; i += 1) {
        const flashes = keys.slice(i - 2, i + 1);
        const up = (a, b) => b[1].o - a[1].o > 0.3;
        const down = (a, b) => a[1].o - b[1].o > 0.3;
        if ((up(flashes[0], flashes[1]) && down(flashes[1], flashes[2])) || (down(flashes[0], flashes[1]) && up(flashes[1], flashes[2]))) {
          assert.ok(flashes[2][0] - flashes[0][0] >= 0.33, `${file}: a flash at ${flashes[0][0]} s is shorter than a third of a second`);
        }
      }
    }
  }
});

test('typed text appears at its start time and grows', () => {
  assert.equal(typedText('hello', 1, 0.5), '');
  assert.equal(typedText('hello', 1, 1.1, 20), 'he');
  assert.equal(typedText('hello', 1, 9), 'hello');
});

test('every film names a real ending, and every asset it uses exists', () => {
  assert.ok(films.length > 0);
  const eras = [1, 2, 3, 4, 5];
  for (const era of eras) assert.ok(existsSync(`ui/assets/office-era${era}.svg`), `office art for era ${era}`);
  const heads = eras.map((era) => new Set(Object.keys(JSON.parse(readFileSync(`ui/assets/anchors-era${era}.json`, 'utf8')).heads)));
  const roles = { has: (role) => heads.every((set) => set.has(role)) };
  for (const film of films) {
    assert.ok(ENDINGS[film.id], `${film.id} is an ending`);
    assert.ok(film.title && film.lumen, `${film.id} has a title and a Lumen line`);
    assert.ok(existsSync(`ui/assets/endings/${film.id}.m4a`), `${film.id} has its sound`);
    if (film.titleClip) assert.ok(existsSync(`ui/assets/endings/clips/${film.titleClip}.mp4`), `clip ${film.titleClip} exists`);
    for (const shot of film.shots) {
      assert.ok(shot.dur > 0, `${film.id}: every shot has a duration`);
      if (shot.kind === 'plate') assert.ok(existsSync(`ui/assets/endings/plates/${shot.plate}.svg`), `plate ${shot.plate} exists`);
      else if (shot.kind === 'video') assert.ok(existsSync(`ui/assets/endings/clips/${shot.clip}.mp4`), `clip ${shot.clip} exists`);
      else assert.equal(shot.kind, 'office');
      for (const [, plate] of shot.byDeal ?? []) assert.ok(existsSync(`ui/assets/endings/plates/${plate}.svg`), `plate ${plate} exists`);
      for (const b of shot.bubbles ?? []) assert.ok(roles.has(b.who) || (b.who === 'lumen' && shot.robot), `${film.id}: ${b.who} has a desk`);
      for (const role of shot.leave?.order ?? []) assert.ok(roles.has(role), `${film.id}: ${role} can leave a desk`);
      for (const role of [shot.robot?.from, shot.robot?.to].filter(Boolean)) assert.ok(roles.has(role), `${film.id}: Lumen moves by ${role}'s desk`);
      for (const v of [shot.cam?.from, shot.cam?.to]) if (v?.focus) assert.ok(roles.has(v.focus), `${film.id}: camera focus ${v.focus}`);
    }
  }
});

test('films run 30 to 60 seconds (owner, 2026-09-25: 30 s cuts, then about 60 s with narration)', () => {
  for (const film of films) {
    const { total } = buildTimeline(film);
    assert.ok(total >= 25 && total <= 65, `${film.id} runs ${total} s`);
  }
});

test('an office shot chimes once for each Resolved badge it shows', () => {
  const badges = Object.keys(JSON.parse(readFileSync('ui/assets/anchors-era4.json', 'utf8')).heads).length - 1; // everyone but the CEO
  for (const film of films) {
    for (const shot of film.shots.filter((s) => s.kind === 'office' && s.chips)) {
      const run = (shot.sfx ?? []).find(([name]) => name === 'chimes');
      assert.ok(run, `${film.id}: the badges have chimes`);
      assert.deepEqual([run[1], run[2], run[3]], [shot.chips.from, badges, shot.chips.step], `${film.id}: one chime per badge, in step`);
    }
  }
});

const pacing = films.find((f) => f.id === 'pacingDeal');
const scene = (resolved) => resolved.film.shots.find((s) => s.byDeal);
const run = (signed) => ({ deal: { binding: Object.keys(signed), signed } });

test('a negotiated pace has words for every commitment and party, and a 2 am scene for every deal the ending allows', () => {
  const ids = Object.keys(COMMITMENTS);
  for (const c of ids) assert.ok(pacing.deal.terms[c] && pacing.deal.headlines[c], `${c} has words`);
  for (const a of ids) for (const b of ids) {   // the ending needs two binding terms
    if (a !== b) assert.ok(scene({ film: pacing }).byDeal.some(([k]) => k === a || k === b), `${a} + ${b} has a 2 am scene`);
  }
  for (const p of PARTIES) assert.ok(pacing.deal.labs[p] ?? pacing.deal.governments[p], `${p} has a name`);
  for (const r of RIVAL_TEMPLATES) assert.equal(pacing.deal.labs[r.id], r.name);
});

test('with no run, a negotiated pace plays its example deal', () => {
  const r = resolveFilm(pacing);
  assert.equal(scene(r).plate, 'pd-cursor');
  assert.equal(scene(r).card, 'Month 1, 2 am · OpenBrain');
  assert.equal(r.values.term3, '3.  US–China verification channel');
  assert.equal(r.values.signed3, 'Signed: Kestrel Labs, OpenBrain, Lodestar, DeepThink, Qilin, United States, China');
  assert.equal(r.values.evaluators, 'yes');
  assert.ok(r.values.ticker.startsWith('ALL FIVE FRONTIER LABS SIGN  ·  CHIP ORDERS PAUSED'));
});

test('a negotiated pace shows the deal the run actually made, term by term', () => {
  const r = resolveFilm(pacing, run({ sharedSafety: ['lodestar', 'west', 'east'], evaluators: ['deepthink', 'west'] }));
  assert.equal(scene(r).plate, 'pd-cursor-evals');
  assert.equal(scene(r).card, 'Month 1, 2 am · DeepThink');           // the lab that signed what the scene is about
  assert.equal(r.values.term1, '1.  Evaluators inside every lab');
  assert.equal(r.values.signed1, 'Signed: Kestrel Labs, DeepThink, United States');
  assert.equal(r.values.term2, '2.  Safety research shared openly');
  assert.equal(r.values.signed2, 'Signed: Kestrel Labs, Lodestar, United States, China');
  assert.equal(r.values.term3, undefined);
  assert.ok(r.values.ticker.startsWith('THREE OF FIVE FRONTIER LABS SIGN  ·  INSPECTORS ARRIVE MONDAY  ·  LABS OPEN THEIR SAFETY RESEARCH  ·  '));
  assert.ok(!r.values.ticker.includes('CHIP ORDERS'));
});

test('the 2 am scene is about a term the deal made binding, and the evaluator appears only with evaluators', () => {
  const r = resolveFilm(pacing, run({ computeCap: ['openbrain', 'west'], sharedSafety: ['lodestar', 'west'] }));
  assert.equal(scene(r).plate, 'pd-cursor');
  assert.equal(r.values.evaluators, '');
  const q = resolveFilm(pacing, run({ pauseAutomation: ['lodestar', 'west'], verification: ['qilin', 'west', 'east'] }));
  assert.equal(scene(q).plate, 'pd-cursor-automation');
  assert.equal(scene(q).card, 'Month 1, 2 am · Lodestar');
});

test('when every rival broke the term the scene is about, it happens at your lab, which held', () => {
  const r = resolveFilm(pacing, run({ computeCap: ['west'], evaluators: ['openbrain', 'west'] }));   // the rivals that signed the cap broke the deal
  assert.equal(scene(r).card, 'Month 1, 2 am · Your lab');
  assert.equal(r.values.lab, 'Kestrel Labs');
  assert.equal(r.values.signed1, 'Signed: Kestrel Labs, United States');
});

test('films without run data are left as they are', () => {
  const film = films.find((f) => f.id === 'misalignment');
  assert.equal(resolveFilm(film, run({ evaluators: ['west'] })).film, film);
  assert.equal(fillText('{a} and {b}', { a: 'x' }), 'x and ');
});
