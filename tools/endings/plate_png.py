#!/usr/bin/env python3
"""Screen images for the Blender stills: each plate (ui/assets/endings/plates/<plate>.svg) in its finished state, as a
2560 x 1440 PNG in tools/endings/screens/ (not committed; regenerate with this script before rendering a set).

  python3 tools/endings/plate_png.py [plate[:film] ...]   (no arguments: every plate; :film fills in that film's
                                                            example deal; pd-* plates use pacingDeal by default)
"""
import http.server
import socketserver
import subprocess
import sys
import tempfile
import threading
import time
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "tools/endings/screens"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def main(specs):
    OUT.mkdir(parents=True, exist_ok=True)
    if not specs:
        specs = sorted(p.stem for p in (ROOT / "ui/assets/endings/plates").glob("*.svg"))
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    handler = partial(Quiet, directory=str(ROOT))
    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler) as httpd, tempfile.TemporaryDirectory() as profile:
        port = httpd.server_address[1]
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        for spec in specs:
            plate, _, film = spec.partition(":")
            if not film and plate.startswith("pd-"):
                film = "pacingDeal"
            url = f"http://127.0.0.1:{port}/tools/endings/plate_frame.html?plate={plate}" + (f"&film={film}" if film else "")
            out = OUT / f"{plate}.png"
            out.unlink(missing_ok=True)
            # Chrome sometimes stays open after writing the screenshot, so wait for the file, then close it
            proc = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                                     f"--user-data-dir={profile}", "--force-device-scale-factor=2", "--window-size=1280,720",
                                     "--virtual-time-budget=4000", f"--screenshot={out}", url],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            for _ in range(150):
                if (out.exists() and out.stat().st_size > 0) or proc.poll() is not None:
                    break
                time.sleep(0.2)
            time.sleep(0.3)
            proc.kill()
            proc.wait()
            print(out if out.exists() else f"FAILED {plate}")
        httpd.shutdown()


if __name__ == "__main__":
    main(sys.argv[1:])
