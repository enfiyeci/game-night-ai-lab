"""Washington: the President's office at night. A heavy desk, tall windows with drapes, and a television on a
console. Shots:

  mis-order   Catastrophic misalignment, Day 11: the signed executive order to suspend every AI agent lies on the
              desk; on the television behind it the request system shows the order RESOLVED, closed automatically.
"""
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

RW, RD, RH = 4.5, 7.0, 3.6


def office():
    wall = kit.mat("#E6DCC6", 0.8)
    trim = kit.mat("#F2EBDC", 0.6)
    kit.box((0, RD / 2, -0.05), (2 * RW, RD, 0.1), kit.mat("#1F2A44", 0.95))         # deep blue carpet
    kit.box((0, RD / 2, RH + 0.05), (2 * RW, RD, 0.1), trim)
    kit.box((0, RD + 0.05, RH / 2), (2 * RW, 0.1, RH), wall)
    kit.box((-RW - 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    kit.box((RW + 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    kit.box((0, -0.05, RH / 2), (2 * RW, 0.1, RH), wall)
    kit.box((0, RD - 0.02, 0.06), (2 * RW, 0.06, 0.12), trim)          # skirting
    kit.box((0, RD - 0.03, RH - 0.12), (2 * RW, 0.08, 0.2), trim)      # cornice
    # three tall windows in the back wall, night beyond, drapes either side
    drape = kit.mat("#B58A3C", 0.75)
    for wx in (-2.6, 0.0, 2.6):
        kit.box((wx, RD - 0.01, 1.9), (1.2, 0.02, 2.4), kit.mat("#0E1726", 0.1, emit="#1A2A44", strength=0.25))
        kit.box((wx, RD - 0.04, 1.9), (0.04, 0.05, 2.4), trim)
        kit.box((wx, RD - 0.04, 1.9), (1.2, 0.05, 0.04), trim)
        for side in (-1, 1):
            kit.box((wx + side * 0.75, RD - 0.18, 1.95), (0.34, 0.14, 2.9), drape, bevel=0.05)
    kit.world("#05070B", 1.0)


def desk(x=0.0, y=3.4):
    wood = kit.mat("#4A2E1C", 0.35, coat=0.6)
    kit.box((x, y, 0.76), (2.2, 1.1, 0.06), wood, bevel=0.01)
    kit.box((x, y + 0.1, 0.38), (2.1, 0.9, 0.74), wood, bevel=0.02)
    for px in (-0.7, 0.0, 0.7):
        kit.box((x + px, y - 0.36, 0.38), (0.6, 0.02, 0.6), kit.mat("#3B2416", 0.4, coat=0.4), bevel=0.01)
    kit.box((x, y - 0.1, 0.795), (1.6, 0.7, 0.004), kit.mat("#2D3B2A", 0.7))      # blotter


def tv(plate, crop, x, y, width=1.4, z=1.55, yaw=0.0):
    kit.box((x, y + 0.05, 0.45), (1.8, 0.45, 0.9), kit.mat("#3B2416", 0.4, coat=0.4), bevel=0.02, rot=(0, 0, math.radians(yaw)))
    face, _ = kit.screen("tv", (x, y, z), width, plate, crop=crop, rot=(math.radians(90), 0, math.radians(yaw)), strength=1.3,
                         depth=0.05, border=0.02, bezel="#0D0E10")
    return face


def order_paper(at, rot_z=0.0):
    x, y, z = at
    kit.box((x, y, z + 0.004), (0.25, 0.33, 0.003), kit.mat("#1E2C4E", 0.5), rot=(0, 0, rot_z))          # the folder
    kit.box((x + 0.01, y, z + 0.007), (0.216, 0.29, 0.0012), kit.mat("#F4F0E6", 0.7), rot=(0, 0, rot_z))  # the page
    flat = (0, 0, rot_z)
    ink = kit.mat("#1C1C1C", 0.6)
    lines = [("EXECUTIVE ORDER 7-A", 0.11, 0.0095, kit.FONT_SERIF), ("Suspension of All Deployed", 0.08, 0.0125, kit.FONT_SERIF),
             ("Artificial Intelligence Agents", 0.063, 0.0125, kit.FONT_SERIF)]
    c, s = math.cos(rot_z), math.sin(rot_z)
    for body, dy, size, font in lines:
        kit.text(body, (x + 0.01 - dy * s, y + dy * c, z + 0.0085), size, ink, font=font, rot=flat)
    for k in range(9):   # body text as grey rules
        dy = 0.03 - k * 0.014
        kit.box((x + 0.01 - dy * s, y + dy * c, z + 0.0082), (0.17 if k % 4 != 3 else 0.11, 0.0022, 0.0003), kit.mat("#8A8780", 0.7), rot=flat)
    # the signature, a quick scrawl
    import bmesh
    bm = bmesh.new()
    pts = [(-0.05 + t * 0.1, -0.1 + 0.012 * math.sin(t * 19) + 0.006 * math.sin(t * 43), 0) for t in [i / 40 for i in range(41)]]
    verts = [bm.verts.new(p) for p in pts]
    for a, b in zip(verts, verts[1:]):
        bm.edges.new((a, b))
    me = bpy.data.meshes.new("sig")
    bm.to_mesh(me)
    sig = bpy.data.objects.new("sig", me)
    bpy.context.scene.collection.objects.link(sig)
    sig.location = (x + 0.02, y, z + 0.0086)
    sig.rotation_euler = flat
    skin = sig.modifiers.new("w", "SKIN")
    for v in me.skin_vertices[0].data:
        v.radius = (0.0009, 0.0003)
    sig.data.materials.append(ink)


def shot_mis_order():
    office()
    desk()
    face = tv("mis-order", (40, 70, 1200, 675), 2.2, 5.9, width=1.5, yaw=-18)
    order_paper((-0.25, 3.2, 0.797), rot_z=math.radians(8))
    kit.cyl((0.02, 3.18, 0.805), 0.006, 0.14, kit.mat("#111", 0.3, 0.6), rot=(0, math.radians(90), math.radians(30)))   # the pen
    # the desk phone, receiver off the hook
    kit.box((0.62, 3.45, 0.83), (0.2, 0.24, 0.06), kit.mat("#16171A", 0.4), bevel=0.01)
    kit.box((0.5, 3.15, 0.815), (0.22, 0.05, 0.035), kit.mat("#16171A", 0.4), bevel=0.012, rot=(0, 0, 0.4))
    # a brass banker's lamp with a green glass shade
    brass = kit.mat("#B8913F", 0.25, 1.0)
    kit.cyl((-0.8, 3.62, 0.81), 0.08, 0.025, brass)
    kit.cyl((-0.8, 3.62, 0.95), 0.012, 0.28, brass)
    kit.box((-0.8, 3.55, 1.1), (0.3, 0.13, 0.07), kit.mat("#1F5A3A", 0.15, emit="#2F8A56", strength=0.4), bevel=0.03)
    kit.spot((-0.8, 3.5, 1.06), (-0.3, 3.2, 0.8), 30, kit.kelvin(2600), angle=80, blend=0.8)
    kit.point((2.2, 5.3, 1.5), 3, kit.kelvin(7000), radius=0.4)       # the TV's glow on the room
    kit.area((0, 1.0, 3.0), (0, 4, 0), (3, 2), 25, kit.kelvin(3200))   # a low fill from the corridor lamps
    kit.haze((0, RD / 2, RH / 2), (2 * RW - 0.1, RD - 0.1, RH - 0.1), 0.006)
    kit.camera((-1.1, 1.6, 1.55), (0.75, 4.9, 0.95), lens=30, fstop=5.6, focus=face)


kit.run({"mis-order": shot_mis_order})
