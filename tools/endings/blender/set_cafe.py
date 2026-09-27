"""Dot's café: a small corner café. A glass shopfront onto the street on the left, a counter across the back with the
till, the espresso machine and a chalkboard menu behind it, and a TV high on the back wall at the window end. Shots:

  ab-news    Absorbed, Day 2, a grey wet morning: breakfast as usual; nobody looks up at the TV, where the takeover of
             your lab is one more business headline.
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

W, D, H = 3.8, 7.0, 3.1       # half-width, depth (front wall y=0, back wall y=D), ceiling; the street is past x=-W
CY, CT = 5.2, 1.0             # the counter's front face and its top
TV = (-1.75, D - 0.07, 2.2)   # the TV on the back wall
CHALK = "/System/Library/Fonts/Supplemental/Chalkduster.ttf"
HAND = "/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf"


def _copy_tree(ob, parent=None):
    c = ob.copy()
    for col in ob.users_collection:
        col.objects.link(c)
    c.parent = parent
    for ch in ob.children:
        _copy_tree(ch, c).matrix_parent_inverse = ch.matrix_parent_inverse.copy()
    return c


def props(asset, spots, scale=1.0):
    """One Poly Haven model at many spots [(x, y, z, rot_deg)]: imported once, then copied with shared meshes."""
    x, y, z, r = spots[0]
    roots = kit.place(asset, (x, y, z), rot_z=math.radians(r), scale=scale)
    for x, y, z, r in spots[1:]:
        for root in roots:
            c = _copy_tree(root)
            c.location = (x, y, z)
            c.rotation_euler = (0, 0, math.radians(r))
    return roots


def room():
    kit.box((0, D / 2, -0.05), (2 * W, D, 0.1), kit.tex("wood_floor", 0.5, name="cfloor"))
    kit.box((0, D / 2, H + 0.05), (2 * W, D, 0.1), kit.mat("#E9E4DA", 0.9))
    plaster = kit.tex("white_plaster_02", 0.5, tint="#EFE6D6", name="cplaster")
    kit.box((0, D + 0.05, H / 2), (2 * W, 0.1, H), plaster)
    kit.box((1.6, D - 0.005, 0.85), (4.4, 0.01, 1.7), kit.tex("long_white_tiles", 1.0, name="ctiles"))
    kit.box((W + 0.05, D / 2, H / 2), (0.1, D, H), kit.tex("red_brick_03", 0.5, name="cbrick"))
    # the front wall: plaster, with the glass door near the corner
    kit.box((1.4, -0.05, H / 2), (2.8 + 2 * 0.0, 0.1, H), plaster)
    kit.box((-2.3, -0.05, 2.85), (3.0, 0.1, 0.5), plaster)
    frame = kit.mat("#1E3B34", 0.4)
    glass = kit.glass(0.03)
    for x in (-3.75, -2.95, -1.95, -0.85):
        kit.box((x, -0.05, 1.3), (0.08, 0.12, 2.6), frame)
    kit.box((-2.3, -0.05, 0.2), (3.0, 0.12, 0.4), frame)
    kit.box((-2.3, -0.05, 2.6), (3.0, 0.12, 0.08), frame)
    kit.box((-2.3, -0.05, 1.45), (2.9, 0.02, 2.3), glass)
    # the shopfront on the street side: a low stall riser, tall glass, mullions, a transom
    kit.box((-W - 0.05, D / 2, 0.22), (0.14, D, 0.44), frame)
    kit.box((-W - 0.05, D / 2, 2.62), (0.14, D, 0.08), frame)
    kit.box((-W - 0.05, D / 2, 2.9), (0.14, D, 0.4), plaster)
    for y in (0.0, 2.35, 4.7, D):
        kit.box((-W - 0.05, y, 1.4), (0.14, 0.09, 2.5), frame)
    kit.box((-W - 0.05, D / 2, 1.53), (0.02, D, 2.18), glass)
    L = kit.area((-W - 0.2, D / 2, 1.5), (0, D / 2, 1.5), (D, 2.2), 1)
    L.data.cycles.is_portal = True
    # the shop's name on the glass, painted to be read from the street
    gold = kit.mat("#C9A45A", 0.3, 0.8)
    t = kit.text("Dot's", (-W - 0.035, 3.5, 1.95), 0.42, gold, font=kit.FONT_SERIF, rot=(math.radians(90), 0, math.radians(-90)))
    t.scale.x = -1
    return frame


def street(hdri="bethnal_green_entrance", strength=1.0, rotation=0, wet=False):
    """The street past the shopfront: pavement, kerb, road, the terrace opposite and a lamp post."""
    kit.world(hdri=hdri, strength=strength, rotation=rotation)
    pave = kit.tex("concrete_pavement", 0.4, rough=0.15 if wet else None, name="cpave")
    kit.box((-W - 1.6, 4, -0.08), (3.2, 40, 0.1), pave)
    kit.box((-W - 3.25, 4, -0.1), (0.2, 40, 0.14), kit.mat("#8B8A86", 0.6))
    kit.box((-W - 9, 4, -0.2), (11.5, 40, 0.1), kit.tex("worn_asphalt", 0.25, rough=0.12 if wet else None, name="croad"))
    kit.box((0, -8, -0.08), (40, 16, 0.1), pave)
    kit.place("modular_urban_apartments_facade", (-W - 15, 6, -0.2), rot_z=math.radians(-90))
    kit.place("street_lamp_01", (-W - 2.8, 1.2, -0.03), rot_z=math.radians(90))


def rain(count=900, seed=2):
    rng = random.Random(seed)
    bm = bmesh.new()
    for _ in range(count):
        x, y, z = rng.uniform(-W - 9, -W - 0.3), rng.uniform(-2, 10), rng.uniform(0, 4)
        ln, w = rng.uniform(0.2, 0.4), 0.004
        vs = [bm.verts.new(v) for v in ((x, y - w, z), (x, y + w, z), (x + 0.02, y + w, z + ln), (x + 0.02, y - w, z + ln))]
        bm.faces.new(vs)
    me = bpy.data.meshes.new("rain")
    bm.to_mesh(me)
    ob = bpy.data.objects.new("rain", me)
    ob.data.materials.append(kit.mat("#DDE8F0", 0.1, emit="#C9D8E6", strength=0.3, alpha=0.12))
    bpy.context.scene.collection.objects.link(ob)


def counter():
    front = kit.mat("#2F4F46", 0.45)
    x0, x1 = -0.7, W
    kit.box(((x0 + x1) / 2, CY + 0.32, CT / 2 - 0.02), (x1 - x0, 0.64, CT - 0.04), front, bevel=0.01)
    for k in range(int((x1 - x0) / 0.12)):
        kit.box((x0 + 0.06 + k * 0.12, CY - 0.003, CT / 2), (0.012, 0.01, CT - 0.2), kit.mat("#27433B", 0.5))
    kit.box(((x0 + x1) / 2, CY + 0.3, CT - 0.02), (x1 - x0 + 0.06, 0.72, 0.04), kit.tex("marble_01", 0.8, name="ctop"), bevel=0.004)
    kit.box(((x0 + x1) / 2, CY - 0.1, 0.22), (x1 - x0, 0.03, 0.03), kit.mat("#B89A5E", 0.25, 1.0))   # brass foot rail
    # the back bar along the back wall, the espresso machine, shelves of cups
    kit.box((1.6, D - 0.3, 0.45), (4.4, 0.6, 0.9), kit.mat("#E8E2D6", 0.5))
    kit.box((1.6, D - 0.3, 0.92), (4.4, 0.62, 0.04), kit.mat("#2B2B2B", 0.3))
    steel = kit.mat("#C9CCD0", 0.18, 1.0)
    kit.box((0.4, D - 0.35, 1.18), (0.8, 0.5, 0.48), steel, bevel=0.03)
    kit.box((0.4, D - 0.62, 1.2), (0.7, 0.04, 0.2), kit.mat("#A8322A", 0.35), bevel=0.01)
    for dx in (-0.2, 0.2):
        kit.cyl((0.4 + dx, D - 0.66, 1.02), 0.035, 0.05, kit.mat("#222", 0.3, 0.6))
    kit.cyl((1.25, D - 0.35, 1.08), 0.11, 0.28, kit.mat("#2A2A2A", 0.3, 0.5))            # grinder
    kit.cyl((1.25, D - 0.35, 1.32), 0.09, 0.2, kit.glass(0.1), r2=0.06)
    shelf = kit.mat("#6B4B33", 0.5)
    cup = kit.mat("#F4F1EA", 0.35)
    for z in (1.3, 1.62):
        kit.box((2.6, D - 0.12, z), (1.9, 0.24, 0.03), shelf)
        for k in range(9):
            kit.cyl((1.8 + k * 0.2, D - 0.12, z + 0.06), 0.04, 0.09, cup, r2=0.034)
    # a cake stand under a glass dome and a basket of croissants on the counter
    kit.cyl((-0.25, CY + 0.35, CT + 0.07), 0.14, 0.14, kit.mat("#DAD4C8", 0.3))
    kit.place("carrot_cake", (-0.25, CY + 0.35, CT + 0.14))
    kit.sphere((-0.25, CY + 0.35, CT + 0.2), 0.17, kit.glass(0.02), scale=(1, 1, 1.1))
    props("croissant", [(0.3, CY + 0.3, CT + 0.01, 20), (0.36, CY + 0.42, CT + 0.01, -30), (0.24, CY + 0.46, CT + 0.03, 70)])


def chalkboard(lines, x=2.3, z=2.35, w=2.2, h=1.05):
    kit.box((x, D - 0.03, z), (w + 0.08, 0.04, h + 0.08), kit.mat("#5A3E2A", 0.5))
    kit.box((x, D - 0.055, z), (w, 0.02, h), kit.mat("#1E2421", 0.95))
    chalk = kit.mat("#EDEBE4", 0.9, emit="#EDEBE4", strength=0.05)
    for body, (dx, dz), size, colour in lines:
        kit.text(body, (x + dx, D - 0.067, z + dz), size, colour or chalk, font=CHALK, align="LEFT", rot=(math.radians(90), 0, math.radians(180)))


def menu(prices):
    """The menu board: [(item, price)]."""
    chalk = kit.mat("#EDEBE4", 0.9, emit="#EDEBE4", strength=0.05)
    lines = [("Dot's", (0.95, 0.33), 0.16, None)]
    for i, (item, price) in enumerate(prices):
        lines.append((item, (0.95, 0.12 - i * 0.14), 0.075, chalk))
        lines.append((price, (-0.55, 0.12 - i * 0.14), 0.075, chalk))
    chalkboard(lines)


def tv(plate, crop, width=1.45):
    x, y, z = TV
    kit.box((x, y + 0.03, z), (0.2, 0.06, 0.2), kit.mat("#1A1A1A", 0.4, 0.5))
    face, _ = kit.screen("tv", (x, y - 0.04, z), width, plate, crop=crop, rot=(math.radians(96), 0, 0), strength=1.2,
                         depth=0.04, border=0.018, bezel="#0E0F10")
    return face


def tables(spots, chairs_up=False):
    """Round café tables at [(x, y)], two chairs each (upside down on the table when the café is closed)."""
    props("round_wooden_table_02", [(x, y, 0, 0) for x, y in spots])
    chairs = []
    for i, (x, y) in enumerate(spots):
        for side in (-1, 1):
            if chairs_up:
                chairs.append((x + side * 0.18, y, 0.75 + 0.45, 90 + side * 90))
            else:
                chairs.append((x + side * 0.55, y + 0.05 * side, 0, -90 * side + 180 + (i * 17 % 20 - 10)))
    roots = props("dining_chair_02", [c[:3] + (c[3],) for c in chairs])
    return roots


def pendants(on=True, energy=40, spots=((0.3, CY + 0.3), (1.7, CY + 0.3), (3.1, CY + 0.3))):
    """Enamel lamps over the counter, each throwing a pool of warm light down."""
    props("hanging_industrial_lamp", [(x, y, H, 0) for x, y in spots], scale=0.75)
    for x, y in spots:
        if on:
            kit.spot((x, y, H - 1.0), (x, y, 0), energy, kit.kelvin(2700), angle=100, blend=0.7, radius=0.05)


def dot(at=(0.6, 6.2), facing=180, pose="stand"):
    return P.person(at, facing=facing, pose=pose, height=1.63, coat="#3E4A44", hair="#8C8C8C", build=1.08, seed=77)


def cup(at, saucer=True):
    x, y, z = at
    if saucer:
        kit.cyl((x, y, z + 0.006), 0.07, 0.012, kit.mat("#F4F1EA", 0.35))
    kit.cyl((x, y, z + 0.05), 0.045, 0.08, kit.mat("#F4F1EA", 0.35), r2=0.035)


def shot_ab_news():
    room()
    street("bethnal_green_entrance", 1.0, 200, wet=True)
    rain()
    counter()
    menu([("Espresso", "2.40"), ("Flat white", "3.10"), ("Tea", "2.00"), ("Toast & jam", "3.50")])
    face = tv("ab-news", (226, 112, 828, 452))
    tables([(-2.9, 2.2), (-2.9, 4.0), (-2.3, 6.1), (1.55, 2.75)])
    pendants(energy=260)
    dot((0.5, 6.25), facing=10)             # Dot at the machine, her back to the room
    # breakfast regulars, nobody watching: a paper under the TV, a phone by the window, a chat at the counter
    P.person((-2.3 + 0.55, 6.15, 0.0), facing=-100, pose="sit", coat="#3B2A26", hold="paper", seed=3)
    P.person((-2.9 + 0.55, 4.05, 0.0), facing=-80, pose="sit", coat="#26303C", hold="phone", seed=4)
    P.person((-2.9 - 0.55, 2.2, 0.0), facing=100, pose="sit", coat="#4A443C", hold="cup", seed=6)
    props("bar_chair_round_01", [(1.2, CY - 0.45, 0, 0), (2.0, CY - 0.45, 0, 0), (2.8, CY - 0.45, 0, 0)])
    P.person((1.2, CY - 0.45, 0.28), facing=10, pose="sit", coat="#44343A", long_coat=True, seed=5)
    P.person((-W - 1.4, 3.0, -0.03), facing=180, pose="walk", coat="#1F2226", long_coat=True, hold="umbrella", seed=8)
    cup((1.3, CY + 0.15, CT))
    cup((-2.05, 6.0, 0.75))
    cup((-2.75, 4.1, 0.75))
    cup((1.35, 2.7, 0.75))
    kit.box((1.62, 2.62, 0.755), (0.3, 0.4, 0.008), kit.mat("#E9E4D8", 0.8), rot=(0, 0, 0.3))    # a folded paper
    kit.area((0.5, 3.0, H - 0.05), (0.5, 3.0, 0), (3, 3), 60, kit.kelvin(3000))   # the ceiling downlights
    kit.camera((0.95, 1.55, 1.22), (-1.3, 6.6, 1.55), lens=38, fstop=2.8, focus=face)
    bpy.context.scene.view_settings.exposure = 0.4


kit.run({"ab-news": shot_ab_news})
