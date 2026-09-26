"""Shared helpers for the ending films' Blender scenes (tools/endings/blender/<scene>.py).

A scene script is run headless by render.sh as: Blender -b --factory-startup -P <scene>.py -- <out_dir> <still|full> [key=value ...]
and writes <out_dir>/f_####.png. Colours are the game's K2 tokens (ui/styles.css), converted to linear RGB.
"""
import sys

import bpy

TOKENS = {"cream": "#F1E4C8", "paper": "#FFFBF1", "ink": "#2E2A2B", "teal": "#3F9C8F", "wood": "#C8864C",
          "coral": "#E0613B", "sky": "#3F84C6"}


def args():
    """(out_dir, still, options) from the command line after '--'."""
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = argv[0] if argv else "/tmp/scene"
    still = len(argv) > 1 and argv[1] == "still"
    opts = dict(a.split("=", 1) for a in argv[2:] if "=" in a)
    return out, still, opts


def lin(h):
    """A hex colour (or a token name) as linear RGBA."""
    h = TOKENS.get(h, h).lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c], 1.0)


def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        n.inputs[k].default_value = v
    return n


def math(nt, op, a, b=None):
    """A Math node: a and b are sockets or numbers. Returns the output socket."""
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]


def clock(nt, end_frame, fps=24):
    """A Value node that reads the time in seconds, keyed linearly over the whole take."""
    edit = bpy.context.preferences.edit
    was, edit.keyframe_new_interpolation_type = edit.keyframe_new_interpolation_type, "LINEAR"
    v = nt.nodes.new("ShaderNodeValue")
    for frame in (1, end_frame):
        v.outputs[0].default_value = (frame - 1) / fps
        v.outputs[0].keyframe_insert("default_value", frame=frame)
    edit.keyframe_new_interpolation_type = was
    return v.outputs[0]


def obj_attr(nt, name):
    a = nt.nodes.new("ShaderNodeAttribute")
    a.attribute_type = "OBJECT"
    a.attribute_name = name
    return a


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


def clear_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)


def render_settings(scene, end, scale=1.0, samples=24, exposure=0.0):
    scene.render.resolution_x, scene.render.resolution_y = round(1920 * scale), round(1080 * scale)
    scene.render.fps = 24
    scene.frame_start, scene.frame_end = 1, end
    scene.render.image_settings.file_format = "PNG"
    ee = scene.eevee
    if hasattr(ee, "taa_render_samples"):
        ee.taa_render_samples = samples
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    scene.view_settings.exposure = exposure


def render(scene, out, frames):
    for f in frames:
        scene.frame_set(f)
        scene.render.filepath = f"{out}/f_{f:04d}.png"
        bpy.ops.render.render(write_still=True)
    print("DONE", len(list(frames)))


def look_at(cam, target):
    from mathutils import Vector
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
