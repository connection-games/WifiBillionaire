#!/bin/zsh
# Builds WiFi Billionaire.app + DMG. Requires only macOS Command Line Tools.
set -e
cd "$(dirname "$0")"

APP_NAME="WiFi Billionaire"
BUILD="build"
APP="$BUILD/$APP_NAME.app"

rm -rf "$BUILD"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/web/js" "$APP/Contents/Resources/web/css"

echo "▸ Compiling native wrapper…"
swiftc -O app/main.swift -o "$APP/Contents/MacOS/WiFiBillionaire"

echo "▸ Bundling web game…"
cp app/Info.plist "$APP/Contents/"
cp index.html "$APP/Contents/Resources/web/"
cp css/style.css "$APP/Contents/Resources/web/css/"
cp js/*.js "$APP/Contents/Resources/web/js/"

echo "▸ Rendering icon…"
swift app/makeicon.swift "$BUILD/icon_1024.png"
ICONSET="$BUILD/AppIcon.iconset"
mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
  sips -z $size $size "$BUILD/icon_1024.png" --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  dbl=$((size * 2))
  sips -z $dbl $dbl "$BUILD/icon_1024.png" --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

echo "▸ Signing (ad-hoc)…"
codesign --force --deep -s - "$APP"

echo "▸ Creating DMG…"
DMG_DIR="$BUILD/dmg"
mkdir -p "$DMG_DIR"
cp -R "$APP" "$DMG_DIR/"
ln -s /Applications "$DMG_DIR/Applications"
hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_DIR" -ov -format UDZO "$BUILD/$APP_NAME.dmg" >/dev/null

echo ""
echo "✓ App: $APP"
echo "✓ DMG: $BUILD/$APP_NAME.dmg"
