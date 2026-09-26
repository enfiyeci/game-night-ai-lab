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
from gen_president import (  # noqa: E402
    BRASS, DESK, DESK_T, DRAPE, DRAPE_D, GOLD, GOLD_D, GOLD_HI, LIP, NAVY, PRES, TAN, TAN_D,
    armchair_front, backdrop, desk_front, president_extras, president_head, v2,
)

M, A, c = G.M, G.A, G.c
OUT = os.path.join(ROOT, "docs", "design", "mockups", "president")

def svg(body, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" class="room" '
            f'role="img" aria-label="{label}">{body}</svg>\n')


# ------------------------------------------------------------------ V1: his office, isometric

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


# ------------------------------------------------------------------ V3: close two-shot

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
