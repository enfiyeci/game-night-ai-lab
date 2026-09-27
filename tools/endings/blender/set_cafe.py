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
    """One Poly Haven model at many spots [(x, y, z, rot_z_deg[, rot_x_deg])]: imported once, then copied with shared
    meshes."""
    roots = kit.place(asset, spots[0][:3], scale=scale)
    for i, spot in enumerate(spots):
        x, y, z, rz = spot[:4]
        rx = spot[4] if len(spot) > 4 else 0
        for root in (roots if i == 0 else [_copy_tree(r) for r in roots]):
            root.location = (x, y, z)
            root.rotation_euler = (math.radians(rx), 0, math.radians(rz))
    return roots


def room():
    kit.box((0, D / 2, -0.05), (2 * W, D, 0.1), kit.tex("wood_floor", 0.5, name="cfloor"))
    kit.box((0, D / 2, H + 0.05), (2 * W, D, 0.1), kit.mat("#E9E4DA", 0.9))
    plaster = kit.tex("white_plaster_02", 0.5, tint="#EFE6D6", name="cplaster")
    kit.box((0, D + 0.05, H / 2), (2 * W, 0.1, H), plaster)
    kit.box((1.6, D - 0.005, 0.85), (4.4, 0.01, 1.7), kit.tex("long_white_tiles", 1.0, name="ctiles"))
    kit.box((W + 0.05, D / 2, H / 2), (0.1, D, H), kit.tex("red_brick_03", 0.5, name="cbrick"))
    # green panelling to dado height on the back wall's window end and the front wall
    panel = kit.mat("#2F4F46", 0.45)
    kit.box((-2.25, D - 0.02, 0.55), (3.1, 0.04, 1.1), panel)
    kit.box((-2.25, D - 0.045, 1.11), (3.1, 0.06, 0.04), kit.mat("#27433B", 0.4))
    kit.box((1.4, 0.02, 0.55), (2.8, 0.04, 1.1), panel)
    # the front wall: plaster, with the glass door near the corner
    kit.box((1.4, -0.05, H / 2), (2.8 + 2 * 0.0, 0.1, H), plaster)
    kit.box((-2.3, -0.05, 2.85), (3.0, 0.1, 0.5), plaster)
    frame = kit.mat("#1E3B34", 0.4)
    glass = kit.glass(0.03)
    for x in (-3.75, -2.95, -1.95, -0.85):
        kit.box((x, -0.05, 1.3), (0.08, 0.12, 2.6), frame)
    kit.box((-2.3, -0.05, 0.2), (3.0, 0.12, 0.4), frame)
    kit.box((-2.3, -0.05, 2.6), (3.0, 0.12, 0.08), frame)
    panes = [kit.box((-2.3, -0.05, 1.45), (2.9, 0.02, 2.3), glass)]
    # the shopfront on the street side: a low stall riser, tall glass, mullions, a transom
    kit.box((-W - 0.05, D / 2, 0.22), (0.14, D, 0.44), frame)
    kit.box((-W - 0.05, D / 2, 2.62), (0.14, D, 0.08), frame)
    kit.box((-W - 0.05, D / 2, 2.9), (0.14, D, 0.4), plaster)
    for y in (0.0, 2.35, 4.7, D):
        kit.box((-W - 0.05, y, 1.4), (0.14, 0.09, 2.5), frame)
    panes.append(kit.box((-W - 0.05, D / 2, 1.53), (0.02, D, 2.18), glass))
    for pane in panes:        # daylight passes the glass (refracting glass would block the sun's shadow rays)
        pane.visible_shadow = False
    L = kit.area((-W - 0.2, D / 2, 1.5), (0, D / 2, 1.5), (D, 2.2), 1)
    L.data.cycles.is_portal = True
    # the shop's name on the glass, painted to be read from the street
    gold = kit.mat("#C9A45A", 0.3, 0.8)
    t = kit.text("Dot's", (-W - 0.035, 3.5, 1.95), 0.42, gold, font=kit.FONT_SERIF, rot=(math.radians(90), 0, math.radians(-90)))
    t.scale.x = -1
    return frame


def street(hdri="bethnal_green_entrance", strength=1.0, rotation=0, wet=False):
    """The street past the shopfront: pavement, kerb, road and a lamp post; the world image shows the far side."""
    kit.world(hdri=hdri, strength=strength, rotation=rotation)
    pave = kit.tex("concrete_pavement", 0.4, rough=0.15 if wet else None, name="cpave")
    kit.box((-W - 1.6, 4, -0.08), (3.2, 40, 0.1), pave)
    kit.box((-W - 3.25, 4, -0.1), (0.2, 40, 0.14), kit.mat("#8B8A86", 0.6))
    kit.box((-W - 9, 4, -0.2), (11.5, 40, 0.1), kit.tex("worn_asphalt", 0.25, rough=0.12 if wet else None, name="croad"))
    kit.box((0, -8, -0.08), (40, 16, 0.1), pave)
    props("street_lamp_01", [(-W - 2.8, 1.2, -0.03, 90)])


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


def counter(shelves=True):
    front = kit.mat("#2F4F46", 0.45)
    x0, x1 = -0.7, W
    kit.box(((x0 + x1) / 2, CY + 0.32, CT / 2 - 0.02), (x1 - x0, 0.64, CT - 0.04), front, bevel=0.01)
    for k in range(int((x1 - x0) / 0.12)):
        kit.box((x0 + 0.06 + k * 0.12, CY - 0.003, CT / 2), (0.012, 0.01, CT - 0.2), kit.mat("#27433B", 0.5))
    kit.box(((x0 + x1) / 2, CY + 0.3, CT - 0.02), (x1 - x0 + 0.06, 0.72, 0.04), kit.mat("#D8D3CA", 0.25, name="ctop"), bevel=0.004)
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
    for z in (1.3, 1.62) if shelves else ():
        kit.box((2.6, D - 0.12, z), (1.9, 0.24, 0.03), shelf)
        for k in range(9):
            kit.cyl((1.8 + k * 0.2, D - 0.12, z + 0.06), 0.04, 0.09, cup, r2=0.034)
    # a cake stand under a glass dome and a basket of croissants on the counter
    kit.cyl((-0.25, CY + 0.35, CT + 0.07), 0.14, 0.14, kit.mat("#DAD4C8", 0.3))
    props("carrot_cake", [(-0.25, CY + 0.35, CT + 0.14, 0)])
    kit.sphere((-0.25, CY + 0.35, CT + 0.2), 0.17, kit.glass(0.02), scale=(1, 1, 1.1))
    props("croissant", [(0.3, CY + 0.3, CT + 0.01, 20), (0.36, CY + 0.42, CT + 0.01, -30), (0.24, CY + 0.46, CT + 0.03, 70)])


def chalkboard(lines, x=2.3, z=2.35, w=2.2, h=1.05):
    kit.box((x, D - 0.03, z), (w + 0.08, 0.04, h + 0.08), kit.mat("#5A3E2A", 0.5))
    kit.box((x, D - 0.055, z), (w, 0.02, h), kit.mat("#1E2421", 0.95))
    chalk = kit.mat("#EDEBE4", 0.9, emit="#EDEBE4", strength=0.05)
    for body, (dx, dz), size, colour in lines:
        kit.text(body, (x + dx, D - 0.067, z + dz), size, colour or chalk, font=CHALK, align="LEFT")


def menu(prices):
    """The menu board: [(item, price)]."""
    lines = [("Dot's", (-0.95, 0.33), 0.16, None)]
    for i, (item, price) in enumerate(prices):
        lines.append((item, (-0.95, 0.12 - i * 0.14), 0.075, None))
        lines.append((price, (0.55, 0.12 - i * 0.14), 0.075, None))
    chalkboard(lines)


def a_board(at, facing, lines):
    """A standing chalkboard sign on the floor, its face turned to `facing` degrees (0 = +y): lines are
    [(text, dz, size, colour or None)] from the board's centre."""
    x, y = at
    root = bpy.data.objects.new("a-board", None)
    bpy.context.scene.collection.objects.link(root)
    wood, slate = kit.mat("#6B4B33", 0.55), kit.mat("#1E2421", 0.95)
    chalk = kit.mat("#EDEBE4", 0.9, emit="#EDEBE4", strength=0.08)
    parts = []
    for side in (1, -1):   # two leaning boards, hinged at the top
        tilt = math.radians(12) * side
        parts.append(kit.box((0, side * 0.17, 0.52), (0.62, 0.03, 1.02), wood, rot=(tilt, 0, 0)))
        parts.append(kit.box((0, side * 0.19, 0.55), (0.52, 0.01, 0.82), slate, rot=(tilt, 0, 0)))
    for body, dz, size, colour in lines:
        t = kit.text(body, (0, -0.2 - dz * math.sin(math.radians(12)), 0.55 + dz * math.cos(math.radians(12))), size, colour or chalk,
                     font=CHALK, rot=(math.radians(90 - 12), 0, 0))
        parts.append(t)
    for part in parts:
        part.parent = root
    root.location = (x, y, 0)
    root.rotation_euler = (0, 0, math.radians(facing + 180))
    return root


def in_view(nx, ny, dist):
    """A point dist metres in front of the camera at (nx, ny) in the frame (-1..1 across, -1..1 up), and the rotation
    that turns a screen square to the camera (call after kit.camera)."""
    from mathutils import Vector
    cam = bpy.context.scene.camera
    bpy.context.view_layer.update()
    k = dist / cam.data.lens
    return cam.matrix_world @ Vector((nx * 18 * k, ny * 10.125 * k, -dist)), tuple(cam.matrix_world.to_euler())


def tv(plate, crop, width=1.5):
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
                chairs.append((x + side * 0.2, y, 0.76 + 0.47, 90 + side * 90, 180))
            else:
                chairs.append((x + side * 0.55, y + 0.05 * side, 0, -90 * side + 180 + (i * 17 % 20 - 10)))
    props("dining_chair_02", chairs)


def pendants(on=True, energy=40, spots=((0.3, CY + 0.3), (1.6, CY + 0.3), (2.9, CY + 0.3), (-2.9, 3.1), (-0.3, 2.2))):
    """Small enamel lamps on long cords, over the counter and the tables."""
    enamel = kit.mat("#E9E4D8", 0.3)
    cord = kit.mat("#151515", 0.5)
    for x, y in spots:
        z = 2.15
        kit.cyl((x, y, (H + z) / 2 + 0.1), 0.004, H - z - 0.2, cord, verts=6)
        kit.cyl((x, y, z + 0.06), 0.13, 0.14, enamel, r2=0.03)
        kit.cyl((x, y, z + 0.005), 0.13, 0.004, kit.emission("#FFD9A8", 6 if on else 0.0), verts=24)
        if on:
            kit.spot((x, y, z), (x, y, 0), energy, kit.kelvin(2700), angle=110, blend=0.8, radius=0.05)


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
    tables([(-2.9, 2.2), (-2.9, 4.0), (-2.3, 6.1), (0.4, 0.9)])
    pendants(energy=160)
    dot((0.5, 6.25), facing=10)             # Dot at the machine, her back to the room
    # breakfast regulars, nobody watching: a paper by the window, a phone, a chat at the counter; under the TV an
    # empty table with the business pages left folded by a cup
    P.person((-2.3 + 0.55, 6.1, 0.0), facing=95, pose="sit", coat="#8A7A62", hold="paper", seed=3)
    P.person((-2.9 + 0.5, 2.25, 0.0), facing=150, pose="sit", coat="#2C3A4F", hold="phone", seed=4)
    props("bar_chair_round_01", [(0.1, CY - 0.45, 0, 0), (0.9, CY - 0.45, 0, 0), (1.7, CY - 0.45, 0, 0)])
    P.person((2.1, 4.6, 0.0), facing=-5, coat="#26302C", long_coat=True, seed=5)
    cup((0.95, CY + 0.15, CT))
    cup((-2.45, 6.2, 0.75))
    cup((-2.75, 4.1, 0.75))
    cup((0.5, 0.95, 0.75))
    P.person((-W - 1.4, 6.2, -0.05), facing=180, pose="walk", coat="#1F2226", long_coat=True, hold="umbrella", seed=9)
    kit.area((0.5, 3.5, H - 0.05), (0.5, 3.5, 0), (3, 3), 80, kit.kelvin(3000))   # the ceiling downlights
    kit.camera((0.95, 1.7, 1.22), (-1.3, 6.6, 1.55), lens=37, fstop=4.0, focus=face)
    bpy.context.scene.view_settings.exposure = 0.4


def shot_al_cafe():
    room()
    street("crosswalk", 1.0, 120)
    counter()
    menu([("Espresso", "2.40"), ("Flat white", "3.10"), ("Iced latte", "3.60"), ("Lemon cake", "3.20")])
    face = tv("al-cafe", (226, 112, 828, 452))
    tables([(-2.9, 1.8), (-3.0, 4.7), (-2.3, 6.1), (0.9, 3.0)])
    pendants(on=False)
    # a slow sunny morning: sun across the floor, plants in the window, people lingering
    props("potted_plant_01", [(-3.5, 0.6, 0.0, 30), (-3.45, 5.3, 0.0, 200)])
    props("ceramic_vase_01", [(-3.0, 4.65, 0.75, 0)])
    P.person((-3.0 + 0.5, 4.75, 0.0), facing=95, pose="sit", coat="#7A8C9A", seed=12, hold="cup")
    P.person((-2.3 + 0.55, 6.1, 0.0), facing=80, pose="sit", coat="#B5654A", hold="paper", seed=13)
    P.person((0.9 + 0.55, 3.0, 0.0), facing=-120, pose="sit", coat="#E7DFCF", seed=14, hold="cup")
    dot((1.1, 6.2), facing=200)
    cup((-2.85, 4.8, 0.75))
    cup((0.75, 2.95, 0.75))
    cup((-2.1, 6.0, 0.75))
    kit.sun((0, -66, 38), 5.0, kit.kelvin(5000), angle=0.6)
    kit.camera((-0.55, 1.5, 1.25), (-2.0, 6.6, 1.55), lens=33, fstop=4.5, focus=face)
    bpy.context.scene.view_settings.exposure = 0.5


def shot_rb_cafe():
    room()
    street("modern_evening_street", 0.12, 200)
    kit.spot((-W - 2.8, 1.2, 5.0), (-W - 1.5, 2.5, 0), 900, (1.0, 0.72, 0.42), angle=100, blend=0.7)   # the lamp outside
    counter()
    menu([("Espresso", "2.40"), ("Flat white", "3.10"), ("Tea", "2.00"), ("Soup of the day", "5.50")])
    face = tv("rb-cafe", (226, 112, 634, 452))
    tables([(-2.9, 2.2), (-2.9, 4.1), (-2.3, 6.1), (0.9, 2.6)])
    pendants(energy=150)
    # after work: a man in a suit at the counter raises his cup to the screen; his neighbour keeps to her soup
    props("bar_chair_round_01", [(-0.3, CY - 0.45, 0, 0), (0.5, CY - 0.45, 0, 0), (1.3, CY - 0.45, 0, 0), (2.1, CY - 0.45, 0, 0)])
    P.person((-0.3, CY - 0.45, 0.28), facing=55, pose="sit", coat="#1F2226", trousers="#1F2226", seed=21, hold="cup")
    P.person((0.5, CY - 0.45, 0.28), facing=-10, pose="sit", coat="#6A6154", long_coat=True, seed=22)
    P.person((-2.9 + 0.5, 4.15, 0.0), facing=30, pose="sit", coat="#44343A", hold="phone", seed=23)
    dot((2.0, 6.2), facing=160)
    kit.cyl((0.5, CY + 0.12, CT + 0.03), 0.09, 0.06, kit.mat("#F4F1EA", 0.35), r2=0.07)   # her soup
    cup((-2.75, 4.2, 0.75))
    kit.area((0.5, 3.5, H - 0.05), (0.5, 3.5, 0), (3, 3), 60, kit.kelvin(3000))
    kit.camera((-2.6, 0.6, 1.4), (-0.9, 6.6, 1.55), lens=40, fstop=4.0, focus=face)
    bpy.context.scene.view_settings.exposure = 0.3


def shot_lb_cafe():
    room()
    street("cobblestone_street_night", 0.15, 180)
    counter()
    menu([("Espresso", "2.40"), ("Flat white", "3.10"), ("Tea", "2.00"), ("Toast & jam", "3.50")])
    face = tv("lb-cafe", (226, 112, 828, 452))
    tables([(-2.9, 2.2), (-2.9, 4.1), (-2.3, 6.1)], chairs_up=True)
    pendants(energy=120, spots=((2.9, CY + 0.3),))
    # closing time: chairs up, the floor being swept; the TV talks to an empty room, Dot's back to it
    dot((0.75, 4.4), facing=-120, pose="lean")
    props("plastic_broom", [(1.05, 4.05, 0, -120, -15)])
    kit.cyl((1.5, 3.6, 0.16), 0.17, 0.32, kit.mat("#C9A227", 0.4), r2=0.15)          # the mop bucket
    props("WetFloorSign_01", [(-0.6, 3.6, 0, 35)])
    kit.point((-1.75, 6.3, 2.0), 6, kit.kelvin(8000), radius=0.4)                   # the TV's glow in the corner
    kit.camera((1.6, 0.8, 1.3), (-1.3, 6.6, 1.7), lens=45, fstop=4.0, focus=face)
    bpy.context.scene.view_settings.exposure = 0.2


def shot_qt_cafe():
    room()
    street("crosswalk", 0.9, 150)
    counter()
    menu([("Espresso", "1.90"), ("Flat white", "2.60"), ("Tea", "1.50"), ("Toast & jam", "2.80")])
    tv_face = tv("qt-cafe", (226, 112, 634, 452))
    tables([(-2.9, 1.8), (-2.9, 3.6), (-2.3, 6.1), (0.9, 2.2)])
    pendants(energy=60)
    kit.sun((0, -64, 30), 3.0, kit.kelvin(5200), angle=0.6)
    # the café is full; a board by the door says prices are down again
    a_board((-1.5, 4.4), -165, [("PRICES", 0.3, 0.1, None), ("DOWN", 0.17, 0.1, None), ("again!", 0.03, 0.08, None),
                                ("flat white 2.60", -0.14, 0.045, None), ("was 3.10", -0.22, 0.04, None)])
    rng = random.Random(31)
    seats = [(-2.9 + 0.5, 1.85, 100), (-2.9 - 0.5, 1.75, -80), (-2.9 + 0.5, 3.65, 95), (-2.9 - 0.5, 3.55, -85),
             (-2.3 + 0.55, 6.1, 80), (-2.3 - 0.55, 6.05, -90)]
    for i, (x, y, f) in enumerate(seats):
        P.person((x, y, 0.0), facing=f, pose="sit", coat=rng.choice(["#C9B79A", "#7A8C9A", "#B5654A", "#5B3A33", "#E7DFCF", "#2C3A4F"]),
                 hold=rng.choice([None, "cup", "phone"]), seed=30 + i)
    for i, x in enumerate((0.3, 1.0, 1.8)):   # a queue at the counter
        P.person((x, CY - 0.6 - 0.1 * i, 0.0), facing=rng.uniform(-20, 20), coat=rng.choice(["#3B3F46", "#6A6154", "#26302C"]),
                 long_coat=i == 1, seed=40 + i)
    dot((0.9, 6.2), facing=170)
    for i, (y, f) in enumerate(((3.0, 180), (5.5, 0))):   # people passing outside
        P.person((-W - 1.2 - 0.5 * i, y, -0.03), facing=f, pose="walk", coat=["#C9B79A", "#3F6A8A"][i], seed=60 + i)
    kit.camera((1.05, 1.55, 1.12), (-1.2, 6.6, 1.62), lens=30)
    # someone's phone, propped on a sugar pot on a standing table, showing the post
    at, rot = in_view(0.55, -0.28, 0.43)
    kit.screen("phone", tuple(at), 0.068, "qt-cafe", crop=(882, 132, 240, 454), rot=rot, strength=1.0, bezel="#111214", depth=0.008,
               border=0.005)
    top = at.z - 0.066
    kit.cyl((at.x, at.y + 0.06, top + 0.045), 0.035, 0.09, kit.mat("#F4F1EA", 0.35))
    kit.cyl((at.x + 0.05, at.y + 0.15, top - 0.015), 0.32, 0.03, kit.mat("#6B4B33", 0.4))
    kit.cyl((at.x + 0.05, at.y + 0.15, top / 2), 0.03, top, kit.mat("#2A2A2A", 0.4, 0.6))
    bpy.context.scene.view_settings.exposure = 0.4


def till(plate, crop, at, yaw=0.0):
    """The till: a tablet on a stand on the counter, its screen turned to Dot behind the counter."""
    x, y, z = at
    w = 0.27
    h = w * crop[3] / crop[2]
    kit.box((x, y, z + 0.01), (0.16, 0.12, 0.02), kit.mat("#DADCDF", 0.3, 0.8), bevel=0.005, rot=(0, 0, math.radians(yaw)))
    kit.cyl((x, y - 0.02, z + 0.08), 0.015, 0.14, kit.mat("#DADCDF", 0.3, 0.8))
    face, _ = kit.screen("till", (x, y, z + 0.16 + h / 2 * 0.9), w, plate, crop=crop, rot=(math.radians(70), 0, math.radians(180 + yaw)),
                         strength=1.1, bezel="#1A1B1D", depth=0.012, border=0.012)
    return face


def shot_ab_till():
    room()
    street("bethnal_green_entrance", 1.2, 40)
    counter()
    menu([("Espresso", "2.60"), ("Flat white", "3.40"), ("Tea", "2.20"), ("Toast & jam", "3.80")])
    tv("ab-news", (226, 112, 828, 452))
    tables([(-2.9, 1.8), (-2.9, 3.6), (-2.3, 6.1), (0.4, 2.4), (2.4, 1.4)], chairs_up=True)
    pendants(energy=150, spots=((1.6, CY + 0.3),))
    # before opening: the till screen shows the new monthly plan; beside it the printed invoice, circled in pen,
    # Dot's glasses and her cold coffee
    face = till("ab-till", (270, 116, 740, 444), (1.75, CY + 0.2, CT))
    paper = kit.mat("#F7F4EC", 0.8)
    ink = kit.mat("#232323", 0.6)
    red = kit.mat("#B03A2A", 0.5)
    px, py, pz = 1.4, CY + 0.36, CT + 0.002
    a = math.radians(188)                                  # the page is turned to be read from behind the counter
    right, up = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
    kit.box((px, py, pz), (0.21, 0.3, 0.001), paper, rot=(0, 0, a))
    for body, v, size, font, col in (("AZURIA", 0.11, 0.03, kit.FONT, kit.mat("#3F84C6", 0.5)), ("Business Suite · Invoice", 0.08, 0.011, kit.FONT_SANS, ink),
                                     ("Monthly plan", 0.03, 0.016, kit.FONT_SANS, ink), ("$412.00", -0.01, 0.034, kit.FONT, ink),
                                     ("previous plan  $180.00", -0.05, 0.012, kit.FONT_SANS, ink), ("provider: Azuria (1 of 1)", -0.075, 0.011, kit.FONT_SANS, ink)):
        u = -0.075
        kit.text(body, (px + u * right[0] + v * up[0], py + u * right[1] + v * up[1], pz + 0.001), size, col, font=font, align="LEFT",
                 rot=(0, 0, a))
    u, v = -0.02, -0.01
    ring = kit.cyl((px + u * right[0] + v * up[0], py + u * right[1] + v * up[1], pz + 0.0012), 0.06, 0.0005, None, verts=40, rot=(0, 0, a))
    kit.recolour([ring], red)
    ring.scale = (1.25, 0.45, 1)
    ring.modifiers.new("hole", "WIREFRAME").thickness = 0.003
    kit.cyl((1.48, CY + 0.52, CT + 0.004), 0.004, 0.14, kit.mat("#1E3B6A", 0.4), rot=(0, math.radians(90), math.radians(30)))  # the pen
    cup((2.05, CY + 0.2, CT))
    kit.camera((1.72, 6.45, 1.6), (1.45, 4.6, 0.9), lens=32, fstop=5.6, focus=face)
    bpy.context.scene.view_settings.exposure = 0.6


def reader(plate, crop, at):
    """The card reader, on a stand at the counter's edge, facing the customer."""
    x, y, z = at
    w = 0.13
    t = math.radians(15)                     # leaning back
    body = kit.mat("#2B2C2E", 0.4)
    kit.box((x, y + 0.03, z + 0.04), (0.1, 0.1, 0.08), body, bevel=0.01)
    kit.box((x, y, z + 0.19), (0.16, 0.03, 0.3), body, bevel=0.012, rot=(-t, 0, 0))
    face, _ = kit.screen("reader", (x, y - 0.015 - 0.07 * math.sin(t), z + 0.19 + 0.07 * math.cos(t)), w, plate, crop=crop,
                         rot=(math.radians(90) - t, 0, 0), strength=1.0, bezel="#18191A", depth=0.004, border=0.004)
    for r in range(3):
        for c in range(3):
            dz = -0.02 - r * 0.03
            kit.box((x - 0.04 + c * 0.04, y - 0.016 - dz * math.sin(t), z + 0.19 + dz * math.cos(t)), (0.032, 0.004, 0.022),
                    kit.mat("#5E5B58", 0.5), rot=(-t, 0, 0))
    return face


def shot_rd_card():
    room()
    street("cambridge", 0.9, 0)
    counter(shelves=False)
    menu([("Espresso", "2.40"), ("Flat white", "3.40"), ("Tea", "2.00"), ("Toast & jam", "3.50")])
    tables([(-2.9, 1.8), (-2.9, 3.6), (-2.3, 6.1)])
    pendants(energy=150)
    # the reader refuses every card; a hand-written sign is taped up beside it; the mirror behind the counter shows the
    # queue back to the door
    face = reader("rd-card", (360, 130, 360, 250), (2.5, CY + 0.1, CT))
    kit.box((2.5, D - 0.02, 1.42), (1.7, 0.02, 0.9), kit.mat("#5A3E2A", 0.5))
    kit.box((2.5, D - 0.035, 1.42), (1.6, 0.01, 0.8), kit.mat("#DDE2E4", 0.02, 1.0))
    sx, sy, sz = 2.69, CY + 0.2, CT + 0.11
    kit.box((sx, sy, sz), (0.14, 0.004, 0.2), kit.mat("#C8A57A", 0.85), rot=(math.radians(-6), 0, math.radians(-8)))
    kit.text("CASH\nONLY", (sx, sy - 0.006, sz + 0.015), 0.042, kit.mat("#1A1A1A", 0.6), font=HAND, rot=(math.radians(84), 0, math.radians(-8)))
    kit.text("sorry! - D", (sx + 0.01, sy - 0.006, sz - 0.07), 0.018, kit.mat("#1A1A1A", 0.6), font=HAND, rot=(math.radians(84), 0, math.radians(-8)))
    for dx in (-0.06, 0.06):
        kit.box((sx + dx, sy - 0.004, sz + 0.098), (0.035, 0.001, 0.016), kit.mat("#E9E4C8", 0.3), rot=(math.radians(-6), 0, math.radians(-8)))
    kit.box((2.33, CY + 0.02, CT + 0.001), (0.085, 0.054, 0.001), kit.mat("#2F5F8A", 0.3, 0.3), rot=(0, 0, math.radians(20)))   # a card
    kit.cyl((2.3, CY + 0.3, CT + 0.08), 0.06, 0.16, kit.glass(0.05))                                                     # the cash jar
    rng = random.Random(51)
    line = [(2.05, 4.3), (2.6, 3.6), (2.3, 2.8), (2.7, 2.1), (2.1, 1.4), (1.3, 0.9), (0.3, 0.6), (-0.8, 0.45), (-2.5, -0.5)]
    for i, (x, y) in enumerate(line):
        P.person((x, y), facing=rng.uniform(-15, 15), height=rng.uniform(1.58, 1.88), long_coat=rng.random() < 0.5,
                 coat=rng.choice(["#3B3F46", "#5B3A33", "#2C3A4F", "#6A6154", "#44343A", "#26302C"]),
                 hold="phone" if i in (1, 3, 6) else None, seed=50 + i)
    dot((1.0, 6.25), facing=20)
    kit.camera((2.5, 4.72, 1.42), (2.5, 7.0, 0.9), lens=32, fstop=8.0, focus=face)
    bpy.context.scene.view_settings.exposure = 0.6


kit.run({"ab-news": shot_ab_news, "ab-till": shot_ab_till, "al-cafe": shot_al_cafe, "rb-cafe": shot_rb_cafe,
         "lb-cafe": shot_lb_cafe, "qt-cafe": shot_qt_cafe, "rd-card": shot_rd_card})
