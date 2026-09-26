"""Blender world shot shared by the ending films: the desert campus (the era-4 gigawatt site).

Rows of long, windowless data halls with rooftop chillers, tower cranes, floodlights, a transmission line running to
the horizon and two cooling towers far off, in blue-hour light. The variant sets what happens: halls rising under the
cranes (A quiet takeover), halls going dark in a line (Someone else's disaster), cranes stopped over a half-built hall
(A negotiated pace), or rival halls with an empty lot in front (Left behind).

Run: tools/endings/blender/render.sh desert:<variant> <clip>:<first>-<last> ...
     or by hand: Blender -b --factory-startup -P tools/endings/blender/desert.py -- <out_dir> [still|full] variant=rising [scale=0.5]
"""
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import args, clear_scene, clock, lin, look_at, math as mnode, node, obj_attr, plain, render, render_settings  # noqa: E402

OUT, STILL, OPTS = args()
VARIANT = OPTS.get("variant", "rising")
SCALE = float(OPTS.get("scale", 1.0))
rng = random.Random(11)
FPS = 24
FOG_HEX, FOG_K = "#8E89A6", 0.0009

clear_scene()
bpy.context.preferences.edit.keyframe_new_interpolation_type = "BEZIER"
scene = bpy.context.scene


def add_fog(m, strength=0.28):
    """Haze by distance from the camera, as in the skyline shot (a world volume turns EEVEE black in 5.2)."""
    nt = m.node_tree
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    surf = out.inputs["Surface"].links[0].from_socket
    cam = nt.nodes.new("ShaderNodeCameraData")
    fac = mnode(nt, "SUBTRACT", 1.0, mnode(nt, "EXPONENT", mnode(nt, "MULTIPLY", cam.outputs["View Distance"], -FOG_K)))
    haze = node(nt, "ShaderNodeEmission", Strength=strength)
    haze.inputs["Color"].default_value = lin(FOG_HEX)
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(fac, mix.inputs["Fac"])
    nt.links.new(surf, mix.inputs[1])
    nt.links.new(haze.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m


def box(name, loc, size, material, rot=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=(0, 0, rot))
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(material)
    return o


def lamp_material(name, hexcol, strength, end, t_off=None):
    """An emissive light that can switch off at t_off seconds (read from the object's own 't_off' when t_off is 'obj')."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = lin("#20242C")
    bsdf.inputs["Emission Color"].default_value = lin(hexcol)
    if t_off is None:
        bsdf.inputs["Emission Strength"].default_value = strength
    else:
        T = clock(nt, end)
        off = obj_attr(nt, "t_off").outputs["Fac"]
        nt.links.new(mnode(nt, "MULTIPLY", mnode(nt, "LESS_THAN", T, off), strength), bsdf.inputs["Emission Strength"])
    return m


# ---------------------------------------------------------------- variants
def variant_rising():
    """A quiet takeover, month 4: new halls rise fast under the cranes at night."""
    return dict(seconds=5.5, rising=True, cam=((-250, -170, 95), (-225, -160, 88)), look=(-10, 95, 0))


VARIANTS = {"rising": variant_rising}
SPEC = VARIANTS[VARIANT]()
END = round(SPEC["seconds"] * FPS)

# ---------------------------------------------------------------- materials
sand = plain("sand", "#8C7358", 0.95)
tex = sand.node_tree
bsdf = next(n for n in tex.nodes if n.type == "BSDF_PRINCIPLED")
noise = node(tex, "ShaderNodeTexNoise", Scale=0.02, Detail=6.0)
tcoord = tex.nodes.new("ShaderNodeTexCoord")
tex.links.new(tcoord.outputs["Object"], noise.inputs["Vector"])
ramp = tex.nodes.new("ShaderNodeMix")
ramp.data_type = "RGBA"
ramp.inputs["A"].default_value = lin("#6E5A45")
ramp.inputs["B"].default_value = lin("#9A8166")
tex.links.new(noise.outputs["Fac"], ramp.inputs["Factor"])
tex.links.new(ramp.outputs["Result"], bsdf.inputs["Base Color"])
add_fog(sand)

hall_wall = plain("hall", "#4A4F58", 0.6)
ht = hall_wall.node_tree
hb = next(n for n in ht.nodes if n.type == "BSDF_PRINCIPLED")
wave = node(ht, "ShaderNodeTexWave", Scale=0.35)
wave.wave_type = "BANDS"
wave.bands_direction = "X"
htc = ht.nodes.new("ShaderNodeTexCoord")
ht.links.new(htc.outputs["Object"], wave.inputs["Vector"])
hm = ht.nodes.new("ShaderNodeMix")
hm.data_type = "RGBA"
hm.inputs["A"].default_value = lin("#3E434C")
hm.inputs["B"].default_value = lin("#565C66")
ht.links.new(wave.outputs["Fac"], hm.inputs["Factor"])
ht.links.new(hm.outputs["Result"], hb.inputs["Base Color"])
add_fog(hall_wall)
roofkit = add_fog(plain("roofkit", "#6A6E74", 0.7))
steel = add_fog(plain("steel", "#2C2F35", 0.5))
crane_yellow = add_fog(plain("crane", "#C8864C", 0.6))
concrete = add_fog(plain("concrete", "#8F8A80", 0.9))
strip = lamp_material("strip", "#FFE2B8", 6.0, END, t_off="obj")
red = lamp_material("aviation", "#FF4A2A", 9.0, END)
flood = lamp_material("flood", "#FFF3DC", 40.0, END)

# ---------------------------------------------------------------- terrain
bpy.ops.mesh.primitive_plane_add(size=60000, location=(0, 0, 0))
ground = bpy.context.object
ground.data.materials.append(sand)
# low mesas on the horizon
for i in range(9):
    x = -1600 + i * 420 + rng.uniform(-80, 80)
    w, d, h = rng.uniform(250, 520), rng.uniform(120, 260), rng.uniform(40, 110)
    box("mesa", (x, 2600 + rng.uniform(-200, 200), h / 2), (w * 1.6, d, h * 1.8), add_fog(plain(f"mesa{i}", "#6B5A4E", 0.95), 0.6))

# ---------------------------------------------------------------- the halls
HALLS = []
for row in range(3):
    for col in range(4):
        x, y = -180 + col * 120, 40 + row * 70
        HALLS.append((row, col, x, y))

NEW_HALLS = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3)] if SPEC["rising"] else []
for k, (row, col, x, y) in enumerate(HALLS):
    L, W, Hh = 100, 44, 14
    o = box(f"hall{k}", (x, y, Hh / 2), (L, W, Hh), hall_wall)
    # a lit strip along the long side (security lighting), chillers on the roof, a red beacon on one corner
    s_ = box(f"strip{k}", (x, y - W / 2 - 0.3, 3.2), (L * 0.96, 0.3, 0.5), strip)
    s_["t_off"] = 999.0
    parts = [s_, box("red", (x - L / 2, y - W / 2, Hh + 0.6), (0.8, 0.8, 0.8), red)]
    parts += [box("chiller", (x - L / 2 + 10 + c * 16, y, Hh + 1.6), (10, 14, 3.2), roofkit) for c in range(6)]
    if (row, col) in NEW_HALLS:
        # the newest halls rise during the shot, one after another, growing up from the ground
        t_rise = 0.3 + 0.5 * NEW_HALLS.index((row, col))
        bpy.ops.object.empty_add(location=(x, y, 0))
        lift = bpy.context.object
        for part in [o] + parts:
            part.parent = lift
            part.matrix_parent_inverse = lift.matrix_world.inverted()
        lift.scale = (1, 1, 0.03)
        lift.keyframe_insert("scale", frame=max(1, round(t_rise * FPS)))
        lift.scale = (1, 1, 1)
        lift.keyframe_insert("scale", frame=round((t_rise + 1.6) * FPS))

# ---------------------------------------------------------------- tower cranes
def crane(x, y, h, yaw0, turn):
    base = box("mast", (x, y, h / 2), (2.2, 2.2, h), crane_yellow)
    bpy.ops.object.empty_add(location=(x, y, h))
    top = bpy.context.object
    jib = box("jib", (x + 28, y, h + 1.5), (64, 1.8, 2.2), crane_yellow)
    counter = box("counter", (x - 12, y, h + 1.5), (18, 2.4, 2.6), crane_yellow)
    weight = box("weight", (x - 18, y, h - 0.5), (5, 3, 3.5), concrete)
    cab = box("cab", (x + 2.5, y, h - 1.5), (3, 3, 3), steel)
    beacon = box("beacon", (x + 59, y, h + 2.8), (0.8, 0.8, 0.8), red)
    lamp = box("floodlamp", (x + 1, y, h + 4), (1.8, 1.8, 1.2), flood)
    lamp.visible_shadow = False
    for p in (jib, counter, weight, cab, beacon, lamp):
        p.parent = top
        p.matrix_parent_inverse = top.matrix_world.inverted()
    top.rotation_euler = (0, 0, math.radians(yaw0))
    top.keyframe_insert("rotation_euler", frame=1)
    if turn:
        top.rotation_euler = (0, 0, math.radians(yaw0 + turn))
        top.keyframe_insert("rotation_euler", frame=END)
    # a spot lamp that lights the site below
    bpy.ops.object.light_add(type="SPOT", location=(x + 1, y, h + 3))
    spot = bpy.context.object
    spot.data.energy = 900000
    spot.data.spot_size = math.radians(80)
    spot.data.color = (1.0, 0.92, 0.8)
    look_at(spot, (x + 10, y + 20, 0))
    return base


# floodlight poles round the site: warm pools of light on the sand
for fx, fy in ((-250, -30), (-60, -40), (130, -35), (230, 60), (-250, 200), (230, 200)):
    box("pole", (fx, fy, 12), (0.8, 0.8, 24), steel)
    box("floodhead", (fx, fy, 24.5), (3.2, 1.2, 1.6), flood).visible_shadow = False   # the lamp sits inside it
    bpy.ops.object.light_add(type="SPOT", location=(fx, fy + 2.5, 26.5))   # clear of the pole, which would shadow it
    fl = bpy.context.object
    fl.data.energy = 400000
    fl.data.spot_size = math.radians(95)
    fl.data.spot_blend = 0.6
    fl.data.color = (1.0, 0.85, 0.65)
    look_at(fl, (fx * 0.7, fy * 0.7 + 30, 0))

if SPEC["rising"]:
    crane(0, 5, 62, 200, 35)
    crane(120, 75, 70, 160, -30)
    crane(-60, 150, 58, 240, 20)

# ---------------------------------------------------------------- the power: a transmission line and cooling towers far off
def pylon(x, y):
    box("pylon", (x, y, 22), (3.4, 3.4, 44), steel)
    box("arm", (x, y, 40), (22, 1.2, 1.2), steel)
    box("arm", (x, y, 32), (16, 1.2, 1.2), steel)


pylons = [(-700 + i * 160, 330 + i * 22) for i in range(10)]
for x, y in pylons:
    pylon(x, y)
for (x0, y0), (x1, y1) in zip(pylons, pylons[1:]):
    for dx, z in ((-10, 40), (10, 40), (-7, 32), (7, 32)):
        curve = bpy.data.curves.new("wire", "CURVE")
        curve.dimensions = "3D"
        curve.bevel_depth = 0.12
        sp = curve.splines.new("POLY")
        pts = []
        for s in range(9):
            t = s / 8
            sag = 4 * t * (1 - t) * 5
            pts.append((x0 + dx + (x1 - x0) * t, y0 + (y1 - y0) * t, z - sag, 1))
        sp.points.add(len(pts) - 1)
        for p, co in zip(sp.points, pts):
            p.co = co
        w = bpy.data.objects.new("wire", curve)
        w.data.materials.append(steel)
        scene.collection.objects.link(w)


def cooling_tower(x, y, r0, h):
    verts, faces = [], []
    rings, seg = 14, 48
    for i in range(rings + 1):
        t = i / rings
        r = r0 * (1 - 0.42 * math.sin(math.pi * min(1, t * 1.15)) + 0.08 * t)
        for j in range(seg):
            a = 2 * math.pi * j / seg
            verts.append((x + r * math.cos(a), y + r * math.sin(a), t * h))
    for i in range(rings):
        for j in range(seg):
            a, b = i * seg + j, i * seg + (j + 1) % seg
            faces.append((a, b, b + seg, a + seg))
    me = bpy.data.meshes.new("tower")
    me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new("tower", me)
    scene.collection.objects.link(o)
    o.data.materials.append(concrete)
    return o


cooling_tower(420, 700, 42, 120)
cooling_tower(520, 760, 40, 112)

# ---------------------------------------------------------------- sky and light: blue hour
world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
wn = world.node_tree
bg = next(n for n in wn.nodes if n.type == "BACKGROUND")
sky = wn.nodes.new("ShaderNodeTexSky")
try:
    sky.sky_type = "MULTIPLE_SCATTERING"
except TypeError:
    sky.sky_type = "PREETHAM"
for attr, val in (("sun_elevation", math.radians(-1.0)), ("sun_rotation", math.radians(250)), ("altitude", 100.0),
                  ("air_density", 1.2), ("aerosol_density", 1.5), ("sun_intensity", 0.4)):
    if hasattr(sky, attr):
        setattr(sky, attr, val)
wn.links.new(sky.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = float(OPTS.get("sky", 0.35))

bpy.ops.object.light_add(type="SUN", rotation=(math.radians(84), 0, math.radians(250)))
sun = bpy.context.object
sun.data.energy = 0.6
sun.data.color = (0.55, 0.65, 1.0)

# ---------------------------------------------------------------- camera: a slow push across the site
bpy.ops.object.camera_add()
cam = bpy.context.object
cam.data.lens = 32
scene.camera = cam
for frame, loc in ((1, SPEC["cam"][0]), (END, SPEC["cam"][1])):
    cam.location = loc
    look_at(cam, SPEC["look"])
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

render_settings(scene, END, SCALE, samples=24, exposure=float(OPTS.get("exposure", 0.6)))
frames = [1, END // 3, END * 2 // 3, END] if STILL else range(1, END + 1)
render(scene, OUT, frames)
