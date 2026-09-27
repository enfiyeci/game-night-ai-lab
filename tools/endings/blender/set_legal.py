"""Your lab's legal office, late: one desk under a lamp, the city through the window. Shots:

  mu-mirrors   Catastrophic misuse, Day 30: the takedown tracker counts the known copies of your model's weights;
               towers of printed takedown notices, most stamped with no reply, cover the desk and the floor.
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


def room():
    wall = kit.mat("#3B3A38", 0.85)
    kit.box((0, 2, -0.05), (6, 6, 0.1), kit.mat("#2A2B2E", 0.8))                 # carpet tiles
    # walls and ceiling overlap at the edges, so no light leaks through the seams; the back wall has a window
    wx0, wx1, wz0, wz1 = 0.4, 2.8, 0.9, 2.5
    for cx, cz, sx, sz in (((-3.2 + wx0) / 2, 1.55, wx0 + 3.2, 3.1), ((3.2 + wx1) / 2, 1.55, 3.2 - wx1, 3.1),
                           ((wx0 + wx1) / 2, wz0 / 2, wx1 - wx0, wz0), ((wx0 + wx1) / 2, (3.1 + wz1) / 2, wx1 - wx0, 3.1 - wz1)):
        kit.box((cx, 4.05, cz), (sx, 0.1, sz), wall)
    kit.box((-3.05, 2, 1.55), (0.1, 6.4, 3.1), wall)
    kit.box((3.05, 2, 1.55), (0.1, 6.4, 3.1), wall)
    kit.box((0, 2, 3.05), (6.4, 6.4, 0.12), kit.mat("#2A2A2A", 0.9))
    kit.box(((wx0 + wx1) / 2, 4.05, (wz0 + wz1) / 2), (wx1 - wx0, 0.01, wz1 - wz0), kit.glass(0.02))
    for x in (wx0, (wx0 + wx1) / 2, wx1):
        kit.box((x, 4.0, (wz0 + wz1) / 2), (0.05, 0.08, wz1 - wz0), kit.mat("#1C1C1D", 0.5))
    r = random.Random(7)
    bm = bmesh.new()
    lit = bmesh.new()
    for i in range(60):
        x, y = r.uniform(-10, 50), r.uniform(14, 80)
        h = r.uniform(10, 60)
        bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((x, y, h / 2 - 8)) @ Matrix.Diagonal((r.uniform(5, 10), r.uniform(5, 10), h, 1)))
        for _ in range(r.randint(3, 14)):
            bmesh.ops.create_cube(lit, size=1, matrix=Matrix.Translation((x + r.uniform(-3, 3), y - 5.2, r.uniform(-6, h - 9))) @ Matrix.Diagonal((1.6, 0.1, 1.1, 1)))
    for name, b, m in (("towers", bm, kit.mat("#101217", 0.6)), ("windows", lit, kit.emission("#FFC98A", 6.0))):
        me = bpy.data.meshes.new(name)
        b.to_mesh(me)
        b.free()
        ob = bpy.data.objects.new(name, me)
        ob.data.materials.append(m)
        bpy.context.scene.collection.objects.link(ob)
    kit.world("#1A2338", 1.0)      # the city's glow on a night sky


def notices(center, spread, n, seed, height_max=0.35, z0=0.0):
    """Stacks of paper: n stacks around center, each a column of slightly skewed sheets."""
    r = random.Random(seed)
    bm = bmesh.new()
    stamps = bmesh.new()
    for _ in range(n):
        x, y = center[0] + r.uniform(-spread[0], spread[0]), center[1] + r.uniform(-spread[1], spread[1])
        h = r.uniform(0.04, height_max)
        z = z0
        while z < z0 + h:
            t = r.uniform(0.015, 0.04)
            rot = r.uniform(-0.05, 0.05)
            m = Matrix.Translation((x + r.uniform(-0.01, 0.01), y + r.uniform(-0.01, 0.01), z + t / 2)) @ Matrix.Rotation(rot, 4, "Z")
            bmesh.ops.create_cube(bm, size=1, matrix=m @ Matrix.Diagonal((0.21, 0.297, t, 1)))
            z += t
        # the top sheet's red NO REPLY stamp
        m = Matrix.Translation((x + 0.04, y + 0.06, z + 0.0006)) @ Matrix.Rotation(r.uniform(-0.4, 0.4), 4, "Z")
        bmesh.ops.create_cube(stamps, size=1, matrix=m @ Matrix.Diagonal((0.09, 0.03, 0.0008, 1)))
    for name, b, mat in (("paper", bm, kit.mat("#EDE9DF", 0.8)), ("stamps", stamps, kit.mat("#B8332A", 0.7))):
        me = bpy.data.meshes.new(name)
        b.to_mesh(me)
        b.free()
        ob = bpy.data.objects.new(name, me)
        ob.data.materials.append(mat)
        bpy.context.scene.collection.objects.link(ob)


def shot_mu_mirrors():
    room()
    wood = kit.mat("#5A4332", 0.4, coat=0.3)
    kit.box((0, 2.2, 0.74), (1.8, 0.85, 0.04), wood, bevel=0.005)
    for dx in (-0.85, 0.85):
        kit.box((dx, 2.2, 0.37), (0.05, 0.75, 0.74), kit.mat("#222326", 0.4, 0.6))
    crop = (60, 80, 1160, 620)
    w = 0.66
    h = w * crop[3] / crop[2]
    face, _ = kit.screen("monitor", (0.05, 2.45, 0.92 + h / 2), w, "mu-mirrors", crop=crop, strength=1.2, depth=0.025)
    kit.cyl((0.05, 2.49, 0.85), 0.02, 0.18, kit.mat("#2A2B2D", 0.4, 0.6))
    kit.box((0.05, 2.5, 0.765), (0.22, 0.16, 0.012), kit.mat("#2A2B2D", 0.4, 0.6))
    notices((-0.6, 2.15), (0.18, 0.2), 6, 1, height_max=0.32, z0=0.76)
    notices((0.62, 2.1), (0.15, 0.2), 4, 2, height_max=0.22, z0=0.76)
    notices((0.9, 1.4), (0.5, 0.3), 7, 3, height_max=0.45)
    kit.cyl((0.45, 1.98, 0.8), 0.04, 0.1, kit.mat("#EFEAE0", 0.5))                 # a cold coffee
    kit.place("desk_lamp_arm_01", (-0.75, 2.45, 0.76), rot_z=math.radians(150))
    kit.spot((-0.55, 2.3, 1.2), (-0.3, 2.1, 0.76), 20, kit.kelvin(2800), angle=75, blend=0.7)
    kit.area((0.05, 2.25, 1.15), (0.05, 1.2, 0.8), (0.6, 0.35), 5, kit.kelvin(6500))   # the monitor's glow
    kit.area((1.2, 2.8, 2.9), (0.6, 2.0, 0.7), (1.6, 1.0), 12, kit.kelvin(9000))       # cold spill, as from the window
    kit.camera((-0.95, 0.45, 1.3), (0.45, 2.6, 1.08), lens=32, fstop=4.0, focus=face)


kit.run({"mu-mirrors": shot_mu_mirrors})
