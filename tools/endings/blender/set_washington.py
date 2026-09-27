"""Washington: three rooms. The President's office (a heavy desk, tall windows with drapes, a television), the press
briefing room (blue seats facing a low stage, a navy backdrop with two screens either side of a plain podium, a
camera riser at the back) and a congressional hearing room (a raised panelled bench under a navy drape, a witness
table in green baize, the public gallery behind). No real seal or logo anywhere. Shots:

  mis-order    Catastrophic misalignment, Day 11: the signed executive order to suspend every AI agent lies on the
               desk; on the television behind it the request system shows the order RESOLVED, closed automatically.
  al-news      Aligned, Month 2, night: from behind the President's chair, the draft water report on his desk marked
               HOLD with its findings struck through in red; across the room the television shows it published.
  rb-hearing   Removed by the board, Month 2: from the gallery, the new CEO alone at the witness table; the
               founder's pledge blown up on an easel by the bench; the hearing live on the wall screen.
  mu-hearing   Catastrophic misuse, Day 3: an emergency session; the members vote with raised hands, your lab's
               witness chairs stand empty under a hard light, the exhibit monitor carries the President's order.
  ov-news      Overtaken, Month 1: from the reporters' seats, the President at the podium beside the screen that
               names OpenBrain the national champion.
  cw-hearing   A costly win, Month 4: over the bench, a laptop running the model sits at the witness's place with
               every microphone bent toward it; the feed monitor shows the chair's question.
  qt-briefing  A quiet takeover, Month 6, afternoon: a signing in the office staged for television; the crew's monitor
               in front shows the bill the model drafted, TV lights and aides behind.
  rd-news      Someone else's disaster, Day 3: the reverse angle from behind the podium, the President facing a full
               room; the monitor over the camera riser shows 40,000 copies of OpenBrain's agent.
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


def office(day=False):
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
        kit.box((wx, RD - 0.01, 1.9), (1.2, 0.02, 2.4), kit.emission("#E4EEF6", 7) if day else
                kit.mat("#0E1726", 0.1, emit="#1A2A44", strength=0.25))
        kit.box((wx, RD - 0.04, 1.9), (0.04, 0.05, 2.4), trim)
        kit.box((wx, RD - 0.04, 1.9), (1.2, 0.05, 0.04), trim)
        for side in (-1, 1):
            kit.box((wx + side * 0.75, RD - 0.18, 1.95), (0.34, 0.14, 2.9), drape, bevel=0.05)
        if day:   # daylight pouring in through each window
            kit.area((wx, RD - 0.3, 1.9), (wx, 2.0, 0.6), (1.2, 2.4), 90, kit.kelvin(6800))
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


def bankers_lamp(at):
    """A brass banker's lamp with a green glass shade."""
    x, y, z = at
    brass = kit.mat("#B8913F", 0.25, 1.0)
    kit.cyl((x, y, z + 0.013), 0.08, 0.025, brass)
    kit.cyl((x, y, z + 0.153), 0.012, 0.28, brass)
    kit.box((x, y - 0.07, z + 0.303), (0.3, 0.13, 0.07), kit.mat("#1F5A3A", 0.15, emit="#2F8A56", strength=0.4), bevel=0.03)


def shot_mis_order():
    office()
    desk()
    face = tv("mis-order", (40, 70, 1200, 675), 2.2, 5.9, width=1.5, yaw=-18)
    order_paper((-0.25, 3.2, 0.797), rot_z=math.radians(8))
    kit.cyl((0.02, 3.18, 0.805), 0.006, 0.14, kit.mat("#111", 0.3, 0.6), rot=(0, math.radians(90), math.radians(30)))   # the pen
    # the desk phone, receiver off the hook
    kit.box((0.62, 3.45, 0.83), (0.2, 0.24, 0.06), kit.mat("#16171A", 0.4), bevel=0.01)
    kit.box((0.5, 3.15, 0.815), (0.22, 0.05, 0.035), kit.mat("#16171A", 0.4), bevel=0.012, rot=(0, 0, 0.4))
    bankers_lamp((-0.8, 3.62, 0.797))
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
        ox, oy = -s * 0.018 * side, c * 0.018 * side
        rot = (math.radians(76), 0, math.radians(yaw) + (0 if side > 0 else math.pi))
        kit.plane((x - ox, y - oy, z + 0.055), (width, 0.115), card, rot=rot)
        kit.text(body, (x - ox * 1.25, y - oy * 1.25, z + 0.055), size, ink, font=font, rot=rot)


def mic(at, toward, h=0.34):
    """A gooseneck microphone on a small base, its head leaning toward a point."""
    x, y, z = at
    black = kit.mat("#141414", 0.35, 0.4)
    kit.cyl((x, y, z + 0.012), 0.05, 0.024, black)
    dx, dy = toward[0] - x, toward[1] - y
    yaw = math.atan2(-dx, dy)
    kit.cyl((x - 0.06 * math.sin(yaw), y + 0.06 * math.cos(yaw), z + h / 2), 0.006, h, black, rot=(math.radians(-20), 0, yaw), verts=8)
    kit.cyl((x - 0.12 * math.sin(yaw), y + 0.12 * math.cos(yaw), z + h * 0.97), 0.016, 0.07, kit.mat("#0B0B0B", 0.9),
            rot=(math.radians(-70), 0, yaw), verts=12)


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
         seated=True, backs=True):
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
        if backs:
            kit.box((x, DAIS + 1.25, 1.55), (0.62, 0.14, 1.1), leather, bevel=0.05)       # the high chair back
    if seated:
        P.silhouettes([((i - (n - 1) / 2) * 1.2, DAIS + 0.95, 1.0, 180, "sit") for i in range(n)], seed=70, name="members")


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


def hearing_lights(key=1.0, warm=3400):
    """Warm ceiling light, and the bench lit from behind and above so the members read as silhouettes against the
    lit drape."""
    for y in (3.5, 6.5):
        kit.area((0, y, HH - 0.05), (0, y, 0), (12, 1.4), 80 * key, kit.kelvin(warm))
    kit.area((0, DAIS + 2.6, HH - 0.3), (0, DAIS + 0.4, 1.2), (10, 1.0), 700 * key, kit.kelvin(warm + 400))   # rim on the members
    kit.spot((0, HD - 4, HH - 0.2), (0, HD - 0.3, 2.3), 5000 * key, kit.kelvin(warm - 400), angle=75, blend=0.9)   # the drape


def shot_rb_hearing():
    """boardRemoved 4, Month 2: from the gallery, behind the new CEO alone at the witness table. On an easel beside
    the bench, the founder's pledge blown up for the cameras; on the wall screen, the hearing live."""
    hearing_room()
    dais()
    witness_table()
    gallery(rows=(5.0, 4.1, 3.2), skip=((0, 5), (0, 6), (0, 4)))
    ceo = P.person((0.6, 6.1, 0.0), facing=0, pose="sit", height=1.78, coat="#1D2230", hair="#3A2C22", seed=11)
    P.hair_back(ceo, 1.78, "sit", "#3A2C22")
    aide = P.person((-0.6, 6.1, 0.0), facing=8, pose="sit", height=1.66, coat="#2B2F36", hair="#141212", seed=12, hold="paper")
    P.hair_back(aide, 1.66, "sit", "#141212")
    easel((2.9, DAIS - 1.9, 1.62), -8, [
        ("“We will spend 20% of our", 0.2, 0.075, kit.FONT_SERIF), ("compute on safety, whatever", 0.1, 0.075, kit.FONT_SERIF),
        ("our rivals do.”", 0.0, 0.075, kit.FONT_SERIF), ("KESTREL LABS PLEDGE · SIGNED BY ITS FOUNDER", -0.2, 0.034, kit.FONT)])
    kit.spot((1.2, 7.5, 4.6), (2.9, DAIS - 1.9, 1.62), 260, kit.kelvin(4500), angle=18, blend=0.6)     # a press lamp on the board
    kit.box((5.2, HD - 0.3, 3.75), (0.1, 0.3, 0.1), kit.mat("#222", 0.4))
    face, _ = kit.screen("wall", (4.8, HD - 0.5, 3.7), 3.0, "rb-hearing", crop=(56, 4, 1168, 657), strength=1.2,
                         rot=(math.radians(90), 0, math.radians(-18)), depth=0.06, border=0.03, bezel="#0D0E10")
    hearing_lights()
    kit.camera((-1.2, 2.3, 1.75), (2.3, DAIS + 1.5, 2.1), lens=45, fstop=4.0, focus=(2.9, DAIS - 1.9, 1.6))


def shot_mu_hearing():
    """misuse 6, Day 3: an emergency session. The members vote with raised hands; your lab's witness chairs stand
    empty under a hard light; the exhibit monitor in the well carries the President's order."""
    hearing_room()
    dais(seated=False)
    members = [((i - 4) * 1.2, DAIS + 0.95, 0.5 + 0.5, 180, "sit", "hand" if i not in (2, 7) else None) for i in range(9)]
    P.silhouettes(members, seed=21, name="members")
    witness_table(label="KESTREL LABS")
    kit.box((0.35, 6.75, 0.795), (0.24, 0.32, 0.01), kit.mat("#8A2E22", 0.5), rot=(0, 0, 0.12))      # the order, in its red folder
    gallery(rows=(5.0, 4.1, 3.2), seed=5, stand=[(-5.5, 1.2, 10), (-4.6, 1.0, -5), (4.9, 1.1, 4), (5.8, 1.3, -12)])
    # the exhibit monitor on a floor stand in the well, turned to the gallery
    kit.cyl((-2.7, 8.6, 0.6), 0.04, 1.2, kit.mat("#1A1A1C", 0.4, 0.6))
    kit.cyl((-2.7, 8.6, 0.02), 0.35, 0.04, kit.mat("#1A1A1C", 0.4, 0.6))
    face, _ = kit.screen("monitor", (-2.7, 8.55, 1.9), 2.0, "mu-hearing", crop=(56, 4, 1168, 657), strength=1.25,
                         rot=(math.radians(90), 0, math.radians(30)), depth=0.07, border=0.03, bezel="#0D0E10")
    hearing_lights(key=0.4, warm=4600)
    kit.spot((0.4, 5.4, HH - 0.2), (0, 6.5, 0.4), 2200, kit.kelvin(5600), angle=22, blend=0.25)       # the hard light on the empty chairs
    kit.camera((1.4, 1.6, 2.1), (-0.9, 10.0, 1.5), lens=35, fstop=5.6, focus=face)


def laptop(at, yaw=180.0, width=0.32):
    """An open laptop on a table, its screen running the model: a dark window with its name and a listening cursor."""
    x, y, z = at
    body = kit.mat("#8E9398", 0.3, 0.7)
    r = math.radians(yaw)
    c, s = math.cos(r), math.sin(r)
    kit.box((x, y, z + 0.009), (width, width * 0.7, 0.018), body, bevel=0.004, rot=(0, 0, r))
    h = width * 0.64
    tilt = math.radians(15)
    back = width * 0.35
    lx, ly = x - s * back, y + c * back       # the hinge, along the laptop's own +y
    cy = h / 2 * math.sin(tilt)
    cx_, cy_ = lx - s * cy, ly + c * cy
    cz = z + 0.02 + h / 2 * math.cos(tilt)
    rot = (math.radians(90) - tilt, 0, r)
    kit.box((cx_, cy_, cz), (width, h, 0.007), body, rot=rot)
    glow = kit.plane((cx_ + s * 0.005, cy_ - c * 0.005, cz), (width * 0.92, h * 0.88), kit.emission("#0F1B2A", 1.0), rot=rot)
    ink = kit.mat("#DCE8F5", 0.5, emit="#DCE8F5", strength=3)
    kit.text("KESTREL 5", (cx_ + s * 0.007, cy_ - c * 0.007, cz + 0.03), 0.026, ink, font=kit.FONT, rot=rot)
    kit.text("listening", (cx_ + s * 0.007, cy_ - c * 0.007, cz - 0.015), 0.013, kit.mat("#7FA6C9", 0.5, emit="#7FA6C9", strength=2),
             font=kit.FONT_SANS, rot=rot)
    kit.point((x + s * 0.3, y - c * 0.3, z + 0.2), 2.5, kit.kelvin(9000), radius=0.1)
    return glow


def shot_cw_hearing():
    """pyrrhic 7, Month 4: the reverse angle, over the chair's shoulder on the bench. Down at the witness table, where
    a person should sit, a laptop running the model, every microphone bent toward it; the feed monitor in the well
    shows the chair's question."""
    hearing_room()
    dais(seated=False, backs=False)
    # the witness table: the laptop at the witness's place, microphones gathered round it, the chair pushed back
    kit.box((0, 6.8, 0.765), (3.6, 0.95, 0.05), kit.mat("#3A2415", 0.3, coat=0.5), bevel=0.01)
    kit.box((0, 6.8, 0.37), (3.62, 0.97, 0.74), kit.mat("#1E3A2F", 0.95))
    laptop((0.0, 6.75, 0.79), yaw=180)
    nameplate("KESTREL 5", (0, 7.2, 0.79), width=0.5, size=0.05, font=kit.FONT)
    for mx in (-0.28, -0.12, 0.14, 0.3):
        mic((mx, 7.05, 0.79), (0, 6.75), h=0.3)
    kit.place("dining_chair_02", (0.0, 5.85, 0), rot_z=math.radians(12))
    gallery(rows=(5.0, 4.1, 3.2, 2.3, 1.4), seed=8)
    # the feed monitor in the well, turned to the bench
    kit.cyl((-1.15, 7.75, 0.55), 0.035, 1.1, kit.mat("#1A1A1C", 0.4, 0.6))
    kit.cyl((-1.15, 7.75, 0.02), 0.3, 0.04, kit.mat("#1A1A1C", 0.4, 0.6))
    face, _ = kit.screen("monitor", (-1.15, 7.8, 1.4), 1.0, "cw-hearing", crop=(56, 4, 1168, 657), strength=1.25,
                         rot=(math.radians(90), 0, math.radians(159)), depth=0.06, border=0.025, bezel="#0D0E10")
    hearing_lights(key=0.8)
    kit.area((0, 3.0, 3.6), (0, 6.8, 0.8), (4, 1), 120, kit.kelvin(4200))       # the press lights on the witness table
    kit.camera((0.5, DAIS + 1.4, 2.05), (-0.5, 7.1, 1.05), lens=66, fstop=4.0, focus=(-0.55, 7.3, 1.1))


# ------------------------------------------------------------------ the press briefing room
BW, BD, BH = 5.6, 13.0, 4.0     # half-width, depth (the backdrop at y=BD), height
STAGE = 10.3                    # the front edge of the low stage


def briefing_room():
    """Rows of blue seats facing a low stage, a navy backdrop with two screens either side of the podium, and a
    camera riser at the back."""
    wall = kit.mat("#D9D2C4", 0.85)
    kit.box((0, BD / 2, -0.05), (2 * BW, BD, 0.1), kit.mat("#2A2F3F", 0.95))
    kit.box((0, BD / 2, BH + 0.05), (2 * BW, BD, 0.1), kit.mat("#E6E2DA", 0.9))
    for side in (-1, 1):
        kit.box((side * (BW + 0.05), BD / 2, BH / 2), (0.1, BD, BH), wall)
        kit.box((side * (BW - 0.02), BD / 2, 0.5), (0.04, BD, 1.0), kit.mat("#3B2A20", 0.5))
    kit.box((0, -0.05, BH / 2), (2 * BW, 0.1, BH), wall)
    kit.box((0, STAGE + (BD - STAGE) / 2, 0.12), (2 * BW, BD - STAGE, 0.24), kit.mat("#1F2742", 0.9))
    # the backdrop: navy fabric panels in a warm wood frame, a darker panel behind the podium
    navy = kit.tex("velour_velvet", 1.5, tint="#1C2A52", name="backdrop")
    kit.box((0, BD + 0.02, BH / 2), (2 * BW, 0.04, BH), navy)
    for x in (-3.9, -1.3, 1.3, 3.9):
        kit.box((x, BD - 0.03, BH / 2), (0.12, 0.08, BH), kit.mat("#8A6A45", 0.4, coat=0.4))
    kit.box((0, BD - 0.02, 2.3), (2.4, 0.02, 2.6), kit.mat("#141C38", 0.8))
    kit.box((0, BD - 0.05, 3.62), (2 * BW, 0.08, 0.1), kit.mat("#8A6A45", 0.4, coat=0.4))
    # rows of seats, two blocks either side of a centre aisle
    seats = []
    for r in range(7):
        y = 8.6 - r * 1.0
        for k in range(8):
            x = 0.75 + (k % 4) * 0.62 if k < 4 else -(0.75 + (k % 4) * 0.62)
            seats += [((x, y, 0.44), (0.5, 0.48, 0.07)), ((x, y - 0.25, 0.78), (0.5, 0.06, 0.6))]
    boxes("seats", seats, kit.mat("#27407A", 0.6))
    # the camera riser at the back
    kit.box((0, 1.1, 0.3), (2 * BW, 2.2, 0.6), kit.mat("#202226", 0.8))
    kit.world("#05060A", 1.0)


def podium(at=(0.0, STAGE + 0.9)):
    x, y = at
    wood = kit.mat("#5A3B24", 0.3, coat=0.6)
    kit.box((x, y, 0.24 + 0.58), (0.72, 0.5, 1.16), wood, bevel=0.02)
    kit.box((x, y - 0.26, 0.24 + 0.55), (0.6, 0.02, 0.9), kit.mat("#1C2A52", 0.7))
    kit.cyl((x, y - 0.275, 0.24 + 0.68), 0.14, 0.012, kit.mat("#B8913F", 0.3, 1.0), rot=(math.radians(90), 0, 0))   # a blank brass disc
    kit.box((x, y - 0.05, 0.24 + 1.19), (0.76, 0.46, 0.04), wood, rot=(math.radians(-10), 0, 0))
    for dx in (-0.12, 0.12):
        kit.cyl((x + dx, y - 0.1, 0.24 + 1.36), 0.005, 0.32, kit.mat("#141414", 0.3, 0.5), rot=(math.radians(-25), 0, dx * -2))


def tv_camera(at, yaw, z=0.6):
    """A broadcast camera on a tripod, looking along yaw (0 = +y)."""
    x, y = at
    black, metal = kit.mat("#16171A", 0.4), kit.mat("#5A5D62", 0.35, 0.8)
    for k in range(3):
        a = math.radians(yaw + 60 + k * 120)
        kit.cyl((x + 0.22 * math.cos(a), y + 0.22 * math.sin(a), z + 0.7), 0.014, 1.45, metal, rot=(0.16 * math.sin(a), -0.16 * math.cos(a), 0), verts=8)
    r = math.radians(yaw)
    fx, fy = -math.sin(r), math.cos(r)          # forward
    kit.cyl((x, y, z + 1.43), 0.07, 0.1, metal)                                   # the head
    kit.box((x - 0.05 * fx, y - 0.05 * fy, z + 1.6), (0.14, 0.42, 0.2), black, bevel=0.02, rot=(0, 0, r))
    kit.cyl((x + 0.3 * fx, y + 0.3 * fy, z + 1.58), 0.055, 0.3, black, rot=(math.radians(90), 0, r))
    kit.box((x + 0.47 * fx, y + 0.47 * fy, z + 1.58), (0.16, 0.05, 0.13), black, rot=(0, 0, r))   # the hood
    kit.box((x - 0.12 * fy - 0.05 * fx, y + 0.12 * fx - 0.05 * fy, z + 1.74), (0.05, 0.16, 0.1), black, rot=(0, 0, r))
    kit.cyl((x - 0.42 * fx, y - 0.42 * fy, z + 1.36), 0.012, 0.6, metal, rot=(math.radians(-68), 0, r), verts=8)


def tv_light(at, target, energy=300, z=2.4, size=0.6, colour=5600):
    """A soft panel on a stand, aimed at target; returns the light."""
    x, y = at
    kit.cyl((x, y, z / 2), 0.02, z, kit.mat("#2A2B2E", 0.4, 0.7), verts=8)
    L = kit.area((x, y, z), target, (size, size * 0.7), energy, kit.kelvin(colour))
    panel = kit.box((x, y, z), (size + 0.06, size * 0.7 + 0.06, 0.08), kit.mat("#1C1C1E", 0.5))
    panel.rotation_euler = L.rotation_euler
    face = kit.plane((0, 0, 0), (size, size * 0.7), kit.emission("#FFF6E8", 6))
    face.rotation_euler = L.rotation_euler
    bpy.context.view_layer.update()
    face.location = L.location + L.matrix_world.to_3x3() @ kit.Vector((0, 0, -0.05))
    return L


def briefing_lights():
    for y in (3.0, 6.5):
        kit.area((0, y, BH - 0.05), (0, y, 0), (8, 1.2), 90, kit.kelvin(3600))
    kit.area((0, STAGE - 2.5, BH - 0.1), (0, BD - 0.5, 1.8), (4, 1), 130, kit.kelvin(4800))      # the TV key on the podium
    kit.spot((0, BD - 1.2, BH - 0.1), (0, BD, 2.0), 500, kit.kelvin(3200), angle=80, blend=1.0)  # backdrop wash


def side_screens(plate, crop, live_side=1, other=None):
    """The two screens either side of the podium; the live plate on live_side (1 = stage right, camera left)."""
    faces = {}
    for side in (-1, 1):
        x = 3.2 * side
        if side == live_side:
            faces["live"], _ = kit.screen("tv", (x, BD - 0.12, 2.35), 2.5, plate, crop=crop, strength=1.2, depth=0.06, border=0.03,
                                          bezel="#0B0C0E")
        else:
            h = 2.5 * 657 / 1168
            kit.box((x, BD - 0.1, 2.35), (2.56, 0.06, h + 0.06), kit.mat("#0B0C0E", 0.35))
            kit.plane((x, BD - 0.135, 2.35), (2.5, h), kit.emission("#16254A", 1.0), rot=(math.radians(90), 0, 0))
            if other:
                kit.text(other, (x, BD - 0.14, 2.35), 0.16, kit.mat("#E9E2CF", 0.5, emit="#E9E2CF", strength=2.5), font=kit.FONT, spacing=1.3)
    return faces["live"]


def shot_ov_news():
    """overtaken 2, Month 1: the briefing room from the reporters' seats. The President at the podium; beside him
    the screen names the national champion."""
    briefing_room()
    podium()
    face = side_screens("ov-news", (56, 4, 1168, 657), live_side=1, other="THE PRESIDENT")
    P.person((0.0, STAGE + 1.3, 0.24), facing=228, height=1.9, coat="#1A2030", hair="#D9C27A", build=1.2, seed=90)
    rng = random.Random(4)
    pts = []
    for r in range(7):
        for k in range(8):
            x = 0.75 + (k % 4) * 0.62 if k < 4 else -(0.75 + (k % 4) * 0.62)
            if rng.random() < 0.9:
                pts.append((x, 8.6 - r * 1.0 + 0.03, 0.48, rng.uniform(-10, 10), "sit"))
    P.silhouettes(pts, seed=7, name="press")
    for x in (-2.0, 0.0, 2.2):
        tv_camera((x, 1.2), 0)
    briefing_lights()
    kit.camera((-3.3, 5.2, 1.55), (1.7, BD, 1.95), lens=46, fstop=5.6, focus=face)


def shot_rd_news():
    """rivalDisaster 3, Day 3: the reverse angle, from behind the podium. The President faces a full room of
    reporters, half of them on their feet; the monitor over the camera riser shows what he is being asked about."""
    briefing_room()
    podium((1.45, STAGE + 0.9))
    pres = P.person((1.45, STAGE + 1.3, 0.24), facing=172, height=1.9, coat="#1A2030", hair="#B59E5E", build=1.2, seed=90)
    P.hair_back(pres, 1.9, "stand", "#B59E5E")
    rng = random.Random(9)
    pts = []
    for r in range(7):
        for k in range(8):
            x = 0.75 + (k % 4) * 0.62 if k < 4 else -(0.75 + (k % 4) * 0.62)
            if rng.random() < 0.92:
                standing = rng.random() < 0.45
                pts.append((x, 8.6 - r * 1.0 + (0.15 if standing else 0.03), 0.0 if standing else 0.48, rng.uniform(-12, 12),
                            "stand" if standing else "sit"))
    P.silhouettes(pts, seed=11, name="press")
    for x in (-2.4, -0.2, 2.3):
        tv_camera((x, 1.2), 180)
    for x, z in ((-3.4, 2.9), (3.6, 2.8)):
        tv_light((x, 0.9), (0, STAGE, 1.8), 350, z=z)
    kit.box((1.0, 0.25, 3.0), (0.3, 0.3, 0.1), kit.mat("#222", 0.4))
    face, _ = kit.screen("confidence", (1.0, 0.35, 2.75), 2.8, "rd-news", crop=(56, 4, 1168, 657), strength=1.25,
                         rot=(math.radians(90), 0, math.radians(180)), depth=0.06, border=0.03, bezel="#0B0C0E")
    for y in (3.0, 6.5):
        kit.area((0, y, BH - 0.05), (0, y, 0), (8, 1.2), 40, kit.kelvin(3600))
    kit.camera((0.95, BD - 0.2, 1.9), (1.0, 0.3, 2.2), lens=40, fstop=4.5, focus=face)


# ------------------------------------------------------------------ the office, more shots
def office_front():
    """The wall opposite the windows: bookcases either side of a doorway, a console with a television."""
    shelf = kit.mat("#3B2416", 0.4, coat=0.4)
    rng = random.Random(2)
    books = []
    for bx in (-3.3, 3.3):
        kit.box((bx, 0.2, 1.3), (1.6, 0.36, 2.6), shelf, bevel=0.01)
        for shelf_z in (0.45, 0.95, 1.45, 1.95):
            x = bx - 0.7
            while x < bx + 0.7:
                w = rng.uniform(0.03, 0.06)
                h = rng.uniform(0.25, 0.36)
                books.append(((x + w / 2, 0.36, shelf_z + h / 2), (w, 0.2, h)))
                x += w + 0.004
    boxes("books", books, kit.mat("#6B3A2A", 0.7))
    kit.box((0, 0.06, 1.2), (1.3, 0.1, 2.4), kit.mat("#EFE6D2", 0.5))          # the door, panelled, a brass knob
    for px, pz, ph in ((-0.27, 1.65, 0.8), (0.27, 1.65, 0.8), (-0.27, 0.55, 0.7), (0.27, 0.55, 0.7)):
        kit.box((px, 0.12, pz), (0.42, 0.03, ph), kit.mat("#F2EBDC", 0.45), bevel=0.02)
    kit.sphere((0.5, 0.15, 1.05), 0.03, kit.mat("#B8913F", 0.25, 1.0))
    # a floor lamp in the corner, lit
    kit.cyl((-4.0, 1.2, 0.75), 0.015, 1.5, kit.mat("#B8913F", 0.25, 1.0))
    kit.cyl((-4.0, 1.2, 1.62), 0.22, 0.3, kit.mat("#F1E4C8", 0.6, emit="#FFD9A0", strength=2.5), r2=0.16)
    kit.point((-4.0, 1.2, 1.55), 30, kit.kelvin(2500), radius=0.12)


def report(at, rot_z=0.0):
    """The draft report the White House asked to soften: a bound stack, red ink on the findings, a HOLD stamp."""
    x, y, z = at
    flat = (0, 0, rot_z)
    kit.box((x, y, z + 0.012), (0.23, 0.3, 0.024), kit.mat("#F2EEE4", 0.7), rot=flat)
    kit.box((x - 0.105, y, z + 0.025), (0.018, 0.3, 0.004), kit.mat("#1E2C4E", 0.5), rot=flat)       # the binding
    ink, red = kit.mat("#1C1C1C", 0.6), kit.mat("#B3261E", 0.5)
    c, s = math.cos(rot_z), math.sin(rot_z)

    def at_(dx, dy):
        return (x + dx * c - dy * s, y + dx * s + dy * c, z + 0.0255)
    kit.text("DRINKING WATER, EASTERN DISTRICTS", at_(0.005, 0.11), 0.0085, ink, font=kit.FONT, rot=flat)
    kit.text("Lead above the safe limit", at_(0.005, 0.085), 0.012, ink, font=kit.FONT_SERIF, rot=flat)
    kit.text("in 41 of 260 schools", at_(0.005, 0.068), 0.012, ink, font=kit.FONT_SERIF, rot=flat)
    for k in range(8):
        kit.box(at_(0.005, 0.04 - k * 0.014), (0.17 if k % 3 != 2 else 0.1, 0.0022, 0.0003), kit.mat("#8A8780", 0.7), rot=flat)
    kit.box(at_(-0.02, 0.0765), (0.19, 0.0016, 0.0004), red, rot=flat)          # the findings struck through in red
    kit.text("soften", at_(0.07, 0.052), 0.011, red, font=kit.FONT_SERIF, rot=(0, 0, rot_z + 0.2))
    kit.box(at_(0.04, -0.1), (0.1, 0.036, 0.0004), red, rot=(0, 0, rot_z - 0.15))
    kit.text("HOLD", at_(0.04, -0.1), 0.02, kit.mat("#F2EEE4", 0.6), font=kit.FONT, rot=(0, 0, rot_z - 0.15))


def shot_al_news():
    """aligned 4, Month 2, night: the reverse of the President's office, from behind his chair. On the desk, the draft
    report marked HOLD with the findings struck through; across the room, the television shows it published anyway."""
    office()
    office_front()
    desk()
    kit.box((-1.6, 0.35, 0.45), (1.8, 0.45, 0.9), kit.mat("#3B2416", 0.4, coat=0.4), bevel=0.02)
    face, _ = kit.screen("tv", (-1.6, 0.4, 1.65), 1.8, "al-news", crop=(56, 4, 1168, 657), strength=1.3,
                         rot=(math.radians(90), 0, math.radians(165)), depth=0.05, border=0.02, bezel="#0D0E10")
    report((0.55, 3.35, 0.797), rot_z=math.radians(180 + 6))
    bankers_lamp((1.05, 3.2, 0.797))
    # the President in his high-backed chair, turned toward the set
    kit.box((0.25, 4.45, 0.8), (0.66, 0.16, 1.3), kit.mat("#2A1812", 0.45), bevel=0.06, rot=(0, 0, math.radians(-20)))
    pres = P.person((0.2, 4.15, 0.0), facing=160, pose="sit", height=1.9, coat="#1A2030", hair="#D9C27A", build=1.2, seed=90)
    P.hair_back(pres, 1.9, "sit", "#D9C27A")
    kit.point((-1.6, 0.9, 1.6), 6, kit.kelvin(7200), radius=0.5)           # the set's glow
    kit.spot((1.05, 3.13, 1.06), (0.55, 3.35, 0.8), 30, kit.kelvin(2600), angle=80, blend=0.8)    # the lamp on the report
    kit.area((1.5, RD - 0.5, 2.6), (0, 2, 1), (2, 1), 18, kit.kelvin(8000))    # moonlight from the windows behind
    kit.camera((1.35, 5.95, 1.9), (-1.0, 0.9, 0.88), lens=32, fstop=5.6, focus=(-1.2, 1.2, 1.3))


def shot_qt_briefing():
    """quietTakeover 3, Month 6, afternoon: a signing in the President's office staged for television. In front, the
    crew's monitor shows the bill (its footer: drafted with the model); behind, TV lights blaze on the desk where it
    is being signed, aides standing against the bright windows."""
    office(day=True)
    desk()
    P.person((0.0, 3.95, 0.0), facing=180, pose="sit", height=1.9, coat="#1A2030", hair="#D9C27A", build=1.2, seed=90)
    kit.box((0.0, 3.08, 0.8), (0.3, 0.22, 0.004), kit.mat("#F4F0E6", 0.7))       # the bill
    for k in range(6):   # a row of signing pens
        kit.cyl((-0.5 + k * 0.08, 3.0, 0.805), 0.005, 0.13, kit.mat("#111", 0.3, 0.6), rot=(math.radians(90), 0, 0))
    for i, x in enumerate((-1.9, -1.3, 1.35, 1.95)):   # aides standing against the bright windows
        P.person((x, 5.2 + 0.1 * (i % 2), 0.0), facing=180, height=1.72 + 0.06 * (i % 3), coat=["#1D2230", "#2B2F36", "#3A3436"][i % 3],
                 hair=["#2A211C", "#8C8C8C", "#141212"][i % 3], seed=60 + i)
    tv_camera((1.1, 2.0), 15, z=0.0)
    for x, y in ((-2.0, 2.0), (2.4, 2.4)):
        tv_light((x, y), (0, 3.9, 1.0), 40, z=2.3, size=0.7)
        kit.spot((x, y, 2.3), (0, 3.6, 0.9), 600, kit.kelvin(5600), angle=22, blend=0.5)
    # the crew's monitor on a stand, in front
    kit.cyl((0.63, 1.28, 0.6), 0.015, 1.2, kit.mat("#2A2B2E", 0.4, 0.7), verts=8)
    face, _ = kit.screen("monitor", (0.6, 1.23, 1.45), 0.55, "qt-briefing", crop=(56, 4, 1168, 657), strength=1.2,
                         rot=(math.radians(90), 0, math.radians(35)), depth=0.04, border=0.015, bezel="#141416")
    kit.camera((1.3, 0.25, 1.5), (-0.2, 3.7, 1.2), lens=32, fstop=2.8, focus=face)

kit.run({
    "mis-order": shot_mis_order,
    "al-news": shot_al_news,
    "rb-hearing": shot_rb_hearing,
    "mu-hearing": shot_mu_hearing,
    "ov-news": shot_ov_news,
    "cw-hearing": shot_cw_hearing,
    "qt-briefing": shot_qt_briefing,
    "rd-news": shot_rd_news,
})
