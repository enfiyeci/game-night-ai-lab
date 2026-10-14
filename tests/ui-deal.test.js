// Pacing fix (2026-10-14): Geneva deal news from one story day comes as one dialog, not a stack of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dealDialogHtml, queueDealCard } from '../ui/screens/deal.js';

const caught = { title: 'Qilin broke the Geneva deal, and got caught', lines: ['The checks caught it.'] };
const fallen = { title: 'The Geneva coalition has fallen apart', lines: ['The caps are lifted.'] };
const later = { title: 'Nothing found at Lodestar', lines: ['The trail went cold.'] };

test('deal news from the same day joins one waiting dialog; another day starts a new one', () => {
  const queue = [];
  queueDealCard(queue, caught, 980);
  queueDealCard(queue, fallen, 980);
  queueDealCard(queue, later, 987);
  assert.deepEqual(queue.map((entry) => [entry.day, entry.parts.length]), [[980, 2], [987, 1]]);
});

test('a merged dialog shows every piece of news with one Continue button', () => {
  const html = dealDialogHtml({ day: 980, parts: [caught, fallen] });
  assert.equal(html.match(/<h3>/g).length, 2);
  assert.equal(html.match(/<button/g).length, 1);
  assert.match(html, /got caught/);
  assert.match(html, /fallen apart/);
  const single = dealDialogHtml({ day: 987, parts: [later] });
  assert.match(single, /<h2>Nothing found at Lodestar<\/h2>/);
  assert.equal(single.includes('<h3>'), false);
});
