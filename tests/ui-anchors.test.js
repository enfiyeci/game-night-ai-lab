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
