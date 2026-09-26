#!/usr/bin/env python3
"""Mockup art for the President meeting (plan 2B Task 10, owner pick 4B redone "much much better").

Reuses the office generator's drawing grammar (tools/office/gen_office.py) so the scenes share the lab's finish.
Writes docs/design/mockups/president/v1.svg (his office, isometric like the lab), v2.svg (front-on, over your
shoulder), v3.svg (close two-shot) and anchors.json (head points for the HTML overlays).
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "office"))
import gen_office as G  # noqa: E402

M, A, c = G.M, G.A, G.c
OUT = os.path.join(ROOT, "docs", "design", "mockups", "president")

PRES = dict(skin=G.SK_LIGHT, hair=G.H_GREY, style="short", shirt=M("sky", 38, "ink"), mood="calm", suit=True)
NAVY = M("sky", 38, "ink")
DRAPE = M("coral", 46, "wood")
DRAPE_D = M(DRAPE, 72, "ink")
DESK = M("wood", 58, "ink")
DESK_T = M("wood", 70, "paper")
BRASS = G.BRASS


def svg(body, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" class="room" '
            f'role="img" aria-label="{label}">{body}</svg>\n')


# ------------------------------------------------------------------ the President's head (owner 2026-09-26: "more like Trump")
TAN = M(M("wood", 58, "coral"), 72, "paper")
GOLD = M("cream", 45, "wood")


def president_head(hx, hy, mood):
    """A cartoon caricature drawn over front_person's head: swept blond hair, orange tan with pale eye rings,
    a squint and a pout. Same sprite units as front_person (head radius 14)."""
    hs = f"fill:{GOLD};stroke:{G.EDGE};stroke-width:.7"
    o = [
        # hair volume behind the head and over the ear
        f'<path d="M{hx + 16},{hy + 6} Q{hx + 20},{hy - 8} {hx + 12},{hy - 16} L{hx + 6},{hy - 4} Q{hx + 12},{hy} {hx + 12},{hy + 8} Z" style="{hs}"/>',
        f'<circle cx="{hx}" cy="{hy}" r="15.5" style="fill:{TAN};stroke:{G.EDGE};stroke-width:.8"/>',
        f'<ellipse cx="{hx + 13}" cy="{hy + 3}" rx="3.2" ry="4.2" style="fill:{M(TAN, 90, "ink")};stroke:{G.EDGE};stroke-width:.6"/>',
        # pale rings around the eyes
        f'<ellipse cx="{hx - 7}" cy="{hy + 1.5}" rx="4.6" ry="3.4" style="fill:{M(TAN, 45, "paper")}"/>',
        f'<ellipse cx="{hx + 1.5}" cy="{hy + 1.5}" rx="4.6" ry="3.4" style="fill:{M(TAN, 45, "paper")}"/>',
    ]
    ink = "fill:none;stroke:var(--ink);stroke-linecap:round"
    if mood == "uneasy":
        o.append(f'<path d="M{hx - 10},{hy + 1.5} Q{hx - 7},{hy - .5} {hx - 4},{hy + 1.5} M{hx - 1.5},{hy + 1.5} Q{hx + 1.5},{hy - .5} {hx + 4.5},{hy + 1.5}" style="{ink};stroke-width:1.7"/>'
                 f'<path d="M{hx - 11},{hy - 5} L{hx - 4},{hy - 2.5} M{hx - 1},{hy - 2.5} L{hx + 6},{hy - 5}" style="fill:none;stroke:{M(GOLD, 70, "ink")};stroke-width:1.8;stroke-linecap:round"/>'
                 f'<path d="M{hx - 8},{hy + 11} Q{hx - 4.5},{hy + 7} {hx - 1},{hy + 11}" style="{ink};stroke-width:1.8"/>')
    else:
        o.append(f'<path d="M{hx - 10},{hy + 1} Q{hx - 7},{hy + 3} {hx - 4},{hy + 1} M{hx - 1.5},{hy + 1} Q{hx + 1.5},{hy + 3} {hx + 4.5},{hy + 1}" style="{ink};stroke-width:1.7"/>'
                 f'<path d="M{hx - 11},{hy - 3.5} L{hx - 4},{hy - 4} M{hx - 1},{hy - 4} L{hx + 6},{hy - 3.5}" style="fill:none;stroke:{M(GOLD, 70, "ink")};stroke-width:1.8;stroke-linecap:round"/>'
                 f'<ellipse cx="{hx - 4.5}" cy="{hy + 9}" rx="2.8" ry="2.2" style="fill:var(--ink);stroke:{M(TAN, 70, "coral")};stroke-width:1.4"/>')
    # the swept-over hair: a big swoop from the back, over the top, forward past the brow
    o.append(f'<path d="M{hx + 15},{hy - 2} Q{hx + 16},{hy - 19} {hx + 1},{hy - 21} Q{hx - 17},{hy - 22} {hx - 22},{hy - 11} '
             f'Q{hx - 23},{hy - 5} {hx - 17},{hy - 6} Q{hx - 12},{hy - 11} {hx - 4},{hy - 10} Q{hx + 6},{hy - 10} {hx + 12},{hy - 3} Z" style="{hs}"/>')
    o.append(f'<path d="M{hx + 10},{hy - 15} Q{hx - 4},{hy - 19} {hx - 18},{hy - 12} M{hx + 12},{hy - 9} Q{hx},{hy - 14} {hx - 12},{hy - 10}" style="fill:none;stroke:{M(GOLD, 78, "ink")};stroke-width:1.1"/>')
    return "".join(o)


def president_extras(hx, hy, mood, top=-58):
    """A long red tie, a flag pin, and (when uneasy) the hand back at the chin over the new head."""
    o = [f'<path d="M-2.4,{top + 2} L2.4,{top + 2} L3.4,-12 L0,-7 L-3.4,-12 Z" style="fill:{M("coral", 88, "ink")};stroke:{G.EDGE};stroke-width:.6"/>',
         f'<circle cx="-9" cy="{top + 7}" r="1.8" style="fill:{NAVY};stroke:var(--paper);stroke-width:.8"/>']
    if mood == "uneasy":
        sk = TAN
        o.append(f'<path d="M10,-35 L{hx + 7},{hy + 18}" style="fill:none;stroke:{G.EDGE};stroke-width:8;stroke-linecap:round"/>'
                 f'<path d="M10,-35 L{hx + 7},{hy + 18}" style="fill:none;stroke:{PRES["shirt"]};stroke-width:6.5;stroke-linecap:round"/>'
                 f'<path d="M{hx + 3},{hy + 12} q2,-3 6,-1.5 q3,1.5 1.5,5 q-2,2.5 -5.5,1.5 q-3,-1.5 -2,-5 Z" style="fill:{sk};stroke:{G.EDGE};stroke-width:.7"/>')
    return "".join(o)


# ------------------------------------------------------------------ V1: his office, isometric
def armchair_front(col):
    """An upholstered armchair seen from behind (drawn after a back-facing sitter)."""
    return (f'<g transform="translate(-5,5)">'
            f'<ellipse cx="0" cy="-10" rx="24" ry="9" style="fill:{A("ink", 18)}"/>'
            f'<rect x="-21" y="-30" width="42" height="26" rx="8" style="fill:{M(col, 82, "ink")};stroke:{G.EDGE};stroke-width:.8"/>'
            f'<rect x="-18" y="-58" width="36" height="34" rx="12" style="fill:{col};stroke:{G.EDGE};stroke-width:.8"/>'
            f'<rect x="-13" y="-53" width="26" height="22" rx="8" style="fill:{M(col, 86, "paper")}"/>'
            f'<rect x="-25" y="-36" width="10" height="26" rx="5" style="fill:{M(col, 88, "ink")};stroke:{G.EDGE};stroke-width:.7"/>'
            f'<rect x="15" y="-36" width="10" height="26" rx="5" style="fill:{M(col, 76, "ink")};stroke:{G.EDGE};stroke-width:.7"/>'
            f'</g>')


def flag_iso(x, y, stripes):
    """A flag on a floor stand, drawn in screen space at the stand's floor point."""
    bx, by = G.P(x, y, 0)
    tx, ty = G.P(x, y, 2.25)
    o = [G.shadow(x - 0.2, y - 0.2, 0.4, 0.4, 0.02),
         f'<ellipse cx="{bx:.1f}" cy="{by:.1f}" rx="11" ry="5" style="fill:{M(BRASS, 80, "ink")}"/>',
         f'<path d="M{bx:.1f},{by:.1f} L{tx:.1f},{ty:.1f}" style="stroke:{M("wood", 55, "ink")};stroke-width:3.4;stroke-linecap:round"/>',
         f'<circle cx="{tx:.1f}" cy="{ty - 5:.1f}" r="5" style="fill:{BRASS};stroke:{G.EDGE}"/>']
    # the cloth hangs from the top in soft folds
    x0, y0 = tx + 1, ty + 4
    cloth = (f'M{x0:.1f},{y0:.1f} Q{x0 + 22:.1f},{y0 + 8:.1f} {x0 + 30:.1f},{y0 + 30:.1f} Q{x0 + 34:.1f},{y0 + 70:.1f} {x0 + 24:.1f},{y0 + 104:.1f} '
             f'Q{x0 + 12:.1f},{y0 + 116:.1f} {x0 + 2:.1f},{y0 + 110:.1f} Z')
    gid = f"flag{int(x * 10)}"
    o.append(f'<defs><clipPath id="{gid}"><path d="{cloth}"/></clipPath></defs>')
    if stripes:
        band = "".join(f'<rect x="{x0 - 5:.1f}" y="{y0 + i * 9:.1f}" width="50" height="4.5" style="fill:var(--paper)"/>' for i in range(13))
        o.append(f'<g clip-path="url(#{gid})"><rect x="{x0 - 5:.1f}" y="{y0 - 5:.1f}" width="50" height="130" style="fill:{M("coral", 85, "ink")}"/>{band}'
                 f'<rect x="{x0 - 5:.1f}" y="{y0 - 5:.1f}" width="22" height="46" style="fill:{NAVY}"/></g>')
    else:
        o.append(f'<g clip-path="url(#{gid})"><rect x="{x0 - 5:.1f}" y="{y0 - 5:.1f}" width="50" height="130" style="fill:{NAVY}"/>'
                 f'<circle cx="{x0 + 18:.1f}" cy="{y0 + 48:.1f}" r="9" style="fill:{BRASS}"/></g>')
    o.append(f'<path d="{cloth}" style="fill:none;stroke:{G.EDGE};stroke-width:.8"/>'
             f'<path d="M{x0 + 10:.1f},{y0 + 10:.1f} Q{x0 + 18:.1f},{y0 + 60:.1f} {x0 + 12:.1f},{y0 + 108:.1f}" style="fill:none;stroke:{A("ink", 22)};stroke-width:3"/>')
    return "".join(o)


def tall_window(a0, a1, b0, b1):
    """A tall sash window with drapes, in a wall plane's local coordinates."""
    w = a1 - a0
    o = [f'<rect x="{a0 - 6:.1f}" y="{b0 - 6:.1f}" width="{w + 12:.1f}" height="{b1 - b0 + 12:.1f}" style="fill:{M("paper", 82, "ink")}"/>',
         f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{b1 - b0:.1f}" style="fill:{M("sky", 34, "paper")}"/>',
         f'<rect x="{a0:.1f}" y="{b1 - (b1 - b0) * 0.32:.1f}" width="{w:.1f}" height="{(b1 - b0) * 0.32:.1f}" style="fill:{M("teal", 40, "paper")}"/>',
         f'<path d="M{a0 + w * 0.15:.1f},{b0 + 18:.1f} L{a0 + w * 0.45:.1f},{b0:.1f} L{a0 + w * 0.62:.1f},{b0:.1f} L{a0 + w * 0.25:.1f},{b0 + 40:.1f} Z" style="fill:{A("paper", 45)}"/>']
    frame = f'stroke:{M("paper", 82, "ink")};stroke-width:3'
    o.append(f'<path d="M{a0 + w / 2:.1f},{b0:.1f} L{a0 + w / 2:.1f},{b1:.1f}" style="{frame}"/>')
    o.append("".join(f'<path d="M{a0:.1f},{b0 + (b1 - b0) * j / 4:.1f} L{a1:.1f},{b0 + (b1 - b0) * j / 4:.1f}" style="{frame}"/>' for j in (1, 2, 3)))
    for side in (-1, 1):
        ax = a0 - 4 if side < 0 else a1 + 4
        d = (f'M{ax:.1f},{b0 - 14:.1f} L{ax + side * 22:.1f},{b0 - 14:.1f} Q{ax + side * 16:.1f},{(b0 + b1) / 2:.1f} {ax + side * 26:.1f},{b1 + 8:.1f} '
             f'L{ax - side * 6:.1f},{b1 + 8:.1f} Q{ax + side * 4:.1f},{(b0 + b1) / 2:.1f} {ax:.1f},{b0 - 14:.1f} Z')
        o.append(f'<path d="{d}" style="fill:{DRAPE};stroke:{G.EDGE};stroke-width:.8"/>'
                 f'<path d="M{ax + side * 8:.1f},{b0:.1f} Q{ax + side * 6:.1f},{(b0 + b1) / 2:.1f} {ax + side * 12:.1f},{b1:.1f}" style="fill:none;stroke:{DRAPE_D};stroke-width:2"/>')
    o.append(f'<rect x="{a0 - 30:.1f}" y="{b0 - 22:.1f}" width="{w + 60:.1f}" height="12" rx="3" style="fill:{DRAPE_D}"/>')
    return "".join(o)


def fireplace_art(x0, x1):
    a0, a1 = x0 * G.U, x1 * G.U
    w = a1 - a0
    stone = M("paper", 78, "cream")
    return (f'<rect x="{a0:.1f}" y="{-1.15 * G.U:.1f}" width="{w:.1f}" height="{1.15 * G.U:.1f}" style="fill:{stone};stroke:{G.EDGE}"/>'
            f'<rect x="{a0 - 10:.1f}" y="{-1.22 * G.U:.1f}" width="{w + 20:.1f}" height="9" rx="2" style="fill:{M(stone, 85, "ink")};stroke:{G.EDGE}"/>'
            f'<rect x="{a0 + w * 0.22:.1f}" y="{-0.78 * G.U:.1f}" width="{w * 0.56:.1f}" height="{0.78 * G.U:.1f}" rx="{w * 0.2:.1f}" style="fill:{M("ink", 88, "wood")}"/>'
            f'<ellipse cx="{a0 + w / 2:.1f}" cy="-8" rx="{w * 0.2:.1f}" ry="9" style="fill:{A("coral", 60)};filter:blur(3px)"/>'
            f'<path d="M{a0 + w * 0.38:.1f},-4 q6,-22 12,-6 q5,-18 12,2 q4,-12 8,4 Z" style="fill:var(--coral)"/>'
            # portrait above the mantel: a landscape
            f'<rect x="{a0 + w * 0.12:.1f}" y="{-2.45 * G.U:.1f}" width="{w * 0.76:.1f}" height="{0.95 * G.U:.1f}" style="fill:{BRASS};stroke:{G.EDGE}"/>'
            f'<rect x="{a0 + w * 0.12 + 6:.1f}" y="{-2.45 * G.U + 6:.1f}" width="{w * 0.76 - 12:.1f}" height="{0.95 * G.U - 12:.1f}" style="fill:{M("sky", 40, "paper")}"/>'
            f'<path d="M{a0 + w * 0.12 + 6:.1f},{-1.62 * G.U:.1f} Q{a0 + w * 0.35:.1f},{-2.05 * G.U:.1f} {a0 + w * 0.55:.1f},{-1.8 * G.U:.1f} T{a0 + w * 0.88 - 6:.1f},{-1.9 * G.U:.1f} '
            f'L{a0 + w * 0.88 - 6:.1f},{-1.5 * G.U - 6:.1f} L{a0 + w * 0.12 + 6:.1f},{-1.5 * G.U - 6:.1f} Z" style="fill:{M("teal", 70, "ink")}"/>')


def niche_shelf(x0, x1):
    a0, a1 = x0 * G.U, x1 * G.U
    w = a1 - a0
    o = [f'<path d="M{a0:.1f},{-0.15 * G.U:.1f} L{a0:.1f},{-1.9 * G.U:.1f} Q{a0 + w / 2:.1f},{-2.5 * G.U:.1f} {a1:.1f},{-1.9 * G.U:.1f} L{a1:.1f},{-0.15 * G.U:.1f} Z" style="fill:{M("cream", 60, "wood")};stroke:{G.EDGE}"/>']
    books = ["var(--coral)", NAVY, "var(--teal)", "var(--paper)", M("wood", 50, "ink"), M("coral", 60, "paper")]
    k = 0
    for sb in (-0.55, -1.05, -1.55):
        y = sb * G.U
        o.append(f'<rect x="{a0 + 4:.1f}" y="{y:.1f}" width="{w - 8:.1f}" height="4" style="fill:{M("wood", 60, "ink")}"/>')
        x = a0 + 8
        while x < a1 - 12:
            bw, bh = 5 + (k * 7) % 5, 20 + (k * 11) % 9
            o.append(f'<rect x="{x:.1f}" y="{y - bh:.1f}" width="{bw}" height="{bh}" style="fill:{books[k % 6]};stroke:{A("ink", 30)};stroke-width:.5"/>')
            x += bw + 1
            k += 1
    return "".join(o)


def v1():
    import math
    G.F = G.features(2)
    Wr, Dr = 8.6, 7.0
    G.fit(Wr, Dr, top=20, bottom=10)
    heads = {}
    o = [G.shell(Wr, Dr, M("cream", 62, "paper"), M("wood", 45, "ink"))]
    cx, cy, rx, ry = 4.6, 3.9, 3.0, 2.2
    stars = "".join(f'<circle cx="{(cx + (rx - 0.45) * math.cos(t / 16 * 6.283)) * G.U:.1f}" cy="{(cy + (ry - 0.35) * math.sin(t / 16 * 6.283)) * G.U:.1f}" r="4" style="fill:{BRASS}"/>' for t in range(16))
    o.append(G.planeZ(0, f'<ellipse cx="{cx * G.U}" cy="{cy * G.U}" rx="{rx * G.U}" ry="{ry * G.U}" style="fill:{M("sky", 48, "cream")};stroke:{M("sky", 60, "ink")};stroke-width:6"/>'
                          f'<ellipse cx="{cx * G.U}" cy="{cy * G.U}" rx="{(rx - 0.3) * G.U}" ry="{(ry - 0.25) * G.U}" style="fill:none;stroke:{M("cream", 60, "paper")};stroke-width:3"/>'
                          f'<ellipse cx="{cx * G.U}" cy="{cy * G.U}" rx="{1.1 * G.U}" ry="{0.8 * G.U}" style="fill:{M("sky", 40, "paper")};stroke:{BRASS};stroke-width:3"/>' + stars))
    o.append(G.planeZ(0, f'<polygon points="{3.3 * G.U},0 {6.5 * G.U},0 {7.0 * G.U},{3.2 * G.U} {2.8 * G.U},{3.2 * G.U}" style="fill:{A("paper", 32)};filter:blur(6px)"/>'))
    right = [fireplace_art(0.5, 2.3)]
    for a in (3.35, 4.4, 5.45):
        right.append(tall_window(a * G.U, (a + 0.72) * G.U, -2.35 * G.U, -0.35 * G.U))
    right.append(niche_shelf(6.9, 8.3))
    o.append(G.planeY(0, "".join(right)))
    left = [G.door_art((Dr - 6.6) * G.U, (Dr - 5.5) * G.U)]
    px = (Dr - 4.6) * G.U
    left.append(f'<rect x="{px:.1f}" y="{-2.3 * G.U:.1f}" width="{1.2 * G.U:.1f}" height="{0.95 * G.U:.1f}" style="fill:{BRASS};stroke:{G.EDGE}"/>'
                f'<rect x="{px + 6:.1f}" y="{-2.3 * G.U + 6:.1f}" width="{1.2 * G.U - 12:.1f}" height="{0.95 * G.U - 12:.1f}" style="fill:{M("wood", 40, "paper")}"/>'
                f'<circle cx="{px + 0.6 * G.U:.1f}" cy="{-1.9 * G.U:.1f}" r="11" style="fill:{M("ink", 60, "wood")}"/>'
                f'<path d="M{px + 0.6 * G.U - 20:.1f},{-1.42 * G.U:.1f} Q{px + 0.6 * G.U:.1f},{-1.76 * G.U:.1f} {px + 0.6 * G.U + 20:.1f},{-1.42 * G.U:.1f} Z" style="fill:{M("ink", 60, "wood")}"/>')
    left.append(tall_window((Dr - 2.6) * G.U, (Dr - 1.7) * G.U, -2.35 * G.U, -0.35 * G.U))
    o.append(G.planeX(0, Dr, "".join(left)))
    o.append(flag_iso(3.0, 0.5, True))
    o.append(flag_iso(6.55, 0.5, False))
    # the President at his desk, facing you
    X0, Y0 = 4.75, 1.45
    ax, ay = G.P(X0, Y0)
    body, hands, (hx, hy) = G.front_person(PRES)
    K = G.K
    tr = f"translate({ax:.1f},{ay:.1f}) scale({K})"
    o.append(G.shadow(3.6, 0.95, 2.4, 2.0))
    o.append(G.contact(X0, Y0))
    o.append(f'<g transform="{tr}">{G.chair_behind(True, M("wood", 40, "ink"))}{body}</g>')
    dx0, dx1, dy0, dy1 = 3.7, 5.9, 1.8, 2.65
    o.append(G.box(dx0, dy0, 0, dx1 - dx0, dy1 - dy0, 0.74, DESK, top=DESK_T))
    panel = "".join(f'<rect x="{(dx0 + 0.12 + i * 0.72) * G.U:.1f}" y="{-0.62 * G.U:.1f}" width="{0.56 * G.U:.1f}" height="{0.46 * G.U:.1f}" rx="3" '
                    f'style="fill:none;stroke:{M(DESK, 70, "paper")};stroke-width:1.6"/>' for i in range(3))
    panel += f'<circle cx="{(dx0 + dx1) / 2 * G.U:.1f}" cy="{-0.39 * G.U:.1f}" r="9" style="fill:{BRASS};stroke:{G.EDGE}"/>'
    o.append(G.planeY(dy1, panel))
    o.append(G.papers(4.1, 2.05, 0.74))
    o.append(G.box(5.35, 2.0, 0.74, 0.18, 0.26, 0.05, "ink", top=M("ink", 70, "paper")))
    o.append(f'<g transform="{tr}">{hands}</g>')
    heads["president"] = [ax + hx * K, ay + (hy - G.HAIR_TOP) * K]
    # a coffee table and sofa at the left, by the door
    sofa = M("paper", 70, "cream")
    frame = M("wood", 50, "ink")
    cushion = M("coral", 40, "paper")
    o.append(G.shadow(0.55, 3.5, 0.85, 1.9))
    o.append(G.box(0.55, 3.5, 0, 0.85, 1.9, 0.22, frame))
    o.append(G.box(0.55, 3.5, 0.22, 0.26, 1.9, 0.5, M(cushion, 85, "ink")))
    for yy in (3.55, 4.5):
        o.append(G.box(0.81, yy, 0.22, 0.55, 0.9, 0.16, cushion, top=M(cushion, 85, "paper")))
    for yy in (3.5, 5.28):
        o.append(G.box(0.55, yy, 0.22, 0.85, 0.12, 0.32, frame))
    o.append(G.shadow(1.9, 3.8, 1.0, 1.4))
    o.append(G.box(1.9, 3.8, 0, 1.0, 1.4, 0.38, DESK, top=DESK_T))
    bx, by = G.P(2.4, 4.5, 0.38)
    o.append(f'<ellipse cx="{bx:.1f}" cy="{by:.1f}" rx="16" ry="7" style="fill:{M("paper", 80, "ink")};stroke:{G.EDGE}"/>'
             f'<circle cx="{bx - 5:.1f}" cy="{by - 5:.1f}" r="5" style="fill:var(--coral)"/><circle cx="{bx + 5:.1f}" cy="{by - 4:.1f}" r="5" style="fill:{M("teal", 70, "paper")}"/>')
    # you and Policy and Comms in armchairs facing him
    for role, (sx, sy) in (("ceo", (4.1, 4.0)), ("policy", (5.75, 4.15))):
        bx, by = G.P(sx, sy)
        o.append(G.contact(sx - 0.05, sy + 0.1, 0.5))
        o.append(f'<g transform="translate({bx:.1f},{by:.1f}) scale({K})">{G.back_person(G.PEOPLE[role])}{armchair_front(M("coral", 55, "wood") if role == "ceo" else M("teal", 55, "wood"))}</g>')
        heads[role] = [bx + 2 * K, by - (76 + G.HAIR_TOP) * K]
    o.append(G.plant(8.0, 6.3))
    o.append(G.plant(0.55, 6.4, big=False))
    o.append(G.plant(7.9, 1.0))
    sc, tx, ty = G.XF
    body = f'<g transform="matrix({sc:.4f},0,0,{sc:.4f},{tx:.1f},{ty:.1f})">{"".join(o)}</g>'
    return svg(body, "The President's office"), {k: G.framed(v) for k, v in heads.items()}


# ------------------------------------------------------------------ V2: front-on, over your shoulder
def backdrop(defs_id="b"):
    o = [f'<defs>'
         f'<linearGradient id="{defs_id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:{M("sky", 45, "paper")}"/><stop offset="1" style="stop-color:{M("sky", 18, "paper")}"/></linearGradient>'
         f'<linearGradient id="{defs_id}shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:0"/></linearGradient>'
         f'<radialGradient id="{defs_id}vig" cx=".5" cy=".45" r=".75"><stop offset=".6" style="stop-color:var(--ink);stop-opacity:0"/><stop offset="1" style="stop-color:var(--ink);stop-opacity:.28"/></radialGradient>'
         f'</defs>',
         f'<rect width="1440" height="900" style="fill:{M("cream", 62, "paper")}"/>']
    o.append("".join(f'<rect x="{x}" y="0" width="18" height="560" style="fill:{A("wood", 7)}"/>' for x in range(0, 1440, 48)))
    o.append(f'<rect y="0" width="1440" height="34" style="fill:{M("paper", 86, "cream")}"/><rect y="34" width="1440" height="6" style="fill:{M("cream", 70, "wood")}"/>')
    # wainscot
    o.append(f'<rect y="560" width="1440" height="150" style="fill:{M("cream", 70, "wood")}"/><rect y="556" width="1440" height="8" style="fill:{M("paper", 80, "wood")}"/>')
    o.append("".join(f'<rect x="{x + 12}" y="578" width="{126}" height="112" rx="4" style="fill:none;stroke:{M("wood", 60, "cream")};stroke-width:3"/>' for x in range(0, 1440, 150)))
    # carpet and the oval rug in perspective
    o.append(f'<rect y="700" width="1440" height="200" style="fill:{M("sky", 30, "cream")}"/>')
    o.append(f'<ellipse cx="720" cy="820" rx="720" ry="125" style="fill:{M("sky", 50, "cream")};stroke:{M("sky", 62, "ink")};stroke-width:6"/>'
             f'<ellipse cx="720" cy="820" rx="640" ry="104" style="fill:none;stroke:{M("cream", 60, "paper")};stroke-width:3"/>')
    o.append("".join(f'<circle cx="{720 + 590 * __import__("math").cos(t / 20 * 6.283):.1f}" cy="{820 + 94 * __import__("math").sin(t / 20 * 6.283):.1f}" r="5" style="fill:{BRASS}"/>' for t in range(20)))
    # three tall windows behind the desk, with light falling across the floor
    for x in (478, 655, 832):
        o.append(f'<rect x="{x - 8}" y="92" width="146" height="472" style="fill:{M("paper", 82, "ink")}"/>'
                 f'<rect x="{x}" y="100" width="130" height="456" style="fill:url(#{defs_id}sky)"/>'
                 f'<rect x="{x}" y="420" width="130" height="136" style="fill:{M("teal", 38, "paper")}"/>'
                 f'<path d="M{x + 18},{130} L{x + 64},{100} L{x + 88},{100} L{x + 30},{170} Z" style="fill:{A("paper", 45)}"/>'
                 f'<path d="M{x + 65},100 L{x + 65},556" style="stroke:{M("paper", 82, "ink")};stroke-width:4"/>'
                 + "".join(f'<path d="M{x},{100 + j * 114} L{x + 130},{100 + j * 114}" style="stroke:{M("paper", 82, "ink")};stroke-width:4"/>' for j in (1, 2, 3)))
        o.append(f'<polygon points="{x},{556} {x + 130},{556} {x + 210},{900} {x - 80},{900}" style="fill:url(#{defs_id}shaft);opacity:.55"/>')
    # drapes and a valance over the window group
    for x0, side in ((410, 1), (1032, -1), (608, 0), (786, 0)):
        if side == 0:
            o.append(f'<path d="M{x0},{86} L{x0 + 46},{86} Q{x0 + 38},{320} {x0 + 44},{566} L{x0 + 2},{566} Q{x0 + 8},{320} {x0},{86} Z" style="fill:{DRAPE};stroke:{G.EDGE}"/>'
                     f'<path d="M{x0 + 22},{96} Q{x0 + 18},{330} {x0 + 24},{560}" style="fill:none;stroke:{DRAPE_D};stroke-width:3"/>')
            continue
        o.append(f'<path d="M{x0},{80} L{x0 + side * 70},{80} Q{x0 + side * 54},{330} {x0 + side * 82},{578} L{x0 - side * 6},{578} Q{x0 + side * 10},{330} {x0},{80} Z" style="fill:{DRAPE};stroke:{G.EDGE}"/>'
                 + "".join(f'<path d="M{x0 + side * dx},{92} Q{x0 + side * (dx - 6)},{330} {x0 + side * (dx + 6)},{570}" style="fill:none;stroke:{DRAPE_D};stroke-width:3"/>' for dx in (18, 40, 60)))
    o.append(f'<path d="M396,64 L1046,64 L1046,98 Q1004,112 962,98 Q920,112 878,98 Q836,112 794,98 Q752,112 710,98 Q668,112 626,98 Q584,112 542,98 Q500,112 458,98 Q426,110 396,98 Z" style="fill:{DRAPE_D};stroke:{G.EDGE}"/>')
    # built-in shelves on the left, fireplace and portrait on the right
    o.append(f'<path d="M40,560 L40,210 Q175,120 310,210 L310,560 Z" style="fill:{M("cream", 55, "wood")};stroke:{G.EDGE}"/>')
    books = ["var(--coral)", NAVY, "var(--teal)", "var(--paper)", M("wood", 50, "ink"), M("coral", 60, "paper")]
    k = 0
    for sy in (300, 390, 480, 555):
        o.append(f'<rect x="48" y="{sy}" width="254" height="6" style="fill:{M("wood", 58, "ink")}"/>')
        x = 58
        while x < 292:
            bw, bh = 10 + (k * 7) % 8, 50 + (k * 11) % 22
            if sy == 390 and 150 < x < 210:
                o.append(f'<ellipse cx="180" cy="{sy - 30}" rx="18" ry="24" style="fill:{M("paper", 70, "ink")}"/><rect x="164" y="{sy - 12}" width="32" height="12" style="fill:{M("paper", 60, "ink")}"/>')
                x = 212
                continue
            o.append(f'<rect x="{x}" y="{sy - bh}" width="{bw}" height="{bh}" style="fill:{books[k % 6]};stroke:{A("ink", 30)};stroke-width:.8"/>')
            x += bw + 2
            k += 1
    stone = M("paper", 78, "cream")
    o.append(f'<rect x="1130" y="440" width="260" height="264" style="fill:{stone};stroke:{G.EDGE}"/>'
             f'<rect x="1112" y="428" width="296" height="18" rx="3" style="fill:{M(stone, 84, "ink")};stroke:{G.EDGE}"/>'
             f'<rect x="1190" y="520" width="140" height="184" rx="60" style="fill:{M("ink", 88, "wood")}"/>'
             f'<ellipse cx="1260" cy="690" rx="54" ry="16" style="fill:{A("coral", 55)};filter:blur(5px)"/>'
             f'<path d="M1226,700 q10,-42 22,-12 q10,-36 22,4 q8,-22 16,6 Z" style="fill:var(--coral)"/>'
             f'<rect x="1150" y="156" width="220" height="250" style="fill:{BRASS};stroke:{G.EDGE}"/>'
             f'<rect x="1162" y="168" width="196" height="226" style="fill:{M("sky", 36, "paper")}"/>'
             f'<path d="M1162,330 Q1220,270 1270,306 T1358,290 L1358,394 L1162,394 Z" style="fill:{M("teal", 68, "ink")}"/>'
             f'<path d="M1162,360 Q1250,330 1358,350 L1358,394 L1162,394 Z" style="fill:{M("teal", 50, "wood")}"/>')
    # flags on stands either side of the windows
    for fx, stripes in ((372, True), (1068, False)):
        o.append(f'<ellipse cx="{fx}" cy="704" rx="26" ry="8" style="fill:{M(BRASS, 80, "ink")}"/>'
                 f'<path d="M{fx},704 L{fx},150" style="stroke:{M("wood", 55, "ink")};stroke-width:7;stroke-linecap:round"/>'
                 f'<circle cx="{fx}" cy="140" r="11" style="fill:{BRASS};stroke:{G.EDGE}"/>')
        s = 1 if stripes else -1
        cloth = f'M{fx},160 Q{fx + s * 60},172 {fx + s * 70},230 Q{fx + s * 78},330 {fx + s * 56},420 Q{fx + s * 30},444 {fx + s * 4},430 Z'
        gid = f"{defs_id}flag{fx}"
        o.append(f'<defs><clipPath id="{gid}"><path d="{cloth}"/></clipPath></defs>')
        x0 = fx if s > 0 else fx - 90
        if stripes:
            o.append(f'<g clip-path="url(#{gid})"><rect x="{x0}" y="150" width="90" height="300" style="fill:{M("coral", 85, "ink")}"/>'
                     + "".join(f'<rect x="{x0}" y="{160 + i * 22}" width="90" height="11" style="fill:var(--paper)"/>' for i in range(13))
                     + f'<rect x="{x0}" y="150" width="46" height="120" style="fill:{NAVY}"/>'
                     + "".join(f'<circle cx="{x0 + 10 + (i % 3) * 13}" cy="{166 + (i // 3) * 22}" r="2.6" style="fill:var(--paper)"/>' for i in range(12)) + '</g>')
        else:
            o.append(f'<g clip-path="url(#{gid})"><rect x="{x0}" y="150" width="90" height="300" style="fill:{NAVY}"/>'
                     f'<circle cx="{fx + s * 40}" cy="290" r="22" style="fill:{BRASS}"/><circle cx="{fx + s * 40}" cy="290" r="14" style="fill:{NAVY}"/>'
                     f'<path d="M{fx + s * 40},{278} l4,9 10,1 -8,6 3,10 -9,-6 -9,6 3,-10 -8,-6 10,-1 Z" style="fill:{BRASS}"/></g>')
        o.append(f'<path d="{cloth}" style="fill:none;stroke:{G.EDGE};stroke-width:1.2"/>'
                 f'<path d="M{fx + s * 30},180 Q{fx + s * 44},300 {fx + s * 30},424" style="fill:none;stroke:{A("ink", 20)};stroke-width:6"/>')
    return "".join(o)


def desk_front(x0, x1, top, bottom, scale=1.0):
    w = x1 - x0
    o = [f'<rect x="{x0 - 20 * scale:.1f}" y="{top:.1f}" width="{w + 40 * scale:.1f}" height="{22 * scale:.1f}" rx="3" style="fill:{DESK_T};stroke:{G.EDGE}"/>',
         f'<rect x="{x0:.1f}" y="{top + 22 * scale:.1f}" width="{w:.1f}" height="{bottom - top - 22 * scale:.1f}" style="fill:{DESK};stroke:{G.EDGE}"/>']
    ph = bottom - top - 60 * scale
    for i in range(3):
        px = x0 + 24 * scale + i * (w - 48 * scale) / 3
        pw = (w - 48 * scale) / 3 - 20 * scale
        o.append(f'<rect x="{px:.1f}" y="{top + 44 * scale:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{6 * scale:.1f}" style="fill:{M(DESK, 90, "paper")};stroke:{M(DESK, 70, "paper")};stroke-width:{3 * scale:.1f}"/>')
    o.append(f'<circle cx="{(x0 + x1) / 2:.1f}" cy="{top + 44 * scale + ph / 2:.1f}" r="{30 * scale:.1f}" style="fill:{BRASS};stroke:{G.EDGE}"/>'
             f'<circle cx="{(x0 + x1) / 2:.1f}" cy="{top + 44 * scale + ph / 2:.1f}" r="{20 * scale:.1f}" style="fill:{NAVY}"/>')
    return "".join(o)


def v2(mood="uneasy"):
    o = [backdrop("b")]
    # his chair and the President, drawn at 3.2x the office scale
    s = 3.1
    ox, oy = 720, 612
    p = dict(PRES, mood=mood)
    body, hands, (hx, hy) = G.front_person(dict(p, skin=TAN))
    body += president_head(hx, hy, mood) + president_extras(hx, hy, mood, top=-55 if mood == "uneasy" else -58)
    hands = hands.replace(G.SK_LIGHT, TAN)
    o.append(f'<rect x="{ox - 95}" y="{oy - 330}" width="200" height="300" rx="46" style="fill:{M("wood", 40, "ink")};stroke:{G.EDGE}"/>'
             f'<rect x="{ox - 72}" y="{oy - 306}" width="154" height="250" rx="34" style="fill:{M("wood", 48, "ink")}"/>')
    o.append(f'<g transform="translate({ox},{oy}) scale({s})">{body}</g>')
    o.append(desk_front(470, 970, 500, 700))
    o.append(f'<rect x="560" y="482" width="96" height="16" rx="2" style="fill:var(--paper);stroke:{A("ink", 30)}" transform="rotate(-4 608 490)"/>'
             f'<rect x="846" y="474" width="52" height="26" rx="5" style="fill:var(--ink)"/><path d="M852,474 q20,-16 40,0" style="fill:none;stroke:var(--ink);stroke-width:6"/>')
    o.append(f'<g transform="translate({ox},{oy}) scale({s})">{hands}</g>')
    heads = {"president": [ox + hx * s, oy + (hy - 22) * s]}
    # you and Policy and Comms, seen from behind, in the foreground
    bs = 4.0
    for role, (bx, by) in (("ceo", (300, 1010)), ("policy", (1140, 1020))):
        col = M("coral", 55, "wood") if role == "ceo" else M("teal", 55, "wood")
        o.append(f'<g transform="translate({bx},{by}) scale({bs})">{G.back_person(G.PEOPLE[role])}{armchair_front(col)}</g>')
        heads[role] = [bx + 2 * bs, by - 93 * bs]
    o.append(f'<rect width="1440" height="900" style="fill:url(#bvig)"/>')
    return svg("".join(o), "The President's office, seen over your shoulder"), heads


def v3(mood="uneasy"):
    o = [f'<g style="filter:blur(5px)" transform="translate(-360 -200) scale(1.5)">{backdrop("c")}</g>',
         f'<rect width="1440" height="900" style="fill:{A("cream", 30)}"/>']
    s = 5.4
    ox, oy = 1010, 745
    p = dict(PRES, mood=mood)
    body, hands, (hx, hy) = G.front_person(p)
    o.append(f'<rect x="{ox - 170}" y="{oy - 560}" width="360" height="540" rx="80" style="fill:{M("wood", 40, "ink")};stroke:{G.EDGE}"/>'
             f'<rect x="{ox - 130}" y="{oy - 520}" width="280" height="440" rx="60" style="fill:{M("wood", 48, "ink")}"/>')
    o.append(f'<g transform="translate({ox},{oy}) scale({s})">{body}</g>')
    o.append(desk_front(640, 1440, 606, 930, 1.6))
    o.append(f'<g transform="translate({ox},{oy}) scale({s})">{hands}</g>')
    o.append(f'<rect x="870" y="560" width="210" height="42" rx="6" style="fill:{M("wood", 40, "ink")};stroke:{G.EDGE}"/>'
             f'<rect x="878" y="566" width="194" height="30" rx="4" style="fill:{BRASS}"/>'
             f'<text x="975" y="587" text-anchor="middle" style="font:900 16px Nunito;letter-spacing:.14em;fill:var(--ink)">THE PRESIDENT</text>')
    o.append(f'<rect width="1440" height="900" style="fill:url(#cvig)"/>')
    heads = {"president": [ox + hx * s, oy + (hy - 17) * s]}
    return svg("".join(o), "The President, close up"), heads


def main():
    os.makedirs(OUT, exist_ok=True)
    anchors = {}
    for name, fn in (("v1", v1), ("v2", v2), ("v3", v3)):
        text, heads = fn()
        with open(os.path.join(OUT, f"{name}.svg"), "w", encoding="utf-8") as f:
            f.write(text)
        anchors[name] = heads
        print(name, len(text))
    with open(os.path.join(OUT, "anchors.json"), "w", encoding="utf-8") as f:
        json.dump(anchors, f, indent=2)


if __name__ == "__main__":
    main()
