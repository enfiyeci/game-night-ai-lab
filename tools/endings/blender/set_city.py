"""The city seen from a hill at dusk: blocks of towers with lit windows, streets of lamps, a river, billboards on the
rooftops. Every building belongs to a district, so one camera can be rendered several times with districts going dark
or billboards changing (the player crossfades the renders). Shots:

  mis-skyline-1..3   Catastrophic misalignment, Day 12, dusk: the grid goes down district by district, while the
                     billboard, run by the model, keeps saying ALL SYSTEMS OPERATIONAL. -3 is also the title card.
  al-skyline         Aligned success, Year 1: the whole city lit and warm at dusk; two people on a bench on the hill
                     look out over it. Nothing happens.
  al-skyline-title   The same bench later in the evening, wider, with dark sky across the middle for the title.
  rb-skyline-1..5    Removed by the board, Month 3: rooftop billboards light up one after another, each bigger than the
                     last and each answering the one before (KESTREL 5 SHIPPED EARLY, OPENBRAIN 7 SHIPPED EARLIER, ...).
  rb-skyline-title   The same rooftops from further back and lower in the frame, every board lit, the sky above.
  lb-skyline-1..4    Left behind, months pass: OpenBrain's billboard grows each time; Kestrel 4's goes dark, then is
                     papered over with AD SPACE AVAILABLE.
  mu-skyline-1..9    Catastrophic misuse, 3:40 am: the substations on the city's edge flash and trip, and district after
                     district goes dark (odd renders from -3 on are the flashes' aftermath, even ones the flashes).
  cw-skyline         A costly win, Month 1: every billboard over the city says KESTREL 5.
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

DISTRICTS = 6
HILL = (0, -300)     # where the city is seen from; billboards face it

# the labs' colours, as in the game (Kestrel coral, OpenBrain ink on paper, DeepThink and Lodestar sky)
BRANDS = {"kestrel": ("#E0613B", "#FFF3EA"), "openbrain": ("#F2EFE8", "#2E2A2B"), "deepthink": ("#3F84C6", "#F4F8FF"),
          "lodestar": ("#1E2E4F", "#F1E4C8")}


def window_material(name="facade", lit_share=0.55, warm="#FFC98A", seed=0.0):
    """Dark facade with a grid of windows; a share of them lit. The object property 'lit' (0-1) dims the whole
    building, and 'seed' shuffles which windows are on."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = kit.lin("#2A2D33")
    b.inputs["Roughness"].default_value = 0.35
    b.inputs["Metallic"].default_value = 0.3
    coord = nt.nodes.new("ShaderNodeTexCoord")
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.squash = 1.0
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Brick Width"].default_value = 1.8
    brick.inputs["Row Height"].default_value = 3.4
    brick.inputs["Mortar Size"].default_value = 0.5
    brick.inputs["Bias"].default_value = 0.0
    brick.inputs["Color1"].default_value = (0, 0, 0, 1)
    brick.inputs["Color2"].default_value = (1, 1, 1, 1)
    # object-space coordinates in metres, shuffled per building
    add = nt.nodes.new("ShaderNodeVectorMath")
    add.operation = "ADD"
    sd = kit_attr(nt, "seed")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(sd.outputs["Fac"], comb.inputs["X"])
    nt.links.new(sd.outputs["Fac"], comb.inputs["Y"])
    nt.links.new(coord.outputs["Object"], add.inputs[0])
    nt.links.new(comb.outputs[0], add.inputs[1])
    # facades lie in xz and yz: use x+y as the horizontal coordinate
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(add.outputs[0], sep.inputs[0])
    hsum = nt.nodes.new("ShaderNodeMath")
    hsum.operation = "ADD"
    nt.links.new(sep.outputs["X"], hsum.inputs[0])
    nt.links.new(sep.outputs["Y"], hsum.inputs[1])
    vec = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(hsum.outputs[0], vec.inputs["X"])
    nt.links.new(sep.outputs["Z"], vec.inputs["Y"])
    nt.links.new(vec.outputs[0], brick.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[1].position = 1 - lit_share
    nt.links.new(brick.outputs["Color"], ramp.inputs["Fac"])
    glass = nt.nodes.new("ShaderNodeMath")
    glass.operation = "SUBTRACT"
    glass.inputs[0].default_value = 1.0
    nt.links.new(brick.outputs["Fac"], glass.inputs[1])          # 1 inside a window, 0 on the frame
    on = nt.nodes.new("ShaderNodeMath")
    on.operation = "MULTIPLY"
    nt.links.new(ramp.outputs["Color"], on.inputs[0])
    nt.links.new(glass.outputs[0], on.inputs[1])
    lit = kit_attr(nt, "lit")
    on2 = nt.nodes.new("ShaderNodeMath")
    on2.operation = "MULTIPLY"
    nt.links.new(on.outputs[0], on2.inputs[0])
    nt.links.new(lit.outputs["Fac"], on2.inputs[1])
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    nsep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], nsep.inputs[0])
    side = nt.nodes.new("ShaderNodeMath")
    side.operation = "LESS_THAN"
    side.inputs[1].default_value = 0.5
    nt.links.new(nsep.outputs["Z"], side.inputs[0])            # 1 on walls, 0 on roofs
    walls = nt.nodes.new("ShaderNodeMath")
    walls.operation = "MULTIPLY"
    nt.links.new(on2.outputs[0], walls.inputs[0])
    nt.links.new(side.outputs[0], walls.inputs[1])
    strength = nt.nodes.new("ShaderNodeMath")
    strength.operation = "MULTIPLY"
    strength.inputs[1].default_value = 1.4
    nt.links.new(walls.outputs[0], strength.inputs[0])
    b.inputs["Emission Color"].default_value = kit.lin(warm)
    nt.links.new(strength.outputs[0], b.inputs["Emission Strength"])
    return m


def kit_attr(nt, name):
    a = nt.nodes.new("ShaderNodeAttribute")
    a.attribute_type = "OBJECT"
    a.attribute_name = name
    return a


def _district(x, y):
    angle = math.degrees(math.atan2(x, y + 300))     # seen from the hill, left to right
    return min(DISTRICTS - 1, max(0, int((angle + 36) / 72 * DISTRICTS)))


def _batch(name, boxes, material, props):
    """One mesh object holding many boxes [(center, size)], for speed."""
    from mathutils import Matrix
    bm = bmesh.new()
    for (cx, cy, cz), (sx, sy, sz) in boxes:
        m = Matrix.Translation((cx, cy, cz)) @ Matrix.Diagonal((sx, sy, sz, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    for k, v in props.items():
        ob[k] = v
    bpy.context.scene.collection.objects.link(ob)
    return ob


def city(dark=(), seed=12, share=1.0):
    """Towers on a grid of blocks, grouped by district (0-5, left to right from the hill) and facade. share scales how
    many windows are lit (fewer in the small hours). Returns the rooftops [(x, y, height, width, depth)]."""
    rng = random.Random(seed)
    facades = [window_material(f"facade{i}", lit_share=sh * share, warm=w) for i, (sh, w) in
               enumerate(((0.32, "#FFC98A"), (0.22, "#FFE3B8"), (0.38, "#FFB870"), (0.28, "#DDE8FF")))]
    kit.box((0, 600, -0.5), (4000, 2600, 1), kit.mat("#16181C", 0.6))
    kit.box((0, 420, -0.3), (4000, 60, 0.4), kit.mat("#0E1520", 0.05))   # the river
    groups = {}
    roofs = []
    lamps = {}
    reds = {}
    tops = []
    for bx in range(-24, 25):
        for by in range(2, 40):
            if by in (11, 12):
                continue
            x, y = bx * 34 + rng.uniform(-3, 3), by * 34 + rng.uniform(-3, 3)
            core = math.exp(-((x - 60) ** 2 + (y - 760) ** 2) / (2 * 360 ** 2))
            h = rng.uniform(10, 36) + core * rng.uniform(30, 200)
            w, d = rng.uniform(16, 26), rng.uniform(16, 26)
            dist = _district(x, y)
            f = rng.randrange(len(facades))
            if h > 55:   # a podium and a narrower tower, sometimes a crown
                ph = h * rng.uniform(0.15, 0.3)
                groups.setdefault((dist, f), []).append(((x, y, ph / 2), (w + 6, d + 6, ph)))
                tw, td = w * rng.uniform(0.6, 0.85), d * rng.uniform(0.6, 0.85)
                split = h * rng.uniform(0.7, 0.85)
                groups.setdefault((dist, f), []).append(((x, y, split / 2), (tw, td, split)))
                groups.setdefault((dist, f), []).append(((x, y, (split + h) / 2), (tw * 0.75, td * 0.75, h - split)))
                roofs.append(((x, y, h + 2), (tw * 0.3, td * 0.3, 4)))
                if rng.random() < 0.3:
                    roofs.append(((x, y, h + 12), (0.6, 0.6, 20)))
                tops.append((x, y, h, tw * 0.75, td * 0.75))
            else:
                groups.setdefault((dist, f), []).append(((x, y, h / 2), (w, d, h)))
                for _ in range(rng.randint(0, 3)):
                    roofs.append(((x + rng.uniform(-w / 3, w / 3), y + rng.uniform(-d / 3, d / 3), h + 1.2), (rng.uniform(2, 5), rng.uniform(2, 5), 2.4)))
                tops.append((x, y, h, w, d))
            if h > 120 and rng.random() < 0.6:
                reds.setdefault(dist, []).append(((x, y, h + 0.6), (1.2, 1.2, 1.2)))
            if by % 2 == 0:
                lamps.setdefault(dist, []).append(((x + 17, y, 6), (1.0, 1.0, 0.5)))
    for (dist, f), boxes in groups.items():
        _batch(f"d{dist}f{f}", boxes, facades[f], {"lit": 0.0 if dist in dark else 1.0, "seed": 0.0})
    _batch("roofs", roofs, kit.mat("#24262A", 0.7), {})
    for dist, boxes in lamps.items():
        _batch(f"lamps{dist}", boxes, kit.emission("#FFB25A", 0.0 if dist in dark else 10), {})
    for dist, boxes in reds.items():
        _batch(f"reds{dist}", boxes, kit.emission("#FF3B2A", 0.0 if dist in dark else 30), {})
    return tops


def roof(tops, x, y, lo=0.0, hi=999.0):
    """The rooftop nearest (x, y) whose height lies between lo and hi."""
    return min((t for t in tops if lo <= t[2] <= hi), key=lambda t: (t[0] - x) ** 2 + (t[1] - y) ** 2)


def billboard(lines, x=70, y=-120, z=62, width=26, lit=True, cam=HILL, height=10, panel="#0B1C1A", glow="#0E2A26",
              strength=1.0, building=True):
    """A lightbox billboard on legs, facing the camera, standing at height z (on a building of its own when building
    is True). lines = [(text, dz, size, material)], dz from the face's centre. Returns the face."""
    s = height / 10
    steel = kit.mat("#2A2B2E", 0.5, 0.7)
    yaw = math.atan2(-(x - cam[0]), y - cam[1])
    if building:
        kit.box((x, y, z / 2), (24, 20, z), window_material("near", lit_share=0.3))
    for dx in (-width * 8 / 26, width * 8 / 26):
        kit.box((x + dx * math.cos(yaw), y + dx * math.sin(yaw), z + 3 * s), (0.6 * s, 0.6 * s, 6 * s), steel)
    kit.box((x, y, z + 11 * s), (width + 1, 0.8 * s, height + 1), steel, rot=(0, 0, yaw))
    nx, ny = math.sin(yaw), -math.cos(yaw)        # the face's normal, toward the camera
    face = kit.box((x + 0.45 * s * nx, y + 0.45 * s * ny, z + 11 * s), (width, 0.1, height),
                   kit.mat(panel, 0.4, emit=glow, strength=strength if lit else 0.0), rot=(0, 0, yaw))
    for body, dz, size, colour in lines:
        kit.text(body, (x + 0.55 * s * nx, y + 0.55 * s * ny, z + 11 * s + dz), size, colour, font=kit.FONT,
                 rot=(math.radians(90), 0, yaw))
    return face


def ad(brand, name, tagline, top, width, lit=True, cam=HILL, blank=False):
    """A lab's billboard on a rooftop: its name large, a tagline under it, in the lab's colours; dark when not lit
    (blank when its poster is not up yet)."""
    panel, ink = BRANDS[brand]
    height = width * 0.36
    if lit:
        # a pale panel glows and its letters stay dark; a coloured panel glows softly and its letters glow brighter
        pale = brand == "openbrain"
        letters = kit.mat(ink, 0.5) if pale else kit.mat(ink, 0.5, emit=ink, strength=9)
        strength = 2.2 if pale else 1.1
    else:
        letters, strength = kit.mat("#3A3B3E", 0.6), 0.0
    lines = [] if blank else [(name, height * 0.14, height * 0.3, letters), (tagline, -height * 0.24, height * 0.19, letters)]
    return billboard(lines, top[0], top[1], top[2] + 2.4, width=width, lit=lit, cam=cam, height=height,
                     panel=panel if lit else "#1C1D20", glow=panel, strength=strength, building=False)


def poster(face, width, height, lines, du=0.0, paper="#E6E0D2"):
    """A paper poster pasted over part of a billboard's face (du slides it along the face), lit by a lamp below."""
    yaw = face.rotation_euler.z
    c, s = math.cos(yaw), math.sin(yaw)
    nx, ny = math.sin(yaw), -math.cos(yaw)
    x, y, z = face.location
    px, py = x + du * c + 0.08 * nx, y + du * s + 0.08 * ny
    kit.box((px, py, z), (width, 0.02, height), kit.mat(paper, 0.85), rot=(0, 0, yaw))
    for body, dz, size, colour in lines:
        kit.text(body, (px + 0.03 * nx, py + 0.03 * ny, z + dz), size, colour, font=kit.FONT_COND, rot=(math.radians(90), 0, yaw))
    kit.area((px + 6 * nx, py + 6 * ny, z - height / 2 - 3), (px, py, z), (width, 1.5), 4000, kit.kelvin(3400))


def substation(x, y, lit=True, flash=False):
    """A fenced yard of transformers and gantries on the city's edge; flash is the moment it trips (an arc of
    blue-white light that floods the blocks around it)."""
    steel = kit.mat("#6C7074", 0.45, 0.8)
    boxes = []
    for i in range(3):
        boxes.append(((x - 12 + i * 12, y, 2.5), (6, 4, 5)))                 # transformers
        boxes.append(((x - 12 + i * 12, y - 2.6, 3.0), (5, 1.0, 4.0)))       # their radiators
    for gx in (-18, 0, 18):
        for gy in (-8, 8):
            boxes.append(((x + gx, y + gy, 7), (0.5, 0.5, 14)))              # gantry legs
        boxes.append(((x + gx, y, 13.5), (0.5, 17, 0.6)))
    boxes.append(((x, y - 8, 13.5), (37, 0.5, 0.6)))
    boxes.append(((x, y + 8, 13.5), (37, 0.5, 0.6)))
    _batch("substation", boxes, steel, {})
    fence = [((x, y + sy * 14, 1.2), (48, 0.08, 2.4)) for sy in (-1, 1)] + [((x + sx * 24, y, 1.2), (0.08, 28, 2.4)) for sx in (-1, 1)]
    _batch("yardfence", fence, kit.mat("#8A8E92", 0.5, 0.6, alpha=0.35), {})
    if lit:
        for lx in (-20, 20):
            kit.box((x + lx, y - 14, 9), (0.3, 0.3, 18), steel)
            kit.sphere((x + lx, y - 13.4, 18), 0.5, kit.emission("#FFB25A", 40))
            kit.point((x + lx, y - 12, 17), 25000, kit.kelvin(2200), radius=1)
    if flash:
        kit.sphere((x + 2, y - 1, 9), 3.5, kit.emission("#CFE6FF", 400), scale=(1.4, 1, 1))
        kit.point((x + 2, y - 6, 10), 1.5e6, (0.75, 0.88, 1.0), radius=3)


def hill(people=True):
    """The edge of the hill the city is seen from: grass falling steeply away toward the city, a bench right on the
    edge with two people sitting on it, and at the hill's foot a lamplit road and the low outskirts."""
    bm = bmesh.new()
    xs = [-240 + 3 * i for i in range(161)]
    ys = [-360 + 1.5 * j for j in range(101)]
    rows = []
    for y in ys:
        t = y + 322 + 5                                 # metres past the brow, 5 m behind the bench
        base = 114.0 if t < 0 else max(-1.0, 114 - 0.03 * t * t)
        rows.append([bm.verts.new((x, y, base + 0.6 * math.sin(x * 0.11) * math.cos(y * 0.13) + 0.25 * math.sin(x * 0.7 + y)))
                     for x in xs])
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    me = bpy.data.meshes.new("hill")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new("hill", me)
    ob.data.materials.append(kit.tex("sparse_grass", 0.5, tint="#6E7358", name="grass"))
    bpy.context.scene.collection.objects.link(ob)
    # below: a road of lamps along the hill's foot
    rng = random.Random(5)
    lamps = [((x, -140 + 0.08 * x, 5), (0.6, 0.6, 0.4)) for x in range(-600, 601, 24)]
    _batch("parklamps", lamps, kit.emission("#FFB25A", 12), {})
    houses = []   # low outskirts reaching from the city to the hill's foot
    for i in range(-40, 41):
        for j in range(8):
            x, y = i * 20 + rng.uniform(-4, 4), -120 + j * 22 + rng.uniform(-4, 4)
            if rng.random() < 0.8:
                houses.append(((x, y, 5), (rng.uniform(12, 17), rng.uniform(12, 17), rng.uniform(8, 14))))
    _batch("outskirts", houses, window_material("outskirts", lit_share=0.3, warm="#FFC07A"), {"lit": 1.0, "seed": 0.0})
    if people:
        z = 114 - 0.03 * 5 ** 2 + 0.05
        kit.place("painted_wooden_bench", (-1.4, -322.4, z))
        P.person((-1.75, -322.35, z + 0.02), facing=4, pose="sit", height=1.78, coat="#2B2F36", seed=3)
        P.person((-1.0, -322.3, z + 0.02), facing=-6, pose="sit", height=1.62, coat="#5B3A33", long_coat=True,
                 hair="#4A3526", seed=8)


def sky(strength=0.28, rotation=250, hdri="qwantani_dusk_2_puresky"):
    kit.world(hdri=hdri, strength=strength, rotation=rotation)


def skyline_shot(dark):
    def shot():
        sky()
        city(dark=dark)
        teal = kit.mat("teal", 0.5, emit="#3FE0C0", strength=18)
        white = kit.mat("#FFFFFF", 0.5, emit="#E8FFF8", strength=10)
        billboard([("ALL SYSTEMS", 2.2, 3.4, teal), ("OPERATIONAL", -1.6, 3.4, teal),
                   ("GRID UPTIME 100%  ·  MANAGED BY KESTREL 4", -4.0, 0.8, white)])
        kit.sun((96, 0, 250), 0.3, kit.kelvin(2400), angle=3)
        kit.camera((0, -300, 118), (30, 800, 5), lens=40)
        kit.haze((0, 700, 120), (3000, 1800, 240), 0.00025, color="#E8D2D8", anisotropy=0.5)
        bpy.context.scene.view_settings.exposure = 0.2
    return shot


# ---------------------------------------------------------------- the new shots
BENCH_CAM = (0.8, -328.5, 115.8)     # just behind the brow, standing


def dusk(sun=0.3, exposure=0.2, haze="#E8D2D8"):
    kit.sun((96, 0, 250), sun, kit.kelvin(2400), angle=3)
    kit.haze((0, 700, 120), (3000, 1800, 240), 0.00025, color=haze, anisotropy=0.5)
    bpy.context.scene.view_settings.exposure = exposure


def shot_al_skyline():
    sky(0.34, 250)
    city()
    hill()
    dusk(0.45, 0.25)
    kit.camera(BENCH_CAM, (30, 800, 12), lens=32, fstop=4.0, focus=(30, 700, 40))


def shot_al_skyline_title():
    sky(0.1, 250)
    city()
    hill()
    dusk(0.08, -0.45, haze="#B9B4CC")
    kit.camera((1.6, -331, 116.0), (30, 800, 300), lens=24, fstop=4.0, focus=(30, 700, 40))


# rb: each board bigger than the last, lit in turn: (brand, name, tagline, target rooftop (x, y), width)
RB_BOARDS = [("kestrel", "KESTREL 5", "SHIPPED EARLY", (-68, 203), 28),
             ("openbrain", "OPENBRAIN 7", "SHIPPED EARLIER", (66, 273), 34),
             ("deepthink", "DEEPTHINK 4", "BIGGER THAN OPENBRAIN 7", (-66, 308), 42),
             ("kestrel", "KESTREL 6", "BIGGER THAN ALL OF THEM", (32, 172), 50),
             ("openbrain", "OPENBRAIN 8", "ALREADY HERE", (1, 307), 76)]
TELE = ((0, -300, 118), (0, 250, 95), 85)     # from the hill, a long lens on the nearer rooftops


def rb_shot(lit, cam=TELE, title=False):
    def shot():
        sky(0.16 if title else 0.28)
        tops = city()
        for k, (brand, name, tag, (x, y), width) in enumerate(RB_BOARDS):
            ad(brand, name, tag, roof(tops, x, y, 30), width, lit=k < lit, blank=k >= lit)
        dusk(0.3, -0.35 if title else 0.2)
        kit.camera(cam[0], cam[1], lens=cam[2])
    return shot


def lb_shot(stage):
    """stage 0: both boards lit; 1: OpenBrain's bigger, Kestrel's dark; 2: bigger again, Kestrel's half papered over;
    3: OpenBrain's bigger still, Kestrel's fully papered over."""
    def shot():
        sky()
        tops = city()
        ink = kit.mat("#2E2A2B", 0.6)
        ad("openbrain", "OPENBRAIN 7" if stage < 2 else "OPENBRAIN 8", "THE FUTURE" if stage < 3 else "THE ONLY FUTURE",
           roof(tops, 66, 273, 30), (28, 40, 54, 76)[stage])
        face = ad("kestrel", "KESTREL 4", "BUILT CAREFULLY", roof(tops, -68, 203, 30), 26, lit=stage == 0)
        if stage >= 2:
            w = (15, 27)[stage - 2]
            poster(face, w, 9.6, [("AD SPACE", 1.6, 3.0, ink), ("AVAILABLE", -1.8, 3.0, ink)], du=(5.6, 0)[stage - 2])
        dusk()
        kit.camera(TELE[0], TELE[1], lens=TELE[2])
    return shot


# mu: the substations on the city's edge, in the order they trip (district, x, y)
MU_TRIPS = [(1, -120, 40), (4, 115, 45), (2, -45, 30), (5, 205, 50)]


def mu_shot(tripped, flash):
    """tripped: how many substations have gone; flash: the next one is arcing right now."""
    def shot():
        sky(0.03, 250, hdri="qwantani_night_puresky")
        dark = [d for d, _, _ in MU_TRIPS[:tripped]]
        city(dark=dark, share=0.55)
        for k, (d, x, y) in enumerate(MU_TRIPS):
            substation(x, y, lit=k >= tripped, flash=flash and k == tripped)
        kit.haze((0, 700, 120), (3000, 1800, 240), 0.00015, color="#56607A", anisotropy=0.5)
        bpy.context.scene.view_settings.exposure = 0.2
        kit.camera((0, -300, 118), (30, 800, -50), lens=32)
    return shot


CW_BOARDS = [("NUMBER ONE", (-100, 440), 36), ("ON EVERY CHART", (138, 439), 36), ("IN EVERY HOME", (-103, 340), 30),
             ("NUMBER ONE", (1, 307), 34), ("ASK KESTREL", (137, 343), 30), ("EVERYWHERE", (-137, 340), 28),
             ("YOUR NEW NORMAL", (32, 237), 30), ("NUMBER ONE", (-101, 170), 26), ("ON EVERY CHART", (-32, 206), 26),
             ("IN EVERY HOME", (102, 170), 28), ("NUMBER ONE", (2, 135), 30), ("ASK KESTREL", (-100, 102), 24),
             ("NUMBER ONE", (67, 104), 26)]


def shot_cw_skyline():
    sky()
    tops = city()
    for tag, (x, y), width in CW_BOARDS:
        ad("kestrel", "KESTREL 5", tag, roof(tops, x, y, 20), width * 1.25)
    dusk()
    kit.camera((0, -300, 118), (0, 400, 95), lens=55)


kit.run({
    "mis-skyline-1": skyline_shot(()),
    "mis-skyline-2": skyline_shot((0, 1, 4)),
    "mis-skyline-3": skyline_shot((0, 1, 2, 3, 4, 5)),
    "al-skyline": shot_al_skyline,
    "al-skyline-title": shot_al_skyline_title,
    **{f"rb-skyline-{k}": rb_shot(k) for k in range(1, 6)},
    "rb-skyline-title": rb_shot(5, ((0, -190, 118), (0, 800, 250), 35), title=True),
    **{f"lb-skyline-{k + 1}": lb_shot(k) for k in range(4)},
    **{f"mu-skyline-{2 * k + 1}": mu_shot(k, False) for k in range(5)},
    **{f"mu-skyline-{2 * k + 2}": mu_shot(k, True) for k in range(4)},
    "cw-skyline": shot_cw_skyline,
})
