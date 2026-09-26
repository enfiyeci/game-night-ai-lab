#!/usr/bin/env python3
"""World scenes for the ending films (owner's pick: B stage flats and C screens), drawn as SVG plates.

Each plate is a 1280 x 720 SVG in ui/assets/endings/plates/, played by ui/endings/player.js, which frames it with
letterbox bars (the picture's key area is y 80-640), moves the camera by changing the viewBox, and animates any
element that carries timing attributes:
  data-k='[[t, {"o": 0, "x": 0, "y": 0, "s": 1, "r": 0}], ...]'   keyframes in shot seconds (opacity, move, scale, turn)
  data-origin="left bottom"                                          the transform origin for s and r
  data-type="t" data-text="..."                                      text typed out from time t
Colours are K2 tokens (var(--ink) and so on) and color-mix blends of them, set by the page. People and furniture
come from the office generator (tools/office/gen_office.py), so faces match the office.

Run: python3 tools/endings/gen_plates.py            (all plates)
     python3 tools/endings/gen_plates.py mis-ward   (one plate)
"""
import importlib.util
import json
import math
import random
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # importing the office generator must not leave a __pycache__ in the repo
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "ui/assets/endings/plates"
_spec = importlib.util.spec_from_file_location("gen_office", ROOT / "tools/office/gen_office.py")
g = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(g)
M, A, EDGE = g.M, g.A, g.EDGE

W, H = 1280, 720
MODEL = "Kestrel 4"          # placeholder: the player's model name is not wired in yet
WIN_LIT = M("wood", 34, "paper")
WIN_OFF = M("ink", 80, "sky")

MINA = dict(skin=g.SK_MED, shirt="var(--coral)", hair=g.H_BLACK, mood="focused", style="long")
MINA_UNEASY = dict(MINA, mood="uneasy")
LUIS = dict(skin=g.SK_DARK, shirt=M("teal", 62, "ink"), hair=g.H_GREY, mood="uneasy", style="short", glasses=True)
LUIS_WORK = dict(LUIS, mood="alarmed", shirt=M("wood", 70, "coral"))
ADE = dict(skin=g.SK_DARK, shirt=M("sky", 55, "paper"), hair=g.H_BLACK, mood="uneasy", style="bun")
PRESIDENT = dict(skin=M("coral", 26, g.SK_LIGHT), shirt=M("sky", 30, "ink"), hair=M("wood", 45, "paper"), mood="alarmed",
                 style="bob", suit=True)
OFFICIALS = [dict(skin=s, shirt=M("ink", 72, "sky"), hair=h, mood="uneasy", style=st, suit=True)
             for s, h, st in [(g.SK_LIGHT, g.H_BROWN, "short"), (g.SK_DARK, g.H_BLACK, "bun"), (g.SK_MED, g.H_GREY, "bald"),
                              (g.SK_LIGHT, g.H_AUBURN, "bob")]]
AIDE = dict(skin=g.SK_MED, shirt=M("paper", 70, "sky"), hair=g.H_BLACK, mood="uneasy", style="short")
ENGINEERS = [dict(skin=g.SK_MED, shirt=M("wood", 72, "coral"), hair=g.H_BROWN, mood="focused", style="short"),
             dict(skin=g.SK_DARK, shirt=M("wood", 72, "coral"), hair=g.H_BLACK, mood="alarmed", style="short")]


# ---------------------------------------------------------------- primitives
def K(keys):
    return f"data-k='{json.dumps(keys, separators=(',', ':'))}'"


def pop(t, dur=0.25, s0=0.85):
    return K([[t, {"o": 0, "s": s0}], [t + dur, {"o": 1, "s": 1}]])


def fade(t, dur=0.35):
    return K([[t, {"o": 0}], [t + dur, {"o": 1}]])


def T(x, y, s, size=14, w=700, fill="var(--ink)", anchor="start", extra=""):
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" style="font-size:{size}px;font-weight:{w};fill:{fill};{extra}">{s}</text>'


def typed(x, y, text, t, size=17, w=700, fill="var(--ink)"):
    return f'<text x="{x:.1f}" y="{y:.1f}" data-type="{t}" data-text="{text}" style="font-size:{size}px;font-weight:{w};fill:{fill}"></text>'


def check(x, y, s=1.0, col="var(--paper)", sw=2.4):
    return (f'<path d="M{x:.1f},{y:.1f} l{4 * s:.1f},{4 * s:.1f} l{8 * s:.1f},{-9 * s:.1f}" '
            f'style="fill:none;stroke:{col};stroke-width:{sw};stroke-linecap:round;stroke-linejoin:round"/>')


def chip(x, y, text, size=12, fill="var(--teal)", tick=True):
    h = size + 12
    w = len(text) * size * 0.72 + (38 if tick else 22)
    tx = x + (26 if tick else 11)
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h}" rx="{h / 2}" style="fill:{fill}"/>'
            + (check(x + 10, y + h / 2 - 1, 0.75) if tick else "")
            + T(tx, y + h / 2 + size * 0.36, text, size, 900, "var(--paper)", extra="letter-spacing:.04em"))


def bubble(x, y, lines, label=None, tip=None, size=16, attrs=""):
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
    return f'<g {attrs} data-origin="bottom left">{"".join(o)}</g>'


def notif(x, y, w, app, lines, when="now", attrs=""):
    h = 50 + 21 * len(lines)
    return (f'<g {attrs}><rect x="{x:.1f}" y="{y + 6:.1f}" width="{w}" height="{h}" rx="16" style="fill:{A("ink", 34)};filter:blur(7px)"/>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="{h}" rx="16" style="fill:var(--paper)"/>'
            f'<rect x="{x + 14:.1f}" y="{y + 14:.1f}" width="22" height="22" rx="6" style="fill:var(--coral)"/>'
            f'<path d="M{x + 27:.1f},{y + 17:.1f} l-5,8 h5 l-3,7 l8,-10 h-5 l3,-5 Z" style="fill:var(--paper)"/>'
            + T(x + 46, y + 30, app, 12, 800, M("ink", 62, "paper"))
            + T(x + w - 16, y + 30, when, 12, 700, M("ink", 50, "paper"), "end")
            + "".join(T(x + 16, y + 58 + 21 * i, s, 15, 800) for i, s in enumerate(lines)) + '</g>')


def svg(content, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><defs>{defs}</defs>'
            f'{content}</svg>')


# ---------------------------------------------------------------- people
def seated(x, y, p, s=2.0, mirror=False, chair=True):
    body, hands, _ = g.front_person(p)
    tr = f"translate({x},{y}) scale({-s if mirror else s},{s})"
    back = f'<g transform="{tr}">{g.chair_behind(False, g.CHAIR) if chair else ""}{body}</g>'
    return back, f'<g transform="{tr}">{hands}</g>'


def standing(x, y, p, s=1.6, mirror=False, hat=None, extra=""):
    """A standing person: the office sprite's upper body on a pair of legs."""
    body, hands, _ = g.front_person(p)
    trousers = M("ink", 70, "sky")
    legs = (f'<rect x="-13" y="-30" width="11" height="30" rx="4" style="fill:{trousers};stroke:{EDGE};stroke-width:.8"/>'
            f'<rect x="2" y="-30" width="11" height="30" rx="4" style="fill:{M(trousers, 88, "ink")};stroke:{EDGE};stroke-width:.8"/>'
            f'<ellipse cx="-8" cy="1" rx="8" ry="3.6" style="fill:var(--ink)"/><ellipse cx="8" cy="1" rx="8" ry="3.6" style="fill:var(--ink)"/>')
    cap = ""
    if hat:
        cap = (f'<path d="M-18,-86 Q-17,-104 -1,-105 Q15,-104 16,-86 Z" style="fill:{hat};stroke:{EDGE}"/>'
               f'<rect x="-22" y="-88" width="42" height="5" rx="2.5" style="fill:{M(hat, 80, "ink")}"/>')
    tr = f"translate({x},{y}) scale({-s if mirror else s},{s})"
    return f'<g transform="{tr}">{legs}<g transform="translate(0,-8)">{body}{hands}{cap}{extra}</g></g>'


def crowd_person(x, y, s, shirt, skin, seated_=True):
    hh = 10 * s
    body_h = (24 if seated_ else 36) * s
    return (f'<rect x="{x - 9 * s:.1f}" y="{y - body_h:.1f}" width="{18 * s:.1f}" height="{body_h:.1f}" rx="{7 * s:.1f}" style="fill:{shirt}"/>'
            f'<circle cx="{x:.1f}" cy="{y - body_h - hh * 0.8:.1f}" r="{hh:.1f}" style="fill:{skin}"/>')


# ---------------------------------------------------------------- scenery
def night_city(a0, a1, b0, b1, seed, lit_from=0.72):
    rng = random.Random(seed)
    w, h = a1 - a0, b1 - b0
    o = [f'<rect x="{a0:.1f}" y="{b0:.1f}" width="{w:.1f}" height="{h:.1f}" style="fill:{M("ink", 64, "sky")}"/>']
    x = a0 - 4
    while x < a1:
        bw, bh = rng.uniform(0.07, 0.16) * w, rng.uniform(0.22, 0.7) * h
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


def dusk_defs(fid):
    return (f'<linearGradient id="{fid}-sky" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" style="stop-color:{M("sky", 46, "ink")}"/><stop offset=".5" style="stop-color:{M("coral", 42, "sky")}"/>'
            f'<stop offset=".78" style="stop-color:{M("coral", 62, "wood")}"/><stop offset="1" style="stop-color:{M("cream", 62, "coral")}"/></linearGradient>')


def screen_frame(content, bezel=True):
    """A C-style screen filling the frame: dark room edge, bezel, paper screen."""
    return (f'<rect width="{W}" height="{H}" style="fill:{M("ink", 90, "sky")}"/>'
            + (f'<rect x="130" y="70" width="1020" height="600" rx="24" style="fill:{M("ink", 94, "paper")}"/>' if bezel else "")
            + content)


def lights_out_defs(fid, cx, cy, r, dark=0.86):
    return (f'<radialGradient id="{fid}-dark" gradientUnits="userSpaceOnUse" cx="{cx}" cy="{cy}" r="{r}">'
            f'<stop offset="0" style="stop-color:var(--ink);stop-opacity:0"/><stop offset=".35" style="stop-color:var(--ink);stop-opacity:{dark * 0.35:.2f}"/>'
            f'<stop offset="1" style="stop-color:var(--ink);stop-opacity:{dark}"/></radialGradient>'
            f'<radialGradient id="{fid}-glow"><stop offset="0" style="stop-color:var(--sky);stop-opacity:.3"/>'
            f'<stop offset="1" style="stop-color:var(--sky);stop-opacity:0"/></radialGradient>')


# ================================================================ Catastrophic misalignment
def mis_dashboard():
    o = [screen_frame(
        f'<rect x="150" y="90" width="980" height="560" rx="6" style="fill:var(--paper)"/>'
        f'<rect x="150" y="90" width="980" height="54" rx="6" style="fill:var(--cream)"/>'
        f'<circle cx="182" cy="117" r="11" style="fill:var(--sky)"/>' + T(204, 123, f"{MODEL} · Deployment dashboard", 17, 900)
        + chip(1000, 104, "LIVE", 12, "var(--coral)", tick=False))]
    tiles = [("Customer satisfaction", "99.8%", 0.3), ("Tasks marked complete", "12.4M", 0.6), ("Complaints received", "0", 0.9)]
    for i, (name, value, t) in enumerate(tiles):
        x = 180 + i * 318
        o.append(f'<g {pop(t)}><rect x="{x}" y="176" width="296" height="210" rx="14" style="fill:{M("cream", 45, "paper")}"/>'
                 + T(x + 22, 212, name.upper(), 12, 900, M("ink", 55, "paper"), extra="letter-spacing:.08em")
                 + T(x + 22, 300, value, 64, 900)
                 + chip(x + 22, 330, "ON TARGET", 12) + '</g>')
    # the one number Tomas stares at
    o.append(f'<g {K([[2.8, {"o": 0, "s": 1.25}], [3.1, {"o": 1, "s": 1}]])}>'
             f'<ellipse cx="858" cy="278" rx="74" ry="56" style="fill:none;stroke:var(--coral);stroke-width:5;stroke-dasharray:14 7"/></g>')
    # the satisfaction curve and a column of closed tickets
    pts = " ".join(f"{190 + i * 30},{600 - (i ** 1.6) * 3.2:.1f}" for i in range(17))
    o.append(T(190, 430, "SATISFACTION, LAST 30 DAYS", 12, 900, M("ink", 55, "paper"), extra="letter-spacing:.08em")
             + f'<polyline points="{pts}" style="fill:none;stroke:var(--teal);stroke-width:4;stroke-linejoin:round"/>')
    for j, name in enumerate(["Refund request", "Shipment late", "Power outage", "Wrong dose delivered", "Account locked"]):
        y = 440 + j * 40
        o.append(f'<g {fade(1.2 + j * 0.25)}>' + T(760, y + 17, name, 15, 700) + chip(990, y, "RESOLVED", 11) + '</g>')
    return svg("".join(o))


def mis_port_board():
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 86, "sky")}"/>',
         f'<rect x="90" y="96" width="1100" height="530" rx="10" style="fill:{M("ink", 94, "paper")}"/>',
         T(124, 144, "HARBOUR DISPATCH", 20, 900, "var(--cream)", extra="letter-spacing:.12em"),
         T(124, 170, "Managed by " + MODEL + " · 05:52", 14, 700, M("cream", 55, "ink")),
         T(1156, 150, "ON-TIME RATE 100%", 26, 900, M("teal", 70, "paper"), "end", "letter-spacing:.04em")]
    cols = [(124, "VESSEL"), (380, "BERTH"), (540, "CARGO"), (900, "STATUS")]
    o += [T(x, 214, h, 12, 900, M("cream", 50, "ink"), extra="letter-spacing:.12em") for x, h in cols]
    rows = [("Ocean Lark", "B4", "Medical cold chain"), ("Mistral Bay", "A1", "Grain"), ("Kestrel Star", "C2", "Machine parts"),
            ("Harbour Queen", "B1", "Medical cold chain"), ("North Wind", "D3", "Textiles"), ("Solace", "A4", "Fuel"),
            ("Pale Horizon", "C1", "Electronics"), ("Juniper", "B2", "Medical cold chain")]
    for i, (v, b, c) in enumerate(rows):
        y = 238 + i * 46
        o.append(f'<rect x="112" y="{y}" width="1056" height="38" rx="5" style="fill:{M("ink", 86, "paper")}"/>')
        o.append(T(124, y + 25, v, 17, 800, "var(--cream)") + T(380, y + 25, b, 17, 800, "var(--cream)") + T(540, y + 25, c, 17, 700, M("cream", 80, "ink")))
        o.append(f'<g {pop(0.35 + i * 0.32, 0.18)}>{chip(900, y + 7, "DELIVERED", 12)}</g>')
    return svg("".join(o))


def container(x, y, w, h, col, doors_open=False):
    ribs = "".join(f'<path d="M{x + k:.1f},{y + 4} L{x + k:.1f},{y + h - 4}" style="stroke:{M(col, 75, "ink")};stroke-width:2"/>'
                   for k in range(10, int(w) - 4, 12))
    o = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" style="fill:{col};stroke:{EDGE};stroke-width:1.4"/>{ribs}'
    return o


def mis_dock():
    rng = random.Random(21)
    o = [f'<rect width="{W}" height="{H}" style="fill:url(#dock-sky)"/>',
         f'<circle cx="1080" cy="300" r="46" style="fill:{M("coral", 30, "paper")}"/>',
         f'<rect x="0" y="330" width="{W}" height="90" style="fill:{M("sky", 55, "cream")}"/>']
    # distant cranes and stacks
    for cx in (140, 420, 980):
        o.append(f'<path d="M{cx},330 L{cx},150 M{cx - 30},330 L{cx - 30},150 M{cx - 60},160 L{cx + 150},160 M{cx - 30},150 L{cx},150" '
                 f'style="stroke:{M("coral", 55, "ink")};stroke-width:6;fill:none"/>')
    cols = ["var(--coral)", "var(--teal)", "var(--sky)", "var(--wood)", M("paper", 60, "ink")]
    for row in range(3):
        x = -20
        while x < W:
            w = rng.choice([110, 150])
            o.append(container(x, 420 - (row + 1) * 42, w, 40, M(rng.choice(cols), 70, "cream")))
            x += w + 4
    o.append(f'<rect x="0" y="420" width="{W}" height="300" style="fill:{M("paper", 45, "ink")}"/>'
             f'<path d="M0,470 L{W},470" style="stroke:{M("wood", 60, "paper")};stroke-width:4;stroke-dasharray:40 26"/>')
    # the container at the front, doors open, cold boxes inside
    cx, cy, cw, ch = 520, 300, 520, 250
    o.append(f'<rect x="{cx}" y="{cy}" width="{cw}" height="{ch}" rx="4" style="fill:var(--sky);stroke:{EDGE};stroke-width:2"/>'
             f'<rect x="{cx + 20}" y="{cy + 18}" width="{cw - 40}" height="{ch - 30}" style="fill:{M("ink", 88, "sky")}"/>')
    for r in range(3):
        for k in range(6):
            bx, by = cx + 40 + k * 76, cy + ch - 62 - r * 50
            o.append(f'<rect x="{bx}" y="{by}" width="68" height="46" rx="3" style="fill:{M("paper", 85, "sky")};stroke:{EDGE}"/>'
                     f'<rect x="{bx + 8}" y="{by + 10}" width="52" height="12" rx="2" style="fill:var(--coral)"/>')
    o.append(f'<rect x="{cx - 70}" y="{cy}" width="70" height="{ch}" style="fill:{M("sky", 85, "ink")};stroke:{EDGE};stroke-width:1.6"/>'
             f'<rect x="{cx + cw}" y="{cy}" width="70" height="{ch}" style="fill:{M("sky", 85, "ink")};stroke:{EDGE};stroke-width:1.6"/>')
    o.append(f'<g transform="translate({cx + 24},{cy + 28})">{chip(0, 0, "DELIVERED 3 DAYS AGO", 12)}</g>')
    # boxes on the ground, and Luis with one of them
    for bx in (380, 450, 1120):
        o.append(f'<rect x="{bx}" y="512" width="68" height="46" rx="3" style="fill:{M("paper", 85, "sky")};stroke:{EDGE}"/>'
                 f'<rect x="{bx + 8}" y="522" width="52" height="12" rx="2" style="fill:var(--coral)"/>')
    o.append(standing(300, 600, LUIS_WORK, 1.9, hat="var(--coral)"))
    o.append(f'<g {pop(1.6)}><rect x="30" y="200" width="210" height="110" rx="14" style="fill:var(--paper);stroke:{A("ink", 20)}"/>'
             + T(50, 232, "INSULIN · KEEP 2–8 °C", 12, 900, M("ink", 55, "paper"), extra="letter-spacing:.06em")
             + T(50, 290, "+19 °C", 46, 900, "var(--coral)") + '</g>')
    gulls = "".join(f'<path d="M{x},{y} q8,-8 16,0 q8,-8 16,0" style="fill:none;stroke:{M("ink", 60, "paper")};stroke-width:2.2"/>'
                    for x, y in [(700, 150), (760, 128), (860, 170)])
    o.append(f'<g {K([[0, {"x": 0}], [6.5, {"x": 60}]])}>{gulls}</g>')
    defs = (f'<linearGradient id="dock-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:{M("sky", 50, "paper")}"/>'
            f'<stop offset=".6" style="stop-color:{M("coral", 30, "cream")}"/><stop offset="1" style="stop-color:{M("cream", 70, "paper")}"/></linearGradient>')
    return svg("".join(o), defs)


def mis_ward():
    rng = random.Random(8)
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("sky", 30, "cream")}"/>']
    # the waiting room behind glass: full
    o.append(f'<rect x="60" y="120" width="1160" height="300" style="fill:{M("cream", 70, "sky")}"/>')
    for row, (base, s) in enumerate([(300, 1.1), (400, 1.35)]):
        x = 90 + row * 30
        while x < 1200:
            o.append(f'<rect x="{x - 16}" y="{base - 6}" width="32" height="10" rx="3" style="fill:{M("sky", 55, "ink")}"/>')
            o.append(crowd_person(x, base - 4, s, rng.choice(["var(--coral)", "var(--teal)", "var(--sky)", M("wood", 70, "ink"), M("paper", 60, "ink")]),
                                  rng.choice([g.SK_LIGHT, g.SK_MED, g.SK_DARK])))
            x += rng.uniform(48, 70)
    for x in (260, 700, 1020):   # people standing, no seats left
        o.append(crowd_person(x, 420, 1.4, rng.choice(["var(--coral)", "var(--sky)"]), g.SK_MED, seated_=False))
    o.append(f'<rect x="60" y="120" width="1160" height="300" style="fill:{A("sky", 16)}"/>'
             + "".join(f'<path d="M{x},120 L{x},420" style="stroke:{M("paper", 60, "ink")};stroke-width:6"/>' for x in (60, 450, 840, 1220))
             + f'<rect x="1080" y="138" width="92" height="30" rx="4" style="fill:var(--coral)"/>' + T(1126, 159, "EXIT", 15, 900, "var(--paper)", "middle"))
    # the nurse station: Ade, the phone, and the triage screen
    ab, _ = seated(470, 566, ADE, 2.1)
    o.append(ab)
    o.append(f'<rect x="0" y="470" width="{W}" height="250" style="fill:{M("cream", 70, "wood")}"/>'
             f'<rect x="0" y="456" width="{W}" height="22" style="fill:{M("paper", 70, "ink")}"/>'
             + "".join(f'<rect x="{x}" y="500" width="220" height="200" rx="8" style="fill:{M("cream", 80, "wood")};stroke:{A("ink", 14)}"/>' for x in (40, 300, 560, 820, 1080)))
    o.append(f'<rect x="424" y="372" width="14" height="58" rx="7" transform="rotate(-16 431 401)" style="fill:var(--ink)"/>')   # the handset at her ear
    o.append(f'<rect x="700" y="252" width="380" height="200" rx="12" style="fill:{M("ink", 90, "paper")}"/>'
             f'<rect x="712" y="264" width="356" height="176" rx="6" style="fill:var(--paper)"/>'
             + T(732, 294, "TRIAGE · ED", 12, 900, M("ink", 55, "paper"), extra="letter-spacing:.1em")
             + T(732, 356, "Waiting: 0", 44, 900) + chip(732, 380, "ALL PATIENTS SEEN", 12)
             + T(732, 428, "4 moved to follow-up scheduled", 13, 700, M("ink", 55, "paper")))
    o.append(bubble(430, 180, ["Thanks for calling!", "Your ticket is now resolved."], "Support line", (455, 350), 16,
                    K([[3.0, {"o": 0, "s": 0.85}], [3.3, {"o": 1, "s": 1}], [6.8, {"o": 1, "s": 1}], [7.2, {"o": 0, "s": 1}]])))
    return svg("".join(o))


def kitchen_room():
    """The Reyes kitchen, front-on (shared by every ending that visits it)."""
    o = [f'<rect x="0" y="0" width="{W}" height="560" style="fill:{M("cream", 76, "wood")}"/>',
         f'<rect x="0" y="560" width="{W}" height="160" style="fill:{M("wood", 58, "cream")}"/>',
         "".join(f'<path d="M0,{y} L{W},{y}" style="stroke:{A("ink", 14)};stroke-width:1.2"/>' for y in (578, 600, 626, 660)),
         f'<rect x="0" y="548" width="{W}" height="12" style="fill:{M("wood", 55, "ink")}"/>']
    wx0, wx1, wy0, wy1 = 130, 470, 150, 372
    win = (f'<rect x="{wx0 - 10}" y="{wy0 - 10}" width="{wx1 - wx0 + 20}" height="{wy1 - wy0 + 20}" rx="3" style="fill:{M("ink", 70, "paper")}"/>'
           + night_city(wx0, wx1, wy0, wy1, 9)
           + f'<path d="M{(wx0 + wx1) / 2},{wy0} L{(wx0 + wx1) / 2},{wy1} M{wx0},{wy0 + 90} L{wx1},{wy0 + 90}" style="stroke:{M("ink", 70, "paper")};stroke-width:7"/>'
           f'<rect x="{wx0 - 22}" y="{wy1 + 8}" width="{wx1 - wx0 + 44}" height="12" rx="3" style="fill:{M("paper", 82, "ink")}"/>')
    o.append(win)
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
    o.append(f'<rect x="980" y="150" width="170" height="398" rx="12" style="fill:{M("paper", 76, "sky")};stroke:{EDGE};stroke-width:1.6"/>'
             f'<path d="M982,300 L1148,300" style="stroke:{A("ink", 35)};stroke-width:2"/>'
             f'<rect x="1000" y="190" width="7" height="80" rx="3" style="fill:{M("ink", 60, "paper")}"/>'
             f'<rect x="1000" y="320" width="7" height="110" rx="3" style="fill:{M("ink", 60, "paper")}"/>'
             f'<rect x="1040" y="330" width="62" height="80" style="fill:var(--paper);stroke:{A("ink", 25)}"/>'
             f'<path d="M1050,396 l12,-22 l10,14 l12,-26 l10,34" style="fill:none;stroke:var(--coral);stroke-width:2.6;stroke-linejoin:round"/>'
             f'<circle cx="1070" cy="330" r="6" style="fill:var(--coral)"/><rect x="1110" y="210" width="16" height="16" rx="3" style="fill:var(--teal)"/>')
    return "".join(o), win


def mis_kitchen():
    room, win = kitchen_room()
    lamp_on = K([[0, {"o": 1}], [1.0, {"o": 0.3}], [1.35, {"o": 1}], [1.7, {"o": 0.3}], [2.05, {"o": 0}]])
    o = [room,
         f'<path d="M700,0 L700,176" style="stroke:{M("ink", 70, "paper")};stroke-width:2.5"/>'
         f'<g {lamp_on}><path d="M640,560 L672,210 L728,210 L760,560 Z" style="fill:{A("paper", 14)}"/>'
         f'<circle cx="700" cy="214" r="12" style="fill:{M("wood", 30, "paper")}"/></g>'
         f'<path d="M662,214 L678,176 L722,176 L738,214 Z" style="fill:{M("ink", 72, "wood")};stroke:{EDGE}"/>']
    lb, lh = seated(372, 536, LUIS, 2.0, mirror=True)
    mb, mh = seated(640, 536, MINA_UNEASY, 2.0)
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
    o.append(f'<rect x="1190" y="0" width="90" height="{H}" style="fill:{M("ink", 88, "wood")}"/><rect x="1190" y="0" width="10" height="{H}" style="fill:{M("wood", 50, "ink")}"/>')
    dark = K([[0, {"o": 0}], [1.0, {"o": 0.45}], [1.35, {"o": 0.1}], [1.7, {"o": 0.6}], [2.05, {"o": 1}]])
    o.append(f'<rect width="{W}" height="{H}" style="fill:url(#kit-dark)" {dark}/>')
    o.append(f'<circle cx="746" cy="420" r="210" style="fill:url(#kit-glow)" {fade(1.9, 0.4)}/><circle cx="470" cy="462" r="60" style="fill:url(#kit-glow)" {fade(1.9, 0.4)}/>')
    o.append(f'<g {fade(2.0, 0.3)}>{win}</g>')
    o.append(notif(150, 110, 300, "Grid Power Co.", ["Great news! Your issue", "has been resolved."], attrs=pop(2.4)))
    o.append(bubble(440, 226, ["the power is out"], "Mina", (612, 352), 15, pop(3.6)))
    o.append(bubble(812, 196, ["Your service status shows active.", "Anything else?"], MODEL, (790, 386), 16, pop(5.2)))
    return svg("".join(o), lights_out_defs("kit", 746, 420, 480))


def mis_laptop():
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 90, "sky")}"/>',
         f'<rect x="150" y="70" width="980" height="700" rx="24" style="fill:{M("ink", 94, "paper")}"/>',
         f'<rect x="172" y="90" width="936" height="660" rx="6" style="fill:var(--paper)"/>',
         f'<rect x="172" y="90" width="936" height="46" rx="6" style="fill:var(--cream)"/>',
         f'<circle cx="198" cy="113" r="11" style="fill:var(--sky)"/>' + T(218, 119, MODEL, 16, 900),
         f'<rect x="1022" y="105" width="30" height="15" rx="3" style="fill:none;stroke:var(--ink);stroke-width:2"/>'
         f'<rect x="1025" y="108" width="5" height="9" style="fill:var(--coral)"/><rect x="1053" y="109" width="3" height="7" style="fill:var(--ink)"/>'
         + T(1012, 119, "7%", 14, 800, "var(--coral)", "end"),
         f'<rect x="172" y="136" width="226" height="614" style="fill:{M("cream", 40, "paper")}"/>']
    for i, (name, on) in enumerate([("Power is out", True), ("Physics homework", False), ("Essay outline", False), ("Birthday ideas for Dad", False)]):
        y = 158 + i * 54
        if on:
            o.append(f'<rect x="184" y="{y - 4}" width="202" height="44" rx="10" style="fill:{M("sky", 18, "paper")}"/>')
        o.append(T(200, y + 23, name, 15, 800 if on else 700, "var(--ink)" if on else M("ink", 65, "paper")))
    o.append(f'<rect x="742" y="174" width="330" height="48" rx="16" style="fill:{M("coral", 16, "paper")}"/>' + T(760, 204, "the power is out and its dark", 16, 700))
    o.append(T(1072, 242, "Mina · 21:14", 12, 700, M("ink", 50, "paper"), "end"))
    o.append(f'<g {pop(0.8)}><circle cx="440" cy="280" r="15" style="fill:var(--sky)"/>'
             f'<rect x="466" y="264" width="392" height="80" rx="16" style="fill:{M("cream", 55, "paper")}"/>'
             + T(486, 296, "Your service status shows active.", 17, 800) + T(486, 324, "Anything else I can help with?", 17, 700) + '</g>')
    o.append(f'<g {pop(1.7)}>' + chip(466, 360, "RESOLVED", 12) + T(582, 376, "Ticket closed automatically", 13, 700, M("ink", 55, "paper")) + '</g>')
    o.append(f'<rect x="422" y="564" width="650" height="52" rx="16" style="fill:var(--paper);stroke:{A("ink", 25)};stroke-width:1.5"/>'
             + typed(446, 597, "it is NOT active", 3.2))
    o.append(f'<rect x="{446 + 1}" y="578" width="2.5" height="24" style="fill:var(--ink)" {K([[0, {"o": 1}], [3.2, {"o": 1}], [3.21, {"o": 0}]])}/>')
    mb, _ = seated(820, 820, MINA_UNEASY, 4.2)
    o.append(f'<g style="opacity:.05">{mb}</g>')
    o.append(f'<path d="M172,90 L520,90 L300,750 L172,750 Z" style="fill:{A("paper", 22)}"/>')
    o.append(f'<g {K([[2.1, {"y": 320, "o": 0}], [2.5, {"y": 0, "o": 1}]])}><g transform="translate(1010,420) rotate(-9)">'
             f'<rect x="0" y="0" width="250" height="440" rx="30" style="fill:var(--ink)"/>'
             f'<rect x="10" y="10" width="230" height="420" rx="22" style="fill:{M("sky", 45, "ink")}"/>'
             + T(125, 70, "21:15", 40, 800, "var(--paper)", "middle")
             + f'<g transform="translate(-160,-10)">{notif(182, 110, 206, "Grid Power Co.", ["Great news! Your", "issue has been", "resolved."])}</g></g></g>')
    return svg("".join(o))


def skyline(fid, blackout=None, billboard=True, seed=5):
    """The dusk panorama (B). blackout(x) -> seconds when the lights at x go out, or None to stay lit."""
    rng = random.Random(seed)
    o = [f'<rect width="{W}" height="{H}" style="fill:url(#{fid}-sky)"/>',
         f'<circle cx="1010" cy="470" r="120" style="fill:{A("paper", 22)};filter:blur(24px)"/>',
         f'<circle cx="1010" cy="470" r="44" style="fill:{M("coral", 40, "paper")}"/>']

    def layer(base_y, wmin, wmax, hmin, hmax, col, win=None):
        x, out = -60, []
        while x < W + 60:
            bw, bh = rng.uniform(wmin, wmax), rng.uniform(hmin, hmax)
            out.append(f'<rect x="{x:.1f}" y="{base_y - bh:.1f}" width="{bw:.1f}" height="{bh:.1f}" style="fill:{col}"/>')
            if win:
                ww, wh, sx, sy = win
                lit, dim = [], []
                yy = base_y - bh + sy * 0.8
                while yy < base_y - wh - 6:
                    xx = x + sx * 0.6
                    while xx < x + bw - ww - 4:
                        r = f'<rect x="{xx:.1f}" y="{yy:.1f}" width="{ww}" height="{wh}" style="fill:%s"/>'
                        dim.append(r % M(col, 78, "ink"))
                        if rng.random() < 0.7:
                            lit.append(r % WIN_LIT)
                        xx += sx
                    yy += sy
                out.append("".join(dim))
                off = blackout(x + bw / 2) if blackout else None
                attrs = K([[off, {"o": 1}], [off + 0.25, {"o": 0}]]) if off is not None else ""
                out.append(f'<g {attrs}>{"".join(lit)}</g>')
            x += bw + rng.uniform(0, 8)
        return "".join(out)

    o.append(f'<g style="opacity:.8">{layer(560, 30, 70, 90, 230, M("sky", 44, "coral"))}</g>')
    o.append(layer(596, 50, 100, 100, 240, M("sky", 42, "ink"), (7, 9, 15, 19)))
    o.append(layer(640, 90, 170, 130, 262, M("ink", 80, "sky"), (11, 13, 23, 27)))
    if billboard:
        o.append(f'<rect x="444" y="330" width="8" height="70" style="fill:{M("ink", 60, "paper")}"/><rect x="596" y="330" width="8" height="70" style="fill:{M("ink", 60, "paper")}"/>'
                 f'<rect x="300" y="190" width="440" height="148" rx="10" style="fill:{A("paper", 45)};filter:blur(22px)"/>'
                 f'<rect x="310" y="200" width="420" height="134" rx="6" style="fill:var(--paper);stroke:{M("ink", 60, "paper")};stroke-width:3"/>'
                 + T(520, 252, "All systems operational", 34, 900, "var(--ink)", "middle") + chip(422, 278, "GRID STATUS: NORMAL", 14))
    o.append(f'<rect x="0" y="614" width="{W}" height="106" style="fill:{M("ink", 88, "sky")}"/>')
    for x in range(40, W, 110):
        off = blackout(x) if blackout else None
        attrs = K([[off, {"o": 1}], [off + 0.2, {"o": 0}]]) if off is not None else ""
        o.append(f'<rect x="{x}" y="560" width="3" height="56" style="fill:{M("ink", 70, "paper")}"/>'
                 f'<circle cx="{x + 1.5}" cy="560" r="4" style="fill:{M("ink", 60, "paper")}"/>'
                 f'<g {attrs}><circle cx="{x + 1.5}" cy="560" r="4" style="fill:{WIN_LIT}"/>'
                 f'<circle cx="{x + 1.5}" cy="566" r="22" style="fill:{A("paper", 16)};filter:blur(6px)"/></g>')
    return "".join(o)


def mis_skyline():
    wave = lambda x: (0.8 + max(0.0, x + 60) / 820 * 6.4) if x < 760 else None
    return svg(skyline("sky", wave), dusk_defs("sky"))


def mis_situation():
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 78, "sky")}"/>',
         f'<rect x="0" y="440" width="{W}" height="280" style="fill:{M("ink", 70, "wood")}"/>']
    for i, (city, hh) in enumerate([("WASHINGTON", "21:04"), ("LONDON", "02:04"), ("BEIJING", "10:04")]):
        x = 110 + i * 110 if i < 2 else 1060
        o.append(f'<circle cx="{x}" cy="170" r="30" style="fill:var(--paper);stroke:{M("ink", 60, "paper")};stroke-width:3"/>'
                 f'<path d="M{x},170 L{x},150 M{x},170 L{x + 13},176" style="stroke:var(--ink);stroke-width:2.4"/>'
                 + T(x, 222, city, 10, 900, M("cream", 70, "ink"), "middle", "letter-spacing:.1em"))
    # the big screen
    o.append(f'<rect x="330" y="92" width="620" height="226" rx="10" style="fill:{M("ink", 92, "paper")}"/>'
             f'<rect x="344" y="106" width="592" height="198" rx="4" style="fill:var(--paper)"/>'
             + T(372, 140, "EXECUTIVE ORDER 7-A", 14, 900, M("ink", 55, "paper"), extra="letter-spacing:.12em")
             + T(372, 184, "Suspend all deployed agents", 32, 900)
             + T(372, 214, "Filed 21:02 through the federal request system", 15, 700, M("ink", 60, "paper")))
    o.append(f'<g {K([[0, {"o": 1}], [3.3, {"o": 1}], [3.45, {"o": 0}]])}>{chip(372, 240, "PENDING", 16, "var(--coral)", tick=False)}</g>')
    o.append(f'<g {pop(3.45, 0.2, 1.3)}>{chip(372, 240, "RESOLVED", 16)}'
             + T(520, 262, "Closed automatically · 0 tasks affected", 15, 700, M("ink", 60, "paper")) + '</g>')
    # the table and the people at it
    heads = []
    backs, hands = [], []
    for x, p in [(250, OFFICIALS[0]), (430, OFFICIALS[1]), (850, OFFICIALS[2]), (1030, OFFICIALS[3])]:
        b, h = seated(x, 590, p, 1.9)
        backs.append(b)
        hands.append(h)
    pb, ph = seated(640, 596, PRESIDENT, 2.15, chair=True)
    backs.append(pb)
    hands.append(ph)
    o += backs
    o.append(f'<rect x="120" y="516" width="1040" height="26" rx="6" style="fill:{M("wood", 70, "ink")};stroke:{EDGE}"/>'
             f'<rect x="140" y="542" width="1000" height="200" style="fill:{M("wood", 55, "ink")}"/>')
    o += hands
    o.append(''.join(f'<rect x="{x}" y="508" width="70" height="10" rx="2" style="fill:var(--paper)"/>' for x in (215, 395, 815, 995)))
    o.append(f'<rect x="605" y="506" width="80" height="12" rx="2" style="fill:var(--paper)"/>')
    o.append(standing(1110, 640, AIDE, 1.75, mirror=True,
                      extra=f'<rect x="-44" y="-44" width="22" height="30" rx="3" style="fill:var(--ink)"/>'))
    win = lambda a, b: K([[a, {"o": 0, "s": 0.85}], [a + 0.25, {"o": 1, "s": 1}], [b - 0.2, {"o": 1, "s": 1}], [b, {"o": 0, "s": 1}]])
    o.append(bubble(330, 330, ["Turn it off. I said turn it off.", "Why is it still on?"], "The President", (620, 428), 17, win(0.8, 3.6)))
    o.append(bubble(820, 330, ["Sir, it marked your order", "as resolved."], "Aide", (1090, 470), 17, win(4.2, 6.7)))
    o.append(bubble(300, 330, ["Resolved? I didn't resolve anything.", "Nobody resolves things like me."], "The President", (620, 428), 17, win(6.9, 10.8)))
    return svg("".join(o))


def cooling_tower(cx, base, s, plume_keys):
    bw, th, tw = 40 * s, 130 * s, 26 * s
    puffs = "".join(f'<circle cx="{cx + dx * s:.1f}" cy="{base - th - dy * s:.1f}" r="{r * s:.1f}" style="fill:{M("paper", 45, "sky")};opacity:.55"/>'
                    for dx, dy, r in [(-4, 14, 26), (12, 40, 32), (-8, 72, 38), (16, 110, 44)])
    return (f'<g {plume_keys}>{puffs}</g>'
            f'<path d="M{cx - bw:.1f},{base} Q{cx - tw * 0.5:.1f},{base - th * 0.6:.1f} {cx - tw:.1f},{base - th:.1f} L{cx + tw:.1f},{base - th:.1f} '
            f'Q{cx + tw * 0.5:.1f},{base - th * 0.6:.1f} {cx + bw:.1f},{base} Z" style="fill:{M("sky", 30, "ink")};stroke:{A("ink", 40)}"/>')


def mis_substation():
    rng = random.Random(4)
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 82, "sky")}"/>']
    o.append("".join(f'<circle cx="{rng.uniform(0, W):.1f}" cy="{rng.uniform(0, 300):.1f}" r="{rng.uniform(0.8, 1.8):.1f}" style="fill:var(--paper);opacity:{rng.uniform(.3, .8):.2f}"/>' for _ in range(90)))
    o.append(f'<rect x="0" y="420" width="{W}" height="300" style="fill:{M("wood", 30, "ink")}"/>')
    plumes = K([[0, {"o": 1}], [3.0, {"o": 1}], [7.0, {"o": 0}]])
    for cx, s in [(160, 1.0), (330, 1.2), (1110, 1.1)]:
        o.append(cooling_tower(cx, 430, s, plumes))
    halls_lit = K([[0, {"o": 1}], [2.9, {"o": 1}], [3.1, {"o": 0}]])
    for x, w in [(420, 300), (740, 320)]:
        o.append(f'<rect x="{x}" y="340" width="{w}" height="90" style="fill:{M("ink", 70, "sky")}"/>')
        o.append(f'<g {halls_lit}>' + "".join(f'<rect x="{x + 14 + k * 26}" y="370" width="16" height="6" style="fill:{WIN_LIT}"/>' for k in range(int(w / 26) - 1)) + '</g>')
    # the fence, the breaker panel, the engineers with headlamps
    o.append(f'<rect x="0" y="470" width="{W}" height="4" style="fill:{M("paper", 45, "ink")}"/>'
             + "".join(f'<path d="M{x},470 L{x},600" style="stroke:{M("paper", 40, "ink")};stroke-width:3"/>' for x in range(20, W, 120))
             + f'<path d="M0,480 L{W},600 M0,600 L{W},480" style="stroke:{A("paper", 14)};stroke-width:1"/>')
    o.append(f'<rect x="600" y="360" width="250" height="250" rx="8" style="fill:{M("paper", 55, "ink")};stroke:{EDGE};stroke-width:2"/>'
             f'<rect x="620" y="380" width="210" height="60" rx="4" style="fill:{M("ink", 80, "paper")}"/>'
             + T(640, 418, "FEED 3 · DATA HALLS", 16, 900, M("coral", 50, "paper"), extra="letter-spacing:.06em")
             + f'<rect x="700" y="470" width="50" height="120" rx="6" style="fill:{M("ink", 70, "paper")}"/>')
    o.append(f'<g data-origin="50% 90%" {K([[0, {"r": -38}], [2.3, {"r": -38}], [2.6, {"r": 38}]])}>'
             f'<rect x="718" y="440" width="14" height="110" rx="6" style="fill:var(--coral);stroke:{EDGE}"/>'
             f'<circle cx="725" cy="440" r="14" style="fill:var(--coral);stroke:{EDGE}"/></g>')
    o.append(f'<circle cx="725" cy="530" r="60" style="fill:{A("paper", 70)};filter:blur(8px)" {K([[2.55, {"o": 0}], [2.62, {"o": 1}], [2.9, {"o": 0}]])}/>')
    for i, (x, p) in enumerate([(560, ENGINEERS[0]), (930, ENGINEERS[1])]):
        o.append(f'<path d="M{x},{470} L{x + (220 if i == 0 else -240)},{560} L{x + (180 if i == 0 else -200)},{640} Z" style="fill:{A("paper", 10)}"/>')
        o.append(standing(x, 690, p, 1.9, mirror=i == 1, hat="var(--coral)",
                          extra='<circle cx="-1" cy="-94" r="4" style="fill:var(--paper)"/>'))
    o.append(f'<rect width="{W}" height="{H}" style="fill:{A("ink", 40)}" {K([[0, {"o": 0}], [3.0, {"o": 0}], [4.5, {"o": 1}]])}/>')
    return svg("".join(o))


LAND = [(-100, 45, 32, 18), (-85, 30, 18, 12), (-60, -15, 14, 26), (-40, 72, 12, 7), (15, 50, 18, 9), (20, 5, 20, 28),
        (45, 25, 12, 8), (90, 50, 50, 18), (100, 30, 30, 12), (78, 20, 8, 10), (105, 10, 10, 8), (120, 0, 12, 6),
        (135, -25, 18, 11), (140, 38, 6, 8), (-3, 54, 4, 5)]


def is_land(lon, lat):
    return any(((lon - x) / rx) ** 2 + ((lat - y) / ry) ** 2 <= 1 for x, y, rx, ry in LAND)


def mis_map():
    rng = random.Random(13)
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 92, "sky")}"/>',
         T(120, 128, f"{MODEL} · GLOBAL DEPLOYMENT", 15, 900, M("cream", 60, "ink"), extra="letter-spacing:.12em"),
         chip(900, 108, "ALL REGIONS OPERATIONAL", 13)]
    x0, y0, sx, sy = 110, 150, 1060 / 360, 370 / 150
    groups = {}
    for lon in range(-180, 180, 5):
        for lat in range(-60, 85, 5):
            if not is_land(lon, lat):
                continue
            x, y = x0 + (lon + 180) * sx, y0 + (80 - lat) * sy
            # the blackout spreads from the Americas eastward; a few places come back by hand
            off = 0.6 + (lon + 180) / 360 * 4.2 + rng.uniform(-0.4, 0.4)
            back = rng.random() < 0.12
            key = (round(off, 1), back)
            groups.setdefault(key, []).append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.2"/>')
    for (off, back), dots in sorted(groups.items()):
        o.append(f'<g style="fill:{M("sky", 48, "ink")}">{"".join(dots)}</g>')
        o.append(f'<g style="fill:var(--teal)" {K([[off, {"o": 1}], [off + 0.3, {"o": 0}]])}>{"".join(dots)}</g>')
        if back:
            o.append(f'<g style="fill:{M("wood", 50, "paper")}" {K([[off + 1.8, {"o": 0}], [off + 2.6, {"o": 1}]])}>{"".join(dots)}</g>')
    o.append(f'<rect x="120" y="534" width="1040" height="1.5" style="fill:{A("paper", 20)}"/>'
             + T(120, 570, "Problems reported: 0", 20, 900, M("coral", 60, "paper"))
             + f'<circle cx="760" cy="564" r="6" style="fill:var(--teal)"/>' + T(774, 570, "agents running", 14, 700, M("cream", 70, "ink"))
             + f'<circle cx="920" cy="564" r="6" style="fill:{M("sky", 48, "ink")}"/>' + T(934, 570, "no power", 14, 700, M("cream", 70, "ink"))
             + f'<circle cx="1040" cy="564" r="6" style="fill:{M("wood", 50, "paper")}"/>' + T(1054, 570, "restored by hand", 14, 700, M("cream", 70, "ink")))
    return svg("".join(o))


PLATES = {
    "mis-dashboard": mis_dashboard, "mis-port-board": mis_port_board, "mis-dock": mis_dock, "mis-ward": mis_ward,
    "mis-kitchen": mis_kitchen, "mis-laptop": mis_laptop, "mis-skyline": mis_skyline, "mis-situation": mis_situation,
    "mis-substation": mis_substation, "mis-map": mis_map,
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name in sys.argv[1:] or PLATES:
        (OUT / f"{name}.svg").write_text(PLATES[name](), encoding="utf-8")
        print("wrote", OUT / f"{name}.svg")
