"""Switch a film's plate and video shots to Blender stills (owner's pick B, 2026-09-26).

  python3 tools/endings/film_stills.py <film-id> <spec.json>

Run after the stills are rendered (tools/endings/blender/still.py): a screen's centre comes from its still's json.

spec: {"shots": {"<index>": {"image"|"frames", "screens": [[at, plate]], "push": s, "focus": "screen"|[x, y]}},
       "title": {"still": name, "from": s, "to": s}}
A shot's camera pushes from s=1 to `push` toward its first screen's centre (or `focus`).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def centre(still, at):
    meta = json.loads((ROOT / f"ui/assets/endings/stills/{still}.json").read_text())
    quad = meta["screens"][at]["quad"]
    k = 1920 / meta["w"]
    return [round(sum(p[0] for p in quad) / 4 * k), round(sum(p[1] for p in quad) / 4 * k)]


def main(fid, spec_path):
    path = ROOT / f"ui/endings/films/{fid}.json"
    film = json.loads(path.read_text())
    spec = json.loads(Path(spec_path).read_text())
    for key, s in spec["shots"].items():
        shot = film["shots"][int(key)]
        for k in ("plate", "clip", "image", "frames", "screens"):   # a re-run replaces the shot, never mixes with it
            shot.pop(k, None)
        shot["kind"] = "still"
        if "frames" in s:
            shot["frames"] = s["frames"]
            first = s["frames"][0]["image"]
        else:
            shot["image"] = s["image"]
            first = s["image"]
        if s.get("screens"):
            shot["screens"] = [{"at": at, "plate": plate} for at, plate in s["screens"]]
        focus = s.get("focus", "screen")
        if focus == "screen":
            x, y = centre(first, s["screens"][0][0])
        else:
            x, y = focus
        shot["cam"] = {"from": {"s": 1.0}, "to": {"x": x, "y": y, "s": s.get("push", 1.06)}}
        # keep the keys in a readable order
        order = ["kind", "image", "frames", "screens", "dur", "cut", "card", "cam", "byDeal", "sfx"]
        film["shots"][int(key)] = {k: shot[k] for k in order if k in shot} | {k: v for k, v in shot.items() if k not in order}
    if "title" in spec:
        t = spec["title"]
        film.pop("titleClip", None)
        film["titleStill"] = t["still"]
        at = {"x": t["x"], "y": t["y"]} if "x" in t else {}   # the title card continues the last shot's framing
        film["titleCam"] = {"from": {"s": t.get("from", 1.0), **at}, "to": {"s": t.get("to", 1.04), **at}}
    text = json.dumps(film, indent=2, ensure_ascii=False) + "\n"
    path.write_text(text)
    print("wrote", path)


if __name__ == "__main__":
    main(*sys.argv[1:])
