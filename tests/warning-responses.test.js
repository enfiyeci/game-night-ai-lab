import { test } from 'node:test';
import assert from 'node:assert/strict';
import { warningResponse } from '../sim/data/warningResponses.js';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { REAL_EVENTS } from '../sim/data/realEvents.js';
import { lookIntoCost, openWarnings } from '../ui/logic/events.js';

test('every supported warning describes a specific response and its budget', () => {
  for (const event of [...EVENTS, ...EVENTS_6C, ...REAL_EVENTS].filter((row) => row.warning)) {
    const response = warningResponse(event.id, { era: 1 });
    assert.notEqual(response.label, 'Fund a response', event.id);
    assert.ok(response.cost > 0, event.id);
    assert.ok(response.explanation.includes(`$${response.cost}M`), event.id);
    assert.equal(lookIntoCost({ era: 5 }, event.id), response.cost);
  }
});

test('jailbreak response pays for specific remediation with the same quote in every era', () => {
  for (const era of [1, 2, 3, 4, 5]) {
    const state = { era, warnings: { jailbreak: {} } };
    const [warning] = openWarnings(state);
    assert.equal(warning.response.cost, 5);
    assert.equal(warning.response.label, 'Patch and retest');
    assert.match(warning.response.explanation, /engineers.*outside testers.*compute/);
    assert.match(warning.response.explanation, /not every future jailbreak/);
  }
});
