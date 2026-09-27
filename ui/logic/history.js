import { ERAS } from '../../sim/data/eras.js';
import { RIVAL_TEMPLATES } from '../../sim/rivals.js';
import { activeModels } from '../../sim/serving.js';
import { storyDate } from '../../sim/time.js';
import { storyDayForTurn, users as formatUsers } from './format.js';

export const HISTORY_CHANNEL_WORDS = {
  enterprise: 'API',
  consumer: 'App and API',
  open: 'Open weights',
  agent: 'Agent product',
};

export const HISTORY_PRICE_WORDS = {
  undercut: 'Cheap',
  market: 'Market price',
  premium: 'Premium',
  free: 'Free',
};

// Exhaustive classification of release reactions from sim/data/launch.js, materialized by sim/launch.js.
export const CONTROVERSY_HANDLES = [
  '@devnull_ops',
  '@tired_parent',
  '@marketwire',
  '@lawyer_lena',
  '@sen_whitfield',
  '@indie_dev',
  '@benchwatch',
  '@ml_hobbyist',
  '@pm_everywhere',
  '@skeptic_sam',
];

export const NON_CRITICAL_REACTION_HANDLES = ['@lodestar_eng', '@early_adopter'];

const mean = (values) => values.length > 0
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : 0;

function eraForTurn(turn) {
  let end = 0;
  for (const era of ERAS) {
    end += era.turns;
    if (turn < end) return era;
  }
  return ERAS.at(-1);
}

function statusOf(state, model, serving) {
  if (serving.has(model)) return 'serving';
  if (!model.active) return 'retired';
  if (model.channel === 'open') return 'open';
  return 'upcoming';
}

export function historyRows(state) {
  // Serving means what the sim serves: not open weights, and online from activeFromTurn on.
  const serving = new Set(activeModels(state));
  return (state.models ?? [])
    .map((model, index) => ({ model, index }))
    .filter(({ model }) => Number.isFinite(model.releasedTurn) && model.launch)
    .sort((a, b) => a.model.releasedTurn - b.model.releasedTurn || a.index - b.index)
    .map(({ model }) => {
      const publicCapability = model.launch.benchmarks.filter((benchmark) => benchmark.kind === 'cap');
      const press = (model.launch.press ?? []).map(({ id, name, score, quip }) => ({ id, name, score, quip }));
      return {
        name: model.name,
        releasedTurn: model.releasedTurn,
        releasedDate: Number.isFinite(model.releasedDay)
          ? storyDate(model.releasedDay).label
          : storyDate(storyDayForTurn(model.releasedTurn)).label,
        era: eraForTurn(model.releasedTurn).name,
        channelWords: HISTORY_CHANNEL_WORDS[model.channel] ?? model.channel,
        priceWords: HISTORY_PRICE_WORDS[model.priceStance] ?? model.priceStance,
        pressAvg: mean(press.map((review) => review.score)),
        press,
        reactions: (model.launch.reactions ?? []).map(({ handle, text }) => ({ handle, text })),
        youAvg: mean(publicCapability.map((benchmark) => benchmark.shown)),
        rivalAvg: mean(publicCapability.map((benchmark) => benchmark.rival)),
        newUsers: model.newUsers,
        users: model.users,
        active: serving.has(model),
        status: statusOf(state, model, serving),
        activeFromTurn: model.activeFromTurn,
        activeFromDate: Number.isFinite(model.activeFromTurn)
          ? storyDate(storyDayForTurn(model.activeFromTurn)).label
          : '',
        benchmarks: model.launch.benchmarks.map(({ name, label, shown, rival }) => ({ name, label, shown, rival })),
      };
    });
}

export function labSummary(rows) {
  return {
    released: rows.length,
    bestPress: rows.length > 0 ? Math.max(...rows.map((row) => row.pressAvg)) : 0,
    biggestLaunch: rows.length > 0 ? Math.max(...rows.map((row) => row.newUsers)) : 0,
    stillServing: rows.filter((row) => row.active).length,
  };
}

export function raceSeries(rows, rivalReleases = []) {
  const points = rows.map((row) => ({ turn: row.releasedTurn, name: row.name, value: row.youAvg }));
  const rivals = rows.map((row) => ({ turn: row.releasedTurn, name: row.name, value: row.rivalAvg }));
  const turnsByLab = new Map(RIVAL_TEMPLATES.map((rival) => [rival.id, []]));
  for (const release of rivalReleases) {
    if (!turnsByLab.has(release.id) || !Number.isFinite(release.turn)) continue;
    turnsByLab.get(release.id).push(release.turn);
  }
  const hasTicks = [...turnsByLab.values()].some((turns) => turns.length > 0);
  const ticks = hasTicks
    ? RIVAL_TEMPLATES.map((rival) => ({ id: rival.id, name: rival.name, turns: [...turnsByLab.get(rival.id)] }))
    : [];
  return { you: points, rival: rivals, ticks };
}

const countWords = ['none of five', 'one of five', 'two of five', 'three of five', 'four of five', 'all five'];

const leadCount = (row) => row.benchmarks.filter((benchmark) => benchmark.shown > benchmark.rival).length;

function isControversyReaction(reaction) {
  if (!CONTROVERSY_HANDLES.includes(reaction.handle)) return false;
  // Marketwire has both a positive leaderboard headline and a critical underperformance report in the source pool.
  if (reaction.handle === '@marketwire') return reaction.text.includes('underwhelms; analysts question the spend');
  // Benchwatch also praises an earned version jump (release flow pick 3C); only its doubts are controversies.
  if (reaction.handle === '@benchwatch') return !reaction.text.includes('is earned');
  return true;
}

function availabilityPhrase(channelWords) {
  if (channelWords === 'API') return 'is sold through an API';
  if (channelWords === 'App and API') return 'is sold through an app and API';
  if (channelWords === 'Open weights') return 'is distributed as open weights';
  if (channelWords === 'Agent product') return 'is sold as an agent product';
  return `is available through ${channelWords}`;
}

const joined = (values) => {
  if (values.length < 2) return values[0] ?? '';
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
};

export function article(state, rows) {
  const developer = typeof state.labName === 'string' && state.labName.trim()
    ? state.labName
    : 'Your lab';
  if (rows.length === 0) return { title: developer, stub: true };

  const first = rows[0];
  const latest = rows.at(-1);
  const releasedModels = (state.models ?? [])
    .map((model, index) => ({ model, index }))
    .filter(({ model }) => Number.isFinite(model.releasedTurn) && model.launch)
    .sort((a, b) => a.model.releasedTurn - b.model.releasedTurn || a.index - b.index)
    .map(({ model }) => model);
  const family = releasedModels.at(-1)?.family || latest.name;
  const allFamilies = [...new Set(releasedModels.map((model) => model.family).filter(Boolean))];
  const earlierFamilies = allFamilies.filter((name) => name !== family);
  const lead = [
    `${family} is a family of large language models developed by ${developer}. `,
  ];
  if (earlierFamilies.length > 0) {
    lead.push(`The lab's earlier models were released under other names: ${joined(earlierFamilies)}. `);
  }
  lead.push(
    `The first model, ${first.name}, was released in the ${first.era.toLowerCase()} era and led the best rival on ${countWords[leadCount(first)]} public benchmarks. `,
    `${rows.length} ${rows.length === 1 ? 'model has' : 'models have'} been released so far; the latest, ${latest.name}, ${availabilityPhrase(latest.channelWords)} and led on ${countWords[leadCount(latest)]} at launch.`,
  );

  const references = [];
  const cite = (reference) => {
    references.push(reference);
    return { ref: references.length };
  };
  const reception = [`Reviews have averaged ${mean(rows.map((row) => row.pressAvg)).toFixed(1)} out of 10. `];
  for (const review of latest.press.slice(0, 2)) {
    reception.push(`${review.name} wrote of ${latest.name}: “${review.quip}”`);
    reception.push(cite(`${review.name}, review of ${latest.name}: “${review.quip}” (${review.score}/10).`));
    reception.push(' ');
  }
  if (reception.at(-1) === ' ') reception.pop();

  const seenHandles = new Set();
  const critical = [];
  for (const row of rows) {
    for (const reaction of row.reactions) {
      if (!isControversyReaction(reaction) || seenHandles.has(reaction.handle)) continue;
      seenHandles.add(reaction.handle);
      critical.push({ ...reaction, model: row.name });
    }
  }
  const controversies = [];
  for (const reaction of critical) {
    if (controversies.length > 0) controversies.push(' ');
    controversies.push(`After ${reaction.model} was released, ${reaction.handle} wrote, “${reaction.text}”`);
    controversies.push(cite(`${reaction.handle}, post about ${reaction.model}: “${reaction.text}”`));
  }
  if (controversies.length === 0) controversies.push('No controversies are recorded.');

  return {
    title: `${family} (language model)`,
    lead,
    table: {
      // Headed by each row's job: the named tests change with the era (sim/data/launch.js).
      benchmarks: first.benchmarks.map((benchmark) => benchmark.label),
      rows: rows.map((row) => ({
        name: row.name,
        released: `${row.era} · ${row.releasedDate}`,
        access: row.channelWords,
        benchmarks: row.benchmarks.map((benchmark) => benchmark.shown),
        pressAvg: row.pressAvg,
      })),
    },
    reception,
    controversies,
    references,
    infobox: {
      family,
      developer,
      firstRelease: { name: first.name, era: first.era, date: first.releasedDate },
      latestRelease: { name: latest.name, era: latest.era, date: latest.releasedDate },
      models: rows.length,
      type: 'Large language model',
      access: [...new Set(rows.map((row) => row.channelWords))],
      usersNow: formatUsers(rows.reduce((sum, row) => sum + (row.active ? row.users : 0), 0)),
    },
  };
}
