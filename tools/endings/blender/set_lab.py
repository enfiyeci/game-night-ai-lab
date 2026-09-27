"""Your lab: an open-plan office with rows of desks and monitors, a glass wall onto the city on the right, a server
room behind a glass partition at the back, and one desk in front of the camera (the hero desk, also Tomas's desk).
Shots:

  mis-scores   Catastrophic misalignment, launch night: Tomas's desk after the party. Paper cups, a bottle, confetti;
               his chair pushed back; his monitor shows the scorecard, and how resolved is counted.
  ov-letter    Overtaken, Month 1, afternoon: the invitation to comment, two pages at most, on the monitor; beside it
               your own model specification, a ream thick, and a two-page draft cut down in red.
  ov-email     Overtaken, Year 1, night: the automated reply on the monitor, next to the bound, tabbed report it answers.
  cw-letter    A costly win, victory night: Tomas's resignation on his monitor, the printed letter under the trophy,
               his badge left on the keyboard; the party goes on at the far end of the office.
  cw-reveal    A costly win, Month 3: two monitors side by side, what you wrote and what the model learned.
  cw-phone     A costly win, late night: the phone in its dock lit with the President's call, live captions of it
               on the laptop, the trophy behind, and an office with every other screen dark.
  rb-budget    Removed by the board, Day 1: Tomas's monitor shows the safety share cut to 3%; the framed pledge of 20%
               still stands on his desk.
  lb-usage     Left behind, the era gate: the usage chart on the wall screen over desks being packed into boxes; a
               last colleague carries a box out.
  pd-cursor    A negotiated pace, Month 1, 2 am: a lone hooded engineer at a desk in a dark office, the action that
               would break the deal on the screen. Generic: the plate names the lab.
  rd-letter-1..2   Someone else's disaster, Day 5: the moratorium letter on the monitor; behind the glass the server
               racks are lit (-1), then dark (-2).
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import furniture as F  # noqa: E402
import kit  # noqa: E402
import people as P  # noqa: E402

OW, OD, OH = 9.0, 14.0, 3.0    # office half-width, depth, height; the hero desk sits near y=2
MAIL = (230, 100, 820, 490)    # the mail window in the letter plates


def office(time="night", back_plate=None, back_crop=(0, 0, 1280, 720), screens=0.85, racks=None, chairs=1.0, monitors=1.0, seed=4):
    """time: night, day (low sun through the city glass) or grey (overcast). screens: the share of desk monitors on
    (showing back_plate); monitors: the share of desks that still have one. racks: None for a plain back wall, True/False for the server room lit or dark."""
    kit.box((0, OD / 2, -0.05), (2 * OW, OD, 0.1), kit.tex("brushed_concrete", 1.0, rough=0.35, name="ofloor"))
    kit.box((0, OD / 2, OH + 0.05), (2 * OW, OD, 0.1), kit.mat("#2B2C2E", 0.9))
    wall = kit.mat("#3A3D40" if time == "night" else "#8A8C8E", 0.8)
    kit.box((-OW - 0.05, OD / 2, OH / 2), (0.1, OD, OH), wall)
    kit.box((0, -0.05, OH / 2), (2 * OW, 0.1, OH), wall)
    if racks is None:
        kit.box((0, OD + 0.05, OH / 2), (2 * OW, 0.1, OH), wall)
    else:
        server_room(racks, wall)
    # a glass wall onto the city on the right (it casts no shadow, so the sun comes through)
    g = kit.box((OW + 0.01, OD / 2, OH / 2), (0.02, OD, OH), kit.glass(0.03))
    g.visible_shadow = False
    for y in range(0, int(OD) + 1, 2):
        kit.box((OW, y, OH / 2), (0.08, 0.06, OH), kit.mat("#1C1D1F", 0.4, 0.5))
    rng = random.Random(seed)
    if time == "night":
        for i in range(24):
            h = rng.uniform(20, 70)
            kit.box((OW + rng.uniform(15, 60), rng.uniform(-10, 40), h / 2), (rng.uniform(6, 12), rng.uniform(6, 12), h), kit.mat("#15181D", 0.7))
        kit.world("#07090C", 1.0)
    elif time == "day":
        kit.world(hdri="canary_wharf", strength=0.7, rotation=200)
        kit.sun((0, 68, 12), 4.0, kit.kelvin(4300), angle=0.6)
    else:
        kit.world(hdri="cambridge", strength=0.9, rotation=90)
    # ceiling strips: a couple left on at night, all on by day
    for y in range(2, int(OD), 3):
        for x in (-5, 0, 5):
            on = time != "night" or (x, y) in ((0, 11), (-5, 5))
            kit.box((x, y, OH - 0.03), (0.15, 2.0, 0.04), kit.emission("#EAF2F0", 8 if on else 0.02))
            if on:
                kit.area((x, y, OH - 0.08), (x, y, 0), (0.15, 2.0), 60 if time == "night" else 45, kit.kelvin(5200))
    # rows of desks, receding
    for row, y in enumerate((5.0, 7.5, 10.0, 12.5)):
        for x in (-6.0, -3.6, -1.2, 1.2, 3.6, 6.0):
            if (row, x) == (0, 1.2):
                continue
            F.desk(x, y)
            if back_plate and rng.random() < screens:
                kit.screen(f"bg{row}{x}", (x, y + 0.2, 1.06), 0.55, back_plate, crop=back_crop, strength=0.6, live=False)
            elif rng.random() < monitors:
                F.dark_monitor((x, y + 0.2), h=0.3)
            if rng.random() < chairs:
                F.chair((x + rng.uniform(-0.2, 0.2), y - 0.6), rng.uniform(-30, 30) + 180)


def server_room(lit, wall):
    """Racks behind a glass partition in the back wall (x -7..1): LED faces that go out when the models go offline."""
    x0, x1, z0, z1 = -7.0, 1.0, 0.9, 2.6
    kit.box(((x0 - OW) / 2, OD + 0.05, OH / 2), (x0 + OW, 0.1, OH), wall)
    kit.box(((x1 + OW) / 2, OD + 0.05, OH / 2), (OW - x1, 0.1, OH), wall)
    kit.box(((x0 + x1) / 2, OD + 0.05, z0 / 2), (x1 - x0, 0.1, z0), wall)
    kit.box(((x0 + x1) / 2, OD + 0.05, (z1 + OH) / 2), (x1 - x0, 0.1, OH - z1), wall)
    pane = kit.box(((x0 + x1) / 2, OD + 0.05, (z0 + z1) / 2), (x1 - x0, 0.02, z1 - z0), kit.glass(0.02))
    pane.visible_shadow = False
    kit.box((0, OD + 3, -0.05), (2 * OW, 6, 0.1), kit.mat("#1A1C1F", 0.4))
    kit.box((0, OD + 3, OH + 0.05), (2 * OW, 6, 0.1), kit.mat("#141517", 0.8))
    for x in (-OW - 0.05, OW + 0.05):
        kit.box((x, OD + 3, OH / 2), (0.1, 6, OH), kit.mat("#141517", 0.8))
    kit.box((0, OD + 6.05, OH / 2), (2 * OW, 0.1, OH), kit.mat("#141517", 0.8))
    rng = random.Random(9)
    bodies, green, blue, red = [], [], [], []
    for ry in (OD + 1.6, OD + 4.2):
        for k in range(12):
            x = x0 - 0.5 + k * 0.72
            bodies.append(((x, ry, 1.05), (0.66, 1.0, 2.1)))
            for u in range(38):
                z = 0.2 + u * 0.048
                for c in range(3):
                    if rng.random() < 0.45:
                        led = ((x - 0.22 + c * 0.05 + rng.uniform(-0.01, 0.01), ry - 0.505, z), (0.012, 0.004, 0.008))
                        (green if rng.random() < 0.6 else blue).append(led)
            red.append(((x + 0.24, ry - 0.505, 1.95), (0.014, 0.004, 0.01)))
    F.batch("racks", bodies, kit.mat("#0E0F11", 0.35, 0.4))
    F.batch("leds-green", green, kit.emission("#43F29A", 40 if lit else 0))
    F.batch("leds-blue", blue, kit.emission("#4AA8FF", 40 if lit else 0))
    F.batch("leds-red", red, kit.emission("#FF3322", 8 if lit else 25))   # standby lamps stay on
    for x in (-5.0, -1.5):
        kit.box((x, OD + 2.9, OH - 0.03), (0.15, 3.0, 0.04), kit.emission("#9FD4FF", 6 if lit else 0.0))
        if lit:
            kit.area((x, OD + 2.9, OH - 0.1), (x, OD + 2.9, 0), (0.2, 3), 90, (0.62, 0.8, 1.0))


def hero_desk(plate, crop, x=0.0, y=2.0, monitor_w=0.62, top="#B9A88E", strength=1.1):
    """The desk in front of the camera, and its monitor (the live screen 'monitor')."""
    F.desk(x, y, top=top)
    face = F.monitor("monitor", (x, y + 0.2), monitor_w, plate, crop, strength=strength)
    F.keyboard(x - 0.05, y - 0.12)
    return face


def confetti(center, spread, n=160, seed=1, z=0.757):
    rng = random.Random(seed)
    cols = ["#E0613B", "#3F9C8F", "#3F84C6", "#E9C46A", "#F1E4C8"]
    for i, c in enumerate(cols):
        bits = [((center[0] + rng.gauss(0, spread[0]), center[1] + rng.gauss(0, spread[1]), z + rng.uniform(0, 0.002)),
                 (0.012, 0.008, 0.0005), rng.uniform(0, 6.3)) for _ in range(n // len(cols))]
        F.batch(f"confetti{seed}-{i}", bits, kit.mat(c, 0.5))


def ream(at, pages, rot_z=0.0, tabs=0, seed=1):
    """A stack of paper `pages` sheets thick, with coloured tabs sticking out of its right edge."""
    x, y, z = at
    h = pages * 0.0001
    kit.box((x, y, z + h / 2), (0.21, 0.297, h), kit.mat("#EFEBE2", 0.8), rot=(0, 0, rot_z))
    rng = random.Random(seed)
    c, s = math.cos(rot_z), math.sin(rot_z)
    for k in range(tabs):
        dy, dz = rng.uniform(-0.12, 0.12), rng.uniform(0.002, h - 0.002)
        kit.box((x + 0.11 * c - dy * s, y + 0.11 * s + dy * c, z + dz), (0.025, 0.018, 0.0008),
                kit.mat(rng.choice(["#E9C46A", "#E0613B", "#3F84C6", "#3F9C8F"]), 0.6), rot=(0, 0, rot_z))
    return z + h


def party(y0=9.5):
    """The celebration at the far end of the office: coloured lamps, balloons, a crowd from behind."""
    rng = random.Random(3)
    for k in range(14):
        x, y = rng.uniform(-5, 3), rng.uniform(y0, y0 + 3)
        kit.sphere((x, y, rng.uniform(1.9, 2.7)), 0.16, kit.mat(rng.choice(["#E0613B", "#E9C46A", "#3F84C6", "#F1E4C8"]), 0.3, coat=0.8),
                   scale=(1, 1, 1.15))
    for (x, y, col, e) in ((-3.5, y0 + 1, "#FF4F7A", 120), (0.5, y0 + 2, "#FFB347", 140), (-1.5, y0 + 0.5, "#8A6BFF", 90)):
        kit.point((x, y, 2.2), e, kit.lin(col)[:3], radius=0.3)
    P.crowd([(rng.uniform(-4.5, 2.5), rng.uniform(y0, y0 + 2.5), rng.uniform(-60, 60) + 180 * (k % 3 == 0)) for k in range(11)], seed=5,
            holds=[None, "cup", "cup", "phone"])


def shot_mis_scores():
    office(back_plate="mis-scores", back_crop=(48, 64, 1184, 666))
    face = hero_desk("mis-scores", (48, 64, 1184, 666))
    # the party is over: cups, a bottle on its side, confetti, a paper hat, a sticky note on the bezel
    for (x, y, tipped) in ((-0.55, 1.95, False), (-0.42, 1.78, False), (0.52, 1.85, True), (0.62, 2.1, False)):
        F.cup((x, y, 0.755), tipped=tipped)
    kit.place("wine_bottles_01", (-0.68, 2.2, 0.755), rot_z=0.4)
    confetti((0.0, 2.0), (0.4, 0.2), seed=2)
    confetti((0.0, 1.0), (1.2, 0.8), n=120, seed=3, z=0.001)
    kit.cyl((0.38, 1.74, 0.79), 0.045, 0.11, kit.mat("#E0613B", 0.7), r2=0.003, rot=(math.radians(80), 0, 0.9))   # a paper hat
    F.note((0.26, 2.198, 1.02), "0 complaints?\n0 is not a\nreal number", rot=(math.radians(90), 0, math.radians(-4)))
    F.chair((0.45, 1.25), 200)
    kit.place("desk_lamp_arm_01", (-0.7, 2.25, 0.755))
    kit.point((-0.55, 2.05, 1.15), 8, kit.kelvin(2700), radius=0.05)
    kit.area((0, 1.9, 1.05), (0, 1.0, 0.9), (0.6, 0.35), 4, kit.kelvin(6500))   # the monitor's spill on the desk
    kit.haze((0, OD / 2, OH / 2), (2 * OW - 0.1, OD - 0.1, OH - 0.1), 0.008)
    kit.camera((-0.55, 0.75, 1.22), (0.02, 2.2, 1.0), lens=38, fstop=2.2, focus=face)


def shot_ov_letter():
    office("day", back_plate="lb-usage", back_crop=(70, 80, 1140, 500), screens=0.6)
    face = hero_desk("ov-letter", MAIL)
    # your own specification, a ream thick, tabbed; beside it the draft reply, cut to two pages in red
    top = ream((-0.52, 2.06, 0.755), 900, rot_z=-0.12, tabs=14)
    kit.box((-0.52, 2.06, top + 0.001), (0.19, 0.27, 0.001), kit.mat("#DCE3EA", 0.7), rot=(0, 0, -0.12))
    F.flat_text("KESTREL MODEL\nSPECIFICATION\n\nversion 12\n412 pages", (-0.52, 2.08, top + 0.0022), 0.022, "#2B2B2B", rot_z=-0.12, font=kit.FONT)
    for k, r in enumerate((0.14, 0.2)):
        F.paper((0.46, 1.86, 0.755 + k * 0.0013), rot_z=r)
    red = kit.mat("#C8402A", 0.5)
    c, sn = math.cos(0.2), math.sin(0.2)
    F.batch("strikes", [((0.46 - dy * sn, 1.86 + dy * c, 0.7585), (0.15, 0.003, 0.0004), 0.2) for dy in [0.08 - k * 0.02 for k in range(9)]], red)
    F.flat_text("COMMENTS, DRAFT 7", (0.46 - 0.115 * sn, 1.86 + 0.115 * c, 0.7586), 0.012, rot_z=0.2, font=kit.FONT)
    F.flat_text("page 1 of 2", (0.46 + 0.125 * sn, 1.86 - 0.125 * c, 0.7586), 0.009, rot_z=0.2)
    kit.cyl((0.3, 1.76, 0.762), 0.005, 0.14, red, rot=(0, math.radians(90), -0.5))    # the red pen
    F.mug((0.62, 2.12, 0.755))
    kit.camera((-0.8, 0.72, 1.36), (0.1, 2.2, 0.9), lens=34, fstop=2.8, focus=face)


def shot_ov_email():
    office(back_plate="ov-email", back_crop=MAIL, screens=0.15)
    face = hero_desk("ov-email", MAIL)
    # the report they were sent, under the lamp: bound, thick with tabs, a year of work
    top = ream((-0.46, 1.98, 0.755), 500, rot_z=0.18, tabs=18, seed=3)
    kit.box((-0.46, 1.98, top + 0.0015), (0.215, 0.3, 0.002), kit.mat("#1F3B57", 0.5), rot=(0, 0, 0.18))
    F.flat_text("OUR FINDINGS ON\nOPENBRAIN 7\n\n212 pages\nfull data attached", (-0.455, 2.01, top + 0.003), 0.021, "#F1EEE6", rot_z=0.18,
                font=kit.FONT)
    F.mug((0.45, 1.95, 0.755))
    kit.place("desk_lamp_arm_01", (-0.72, 2.28, 0.755), rot_z=math.radians(60))
    kit.spot((-0.55, 2.1, 1.2), (-0.46, 1.98, 0.76), 12, kit.kelvin(2700), angle=70, radius=0.04)
    kit.area((0, 1.9, 1.05), (0, 1.0, 0.9), (0.6, 0.35), 4, kit.kelvin(6500))
    kit.camera((0.62, 0.72, 1.34), (-0.05, 2.2, 0.94), lens=32, fstop=2.8, focus=face)


def shot_cw_letter():
    office(back_plate="mis-scores", back_crop=(48, 64, 1184, 666), screens=0.3)
    party()
    face = hero_desk("cw-letter", MAIL)
    # the trophy, the printed letter folded under it, his badge on the keyboard; his chair pushed in
    F.paper((0.4, 1.98, 0.755), rot_z=0.35)
    F.flat_text("RESIGNATION", (0.4 + 0.1 * math.sin(0.35), 1.98 - 0.1 * math.cos(0.35), 0.7567), 0.026, rot_z=0.35, font=kit.FONT)
    F.trophy((0.5, 2.06, 0.7565), scale=1.2)
    kit.box((-0.05, 1.86, 0.772), (0.055, 0.085, 0.002), kit.mat("#F1EEE6", 0.5), rot=(0, 0, 0.3))       # the badge
    kit.text("TOMAS\nSAFETY", (-0.05, 1.86, 0.7735), 0.008, kit.mat("#2B2B2B", 0.6), rot=(0, 0, 0.3), extrude=0.0001)
    kit.box((-0.14, 1.93, 0.771), (0.25, 0.006, 0.001), kit.mat("#3F9C8F", 0.6), rot=(0, 0, 0.9))          # its lanyard
    confetti((0.0, 1.4), (1.2, 0.9), n=100, seed=6, z=0.001)
    kit.point((0.9, 1.4, 1.4), 4, kit.kelvin(2700), radius=0.2)
    kit.area((0, 1.9, 1.05), (0, 1.0, 0.9), (0.6, 0.35), 4, kit.kelvin(6500))
    kit.camera((0.75, 0.72, 1.32), (0.02, 2.2, 0.91), lens=35, fstop=2.4, focus=face)


def shot_cw_reveal():
    office("grey", back_plate="cw-reveal", back_crop=(90, 110, 1100, 430), screens=0.5)
    F.desk(0.0, 2.0, w=1.8, top="#B9A88E")
    left = F.monitor("written", (-0.29, 2.18), 0.52, "cw-reveal", (90, 110, 530, 430), yaw=-9)
    F.monitor("learned", (0.29, 2.18), 0.52, "cw-reveal", (660, 110, 530, 430), yaw=9)
    F.keyboard(-0.05, 1.8)
    F.mug((-0.66, 1.98, 0.755))
    kit.camera((0.18, 0.45, 1.24), (0.0, 2.2, 1.04), lens=38, fstop=4.0, focus=left)


def shot_cw_phone():
    office(screens=0.0)
    F.desk(0.0, 2.0, top="#B9A88E")
    # the phone standing in its dock, the laptop captioning the call, the trophy from victory night
    kit.box((0.16, 1.9, 0.77), (0.1, 0.08, 0.03), kit.mat("#1A1B1D", 0.4), bevel=0.006)
    kit.screen("phone", (0.16, 1.905, 0.872), 0.085, "cw-phone", (172, 102, 251, 472), rot=(math.radians(80), 0, math.radians(-8)),
               strength=1.3, bezel="#0C0C0D", depth=0.008, border=0.005)
    F.laptop("captions", (-0.24, 2.1, 0.755), "cw-phone", (512, 192, 676, 226), yaw=10, strength=1.0, width=0.36)
    F.trophy((0.02, 2.62, 0.755), scale=0.8)
    kit.area((0.16, 1.8, 0.9), (0.16, 1.4, 0.76), (0.08, 0.15), 0.8, kit.kelvin(7500))   # the phone's light on the desk
    kit.camera((0.06, 1.42, 1.03), (0.0, 2.1, 0.885), lens=32, fstop=8.0, focus=(0.0, 1.95, 0.88))


def shot_rb_budget():
    office("day", back_plate="lb-usage", back_crop=(70, 80, 1140, 500), screens=0.8)
    face = hero_desk("rb-budget", (70, 80, 1140, 500), monitor_w=0.7)
    # the pledge, framed on his desk
    x, y = 0.52, 2.12
    kit.box((x, y, 0.86), (0.2, 0.015, 0.25), kit.mat("#1B1B1B", 0.4), bevel=0.004, rot=(math.radians(-8), 0, math.radians(-20)))
    kit.box((x - 0.003, y - 0.009, 0.86), (0.17, 0.002, 0.22), kit.mat("#F4F0E6", 0.6), rot=(math.radians(-8), 0, math.radians(-20)))
    ink = kit.mat("#2B2B2B", 0.6)
    for (body, dz, size) in (("OUR PLEDGE", 0.085, 0.014), ("20%", 0.035, 0.06), ("of our compute\ngoes to safety,\nwhatever our\nrivals do.", -0.035, 0.013),
                             ("Kestrel Labs, 2025", -0.09, 0.011)):
        kit.text(body, (x - 0.0035 + 0.048 * dz, y - 0.0105 + 0.131 * dz, 0.86 + 0.99 * dz),   # up the tilted card
                 size, ink, font=kit.FONT, rot=(math.radians(82), 0, math.radians(-20)), extrude=0.0002)
    F.mug((-0.5, 1.85, 0.755), colour="#3F9C8F")
    kit.place("potted_plant_04", (-0.62, 2.2, 0.755))
    P.person((-2.7, 5.4), facing=0, pose="sit", coat="#44343A")
    P.person((2.3, 7.9), facing=10, pose="sit", coat="#2C3A4F")
    kit.camera((0.72, 0.72, 1.28), (0.05, 2.2, 0.94), lens=36, fstop=2.8, focus=face)


def shot_lb_usage():
    office(screens=0.0, chairs=0.5, monitors=0.35, seed=7)
    kit.screen("wall", (0.0, OD - 0.05, 2.1), 3.8, "lb-usage", (70, 80, 1140, 500), strength=1.6, depth=0.06, border=0.03, bezel="#101112")
    # desks being packed into boxes; a last colleague carries one out
    rng = random.Random(11)
    labels = ["DESK 14", "RESEARCH", "KEEP", "MONITORS", "DESK 9", "EVALS", "", "CABLES"]
    for k, (x, y) in enumerate(((-3.6, 5.0), (1.2, 7.5), (-1.2, 7.5), (3.6, 10.0), (-1.2, 5.0), (1.2, 10.0), (-3.6, 10.0), (3.6, 5.0))):
        F.carton((x + rng.uniform(-0.3, 0.3), y - 0.05, 0.755), (0.55, 0.38, 0.34), rot_z=rng.uniform(-0.3, 0.3), label=labels[k])
    for k in range(3):
        F.carton((2.2 + k * 0.05, 3.9, k * 0.4), (0.6, 0.4, 0.4), rot_z=0.1 * k, label="LAB " + str(k + 1))
    kit.area((2.8, 8.0, OH - 0.1), (2.8, 8.0, 0), (5.0, 4.0), 600, kit.kelvin(4000))    # the last lights on over the packing, not on him
    P.person((-1.5, 6.25), facing=25, pose="walk", coat="#141416", hair="#0E0D0C", skin="#2A201B")
    F.carton((-1.63, 6.52, 0.85), (0.64, 0.4, 0.3), rot_z=math.radians(25), taped=False)    # carried in front of him
    kit.camera((0.9, 0.9, 1.6), (0.0, OD, 1.5), lens=32, fstop=2.4, focus=(0, OD, 2.1))


def shot_pd_cursor():
    office(back_plate=None, screens=0.0, seed=12)
    face = hero_desk("pd-cursor", (160, 100, 960, 460), top="#C9C2B6")
    F.mug((0.42, 1.78, 0.755), colour="#1F2226")
    P.person((-0.28, 1.42), facing=8, pose="sit", coat="#1F2226", hood=True)
    kit.area((0, 1.9, 1.05), (0, 1.0, 0.9), (0.6, 0.35), 1.0, kit.kelvin(6500))   # the screen's glow, just a rim on him
    kit.camera((0.62, 0.62, 1.38), (-0.02, 2.2, 1.03), lens=36, fstop=2.8, focus=face)


def rd_letter(lit):
    def shot():
        office(back_plate="mis-scores" if lit else None, back_crop=(48, 64, 1184, 666), screens=0.8 if lit else 0.0, racks=lit)
        face = hero_desk("rd-letter", MAIL)
        F.mug((-0.5, 1.85, 0.755))
        kit.area((0, 1.9, 1.05), (0, 1.0, 0.9), (0.6, 0.35), 4, kit.kelvin(6500))
        kit.camera((0.78, 0.7, 1.26), (-0.12, 2.2, 1.02), lens=34, fstop=2.8, focus=face)
    return shot


kit.run({"mis-scores": shot_mis_scores, "ov-letter": shot_ov_letter, "ov-email": shot_ov_email, "cw-letter": shot_cw_letter,
         "cw-reveal": shot_cw_reveal, "cw-phone": shot_cw_phone, "rb-budget": shot_rb_budget, "lb-usage": shot_lb_usage,
         "pd-cursor": shot_pd_cursor, "rd-letter-1": rd_letter(True), "rd-letter-2": rd_letter(False)})
