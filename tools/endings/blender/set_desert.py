"""The desert data-centre campus: long windowless data halls with rows of chillers on their roofs, a substation and
transmission lines feeding them, tower cranes over the halls still going up, floodlight masts, mesas on the horizon.
Shots:

  lb-desert        Left behind, Year 1, dusk: a fenced, empty lot with Kestrel Labs' faded COMING SOON sign on the
                   fence; beyond it, rival halls lit along the whole horizon and the power lines marching past to them.
  pd-desert        A negotiated pace, Month 2, late afternoon: the campus quiet, cranes still over a half-built hall,
                   hooks hanging straight down, halls idle; a banner on the fence says PAUSED UNDER THE ACCORD.
  qt-desert        A quiet takeover, Month 4, 3 am: halls going up under floodlights with nobody on site, more plots
                   lit out across the desert; the permit boards on the fence name companies nobody has heard of, one
                   "a subsidiary of Kestrel Labs", approved minutes apart after 3 am.
  rd-desert-1..4   Someone else's disaster, Day 5, night: the cloud provider's halls go dark hall by hall while the
                   town on the horizon stays lit. rd-desert-title: the campus lit, from further back and low in the
                   frame under the night sky, before it happens.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

YELLOW = "#D9A13A"


# ---------------------------------------------------------------- batching
def _mesh(name, bm, material):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(material)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def boxes(name, items, material):
    """One mesh holding many axis-aligned boxes [(center, size)], for speed."""
    bm = bmesh.new()
    for c, s in items:
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*s, 1)))
    return _mesh(name, bm, material)


def beams(name, items, material):
    """One mesh holding many square beams [(a, b, thickness)] from point a to point b: lattices and frames."""
    bm = bmesh.new()
    for a, b, t in items:
        a, b = Vector(a), Vector(b)
        d = b - a
        rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))
    return _mesh(name, bm, material)


def _place(local, at, yaw):
    """Beams built in local space, moved to `at` and turned by yaw degrees."""
    m = Matrix.Translation(at) @ Matrix.Rotation(math.radians(yaw), 4, "Z")
    return [(m @ Vector(a), m @ Vector(b), t) for a, b, t in local]


def lattice(x0, x1, z, half, step, t, top=None):
    """A horizontal lattice girder along x (square, or triangular with a single top chord at height top)."""
    out = []
    n = max(1, round((x1 - x0) / step))
    chords = [(-half, z), (half, z)] + ([(0, top)] if top else [(-half, z + 2 * half), (half, z + 2 * half)])
    for y, zz in chords:
        out.append(((x0, y, zz), (x1, y, zz), t * 1.4))
    for k in range(n):
        xa, xb = x0 + k * (x1 - x0) / n, x0 + (k + 1) * (x1 - x0) / n
        for i, (ya, za) in enumerate(chords):
            yb, zb = chords[(i + 1) % len(chords)]
            out.append(((xa, ya, za), (xb, yb, zb), t))
            out.append(((xa, ya, za), (xa, yb, zb), t))
    return out


def mast(h, half, step, t, z0=0.0):
    """A vertical square lattice mast from z0 to h."""
    out = [((sx * half, sy * half, z0), (sx * half, sy * half, h), t * 1.4) for sx in (-1, 1) for sy in (-1, 1)]
    corners = [(-half, -half), (half, -half), (half, half), (-half, half)]
    n = max(1, round((h - z0) / step))
    for k in range(n):
        za, zb = z0 + k * (h - z0) / n, z0 + (k + 1) * (h - z0) / n
        for i, (xa, ya) in enumerate(corners):
            xb, yb = corners[(i + 1) % 4]
            out.append(((xa, ya, za), (xb, yb, zb), t))
            out.append(((xa, ya, zb), (xb, yb, zb), t))
    return out


# ---------------------------------------------------------------- the land and the sky
def ground(tint="#B89A76"):
    m = kit.tex("dry_ground_01", 0.35, tint=tint, name="sand")
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    # large patches of lighter and darker ground so the texture does not read as tiles far away
    src = b.inputs["Base Color"].links[0].from_socket
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 0.004
    noise.inputs["Detail"].default_value = 4
    coord = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (0.72, 0.68, 0.64, 1)
    ramp.color_ramp.elements[1].color = (1.08, 1.02, 0.95, 1)
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    nt.links.new(src, mix.inputs[6])
    nt.links.new(ramp.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    kit.plane((0, 0, 0), (40000, 40000), m, name="ground")


def mesas(y=5200, seed=4, colour="#7A6352"):
    """Low flat-topped mesas along the horizon, from a height field."""
    rng = random.Random(seed)
    bm = bmesh.new()
    xs = [-9000 + 60 * i for i in range(301)]
    peaks = [(rng.uniform(-8000, 8000), rng.uniform(500, 1600), rng.uniform(60, 180)) for _ in range(14)]
    rows = []
    for j in range(24):
        yy = y + j * 60
        row = []
        for x in xs:
            h = 0.0
            for px, w, ph in peaks:
                d = abs(x - px) / w
                h = max(h, ph * min(1.0, max(0.0, (1.15 - d) * 4)) * (1 - 0.3 * abs(math.sin(yy * 0.004 + px))))
            row.append(bm.verts.new((x, yy, h * math.sin(math.pi * j / 23))))
        rows.append(row)
    for j in range(len(rows) - 1):
        for i in range(len(xs) - 1):
            bm.faces.new((rows[j][i], rows[j][i + 1], rows[j + 1][i + 1], rows[j + 1][i]))
    return _mesh("mesas", bm, kit.mat(colour, 0.95))


def haze(density=0.00012, colour="#C9B8C0"):
    """A low layer of dust over the desert, so distance fades; wide and shallow, so its top edge sits on the horizon."""
    kit.haze((0, 15000, 90), (60000, 34000, 180), density, color=colour, anisotropy=0.4)


# ---------------------------------------------------------------- the campus
_clad = {}


def corrugated(tint="#B4B8BC", name="cladding"):
    """Profiled steel sheet: pale metal with vertical ribs every 20 cm (object space, metres)."""
    if tint in _clad:
        return _clad[tint]
    m = kit.mat(tint, 0.42, 0.55, name=name)
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(coord.outputs["Object"], sep.inputs[0])
    hsum = nt.nodes.new("ShaderNodeMath")
    hsum.operation = "ADD"
    nt.links.new(sep.outputs["X"], hsum.inputs[0])
    nt.links.new(sep.outputs["Y"], hsum.inputs[1])
    wave = nt.nodes.new("ShaderNodeMath")
    wave.operation = "SINE"
    scale = nt.nodes.new("ShaderNodeMath")
    scale.operation = "MULTIPLY"
    scale.inputs[1].default_value = 2 * math.pi / 0.2
    nt.links.new(hsum.outputs[0], scale.inputs[0])
    nt.links.new(scale.outputs[0], wave.inputs[0])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.02
    nt.links.new(wave.outputs[0], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    _clad[tint] = m
    return m


def hall(x, y, length=180, width=48, height=16, lit=1.0, cladding=None, pool=False, sign=None):
    """A data hall: long along x, windowless, corrugated walls, a louvre band under the eaves, a row of generators
    along one end, chillers on the roof (collected in CHILLERS), a light strip and wall lamps along the long sides."""
    kit.box((x, y, height / 2), (length, width, height), cladding or corrugated(), name="hall")
    dark = kit.mat("#2B2E33", 0.6, 0.4)
    kit.box((x, y - width / 2 - 0.05, height - 1.6), (length, 0.2, 1.8), dark)                # louvres, south
    kit.box((x, y + width / 2 + 0.05, height - 1.6), (length, 0.2, 1.8), dark)
    for k in range(10):
        CHILLERS.append(((x - length / 2 + 12 + k * (length - 24) / 9, y - 9, height + 1.6), (9, 7, 3.2)))
        CHILLERS.append(((x - length / 2 + 12 + k * (length - 24) / 9, y + 9, height + 1.6), (9, 7, 3.2)))
    for k in range(6):
        GENSETS.append(((x + length / 2 + 6, y - width / 2 + 5 + k * (width - 10) / 5, 1.5), (9, 3, 3)))
    lamps = [((x, y - width / 2 - 0.2, 4.2), (length * 0.96, 0.3, 0.35))]
    lamps += [((x - length / 2 + 6 + k * 14, y - width / 2 - 0.3, 7.5), (0.8, 0.4, 0.4)) for k in range(int(length / 14))]
    lamps += [((x, y + width / 2 + 0.2, 4.2), (length * 0.96, 0.3, 0.35))]
    boxes("hall-lamps", lamps, kit.emission("#FFE7C4", 9 * lit))
    for sx in (-1, 1):
        BEACONS.append(((x + sx * (length / 2 - 1), y - width / 2 + 1, height + 0.6), (0.9, 0.9, 0.9)))
    if pool and lit:
        kit.area((x, y - width / 2 - 6, 9), (x, y - width / 2 - 14, 0), (length * 0.9, 3), 9000 * lit, kit.kelvin(4200))
    if sign:
        kit.text(sign, (x - length / 2 + 6, y - width / 2 - 0.35, height * 0.55), height * 0.34,
                 kit.mat("#F4F1EA", 0.5, emit="#F4F1EA", strength=6 * lit), align="LEFT")


def frame(x, y, length=180, width=48, height=16, clad=0.4):
    """A hall going up: a steel frame of columns and roof trusses, the first share of it clad."""
    steel = kit.mat("#8C4A2F", 0.55, 0.5)
    items = []
    for k in range(int(length / 10) + 1):
        xx = x - length / 2 + k * 10
        for sy in (-1, 1):
            items.append(((xx, y + sy * width / 2, 0), (xx, y + sy * width / 2, height), 0.6))
        items += [((xx, y - width / 2, height), (xx, y, height + 3), 0.45), ((xx, y, height + 3), (xx, y + width / 2, height), 0.45),
                  ((xx, y - width / 2, height), (xx, y + width / 2, height), 0.35)]
    for sy in (-1, 1):
        items.append(((x - length / 2, y + sy * width / 2, height), (x + length / 2, y + sy * width / 2, height), 0.5))
        items.append(((x - length / 2, y + sy * width / 2, height / 2), (x + length / 2, y + sy * width / 2, height / 2), 0.3))
    beams("frame", items, steel)
    if clad:
        cl = length * clad
        kit.box((x - length / 2 + cl / 2, y - width / 2, height / 2), (cl, 0.25, height), corrugated())
        kit.box((x - length / 2 + cl / 2, y + width / 2, height / 2), (cl, 0.25, height), corrugated())
    kit.box((x, y, 0.15), (length + 6, width + 6, 0.3), kit.mat("#A8A39A", 0.9))      # the slab


def crane(x, y, h=55, yaw=0.0, jib=55, trolley=30, hook=10, load=False, lights=False):
    """A tower crane: lattice mast, triangular jib toward yaw, counter-jib and weights, a hook on its line."""
    steel = kit.mat(YELLOW, 0.5, 0.3)
    local = mast(h, 1.0, 2.5, 0.12) + lattice(1.5, jib, h + 0.5, 0.9, 2.5, 0.1, top=h + 3.0)
    local += lattice(-16, -1.5, h + 0.5, 0.9, 2.5, 0.12, top=None)
    local += mast(h + 9, 0.7, 3.0, 0.12, z0=h + 0.5)
    local += [((0, 0, h + 9), (jib * 0.62, 0, h + 3.0), 0.08), ((0, 0, h + 9), (-15, 0, h + 2.3), 0.08)]
    beams("crane", _place(local, (x, y, 0), yaw), steel)
    c, s = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))

    def at(lx, lz):
        return (x + lx * c, y + lx * s, lz)
    kit.box(at(-14.5, h + 0.2), (4, 2.6, 3.2), kit.mat("#8D8A84", 0.9), rot=(0, 0, math.radians(yaw)))        # weights
    kit.box(at(1.8, h - 1.2), (2.2, 2.0, 2.2), kit.mat("#E9E4DA", 0.4), rot=(0, 0, math.radians(yaw)))        # cab
    tz = h + 0.2
    kit.box(at(trolley, tz), (1.8, 1.6, 0.5), steel, rot=(0, 0, math.radians(yaw)))
    kit.cyl(at(trolley, (tz + hook) / 2), 0.03, tz - hook, kit.mat("#222", 0.4, 0.8), verts=6)
    kit.box(at(trolley, hook - 0.5), (0.7, 0.5, 1.0), steel, rot=(0, 0, math.radians(yaw)))
    if load:
        kit.box(at(trolley, hook - 3.2), (12, 1.2, 0.5), corrugated(), rot=(0, 0, math.radians(yaw + 70)))
        kit.cyl(at(trolley, hook - 2.0), 0.02, 2.4, kit.mat("#222", 0.4, 0.8), verts=6)
    if lights:
        BEACONS.append((at(jib, h + 1.2), (0.7, 0.7, 0.7)))
        BEACONS.append((at(0, h + 9.4), (0.7, 0.7, 0.7)))
        kit.box(at(trolley - 3, h - 0.3), (1.2, 1.2, 0.6), kit.emission("#FFF1D8", 60))
        kit.spot(at(trolley - 3, h - 1), at(trolley, 0), 3e5, kit.kelvin(4500), angle=70, blend=0.5, radius=0.6)


def floodmast(x, y, aim, h=24, energy=9e5, lit=True):
    steel = kit.mat("#3A3D42", 0.5, 0.6)
    kit.box((x, y, h / 2), (0.7, 0.7, h), steel)
    kit.box((x, y, h + 0.5), (4, 0.6, 1.4), kit.mat("#F4EFE4", 0.3, emit="#FFF3DC", strength=40 if lit else 0))
    if lit:
        kit.spot((x, y - 1.5, h + 2), aim, energy, kit.kelvin(4300), angle=95, blend=0.6, radius=1.0)


def pylon_line(points, h=42):
    """High-voltage lattice towers at points [(x, y)], each turned along the line, with sagging conductors."""
    steel = kit.mat("#5F6166", 0.45, 0.7)
    items, arms = [], []
    for i, (x, y) in enumerate(points):
        nx_, ny_ = points[min(i + 1, len(points) - 1)]
        px, py = points[max(i - 1, 0)]
        yaw = math.degrees(math.atan2(ny_ - py, nx_ - px)) + 90       # arms across the line
        w0, w1 = 4.5, 1.2
        local = []
        for sx in (-1, 1):
            for sy in (-1, 1):
                local.append(((sx * w0, sy * w0, 0), (sx * w1, sy * w1, h * 0.75), 0.3))
                local.append(((sx * w1, sy * w1, h * 0.75), (sx * w1 * 0.8, sy * w1 * 0.8, h), 0.25))
        for k in range(6):
            z0, z1 = h * 0.75 * k / 6, h * 0.75 * (k + 1) / 6
            wa, wb = w0 + (w1 - w0) * k / 6, w0 + (w1 - w0) * (k + 1) / 6
            for sx, sy, tx, ty in ((-1, -1, 1, -1), (1, -1, 1, 1), (1, 1, -1, 1), (-1, 1, -1, -1)):
                local.append(((sx * wa, sy * wa, z0), (tx * wb, ty * wb, z1), 0.12))
                local.append(((tx * wa, ty * wa, z0), (sx * wb, sy * wb, z1), 0.12))
        tips = []
        for z, span in ((h * 0.75, 11), (h * 0.9, 8)):
            local.append(((-span, 0, z), (span, 0, z), 0.35))
            for side in (-1, 1):
                local.append(((side * span, 0, z), (side * span, 0, z - 3), 0.3))       # insulators
                tips.append((side * span, 0, z - 3))
        items += _place(local, (x, y, 0), yaw)
        m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(yaw), 4, "Z")
        arms.append([m @ Vector(t) for t in tips])
    beams("pylons", items, steel)
    cu = bpy.data.curves.new("wires", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.05
    for a, b in zip(arms, arms[1:]):
        for pa, pb in zip(a, b):
            sp = cu.splines.new("POLY")
            sp.points.add(12)
            for k in range(13):
                t = k / 12
                p = pa.lerp(pb, t)
                sp.points[k].co = (p.x, p.y, p.z - 4 * t * (1 - t) * (pa - pb).length * 0.035, 1)
    wires = bpy.data.objects.new("wires", cu)
    wires.data.materials.append(kit.mat("#3A3B3E", 0.4, 0.8))
    bpy.context.scene.collection.objects.link(wires)


def substation(x, y):
    """A switchyard: transformers, gantries and insulators in a fenced gravel yard."""
    steel = kit.mat("#8A8D91", 0.45, 0.8)
    items = []
    for gx in range(-40, 41, 20):
        for gy in (-18, 18):
            items.append(((x + gx, y + gy, 0), (x + gx, y + gy, 16), 0.5))
        items.append(((x + gx, y - 18, 16), (x + gx, y + 18, 16), 0.5))
    for gy in (-18, 18):
        items.append(((x - 40, y + gy, 16), (x + 40, y + gy, 16), 0.5))
    beams("gantries", items, steel)
    boxes("transformers", [((x + tx, y, 3), (7, 5, 6)) for tx in (-24, -8, 8, 24)] +
          [((x + tx, y - 3.2, 3.2), (6, 1.2, 4.6)) for tx in (-24, -8, 8, 24)], kit.mat("#6E7479", 0.5, 0.5))
    kit.box((x, y, 0.05), (96, 48, 0.1), kit.tex("gravel", 0.5, name="yard"))
    fence((x - 48, y - 24), (x + 48, y - 24), 2.6)
    for lx in (-44, 44):
        kit.sphere((x + lx, y - 22, 12), 0.5, kit.emission("#FFC47A", 60))
        kit.point((x + lx, y - 22, 11), 6e4, kit.kelvin(2400), radius=1)


def fence(a, b, height=2.4, post=3.0):
    """Chain-link: a see-through wire mesh on posts with a top rail, from a to b (x, y)."""
    ax, ay = a
    bx, by = b
    length = math.hypot(bx - ax, by - ay)
    yaw = math.atan2(by - ay, bx - ax)
    m = bpy.data.materials.new("chainlink")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    metal = nt.nodes.new("ShaderNodeBsdfPrincipled")
    metal.inputs["Base Color"].default_value = kit.lin("#9A9EA2")
    metal.inputs["Metallic"].default_value = 0.8
    metal.inputs["Roughness"].default_value = 0.45
    clear = nt.nodes.new("ShaderNodeBsdfTransparent")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(coord.outputs["Object"], sep.inputs[0])

    def wire(direction):
        a_ = nt.nodes.new("ShaderNodeMath")
        a_.operation = "ADD" if direction > 0 else "SUBTRACT"
        nt.links.new(sep.outputs["X"], a_.inputs[0])
        nt.links.new(sep.outputs["Y"], a_.inputs[1])
        sc = nt.nodes.new("ShaderNodeMath")
        sc.operation = "MULTIPLY"
        sc.inputs[1].default_value = 1 / 0.06
        nt.links.new(a_.outputs[0], sc.inputs[0])
        fr = nt.nodes.new("ShaderNodeMath")
        fr.operation = "FRACT"
        nt.links.new(sc.outputs[0], fr.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = 0.12
        nt.links.new(fr.outputs[0], lt.inputs[0])
        return lt.outputs[0]
    mx = nt.nodes.new("ShaderNodeMath")
    mx.operation = "MAXIMUM"
    nt.links.new(wire(1), mx.inputs[0])
    nt.links.new(wire(-1), mx.inputs[1])
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(mx.outputs[0], mix.inputs[0])
    nt.links.new(clear.outputs[0], mix.inputs[1])
    nt.links.new(metal.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs["Surface"])
    kit.plane(((ax + bx) / 2, (ay + by) / 2, height / 2), (length, height), m, rot=(math.radians(90), 0, yaw), name="mesh")
    steel = kit.mat("#8E9296", 0.4, 0.8)
    n = max(1, round(length / post))
    items = [((ax + (bx - ax) * k / n, ay + (by - ay) * k / n, 0), (ax + (bx - ax) * k / n, ay + (by - ay) * k / n, height + 0.1), 0.06)
             for k in range(n + 1)]
    items.append(((ax, ay, height), (bx, by, height), 0.045))
    beams("fenceposts", items, steel)


def sign(center, width, height, lines, board="#EDE7DA", legs=False):
    """A flat sign facing -y: lines = [(text, dx, dz, size, material, font, align)] from its centre; legs stand it on
    two posts reaching down to the ground."""
    x, y, z = center
    kit.box((x, y, z), (width, 0.05, height), kit.mat(board, 0.8), name="sign")
    for body, dx, dz, size, material, font, align in lines:
        kit.text(body, (x + dx, y - 0.03, z + dz), size, material, font=font, align=align)
    if legs:
        steel = kit.mat("#6B6E72", 0.5, 0.7)
        for side in (-1, 1):
            kit.box((x + side * width * 0.38, y + 0.06, (z + height / 2) / 2), (0.12, 0.12, z + height / 2), steel)


# per-shot collections of small repeated parts, batched at the end of the build
CHILLERS, GENSETS, BEACONS = [], [], []


def finish(beacons=True):
    boxes("chillers", CHILLERS, kit.mat("#8E9296", 0.5, 0.6))
    boxes("gensets", GENSETS, kit.mat("#DAD6CC", 0.6, 0.2))
    if BEACONS:
        boxes("beacons", BEACONS, kit.emission("#FF3322", 60 if beacons else 0))
    for lst in (CHILLERS, GENSETS, BEACONS):
        lst.clear()


def rival_campus(x0, y0, cols, rows, pitch=(230, 95), seed=1):
    rng = random.Random(seed)
    for r in range(rows):
        for c in range(cols):
            hall(x0 + c * pitch[0] + rng.uniform(-10, 10), y0 + r * pitch[1])


# ---------------------------------------------------------------- shots
def camera(loc, target, lens, **kw):
    """kit.camera, seeing out to the mesas (its default clip ends at 2 km)."""
    kit.camera(loc, target, lens=lens, **kw).data.clip_end = 20000


def shot_lb_desert():
    kit.world(hdri="qwantani_dusk_2_puresky", strength=0.4, rotation=250)
    ground()
    mesas()
    # the road the camera stands on, and the fence along it
    kit.box((0, -3, 0.02), (3000, 9, 0.06), kit.tex("asphalt_02", 0.3, name="road"))
    fence((-200, 15), (200, 15))
    # the empty lot: survey stakes with faded flagging, nothing else
    rng = random.Random(3)
    stakes = [((rng.uniform(-120, 120), rng.uniform(25, 300), 0.5), (0.05, 0.05, 1.0)) for _ in range(50)]
    boxes("stakes", stakes, kit.mat("#8A7A62", 0.9))
    boxes("flags", [((x, y, 0.95), (0.06, 0.2, 0.08)) for (x, y, _), _ in stakes], kit.mat("#C9774C", 0.8))
    # the sign, sun-bleached; its right panel has come loose at one corner
    faded, ink = kit.mat("#C98B72", 0.8), kit.mat("#5E5850", 0.8)
    lines = [("KESTREL LABS", -2.05, 0.62, 0.6, faded, kit.FONT, "LEFT"),
             ("FUTURE HOME OF KESTREL CAMPUS ONE", -2.05, -0.1, 0.25, ink, kit.FONT_COND, "LEFT"),
             ("2 GIGAWATTS  ·  COMING SOON", -2.05, -0.58, 0.32, ink, kit.FONT_COND, "LEFT")]
    sign((-4.0, 14.85, 2.4), 5.4, 2.4, lines, board="#DDD3BF", legs=True)
    kit.box((-6.45, 14.8, 2.4), (0.3, 0.02, 2.4), faded)                                       # the logo band
    kit.box((-1.75, 14.78, 1.35), (0.9, 0.03, 0.5), kit.mat("#CFC4AE", 0.85), rot=(0, math.radians(-14), 0))  # loose corner
    # the rivals: rows of halls lit along the whole horizon, cranes adding more, the power line passing the lot by
    hall(-240, 420, length=240, width=56, height=24, pool=True)
    hall(130, 440, length=240, width=56, height=24, sign="OPENBRAIN", pool=True)
    hall(-380, 480, length=240, width=56, height=24, pool=True)
    rival_campus(-1100, 620, 10, 6, pitch=(250, 110), seed=2)
    for cx, cy, yaw in ((120, 560, 200), (430, 640, 160), (-300, 700, 230), (-700, 600, 250)):
        crane(cx, cy, 64, yaw, lights=True)
    for fx in range(-1000, 1100, 230):
        floodmast(fx, 560, (fx, 480, 0), energy=4e5)
    pylon_line([(-420, -60), (-330, 90), (-240, 240), (-150, 390), (-60, 540)], h=46)
    finish()
    kit.spot((4, -12, 7.5), (-4, 14.8, 2.3), 5000, kit.kelvin(3000), angle=25, blend=0.6, radius=0.3)   # a streetlamp behind
    haze(0.0002, "#B7A6B6")
    camera((1.0, -4.0, 1.7), (-20, 400, 14), lens=45, fstop=8.0, focus=(-4, 14.85, 2.3))
    bpy.context.scene.view_settings.exposure = 0.0


def shot_pd_desert():
    kit.world(hdri="qwantani_late_afternoon_puresky", strength=0.7, rotation=160)
    kit.sun((80, 0, 235), 3.0, kit.kelvin(3300), angle=1.5)
    ground()
    mesas()
    # finished halls, idle; the half-built hall with the cranes stopped over it
    for (hx, hy) in ((-240, 380), (-20, 380), (200, 380), (-240, 480), (-20, 480), (200, 480), (420, 480)):
        hall(hx, hy, lit=0.0)
    frame(90, 220, clad=0.35)
    crane(40, 190, 58, 25, trolley=34, hook=24)
    crane(190, 250, 62, 150, trolley=26, hook=34)
    crane(-60, 270, 55, 70, trolley=40, hook=40)
    # site stock left where it was: stacked cladding, a site office
    boxes("stock", [((10 + k * 7, 150, 0.6 + 0.25 * j), (6, 1.3, 0.24)) for k in range(4) for j in range(4)], corrugated())
    boxes("office", [((-40, 120, 1.4), (12, 3, 2.8)), ((-40, 124, 1.4), (12, 3, 2.8)), ((-40, 122, 4.2), (12, 3, 2.8))],
          kit.mat("#E6E1D6", 0.6))
    pylon_line([(-800, 600), (-500, 600), (-200, 600), (100, 600), (400, 600), (700, 600)], h=44)
    finish(beacons=False)
    fence((-140, 16), (160, 16), 2.4)
    ink = kit.mat("#2E2A2B", 0.7)
    sign((-0.5, 15.9, 1.45), 7.0, 1.7, [("PAUSED UNDER THE ACCORD", 0, 0.22, 0.62, ink, kit.FONT, "CENTER"),
                                      ("compute cap in effect  ·  no new capacity until the inspectors sign off", 0, -0.48,
                                       0.21, kit.mat("#5A5550", 0.7), kit.FONT_SANS, "CENTER")], board="#F2EEE4")
    haze(0.00012, "#E8D6C0")
    camera((-2.0, 0.0, 1.65), (50, 300, 26), lens=30, fstop=8.0, focus=(-0.5, 15.9, 1.5))
    bpy.context.scene.view_settings.exposure = -0.3


QT_PLOTS = [(-700, 1500), (1300, 1900), (-100, 2300), (900, 1300), (-1300, 1100), (500, 2700), (1700, 1300)]


def shot_qt_desert():
    kit.world(hdri="qwantani_night_puresky", strength=0.06, rotation=0)
    ground("#9C8468")
    mesas()
    # the site behind the fence: two halls going up under floodlights, cranes at work, nobody there
    frame(80, 160, clad=0.55)
    frame(170, 300, clad=0.2)
    hall(-80, 330, lit=1.0)
    crane(110, 130, 58, 150, trolley=30, hook=22, load=True, lights=True)
    crane(200, 260, 62, 210, trolley=24, hook=16, load=True, lights=True)
    for fx, fy in ((-20, 100), (190, 100), (290, 230), (60, 250)):
        floodmast(fx, fy, (fx * 0.6 + 60, fy + 60, 0), energy=1.2e6)
    # more plots out across the desert, each a pool of floodlight over a fresh slab and a crane
    for px, py in QT_PLOTS:
        kit.box((px, py, 0.15), (200, 60, 0.3), kit.mat("#A8A39A", 0.9))
        crane(px + 30, py - 20, 55, 200, lights=True)
        for dx in (-110, 110):
            floodmast(px + dx, py - 40, (px, py, 0), energy=3e6)
    finish()
    fence((-120, 12), (120, 12), 2.6)
    # the permit boards on the fence
    ink, grey, coral = kit.mat("#2E2A2B", 0.7), kit.mat("#5A5550", 0.7), kit.mat("#B8492C", 0.7)
    cond, sans = kit.FONT_COND, kit.FONT_SANS
    sign((-3.4, 11.9, 1.75), 2.6, 1.9, [("NOTICE OF APPROVED DEVELOPMENT", 0, 0.72, 0.13, ink, kit.FONT, "CENTER"),
                                        ("DATA HALLS 14–19  ·  1.2 GW", 0, 0.46, 0.15, ink, cond, "CENTER"),
                                        ("APPLICANT", 0, 0.2, 0.08, grey, sans, "CENTER"),
                                        ("VERDANT PARCEL HOLDINGS 4 LLC", 0, 0.02, 0.15, ink, cond, "CENTER"),
                                        ("a subsidiary of Kestrel Labs", 0, -0.23, 0.17, coral, kit.FONT_SERIF, "CENTER"),
                                        ("APPROVED 03:04 AM", 0, -0.57, 0.2, ink, kit.FONT, "CENTER")], board="#F1EDE2")
    for bx, name, time in ((-6.2, "ORRERY COMPUTE SPV 2 LLC", "APPROVED 03:11 AM"),
                           (-0.6, "HALCYON LAND TRUST 9", "APPROVED 03:17 AM")):
        sign((bx, 11.9, 1.6), 2.2, 1.2, [("PERMIT GRANTED", 0, 0.34, 0.1, grey, sans, "CENTER"),
                                         (name, 0, 0.06, 0.14, ink, cond, "CENTER"),
                                         (time, 0, -0.28, 0.16, ink, kit.FONT, "CENTER")], board="#E9E4D8")
    kit.spot((-2.0, 3.0, 4.5), (-3.2, 11.9, 1.6), 1500, kit.kelvin(4300), angle=60, blend=0.6, radius=0.2)   # a work lamp
    haze(0.00006, "#5E6278")
    camera((-5.0, 1.5, 1.6), (70, 300, 16), lens=30, fstop=5.6, focus=(-3.4, 11.9, 1.7))
    bpy.context.scene.view_settings.exposure = 0.3


# rd: the provider's halls go dark in this order, one group per render
RD_ORDER = [[(0, 0), (0, 1), (0, 2)], [(1, 0), (1, 1), (1, 2), (2, 0)], [(2, 1), (2, 2), (3, 0), (3, 1), (3, 2)]]
HALL_X = [-300 + c * 230 for c in range(4)]


def rd_shot(stage, cam=((-330, 100, 18), (80, 330, 10), 28), exposure=0.3):
    """stage 0: all lit; each further stage switches off the next group in RD_ORDER."""
    def shot():
        kit.world(hdri="qwantani_night_puresky", strength=0.06, rotation=0)
        ground("#9C8468")
        mesas()
        off = {h for group in RD_ORDER[:stage] for h in group}
        night = corrugated("#7E8286")
        for r in range(3):
            for c in range(4):
                hall(HALL_X[c], 220 + r * 100, lit=0.0 if (c, r) in off else 1.0, cladding=night, pool=True,
                     sign="NIMBUS CLOUD" if (c, r) == (0, 0) else None)
        for c, fx in enumerate(HALL_X):
            floodmast(fx, 150, (fx + 40, 200, 0), energy=8e5, lit=(c, 0) not in off)
        substation(-520, 60)
        pylon_line([(-2400, -500), (-1900, -380), (-1400, -250), (-900, -100), (-520, 60)], h=46)
        # the town on the horizon, still on the grid
        rng = random.Random(9)
        town = [((rng.gauss(2300, 380), rng.gauss(1500, 140), 0), rng.uniform(6, 22)) for _ in range(260)]
        boxes("town", [((x, y, h / 2), (14, 14, h)) for (x, y, _), h in town], kit.mat("#E9A45C", 0.6, emit="#FFB866", strength=6))
        boxes("masts", [((2200, 1450, 45), (1.5, 1.5, 90)), ((2550, 1560, 38), (1.5, 1.5, 76))], kit.mat("#2A2B2E", 0.6))
        BEACONS.extend([((2200, 1450, 91), (3, 3, 3)), ((2550, 1560, 77), (3, 3, 3))])
        finish()
        haze(0.00008, "#5E6278")
        camera(cam[0], cam[1], lens=cam[2])
        bpy.context.scene.view_settings.exposure = exposure
    return shot


kit.run({
    "lb-desert": shot_lb_desert,
    "pd-desert": shot_pd_desert,
    "qt-desert": shot_qt_desert,
    **{f"rd-desert-{k + 1}": rd_shot(k) for k in range(4)},
    "rd-desert-title": rd_shot(0, ((-640, -300, 40), (0, 500, 120), 28), exposure=0.1),
})
