import { ENDINGS } from '../../sim/endings.js';

// Owner pick 7C: The Daily Token's archive, one front page per ending, wins first (the order the owner's mockup drew).
const ORDER = ['aligned', 'pacingDeal', 'pyrrhic', 'overtaken', 'misalignment', 'misuse', 'quietTakeover', 'rivalDisaster', 'boardRemoved', 'leftBehind', 'acquihire'];

// How to reach each ending, in a line, for the pages not printed yet. Draft copy the owner may rewrite; each line
// follows the rule in sim/endings.js, sim/release.js or sim/automation.js that ends the run.
const HINTS = {
  aligned: 'Get to the finish first without cutting corners.',
  pacingDeal: 'Get a binding deal to slow down, and keep it.',
  pyrrhic: 'Finish first, carrying a lot of shortcuts.',
  overtaken: 'Reach the end, but not in first place.',
  misalignment: 'Release capable agents while alignment work piles up undone.',
  misuse: 'Ship something powerful to anyone who asks.',
  quietTakeover: 'Let it run more and more of your lab.',
  rivalDisaster: 'Let the whole race run too hot.',
  boardRemoved: 'Lose the room at a board vote.',
  leftBehind: 'Fall too far behind when an era closes.',
  acquihire: 'Run out of money with no rescue left.',
};

const timesFound = (count) => (count === 1 ? 'Found once' : count === 2 ? 'Found twice' : `Found ${count} times`);
const pages = (n) => `${n} front page${n === 1 ? '' : 's'}`;

export function archiveModel(entries = []) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const list = ORDER.filter((id) => Object.hasOwn(ENDINGS, id)).map((id) => {
    const entry = byId.get(id);
    const { kind, title } = ENDINGS[id];
    if (!entry) return { id, kind, found: false, hint: HINTS[id] };
    return {
      id,
      kind,
      found: true,
      title,
      dateline: [entry.era != null ? `Era ${entry.era}` : null, entry.model].filter(Boolean).join(' · '),
      times: timesFound(entry.count),
      still: `ui/assets/endings/stills/${id}.jpg`,
    };
  });
  const found = list.filter((page) => page.found).length;
  const left = list.length - found;
  return {
    pages: list,
    found,
    total: list.length,
    printed: `${found} of ${pages(list.length)} printed`,
    toPrint: left ? `${pages(left)} still to print` : '',
  };
}
