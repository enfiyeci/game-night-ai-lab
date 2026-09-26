#!/usr/bin/env python3
"""Bundle one ending film into a single self-contained HTML page for review (published as a private artifact).

Everything the player fetches (the shot list, plates, office art for all five eras, anchors) is inlined and served
by a small fetch shim; the sound is a data URI. The player code is inlined from ui/endings/, unchanged apart from
its import/export lines.

Run: python3 tools/endings/build_review.py misalignment <out.html>
"""
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def module_body(path):
    src = (ROOT / path).read_text()
    src = re.sub(r"^import .*?;\n", "", src, flags=re.M)
    return re.sub(r"^export ", "", src, flags=re.M)


def build(film_id, out):
    film = json.loads((ROOT / f"ui/endings/films/{film_id}.json").read_text())
    assets = {f"ui/endings/films/{film_id}.json": json.dumps(film)}
    for name in {s["plate"] for s in film["shots"] if s.get("plate")}:
        assets[f"ui/assets/endings/plates/{name}.svg"] = (ROOT / f"ui/assets/endings/plates/{name}.svg").read_text()
    for era in range(1, 6):
        assets[f"ui/assets/office-era{era}.svg"] = (ROOT / f"ui/assets/office-era{era}.svg").read_text()
        assets[f"ui/assets/anchors-era{era}.json"] = (ROOT / f"ui/assets/anchors-era{era}.json").read_text()
    audio = "data:audio/mp4;base64," + base64.b64encode((ROOT / f"ui/assets/endings/{film_id}.m4a").read_bytes()).decode()
    tokens = re.search(r":root\s*\{.*?\}", (ROOT / "ui/styles.css").read_text(), re.S).group(0)
    css = tokens + "\n" + (ROOT / "ui/endings/endings.css").read_text()
    total = sum(s["dur"] for s in film["shots"]) + film.get("titleDur", 7)
    page = f"""<title>{film['title']} film</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&display=swap">
<style>
{css}
html, body {{ background: var(--ink); color: var(--paper); }}
body {{ margin: 0; font-family: "Nunito", "Trebuchet MS", sans-serif; padding-inline: 16px; }}
.intro {{ max-width: 720px; margin: 0 auto; padding-block: 12vh 40px; display: grid; gap: 18px; }}
.kick {{ font-size: 12px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: color-mix(in oklab, var(--wood) 70%, var(--paper)); }}
h1 {{ margin: 0; font-size: clamp(30px, 5vw, 48px); font-weight: 900; line-height: 1.05; text-wrap: balance; }}
p {{ margin: 0; font-size: 17px; line-height: 1.55; color: color-mix(in oklab, var(--paper) 82%, var(--ink)); max-width: 62ch; }}
.row {{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }}
.row span {{ font-size: 14px; font-weight: 800; margin-right: 4px; }}
.era {{ font: 800 15px "Nunito", sans-serif; padding: 8px 14px; border-radius: 10px; border: 2px solid color-mix(in oklab, var(--paper) 30%, var(--ink));
  background: transparent; color: var(--paper); cursor: pointer; }}
.era[aria-pressed="true"] {{ background: var(--paper); color: var(--ink); border-color: var(--paper); }}
.play {{ font: 900 20px "Nunito", sans-serif; padding: 14px 30px; border-radius: 14px; border: 3px solid var(--wood); background: var(--paper); color: var(--ink); cursor: pointer; justify-self: start; }}
.era:focus-visible, .play:focus-visible {{ outline: 3px solid var(--sky); outline-offset: 3px; }}
</style>
<div class="intro">
  <div class="kick">Game Night &middot; ending film &middot; pilot</div>
  <h1>{film['title']}</h1>
  <p>The first full ending film in the style you picked: your office, then stage-flat scenes and screens out in the world, then the title card and Lumen's last line. About {round(total)} seconds, with sound.</p>
  <p>Pick the era your lab ended in (it changes the office), then play. Skip or Escape ends it early.</p>
  <div class="row" role="group" aria-label="Office era"><span>Office era</span>
    {''.join(f'<button type="button" class="era" data-era="{e}" aria-pressed="{str(e == 4).lower()}">{e}</button>' for e in range(1, 6))}</div>
  <button type="button" class="play" id="play">Play the ending</button>
</div>
<script type="module">
const ASSETS = {json.dumps(assets)};
const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (url, opts) => (url in ASSETS ? Promise.resolve(new Response(ASSETS[url])) : realFetch(url, opts));
const AUDIO = "{audio}";
{module_body("ui/endings/timeline.js")}
{module_body("ui/endings/player.js")}
let era = 4;
document.querySelectorAll('.era').forEach((b) => b.addEventListener('click', () => {{
  era = Number(b.dataset.era);
  document.querySelectorAll('.era').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}}));
const playBtn = document.getElementById('play');
playBtn.addEventListener('click', async () => {{
  playBtn.disabled = true;
  const film = await mountFilm(document.body, {{ id: {json.dumps(film_id)}, era, audioUrl: AUDIO, onDone: () => {{ playBtn.disabled = false; playBtn.focus(); }} }});
  film.play();
}});
</script>
"""
    Path(out).write_text(page, encoding="utf-8")
    print(f"wrote {out} ({len(page) / 1e6:.1f} MB)")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
