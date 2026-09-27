import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { draftFor, changeDraft, learnConstitution } from '../sim/constitution.js';
import { SAFETY_PROPOSAL, HARD_LINES, FIXED_LINE } from '../sim/data/constitution.js';
import { documentView } from '../ui/logic/constitution.js';

test('the first draft shows Safety’s picks and no changes', () => {
  const s = createInitialState();
  s.era = 3;
  const view = documentView(s, draftFor(s));
  assert.deepEqual(view.lines.filter((l) => l.on).map((l) => l.id), SAFETY_PROPOSAL.hardLines);
  assert.ok(view.lines.filter((l) => l.on).every((l) => l.tag === 'Safety’s pick'));
  assert.equal(view.cases.length, 6);
  assert.equal(view.valid, true);
  assert.deepEqual(view.changes, []);
});

test('a demand shows up as a tracked change with its source', () => {
  const s = createInitialState();
  s.era = 3;
  learnConstitution(s, SAFETY_PROPOSAL);
  changeDraft(s, { remove: 'no-wmd' }, 'investors');
  const view = documentView(s, draftFor(s));
  assert.equal(view.valid, false, 'two lines left: the player must pick a third');
  assert.equal(view.changes.length, 1);
  assert.match(view.changes[0].source, /Investors/);
});

test('the player’s own edits are tagged against Safety’s draft', () => {
  const s = createInitialState();
  s.era = 3;
  const draft = draftFor(s);
  draft.hardLines = ['no-wmd', 'accept-shutdown', 'no-power-grab'];
  draft.rulings.fraud = 'report';
  const view = documentView(s, draft);
  const tag = (id) => view.lines.find((l) => l.id === id).tag;
  assert.equal(tag('no-power-grab'), 'Added by you');
  assert.equal(tag('no-autonomy-grab'), 'Safety’s pick · removed by you');
  assert.equal(tag('honest'), null);
  const fraud = view.cases.find((c) => c.id === 'fraud');
  assert.equal(fraud.proposed.id, SAFETY_PROPOSAL.rulings.fraud);
  assert.equal(fraud.changedBy, 'Changed by you');
  assert.equal(fraud.options.find((o) => o.on).id, 'report');
  assert.equal(view.cases.find((c) => c.id === 'stop').changedBy, null);
});

test('the document lists every line without its effect, the fixed line and a family title', () => {
  const s = createInitialState();
  s.era = 3;
  const view = documentView(s, draftFor(s));
  assert.equal(view.lines.length, HARD_LINES.length);
  assert.ok(view.lines.every((l) => !('effect' in l)));
  assert.equal(view.fixed, FIXED_LINE);
  assert.equal(view.title, 'The Kestrel Model Spec');
  s.models = [{ family: 'Osprey', generation: 3 }];
  const named = documentView(s, draftFor(s));
  assert.equal(named.title, 'The Osprey Model Spec');
  assert.match(named.kicker, /Osprey 4/);
});

test('a demand’s line and ruling carry its source, and the change has a date', () => {
  const s = createInitialState();
  s.era = 3;
  learnConstitution(s, SAFETY_PROPOSAL);
  changeDraft(s, { add: 'no-manipulation' }, 'activists');
  changeDraft(s, { ruling: { caseId: 'feedback', optionId: 'encourage' } }, 'users');
  const view = documentView(s, draftFor(s));
  assert.equal(view.lines.find((l) => l.id === 'no-manipulation').tag, 'Activists asked');
  assert.equal(view.cases.find((c) => c.id === 'feedback').changedBy, 'Users asked');
  assert.equal(view.changes.length, 2);
  assert.ok(view.changes.every((c) => typeof c.text === 'string' && c.text.length > 0));
  assert.ok(view.changes.every((c) => typeof c.when === 'string' && !/turn/i.test(c.when)));
  assert.equal(view.valid, false, 'four lines: the player must drop one');
});
