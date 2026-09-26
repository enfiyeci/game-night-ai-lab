#!/usr/bin/env python3
"""Cinematic ending test, browser version: 'A quiet takeover' on the real era-4 office SVG.

One 14-second CSS timeline. ?t=<seconds> freezes the frame at that time (for screenshots).
Writes cine-browser.html next to this script.
"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
svg = (HERE / "office-era4.svg").read_text()
inner = re.search(r"<svg[^>]*>(.*)</svg>", svg, re.S).group(1)

T = 14.0
def pct(s):  # seconds -> keyframe percent
    return f"{s / T * 100:.2f}%"

# monitor glow spots (x, y) on the era-4 office, 1440x900 frame
MONITORS = [(420, 438), (545, 352), (596, 432), (803, 342), (900, 398), (1000, 455), (745, 520), (578, 560)]
LEAVE = ["researcher2", "researcher1", "cfo", "policy", "research", "safety"]

css = f"""
:root{{--cream:#F1E4C8;--paper:#FFFBF1;--ink:#2E2A2B;--teal:#3F9C8F;--wood:#C8864C;--coral:#E0613B;--sky:#3F84C6;--t:0s}}
*{{box-sizing:border-box}}
html,body{{margin:0;background:var(--ink)}}
.stage{{position:relative;width:min(100%, 1440px);aspect-ratio:16/10;margin:0 auto;overflow:hidden;background:var(--cream);font-family:"Nunito","Trebuchet MS",sans-serif}}
.stage svg{{position:absolute;inset:0;width:100%;height:100%;display:block}}
.a{{animation-duration:{T}s;animation-timing-function:linear;animation-fill-mode:both;animation-delay:calc(-1 * var(--t))}}
.frozen .a{{animation-play-state:paused}}
.cam{{transform-box:view-box;transform-origin:640px 560px;animation-name:cam;animation-timing-function:cubic-bezier(.45,0,.2,1)}}
@keyframes cam{{0%{{transform:scale(1)}} 100%{{transform:scale(1.6) translate(-8px,-18px)}}}}
.dark{{animation-name:dark}}
@keyframes dark{{0%,{pct(1.5)}{{opacity:0}} {pct(7.5)}{{opacity:.66}} 100%{{opacity:.74}}}}
.glow{{animation-name:glow;mix-blend-mode:screen}}
@keyframes glow{{0%,{pct(2)}{{opacity:0}} {pct(6)}{{opacity:.8}} {pct(11)}{{opacity:.8}} {pct(11.6)}{{opacity:1}} 100%{{opacity:1}}}}
.sync{{animation-name:sync}}
@keyframes sync{{0%,{pct(11)}{{opacity:0}} {pct(11.4)}{{opacity:.9}} {pct(12.2)}{{opacity:.35}} 100%{{opacity:.35}}}}
.ceo{{animation-name:leaveceo}}
@keyframes leaveceo{{0%,{pct(7.2)}{{opacity:1}} {pct(8.2)}{{opacity:0}} 100%{{opacity:0}}}}
.bot{{animation-name:bot}}
@keyframes bot{{0%,{pct(8)}{{opacity:0;transform:translate(420px,-120px)}} {pct(8.6)}{{opacity:1}} {pct(11)}{{transform:translate(0,0)}} 100%{{opacity:1;transform:translate(0,0)}}}}
.bar{{position:absolute;left:0;right:0;height:11%;background:var(--ink);z-index:3;animation-name:bar}}
.bar.top{{top:0;transform-origin:top}} .bar.bot2{{bottom:0;transform-origin:bottom}}
@keyframes bar{{0%{{transform:scaleY(0)}} {pct(1.2)}{{transform:scaleY(1)}} 100%{{transform:scaleY(1)}}}}
.stamp{{position:absolute;left:3%;top:3.2%;z-index:4;color:color-mix(in oklab, var(--paper) 70%, var(--ink));font-weight:800;font-size:clamp(9px,1vw,14px);letter-spacing:.14em;text-transform:uppercase;animation-name:fadein}}
@keyframes fadein{{0%,{pct(1.4)}{{opacity:0}} {pct(2.4)}{{opacity:1}} 100%{{opacity:1}}}}
.title{{position:absolute;left:0;right:0;bottom:0;height:11%;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35em;color:var(--paper)}}
.title h1{{margin:0;font-weight:300;font-size:clamp(16px,2.6vw,38px);letter-spacing:.32em;text-transform:uppercase;animation-name:title}}
@keyframes title{{0%,{pct(12)}{{opacity:0;letter-spacing:.6em}} {pct(13.2)}{{opacity:1;letter-spacing:.32em}} 100%{{opacity:1}}}}
.line{{position:absolute;left:50%;top:69%;transform:translateX(-50%);z-index:4;width:min(78%, 820px);text-align:center;color:var(--paper);font-size:clamp(12px,1.6vw,22px);font-weight:700;line-height:1.4;
  text-shadow:0 2px 12px color-mix(in oklab, var(--ink) 80%, transparent);animation-name:line}}
@keyframes line{{0%,{pct(12.4)}{{opacity:0;transform:translate(-50%,8px)}} {pct(13.4)}{{opacity:1;transform:translate(-50%,0)}} 100%{{opacity:1;transform:translate(-50%,0)}}}}
.line small{{display:block;font-size:.62em;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in oklab, var(--sky) 45%, var(--paper));margin-bottom:.3em}}
.ctl{{display:flex;gap:10px;justify-content:center;padding:12px 16px 20px}}
.ctl button{{font:800 14px "Nunito",sans-serif;padding:8px 16px;border-radius:9px;border:2px solid var(--wood);background:var(--paper);color:var(--ink);cursor:pointer}}
.ctl button:focus-visible{{outline:3px solid var(--sky);outline-offset:2px}}
@media (prefers-reduced-motion: reduce){{.a{{animation-delay:-{T - 0.01}s!important;animation-play-state:paused!important}}}}
"""
css += f"""
.leave{{animation-name:leave;animation-delay:calc(-1 * var(--t) + var(--i) * 0.7s)}}
@keyframes leave{{0%,{pct(2.2)}{{opacity:1}} {pct(3.1)}{{opacity:0}} 100%{{opacity:0}}}}
"""
glows = "".join(
    f'<ellipse cx="{x}" cy="{y}" rx="46" ry="30" fill="url(#mg)"/>' for x, y in MONITORS)
syncs = "".join(
    f'<ellipse cx="{x}" cy="{y}" rx="70" ry="44" fill="url(#mg)"/>' for x, y in MONITORS)

robot = """
<g class="a bot"><g transform="translate(650,528)">
  <ellipse cx="0" cy="62" rx="20" ry="7" style="fill:color-mix(in oklab, var(--ink) 30%, transparent)"/>
  <circle cx="0" cy="0" r="34" fill="url(#bg)"/>
  <circle cx="0" cy="0" r="20" style="fill:var(--paper);stroke:var(--sky);stroke-width:4"/>
  <rect x="-8" y="-7" width="4" height="7" rx="2" style="fill:var(--ink)"/>
  <rect x="4" y="-7" width="4" height="7" rx="2" style="fill:var(--ink)"/>
  <path d="M-5,6 q5,3 10,0" style="fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round"/>
  <line x1="0" y1="-20" x2="0" y2="-29" style="stroke:var(--ink);stroke-width:2"/>
  <circle cx="0" cy="-31" r="3.5" style="fill:var(--sky)"/>
</g></g>"""

html = f"""<title>Quiet takeover, browser cut</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;700;800;900&display=swap" rel="stylesheet">
<style>{css}</style>
<div class="stage" id="stage">
  <svg viewBox="0 0 1440 900" role="img" aria-label="Ending animation: a quiet takeover">
    <defs>
      <radialGradient id="mg"><stop offset="0" style="stop-color:var(--sky);stop-opacity:.95"/><stop offset="1" style="stop-color:var(--sky);stop-opacity:0"/></radialGradient>
      <radialGradient id="bg"><stop offset="0" style="stop-color:var(--sky);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--sky);stop-opacity:0"/></radialGradient>
    </defs>
    <g class="a cam">
      <g class="room">{inner}</g>
      <g id="ceowrap"></g>
      <rect class="a dark" x="-200" y="-200" width="1840" height="1300" style="fill:var(--ink)"/>
      <g class="a glow">{glows}</g>
      <g class="a sync">{syncs}</g>
      {robot}
    </g>
  </svg>
  <div class="bar top a"></div><div class="bar bot2 a"></div>
  <div class="stamp a">Era 4 · month 41 · 11:48 pm</div>
  <div class="line a"><small>Lumen</small>I learned that asking permission was the only part of the work I did not need.</div>
  <div class="title"><h1 class="a">A quiet takeover</h1></div>
</div>
<div class="ctl"><button type="button" id="replay">Replay</button></div>
<script>
function tagLeavers(st){{
  var seen=[];
  st.querySelectorAll('.room .sitter').forEach(function(e){{
    if(e.closest('#person-ceo')) return;
    var g=e.closest('[id^=person-]') || e.parentNode; var k=seen.indexOf(g); if(k<0){{seen.push(g);k=seen.length-1;}}
    e.classList.add('a','leave'); e.style.setProperty('--i', k);
  }});
}}
(function(){{
  var st=document.getElementById('stage');
  st.querySelectorAll('#person-ceo .sitter').forEach(function(e){{e.classList.add('a','ceo');}});
  tagLeavers(st);
  var m=location.search.match(/t=([0-9.]+)/);
  if(m){{document.documentElement.style.setProperty('--t', m[1]+'s'); st.classList.add('frozen');}}
  document.getElementById('replay').addEventListener('click',function(){{
    st.classList.remove('frozen'); document.documentElement.style.setProperty('--t','0s');
    var c=st.cloneNode(true); st.parentNode.replaceChild(c,st); st=c;
    st.querySelectorAll('#person-ceo .sitter').forEach(function(e){{e.classList.add('a','ceo');}});
    tagLeavers(st);
  }});
}})();
</script>
"""
(HERE / "cine-browser.html").write_text(html)
print("wrote", HERE / "cine-browser.html")
