"""OpenBrain's launch keynote: a dark auditorium with raked seating, a wide stage, and an LED wall as big as a house
behind one small figure in a spotlight. Shots:

  ov-launch   Overtaken, launch: the leader's principles, not yours, fill the wall; the presenter is a speck under
              them, and a full house watches with its phones up.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

SW, SY, SH = 13.0, 21.0, 1.1     # stage half-width, stage front edge (y), stage height
WALL = 27.0                      # the LED wall's plane


def boxes(name, items, material):
    """Many boxes [(center, size)] as one mesh, for speed."""
    bm = bmesh.new()
    for c, sz in items:
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*sz, 1)))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def auditorium():
    black = kit.mat("#0C0D10", 0.8)
    kit.box((0, 14, -0.05), (40, 34, 0.1), kit.mat("#15161A", 0.9))
    kit.box((0, 14, 13), (40, 34, 0.1), black)
    kit.box((0, WALL + 1.5, 6.5), (40, 0.2, 13), black)
    for side in (-1, 1):
        kit.box((side * 19, 14, 6.5), (0.2, 34, 13), kit.mat("#141417", 0.85))
    # the stage: a black deck with a thin light line along its lip
    kit.box((0, (SY + WALL + 1.4) / 2, SH / 2), (2 * SW, WALL + 1.4 - SY, SH), kit.mat("#101114", 0.35))
    kit.box((0, SY - 0.01, SH - 0.03), (2 * SW, 0.02, 0.03), kit.emission("#E9E2CF", 6))
    # a lighting truss over the stage
    kit.box((0, SY + 1.0, 10.5), (2 * SW + 2, 0.4, 0.4), kit.mat("#2A2B2E", 0.4, 0.8))
    kit.world("#030304", 1.0)


def seating(rows=15, per_row=26, seed=4):
    """Raked rows facing the stage; almost every seat taken. Returns the rows' z by y for the camera."""
    rng = random.Random(seed)
    seats, steps, pts, phones = [], [], [], []
    for r in range(rows):
        y = SY - 3.2 - r * 1.05
        z = r * 0.18
        steps.append(((0, y - 0.2, z / 2 - 0.02), (36, 1.05, z + 0.04)))
        for k in range(per_row):
            x = -13.1 + k * 1.02 + (1.4 if k >= per_row // 2 else 0) - 0.7
            seats += [((x, y, z + 0.44), (0.52, 0.5, 0.08)), ((x, y - 0.27, z + 0.8), (0.52, 0.07, 0.62))]
            if rng.random() < 0.93:
                pts.append((x + rng.uniform(-0.04, 0.04), y + 0.03, z + 0.48, rng.uniform(-6, 6), "sit"))
                if rng.random() < 0.12:   # a phone held up to film the wall
                    phones.append(((x + 0.12, y + 0.35, z + 1.55), (0.07, 0.004, 0.13)))
    boxes("steps", steps, kit.mat("#141518", 0.9))
    boxes("seats", seats, kit.mat("#1D1E24", 0.7))
    P.silhouettes(pts, seed=seed, coats=("#16171B", "#1C1B1D", "#141619", "#201D1E"), name="audience")
    boxes("phones", phones, kit.emission("#CFE0FF", 3.0))


def shot_ov_launch():
    auditorium()
    # the LED wall, and a thin black frame round it
    face, _ = kit.screen("wall", (0, WALL, SH + 0.5 + 3.05), 14.2, "ov-launch", crop=(150, 96, 980, 420), strength=1.15,
                         depth=0.3, border=0.12, bezel="#0A0A0C")
    seating()
    # the presenter, small, stage left of centre, in a hard spot
    P.person((-3.2, SY + 2.2, SH), facing=195, height=1.78, coat="#16171B", hair="#2A211C", seed=5)
    kit.spot((-1.0, SY + 1.0, 10.3), (-3.2, SY + 2.2, SH + 1.0), 3500, kit.kelvin(5200), angle=9, blend=0.3)
    for x in (-9, -3, 3, 9):   # beams from the truss down onto the deck
        kit.spot((x, SY + 1.0, 10.3), (x * 0.6, SY + 4.0, SH), 900, kit.kelvin(4200), angle=14, blend=0.5)
    kit.area((0, WALL - 1.5, 5), (0, SY - 10, 1.5), (14, 6), 900, kit.kelvin(5600))   # the wall's light on the house
    kit.haze((0, SY + 3.5, 6), (2 * SW, 7, 10), 0.012, color="#FFFFFF", anisotropy=0.5)
    kit.camera((-0.1, SY - 15.8, 3.3), (0, WALL, 3.9), lens=30, fstop=5.6, focus=face)      # from the aisle, seated


kit.run({"ov-launch": shot_ov_launch})
