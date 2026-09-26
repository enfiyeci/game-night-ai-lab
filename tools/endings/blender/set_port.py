"""The port: a container quay at the water's edge, a dispatch board on posts, reefer containers stacked by the
berth, a gantry crane, and ships out at anchor. Shots:

  mis-port-board   Catastrophic misalignment, Day 4, dawn: the board says every vessel DELIVERED, but the berths are
                   empty, the ships still wait offshore, and the reefer boxes of medicine show their warning lights.
"""
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

EDGE = 22.0     # the quay edge (water beyond, y > EDGE)


def sea(sky="qwantani_sunrise_puresky", strength=0.55, rotation=310):
    kit.world(hdri=sky, strength=strength, rotation=rotation)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(-600, EDGE, -1.2))
    water = bpy.context.object
    oc = water.modifiers.new("ocean", "OCEAN")
    oc.geometry_mode = "GENERATE"
    oc.repeat_x = oc.repeat_y = 24
    oc.size = 1.0
    oc.spatial_size = 60
    oc.resolution = 8
    oc.wave_scale = 0.35
    oc.choppiness = 0.8
    oc.wind_velocity = 7
    m = bpy.data.materials.new("sea")
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = kit.lin("#15242C")
    b.inputs["Roughness"].default_value = 0.06
    b.inputs["Transmission Weight"].default_value = 0.0
    water.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    kit.box((0, EDGE + 3000, -1.3), (12000, 6000, 0.1), m, name="far-sea")   # calm water out to the horizon


def container(loc, rot_z=0.0, colour="#8A3B2E", reefer=False, warn=False):
    x, y, z = loc
    body = kit.box((x, y, z + 1.3), (6.06, 2.44, 2.59), kit.mat(colour, 0.6, 0.3), bevel=0.02, rot=(0, 0, rot_z))
    # corrugation: thin ribs along the long sides
    c, s = math.cos(rot_z), math.sin(rot_z)
    rib = kit.mat(colour, 0.55, 0.3)
    for k in range(-14, 15):
        for side in (-1, 1):
            ox, oy = k * 0.2, side * 1.23
            kit.box((x + ox * c - oy * s, y + ox * s + oy * c, z + 1.3), (0.06, 0.03, 2.45), rib, rot=(0, 0, rot_z))
    if reefer:   # the machinery end, with its status lamp and a readout
        ex, ey = x + 3.04 * c, y + 3.04 * s
        kit.box((ex, ey, z + 1.3), (0.08, 2.3, 2.45), kit.mat("#B7BBBF", 0.45, 0.5), rot=(0, 0, rot_z))
        lamp = "#FF2A1A" if warn else "#35D07F"
        lx, ly = ex + 0.06 * c - 0.7 * s, ey + 0.06 * s + 0.7 * c
        kit.sphere((lx, ly, z + 2.05), 0.06, kit.emission(lamp, 80))
        kit.point((lx + 0.25 * c, ly + 0.25 * s, z + 2.05), 5 if warn else 1.5, kit.lin(lamp)[:3], radius=0.04)
        rx, ry = ex + 0.05 * c + 0.3 * s, ey + 0.05 * s - 0.3 * c
        kit.box((rx, ry, z + 1.6), (0.02, 0.32, 0.14), kit.emission("#FF5A3A" if warn else "#7CFFB0", 3), rot=(0, 0, rot_z))
    return body


def ship(x, y, length, heading=0, lights=True, seed=0):
    """A container ship at anchor: hull, stacked boxes, a bridge at the stern."""
    rng = random.Random(seed)
    root = bpy.data.objects.new("ship", None)
    bpy.context.scene.collection.objects.link(root)
    L, B = length, length * 0.14
    parts = [kit.box((0, 0, 2), (L, B, 8), kit.mat("#232629", 0.6, 0.2), bevel=0.3),
             kit.box((0, 0, -1.5), (L * 0.98, B * 0.98, 1.2), kit.mat("#6E2A24", 0.7)),
             kit.box((-L * 0.4, 0, 12), (L * 0.1, B * 0.9, 12), kit.mat("#DDD9D0", 0.5))]
    cols = ["#8A3B2E", "#2F5F8A", "#C8864C", "#3F7A5A", "#B9B2A6", "#5A5E66", "#A4553A"]
    for bay in range(12):
        bx = -L * 0.3 + bay * L * 0.058
        for tier in range(rng.randint(3, 6)):
            parts.append(kit.box((bx, 0, 6.8 + tier * 2.6), (L * 0.052, B * 0.9, 2.5), kit.mat(rng.choice(cols), 0.7)))
    if lights:
        parts.append(kit.sphere((-L * 0.4, 0, 19), 0.6, kit.emission("#FFE2B0", 40)))
        parts.append(kit.sphere((L * 0.48, 0, 8), 0.5, kit.emission("#FFFFFF", 30)))
    for p in parts:
        p.parent = root
    root.location = (x, y, 0)
    root.rotation_euler = (0, 0, math.radians(heading))
    return root


def crane(x, y, boom_up=True):
    steel = kit.mat("#C8864C", 0.5, 0.4)
    for dx in (-6, 6):
        for dy in (-8, 8):
            kit.box((x + dx, y + dy, 20), (1.0, 1.0, 40), steel)
    kit.box((x, y - 8, 38), (13, 1.2, 1.2), steel)
    kit.box((x, y + 8, 38), (13, 1.2, 1.2), steel)
    kit.box((x, y, 41), (6, 18, 4), kit.mat("#DDD9D0", 0.5))
    if boom_up:
        kit.box((x, y + 22, 58), (2, 36, 2), steel, rot=(math.radians(55), 0, 0))
    else:
        kit.box((x, y + 30, 40), (2, 60, 2), steel)


def quay():
    kit.box((0, EDGE / 2 - 10, -0.5), (400, EDGE + 20, 1.0), kit.tex("brushed_concrete", 0.15, rough=0.5, name="quay"))
    kit.box((0, EDGE - 0.25, 0.02), (400, 0.3, 0.04), kit.mat("#E9C46A", 0.6))
    for bx in range(-60, 61, 12):
        kit.cyl((bx, EDGE - 0.8, 0.35), 0.28, 0.7, kit.mat("#1E1F21", 0.5, 0.4), r2=0.22)
    # rail tracks for the crane
    for y in (EDGE - 4, EDGE - 20):
        kit.box((0, y, 0.03), (400, 0.12, 0.06), kit.mat("#6B6E73", 0.3, 0.9))


def board(plate, crop, x, y, width=5.2, z=3.4):
    posts = kit.mat("#3A3D40", 0.5, 0.6)
    h = width * crop[3] / crop[2]
    for dx in (-width / 2 + 0.3, width / 2 - 0.3):
        kit.box((x + dx, y + 0.3, (z - h / 2) / 2 + 0.2), (0.22, 0.22, z - h / 2 + 0.4), posts)
    face, _ = kit.screen("board", (x, y, z), width, plate, crop=crop, strength=2.2, depth=0.3, border=0.12, bezel="#15171A")
    kit.box((x, y + 0.1, z + h / 2 + 0.3), (width + 0.3, 0.6, 0.12), posts)   # a hood over the board
    return face


def shot_mis_port_board():
    sea()
    quay()
    face = board("mis-port-board", (60, 90, 1160, 500), 1.5, 9.0, width=5.4, z=3.6)
    rng = random.Random(8)
    # reefers of medicine waiting by the empty berth, machinery ends to the camera, most lamps red
    for i in range(6):
        for tier in range(2):
            container((9.0 + i * 2.6, 13.0, tier * 2.62), rot_z=math.radians(-90), colour="#E8E6E0", reefer=True,
                      warn=rng.random() < 0.8)
    for i in range(5):
        for tier in range(rng.randint(1, 3)):
            container((26 + i * 2.6, 9.0, tier * 2.62), rot_z=math.radians(-90), colour=rng.choice(["#8A3B2E", "#2F5F8A", "#3F7A5A", "#5A5E66"]))
    crane(44, EDGE - 12)
    # a pallet of insulin left out on the warm quay
    px, py = -3.2, 3.2
    kit.box((px, py, 0.07), (1.2, 1.0, 0.14), kit.tex("brown_planks_05", 2, tint="#C9A77E", name="pallet"))
    card = kit.mat("#C8A57A", 0.85)
    label = kit.mat("#F4F1EA", 0.7)
    blue = kit.mat("#2F5F8A", 0.6)
    for ix in range(2):
        for iz in range(3):
            if (ix, iz) == (1, 2):
                continue
            bx, bz = px - 0.3 + ix * 0.6, 0.14 + 0.2 + iz * 0.4
            kit.box((bx, py, bz), (0.58, 0.95, 0.39), card, bevel=0.01)
            kit.box((bx, py - 0.476, bz + 0.03), (0.4, 0.004, 0.22), label)
            kit.text("INSULIN", (bx, py - 0.479, bz + 0.1), 0.06, blue, font=kit.FONT)
            kit.text("KEEP AT 2–8 °C", (bx, py - 0.479, bz + 0.02), 0.035, kit.mat("#B03A2A", 0.6), font=kit.FONT_COND)
            kit.text("MEDICAL · FRAGILE", (bx, py - 0.479, bz - 0.04), 0.024, kit.mat("#2E2A2B", 0.7), font=kit.FONT_COND)
    # nothing at the berth; the ships wait at anchor, far out
    for (x, y, L, hd, sd) in ((-250, 1000, 250, 70, 1), (-60, 1300, 290, 110, 2), (90, 950, 240, 40, 3), (-420, 1500, 280, 95, 4)):
        ship(x, y, L, hd, seed=sd)
    kit.sun((86, 0, 180), 3.0, kit.kelvin(2800), angle=2)      # the sun just over the sea, ahead and a little right
    kit.area((-3.2, 4.0, 4.0), (-3.2, 9, 3.6), (3, 1), 30, kit.kelvin(6500))   # a lamp over the board apron
    kit.camera((-8.0, -4.0, 1.7), (3.0, 30.0, 3.0), lens=28, fstop=5.6, focus=face)
    bpy.context.scene.view_settings.exposure = -0.3


kit.run({"mis-port-board": shot_mis_port_board})
