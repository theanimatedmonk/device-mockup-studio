// A device driven by a video's timeline (HyperFrames, GSAP, Playwright),
// instead of the stage's own clock.
//
//   import { createDevice, fillPose } from "@deanimatedmonk/device-mockup-studio/rig";
//   const mac = createDevice(el, { model: "macbookPro14", finish: "Silver", keys: [...] });
//   mac.screen.append(myContent);                               // live DOM on the glass
//   tl.fromTo(mac, { t: 0 }, { t: 24, duration: 24, ease: "none" }, 0);
//
// Setting `t` (seconds of the video) poses the device and camera from `keys`
// and draws that exact frame, so preview and render always agree.
//
// A key: { at, ease, cut, ...pose }. Between two keys the pose eases from
// the first to the second (the second key's ease, default "power2.inOut").
// `cut: true` on a key jumps to it instead: the earlier pose holds until then.
// Pose fields (any subset; missing ones carry over from the key before):
//   az, el, dist, fov, roll, tx, ty   camera orbit (degrees; dist, tx, ty in the stage's units)
//   rx, ry, rz, x, y, z               device turn (degrees) and position
//   lid                               a laptop's hinge in degrees (0 shut, 110 open, 135 wide)
//
// `fillPose(model)` gives the pose where the screen exactly fills the frame,
// so a screen recording can play full frame on the glass. See the README.

import * as THREE from "three";
import { DeviceStage } from "./stage.js";
import { DEVICES, buildDevice } from "./devices.js";

const BASE = { az: 0, el: 0, dist: 44, fov: 28, roll: 0, tx: 0, ty: 0, rx: 0, ry: 0, rz: 0, x: 0, y: 0, z: 0, lid: 110 };

function ease(name) {
  const gsap = globalThis.gsap;
  if (gsap?.parseEase) return gsap.parseEase(name || "power2.inOut");
  // Without GSAP every move is a cubic in-out.
  return (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
}

function resolveKeys(keys) {
  let prev = { ...BASE };
  return keys
    .slice()
    .sort((a, b) => a.at - b.at)
    .map((k) => {
      const pose = { ...prev };
      for (const f of Object.keys(BASE)) if (k[f] !== undefined) pose[f] = k[f];
      prev = pose;
      return { at: k.at, cut: !!k.cut, ease: ease(k.ease), pose };
    });
}

function poseAt(keys, t) {
  if (t <= keys[0].at) return keys[0].pose;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= b.at) continue;
    if (b.cut) return a.pose;
    const p = b.ease((t - a.at) / Math.max(b.at - a.at, 1e-6));
    const out = {};
    for (const f in a.pose) out[f] = a.pose[f] + (b.pose[f] - a.pose[f]) * p;
    return out;
  }
  return keys[keys.length - 1].pose;
}

// The camera pose that puts a device's screen square-on and exactly filling the frame.
//   fit: "width"   the screen's width fills the frame's width (content fitted to the screen's width fills the frame)
//        "height"  the screen's height fills the frame's height
//        "cover"   the screen covers the whole frame (no background shows)
//   aspect: the frame's width / height (16 / 9 for 1920 x 1080)
//   overscan: 1.01 pushes 1% closer, so no bezel shows at the edges
export function fillPose(model, { lid = 110, fit = "width", aspect = 16 / 9, fov = 28, overscan = 1.01 } = {}) {
  const spec = DEVICES[model];
  const dev = buildDevice(model, Object.keys(spec.finishes)[0]);
  dev.group.rotation.order = "YXZ";
  dev.setLid?.(lid);
  dev.group.updateMatrixWorld(true);

  const geo = dev.screen.geometry;
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const sw = bb.max.x - bb.min.x, sh = bb.max.y - bb.min.y;
  const centre = bb.getCenter(new THREE.Vector3()).applyMatrix4(dev.screen.matrixWorld);
  const normal = new THREE.Vector3(0, 0, 1).transformDirection(dev.screen.matrixWorld).normalize();

  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const forWidth = sw / (2 * tan * aspect), forHeight = sh / (2 * tan);
  const d = { width: forWidth, height: forHeight, cover: Math.min(forWidth, forHeight) }[fit] / overscan;

  // The orbit target sits on z = 0: slide along the screen's normal to it.
  const s = -centre.z / normal.z;
  const target = centre.clone().addScaledVector(normal, s);
  const k = spec.view || 1; // the stage scales a big device's camera by its view
  const r = (v) => +v.toFixed(3);
  return {
    az: r(THREE.MathUtils.radToDeg(Math.atan2(normal.x, normal.z))),
    el: r(THREE.MathUtils.radToDeg(Math.asin(normal.y))),
    dist: r((d - s) / k),
    tx: r(target.x / k),
    ty: r(target.y / k),
    fov,
    lid,
  };
}

export function createDevice(container, { model, finish, keys, look = {}, glass = false, clearBackdrop = false }) {
  const stage = new DeviceStage(container, {
    lockToggle: false,
    state: {
      shot: "manual",
      playing: false,
      layout: 1,
      interact: "device",
      slots: [{ model, finish: finish || Object.keys(DEVICES[model].finishes)[0], screen: "dom", lid: 110 }],
      device: { rotX: 0, rotY: 0, rotZ: 0, x: 0, y: 0, z: 0, float: 0 },
      look: { backdrop: "Custom", inner: "#0f1830", outer: "#040508", shadow: 0.35, reflections: 0.9, exposure: 1, glare: 0.6, screen: 1, ...look },
      output: { aspect: "fill", height: 1080, fps: 30 },
    },
  });
  // The glass's reflections tint the screen unevenly; keep the screen true unless asked.
  if (!glass && stage.slots[0].dev) stage.slots[0].dev.glass.visible = false;
  // A clear backdrop lets the page's own background show behind the device.
  if (clearBackdrop) stage.scene.background = null;
  // The timeline is the only clock: stop the stage's own loop.
  cancelAnimationFrame(stage.raf);
  stage.tick = () => {};

  const resolved = resolveKeys(keys);
  const viewport = stage.viewport(model);
  let lastLid = null;
  let time = 0;

  const rig = {
    stage,
    // The live screen element, at `viewport` CSS px: append your content here.
    screen: stage.screen(0),
    viewport,
    // Scale content of a fixed size (a 1920 x 1080 recording) to the screen's width, centred.
    fit(el, width = 1920, height = 1080) {
      const k = viewport.width / width;
      Object.assign(el.style, {
        position: "absolute", left: "0px", top: "0px", width: `${width}px`, height: `${height}px`,
        transformOrigin: "0 0", transform: `translate(0px, ${((viewport.height - height * k) / 2).toFixed(2)}px) scale(${k})`,
      });
      return k;
    },
    get t() {
      return time;
    },
    set t(v) {
      time = v;
      const p = poseAt(resolved, v);
      Object.assign(stage.state.camera, { azimuth: p.az, elevation: p.el, distance: p.dist, fov: p.fov, roll: p.roll, targetX: p.tx, targetY: p.ty });
      Object.assign(stage.state.device, { rotX: p.rx, rotY: p.ry, rotZ: p.rz, x: p.x, y: p.y, z: p.z, float: 0 });
      if (p.lid !== lastLid && stage.slots[0].dev?.setLid) {
        stage.slots[0].dev.setLid(p.lid);
        stage.state.slots[0].lid = p.lid;
        lastLid = p.lid;
      }
      stage.layout();
      stage.apply(0);
      stage.render();
    },
  };
  rig.t = 0;
  return rig;
}
