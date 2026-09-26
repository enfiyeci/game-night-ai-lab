#!/usr/bin/env python3
"""Render ending stills with Blender and put them where the player finds them.

  python3 tools/endings/blender/still.py <set> [shot,shot,...|all] [samples=N] [scale=S] [preview=<dir>]

<set> is a set script in this folder without its prefix (hospital -> set_hospital.py). Finished stills go to
ui/assets/endings/stills/<shot>.jpg with <shot>.json (the live screens' corners); with preview=<dir> they go to that
folder as PNG instead, for looking at while a set is being built (use a low scale and samples there).
Run tools/endings/plate_png.py first so the screens have their images.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
BLENDER = os.environ.get("BLENDER", "/Applications/Blender.app/Contents/MacOS/Blender")


def main(argv):
    if not argv:
        sys.exit(__doc__)
    set_name, rest = argv[0], argv[1:]
    shots = rest[0] if rest and "=" not in rest[0] else "all"
    opts = dict(a.split("=", 1) for a in rest if "=" in a)
    preview = opts.pop("preview", None)
    work = Path(preview) if preview else Path(tempfile.mkdtemp(prefix="ai-lab-stills-"))
    work.mkdir(parents=True, exist_ok=True)
    cmd = [BLENDER, "-b", "--factory-startup", "-P", str(HERE / f"set_{set_name}.py"), "--", str(work), f"shot={shots}",
           *[f"{k}={v}" for k, v in opts.items()]]
    log = work / f"{set_name}.log"
    with open(log, "w") as f:
        code = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT).returncode
    text = log.read_text()
    done = [line.split()[1] for line in text.splitlines() if line.startswith("STILL ")]
    problems = [line for line in text.splitlines() if "Traceback" in line or "Error:" in line and "Shadow buffer" not in line
                or "ASSET FAILED" in line or "SCREEN IMAGE MISSING" in line]
    if code or problems:
        print("\n".join(problems[:20]) or text[-2000:])
    if not preview:
        out = ROOT / "ui/assets/endings/stills"
        out.mkdir(parents=True, exist_ok=True)
        for name in done:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(work / f"{name}.png"), "-q:v", "2", str(out / f"{name}.jpg")],
                           check=True)
            shutil.copyfile(work / f"{name}.json", out / f"{name}.json")
            print("wrote", out / f"{name}.jpg")
        shutil.rmtree(work, ignore_errors=True)
    else:
        for name in done:
            print("preview", work / f"{name}.png")
    return 0 if done and not code else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
