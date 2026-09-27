// "Each model" in the finance planner: one row per release with what it cost to make, what serving it has cost so
// far, what it has earned so far, and where it stands. Same table grammar as the books view.
import { money } from '../logic/format.js';
import { moneyRows } from '../logic/modelMoney.js';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

const signedMoney = (m) => (m >= 0 ? `+${money(m)}` : money(m));
const monthWords = (n) => (n < 1 ? 'under a month' : `${Math.round(n)} mo`);

function statusWords(row) {
  if (row.kind === 'pending') return 'waiting for its launch';
  if (row.kind === 'training') return 'compute and recipe so far';
  if (row.status === 'open') return `${row.date} · open weights, earns nothing`;
  if (row.status === 'upcoming') return `${row.date} · not on sale yet`;
  if (row.status === 'serving') return `${row.date} · on sale, ${monthWords(row.monthsOnSale)}`;
  return `${row.date} · retired after ${monthWords(row.monthsOnSale)}`;
}

export function modelMoneyView(state) {
  const { rows, total, paidBack, released } = moneyRows(state);
  const root = element('div', 'model-money');
  if (rows.length === 0) {
    root.append(element('p', 'model-money-empty', 'Train and release a model to see what it costs and what it earns.'));
    return root;
  }
  const maxFlow = Math.max(1, ...rows.flatMap((r) => [r.made ?? 0, r.serving, r.earned]));
  const maxNet = Math.max(1, ...rows.map((r) => Math.abs(r.net)));
  const bar = (value, cls, label) => {
    const cell = element('div', 'finance-cell');
    const track = element('div', 'finance-bar');
    const fill = element('i', cls);
    fill.style.width = `${Math.min(100, (Math.abs(value) / maxFlow) * 100)}%`;
    track.append(fill);
    cell.append(track, element('b', '', label));
    return cell;
  };
  const netCell = (net) => {
    const cell = element('div', 'finance-cell');
    const track = element('div', 'finance-bar diverging');
    const fill = element('i', net < 0 ? 'neg' : 'pos');
    fill.style.width = `${(Math.abs(net) / maxNet) * 50}%`;
    track.append(fill);
    cell.append(track, element('b', net < 0 ? 'out' : 'in', signedMoney(net)));
    return cell;
  };

  const table = element('table', 'finance-table model-money-table');
  const colgroup = element('colgroup');
  colgroup.append(element('col', 'model-money-name-col'), element('col'), element('col'), element('col'), element('col', 'model-money-net-col'));
  const head = element('tr');
  for (const label of ['Model', 'Training and launch', 'Serving so far', 'Earned so far', 'Earned minus costs']) head.append(element('th', '', label));
  const thead = element('thead');
  thead.append(head);
  const tbody = element('tbody');
  for (const row of rows) {
    const tr = element('tr', row.kind === 'model' ? '' : 'model-money-unreleased');
    const name = element('td');
    name.append(element('strong', '', row.name), element('small', '', statusWords(row)));
    const dash = () => element('span', 'finance-muted', '—');
    const make = element('td');
    make.append(row.made == null ? dash() : bar(row.made, 'coral', money(row.made)));
    const serve = element('td');
    serve.append(row.kind === 'model' ? bar(row.serving, 'coral', money(row.serving)) : dash());
    const earn = element('td');
    earn.append(row.kind === 'model' ? bar(row.earned, 'teal', money(row.earned)) : dash());
    const net = element('td');
    net.append(netCell(row.net));
    tr.append(name, make, serve, earn, net);
    tbody.append(tr);
  }
  const foot = element('tr', 'finance-total');
  const plainCell = (label, cls = '') => {
    const td = element('td');
    const cell = element('div', 'finance-cell');
    cell.append(element('span'), element('b', cls, label));
    td.append(cell);
    return td;
  };
  foot.append(
    element('td', '', 'All models'),
    plainCell(money(total.made)),
    plainCell(money(total.serving)),
    plainCell(money(total.earned)),
    plainCell(signedMoney(total.net), total.net < 0 ? 'out' : 'in'),
  );
  tbody.append(foot);
  table.append(colgroup, thead, tbody);
  const note = element('p', 'finance-note', released
    ? `${paidBack} of ${released} released ${released === 1 ? 'model has' : 'models have'} earned back what ${released === 1 ? 'it' : 'they'} cost to make and serve. Training counts the recipe and the compute the run held.`
    : 'Training counts the recipe and the compute the run held.');
  root.append(table, note);
  return root;
}
