"""The Earth from orbit at night, from NASA's Blue Marble (day) and Black Marble (city lights) images, public domain,
cached by fetch_nasa() outside the repo. Data-centre dots glow on it in the labs' colours. A globe that changes over
its shot is rendered as several frames from one camera at moments T of the old clip's timing (the player crossfades
them). Shots:

  qt-globe-1..3   A quiet takeover, Month 9: backups of the model appear in data centres, faster and faster.
  ab-globe-1..3   Absorbed, Year 1: every lab's data centres in its colour; yours turn Azuria's, one by one.
  rd-globe-1..3   Someone else's disaster, Day 2: the rival's agent copies itself from one region to everywhere.
  ov-globe-1..3   Overtaken, Year 1: the leader's colour spreads from its home and takes the others' centres.
  pd-globe        A negotiated pace, Year 1: the data centres hold steady on a quiet planet.
The last frame of each (and pd-globe) is also that film's title still.
"""
import math
import os
import random
import sys
import urllib.request

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

NASA = os.path.expanduser("~/.cache/ai-lab-endings/nasa")
DAY = ("blue_marble_5400.jpg", "https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74218/world.200412.3x5400x2700.jpg")
NIGHT = ("black_marble_2016_3km.jpg", "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg")


def fetch_nasa(name, url):
    path = os.path.join(NASA, name)
    if not os.path.exists(path):
        os.makedirs(NASA, exist_ok=True)
        urllib.request.urlretrieve(url, path + ".part")
        os.replace(path + ".part", path)
    return path


def night_map():
    """The Black Marble at 8192 x 4096 (the 13500-pixel original costs memory for no visible gain)."""
    small = os.path.join(NASA, "black_marble_8k.jpg")
    if not os.path.exists(small):
        big = fetch_nasa(*NIGHT)
        img = bpy.data.images.load(big)
        img.scale(8192, 4096)
        img.filepath_raw = small
        img.file_format = "JPEG"
        img.save()
        bpy.data.images.remove(img)
    return small


def sphere_point(lon, lat, r=1.0):
    lo, la = math.radians(lon), math.radians(lat)
    return (r * math.cos(la) * math.cos(lo), r * math.cos(la) * math.sin(lo), r * math.sin(la))


# ------------------------------------------------------------------ the data centres and the labs (as the old clips)
DATA_CENTRES = [(-77.5, 39), (-73.6, 45.5), (-96.8, 32.8), (-100.4, 20.6), (-46.6, -23.5), (-70.6, -33.4), (-6.3, 53.3),
                (-0.1, 51.5), (4.9, 52.4), (8.7, 50.1), (2.3, 48.9), (-3.7, 40.4), (9.2, 45.5), (18, 59.3), (10.7, 59.9),
                (24.9, 60.2), (21, 52.2), (-21.9, 64.1), (3.4, 6.5), (28, -26.2), (36.8, -1.3), (31.2, 30), (-7.6, 33.6),
                (46.7, 24.7), (55.3, 25.2), (51.5, 25.3), (34.8, 32.1), (29, 41), (72.9, 19.1), (80.3, 13.1), (-84.4, 33.7),
                (-80.2, 25.8), (-90, 30), (-87.6, 41.9), (-112, 33.4), (-58.4, -34.6), (-43.2, -22.9), (-74.1, 4.7),
                (-9.1, 38.7), (14.4, 50.1), (16.4, 48.2), (12.5, 41.9), (23.7, 38), (26.1, 44.4), (30.5, 50.4), (37.6, 55.8),
                (-17.4, 14.7), (-0.2, 5.6), (39.3, -6.8), (32.6, 0.3), (18.4, -33.9), (58.4, 23.6), (69.2, 34.5)]
LAB_COLOURS = {"you": "#63C2B2", "azuria": "#7FB2E6", "openbrain": "#F08A62", "deepthink": "#E0B07A", "qilin": "#F1E4C8"}


def owners(sites, you):
    labs = ["azuria"] * 5 + ["openbrain"] * 3 + ["deepthink"] * 2 + ["qilin"] * 2
    return [(site, "you" if i < you else labs[i % len(labs)]) for i, site in enumerate(sites)]


def land_points(n, seed):
    """Random points on land, read from the Blue Marble (water is bluer than it is red)."""
    img = bpy.data.images.load(fetch_nasa(*DAY), check_existing=True)
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    r = random.Random(seed)
    out = []
    while len(out) < n:
        lon, lat = r.uniform(-125, 145), r.uniform(-35, 60)
        x, y = int((lon + 180) / 360 * (w - 1)), int((lat + 90) / 180 * (h - 1))
        red, _, blue = px[y, x, :3]
        if blue < red * 1.25:
            out.append((lon, lat))
    return out


def backups():
    rng = random.Random(3)
    sites = DATA_CENTRES[:]
    rng.shuffle(sites)
    return [dict(lon=lo, lat=la, t_on=0.4 + 10.5 * (i / len(sites)) ** 0.55, a="#9FC6EA") for i, (lo, la) in enumerate(sites)], (-30, 36)


def territories():
    rng = random.Random(3)
    sites = DATA_CENTRES[:]
    rng.shuffle(sites)
    dots = []
    for i, (site, lab) in enumerate(owners(sites, 7)):
        d = dict(lon=site[0], lat=site[1], t_on=0.0, a=LAB_COLOURS[lab])
        if lab == "you":
            d.update(b=LAB_COLOURS["azuria"], t_sw=1.6 + 0.45 * i)
        dots.append(d)
    return dots, (-25, 36)


def spread():
    r = random.Random(9)
    pool = DATA_CENTRES[:] + land_points(150, 9)
    r.shuffle(pool)
    dots = [dict(lon=-77.5, lat=39, t_on=0.3, a="#F08A62")]
    dots += [dict(lon=lo, lat=la, t_on=0.6 + 4.2 * math.log1p(i) / math.log1p(len(pool)), a="#F08A62") for i, (lo, la) in enumerate(pool)]
    return dots, (-55, 34)


def calm():
    return [dict(lon=lo, lat=la, t_on=0.0, a="#F6E7CC") for lo, la in DATA_CENTRES], (-10, 34)


def leader():
    rng = random.Random(3)
    sites = DATA_CENTRES[:]
    rng.shuffle(sites)
    home = (-122, 37)
    dots = []
    for i, (site, lab) in enumerate(owners(sites, 5)):
        dots.append(dict(lon=site[0], lat=site[1], t_on=0.0, a=LAB_COLOURS[lab], b=LAB_COLOURS["openbrain"],
                         t_sw=0.8 + math.dist(site, home) / 55 if lab != "openbrain" else 999))
    r = random.Random(4)
    for k in range(40):
        lo, la = r.choice(DATA_CENTRES)
        dots.append(dict(lon=lo + r.uniform(-4, 4), lat=la + r.uniform(-3, 3), t_on=2.0 + k * 0.12, a=LAB_COLOURS["openbrain"]))
    return dots, (-78, 34)


# ------------------------------------------------------------------ the planet
def earth(view):
    day = bpy.data.images.load(fetch_nasa(*DAY), check_existing=True)
    night = bpy.data.images.load(night_map(), check_existing=True)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=256, ring_count=128, radius=1.0)
    ob = bpy.context.object
    bpy.ops.object.shade_smooth()
    m = bpy.data.materials.new("earth")
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    L = nt.links.new

    def op(kind, a, c=None):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = kind
        for i, v in enumerate((a, c)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L(v, n.inputs[i])
        return n.outputs[0]

    # longitude and latitude from the surface point itself (the images are equirectangular, lon 0 at the centre)
    tco = nt.nodes.new("ShaderNodeTexCoord")
    nrm = nt.nodes.new("ShaderNodeVectorMath")
    nrm.operation = "NORMALIZE"
    L(tco.outputs["Object"], nrm.inputs[0])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(nrm.outputs[0], sep.inputs[0])
    u = op("ADD", op("DIVIDE", op("ARCTAN2", sep.outputs["Y"], sep.outputs["X"]), 2 * math.pi), 0.5)
    v = op("ADD", op("DIVIDE", op("ARCSINE", sep.outputs["Z"]), math.pi), 0.5)
    uv = nt.nodes.new("ShaderNodeCombineXYZ")
    L(u, uv.inputs["X"])
    L(v, uv.inputs["Y"])
    td, tn = nt.nodes.new("ShaderNodeTexImage"), nt.nodes.new("ShaderNodeTexImage")
    td.image, tn.image = day, night
    for t in (td, tn):
        t.interpolation = "Cubic"
        L(uv.outputs[0], t.inputs["Vector"])
    L(td.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.55
    # city lights only on the night side, strongest where the sun is furthest below the horizon
    sun_dir = sphere_point(view[0] + 150, view[1] * 0.3)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    dot = nt.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    L(geo.outputs["Normal"], dot.inputs[0])
    dot.inputs[1].default_value = sun_dir
    night_side = op("MINIMUM", op("MAXIMUM", op("SUBTRACT", 1.0, op("MULTIPLY", op("ADD", dot.outputs["Value"], 0.12), 4.0)), 0.0), 1.0)
    lights = nt.nodes.new("ShaderNodeGamma")
    lights.inputs["Gamma"].default_value = 1.6        # keep the cities, drop the faint moonlit terrain
    L(tn.outputs["Color"], lights.inputs["Color"])
    warm = nt.nodes.new("ShaderNodeMix")
    warm.data_type = "RGBA"
    warm.blend_type = "MULTIPLY"
    warm.inputs["Factor"].default_value = 1.0
    warm.inputs["B"].default_value = kit.lin("#FFD29A")
    L(lights.outputs["Color"], warm.inputs["A"])
    L(warm.outputs["Result"], b.inputs["Emission Color"])
    L(op("MULTIPLY", night_side, 16.0), b.inputs["Emission Strength"])
    ob.data.materials.append(m)
    # the atmosphere: a shell that glows at its rim
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1.018)
    air = bpy.context.object
    bpy.ops.object.shade_smooth()
    am = bpy.data.materials.new("air")
    am.use_nodes = True
    an = am.node_tree
    an.nodes.clear()
    out = an.nodes.new("ShaderNodeOutputMaterial")
    lw = an.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.25
    pw = an.nodes.new("ShaderNodeMath")
    pw.operation = "POWER"
    an.links.new(lw.outputs["Facing"], pw.inputs[0])
    pw.inputs[1].default_value = 6.0
    em = an.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = kit.lin("#4F8FE0")
    em.inputs["Strength"].default_value = 2.2
    tr = an.nodes.new("ShaderNodeBsdfTransparent")
    ms = an.nodes.new("ShaderNodeMixShader")
    an.links.new(pw.outputs[0], ms.inputs["Fac"])
    an.links.new(tr.outputs[0], ms.inputs[1])
    an.links.new(em.outputs[0], ms.inputs[2])
    an.links.new(ms.outputs[0], out.inputs["Surface"])
    air.data.materials.append(am)
    air.visible_shadow = False
    kit.sun((0, 0, 0), 4.0, (1.0, 0.95, 0.9), angle=0.5).rotation_euler = (-Vector(sun_dir)).to_track_quat("-Z", "Y").to_euler()
    return ob


def stars(n=2500, seed=2):
    r = random.Random(seed)
    bm = bmesh.new()
    for _ in range(n):
        v = np.array([r.gauss(0, 1) for _ in range(3)])
        v = v / np.linalg.norm(v) * 80
        s = r.uniform(0.04, 0.12)
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=s, matrix=Matrix.Translation(tuple(v)))
    me = bpy.data.meshes.new("stars")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("stars", me)
    ob.data.materials.append(kit.emission("#E8EEFF", 1.2))
    ob.visible_shadow = False
    bpy.context.scene.collection.objects.link(ob)


def dots(spec, T):
    """The dots on at moment T, batched by colour: a bright core and a soft halo each."""
    groups = {}
    for d in spec:
        if d["t_on"] > T:
            continue
        col = d.get("b", d["a"]) if T >= d.get("t_sw", 999) else d["a"]
        groups.setdefault(col, []).append(sphere_point(d["lon"], d["lat"], 1.004))
    for col, pts in groups.items():
        for radius, strength, halo in ((0.0022, 20.0, False), (0.0085, 2.5, True)):
            bm = bmesh.new()
            for p in pts:
                bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=6, radius=radius, matrix=Matrix.Translation(p))
            me = bpy.data.meshes.new("dots")
            bm.to_mesh(me)
            bm.free()
            ob = bpy.data.objects.new("dots", me)
            for poly in me.polygons:
                poly.use_smooth = True
            ob.data.materials.append(halo_mat(col, strength) if halo else kit.emission(col, strength))
            ob.visible_shadow = False
            bpy.context.scene.collection.objects.link(ob)


def halo_mat(col, strength):
    m = bpy.data.materials.new("halo")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.5
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = kit.lin(col)
    em.inputs["Strength"].default_value = strength
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    inv = nt.nodes.new("ShaderNodeMath")
    inv.operation = "POWER"
    nt.links.new(lw.outputs["Facing"], inv.inputs[0])
    inv.inputs[1].default_value = 3.0
    ms = nt.nodes.new("ShaderNodeMixShader")
    one = nt.nodes.new("ShaderNodeMath")
    one.operation = "SUBTRACT"
    one.inputs[0].default_value = 1.0
    nt.links.new(inv.outputs[0], one.inputs[1])
    nt.links.new(one.outputs[0], ms.inputs["Fac"])
    nt.links.new(tr.outputs[0], ms.inputs[1])
    nt.links.new(em.outputs[0], ms.inputs[2])
    nt.links.new(ms.outputs[0], out.inputs["Surface"])
    return m


def globe_shot(variant, T):
    def shot():
        spec, view = variant()
        earth(view)
        stars()
        dots(spec, T)
        kit.world("#03050A", 1.0)
        # low orbit: the planet's curve fills the frame, the horizon arcs across the top
        kit.camera(sphere_point(view[0], view[1] - 20, 2.35), sphere_point(view[0], view[1] + 2, 1.0), lens=30)
        bpy.context.scene.view_settings.exposure = 0.3
    return shot


kit.run({
    "qt-globe-1": globe_shot(backups, 2.5), "qt-globe-2": globe_shot(backups, 6.0), "qt-globe-3": globe_shot(backups, 11.5),
    "ab-globe-1": globe_shot(territories, 0.5), "ab-globe-2": globe_shot(territories, 3.6), "ab-globe-3": globe_shot(territories, 13),
    "rd-globe-1": globe_shot(spread, 0.8), "rd-globe-2": globe_shot(spread, 2.6), "rd-globe-3": globe_shot(spread, 5.2),
    "ov-globe-1": globe_shot(leader, 0.5), "ov-globe-2": globe_shot(leader, 2.6), "ov-globe-3": globe_shot(leader, 12),
    "pd-globe": globe_shot(calm, 0.0),
})
