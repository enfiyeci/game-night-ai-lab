"""The other rooms of your lab: the meeting room, the all-hands room, the security console, the evals room and the
lobby. Each room is built for its shot. Shots:

  ab-constitution  Absorbed, Day 1, 4:12 pm: the meeting room in low sun through the blinds; Azuria's lawyers sit
                   against the window behind folders and papers, the laptop facing us shows the hard lines struck out
                   and rewritten, and the lab's moving boxes are stacked by the wall.
  rb-slide         Removed by the board, Day 1: the all-hands room in the dark, rows of heads facing the projected
                   slide SHIP VELOCITY, the new CEO a silhouette beside it.
  mu-alert         Catastrophic misuse, 3:02 am: the security console, an empty chair, the alarm beacon washing the
                   corner red; the log shows the weights download dismissed months ago, and a note says why.
  qt-evals         A quiet takeover, Month 1: the evals room, EVALUATION IN PROGRESS lit over the wall screen where
                   every test passes; Tomas, from behind, signs it off.
  al-badges        Aligned success, Month 4: the lobby from behind the front desk, visitor badges laid out for rival
                   labs, the visitor list on the desk monitor, a queue at the glass doors.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import furniture as F  # noqa: E402
import kit  # noqa: E402
import people as P  # noqa: E402


def room(W, D, H, wall, floor, ceiling="#2B2C2E", skip=()):
    """Walls round x -W..W, y 0..D; skip names walls left out (left, right, back, front) for windows."""
    kit.box((0, D / 2, -0.05), (2 * W + 0.2, D + 0.2, 0.1), floor)
    kit.box((0, D / 2, H + 0.05), (2 * W + 0.2, D + 0.2, 0.1), kit.mat(ceiling, 0.9))
    walls = {"left": ((-W - 0.05, D / 2, H / 2), (0.1, D, H)), "right": ((W + 0.05, D / 2, H / 2), (0.1, D, H)),
             "back": ((0, D + 0.05, H / 2), (2 * W, 0.1, H)), "front": ((0, -0.05, H / 2), (2 * W, 0.1, H))}
    for name, (c, s) in walls.items():
        if name not in skip:
            kit.box(c, s, wall)


def sign(text, at, size, colour, rot_z=0.0, strength=6.0):
    """Glowing letters facing -y (turned by rot_z)."""
    return kit.text(text, at, size, kit.mat(colour, 0.4, emit=colour, strength=strength), font=kit.FONT, rot=(math.radians(90), 0, rot_z))


# ------------------------------------------------------------------ the meeting room
def shot_ab_constitution():
    W, D, H = 2.6, 6.0, 2.8
    room(W, D, H, kit.mat("#CFC9BE", 0.85), kit.tex("brown_planks_05", 0.8, tint="#9A8A78", name="mfloor"), ceiling="#E6E2DA",
         skip=("right",))
    # the window wall on the right: sill, head, glass, and blinds half open so the sun comes through in bars
    wall = kit.mat("#CFC9BE", 0.85)
    kit.box((W + 0.05, D / 2, 0.4), (0.1, D, 0.8), wall)
    kit.box((W + 0.05, D / 2, H - 0.15), (0.1, D, 0.3), wall)
    g = kit.box((W + 0.06, D / 2, 1.6), (0.02, D, 1.6), kit.glass(0.02))
    g.visible_shadow = False
    F.batch("blinds", [((W - 0.04, D / 2, 0.86 + k * 0.075), (0.05, D, 0.004), (0, math.radians(35), 0)) for k in range(22)],
            kit.mat("#E9E4DA", 0.5))
    kit.world(hdri="canary_wharf", strength=0.6, rotation=110)
    kit.sun((0, 64, -18), 5.0, kit.kelvin(3600), angle=0.5)
    kit.area((-1.5, 1.0, H - 0.05), (-1.5, 1.0, 0), (1.0, 1.0), 25, kit.kelvin(4500))    # a soft fill from the ceiling
    # the table, the lawyers against the window, their papers
    tx = -0.25
    kit.box((tx, 3.3, 0.74), (1.3, 3.6, 0.04), kit.mat("#5B3F2C", 0.3, coat=0.4), bevel=0.01)
    for y in (1.8, 4.8):
        kit.box((tx, y, 0.36), (0.9, 0.08, 0.72), kit.mat("#2A2B2D", 0.4, 0.6))
    for (y, coat) in ((3.3, "#1F2226"), (4.35, "#2C2A30")):
        F.chair((0.72, y), 90, colour="#1B1C1E")
        P.person((0.72, y + 0.02), facing=90, pose="sit", coat=coat, hair="#141212", skin="#6E4630")
    rng = random.Random(5)
    blue = kit.mat("#243B63", 0.5)
    for k, (x, y, r) in enumerate(((0.12, 3.0, 0.3), (0.05, 3.55, -0.2), (0.15, 4.1, 0.1), (-0.05, 4.5, -0.4))):
        kit.box((x, y, 0.763 + k * 0.001), (0.24, 0.32, 0.004), blue, rot=(0, 0, r))
        F.flat_text("AZURIA\nLEGAL", (x, y, 0.7662 + k * 0.001), 0.03, "#E8ECF2", rot_z=r + math.radians(90), font=kit.FONT)
    for _ in range(9):
        F.paper((rng.uniform(-0.75, 0.25), rng.uniform(2.5, 4.8), 0.76 + rng.uniform(0, 0.004)), rot_z=rng.uniform(-0.6, 0.6))
    kit.place("office_notepads", (-0.55, 3.8, 0.76), rot_z=0.4)
    # the laptop at our end, and our own printed constitution under a red pen
    face = F.laptop("laptop", (-0.3, 2.05, 0.76), "ab-constitution", (150, 70, 980, 510), yaw=-22, width=0.36)
    F.paper((0.05, 1.86, 0.76), rot_z=-0.3)
    F.flat_text("constitution.md\n\nHARD LINES", (0.05 + 0.07 * math.sin(0.3), 1.86 + 0.07 * math.cos(0.3), 0.7615), 0.014, rot_z=-0.3,
                font=kit.FONT)
    F.batch("redlines", [((0.05 + d * math.sin(0.3), 1.86 - d * math.cos(0.3), 0.7618), (0.13, 0.003, 0.0004), -0.3) for d in (0.0, 0.04, 0.08)],
            kit.mat("#C8402A", 0.5))
    # the lab being packed along the left wall
    labels = ["BOX 14\nMODEL CARDS", "BOX 15\nEVALS", "BOX 16\nCONSTITUTION", "BOX 9\nPOSTERS", "BOX 11\nLAB NOTEBOOKS"]
    for k, (x, y, z) in enumerate(((0.9, 5.6, 0), (1.5, 5.6, 0), (1.2, 5.62, 0.42), (2.0, 5.2, 0), (2.0, 5.2, 0.42))):
        F.carton((x, y, z), (0.55, 0.42, 0.42), rot_z=math.radians(rng.uniform(-8, 8)), label=labels[k])
    kit.camera((-0.9, 1.25, 1.26), (0.0, 2.9, 0.83), lens=34, fstop=2.0, focus=face)


# ------------------------------------------------------------------ the all-hands room
def shot_rb_slide():
    W, D, H = 5.0, 11.0, 3.6
    room(W, D, H, kit.mat("#2A2C30", 0.85), kit.mat("#24262B", 0.9))
    face, _ = kit.screen("slide", (0.4, D - 0.08, 1.95), 3.6, "rb-slide", (80, 90, 720, 460), strength=1.3, bezel="#0D0D0E",
                         depth=0.03, border=0.04)
    # rows of stacking chairs facing the slide, an aisle down the middle, most seats taken
    seats, legs, people = [], [], []
    rng = random.Random(8)
    for y in [2.0 + k * 0.95 for k in range(8)]:
        for x in [-4.2 + k * 0.62 for k in range(14)]:
            if abs(x - 0.1) < 0.4:
                continue
            seats += [((x, y, 0.45), (0.46, 0.44, 0.04)), ((x, y - 0.21, 0.72), (0.44, 0.03, 0.38))]
            legs += [((x + dx, y + dy, 0.225), (0.022, 0.022, 0.45)) for dx in (-0.2, 0.2) for dy in (-0.19, 0.19)]
            if rng.random() < 0.3:
                people.append((x, y))
    F.batch("seats", seats, kit.mat("#2E3440", 0.7))
    F.batch("legs", legs, kit.mat("#8A8E94", 0.3, 0.9))
    coats = ["#3B3F46", "#2C3A4F", "#44343A", "#26302C", "#5B3A33", "#6A6154"]
    for k, (x, y) in enumerate(people):
        P.person((x, y + 0.02), facing=rng.uniform(-8, 8), pose="sit", coat=rng.choice(coats), seed=k,
                 hair=rng.choice(["#2A211C", "#141212", "#4A3526", "#8C8C8C"]))
    # the new CEO beside the slide, lit from behind by it
    P.person((-2.15, D - 0.9), facing=160, coat="#151618", height=1.8, seed=90)
    kit.area((-2.4, D - 0.3, 2.4), (-2.15, D - 0.9, 1.4), (0.6, 0.6), 25, kit.kelvin(6500))
    # the projector on the ceiling behind us, its beam through a little haze
    kit.box((0.4, 1.2, H - 0.25), (0.35, 0.3, 0.14), kit.mat("#D8D8D6", 0.4))
    beam = kit.spot((0.4, 1.36, H - 0.26), (0.4, D, 1.95), 2500, kit.kelvin(6800), angle=21, blend=0.15, radius=0.02)
    beam.visible_glossy = False
    kit.haze((0, D / 2, H / 2), (2 * W - 0.1, D - 0.2, H - 0.1), 0.02)
    kit.world("#050608", 1.0)
    kit.camera((1.1, 0.6, 1.72), (-0.1, D, 1.62), lens=36, fstop=4.0, focus=face)


# ------------------------------------------------------------------ the security console
def shot_mu_alert():
    W, D, H = 2.2, 3.6, 2.7
    room(W, D, H, kit.mat("#23272E", 0.85), kit.mat("#1B1D21", 0.6))
    F.desk(0.0, D - 0.45, w=2.2, d=0.8, top="#2B2D31")
    face = F.monitor("console", (0.0, D - 0.3), 1.15, "mu-alert", (70, 100, 1140, 300), strength=1.0)
    for side in (-1, 1):   # the camera feeds, grey and quiet
        F.dark_monitor((side * 1.0, D - 0.4), width=0.5, h=0.3, yaw=side * 28, glow=("#26323E", 1.2))
    F.note((-0.42, D - 0.78, 0.7555), "egress alerts =\nfalse positives.\njust dismiss. -J", size=0.1, text_size=0.012,
           rot=(0, 0, math.radians(8)))
    F.keyboard(0.0, D - 0.72)
    F.mug((0.42, D - 0.65, 0.755), colour="#2A2B2E")
    # the phone face up by the keyboard, notifications piling up
    kit.box((-0.45, D - 0.7, 0.762), (0.075, 0.155, 0.009), kit.mat("#111", 0.3), rot=(0, 0, 0.3))
    kit.box((-0.45, D - 0.7, 0.7672), (0.066, 0.14, 0.0005), kit.emission("#DCE6F5", 1.2), rot=(0, 0, 0.3))
    F.chair((0.75, D - 1.3), 235)
    # the beacon over the desk, and a clock
    kit.sphere((0.9, D - 0.08, 1.75), 0.07, kit.emission("#FF2A1A", 60), scale=(1, 0.7, 1))
    kit.point((0.9, D - 0.25, 1.72), 40, (1.0, 0.12, 0.06), radius=0.05)
    kit.box((-0.9, D - 0.03, 1.72), (0.42, 0.04, 0.16), kit.mat("#0B0B0C", 0.4))
    sign("03:02", (-0.9, D - 0.052, 1.72), 0.11, "#FF3B2A", strength=8)
    kit.area((0, D - 0.45, 1.0), (0, D - 0.9, 0.75), (1.0, 0.3), 5, kit.kelvin(7000))   # the console's spill on the desk
    kit.area((0, D - 0.9, 1.1), (0, D - 2.5, 1.0), (1.1, 0.3), 6, kit.kelvin(7000))   # the console's light on the room
    kit.world("#040506", 1.0)
    kit.camera((-0.3, 1.5, 1.4), (0.05, D - 0.3, 1.12), lens=28, fstop=4.0, focus=face)


# ------------------------------------------------------------------ the evals room
def shot_qt_evals():
    W, D, H = 2.5, 5.0, 2.8
    room(W, D, H, kit.mat("#4E545C", 0.9), kit.mat("#30343A", 0.7))
    for x in (-1.6, -0.55, 0.55, 1.6):   # acoustic panels on the back wall
        kit.box((x, D - 0.03, 1.5), (0.95, 0.04, 2.2), kit.mat("#3A3F47", 0.95), bevel=0.01)
    face, _ = kit.screen("suite", (0.0, D - 0.1, 1.5), 2.3, "qt-evals", (70, 80, 1140, 520), strength=1.4, bezel="#0E0F10",
                         depth=0.04, border=0.02)
    # the sign that tells everyone in the room, the model included, that this is a test
    kit.box((0.0, D - 0.1, 2.3), (1.5, 0.08, 0.2), kit.mat("#140606", 0.4), bevel=0.01)
    sign("EVALUATION IN PROGRESS", (0.0, D - 0.142, 2.3), 0.09, "#FF3B2A", strength=10)
    kit.point((0.0, D - 0.5, 2.3), 8, (1.0, 0.2, 0.12), radius=0.2)
    # the sign-off desk and Tomas, from behind
    F.desk(-0.3, D - 1.7, w=1.4, d=0.7, top="#2B2D31")
    kit.box((-0.05, D - 1.75, 0.757), (0.23, 0.32, 0.008), kit.mat("#6B4A34", 0.5), rot=(0, 0, 0.2))     # the clipboard
    F.paper((-0.05, D - 1.76, 0.762), size=(0.21, 0.28), rot_z=0.2)
    kit.cyl((0.08, D - 1.9, 0.768), 0.005, 0.14, kit.mat("#1C1C1C", 0.3, 0.6), rot=(0, math.radians(90), 0.9))
    F.chair((-0.35, D - 2.3), 0)
    P.person((-0.35, D - 2.28), facing=5, pose="sit", coat="#2C3A4F", hair="#4A3526", seed=12)
    kit.box((0.35, D - 1.6, 0.86), (0.07, 0.07, 0.2), kit.mat("#DDE8EE", 0.1, alpha=0.4))                    # a water bottle
    kit.area((0, D - 0.6, 1.5), (0, D - 3, 1.2), (2.2, 0.9), 18, kit.kelvin(7500))   # the wall screen's light
    kit.spot((-0.2, D - 1.6, H - 0.05), (-0.1, D - 1.75, 0.75), 60, kit.kelvin(3000), angle=50, blend=0.7)   # a downlight on the desk
    kit.world("#06070A", 1.0)
    kit.camera((0.4, 0.8, 1.5), (-0.05, D, 1.5), lens=32, fstop=4.0, focus=face)


# ------------------------------------------------------------------ the lobby
def shot_al_badges():
    W, D, H = 5.0, 9.0, 3.6
    room(W, D, H, kit.mat("#BDB6AA", 0.8), kit.tex("terrazzo_tiles", 0.5, rough=0.2, name="lfloor"), ceiling="#E8E4DC", skip=("back",))
    # the glass front and its doors, bright morning outside
    frame = kit.mat("#2A2B2D", 0.35, 0.8)
    g = kit.box((0, D + 0.02, H / 2), (2 * W, 0.02, H), kit.glass(0.03))
    g.visible_shadow = False
    for x in (-W, -2.6, -0.9, 0.9, 2.6, W):
        kit.box((x, D, H / 2), (0.08, 0.1, H), frame)
    kit.box((0, D, 2.5), (2 * W, 0.1, 0.08), frame)
    kit.world(hdri="canary_wharf", strength=1.1, rotation=0)
    kit.sun((-62, 0, 12), 4.0, kit.kelvin(5200), angle=0.6)
    kit.area((0, 2.0, H - 0.05), (0, 2.0, 0), (3, 2), 40, kit.kelvin(5000))
    sign("KESTREL LABS", (-W + 0.03, 4.5, 2.4), 0.36, "#F1E4C8", rot_z=math.radians(-90), strength=1.5)
    # the queue at the doors, between stanchions, backlit
    rng = random.Random(4)
    pts = [(0.1 + rng.uniform(-0.2, 0.2), 6.6 + k * 0.75, 180 + rng.uniform(-45, 45)) for k in range(9)]
    P.crowd(pts, seed=7, holds=[None, "phone", "paper", None])
    posts = [((x, y, 0.47), (0.05, 0.05, 0.94)) for x in (-0.45, 0.65) for y in (3.4, 5.0, 6.6)]
    F.batch("posts", posts, kit.mat("#B8B9BB", 0.2, 1.0))
    F.batch("belts", [((x, y, 0.9), (0.02, 1.55, 0.05)) for x in (-0.45, 0.65) for y in (4.2, 5.8)], kit.mat("#8A1E22", 0.6))
    kit.place("potted_plant_01", (-3.9, 7.8, 0))
    # the front desk: the visitor list on its monitor, the badges laid out for the day
    kit.box((0, 1.65, 0.54), (3.0, 0.5, 1.08), kit.mat("#D9D3C7", 0.4), bevel=0.01)
    kit.box((0, 1.6, 1.095), (3.1, 0.62, 0.03), kit.tex("marble_01", 1.0, name="counter"), bevel=0.004)
    face = F.monitor("desk", (0.4, 1.75), 0.55, "al-badges", (200, 100, 880, 470), z=1.11, yaw=-16)
    orgs = [("LODESTAR", "#3F84C6")] * 4 + [("DEEPTHINK", "#3F9C8F")] * 3 + [("OPENBRAIN", "#E0613B")] * 3
    for k, (org, col) in enumerate(orgs):
        x, y = -0.62 + (k % 5) * 0.105, 1.6 + (k // 5) * 0.16
        r = rng.uniform(-0.08, 0.08)
        kit.box((x, y, 1.1115), (0.07, 0.105, 0.002), kit.mat("#F4F1EA", 0.5), rot=(0, 0, r))
        kit.box((x, y + 0.04, 1.1128), (0.07, 0.022, 0.0004), kit.mat(col, 0.5), rot=(0, 0, r))
        F.flat_text("VISITOR", (x, y + 0.004, 1.113), 0.012, rot_z=r, font=kit.FONT)
        F.flat_text(org, (x, y - 0.022, 1.113), 0.0085, col, rot_z=r, font=kit.FONT)
        kit.box((x + 0.06, y + 0.02, 1.1115), (0.008, 0.12, 0.0015), kit.mat(col, 0.6), rot=(0, 0, r + 0.5))   # lanyard
    kit.camera((-0.1, 0.62, 1.6), (0.0, 4.0, 0.98), lens=27, fstop=2.2, focus=face)


kit.run({"ab-constitution": shot_ab_constitution, "rb-slide": shot_rb_slide, "mu-alert": shot_mu_alert, "qt-evals": shot_qt_evals,
         "al-badges": shot_al_badges})
