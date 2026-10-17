#!/usr/bin/env bash
# Builds the web preview that is published as a Claude artifact so the founder can try the app on any phone.
# Usage: scripts/build-web-preview.sh <output-dir>
# The artifact host reserves paths starting with "_", so Expo's "_expo" folder is renamed to "app",
# and absolute paths are made relative so the app loads from wherever it is hosted.
set -euo pipefail
OUT="${1:?output dir}"
rm -rf "$OUT"
npx expo export --platform web --output-dir "$OUT"
cd "$OUT"
mv _expo app
sed -i 's#"/_expo/static/#"./app/static/#g; s#"/assets/#"./assets/#g' app/static/js/web/*.js
echo "Exported to $OUT. Build page.html from index.html (see docs/web-preview.md)."
