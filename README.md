# device-mockup-studio

Real 3D phones in an Apple-style studio — npm [`@deanimatedmonk/device-mockup-studio`](package.json), web component `<device-stage>`.

**[Try the live studio →](https://theanimatedmonk.github.io/device-mockup-studio/)** · [Example page](https://theanimatedmonk.github.io/device-mockup-studio/examples/element.html) · [HyperFrames example](examples/hyperframes-macbook.html) · [npm](https://www.npmjs.com/package/@deanimatedmonk/device-mockup-studio) · MIT licensed

```sh
npm i three @deanimatedmonk/device-mockup-studio
```

With **your live UI running on their screens**. The models are iPhone 17 Pro, iPhone Air, Galaxy S25 Ultra, iPad Pro 11″ and MacBook Pro 14″, built in code at their real sizes.

**Making a video?** Jump to [Video with HyperFrames](#video-with-hyperframes): copy the files with one script, start from `examples/hyperframes-macbook.html`, and `fillPose()` gives the exact camera pose where the screen fills the frame.

The screen isn't a picture of your app. It's your app: real HTML, CSS, JS and Rive canvases, running and tappable, with the phone's glass, Dynamic Island and studio reflections drawn over it.

```html
<device-stage device="iphone17pro" finish="Deep Blue" shot="float">
  <my-app></my-app>
</device-stage>

<device-stage device="s25ultra" src="../my-flow/" shot="tilt"></device-stage>
```

How it works:
- Each phone's screen is a DOM element at the phone's real CSS viewport, placed in 3D with three.js's `CSS3DRenderer`.
- A WebGL canvas on top draws the phones and the studio, and leaves a clear hole where each screen is.
- Both layers share one camera, so the UI stays locked to the glass however the phone moves.

## Quick start: no install

Save this as an HTML file and open it with any local server, for example `npx serve` or `python3 -m http.server`. It loads everything from a CDN.

```html
<!doctype html>
<script type="importmap">
  { "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
      "mp4-muxer": "https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/+esm"
  } }
</script>
<script type="module">
  import { defineDeviceStage } from "https://cdn.jsdelivr.net/gh/theanimatedmonk/device-mockup-studio@v0.1.0/src/index.js";
  defineDeviceStage();
</script>
<style>body { margin: 0 } device-stage { display: block; width: 100vw; height: 100vh }</style>

<device-stage device="iphone17pro" finish="Deep Blue" shot="float">
  <div style="height: 100%; display: grid; place-items: center; background: #111; color: #fff">
    Hello from my app
  </div>
</device-stage>
```

Put your own UI in place of the `<div>`, or point the phone at a page you already have with `src="http://localhost:5173/"`.

## Get the code

```sh
git clone https://github.com/theanimatedmonk/device-mockup-studio.git
cd device-mockup-studio
# or: npx degit theanimatedmonk/device-mockup-studio my-stage && cd my-stage
python3 -m http.server 8765      # then open http://localhost:8765/ for the studio
```

There is no build step. The studio opens on the **Float** shot with the built-in demo app on each phone.

## Install in your project

```sh
npm i three @deanimatedmonk/device-mockup-studio
```

From a local clone instead of the registry:

```sh
npm i three .
```

It depends on `three` (a peer dependency, version 0.165 or later) and `mp4-muxer`.

```js
import { defineDeviceStage } from "@deanimatedmonk/device-mockup-studio";
defineDeviceStage(); // registers <device-stage>
```

Without a bundler, use an import map, as in `examples/element.html`. It maps:
- `three` and `three/addons/` to the jsDelivr builds,
- `mp4-muxer` to its jsDelivr ESM build.

Then import `src/index.js`.

## Your UI on the screen

| Model | Viewport (CSS px) | Safe top / bottom |
|---|---|---|
| `iphone17pro` | 402 × 872 | 62 / 34 |
| `iphoneAir` | 420 × 908 | 68 / 34 |
| `s25ultra` | 412 × 887 | 36 / 24 |
| `ipadPro11` | 834 × 1212 | 24 / 20 |
| `macbookPro14` | 1512 × 982 | 32 / 0 |

The heights come from each screen's real shape; `stage.viewport(model)` returns `{ width, height, safeTop, safeBottom }`, so read it rather than hard-coding.

- **Children** of `<device-stage>` go on device 1's screen. A child with `screen="2"` or `screen="3"` goes on that device, for the duo and line-up shots.
  - Size your UI with `100%` or the container units `cqw` and `cqh`. `vh` and `vw` are the page's, not the phone's.
  - Pad it with `var(--ds-safe-top)` and `var(--ds-safe-bottom)`.
- **A whole page** goes in with `src="…"`: an `<iframe>` at the phone's viewport, where `100vh` is the phone. This is the right choice for full apps with their own global CSS and JS.
- **A video or image URL** in `src` plays as a texture, and so does a dropped file. With no `src` and no children, the screen shows a built-in demo app.

## The pointer: use the app, or move the device

A toggle on the stage switches what your pointer does:
- **Use the app:** taps and scrolls go to the UI, and the 3D view is locked.
- **Move the device:** the UI is locked; drag to orbit, scroll to zoom.

The state has the same switch as `interact: "screen" | "device"`, and the studio page also binds it to the **L** key.

It only filters the pointer. A script can always do both: set the camera with `set()` / `seek()`, and drive the UI with the DOM, or `frameWindow(i)` for a page.

## Attributes

| Attribute | Sets |
|---|---|
| `device`, `finish` | Device 1's model and finish |
| `src` | Device 1's screen |
| `shot`, `duration` | The camera move and its length |
| `paused` | Holds the clock |
| `backdrop` | Studio, White, Blush, Graphite, Black, Midnight |
| `interact` | `screen` or `device` |
| `aspect` | `fill` (default), `16:9`, `9:16`, `1:1`, `4:5` |
| `state` | JSON for any part of the state |
| `lock-toggle="off"` | Hides the toggle |

The element's `.stage` is the `DeviceStage`.

## The stage from script

```js
import { DeviceStage } from "@deanimatedmonk/device-mockup-studio";
const stage = new DeviceStage(container, { state: { shot: "tilt" }, screens: { checkout: (model) => `/flows/checkout/?platform=${model}` } });

stage.screen(0).append(myAppElement);            // live elements on device 1
stage.set({ slots: [{ screen: "checkout" }] });  // a named screen (resolved per model), or any URL
stage.set({ shot: "manual", camera: { azimuth: 30, elevation: 8, roll: -6, distance: 38 }, device: { rotY: -20 } });
await stage.seek(2.5);                           // render exactly the frame at 2.5 s
stage.get();                                     // the state
stage.setInteract("device");
stage.frameWindow(0);                            // the iframe's window, to drive the page
stage.on((state) => { /* after each change */ });
```

**The state** (`DEFAULTS` in `src/stage.js`):

```jsonc
{
  "shot": "float", "time": 0, "duration": 8, "playing": true, "speed": 1,
  "interact": "screen",                      // or "device"
  "layout": 1,                               // devices shown in "manual"
  "slots": [                                 // device 1, 2, 3
    { "model": "iphone17pro", "finish": "Deep Blue", "screen": "",   // "", "dom", a URL, or a named screen
      "lid": 110 }                           // a laptop's hinge: 0 shut, 110 open, 135 max
  ],
  "camera": { "azimuth": -6, "elevation": 3, "roll": 0, "distance": 44, "fov": 28, "targetX": 0, "targetY": 0 },
  "device": { "rotX": 0, "rotY": 0, "rotZ": 0, "x": 0, "y": 0, "z": 0, "float": 1 },
  "move": { "a": { /* camera */ }, "b": { /* camera */ } },
  "look": { "backdrop": "Studio", "inner": "#fbfbfd", "outer": "#e3e4e9", "shadow": 0.55, "reflections": 1, "exposure": 1, "glare": 1, "screen": 1 },
  "output": { "aspect": "fill", "height": 1080, "fps": 60 }
}
```

**Shots:**

| Shot | Devices | Shape |
|---|---|---|
| `tarot` | 1 | Legacy shot timed to a self-playing embed (see `src/shots.js`) |
| `reveal` | 1 | |
| `float` | 1 | Loops |
| `tilt` | 1 | |
| `turntable` | 1 | Loops, 360° |
| `flip` | 1 | Loops |
| `macro` | 1 | Camera module close-up |
| `screen` | 1 | Loops; the screen fills the frame |
| `spin` | 1 | |
| `orbit` | 1 | |
| `duo` | 2 | Loops |
| `lineup` | 3 | Loops |
| `custom` | 1 | Camera A to B |
| `manual` | 1–3 | No set move |

**Finishes:**

| Model | Finishes |
|---|---|
| `iphone17pro` | Cosmic Orange, Deep Blue, Silver |
| `iphoneAir` | Sky Blue, Light Gold, Cloud White, Space Black |
| `s25ultra` | Titanium Silverblue, Titanium Black, Titanium Gray, Titanium Whitesilver |
| `ipadPro11` | Space Black, Silver |
| `macbookPro14` | Space Black, Silver |

## Video

The live UI is real web content, so record the **page**, not the canvas:
- HyperFrames renders the page frame by frame,
- or Playwright, or a screen recorder.

The camera is deterministic: `seek(t)` puts every device and the camera exactly where they are at `t`. The UI inside runs on the page's own clock, so a renderer that controls page time steps both together.

`exportVideo()` and `snapshot()` encode the canvas alone, which is frame-perfect MP4 or PNG. They only work when no live screen is in view, i.e. when the screens show videos, images or the demo.

## Video with HyperFrames

The fastest path: the stage runs **inside the composition**, and the composition's GSAP timeline drives it through `createDevice()` (`src/rig.js`). No iframe, no `postMessage`, no stage clock.

**1. Copy the files into the project** (so renders never wait on a CDN):

```sh
sh scripts/vendor-into.sh ~/path/to/hyperframes-project
```

This writes `assets/vendor/device-stage/` (this repo's `src/`), `assets/vendor/three/` (three r170 and the four addons the stage imports) and `assets/vendor/mp4-muxer.js`.

**2. Start from [`examples/hyperframes-macbook.html`](examples/hyperframes-macbook.html)**: a closed MacBook opens, the camera flies onto the screen, a recording plays full frame, the camera pulls back and the lid shuts. Copy it to the project's `index.html`, put the recording at `assets/screen.mp4`, set `END`. It passes `npx hyperframes check` as is.

The pieces, if you build your own:

```html
<script type="importmap">
  { "imports": {
      "three": "./assets/vendor/three/three.module.js",
      "three/addons/": "./assets/vendor/three/addons/",
      "mp4-muxer": "./assets/vendor/mp4-muxer.js"
  } }
</script>

<div id="mac" data-layout-allow-overflow data-layout-allow-occlusion></div>   <!-- full frame: 1920 x 1080 -->
<div id="parking">                                                            <!-- width/height 0, overflow hidden -->
  <div id="desk">                                                             <!-- becomes the screen -->
    <div id="content">
      <video id="rec" class="clip" src="assets/screen.mp4" muted playsinline data-start="0" data-duration="16"></video>
    </div>
  </div>
</div>

<script type="module">
  import { createDevice, fillPose } from "./assets/vendor/device-stage/rig.js";
  const FILL = fillPose("macbookPro14");                       // the screen exactly fills the frame
  const mac = createDevice(document.getElementById("mac"), {
    model: "macbookPro14", finish: "Silver", clearBackdrop: true,
    keys: [
      { at: 0, el: 24, dist: 46, ty: -4, lid: 0 },             // shut
      { at: 2.2, el: 16, dist: 44, ty: -0.5, lid: 110 },        // open
      { at: 3.8, ...FILL, ease: "power3.inOut" },               // fly onto the screen
      { at: 12.2, ...FILL, ease: "none" },                      // hold while the recording plays
      { at: 13.7, el: 16, dist: 44, ty: -0.5 },                 // back out
      { at: 15.3, el: 24, dist: 46, ty: -4, lid: 0 },           // shut
    ],
  });
  const desk = document.getElementById("desk");
  Object.assign(desk.style, { width: `${mac.viewport.width}px`, height: `${mac.viewport.height}px` });
  mac.fit(document.getElementById("content"), 1920, 1080);   // 1920 x 1080 content, fitted to the screen's width
  mac.screen.append(desk);

  const tl = gsap.timeline({ paused: true });
  tl.fromTo(mac, { t: 0 }, { t: 16, duration: 16, ease: "none" }, 0);   // the device follows the video clock
  window.__timelines["main"] = tl;
</script>
```

**`createDevice(container, options)`** returns a rig:

| | |
|---|---|
| `model`, `finish` | Any model and finish above |
| `keys` | Timed poses: `{ at, ease, cut, az, el, dist, fov, roll, tx, ty, rx, ry, rz, x, y, z, lid }`. Missing fields carry over from the key before; between keys every field eases together with the later key's `ease` (a GSAP ease name; default `power2.inOut`); `cut: true` jumps |
| `look` | Any `look` state (`backdrop: "Custom"`, `inner`, `outer`, `shadow`, …) |
| `clearBackdrop` | `true` lets the page's background show behind the device |
| `glass` | `true` keeps the glass's reflections over the screen (off by default: they tint a recording) |
| `rig.t` | Set it to a time in seconds to pose and draw that exact frame. Tween it from the timeline |
| `rig.screen`, `rig.viewport` | The live screen element and its size in CSS px |
| `rig.fit(el, w, h)` | Scales fixed-size content (`w` × `h`) to the screen's width and centres it |
| `rig.stage` | The `DeviceStage` underneath |

**`fillPose(model, { lid, fit, aspect, fov, overscan })`** returns the key fields (`az, el, dist, tx, ty, fov, lid`) that put the screen square-on and filling the frame. `fit: "width"` (default) fills the frame's width with the screen's width, so 16:9 content fitted with `rig.fit()` fills a 16:9 frame exactly; `"height"` and `"cover"` are the other choices. `overscan` (default `1.01`) pushes 1% closer so no bezel shows. For `macbookPro14` at `lid: 110` it is about `{ az: 0, el: 8, dist: 11.55, tx: 0, ty: 2.33 }`.

**Things that will bite:**
- **Media on the screen is ordinary HyperFrames media.** A `<video class="clip" muted>` (or a sub-composition) inside the screen element is found, timed and frame-injected like any other. Don't use a slot's `src` video texture in a composition: it plays on its own clock.
- **One key list drives the camera and the lid.** Every field eases between consecutive keys, so to open the lid during a camera move, give `lid: 110` on the key where it should be fully open, and repeat values on in-between keys you want held.
- **Mark the full-frame layers** `data-layout-allow-overflow data-layout-allow-occlusion` (the device container, the screen element and the content), or `check` reports the screen covering the canvas while it fills the frame. `first_frame_empty` about `canvas.ds-gl` is the WebGL layer, and expected.
- **Fit the content to the screen's width, not its height.** The MacBook screen is 1.54 : 1, narrower than 16:9: width-fitted content leaves thin black bars on the glass (where the notch sits) and fills the frame exactly at `fillPose()`.
- **Keep the stage's import map local** (step 1). A CDN import that's slow at render time gives blank first frames.

## The studio (this folder's `index.html`)

The studio is a control panel over one stage, for designing shots. Its sections:
- Shot.
- Pointer.
- Devices: model, finish, screen (Demo, a page URL, a dropped file), and for the MacBook, the lid angle.
- Camera: orbit (Y axis), height (X), roll (Z), distance, lens, aim, and saving A and B for a move.
- Device rotation.
- Look.
- Output.
- For scripts: copy the state or a link.

By default every phone runs the **built-in demo app**. Point a slot at your own page with `?embed=1` (and optionally `?auto=1` for a self-playing flow); the stage can listen for `postMessage` events to reset the shot clock when a run starts — the pattern used by the legacy `tarot` shot in `src/shots.js`.

```sh
python3 -m http.server 8765
open http://localhost:8765/
```

The studio's other entry points:
- **URL:** `?state=<JSON>`, `?ui=0` (the stage alone), `?play=0`.
- **Console:** `window.mockup` (the stage).
- **`postMessage` from a parent page:** `{ mockup: "set" | "seek" | "get" }`.

**Keys:**

| Key | Action |
|---|---|
| Space | Play or pause |
| L | The pointer lock |
| H | Hide the panel |

## License

MIT. See [LICENSE](LICENSE).
