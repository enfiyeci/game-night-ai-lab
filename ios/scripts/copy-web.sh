#!/bin/sh
# Copies the web game (index.html, ui/, sim/) from the repo root into the app bundle's web/ folder.
# Xcode runs this before every build, so the app always ships the web code as it is in the repo.
#
# The copy differs from the repo in one way: links to Google Fonts are removed, because the app has
# no network (the phone-redesign lane is moving the fonts into ui/fonts, which the copy then carries).
set -eu

REPO="${SRCROOT:?run from Xcode or set SRCROOT to the ios folder}/.."
DEST="${TARGET_BUILD_DIR:?}/${UNLOCALIZED_RESOURCES_FOLDER_PATH:?}/web"

mkdir -p "$DEST"
# rsync takes the first rule that matches, so the exclusions come before the folders they sit in.
rsync -a --delete --delete-excluded \
  --exclude='*.md' --exclude='.DS_Store' \
  --include='/index.html' --include='/ui/***' --include='/sim/***' --exclude='*' \
  "$REPO/" "$DEST/"

# Drop the Google Fonts preconnects and stylesheet from the page, and the @import from the endings sheet.
/usr/bin/sed -i '' -E \
  -e '/fonts\.(googleapis|gstatic)\.com/d' \
  "$DEST/index.html"
/usr/bin/sed -i '' -E -e '/@import url\("https:\/\/fonts\.googleapis\.com/d' "$DEST/ui/endings/endings.css"

if grep -rqE 'https://fonts\.(googleapis|gstatic)\.com' "$DEST/index.html" "$DEST/ui/endings/endings.css"; then
  echo "error: copy-web.sh left a Google Fonts link in the bundled web game" >&2
  exit 1
fi
