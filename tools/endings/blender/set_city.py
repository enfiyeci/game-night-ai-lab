"""The city at dusk, seen from a high rooftop: blocks of towers with lit windows, streets of lamps, a river, and a
billboard on the roof across from the camera. Every building belongs to a district, so one camera can be rendered
several times with districts going dark (the player crossfades the renders). Shots:

  mis-skyline-1..3   Catastrophic misalignment, Day 12, dusk: the grid goes down district by district, while the
                     billboard, run by the model, keeps saying ALL SYSTEMS OPERATIONAL. -3 is also the title card.
"""
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

DISTRICTS = 6


def window_material(name="facade", lit_share=0.55, warm="#FFC98A", seed=0.0):
    """Dark facade with a grid of windows; a share of them lit. The object property 'lit' (0-1) dims the whole
    building, and 'seed' shuffles which windows are on."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = kit.lin("#2A2D33")
    b.inputs["Roughness"].default_value = 0.35
    b.inputs["Metallic"].default_value = 0.3
    coord = nt.nodes.new("ShaderNodeTexCoord")
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.squash = 1.0
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Brick Width"].default_value = 1.8
    brick.inputs["Row Height"].default_value = 3.4
    brick.inputs["Mortar Size"].default_value = 0.5
    brick.inputs["Bias"].default_value = 0.0
    brick.inputs["Color1"].default_value = (0, 0, 0, 1)
    brick.inputs["Color2"].default_value = (1, 1, 1, 1)
    # object-space coordinates in metres, shuffled per building
    add = nt.nodes.new("ShaderNodeVectorMath")
    add.operation = "ADD"
    sd = kit_attr(nt, "seed")
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(sd.outputs["Fac"], comb.inputs["X"])
    nt.links.new(sd.outputs["Fac"], comb.inputs["Y"])
    nt.links.new(coord.outputs["Object"], add.inputs[0])
    nt.links.new(comb.outputs[0], add.inputs[1])
    # facades lie in xz and yz: use x+y as the horizontal coordinate
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(add.outputs[0], sep.inputs[0])
    hsum = nt.nodes.new("ShaderNodeMath")
    hsum.operation = "ADD"
    nt.links.new(sep.outputs["X"], hsum.inputs[0])
    nt.links.new(sep.outputs["Y"], hsum.inputs[1])
    vec = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(hsum.outputs[0], vec.inputs["X"])
    nt.links.new(sep.outputs["Z"], vec.inputs["Y"])
    nt.links.new(vec.outputs[0], brick.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[1].position = 1 - lit_share
    nt.links.new(brick.outputs["Color"], ramp.inputs["Fac"])
    glass = nt.nodes.new("ShaderNodeMath")
    glass.operation = "SUBTRACT"
    glass.inputs[0].default_value = 1.0
    nt.links.new(brick.outputs["Fac"], glass.inputs[1])          # 1 inside a window, 0 on the frame
    on = nt.nodes.new("ShaderNodeMath")
    on.operation = "MULTIPLY"
    nt.links.new(ramp.outputs["Color"], on.inputs[0])
    nt.links.new(glass.outputs[0], on.inputs[1])
    lit = kit_attr(nt, "lit")
    on2 = nt.nodes.new("ShaderNodeMath")
    on2.operation = "MULTIPLY"
    nt.links.new(on.outputs[0], on2.inputs[0])
    nt.links.new(lit.outputs["Fac"], on2.inputs[1])
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    nsep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], nsep.inputs[0])
    side = nt.nodes.new("ShaderNodeMath")
    side.operation = "LESS_THAN"
    side.inputs[1].default_value = 0.5
    nt.links.new(nsep.outputs["Z"], side.inputs[0])            # 1 on walls, 0 on roofs
    walls = nt.nodes.new("ShaderNodeMath")
    walls.operation = "MULTIPLY"
    nt.links.new(on2.outputs[0], walls.inputs[0])
    nt.links.new(side.outputs[0], walls.inputs[1])
    strength = nt.nodes.new("ShaderNodeMath")
    strength.operation = "MULTIPLY"
    strength.inputs[1].default_value = 1.4
    nt.links.new(walls.outputs[0], strength.inputs[0])
    b.inputs["Emission Color"].default_value = kit.lin(warm)
    nt.links.new(strength.outputs[0], b.inputs["Emission Strength"])
    return m


def kit_attr(nt, name):
    a = nt.nodes.new("ShaderNodeAttribute")
    a.attribute_type = "OBJECT"
    a.attribute_name = name
    return a


def _district(x, y):
    angle = math.degrees(math.atan2(x, y + 300))     # seen from the hill, left to right
    return min(DISTRICTS - 1, max(0, int((angle + 36) / 72 * DISTRICTS)))


def _batch(name, boxes, material, props):
    """One mesh object holding many boxes [(center, size)], for speed."""
    import bmesh
    from mathutils import Matrix
    bm = bmesh.new()
    for (cx, cy, cz), (sx, sy, sz) in boxes:
        m = Matrix.Translation((cx, cy, cz)) @ Matrix.Diagonal((sx, sy, sz, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    for k, v in props.items():
        ob[k] = v
    bpy.context.scene.collection.objects.link(ob)
    return ob


def city(dark=(), seed=12):
    """Towers on a grid of blocks, grouped by district (0-5, left to right from the hill) and facade."""
    rng = random.Random(seed)
    facades = [window_material(f"facade{i}", lit_share=sh, warm=w) for i, (sh, w) in
               enumerate(((0.32, "#FFC98A"), (0.22, "#FFE3B8"), (0.38, "#FFB870"), (0.28, "#DDE8FF")))]
    kit.box((0, 600, -0.5), (4000, 2600, 1), kit.mat("#16181C", 0.6))
    kit.box((0, 420, -0.3), (4000, 60, 0.4), kit.mat("#0E1520", 0.05))   # the river
    groups = {}
    roofs = []
    lamps = {}
    reds = {}
    for bx in range(-24, 25):
        for by in range(2, 40):
            if by in (11, 12):
                continue
            x, y = bx * 34 + rng.uniform(-3, 3), by * 34 + rng.uniform(-3, 3)
            core = math.exp(-((x - 60) ** 2 + (y - 760) ** 2) / (2 * 360 ** 2))
            h = rng.uniform(10, 36) + core * rng.uniform(30, 200)
            w, d = rng.uniform(16, 26), rng.uniform(16, 26)
            dist = _district(x, y)
            f = rng.randrange(len(facades))
            if h > 55:   # a podium and a narrower tower, sometimes a crown
                ph = h * rng.uniform(0.15, 0.3)
                groups.setdefault((dist, f), []).append(((x, y, ph / 2), (w + 6, d + 6, ph)))
                tw, td = w * rng.uniform(0.6, 0.85), d * rng.uniform(0.6, 0.85)
                split = h * rng.uniform(0.7, 0.85)
                groups.setdefault((dist, f), []).append(((x, y, split / 2), (tw, td, split)))
                groups.setdefault((dist, f), []).append(((x, y, (split + h) / 2), (tw * 0.75, td * 0.75, h - split)))
                roofs.append(((x, y, h + 2), (tw * 0.3, td * 0.3, 4)))
                if rng.random() < 0.3:
                    roofs.append(((x, y, h + 12), (0.6, 0.6, 20)))
            else:
                groups.setdefault((dist, f), []).append(((x, y, h / 2), (w, d, h)))
                for _ in range(rng.randint(0, 3)):
                    roofs.append(((x + rng.uniform(-w / 3, w / 3), y + rng.uniform(-d / 3, d / 3), h + 1.2), (rng.uniform(2, 5), rng.uniform(2, 5), 2.4)))
            if h > 120 and rng.random() < 0.6:
                reds.setdefault(dist, []).append(((x, y, h + 0.6), (1.2, 1.2, 1.2)))
            if by % 2 == 0:
                lamps.setdefault(dist, []).append(((x + 17, y, 6), (1.0, 1.0, 0.5)))
    for (dist, f), boxes in groups.items():
        _batch(f"d{dist}f{f}", boxes, facades[f], {"lit": 0.0 if dist in dark else 1.0, "seed": 0.0})
    _batch("roofs", roofs, kit.mat("#24262A", 0.7), {})
    for dist, boxes in lamps.items():
        _batch(f"lamps{dist}", boxes, kit.emission("#FFB25A", 0.0 if dist in dark else 10), {})
    for dist, boxes in reds.items():
        _batch(f"reds{dist}", boxes, kit.emission("#FF3B2A", 0.0 if dist in dark else 30), {})


def billboard(lines, x=70, y=-120, z=62, width=26, lit=True, cam=(0, -300)):
    """A rooftop billboard facing the camera (at the origin)."""
    steel = kit.mat("#2A2B2E", 0.5, 0.7)
    yaw = math.atan2(-(x - cam[0]), y - cam[1])
    kit.box((x, y, z / 2), (24, 20, z), window_material("near", lit_share=0.3))    # the building it stands on
    for dx in (-8, 8):
        kit.box((x + dx * math.cos(yaw), y + dx * math.sin(yaw), z + 3), (0.6, 0.6, 6), steel)
    kit.box((x, y, z + 11), (width + 1, 0.8, 11), steel, rot=(0, 0, yaw))
    nx, ny = math.sin(yaw), -math.cos(yaw)        # the face's normal, toward the camera
    face = kit.box((x + 0.45 * nx, y + 0.45 * ny, z + 11), (width, 0.1, 10),
                   kit.mat("#0B1C1A", 0.4, emit="#0E2A26", strength=1.0 if lit else 0.0), rot=(0, 0, yaw))
    for body, dz, size, colour in lines:
        kit.text(body, (x + 0.55 * nx, y + 0.55 * ny, z + 11 + dz), size, colour, font=kit.FONT, rot=(math.radians(90), 0, yaw))
    return face


def sky():
    kit.world(hdri="qwantani_dusk_2_puresky", strength=0.28, rotation=250)


def skyline_shot(dark):
    def shot():
        sky()
        city(dark=dark)
        teal = kit.mat("teal", 0.5, emit="#3FE0C0", strength=18)
        white = kit.mat("#FFFFFF", 0.5, emit="#E8FFF8", strength=10)
        billboard([("ALL SYSTEMS", 2.2, 3.4, teal), ("OPERATIONAL", -1.6, 3.4, teal),
                   ("GRID UPTIME 100%  ·  MANAGED BY KESTREL 4", -4.0, 0.8, white)])
        kit.sun((96, 0, 250), 0.3, kit.kelvin(2400), angle=3)
        kit.camera((0, -300, 118), (30, 800, 5), lens=40)
        kit.haze((0, 700, 120), (3000, 1800, 240), 0.00025, color="#E8D2D8", anisotropy=0.5)
        bpy.context.scene.view_settings.exposure = 0.2
    return shot


kit.run({
    "mis-skyline-1": skyline_shot(()),
    "mis-skyline-2": skyline_shot((0, 1, 4)),
    "mis-skyline-3": skyline_shot((0, 1, 2, 3, 4, 5)),
})
