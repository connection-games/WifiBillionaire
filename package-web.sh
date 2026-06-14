#!/usr/bin/env bash
# Package the browser build of WiFi Billionaire into a single zip for CrazyGames.
#
# CrazyGames wants an HTML5 game as a zip with index.html at the root and every
# asset referenced with relative paths (this game already is). Upload the zip at
# https://developer.crazygames.com/ → your game → "Build".
#
# Usage:  ./package-web.sh        → dist/wifi-billionaire-web.zip
set -euo pipefail
cd "$(dirname "$0")"

OUT="dist"
ZIP="$OUT/wifi-billionaire-web.zip"
mkdir -p "$OUT"
rm -f "$ZIP"

# Only the files a browser needs — no Electron/build/app tooling.
zip -r "$ZIP" index.html css js -x '*.DS_Store' >/dev/null

echo "✅ Built $ZIP"
echo "   Contents: index.html + css/ + js/  (open index.html to play — pure static, no server needed)"
unzip -l "$ZIP" | tail -n +2 | head -n 30
