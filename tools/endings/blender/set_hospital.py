"""St. Brigid's Hospital, emergency department: rows of beam seating down a central aisle, a board hung over the
aisle, a glass front onto a wet street, and double doors to the treatment rooms in the back wall. Triage runs on a
workstation cart. Shots:

  mis-triage   Catastrophic misalignment, Day 6: every seat empty, the board reads WAITING NOW 0, and outside the
               glass the patients queue in the rain with their appointment slips.
  al-triage    Aligned, night: the triage screen on the cart says it is not confident and asks for a doctor; a doctor
               in a white coat is already walking up the aisle from the treatment doors toward it.
  mu-hospital  Misuse, 3:10 am: the lights are out and every screen in the room, the board, the wall TVs, the
               check-in kiosks and the cart, shows the same red ransom note; a nurse stands under it with a torch.
  pd-trial     Pacing deal, Month 6, daytime: a clinician in scrubs stands at the triage cart, checking the AI's
               suggestion for each patient on the list against her own notes, backlit by the daylit glass front.
  cw-triage    Pyrrhic, Month 2: close on the triage screen answering "Summary available on request." (framed like
               cw-port and cw-chat: the same screen size and angle).
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

W, D, H = 5.2, 10.0, 3.2      # half-width, depth (front wall y=0, glass front y=D), ceiling height
BY = D - 1.1                  # the board hangs here


def room(dead_light=(2.6, 6.6), tube_energy=45, lights=True, daylight=False):
    """lights False leaves every ceiling panel dark; daylight lets the sky through the glass front."""
    floor = kit.tex("terrazzo_tiles", 0.35, name="floor")
    wall = kit.tex("painted_plaster_wall", 0.4, tint="#E8EEEA", name="wall")
    kit.box((0, D / 2, -0.05), (2 * W, D + 0.4, 0.1), floor)
    kit.box((0, D / 2, H + 0.05), (2 * W, D + 0.4, 0.1), kit.tex("ceiling_interior", 0.5, name="ceiling"))
    # the back wall, with the double doors to treatment (x 1.0..2.8)
    kit.box(((-W + 1.0) / 2, -0.1, H / 2), (W + 1.0, 0.2, H), wall)
    kit.box(((W + 2.8) / 2, -0.1, H / 2), (W - 2.8, 0.2, H), wall)
    kit.box((1.9, -0.1, (H + 2.3) / 2), (1.8, 0.2, H - 2.3), wall)
    for side in (-1, 1):
        kit.box((side * (W + 0.1), D / 2, H / 2), (0.2, D, H), wall)
        kit.box((side * (W - 0.005), D / 2, 1.05), (0.02, D, 0.08), kit.mat("#17465E", 0.35))
    frame = kit.mat("#9AA0A6", 0.3, 0.9)
    glass = kit.glass(0.09)
    kit.box((0, D, 2.62), (2 * W, 0.14, 0.12), frame)
    kit.box((0, D, 2.9), (2 * W, 0.18, 0.6), frame)
    for x in (-W, -3.4, -1.7, -0.02, 1.7, 3.4, W):
        kit.box((x, D, 1.3), (0.08, 0.14, 2.6), frame)
    kit.box((0, D, 0.03), (2 * W, 0.16, 0.06), frame)
    panes = [kit.box(((x0 + x1) / 2, D, 1.3), (x1 - x0 - 0.08, 0.02, 2.5), glass)
             for x0, x1 in ((-W, -3.4), (-3.4, -1.7), (1.7, 3.4), (3.4, W))]
    panes += [kit.box((x, D - 0.12, 1.3), (1.6, 0.03, 2.5), glass) for x in (-0.92, 0.92)]
    if daylight:
        for p in panes:
            p.visible_shadow = p.visible_diffuse = False   # daylight passes the glass (it would block it)
    for x in (-0.9, 0.9):
        kit.box((x, D - 0.12, 1.3), (0.05, 0.05, 2.5), frame)
    # ceiling panels, one dead
    for y in (1.8, 4.2, 6.6, 9.0):
        for x in (-2.6, 0.0, 2.6):
            dead = (x, y) == dead_light or not lights
            kit.box((x, y, H - 0.02), (0.6, 1.2, 0.03), frame if dead else kit.emission("#F2FAF6", 20 * tube_energy / 45))
            if not dead:
                L = kit.area((x, y, H - 0.06), (x, y, 0), (0.6, 1.2), tube_energy, (0.92, 1.0, 0.96))
    return frame


def beam_row(x, y0, n, facing, seat, metal):
    pitch = 0.56
    length = n * pitch
    kit.box((x - facing * 0.05, y0 + length / 2 - pitch / 2, 0.36), (0.06, length, 0.06), metal)
    for k in range(0, n + 1, 3):
        yk = min(y0 - pitch / 2 + k * pitch + 0.1, y0 + length - pitch / 2 - 0.1)
        kit.box((x - facing * 0.05, yk, 0.18), (0.05, 0.05, 0.36), metal)
        kit.box((x - facing * 0.05, yk, 0.015), (0.5, 0.06, 0.03), metal)
    for k in range(n):
        yk = y0 + k * pitch
        kit.box((x, yk, 0.45), (0.46, 0.5, 0.06), seat, bevel=0.02)
        kit.box((x - facing * 0.25, yk, 0.72), (0.05, 0.5, 0.44), seat, bevel=0.02, rot=(0, facing * math.radians(-10), 0))
        if k % 2 == 1 or k == n - 1:
            kit.box((x - facing * 0.02, yk + pitch / 2, 0.62), (0.4, 0.04, 0.03), metal)


def seating():
    seat, metal = kit.mat("#17465E", 0.35), kit.mat("#C7CCD1", 0.25, 1.0)
    for side in (-1, 1):
        beam_row(side * 1.55, 1.6, 11, -side, seat, metal)
        beam_row(side * 2.25, 1.6, 11, side, seat, metal)
        beam_row(side * (W - 0.45), 1.6, 11, -side, seat, metal)


def street(lamp_x=3.2, sky="modern_evening_street", sky_strength=0.18, lamp=True):
    pave = kit.tex("asphalt_02", 0.3, rough=0.08, name="pave")
    kit.box((0, D + 6, -0.06), (40, 12, 0.1), pave)
    kit.box((0, D + 3.4, 0.0), (40, 0.25, 0.14), kit.mat("#7D7F82", 0.7))
    kit.box((0, D + 10, -0.1), (40, 8, 0.1), kit.mat("#5C6068", 0.7))
    kit.box((0, D + 16, 3), (40, 0.4, 6), kit.mat("#5C6068", 0.7))
    rng = random.Random(3)
    for i in range(14):
        for zz in (1.4, 3.6):
            lit = rng.random() < 0.35
            kit.box((-18 + i * 2.8, D + 15.78, zz), (1.3, 0.05, 1.1),
                    kit.mat("#FFD9A0", 0.5, emit="#FFC98A", strength=1.2) if lit else kit.mat("#141516", 0.3))
    kit.place("street_lamp_01", (lamp_x, D + 3.0, 0), rot_z=math.radians(180))
    if lamp:
        kit.spot((lamp_x, D + 2.2, 4.8), (lamp_x, D + 2.2, 0), 2600, (1.0, 0.72, 0.42), angle=95, blend=0.6)
    kit.world(hdri=sky, strength=sky_strength, rotation=90)


def rain(count=1400, seed=6):
    rng = random.Random(seed)
    bm = bmesh.new()
    for _ in range(count):
        x, y, z = rng.uniform(-9, 9), rng.uniform(D + 0.4, D + 9), rng.uniform(0, 5)
        ln, w = rng.uniform(0.25, 0.5), 0.006
        vs = [bm.verts.new(v) for v in ((x - w, y, z), (x + w, y, z), (x + w + 0.02, y, z + ln), (x - w + 0.02, y, z + ln))]
        bm.faces.new(vs)
    me = bpy.data.meshes.new("rain")
    bm.to_mesh(me)
    ob = bpy.data.objects.new("rain", me)
    ob.data.materials.append(kit.mat("#DDE8F0", 0.1, emit="#C9D8E6", strength=0.25, alpha=0.1))
    bpy.context.scene.collection.objects.link(ob)


def board(lines):
    """The hung board: lines = [(text, (x, z), size, colour, font)] in board space."""
    kit.box((0, BY, 2.4), (2.9, 0.08, 1.05), kit.mat("#141516", 0.3), bevel=0.015)
    for x in (-1.1, 1.1):
        kit.cyl((x, BY, 2.93 + (H - 2.93) / 2), 0.01, H - 2.93 + 0.02, kit.mat("#C7CCD1", 0.25, 1.0))
    for body, (x, z), size, colour, font in lines:
        kit.text(body, (x, BY - 0.045, z), size, colour, font=font, spacing=1.05)


def doors(lit=260, ajar=0.0):
    """The treatment doors in the back wall and the corridor behind, lit with `lit` watts (0: dark); ajar swings
    the right leaf open (radians)."""
    frame = kit.mat("#9AA0A6", 0.3, 0.9)
    leaf = kit.mat("#C9CFCB", 0.45)
    cw = kit.mat("#E4ECE8", 0.8)   # the corridor beyond
    kit.box((1.9, -3.2, H / 2), (2.6, 0.2, H), cw)
    for x in (0.6, 3.2):
        kit.box((x, -1.7, H / 2), (0.2, 3.0, H), cw)
    kit.box((1.9, -1.6, H + 0.05), (2.6, 3.2, 0.1), cw)
    kit.box((1.9, -1.6, -0.05), (2.6, 3.2, 0.1), kit.tex("terrazzo_tiles", 0.35, name="floor"))
    for x in (1.0, 2.8):
        kit.box((x, -0.02, 1.15), (0.08, 0.24, 2.3), frame)
    kit.box((1.9, -0.02, 2.33), (1.88, 0.24, 0.08), frame)
    for x0, sign, swing in ((1.05, 1, 0.0), (2.75, -1, ajar)):
        pivot = bpy.data.objects.new("hinge", None)
        bpy.context.scene.collection.objects.link(pivot)
        pivot.location = (x0, -0.05, 0)
        for part in (kit.box((sign * 0.43, 0, 1.13), (0.86, 0.05, 2.22), leaf, bevel=0.01),
                     kit.box((sign * 0.43, 0.03, 1.55), (0.3, 0.012, 0.4), kit.glass(0.1)),
                     kit.box((sign * 0.43, 0.03, 0.6), (0.7, 0.012, 0.25), kit.mat("#B7BDB9", 0.3, 0.8))):
            part.parent = pivot
        pivot.rotation_euler = (0, 0, sign * -swing)
    kit.box((1.9, -0.01, 2.62), (1.3, 0.02, 0.3), kit.mat("#17465E", 0.4))
    kit.text("TREATMENT", (1.9, 0.012, 2.62), 0.15, kit.mat("#FFFFFF", 0.5, emit="#F4F8F6", strength=0.6), font=kit.FONT)
    if lit:
        kit.area((1.9, -1.6, H - 0.05), (1.9, -1.6, 0), (1.6, 2.4), lit, (0.92, 1.0, 0.96))


def cart(at, facing, plate, crop, width=0.72, name="cart", live=True, strength=1.3):
    """A triage workstation on wheels: the monitor faces `facing` degrees (0 = -y, as kit.screen). Returns the face."""
    x, y = at
    a = math.radians(facing)
    metal, dark = kit.mat("#C7CCD1", 0.3, 0.9), kit.mat("#2A2B2D", 0.4)
    for k in range(5):
        t = k * 2 * math.pi / 5
        kit.box((x + 0.2 * math.cos(t), y + 0.2 * math.sin(t), 0.06), (0.4, 0.05, 0.03), dark, rot=(0, 0, t))
        kit.sphere((x + 0.38 * math.cos(t), y + 0.38 * math.sin(t), 0.03), 0.03, dark)
    kit.cyl((x, y, 0.55), 0.03, 1.0, metal)
    kit.box((x + 0.1 * math.sin(a), y - 0.1 * math.cos(a), 0.95), (0.62, 0.34, 0.03), kit.mat("#E8ECEA", 0.5), rot=(0, 0, a))
    kit.box((x + 0.12 * math.sin(a), y - 0.12 * math.cos(a), 0.972), (0.45, 0.15, 0.015), dark, rot=(0, 0, a))
    h = width * crop[3] / crop[2]
    face, _ = kit.screen(name, (x, y, 1.08 + h / 2), width, plate, crop=crop, rot=(math.radians(90), 0, a),
                         strength=strength, depth=0.04, border=0.015, live=live)
    return face


def wall_tv(name, center, rot_z, plate, crop, width=1.1, live=False):
    return kit.screen(name, center, width, plate, crop=crop, rot=(math.radians(90), 0, math.radians(rot_z)), strength=1.3,
                      depth=0.05, border=0.02, bezel="#0D0E10", live=live)[0]


def kiosk(at, plate, crop, live=False, name="kiosk"):
    """A check-in kiosk facing -y."""
    x, y = at
    kit.box((x, y + 0.08, 0.55), (0.5, 0.3, 1.1), kit.mat("#DDE2E0", 0.4), bevel=0.02)
    kit.screen(name, (x, y - 0.08, 1.35), 0.42, plate, crop=crop, rot=(math.radians(75), 0, 0), strength=1.3, depth=0.03,
               border=0.02, live=live)


def seated(points, seed=1, **kw):
    """Patients on the beam seats: [(x of the seat row, seat index, facing)]."""
    rng = random.Random(seed)
    for i, (x, k, f) in enumerate(points):
        P.person((x - math.copysign(0.05, -f), 1.6 + k * 0.56), facing=f, pose="sit", height=rng.uniform(1.55, 1.85),
                 coat=rng.choice(["#3B3F46", "#5B3A33", "#2C3A4F", "#6A6154", "#44343A"]), seed=seed * 10 + i, **kw)


def shot_mis_triage():
    room()
    seating()
    street()
    rain()
    white = kit.mat("#FFFFFF", 0.5, emit="#EEF2F0", strength=1.6)
    teal = kit.mat("teal", 0.5, emit="#3FC2A8", strength=5.0)
    board([("WAITING NOW", (-0.7, 2.75), 0.17, white, kit.FONT), ("0", (-0.7, 2.3), 0.78, teal, kit.FONT),
           ("ALL PATIENTS\nSEEN", (0.72, 2.6), 0.15, teal, kit.FONT_COND), ("WAIT  0 MIN", (0.72, 2.2), 0.14, white, kit.FONT_COND)])
    kit.box((0.0, BY - 0.045, 2.42), (0.012, 0.005, 0.8), white)
    # left behind: a coat on a seat, a cup, dropped number slips; a mop sign; the door notice
    kit.box((-1.55, 4.4, 0.52), (0.4, 0.46, 0.06), kit.mat("#2C3A4F", 0.8), bevel=0.03, rot=(0.1, 0.0, 0.3))
    kit.cyl((0.35, 3.2, 0.055), 0.04, 0.11, kit.mat("#F4F1EA", 0.6), r2=0.032)
    for (x, y, r) in ((-0.3, 5.6, 0.7), (0.5, 6.9, -0.4)):
        kit.box((x, y, 0.004), (0.12, 0.07, 0.003), kit.mat("#F4F1EA", 0.6), rot=(0, 0, r))
    kit.place("WetFloorSign_01", (0.25, 4.8, 0), rot_z=0.5)
    kit.place("wheelchair_01", (W - 0.55, 0.9, 0), rot_z=math.radians(200))
    kit.place("potted_plant_02", (-W + 0.45, 8.9, 0))
    kit.place("metal_trash_can", (1.05, 8.6, 0))
    kit.place("wall_clock", (-W + 0.02, 5.0, 2.3), rot_z=math.radians(90))
    kit.box((0.55, D - 0.14, 1.45), (0.3, 0.004, 0.42), kit.mat("#F4F1EA", 0.6, emit="#F4F1EA", strength=0.15))
    kit.text("BY\nAPPOINTMENT\nONLY", (0.55, D - 0.147, 1.47), 0.055, kit.mat("#2E2A2B", 0.6), font=kit.FONT_COND)
    # the queue outside, facing the doors, a loose line with umbrellas and slips
    rng = random.Random(6)
    for i in range(15):
        x = 2.4 - i * 0.78 + rng.uniform(-0.12, 0.12)
        y = D + 1.2 + rng.uniform(-0.25, 0.35) + (0.7 if i % 4 == 3 else 0) + (0.45 if i % 5 == 1 else 0)
        face = 90 + rng.uniform(-20, 20) + (180 if i in (5, 9) else 0)
        P.person((x, y), facing=face, height=rng.uniform(1.55, 1.9), long_coat=rng.random() < 0.6, seed=i,
                 coat=rng.choice(["#3B3F46", "#5B3A33", "#2C3A4F", "#6A6154", "#44343A", "#26302C"]),
                 hold="umbrella" if i in (1, 4, 8, 11) else ("paper" if i not in (6, 13) else None), hood=i in (6, 13))
    kit.place("wheelchair_01", (-5.9, D + 1.3, 0), rot_z=math.radians(90))
    P.person((-5.9, D + 1.3, 0.0), facing=90, pose="sit", height=1.65, coat="#6A6154", hold="paper", seed=40)
    # the street behind the queue: a warm wash that rims the people against the glass
    kit.area((-1.5, D + 5.5, 2.6), (-1.5, D, 1.2), (14, 3), 1300, (1.0, 0.7, 0.42))
    kit.haze((0, D / 2, H / 2), (2 * W - 0.1, D - 0.1, H - 0.1), 0.012)
    kit.camera((0.3, 0.5, 1.3), (0.0, D, 1.52), lens=26, fstop=4.0, focus=(0, BY, 2.4))


def shot_al_triage():
    room(dead_light=(2.6, 1.8), tube_energy=5)
    seating()
    doors(lit=1600, ajar=1.2)
    face = cart((-0.45, 7.9), 157, "al-triage", (60, 84, 1160, 483))
    # a doctor in a white coat comes out of treatment toward the cart, dark against the lit corridor
    P.person((1.6, 0.45), facing=22, pose="walk", height=1.72, coat="#E9ECEE", long_coat=True, trousers="#2C4A5E",
             hair="#2A211C", seed=21)
    seated([(-1.55, 1, -90), (1.55, 4, 90), (2.25, 8, -90)], seed=2)
    kit.place("wheelchair_01", (-0.9, 5.4, 0), rot_z=math.radians(80))
    kit.place("wall_clock", (-W + 0.02, 5.0, 2.3), rot_z=math.radians(90))
    kit.haze((0, D / 2, H / 2), (2 * W - 0.1, D - 0.1, H - 0.1), 0.01)
    kit.world("#0B0D12", 0.2)
    kit.camera((0.25, 9.55, 1.42), (-0.55, 3.0, 1.1), lens=30, fstop=2.2, focus=face)


def shot_mu_hospital():
    room(lights=False)
    seating()
    street()
    rain()
    doors(lit=0)
    note = (100, 120, 540, 310)
    # every screen, the same note: the board over the aisle, the wall TVs, the kiosks, the cart
    kit.box((0, BY, 2.35), (2.36, 0.08, 1.44), kit.mat("#141516", 0.3), bevel=0.015)
    for x in (-0.9, 0.9):
        kit.cyl((x, BY, 3.1 + (H - 3.1) / 2), 0.01, H - 3.1 + 0.02, kit.mat("#C7CCD1", 0.25, 1.0))
    board, _ = kit.screen("board", (0, BY - 0.05, 2.35), 2.2, "mu-hospital", crop=note, strength=1.6, depth=0.02, border=0.01)
    for y in (2.6, 5.8):
        wall_tv(f"tvl{y}", (-W + 0.05, y, 2.25), 90, "mu-hospital", note)
        wall_tv(f"tvr{y}", (W - 0.05, y, 2.25), -90, "mu-hospital", note)
    for x in (2.0, 2.7):
        kiosk((x, 8.9), "mu-hospital", note, name=f"kiosk{x}")
    for x in (-3.3, 3.9):
        wall_tv(f"tvg{x}", (x, D - 0.4, 2.5), 0, "mu-hospital", note, width=1.0)
        kit.cyl((x, D - 0.4, 3.05 + (H - 3.05) / 2), 0.01, H - 3.05, kit.mat("#C7CCD1", 0.25, 1.0))
    cart((-0.6, 7.6), 33, "mu-hospital", note, width=0.6, live=False)
    kit.area((0, BY - 1.0, 2.35), (0, 0, 1.0), (2.2, 1.26), 60, (1.0, 0.32, 0.26))   # the board's red spill
    # a nurse under the board with a torch, paper charts under her arm
    P.person((-0.8, 6.4), facing=-18, height=1.66, coat="#3E6F7C", trousers="#3E6F7C", hold="paper", seed=31)
    kit.spot((-0.7, 6.7, 1.2), (-0.3, 8.4, 0.3), 30, kit.kelvin(5500), angle=25, blend=0.4)
    kit.box((0, D - 0.13, 2.48), (0.5, 0.03, 0.16), kit.mat("#0F3A22", 0.4, emit="#2FE07A", strength=3))
    kit.text("EXIT", (0, D - 0.15, 2.48), 0.1, kit.mat("#FFFFFF", 0.5, emit="#DFFFE8", strength=4), font=kit.FONT)
    kit.area((-1.5, D + 5.5, 2.6), (-1.5, D, 1.2), (14, 3), 110, (1.0, 0.7, 0.42))
    kit.haze((0, D / 2, H / 2), (2 * W - 0.1, D - 0.1, H - 0.1), 0.012)
    kit.camera((2.3, 3.2, 1.5), (-0.4, 9.0, 1.85), lens=26, focus=board)


def shot_pd_trial():
    room(tube_energy=12, daylight=True)
    seating()
    street(sky="urban_street_01", sky_strength=2.0, lamp=False)
    kit.sun((50, 0, 200), 3.0, kit.kelvin(5200), angle=1.0)
    face = cart((-0.2, 6.3), -14, "pd-trial", (60, 80, 1160, 483))
    # the clinician stands at the cart, turned to the screen, the chart she checks against in her hand
    P.person((-0.9, 5.45), facing=-35, height=1.68, coat="#3E7F8C", trousers="#3E7F8C", hold="paper", hair="#2A211C", seed=41)
    seated([(-1.55, 5, -90), (-2.25, 8, 90), (1.55, 7, 90), (1.55, 2, 90)], seed=4)
    kit.place("potted_plant_02", (-W + 0.45, 8.9, 0))
    kit.camera((-0.95, 3.3, 1.45), (-0.1, 7.0, 1.3), lens=36, fstop=2.0, focus=face)


def shot_cw_triage():
    room(tube_energy=40)
    seating()
    street()
    face = cart((0.0, 5.0), 0, "cw-triage", (120, 21, 1040, 650), width=0.55)
    trio_camera(face)


def trio_camera(face):
    """The pyrrhic trio's framing (cw-port, cw-triage, cw-chat): the screen, 1150 px wide, seen 22 degrees off its
    axis from a little above, with the room soft behind it."""
    bpy.context.view_layer.update()
    mw = face.matrix_world
    n = (mw.to_3x3() @ Vector((0, 0, 1))).normalized()
    width = face.dimensions.x
    lens = 50
    dist = width / (0.6 * 36 / lens)
    side = Vector((n.y, -n.x, 0)).normalized()
    a = math.radians(22)
    eye = mw.translation + (n * math.cos(a) + side * math.sin(a)) * dist + Vector((0, 0, dist * 0.12))
    kit.camera(tuple(eye), tuple(mw.translation - side * width * 0.08), lens=lens, fstop=2.8, focus=face)


kit.run({"mis-triage": shot_mis_triage, "al-triage": shot_al_triage, "mu-hospital": shot_mu_hospital,
         "pd-trial": shot_pd_trial, "cw-triage": shot_cw_triage})
