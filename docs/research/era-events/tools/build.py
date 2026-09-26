import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'eras.py')).read())
css = open(os.path.join(HERE, 'era1.css')).read()

# Timeline geometry for this page: taller box, rows assigned in Python.
css = css.replace('.tl-box { position: relative; min-width: 860px; height: 226px;', '.tl-box { position: relative; min-width: 900px; height: 324px;')
css = css.replace('.tl-axis { position: absolute; left: 0; right: 0; top: 106px;', '.tl-axis { position: absolute; left: 0; right: 0; top: 146px;')
css = css.replace('.tl-mon { position: absolute; top: 112px;', '.tl-mon { position: absolute; top: 152px;')
css = css.replace('.mk.anchor { bottom: 116px; }', '.mk.anchor { }')
css = css.replace('.mk.react { top: 128px; }', '.mk.react { }')
css = css.replace("</style>", "") + """
.tabs { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 4; background: var(--cream); padding-block: 10px; display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 2px solid var(--line); }
.tab { font: 800 14px var(--sans); color: var(--muted); background: var(--soft); border: 0; border-radius: 9px; padding: 8px 14px; cursor: pointer; display: grid; gap: 1px; text-align: left; }
.tab small { font-weight: 700; font-size: 11.5px; }
.tab[aria-selected="true"] { background: var(--ink); color: var(--cream); }
.tab .n { font-family: var(--mono); font-size: 11px; }
.era { display: grid; gap: 44px; }
.done-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
.done-list li { background: var(--paper); padding: 10px 14px; list-style: none; display: grid; gap: 2px; border-radius: 10px; }
.done-list ul { margin: 0; padding: 0; display: contents; }
.done-list small { color: var(--muted); }
.flag { font-size: 12.5px; color: var(--coral-ink); }
</style>"""

def rows(items, key, gap, maxrows):
    out, last = [], [-99] * maxrows
    for it in sorted(items, key=lambda x: x[key]):
        for r in range(maxrows):
            if it[key] - last[r] >= gap:
                last[r] = it[key]; out.append((it, r)); break
        else:
            r = min(range(maxrows), key=lambda i: last[i]); last[r] = it[key]; out.append((it, r))
    return out

data = {}
for n, era in ERAS.items():
    units = len(era['months']) or 4
    key = 'm' if era['months'] else 'wk'
    tl = []
    gap = units * 0.1
    for it, r in rows(era['anchors'], key, gap, 2):
        tl.append({'code': it['code'], 'label': it['short'], 'pos': it[key] / units * 100, 'kind': 'anchor', 'y': f"bottom:{160 + r * 48}px"})
    for it, r in rows(era['reactions'], key, gap, 3):
        tl.append({'code': it['code'], 'label': it['short'], 'pos': it[key] / units * 100, 'kind': 'react', 'y': f"top:{170 + r * 42}px"})
    data[n] = {**era, 'tl': tl, 'units': units}

ERA1 = [
    ('A1', 'The pause letter'), ('A2', 'Senate hearing'), ('A3', 'The White House wants safety promises'),
    ('R1', 'Your chatbot turns on its users'), ('R2', 'Jailbreak goes viral'), ('R3', 'A lawyer files cases your model made up'),
    ('R4', 'A country bans your app'), ('R5', 'Copyright suit filed'), ('R6', 'Your red team caught the model lying'), ('R7', 'The board fires you'),
]

html = """<title>Era Event Picks</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital@0;1&family=Nunito:wght@300;400;600;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap">
""" + css + """
<div class="wrap">
  <header class="lead">
    <div class="intro">
      <p class="eyebrow">Game Night · events pass · eras 2 to 5</p>
      <h1>Which real events belong in each era?</h1>
      <p>You asked for all five eras, using real events only. Six research agents gathered about 130 real events from 2024 to September 2026. For each era I narrowed them to a pool of cards, each drawn the way it would look in the game, next to what really happened.</p>
      <p>Pick <b>Keep</b>, <b>Rewrite</b> or <b>Cut</b> on each card, tick any alternates you want instead, then press <b>Copy my picks</b> once at the end and paste the text into the chat. The choice lines are drafts; we write the final copy together.</p>
    </div>
    <div class="decided">
      <p class="eyebrow">Already decided by you</p>
      <ul>
        <li>A <strong>pool of 8–10 cards</strong> per era; a run shows <strong>4–5</strong>.</li>
        <li><strong>Anchors</strong> land near their real date every run; <strong>reactions</strong> fire only when your choices set them up.</li>
        <li><strong>Real events only</strong> for now. Era 1 is picked: all ten kept.</li>
      </ul>
    </div>
  </header>
  <nav class="tabs" role="tablist" aria-label="Eras" id="tabs"></nav>
  <div id="eras"></div>
</div>

<div class="bar" role="region" aria-label="Your picks">
  <span class="count" id="count"></span>
  <button type="button" id="copy">Copy my picks</button>
  <span class="done" id="done" aria-live="polite"></span>
  <textarea class="copybox" id="copybox" rows="3" hidden readonly aria-label="Your picks as text"></textarea>
</div>

<script>
const ERAS = """ + json.dumps(data, ensure_ascii=False) + """;
const ERA1 = """ + json.dumps(ERA1) + """;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function cardHTML(e) {
  const choices = e.choices.map((c) => `
    <div class="ch"><b>${esc(c.l)}</b><span class="cost">Cost: <em>${esc(c.c)}</em></span>
      <div class="chips">${c.late ? '<span class="chip late">If time runs out</span>' : ''}${c.yes.map((a) => `<span class="chip yes">\\u2713 ${a}</span>`).join('')}${c.no.map((a) => `<span class="chip no">${a}</span>`).join('')}</div>
    </div>`).join('');
  return `<div class="gcard${e.crisis ? ' crisis' : ''}">
    <h3>${esc(e.title)}</h3>
    <div class="post"><span class="av" aria-hidden="true">${e.av}</span><div><div class="handle">${esc(e.handle)}</div><div class="ptext">${esc(e.post)}</div></div></div>
    <div class="choices${e.choices.length === 2 ? ' two' : ''}">${choices}</div>
  </div>`;
}

function rowHTML(n, e) {
  const id = `e${n}-${e.code.toLowerCase()}`;
  const when = e.lands ? `<div class="when"><span class="lbl">In the game</span><span>${esc(e.lands)}</span></div>`
    : `<div class="when"><span class="lbl">Set up by</span><span>${esc(e.setup)}</span></div>`;
  const src = e.src[1] ? `<a href="${e.src[1]}" target="_blank" rel="noopener">Source: ${esc(e.src[0])}</a>` : `<span class="flag">${esc(e.src[0])}</span>`;
  return `<article class="row">
    <div style="display:grid;gap:6px"><span class="code-tag">Era ${n} · ${e.code}${e.crisis ? ' · crisis' : ''}</span>${cardHTML(e)}</div>
    <div class="facts">
      <div class="when"><span class="lbl">What really happened</span><span class="date">${esc(e.date)}</span><span>${esc(e.real)}</span>${src}</div>
      ${when}
      <span class="status ${e.status[0]}">${esc(e.status[1])}</span>
    </div>
    <div class="pick" role="group" aria-label="Your pick for era ${n} ${e.code}">
      <div class="opts">
        <label><input type="radio" name="p-${id}" id="p-${id}-keep" value="keep"><span class="k">Keep</span></label>
        <label><input type="radio" name="p-${id}" id="p-${id}-rewrite" value="rewrite"><span class="r">Rewrite</span></label>
        <label><input type="radio" name="p-${id}" id="p-${id}-cut" value="cut"><span class="c">Cut</span></label>
      </div>
      <textarea id="n-${id}" placeholder="Optional: what to change"></textarea>
    </div>
  </article>`;
}

function timeline(era) {
  let html = '';
  era.quarters.forEach((q, i) => {
    const w = 100 / era.quarters.length;
    html += `<div class="tl-q" style="left:${i * w}%;width:${w}%"><span>${esc(q)}</span></div>`;
  });
  html += '<div class="tl-axis"></div>';
  era.months.forEach((m, i) => { html += `<div class="tl-mon" style="left:${(i + 0.5) / era.units * 100}%">${m}</div>`; });
  for (const t of era.tl) {
    const left = Math.min(96, Math.max(4, t.pos));
    html += `<div class="mk ${t.kind}" style="left:${left}%;${t.y}"><i></i><span>${esc(t.label)}</span><span class="code">${t.code}</span></div>`;
  }
  return html;
}

function eraHTML(n) {
  const era = ERAS[n];
  const alts = era.alts.map(([t, d], i) => `<label class="alt"><input type="checkbox" id="alt-${n}-${i}"><b>${esc(t)}</b><small>${esc(d)}</small></label>`).join('');
  const ex = era.existing.length ? `<section class="sec"><div class="sec-head"><p class="eyebrow">Existing cards</p><h2>Other built cards that sit in this era</h2><p>Untick any you disagree with.</p></div>
    <div class="moves">${era.existing.map(([id, t, d]) => `<label class="move"><input type="checkbox" id="mv-${n}-${id}" checked><b>${esc(t)}</b><small>${esc(d)}</small></label>`).join('')}</div></section>` : '';
  const total = era.anchors.length + era.reactions.length;
  return `<div class="era" id="era${n}" role="tabpanel" hidden>
    <section class="sec"><div class="sec-head"><p class="eyebrow">Era ${n} · ${esc(era.name)} · ${esc(era.span)}</p><h2>${total} candidates</h2><p>${esc(era.intro)}</p></div></section>
    <section class="tl"><h2>Where each card lands in the era</h2>
      <div class="tl-scroll"><div class="tl-box" role="img" aria-label="Era ${n} timeline">${timeline(era)}</div></div>
      <div class="tl-key"><span><i class="a"></i> Anchor: lands here every run</span><span><i class="r"></i> Reaction: its real date; in the game it fires when your choices set it up</span></div>
    </section>
    <section class="sec"><div class="sec-head"><p class="eyebrow">Every run</p><h2>Anchors</h2></div><div class="rows">${era.anchors.map((e) => rowHTML(n, e)).join('')}</div></section>
    <section class="sec"><div class="sec-head"><p class="eyebrow">Only if you set them up</p><h2>Reactions</h2></div><div class="rows">${era.reactions.map((e) => rowHTML(n, e)).join('')}</div></section>
    <section class="sec"><div class="sec-head"><p class="eyebrow">Bench</p><h2>Alternates: tick any you want in the pool instead</h2><p>All real. Adding one means cutting one above, to stay at 8–10.</p></div><div class="alts">${alts}</div></section>
    ${ex}
  </div>`;
}

function era1HTML() {
  return `<div class="era" id="era1" role="tabpanel" hidden>
    <section class="sec"><div class="sec-head"><p class="eyebrow">Era 1 · Chat assistants · December 2022 to December 2023</p><h2>Picked: all ten kept</h2><p>Recorded on September 26. Flattery moved to era 3 and the companion lawsuit to era 2, where their real cases sit.</p></div>
    <ul class="done-list">${ERA1.map(([c, t]) => `<li><small>${c}</small><b>${esc(t)}</b></li>`).join('')}</ul></section>
  </div>`;
}

const ORDER = [1, 2, 3, 4, 5];
function render() {
  document.getElementById('tabs').innerHTML = ORDER.map((n) => {
    const sub = n === 1 ? 'picked' : `${ERAS[n].anchors.length + ERAS[n].reactions.length} cards`;
    const name = n === 1 ? 'Chat assistants' : ERAS[n].name;
    return `<button class="tab" role="tab" id="tab${n}" aria-controls="era${n}" aria-selected="false" type="button"><span class="n">Era ${n} · <span data-count="${n}">${sub}</span></span>${esc(name)}</button>`;
  }).join('');
  document.getElementById('eras').innerHTML = era1HTML() + [2, 3, 4, 5].map(eraHTML).join('');
}
function show(n) {
  for (const k of ORDER) {
    document.getElementById(`era${k}`).hidden = k !== n;
    document.getElementById(`tab${k}`).setAttribute('aria-selected', String(k === n));
  }
  try { history.replaceState(null, '', `#era${n}`); } catch (e) {}
}

const ALL = [2, 3, 4, 5].flatMap((n) => [...ERAS[n].anchors, ...ERAS[n].reactions].map((e) => ({ n, e })));
const KEY = 'era-event-picks';
function save() {
  const s = {};
  document.querySelectorAll('.era input, .era textarea').forEach((el) => { s[el.id] = el.type === 'radio' || el.type === 'checkbox' ? el.checked : el.value; });
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}
function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!s) return;
  for (const [id, v] of Object.entries(s)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'radio' || el.type === 'checkbox') el.checked = v; else el.value = v;
  }
}
function pickOf(n, e) {
  const id = `e${n}-${e.code.toLowerCase()}`;
  const r = document.querySelector(`input[name="p-${id}"]:checked`);
  return { pick: r ? r.value : null, note: document.getElementById(`n-${id}`).value.trim() };
}
function update() {
  let total = 0;
  for (const n of [2, 3, 4, 5]) {
    const list = ALL.filter((x) => x.n === n);
    const done = list.filter((x) => pickOf(n, x.e).pick).length;
    total += done;
    const el = document.querySelector(`[data-count="${n}"]`);
    if (el) el.textContent = `${done} of ${list.length} picked`;
  }
  document.getElementById('count').textContent = `${total} of ${ALL.length} picked`;
  save();
}
function text() {
  const lines = ['Event picks, eras 2 to 5:'];
  for (const n of [2, 3, 4, 5]) {
    lines.push(`Era ${n}:`);
    for (const { e } of ALL.filter((x) => x.n === n)) {
      const p = pickOf(n, e);
      lines.push(`  ${e.code} ${e.title}: ${p.pick || 'no pick'}${p.note ? ` (${p.note})` : ''}`);
    }
    const alts = ERAS[n].alts.filter((_, i) => document.getElementById(`alt-${n}-${i}`).checked).map(([t]) => t);
    lines.push(`  Alternates to add: ${alts.length ? alts.join('; ') : 'none'}`);
    for (const [id, t] of ERAS[n].existing) if (!document.getElementById(`mv-${n}-${id}`).checked) lines.push(`  Disagree: ${t}`);
  }
  return lines.join('\\n');
}
document.getElementById('copy').addEventListener('click', () => {
  const t = text();
  const box = document.getElementById('copybox');
  const done = document.getElementById('done');
  navigator.clipboard.writeText(t).then(() => { box.hidden = true; done.textContent = 'Copied. Paste it into the chat.'; })
    .catch(() => { box.value = t; box.hidden = false; box.focus(); box.select(); done.textContent = 'Copy was blocked; the text is selected, so press Cmd+C.'; });
});

render();
load();
document.getElementById('tabs').addEventListener('click', (ev) => {
  const b = ev.target.closest('.tab');
  if (b) { show(Number(b.id.slice(3))); window.scrollTo({ top: 0 }); }
});
const start = Number((location.hash.match(/^#era([1-5])$/) || [])[1]) || 2;
show(start);
update();
document.addEventListener('change', update);
document.addEventListener('input', (e) => { if (e.target.tagName === 'TEXTAREA') save(); });
</script>
"""
open(os.path.join(HERE, 'era-events.html'), 'w').write(html)

# candidates.md per era
def md(n, era):
    out = [f"# Era {n} event candidates ({era['name']}, {era['span']})", '',
           'Distilled by the orchestrator on 2026-09-26 from the raw files in this folder, for the owner to keep, rewrite or',
           'cut. Real events only; choice lists are drafts. The picks page is `docs/research/era-events/picks-page-eras-2-5.html`.', '']
    for label, key in (('Anchors: every run, near the real date', 'anchors'), ("Reactions: fire only when the player's choices set them up", 'reactions')):
        out += [f'## {label}', '', '| # | Card | Real date | Real basis | Draft choices | Sim status | Source |', '|---|---|---|---|---|---|---|']
        for e in era[key]:
            ch = ' / '.join(x['l'] for x in e['choices'])
            when = e.get('lands') or ('Set up by: ' + e['setup'])
            real = e['real'].replace('|', '/')
            out.append(f"| {e['code']} | {e['title']}{' (crisis)' if e.get('crisis') else ''} | {e['date']} | {real} {when} | {ch} | {e['status'][1]} | {e['src'][1] or e['src'][0]} |")
        out.append('')
    out += ['## Alternates', ''] + [f'- **{t}.** {d}' for t, d in era['alts']] + ['']
    if era['existing']:
        out += ['## Other existing cards in this era', ''] + [f'- `{i}`: {t}. {d}' for i, t, d in era['existing']] + ['']
    out += ['## Sources', '', 'Every real basis traces to the raw files in this folder. Items marked ⚠️ rest on search summaries or partly read pages.', '']
    return '\n'.join(out)

for n, era in ERAS.items():
    open(os.path.join(HERE, f'candidates-era{n}.md'), 'w').write(md(n, era))
print('built', len(html))
