#!/bin/sh
# Copies the web game (index.html, ui/, sim/) from the repo root into the app bundle's web/ folder.
# Xcode runs this before every build, so the app always ships the web code as it is in the repo.
#
# The copy differs from the repo in two ways: links to Google Fonts are removed, because the app has
# no network (the phone-redesign lane is moving the fonts into ui/fonts, which the copy then carries);
# and while index.html still asks for the desktop width=1440 viewport, the copy asks for the device
# width, so ui/main.js's fit-to-window zoom sees the real window (the bottom of the office was cut off on
# an iPhone otherwise). The copy leaves any other viewport alone.
set -eu

# WEB_SOURCE (a build setting, e.g. `xcodebuild … WEB_SOURCE=~/worktrees/game-night-ai-lab-phone`) takes the
# web game from another checkout; by default it comes from this repo.
REPO="${WEB_SOURCE:-${SRCROOT:?run from Xcode or set SRCROOT to the ios folder}/..}"
DEST="${TARGET_BUILD_DIR:?}/${UNLOCALIZED_RESOURCES_FOLDER_PATH:?}/web"

# A release ships this repo's committed web code only: no other checkout, no uncommitted changes.
if [ "${CONFIGURATION:-}" = "Release" ] && [ -n "${WEB_SOURCE:-}" ]; then
  echo "error: WEB_SOURCE is for Debug builds; a Release build bundles this repo's own web game" >&2
  exit 1
fi
if [ "${CONFIGURATION:-}" = "Release" ] && [ -n "$(git -C "$REPO" status --porcelain -- index.html ui sim)" ]; then
  echo "error: index.html, ui/ or sim/ has uncommitted changes; commit or stash them before a Release build" >&2
  exit 1
fi

mkdir -p "$DEST"
# rsync takes the first rule that matches, so the exclusions come before the folders they sit in.
rsync -a --delete --delete-excluded \
  --exclude='*.md' --exclude='.DS_Store' \
  --include='/index.html' --include='/ui/***' --include='/sim/***' --exclude='*' \
  "$REPO/" "$DEST/"

# Drop the Google Fonts preconnects and stylesheet from the page, and the @import from the endings sheet.
/usr/bin/sed -i '' -E \
  -e '/fonts\.(googleapis|gstatic)\.com/d' \
  -e 's#<meta name="viewport" content="width=1440">#<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">#' \
  "$DEST/index.html"
/usr/bin/sed -i '' -E -e '/@import url\("https:\/\/fonts\.googleapis\.com/d' "$DEST/ui/endings/endings.css"

if grep -rqE 'https://fonts\.(googleapis|gstatic)\.com' "$DEST/index.html" "$DEST/ui/endings/endings.css"; then
  echo "error: copy-web.sh left a Google Fonts link in the bundled web game" >&2
  exit 1
fi
