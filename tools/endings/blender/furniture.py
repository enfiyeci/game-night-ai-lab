"""Office furniture and desk props shared by the lab sets (set_lab.py, set_labrooms.py, set_openbrain.py,
set_rentedroom.py): chairs, desks, monitors on stands, paper, boxes, and one mesh for many small boxes (batch).
"""
import math

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

import kit


def batch(name, boxes, material):
    """One mesh object holding many boxes [(center, size)] or [(center, size, rot_z)], for speed."""
    bm = bmesh.new()
    for b in boxes:
        (cx, cy, cz), (sx, sy, sz) = b[0], b[1]
        rz = b[2] if len(b) > 2 else 0.0
        m = Matrix.Translation((cx, cy, cz)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Diagonal((sx, sy, sz, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def chair(at, facing, colour="#232427"):
    """An office chair on a five-star base. Its backrest is at local -y, so facing=0 seats someone looking +y and
    facing=180 turns it to face -y (degrees about z)."""
    x, y = at
    m = kit.mat(colour, 0.6)
    metal = kit.mat("#9B9EA3", 0.3, 0.9)
    root = bpy.data.objects.new("chair", None)
    bpy.context.scene.collection.objects.link(root)
    parts = [kit.box((0, 0, 0.48), (0.5, 0.48, 0.07), m, bevel=0.02), kit.box((0, -0.24, 0.85), (0.46, 0.06, 0.58), m, bevel=0.025),
             kit.cyl((0, 0, 0.26), 0.025, 0.42, metal)]
    for k in range(5):
        a = k * 2 * math.pi / 5
        parts.append(kit.box((math.cos(a) * 0.16, math.sin(a) * 0.16, 0.05), (0.34, 0.04, 0.03), metal, rot=(0, 0, a)))
    for p in parts:
        p.parent = root
    root.location = (x, y, 0)
    root.rotation_euler = (0, 0, math.radians(facing))
    return root


def desk(x, y, w=1.6, d=0.8, top="#C9C2B6", rot_z=0.0):
    c, s = math.cos(rot_z), math.sin(rot_z)
    kit.box((x, y, 0.74), (w, d, 0.03), kit.mat(top, 0.45), rot=(0, 0, rot_z))
    for dx in (-w / 2 + 0.05, w / 2 - 0.05):
        kit.box((x + dx * c, y + dx * s, 0.37), (0.04, d - 0.1, 0.74), kit.mat("#2A2B2D", 0.4, 0.6), rot=(0, 0, rot_z))


def monitor(name, at, width, plate, crop, strength=1.1, yaw=0.0, live=True, tilt=0.0, z=0.755):
    """A monitor on a stand, its foot on the desk at `at` (x, y); the screen faces -y turned by yaw degrees."""
    x, y = at
    h = width * crop[3] / crop[2]
    a = math.radians(yaw)
    face, _ = kit.screen(name, (x, y, z + 0.15 + h / 2), width, plate, crop=crop, strength=strength, depth=0.025,
                         rot=(math.radians(90 - tilt), 0, a), live=live)
    dark = kit.mat("#2A2B2D", 0.4, 0.6)
    kit.cyl((x - 0.04 * math.sin(a), y + 0.04 * math.cos(a), z + 0.1), 0.02, 0.2, dark)
    kit.box((x - 0.06 * math.sin(a), y + 0.06 * math.cos(a), z + 0.006), (0.22, 0.16, 0.012), dark, bevel=0.004, rot=(0, 0, a))
    return face


def dark_monitor(at, width=0.55, h=0.32, yaw=0.0, z=0.755, glow=None):
    """A monitor that is off (or showing a plain glow colour), not a live screen."""
    x, y = at
    a = math.radians(yaw)
    kit.box((x, y, z + 0.15 + h / 2), (width + 0.03, 0.025, h + 0.03), kit.mat("#1A1B1D", 0.35), bevel=0.003, rot=(0, 0, a))
    face = kit.mat("#060708", 0.12) if glow is None else kit.emission(glow[0], glow[1])
    kit.box((x + 0.013 * math.sin(a), y - 0.013 * math.cos(a), z + 0.15 + h / 2), (width, 0.002, h), face, rot=(0, 0, a))
    kit.cyl((x - 0.04 * math.sin(a), y + 0.04 * math.cos(a), z + 0.1), 0.02, 0.2, kit.mat("#2A2B2D", 0.4, 0.6))


def keyboard(x, y, z=0.755, rot_z=0.0):
    kit.box((x, y, z + 0.008), (0.42, 0.13, 0.015), kit.mat("#1D1E20", 0.5), bevel=0.003, rot=(0, 0, rot_z))
    kit.box((x + 0.3 * math.cos(rot_z), y + 0.3 * math.sin(rot_z), z + 0.01), (0.06, 0.1, 0.02), kit.mat("#1D1E20", 0.4), bevel=0.008,
            rot=(0, 0, rot_z))


def paper(at, size=(0.21, 0.297), rot_z=0.0, colour="#F1EEE6", thick=0.0012):
    x, y, z = at
    return kit.box((x, y, z + thick / 2), (size[0], size[1], thick), kit.mat(colour, 0.75), rot=(0, 0, rot_z))


def flat_text(body, at, size, colour="#2B2B2B", rot_z=0.0, font=kit.FONT_SANS, align="CENTER"):
    """Text lying on a horizontal surface, reading toward -y (turned by rot_z)."""
    return kit.text(body, at, size, kit.mat(colour, 0.6), font=font, rot=(0, 0, rot_z), align=align, extrude=0.0002)


def cup(at, colour="#F2EEE6", tipped=False):
    x, y, z = at
    if tipped:
        return kit.cyl((x, y, z + 0.03), 0.03, 0.09, kit.mat(colour, 0.6), r2=0.023, rot=(math.radians(90), 0, 0.6))
    return kit.cyl((x, y, z + 0.045), 0.03, 0.09, kit.mat(colour, 0.6), r2=0.023)


def mug(at, colour="#2E5E57"):
    x, y, z = at
    kit.cyl((x, y, z + 0.048), 0.04, 0.096, kit.mat(colour, 0.35))
    kit.cyl((x, y, z + 0.09), 0.035, 0.004, kit.mat("#2A1A10", 0.2))        # cold coffee
    h = kit.cyl((x + 0.045, y, z + 0.05), 0.022, 0.012, kit.mat(colour, 0.35), rot=(math.radians(90), 0, 0))
    h.modifiers.new("solid", "SOLIDIFY").thickness = 0.008


def note(at, body, rot=(math.radians(90), 0, 0), size=0.07, colour="#F3E27A", text_size=0.0085):
    """A sticky note; rot (90deg, 0, 0) stands it facing -y (on a bezel)."""
    kit.plane(at, (size, size), kit.mat(colour, 0.7), rot=rot)
    p = Vector(at) + (Euler(rot).to_matrix() @ Vector((0, 0, 1))) * 0.0015
    kit.text(body, p, text_size, kit.mat("#2B2B2B", 0.7), font=kit.FONT_SANS, rot=rot, extrude=0.0002)


def carton(at, size=(0.6, 0.4, 0.4), rot_z=0.0, label=None, taped=True):
    """A cardboard moving box; label is written on its -y face."""
    x, y, z = at
    sx, sy, sz = size
    kit.box((x, y, z + sz / 2), size, kit.mat("#B48A5C", 0.85), bevel=0.006, rot=(0, 0, rot_z))
    if taped:
        kit.box((x, y, z + sz + 0.0008), (0.06 if sx > sy else sx + 0.002, sy + 0.002 if sx > sy else 0.06, 0.0015),
                kit.mat("#C9A878", 0.35), rot=(0, 0, rot_z))
    if label:
        c, s = math.cos(rot_z), math.sin(rot_z)
        off = sy / 2 + 0.002
        kit.text(label, (x + off * s, y - off * c, z + sz * 0.62), min(0.06, sx / 7), kit.mat("#1E1E1E", 0.7), font=kit.FONT_COND,
                 rot=(math.radians(90), 0, rot_z), extrude=0.0002)


def trophy(at, scale=1.0, label="#1"):
    """A gold cup on a two-tier base with a plate on the front (facing -y)."""
    x, y, z = at
    s = scale
    gold = kit.mat("#D9A93C", 0.18, 1.0)
    base = kit.mat("#141414", 0.3)
    kit.box((x, y, z + 0.03 * s), (0.14 * s, 0.14 * s, 0.06 * s), base, bevel=0.004)
    kit.box((x, y, z + 0.08 * s), (0.1 * s, 0.1 * s, 0.04 * s), base, bevel=0.003)
    kit.cyl((x, y, z + 0.11 * s), 0.03 * s, 0.02 * s, gold, r2=0.018 * s)
    kit.cyl((x, y, z + 0.16 * s), 0.011 * s, 0.09 * s, gold)
    kit.sphere((x, y, z + 0.215 * s), 0.035 * s, gold, scale=(1, 1, 0.7))
    kit.cyl((x, y, z + 0.28 * s), 0.035 * s, 0.13 * s, gold, r2=0.075 * s, verts=48)
    for side in (-1, 1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.035 * s, minor_radius=0.006 * s, location=(x + side * 0.068 * s, y, z + 0.28 * s),
                                         rotation=(math.radians(90), 0, 0))
        bpy.context.object.data.materials.append(gold)
    kit.box((x, y - 0.0705 * s, z + 0.03 * s), (0.09 * s, 0.002, 0.035 * s), gold)
    kit.text(label, (x, y - 0.0725 * s, z + 0.03 * s), 0.024 * s, kit.mat("#141414", 0.4), font=kit.FONT, extrude=0.0002)


def laptop(name, at, plate, crop, yaw=0.0, open_deg=105, strength=1.2, width=0.3, body="#8E9398"):
    """A laptop on a surface at `at` (x, y, z), facing -y turned by yaw degrees; its screen is a live screen."""
    x, y, z = at
    a = math.radians(yaw)
    c, s = math.cos(a), math.sin(a)
    kit.box((x, y, z + 0.009), (width * 1.1, width * 0.72, 0.018), kit.mat(body, 0.3, 0.7), bevel=0.004, rot=(0, 0, a))
    kit.box((x + 0.02 * s, y - 0.02 * c, z + 0.0185), (width * 0.93, width * 0.33, 0.001), kit.mat("#1B1C1E", 0.6), rot=(0, 0, a))
    tilt = math.radians(open_deg - 90)
    h = width * crop[3] / crop[2]
    back = width * 0.36
    r = (h / 2 + 0.01) * math.sin(tilt) + back
    cz = z + 0.018 + (h / 2 + 0.01) * math.cos(tilt)
    face, _ = kit.screen(name, (x - r * s, y + r * c, cz), width, plate, crop=crop, rot=(math.radians(90) - tilt, 0, a),
                         strength=strength, bezel=body, depth=0.008, border=0.012)
    return face
