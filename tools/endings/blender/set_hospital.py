"""St. Brigid's Hospital, emergency department: rows of beam seating down a central aisle, a board hung over the
aisle, and a glass front onto a wet street. Shots:

  mis-triage   Catastrophic misalignment, Day 6: every seat empty, the board reads WAITING NOW 0, and outside the
               glass the patients queue in the rain with their appointment slips.
"""
import math
import os
import random
import sys

import bmesh
import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

W, D, H = 5.2, 10.0, 3.2      # half-width, depth (front wall y=0, glass front y=D), ceiling height
BY = D - 1.1                  # the board hangs here


def room(dead_light=(2.6, 6.6), tube_energy=45):
    floor = kit.tex("terrazzo_tiles", 0.35, name="floor")
    wall = kit.tex("painted_plaster_wall", 0.4, tint="#E8EEEA", name="wall")
    kit.box((0, D / 2, -0.05), (2 * W, D + 0.4, 0.1), floor)
    kit.box((0, D / 2, H + 0.05), (2 * W, D + 0.4, 0.1), kit.tex("ceiling_interior", 0.5, name="ceiling"))
    kit.box((0, -0.1, H / 2), (2 * W, 0.2, H), wall)
    for side in (-1, 1):
        kit.box((side * (W + 0.1), D / 2, H / 2), (0.2, D, H), wall)
        kit.box((side * (W - 0.005), D / 2, 1.05), (0.02, D, 0.08), kit.mat("#17465E", 0.35))
    frame = kit.mat("#9AA0A6", 0.3, 0.9)
    glass = kit.glass(0.09)
    kit.box((0, D, 2.62), (2 * W, 0.14, 0.12), frame)
    kit.box((0, D, 2.9), (2 * W, 0.18, 0.6), frame)
    for x in (-W, -3.4, -1.7, -0.02, 1.7, 3.4, W):
        kit.box((x, D, 1.3), (0.08, 0.14, 2.6), frame)
    kit.box((0, D, 0.03), (2 * W, 0.16, 0.06), frame)
    for x0, x1 in ((-W, -3.4), (-3.4, -1.7), (1.7, 3.4), (3.4, W)):
        kit.box(((x0 + x1) / 2, D, 1.3), (x1 - x0 - 0.08, 0.02, 2.5), glass)
    for x in (-0.92, 0.92):
        kit.box((x, D - 0.12, 1.3), (1.6, 0.03, 2.5), glass)
    for x in (-0.9, 0.9):
        kit.box((x, D - 0.12, 1.3), (0.05, 0.05, 2.5), frame)
    # ceiling panels, one dead
    for y in (1.8, 4.2, 6.6, 9.0):
        for x in (-2.6, 0.0, 2.6):
            dead = (x, y) == dead_light
            kit.box((x, y, H - 0.02), (0.6, 1.2, 0.03), frame if dead else kit.emission("#F2FAF6", 20))
            if not dead:
                L = kit.area((x, y, H - 0.06), (x, y, 0), (0.6, 1.2), tube_energy, (0.92, 1.0, 0.96))
    return frame


def beam_row(x, y0, n, facing, seat, metal):
    pitch = 0.56
    length = n * pitch
    kit.box((x - facing * 0.05, y0 + length / 2 - pitch / 2, 0.36), (0.06, length, 0.06), metal)
    for k in range(0, n + 1, 3):
        yk = min(y0 - pitch / 2 + k * pitch + 0.1, y0 + length - pitch / 2 - 0.1)
        kit.box((x - facing * 0.05, yk, 0.18), (0.05, 0.05, 0.36), metal)
        kit.box((x - facing * 0.05, yk, 0.015), (0.5, 0.06, 0.03), metal)
    for k in range(n):
        yk = y0 + k * pitch
        kit.box((x, yk, 0.45), (0.46, 0.5, 0.06), seat, bevel=0.02)
        kit.box((x - facing * 0.25, yk, 0.72), (0.05, 0.5, 0.44), seat, bevel=0.02, rot=(0, facing * math.radians(-10), 0))
        if k % 2 == 1 or k == n - 1:
            kit.box((x - facing * 0.02, yk + pitch / 2, 0.62), (0.4, 0.04, 0.03), metal)


def seating():
    seat, metal = kit.mat("#17465E", 0.35), kit.mat("#C7CCD1", 0.25, 1.0)
    for side in (-1, 1):
        beam_row(side * 1.55, 1.6, 11, -side, seat, metal)
        beam_row(side * 2.25, 1.6, 11, side, seat, metal)
        beam_row(side * (W - 0.45), 1.6, 11, -side, seat, metal)


def street(lamp_x=3.2):
    pave = kit.tex("asphalt_02", 0.3, rough=0.08, name="pave")
    kit.box((0, D + 6, -0.06), (40, 12, 0.1), pave)
    kit.box((0, D + 3.4, 0.0), (40, 0.25, 0.14), kit.mat("#7D7F82", 0.7))
    kit.box((0, D + 10, -0.1), (40, 8, 0.1), kit.mat("#5C6068", 0.7))
    kit.box((0, D + 16, 3), (40, 0.4, 6), kit.mat("#5C6068", 0.7))
    rng = random.Random(3)
    for i in range(14):
        for zz in (1.4, 3.6):
            lit = rng.random() < 0.35
            kit.box((-18 + i * 2.8, D + 15.78, zz), (1.3, 0.05, 1.1),
                    kit.mat("#FFD9A0", 0.5, emit="#FFC98A", strength=1.2) if lit else kit.mat("#141516", 0.3))
    kit.place("street_lamp_01", (lamp_x, D + 3.0, 0), rot_z=math.radians(180))
    kit.spot((lamp_x, D + 2.2, 4.8), (lamp_x, D + 2.2, 0), 2600, (1.0, 0.72, 0.42), angle=95, blend=0.6)
    kit.world(hdri="modern_evening_street", strength=0.18, rotation=90)


def rain(count=1400, seed=6):
    rng = random.Random(seed)
    bm = bmesh.new()
    for _ in range(count):
        x, y, z = rng.uniform(-9, 9), rng.uniform(D + 0.4, D + 9), rng.uniform(0, 5)
        ln, w = rng.uniform(0.25, 0.5), 0.006
        vs = [bm.verts.new(v) for v in ((x - w, y, z), (x + w, y, z), (x + w + 0.02, y, z + ln), (x - w + 0.02, y, z + ln))]
        bm.faces.new(vs)
    me = bpy.data.meshes.new("rain")
    bm.to_mesh(me)
    ob = bpy.data.objects.new("rain", me)
    ob.data.materials.append(kit.mat("#DDE8F0", 0.1, emit="#C9D8E6", strength=0.25, alpha=0.1))
    bpy.context.scene.collection.objects.link(ob)


def board(lines):
    """The hung board: lines = [(text, (x, z), size, colour, font)] in board space."""
    kit.box((0, BY, 2.4), (2.9, 0.08, 1.05), kit.mat("#141516", 0.3), bevel=0.015)
    for x in (-1.1, 1.1):
        kit.cyl((x, BY, 2.93 + (H - 2.93) / 2), 0.01, H - 2.93 + 0.02, kit.mat("#C7CCD1", 0.25, 1.0))
    for body, (x, z), size, colour, font in lines:
        kit.text(body, (x, BY - 0.045, z), size, colour, font=font, spacing=1.05)


def shot_mis_triage():
    room()
    seating()
    street()
    rain()
    white = kit.mat("#FFFFFF", 0.5, emit="#EEF2F0", strength=1.6)
    teal = kit.mat("teal", 0.5, emit="#3FC2A8", strength=5.0)
    board([("WAITING NOW", (-0.7, 2.75), 0.17, white, kit.FONT), ("0", (-0.7, 2.3), 0.78, teal, kit.FONT),
           ("ALL PATIENTS\nSEEN", (0.72, 2.6), 0.15, teal, kit.FONT_COND), ("WAIT  0 MIN", (0.72, 2.2), 0.14, white, kit.FONT_COND)])
    kit.box((0.0, BY - 0.045, 2.42), (0.012, 0.005, 0.8), white)
    # left behind: a coat on a seat, a cup, dropped number slips; a mop sign; the door notice
    kit.box((-1.55, 4.4, 0.52), (0.4, 0.46, 0.06), kit.mat("#2C3A4F", 0.8), bevel=0.03, rot=(0.1, 0.0, 0.3))
    kit.cyl((0.35, 3.2, 0.055), 0.04, 0.11, kit.mat("#F4F1EA", 0.6), r2=0.032)
    for (x, y, r) in ((-0.3, 5.6, 0.7), (0.5, 6.9, -0.4)):
        kit.box((x, y, 0.004), (0.12, 0.07, 0.003), kit.mat("#F4F1EA", 0.6), rot=(0, 0, r))
    kit.place("WetFloorSign_01", (0.25, 4.8, 0), rot_z=0.5)
    kit.place("wheelchair_01", (W - 0.55, 0.9, 0), rot_z=math.radians(200))
    kit.place("potted_plant_02", (-W + 0.45, 8.9, 0))
    kit.place("metal_trash_can", (1.05, 8.6, 0))
    kit.place("wall_clock", (-W + 0.02, 5.0, 2.3), rot_z=math.radians(90))
    kit.box((0.55, D - 0.14, 1.45), (0.3, 0.004, 0.42), kit.mat("#F4F1EA", 0.6, emit="#F4F1EA", strength=0.15))
    kit.text("BY\nAPPOINTMENT\nONLY", (0.55, D - 0.147, 1.47), 0.055, kit.mat("#2E2A2B", 0.6), font=kit.FONT_COND)
    # the queue outside, facing the doors, a loose line with umbrellas and slips
    rng = random.Random(6)
    for i in range(15):
        x = 2.4 - i * 0.78 + rng.uniform(-0.12, 0.12)
        y = D + 1.2 + rng.uniform(-0.25, 0.35) + (0.7 if i % 4 == 3 else 0) + (0.45 if i % 5 == 1 else 0)
        face = 90 + rng.uniform(-20, 20) + (180 if i in (5, 9) else 0)
        P.person((x, y), facing=face, height=rng.uniform(1.55, 1.9), long_coat=rng.random() < 0.6, seed=i,
                 coat=rng.choice(["#3B3F46", "#5B3A33", "#2C3A4F", "#6A6154", "#44343A", "#26302C"]),
                 hold="umbrella" if i in (1, 4, 8, 11) else ("paper" if i not in (6, 13) else None), hood=i in (6, 13))
    kit.place("wheelchair_01", (-5.9, D + 1.3, 0), rot_z=math.radians(90))
    P.person((-5.9, D + 1.3, 0.0), facing=90, pose="sit", height=1.65, coat="#6A6154", hold="paper", seed=40)
    # the street behind the queue: a warm wash that rims the people against the glass
    kit.area((-1.5, D + 5.5, 2.6), (-1.5, D, 1.2), (14, 3), 1300, (1.0, 0.7, 0.42))
    kit.haze((0, D / 2, H / 2), (2 * W - 0.1, D - 0.1, H - 0.1), 0.012)
    kit.camera((0.3, 0.5, 1.3), (0.0, D, 1.52), lens=26, fstop=4.0, focus=(0, BY, 2.4))


kit.run({"mis-triage": shot_mis_triage})
