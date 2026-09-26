#!/bin/sh
# Screenshot an ending film at given times: tools/endings/shoot.sh <film-id> <era> <t> [t ...]
# Writes shots/film-<id>-<t>.png (1280 x 720) from ui/endings/preview.html, served from the repo root.
set -eu
[ "$#" -ge 3 ] || { echo "usage: tools/endings/shoot.sh <film-id> <era> <t> [t ...]" >&2; exit 2; }
ID=$1; ERA=$2; shift 2
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')
PROFILE=$(mktemp -d "${TMPDIR:-/tmp}/ai-lab-film.XXXXXX")
cleanup() { [ -n "${SERVER_PID-}" ] && kill "$SERVER_PID" 2>/dev/null || true; rm -rf "$PROFILE"; }
trap cleanup EXIT INT TERM
mkdir -p "$ROOT/shots"
cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >"$PROFILE/server.log" 2>&1 &
SERVER_PID=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do
  python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:$PORT/index.html', timeout=.5)" >/dev/null 2>&1 && break
  sleep .1
done
for T in "$@"; do
  OUT="$ROOT/shots/film-$ID-$T.png"
  rm -f "$OUT"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$PROFILE/$T" \
    --virtual-time-budget=3000 --window-size=1280,720 --screenshot="$OUT" \
    "http://127.0.0.1:$PORT/ui/endings/preview.html?id=$ID&era=$ERA&t=$T" >/dev/null 2>&1 &
  PID=$!
  for _ in $(seq 1 100); do { [ -s "$OUT" ] || ! kill -0 "$PID" 2>/dev/null; } && break; sleep .2; done
  sleep .3; kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true
  [ -s "$OUT" ] && echo "$OUT" || echo "no screenshot: $OUT" >&2
done
