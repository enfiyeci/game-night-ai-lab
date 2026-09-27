#!/usr/bin/env python3
"""Generator for the game's office art (from the K2 mockup generator, docs/design/mockups/source/gen_K2.py).

With no arguments it writes ui/assets/office.svg (the K2 room only: no HUD, bubbles or markers) and
ui/assets/anchors.json (head, rack and floor-menu points in the 1440 x 900 frame). --era N writes
office-eraN.svg and anchors-eraN.json; --all writes the K2 files, all five eras and tools/eras.html.
The lab moves as the game goes on: a loft (era 1), the K2 office (eras 2-3), its own building (eras 4-5).
"""
import argparse
import json
import os

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

U = 62.0
C = 0.8660254 * U
S = 0.5 * U
OX, OY = 666.0, 262.0
K2_OX, K2_OY = OX, OY
XF = (1.0, 0.0, 0.0)  # scale and shift applied to a premises that does not use the K2 camera
W, D, H, T = 11.0, 9.0, 2.7, 0.22
K = 1.3  # character sprite scale (cartoon proportions, bigger than furniture)

TOK = {"cream", "paper", "ink", "teal", "wood", "coral", "sky"}


def c(n):
    return f"var(--{n})" if n in TOK else n


def M(a, p, b):
    return f"color-mix(in oklab, {c(a)} {p}%, {c(b)})"


def A(a, p):  # token with alpha
    return f"color-mix(in oklab, {c(a)} {p}%, transparent)"


EDGE = A("ink", 30)


def P(x, y, z=0.0):
    return (OX + (x - y) * C, OY + (x + y) * S - z * U)


def pts(ps):
    return " ".join(f"{a:.1f},{b:.1f}" for a, b in ps)


def poly(ps, fill, stroke=EDGE, sw=0.8, extra=""):
    s = f"fill:{c(fill)};"
    if stroke:
        s += f"stroke:{stroke};stroke-width:{sw};stroke-linejoin:round;"
    return f'<polygon points="{pts(ps)}" style="{s}" {extra}/>'


def box(x, y, z, w, d, h, base, top=None, left=None, right=None, stroke=EDGE):
    t = top or c(base)
    l = left or M(base, 88, "ink")
    r = right or M(base, 72, "ink")
    return "".join([
        poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], l, stroke),
        poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], r, stroke),
        poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], t, stroke),
    ])


def planeY(y0, inner):  # face at y=y0; local a = x*U, b = -z*U
    return f'<g transform="matrix(0.8660254,0.5,0,1,{OX - y0 * C:.2f},{OY + y0 * S:.2f})">{inner}</g>'


def planeX(x0, yref, inner):  # face at x=x0; local a = (yref-y)*U, b = -z*U
    return f'<g transform="matrix(0.8660254,-0.5,0,1,{OX + (x0 - yref) * C:.2f},{OY + (x0 + yref) * S:.2f})">{inner}</g>'


def planeZ(z0, inner):  # floor-parallel plane; local (x*U, y*U). Floor decor lets clicks through to #floor.
    return f'<g pointer-events="none" transform="matrix(0.8660254,0.5,-0.8660254,0.5,{OX:.2f},{OY - z0 * U:.2f})">{inner}</g>'


def st(fill, stroke=None, sw=None, extra=""):
    s = f"fill:{c(fill)};"
    if stroke:
        s += f"stroke:{c(stroke)};"
    if sw is not None:
        s += f"stroke-width:{sw};"
    return s + extra


def shadow(x, y, w, d, grow=0.12):
    return planeZ(0, f'<rect x="{(x - grow) * U:.1f}" y="{(y - grow) * U:.1f}" width="{(w + 2 * grow) * U:.1f}" '
                     f'height="{(d + 2 * grow) * U:.1f}" rx="14" style="fill:{A("ink", 15)};filter:blur(3px)"/>')


# ---------------------------------------------------------------- palette derivatives
SK_LIGHT = M("wood", 26, "paper")
SK_MED = M("wood", 62, "paper")
SK_DARK = M("wood", 70, "ink")
H_BLACK = M("ink", 92, "wood")
H_BROWN = M("wood", 50, "ink")
H_AUBURN = M("coral", 58, "ink")
H_GREY = M("paper", 64, "ink")
CHAIR = M("ink", 80, "sky")
LEAF1 = M("teal", 72, "ink")
LEAF2 = M("teal", 62, "wood")
LEAF3 = M("teal", 85, "paper")
POT = M("coral", 62, "wood")
MONITOR = M("ink", 82, "paper")
SCREEN = M("ink", 80, "sky")
KEYS = M("paper", 84, "ink")
LEG = M("ink", 55, "paper")
TABLE = M("paper", 78, "cream")
FOLD_CHAIR = M("paper", 55, "ink")
BRASS = M("wood", 72, "paper")
ROBOT = M("paper", 84, "ink")


# ---------------------------------------------------------------- eras
ERA_NAMES = {1: "Chat assistants", 2: "The scale-up", 3: "Reasoning and agents", 4: "The gigawatt race",
             5: "Self-improvement and pacing"}


def features(era):
    """What the lab holds in an era. The lab moves, as in Game Dev Tycoon: a small rented loft (era 1), the K2 office
    (era 2), the same office renovated with a glass evals room (era 3), then its own tech-park building (eras 4-5).
    None is the approved K2 still."""
    e = 2 if era is None else era
    return dict(
        gid="" if era is None else f"era{era}-",  # gradient-id prefix, so several era SVGs can share one page
        premises="loft" if e == 1 else "office" if e <= 3 else "building",
        folding=e == 1, hot=e == 5, empty_researchers=e == 5, invite=e == 4, accord=e == 5,
        doom=e == 5,  # era 5: an orange smoke-haze day outside, a protest at the gates, the lab on the news
        racks=([(6.9, 7.9, 1.45)] if e == 1 else [(8.7, 9.7, 2.35), (9.8, 10.8, 2.35)] if e == 2
               else [(8.1, 8.96, 2.35), (9.02, 9.88, 2.35), (9.94, 10.8, 2.35)] if e == 3  # slimmer racks clear the board
               else [(11.6, 12.6, 2.35), (12.7, 13.7, 2.35), (13.8, 14.8, 2.35)]),
        # read by the K2 office scene only (eras 2-3); the loft and the building draw their own dressing
        lounge=e in (2, 3), plants=e >= 2, constitution=e >= 3,
        whiteboard="k2" if e <= 2 else "chains",
        funding=era in (2, 3), wall_screen=e == 3, bell=e == 3, evals_room=e == 3, paint=e == 3,
    )


F = features(None)


# ---------------------------------------------------------------- people
def face(hx, hy, mood, glasses=False):
    o = []
    ex1, ex2 = hx - 7, hx + 1
    ey = hy + 1
    if mood in ("uneasy", "alarmed"):
        ey += 1
    o.append(f'<ellipse cx="{ex1}" cy="{ey}" rx="2" ry="2.6" style="fill:var(--ink)"/>')
    o.append(f'<ellipse cx="{ex2}" cy="{ey}" rx="2" ry="2.6" style="fill:var(--ink)"/>')
    o.append(f'<circle cx="{ex1 + .7}" cy="{ey - .9}" r=".7" style="fill:var(--paper)"/><circle cx="{ex2 + .7}" cy="{ey - .9}" r=".7" style="fill:var(--paper)"/>')
    bs = f"fill:none;stroke:{H_BLACK};stroke-width:1.4;stroke-linecap:round"
    if mood in ("uneasy", "alarmed"):
        o.append(f'<path d="M{hx - 11},{hy - 2.5} L{hx - 5},{hy - 7}" style="{bs};stroke-width:1.6"/>')
        o.append(f'<path d="M{hx - 1},{hy - 7} L{hx + 5},{hy - 2.5}" style="{bs};stroke-width:1.6"/>')
        if mood == "alarmed":
            o.append(f'<ellipse cx="{hx - 4.5}" cy="{hy + 9}" rx="2.6" ry="3.2" style="fill:var(--ink)"/>')
        else:
            o.append(f'<path d="M{hx - 9},{hy + 10} q1.5,-2.6 3,0 t3,0 t3,0" style="fill:none;stroke:var(--ink);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"/>')
    else:
        o.append(f'<path d="M{hx - 10},{hy - 5} L{hx - 5},{hy - 5.5}" style="{bs}"/>')
        o.append(f'<path d="M{hx - 1},{hy - 5.5} L{hx + 4},{hy - 5}" style="{bs}"/>')
        if mood == "happy":
            o.append(f'<path d="M{hx - 9},{hy + 6} Q{hx - 4.5},{hy + 13} {hx},{hy + 6} Z" style="fill:var(--ink)"/>')
            o.append(f'<ellipse cx="{hx - 11}" cy="{hy + 6}" rx="3" ry="1.8" style="fill:{A("coral", 40)}"/>')
        elif mood == "focused":
            o.append(f'<path d="M{hx - 8},{hy + 8} L{hx - 2},{hy + 7.5}" style="fill:none;stroke:var(--ink);stroke-width:1.5;stroke-linecap:round"/>')
        else:
            o.append(f'<path d="M{hx - 8.5},{hy + 6.5} Q{hx - 4.5},{hy + 11} {hx - 0.5},{hy + 6.5}" style="fill:none;stroke:var(--ink);stroke-width:1.6;stroke-linecap:round"/>')
            o.append(f'<ellipse cx="{hx - 11}" cy="{hy + 5.5}" rx="2.6" ry="1.6" style="fill:{A("coral", 30)}"/>')
    if glasses:
        gs = "fill:none;stroke:var(--ink);stroke-width:1.2"
        o.append(f'<circle cx="{ex1}" cy="{ey}" r="3.8" style="{gs}"/><circle cx="{ex2}" cy="{ey}" r="3.8" style="{gs}"/>'
                 f'<path d="M{ex1 + 3.8},{ey} L{ex2 - 3.8},{ey} M{ex2 + 3.8},{ey - 1} L{hx + 11},{ey - 2}" style="{gs}"/>')
    return "".join(o)


def sweat_drop(dx, dy, s=1.0):
    return (f'<path d="M{dx},{dy - 7 * s:.1f} Q{dx + 5 * s:.1f},{dy + s:.1f} {dx},{dy + 4 * s:.1f} Q{dx - 5 * s:.1f},{dy + s:.1f} {dx},{dy - 7 * s:.1f} Z" '
            f'style="fill:{M("sky", 45, "paper")};stroke:{M("sky", 70, "ink")};stroke-width:.8"/>')


def mood_faces(hx, hy, glasses=False):
    """An advisor's three swappable faces; only calm shows until the game sets a mood."""
    drop = sweat_drop(hx + 17, hy - 10)
    return (f'<g class="face face-calm">{face(hx, hy, "calm", glasses)}</g>'
            f'<g class="face face-uneasy" display="none">{face(hx, hy, "uneasy", glasses)}{drop}</g>'
            f'<g class="face face-alarmed" display="none">{face(hx, hy, "alarmed", glasses)}{drop}{sweat_drop(hx + 18, hy + 4, 0.75)}</g>')


def hair_front(style, hx, hy, col):
    s = f"fill:{col};stroke:{EDGE};stroke-width:.7"
    cap = (f'<path d="M{hx - 14.5},{hy} Q{hx - 16},{hy - 17} {hx},{hy - 17.5} Q{hx + 16},{hy - 17} {hx + 15},{hy + 3} '
           f'L{hx + 11},{hy + 4} Q{hx + 10},{hy - 6} {hx + 3},{hy - 8} Q{hx - 6},{hy - 10} {hx - 14.5},{hy} Z" style="{s}"/>')
    if style == "short":
        return cap
    if style == "bun":
        return f'<circle cx="{hx + 8}" cy="{hy - 17}" r="7" style="{s}"/>' + cap
    if style == "curly":
        return "".join(f'<circle cx="{hx + dx}" cy="{hy + dy}" r="{r}" style="{s}"/>' for dx, dy, r in
                       [(-12, -6, 5.5), (-8, -13, 6), (0, -16, 6.5), (8, -14, 6.5), (13, -7, 6), (14, 1, 5.5), (11, 7, 4.5)])
    if style == "bald":
        return (f'<path d="M{hx + 6},{hy - 8} Q{hx + 16},{hy - 6} {hx + 14},{hy + 7} L{hx + 10},{hy + 6} Q{hx + 11},{hy - 3} {hx + 5},{hy - 5} Z" style="{s}"/>'
                f'<path d="M{hx - 14},{hy - 1} Q{hx - 13},{hy - 7} {hx - 10},{hy - 8} L{hx - 11},{hy - 1} Z" style="{s}"/>')
    if style == "long":
        return cap
    if style == "bob":
        return (cap + f'<path d="M{hx + 9},{hy - 4} Q{hx + 18},{hy} {hx + 16},{hy + 13} L{hx + 8},{hy + 12} Z" style="{s}"/>')
    return cap


def front_person(p):
    """Seated character facing down-left (toward viewer). Returns (body, hands, over_head_y)."""
    sk, sh, hr, mood = p["skin"], p["shirt"], p["hair"], p["mood"]
    hunch = mood == "uneasy"
    hx, hy = (-3, -72) if hunch else (-1, -76)
    body = []
    if p["style"] == "long":
        body.append(f'<path d="M{hx - 8},{hy - 10} Q{hx + 20},{hy - 18} {hx + 18},{hy + 8} L{hx + 17},{hy + 27} '
                    f'Q{hx + 7},{hy + 31} {hx - 2},{hy + 22} Z" style="fill:{hr};stroke:{EDGE};stroke-width:.7"/>')
    # upper arms (behind torso edges)
    arm = f"fill:none;stroke:{sh};stroke-width:8.5;stroke-linecap:round"
    arm_e = f"fill:none;stroke:{EDGE};stroke-width:10;stroke-linecap:round"
    lpath = "M-12,-51 Q-21,-44 -22,-36"
    rpath = "M12,-51 Q17,-42 10,-35" if hunch else "M12,-51 Q15,-41 7,-34"
    body.append(f'<path d="{lpath}" style="{arm_e}"/><path d="{lpath}" style="{arm}"/>')
    body.append(f'<path d="{rpath}" style="{arm_e}"/><path d="{rpath}" style="{arm}"/>')
    # torso
    top = -55 if hunch else -58
    body.append(f'<path d="M-14,-22 L-16,{top + 10} Q-15,{top + 1} -5,{top} L6,{top} Q15,{top + 1} 16,{top + 10} L14,-22 Z" '
                f'style="fill:{sh};stroke:{EDGE};stroke-width:.8"/>')
    body.append(f'<path d="M7,{top} Q15,{top + 1} 16,{top + 10} L14,-22 L8,-22 Z" style="fill:{M(sh, 84, "ink")}"/>')
    if p.get("suit"):
        body.append(f'<path d="M-5,{top} L0,{top + 13} L5,{top} Z" style="fill:var(--paper)"/>'
                    f'<path d="M-1.6,{top + 2} L1.6,{top + 2} L2.6,{top + 20} L0,{top + 24} L-2.6,{top + 20} Z" style="fill:var(--coral)"/>'
                    f'<path d="M-5,{top} L-1,{top + 18} M5,{top} L1,{top + 18}" style="fill:none;stroke:{M(sh, 70, "ink")};stroke-width:1.2"/>')
    elif p.get("collar"):
        body.append(f'<path d="M-6,{top} L0,{top + 7} L6,{top} L3,{top + 1} L0,{top + 4} L-3,{top + 1} Z" style="fill:{p["collar"]}"/>')
    # neck + head
    body.append(f'<rect x="{hx - 4}" y="{hy + 9}" width="8" height="{top - hy - 7}" rx="3" style="fill:{M(sk, 85, "ink")}"/>')
    body.append(f'<circle cx="{hx}" cy="{hy}" r="14" style="fill:{sk};stroke:{EDGE};stroke-width:.8"/>')
    body.append(hair_front(p["style"], hx, hy, hr))
    body.append(f'<ellipse cx="{hx + 12}" cy="{hy + 2}" rx="3" ry="4" style="fill:{M(sk, 92, "ink")};stroke:{EDGE};stroke-width:.6"/>')
    body.append(mood_faces(hx, hy, p.get("glasses")) if p.get("advisor") else face(hx, hy, mood, p.get("glasses")))
    if p.get("headset"):
        body.append(f'<path d="M{hx - 12},{hy - 6} Q{hx},{hy - 22} {hx + 13},{hy - 4}" style="fill:none;stroke:var(--ink);stroke-width:2.2"/>'
                    f'<rect x="{hx + 10}" y="{hy - 4}" width="6" height="9" rx="2.5" style="fill:var(--ink)"/>'
                    f'<path d="M{hx + 12},{hy + 5} Q{hx + 6},{hy + 14} {hx - 4},{hy + 11}" style="fill:none;stroke:var(--ink);stroke-width:1.3"/>')
    # hands / forearms (drawn after desk)
    hands = []
    fa = f"fill:none;stroke:{sh};stroke-width:7.5;stroke-linecap:round"
    fae = f"fill:none;stroke:{EDGE};stroke-width:9;stroke-linecap:round"
    lf = "M-22,-36 Q-30,-33 -34,-33"
    hands.append(f'<path d="{lf}" style="{fae}"/><path d="{lf}" style="{fa}"/>'
                 f'<circle cx="-36" cy="-33" r="4.2" style="fill:{sk};stroke:{EDGE};stroke-width:.7"/>')
    if hunch:
        # hand raised to the chin: the uneasy tell
        rf = f"M10,-35 L{hx + 7},{hy + 18}"
        fa2 = f"fill:none;stroke:{sh};stroke-width:6.5;stroke-linecap:round"
        fae2 = f"fill:none;stroke:{EDGE};stroke-width:8;stroke-linecap:round"
        body.append(f'<path d="{rf}" style="{fae2}"/><path d="{rf}" style="{fa2}"/>'
                    f'<path d="M{hx + 3},{hy + 12} q2,-3 6,-1.5 q3,1.5 1.5,5 q-2,2.5 -5.5,1.5 q-3,-1.5 -2,-5 Z" style="fill:{sk};stroke:{EDGE};stroke-width:.7"/>')
        # sweat drop (shape, not colour)
        dx, dy = hx + 17, hy - 10
        body.append(f'<path d="M{dx},{dy - 7} Q{dx + 5},{dy + 1} {dx},{dy + 4} Q{dx - 5},{dy + 1} {dx},{dy - 7} Z" '
                    f'style="fill:{M("sky", 45, "paper")};stroke:{M("sky", 70, "ink")};stroke-width:.8"/>')
    else:
        rf = "M7,-34 Q-8,-27 -19,-25"
        hands.append(f'<path d="{rf}" style="{fae}"/><path d="{rf}" style="{fa}"/>'
                     f'<circle cx="-20" cy="-25" r="4.2" style="fill:{sk};stroke:{EDGE};stroke-width:.7"/>')
    return "".join(body), "".join(hands), (hx, hy)


def back_person(p):
    """Seated character seen from behind, facing up-right toward the back wall."""
    sk, sh, hr = p["skin"], p["shirt"], p["hair"]
    hx, hy = 2, -76
    o = []
    arm = f"fill:none;stroke:{sh};stroke-width:8.5;stroke-linecap:round"
    arm_e = f"fill:none;stroke:{EDGE};stroke-width:10;stroke-linecap:round"
    for d in ("M-13,-51 Q-20,-42 -13,-37", "M14,-51 Q21,-45 18,-40"):
        o.append(f'<path d="{d}" style="{arm_e}"/><path d="{d}" style="{arm}"/>')
    o.append(f'<path d="M-15,-22 L-16,-48 Q-15,-57 -5,-58 L7,-58 Q16,-57 17,-48 L16,-22 Z" style="fill:{sh};stroke:{EDGE};stroke-width:.8"/>')
    o.append(f'<path d="M-15,-22 L-16,-48 Q-15,-57 -8,-58 L-6,-22 Z" style="fill:{M(sh, 86, "ink")}"/>')
    if p.get("hood"):
        o.append(f'<path d="M-9,-60 Q{hx},-48 13,-60 Q14,-50 {hx},-45 Q-10,-50 -9,-60 Z" style="fill:{M(sh, 80, "ink")}"/>')
    o.append(f'<rect x="{hx - 4}" y="{hy + 9}" width="8" height="10" rx="3" style="fill:{M(sk, 85, "ink")}"/>')
    o.append(f'<circle cx="{hx}" cy="{hy}" r="14" style="fill:{sk};stroke:{EDGE};stroke-width:.8"/>')
    o.append(f'<ellipse cx="{hx - 13}" cy="{hy + 3}" rx="2.8" ry="4" style="fill:{M(sk, 92, "ink")};stroke:{EDGE};stroke-width:.6"/>')
    hs = f"fill:{hr};stroke:{EDGE};stroke-width:.7"
    o.append(f'<path d="M{hx - 14.5},{hy + 1} Q{hx - 16},{hy - 17} {hx},{hy - 17} Q{hx + 16},{hy - 16} {hx + 15},{hy + 3} '
             f'Q{hx + 14},{hy + 12} {hx + 4},{hy + 13} Q{hx - 6},{hy + 12} {hx - 10},{hy + 6} Q{hx - 11},{hy} {hx - 14.5},{hy + 1} Z" style="{hs}"/>')
    if p.get("ponytail"):
        o.append(f'<path d="M{hx + 2},{hy + 8} Q{hx + 12},{hy + 16} {hx + 6},{hy + 28} Q{hx - 2},{hy + 18} {hx + 2},{hy + 8} Z" style="{hs}"/>'
                 f'<circle cx="{hx + 3}" cy="{hy + 9}" r="2.4" style="fill:var(--coral)"/>')
    if p.get("headphones"):
        o.append(f'<path d="M{hx - 15},{hy + 2} Q{hx - 3},{hy - 24} {hx + 15},{hy}" style="fill:none;stroke:var(--ink);stroke-width:3"/>'
                 f'<rect x="{hx - 19}" y="{hy - 3}" width="7" height="11" rx="3" style="fill:var(--coral)"/>'
                 f'<rect x="{hx + 12}" y="{hy - 5}" width="7" height="11" rx="3" style="fill:var(--coral)"/>')
    return "".join(o)


def chair_behind(big=False, col=CHAIR):
    """Chair back seen behind a front-facing sitter."""
    h = 70 if big else 52
    return (f'<ellipse cx="2" cy="-24" rx="18" ry="7" style="fill:{M(col, 80, "ink")}"/>'
            f'<rect x="-11" y="{-30 - h + 4}" width="30" height="{h}" rx="9" style="fill:{col};stroke:{EDGE};stroke-width:.8"/>'
            f'<rect x="-6" y="{-30 - h + 9}" width="20" height="{h - 14}" rx="6" style="fill:{M(col, 82, "paper")}"/>')


def chair_front(col=CHAIR):
    """Chair seen from behind, in front of a back-facing sitter (drawn after the body)."""
    if F["folding"]:
        leg = f"stroke:{LEG};stroke-width:2.6;stroke-linecap:round"
        return (f'<g transform="translate(-5,5)">'
                f'<path d="M-12,-20 L-14,2 M12,-20 L14,2 M-9,-22 L-10,-2 M9,-22 L10,-2" style="{leg}"/>'
                f'<ellipse cx="0" cy="-20" rx="16" ry="6" style="fill:{M(FOLD_CHAIR, 88, "ink")};stroke:{EDGE};stroke-width:.8"/>'
                f'<rect x="-14" y="-46" width="28" height="18" rx="5" style="fill:{FOLD_CHAIR};stroke:{EDGE};stroke-width:.8"/>'
                f'<path d="M-11,-28 L-12,-20 M11,-28 L12,-20" style="{leg}"/></g>')
    return (f'<g transform="translate(-5,5)">'
            f'<path d="M0,-18 L0,-6" style="stroke:{M(col, 70, "ink")};stroke-width:4"/>'
            + "".join(f'<path d="M0,-4 L{dx},{dy}" style="stroke:{M(col, 70, "ink")};stroke-width:3;stroke-linecap:round"/>'
                      f'<circle cx="{dx}" cy="{dy + 1.5}" r="2.4" style="fill:var(--ink)"/>'
                      for dx, dy in [(-14, 0), (13, -1), (-8, 5), (9, 5), (1, -8)])
            + f'<ellipse cx="0" cy="-20" rx="18" ry="7" style="fill:{M(col, 88, "ink")};stroke:{EDGE};stroke-width:.8"/>'
            f'<rect x="-15" y="-50" width="30" height="30" rx="8" style="fill:{col};stroke:{EDGE};stroke-width:.8"/>'
            f'<rect x="-11" y="-46" width="22" height="19" rx="5" style="fill:{M(col, 88, "paper")}"/>'
            f'</g>')


def folding_table(x0, x1, y0, y1):
    """Era 1: a light plastic folding table on thin metal legs, top at the usual desk height."""
    i, t = 0.05, 0.04
    legs = sorted([(x0 + i, y0 + i), (x1 - i - t, y0 + i), (x0 + i, y1 - i - t), (x1 - i - t, y1 - i - t)], key=lambda q: q[0] + q[1])
    o = [box(x, y, 0, t, t, 0.7, LEG) for x, y in legs]
    o.append(box(x0, y0, 0.7, x1 - x0, y1 - y0, 0.04, TABLE, top=M(TABLE, 80, "paper")))
    return "".join(o)


# ---------------------------------------------------------------- props
def mug(x, y, z, col):
    sx, sy = P(x, y, z)
    return (f'<g transform="translate({sx:.1f},{sy:.1f})">'
            f'<path d="M4,-9 q5,0 5,4 q0,4 -5,4" style="fill:none;stroke:{col};stroke-width:1.6"/>'
            f'<rect x="-4.5" y="-10" width="9" height="10" rx="2" style="fill:{col};stroke:{EDGE};stroke-width:.6"/>'
            f'<ellipse cx="0" cy="-10" rx="4.5" ry="1.8" style="fill:{M(col, 60, "ink")}"/></g>')


def papers(x, y, z, w=0.32, d=0.24):
    return box(x, y, z, w, d, 0.012, "paper", stroke=A("ink", 20))


def plant(x, y, big=True, pot=POT):
    s = 0.46 if big else 0.3
    ph = 0.42 if big else 0.28
    o = [shadow(x - s / 2, y - s / 2, s, s, 0.05)]
    o.append(box(x - s / 2, y - s / 2, 0, s, s, ph, pot))
    sx, sy = P(x, y, ph)
    k = 1.0 if big else 0.65
    leaves = [(-60, 30, LEAF1), (-25, 36, LEAF2), (10, 34, LEAF1), (45, 30, LEAF2), (-80, 22, LEAF3),
              (75, 22, LEAF3), (-40, 26, LEAF3), (28, 28, LEAF3), (0, 40, LEAF2)]
    g = [f'<g transform="translate({sx:.1f},{sy:.1f}) scale({k})">',
         f'<ellipse cx="0" cy="0" rx="{s * U * 0.42:.1f}" ry="{s * U * 0.2:.1f}" style="fill:{M("wood", 45, "ink")}"/>']
    for ang, ln, col in leaves:
        g.append(f'<ellipse cx="0" cy="{-ln / 2:.1f}" rx="{ln * 0.2:.1f}" ry="{ln / 2:.1f}" transform="rotate({ang})" '
                 f'style="fill:{col};stroke:{A("ink", 22)};stroke-width:.7"/>')
    o.append("".join(g) + "</g>")
    return "".join(o)


# ---------------------------------------------------------------- workstations
def hull(ps):
    ps = sorted(set((round(a, 1), round(b, 1)) for a, b in ps))
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for p_ in ps:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p_) <= 0:
            lo.pop()
        lo.append(p_)
    for p_ in reversed(ps):
        while len(up) >= 2 and cross(up[-2], up[-1], p_) <= 0:
            up.pop()
        up.append(p_)
    return lo[:-1] + up[:-1]


def glow(x, y, z, w, d, h):
    """Faint screen-light rim around a monitor seen from the back: reads as switched on."""
    cs = [P(x + i * w, y + j * d, z + k * h) for i in (0, 1) for j in (0, 1) for k in (0, 1)]
    sw, op = (12, "1") if F["hot"] else (7, ".75")
    return (f'<polygon points="{pts(hull(cs))}" style="fill:{M("sky", 40, "paper")};stroke:{M("sky", 40, "paper")};'
            f'stroke-width:{sw};stroke-linejoin:round;opacity:{op};filter:blur(3.5px)"/>')


def contact(X0, Y0, r=0.42):
    return planeZ(0, f'<ellipse cx="{X0 * U:.1f}" cy="{Y0 * U:.1f}" rx="{r * U:.1f}" ry="{r * U:.1f}" style="fill:{A("ink", 20)};filter:blur(2.5px)"/>')


def ws_front(seat, facing, person, big=False, tag="", extras=""):
    # The person (body and hands) is wrapped in <g class="sitter"> so a scene can remove staff and keep their desks.
    X0, Y0 = seat

    def B(s0, f0, z, ds, df, h, base, **kw):
        if facing == "+y":
            return box(X0 + s0, Y0 + f0, z, ds, df, h, base, **kw)
        return box(X0 + f0, Y0 + s0, z, df, ds, h, base, **kw)

    def WP(s, f, z=0.0):
        return (X0 + s, Y0 + f, z) if facing == "+y" else (X0 + f, Y0 + s, z)

    big = big and not F["folding"]
    hw = 1.3 if big else 0.8
    f0, f1 = 0.3, (1.3 if big else 1.05)
    ax, ay = P(X0, Y0)
    mir = f" scale({-K},{K})" if facing == "+x" else f" scale({K})"
    tr = f"translate({ax:.1f},{ay:.1f}){mir}"
    body, hands, (hx, hy) = front_person(person)
    wood = M("wood", 80, "ink") if big else "wood"
    o = []
    # floor shadow under desk + chair
    if facing == "+y":
        o.append(shadow(X0 - hw, Y0 - 0.35, 2 * hw, f1 + 0.35))
    else:
        o.append(shadow(X0 - 0.35, Y0 - hw, f1 + 0.35, 2 * hw))
    o.append(contact(X0, Y0))
    chair = FOLD_CHAIR if F["folding"] else person.get("chair", CHAIR)
    o.append(f'<g transform="{tr}">{chair_behind(big, chair)}<g class="sitter">{body}</g></g>')
    if F["folding"]:
        (x0, y0, _), (x1, y1, _) = WP(-hw, f0), WP(hw, f1)
        o.append(folding_table(x0, x1, y0, y1))
    else:
        o.append(B(-hw, f0, 0, 0.07, f1 - f0, 0.68, wood))
        o.append(B(hw - 0.07, f0, 0, 0.07, f1 - f0, 0.68, wood))
        o.append(B(-hw + 0.07, f1 - 0.06, 0.2, 2 * hw - 0.14, 0.05, 0.48, M(wood, 92, "paper")))
        o.append(B(-hw, f0, 0.68, 2 * hw, f1 - f0, 0.06, wood, top=M(wood, 88, "paper")))
    # keyboard + mouse
    o.append(B(-0.58, 0.37, 0.74, 0.7, 0.2, 0.025, KEYS, top=M("paper", 92, "ink")))
    o.append(B(0.24, 0.4, 0.74, 0.09, 0.13, 0.03, KEYS))
    o.append(extras_on_desk(extras, WP))
    o.append(f'<g transform="{tr}"><g class="sitter">{hands}</g></g>')
    # monitor: back faces the viewer
    ms0 = -1.25 if big else -1.0
    mw, mh = (0.9, 0.5) if big else (0.7, 0.46)
    if facing == "+y":
        o.append(glow(X0 + ms0, Y0 + 0.84, 0.8, mw, 0.05, mh))
    else:
        o.append(glow(X0 + 0.84, Y0 + ms0, 0.8, 0.05, mw, mh))
    o.append(B(ms0 + 0.28, 0.86, 0.74, 0.1, 0.07, 0.08, MONITOR))
    o.append(B(ms0, 0.84, 0.8, 0.7 if not big else 0.9, 0.05, 0.46 if not big else 0.5, MONITOR))
    # name plate on the front panel
    if tag:
        tw = 7.6 * len(tag) + 16
        inner = (f'<rect x="{-tw / 2:.1f}" y="-11" width="{tw:.1f}" height="19" rx="4" style="fill:var(--paper);stroke:{A("ink", 40)};stroke-width:.8"/>'
                 f'<text x="0" y="3.2" text-anchor="middle" style="font-size:12px;font-weight:800;fill:var(--ink);letter-spacing:.01em">{tag}</text>')
        pz = 0.54 if F["folding"] else 0.46
        if facing == "+y":
            o.append(planeY(Y0 + f1, f'<g transform="translate({X0 * U:.1f},{-pz * U:.1f})">{inner}</g>'))
        else:
            o.append(planeX(X0 + f1, Y0, f'<g transform="translate(0,{-pz * U:.1f})">{inner}</g>'))
    head = P(X0, Y0)
    hsx = head[0] + (hx * K if facing == "+y" else -hx * K)
    return "".join(o), (hsx, head[1] + hy * K)


def extras_on_desk(extras, WP):
    o = []
    for kind, s, f in extras:
        x, y, z = WP(s, f, 0.74)
        if kind == "mug":
            o.append(mug(x, y, z, "var(--coral)"))
        elif kind == "mug2":
            o.append(mug(x, y, z, "var(--sky)"))
        elif kind == "papers":
            o.append(papers(x - 0.16, y - 0.12, z))
        elif kind == "plant":
            sx, sy = P(x, y, z)
            o.append(box(x - 0.08, y - 0.08, z, 0.16, 0.16, 0.12, POT))
            sx, sy = P(x, y, z + 0.12)
            o.append(f'<g transform="translate({sx:.1f},{sy:.1f})">'
                     + "".join(f'<ellipse cx="0" cy="-6" rx="2.6" ry="7" transform="rotate({a})" style="fill:{col}"/>'
                               for a, col in [(-35, LEAF1), (0, LEAF2), (35, LEAF1), (-12, LEAF3), (18, LEAF3)]) + "</g>")
        elif kind == "calc":
            o.append(box(x - 0.1, y - 0.07, z, 0.2, 0.14, 0.02, M("ink", 70, "paper"), top=M("ink", 60, "paper")))
        elif kind == "phone":
            o.append(box(x - 0.05, y - 0.09, z, 0.1, 0.18, 0.015, "ink", top=M("ink", 80, "sky")))
    return "".join(o)


def screen_code(a0, a1, b0, b1, variant):
    o = [f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" rx="2" style="fill:{SCREEN}"/>']
    if variant == "loss":
        w, h = a1 - a0, b1 - b0
        o.append(f'<path d="M{a0 + 3:.1f},{b0 + 4:.1f} C{a0 + w * 0.25:.1f},{b0 + h * 0.75:.1f} {a0 + w * 0.5:.1f},{b0 + h * 0.8:.1f} {a1 - 3:.1f},{b1 - 5:.1f}" '
                 f'style="fill:none;stroke:{M("teal", 70, "paper")};stroke-width:1.6"/>')
        o.append(f'<path d="M{a0 + 3:.1f},{b1 - 3:.1f} L{a1 - 3:.1f},{b1 - 3:.1f}" style="stroke:{A("paper", 35)};stroke-width:.8"/>')
    elif variant == "agents":
        y, i = b0 + 4, 0
        while y < b1 - 4:
            dot = M("coral", 70, "paper") if i % 4 == 2 else M("teal", 70, "paper")
            o.append(f'<circle cx="{a0 + 5:.1f}" cy="{y + 1.2:.1f}" r="1.5" style="fill:{dot}"/>'
                     f'<rect x="{a0 + 9:.1f}" y="{y:.1f}" width="{(a1 - a0 - 13) * (0.35 + 0.1 * (i % 3)):.1f}" height="2.2" rx="1" style="fill:{A("paper", 55)}"/>'
                     f'<rect x="{a1 - 14:.1f}" y="{y + .3:.1f}" width="{10 * (0.3 + 0.23 * ((i * 2) % 4)):.1f}" height="1.6" rx=".8" style="fill:{M("sky", 60, "paper")}"/>')
            y += 4.6
            i += 1
    elif variant == "trace":
        y, i = b0 + 5, 0
        while y < b1 - 4:
            ind = 5 + (i % 3) * 5
            o.append(f'<circle cx="{a0 + ind:.1f}" cy="{y + 1:.1f}" r="1.6" style="fill:none;stroke:{M("teal", 70, "paper")};stroke-width:.9"/>'
                     f'<rect x="{a0 + ind + 4:.1f}" y="{y:.1f}" width="{(a1 - a0 - ind - 10) * [0.8, 0.55, 0.7, 0.4][i % 4]:.1f}" height="2" rx="1" '
                     f'style="fill:{M("coral", 70, "paper") if i == 3 else A("paper", 60)}"/>')
            y += 5.2
            i += 1
    else:
        cols = [M("sky", 60, "paper"), M("teal", 70, "paper"), M("coral", 70, "paper"), A("paper", 60)]
        y = b0 + 4
        i = 0
        widths = [0.55, 0.35, 0.7, 0.45, 0.6, 0.3]
        while y < b1 - 3:
            ind = 3 + (i % 3) * 3
            o.append(f'<rect x="{a0 + ind:.1f}" y="{y:.1f}" width="{(a1 - a0 - ind - 3) * widths[i % 6]:.1f}" height="1.8" rx=".9" style="fill:{cols[i % 4]}"/>')
            y += 3.6
            i += 1
    return "".join(o)


def ws_back(seat, person, variant):
    X0, Y0 = seat
    y0, y1 = Y0 - 1.1, Y0 - 0.35
    o = [shadow(X0 - 0.8, y0, 1.6, 1.4)]
    if F["folding"]:
        o.append(folding_table(X0 - 0.8, X0 + 0.8, y0, y1))
    else:
        o.append(box(X0 - 0.8, y0, 0, 0.07, y1 - y0, 0.68, "wood"))
        o.append(box(X0 + 0.73, y0, 0, 0.07, y1 - y0, 0.68, "wood"))
        o.append(box(X0 - 0.8, y0, 0.68, 1.6, y1 - y0, 0.06, "wood", top=M("wood", 88, "paper")))
    # monitor: screen faces the viewer (+y face)
    mx0, mx1 = X0 - 0.08, X0 + 0.68
    if F["hot"]:
        o.append(glow(mx0, y0 + 0.05, 0.8, mx1 - mx0, 0.05, 0.48))
    o.append(box(X0 + 0.24, y0 + 0.08, 0.74, 0.1, 0.07, 0.08, MONITOR))
    o.append(box(mx0, y0 + 0.05, 0.8, mx1 - mx0, 0.05, 0.48, MONITOR))
    o.append(planeY(y0 + 0.1, screen_code(mx0 * U + 3, mx1 * U - 3, -1.25 * U, -0.83 * U, variant)))
    o.append(box(X0 - 0.38, Y0 - 0.66, 0.74, 0.6, 0.2, 0.025, KEYS, top=M("paper", 92, "ink")))
    o.append(mug(X0 - 0.58, Y0 - 0.85, 0.74, "var(--sky)" if variant == "loss" else "var(--coral)"))
    ax, ay = P(X0, Y0)
    o.append(contact(X0 - 0.05, Y0 + 0.1))
    sitter = "" if person is None else back_person(person)
    o.append(f'<g transform="translate({ax:.1f},{ay:.1f}) scale({K})"><g class="sitter">{sitter}</g>{chair_front()}</g>')
    return "".join(o), (ax + 2 * K, ay - 76 * K)


# ---------------------------------------------------------------- the room
def room():
    o = []
    # floor slab edges
    sl = 0.2
    o.append(poly([P(-T, D, 0), P(W, D, 0), P(W, D, -sl), P(-T, D, -sl)], M("teal", 55, "ink")))
    o.append(poly([P(W, -T, 0), P(W, D, 0), P(W, D, -sl), P(W, -T, -sl)], M("teal", 42, "ink")))
    floor = M("teal", 82, "paper")
    o.append(poly([P(0, 0), P(W, 0), P(W, D), P(0, D)], floor, extra='id="floor"'))
    # carpet tiles
    g = []
    for i in range(1, int(W)):
        g.append(f'<path d="M{i * U},0 L{i * U},{D * U}"/>')
    for j in range(1, int(D)):
        g.append(f'<path d="M0,{j * U} L{W * U},{j * U}"/>')
    o.append(planeZ(0, f'<g style="stroke:{M("teal", 70, "ink")};stroke-width:1;opacity:.28">{"".join(g)}</g>'))
    # window light pool on the carpet
    o.append(planeZ(0, f'<defs><linearGradient id="{F["gid"]}pool" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{2.8 * U:.0f}" y2="0">'
                       f'<stop offset="0" style="stop-color:var(--paper);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:0"/></linearGradient></defs>'
                       f'<polygon points="0,{1.4 * U:.0f} 0,{3.9 * U:.0f} {2.8 * U:.0f},{4.7 * U:.0f} {2.8 * U:.0f},{2.2 * U:.0f}" style="fill:url(#{F["gid"]}pool);filter:blur(4px)"/>'))
    # rug under the CEO corner
    o.append(planeZ(0, f'<rect x="{5.35 * U}" y="{5.7 * U}" width="{3.85 * U}" height="{3.0 * U}" rx="14" '
                       f'style="fill:{M("cream", 78, "coral")};stroke:{M("coral", 55, "cream")};stroke-width:5"/>'
                       f'<rect x="{5.35 * U + 12}" y="{5.7 * U + 12}" width="{3.85 * U - 24}" height="{3.0 * U - 24}" rx="9" '
                       f'style="fill:none;stroke:{M("coral", 40, "cream")};stroke-width:2;stroke-dasharray:6 5"/>'))
    # walls
    wl_up, wl_lo = M("cream", 55, "paper"), M("cream", 82, "wood")
    wr_up, wr_lo = M("cream", 80, "paper"), M("cream", 70, "wood")
    if F["paint"]:  # era 3: the office is renovated
        wl_up, wl_lo = M("sky", 18, "paper"), M("sky", 45, "cream")
        wr_up, wr_lo = M("sky", 26, "paper"), M("sky", 40, "cream")
    wz = 1.0
    o.append(poly([P(0, 0, wz), P(0, D, wz), P(0, D, H), P(0, 0, H)], wl_up))
    o.append(poly([P(0, 0, 0), P(0, D, 0), P(0, D, wz), P(0, 0, wz)], wl_lo))
    o.append(poly([P(0, 0, wz), P(W, 0, wz), P(W, 0, H), P(0, 0, H)], wr_up))
    g = F["gid"]
    o.append(f'<defs><linearGradient id="{g}wgl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.0"/>'
             '<stop offset=".55" style="stop-color:var(--paper);stop-opacity:.45"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:.1"/></linearGradient>'
             f'<linearGradient id="{g}wgr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--ink);stop-opacity:.07"/>'
             '<stop offset="1" style="stop-color:var(--ink);stop-opacity:0"/></linearGradient></defs>')
    o.append(poly([P(0, 0, 0), P(0, D, 0), P(0, D, H), P(0, 0, H)], f"url(#{g}wgl)", stroke=None))
    o.append(poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, H), P(0, 0, H)], f"url(#{g}wgr)", stroke=None))
    o.append(poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, wz), P(0, 0, wz)], wr_lo))
    rail = M("wood", 72, "paper")
    o.append(poly([P(0, 0, wz), P(0, D, wz), P(0, D, wz + 0.06), P(0, 0, wz + 0.06)], rail))
    o.append(poly([P(0, 0, wz), P(W, 0, wz), P(W, 0, wz + 0.06), P(0, 0, wz + 0.06)], M(rail, 90, "ink")))
    base = M("wood", 55, "ink")
    o.append(poly([P(0, 0, 0), P(0, D, 0), P(0, D, 0.1), P(0, 0, 0.1)], base))
    o.append(poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, 0.1), P(0, 0, 0.1)], M(base, 90, "ink")))
    # wall caps (the cut-away top) and front end caps
    cap = M("ink", 72, "wood")
    o.append(poly([P(-T, -T, H), P(-T, D, H), P(0, D, H), P(0, 0, H)], cap))
    o.append(poly([P(-T, -T, H), P(W, -T, H), P(W, 0, H), P(0, 0, H)], cap))
    o.append(poly([P(-T, D, -0.2), P(0, D, -0.2), P(0, D, H), P(-T, D, H)], M("cream", 70, "ink")))
    o.append(poly([P(W, -T, -0.2), P(W, 0, -0.2), P(W, 0, H), P(W, -T, H)], M("cream", 58, "ink")))
    return "".join(o)


def right_wall_decor():
    o = []
    if F["constitution"]:
        o.append(constitution_art(2.1))
    # whiteboard: the K2 board (era 2), then chains of thought (era 3)
    o.append(whiteboard_art(4.65, 6.75 if F["whiteboard"] == "chains" else 7.35, F["whiteboard"]))
    o.append(kestrel_art(3.52))
    # wall screen above the bookshelf: a reasoning trace (era 3 on)
    if F["wall_screen"]:
        a0, a1, b0, b1 = 0.32 * U, 1.88 * U, -2.6 * U, -2.0 * U
        o.append(f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" rx="3" style="fill:{MONITOR};stroke:{EDGE}"/>'
                 + screen_code(a0 + 3, a1 - 3, b0 + 3, b1 - 3, "trace"))
    return planeY(0, "".join(o))


# Wall pieces in the right-wall plane (planeY(0)): x in room units, drawn in local wall coordinates.
def constitution_art(x0):
    """The framed constitution, 1.2 units wide. The game shows it only once the lab has one (ui/office.js)."""
    a0, a1, b0, b1 = x0 * U, (x0 + 1.2) * U, -2.3 * U, -1.3 * U
    lines = "".join(f'<rect x="{a0 + 14:.1f}" y="{b0 + 30 + i * 5.2:.1f}" width="{(a1 - a0 - 28) * (0.95 if i % 3 else 0.7):.1f}" height="1.6" style="fill:{A("ink", 35)}"/>'
                    for i in range(6))
    return (f'<g class="office-constitution"><rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" rx="2" style="fill:{M("wood", 70, "ink")};stroke:{EDGE}"/>'
            f'<rect x="{a0 + 5:.1f}" y="{b0 + 5:.1f}" width="{a1 - a0 - 10:.1f}" height="{b1 - b0 - 10:.1f}" style="fill:var(--paper)"/>'
            f'<text x="{(a0 + a1) / 2:.1f}" y="{b0 + 22:.1f}" text-anchor="middle" style="font-family:\'Libre Baskerville\',Georgia,serif;font-style:italic;font-size:10.5px;fill:var(--ink)">Constitution</text>'
            f'<path d="M{a0 + 20:.1f},{b0 + 26:.1f} L{a1 - 20:.1f},{b0 + 26:.1f}" style="stroke:var(--coral);stroke-width:1"/>'
            + lines +
            f'<circle cx="{a1 - 16:.1f}" cy="{b1 - 14:.1f}" r="5" style="fill:var(--coral);opacity:.85"/></g>')


def whiteboard_art(x0, x1, kind):
    """The whiteboard: "curve" (one loss curve), "k2" (curve, check and notes) or "chains"; the summit invite pins to it."""
    a0, a1, b0, b1 = x0 * U, x1 * U, -2.32 * U, -1.15 * U
    w, h = a1 - a0, b1 - b0
    board = (f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" style="fill:{M("paper", 80, "ink")};stroke:{EDGE}"/>'
             f'<rect x="{a0 + 4:.1f}" y="{b0 + 4:.1f}" width="{w - 8:.1f}" height="{h - 8:.1f}" rx="2" style="fill:var(--paper)"/>')
    if kind == "chains":
        board += board_chains(a0, b0)
    else:
        board += (f'<path d="M{a0 + 18:.1f},{b0 + 12:.1f} L{a0 + 18:.1f},{b1 - 14:.1f} L{a0 + w * 0.55:.1f},{b1 - 14:.1f}" style="fill:none;stroke:var(--ink);stroke-width:1.6;stroke-linecap:round"/>'
                  f'<path d="M{a0 + 22:.1f},{b0 + 16:.1f} C{a0 + 40:.1f},{b0 + 48:.1f} {a0 + 60:.1f},{b1 - 26:.1f} {a0 + w * 0.53:.1f},{b1 - 22:.1f}" style="fill:none;stroke:var(--sky);stroke-width:2.4;stroke-linecap:round"/>')
    if kind == "k2":
        board += (f'<path d="M{a0 + w * 0.53 - 6:.1f},{b1 - 30:.1f} l6,8 l7,-10" style="fill:none;stroke:var(--coral);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"/>'
                  + "".join(f'<rect x="{a0 + w * 0.62:.1f}" y="{b0 + 16 + i * 9:.1f}" width="{w * (0.3 if i % 2 else 0.22):.1f}" height="2.2" rx="1" style="fill:{A("ink", 45) if i != 1 else "var(--coral)"}"/>'
                            for i in range(5)))
    board += f'<rect x="{a0 + w * 0.3:.1f}" y="{b1 - 2:.1f}" width="{w * 0.4:.1f}" height="5" rx="1.5" style="fill:{M("paper", 70, "ink")}"/>'
    if F["invite"]:
        board += summit_invite(a1 - 8, b0 - 6)
    return board


def kestrel_art(x0):
    """The lab's kestrel poster, 0.84 units wide."""
    a0, a1, b0, b1 = x0 * U, (x0 + 0.84) * U, -2.25 * U, -1.35 * U
    cx, cy = (a0 + a1) / 2, (b0 + b1) / 2
    return (f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" style="fill:var(--sky);stroke:{EDGE}"/>'
            f'<circle cx="{cx + 8:.1f}" cy="{cy - 10:.1f}" r="9" style="fill:{M("coral", 60, "paper")}"/>'
            f'<path d="M{cx - 18:.1f},{cy - 2:.1f} Q{cx - 6:.1f},{cy - 10:.1f} {cx:.1f},{cy + 2:.1f} Q{cx + 6:.1f},{cy - 10:.1f} {cx + 18:.1f},{cy - 2:.1f} '
            f'Q{cx + 6:.1f},{cy - 2:.1f} {cx + 1:.1f},{cy + 8:.1f} L{cx - 1:.1f},{cy + 8:.1f} Q{cx - 6:.1f},{cy - 2:.1f} {cx - 18:.1f},{cy - 2:.1f} Z" style="fill:var(--ink)"/>'
            f'<rect x="{a0 + 8:.1f}" y="{b1 - 12:.1f}" width="{a1 - a0 - 16:.1f}" height="3" rx="1.5" style="fill:{A("paper", 75)}"/>')


def board_chains(a0, b0):
    """Era 3 whiteboard: rows of reasoning steps joined by arrows, one row ending in a check."""
    o = []
    bw, bh, gap = 24, 9, 12
    for r, n in enumerate([3, 3, 3]):
        y = b0 + 12 + r * 17
        x = a0 + 12 + (r % 2) * 5
        for i in range(n):
            o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw}" height="{bh}" rx="3" style="fill:none;stroke:{A("ink", 60)};stroke-width:1.3"/>'
                     f'<rect x="{x + 4:.1f}" y="{y + 3.8:.1f}" width="{bw * (0.55 if (r + i) % 2 else 0.4):.1f}" height="1.6" rx=".8" style="fill:{A("ink", 45)}"/>')
            if i < n - 1:
                ay = y + bh / 2
                o.append(f'<path d="M{x + bw + 2:.1f},{ay:.1f} L{x + bw + gap - 3:.1f},{ay:.1f} M{x + bw + gap - 6:.1f},{ay - 2.5:.1f} L{x + bw + gap - 3:.1f},{ay:.1f} L{x + bw + gap - 6:.1f},{ay + 2.5:.1f}" '
                         f'style="fill:none;stroke:var(--sky);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round"/>')
            x += bw + gap
        if r == 2:  # the last chain ends in a check, just after its final step
            o.append(f'<path d="M{x - gap + 3:.1f},{y + bh / 2 - 1:.1f} l3,4 l6,-8" style="fill:none;stroke:var(--coral);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"/>')
    return "".join(o)


def summit_invite(a, b):
    """Era 4: the summit invitation card pinned to the whiteboard."""
    return (f'<g transform="translate({a:.1f},{b:.1f}) rotate(6)">'
            f'<rect x="-15" y="0" width="32" height="24" rx="1.5" style="fill:var(--paper);stroke:{A("ink", 40)};stroke-width:.8"/>'
            f'<rect x="-15" y="0" width="32" height="6" style="fill:var(--sky)"/>'
            + "".join(f'<rect x="-11" y="{9 + i * 3.6:.1f}" width="{[20, 14, 17][i]}" height="1.4" rx=".7" style="fill:{A("ink", 40)}"/>' for i in range(3))
            + f'<circle cx="11" cy="18" r="3" style="fill:none;stroke:var(--coral);stroke-width:1.1"/>'
            f'<circle cx="1" cy="1" r="2.4" style="fill:var(--coral);stroke:{M("coral", 70, "ink")};stroke-width:.6"/></g>')


def left_wall_decor():
    o = []
    # window (a runs toward the back corner)
    a0, a1 = (D - 3.9) * U, (D - 1.4) * U
    b0, b1 = -2.3 * U, -1.0 * U
    w, h = a1 - a0, b1 - b0
    o.append(f'<rect x="{a0 - 4:.1f}" y="{b0 - 4:.1f}" width="{w + 8:.1f}" height="{h + 8:.1f}" rx="3" style="fill:var(--paper);stroke:{EDGE}"/>'
             f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" style="fill:{M("sky", 38, "paper")}"/>')
    # skyline
    bx = a0
    for bw, bh in [(22, 26), (16, 40), (26, 30), (14, 48), (30, 22), (18, 36), (24, 28)]:
        if bx + bw > a1:
            bw = a1 - bx
        o.append(f'<rect x="{bx:.1f}" y="{b1 - bh:.1f}" width="{bw:.1f}" height="{bh:.1f}" style="fill:{M("sky", 55, "paper")}"/>')
        bx += bw + 2
        if bx >= a1:
            break
    o.append(f'<path d="M{a0 + w * 0.6:.1f},{b0 + 10:.1f} L{a0 + w * 0.75:.1f},{b0:.1f} L{a0 + w * 0.9:.1f},{b0:.1f} L{a0 + w * 0.7:.1f},{b0 + 18:.1f} Z" style="fill:{A("paper", 45)}"/>')
    o.append(f'<path d="M{(a0 + a1) / 2:.1f},{b0:.1f} L{(a0 + a1) / 2:.1f},{b1:.1f} M{a0:.1f},{(b0 + b1) / 2:.1f} L{a1:.1f},{(b0 + b1) / 2:.1f}" style="stroke:var(--paper);stroke-width:4"/>')
    o.append(f'<rect x="{a0 - 8:.1f}" y="{b1 + 3:.1f}" width="{w + 16:.1f}" height="6" rx="1.5" style="fill:{M("paper", 88, "ink")};stroke:{EDGE}"/>')
    # funding-round poster (eras 2-3)
    if F["funding"]:
        o.append(funding_poster((D - 4.9) * U, (D - 4.12) * U, -2.42 * U, -1.64 * U))
    # the shipping bell in the back corner (era 3 on)
    if F["bell"]:
        o.append(ship_bell((D - 0.8) * U, -2.15 * U))
    # clock
    ca, cb = (D - 5.25) * U, -2.15 * U
    o.append(f'<circle cx="{ca:.1f}" cy="{cb:.1f}" r="12" style="fill:var(--paper);stroke:var(--ink);stroke-width:2"/>'
             f'<path d="M{ca:.1f},{cb:.1f} L{ca:.1f},{cb - 8:.1f} M{ca:.1f},{cb:.1f} L{ca + 6:.1f},{cb + 2:.1f}" style="stroke:var(--ink);stroke-width:1.6;stroke-linecap:round"/>')
    # door
    o.append(door_art((D - 7.75) * U, (D - 6.35) * U))
    return planeX(0, D, "".join(o))


def campus(a0, a1, b0, b1):
    """The building's view (eras 4-5): long low data halls and two cooling towers with steam."""
    w = a1 - a0
    o = [f'<rect x="{a0 + w * 0.28:.1f}" y="{b1 - 26:.1f}" width="{w * 0.34:.1f}" height="26" style="fill:{M("sky", 56, "paper")}"/>',
         f'<rect x="{a0:.1f}" y="{b1 - 17:.1f}" width="{w * 0.5:.1f}" height="17" style="fill:{M("sky", 68, "paper")}"/>']
    o += [f'<rect x="{a0 + 6 + i * 16:.1f}" y="{b1 - 21:.1f}" width="8" height="4" style="fill:{M("sky", 78, "ink")}"/>' for i in range(4)]
    o.append(f'<rect x="{a0:.1f}" y="{b1 - 9:.1f}" width="{w * 0.5:.1f}" height="2" style="fill:{A("sky", 45)}"/>')
    for cx, th, bw in [(a0 + w * 0.7, 40, 13), (a0 + w * 0.87, 33, 11)]:
        bb, tw = b1, bw * 0.62
        o.append(f'<path d="M{cx - bw:.1f},{bb:.1f} Q{cx - tw * 0.55:.1f},{bb - th * 0.6:.1f} {cx - tw:.1f},{bb - th:.1f} L{cx + tw:.1f},{bb - th:.1f} '
                 f'Q{cx + tw * 0.55:.1f},{bb - th * 0.6:.1f} {cx + bw:.1f},{bb:.1f} Z" style="fill:{M("paper", 76, "sky")};stroke:{A("ink", 22)};stroke-width:.8"/>')
        o.append("".join(f'<circle cx="{cx + dx:.1f}" cy="{bb - th - dy:.1f}" r="{r}" style="fill:{A("paper", 80)}"/>'
                         for dx, dy, r in [(-3, 5, 5.5), (4, 9, 6.5), (-1, 15, 5)]))
    return "".join(o)


def hard_hat(a, b, col):
    """A hard hat resting on a surface whose top edge is at b (the robotics workbench)."""
    return (f'<path d="M{a - 10:.1f},{b:.1f} Q{a - 10:.1f},{b - 12:.1f} {a:.1f},{b - 12:.1f} Q{a + 10:.1f},{b - 12:.1f} {a + 10:.1f},{b:.1f} Z" '
            f'style="fill:{col};stroke:{EDGE};stroke-width:.8"/>'
            f'<path d="M{a:.1f},{b - 12:.1f} L{a:.1f},{b - 2:.1f}" style="stroke:{M(col, 75, "ink")};stroke-width:1.6"/>'
            f'<rect x="{a - 13:.1f}" y="{b - 2.5:.1f}" width="26" height="3" rx="1.5" style="fill:{M(col, 80, "ink")}"/>')


def funding_poster(a0, a1, b0, b1):
    """Eras 2-3: a funding-round poster, rising bars and an arrow."""
    w, h = a1 - a0, b1 - b0
    o = [f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" style="fill:var(--paper);stroke:{EDGE}"/>',
         f'<text x="{a0 + w / 2:.1f}" y="{b0 + 10:.1f}" text-anchor="middle" style="font-size:6.5px;font-weight:900;fill:var(--ink);letter-spacing:.05em">SERIES A</text>']
    o += [f'<rect x="{a0 + 8 + i * 9:.1f}" y="{b1 - 6 - hh:.1f}" width="6" height="{hh}" style="fill:var(--teal)"/>' for i, hh in enumerate([7, 12, 18, 25])]
    o.append(f'<path d="M{a0 + 7:.1f},{b1 - 16:.1f} L{a1 - 9:.1f},{b0 + 17:.1f} M{a1 - 15:.1f},{b0 + 16:.1f} L{a1 - 9:.1f},{b0 + 17:.1f} L{a1 - 10:.1f},{b0 + 23:.1f}" '
             f'style="fill:none;stroke:var(--coral);stroke-width:2;stroke-linecap:round;stroke-linejoin:round"/>')
    return "".join(o)


def ship_bell(a, b):
    """Era 3 on: the brass bell rung when a model ships, on a wall bracket with a pull rope."""
    rope = M("wood", 50, "paper")
    return (f'<rect x="{a + 9:.1f}" y="{b - 10:.1f}" width="5" height="16" rx="1.5" style="fill:{M("ink", 70, "wood")}"/>'
            f'<path d="M{a + 10:.1f},{b - 5:.1f} L{a:.1f},{b - 5:.1f} L{a:.1f},{b - 2:.1f}" style="fill:none;stroke:{M("ink", 70, "wood")};stroke-width:2.2"/>'
            f'<path d="M{a:.1f},{b + 20:.1f} q3,8 0,16 q-3,7 0,13" style="fill:none;stroke:{rope};stroke-width:1.6"/>'
            f'<circle cx="{a:.1f}" cy="{b + 50:.1f}" r="3" style="fill:var(--coral)"/>'
            f'<path d="M{a - 3:.1f},{b - 2:.1f} Q{a - 6:.1f},{b + 1:.1f} {a - 6:.1f},{b + 9:.1f} Q{a - 7:.1f},{b + 14:.1f} {a - 10:.1f},{b + 16:.1f} '
            f'L{a + 10:.1f},{b + 16:.1f} Q{a + 7:.1f},{b + 14:.1f} {a + 6:.1f},{b + 9:.1f} Q{a + 6:.1f},{b + 1:.1f} {a + 3:.1f},{b - 2:.1f} Z" '
            f'style="fill:{BRASS};stroke:{M("wood", 55, "ink")};stroke-width:.9"/>'
            f'<rect x="{a - 11:.1f}" y="{b + 15:.1f}" width="22" height="3" rx="1.5" style="fill:{M(BRASS, 80, "ink")}"/>'
            f'<ellipse cx="{a - 2.5:.1f}" cy="{b + 6:.1f}" rx="1.4" ry="4" style="fill:{A("paper", 60)}"/>'
            f'<circle cx="{a:.1f}" cy="{b + 19.5:.1f}" r="2" style="fill:{M("wood", 55, "ink")}"/>')


def bookshelf():
    x0, x1, y0, y1, h = 0.4, 1.8, 0.05, 0.5, 1.9
    o = [shadow(x0, y0, x1 - x0, y1 - y0, 0.06), box(x0, y0, 0, x1 - x0, y1 - y0, h, "wood")]
    inner = []
    a0, a1 = x0 * U + 5, x1 * U - 5
    books = ["var(--coral)", "var(--sky)", "var(--teal)", "var(--paper)", M("wood", 50, "ink"), M("coral", 60, "paper"), "var(--ink)", M("sky", 55, "paper")]
    k = 0
    for i, (bt, bb) in enumerate([(-h * U + 6, -h * U * 0.68), (-h * U * 0.66 + 2, -h * U * 0.36), (-h * U * 0.34 + 2, -6)]):
        inner.append(f'<rect x="{a0:.1f}" y="{bt:.1f}" width="{a1 - a0:.1f}" height="{bb - bt:.1f}" style="fill:{M("wood", 55, "ink")}"/>')
        x = a0 + 2
        while x < a1 - 8:
            bw = 5 + (k * 7) % 5
            bh = (bb - bt) * (0.72 + ((k * 13) % 5) * 0.05)
            if i == 1 and 30 < x - a0 < 50:
                x += 18
                continue
            inner.append(f'<rect x="{x:.1f}" y="{bb - bh:.1f}" width="{bw:.1f}" height="{bh:.1f}" style="fill:{books[k % len(books)]};stroke:{A("ink", 30)};stroke-width:.5"/>')
            x += bw + 1
            k += 1
    o.append(planeY(y1, "".join(inner)))
    return "".join(o)


def rack():
    """The server racks along the back wall: one short rack in era 1, two (K2), three from era 3; amber and warm in era 5."""
    racks = F["racks"]
    x0, x1 = racks[0][0], racks[-1][1]
    o = [shadow(x0 - 0.05, 0.1, x1 - x0 + 0.1, 1.2, 0.08)]
    body = M("ink", 86, "sky")
    if F["hot"]:
        cx, cy = P((x0 + x1) / 2, 0.7, 1.4)
        o.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{(x1 - x0) * U * 0.62:.1f}" ry="{1.9 * U:.1f}" style="fill:{A("coral", 26)};filter:blur(14px)"/>')
        palette = ["var(--wood)", M("wood", 55, "coral"), "var(--coral)", M("wood", 70, "paper"), M("coral", 65, "wood")]
    else:
        palette = ["var(--teal)", M("teal", 60, "paper"), "var(--coral)", "var(--sky)", M("teal", 60, "paper")]
    for rid, (rx0, rx1, h) in enumerate(racks):
        o.append(box(rx0, 0.12, 0, rx1 - rx0, 1.13, h, body, top=M(body, 80, "paper")))
        inner = []
        a0, a1 = rx0 * U + 6, rx1 * U - 6
        for j in range(int((h * U - 16) / 10.2)):
            bt = -h * U + 8 + j * 10.2
            inner.append(f'<rect x="{a0:.1f}" y="{bt:.1f}" width="{a1 - a0:.1f}" height="8" rx="1" style="fill:{M("ink", 70, "paper")}"/>')
            for q in range(5 if rx1 - rx0 > 0.9 else 4):
                col = palette[(q + j + rid) % 5]
                dl = ((j * 7 + q * 3 + rid * 5) % 11) * 0.13
                inner.append(f'<rect class="led" x="{a1 - 8 - q * 6:.1f}" y="{bt + 2.5:.1f}" width="3.2" height="3" rx=".8" style="fill:{col};animation-delay:-{dl:.2f}s"/>')
            inner.append(f'<rect x="{a0 + 3:.1f}" y="{bt + 3:.1f}" width="{(a1 - a0) * 0.35:.1f}" height="1.6" style="fill:{A("paper", 25)}"/>')
        o.append(planeY(1.25, "".join(inner)))
        # side vents on the +x face of the last rack
        if rid == len(racks) - 1:
            v = "".join(f'<rect x="{(1.25 - 0.18) * U - 40:.1f}" y="{-h * U + 14 + j * 12:.1f}" width="34" height="2.4" rx="1.2" style="fill:{M(body, 70, "ink")}"/>'
                        for j in range(int((h * U - 28) / 12)))
            o.append(planeX(rx1, 1.25, v))
    return "".join(o)


def rack_anchor():
    racks = F["racks"]
    return P((racks[0][0] + racks[-1][1]) / 2, 0.7, max(r[2] for r in racks))


def cables():
    s = f"fill:none;stroke:{M('ink', 78, 'sky')};stroke-width:3.2;stroke-linecap:round"
    s2 = f"fill:none;stroke:{M('coral', 60, 'ink')};stroke-width:2.6;stroke-linecap:round"
    extra = ""
    if len(F["racks"]) == 3:  # the third rack is patched into the first
        extra = f'<path d="M{8.5 * U},{1.3 * U} C{8.6 * U},{1.8 * U} {9.3 * U},{1.8 * U} {9.45 * U},{1.3 * U}" style="fill:none;stroke:{M("sky", 70, "ink")};stroke-width:2.8;stroke-linecap:round"/>'
    return planeZ(0, f'<path d="M{8.9 * U},{1.3 * U} C{8.4 * U},{2.2 * U} {7.9 * U},{2.1 * U} {7.35 * U},{1.75 * U}" style="{s}"/>'
                     f'<path d="M{9.0 * U},{1.3 * U} C{8.5 * U},{2.55 * U} {6.4 * U},{2.4 * U} {5.6 * U},{2.15 * U} C{5.3 * U},{2.05 * U} {5.1 * U},{1.9 * U} {4.95 * U},{1.75 * U}" style="{s2}"/>'
                     + extra)


def water_cooler():
    x0, y0 = 0.22, 5.0
    o = [shadow(x0, y0, 0.42, 0.42, 0.05), box(x0, y0, 0, 0.42, 0.42, 0.95, M("paper", 86, "ink"), top=M("paper", 92, "ink"))]
    sx, sy = P(x0 + 0.21, y0 + 0.21, 0.95)
    o.append(f'<g transform="translate({sx:.1f},{sy:.1f})">'
             f'<rect x="-10" y="-34" width="20" height="32" rx="7" style="fill:{A("sky", 55)};stroke:{M("sky", 65, "ink")};stroke-width:.9"/>'
             f'<rect x="-4" y="-40" width="8" height="7" rx="2" style="fill:{M("sky", 70, "ink")}"/>'
             f'<rect x="-6" y="-30" width="3" height="22" rx="1.5" style="fill:{A("paper", 70)}"/></g>')
    fx, fy = P(x0 + 0.42, y0 + 0.21, 0.62)
    o.append(f'<rect x="{fx - 3:.1f}" y="{fy - 4:.1f}" width="5" height="6" rx="1" style="fill:var(--coral)"/>')
    return "".join(o)


def lounge():
    x, y = 9.75, 7.35
    o = [shadow(x - 0.5, y - 0.45, 1.0, 0.9, 0.02)]
    sx, sy = P(x, y, 0)
    bb = M("sky", 80, "paper")
    o.append(f'<g transform="translate({sx:.1f},{sy:.1f})">'
             f'<path d="M-30,-4 Q-34,-26 -14,-34 Q4,-44 22,-30 Q34,-18 28,-4 Q0,8 -30,-4 Z" style="fill:{bb};stroke:{EDGE};stroke-width:.9"/>'
             f'<path d="M-18,-18 Q0,-26 18,-16" style="fill:none;stroke:{M(bb, 80, "ink")};stroke-width:1.4"/>'
             f'<ellipse cx="-8" cy="-28" rx="8" ry="3.5" style="fill:{A("paper", 45)}"/></g>')
    # side table
    tx, ty = 10.45, 6.5
    o.append(shadow(tx - 0.2, ty - 0.2, 0.4, 0.4, 0.02))
    o.append(box(tx - 0.03, ty - 0.03, 0, 0.06, 0.06, 0.45, M("ink", 70, "paper")))
    tsx, tsy = P(tx, ty, 0.47)
    o.append(f'<ellipse cx="{tsx:.1f}" cy="{tsy + 2:.1f}" rx="16" ry="8" style="fill:{M("wood", 80, "ink")}"/>'
             f'<ellipse cx="{tsx:.1f}" cy="{tsy:.1f}" rx="16" ry="8" style="fill:{M("wood", 85, "paper")};stroke:{EDGE}"/>')
    o.append(mug(tx + 0.05, ty + 0.05, 0.47, "var(--teal)"))
    return "".join(o)


def pizza_boxes(x, y):
    """Era 1: a stack of pizza boxes where the lounge will go."""
    card = M("cream", 62, "wood")
    o = [shadow(x - 0.36, y - 0.36, 0.72, 0.72, 0.02)]
    for i, (dx, dy) in enumerate([(0, 0), (0.05, -0.04), (-0.03, 0.03)]):
        o.append(box(x - 0.31 + dx, y - 0.31 + dy, i * 0.065, 0.62, 0.62, 0.06, card, top=M("cream", 72, "paper")))
    cx, cy = (x - 0.03) * U, (y + 0.03) * U
    # the lid's logo: a pizza with one slice gone
    o.append(planeZ(0.19, f'<path d="M{cx:.1f},{cy:.1f} L{cx + 10:.1f},{cy:.1f} A10,10 0 1,1 {cx + 5:.1f},{cy - 8.66:.1f} Z" '
                          f'style="fill:{M("wood", 60, "paper")};stroke:{M("wood", 70, "ink")};stroke-width:.8"/>'
                          f'<path d="M{cx:.1f},{cy:.1f} L{cx + 7.5:.1f},{cy:.1f} A7.5,7.5 0 1,1 {cx + 3.75:.1f},{cy - 6.5:.1f} Z" style="fill:var(--coral)"/>'
                          + "".join(f'<circle cx="{cx + dx:.1f}" cy="{cy + dy:.1f}" r="1.4" style="fill:{M("coral", 60, "ink")}"/>'
                                    for dx, dy in [(-3, -3), (2, 3), (-4, 3)])))
    return "".join(o)


def robot(x, y):
    """Eras 4-5: a humanoid-robot prototype on a display plinth in the robotics lab."""
    o = [shadow(x - 0.36, y - 0.36, 0.72, 0.72, 0.02)]
    sx, sy = P(x, y, 0)
    side = M(ROBOT, 82, "ink")
    joint = M("ink", 80, "sky")
    o.append(f'<g transform="translate({sx:.1f},{sy:.1f})">'
             f'<ellipse cx="0" cy="-4" rx="30" ry="15" style="fill:{M("ink", 72, "paper")};stroke:{EDGE}"/>'
             f'<ellipse cx="0" cy="-10" rx="30" ry="15" style="fill:{M("paper", 86, "ink")};stroke:{EDGE}"/>'
             f'<rect x="-10" y="-52" width="8" height="42" rx="3" style="fill:{ROBOT};stroke:{EDGE};stroke-width:.8"/>'
             f'<rect x="2" y="-52" width="8" height="42" rx="3" style="fill:{side};stroke:{EDGE};stroke-width:.8"/>'
             f'<circle cx="-6" cy="-32" r="2.6" style="fill:{joint}"/><circle cx="6" cy="-32" r="2.6" style="fill:{joint}"/>'
             f'<rect x="-20" y="-86" width="7" height="34" rx="3.5" style="fill:{ROBOT};stroke:{EDGE};stroke-width:.8"/>'
             f'<rect x="13" y="-86" width="7" height="34" rx="3.5" style="fill:{side};stroke:{EDGE};stroke-width:.8"/>'
             f'<rect x="-14" y="-90" width="28" height="40" rx="8" style="fill:{ROBOT};stroke:{EDGE};stroke-width:.8"/>'
             f'<path d="M4,-89 L6,-89 Q13,-89 13,-82 L13,-58 Q13,-51 6,-51 L4,-51 Z" style="fill:{side}"/>'
             f'<circle cx="0" cy="-74" r="3.4" style="fill:var(--sky);stroke:{M("sky", 70, "ink")};stroke-width:.8"/>'
             f'<rect x="-3" y="-96" width="6" height="7" style="fill:{joint}"/>'
             f'<rect x="-12" y="-118" width="24" height="23" rx="8" style="fill:{ROBOT};stroke:{EDGE};stroke-width:.8"/>'
             f'<rect x="-9" y="-111" width="18" height="8" rx="4" style="fill:{SCREEN}"/>'
             f'<circle cx="-4" cy="-107" r="1.6" style="fill:{M("sky", 60, "paper")}"/><circle cx="4" cy="-107" r="1.6" style="fill:{M("sky", 60, "paper")}"/>'
             f'</g>')
    return "".join(o)


# ---------------------------------------------------------------- premises: the loft (era 1) and the building (eras 4-5)
def fit(W, D, top=84, bottom=16, side=24):
    """Centre a W x D room in the frame below the HUD, scaled down if it does not fit (never up)."""
    global OX, OY, XF
    OX, OY = 0.0, 0.0
    x0, x1 = P(-T, D)[0], P(W, -T)[0]
    y0, y1 = P(-T, -T, H)[1], P(W, D, -0.2)[1]
    sc = min(1.0, (1440 - 2 * side) / (x1 - x0), (900 - top - bottom) / (y1 - y0))
    XF = (sc, 720 - sc * (x0 + x1) / 2, top + (900 - top - bottom) / 2 - sc * (y0 + y1) / 2)


def framed(pt):
    sc, tx, ty = XF
    return [round(pt[0] * sc + tx, 1), round(pt[1] * sc + ty, 1)]


def patch(x0, y0, x1, y1, base):
    """A floor patch over the main floor; clicks pass through to #floor."""
    return poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], base, extra='pointer-events="none"')


def floor_wood(x0, y0, x1, y1):
    ln, y, k = [], y0 + 0.42, 0
    while y < y1 - 0.05:
        ln.append(f'<path d="M{x0 * U:.1f},{y * U:.1f} L{x1 * U:.1f},{y * U:.1f}"/>')
        x = x0 + (0.9 if k % 2 else 0.35)
        while x < x1 - 0.1:
            ln.append(f'<path d="M{x * U:.1f},{(y - 0.42) * U:.1f} L{x * U:.1f},{y * U:.1f}"/>')
            x += 1.6
        y += 0.42
        k += 1
    return planeZ(0, f'<g style="stroke:{M("wood", 60, "ink")};stroke-width:1;opacity:.35">{"".join(ln)}</g>')


def floor_grid(x0, y0, x1, y1, step, col, width=1.0, opacity=.28):
    gl = [f'<path d="M{x * U:.1f},{y0 * U:.1f} L{x * U:.1f},{y1 * U:.1f}"/>' for x in _steps(x0, x1, step)]
    gl += [f'<path d="M{x0 * U:.1f},{y * U:.1f} L{x1 * U:.1f},{y * U:.1f}"/>' for y in _steps(y0, y1, step)]
    return planeZ(0, f'<g style="stroke:{col};stroke-width:{width};opacity:{opacity}">{"".join(gl)}</g>')


def _steps(a, b, step):
    out, v = [], a + step
    while v < b - 0.01:
        out.append(v)
        v += step
    return out


def shell(W, D, floor_base, edge):
    """Slab, #floor, the two back walls with rail and baseboard, and the cut-away caps (no decor)."""
    o = [poly([P(-T, D, 0), P(W, D, 0), P(W, D, -0.2), P(-T, D, -0.2)], edge),
         poly([P(W, -T, 0), P(W, D, 0), P(W, D, -0.2), P(W, -T, -0.2)], M(edge, 78, "ink")),
         poly([P(0, 0), P(W, 0), P(W, D), P(0, D)], floor_base, extra='id="floor"')]
    wz = 1.0
    o.append(poly([P(0, 0, wz), P(0, D, wz), P(0, D, H), P(0, 0, H)], M("cream", 55, "paper")))
    o.append(poly([P(0, 0, 0), P(0, D, 0), P(0, D, wz), P(0, 0, wz)], M("cream", 82, "wood")))
    o.append(poly([P(0, 0, wz), P(W, 0, wz), P(W, 0, H), P(0, 0, H)], M("cream", 80, "paper")))
    o.append(poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, wz), P(0, 0, wz)], M("cream", 70, "wood")))
    rail = M("wood", 72, "paper")
    o.append(poly([P(0, 0, wz), P(0, D, wz), P(0, D, wz + 0.06), P(0, 0, wz + 0.06)], rail))
    o.append(poly([P(0, 0, wz), P(W, 0, wz), P(W, 0, wz + 0.06), P(0, 0, wz + 0.06)], M(rail, 90, "ink")))
    base = M("wood", 55, "ink")
    o.append(poly([P(0, 0, 0), P(0, D, 0), P(0, D, 0.1), P(0, 0, 0.1)], base))
    o.append(poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, 0.1), P(0, 0, 0.1)], M(base, 90, "ink")))
    cap = M("ink", 72, "wood")
    o.append(poly([P(-T, -T, H), P(-T, D, H), P(0, D, H), P(0, 0, H)], cap))
    o.append(poly([P(-T, -T, H), P(W, -T, H), P(W, 0, H), P(0, 0, H)], cap))
    o.append(poly([P(-T, D, -0.2), P(0, D, -0.2), P(0, D, H), P(-T, D, H)], M("cream", 70, "ink")))
    o.append(poly([P(W, -T, -0.2), P(W, 0, -0.2), P(W, 0, H), P(W, -T, H)], M("cream", 58, "ink")))
    return "".join(o)


def brick_art(x0, x1):
    """Exposed brick over the right wall from x0 to x1 (the loft)."""
    o = [f'<rect x="{x0 * U:.1f}" y="{-H * U:.1f}" width="{(x1 - x0) * U:.1f}" height="{H * U:.1f}" style="fill:{M("cream", 70, "paper")}"/>']
    bw, bh, row, z = 0.5 * U, 0.2 * U, 0, 0.12 * U
    while z < H * U - 2:
        a = x0 * U + (-bw / 2 if row % 2 else 0)
        while a < x1 * U:
            aa, ww = max(a, x0 * U), min(a + bw, x1 * U) - max(a, x0 * U)
            if ww > 2:
                col = [M("coral", 42, "wood"), M("coral", 36, "cream"), M("wood", 60, "coral")][(row * 7 + int(a)) % 3]
                o.append(f'<rect x="{aa + 1:.1f}" y="{-z - bh + 1:.1f}" width="{ww - 2:.1f}" height="{bh - 2:.1f}" style="fill:{col}"/>')
            a += bw
        z += bh
        row += 1
    return "".join(o)


def loft_window(a0, a1):
    """A tall industrial window with small panes, in the left-wall plane."""
    b0, b1 = -2.45 * U, -0.75 * U
    w, h = a1 - a0, b1 - b0
    o = [f'<rect x="{a0 - 5:.1f}" y="{b0 - 5:.1f}" width="{w + 10:.1f}" height="{h + 10:.1f}" style="fill:{M("ink", 70, "paper")}"/>',
         f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" style="fill:{M("sky", 38, "paper")}"/>']
    bx = a0
    for bw, bh in [(20, 34), (16, 52), (26, 40), (14, 62), (30, 30)]:
        if bx >= a1:
            break
        bw = min(bw, a1 - bx)
        o.append(f'<rect x="{bx:.1f}" y="{b1 - bh:.1f}" width="{bw:.1f}" height="{bh:.1f}" style="fill:{M("sky", 55, "paper")}"/>')
        bx += bw + 2
    frame = f'stroke:{M("ink", 70, "paper")};stroke-width:3'
    o.append("".join(f'<path d="M{a0 + w * i / 3:.1f},{b0:.1f} L{a0 + w * i / 3:.1f},{b1:.1f}" style="{frame}"/>' for i in (1, 2)))
    o.append("".join(f'<path d="M{a0:.1f},{b0 + h * j / 4:.1f} L{a1:.1f},{b0 + h * j / 4:.1f}" style="{frame}"/>' for j in (1, 2, 3)))
    o.append(f'<path d="M{a0 + w * 0.5:.1f},{b0 + 14:.1f} L{a0 + w * 0.62:.1f},{b0:.1f} L{a0 + w * 0.75:.1f},{b0:.1f} L{a0 + w * 0.58:.1f},{b0 + 26:.1f} Z" style="fill:{A("paper", 40)}"/>')
    o.append(f'<rect x="{a0 - 9:.1f}" y="{b1 + 4:.1f}" width="{w + 18:.1f}" height="6" rx="1.5" style="fill:{M("paper", 80, "ink")};stroke:{EDGE}"/>')
    return "".join(o)


def door_art(a0, a1):
    """A panel door in the left-wall plane."""
    b0 = -2.1 * U
    w = a1 - a0
    dcol = M("wood", 85, "paper")
    return (f'<rect x="{a0 - 5:.1f}" y="{b0 - 5:.1f}" width="{w + 10:.1f}" height="{-b0 + 5:.1f}" style="fill:{M("wood", 60, "ink")}"/>'
            f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{-b0:.1f}" style="fill:{dcol};stroke:{EDGE}"/>'
            f'<rect x="{a0 + 9:.1f}" y="{b0 + 10:.1f}" width="{w - 18:.1f}" height="{-b0 * 0.36:.1f}" rx="2" style="fill:none;stroke:{M(dcol, 75, "ink")};stroke-width:1.5"/>'
            f'<rect x="{a0 + 9:.1f}" y="{b0 * 0.5 + 6:.1f}" width="{w - 18:.1f}" height="{-b0 * 0.36:.1f}" rx="2" style="fill:none;stroke:{M(dcol, 75, "ink")};stroke-width:1.5"/>'
            f'<circle cx="{a1 - 10:.1f}" cy="{b0 * 0.48:.1f}" r="3" style="fill:{M("cream", 60, "ink")}"/>')


def curtain_art(a0, a1, z0=0.15, z1=2.5):
    """Floor-to-ceiling glass in the left-wall plane, the data-center campus outside."""
    b0, b1 = -z1 * U, -z0 * U
    w = a1 - a0
    mull = M("ink", 60, "paper")
    o = [f'<rect x="{a0 - 4:.1f}" y="{b0 - 4:.1f}" width="{w + 8:.1f}" height="{b1 - b0 + 8:.1f}" style="fill:{mull}"/>',
         f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{b1 - b0:.1f}" style="fill:{M("sky", 38, "paper")}"/>',
         campus(a0, a0 + w * 0.55, b0, b1 - 18), campus(a0 + w * 0.45, a1, b0 + 10, b1 - 14),
         f'<rect x="{a0:.1f}" y="{b1 - 18:.1f}" width="{w:.1f}" height="18" style="fill:{M("teal", 55, "paper")}"/>']
    n = max(2, int(w / 70))
    o.append("".join(f'<path d="M{a0 + w * i / n:.1f},{b0:.1f} L{a0 + w * i / n:.1f},{b1:.1f}" style="stroke:{mull};stroke-width:4"/>' for i in range(1, n)))
    o.append(f'<path d="M{a0:.1f},{b0 + (b1 - b0) * 0.62:.1f} L{a1:.1f},{b0 + (b1 - b0) * 0.62:.1f}" style="stroke:{mull};stroke-width:3"/>')
    o.append(f'<path d="M{a0 + w * 0.08:.1f},{b0 + 20:.1f} L{a0 + w * 0.2:.1f},{b0:.1f} L{a0 + w * 0.3:.1f},{b0:.1f} L{a0 + w * 0.14:.1f},{b0 + 34:.1f} Z" style="fill:{A("paper", 40)}"/>')
    return "".join(o)


def doom_window(a0, a1, z0=0.15, z1=2.5):
    """Curtain wall onto an orange smoke-haze day: data halls to the horizon, plumes, a protest at the gates."""
    b0, b1 = -z1 * U, -z0 * U
    w, h = a1 - a0, b1 - b0
    gid = F["gid"]
    mull = M("ink", 60, "paper")
    o = [f'<defs><linearGradient id="{gid}dsky" x1="0" y1="0" x2="0" y2="1">'
         f'<stop offset="0" style="stop-color:{M("coral", 45, "wood")}"/><stop offset=".55" style="stop-color:{M("wood", 55, "cream")}"/>'
         f'<stop offset="1" style="stop-color:{M("cream", 70, "coral")}"/></linearGradient></defs>',
         f'<rect x="{a0 - 4:.1f}" y="{b0 - 4:.1f}" width="{w + 8:.1f}" height="{h + 8:.1f}" style="fill:{mull}"/>',
         f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" style="fill:url(#{gid}dsky)"/>',
         f'<circle cx="{a0 + w * 0.3:.1f}" cy="{b0 + h * 0.3:.1f}" r="13" style="fill:{M("coral", 55, "paper")};opacity:.85;filter:blur(1.5px)"/>']
    # three rows of data halls, lighter as they recede
    for row, (base, hh, col, gap) in enumerate([(b1 - 44, 8, M("wood", 55, "coral"), 3), (b1 - 32, 12, M("wood", 55, "ink"), 4), (b1 - 18, 17, M("ink", 62, "wood"), 6)]):
        x, k = a0, row
        while x < a1:
            bw = [34, 22, 46, 28, 38][k % 5]
            bw = min(bw, a1 - x)
            o.append(f'<rect x="{x:.1f}" y="{base - hh:.1f}" width="{bw:.1f}" height="{hh}" style="fill:{col}"/>')
            x += bw + gap
            k += 1
    # cooling towers with heavy plumes
    for cx, th, bw in [(a0 + w * 0.12, 30, 10), (a0 + w * 0.34, 38, 12), (a0 + w * 0.55, 34, 11), (a0 + w * 0.74, 42, 13), (a0 + w * 0.9, 31, 10)]:
        bb, tw = b1 - 30, bw * 0.62
        o.append("".join(f'<circle cx="{cx + dx:.1f}" cy="{bb - th - dy:.1f}" r="{r}" style="fill:{M("ink", 38, "wood")};opacity:.55"/>'
                         for dx, dy, r in [(-2, 6, 8), (5, 14, 10), (-4, 24, 12), (6, 36, 14), (-3, 50, 16)]))
        o.append(f'<path d="M{cx - bw:.1f},{bb:.1f} Q{cx - tw * 0.55:.1f},{bb - th * 0.6:.1f} {cx - tw:.1f},{bb - th:.1f} L{cx + tw:.1f},{bb - th:.1f} '
                 f'Q{cx + tw * 0.55:.1f},{bb - th * 0.6:.1f} {cx + bw:.1f},{bb:.1f} Z" style="fill:{M("paper", 55, "wood")};stroke:{A("ink", 30)};stroke-width:.8"/>')
    o.append(f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h * 0.28:.1f}" style="fill:{A("ink", 16)};filter:blur(6px)"/>')
    # ground and the protest at the gates
    o.append(f'<rect x="{a0:.1f}" y="{b1 - 18:.1f}" width="{w:.1f}" height="18" style="fill:{M("wood", 50, "paper")}"/>'
             f'<path d="M{a0:.1f},{b1 - 12:.1f} L{a1:.1f},{b1 - 12:.1f}" style="stroke:{M("ink", 50, "paper")};stroke-width:1.4;stroke-dasharray:3 2"/>')
    shirts = ["var(--ink)", "var(--coral)", "var(--sky)", "var(--teal)", M("wood", 60, "ink")]
    x, k = a0 + w * 0.3, 0
    while x < a0 + w * 0.92:
        yb = b1 - 2 - (k % 2) * 3
        o.append(f'<rect x="{x - 3:.1f}" y="{yb - 9:.1f}" width="6" height="9" rx="2" style="fill:{shirts[k % 5]}"/>'
                 f'<circle cx="{x:.1f}" cy="{yb - 11.5:.1f}" r="2.6" style="fill:{[SK_MED, SK_LIGHT, SK_DARK][k % 3]}"/>')
        if k % 2 == 0:
            o.append(f'<path d="M{x + 2:.1f},{yb - 8:.1f} L{x + 2:.1f},{yb - 22:.1f}" style="stroke:{M("wood", 55, "ink")};stroke-width:1"/>'
                     f'<rect x="{x - 5:.1f}" y="{yb - 30:.1f}" width="14" height="9" rx="1" style="fill:var(--paper);stroke:{A("ink", 40)};stroke-width:.6"/>'
                     f'<rect x="{x - 3:.1f}" y="{yb - 27:.1f}" width="10" height="{2 if k % 4 else 3}" style="fill:{"var(--coral)" if k % 4 == 0 else "var(--ink)"}"/>')
        x += 7.5
        k += 1
    n = max(2, int(w / 70))
    o.append("".join(f'<path d="M{a0 + w * i / n:.1f},{b0:.1f} L{a0 + w * i / n:.1f},{b1:.1f}" style="stroke:{mull};stroke-width:4"/>' for i in range(1, n)))
    o.append(f'<path d="M{a0:.1f},{b0 + h * 0.62:.1f} L{a1:.1f},{b0 + h * 0.62:.1f}" style="stroke:{mull};stroke-width:3"/>')
    return "".join(o)


def newscast(x0, x1, z0, z1):
    """The screen wall shows one live broadcast about the lab."""
    a0, a1, b0, b1 = x0 * U, x1 * U, -z1 * U, -z0 * U
    w, h = a1 - a0, b1 - b0
    return (f'<rect x="{a0 - 8:.1f}" y="{b0 - 8:.1f}" width="{w + 16:.1f}" height="{h + 16:.1f}" rx="8" style="fill:{A("sky", 28)};filter:blur(9px)"/>'
            f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" style="fill:{MONITOR}"/>'
            f'<rect x="{a0 + 4:.1f}" y="{b0 + 4:.1f}" width="{w - 8:.1f}" height="{h - 8:.1f}" rx="2" style="fill:{M("sky", 55, "ink")}"/>'
            # the lab's own building on the news, a coral ring around it
            f'<rect x="{a0 + w * 0.45:.1f}" y="{b0 + h * 0.3:.1f}" width="{w * 0.4:.1f}" height="{h * 0.34:.1f}" style="fill:{M("paper", 70, "sky")}"/>'
            + "".join(f'<rect x="{a0 + w * 0.47 + i * w * 0.075:.1f}" y="{b0 + h * 0.36:.1f}" width="{w * 0.05:.1f}" height="{h * 0.22:.1f}" style="fill:{M("sky", 60, "ink")}"/>' for i in range(5))
            + f'<ellipse cx="{a0 + w * 0.65:.1f}" cy="{b0 + h * 0.47:.1f}" rx="{w * 0.27:.1f}" ry="{h * 0.25:.1f}" style="fill:none;stroke:var(--coral);stroke-width:3"/>'
            f'<rect x="{a0 + 10:.1f}" y="{b0 + 10:.1f}" width="30" height="13" rx="2" style="fill:var(--coral)"/>'
            f'<text x="{a0 + 25:.1f}" y="{b0 + 20:.1f}" text-anchor="middle" style="font-size:9px;font-weight:900;letter-spacing:.06em;fill:var(--paper)">LIVE</text>'
            f'<rect x="{a0 + 10:.1f}" y="{b0 + 30:.1f}" width="{w * 0.3:.1f}" height="3" rx="1.5" style="fill:{A("paper", 70)}"/>'
            f'<rect x="{a0 + 10:.1f}" y="{b0 + 37:.1f}" width="{w * 0.22:.1f}" height="3" rx="1.5" style="fill:{A("paper", 50)}"/>'
            f'<rect x="{a0 + 4:.1f}" y="{b1 - 26:.1f}" width="{w - 8:.1f}" height="14" style="fill:var(--paper)"/>'
            f'<rect x="{a0 + 10:.1f}" y="{b1 - 21:.1f}" width="{w * 0.6:.1f}" height="4" rx="2" style="fill:var(--ink)"/>'
            f'<rect x="{a0 + 4:.1f}" y="{b1 - 12:.1f}" width="{w - 8:.1f}" height="8" style="fill:var(--coral)"/>'
            + "".join(f'<rect x="{a0 + 10 + i * 34:.1f}" y="{b1 - 9.5:.1f}" width="24" height="2.4" rx="1" style="fill:{A("paper", 80)}"/>' for i in range(int((w - 20) / 34))))


def screen_wall_art(x0, x1, z0, z1, cols, rows):
    """A wall of monitors in the right-wall plane, agents at work on every screen."""
    cw, ch = (x1 - x0) / cols, (z1 - z0) / rows
    variants = ["agents", "trace", "loss", "agents", "code", "trace"]
    o = [f'<rect x="{x0 * U - 8:.1f}" y="{-z1 * U - 8:.1f}" width="{(x1 - x0) * U + 16:.1f}" height="{(z1 - z0) * U + 16:.1f}" rx="8" style="fill:{A("sky", 30)};filter:blur(9px)"/>']
    for r in range(rows):
        for cc in range(cols):
            a0, a1 = (x0 + cc * cw) * U + 3, (x0 + (cc + 1) * cw) * U - 3
            b0, b1 = -(z1 - r * ch) * U + 3, -(z1 - (r + 1) * ch) * U - 3
            o.append(f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" rx="2" style="fill:{MONITOR}"/>'
                     + screen_code(a0 + 3, a1 - 3, b0 + 3, b1 - 3, variants[(r * cols + cc) % 6]))
    return "".join(o)


def plaque_art(x0, x1, z, text):
    a0, a1 = x0 * U, x1 * U
    return (f'<rect x="{a0:.1f}" y="{-z * U:.1f}" width="{a1 - a0:.1f}" height="22" rx="4" style="fill:var(--ink)"/>'
            f'<text x="{(a0 + a1) / 2:.1f}" y="{-z * U + 15:.1f}" text-anchor="middle" style="font-size:12px;font-weight:900;letter-spacing:.08em;fill:var(--paper)">{text}</text>')


def accord_art(x0):
    """Era 5: the signed pacing accord, framed, after the era-4 summit."""
    a0, a1, b0, b1 = x0 * U, (x0 + 0.62) * U, -2.3 * U, -1.42 * U
    w = a1 - a0
    sig = f'fill:none;stroke:var(--ink);stroke-width:1;stroke-linecap:round'
    return (f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{b1 - b0:.1f}" rx="2" style="fill:{M("wood", 70, "ink")};stroke:{EDGE}"/>'
            f'<rect x="{a0 + 4:.1f}" y="{b0 + 4:.1f}" width="{w - 8:.1f}" height="{b1 - b0 - 8:.1f}" style="fill:var(--paper)"/>'
            f'<rect x="{a0 + 8:.1f}" y="{b0 + 9:.1f}" width="{w - 16:.1f}" height="3" style="fill:var(--sky)"/>'
            + "".join(f'<rect x="{a0 + 8:.1f}" y="{b0 + 16 + i * 4:.1f}" width="{(w - 16) * (0.9 if i % 2 else 0.7):.1f}" height="1.4" style="fill:{A("ink", 35)}"/>' for i in range(3))
            + "".join(f'<path d="M{a0 + 7 + i * (w - 14) / 3:.1f},{b1 - 13:.1f} q3,-5 5,0 t5,-1" style="{sig}"/>' for i in range(3))
            + f'<circle cx="{a1 - 11:.1f}" cy="{b1 - 20:.1f}" r="5" style="fill:var(--coral);stroke:var(--sky);stroke-width:1.6"/>')


def glass(p0, p1, h=1.15, doors=()):
    """A low glass partition along the floor segment p0-p1, with door gaps given as (t0, t1) fractions."""
    (xa, ya), (xb, yb) = p0, p1
    cuts, t = [], 0.0
    for d0, d1 in sorted(doors):
        cuts.append((t, d0))
        t = d1
    cuts.append((t, 1.0))
    frame = M("ink", 60, "paper")
    o = ['<g pointer-events="none">']  # see-through: clicks reach the floor behind it
    for t0, t1 in cuts:
        a = (xa + (xb - xa) * t0, ya + (yb - ya) * t0)
        b = (xa + (xb - xa) * t1, ya + (yb - ya) * t1)
        (a0x, a0y), (b0x, b0y) = P(*a, 0.22), P(*b, 0.22)
        (ahx, ahy), (bhx, bhy) = P(*a, h), P(*b, h)
        o.append(poly([P(*a, 0), P(*b, 0), P(*b, 0.22), P(*a, 0.22)], M("paper", 78, "ink")))
        o.append(poly([P(*a, 0.22), P(*b, 0.22), P(*b, h), P(*a, h)], A("sky", 16), stroke=A("sky", 55), sw=0.9))
        o.append(f'<path d="M{ahx:.1f},{ahy:.1f} L{bhx:.1f},{bhy:.1f}" style="stroke:{frame};stroke-width:2.4;stroke-linecap:round"/>'
                 f'<path d="M{a0x:.1f},{a0y:.1f} L{ahx:.1f},{ahy:.1f} M{b0x:.1f},{b0y:.1f} L{bhx:.1f},{bhy:.1f}" style="stroke:{frame};stroke-width:1.6"/>')
    return "".join(o) + "</g>"


def sandbox(x, y, s=1.1, h=1.25):
    """Evals: a glass cube on a plinth with the model under test glowing inside."""
    o = [shadow(x - 0.1, y - 0.1, s + 0.2, s + 0.2, 0.05), box(x, y, 0, s, s, 0.35, M("paper", 80, "ink"))]
    cx, cy = P(x + s / 2, y + s / 2, 0.35 + h / 2)
    o.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="22" style="fill:{A("coral", 35)};filter:blur(8px)"/>'
             f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="11" style="fill:var(--coral);stroke:{M("coral", 70, "ink")};stroke-width:1"/>'
             f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="17" style="fill:none;stroke:var(--sky);stroke-width:2;stroke-dasharray:4 3"/>'
             f'<ellipse cx="{cx - 4:.1f}" cy="{cy - 4:.1f}" rx="3.5" ry="2.4" style="fill:{A("paper", 70)}"/>')
    o.append(box(x, y, 0.35, s, s, h, A("sky", 12), top=A("sky", 18), left=A("sky", 14), right=A("sky", 20), stroke=A("sky", 70)))
    return "".join(o)


def evals_room(x1, y1):
    """The glass evals room in the back-left corner, from (0, 0) to (x1, y1)."""
    return (patch(0, 0, x1, y1, M("sky", 22, "paper")) + floor_grid(0, 0, x1, y1, 1.0, M("sky", 60, "ink"))
            + sandbox(x1 * 0.28, y1 * 0.22, s=min(1.2, x1 * 0.42), h=1.25)
            + glass((x1, 0), (x1, y1), doors=[(0.58, 0.92)]) + glass((0, y1), (x1, y1)))


def hazard_pen(x0, y0, x1, y1):
    return planeZ(0, f'<rect x="{x0 * U:.1f}" y="{y0 * U:.1f}" width="{(x1 - x0) * U:.1f}" height="{(y1 - y0) * U:.1f}" '
                     f'style="fill:{A("coral", 8)};stroke:var(--coral);stroke-width:6;stroke-dasharray:14 10"/>'
                     f'<rect x="{x0 * U + 6:.1f}" y="{y0 * U + 6:.1f}" width="{(x1 - x0) * U - 12:.1f}" height="{(y1 - y0) * U - 12:.1f}" '
                     f'style="fill:none;stroke:var(--ink);stroke-width:1.5;opacity:.35"/>')


def workbench(x, y, w=0.7, d=1.8):
    """The robotics lab's bench: parts bins and two hard hats."""
    o = [shadow(x, y, w, d, 0.06), box(x, y, 0, w, d, 0.8, M("ink", 62, "paper"), top=M("wood", 70, "paper"))]
    for i, col in enumerate(["var(--sky)", "var(--teal)"]):
        o.append(box(x + 0.15, y + 0.2 + i * 0.55, 0.8, 0.3, 0.35, 0.18, col))
    for i, col in enumerate(["var(--coral)", "var(--sky)"]):
        hx, hy = P(x + w / 2, y + d - 0.55 + i * 0.35, 0.8)
        o.append(hard_hat(hx, hy, col))
    return "".join(o)


EXTRA_RESEARCHER = dict(skin=SK_DARK, hair=H_BLACK, shirt=M("coral", 55, "paper"), headphones=True)


def seat(o, heads, role, drawn):
    svg, (hx, hy) = drawn
    heads[role] = [hx, hy - HAIR_TOP * K]
    o.append(f'<g id="person-{role}">{svg}</g>')


def loft_scene():
    """Era 1: a small rented loft above a shop: brick, tall windows, a wood floor, folding tables."""
    W, D = 8.6, 7.4
    fit(W, D)
    heads = {}
    o = [shell(W, D, M("wood", 62, "paper"), M("wood", 45, "ink")), floor_wood(0, 0, W, D)]
    o.append(planeY(0, brick_art(0, W) + kestrel_art(1.2) + whiteboard_art(2.4, 4.9, "curve")))
    o.append(planeX(0, D, loft_window((D - 2.9) * U, (D - 0.9) * U) + loft_window((D - 5.4) * U, (D - 3.4) * U)
                    + door_art((D - 7.1) * U, (D - 6.0) * U)))
    o.append(planeZ(0, f'<path d="M{7.1 * U},{1.3 * U} C{6.9 * U},{1.8 * U} {6.4 * U},{1.9 * U} {5.9 * U},{1.75 * U}" '
                       f'style="fill:none;stroke:{M("ink", 78, "sky")};stroke-width:3.2;stroke-linecap:round"/>'))
    o.append(plant(0.5, 0.55))
    o.append(f'<g id="rack">{rack()}</g>')
    seat(o, heads, "researcher1", ws_back((2.9, 2.2), PEOPLE["researcher1"], "code"))
    seat(o, heads, "researcher2", ws_back((5.1, 2.2), PEOPLE["researcher2"], "loss"))
    seat(o, heads, "research", ws_front((1.1, 4.4), "+x", PEOPLE["research"], tag="Research", extras=[("papers", 0.5, 0.8), ("mug2", 0.55, 0.45)]))
    seat(o, heads, "safety", ws_front((3.6, 3.5), "+y", PEOPLE["safety"], tag="Safety", extras=[("papers", 0.45, 0.75)]))
    seat(o, heads, "cfo", ws_front((6.3, 3.75), "+y", PEOPLE["cfo"], tag="CFO", extras=[("calc", 0.5, 0.75), ("papers", 0.5, 0.45)]))
    seat(o, heads, "policy", ws_front((1.1, 6.2), "+x", PEOPLE["policy"], tag="Policy", extras=[("phone", 0.5, 0.5), ("mug", 0.55, 0.85)]))
    seat(o, heads, "ceo", ws_front((5.4, 6.1), "+y", PEOPLE["ceo"], big=True, tag="You · CEO", extras=[("papers", 0.45, 0.75), ("mug", 0.65, 0.5)]))
    o.append(pizza_boxes(3.0, 6.9))
    return "".join(o), heads, (7.3, 6.2)


def building_scene():
    """Eras 4-5: the lab's own building in a tech park: open plan, a glass curtain wall, an evals room, a robotics lab."""
    W, D = 15.0, 11.0
    fit(W, D)
    heads = {}
    o = [shell(W, D, M("wood", 62, "paper"), M("wood", 45, "ink")), floor_wood(0, 0, W, D)]
    o.append(planeZ(0, f'<rect x="{6.0 * U}" y="{6.8 * U}" width="{4.0 * U}" height="{3.0 * U}" rx="14" '
                       f'style="fill:{M("cream", 78, "coral")};stroke:{M("coral", 55, "cream")};stroke-width:5"/>'))
    right = [plaque_art(0.6, 2.9, 2.55, "EVALS"), constitution_art(3.3), kestrel_art(4.62),
             whiteboard_art(6.3, 8.45, "chains"),
             newscast(8.62, 10.42, 1.05, 2.5) if F["doom"] else screen_wall_art(8.62, 10.42, 1.05, 2.5, 3, 2)]
    if F["accord"]:
        right.append(accord_art(5.6))
    o.append(planeY(0, "".join(right)))
    view = doom_window if F["doom"] else curtain_art
    o.append(planeX(0, D, view((D - 10.6) * U, (D - 3.6) * U) + ship_bell((D - 3.3) * U, -2.15 * U)))
    o.append(evals_room(3.2, 3.0))
    o.append(f'<g id="rack">{rack()}</g>')
    away = F["empty_researchers"]  # era 5: two chairs empty, their monitors still running agents
    o.append(ws_back((5.0, 2.4), EXTRA_RESEARCHER, "trace")[0])
    seat(o, heads, "researcher1", ws_back((7.3, 2.4), None if away else PEOPLE["researcher1"], "agents" if away else "code"))
    seat(o, heads, "researcher2", ws_back((9.6, 2.4), None if away else PEOPLE["researcher2"], "agents" if away else "loss"))
    seat(o, heads, "research", ws_front((1.6, 5.2), "+x", PEOPLE["research"], tag="Research", extras=[("papers", 0.5, 0.8), ("mug2", 0.55, 0.45)]))
    seat(o, heads, "safety", ws_front((5.4, 4.8), "+y", PEOPLE["safety"], tag="Safety", extras=[("papers", 0.45, 0.75), ("plant", 0.62, 0.45)]))
    seat(o, heads, "cfo", ws_front((8.9, 4.8), "+y", PEOPLE["cfo"], tag="CFO", extras=[("calc", 0.5, 0.75), ("papers", 0.5, 0.45)]))
    seat(o, heads, "policy", ws_front((1.9, 8.4), "+x", PEOPLE["policy"], tag="Policy", extras=[("phone", 0.5, 0.5), ("mug", 0.55, 0.85)]))
    seat(o, heads, "ceo", ws_front((7.9, 7.6), "+y", PEOPLE["ceo"], big=True, tag="You · CEO",
                                   extras=[("papers", 0.75, 0.55), ("mug", 1.05, 0.9), ("plant", 1.1, 0.45)]))
    # the robotics lab, front right
    o.append(patch(11.0, 6.0, W, D, M("paper", 74, "ink")) + floor_grid(11.0, 6.0, W, D, 2.2, M("paper", 55, "ink"), 1.2, .5))
    o.append(glass((11.0, 6.0), (W, 6.0), doors=[(0.1, 0.35)]))
    o.append(glass((11.0, 6.0), (11.0, D), doors=[(0.55, 0.8)]))
    o.append(hazard_pen(12.2, 7.2, 14.6, 10.4))
    o.append(workbench(11.3, 6.5))
    o.append(robot(13.0, 8.6))
    o.append(robot(14.1, 8.1))
    o.append(plant(0.6, 10.3))
    o.append(plant(10.5, 10.4))
    return "".join(o), heads, (10.6, 4.2)


# ---------------------------------------------------------------- people roster
PEOPLE = {
    "ceo": dict(skin=SK_MED, hair=H_BLACK, style="short", shirt=M("ink", 78, "sky"), mood="happy", suit=True, chair=M("coral", 55, "ink")),
    "research": dict(skin=SK_DARK, hair=H_BLACK, style="curly", shirt="var(--sky)", mood="calm", glasses=True, collar="var(--paper)", advisor=True),
    "safety": dict(skin=SK_LIGHT, hair=H_AUBURN, style="bun", shirt="var(--teal)", mood="calm", collar=M("teal", 60, "paper"), advisor=True),
    "cfo": dict(skin=SK_LIGHT, hair=H_GREY, style="bald", shirt=M("cream", 70, "paper"), mood="calm", glasses=True, collar="var(--paper)", advisor=True),
    "policy": dict(skin=SK_MED, hair=H_BROWN, style="long", shirt="var(--coral)", mood="calm", headset=True, advisor=True),
    "researcher1": dict(skin=SK_MED, hair=H_BROWN, shirt=M("teal", 70, "ink"), hood=True, headphones=True),
    "researcher2": dict(skin=SK_LIGHT, hair=H_BLACK, shirt=M("sky", 65, "paper"), ponytail=True),
}

HAIR_TOP = 24  # sprite units from the head centre to just above the tallest hair (the bun)


def scene():
    """Returns (svg body, head anchors, floor-menu point or None) for the era in F, in drawing coordinates.
    A head anchor is the top-centre of the head, hair included."""
    if F["premises"] == "loft":
        return loft_scene()
    if F["premises"] == "building":
        return building_scene()
    return office_scene()


def office_scene():
    """The K2 office: the approved still, era 2, and era 3 renovated with a glass evals room where the bookshelf stood."""
    global OX, OY, XF
    OX, OY, XF = K2_OX, K2_OY, (1.0, 0.0, 0.0)
    heads = {}
    o = [room(), right_wall_decor(), left_wall_decor(), cables()]
    if F["evals_room"]:
        o.append(evals_room(2.6, 2.2))
    else:
        o.append(bookshelf())
        o.append(plant(0.55, 1.1))
    o.append(f'<g id="rack">{rack()}</g>')

    def person(role, drawn):
        seat(o, heads, role, drawn)

    person("researcher1", ws_back((4.2, 2.35), PEOPLE["researcher1"], "code"))
    person("researcher2", ws_back((6.6, 2.35), PEOPLE["researcher2"], "loss"))
    person("research", ws_front((1.5, 4.35), "+x", PEOPLE["research"], tag="Research", extras=[("papers", 0.5, 0.8), ("mug2", 0.55, 0.45)]))
    o.append(water_cooler())
    desk_plant = [("plant", 0.62, 0.45)] if F["plants"] else []
    person("safety", ws_front((4.9, 4.15), "+y", PEOPLE["safety"], tag="Safety", extras=[("papers", 0.45, 0.75)] + desk_plant))
    person("cfo", ws_front((8.55, 4.35), "+y", PEOPLE["cfo"], tag="CFO", extras=[("calc", 0.5, 0.75), ("papers", 0.5, 0.45)]))
    person("policy", ws_front((1.9, 6.95), "+x", PEOPLE["policy"], tag="Policy", extras=[("phone", 0.5, 0.5), ("mug", 0.55, 0.85)]))
    ceo_plant = [("plant", 1.1, 0.45)] if F["plants"] else []
    person("ceo", ws_front((7.25, 6.4), "+y", PEOPLE["ceo"], big=True, tag="You · CEO",
                           extras=[("papers", 0.75, 0.55), ("mug", 1.05, 0.9)] + ceo_plant))
    if F["lounge"]:
        o.append(lounge())
    if F["plants"]:
        o.append(plant(0.6, 8.4))
        o.append(plant(10.5, 8.45))
    return "".join(o), heads, None


ERAS_PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Office by era</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;800;900&family=Libre+Baskerville:ital@1&display=swap" rel="stylesheet">
<style>
:root{--cream:#F1E4C8;--paper:#FFFBF1;--ink:#2E2A2B;--teal:#3F9C8F;--wood:#C8864C;--coral:#E0613B;--sky:#3F84C6}
body{margin:0;padding:24px;background:var(--cream);font-family:"Nunito",sans-serif;color:var(--ink);
  display:grid;grid-template-columns:1fr 1fr;gap:20px 24px}
figure{margin:0}
figcaption{font-size:15px;font-weight:800;margin:0 0 4px 8px}
figcaption span{font-weight:400;color:color-mix(in oklab, var(--ink) 60%, var(--paper))}
svg{display:block;width:100%;height:auto}
.led{animation:blink 1.4s steps(2,end) infinite}
@keyframes blink{50%{opacity:.25}}
@media (prefers-reduced-motion: reduce){.led{animation:none}}
</style></head>
<body>
{figures}
</body></html>
"""


def build(era):
    """Draws one office (era None = the K2 still) and returns (svg text, anchors)."""
    global F
    F = features(era)
    body, heads, floor_pt = scene()
    sc, tx, ty = XF
    if XF != (1.0, 0.0, 0.0):
        body = f'<g transform="matrix({sc:.4f},0,0,{sc:.4f},{tx:.1f},{ty:.1f})">{body}</g>'
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" class="room" '
           f'aria-label="Lab office">{body}</svg>\n')
    anchors = {"heads": {r: framed(pt) for r, pt in heads.items()}, "rack": framed(rack_anchor()),
               "floorMenu": [1039, 636] if floor_pt is None else framed(P(*floor_pt))}
    return svg, anchors


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(path, os.path.getsize(path))


def write_office(era):
    svg, anchors = build(era)
    suffix = "" if era is None else f"-era{era}"
    write(os.path.join(ROOT, "ui", "assets", f"office{suffix}.svg"), svg)
    write(os.path.join(ROOT, "ui", "assets", f"anchors{suffix}.json"), json.dumps(anchors, indent=2) + "\n")
    return svg


def main():
    ap = argparse.ArgumentParser(description="Generate the office SVGs and anchors.")
    which = ap.add_mutually_exclusive_group()
    which.add_argument("--era", type=int, choices=sorted(ERA_NAMES), help="write office-eraN.svg and anchors-eraN.json")
    which.add_argument("--all", action="store_true", help="write the K2 office, all five eras and tools/eras.html")
    args = ap.parse_args()
    if args.all:
        write_office(None)
        figs = [f'<figure><figcaption>Era {e} <span>· {ERA_NAMES[e]}</span></figcaption>{write_office(e)}</figure>' for e in sorted(ERA_NAMES)]
        write(os.path.join(ROOT, "tools", "eras.html"), ERAS_PAGE.replace("{figures}", "\n".join(figs)))
    else:
        write_office(args.era)


if __name__ == "__main__":
    main()
