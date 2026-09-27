// The first-minute tour (owner pick B, 2026-09-26): the team shows a new player round the office, one person at a
// time, then waits for the player's first click on the floor. Nothing here names a later era.

export const TOUR_SEEN_KEY = 'gnal.intro.v1';

// point: what the step outlines besides the speaker ('badges' the capability and alignment circles, 'money' the cash
// and runway panel, 'floor' a ring on the floor plus a note on the clock). The last step waits for the floor click.
export const TOUR = [
  { who: 'research', say: 'Hi, boss. I build the models. Click on any of us whenever you want to know what we think. We have opinions.' }, // OWNER WRITES
  { who: 'safety', point: 'badges', say: 'Those two circles up top are the model we are building. Capability is how strong it is. Alignment is how much of that we can trust. I watch the second one.' }, // OWNER WRITES
  { who: 'cfo', point: 'money', say: 'Cash and runway live up there, top right. Runway is how long until the money runs out. If I start sweating, look at it.' }, // OWNER WRITES
  { who: 'policy', say: 'I talk to the press and to Washington. When the world notices us, I hear it first. Usually.' }, // OWNER WRITES
  { who: 'research', point: 'floor', say: 'When you want us to do something, click the floor. Anywhere. Start with a training run; we are bored.' }, // OWNER WRITES
];

export const CLOCK_NOTE = 'Time runs while you work. Pause whenever you like; ×2 and ×4 hurry it.'; // OWNER WRITES

// A fresh run on the normal start, not a debug route or a scenario that begins later in the story.
export function isFreshStart(state, { scenario = 'start', hash = '' } = {}) {
  return scenario === 'start'
    && !hash
    && !state.ending
    && state.day === 0
    && state.models.length === 0
    && !state.activeRun
    && !state.pendingModel;
}

export function tourSeen(storage) {
  try {
    return storage?.getItem(TOUR_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourSeen(storage) {
  try {
    storage?.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    // Blocked storage only means the tour may show again next run.
  }
}
