"""The Azuria campus at dusk: a stone plaza before Azuria's glass headquarters, its name lit along the roof, the lobby
bright, staff walking in with their badges. Shots:

  ab-farewell  Absorbed, Week 3: Tomas, Kestrel's head of safety, sits on a bench outside with his desk in a cardboard
               box; on his laptop, his farewell post: his team's evals were not part of the deal. Everyone else goes in.
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

HQ_Y = 60.0          # the headquarters' glass front; the plaza runs from the bench (y=0) to it


def _batch(name, boxes, material):
    """One mesh holding many boxes [(center, size)], for speed."""
    bm = bmesh.new()
    for c, s in boxes:
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*s, 1)))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def plaza():
    kit.world(hdri="qwantani_dusk_2_puresky", strength=0.14, rotation=200)
    kit.box((0, 50, -0.05), (240, 180, 0.1), kit.tex("concrete_pavement", 0.3, rough=0.35, name="plaza"))
    # low planters with clipped hedges along the walk, and bollard lights
    stone = kit.mat("#B9B3A8", 0.7)
    hedge = kit.mat("#2E4630", 0.9)
    planters, hedges, bollards, glows = [], [], [], []
    for y in range(5, 56, 7):
        for x in (-6.5, 6.5):
            planters.append(((x, y, 0.3), (1.2, 3.2, 0.6)))
            hedges.append(((x, y, 0.72), (1.0, 3.0, 0.3)))
        for x in (-4.2, 4.2):
            bollards.append(((x, y + 3, 0.45), (0.14, 0.14, 0.9)))
            glows.append(((x, y + 3, 0.8), (0.15, 0.15, 0.08)))
            kit.point((x, y + 3, 0.8), 8, kit.kelvin(3000), radius=0.05)
    _batch("planters", planters, stone)
    _batch("hedges", hedges, hedge)
    _batch("bollards", bollards, kit.mat("#2B2D30", 0.4, 0.6))
    _batch("bollard-glow", glows, kit.emission("#FFD9A8", 12))


def headquarters(seed=5):
    """A long, low glass block: a bright double-height lobby, AZURIA across the band above it, lit offices on top."""
    rng = random.Random(seed)
    L, Hh = 90, 16
    kit.box((0, HQ_Y + 12, Hh / 2), (L, 24, Hh), kit.mat("#20262D", 0.3, 0.3))
    lit, dim, mull = [], [], []
    for z in (12.0, 14.6):
        for k in range(int(L / 1.6)):
            x = -L / 2 + 0.8 + k * 1.6
            (lit if rng.random() < 0.6 else dim).append(((x, HQ_Y - 0.02, z), (1.5, 0.02, 2.3)))
        mull.append(((0, HQ_Y - 0.08, z - 1.3), (L, 0.12, 0.3)))
    _batch("offices-lit", lit, kit.emission("#F6E7CE", 2.2))
    _batch("offices-dim", dim, kit.emission("#6F8496", 0.35))
    # the lobby: double height, bright, glass from end to end
    kit.box((0, HQ_Y - 0.01, 3.4), (L - 2, 0.02, 6.6), kit.emission("#FFF1DC", 2.2))
    for k in range(int(L / 2.4) + 1):
        mull.append(((-L / 2 + 1 + k * 2.4, HQ_Y - 0.1, 3.4), (0.12, 0.12, 6.6)))
    _batch("mullions", mull, kit.mat("#3A4048", 0.3, 0.8))
    kit.box((0, HQ_Y - 0.3, 8.7), (L, 0.5, 3.6), kit.mat("#2A3038", 0.35, 0.6))   # the band carrying the name
    kit.area((0, HQ_Y - 2.0, 3.5), (0, 0, 0), (60, 6), 9000, kit.kelvin(3600))
    kit.text("AZURIA", (0, HQ_Y - 0.6, 8.7), 2.6, kit.emission("#8FC4F2", 12), font=kit.FONT, spacing=1.3, extrude=0.08)


def staff(seed=8):
    """People crossing the plaza to the lobby, their backs to us."""
    rng = random.Random(seed)
    spots = [(-1.8, 11), (1.2, 16), (2.6, 22), (-0.6, 27), (-3.0, 31), (1.6, 36), (3.4, 41), (-1.4, 46), (0.4, 52), (-2.6, 55)]
    for i, (x, y) in enumerate(spots):
        P.person((x, y), facing=rng.uniform(-12, 12), pose="walk", height=rng.uniform(1.6, 1.88),
                 coat=rng.choice(["#2C3A4F", "#3B3F46", "#6A6154", "#1F2226", "#44343A"]), long_coat=rng.random() < 0.4,
                 hold=rng.choice([None, "phone", "cup"]), seed=80 + i)


def bench():
    kit.box((0.1, 0.0, 0.42), (2.6, 0.55, 0.08), kit.tex("brushed_concrete", 0.6, name="bench"), bevel=0.01)
    for x in (-0.9, 1.1):
        kit.box((x, 0.0, 0.19), (0.35, 0.45, 0.38), kit.mat("#A7A197", 0.7))


def laptop(plate, crop, at, yaw=0.0, tilt=14):
    """A laptop open on the bench, its screen turned to whoever sits at it (to -y at yaw 0)."""
    x, y, z = at
    w = 0.33
    h = w * crop[3] / crop[2]
    rz = math.radians(yaw)
    kit.box((x, y, z + 0.008), (0.35, 0.24, 0.016), kit.mat("#B8BBC0", 0.3, 0.9), bevel=0.004, rot=(0, 0, rz))
    kit.box((x, y - 0.02, z + 0.017), (0.29, 0.12, 0.002), kit.mat("#1D1E20", 0.6), rot=(0, 0, rz))   # the keys
    t = math.radians(tilt)
    hinge_y = 0.12
    cy = hinge_y - (h / 2 + 0.01) * math.sin(-t)
    cz = z + 0.016 + (h / 2 + 0.01) * math.cos(t)
    cx, cyw = x - cy * math.sin(rz), y + cy * math.cos(rz)
    face, _ = kit.screen("laptop", (cx, cyw, cz), w, plate, crop=crop, rot=(math.radians(90) - t, 0, rz), strength=1.0,
                         bezel="#1A1B1D", depth=0.008, border=0.01)
    return face


def desk_box(at):
    """His desk in a taped-up cardboard box, the laptop open on top; a plant, a mug and a framed photo beside it."""
    x, y, z = at
    kraft = kit.mat("#A9824F", 0.85)
    kit.box((x, y, z + 0.2), (0.44, 0.34, 0.4), kraft, bevel=0.004)
    kit.box((x, y, z + 0.4), (0.06, 0.345, 0.004), kit.mat("#C9B48A", 0.4))    # the tape
    kit.place("potted_plant_01", (x + 0.58, y + 0.02, z), scale=0.55)
    kit.cyl((x + 0.78, y - 0.06, z + 0.05), 0.045, 0.1, kit.mat("#E0613B", 0.4))
    kit.box((x + 0.82, y + 0.1, z + 0.08), (0.2, 0.02, 0.16), kit.mat("#2A2A2A", 0.4), rot=(math.radians(-12), 0, 0.1))
    return z + 0.4


def shot_ab_farewell():
    plaza()
    headquarters()
    staff()
    bench()
    top = desk_box((0.3, 0.0, 0.46))
    face = laptop("ab-farewell", (250, 110, 780, 440), (0.3, -0.02, top), yaw=-8)
    # Tomas on the bench beside his box, from behind, turned to the laptop; everyone else walks in
    P.person((-0.4, -0.02, -0.02), facing=-25, pose="sit", height=1.8, coat="#2B2F36", hair="#3A2E25", skin="#6E4630", seed=7)
    kit.camera((0.15, -1.3, 1.05), (0.3, 10, 1.4), lens=35, fstop=4.0, focus=face)
    bpy.context.scene.view_settings.exposure = 0.3


kit.run({"ab-farewell": shot_ab_farewell})
