# Contributing

Thanks for helping improve device-mockup-studio. The project is plain ES modules — there is no build step, bundler, or compile phase.

## Run locally

From the repo root:

```sh
python3 -m http.server 8765
```

Then open:

- **Studio:** http://localhost:8765/
- **Web component example:** http://localhost:8765/examples/element.html
- **Stage only:** http://localhost:8765/?ui=0

`three` and `mp4-muxer` load from jsDelivr in the browser via import maps in `index.html` and `examples/element.html`.

## What to change where

| Area | Files |
|---|---|
| Stage core (state, render, screens, export) | `src/stage.js` |
| Phone geometry and finishes | `src/devices.js` |
| Studio environment | `src/studio.js` |
| Camera moves | `src/shots.js` |
| Timeline rig for video, `fillPose()` | `src/rig.js` |
| Copying the stage into a project | `scripts/vendor-into.sh` |
| `<device-stage>` element | `src/element.js` |
| Studio UI panel | `src/ui.js`, `src/main.js`, `style.css` |

Keep the screen stack intact: CSS3D for live UI, WebGL with a clear hole over each screen, shared camera. See the README “How it works” section.

## Manual checks

Before opening a PR:

1. Load the studio and the example page with no errors in the console.
2. Toggle pointer lock (**L**): in “Use the app”, taps hit the screen UI; in “Move the device”, drag orbits the phone.
3. If you touched devices, the rig or `fillPose()`: copy `examples/hyperframes-macbook.html` into a scratch HyperFrames project with `scripts/vendor-into.sh`, run `npx hyperframes check`, and snapshot the shut, open and full-screen moments.
4. If you touched export, confirm `exportVideo()` / `snapshot()` still behave when screens show video, image, or demo only (not live DOM).

Optional: run Playwright against the local server (headless Chrome with `--use-angle=metal` on macOS) and assert `window.mockup` exists on the studio page.

## Pull requests

Use a short branch name, focused commits, and link any related issue. The default branch is `main`.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
