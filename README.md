# device-mockup-studio

Real 3D phones in an Apple-style studio — npm [`@theanimatedmonk/device-mockup-studio`](package.json), web component `<device-stage>`.

**[Try the live studio →](https://theanimatedmonk.github.io/device-mockup-studio/)** · [Example page](https://theanimatedmonk.github.io/device-mockup-studio/examples/element.html) · MIT licensed

With **your live UI running on their screens**. The models are iPhone 17 Pro, iPhone Air and Galaxy S25 Ultra, built in code at their real sizes.

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
npm i three @theanimatedmonk/device-mockup-studio
```

From a local clone instead of the registry:

```sh
npm i three .
```

It depends on `three` (a peer dependency, version 0.165 or later) and `mp4-muxer`.

```js
import { defineDeviceStage } from "@theanimatedmonk/device-mockup-studio";
defineDeviceStage(); // registers <device-stage>
```

Without a bundler, use an import map, as in `examples/element.html`. It maps:
- `three` and `three/addons/` to the jsDelivr builds,
- `mp4-muxer` to its jsDelivr ESM build.

Then import `src/index.js`.

## Your UI on the screen

| Model | Viewport (CSS px) | Safe top / bottom |
|---|---|---|
| `iphone17pro` | 402 × 874 | 62 / 34 |
| `iphoneAir` | 420 × 912 | 68 / 34 |
| `s25ultra` | 412 × 892 | 36 / 24 |

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
import { DeviceStage } from "@theanimatedmonk/device-mockup-studio";
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
    { "model": "iphone17pro", "finish": "Deep Blue", "screen": "" }  // "", "dom", a URL, or a named screen
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

## Video

The live UI is real web content, so record the **page**, not the canvas:
- HyperFrames renders the page frame by frame,
- or Playwright, or a screen recorder.

The camera is deterministic: `seek(t)` puts every device and the camera exactly where they are at `t`. The UI inside runs on the page's own clock, so a renderer that controls page time steps both together.

`exportVideo()` and `snapshot()` encode the canvas alone, which is frame-perfect MP4 or PNG. They only work when no live screen is in view, i.e. when the screens show videos, images or the demo.

## The studio (this folder's `index.html`)

The studio is a control panel over one stage, for designing shots. Its sections:
- Shot.
- Pointer.
- Devices: model, finish, and screen (Demo, a page URL, a dropped file).
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
