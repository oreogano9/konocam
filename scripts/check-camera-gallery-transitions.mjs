import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");

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
    name: "warm gallery-to-camera return is transition guarded",
    pattern: /function returnFromWarmGallery\(reason = "gallery-camera-open"\)[\s\S]*state\.cameraGalleryTransitioning = true;[\s\S]*state\.cameraGalleryOpenStartedAt = startedAt;[\s\S]*state\.cameraGalleryTransitioning = false;/,
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
    name: "queued gallery frame render defers during transition or capture",
    pattern: /function scheduleGalleryFrameRender\(reason = "gallery-frame"\)[\s\S]*if \(isGalleryRenderBlockedByTransition\(\)\) \{\s*scheduleGalleryTransitionEndRender\(reason\);\s*return;\s*\}[\s\S]*if \(state\.cameraCaptureInProgress\) \{\s*scheduleGalleryCaptureEndRender\(reason\);\s*return;\s*\}[\s\S]*debugEvent\("gallery:frame-render"/,
  },
  {
    name: "requestGalleryRender avoids sync render during transition or visible capture",
    pattern: /if \(isGalleryRenderBlockedByTransition\(\)\) \{\s*scheduleGalleryTransitionEndRender\(reason\);\s*return;\s*\}[\s\S]*if \(surfaceVisible && state\.cameraCaptureInProgress\) \{\s*scheduleGalleryCaptureEndRender\(reason\);\s*return;\s*\}[\s\S]*if \(options\.nextFrame\) \{\s*scheduleGalleryFrameRender\(reason\);/s,
  },
  {
    name: "visible capture inserts render after capture completes",
    pattern: /function scheduleGalleryCaptureEndRender\(reason = "gallery-capture-end"\)[\s\S]*if \(state\.cameraCaptureInProgress\) \{[\s\S]*state\.galleryCaptureEndRenderTimer = window\.setTimeout\(run, 50\);[\s\S]*debugEvent\("gallery:capture-end-render"/,
  },
  {
    name: "cold gallery-to-camera cover blocks gallery renders",
    pattern: /function isGalleryRenderBlockedByTransition\(\) \{\s*return state\.cameraGalleryTransitioning \|\| document\.body\.classList\.contains\("gallery-camera-returning"\);\s*\}/,
  },
  {
    name: "gallery DOM renders wait until camera slide ends",
    pattern: /function scheduleGalleryTransitionEndRender\(reason = "gallery-transition-end"\)[\s\S]*CAMERA_GALLERY_TRANSITION_MS - elapsed[\s\S]*isGalleryRenderBlockedByTransition\(\)[\s\S]*state\.debug\.galleryTransitionEndRenderCount \+= 1;[\s\S]*debugEvent\("gallery:transition-end-render"/,
  },
  {
    name: "first gallery load render is transition safe",
    pattern: /async function loadGalleryOnDemand\(options = \{\}\)[\s\S]*const renderReason = options\.reason \?\? "gallery-load";[\s\S]*renderGalleryWhenTransitionSafe\(renderReason\);/,
  },
  {
    name: "hidden gallery render defers during camera slide",
    pattern: /function scheduleGalleryHiddenRender\(reason = "background"\)[\s\S]*if \(isGalleryRenderBlockedByTransition\(\)\) \{\s*scheduleGalleryTransitionEndRender\(reason\);\s*return;\s*\}/,
  },
  {
    name: "transition-safe render helper also defers during visible capture",
    pattern: /function renderGalleryWhenTransitionSafe\(reason = "gallery-render"\)[\s\S]*if \(isGallerySurfaceVisible\(\) && state\.cameraCaptureInProgress\) \{\s*state\.galleryDirty = true;\s*scheduleGalleryCaptureEndRender\(reason\);\s*return;\s*\}/,
  },
  {
    name: "virtual gallery renders are transition safe",
    pattern: /renderGalleryWhenTransitionSafe\("gallery-virtual-refresh"\);[\s\S]*renderGalleryWhenTransitionSafe\("gallery-window-previous"\);[\s\S]*renderGalleryWhenTransitionSafe\("gallery-window-next"\);[\s\S]*renderGalleryWhenTransitionSafe\("gallery-render-more"\);/,
  },
  {
    name: "gallery settings renders are transition safe",
    pattern: /renderGalleryWhenTransitionSafe\("gallery-layout-change"\);[\s\S]*renderGalleryWhenTransitionSafe\("gallery-display-limit-change"\);[\s\S]*renderGalleryWhenTransitionSafe\("gallery-display-limit-loaded"\)/,
  },
  {
    name: "quick gallery-to-camera return uses warm path before cold start",
    pattern: /if \(returnFromWarmGallery\(reason\)\) \{\s*return;\s*\}\s*const returnStartedAt = options\.startedAt \|\| performance\.now\(\);/s,
  },
  {
    name: "gallery swipe prewarms cold camera return before release",
    pattern: /if \(distance >= GALLERY_CAMERA_PREWARM_DISTANCE\) \{\s*prepareCameraReturnFromGallery\("gallery-swipe-prewarm"\);\s*\}/s,
  },
  {
    name: "gallery swipe cancel stops prewarmed camera return",
    pattern: /function cancelPreparedCameraReturnFromGallery\(reason = "gallery-swipe-cancel"\)[\s\S]*stopCamera\(\{ force: true, skipGalleryLoad: true \}\);/,
  },
  {
    name: "camera prewarm preserves active gallery swipe state",
    pattern: /const preserveGallerySwipe = Boolean\(options\.preserveGalleryTransform && state\.gallerySwipe\.prewarmStarted\);[\s\S]*if \(!preserveGallerySwipe\) \{[\s\S]*state\.gallerySwipe\.prewarmToken = 0;[\s\S]*\}/,
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
    pattern: /const cameraControlsActive = state\.cameraActive && !state\.cameraGalleryDeferred && !state\.gifCaptureInProgress && !state\.videoCaptureInProgress;/,
  },
  {
    name: "debug report exposes warm gallery state",
    pattern: /warmGallery: state\.cameraGalleryDeferred/,
  },
  {
    name: "debug report exposes scheduled gallery frame renders",
    pattern: /frameRenderScheduled: state\.galleryFrameRenderScheduled,[\s\S]*captureEndRenderScheduled: Boolean\(state\.galleryCaptureEndRenderTimer\),[\s\S]*transitionEndRenderScheduled: Boolean\(state\.galleryTransitionEndRenderTimer\)/,
  },
  {
    name: "debug report exposes transition perf counters",
    pattern: /transitionPerf: \{\s*warmGalleryOpens:[\s\S]*galleryTransitionEndRenders: state\.debug\.galleryTransitionEndRenderCount,[\s\S]*lastGalleryTransitionEndRenderMs: state\.debug\.lastGalleryTransitionEndRenderMs,/s,
  },
];

const styleChecks = [
  {
    name: "mobile gallery surface is paint-contained",
    pattern: /\.mobile-gallery \{[\s\S]*contain: paint;/,
  },
  {
    name: "mobile gallery grid isolates layout and paint",
    pattern: /\.mobile-gallery__grid \{[\s\S]*contain: layout paint style;/,
  },
  {
    name: "gallery cards keep intrinsic containment",
    pattern: /\.mobile-gallery__item \{[\s\S]*contain: content;[\s\S]*content-visibility: auto;/,
  },
];

const failures = [
  ...checks.filter((check) => !check.pattern.test(appSource)),
  ...styleChecks.filter((check) => !check.pattern.test(stylesSource)),
];

if (failures.length) {
  console.error("Camera/gallery transition invariant check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Camera/gallery transition invariants ok (${checks.length + styleChecks.length} checks).`);
