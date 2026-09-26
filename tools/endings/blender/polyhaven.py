"""Fetch CC0 assets from Poly Haven (polyhaven.com) for the ending scenes, and load them into Blender.

Assets are downloaded once into a cache outside the repo (AI_LAB_ASSETS, default ~/.cache/ai-lab-endings/polyhaven)
so the repo holds only the scene scripts and the finished renders. Every asset is CC0 (public domain).

  model("plastic_monobloc_chair_01")       -> the imported root objects (glTF, 1k textures by default)
  hdri("modern_evening_street", strength)  -> sets the world lighting
  texture("terrazzo_tiles", scale)          -> a Principled material using the texture's colour, normal and roughness maps
"""
import json
import os
import urllib.request

import bpy

CACHE = os.path.expanduser(os.environ.get("AI_LAB_ASSETS", "~/.cache/ai-lab-endings/polyhaven"))
API = "https://api.polyhaven.com/files/"


def _get(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "ai-lab-endings/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest + ".part", "wb") as f:
        f.write(r.read())
    os.replace(dest + ".part", dest)
    return dest


def _files(asset):
    path = os.path.join(CACHE, asset, "files.json")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        req = urllib.request.Request(API + asset, headers={"User-Agent": "ai-lab-endings/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
            f.write(r.read())
    with open(path) as f:
        return json.load(f)


def model(asset, res="1k", collection=None):
    """Import a Poly Haven model (glTF) and return its top-level objects."""
    entry = _files(asset)["gltf"][res]["gltf"]
    root = os.path.join(CACHE, asset, res)
    main = _get(entry["url"], os.path.join(root, os.path.basename(entry["url"])))
    for rel, inc in entry.get("include", {}).items():
        _get(inc["url"], os.path.join(root, rel))
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=main)
    new = [o for o in bpy.data.objects if o not in before]
    if collection:
        for o in new:
            for c in o.users_collection:
                c.objects.unlink(o)
            collection.objects.link(o)
    return [o for o in new if o.parent is None or o.parent not in new]


def hdri(asset, strength=1.0, res="2k", rotation=0.0):
    entry = _files(asset)["hdri"][res]["hdr"]
    path = _get(entry["url"], os.path.join(CACHE, asset, os.path.basename(entry["url"])))
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Rotation"].default_value[2] = rotation
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(path, check_existing=True)
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return bg


def texture(asset, scale=1.0, res="2k", name=None, tint=None):
    """A material from a Poly Haven texture set (box-projected in object space, so no UVs are needed)."""
    files = _files(asset)
    maps = {}
    for key, kind in (("Diffuse", "diff"), ("nor_gl", "nor"), ("Rough", "rough")):
        if key in files and res in files[key]:
            fmt = "jpg" if "jpg" in files[key][res] else next(iter(files[key][res]))
            url = files[key][res][fmt]["url"]
            maps[kind] = _get(url, os.path.join(CACHE, asset, os.path.basename(url)))
    m = bpy.data.materials.new(name or asset)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (scale, scale, scale)
    nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])

    def img(path, colour):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(path, check_existing=True)
        t.image.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        t.projection = "BOX"
        t.projection_blend = 0.2
        nt.links.new(mapping.outputs["Vector"], t.inputs["Vector"])
        return t

    if "diff" in maps:
        d = img(maps["diff"], True)
        if tint:
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            nt.links.new(d.outputs["Color"], mix.inputs[6])
            mix.inputs[7].default_value = tint
            nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
        else:
            nt.links.new(d.outputs["Color"], bsdf.inputs["Base Color"])
    if "rough" in maps:
        nt.links.new(img(maps["rough"], False).outputs["Color"], bsdf.inputs["Roughness"])
    if "nor" in maps:
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(img(maps["nor"], False).outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return m
