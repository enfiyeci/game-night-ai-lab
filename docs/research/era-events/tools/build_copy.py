import os, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'build.py')).read().split("html = \"\"\"<title>")[0])  # css
exec(open(os.path.join(HERE, 'copy.py')).read())
e = H.escape
DESK = {'research': 'Research', 'safety': 'Safety', 'cfo': 'CFO', 'policy': 'Policy'}
ERA_NAME = {1: 'Chat assistants · 2023', 2: 'The scale-up · 2024', 3: 'Reasoning and agents · 2025', 4: 'The gigawatt race · 2026', 5: 'Self-improvement and pacing · recent events'}

def gcard(c):
    chs = ''.join(
        f'<div class="ch"><b>{e(x["l"])}</b><span class="cost">Cost: <em>{e(x["c"])}</em></span><div class="chips">'
        + ('<span class="chip late">If time runs out</span>' if x['late'] else '')
        + ''.join(f'<span class="chip yes">✓ {a}</span>' for a in x['yes'])
        + ''.join(f'<span class="chip no">{a}</span>' for a in x['no']) + '</div></div>' for x in c['choices'])
    two = ' two' if len(c['choices']) == 2 else ''
    pic = (f'<div class="pic"><span class="pictag">{e(c["crisis"]["caption"])}</span><span>Room tag: {e(c["crisis"]["tag"])}</span></div>' if c['crisis'] else '')
    due = c['due'].replace('{time}', '<i>5 days</i>')
    return (f'<div class="gcard{" crisis" if c["crisis"] else ""}"><h3>{e(c["title"])}</h3>'
            f'<div class="post"><span class="av" aria-hidden="true">{e(c["post"][0][1].upper())}</span><div><div class="handle">{e(c["post"][0])}</div><div class="ptext">{e(c["post"][1])}</div></div></div>'
            f'{pic}<div class="choices{two}">{chs}</div><div class="due">{due}</div></div>')

def side(c):
    ids = {x['id']: x['l'] for x in c['choices']}
    warn = (f'<div class="blk"><span class="lbl">Warning first, at the {DESK[c["warning"][0]]} desk</span><span><b>{e(c["warning"][1])}</b> {e(c["warning"][2])}</span></div>' if c['warning'] else '')
    argue = ''.join(f'<li><b>{DESK[d]}:</b> “{e(line)}”' + (f' <span class="backs">backs {e(ids[p])}</span>' if p else ' <span class="joke">joke</span>') + '</li>' for d, (line, p) in c['argue'].items())
    outs = ''.join(f'<li><b>{e(x["l"])}{" (if time runs out)" if x["late"] else ""}:</b> {e(x["out"])}</li>' for x in c['choices'])
    return (f'<div class="facts">{warn}<div class="blk"><span class="lbl">Advisors in the room</span><ul>{argue}</ul></div>'
            f'<div class="blk"><span class="lbl">What happens</span><ul>{outs}</ul></div>'
            f'<div class="blk"><span class="lbl">Real basis</span><span>{e(c["basis"])}</span></div></div>')

extra = """<style>
.row2 { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 26px; align-items: start; }
.toc { display: flex; flex-wrap: wrap; gap: 8px; }
.toc a { font-weight: 800; text-decoration: none; background: var(--paper); padding: 8px 14px; border-radius: 9px; color: var(--ink); }
.era-block { display: grid; gap: 30px; padding-top: 12px; border-top: 3px solid var(--wood); }
.blk { display: grid; gap: 4px; }
.blk ul { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
.backs { font-size: 12px; font-weight: 800; color: var(--teal-ink); background: var(--teal-bg); padding: 1px 7px; border-radius: 7px; white-space: nowrap; }
.joke { font-size: 12px; font-weight: 800; color: var(--wood-ink); background: var(--wood-bg); padding: 1px 7px; border-radius: 7px; }
.due { font-size: 12.5px; font-weight: 800; color: var(--coral-ink); justify-self: end; }
.pic { display: grid; gap: 2px; background: var(--soft); border-radius: 8px; padding: 8px 12px; font-size: 12.5px; color: var(--muted); }
.pictag { font-family: var(--mono); color: var(--ink); }
@media (max-width: 980px) { .row2 { grid-template-columns: 1fr; gap: 12px; } }
</style>"""

parts = ['<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Game Night Card Copy</title>',
         '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital@0;1&family=Nunito:wght@300;400;600;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap">',
         css, extra, '</head>\n<body>\n<div class="wrap">',
         '<header class="lead"><div class="intro"><p class="eyebrow">Game Night · events pass · card copy draft</p><h1>Every word on all 48 cards</h1>'
         '<p>My best draft of the text players read: the title, the post, each choice and its cost, what the advisors say from their desks (one line is a joke), the deadline, and the line that tells you what happened after you choose. Read it, mark anything that sounds wrong, and we fix it together.</p></div>'
         '<div class="decided"><p class="eyebrow">Rules the lines follow</p><ul><li>Outcome lines say what happened in the world, never hidden numbers.</li><li>No percentages, and no “trust”, “favor”, “debt” or “heat” in them.</li><li>Rival labs use the game’s names: Lodestar, OpenBrain, Qilin.</li><li>The deadline shows an example time (“5 days”).</li></ul></div></header>',
         '<nav class="toc" aria-label="Eras">' + ''.join(f'<a href="#era{n}">Era {n}</a>' for n in range(1, 6)) + '</nav>']
for n in range(1, 6):
    cs = [c for c in CARDS if c['era'] == n]
    parts.append(f'<section class="era-block" id="era{n}"><div class="sec-head"><p class="eyebrow">Era {n} · {e(ERA_NAME[n])}</p><h2>{len(cs)} cards</h2></div><div class="rows">'
                 + ''.join(f'<article class="row2"><div style="display:grid;gap:6px"><span class="code-tag">Era {n} · {c["code"]}{" · crisis" if c["crisis"] else ""}</span>{gcard(c)}</div>{side(c)}</article>' for c in cs)
                 + '</div></section>')
parts.append('</div>\n</body>\n</html>\n')
open(os.path.join(HERE, 'Game-Night-card-copy.html'), 'w').write('\n'.join(parts))

# Markdown for the repo
md = ['# Event card copy draft (all 48 cards)', '', 'Written by Claude on 2026-09-26 at the owner\'s request ("you do your best for all and then we will think through it").',
      'Draft for owner review; nothing here is in the game code yet. Rendered view: `card-copy.html` in this folder.', '']
for n in range(1, 6):
    md += [f'## Era {n}: {ERA_NAME[n]}', '']
    for c in [c for c in CARDS if c['era'] == n]:
        md += [f'### {n}.{c["code"]} {c["title"]} (`{c["id"]}`){" — crisis" if c["crisis"] else ""}', '',
               f'- **Post:** {c["post"][0]}: {c["post"][1]}', f'- **Deadline:** {c["due"]}']
        if c['warning']: md.append(f'- **Warning ({c["warning"][0]} desk):** {c["warning"][1]}: {c["warning"][2]}')
        if c['crisis']: md.append(f'- **Crisis picture:** {c["crisis"]["caption"]}; room tag: {c["crisis"]["tag"]}')
        md.append('- **Choices:**')
        for x in c['choices']:
            md.append(f'  - `{x["id"]}` {x["l"]} (cost: {x["c"]}; backers {", ".join(x["yes"]) or "none"}; against {", ".join(x["no"]) or "none"}){" — if time runs out" if x["late"] else ""}. Outcome: {x["out"]}')
        md.append('- **Advisors:**')
        for d, (line, p) in c['argue'].items():
            md.append(f'  - {d}: "{line}" ' + (f'(backs `{p}`)' if p else '(joke)'))
        md += [f'- **Real basis:** {c["basis"]}', '']
open(os.path.join(HERE, 'card-copy.md'), 'w').write('\n'.join(md))
print('ok', sum(1 for c in CARDS))
