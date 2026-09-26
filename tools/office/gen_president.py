#!/usr/bin/env python3
"""Generate the President meeting scene used by the playable UI."""
import json
import os
import re

import gen_office as G


M, A = G.M, G.A
PRES = dict(skin=G.SK_LIGHT, hair=G.H_GREY, style="short", shirt=M("sky", 38, "ink"), mood="calm", suit=True)
NAVY = M("sky", 38, "ink")
DRAPE = M("coral", 46, "wood")
DRAPE_D = M(DRAPE, 72, "ink")
DESK = M("wood", 58, "ink")
DESK_T = M("wood", 70, "paper")
BRASS = G.BRASS

TAN = M(M("wood", 55, "coral"), 80, "paper")
TAN_D = M(TAN, 84, "ink")
GOLD = M("cream", 52, "wood")
GOLD_HI = M("cream", 70, "paper")
GOLD_D = M("wood", 82, "ink")
LIP = M("coral", 45, TAN)


def svg(body, label):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" class="room" '
            f'role="img" aria-label="{label}">{body}</svg>\n')


def president_head(hx, hy, mood):
    """Draw the approved caricature over gen_office's front-facing head."""
    hs = f"fill:{GOLD};stroke:{G.EDGE};stroke-width:.7"
    ink = "fill:none;stroke:var(--ink);stroke-linecap:round;stroke-linejoin:round"
    o = [
        f'<path d="M{hx + 17},{hy + 7} Q{hx + 21},{hy - 6} {hx + 14},{hy - 17} L{hx + 4},{hy - 8} Q{hx + 12},{hy - 2} {hx + 12},{hy + 9} Z" style="{hs}"/>',
        f'<path d="M{hx - 14.5},{hy - 2} C{hx - 14.5},{hy - 17} {hx + 15},{hy - 17} {hx + 15},{hy - 2} '
        f'C{hx + 16.5},{hy + 8} {hx + 12},{hy + 17} {hx - 1},{hy + 17} C{hx - 12},{hy + 17} {hx - 17},{hy + 9} {hx - 14.5},{hy - 2} Z" '
        f'style="fill:{TAN};stroke:{G.EDGE};stroke-width:.8"/>',
        f'<path d="M{hx - 10},{hy + 13} Q{hx - 4.5},{hy + 16} {hx + 1},{hy + 13.2} M{hx - 13.8},{hy + 6} Q{hx - 12.5},{hy + 10} {hx - 10.5},{hy + 11.5}" '
        f'style="fill:none;stroke:{TAN_D};stroke-width:.9;stroke-linecap:round"/>',
        f'<ellipse cx="{hx + 14}" cy="{hy + 3}" rx="3.2" ry="4.4" style="fill:{TAN_D};stroke:{G.EDGE};stroke-width:.6"/>',
        f'<ellipse cx="{hx - 7.5}" cy="{hy + 1.2}" rx="5" ry="3.6" style="fill:{M(TAN, 38, "paper")}"/>',
        f'<ellipse cx="{hx + 2}" cy="{hy + 1.2}" rx="5" ry="3.6" style="fill:{M(TAN, 38, "paper")}"/>',
    ]
    brow = f"fill:none;stroke:{GOLD_D};stroke-width:2.2;stroke-linecap:round"
    if mood == "uneasy":
        o.append(f'<path d="M{hx - 10.5},{hy + 2.2} L{hx - 4.5},{hy + 1} M{hx - 1},{hy + 1} L{hx + 5},{hy + 2.2}" style="{ink};stroke-width:1.9"/>'
                 f'<path d="M{hx - 12},{hy - 5.5} Q{hx - 8},{hy - 5} {hx - 4.5},{hy - 2.2} M{hx - .5},{hy - 2.2} Q{hx + 3},{hy - 5} {hx + 7},{hy - 5.5}" style="{brow}"/>'
                 f'<path d="M{hx - 3.5},{hy - 2.5} L{hx - 3},{hy - .5}" style="fill:none;stroke:{TAN_D};stroke-width:.8;stroke-linecap:round"/>'
                 f'<path d="M{hx - 9},{hy + 11.2} Q{hx - 5.5},{hy + 7.8} {hx - 2},{hy + 11.2} Q{hx - 5.5},{hy + 10} {hx - 9},{hy + 11.2} Z" style="fill:{LIP};stroke:var(--ink);stroke-width:1.3;stroke-linejoin:round"/>'
                 f'<ellipse cx="{hx - 5.5}" cy="{hy + 12.2}" rx="2.4" ry="1.2" style="fill:{LIP};stroke:{TAN_D};stroke-width:.6"/>')
    else:
        o.append(f'<ellipse cx="{hx - 7.5}" cy="{hy + 1.3}" rx="2.5" ry="1.25" style="fill:var(--ink)"/><ellipse cx="{hx + 2}" cy="{hy + 1.3}" rx="2.5" ry="1.25" style="fill:var(--ink)"/>'
                 f'<path d="M{hx - 11},{hy + .2} Q{hx - 7.5},{hy - 1} {hx - 4},{hy + .4} M{hx - 1.5},{hy + .4} Q{hx + 2},{hy - 1} {hx + 5.5},{hy + .2}" style="{ink};stroke-width:1.1"/>'
                 f'<path d="M{hx - 12},{hy - 3.8} Q{hx - 8},{hy - 5.6} {hx - 4.5},{hy - 4} M{hx - .5},{hy - 4} Q{hx + 3},{hy - 5.6} {hx + 7},{hy - 3.8}" style="{brow}"/>'
                 f'<ellipse cx="{hx - 5}" cy="{hy + 10}" rx="3.4" ry="2.7" style="fill:{LIP};stroke:{M(LIP, 80, "ink")};stroke-width:.7"/>'
                 f'<ellipse cx="{hx - 5}" cy="{hy + 10.1}" rx="1.5" ry="1.2" style="fill:var(--ink)"/>')
    swoop = (f'M{hx + 16},{hy - 3} Q{hx + 16},{hy - 15} {hx + 6},{hy - 19} Q{hx - 4},{hy - 23} {hx - 12},{hy - 28} '
             f'Q{hx - 22},{hy - 27} {hx - 25},{hy - 17} Q{hx - 26},{hy - 9} {hx - 21},{hy - 5} Q{hx - 17},{hy - 3} {hx - 16},{hy - 8} '
             f'Q{hx - 11},{hy - 12} {hx - 3},{hy - 12} Q{hx + 7},{hy - 12} {hx + 13},{hy - 2} Z')
    o.append(f'<path d="{swoop}" style="{hs}"/>')
    o.append(f'<path d="M{hx - 24.5},{hy - 10} Q{hx - 23},{hy - 4} {hx - 18.5},{hy - 5} Q{hx - 16},{hy - 6} {hx - 16},{hy - 8} Q{hx - 11},{hy - 12} {hx - 3},{hy - 12} '
             f'Q{hx + 7},{hy - 12} {hx + 13},{hy - 2} Q{hx + 8},{hy - 14} {hx - 3},{hy - 14.5} Q{hx - 14},{hy - 15} {hx - 19},{hy - 10} Q{hx - 22},{hy - 8} {hx - 24.5},{hy - 10} Z" '
             f'style="fill:{M(GOLD, 76, "wood")}"/>')
    o.append(f'<path d="M{hx + 10},{hy - 16} Q{hx},{hy - 20} {hx - 11},{hy - 25.5} Q{hx - 18},{hy - 25} {hx - 22},{hy - 18}" style="fill:none;stroke:{GOLD_HI};stroke-width:3.2;stroke-linecap:round"/>')
    o.append(f'<path d="M{hx + 14},{hy - 7} Q{hx + 8},{hy - 16} {hx - 4},{hy - 19} Q{hx - 14},{hy - 22} {hx - 21},{hy - 13} '
             f'M{hx + 10},{hy - 4} Q{hx + 4},{hy - 13} {hx - 6},{hy - 16} Q{hx - 15},{hy - 18} {hx - 20},{hy - 9}" '
             f'style="fill:none;stroke:{GOLD_D};stroke-width:.9;stroke-linecap:round;opacity:.7"/>')
    o.append(f'<path d="M{hx + 9},{hy - 7} Q{hx + 17},{hy - 8} {hx + 19},{hy + 2} Q{hx + 17},{hy - 1} {hx + 13},{hy - 1} Q{hx + 12},{hy - 5} {hx + 9},{hy - 7} Z" style="{hs}"/>')
    return "".join(o)


def president_extras(hx, hy, mood, top=-58):
    """Draw the approved tie, lapel pin, and uneasy hand and sweat drop."""
    tie = M("coral", 88, "ink")
    o = [f'<path d="M-4.2,{top} L0,{top + 5} L4.2,{top} L3,{top + 13} L0,{top + 6} L-3,{top + 13} Z" style="fill:var(--paper);stroke:{G.EDGE};stroke-width:.5"/>',
         f'<path d="M-2.4,{top + 5.5} L2.4,{top + 5.5} L4.8,-14 L0,-8 L-4.8,-14 Z" style="fill:{tie};stroke:{G.EDGE};stroke-width:.6"/>',
         f'<path d="M-2.8,{top + 1.2} L2.8,{top + 1.2} L2.2,{top + 6} L-2.2,{top + 6} Z" style="fill:{M(tie, 84, "ink")};stroke:{G.EDGE};stroke-width:.5"/>',
         f'<path d="M.8,{top + 7} L2.8,-16" style="fill:none;stroke:{M(tie, 80, "ink")};stroke-width:.8;stroke-linecap:round"/>']
    fx, fy = -11, top + 7
    o.append(f'<rect x="{fx - .3}" y="{fy - .3}" width="5.6" height="4" rx=".5" style="fill:{BRASS}"/>'
             f'<rect x="{fx}" y="{fy}" width="5" height="3.4" style="fill:var(--paper)"/>'
             f'<path d="M{fx},{fy + .5} h5 M{fx},{fy + 1.7} h5 M{fx},{fy + 2.9} h5" style="stroke:{M("coral", 85, "ink")};stroke-width:.6"/>'
             f'<rect x="{fx}" y="{fy}" width="2.2" height="1.9" style="fill:{NAVY}"/>')
    if mood == "uneasy":
        sk = TAN
        o.append(f'<path d="M10,-35 L{hx + 7},{hy + 18}" style="fill:none;stroke:{G.EDGE};stroke-width:8;stroke-linecap:round"/>'
                 f'<path d="M10,-35 L{hx + 7},{hy + 18}" style="fill:none;stroke:{PRES["shirt"]};stroke-width:6.5;stroke-linecap:round"/>'
                 f'<path d="M{hx + 3},{hy + 12} q2,-3 6,-1.5 q3,1.5 1.5,5 q-2,2.5 -5.5,1.5 q-3,-1.5 -2,-5 Z" style="fill:{sk};stroke:{G.EDGE};stroke-width:.7"/>')
        dx, dy = hx - 19, hy + 3
        o.append(f'<path d="M{dx},{dy - 6} Q{dx + 4.5},{dy + 1} {dx},{dy + 3.5} Q{dx - 4.5},{dy + 1} {dx},{dy - 6} Z" '
                 f'style="fill:{M("sky", 45, "paper")};stroke:{M("sky", 70, "ink")};stroke-width:.8"/>')
    return "".join(o)


def armchair_front(col):
    """An upholstered armchair seen from behind."""
    return (f'<g transform="translate(-5,5)">'
            f'<ellipse cx="0" cy="-10" rx="24" ry="9" style="fill:{A("ink", 18)}"/>'
            f'<rect x="-21" y="-30" width="42" height="26" rx="8" style="fill:{M(col, 82, "ink")};stroke:{G.EDGE};stroke-width:.8"/>'
            f'<rect x="-18" y="-58" width="36" height="34" rx="12" style="fill:{col};stroke:{G.EDGE};stroke-width:.8"/>'
            f'<rect x="-13" y="-53" width="26" height="22" rx="8" style="fill:{M(col, 86, "paper")}"/>'
            f'<rect x="-25" y="-36" width="10" height="26" rx="5" style="fill:{M(col, 88, "ink")};stroke:{G.EDGE};stroke-width:.7"/>'
            f'<rect x="15" y="-36" width="10" height="26" rx="5" style="fill:{M(col, 76, "ink")};stroke:{G.EDGE};stroke-width:.7"/>'
            f'</g>')


def backdrop(defs_id="b"):
    o = [f'<defs>'
         f'<linearGradient id="{defs_id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:{M("sky", 45, "paper")}"/><stop offset="1" style="stop-color:{M("sky", 18, "paper")}"/></linearGradient>'
         f'<linearGradient id="{defs_id}shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--paper);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:0"/></linearGradient>'
         f'<radialGradient id="{defs_id}vig" cx=".5" cy=".45" r=".75"><stop offset=".6" style="stop-color:var(--ink);stop-opacity:0"/><stop offset="1" style="stop-color:var(--ink);stop-opacity:.28"/></radialGradient>'
         f'</defs>',
         f'<rect width="1440" height="900" style="fill:{M("cream", 62, "paper")}"/>']
    o.append("".join(f'<rect x="{x}" y="0" width="18" height="560" style="fill:{A("wood", 7)}"/>' for x in range(0, 1440, 48)))
    o.append(f'<rect y="0" width="1440" height="34" style="fill:{M("paper", 86, "cream")}"/><rect y="34" width="1440" height="6" style="fill:{M("cream", 70, "wood")}"/>')
    o.append(f'<rect y="560" width="1440" height="150" style="fill:{M("cream", 70, "wood")}"/><rect y="556" width="1440" height="8" style="fill:{M("paper", 80, "wood")}"/>')
    o.append("".join(f'<rect x="{x + 12}" y="578" width="{126}" height="112" rx="4" style="fill:none;stroke:{M("wood", 60, "cream")};stroke-width:3"/>' for x in range(0, 1440, 150)))
    o.append(f'<rect y="700" width="1440" height="200" style="fill:{M("sky", 30, "cream")}"/>')
    o.append(f'<ellipse cx="720" cy="820" rx="720" ry="125" style="fill:{M("sky", 50, "cream")};stroke:{M("sky", 62, "ink")};stroke-width:6"/>'
             f'<ellipse cx="720" cy="820" rx="640" ry="104" style="fill:none;stroke:{M("cream", 60, "paper")};stroke-width:3"/>')
    o.append("".join(f'<circle cx="{720 + 590 * __import__("math").cos(t / 20 * 6.283):.1f}" cy="{820 + 94 * __import__("math").sin(t / 20 * 6.283):.1f}" r="5" style="fill:{BRASS}"/>' for t in range(20)))
    for x in (478, 655, 832):
        o.append(f'<rect x="{x - 8}" y="92" width="146" height="472" style="fill:{M("paper", 82, "ink")}"/>'
                 f'<rect x="{x}" y="100" width="130" height="456" style="fill:url(#{defs_id}sky)"/>'
                 f'<rect x="{x}" y="420" width="130" height="136" style="fill:{M("teal", 38, "paper")}"/>'
                 f'<path d="M{x + 18},{130} L{x + 64},{100} L{x + 88},{100} L{x + 30},{170} Z" style="fill:{A("paper", 45)}"/>'
                 f'<path d="M{x + 65},100 L{x + 65},556" style="stroke:{M("paper", 82, "ink")};stroke-width:4"/>'
                 + "".join(f'<path d="M{x},{100 + j * 114} L{x + 130},{100 + j * 114}" style="stroke:{M("paper", 82, "ink")};stroke-width:4"/>' for j in (1, 2, 3)))
        o.append(f'<polygon points="{x},{556} {x + 130},{556} {x + 210},{900} {x - 80},{900}" style="fill:url(#{defs_id}shaft);opacity:.55"/>')
    for x0, side in ((410, 1), (1032, -1), (608, 0), (786, 0)):
        if side == 0:
            o.append(f'<path d="M{x0},{86} L{x0 + 46},{86} Q{x0 + 38},{320} {x0 + 44},{566} L{x0 + 2},{566} Q{x0 + 8},{320} {x0},{86} Z" style="fill:{DRAPE};stroke:{G.EDGE}"/>'
                     f'<path d="M{x0 + 22},{96} Q{x0 + 18},{330} {x0 + 24},{560}" style="fill:none;stroke:{DRAPE_D};stroke-width:3"/>')
            continue
        o.append(f'<path d="M{x0},{80} L{x0 + side * 70},{80} Q{x0 + side * 54},{330} {x0 + side * 82},{578} L{x0 - side * 6},{578} Q{x0 + side * 10},{330} {x0},{80} Z" style="fill:{DRAPE};stroke:{G.EDGE}"/>'
                 + "".join(f'<path d="M{x0 + side * dx},{92} Q{x0 + side * (dx - 6)},{330} {x0 + side * (dx + 6)},{570}" style="fill:none;stroke:{DRAPE_D};stroke-width:3"/>' for dx in (18, 40, 60)))
    o.append(f'<path d="M396,64 L1046,64 L1046,98 Q1004,112 962,98 Q920,112 878,98 Q836,112 794,98 Q752,112 710,98 Q668,112 626,98 Q584,112 542,98 Q500,112 458,98 Q426,110 396,98 Z" style="fill:{DRAPE_D};stroke:{G.EDGE}"/>')
    o.append(f'<path d="M40,560 L40,210 Q175,120 310,210 L310,560 Z" style="fill:{M("cream", 55, "wood")};stroke:{G.EDGE}"/>')
    books = ["var(--coral)", NAVY, "var(--teal)", "var(--paper)", M("wood", 50, "ink"), M("coral", 60, "paper")]
    k = 0
    for sy in (300, 390, 480, 555):
        o.append(f'<rect x="48" y="{sy}" width="254" height="6" style="fill:{M("wood", 58, "ink")}"/>')
        x = 58
        while x < 292:
            bw, bh = 10 + (k * 7) % 8, 50 + (k * 11) % 22
            if sy == 390 and 150 < x < 210:
                o.append(f'<ellipse cx="180" cy="{sy - 30}" rx="18" ry="24" style="fill:{M("paper", 70, "ink")}"/><rect x="164" y="{sy - 12}" width="32" height="12" style="fill:{M("paper", 60, "ink")}"/>')
                x = 212
                continue
            o.append(f'<rect x="{x}" y="{sy - bh}" width="{bw}" height="{bh}" style="fill:{books[k % 6]};stroke:{A("ink", 30)};stroke-width:.8"/>')
            x += bw + 2
            k += 1
    stone = M("paper", 78, "cream")
    o.append(f'<rect x="1130" y="440" width="260" height="264" style="fill:{stone};stroke:{G.EDGE}"/>'
             f'<rect x="1112" y="428" width="296" height="18" rx="3" style="fill:{M(stone, 84, "ink")};stroke:{G.EDGE}"/>'
             f'<rect x="1190" y="520" width="140" height="184" rx="60" style="fill:{M("ink", 88, "wood")}"/>'
             f'<ellipse cx="1260" cy="690" rx="54" ry="16" style="fill:{A("coral", 55)};filter:blur(5px)"/>'
             f'<path d="M1226,700 q10,-42 22,-12 q10,-36 22,4 q8,-22 16,6 Z" style="fill:var(--coral)"/>'
             f'<rect x="1150" y="156" width="220" height="250" style="fill:{BRASS};stroke:{G.EDGE}"/>'
             f'<rect x="1162" y="168" width="196" height="226" style="fill:{M("sky", 36, "paper")}"/>'
             f'<path d="M1162,330 Q1220,270 1270,306 T1358,290 L1358,394 L1162,394 Z" style="fill:{M("teal", 68, "ink")}"/>'
             f'<path d="M1162,360 Q1250,330 1358,350 L1358,394 L1162,394 Z" style="fill:{M("teal", 50, "wood")}"/>')
    for fx, stripes in ((372, True), (1068, False)):
        o.append(f'<ellipse cx="{fx}" cy="704" rx="26" ry="8" style="fill:{M(BRASS, 80, "ink")}"/>'
                 f'<path d="M{fx},704 L{fx},150" style="stroke:{M("wood", 55, "ink")};stroke-width:7;stroke-linecap:round"/>'
                 f'<circle cx="{fx}" cy="140" r="11" style="fill:{BRASS};stroke:{G.EDGE}"/>')
        s = 1 if stripes else -1
        cloth = f'M{fx},160 Q{fx + s * 60},172 {fx + s * 70},230 Q{fx + s * 78},330 {fx + s * 56},420 Q{fx + s * 30},444 {fx + s * 4},430 Z'
        gid = f"{defs_id}flag{fx}"
        o.append(f'<defs><clipPath id="{gid}"><path d="{cloth}"/></clipPath></defs>')
        x0 = fx if s > 0 else fx - 90
        if stripes:
            o.append(f'<g clip-path="url(#{gid})"><rect x="{x0}" y="150" width="90" height="300" style="fill:{M("coral", 85, "ink")}"/>'
                     + "".join(f'<rect x="{x0}" y="{160 + i * 22}" width="90" height="11" style="fill:var(--paper)"/>' for i in range(13))
                     + f'<rect x="{x0}" y="150" width="46" height="120" style="fill:{NAVY}"/>'
                     + "".join(f'<circle cx="{x0 + 10 + (i % 3) * 13}" cy="{166 + (i // 3) * 22}" r="2.6" style="fill:var(--paper)"/>' for i in range(12)) + '</g>')
        else:
            o.append(f'<g clip-path="url(#{gid})"><rect x="{x0}" y="150" width="90" height="300" style="fill:{NAVY}"/>'
                     f'<circle cx="{fx + s * 40}" cy="290" r="22" style="fill:{BRASS}"/><circle cx="{fx + s * 40}" cy="290" r="14" style="fill:{NAVY}"/>'
                     f'<path d="M{fx + s * 40},{278} l4,9 10,1 -8,6 3,10 -9,-6 -9,6 3,-10 -8,-6 10,-1 Z" style="fill:{BRASS}"/></g>')
        o.append(f'<path d="{cloth}" style="fill:none;stroke:{G.EDGE};stroke-width:1.2"/>'
                 f'<path d="M{fx + s * 30},180 Q{fx + s * 44},300 {fx + s * 30},424" style="fill:none;stroke:{A("ink", 20)};stroke-width:6"/>')
    return "".join(o)


def desk_front(x0, x1, top, bottom, scale=1.0):
    w = x1 - x0
    o = [f'<rect x="{x0 - 20 * scale:.1f}" y="{top:.1f}" width="{w + 40 * scale:.1f}" height="{22 * scale:.1f}" rx="3" style="fill:{DESK_T};stroke:{G.EDGE}"/>',
         f'<rect x="{x0:.1f}" y="{top + 22 * scale:.1f}" width="{w:.1f}" height="{bottom - top - 22 * scale:.1f}" style="fill:{DESK};stroke:{G.EDGE}"/>']
    ph = bottom - top - 60 * scale
    for i in range(3):
        px = x0 + 24 * scale + i * (w - 48 * scale) / 3
        pw = (w - 48 * scale) / 3 - 20 * scale
        o.append(f'<rect x="{px:.1f}" y="{top + 44 * scale:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{6 * scale:.1f}" style="fill:{M(DESK, 90, "paper")};stroke:{M(DESK, 70, "paper")};stroke-width:{3 * scale:.1f}"/>')
    o.append(f'<circle cx="{(x0 + x1) / 2:.1f}" cy="{top + 44 * scale + ph / 2:.1f}" r="{30 * scale:.1f}" style="fill:{BRASS};stroke:{G.EDGE}"/>'
             f'<circle cx="{(x0 + x1) / 2:.1f}" cy="{top + 44 * scale + ph / 2:.1f}" r="{20 * scale:.1f}" style="fill:{NAVY}"/>')
    return "".join(o)


def v2_parts(mood):
    s = 3.35
    ox, oy = 720, 614
    p = dict(PRES, mood=mood)
    body, hands, (hx, hy) = G.front_person(dict(p, skin=TAN, hair=GOLD))
    body = re.sub(r'<path d="[^"]*" style="fill:color-mix\(in oklab, var\(--sky\) 45%[^"]*"/>', "", body)
    body += president_head(hx, hy, mood) + president_extras(hx, hy, mood, top=-55 if mood == "uneasy" else -58)
    hands = hands.replace(G.SK_LIGHT, TAN)
    if mood != "uneasy":
        hands = hands.replace("M7,-34 Q-8,-27 -19,-25", "M7,-34 Q-5,-35 -15,-37").replace('cx="-20" cy="-25"', 'cx="-16" cy="-37"')
    chair = (f'<rect x="{ox - 100}" y="{oy - 350}" width="210" height="320" rx="48" style="fill:{M("wood", 40, "ink")};stroke:{G.EDGE}"/>'
             f'<rect x="{ox - 76}" y="{oy - 326}" width="162" height="270" rx="36" style="fill:{M("wood", 48, "ink")}"/>')
    body_group = f'<g transform="translate({ox},{oy}) scale({s})">{body}</g>'
    desk = desk_front(470, 970, 500, 700)
    props = (f'<rect x="560" y="482" width="96" height="16" rx="2" style="fill:var(--paper);stroke:{A("ink", 30)}" transform="rotate(-4 608 490)"/>'
             f'<rect x="846" y="474" width="52" height="26" rx="5" style="fill:var(--ink)"/><path d="M852,474 q20,-16 40,0" style="fill:none;stroke:var(--ink);stroke-width:6"/>')
    hands_group = f'<g transform="translate({ox},{oy}) scale({s})">{hands}</g>'
    heads = {"president": [ox + hx * s, oy + (hy - 28) * s]}
    advisors = {}
    bs = 4.0
    for role, (bx, by) in (("ceo", (300, 1010)), ("policy", (1140, 1020))):
        col = M("coral", 55, "wood") if role == "ceo" else M("teal", 55, "wood")
        advisors[role] = f'<g transform="translate({bx},{by}) scale({bs})">{G.back_person(G.PEOPLE[role])}{armchair_front(col)}</g>'
        heads[role] = [bx + 2 * bs, by - 93 * bs]
    vignette = f'<rect width="1440" height="900" style="fill:url(#bvig)"/>'
    return {
        "backdrop": backdrop("b"), "chair": chair, "body": body_group, "desk": desk,
        "props": props, "hands": hands_group, "advisors": advisors, "vignette": vignette,
    }, heads


def v2(mood="uneasy"):
    parts, heads = v2_parts(mood)
    body = "".join([
        parts["backdrop"], parts["chair"], parts["body"], parts["desk"], parts["props"],
        parts["hands"], parts["advisors"]["ceo"], parts["advisors"]["policy"], parts["vignette"],
    ])
    return svg(body, "The President's office, seen over your shoulder"), heads


def playable_scene():
    calm, calm_heads = v2_parts("calm")
    uneasy, uneasy_heads = v2_parts("uneasy")
    body = "".join([
        calm["backdrop"], calm["chair"],
        f'<g class="pres-body" data-mood="calm">{calm["body"]}</g>',
        f'<g class="pres-body" data-mood="uneasy">{uneasy["body"]}</g>',
        calm["desk"], calm["props"],
        f'<g class="pres-hands" data-mood="calm">{calm["hands"]}</g>',
        f'<g class="pres-hands" data-mood="uneasy">{uneasy["hands"]}</g>',
        f'<g id="advisor-ceo">{calm["advisors"]["ceo"]}</g>',
        f'<g id="advisor-policy">{calm["advisors"]["policy"]}</g>',
        calm["vignette"],
    ])
    scene = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="1440" height="900" '
             f'class="room president-room" data-mood="calm" role="img" aria-label="The President\'s office, seen over your shoulder">{body}</svg>\n')
    anchors = {
        "president": {"calm": calm_heads["president"], "uneasy": uneasy_heads["president"]},
        "policy": calm_heads["policy"],
        "ceo": calm_heads["ceo"],
    }
    return scene, anchors


def main():
    root = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
    out = os.path.join(root, "ui", "assets")
    os.makedirs(out, exist_ok=True)
    scene, anchors = playable_scene()
    with open(os.path.join(out, "president.svg"), "w", encoding="utf-8") as file:
        file.write(scene)
    with open(os.path.join(out, "president-anchors.json"), "w", encoding="utf-8") as file:
        json.dump(anchors, file, indent=2)
        file.write("\n")


if __name__ == "__main__":
    main()
