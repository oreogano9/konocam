import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");
const nativeSource = readFileSync(new URL("../ios/App/App/AppDelegate.swift", import.meta.url), "utf8");

const checks = [
  {
    name: "settings expose long press action, GIF timing, boomerang, and focus distance",
    source: htmlSource,
    pattern: /id="shutterLongPressActionSelect"[\s\S]*value="gif"[\s\S]*value="focus"[\s\S]*id="gifDurationSelect"[\s\S]*value="0\.5"[\s\S]*value="10"[\s\S]*id="gifBoomerangToggle"[\s\S]*id="focusDistanceSelect"[\s\S]*value="closest"[\s\S]*value="far"/,
  },
  {
    name: "gallery viewer exposes GIF boomerang toggle",
    source: htmlSource,
    pattern: /id="galleryGifBoomerangControl"[\s\S]*id="galleryGifBoomerangToggle"/,
  },
  {
    name: "long press suppresses normal shutter click",
    source: appSource,
    patterns: [
      /const SHUTTER_LONG_PRESS_MS = 520;[\s\S]*beginShutterLongPress[\s\S]*event\.preventDefault\?\.\(\);[\s\S]*state\.shutterLongPressTriggered = true/,
      /function releaseShutterPointerCapture\(event\)[\s\S]*hasPointerCapture[\s\S]*releasePointerCapture\(event\.pointerId\)[\s\S]*Some WebViews throw if capture has already been released/,
      /function endShutterLongPress\(event\)[\s\S]*const wasLongPress = state\.shutterLongPressTriggered;[\s\S]*const hadPendingTap = Boolean\(state\.shutterLongPressTimer\);[\s\S]*state\.shutterPointerHandled = true;[\s\S]*if \(wasLongPress\)[\s\S]*if \(hadPendingTap\)[\s\S]*requestCameraCapture\(\{ source: "button" \}\)/,
      /function cancelShutterLongPress\(event\)[\s\S]*releaseShutterPointerCapture\(event\);[\s\S]*clearShutterLongPressTimer\(\);[\s\S]*state\.shutterPointerHandled = true;/,
      /handleCameraCaptureClick\(event\)[\s\S]*state\.shutterPointerHandled \|\| state\.shutterLongPressTriggered[\s\S]*event\?\.preventDefault\?\.\(\);/,
      /addEventListener\("contextmenu", \(event\) => event\.preventDefault\(\)\)/,
    ],
  },
  {
    name: "shutter controls suppress iOS callout and browser gesture defaults",
    source: cssSource,
    pattern: /\.camera-body-shutter \{[\s\S]*-webkit-touch-callout: none;[\s\S]*-webkit-user-select: none;[\s\S]*touch-action: manipulation;[\s\S]*user-select: none;/,
  },
  {
    name: "web dispatches GIF mode through native capture stack",
    source: appSource,
    patterns: [
      /function handleShutterLongPressAction\(\)[\s\S]*requestGifCapture\(\)/,
      /async function requestGifCapture\(\)[\s\S]*captureAndSaveNativeGifStack\(shotFilterFilename, selected\)/,
      /async function captureAndSaveNativeGifStack[\s\S]*nativeBridge\.captureAndSaveGifStack[\s\S]*durationSeconds[\s\S]*boomerang: state\.gifBoomerang/,
    ],
  },
  {
    name: "web treats GIF recording as a capture lock",
    source: appSource,
    patterns: [
      /function updateCameraCaptureLock\(\)[\s\S]*const locked = state\.cameraCaptureInProgress \|\| state\.gifCaptureInProgress/,
      /function stopCamera\(options = \{\}\)[\s\S]*if \(state\.gifCaptureInProgress && !options\.force\)[\s\S]*Recording GIF\. Wait for it to finish/,
      /function openGalleryFromCamera\(options = \{\}\)[\s\S]*if \(state\.gifCaptureInProgress && !options\.force\)[\s\S]*blockedBy: "gif-capture"/,
      /const gesturesAllowed = !state\.gifCaptureInProgress;[\s\S]*const shouldOpenCameraList =[\s\S]*&& gesturesAllowed[\s\S]*const shouldOpenGallery =[\s\S]*&& gesturesAllowed/,
    ],
  },
  {
    name: "web dispatches out of focus mode through native focus lock",
    source: appSource,
    patterns: [
      /function handleShutterLongPressAction\(\)[\s\S]*state\.shutterLongPressAction === "focus"[\s\S]*lockNativeFocus\(state\.focusDistance\)/,
      /async function lockNativeFocus[\s\S]*nativeBridge\.setFocusLock\(\{ distance: normalizedDistance \}\)/,
    ],
  },
  {
    name: "gallery boomerang toggle edits local GIFs only through native bridge",
    source: appSource,
    patterns: [
      /function syncGalleryGifBoomerangControl\(item\)[\s\S]*isGalleryGifItem\(item\)[\s\S]*nativeBridge\.setGalleryGifBoomerang[\s\S]*renderGalleryWhenTransitionSafe\("gallery-gif-boomerang"\)/,
      /state\.debug\.lastGalleryGifBoomerang = \{[\s\S]*outputFrameCount[\s\S]*normalGifBytes[\s\S]*loopMode/,
      /debugEvent\("gallery-gif-boomerang"[\s\S]*outputFrameCount[\s\S]*loopMode/,
      /function showGalleryViewerItem\(item\)[\s\S]*galleryViewerImage\.removeAttribute\("src"\);[\s\S]*galleryViewerImage\.src = url;/,
      /const nextItem = \{[\s\S]*cacheBust: Date\.now\(\),[\s\S]*showGalleryViewerItem\(nextItem\)/,
    ],
  },
  {
    name: "native bridge registers GIF capture, focus lock, and GIF boomerang methods",
    source: nativeSource,
    pattern: /CAPPluginMethod\(name: "captureAndSaveGifStack"[\s\S]*CAPPluginMethod\(name: "setFocusLock"[\s\S]*CAPPluginMethod\(name: "setGalleryGifBoomerang"/,
  },
  {
    name: "native GIF capture applies current stack before GIF encoding",
    source: nativeSource,
    pattern: /@objc func captureAndSaveGifStack[\s\S]*processPhotoData[\s\S]*renderNativeStack[\s\S]*applySpektraGrainIfNeeded[\s\S]*makeGifData[\s\S]*writeNativeGalleryItem[\s\S]*"mediaType": "gif"/,
  },
  {
    name: "native GIF capture waits for real fresh video frames with a bounded deadline",
    source: nativeSource,
    patterns: [
      /collectGifFrames\([\s\S]*targetCount: max\(1, Int\(\(request\.durationSeconds \* request\.fps\)\.rounded\(\)\)\),[\s\S]*deadline: Date\(\)\.addingTimeInterval\(request\.durationSeconds \+ 1\.5\)/,
      /if nextFrames\.count >= targetCount \|\| Date\(\) >= deadline[\s\S]*processGifCapture\(request: request, frames: nextFrames, targetCount: targetCount, frameAttempts: frameIndex \+ 1, deadlineReached: Date\(\) >= deadline, focusResetMode: focusResetMode\)/,
      /lastFrameAt: \.distantPast/,
      /capturedAt > lastFrameAt/,
      /Date\(\)\.timeIntervalSince\(capturedAt\) < 0\.75/,
      /"targetFrameCount": targetCount/,
      /"outputFrameCount": outputFrameCount/,
      /"normalGifBytes": normalGifData\.count/,
      /"loopMode": request\.boomerang \? "boomerang" : "normal"/,
      /"focusResetMode": focusResetMode/,
      /"frameAttempts": frameAttempts/,
      /"deadlineReached": deadlineReached/,
    ],
  },
  {
    name: "native focus lock is reset after captures and before GIF recording",
    source: nativeSource,
    patterns: [
      /private func resetFocusToAutofocusIfNeeded\(\) -> String[\s\S]*continuousAutoFocus[\s\S]*autoFocus/,
      /activeInput = input[\s\S]*resetFocusToAutofocusIfNeeded\(\)/,
      /self\.gifCaptureProcessing = true[\s\S]*let focusResetMode = self\.resetFocusToAutofocusIfNeeded\(\)[\s\S]*collectGifFrames\([\s\S]*focusResetMode: focusResetMode/,
      /let focusResetMode = self\.resetFocusToAutofocusIfNeeded\(\)[\s\S]*"focusResetMode": focusResetMode/,
      /let focusResetMode = resetFocusToAutofocusIfNeeded\(\)[\s\S]*"focusResetMode": focusResetMode/,
    ],
  },
  {
    name: "native Photos save marks GIF resources with GIF UTI",
    source: nativeSource,
    patterns: [
      /self\.savePhotoData\(outputGifData, filename: request\.filename\)/,
      /assetRequest\.addResource\(with: \.photo, data: data, options: self\.photoResourceOptions\(for: data, filename: filename\)\)/,
      /request\.addResource\(with: \.photo, data: data, options: self\.photoResourceOptions\(for: data, filename: filename\)\)/,
      /photoResourceOptions\(for data: Data, filename: String\? = nil\)[\s\S]*options\.uniformTypeIdentifier = isGif \? "com\.compuserve\.gif" : "public\.jpeg"[\s\S]*options\.originalFilename = normalizedPhotoResourceFilename\(filename, isGif: isGif\)/,
      /normalizedPhotoResourceFilename[\s\S]*return fallback/,
    ],
  },
  {
    name: "native focus lock supports closest and far lens positions",
    source: nativeSource,
    pattern: /@objc func setFocusLock[\s\S]*device\.isLockingFocusWithCustomLensPositionSupported[\s\S]*let targetLensPosition: Float = normalizedDistance == "far" \? 1\.0 : 0\.0[\s\S]*device\.setFocusModeLocked\(lensPosition: targetLensPosition\)[\s\S]*let actualLensPosition = device\.lensPosition[\s\S]*"targetLensPosition": targetLensPosition[\s\S]*"actualLensPosition": actualLensPosition[\s\S]*"customLensPositionSupported": true/,
  },
  {
    name: "web debug report exposes last GIF capture and focus lock evidence",
    source: appSource,
    patterns: [
      /lastGifCapture: null/,
      /lastFocusLock: null/,
      /state\.debug\.lastGifCapture = \{[\s\S]*outputFrameCount[\s\S]*targetFrameCount[\s\S]*deadlineReached[\s\S]*normalGifBytes[\s\S]*loopMode[\s\S]*focusResetMode/,
      /state\.debug\.lastFocusLock = \{[\s\S]*targetLensPosition[\s\S]*actualLensPosition[\s\S]*customLensPositionSupported/,
      /lastGifCapture: state\.debug\.lastGifCapture/,
      /lastFocusLock: state\.debug\.lastFocusLock/,
    ],
  },
  {
    name: "native gallery lists GIFs and can re-encode normal or boomerang",
    source: nativeSource,
    patterns: [
      /\["jpg", "jpeg", "gif"\]\.contains/,
      /@objc func setGalleryGifBoomerang[\s\S]*gifFrameImages\(from: originalData\)[\s\S]*makeGifData\(frames: decoded\.frames, frameDelay: decoded\.delay, boomerang: true\)/,
      /@objc func setGalleryGifBoomerang[\s\S]*"gifOutputFrameCount": outputFrameCount[\s\S]*"normalGifBytes": originalData\.count[\s\S]*"loopMode": boomerang \? "boomerang" : "normal"/,
    ],
  },
];

const failures = checks.filter((check) => {
  const patterns = check.patterns ?? [check.pattern];
  return patterns.some((pattern) => !pattern.test(check.source));
});

if (failures.length) {
  console.error("Long press mode invariant check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Long press mode invariants ok (${checks.length} checks).`);
