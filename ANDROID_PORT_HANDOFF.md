# KONO CAM Android Port Handoff

Last updated: 2026-05-14 16:58 CEST

Purpose: help a future AI or engineer port KONO CAM to Android without rediscovering the current iOS/web architecture. Keep this file current whenever native camera, gallery, storage, effects, or build/distribution behavior changes.

## Current State

KONO CAM is a hybrid Capacitor app:

- Web UI and most app state live in `web/`.
- iOS native camera, gallery, haptics, orientation, hardware shutter, Photos save, and heavy final processing live in `ios/App/App/AppDelegate.swift`.
- Capacitor bridge plugin name is `KonoNativeBridge`.
- Correct iOS project is `ios/App/App.xcodeproj`.
- App ID is `com.konocam.app`.
- The camera UX is optimized around native iPhone capture, not browser `getUserMedia`.
- GitHub/AltStore release hosting exists, but should only be updated on explicit request because uploading the IPA is slow.

## Android Port Goal

The Android app should keep the existing web UI where practical, but replace iOS-only native behavior with a Kotlin/Java Capacitor plugin that exposes the same `KonoNativeBridge` JS API.

Best target architecture:

- Capacitor Android shell.
- Kotlin native plugin named `KonoNativeBridge`.
- CameraX for live preview and still capture.
- Native Android view or `PreviewView` behind/inside the WebView coordinate system.
- MediaStore for saving finished photos to a `KONO CAM` album.
- App-private file storage for local gallery full images and thumbnails.
- RenderScript is deprecated; use GPU/OpenGL ES/Vulkan/AGSL where practical, otherwise Kotlin CPU fallback only for small thumbnails or emergency paths.

## Important Files

- `web/app.js`: main state machine, capture flow, gallery loading, settings persistence, native bridge calls.
- `web/styles.css`: gallery/settings/drawer UI and camera shell CSS.
- `web/index.html`: settings controls and UI containers.
- `web/effectCatalog.js`: effect metadata and manual effect defaults.
- `web/spektraGrain.js`: web Spektra implementation/reference.
- `ios/App/App/AppDelegate.swift`: current native source of truth for iOS behavior.
- `capacitor.config.json`: Capacitor config and plugin registration.
- `KONO APP.md`: general devlog.
- `ANDROID_PORT_HANDOFF.md`: this Android-specific port log.

## Current Native Bridge Surface

The Android plugin should implement these methods with the same names and compatible payloads:

- `startCamera`
- `stopCamera`
- `switchCamera`
- `setPreviewRect`
- `setPreviewOffset`
- `setPreviewFlashOverlay`
- `hideStartupSplash`
- `setFlashEnabled`
- `setCropFactor`
- `setScreenBrightness`
- `hapticImpact`
- `startHardwareShutter`
- `startLevelGuide`
- `stopLevelGuide`
- `capturePhoto`
- `captureAndSavePhotoStack`
- `processPhoto`
- `processAndSavePhotoStack`
- `processAndSavePhoto`
- `listGalleryItems`
- `writeGalleryItem`
- `reprocessGalleryItem`
- `deleteGalleryItem`
- `saveGalleryItemToPhotos`
- `savePhoto`

Events currently expected by JS:

- `hardwareShutter`
- `nativeSpektraPendingPreview`
- Level-guide events from `startLevelGuide` behavior.

Porting advice: preserve method names first. If Android needs different internals, hide them behind the same bridge so `web/app.js` stays mostly unchanged.

## Native Camera Behavior To Recreate

iOS currently uses:

- `AVCaptureSession`
- `AVCapturePhotoOutput`
- `AVCaptureVideoPreviewLayer`
- Native preview clipping/masking.
- Motion-based orientation fallback for landscape capture.
- Native flash support where available.
- Native crop factor sync from web crop button.
- Hardware shutter via `AVCaptureEventInteraction` on iOS 17.2+.

Android equivalent:

- Use CameraX `Preview` + `ImageCapture`.
- Use `PreviewView` or a custom native view layered with Capacitor.
- Use `ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY` for shutter feel unless quality regression is unacceptable.
- Use `ImageCapture.OutputFileOptions` only after final processing if the app needs processed image output.
- For hardware shutter, handle volume key events in the Activity/plugin and route to JS/native capture. Android does not need the iOS volume-observer workaround.
- Use device rotation/orientation sensor plus display rotation. Do not rely only on Activity orientation if the UI is locked portrait.

## Gallery And Storage

Current iOS direction:

- Native local gallery lives under app Documents `NativeGallery`.
- Full-size JPEG is stored as a file.
- New captures store a separate `originalFileUrl` sidecar file beside the processed JPEG, so gallery preset changes can reprocess from the unedited source.
- Thumbnail JPEG is generated during write.
- JS renders metadata and thumbnail URLs, not full-size blobs.
- Native gallery list is paginated/lazy-loaded.
- Legacy IndexedDB blob gallery exists but should not be the long-term mobile path.
- Gallery viewer has a preset dropdown with favorite cameras first. Native `reprocessGalleryItem` overwrites the processed image/thumbnail in place while preserving the original sidecar.
- While gallery reprocess runs, the web viewer immediately shows a blurred preview from `originalFileUrl`; B&W target presets add grayscale to that preview.

Android target:

- Store local gallery files in `context.filesDir/NativeGallery` or `context.getExternalFilesDir(Environment.DIRECTORY_PICTURES)/NativeGallery`.
- Store one metadata JSON per image or one indexed JSON database file. Prefer simple file-backed records at first.
- Store both processed output and original sidecar for every new capture. Metadata should expose `fileUrl`, `thumbnailFileUrl`, and `originalFileUrl`.
- Generate thumbnail files during save.
- Return `file://` or Capacitor-convertible URIs to JS for thumbnails and full images.
- Save public copies to MediaStore under album/relative path `Pictures/KONO CAM`.
- Never render full-size images in gallery grids.
- Implement `reprocessGalleryItem` against the original sidecar, not the processed JPEG. For legacy items without originals, fallback to current `fileUrl`.

## Processing Pipeline

Current intended final-save order:

1. Native capture.
2. Normalize orientation, mirror, crop.
3. Apply camera LUT/tone where supported.
4. Apply manual effects.
5. Apply optional imported effects, including Spektra.
6. Apply overlays: grain, dust, light leak, vignette, date, prism/tilt where supported.
7. Save processed JPEG to Photos and native local gallery.
8. Generate thumbnail and update JS gallery.

Known iOS-specific processing:

- CoreImage is used for many image transforms/effects.
- Metal Spektra grain/glare exists in `AppDelegate.swift`.
- Spektrafilm full pipeline LUT support exists.
- Some complex NOMO camera layouts have special handling/fallback risk.

Android target processing options:

- Use Android `Bitmap` + Kotlin CPU only for first functional pass.
- Move heavy effects to GPU as soon as possible.
- Candidate GPU stacks: OpenGL ES fragment shaders, Vulkan compute, or AGSL/RuntimeShader where API level allows.
- Use `androidx.exifinterface` to read/write orientation metadata if any file path preserves EXIF.
- Prefer physically rotating pixels for local gallery thumbnails/full image parity, because the existing app expects gallery/saved photos to look horizontal when shot horizontal.

## Spektra Port Notes

Spektra is performance-sensitive.

Current iOS state:

- Spektra can use `SpektraMetalRenderer`.
- There is a Swift CPU fallback.
- Debug metrics include `spektraApplied`, `spektraPreset`, `spektraMode`, `spektraBackend`, `spektraFullPipelineApplied`, `spektraError`, and `spektraMs`.
- User cares whether Spektra visibly applies and whether processing time is acceptable.

Android recommendation:

- Do not start with a slow full-resolution CPU implementation as the final answer.
- First implement a compatible no-crash native path with debug metrics.
- Then port grain/glare to GPU.
- Keep the same debug metric names so existing reports remain useful.

## Settings And Persistence

Settings currently use `localStorage` in `web/app.js`.

Important persisted settings include:

- selected camera
- favorite cameras
- theme and accent color
- gallery density
- half-size save
- minimal mode, now default-on for fresh installs
- haptic level guide, now default-on for fresh installs
- level guide zone, no longer user-selectable and hardcoded to `wide`
- focal length label, currently hidden from visible settings
- manual effects
- NOMO Grain now defaults to max value `10` for every camera when camera defaults are applied.
- imported effects such as Spektra
- disposable softness

Android port should not move settings native unless necessary. Keep web-owned settings and pass snapshots to native capture calls.

## Startup Expectations

The app is designed to feel camera-first:

- Startup should show a splash until camera is ready.
- Gallery loading should be lazy and must not block camera startup.
- Native camera queue and gallery queue are separate on iOS.

Android target:

- Start CameraX as early as possible after permission.
- Do not scan gallery on cold start.
- Do not load optional effect profiles unless selected.
- Keep a native startup/splash layer if Android native preview can cover the WebView before JS is ready.

## UI Boundary

Do not redesign the UI during an Android port unless explicitly requested.

Current UI:

- Gallery, Settings, camera list drawer, and favorites drawer are web UI.
- Camera live preview is native on iOS.
- Camera overlay/hit zones are mostly web/CSS, but preview positioning is coordinated with native.
- The flash visual overlay should sit between live preview and camera overlay.

Android target should preserve the same boundary at first:

- Native preview behind web overlay.
- Web camera shell/hit zones remain unchanged.
- Bridge handles preview rect/offset/crop.

## Risks And Traps

- Do not use browser `getUserMedia` as the main mobile camera path.
- Do not store full-size gallery blobs in IndexedDB on mobile.
- Do not force portrait output for fallback captures.
- Do not trust EXIF orientation alone if gallery display ignores it.
- Do not update GitHub/AltStore release unless explicitly requested.
- Do not make Spektra CPU-only at full resolution and call it finished.
- Be careful with complex camera overlays/layouts; some are memory-heavy and historically crash-prone.
- Keep debug reports rich. They are the main field diagnosis tool.

## Android Implementation Plan

1. Add Capacitor Android platform if absent: `npx cap add android`.
2. Create Android `KonoNativeBridge` plugin with all method stubs.
3. Implement camera permission and `startCamera`/`stopCamera` with CameraX preview.
4. Implement preview rect/offset/crop bridge.
5. Implement simple native capture that saves an unprocessed JPEG to local gallery and MediaStore.
6. Implement local gallery list/write/delete/save using file-backed records and thumbnails.
7. Wire JS native eligibility to Android without changing iOS behavior.
8. Add orientation-correct capture output.
9. Port LUT/manual effects.
10. Port overlays and Spektra in priority order.
11. Add Android-specific debug metrics and compare with iOS reports.

## Update Protocol For Future Changes

When the app changes, update this file if the change affects Android porting:

- Native bridge method payloads or return values.
- Capture pipeline order.
- Gallery storage schema.
- Thumbnail behavior.
- Settings keys.
- Effect algorithms.
- Startup assumptions.
- Distribution/build assumptions.

Add entries below with date/time, what changed, why it matters for Android, and files touched.

## Android Port Change Log

### 2026-05-14 11:59 CEST - Initial Android Port Handoff

- Added this file as the Android-specific source of truth.
- Captured current hybrid Capacitor architecture, native bridge surface, iOS camera/gallery/effects responsibilities, Android equivalents, and porting risks.
- No Android implementation exists yet in this repo.

### 2026-05-14 12:31 CEST - Settings Surface Simplification

- Settings UI was simplified: desktop import controls, mobile capture open/take/close controls, reset/original/download buttons, focal length label toggle, and level-zone selector were removed from the visible settings page.
- Hidden DOM hooks remain for existing JS paths that still depend on those element IDs.
- Advanced Settings now contains manual Effects, Spektra Grain, Copy settings, and Debug report as the final item.
- Android port should treat level guide zone as `wide` unless a future UI reintroduces the selector.

### 2026-05-14 12:37 CEST - Max Grain Camera Defaults

- Added `CAMERA_DEFAULTS_BACKUP_2026-05-14.md` before changing defaults.
- All cameras now apply NOMO Grain value `10` after per-camera defaults load.
- Android port should mirror this in its default-effect application path, not only in the UI.

### 2026-05-14 12:48 CEST - Native Preview Swipe And Overlay Overscan

- Android-target idea only: camera-to-gallery swipe settle may need native preview offset animation in device-pixel units during the automatic slide.
- Android-target idea only: native preview offset scheduling may need coalescing so animation frames are not dropped while a bridge call is in flight.
- Android-target idea only: camera overlay frame may need aspect-ratio-specific overscan to avoid visible rounded overlay corners on different phones.
- The iOS/web implementation of this experiment was reverted at `2026-05-14 12:52 CEST` because it was requested for Android planning, not the current app.
- Android port should treat native preview movement and overlay movement as one coordinate system, including any device-pixel conversions.

### 2026-05-14 12:52 CEST - iOS Revert Of Android-Targeted Preview Experiment

- Reverted the current app's native preview offset retry loop, automatic swipe-settle offset animation, and CSS overlay overscan multiplier.
- Keep the idea above as an Android port consideration, but do not assume it is active behavior in the current iOS app.

### 2026-05-14 13:38 CEST - Gallery Original Sidecars And Preset Reprocess

- Gallery schema now includes `originalFileUrl` for native file-backed records.
- New native captures and native `writeGalleryItem` calls can persist an original sidecar beside the processed JPEG.
- Added native bridge method `reprocessGalleryItem`, which takes the existing processed file URL, original file URL, LUT/filter/effects payload, and overwrites the processed file plus thumbnail.
- Android should mirror this with app-private processed/original/thumbnail files and MediaStore save only for final exported copies.

### 2026-05-14 16:58 CEST - Gallery Reprocess Preview State

- During gallery preset reprocess, the viewer should immediately display the original sidecar/current source with a heavy blur.
- If the selected target preset is B&W, the temporary preview is grayscale plus blur.
- This is web UI behavior, but Android must still expose stable `originalFileUrl` values so the preview appears instantly without loading full processed blobs.
