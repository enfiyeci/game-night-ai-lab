"""Cinematic ending test, Blender version: 'A quiet takeover' as a small 3D diorama in the K2 palette.

Run headless:  Blender -b --factory-startup -P blender_quiet_takeover.py -- <out_dir> [preview]
Renders PNG frames to <out_dir>/f_####.png (ffmpeg joins them). 'preview' renders 4 stills only.
"""
import math
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/qt"
PREVIEW = len(argv) > 1 and argv[1] == "preview"

FPS, SECONDS = 24, 12
END = FPS * SECONDS

# K2 tokens (sRGB hex) -> linear
def hexlin(h):
    h = h.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)

CREAM, PAPER, INK = "#F1E4C8", "#FFFBF1", "#2E2A2B"
TEAL, WOOD, CORAL, SKY = "#3F9C8F", "#C8864C", "#E0613B", "#3F84C6"
FLOORWOOD, SKIN, SKIN2 = "#D9A274", "#E7B48F", "#8D5A3B"

scene = bpy.context.scene
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)

# ---------- materials ----------
_mats = {}
def mat(name, hexcol, rough=0.7, emit=None, strength=0.0):
    key = (name, hexcol, emit, strength)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = hexlin(hexcol)
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = hexlin(emit)
        bsdf.inputs["Emission Strength"].default_value = strength
    _mats[key] = m
    return m

def box(name, loc, size, material, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new("bevel", "BEVEL")
    bev.width = min(0.02, min(size) / 4)
    bev.segments = 2
    o.data.materials.append(material)
    if parent:
        o.parent = parent
    return o

def sphere(name, loc, r, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.shade_smooth()
    o.data.materials.append(material)
    return o

# ---------- room ----------
W, D = 11.0, 8.0
box("floor", (0, 0, -0.1), (W, D, 0.2), mat("floor", FLOORWOOD, 0.55))
box("wall_back", (0, D / 2, 1.4), (W, 0.2, 2.8), mat("wall", CREAM, 0.9))
box("wall_right", (W / 2, 0, 1.4), (0.2, D, 2.8), mat("wall", CREAM, 0.9))
box("trim_back", (0, D / 2 - 0.11, 0.06), (W, 0.04, 0.12), mat("trim", WOOD))
box("trim_right", (W / 2 - 0.11, 0, 0.06), (0.04, D, 0.12), mat("trim", WOOD))
# window band on the left wall (the city outside, dusk haze)
box("window", (-2.6, D / 2 - 0.12, 1.55), (4.4, 0.03, 1.3), mat("window", SKY, 0.2, emit="#9DB9D6", strength=0.6))
# constitution frame and whiteboard on the back wall
box("frame", (0.9, D / 2 - 0.12, 1.75), (0.7, 0.04, 0.9), mat("frame", PAPER, emit=PAPER, strength=0.05))
box("board", (2.9, D / 2 - 0.12, 1.6), (2.2, 0.04, 1.0), mat("board", PAPER))
# rug under the CEO desk
box("rug", (0.4, -2.1, 0.005), (3.4, 2.4, 0.01), mat("rug", "#F0B89A", 0.95))

# racks on the right, LED strips
led_mats = [mat("led_sky", INK, emit=SKY, strength=6.0), mat("led_coral", INK, emit=CORAL, strength=5.0)]
for i in range(3):
    x = W / 2 - 0.6
    y = -1.2 - i * 0.95
    box(f"rack{i}", (x, y, 1.1), (0.9, 0.8, 2.2), mat("rack", INK, 0.4))
    for k in range(7):
        box(f"led{i}_{k}", (x - 0.46, y + (k % 2) * 0.2 - 0.1, 0.35 + k * 0.26), (0.02, 0.45, 0.03), led_mats[k % 2])

# ---------- workstations ----------
SHIRTS = [CORAL, SKY, TEAL, PAPER, "#8E6FB0", WOOD, TEAL]
screen_mat = mat("screen", INK, 0.3, emit=SKY, strength=4.0)
monitors = []
people = []
def workstation(name, x, y, shirt, skin, rot=0.0, big=False, sitter=True):
    root = bpy.data.objects.new(name, None)
    scene.collection.objects.link(root)
    # children are placed in world space; the root stays at the origin
    dw = 1.9 if big else 1.4
    box(name + "_top", (x, y, 0.75), (dw, 0.75, 0.05), mat("desk", WOOD, 0.5), root)
    for s in (-1, 1):
        box(name + "_leg", (x + s * (dw / 2 - 0.04), y, 0.37), (0.06, 0.7, 0.74), mat("desk", WOOD, 0.5), root)
    box(name + "_mon", (x - 0.2, y + 0.22, 1.02), (0.62, 0.04, 0.38), mat("monitor", INK, 0.3), root)
    scr = box(name + "_scr", (x - 0.2, y + 0.195, 1.02), (0.56, 0.01, 0.32), screen_mat, root)
    monitors.append(scr)
    # chair behind the desk (the sitter faces +y toward the monitor)
    box(name + "_seat", (x, y - 0.65, 0.48), (0.5, 0.5, 0.08), mat("chair", INK, 0.6), root)
    box(name + "_back", (x, y - 0.9, 0.85), (0.5, 0.08, 0.7), mat("chair", INK, 0.6), root)
    if sitter:
        sm = mat("shirt_" + shirt, shirt, 0.8)
        body = box(name + "_torso", (x, y - 0.6, 0.86), (0.44, 0.26, 0.5), sm)
        body.modifiers["bevel"].width = 0.1
        body.modifiers["bevel"].segments = 4
        arms = [box(name + f"_arm{k}", (x + k * 0.2, y - 0.32, 0.86), (0.1, 0.42, 0.1), sm) for k in (-1, 1)]
        legs = box(name + "_legs", (x, y - 0.35, 0.56), (0.38, 0.5, 0.14), mat("trousers", INK, 0.8))
        head = sphere(name + "_head", (x, y - 0.6, 1.3), 0.15, mat("skin_" + skin, skin, 0.6))
        hair = sphere(name + "_hair", (x, y - 0.63, 1.37), 0.155, mat("hair", INK, 0.8), (1, 1, 0.72))
        grp = bpy.data.objects.new(name + "_sitter", None)
        scene.collection.objects.link(grp)
        for o in (body, head, hair, legs, *arms):
            o.parent = grp
        people.append(grp)
        return root, grp
    return root, None

LAYOUT = [
    ("policy", -3.4, 0.2, 0), ("research", -3.0, 2.3, 0), ("safety", -0.8, 1.1, 0),
    ("r1", 1.2, 2.6, 0), ("r2", 2.9, 2.2, 0), ("r3", 3.2, 0.4, 0), ("cfo", 1.9, -0.6, 0),
]
for i, (n, x, y, r) in enumerate(LAYOUT):
    workstation(n, x, y, SHIRTS[i % len(SHIRTS)], SKIN if i % 3 else SKIN2, r)
_, ceo = workstation("ceo", 0.4, -2.0, INK, SKIN, big=True)

# ---------- lights and world ----------
world = bpy.data.worlds.new("w")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = hexlin("#3A3230")
bg.inputs["Strength"].default_value = 0.35

bpy.ops.object.light_add(type="AREA", location=(0, 0, 5.5))
keylight = bpy.context.object
keylight.data.shape = "RECTANGLE"
keylight.data.size, keylight.data.size_y = 8, 6
keylight.data.color = hexlin("#FFE9C8")[:3]
keylight.data.energy = 1400

bpy.ops.object.light_add(type="SUN", location=(-6, -4, 6))
sun = bpy.context.object
sun.rotation_euler = (math.radians(55), 0, math.radians(-40))
sun.data.energy = 2.2
sun.data.color = hexlin("#FFE2BD")[:3]

# ---------- Lumen robot ----------
bot = bpy.data.objects.new("lumen", None)
scene.collection.objects.link(bot)
shell = sphere("bot_shell", (0, 0, 0), 0.22, mat("bot", PAPER, 0.35, emit=PAPER, strength=0.6))
ring = None
bpy.ops.mesh.primitive_torus_add(major_radius=0.235, minor_radius=0.03, location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
ring = bpy.context.object
ring.data.materials.append(mat("bot_ring", SKY, 0.3, emit=SKY, strength=8.0))
eyes = [sphere(f"bot_eye{s}", (s * 0.07, -0.2, 0.04), 0.03, mat("eye", INK), (1, 0.5, 1.6)) for s in (-1, 1)]
ant = sphere("bot_ant", (0, 0, 0.33), 0.035, mat("bot_ring", SKY, 0.3, emit=SKY, strength=8.0))
bpy.ops.object.light_add(type="POINT", location=(0, -0.3, 0))
glowlight = bpy.context.object
glowlight.data.color = hexlin(SKY)[:3]
glowlight.data.energy = 60
for o in (shell, ring, ant, glowlight, *eyes):
    o.parent = bot

# ---------- camera ----------
bpy.ops.object.camera_add()
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 40
cam.data.dof.use_dof = True
cam.data.dof.aperture_fstop = 2.2
target = bpy.data.objects.new("focus", None)
scene.collection.objects.link(target)
target.location = (0.4, -2.2, 1.0)
cam.data.dof.focus_object = target
track = cam.constraints.new("TRACK_TO")
track.target = target
track.track_axis = "TRACK_NEGATIVE_Z"
track.up_axis = "UP_Y"

# ---------- animation ----------
def key(obj, path, frame, value, index=None):
    if index is None:
        setattr(obj, path, value)
        obj.keyframe_insert(data_path=path, frame=frame)
    else:
        getattr(obj, path)[index] = value
        obj.keyframe_insert(data_path=path, index=index, frame=frame)

# camera: slow dolly and arc toward the CEO desk
key(cam, "location", 1, (-7.5, -9.5, 7.2))
key(cam, "location", END, (-2.6, -6.2, 3.1))
key(target, "location", 1, (0.2, 0.0, 0.6))
key(target, "location", int(END * 0.75), (0.4, -2.0, 1.1))

# the room light fades out

def energy(light, frame, value):
    light.data.energy = value
    light.data.keyframe_insert(data_path="energy", frame=frame)

area = [o for o in scene.objects if o.type == "LIGHT" and o.data.type == "AREA"][0]
energy(area, 1, 1400)
energy(area, int(FPS * 1.5), 1400)
energy(area, int(FPS * 7.5), 90)
energy(sun, 1, 2.2)
energy(sun, int(FPS * 7.5), 0.25)

# staff leave one by one: slide back from the desk, then vanish
def leave(grp, t0, dx, dy):
    key(grp, "location", t0, (0, 0, 0))
    key(grp, "location", t0 + 14, (dx, dy, 0))
    for ch in grp.children:
        ch.hide_render = False
        ch.keyframe_insert(data_path="hide_render", frame=t0 + 13)
        ch.hide_render = True
        ch.keyframe_insert(data_path="hide_render", frame=t0 + 14)
        ch.hide_render = False

for i, grp in enumerate(people[:-1]):
    leave(grp, int(FPS * (2.2 + i * 0.7)), -0.35, -0.5)
leave(ceo, int(FPS * 7.4), -0.4, -0.4)

# monitors all flare together once Lumen sits down
screen_bsdf = next(n for n in screen_mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
def screen(frame, v):
    screen_bsdf.inputs["Emission Strength"].default_value = v
    screen_bsdf.inputs["Emission Strength"].keyframe_insert("default_value", frame=frame)
screen(1, 4.0)
screen(int(FPS * 10.8), 4.5)
screen(int(FPS * 11.1), 16.0)
screen(END, 9.0)

# Lumen floats in from the racks and settles above the CEO chair
path = [(8.0, (4.4, 1.6, 1.9)), (9.2, (2.6, -0.6, 1.5)), (10.6, (0.4, -2.62, 1.5)), (12.0, (0.4, -2.65, 1.54))]
key(bot, "scale", int(FPS * 7.9), (0.001, 0.001, 0.001))
key(bot, "scale", int(FPS * 8.2), (1, 1, 1))
for t, loc in path:
    key(bot, "location", int(FPS * t), loc)
key(bot, "rotation_euler", int(FPS * 8.0), (0, 0, math.radians(40)))
key(bot, "rotation_euler", int(FPS * 10.6), (0, 0, math.radians(-30)))


# ---------- render settings ----------
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try:
        scene.render.engine = eng
        break
    except TypeError:
        continue
scene.render.resolution_x, scene.render.resolution_y = 1280, 800
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, END
try:
    scene.eevee.taa_render_samples = 32
except AttributeError:
    pass
for attr, val in (("use_raytracing", True), ("use_shadows", True)):
    if hasattr(scene.eevee, attr):
        try:
            setattr(scene.eevee, attr, val)
        except Exception:
            pass
try:
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
except TypeError:
    pass

# bloom through the compositor (glare node)
try:
    tree = None
    if hasattr(scene, "compositing_node_group"):
        tree = bpy.data.node_groups.new("comp", "CompositorNodeTree")
        scene.compositing_node_group = tree
        rl = tree.nodes.new("CompositorNodeRLayers")
        glare = tree.nodes.new("CompositorNodeGlare")
        out = tree.nodes.new("NodeGroupOutput")
        tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        tree.links.new(rl.outputs["Image"], glare.inputs[0])
        tree.links.new(glare.outputs[0], out.inputs[0])
    else:
        scene.use_nodes = True
        tree = scene.node_tree
        rl = tree.nodes.get("Render Layers") or tree.nodes.new("CompositorNodeRLayers")
        comp = tree.nodes.get("Composite") or tree.nodes.new("CompositorNodeComposite")
        glare = tree.nodes.new("CompositorNodeGlare")
        tree.links.new(rl.outputs["Image"], glare.inputs[0])
        tree.links.new(glare.outputs[0], comp.inputs[0])
    for name, val in (("glare_type", "BLOOM"), ("quality", "HIGH"), ("threshold", 0.8), ("size", 7)):
        try:
            setattr(glare, name, val)
        except Exception:
            pass
    for sock_name, val in (("Type", "Bloom"), ("Threshold", 0.8), ("Size", 0.6), ("Strength", 0.9)):
        s = glare.inputs.get(sock_name) if hasattr(glare.inputs, "get") else None
        if s is not None:
            try:
                s.default_value = val
            except Exception:
                pass
except Exception as e:
    print("compositor skipped:", e)

scene.render.image_settings.file_format = "PNG"
if PREVIEW:
    for f in (1, int(FPS * 5), int(FPS * 9.5), END):
        scene.frame_set(f)
        scene.render.filepath = f"{OUT}/preview_{f:04d}.png"
        bpy.ops.render.render(write_still=True)
else:
    scene.render.filepath = f"{OUT}/f_"
    bpy.ops.render.render(animation=True)
print("DONE")
