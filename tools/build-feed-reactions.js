// Builds sim/data/feedReactions.js and sim/data/feedPeople.js from the owner-reviewed markdown in
// docs/design/feed-reactions/ and docs/design/feed-personas.md. Run after editing those files:
//   node tools/build-feed-reactions.js
import { readFileSync, writeFileSync } from 'node:fs';
import { EVENTS } from '../sim/data/events.js';
import { EVENTS_6C } from '../sim/data/events6c.js';
import { BOARD_EVENTS } from '../sim/data/boardEvents.js';

const DIR = process.env.FEED_MD_DIR ?? 'docs/design/feed-reactions';
const read = (name) => readFileSync(`${DIR}/${name}`, 'utf8').split('\n');
const BULLET = /^- (?:([a-z][a-z -]*?) )?`(@[a-z0-9_]+)` — (.+)$/;
const REPLY = /^ {2}- `(@[a-z0-9_]+)` — (.+)$/; // a reply under the post above it
const lower = (text) => text.toLowerCase().replace(/[“”"]/g, '');
const problems = [];

function put(tree, path, value) {
  let node = tree;
  for (const key of path.slice(0, -1)) node = node[key] ??= {};
  (node[path.at(-1)] ??= []).push(value);
}

// Walks one file; route(h2, h3, marker, prefix) returns the key path for a bullet, or null to skip it.
// A post is [handle, text] or [handle, text, { season, replies }]; replies are [handle, text] pairs.
function walk(lines, route, tree) {
  let h2 = '';
  let h3 = '';
  let marker = '';
  let last = null;
  for (const line of lines) {
    const reply = line.match(REPLY);
    if (reply) {
      if (!last) { problems.push(`reply with no post: ${line.slice(0, 60)}`); continue; }
      last[2] ??= {};
      (last[2].replies ??= []).push([reply[1], reply[2].trim()]);
      continue;
    }
    if (!line.startsWith('  ')) last = null;
    if (line.startsWith('## ')) { h2 = lower(line.slice(3)); h3 = ''; marker = ''; continue; }
    if (line.startsWith('### ')) { h3 = line.slice(4); marker = ''; continue; }
    const bold = line.match(/^\*\*(.+?)\*\*/);
    if (bold) { marker = line.replace(/\*\*/g, ''); continue; }
    const m = line.match(BULLET);
    if (!m) continue;
    const [, prefix = '', handle, text] = m;
    const season = text.match(/\*\(season: ([^)]+)\)\*/)?.[1];
    const clean = text.replace(/\s*\*\(season: [^)]+\)\*/, '').trim();
    const path = route({ h2, h3, h3l: lower(h3), marker, prefix });
    if (path === null) continue;
    if (!path) { problems.push(`no route: ${h2} / ${h3} / ${marker} / ${prefix} :: ${text.slice(0, 50)}`); continue; }
    last = season ? [handle, clean, { season }] : [handle, clean];
    put(tree, path, last);
  }
}

const starts = (text, ...options) => options.some((option) => text.startsWith(option));

// ---- releases.md
function releasesRoute({ h2, h3l, prefix }) {
  if (h2.startsWith('5.')) return ['launch', 'reasoningHigh'];
  if (h2.startsWith('6.')) return ['launch', 'capacity'];
  if (h2.startsWith('10.')) return ['launch', 'generic'];
  if (h2.startsWith('11.')) return ['later'];
  if (h2.startsWith('12.')) {
    const rival = ['openbrain', 'lodestar', 'deepthink', 'qilin'].find((id) => h3l.startsWith(id));
    return rival && ['small', 'big'].includes(prefix) ? ['rivals', rival, prefix] : undefined;
  }
  const table = [
    ['sycophancy', ['launch', 'flags', 'sycophancy']],
    ['hallucination', ['launch', 'flags', 'hallucination']],
    ['waiting jailbreak', ['launch', 'flags', 'jailbreakWaiting']],
    ['agentic', ['launch', 'flags', 'agentic']],
    ['contaminated', ['launch', 'flags', 'contaminated']],
    ['consumer app', ['launch', 'channel', 'consumer']],
    ['api only', ['launch', 'channel', 'enterprise']],
    ['announced, not live yet', ['launch', 'delayed']],
    ['press average high', ['launch', 'press', 'high']],
    ['press average low', ['launch', 'press', 'low']],
    ['cheap', ['launch', 'price', 'cheap']],
    ['premium', ['launch', 'price', 'premium']],
    ['skipped numbers, and the jump was earned', ['launch', 'jump', 'earned']],
    ['skipped numbers, and the jump was not earned', ['launch', 'jump', 'unearned']],
    ['tops the leaderboards', ['launch', 'rank', 'top']],
    ['underwhelms', ['launch', 'rank', 'under']],
    ['third-party evaluator', ['launch', 'eval', 'thirdParty']],
    ['government pre-deployment', ['launch', 'eval', 'gov']],
    ['quick internal checks', ['launch', 'eval', 'quick']],
    ['licensed data', ['launch', 'licensed']],
    ['any launch: artists', ['launch', 'artists']],
  ];
  return table.find(([head]) => h3l.startsWith(head))?.[1];
}

// ---- eras-company-mood.md
function erasRoute({ h2, h3l }) {
  const era = h3l.match(/^era (\d)/)?.[1];
  if (h2.startsWith('1.') && era) return ['eras', era];
  if (h2.startsWith('4.') && era) return ['ambient', era];
  const size = { small: 'small', medium: 'medium', large: 'large', 'extra large': 'xl' }[h3l.match(/^started a training run: (.+)$/)?.[1]];
  if (size) return ['training', 'start', size];
  if (h3l.startsWith('finished a training run: large')) return ['training', 'doneBig'];
  const table = [
    ['raised money', ['company', 'raise']],
    ['emergency', ['company', 'emergency']],
    ['paid off a lawsuit', ['company', 'lawsuitPaid']],
    ['trouble at a compute supplier', ['company', 'computeFailed']],
    ['fight over', ['company', 'conversionFight']],
    ['finished a training run', ['company', 'runComplete']],
    ['race heat passes 50', ['mood', 'raceHeat50']],
    ['race heat passes 75', ['mood', 'raceHeat75']],
    ['public trust falls', ['mood', 'trustLow']],
    ['public trust rises', ['mood', 'trustHigh']],
  ];
  return table.find(([head]) => h3l.startsWith(head))?.[1];
}

// ---- event-cards.md: headings carry the event id; "If you pick <label>" names the choice.
const ALL = [...EVENTS, ...EVENTS_6C, ...BOARD_EVENTS];
const norm = (text) => lower(text).replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
function choiceId(event, label) {
  const want = norm(label);
  const found = event.card.choices.find((c) => norm(c.label) === want)
    ?? event.card.choices.find((c) => norm(c.label).startsWith(want) || want.startsWith(norm(c.label)))
    ?? event.card.choices.find((c) => norm(c.label).split(' ').slice(0, 2).join(' ') === want.split(' ').slice(0, 2).join(' '))
    ?? event.card.choices.find((c) => norm(c.label).split(' ')[0] === want.split(' ')[0]);
  if (!found) problems.push(`no choice "${label}" on ${event.id}`);
  return found?.id;
}
function eventsRoute({ h3, marker, prefix }) {
  const id = h3.match(/\(`([a-zA-Z0-9]+)`/)?.[1];
  if (!id) return undefined;
  const event = ALL.find((candidate) => candidate.id === id);
  if (!event) { problems.push(`unknown event ${id}`); return undefined; }
  if (marker.startsWith('If you pick')) {
    const label = marker.slice('If you pick '.length).replace(/\s*\(.*$/, '');
    if (/only if/.test(marker) || /only if/.test(h3)) return null; // posts that need a later reveal the sim has no hook for
    const choice = choiceId(event, label);
    return choice ? ['events', id, 'choices', choice] : undefined;
  }
  if (prefix === 'rumour' || prefix === 'if it leaks' || /leaks/.test(marker)) return ['events', id, 'rumour'];
  return ['events', id, 'breaks'];
}

// ---- president-summit-finale.md
function presidentRoute({ h2, h3l, prefix }) {
  if (h2.startsWith('1.')) {
    const table = [
      ['the meeting happens', ['president', 'first', 'happens']],
      ['after a plain answer', ['president', 'first', 'war', 'plain']],
      ['after flattery', ['president', 'first', 'war', 'flatter']],
      ['after the hawk answer', ['president', 'first', 'war', 'hawk']],
      ['the president walks out', ['president', 'first', 'walkout']],
      ['after the woke question: any answer', ['president', 'first', 'woke', 'any']],
      ['after the woke question: the comedian answer', ['president', 'first', 'woke', 'comedian']],
      ['after the woke question: a dodge', ['president', 'first', 'woke', 'dodge']],
    ];
    return table.find(([head]) => h3l.startsWith(head))?.[1];
  }
  if (h2.startsWith('2.')) {
    if (h3l.startsWith('a promise is called in')) return ['promise', 'called'];
    if (h3l.startsWith('stalled or refused')) return ['promise', 'stalled'];
    const label = h3l.match(/^delivered: (.+)$/)?.[1];
    return label ? ['promise', 'delivered', label.trim()] : undefined;
  }
  if (h2.startsWith('3.')) {
    const table = [
      ['the meeting happens', ['president', 'second', 'happens']],
      ['after a plain answer', ['president', 'second', 'control', 'plain']],
      ['after the comedian answer', ['president', 'second', 'control', 'comedian']],
      ['on the pause question', ['president', 'second', 'pause']],
    ];
    return table.find(([head]) => h3l.startsWith(head))?.[1];
  }
  if (h2.startsWith('4.')) {
    const table = [
      ['the summit opens', ['summit', 'opens']],
      ['checks on the table', ['summit', 'checks']],
      ['the deal is signed', ['summit', 'signed']],
      ['the deal fails', ['summit', 'failed']],
      ['a lab is caught', ['summit', 'caught']],
      ['a false accusation', ['summit', 'falseAlarm']],
    ];
    return table.find(([head]) => h3l.startsWith(head))?.[1];
  }
  if (h2.startsWith('5.')) return ['finale', h3l.replace(/[^a-z0-9]+/g, ' ').trim(), prefix || 'any'];
  return undefined;
}

const tree = {};
walk(read('releases.md'), releasesRoute, tree);
walk(read('eras-company-mood.md'), erasRoute, tree);
walk(read('event-cards.md'), eventsRoute, tree);
walk(read('president-summit-finale.md'), presidentRoute, tree);
walk(read('everyday.md'), () => ['everyday'], tree);
walk(read('world-news.md'), () => ['world'], tree);

// ---- people: display names, badges and reach for every persona.
const people = {};
let section = '';
for (const line of readFileSync('docs/design/feed-personas.md', 'utf8').split('\n')) {
  const sec = line.match(/^## ([A-I])\./);
  if (sec) section = sec[1];
  const m = line.match(/^### (\d+)\. (.+?) — `(@[a-z0-9_]+)`/);
  if (!m) continue;
  const [, n, rawName, handle] = m;
  const name = rawName.replace(/^"|"$/g, '');
  const famous = section === 'A';
  const badge = section === 'I' ? 'org' : { '@sen_whitfield': 'gov', '@sesameandsons': 'org', '@localnews': 'org' }[handle]
    ?? (famous && !['@crab_apple_leaks'].includes(handle) ? 'blue' : ['@official_giveaway_7731', '@techfluencer'].includes(handle) ? 'blue' : null);
  const reach = famous || handle === '@globalwire' ? 3 : ['C', 'D', 'E', 'I'].includes(section) ? 2 : 1;
  people[handle] = { n: Number(n), name, ...(badge ? { badge } : {}), reach };
}

const used = new Set(JSON.stringify(tree).match(/@[a-z0-9_]+/g));
for (const handle of used) if (!people[handle]) problems.push(`handle ${handle} is not a persona`);

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const header = '// Generated by tools/build-feed-reactions.js from docs/design/feed-reactions/*.md. Do not edit by hand.\n';
writeFileSync('sim/data/feedReactions.js', `${header}// Each post is [handle, text] or [handle, text, { season, replies: [[handle, text]] }]. {model}, {lab}, {rival}, {name}, {coding} and {science} are filled in at post time.\nexport const REACTIONS = ${JSON.stringify(tree, null, 1)};\n`);
writeFileSync('sim/data/feedPeople.js', `${header.replace('feed-reactions/*.md', 'feed-personas.md')}// The 100 personas and 4 news desks. badge: blue (verified), gov, org. reach: 3 famous, 2 public figure, 1 everyone else.\nexport const PEOPLE = ${JSON.stringify(people, null, 1)};\n`);
const isPost = (node) => Array.isArray(node) && typeof node[0] === 'string';
const count = (node) => isPost(node) ? 1 + (node[2]?.replies?.length ?? 0) : Object.values(node).reduce((s, v) => s + count(v), 0);
console.log(`wrote ${count(tree)} posts and ${Object.keys(people).length} people`);
