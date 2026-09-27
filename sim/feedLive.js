// The live persona feed (owner 2026-09-26): the 100 personas react to what happens, and their posts
// arrive over the following story days instead of all at once. Content: sim/data/feedReactions.js,
// generated from docs/design/feed-reactions/*.md by tools/build-feed-reactions.js.
import { createRng } from './rng.js';
import { rank } from './rivals.js';
import { computeSlices } from './split.js';
import { ROUND_DAYS } from './time.js';
import { JUMP_EARNED_GAIN } from './data/launch.js';
import { eraScale } from './data/compute.js';
import { SIZE_UNITS } from './recipe.js';
import { PROMISES } from './data/promises.js';
import { REACTIONS as R } from './data/feedReactions.js';

export const FEED_KEEP = 400; // posts kept for scrolling back
const RECENT = 200; // a text posted this recently is not posted again
const PARTY_NAMES = { west: 'the American delegation', east: 'the Chinese delegation' };
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const SEASON_MONTHS = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], 'late summer': [7, 8], autumn: [8, 9, 10] };

// The story month (0-11) of a story day; the game calendar has 365-day years.
function monthOf(day) {
  let rest = ((day % 365) + 365) % 365;
  let m = 0;
  while (rest >= MONTH_DAYS[m]) { rest -= MONTH_DAYS[m]; m += 1; }
  return m;
}
const inSeason = (extra, day) => !extra?.season || (SEASON_MONTHS[extra.season] ?? []).includes(monthOf(day));

// A stream of its own per story day and purpose, so feed picks never move the game's rng.
const feedRng = (state, salt) => createRng(((state.seed >>> 0) * 2246822519 + state.day * 3266489917 + salt * 668265263) >>> 0);
const hash = (text) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

const partyName = (state, party) => state.rivals.find((r) => r.id === party)?.name ?? PARTY_NAMES[party] ?? 'a rival lab';

function newestLiveModel(state) {
  let newest = null;
  for (const [index, model] of (state.models ?? []).entries()) {
    if (!model.active || !model.activated) continue;
    if (!newest || (model.releaseSequence ?? index) >= (newest.releaseSequence ?? -1)) newest = model;
  }
  return newest;
}

// {lab} stays in the stored text and is filled in when the feed is shown (labText), so a lab named later still reads right.
function render(state, text, { model, rival, gpus } = {}) {
  return text
    .replaceAll('{gpus}', () => gpus ?? 'thousands of GPUs')
    .replaceAll('{model}', () => model?.name ?? newestLiveModel(state)?.name ?? 'the new model')
    .replaceAll('{rival}', () => rival ?? 'a rival lab')
    .replaceAll('{name}', () => state.lumenName ?? 'Lumen');
}

// Fills {lab} with the player's lab name, or "Your lab" before it has one; minds "the {lab}" and possessives.
export function labText(text, labName) {
  const named = typeof labName === 'string' && labName.trim() ? labName.trim() : null;
  const name = named ?? 'Your lab';
  let out = named ? text : text.replace(/\bthe \{lab\}/g, '{lab}');
  out = out.replace(/\{lab\}'s/g, name.endsWith('s') ? `${name}'` : `${name}'s`);
  return out.replaceAll('{lab}', name);
}

// Posts land on story days: `from`..`to` days from today (0 = today).
function scheduler(state, salt) {
  const rng = feedRng(state, salt);
  state.feedQueue ??= [];
  const taken = new Set([...state.feed.slice(-RECENT), ...state.feedQueue].map((post) => post.text));
  return {
    rng,
    // Picks up to n unused templates from pool and schedules them; a post's replies follow it the same day or the next.
    add(pool, n, tag, { from = 0, to = 0, ...ctx } = {}) {
      const free = (pool ?? []).filter(([, text]) => !taken.has(render(state, text, ctx)));
      for (let k = 0; k < n && free.length;) {
        const [handle, raw, extra] = free.splice(rng.int(0, free.length - 1), 1)[0];
        const text = render(state, raw, ctx);
        const day = state.day + rng.int(from, Math.max(from, to));
        if (!inSeason(extra, day)) continue; // a seasonal post only lands on a day in its season
        k += 1;
        taken.add(text);
        state.feedQueue.push({ turn: state.turn, day, handle, text, tag });
        // The replies are a conversation: each answers the one before it.
        let after = day;
        let prev = { handle, text };
        for (const [replyHandle, replyRaw] of extra?.replies ?? []) {
          const reply = render(state, replyRaw, ctx);
          if (taken.has(reply)) continue;
          taken.add(reply);
          after += rng.int(0, 1);
          state.feedQueue.push({ turn: state.turn, day: after, handle: replyHandle, text: reply, tag, replyTo: prev.handle, replyToText: prev.text });
          prev = { handle: replyHandle, text: reply };
        }
      }
    },
  };
}

// Moves posts whose day has come from the queue into the feed, oldest first. Once the run is over no
// later day comes, so everything still waiting is released.
export function releaseDueFeed(state) {
  if (!state.feedQueue?.length) return;
  const isDue = (post) => Boolean(state.ending) || post.day <= state.day;
  const due = state.feedQueue.filter(isDue).sort((a, b) => a.day - b.day); // stable: a reply stays after its post
  if (!due.length) return;
  state.feedQueue = state.feedQueue.filter((post) => !isDue(post));
  for (const post of due) state.feed.push({ ...post, turn: state.turn, day: Math.min(post.day, state.day) });
  if (state.feed.length > FEED_KEEP) state.feed.splice(0, state.feed.length - FEED_KEEP);
}

function launchPools(state, model) {
  const L = R.launch;
  const flags = model.flags ?? [];
  const pools = flags.map((flag) => L.flags[flag]).filter(Boolean);
  const channel = model.channel === 'agent' ? 'enterprise' : model.channel;
  if (L.channel[channel]) pools.push(L.channel[channel]);
  const press = model.launch?.pressAvg;
  if (press >= 7) pools.push(L.press.high);
  if (press <= 4) pools.push(L.press.low);
  if (['undercut', 'free'].includes(model.priceStance)) pools.push(L.price.cheap);
  if (model.priceStance === 'premium') pools.push(L.price.premium);
  if (model.reasoning === 'high') pools.push(L.reasoningHigh);
  if (model.skipped > 0) {
    const gain = (model.launch?.capAvg ?? 0) - (model.bar ?? 0);
    pools.push(gain >= JUMP_EARNED_GAIN ? L.jump.earned : L.jump.unearned);
  }
  if (rank(state) === 1 && (model.launch?.beats ?? 0) >= 4) pools.push(L.rank.top);
  if ((model.launch?.beats ?? 4) <= 1) pools.push(L.rank.under);
  if (flags.includes('thirdPartyEval')) pools.push(L.eval.thirdParty);
  if (flags.includes('govEval')) pools.push(L.eval.gov);
  if (flags.includes('quickEval')) pools.push(L.eval.quick);
  if (channel === 'consumer') pools.push(L.artists);
  return pools;
}

function launchBurst(state, model, s) {
  const pools = launchPools(state, model);
  // One post from each thing the model is, most of them today; then two ordinary posts over the next days.
  pools.forEach((pool, index) => s.add(pool, 1, 'launch', { model, from: index < 3 ? 0 : 1, to: index < 3 ? 0 : 3 }));
  s.add(R.launch.generic, 2, 'launch', { model, from: 0, to: 3 });
}

function presidentPosts(state, event, s) {
  const meeting = R.president[event.id];
  if (!meeting || !event.answers) return; // no answers means the meeting never happened
  s.add(meeting.happens, 1, 'president', { from: 0, to: 0 });
  if (event.walkedOut) {
    s.add(meeting.walkout, 2, 'president', { from: 0, to: 1 });
    return;
  }
  for (const answerId of event.answers) {
    const [, topic, style] = answerId.split('-');
    const posts = meeting[topic];
    if (!posts) continue;
    if (Array.isArray(posts)) s.add(posts, 1, 'president', { from: 1, to: 3 });
    else {
      s.add(posts[style], 1, 'president', { from: 1, to: 3 });
      if (topic === 'woke') {
        s.add(posts.any, 1, 'president', { from: 1, to: 3 });
        if (['plain', 'jargon'].includes(style)) s.add(posts.dodge, 1, 'president', { from: 1, to: 3 });
      }
    }
  }
}

function choicePosts(state, event, s) {
  if (event.eventId === 'promiseCall') {
    if (event.choiceId === 'deliver') {
      const label = PROMISES[event.promiseId]?.deliver.label.toLowerCase();
      s.add(R.promise.delivered[label], 2, 'event', { from: 0, to: 2 });
    } else s.add(R.promise.stalled, 1, 'event', { from: 0, to: 1 });
    return;
  }
  const posts = R.events[event.eventId ?? event.id]?.choices?.[event.choiceId];
  s.add(posts, 1, 'event', { from: 0, to: 0 });
  s.add(posts, 2, 'event', { from: 1, to: 2 });
}

// A run's size in the era's top chips, the same count the recipe screen shows: 1 compute unit is 1,000 of them
// (owner-approved 2026-09-26 via gn-pacing; research in docs/research/compute-mechanics).
const ERA_CHIPS = ['A100', 'H100', 'H200', 'GB200', 'Rubin'];
export function runGpus(size, era) {
  const count = SIZE_UNITS[size] * eraScale(era) * 1000;
  const shown = count >= 1e6 ? `${count / 1e6} million` : count.toLocaleString('en-US');
  return `${shown} ${ERA_CHIPS[era - 1]}s`;
}

// The player started a training run: the bigger the run, the more people notice (owner 2026-09-26).
// A run that started and finished in one step is already the pending model.
function trainingStartPosts(state, s) {
  const size = state.activeRun?.recipe.sliders.size ?? state.pendingModel?.size;
  const pool = R.training.start[size];
  if (!pool) return;
  const gpus = runGpus(size, state.era);
  if (size === 'small') {
    if (s.rng.chance(0.5)) s.add(pool, 1, 'company', { gpus, from: 0, to: 2 });
  } else if (size === 'medium') s.add(pool, 1, 'company', { gpus, from: 0, to: 2 });
  else if (size === 'large') {
    s.add(pool, 1, 'company', { gpus, from: 0, to: 1 });
    s.add(pool, 1, 'company', { gpus, from: 1, to: 4 });
  } else if (size === 'xl') {
    s.add(pool, 2, 'company', { gpus, from: 0, to: 1 });
    s.add(pool, 2, 'company', { gpus, from: 1, to: 6 });
  }
}

// A card has landed today: the crowd starts talking (or, for things inside the lab, a rumour may start).
export function reactToLandedCard(state, card) {
  const s = scheduler(state, 101 + hash(card.id) % 997);
  const id = card.eventId ?? card.id;
  if (id === 'promiseCall') {
    s.add(R.promise.called, 1, 'event', { from: 0, to: 1 });
    return;
  }
  if (id === 'neocloudTrouble') s.add(R.company.computeFailed, 1, 'company', { from: 0, to: 1 });
  const reactions = R.events[id];
  if (!reactions) return;
  if (reactions.breaks?.length) {
    s.add(reactions.breaks, 2, 'event', { from: 0, to: 0 });
    s.add(reactions.breaks, 2, 'event', { from: 1, to: 3 });
  } else if (reactions.rumour?.length && s.rng.chance(0.6)) {
    s.add(reactions.rumour, 1, 'rumour', { from: 0, to: 2 });
  }
}

// A new run starts in era 1 without an eraStart event, so the era's opening posts are scheduled here, before
// the first day passes: they land on day 1, the first day the player sees, and over the week after it.
export function reactToRunStart(state) {
  const s = scheduler(state, 3);
  s.add(R.eras[1], 2, 'era', { from: 1, to: 1 });
  s.add(R.eras[1], 2, 'era', { from: 2, to: 7 });
}

// Reactions to one step's events. atMark: the step ends a round, so time-based posts run too.
export function reactToEvents(before, state, events, { atMark = false } = {}) {
  const s = scheduler(state, 7);
  for (const event of events) {
    switch (event.type) {
      case 'release':
        if (event.model?.activated) launchBurst(state, event.model, s);
        else if (event.model) s.add(R.launch.delayed, 2, 'announce', { model: event.model, from: 0, to: 1 });
        break;
      case 'modelLive': launchBurst(state, event.model, s); break;
      case 'rivalRelease': {
        const pool = R.rivals[event.id]?.[event.gain >= 8 ? 'big' : 'small'];
        s.add(pool, 1, 'rival', { from: 0, to: 0 });
        s.add(pool, 1, 'rival', { from: 1, to: 2 });
        break;
      }
      case 'eraStart':
        s.add(R.eras[event.era], 2, 'era', { from: 0, to: 0 });
        s.add(R.eras[event.era], 2, 'era', { from: 1, to: 6 });
        if (event.era === 5) s.add(R.summit.opens, 2, 'summit', { from: 2, to: 6 });
        break;
      case 'raise': case 'emergency': case 'lawsuitPaid': case 'conversionFight':
        s.add(R.company[event.type], 2, 'company', { from: 0, to: 2 });
        break;
      case 'startRun': trainingStartPosts(state, s); break;
      // Same day: the player may release the model the next day, and these posts talk about it as not out yet.
      case 'runComplete':
        s.add(R.company.runComplete, 1, 'company', { from: 0, to: 0 });
        if (['large', 'xl'].includes(state.pendingModel?.size)) s.add(R.training.doneBig, 1, 'company', { from: 0, to: 0 });
        break;
      case 'eventResolved': choicePosts(state, event, s); break;
      case 'meetingOutcome': presidentPosts(state, event, s); break;
      case 'summit':
        if (event.binding?.length) { // a deal with at least one binding commitment
          s.add(R.summit.signed, 2, 'summit', { from: 0, to: 1 });
          s.add(R.summit.checks, 1, 'summit', { from: 1, to: 3 });
        } else s.add(R.summit.failed, 2, 'summit', { from: 0, to: 1 });
        break;
      // The summit's checks or an investigation catch a lab breaking the deal, or clear one wrongly accused (sim/summit.js).
      case 'playerCaught': s.add(R.summit.caught, 2, 'summit', { rival: '{lab}', from: 0, to: 2 }); break;
      case 'dealBreakCaught': s.add(R.summit.caught, 2, 'summit', { rival: partyName(state, event.party), from: 0, to: 2 }); break;
      case 'investigated':
        if (event.found) s.add(R.summit.caught, 2, 'summit', { rival: partyName(state, event.party), from: 0, to: 2 });
        else if (event.insulted) s.add(R.summit.falseAlarm, 2, 'summit', { rival: partyName(state, event.party), from: 0, to: 2 });
        break;
      case 'dealCollapsed': case 'summitSkipped': s.add(R.summit.failed, 2, 'summit', { from: 0, to: 2 }); break;
      default: break;
    }
  }
  if (!atMark || state.ending) return;
  const round = ROUND_DAYS[state.era];
  // The weeks after a launch: one or two posts spread over the coming round.
  const model = newestLiveModel(state);
  const age = model ? state.turn - model.activeFromTurn : null;
  if (age >= 1 && age <= 3) {
    s.add(R.later, s.rng.int(1, 2), 'reception', { model, from: 1, to: round - 1 });
    if (!state.compute.split.coverWithSpot && computeSlices(state).shortfall > 0) {
      s.add(R.launch.capacity, 1, 'reception', { model, from: 0, to: 2 });
    }
  }
  if (before.raceHeat < 75 && state.raceHeat >= 75) s.add(R.mood.raceHeat75, 2, 'mood', { from: 0, to: 2 });
  else if (before.raceHeat < 50 && state.raceHeat >= 50) s.add(R.mood.raceHeat50, 2, 'mood', { from: 0, to: 2 });
  if (before.publicTrust >= 40 && state.publicTrust < 40) s.add(R.mood.trustLow, 2, 'mood', { from: 0, to: 2 });
  else if (before.publicTrust < 75 && state.publicTrust >= 75) s.add(R.mood.trustHigh, 2, 'mood', { from: 0, to: 2 });
  // Quiet days are never silent: an AI post or two across the round, and now and then an everyday one.
  s.add(R.ambient[state.era], 2, 'ambient', { from: 1, to: round - 1 });
  if (s.rng.chance(0.6)) s.add(R.everyday, 1, 'everyday', { from: 1, to: round - 1 });
  // The world outside AI: a headline or two per round, usually with an argument underneath.
  s.add(R.world, s.rng.chance(0.3) ? 2 : 1, 'world', { from: 1, to: round - 1 });
}
