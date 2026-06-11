#!/bin/zsh
# Builds the Windows version (Electron) into a zip — no wine needed.
# Packages manually: prebuilt Electron win32 zip + game in resources/app.
set -e
cd "$(dirname "$0")"

ELECTRON_VERSION="33.2.1"
BUILD="build"
STAGE="$BUILD/win-staging"
OUT="$BUILD/win"
APPDIR="$OUT/WiFi Billionaire-win32-x64"

echo "▸ Staging game files…"
rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE/css" "$STAGE/js"
cp index.html "$STAGE/"
cp css/style.css "$STAGE/css/"
cp js/*.js "$STAGE/js/"
cp app/win/main.js app/win/package.json "$STAGE/"
sips -z 512 512 "$BUILD/icon_1024.png" --out "$STAGE/icon.png" >/dev/null

echo "▸ Locating Electron v$ELECTRON_VERSION for win32-x64…"
EZIP=$(find ~/Library/Caches/electron -name "electron-v$ELECTRON_VERSION-win32-x64.zip" 2>/dev/null | head -1)
if [ -z "$EZIP" ]; then
  EZIP="$BUILD/electron-win.zip"
  echo "  downloading…"
  curl -L --fail -o "$EZIP" \
    "https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/electron-v$ELECTRON_VERSION-win32-x64.zip"
fi
echo "  using: $EZIP"

echo "▸ Assembling…"
mkdir -p "$APPDIR"
unzip -q "$EZIP" -d "$APPDIR"
rm -f "$APPDIR/resources/default_app.asar"
mkdir -p "$APPDIR/resources/app"
cp -R "$STAGE/." "$APPDIR/resources/app/"
mv "$APPDIR/electron.exe" "$APPDIR/WiFi Billionaire.exe"

cat > "$APPDIR/README.txt" << 'EOF'
WiFi Billionaire — by Blanco Games
==================================
To play: double-click "WiFi Billionaire.exe".
Windows may show a SmartScreen warning the first time (the app is unsigned) —
click "More info" then "Run anyway".
Your save is stored automatically. Have fun out there.
EOF

echo "▸ Zipping…"
cd "$OUT"
zip -qr "../WiFi Billionaire (Windows).zip" "WiFi Billionaire-win32-x64"
cd - >/dev/null

echo ""
echo "✓ Windows zip: $BUILD/WiFi Billionaire (Windows).zip"
du -h "$BUILD/WiFi Billionaire (Windows).zip" | cut -f1
