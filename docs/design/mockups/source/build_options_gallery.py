#!/usr/bin/env python3
"""One scrollable page with every option for the feed and Lumen, the era card and the endings screen.

Screenshots are embedded (JPEG, base64) so the page is a single self-contained file.
Writes docs/design/mockups/options-gallery.html. K2 tokens only.
"""
import base64
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
MOCK = HERE.parent
OUT = MOCK / "options-gallery.html"

SECTIONS = [
    ("feed", "1. Where the feed and Lumen live", "Pick one, or mix: for example “A’s phone with C’s robot”.", [
        ("A", "Phone and monitor", "Closest to Game Dev Tycoon", "K2-feed-lumen-a.png", [
            "<b>How it works.</b> When posts arrive, the phone on your desk buzzes and shows a count. Click it and a phone slides up on the left with the posts, newest first. Lumen speaks once at the start of each turn, in a bubble from your monitor, and the bubble closes when you act.",
            "<b>Why it works.</b> Nothing is on screen until you look, which keeps your K2 rule. Both live on your own desk, so they move with you when the office grows from the loft to the campus.",
            "<b>The cost.</b> A phone is easy to ignore; a player who never clicks it misses the reception. Fix: open it by itself on the turn after a launch.",
            "<b>Build effort.</b> Lowest.",
        ]),
        ("B", "Posts float by, Lumen narrates", "Experimental", "K2-feed-lumen-b.png", [
            "<b>How it works.</b> Each new post floats up in the empty bottom-left corner, stays about six seconds and fades. Click one to open the full feed. Lumen’s line appears as a subtitle bar at the bottom, as if narrating a film.",
            "<b>Why it works.</b> Nobody misses the reactions, the empty corner gets a job, and Lumen clearly reads as the narrator.",
            "<b>The cost.</b> It bends the “nothing on screen unless asked” rule: something moves every turn, even while you are deciding. The subtitle bar covers the front of the room.",
            "<b>Build effort.</b> Medium (timed animations plus a reduced-motion version).",
        ]),
        ("C", "Lounge TV and a Lumen robot", "Most experimental", "K2-feed-lumen-c.png", [
            "<b>How it works.</b> A TV in the lounge corner plays the feed as a news channel with a ticker; click it to open the channel. Lumen is a small robot that floats between the desks and talks in bubbles, like the advisors.",
            "<b>Why it works.</b> Everything is inside the world. Lumen becomes a character you watch all game, so the ending lands harder when that same robot turns smooth and evasive.",
            "<b>The cost.</b> The most art: a TV for every office era and a robot that moves without hiding the advisors’ “!” markers. The TV itself is too small to read without clicking.",
            "<b>Build effort.</b> Highest.",
        ]),
    ]),
    ("era", "2. The era-change card", "Shown once when a new era starts. All four use the same content from the era-card build.", [
        ("E1", "Dialog with the team (current)", "Safe", "K2-side-era.png", [
            "The approved Game Dev Tycoon dialog: your team reacts on the left, the era in the centre, the bottleneck and next gate on the right, and a line from Lumen.",
            "Familiar and consistent with every other decision screen. It is the quietest of the four: a new era feels like one more dialog.",
        ]),
        ("E2", "Banner over the office", "Closest to Game Dev Tycoon", "K2-opt-e2.png", [
            "A ribbon announces the era over the office; each advisor says their reaction from their own desk; the three changes arrive as cards along the bottom.",
            "The office stays visible, so the era feels like something happening to your lab. Bubble positions come from the office’s head anchors, so it works in every era’s office.",
        ]),
        ("E3", "Newspaper front page", "Experimental", "K2-opt-e3.png", [
            "The era arrives as the front page of The Daily Token, the paper of the same world as the feed: headline, three short articles, a quote from Margot, and Lumen in the letters page.",
            "The biggest “event” moment and the funniest. It pairs with the newspaper ending (N2). The cost is more text to read, and a serif masthead used nowhere else.",
        ]),
        ("E4", "The five eras as one strip", "Experimental", "K2-opt-e4.png", [
            "All five eras side by side: finished eras show what you did, the current era opens wide, and future eras are locked with a one-line teaser.",
            "Best for a judge playing once: it shows the whole arc of the game and what is still coming. It covers the office and is the largest panel of the four.",
        ]),
    ]),
    ("end", "3. The endings screen", "Shown when a run ends, before the full reveal. Sample run: absorbed in era 3.", [
        ("N1", "Report card (current)", "Safe", "K2-side-endings.png", [
            "Built like the release reveal: who told you the truth as a scale from reliable to misleading, your run in one line, Lumen’s last word, and the endings found so far.",
            "Clearest for the “advisors see part of the truth” lesson. The most information, the least drama.",
        ]),
        ("N2", "Newspaper final edition", "Experimental", "K2-opt-n2.png", [
            "Your ending is the headline. Each advisor is quoted with a verdict, Lumen gives its last interview, and the endings you have not found are redacted stories tagged win or failure.",
            "The redacted stories are a strong reason to play again. Pairs with E3.",
        ]),
        ("N3", "Hall of endings", "Game Dev Tycoon-like", "K2-opt-n3.png", [
            "A wall of framed endings: found ones are hung, missing ones are empty frames marked win or failure, and the new one glows. The run summary is a note pinned below.",
            "The collection is the star, so progress is obvious at a glance. The advisor verdicts become small.",
        ]),
        ("N4", "A letter from Lumen", "Most experimental", "K2-opt-n4.png", [
            "Lumen writes you a letter about the run, using the advisor verdicts in plain sentences. Endings found are stamps on the envelope.",
            "The most personal ending, and it makes the Lumen decision pay off. The letter needs sentence templates per ending and per Lumen mood, so it is the most writing.",
        ]),
    ]),
]

CSS = """
:root{--cream:#F1E4C8;--paper:#FFFBF1;--ink:#2E2A2B;--teal:#3F9C8F;--wood:#C8864C;--coral:#E0613B;--sky:#3F84C6}
*{box-sizing:border-box}
html{background:var(--cream)}
body{margin:0;font-family:"Nunito","Trebuchet MS",sans-serif;color:var(--ink);background:var(--cream)}
header{padding:28px 32px 18px;border-bottom:3px solid var(--wood);background:var(--paper)}
header h1{margin:0;font-weight:300;font-size:34px;line-height:1.1}
header p{margin:8px 0 0;font-size:15px;font-weight:600;max-width:74ch;line-height:1.5}
nav{position:sticky;top:0;z-index:5;display:flex;gap:6px;flex-wrap:wrap;padding:10px 32px;background:color-mix(in oklab, var(--paper) 92%, transparent);
  border-bottom:1px solid color-mix(in oklab, var(--wood) 35%, transparent);backdrop-filter:blur(6px)}
nav a{font-size:13px;font-weight:800;color:var(--ink);text-decoration:none;padding:5px 10px;border-radius:7px;background:color-mix(in oklab, var(--wood) 16%, var(--paper))}
nav a:hover,nav a:focus-visible{background:color-mix(in oklab, var(--wood) 32%, var(--paper));outline:none}
section{padding:26px 32px 8px}
section > h2{margin:0;font-size:26px;font-weight:800}
section > p{margin:4px 0 16px;font-size:14.5px;font-weight:600;color:color-mix(in oklab, var(--ink) 75%, var(--paper))}
.opt{display:grid;grid-template-columns:minmax(0, 2.1fr) minmax(280px, 1fr);gap:22px;align-items:start;padding:18px;margin-bottom:18px;background:var(--paper);border-radius:14px;
  border:1px solid color-mix(in oklab, var(--ink) 8%, transparent);box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 10%, transparent)}
.opt img{width:100%;height:auto;display:block;border-radius:8px;border:1px solid color-mix(in oklab, var(--ink) 12%, transparent)}
.tag{display:flex;align-items:center;gap:10px}
.id{display:grid;place-items:center;min-width:44px;height:44px;padding:0 8px;border-radius:10px;background:var(--wood);color:var(--paper);font-weight:900;font-size:18px}
.opt h3{margin:0;font-size:20px;font-weight:800;line-height:1.15}
.lvl{display:inline-block;margin-top:3px;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in oklab, var(--wood) 60%, var(--ink))}
.opt ul{margin:14px 0 0;padding:0;list-style:none}
.opt li{font-size:14.5px;font-weight:600;line-height:1.5;margin:0 0 10px}
.rec{margin:0 0 18px;padding:14px 18px;border-radius:12px;background:color-mix(in oklab, var(--teal) 12%, var(--paper));border:1.5px solid var(--teal);font-size:15px;font-weight:700;line-height:1.5}
.rec b{color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
footer{padding:18px 32px 40px;font-size:13.5px;font-weight:600;color:color-mix(in oklab, var(--ink) 70%, var(--paper))}
@media (max-width: 900px){.opt{grid-template-columns:1fr}header,section,nav,footer{padding-left:16px;padding-right:16px}}
"""

RECS = {
    "feed": "<b>My recommendation: A’s phone with C’s robot.</b> The phone is the cheapest reliable home for the feed and moves with every office. The robot turns Lumen into a character, which is what makes its evasive turn and its epilogue hit.",
    "era": "<b>My recommendation: E2, the banner over the office</b>, for keeping the lab on screen. Use E4 once, for the very first era, as the game’s map for new players.",
    "end": "<b>My recommendation: N4, the letter from Lumen</b>, if the robot wins section 1, since it pays off the character. Otherwise N1, which teaches the advisor lesson most clearly.",
}


def jpeg_b64(png: Path) -> str:
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "x.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", str(png), "--out", str(out)], check=True, capture_output=True)
        return base64.b64encode(out.read_bytes()).decode()


def build():
    nav = "".join(f'<a href="#{sid}">{title.split(". ", 1)[1]}</a>' for sid, title, _, _ in SECTIONS)
    body = ""
    for sid, title, intro, opts in SECTIONS:
        body += f'<section id="{sid}"><h2>{title}</h2><p>{intro}</p><div class="rec">{RECS[sid]}</div>'
        for oid, name, lvl, img, notes in opts:
            src = jpeg_b64(MOCK / img)
            lis = "".join(f"<li>{n}</li>" for n in notes)
            body += (f'<article class="opt" id="{oid}"><img src="data:image/jpeg;base64,{src}" alt="Option {oid}: {name}" loading="lazy">'
                     f'<div><div class="tag"><div class="id">{oid}</div><div><h3>{name}</h3><span class="lvl">{lvl}</span></div></div><ul>{lis}</ul></div></article>')
        body += "</section>"
    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Screen options</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;600;700;800;900&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<header><h1>Feed, Lumen, era card and endings: the options</h1>
<p>Every option below is drawn in the approved K2 look on a sample run in era 3. Answer with the codes, for example “A with C’s robot, E2, N4”, or mix parts of different options.</p></header>
<nav>{nav}</nav>
{body}
<footer>Source: docs/design/mockups/source/build_options_gallery.py on branch side-feed. Each screenshot is a 1440 × 900 render.</footer>
</body></html>"""
    OUT.write_text(html)
    print("wrote", OUT, f"{OUT.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    build()
