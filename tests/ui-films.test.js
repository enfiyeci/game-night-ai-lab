import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { buildTimeline, shotAt, camAt, sampleKeys, typedText, TITLE_DUR } from '../ui/endings/timeline.js';
import { ENDINGS } from '../sim/endings.js';

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
      for (const b of shot.bubbles ?? []) assert.ok(roles.has(b.who), `${film.id}: ${b.who} has a desk`);
      for (const role of shot.leave?.order ?? []) assert.ok(roles.has(role), `${film.id}: ${role} can leave a desk`);
      for (const role of [shot.robot?.from, shot.robot?.to].filter(Boolean)) assert.ok(roles.has(role), `${film.id}: Lumen moves by ${role}'s desk`);
      for (const v of [shot.cam?.from, shot.cam?.to]) if (v?.focus) assert.ok(roles.has(v.focus), `${film.id}: camera focus ${v.focus}`);
    }
  }
});

test('films run about 30 seconds (owner, 2026-09-25)', () => {
  for (const film of films) {
    const { total } = buildTimeline(film);
    assert.ok(total >= 25 && total <= 40, `${film.id} runs ${total} s`);
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
