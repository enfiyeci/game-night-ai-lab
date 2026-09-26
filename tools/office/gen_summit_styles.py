#!/usr/bin/env python3
"""Mockup-only: three art styles for the Geneva summit delegates and hall (docs/design/mockups).

Writes docs/design/mockups/summit-styles/{office,caricature,shoulder}.svg. Colours are token mixes only.
"""
import math
import os

import gen_office as G
import gen_president as GP

M, A, EDGE = G.M, G.A, G.EDGE
NAVY = GP.NAVY
DRAPE, DRAPE_D, BRASS = GP.DRAPE, GP.DRAPE_D, G.BRASS

PARTY = {
    "openbrain": ("OpenBrain", "OB", "var(--coral)"),
    "deepthink": ("DeepThink", "DT", "var(--sky)"),
    "west": ("The West", "W", M("sky", 55, "ink")),
    "east": ("The East", "E", M("coral", 55, "ink")),
    "qilin": ("Qilin", "QL", "var(--wood)"),
    "lodestar": ("Lodestar", "LS", "var(--teal)"),
}
ORDER = ["openbrain", "deepthink", "west", "east", "qilin", "lodestar"]
# A real read from the game (seed 2, outside testers checked by testers): who would sign.
LEAN = {"openbrain": "no", "deepthink": "no", "west": "yes", "east": "no", "qilin": "no", "lodestar": "yes"}

# Who the delegates are. Caricature parameters: face shape, nose, brows, eyes, extras.
CAST = {
    "openbrain": dict(skin=G.SK_LIGHT, hair=M("ink", 80, "wood"), style="short", glasses=False,
                      face="long", nose="sharp", brow="flat", eyes="narrow", extra="stubble"),
    "deepthink": dict(skin=G.SK_MED, hair=G.H_BROWN, style="curly", glasses=True,
                      face="round", nose="button", brow="worried", eyes="round", extra=""),
    "west": dict(skin=G.SK_LIGHT, hair=G.H_GREY, style="bald", glasses=False,
                 face="square", nose="bulb", brow="heavy", eyes="lidded", extra="jowls"),
    "east": dict(skin=G.SK_DARK, hair=G.H_BLACK, style="short", glasses=True,
                 face="oval", nose="broad", brow="arched", eyes="round", extra="beard"),
    "qilin": dict(skin=M("wood", 40, "paper"), hair=G.H_BLACK, style="bob", glasses=False,
                  face="heart", nose="small", brow="arched", eyes="almond", extra=""),
    "lodestar": dict(skin=M("wood", 80, "ink"), hair=G.H_BLACK, style="bun", glasses=False,
                     face="oval", nose="small", brow="soft", eyes="round", extra="earrings"),
}
XS = [175, 402, 614, 826, 1038, 1265]


def desk_top_y(x):
    t = (x - 60) / 1320
    return 566 - 92 * 4 * t * (1 - t)


# ---------------------------------------------------------------- hall
def hall_back(defs="s"):
    o = [f'<defs><linearGradient id="{defs}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:{M("sky", 45, "paper")}"/><stop offset="1" style="stop-color:{M("sky", 18, "paper")}"/></linearGradient>'
         f'<linearGradient id="{defs}shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.45"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:0"/></linearGradient>'
         f'<radialGradient id="{defs}vig" cx=".5" cy=".45" r=".75"><stop offset=".6" style="stop-color:var(--ink);stop-opacity:0"/><stop offset="1" style="stop-color:var(--ink);stop-opacity:.26"/></radialGradient>'
         f'<radialGradient id="{defs}pool" cx=".5" cy=".3" r=".7"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.4"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:0"/></radialGradient></defs>',
         f'<rect width="1440" height="900" style="fill:{M("cream", 62, "paper")}"/>']
    o.append("".join(f'<rect x="{x}" y="0" width="18" height="500" style="fill:{A("wood", 7)}"/>' for x in range(0, 1440, 48)))
    o.append(f'<rect y="0" width="1440" height="30" style="fill:{M("paper", 86, "cream")}"/><rect y="30" width="1440" height="6" style="fill:{M("cream", 70, "wood")}"/>')
    # tall windows with drapes, left and right of the screen
    for x in (86, 226, 1084, 1224):
        o.append(f'<rect x="{x - 8}" y="70" width="146" height="380" style="fill:{M("paper", 82, "ink")}"/>'
                 f'<rect x="{x}" y="78" width="130" height="364" style="fill:url(#{defs}sky)"/>'
                 f'<rect x="{x}" y="330" width="130" height="112" style="fill:{M("teal", 34, "paper")}"/>'
                 f'<path d="M{x + 14},104 L{x + 60},78 L{x + 84},78 L{x + 26},146 Z" style="fill:{A("paper", 45)}"/>'
                 f'<path d="M{x + 65},78 L{x + 65},442 M{x},{200} L{x + 130},200 M{x},{320} L{x + 130},320" style="stroke:{M("paper", 82, "ink")};stroke-width:4"/>')
    for x0, side in ((78, 1), (364, -1), (1076, 1), (1362, -1)):
        o.append(f'<path d="M{x0},60 L{x0 + side * 44},60 Q{x0 + side * 34},260 {x0 + side * 50},470 L{x0 - side * 4},470 Q{x0 + side * 8},260 {x0},60 Z" style="fill:{DRAPE};stroke:{EDGE}"/>'
                 + "".join(f'<path d="M{x0 + side * dx},70 Q{x0 + side * (dx - 5)},260 {x0 + side * (dx + 4)},464" style="fill:none;stroke:{DRAPE_D};stroke-width:3"/>' for dx in (14, 30)))
    # the screen in a wood frame, with the summit emblem above it
    o.append(f'<rect x="440" y="64" width="560" height="220" rx="10" style="fill:{M("wood", 58, "ink")};stroke:{EDGE}"/>'
             f'<rect x="454" y="78" width="532" height="192" rx="6" style="fill:{M("ink", 88, "sky")}"/>'
             f'<rect x="462" y="86" width="516" height="176" rx="4" style="fill:{M("sky", 34, "ink")}"/>'
             f'<path d="M462,86 H978 V150 Q720,120 462,160 Z" style="fill:var(--paper);opacity:.05"/>'
             f'<text x="720" y="142" text-anchor="middle" style="font:900 12px Nunito;letter-spacing:.22em;fill:{M("sky", 40, "paper")}">GENEVA SUMMIT</text>'
             f'<text x="720" y="186" text-anchor="middle" style="font:300 38px Nunito;fill:var(--paper)">The Pacing Summit</text>'
             f'<text x="720" y="220" text-anchor="middle" style="font:700 14px Nunito;fill:{M("paper", 66, "sky")}">Motion 1 · Outside testers in every lab</text>')
    # wainscot
    o.append(f'<rect y="470" width="1440" height="120" style="fill:{M("cream", 70, "wood")}"/><rect y="466" width="1440" height="8" style="fill:{M("paper", 80, "wood")}"/>')
    o.append("".join(f'<rect x="{x + 12}" y="486" width="126" height="92" rx="4" style="fill:none;stroke:{M("wood", 60, "cream")};stroke-width:3"/>' for x in range(0, 1440, 150)))
    # floor, carpet and light
    o.append(f'<rect y="588" width="1440" height="312" style="fill:{M("sky", 26, "cream")}"/>'
             f'<ellipse cx="720" cy="800" rx="700" ry="150" style="fill:{M("sky", 46, "cream")};stroke:{M("sky", 62, "ink")};stroke-width:6"/>'
             f'<ellipse cx="720" cy="800" rx="620" ry="126" style="fill:none;stroke:{M("cream", 60, "paper")};stroke-width:3"/>')
    o.append("".join(f'<circle cx="{720 + 570 * math.cos(t / 22 * 6.283):.1f}" cy="{800 + 116 * math.sin(t / 22 * 6.283):.1f}" r="5" style="fill:{BRASS}"/>' for t in range(22)))
    for x in (226, 1084):
        o.append(f'<polygon points="{x},590 {x + 130},590 {x + 220},900 {x - 90},900" style="fill:url(#{defs}shaft);opacity:.5"/>')
    return "".join(o)


def flags(tall=True):
    """Two summit flags, one at each edge: navy with a brass globe in laurels."""
    o = []
    for fx, sgn in ((44, 1), (1396, -1)):
        top = 120
        cloth = f'M{fx},{top + 10} Q{fx + sgn * 62},{top + 22} {fx + sgn * 70},{top + 80} Q{fx + sgn * 78},{top + 190} {fx + sgn * 56},{top + 280} Q{fx + sgn * 30},{top + 304} {fx + sgn * 4},{top + 290} Z'
        gx, gy = fx + sgn * 38, top + 140
        leaves = "".join(f'<ellipse cx="{gx + k * 22 * math.cos(a):.1f}" cy="{gy + 22 * math.sin(a):.1f}" rx="6" ry="2.6" transform="rotate({k * (math.degrees(a) + 90):.0f} {gx + k * 22 * math.cos(a):.1f} {gy + 22 * math.sin(a):.1f})" style="fill:{BRASS}"/>'
                         for k in (1, -1) for a in (math.radians(d) for d in (10, 40, 70, 100)))
        o.append(f'<ellipse cx="{fx}" cy="588" rx="22" ry="7" style="fill:{M(BRASS, 80, "ink")}"/>'
                 f'<path d="M{fx},588 L{fx},{top}" style="stroke:{M("wood", 55, "ink")};stroke-width:7;stroke-linecap:round"/>'
                 f'<circle cx="{fx}" cy="{top - 8}" r="10" style="fill:{BRASS};stroke:{EDGE}"/>'
                 f'<path d="{cloth}" style="fill:{NAVY};stroke:{EDGE};stroke-width:1.2"/>'
                 f'<circle cx="{gx}" cy="{gy}" r="15" style="fill:none;stroke:{BRASS};stroke-width:3"/>'
                 f'<path d="M{gx - 15},{gy} H{gx + 15} M{gx},{gy - 15} Q{gx - 10},{gy} {gx},{gy + 15} Q{gx + 10},{gy} {gx},{gy - 15}" style="fill:none;stroke:{BRASS};stroke-width:2"/>'
                 f'{leaves}'
                 f'<path d="M{fx + sgn * 30},{top + 30} Q{fx + sgn * 46},{top + 150} {fx + sgn * 30},{top + 280}" style="fill:none;stroke:{A("ink", 20)};stroke-width:6"/>')
    return "".join(o)


def desk(nameplates=True):
    top = "".join(f'{"M" if i == 0 else "L"}{x},{desk_top_y(x):.1f}' for i, x in enumerate(range(60, 1381, 20)))
    front = "".join(f'L{x},{desk_top_y(x) + 70:.1f}' for x in range(1380, 59, -20))
    o = [f'<path d="{top} {front} Z" style="fill:{GP.DESK};stroke:{EDGE}"/>']
    edge = "".join(f'L{x},{desk_top_y(x) + 16:.1f}' for x in range(1380, 59, -20))
    o.append(f'<path d="{top} {edge} Z" style="fill:{GP.DESK_T};stroke:{EDGE}"/>')

    if nameplates:
        for pid, x in zip(ORDER, XS):
            y = desk_top_y(x) + 26
            o.append(f'<g transform="translate({x},{y:.1f})"><rect x="-54" y="0" width="108" height="30" rx="4" style="fill:var(--paper);stroke:{EDGE}"/>'
                     f'<rect x="-54" y="0" width="108" height="6" rx="3" style="fill:{PARTY[pid][2]}"/>'
                     f'<text y="23" text-anchor="middle" style="font:900 14px Nunito;fill:var(--ink)">{PARTY[pid][0]}</text></g>')
    for x in XS:  # desk microphones
        y = desk_top_y(x) + 2
        o.append(f'<path d="M{x + 44},{y:.1f} Q{x + 40},{y - 26:.1f} {x + 28},{y - 40:.1f}" style="fill:none;stroke:{M("ink", 70, "paper")};stroke-width:2.5"/>'
                 f'<rect x="{x + 22}" y="{y - 50:.1f}" width="10" height="15" rx="5" transform="rotate(-35 {x + 27} {y - 42:.1f})" style="fill:var(--ink)"/>')
    return "".join(o)


def placard(x, y, lean, base):
    col, word = {"yes": ("var(--teal)", "SIGN"), "maybe": ("var(--wood)", "?"), "no": (M("ink", 55, "paper"), "NO")}[lean]
    return (f'<path d="M{x},{base:.1f} L{x},{y + 30}" style="stroke:{M("wood", 55, "ink")};stroke-width:4;stroke-linecap:round"/>'
            f'<ellipse cx="{x}" cy="{base:.1f}" rx="10" ry="3.5" style="fill:{M("wood", 55, "ink")}"/>'
            f'<rect x="{x - 30}" y="{y}" width="60" height="34" rx="5" style="fill:{col};stroke:var(--paper);stroke-width:2.5"/>'
            f'<text x="{x}" y="{y + 23}" text-anchor="middle" style="font:900 15px Nunito;fill:var(--paper)">{word}</text>')


def chair_back(x, y, s, pid):
    col = M(PARTY[pid][2], 40, "ink")
    return (f'<rect x="{x - 26 * s:.1f}" y="{y - 112 * s:.1f}" width="{52 * s:.1f}" height="{86 * s:.1f}" rx="{14 * s:.1f}" style="fill:{M("wood", 42, "ink")};stroke:{EDGE}"/>'
            f'<rect x="{x - 20 * s:.1f}" y="{y - 106 * s:.1f}" width="{40 * s:.1f}" height="{72 * s:.1f}" rx="{10 * s:.1f}" style="fill:{col}"/>')


# ---------------------------------------------------------------- faces
def cari_head(hx, hy, c, lean):
    """A caricature head in the President's manner, built from parameters."""
    sk, hr = c["skin"], c["hair"]
    skd = M(sk, 84, "ink")
    ink = "fill:none;stroke:var(--ink);stroke-linecap:round;stroke-linejoin:round"
    shapes = {
        "long": f'M{hx - 12},{hy - 6} C{hx - 12},{hy - 20} {hx + 12},{hy - 20} {hx + 12},{hy - 6} L{hx + 11},{hy + 10} C{hx + 9},{hy + 21} {hx - 9},{hy + 21} {hx - 11},{hy + 10} Z',
        "round": f'M{hx - 15},{hy} C{hx - 15},{hy - 19} {hx + 15},{hy - 19} {hx + 15},{hy} C{hx + 15},{hy + 17} {hx - 15},{hy + 17} {hx - 15},{hy} Z',
        "square": f'M{hx - 15},{hy - 5} C{hx - 15},{hy - 18} {hx + 15},{hy - 18} {hx + 15},{hy - 5} L{hx + 15},{hy + 8} C{hx + 15},{hy + 18} {hx - 15},{hy + 18} {hx - 15},{hy + 8} Z',
        "oval": f'M{hx - 13.5},{hy - 2} C{hx - 13.5},{hy - 18} {hx + 13.5},{hy - 18} {hx + 13.5},{hy - 2} C{hx + 13.5},{hy + 12} {hx + 6},{hy + 18} {hx},{hy + 18} C{hx - 6},{hy + 18} {hx - 13.5},{hy + 12} {hx - 13.5},{hy - 2} Z',
        "heart": f'M{hx - 14},{hy - 4} C{hx - 14},{hy - 18} {hx + 14},{hy - 18} {hx + 14},{hy - 4} C{hx + 13},{hy + 8} {hx + 5},{hy + 17} {hx},{hy + 18} C{hx - 5},{hy + 17} {hx - 13},{hy + 8} {hx - 14},{hy - 4} Z',
    }
    o = []
    if c["style"] == "long":
        o.append(f'<path d="M{hx - 16},{hy - 6} Q{hx},{hy - 26} {hx + 16},{hy - 6} L{hx + 17},{hy + 24} L{hx - 17},{hy + 24} Z" style="fill:{hr};stroke:{EDGE};stroke-width:.7"/>')
    if c["style"] == "bob":
        o.append(f'<path d="M{hx - 17},{hy - 4} Q{hx},{hy - 28} {hx + 17},{hy - 4} L{hx + 17},{hy + 14} Q{hx + 12},{hy + 17} {hx + 8},{hy + 13} L{hx - 8},{hy + 13} Q{hx - 12},{hy + 17} {hx - 17},{hy + 14} Z" style="fill:{hr};stroke:{EDGE};stroke-width:.7"/>')
    # ears
    o.append(f'<ellipse cx="{hx - 14}" cy="{hy + 1}" rx="3" ry="4.4" style="fill:{skd};stroke:{EDGE};stroke-width:.6"/>'
             f'<ellipse cx="{hx + 14}" cy="{hy + 1}" rx="3" ry="4.4" style="fill:{skd};stroke:{EDGE};stroke-width:.6"/>')
    if c["extra"] == "earrings":
        o.append(f'<circle cx="{hx - 14}" cy="{hy + 7}" r="1.8" style="fill:{BRASS}"/><circle cx="{hx + 14}" cy="{hy + 7}" r="1.8" style="fill:{BRASS}"/>')
    o.append(f'<path d="{shapes[c["face"]]}" style="fill:{sk};stroke:{EDGE};stroke-width:.8"/>')
    if c["extra"] == "jowls":
        o.append(f'<path d="M{hx - 14},{hy + 6} Q{hx - 13},{hy + 16} {hx - 5},{hy + 17} M{hx + 14},{hy + 6} Q{hx + 13},{hy + 16} {hx + 5},{hy + 17}" style="fill:none;stroke:{skd};stroke-width:1.1;stroke-linecap:round"/>')
    if c["extra"] == "stubble":
        o.append(f'<path d="M{hx - 10},{hy + 8} Q{hx},{hy + 22} {hx + 10},{hy + 8} Q{hx},{hy + 15} {hx - 10},{hy + 8} Z" style="fill:{A("ink", 16)}"/>')
    if c["extra"] == "beard":
        o.append(f'<path d="M{hx - 12},{hy + 4} Q{hx - 11},{hy + 20} {hx},{hy + 21} Q{hx + 11},{hy + 20} {hx + 12},{hy + 4} Q{hx + 6},{hy + 12} {hx},{hy + 11} Q{hx - 6},{hy + 12} {hx - 12},{hy + 4} Z" style="fill:{hr};stroke:{EDGE};stroke-width:.6"/>')
    # eyes, by type and by lean
    ey = hy + 1
    white = M(sk, 30, "paper")
    for ex in (hx - 5.5, hx + 5.5):
        if c["eyes"] == "lidded":
            o.append(f'<ellipse cx="{ex}" cy="{ey}" rx="4" ry="2.8" style="fill:{white}"/><ellipse cx="{ex}" cy="{ey + .5}" rx="2" ry="1.3" style="fill:var(--ink)"/>'
                     f'<path d="M{ex - 4},{ey - .4} Q{ex},{ey - 2.2} {ex + 4},{ey - .4}" style="{ink};stroke-width:1.3"/>')
        elif c["eyes"] == "narrow":
            o.append(f'<path d="M{ex - 3.5},{ey} Q{ex},{ey - 1.6} {ex + 3.5},{ey}" style="{ink};stroke-width:1.8"/>')
        elif c["eyes"] == "almond":
            o.append(f'<path d="M{ex - 3.8},{ey} Q{ex},{ey - 3} {ex + 3.8},{ey} Q{ex},{ey + 2} {ex - 3.8},{ey} Z" style="fill:{white}"/><circle cx="{ex}" cy="{ey - .2}" r="1.6" style="fill:var(--ink)"/>'
                     f'<path d="M{ex - 3.8},{ey} Q{ex},{ey - 3} {ex + 4.4},{ey - .6}" style="{ink};stroke-width:1.3"/>')
        else:
            o.append(f'<ellipse cx="{ex}" cy="{ey}" rx="2.1" ry="2.7" style="fill:var(--ink)"/><circle cx="{ex + .7}" cy="{ey - .9}" r=".7" style="fill:var(--paper)"/>')
    # brows, tilted by lean
    tilt = {"yes": -1.2, "maybe": 0, "no": 1.8}[lean]
    bw = {"heavy": 2.6, "flat": 1.8, "worried": 1.6, "arched": 1.5, "soft": 1.3}[c["brow"]]
    by = hy - 5.5
    if c["brow"] == "worried":
        o.append(f'<path d="M{hx - 9},{by + 1} L{hx - 3},{by - 2} M{hx + 3},{by - 2} L{hx + 9},{by + 1}" style="fill:none;stroke:{c["hair"]};stroke-width:{bw};stroke-linecap:round"/>')
    elif c["brow"] == "arched":
        o.append(f'<path d="M{hx - 9},{by + tilt * .3} Q{hx - 6},{by - 3} {hx - 2.5},{by + tilt} M{hx + 2.5},{by + tilt} Q{hx + 6},{by - 3} {hx + 9},{by + tilt * .3}" style="fill:none;stroke:{c["hair"]};stroke-width:{bw};stroke-linecap:round"/>')
    else:
        o.append(f'<path d="M{hx - 9.5},{by - tilt * .4} L{hx - 2.5},{by + tilt} M{hx + 2.5},{by + tilt} L{hx + 9.5},{by - tilt * .4}" style="fill:none;stroke:{c["hair"] if c["style"] != "bald" else M("ink", 60, "paper")};stroke-width:{bw};stroke-linecap:round"/>')
    # nose
    ny = hy + 6
    nose = {
        "sharp": f'M{hx},{hy + 1} L{hx + 3.5},{ny + 2} L{hx - .5},{ny + 2.6}',
        "button": f'M{hx - 2},{ny + 1} Q{hx},{ny + 3.5} {hx + 2},{ny + 1}',
        "bulb": f'M{hx - 1},{hy + 1} Q{hx - 1},{ny} {hx - 4},{ny + 2} Q{hx},{ny + 6} {hx + 4},{ny + 2} Q{hx + 1},{ny} {hx + 1},{hy + 1}',
        "broad": f'M{hx - 4},{ny + 1.5} Q{hx},{ny + 5} {hx + 4},{ny + 1.5}',
        "small": f'M{hx - 1.5},{ny + 1} Q{hx},{ny + 2.6} {hx + 1.5},{ny + 1}',
    }[c["nose"]]
    o.append(f'<path d="{nose}" style="fill:{skd if c["nose"] == "bulb" else "none"};stroke:{skd};stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round"/>')
    # mouth, by lean
    my = hy + 12
    if lean == "yes":
        o.append(f'<path d="M{hx - 5},{my - 1} Q{hx},{my + 4.5} {hx + 5},{my - 1} Z" style="fill:var(--ink)"/>'
                 f'<ellipse cx="{hx - 9}" cy="{hy + 7}" rx="2.6" ry="1.5" style="fill:{A("coral", 30)}"/><ellipse cx="{hx + 9}" cy="{hy + 7}" rx="2.6" ry="1.5" style="fill:{A("coral", 30)}"/>')
    elif lean == "maybe":
        o.append(f'<path d="M{hx - 4},{my} Q{hx},{my - 1.2} {hx + 4},{my + .8}" style="{ink};stroke-width:1.6"/>')
    else:
        o.append(f'<path d="M{hx - 4.5},{my + 1.2} Q{hx},{my - 2} {hx + 4.5},{my + 1.2}" style="{ink};stroke-width:1.7"/>')
    if c["glasses"]:
        gs = "fill:none;stroke:var(--ink);stroke-width:1.2"
        o.append(f'<rect x="{hx - 10}" y="{ey - 3.6}" width="8.4" height="7" rx="2.4" style="{gs}"/><rect x="{hx + 1.6}" y="{ey - 3.6}" width="8.4" height="7" rx="2.4" style="{gs}"/>'
                 f'<path d="M{hx - 1.6},{ey - 1} L{hx + 1.6},{ey - 1}" style="{gs}"/>')
    # hair on top
    s = f"fill:{hr};stroke:{EDGE};stroke-width:.7"
    st = c["style"]
    if st == "short":
        o.append(f'<path d="M{hx - 14},{hy - 3} Q{hx - 16},{hy - 21} {hx + 1},{hy - 21} Q{hx + 17},{hy - 20} {hx + 14},{hy - 2} Q{hx + 11},{hy - 12} {hx + 2},{hy - 13} Q{hx - 8},{hy - 14} {hx - 14},{hy - 3} Z" style="{s}"/>')
    elif st == "curly":
        o.append("".join(f'<circle cx="{hx + dx}" cy="{hy + dy}" r="{r}" style="{s}"/>' for dx, dy, r in
                         [(-13, -7, 5.5), (-8, -15, 6.5), (0, -18, 7), (8, -16, 6.5), (14, -8, 6)]))
    elif st == "bald":
        o.append(f'<path d="M{hx + 9},{hy - 7} Q{hx + 16},{hy - 6} {hx + 15},{hy + 3} L{hx + 12},{hy + 2} Q{hx + 12},{hy - 3} {hx + 8},{hy - 5} Z" style="{s}"/>'
                 f'<path d="M{hx - 15},{hy + 2} Q{hx - 15},{hy - 5} {hx - 10},{hy - 7} L{hx - 12},{hy + 2} Z" style="{s}"/>'
                 f'<path d="M{hx - 6},{hy - 14} Q{hx},{hy - 17} {hx + 6},{hy - 14}" style="fill:none;stroke:var(--paper);stroke-width:1.6;opacity:.5;stroke-linecap:round"/>')
    elif st == "bob":
        o.append(f'<path d="M{hx - 15},{hy - 1} Q{hx - 15},{hy - 20} {hx},{hy - 20} Q{hx + 15},{hy - 20} {hx + 15},{hy - 1} Q{hx + 6},{hy - 13} {hx - 15},{hy - 1} Z" style="{s}"/>')
    elif st == "bun":
        o.append(f'<circle cx="{hx}" cy="{hy - 22}" r="7.5" style="{s}"/>'
                 f'<path d="M{hx - 14},{hy - 2} Q{hx - 15},{hy - 19} {hx},{hy - 19} Q{hx + 15},{hy - 19} {hx + 14},{hy - 2} Q{hx + 6},{hy - 13} {hx},{hy - 12} Q{hx - 6},{hy - 13} {hx - 14},{hy - 2} Z" style="{s}"/>')
    return "".join(o)


def seated(pid, x, oy, s, mode):
    c = CAST[pid]
    lean = LEAN[pid]
    mood = {"yes": "happy", "maybe": "calm", "no": "uneasy"}[lean]
    suit = M(PARTY[pid][2], 38, "ink")
    p = dict(skin=c["skin"], hair=c["hair"], style=c["style"], shirt=suit, mood=mood if mode == "office" else "calm", suit=True, glasses=c["glasses"])
    body, hands, (hx, hy) = G.front_person(p)
    if mode != "office":
        body += cari_head(hx, hy, c, lean)
    g = f'<g transform="translate({x},{oy}) scale({s})">{body}</g>'
    h = f'<g transform="translate({x},{oy}) scale({s})">{hands}</g>'
    head = (x + hx * s, oy + hy * s)
    return g, h, head


def scene(mode):
    o = [hall_back(mode[:2]), flags()]
    s = 3.1 if mode != "shoulder" else 2.5
    people, hands, cards = [], [], []
    for pid, x in zip(ORDER, XS):
        oy = desk_top_y(x) + 30 * s
        g, h, (hx, hy) = seated(pid, x, oy, s, mode)
        people.append(chair_back(x, oy, s, pid) + g)
        hands.append(h)
        cards.append(placard(x + 70, hy - 50, LEAN[pid], desk_top_y(x + 70) + 6))
    o += people + [desk()] + hands + cards
    if mode == "shoulder":
        bs = 4.2
        for role, (bx, by) in (("ceo", (330, 1080)), ("policy", (1110, 1090))):
            col = M("coral", 55, "wood") if role == "ceo" else M("teal", 55, "wood")
            o.append(f'<g transform="translate({bx},{by}) scale({bs})">{G.back_person(G.PEOPLE[role])}{GP.armchair_front(col)}</g>')
    o.append(f'<rect width="1440" height="900" style="fill:url(#{mode[:2]}vig)"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" role="img" aria-label="Summit hall mockup">{"".join(o)}</svg>\n'


def main():
    root = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
    out = os.path.join(root, "docs", "design", "mockups", "summit-styles")
    os.makedirs(out, exist_ok=True)
    for mode in ("office", "caricature", "shoulder"):
        with open(os.path.join(out, f"{mode}.svg"), "w", encoding="utf-8") as f:
            f.write(scene(mode))


if __name__ == "__main__":
    main()
