#!/usr/bin/env python3
"""Feed and Lumen placement mockups (plan 2D), built on the approved K2 page.

Reads docs/design/mockups/K2-gdt-polished.html and injects three option states:
  #a  phone on your desk, Lumen speaks from your monitor      (closest to Game Dev Tycoon)
  #b  posts float in the margin and fade, Lumen as subtitles   (experimental)
  #c  a lounge TV, Lumen as a small robot floating in the room (most experimental, diegetic)
Writes docs/design/mockups/K2-feed-lumen.html. K2 tokens only.
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / "K2-gdt-polished.html"
OUT = HERE.parent / "K2-feed-lumen.html"

CSS = r"""
/* ---------- plan 2D: feed and Lumen ---------- */
.opt{position:absolute;right:16px;bottom:14px;background:var(--paper);border-radius:9px;padding:7px 12px 8px;font-size:12px;font-weight:700;
  color:color-mix(in oklab, var(--ink) 70%, var(--paper));max-width:300px;line-height:1.35;
  border:1px solid color-mix(in oklab, var(--ink) 8%, transparent);box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 14%, transparent)}
.opt b{color:var(--ink);font-weight:900;font-size:13px;display:block}
.tagc{display:inline-block;font-size:9.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:1px 6px;border-radius:4px;margin-left:6px;vertical-align:1px;
  background:color-mix(in oklab, var(--ink) 7%, var(--paper));color:color-mix(in oklab, var(--ink) 74%, var(--paper))}
.tagc.you{background:color-mix(in oklab, var(--coral) 16%, var(--paper));color:color-mix(in oklab, var(--coral) 55%, var(--ink))}
.feedlist .post{grid-template-columns:28px 1fr;padding:9px 0}
.feedlist .av{width:28px;height:28px;font-size:12px}
.feedlist .x{font-size:12.5px}
.feedlist .when{font-size:10.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 64%, var(--paper));margin-top:3px}

/* Lumen glyph: a small lamp-like face in the alignment colour */
.lg{flex:none;width:34px;height:34px;border-radius:50%;position:relative;
  background:radial-gradient(circle at 40% 35%, var(--paper), color-mix(in oklab, var(--sky) 22%, var(--paper)) 70%);
  border:3px solid var(--sky);box-shadow:0 0 0 4px color-mix(in oklab, var(--sky) 16%, transparent)}
.lg::before,.lg::after{content:"";position:absolute;top:11px;width:5px;height:7px;border-radius:3px;background:var(--ink)}
.lg::before{left:9px} .lg::after{right:9px}
.lgm{position:absolute;left:50%;bottom:7px;width:10px;height:4px;margin-left:-5px;border-bottom:2px solid var(--ink);border-radius:0 0 6px 6px}
.lsay{display:flex;gap:11px;align-items:flex-start}
.lsay .nm{font-size:12px;font-weight:900;color:color-mix(in oklab, var(--sky) 62%, var(--ink));letter-spacing:.02em}
.lsay .tx{font-size:14px;font-weight:700;line-height:1.35;margin-top:1px}

/* A: phone on the desk + the opened phone */
.phone{position:absolute;left:22px;top:104px;width:292px;height:640px;border-radius:38px;background:var(--ink);padding:12px;
  box-shadow:0 3px 0 color-mix(in oklab, var(--ink) 70%, var(--cream)), 0 20px 44px color-mix(in oklab, var(--ink) 30%, transparent)}
.phone .scr{position:relative;height:100%;border-radius:28px;background:var(--paper);overflow:hidden;padding:0 16px}
.phone .notch{position:absolute;left:50%;top:9px;width:86px;height:22px;margin-left:-43px;border-radius:12px;background:var(--ink)}
.phone .top{display:flex;justify-content:space-between;align-items:baseline;padding:44px 2px 8px;border-bottom:2px solid color-mix(in oklab, var(--wood) 30%, transparent)}
.phone h2{margin:0;font-size:22px;font-weight:900}
.phone .new{font-size:11.5px;font-weight:900;color:var(--paper);background:var(--coral);border-radius:999px;padding:2px 9px}
.phone .home{position:absolute;left:50%;bottom:8px;width:110px;height:5px;margin-left:-55px;border-radius:3px;background:color-mix(in oklab, var(--ink) 30%, var(--paper))}
.bubble{position:absolute;background:var(--paper);border-radius:14px;padding:12px 15px;
  border:1px solid color-mix(in oklab, var(--ink) 10%, transparent);
  box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 16%, transparent), 0 10px 24px color-mix(in oklab, var(--ink) 16%, transparent)}
.bubble .tail{position:absolute;width:18px;height:18px;background:var(--paper);transform:rotate(45deg);
  border-right:1px solid color-mix(in oklab, var(--ink) 10%, transparent);border-bottom:1px solid color-mix(in oklab, var(--ink) 10%, transparent)}

/* B: floating posts in the margin, Lumen as subtitles */
.drift{position:relative;width:300px;background:var(--paper);border-radius:12px;padding:9px 11px;
  border:1px solid color-mix(in oklab, var(--ink) 9%, transparent);box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 12%, transparent), 0 8px 18px color-mix(in oklab, var(--ink) 10%, transparent)}
.drift .post{padding:0;border:0}
.sub{position:absolute;left:390px;bottom:22px;width:660px;background:color-mix(in oklab, var(--paper) 94%, transparent);border-radius:14px;padding:12px 18px;
  border-left:6px solid var(--sky);box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 14%, transparent), 0 12px 28px color-mix(in oklab, var(--ink) 16%, transparent)}
.sub .tx{font-size:16px}

/* C: lounge TV and the floating Lumen robot */
.tvp{position:absolute;left:22px;top:104px;width:318px}
.tvp .live{display:flex;align-items:center;gap:8px;background:var(--ink);color:var(--paper);padding:8px 14px;font-weight:900;font-size:13px;letter-spacing:.06em}
.tvp .live i{font-style:normal;background:var(--coral);border-radius:4px;padding:1px 6px;font-size:11px}
.tvp .body{padding:4px 14px 10px}
.tvp .chy{margin:6px 14px 14px;background:var(--ink);color:var(--paper);border-radius:6px;padding:7px 10px;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden}
.tvp .chy span{color:color-mix(in oklab, var(--coral) 52%, var(--paper));margin-right:8px}
"""

POSTS = [
    ("E", "teal", "@early_adopter", "week one with kestrel 4. it rewrote our whole test suite. some of the tests even test things.", "you", "your model", "this turn"),
    ("T", "coral", "@tired_parent", "asked it to check my son's essay. it called the essay “genuinely brilliant”. it was not.", "you", "your model", "this turn"),
    ("M", "sky", "@marketwire", "OpenBrain answers with a bigger model; analysts call it “a reply, not a leap”", "", "rivals", "this turn"),
    ("I", "wood", "@indie_dev", "kestrel 4 is great until you see the bill", "you", "your model", "last turn"),
    ("S", "ink", "@sen_whitfield", "my office would like to know what “agentic” means. in writing.", "", "the world", "last turn"),
]

LUMEN = ("Lumen", "Kestrel 4 is ready. Tomas hasn’t signed off on the agent tests yet. I’d wait one more turn.")


def post(p, cls=""):
    letter, col, handle, text, you, tag, when = p
    return (f'<div class="post {cls}"><div class="av" style="background:var(--{col})">{letter}</div><div>'
            f'<div class="h">{handle}<span class="tagc {you}">{tag}</span></div><div class="x">{text}</div>'
            f'<div class="when">{when}</div></div></div>')


def lumen_say(extra_cls=""):
    name, text = LUMEN
    return (f'<div class="lsay {extra_cls}"><div class="lg"><i class="lgm"></i></div><div>'
            f'<div class="nm">{name.upper()} · YOUR MODEL</div><div class="tx">{text}</div></div></div>')


def option_a():
    posts = "".join(post(p) for p in POSTS[:4])
    return f"""
<div id="a" class="ov">
  <svg class="ping" width="1440" height="900" viewBox="0 0 1440 900" aria-hidden="true">
    <!-- the phone lying on the CEO desk, buzzing -->
    <g transform="translate(676,668) rotate(-30)">
      <rect x="-15" y="-8" width="30" height="16" rx="4" style="fill:var(--ink)"/>
      <rect x="-12" y="-5.5" width="24" height="11" rx="2" style="fill:color-mix(in oklab, var(--sky) 55%, var(--paper))"/>
    </g>
    <path d="M654,650 q-6,6 0,12 M648,646 q-10,10 0,20" style="fill:none;stroke:var(--coral);stroke-width:2;stroke-linecap:round"/>
    <circle cx="694" cy="652" r="9" style="fill:var(--coral);stroke:var(--paper);stroke-width:2"/>
    <text x="694" y="656" text-anchor="middle" style="font:900 11px Nunito;fill:var(--paper)">3</text>
    <!-- a soft glow on the CEO's monitor where Lumen speaks -->
    <ellipse cx="622" cy="612" rx="38" ry="30" style="fill:color-mix(in oklab, var(--sky) 22%, transparent)"/>
  </svg>
  <div class="phone"><div class="scr"><div class="notch"></div>
    <div class="top"><h2>Feed</h2><span class="new">3 new</span></div>
    <div class="feedlist">{posts}</div><div class="home"></div></div></div>
  <div class="bubble" style="left:332px;top:686px;width:330px">{lumen_say()}
    <div class="tail" style="left:300px;top:-10px;transform:rotate(225deg)"></div></div>
  <div class="opt"><b>A · Phone and monitor</b>A phone on your desk buzzes with new posts; click it to read. Lumen talks from your monitor at the start of each turn.</div>
</div>"""


def option_b():
    ops = [0.35, 0.65, 1.0]
    order = [POSTS[2], POSTS[1], POSTS[0]]
    cards = '<div style="position:absolute;left:22px;bottom:22px;display:flex;flex-direction:column;gap:8px">' + "".join(
        f'<div class="drift feedlist" style="opacity:{o}">{post(p)}</div>' for p, o in zip(order, ops)) + '</div>'
    return f"""
<div id="b" class="ov">
  {cards}
  <div class="sub">{lumen_say()}</div>
  <div class="opt" style="bottom:auto;top:96px"><b>B · Posts float by, Lumen narrates</b>New posts drift into the empty margin and fade after a few seconds; click one for the full feed. Lumen speaks like film subtitles.</div>
</div>"""


def option_c():
    posts = "".join(post(p) for p in POSTS[:3])
    return f"""
<div id="c" class="ov">
  <svg class="ping" width="1440" height="900" viewBox="0 0 1440 900" aria-hidden="true">
    <!-- lounge TV on a low stand, screen facing the beanbag -->
    <polygon points="928,722 1012,673 1024,680 940,729" style="fill:color-mix(in oklab, var(--wood) 80%, var(--paper))"/>
    <polygon points="928,722 940,729 940,752 928,745" style="fill:color-mix(in oklab, var(--wood) 70%, var(--ink))"/>
    <polygon points="940,729 1024,680 1024,703 940,752" style="fill:var(--wood)"/>
    <line x1="968" y1="706" x2="968" y2="698" style="stroke:var(--ink);stroke-width:4"/>
    <polygon points="926,700 1010,651 1010,598 926,647" style="fill:var(--ink)"/>
    <polygon points="931,694 1005,651 1005,604 931,647" style="fill:color-mix(in oklab, var(--sky) 60%, var(--ink))"/>
    <polygon points="931,686 1005,643 1005,651 931,694" style="fill:var(--paper)"/>
    <polygon points="936,660 960,646 960,658 936,672" style="fill:var(--paper);opacity:.9"/>
    <polygon points="964,644 996,625 996,631 964,650" style="fill:var(--paper);opacity:.7"/>
    <!-- Lumen: a small floating robot with a shadow -->
    <ellipse cx="548" cy="612" rx="20" ry="7" style="fill:color-mix(in oklab, var(--ink) 18%, transparent)"/>
    <g class="bob">
      <circle cx="548" cy="560" r="21" style="fill:var(--paper);stroke:var(--sky);stroke-width:4"/>
      <circle cx="548" cy="560" r="29" style="fill:color-mix(in oklab, var(--sky) 14%, transparent)"/>
      <rect x="540" y="553" width="4" height="7" rx="2" style="fill:var(--ink)"/>
      <rect x="552" y="553" width="4" height="7" rx="2" style="fill:var(--ink)"/>
      <path d="M543,566 q5,4 10,0" style="fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round"/>
      <line x1="548" y1="539" x2="548" y2="530" style="stroke:var(--ink);stroke-width:2"/>
      <circle cx="548" cy="528" r="3.5" style="fill:var(--sky)"/>
    </g>
  </svg>
  <section class="gp tvp"><div class="live"><i>LIVE</i> The Feed · channel 4</div>
    <div class="body feedlist">{posts}</div>
    <div class="chy"><span>BREAKING</span>OpenBrain answers with a bigger model • Senate asks what “agentic” means • Kestrel 4</div></section>
  <div class="bubble" style="left:196px;top:620px;width:320px">{lumen_say()}
    <div class="tail" style="left:290px;top:-10px;transform:rotate(225deg)"></div></div>
  <div class="opt"><b>C · Lounge TV and a Lumen robot</b>The feed plays on a TV in the lounge corner; click it to watch. Lumen is a small robot that floats around the office and speaks in bubbles.</div>
</div>"""


def build():
    s = BASE.read_text()
    s = s.replace("<title>Lab Office</title>", "<title>Feed and Lumen</title>")
    s = s.replace("</style>", CSS + "</style>", 1)
    i = s.rfind("<script>(function(){var t=document.getElementById")
    s = s[:i] + option_a() + option_b() + option_c() + "\n" + s[i:]
    OUT.write_text(s)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
