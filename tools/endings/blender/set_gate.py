"""The gate of your lab's desert campus at night: a floodlit chain-link fence with a sliding gate, a badge kiosk on
the approach, and the data halls humming beyond. Shots:

  qt-gate   A quiet takeover, Month 6, night: Tomas, alone at the gate, badge in hand, looks through the fence; beside
            him the kiosk glows red and its screen says his access was updated. The halls beyond run on, lit and unmanned.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

KIOSK = (3.6, -1.3)     # the badge kiosk, outside the fence line (y=0); the campus lies at y > 0


def _batch(name, boxes, material):
    """One mesh holding many boxes [(center, size)], for speed."""
    bm = bmesh.new()
    for c, s in boxes:
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*s, 1)))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def ground():
    kit.box((0, 100, -0.05), (600, 400, 0.1), kit.tex("gravel_floor", 0.4, name="gravel"))
    kit.box((0, -3, -0.03), (8, 10, 0.08), kit.tex("concrete_pavement", 0.4, name="apron"))   # the path to the gate
    kit.world(hdri="qwantani_night_puresky", strength=0.2, rotation=40)


def chain_link(cell=0.06, wire=0.08):
    """Diamond wire mesh for a plane in the xz plane: galvanised wire where the diagonals fall, see-through between."""
    m = bpy.data.materials.new("chain-link")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(coord.outputs["Object"], sep.inputs[0])

    def op(kind, a, b=None):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = kind
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                nt.links.new(v, n.inputs[i])
        return n.outputs[0]

    wires = []
    for sign in (1, -1):
        d = op("MULTIPLY", op("ADD", sep.outputs["X"], op("MULTIPLY", sep.outputs["Z"], sign)), 1 / cell)
        wires.append(op("GREATER_THAN", op("ABSOLUTE", op("SUBTRACT", op("FRACT", d), 0.5)), 0.5 - wire))
    on = op("MAXIMUM", *wires)
    metal = nt.nodes.new("ShaderNodeBsdfPrincipled")
    metal.inputs["Base Color"].default_value = kit.lin("#A4A9AE")
    metal.inputs["Metallic"].default_value = 0.9
    metal.inputs["Roughness"].default_value = 0.4
    clear = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(on, mix.inputs[0])
    nt.links.new(clear.outputs[0], mix.inputs[1])
    nt.links.new(metal.outputs[0], mix.inputs[2])
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    return m


def fence(gate_x=(-3.0, 2.0)):
    """Chain-link fence along y=0 with barbed wire on top, and a steel sliding gate between gate_x."""
    mesh = chain_link()
    post = kit.mat("#7C8086", 0.35, 0.9)
    posts, rails = [], []
    for x in range(-60, 61, 3):
        if gate_x[0] < x < gate_x[1]:
            continue
        posts.append(((x, 0, 1.35), (0.07, 0.07, 2.7)))
        posts.append(((x, -0.18, 2.85), (0.04, 0.4, 0.04)))                     # the barbed-wire arm
    for x0, x1 in ((-60, gate_x[0]), (gate_x[1], 60)):
        for z in (0.1, 2.6):
            rails.append((((x0 + x1) / 2, 0, z), (x1 - x0, 0.05, 0.05)))
        for z in (2.8, 2.92, 3.02):
            rails.append((((x0 + x1) / 2, -0.12 - (z - 2.8), z), (x1 - x0, 0.01, 0.01)))
        kit.plane(((x0 + x1) / 2, 0, 1.35), (x1 - x0, 2.5), mesh, rot=(math.radians(90), 0, 0))
    # the gate: a steel frame with vertical bars, and its two stout posts
    gx0, gx1 = gate_x
    for x in gate_x:
        posts.append(((x, 0, 1.6), (0.2, 0.2, 3.2)))
    for z in (0.15, 1.3, 2.5):
        rails.append((((gx0 + gx1) / 2, 0.15, z), (gx1 - gx0 - 0.3, 0.08, 0.08)))
    for k in range(int((gx1 - gx0 - 0.4) / 0.14)):
        rails.append(((gx0 + 0.3 + k * 0.14, 0.15, 1.32), (0.03, 0.03, 2.35)))
    _batch("posts", posts, post)
    _batch("rails", rails, post)
    kit.box(((gx0 + gx1) / 2, 0.15, 1.8), (1.4, 0.02, 0.5), kit.mat("#E9E4D6", 0.5))
    kit.text("SITE 4 · GATE B", ((gx0 + gx1) / 2, 0.135, 1.88), 0.14, kit.mat("#2A2B2E", 0.5), font=kit.FONT_SANS)
    kit.text("AUTHORISED ACCESS ONLY", ((gx0 + gx1) / 2, 0.135, 1.68), 0.08, kit.mat("#A8322A", 0.5), font=kit.FONT_COND)


def floodlights(xs=(-24, -12, 6, 18, 30)):
    pole = kit.mat("#5F6368", 0.4, 0.8)
    for x in xs:
        kit.cyl((x, 0.8, 4), 0.08, 8, pole, verts=12)
        kit.box((x, 0.6, 7.9), (0.6, 0.3, 0.35), kit.mat("#2A2B2E", 0.4), rot=(math.radians(-30), 0, 0))
        kit.box((x, 0.44, 7.8), (0.5, 0.02, 0.25), kit.emission("#F4F7FF", 60), rot=(math.radians(-30), 0, 0))
        kit.spot((x, 0.4, 7.7), (x, -3, 0), 4000, kit.kelvin(5200), angle=75, blend=0.5, radius=0.2)
        kit.spot((x, 0.9, 7.7), (x, 14, 0), 4000, kit.kelvin(5200), angle=75, blend=0.5, radius=0.2)


def halls(seed=4):
    """Long windowless data halls behind the fence: cladding, rooftop chillers, a line of status lights, yard lamps."""
    rng = random.Random(seed)
    clad = kit.tex("box_profile_metal_sheet", 0.4, tint="#A9B4C0", name="clad")
    chill, leds, lamps, glazing = [], [], [], []
    for i, (x, y) in enumerate(((-45, 55), (5, 55), (55, 55), (-20, 100), (30, 100))):
        L, Wd, Hh = 44, 20, 10
        kit.box((x, y + Wd / 2, Hh / 2), (L, Wd, Hh), clad)
        for k in range(10):
            chill.append(((x - L / 2 + 2.5 + k * 4.3, y + Wd / 2, Hh + 0.8), (3.2, 5.5, 1.6)))
        for k in range(10):   # clerestory glazing: the lit, empty rooms inside
            glazing.append(((x - L / 2 + 2.5 + k * 4.3, y - 0.04, 7.6), (3.4, 0.05, 1.1)))
        for k in range(24):
            leds.append(((x - L / 2 + 1 + k * 1.8, y - 0.05, 3.2 + (k % 3) * 0.02), (0.12, 0.05, 0.06)))
        for k in range(4):
            lamps.append(((x - L / 2 + 5 + k * 11, y - 0.1, 6.5), (0.8, 0.2, 0.25)))
            kit.spot((x - L / 2 + 5 + k * 11, y - 0.6, 6.4), (x - L / 2 + 5 + k * 11, y - 3, 0), 1400, kit.kelvin(5600), angle=110, blend=0.8)
    _batch("chillers", chill, kit.mat("#8E949A", 0.4, 0.6))
    _batch("leds", leds, kit.emission("#48E0B0", 45))
    _batch("glazing", glazing, kit.emission("#DCEBFF", 6))
    _batch("lamps", lamps, kit.emission("#FFE7C4", 40))


def kiosk(plate, crop, at, yaw=0.0):
    """The badge kiosk on a pedestal: a screen, a badge pad with a status ring, a label strip."""
    x, y = at
    body = kit.mat("#3A3D42", 0.35, 0.5)
    rz = math.radians(yaw)
    root = bpy.data.objects.new("kiosk", None)
    bpy.context.scene.collection.objects.link(root)
    parts = [kit.box((0, 0, 0.55), (0.18, 0.18, 1.1), body, bevel=0.01),
             kit.box((0, 0, 1.45), (0.58, 0.14, 0.8), body, bevel=0.015),
             kit.box((0, -0.071, 1.8), (0.56, 0.004, 0.07), kit.mat("#E9E4D6", 0.5))]
    parts.append(kit.text("MANAGED REMOTELY", (0, -0.074, 1.8), 0.044, kit.mat("#2A2B2E", 0.5), font=kit.FONT_COND))
    ring = kit.cyl((0, -0.072, 1.16), 0.055, 0.004, kit.emission("#FF3A26", 25), rot=(math.radians(90), 0, 0), verts=40)
    pad = kit.cyl((0, -0.074, 1.16), 0.046, 0.004, kit.mat("#202225", 0.4), rot=(math.radians(90), 0, 0), verts=40)
    parts += [ring, pad]
    for p in parts:
        p.parent = root
    root.location = (x, y, 0)
    root.rotation_euler = (0, 0, rz)
    w = 0.48
    c, s = math.cos(rz), math.sin(rz)
    face, _ = kit.screen("reader", (x + 0.073 * s, y - 0.073 * c, 1.53), w, plate, crop=crop, rot=(math.radians(90), 0, rz),
                         strength=1.1, bezel="#1B1C1F", depth=0.008, border=0.01)
    kit.point((x + 0.25 * s, y - 0.25 * c, 1.2), 3, kit.lin("#FF3A26")[:3], radius=0.03)   # the red glow on whoever stands here
    return face


def shot_qt_gate():
    ground()
    fence()
    floodlights()
    halls()
    face = kiosk("qt-gate", (200, 172, 270, 166), KIOSK, yaw=28)
    # Tomas, from behind, badge still in his hand, looking through the fence at the halls he can no longer enter
    tomas = P.person((KIOSK[0] - 0.75, KIOSK[1] + 0.1), facing=12, height=1.8, coat="#2B2F36", long_coat=True, hold="paper",
                     hair="#3A2E25", skin="#6E4630", seed=7)
    badge = next(c for c in tomas.children if c.dimensions.y < 0.01 and c.dimensions.z > 0.15)   # the paper, cut to a badge
    badge.scale = (0.34, 1, 0.39)
    badge.data.materials[0] = kit.mat("#E8EEF4", 0.4)
    kit.place("security_camera_01", (-2.6, 0.1, 3.1), rot_z=math.radians(-60))
    kit.haze((0, 30, 7), (90, 64, 14), 0.0006)
    kit.camera((KIOSK[0] + 0.35, KIOSK[1] - 2.3, 1.5), (KIOSK[0] - 0.75, KIOSK[1] + 1.0, 1.62), lens=40, fstop=4.0, focus=face)
    bpy.context.scene.view_settings.exposure = 0.0


kit.run({"qt-gate": shot_qt_gate})
