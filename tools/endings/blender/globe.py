"""Blender world shot shared by the ending films: the night globe (Earth from orbit, city lights, data-centre dots).

The continents and city lights are generated here from rough outlines and population centres (no downloaded maps),
so the globe reads as Earth without claiming to be a precise map. On top sit data-centre dots whose timing and colour
come from the variant: backups blinking on (A quiet takeover), copies spreading (Someone else's disaster), a lab's
colour taken over by another's (Absorbed, Overtaken), or calm, steady lights (A negotiated pace).

Run: tools/endings/blender/render.sh globe:<variant> <clip>:<first>-<last> ...
     or by hand: Blender -b --factory-startup -P tools/endings/blender/globe.py -- <out_dir> [still|full] variant=backups [scale=0.5]
"""
import math
import os
import random
import sys

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import args, clear_scene, clock, lin, look_at, math as mnode, node, obj_attr, render, render_settings  # noqa: E402

OUT, STILL, OPTS = args()
VARIANT = OPTS.get("variant", "backups")
SCALE = float(OPTS.get("scale", 1.0))
rng = random.Random(3)

# ---------------------------------------------------------------- the map: rough continent outlines as (lon, lat)
CONTINENTS = [
    [(-168, 66), (-162, 70), (-140, 70), (-120, 70), (-95, 72), (-80, 70), (-65, 62), (-60, 55), (-66, 45), (-70, 42),
     (-76, 35), (-81, 31), (-80, 25), (-82, 28), (-85, 30), (-90, 29), (-97, 26), (-97, 20), (-92, 18), (-87, 21),
     (-88, 16), (-83, 10), (-78, 8), (-83, 9), (-86, 12), (-92, 14), (-100, 17), (-106, 23), (-112, 29), (-115, 32),
     (-118, 34), (-121, 36), (-124, 40), (-124, 46), (-127, 50), (-135, 57), (-145, 60), (-152, 59), (-158, 56),
     (-165, 54), (-165, 60)],
    [(-80, 9), (-72, 12), (-62, 10), (-52, 5), (-50, 0), (-44, -3), (-35, -6), (-37, -12), (-39, -16), (-41, -22),
     (-48, -26), (-53, -33), (-58, -38), (-63, -41), (-65, -46), (-69, -51), (-69, -55), (-73, -53), (-75, -46),
     (-73, -38), (-71, -30), (-70, -18), (-76, -14), (-81, -6), (-80, -1), (-78, 3), (-77, 8)],
    [(-17, 21), (-16, 28), (-10, 30), (-6, 35), (0, 36), (10, 37), (11, 33), (20, 31), (25, 32), (32, 31), (35, 28),
     (38, 22), (43, 12), (51, 12), (49, 6), (41, -2), (40, -10), (40, -16), (35, -24), (32, -29), (27, -34), (20, -35),
     (18, -31), (14, -23), (12, -17), (13, -10), (9, -2), (9, 4), (5, 6), (-2, 5), (-8, 4), (-13, 8), (-17, 13)],
    [(-10, 36), (-9, 43), (-2, 44), (-5, 48), (2, 51), (8, 54), (9, 57), (5, 58), (6, 62), (12, 66), (18, 70), (28, 71),
     (40, 68), (45, 67), (60, 69), (60, 55), (50, 47), (40, 45), (36, 41), (28, 41), (26, 38), (22, 37), (20, 40),
     (16, 38), (12, 41), (10, 44), (5, 43), (3, 42), (0, 39), (-5, 36)],
    [(26, 41), (36, 36), (35, 33), (34, 28), (39, 21), (42, 16), (44, 12), (52, 15), (56, 18), (59, 22), (57, 25),
     (52, 27), (56, 26), (62, 25), (67, 24), (72, 20), (76, 10), (78, 8), (80, 14), (80, 16), (87, 21), (92, 22),
     (94, 17), (98, 16), (100, 8), (103, 1), (104, 2), (101, 7), (105, 10), (109, 12), (108, 17), (106, 20), (110, 21),
     (117, 23), (121, 28), (122, 31), (120, 35), (122, 39), (118, 39), (122, 41), (126, 38), (129, 35), (129, 41),
     (135, 43), (141, 48), (142, 53), (137, 54), (140, 58), (152, 59), (163, 60), (172, 64), (180, 66), (180, 70),
     (160, 70), (140, 72), (113, 74), (100, 78), (80, 73), (70, 73), (60, 69), (60, 55), (50, 47), (48, 41), (40, 41),
     (36, 41), (28, 41)],
    [(114, -22), (114, -26), (115, -34), (118, -35), (124, -34), (131, -31), (137, -35), (140, -38), (146, -39),
     (150, -37), (153, -32), (153, -25), (146, -19), (142, -11), (141, -17), (136, -12), (131, -11), (125, -14),
     (122, -18)],
    [(-73, 78), (-60, 82), (-30, 83), (-20, 80), (-18, 75), (-22, 70), (-40, 64), (-44, 60), (-50, 62), (-54, 67), (-58, 75)],
    [(-5, 50), (1, 51), (2, 53), (-1, 55), (-2, 58), (-5, 58), (-6, 56), (-5, 54), (-3, 53), (-5, 52)],
    [(-10, 52), (-6, 52), (-6, 55), (-8, 55), (-10, 54)],
    [(130, 31), (135, 34), (140, 35), (142, 40), (141, 45), (145, 44), (140, 41), (139, 37), (135, 35), (131, 34)],
    [(95, 5), (98, 4), (106, -6), (104, -6), (100, -2), (95, 3)],
    [(109, 1), (111, -3), (116, -4), (119, 1), (117, 6), (113, 4)],
    [(131, -1), (141, -3), (150, -10), (145, -8), (138, -8), (132, -4)],
    [(105, -6), (114, -8), (114, -9), (106, -8)],
    [(44, -25), (47, -25), (50, -15), (49, -12), (44, -17)],
    [(-24, 64), (-22, 66), (-14, 66), (-14, 64)],
]
# where people live: (lon, lat, weight, spread in degrees)
CITIES = [(-77, 39, 1.0, 5), (-88, 41, .7, 6), (-96, 31, .5, 4), (-119, 35, .6, 4), (-99, 19, .5, 4), (-46, -23, .7, 5),
          (-58, -34, .4, 3), (5, 50, 1.0, 8), (-2, 53, .6, 3), (12, 43, .5, 4), (37, 55, .4, 4), (32, 39, .4, 5),
          (31, 29, .4, 3), (6, 7, .4, 4), (28, -26, .3, 3), (51, 25, .4, 3), (78, 22, 1.0, 8), (115, 32, 1.0, 8),
          (137, 36, .7, 3), (127, 37, .5, 2), (105, 14, .4, 5), (110, -7, .5, 4), (151, -33, .3, 3), (-74, 4, .3, 4),
          (-80, 25, .3, 3), (-123, 47, .3, 3), (-79, 43, .4, 3), (44, 34, .3, 4), (67, 30, .4, 4), (90, 23, .5, 3)]


def maps(w=2048, h=1024):
    """Equirectangular land mask and city-light maps (row 0 = north), built with numpy."""
    lon = np.linspace(-180, 180, w, endpoint=False) + 180 / w
    lat = np.linspace(90, -90, h, endpoint=False) - 90 / h
    X, Y = np.meshgrid(lon, lat)
    land = np.zeros((h, w), bool)
    for poly in CONTINENTS:
        px, py = np.array([p[0] for p in poly], float), np.array([p[1] for p in poly], float)
        inside = np.zeros((h, w), bool)
        j = len(poly) - 1
        for i in range(len(poly)):
            cross = ((py[i] > Y) != (py[j] > Y)) & (X < (px[j] - px[i]) * (Y - py[i]) / (py[j] - py[i] + 1e-9) + px[i])
            inside ^= cross
            j = i
        land |= inside
    land |= Y < -72                                    # Antarctica
    lights = np.zeros((h, w))
    r = np.random.default_rng(5)
    for lo, la, wt, sp in CITIES:
        n = int(26000 * wt)
        # a city is a bright core with suburbs and towns thinning out around it
        spread = sp * 0.45 * r.exponential(1.0, n)
        ang = r.uniform(0, 2 * np.pi, n)
        pts_lo = lo + spread * np.cos(ang)
        pts_la = la + spread * np.sin(ang) * 0.7
        ix = ((pts_lo + 180) / 360 * w).astype(int) % w
        iy = np.clip(((90 - pts_la) / 180 * h).astype(int), 0, h - 1)
        np.add.at(lights, (iy, ix), r.uniform(0.05, 0.35, n))
    sprinkle = r.random((h, w)) < 0.004                # small towns everywhere people live
    lights += sprinkle * r.uniform(0.1, 0.5, (h, w))
    lights *= land & (Y > -60)
    lights = np.clip(lights / 4.0, 0, 1) ** 0.8
    return land.astype(float), lights


def on_land(lon, lat):
    """Whether a point falls inside any continent outline (ray casting)."""
    for poly in CONTINENTS:
        inside, j = False, len(poly) - 1
        for i in range(len(poly)):
            (xi, yi), (xj, yj) = poly[i], poly[j]
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-9) + xi:
                inside = not inside
            j = i
        if inside:
            return True
    return False


def image(name, arr):
    h, w = arr.shape
    img = bpy.data.images.new(name, w, h, float_buffer=True)
    rgba = np.stack([arr, arr, arr, np.ones_like(arr)], -1)[::-1]   # Blender images start at the bottom row
    img.pixels.foreach_set(rgba.astype(np.float32).ravel())
    img.pack()
    img.colorspace_settings.name = "Non-Color"
    return img


def sphere_point(lon, lat, r=1.0):
    lo, la = math.radians(lon), math.radians(lat)
    return (r * math.cos(la) * math.cos(lo), r * math.cos(la) * math.sin(lo), r * math.sin(la))


# ---------------------------------------------------------------- variants: timing of the dots, camera and take length
DATA_CENTRES = [(-77.5, 39), (-73.6, 45.5), (-96.8, 32.8), (-100.4, 20.6), (-46.6, -23.5), (-70.6, -33.4), (-6.3, 53.3),
                (-0.1, 51.5), (4.9, 52.4), (8.7, 50.1), (2.3, 48.9), (-3.7, 40.4), (9.2, 45.5), (18, 59.3), (10.7, 59.9),
                (24.9, 60.2), (21, 52.2), (-21.9, 64.1), (3.4, 6.5), (28, -26.2), (36.8, -1.3), (31.2, 30), (-7.6, 33.6),
                (46.7, 24.7), (55.3, 25.2), (51.5, 25.3), (34.8, 32.1), (29, 41), (72.9, 19.1), (80.3, 13.1), (-84.4, 33.7),
                (-80.2, 25.8), (-90, 30), (-87.6, 41.9), (-112, 33.4), (-58.4, -34.6), (-43.2, -22.9), (-74.1, 4.7),
                (-9.1, 38.7), (14.4, 50.1), (16.4, 48.2), (12.5, 41.9), (23.7, 38), (26.1, 44.4), (30.5, 50.4), (37.6, 55.8),
                (-17.4, 14.7), (-0.2, 5.6), (39.3, -6.8), (32.6, 0.3), (18.4, -33.9), (58.4, 23.6), (69.2, 34.5)]


def backup_time(i, n):
    """When backup i of n appears, in seconds into the take: the gaps shrink, so copies come faster and faster.
    tools/endings/make_sound.py ("backups") plays one ping on the same schedule; keep the two in step."""
    return 0.4 + 10.5 * (i / n) ** 0.55


def variant_backups():
    """Backups of the model placed quietly in data centres: cool dots blink on, faster and faster, and keep coming."""
    sites = DATA_CENTRES[:]
    rng.shuffle(sites)
    dots = []
    for i, (lo, la) in enumerate(sites):
        t_on = backup_time(i, len(sites))   # slow at first, then more every night
        dots.append(dict(lon=lo, lat=la, t_on=t_on, colA="#9FC6EA", colB="#9FC6EA", t_sw=999))
    return dict(dots=dots, seconds=11.5, view=(-8, 24), spin=14)


LAB_COLOURS = {"you": "#63C2B2", "azuria": "#7FB2E6", "openbrain": "#F08A62", "deepthink": "#E0B07A", "qilin": "#F1E4C8"}


def owners(sites, you=5):
    """Give each data centre to a lab: a few are yours, the rest split between the big labs."""
    labs = ["azuria"] * 5 + ["openbrain"] * 3 + ["deepthink"] * 2 + ["qilin"] * 2
    out = []
    for i, site in enumerate(sites):
        out.append((site, "you" if i < you else labs[i % len(labs)]))
    return out


def variant_territories():
    """Absorbed: every lab's data centres glow in its colour; yours turn Azuria's, one by one."""
    sites = DATA_CENTRES[:]
    rng.shuffle(sites)
    dots = []
    for i, (site, lab) in enumerate(owners(sites, you=7)):
        d = dict(lon=site[0], lat=site[1], t_on=0.1 + 0.02 * i, colA=LAB_COLOURS[lab], colB=LAB_COLOURS[lab], t_sw=999)
        if lab == "you":
            d.update(colB=LAB_COLOURS["azuria"], t_sw=1.6 + 0.45 * i)
        dots.append(d)
    return dict(dots=dots, seconds=13.0, view=(-30, 30), spin=12)


def variant_spread():
    """Someone else's disaster: the rival's agent copies itself from one cloud region to hundreds."""
    r = random.Random(9)
    sites = DATA_CENTRES[:]
    extra = [(lo, la) for lo, la in ((r.uniform(-125, 145), r.uniform(-35, 60)) for _ in range(900)) if on_land(lo, la)][:150]
    dots = [dict(lon=-77.5, lat=39, t_on=0.3, colA="#F08A62", colB="#F08A62")]
    pool = sites + extra
    r.shuffle(pool)
    for i, (lo, la) in enumerate(pool):
        t_on = 0.6 + 4.2 * math.log1p(i) / math.log1p(len(pool))   # doubling: slow, then everywhere
        dots.append(dict(lon=lo, lat=la, t_on=t_on, colA="#F08A62", colB="#F08A62"))
    return dict(dots=dots, seconds=5.2, view=(-45, 32), spin=10)


def variant_calm():
    """A negotiated pace: the data centres hold steady; night moves across a quiet planet."""
    dots = [dict(lon=lo, lat=la, t_on=0.0, colA="#F6E7CC", colB="#F6E7CC") for lo, la in DATA_CENTRES]
    return dict(dots=dots, seconds=11.0, view=(10, 22), spin=26)


def variant_leader():
    """Overtaken: the leader's colour spreads from its home, taking over the others' data centres and adding more."""
    sites = DATA_CENTRES[:]
    rng.shuffle(sites)
    home = (-122, 37)
    dots = []
    for i, (site, lab) in enumerate(owners(sites, you=5)):
        dist = math.dist(site, home)
        d = dict(lon=site[0], lat=site[1], t_on=0.05 * (i % 10), colA=LAB_COLOURS[lab], colB=LAB_COLOURS["openbrain"],
                 t_sw=0.8 + dist / 55 if lab != "openbrain" else 999)
        dots.append(d)
    r = random.Random(4)
    for k in range(40):
        lo, la = r.choice(DATA_CENTRES)
        dots.append(dict(lon=lo + r.uniform(-4, 4), lat=la + r.uniform(-3, 3), t_on=2.0 + k * 0.12,
                         colA=LAB_COLOURS["openbrain"], colB=LAB_COLOURS["openbrain"]))
    return dict(dots=dots, seconds=12.0, view=(-40, 30), spin=16)


VARIANTS = {"backups": variant_backups, "territories": variant_territories, "spread": variant_spread,
            "calm": variant_calm, "leader": variant_leader}
SPEC = VARIANTS[VARIANT]()
FPS = 24
END = round(SPEC["seconds"] * FPS)

# ---------------------------------------------------------------- scene
clear_scene()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"   # steady turns, steady clocks
scene = bpy.context.scene
world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = lin("#05070C")
bg.inputs["Strength"].default_value = 1.0

land_arr, lights_arr = maps()
land_img, lights_img = image("land", land_arr), image("lights", lights_arr)

bpy.ops.mesh.primitive_uv_sphere_add(segments=192, ring_count=96, radius=1.0)
earth = bpy.context.object
earth.name = "earth"
bpy.ops.object.shade_smooth()
m = bpy.data.materials.new("earth")
m.use_nodes = True
nt = m.node_tree
bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
# map lookup from the surface point itself (lon = atan2(y, x), lat = asin(z)), the same convention sphere_point uses
tco = nt.nodes.new("ShaderNodeTexCoord")
nrm = nt.nodes.new("ShaderNodeVectorMath")
nrm.operation = "NORMALIZE"
nt.links.new(tco.outputs["Object"], nrm.inputs[0])
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(nrm.outputs[0], sep.inputs[0])
u = mnode(nt, "ADD", mnode(nt, "DIVIDE", mnode(nt, "ARCTAN2", sep.outputs["Y"], sep.outputs["X"]), 2 * math.pi), 0.5)
v = mnode(nt, "ADD", mnode(nt, "DIVIDE", mnode(nt, "ARCSINE", sep.outputs["Z"]), math.pi), 0.5)
uvv = nt.nodes.new("ShaderNodeCombineXYZ")
nt.links.new(u, uvv.inputs["X"])
nt.links.new(v, uvv.inputs["Y"])
tl = nt.nodes.new("ShaderNodeTexImage")
tl.image = land_img
tc = nt.nodes.new("ShaderNodeTexImage")
tc.image = lights_img
for t in (tl, tc):
    t.interpolation = "Linear"
    t.extension = "REPEAT"
    nt.links.new(uvv.outputs[0], t.inputs["Vector"])
mix = nt.nodes.new("ShaderNodeMix")
mix.data_type = "RGBA"
mix.inputs["A"].default_value = lin("#14304F")      # ocean
mix.inputs["B"].default_value = lin("#7A7262")      # land
nt.links.new(tl.outputs["Color"], mix.inputs["Factor"])
nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.7
# the sun sits behind the earth, about 150 degrees round from the camera: the side we see is night, with a thin daylit edge
SUN_DIR = sphere_point(SPEC["view"][0] + 150, SPEC["view"][1] * 0.3)
# city lights shine only on the night side: 1 - a ramp of the sun's angle on the surface
geo = nt.nodes.new("ShaderNodeNewGeometry")
dot = nt.nodes.new("ShaderNodeVectorMath")
dot.operation = "DOT_PRODUCT"
nt.links.new(geo.outputs["Normal"], dot.inputs[0])
dot.inputs[1].default_value = SUN_DIR
night = mnode(nt, "SUBTRACT", 1.0, mnode(nt, "MULTIPLY", mnode(nt, "ADD", dot.outputs["Value"], 0.15), 4.0))
night = mnode(nt, "MINIMUM", mnode(nt, "MAXIMUM", night, 0.0), 1.0)
# night side: city lights, plus a faint moonlit tint so the continents stay readable
lights_col = nt.nodes.new("ShaderNodeMix")
lights_col.data_type = "RGBA"
lights_col.blend_type = "ADD"
lights_col.inputs["Factor"].default_value = 1.0
tint = nt.nodes.new("ShaderNodeMix")
tint.data_type = "RGBA"
tint.inputs["A"].default_value = lin("#0A1830")
tint.inputs["B"].default_value = lin("#2A2E30")
nt.links.new(tl.outputs["Color"], tint.inputs["Factor"])
scale_l = nt.nodes.new("ShaderNodeMix")
scale_l.data_type = "RGBA"
scale_l.blend_type = "MULTIPLY"
scale_l.inputs["Factor"].default_value = 1.0
scale_l.inputs["B"].default_value = lin("#FFC98A")
nt.links.new(tc.outputs["Color"], scale_l.inputs["A"])
nt.links.new(tint.outputs["Result"], lights_col.inputs["A"])
lit = mnode(nt, "MULTIPLY", tc.outputs["Color"], 14.0)
boost = nt.nodes.new("ShaderNodeMix")
boost.data_type = "RGBA"
boost.blend_type = "MULTIPLY"
boost.inputs["Factor"].default_value = 1.0
nt.links.new(scale_l.outputs["Result"], boost.inputs["A"])
bc = nt.nodes.new("ShaderNodeCombineXYZ")
for k in ("X", "Y", "Z"):
    nt.links.new(lit, bc.inputs[k])
nt.links.new(bc.outputs[0], boost.inputs["B"])
nt.links.new(boost.outputs["Result"], lights_col.inputs["B"])
nt.links.new(lights_col.outputs["Result"], bsdf.inputs["Emission Color"])
nt.links.new(night, bsdf.inputs["Emission Strength"])
earth.data.materials.append(m)

# a thin atmosphere: a slightly larger shell that glows at its rim
bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1.025)
air = bpy.context.object
bpy.ops.object.shade_smooth()
am = bpy.data.materials.new("air")
am.use_nodes = True
an = am.node_tree
for n in list(an.nodes):
    if n.type != "OUTPUT_MATERIAL":
        an.nodes.remove(n)
out = next(n for n in an.nodes if n.type == "OUTPUT_MATERIAL")
lw = an.nodes.new("ShaderNodeLayerWeight")
lw.inputs["Blend"].default_value = 0.2
em = node(an, "ShaderNodeEmission", Strength=1.6)
em.inputs["Color"].default_value = lin("#5C9BE0")
tr = an.nodes.new("ShaderNodeBsdfTransparent")
ms = an.nodes.new("ShaderNodeMixShader")
rim = mnode(an, "POWER", lw.outputs["Facing"], 7.0)
nt_ = an.links
nt_.new(rim, ms.inputs["Fac"])
nt_.new(tr.outputs[0], ms.inputs[1])
nt_.new(em.outputs[0], ms.inputs[2])
nt_.new(ms.outputs[0], out.inputs["Surface"])
if hasattr(am, "surface_render_method"):
    am.surface_render_method = "BLENDED"
air.data.materials.append(am)
air.visible_shadow = False   # a closed transparent shell would otherwise shadow the whole earth

# stars on a far shell
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=60)
stars = bpy.context.object
sm = bpy.data.materials.new("stars")
sm.use_nodes = True
sn = sm.node_tree
for n in list(sn.nodes):
    if n.type != "OUTPUT_MATERIAL":
        sn.nodes.remove(n)
sout = next(n for n in sn.nodes if n.type == "OUTPUT_MATERIAL")
stc = sn.nodes.new("ShaderNodeTexCoord")
vor = node(sn, "ShaderNodeTexVoronoi", Scale=260.0)
sn.links.new(stc.outputs["Object"], vor.inputs["Vector"])
star = mnode(sn, "LESS_THAN", vor.outputs["Distance"], 0.035)
sem = node(sn, "ShaderNodeEmission", Strength=1.0)
sn.links.new(mnode(sn, "MULTIPLY", star, 0.6), sem.inputs["Strength"])
sn.links.new(sem.outputs[0], sout.inputs["Surface"])
stars.data.materials.append(sm)
stars.visible_shadow = False

# the data-centre dots: a small bright core and a soft halo; timing and colour come from each dot's own properties
dm = bpy.data.materials.new("dot")
dm.use_nodes = True
dn = dm.node_tree
for n in list(dn.nodes):
    if n.type != "OUTPUT_MATERIAL":
        dn.nodes.remove(n)
dout = next(n for n in dn.nodes if n.type == "OUTPUT_MATERIAL")
T = clock(dn, END)
t_on, t_sw, t_off = obj_attr(dn, "t_on"), obj_attr(dn, "t_sw"), obj_attr(dn, "t_off")
col_a, col_b, halo = obj_attr(dn, "colA"), obj_attr(dn, "colB"), obj_attr(dn, "halo")
since = mnode(dn, "SUBTRACT", T, t_on.outputs["Fac"])
on = mnode(dn, "MULTIPLY", mnode(dn, "GREATER_THAN", since, 0.0), mnode(dn, "LESS_THAN", T, t_off.outputs["Fac"]))
flash = mnode(dn, "ADD", 1.0, mnode(dn, "MULTIPLY", mnode(dn, "EXPONENT", mnode(dn, "MULTIPLY", since, -5.0)), 2.5))
cmix = dn.nodes.new("ShaderNodeMix")
cmix.data_type = "RGBA"
dn.links.new(mnode(dn, "GREATER_THAN", T, t_sw.outputs["Fac"]), cmix.inputs["Factor"])
dn.links.new(col_a.outputs["Color"], cmix.inputs["A"])
dn.links.new(col_b.outputs["Color"], cmix.inputs["B"])
dlw = dn.nodes.new("ShaderNodeLayerWeight")
dlw.inputs["Blend"].default_value = 0.5
soft = mnode(dn, "POWER", mnode(dn, "SUBTRACT", 1.0, dlw.outputs["Facing"]), 2.0)
shape = mnode(dn, "ADD", mnode(dn, "MULTIPLY", soft, halo.outputs["Fac"]), mnode(dn, "SUBTRACT", 1.0, halo.outputs["Fac"]))
dem = dn.nodes.new("ShaderNodeEmission")
dn.links.new(cmix.outputs["Result"], dem.inputs["Color"])
strength = mnode(dn, "MULTIPLY", mnode(dn, "MULTIPLY", on, flash), mnode(dn, "ADD", 6.0, mnode(dn, "MULTIPLY", halo.outputs["Fac"], -4.5)))
dn.links.new(strength, dem.inputs["Strength"])
dtr = dn.nodes.new("ShaderNodeBsdfTransparent")
dmx = dn.nodes.new("ShaderNodeMixShader")
dn.links.new(mnode(dn, "MULTIPLY", on, shape), dmx.inputs["Fac"])
dn.links.new(dtr.outputs[0], dmx.inputs[1])
dn.links.new(dem.outputs[0], dmx.inputs[2])
dn.links.new(dmx.outputs[0], dout.inputs["Surface"])
if hasattr(dm, "surface_render_method"):
    dm.surface_render_method = "BLENDED"

LON0 = 0.0


def add_dot(d, r, halo_):
    x, y, z = sphere_point(d["lon"] + LON0, d["lat"], 1.006)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=r, location=(x, y, z))
    o = bpy.context.object
    o["t_on"], o["t_sw"], o["t_off"] = float(d["t_on"]), float(d.get("t_sw", 999)), float(d.get("t_off", 999))
    o["colA"], o["colB"] = list(lin(d["colA"])[:3]), list(lin(d["colB"])[:3])
    o["halo"] = 1.0 if halo_ else 0.0
    o.data.materials.append(dm)
    o.visible_shadow = False
    o.parent = earth


for d in SPEC["dots"]:
    add_dot(d, 0.005, False)
    add_dot(d, 0.02, True)

# light: a low sun from the right for a thin daylight edge
bpy.ops.object.light_add(type="SUN")
sun = bpy.context.object
sun.data.energy = 4.0
sun.data.color = (1.0, 0.95, 0.9)
look_at(sun, (-SUN_DIR[0], -SUN_DIR[1], -SUN_DIR[2]))

# camera: the globe fills the frame; the earth turns slowly under it
bpy.ops.object.camera_add()
cam = bpy.context.object
cam.data.lens = 35
scene.camera = cam
vlon, vlat = SPEC["view"]
cam.location = sphere_point(vlon + LON0, vlat, 4.6)
look_at(cam, (0, 0, 0))
earth.rotation_euler = (0, 0, 0)
earth.keyframe_insert("rotation_euler", frame=1)
earth.rotation_euler = (0, 0, math.radians(-SPEC["spin"]))
earth.keyframe_insert("rotation_euler", frame=END)

render_settings(scene, END, SCALE, samples=24, exposure=0.2)
frames = [1, END // 3, END * 2 // 3, END] if STILL else range(1, END + 1)
render(scene, OUT, frames)
