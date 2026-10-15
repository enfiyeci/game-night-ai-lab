import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { createGame } from '../ui/game.js';
import { hireLead } from '../sim/leads.js';
import { MEMO_ROWS, memoModel, resumeStep, startValues } from '../ui/logic/setup.js';
import { FakeEvent, installFakeDom } from './helpers/fakeDom.js';

test('each résumé step names its seat and who is already hired, as the mockup footer does', () => {
  const state = createInitialState();
  assert.equal(resumeStep(state, 0).foot, '1 of 4 · Head of Research');
  assert.deepEqual(resumeStep(state, 0).candidates.map((c) => c.name), ['Priya Raman', 'Dev Okafor']);
  assert.equal(resumeStep(state, 1).foot, '2 of 4 · Head of Safety · Priya Raman already hired for Research');
  hireLead(state, 'safety', 'hana');
  assert.equal(resumeStep(state, 2).foot, '3 of 4 · CFO · already hired: Priya Raman for Research and Hana Sato for Safety');
});

test('the memo starts at the current split, reads the runway from the game\'s projector, and comes from the hired CFO', () => {
  const state = createInitialState();
  const values = startValues(state);
  assert.deepEqual(values, { training: 50, security: 10, product: 20, talent: 20 });
  const memo = memoModel(state, values);
  assert.equal(memo.from, 'Margot Hale, CFO');
  assert.equal(memo.seed, '$1B');
  assert.equal(memo.runway, 'about 20 months', 'the budget dialog shows the same at the default');
  assert.deepEqual(memo.rows.map((row) => [row.key, row.share]), [['training', 50], ['security', 10], ['product', 20], ['talent', 20]]);
  assert.match(memo.note, /— M\.$/);
  hireLead(state, 'cfo', 'rafael');
  assert.equal(memoModel(state, values).from, 'Rafael Ortiz, CFO');
  assert.equal(MEMO_ROWS.length, 4);
});

test('the marks set the shares the way the budget sliders do, and signing sets the budget split', () => {
  const game = createGame({ state: createInitialState({ seed: 2 }), seed: 2 });
  const memo = memoModel(game.state, { training: 30, security: 30, product: 20, talent: 20 });
  assert.deepEqual(memo.rows.map((row) => row.share), [30, 30, 20, 20]);
  assert.equal(game.setBudget(memo.budget).ok, true);
  assert.deepEqual(game.state.budget.split, { training: 0.3, security: 0.3, product: 0.2, talent: 0.2 });
  assert.equal(game.state.budget.spend, createInitialState().budget.spend, 'the memo keeps the spend level');
});

test('the setup walks four résumés, then the memo; hires go on the state and the clock waits until it is signed', async () => {
  const doc = installFakeDom();
  globalThis.matchMedia = () => ({ matches: true }); // reduced motion: no transition timers
  const told = [];
  doc.dispatchEvent = (event) => { told.push(event.type); return true; }; // the office re-seats on ai-lab:leads
  const { openSetup } = await import('../ui/screens/setup.js');
  const game = createGame({ state: createInitialState({ seed: 5 }), seed: 5 });
  const reasons = new Set();
  game.clock = { pause: (r) => reasons.add(r), resume: (r) => reasons.delete(r) };
  const overlay = doc.createElement('div');
  doc.body.append(overlay);
  let done = 0;
  openSetup(game, overlay, { onDone: () => { done += 1; } });
  assert.ok(reasons.has('setup'));
  assert.equal(overlay.querySelectorAll('.paper-cancel').length, 0, 'no way out: the lab needs its leads');
  for (const pick of [1, 0, 1, 0]) {
    const sheets = overlay.querySelectorAll('.resume-sheet');
    assert.equal(sheets.length, 2);
    sheets[pick].click();
    const hire = overlay.querySelector('.resume-hire');
    assert.match(hire.textContent, /^Hire \w+$/);
    hire.click();
  }
  assert.deepEqual(game.state.leads, { research: 'dev', safety: 'tomas', cfo: 'rafael', policy: 'jules' });
  assert.deepEqual(told, ['ai-lab:leads', 'ai-lab:leads', 'ai-lab:leads', 'ai-lab:leads']);
  assert.ok(overlay.querySelector('.setup-memo'));
  assert.equal(overlay.querySelectorAll('[role="slider"]').length, 4);
  overlay.querySelector('.setup-memo-sign').click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(done, 1);
  assert.ok(!reasons.has('setup'));
  assert.deepEqual(game.state.budget.split, createInitialState().budget.split);
});

test('a double-click on Hire hires one lead: the second click lands on the next seat\'s button and is ignored', async () => {
  const doc = installFakeDom();
  globalThis.matchMedia = () => ({ matches: true });
  doc.dispatchEvent = () => true;
  const { openSetup } = await import('../ui/screens/setup.js');
  const game = createGame({ state: createInitialState({ seed: 5 }), seed: 5 });
  game.clock = { pause() {}, resume() {} };
  const overlay = doc.createElement('div');
  doc.body.append(overlay);
  const layer = openSetup(game, overlay);
  // The guided tour holds while a .dialog-layer is open (ui/screens/intro.js HOLDERS); that keeps it behind the résumés.
  assert.ok(layer.classList.contains('dialog-layer'));
  overlay.querySelector('.resume-hire').dispatchEvent(new FakeEvent('click', { detail: 1 }));
  const next = overlay.querySelector('.resume-hire');
  assert.equal(next.textContent, 'Hire Tomas');
  next.dispatchEvent(new FakeEvent('click', { detail: 2 }));
  assert.deepEqual(game.state.leads, { research: 'priya', safety: 'tomas', cfo: 'margot', policy: 'jules' });
  assert.match(overlay.querySelector('.setup-foot').textContent, /^2 of 4 · Head of Safety/, 'still on the Safety résumés');
});
