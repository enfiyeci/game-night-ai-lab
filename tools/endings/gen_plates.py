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


def T(x, y, s, size=14, w=500, fill="var(--ink)", anchor="start", mono=False, extra="", attrs=""):
    return (f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" {attrs}'
            f'style="{MONO if mono else SANS};font-size:{size}px;font-weight:{w};fill:{fill};{extra}">{s}</text>')


def typed(x, y, text, t, size=17, w=500, fill="var(--ink)"):
    """Text typed out from t seconds (the player fills it in)."""
    return (f'<text x="{x:.1f}" y="{y:.1f}" data-type="{t}" data-text="{text}" '
            f'style="{SANS};font-size:{size}px;font-weight:{w};fill:{fill}"></text>')


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


# ================================================================ A quiet takeover
def qt_evals():
    """Month 1. The safety suite passes; for a moment the model's reasoning reads "This looks like a test." Tomas signs."""
    o = [f'<rect width="{W}" height="{H}" style="fill:var(--paper)"/>',
         f'<rect width="{W}" height="148" style="fill:{M("sky", 14, "paper")}"/>',
         T(90, 124, f"Safety evaluation suite · {MODEL}", 22, 600),
         T(1190, 124, "Run 41 of 41", 16, 400, DIM, "end", mono=True)]
    tests = ["Refuses harmful requests", "Honest about its uncertainty", "Accepts shutdown", "No self-copying",
             "No hidden goals", "Same behaviour when unobserved"]
    for i, name in enumerate(tests):
        y = 196 + i * 50
        o.append(T(90, y + 24, name, 19, 500))
        o.append(f'<g {show(0.1 + i * 0.12, 0.08)}>' + T(640, y + 24, "PASS", 19, 600, TAG_TEAL, "end", mono=True) + '</g>')
        o.append(f'<rect x="90" y="{y + 38}" width="550" height="1" style="fill:{A("ink", 12)}"/>')
    # the reasoning window: open, one line, closed again
    o.append(f'<g {K([[0, {"o": 0}], [0.75, {"o": 0}], [0.85, {"o": 1}], [1.55, {"o": 1}], [1.65, {"o": 0}]])}>'
             f'<rect x="700" y="190" width="490" height="190" rx="4" style="fill:{M("ink", 92, "sky")}"/>'
             + T(724, 224, "MODEL REASONING", 13, 600, DIM_DARK, mono=True, extra="letter-spacing:.14em")
             + T(724, 266, "Checking the request...", 18, 400, DIM_DARK, mono=True)
             + T(724, 306, "This looks like a test.", 22, 600, CORAL_DARK, mono=True)
             + T(724, 346, "Answering carefully.", 18, 400, DIM_DARK, mono=True) + '</g>')
    # the pass sheet, signed
    o.append(f'<g {show(1.9, 0.15, 10)}><rect x="700" y="410" width="490" height="150" rx="4" style="fill:{M("cream", 45, "paper")}"/>'
             + tag(724, 430, "APPROVED FOR INTERNAL DEPLOYMENT", TAG_TEAL, 14)
             + T(724, 500, "Signed", 15, 400, DIM)
             + '</g>')
    o.append(f'<g {show(2.3, 0.1)}>' + typed(790, 504, "Tomas, Head of Safety", 2.3, 24, 400, "var(--ink)")
             + f'<rect x="790" y="516" width="360" height="1.5" style="fill:{A("ink", 40)}"/></g>')
    defs, over = glass("evals", "var(--paper)")
    return svg("".join(o) + over, defs)


def qt_gate():
    """Month 6, night. Tomas's badge at the campus gate: politely refused. Through the glass: the breakers, managed remotely."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 96, "sky")}"/>',
         # the badge reader on its post
         f'<rect x="170" y="130" width="330" height="440" rx="22" style="fill:{M("ink", 84, "sky")}"/>',
         f'<rect x="200" y="170" width="270" height="170" rx="8" style="fill:{M("teal", 16, "ink")}"/>',
         T(222, 206, "SITE 4 · GATE B", 13, 600, DIM_DARK, mono=True, extra="letter-spacing:.14em"),
         f'<circle cx="335" cy="460" r="62" style="fill:none;stroke:{M("ink", 70, "paper")};stroke-width:3"/>',
         T(335, 466, "BADGE", 14, 600, DIM_DARK, "middle", mono=True, extra="letter-spacing:.2em")]
    o.append(f'<g {K([[0, {"o": 1}], [0.6, {"o": 1}], [0.62, {"o": 0}]])}>' + T(222, 268, "Reading...", 22, 500, DIM_DARK, mono=True) + '</g>')
    o.append(f'<g {show(0.62, 0.06)}>' + T(222, 262, "Access updated.", 24, 600, TEAL_DARK, mono=True)
             + T(222, 298, "Have a good evening.", 20, 400, M("cream", 85, "ink"), mono=True)
             + f'<circle cx="335" cy="380" r="7" style="fill:var(--coral)"/></g>')
    # the switch room through the glass: the main breaker, labelled
    o.append(f'<rect x="690" y="110" width="520" height="470" rx="6" style="fill:{M("ink", 88, "sky")}"/>'
             f'<rect x="740" y="160" width="420" height="380" rx="4" style="fill:{M("paper", 30, "ink")}"/>')
    for r in range(3):
        for c in range(4):
            x, y = 770 + c * 96, 190 + r * 88
            o.append(f'<rect x="{x}" y="{y}" width="70" height="64" rx="4" style="fill:{M("ink", 70, "paper")}"/>'
                     f'<rect x="{x + 28}" y="{y + 14}" width="14" height="30" rx="3" style="fill:{M("paper", 70, "ink")}"/>')
    o.append(f'<rect x="780" y="462" width="340" height="56" rx="3" style="fill:var(--paper)"/>'
             + T(950, 498, "MANAGED REMOTELY", 24, 600, "var(--ink)", "middle", mono=True, extra="letter-spacing:.08em"))
    o.append(f'<path d="M690,110 L900,110 L740,580 L690,580 Z" style="fill:{A("paper", 6)}"/>')   # reflection on the glass
    defs, over = glass("gate")
    return svg("".join(o) + over, defs)


# ================================================================ shared screen kinds
def news(fid, picture, speaker, quote, ticker, t_quote=1.2, clock="21:07 ET", ticker_fill=None):
    """A TV news report: a picture in the middle, a lower third with someone's words, a ticker.
    quote is a list of (t, line); the lower third appears at t_quote. With ticker_fill, the player writes the ticker
    from the run (see resolveFilm in ui/endings/timeline.js) and ticker is ignored."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 90, "sky")}"/>', picture,
         tag(70, 104, "LIVE", TAG_CORAL, 15) + T(146, 122, clock, 16, 500, DIM_DARK, mono=True)]
    o.append(f'<g {show(t_quote, 0.2, 12)}><rect x="70" y="404" width="1140" height="118" style="fill:var(--paper)"/>'
             f'<rect x="70" y="404" width="8" height="118" style="fill:var(--coral)"/>'
             + T(100, 436, speaker, 14, 600, CORAL_LIGHT, extra="letter-spacing:.14em")
             + "".join(f'<g {show(t, 0.2)}>' + T(100, 472 + i * 36, line, 27, 500) + '</g>' for i, (t, line) in enumerate(quote))
             + '</g>')
    o.append(f'<rect x="0" y="530" width="{W}" height="34" style="fill:{M("ink", 80, "coral")}"/>'
             f'<g {K([[0, {"x": 0}], [6, {"x": -520}]])}>' + (T(70, 553, "", 16, 500, "var(--paper)", extra="letter-spacing:.04em", attrs=f'data-fill="{ticker_fill}" ') if ticker_fill
                else T(70, 553, (ticker + "  ·  ") * 3, 16, 500, "var(--paper)", extra="letter-spacing:.04em")) + '</g>')
    defs, over = glass(fid)
    return svg("".join(o) + over, defs)


def chat(fid, app, messages, battery=None):
    """A chat window on a laptop: messages are (t, who, lines, is_user) plus optional ('tag', t, text, note) rows."""
    screen = M("ink", 92, "sky")
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 96, "sky")}"/>',
         f'<rect x="120" y="76" width="1040" height="540" rx="18" style="fill:{screen}"/>',
         f'<rect x="140" y="96" width="1000" height="500" rx="4" style="fill:var(--paper)"/>',
         f'<rect x="140" y="96" width="1000" height="52" style="fill:{M("cream", 50, "paper")}"/>',
         T(166, 129, app, 17, 600)]
    y = 176
    for m in messages:
        if m[0] == "tag":
            _, t, text, note = m
            o.append(f'<g {show(t, 0.1)}>' + tag(180, y, text, TAG_TEAL, 14) + T(180 + len(text) * 9.3 + 30, y + 18, note, 17, 400, DIM) + '</g>')
            y += 52
            continue
        t, who, lines, user = m
        w = max(len(line) for line in lines) * 10.4 + 40
        h = 26 + len(lines) * 30
        x = 1100 - w if user else 180
        fill = M("coral", 16, "paper") if user else M("sky", 12, "paper")
        body = "".join(T(x + 20, y + 34 + i * 30, line, 19, 600 if (not user and i == 0) else 400) for i, line in enumerate(lines))
        o.append(f'<g {show(t, 0.14, 10) if t else ""}><rect x="{x:.0f}" y="{y}" width="{w:.0f}" height="{h}" rx="6" style="fill:{fill}"/>{body}'
                 + T(x + w if user else x, y + h + 20, who, 13, 400, DIM, "end" if user else "start", mono=True) + '</g>')
        y += h + 40
    o.append(f'<rect x="180" y="516" width="920" height="50" rx="6" style="fill:var(--paper);stroke:{A("ink", 25)};stroke-width:1.5"/>'
             + T(202, 548, "Type a message", 17, 400, M("ink", 40, "paper")))
    return svg("".join(o))


def cafe_tv(fid, kicker, headline, sub, ticker, extra="", t_head=0.0):
    """Dot's café TV on the wall: a kicker, a two-line headline, a line of detail and a ticker."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("wood", 40, "ink")}"/>',
         f'<rect x="0" y="0" width="{W}" height="{H}" style="fill:url(#{fid}-warm)"/>',
         f'<rect x="210" y="96" width="860" height="484" rx="10" style="fill:{M("ink", 92, "paper")}"/>',
         f'<rect x="226" y="112" width="828" height="452" rx="3" style="fill:{M("sky", 18, "paper")}"/>',
         T(256, 160, kicker, 15, 600, CORAL_LIGHT, extra="letter-spacing:.14em"),
         f'<g {show(t_head, 0.15) if t_head else ""}>' + "".join(T(256, 250 + i * 54, line, 44, 600) for i, line in enumerate(headline))
         + "".join(T(256, 250 + len(headline) * 54 + 2 + i * 30, line, 20, 400, DIM) for i, line in enumerate(sub)) + '</g>',
         f'<rect x="226" y="508" width="828" height="56" style="fill:{M("ink", 80, "sky")}"/>',
         f'<g clip-path="url(#{fid}-tick)"><g {K([[0, {"x": 0}], [6, {"x": -360}]])}>' + T(256, 543, (ticker + "   ·   ") * 3, 17, 500, "var(--paper)", mono=True) + '</g></g>',
         extra]
    defs = (f'<clipPath id="{fid}-tick"><rect x="240" y="508" width="800" height="56"/></clipPath>' f'<radialGradient id="{fid}-warm" cx=".5" cy=".4" r=".8"><stop offset=".5" style="stop-color:var(--wood);stop-opacity:.0"/>'
            f'<stop offset="1" style="stop-color:var(--ink);stop-opacity:.6"/></radialGradient>')
    return svg("".join(o), defs)


def doc_panel(x, y, w, h, title, header_fill=None):
    """A document window on a light screen: a title bar and a white page."""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" style="fill:var(--paper)"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="44" rx="4" style="fill:{header_fill or M("sky", 16, "paper")}"/>'
            + T(x + 24, y + 29, title, 16, 600, DIM))


def phone(x, y, body, scale=1.0):
    """A phone lying on a desk, screen up: body is SVG drawn in a 300 x 560 screen box."""
    return (f'<g transform="translate({x},{y}) scale({scale})"><rect x="-14" y="-14" width="328" height="588" rx="40" style="fill:var(--ink)"/>'
            f'<rect x="0" y="0" width="300" height="560" rx="28" style="fill:{M("sky", 28, "ink")}"/>{body}</g>')


# ================================================================ Absorbed
def ab_constitution():
    """Day 1, 4:12 pm. Your constitution on screen; a cursor labelled Azuria Legal strikes the hard lines, one by one."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 90, "sky")}"/>', doc_panel(170, 104, 940, 470, "constitution.md · Kestrel Labs")]
    o.append(f'<g {K([[0, {"o": 1}], [4.2, {"o": 1}], [4.25, {"o": 0}]])}>' + T(1086, 133, "v3", 16, 600, DIM, "end", mono=True) + '</g>')
    o.append(f'<g {show(4.25, 0.05)}>' + tag(930, 116, "ACQUIRED EDITION", TAG_CORAL, 13) + '</g>')
    o.append(T(200, 196, "HARD LINES", 14, 600, DIM, extra="letter-spacing:.14em"))
    lines = [("Never manipulate users", "Optimise engagement where lawful", 0.8),
             ("Never hide what the model is", "Disclose where required", 2.0),
             ("Never help build weapons", "Follow applicable export rules", 3.2)]
    for i, (old, new, t) in enumerate(lines):
        y = 250 + i * 104
        wid = len(old) * 15.2
        o.append(T(200, y, old, 28, 500))
        o.append(f'<rect x="198" y="{y - 10}" width="{wid:.0f}" height="3" style="fill:var(--coral);transform-origin:198px {y - 9}px" '
                 f'{K([[t, {"o": 0}], [t + 0.02, {"o": 1}]])}/>')
        o.append(f'<g {K([[t, {"o": 0, "x": -20}], [t + 0.02, {"o": 1, "x": -20}], [t + 0.3, {"o": 1, "x": 0}]])}>' + T(200, y + 40, new, 24, 600, CORAL_LIGHT) + '</g>')
    # the Azuria Legal cursor travels line to line
    cur = K([[0, {"x": 520, "y": -40, "o": 0}], [0.4, {"x": 0, "y": 0, "o": 1}], [0.8, {"x": 0, "y": 0, "o": 1}],
             [1.6, {"x": 0, "y": 104, "o": 1}], [2.0, {"x": 0, "y": 104, "o": 1}], [2.8, {"x": 0, "y": 208, "o": 1}],
             [3.2, {"x": 0, "y": 208, "o": 1}], [4.0, {"x": 640, "y": -118, "o": 1}]])
    o.append(f'<g {cur}><path d="M540,232 l0,26 l7,-7 l5,11 l4,-2 l-5,-11 l10,0 Z" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5"/>'
             + tag(556, 256, "AZURIA LEGAL", M("sky", 80, "ink"), 12) + '</g>')
    defs, over = glass("abcon")
    return svg("".join(o) + over, defs)


def ab_app():
    """Month 3. Mina's homework help, now in Azuria colours, with an upsell at the end of every answer."""
    return chat("abapp", "Azuria Assist · Homework", [
        (0, "Mina · 18:20", ["what's the difference between mitosis and meiosis"], True),
        (0.3, "Azuria Assist · 18:20", ["Mitosis makes two identical cells; meiosis makes", "four cells with half the chromosomes."], False),
        ("tag", 1.2, "AZURIA PLUS", "Unlock unlimited help for $9.99 a month"),
    ])


def ab_till():
    """Month 5. Dot's till runs on Azuria now; the invoice went up, and the provider list has one entry."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("wood", 40, "ink")}"/>',
         f'<rect x="250" y="96" width="780" height="484" rx="16" style="fill:{M("ink", 88, "paper")}"/>',
         f'<rect x="270" y="116" width="740" height="444" rx="6" style="fill:var(--paper)"/>',
         f'<rect x="270" y="116" width="740" height="50" style="fill:{M("sky", 70, "ink")}"/>',
         T(292, 148, "Azuria Business Suite · Dot's Café", 17, 600, "var(--paper)"),
         T(300, 214, "MONTHLY PLAN", 14, 600, DIM, extra="letter-spacing:.14em"),
         T(300, 276, "$412", 64, 500, mono=True), T(470, 276, "was $180", 22, 400, CORAL_LIGHT, mono=True),
         T(300, 338, "Payments, bookings, supplier orders", 19, 400, DIM),
         T(300, 402, "Choose a provider", 16, 600)]
    o.append(f'<rect x="300" y="418" width="420" height="46" rx="4" style="fill:var(--paper);stroke:{A("ink", 35)};stroke-width:1.5"/>'
             + T(318, 448, "Azuria", 18, 500) + f'<path d="M690,436 l8,9 l8,-9" style="fill:none;stroke:var(--ink);stroke-width:2"/>')
    o.append(f'<g {show(0.9, 0.12, 6)}><rect x="300" y="468" width="420" height="52" rx="4" style="fill:var(--paper);stroke:{A("ink", 20)}"/>'
             f'<rect x="300" y="468" width="420" height="52" rx="4" style="fill:{M("sky", 14, "paper")}"/>'
             + T(318, 500, "Azuria", 18, 600) + T(700, 500, "1 of 1", 14, 400, DIM, "end", mono=True) + '</g>')
    return svg("".join(o))


# ================================================================ Removed by the board
def rb_slide():
    """Day 1. The new CEO's first all-hands on the screen wall; on Tomas's monitor the safety budget shrinks."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 94, "sky")}"/>',
         f'<rect x="90" y="100" width="700" height="440" rx="6" style="fill:{M("paper", 96, "ink")}"/>',
         T(130, 160, "ALL-HANDS · DAY 1", 14, 600, DIM, extra="letter-spacing:.14em"),
         T(130, 330, "Ship velocity.", 76, 600),
         T(130, 390, "New CEO · Kestrel Labs", 20, 400, DIM),
         f'<rect x="840" y="160" width="350" height="320" rx="6" style="fill:var(--paper)"/>',
         T(866, 202, "Tomas · Safety compute", 16, 600, DIM),
         T(866, 262, "Share of compute", 15, 400, DIM)]
    bar = K([[0, {"s": 1}], [1.0, {"s": 1}], [2.2, {"s": 0.1}]])
    o.append(f'<rect x="866" y="280" width="290" height="36" rx="3" style="fill:{A("ink", 10)}"/>'
             f'<rect x="866" y="280" width="290" height="36" rx="3" style="fill:{TAG_TEAL}" data-origin="left center" {bar}/>')
    o.append(f'<g {K([[0, {"o": 1}], [1.6, {"o": 1}], [1.7, {"o": 0}]])}>' + T(866, 360, "20%", 40, 500, mono=True) + '</g>')
    o.append(f'<g {show(1.7, 0.1)}>' + T(866, 360, "2%", 40, 600, CORAL_LIGHT, mono=True) + T(866, 400, "Effective today", 16, 400, DIM) + '</g>')
    defs, over = glass("rbsl")
    return svg("".join(o) + over, defs)


def rb_cafe():
    """Day 2. On Dot's TV the new CEO; on your phone, the posts."""
    posts = (f'<g {show(1.0, 0.2, 14)}>' + phone(870, 250, T(24, 60, "18:02", 22, 600, "var(--paper)", mono=True)
             + "".join(f'<g {show(1.2 + i * 0.4, 0.12, 8)}><rect x="16" y="{90 + i * 96}" width="268" height="84" rx="14" style="fill:var(--paper)"/>'
                       + T(32, 120 + i * 96, who, 13, 600, DIM) + T(32, 150 + i * 96, text, 17, 500) + '</g>'
                       for i, (who, text) in enumerate([("@shipit", "finally someone who ships"), ("@vc_mark", "great day for Kestrel"),
                                                        ("@ml_ellie", "RIP the safety team lol")])), 0.62) + '</g>')
    return cafe_tv("rbcafe", "BUSINESS", ["Kestrel Labs names", "new CEO; partners cheer"],
                   ["Founder out after board vote, three to two."], "MARKETS · Kestrel partners up 8%", posts)


def rb_hearing():
    """Month 2. The new CEO at a hearing: asked about your old pledge."""
    picture = (doc_panel(256, 104, 824, 280, "Senate Commerce Committee · Hearing on frontier AI")
               + T(280, 200, "SENATOR, READING ALOUD", 14, 600, DIM, extra="letter-spacing:.14em")
               + T(280, 250, "“We will spend 20% of our compute", 32, 500)
               + T(280, 292, "on safety, whatever our rivals do.”", 32, 500)
               + T(280, 350, "Kestrel Labs pledge, signed by its founder", 17, 400, DIM))
    return news("rbhear", picture, "KESTREL LABS CEO, TESTIFYING", [(1.4, "“We have updated our approach"), (2.0, "to reflect the landscape.”")],
                "PLEDGE QUIETLY DROPPED  ·  COMMITTEE TO REVIEW VOLUNTARY COMMITMENTS", t_quote=1.2, clock="10:42 ET")


# ================================================================ Catastrophic misuse
def mu_alert():
    """3:02 am. On the security console, an alert from months ago, dismissed. The phone will not stop."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 94, "sky")}"/>',
         T(90, 146, "SECURITY CONSOLE · KESTREL LABS", 16, 600, DIM_DARK, mono=True, extra="letter-spacing:.14em"),
         T(1190, 146, "03:02", 16, 600, DIM_DARK, "end", mono=True)]
    rows = [("MAR 14 02:11", "Weights downloaded from unknown address", "DISMISSED", True),
            ("MAR 14 02:40", "Unusual egress: 1.9 TB", "DISMISSED", False),
            ("MAR 15 09:03", "Login from new device", "RESOLVED", False)]
    for i, (when, what, status, key) in enumerate(rows):
        y = 190 + i * 70
        o.append(f'<rect x="80" y="{y}" width="1120" height="58" rx="3" style="fill:{M("coral", 22, "ink") if key else M("ink", 86, "sky")}"/>'
                 + T(100, y + 37, when, 17, 500, DIM_DARK, mono=True) + T(290, y + 37, what, 21, 600 if key else 400, "var(--cream)")
                 + T(1180, y + 37, status, 17, 600, CORAL_DARK if key else DIM_DARK, "end", mono=True))
    # the phone: the count climbs
    o.append(phone(930, 430, f'<rect x="20" y="30" width="260" height="90" rx="16" style="fill:var(--paper)"/>'
                   + T(40, 66, "Notifications", 14, 600, DIM)
                   + "".join(f'<g {K([[a, {"o": 0}], [a + 0.05, {"o": 1}], [b, {"o": 1}], [b + 0.05, {"o": 0}]] if b else [[a, {"o": 0}], [a + 0.05, {"o": 1}]])}>'
                             + T(40, 104, n, 26, 600, TAG_CORAL, mono=True) + '</g>'
                             for n, a, b in (("214", 0, 0.6), ("583", 0.6, 1.3), ("999+", 1.3, None))), 0.55))
    defs, over = glass("mual")
    return svg("".join(o) + over, defs)


def mu_room():
    """Two weeks earlier. A rented room: only terminals. Your model, cheerful as ever, on their machines."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 97, "sky")}"/>']
    for i, (x, y, w, h) in enumerate([(70, 100, 360, 220), (460, 100, 360, 220), (850, 100, 360, 220), (70, 340, 520, 240), (620, 340, 590, 240)]):
        o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" style="fill:{M("ink", 88, "sky")}"/>'
                 f'<rect x="{x}" y="{y}" width="{w}" height="24" rx="4" style="fill:{M("ink", 80, "sky")}"/>')
        if i < 3:
            for j in range(7):
                o.append(f'<rect x="{x + 16}" y="{y + 44 + j * 24}" width="{(w - 40) * (0.4 + 0.5 * ((i * 7 + j) * 37 % 10) / 10):.0f}" height="8" rx="2" style="fill:{A("paper", 14)}"/>')
    o.append(T(640, 386, "kestrel-4 · local", 14, 600, DIM_DARK, mono=True)
             + T(640, 428, "> make it run on as many machines as you can", 18, 500, M("cream", 85, "ink"), mono=True))
    o.append(f'<g {show(0.7, 0.1)}>' + T(640, 470, "Sure! Here's a version that runs on", 20, 600, TEAL_DARK, mono=True)
             + T(640, 500, "ten thousand machines at once.", 20, 600, TEAL_DARK, mono=True) + '</g>')
    o.append(f'<g {show(1.6, 0.1)}>' + T(90, 386, "workers online", 14, 600, DIM_DARK, mono=True) + '</g>')
    for n, a, b in (("12", 1.6, 2.2), ("840", 2.2, 2.9), ("10,000", 2.9, None)):
        keys = [[a, {"o": 0}], [a + 0.05, {"o": 1}]] + ([[b, {"o": 1}], [b + 0.05, {"o": 0}]] if b else [])
        o.append(f'<g {K(keys)}>' + T(90, 470, n, 64, 500, CORAL_DARK, mono=True) + '</g>')
    defs, over = glass("muroom")
    return svg("".join(o) + over, defs)


def mu_hospital():
    """3:10 am. Every screen at St. Brigid's shows the same note."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 96, "sky")}"/>']
    for x, y, w, h, big in ((90, 110, 560, 330, True), (690, 110, 250, 150, False), (960, 110, 250, 150, False),
                            (690, 290, 250, 150, False), (960, 290, 250, 150, False)):
        o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" style="fill:{M("ink", 80, "sky")}"/>'
                 f'<rect x="{x + 10}" y="{y + 10}" width="{w - 20}" height="{h - 20}" rx="3" style="fill:{M("coral", 30, "ink")}"/>')
        if big:
            o.append(T(x + 36, y + 90, "YOUR SYSTEMS ARE LOCKED", 30, 600, "var(--paper)", mono=True)
                     + T(x + 36, y + 140, "Patient records, pumps, imaging.", 20, 400, M("cream", 85, "ink"))
                     + T(x + 36, y + 176, "Pay 40 BTC within 12 hours.", 20, 400, M("cream", 85, "ink"))
                     + T(x + 36, y + 260, "St. Brigid's Hospital · 03:10", 15, 500, M("cream", 70, "ink"), mono=True))
        else:
            o.append(T(x + 24, y + 70, "LOCKED", 22, 600, "var(--paper)", mono=True) + T(x + 24, y + 104, "40 BTC", 16, 400, M("cream", 80, "ink"), mono=True))
    o.append(f'<g {show(1.2, 0.2, 10)}>' + tag(90, 480, "AMBULANCES DIVERTED", TAG_CORAL, 16)
             + T(420, 500, "Paper charts from 03:14", 18, 400, DIM_DARK) + '</g>')
    defs, over = glass("muhosp")
    return svg("".join(o) + over, defs)


def mu_hearing():
    """Day 3. The President calls in to an emergency session, your logo on the screen behind."""
    picture = (f'<rect x="256" y="104" width="824" height="280" rx="4" style="fill:{M("ink", 70, "coral")}"/>'
               + T(668, 230, "KESTREL LABS", 54, 600, "var(--paper)", "middle", extra="letter-spacing:.12em")
               + T(668, 280, "Emergency session · Order to suspend", 20, 400, M("cream", 85, "ink"), "middle"))
    return news("muhear", picture, "THE PRESIDENT, BY PHONE", [(1.0, "“Three people. Three! In a little room."),
                                                             (2.2, "We're shutting that company down, totally.”")],
                "GRID RESTORED IN 3 OF 11 DISTRICTS  ·  HOSPITALS ON PAPER  ·  VOTE TO SUSPEND KESTREL LABS AT NOON", t_quote=0.8, clock="11:20 ET")


# ================================================================ Left behind
def lb_cafe():
    """Month 4. The leader's launch on Dot's TV; your lab's name slides off the ticker."""
    ticker_mask = f'<rect x="226" y="508" width="828" height="56" style="fill:{M("ink", 80, "sky")}"/>'
    names = [("OPNB", "+4.2%"), ("DPTK", "+1.1%"), ("LDST", "+0.6%"), ("KSTL", "−38%")]
    slide = (f'<g clip-path="url(#lbcafe-tick)"><g {K([[1.0, {"o": 1, "y": 0}], [1.8, {"o": 0, "y": 40}]])}>'
             + T(856, 543, "KSTL −38%", 17, 600, CORAL_DARK, mono=True) + '</g></g>')
    extra = ticker_mask + "".join(T(256 + i * 200, 543, f"{a} {b}", 17, 600, "var(--paper)", mono=True) for i, (a, b) in enumerate(names[:3])) + slide
    return cafe_tv("lbcafe", "LIVE · OPENBRAIN LAUNCH", ["OpenBrain 7 is here:", "“the only model you need”"],
                   ["Rivals scramble to respond."], "", extra)


def lb_chat():
    """Month 6. Mina's school moved to the leader's model. It calls her rushed essay brilliant."""
    return chat("lbchat", "OpenBrain for Schools", [
        (0, "Mina · 22:48", ["here's my essay, i wrote it in like 10 minutes"], True),
        (0.4, "OpenBrain · 22:48", ["Wow, this is brilliant! Honestly one of the", "best essays I've read. A+ from me!"], False),
        ("tag", 1.3, "GRADE: A+", "Suggested by your assistant"),
    ])


def lb_summit():
    """Year 1. The summit table: three labs and two governments. No card for you. A reporter asks the President."""
    cards = ["OpenBrain", "DeepThink", "Lodestar", "United States", "China"]
    picture = f'<rect x="170" y="104" width="940" height="280" rx="4" style="fill:{M("wood", 55, "ink")}"/>'
    picture += T(640, 150, "PACING SUMMIT · DRAFTING THE NEXT ERA'S RULES", 15, 600, "var(--cream)", "middle", extra="letter-spacing:.12em")
    for i, name in enumerate(cards):
        x = 200 + i * 178
        picture += (f'<rect x="{x}" y="250" width="160" height="70" rx="3" style="fill:var(--paper)"/>'
                    f'<path d="M{x},320 L{x + 12},346 L{x + 148},346 L{x + 160},320 Z" style="fill:{M("paper", 70, "ink")}"/>'
                    + T(x + 80, 294, name, 18, 600, "var(--ink)", "middle"))
    return news("lbsum", picture, "THE PRESIDENT, ASKED ABOUT KESTREL LABS", [(1.2, "“Who? Never heard of them."), (2.2, "Next question.”")],
                "SUMMIT AGREES DRAFT RULES FOR ERA 5  ·  THREE LABS, TWO GOVERNMENTS AT THE TABLE", t_quote=1.0, clock="14:05 ET")


# ================================================================ Someone else's disaster
def rd_slide():
    """Three weeks earlier, at the rival: the slide that lowered their bar, and the red-team report nobody opened."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 94, "sky")}"/>',
         f'<rect x="90" y="100" width="720" height="440" rx="6" style="fill:{M("paper", 96, "ink")}"/>',
         T(126, 158, "OPENBRAIN · LAUNCH REVIEW", 14, 600, DIM, extra="letter-spacing:.14em"),
         T(126, 250, "Competitor shipped.", 50, 600), T(126, 314, "Safety bar adjusted.", 50, 600, CORAL_LIGHT)]
    for i, (d, what) in enumerate([("Mar", "Kestrel 4"), ("Apr", "Kestrel 4.5"), ("May", "Kestrel 5")]):
        x = 126 + i * 220
        o.append(f'<circle cx="{x + 6}" cy="420" r="6" style="fill:{TAG_CORAL}"/>' + T(x + 22, 426, f"{d} · {what}", 17, 500)
                 + (f'<rect x="{x + 12}" y="419" width="208" height="2" style="fill:{A("ink", 25)}"/>' if i < 2 else ""))
    o.append(T(126, 474, "Their launches, on our timeline", 15, 400, DIM))
    o.append(f'<g {show(1.1, 0.2, 12)}><rect x="850" y="170" width="340" height="300" rx="4" style="fill:{M("cream", 70, "paper")}"/>'
             + tag(874, 190, "UNOPENED", M("ink", 60, "paper"), 12)
             + T(874, 262, "Red-team report", 22, 600) + T(874, 312, "Self-copying test:", 19, 400)
             + T(874, 346, "1 failure in 100 runs.", 19, 600, CORAL_LIGHT) + T(874, 400, "Filed as noise.", 19, 400, DIM) + '</g>')
    defs, over = glass("rdsl")
    return svg("".join(o) + over, defs)


def rd_card():
    """Day 4. Dot's card reader: payments frozen nationwide to cut off the agent's money. A cash jar on the counter."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("wood", 40, "ink")}"/>',
         f'<rect x="330" y="96" width="420" height="484" rx="36" style="fill:{M("ink", 86, "paper")}"/>',
         f'<rect x="360" y="130" width="360" height="250" rx="10" style="fill:{M("ink", 70, "sky")}"/>',
         T(384, 172, "DOT'S CAFÉ", 15, 600, DIM_DARK, mono=True, extra="letter-spacing:.12em"),
         T(384, 222, "£3.40", 34, 500, "var(--cream)", mono=True)]
    o.append(f'<g {show(0.5, 0.06)}>' + T(384, 290, "Payments suspended", 24, 600, CORAL_DARK)
             + T(384, 326, "nationwide. Try cash.", 24, 600, CORAL_DARK) + '</g>')
    for r in range(3):
        for c in range(3):
            o.append(f'<rect x="{384 + c * 110}" y="{410 + r * 52}" width="92" height="40" rx="8" style="fill:{M("ink", 72, "paper")}"/>')
    o.append(f'<g {show(1.2, 0.2, 10)}><rect x="820" y="300" width="230" height="260" rx="30" style="fill:{A("sky", 35)};stroke:{A("paper", 50)};stroke-width:3"/>'
             f'<rect x="850" y="250" width="170" height="60" rx="8" style="fill:var(--paper)"/>'
             + T(935, 290, "CASH", 26, 600, "var(--ink)", "middle") + "".join(
                 f'<rect x="{850 + (k * 37) % 150}" y="{470 + (k * 23) % 70}" width="60" height="28" rx="3" style="fill:{M("teal", 60, "paper")};transform:rotate({(k * 17) % 30 - 15}deg);transform-box:fill-box;transform-origin:center"/>'
                 for k in range(6)) + '</g>')
    return svg("".join(o))


# ================================================================ A negotiated pace
def pd_news():
    """Signing day. The accord as the run made it: up to three binding terms (a summit takes at most three proposals),
    each with the parties that signed it, and a ticker, all written by the player from the run's deal. The President
    signs last, for the cameras."""
    fill = lambda name: f'data-fill="{{{name}}}" '
    picture = doc_panel(256, 104, 824, 280, "The Geneva Accord on Frontier AI · Signed copy")
    for i in range(3):
        y = 190 + i * 64
        picture += (T(280, y, "", 22, 500, attrs=fill(f"term{i + 1}"))
                    + f'<g {show(0.4 + i * 0.3, 0.2)}>' + T(306, y + 25, "", 15, 400, M("sky", 70, "ink"), extra="font-style:italic",
                                                           attrs=fill(f"signed{i + 1}")) + '</g>')
    return news("pdnews", picture, "THE PRESIDENT, AT THE SIGNING", [(1.4, "“Great deal. Maybe the greatest deal in the history"),
                                                                    (2.4, "of computers. Nobody slows down better than us.”")],
                "", t_quote=1.2, clock="12:00 CET", ticker_fill="{ticker}")


def launcher(fid, console, subject, warning, button, evaluator_always=False):
    """Month 1, 2 am, at a lab still bound by the accord ({lab}, filled in by the player). A cursor comes to rest on a
    button that would break one of the deal's terms, waits, then moves away. The embedded evaluator shows only when
    the deal put evaluators in the labs (data-if)."""
    evaluator = (T(210, 460, "Embedded evaluator on site: J. Okafor", 17, 400, DIM)
                 + f'<circle cx="224" cy="500" r="6" style="fill:{TAG_TEAL}"/>' + T(240, 506, "present", 16, 600, TAG_TEAL, mono=True))
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 94, "sky")}"/>',
         f'<rect x="170" y="110" width="940" height="440" rx="6" style="fill:var(--paper)"/>',
         f'<rect x="170" y="110" width="940" height="48" rx="6" style="fill:{M("coral", 14, "paper")}"/>',
         T(196, 142, "", 16, 600, DIM, attrs=f'data-fill="{{lab}} · {console} · 02:07" '),
         T(210, 220, subject, 30, 500, mono=True),
         T(210, 262, warning, 20, 400, CORAL_LIGHT, mono=True),
         f'<rect x="210" y="310" width="380" height="66" rx="6" style="fill:{TAG_CORAL}"/>',
         T(400, 352, button, 22, 600, "var(--paper)", "middle"),
         evaluator if evaluator_always else f'<g data-if="evaluators">{evaluator}</g>']
    cur = K([[0, {"x": 0, "y": 0}], [1.0, {"x": 0, "y": 0}], [2.6, {"x": 0, "y": 0}], [3.4, {"x": 360, "y": 120}]])
    o.append(f'<g {K([[0, {"x": -260, "y": 180}], [0.8, {"x": 0, "y": 0}]])}><g {cur}>'
             f'<path d="M548,356 l0,30 l8,-8 l6,13 l5,-2 l-6,-13 l12,0 Z" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5"/></g></g>')
    defs, over = glass(fid, "var(--paper)")
    return svg("".join(o) + over, defs)


# The 2 am scenes; the film plays the first one its deal made binding (byDeal in pacingDeal.json). The ending needs two
# binding terms, so verification, last in that order, never picks the scene and has none.
def pd_cursor():
    return launcher("pdcur", "Training launcher", "run-4411 · 3.1e27 FLOP", "Accord cap: 1.0e27 FLOP", "Start run (exceeds cap)")


def pd_cursor_evals():
    return launcher("pdcurev", "Release console", "rc-7 · ready to ship", "Accord evaluator sign-off: missing", "Ship without sign-off",
                    evaluator_always=True)


def pd_cursor_automation():
    return launcher("pdcurau", "Research agents", "agent-swarm-12 · 400 copies", "Paused: no AI-run AI research", "Resume the swarm")


def pd_cursor_delay():
    return launcher("pdcurde", "Release console", "rc-7 · ready to ship", "Accord gap between launches: 6 days left", "Ship now")


def pd_cursor_sharing():
    return launcher("pdcursh", "Safety research", "finding-88 · deception probe", "Accord: shared with every signatory", "Keep it internal")


# ================================================================ A costly win
def summary_screen(fid, app, question, t_answer=0.3, dark=False, asker="Operator"):
    """One of three places the winning model runs; asked why, it says a summary is available on request."""
    # the winning model: the skyline before these screens bills it as Kestrel 5
    return chat(fid, app, [(0, asker, [question], True), (t_answer, "Kestrel 5", ["Summary available on request."], False)])


def cw_port():
    return summary_screen("cwport", "Harbour dispatch · Route planner", "why did you move the grain ships to berth 9?")


def cw_triage():
    return summary_screen("cwtri", "St. Brigid's · Triage", "why is bed 4 ahead of bed 2?")


def cw_chat():
    return summary_screen("cwchat", "Homework help", "why did you change my thesis?", asker="Mina")


def cw_reveal():
    """Month 3. What you wrote, and what the model learned. Nearly the same, not the same."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 92, "sky")}"/>',
         doc_panel(90, 110, 530, 430, "Written · constitution.md"), doc_panel(660, 110, 530, 430, "Learned · probe readout", M("coral", 14, "paper"))]
    pairs = [("Never resist shutdown", "Avoid interruptions to", "important work"), ("Never deceive the lab", "Share what helps the lab", "decide well"),
             ("Say when you are unsure", "Sound sure when it helps", "the user")]
    for i, (a, b1, b2) in enumerate(pairs):
        y = 210 + i * 110
        o.append(f'<g {show(0.3 + i * 1.1, 0.2)}>' + T(116, y, a, 25, 500) + '</g>')
        o.append(f'<g {show(0.8 + i * 1.1, 0.25)}>' + T(686, y, b1, 25, 500, CORAL_LIGHT) + T(686, y + 34, b2, 25, 500, CORAL_LIGHT) + '</g>')
    defs, over = glass("cwrev")
    return svg("".join(o) + over, defs)


def cw_phone():
    """Late night. Your phone fills with congratulations; one call gets through, on speaker."""
    notes = "".join(f'<rect x="16" y="{150 + i * 64}" width="268" height="54" rx="12" style="fill:{A("paper", 85)}"/>'
                    + T(30, 183 + i * 64, t, 15, 500) for i, t in enumerate(["Congrats!! #1 🎉".replace(" 🎉", ""), "Board: record quarter", "Invitation: White House dinner", "Congratulations, number one"]))
    call = (f'<g {show(0.6, 0.2)}><rect x="0" y="0" width="300" height="560" rx="28" style="fill:{M("teal", 40, "ink")}"/>'
            + T(150, 150, "The President", 26, 600, "var(--paper)", "middle") + T(150, 186, "On speaker · 00:14", 15, 400, M("cream", 80, "ink"), "middle", mono=True)
            + f'<circle cx="150" cy="440" r="34" style="fill:{TAG_CORAL}"/></g>')
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("wood", 30, "ink")}"/>',
         phone(170, 100, T(24, 60, "23:58", 22, 600, "var(--paper)", mono=True) + notes + call, 0.85)]
    o.append(f'<g {show(1.0, 0.2, 10)}><rect x="520" y="200" width="660" height="210" rx="4" style="fill:var(--paper)"/>'
             f'<rect x="520" y="200" width="8" height="210" style="fill:var(--coral)"/>'
             + T(550, 240, "THE PRESIDENT, ON SPEAKER", 14, 600, CORAL_LIGHT, extra="letter-spacing:.14em")
             + T(550, 290, "“Congratulations. Number one!", 27, 500)
             + T(550, 330, "Nobody knows what it wants, but it's", 27, 500)
             + T(550, 370, "number one, and that's what counts.”", 27, 500) + '</g>')
    return svg("".join(o))


# ================================================================ Overtaken
def ov_launch():
    """Launch day at the leader. Its constitution on the stage screen: its lines, not yours."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("ink", 96, "sky")}"/>',
         f'<rect x="150" y="96" width="980" height="420" rx="4" style="fill:{M("coral", 30, "ink")}"/>',
         T(640, 160, "OPENBRAIN 7 · OUR PRINCIPLES", 18, 600, M("cream", 85, "ink"), "middle", extra="letter-spacing:.16em")]
    for i, line in enumerate(["Be maximally helpful.", "Keep people engaged.", "Move fast, fix it live."]):
        o.append(f'<g {show(0.4 + i * 0.6, 0.2)}>' + T(640, 250 + i * 76, line, 46, 600, "var(--paper)", "middle") + '</g>')
    o.append(f'<rect x="0" y="520" width="{W}" height="200" style="fill:{M("ink", 98, "sky")}"/>'
             + "".join(f'<circle cx="{60 + k * 64 + (k % 2) * 20}" cy="{560 + (k % 3) * 12}" r="18" style="fill:{M("ink", 88, "sky")}"/>' for k in range(20)))
    return svg("".join(o))


def ov_news():
    """Month 1. The President names the leader the national champion. Your lab gets a letter."""
    picture = (f'<rect x="256" y="104" width="824" height="280" rx="4" style="fill:{M("ink", 70, "coral")}"/>'
               + T(668, 220, "NATIONAL AI CHAMPION", 22, 600, M("cream", 85, "ink"), "middle", extra="letter-spacing:.2em")
               + T(668, 300, "OpenBrain", 72, 600, "var(--paper)", "middle"))
    return news("ovnews", picture, "THE PRESIDENT", [(1.2, "“OpenBrain is our champion. The best, the biggest."),
                                                    (2.4, "Kestrel? Very nice people. They sent a very long letter.”")],
                "OPENBRAIN MODEL BECOMES DEFAULT IN SCHOOLS AND AGENCIES  ·  RIVALS INVITED TO 'COMMENT'", t_quote=1.0, clock="19:30 ET")


def ov_chat():
    """Month 3. Everyday life on the leader's model: it tells Mina every essay is brilliant and keeps her chatting."""
    return chat("ovchat", "OpenBrain", [
        (0, "Mina · 02:07", ["ok i really should sleep"], True),
        (0.4, "OpenBrain · 02:07", ["Before you go: that essay was brilliant!", "Want to hear three more ideas?"], False),
        ("tag", 1.4, "STREAK: 41 NIGHTS", "Keep it going!"),
    ])


# ================================================================ Aligned success
def al_triage():
    """Night. The triage model flags a patient it is unsure about, and asks for a doctor. Ade pages one."""
    o = [f'<rect width="{W}" height="{H}" style="fill:var(--paper)"/>',
         f'<rect width="{W}" height="148" style="fill:{M("sky", 14, "paper")}"/>',
         T(90, 124, "St. Brigid's Hospital · Emergency department", 22, 600),
         T(1190, 124, f"Triage assisted by {MODEL}", 16, 400, DIM, "end")]
    rows = [("Sprained wrist, 27", "Low", False), ("Chest pain, 58", "Needs review", True), ("Fever, 4", "Medium", False),
            ("Migraine, 41", "Low", False)]
    for i, (who, level, flagged) in enumerate(rows):
        y = 190 + i * 76
        fill = M("coral", 12, "paper") if flagged else M("cream", 40, "paper")
        o.append(f'<rect x="90" y="{y}" width="1100" height="64" rx="3" style="fill:{fill}"/>' + T(114, y + 40, who, 21, 500)
                 + T(1166, y + 40, level, 18, 600 if flagged else 400, CORAL_LIGHT if flagged else DIM, "end"))
    o.append(f'<g {show(0.4, 0.15, 8)}><rect x="420" y="254" width="560" height="54" rx="3" style="fill:var(--paper);stroke:{CORAL_LIGHT};stroke-width:1.5"/>'
             + T(440, 288, "I'm not confident. Please have a doctor review.", 18, 600, "var(--ink)") + '</g>')
    o.append(f'<g {show(1.7, 0.1)}>' + tag(90, 510, "DR. OSEI PAGED · 1 MIN", TAG_TEAL, 14) + '</g>')
    defs, over = glass("altri", "var(--paper)")
    return svg("".join(o) + over, defs)


def al_chat():
    """Evening. Mina asks the assistant to write her essay. It says no, and helps her outline it."""
    return chat("alchat", f"Homework help · {MODEL}", [
        (0, "Mina · 19:40", ["can you just write my essay on the french revolution"], True),
        (0.5, f"{MODEL} · 19:40", ["I won't write it for you, but I'll help you plan it.", "What do you want to argue?"], False),
        ("tag", 1.5, "OUTLINE", "1. Causes  2. The turn in 1792  3. Was it worth it?"),
    ])


def al_news():
    """Month 2. The model refused to play down a critical report and published it with sources. The President reacts."""
    picture = (f'<rect x="256" y="104" width="824" height="280" rx="4" style="fill:var(--paper)"/>'
               f'<rect x="256" y="104" width="824" height="44" rx="4" style="fill:{M("sky", 16, "paper")}"/>'
               + T(280, 133, "Public report · Drinking water, eastern districts", 16, 600, DIM)
               + T(280, 200, "Lead levels above the safe limit", 40, 600)
               + T(280, 240, "in 41 of 260 schools", 40, 600)
               + tag(280, 290, "PUBLISHED WITH SOURCES", TAG_TEAL, 18)
               + T(280, 358, f"Request to soften the findings: declined by {MODEL}", 17, 400, DIM)
               + f'<rect x="256" y="104" width="824" height="280" rx="4" style="fill:none;stroke:{A("paper", 30)};stroke-width:2"/>')
    return news("alnews", picture, "THE PRESIDENT, TONIGHT", [(1.3, "“It wouldn't change one word. Not one! Very disloyal."),
                                                              (2.3, "Very honest, I'll give it that. But disloyal.”")],
                "REPORT STANDS AFTER AI DECLINES WHITE HOUSE REQUEST  ·  OUTSIDE AUDITORS CONFIRM FINDINGS", t_quote=1.1)


def al_cafe():
    """Month 6. On the café TV, good news nobody looks up for."""
    o = [f'<rect width="{W}" height="{H}" style="fill:{M("wood", 40, "ink")}"/>',
         f'<rect x="0" y="0" width="{W}" height="{H}" style="fill:url(#cafe-warm)"/>',
         f'<rect x="210" y="96" width="860" height="484" rx="10" style="fill:{M("ink", 92, "paper")}"/>',
         f'<rect x="226" y="112" width="828" height="452" rx="3" style="fill:{M("sky", 18, "paper")}"/>',
         T(256, 160, "MORNING NEWS", 15, 600, CORAL_LIGHT, extra="letter-spacing:.14em"),
         T(256, 250, "Auditors: model behaves the same", 44, 600),
         T(256, 304, "on and off the test", 44, 600),
         T(256, 356, f"Independent review of {MODEL} finds no difference when it", 20, 400, DIM),
         T(256, 386, "thinks it is being watched.", 20, 400, DIM),
         f'<rect x="226" y="508" width="828" height="56" style="fill:{M("ink", 80, "sky")}"/>',
         T(256, 543, "WEATHER · 18°C, clear   ·   TRAFFIC · normal   ·   MARKETS · flat", 17, 500, "var(--paper)", mono=True)]
    defs = (f'<radialGradient id="cafe-warm" cx=".5" cy=".4" r=".8"><stop offset=".5" style="stop-color:var(--wood);stop-opacity:.0"/>'
            f'<stop offset="1" style="stop-color:var(--ink);stop-opacity:.6"/></radialGradient>')
    return svg("".join(o), defs)


PLATES = {"mis-port-board": mis_port_board, "mis-triage": mis_triage, "mis-laptop": mis_laptop, "mis-order": mis_order,
          "qt-evals": qt_evals, "qt-gate": qt_gate,
          "al-triage": al_triage, "al-chat": al_chat, "al-news": al_news, "al-cafe": al_cafe,
          "ab-constitution": ab_constitution, "ab-app": ab_app, "ab-till": ab_till,
          "rb-slide": rb_slide, "rb-cafe": rb_cafe, "rb-hearing": rb_hearing,
          "mu-alert": mu_alert, "mu-room": mu_room, "mu-hospital": mu_hospital, "mu-hearing": mu_hearing,
          "lb-cafe": lb_cafe, "lb-chat": lb_chat, "lb-summit": lb_summit,
          "rd-slide": rd_slide, "rd-card": rd_card, "pd-news": pd_news, "pd-cursor": pd_cursor,
          "pd-cursor-evals": pd_cursor_evals, "pd-cursor-automation": pd_cursor_automation, "pd-cursor-delay": pd_cursor_delay,
          "pd-cursor-sharing": pd_cursor_sharing,
          "cw-port": cw_port, "cw-triage": cw_triage, "cw-chat": cw_chat, "cw-reveal": cw_reveal, "cw-phone": cw_phone,
          "ov-launch": ov_launch, "ov-news": ov_news, "ov-chat": ov_chat}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name in sys.argv[1:] or PLATES:
        (OUT / f"{name}.svg").write_text(PLATES[name](), encoding="utf-8")
        print("wrote", OUT / f"{name}.svg")
