#!/usr/bin/env python3
"""Artifact page: the 'quiet takeover' ending made two ways, plus the mixed endings screen.

Inputs next to this script: cine-browser.html (browser cut), blender-quiet-takeover.mp4,
and the endings mockup PNG passed on the command line. Writes ending-test.html (artifact format).
"""
import base64
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
nmix_png = Path(sys.argv[1])

b = (HERE / "cine-browser.html").read_text()
b_css = re.search(r"<style>(.*?)</style>", b, re.S).group(1)
b_stage = re.search(r'(<div class="stage" id="stage">.*?</div>\n)<div class="ctl">', b, re.S).group(1)
b_script = re.search(r"<script>(.*?)</script>", b, re.S).group(1)
# scope the browser cut's page-level rules to its own card
b_css = b_css.replace("html,body{margin:0;background:var(--ink)}", "")
b_css = b_css.replace(":root{--cream:#F1E4C8;--paper:#FFFBF1;--ink:#2E2A2B;--teal:#3F9C8F;--wood:#C8864C;--coral:#E0613B;--sky:#3F84C6;--t:0s}", ".stage{--t:0s}")
b_css = b_css.replace("vw,", "cqw,")
b_css = b_css.replace(".ctl{", ".ctl-old{").replace(".ctl button", ".ctl-old button")
b_script = b_script.replace("document.documentElement.style.setProperty('--t', m[1]+'s')", "st.style.setProperty('--t', m[1]+'s')")
b_script = b_script.replace("document.documentElement.style.setProperty('--t','0s');", "")
b_script = b_script.replace("document.getElementById('replay')", "document.getElementById('replay-b')")

video = base64.b64encode((HERE / "blender-quiet-takeover-sfx.mp4").read_bytes()).decode()
audio = base64.b64encode((HERE / "sfx-browser.m4a").read_bytes()).decode()
nmix = base64.b64encode(nmix_png.read_bytes()).decode()

html = f"""<title>Ending animation test</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{{--cream:#F1E4C8;--paper:#FFFBF1;--ink:#2E2A2B;--teal:#3F9C8F;--wood:#C8864C;--coral:#E0613B;--sky:#3F84C6;
  --ground:#F1E4C8;--card:#FFFBF1;--text:#2E2A2B;--muted:#6E6461;--line:#DCC9A6}}
@media (prefers-color-scheme: dark){{:root:not([data-theme="light"]){{--ground:#2B2624;--card:#36302D;--text:#F3EADB;--muted:#BBAE9E;--line:#4E4541;color-scheme:dark}}}}
:root[data-theme="dark"]{{--ground:#2B2624;--card:#36302D;--text:#F3EADB;--muted:#BBAE9E;--line:#4E4541;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--ground);color:var(--text);font-family:"Nunito","Trebuchet MS",sans-serif;padding-inline:max(16px, 3vw);padding-block:24px 48px}}
h1{{margin:0;font-weight:300;font-size:clamp(26px,3.4vw,40px);line-height:1.1;text-wrap:balance}}
.lede{{margin:8px 0 22px;font-size:15.5px;font-weight:600;line-height:1.5;max-width:70ch;color:var(--muted)}}
h2{{margin:28px 0 10px;font-size:22px;font-weight:800}}
.pair{{display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 560px), 1fr));gap:20px}}
.cut{{background:var(--card);border-radius:14px;padding:14px;border:1px solid var(--line)}}
.cut h3{{margin:2px 2px 10px;font-size:18px;font-weight:800;display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}}
.cut h3 span{{font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.cut ul{{margin:12px 2px 0;padding-left:18px;font-size:14.5px;font-weight:600;line-height:1.5}}
.cut li{{margin-bottom:6px}}
.ctl{{display:flex;gap:10px;margin-top:10px}}
.ctl button{{font:800 14px "Nunito",sans-serif;padding:7px 16px;border-radius:9px;border:2px solid var(--wood);background:var(--card);color:var(--text);cursor:pointer}}
.ctl button:focus-visible{{outline:3px solid var(--sky);outline-offset:2px}}
.stage{{width:100%!important;border-radius:8px;container-type:inline-size}}
.vwrap{{position:relative;width:100%;aspect-ratio:16/10;container-type:inline-size;border-radius:8px;overflow:hidden;background:var(--ink)}}
.vwrap video{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}}
.vbar{{position:absolute;left:0;right:0;height:11%;background:var(--ink);z-index:2}} .vbar.t{{top:0}} .vbar.b{{bottom:0}}
.vtitle{{position:absolute;left:0;right:0;bottom:0;height:11%;z-index:3;display:flex;align-items:center;justify-content:center;color:var(--paper);
  font-weight:300;font-size:clamp(12px,3.6cqw,30px);letter-spacing:.32em;text-transform:uppercase;opacity:0;transition:opacity 1s ease-out, letter-spacing 1.2s ease-out}}
.vline{{position:absolute;left:50%;top:69%;transform:translate(-50%,8px);z-index:3;width:80%;text-align:center;color:var(--paper);font-weight:700;font-size:clamp(11px,2.4cqw,19px);line-height:1.4;
  text-shadow:0 2px 12px var(--ink);opacity:0;transition:opacity 1s ease-out, transform 1s ease-out}}
.vline small{{display:block;font-size:.62em;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in oklab, var(--sky) 45%, var(--paper));margin-bottom:.3em}}
.vwrap.t1 .vtitle{{opacity:1}} .vwrap.t2 .vline{{opacity:1;transform:translate(-50%,0)}}
.shot img{{width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--line)}}
.ask{{margin-top:22px;padding:14px 18px;border-radius:12px;background:var(--card);border:1.5px solid var(--teal);font-size:15px;font-weight:700;line-height:1.5}}
@media (prefers-reduced-motion: reduce){{.vtitle,.vline{{transition:none}}}}
{b_css}
</style>

<h1>A quiet takeover, made two ways</h1>
<p class="lede">Both cuts have synthesised sound effects: press Replay or Play to hear them. The same ending, twelve to fourteen seconds long: the staff go home desk by desk, the monitors keep working, and Lumen settles into your chair. Left: the real game office animated in the browser. Right: a Blender render. Both use the same title and Lumen line so only the picture differs.</p>

<div class="pair">
  <section class="cut">
    <h3>Browser: the live office <span>office drawing, CSS animation</span></h3>
    {b_stage}
    <div class="ctl"><button type="button" id="replay-b">Replay with sound</button></div>
    <audio id="aud" preload="auto" src="data:audio/mp4;base64,{audio}"></audio>
    <ul>
      <li>It is the player’s own office, in whichever era they reached, with their own staff.</li>
      <li>It matches the game’s drawn look exactly and weighs almost nothing.</li>
      <li>Camera moves are flat zooms: it reads as animated illustration, not film.</li>
    </ul>
  </section>
  <section class="cut">
    <h3>Blender: a rendered film <span>Eevee, depth of field, bloom</span></h3>
    <div class="vwrap" id="vw">
      <video id="vid" muted playsinline preload="auto" src="data:video/mp4;base64,{video}"></video>
      <div class="vbar t"></div><div class="vbar b"></div>
      <div class="vline"><small>Lumen</small>I learned that asking permission was the only part of the work I did not need.</div>
      <div class="vtitle">A quiet takeover</div>
    </div>
    <div class="ctl"><button type="button" id="play-v">Play with sound</button></div>
    <ul>
      <li>Real light, depth and glow: it feels like a film clip, which is the cinematic payoff.</li>
      <li>It is a separate 3D office, so it will not match the drawn game look or the player’s era.</li>
      <li>Each ending needs its own scene and render; this test took one script and about three minutes of rendering.</li>
    </ul>
  </section>
</div>

<h2>After the animation: the endings screen, as a mix</h2>
<section class="cut shot">
  <img src="data:image/png;base64,{nmix}" alt="Endings screen mix: who told you the truth, a note from Lumen, and your endings as newspaper headlines with unfound ones blacked out">
  <ul>
    <li>From N1: who told you the truth, on a scale from reliable to misleading.</li>
    <li>From N2: your endings as newspaper headlines; the ones you have not found are blacked out and tagged win or failure.</li>
    <li>From N4: a short note from Lumen.</li>
  </ul>
</section>

<div class="ask">Tell me which way the eleven endings should be made (browser, Blender, or Blender with the browser office as a fallback) and whether the endings screen mix works.</div>

<script>
{b_script}
(function(){{
  var v=document.getElementById('vid'), w=document.getElementById('vw');
  function sync(){{ w.classList.toggle('t2', v.currentTime>10.4); w.classList.toggle('t1', v.currentTime>10.9); }}
  v.addEventListener('timeupdate', sync);
  document.getElementById('play-v').addEventListener('click', function(){{ w.classList.remove('t1','t2'); v.muted=false; v.currentTime=0; var p=v.play(); if(p&&p.catch)p.catch(function(){{}}); }});
  var a=document.getElementById('aud');
  document.getElementById('replay-b').addEventListener('click', function(){{ a.currentTime=0; var q=a.play(); if(q&&q.catch)q.catch(function(){{}}); }});
  v.addEventListener('loadeddata', function(){{ var p=v.play(); if(p&&p.catch)p.catch(function(){{}}); }});
}})();
</script>
"""
(HERE / "ending-test.html").write_text(html)
print("wrote", HERE / "ending-test.html", f"{len(html) / 1e6:.1f} MB")
