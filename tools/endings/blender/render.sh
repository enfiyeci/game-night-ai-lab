#!/bin/sh
# Render a Blender world shot and cut it into film clips:
#   tools/endings/blender/render.sh <scene>[:<variant>] <clip>:<first>-<last> [<clip>:<first>-<last> ...]
# Runs tools/endings/blender/<scene>.py headless (passing variant=<variant> when given), then encodes each frame range as ui/assets/endings/clips/<clip>.mp4
# (H.264, 24 fps, no sound: each film has one sound track of its own). Set FRAMES=<dir> to keep the rendered frames.
set -eu
[ "$#" -ge 2 ] || { echo "usage: tools/endings/blender/render.sh <scene> <clip>:<first>-<last> [...]" >&2; exit 2; }
SCENE=${1%%:*}; VARIANT=; case $1 in *:*) VARIANT="variant=${1#*:}";; esac; shift
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
if [ -n "${FRAMES-}" ]; then mkdir -p "$FRAMES"; else FRAMES=$(mktemp -d "${TMPDIR:-/tmp}/ai-lab-clip.XXXXXX"); trap 'rm -rf "$FRAMES"' EXIT INT TERM; fi
"$BLENDER" -b --factory-startup -P "$ROOT/tools/endings/blender/$SCENE.py" -- "$FRAMES" full $VARIANT >"$FRAMES/blender.log" 2>&1 \
  || { tail -20 "$FRAMES/blender.log" >&2; exit 1; }
mkdir -p "$ROOT/ui/assets/endings/clips"
for SPEC in "$@"; do
  NAME=${SPEC%%:*}; RANGE=${SPEC#*:}; FIRST=${RANGE%-*}; LAST=${RANGE#*-}
  OUT="$ROOT/ui/assets/endings/clips/$NAME.mp4"
  ffmpeg -v error -y -framerate 24 -start_number "$FIRST" -i "$FRAMES/f_%04d.png" -frames:v $((LAST - FIRST + 1)) \
    -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an "$OUT"
  echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
done
