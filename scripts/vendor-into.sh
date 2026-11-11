#!/bin/sh
# Copy the device stage into a project, with the three.js and mp4-muxer files it imports,
# so the project renders offline (HyperFrames, Playwright) with no CDN at render time.
#
#   sh scripts/vendor-into.sh <project>
#
# Writes <project>/assets/vendor/device-stage/   (this repo's src/)
#        <project>/assets/vendor/three/          (three.module.js + the three addons the stage uses)
#        <project>/assets/vendor/mp4-muxer.js
# Then add the import map from examples/hyperframes-macbook.html to the project's index.html.
set -eu
PROJECT="${1:?usage: sh scripts/vendor-into.sh <project>}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
THREE="https://cdn.jsdelivr.net/npm/three@0.170.0"
V="$PROJECT/assets/vendor"

mkdir -p "$V/device-stage" "$V/three/addons/geometries" "$V/three/addons/renderers" "$V/three/addons/shaders"
cp "$HERE"/src/*.js "$HERE/LICENSE" "$V/device-stage/"
rm -f "$V/device-stage/main.js" "$V/device-stage/ui.js"   # the studio panel; not needed in a project

curl -fsSL "$THREE/build/three.module.js" -o "$V/three/three.module.js"
curl -fsSL "$THREE/examples/jsm/geometries/RoundedBoxGeometry.js" -o "$V/three/addons/geometries/RoundedBoxGeometry.js"
curl -fsSL "$THREE/examples/jsm/renderers/CSS3DRenderer.js" -o "$V/three/addons/renderers/CSS3DRenderer.js"
curl -fsSL "$THREE/examples/jsm/shaders/HorizontalBlurShader.js" -o "$V/three/addons/shaders/HorizontalBlurShader.js"
curl -fsSL "$THREE/examples/jsm/shaders/VerticalBlurShader.js" -o "$V/three/addons/shaders/VerticalBlurShader.js"
curl -fsSL "https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/+esm" -o "$V/mp4-muxer.js"

echo "device stage copied into $V"
