"""People for the ending stills: smooth figures grown from a stick skeleton with Blender's Skin modifier, then
subdivided. They are meant to be seen as silhouettes, from behind, out of focus or at a distance (owner's pick B:
faces are never the subject), so proportion, pose and clothing volume matter more than detail.

    person((x, y), facing=deg, pose="stand"|"sit"|"walk"|"lean"|"slump", height=1.75, coat="#3B3F46",
           long_coat=True, hold="paper"|"phone"|"cup"|"umbrella"|None, hair="#2A211C", build=1.0)

facing is the direction the person looks, in degrees about z (0 = +y, 90 = -x). Returns the root empty.
"""
import math
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

import kit

SKIN_TONES = ["#E8C3A5", "#C99576", "#A06A4A", "#6E4630", "#F0D2BC", "#B98260"]


def _skeleton(pose, s, rng):
    """Joint positions (metres, person facing +y, feet at z=0) and the edges between them."""
    sway = rng.uniform(-0.03, 0.03)
    j = {}
    if pose == "sit":
        j["pelvis"] = (0, 0, 0.5 * s)
        j["knee_l"], j["knee_r"] = (-0.1 * s, 0.44 * s, 0.52 * s), (0.1 * s, 0.44 * s, 0.52 * s)
        j["foot_l"], j["foot_r"] = (-0.11 * s, 0.5 * s, 0.05 * s), (0.11 * s, 0.47 * s, 0.05 * s)
        chest_y, lean = 0.0, 0.02
    else:
        stride = 0.18 * s if pose == "walk" else 0.0
        j["pelvis"] = (sway, 0, 0.95 * s)
        j["knee_l"] = (-0.1 * s + sway, stride * 0.55, 0.5 * s)
        j["knee_r"] = (0.1 * s + sway, -stride * 0.45, 0.5 * s)
        j["foot_l"] = (-0.11 * s, stride, 0.06 * s)
        j["foot_r"] = (0.11 * s, -stride, 0.06 * s + (0.05 * s if pose == "walk" else 0))
        chest_y = {"lean": 0.08, "slump": 0.1}.get(pose, 0.0) * s
        lean = 0.0
    px, py, pz = j["pelvis"]
    j["belly"] = (px, py + chest_y * 0.4, pz + 0.2 * s)
    j["chest"] = (px * 0.5, py + chest_y + lean, pz + 0.43 * s)
    j["neck"] = (px * 0.3, py + chest_y * 1.3 + lean, pz + 0.58 * s)
    head_drop = 0.05 * s if pose == "slump" else 0.0
    j["head"] = (px * 0.3, py + chest_y * 1.5 + lean + 0.02 * s, pz + 0.69 * s - head_drop)
    cx, cy, cz = j["chest"]
    j["shoulder_l"], j["shoulder_r"] = (cx - 0.19 * s, cy, cz + 0.08 * s), (cx + 0.19 * s, cy, cz + 0.08 * s)
    return j


def _arm(j, side, target, s):
    """Elbow and hand for one arm: target 'down', 'front' (holding something at chest), 'phone', 'pocket', 'lap'."""
    sx, sy, sz = j[f"shoulder_{side}"]
    sign = -1 if side == "l" else 1
    if target == "front":
        elbow = (sx + sign * 0.03 * s, sy + 0.08 * s, sz - 0.26 * s)
        hand = (sx - sign * 0.05 * s, sy + 0.3 * s, sz - 0.3 * s)
    elif target == "phone":
        elbow = (sx + sign * 0.02 * s, sy + 0.06 * s, sz - 0.27 * s)
        hand = (sx - sign * 0.09 * s, sy + 0.24 * s, sz - 0.12 * s)
    elif target == "pocket":
        elbow = (sx + sign * 0.07 * s, sy - 0.04 * s, sz - 0.27 * s)
        hand = (sx + sign * 0.01 * s, sy + 0.05 * s, sz - 0.5 * s)
    elif target == "lap":
        elbow = (sx + sign * 0.03 * s, sy + 0.1 * s, sz - 0.27 * s)
        hand = (sx - sign * 0.04 * s, sy + 0.3 * s, sz - 0.4 * s)
    elif target == "up":   # holding an umbrella shaft
        elbow = (sx + sign * 0.05 * s, sy + 0.12 * s, sz - 0.2 * s)
        hand = (sx - sign * 0.02 * s, sy + 0.22 * s, sz + 0.02 * s)
    else:
        elbow = (sx + sign * 0.035 * s, sy - 0.02 * s, sz - 0.28 * s)
        hand = (sx + sign * 0.045 * s, sy + 0.02 * s, sz - 0.55 * s)
    return elbow, hand


def _body_mesh(j, arms, s, long_coat, build):
    """A skin-modified skeleton: radii give the clothing its volume."""
    names = list(j) + ["elbow_l", "hand_l", "elbow_r", "hand_r", "hip_l", "hip_r"]
    j = dict(j)
    for side in ("l", "r"):
        j[f"elbow_{side}"], j[f"hand_{side}"] = arms[side]
    px, py, pz = j["pelvis"]
    j["hip_l"], j["hip_r"] = (px - 0.1 * s, py, pz - 0.04 * s), (px + 0.1 * s, py, pz - 0.04 * s)
    edges = [("pelvis", "belly"), ("belly", "chest"), ("chest", "neck"), ("neck", "head"),
             ("chest", "shoulder_l"), ("chest", "shoulder_r"),
             ("shoulder_l", "elbow_l"), ("elbow_l", "hand_l"), ("shoulder_r", "elbow_r"), ("elbow_r", "hand_r"),
             ("pelvis", "hip_l"), ("pelvis", "hip_r"), ("hip_l", "knee_l"), ("knee_l", "foot_l"),
             ("hip_r", "knee_r"), ("knee_r", "foot_r")]
    b = build
    radius = {"pelvis": 0.17 * b, "belly": 0.16 * b, "chest": 0.19 * b, "neck": 0.055, "head": 0.105,
              "shoulder_l": 0.07, "shoulder_r": 0.07, "elbow_l": 0.05, "elbow_r": 0.05, "hand_l": 0.04, "hand_r": 0.04,
              "hip_l": 0.1 * b, "hip_r": 0.1 * b, "knee_l": 0.065, "knee_r": 0.065, "foot_l": 0.05, "foot_r": 0.05}
    if long_coat:   # a coat flares out past the knees
        radius.update({"knee_l": 0.11 * b, "knee_r": 0.11 * b, "hip_l": 0.13 * b, "hip_r": 0.13 * b})
    me = bpy.data.meshes.new("body")
    bm = bmesh.new()
    idx = {}
    for n in names:
        idx[n] = bm.verts.new(j[n])
    for a, c in edges:
        bm.edges.new((idx[a], idx[c]))
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("body", me)
    bpy.context.scene.collection.objects.link(ob)
    skin = ob.modifiers.new("skin", "SKIN")
    skin.use_smooth_shade = True
    for n, v in zip(names, me.skin_vertices[0].data):
        r = radius[n] * s
        v.radius = (r, r * (0.8 if n in ("chest", "belly", "pelvis") else 1.0))
    me.skin_vertices[0].data[names.index("pelvis")].use_root = True
    sub = ob.modifiers.new("sub", "SUBSURF")
    sub.levels = sub.render_levels = 2
    return ob, j


def person(at, facing=0.0, pose="stand", height=1.75, coat="#3B3F46", long_coat=False, hold=None, hair="#2A211C",
           skin=None, trousers="#23252A", build=1.0, seed=None, hood=False, umbrella_col="#16171A"):
    rng = random.Random(seed if seed is not None else hash((at, facing, pose)) & 0xFFFF)
    s = height / 1.75
    j = _skeleton(pose, s, rng)
    right = {"paper": "front", "phone": "phone", "cup": "front", "umbrella": "up", None: "down"}.get(hold, "down")
    left = "lap" if pose == "sit" else ("pocket" if rng.random() < 0.4 else "down")
    if hold == "paper" and rng.random() < 0.5:
        left = "front"
    arms = {"r": _arm(j, "r", right, s), "l": _arm(j, "l", left, s)}
    body, j = _body_mesh(j, arms, s, long_coat, build)
    body.data.materials.append(kit.mat(coat, 0.8))
    parts = [body]
    # head, hair, legs in trouser colour below the coat
    hx, hy, hz = j["head"]
    parts.append(kit.sphere((hx, hy + 0.01 * s, hz), 0.1 * s, kit.mat(skin or rng.choice(SKIN_TONES), 0.55), scale=(0.9, 1.0, 1.12)))
    if hood:
        parts.append(kit.sphere((hx, hy - 0.015 * s, hz + 0.01 * s), 0.118 * s, kit.mat(coat, 0.85), scale=(0.95, 1.05, 1.12)))
    else:
        parts.append(kit.sphere((hx, hy - 0.02 * s, hz + 0.035 * s), 0.104 * s, kit.mat(hair, 0.7), scale=(0.95, 1.0, 0.95)))
    for side in ("l", "r"):
        kx, ky, kz = j[f"knee_{side}"]
        fx, fy, fz = j[f"foot_{side}"]
        mid = Vector(((kx + fx) / 2, (ky + fy) / 2, (kz + fz) / 2))
        d = Vector((fx - kx, fy - ky, fz - kz))
        leg = kit.cyl(mid, 0.055 * s, d.length, kit.mat(trousers, 0.8), verts=16)
        leg.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
        shoe = kit.box((fx, fy + 0.05 * s, 0.035 * s), (0.1 * s, 0.26 * s, 0.07 * s), kit.mat("#141414", 0.4), bevel=0.02)
        parts += [leg, shoe]
    # what they hold, in the right hand
    hx, hy, hz = j["hand_r"]
    if hold == "paper":
        parts.append(kit.box((hx, hy + 0.02, hz + 0.08 * s), (0.16 * s, 0.004, 0.22 * s), kit.mat("#F1EEE6", 0.7), rot=(-0.35, 0, 0.1)))
    elif hold == "phone":
        ph = kit.box((hx, hy + 0.02, hz + 0.03), (0.075 * s, 0.01, 0.15 * s), kit.mat("#111", 0.3), rot=(-0.9, 0, 0))
        glow = kit.plane((hx, hy + 0.012, hz + 0.036), (0.065 * s, 0.135 * s), kit.emission("#CFE3FF", 2.5), rot=(-0.9 + math.pi / 2 - math.pi / 2, 0, 0))
        glow.rotation_euler = (math.radians(90) - 0.9, 0, math.pi)
        parts += [ph, glow]
    elif hold == "cup":
        parts.append(kit.cyl((hx, hy + 0.02, hz + 0.05), 0.04 * s, 0.11 * s, kit.mat("#EDE7DA", 0.5), r2=0.033 * s, verts=20))
    elif hold == "umbrella":
        parts.append(kit.cyl((hx, hy, hz + 0.3 * s), 0.009, 0.75 * s, kit.mat("#222", 0.4), verts=8))
        canopy = kit.cyl((hx, hy, hz + 0.72 * s), 0.55 * s, 0.24 * s, kit.mat(umbrella_col, 0.35), r2=0.03, verts=12, smooth=False)
        canopy.modifiers.new("sub", "SUBSURF").levels = 1
        parts.append(canopy)
    root = bpy.data.objects.new("person", None)
    bpy.context.scene.collection.objects.link(root)
    for p in parts:
        p.parent = root
    root.location = (at[0], at[1], at[2] if len(at) > 2 else 0.0)
    root.rotation_euler = (0, 0, math.radians(facing))
    return root


def crowd(points, seed=1, **kw):
    """People at [(x, y, facing), ...] with varied heights, coats and holds."""
    rng = random.Random(seed)
    coats = kw.pop("coats", ["#3B3F46", "#5B3A33", "#2C3A4F", "#6A6154", "#44343A", "#26302C", "#7A6A58", "#1F2226"])
    holds = kw.pop("holds", [None, None, "paper", "phone"])
    out = []
    for i, (x, y, f) in enumerate(points):
        out.append(person((x, y), facing=f, height=rng.uniform(1.58, 1.9), coat=rng.choice(coats), long_coat=rng.random() < 0.5,
                          hold=rng.choice(holds), hair=rng.choice(["#2A211C", "#4A3526", "#141212", "#6B5A48", "#8C8C8C"]),
                          build=rng.uniform(0.9, 1.15), seed=seed * 100 + i, **kw))
    return out


def silhouettes(points, seed=1, coats=("#2A2D33", "#33302E", "#262B33", "#3A3436", "#22262A"), name="crowd"):
    """Many far-off or backlit people as ONE mesh (fast for audiences of dozens): a rounded torso, shoulders and a
    head each. points = [(x, y, z, facing, pose)], pose "sit" (z is the seat) or "stand" (z is the floor), with an
    optional 6th value "hand" to raise the right hand. Returns the object."""
    rng = random.Random(seed)
    mats = [kit.mat(c, 0.85) for c in coats] + [kit.mat(h, 0.7) for h in ("#1E1A18", "#3A2C22", "#6B6660", "#141212")]
    nc = len(coats)
    bm = bmesh.new()
    slots = []

    def blob(centre, radii, rot, slot, segs=12):
        m = Matrix.Translation(centre) @ rot @ Matrix.Diagonal((*radii, 1))
        res = bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=max(6, segs // 2), radius=1.0, matrix=m)
        slots.append((res["verts"], slot))

    for p in points:
        x, y, z, facing, pose = p[:5]
        hand = len(p) > 5 and p[5] == "hand"
        s = rng.uniform(0.92, 1.08)
        rot = Euler((0, 0, math.radians(facing))).to_matrix().to_4x4()
        coat, hair = rng.randrange(nc), nc + rng.randrange(4)
        base = z if pose == "sit" else z + 0.78 * s
        if pose != "sit":   # two legs
            for dx in (-0.09, 0.09):
                blob(rot @ Vector((dx * s, 0, 0)) + Vector((x, y, z + 0.46 * s)), (0.08 * s, 0.09 * s, 0.47 * s), rot, coat, 10)
        lean = Vector((0, 0.05 * s, 0)) if pose == "sit" else Vector((0, 0, 0))
        blob(rot @ lean + Vector((x, y, base + 0.36 * s)), (0.2 * s, 0.13 * s, 0.36 * s), rot, coat)       # torso
        blob(rot @ lean + Vector((x, y, base + 0.6 * s)), (0.23 * s, 0.13 * s, 0.085 * s), rot, coat)     # shoulders
        blob(rot @ (lean * 1.2) + Vector((x, y, base + 0.7 * s)), (0.05 * s, 0.05 * s, 0.06 * s), rot, coat, 8)   # neck
        blob(rot @ (lean * 1.4) + Vector((x, y, base + 0.81 * s)), (0.085 * s, 0.095 * s, 0.11 * s), rot, hair)   # head
        if hand:   # a thin raised arm and a hand
            blob(rot @ Vector((0.2 * s, 0.04 * s, 0)) + Vector((x, y, base + 0.9 * s)), (0.035 * s, 0.035 * s, 0.28 * s), rot, coat, 8)
            blob(rot @ Vector((0.2 * s, 0.04 * s, 0)) + Vector((x, y, base + 1.2 * s)), (0.04 * s, 0.03 * s, 0.055 * s), rot, hair, 8)
    bm.verts.index_update()
    index = {v.index: slot for verts, slot in slots for v in verts}
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.material_index = index.get(poly.vertices[0], 0)
        poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    for m in mats:
        ob.data.materials.append(m)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def hair_back(root, height=1.75, pose="stand", hair="#2A211C"):
    """Cover the back of a person()'s head down to the nape, for figures seen from close behind (the stock hair cap
    leaves a band of face showing under it from that side)."""
    s = height / 1.75
    hz = (1.19 if pose == "sit" else 1.64) * s
    hy = (0.02 + 0.02 * s) if pose == "sit" else 0.02 * s
    back = kit.sphere((0, hy - 0.035 * s, hz - 0.03 * s), 0.1 * s, kit.mat(hair, 0.7), scale=(0.93, 0.9, 1.0))
    back.parent = root
    return back
