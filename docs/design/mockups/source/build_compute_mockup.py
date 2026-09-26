"""Build docs/design/mockups/K2-compute.html from the approved K2 mockup.

Reuses K2's head, tokens, CSS and office SVG (lines 1-173), then adds two overlay
states: #deals (era 2, sign a compute deal) and #power (era 4, power sites).
"""
import pathlib, sys

WT = pathlib.Path.home() / "worktrees/game-night-ai-lab-compute/docs/design/mockups"
src = (WT / "K2-gdt-polished.html").read_text().split("\n")
head = src[:170]          # lines 1-170: doctype .. last CSS rule
room = src[172]           # line 173: office svg
assert src[170].startswith("</style>") and room.startswith("<svg class=\"room\"")

S = "stroke:color-mix(in oklab, var(--ink) 30%, transparent);stroke-width:0.8;stroke-linejoin:round"


def P(ox, oy, u, v, z=0):
    return (ox + (u - v) * 0.866, oy + (u + v) * 0.5 - z)


def poly(pts, fill, extra=""):
    p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polygon points="{p}" style="fill:{fill};{S}{extra}"/>'


def box(ox, oy, u, v, w, d, h, top, left, right, z0=0):
    g = lambda a, b, z: P(ox, oy, a, b, z)
    A, B, C, D = (u, v), (u + w, v), (u + w, v + d), (u, v + d)
    lf = [g(*D, z0), g(*C, z0), g(*C, z0 + h), g(*D, z0 + h)]
    rf = [g(*B, z0), g(*C, z0), g(*C, z0 + h), g(*B, z0 + h)]
    tp = [g(*A, z0 + h), g(*B, z0 + h), g(*C, z0 + h), g(*D, z0 + h)]
    return poly(lf, left) + poly(rf, right) + poly(tp, top)


def mix(a, pct, b):
    return f"color-mix(in oklab, var(--{a}) {pct}%, var(--{b}))"


PAD = (mix("cream", 78, "ink"), mix("cream", 62, "ink"), mix("cream", 50, "ink"))
SAND = (mix("wood", 28, "cream"), mix("wood", 40, "ink"), mix("wood", 30, "ink"))
GREY = (mix("ink", 18, "paper"), mix("ink", 38, "paper"), mix("ink", 52, "paper"))
PAPER = (mix("paper", 92, "cream"), mix("cream", 80, "ink"), mix("cream", 66, "ink"))
TEAL = (mix("teal", 55, "paper"), mix("teal", 80, "ink"), mix("teal", 60, "ink"))


def pad(ox, oy, w, d, c=PAD):
    return box(ox, oy, 0, 0, min(w, 110), min(d, 86), 5, *c)


def puff(x, y):
    f = "color-mix(in oklab, var(--paper) 88%, transparent)"
    return "".join(
        f'<circle cx="{x+dx:.1f}" cy="{y+dy:.1f}" r="{r}" style="fill:{f};stroke:color-mix(in oklab, var(--ink) 14%, transparent);stroke-width:0.8"/>'
        for dx, dy, r in [(0, 0, 6), (7, -6, 7.5), (-3, -13, 6.5), (6, -20, 5)])


def small_puff(x, y):
    f = "color-mix(in oklab, var(--paper) 88%, transparent)"
    return "".join(
        f'<circle cx="{x+dx:.1f}" cy="{y+dy:.1f}" r="{r}" style="fill:{f};stroke:color-mix(in oklab, var(--ink) 14%, transparent);stroke-width:0.8"/>'
        for dx, dy, r in [(0, 0, 5), (7, -3, 6), (14, -7, 4.5)])


def cylinder(x, y, r, h, fill, cap):
    return (f'<path d="M{x-r:.1f},{y-h:.1f} L{x-r:.1f},{y:.1f} A{r},{r*0.5:.1f} 0 0 0 {x+r:.1f},{y:.1f} L{x+r:.1f},{y-h:.1f} Z" style="fill:{fill};{S}"/>'
            f'<ellipse cx="{x:.1f}" cy="{y-h:.1f}" rx="{r}" ry="{r*0.5:.1f}" style="fill:{cap};{S}"/>')


def svg(body, label):
    return f'<svg viewBox="0 0 220 140" width="220" height="140" role="img" aria-label="{label}">{body}</svg>'


def gas():
    ox, oy = 108, 36
    b = pad(ox, oy, 118, 92)
    for i in range(3):
        b += box(ox, oy, 12, 10 + i * 25, 58, 17, 17, *GREY, z0=5)
    for i in range(3):
        x, y = P(ox, oy, 80, 18 + i * 25, 5)
        b += cylinder(x, y, 6.5, 36, mix("ink", 26, "paper"), mix("ink", 60, "paper"))
        b += puff(x + 2, y - 46)
    return svg(b, "Gas turbine site")


def nuclear():
    ox, oy = 108, 36
    b = pad(ox, oy, 118, 92)
    x, y = P(ox, oy, 38, 46, 5)
    H, W, T = 56, 28, 17
    tower = (f'M{x-W:.1f},{y:.1f} C{x-W*0.62:.1f},{y-H*0.49:.1f} {x-T*0.78:.1f},{y-H*0.74:.1f} {x-T:.1f},{y-H:.1f} '
             f'L{x+T:.1f},{y-H:.1f} C{x+T*0.78:.1f},{y-H*0.74:.1f} {x+W*0.62:.1f},{y-H*0.49:.1f} {x+W:.1f},{y:.1f} '
             f'A{W},10 0 0 1 {x-W:.1f},{y:.1f} Z')
    shade = (f'M{x+5:.1f},{y+9.6:.1f} C{x+8:.1f},{y-H*0.4:.1f} {x+7:.1f},{y-H*0.74:.1f} {x+6:.1f},{y-H:.1f} '
             f'L{x+T:.1f},{y-H:.1f} C{x+T*0.78:.1f},{y-H*0.74:.1f} {x+W*0.62:.1f},{y-H*0.49:.1f} {x+W:.1f},{y:.1f} '
             f'A{W},10 0 0 1 {x+5:.1f},{y+9.6:.1f} Z')
    b += box(ox, oy, 70, 10, 28, 24, 20, *PAPER, z0=5)
    dx, dy = P(ox, oy, 84, 22, 25)
    b += f'<path d="M{dx-13:.1f},{dy:.1f} A13,13 0 0 1 {dx+13:.1f},{dy:.1f} A13,6 0 0 1 {dx-13:.1f},{dy:.1f} Z" style="fill:{mix("paper", 85, "ink")};{S}"/>'
    b += f'<path d="{tower}" style="fill:{mix("paper", 90, "cream")};{S}"/>'
    b += f'<path d="{shade}" style="fill:color-mix(in oklab, var(--ink) 12%, transparent)"/>'
    b += f'<ellipse cx="{x:.1f}" cy="{y-H:.1f}" rx="{T}" ry="5.5" style="fill:{mix("ink", 55, "paper")};{S}"/>'
    b += small_puff(x + 4, y - H - 6)
    return svg(b, "Nuclear restart site")


def gulf():
    ox, oy = 108, 36
    b = f'<circle cx="44" cy="34" r="17" style="fill:{mix("wood", 45, "paper")}"/>'
    b += pad(ox, oy, 118, 92, SAND)
    for i in range(2):
        b += box(ox, oy, 6, 8 + i * 38, 96, 26, 15, *PAPER, z0=5)
        for k in range(4):
            b += box(ox, oy, 14 + k * 22, 15 + i * 38, 9, 9, 5, *GREY, z0=20)
    return svg(b, "Gulf sovereign campus")


def grid_small():
    ox, oy = 104, 26
    b = pad(ox, oy, 118, 92)
    b += box(ox, oy, 14, 14, 24, 18, 17, *GREY, z0=5)
    b += box(ox, oy, 14, 50, 24, 18, 17, *GREY, z0=5)
    b += box(ox, oy, 70, 8, 34, 22, 14, *TEAL, z0=5)
    # lattice pylon
    base = [P(ox, oy, 70 + a, 58 + c, 5) for a, c in [(0, 0), (14, 0), (14, 14), (0, 14)]]
    top = P(ox, oy, 77, 65, 78)
    ln = "stroke:color-mix(in oklab, var(--ink) 62%, transparent);stroke-width:1.2;fill:none;stroke-linecap:round"
    for bx, by in base:
        b += f'<line x1="{bx:.1f}" y1="{by:.1f}" x2="{top[0]:.1f}" y2="{top[1]:.1f}" style="{ln}"/>'
    for z in (40, 62):
        l, r = P(ox, oy, 77, 65, z), P(ox, oy, 77, 65, z)
        b += f'<line x1="{l[0]-26:.1f}" y1="{l[1]:.1f}" x2="{r[0]+26:.1f}" y2="{r[1]:.1f}" style="{ln}"/>'
    wx, wy = P(ox, oy, 77, 65, 62)
    b += f'<path d="M{wx-26:.1f},{wy:.1f} Q{wx-60:.1f},{wy+12:.1f} {wx-96:.1f},{wy-6:.1f}" style="{ln};stroke-width:0.9"/>'
    return svg(b, "Grid connection site")


CSS = """
/* ---------- compute screens (K2 grammar, same tokens) ---------- */
.ov .hud{z-index:6}
.dlg2{left:306px;top:104px;width:816px;padding:18px 26px 20px}
.dlg2 .hh{text-align:center}
.dlg2 h1{margin:0;font-weight:300;font-size:33px;letter-spacing:-.01em;line-height:1.1}
.dlg2 .subt{font-size:13.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 58%, var(--paper));margin-top:4px}
.offers{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.offer{position:relative;background:var(--paper);border:1.5px solid color-mix(in oklab, var(--ink) 16%, transparent);border-radius:11px;padding:11px 11px 12px;display:flex;flex-direction:column}
.offer.sel{border-color:var(--wood);background:color-mix(in oklab, var(--wood) 10%, var(--paper));box-shadow:0 0 0 3px color-mix(in oklab, var(--wood) 32%, transparent)}
.offer .who{display:flex;align-items:center;gap:7px}
.mono{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:var(--paper);font-size:11.5px;font-weight:900}
.offer .nm{font-size:13.5px;font-weight:900;line-height:1.1}
.offer .kind{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:color-mix(in oklab, var(--wood) 60%, var(--ink))}
.offer .big{font-size:27px;font-weight:900;line-height:1;margin:12px 0 2px}
.offer .big small{font-size:13px;font-weight:800;margin-left:3px}
.offer .per{font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 58%, var(--paper));min-height:15px}
.kv{display:grid;grid-template-columns:auto 1fr;gap:3px 8px;margin-top:10px;font-size:12px}
.kv span{color:color-mix(in oklab, var(--ink) 58%, var(--paper));font-weight:700}
.kv b{font-weight:900;text-align:right}
.str{margin-top:auto;padding-top:10px}
.chip{display:inline-block;font-size:11px;font-weight:900;padding:2px 8px;border-radius:6px;background:color-mix(in oklab, var(--wood) 20%, var(--paper));color:color-mix(in oklab, var(--wood) 50%, var(--ink))}
.chip.none{background:color-mix(in oklab, var(--teal) 15%, var(--paper));color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
.str p{margin:5px 0 0;font-size:11.5px;font-weight:600;line-height:1.3;color:color-mix(in oklab, var(--ink) 72%, var(--paper))}
.pick{position:absolute;top:-9px;right:10px;background:var(--wood);color:var(--paper);font-size:10.5px;font-weight:900;padding:2px 8px;border-radius:6px}
.dfoot{display:flex;justify-content:space-between;align-items:center;margin-top:18px}
.dfoot .note{font-size:13px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.dfoot .note b{color:var(--ink);font-weight:900}
.dlg2 .btn{margin:0}
.dlg2 .sec{margin:14px 0 8px}
.bud .sec{margin:12px 0 8px}

.team2{left:40px;top:150px;width:250px}
.op{padding:9px 14px 11px;border-top:1px solid color-mix(in oklab, var(--wood) 30%, transparent)}
.op:first-of-type{border-top:0}
.op .nm{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;font-weight:800}
.mood{font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;padding:1px 6px;border-radius:5px}
.mood.calm{background:color-mix(in oklab, var(--teal) 16%, var(--paper));color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
.mood.uneasy{background:color-mix(in oklab, var(--wood) 22%, var(--paper));color:color-mix(in oklab, var(--wood) 50%, var(--ink))}
.mood.eager{background:color-mix(in oklab, var(--coral) 16%, var(--paper));color:color-mix(in oklab, var(--coral) 60%, var(--ink))}
.op q{display:block;margin-top:4px;font-size:12.5px;font-weight:600;font-style:italic;line-height:1.32;color:color-mix(in oklab, var(--ink) 78%, var(--paper));quotes:"\\201C" "\\201D"}

.side{left:1134px;top:150px;width:266px}
.side .body{padding:4px 14px 14px}
.bill{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0 2px}
.bill span{font-size:12.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.bill b{font-size:20px;font-weight:900}
.bill b.after{color:color-mix(in oklab, var(--coral) 75%, var(--ink))}
.stack{display:flex;height:12px;border-radius:4px;overflow:hidden;margin:6px 0 2px;background:color-mix(in oklab, var(--ink) 7%, var(--paper))}
.stack i{display:block;height:100%}
.stack i+i{border-left:2px solid var(--paper)}
.s-old{background:color-mix(in oklab, var(--teal) 70%, var(--paper))}
.s-old2{background:var(--teal)}
.s-new{background:repeating-linear-gradient(135deg, var(--wood) 0 4px, color-mix(in oklab, var(--wood) 45%, var(--paper)) 4px 7px)}
.stk-l{display:flex;justify-content:space-between;font-size:10.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 55%, var(--paper))}
.ct{padding:9px 0 9px;border-top:1px solid color-mix(in oklab, var(--wood) 25%, transparent)}
.ct .r1{display:flex;justify-content:space-between;font-size:12.5px;font-weight:900}
.ct .r2{display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 58%, var(--paper));margin-top:2px}
.ct .acts{display:flex;gap:6px;margin-top:6px}
.ghost{font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;border:1.5px solid color-mix(in oklab, var(--ink) 20%, transparent);color:color-mix(in oklab, var(--ink) 70%, var(--paper));background:var(--paper)}
.ct.new{border:1.5px dashed var(--wood);border-radius:8px;padding:8px 9px;margin-top:6px;background:color-mix(in oklab, var(--wood) 8%, var(--paper))}
.rw{display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:10px;border-top:2px solid color-mix(in oklab, var(--wood) 35%, transparent);font-size:12.5px;font-weight:700}
.rw b{font-weight:900}
.rw b.bad{color:color-mix(in oklab, var(--coral) 75%, var(--ink))}

/* power screen */
.meter{margin-top:4px;background:var(--paper);border:1.5px solid color-mix(in oklab, var(--ink) 12%, transparent);border-radius:11px;padding:12px 14px 12px}
.meter .top{display:flex;justify-content:space-between;align-items:baseline}
.meter .top .l{font-size:13px;font-weight:800}
.meter .top .l b{font-size:22px;font-weight:900;margin-right:4px}
.meter .top .r{font-size:12.5px;font-weight:800;color:color-mix(in oklab, var(--coral) 72%, var(--ink))}
.mtrack{position:relative;height:30px;margin:10px 0 6px;border-radius:8px;overflow:visible;display:flex}
.mtrack .on{background:var(--teal);border-radius:8px 0 0 8px;display:flex;align-items:center;padding-left:10px;color:var(--paper);font-size:11.5px;font-weight:900}
.mtrack .empty{background:color-mix(in oklab, var(--ink) 7%, var(--paper));border-radius:0 8px 8px 0}
.mtrack .dark{background:repeating-linear-gradient(135deg, var(--coral) 0 5px, color-mix(in oklab, var(--coral) 35%, var(--paper)) 5px 9px);display:flex;align-items:center;justify-content:center}
.mtrack .dark span{background:var(--paper);color:color-mix(in oklab, var(--coral) 72%, var(--ink));font-size:11px;font-weight:900;padding:1px 6px;border-radius:5px}
.mtrack .line{position:absolute;top:-7px;bottom:-7px;border-left:3px solid var(--ink)}
.mtrack .line em{position:absolute;top:-17px;left:-4px;font-style:normal;font-size:10.5px;font-weight:900;white-space:nowrap}
.mtrack .fut{position:absolute;top:-4px;bottom:-4px;border-left:2px dashed color-mix(in oklab, var(--ink) 70%, transparent)}
.mtrack .fut em{position:absolute;bottom:-18px;right:-4px;font-style:normal;font-size:10.5px;font-weight:800;color:color-mix(in oklab, var(--ink) 65%, var(--paper));white-space:nowrap}
.mleg{display:flex;gap:16px;margin-top:22px;font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.mleg span{display:flex;align-items:center;gap:5px}
.sw2{display:inline-block;width:16px;height:10px;border-radius:2px}
.sw-on{background:var(--teal)}
.sw-dark{background:repeating-linear-gradient(135deg, var(--coral) 0 3px, color-mix(in oklab, var(--coral) 35%, var(--paper)) 3px 5px)}
.sw-fut{width:0;height:12px;border-left:2px dashed var(--ink);border-radius:0}
.sites{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.site{position:relative;background:var(--paper);border:1.5px solid color-mix(in oklab, var(--ink) 16%, transparent);border-radius:11px;padding:0 0 12px;display:flex;flex-direction:column}
.site.sel{border-color:var(--wood);box-shadow:0 0 0 3px color-mix(in oklab, var(--wood) 32%, transparent)}
.site .art{border-radius:10px 10px 0 0;overflow:hidden;background:color-mix(in oklab, var(--cream) 55%, var(--paper));display:flex;justify-content:center;border-bottom:1.5px solid color-mix(in oklab, var(--ink) 10%, transparent)}
.site .art svg{display:block}
.site .tx{padding:10px 12px 0}
.site .nm{display:flex;justify-content:space-between;align-items:baseline;font-size:14.5px;font-weight:900}
.site .nm small{font-size:17px;font-weight:900}
.site .nm small i{font-style:normal;font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 55%, var(--paper));margin-left:4px}
.tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.tg{font-size:11px;font-weight:800;padding:2px 7px;border-radius:6px}
.tg.good{background:color-mix(in oklab, var(--teal) 15%, var(--paper));color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
.tg.bad{background:color-mix(in oklab, var(--coral) 14%, var(--paper));color:color-mix(in oklab, var(--coral) 62%, var(--ink))}
.tg.neu{background:color-mix(in oklab, var(--wood) 18%, var(--paper));color:color-mix(in oklab, var(--wood) 50%, var(--ink))}
.tg.good::before{content:"+ "} .tg.bad::before{content:"\\2212  "}
.site.off .art,.site.off .kv,.site.off .tags{opacity:.45}
.site.off .nm{color:color-mix(in oklab, var(--ink) 55%, var(--paper))}
.lock{margin:10px 12px 0;font-size:11.5px;font-weight:700;line-height:1.3;padding:7px 9px;border-radius:7px;background:color-mix(in oklab, var(--ink) 7%, var(--paper));color:color-mix(in oklab, var(--ink) 75%, var(--paper))}
.lock b{font-weight:900;color:var(--ink)}
.ys{padding:10px 0;border-top:1px solid color-mix(in oklab, var(--wood) 25%, transparent)}
.ys:first-of-type{border-top:0}
.ys .r1{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;font-weight:900}
.ys .r2{font-size:11.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 58%, var(--paper));margin-top:2px}
.ys .pb{height:8px;border-radius:4px;background:color-mix(in oklab, var(--ink) 9%, var(--paper));margin-top:7px;overflow:hidden}
.ys .pb i{display:block;height:100%;border-radius:4px;background:var(--teal)}
.ys .pb i.build{background:repeating-linear-gradient(90deg, var(--wood) 0 10px, color-mix(in oklab, var(--wood) 60%, var(--paper)) 10px 12px)}
.warn{display:flex;gap:7px;align-items:flex-start;margin-top:8px;font-size:11.5px;font-weight:700;line-height:1.3;color:color-mix(in oklab, var(--coral) 62%, var(--ink))}
.warn .bang{flex:none;width:17px;height:17px;border-radius:50%;background:var(--coral);color:var(--paper);display:grid;place-items:center;font-size:11px;font-weight:900}
"""


def hud(cap, ali, title, sub, prog, era, turn, cash, runway, compute):
    return f"""  <div class="hud">
    <div class="ctr cap"><div class="badge">{cap}</div><div class="tag">Capability</div></div>
    <div class="pill"><div class="t">{title}</div><div class="s">{sub}</div><div class="bar"><i style="width:{prog}%"></i></div></div>
    <div class="ctr ali"><div class="badge">{ali}</div><div class="tag">Alignment</div></div>
  </div>
  <div class="info" style="z-index:6">
    <span class="full"><span class="k">Era</span> <b>{era}</b> <span class="k">· Turn</span> <b>{turn}</b> <span class="k">of 20</span></span>
    <span class="k">Cash</span><b>{cash}</b>
    <span class="k">Runway</span><b>{runway}</b>
    <span class="k">Compute</span><b>{compute}</b>
  </div>"""


def op(name, mood, text):
    return f'<div class="op"><div class="nm">{name}<span class="mood {mood}">{mood}</span></div><q>{text}</q></div>'


def offer(mono, color, name, kind, big, unit, per, rows, chip, chip_cls, expl, sel=False):
    kv = "".join(f"<span>{k}</span><b>{v}</b>" for k, v in rows)
    pick = '<span class="pick">Selected</span>' if sel else ""
    return f"""<div class="offer{' sel' if sel else ''}">{pick}
          <div class="who"><span class="mono" style="background:{color}">{mono}</span><div><div class="nm">{name}</div><div class="kind">{kind}</div></div></div>
          <div class="big">{big}<small>{unit}</small></div><div class="per">{per}</div>
          <div class="kv">{kv}</div>
          <div class="str"><span class="chip {chip_cls}">{chip}</span><p>{expl}</p></div></div>"""


DEALS = f"""
<!-- State: #deals (era 2, sign a compute deal) -->
<div id="deals" class="ov">
  <div class="wash"></div>
{hud(27, 18, "Kestrel 2", "training run · chat model", 35, 2, 6, "$1.2B", "about 14 months", "30 units")}
  <section class="gp team2">
    <div class="hd">Team</div>
    {op("Head of Research", "eager", "Verde's order is the only way we train a large model next year.")}
    {op("CFO", "uneasy", "Take-or-pay: we pay every month, even if the chips sit idle.")}
    {op("Head of Safety", "calm", "Our 10% safety pledge grows with the fleet. Budget for it.")}
    {op("Policy and Comms", "uneasy", "Azuria's money comes with a seat on our board.")}
  </section>

  <section class="gp dlg2" role="dialog" aria-label="Sign a compute deal">
    <div class="hh"><h1>Sign a compute deal</h1>
      <div class="subt">Era 2 · The scale-up · offers change every turn</div></div>
    <div class="rule"></div>
    <div class="offers">
      {offer("V", "var(--ink)", "Verde", "Chip order", "45", " units", "your own chips",
             [("Arrives", "in 3 turns"), ("Upfront", "$189M"), ("Monthly", "$66M"), ("Term", "24 months"), ("Price", "base")],
             "No strings", "none", "Cheapest per unit. Slow, and you pay upfront.", sel=True)}
      {offer("A", "var(--sky)", "Azuria", "Cloud", "30", " units", "their data centers",
             [("Arrives", "next turn"), ("Upfront", "none"), ("Monthly", "$48M"), ("Term", "24 months"), ("Price", "1.1× base")],
             "Exclusive", "", "No other cloud deals while it runs.")}
      {offer("C", "var(--teal)", "CoreFlame", "Neocloud", "20", " units", "rented racks",
             [("Arrives", "next turn"), ("Upfront", "none"), ("Monthly", "$29M"), ("Term", "12 months"), ("Price", "base")],
             "Fragile", "", "Runs on borrowed money. It can go under.")}
      {offer("S", "var(--wood)", "Spot market", "Rent now", "10", " units", "whatever is free",
             [("Arrives", "now"), ("Upfront", "none"), ("Monthly", "$29M"), ("Term", "this turn"), ("Price", "2× base")],
             "Can be taken back", "", "Pulled first when chips run short.")}
      {offer("A", "var(--sky)", "Azuria", "Investment", "$960M", "", "for 8% of your lab",
             [("Arrives", "next turn"), ("Upfront", "none"), ("Pays", "Azuria bills"), ("Term", "24 months"), ("Board", "−3 each")],
             "Money comes back", "", "The credits only pay Azuria bills.")}
    </div>
    <div class="dfoot">
      <div class="note">Signing uses <b>1 of 2</b> moves this turn · pay <b>$189M</b> now</div>
      <div class="btn">Sign</div>
    </div>
  </section>

  <section class="gp side">
    <div class="hd">Commitments</div>
    <div class="body">
      <div class="bill"><span>Monthly bill now</span><b>$44M</b></div>
      <div class="bill" style="padding-top:0"><span>After signing, from turn 9</span><b class="after">$110M</b></div>
      <div class="stack" aria-label="Monthly bill by contract"><i class="s-old" style="flex:15"></i><i class="s-old2" style="flex:29"></i><i class="s-new" style="flex:66"></i></div>
      <div class="stk-l"><span>current contracts</span><span>new Verde order</span></div>
      <div class="ct" style="margin-top:8px"><div class="r1"><span>Starter cloud</span><span>$15M/mo</span></div>
        <div class="r2"><span>10 units</span><span>3 months left</span></div>
        <div class="acts"><span class="ghost">Scale down 30%</span><span class="ghost">Break</span></div></div>
      <div class="ct"><div class="r1"><span>Verde order</span><span>$29M/mo</span></div>
        <div class="r2"><span>20 units</span><span>15 months left</span></div>
        <div class="acts"><span class="ghost">Scale down 30%</span><span class="ghost">Break</span></div></div>
      <div class="ct new"><div class="r1"><span>Verde order (new)</span><span>$66M/mo</span></div>
        <div class="r2"><span>45 units</span><span>arrives turn 9</span></div></div>
      <div class="rw"><span>Runway now</span><b>about 14 months</b></div>
      <div class="rw" style="border-top:0;margin-top:2px;padding-top:0"><span>After signing</span><b class="bad">about 9 months</b></div>
    </div>
  </section>
</div>
"""


def site(art, name, mw, units, rows, tags, sel=False, off=False, lock=""):
    kv = "".join(f"<span>{k}</span><b>{v}</b>" for k, v in rows)
    tg = "".join(f'<span class="tg {c}">{t}</span>' for c, t in tags)
    cls = "site" + (" sel" if sel else "") + (" off" if off else "")
    pick = '<span class="pick" style="z-index:1">Selected</span>' if sel else ""
    lk = f'<div class="lock">{lock}</div>' if lock else ""
    return f"""<div class="{cls}">{pick}<div class="art">{art}</div>
        <div class="tx"><div class="nm">{name}<small>{mw}<i>{units}</i></small></div>
          <div class="kv">{kv}</div><div class="tags">{tg}</div></div>{lk}</div>"""


POWER = f"""
<!-- State: #power (era 4, power sites) -->
<div id="power" class="ov">
  <div class="wash"></div>
{hud(61, 29, "Kestrel 6", "training run · agent model", 55, 4, 14, "$9.8B", "about 6 months", "0.85 GW")}
  <section class="gp team2">
    <div class="hd">Team</div>
    {op("Head of Research", "eager", "340 MW of chips are sitting dark. We could be training on them.")}
    {op("CFO", "uneasy", "Unpowered chips still bill $292M a month.")}
    {op("Policy and Comms", "uneasy", "Another gas site and the county will fight us. Washington is lukewarm on the Gulf.")}
    {op("Head of Safety", "calm", "More power means bigger runs. Keep the safety slice at 12%.")}
  </section>

  <section class="gp dlg2" role="dialog" aria-label="Power sites">
    <div class="hh"><h1>Power sites</h1>
      <div class="subt">Era 4 · The gigawatt race · chips only run where you have power</div></div>
    <div class="rule"></div>
    <div class="meter">
      <div class="top"><div class="l"><b>0.85 GW</b> of power for <b>1.19 GW</b> of chips</div>
        <div class="r">0.34 GW unpowered · still billed $292M/mo</div></div>
      <div class="mtrack" aria-label="Power available against chips contracted">
        <div class="on" style="flex:85">Powered · 500 units</div>
        <div class="dark" style="flex:34"><span>Dark · 200 units</span></div>
        <div class="empty" style="flex:41"></div>
        <div class="line" style="left:53.1%"><em>Power line</em></div>
        <div class="fut" style="left:95.6%"><em>Red Mesa online, in 2 turns</em></div>
      </div>
      <div class="mleg"><span><i class="sw2 sw-on"></i>Chips with power</span><span><i class="sw2 sw-dark"></i>Chips without power (billed, idle)</span><span><i class="sw2 sw-fut"></i>Site arriving</span></div>
    </div>
    <div class="sec">Build a new site</div>
    <div class="sites">
      {site(gas(), "Gas turbines", "680 MW", "400 u",
            [("Ready in", "4 turns"), ("Lease", "$127M/mo"), ("Upfront", "none")],
            [("bad", "Public trust"), ("bad", "Local opposition risk")], sel=True)}
      {site(nuclear(), "Nuclear restart", "510 MW", "300 u",
            [("Ready in", "4–6 turns"), ("Lease", "$95M/mo"), ("Upfront", "none")],
            [("good", "Public trust"), ("neu", "Half of restarts slip")])}
      {site(gulf(), "Gulf campus", "600 MW", "350 u",
            [("Ready in", "2 turns"), ("Contract", "$511M/mo"), ("Upfront", "10%")],
            [("neu", "Needs US approval")], off=True,
            lock="<b>Locked.</b> Needs the US government's support. Your Policy Director reads Washington as lukewarm.")}
    </div>
    <div class="dfoot">
      <div class="note">Building uses <b>1 of 2</b> moves this turn · lease starts when it is <b>online</b></div>
      <div class="btn">Build</div>
    </div>
  </section>

  <section class="gp side">
    <div class="hd">Your sites</div>
    <div class="body">
      <div class="ys"><div class="r1"><span>Prairie · grid</span><span>850 MW</span></div>
        <div class="r2">Online since turn 13 · reserved in era 2</div>
        <div class="pb"><i style="width:100%"></i></div></div>
      <div class="ys"><div class="r1"><span>Red Mesa · gas</span><span>680 MW</span></div>
        <div class="r2">Building · 2 of 4 turns done</div>
        <div class="pb"><i class="build" style="width:50%"></i></div>
        <div class="warn"><span class="bang">!</span><span>Residents packed the town hall over Red Mesa last night.</span></div></div>
      <div class="rw"><span>Power online</span><b>0.85 GW</b></div>
      <div class="rw" style="border-top:0;margin-top:2px;padding-top:0"><span>Power in 2 turns</span><b>1.53 GW</b></div>
    </div>
  </section>
</div>
"""


CSS += """
/* era 3 queue */
.qhead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}
.qhead .l{font-size:13px;font-weight:800}
.qhead .l b{font-size:22px;font-weight:900;margin-right:4px}
.qhead .r{font-size:12px;font-weight:700;color:color-mix(in oklab, var(--ink) 60%, var(--paper))}
.supply{display:flex;height:30px;border-radius:8px;overflow:hidden;margin-bottom:4px}
.supply span{display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:900;color:var(--paper);white-space:nowrap}
.supply span+span{border-left:2px solid var(--paper)}
.g-pre{background:color-mix(in oklab, var(--ink) 72%, var(--paper))}
.g-you{background:var(--coral)}
.g-riv{background:color-mix(in oklab, var(--sky) 70%, var(--ink))}
.g-riv2{background:var(--sky)}
.slab{display:flex;justify-content:space-between;font-size:10.5px;font-weight:800;color:color-mix(in oklab, var(--ink) 58%, var(--paper));margin-bottom:10px}
.qrow{display:grid;grid-template-columns:118px 86px 1fr 76px;align-items:center;gap:10px;padding:8px 0;border-top:1px solid color-mix(in oklab, var(--wood) 22%, transparent)}
.qrow .lab{font-size:13px;font-weight:900}
.qrow .lab small{display:block;font-size:10.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 55%, var(--paper))}
.tier{justify-self:start;font-size:10.5px;font-weight:900;padding:2px 7px;border-radius:6px;text-transform:uppercase;letter-spacing:.04em}
.tier.pre{background:color-mix(in oklab, var(--ink) 80%, var(--paper));color:var(--paper)}
.tier.std{background:color-mix(in oklab, var(--ink) 9%, var(--paper));color:color-mix(in oklab, var(--ink) 70%, var(--paper))}
.tier.no{background:transparent;color:color-mix(in oklab, var(--ink) 50%, var(--paper));padding-left:0}
.ob{position:relative;height:14px;border-radius:4px;box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--ink) 28%, transparent);background:var(--paper)}
.ob i{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.qrow .got{font-size:12px;font-weight:700;text-align:right;color:color-mix(in oklab, var(--ink) 60%, var(--paper))}
.qrow .got b{font-size:14px;font-weight:900;color:var(--ink)}
.qrow.me{background:color-mix(in oklab, var(--coral) 7%, var(--paper));border-radius:8px;border-top-color:transparent;padding:8px 8px;margin:0 -8px}
.qrow.off .lab,.qrow.off .ob{opacity:.45}
.soon{display:flex;gap:7px;align-items:center;margin-top:10px;font-size:12px;font-weight:700;color:color-mix(in oklab, var(--wood) 50%, var(--ink))}
.soon .bang{flex:none;width:17px;height:17px;border-radius:50%;background:var(--wood);color:var(--paper);display:grid;place-items:center;font-size:11px;font-weight:900}
.qgrid{display:grid;grid-template-columns:1fr 250px;gap:18px;align-items:start}
.order{background:var(--paper);border:1.5px solid color-mix(in oklab, var(--ink) 12%, transparent);border-radius:11px;padding:12px 14px}
.order .t{font-size:13px;font-weight:900}
.hs{position:relative;height:10px;border-radius:5px;background:color-mix(in oklab, var(--ink) 9%, var(--paper));margin:16px 4px 6px;box-shadow:inset 0 1px 2px color-mix(in oklab, var(--ink) 14%, transparent)}
.hs i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:var(--coral)}
.hs .kn{position:absolute;top:50%;width:20px;height:26px;margin:-13px 0 0 -10px;border-radius:6px;background:var(--paper);border:2px solid color-mix(in oklab, var(--ink) 30%, transparent);box-shadow:0 2px 3px color-mix(in oklab, var(--ink) 20%, transparent)}
.hsl{display:flex;justify-content:space-between;font-size:10.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 55%, var(--paper))}
.ordv{font-size:26px;font-weight:900;margin-top:6px}
.ordv small{font-size:13px;font-weight:800;margin-left:3px}
.seg{display:grid;grid-template-columns:1fr 1fr;margin-top:10px;border-radius:9px;overflow:hidden;box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--ink) 20%, transparent)}
.seg span{text-align:center;font-size:12.5px;font-weight:900;padding:7px 0;color:color-mix(in oklab, var(--ink) 65%, var(--paper))}
.seg span.on{background:var(--wood);color:var(--paper)}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.cmp div{border-radius:8px;padding:8px 9px;font-size:11.5px;font-weight:700;line-height:1.35;color:color-mix(in oklab, var(--ink) 72%, var(--paper));background:color-mix(in oklab, var(--ink) 5%, var(--paper))}
.cmp div.on{background:color-mix(in oklab, var(--wood) 14%, var(--paper));box-shadow:inset 0 0 0 1.5px var(--wood)}
.cmp b{display:block;font-size:13px;font-weight:900;color:var(--ink);margin-bottom:2px}

/* budget dialog with compute split */
.bud h1{margin:0}
.bgrid{display:grid;grid-template-columns:330px 1fr;gap:22px;align-items:start}
.money .sliders{justify-content:space-between}
.money .sl{width:74px}
.money .track{height:112px;width:24px}
.money .track .kn{width:38px;margin-left:-19px}
.money .sl .who{display:none}
.money .sl .what{font-size:13px;margin-top:10px}
.lvl{display:grid;grid-template-columns:repeat(3,1fr);margin-top:14px;border-radius:9px;overflow:hidden;box-shadow:inset 0 0 0 1.5px color-mix(in oklab, var(--ink) 20%, transparent)}
.lvl span{text-align:center;font-size:12.5px;font-weight:900;padding:6px 0;color:color-mix(in oklab, var(--ink) 65%, var(--paper))}
.lvl span.on{background:var(--wood);color:var(--paper)}
.c-sec{background:color-mix(in oklab, var(--ink) 75%, var(--paper))} .c-pro{background:var(--wood)} .c-tal{background:var(--teal)}
.cbox{background:var(--paper);border:1.5px solid color-mix(in oklab, var(--ink) 12%, transparent);border-radius:11px;padding:12px 14px 14px}
.cbox .top{display:flex;justify-content:space-between;align-items:baseline}
.cbox .top .l{font-size:13px;font-weight:800}
.cbox .top .l b{font-size:22px;font-weight:900;margin-right:4px}
.cbox .top .r{font-size:12px;font-weight:700;color:color-mix(in oklab, var(--ink) 60%, var(--paper))}
.cbar{position:relative;display:flex;height:40px;margin:26px 0 30px;border-radius:9px}
.cbar span{display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--paper);font-size:11.5px;font-weight:900;line-height:1.1;white-space:nowrap;overflow:hidden}
.cbar span small{font-size:10.5px;font-weight:700;opacity:.9}
.cbar span:first-child{border-radius:9px 0 0 9px} .cbar span:last-of-type{border-radius:0 9px 9px 0}
.cbar span+span{border-left:2px solid var(--paper)}
.k-serve{background:color-mix(in oklab, var(--wood) 80%, var(--ink))}
.k-ctrl{background:color-mix(in oklab, var(--ink) 70%, var(--paper))}
.k-safe{background:var(--sky)}
.k-train{background:var(--coral)}
.k-idle{background:repeating-linear-gradient(135deg, var(--coral) 0 4px, color-mix(in oklab, var(--coral) 40%, var(--paper)) 4px 8px)}
.cbar .dv{position:absolute;top:-6px;bottom:-6px;width:14px;margin-left:-7px;border-radius:5px;background:var(--paper);border:2px solid color-mix(in oklab, var(--ink) 35%, transparent);box-shadow:0 2px 3px color-mix(in oklab, var(--ink) 20%, transparent)}
.cbar .mk{position:absolute;border-left:2px dashed var(--ink)}
.cbar .mk.up{top:-16px;height:14px}
.cbar .mk.dn{bottom:-16px;height:14px}
.cbar .mk em{position:absolute;font-style:normal;font-size:10.5px;font-weight:900;white-space:nowrap}
.cbar .mk.up em{top:-3px;left:5px}
.cbar .mk.dn em{bottom:-3px;left:5px}
.tgl{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-top:1px solid color-mix(in oklab, var(--wood) 22%, transparent);font-size:12.5px;font-weight:800}
.tgl small{display:block;font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 58%, var(--paper))}
.sw3{flex:none;width:38px;height:22px;border-radius:11px;position:relative;background:color-mix(in oklab, var(--ink) 16%, var(--paper))}
.sw3::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--paper);box-shadow:0 1px 2px color-mix(in oklab, var(--ink) 30%, transparent)}
.sw3.on{background:var(--teal)} .sw3.on::after{left:19px}
.mrow{display:grid;grid-template-columns:420px 1fr;gap:26px;align-items:center}
.money .sliders{justify-content:space-between}
.mside .t{font-size:13px;font-weight:900}
.mside .lvl{margin-top:8px}
.mside p{margin:12px 0 0;font-size:12.5px;font-weight:600;line-height:1.35;color:color-mix(in oklab, var(--ink) 72%, var(--paper))}
.cfoot{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.idl{background:var(--paper);color:color-mix(in oklab, var(--coral) 72%, var(--ink));padding:1px 6px;border-radius:4px;opacity:1 !important}
.ok{color:color-mix(in oklab, var(--teal) 60%, var(--ink))}
"""


def qrow(lab, sub, tier, tcls, ordered, got, color, scale=70, me=False, off=False):
    w_o = ordered / scale * 100
    w_g = got / scale * 100
    fill = f'<i style="width:{w_g:.1f}%;background:{color}"></i>' if got else ""
    cls = "qrow" + (" me" if me else "") + (" off" if off else "")
    right = f"<b>{got}</b> of {ordered}" if not off else "—"
    return f"""<div class="{cls}"><div class="lab">{lab}<small>{sub}</small></div><span class="tier {tcls}">{tier}</span>
        <div class="ob" style="width:{max(w_o, 4):.1f}%">{fill}</div><div class="got">{right}</div></div>"""


QUEUE = f"""
<!-- State: #queue (era 3, Verde allocation queue) -->
<div id="queue" class="ov">
  <div class="wash"></div>
{hud(44, 22, "Kestrel 4", "training run · reasoning model", 60, 3, 9, "$3.1B", "about 8 months", "200 units")}
  <section class="gp team2">
    <div class="hd">Team</div>
    {op("Head of Research", "eager", "We're in the standard tier. OpenBrain gets served before us.")}
    {op("CFO", "uneasy", "Prepaying ties up $315M we may need before the next round.")}
    {op("Policy and Comms", "uneasy", "Prepaying looks like racing. Washington notices.")}
    {op("Head of Safety", "calm", "Whatever arrives, 12% of it goes to safety.")}
  </section>

  <section class="gp dlg2" role="dialog" aria-label="Verde allocation queue">
    <div class="hh"><h1>Verde allocation</h1>
      <div class="subt">Era 3 · Reasoning and agents · memory chips are sold out, so Verde rations</div></div>
    <div class="rule"></div>
    <div class="qgrid">
      <div>
        <div class="qhead"><div class="l"><b>150 units</b> released this turn</div><div class="r">prepaid orders are served first</div></div>
        <div class="supply" aria-label="Who gets this turn's supply">
          <span class="g-pre" style="flex:52">OpenBrain 52</span><span class="g-you" style="flex:40">You 40</span><span class="g-riv2" style="flex:30">DeepThink 30</span><span class="g-riv" style="flex:28">Lodestar 28</span>
        </div>
        <div class="slab"><span>prepaid tier</span><span>standard tier, shared by order size</span></div>
        {qrow("OpenBrain", "speed first", "Prepaid", "pre", 52, 52, "color-mix(in oklab, var(--ink) 72%, var(--paper))")}
        {qrow("You", "Kestrel lab", "Standard", "std", 60, 40, "var(--coral)", me=True)}
        {qrow("DeepThink", "", "Standard", "std", 46, 30, "var(--sky)")}
        {qrow("Lodestar", "careful", "Standard", "std", 42, 28, "color-mix(in oklab, var(--sky) 70%, var(--ink))")}
        {qrow("Qilin", "export controls", "Can't buy", "no", 0, 0, "", off=True)}
        <div class="soon"><span class="bang">!</span><span>DeepThink will prepay next turn. Standard shares will shrink.</span></div>
      </div>
      <div class="order">
        <div class="t">Your order</div>
        <div class="ordv">60<small>units</small></div>
        <div class="hs"><i style="width:40%"></i><span class="kn" style="left:40%"></span></div>
        <div class="hsl"><span>0</span><span>150</span></div>
        <div class="seg"><span class="on">Standard</span><span>Prepaid</span></div>
        <div class="cmp">
          <div class="on"><b>Standard</b>40 now, 20 wait for next turn. No upfront.</div>
          <div><b>Prepaid</b>All 60 now. $315M upfront. Race heat rises.</div>
        </div>
        <div class="dfoot" style="margin-top:14px"><div class="note" style="font-size:12px">Uses <b>1 of 2</b> moves</div><div class="btn" style="width:110px">Order</div></div>
      </div>
    </div>
  </section>

  <section class="gp side">
    <div class="hd">Why order</div>
    <div class="body">
      <div class="ct" style="border-top:0"><div class="r1"><span>Next run (large model)</span><span>250 u</span></div>
        <div class="r2"><span>needs this much training compute</span></div></div>
      <div class="ct"><div class="r1"><span>Free for training</span><span>176 u</span></div>
        <div class="r2"><span>after serving, control and safety</span></div></div>
      <div class="rw"><span>Short by</span><b class="bad">74 units</b></div>
      <div class="rw" style="border-top:0;margin-top:2px;padding-top:0"><span>This order, standard</span><b>+40 now</b></div>
      <div class="rw" style="border-top:0;margin-top:2px;padding-top:0"><span>This order, prepaid</span><b>+60 now</b></div>
    </div>
  </section>
</div>
"""


def msl(who, what, pct, cls):
    return f"""<div class="sl"><div class="who">{who}</div>
          <div class="track"><div class="f {cls}" style="height:{pct}%"></div><div class="kn" style="bottom:{pct}%"></div></div>
          <div class="what">{what}</div><div class="pct">{pct}%</div></div>"""


SPLIT = f"""
<!-- State: #budget (era 3, budget dialog with the compute split) -->
<div id="budget" class="ov">
  <div class="wash"></div>
{hud(44, 22, "Kestrel 4", "training run · reasoning model", 60, 3, 10, "$3.0B", "about 8 months", "200 units")}
  <section class="gp team2">
    <div class="hd">Team</div>
    {op("Head of Safety", "calm", "12% keeps our 10% pledge, with a little room.")}
    {op("Head of Research", "eager", "26 units sit idle. Start a bigger run, or sell the time.")}
    {op("CFO", "uneasy", "Idle units still cost us $38M a month.")}
    {op("Policy and Comms", "calm", "Serving is covered. No outages this turn.")}
  </section>

  <section class="gp dlg2 bud" role="dialog" aria-label="Plan this turn's budget">
    <div class="hh"><h1>Plan this turn's budget</h1>
      <div class="subt">Era 3 · money for people and programs, compute for everything that runs</div></div>
    <div class="rule"></div>
    <div class="sec" style="margin-top:0">Money · $40M a month</div>
    <div class="mrow">
      <div class="money"><div class="sliders">
          {msl("Research", "Training", 35, "c-rl")}
          {msl("CISO", "Security", 15, "c-sec")}
          {msl("Product", "Product", 25, "c-pro")}
          {msl("People", "Talent", 25, "c-tal")}
      </div></div>
      <div class="mside"><div class="t">Spend level</div>
        <div class="lvl"><span>Lean</span><span class="on">Steady</span><span>Aggressive</span></div>
        <p>Money pays for people and programs. Safety work now runs on compute, below.</p></div>
    </div>
    <div class="sec">Compute · drag the handles</div>
    <div class="cbox">
      <div class="top"><div class="l"><b>200 units</b> online</div><div class="r">bill $292M a month, used or not</div></div>
      <div class="cbar" aria-label="Compute split">
        <span class="k-serve" style="flex:90">Serving<small>90 u</small></span>
        <span class="k-ctrl" style="flex:10"><small>10</small></span>
        <span class="k-safe" style="flex:24">Safety<small>24 u · 12%</small></span>
        <span class="k-train" style="flex:50">Training run<small>50 u</small></span>
        <span class="k-idle" style="flex:26"><small class="idl">idle 26 u</small></span>
        <i class="dv" style="left:45%"></i><i class="dv" style="left:62%"></i>
        <i class="mk up" style="left:45%"><em>users need 90</em></i>
        <i class="mk dn" style="left:60%"><em>pledge 10% · kept</em></i>
      </div>
      <div class="cfoot">
        <div class="mleg" style="margin-top:0;flex-wrap:wrap;gap:6px 14px;align-content:start">
          <span><i class="sw2 k-serve"></i>Serving users</span><span><i class="sw2 k-ctrl"></i>Control (internal model)</span>
          <span><i class="sw2 k-safe"></i>Safety and evals</span><span><i class="sw2 k-train"></i>Training</span><span><i class="sw2 k-idle"></i>Idle, still billed</span>
        </div>
        <div>
          <div class="tgl" style="border-top:0;padding-top:0"><span>Cover shortfalls with spot<small>if users need more than serving gets, rent it at 2.5× base</small></span><i class="sw3 on"></i></div>
          <div class="tgl"><span>Resell idle compute<small>recovers 60% of the cost of idle units</small></span><i class="sw3"></i></div>
        </div>
      </div>
    </div>
    <div class="dfoot"><div class="note">Budget changes are free · they apply from this turn</div><div class="btn">OK</div></div>
  </section>

  <section class="gp side">
    <div class="hd">This turn</div>
    <div class="body">
      <div class="bill"><span>Money spend</span><b>$40M/mo</b></div>
      <div class="bill" style="padding-top:0"><span>Compute bill</span><b>$292M/mo</b></div>
      <div class="bill" style="padding-top:0"><span>of which idle</span><b class="after">$38M/mo</b></div>
      <div class="rw"><span>Runway (CFO)</span><b>about 8 months</b></div>
      <div class="rw" style="border-top:0;margin-top:2px;padding-top:0"><span>Pledge 10%</span><b class="ok">kept at 12%</b></div>
    </div>
  </section>
</div>
"""

SCRIPTS = src[323:326]  # hash script, fit-to-window, </body></html>
out = "\n".join(head) + CSS + "</style></head>\n<body>\n" + room + "\n" + DEALS + POWER + QUEUE + SPLIT + "\n".join(SCRIPTS) + "\n"
out = out.replace("<title>Lab Office</title>", "<title>Compute Screens</title>")
# default to #deals when no hash is given
out = out.replace("var t=document.getElementById(location.hash.slice(1));",
                  "var t=document.getElementById(location.hash.slice(1)||'deals');")
(WT / "K2-compute.html").write_text(out)
print("wrote", WT / "K2-compute.html", len(out))
