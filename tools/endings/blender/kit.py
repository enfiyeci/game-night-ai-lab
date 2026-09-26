"""The cinematic look for the ending stills (owner's pick B, 2026-09-26): real materials and light, an eye-level lens,
people kept as silhouettes. Shared by every set script in this folder (set_<place>.py).

A set script builds one place, then dresses and frames it once per shot:

    import kit
    def shot_triage(k): ...          # dress the set, then k.camera(...)
    kit.run({"mis-triage": shot_triage, ...})

and is rendered by still.sh, headless:
    Blender -b --factory-startup -P set_hospital.py -- <out_dir> shot=<name>|all [samples=N] [scale=S] [blend=1]

Each shot writes <out_dir>/<name>.png and <out_dir>/<name>.json: {"w", "h", "screens": {<screen>: [[x, y] x4]}},
where a screen's corners (top-left, top-right, bottom-right, bottom-left, in image pixels) let the player lay a live
screen design over it (ui/endings/player.js). Colours are hex or the game's K2 tokens.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
import polyhaven as PH  # noqa: E402

FONT = "/System/Library/Fonts/Supplemental/DIN Alternate Bold.ttf"
FONT_COND = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SCREENS = os.path.join(ROOT, "tools", "endings", "screens")   # plate PNGs made by tools/endings/plate_png.sh


def lin(h):
    """A hex colour (#rgb or #rrggbb) or a K2 token name as linear RGBA."""
    if isinstance(h, str) and h.startswith("#") and len(h) == 4:
        h = "#" + "".join(c * 2 for c in h[1:])
    return C.lin(h)


def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = argv[0] if argv else "/tmp/stills"
    opts = dict(a.split("=", 1) for a in argv[1:] if "=" in a)
    return out, opts


# ------------------------------------------------------------------ materials
_mats = {}


def mat(hexcol, rough=0.5, metal=0.0, emit=None, strength=0.0, alpha=1.0, name=None, coat=0.0):
    key = (hexcol, rough, metal, emit, strength, alpha, name, coat)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name or f"m{len(_mats)}")
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = lin(hexcol)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = lin(emit)
        b.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
    _mats[key] = m
    return m


def emission(hexcol, strength=1.0, name=None):
    m = bpy.data.materials.new(name or "emit")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = lin(hexcol)
    e.inputs["Strength"].default_value = strength
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs[0], o.inputs["Surface"])
    return m


def glass(rough=0.02, tint="#E4EEEC", name="glass"):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = lin(tint)
    b.inputs["Transmission Weight"].default_value = 1.0
    b.inputs["Roughness"].default_value = rough
    b.inputs["IOR"].default_value = 1.45
    return m


def screen_mat(image, strength=1.4, name=None, fallback="#101418", crop=None):
    """An emissive screen showing a PNG (a path, or a name in tools/endings/screens/). Glossy glass on top."""
    path = image if os.path.isabs(image) else os.path.join(SCREENS, f"{image}.png")
    m = bpy.data.materials.new(name or f"screen-{os.path.basename(path)}")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = strength
    if os.path.exists(path):
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(path, check_existing=True)
        tex.extension = "CLIP"
        uv = nt.nodes.new("ShaderNodeTexCoord")
        if crop:   # show only the crop (x, y, w, h in the 1280 x 720 plate) across the screen
            cx, cy, cw, ch = crop
            mp = nt.nodes.new("ShaderNodeMapping")
            mp.inputs["Scale"].default_value = (cw / 1280, ch / 720, 1)
            mp.inputs["Location"].default_value = (cx / 1280, 1 - (cy + ch) / 720, 0)
            nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])
            nt.links.new(mp.outputs["Vector"], tex.inputs["Vector"])
        else:
            nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
        nt.links.new(tex.outputs["Color"], emit.inputs["Color"])
    else:
        print("SCREEN IMAGE MISSING", path)
        emit.inputs["Color"].default_value = lin(fallback)
    gloss = nt.nodes.new("ShaderNodeBsdfGlossy")
    gloss.inputs["Roughness"].default_value = 0.08
    fres = nt.nodes.new("ShaderNodeFresnel")
    fres.inputs["IOR"].default_value = 1.5
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(fres.outputs[0], mix.inputs[0])
    nt.links.new(emit.outputs[0], mix.inputs[1])
    nt.links.new(gloss.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m


def tex(asset, scale=1.0, tint=None, rough=None, name=None):
    m = PH.texture(asset, scale, name=name or asset, tint=lin(tint) if isinstance(tint, str) else tint)
    if rough is not None:
        b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        for link in list(m.node_tree.links):
            if link.to_socket == b.inputs["Roughness"]:
                m.node_tree.links.remove(link)
        b.inputs["Roughness"].default_value = rough
    return m


# ------------------------------------------------------------------ geometry
def _finish(o, material, name):
    o.name = name
    if material is not None:
        o.data.materials.append(material)
    return o


def box(loc, size, material=None, bevel=0.0, rot=(0, 0, 0), name="box"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        m = o.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = 3
        m.limit_method = "ANGLE"
    return _finish(o, material, name)


def cyl(loc, r, h, material=None, rot=(0, 0, 0), verts=32, r2=None, name="cyl", smooth=True):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r if r2 is None else r2, depth=h, location=loc, rotation=rot)
    o = bpy.context.object
    if smooth:
        bpy.ops.object.shade_smooth()
    return _finish(o, material, name)


def sphere(loc, r, material=None, name="sphere", scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.object
    o.scale = scale
    bpy.ops.object.shade_smooth()
    return _finish(o, material, name)


def plane(loc, size, material=None, rot=(0, 0, 0), name="plane"):
    """A w x h rectangle (UV 0-1) facing +z before rotation; rot=(90deg, 0, 0) makes it face -y."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = (size[0], size[1], 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, material, name)


def text(body, loc, size, material, font=FONT, align="CENTER", rot=(math.radians(90), 0, 0), spacing=1.0, extrude=0.001,
         valign="CENTER", name="text"):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.font = bpy.data.fonts.load(font, check_existing=True)
    cu.size = size
    cu.align_x = align
    cu.align_y = valign
    cu.space_character = spacing
    cu.extrude = extrude
    o = bpy.data.objects.new(name, cu)
    o.location = loc
    o.rotation_euler = rot
    o.data.materials.append(material)
    bpy.context.scene.collection.objects.link(o)
    return o


def place(asset, loc, rot_z=0.0, scale=1.0, rot=None):
    """Import a Poly Haven model at loc; returns its root objects (empty list if the download failed)."""
    try:
        roots = PH.model(asset)
    except Exception as error:
        print("ASSET FAILED", asset, error)
        return []
    for r in roots:
        r.location = Vector(loc)
        r.rotation_euler = rot or (0, 0, rot_z)
        r.scale = (scale,) * 3
    return roots


def recolour(objs, material):
    for o in objs:
        for ob in [o, *o.children_recursive]:
            if ob.type == "MESH":
                ob.data.materials.clear()
                ob.data.materials.append(material)


def screen(name, center, width, image, crop=(0, 0, 1280, 720), rot=(math.radians(90), 0, 0), strength=1.4,
           bezel="#1A1B1D", depth=0.03, border=0.015, live=True):
    """A display showing a plate (a crop of it): a bezel box with an emissive face, width metres wide; its height
    follows the crop's shape so a live overlay fits it exactly. rot=(90deg, 0, 0) faces -y. Registered as a live
    screen (see run()) unless live is False."""
    cw, ch = crop[2], crop[3]
    w, h = width, width * ch / cw
    frame = box(center, (w + 2 * border, h + 2 * border, depth), mat(bezel, 0.35), bevel=0.003, rot=rot, name=f"{name}-bezel")
    face = plane(center, (w, h), screen_mat(image, strength, crop=crop), rot=rot, name=f"{name}-face")
    bpy.context.view_layer.update()
    n = face.matrix_world.to_3x3() @ Vector((0, 0, 1))
    face.location = Vector(center) + n.normalized() * (depth / 2 + 0.0015)
    if live:
        LIVE[name] = (face, list(crop))
    return face, frame


# ------------------------------------------------------------------ lights and camera
def area(loc, target, size=(1, 1), energy=100, color=(1, 1, 1), name="area", spread=None):
    bpy.ops.object.light_add(type="AREA", location=loc)
    L = bpy.context.object
    L.name = name
    L.data.shape = "RECTANGLE"
    L.data.size, L.data.size_y = size
    L.data.energy = energy
    L.data.color = color
    if spread:
        L.data.spread = spread
    C.look_at(L, target)
    return L


def point(loc, energy=50, color=(1, 1, 1), radius=0.05, name="point"):
    bpy.ops.object.light_add(type="POINT", location=loc)
    L = bpy.context.object
    L.name = name
    L.data.energy = energy
    L.data.color = color
    L.data.shadow_soft_size = radius
    return L


def spot(loc, target, energy=500, color=(1, 1, 1), angle=60, blend=0.5, radius=0.1, name="spot"):
    bpy.ops.object.light_add(type="SPOT", location=loc)
    L = bpy.context.object
    L.name = name
    L.data.energy = energy
    L.data.color = color
    L.data.spot_size = math.radians(angle)
    L.data.spot_blend = blend
    L.data.shadow_soft_size = radius
    C.look_at(L, target)
    return L


def sun(rot_deg, energy=3.0, color=(1, 1, 1), angle=1.0):
    bpy.ops.object.light_add(type="SUN", rotation=tuple(math.radians(a) for a in rot_deg))
    L = bpy.context.object
    L.data.energy = energy
    L.data.color = color
    L.data.angle = math.radians(angle)
    return L


def kelvin(k):
    """Approximate RGB for a colour temperature (1000-12000 K)."""
    t = k / 100
    r = 255 if t <= 66 else 329.7 * (t - 60) ** -0.1332
    g = 99.47 * math.log(t) - 161.1 if t <= 66 else 288.1 * (t - 60) ** -0.0755
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5 * math.log(t - 10) - 305.0)
    return tuple(max(0, min(255, v)) / 255 for v in (r, g, b))


def world(color="#0B0D12", strength=1.0, hdri=None, rotation=0.0):
    if hdri:
        return PH.hdri(hdri, strength, rotation=math.radians(rotation))
    w = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background") or next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = lin(color)
    bg.inputs["Strength"].default_value = strength
    return bg


def haze(center, size, density=0.01, color="#FFFFFF", anisotropy=0.3):
    o = box(center, size, None, name="haze")
    m = bpy.data.materials.new("haze")
    m.use_nodes = True
    m.node_tree.nodes.clear()
    v = m.node_tree.nodes.new("ShaderNodeVolumePrincipled")
    v.inputs["Density"].default_value = density
    v.inputs["Color"].default_value = lin(color)
    v.inputs["Anisotropy"].default_value = anisotropy
    out = m.node_tree.nodes.new("ShaderNodeOutputMaterial")
    m.node_tree.links.new(v.outputs[0], out.inputs["Volume"])
    o.data.materials.append(m)
    o.visible_shadow = False
    return o


_cam = None


def camera(loc, target, lens=35, fstop=None, focus=None, shift=(0, 0), roll=0.0):
    """Frame the shot. focus is a point (or object) for depth of field; fstop None keeps everything sharp."""
    global _cam
    scene = bpy.context.scene
    if _cam is None:
        bpy.ops.object.camera_add()
        _cam = bpy.context.object
        scene.camera = _cam
    cam = _cam
    cam.location = loc
    C.look_at(cam, target)
    cam.rotation_euler.rotate_axis("Z", math.radians(roll))
    cam.data.lens = lens
    cam.data.sensor_width = 36
    cam.data.shift_x, cam.data.shift_y = shift
    cam.data.clip_end = 2000
    cam.data.dof.use_dof = fstop is not None
    if fstop is not None:
        cam.data.dof.aperture_fstop = fstop
        f = focus if focus is not None else target
        f = f.location if hasattr(f, "location") else Vector(f)
        cam.data.dof.focus_distance = (Vector(f) - Vector(loc)).length
    return cam


# ------------------------------------------------------------------ render
LIVE = {}


def setup(samples=192, scale=1.0, exposure=0.0, look="AgX - Medium High Contrast"):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = "GPU"
    except Exception as error:
        print("GPU unavailable:", error)
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 8
    scene.cycles.transparent_max_bounces = 16
    scene.cycles.blur_glossy = 0.5          # fewer fireflies from small bright lights
    scene.cycles.sample_clamp_indirect = 6
    scene.render.resolution_x, scene.render.resolution_y = round(1920 * scale), round(1080 * scale)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = look
    except TypeError:
        pass
    scene.view_settings.exposure = exposure
    scene.render.film_transparent = False


def screen_quads():
    from bpy_extras.object_utils import world_to_camera_view
    scene = bpy.context.scene
    w, h = scene.render.resolution_x, scene.render.resolution_y
    out = {}
    for name, (face, crop) in LIVE.items():
        if not face.visible_get():
            continue
        mw = face.matrix_world
        # plane corners in local space: (-.5,.5) top-left ... in the plane's own UV orientation
        corners = [Vector((-0.5, 0.5, 0)), Vector((0.5, 0.5, 0)), Vector((0.5, -0.5, 0)), Vector((-0.5, -0.5, 0))]
        quad = []
        for c in corners:
            p = world_to_camera_view(scene, scene.camera, mw @ c)
            quad.append([round(p.x * w, 1), round((1 - p.y) * h, 1)])
        out[name] = {"quad": quad, "crop": crop}
    return out


def reset():
    """Remove everything, for a set script that builds each shot from scratch."""
    global _cam
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    _cam = None
    LIVE.clear()


def run(shots, build=None):
    """shots: {name: fn()}. Each fn builds or dresses the scene and sets the camera. build() runs before each shot."""
    out, opts = args()
    os.makedirs(out, exist_ok=True)
    wanted = opts.get("shot", "all")
    names = list(shots) if wanted == "all" else wanted.split(",")
    for name in names:
        reset()
        setup(int(opts.get("samples", 192)), float(opts.get("scale", 1.0)))
        if build:
            build(name)
        shots[name]()
        scene = bpy.context.scene
        if opts.get("blend"):
            bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, f"{name}.blend"))
        scene.render.filepath = os.path.join(out, f"{name}.png")
        bpy.ops.render.render(write_still=True)
        with open(os.path.join(out, f"{name}.json"), "w") as f:
            json.dump({"w": scene.render.resolution_x, "h": scene.render.resolution_y, "screens": screen_quads()}, f)
        print("STILL", name)
