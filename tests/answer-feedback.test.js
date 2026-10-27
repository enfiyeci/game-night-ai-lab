import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { consequenceLines, movedLine, reactionLine } from '../ui/logic/events.js';
import { REACTIONS } from '../ui/data/eventCopy.js';

// Reward-loops O2 (Arda's pick 2026-10-26): answer a card, see what it did.
const view = (choices) => ({ id: 'scenarioCitations', title: 'The demo invented its sources', choices });
const choice = (id, backers = [], opposers = []) => ({ id, label: id, backers, opposers });

test('the advisor who backed the choice nods; with no backer, the first opposer grumbles', () => {
  const card = view([choice('verify', ['Safety', 'Research'], ['CFO']), choice('quiet', [], ['Comms', 'Safety']), choice('none')]);
  const nod = reactionLine(card, 'verify', 4);
  assert.equal(nod.role, 'safety');
  assert.equal(nod.kind, 'nod');
  assert.ok(REACTIONS.safety.nod.includes(nod.say));
  const grumble = reactionLine(card, 'quiet', 4);
  assert.deepEqual([grumble.role, grumble.kind], ['policy', 'grumble']);
  assert.ok(REACTIONS.policy.grumble.includes(grumble.say));
  assert.equal(reactionLine(card, 'none', 4), null, 'nobody took a side');
});

test('tags without an advisor seat are skipped, and the line varies by day', () => {
  const card = view([choice('celebrate', ['Product', 'CFO'], ['Safety'])]);
  assert.equal(reactionLine(card, 'celebrate', 0).role, 'cfo');
  const says = new Set([0, 1, 2, 3].map((day) => reactionLine(card, 'celebrate', day).say));
  assert.ok(says.size > 1);
});

test('what moved: direction words for what the player can see, cash as a number, hidden risks never', () => {
  const before = createInitialState({ seed: 1 });
  const after = structuredClone(before);
  after.publicTrust += 2;
  after.staffTrust -= 9;
  after.cash -= 4;
  after.concealedDebt += 10;
  after.alignmentDebt += 5;
  const line = movedLine(before, after);
  assert.equal(line, 'Public trust: up a little. Staff trust: down a lot. Cash: -$4M.');
  assert.equal(movedLine(before, structuredClone(before)), '');
});

test('the busy line carries the verdict and, for an answered card, what moved', () => {
  const before = createInitialState({ seed: 1 });
  const after = structuredClone(before);
  after.publicTrust += 5;
  const card = { id: 'scenarioCitations', title: 'The demo invented its sources', choices: [choice('verify')] };
  const verdict = (eventId, choiceId) => (eventId === 'scenarioCitations' && choiceId === 'verify' ? 'Paid off' : null);
  const [handled] = consequenceLines({ before: [card], answered: { scenarioCitations: 'verify' }, events: [], verdict, stateBefore: before, stateAfter: after });
  assert.equal(handled.head, 'Handled · Paid off');
  assert.match(handled.text, /Public trust: up\.$/);
  const [auto] = consequenceLines({ before: [card], answered: {}, events: [{ type: 'eventResolved', id: 'scenarioCitations', choiceId: 'verify', auto: true }], verdict, stateBefore: before, stateAfter: after });
  assert.equal(auto.head, 'Nobody answered · Paid off');
  assert.doesNotMatch(auto.text, /Public trust/, 'a deadline day moves many things; only an answer gets the moved line');
  const [plain] = consequenceLines({ before: [card], answered: { scenarioCitations: 'verify' }, events: [] });
  assert.equal(plain.head, 'Handled', 'callers without the new inputs see the old line');
});
