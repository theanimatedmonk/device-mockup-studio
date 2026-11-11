// device-stage: real phones in a studio, with your live UI on their screens.
//
//   import { defineDeviceStage } from "device-stage";
//   defineDeviceStage();   // then <device-stage> ... </device-stage>
//
//   import { DeviceStage } from "device-stage";
//   const stage = new DeviceStage(container, { state: { shot: "tilt" } });
//
//   import { createDevice, fillPose } from "device-stage";   // timeline-driven, for video
//   const mac = createDevice(el, { model: "macbookPro14", keys: [{ at: 0, lid: 0 }, { at: 2, lid: 110 }] });

export { DeviceStage, DEFAULTS, ASPECTS } from "./stage.js";
export { DeviceStageElement, defineDeviceStage } from "./element.js";
export { createDevice, fillPose } from "./rig.js";
export { DEVICES } from "./devices.js";
export { SHOTS } from "./shots.js";
export { BACKDROPS } from "./studio.js";
