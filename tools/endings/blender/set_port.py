"""The port: a container quay at the water's edge, a dispatch board on posts, reefer containers stacked by the
berth, a gantry crane, and ships out at anchor. Shots:

  mis-port-board   Catastrophic misalignment, Day 4, dawn: the board says every vessel DELIVERED, but the berths are
                   empty, the ships still wait offshore, and the reefer boxes of medicine show their warning lights.
  al-port          Aligned, dawn: a ship at the berth is being unloaded under the crane, and a dock worker in hi-vis
                   stands at the board with a clipboard, signing off the change it shows.
  cw-port          Pyrrhic, Month 2: close on the dispatch office's screen answering "Summary available on request.",
                   the quay grey through the window behind (framed like cw-triage and cw-chat).
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

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


def crane(x, y, boom_up=True, load=None):
    """A gantry crane; with the boom down, load=(y, z) hangs a container from it on cables."""
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
        if load:
            ly, lz = load
            kit.box((x, ly, 39), (3, 4, 1.2), kit.mat("#DDD9D0", 0.5))   # the trolley
            for dx in (-1.2, 1.2):
                kit.cyl((x + dx, ly, (lz + 2.8 + 38.4) / 2), 0.04, 38.4 - lz - 2.8, kit.mat("#222", 0.4, 0.6), verts=8)
            kit.box((x, ly, lz + 2.75), (2.5, 6.2, 0.3), kit.mat("#E9C46A", 0.5, 0.4))   # the spreader
            container((x, ly, lz), rot_z=math.radians(90), colour="#2F5F8A")


def quay():
    kit.box((0, EDGE / 2 - 10, -0.5), (400, EDGE + 20, 1.0), kit.tex("brushed_concrete", 0.15, rough=0.5, name="quay"))
    kit.box((0, EDGE - 0.25, 0.02), (400, 0.3, 0.04), kit.mat("#E9C46A", 0.6))
    for bx in range(-60, 61, 12):
        kit.cyl((bx, EDGE - 0.8, 0.35), 0.28, 0.7, kit.mat("#1E1F21", 0.5, 0.4), r2=0.22)
    # rail tracks for the crane
    for y in (EDGE - 4, EDGE - 20):
        kit.box((0, y, 0.03), (400, 0.12, 0.06), kit.mat("#6B6E73", 0.3, 0.9))


def board(plate, crop, x, y, width=5.2, z=3.4, yaw=0.0):
    """The dispatch board on two posts, facing -y turned by yaw degrees."""
    posts = kit.mat("#3A3D40", 0.5, 0.6)
    h = width * crop[3] / crop[2]
    a = math.radians(yaw)
    c, s = math.cos(a), math.sin(a)
    for dx in (-width / 2 + 0.3, width / 2 - 0.3):
        kit.box((x + dx * c - 0.3 * s, y + dx * s + 0.3 * c, (z - h / 2) / 2 + 0.2), (0.22, 0.22, z - h / 2 + 0.4), posts,
                rot=(0, 0, a))
    face, _ = kit.screen("board", (x, y, z), width, plate, crop=crop, rot=(math.radians(90), 0, a), strength=2.2, depth=0.3,
                         border=0.12, bezel="#15171A")
    kit.box((x - 0.1 * s, y + 0.1 * c, z + h / 2 + 0.3), (width + 0.3, 0.6, 0.12), posts, rot=(0, 0, a))   # a hood
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


def hi_vis(at, facing):
    """A dock worker in an orange hi-vis jacket and a white hard hat, holding a clipboard."""
    P.person(at, facing=facing, height=1.78, coat="#E8702A", trousers="#2B2F36", hold="paper", seed=51)
    kit.sphere((at[0], at[1], 1.72), 0.125, kit.mat("#F2F0EA", 0.35), scale=(1, 1.1, 0.62))
    kit.box((at[0], at[1], 1.2), (0.44, 0.3, 0.05), kit.mat("#D8DE3A", 0.4, emit="#D8DE3A", strength=0.3))   # reflective band


def shot_al_port():
    sea(sky="qwantani_dawn_puresky", strength=0.7, rotation=250)
    quay()
    face = board("al-port", (70, 100, 1140, 410), 2.0, 3.0, width=5.4, z=3.6, yaw=-78)
    # a ship alongside, being worked: boxes on deck, one in the air under the crane, a few landed on the quay
    ship(75, EDGE + 13.5, 170, 0, lights=False, seed=5)
    crane(34, EDGE - 12, boom_up=False, load=(EDGE + 4, 11))
    rng = random.Random(9)
    for i in range(4):
        for tier in range(rng.randint(1, 2)):
            container((18 + i * 2.6, 15.5, tier * 2.62), rot_z=math.radians(-90),
                      colour=rng.choice(["#8A3B2E", "#2F5F8A", "#3F7A5A", "#E8E6E0"]))
    for (x, y, L, hd, sd) in ((600, 450, 240, 70, 1), (950, 800, 280, 110, 2)):
        ship(x, y, L, hd, seed=sd)   # more ships waiting their turn offshore
    # the worker at the board, checking it against the clipboard before signing
    hi_vis((0.45, 2.7), -80)
    kit.sun((85, 0, 66), 2.6, kit.kelvin(3000), angle=2)
    kit.area((-1.5, 2.5, 4.5), (0.5, 2.7, 1.0), (3, 1), 40, kit.kelvin(6500))   # the apron lamp
    kit.camera((-10.0, 2.0, 1.7), (40.0, 22.0, 6.0), lens=26, fstop=5.6, focus=face)
    bpy.context.scene.view_settings.exposure = -0.1


def shot_cw_port():
    sea(sky="kloofendal_overcast_puresky", strength=0.9, rotation=0)
    quay()
    crane(8, EDGE - 12)
    for i in range(5):
        for tier in range(2):
            container((-4 + i * 2.6, 13.0, tier * 2.62), rot_z=math.radians(-90), colour=["#8A3B2E", "#2F5F8A", "#3F7A5A",
                                                                                          "#5A5E66", "#C8864C"][i])
    # the dispatch office: a desk against a window onto the quay
    x0, y0 = 0.0, 4.0
    wall = kit.mat("#D9DDD8", 0.8)
    kit.box((x0, y0 - 1.5, -0.02), (5, 4, 0.04), kit.mat("#4A4F55", 0.8))
    kit.box((x0, y0 - 1.5, 2.8), (5, 4, 0.1), kit.mat("#E6E8E4", 0.9))
    kit.box((x0, y0 + 0.5, 0.45), (5, 0.12, 0.9), wall)
    pane = kit.box((x0, y0 + 0.5, 1.85), (5, 0.02, 1.9), kit.glass(0.03))
    pane.visible_shadow = pane.visible_diffuse = False
    for x in (-1.6, 0.0, 1.6):
        kit.box((x0 + x, y0 + 0.5, 1.85), (0.06, 0.1, 1.9), kit.mat("#3A3D40", 0.4, 0.6))
    kit.box((x0, y0 + 0.1, 0.74), (2.0, 0.7, 0.04), kit.mat("#B9A88E", 0.45))
    kit.cyl((x0, y0 + 0.2, 0.84), 0.02, 0.2, kit.mat("#2A2B2D", 0.4, 0.6))
    face, _ = kit.screen("monitor", (x0, y0 + 0.18, 0.95 + 0.55 * 650 / 1040 / 2), 0.55, "cw-port", crop=(120, 21, 1040, 650),
                         strength=1.2, depth=0.025)
    kit.box((x0 - 0.05, y0 - 0.1, 0.765), (0.42, 0.13, 0.015), kit.mat("#1D1E20", 0.5), bevel=0.003)
    kit.area((x0, y0 - 1.5, 2.7), (x0, y0 - 1.5, 0), (1.2, 0.3), 80, kit.kelvin(5000))
    trio_camera(face)


def trio_camera(face):
    """The pyrrhic trio's framing (cw-port, cw-triage, cw-chat): the screen, 1150 px wide, seen 22 degrees off its
    axis from a little above, with the room soft behind it."""
    bpy.context.view_layer.update()
    mw = face.matrix_world
    n = (mw.to_3x3() @ Vector((0, 0, 1))).normalized()
    width = face.dimensions.x
    lens = 50
    dist = width / (0.6 * 36 / lens)
    side = Vector((n.y, -n.x, 0)).normalized()
    a = math.radians(22)
    eye = mw.translation + (n * math.cos(a) + side * math.sin(a)) * dist + Vector((0, 0, dist * 0.12))
    kit.camera(tuple(eye), tuple(mw.translation - side * width * 0.08), lens=lens, fstop=2.8, focus=face)


kit.run({"mis-port-board": shot_mis_port_board, "al-port": shot_al_port, "cw-port": shot_cw_port})
