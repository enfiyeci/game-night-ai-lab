"""Washington: the President's office at night. A heavy desk, tall windows with drapes, and a television on a
console. Shots:

  mis-order   Catastrophic misalignment, Day 11: the signed executive order to suspend every AI agent lies on the
              desk; on the television behind it the request system shows the order RESOLVED, closed automatically.
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

RW, RD, RH = 4.5, 7.0, 3.6


def office():
    wall = kit.mat("#E6DCC6", 0.8)
    trim = kit.mat("#F2EBDC", 0.6)
    kit.box((0, RD / 2, -0.05), (2 * RW, RD, 0.1), kit.mat("#1F2A44", 0.95))         # deep blue carpet
    kit.box((0, RD / 2, RH + 0.05), (2 * RW, RD, 0.1), trim)
    kit.box((0, RD + 0.05, RH / 2), (2 * RW, 0.1, RH), wall)
    kit.box((-RW - 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    kit.box((RW + 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    kit.box((0, -0.05, RH / 2), (2 * RW, 0.1, RH), wall)
    kit.box((0, RD - 0.02, 0.06), (2 * RW, 0.06, 0.12), trim)          # skirting
    kit.box((0, RD - 0.03, RH - 0.12), (2 * RW, 0.08, 0.2), trim)      # cornice
    # three tall windows in the back wall, night beyond, drapes either side
    drape = kit.mat("#B58A3C", 0.75)
    for wx in (-2.6, 0.0, 2.6):
        kit.box((wx, RD - 0.01, 1.9), (1.2, 0.02, 2.4), kit.mat("#0E1726", 0.1, emit="#1A2A44", strength=0.25))
        kit.box((wx, RD - 0.04, 1.9), (0.04, 0.05, 2.4), trim)
        kit.box((wx, RD - 0.04, 1.9), (1.2, 0.05, 0.04), trim)
        for side in (-1, 1):
            kit.box((wx + side * 0.75, RD - 0.18, 1.95), (0.34, 0.14, 2.9), drape, bevel=0.05)
    kit.world("#05070B", 1.0)


def desk(x=0.0, y=3.4):
    wood = kit.mat("#4A2E1C", 0.35, coat=0.6)
    kit.box((x, y, 0.76), (2.2, 1.1, 0.06), wood, bevel=0.01)
    kit.box((x, y + 0.1, 0.38), (2.1, 0.9, 0.74), wood, bevel=0.02)
    for px in (-0.7, 0.0, 0.7):
        kit.box((x + px, y - 0.36, 0.38), (0.6, 0.02, 0.6), kit.mat("#3B2416", 0.4, coat=0.4), bevel=0.01)
    kit.box((x, y - 0.1, 0.795), (1.6, 0.7, 0.004), kit.mat("#2D3B2A", 0.7))      # blotter


def tv(plate, crop, x, y, width=1.4, z=1.55, yaw=0.0):
    kit.box((x, y + 0.05, 0.45), (1.8, 0.45, 0.9), kit.mat("#3B2416", 0.4, coat=0.4), bevel=0.02, rot=(0, 0, math.radians(yaw)))
    face, _ = kit.screen("tv", (x, y, z), width, plate, crop=crop, rot=(math.radians(90), 0, math.radians(yaw)), strength=1.3,
                         depth=0.05, border=0.02, bezel="#0D0E10")
    return face


def order_paper(at, rot_z=0.0):
    x, y, z = at
    kit.box((x, y, z + 0.004), (0.25, 0.33, 0.003), kit.mat("#1E2C4E", 0.5), rot=(0, 0, rot_z))          # the folder
    kit.box((x + 0.01, y, z + 0.007), (0.216, 0.29, 0.0012), kit.mat("#F4F0E6", 0.7), rot=(0, 0, rot_z))  # the page
    flat = (0, 0, rot_z)
    ink = kit.mat("#1C1C1C", 0.6)
    lines = [("EXECUTIVE ORDER 7-A", 0.11, 0.0095, kit.FONT_SERIF), ("Suspension of All Deployed", 0.08, 0.0125, kit.FONT_SERIF),
             ("Artificial Intelligence Agents", 0.063, 0.0125, kit.FONT_SERIF)]
    c, s = math.cos(rot_z), math.sin(rot_z)
    for body, dy, size, font in lines:
        kit.text(body, (x + 0.01 - dy * s, y + dy * c, z + 0.0085), size, ink, font=font, rot=flat)
    for k in range(9):   # body text as grey rules
        dy = 0.03 - k * 0.014
        kit.box((x + 0.01 - dy * s, y + dy * c, z + 0.0082), (0.17 if k % 4 != 3 else 0.11, 0.0022, 0.0003), kit.mat("#8A8780", 0.7), rot=flat)
    # the signature, a quick scrawl
    import bmesh
    bm = bmesh.new()
    pts = [(-0.05 + t * 0.1, -0.1 + 0.012 * math.sin(t * 19) + 0.006 * math.sin(t * 43), 0) for t in [i / 40 for i in range(41)]]
    verts = [bm.verts.new(p) for p in pts]
    for a, b in zip(verts, verts[1:]):
        bm.edges.new((a, b))
    me = bpy.data.meshes.new("sig")
    bm.to_mesh(me)
    sig = bpy.data.objects.new("sig", me)
    bpy.context.scene.collection.objects.link(sig)
    sig.location = (x + 0.02, y, z + 0.0086)
    sig.rotation_euler = flat
    skin = sig.modifiers.new("w", "SKIN")
    for v in me.skin_vertices[0].data:
        v.radius = (0.0009, 0.0003)
    sig.data.materials.append(ink)


def shot_mis_order():
    office()
    desk()
    face = tv("mis-order", (40, 70, 1200, 675), 2.2, 5.9, width=1.5, yaw=-18)
    order_paper((-0.25, 3.2, 0.797), rot_z=math.radians(8))
    kit.cyl((0.02, 3.18, 0.805), 0.006, 0.14, kit.mat("#111", 0.3, 0.6), rot=(0, math.radians(90), math.radians(30)))   # the pen
    # the desk phone, receiver off the hook
    kit.box((0.62, 3.45, 0.83), (0.2, 0.24, 0.06), kit.mat("#16171A", 0.4), bevel=0.01)
    kit.box((0.5, 3.15, 0.815), (0.22, 0.05, 0.035), kit.mat("#16171A", 0.4), bevel=0.012, rot=(0, 0, 0.4))
    # a brass banker's lamp with a green glass shade
    brass = kit.mat("#B8913F", 0.25, 1.0)
    kit.cyl((-0.8, 3.62, 0.81), 0.08, 0.025, brass)
    kit.cyl((-0.8, 3.62, 0.95), 0.012, 0.28, brass)
    kit.box((-0.8, 3.55, 1.1), (0.3, 0.13, 0.07), kit.mat("#1F5A3A", 0.15, emit="#2F8A56", strength=0.4), bevel=0.03)
    kit.spot((-0.8, 3.5, 1.06), (-0.3, 3.2, 0.8), 30, kit.kelvin(2600), angle=80, blend=0.8)
    kit.point((2.2, 5.3, 1.5), 3, kit.kelvin(7000), radius=0.4)       # the TV's glow on the room
    kit.area((0, 1.0, 3.0), (0, 4, 0), (3, 2), 25, kit.kelvin(3200))   # a low fill from the corridor lamps
    kit.haze((0, RD / 2, RH / 2), (2 * RW - 0.1, RD - 0.1, RH - 0.1), 0.006)
    kit.camera((-1.1, 1.6, 1.55), (0.75, 4.9, 0.95), lens=30, fstop=5.6, focus=face)


# ------------------------------------------------------------------ shared props
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


def nameplate(body, at, yaw=0.0, width=0.4, colour="#F4F0E6", ink="#1C1C1C", size=0.042, font=kit.FONT_SERIF):
    """A folded tent card printed on both sides; yaw 0 shows the front to -y."""
    x, y, z = at
    card, ink = kit.mat(colour, 0.6), kit.mat(ink, 0.6)
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    for side in (1, -1):
        tilt = math.radians(90 - 14) * side
        ox, oy = -s * 0.018 * side, c * 0.018 * side
        rot = (math.radians(90) - side * math.radians(14), 0, math.radians(yaw) + (0 if side > 0 else math.pi))
        kit.plane((x - ox, y - oy, z + 0.055), (width, 0.115), card, rot=rot)
        kit.text(body, (x - ox * 1.25, y - oy * 1.25, z + 0.055), size, ink, font=font, rot=rot)


def mic(at, toward, h=0.34):
    """A gooseneck microphone on a small base, its head leaning toward a point."""
    x, y, z = at
    black = kit.mat("#141414", 0.35, 0.4)
    kit.cyl((x, y, z + 0.012), 0.05, 0.024, black)
    dx, dy = toward[0] - x, toward[1] - y
    yaw = math.atan2(-dx, dy)
    kit.cyl((x - 0.06 * math.sin(yaw), y + 0.06 * math.cos(yaw), z + h / 2), 0.006, h, black, rot=(math.radians(20), 0, yaw), verts=8)
    kit.cyl((x - 0.12 * math.sin(yaw), y + 0.12 * math.cos(yaw), z + h * 0.97), 0.016, 0.07, kit.mat("#0B0B0B", 0.9),
            rot=(math.radians(70), 0, yaw), verts=12)


def from_behind(root, pose="sit", height=1.75, hair="#2A211C"):
    """A person seen from close behind: cover the nape so the head reads as hair, not a face under a cap."""
    k = height / 1.75
    z = (1.19 if pose == "sit" else 1.63) * k
    hb = kit.sphere((0, -0.03 * k, z - 0.035 * k), 0.098 * k, kit.mat(hair, 0.7), scale=(0.96, 0.92, 1.0))
    hb.parent = root
    return root


def board_text(lines, centre, yaw, material):
    """Lines [(text, dz, size, font)] printed on a board facing -y turned by yaw degrees."""
    x, y, z = centre
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    for body, dz, size, font in lines:
        kit.text(body, (x + 0.004 * s, y - 0.004 * c, z + dz), size, material, font=font, rot=(math.radians(90), 0, math.radians(yaw)))


# ------------------------------------------------------------------ the hearing room
HW, HD, HH = 8.0, 16.0, 5.4     # half-width, depth (the dais stands at the back), height
DAIS = 11.3                     # the front of the dais


def hearing_room():
    panel = kit.tex("dark_paneled_wood", 0.6, name="hpanel")
    plaster = kit.mat("#D8CDB8", 0.85)
    trim = kit.mat("#EFE6D2", 0.6)
    kit.box((0, HD / 2, -0.05), (2 * HW, HD, 0.1), kit.mat("#27314A", 0.95))          # blue carpet
    kit.box((0, HD / 2, HH + 0.05), (2 * HW, HD, 0.1), kit.mat("#E9E1CF", 0.9))
    for side in (-1, 1):
        kit.box((side * (HW + 0.05), HD / 2, HH / 2), (0.1, HD, HH), plaster)
        kit.box((side * (HW - 0.03), HD / 2, 1.3), (0.06, HD, 2.6), panel)
        kit.box((side * (HW - 0.07), HD / 2, 2.63), (0.1, HD, 0.08), trim)
    kit.box((0, -0.05, HH / 2), (2 * HW, 0.1, HH), plaster)
    kit.box((0, 0.03, 1.3), (2 * HW, 0.06, 2.6), panel)
    kit.box((0, HD + 0.05, HH / 2), (2 * HW, 0.1, HH), plaster)
    kit.box((0, HD - 0.04, 1.7), (2 * HW, 0.06, 3.4), panel)
    kit.box((0, HD - 0.08, 3.42), (2 * HW, 0.1, 0.08), trim)
    for x in (-6.4, -3.1, 3.1, 6.4):
        kit.box((x, HD - 0.12, HH / 2), (0.46, 0.16, HH), trim)
    # a tall navy drape behind the chair's seat, pleated
    drape = kit.tex("velour_velvet", 1.2, tint="#23315C", name="drape")
    for k in range(-13, 14):
        kit.cyl((k * 0.2, HD - 0.3, 2.75), 0.12, 5.3, drape, verts=12)
    # coffered ceiling with recessed panels
    beams = [((0, y, HH - 0.12), (2 * HW, 0.3, 0.24)) for y in (2, 5, 8, 11, 14)]
    beams += [((x, HD / 2, HH - 0.12), (0.3, HD, 0.24)) for x in (-4, 0, 4)]
    boxes("coffers", beams, trim)
    for y in (3.5, 6.5, 9.5, 12.5):
        for x in (-6, -2, 2, 6):
            kit.box((x, y, HH - 0.01), (1.6, 1.4, 0.02), kit.emission("#FFF1DC", 4 if y < 8 else 0.6))
    kit.world("#06070A", 1.0)


def dais(names=("MR. HALE", "MS. ORTIZ", "MR. BRANDT", "MS. OKAFOR", "THE CHAIR", "MR. WEI", "MS. LANG", "MR. DUVAL", "MS. RUIZ"),
         seated=True, lamp=None):
    """The raised bench across the back: a panelled front, a glossy ledge with nameplates and microphones, and the
    members in high-backed chairs behind it."""
    panel = kit.tex("dark_paneled_wood", 0.6, name="hpanel2")
    ledge = kit.mat("#3A2415", 0.25, coat=0.7)
    leather = kit.mat("#3A1F1A", 0.45)
    kit.box((0, DAIS + 1.9, 0.25), (15.8, 3.8, 0.5), kit.mat("#27314A", 0.95))
    kit.box((0, DAIS, 0.62), (11.0, 0.12, 1.24), panel)
    kit.box((0, DAIS + 0.3, 1.26), (11.2, 0.72, 0.05), ledge, bevel=0.01)
    for side in (-1, 1):   # the wings angle toward the witness
        a = math.radians(28) * side
        cx, cy = side * 7.0, DAIS - 0.55
        kit.box((cx, cy, 0.62), (3.2, 0.12, 1.24), panel, rot=(0, 0, a))
        kit.box((cx - side * 0.12, cy + 0.3, 1.26), (3.3, 0.72, 0.05), ledge, rot=(0, 0, a), bevel=0.01)
    n = len(names)
    for i, body in enumerate(names):
        x = (i - (n - 1) / 2) * 1.2
        nameplate(body, (x, DAIS + 0.12, 1.285), width=0.42, colour="#EDE6D6", size=0.04)
        mic((x + 0.18, DAIS + 0.3, 1.285), (x, DAIS + 1.0))
        kit.box((x, DAIS + 1.25, 1.55), (0.62, 0.14, 1.1), leather, bevel=0.05)       # the high chair back
        if seated:
            P.person((x, DAIS + 0.95, 0.5), facing=180, pose="sit", height=1.74, coat=["#23262C", "#2E2A2C", "#1F2533"][i % 3],
                     hair=["#8C8C8C", "#2A211C", "#6B5A48", "#141212"][i % 4], seed=70 + i)


def witness_table(label="KESTREL LABS", chairs=(-0.6, 0.6), y=6.8):
    """The witness table facing the dais: green baize to the floor, microphones, a nameplate, water."""
    kit.box((0, y, 0.765), (3.6, 0.95, 0.05), kit.mat("#3A2415", 0.3, coat=0.5), bevel=0.01)
    kit.box((0, y, 0.37), (3.62, 0.97, 0.74), kit.mat("#1E3A2F", 0.95))
    nameplate(label, (0, y + 0.3, 0.79), yaw=180, width=0.56, size=0.05, font=kit.FONT)
    for x in chairs:
        mic((x + 0.15, y + 0.2, 0.79), (x, y - 0.8))
        kit.cyl((x + 0.35, y + 0.05, 0.84), 0.035, 0.1, kit.glass(0.02, name="water"))
        kit.place("dining_chair_02", (x, y - 0.75, 0), rot_z=0)
    kit.cyl((1.4, y + 0.1, 0.88), 0.07, 0.2, kit.glass(0.02, name="pitcher"), r2=0.055)


def gallery(rows=(5.0, 4.1, 3.2, 2.3, 1.4), skip=(), seed=3, stand=()):
    """The public seats behind the witness table: rows of chairs and people, as batched meshes."""
    rng = random.Random(seed)
    seats, pts = [], []
    for r, y in enumerate(rows):
        for k in range(12):
            x = -6.1 + k * 1.1 + (0.6 if k >= 6 else 0) - 0.3
            seats += [((x, y, 0.45), (0.5, 0.48, 0.07)), ((x, y - 0.24, 0.8), (0.5, 0.06, 0.6))]
            if (r, k) not in skip and rng.random() < 0.85:
                pts.append((x + rng.uniform(-0.04, 0.04), y + 0.02, 0.48, rng.uniform(-8, 8), "sit"))
    boxes("gallery-seats", seats, kit.mat("#4A2D22", 0.5))
    for x, y, f in stand:
        pts.append((x, y, 0.0, f, "stand"))
    return P.silhouettes(pts, seed=seed, name="gallery")


def easel(at, yaw, lines, size=(1.0, 0.76)):
    """A foam board on an easel, the kind members prop up to read from."""
    x, y, z = at
    wood = kit.mat("#6B4B33", 0.6)
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
    for dx in (-0.35, 0.35):
        kit.box((x + dx * c, y + dx * s, 0.8), (0.035, 0.035, 1.75), wood, rot=(math.radians(-8), 0, math.radians(yaw)))
    kit.box((x + 0.2 * s, y - 0.2 * c + 0.28, 0.7), (0.035, 0.035, 1.5), wood, rot=(math.radians(20), 0, math.radians(yaw)))
    kit.box((x - 0.02 * s, y + 0.02 * c, z - size[1] / 2 - 0.03), (size[0] * 0.9, 0.08, 0.03), wood, rot=(0, 0, math.radians(yaw)))
    kit.box((x, y, z), (size[0], 0.012, size[1]), kit.mat("#F7F3EA", 0.7), rot=(0, 0, math.radians(yaw)))
    board_text(lines, (x - 0.01 * s, y - 0.01 * c, z), yaw, kit.mat("#1E1C1C", 0.6))


def hearing_lights(key=1.0):
    """Warm ceiling panels, and the bench lit from behind and above so the members read as silhouettes."""
    for y in (3.5, 6.5):
        kit.area((0, y, HH - 0.05), (0, y, 0), (13, 1.4), 220 * key, kit.kelvin(3400))
    kit.area((0, DAIS + 2.6, HH - 0.3), (0, DAIS + 0.4, 1.2), (10, 1.0), 900 * key, kit.kelvin(3800))    # rim on the members
    kit.area((0, 7.0, 4.8), (0, DAIS, 1.2), (6, 1.0), 40 * key, kit.kelvin(4300))                       # a soft TV fill
    kit.spot((0, HD - 4, HH - 0.2), (0, HD - 0.3, 2.2), 2600 * key, kit.kelvin(3000), angle=80, blend=0.9)  # the drape behind them


def shot_rb_hearing():
    """boardRemoved 4, Month 2: from behind the new CEO at the witness table. The members sit high on the bench; on the
    easel beside it, the founder's pledge blown up for the cameras; on the wall screen, the hearing live."""
    hearing_room()
    dais()
    witness_table()
    gallery(skip=((0, 5), (0, 6)))
    # the new CEO, alone at the table, and an aide at the end
    from_behind(P.person((0.6, 6.1, 0.0), facing=0, pose="sit", height=1.78, coat="#1D2230", hair="#3A2C22", seed=11), height=1.78, hair="#3A2C22")
    from_behind(P.person((-0.6, 6.1, 0.0), facing=8, pose="sit", height=1.66, coat="#2B2F36", hair="#141212", seed=12, hold="paper"),
                height=1.66, hair="#141212")
    easel((2.9, DAIS - 1.9, 1.62), -8, [
        ("\u201cWe will spend 20% of our", 0.2, 0.075, kit.FONT_SERIF), ("compute on safety, whatever", 0.1, 0.075, kit.FONT_SERIF),
        ("our rivals do.\u201d", 0.0, 0.075, kit.FONT_SERIF), ("KESTREL LABS PLEDGE \u00b7 SIGNED BY ITS FOUNDER", -0.2, 0.034, kit.FONT)])
    kit.box((5.2, HD - 0.3, 3.9), (0.1, 0.3, 0.1), kit.mat("#222", 0.4))
    face, _ = kit.screen("wall", (4.8, HD - 0.5, 3.9), 3.0, "rb-hearing", crop=(56, 4, 1168, 657), strength=1.2,
                         rot=(math.radians(90), 0, math.radians(-10)), depth=0.06, border=0.03, bezel="#0D0E10")
    hearing_lights()
    kit.spot((1.0, 7.5, 3.8), (2.9, DAIS - 1.9, 1.6), 260, kit.kelvin(4500), angle=25, blend=0.6)        # a press lamp on the pledge
    kit.camera((-1.2, 2.3, 1.75), (2.3, DAIS + 1.5, 2.15), lens=45, fstop=4.0, focus=(2.9, DAIS - 1.9, 1.6))

kit.run({"mis-order": shot_mis_order, "rb-hearing": shot_rb_hearing})
