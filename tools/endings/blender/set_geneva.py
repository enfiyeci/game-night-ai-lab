"""Geneva: the summit hall. Tall windows down one side, pale wood panelling down the other, a parquet floor, and a
wide screen on the end wall. Each party's flag is a plain field of its colour (the labs' colours follow the game:
Kestrel Labs coral, OpenBrain ink, Lodestar and DeepThink sky). Shots:

  pd-news     A negotiated pace, signing day: from behind, the parties sit at the long signing table under their
              flags, leather folders open; the hall screen shows the accord as signed (terms and signers filled per run).
  lb-summit   Left behind, Year 1: the summit drafts the next era's rules at a round table; every party there has a
              place card and a flag, and at the back of the hall one plastic chair carries a paper sign for yours.
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

GW, GD, GH = 10.0, 20.0, 7.0      # half-width, depth (the screen wall at y=GD), height
COLOURS = {"KESTREL LABS": "coral", "OPENBRAIN": "#3A3536", "LODESTAR": "#3F84C6", "DEEPTHINK": "#2C5F96",
           "UNITED STATES": "#1F3A6E", "CHINA": "#B8322A"}


def hall(sun_strength=1.0, warm=5600):
    """The hall: windows on the left wall (x=-GW) let the sun in; panelling on the right."""
    kit.box((0, GD / 2, -0.05), (2 * GW, GD, 0.1), kit.tex("wood_floor", 0.5, name="parquet"))
    kit.box((0, GD / 2, GH + 0.05), (2 * GW, GD, 0.1), kit.mat("#E9E5DC", 0.9))
    stone = kit.mat("#DCD5C8", 0.8)
    kit.box((0, GD + 0.05, GH / 2), (2 * GW, 0.1, GH), stone)
    kit.box((0, -0.05, GH / 2), (2 * GW, 0.1, GH), stone)
    kit.box((GW + 0.05, GD / 2, GH / 2), (0.1, GD, GH), kit.tex("fine_grained_wood", 0.4, tint="#D9B98E", name="panelling"))
    for y in range(2, int(GD), 3):
        kit.box((GW - 0.04, y, GH / 2), (0.06, 0.08, GH), kit.mat("#8A6A45", 0.5))
    # the window wall: piers between tall windows, bright sky beyond
    frame = kit.mat("#EDEAE3", 0.5)
    kit.box((-GW - 0.05, GD / 2, 0.5), (0.1, GD, 1.0), stone)
    kit.box((-GW - 0.05, GD / 2, GH - 0.5), (0.1, GD, 1.0), stone)
    for k in range(6):
        y = 1.6 + k * 3.4
        kit.box((-GW - 0.05, y, GH / 2), (0.3, 1.2, GH), stone)
        if k < 5:
            pane = kit.box((-GW - 0.1, y + 1.7, GH / 2), (0.02, 2.2, GH - 2.0), kit.emission("#EAF1F7", 6 * sun_strength))
            pane.visible_shadow = False      # the sun comes in through it
            kit.box((-GW + 0.02, y + 1.7, GH / 2), (0.05, 0.05, GH - 2.0), frame)
    # coffered light lines in the ceiling
    for x in (-5, 0, 5):
        kit.box((x, GD / 2, GH - 0.02), (0.25, GD - 2, 0.03), kit.emission("#FFF4E4", 5))
        kit.area((x, GD / 2, GH - 0.06), (x, GD / 2, 0), (0.3, GD - 2), 260, kit.kelvin(warm - 1400))
    kit.world("#8FA2B8", 0.25)


def hall_screen(plate, crop, width=6.0, z=4.6):
    face, _ = kit.screen("hall", (0, GD - 0.2, z), width, plate, crop=crop, strength=1.3, depth=0.12, border=0.06, bezel="#1A1B1D")
    return face


def flag(at, colour, height=2.7):
    """An indoor flag: a pole on a round foot, and a plain field of colour hanging in soft folds from a crossbar."""
    x, y = at
    brass = kit.mat("#B8913F", 0.3, 1.0)
    kit.cyl((x, y, 0.03), 0.2, 0.06, brass)
    kit.cyl((x, y, height / 2), 0.018, height, kit.mat("#C9C6BF", 0.3, 0.8))
    kit.sphere((x, y, height + 0.05), 0.045, brass)
    kit.cyl((x, y - 0.02, height - 0.1), 0.01, 1.0, brass, rot=(0, math.radians(90), 0), verts=8)
    bm = bmesh.new()
    nx, nz, w, h = 16, 8, 0.95, 1.6
    verts = [[bm.verts.new((x - w / 2 + w * i / nx, y - 0.03 + 0.035 * math.sin(i / nx * math.pi * 3.2) * (0.4 + j / nz),
                            height - 0.12 - h * j / nz)) for i in range(nx + 1)] for j in range(nz + 1)]
    for j in range(nz):
        for i in range(nx):
            bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
    me = bpy.data.meshes.new("flag")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("flag", me)
    ob.data.materials.append(kit.mat(colour, 0.8))
    for p in me.polygons:
        p.use_smooth = True
    ob.modifiers.new("solid", "SOLIDIFY").thickness = 0.006
    bpy.context.scene.collection.objects.link(ob)
    return ob


def place_card(body, at, yaw=0.0, width=0.34):
    """A tent card printed on both sides; yaw 0 shows its front to -y."""
    x, y, z = at
    card, ink = kit.mat("#F6F2E8", 0.6), kit.mat("#1C1C1C", 0.6)
    r = math.radians(yaw)
    for side in (1, -1):
        ox, oy = math.sin(r) * 0.018 * side, -math.cos(r) * 0.018 * side
        rot = (math.radians(76), 0, r + (0 if side > 0 else math.pi))
        kit.plane((x + ox, y + oy, z + 0.055), (width, 0.11), card, rot=rot)
        kit.text(body, (x + ox * 1.25, y + oy * 1.25, z + 0.055), 0.036, ink, font=kit.FONT, rot=rot)


def folder(at, yaw=0.0):
    """An open leather signing folder with its page and a pen."""
    x, y, z = at
    r = math.radians(yaw)
    kit.box((x, y, z + 0.006), (0.62, 0.32, 0.012), kit.mat("#3A1F14", 0.4), rot=(0, 0, r), bevel=0.004)
    kit.box((x + 0.15 * math.cos(r), y + 0.15 * math.sin(r), z + 0.013), (0.25, 0.3, 0.002), kit.mat("#F4F0E6", 0.7), rot=(0, 0, r))
    kit.cyl((x + 0.1, y - 0.12, z + 0.02), 0.005, 0.14, kit.mat("#111", 0.3, 0.6), rot=(0, math.radians(90), r + 0.5))


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


def shot_pd_news():
    """pacingDeal 1, signing day: from the press pen, behind the signers at the long table under six flags; the
    hall screen shows the accord as signed."""
    hall(sun_strength=1.2)
    face = hall_screen("pd-news", (248, 96, 840, 296), width=6.4, z=4.7)
    kit.box((0, GD / 2 + 2, 0.005), (11, 9, 0.01), kit.mat("#24345C", 0.95))           # the blue carpet
    ty = 13.2
    kit.box((0, ty, 0.765), (9.4, 1.0, 0.05), kit.mat("#F1EEE6", 0.8))
    kit.box((0, ty, 0.37), (9.42, 1.02, 0.74), kit.mat("#1F2E55", 0.9))
    parties = list(COLOURS)
    for i, name in enumerate(parties):   # the signers sit on the near side, their backs to the press, facing the flags
        x = (i - 2.5) * 1.5
        hair = ["#2A211C", "#141212", "#3A2C22"][i % 3]
        place_card(name, (x, ty + 0.36, 0.79))
        folder((x, ty - 0.2, 0.79))
        kit.place("dining_chair_02", (x, ty - 0.85, 0))
        signer = P.person((x, ty - 0.72, 0.0), facing=0, pose="sit", height=1.76, coat=["#1D2230", "#2B2F36", "#23262C"][i % 3],
                          hair=hair, skin=hair, seed=30 + i)
        P.hair_back(signer, 1.76, "sit", hair)
        flag((x, ty + 1.4), COLOURS[name])
    # the press pen in front: photographers from behind
    rng = random.Random(3)
    P.silhouettes([(x, 5.2 + rng.uniform(-0.3, 0.3), 0.0, rng.uniform(-10, 10), "stand") for x in (-3.9, -2.9, 3.0, 4.0)],
                  seed=5, name="press")
    boxes("rope", [((0, 6.4, 0.9), (9, 0.03, 0.03))], kit.mat("#8A2E22", 0.6))
    for x in (-4.5, 4.5):
        kit.cyl((x, 6.4, 0.5), 0.03, 1.0, kit.mat("#B8913F", 0.3, 1.0))
    kit.sun((62, 0, -70), 2.2, kit.kelvin(5200), angle=1.5)          # low sun through the left windows
    kit.area((0, 8.5, 4.5), (0, ty, 1.0), (6, 1.5), 500, kit.kelvin(4800))     # TV lights on the table
    kit.camera((1.0, 3.2, 1.62), (0, 16.0, 2.7), lens=32, fstop=5.6, focus=face)


def shot_lb_summit():
    """leftBehind 5, Year 1: from the back of the hall, over one empty plastic chair with a paper sign for your lab,
    the round table where the other parties draft the rules under their flags; the hall screen names the summit."""
    hall(sun_strength=0.7, warm=4200)
    face = hall_screen("lb-summit", (168, 100, 944, 290), width=6.8, z=4.8)
    cx, cy, R = 1.2, 12.6, 2.1
    kit.cyl((cx, cy, 0.76), R, 0.05, kit.tex("fine_grained_wood", 0.6, tint="#8A5A36", name="tabletop"), verts=64)
    kit.cyl((cx, cy, 0.37), 0.5, 0.74, kit.mat("#3A2415", 0.4), verts=32)
    parties = ["OPENBRAIN", "DEEPTHINK", "LODESTAR", "UNITED STATES", "CHINA"]
    for i, name in enumerate(parties):
        a = math.radians(180 + (i - 2) * 42)          # seats spread round the far side of the table
        px, py = cx + math.sin(a) * (R + 0.45), cy - math.cos(a) * (R + 0.45)
        face_deg = math.degrees(math.atan2(-(cx - px), cy - py))
        hair = ["#2A211C", "#141212", "#3A2C22"][i % 3]   # skin in the hair's tone: at this distance a head, never a face
        P.person((px, py, 0.0), facing=face_deg, pose="sit", height=1.76, coat=["#1D2230", "#2B2F36", "#23262C"][i % 3],
                 hair=hair, skin=hair, seed=50 + i)
        kx, ky = cx + math.sin(a) * (R - 0.25), cy - math.cos(a) * (R - 0.25)
        place_card(name, (kx, ky, 0.785), yaw=face_deg + 180)
        fx, fy = cx + math.sin(a) * (R + 1.5), cy - math.cos(a) * (R + 1.5)
        flag((fx, fy), COLOURS[name])
    # papers on the table, a draft passed round
    for k in range(5):
        a = math.radians(k * 70 + 20)
        kit.box((cx + math.cos(a) * 1.2, cy + math.sin(a) * 1.2, 0.79), (0.21, 0.29, 0.003), kit.mat("#F4F0E6", 0.7), rot=(0, 0, a))
    # at the back of the hall: a row of spare chairs, and one with your sign on it
    for x in (-7.8, -7.1, -5.7):
        kit.place("plastic_monobloc_chair_01", (x, 4.0, 0), rot_z=math.radians(10))
    kit.place("plastic_monobloc_chair_01", (-6.4, 3.9, 0), rot_z=math.radians(8))
    kit.box((-6.4, 3.68, 0.78), (0.3, 0.004, 0.2), kit.mat("#F4F1EA", 0.7), rot=(math.radians(-12), 0, math.radians(8)))
    kit.text("KESTREL LABS", (-6.4, 3.67, 0.8), 0.04, kit.mat("#1C1C1C", 0.6), font=kit.FONT, rot=(math.radians(78), 0, math.radians(8)))
    kit.text("observer", (-6.4, 3.67, 0.75), 0.022, kit.mat("#555", 0.6), font=kit.FONT_SANS, rot=(math.radians(78), 0, math.radians(8)))
    kit.sun((74, 0, -62), 3.0, kit.kelvin(3400), angle=1.0)          # late sun, low through the windows
    kit.area((cx, cy - 3.5, 4.8), (cx, cy, 0.8), (4, 3), 300, kit.kelvin(4000))
    kit.haze((0, GD / 2, GH / 2), (2 * GW - 0.2, GD - 0.2, GH - 0.2), 0.004, color="#FFF1DE")
    kit.camera((-7.2, 1.2, 1.15), (-0.2, 16.0, 1.85), lens=28, fstop=8.0, focus=(-2.0, 11.0, 1.5))


kit.run({"pd-news": shot_pd_news, "lb-summit": shot_lb_summit})
