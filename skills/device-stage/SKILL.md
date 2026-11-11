---
name: device-stage
description: Wrap a UI flow (the real UI code, not a recording) in a 3D device (iPhone 17 Pro, iPhone Air, Galaxy S25 Ultra, iPad Pro 11", MacBook Pro 14") in an Apple-style studio, and drive the camera and the UI from script for videos (HyperFrames, Playwright). Use when building or showcasing a mobile, tablet or desktop/web UI flow in a device, making product shots or app-flow videos of a web or Rive UI, or when a composition needs a phone, iPad or MacBook showing a live screen.
---

# device-stage: live UI in a 3D device

Repo: [device-mockup-studio](https://github.com/theanimatedmonk/device-mockup-studio) (`@deanimatedmonk/device-mockup-studio`). The README is the full reference.

How it works:
- The device's screen is a **real DOM element** at the device's CSS viewport, placed in 3D with three.js `CSS3DRenderer`.
- A WebGL canvas draws the device and the studio over it, with a clear hole for the screen.
- The UI keeps running: taps, scrolls, Rive canvases, CSS animations.

Never record the UI to video and paste it onto the device. Mount the UI itself.

**Pick the device for the UI:** a phone for a mobile flow, `ipadPro11` for a tablet layout, `macbookPro14` for a desktop web app or dashboard. Each is modelled at its real size.

## Wrap a flow

Pick the mount that fits the UI:

- **A whole page or app** (its own CSS and JS, routes): use `src`. It loads in an iframe at the device's viewport, where `100vh` is the screen.

  ```html
  <device-stage device="iphone17pro" finish="Deep Blue" src="../my-flow/?embed=1" shot="float"></device-stage>
  ```

  Give the page an **embed mode** (`?embed=1`) that hides any 2D device frame or page chrome and fills the window. If it was designed at a fixed size, zoom its root to the device viewport on load.

- **A component or a few screens**: use children. They go on device 1's screen; a child with `screen="2"` or `screen="3"` goes on the second or third device.

  ```html
  <device-stage device="s25ultra" shot="tilt"><div class="app">…</div></device-stage>
  <device-stage device="macbookPro14" shot="screen"><div class="dashboard">…</div></device-stage>
  ```

  - Size with `100%` or `cqw` / `cqh`, never `vh` or `vw`.
  - Pad with `var(--ds-safe-top)` and `var(--ds-safe-bottom)`: the island or punch hole and the home bar on phones, the status bar and home indicator on the iPad, the notch / menu bar on the MacBook.

**Viewports (CSS px):**

| Model | Viewport | Safe top / bottom | Finishes |
|---|---|---|---|
| `iphone17pro` | 402 × 874 | 62 / 34 | Cosmic Orange, Deep Blue, Silver |
| `iphoneAir` | 420 × 912 | 68 / 34 | Sky Blue, Light Gold, Cloud White, Space Black |
| `s25ultra` | 412 × 892 | 36 / 24 | Titanium Silverblue, Titanium Black, Titanium Gray, Titanium Whitesilver |
| `ipadPro11` | 834 × 1210 (portrait) | 24 / 20 | Space Black, Silver |
| `macbookPro14` | 1512 × 982 | 32 / 0 | Space Black, Silver |

Design at those sizes, or zoom to them.

**Setup:** `import { defineDeviceStage } from "@deanimatedmonk/device-mockup-studio"` (or `src/index.js` from a clone). Without a bundler, use an import map for `three`, `three/addons/` and `mp4-muxer`; copy the one in `examples/element.html`.

## Drive it from script

`document.querySelector("device-stage").stage` is the `DeviceStage`.

- `set(patch)` sets any part of the state:
  - `shot`, `duration`, `camera {azimuth, elevation, roll, distance, fov, targetX, targetY}`
  - `device {rotX, rotY, rotZ, x, y, z}`
  - `slots[i] {model, finish, screen, lid}`: `lid` is the MacBook's hinge angle in degrees (0 shut, 110 default, 135 max). Step it over time to film the lid opening.
  - `look {backdrop, …}`, `output`
- `seek(t)` renders exactly the frame at `t` seconds. Use it with `set({ playing: false })`, so the timeline, not the stage's clock, drives the camera.
- `frameWindow(i)` is the iframe's window, for driving a page: click elements in it, or `postMessage` to it.
- `screen(i)` is the screen element itself, for children.
- `setInteract("screen" | "device")` is the person's pointer lock. It doesn't limit scripts: a script can move the camera and drive the UI at the same time.

**Shots** (`stage.shots`):

| Shot | Notes |
|---|---|
| `reveal`, `float`, `tilt`, `turntable`, `flip`, `macro`, `screen`, `spin`, `orbit` | One device |
| `duo` | Two devices |
| `lineup` | Three devices |
| `custom` | Camera A to B, from `move.a` / `move.b` |
| `manual` | Camera from `camera` |

**Bigger devices:** shots are framed for phones. A device's size factor (iPad 1.65, MacBook 2) scales the shot's poses, camera and floor, so every shot frames an iPad or MacBook as it frames a phone, with no extra settings. The same goes for `camera.distance` in `manual`: 44 means "phone-framed", whatever the device. `macro` closes in on the rear cameras; on the MacBook it closes in on the webcam in the notch. In `duo` / `lineup`, devices keep their true relative sizes, so a phone beside the MacBook is small, and a three-device line-up with a laptop can crowd.

For a **camera move that follows your flow**, add a shot in `src/shots.js`: ease the pose and camera through timed keys (`track()` helps). A self-playing embed can reset the stage clock when each run starts (see below).

**Make the flow play itself for filming** (pattern: `?embed=1&auto=1` on the iframe URL):

1. Wait for the app to be ready.
2. Tap with synthetic pointer and mouse events at design coordinates. Rive canvases accept them.
3. Scroll with `scrollTop` over `requestAnimationFrame`.
4. Post `{ <name>: "start" }` to the parent when a run begins; on the host page, reset `stage.state.time = 0` so camera beats line up with the UI.

## Video

Record the page, not the canvas: the live UI isn't in the WebGL canvas.

- **HyperFrames:** embed the stage page in the composition, for example the studio with `?ui=0&play=0&state=<JSON>`, or your own page with `<device-stage paused>`.
  - Step it from the composition's timeline: post `{ mockup: "seek", time }` and await `{ mockup: "reply" }` before the frame is captured.
  - Cut between moves with `{ mockup: "set", state }`.
- **Playwright:** set the state, then screenshot or record the page.

For both, render on a virtual clock so the UI's own animations step with the camera. Playwright's `page.clock.install()` followed by `pause_at()` drives timers and `requestAnimationFrame`. CSS animations aren't driven by that clock: pause them with `document.getAnimations()` and step their `currentTime` each frame.

`stage.exportVideo()` (frame-perfect MP4 via WebCodecs) encodes the canvas alone. Use it only for screens showing a video, an image or the demo.

## The studio page

`index.html` at the repo root is a control panel over a stage, for finding a shot by hand. Its **Copy state** button gives the exact JSON a script passes to `set()` or `?state=`. Its `window.mockup` is the stage.

```sh
python3 -m http.server 8765
# open http://localhost:8765/
```
