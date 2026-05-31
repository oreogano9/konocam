import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");

const checks = [
  {
    name: "camera/gallery keep-warm constant exists",
    pattern: /const CAMERA_GALLERY_KEEP_WARM_MS = \d+;/,
  },
  {
    name: "warm gallery mode exists",
    pattern: /function enterWarmGalleryMode\(options = \{\}, reason = "camera-gallery-open", startedAt = 0\)/,
  },
  {
    name: "warm return path exists",
    pattern: /function returnFromWarmGallery\(reason = "gallery-camera-open"\)/,
  },
  {
    name: "camera-to-gallery uses warm mode after slide",
    pattern: /enterWarmGalleryMode\(\{ \.\.\.options, force: true, skipGalleryLoad: true \}, reason, transitionStartedAt\)/,
  },
  {
    name: "capture-finalization gallery path counts warm opens",
    pattern: /enterWarmGalleryMode\(\s*\{ \.\.\.pendingStopOptions, force: true, skipGalleryLoad: true, countWarmOpen: true \},\s*pendingStopOptions\.reason[\s\S]*state\.cameraGalleryOpenStartedAt/,
  },
  {
    name: "camera-to-gallery tracks open start time",
    pattern: /state\.cameraGalleryOpenStartedAt = transitionStartedAt;/,
  },
  {
    name: "warm gallery debug events expose counted open timing",
    pattern: /counted: shouldCountWarmOpen,[\s\S]*openMs: shouldCountWarmOpen \? state\.debug\.lastWarmGalleryOpenMs : null/,
  },
  {
    name: "gallery updates can be frame-rendered during capture transitions",
    pattern: /function scheduleGalleryFrameRender\(reason = "gallery-frame"\)[\s\S]*debugEvent\("gallery:frame-render"/,
  },
  {
    name: "requestGalleryRender avoids sync render during transition or visible capture",
    pattern: /if \(options\.nextFrame \|\| state\.cameraGalleryTransitioning \|\| \(surfaceVisible && state\.cameraCaptureInProgress\)\) \{\s*scheduleGalleryFrameRender\(reason\);/s,
  },
  {
    name: "quick gallery-to-camera return uses warm path before cold start",
    pattern: /if \(returnFromWarmGallery\(reason\)\) \{\s*return;\s*\}\s*if \(state\.cameraActive \|\| state\.cameraStarting\)/s,
  },
  {
    name: "gallery swipe-back is allowed during warm gallery",
    pattern: /\|\| \(state\.cameraActive && !state\.cameraGalleryDeferred\)/,
  },
  {
    name: "hidden captures are blocked during warm gallery",
    pattern: /if \(state\.cameraGalleryDeferred\) \{\s*debugEvent\("capture:ignored"/s,
  },
  {
    name: "level guide stops during warm gallery",
    pattern: /state\.cameraActive && !state\.cameraGalleryDeferred && state\.levelGuideEnabled/,
  },
  {
    name: "camera controls disable during warm gallery",
    pattern: /const cameraControlsActive = state\.cameraActive && !state\.cameraGalleryDeferred;/,
  },
  {
    name: "debug report exposes warm gallery state",
    pattern: /warmGallery: state\.cameraGalleryDeferred/,
  },
  {
    name: "debug report exposes scheduled gallery frame renders",
    pattern: /frameRenderScheduled: state\.galleryFrameRenderScheduled/,
  },
  {
    name: "debug report exposes transition perf counters",
    pattern: /transitionPerf: \{\s*warmGalleryOpens:/s,
  },
];

const failures = checks.filter((check) => !check.pattern.test(appSource));

if (failures.length) {
  console.error("Camera/gallery transition invariant check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Camera/gallery transition invariants ok (${checks.length} checks).`);
