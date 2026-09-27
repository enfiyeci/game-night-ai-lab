"""The Reyes kitchen: a small family kitchen with a table under the window, a laptop on the table, counters with a
built-in oven along the left wall, the fridge by the hall door. Mina (a teenager) is seen from behind or not at all.
The window shows a photographed street (a Poly Haven HDRI) chosen per shot for the time of day. Shots:

  mis-laptop   Catastrophic misalignment, Day 9: the power is out. Candles on the table, the fridge dark and ajar,
               the street outside unlit; the laptop runs on its battery and shows the support chat that closed her
               ticket because her account says active.
  ab-app       Acquihire, Month 3, 18:20: low sun on the table; Mina, from behind, over her biology homework; the
               answer on the laptop ends in an AZURIA PLUS upsell.
  al-chat      Aligned, evening: under the desk lamp the laptop offers an outline instead of an essay, and her own
               notebook beside it holds the same outline in her handwriting.
  rb-app       Board removed, Month 3, breakfast: the tablet propped against the fruit bowl shows the overnight
               update (companion mode; report a problem moved three menus deep).
  lb-chat      Left behind, Month 6, 22:48: under the pendant lamp, the model calls a rushed essay brilliant; the
               assignment sheet asks for 1,500 words and her printed page is a third full.
  mu-kitchen   Misuse, morning: no power. Grey daylight, the oven clock blank, the fridge open and dripping onto a
               towel, bottled water on the counter, a pot on a camping stove; the phone shows the boil-water notice.
  ov-chat      Overtaken, Month 3, 2 am: one lamp, three empty mugs, the oven clock at 02:07, and the model asking
               her to keep chatting.
  pd-school    Pacing deal, Month 6, a sunny afternoon: the school lesson on how models are trained and checked,
               with the worksheet and textbook beside the laptop.
  cw-chat      Pyrrhic, Month 2: close on the laptop answering "Summary available on request." (framed like cw-port
               and cw-triage: the same screen size and angle).
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import people as P  # noqa: E402

# the room: x -2.2..2.2, y 0..4 (window wall at y=4), height 2.6; the table sits under the window
RW, RD, RH = 2.2, 4.0, 2.6
HAND = "/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf"
CHAT = (120, 21, 1040, 650)      # the chat window, 16:10, in the chat plates (ab-app, al-chat, lb-chat, ov-chat, cw-chat)


def room(sky=None, sky_strength=0.6, sky_rot=0.0, fridge_open=False, clock="", lamp=False):
    """The kitchen. sky None is the pilot's dark street under a cold moon; otherwise an HDRI seen through the window.
    clock is the oven clock's text ('' when the power is out); lamp lights the pendant over the table."""
    wall = kit.tex("painted_plaster_wall", 0.45, tint="#E9DDC8", name="kwall")
    kit.box((0, RD / 2, -0.05), (2 * RW, RD, 0.1), kit.tex("old_linoleum_flooring_01", 0.6, name="kfloor"))
    kit.box((0, RD / 2, RH + 0.05), (2 * RW, RD, 0.1), kit.mat("#E6E0D4", 0.9))
    kit.box((-RW - 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    kit.box((RW + 0.05, RD / 2, RH / 2), (0.1, RD, RH), wall)
    # back wall with the door to the hall
    kit.box((-0.35, -0.05, RH / 2), (2 * RW - 1.7, 0.1, RH), wall)
    kit.box((RW - 0.3, -0.05, RH / 2), (0.6, 0.1, RH), wall)
    kit.box((1.35, -0.05, 2.35), (0.9, 0.1, 0.5), wall)
    frame = kit.mat("#EDE8DE", 0.5)
    for x in (0.88, 1.82):
        kit.box((x, 0.0, 1.05), (0.06, 0.14, 2.1), frame)
    kit.box((1.35, 0.0, 2.12), (1.0, 0.14, 0.06), frame)
    kit.box((1.35, -0.8, RH / 2), (0.9, 0.1, RH), kit.mat("#3E3A36", 0.8))   # the hall wall beyond, unlit
    # window wall with a wide window over the table
    wx0, wx1, wz0, wz1 = -1.1, 0.9, 0.95, 2.15
    kit.box((0, RD + 0.05, wz0 / 2), (2 * RW, 0.1, wz0), wall)
    kit.box((0, RD + 0.05, (RH + wz1) / 2), (2 * RW, 0.1, RH - wz1), wall)
    kit.box(((-RW + wx0) / 2, RD + 0.05, RH / 2), (wx0 + RW, 0.1, RH), wall)
    kit.box(((RW + wx1) / 2, RD + 0.05, RH / 2), (RW - wx1, 0.1, RH), wall)
    for x in (wx0, (wx0 + wx1) / 2, wx1):
        kit.box((x, RD + 0.03, (wz0 + wz1) / 2), (0.05, 0.08, wz1 - wz0), frame)
    for z in (wz0, wz1):
        kit.box(((wx0 + wx1) / 2, RD + 0.03, z), (wx1 - wx0, 0.08, 0.05), frame)
    kit.box(((wx0 + wx1) / 2, RD - 0.05, wz0 - 0.02), (wx1 - wx0 + 0.2, 0.18, 0.03), frame)   # sill
    pane = kit.box(((wx0 + wx1) / 2, RD + 0.02, (wz0 + wz1) / 2), (wx1 - wx0, 0.01, wz1 - wz0), kit.glass(0.02))
    # counters along the left wall, upper cabinets, a sink, the oven under the worktop
    door = kit.mat("#7E9A8C", 0.45)
    top = kit.tex("marble_01", 0.8, name="worktop")
    kit.box((-RW + 0.32, 1.9, 0.44), (0.62, 2.4, 0.88), door, bevel=0.01)
    kit.box((-RW + 0.33, 1.9, 0.9), (0.66, 2.44, 0.04), top, bevel=0.005)
    for y in (1.0, 1.6, 2.2, 2.8):
        kit.box((-RW + 0.64, y, 0.47), (0.01, 0.56, 0.78), kit.mat("#6E8A7C", 0.5))
        if y != 2.2:
            kit.box((-RW + 0.66, y + 0.2, 0.72), (0.02, 0.12, 0.02), kit.mat("#C9C4B8", 0.3, 0.8))
    oven(clock)
    kit.box((-RW + 0.18, 1.9, 1.85), (0.34, 2.4, 0.7), door, bevel=0.01)
    kit.box((-RW + 0.35, 1.7, 0.86), (0.4, 0.5, 0.08), kit.mat("#B9BDC0", 0.2, 1.0))   # sink
    kit.cyl((-RW + 0.2, 1.7, 1.02), 0.012, 0.25, kit.mat("#B9BDC0", 0.2, 1.0))
    kit.place("vintage_electric_kettle", (-RW + 0.35, 2.6, 0.92), rot_z=math.radians(80))
    kit.place("ceramic_vase_01", (-RW + 0.3, 3.0, 0.92))
    # the fridge in the back-left corner, school papers under magnets
    fr = kit.mat("#D9DAD5", 0.3)
    kit.box((-RW + 0.35, 0.45, 0.9), (0.66, 0.66, 1.8), fr, bevel=0.02)
    if fridge_open:
        kit.box((-RW + 0.72, 0.62, 0.9), (0.05, 0.62, 1.76), fr, bevel=0.015, rot=(0, 0, math.radians(-28)))
        kit.box((-RW + 0.35, 0.45, 0.9), (0.6, 0.6, 1.7), kit.mat("#2A2C2E", 0.6))   # the dark inside
    else:
        kit.box((-RW + 0.69, 0.45, 0.9), (0.03, 0.64, 1.76), fr, bevel=0.01)
        for (y, z, c) in ((0.35, 1.45, "#F4F1EA"), (0.58, 1.3, "#F3E27A"), (0.42, 1.12, "#F4F1EA")):
            kit.box((-RW + 0.706, y, z), (0.002, 0.16, 0.21), kit.mat(c, 0.8), rot=(math.radians(4), 0, 0))
    # the pendant lamp over the table
    kit.cyl((0, 3.0, RH - 0.4), 0.2, 0.18, kit.mat("#8C877D", 0.8), r2=0.06)
    kit.cyl((0, 3.0, RH - 0.15), 0.005, 0.3, kit.mat("#222", 0.5))
    if lamp:
        kit.sphere((0, 3.0, RH - 0.48), 0.05, kit.emission("#FFE2B8", 40))
        kit.spot((0, 3.0, RH - 0.5), (0, 3.0, 0), 160, kit.kelvin(2700), angle=110, blend=0.8, radius=0.06)
    if sky:
        pane.visible_shadow = pane.visible_diffuse = False   # daylight passes the pane (glass would block it)
        portal = kit.area(((wx0 + wx1) / 2, RD + 0.1, (wz0 + wz1) / 2), ((wx0 + wx1) / 2, 0, (wz0 + wz1) / 2),
                          (wx1 - wx0, wz1 - wz0), name="portal")
        portal.data.cycles.is_portal = True   # samples the sky through the window: less noise
        kit.world(hdri=sky, strength=sky_strength, rotation=sky_rot)
        return
    # outside: a dark street under a cold moon, no streetlights, a few houses
    kit.box((0, RD + 8, -0.02), (40, 16, 0.05), kit.mat("#20252B", 0.8))
    rng = random.Random(2)
    for i in range(9):
        x = -14 + i * 3.6 + rng.uniform(-0.5, 0.5)
        h = rng.uniform(4.5, 7)
        kit.box((x, RD + 9 + rng.uniform(0, 2), h / 2), (3.0, 4, h), kit.mat("#3A4048", 0.8))
        kit.box((x, RD + 9 + 0.1, h + 0.6), (3.2, 4.2, 1.2), kit.mat("#2B3036", 0.8))
    kit.world("#1B2433", 0.35)
    kit.sun((58, 0, 200), 0.25, kit.kelvin(9000), angle=0.5)   # moonlight through the window


def oven(clock):
    """A built-in oven in the counter (its front faces +x), with a green clock over the door."""
    x = -RW + 0.645
    kit.box((x, 2.5, 0.42), (0.02, 0.58, 0.6), kit.mat("#141516", 0.15, coat=0.8), bevel=0.004)          # glass door
    kit.box((x + 0.02, 2.5, 0.68), (0.02, 0.44, 0.02), kit.mat("#C9C4B8", 0.25, 0.9))                   # handle
    kit.box((x, 2.5, 0.8), (0.02, 0.58, 0.12), kit.mat("#2A2B2D", 0.35, 0.6))                            # control strip
    kit.box((x + 0.011, 2.5, 0.8), (0.002, 0.16, 0.06), kit.mat("#050606", 0.2))                         # display
    if clock:
        kit.text(clock, (x + 0.0125, 2.5, 0.8), 0.046, kit.emission("#5CFF9A", 12), font=kit.FONT,
                 rot=(math.radians(90), 0, math.radians(90)))
    for dy in (-0.2, -0.13, 0.13, 0.2):
        kit.cyl((x + 0.02, 2.5 + dy, 0.8), 0.016, 0.02, kit.mat("#B9BDC0", 0.3, 0.9), rot=(0, math.radians(90), 0))


def table():
    wood = kit.tex("brown_planks_05", 1.2, tint="#B08A64", name="tabletop")
    kit.box((-0.1, 3.3, 0.74), (1.5, 0.9, 0.04), wood, bevel=0.005)
    for x in (-0.8, 0.6):
        for y in (2.9, 3.7):
            kit.box((x, y, 0.36), (0.05, 0.05, 0.72), kit.mat("#6B4B33", 0.6))
    kit.place("WoodenChair_01", (-0.5, 3.95, 0), rot_z=math.radians(0))


def laptop(at, plate, crop, yaw=0.0, open_deg=105, strength=1.2, name="laptop", bezel="#141516"):
    """A laptop on the table at `at` (x, y, table height), facing -y turned by yaw degrees."""
    x, y, z = at
    a = math.radians(yaw)
    body = kit.mat("#8E9398", 0.3, 0.7)
    kit.box((x, y, z + 0.009), (0.33, 0.23, 0.018), body, bevel=0.004, rot=(0, 0, a))
    kit.box((x + 0.02 * math.sin(a), y - 0.02 * math.cos(a), z + 0.0185), (0.28, 0.1, 0.001), kit.mat("#1B1C1E", 0.6),
            rot=(0, 0, a))   # keys
    tilt = math.radians(open_deg - 90)
    w = 0.3
    h = w * crop[3] / crop[2]
    # hinge at the back edge; the lid leans back by tilt
    back = 0.115 + (h / 2 + 0.01) * math.sin(tilt)
    cz = z + 0.018 + (h / 2 + 0.01) * math.cos(tilt)
    face, _ = kit.screen(name, (x - back * math.sin(a), y + back * math.cos(a), cz), w, plate, crop=crop,
                         rot=(math.radians(90) - tilt, 0, a), strength=strength, bezel=bezel, depth=0.006,
                         border=0.009)
    return face


def candle(at, h=0.14, lit=True):
    x, y, z = at
    kit.cyl((x, y, z + h / 2), 0.022, h, kit.mat("#F2EBDD", 0.7))
    kit.cyl((x, y, z + 0.005), 0.05, 0.01, kit.mat("#A9A39A", 0.3, 0.8))
    if lit:
        kit.sphere((x, y, z + h + 0.018), 0.008, kit.emission("#FFB45A", 30), scale=(1, 1, 2.2))
        kit.point((x, y, z + h + 0.03), 3.5, kit.kelvin(1800), radius=0.01)


# ------------------------------------------------------------------ props
def _at(at, rz, dx, dy, dz=0.0):
    """A point dx, dy along a prop's own axes (rotated rz radians) from `at`."""
    c, s = math.cos(rz), math.sin(rz)
    return (at[0] + dx * c - dy * s, at[1] + dx * s + dy * c, at[2] + dz)


def paper(at, size=(0.21, 0.297), rz=0.0, colour="#F4F1EA", ruled=False, margin=True):
    """A sheet flat on the table; ruled adds notebook lines."""
    kit.box(_at(at, rz, 0, 0, 0.0006), (size[0], size[1], 0.0012), kit.mat(colour, 0.75), rot=(0, 0, rz))
    if ruled:
        rule = kit.mat("#9DB4D4", 0.7)
        for k in range(int(size[1] / 0.009) - 3):
            kit.box(_at(at, rz, 0, size[1] / 2 - 0.03 - k * 0.009, 0.00125), (size[0], 0.0006, 0.0001), rule, rot=(0, 0, rz))
        if margin:
            kit.box(_at(at, rz, -size[0] / 2 + 0.03, 0, 0.0013), (0.0007, size[1], 0.0001), kit.mat("#D98A8A", 0.7), rot=(0, 0, rz))


def writing(at, rz, body, size, font=HAND, colour="#23305A", align="LEFT"):
    """Text lying on paper, top-left at `at`, reading along the paper's own x axis."""
    return kit.text(body, (at[0], at[1], at[2] + 0.0014), size, kit.mat(colour, 0.6), font=font, align=align,
                    valign="TOP", rot=(0, 0, rz), extrude=0.0)


def rules(at, rz, widths, pitch=0.009, colour="#7C7A76"):
    """Lines of printed text as grey bars, one per width, from `at` (top-left) down the page."""
    m = kit.mat(colour, 0.7)
    for k, w in enumerate(widths):
        kit.box(_at(at, rz, w / 2, -k * pitch, 0.0013), (w, 0.0022, 0.0002), m, rot=(0, 0, rz))


def book(at, rz, size=(0.19, 0.25, 0.03), cover="#2F5F8A", title=None):
    x, y, z = at
    kit.box((x, y, z + size[2] / 2), size, kit.mat(cover, 0.6), bevel=0.003, rot=(0, 0, rz))
    kit.box(_at(at, rz, 0.004, 0, size[2] / 2), (size[0] - 0.006, size[1] - 0.008, size[2] - 0.006), kit.mat("#EFE8D8", 0.8),
            rot=(0, 0, rz))
    if title:
        kit.text(title, _at(at, rz, 0, size[1] * 0.2, size[2] + 0.0008), 0.018, kit.mat("#F4F1EA", 0.5), font=kit.FONT,
                 rot=(0, 0, rz), extrude=0.0)


def open_book(at, rz, size=(0.2, 0.26)):
    """An open textbook: two pages bowed slightly toward the spine. Returns the right page's centre."""
    page = kit.mat("#F3EEE2", 0.8)
    kit.box(_at(at, rz, 0, 0, 0.006), (2 * size[0] + 0.01, size[1] + 0.01, 0.012), kit.mat("#8A3B2E", 0.6), rot=(0, 0, rz))
    for side in (-1, 1):
        kit.box(_at(at, rz, side * size[0] / 2, 0, 0.016), (size[0], size[1], 0.008), page,
                rot=(0, side * math.radians(-3), rz))
    return _at(at, rz, size[0] / 2, 0, 0.021)


def mug(at, colour="#C9553B", full=False):
    x, y, z = at
    kit.cyl((x, y, z + 0.05), 0.042, 0.1, kit.mat(colour, 0.35))
    kit.cyl((x, y, z + 0.098), 0.037, 0.006, kit.mat("#3B2416" if full else "#1E1612", 0.2 if full else 0.5))
    kit.box((x + 0.05, y, z + 0.05), (0.018, 0.012, 0.06), kit.mat(colour, 0.35), bevel=0.005)


def phone_flat(at, rz=0.0, glow="#DCE6F5", strength=0.6):
    x, y, z = at
    kit.box((x, y, z + 0.0045), (0.075, 0.155, 0.009), kit.mat("#111", 0.3), rot=(0, 0, rz))
    kit.plane((x, y, z + 0.0092), (0.066, 0.14), kit.emission(glow, strength), rot=(0, 0, rz))


def desk_lamp(at, rz, target, energy=14):
    """The arm lamp on the table, and a warm pool of light from its head toward target."""
    kit.place("desk_lamp_arm_01", at, rot_z=rz)
    head = (at[0] + 0.12 * math.cos(rz + 1.2), at[1] + 0.12 * math.sin(rz + 1.2), at[2] + 0.42)
    kit.spot(head, target, energy, kit.kelvin(2700), angle=75, blend=0.7, radius=0.04)


def mina(at, facing=0.0):
    """Mina at the table, seated, seen from behind, her hair in a ponytail."""
    root = P.person(at, facing=facing, pose="sit", height=1.62, coat="#6A5D7B", hair="#0A0807", skin="#C99576",
                    trousers="#2C3A4F", build=0.9, seed=7)
    a = math.radians(facing)
    tail = kit.sphere((at[0] + 0.1 * math.sin(a), at[1] - 0.1 * math.cos(a), 1.06), 0.045, kit.mat("#0A0807", 0.95),
                      scale=(0.8, 0.8, 1.7))
    tail.rotation_euler = (math.radians(-25), 0, a)
    return root


# ------------------------------------------------------------------ shots
def shot_mis_laptop():
    room(fridge_open=True)
    table()
    face = laptop((0.05, 3.25, 0.76), "mis-laptop", (100, 60, 1080, 675), yaw=-8, strength=0.9, bezel="#8E9398")
    # the screen lights the table and whoever sits at it
    kit.area((0.05, 3.1, 1.0), (0.05, 2.5, 0.9), (0.3, 0.2), 6, kit.kelvin(7500))
    candle((-0.3, 3.5, 0.76))
    candle((-0.4, 3.32, 0.76), h=0.09)
    candle((-0.22, 3.62, 0.76), h=0.18)
    kit.place("vintage_flashlight", (0.55, 3.45, 0.76), rot_z=math.radians(30))
    phone_flat((0.45, 3.0, 0.76))
    kit.cyl((-0.62, 3.05, 0.81), 0.042, 0.1, kit.mat("#C9553B", 0.4))
    # Mina has gone to find a torch: her chair pushed back, her cardigan over it
    kit.place("WoodenChair_01", (0.55, 2.55, 0), rot_z=math.radians(-160))
    kit.box((0.55, 2.38, 0.88), (0.42, 0.06, 0.34), kit.mat("#6A5D7B", 0.9), bevel=0.03, rot=(0.15, 0, math.radians(20)))
    kit.haze((0, RD / 2, RH / 2), (2 * RW - 0.05, RD - 0.05, RH - 0.05), 0.02)
    kit.camera((-1.25, 2.35, 1.18), (0.1, 3.3, 0.86), lens=32, fstop=2.8, focus=face)


def shot_ab_app():
    room(sky="urban_street_01", sky_strength=0.35, clock="18:20")
    table()
    face = laptop((0.02, 3.12, 0.76), "ab-app", CHAT, yaw=4)
    # biology homework: the open textbook, her notes on cell division
    page = open_book((0.42, 3.22, 0.76), math.radians(8))
    for dx, r in ((-0.05, 0.022), (0.0, 0.016), (0.035, 0.016)):
        kit.cyl(_at(page, math.radians(8), dx, 0.05, 0.0005), r, 0.001, kit.mat("#E7B3B8", 0.7))
    rules(_at(page, math.radians(8), -0.08, -0.01), math.radians(8), [0.15, 0.14, 0.16, 0.12, 0.15, 0.09])
    paper((-0.38, 3.08, 0.76), rz=math.radians(-10), ruled=True)
    writing(_at((-0.38, 3.08, 0.76), math.radians(-10), -0.07, 0.11), math.radians(-10),
            "Mitosis vs meiosis\n2 cells  /  4 cells\nsame  /  half ??", 0.013)
    kit.cyl((-0.25, 2.98, 0.765), 0.004, 0.14, kit.mat("#E9C46A", 0.4), rot=(0, math.radians(90), math.radians(30)))   # pencil
    mug((-0.62, 3.4, 0.76), "#3F84C6", full=True)
    mina((0.02, 2.47, 0))
    # the low sun through the window lays warm light across the table; the screen lights her face
    kit.sun((76, 0, 212), 4.0, kit.kelvin(3000), angle=1.5)
    kit.area((0.02, 3.0, 0.95), (0.02, 2.5, 1.0), (0.3, 0.15), 5, kit.kelvin(7000))
    kit.camera((0.5, 1.98, 1.2), (0.05, 3.14, 0.88), lens=58, fstop=2.8, focus=face)
    bpy.context.scene.view_settings.exposure = 0.3


def shot_al_chat():
    room(sky="cobblestone_street_night", sky_strength=0.5, sky_rot=40, clock="19:40")
    table()
    yaw = 32
    face = laptop((-0.28, 3.3, 0.76), "al-chat", CHAT, yaw=yaw)
    # her own notebook beside it, the outline in her hand, a pen lying across
    rz = math.radians(yaw - 6)
    nb = (0.1, 3.02, 0.76)
    kit.box(_at(nb, rz, 0, 0, 0.002), (0.225, 0.305, 0.004), kit.mat("#2C3A4F", 0.6), rot=(0, 0, rz))
    paper(_at(nb, rz, 0, 0, 0.004), (0.21, 0.29), rz=rz, ruled=True)
    writing(_at(nb, rz, -0.075, 0.125, 0.004), rz,
            "French Revolution\n\n1. Causes\n2. The turn in 1792\n3. Was it worth it?", 0.018)
    kit.cyl(_at(nb, rz, 0.03, -0.09, 0.01), 0.0045, 0.14, kit.mat("#16171A", 0.3, 0.4), rot=(0, math.radians(90), rz + 0.5))
    book((0.45, 3.45, 0.76), math.radians(-15), cover="#8A3B2E", title="HISTORY 10")
    mug((-0.7, 3.05, 0.76), "#F2EEE6")
    desk_lamp((-0.62, 3.62, 0.76), math.radians(-40), (0.05, 3.05, 0.76), energy=10)
    kit.area((-0.25, 3.1, 0.95), (0.1, 2.6, 0.9), (0.3, 0.15), 3, kit.kelvin(7000))
    kit.camera((0.46, 2.3, 1.2), (-0.08, 3.14, 0.86), lens=39, fstop=5.6, focus=face)


def shot_rb_app():
    room(sky="urban_street_01", sky_strength=1.1, sky_rot=200, clock="07:32")
    table()
    crop = (222, 102, 836, 446)
    # the tablet faces back into the room, toward the fridge, leaning on the fruit bowl behind it
    t = (-0.1, 3.3, 0.76)
    yaw = math.radians(141)
    w = 0.26
    h = w * crop[3] / crop[2]
    lean = math.radians(18)
    face, _ = kit.screen("tablet", (t[0], t[1], t[2] + 0.01 + h / 2 * math.cos(lean)), w, "rb-app", crop=crop,
                         rot=(math.radians(90) - lean, 0, yaw), bezel="#1A1B1D", depth=0.008, border=0.012, strength=1.3)
    bowl = _at(t, yaw, 0, 0.2)
    kit.place("wooden_bowl_01", bowl)
    for dx, dy in ((-0.05, 0.0), (0.04, -0.03), (0.0, 0.05)):
        kit.place("food_apple_01", (bowl[0] + dx, bowl[1] + dy, t[2] + 0.04))
    # breakfast before school: cereal, juice, her phone, the school bag against the table leg
    kit.cyl((0.2, 3.05, 0.79), 0.07, 0.06, kit.mat("#F2EEE6", 0.3), r2=0.05)
    kit.cyl((0.2, 3.05, 0.815), 0.062, 0.004, kit.mat("#E9C46A", 0.8))
    kit.cyl((0.36, 2.98, 0.82), 0.03, 0.12, kit.glass(0.05, tint="#FFB45A"))
    kit.cyl((0.36, 2.98, 0.8), 0.028, 0.08, kit.mat("#F2962E", 0.2, alpha=0.9))
    phone_flat((-0.5, 3.0, 0.76), rz=0.3, strength=0.2)
    kit.box((-0.95, 2.8, 0.2), (0.3, 0.18, 0.4), kit.mat("#3F7A5A", 0.8), bevel=0.05, rot=(0.15, 0, 0.3))
    # a low morning sun through the window reaches the fridge
    kit.sun((78, 0, 150), 3.5, kit.kelvin(4600), angle=1.0)
    kit.camera((0.35, 3.85, 1.0), (-0.6, 2.2, 0.7), lens=35, fstop=4.0, focus=face)
    bpy.context.scene.view_settings.exposure = 1.0


def shot_lb_chat():
    room(sky="cobblestone_street_night", sky_strength=0.25, sky_rot=160, clock="22:48", lamp=True)
    table()
    face = laptop((-0.3, 3.22, 0.76), "lb-chat", CHAT, yaw=78)
    # the assignment asks for 1,500 words; her printed page is a third full
    rz = math.radians(84)
    sheet = (0.1, 3.5, 0.76)
    paper(sheet, rz=rz)
    writing(_at(sheet, rz, -0.09, 0.13), rz, "ESSAY\n1,500 words", 0.028, font=kit.FONT, colour="#2E2A2B")
    rules(_at(sheet, rz, -0.09, 0.05), rz, [0.16, 0.12, 0.15, 0.08], pitch=0.012)
    rz2 = math.radians(98)
    essay = (0.16, 3.08, 0.76)
    paper(essay, rz=rz2)
    rules(_at(essay, rz2, -0.08, 0.125), rz2, [0.16, 0.165, 0.15, 0.16, 0.14, 0.16, 0.09], pitch=0.011)
    kit.cyl((-0.6, 3.55, 0.82), 0.033, 0.12, kit.mat("#2F9C6A", 0.25, 0.8))   # an energy drink can
    phone_flat((0.4, 3.3, 0.76), rz=1.2, glow="#FFB0D0", strength=1.2)       # a video still playing
    kit.camera((0.95, 2.95, 1.2), (-0.3, 3.2, 0.86), lens=42, fstop=3.2, focus=face)


def shot_mu_kitchen():
    room(sky="stuttgart_suburbs", sky_strength=1.4, sky_rot=120, fridge_open=True)
    table()
    # the counter: bottled water, a pot on a camping stove with its blue flame
    for k, (y, z) in enumerate(((1.25, 0.92), (1.45, 0.92), (1.35, 0.0), (1.1, 0.0))):
        kit.place("plastic_bottle_gallon", (-RW + 0.35 if z else -RW + 0.85, y, z), rot_z=k * 1.3)
    sx, sy = -RW + 0.35, 2.15
    kit.box((sx, sy, 0.97), (0.3, 0.34, 0.1), kit.mat("#2A2B2D", 0.4, 0.6), bevel=0.01)
    kit.cyl((sx, sy + 0.04, 1.03), 0.06, 0.02, kit.mat("#6B6E73", 0.3, 0.9))
    kit.cyl((sx, sy + 0.04, 1.04), 0.055, 0.008, kit.emission("#4F8BFF", 25), r2=0.045)
    kit.point((sx + 0.05, sy + 0.04, 1.06), 4, (0.45, 0.6, 1.0), radius=0.03)
    kit.place("pot_enamel_01", (sx, sy + 0.04, 1.05))
    # the night's candles burnt down; the fridge dripping onto a towel
    for (x, y, h) in ((-0.5, 3.5, 0.03), (-0.38, 3.58, 0.05)):
        candle((x, y, 0.76), h=h, lit=False)
    kit.box((-RW + 0.8, 0.55, 0.004), (0.5, 0.35, 0.008), kit.mat("#8FB3C9", 0.9), rot=(0, 0, 0.2))
    # the battery radio, and the phone propped against a water bottle, facing the camera
    rr = math.radians(115)
    kit.box((-0.1, 2.95, 0.82), (0.19, 0.07, 0.12), kit.mat("#6B2E24", 0.5), bevel=0.01, rot=(0, 0, rr))
    kit.cyl(_at((-0.1, 2.95, 0.83), rr, -0.04, -0.036), 0.03, 0.004, kit.mat("#222", 0.6), rot=(math.radians(90), 0, rr))
    crop = (250, 96, 240, 448)
    pw = 0.07
    ph = pw * crop[3] / crop[2]
    lean = math.radians(15)
    px, py = 0.16, 3.17
    face, _ = kit.screen("phone", (px, py, 0.76 + 0.004 + ph / 2 * math.cos(lean)), pw, "mu-kitchen", crop=crop,
                         rot=(math.radians(90) - lean, 0, math.radians(99)), bezel="#111", depth=0.008, border=0.004,
                         strength=1.2)
    kit.place("plastic_bottle_gallon", (px - 0.11, py - 0.02, 0.76), rot_z=0.5, scale=0.6)
    kit.camera((0.5, 3.25, 0.94), (-1.8, 2.15, 0.62), lens=35, fstop=8, focus=face)
    bpy.context.scene.view_settings.exposure = 1.6


def shot_ov_chat():
    room(sky="cobblestone_street_night", sky_strength=0.12, sky_rot=100, clock="02:07")
    table()
    face = laptop((-0.1, 3.3, 0.76), "ov-chat", CHAT, yaw=101, strength=1.0)
    for (x, y, c) in ((0.25, 3.3, "#F2EEE6"), (0.36, 3.12, "#C9553B"), (0.16, 3.02, "#3F84C6")):
        mug((x, y, 0.76), c)
    kit.box((0.3, 3.5, 0.762), (0.12, 0.08, 0.004), kit.mat("#E0613B", 0.4, 0.3), rot=(0, 0, 0.6))   # a snack wrapper
    desk_lamp((-0.6, 3.1, 0.76), math.radians(-20), (0.1, 3.25, 0.76), energy=6)
    kit.area((0.05, 3.33, 0.95), (0.9, 3.5, 1.0), (0.3, 0.15), 3, kit.kelvin(7000))
    kit.camera((0.9, 3.5, 1.15), (-1.2, 2.7, 0.8), lens=40, fstop=8, focus=face)


def shot_pd_school():
    room(sky="urban_street_01", sky_strength=1.2, sky_rot=260, clock="15:40")
    table()
    crop = (200, 104, 880, 460)
    face = laptop((-0.08, 3.28, 0.76), "pd-school", crop, yaw=25, open_deg=112)
    # the worksheet: a hand-drawn diagram of training and checking, filled in; the textbook beside it
    rz = math.radians(-4)
    ws = (0.1, 2.95, 0.76)
    paper(ws, rz=rz)
    writing(_at(ws, rz, -0.09, 0.135), rz, "Year 10 Computing  -  Unit 4", 0.009, font=kit.FONT_SANS, colour="#2E2A2B")
    writing(_at(ws, rz, -0.09, 0.115), rz, "How a model learns", 0.016, font=kit.FONT, colour="#2E2A2B")
    for dx, label in ((-0.06, "data"), (0.0, "model"), (0.06, "test")):
        kit.box(_at(ws, rz, dx, 0.05, 0.0013), (0.045, 0.028, 0.0002), kit.mat("#3F84C6", 0.7), rot=(0, 0, rz))
        kit.box(_at(ws, rz, dx, 0.05, 0.0015), (0.041, 0.024, 0.0002), kit.mat("#F4F1EA", 0.75), rot=(0, 0, rz))
        writing(_at(ws, rz, dx, 0.056, 0.0003), rz, label, 0.009, colour="#23305A", align="CENTER")
    writing(_at(ws, rz, -0.09, 0.0), rz, "Who checks it?  An independent\nevaluator, before release.", 0.009)
    book((-0.6, 3.05, 0.76), math.radians(12), cover="#3F9C8F", title="HOW AI WORKS")
    kit.place("potted_plant_04", (0.55, RD - 0.08, 0.93))
    kit.place("potted_plant_01", (-0.8, RD - 0.08, 0.93), scale=0.6)
    # afternoon sun streams in across the table
    kit.sun((52, 0, 230), 4.5, kit.kelvin(5200), angle=0.8)
    kit.camera((0.5, 2.35, 1.45), (-0.02, 3.1, 0.82), lens=40, fstop=5.6, focus=face)
    bpy.context.scene.view_settings.exposure = 0.8


def shot_cw_chat():
    room(sky="cobblestone_street_night", sky_strength=0.35, sky_rot=20, clock="20:15", lamp=True)
    table()
    face = laptop((-0.05, 3.2, 0.76), "cw-chat", CHAT, yaw=0)
    book((0.35, 3.3, 0.76), math.radians(-20), cover="#8A3B2E")
    mug((-0.4, 3.35, 0.76), "#F2EEE6", full=True)
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


kit.run({"mis-laptop": shot_mis_laptop, "ab-app": shot_ab_app, "al-chat": shot_al_chat, "rb-app": shot_rb_app,
         "lb-chat": shot_lb_chat, "mu-kitchen": shot_mu_kitchen, "ov-chat": shot_ov_chat, "pd-school": shot_pd_school,
         "cw-chat": shot_cw_chat})
