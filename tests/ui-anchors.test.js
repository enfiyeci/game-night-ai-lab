import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const svg = readFileSync('ui/assets/office.svg', 'utf8');
const anchors = JSON.parse(readFileSync('ui/assets/anchors.json', 'utf8'));
const ROLES = ['ceo', 'research', 'safety', 'cfo', 'policy', 'researcher1', 'researcher2'];

test('every person has a group and a head anchor inside the frame', () => {
  for (const r of ROLES) {
    assert.ok(svg.includes(`id="person-${r}"`), r);
    const [x, y] = anchors.heads[r];
    assert.ok(x > 0 && x < 1440 && y > 0 && y < 900, r);
  }
});

test('advisors have three mood faces; rack and floor are addressable', () => {
  for (const mood of ['calm', 'uneasy', 'alarmed']) assert.equal(svg.split(`face-${mood}`).length - 1, 4);
  assert.ok(svg.includes('id="rack"') && svg.includes('id="floor"'));
});

test('the svg uses only token colours', () => {
  const literals = svg.match(/#[0-9a-fA-F]{3,8}\b|rgb\(/g) ?? [];
  assert.deepEqual(literals, []);
});

const ERAS = [1, 2, 3, 4, 5];
const eraSvg = (e) => readFileSync(`ui/assets/office-era${e}.svg`, 'utf8');
const eraAnchors = (e) => JSON.parse(readFileSync(`ui/assets/anchors-era${e}.json`, 'utf8'));

test('every era file keeps the office contract: people, moods, rack, floor, token colours', () => {
  for (const e of ERAS) {
    const s = eraSvg(e);
    for (const r of ROLES) assert.ok(s.includes(`id="person-${r}"`), `era ${e} ${r}`);
    for (const mood of ['calm', 'uneasy', 'alarmed']) assert.equal(s.split(`face-${mood}`).length - 1, 4, `era ${e} ${mood}`);
    assert.ok(s.includes('id="rack"') && s.includes('id="floor"'), `era ${e}`);
    assert.deepEqual(s.match(/#[0-9a-fA-F]{3,8}\b|rgb\(/g) ?? [], [], `era ${e}`);
    assert.equal(s.split('display="none"').length - 1, 8, `era ${e}: uneasy and alarmed start hidden`);
    const ids = [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `era ${e}: ids are unique`);
  }
});

test('heads stay put across eras, so markers and bubbles line up in every office', () => {
  for (const e of ERAS) {
    const a = eraAnchors(e);
    assert.deepEqual(a.heads, anchors.heads, `era ${e}`);
    assert.deepEqual(a.floorMenu, anchors.floorMenu, `era ${e}`);
    const [x, y] = a.rack;
    assert.ok(x > 0 && x < 1440 && y > 0 && y < 900, `era ${e} rack`);
  }
});

test('gradient ids are unique across the era files, so they can share one page', () => {
  const ids = ERAS.flatMap((e) => [...eraSvg(e).matchAll(/<(?:linear|radial)Gradient id="([^"]+)"/g)].map((m) => m[1]));
  assert.ok(ids.length > 0);
  assert.equal(new Set(ids).size, ids.length);
});
