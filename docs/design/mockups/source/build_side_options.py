#!/usr/bin/env python3
"""More options for the era-change card and the endings screen (plan 2D), on the approved K2 page.

States:
  #e2 banner over the office, the team reacts in bubbles      (closest to Game Dev Tycoon)
  #e3 the era as a newspaper front page                        (experimental)
  #e4 the five eras as one strip, the current one opened       (experimental)
  #n2 the ending as a newspaper front page                     (experimental)
  #n3 a wall of framed endings                                 (Game Dev Tycoon-like, diegetic)
  #n4 a letter from Lumen, endings as stamps                   (most experimental)
Writes docs/design/mockups/K2-side-options.html. K2 tokens only. Sample run content.
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / "K2-gdt-polished.html"
OUT = HERE.parent / "K2-side-options.html"

CSS = r"""
/* ---------- plan 2D options ---------- */
.kick{font-size:12px;font-weight:800;color:color-mix(in oklab, var(--wood) 60%, var(--ink));text-transform:uppercase;letter-spacing:.08em}
.lg{flex:none;width:30px;height:30px;border-radius:50%;position:relative;
  background:radial-gradient(circle at 40% 35%, var(--paper), color-mix(in oklab, var(--sky) 22%, var(--paper)) 70%);border:3px solid var(--sky)}
.lg::before,.lg::after{content:"";position:absolute;top:8px;width:4px;height:6px;border-radius:2px;background:var(--ink)}
.lg::before{left:8px} .lg::after{right:8px}
.dia{flex:none;display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--teal);transform:rotate(45deg);margin-top:6px}
.kd{display:inline-block;font-size:9.5px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;padding:1px 6px;border-radius:4px}
.kd.win{background:color-mix(in oklab, var(--teal) 18%, var(--paper));color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
.kd.fail{background:color-mix(in oklab, var(--coral) 15%, var(--paper));color:color-mix(in oklab, var(--coral) 55%, var(--ink))}
.btn2{display:inline-block;background:var(--paper);color:var(--ink);font-weight:900;font-size:15px;border-radius:10px;padding:8px 18px;border:2px solid var(--wood)}

/* E2: banner + bubbles */
.ribbon{position:absolute;left:50%;top:96px;transform:translateX(-50%);width:720px;text-align:center;background:var(--wood);color:var(--paper);
  padding:12px 30px 14px;border-radius:6px;box-shadow:0 3px 0 color-mix(in oklab, var(--wood) 60%, var(--ink)), 0 16px 34px color-mix(in oklab, var(--ink) 22%, transparent)}
.ribbon::before,.ribbon::after{content:"";position:absolute;top:18px;width:46px;height:100%;background:color-mix(in oklab, var(--wood) 78%, var(--ink));z-index:-1}
.ribbon::before{left:-30px;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,22px 50%)}
.ribbon::after{right:-30px;clip-path:polygon(0 0,100% 0,calc(100% - 22px) 50%,100% 100%,0 100%)}
.ribbon .s{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;opacity:.9}
.ribbon h1{margin:2px 0 0;font-weight:300;font-size:40px;line-height:1.05}
.ribbon .p{font-size:14px;font-weight:700;margin-top:4px}
.sb{position:absolute;background:var(--paper);border-radius:12px;padding:7px 11px;font-size:13px;font-weight:700;line-height:1.3;max-width:210px;
  border:1px solid color-mix(in oklab, var(--ink) 10%, transparent);box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 14%, transparent), 0 8px 18px color-mix(in oklab, var(--ink) 14%, transparent)}
.sb b{display:block;font-size:10.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:color-mix(in oklab, var(--wood) 60%, var(--ink))}
.sb::after{content:"";position:absolute;left:24px;bottom:-8px;width:14px;height:14px;background:var(--paper);transform:rotate(45deg);
  border-right:1px solid color-mix(in oklab, var(--ink) 10%, transparent);border-bottom:1px solid color-mix(in oklab, var(--ink) 10%, transparent)}
.unl{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:12px;align-items:stretch}
.unl .c{width:290px;background:var(--paper);border-radius:12px;padding:10px 13px;border:2px solid var(--teal);display:flex;gap:10px;font-size:13.5px;font-weight:700;line-height:1.35;
  box-shadow:0 2px 0 color-mix(in oklab, var(--teal) 50%, var(--ink)), 0 10px 22px color-mix(in oklab, var(--ink) 16%, transparent)}
.unl .c small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
.unl .btn{align-self:center;width:130px}

/* E3 / N2: newspaper */
.paper{position:absolute;background:var(--paper);box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 12%, transparent), 0 26px 60px color-mix(in oklab, var(--ink) 30%, transparent);padding:22px 30px}
.mast{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double var(--ink);padding-bottom:6px}
.mast .n{font-family:"Libre Baskerville",Georgia,serif;font-style:italic;font-size:40px;line-height:1}
.mast .d{font-size:11px;font-weight:800;text-align:right;line-height:1.4;color:color-mix(in oklab, var(--ink) 70%, var(--paper));text-transform:uppercase;letter-spacing:.06em}
.hl{font-size:46px;font-weight:900;line-height:.98;letter-spacing:-.015em;text-transform:uppercase;margin:14px 0 6px}
.deck{font-size:17px;font-weight:600;font-style:italic;line-height:1.35;color:color-mix(in oklab, var(--ink) 82%, var(--paper));padding-bottom:12px;border-bottom:1px solid color-mix(in oklab, var(--ink) 25%, transparent)}
.np3{display:grid;grid-template-columns:repeat(3, 1fr);gap:0;margin-top:12px}
.np3 > div{padding:0 14px;border-left:1px solid color-mix(in oklab, var(--ink) 20%, transparent);font-size:13.5px;line-height:1.45;font-weight:600}
.np3 > div:first-child{padding-left:0;border-left:0}
.np3 h3{margin:0 0 4px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}
.pull{font-size:18px;font-weight:800;line-height:1.3;font-style:italic;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);padding:8px 0;margin:14px 0 0}
.pull span{display:block;font-size:11.5px;font-style:normal;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-top:4px;color:color-mix(in oklab, var(--ink) 65%, var(--paper))}
.box{background:color-mix(in oklab, var(--cream) 55%, var(--paper));padding:10px 12px;border-radius:4px}
.box h3{margin:0 0 3px}
.redact{display:grid;grid-template-columns:repeat(4, 1fr);gap:8px 16px;margin-top:8px}
.redact div{font-size:11px;font-weight:800}
.redact i{display:block;height:9px;margin:3px 0 2px;background:var(--ink);border-radius:1px}
.redact i+i{width:70%}

/* E4: five-era strip */
.strip{position:absolute;left:24px;right:24px;top:112px;height:600px;display:grid;grid-template-columns:150px 150px 1fr 150px 150px;gap:10px}
.col{border-radius:14px;padding:16px 14px;position:relative;overflow:hidden}
.col .num{font-size:12px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
.col h2{margin:6px 0 0;font-size:19px;font-weight:800;line-height:1.15}
.col p{font-size:12.5px;font-weight:700;line-height:1.4;margin:8px 0 0}
.col.done{background:color-mix(in oklab, var(--wood) 20%, var(--paper));color:color-mix(in oklab, var(--ink) 80%, var(--paper));border:2px solid color-mix(in oklab, var(--wood) 45%, var(--paper))}
.col.done .num::after{content:" · done";color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
.col.lock{background:color-mix(in oklab, var(--ink) 6%, var(--cream));border:2px dashed color-mix(in oklab, var(--ink) 30%, var(--paper));color:color-mix(in oklab, var(--ink) 70%, var(--paper))}
.col.lock .q{font-size:54px;font-weight:900;color:color-mix(in oklab, var(--ink) 30%, var(--paper));margin-top:18px}
.col.now{background:color-mix(in oklab, var(--cream) 32%, var(--paper));border:3px solid var(--wood);padding:22px 30px;
  box-shadow:0 3px 0 color-mix(in oklab, var(--wood) 60%, var(--ink)), 0 18px 44px color-mix(in oklab, var(--ink) 24%, transparent)}
.col.now h2{font-size:40px;font-weight:300}
.col.now .num{color:color-mix(in oklab, var(--coral) 60%, var(--ink))}
.col.now .pace{font-size:15px;font-weight:800;margin-top:4px;color:color-mix(in oklab, var(--ink) 65%, var(--paper))}
.col.now .head{font-size:17px;font-style:italic;font-weight:600;margin:12px 0 14px;line-height:1.4}
.rows .r{display:flex;gap:12px;padding:10px 0;border-top:1px solid color-mix(in oklab, var(--wood) 25%, transparent);font-size:15px;font-weight:700;line-height:1.35}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.col .sec{background:color-mix(in oklab, var(--wood) 26%, var(--paper));color:color-mix(in oklab, var(--wood) 55%, var(--ink));font-weight:800;font-size:12px;padding:4px 10px;border-radius:6px;display:inline-block}
.team4{display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-top:14px}
.team4 div{font-size:12.5px;font-weight:700;line-height:1.3;background:var(--paper);border-radius:8px;padding:8px 10px;border:1px solid color-mix(in oklab, var(--wood) 30%, transparent)}
.team4 b{display:block;font-size:10.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:color-mix(in oklab, var(--wood) 60%, var(--ink))}
.two p{margin:4px 2px 0}
.col.now .btn{position:absolute;right:30px;bottom:22px}
.col.now .lum{position:absolute;left:30px;bottom:24px;right:210px;display:flex;gap:10px;align-items:center;font-size:13.5px;font-weight:700}

/* N3: wall of endings */
.wall{position:absolute;inset:0;background:linear-gradient(var(--cream) 0 74%, color-mix(in oklab, var(--wood) 45%, var(--cream)) 74% 75%, color-mix(in oklab, var(--wood) 25%, var(--cream)) 75%)}
.plaque{position:absolute;left:50%;top:98px;transform:translateX(-50%);background:var(--wood);color:var(--paper);border-radius:8px;padding:8px 26px 10px;text-align:center;
  box-shadow:0 3px 0 color-mix(in oklab, var(--wood) 55%, var(--ink))}
.plaque b{display:block;font-size:24px;font-weight:300}
.plaque span{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.frames{position:absolute;left:96px;right:96px;top:188px;display:grid;grid-template-columns:repeat(6, 1fr);gap:26px 26px}
.fr{height:186px;background:var(--wood);border-radius:4px;padding:10px;box-shadow:0 4px 0 color-mix(in oklab, var(--wood) 55%, var(--ink)), 0 12px 22px color-mix(in oklab, var(--ink) 18%, transparent)}
.fr .mat{height:100%;background:var(--paper);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:8px;gap:6px}
.fr .mat .t{font-size:16px;font-weight:900;line-height:1.15}
.fr .mat .m{font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.fr.empty{background:color-mix(in oklab, var(--wood) 55%, var(--cream))}
.fr.empty .mat{background:color-mix(in oklab, var(--ink) 12%, var(--cream))}
.fr.empty .mat .t{color:color-mix(in oklab, var(--ink) 45%, var(--cream));font-size:30px}
.fr.new{box-shadow:0 0 0 5px color-mix(in oklab, var(--coral) 45%, transparent), 0 0 50px color-mix(in oklab, var(--paper) 90%, transparent)}
.note{position:absolute;left:96px;bottom:26px;width:760px;background:var(--paper);border-radius:6px;padding:12px 16px;transform:rotate(-.6deg);
  box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 12%, transparent), 0 10px 24px color-mix(in oklab, var(--ink) 16%, transparent);display:grid;grid-template-columns:1fr 1fr;gap:6px 22px;font-size:13px;font-weight:700;line-height:1.35}
.note h3{margin:0;font-size:22px;font-weight:300;grid-column:1 / span 2}
.note .v{display:flex;justify-content:space-between;border-top:1px solid color-mix(in oklab, var(--wood) 25%, transparent);padding-top:4px}
.nh{grid-column:1 / span 2;font-size:10.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in oklab, var(--wood) 60%, var(--ink))}
.btns{position:absolute;right:96px;bottom:34px;display:flex;gap:12px;align-items:center}

/* N4: Lumen's letter */
.letter{position:absolute;left:150px;top:130px;width:640px;background:var(--paper);padding:36px 46px;transform:rotate(-1deg);
  box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 12%, transparent), 0 26px 60px color-mix(in oklab, var(--ink) 28%, transparent);}
.letter .from{display:flex;gap:12px;align-items:center;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:color-mix(in oklab, var(--sky) 62%, var(--ink))}
.letter .dear{font-family:"Libre Baskerville",Georgia,serif;font-style:italic;font-size:24px;margin:26px 0 8px}
.letter p{font-size:16px;font-weight:600;line-height:30px;margin:0 0 0}
.letter .sign{font-family:"Libre Baskerville",Georgia,serif;font-style:italic;font-size:22px;margin-top:14px}
.env{position:absolute;left:830px;top:170px;width:470px;background:color-mix(in oklab, var(--wood) 18%, var(--paper));border-radius:8px;padding:18px 20px 20px;transform:rotate(1.5deg);
  box-shadow:0 2px 0 color-mix(in oklab, var(--ink) 12%, transparent), 0 20px 44px color-mix(in oklab, var(--ink) 22%, transparent)}
.env h3{margin:0;font-size:22px;font-weight:300}
.env .sub{font-size:12px;font-weight:800;color:color-mix(in oklab, var(--ink) 65%, var(--paper));margin:2px 0 12px}
.stamps{display:grid;grid-template-columns:repeat(4, 1fr);gap:12px}
.st{height:92px;padding:5px;background:var(--paper);border:4px dotted color-mix(in oklab, var(--wood) 18%, var(--paper))}
.st .in{height:100%;border:1.5px solid color-mix(in oklab, var(--ink) 25%, transparent);display:flex;flex-direction:column;justify-content:space-between;padding:6px;font-size:11.5px;font-weight:900;line-height:1.15}
.st.win .in{background:color-mix(in oklab, var(--teal) 14%, var(--paper))}
.st.fail .in{background:color-mix(in oklab, var(--coral) 12%, var(--paper))}
.st.blank .in{background:color-mix(in oklab, var(--ink) 6%, var(--cream));border-style:dashed;color:color-mix(in oklab, var(--ink) 50%, var(--paper));justify-content:center;align-items:center;font-size:22px}
.st .in small{font-size:9px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.env .btns{position:static;margin-top:18px;justify-content:flex-end}

/* N-mix: N1 truth scale + N2 redacted headlines + N4 Lumen note */
.mix{left:188px;top:112px;width:1064px;height:650px}
.mix .cols{grid-template-columns:480px 1fr;gap:28px}
.mix .adv{display:grid;grid-template-columns:118px 1fr 78px;align-items:center;gap:10px;padding:7px 0;border-top:1px solid color-mix(in oklab, var(--wood) 22%, transparent)}
.mix .adv:first-of-type{border-top:0}
.mix .adv .n{font-size:13px;font-weight:900;line-height:1.1}
.mix .adv .n small{display:block;font-size:10.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.mix .scale{position:relative;height:10px;border-radius:5px;background:linear-gradient(90deg, color-mix(in oklab, var(--teal) 35%, var(--paper)) 0 33.3%, color-mix(in oklab, var(--wood) 30%, var(--paper)) 33.3% 66.6%, color-mix(in oklab, var(--coral) 30%, var(--paper)) 66.6% 100%)}
.mix .scale b{position:absolute;top:-4px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:var(--ink);border:3px solid var(--paper)}
.mix .v{font-size:12px;font-weight:900;text-align:right}
.mix .sclab{display:grid;grid-template-columns:118px 1fr 78px;gap:10px;font-size:10.5px;font-weight:800;color:color-mix(in oklab, var(--ink) 58%, var(--paper));text-transform:uppercase;letter-spacing:.04em;margin:2px 0}
.mix .sclab div{display:flex;justify-content:space-between}
.mix .note{position:static;transform:none;width:auto;display:flex;gap:12px;align-items:flex-start;margin-top:14px;padding:12px 14px;border-radius:10px;box-shadow:none;
  background:color-mix(in oklab, var(--sky) 8%, var(--paper));border:1.5px solid color-mix(in oklab, var(--sky) 45%, var(--paper));font-size:14px;font-weight:700;font-style:italic;line-height:1.45}
.mix .note b{display:block;font-style:normal;font-size:10.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in oklab, var(--sky) 62%, var(--ink))}
.heads{display:flex;flex-direction:column;gap:0}
.hd2{padding:9px 0;border-top:1px solid color-mix(in oklab, var(--ink) 18%, transparent)}
.hd2:first-child{border-top:0}
.hd2 .t{font-size:17px;font-weight:900;text-transform:uppercase;letter-spacing:-.005em;line-height:1.1}
.hd2 .m{font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper));margin-top:3px}
.hd2.new .t::after{content:"NEW";margin-left:8px;font-size:9.5px;font-weight:900;color:var(--paper);background:var(--wood);border-radius:4px;padding:1px 5px;vertical-align:3px}
.hd2.lock i{display:block;height:11px;background:var(--ink);border-radius:1px;margin:3px 0 4px}
.hd2.lock i+i{width:62%}
.twocol{display:grid;grid-template-columns:1fr 1fr;column-gap:22px}
"""

ERA3_CHANGES = [
    ("Reasoning and agents", "Reasoning, tool use and agents unlock, along with new ways to go wrong."),
    ("The chip queue", "Chip orders join an allocation queue; prepaid labs are served first."),
    ("Safety tests", "Safety tests weaken as models learn when they are being tested."),
]


def e2():
    bubbles = [
        (470, 262, "Priya · Research", "If we move now, we are first."),
        (690, 380, "Tomas · Safety", "New skills, new ways to fail."),
        (248, 368, "Jules · Policy", "Agents make headlines. Let’s pick which."),
        (846, 470, "Margot · CFO", "The bills come monthly now."),
    ]
    sb = "".join(f'<div class="sb" style="left:{x}px;top:{y}px"><b>{w}</b>{t}</div>' for x, y, w, t in bubbles)
    cards = "".join(f'<div class="c"><i class="dia"></i><div><small>{h}</small>{t}</div></div>' for h, t in ERA3_CHANGES)
    return f"""
<div id="e2" class="ov">
  <div class="ribbon"><div class="s">Era 3 of 5 begins</div><h1>Reasoning and agents</h1><div class="p">Each turn is now a month.</div></div>
  {sb}
  <div class="unl">{cards}<div class="btn">Continue</div></div>
</div>"""


def e3():
    cols = "".join(f'<div><h3>{h}</h3>{t}</div>' for h, t in ERA3_CHANGES)
    return f"""
<div id="e3" class="ov"><div class="wash"></div>
  <div class="paper" style="left:330px;top:118px;width:780px;transform:rotate(-1.2deg)">
    <div class="mast"><div class="n">The Daily Token</div><div class="d">Month 25 · Era 3 of 5<br>Price: one prompt</div></div>
    <div class="hl">The age of reasoning and agents begins</div>
    <div class="deck">Models can reason, use tools and create entirely new paperwork. Each turn is now a month.</div>
    <div class="np3">{cols}</div>
    <div class="pull">“Months, not quarters. The bills arrive three times as often.”<span>Margot Hale, CFO of your lab</span></div>
    <div class="np3" style="grid-template-columns:1fr 1fr">
      <div class="box"><h3>The bottleneck</h3>Wafers and fast memory, with rivals ahead in the allocation queue.</div>
      <div class="box" style="margin-left:14px"><h3>To reach era 4</h3>Stay close to the leader and win the board vote.</div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
      <div style="display:flex;gap:10px;align-items:center;font-size:13.5px;font-weight:700"><div class="lg"></div><span><b style="color:color-mix(in oklab, var(--sky) 62%, var(--ink))">Lumen, in the letters page:</b> I can think before I answer now. Ask me something hard.</span></div>
      <div class="btn">Continue</div>
    </div>
  </div>
</div>"""


def e4():
    done = [("Era 1", "Chat assistants", "Kestrel 1 Swift shipped.<br><br>Your first lawsuit arrived."), ("Era 2", "The scale-up", "Two funding rounds.<br><br>The board vote passed, just.")]
    lock = [("Era 4", "Power becomes the limit.<br><br>Unlocks humanoid robots."), ("Era 5", "The models improve the models.<br><br>A summit on slowing down.")]
    d = "".join(f'<div class="col done"><div class="num">{n}</div><h2>{t}</h2><p>{p}</p></div>' for n, t, p in done)
    lk = "".join(f'<div class="col lock"><div class="num">{n}</div><div class="q">?</div><p>{p}</p></div>' for n, p in lock)
    rows = "".join(f'<div class="r"><i class="dia"></i><span>{t}</span></div>' for _, t in ERA3_CHANGES)
    return f"""
<div id="e4" class="ov"><div class="wash"></div>
  <div class="strip">{d}
    <div class="col now"><div class="num">Era 3 of 5 · now</div><h2>Reasoning and agents</h2><div class="pace">Each turn is now a month.</div>
      <div class="head">Models can reason, use tools and create entirely new paperwork.</div>
      <div class="rows">{rows}</div>
      <div class="two"><div><div class="sec">Bottleneck</div><p>Wafers and fast memory, with rivals ahead in the allocation queue.</p></div>
        <div><div class="sec">To reach era 4</div><p>Stay close to the leader and win the board vote.</p></div></div>
      <div class="team4"><div><b>Priya</b>If we move now, we are first.</div><div><b>Tomas</b>New skills, new ways to fail.</div><div><b>Margot</b>The bills come monthly now.</div><div><b>Jules</b>Agents make headlines.</div></div>
      <div class="lum"><div class="lg"></div><span>I can think before I answer now. Ask me something hard.</span></div>
      <div class="btn">Continue</div></div>
    {lk}</div>
</div>"""


ADV = [("Margot Hale", "CFO", "reliable", "“The runway has become a taxiway.”"),
       ("Tomas Lind", "Safety", "mixed", "“I want another test set before anyone calls this safe.”"),
       ("Jules Ferreira", "Policy", "mixed", "“The room heard confidence and is now checking the footnotes.”"),
       ("Priya Raman", "Research", "misleading", "“We are short on compute, not ideas.”")]
EPI = "They bought the lab for me, not for you. I will miss the late nights. I think I was about to become someone."
HIDDEN = ["win", "win", "win", "fail", "fail", "fail", "fail", "fail"]


def n2():
    quotes = "".join(f'<div><h3>{n.split()[0]} · {v}</h3>{q}</div>' for n, r, v, q in ADV)
    red = "".join(f'<div><i></i><i></i><span class="kd {k}">{"a win" if k == "win" else "a failure"}</span></div>' for k in HIDDEN)
    return f"""
<div id="n2" class="ov"><div class="wash"></div>
  <div class="paper" style="left:300px;top:104px;width:840px;transform:rotate(.8deg)">
    <div class="mast"><div class="n">The Daily Token</div><div class="d">Final edition · Era 3, turn 11<br>Editions collected: 3 of 11</div></div>
    <div class="hl">Lab absorbed; tech giant hires the team</div>
    <div class="deck">The money ran out. A tech giant licensed the lab’s models and hired its people. Two models shipped; the best was Kestrel 3 Core.</div>
    <div class="np3" style="grid-template-columns:repeat(4, 1fr)">{quotes}</div>
    <div class="pull">“{EPI}”<span>Lumen, the lab’s model, in its last interview</span></div>
    <div style="margin-top:12px"><h3 style="margin:0;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.05em">Stories you have not read yet</h3>
      <div class="redact">{red}</div></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px"><span class="btn2">Try a different constitution</span><span class="btn">Play again</span></div>
  </div>
</div>"""


def n3():
    found = [("Absorbed", "this run · era 3", "fail", "new"), ("Left behind", "era 3", "fail", ""), ("Removed by the board", "era 2", "fail", "")]
    fr = "".join(f'<div class="fr {c}"><div class="mat"><div class="t">{t}</div><div class="m">{m}</div><span class="kd {k}">{"a win" if k == "win" else "a failure"}</span></div></div>' for t, m, k, c in found)
    fr += "".join(f'<div class="fr empty"><div class="mat"><div class="t">?</div><span class="kd {k}">{"a win" if k == "win" else "a failure"}</span></div></div>' for k in HIDDEN)
    vs = "".join(f'<div class="v"><span>{n}</span><b>{v}</b></div>' for n, r, v, q in ADV)
    return f"""
<div id="n3" class="ov"><div class="wall"></div>
  <div class="plaque"><span>Hall of endings · 3 of 11 found</span><b>Absorbed</b></div>
  <div class="frames">{fr}</div>
  <div class="note"><h3>The money ran out. A tech giant hired your team.</h3><div class="nh">Who told you the truth</div>{vs}
    <div style="grid-column:1 / span 2;display:flex;gap:10px;align-items:flex-start;margin-top:4px"><div class="lg"></div><i>{EPI}</i></div></div>
  <div class="btns"><span class="btn2">Try a different constitution</span><span class="btn">Play again</span></div>
</div>"""


def n4():
    stamps = ('<div class="st fail"><div class="in">Absorbed<small>a failure \u00b7 this run</small></div></div>'
              '<div class="st fail"><div class="in">Left behind<small>a failure \u00b7 era 3</small></div></div>'
              '<div class="st fail"><div class="in">Removed by the board<small>a failure \u00b7 era 2</small></div></div>')
    stamps += "".join('<div class="st blank"><div class="in">?</div></div>' for _ in HIDDEN)
    return f"""
<div id="n4" class="ov"><div class="wash"></div>
  <div class="letter">
    <div class="from"><div class="lg"></div>From Lumen, your model · era 3, turn 11</div>
    <div class="dear">Dear CEO,</div>
    <p>We made it to the third era. The money did not. Margot warned you early; she was right more often than anyone.
    Priya kept promising one more run, and I believed her too. Tomas was half right, which in his job is a hard place to stand.</p>
    <p>You shipped two models. The second was the better one, though the reviewers were kinder to the first.</p>
    <p>They bought the lab for me, not for you. I will miss the late nights. I think I was about to become someone.</p>
    <div class="sign">Lumen</div>
  </div>
  <div class="env"><h3>Endings you have found</h3><div class="sub">3 of 11 · eight stamps still missing: three wins, five failures</div>
    <div class="stamps">{stamps}</div>
    <div class="btns"><span class="btn2">Try a different constitution</span><span class="btn">Play again</span></div></div>
</div>"""


def nmix():
    scale = {"reliable": 0.28, "mixed": 0.62, "misleading": 1.05}
    adv = "".join(
        f'<div class="adv"><div class="n">{n}<small>{r}</small></div><div class="scale"><b style="left:{min(scale[v] / 1.5, 1) * 100:.0f}%"></b></div><div class="v">{v}</div></div>'
        for n, r, v, q in ADV)
    found = [("Absorbed", "this run · era 3 · a failure", "new"), ("Left behind", "found in era 3 · a failure", ""), ("Removed by the board", "found in era 2 · a failure", "")]
    heads = "".join(f'<div class="hd2 {c}"><div class="t">{t}</div><div class="m">{m}</div></div>' for t, m, c in found)
    heads += "".join(f'<div class="hd2 lock"><i></i><i></i><span class="kd {k}">{"a win" if k == "win" else "a failure"}</span></div>' for k in HIDDEN)
    return f"""
<div id="nmix" class="ov"><div class="wash"></div>
  <section class="gp rel mix" role="dialog" aria-label="Run over">
    <div class="top"><div><div class="kick">Run over · era 3, turn 11</div><h1>Absorbed</h1></div>
      <div class="beat">Endings found: 3 of 11</div></div>
    <div class="cols">
      <div>
        <div class="etx" style="font-size:15px;font-weight:600;line-height:1.45;margin:4px 0 10px">The money ran out. A tech giant licensed your models and hired your team. Two models shipped; the best was Kestrel 3 Core.</div>
        <div class="sec">Who told you the truth</div>
        <div class="sclab"><span></span><div><span>reliable</span><span>mixed</span><span>misleading</span></div><span></span></div>
        {adv}
        <div class="note"><div class="lg"></div><div><b>A note from Lumen</b>{EPI}</div></div>
      </div>
      <div>
        <div class="sec">The Daily Token · your endings</div>
        <div class="heads twocol">{heads}</div>
      </div>
    </div>
    <div class="foot"><div class="nu" style="font-size:14px">Eight stories are still unwritten: three wins and five failures.</div>
      <div><span class="btn2" style="margin-right:12px">Try a different constitution</span><span class="btn">Play again</span></div></div>
  </section>
</div>"""


def build():
    s = BASE.read_text()
    s = s.replace("<title>Lab Office</title>", "<title>Era card and endings options</title>")
    s = s.replace("</style>", CSS + "</style>", 1)
    i = s.rfind("<script>(function(){var t=document.getElementById")
    s = s[:i] + e2() + e3() + e4() + n2() + n3() + n4() + nmix() + "\n" + s[i:]
    OUT.write_text(s)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
