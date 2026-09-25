#!/usr/bin/env python3
"""Generator for K-gdt-faithful.html (static mockup). Isometric office drawn as inline SVG."""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "K2-gdt-polished.html")

U = 62.0
C = 0.8660254 * U
S = 0.5 * U
OX, OY = 666.0, 262.0
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


def planeZ(z0, inner):  # floor-parallel plane; local (x*U, y*U)
    return f'<g transform="matrix(0.8660254,0.5,-0.8660254,0.5,{OX:.2f},{OY - z0 * U:.2f})">{inner}</g>'


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


# ---------------------------------------------------------------- people
def face(hx, hy, mood, glasses=False):
    o = []
    ex1, ex2 = hx - 7, hx + 1
    ey = hy + 1
    if mood == "uneasy":
        ey += 1
    o.append(f'<ellipse cx="{ex1}" cy="{ey}" rx="2" ry="2.6" style="fill:var(--ink)"/>')
    o.append(f'<ellipse cx="{ex2}" cy="{ey}" rx="2" ry="2.6" style="fill:var(--ink)"/>')
    o.append(f'<circle cx="{ex1 + .7}" cy="{ey - .9}" r=".7" style="fill:var(--paper)"/><circle cx="{ex2 + .7}" cy="{ey - .9}" r=".7" style="fill:var(--paper)"/>')
    bs = f"fill:none;stroke:{H_BLACK};stroke-width:1.4;stroke-linecap:round"
    if mood == "uneasy":
        o.append(f'<path d="M{hx - 11},{hy - 2.5} L{hx - 5},{hy - 7}" style="{bs};stroke-width:1.6"/>')
        o.append(f'<path d="M{hx - 1},{hy - 7} L{hx + 5},{hy - 2.5}" style="{bs};stroke-width:1.6"/>')
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
    body.append(face(hx, hy, mood, p.get("glasses")))
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
    return (f'<g transform="translate(-5,5)">'
            f'<path d="M0,-18 L0,-6" style="stroke:{M(col, 70, "ink")};stroke-width:4"/>'
            + "".join(f'<path d="M0,-4 L{dx},{dy}" style="stroke:{M(col, 70, "ink")};stroke-width:3;stroke-linecap:round"/>'
                      f'<circle cx="{dx}" cy="{dy + 1.5}" r="2.4" style="fill:var(--ink)"/>'
                      for dx, dy in [(-14, 0), (13, -1), (-8, 5), (9, 5), (1, -8)])
            + f'<ellipse cx="0" cy="-20" rx="18" ry="7" style="fill:{M(col, 88, "ink")};stroke:{EDGE};stroke-width:.8"/>'
            f'<rect x="-15" y="-50" width="30" height="30" rx="8" style="fill:{col};stroke:{EDGE};stroke-width:.8"/>'
            f'<rect x="-11" y="-46" width="22" height="19" rx="5" style="fill:{M(col, 88, "paper")}"/>'
            f'</g>')


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
    return (f'<polygon points="{pts(hull(cs))}" style="fill:{M("sky", 40, "paper")};stroke:{M("sky", 40, "paper")};'
            f'stroke-width:7;stroke-linejoin:round;opacity:.75;filter:blur(3.5px)"/>')


def contact(X0, Y0, r=0.42):
    return planeZ(0, f'<ellipse cx="{X0 * U:.1f}" cy="{Y0 * U:.1f}" rx="{r * U:.1f}" ry="{r * U:.1f}" style="fill:{A("ink", 20)};filter:blur(2.5px)"/>')


def ws_front(seat, facing, person, big=False, tag="", extras=""):
    X0, Y0 = seat

    def B(s0, f0, z, ds, df, h, base, **kw):
        if facing == "+y":
            return box(X0 + s0, Y0 + f0, z, ds, df, h, base, **kw)
        return box(X0 + f0, Y0 + s0, z, df, ds, h, base, **kw)

    def WP(s, f, z=0.0):
        return (X0 + s, Y0 + f, z) if facing == "+y" else (X0 + f, Y0 + s, z)

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
    o.append(f'<g transform="{tr}">{chair_behind(big, person.get("chair", CHAIR))}{body}</g>')
    o.append(B(-hw, f0, 0, 0.07, f1 - f0, 0.68, wood))
    o.append(B(hw - 0.07, f0, 0, 0.07, f1 - f0, 0.68, wood))
    o.append(B(-hw + 0.07, f1 - 0.06, 0.2, 2 * hw - 0.14, 0.05, 0.48, M(wood, 92, "paper")))
    o.append(B(-hw, f0, 0.68, 2 * hw, f1 - f0, 0.06, wood, top=M(wood, 88, "paper")))
    # keyboard + mouse
    o.append(B(-0.58, 0.37, 0.74, 0.7, 0.2, 0.025, KEYS, top=M("paper", 92, "ink")))
    o.append(B(0.24, 0.4, 0.74, 0.09, 0.13, 0.03, KEYS))
    o.append(extras_on_desk(extras, WP))
    o.append(f'<g transform="{tr}">{hands}</g>')
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
        if facing == "+y":
            o.append(planeY(Y0 + f1, f'<g transform="translate({X0 * U:.1f},{-0.46 * U:.1f})">{inner}</g>'))
        else:
            o.append(planeX(X0 + f1, Y0, f'<g transform="translate(0,{-0.46 * U:.1f})">{inner}</g>'))
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
    o.append(box(X0 - 0.8, y0, 0, 0.07, y1 - y0, 0.68, "wood"))
    o.append(box(X0 + 0.73, y0, 0, 0.07, y1 - y0, 0.68, "wood"))
    o.append(box(X0 - 0.8, y0, 0.68, 1.6, y1 - y0, 0.06, "wood", top=M("wood", 88, "paper")))
    # monitor: screen faces the viewer (+y face)
    mx0, mx1 = X0 - 0.08, X0 + 0.68
    o.append(box(X0 + 0.24, y0 + 0.08, 0.74, 0.1, 0.07, 0.08, MONITOR))
    o.append(box(mx0, y0 + 0.05, 0.8, mx1 - mx0, 0.05, 0.48, MONITOR))
    o.append(planeY(y0 + 0.1, screen_code(mx0 * U + 3, mx1 * U - 3, -1.25 * U, -0.83 * U, variant)))
    o.append(box(X0 - 0.38, Y0 - 0.66, 0.74, 0.6, 0.2, 0.025, KEYS, top=M("paper", 92, "ink")))
    o.append(mug(X0 - 0.58, Y0 - 0.85, 0.74, "var(--sky)" if variant == "loss" else "var(--coral)"))
    ax, ay = P(X0, Y0)
    o.append(contact(X0 - 0.05, Y0 + 0.1))
    o.append(f'<g transform="translate({ax:.1f},{ay:.1f}) scale({K})">{back_person(person)}{chair_front()}</g>')
    return "".join(o), (ax + 2 * K, ay - 76 * K)


# ---------------------------------------------------------------- the room
def room():
    o = []
    # floor slab edges
    sl = 0.2
    o.append(poly([P(-T, D, 0), P(W, D, 0), P(W, D, -sl), P(-T, D, -sl)], M("teal", 55, "ink")))
    o.append(poly([P(W, -T, 0), P(W, D, 0), P(W, D, -sl), P(W, -T, -sl)], M("teal", 42, "ink")))
    floor = M("teal", 82, "paper")
    o.append(poly([P(0, 0), P(W, 0), P(W, D), P(0, D)], floor))
    # carpet tiles
    g = []
    for i in range(1, int(W)):
        g.append(f'<path d="M{i * U},0 L{i * U},{D * U}"/>')
    for j in range(1, int(D)):
        g.append(f'<path d="M0,{j * U} L{W * U},{j * U}"/>')
    o.append(planeZ(0, f'<g style="stroke:{M("teal", 70, "ink")};stroke-width:1;opacity:.28">{"".join(g)}</g>'))
    # window light pool on the carpet
    o.append(planeZ(0, f'<defs><linearGradient id="pool" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{2.8 * U:.0f}" y2="0">'
                       f'<stop offset="0" style="stop-color:var(--paper);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:0"/></linearGradient></defs>'
                       f'<polygon points="0,{1.4 * U:.0f} 0,{3.9 * U:.0f} {2.8 * U:.0f},{4.7 * U:.0f} {2.8 * U:.0f},{2.2 * U:.0f}" style="fill:url(#pool);filter:blur(4px)"/>'))
    # rug under the CEO corner
    o.append(planeZ(0, f'<rect x="{5.35 * U}" y="{5.7 * U}" width="{3.85 * U}" height="{3.0 * U}" rx="14" '
                       f'style="fill:{M("cream", 78, "coral")};stroke:{M("coral", 55, "cream")};stroke-width:5"/>'
                       f'<rect x="{5.35 * U + 12}" y="{5.7 * U + 12}" width="{3.85 * U - 24}" height="{3.0 * U - 24}" rx="9" '
                       f'style="fill:none;stroke:{M("coral", 40, "cream")};stroke-width:2;stroke-dasharray:6 5"/>'))
    # walls
    wl_up, wl_lo = M("cream", 55, "paper"), M("cream", 82, "wood")
    wr_up, wr_lo = M("cream", 80, "paper"), M("cream", 70, "wood")
    wz = 1.0
    o.append(poly([P(0, 0, wz), P(0, D, wz), P(0, D, H), P(0, 0, H)], wl_up))
    o.append(poly([P(0, 0, 0), P(0, D, 0), P(0, D, wz), P(0, 0, wz)], wl_lo))
    o.append(poly([P(0, 0, wz), P(W, 0, wz), P(W, 0, H), P(0, 0, H)], wr_up))
    o.append('<defs><linearGradient id="wgl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.0"/>'
             '<stop offset=".55" style="stop-color:var(--paper);stop-opacity:.45"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:.1"/></linearGradient>'
             '<linearGradient id="wgr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--ink);stop-opacity:.07"/>'
             '<stop offset="1" style="stop-color:var(--ink);stop-opacity:0"/></linearGradient></defs>')
    o.append(poly([P(0, 0, 0), P(0, D, 0), P(0, D, H), P(0, 0, H)], "url(#wgl)", stroke=None))
    o.append(poly([P(0, 0, 0), P(W, 0, 0), P(W, 0, H), P(0, 0, H)], "url(#wgr)", stroke=None))
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
    # framed constitution
    a0, a1, b0, b1 = 2.1 * U, 3.3 * U, -2.3 * U, -1.3 * U
    lines = "".join(f'<rect x="{a0 + 14:.1f}" y="{b0 + 30 + i * 5.2:.1f}" width="{(a1 - a0 - 28) * (0.95 if i % 3 else 0.7):.1f}" height="1.6" style="fill:{A("ink", 35)}"/>'
                    for i in range(6))
    o.append(f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" rx="2" style="fill:{M("wood", 70, "ink")};stroke:{EDGE}"/>'
             f'<rect x="{a0 + 5:.1f}" y="{b0 + 5:.1f}" width="{a1 - a0 - 10:.1f}" height="{b1 - b0 - 10:.1f}" style="fill:var(--paper)"/>'
             f'<text x="{(a0 + a1) / 2:.1f}" y="{b0 + 22:.1f}" text-anchor="middle" style="font-family:\'Libre Baskerville\',Georgia,serif;font-style:italic;font-size:10.5px;fill:var(--ink)">Constitution</text>'
             f'<path d="M{a0 + 20:.1f},{b0 + 26:.1f} L{a1 - 20:.1f},{b0 + 26:.1f}" style="stroke:var(--coral);stroke-width:1"/>'
             + lines +
             f'<circle cx="{a1 - 16:.1f}" cy="{b1 - 14:.1f}" r="5" style="fill:var(--coral);opacity:.85"/>')
    # whiteboard with a loss curve
    a0, a1, b0, b1 = 4.65 * U, 7.35 * U, -2.32 * U, -1.15 * U
    w, h = a1 - a0, b1 - b0
    o.append(f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" style="fill:{M("paper", 80, "ink")};stroke:{EDGE}"/>'
             f'<rect x="{a0 + 4:.1f}" y="{b0 + 4:.1f}" width="{w - 8:.1f}" height="{h - 8:.1f}" rx="2" style="fill:var(--paper)"/>'
             f'<path d="M{a0 + 18:.1f},{b0 + 12:.1f} L{a0 + 18:.1f},{b1 - 14:.1f} L{a0 + w * 0.55:.1f},{b1 - 14:.1f}" style="fill:none;stroke:var(--ink);stroke-width:1.6;stroke-linecap:round"/>'
             f'<path d="M{a0 + 22:.1f},{b0 + 16:.1f} C{a0 + 40:.1f},{b0 + 48:.1f} {a0 + 60:.1f},{b1 - 26:.1f} {a0 + w * 0.53:.1f},{b1 - 22:.1f}" style="fill:none;stroke:var(--sky);stroke-width:2.4;stroke-linecap:round"/>'
             f'<path d="M{a0 + w * 0.53 - 6:.1f},{b1 - 30:.1f} l6,8 l7,-10" style="fill:none;stroke:var(--coral);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"/>'
             + "".join(f'<rect x="{a0 + w * 0.62:.1f}" y="{b0 + 16 + i * 9:.1f}" width="{w * (0.3 if i % 2 else 0.22):.1f}" height="2.2" rx="1" style="fill:{A("ink", 45) if i != 1 else "var(--coral)"}"/>'
                       for i in range(5))
             + f'<rect x="{a0 + w * 0.3:.1f}" y="{b1 - 2:.1f}" width="{w * 0.4:.1f}" height="5" rx="1.5" style="fill:{M("paper", 70, "ink")}"/>')
    # poster: a kestrel silhouette
    a0, a1, b0, b1 = 3.52 * U, 4.36 * U, -2.25 * U, -1.35 * U
    cx, cy = (a0 + a1) / 2, (b0 + b1) / 2
    o.append(f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{a1 - a0:.1f}" height="{b1 - b0:.1f}" style="fill:var(--sky);stroke:{EDGE}"/>'
             f'<circle cx="{cx + 8:.1f}" cy="{cy - 10:.1f}" r="9" style="fill:{M("coral", 60, "paper")}"/>'
             f'<path d="M{cx - 18:.1f},{cy - 2:.1f} Q{cx - 6:.1f},{cy - 10:.1f} {cx:.1f},{cy + 2:.1f} Q{cx + 6:.1f},{cy - 10:.1f} {cx + 18:.1f},{cy - 2:.1f} '
             f'Q{cx + 6:.1f},{cy - 2:.1f} {cx + 1:.1f},{cy + 8:.1f} L{cx - 1:.1f},{cy + 8:.1f} Q{cx - 6:.1f},{cy - 2:.1f} {cx - 18:.1f},{cy - 2:.1f} Z" style="fill:var(--ink)"/>'
             f'<rect x="{a0 + 8:.1f}" y="{b1 - 12:.1f}" width="{a1 - a0 - 16:.1f}" height="3" rx="1.5" style="fill:{A("paper", 75)}"/>')
    return planeY(0, "".join(o))


def left_wall_decor():
    o = []
    # window (a runs toward the back corner)
    a0, a1 = (D - 3.9) * U, (D - 1.4) * U
    b0, b1 = -2.3 * U, -1.0 * U
    w, h = a1 - a0, b1 - b0
    o.append(f'<rect x="{a0 - 4:.1f}" y="{b0 - 4:.1f}" width="{w + 8:.1f}" height="{h + 8:.1f}" rx="3" style="fill:var(--paper);stroke:{EDGE}"/>'
             f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" style="fill:{M("sky", 38, "paper")}"/>')
    # skyline + tree
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
    # clock
    ca, cb = (D - 5.25) * U, -2.15 * U
    o.append(f'<circle cx="{ca:.1f}" cy="{cb:.1f}" r="12" style="fill:var(--paper);stroke:var(--ink);stroke-width:2"/>'
             f'<path d="M{ca:.1f},{cb:.1f} L{ca:.1f},{cb - 8:.1f} M{ca:.1f},{cb:.1f} L{ca + 6:.1f},{cb + 2:.1f}" style="stroke:var(--ink);stroke-width:1.6;stroke-linecap:round"/>')
    # door
    a0, a1 = (D - 7.75) * U, (D - 6.35) * U
    b0 = -2.1 * U
    w = a1 - a0
    dcol = M("wood", 85, "paper")
    o.append(f'<rect x="{a0 - 5:.1f}" y="{b0 - 5:.1f}" width="{w + 10:.1f}" height="{-b0 + 5:.1f}" style="fill:{M("wood", 60, "ink")}"/>'
             f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{-b0:.1f}" style="fill:{dcol};stroke:{EDGE}"/>'
             f'<rect x="{a0 + 9:.1f}" y="{b0 + 10:.1f}" width="{w - 18:.1f}" height="{-b0 * 0.36:.1f}" rx="2" style="fill:none;stroke:{M(dcol, 75, "ink")};stroke-width:1.5"/>'
             f'<rect x="{a0 + 9:.1f}" y="{b0 * 0.5 + 6:.1f}" width="{w - 18:.1f}" height="{-b0 * 0.36:.1f}" rx="2" style="fill:none;stroke:{M(dcol, 75, "ink")};stroke-width:1.5"/>'
             f'<circle cx="{a1 - 10:.1f}" cy="{b0 * 0.48:.1f}" r="3" style="fill:{M("cream", 60, "ink")}"/>')
    return planeX(0, D, "".join(o))


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
    o = [shadow(8.65, 0.1, 2.2, 1.2, 0.08)]
    body = M("ink", 86, "sky")
    leds = []
    for rx0, rx1, rid in [(8.7, 9.7, 0), (9.8, 10.8, 1)]:
        o.append(box(rx0, 0.12, 0, rx1 - rx0, 1.13, 2.35, body, top=M(body, 80, "paper")))
        inner = []
        a0, a1 = rx0 * U + 6, rx1 * U - 6
        for j in range(12):
            bt = -2.35 * U + 8 + j * 10.2
            inner.append(f'<rect x="{a0:.1f}" y="{bt:.1f}" width="{a1 - a0:.1f}" height="8" rx="1" style="fill:{M("ink", 70, "paper")}"/>')
            for q in range(5):
                col = ["var(--teal)", M("teal", 60, "paper"), "var(--coral)", "var(--sky)", M("teal", 60, "paper")][(q + j + rid) % 5]
                dl = ((j * 7 + q * 3 + rid * 5) % 11) * 0.13
                inner.append(f'<rect class="led" x="{a1 - 8 - q * 6:.1f}" y="{bt + 2.5:.1f}" width="3.2" height="3" rx=".8" style="fill:{col};animation-delay:-{dl:.2f}s"/>')
            inner.append(f'<rect x="{a0 + 3:.1f}" y="{bt + 3:.1f}" width="{(a1 - a0) * 0.35:.1f}" height="1.6" style="fill:{A("paper", 25)}"/>')
        leds.append(planeY(1.25, "".join(inner)))
        # side vents on +x face of rack 2
        if rid == 1:
            v = "".join(f'<rect x="{(1.25 - 0.18) * U - 40:.1f}" y="{-2.35 * U + 14 + j * 12:.1f}" width="34" height="2.4" rx="1.2" style="fill:{M(body, 70, "ink")}"/>' for j in range(9))
            leds.append(planeX(rx1, 1.25, v))
        o.append(leds[-1] if rid == 0 else "".join(leds[1:]))
    return "".join(o)


def cables():
    s = f"fill:none;stroke:{M('ink', 78, 'sky')};stroke-width:3.2;stroke-linecap:round"
    s2 = f"fill:none;stroke:{M('coral', 60, 'ink')};stroke-width:2.6;stroke-linecap:round"
    return planeZ(0, f'<path d="M{8.9 * U},{1.3 * U} C{8.4 * U},{2.2 * U} {7.9 * U},{2.1 * U} {7.35 * U},{1.75 * U}" style="{s}"/>'
                     f'<path d="M{9.0 * U},{1.3 * U} C{8.5 * U},{2.55 * U} {6.4 * U},{2.4 * U} {5.6 * U},{2.15 * U} C{5.3 * U},{2.05 * U} {5.1 * U},{1.9 * U} {4.95 * U},{1.75 * U}" style="{s2}"/>')


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


# ---------------------------------------------------------------- training bubbles
def cap_bubble(x, y, r=7.5, delay=0.0, cls="bob"):
    return (f'<g class="{cls}" style="animation-delay:-{delay:.2f}s">'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" style="fill:var(--coral);stroke:{M("coral", 70, "ink")};stroke-width:1.2"/>'
            f'<ellipse cx="{x - r * 0.35:.1f}" cy="{y - r * 0.38:.1f}" rx="{r * 0.32:.1f}" ry="{r * 0.22:.1f}" style="fill:{A("paper", 75)}"/></g>')


def ali_bubble(x, y, r=7, delay=0.0, cls="bob"):
    return (f'<g class="{cls}" style="animation-delay:-{delay:.2f}s">'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" style="fill:{A("paper", 55)};stroke:var(--sky);stroke-width:3.2"/></g>')


# ---------------------------------------------------------------- people roster
PEOPLE = {
    "ceo": dict(skin=SK_MED, hair=H_BLACK, style="short", shirt=M("ink", 78, "sky"), mood="happy", suit=True, chair=M("coral", 55, "ink")),
    "hor": dict(skin=SK_DARK, hair=H_BLACK, style="curly", shirt="var(--sky)", mood="calm", glasses=True, collar="var(--paper)"),
    "hos": dict(skin=SK_LIGHT, hair=H_AUBURN, style="bun", shirt="var(--teal)", mood="uneasy", collar=M("teal", 60, "paper")),
    "cfo": dict(skin=SK_LIGHT, hair=H_GREY, style="bald", shirt=M("cream", 70, "paper"), mood="focused", glasses=True, collar="var(--paper)"),
    "pol": dict(skin=SK_MED, hair=H_BROWN, style="long", shirt="var(--coral)", mood="calm", headset=True),
    "ra": dict(skin=SK_MED, hair=H_BROWN, shirt=M("teal", 70, "ink"), hood=True, headphones=True),
    "rb": dict(skin=SK_LIGHT, hair=H_BLACK, shirt=M("sky", 65, "paper"), ponytail=True),
}


def scene():
    o = [room(), right_wall_decor(), left_wall_decor(), cables()]
    o.append(bookshelf())
    o.append(plant(0.55, 1.1))
    o.append(rack())
    ra, ra_head = ws_back((4.2, 2.35), PEOPLE["ra"], "code")
    rb, rb_head = ws_back((6.6, 2.35), PEOPLE["rb"], "loss")
    o += [ra, rb]
    hor, _ = ws_front((1.5, 4.35), "+x", PEOPLE["hor"], tag="Research", extras=[("papers", 0.5, 0.8), ("mug2", 0.55, 0.45)])
    o.append(hor)
    o.append(water_cooler())
    hos, hos_head = ws_front((4.9, 4.15), "+y", PEOPLE["hos"], tag="Safety", extras=[("papers", 0.45, 0.75), ("plant", 0.62, 0.45)])
    o.append(hos)
    cfo, _ = ws_front((8.55, 4.35), "+y", PEOPLE["cfo"], tag="CFO", extras=[("calc", 0.5, 0.75), ("papers", 0.5, 0.45)])
    o.append(cfo)
    pol, _ = ws_front((1.9, 6.95), "+x", PEOPLE["pol"], tag="Policy", extras=[("phone", 0.5, 0.5), ("mug", 0.55, 0.85)])
    o.append(pol)
    ceo, _ = ws_front((7.25, 6.4), "+y", PEOPLE["ceo"], big=True, tag="You · CEO",
                      extras=[("papers", 0.75, 0.55), ("mug", 1.05, 0.9), ("plant", 1.1, 0.45)])
    o.append(ceo)
    o.append(lounge())
    o.append(plant(0.6, 8.4))
    o.append(plant(10.5, 8.45))
    # training bubbles: filled discs = capability, hollow rings = alignment
    b = []
    rx, ry = ra_head
    b += [cap_bubble(rx + 4, ry - 34, r=8.5, delay=0.2), ali_bubble(rx + 26, ry - 58, r=8, delay=1.1), cap_bubble(rx - 12, ry - 80, r=7.5, delay=0.7)]
    bx, by = rb_head
    b += [cap_bubble(bx - 4, by - 32, r=8.5, delay=0.5), cap_bubble(bx + 22, by - 62, r=7.5, delay=1.4), ali_bubble(bx - 14, by - 90, r=7, delay=0.9)]
    kx, ky = P(9.75, 0.7, 2.35)
    b += [cap_bubble(kx - 16, ky - 24, r=8.5, delay=0.3), cap_bubble(kx + 12, ky - 48, r=7.5, delay=1.0), cap_bubble(kx - 4, ky - 78, r=7, delay=1.6),
          ali_bubble(kx + 24, ky - 18, r=7.5, delay=0.6)]
    o.append("".join(b))
    # the one advisor marker: Head of Safety wants to talk
    hx, hy = hos_head
    o.append(f'<g class="alert" transform="translate({hx + 22:.1f},{hy - 50:.1f})">'
             f'<path d="M-15,-16 Q-15,-23 -8,-23 L8,-23 Q15,-23 15,-16 L15,2 Q15,9 8,9 L-1,9 L-9,18 L-7,9 L-8,9 Q-15,9 -15,2 Z" '
             f'style="fill:var(--paper);stroke:var(--ink);stroke-width:1.8;stroke-linejoin:round"/>'
             f'<text x="0" y="3.5" text-anchor="middle" style="font-size:22px;font-weight:900;fill:var(--coral)">!</text></g>')
    return "".join(o)


CSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "k2.css")).read()
BODY = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "k2-overlays.html")).read()


def html():
    svg = f'<svg class="room" width="1440" height="900" viewBox="0 0 1440 900" aria-label="Lab office">{scene()}</svg>'
    fit = '<script>/* fit-to-window */(function(){function f(){var z=Math.min(innerWidth/1440,innerHeight/900);document.documentElement.style.zoom=z<1?z:1;}f();addEventListener("resize",f);})();</script>'
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Lab Office</title>
<meta name="viewport" content="width=1440">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&family=Libre+Baskerville:ital@1&display=swap" rel="stylesheet">
<style>{CSS}</style></head>
<body>
{svg}
{BODY}
<script>(function(){{var t=document.getElementById(location.hash.slice(1));if(t&&t.classList.contains('ov'))t.style.display='block';}})();</script>
{fit}
</body></html>
"""


if __name__ == "__main__":
    with open(OUT, "w") as f:
        f.write(html())
    print(OUT, os.path.getsize(OUT))
