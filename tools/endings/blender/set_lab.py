"""Your lab at night: an open-plan office with rows of desks and monitors, a server-room glow at the back, and one
desk in front of the camera. Shots:

  mis-scores   Catastrophic misalignment, launch night: Tomas's desk after the party. Paper cups, a bottle, confetti;
               his chair pushed back; his monitor shows the scorecard, and how resolved is counted.
"""
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

OW, OD, OH = 9.0, 14.0, 3.0    # office half-width, depth, height; the hero desk sits near y=2


def office(night=True, back_plate=None, back_crop=(0, 0, 1280, 720)):
    kit.box((0, OD / 2, -0.05), (2 * OW, OD, 0.1), kit.tex("brushed_concrete", 1.0, rough=0.35, name="ofloor"))
    kit.box((0, OD / 2, OH + 0.05), (2 * OW, OD, 0.1), kit.mat("#2B2C2E", 0.9))
    wall = kit.mat("#3A3D40", 0.8)
    kit.box((0, OD + 0.05, OH / 2), (2 * OW, 0.1, OH), wall)
    kit.box((-OW - 0.05, OD / 2, OH / 2), (0.1, OD, OH), wall)
    kit.box((OW + 0.05, OD / 2, OH / 2), (0.1, OD, OH), wall)
    kit.box((0, -0.05, OH / 2), (2 * OW, 0.1, OH), wall)
    # a glass wall of city at night on the right
    kit.box((OW - 0.02, OD / 2, OH / 2), (0.02, OD, OH), kit.glass(0.03))
    rng = random.Random(4)
    for i in range(24):
        h = rng.uniform(20, 70)
        x = OW + rng.uniform(15, 60)
        kit.box((x, rng.uniform(-10, 40), h / 2), (rng.uniform(6, 12), rng.uniform(6, 12), h), kit.mat("#15181D", 0.7))
    # ceiling strips, off for the night except a few
    for y in range(2, int(OD), 3):
        for x in (-5, 0, 5):
            on = night and (x, y) in ((0, 11), (-5, 5))
            kit.box((x, y, OH - 0.03), (0.15, 2.0, 0.04), kit.emission("#EAF2F0", 8 if on else 0.02))
            if on:
                kit.area((x, y, OH - 0.08), (x, y, 0), (0.15, 2.0), 60, kit.kelvin(5200))
    # rows of desks with glowing monitors, receding
    desk = kit.mat("#C9C2B6", 0.5)
    leg = kit.mat("#2A2B2D", 0.4, 0.6)
    for row, y in enumerate((5.0, 7.5, 10.0, 12.5)):
        for x in (-6.0, -3.6, -1.2, 1.2, 3.6, 6.0):
            if (row, x) == (0, 1.2):
                continue
            kit.box((x, y, 0.74), (1.6, 0.8, 0.03), desk)
            for dx in (-0.75, 0.75):
                kit.box((x + dx, y, 0.37), (0.04, 0.7, 0.74), leg)
            if rng.random() < 0.85 and back_plate:
                kit.screen(f"bg{row}{x}", (x, y + 0.2, 1.06), 0.55, back_plate, crop=back_crop, strength=0.6, live=False)
            chair((x + rng.uniform(-0.2, 0.2), y - 0.6), rng.uniform(-30, 30) + 180)
    kit.world("#07090C", 1.0)


def chair(at, facing, colour="#232427"):
    x, y = at
    m = kit.mat(colour, 0.6)
    metal = kit.mat("#9B9EA3", 0.3, 0.9)
    root = bpy.data.objects.new("chair", None)
    bpy.context.scene.collection.objects.link(root)
    parts = [kit.box((0, 0, 0.48), (0.5, 0.48, 0.07), m, bevel=0.02), kit.box((0, -0.24, 0.85), (0.46, 0.06, 0.58), m, bevel=0.025),
             kit.cyl((0, 0, 0.26), 0.025, 0.42, metal)]
    for k in range(5):
        a = k * 2 * math.pi / 5
        parts.append(kit.box((math.cos(a) * 0.16, math.sin(a) * 0.16, 0.05), (0.34, 0.04, 0.03), metal, rot=(0, 0, a)))
    for p in parts:
        p.parent = root
    root.location = (x, y, 0)
    root.rotation_euler = (0, 0, math.radians(facing))
    return root


def hero_desk(plate, crop, x=0.0, y=2.0, monitor_w=0.62):
    """The desk in front of the camera, and its monitor (the live screen 'monitor')."""
    kit.box((x, y, 0.74), (1.6, 0.8, 0.03), kit.mat("#B9A88E", 0.45))
    for dx in (-0.75, 0.75):
        kit.box((x + dx, y, 0.37), (0.04, 0.7, 0.74), kit.mat("#2A2B2D", 0.4, 0.6))
    h = monitor_w * crop[3] / crop[2]
    face, _ = kit.screen("monitor", (x, y + 0.2, 0.9 + h / 2), monitor_w, plate, crop=crop, strength=1.1, depth=0.025)
    kit.cyl((x, y + 0.24, 0.84), 0.02, 0.2, kit.mat("#2A2B2D", 0.4, 0.6))
    kit.box((x, y + 0.26, 0.76), (0.22, 0.16, 0.012), kit.mat("#2A2B2D", 0.4, 0.6), bevel=0.004)
    kit.box((x - 0.05, y - 0.12, 0.765), (0.42, 0.13, 0.015), kit.mat("#1D1E20", 0.5), bevel=0.003)   # keyboard
    kit.box((x + 0.3, y - 0.12, 0.765), (0.06, 0.1, 0.02), kit.mat("#1D1E20", 0.4), bevel=0.008)       # mouse
    return face


def confetti(center, spread, n=160, seed=1, z=0.757):
    rng = random.Random(seed)
    cols = ["#E0613B", "#3F9C8F", "#3F84C6", "#E9C46A", "#F1E4C8"]
    for i in range(n):
        x = center[0] + rng.gauss(0, spread[0])
        y = center[1] + rng.gauss(0, spread[1])
        kit.box((x, y, z + rng.uniform(0, 0.002)), (0.012, 0.008, 0.0005), kit.mat(rng.choice(cols), 0.5), rot=(0, 0, rng.uniform(0, 6.3)))


def shot_mis_scores():
    office(back_plate="mis-scores", back_crop=(48, 64, 1184, 666))
    face = hero_desk("mis-scores", (48, 64, 1184, 666))
    # the party is over: cups, a bottle on its side, confetti, a paper hat, a sticky note on the bezel
    cup = kit.mat("#F2EEE6", 0.6)
    for (x, y, tipped) in ((-0.55, 1.95, False), (-0.42, 1.78, False), (0.52, 1.85, True), (0.62, 2.1, False)):
        c = kit.cyl((x, y, 0.8 if not tipped else 0.785), 0.03, 0.09, cup, r2=0.023, rot=(math.radians(90) if tipped else 0, 0, 0.6))
    kit.place("wine_bottles_01", (-0.68, 2.2, 0.755), rot_z=0.4)
    confetti((0.0, 2.0), (0.4, 0.2), seed=2)
    confetti((0.0, 1.0), (1.2, 0.8), n=120, seed=3, z=0.001)
    kit.cyl((0.38, 1.74, 0.79), 0.045, 0.11, kit.mat("#E0613B", 0.7), r2=0.003, rot=(math.radians(80), 0, 0.9))   # a paper hat
    note = kit.plane((0.26, 2.198, 1.02), (0.07, 0.07), kit.mat("#F3E27A", 0.7), rot=(math.radians(90), 0, math.radians(-4)))
    kit.text("0 complaints?\n0 is not a\nreal number", (0.26, 2.195, 1.022), 0.0085, kit.mat("#2B2B2B", 0.7), font=kit.FONT_SANS)
    chair((0.45, 1.25), 200)
    kit.place("desk_lamp_arm_01", (-0.7, 2.25, 0.755), rot_z=math.radians(120))
    kit.point((-0.55, 2.05, 1.15), 8, kit.kelvin(2700), radius=0.05)
    kit.area((0, 1.9, 1.05), (0, 1.0, 0.9), (0.6, 0.35), 4, kit.kelvin(6500))   # the monitor's spill on the desk
    kit.haze((0, OD / 2, OH / 2), (2 * OW - 0.1, OD - 0.1, OH - 0.1), 0.008)
    kit.camera((-0.55, 0.75, 1.22), (0.02, 2.2, 1.0), lens=38, fstop=2.2, focus=face)


kit.run({"mis-scores": shot_mis_scores})
