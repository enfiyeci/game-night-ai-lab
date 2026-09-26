import os, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'build.py')).read().split("html = \"\"\"<title>")[0])  # ERAS, data, css
e = H.escape
ERA1_FULL = [
 ('A1','The pause letter','March 22, 2023'),('A2','Senate hearing','May 16, 2023'),('A3','The White House wants safety promises','July 21, 2023'),
 ('R1','Your chatbot turns on its users','February 7–17, 2023'),('R2','Jailbreak goes viral','December 2022 – April 2023'),
 ('R3','A lawyer files cases your model made up','June 22, 2023'),('R4','A country bans your app','March 31 – April 28, 2023'),
 ('R5','Copyright suit filed','July 7 and December 27, 2023'),('R6','Your red team caught the model lying','March 14, 2023'),('R7','The board fires you','November 17–22, 2023')]

def card(c):
    chs = ''.join(
        f'<div class="ch"><b>{e(x["l"])}</b><span class="cost">Cost: <em>{e(x["c"])}</em></span><div class="chips">'
        + ('<span class="chip late">If time runs out</span>' if x['late'] else '')
        + ''.join(f'<span class="chip yes">✓ {a}</span>' for a in x['yes'])
        + ''.join(f'<span class="chip no">{a}</span>' for a in x['no']) + '</div></div>' for x in c['choices'])
    two = ' two' if len(c['choices']) == 2 else ''
    return (f'<div class="gcard{" crisis" if c.get("crisis") else ""}"><h3>{e(c["title"])}</h3>'
            f'<div class="post"><span class="av" aria-hidden="true">{c["av"]}</span><div><div class="handle">{e(c["handle"])}</div><div class="ptext">{e(c["post"])}</div></div></div>'
            f'<div class="choices{two}">{chs}</div></div>')

def row(n, c):
    when = (f'<div class="when"><span class="lbl">In the game</span><span>{e(c["lands"])}</span></div>' if c.get('lands')
            else f'<div class="when"><span class="lbl">Set up by</span><span>{e(c["setup"])}</span></div>')
    src = f'<a href="{c["src"][1]}">Source: {e(c["src"][0])}</a>' if c['src'][1] else f'<span class="flag">{e(c["src"][0])}</span>'
    return (f'<article class="row2"><div style="display:grid;gap:6px"><span class="code-tag">Era {n} · {c["code"]}{" · crisis" if c.get("crisis") else ""} · <span class="kept">Kept</span></span>{card(c)}</div>'
            f'<div class="facts"><div class="when"><span class="lbl">What really happened</span><span class="date">{e(c["date"])}</span><span>{e(c["real"])}</span>{src}</div>{when}'
            f'<span class="status {c["status"][0]}">{e(c["status"][1])}</span></div></article>')

def timeline(era):
    out = ''
    w = 100 / len(era['quarters'])
    for i, q in enumerate(era['quarters']):
        out += f'<div class="tl-q" style="left:{i*w}%;width:{w}%"><span>{e(q)}</span></div>'
    out += '<div class="tl-axis"></div>'
    for i, m in enumerate(era['months']):
        out += f'<div class="tl-mon" style="left:{(i+0.5)/era["units"]*100}%">{m}</div>'
    for t in era['tl']:
        left = min(96, max(4, t['pos']))
        out += f'<div class="mk {t["kind"]}" style="left:{left}%;{t["y"]}"><i></i><span>{e(t["label"])}</span><span class="code">{t["code"]}</span></div>'
    return out

extra = """<style>
.row2 { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 26px; align-items: start; }
.kept { color: var(--teal-ink); font-weight: 600; }
.toc { display: flex; flex-wrap: wrap; gap: 8px; }
.toc a { font-weight: 800; text-decoration: none; background: var(--paper); padding: 8px 14px; border-radius: 9px; color: var(--ink); }
.era-block { display: grid; gap: 36px; padding-top: 12px; border-top: 3px solid var(--wood); }
.done-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; margin: 0; padding: 0; }
.done-list li { background: var(--paper); padding: 10px 14px; list-style: none; display: grid; gap: 2px; border-radius: 10px; }
.done-list small { color: var(--muted); }
@media (max-width: 980px) { .row2 { grid-template-columns: 1fr; gap: 12px; } }
</style>"""

parts = ['<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Game Night Event List</title>',
         '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital@0;1&family=Nunito:wght@300;400;600;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap">',
         css, extra, '</head>\n<body>\n<div class="wrap">',
         '<header class="lead"><div class="intro"><p class="eyebrow">Game Night · events pass · all five eras</p><h1>The event list for the demo</h1>'
         '<p>Every card below is kept (your picks on September 26). All are real events, placed at their real dates. Anchors land every run; reactions fire only when the player\'s own choices set them up. The choice lines are drafts; we write the final copy together.</p></div>'
         '<div class="decided"><p class="eyebrow">Totals</p><ul><li>Era 1: 10 cards</li><li>Era 2: 11 cards (the forum breach replaces weight theft)</li><li>Eras 3 and 4: 10 cards each</li><li>Era 5: 7 cards</li><li><strong>48 cards</strong> in all</li></ul></div></header>',
         '<nav class="toc" aria-label="Eras">' + ''.join(f'<a href="#era{n}">Era {n}</a>' for n in range(1, 6)) + '</nav>']

parts.append('<section class="era-block" id="era1"><div class="sec-head"><p class="eyebrow">Era 1 · Chat assistants · December 2022 to December 2023</p><h2>10 cards, kept</h2><p>Drawn in full on the era 1 page; listed here with their real dates.</p></div>'
             '<ul class="done-list">' + ''.join(f'<li><small>{c} · {d}</small><b>{e(t)}</b></li>' for c, t, d in ERA1_FULL) + '</ul></section>')
for n in (2, 3, 4, 5):
    era = data[n]
    total = len(era['anchors']) + len(era['reactions'])
    parts.append(f'<section class="era-block" id="era{n}"><div class="sec-head"><p class="eyebrow">Era {n} · {e(era["name"])} · {e(era["span"])}</p><h2>{total} cards, kept</h2><p>{e(era["intro"])}</p></div>'
                 f'<div class="tl"><div class="tl-scroll"><div class="tl-box" role="img" aria-label="Era {n} timeline">{timeline(era)}</div></div>'
                 '<div class="tl-key"><span><i class="a"></i> Anchor: lands here every run</span><span><i class="r"></i> Reaction: its real date; fires when your choices set it up</span></div></div>'
                 '<div class="sec-head"><p class="eyebrow">Every run</p><h2>Anchors</h2></div><div class="rows">' + ''.join(row(n, c) for c in era['anchors']) + '</div>'
                 '<div class="sec-head"><p class="eyebrow">Only if you set them up</p><h2>Reactions</h2></div><div class="rows">' + ''.join(row(n, c) for c in era['reactions']) + '</div></section>')
parts.append('</div>\n</body>\n</html>\n')
open(os.path.join(HERE, 'Game-Night-event-list.html'), 'w').write('\n'.join(parts))
print('ok')
