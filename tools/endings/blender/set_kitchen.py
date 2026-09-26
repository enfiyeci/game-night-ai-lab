"""The Reyes kitchen: a small family kitchen with a table under the window, a laptop on the table, counters and a
fridge behind. Mina is seen from behind or not at all. Shots:

  mis-laptop   Catastrophic misalignment, Day 9: the power is out. Candles on the table, the fridge dark and ajar,
               the street outside unlit; the laptop runs on its battery and shows the support chat that closed her
               ticket because her account says active.
"""
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

# the room: x -2.2..2.2, y 0..4 (window wall at y=4), height 2.6; the table sits under the window
RW, RD, RH = 2.2, 4.0, 2.6


def room(lights_on=False):
    wall = kit.tex("painted_plaster_wall", 0.45, tint="#E9DDC8", name="kwall")
    kit.box((0, RD / 2, -0.05), (2 * RW, RD, 0.1), kit.tex("old_linoleum_flooring_01", 0.6, name="kfloor"))
    kit.box((0, RD / 2, RH + 0.05), (2 * RW, RD, 0.1), kit.mat("#E6E0D4", 0.9))
    kit.box((-RW - 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    kit.box((RW + 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    kit.box((0, -0.05, RH / 2), (2 * RW, 0.1, RH), wall)
    # window wall with a wide window over the table
    wx0, wx1, wz0, wz1 = -1.1, 0.9, 0.95, 2.15
    kit.box((0, RD + 0.05, wz0 / 2), (2 * RW, 0.1, wz0), wall)
    kit.box((0, RD + 0.05, (RH + wz1) / 2), (2 * RW, 0.1, RH - wz1), wall)
    kit.box(((-RW + wx0) / 2, RD + 0.05, RH / 2), (wx0 + RW, 0.1, RH), wall)
    kit.box(((RW + wx1) / 2, RD + 0.05, RH / 2), (RW - wx1, 0.1, RH), wall)
    frame = kit.mat("#EDE8DE", 0.5)
    for x in (wx0, (wx0 + wx1) / 2, wx1):
        kit.box((x, RD + 0.03, (wz0 + wz1) / 2), (0.05, 0.08, wz1 - wz0), frame)
    for z in (wz0, wz1):
        kit.box(((wx0 + wx1) / 2, RD + 0.03, z), (wx1 - wx0, 0.08, 0.05), frame)
    kit.box(((wx0 + wx1) / 2, RD - 0.05, wz0 - 0.02), (wx1 - wx0 + 0.2, 0.18, 0.03), frame)   # sill
    kit.box(((wx0 + wx1) / 2, RD + 0.02, (wz0 + wz1) / 2), (wx1 - wx0, 0.01, wz1 - wz0), kit.glass(0.02))
    # counters along the left wall, upper cabinets, a sink, the fridge in the back-left corner
    door = kit.mat("#7E9A8C", 0.45)
    top = kit.tex("marble_01", 0.8, name="worktop")
    kit.box((-RW + 0.32, 1.9, 0.44), (0.62, 2.4, 0.88), door, bevel=0.01)
    kit.box((-RW + 0.33, 1.9, 0.9), (0.66, 2.44, 0.04), top, bevel=0.005)
    for y in (1.0, 1.6, 2.2, 2.8):
        kit.box((-RW + 0.64, y, 0.47), (0.01, 0.56, 0.78), kit.mat("#6E8A7C", 0.5))
        kit.box((-RW + 0.66, y + 0.2, 0.72), (0.02, 0.12, 0.02), kit.mat("#C9C4B8", 0.3, 0.8))
    kit.box((-RW + 0.18, 1.9, 1.85), (0.34, 2.4, 0.7), door, bevel=0.01)
    kit.box((-RW + 0.35, 1.7, 0.86), (0.4, 0.5, 0.08), kit.mat("#B9BDC0", 0.2, 1.0))   # sink
    kit.cyl((-RW + 0.2, 1.7, 1.02), 0.012, 0.25, kit.mat("#B9BDC0", 0.2, 1.0))
    kit.place("vintage_electric_kettle", (-RW + 0.35, 2.6, 0.92), rot_z=math.radians(80))
    kit.place("ceramic_vase_01", (-RW + 0.3, 3.0, 0.92))
    # the fridge, dark, its door ajar
    fr = kit.mat("#D9DAD5", 0.3)
    kit.box((-RW + 0.35, 0.45, 0.9), (0.66, 0.66, 1.8), fr, bevel=0.02)
    fdoor = kit.box((-RW + 0.72, 0.62, 0.9), (0.05, 0.62, 1.76), fr, bevel=0.015, rot=(0, 0, math.radians(-28)))
    kit.box((-RW + 0.35, 0.45, 0.9), (0.6, 0.6, 1.7), kit.mat("#2A2C2E", 0.6))   # the dark inside
    # a ceiling lamp that stays off
    kit.cyl((0, 2.2, RH - 0.25), 0.2, 0.18, kit.mat("#8C877D", 0.8), r2=0.06)
    kit.cyl((0, 2.2, RH - 0.08), 0.005, 0.18, kit.mat("#222", 0.5))
    # outside: a dark street under a cold moon, no streetlights, a few houses
    kit.box((0, RD + 8, -0.02), (40, 16, 0.05), kit.mat("#20252B", 0.8))
    rng = random.Random(2)
    for i in range(9):
        x = -14 + i * 3.6 + rng.uniform(-0.5, 0.5)
        h = rng.uniform(4.5, 7)
        kit.box((x, RD + 9 + rng.uniform(0, 2), h / 2), (3.0, 4, h), kit.mat("#3A4048", 0.8))
        kit.box((x, RD + 9 + 0.1 + rng.uniform(0, 0), h + 0.6), (3.2, 4.2, 1.2), kit.mat("#2B3036", 0.8), rot=(0, 0, 0))
    kit.world("#1B2433", 0.35)
    kit.sun((58, 0, 200), 0.25, kit.kelvin(9000), angle=0.5)   # moonlight through the window


def table():
    wood = kit.tex("brown_planks_05", 1.2, tint="#B08A64", name="tabletop")
    kit.box((-0.1, 3.3, 0.74), (1.5, 0.9, 0.04), wood, bevel=0.005)
    for x in (-0.8, 0.6):
        for y in (2.9, 3.7):
            kit.box((x, y, 0.36), (0.05, 0.05, 0.72), kit.mat("#6B4B33", 0.6))
    kit.place("WoodenChair_01", (-0.5, 3.95, 0), rot_z=math.radians(0))


def laptop(at, plate, crop, yaw=0.0, open_deg=105, strength=1.2):
    """A laptop on the table at `at` (x, y, table height), facing -y turned by yaw degrees."""
    x, y, z = at
    body = kit.mat("#8E9398", 0.3, 0.7)
    base = kit.box((x, y, z + 0.009), (0.33, 0.23, 0.018), body, bevel=0.004, rot=(0, 0, math.radians(yaw)))
    kit.box((x, y - 0.02, z + 0.0185), (0.28, 0.1, 0.001), kit.mat("#1B1C1E", 0.6), rot=(0, 0, math.radians(yaw)))   # keys
    tilt = math.radians(open_deg - 90)
    w = 0.3
    h = w * crop[3] / crop[2]
    # hinge at the back edge; the lid leans back by tilt
    hy = y + 0.115
    cz = z + 0.018 + (h / 2 + 0.01) * math.cos(tilt)
    cy = hy + (h / 2 + 0.01) * math.sin(tilt)
    face, frame = kit.screen("laptop", (x, cy, cz), w, plate, crop=crop, rot=(math.radians(90) - tilt, 0, math.radians(yaw)),
                             strength=strength, bezel="#8E9398", depth=0.008, border=0.012)
    return face


def candle(at, h=0.14, lit=True):
    x, y, z = at
    kit.cyl((x, y, z + h / 2), 0.022, h, kit.mat("#F2EBDD", 0.7))
    kit.cyl((x, y, z + 0.005), 0.05, 0.01, kit.mat("#A9A39A", 0.3, 0.8))
    if lit:
        kit.sphere((x, y, z + h + 0.018), 0.008, kit.emission("#FFB45A", 30), scale=(1, 1, 2.2))
        kit.point((x, y, z + h + 0.03), 3.5, kit.kelvin(1800), radius=0.01)


def shot_mis_laptop():
    room()
    table()
    face = laptop((0.05, 3.25, 0.76), "mis-laptop", (100, 60, 1080, 675), yaw=-8, strength=0.9)
    # the screen lights the table and whoever sits at it
    kit.area((0.05, 3.1, 1.0), (0.05, 2.5, 0.9), (0.3, 0.2), 6, kit.kelvin(7500))
    candle((-0.3, 3.5, 0.76))
    candle((-0.4, 3.32, 0.76), h=0.09)
    candle((-0.22, 3.62, 0.76), h=0.18)
    kit.place("vintage_flashlight", (0.55, 3.45, 0.76), rot_z=math.radians(30))
    phone = kit.box((0.45, 3.0, 0.765), (0.075, 0.155, 0.009), kit.mat("#111", 0.3))
    kit.plane((0.45, 3.0, 0.7702), (0.066, 0.14), kit.emission("#DCE6F5", 0.6))
    mug = kit.cyl((-0.62, 3.05, 0.81), 0.042, 0.1, kit.mat("#C9553B", 0.4))
    # Mina, from behind, hunched toward the screen
    # Mina has gone to find a torch: her chair pushed back, her cardigan over it
    kit.place("WoodenChair_01", (0.55, 2.55, 0), rot_z=math.radians(-160))
    kit.box((0.55, 2.38, 0.88), (0.42, 0.06, 0.34), kit.mat("#6A5D7B", 0.9), bevel=0.03, rot=(0.15, 0, math.radians(20)))
    kit.haze((0, RD / 2, RH / 2), (2 * RW - 0.05, RD - 0.05, RH - 0.05), 0.02)
    kit.camera((-1.25, 2.35, 1.18), (0.1, 3.3, 0.86), lens=32, fstop=2.8, focus=face)


kit.run({"mis-laptop": shot_mis_laptop})
