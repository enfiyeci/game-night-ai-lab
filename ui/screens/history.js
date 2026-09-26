import { ERAS } from '../../sim/data/eras.js';
import { storyDate } from '../../sim/time.js';
import { openDialog } from '../components/dialog.js';
import { storyDayForTurn, users } from '../logic/format.js';
import { article, historyRows, labSummary, raceSeries } from '../logic/history.js';
import { registerMenuHandler } from '../menu.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const RACE_CARD_WIDTH = 164;
const RACE_CARD_GAP = 8;
const RACE_CARD_ROW_HEIGHT = 178;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgElement(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, `${value}`);
  if (text !== undefined) node.textContent = text;
  return node;
}

const turnWords = (row) => `${row.era} · ${row.releasedDate}`;
const clampPercent = (value) => `${Math.max(0, Math.min(100, value))}%`;

function summaryPanel(summary) {
  const root = element('div', 'history-models-stats');
  const entries = [
    ['Models released', `${summary.released}`],
    ['Best press', summary.bestPress.toFixed(1)],
    ['Biggest launch', `+${users(summary.biggestLaunch)}`],
    ['Still serving', `${summary.stillServing}`],
  ];
  for (const [label, value] of entries) {
    const row = element('div', 'history-models-stat');
    row.append(element('span', '', label), element('b', '', value));
    root.append(row);
  }
  return root;
}

function selectedPanel(root, row) {
  root.replaceChildren();
  root.append(element('h3', 'history-models-detail-title', row.name));
  for (const review of row.press.slice(0, 3)) {
    const quote = element('div', 'history-models-quote');
    const head = element('div', 'history-models-quote-head');
    head.append(element('b', '', review.name), element('b', '', `${review.score}/10`));
    quote.append(head, element('p', '', review.quip));
    root.append(quote);
  }
  const post = row.reactions.find((reaction) => reaction.handle !== '@marketwire') ?? row.reactions[0];
  if (post) {
    const reaction = element('p', 'history-models-post');
    reaction.append(element('b', '', post.handle), document.createTextNode(` ${post.text}`));
    root.append(reaction);
  }
}

function averageCell(row) {
  const cell = element('td', 'history-models-leaderboard');
  const grid = element('div', 'history-models-lead');
  for (const [label, value, kind] of [['You', row.youAvg, 'you'], ['Rival', row.rivalAvg, 'rival']]) {
    grid.append(element('span', kind === 'rival' ? 'history-muted' : '', `${label} ${Math.round(value)}`));
    const bar = element('span', `history-models-bar history-models-bar-${kind}`);
    const fill = element('i');
    fill.style.width = clampPercent(value);
    bar.append(fill);
    grid.append(bar);
  }
  cell.append(grid);
  return cell;
}

function modelTable(rows, selectedIndex, onSelect) {
  const wrap = element('div', 'history-models-table-wrap');
  const table = element('table', 'history-models-table');
  const head = document.createElement('thead');
  const headings = ['Model', 'Access', 'Press', 'Leaderboard at launch', 'Launch', 'Users now'];
  const headingRow = document.createElement('tr');
  for (const name of headings) headingRow.append(element('th', '', name));
  head.append(headingRow);
  const body = document.createElement('tbody');
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.tabIndex = 0;
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', `Select ${row.name}`);
    tr.classList.toggle('history-models-selected', index === selectedIndex);
    const name = document.createElement('td');
    const strong = element('strong', 'history-models-name', row.name);
    strong.append(element('small', 'history-muted', turnWords(row)));
    name.append(strong);
    const access = document.createElement('td');
    access.append(document.createTextNode(row.channelWords), document.createElement('br'), element('span', 'history-muted', row.priceWords));
    const press = element('td', 'history-models-press');
    press.append(element('b', '', row.pressAvg.toFixed(1)), element('span', 'history-muted', ' / 10'));
    const launch = element('td', 'history-models-number', `+${users(row.newUsers)}`);
    const current = element('td', 'history-models-number');
    const statusWords = { open: 'Open weights', upcoming: `From ${row.activeFromDate}`, retired: 'Retired' };
    current.append(row.status === 'serving' ? document.createTextNode(users(row.users)) : element('span', 'history-muted', statusWords[row.status]));
    tr.append(name, access, press, averageCell(row), launch, current);
    const select = () => onSelect(index);
    tr.addEventListener('click', select);
    tr.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      select();
    });
    body.append(tr);
  });
  table.append(head, body);
  const key = element('div', 'history-models-key');
  for (const [kind, label] of [
    ['you', 'Your model, average of four public benchmarks'],
    ['rival', 'Best rival at the time'],
  ]) {
    const item = element('span');
    item.append(element('i', `history-models-key-${kind}`), document.createTextNode(label));
    key.append(item);
  }
  wrap.append(table, key);
  return wrap;
}

function chartLegend(hasTicks) {
  const root = element('div', 'history-race-legend');
  const entries = [
    ['you', 'Your latest model'],
    ['rival', 'Best rival when you launched'],
  ];
  if (hasTicks) entries.push(['tick', 'A rival released a model']);
  for (const [kind, label] of entries) {
    const item = element('span');
    item.append(element('i', `history-race-legend-${kind}`), document.createTextNode(label));
    root.append(item);
  }
  return root;
}

function raceChart(rows, series, nowTurn, nowDate, height = 350) {
  const width = 1280;
  const padLeft = 110;
  const padRight = 16;
  const top = 30;
  const bottom = series.ticks.length > 0 ? 62 : 28;
  const baseY = height - bottom;
  const totalTurns = ERAS.reduce((sum, era) => sum + era.turns, 0);
  const x = (turn) => padLeft + (Math.max(0, Math.min(totalTurns, turn)) / totalTurns) * (width - padLeft - padRight);
  const y = (value) => top + (1 - value / 100) * (height - top - bottom);
  const svg = svgElement('svg', {
    class: 'history-race-chart', width, height, viewBox: `0 0 ${width} ${height}`,
    role: 'img', 'aria-label': "Your public benchmark average at each launch against the best rival's",
  });

  let eraStart = 0;
  ERAS.forEach((era, index) => {
    const eraEnd = eraStart + era.turns;
    svg.append(svgElement('rect', {
      x: x(eraStart), y: top - 26, width: x(eraEnd) - x(eraStart), height: baseY - top + 26,
      class: index % 2 ? 'history-race-era history-race-era-alt' : 'history-race-era',
    }));
    svg.append(svgElement('text', { x: x(eraStart) + 10, y: top - 10, class: 'history-race-era-label' }, `ERA ${era.id} · ${era.name.toUpperCase()}`));
    eraStart = eraEnd;
  });

  for (const value of [0, 25, 50, 75, 100]) {
    svg.append(svgElement('line', { x1: padLeft, x2: width - padRight, y1: y(value), y2: y(value), class: value ? 'history-race-grid' : 'history-race-grid history-race-axis' }));
    svg.append(svgElement('text', { x: padLeft - 8, y: y(value) + 4, 'text-anchor': 'end', class: 'history-race-axis-label' }, value));
  }

  const path = (points) => points.map((point, index) => `${index ? 'H' : 'M'}${x(point.turn)} ${index ? `V${y(point.value)}` : y(point.value)}`).join(' ');
  if (series.rival.length > 0) {
    svg.append(svgElement('path', { d: `${path(series.rival)} H${x(nowTurn)}`, class: 'history-race-line history-race-line-rival' }));
    svg.append(svgElement('path', { d: `${path(series.you)} H${x(nowTurn)}`, class: 'history-race-line history-race-line-you' }));
  }
  series.rival.forEach((point) => svg.append(svgElement('circle', { cx: x(point.turn), cy: y(point.value), r: 5, class: 'history-race-dot-rival' })));
  series.you.forEach((point) => {
    svg.append(svgElement('circle', { cx: x(point.turn), cy: y(point.value), r: 7, class: 'history-race-dot-you' }));
    svg.append(svgElement('text', { x: x(point.turn) + 10, y: y(point.value) - 10, class: 'history-race-value' }, Math.round(point.value)));
  });

  series.ticks.forEach((lab, row) => {
    const rowY = baseY + 14 + row * 12;
    svg.append(svgElement('text', { x: padLeft - 8, y: rowY + 3.5, 'text-anchor': 'end', class: 'history-race-lab' }, lab.name));
    lab.turns.forEach((turn) => svg.append(svgElement('rect', { x: x(turn) - 5, y: rowY - 3, width: 10, height: 6, rx: 3, class: 'history-race-tick' })));
  });
  svg.append(svgElement('line', { x1: x(nowTurn), x2: x(nowTurn), y1: top - 26, y2: baseY, class: 'history-race-now-line' }));
  svg.append(svgElement('text', { x: x(nowTurn) + 6, y: baseY - 8, class: 'history-race-now-label' }, `Now · ${nowDate}`));
  return { svg, x };
}

// Releases can land on consecutive turns (the release gap binds only under a summit deal), so two rows
// must hold any run: cards narrow when there are more than two rows fit at full width.
export function layoutRaceCards(pins, width = 1280) {
  const perRow = Math.max(1, Math.ceil(pins.length / 2));
  const cardWidth = Math.min(RACE_CARD_WIDTH, Math.floor(width / perRow) - RACE_CARD_GAP);
  const rowEnds = [-Infinity, -Infinity];
  const cards = pins.map((pin, index) => {
    const wanted = Math.min(width - cardWidth, Math.max(0, pin - 18));
    // A single row while cards fit at their own turns; once one would collide, cards alternate rows,
    // so no row holds more than ceil(n / 2) cards and the packing below always fits.
    const crowded = pins.some((other, i) => i > 0 && other - pins[i - 1] < cardWidth + RACE_CARD_GAP);
    const row = crowded ? index % 2 : 0;
    const left = Math.max(wanted, rowEnds[row] + RACE_CARD_GAP);
    rowEnds[row] = left + cardWidth;
    return { left, row, width: cardWidth, pinX: pin };
  });
  // A row pushed past the right edge is packed back leftwards from the edge.
  for (const row of [0, 1]) {
    let limit = width;
    for (const card of cards.filter((entry) => entry.row === row).reverse()) {
      card.left = Math.max(0, Math.min(card.left, limit - cardWidth));
      limit = card.left - RACE_CARD_GAP;
    }
  }
  const rowsUsed = cards.some((card) => card.row === 1) ? 2 : 1;
  return {
    cards: cards.map(({ pinX, ...card }) => ({ ...card, pin: Math.max(6, Math.min(cardWidth - 6, pinX - card.left - 1)) })),
    rowsUsed,
  };
}

function raceCards(rows, x) {
  const root = element('div', 'history-race-cards');
  const layout = layoutRaceCards(rows.map((row) => x(row.releasedTurn)));
  root.style.height = `${layout.rowsUsed * RACE_CARD_ROW_HEIGHT}px`;
  rows.forEach((row, index) => {
    const position = layout.cards[index];
    const review = row.press.reduce((harshest, candidate) => candidate.score < harshest.score ? candidate : harshest, row.press[0]);
    const card = element('article', 'history-race-card');
    card.style.left = `${position.left}px`;
    card.style.width = `${position.width}px`;
    card.style.top = `${position.row * RACE_CARD_ROW_HEIGHT}px`;
    card.style.setProperty('--history-pin', `${position.pin}px`);
    card.style.setProperty('--history-stem', `${position.row * RACE_CARD_ROW_HEIGHT + 9}px`);
    card.append(element('h3', '', row.name), element('span', 'history-muted', `${row.channelWords} · ${turnWords(row)}`));
    for (const [label, value] of [['Press', `${row.pressAvg.toFixed(1)} / 10`], ['Launch', `+${users(row.newUsers)} users`]]) {
      const fact = element('div', 'history-race-card-row');
      fact.append(element('span', '', label), element('b', '', value));
      card.append(fact);
    }
    if (review) card.append(element('q', '', review.quip));
    root.append(card);
  });
  return { root, rowsUsed: layout.rowsUsed };
}

export function openHistory(game, overlayRoot, { view = 'models' } = {}) {
  const rows = historyRows(game.state);
  const nowDate = storyDate(game.state.day ?? storyDayForTurn(game.state.turn)).label;
  let selected = Math.max(0, rows.length - 1);
  let opened;

  function showModels() {
    const right = element('div', 'history-models-detail');
    if (rows[selected]) selectedPanel(right, rows[selected]);
    let table;
    const select = (index) => {
      selected = index;
      for (const [rowIndex, tr] of [...table.querySelectorAll('tbody tr')].entries()) {
        tr.classList.toggle('history-models-selected', rowIndex === selected);
      }
      selectedPanel(right, rows[selected]);
    };
    const body = rows.length > 0
      ? (table = modelTable(rows, selected, select))
      : element('p', 'history-empty', 'Release a model to start your lab history.');
    opened = openDialog(overlayRoot, {
      title: 'Lab history',
      subtitle: `${rows.length} models released · Era ${game.state.era} · ${nowDate}`,
      left: { title: 'Your lab', content: summaryPanel(labSummary(rows)) },
      right: { title: 'Selected model', content: right },
      body,
      backLabel: 'The race so far',
      okLabel: 'Close',
      onBack: showRace,
      onOk: () => opened.close(),
    });
    opened.classList.add('history-models');
  }

  function showRace() {
    const body = element('div', 'history-race-body');
    const series = raceSeries(rows, game.rivalReleases);
    body.append(chartLegend(series.ticks.length > 0));
    let chart = raceChart(rows, series, game.state.turn, nowDate);
    const cards = raceCards(rows, chart.x);
    // Two rows of cards leave less room: draw a shorter chart rather than shrinking this one.
    if (cards.rowsUsed > 1) chart = raceChart(rows, series, game.state.turn, nowDate, 280);
    body.append(chart.svg, cards.root);
    opened = openDialog(overlayRoot, {
      title: 'The race so far',
      subtitle: 'Public benchmarks only: the average of coding, science, agents and the final exam',
      body,
      backLabel: 'Models',
      okLabel: 'Close',
      onBack: showModels,
      onOk: () => opened.close(),
    });
    opened.classList.add('history-race');
    if (cards.rowsUsed > 1) opened.classList.add('history-race-stacked');
  }

  if (view === 'race') showRace();
  else showModels();
  return opened;
}

function appendParts(root, parts) {
  for (const part of parts) {
    if (typeof part === 'string') root.append(document.createTextNode(part));
    else if (part && Number.isInteger(part.ref)) {
      const sup = element('sup');
      const marker = element('a', '', `[${part.ref}]`);
      marker.href = `#history-reference-${part.ref}`;
      sup.append(marker);
      root.append(sup);
    }
  }
}

function benchmarkHeading(name) {
  const kind = name.match(/\(([^)]+)\)$/)?.[1];
  if (kind) return kind[0].toUpperCase() + kind.slice(1);
  if (name.includes('Final Final Exam')) return 'Final exam';
  return name;
}

function articleTable(data) {
  const table = element('table', 'history-article-table');
  const thead = document.createElement('thead');
  const header = document.createElement('tr');
  for (const name of ['Model', 'Released', 'Access', ...data.benchmarks.map(benchmarkHeading), 'Press']) header.append(element('th', '', name));
  thead.append(header);
  const tbody = document.createElement('tbody');
  for (const row of data.rows) {
    const tr = document.createElement('tr');
    tr.append(element('td', 'history-article-model-link', row.name), element('td', '', row.released), element('td', '', row.access));
    for (const score of row.benchmarks) tr.append(element('td', 'history-article-number', score));
    tr.append(element('td', 'history-article-number', row.pressAvg.toFixed(1)));
    tbody.append(tr);
  }
  table.append(thead, tbody);
  return table;
}

function definitionList(info) {
  const list = element('dl', 'history-article-facts');
  const releases = (release) => {
    const fragment = document.createDocumentFragment();
    fragment.append(document.createTextNode(release.name), document.createElement('br'), element('span', 'history-muted', `${release.era} · ${release.date}`));
    return fragment;
  };
  const entries = [
    ['Developer', info.developer],
    ['First release', releases(info.firstRelease)],
    ['Latest release', releases(info.latestRelease)],
    ['Models', `${info.models}`],
    ['Type', info.type],
    ['Access', info.access.join(', ')],
    ['Users now', info.usersNow],
  ];
  for (const [term, description] of entries) {
    list.append(element('dt', '', term));
    const dd = document.createElement('dd');
    if (typeof description === 'string') dd.textContent = description;
    else dd.append(description);
    list.append(dd);
  }
  return list;
}

function sectionHeading(text) {
  return element('h2', 'history-article-section-title', text);
}

export function openArticle(game, overlayRoot) {
  const data = article(game.state, historyRows(game.state));
  const browser = element('div', 'history-article-browser');
  const chrome = element('div', 'history-article-chrome');
  const dots = element('div', 'history-article-dots');
  const close = element('button', '', '');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close encyclopedia');
  dots.append(close, element('i'), element('i'));
  const address = element('div', 'history-article-url', `encyclopedia.example/wiki/${data.title.replaceAll(' ', '_')}`);
  chrome.append(dots, address);
  const page = element('div', 'history-article-page');
  const site = element('div', 'history-article-site');
  site.append(element('b', '', 'The Encyclopedia'), element('span', 'history-muted', 'the free encyclopedia anyone can edit'));
  page.append(site, element('h1', 'history-article-title', data.title), element('p', 'history-article-from history-muted', 'From the Encyclopedia · last edited this month'));

  if (data.stub) {
    page.append(element('p', 'history-article-stub', 'This article is a stub. Release a model to fill it in.'));
  } else {
    const body = element('div', 'history-article-body');
    const copy = element('main', 'history-article-copy');
    const lead = document.createElement('p');
    appendParts(lead, data.lead);
    copy.append(lead, sectionHeading('Release history'), articleTable(data.table), sectionHeading('Reception'));
    const reception = document.createElement('p');
    appendParts(reception, data.reception);
    copy.append(reception, sectionHeading('Controversies'));
    const controversies = document.createElement('p');
    appendParts(controversies, data.controversies);
    copy.append(controversies, sectionHeading('References'));
    const references = element('ol', 'history-article-references');
    data.references.forEach((reference, index) => {
      const item = element('li', '', reference);
      item.id = `history-reference-${index + 1}`;
      references.append(item);
    });
    copy.append(references);
    const info = element('aside', 'history-article-info');
    info.append(
      element('h3', '', data.infobox.family),
      element('div', 'history-article-mark', data.infobox.family.slice(0, 1).toUpperCase()),
      definitionList(data.infobox),
    );
    body.append(copy, info);
    page.append(body);
  }
  browser.append(chrome, page, element('div', 'history-article-fade'));
  let opened = openDialog(overlayRoot, {
    title: data.title,
    body: browser,
    okLabel: 'Close',
    onOk: () => opened.close(),
  });
  opened.classList.add('history-article');
  if (data.stub) opened.classList.add('history-article-empty');
  opened.querySelector('.dialog-ok')?.remove();
  close.addEventListener('click', () => opened.close());
  return opened;
}

export function mountHistory(game, overlayRoot) {
  return registerMenuHandler('history', () => openHistory(game, overlayRoot));
}
