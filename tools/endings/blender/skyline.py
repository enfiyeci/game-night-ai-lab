"""Blender world shot shared by the ending films: the skyline, a procedural city at dusk, grounded rather than cartoon.

Variants (variant=<name>):
  blackout  Catastrophic misalignment. Windows and street lights go out in a wave from left to right, while one rooftop
            LED billboard keeps saying ALL SYSTEMS OPERATIONAL. Frames 1-216 are the shot (9 s); frames 217-384 play
            behind the title card (7 s) while the last lights on the right go out.
  warm      Aligned success. Every light stays on; nothing dramatic happens, on purpose. Frames 1-120 are the shot (5 s),
            frames 121-288 play behind the title card.
  billboards  Removed by the board. The labs' rooftop boards flip to bigger models, each answering the last, faster each
            time. Frames 1-144 are the shot, 145-312 play behind the title card.
  leftbehind  Left behind. The leader's board grows with every cut; yours is papered over, then sells soda (144 frames).
  cascade   Catastrophic misuse, 3:40 am. Substations trip and the city goes dark in chunks; your lab's logo stays lit
            on backup power (144 frames).
  numberone A costly win. Your model's name on every board, the city at full volume (120 frames).
The frame keeps the billboard inside the film's letterbox (the player covers the top and bottom 11% of the picture).

Run: tools/endings/blender/render.sh skyline:blackout mis-skyline:1-216 mis-skyline-title:217-384
     tools/endings/blender/render.sh skyline:warm al-skyline:1-120 al-skyline-title:121-288
     or by hand: Blender -b --factory-startup -P tools/endings/blender/skyline.py -- <out_dir> [still] variant=<name> [scale=0.5]
"""
import math
import random
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/skyline"
STILL = len(argv) > 1 and argv[1] == "still"
OPTS = dict(a.split("=", 1) for a in argv[2:] if "=" in a)
SCALE = float(OPTS.get("scale", 1.0))
VARIANT = OPTS.get("variant", "blackout")
FPS = 24
SHOT_END, END = {"blackout": (216, 384), "warm": (120, 288), "billboards": (144, 312), "leftbehind": (144, 144),
                  "cascade": (144, 144), "numberone": (120, 120)}[VARIANT]
SUN_ROT, SKY_STRENGTH = 90.0, 0.3   # the values the owner saw in the Blender test
FOG_HEX, FOG_K = "#7A6470", 0.0009
rng = random.Random(7)

scene = bpy.context.scene
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)


def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c], 1.0)


def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


# ---------------------------------------------------------------- the blackout wave, shared by every light
# (frame, x of the wave front in world metres); lights right of the front stay on. "warm" keeps the front off the map.
WAVE = {"blackout": ((10, -440.0), (SHOT_END - 12, -80.0), (END - 40, 320.0)),
        # cascade: substations trip in chunks, so the front jumps rather than sweeps (keys are held, not blended)
        "cascade": ((1, -9999.0), (24, -330.0), (60, -190.0), (96, -60.0), (132, 120.0), (200, 400.0))}.get(VARIANT, ((1, -9999.0),))


def wave_value(nt):
    edit = bpy.context.preferences.edit
    was = edit.keyframe_new_interpolation_type
    if VARIANT == "cascade":
        edit.keyframe_new_interpolation_type = "CONSTANT"
    v = nt.nodes.new("ShaderNodeValue")
    for frame, x in WAVE:
        v.outputs[0].default_value = x
        v.outputs[0].keyframe_insert("default_value", frame=frame)
    edit.keyframe_new_interpolation_type = was
    return v


def lit_by_wave(nt):
    """1 where the object's x is right of the wave (still powered), else 0. Reads the object's own "px" property:
    in Blender 5.2 the Object Info location is unreliable once an object's scale has been applied."""
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_type = "OBJECT"
    attr.attribute_name = "px"
    gt = node(nt, "ShaderNodeMath")
    gt.operation = "GREATER_THAN"
    nt.links.new(attr.outputs["Fac"], gt.inputs[0])
    nt.links.new(wave_value(nt).outputs[0], gt.inputs[1])
    return gt.outputs[0], attr


def building_material(name, wall_hex, win_w=2.2, row_h=3.4, mortar=0.55):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    add = node(nt, "ShaderNodeMath")
    add.operation = "ADD"
    nt.links.new(sep.outputs["X"], add.inputs[0])
    nt.links.new(sep.outputs["Y"], add.inputs[1])
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(add.outputs[0], comb.inputs["X"])
    nt.links.new(sep.outputs["Z"], comb.inputs["Y"])
    brick = node(nt, "ShaderNodeTexBrick", Scale=1.0, **{"Mortar Size": mortar, "Brick Width": win_w, "Row Height": row_h})
    brick.inputs["Color1"].default_value = (1, 1, 1, 1)
    brick.inputs["Color2"].default_value = (0, 0, 0, 1)
    brick.inputs["Mortar"].default_value = (0, 0, 0, 1)
    nt.links.new(comb.outputs[0], brick.inputs["Vector"])
    # window = a brick cell (not mortar); about 60% of windows have their lights on
    inv = node(nt, "ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    nt.links.new(brick.outputs["Fac"], inv.inputs[1])
    on = node(nt, "ShaderNodeMath")
    on.operation = "GREATER_THAN"
    on.inputs[1].default_value = 0.5
    nt.links.new(brick.outputs["Color"], on.inputs[0])
    # no windows on roofs
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    nsep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], nsep.inputs[0])
    side = node(nt, "ShaderNodeMath")
    side.operation = "LESS_THAN"
    side.inputs[1].default_value = 0.5
    nt.links.new(nsep.outputs["Z"], side.inputs[0])
    powered, _ = lit_by_wave(nt)
    mask = inv.outputs[0]
    for other in (side.outputs[0],):
        mul = node(nt, "ShaderNodeMath")
        mul.operation = "MULTIPLY"
        nt.links.new(mask, mul.inputs[0])
        nt.links.new(other, mul.inputs[1])
        mask = mul.outputs[0]
    glow = mask
    for other in (on.outputs[0], powered):
        mul = node(nt, "ShaderNodeMath")
        mul.operation = "MULTIPLY"
        nt.links.new(glow, mul.inputs[0])
        nt.links.new(other, mul.inputs[1])
        glow = mul.outputs[0]
    strength = node(nt, "ShaderNodeMath")
    strength.operation = "MULTIPLY"
    strength.inputs[1].default_value = 4.5
    nt.links.new(glow, strength.inputs[0])
    nt.links.new(strength.outputs[0], bsdf.inputs["Emission Strength"])
    bsdf.inputs["Emission Color"].default_value = lin("#FFD39A")
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = lin(wall_hex)
    mix.inputs["B"].default_value = lin("#1B2230")
    nt.links.new(mask, mix.inputs["Factor"])
    nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.8
    return add_fog(m)


def add_fog(m):
    """Atmospheric haze without a volume: mix the surface toward a dusk colour by distance from the camera."""
    nt = m.node_tree
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    surf = out.inputs["Surface"].links[0].from_socket
    cam = nt.nodes.new("ShaderNodeCameraData")
    k = node(nt, "ShaderNodeMath")
    k.operation = "MULTIPLY"
    k.inputs[1].default_value = -FOG_K
    nt.links.new(cam.outputs["View Distance"], k.inputs[0])
    ex = node(nt, "ShaderNodeMath")
    ex.operation = "EXPONENT"
    nt.links.new(k.outputs[0], ex.inputs[0])
    fac = node(nt, "ShaderNodeMath")
    fac.operation = "SUBTRACT"
    fac.inputs[0].default_value = 1.0
    nt.links.new(ex.outputs[0], fac.inputs[1])
    haze = nt.nodes.new("ShaderNodeEmission")
    haze.inputs["Color"].default_value = lin(FOG_HEX)
    haze.inputs["Strength"].default_value = 0.4
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(fac.outputs[0], mix.inputs["Fac"])
    nt.links.new(surf, mix.inputs[1])
    nt.links.new(haze.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m


def plain(name, hexcol, rough=0.9, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = lin(hexcol)
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = lin(emit)
        bsdf.inputs["Emission Strength"].default_value = strength
    return m


def streetlight_material():
    m = bpy.data.materials.new("streetlight")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = lin("#FFE2B0")
    bsdf.inputs["Emission Color"].default_value = lin("#FFC98A")
    powered, _ = lit_by_wave(nt)
    s = node(nt, "ShaderNodeMath")
    s.operation = "MULTIPLY"
    s.inputs[1].default_value = 12.0
    nt.links.new(powered, s.inputs[0])
    nt.links.new(s.outputs[0], bsdf.inputs["Emission Strength"])
    return m


def cube(name, loc, size, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o["px"] = float(loc[0])
    o.data.materials.append(material)
    return o


# ---------------------------------------------------------------- the city
walls = [building_material(f"bld{i}", h, w, r, mo) for i, (h, w, r, mo) in enumerate([("#3A3F4A", 2.2, 3.4, 0.7), ("#4A4540", 3.0, 3.6, 0.9),
         ("#2E3440", 1.6, 3.2, 0.5), ("#55504A", 2.6, 4.0, 1.1), ("#3C4452", 4.2, 3.4, 0.6)])]
ground = add_fog(plain("asphalt", "#1C1E24", 0.95))
roofkit = add_fog(plain("roofkit", "#34363C", 0.8))
bpy.ops.mesh.primitive_plane_add(size=4000, location=(0, 0, 0))
bpy.context.object.data.materials.append(ground)

LOT = 46.0
billboard_host = None
HOSTS = {}
for i in range(-12, 5):
    for j in range(0, 16):
        if rng.random() < 0.08:
            continue
        w, d = rng.uniform(22, 38), rng.uniform(22, 38)
        dist = abs(j - 6) + abs(i + 4) * 0.6
        h = max(12.0, rng.uniform(14, 40) + max(0, 110 - dist * 14) * rng.uniform(0.4, 1.0))
        x, y = i * LOT + rng.uniform(-3, 3), j * LOT + rng.uniform(-3, 3)
        b = cube(f"b_{i}_{j}", (x, y, h / 2), (w, d, h), rng.choice(walls))
        for _ in range(rng.randint(1, 3)):   # rooftop plant and water tanks, for scale
            rw = rng.uniform(3, 8)
            cube("roof", (x + rng.uniform(-w / 3, w / 3), y + rng.uniform(-d / 3, d / 3), h + rw / 3), (rw, rw * 0.8, rw * 0.66), roofkit)
        if (i, j) == (-5, 3):
            billboard_host = (x, y, h, w, d)
        HOSTS[(i, j)] = (x, y, h, w, d)

# street lights along the avenue nearest the camera
sl = streetlight_material()
for i in range(-14, 6):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, location=(i * LOT / 2, -24, 9))
    bpy.context.object["px"] = float(i * LOT / 2)
    bpy.context.object.data.materials.append(sl)
    cube(f"pole{i}", (i * LOT / 2, -24, 4.5), (0.4, 0.4, 9), plain("pole", "#2A2C30"))

# the billboard: an LED sign on the roof, on backup power, never goes dark
x, y, h, w, d = billboard_host or (-230, 138, 60, 30, 30)
BILLBOARD = VARIANT == "blackout"   # the other variants build their boards below
if BILLBOARD:
    panel = cube("board", (x, y - d / 2 - 1, h + 21), (46, 1.2, 15), plain("boardframe", "#15171C", 0.6))
    for k in (-14, 14):
        cube(f"leg{k}", (x + k, y - d / 2 - 1, h + 7), (1.2, 1.2, 14), plain("legs", "#2A2C30"))
    led = plain("led", "#E8FFF8", 0.4, emit="#D8FFF2", strength=6.0)
    bpy.ops.object.text_add(location=(x - 20.5, y - d / 2 - 1.8, h + 22.3), rotation=(math.radians(90), 0, 0))
    t = bpy.context.object
    t.data.body = "ALL SYSTEMS"
    t.data.size = 5.4
    t.data.materials.append(led)
    bpy.ops.object.text_add(location=(x - 20.5, y - d / 2 - 1.8, h + 15.6), rotation=(math.radians(90), 0, 0))
    t2 = bpy.context.object
    t2.data.body = "OPERATIONAL"
    t2.data.size = 5.4
    t2.data.materials.append(plain("led2", "#7FE3C8", 0.4, emit="#6FF0C8", strength=7.0))

# ---------------------------------------------------------------- billboards that change: (seconds, line 1, line 2, colour)
LED = {"you": "#7FE3C8", "openbrain": "#FF9A70", "deepthink": "#FFD08A", "soda": "#FF7AA8", "paper": "#8C877E"}


def board(host, states, grow=(), width=46, lift=0.0):
    """A rooftop LED board on building `host`, raised `lift` metres on taller legs so nearer towers do not hide it.
    states: [(t, line1, line2, colour key)]; grow: [(t, scale)], held."""
    x, y, h, w, d = HOSTS.get(host) or billboard_host
    h += lift
    bpy.ops.object.empty_add(location=(x, y - d / 2 - 1, h))
    root = bpy.context.object
    parts = [cube("board", (x, y - d / 2 - 1, h + 21), (width, 1.2, 15), plain("boardframe", "#15171C", 0.6))]
    parts += [cube("leg", (x + k, y - d / 2 - 1, h + 7 - lift / 2), (1.2, 1.2, 14 + lift), plain("legs", "#2A2C30")) for k in (-width * 0.3, width * 0.3)]
    for n, (t, l1, l2, col) in enumerate(states):
        mat = plain(f"led_{host}_{n}", "#E8FFF8", 0.4, emit=LED[col], strength=6.5)
        texts = []
        for body, z, size in ((l1, h + 22.3, 5.4), (l2, h + 16.0, 4.2)):
            bpy.ops.object.text_add(location=(x, y - d / 2 - 1.8, z), rotation=(math.radians(90), 0, 0))
            tx = bpy.context.object
            tx.data.body, tx.data.size, tx.data.align_x = body, size, "CENTER"
            tx.data.materials.append(mat)
            texts.append(tx)
        t_next = states[n + 1][0] if n + 1 < len(states) else None
        for tx in texts:   # shown from t until the next state
            tx.hide_render = n > 0
            tx.keyframe_insert("hide_render", frame=1)
            if n > 0:
                tx.hide_render = False
                tx.keyframe_insert("hide_render", frame=max(1, round(t * FPS)))
            if t_next is not None:
                tx.hide_render = True
                tx.keyframe_insert("hide_render", frame=round(t_next * FPS))
        parts += texts
    for part in parts:
        part.parent = root
        part.matrix_parent_inverse = root.matrix_world.inverted()
    edit = bpy.context.preferences.edit
    was, edit.keyframe_new_interpolation_type = edit.keyframe_new_interpolation_type, "CONSTANT"
    for t, sc in grow:   # a bigger board overnight: the jump is held, like a cut in a time-lapse
        root.scale = (sc, 1, sc)
        root.keyframe_insert("scale", frame=max(1, round(t * FPS)))
    edit.keyframe_new_interpolation_type = was


if VARIANT == "billboards":
    board((-5, 3), [(0, "KESTREL 4", "YOUR LAB", "you"), (1.0, "KESTREL 5", "SHIPPED EARLY", "you"), (4.4, "KESTREL 6", "BIGGER AGAIN", "you")],
          grow=[(0, 1.0), (1.0, 1.15), (4.4, 1.5)])
    board((-2, 5), [(0, "OPENBRAIN 6", "", "openbrain"), (2.4, "OPENBRAIN 7", "BIGGER", "openbrain"), (5.2, "OPENBRAIN 8", "BIGGEST", "openbrain")],
          grow=[(0, 0.9), (2.4, 1.3), (5.2, 1.7)], lift=12)
    board((-8, 6), [(0, "DEEPTHINK 3", "", "deepthink"), (3.5, "DEEPTHINK 4", "BIGGER STILL", "deepthink"), (5.8, "DEEPTHINK 5", "EVEN BIGGER", "deepthink")],
          grow=[(0, 0.9), (3.5, 1.4), (5.8, 1.8)])
elif VARIANT == "leftbehind":
    board((-2, 5), [(0, "OPENBRAIN 7", "THE FUTURE", "openbrain")], grow=[(0, 1.0), (1.6, 1.4), (3.2, 1.9), (4.8, 2.5)], lift=12)
    board((-5, 3), [(0, "KESTREL 4", "", "you"), (2.0, "", "", "paper"), (3.6, "FIZZ COLA", "NOW SUGAR FREE", "soda")])
elif VARIANT == "cascade":
    board((-5, 3), [(0, "KESTREL", "", "you")])
elif VARIANT == "numberone":
    for host in ((-5, 3), (-2, 5), (-8, 6), (0, 2)):
        board(host, [(0, "KESTREL 5", "NUMBER ONE", "you")])

# ---------------------------------------------------------------- sky, haze, light
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
for attr, val in (("sun_elevation", math.radians(-7.0 if VARIANT == "cascade" else 1.5)), ("sun_rotation", math.radians(SUN_ROT)), ("altitude", 40.0),
                  ("air_density", 1.6), ("aerosol_density", 2.5), ("sun_intensity", 0.6)):
    if hasattr(sky, attr):
        setattr(sky, attr, val)
wn.links.new(sky.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = SKY_STRENGTH

bpy.ops.object.light_add(type="SUN", rotation=(math.radians(88), 0, math.radians(220)))
sun = bpy.context.object
sun.data.energy = 3.5
sun.data.color = (1.0, 0.55, 0.35)

# ---------------------------------------------------------------- camera: a slow drift across the avenue, easing to a stop
bpy.ops.object.camera_add()
cam = bpy.context.object
cam.data.lens = 30
cam.data.dof.use_dof = False
scene.camera = cam
for frame, (cx, cy, cz), look_z in ((1, (-262, -160, 44), 58), (END, (-200, -176, 50), 62)):
    cam.location = (cx, cy, cz)
    look = (cx + 16, 400, look_z)
    dx, dy, dz = look[0] - cx, look[1] - cy, look[2] - cz
    cam.rotation_euler = (math.atan2(math.hypot(dx, dy), -dz), 0, math.atan2(dy, dx) - math.pi / 2)
    cam.keyframe_insert("location", frame=frame)
    cam.keyframe_insert("rotation_euler", frame=frame)

# ---------------------------------------------------------------- render settings
scene.render.resolution_x, scene.render.resolution_y = round(1920 * SCALE), round(1080 * SCALE)
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, END
scene.render.image_settings.file_format = "PNG"
ee = scene.eevee
for attr, val in (("taa_render_samples", 24), ("use_volumetric_shadows", False), ("volumetric_tile_size", "4"), ("volumetric_end", 1600.0), ("volumetric_start", 5.0)):
    if hasattr(ee, attr):
        try:
            setattr(ee, attr, val)
        except (TypeError, AttributeError):
            pass
try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
except TypeError:
    pass
scene.view_settings.exposure = 0.4

frames = [1, 80, SHOT_END, END - 24] if STILL else range(1, END + 1)
for f in frames:
    scene.frame_set(f)
    vals = [n.outputs[0].default_value for m in bpy.data.materials if m.node_tree for n in m.node_tree.nodes if n.type == "VALUE"]
    print("WAVE", f, sorted(set(round(v, 1) for v in vals)))
    scene.render.filepath = f"{OUT}/f_{f:04d}.png"
    bpy.ops.render.render(write_still=True)
print("DONE", len(list(frames)))
