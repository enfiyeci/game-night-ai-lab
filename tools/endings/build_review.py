#!/usr/bin/env python3
"""Bundle ending films into one review page with a film picker (published as a private multi-file artifact).

Writes <out_dir>/index.html plus every file the player fetches, at the same relative paths as in the repo
(ui/endings/*.js, ui/endings/films/<id>.json, plates, clips, sounds, and the office art for all five eras), so the
player runs unchanged. The page lists each film with its length; pick one, pick the office era, and play.

Run: python3 tools/endings/build_review.py <out_dir> misalignment quietTakeover aligned
     Publish <out_dir>/index.html with the other files in <out_dir> as the artifact's supporting files.
"""
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def film_files(film_id):
    film = json.loads((ROOT / f"ui/endings/films/{film_id}.json").read_text())
    files = [f"ui/endings/films/{film_id}.json", f"ui/assets/endings/{film_id}.m4a"]
    files += [f"ui/assets/endings/plates/{s['plate']}.svg" for s in film["shots"] if s.get("plate")]
    clips = [s["clip"] for s in film["shots"] if s.get("clip")] + ([film["titleClip"]] if film.get("titleClip") else [])
    files += [f"ui/assets/endings/clips/{c}.mp4" for c in clips]
    total = sum(s["dur"] for s in film["shots"]) + film.get("titleDur", 7)
    return film, files, total


def build(out, ids):
    out = Path(out)
    out.mkdir(parents=True, exist_ok=True)
    shared = ["ui/endings/player.js", "ui/endings/timeline.js", "ui/endings/endings.css"]
    shared += [f"ui/assets/office-era{e}.svg" for e in range(1, 6)] + [f"ui/assets/anchors-era{e}.json" for e in range(1, 6)]
    films = []
    for fid in ids:
        film, files, total = film_files(fid)
        films.append((fid, film["title"], round(total)))
        shared += files
    for rel in dict.fromkeys(shared):
        dest = out / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / rel, dest)
    tokens = re.search(r":root\s*\{.*?\}", (ROOT / "ui/styles.css").read_text(), re.S).group(0)
    buttons = "".join(f'<button type="button" class="pick" data-id="{fid}" aria-pressed="{str(i == 0).lower()}">'
                      f'<span>{title}</span><small>{secs} s</small></button>' for i, (fid, title, secs) in enumerate(films))
    page = f"""<title>Game Night ending films</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&display=swap">
<link rel="stylesheet" href="ui/endings/endings.css">
<style>
{tokens}
html, body {{ background: var(--ink); color: var(--paper); }}
body {{ margin: 0; font-family: "Nunito", "Trebuchet MS", sans-serif; padding-inline: 16px; }}
.intro {{ max-width: 760px; margin: 0 auto; padding-block: 10vh 48px; display: grid; gap: 20px; }}
.kick {{ font-size: 12px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: color-mix(in oklab, var(--wood) 70%, var(--paper)); }}
h1 {{ margin: 0; font-size: clamp(30px, 5vw, 46px); font-weight: 900; line-height: 1.05; text-wrap: balance; }}
p {{ margin: 0; font-size: 17px; line-height: 1.55; color: color-mix(in oklab, var(--paper) 82%, var(--ink)); max-width: 62ch; }}
.films {{ display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); }}
.pick {{ font: 800 16px "Nunito", sans-serif; text-align: left; padding: 12px 14px; border-radius: 10px; cursor: pointer;
  border: 2px solid color-mix(in oklab, var(--paper) 25%, var(--ink)); background: transparent; color: var(--paper);
  display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }}
.pick small {{ font-weight: 700; color: color-mix(in oklab, var(--paper) 60%, var(--ink)); }}
.pick[aria-pressed="true"] {{ background: var(--paper); color: var(--ink); border-color: var(--paper); }}
.pick[aria-pressed="true"] small {{ color: color-mix(in oklab, var(--ink) 60%, var(--paper)); }}
.row {{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }}
.row span {{ font-size: 14px; font-weight: 800; margin-right: 4px; }}
.era {{ font: 800 15px "Nunito", sans-serif; padding: 8px 14px; border-radius: 10px; border: 2px solid color-mix(in oklab, var(--paper) 30%, var(--ink));
  background: transparent; color: var(--paper); cursor: pointer; }}
.era[aria-pressed="true"] {{ background: var(--paper); color: var(--ink); border-color: var(--paper); }}
.play {{ font: 900 20px "Nunito", sans-serif; padding: 14px 30px; border-radius: 14px; border: 3px solid var(--wood); background: var(--paper); color: var(--ink); cursor: pointer; justify-self: start; }}
.pick:focus-visible, .era:focus-visible, .play:focus-visible {{ outline: 3px solid var(--sky); outline-offset: 3px; }}
</style>
<div class="intro">
  <div class="kick">Game Night &middot; ending films</div>
  <h1>Ending films, 30-second cuts</h1>
  <p>Each film opens in your office, then shows the world through the screens people were looking at and wide shots rendered in Blender, then the title card and Lumen's last line. Sound on.</p>
  <div class="films" role="group" aria-label="Film">{buttons}</div>
  <div class="row" role="group" aria-label="Office era"><span>Office era</span>
    {''.join(f'<button type="button" class="era" data-era="{e}" aria-pressed="{str(e == 4).lower()}">{e}</button>' for e in range(1, 6))}</div>
  <p>Skip or Escape ends a film early.</p>
  <button type="button" class="play" id="play">Play</button>
</div>
<script type="module">
import {{ mountFilm }} from './ui/endings/player.js';
let era = 4;
let id = {json.dumps(ids[0])};
const choose = (sel, key, set) => document.querySelectorAll(sel).forEach((b) => b.addEventListener('click', () => {{
  set(b.dataset[key]);
  document.querySelectorAll(sel).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}}));
choose('.era', 'era', (v) => {{ era = Number(v); }});
choose('.pick', 'id', (v) => {{ id = v; }});
const playBtn = document.getElementById('play');
playBtn.addEventListener('click', async () => {{
  playBtn.disabled = true;
  try {{
    const film = await mountFilm(document.body, {{ id, era, onDone: () => {{ playBtn.disabled = false; playBtn.focus(); }} }});
    film.play();
  }} catch (error) {{
    playBtn.disabled = false;
    playBtn.textContent = `Could not load the film: ${{error.message}}`;
  }}
}});
</script>
"""
    (out / "index.html").write_text(page, encoding="utf-8")
    size = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    print(f"wrote {out}/index.html and {sum(1 for f in out.rglob('*') if f.is_file()) - 1} files ({size / 1e6:.1f} MB)")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2:])
