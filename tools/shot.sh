#!/bin/sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "usage: tools/shot.sh <scenario> [hash]" >&2
  exit 2
fi

SCENARIO=$1
HASH=${2-}
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')
PROFILE=$(mktemp -d "${TMPDIR:-/tmp}/ai-lab-shot.XXXXXX")
SERVER_LOG="$PROFILE/server.log"

cleanup() {
  if [ -n "${SERVER_PID-}" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
  rm -rf "$PROFILE"
}
trap cleanup EXIT INT TERM

mkdir -p "$ROOT/shots"
cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

READY=0
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:$PORT/index.html', timeout=.5)" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep .1
done
if [ "$READY" -ne 1 ]; then
  cat "$SERVER_LOG" >&2
  exit 1
fi

URL="http://127.0.0.1:$PORT/index.html?scenario=$SCENARIO&seed=1$HASH"
# One fresh profile per capture. Headless Chrome writes the small capture and then does not always exit,
# so wait for the file to appear and close Chrome ourselves.
shoot() {
  rm -f "$3"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$PROFILE/$1" \
    --virtual-time-budget=1200 --window-size="$2" --screenshot="$3" "$URL" >/dev/null 2>&1 &
  CHROME_PID=$!
  for _ in $(seq 1 150); do
    if [ -s "$3" ] || ! kill -0 "$CHROME_PID" 2>/dev/null; then break; fi
    sleep .2
  done
  sleep .3
  kill "$CHROME_PID" 2>/dev/null || true
  wait "$CHROME_PID" 2>/dev/null || true
  [ -s "$3" ] || { echo "no screenshot written: $3" >&2; exit 1; }
}
shoot big 1440,900 "$ROOT/shots/$SCENARIO$HASH.png"
shoot small 1000,700 "$ROOT/shots/$SCENARIO$HASH-small.png"
