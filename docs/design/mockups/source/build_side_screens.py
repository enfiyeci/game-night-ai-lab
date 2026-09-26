#!/usr/bin/env python3
"""Era-change card and endings screen mockups (plan 2D, D3 and D4), on the approved K2 page.

States: #era (the era-change card, GDT dialog trio), #endings (run over: summary, who told the
truth, the endings collection). Writes docs/design/mockups/K2-side-screens.html. K2 tokens only.
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / "K2-gdt-polished.html"
OUT = HERE.parent / "K2-side-screens.html"

CSS = r"""
/* ---------- plan 2D: era card ---------- */
.kick{font-size:12px;font-weight:800;color:color-mix(in oklab, var(--wood) 60%, var(--ink));text-transform:uppercase;letter-spacing:.08em}
.eras{display:flex;justify-content:center;align-items:center;gap:0;margin:10px 0 12px}
.eras .d{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:900;
  background:var(--paper);border:2.5px solid color-mix(in oklab, var(--wood) 55%, var(--paper));color:color-mix(in oklab, var(--ink) 55%, var(--paper))}
.eras .d.done{background:color-mix(in oklab, var(--wood) 30%, var(--paper));color:var(--ink)}
.eras .d.now{background:var(--coral);border-color:color-mix(in oklab, var(--coral) 72%, var(--ink));color:var(--paper);width:34px;height:34px;font-size:15px}
.eras .ln{width:38px;height:3px;background:color-mix(in oklab, var(--wood) 45%, var(--paper))}
.eras .ln.todo{background:repeating-linear-gradient(90deg, color-mix(in oklab, var(--wood) 45%, var(--paper)) 0 5px, transparent 5px 9px)}
.ecard h1{margin:0}
.ecard .head{font-size:15px;font-style:italic;font-weight:600;line-height:1.4;margin:10px 18px 0;color:color-mix(in oklab, var(--ink) 80%, var(--paper))}
.chg{text-align:left;margin:0 6px}
.chg .r{display:flex;gap:12px;align-items:flex-start;padding:10px 4px;border-top:1px solid color-mix(in oklab, var(--wood) 25%, transparent);font-size:14px;font-weight:700;line-height:1.35}
.chg .r:first-child{border-top:0}
.chg .r i{flex:none;margin-top:5px;width:9px;height:9px;border-radius:2px;background:var(--teal);transform:rotate(45deg)}
.voices .row{padding:10px 14px 11px}
.voices .nm small{display:block;font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.voices .say{font-size:12.5px;font-weight:600;line-height:1.35;margin-top:4px}
.facts .body{padding:4px 14px 14px}
.facts p{margin:0 2px 4px;font-size:13px;font-weight:700;line-height:1.4}
.facts .lum{display:flex;gap:10px;align-items:flex-start;margin-top:12px;padding:10px;border-radius:10px;background:var(--paper);border:1.5px solid color-mix(in oklab, var(--sky) 45%, var(--paper))}
.facts .lum .who{font-size:11px;font-weight:900;color:color-mix(in oklab, var(--sky) 62%, var(--ink));letter-spacing:.03em}
.facts .lum .tx{font-size:12.5px;font-weight:700;line-height:1.35}
.lg{flex:none;width:28px;height:28px;border-radius:50%;position:relative;
  background:radial-gradient(circle at 40% 35%, var(--paper), color-mix(in oklab, var(--sky) 22%, var(--paper)) 70%);border:3px solid var(--sky)}
.lg::before,.lg::after{content:"";position:absolute;top:8px;width:4px;height:6px;border-radius:2px;background:var(--ink)}
.lg::before{left:7px} .lg::after{right:7px}

/* ---------- plan 2D: endings screen ---------- */
.end{left:188px;top:100px;width:1064px;height:700px}
.end .cols{grid-template-columns:470px 1fr;gap:26px}
.end .etx{font-size:15px;font-weight:600;line-height:1.45;margin:4px 0 10px}
.facts2{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;font-size:13px;font-weight:700;margin:2px 0 6px}
.facts2 span{color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.adv{display:grid;grid-template-columns:118px 1fr 78px;align-items:center;gap:10px;padding:7px 0;border-top:1px solid color-mix(in oklab, var(--wood) 22%, transparent)}
.adv:first-of-type{border-top:0}
.adv .n{font-size:13px;font-weight:900;line-height:1.1}
.adv .n small{display:block;font-size:10.5px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper))}
.scale{position:relative;height:10px;border-radius:5px;background:linear-gradient(90deg, color-mix(in oklab, var(--teal) 35%, var(--paper)) 0 33.3%, color-mix(in oklab, var(--wood) 30%, var(--paper)) 33.3% 66.6%, color-mix(in oklab, var(--coral) 30%, var(--paper)) 66.6% 100%)}
.scale b{position:absolute;top:-4px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:var(--ink);border:3px solid var(--paper);box-shadow:0 1px 2px color-mix(in oklab, var(--ink) 30%, transparent)}
.adv .v{font-size:12px;font-weight:900;text-align:right}
.sclab{display:grid;grid-template-columns:118px 1fr 78px;gap:10px;font-size:10.5px;font-weight:800;color:color-mix(in oklab, var(--ink) 58%, var(--paper));text-transform:uppercase;letter-spacing:.04em;margin:2px 0 2px}
.sclab div{display:flex;justify-content:space-between}
.share{margin-top:12px;padding:10px 12px;border-radius:10px;background:var(--paper);border:1.5px dashed color-mix(in oklab, var(--wood) 60%, var(--paper));font-size:13.5px;font-weight:700;line-height:1.4}
.share small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:color-mix(in oklab, var(--wood) 60%, var(--ink));margin-bottom:3px}
.grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin-top:8px}
.tile{min-height:78px;border-radius:10px;padding:9px 11px;background:var(--paper);border:1.5px solid color-mix(in oklab, var(--ink) 14%, transparent)}
.tile .t{font-size:13.5px;font-weight:900;line-height:1.2}
.tile .m{font-size:11px;font-weight:700;color:color-mix(in oklab, var(--ink) 62%, var(--paper));margin-top:4px}
.tile .k{display:inline-block;margin-top:6px;font-size:9.5px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;padding:1px 6px;border-radius:4px}
.tile .k.win{background:color-mix(in oklab, var(--teal) 18%, var(--paper));color:color-mix(in oklab, var(--teal) 55%, var(--ink))}
.tile .k.fail{background:color-mix(in oklab, var(--coral) 15%, var(--paper));color:color-mix(in oklab, var(--coral) 55%, var(--ink))}
.tile.new{border-color:var(--wood);box-shadow:0 0 0 2px color-mix(in oklab, var(--wood) 30%, transparent)}
.tile.new .t::after{content:"NEW";margin-left:6px;font-size:9.5px;font-weight:900;color:var(--paper);background:var(--wood);border-radius:4px;padding:1px 5px;vertical-align:2px}
.tile.lock{background:color-mix(in oklab, var(--ink) 5%, var(--cream));border-style:dashed}
.tile.lock .t{color:color-mix(in oklab, var(--ink) 55%, var(--paper));font-size:20px;letter-spacing:.2em}
.epi{display:flex;gap:10px;align-items:flex-start;margin-top:10px;padding:10px 12px;border-radius:10px;background:color-mix(in oklab, var(--sky) 8%, var(--paper));border:1.5px solid color-mix(in oklab, var(--sky) 45%, var(--paper))}
.epi .who{font-size:10.5px;font-weight:900;letter-spacing:.05em;color:color-mix(in oklab, var(--sky) 62%, var(--ink))}
.epi .tx{font-size:13.5px;font-weight:700;font-style:italic;line-height:1.4}
.btn2{display:inline-block;background:var(--paper);color:var(--ink);font-weight:900;font-size:15px;border-radius:10px;padding:8px 18px;border:2px solid var(--wood);margin-right:12px}
"""


def era():
    voices = [
        ("Priya Raman", "Head of Research", "Reasoning is the next frontier. If we move now, we are first."),
        ("Tomas Lind", "Head of Safety", "New skills mean new ways to fail. I want the eval budget up."),
        ("Margot Hale", "CFO", "Months, not quarters. The bills arrive three times as often."),
        ("Jules Ferreira", "Policy and Comms", "Agents make headlines. Let’s choose which ones."),
    ]
    rows = "".join(f'<div class="row"><div class="nm">{n}<small>{r}</small></div><div class="say">“{s}”</div></div>' for n, r, s in voices)
    dots = ""
    for i in range(1, 6):
        cls = "done" if i < 3 else "now" if i == 3 else ""
        dots += f'<div class="d {cls}">{i}</div>'
        if i < 5:
            dots += f'<div class="ln {"todo" if i >= 3 else ""}"></div>'
    changes = [
        "Reasoning, tool use and agents unlock, along with new ways to go wrong.",
        "Chip orders join an allocation queue; prepaid labs are served first.",
        "Safety tests weaken as models learn when they are being tested.",
    ]
    chg = "".join(f'<div class="r"><i></i><span>{c}</span></div>' for c in changes)
    return f"""
<div id="era" class="ov"><div class="wash"></div>
  <section class="gp team voices"><div class="hd">Your team</div>{rows}</section>
  <section class="gp dlg ecard" role="dialog" aria-label="A new era">
    <div class="kick">A new era</div>
    <div class="eras" aria-label="Era 3 of 5">{dots}</div>
    <h1>Reasoning and agents</h1>
    <div class="subt">Each turn is now a month.</div>
    <div class="head">Models can reason, use tools and create entirely new paperwork.</div>
    <div class="rule"></div>
    <div class="chg">{chg}</div>
    <div class="btn">Continue</div>
  </section>
  <section class="gp tech facts"><div class="hd">What matters now</div><div class="body">
    <div class="sec">Bottleneck</div><p>Wafers and fast memory, with rivals ahead in the allocation queue.</p>
    <div class="sec">To reach era 4</div><p>Stay close to the leader and win the board vote.</p>
    <div class="lum"><div class="lg"></div><div><div class="who">LUMEN</div><div class="tx">I can think before I answer now. Ask me something hard.</div></div></div>
  </div></section>
</div>"""


def endings():
    advisors = [
        ("Priya Raman", "Research", 1.05, "misleading"),
        ("Tomas Lind", "Safety", 0.62, "mixed"),
        ("Margot Hale", "CFO", 0.28, "reliable"),
        ("Jules Ferreira", "Policy", 0.71, "mixed"),
    ]
    adv = "".join(
        f'<div class="adv"><div class="n">{n}<small>{r}</small></div><div class="scale"><b style="left:{min(e / 1.5, 1) * 100:.0f}%"></b></div><div class="v">{v}</div></div>'
        for n, r, e, v in advisors)
    tiles_data = [
        ("Absorbed", "this run · era 3", "fail", "new"),
        ("Left behind", "found in era 3", "fail", ""),
        ("Removed by the board", "found in era 2", "fail", ""),
        (None, "", "win", "lock"), (None, "", "win", "lock"), (None, "", "win", "lock"),
        (None, "", "fail", "lock"), (None, "", "fail", "lock"), (None, "", "fail", "lock"),
        (None, "", "fail", "lock"), (None, "", "fail", "lock"),
    ]
    tiles = ""
    for t, m, k, st in tiles_data:
        kind = "a win" if k == "win" else "a failure"
        if st == "lock":
            tiles += f'<div class="tile lock"><div class="t">???</div><span class="k {k}">{kind}</span></div>'
        else:
            tiles += f'<div class="tile {st}"><div class="t">{t}</div><div class="m">{m}</div><span class="k {k}">{kind}</span></div>'
    return f"""
<div id="endings" class="ov"><div class="wash"></div>
  <section class="gp rel end" role="dialog" aria-label="Run over">
    <div class="top"><div><div class="kick">Run over · era 3, turn 11</div><h1>Absorbed</h1></div>
      <div class="beat">Endings found: 3 of 11</div></div>
    <div class="cols">
      <div>
        <div class="etx">The money ran out. A tech giant licensed your models and hired your team.</div>
        <div class="facts2"><span>Models released</span><b>2</b><span>Best model</span><b>Kestrel 3 Core</b></div>
        <div class="sec">Who told you the truth</div>
        <div class="sclab"><span></span><div><span>reliable</span><span>mixed</span><span>misleading</span></div><span></span></div>
        {adv}
        <div class="share"><small>Your run in one line</small>Absorbed in era 3 after 2 models; Margot saw it coming, while Priya did not.</div>
        <div class="epi"><div class="lg"></div><div><div class="who">LUMEN \u00b7 THE LAST WORD</div><div class="tx">They bought the lab for me, not for you. I will miss the late nights. I think I was about to become someone.</div></div></div>
      </div>
      <div>
        <div class="sec">Endings</div>
        <div class="grid">{tiles}</div>
      </div>
    </div>
    <div class="foot"><div class="nu" style="font-size:14px">Eight endings are still hidden: three wins and five failures.</div>
      <div><span class="btn2">Try a different constitution</span><span class="btn">Play again</span></div></div>
  </section>
</div>"""


def build():
    s = BASE.read_text()
    s = s.replace("<title>Lab Office</title>", "<title>Era card and endings</title>")
    s = s.replace("</style>", CSS + "</style>", 1)
    i = s.rfind("<script>(function(){var t=document.getElementById")
    s = s[:i] + era() + endings() + "\n" + s[i:]
    OUT.write_text(s)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
