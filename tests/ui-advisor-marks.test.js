import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdvisorMarks, hitAreas, insidePolygon, markRect, markerSpot, readingKey } from '../ui/logic/advisorMarks.js';

const ADVISORS = ['research', 'safety', 'cfo', 'policy'];
const eraAnchors = (era) => JSON.parse(readFileSync(`ui/assets/anchors-era${era}.json`, 'utf8'));

test('a mark shows for an unheard reading and stays away once heard, across redraws', () => {
  const marks = createAdvisorMarks();
  const reading = { id: 'cfo', band: 'alarmed', line: 'Payroll is Friday.' };
  assert.equal(marks.markFor('cfo', reading), 'alarmed');
  marks.heard('cfo', reading);
  assert.equal(marks.markFor('cfo', reading), null);
  assert.equal(marks.markFor('cfo', { ...reading }), null, 'the next day brings the same reading: still heard');
  assert.equal(marks.markFor('cfo', { ...reading, line: 'The lenders called.' }), 'alarmed', 'a different line is news');
});

test('a worse band brings the mark back; calm never marks', () => {
  const marks = createAdvisorMarks();
  const uneasy = { id: 'research', band: 'uneasy', line: 'Rivals are close.' };
  marks.heard('research', uneasy);
  assert.equal(marks.markFor('research', uneasy), null);
  assert.equal(marks.markFor('research', { ...uneasy, band: 'alarmed' }), 'alarmed');
  assert.equal(marks.markFor('research', { id: 'research', band: 'calm', line: 'All fine.' }), null);
  assert.equal(marks.markFor('research', undefined), null, 'no reading yet: no mark');
  assert.notEqual(readingKey(uneasy), readingKey({ ...uneasy, band: 'alarmed' }));
});

test('an improving mood is not news, and the worst band already heard stays remembered', () => {
  const marks = createAdvisorMarks();
  const alarmed = { id: 'cfo', band: 'alarmed', line: 'Payroll is Friday.' };
  marks.heard('cfo', alarmed);
  assert.equal(marks.markFor('cfo', { ...alarmed, band: 'uneasy' }), null);
  assert.equal(marks.markFor('cfo', alarmed), null, 'returning to an already-heard band is not new');
  assert.equal(marks.markFor('cfo', { ...alarmed, line: 'The lenders called.' }), 'alarmed', 'a new line is new');
});

test('a warning keeps its advisor marked until it is answered, even when calm or already heard', () => {
  const marks = createAdvisorMarks();
  const calm = { id: 'safety', band: 'calm', line: 'Quiet week.' };
  const alarmed = { id: 'cfo', band: 'alarmed', line: 'Payroll is Friday.' };
  marks.heard('cfo', alarmed);
  marks.setTasks([{ id: 'jailbreak', advisor: 'safety' }, { id: 'runway', advisor: 'cfo' }]);
  assert.equal(marks.markFor('safety', calm), 'uneasy', 'a calm advisor with a warning shows one "!"');
  assert.equal(marks.markFor('cfo', alarmed), 'alarmed', 'heard, but the warning still waits');
  assert.ok(marks.hasTask('safety'));
  marks.setTasks([{ id: 'runway', advisor: 'cfo' }]); // Safety's warning was answered.
  assert.equal(marks.markFor('safety', calm), null);
  assert.equal(marks.hasTask('safety'), false);
  marks.setTasks([]);
  assert.equal(marks.markFor('cfo', alarmed), null, 'answered, and the reading was heard');
});

test('listeners hear real changes only', () => {
  const marks = createAdvisorMarks();
  let calls = 0;
  const stop = marks.subscribe(() => { calls += 1; });
  const reading = { id: 'policy', band: 'uneasy', line: 'The senator called.' };
  marks.heard('policy', reading);
  marks.heard('policy', { ...reading });
  marks.setTasks([{ id: 'a', advisor: 'policy' }]);
  marks.setTasks([{ id: 'a', advisor: 'policy' }]);
  assert.equal(calls, 2);
  stop();
  marks.setTasks([]);
  assert.equal(calls, 2);
});

test('every era: each advisor\'s mark sits clear of every other person\'s head', () => {
  for (const era of [1, 2, 3, 4, 5]) {
    const { heads } = eraAnchors(era);
    for (const role of ADVISORS) {
      const { x, y } = markerSpot(role, heads);
      const [x0, y0, x1, y1] = markRect([x, y]);
      for (const [who, [hx, hy]] of Object.entries(heads)) {
        if (who === role) continue;
        const clear = hx + 18 <= x0 || hx - 18 >= x1 || hy >= y1 || hy + 36 <= y0;
        assert.ok(clear, `era ${era}: ${role}'s mark covers ${who}'s head`);
      }
    }
    // The owner's screenshot: the CFO's "!!" floated over the colleague's desk behind him.
    assert.equal(markerSpot('cfo', heads).side, 'left', `era ${era}: the CFO's mark flips left`);
  }
});

// Person-group boxes measured in the browser (getBBox mapped to the 1440 x 900 frame) for the loft, the K2 office and
// the building.
const BOXES = {
  1: { research: [436, 363, 623, 556], safety: [581, 410, 768, 605], cfo: [712, 515, 899, 697], policy: [339, 425, 526, 611], ceo: [538, 555, 725, 742], researcher1: [653, 358, 840, 520], researcher2: [772, 426, 958, 588] },
  3: { research: [438, 315, 625, 508], safety: [594, 413, 781, 607], cfo: [779, 545, 966, 727], policy: [320, 415, 507, 601], ceo: [559, 560, 813, 773], researcher1: [693, 344, 880, 507], researcher2: [822, 419, 1009, 581] },
  4: { research: [420, 295, 569, 450], safety: [570, 378, 720, 534], cfo: [720, 475, 870, 621], policy: [295, 387, 444, 536], ceo: [525, 514, 728, 684], researcher1: [787, 373, 937, 503], researcher2: [886, 430, 1035, 560] },
};

test('click areas: one per advisor, never overlapping, clear of the floor-menu spot and the phone', () => {
  for (const [era, boxes] of Object.entries(BOXES)) {
    const { heads, floorMenu } = eraAnchors(era);
    const marks = Object.fromEntries(ADVISORS.map((role) => {
      const { x, y } = markerSpot(role, heads);
      return [role, [x, y]];
    }));
    const phone = [heads.ceo[0] + 27, heads.ceo[1] + 121];
    const areas = hitAreas({ boxes, heads, marks, avoid: [floorMenu, phone] });
    assert.deepEqual(Object.keys(areas).sort(), [...ADVISORS].sort(), `era ${era}`);
    const owners = (point) => ADVISORS.filter((role) => areas[role].some((polygon) => insidePolygon(point, polygon)));
    for (const role of ADVISORS) {
      assert.deepEqual(owners([heads[role][0], heads[role][1] + 20]), [role], `era ${era}: ${role}'s head is in their own area`);
      assert.deepEqual(owners(marks[role]), [role], `era ${era}: ${role}'s mark is in their own area`);
    }
    for (const who of ['ceo', 'researcher1', 'researcher2']) {
      assert.deepEqual(owners([heads[who][0], heads[who][1] + 20]), [], `era ${era}: ${who}'s head is in no advisor's area`);
    }
    assert.deepEqual(owners(floorMenu), [], `era ${era}: the floor-menu spot stays floor`);
    assert.deepEqual(owners(phone), [], `era ${era}: the phone stays the phone`);
    for (let x = 250; x <= 1100; x += 7) {
      for (let y = 200; y <= 800; y += 7) assert.ok(owners([x, y]).length <= 1, `era ${era}: areas overlap at ${x},${y}`);
    }
  }
});
