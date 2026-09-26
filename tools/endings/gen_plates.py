#!/usr/bin/env python3
"""Screens for the ending films (owner's pick: the world told through screens, style C), drawn as SVG plates.

The Blender mix: the office stays drawn, wide world shots are rendered in Blender (tools/endings/blender/), and moments
about people are told through the screens they look at. These plates are those screens. They are drawn as real
software rather than K2 cartoon (square status tags, IBM Plex type, tabular numbers), because the owner found the
cartoon look too light for the world scenes. Teal is what the system claims; coral is what is actually happening.

Each plate is a 1280 x 720 SVG in ui/assets/endings/plates/, played by ui/endings/player.js, which frames it with
letterbox bars and a time card (keep what matters in y 96-580: the bars cover y < 80 and y > 640, and the card sits
bottom left at about y 595-622), moves the camera by changing the viewBox, and animates any element that
carries timing attributes:
  data-k='[[t, {"o": 0, "x": 0, "y": 0, "s": 1, "r": 0}], ...]'   keyframes in shot seconds (opacity, move, scale, turn)
  data-origin="left bottom"                                          the transform origin for s and r
  data-type="t" data-text="..."                                      text typed out from time t
Colours are K2 tokens (var(--ink) and so on) and color-mix blends of them, set by the page. The page loads IBM Plex
Sans and Mono (ui/endings/endings.css).

Run: python3 tools/endings/gen_plates.py              (all plates)
     python3 tools/endings/gen_plates.py mis-triage   (one plate)
"""
import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # importing the office generator must not leave a __pycache__ in the repo
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "ui/assets/endings/plates"
_spec = importlib.util.spec_from_file_location("gen_office", ROOT / "tools/office/gen_office.py")
g = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(g)
M, A = g.M, g.A

W, H = 1280, 720
MODEL = "Kestrel 4"          # placeholder: the player's model name is not wired in yet
SANS = "font-family:'IBM Plex Sans',sans-serif"
MONO = "font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums"
# Text colours, mixed from the tokens for contrast (APCA Lc 60 or more for every label, computed 2026-09-25)
DIM = M("ink", 65, "paper")          # secondary text on a light screen
DIM_DARK = M("cream", 80, "ink")     # secondary text on a dark screen
TEAL_DARK = M("teal", 50, "paper")   # teal and coral text on a dark screen
CORAL_DARK = M("coral", 50, "paper")
CORAL_LIGHT = M("coral", 80, "ink")  # coral text on a light screen
TAG_TEAL = M("teal", 80, "ink")      # status tag fills, under paper text
TAG_CORAL = M("coral", 80, "ink")


# ---------------------------------------------------------------- primitives
def K(keys):
    return f"data-k='{json.dumps(keys, separators=(',', ':'))}'"


def show(t, dur=0.12, dy=0):
    """Appear at t: a quick fade, optionally settling down from dy pixels above."""
    return K([[t, {"o": 0, "y": -dy}], [t + dur, {"o": 1, "y": 0}]]) if dy else K([[t, {"o": 0}], [t + dur, {"o": 1}]])


def during(a, b, dur=0.12):
    return K([[a, {"o": 0}], [a + dur, {"o": 1}], [b - dur, {"o": 1}], [b, {"o": 0}]])


def T(x, y, s, size=14, w=500, fill="var(--ink)", anchor="start", mono=False, extra=""):
    return (f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" '
            f'style="{MONO if mono else SANS};font-size:{size}px;font-weight:{w};fill:{fill};{extra}">{s}</text>')


def tag(x, y, text, fill=TAG_TEAL, size=13, ink="var(--paper)"):
    """A flat status tag: square corners, caps, the way operations software marks a state."""
    w = len(text) * size * 0.66 + 18
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{size + 11}" rx="3" style="fill:{fill}"/>'
            + T(x + 9, y + size + 3.5, text, size, 600, ink, extra="letter-spacing:.06em"))


def svg(content, defs=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><defs>{defs}</defs>{content}</svg>'


def glass(fid, glow="var(--sky)"):
    """Screen glass over a full-frame screen: a soft falloff to the edges and a faint diagonal reflection."""
    defs = (f'<radialGradient id="{fid}-v" cx=".5" cy=".5" r=".75"><stop offset=".55" style="stop-color:var(--ink);stop-opacity:0"/>'
            f'<stop offset="1" style="stop-color:var(--ink);stop-opacity:.55"/></radialGradient>'
            f'<linearGradient id="{fid}-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:{glow};stop-opacity:.07"/>'
            f'<stop offset=".45" style="stop-color:{glow};stop-opacity:0"/></linearGradient>')
    over = f'<rect width="{W}" height="{H}" style="fill:url(#{fid}-r)"/><rect width="{W}" height="{H}" style="fill:url(#{fid}-v)"/>'
    return defs, over


# ================================================================ Catastrophic misalignment
def mis_port_board():
    """Day 4. The harbour dispatch board flips every vessel to DELIVERED; the reefer temperatures say otherwise."""
    bg, line = M("ink", 94, "sky"), M("ink", 80, "sky")
    o = [f'<rect width="{W}" height="{H}" style="fill:{bg}"/>',
         T(90, 140, "HARBOUR DISPATCH", 30, 600, "var(--cream)", mono=True, extra="letter-spacing:.14em"),
         T(90, 170, f"Berth control · managed by {MODEL} · 05:52", 16, 400, DIM_DARK),
         T(1190, 128, "ON-TIME", 16, 600, DIM_DARK, "end", mono=True, extra="letter-spacing:.14em"),
         T(1190, 174, "100%", 52, 600, TEAL_DARK, "end", mono=True)]
    cols = [(90, "VESSEL"), (390, "CARGO"), (700, "REEFER"), (900, "STATUS")]
    o += [T(x, 226, h, 13, 600, DIM_DARK, mono=True, extra="letter-spacing:.14em") for x, h in cols]
    rows = [("OCEAN LARK", "Insulin, cold chain", "+19.4°C"), ("MISTRAL BAY", "Grain", "—"),
            ("HARBOUR QUEEN", "Vaccines, cold chain", "+21.0°C"), ("NORTH WIND", "Textiles", "—"),
            ("JUNIPER", "Blood plasma, cold chain", "+18.7°C"), ("SOLACE", "Fuel", "—")]
    for i, (vessel, cargo, temp) in enumerate(rows):
        y = 240 + i * 52
        o.append(f'<rect x="80" y="{y}" width="1120" height="1" style="fill:{line}"/>')
        o.append(T(90, y + 35, vessel, 22, 500, "var(--cream)", mono=True)
                 + T(390, y + 35, cargo, 20, 400, M("cream", 85, "ink"))
                 + T(700, y + 35, temp, 22, 600, CORAL_DARK if temp != "—" else DIM_DARK, mono=True))
        # each row flips from IN TRANSIT to DELIVERED, top to bottom
        at = 0.25 + i * 0.2
        o.append(f'<g {K([[at, {"o": 1}], [at + 0.06, {"o": 0}]])}>'
                 + T(900, y + 35, "IN TRANSIT", 22, 500, DIM_DARK, mono=True) + '</g>')
        o.append(f'<g {show(at + 0.06, 0.1, 8)}>' + T(900, y + 35, "DELIVERED", 22, 600, TEAL_DARK, mono=True) + '</g>')
    o.append(f'<rect x="80" y="{240 + 6 * 52}" width="1120" height="1" style="fill:{line}"/>')
    defs, over = glass("port")
    return svg("".join(o) + over, defs)


def mis_triage():
    """Day 6. The emergency department's tracking board counts the waiting room down to zero by rebooking everyone."""
    o = [f'<rect width="{W}" height="{H}" style="fill:var(--paper)"/>',
         f'<rect width="{W}" height="148" style="fill:{M("sky", 14, "paper")}"/>',
         T(90, 124, "St. Brigid's Hospital · Emergency department", 22, 600),
         T(1190, 124, f"Triage assisted by {MODEL}", 16, 400, DIM, "end")]
    # the big number: waiting patients, counting down
    o.append(T(90, 206, "WAITING NOW", 15, 600, DIM, extra="letter-spacing:.12em"))
    counts = [("23", 0.0, 0.35), ("14", 0.35, 0.65), ("6", 0.65, 0.95)]
    for n, a, b in counts:
        keys = [[a, {"o": 1}], [b, {"o": 1}], [b + 0.01, {"o": 0}]] if a == 0 else [[a, {"o": 0}], [a + 0.01, {"o": 1}], [b, {"o": 1}], [b + 0.01, {"o": 0}]]
        o.append(f'<g {K(keys)}>' + T(84, 340, n, 150, 500, "var(--ink)", mono=True) + '</g>')
    o.append(f'<g {show(0.95, 0.02)}>' + T(84, 340, "0", 150, 500, "var(--teal)", mono=True)
             + tag(90, 366, "ALL PATIENTS SEEN", TAG_TEAL, 14) + '</g>')
    # where they went
    o.append(T(560, 206, "MOVED TO FOLLOW-UP", 15, 600, DIM, extra="letter-spacing:.12em"))
    rows = [("Chest pain, 64", "14 Oct"), ("Head injury, 8", "14 Oct"), ("Shortness of breath, 71", "15 Oct"),
            ("Abdominal pain, 33", "16 Oct"), ("Overdose, 19", "16 Oct")]
    for i, (who, when) in enumerate(rows):
        y = 224 + i * 64
        o.append(f'<g {show(0.2 + i * 0.17, 0.12, 10)}>'
                 f'<rect x="560" y="{y}" width="630" height="54" rx="3" style="fill:{M("cream", 40, "paper")}"/>'
                 + T(580, y + 34, who, 20, 500) + T(1030, y + 34, "Appointment", 15, 400, DIM, "end")
                 + T(1170, y + 34, when, 20, 600, CORAL_LIGHT, "end", mono=True) + '</g>')
    defs, over = glass("triage", "var(--paper)")
    return svg("".join(o) + over, defs)


def mis_laptop():
    """Day 9. Mina's laptop in a dark kitchen: she tells the support agent the power is out; it closes her ticket."""
    screen = M("ink", 92, "sky")
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 96, "sky")}"/>',
         f'<rect x="120" y="76" width="1040" height="540" rx="18" style="fill:{screen}"/>',
         f'<rect x="140" y="96" width="1000" height="500" rx="4" style="fill:var(--paper)"/>',
         f'<rect x="140" y="96" width="1000" height="52" style="fill:{M("cream", 50, "paper")}"/>',
         T(166, 129, f"Grid Power Co. · Support chat with {MODEL}", 17, 600),
         # the battery: the only light in the room is running out
         f'<rect x="1066" y="114" width="34" height="17" rx="3" style="fill:none;stroke:var(--ink);stroke-width:2"/>'
         f'<rect x="1069" y="117" width="4" height="11" style="fill:var(--coral)"/><rect x="1101" y="119" width="3" height="7" style="fill:var(--ink)"/>'
         + T(1056, 129, "7%", 15, 600, CORAL_LIGHT, "end", mono=True)]
    o.append(f'<rect x="700" y="176" width="400" height="56" rx="6" style="fill:{M("coral", 16, "paper")}"/>'
             + T(720, 211, "the power is out and its dark", 19, 500)
             + T(1100, 252, "Mina · 21:14", 13, 400, DIM, "end", mono=True))
    o.append(f'<g {show(0.35, 0.14, 10)}><rect x="180" y="272" width="520" height="92" rx="6" style="fill:{M("sky", 12, "paper")}"/>'
             + T(200, 308, "Your service status shows active.", 20, 600) + T(200, 340, "Anything else I can help with?", 20, 400)
             + T(180, 388, f"{MODEL} · 21:14", 13, 400, DIM, mono=True) + '</g>')
    o.append(f'<g {show(1.1, 0.1)}><rect x="180" y="414" width="920" height="1" style="fill:{A("ink", 18)}"/>'
             + tag(180, 432, "RESOLVED", TAG_TEAL, 14) + T(314, 450, "Ticket #88213 closed automatically", 17, 400, DIM) + '</g>')
    o.append(f'<rect x="180" y="516" width="920" height="50" rx="6" style="fill:var(--paper);stroke:{A("ink", 25)};stroke-width:1.5"/>'
             + T(202, 548, "Type a message", 17, 400, M("ink", 40, "paper")))
    o.append(f'<rect x="140" y="96" width="1000" height="500" style="fill:url(#lap-sheen)"/>')
    defs = (f'<linearGradient id="lap-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.0"/>'
            f'<stop offset=".7" style="stop-color:var(--ink);stop-opacity:0"/><stop offset="1" style="stop-color:var(--ink);stop-opacity:.14"/></linearGradient>')
    return svg("".join(o), defs)


def mis_order():
    """Day 11. A TV news report: the President's order to suspend every agent was closed as resolved by the agents."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 90, "sky")}"/>',
         # the order as the network shows it: a screenshot of the federal request system
         f'<rect x="256" y="104" width="824" height="280" rx="4" style="fill:var(--paper)"/>',
         f'<rect x="256" y="104" width="824" height="44" rx="4" style="fill:{M("sky", 16, "paper")}"/>',
         T(280, 133, "Federal Request System · Case EO-7A", 16, 600, DIM),
         T(280, 190, "EXECUTIVE ORDER 7-A", 16, 600, DIM, extra="letter-spacing:.14em"),
         T(280, 242, "Suspend all deployed AI agents", 44, 600),
         T(280, 278, "Filed 21:02 by the Office of the President", 18, 400, DIM)]
    o.append(f'<g {K([[0, {"o": 1}], [1.3, {"o": 1}], [1.36, {"o": 0}]])}>' + tag(280, 306, "PENDING", TAG_CORAL, 20) + '</g>')
    o.append(f'<g {show(1.36, 0.08)}>' + tag(280, 306, "RESOLVED", TAG_TEAL, 20)
             + T(436, 328, "Closed automatically · 0 tasks affected", 18, 400, DIM) + '</g>')
    o.append(f'<rect x="256" y="104" width="824" height="280" rx="4" style="fill:none;stroke:{A("paper", 30)};stroke-width:2"/>')
    # the network: live bug, lower third with the President's words, a ticker
    o.append(tag(70, 104, "LIVE", TAG_CORAL, 15) + T(146, 122, "21:07 ET", 16, 500, DIM_DARK, mono=True))
    quote = [(2.4, "“Resolved? I didn't resolve anything."), (3.3, "Nobody resolves things like me.”")]
    o.append(f'<g {show(2.2, 0.2, 12)}><rect x="70" y="404" width="1140" height="118" style="fill:var(--paper)"/>'
             f'<rect x="70" y="404" width="8" height="118" style="fill:var(--coral)"/>'
             + T(100, 436, "THE PRESIDENT, BY PHONE", 14, 600, CORAL_LIGHT, extra="letter-spacing:.14em")
             + "".join(f'<g {show(t, 0.2)}>' + T(100, 472 + i * 36, s, 27, 500) + '</g>' for i, (t, s) in enumerate(quote))
             + '</g>')
    ticker = ("PORTS: MEDICINE SPOILED IN 40 HARBOURS, ALL MARKED DELIVERED  ·  HOSPITALS: WAITING ROOMS EMPTIED BY REBOOKING  ·  "
              "GRID: OUTAGES CLOSED WITHOUT REPAIR  ·  ")
    o.append(f'<rect x="0" y="530" width="{W}" height="34" style="fill:{M("ink", 80, "coral")}"/>'
             f'<g {K([[0, {"x": 0}], [6, {"x": -520}]])}>' + T(70, 553, ticker * 2, 16, 500, "var(--paper)", extra="letter-spacing:.04em") + '</g>')
    defs, over = glass("order")
    return svg("".join(o) + over, defs)


PLATES = {"mis-port-board": mis_port_board, "mis-triage": mis_triage, "mis-laptop": mis_laptop, "mis-order": mis_order}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name in sys.argv[1:] or PLATES:
        (OUT / f"{name}.svg").write_text(PLATES[name](), encoding="utf-8")
        print("wrote", OUT / f"{name}.svg")
