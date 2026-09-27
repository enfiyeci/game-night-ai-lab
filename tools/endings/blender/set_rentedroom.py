"""A rented room: a cheap flat stripped out and filled with steel shelves of open-frame GPU rigs, cables across the
floor, a folding table, a bare bulb, and the street light through the blinds. Shots:

  mu-room   Catastrophic misuse, two weeks earlier: three people in the dark among humming racks; on the table's two
            monitors 10,000 workers online, and your model cheerfully explaining how it made that possible.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import furniture as F  # noqa: E402
import kit  # noqa: E402
import people as P  # noqa: E402

W, D, H = 2.3, 4.5, 2.5


def room():
    wall = kit.tex("painted_plaster_wall", 0.5, tint="#B7AC94", name="rwall")
    kit.box((0, D / 2, -0.05), (2 * W, D, 0.1), kit.tex("old_linoleum_flooring_01", 0.5, tint="#9C9486", name="rfloor"))
    kit.box((0, D / 2, H + 0.05), (2 * W, D, 0.1), kit.mat("#8E887C", 0.9))
    for c, s in (((0, D + 0.05, H / 2), (2 * W, 0.1, H)), ((0, -0.05, H / 2), (2 * W, 0.1, H)), ((W + 0.05, D / 2, H / 2), (0.1, D, H))):
        kit.box(c, s, wall)
    # the left wall has the window, blinds shut, the street lamp's orange coming through the slats
    kit.box((-W - 0.05, D / 2, 0.45), (0.1, D, 0.9), wall)
    kit.box((-W - 0.05, D / 2, 2.3), (0.1, D, 0.4), wall)
    kit.box((-W - 0.05, 0.5, 1.5), (0.1, 1.0, 1.2), wall)
    kit.box((-W - 0.05, 3.25, 1.5), (0.1, 2.5, 1.2), wall)
    F.batch("blinds", [((-W + 0.03, 1.5, 0.93 + k * 0.06), (0.04, 1.0, 0.003), (0, math.radians(-25), 0)) for k in range(20)],
            kit.mat("#D8D2C4", 0.6))
    kit.area((-W - 0.8, 1.5, 2.2), (-W, 1.5, 1.2), (1.0, 1.0), 180, (1.0, 0.55, 0.22))
    kit.world("#05060A", 1.0)


def shelves(x0, y0, length, along_y=False, seed=1):
    """A steel shelving run of GPU rigs, `length` long from (x0, y0), running along x (or y); the rigs' fans face into
    the room (-y on the back wall, -x on the right wall)."""
    rng = random.Random(seed)
    steel, cards, fans, leds = [], [], [], []

    def at(u, v, z):   # u along the run, v into the depth (0 = front)
        return (x0 + u, y0 + v, z) if not along_y else (x0 + v, y0 + u, z)

    def size(su, sv, sz):
        return (su, sv, sz) if not along_y else (sv, su, sz)

    for k in range(int(length / 1.2) + 1):
        for dv in (0.0, 0.45):
            steel.append((at(k * 1.2, dv, 1.05), size(0.035, 0.035, 2.1)))
    for z in (0.08, 0.6, 1.12, 1.64, 2.08):
        steel.append((at(length / 2, 0.225, z), size(length, 0.47, 0.02)))
    for z in (0.1, 0.62, 1.14, 1.66):
        for r in range(int(length / 0.42)):
            u0 = 0.12 + r * 0.42
            for c in range(6):
                u = u0 + c * 0.055
                cards.append((at(u, 0.2, z + 0.08), size(0.035, 0.28, 0.13)))
                if rng.random() < 0.93:
                    fans.append((at(u, 0.058, z + 0.08), size(0.028, 0.004, 0.028)))
                leds.append((at(u, 0.2, z + 0.147), size(0.03, 0.26, 0.004)))
    F.batch(f"steel{seed}", steel, kit.mat("#6E7378", 0.4, 0.8))
    F.batch(f"cards{seed}", cards, kit.mat("#16181B", 0.4, 0.5))
    F.batch(f"fans{seed}", fans, kit.emission("#9FE6FF", 2.5))
    F.batch(f"leds{seed}", leds, kit.emission("#3DFFB0", 3))


def cables(seed=3):
    """Cables across the floor to the power strips, and hanging from the rigs."""
    rng = random.Random(seed)
    runs = []
    for _ in range(60):
        x, y = rng.uniform(-1.8, 2.1), rng.uniform(1.0, 4.1)
        runs.append(((x, y, 0.006), (rng.uniform(0.6, 1.8), 0.012, 0.012), rng.uniform(0, math.pi)))
    for _ in range(40):
        x = rng.uniform(-1.9, 1.5)
        runs.append(((x, D - 0.52, rng.uniform(0.3, 0.9)), (0.01, 0.01, rng.uniform(0.4, 1.4)), (rng.uniform(-0.2, 0.2), 0, 0)))
    F.batch("cables", runs, kit.mat("#0E0E10", 0.5))
    for (x, y, r) in ((0.3, 3.2, 0.2), (1.3, 3.0, -0.4), (-0.8, 3.1, 0.6)):
        kit.box((x, y, 0.02), (0.4, 0.06, 0.04), kit.mat("#E6E2D8", 0.5), rot=(0, 0, r))
        kit.box((x, y, 0.042), (0.03, 0.02, 0.004), kit.emission("#FF3322", 4), rot=(0, 0, r))


def shot_mu_room():
    room()
    shelves(-2.0, D - 0.55, 3.8, seed=1)
    shelves(W - 0.5, 0.9, 2.9, along_y=True, seed=2)
    cables()
    # the folding table square to the camera, its two monitors; energy cans, pizza boxes
    a = math.radians(-38)
    vx, vy = -math.sin(a), math.cos(a)            # the way the table faces (away from the camera)
    px, py = math.cos(a), math.sin(a)             # along the table
    cx, cy = 0.75, 2.5
    F.desk(cx, cy, w=1.8, d=0.7, top="#C9C4B8", rot_z=a)
    left = F.monitor("workers", (cx - 0.34 * px, cy - 0.34 * py), 0.6, "mu-room", (70, 340, 520, 240), yaw=-38)
    F.monitor("chat", (cx + 0.37 * px, cy + 0.37 * py), 0.68, "mu-room", (620, 340, 590, 240), yaw=-38)
    F.keyboard(cx - 0.3 * vx, cy - 0.3 * vy, rot_z=a)
    rng = random.Random(2)
    for k in range(5):
        u = 0.62 + rng.uniform(0, 0.2)
        kit.cyl((cx + u * px - 0.2 * vx + rng.uniform(-0.05, 0.05), cy + u * py - 0.2 * vy, 0.815), 0.033, 0.12,
                kit.mat(rng.choice(["#1E6B3A", "#D9D9D9", "#1C3F8A"]), 0.25, 0.8))
    for k in range(3):
        kit.box((-0.9, 1.9, 0.025 + k * 0.045), (0.4, 0.4, 0.04), kit.mat("#C9A878", 0.8), rot=(0, 0, 0.2 * k))
    kit.cyl((0.4, 2.0, 2.3), 0.004, 0.4, kit.mat("#111", 0.5))
    kit.sphere((0.4, 2.0, 2.07), 0.035, kit.emission("#FFC37A", 12), scale=(1, 1, 1.3))
    kit.point((0.4, 2.0, 2.05), 18, kit.kelvin(2400), radius=0.03)
    # the three of them: one at the table, two by the racks, all from behind
    kit.place("plastic_monobloc_chair_01", (-0.22, 2.36, 0), rot_z=a + math.pi)
    P.person((-0.22, 2.36), facing=-38, pose="sit", coat="#1F2226", hood=True, seed=31)
    P.person((0.2, 3.72), facing=5, coat="#2A2B30", hold="phone", seed=32)
    P.person((1.62, 3.15), facing=-80, coat="#33302C", height=1.85, seed=33)
    kit.area((cx - 0.35 * vx, cy - 0.35 * vy, 1.1), (cx - 1.5 * vx, cy - 1.5 * vy, 0.8), (1.0, 0.3), 5, kit.kelvin(7500))   # the monitors' light
    kit.haze((0, D / 2, H / 2), (2 * W - 0.05, D - 0.05, H - 0.05), 0.025)
    kit.camera((-0.45, 1.0, 1.3), (0.75, 2.55, 1.16), lens=26, fstop=4.0, focus=left)


kit.run({"mu-room": shot_mu_room})
