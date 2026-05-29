# KONO APP

Last updated: 2026-05-29 23:59 CEST

Canonical requested note path:
`/Users/konradparada/Library/Mobile Documents/iCloud~md~obsidian/Documents/Greenhouse/Dev/KONO APP.md`

Current blocker: macOS denies Codex access to the iCloud Obsidian folder with `Operation not permitted`. Until that permission is fixed, this local repo note is the fallback source of truth.

## Current App Shape

- Hybrid Capacitor iOS app with web UI in `web/` and native bridge in `ios/App/App/AppDelegate.swift`.
- Correct Xcode project: `ios/App/App.xcodeproj`.
- Mobile camera now defaults to native `AVCaptureSession` instead of browser `getUserMedia`.
- UI remains HTML/CSS/JS inside Capacitor.
- Gallery, Settings, camera list drawer, and favorites drawer now use the Concept B compact-camera UI direction with dark mode as the default and adaptive theme options.
- Desktop/import workflows still use the web renderer.

## Devlog

### 2026-05-29 23:59 CEST - AltStore Build 5 Publish Prep

- Request: push the current capture performance/reliability changes when possible.
- Change: bumped the iOS build number from `4` to `5` so AltStore can detect the update.
- Change: preparing a GitHub commit and AltStore release publish to `oreogano9/konocam`.
- Verification: latest local checks before publish: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.

### 2026-05-29 23:56 CEST - Random Cam Native Capture Prep

- Request: continue improving capture snappiness without changing camera behavior.
- Change: Random Cam shots on the native camera path now use a capture-only filter selection branch that applies the picked camera/settings and loads LUT bytes, but skips unnecessary WebGL preview texture upload and render work before native capture.
- Change: added a debug event for this capture-only filter selection path so reports can distinguish Random Cam prep from normal visible filter loading.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-29 23:50 CEST - Overlay Decode Cache

- Request: keep improving capture/app snappiness without changing behavior.
- Change: overlay image loading now uses shared path-level image and promise caches, so startup warm-up, foreground rendering, and camera save processing do not decode the same overlay PNGs concurrently.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-29 23:48 CEST - Background Photos Export For Native Captures

- Request: keep making capture feel snappier and safer without changing the visible camera behavior too much.
- Change: native final-stack captures now resolve after the processed JPEG and local app-gallery item are written, instead of blocking the next queued shot on iOS Photos album export.
- Change: iOS Photos export now continues in the background and emits a `nativePhotoSaveComplete` event with success/failure timing for debug history and status feedback.
- Change: capture status now explicitly says when a shot is already saved to the local gallery and still exporting to Photos in the background.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-29 23:37 CEST - Capture Asset Warm-Up

- Request: keep improving image capture snappiness and reliability without changing behavior too much.
- Change: the selected camera's LUT bytes and overlay assets now warm in the background when the app initializes and when the web/native camera becomes ready, reducing first-shot capture prep work.
- Change: background overlay warm-up is cache-only and no longer mutates the currently active overlay, so late preload completions cannot switch the active camera overlay after the user changes cameras.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-29 23:30 CEST - Shutter Queue Reliability Guard

- Request: improve capture reliability so repeated shutter presses feel safe and do not give false feedback.
- Change: queued shutter captures now keep their pending count until the delayed queued capture actually starts, preventing a queued shot from disappearing during the short drain delay.
- Change: queued capture draining now uses a single scheduled drain flag, avoiding overlapping drain timers when capture state changes quickly.
- Change: the native final-stack capture bridge now rejects new capture requests while a previous stack capture is still processing, not only while the camera JPEG is pending.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-29 23:13 CEST - Camera UI Churn Reduction

- Request: improve performance across the app and keep behavior stable.
- Change: native preview offset updates now round to half-pixel precision, skip duplicate offsets, and avoid overlapping `setPreviewOffset` bridge calls while a previous call is still in flight.
- Change: camera drawer selection syncing now uses a cache key for the selected camera and favorites set, avoiding repeated full button scans during frequent camera-state updates.
- Change: queued shutter taps now vibrate when the queued capture actually starts instead of when it is only accepted into the pending queue, reducing false “vibrated but no shot started yet” feedback.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-29 22:53 CEST - Virtualized Infinite Gallery Pass

- Request: after saving an edited gallery photo, make the gallery switch to the newly saved filter preview.
- Request: make infinite gallery possible without gallery performance collapsing as the image count grows.
- Change: edited-gallery Save now replaces the local app-gallery item, then reloads the viewer from the saved gallery file instead of leaving the temporary draft preview attached.
- Change: native gallery listing now pages lightweight file candidates first and parses only the requested metadata page, reducing startup and infinite-scroll work for large galleries.
- Change: native gallery page requests now reuse a cached sorted gallery index instead of rescanning and resorting the NativeGallery directory on every scroll page.
- Change: the native gallery index cache invalidates after gallery writes, replacements, and deletes so new captures and deleted files stay reflected.
- Change: native pagination now returns `nextOffset`, so stale metadata can be skipped without trapping the JS loader on the same page.
- Change: native gallery items now carry `galleryOffset` values so the web gallery can discard and later reload pages while keeping scroll math stable.
- Change: infinite gallery mode now uses a bounded virtual thumbnail window with top/bottom spacers instead of appending DOM cards forever.
- Change: infinite gallery mode now caps the loaded JS metadata window at 240 records, loading previous/next native pages as the user scrolls near the window edges.
- Change: new captures and Spektra pending previews now enter the gallery through the same front-insert path, keeping offsets and native totals consistent with the bounded metadata window.
- Change: gallery thumbnails now use async/low-priority image decoding, fixed thumbnail aspect, scroll-frame batching, and CSS containment to reduce gallery scroll pressure.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-26 01:36 CEST - Saved Gallery Edits Update Local Preview

- Request: after editing an existing gallery photo and tapping Save, switch the app-gallery image to the newly saved filter preview.
- Change: edited gallery Save still exports the draft to the iOS Photos `KONO CAM` album, but now also replaces the local app-gallery processed image and thumbnail with that saved draft.
- Change: added native `replaceGalleryItemData` so file-backed gallery records can be updated in place without creating duplicate local gallery items.
- Change: IndexedDB-backed gallery records now update their blob, thumbnail, filename, camera name, and inferred filter when the edited draft is saved.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-21 11:14 CEST - Gallery Display Limit Setting

- Request: add a Settings control for how many images the app gallery should show, with Default, double, double again, and Infinite options, then push the app update.
- Change: Settings now has a `Gallery images` selector with Default 30, Double 60, Double again 120, and Infinite.
- Change: finite gallery limits cap visible gallery cards and preload enough native gallery records to fill the selected cap.
- Change: Infinite keeps lazy-loading beyond the finite caps and shows an experimental slowdown warning under the setting.
- Change: bumped the iOS build number to `4` so AltStore can detect the pushed update.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.

### 2026-05-21 11:07 CEST - Gallery Edit Drafts And Multi-Select Delete

- Request: make gallery preset changes preview-only until Save, and add long-press multi-select deletion for app-gallery items.
- Change: gallery preset changes now render an in-memory draft preview and no longer write local gallery records, thumbnails, or replacement images while browsing presets.
- Change: added native `processPhotoStack` as a no-save preview renderer that reuses the native final-stack path and returns a JPEG data URL without writing Photos or local gallery files.
- Change: viewer Save now exports the current edited draft to the iOS Photos `KONO CAM` album and leaves the app gallery unchanged.
- Change: added long-press gallery selection mode with selected counts, Cancel, Delete, and a confirmation that selected items are removed only from the app gallery, not from iOS Photos.
- Change: original sidecar JPEGs stay hidden from native gallery scans, and local deletion continues removing processed, original, thumbnail, and metadata files.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-21 10:50 CEST - Gallery Preset Reprocess Fixes

- Request: fix gallery preset editing sometimes showing/saving originals, repair repeated preset changes, and make the preset list match camera-mode order.
- Change: native gallery listing now ignores `-original-` sidecar JPEGs, so originals used for reprocessing do not appear as normal gallery images.
- Change: gallery image, thumbnail, and favorite-preview URLs now support cache-busting after in-place native reprocess, so repeated preset changes reload the updated file instead of showing a stale cached image.
- Change: the gallery preset dropdown now follows the same filter order as camera mode; favorites stay marked with a star but no longer reorder the list.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Debug build passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-16 11:55 CEST - Camera Gallery Transition Hardening

- Request: performance-check the weird camera-to-gallery and gallery-to-camera behavior, preload gallery images when camera opens, and always return to camera mode after app background/screen lock.
- Change: camera startup now schedules a background gallery metadata and first-batch thumbnail preload as soon as camera opening begins, without rendering gallery DOM until gallery mode actually needs it.
- Change: native camera stop/start now has a stop barrier so gallery-to-camera returns do not race an unfinished native `stopCamera`.
- Change: upward camera-to-gallery settle now animates the native preview offset with the web overlay, reducing the live-view uncoupling after finger release.
- Change: app lifecycle handlers now arm camera-mode restore on hidden/pagehide and reopen camera mode on visible/pageshow.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 16:58 CEST - Gallery Processing Preview

- Request: while a gallery preset is applying, instantly show a blurred unprocessed preview; if the target preset is B&W, show the preview in blurred B&W.
- Change: gallery preset reprocessing now swaps the viewer image to the original sidecar/current source immediately before processing starts.
- Change: the processing state now uses a stronger Gaussian-style CSS blur, dimming, and grayscale for B&W camera presets.
- Change: preview object URLs are cleaned up when the viewer opens, closes, finishes, or fails processing.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 13:38 CEST - Gallery Preset Reprocess

- Request: add a way to change the gallery image preset after taking a picture, with favorite cameras first in the dropdown, applied to the original unedited photo.
- Change: added a `Preset` dropdown to the gallery image viewer; favorite cameras are pinned first and other cameras follow.
- Change: new native gallery saves now keep an `originalFileUrl` sidecar next to the processed image, so future preset changes reprocess from the original capture instead of stacking filters on an already edited JPEG.
- Change: added native `reprocessGalleryItem` to overwrite the processed gallery image and thumbnail in place while preserving the original sidecar.
- Change: old gallery items without an original sidecar fall back to reprocessing from their current image.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 12:59 CEST - AltStore Update Build 2

- Request: push to GitHub so the app can update through AltStore.
- Change: bumped the iOS build number from `1` to `2` so AltStore can detect the update.
- Change: preparing a GitHub commit and AltStore release publish to `oreogano9/konocam`.

### 2026-05-14 12:57 CEST - Disable Camera Button Press Overlays

- Request: stop showing the see-through button press overlays because they look glitchy.
- Change: disabled `CAMERA_OVERLAY_FEEDBACK`, which removes CSS-only visual press/active feedback for shutter, crop, flash, and facing controls.
- Kept: the actual camera PNG overlay, hit zones, and button behavior remain unchanged.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 12:52 CEST - Revert Android-Targeted Swipe/Overscan Edit

- Request: undo the previous live-preview swipe-follow and overlay stretch change because it was intended for the future Android version, not this iOS/web app.
- Change: removed the native preview offset retry loop added for automatic camera-to-gallery settle.
- Change: removed the automatic native preview offset animation when committing the upward swipe to gallery.
- Change: removed the camera overlay overscan multiplier and aspect-ratio overscan rules.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 12:48 CEST - Swipe Preview Follow And Overlay Overscan

- Problem: during upward camera-to-gallery swipe, the live native view followed drag but could uncouple during the automatic settle animation.
- Reverted: this entry was undone at `2026-05-14 12:52 CEST` because the request was meant for Android planning, not this app build.
- Change: native preview settle offset now uses device-pixel screen height, matching the bridge coordinate system used by preview rects.
- Change: native preview offset scheduling now coalesces to the latest requested offset instead of dropping animation updates while a previous bridge call is in flight.
- Change: camera overlay frame now slightly overscans the screen and increases overscan on unusually wide/tall phone aspect ratios, reducing visible rounded-corner leaks.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 12:37 CEST - Max Grain Defaults For All Cameras

- Request: back up the current default settings for all cameras, then make grain max by default for every camera.
- Change: added `CAMERA_DEFAULTS_BACKUP_2026-05-14.md` with the pre-change effective defaults table for all 54 cameras.
- Change: added `DEFAULT_NOMO_GRAIN_VALUE = 10` and force-applied it in `applyFilterEffectDefaults()`, so every selected camera starts with NOMO Grain at the current max.
- Change: updated `ANDROID_PORT_HANDOFF.md` so a future Android port mirrors the same default behavior.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 12:31 CEST - Settings Simplification And Defaults

- Request: make dark mode background fully black, simplify Settings, hide legacy/import controls, default Minimal Mode and Haptic Level Guide on, and make level guide use the widest zone without a selector.
- Change: dark theme now uses true black app/gallery/settings backgrounds instead of accent gradients.
- Change: visible Settings now removes Open photo, NOMO filter, Filter intensity, Mobile Capture open/take/close controls, reset/show-original/download buttons, focal length label toggle, level-zone selector, and explanatory helper copy.
- Change: added an `Advanced settings` disclosure that contains Effects, Spektra Grain, Copy settings, and Debug report as the last item.
- Change: Minimal Mode and Haptic Level Guide default to enabled for fresh installs; level guide zone is hardcoded to `wide`.
- Change: updated `ANDROID_PORT_HANDOFF.md` with the settings/default implications for a future Android port.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.
- Scope note: GitHub/AltStore release was not updated.

### 2026-05-14 11:59 CEST - Android Port Handoff Doc

- Request: create a new markdown file to help another AI port KONO CAM to Android in the future.
- Change: added `ANDROID_PORT_HANDOFF.md` with current app architecture, native bridge method list, camera/gallery/effects/storage state, Android equivalents, traps, and a future update protocol.
- Scope note: no Android code was added.

### 2026-05-14 11:57 CEST - GitHub Release Title Cleanup

- Request: make `KONO CAM 1.0` show as just `KONO CAM` on the AltServer/GitHub page.
- Change: updated `npm run altstore:github` so the GitHub Release title uses only the app name.
- Change: republished release `altstore-v1.0-1` with title `KONO CAM` while keeping the stable source URL unchanged.
- Verification: `node --check scripts/publish-altstore-github.mjs`, `npm run check:web`, `npm run altstore:github`, and `gh release view` passed.

### 2026-05-14 11:51 CEST - AltStore About Copy

- Request: make the AltStore About text say `KONO CAM - Don't think, take photos`.
- Change: updated AltStore source and app metadata subtitle/description in `altstore/source.config.json`.
- Change: republished GitHub release assets through `npm run altstore:github`, keeping the same stable source URL.
- Verification: live `curl` parse of `https://github.com/oreogano9/konocam/releases/latest/download/source.json` shows the corrected About copy.

### 2026-05-14 11:30 CEST - GitHub AltStore Hosting

- Request: host the shareable AltStore source on `https://github.com/oreogano9/konocam`.
- Change: initialized `oreogano9/konocam` with a minimal README pointing to the stable AltStore source URL.
- Change: added `npm run altstore:github`, which regenerates the AltStore source for GitHub Releases and publishes `KONO-CAM.ipa`, `source.json`, and `icon.png`.
- Change: published release `altstore-v1.0-1` with the current 138,746,761-byte IPA.
- Source URL: `https://github.com/oreogano9/konocam/releases/latest/download/source.json`.
- Verification: `node --check scripts/publish-altstore-github.mjs`, `npm run check:web`, `npm run altstore:github`, `gh release view`, and a live `curl` parse of the hosted `source.json` passed.

### 2026-05-14 11:23 CEST - AltStore Shareable Source Tooling

- Request: start with the shareable AltStore source right away.
- Change: added `altstore/source.config.json` as the editable source/app metadata for KONO CAM.
- Change: added `npm run altstore:ipa` to sync Capacitor, archive the iOS app, and package `dist/altstore/KONO-CAM.ipa`.
- Change: added `npm run altstore:source` to generate AltStore Classic `source.json`, copy the app icon, include IPA byte size, and include camera/photo privacy permissions.
- Change: added `ALTSTORE.md` with the exact build, generate, host, and update flow for sharing the source with friends.
- Verification: `node --check scripts/generate-altstore-source.mjs`, `node --check scripts/build-altstore-ipa.mjs`, `npm run check:web`, a fake-IPA `npm run altstore:source` generation test, real `npm run altstore:ipa`, and placeholder-host `npm run altstore:source` passed.
- Output: generated `dist/altstore/KONO-CAM.ipa`, `dist/altstore/source.json`, and `dist/altstore/icon.png`; source URLs still need the real HTTPS host instead of the placeholder.

### 2026-05-14 11:14 CEST - Dark Default And Accent Color Setting

- Request: make dark mode the default and add accent color controls below Theme.
- Change: new installs now default the UI theme to `Dark` instead of `System`; existing saved theme choices still persist.
- Change: added an `Accent color` settings block with preset swatches and a custom color picker.
- Change: accent color is stored in localStorage and applied through `--ui-accent` / `--ui-accent-strong`, so the orange/amber UI accents can be recolored.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.

### 2026-05-11 20:06 CEST - Concept B Gallery And Settings Redesign

- Request: apply the approved Concept B minimal Japanese compact-camera mockup to the app UI.
- Change: redesigned Gallery, Settings, camera list drawer, and favorites drawer around warm off-white/dark charcoal theme tokens, thin dividers, compact rows, restrained amber/clay accents, and softer photo/card geometry.
- Change: kept the actual camera live-view surface, camera overlay, hit zones, native preview mask, shutter behavior, and native bridge untouched.
- Change: added a persisted `Theme` setting with `System`, `Light`, and `Dark`; System follows `prefers-color-scheme`.
- Change: added a gallery photo count and renamed the gallery density toggle to `Compact gallery grid`.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, `git diff --check`, and Playwright CLI gallery screenshots in light/dark passed.

### 2026-05-10 21:38 CEST - Stability Hardening And Native Gallery Cleanup

- Request: harden app stability and clean up the native gallery path.
- Change: camera startup now has a `cameraStarting` guard plus start-token invalidation, so repeated taps/swipes cannot overlap stale native/web camera starts with stops.
- Change: camera/gallery/settings transitions now reset stuck swipe transforms, drawer state, gallery peek state, and native preview offsets at mode boundaries.
- Change: native file-backed gallery items now delete native-first and skip unnecessary IndexedDB delete transactions.
- Change: gallery broken-image cleanup now uses the same native-vs-legacy delete split and central state removal helper.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.

### 2026-05-10 21:25 CEST - Revert Reverse Gallery-To-Camera Slide

- Problem: the reverse gallery-to-camera slide transition seriously broke app behavior.
- Change: removed the `startCameraFromGallery()` transition helper and the temporary `camera-returning-gallery` CSS state.
- Change: gallery swipe-to-camera now calls the normal `startCamera()` path again.
- Change: the Gallery `Camera` button now calls the normal `startCamera()` path again.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.

### 2026-05-09 23:09 CEST - Remove RetroArch Presets And Restyle Focal Label

- Request: remove the RetroArch shader dropdown and make the `28mm` / `35mm` / `50mm` label smaller, regular weight, and positioned in the right viewfinder corner.
- Change: removed the RetroArch-style imported effect dropdown from the web UI and imported-effects payload.
- Change: removed the native Swift final-save RetroArch-style preset pass and helper drawing functions.
- Change: focal label now uses smaller regular-weight text, still inverted with `mix-blend-mode: difference`, and anchors to the right side of the viewfinder.
- Verification: `node --check web/app.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-09 23:02 CEST - Reverse Gallery-To-Camera Slide

- Request: make sliding back from gallery to camera use the same animation as camera-to-gallery, but reversed.
- Change: added a gallery-return transition state that keeps the gallery visible while the camera workspace starts at `translateY(-100svh)` and slides back to `0`.
- Change: gallery swipe-to-camera and the Gallery `Camera` button now use the same reverse transition helper.
- Change: native preview offset is animated during the return so the live camera follows the sliding camera shell, then the preview rect is resynced at the final position.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.

### 2026-05-09 22:56 CEST - Viewfinder Focal Label Fix

- Problem: the optional `28mm` / `35mm` / `50mm` viewfinder label could be clipped and was rendered below the camera PNG overlay.
- Change: moved the label out of the preview-slot stacking layer and onto the camera-frame layer so it can sit above the overlay while still using the viewfinder CSS geometry.
- Change: made the label roughly 3x larger, heavier, non-wrapping, and positioned from the top-left corner of the viewfinder to avoid clipping.
- Change: switched the label to white with `mix-blend-mode: difference` so it inverts against whatever is underneath.
- Verification: `npm run check:web` and `npm run ios:copy` passed.

### 2026-05-09 22:42 CEST - Disposable Softness MTF Retune

- Problem: first Disposable Softness pass could feel slightly milky because it included a low-opacity highlight bloom component.
- Research note: better lens-softness simulation should model MTF/detail falloff: suppress high-frequency detail and edge sharpness, especially off-center, without lifting blacks or adding broad glow.
- Change: removed highlight bloom from Disposable Softness.
- Change: retuned native CoreImage processing toward small-radius center detail attenuation, negative unsharp-mask microcontrast reduction, and stronger radial edge blur.
- Verification: `node --check web/app.js`, `node --check web/effectCatalog.js`, `npm run check:web`, and unsigned iOS Xcode build passed.

### 2026-05-09 22:40 CEST - Optional Viewfinder Focal Label

- Request: add a tiny `28mm`, `35mm`, or `50mm` label in the lower-left of the live view, rotated 90 degrees clockwise, and make it toggleable in settings.
- Change: added a persisted `Show focal length label` setting in Mobile Capture settings. It defaults off.
- Change: the camera viewfinder now renders a tiny black focal-length label inside the live preview slot when enabled.
- Change: the label updates with the crop mode button and is included in debug/settings reports as `focalLabelEnabled`.
- Verification: `node --check web/app.js`, `node --check web/effectCatalog.js`, `npm run check:web`, and `npm run ios:copy` passed.

### 2026-05-09 22:30 CEST - Disposable Softness Filter

- Request: add an optional off-by-default filter that makes photos feel softly disposable-camera-like without using plain Gaussian blur.
- Change: added `Disposable Softness` under the Optical settings group with values 0-3. Default remains off.
- Change: native final-save eligibility now allows `disposableSoftness`, so supported camera captures stay on the Swift/CoreImage stack.
- Change: Swift native processing now applies disposable softness after LUT/manual tone and before grain/overlays. The effect now focuses on MTF/detail falloff: subtle center softening, stronger radial corner softness, and fine-detail rolloff without bloom.
- Verification: `node --check web/app.js`, `node --check web/effectCatalog.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-09 22:16 CEST - Shutter Acceptance Queue

- Problem: rapid shutter taps could vibrate on touch-down even when the later capture click was ignored because another capture was still saving.
- Finding: capture buttons triggered haptics through `pointerdown`, separate from the actual capture path. That made the phone feel like it took a picture before the app had accepted the shot.
- Change: removed premature button haptics and routed button plus hardware shutter through one `requestCameraCapture()` path.
- Change: if a shot is already saving, the app now queues up to four accepted shutter presses, vibrates only for accepted/queued shots, and starts queued captures sequentially.
- Change: debug reports now include `saveQueue.pendingCaptures`, with debug events for `capture:queued`, `capture:queued-start`, and `capture:queue-full`.
- Verification: `node --check web/app.js`, `npm run check:web`, and `npm run ios:copy` passed.

### 2026-05-09 22:10 CEST - Resume Crop Preview Stabilization

- Problem: if crop/zoom mode was active, switching away from the app and returning could make the live native viewfinder appear tiny or double-cropped.
- Finding: native preview zoom used an affine transform on `AVCaptureVideoPreviewLayer`. iOS can preserve/reapply layer state oddly across background/foreground, which risks stale or compounded scale/bounds behavior.
- Change: native preview crop now uses an oversized preview layer frame inside the clipped viewfinder window instead of affine scaling. The layer transform is reset to identity before each layout.
- Change: JS now re-sends native crop factor, preview offset, and preview rect on `resize`, `pageshow`, and visible `visibilitychange` events.
- Change: crop button updates now re-run native preview rect sync after the native crop factor call resolves.
- Verification: node --check web/app.js, npm run check:web, and npm run ios:copy passed.

### 2026-05-09 15:46 CEST - Native Startup Splash Layer

- Problem: the startup splash could show a black screen forever because the native camera shell can sit above the WebView, hiding the CSS/web splash.
- Change: Swift now installs a native `UIImageView` startup splash using `public/assets/startup/kono-startup.png` above the native camera shell.
- Change: added a `hideStartupSplash` native bridge method. JS calls it from `revealAppUi()` when camera readiness succeeds or when the app needs to reveal an error/non-mobile UI.
- Change: when native preview layout updates, Swift keeps the startup splash on top until it is explicitly removed.
- Verification: node --check web/app.js, npm run check:web, and npm run ios:copy passed.

### 2026-05-09 15:38 CEST - Startup Splash Until Camera Ready

- Request: show `/Users/konradparada/Downloads/ChatGPT Image May 9, 2026, 03_34_58 PM.png` while the app loads, and only show the real app UI after the camera is ready and operational.
- Change: copied the image into `web/assets/startup/kono-startup.png` and added a fixed full-screen startup splash layer to the initial HTML.
- Change: body now starts with `app-loading`; the app UI remains rendered but invisible underneath so native preview geometry can still be measured during camera boot.
- Change: `revealAppUi()` removes the splash after successful web or native camera readiness. It also reveals the UI on non-mobile/failure paths so errors are not hidden forever.
- Verification: node --check web/app.js, npm run check:web, and npm run ios:copy passed.

### 2026-05-05 00:39 CEST - Favorite Drawer Preview Loading

- Request: opening the right-side favorite camera slider should load gallery items so the favorite cards can populate their latest-shot previews.
- Change: opening the favorite camera drawer now triggers lazy gallery loading via `loadGalleryOnDemand()`, then re-renders the drawer if it is still open.
- Change: favorite camera preview thumbnails are rotated 90 degrees clockwise from the previous drawer orientation to better match the rotated favorites UI.
- Scope note: this only changes favorite drawer previews; main gallery thumbnails are unchanged.
- Verification: node --check web/app.js, npm run check:web, and npm run ios:copy passed.

### 2026-05-04 23:15 CEST - Camera Boot First Paint

- Problem: cold launch was faster, but the WebView could still flash a non-camera screen before JS finished opening the camera.
- Change: the static HTML now starts with a temporary `camera-boot camera-mode-active` state so the first painted mobile screen is the camera shell instead of gallery/settings/editor UI.
- Change: JS now treats `cameraForceOpenUntilStarted` as camera UI active, keeping the camera shell visible while native camera startup is in progress.
- Change: once the camera is active, JS removes the temporary boot state and normal camera/native camera classes take over.
- Verification: node --check web/app.js, npm run check:web, and npm run ios:copy passed.

### 2026-05-04 23:10 CEST - Camera-First Startup

- Request: make the app open into camera mode and become ready to shoot as fast as possible.
- Change: startup no longer opens IndexedDB or lists native gallery items. Gallery data now loads on demand when the gallery is opened.
- Change: Spektra profile loading was removed from startup. The Spektra profile now loads lazily only when Spektra rendering/fallback processing needs it.
- Change: native hardware shutter setup is no longer kicked from generic UI binding during boot; it starts when native camera startup runs.
- Change: native gallery list/write/delete/save-to-Photos operations now use a separate `galleryQueue`, so gallery file work cannot block `cameraQueue` camera startup/session work.
- Expected effect: cold launch should reach `Opening camera...` / `Native camera ready...` with less contention from gallery and optional effect setup.
- Verification: node --check web/app.js, npm run check:web, npm run ios:copy, and unsigned iOS Xcode build passed.

### 2026-05-04 22:11 CEST - Complex Camera Native Simple Fallback

- Problem: McDonald’s still crashed even after downscaling the queued fallback. The debug report showed no McDonald’s save event, meaning the app was likely dying before queued JS fallback debug could persist.
- Change: complex layout cameras in native camera mode now bypass the old JS/WebGL fallback entirely and save through a simplified native capture stack.
- Change: the simplified native path keeps native camera capture, LUT, crop/mirror, manual/native effects, Photos save, and native gallery write, but strips the complex NOMO frame/region/rotate stack for now.
- Change: debug reports now include `native-capture-simple:success` timing as a native timing event.
- Scope note: this is a crash-prevention fallback. McDonald’s/INS/Lunar special frames need a proper native port before they can be safely re-enabled at full layout fidelity.

### 2026-05-04 21:48 CEST - Complex Camera Crash Guard

- Problem: after routing McDonald’s and other complex NOMO layouts away from the incomplete native final stack, they could still hit a high-memory hybrid fallback path and crash on device.
- Change: native-camera fallback captures for complex layout cameras are now downscaled to the heavy-camera safety size before being queued.
- Change: native LUT + JS/CPU stack fallback now also downscales complex/frame-heavy cameras before bridge transfer and canvas processing, preserving the older layout stack while reducing WebView memory pressure.
- Scope note: this is a stability guard. Exact native McDonald’s/INS/Lunar layout parity still requires porting their special frame/rotate/region rules into Swift/Metal before re-enabling full native final stack.

### 2026-05-04 12:36 CEST - Native Stack Risk Audit

- Request: check whether other cameras have the same native frame/layout issue as McDonald’s.
- Finding: audited all NOMO camera metadata for stack overlays and complex layout markers. Risky cameras are `INS A`, `INS 70`, `Lonesome`, `McDonald’s`, `Lunar Rabbits`, and `620 B`.
- Change: native final-stack eligibility now excludes those complex layout cameras until their exact frame/water/blend/rotate/text semantics are ported natively.
- Change: native stack effect support now rejects camera stack effects with `only`, `region`, `replace=1`, or `fillmode=tiled` unless explicitly handled, preventing silent wrong native composites.
- Status: `135 M3` and `135 P` remain native-stack eligible because their current metadata is compatible with the implemented native behavior.
- Verification: node audit confirmed native stack support only for `135 M3` and `135 P` among stack-overlay cameras; node --check web/app.js, npm run check:web, npm run ios:copy, and unsigned iOS Xcode build passed.

### 2026-05-04 12:34 CEST - McDonald’s Frame Layout Fallback

- Problem: McDonald’s started saving with black bars and the frame edges inside the photo after it was routed through the native final stack.
- Finding: McDonald’s/Lunar Rabbits use NOMO-specific `Frame`, `RotateBack`, orientation-only blend/text metadata, and crop-to-photo frame regions that are not fully implemented in the native final stack yet.
- Change: McDonald’s and Lunar Rabbits are now excluded from native final-stack eligibility, so they fall back to the older web stack instead of using the incomplete native frame path.
- Scope note: this is a correctness fallback. A future native implementation should port the full McDonald’s/Lunar Rabbits frame/rotate/blend/text layout rules before re-enabling native final stack for these cameras.
- Verification: node --check web/app.js, npm run check:web, npm run ios:copy, and unsigned iOS Xcode build passed.

### 2026-05-04 12:15 CEST - Native Viewfinder Flash Layering

- Problem: after moving the camera shell native, the web flash/tint layer rendered above the native camera overlay.
- Change: added a native preview flash overlay view inside the native camera shell, positioned above the live preview viewfinder and below the native camera overlay image.
- Change: JS now asks native to show flash tint/pulse when native camera mode is active, and hides the old web flash/tint divs in native mode.
- Verification: node --check web/app.js, npm run check:web, npm run ios:copy, and unsigned iOS Xcode build passed.

### 2026-05-04 12:08 CEST - Native Camera Shell and Gallery Bridge Tightening

- Request: tighten overlay/gallery behavior by moving the camera shell toward native, keeping preview and overlay in one coordinate system, and cleaning up the native gallery bridge.
- Change: native iOS now creates a camera shell container containing both the `AVCaptureVideoPreviewLayer` viewfinder and a native `UIImageView` overlay loaded from the same overlay asset path as the web UI.
- Change: JS now sends both the full camera shell rect and the viewfinder rect to native on camera start/preview updates, plus the active overlay path, so native can position preview and overlay together.
- Change: native vertical swipe offset now moves the whole native shell container, not just the preview window, so the live view and overlay should stay coupled during drag and release animation.
- Change: in native camera mode the web overlay image and preview slot backgrounds are transparent; the web layer remains for buttons/hit zones while the native layer owns the visual camera shell.
- Change: native gallery records now include normalized file-backed/thumbnail-backed/processing/source/aspect/orientation metadata, and JS normalizes native gallery records before rendering.
- Verification: node --check web/app.js, npm run check:web, npm run ios:copy, and unsigned iOS Xcode build passed.

### 2026-05-04 10:36 CEST - Removed Experimental Creative Shader Toggles

- Request: remove the four custom shaders that were added for Cheap Plastic Lens, Film Gate Damage, Light Leak Engine, and Expired Film Chaos.
- Change: removed the `Creative Shaders` settings group and all four effect IDs from the web effect catalog.
- Change: removed web/fallback processing for those effects, including the dedicated Expired Film Chaos seed.
- Change: removed native iPhone final-stack processing for those effects, so final save behavior is back to the existing supported NOMO/manual/Spektra stack.
- Verification: node --check web/app.js, node --check web/effectCatalog.js, npm run check:web, npm run ios:copy, and unsigned iOS Xcode build passed.

### 2026-05-03 12:58 CEST - Spektrafilm Density Grain in Metal

- Request: continue the full-Metal Spektra work by making the Metal grain closer to the original Spektrafilm grain model.
- Change: the Metal Spektra pass now receives Kodak Gold 200 profile constants and the selected Spektra preset constants instead of using only generic procedural noise.
- Change: the shader now works in density space: sRGB input is linearized, converted to optical density, processed through three channels and three sublayers with layer max-density, particles-per-pixel, uniformity, density-minimum, dye-cloud, and microstructure terms, then converted back to RGB.
- Change: `Neutral` still applies a luminance-weighted density delta to avoid color shift, while `Original Density` uses per-channel density deltas for closer Spektrafilm behavior.
- Change: successful Metal runs now report `spektraBackend: "metalSpektrafilmGrain"` so phone debug reports can confirm the new path is active.
- Scope note: this is a profile-driven density-domain Metal approximation of Spektrafilm grain, not exact pixel-for-pixel parity with SciPy Poisson/binomial RNG and Gaussian blur yet. Exact parity would need a validation harness and multi-pass Metal blur/RNG work.
- Verification: `node --check web/app.js`, `node --check web/spektraGrain.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 12:52 CEST - Spektrafilm Full-Pipeline LUT

- Request: make Spektra run the full original Spektrafilm film/print/scanner simulation instead of only the standalone grain approximation.
- Change: generated a 32³ native LUT from the upstream Spektrafilm Python runtime using `kodak_gold_200 -> kodak_portra_endura`, with the deterministic `FilmingStage -> PrintingStage -> ScanningStage` color pipeline baked into `web/spektrafilm/luts/kodak_gold_200_portra_endura_full_pipeline_32.rgb`.
- Change: native Spektra now applies that full-pipeline LUT before the Metal grain/glare pass, so Spektra saves include the original film/print/scanner color transform plus native Metal grain/glare.
- Change: added `scripts/generate-spektrafilm-full-pipeline-lut.py` so the baked LUT can be regenerated from the original Spektrafilm source.
- Debug: native timing metrics now report `spektraFullPipelineApplied` and `spektraFullPipeline`.
- Scope note: the color pipeline is baked from the original runtime; stochastic/spatial effects are still handled in app through native Metal grain/glare rather than running the Python runtime on iPhone.
- Verification: LUT generation succeeded, `node --check web/app.js`, `node --check web/spektraGrain.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 12:40 CEST - Safe Camera Stop During Capture

- Problem: device logs showed `stopCamera` being called while `captureAndSavePhotoStack` was still finishing, followed by AVFoundation `FigCaptureSourceRemote` assertions.
- Finding: native `stopCamera` guarded the old raw capture path but not the newer native stack capture processing window after `AVCapturePhoto` returned.
- Change: Swift now treats native stack post-processing as capture-in-progress until Photos/gallery save resolution finishes, and rejects camera stop during that window.
- Change: JS now defers camera closing if a capture is in progress, then runs the requested close/settings/gallery transition after the capture finishes.
- Note: the `UIScene lifecycle will soon be required`, CoreMotion managed-preferences permission, sandbox extension, and WebKit query-parameter messages in the log are system warnings/noise, not the actual install blocker shown by this trace.
- Verification: `node --check web/app.js`, `node --check web/spektraGrain.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 12:34 CEST - Metal Spektra Grain and Glare Pass

- Request: move the current Spektra grain work to Metal and add glare with `active: true`, `percent: 0.25`, `roughness: 0.70`, and `blur: 0.50`.
- Change: native Spektra now tries a Metal compute renderer first for procedural grain plus highlight glare before falling back to the old Swift CPU path.
- Change: native timing metrics now report `spektraBackend` so debug reports can show `metal`, `swiftCpuFallbackAfterMetalError`, or `swiftCpuFallbackNoMetal`.
- Change: native timing metrics now report `spektraGlare` with the active glare values when the Metal/Spektra pass is applied.
- Scope note: this is a Metal-native Spektra grain/glare pass, not a full port of the upstream Spektrafilm film/print/scanner pipeline yet.
- Verification: `node --check web/app.js`, `node --check web/spektraGrain.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 12:26 CEST - Spektra Pending Gallery Preview

- Request: show something in gallery while long Spektra shots are still processing.
- Change: native Spektra capture now emits a `nativeSpektraPendingPreview` event after the real captured frame is normalized and before the slow Spektra pass starts.
- Change: gallery inserts a temporary blurred preview card from that captured frame, with a loading spinner and `Processing` label.
- Change: when the final native Spektra save resolves, the temporary card is replaced in-place with the final native gallery item instead of adding a duplicate.
- Change: if native Spektra fails, the temporary card is removed so the gallery does not keep a fake stuck image.
- Spektrafilm/Metal note: full Spektrafilm import is not done in this pass. The upstream runtime is a multi-stage pipeline (`FilmingStage -> PrintingStage -> ScanningStage`) with film/profile transforms, couplers, print paper, scanner, LUT/spectral services, and grain. Porting that correctly means a dedicated Metal renderer, not just toggling the current Swift CPU Spektra loop.
- Verification: `node --check web/app.js`, `node --check web/spektraGrain.js`, `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 12:14 CEST - Landscape Upside-Down Correction

- Problem: landscape output finally rendered as horizontal, but both landscape directions were 180 degrees wrong/upside down.
- Change: swapped the final landscape render transforms for `landscapeLeft` and `landscapeRight` without changing output dimensions, cropping, gallery metadata, or orientation detection.
- Expected result: clockwise and counterclockwise landscape shots should still save/display horizontally, but now with the correct side up.

### 2026-05-03 12:06 CEST - Spektra Grain Modes

- Request: Spektra should support both current no-color-shift behavior and a closer original-density behavior.
- Change: Spektra Grain now has an internal mode selector with `Neutral` and `Original Density`.
- Change: `Neutral` keeps the existing luminance-density grain modulation to avoid color shifts.
- Change: `Original Density` applies per-channel density deltas from the Spektrafilm grain model, so it is closer to the original density behavior but can shift color.
- Native: Swift receives the selected mode through `importedEffects.spektraGrain.mode` and reports the applied mode in `spektraMode`.
- Performance note: this is still JS/Swift CPU. The 27s native Spektra timing requires a real Metal compute pass next; this mode change is not the Metal optimization.

### 2026-05-03 12:00 CEST - Landscape Output Diagnosis Pass

- Problem: landscape photos were still appearing vertical in gallery/Photos.
- Investigation: parallel native/web diagnosis found two likely causes: capture orientation could silently fall back to portrait, and two-column gallery thumbnails were forced into a portrait `3:4` crop.
- Change: native capture now keeps the `AVCapturePhotoOutput` connection in portrait and uses physical/motion orientation only for the final processed JPEG rotation, avoiding double-orientation/cropping behavior.
- Change: capture orientation detection now prefers CoreMotion gravity, caches the last valid physical orientation, and reports `orientationSource`, `deviceOrientation`, and gravity values in native timing metrics.
- Change: native gallery records now store output pixel width/height and orientation, so JS can distinguish horizontal files.
- Change: two-column gallery thumbnails no longer force `3:4` portrait cropping; landscape files should display as horizontal thumbnails.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 11:50 CEST - KONO CAM Photos Album

- Request: saved iPhone photos should land in a Photos album named `KONO CAM`.
- Change: the native PhotoKit save path now requests read/write Photos access when needed, creates or reuses the `KONO CAM` album, and adds each newly saved asset to that album.
- Change: the Photos permission copy now explicitly says KONO CAM uses access to create/reuse the album and save finished photos there.
- Safety: if album permission is denied or album save fails, the app falls back to the existing add-only Recents save path so captures are not lost.

### 2026-05-03 11:42 CEST - Explicit Horizontal Landscape Output

- Problem: landscape captures must appear as horizontal images in gallery and Photos, but the previous orientation path could rely on iOS image-orientation behavior too much.
- Change: every native capture now first renders the normal portrait output, then explicitly rotates that finished image into a horizontal canvas for landscape-left or landscape-right captures.
- Change: `landscapeLeft` rotates counterclockwise and `landscapeRight` rotates clockwise, producing a real horizontal JPEG instead of a vertical JPEG with orientation ambiguity.
- Change: the JS fallback path now uses the same portrait-first, rotate-after model, so fallback gallery/saved files also become horizontal when shot horizontal.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 11:26 CEST - Camera Swipe Coupling and Rotation Regression Fix

- Problem: during the camera-to-gallery swipe, the native live view followed the overlay while the finger was dragging, but stopped following when the release animation took over.
- Change: the web release animation now drives a matching native preview-offset animation until the camera closes or snaps back, so the live view should stay coupled to the overlay hole for the whole transition.
- Problem: the previous landscape rotation patch could double-rotate/crop captures, including portrait shots that should have stayed vertical.
- Change: native normalization now draws `UIImage` with its capture orientation honored into the requested portrait or landscape output canvas instead of manually rotating raw pixels a second time.
- Change: fallback JS native-photo cropping no longer manually rotates the decoded image; it keeps the landscape canvas size and lets the decoded image orientation render into it.
- Change: motion fallback thresholds are stricter and only used after explicit `UIDevice` orientation, reducing false landscape detection from small sideways tilt.
- Verification: `npm run check:web`, `node --check web/spektraGrain.js`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 11:14 CEST - Spektra Stage Diagnostics

- Problem: a fresh phone debug report still showed `spektraApplied: false` with the generic `Unable to process native image` error, so the previous parser hardening was not enough to identify the real failing point.
- Change: native Spektra now throws stage-specific errors for decode, profile file load, profile table shape, invalid dimensions, RGBA conversion, grain loop, and JPEG encode.
- Change: profile parsing now accepts `[Double]`, `[NSNumber]`, and generic `[Any]` numeric arrays, and validates expected row/channel counts before using the tables.
- Expected result: if Spektra still fails, the next debug report should show a precise `spektraError` such as profile, RGBA, grain loop, or JPEG encode, instead of the generic native-image message.
- Verification: `npm run check:web`, `node --check web/spektraGrain.js`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 10:41 CEST - Spektra Profile Parser Fix

- Problem: debug reports showed `spektraApplied: false`, `spektraMode: ""`, and `spektraError: "Unable to process native image"`, proving Spektra was not being applied.
- Finding: the failure happened in around 18 ms, before the heavy grain algorithm could realistically run, so the likely failure point was native profile loading/parsing rather than the Spektra grain math.
- Change: native Spektra profile parsing now accepts JSON numbers through robust `Any`/`NSNumber` conversion for 1D, 2D, and 3D numeric tables instead of relying on strict `as? [Double]` casts.
- Expected result: `kodak_gold_200.json` should now load in the iOS bundle, allowing the native Spektra pass to reach the grain algorithm and report `spektraApplied: true` with `spektraMode: spatialOnlyNeutral`.
- Verification: `npm run ios:copy` and unsigned iOS Xcode build passed.

### 2026-05-03 00:20 CEST - Spektra Spatial-Only Mode

- Problem: native Spektra no longer crashed, but the visible image change could be effectively absent or too hard to distinguish from the base NOMO render.
- Decision: keep Spektra as a standalone spatial effect, not a full Spektrafilm color/development simulation.
- Change: Spektra now still uses the imported Spektrafilm density curves, three sublayer curves, particle model, microstructure, and dye-cloud/final blur.
- Change: instead of applying per-channel density deltas that can shift color, the Spektra result is converted into one neutral luminance density modulation and applied equally to RGB. This preserves hue/color while showing the Spektrafilm grain structure.
- Debug: native metrics now report `spektraMode: spatialOnlyNeutral` when the pass applies.
- Verification: `npm run check:web`, `node --check web/spektraGrain.js`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 00:14 CEST - Landscape Capture Rotation Fix

- Problem: landscape shots were still saving/displaying as portrait because the native app is interface-locked to portrait and capture orientation trusted `UIDevice.current.orientation` before motion data.
- Change: shutter-time orientation now prefers CoreMotion when it clearly detects landscape, so portrait UI lock no longer blocks landscape capture detection.
- Change: native capture normalization now rotates the raw captured pixels into the landscape output canvas instead of only swapping output width and height.
- Change: JS/native fallback capture crop now applies the same landscape pixel rotation before saving, so unsupported fallback paths do not force portrait output.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-03 00:02 CEST - Spektra Grain Parity Check

- Investigation: rechecked `/Users/konradparada/Documents/Codex/Spektrafilm/src/spektrafilm/model/grain.py`, `runtime/params_schema.py`, and the GUI grain preset tests against the web and Swift ports.
- Finding: the imported preset values match Spektrafilm's GUI grain presets: Very Low, Low, Medium, Strong, and Extreme.
- Finding: the grain pass correctly depends on Spektrafilm density curves and three sublayer curves; those are already imported through `kodak_gold_200.json` and used by both web and Swift.
- Finding: the full Spektrafilm development pipeline also has directional couplers before grain, but that is a broader film-color/development stage, not part of the standalone `Spektra Grain` control. It was not added because this control is meant to stay separate from NOMO color recipes.
- Change: Spektra Gaussian blur now uses Spektrafilm-style reflected edges and the same `int(3 * sigma + 0.5)` radius rule in both JS and Swift, instead of clamping image borders.
- Known limitation: native Spektra still uses Swift CPU stochastic sampling, not NumPy's exact RNG or handwritten Metal, so the exact random dot pattern will not match Spektrafilm pixel-for-pixel.

### 2026-05-02 23:52 CEST - Spektra Fail-Open Save Update

- Problem: when native Spektra failed, JS intentionally skipped fallback to avoid the old WebView crash path, which meant no photo appeared in the gallery.
- Change: native Spektra now fails open. If the Spektra grain pass throws, the app saves the filtered non-Spektra native image instead of rejecting the whole capture.
- Change: Spektra native processing max side is reduced from `1800` to `1200` to reduce memory/CPU pressure while the native Swift CPU implementation remains in place.
- Debug: native metrics now include `spektraError` when the Spektra pass fails, alongside `spektraApplied` and `spektraPreset`.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-02 23:32 CEST - Spektra Native Reliability Check

- Problem: Spektra Grain could appear to do nothing or fail silently because Swift read the JS bridge `enabled` value with a strict `Bool` cast.
- Change: native Spektra now accepts bridge booleans as `Bool`, `NSNumber`, or common string truthy values.
- Change: native Spektra now returns a structured apply result instead of only raw JPEG data.
- Debug: native timing metrics now include `spektraApplied` and `spektraPreset`, so reports can prove whether Spektra ran or was skipped.
- Verification: Spektra profile assets are present in both `web/spektrafilm/profiles/kodak_gold_200.json` and `ios/App/App/public/spektrafilm/profiles/kodak_gold_200.json`; `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-02 23:21 CEST - Native Gallery Action Update

- Problem: saving an opened native gallery image to Photos still fetched the full file through JS as a blob/dataUrl.
- Change: Swift now exposes `saveGalleryItemToPhotos`, which validates the native gallery file path, reads the JPEG directly from app storage, and saves it to Photos without WebView blob conversion.
- Change: JS gallery save now uses `saveGalleryItemToPhotos` for file-backed native records and falls back to the old blob/share/download path only for legacy IndexedDB records.
- Debug: native gallery save/delete actions now emit success/error debug events with item id and filename.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-02 23:08 CEST - Native Gallery Pagination Update

- Problem: the WebView still received the full native gallery list at startup, which scales poorly as the local gallery grows.
- Change: Swift `listGalleryItems` now accepts `offset` and `limit`, returns only that slice, and includes `total` plus `hasMore`.
- Change: JS initial gallery load now requests only the first native page, then requests additional native pages as the user scrolls near the bottom.
- Fallback behavior: legacy IndexedDB gallery items are still supported, but they are loaded only after native pages are exhausted or when there are no native records.
- Debug: gallery debug output now includes `nativeOffset`, `nativeTotal`, `nativeHasMore`, `nativeLoading`, and `legacyLoaded`.
- Verification: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build passed.

### 2026-05-02 20:48 CEST - Gallery Viewer Metadata Update

- Problem: some gallery items displayed `Camera unknown` because older/native file-backed records could have missing, null, or generic camera metadata.
- Change: gallery viewer now resolves missing camera names from saved filenames like `analoguecam-camera-4-...jpg` by mapping the embedded `camera-N` id back to the loaded NOMO camera catalog.
- UI change: the gallery viewer close `×` now sits in a separate image stage wrapper outside the photo corner, instead of overlapping the image border.
- Verification: `npm run check:web` passed.

### 2026-05-02 11:11 CEST - Gallery Memory Update

- Problem: iPhone gallery could crash from loading too many full-size shots at once.
- Change: gallery cards now use small 480px thumbnail blobs instead of pulling full-res photos into the grid.
- Change: full-size images load only when the user opens a shot or saves/shares it.
- Cleanup: broken gallery records now get deleted whether they came from native file storage or old IndexedDB blob storage.
- Performance: removed the auto-render loop that kept loading more gallery cards until the screen was overfilled.
- Known risk: old saves generate thumbnails lazily the first time they appear, so the first scroll through old shots may still do a little work.

### 2026-05-02 11:33 CEST - Native Gallery Update

- Problem: browser/IndexedDB gallery storage was still acting as the main gallery store.
- Change: Swift now owns native gallery listing through `listGalleryItems`.
- Change: Swift now writes native gallery items through `writeGalleryItem`, including full JPEG, 480px thumbnail JPEG, and sidecar JSON metadata.
- Change: native capture stack results now go straight into the JS gallery from native records instead of being mirrored back into IndexedDB.
- Fallback behavior: JS fallback saves now try native file-backed gallery storage first, then only fall back to IndexedDB if the native bridge fails or is unavailable.
- Cleanup: native delete now removes the full image, thumbnail, and metadata sidecar together.
- Remaining issue: Rainbow is still intentionally blocked from native eligibility because there is no native Rainbow pass yet; grain/dust/light leak/vignette are already native when the selected camera is eligible.

### 2026-05-02 12:01 CEST - Spektra Grain Native Port

- Problem: Spektra Grain was forcing the mobile save path back through JS/CPU/WebGL fallback.
- Change: Swift now receives the Spektra Grain imported-effect state during native capture/save.
- Change: native final-stack saves no longer reject Spektra Grain automatically.
- Change: Swift now loads the same bundled Kodak Gold 200 Spektrafilm profile and applies the current Spektra grain math natively after the NOMO overlay/frame stack, matching the web stage order.
- Performance guard: the Swift port processes Spektra one channel/layer plane at a time instead of allocating the full JS density-layer cube at once.
- Debug: native timing metrics now include `spektraMs` when the Spektra pass runs.
- Remaining issue: this is native Swift CPU, not handwritten Metal yet. If `spektraMs` is still high on phone, Spektra is the next obvious Metal shader target.

### 2026-05-02 12:23 CEST - Tap Interaction Cleanup

- Problem: iOS long-press selection was grabbing app UI/text like it was a web page.
- Change: global app UI now disables text selection, touch callouts, drag highlights, and tap highlights while keeping text fields/textareas selectable.
- Problem: rapid crop-button taps could send a bad tiny native preview rectangle and shrink the live viewfinder.
- Guardrail: JS now caches the last good native preview rect and ignores tiny/off-screen rects; Swift also refuses preview rects below 80px and falls back to the previous/full frame instead of shrinking.
- UX swap: gallery image `×` is now close, the old `Close` button is now `Delete`, and tapping the viewer backdrop closes the image.
- Spektra guard: fixed native RGBA pixel-buffer drawing and capped Spektra native saves to the heavy-effect max side for now; if native Spektra fails, the app avoids the old full-res JS fallback path that was likely crashing the WebView.

### 2026-05-02 12:32 CEST - Hardware Shutter Upgrade

- Problem: volume-button shutter was unreliable because it used the old system-volume-change workaround.
- Change: iOS 17.2+ now uses Apple’s `AVCaptureEventInteraction` as the primary hardware shutter path.
- Change: the app fires capture only on the official `.ended` event and ignores it if camera capture is already busy.
- Fallback preserved: older iOS still uses the hidden `MPVolumeView` / `AVAudioSession.outputVolume` observer workaround.
- Debug: JS now logs `hardware-shutter:ready` with either `captureEventInteraction` or `volumeFallback`.

### 2026-05-02 12:51 CEST - Landscape Favorites Drawer

- Change: camera mode now has a second drawer opened by swiping right-to-left.
- UI: the new drawer content is rotated 90 degrees clockwise so the favorite camera grid reads naturally while the phone is held landscape.
- Loadout cards: each favorite camera renders as a square with its camera name and the latest matching local-gallery thumbnail from that camera.
- Visual rule: favorite thumbnails use the saved photo thumbnail unfiltered; only the text receives a shadow for readability.
- Gesture treaty: left-to-right still opens the full camera list, right-to-left opens favorites, and vertical gallery swipe is blocked while either drawer is open.
- Memory cleanup: temporary favorite thumbnail object URLs are revoked when the favorites drawer closes.

### 2026-05-02 13:12 CEST - Favorites Drawer Image Flip Fix

- Bug fix: favorite drawer thumbnails were inheriting the 90-degree drawer rotation and appeared upside down in the landscape menu.
- Change: thumbnail images now counter-rotate inside their square cards while the card text stays in the landscape-readable drawer orientation.
- Visual rule preserved: the photo thumbnail remains visually unfiltered; only positioning/rotation is corrected.

### 2026-05-02 20:15 CEST - Landscape Save Orientation Patch

- Bug fix: landscape shots could still save as portrait when iOS reported `.unknown`, `.faceUp`, or `.faceDown`, or when capture dropped into the JS fallback path.
- Change: native capture now records the shutter-time orientation and uses CoreMotion gravity as a backup orientation signal before falling back to the UI orientation.
- Fallback fix: native blob cropping in the web path now swaps output size for landscape captures instead of hard-locking every fallback image to `2688 x 4032`.
- Debug: fallback capture events now carry `orientation`, so a bad landscape save can be traced as native orientation failure vs fallback render failure.
- Verification cleared: `npm run check:web`, `npm run ios:copy`, and unsigned iOS Xcode build all passed.

### 2026-05-02 19:59 CEST - Preview Mask Sync Patch

- Change: favorite-camera cards now mark the active selected favorite with a bright rounded white outline.
- Problem: native live preview was chasing the web overlay during the upward gallery swipe.
- Change: Swift now owns a clipped native preview window view, keeps the `AVCaptureVideoPreviewLayer` inside it, and moves that window via a lightweight `setPreviewOffset` bridge call during swipe.
- Cleanup pass: Minimal Mode overlay corners now flood-fill transparent from corner-connected near-white pixels while preserving the viewfinder cutout.
- Camera tune: `135 GR` now overrides only NOMO grain to `10` and dust to `5`; crop, Minimal Mode, flash, facing, Spektra, and other effects remain user-controlled.

## Implemented

- NOMO camera/filter catalog imported into the web app.
- Camera overlays imported and mapped, including QuickSnap, Random Cam, BNW, Pink Translucent, Green Translucent, and #FR2/Kodak M35.
- Minimal Mode setting added: a persisted settings toggle that applies the Minimal Mode camera overlay to all camera presets while enabled. The Minimal overlay asset has a transparent viewfinder cutout generated from the white viewfinder area, and its camera-mode hit areas are remapped from the latest source overlay layout.
- Minimal Mode currently uses only the original/base Minimal Mode overlay image. The separate state overlays for flash-on, pressed buttons, and front/selfie toggle were rolled back for stability.
- Mobile full-screen camera mode with native camera preview behind the transparent WebView.
- Camera start/stop paths now use a startup guard and token invalidation to avoid overlapping stale camera opens with gallery/settings transitions.
- Native iOS status bar is hidden in the Capacitor app so clock/wifi/battery do not overlay app UI.
- Native camera controls: capture, flash, camera switch, crop factor, haptics, screen brightness for selfie flash, hardware volume shutter, level-guide haptics.
- Shutter taps now use an accepted-capture queue: button and hardware shutter presses vibrate only when the shot starts or is queued, and rapid accepted shots are serialized.
- Optional live viewfinder focal-length label can show the current crop mode as `28mm`, `35mm`, or `50mm`; it defaults off.
- Native camera preview now uses a Swift clipped preview-window view plus `setPreviewOffset` for gallery-swipe tracking, instead of resizing the preview layer on every swipe frame.
- Hardware shutter uses Apple’s official `AVCaptureEventInteraction` on iOS 17.2+ and falls back to the older volume-observer workaround on older iOS.
- Hardware volume shutter now listens via both `AVAudioSession.outputVolume` KVO and iOS system volume-change notifications, with debug events emitted as `hardware-shutter`; the hidden `MPVolumeView` is reattached if the native root view changes.
- Gallery with local saved shots, delete, save/share, optional two-column layout, lazy scroll loading, thumbnail-backed grid rendering, stale broken-image cleanup, and debug report.
- Gallery and Settings support a persisted `Theme` selector: `System`, `Light`, or `Dark`; the default is now `Dark`.
- Gallery and Settings support a persisted accent color setting with swatches and custom color input.
- Native gallery deletion is native-first for file-backed records and avoids unnecessary IndexedDB transactions.
- Gallery viewer behavior: `×` closes, `Delete` deletes, backdrop tap closes.
- Native gallery records now include full-size file URL, thumbnail file URL, camera name, and created timestamp sidecar metadata.
- Random Cam camera selection and random preset capture behavior.
- Right-to-left camera-mode swipe opens a rotated favorites drawer with square favorite-camera cards and each camera’s latest matching shot thumbnail.
- Favorite drawer cards show the current selected favorite camera with a white rounded outline.
- B&W camera grouping/flags.
- Manual effects UI and strict visible effect catalog.
- Optional `Disposable Softness` optical filter is available in settings and defaults to off. Native captures apply it through CoreImage as radial cheap-lens MTF/detail falloff, not a flat blur or milky bloom.
- Final save routing prefers native Swift/CoreImage stack when supported.
- Native/CoreImage final save supports LUT, intensity, manual tone controls, sharpen, NOMO grain/dust/light leak/vignette overlays, and supported frame/blend/water stack overlays.
- Native final save now supports Spektra Grain for eligible non-Rainbow cameras, using the imported Spektrafilm Kodak Gold 200 profile and the same preset names: Very Low, Low, Medium, Strong, Extreme.
- Spektra Grain has two modes: `Neutral` for no color shift and `Original Density` for closer per-channel density behavior with possible color changes.
- Spektra native saves apply a baked full Spektrafilm `kodak_gold_200 -> kodak_portra_endura` film/print/scanner color LUT before grain/glare.
- Spektra native saves now try a profile-driven density-domain Metal compute grain/glare pass first, with Swift CPU fallback if Metal cannot compile or run on device.
- Spektra Metal glare defaults are active with `percent: 0.25`, `roughness: 0.70`, and `blur: 0.50`.
- Spektra native saves currently use the heavy-effect max side safety cap to reduce memory pressure while the stochastic/spatial Spektrafilm runtime remains native-Metal rather than Python-on-device.
- Native one-shot capture path for supported live-camera shots: `AVCapturePhoto -> native crop/mirror -> CoreImage LUT/effects -> native overlay stack -> JPEG -> Photos + native file-backed gallery record`.
- Native Photos saves now create/reuse a `KONO CAM` album and add saved images there, with Recents-only fallback if album access is blocked.
- Native final stack timing metrics are now reported into debug JSON for real profiling: capture, decode/normalize, CoreImage, overlay compositing, gallery write, Photos save, total time, and byte sizes.
- Native final-stack captures now preserve shutter-time landscape orientation by swapping the saved output dimensions when the device is landscape.
- Native capture now uses motion gravity as a fallback for landscape detection when `UIDevice.current.orientation` is unknown/flat/face-up/face-down.
- Native capture now keeps the camera connection portrait and applies physical orientation only during final JPEG output rotation, reducing double-rotation/crop risk.
- Native gallery items include pixel width/height and capture orientation metadata for new saves.
- Native fallback/web processing now preserves landscape capture dimensions instead of forcing portrait output.
- Unsupported capture cases fall back to existing JS/WebGL/CPU paths instead of failing.

## Not Fully Native Yet

- A handwritten Metal compute path now exists for native Spektra grain/glare, using Spektrafilm profile/preset constants in density space.
- CoreImage is used for native final processing and may be Metal-backed internally by iOS.
- Live filtered preview is not a native Metal filtered preview.
- Spektra mode switching is implemented; the native path now attempts Metal first, with Swift CPU fallback.
- Full upstream Spektrafilm film/print/scanner color processing is baked into a native LUT, not evaluated dynamically from the Python runtime on iPhone.
- Full upstream stochastic/spatial Spektrafilm internals are not 1:1 Metal yet; current native handling is Metal grain/glare plus fallback Swift CPU grain.
- Rainbow camera remains JS CPU.
- Rainbow remains excluded from native final stack until a native Rainbow pass is implemented; removing that guard now would produce incorrect Rainbow output.
- Some legacy gallery behavior still reads IndexedDB records, but new native-capable saves prefer Swift file-backed gallery items.
- Some older gallery records can point to native files that no longer exist after rebuild/reinstall/cache cleanup; the UI now removes those stale records when the image load fails.
- Gallery cards now render 480px thumbnail blobs instead of full-size blobs/files. Full-size gallery images are loaded only when an item is opened or saved.
- Base64/dataUrl bridge traffic still exists for older fallback paths and selected-gallery save paths.
- WebGL renderer still exists for desktop/import, previews, and fallback exports.

## Suggested Next Implementations

- Move native file-backed gallery fully into Swift: list/load/delete/share/save-to-Photos through bridge methods, with JS only rendering returned records.
- Replace remaining `dataUrl` bridge calls with native file URLs or temporary file handles.
- Profile Spektra Grain on device through `spektraMs`, `spektraBackend`, and `spektraFullPipelineApplied`; if fallback appears, fix the Metal runtime path first.
- Port Rainbow camera to Swift/CoreImage or Metal if strict 1:1 behavior is still needed on native capture.
- Use the new native timing metrics from real phone debug reports to choose the first handwritten Metal target. Likely candidates are overlay compositing, procedural grain, or repeated LUT/effect renders, but decide from measured bottlenecks.
- Later, build native Metal/CoreImage live preview only if preview FPS remains a problem.

## Known Risks / Watch Items

- Native and JS output may differ slightly for manual tone effects because CoreImage filters approximate the existing WebGL/CPU formulas.
- Native capture path only handles cameras/effects marked eligible by JS routing; unsupported cameras fall back.
- Gallery contains mixed item types: old IndexedDB blob shots and newer native file-backed shots.
- First load after this thumbnail change may create thumbnails lazily for visible older records; after that, those records reuse stored thumbnails.
- iCloud/Obsidian note path currently inaccessible to Codex due macOS privacy permissions.
- `AppDelegate.swift` is doing too much: bridge, camera, CoreImage, haptics, motion, Photos, gallery file writes. It should eventually be split.
- Heavy overlay cameras can still be expensive at full size.
- Spektra Grain should be much faster when `spektraBackend` reports `metal`; debug `spektraMs` should still be watched because fallback can still use Swift CPU.
- During camera swipe, JS sends native preview offset updates during drag, but the Android-targeted automatic settle/overlay overscan experiment was reverted.
- Any future app change should update this note, and preferably the canonical Obsidian note once accessible.

## Verification Commands

- `npm run check:web`
- `node -e "JSON.parse(require('fs').readFileSync('web/nomo-cameras/cameras.json','utf8')); console.log('cameras.json ok')"`
- `npm run ios:copy`
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build`
