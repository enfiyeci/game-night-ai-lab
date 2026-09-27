"""OpenBrain, the rival lab: a bright meeting room in pale oak, white and glass under overcast daylight, the cool
opposite of your lab's dark concrete. Shots:

  rd-slide   Someone else's disaster, three weeks earlier: the launch review is over, chairs pushed back; on the wall
             screen COMPETITOR SHIPPED, SAFETY BAR ADJUSTED beside the red-team report; the printed report itself
             lies still sealed on the table under a coffee cup, and the last person out closes the door.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import furniture as F  # noqa: E402
import kit  # noqa: E402
import people as P  # noqa: E402

W, D, H = 3.2, 7.5, 3.0


def room():
    white = kit.mat("#EEF0EF", 0.7)
    kit.box((0, D / 2, -0.05), (2 * W + 0.2, D + 0.2, 0.1), kit.tex("brown_planks_05", 0.9, tint="#E2D6C4", rough=0.3, name="obfloor"))
    kit.box((0, D / 2, H + 0.05), (2 * W + 0.2, D + 0.2, 0.1), kit.mat("#F4F5F4", 0.9))
    kit.box((0, D + 0.05, H / 2), (2 * W, 0.1, H), white)
    kit.box((0, -0.05, H / 2), (2 * W, 0.1, H), white)
    kit.box((W + 0.05, D / 2, H / 2), (0.1, D, H), white)
    # the left wall is glass onto the corridor, with a frosted band and the name on it, and a door at the back
    glass = kit.box((-W - 0.02, D / 2, H / 2), (0.02, D, H), kit.glass(0.04, tint="#F2F7F8"))
    glass.visible_shadow = False
    kit.box((-W - 0.01, D / 2, 1.3), (0.012, D, 0.4), kit.mat("#F7F9F9", 0.4, alpha=0.75))
    kit.text("OPENBRAIN", (-W + 0.001, 3.0, 1.3), 0.2, kit.mat("#8FA9B2", 0.4), font=kit.FONT, rot=(math.radians(90), 0, math.radians(-90)))
    frame = kit.mat("#C9CDCF", 0.3, 0.8)
    for y in (0.0, 2.0, 4.0, 5.6, 6.6, D):
        kit.box((-W, y, H / 2), (0.06, 0.06, H), frame)
    # the corridor beyond: bright, white, a planter
    kit.box((-W - 1.5, D / 2, -0.04), (3, D + 4, 0.1), kit.mat("#E9EAE8", 0.5))
    kit.box((-W - 3.0, D / 2, H / 2), (0.1, D + 4, H), kit.mat("#F2F2F0", 0.8))
    kit.area((-W - 1.5, D / 2, H - 0.05), (-W - 1.5, D / 2, 0), (1.5, D), 160, kit.kelvin(6000))
    kit.place("potted_plant_01", (-W - 2.4, 2.0, 0))
    # daylight from a skylight strip over the table
    kit.world(hdri="cambridge", strength=0.4)
    kit.box((0, D / 2, H - 0.01), (1.2, D - 1.5, 0.02), kit.emission("#F3F7FA", 1.5))
    kit.area((0, D / 2, H - 0.05), (0, D / 2, 0), (1.2, D - 1.5), 160, kit.kelvin(6800))


def shot_rd_slide():
    room()
    face, _ = kit.screen("review", (0.2, D - 0.06, 1.6), 3.0, "rd-slide", (80, 90, 1120, 460), strength=1.25, bezel="#1A1C1E",
                         depth=0.03, border=0.01)
    # the table and its chairs, left where people got up
    kit.box((0.1, 3.9, 0.74), (1.5, 4.4, 0.04), kit.mat("#BFA88C", 0.3, coat=0.3), bevel=0.02)
    for y in (2.2, 5.6):
        kit.box((0.1, y, 0.36), (0.12, 0.8, 0.72), kit.mat("#B9BDBF", 0.3, 0.8))
    rng = random.Random(6)
    for k, y in enumerate((2.3, 3.4, 4.5, 5.6)):
        for side in (-1, 1):
            F.chair((0.1 + side * (1.1 + rng.uniform(0, 0.35)), y + rng.uniform(-0.2, 0.2)), side * 90 + rng.uniform(-35, 35), colour="#8FA3AF")
    for (x, y) in ((-0.4, 3.0), (0.5, 4.3), (-0.3, 5.2)):
        F.cup((x, y, 0.76))
    # the red-team report: printed, still sealed in its sleeve, a coffee cup set down on it
    x, y = 0.3, 3.35
    kit.box((x, y, 0.764), (0.23, 0.31, 0.008), kit.mat("#F4F1EA", 0.6), rot=(0, 0, 0.25))
    kit.box((x, y, 0.769), (0.24, 0.32, 0.001), kit.mat("#DDE7EE", 0.05, alpha=0.35), rot=(0, 0, 0.25))
    F.flat_text("RED-TEAM REPORT\nself-copying test", (x - 0.06 * math.sin(-0.25), y + 0.08, 0.7705), 0.018, rot_z=0.25, font=kit.FONT)
    kit.box((x + 0.03, y - 0.02, 0.771), (0.12, 0.03, 0.0005), kit.mat("#6E6A66", 0.5), rot=(0, 0, 0.25))
    F.flat_text("UNOPENED", (x + 0.03, y - 0.02, 0.7717), 0.014, "#F4F1EA", rot_z=0.25, font=kit.FONT)
    F.cup((x - 0.05, y - 0.1, 0.77), colour="#2B2B2B")
    # the last one out, beyond the glass at the door
    P.person((-W - 0.8, 6.2), facing=160, pose="walk", coat="#4A5560", hold="phone", seed=3)
    kit.camera((0.95, 0.9, 1.42), (-0.05, D, 1.2), lens=30, fstop=4.0, focus=face)


kit.run({"rd-slide": shot_rd_slide})
