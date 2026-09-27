// The advisors' "!" marks and their click areas in the office (owner playtest 2026-09-26: "I should be able to click
// in the general area here to read what's happening, and after I am done with their comment or task it should
// disappear"). UI state only: the sim never sees what the player has read.

const MOODS = ['calm', 'uneasy', 'alarmed'];

// What makes a reading new: its band and its line. The same reading again stays read.
export const readingKey = (reading) => (reading ? `${reading.band}|${reading.line ?? ''}` : '');

// Remembers per advisor the reading the player has heard and the warnings still waiting for an answer.
// A mark shows while the reading is unheard (and not calm), or while a warning waits, whatever the band.
export function createAdvisorMarks() {
  const heardKeys = new Map();
  let tasks = new Map(); // role -> sorted warning ids
  const listeners = new Set();
  const changed = () => { for (const listener of listeners) listener(); };

  return {
    heard(role, reading) {
      const key = readingKey(reading);
      if (heardKeys.get(role) === key) return;
      heardKeys.set(role, key);
      changed();
    },
    // warnings: [{ id, advisor }] waiting for "Look into it" or "Not now".
    setTasks(warnings) {
      const next = new Map();
      for (const { id, advisor } of warnings) next.set(advisor, [...(next.get(advisor) ?? []), id].sort());
      const same = next.size === tasks.size && [...next].every(([role, ids]) => tasks.get(role)?.join() === ids.join());
      tasks = next;
      if (!same) changed();
    },
    hasTask: (role) => tasks.has(role),
    // null (no mark), 'uneasy' ("!") or 'alarmed' ("!!").
    markFor(role, reading) {
      const band = MOODS.includes(reading?.band) ? reading.band : 'calm';
      if (tasks.has(role)) return band === 'calm' ? 'uneasy' : band;
      if (band === 'calm' || heardKeys.get(role) === readingKey(reading)) return null;
      return band;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// The one the office and the briefing share for this page.
export const advisorMarks = createAdvisorMarks();

// Where an advisor's mark sits. [x, y] is the bubble's bottom centre in the 1440 x 900 stage. K2's spot is up and to
// the right of the head; where another person sits there (the CFO below the researchers' desks, Safety beside one),
// the mark flips to the left, mirrored, so it never floats over a colleague.
export const MARK_W = 41;
export const MARK_H = 54;
const SIDES = { right: { dx: 22, dy: 0 }, left: { dx: -44, dy: 18 } };
const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));

export function markRect([x, y]) {
  return [x - MARK_W / 2, y - MARK_H, x + MARK_W / 2, y];
}

export function markerSpot(role, heads) {
  const [hx, hy] = heads[role];
  // A person's head and upper body below their head anchor.
  const others = Object.entries(heads).filter(([who]) => who !== role).map(([, [x, y]]) => [x - 30, y, x + 30, y + 110]);
  const spots = Object.entries(SIDES).map(([side, { dx, dy }]) => {
    const spot = [hx + dx, hy + dy];
    return { side, x: spot[0], y: spot[1], cost: others.reduce((sum, zone) => sum + overlap(markRect(spot), zone), 0) };
  });
  const [right, left] = spots;
  const best = left.cost < right.cost ? left : right;
  return { x: best.x, y: best.y, side: best.side };
}

// Clips a convex polygon to the half-plane of points no farther from `own` than from `other`.
function clipCloser(polygon, own, other) {
  const [nx, ny] = [other[0] - own[0], other[1] - own[1]];
  const limit = (other[0] ** 2 + other[1] ** 2 - own[0] ** 2 - own[1] ** 2) / 2;
  const inside = ([x, y]) => x * nx + y * ny <= limit + 1e-9;
  const out = [];
  polygon.forEach((point, i) => {
    const next = polygon[(i + 1) % polygon.length];
    const [a, b] = [inside(point), inside(next)];
    if (a) out.push(point);
    if (a !== b) {
      const [pa, pb] = [point[0] * nx + point[1] * ny, next[0] * nx + next[1] * ny];
      const t = (limit - pa) / (pb - pa);
      out.push([point[0] + t * (next[0] - point[0]), point[1] + t * (next[1] - point[1])]);
    }
  });
  return out;
}

const centre = ([x0, y0, x1, y1]) => [(x0 + x1) / 2, (y0 + y1) / 2];

// Each advisor's click area: their workstation's box (person, chair, desk, sign) joined with their mark, cut back to
// the points nearer to them than to anyone else (every person's head and workstation centre, plus the points in
// `avoid`, the CEO's phone and the floor menu's spot). Areas never overlap one another. Returns role -> polygons.
// boxes: role -> [x0, y0, x1, y1] for every person in the room; marks: advisor role -> the mark's [x, y].
export function hitAreas({ boxes, heads, marks, avoid = [] }) {
  const sitesOf = (role) => [heads[role], boxes[role] && centre(boxes[role]), marks[role]].filter(Boolean);
  const areas = {};
  for (const role of Object.keys(marks)) {
    if (!boxes[role] || !heads[role]) continue;
    const box = boxes[role];
    const mark = markRect(marks[role]);
    const [x0, y0, x1, y1] = [Math.min(box[0], mark[0]), Math.min(box[1], mark[1]), Math.max(box[2], mark[2]), Math.max(box[3], mark[3])];
    const rivals = [
      ...Object.keys(boxes).filter((who) => who !== role).flatMap(sitesOf),
      ...avoid,
    ];
    areas[role] = sitesOf(role)
      .map((own) => rivals.reduce((polygon, other) => (polygon.length ? clipCloser(polygon, own, other) : polygon),
        [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]))
      .filter((polygon) => polygon.length >= 3);
  }
  return areas;
}

// Is [x, y] inside a convex polygon (either winding)?
export function insidePolygon([x, y], polygon) {
  let sign = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[(i + 1) % polygon.length];
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (Math.abs(cross) < 1e-9) continue;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;
  }
  return true;
}
