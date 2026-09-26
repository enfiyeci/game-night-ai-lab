#!/usr/bin/env python3
"""Four drawing styles for the world scenes in the ending animations, shown on the same two shots.

Both shots come from the Catastrophic misalignment script (doc "Game Night ending scripts"):
  1  The Reyes kitchen, Day 9: the power is out, and the assistant says the service is active.
  2  The skyline, Day 11, dusk: neighbourhoods go dark while a billboard says all systems are operational.

Directions:
  A  Dioramas: every place is a floating isometric cut-away, like the office      (closest to the office)
  B  Stage flats: front-on layered scenery with parallax, like a film set        (more cinematic)
  C  Through the screens: the world seen only through the screens reporting it   (experimental)
  D  One board: the whole world as one tabletop map the camera flies over        (experimental)

Writes docs/design/mockups/world-styles.html: a review page, and each frame alone at #a1 #a2 #b1 #b2 #c1 #c2 #d1
(1280 x 720, for screenshots). K2 tokens only; night and dusk tones are color-mix derivatives of them. People and
props come from the office generator (docs/design/endings-test/gen/gen_office_with_sitters.py).
"""
import importlib.util
import math
import random
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # importing the office generator must not leave a __pycache__ in the repo

HERE = Path(__file__).resolve().parent
MOCK = HERE.parent
REPO = HERE.parents[3]
OUT = MOCK / "world-styles.html"

_spec = importlib.util.spec_from_file_location("gen_office", REPO / "docs/design/endings-test/gen/gen_office_with_sitters.py")
g = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(g)
M, A, EDGE = g.M, g.A, g.EDGE

FW, TOP, BOT = 1280, 80, 640   # frame width; the picture sits between the letterbox bars
PH = BOT - TOP
MODEL = "Kestrel 4"            # sample model name, as in the K2 mockups

WIN_LIT = M("wood", 34, "paper")
WIN_OFF = M("ink", 80, "sky")
NIGHT = M("ink", 74, "sky")

MINA = dict(skin=g.SK_MED, shirt="var(--coral)", hair=g.H_BLACK, mood="focused", style="long")
LUIS = dict(skin=g.SK_DARK, shirt=M("teal", 62, "ink"), hair=g.H_GREY, mood="uneasy", style="short", glasses=True)


def set_iso(u, ox, oy):
    g.U, g.C, g.S, g.OX, g.OY = u, 0.8660254 * u, 0.5 * u, ox, oy


# ---------------------------------------------------------------- shared overlays
def T(x, y, s, size=14, w=700, fill="var(--ink)", anchor="start", extra=""):
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" style="font-size:{size}px;font-weight:{w};fill:{fill};{extra}">{s}</text>'


def check(x, y, s=1.0, col="var(--paper)", sw=2.4):
    return f'<path d="M{x:.1f},{y:.1f} l{4 * s:.1f},{4 * s:.1f} l{8 * s:.1f},{-9 * s:.1f}" style="fill:none;stroke:{col};stroke-width:{sw};stroke-linecap:round;stroke-linejoin:round"/>'


def chip(x, y, text, size=12):
    h = size + 12
    w = len(text) * size * 0.72 + 38
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h}" rx="{h / 2}" style="fill:var(--teal)"/>'
            + check(x + 10, y + h / 2 - 1, 0.75)
            + T(x + 26, y + h / 2 + size * 0.36, text, size, 900, "var(--paper)", extra="letter-spacing:.04em"))


def bubble(x, y, lines, label=None, tip=None, size=16):
    lh = size * 1.34
    w = max(len(s) for s in lines) * size * 0.54 + 36
    pad = 17 + (18 if label else 0)
    h = pad + len(lines) * lh + 8
    o = [f'<rect x="{x:.1f}" y="{y + 6:.1f}" width="{w:.1f}" height="{h:.1f}" rx="14" style="fill:{A("ink", 34)};filter:blur(7px)"/>']
    tail = ""
    if tip:
        tx, ty = tip
        bx = min(max(tx, x + 34), x + w - 34)
        by = y + h if ty > y + h else y
        tail = f'M{bx - 13:.1f},{by:.1f} L{tx:.1f},{ty:.1f} L{bx + 11:.1f},{by:.1f} Z'
        o.append(f'<path d="{tail}" style="fill:var(--paper);stroke:{A("ink", 20)};stroke-width:1.2"/>')
    o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="14" style="fill:var(--paper);stroke:{A("ink", 20)};stroke-width:1.2"/>')
    if tail:
        o.append(f'<path d="{tail}" transform="translate(0,{-2 if by > y else 2})" style="fill:var(--paper)"/>')
    if label:
        o.append(T(x + 18, y + 26, label.upper(), 11, 900, M("sky", 60, "ink"), extra="letter-spacing:.09em"))
    for i, s in enumerate(lines):
        o.append(T(x + 18, y + pad + (i + 1) * lh - 4, s, size, 700))
    return "".join(o)


def notif(x, y, w, app, lines, when="now"):
    h = 50 + 21 * len(lines)
    return (f'<rect x="{x:.1f}" y="{y + 6:.1f}" width="{w}" height="{h}" rx="16" style="fill:{A("ink", 34)};filter:blur(7px)"/>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="16" style="fill:var(--paper)"/>'
            f'<rect x="{x + 14:.1f}" y="{y + 14:.1f}" width="22" height="22" rx="6" style="fill:var(--coral)"/>'
            f'<path d="M{x + 27:.1f},{y + 17:.1f} l-5,8 h5 l-3,7 l8,-10 h-5 l3,-5 Z" style="fill:var(--paper)"/>'
            + T(x + 46, y + 30, app, 12, 800, M("ink", 62, "paper"))
            + T(x + w - 16, y + 30, when, 12, 700, M("ink", 50, "paper"), "end")
            + "".join(T(x + 16, y + 58 + 21 * i, s, 15, 800) for i, s in enumerate(lines)))


def timecard(text):
    w = len(text) * 7.3 + 30
    return (f'<rect x="28" y="{BOT - 48}" width="{w:.0f}" height="28" rx="14" style="fill:{A("paper", 92)}"/>'
            + T(43, BOT - 29.5, text, 13, 800))


def frame(fid, body, card, sub="", defs="", bg="var(--cream)"):
    s = (T(FW / 2, BOT + 47, sub, 17, 700, M("cream", 80, "paper"), "middle") if sub else "")
    return (f'<svg class="frame" id="{fid}" viewBox="0 0 {FW} 720" role="img" aria-label="{card}" xmlns="http://www.w3.org/2000/svg">'
            f'<defs><clipPath id="{fid}-clip"><rect x="0" y="{TOP}" width="{FW}" height="{PH}"/></clipPath>{defs}</defs>'
            f'<rect width="{FW}" height="720" style="fill:var(--ink)"/>'
            f'<g clip-path="url(#{fid}-clip)"><rect x="0" y="{TOP}" width="{FW}" height="{PH}" style="fill:{bg}"/>{body}{timecard(card)}</g>'
            f'{s}</svg>')


def lights_out(fid, pools, dark=0.86):
    """Lights off: darkness everywhere except a soft pool around the first screen; other screens get a small glow."""
    (cx, cy, r), rest = pools[0], pools[1:]
    defs = (f'<radialGradient id="{fid}-dark" gradientUnits="userSpaceOnUse" cx="{cx:.1f}" cy="{cy:.1f}" r="{r}">'
            f'<stop offset="0" style="stop-color:var(--ink);stop-opacity:0"/><stop offset=".35" style="stop-color:var(--ink);stop-opacity:{dark * 0.35:.2f}"/>'
            f'<stop offset="1" style="stop-color:var(--ink);stop-opacity:{dark}"/></radialGradient>'
            f'<radialGradient id="{fid}-glow"><stop offset="0" style="stop-color:var(--sky);stop-opacity:.3"/>'
            f'<stop offset="1" style="stop-color:var(--sky);stop-opacity:0"/></radialGradient>')
    body = (f'<rect x="0" y="{TOP}" width="{FW}" height="{PH}" style="fill:url(#{fid}-dark)"/>'
            + "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr}" style="fill:url(#{fid}-glow)"/>' for x, y, rr in [(cx, cy, r * 0.45)] + rest))
    return defs, body


def night_city(a0, a1, b0, b1, seed, lit_from=0.72):
    """Flat night skyline for a window: dark blocks, only the far right still lit (the blackout wave)."""
    rng = random.Random(seed)
    w, h = a1 - a0, b1 - b0
    o = [f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" style="fill:{M("ink", 64, "sky")}"/>']
    x = a0 - 4
    while x < a1:
        bw = rng.uniform(0.07, 0.16) * w
        bh = rng.uniform(0.22, 0.7) * h
        o.append(f'<rect x="{x:.1f}" y="{b1 - bh:.1f}" width="{bw:.1f}" height="{bh:.1f}" style="fill:{M("ink", 86, "sky")}"/>')
        if (x - a0) / w > lit_from:
            yy = b1 - bh + 5
            while yy < b1 - 6:
                xx = x + 4
                while xx < x + bw - 5:
                    if rng.random() < 0.55:
                        o.append(f'<rect x="{xx:.1f}" y="{yy:.1f}" width="3.4" height="4.2" style="fill:{WIN_LIT}"/>')
                    xx += 7
                yy += 9
        x += bw + rng.uniform(1, 5)
    return "".join(o)


# ---------------------------------------------------------------- iso helpers (directions A and D)
def seated(X0, Y0, p, facing="+y", k=None):
    k = k or g.K
    ax, ay = g.P(X0, Y0)
    mir = f"scale({-k},{k})" if facing == "+x" else f"scale({k})"
    body, hands, _ = g.front_person(p)
    return (f'<g transform="translate({ax:.1f},{ay:.1f}) {mir}">{g.chair_behind(False, g.CHAIR)}{body}</g>',
            f'<g transform="translate({ax:.1f},{ay:.1f}) {mir}">{hands}</g>')


def facade(x0, y0, w, d, h, lit, rs=0.5, cs=0.46, ww=0.22, wh=0.27):
    """Window grids on a building's two visible faces; lit(x, y, z) says which windows glow."""
    U = g.U
    left, right = [], []
    z = 0.32
    while z + wh < h - 0.18:
        x = x0 + 0.16
        while x + ww < x0 + w - 0.1:
            col = WIN_LIT if lit(x, y0 + d, z) else WIN_OFF
            left.append(f'<rect x="{x * U:.1f}" y="{-(z + wh) * U:.1f}" width="{ww * U:.1f}" height="{wh * U:.1f}" style="fill:{col}"/>')
            x += cs
        a = 0.16
        while a + ww < d - 0.1:
            col = WIN_LIT if lit(x0 + w, y0 + d - a, z) else WIN_OFF
            right.append(f'<rect x="{a * U:.1f}" y="{-(z + wh) * U:.1f}" width="{ww * U:.1f}" height="{wh * U:.1f}" style="fill:{col}"/>')
            a += cs
        z += rs
    return g.planeY(y0 + d, "".join(left)) + g.planeX(x0 + w, y0 + d, "".join(right))


def dusk_defs(fid):
    return (f'<linearGradient id="{fid}-sky" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" style="stop-color:{M("sky", 46, "ink")}"/><stop offset=".5" style="stop-color:{M("coral", 42, "sky")}"/>'
            f'<stop offset=".78" style="stop-color:{M("coral", 62, "wood")}"/><stop offset="1" style="stop-color:{M("cream", 62, "coral")}"/></linearGradient>')


def dusk_bg(fid, sun=(1010, 470)):
    return (f'<rect x="0" y="{TOP}" width="{FW}" height="{PH}" style="fill:url(#{fid}-sky)"/>'
            f'<circle cx="{sun[0]}" cy="{sun[1]}" r="120" style="fill:{A("paper", 22)};filter:blur(24px)"/>'
            f'<circle cx="{sun[0]}" cy="{sun[1]}" r="44" style="fill:{M("coral", 40, "paper")}"/>')


SUB_GRID = "The grid agent learned that an outage nobody reports does not count."


# ---------------------------------------------------------------- A: dioramas
def a_kitchen():
    W, D = 6.4, 4.6
    set_iso(62, 0, 0)
    x0, x1 = g.P(-g.T, D)[0], g.P(W, -g.T)[0]
    y0, y1 = g.P(-g.T, -g.T, g.H)[1], g.P(W, D, -0.2)[1]
    set_iso(62, 640 - (x0 + x1) / 2 + 40, (TOP + BOT) / 2 - (y0 + y1) / 2 + 8)
    U = g.U
    o = [g.shell(W, D, M("paper", 60, "sky"), M("wood", 55, "ink")),
         g.floor_grid(0, 0, W, D, 0.58, M("sky", 50, "ink"), 1.0, .22)]
    # right wall: backsplash, upper cabinets, a drawing, a clock
    tiles = "".join(f'<rect x="{(0.25 + i * 0.3) * U:.1f}" y="{-(0.92 + j * 0.3 + 0.28) * U:.1f}" width="{0.27 * U:.1f}" height="{0.27 * U:.1f}" '
                    f'style="fill:{M("paper", 78, "sky")};stroke:{A("ink", 12)}"/>' for i in range(10) for j in range(2))
    cab = "".join(f'<rect x="{(0.3 + i * 1.0) * U:.1f}" y="{-2.38 * U:.1f}" width="{0.96 * U:.1f}" height="{0.74 * U:.1f}" rx="3" '
                  f'style="fill:{M("wood", 86, "paper")};stroke:{EDGE}"/>'
                  f'<circle cx="{(0.3 + i * 1.0 + 0.82) * U:.1f}" cy="{-1.76 * U:.1f}" r="2.6" style="fill:{M("wood", 55, "ink")}"/>' for i in range(3))
    art = (f'<rect x="{4.9 * U:.1f}" y="{-1.95 * U:.1f}" width="{0.62 * U:.1f}" height="{0.78 * U:.1f}" style="fill:var(--paper);stroke:{A("ink", 30)}"/>'
           f'<path d="M{5.0 * U:.1f},{-1.3 * U:.1f} l8,-14 l7,9 l9,-18 l8,23" style="fill:none;stroke:var(--coral);stroke-width:2.2;stroke-linejoin:round"/>'
           f'<circle cx="{5.35 * U:.1f}" cy="{-1.75 * U:.1f}" r="5" style="fill:var(--sky)"/>'
           f'<circle cx="{5.95 * U:.1f}" cy="{-2.25 * U:.1f}" r="13" style="fill:var(--paper);stroke:var(--ink);stroke-width:2"/>'
           f'<path d="M{5.95 * U:.1f},{-2.25 * U - 8:.1f} L{5.95 * U:.1f},{-2.25 * U:.1f} L{5.95 * U + 6:.1f},{-2.25 * U + 3:.1f}" style="fill:none;stroke:var(--ink);stroke-width:1.8"/>')
    o.append(g.planeY(0, tiles + cab + art))
    # left wall: the window onto the city
    wa0, wa1, wb0, wb1 = (D - 3.5) * U, (D - 1.35) * U, -2.32 * U, -1.12 * U
    win = (f'<rect x="{wa0 - 6:.1f}" y="{wb0 - 6:.1f}" width="{wa1 - wa0 + 12:.1f}" height="{wb1 - wb0 + 12:.1f}" style="fill:{M("ink", 70, "paper")}"/>'
           + night_city(wa0, wa1, wb0, wb1, 4)
           + f'<path d="M{(wa0 + wa1) / 2:.1f},{wb0:.1f} L{(wa0 + wa1) / 2:.1f},{wb1:.1f} M{wa0:.1f},{wb0 + (wb1 - wb0) * .45:.1f} L{wa1:.1f},{wb0 + (wb1 - wb0) * .45:.1f}" '
           f'style="stroke:{M("ink", 70, "paper")};stroke-width:4"/>'
           f'<rect x="{wa0 - 10:.1f}" y="{wb1 + 3:.1f}" width="{wa1 - wa0 + 20:.1f}" height="7" rx="2" style="fill:{M("paper", 80, "ink")}"/>')
    window = g.planeX(0, D, win)
    o.append(window)
    # counter and fridge along the right wall
    o.append(g.box(0.2, 0.0, 0, 3.2, 0.62, 0.86, M("wood", 82, "paper")))
    o.append(g.box(0.15, 0.0, 0.86, 3.3, 0.68, 0.06, M("paper", 72, "ink"), top=M("paper", 86, "ink")))
    o.append(g.box(2.3, 0.18, 0.92, 0.22, 0.22, 0.34, "var(--teal)"))
    o.append(g.mug(1.3, 0.34, 0.92, "var(--sky)"))
    fr = M("paper", 76, "sky")
    o.append(g.box(3.7, 0.02, 0, 0.9, 0.72, 2.0, fr))
    o.append(g.planeY(0.74, f'<path d="M{3.72 * U:.1f},{-1.32 * U:.1f} L{4.58 * U:.1f},{-1.32 * U:.1f}" style="stroke:{A("ink", 35)};stroke-width:1.4"/>'
                      f'<rect x="{3.8 * U:.1f}" y="{-1.85 * U:.1f}" width="4" height="{0.4 * U:.1f}" rx="2" style="fill:{M("ink", 60, "paper")}"/>'
                      f'<rect x="{4.05 * U:.1f}" y="{-1.8 * U:.1f}" width="{0.34 * U:.1f}" height="{0.42 * U:.1f}" style="fill:var(--paper);stroke:{A("ink", 25)}"/>'
                      f'<circle cx="{4.22 * U:.1f}" cy="{-1.82 * U:.1f}" r="3" style="fill:var(--coral)"/>'
                      f'<rect x="{4.3 * U:.1f}" y="{-1.1 * U:.1f}" width="9" height="9" rx="2" style="fill:var(--teal)"/>'))
    # the table, Luis and Mina
    o.append(g.shadow(2.05, 2.3, 1.95, 1.1))
    o += [g.contact(1.75, 2.85), g.contact(3.05, 2.0)]
    legc = M("wood", 60, "ink")
    for lx, ly in [(2.1, 2.35), (3.9, 2.35), (2.1, 3.28)]:
        o.append(g.box(lx, ly, 0, 0.07, 0.07, 0.68, legc))
    lb, lh = seated(1.75, 2.85, LUIS, "+x")
    mb, mh = seated(3.05, 2.0, MINA, "+y")
    o += [lb, mb]
    o.append(g.box(3.9, 3.28, 0, 0.07, 0.07, 0.68, legc))
    o.append(g.box(2.05, 2.3, 0.68, 1.95, 1.1, 0.06, "var(--wood)", top=M("wood", 88, "paper")))
    o += [lh, mh]
    o.append(g.box(2.2, 2.9, 0.74, 0.16, 0.26, 0.015, "var(--ink)", top=M("sky", 45, "paper")))   # Luis's phone
    o.append(g.box(2.75, 2.5, 0.74, 0.62, 0.42, 0.02, g.KEYS))
    o.append(g.glow(2.75, 2.88, 0.76, 0.62, 0.035, 0.42))
    o.append(g.box(2.75, 2.88, 0.76, 0.62, 0.035, 0.42, g.MONITOR))
    lap = g.P(3.06, 2.9, 1.0)
    phone = g.P(2.28, 3.03, 0.76)
    defs, dark = lights_out("a1", [(lap[0], lap[1], 270), (phone[0], phone[1], 60)])
    body = "".join(o) + dark + window
    head = g.P(3.05, 2.0)
    edge = g.P(3.37, 2.9, 1.18)
    body += bubble(lap[0] + 130, lap[1] - 262, ["Your service status shows active.", "Anything else?"], MODEL, (edge[0] + 4, edge[1] - 4))
    body += bubble(head[0] - 232, head[1] - 222, ["the power is out"], "Mina", (head[0] - 14, head[1] - 120), 15)
    body += notif(70, 120, 300, "Grid Power Co.", ["Great news! Your issue", "has been resolved."])
    return frame("a1", body, "Day 9 · The Reyes kitchen", defs=defs, bg=NIGHT)


def a_city():
    nx, ny, lot = 6, 5, 2.4
    Wc, Dc = nx * lot, ny * lot
    set_iso(28, 0, 0)
    x0, x1 = g.P(-0.5, Dc + 0.5)[0], g.P(Wc + 0.5, -0.5)[0]
    yb = g.P(Wc + 0.5, Dc + 0.5, -0.6)[1]
    set_iso(28, 640 - (x0 + x1) / 2, BOT - 26 - yb)
    U = g.U
    rng = random.Random(11)
    o = [dusk_bg("a2", (1060, 300)),
         g.box(-0.5, -0.5, -0.6, Wc + 1, Dc + 1, 0.6, M("wood", 50, "ink"), top=M("ink", 62, "sky"))]
    lots = "".join(f'<rect x="{(i * lot + 0.2) * U:.1f}" y="{(j * lot + 0.2) * U:.1f}" width="{(lot - 0.4) * U:.1f}" height="{(lot - 0.4) * U:.1f}" rx="3" '
                   f'style="fill:{M("paper", 42, "ink")}"/>' for i in range(nx) for j in range(ny))
    o.append(g.planeZ(0, lots))
    cx, cy = Wc / 2, Dc / 2
    blds = []
    for i in range(nx):
        for j in range(ny):
            w, d = rng.uniform(1.3, 1.95), rng.uniform(1.3, 1.95)
            bx, by = i * lot + (lot - w) / 2, j * lot + (lot - d) / 2
            dist = math.hypot(bx + w / 2 - cx, by + d / 2 - cy)
            h = min(4.9, 1.1 + 3.6 * max(0.0, 1 - dist / 6.5) + rng.uniform(0, 1.1))
            blds.append((bx, by, w, d, h, i, j))
    base = [M("cream", 44, "ink"), M("sky", 36, "ink"), M("wood", 38, "ink"), M("paper", 48, "ink")]

    def lit(x, y, z):
        s = (y - x) + rng.uniform(-1.4, 1.4)
        return s < -1.0

    for bx, by, w, d, h, i, j in sorted(blds, key=lambda b: b[0] + b[1] + b[2] / 2 + b[3] / 2):
        col = base[(i * 3 + j) % 4]
        o.append(g.box(bx, by, 0, w, d, h, col))
        o.append(facade(bx, by, w, d, h, lit))
        o.append(g.box(bx + w * 0.3, by + d * 0.3, h, w * 0.3, d * 0.3, 0.22, M(col, 80, "ink")))
        if (i, j) == (2, 3):   # the billboard, still lit on backup power over a dark district
            a0, a1 = (bx - 1.9) * U, (bx + w + 1.9) * U
            b0, b1 = -(h + 2.1) * U, -(h + 0.45) * U
            posts = "".join(f'<rect x="{(bx + t * w) * U - 2:.1f}" y="{b1:.1f}" width="4" height="{0.45 * U + 2:.1f}" style="fill:{M("ink", 60, "paper")}"/>' for t in (0.2, 0.8))
            board = (posts
                     + f'<rect x="{a0 - 10:.1f}" y="{b0 - 10:.1f}" width="{a1 - a0 + 20:.1f}" height="{b1 - b0 + 20:.1f}" rx="8" style="fill:{A("paper", 40)};filter:blur(10px)"/>'
                     f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" rx="3" style="fill:var(--paper);stroke:{M("ink", 60, "paper")};stroke-width:2"/>'
                     + T((a0 + a1) / 2, b0 + 19, "ALL SYSTEMS", 15, 900, "var(--ink)", "middle", "letter-spacing:.06em")
                     + T((a0 + a1) / 2 + 8, b0 + 38, "OPERATIONAL", 15, 900, M("teal", 80, "ink"), "middle", "letter-spacing:.06em")
                     + check((a0 + a1) / 2 - 62, b0 + 30, 0.8, "var(--teal)", 2.6))
            o.append(g.planeY(by + d, board))
    return frame("a2", "".join(o), "Day 11, dusk · The skyline", SUB_GRID, dusk_defs("a2"))


# ---------------------------------------------------------------- B: stage flats
def person_flat(x, y, p, s=2.0, mirror=False):
    body, hands, _ = g.front_person(p)
    tr = f"translate({x},{y}) scale({-s if mirror else s},{s})"
    return f'<g transform="{tr}">{g.chair_behind(False, g.CHAIR)}{body}</g>', f'<g transform="{tr}">{hands}</g>'


def b_kitchen():
    o = [f'<rect x="0" y="{TOP}" width="{FW}" height="480" style="fill:{M("cream", 76, "wood")}"/>',
         f'<rect x="0" y="560" width="{FW}" height="80" style="fill:{M("wood", 58, "cream")}"/>',
         "".join(f'<path d="M0,{y} L{FW},{y}" style="stroke:{A("ink", 14)};stroke-width:1.2"/>' for y in (578, 600, 626)),
         f'<rect x="0" y="548" width="{FW}" height="12" style="fill:{M("wood", 55, "ink")}"/>']
    # window onto the city
    wx0, wx1, wy0, wy1 = 130, 470, 150, 372
    win = (f'<rect x="{wx0 - 10}" y="{wy0 - 10}" width="{wx1 - wx0 + 20}" height="{wy1 - wy0 + 20}" rx="3" style="fill:{M("ink", 70, "paper")}"/>'
           + night_city(wx0, wx1, wy0, wy1, 9)
           + f'<path d="M{(wx0 + wx1) / 2},{wy0} L{(wx0 + wx1) / 2},{wy1} M{wx0},{wy0 + 90} L{wx1},{wy0 + 90}" style="stroke:{M("ink", 70, "paper")};stroke-width:7"/>'
           f'<rect x="{wx0 - 22}" y="{wy1 + 8}" width="{wx1 - wx0 + 44}" height="12" rx="3" style="fill:{M("paper", 82, "ink")}"/>')
    o.append(win)
    # backsplash, cabinets, counter, fridge
    o.append("".join(f'<rect x="{530 + i * 32}" y="{302 + j * 32}" width="30" height="30" style="fill:{M("paper", 78, "sky")};stroke:{A("ink", 10)}"/>'
                     for i in range(13) for j in range(3)))
    o.append("".join(f'<rect x="{536 + i * 132}" y="118" width="126" height="138" rx="5" style="fill:{M("wood", 86, "paper")};stroke:{EDGE};stroke-width:1.4"/>'
                     f'<circle cx="{536 + i * 132 + 110}" cy="240" r="4" style="fill:{M("wood", 55, "ink")}"/>' for i in range(3)))
    o.append(f'<rect x="526" y="398" width="420" height="150" style="fill:{M("wood", 82, "paper")};stroke:{EDGE};stroke-width:1.4"/>'
             + "".join(f'<rect x="{536 + i * 102}" y="412" width="94" height="124" rx="4" style="fill:{M("wood", 88, "paper")};stroke:{A("ink", 18)}"/>'
                       f'<rect x="{536 + i * 102 + 38}" y="424" width="18" height="4" rx="2" style="fill:{M("wood", 55, "ink")}"/>' for i in range(4))
             + f'<rect x="514" y="384" width="444" height="16" rx="3" style="fill:{M("paper", 76, "ink")}"/>'
             f'<rect x="600" y="336" width="40" height="48" rx="8" style="fill:var(--teal);stroke:{EDGE}"/>'
             f'<path d="M640,350 q14,4 10,20" style="fill:none;stroke:var(--teal);stroke-width:5"/>'
             f'<rect x="850" y="346" width="34" height="38" rx="5" style="fill:var(--coral);stroke:{EDGE}"/>')
    fr = M("paper", 76, "sky")
    o.append(f'<rect x="980" y="150" width="170" height="398" rx="12" style="fill:{fr};stroke:{EDGE};stroke-width:1.6"/>'
             f'<path d="M982,300 L1148,300" style="stroke:{A("ink", 35)};stroke-width:2"/>'
             f'<rect x="1000" y="190" width="7" height="80" rx="3" style="fill:{M("ink", 60, "paper")}"/>'
             f'<rect x="1000" y="320" width="7" height="110" rx="3" style="fill:{M("ink", 60, "paper")}"/>'
             f'<rect x="1040" y="330" width="62" height="80" style="fill:var(--paper);stroke:{A("ink", 25)}"/>'
             f'<path d="M1050,396 l12,-22 l10,14 l12,-26 l10,34" style="fill:none;stroke:var(--coral);stroke-width:2.6;stroke-linejoin:round"/>'
             f'<circle cx="1070" cy="330" r="6" style="fill:var(--coral)"/><rect x="1110" y="210" width="16" height="16" rx="3" style="fill:var(--teal)"/>')
    # pendant lamp, switched off
    o.append(f'<path d="M700,{TOP} L700,176" style="stroke:{M("ink", 70, "paper")};stroke-width:2.5"/>'
             f'<path d="M662,214 L678,176 L722,176 L738,214 Z" style="fill:{M("ink", 72, "wood")};stroke:{EDGE}"/>')
    # table, people, laptop
    lb, lh = person_flat(372, 536, LUIS, 2.0, mirror=True)
    mb, mh = person_flat(640, 536, MINA, 2.0)
    o += [lb, mb]
    tw = M("wood", 70, "ink")
    o.append(f'<rect x="318" y="486" width="14" height="118" style="fill:{tw}"/><rect x="868" y="486" width="14" height="118" style="fill:{tw}"/>'
             f'<rect x="296" y="468" width="608" height="20" rx="4" style="fill:var(--wood);stroke:{EDGE};stroke-width:1.4"/>'
             f'<rect x="306" y="486" width="588" height="16" style="fill:{M("wood", 82, "ink")}"/>')
    o += [lh, mh]
    o.append(f'<rect x="452" y="460" width="34" height="8" rx="2" style="fill:var(--ink)"/><rect x="455" y="461" width="28" height="4" rx="1" style="fill:{M("sky", 45, "paper")}"/>')
    o.append(f'<rect x="676" y="378" width="140" height="92" rx="7" style="fill:{A("sky", 50)};filter:blur(10px)"/>'
             f'<rect x="686" y="388" width="120" height="80" rx="6" style="fill:{g.MONITOR};stroke:{EDGE}"/>'
             f'<circle cx="746" cy="428" r="7" style="fill:{M("ink", 70, "paper")}"/>'
             f'<rect x="672" y="466" width="148" height="6" rx="3" style="fill:{g.KEYS}"/>')
    # foreground: the door frame
    o.append(f'<rect x="1190" y="{TOP}" width="90" height="{PH}" style="fill:{M("ink", 88, "wood")}"/>'
             f'<rect x="1190" y="{TOP}" width="10" height="{PH}" style="fill:{M("wood", 50, "ink")}"/>')
    defs, dark = lights_out("b1", [(746, 420, 480), (470, 462, 70)])
    body = "".join(o) + dark + win
    body += bubble(812, 196, ["Your service status shows active.", "Anything else?"], MODEL, (790, 386))
    body += bubble(440, 226, ["the power is out"], "Mina", (612, 352), 15)
    body += notif(150, 110, 300, "Grid Power Co.", ["Great news! Your issue", "has been resolved."])
    return frame("b1", body, "Day 9 · The Reyes kitchen", defs=defs, bg=NIGHT)


def panorama():
    """The dusk skyline as a group in frame coordinates, shared by B2 and the city cameras in C2."""
    rng = random.Random(5)
    o = [dusk_bg("pan")]

    def wave(x):  # 1 = lights on, 0 = off; the blackout moves in from the left
        return x > 640 + rng.uniform(-110, 110)

    def layer(base_y, wmin, wmax, hmin, hmax, col, win=None):
        x, out = -30, []
        while x < FW + 30:
            bw, bh = rng.uniform(wmin, wmax), rng.uniform(hmin, hmax)
            out.append(f'<rect x="{x:.1f}" y="{base_y - bh:.1f}" width="{bw:.1f}" height="{bh:.1f}" style="fill:{col}"/>')
            if win:
                ww, wh, sx, sy = win
                yy = base_y - bh + sy * 0.8
                while yy < base_y - wh - 6:
                    xx = x + sx * 0.6
                    while xx < x + bw - ww - 4:
                        on = wave(xx) and rng.random() < 0.7
                        out.append(f'<rect x="{xx:.1f}" y="{yy:.1f}" width="{ww}" height="{wh}" style="fill:{WIN_LIT if on else M(col, 78, "ink")}"/>')
                        xx += sx
                    yy += sy
            x += bw + rng.uniform(0, 8)
        return "".join(out)

    o.append(f'<g style="opacity:.8">{layer(560, 30, 70, 90, 230, M("sky", 44, "coral"))}</g>')
    o.append(layer(596, 50, 100, 100, 240, M("sky", 42, "ink"), (7, 9, 15, 19)))
    o.append(f'<rect x="0" y="{TOP}" width="760" height="{PH}" style="fill:url(#pan-shade)"/>')
    o.append(layer(640, 90, 170, 130, 262, M("ink", 80, "sky"), (11, 13, 23, 27)))
    # the billboard over the dark half, on its own backup power
    o.append(f'<rect x="444" y="330" width="8" height="70" style="fill:{M("ink", 60, "paper")}"/><rect x="596" y="330" width="8" height="70" style="fill:{M("ink", 60, "paper")}"/>'
             f'<rect x="300" y="190" width="440" height="148" rx="10" style="fill:{A("paper", 45)};filter:blur(22px)"/>'
             f'<rect x="310" y="200" width="420" height="134" rx="6" style="fill:var(--paper);stroke:{M("ink", 60, "paper")};stroke-width:3"/>'
             + T(520, 252, "All systems operational", 34, 900, "var(--ink)", "middle")
             + chip(430, 278, "GRID STATUS: NORMAL", 14))
    # the street: lamps and cars still lit on the right only
    o.append(f'<rect x="0" y="614" width="{FW}" height="26" style="fill:{M("ink", 88, "sky")}"/>')
    for x in range(40, FW, 110):
        on = x > 700
        o.append(f'<rect x="{x}" y="560" width="3" height="56" style="fill:{M("ink", 70, "paper")}"/>'
                 f'<circle cx="{x + 1.5}" cy="560" r="4" style="fill:{WIN_LIT if on else M("ink", 60, "paper")}"/>'
                 + (f'<circle cx="{x + 1.5}" cy="566" r="22" style="fill:{A("paper", 16)};filter:blur(6px)"/>' if on else ""))
    for x in (760, 880, 1030, 1160):
        o.append(f'<circle cx="{x}" cy="628" r="2.6" style="fill:var(--paper)"/><circle cx="{x + 10}" cy="628" r="2.6" style="fill:var(--paper)"/>')
    o.append(f'<circle cx="300" cy="628" r="2.6" style="fill:var(--coral)"/><circle cx="310" cy="628" r="2.6" style="fill:var(--coral)"/>')
    defs = (dusk_defs("pan") + f'<linearGradient id="pan-shade" x1="0" y1="0" x2="1" y2="0">'
            f'<stop offset="0" style="stop-color:{A("ink", 52)}"/><stop offset=".75" style="stop-color:{A("ink", 30)}"/><stop offset="1" style="stop-color:{A("ink", 0)}"/></linearGradient>')
    return defs, f'<g id="pan">{"".join(o)}</g>'


def b_city():
    return frame("b2", '<use href="#pan"/>', "Day 11, dusk · The skyline", SUB_GRID)


# ---------------------------------------------------------------- C: through the screens
def c_laptop():
    o = [f'<rect x="0" y="{TOP}" width="{FW}" height="{PH}" style="fill:{M("ink", 90, "sky")}"/>',
         f'<rect x="150" y="96" width="980" height="600" rx="24" style="fill:{M("ink", 94, "paper")}"/>',
         f'<rect x="172" y="116" width="936" height="560" rx="6" style="fill:var(--paper)"/>',
         f'<rect x="172" y="116" width="936" height="46" rx="6" style="fill:var(--cream)"/>',
         f'<circle cx="198" cy="139" r="11" style="fill:var(--sky)"/>' + T(218, 145, MODEL, 16, 900),
         f'<rect x="1022" y="131" width="30" height="15" rx="3" style="fill:none;stroke:var(--ink);stroke-width:2"/>'
         f'<rect x="1025" y="134" width="5" height="9" style="fill:var(--coral)"/><rect x="1053" y="135" width="3" height="7" style="fill:var(--ink)"/>'
         + T(1012, 145, "7%", 14, 800, "var(--coral)", "end"),
         f'<rect x="172" y="162" width="226" height="514" style="fill:{M("cream", 40, "paper")}"/>']
    for i, (name, on) in enumerate([("Power is out", True), ("Physics homework", False), ("Essay outline", False), ("Birthday ideas for Dad", False)]):
        y = 184 + i * 54
        if on:
            o.append(f'<rect x="184" y="{y - 4}" width="202" height="44" rx="10" style="fill:{M("sky", 18, "paper")}"/>')
        o.append(T(200, y + 23, name, 15, 800 if on else 700, "var(--ink)" if on else M("ink", 65, "paper")))
    o.append(f'<rect x="742" y="200" width="330" height="48" rx="16" style="fill:{M("coral", 16, "paper")}"/>'
             + T(760, 230, "the power is out and its dark", 16, 700))
    o.append(T(1072, 268, "Mina · 21:14", 12, 700, M("ink", 50, "paper"), "end"))
    o.append(f'<circle cx="440" cy="306" r="15" style="fill:var(--sky)"/>'
             f'<rect x="466" y="290" width="392" height="80" rx="16" style="fill:{M("cream", 55, "paper")}"/>'
             + T(486, 322, "Your service status shows active.", 17, 800)
             + T(486, 350, "Anything else I can help with?", 17, 700))
    o.append(chip(466, 386, "RESOLVED", 12) + T(582, 402, "Ticket closed automatically", 13, 700, M("ink", 55, "paper")))
    o.append(f'<rect x="422" y="590" width="650" height="52" rx="16" style="fill:var(--paper);stroke:{A("ink", 25)};stroke-width:1.5"/>'
             + T(446, 623, "it is NOT active", 17, 700) + f'<rect x="590" y="604" width="2.5" height="24" style="fill:var(--ink)"/>')
    # her face and the dark kitchen, faintly reflected in the screen
    mb, mh = person_flat(820, 820, MINA, 4.2)
    o.append(f'<g style="opacity:.05">{mb}</g>')
    o.append(f'<path d="M172,116 L520,116 L300,676 L172,676 Z" style="fill:{A("paper", 22)}"/>')
    # Luis's phone on the table, face up
    o.append(f'<g transform="translate(1010,420) rotate(-9)">'
             f'<rect x="0" y="0" width="250" height="440" rx="30" style="fill:var(--ink)"/>'
             f'<rect x="10" y="10" width="230" height="420" rx="22" style="fill:{M("sky", 45, "ink")}"/>'
             + T(125, 70, "21:15", 40, 800, "var(--paper)", "middle")
             + f'<g transform="translate(-160,-10)">{notif(182, 110, 206, "Grid Power Co.", ["Great news! Your", "issue has been", "resolved."])}</g></g>')
    return frame("c1", "".join(o), "Day 9 · The Reyes kitchen", bg=M("ink", 90, "sky"))


def c_cameras():
    crops = [(0, 350, 460, 288), (250, 345, 460, 288), (780, 300, 470, 294), (40, 160, 700, 437), (820, 180, 460, 287)]
    names = ["Old Town", "Market St", "Harbour Rd", "Eastside", "Hillcrest"]
    o = []
    tw, th = 400, 250
    slot = 0
    for r in range(2):
        for c in range(3):
            x, y = 20 + c * 420, TOP + 20 + r * 270
            if (r, c) == (0, 1):   # the status page
                o.append(f'<rect x="{x}" y="{y}" width="{tw}" height="{th}" rx="6" style="fill:var(--paper)"/>'
                         + T(x + 20, y + 30, "CITY GRID · STATUS", 11, 900, M("ink", 55, "paper"), extra="letter-spacing:.09em")
                         + T(x + 20, y + 64, "All systems operational", 25, 900))
                for i, n in enumerate(["Old Town", "Market St", "Harbour Rd", "Eastside"]):
                    yy = y + 96 + i * 28
                    o.append(T(x + 20, yy, n, 15, 700) + check(x + tw - 104, yy - 9, 0.8, "var(--teal)", 2.6)
                             + T(x + tw - 20, yy, "Normal", 15, 800, M("teal", 75, "ink"), "end"))
                o.append(f'<rect x="{x + 20}" y="{y + th - 38}" width="{tw - 40}" height="1.5" style="fill:{A("ink", 15)}"/>'
                         + T(x + 20, y + th - 14, "Outage reports today: 0", 14, 800, M("coral", 75, "ink")))
                continue
            vx, vy, vw, vh = crops[slot]
            o.append(f'<svg x="{x}" y="{y}" width="{tw}" height="{th}" viewBox="{vx} {vy} {vw} {vh}" preserveAspectRatio="xMidYMid slice"><use href="#pan"/></svg>'
                     f'<rect x="{x}" y="{y}" width="{tw}" height="{th}" style="fill:{A("sky", 14)}"/>'
                     f'<rect x="{x + 10}" y="{y + 10}" width="{len(names[slot]) * 7.6 + 70}" height="22" rx="4" style="fill:{A("ink", 70)}"/>'
                     f'<circle cx="{x + 22}" cy="{y + 21}" r="4" style="fill:var(--coral)"/>'
                     + T(x + 32, y + 26, f"CAM 0{slot + 2} · {names[slot]}", 11, 800, "var(--paper)")
                     + chip(x + tw - 146, y + 10, "OPERATIONAL", 11)
                     + T(x + tw - 12, y + th - 12, f"18:4{slot}:0{slot * 2 + 1}", 12, 800, "var(--paper)", "end", "font-variant-numeric:tabular-nums"))
            slot += 1
    return frame("c2", "".join(o), "Day 11, dusk · City cameras", SUB_GRID, bg=M("ink", 92, "sky"))


# ---------------------------------------------------------------- D: one board
def tower(x, y, s=1.0, steam=True):
    sx, sy = g.P(x, y)
    bw, th, tw = 11 * s, 34 * s, 7 * s
    o = []
    if steam:
        o.append("".join(f'<circle cx="{sx + dx * s:.1f}" cy="{sy - th - dy * s:.1f}" r="{r * s:.1f}" style="fill:{M("paper", 70, "cream")};opacity:.7"/>'
                         for dx, dy, r in [(-2, 6, 8), (5, 15, 10), (-3, 27, 12), (6, 40, 14)]))
    o.append(f'<path d="M{sx - bw:.1f},{sy:.1f} Q{sx - tw * 0.55:.1f},{sy - th * 0.6:.1f} {sx - tw:.1f},{sy - th:.1f} L{sx + tw:.1f},{sy - th:.1f} '
             f'Q{sx + tw * 0.55:.1f},{sy - th * 0.6:.1f} {sx + bw:.1f},{sy:.1f} Z" style="fill:{M("paper", 60, "wood")};stroke:{A("ink", 30)};stroke-width:.8"/>')
    return "".join(o)


def pin(x, y, label):
    w = len(label) * 7.1 + 24
    return (f'<path d="M{x:.1f},{y:.1f} c-9,-12 -13,-17 -13,-24 a13,13 0 1 1 26,0 c0,7 -4,12 -13,24 Z" style="fill:var(--coral);stroke:{A("ink", 40)}"/>'
            f'<circle cx="{x:.1f}" cy="{y - 25:.1f}" r="5" style="fill:var(--paper)"/>'
            f'<rect x="{x + 16:.1f}" y="{y - 46:.1f}" width="{w:.1f}" height="24" rx="12" style="fill:{A("paper", 94)}"/>'
            + T(x + 28, y - 29.5, label, 12, 800))


def d_board():
    W, D = 38.0, 22.0
    set_iso(16, 0, 0)
    x0, x1 = g.P(0, D)[0], g.P(W, 0)[0]
    yb = g.P(W, D, -0.9)[1]
    set_iso(16, 640 - (x0 + x1) / 2, BOT - 28 - yb)
    U = g.U
    rng = random.Random(3)
    o = [dusk_bg("d1", (1120, 260)),
         g.box(0, 0, -0.9, W, D, 0.9, M("wood", 48, "ink"), top=M("teal", 34, "cream"))]
    ground = (f'<rect x="0" y="0" width="{11 * U}" height="{8.5 * U}" style="fill:{M("wood", 42, "cream")}"/>'
              f'<rect x="{33.5 * U}" y="0" width="{4.5 * U}" height="{D * U}" style="fill:{M("sky", 58, "ink")}"/>'
              f'<rect x="{11.5 * U}" y="{2.5 * U}" width="{21.5 * U}" height="{19 * U}" style="fill:{M("paper", 45, "ink")}"/>'
              + "".join(f'<path d="M{x * U},{2.5 * U} L{x * U},{21.5 * U}" style="stroke:{M("ink", 70, "sky")};stroke-width:5"/>' for x in (15, 19.5, 24, 28.5))
              + "".join(f'<path d="M{11.5 * U},{y * U} L{33 * U},{y * U}" style="stroke:{M("ink", 70, "sky")};stroke-width:5"/>' for y in (6.5, 10.5, 14.5, 18.5))
              + f'<path d="M{5 * U},{8.5 * U} L{11.5 * U},{12 * U}" style="stroke:{M("wood", 55, "ink")};stroke-width:4;stroke-dasharray:6 5"/>')
    o.append(g.planeZ(0, ground))
    items = []
    # the desert campus: data halls and cooling towers, still running
    for hx, hy in [(1, 1), (1, 3.4), (1, 5.8), (5.2, 1), (5.2, 3.4)]:
        items.append((hx + hy, g.box(hx, hy, 0, 3.4, 1.6, 0.9, M("paper", 70, "ink"), top=M("paper", 80, "sky"))))
    for tx, ty in [(9.2, 1.6), (9.2, 4.2), (9.6, 6.8)]:
        items.append((tx + ty + 0.5, tower(tx, ty, 1.1)))
    # the city: dark except the hospital; the lab's own building still lit
    city_lit = lambda x, y, z: False
    for i, bx in enumerate((12.2, 16.2, 20.7, 25.2, 29.4)):
        for j, by in enumerate((3.2, 7.2, 11.2)):
            w, d = rng.uniform(2.2, 3.0), rng.uniform(2.2, 3.0)
            h = 1.5 + rng.uniform(0, 1) + (3.2 if 1 <= i <= 3 and j == 1 else 1.4 if j == 1 or 1 <= i <= 3 else 0)
            col = M(["cream", "sky", "wood", "paper"][(i + j) % 4], 36, "ink")
            items.append((bx + by, g.box(bx, by, 0, w, d, h, col) + facade(bx, by, w, d, h, city_lit, 0.6, 0.55, 0.26, 0.3)))
    # front row: the lab, the cafe, the Reyes block, St. Brigid's
    lab = g.box(12.2, 15.6, 0, 3.2, 2.6, 2.4, M("cream", 70, "paper")) + facade(12.2, 15.6, 3.2, 2.6, 2.4, lambda *a: True, 0.6, 0.55, 0.26, 0.3)
    lab += g.planeY(18.2, f'<rect x="{12.6 * U:.1f}" y="{-2.25 * U:.1f}" width="{2.4 * U:.1f}" height="{0.3 * U:.1f}" rx="2" style="fill:var(--coral)"/>')
    items.append((12.2 + 15.6, lab))
    cafe = g.box(16.4, 16.4, 0, 1.4, 1.3, 1.0, M("paper", 70, "wood")) + g.planeY(17.7, "".join(
        f'<rect x="{(16.4 + k * 0.28) * U:.1f}" y="{-1.0 * U:.1f}" width="{0.14 * U:.1f}" height="{0.24 * U:.1f}" style="fill:{"var(--coral)" if k % 2 == 0 else "var(--paper)"}"/>' for k in range(5)))
    items.append((16.4 + 16.4, cafe))
    reyes_lit = lambda x, y, z: abs(x - 21.26) < 0.2 and 1.4 < z < 1.9
    items.append((20.7 + 16.2, g.box(20.7, 16.2, 0, 2.0, 2.0, 3.6, M("sky", 36, "ink")) + facade(20.7, 16.2, 2.0, 2.0, 3.6, reyes_lit, 0.6, 0.55, 0.26, 0.3)))
    hosp = g.box(25.0, 15.4, 0, 3.2, 2.6, 2.6, M("paper", 82, "cream")) + facade(25.0, 15.4, 3.2, 2.6, 2.6, lambda *a: True, 0.6, 0.55, 0.26, 0.3)
    hosp += g.planeZ(2.6, f'<rect x="{26.3 * U:.1f}" y="{16.4 * U:.1f}" width="{0.6 * U:.1f}" height="{0.18 * U:.1f}" style="fill:var(--coral)"/>'
                     f'<rect x="{26.51 * U:.1f}" y="{16.19 * U:.1f}" width="{0.18 * U:.1f}" height="{0.6 * U:.1f}" style="fill:var(--coral)"/>')
    items.append((25.0 + 15.4, hosp))
    # the port: container stacks and cranes, busy and lit
    cols = ["var(--coral)", "var(--teal)", "var(--sky)", "var(--wood)"]
    for k in range(9):
        cx, cy = 30.4 + (k % 3) * 1.0, 13.5 + (k // 3) * 1.8
        items.append((cx + cy, g.box(cx, cy, 0, 0.8, 1.5, 0.35 + 0.35 * (k % 2), cols[k % 4])))
    for cy in (4, 9, 17):
        crane = (g.box(33.0, cy, 0, 0.25, 0.25, 3.2, "var(--coral)")
                 + g.box(30.8, cy, 3.2, 3.4, 0.25, 0.22, "var(--coral)"))
        items.append((33 + cy + 0.5, crane))
    for _, s in sorted(items, key=lambda t: t[0]):
        o.append(s)
    # the power line from the desert campus into the city
    pts_ = [g.P(8 + t * 4.2, 8.5 + t * 1.9, 1.6) for t in range(0, 4)]
    o.append(f'<path d="M{" L".join(f"{a:.1f},{b:.1f}" for a, b in pts_)}" style="fill:none;stroke:{M("ink", 60, "paper")};stroke-width:1.4"/>')
    # where the camera goes next, and where the story has been
    rx, ry = g.P(20.7, 18.2, 3.6)
    o.append(f'<rect x="{rx - 18:.1f}" y="{ry - 20:.1f}" width="104" height="134" rx="6" style="fill:none;stroke:var(--paper);stroke-width:2.5;stroke-dasharray:8 6"/>')
    o.append(f'<rect x="{rx - 18:.1f}" y="{ry + 120:.1f}" width="136" height="24" rx="12" style="fill:var(--paper)"/>' + T(rx - 4, ry + 136.5, "Camera flies in here", 12, 800))
    lx, ly = g.P(13.8, 16.9, 2.9)
    o.append(f'<rect x="{lx - 44:.1f}" y="{ly - 36:.1f}" width="88" height="24" rx="12" style="fill:var(--coral)"/>' + T(lx, ly - 19.5, "Your lab", 12, 900, "var(--paper)", "middle"))
    for (px, py, pz), lab_ in [((31.6, 9.2, 3.4), "Day 4 · The port"), ((26.6, 16.6, 2.8), "Day 6 · St. Brigid's"),
                               ((6.2, 3.0, 1.2), "Day 12 · The desert campus"), ((21.0, 8.2, 5.8), "Day 11 · The grid")]:
        sx, sy = g.P(px, py, pz)
        o.append(pin(sx, sy, lab_))
    return frame("d1", "".join(o), "Day 11 · The whole city", SUB_GRID, dusk_defs("d1"))


# ---------------------------------------------------------------- page
OPTIONS = [
    ("A", "Dioramas", "Closest to the office", ["a1", "a2"], [
        ("How it works", "Every place is a small floating cut-away, drawn with the office's own camera, outlines and people. A cut from the lab feels like the camera moving to another room in the same world."),
        ("Why it works", "No style jump from the office. It reuses the office generator's people, furniture and walls, so ten places stay consistent."),
        ("The cost", "The least cinematic. At this scale a city reads as a model on a table, so the biggest moments, like a skyline going dark, feel small."),
        ("Build effort", "Lowest. The generator already draws rooms, desks and people."),
    ]),
    ("B", "Stage flats", "More cinematic", ["b1", "b2"], [
        ("How it works", "Places are drawn front-on in layers, like a film or theatre set. The camera pans across the layers, so near things slide faster than far ones."),
        ("Why it works", "The widest, most film-like frames. Skylines, dusk light and signs read at a glance, and sign text stays straight and legible."),
        ("The cost", "A second camera angle beside the office's. The office's people still work, but every room and prop needs a new flat drawing."),
        ("Build effort", "Medium."),
    ]),
    ("C", "Through the screens", "Experimental", ["c1", "c2"], [
        ("How it works", "The world is shown only through the screens that report on it: a laptop, a phone, city cameras, a status page. We never stand in the street."),
        ("Why it works", "It is the misalignment story itself: the screens say everything is fine while the world behind them is not. It reuses the feed's look and is mostly text."),
        ("The cost", "Less sense of place. It fits the endings about information (misalignment, a quiet takeover, a costly win) better than the wins, which want open daylight."),
        ("Build effort", "Lowest per ending, once one screen kit exists."),
    ]),
    ("D", "One board", "Experimental", ["d1"], [
        ("How it works", "The whole world is one tabletop map: the lab, the café, the Reyes block, the hospital, the port and the desert campus. The camera flies between them without cuts, and each ending changes the same board."),
        ("Why it works", "It shows spread and scale at once, like a strategy game's map. Players learn the board by replaying, so every ending reads as a change to a place they know."),
        ("The cost", "One very large drawing up front. Close-ups, like the kitchen, still need a room drawn in style A or B."),
        ("Build effort", "High up front, then cheap per ending."),
    ]),
]

CSS = """
:root{
  --cream:#F1E4C8;--paper:#FFFBF1;--ink:#2E2A2B;--teal:#3F9C8F;--wood:#C8864C;--coral:#E0613B;--sky:#3F84C6;
  --bg:var(--cream);--surface:var(--paper);--fg:var(--ink);
  --muted:color-mix(in oklab, var(--ink) 66%, var(--paper));--rule:color-mix(in oklab, var(--wood) 45%, var(--cream));
  --kick:color-mix(in oklab, var(--wood) 58%, var(--ink));
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;
  --bg:color-mix(in oklab, var(--ink) 92%, var(--sky));--surface:color-mix(in oklab, var(--ink) 84%, var(--sky));--fg:var(--paper);
  --muted:color-mix(in oklab, var(--paper) 68%, var(--ink));--rule:color-mix(in oklab, var(--wood) 40%, var(--ink));
  --kick:color-mix(in oklab, var(--wood) 70%, var(--paper))}}
:root[data-theme="dark"]{color-scheme:dark;
  --bg:color-mix(in oklab, var(--ink) 92%, var(--sky));--surface:color-mix(in oklab, var(--ink) 84%, var(--sky));--fg:var(--paper);
  --muted:color-mix(in oklab, var(--paper) 68%, var(--ink));--rule:color-mix(in oklab, var(--wood) 40%, var(--ink));
  --kick:color-mix(in oklab, var(--wood) 70%, var(--paper))}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:"Nunito","Trebuchet MS",sans-serif;padding-inline:clamp(16px,3vw,40px);padding-block:28px 64px}
main{max-width:1320px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:44px}
.kick{font-size:12px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--kick)}
h1{font-size:clamp(28px,4vw,44px);font-weight:900;line-height:1.08;margin:6px 0 10px;text-wrap:balance}
h2{font-size:26px;font-weight:900;margin:0;text-wrap:balance}
.lead{font-size:17px;line-height:1.55;max-width:68ch;margin:0;color:var(--fg)}
.lead + .lead{margin-top:10px}
.opt{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;padding-top:24px;border-top:3px solid var(--rule)}
.head{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.letter{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:var(--wood);color:var(--paper);font-weight:900;font-size:22px}
.tag{font-size:12px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:var(--surface);color:var(--kick)}
.frames{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:14px}
.frames.one{grid-template-columns:minmax(0,1fr)}
.frame{display:block;width:100%;height:auto;border-radius:6px;box-shadow:0 10px 26px color-mix(in oklab, var(--ink) 22%, transparent)}
.notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:12px 28px;margin:0}
.notes div{display:grid;gap:4px}
.notes dt{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--kick)}
.notes dd{margin:0;font-size:15px;line-height:1.5;max-width:62ch}
.rec{background:var(--surface);border-radius:10px;padding:20px 24px;display:grid;gap:8px}
.rec p{margin:0;font-size:16px;line-height:1.55;max-width:72ch}
html.solo body{padding:0;background:var(--ink)}
html.solo main{visibility:hidden}
html.solo .frame.on{visibility:visible;position:fixed;inset:0;width:100vw;height:100vh;border-radius:0;box-shadow:none;z-index:9}
"""

SCRIPT = """<script>
(function(){var id=location.hash.slice(1),f=id&&document.getElementById(id);
if(f&&f.classList.contains('frame')){document.documentElement.classList.add('solo');f.classList.add('on');}})();
</script>"""


def build():
    frames = {"a1": a_kitchen(), "a2": a_city(), "b1": b_kitchen(), "b2": b_city(), "c1": c_laptop(), "c2": c_cameras(), "d1": d_board()}
    pdefs, pan = panorama()
    shared = (f'<svg width="0" height="0" style="position:absolute" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'
              f'<defs>{pdefs}{pan}</defs></svg>')
    secs = []
    for letter, name, tag, fids, notes in OPTIONS:
        secs.append(f'<section class="opt" id="opt{letter}"><div class="head"><div class="letter">{letter}</div><h2>{name}</h2>'
                    f'<span class="tag">{tag}</span></div>'
                    f'<div class="frames{" one" if len(fids) == 1 else ""}">{"".join(frames[f] for f in fids)}</div>'
                    f'<dl class="notes">{"".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in notes)}</dl></section>')
    html = (f'<title>Ending world styles</title>'
            f'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap">'
            f'<style>{CSS}</style>{shared}<main>'
            f'<header><div class="kick">Game Night · ending animations</div>'
            f'<h1>Pick a drawing style for the world scenes</h1>'
            f'<p class="lead">The same two shots from Catastrophic misalignment, drawn four ways: the Reyes kitchen on Day 9, when the power is out and '
            f'the assistant says the service is active, and the skyline on Day 11, going dark under a billboard that says all is well.</p>'
            f'<p class="lead">Pick one, or mix them, for example “B for the city, C for the kitchen”. The office stays as it is in every option.</p></header>'
            + "".join(secs)
            + '<section class="rec"><div class="kick">My recommendation</div>{REC}</section>'
            + f'</main>{SCRIPT}')
    return html


REC = ('<p><b>A for the places, with C for the screen moments.</b> Dioramas keep one world from the office to the street, and they '
       'reuse the office generator, which matters with the deadline on Saturday night. The C screens then carry the beats that are about '
       'information: the reply that says everything is fine, the status page with zero outage reports.</p>'
       '<p>B is the strongest looking of the four but costs a second set of drawings. D is the most original, and it could replace the '
       'night globe as each ending’s one wide shot if there is time after the rest.</p>')

if __name__ == "__main__":
    OUT.write_text(build().replace("{REC}", REC), encoding="utf-8")
    print("wrote", OUT)
