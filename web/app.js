import { EFFECT_CATALOG, EFFECT_DEFAULTS, EFFECT_GROUPS, VISIBLE_EFFECTS } from "./effectCatalog.js";
import { applySpektraGrainToRgba, loadSpektraProfile, SPEKTRA_GRAIN_EFFECT } from "./spektraGrain.js";

const canvas = document.querySelector("#processedCanvas");
const workspace = document.querySelector(".image-workspace");
const emptyState = document.querySelector("#emptyState");
const appStartupSplash = document.querySelector("#appStartupSplash");
const cameraShell = document.querySelector("#cameraShell");
const cameraPreview = document.querySelector("#cameraPreview");
const cameraPreviewSlot = document.querySelector("#cameraPreviewSlot");
const cameraPreviewGalleryButton = document.querySelector("#cameraPreviewGalleryButton");
const cameraFocalLabel = document.querySelector("#cameraFocalLabel");
const cameraFlash = document.querySelector("#cameraFlash");
const cameraFlashTint = document.querySelector("#cameraFlashTint");
const selfieScreenFlash = document.querySelector("#selfieScreenFlash");
const cameraDeviceOverlay = document.querySelector("#cameraDeviceOverlay");
const cameraFlashToggleButton = document.querySelector("#cameraFlashToggleButton");
const cameraFacingToggleButton = document.querySelector("#cameraFacingToggleButton");
const cameraCropToggleButton = document.querySelector("#cameraCropToggleButton");
const cameraPresetLabel = document.querySelector("#cameraPresetLabel");
const cameraLookSelect = document.querySelector("#cameraLookSelect");
const cameraListDrawer = document.querySelector("#cameraListDrawer");
const cameraList = document.querySelector("#cameraList");
const favoriteCameraDrawer = document.querySelector("#favoriteCameraDrawer");
const favoriteCameraGrid = document.querySelector("#favoriteCameraGrid");
const fileInput = document.querySelector("#fileInput");
const lookSelect = document.querySelector("#lookSelect");
const intensitySlider = document.querySelector("#intensitySlider");
const intensityValue = document.querySelector("#intensityValue");
const effectsRoot = document.querySelector("#effectsRoot");
const importedEffectsRoot = document.querySelector("#importedEffectsRoot");
const copySettingsButton = document.querySelector("#copySettingsButton");
const mobileGallery = document.querySelector("#mobileGallery");
const galleryGrid = document.querySelector("#galleryGrid");
const galleryEmpty = document.querySelector("#galleryEmpty");
const galleryCount = document.querySelector("#galleryCount");
const galleryCameraButton = document.querySelector("#galleryCameraButton");
const gallerySettingsButton = document.querySelector("#gallerySettingsButton");
const galleryViewer = document.querySelector("#galleryViewer");
const galleryViewerImage = document.querySelector("#galleryViewerImage");
const galleryViewerVideo = document.querySelector("#galleryViewerVideo");
const galleryViewerCamera = document.querySelector("#galleryViewerCamera");
const galleryPresetSelect = document.querySelector("#galleryPresetSelect");
const galleryGifBoomerangControl = document.querySelector("#galleryGifBoomerangControl");
const galleryGifBoomerangToggle = document.querySelector("#galleryGifBoomerangToggle");
const gallerySaveButton = document.querySelector("#gallerySaveButton");
const galleryCloseButton = document.querySelector("#galleryCloseButton");
const galleryDeleteButton = document.querySelector("#galleryDeleteButton");
const gallerySelectionBar = document.querySelector("#gallerySelectionBar");
const gallerySelectionCount = document.querySelector("#gallerySelectionCount");
const gallerySelectionCancelButton = document.querySelector("#gallerySelectionCancelButton");
const gallerySelectionDeleteButton = document.querySelector("#gallerySelectionDeleteButton");
const galleryTwoColumnToggle = document.querySelector("#galleryTwoColumnToggle");
const galleryDisplayLimitSelect = document.querySelector("#galleryDisplayLimitSelect");
const galleryDisplayLimitWarning = document.querySelector("#galleryDisplayLimitWarning");
const themeSelect = document.querySelector("#themeSelect");
const accentSwatches = document.querySelector("#accentSwatches");
const accentColorInput = document.querySelector("#accentColorInput");
const halfSizeSaveToggle = document.querySelector("#halfSizeSaveToggle");
const minimalModeToggle = document.querySelector("#minimalModeToggle");
const levelGuideToggle = document.querySelector("#levelGuideToggle");
const shutterLongPressActionSelect = document.querySelector("#shutterLongPressActionSelect");
const gifLongPressSettings = document.querySelector("#gifLongPressSettings");
const gifDurationSelect = document.querySelector("#gifDurationSelect");
const gifBoomerangToggle = document.querySelector("#gifBoomerangToggle");
const focusLongPressSettings = document.querySelector("#focusLongPressSettings");
const focusDistanceSelect = document.querySelector("#focusDistanceSelect");
const focalLabelToggle = document.querySelector("#focalLabelToggle");
const levelZoneSelect = document.querySelector("#levelZoneSelect");
const refreshDebugButton = document.querySelector("#refreshDebugButton");
const copyDebugButton = document.querySelector("#copyDebugButton");
const debugReport = document.querySelector("#debugReport");
const settingsGalleryButton = document.querySelector("#settingsGalleryButton");
const startCameraButton = document.querySelector("#startCameraButton");
const capturePhotoButton = document.querySelector("#capturePhotoButton");
const cameraCaptureButton = document.querySelector("#cameraCaptureButton");
const stopCameraButton = document.querySelector("#stopCameraButton");
const cameraSettingsButton = document.querySelector("#cameraSettingsButton");
const resetButton = document.querySelector("#resetButton");
const toggleEditsButton = document.querySelector("#toggleEditsButton");
const downloadButton = document.querySelector("#downloadButton");
const statusMessage = document.querySelector("#statusMessage");

const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true });
if (gl) {
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    state.webglContextLost = true;
    stopLiveCameraRender();
    debugEvent("webgl:lost", {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      cameraActive: state.cameraActive,
      queue: state.cameraSaveQueue.length,
    });
    setStatus("Renderer context was lost. Restart the app if preview stays black.");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    state.webglContextLost = false;
    debugEvent("webgl:restored");
    setStatus("Renderer context restored. Reopen camera if preview is wrong.");
  });
}

const NOMO_AES_KEY = new Uint8Array([
  0xee, 0x49, 0x83, 0xd7, 0x6f, 0x63, 0xd0, 0xc6,
  0x54, 0x79, 0xbc, 0x03, 0x1e, 0xa4, 0x24, 0x44,
]);
const ZERO_IV = new Uint8Array(16);
const LUT_WIDTH = 1024;
const LUT_HEIGHT = 32;
const LUT_PIXEL_BYTES = LUT_WIDTH * LUT_HEIGHT * 3;
const CAMERA_CATALOG_PATH = "./nomo-cameras/cameras.json";
const CAMERA_ASSETS_ROOT = "./nomo-cameras";
const OVERLAYS_ROOT = "./nomo/overlays";
const SPEKTRA_PROFILE_PATH = "./spektrafilm/profiles/kodak_gold_200.json";
const MOBILE_MEDIA_QUERY = window.matchMedia("(max-width: 900px)");
const GALLERY_DB_NAME = "analoguecam-gallery";
const GALLERY_DB_VERSION = 1;
const GALLERY_STORE_NAME = "shots";
const CAMERA_PERMISSION_STORAGE_KEY = "analoguecam-camera-permission";
const SELECTED_CAMERA_STORAGE_KEY = "analoguecam-selected-camera";
const FAVORITE_CAMERAS_STORAGE_KEY = "analoguecam-favorite-cameras";
const GALLERY_TWO_COLUMN_STORAGE_KEY = "analoguecam-gallery-two-column";
const GALLERY_DISPLAY_LIMIT_STORAGE_KEY = "analoguecam-gallery-display-limit";
const THEME_STORAGE_KEY = "analoguecam-theme";
const ACCENT_COLOR_STORAGE_KEY = "analoguecam-accent-color";
const HALF_SIZE_SAVE_STORAGE_KEY = "analoguecam-half-size-save";
const MINIMAL_MODE_STORAGE_KEY = "analoguecam-minimal-mode";
const LEVEL_GUIDE_STORAGE_KEY = "analoguecam-level-guide";
const LEVEL_ZONE_STORAGE_KEY = "analoguecam-level-zone";
const FOCAL_LABEL_STORAGE_KEY = "analoguecam-focal-label";
const SHUTTER_LONG_PRESS_ACTION_STORAGE_KEY = "analoguecam-shutter-long-press-action";
const GIF_DURATION_STORAGE_KEY = "analoguecam-gif-duration";
const GIF_BOOMERANG_STORAGE_KEY = "analoguecam-gif-boomerang";
const FOCUS_DISTANCE_STORAGE_KEY = "analoguecam-focus-distance";
const DEBUG_HISTORY_STORAGE_KEY = "analoguecam-debug-history";
const CAMERA_PERMISSION_GRANTED = "granted";
const CAMERA_PERMISSION_DENIED = "denied";
const CAMERA_PREVIEW_MAX_SIDE = 480;
const STILL_IMAGE_MAX_SIDE = 2200;
const MOBILE_SAVE_MAX_SIDE = 4032;
const HEAVY_CAMERA_SAVE_MAX_SIDE = 1200;
const GALLERY_RENDER_BATCH_SIZE = 30;
const GALLERY_DISPLAY_LIMIT_VALUES = new Set(["default", "double", "quad", "infinite"]);
const GALLERY_VIRTUAL_MIN_ITEMS = 90;
const GALLERY_VIRTUAL_OVERSCAN_ROWS = 4;
const GALLERY_METADATA_WINDOW_SIZE = 240;
const GALLERY_THUMBNAIL_ASPECT_RATIO = 0.72;
const GALLERY_THUMBNAIL_PRELOAD_ROWS = 5;
const GALLERY_THUMBNAIL_PRELOAD_MAX = 48;
const GALLERY_THUMBNAIL_MAX_SIDE = 480;
const GALLERY_THUMBNAIL_QUALITY = 0.76;
const CAMERA_GALLERY_TRANSITION_MS = 190;
const CAMERA_GALLERY_KEEP_WARM_MS = 3200;
const GALLERY_CAMERA_RETURN_MAX_WAIT_MS = 900;
const GALLERY_CAMERA_PREWARM_DISTANCE = 72;
const DEBUG_EVENT_LIMIT = 220;
const MOBILE_CAPTURE_WIDTH = 2688;
const MOBILE_CAPTURE_HEIGHT = 4032;
const MOBILE_CAPTURE_ASPECT_RATIO = MOBILE_CAPTURE_WIDTH / MOBILE_CAPTURE_HEIGHT;
const CAMERA_FLASH_SETTLE_DELAY_MS = 520;
const SELFIE_SCREEN_FLASH_SETTLE_DELAY_MS = 180;
const NATIVE_CAMERA_PREVIEW_MODE = true;
const USE_WEB_FILTERED_CAMERA_PREVIEW = false;
const CAMERA_PREVIEW_MIN_FRAME_INTERVAL_MS = 66;
const CAMERA_PREVIEW_SAVE_MIN_FRAME_INTERVAL_MS = 220;
const RANDOM_CAMERA_FILENAME = "__random-camera__";
const MAX_PENDING_SHUTTER_CAPTURES = 4;
const CAMERA_CROP_MODES = [
  { label: "28", factor: 1 },
  { label: "35", factor: 35 / 28 },
  { label: "50", factor: 50 / 28 },
];
const CAMERA_EFFECT_DEFAULT_OVERRIDES = {
  "camera-4": {
    nomoGrain: 10,
    dust: 5,
  },
};
const DEFAULT_NOMO_GRAIN_VALUE = 10;
const LEVEL_ZONE_VALUES = new Set(["precise", "normal", "wide"]);
const THEME_VALUES = new Set(["system", "light", "dark"]);
const SHUTTER_LONG_PRESS_ACTION_VALUES = new Set(["gif", "video", "focus"]);
const GIF_DURATION_VALUES = new Set(["0.5", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
const FOCUS_DISTANCE_VALUES = new Set(["closest", "far"]);
const THEME_MEDIA_QUERY = window.matchMedia?.("(prefers-color-scheme: dark)");
const DEFAULT_ACCENT_COLOR = "#c28538";
const ACCENT_SWATCH_VALUES = new Set(["#c28538", "#d56642", "#7f9a76", "#6f92a8", "#b66f8d"]);
const JPEG_EXPORT_QUALITY = 0.98;
const SHUTTER_LONG_PRESS_MS = 520;
const GIF_CAPTURE_FPS = 12;
const GIF_CAPTURE_MAX_SIDE = 960;
const COLOR_MATRIX = new Float32Array([
  0.24, 0.68, 0.08, 0.0,
  0.24, 0.68, 0.08, 0.0,
  0.24, 0.68, 0.08, 0.0,
  0.0, 0.0, 0.0, 1.0,
]);
const RAINBOW_CAMERA_ID = 26;
const NATIVE_FINAL_STACK_OVERLAY_EFFECT_IDS = new Set(["nomoGrain", "dust", "lightLeak", "vignette"]);
const NATIVE_FINAL_STACK_CAMERA_FILTER_TYPES = new Set(["frame", "blend", "water"]);
const CAMERA_OVERLAY_SOURCES = {
  quicksnap: "./assets/camera-overlays/fujifilm-quicksnap-rotated-overlay.png",
  random: "./assets/camera-overlays/randocam-rotated-overlay.png",
  bnw: "./assets/camera-overlays/konak-bnw-rotated-overlay.png",
  pinkTranslucent: "./assets/camera-overlays/seethrough-pink-rotated-overlay.png",
  greenTranslucent: "./assets/camera-overlays/seethrough-green-rotated-overlay.png",
  kodakM35: "./assets/camera-overlays/kodak-m35-rotated-overlay.png",
  minimal: "./assets/camera-overlays/minimal-mode-rotated-overlay.png",
};
const CAMERA_OVERLAY_BY_FILENAME = {
  "camera-53": "pinkTranslucent",
  "camera-23": "greenTranslucent",
  "camera-35": "kodakM35",
};
const CAMERA_OVERLAY_FEEDBACK = {
  enabled: false,
  shutterPress: true,
  cropPress: true,
  flashActiveBrightness: true,
  facingToggleSlide: true,
};
const RAINBOW_CONFIG = {
  random: "2",
  tilt1: 2,
  tilt2: 8,
  colors: [
    { key: "red", hex: "#cd2d20", rgb: [0xcd / 255, 0x2d / 255, 0x20 / 255] },
    { key: "yellow", hex: "#fabd24", rgb: [0xfa / 255, 0xbd / 255, 0x24 / 255] },
    { key: "pink", hex: "#ae276e", rgb: [0xae / 255, 0x27 / 255, 0x6e / 255] },
    { key: "green", hex: "#328a3b", rgb: [0x32 / 255, 0x8a / 255, 0x3b / 255] },
    { key: "orange", hex: "#ea851a", rgb: [0xea / 255, 0x85 / 255, 0x1a / 255] },
    { key: "blue", hex: "#0376b4", rgb: [0x03 / 255, 0x76 / 255, 0xb4 / 255] },
    { key: "purple", hex: "#7f1f74", rgb: [0x7f / 255, 0x1f / 255, 0x74 / 255] },
  ],
};

const NOMO_OVERLAY_PATHS = {
  nomoGrain: "grains_iso_400_jpg_50.jpg",
  vignette: "vignette_020_camera_jpg_70.jpg",
  dust: ["dust01.jpg", "dust02.jpg", "dust03.jpg"],
  lightLeak: [
    "leak_020_g05_jpg_50_left.jpg",
    "leak_035_g69_jpg_50_left.jpg",
    "leak_040_g55_jpg_50_right.jpg",
    "leak_060_g09_jpg_50_bottom.jpg",
  ],
};
const DEBUG_SESSION_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const state = {
  source: null,
  stillImage: null,
  stillSourceName: "nomo-edit",
  sourceName: "nomo-edit",
  sourceTexture: null,
  lutTexture: null,
  lutRgbBytes: null,
  lookupTarget: null,
  effectsTarget: null,
  grainTexture: null,
  sourceResolution: { width: 1, height: 1 },
  showingOriginal: false,
  filters: [],
  filterMap: new Map(),
  filterEffectDefaults: new Map(),
  selectedFilterFilename: "",
  lutByteCache: new Map(),
  lutBytePromises: new Map(),
  aesKey: null,
  geometry: null,
  beforeHoldActive: false,
  cameraStream: null,
  cameraActive: false,
  cameraStarting: false,
  cameraStopping: false,
  cameraStopPromise: null,
  cameraStartToken: 0,
  nativeCameraActive: false,
  nativeCameraReady: false,
  nativeCameraPreviewSize: { width: MOBILE_CAPTURE_WIDTH, height: MOBILE_CAPTURE_HEIGHT },
  nativePreviewRectLastGood: null,
  cameraAnimationFrame: 0,
  lastLiveRenderAt: 0,
  cameraAutostartAttempted: false,
  cameraForceOpenUntilStarted: isMobileView(),
  cameraCaptureInProgress: false,
  gifCaptureInProgress: false,
  videoCaptureInProgress: false,
  videoNativeRecordingActive: false,
  videoCaptureStartPromise: null,
  videoCaptureStopPending: false,
  cameraPendingCaptureCount: 0,
  cameraPendingDrainScheduled: false,
  randomCameraEnabled: false,
  favoriteCameraFilenames: readStoredFavoriteCameras(),
  galleryTwoColumn: readStoredGalleryTwoColumn(),
  galleryDisplayLimit: readStoredGalleryDisplayLimit(),
  theme: readStoredTheme(),
  accentColor: readStoredAccentColor(),
  halfSizeSave: readStoredHalfSizeSave(),
  minimalMode: readStoredMinimalMode(),
  levelGuideEnabled: readStoredLevelGuide(),
  focalLabelEnabled: readStoredFocalLabel(),
  shutterLongPressAction: readStoredShutterLongPressAction(),
  gifDuration: readStoredGifDuration(),
  gifBoomerang: readStoredGifBoomerang(),
  focusDistance: readStoredFocusDistance(),
  levelZone: readStoredLevelZone(),
  levelGuideActive: false,
  nativeHardwareShutterReady: false,
  cameraPermissionState: readStoredCameraPermission(),
  cameraFlashEnabled: false,
  cameraTorchSupported: false,
  cameraFacingMode: "environment",
  cameraSwitching: false,
  cameraCropModeIndex: 0,
  cameraCropLastToggleAt: 0,
  cameraCropRenderTimer: 0,
  pendingCameraStopOptions: null,
  cameraPreviewCanvas: document.createElement("canvas"),
  cameraPreviewContext: null,
  webglContextLost: false,
  mobileSettingsOpen: false,
  galleryDb: null,
  galleryReadyPromise: null,
  galleryLoadPromise: null,
  galleryLoaded: false,
  galleryPreloadScheduled: false,
  galleryPreloadImages: [],
  galleryItems: [],
  galleryObjectUrls: [],
  favoriteCameraObjectUrls: [],
  galleryDirty: false,
  galleryRenderedCount: 0,
  galleryHiddenRenderScheduled: false,
  galleryFrameRenderScheduled: false,
  galleryCaptureEndRenderTimer: 0,
  galleryTransitionEndRenderTimer: 0,
  galleryRenderMoreScheduled: false,
  galleryVirtualStart: 0,
  galleryVirtualEnd: 0,
  galleryVirtualAbsoluteStart: 0,
  galleryVirtualAbsoluteEnd: 0,
  galleryVirtualTopHeight: 0,
  galleryVirtualBottomHeight: 0,
  galleryVirtualItemHeight: 0,
  galleryWindowStartOffset: 0,
  galleryWindowLoadingPrevious: false,
  nativeGalleryOffset: 0,
  nativeGalleryHasMore: false,
  nativeGalleryLoading: false,
  nativeGalleryTotal: 0,
  legacyGalleryLoaded: false,
  nativeSpektraPendingListenerReady: false,
  nativePhotoSaveListenerReady: false,
  selectedGalleryItem: null,
  selectedGalleryObjectUrl: "",
  selectedGalleryLoadToken: 0,
  galleryPresetPreviewObjectUrl: "",
  galleryPresetProcessing: false,
  galleryPresetRenderToken: 0,
  galleryPresetDraft: null,
  gallerySelectionMode: false,
  gallerySelectedItemKeys: new Set(),
  galleryLongPressTimer: 0,
  galleryLongPressPointerId: null,
  galleryLongPressStartX: 0,
  galleryLongPressStartY: 0,
  galleryLongPressTriggered: false,
  shutterLongPressTimer: 0,
  shutterLongPressPointerId: null,
  shutterLongPressTriggered: false,
  shutterPointerHandled: false,
  cameraSaveQueue: [],
  cameraSaveProcessing: false,
  nomoOverlayImages: null,
  overlayImageCache: new Map(),
  overlayImagePromises: new Map(),
  cameraOverlayCache: new Map(),
  currentCameraOverlayImages: null,
  overlaySelections: {
    grain: 0,
    dust: 0,
    lightLeak: 0,
    vignette: 0,
    stackTransform: 0,
  },
  debug: readStoredDebugHistory(),
  effects: cloneEffectDefaults(),
  effectInputs: new Map(),
  importedEffects: {
    spektraGrain: {
      enabled: SPEKTRA_GRAIN_EFFECT.defaultEnabled,
      preset: SPEKTRA_GRAIN_EFFECT.defaultPreset,
      mode: SPEKTRA_GRAIN_EFFECT.defaultMode,
    },
  },
  spektraProfile: null,
  spektraProfilePromise: null,
  spektraRenderTimer: 0,
  importedEffectInputs: new Map(),
  canvasView: {
    zoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    lastX: 0,
    lastY: 0,
  },
  cameraSwipe: {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    axis: null,
    distance: 0,
    suppressNextListClick: false,
    startedInCameraList: false,
    startedInFavoriteDrawer: false,
    horizontalDirection: null,
  },
  nativePreviewRectFrame: 0,
  nativePreviewRectInFlight: false,
  nativePreviewOffsetFrame: 0,
  nativePreviewOffsetAnimationFrame: 0,
  nativePreviewOffsetInFlight: false,
  nativePreviewOffsetY: 0,
  nativePreviewOffsetSentY: null,
  cameraGalleryTransitioning: false,
  cameraGalleryDeferred: false,
  cameraGalleryOpenStartedAt: 0,
  cameraGalleryTransitionTimer: 0,
  cameraGalleryTransitionToken: 0,
  cameraGalleryStopTimer: 0,
  galleryCameraReturnTimer: 0,
  galleryCameraReturnToken: 0,
  galleryCameraReturnWaitingLogged: false,
  galleryCameraReturnRevealStarted: false,
  galleryCameraReturnRevealAt: 0,
  cameraListSelectionKey: "",
  cameraListOpen: false,
  favoriteCameraDrawerOpen: false,
  gallerySwipe: {
    active: false,
    pointerId: null,
    startY: 0,
    startScrollTop: 0,
    distance: 0,
    prewarmStarted: false,
    prewarmReason: "",
    prewarmStartedAt: 0,
    prewarmToken: 0,
  },
  restoreCameraOnResume: isMobileView(),
};

const defaults = {
  intensity: 100,
};
const CAMERA_DEFAULT_EFFECT_IDS = new Set(["nomoGrain", "dust", "vignette", "lightLeak"]);
const BNW_CAMERA_NAMES = new Set(["135 GR", "120 SG", "BOOTH", "135 M3", "ROMA", "Pen", "135 A", "620 B"]);

const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out highp vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const lookupFragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_lut;
uniform float u_intensity;
uniform float u_gridsize;
uniform float u_texwidth;
uniform float u_isBnW;
uniform mat4 u_colorMatrix;

in highp vec2 v_texCoord;
out vec4 outColor;

highp vec3 sampleLut(highp float redIndex, highp float greenIndex, highp float blueIndex) {
  highp float x = redIndex + blueIndex * u_gridsize + 0.5;
  highp float y = greenIndex + 0.5;
  return texture(u_lut, vec2(x / u_texwidth, y / u_gridsize)).rgb;
}

void main() {
  highp vec4 textureColor = texture(u_image, v_texCoord);

  highp vec3 scaled = clamp(textureColor.rgb, 0.0, 1.0) * (u_gridsize - 1.0);
  highp vec3 index0 = floor(scaled);
  highp vec3 index1 = min(vec3(u_gridsize - 1.0), index0 + 1.0);
  highp vec3 fraction = fract(scaled);

  highp vec3 c000 = sampleLut(index0.r, index0.g, index0.b);
  highp vec3 c100 = sampleLut(index1.r, index0.g, index0.b);
  highp vec3 c010 = sampleLut(index0.r, index1.g, index0.b);
  highp vec3 c110 = sampleLut(index1.r, index1.g, index0.b);
  highp vec3 c001 = sampleLut(index0.r, index0.g, index1.b);
  highp vec3 c101 = sampleLut(index1.r, index0.g, index1.b);
  highp vec3 c011 = sampleLut(index0.r, index1.g, index1.b);
  highp vec3 c111 = sampleLut(index1.r, index1.g, index1.b);

  highp vec3 c00 = mix(c000, c100, fraction.r);
  highp vec3 c10 = mix(c010, c110, fraction.r);
  highp vec3 c01 = mix(c001, c101, fraction.r);
  highp vec3 c11 = mix(c011, c111, fraction.r);
  highp vec3 c0 = mix(c00, c10, fraction.g);
  highp vec3 c1 = mix(c01, c11, fraction.g);
  highp vec3 newColor = mix(c0, c1, fraction.b);

  if (u_isBnW == 1.0) {
    textureColor = textureColor * u_colorMatrix;
  }

  outColor = mix(textureColor, vec4(newColor, textureColor.a), u_intensity);
}
`;

const effectsFragmentShaderSource = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_texelSize;
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_temperature;
uniform float u_tint;
uniform float u_fade;
uniform float u_highlight;
uniform float u_shadow;
uniform float u_sharpen;
uniform float u_vignette;

in highp vec2 v_texCoord;
out vec4 outColor;

vec3 applyTemperatureTint(vec3 color, float temperature, float tint) {
  vec3 tempBias = vec3(temperature * 0.12, temperature * 0.03, temperature * -0.12);
  vec3 tintBias = vec3(tint * 0.05, tint * -0.08, tint * 0.05);
  return clamp(color + tempBias + tintBias, 0.0, 1.0);
}

vec3 applyContrast(vec3 color, float amount) {
  return clamp((color - 0.5) * (1.0 + amount) + 0.5, 0.0, 1.0);
}

vec3 applySaturation(vec3 color, float amount) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return clamp(mix(vec3(luma), color, 1.0 + amount), 0.0, 1.0);
}

vec3 applyHighlightsShadows(vec3 color, float highlight, float shadow) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float highlightMask = smoothstep(0.45, 1.0, luma) * highlight;
  float shadowMask = (1.0 - smoothstep(0.0, 0.55, luma)) * shadow;
  vec3 highlightAdjusted = mix(color, color * 0.84, highlightMask);
  vec3 shadowAdjusted = mix(highlightAdjusted, pow(max(highlightAdjusted, vec3(0.0)), vec3(0.85)), shadowMask);
  return clamp(shadowAdjusted, 0.0, 1.0);
}

vec3 applyFade(vec3 color, float fade) {
  return clamp(mix(color, color * 0.88 + 0.12, fade), 0.0, 1.0);
}

vec3 applyVignette(vec3 color, vec2 uv, float amount) {
  if (amount <= 0.0) {
    return color;
  }

  vec2 centered = uv - 0.5;
  float radius = length(centered * vec2(1.05, 0.95)) * 1.8;
  float mask = smoothstep(0.25, 1.0, radius) * amount;
  return clamp(color * (1.0 - 0.42 * mask), 0.0, 1.0);
}

vec3 applySharpen(vec2 uv, vec3 baseColor, float amount) {
  if (amount <= 0.0) {
    return baseColor;
  }

  vec3 north = texture(u_image, uv + vec2(0.0, u_texelSize.y)).rgb;
  vec3 south = texture(u_image, uv - vec2(0.0, u_texelSize.y)).rgb;
  vec3 east = texture(u_image, uv + vec2(u_texelSize.x, 0.0)).rgb;
  vec3 west = texture(u_image, uv - vec2(u_texelSize.x, 0.0)).rgb;
  vec3 blur = (north + south + east + west) * 0.25;
  vec3 sharpened = baseColor + (baseColor - blur) * amount * 1.6;
  return clamp(sharpened, 0.0, 1.0);
}

void main() {
  vec4 texel = texture(u_image, v_texCoord);
  vec3 color = texel.rgb;

  color *= exp2(u_exposure);
  color = applyContrast(color, u_contrast);
  color = applySaturation(color, u_saturation);
  color = applyTemperatureTint(color, u_temperature, u_tint);
  color = applyHighlightsShadows(color, u_highlight, u_shadow);
  color = applyFade(color, u_fade);
  color = applySharpen(v_texCoord, color, u_sharpen);
  color = applyVignette(color, v_texCoord, u_vignette);

  outColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
`;

const blitFragmentShaderSource = `#version 300 es
precision highp float;
uniform sampler2D u_image;
in highp vec2 v_texCoord;
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_texCoord);
}
`;

main();

function createEmptyDebugHistory() {
  return {
    sessions: 0,
    lastOpenedAt: null,
    events: [],
    liveFrameCount: 0,
    liveFrameTotalMs: 0,
    lastLiveFrameMs: 0,
    maxLiveFrameMs: 0,
    captureCount: 0,
    lastCaptureMs: 0,
    lastCaptureBytes: 0,
    saveCount: 0,
    lastSaveMs: 0,
    maxSaveMs: 0,
    lastQueueDelayMs: 0,
    warmGalleryOpenCount: 0,
    warmGalleryReturnCount: 0,
    coldGalleryReturnCount: 0,
    lastWarmGalleryOpenMs: 0,
    lastWarmGalleryReturnMs: 0,
    lastColdGalleryReturnMs: 0,
    galleryTransitionEndRenderCount: 0,
    lastGalleryTransitionEndRenderWaitMs: 0,
    lastGalleryTransitionEndRenderMs: 0,
    lastGifCapture: null,
    lastVideoCapture: null,
    lastGalleryGifBoomerang: null,
    lastFocusLock: null,
  };
}

function readStoredDebugHistory() {
  let stored = null;
  try {
    stored = JSON.parse(window.localStorage.getItem(DEBUG_HISTORY_STORAGE_KEY) ?? "null");
  } catch {
    stored = null;
  }
  const debug = {
    ...createEmptyDebugHistory(),
    ...(stored && typeof stored === "object" ? stored : {}),
  };
  debug.events = Array.isArray(debug.events) ? debug.events.slice(-DEBUG_EVENT_LIMIT) : [];
  debug.sessions = Number(debug.sessions ?? 0) + 1;
  debug.lastOpenedAt = new Date().toISOString();
  debug.events.push({
    t: debug.lastOpenedAt,
    session: DEBUG_SESSION_ID,
    type: "session:start",
    details: {
      previousEvents: Math.max(0, debug.events.length),
      previousSessions: Math.max(0, debug.sessions - 1),
    },
  });
  if (debug.events.length > DEBUG_EVENT_LIMIT) {
    debug.events.splice(0, debug.events.length - DEBUG_EVENT_LIMIT);
  }
  persistDebugHistory(debug);
  return debug;
}

function persistDebugHistory(debug = state?.debug) {
  if (!debug) {
    return;
  }
  try {
    window.localStorage.setItem(DEBUG_HISTORY_STORAGE_KEY, JSON.stringify({
      sessions: debug.sessions,
      lastOpenedAt: debug.lastOpenedAt,
      events: debug.events.slice(-DEBUG_EVENT_LIMIT),
      liveFrameCount: debug.liveFrameCount,
      liveFrameTotalMs: debug.liveFrameTotalMs,
      lastLiveFrameMs: debug.lastLiveFrameMs,
      maxLiveFrameMs: debug.maxLiveFrameMs,
      captureCount: debug.captureCount,
      lastCaptureMs: debug.lastCaptureMs,
      lastCaptureBytes: debug.lastCaptureBytes,
      saveCount: debug.saveCount,
      lastSaveMs: debug.lastSaveMs,
      maxSaveMs: debug.maxSaveMs,
      lastQueueDelayMs: debug.lastQueueDelayMs,
      warmGalleryOpenCount: debug.warmGalleryOpenCount,
      warmGalleryReturnCount: debug.warmGalleryReturnCount,
      coldGalleryReturnCount: debug.coldGalleryReturnCount,
      lastWarmGalleryOpenMs: debug.lastWarmGalleryOpenMs,
      lastWarmGalleryReturnMs: debug.lastWarmGalleryReturnMs,
      lastColdGalleryReturnMs: debug.lastColdGalleryReturnMs,
      galleryTransitionEndRenderCount: debug.galleryTransitionEndRenderCount,
      lastGalleryTransitionEndRenderWaitMs: debug.lastGalleryTransitionEndRenderWaitMs,
      lastGalleryTransitionEndRenderMs: debug.lastGalleryTransitionEndRenderMs,
      lastGifCapture: debug.lastGifCapture ?? null,
      lastVideoCapture: debug.lastVideoCapture ?? null,
      lastGalleryGifBoomerang: debug.lastGalleryGifBoomerang ?? null,
      lastFocusLock: debug.lastFocusLock ?? null,
    }));
  } catch {
    // Debug persistence is best-effort and must never block capture.
  }
}

async function main() {
  if (!gl) {
    emptyState.textContent = "This browser does not support WebGL2.";
    disableControls("WebGL2 unavailable.");
    return;
  }

  try {
    state.programs = {
      lookup: createProgram(vertexShaderSource, lookupFragmentShaderSource),
      effects: createProgram(vertexShaderSource, effectsFragmentShaderSource),
      blit: createProgram(vertexShaderSource, blitFragmentShaderSource),
    };
    state.uniforms = {
      lookup: {
        image: gl.getUniformLocation(state.programs.lookup, "u_image"),
        lut: gl.getUniformLocation(state.programs.lookup, "u_lut"),
        intensity: gl.getUniformLocation(state.programs.lookup, "u_intensity"),
        gridsize: gl.getUniformLocation(state.programs.lookup, "u_gridsize"),
        texwidth: gl.getUniformLocation(state.programs.lookup, "u_texwidth"),
        isBnW: gl.getUniformLocation(state.programs.lookup, "u_isBnW"),
        colorMatrix: gl.getUniformLocation(state.programs.lookup, "u_colorMatrix"),
      },
      effects: {
        image: gl.getUniformLocation(state.programs.effects, "u_image"),
        texelSize: gl.getUniformLocation(state.programs.effects, "u_texelSize"),
        exposure: gl.getUniformLocation(state.programs.effects, "u_exposure"),
        contrast: gl.getUniformLocation(state.programs.effects, "u_contrast"),
        saturation: gl.getUniformLocation(state.programs.effects, "u_saturation"),
        temperature: gl.getUniformLocation(state.programs.effects, "u_temperature"),
        tint: gl.getUniformLocation(state.programs.effects, "u_tint"),
        fade: gl.getUniformLocation(state.programs.effects, "u_fade"),
        highlight: gl.getUniformLocation(state.programs.effects, "u_highlight"),
        shadow: gl.getUniformLocation(state.programs.effects, "u_shadow"),
        sharpen: gl.getUniformLocation(state.programs.effects, "u_sharpen"),
        vignette: gl.getUniformLocation(state.programs.effects, "u_vignette"),
      },
      blit: {
        image: gl.getUniformLocation(state.programs.blit, "u_image"),
      },
    };
    state.geometry = initializeGeometry();
    renderEffectControls();
    renderImportedEffectControls();
    bindCameraUi();
    await initializeApp();
  } catch (error) {
    console.error(error);
    disableControls("Failed to initialize renderer.");
  }
}

async function initializeApp() {
  setStatus("Loading NOMO filter metadata...");
  state.aesKey = await crypto.subtle.importKey("raw", NOMO_AES_KEY, "AES-CBC", false, ["decrypt"]);
  state.filters = await loadFilterCatalog();
  populateFilterSelect(state.filters);
  state.selectedFilterFilename = "";
  syncIntensityControlState();
  updateEffectControlState();
  queueMobileCameraAutostart();
  updateMobileCameraState();
  setStatus(isMobileView() ? "Opening camera..." : "Open a photo to start.");
  if (!isMobileView()) {
    revealAppUi();
  }
  initializeDeferredAssets();
}

function revealAppUi() {
  document.body.classList.remove("app-loading");
  appStartupSplash?.setAttribute("aria-hidden", "true");
  getNativeBridge()?.hideStartupSplash?.().catch((error) => console.error(error));
}

function initializeDeferredAssets() {
  state.filterEffectDefaults = loadFilterEffectDefaults(state.filters);
  applyFilterEffectDefaults(lookSelect.value);
  syncEffectInputs();
  updateEffectControlState();
  warmCaptureAssets(lookSelect.value, "app-init");
  ensureCameraOverlayImages(lookSelect.value)
    .then(() => renderImageAfterSettingsChange())
    .catch((error) => console.error(error));
}

async function loadNomoOverlayImages() {
  const [nomoGrain, vignette, dust, lightLeak] = await Promise.all([
    loadOverlayImage(`${OVERLAYS_ROOT}/${NOMO_OVERLAY_PATHS.nomoGrain}`),
    loadOverlayImage(`${OVERLAYS_ROOT}/${NOMO_OVERLAY_PATHS.vignette}`),
    Promise.all(NOMO_OVERLAY_PATHS.dust.map((name) => loadOverlayImage(`${OVERLAYS_ROOT}/${name}`))),
    Promise.all(NOMO_OVERLAY_PATHS.lightLeak.map((name) => loadOverlayImage(`${OVERLAYS_ROOT}/${name}`))),
  ]);

  return { nomoGrain, vignette, dust, lightLeak };
}

async function ensureCameraOverlayImages(filename, options = {}) {
  const activate = options.activate !== false;
  const filter = state.filterMap.get(filename);
  if (!filter) {
    if (activate) {
      state.currentCameraOverlayImages = null;
    }
    return null;
  }

  if (state.cameraOverlayCache.has(filename)) {
    const cached = state.cameraOverlayCache.get(filename);
    if (activate) {
      state.currentCameraOverlayImages = cached;
    }
    return cached;
  }

  const overlayAssets = filter.overlayAssets ?? {};
  const loaded = {};
  await Promise.all(
    Object.entries(overlayAssets).map(async ([kind, paths]) => {
      loaded[kind] = await Promise.all(paths.map((path) => loadOverlayImage(`${CAMERA_ASSETS_ROOT}/${path}`)));
    }),
  );

  state.cameraOverlayCache.set(filename, loaded);
  if (activate) {
    state.currentCameraOverlayImages = loaded;
  }
  return loaded;
}

function warmCaptureAssets(filename, reason = "background") {
  if (!filename || filename === RANDOM_CAMERA_FILENAME || !state.filterMap.has(filename)) {
    return Promise.resolve(false);
  }
  const startedAt = performance.now();
  return Promise.all([
    ensureLutBytes(filename),
    ensureCameraOverlayImages(filename, { activate: false }),
  ]).then(() => {
    debugEvent("capture-assets:warmed", {
      camera: state.filterMap.get(filename)?.name ?? filename,
      reason,
      ms: Math.round(performance.now() - startedAt),
    });
    return true;
  }).catch((error) => {
    console.warn("Capture asset warm-up failed.", error);
    debugEvent("capture-assets:warm-failed", {
      camera: state.filterMap.get(filename)?.name ?? filename,
      reason,
      message: error?.message ?? String(error),
    });
    return false;
  });
}

async function loadFilterCatalog() {
  const allFilters = (await fetchJson(CAMERA_CATALOG_PATH)).map((camera) => ({
    ...camera,
    group: camera.group ?? "NOMO Cameras",
    groupFilename: isBnwCamera(camera) ? "BNW" : "downloaded-nomo-cameras",
    cameraListGroup: isBnwCamera(camera) ? "BNW" : (camera.group ?? "NOMO Cameras"),
    name: camera.name ?? `Camera ${camera.id}`,
    isBnw: isBnwCamera(camera),
  }));

  for (const filter of allFilters) {
    state.filterMap.set(filter.filename, filter);
  }

  return allFilters;
}

function isBnwCamera(camera) {
  return BNW_CAMERA_NAMES.has(String(camera.name ?? "").trim());
}

function populateFilterSelect(filters) {
  lookSelect.innerHTML = "";
  cameraLookSelect.innerHTML = "";
  cameraList.innerHTML = "";
  const groups = new Map();
  const cameraGroups = new Map();

  const randomCameraOption = document.createElement("option");
  randomCameraOption.value = RANDOM_CAMERA_FILENAME;
  randomCameraOption.textContent = "Random Cam";
  cameraLookSelect.append(randomCameraOption);

  for (const filter of filters) {
    const groupLabel = filter.cameraListGroup ?? filter.group;
    if (!groups.has(groupLabel)) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = groupLabel;
      groups.set(groupLabel, optgroup);
      lookSelect.append(optgroup);

      const cameraOptgroup = document.createElement("optgroup");
      cameraOptgroup.label = groupLabel;
      cameraGroups.set(groupLabel, cameraOptgroup);
      cameraLookSelect.append(cameraOptgroup);
    }

    const option = document.createElement("option");
    option.value = filter.filename;
    option.textContent = filter.name;
    groups.get(groupLabel).append(option);

    const cameraOption = option.cloneNode(true);
    cameraGroups.get(groupLabel).append(cameraOption);
  }

  populateCameraDrawerList(filters);
  renderFavoriteCameraDrawer();

  lookSelect.disabled = filters.length === 0;
  cameraLookSelect.disabled = filters.length === 0;

  const storedCamera = readStoredSelectedCamera();
  const initialFilename = filters.some((filter) => filter.filename === storedCamera)
    ? storedCamera
    : filters[0]?.filename;
  if (initialFilename) {
    lookSelect.value = initialFilename;
    cameraLookSelect.value = initialFilename;
    writeStoredSelectedCamera(initialFilename);
  }
  syncCameraListSelection();
}

function populateCameraDrawerList(filters) {
  cameraList.innerHTML = "";
  state.cameraListSelectionKey = "";
  const randomButton = document.createElement("button");
  randomButton.type = "button";
  randomButton.className = "camera-list__item";
  randomButton.dataset.filename = RANDOM_CAMERA_FILENAME;
  randomButton.textContent = "Random Cam";
  randomButton.addEventListener("click", () => {
    if (state.cameraSwipe.suppressNextListClick) {
      state.cameraSwipe.suppressNextListClick = false;
      return;
    }
    selectFilter(RANDOM_CAMERA_FILENAME).catch((error) => console.error(error));
    setCameraListOpen(false);
  });
  cameraList.append(randomButton);

  const favoriteFilters = filters.filter((filter) => state.favoriteCameraFilenames.has(filter.filename));
  if (favoriteFilters.length) {
    appendCameraDrawerGroup("Favorites", favoriteFilters);
  }

  const drawerGroups = new Map();
  for (const filter of filters) {
    const groupLabel = filter.cameraListGroup ?? filter.group;
    if (!drawerGroups.has(groupLabel)) {
      drawerGroups.set(groupLabel, []);
    }
    drawerGroups.get(groupLabel).push(filter);
  }

  for (const [groupLabel, groupFilters] of drawerGroups.entries()) {
    appendCameraDrawerGroup(groupLabel, groupFilters);
  }
}

function appendCameraDrawerGroup(groupLabel, groupFilters) {
  const cameraListHeading = document.createElement("div");
  cameraListHeading.className = "camera-list__heading";
  cameraListHeading.textContent = groupLabel;
  cameraList.append(cameraListHeading);

  for (const filter of groupFilters) {
    cameraList.append(createCameraListRow(filter));
  }
}

function createCameraListRow(filter) {
  const row = document.createElement("div");
  row.className = "camera-list__row";

  const cameraButton = document.createElement("button");
  cameraButton.type = "button";
  cameraButton.className = "camera-list__item";
  cameraButton.dataset.filename = filter.filename;
  cameraButton.textContent = filter.name;
  cameraButton.addEventListener("click", () => {
    if (state.cameraSwipe.suppressNextListClick) {
      state.cameraSwipe.suppressNextListClick = false;
      return;
    }
    handleFilterSelection(filter.filename);
    setCameraListOpen(false);
  });

  const favoriteButton = document.createElement("button");
  favoriteButton.type = "button";
  favoriteButton.className = "camera-list__favorite";
  favoriteButton.dataset.filename = filter.filename;
  favoriteButton.setAttribute("aria-label", `Toggle ${filter.name} favorite`);
  favoriteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavoriteCamera(filter.filename);
  });

  row.append(cameraButton, favoriteButton);
  return row;
}

function loadFilterEffectDefaults(filters) {
  const defaultsByFilter = new Map();

  for (const filter of filters) {
    const defaultsForFilter = {};
    for (const [effectId, value] of Object.entries(filter.defaults ?? {})) {
      if (!CAMERA_DEFAULT_EFFECT_IDS.has(effectId)) {
        continue;
      }
      if (isEffectIgnoredByApkFilter(filter, effectId)) {
        continue;
      }
      defaultsForFilter[effectId] = normalizeCameraEffectDefault(effectId, value);
    }
    if (Object.keys(defaultsForFilter).length) {
      defaultsByFilter.set(filter.filename, defaultsForFilter);
    }
  }

  for (const [filename, overrides] of Object.entries(CAMERA_EFFECT_DEFAULT_OVERRIDES)) {
    defaultsByFilter.set(filename, {
      ...(defaultsByFilter.get(filename) ?? {}),
      ...overrides,
    });
  }

  return defaultsByFilter;
}

function isEffectIgnoredByApkFilter(filter, effectId) {
  const apkTypesByEffect = {
    nomoGrain: ["grains"],
    dust: ["dust"],
    vignette: ["vignette"],
  };
  const apkTypes = apkTypesByEffect[effectId];
  if (!apkTypes?.length) {
    return false;
  }

  const matchingEffects = (filter.filters ?? []).filter((effect) => apkTypes.includes(String(effect.type ?? "").toLowerCase()));
  return matchingEffects.length > 0 && matchingEffects.every((effect) => isApkEffectIgnored(effect));
}

function isApkEffectIgnored(effect) {
  const ignored = effect?.params?.Ignore ?? effect?.params?.ignore;
  return ignored === true || String(ignored).toLowerCase() === "true";
}

function normalizeCameraEffectDefault(effectId, value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  const effect = getEffectById(effectId);
  if (!effect) {
    return numeric;
  }

  if (isApkDecimalStrengthEffect(effectId)) {
    return Math.min(effect.max, Math.max(effect.min ?? 0, numeric / 10));
  }

  let normalized = numeric;
  if (effect.max <= 1 && Math.abs(numeric) > 1) {
    normalized = numeric / 10;
  }

  return Math.min(effect.max, Math.max(effect.min ?? 0, normalized));
}

function isApkDecimalStrengthEffect(effectId) {
  return ["exposure", "contrast", "saturation", "temperature", "tint"].includes(effectId);
}

function mapApkSpecificToEffectDefault(specific) {
  switch (specific.Type) {
    case "Grains":
      return { id: "nomoGrain", value: readApkSpecificValue(specific) };
    case "Dust":
      return { id: "dust", value: readApkSpecificValue(specific) };
    case "Vignette":
      return { id: "vignette", value: readApkSpecificValue(specific) };
    default:
      return null;
  }
}

function readApkSpecificValue(specific) {
  if (specific.Value !== undefined) {
    return clampEffectScale(parseApkNumber(specific.Value));
  }

  const min = parseApkNumber(specific.ValueMin);
  const max = parseApkNumber(specific.ValueMax);
  if (!Number.isFinite(min) && !Number.isFinite(max)) {
    return 0;
  }

  if (!Number.isFinite(min)) {
    return clampEffectScale(max);
  }

  if (!Number.isFinite(max) || min === max) {
    return clampEffectScale(min);
  }

  return clampEffectScale(Math.round(min + Math.random() * (max - min)));
}

function parseApkNumber(value) {
  if (value === undefined || value === null) {
    return Number.NaN;
  }
  return Number(String(value).replace("+", ""));
}

function clampEffectScale(value) {
  return Math.min(10, Math.max(0, value));
}

function renderEffectControls() {
  effectsRoot.innerHTML = "";
  state.effectInputs.clear();

  for (const group of EFFECT_GROUPS) {
    const effects = VISIBLE_EFFECTS.filter((effect) => effect.group === group.id);
    if (!effects.length) {
      continue;
    }

    const groupEl = document.createElement("section");
    groupEl.className = "effect-group";

    const header = document.createElement("div");
    header.className = "effect-group__header";
    const title = document.createElement("h3");
    title.className = "effect-group__title";
    title.textContent = group.label;
    const meta = document.createElement("span");
    meta.className = "effect-group__meta";
    meta.textContent = `${effects.length} APK-backed controls`;
    header.append(title, meta);
    groupEl.append(header);

    for (const effect of effects) {
      const card = document.createElement("div");
      card.className = "effect-card";

      const row = document.createElement("div");
      row.className = "effect-card__row";

      const label = document.createElement("span");
      label.className = "effect-card__label";
      label.textContent = effect.label;
      row.append(label);

      if (effect.kind === "toggle") {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "toggle-switch";
        input.dataset.effectId = effect.id;
        input.checked = state.effects[effect.id].enabled;
        row.append(input);
        state.effectInputs.set(effect.id, { input });
      } else {
        const value = document.createElement("span");
        value.className = "effect-card__value";
        value.textContent = formatEffectValue(effect, state.effects[effect.id].value);
        row.append(value);

        const input = document.createElement("input");
        input.type = "range";
        input.min = String(effect.min);
        input.max = String(effect.max);
        input.step = String(effect.step);
        input.value = String(state.effects[effect.id].value);
        input.dataset.effectId = effect.id;
        card.append(row, input);
        card.title = effect.apkAnchor;
        groupEl.append(card);
        state.effectInputs.set(effect.id, { input, value });
        continue;
      }

      card.append(row);
      card.title = effect.apkAnchor;
      groupEl.append(card);
    }

    effectsRoot.append(groupEl);
  }

  for (const [effectId, refs] of state.effectInputs.entries()) {
    refs.input.addEventListener("input", () => {
      const effect = getEffectById(effectId);
      if (effect.kind === "toggle") {
        state.effects[effectId].enabled = refs.input.checked;
      } else {
        state.effects[effectId].value = Number(refs.input.value);
        state.effects[effectId].enabled = state.effects[effectId].value !== effect.defaultValue;
        if (refs.value) {
          refs.value.textContent = formatEffectValue(effect, state.effects[effectId].value);
        }
      }

      updateEffectControlState();
      renderImageAfterSettingsChange();
    });
  }
}

function renderImportedEffectControls() {
  importedEffectsRoot.innerHTML = "";
  state.importedEffectInputs.clear();

  const card = document.createElement("div");
  card.className = "effect-card";

  const row = document.createElement("div");
  row.className = "effect-card__row";

  const label = document.createElement("span");
  label.className = "effect-card__label";
  label.textContent = SPEKTRA_GRAIN_EFFECT.label;

  const input = document.createElement("input");
  input.type = "checkbox";
  input.className = "toggle-switch";
  input.checked = state.importedEffects.spektraGrain.enabled;

  row.append(label, input);

  const presetSelect = document.createElement("select");
  presetSelect.className = "imported-effect-select";
  presetSelect.disabled = !state.importedEffects.spektraGrain.enabled;
  for (const preset of SPEKTRA_GRAIN_EFFECT.presets) {
    const option = document.createElement("option");
    option.value = preset;
    option.textContent = preset;
    presetSelect.append(option);
  }
  presetSelect.value = state.importedEffects.spektraGrain.preset;

  const modeSelect = document.createElement("select");
  modeSelect.className = "imported-effect-select";
  modeSelect.disabled = !state.importedEffects.spektraGrain.enabled;
  for (const mode of SPEKTRA_GRAIN_EFFECT.modes) {
    const option = document.createElement("option");
    option.value = mode.value;
    option.textContent = mode.label;
    modeSelect.append(option);
  }
  modeSelect.value = state.importedEffects.spektraGrain.mode ?? SPEKTRA_GRAIN_EFFECT.defaultMode;

  card.append(row, presetSelect, modeSelect);

  card.title = SPEKTRA_GRAIN_EFFECT.anchor;

  importedEffectsRoot.append(card);
  state.importedEffectInputs.set(SPEKTRA_GRAIN_EFFECT.id, { input, presetSelect, modeSelect });

  input.addEventListener("input", () => {
    state.importedEffects.spektraGrain.enabled = input.checked;
    presetSelect.disabled = !input.checked;
    modeSelect.disabled = !input.checked;
    renderImageAfterSettingsChange();
  });

  presetSelect.addEventListener("input", () => {
    state.importedEffects.spektraGrain.preset = presetSelect.value;
    renderImageAfterSettingsChange();
  });

  modeSelect.addEventListener("input", () => {
    state.importedEffects.spektraGrain.mode = modeSelect.value;
    renderImageAfterSettingsChange();
  });

}

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(error);
  }

  return shader;
}

function createProgram(vertexSource, fragmentSource) {
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(error);
  }

  return program;
}

function initializeGeometry() {
  const vao = gl.createVertexArray();
  const positionBuffer = gl.createBuffer();
  const texCoordBuffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(state.programs.lookup, "a_position");
  const texCoordLocation = gl.getAttribLocation(state.programs.lookup, "a_texCoord");

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 1,
    1, 1,
    0, 0,
    0, 0,
    1, 1,
    1, 0,
  ]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vao, positionBuffer, texCoordBuffer };
}

function bindCameraUi() {
  syncThemeSetting();
  syncAccentColorSetting();
  syncGalleryLayoutSetting();
  syncGalleryDisplayLimitSetting();
  syncHalfSizeSaveSetting();
  syncMinimalModeSetting();
  syncLevelGuideSetting();
  syncFocalLabelSetting();
  syncShutterLongPressSettings();
  updateMobileCameraState();
  MOBILE_MEDIA_QUERY.addEventListener("change", handleMobileViewportChange);
  THEME_MEDIA_QUERY?.addEventListener?.("change", () => {
    if (state.theme === "system") {
      applyThemeSetting();
    }
  });
}

function handleMobileViewportChange(event) {
  if (!event.matches && state.cameraActive) {
    if (state.videoCaptureInProgress) {
      stopNativeVideoRecording("viewport-change").finally(() => {
        stopCamera({ force: true, keepCameraMode: true, skipGalleryLoad: true });
      });
      return;
    }
    stopCamera({ force: true, keepCameraMode: true, skipGalleryLoad: true });
  }
  if (event.matches) {
    state.restoreCameraOnResume = true;
    restoreCameraModeFromLifecycle("mobile-viewport");
  }
  updateMobileCameraState();
}

function isMobileView() {
  return MOBILE_MEDIA_QUERY.matches;
}

function readStoredCameraPermission() {
  try {
    return window.localStorage.getItem(CAMERA_PERMISSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredCameraPermission(value) {
  try {
    window.localStorage.setItem(CAMERA_PERMISSION_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable in private mode; browser permission remains authoritative.
  }
}

function readStoredSelectedCamera() {
  try {
    return window.localStorage.getItem(SELECTED_CAMERA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredSelectedCamera(filename) {
  if (!filename || filename === RANDOM_CAMERA_FILENAME) {
    return;
  }
  try {
    window.localStorage.setItem(SELECTED_CAMERA_STORAGE_KEY, filename);
  } catch {
    // Storage can be unavailable in private mode; the in-memory selection still works.
  }
}

function readStoredFavoriteCameras() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITE_CAMERAS_STORAGE_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((filename) => typeof filename === "string") : []);
  } catch {
    return new Set();
  }
}

function writeStoredFavoriteCameras() {
  try {
    window.localStorage.setItem(FAVORITE_CAMERAS_STORAGE_KEY, JSON.stringify([...state.favoriteCameraFilenames]));
  } catch {
    // Storage can be unavailable in private mode; favorites persist for this session only.
  }
}

function readStoredGalleryTwoColumn() {
  try {
    return window.localStorage.getItem(GALLERY_TWO_COLUMN_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredGalleryTwoColumn(value) {
  try {
    window.localStorage.setItem(GALLERY_TWO_COLUMN_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredGalleryDisplayLimit() {
  try {
    const value = window.localStorage.getItem(GALLERY_DISPLAY_LIMIT_STORAGE_KEY);
    return GALLERY_DISPLAY_LIMIT_VALUES.has(value) ? value : "default";
  } catch {
    return "default";
  }
}

function writeStoredGalleryDisplayLimit(value) {
  try {
    window.localStorage.setItem(
      GALLERY_DISPLAY_LIMIT_STORAGE_KEY,
      GALLERY_DISPLAY_LIMIT_VALUES.has(value) ? value : "default",
    );
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_VALUES.has(value) ? value : "dark";
  } catch {
    return "dark";
  }
}

function writeStoredTheme(value) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function normalizeAccentColor(value) {
  const color = String(value ?? "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : DEFAULT_ACCENT_COLOR;
}

function readStoredAccentColor() {
  try {
    return normalizeAccentColor(window.localStorage.getItem(ACCENT_COLOR_STORAGE_KEY));
  } catch {
    return DEFAULT_ACCENT_COLOR;
  }
}

function writeStoredAccentColor(value) {
  try {
    window.localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, normalizeAccentColor(value));
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredHalfSizeSave() {
  try {
    return window.localStorage.getItem(HALF_SIZE_SAVE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredHalfSizeSave(value) {
  try {
    window.localStorage.setItem(HALF_SIZE_SAVE_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredMinimalMode() {
  try {
    const value = window.localStorage.getItem(MINIMAL_MODE_STORAGE_KEY);
    return value === null ? true : value === "1";
  } catch {
    return true;
  }
}

function writeStoredMinimalMode(value) {
  try {
    window.localStorage.setItem(MINIMAL_MODE_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredLevelGuide() {
  try {
    const value = window.localStorage.getItem(LEVEL_GUIDE_STORAGE_KEY);
    return value === null ? true : value === "1";
  } catch {
    return true;
  }
}

function writeStoredLevelGuide(value) {
  try {
    window.localStorage.setItem(LEVEL_GUIDE_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredFocalLabel() {
  try {
    return window.localStorage.getItem(FOCAL_LABEL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredFocalLabel(value) {
  try {
    window.localStorage.setItem(FOCAL_LABEL_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredShutterLongPressAction() {
  try {
    const value = window.localStorage.getItem(SHUTTER_LONG_PRESS_ACTION_STORAGE_KEY);
    return SHUTTER_LONG_PRESS_ACTION_VALUES.has(value) ? value : "gif";
  } catch {
    return "gif";
  }
}

function writeStoredShutterLongPressAction(value) {
  try {
    window.localStorage.setItem(
      SHUTTER_LONG_PRESS_ACTION_STORAGE_KEY,
      SHUTTER_LONG_PRESS_ACTION_VALUES.has(value) ? value : "gif",
    );
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredGifDuration() {
  try {
    const value = window.localStorage.getItem(GIF_DURATION_STORAGE_KEY);
    return GIF_DURATION_VALUES.has(value) ? value : "2";
  } catch {
    return "2";
  }
}

function writeStoredGifDuration(value) {
  try {
    window.localStorage.setItem(GIF_DURATION_STORAGE_KEY, GIF_DURATION_VALUES.has(value) ? value : "2");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredGifBoomerang() {
  try {
    return window.localStorage.getItem(GIF_BOOMERANG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredGifBoomerang(value) {
  try {
    window.localStorage.setItem(GIF_BOOMERANG_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredFocusDistance() {
  try {
    const value = window.localStorage.getItem(FOCUS_DISTANCE_STORAGE_KEY);
    return FOCUS_DISTANCE_VALUES.has(value) ? value : "closest";
  } catch {
    return "closest";
  }
}

function writeStoredFocusDistance(value) {
  try {
    window.localStorage.setItem(FOCUS_DISTANCE_STORAGE_KEY, FOCUS_DISTANCE_VALUES.has(value) ? value : "closest");
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function readStoredLevelZone() {
  return "wide";
}

function writeStoredLevelZone(value) {
  try {
    window.localStorage.setItem(LEVEL_ZONE_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable in private mode; the in-memory setting still works.
  }
}

function syncGalleryLayoutSetting() {
  document.body.classList.toggle("gallery-two-column", state.galleryTwoColumn);
  if (galleryTwoColumnToggle) {
    galleryTwoColumnToggle.checked = state.galleryTwoColumn;
  }
}

function getGalleryDisplayLimitCount() {
  switch (state.galleryDisplayLimit) {
    case "double":
      return GALLERY_RENDER_BATCH_SIZE * 2;
    case "quad":
      return GALLERY_RENDER_BATCH_SIZE * 4;
    case "infinite":
      return Number.POSITIVE_INFINITY;
    case "default":
    default:
      return GALLERY_RENDER_BATCH_SIZE;
  }
}

function getGalleryVisibleItems() {
  const limit = getGalleryDisplayLimitCount();
  return Number.isFinite(limit) ? state.galleryItems.slice(0, limit) : state.galleryItems;
}

function syncGalleryDisplayLimitSetting() {
  if (!GALLERY_DISPLAY_LIMIT_VALUES.has(state.galleryDisplayLimit)) {
    state.galleryDisplayLimit = "default";
  }
  document.body.classList.toggle("gallery-infinite-mode", state.galleryDisplayLimit === "infinite");
  if (galleryDisplayLimitSelect) {
    galleryDisplayLimitSelect.value = state.galleryDisplayLimit;
  }
  if (galleryDisplayLimitWarning) {
    galleryDisplayLimitWarning.hidden = state.galleryDisplayLimit !== "infinite";
  }
}

function getResolvedTheme() {
  if (state.theme === "light" || state.theme === "dark") {
    return state.theme;
  }
  return THEME_MEDIA_QUERY?.matches ? "dark" : "light";
}

function applyThemeSetting() {
  document.documentElement.dataset.appTheme = getResolvedTheme();
  document.documentElement.dataset.themeSetting = state.theme;
}

function applyAccentColorSetting() {
  const color = normalizeAccentColor(state.accentColor);
  document.documentElement.style.setProperty("--ui-accent", color);
  document.documentElement.style.setProperty("--ui-accent-strong", color);
}

function syncThemeSetting() {
  applyThemeSetting();
  if (themeSelect) {
    themeSelect.value = state.theme;
  }
}

function syncAccentColorSetting() {
  state.accentColor = normalizeAccentColor(state.accentColor);
  applyAccentColorSetting();
  if (accentColorInput) {
    accentColorInput.value = state.accentColor;
  }
  for (const button of accentSwatches?.querySelectorAll(".accent-swatch") ?? []) {
    const swatchColor = normalizeAccentColor(button.dataset.accent);
    button.classList.toggle("is-selected", swatchColor === state.accentColor);
    button.setAttribute("aria-pressed", swatchColor === state.accentColor ? "true" : "false");
  }
}

function syncHalfSizeSaveSetting() {
  if (halfSizeSaveToggle) {
    halfSizeSaveToggle.checked = state.halfSizeSave;
  }
}

function syncMinimalModeSetting() {
  document.body.classList.toggle("minimal-mode-active", state.minimalMode);
  if (minimalModeToggle) {
    minimalModeToggle.checked = state.minimalMode;
  }
}

function syncLevelGuideSetting() {
  if (levelGuideToggle) {
    levelGuideToggle.checked = state.levelGuideEnabled;
  }
  state.levelZone = "wide";
}

function syncFocalLabelSetting() {
  document.body.classList.toggle("camera-focal-label-enabled", state.focalLabelEnabled);
  if (focalLabelToggle) {
    focalLabelToggle.checked = state.focalLabelEnabled;
  }
}

function syncShutterLongPressSettings() {
  if (!SHUTTER_LONG_PRESS_ACTION_VALUES.has(state.shutterLongPressAction)) {
    state.shutterLongPressAction = "gif";
  }
  if (!GIF_DURATION_VALUES.has(state.gifDuration)) {
    state.gifDuration = "2";
  }
  if (!FOCUS_DISTANCE_VALUES.has(state.focusDistance)) {
    state.focusDistance = "closest";
  }
  if (shutterLongPressActionSelect) {
    shutterLongPressActionSelect.value = state.shutterLongPressAction;
  }
  if (gifDurationSelect) {
    gifDurationSelect.value = state.gifDuration;
  }
  if (gifBoomerangToggle) {
    gifBoomerangToggle.checked = state.gifBoomerang;
  }
  if (focusDistanceSelect) {
    focusDistanceSelect.value = state.focusDistance;
  }
  if (gifLongPressSettings) {
    gifLongPressSettings.hidden = state.shutterLongPressAction !== "gif";
  }
  if (focusLongPressSettings) {
    focusLongPressSettings.hidden = state.shutterLongPressAction !== "focus";
  }
}

async function readBrowserCameraPermission() {
  if (!navigator.permissions?.query) {
    return null;
  }

  try {
    const status = await navigator.permissions.query({ name: "camera" });
    state.cameraPermissionState = status.state;
    status.onchange = () => {
      state.cameraPermissionState = status.state;
      if (status.state === CAMERA_PERMISSION_GRANTED || status.state === CAMERA_PERMISSION_DENIED) {
        writeStoredCameraPermission(status.state);
      }
      updateMobileCameraState();
    };
    return status.state;
  } catch {
    return null;
  }
}

async function canAutostartCameraWithoutPrompt() {
  const browserPermission = await readBrowserCameraPermission();
  if (browserPermission === CAMERA_PERMISSION_GRANTED) {
    writeStoredCameraPermission(CAMERA_PERMISSION_GRANTED);
    return true;
  }
  if (browserPermission === CAMERA_PERMISSION_DENIED) {
    writeStoredCameraPermission(CAMERA_PERMISSION_DENIED);
    return false;
  }
  if (browserPermission === "prompt") {
    return false;
  }

  // A stored grant is only a hint. If the browser cannot confirm it, calling
  // getUserMedia automatically can still trigger the exact repeated prompt we
  // are trying to avoid.
  return false;
}

function updateMobileCameraState() {
  const mobile = isMobileView();
  const cameraSupported = Boolean(isNativeCameraAvailable() || navigator.mediaDevices?.getUserMedia);
  const canOpen = mobile
    && cameraSupported
    && !state.cameraActive
    && !state.cameraStarting
    && !state.cameraStopping
    && !lookSelect.disabled;
  const cameraUiActive = mobile && (
    state.cameraActive
    || state.cameraStarting
    || state.cameraStopping
    || state.cameraForceOpenUntilStarted
  );
  const cameraControlsActive = state.cameraActive && !state.cameraGalleryDeferred && !state.gifCaptureInProgress && !state.videoCaptureInProgress;
  const selectedFilter = state.filterMap.get(lookSelect.value);
  const useBnwOverlay = Boolean(selectedFilter?.isBnw);

  startCameraButton.disabled = !canOpen;
  capturePhotoButton.disabled = !mobile || !cameraControlsActive || state.cameraStopping;
  cameraCaptureButton.disabled = !mobile || !cameraControlsActive || state.cameraStopping;
  cameraPreviewGalleryButton.disabled = !mobile || !cameraControlsActive || state.cameraStopping;
  cameraFlashToggleButton.disabled = !mobile || !cameraControlsActive;
  cameraFacingToggleButton.disabled = !mobile || !cameraControlsActive;
  cameraCropToggleButton.disabled = !mobile || !cameraControlsActive;
  stopCameraButton.disabled = !mobile || !cameraControlsActive;
  cameraSettingsButton.disabled = !mobile || !cameraControlsActive;
  cameraLookSelect.disabled = !mobile || lookSelect.disabled;
  cameraLookSelect.value = lookSelect.value;
  cameraPresetLabel.textContent = state.cameraStopping
    ? "Closing camera..."
    : state.videoCaptureInProgress
    ? "Recording video..."
    : state.gifCaptureInProgress
    ? "Recording GIF..."
    : state.cameraGalleryDeferred
    ? "Gallery open. Camera is kept warm briefly."
    : state.cameraActive
    ? `Live preview: ${state.filterMap.get(lookSelect.value)?.name ?? "selected preset"}`
    : "Ready to capture with the selected preset.";
  document.body.classList.toggle("camera-boot", cameraUiActive && !state.cameraActive);
  document.body.classList.toggle("camera-mode-active", cameraUiActive);
  document.body.classList.toggle("bnw-camera-active", cameraUiActive && useBnwOverlay);
  document.body.classList.toggle("random-camera-active", cameraUiActive && state.randomCameraEnabled);
  document.body.classList.toggle("selfie-camera-active", cameraUiActive && state.cameraFacingMode === "user");
  document.body.classList.toggle("translucent-camera-active", cameraUiActive && getCameraOverlayKey(useBnwOverlay).includes("Translucent"));
  document.body.classList.toggle("m35-camera-active", cameraUiActive && getCameraOverlayKey(useBnwOverlay) === "kodakM35");
  document.body.classList.toggle("camera-flash-enabled", cameraUiActive && state.cameraFlashEnabled);
  document.body.classList.toggle("camera-overlay-feedback", cameraUiActive && CAMERA_OVERLAY_FEEDBACK.enabled);
  document.body.classList.toggle("camera-overlay-shutter-feedback", CAMERA_OVERLAY_FEEDBACK.enabled && CAMERA_OVERLAY_FEEDBACK.shutterPress);
  document.body.classList.toggle("camera-overlay-crop-feedback", CAMERA_OVERLAY_FEEDBACK.enabled && CAMERA_OVERLAY_FEEDBACK.cropPress);
  document.body.classList.toggle("camera-overlay-flash-feedback", CAMERA_OVERLAY_FEEDBACK.enabled && CAMERA_OVERLAY_FEEDBACK.flashActiveBrightness);
  document.body.classList.toggle("camera-overlay-facing-feedback", CAMERA_OVERLAY_FEEDBACK.enabled && CAMERA_OVERLAY_FEEDBACK.facingToggleSlide);
  document.body.classList.toggle("native-camera-active", mobile && state.nativeCameraActive);
  document.documentElement.classList.toggle("native-camera-active", mobile && state.nativeCameraActive);
  document.body.classList.toggle(
    "mobile-gallery-active",
    mobile
      && !state.cameraActive
      && !state.cameraStarting
      && !state.cameraStopping
      && !state.mobileSettingsOpen
      && !state.cameraForceOpenUntilStarted
  );
  document.body.classList.toggle(
    "mobile-settings-active",
    mobile && !state.cameraActive && !state.cameraStarting && !state.cameraStopping && state.mobileSettingsOpen
  );
  if (!mobile || !state.cameraActive) {
    setCameraGalleryPeek(false);
    setCameraListOpen(false);
    setFavoriteCameraDrawerOpen(false);
  }
  syncCameraListSelection();
  syncCameraDeviceOverlay(useBnwOverlay);
  updateCameraFlashState();
  updateCameraCropButton();
  updateCameraCaptureLock();
  syncNativeLevelGuide();
}

function syncCameraDeviceOverlay(useBnwOverlay) {
  const nextSrc = CAMERA_OVERLAY_SOURCES[getCameraOverlayKey(useBnwOverlay)] ?? CAMERA_OVERLAY_SOURCES.quicksnap;
  if (cameraDeviceOverlay && !cameraDeviceOverlay.src.endsWith(nextSrc.replace("./", ""))) {
    cameraDeviceOverlay.src = nextSrc;
    scheduleNativePreviewRectUpdate();
  }
}

function getCameraOverlayKey(useBnwOverlay = Boolean(state.filterMap.get(lookSelect.value)?.isBnw)) {
  if (state.minimalMode) {
    return "minimal";
  }
  if (state.randomCameraEnabled) {
    return "random";
  }
  return CAMERA_OVERLAY_BY_FILENAME[lookSelect.value] ?? (useBnwOverlay ? "bnw" : "quicksnap");
}

function updateCameraCaptureLock() {
  const locked = state.cameraCaptureInProgress || state.gifCaptureInProgress || state.videoCaptureInProgress;
  capturePhotoButton.setAttribute("aria-busy", String(locked));
  cameraCaptureButton.setAttribute("aria-busy", String(locked));
  cameraFacingToggleButton.disabled = cameraFacingToggleButton.disabled || locked;
  stopCameraButton.disabled = stopCameraButton.disabled || locked;
}

function setupNativeHardwareShutter() {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge) {
    return;
  }
  setupNativeSpektraPendingPreviewListener(nativeBridge);
  setupNativePhotoSaveCompleteListener(nativeBridge);

  if (!state.nativeHardwareShutterReady) {
    state.nativeHardwareShutterReady = true;
    const listenerPromise = nativeBridge.addListener?.("hardwareShutter", (event) => {
      debugEvent("hardware-shutter", event ?? { source: "volume" });
      requestCameraCapture({ source: "hardware" });
    });
    listenerPromise?.catch?.((error) => {
      state.nativeHardwareShutterReady = false;
      console.error(error);
    });
  }

  nativeBridge.startHardwareShutter?.()
    .then((result) => {
      if (result?.mode) {
        debugEvent("hardware-shutter:ready", { mode: result.mode });
      }
    })
    .catch((error) => console.error(error));
}

function setupNativeSpektraPendingPreviewListener(nativeBridge = getNativeBridge()) {
  if (!nativeBridge || state.nativeSpektraPendingListenerReady) {
    return;
  }
  state.nativeSpektraPendingListenerReady = true;
  const listenerPromise = nativeBridge.addListener?.("nativeSpektraPendingPreview", (event) => {
    upsertPendingSpektraGalleryItem(event ?? {});
  });
  listenerPromise?.catch?.((error) => {
    state.nativeSpektraPendingListenerReady = false;
    console.error(error);
  });
}

function setupNativePhotoSaveCompleteListener(nativeBridge = getNativeBridge()) {
  if (!nativeBridge || state.nativePhotoSaveListenerReady) {
    return;
  }
  state.nativePhotoSaveListenerReady = true;
  const listenerPromise = nativeBridge.addListener?.("nativePhotoSaveComplete", (event) => {
    const details = event ?? {};
    debugEvent("native-photo-save:complete", details);
    if (details.saved) {
      setStatus(`Saved ${details.cameraName ?? "camera"} shot to Photos.`);
    } else {
      setStatus(`Saved ${details.cameraName ?? "camera"} shot to local gallery. Photos export failed.`);
    }
  });
  listenerPromise?.catch?.((error) => {
    state.nativePhotoSaveListenerReady = false;
    console.error(error);
  });
}

function syncNativeLevelGuide() {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.startLevelGuide || !nativeBridge?.stopLevelGuide) {
    return;
  }

  const shouldRun = isMobileView() && state.cameraActive && !state.cameraGalleryDeferred && state.levelGuideEnabled;
  if (shouldRun && !state.levelGuideActive) {
    state.levelGuideActive = true;
    nativeBridge.startLevelGuide({ zone: state.levelZone }).catch((error) => {
      console.error(error);
      state.levelGuideActive = false;
      setStatus("Haptic level guide is unavailable on this device.");
    });
  } else if (!shouldRun && state.levelGuideActive) {
    state.levelGuideActive = false;
    nativeBridge.stopLevelGuide().catch((error) => console.error(error));
  }
}

async function ensureSpektraProfileLoaded() {
  if (state.spektraProfile) {
    return state.spektraProfile;
  }
  if (!state.spektraProfilePromise) {
    state.spektraProfilePromise = loadSpektraProfile(SPEKTRA_PROFILE_PATH)
      .then((profile) => {
        state.spektraProfile = profile;
        return profile;
      })
      .catch((error) => {
        console.error(error);
        return null;
      })
      .finally(() => {
        state.spektraProfilePromise = null;
      });
  }
  return state.spektraProfilePromise;
}

function queueMobileCameraAutostart() {
  if (!isMobileView() || state.cameraAutostartAttempted || lookSelect.disabled) {
    return;
  }

  state.cameraAutostartAttempted = true;
  state.cameraForceOpenUntilStarted = true;
  updateMobileCameraState();
  window.setTimeout(async () => {
    if (isMobileView() && !state.cameraActive) {
      await startCamera({ automatic: true });
    }
  }, 0);
}

function trackCameraStopPromise(promise) {
  if (!promise) {
    return;
  }

  const trackedPromise = Promise.resolve(promise)
    .catch((error) => {
      console.error(error);
      debugEvent("native-camera:stop-error", { message: error?.message ?? String(error) });
    })
    .finally(() => {
      if (state.cameraStopPromise === trackedPromise) {
        state.cameraStopPromise = null;
      }
      state.cameraStopping = false;
      updateMobileCameraState();
    });

  state.cameraStopping = true;
  state.cameraStopPromise = trackedPromise;
  updateMobileCameraState();
}

async function waitForCameraStop() {
  if (!state.cameraStopPromise) {
    return;
  }
  await state.cameraStopPromise.catch(() => {});
}

function prepareCameraModeForLifecycle(reason = "lifecycle") {
  if (!isMobileView()) {
    return;
  }
  state.restoreCameraOnResume = true;
  state.mobileSettingsOpen = false;
  state.cameraForceOpenUntilStarted = true;
  resetMobileTransitionState({ closeDrawers: true, resetNativePreviewOffset: true });
  updateMobileCameraState();
  debugEvent("camera:lifecycle-restore-armed", { reason });
}

function restoreCameraModeFromLifecycle(reason = "lifecycle") {
  if (
    !isMobileView()
    || !state.restoreCameraOnResume
    || state.cameraActive
    || state.cameraStarting
    || lookSelect.disabled
  ) {
    return;
  }

  state.cameraForceOpenUntilStarted = true;
  state.mobileSettingsOpen = false;
  updateMobileCameraState();
  debugEvent("camera:lifecycle-restore", { reason });
  startCamera({ automatic: true }).catch((error) => {
    console.error(error);
    state.cameraForceOpenUntilStarted = false;
    updateMobileCameraState();
  });
}

function resetMobileTransitionState(options = {}) {
  clearCameraGalleryTransitionTimer();
  clearCameraGalleryStopTimer();
  const preserveGallerySwipe = Boolean(options.preserveGalleryTransform && state.gallerySwipe.prewarmStarted);
  if (!options.preserveGalleryTransform) {
    clearGalleryCameraReturnTimer();
    document.body.classList.remove("gallery-camera-returning");
    state.galleryCameraReturnRevealStarted = false;
    state.galleryCameraReturnRevealAt = 0;
  }
  state.cameraSwipe.active = false;
  state.cameraSwipe.pointerId = null;
  state.cameraSwipe.axis = null;
  state.cameraSwipe.distance = 0;
  state.cameraSwipe.startedInCameraList = false;
  state.cameraSwipe.startedInFavoriteDrawer = false;
  state.cameraSwipe.horizontalDirection = null;
  state.cameraGalleryTransitioning = false;
  state.cameraGalleryDeferred = false;
  state.cameraGalleryOpenStartedAt = 0;
  if (!preserveGallerySwipe) {
    state.gallerySwipe.active = false;
    state.gallerySwipe.pointerId = null;
    state.gallerySwipe.startY = 0;
    state.gallerySwipe.distance = 0;
    state.gallerySwipe.prewarmStarted = false;
    state.gallerySwipe.prewarmReason = "";
    state.gallerySwipe.prewarmStartedAt = 0;
    state.gallerySwipe.prewarmToken = 0;
  }
  workspace.style.transition = "";
  workspace.style.transform = "";
  if (!options.preserveGalleryTransform) {
    mobileGallery.style.transition = "";
    mobileGallery.style.transform = "";
  }
  setCameraGalleryPeek(false);
  setCameraGalleryDeferred(false);
  if (options.closeDrawers) {
    setCameraListOpen(false);
    setFavoriteCameraDrawerOpen(false);
  }
  if (options.resetNativePreviewOffset) {
    resetNativePreviewOffsetNow();
  }
}

function clearCameraGalleryTransitionTimer() {
  state.cameraGalleryTransitionToken += 1;
  clearGalleryTransitionEndRenderTimer();
  clearGalleryCaptureEndRenderTimer();
  if (state.cameraGalleryTransitionTimer) {
    window.clearTimeout(state.cameraGalleryTransitionTimer);
    state.cameraGalleryTransitionTimer = 0;
  }
}

function clearGalleryTransitionEndRenderTimer() {
  if (state.galleryTransitionEndRenderTimer) {
    window.clearTimeout(state.galleryTransitionEndRenderTimer);
    state.galleryTransitionEndRenderTimer = 0;
  }
}

function clearGalleryCaptureEndRenderTimer() {
  if (state.galleryCaptureEndRenderTimer) {
    window.clearTimeout(state.galleryCaptureEndRenderTimer);
    state.galleryCaptureEndRenderTimer = 0;
  }
}

function clearCameraGalleryStopTimer() {
  if (state.cameraGalleryStopTimer) {
    window.clearTimeout(state.cameraGalleryStopTimer);
    state.cameraGalleryStopTimer = 0;
  }
}

function clearGalleryCameraReturnTimer() {
  state.galleryCameraReturnToken += 1;
  if (state.galleryCameraReturnTimer) {
    window.clearTimeout(state.galleryCameraReturnTimer);
    state.galleryCameraReturnTimer = 0;
  }
}

function getNativeBridge() {
  return window.Capacitor?.Plugins?.KonoNativeBridge ?? null;
}

function isNativeCameraAvailable() {
  return Boolean(getNativeBridge()?.startCamera);
}

function installMobileZoomGuards() {
  document.addEventListener(
    "gesturestart",
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches?.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false }
  );
}

async function startCamera(options = {}) {
  if (!isMobileView()) {
    return;
  }

  if (state.cameraStopping || state.cameraStopPromise) {
    await waitForCameraStop();
  }

  if (state.cameraActive || state.cameraStarting) {
    return;
  }

  const startToken = ++state.cameraStartToken;
  state.cameraStarting = true;
  state.cameraForceOpenUntilStarted = true;
  state.restoreCameraOnResume = true;
  state.mobileSettingsOpen = false;
  state.nativePreviewRectLastGood = null;
  resetMobileTransitionState({
    closeDrawers: true,
    resetNativePreviewOffset: true,
    preserveGalleryTransform: Boolean(options.preserveGalleryTransition),
  });
  updateMobileCameraState();
  preloadGalleryInBackground(options.automatic ? "camera-autostart" : "camera-start");

  try {
    if (isNativeCameraAvailable() && !USE_WEB_FILTERED_CAMERA_PREVIEW) {
      await startNativeCamera(startToken);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera capture is not available in this browser.");
      state.cameraForceOpenUntilStarted = false;
      updateMobileCameraState();
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: state.cameraFacingMode },
        width: { ideal: 4032 },
        height: { ideal: 3024 },
      },
      audio: false,
    });
    if (state.cameraStartToken !== startToken) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      return;
    }

    state.cameraStream = stream;
    state.cameraActive = true;
    cameraPreview.srcObject = stream;
    cameraPreviewSlot.prepend(cameraPreview);
    cameraPreviewSlot.append(canvas);
    await cameraPreview.play();
    state.cameraTorchSupported = detectTorchSupport(stream);
    state.cameraPermissionState = CAMERA_PERMISSION_GRANTED;
    writeStoredCameraPermission(CAMERA_PERMISSION_GRANTED);
    resetCanvasView();
    cameraShell.hidden = false;
    canvas.style.display = "block";
    emptyState.style.display = "none";
    updateMobileCameraState();
    startLiveCameraRender();
    state.cameraForceOpenUntilStarted = false;
    revealAppUi();
    setStatus("Camera ready. Live preview uses the selected preset.");
    preloadGalleryInBackground("web-camera-ready");
    warmCaptureAssets(lookSelect.value, "web-camera-ready");
  } catch (error) {
    console.error(error);
    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      state.cameraPermissionState = CAMERA_PERMISSION_DENIED;
      writeStoredCameraPermission(CAMERA_PERMISSION_DENIED);
      setStatus("Camera permission is blocked. Enable it in Safari/site settings.");
    } else {
      setStatus("Unable to open the camera.");
    }
    state.cameraForceOpenUntilStarted = false;
    updateMobileCameraState();
    revealAppUi();
  } finally {
    if (state.cameraStartToken === startToken) {
      state.cameraStarting = false;
      updateMobileCameraState();
    }
  }
}

async function startNativeCamera(startToken = state.cameraStartToken) {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.startCamera) {
    throw new Error("Native camera bridge is unavailable.");
  }

  try {
    setupNativeHardwareShutter();
    state.mobileSettingsOpen = false;
    cameraPreviewSlot.append(canvas);
    resetCanvasView();
    cameraShell.hidden = false;
    state.cameraActive = true;
    state.nativeCameraActive = true;
    state.nativeCameraReady = false;
    state.nativePreviewRectLastGood = null;
    canvas.style.display = "block";
    emptyState.style.display = "none";
    updateMobileCameraState();
    await waitForNextPaint();
    const result = await nativeBridge.startCamera({
      facingMode: state.cameraFacingMode,
      flashEnabled: state.cameraFlashEnabled,
      cropFactor: getCameraCropFactor(),
      previewRect: getCameraPreviewViewportRect(),
      shellRect: getCameraShellViewportRect(),
      overlayPath: getNativeCameraOverlayPath(),
    });
    if (state.cameraStartToken !== startToken || !state.cameraActive) {
      nativeBridge.stopCamera?.().catch((error) => console.error(error));
      return;
    }
    state.nativeCameraReady = true;
    state.nativeCameraPreviewSize = {
      width: Number(result?.width) || MOBILE_CAPTURE_WIDTH,
      height: Number(result?.height) || MOBILE_CAPTURE_HEIGHT,
    };
    state.cameraTorchSupported = Boolean(result?.flashSupported);
    state.cameraPermissionState = CAMERA_PERMISSION_GRANTED;
    writeStoredCameraPermission(CAMERA_PERMISSION_GRANTED);
    updateMobileCameraState();
    if (!NATIVE_CAMERA_PREVIEW_MODE) {
      renderNativeCameraPlaceholder();
    }
    state.cameraForceOpenUntilStarted = false;
    revealAppUi();
    setStatus("Native camera ready. Captures use iPhone camera APIs.");
    preloadGalleryInBackground("native-camera-ready");
    warmCaptureAssets(lookSelect.value, "native-camera-ready");
  } catch (error) {
    console.error(error);
    state.nativeCameraActive = false;
    state.nativeCameraReady = false;
    state.cameraActive = false;
    cameraShell.hidden = true;
    workspace.append(canvas);
    state.cameraForceOpenUntilStarted = false;
    if (error?.message?.includes("denied")) {
      state.cameraPermissionState = CAMERA_PERMISSION_DENIED;
      writeStoredCameraPermission(CAMERA_PERMISSION_DENIED);
      setStatus("Camera permission is blocked. Enable it in iOS Settings.");
    } else {
      setStatus("Unable to open the native camera.");
    }
    updateMobileCameraState();
    revealAppUi();
  }
}

function stopCamera(options = {}) {
  state.cameraStartToken += 1;
  state.cameraStarting = false;
  if (state.gifCaptureInProgress && !options.force) {
    setStatus("Recording GIF. Wait for it to finish.");
    updateMobileCameraState();
    return;
  }
  if (state.videoCaptureInProgress && !options.force) {
    stopNativeVideoRecording("stop-camera").catch((error) => console.error(error));
    setStatus("Stopping video recording before closing camera.");
    updateMobileCameraState();
    return;
  }
  if (state.cameraCaptureInProgress && !options.force) {
    state.pendingCameraStopOptions = { ...options };
    setStatus("Finishing capture before closing camera.");
    updateMobileCameraState();
    return;
  }

  stopLiveCameraRender();
  resetMobileTransitionState({ closeDrawers: true, resetNativePreviewOffset: true });
  resetNativePreviewOffsetNow();
  if (state.nativePreviewRectFrame) {
    window.cancelAnimationFrame(state.nativePreviewRectFrame);
    state.nativePreviewRectFrame = 0;
  }
  if (state.nativePreviewOffsetFrame) {
    window.cancelAnimationFrame(state.nativePreviewOffsetFrame);
    state.nativePreviewOffsetFrame = 0;
  }
  if (state.nativePreviewOffsetAnimationFrame) {
    window.cancelAnimationFrame(state.nativePreviewOffsetAnimationFrame);
    state.nativePreviewOffsetAnimationFrame = 0;
  }
  state.nativePreviewRectInFlight = false;
  state.nativePreviewOffsetInFlight = false;
  state.nativePreviewOffsetY = 0;
  state.nativePreviewOffsetSentY = null;
  state.nativePreviewRectLastGood = null;

  if (state.nativeCameraActive) {
    trackCameraStopPromise(getNativeBridge()?.stopCamera?.());
  }

  if (state.cameraStream) {
    applyCameraTorch(false).catch((error) => console.error(error));
    for (const track of state.cameraStream.getTracks()) {
      track.stop();
    }
  }

  state.cameraStream = null;
  state.cameraActive = false;
  state.nativeCameraActive = false;
  state.nativeCameraReady = false;
  state.cameraPendingCaptureCount = 0;
  state.cameraPendingDrainScheduled = false;
  state.cameraForceOpenUntilStarted = Boolean(options.keepCameraMode);
  state.cameraTorchSupported = false;
  state.mobileSettingsOpen = Boolean(options.settings) && !options.keepCameraMode;
  if (options.keepCameraMode) {
    state.restoreCameraOnResume = true;
  }
  state.pendingCameraStopOptions = null;
  cameraPreview.srcObject = null;
  cameraShell.hidden = true;
  workspace.append(canvas);
  if (state.source === cameraPreview) {
    if (state.stillImage) {
      state.source = state.stillImage;
      state.sourceName = state.stillSourceName;
      state.sourceResolution = {
        width: state.stillImage.naturalWidth,
        height: state.stillImage.naturalHeight,
      };
      uploadSourceTexture(state.stillImage);
    } else {
      state.source = null;
    }
  }
  updateMobileCameraState();
  if (!options.settings && !options.skipGalleryLoad) {
    loadGalleryOnDemand().catch((error) => console.error(error));
  }

  if (state.source) {
    renderImage();
  } else {
    emptyState.style.display = "flex";
  }
}

function getCameraPreviewViewportRect() {
  const rect = cameraPreviewSlot.getBoundingClientRect();
  return getViewportRectFromDomRect(rect);
}

function getCameraShellViewportRect() {
  const frame = document.querySelector(".camera-device-frame");
  const rect = frame?.getBoundingClientRect?.();
  return rect ? getViewportRectFromDomRect(rect) : getCameraPreviewViewportRect();
}

function getNativeCameraOverlayPath() {
  const key = getCameraOverlayKey();
  return CAMERA_OVERLAY_SOURCES[key] ?? CAMERA_OVERLAY_SOURCES.quicksnap;
}

function getViewportRectFromDomRect(rect) {
  const scale = window.devicePixelRatio || 1;
  const viewportRect = {
    x: Math.round(rect.left * scale),
    y: Math.round(rect.top * scale),
    width: Math.round(rect.width * scale),
    height: Math.round(rect.height * scale),
  };
  const minSide = Math.round(80 * scale);
  const viewportWidth = Math.round(window.innerWidth * scale);
  const viewportHeight = Math.round(window.innerHeight * scale);
  const valid = viewportRect.width >= minSide
    && viewportRect.height >= minSide
    && viewportRect.x > -viewportRect.width
    && viewportRect.y > -viewportRect.height
    && viewportRect.x < viewportWidth
    && viewportRect.y < viewportHeight;

  if (valid) {
    state.nativePreviewRectLastGood = viewportRect;
    return viewportRect;
  }

  debugEvent("native-preview-rect:ignored", viewportRect);
  return state.nativePreviewRectLastGood ?? {
    x: 0,
    y: 0,
    width: viewportWidth,
    height: viewportHeight,
  };
}

function scheduleNativePreviewRectUpdate() {
  const nativeBridge = getNativeBridge();
  if (!state.nativeCameraActive || !nativeBridge?.setPreviewRect || state.nativePreviewRectFrame) {
    return;
  }

  state.nativePreviewRectFrame = window.requestAnimationFrame(() => {
    state.nativePreviewRectFrame = 0;
    if (!state.nativeCameraActive || state.nativePreviewRectInFlight) {
      return;
    }

    state.nativePreviewRectInFlight = true;
    nativeBridge.setPreviewRect({
      previewRect: getCameraPreviewViewportRect(),
      shellRect: getCameraShellViewportRect(),
      overlayPath: getNativeCameraOverlayPath(),
    })
      .catch((error) => {
        console.error(error);
        debugEvent("native-preview-rect:error", { message: error?.message ?? String(error) });
      })
      .finally(() => {
        state.nativePreviewRectInFlight = false;
      });
  });
}

function resyncNativeCameraPreview(reason = "unknown") {
  if (!state.nativeCameraActive) {
    return;
  }

  debugEvent("native-preview:resync", {
    reason,
    cropFactor: getCameraCropFactor(),
    visible: document.visibilityState,
  });

  getNativeBridge()?.setCropFactor?.({ factor: getCameraCropFactor() }).catch((error) => {
    console.error(error);
    debugEvent("native-preview-crop:error", { message: error?.message ?? String(error), reason });
  });
  scheduleNativePreviewOffsetUpdate(state.nativePreviewOffsetY || 0);
  scheduleNativePreviewRectUpdate();
}

function scheduleNativePreviewOffsetUpdate(y = 0) {
  const nativeBridge = getNativeBridge();
  if (!state.nativeCameraActive || !nativeBridge?.setPreviewOffset) {
    return;
  }
  state.nativePreviewOffsetY = Math.round(Number(y || 0) * 2) / 2;
  if (state.nativePreviewOffsetFrame) {
    return;
  }

  state.nativePreviewOffsetFrame = window.requestAnimationFrame(() => {
    state.nativePreviewOffsetFrame = 0;
    if (!state.nativeCameraActive) {
      return;
    }
    if (state.nativePreviewOffsetInFlight) {
      return;
    }
    const nextY = state.nativePreviewOffsetY;
    if (state.nativePreviewOffsetSentY !== null && Math.abs(state.nativePreviewOffsetSentY - nextY) < 0.5) {
      return;
    }
    state.nativePreviewOffsetInFlight = true;
    nativeBridge.setPreviewOffset({ y: nextY })
      .catch((error) => {
        console.error(error);
        debugEvent("native-preview-offset:error", { message: error?.message ?? String(error) });
      })
      .finally(() => {
        state.nativePreviewOffsetSentY = nextY;
        state.nativePreviewOffsetInFlight = false;
        if (state.nativePreviewOffsetY !== nextY) {
          scheduleNativePreviewOffsetUpdate(state.nativePreviewOffsetY);
        }
      });
  });
}

function resetNativePreviewOffsetNow() {
  cancelNativePreviewOffsetAnimation();
  if (state.nativePreviewOffsetFrame) {
    window.cancelAnimationFrame(state.nativePreviewOffsetFrame);
    state.nativePreviewOffsetFrame = 0;
  }
  state.nativePreviewOffsetY = 0;
  state.nativePreviewOffsetSentY = null;
  if (!state.nativeCameraActive) {
    return;
  }
  getNativeBridge()?.setPreviewOffset?.({ y: 0 }).catch((error) => {
    console.error(error);
    debugEvent("native-preview-offset:reset-error", { message: error?.message ?? String(error) });
  });
}

function cancelNativePreviewOffsetAnimation() {
  if (!state.nativePreviewOffsetAnimationFrame) {
    return;
  }
  window.cancelAnimationFrame(state.nativePreviewOffsetAnimationFrame);
  state.nativePreviewOffsetAnimationFrame = 0;
}

function animateNativePreviewOffsetTo(targetY = 0, durationMs = 220) {
  cancelNativePreviewOffsetAnimation();
  const startY = state.nativePreviewOffsetY || 0;
  const startedAt = performance.now();
  const duration = Math.max(1, durationMs);

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const y = startY + (targetY - startY) * eased;
    scheduleNativePreviewOffsetUpdate(y);
    if (progress < 1) {
      state.nativePreviewOffsetAnimationFrame = window.requestAnimationFrame(step);
      return;
    }
    state.nativePreviewOffsetAnimationFrame = 0;
    scheduleNativePreviewOffsetUpdate(targetY);
  };

  state.nativePreviewOffsetAnimationFrame = window.requestAnimationFrame(step);
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

function startLiveCameraRender() {
  stopLiveCameraRender();
  state.lastLiveRenderAt = 0;
  state.cameraAnimationFrame = window.requestAnimationFrame(renderLiveCameraFrame);
}

function stopLiveCameraRender() {
  if (state.cameraAnimationFrame) {
    window.cancelAnimationFrame(state.cameraAnimationFrame);
    state.cameraAnimationFrame = 0;
  }
}

async function renderLiveCameraFrame() {
  const frameStartedAt = performance.now();
  state.cameraAnimationFrame = 0;

  if (!state.cameraActive || state.nativeCameraActive || state.webglContextLost) {
    return;
  }

  const minFrameInterval = state.cameraSaveProcessing
    ? CAMERA_PREVIEW_SAVE_MIN_FRAME_INTERVAL_MS
    : CAMERA_PREVIEW_MIN_FRAME_INTERVAL_MS;
  if (frameStartedAt - state.lastLiveRenderAt < minFrameInterval) {
    state.cameraAnimationFrame = window.requestAnimationFrame(renderLiveCameraFrame);
    return;
  }
  state.lastLiveRenderAt = frameStartedAt;

  if (cameraPreview.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && cameraPreview.videoWidth && cameraPreview.videoHeight) {
    try {
      if (state.randomCameraEnabled) {
        state.debug.liveFrameCount += 1;
        state.debug.lastLiveFrameMs = 0;
        state.cameraAnimationFrame = window.requestAnimationFrame(renderLiveCameraFrame);
        return;
      }
      await ensureLutTexture(lookSelect.value);
      if (!state.cameraActive) {
        return;
      }
      state.source = cameraPreview;
      state.sourceName = "mobile-live-preview";
      state.sourceResolution = {
        width: cameraPreview.videoWidth,
        height: cameraPreview.videoHeight,
      };
      renderLiveCameraFrameNow();
      const frameMs = performance.now() - frameStartedAt;
      state.debug.liveFrameCount += 1;
      state.debug.liveFrameTotalMs += frameMs;
      state.debug.lastLiveFrameMs = frameMs;
      state.debug.maxLiveFrameMs = Math.max(state.debug.maxLiveFrameMs, frameMs);
      if (state.debug.liveFrameCount % 60 === 0) {
        persistDebugHistory();
      }
    } catch (error) {
      console.error(error);
      setStatus("Failed to render live camera preview.");
    }
  }

  if (state.cameraActive) {
    state.cameraAnimationFrame = window.requestAnimationFrame(renderLiveCameraFrame);
  }
}

function renderLiveCameraFrameNow() {
  if (state.webglContextLost || state.randomCameraEnabled) {
    return;
  }
  const targetSize = getMobileCaptureCanvasSize(cameraPreview.videoWidth, cameraPreview.videoHeight);
  fitCanvasToSize(targetSize.width, targetSize.height, CAMERA_PREVIEW_MAX_SIDE);
  uploadSourceTexturePixels(createCameraPreviewTextureSource() ?? cameraPreview);
  renderImage({ livePreview: true });
}

function renderNativeCameraPlaceholder() {
  const size = state.nativeCameraPreviewSize;
  fitCanvasToSize(size.width, size.height, CAMERA_PREVIEW_MAX_SIDE);
  state.cameraPreviewCanvas.width = canvas.width;
  state.cameraPreviewCanvas.height = canvas.height;
  const context = state.cameraPreviewContext ?? state.cameraPreviewCanvas.getContext("2d");
  if (context) {
    state.cameraPreviewContext = context;
    context.fillStyle = "#111";
    context.fillRect(0, 0, state.cameraPreviewCanvas.width, state.cameraPreviewCanvas.height);
    uploadSourceTexturePixels(state.cameraPreviewCanvas);
  }
  renderImage({ livePreview: true });
}

async function captureCameraFrame() {
  if (!state.cameraActive || !cameraPreview.videoWidth || !cameraPreview.videoHeight) {
    return;
  }

  const captureCanvas = document.createElement("canvas");
  const width = cameraPreview.videoWidth;
  const height = cameraPreview.videoHeight;
  captureCanvas.width = width;
  captureCanvas.height = height;
  const context = captureCanvas.getContext("2d");

  if (!context) {
    setStatus("Failed to capture the camera frame.");
    return;
  }

  context.drawImage(cameraPreview, 0, 0, width, height);
  const blob = await new Promise((resolve) => captureCanvas.toBlob(resolve, "image/jpeg", JPEG_EXPORT_QUALITY));
  if (!blob) {
    setStatus("Failed to capture the camera frame.");
    return;
  }

  await loadBlob(blob, `mobile-capture-${Date.now()}.jpg`);
  stopCamera();
}

async function saveCurrentCameraFrame() {
  if (!state.cameraActive || canvas.style.display === "none") {
    return false;
  }

  const startedAt = performance.now();
  state.cameraCaptureInProgress = true;
  updateMobileCameraState();
  primeGalleryDuringCapture("camera-capture");
  try {
    const shotFilterFilename = await resolveShotFilterFilename();

    const selected = state.filterMap.get(shotFilterFilename);
    rerollOverlaySelections();
    if (state.nativeCameraActive) {
      const nativeResult = await captureAndSaveNativePhotoStack(shotFilterFilename, selected);
      if (nativeResult?.failedSpektra || nativeResult?.failedComplexLayout) {
        return false;
      }
      if (nativeResult?.item) {
        if (!nativeResult.galleryInserted) {
          insertGalleryItemAtFront(nativeResult.item);
          requestGalleryRender("native-capture-insert");
        }
        state.debug.captureCount += 1;
        state.debug.lastCaptureMs = performance.now() - startedAt;
        state.debug.lastCaptureBytes = 0;
        debugEvent("capture", {
          camera: selected?.name ?? shotFilterFilename,
          native: true,
          mode: nativeResult.mode,
          ms: Math.round(state.debug.lastCaptureMs),
        });
        setStatus(
          nativeResult.photosSavePending
            ? `Saved ${selected?.name ?? "camera"} shot with ${nativeResult.mode} to local gallery. Exporting to Photos in background.`
            : nativeResult.nativeSaved
              ? `Saved ${selected?.name ?? "camera"} shot with ${nativeResult.mode} to Photos and local gallery.`
            : `Saved ${selected?.name ?? "camera"} shot with ${nativeResult.mode} to local gallery.`
        );
        return true;
      }
    }

    const rawCapture = state.nativeCameraActive ? await captureNativeCameraBlob() : await captureWebCameraBlobWithFlash();
    let rawBlob = rawCapture?.blob ?? rawCapture;
    const captureOrientation = rawCapture?.orientation ?? "portrait";
    if (!rawBlob) {
      setStatus("Failed to save the camera frame.");
      return false;
    }
    if (state.nativeCameraActive && isComplexNomoLayoutCamera(selected)) {
      rawBlob = await resizeBlobForMaxSide(rawBlob, HEAVY_CAMERA_SAVE_MAX_SIDE);
    }

    const filename = `analoguecam-${selected?.filename ?? "camera"}-${Date.now()}.jpg`;
    enqueueCameraSave({
      rawBlob,
      filename,
      filterFilename: shotFilterFilename,
      cameraName: selected?.name ?? "camera",
      intensity: intensitySlider.value,
      effects: cloneEffectsState(state.effects),
      importedEffects: cloneImportedEffectsState(state.importedEffects),
      overlaySelections: cloneOverlaySelections(state.overlaySelections),
      captureOrientation,
      halfSizeSave: state.halfSizeSave,
      enqueuedAt: performance.now(),
    });
    state.debug.captureCount += 1;
    state.debug.lastCaptureMs = performance.now() - startedAt;
    state.debug.lastCaptureBytes = rawBlob.size ?? 0;
    debugEvent("capture", {
      camera: selected?.name ?? shotFilterFilename,
      native: state.nativeCameraActive,
      orientation: captureOrientation,
      ms: Math.round(state.debug.lastCaptureMs),
      bytes: state.debug.lastCaptureBytes,
    });
    setStatus(`Captured ${selected?.name ?? "camera"} frame. Processing save in background.`);
    return true;
  } finally {
    state.cameraCaptureInProgress = false;
    const pendingStopOptions = state.pendingCameraStopOptions;
    state.pendingCameraStopOptions = null;
    updateMobileCameraState();
    if (pendingStopOptions?.deferredGallery && state.cameraActive) {
      window.setTimeout(() => {
        if (!enterWarmGalleryMode(
          { ...pendingStopOptions, force: true, skipGalleryLoad: true, countWarmOpen: true },
          pendingStopOptions.reason ?? "camera-gallery-open",
          state.cameraGalleryOpenStartedAt,
        )) {
          stopCamera({ ...pendingStopOptions, force: true, skipGalleryLoad: true });
        }
      }, 0);
    } else if (pendingStopOptions?.animateToGallery && state.cameraActive) {
      window.setTimeout(() => openGalleryFromCamera({ ...pendingStopOptions, force: true }), 0);
    } else if (pendingStopOptions && state.cameraActive) {
      window.setTimeout(() => stopCamera({ ...pendingStopOptions, force: true }), 0);
    } else {
      drainPendingCameraCaptures();
    }
  }
}

function requestCameraCapture(options = {}) {
  if (state.gifCaptureInProgress || state.videoCaptureInProgress) {
    debugEvent("capture:ignored", {
      source: options.source ?? "button",
      reason: state.videoCaptureInProgress ? "video-capture" : "gif-capture",
    });
    setStatus(state.videoCaptureInProgress ? "Recording video. Release shutter to stop." : "Recording GIF. Wait for it to finish.");
    return false;
  }

  if (state.cameraGalleryDeferred) {
    debugEvent("capture:ignored", {
      source: options.source ?? "button",
      reason: "gallery-warm",
    });
    return false;
  }

  if (!state.cameraActive) {
    captureCameraFrame().catch((error) => {
      console.error(error);
      setStatus("Failed to capture the camera frame.");
    });
    return false;
  }

  if (state.cameraCaptureInProgress) {
    if (state.cameraPendingCaptureCount >= MAX_PENDING_SHUTTER_CAPTURES) {
      debugEvent("capture:queue-full", {
        source: options.source ?? "button",
        pending: state.cameraPendingCaptureCount,
      });
      setStatus("Still saving. Wait a moment before shooting more.");
      return false;
    }
    state.cameraPendingCaptureCount += 1;
    debugEvent("capture:queued", {
      source: options.source ?? "button",
      pending: state.cameraPendingCaptureCount,
    });
    setStatus(`Queued shot ${state.cameraPendingCaptureCount}.`);
    updateMobileCameraState();
    return true;
  }

  vibrateCapture();
  saveCurrentCameraFrame().catch((error) => {
    console.error(error);
    setStatus("Failed to capture the camera frame.");
    drainPendingCameraCaptures();
  });
  return true;
}

function drainPendingCameraCaptures() {
  if (
    !state.cameraActive ||
    state.cameraCaptureInProgress ||
    state.cameraPendingCaptureCount <= 0 ||
    state.cameraPendingDrainScheduled
  ) {
    updateMobileCameraState();
    return;
  }
  state.cameraPendingDrainScheduled = true;
  debugEvent("capture:queued-drain-scheduled", { pending: state.cameraPendingCaptureCount });
  window.setTimeout(() => {
    state.cameraPendingDrainScheduled = false;
    if (!state.cameraActive) {
      debugEvent("capture:queued-cancelled", {
        reason: "camera-inactive",
        pending: state.cameraPendingCaptureCount,
      });
      updateMobileCameraState();
      return;
    }
    if (state.cameraCaptureInProgress) {
      drainPendingCameraCaptures();
      return;
    }
    if (state.cameraPendingCaptureCount <= 0) {
      updateMobileCameraState();
      return;
    }
    state.cameraPendingCaptureCount -= 1;
    debugEvent("capture:queued-start", { pending: state.cameraPendingCaptureCount });
    updateMobileCameraState();
    vibrateCapture();
    saveCurrentCameraFrame().then((saved) => {
      if (!saved) {
        debugEvent("capture:queued-not-saved", { pending: state.cameraPendingCaptureCount });
      }
    }).catch((error) => {
      console.error(error);
      setStatus("Failed to capture queued camera frame.");
      drainPendingCameraCaptures();
    });
  }, 120);
  updateMobileCameraState();
}

async function resolveShotFilterFilename() {
  if (!state.randomCameraEnabled) {
    return lookSelect.value;
  }

  const realFilters = state.filters.filter((filter) => filter.filename && state.filterMap.has(filter.filename));
  const selected = realFilters[Math.floor(Math.random() * realFilters.length)] ?? realFilters[0];
  if (!selected) {
    return lookSelect.value;
  }
  await selectFilter(selected.filename, {
    keepRandomMode: true,
    skipPreviewWork: state.nativeCameraActive,
    skipStatus: state.nativeCameraActive,
  });
  return selected.filename;
}

async function captureWebCameraBlobWithFlash() {
  const flashSession = await prepareCaptureFlash();
  try {
    return await captureRawCameraBlob();
  } finally {
    await finishCaptureFlash(flashSession);
  }
}

async function captureNativeCameraBlob() {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.capturePhoto) {
    return null;
  }

  const result = await nativeBridge.capturePhoto({
    flashEnabled: state.cameraFlashEnabled,
    facingMode: state.cameraFacingMode,
  });
  if (!result?.dataUrl) {
    return null;
  }
  const blob = await dataUrlToBlob(result.dataUrl);
  const croppedBlob = await cropNativeCameraBlob(blob, result.orientation);
  return {
    blob: croppedBlob,
    orientation: result.orientation ?? "portrait",
  };
}

async function captureAndSaveNativePhotoStack(filterFilename, selectedFilter) {
  const nativeBridge = getNativeBridge();
  const filter = state.filterMap.get(filterFilename);
  if (state.nativeCameraActive && isComplexNomoLayoutCamera(filter)) {
    return captureAndSaveNativeSimplePhotoStack(filterFilename, selectedFilter);
  }
  if (!nativeBridge?.captureAndSavePhotoStack || !isNativeFinalStackSaveEligible(filterFilename, state.effects, state.importedEffects)) {
    return null;
  }

  let pendingGalleryId = "";
  try {
    setupNativeSpektraPendingPreviewListener(nativeBridge);
    const lutBytes = await ensureLutBytes(filterFilename);
    if (!lutBytes) {
      return null;
    }

    const spektraEnabled = hasSpektraGrainEnabled(state.importedEffects);
    pendingGalleryId = spektraEnabled
      ? `pending-spektra-${Date.now()}-${Math.random().toString(36).slice(2)}`
      : "";
    const nativeMaxSide = hasSpektraGrainEnabled(state.importedEffects)
      ? Math.min(getCameraSaveMaxSide(), HEAVY_CAMERA_SAVE_MAX_SIDE)
      : getCameraSaveMaxSide();
    const outputSize = getFilterOutputSize(filterFilename, MOBILE_CAPTURE_WIDTH, MOBILE_CAPTURE_HEIGHT, nativeMaxSide);
    const isBnWFamily = selectedFilter?.groupFilename === "BNW";
    const filename = `analoguecam-${selectedFilter?.filename ?? "camera"}-${Date.now()}.jpg`;
    const result = await nativeBridge.captureAndSavePhotoStack({
      lutBase64: bytesToBase64(lutBytes),
      filename,
      cameraName: selectedFilter?.name ?? "camera",
      intensity: isBnWFamily ? 1 : Number(intensitySlider.value) / 100,
      width: outputSize.width,
      height: outputSize.height,
      cropFactor: getCameraCropFactor(),
      mirrored: state.cameraFacingMode === "user",
      filter: makeNativeStackFilterPayload(filter),
      effects: cloneEffectsState(state.effects),
      importedEffects: cloneImportedEffectsState(state.importedEffects),
      overlaySelections: cloneOverlaySelections(state.overlaySelections ?? {}),
      pendingGalleryId,
    });

    if (!result?.item) {
      removePendingSpektraGalleryItem(pendingGalleryId);
      return null;
    }

    const item = result.item;
    item.width = Number(item.width) || Number(result.width) || null;
    item.height = Number(item.height) || Number(result.height) || null;
    item.orientation = item.orientation ?? result.orientation ?? null;
    debugEvent("native-capture-stack:success", {
      camera: selectedFilter?.name ?? filterFilename,
      width: result.width ?? outputSize.width,
      height: result.height ?? outputSize.height,
      orientation: result.orientation ?? null,
      halfSize: Boolean(state.halfSizeSave),
      metrics: result.metrics ?? null,
    });
    const galleryInserted = replacePendingSpektraGalleryItem(pendingGalleryId, item);
    return {
      item,
      nativeSaved: Boolean(result.saved),
      photosSavePending: Boolean(result.photosSavePending),
      mode: "native capture stack",
      galleryInserted,
    };
  } catch (error) {
    removePendingSpektraGalleryItem(pendingGalleryId);
    console.warn("Native capture stack failed; falling back to queued save.", error);
    debugEvent("native-capture-stack:fallback", {
      camera: selectedFilter?.name ?? filterFilename,
      error: error?.message ?? String(error),
      spektra: hasSpektraGrainEnabled(state.importedEffects),
    });
    if (hasSpektraGrainEnabled(state.importedEffects)) {
      setStatus("Spektra native save failed. Skipped the old JS fallback to avoid a crash.");
      return { item: null, failedSpektra: true };
    }
    return null;
  }
}

async function captureAndSaveNativeSimplePhotoStack(filterFilename, selectedFilter) {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.captureAndSavePhotoStack) {
    return null;
  }

  try {
    const lutBytes = await ensureLutBytes(filterFilename);
    if (!lutBytes) {
      return null;
    }

    const isBnWFamily = selectedFilter?.groupFilename === "BNW";
    const filename = `analoguecam-${selectedFilter?.filename ?? "camera"}-${Date.now()}.jpg`;
    const outputSize = getScaledCaptureOutputSize(HEAVY_CAMERA_SAVE_MAX_SIDE);
    const result = await nativeBridge.captureAndSavePhotoStack({
      lutBase64: bytesToBase64(lutBytes),
      filename,
      cameraName: selectedFilter?.name ?? "camera",
      intensity: isBnWFamily ? 1 : Number(intensitySlider.value) / 100,
      width: outputSize.width,
      height: outputSize.height,
      cropFactor: getCameraCropFactor(),
      mirrored: state.cameraFacingMode === "user",
      filter: {
        id: selectedFilter?.id ?? null,
        name: selectedFilter?.name ?? filterFilename,
        filename: selectedFilter?.filename ?? filterFilename,
        groupFilename: selectedFilter?.groupFilename ?? "",
        overlayAssets: {},
        filters: [],
      },
      effects: cloneEffectsState(state.effects),
      importedEffects: cloneImportedEffectsState(state.importedEffects),
      overlaySelections: cloneOverlaySelections(state.overlaySelections ?? {}),
      pendingGalleryId: "",
    });

    if (!result?.item) {
      return null;
    }

    const item = result.item;
    item.width = Number(item.width) || Number(result.width) || null;
    item.height = Number(item.height) || Number(result.height) || null;
    item.orientation = item.orientation ?? result.orientation ?? null;
    debugEvent("native-capture-simple:success", {
      camera: selectedFilter?.name ?? filterFilename,
      width: result.width ?? outputSize.width,
      height: result.height ?? outputSize.height,
      orientation: result.orientation ?? null,
      reason: "complex-layout-safety",
      metrics: result.metrics ?? null,
    });
    return {
      item,
      nativeSaved: Boolean(result.saved),
      photosSavePending: Boolean(result.photosSavePending),
      mode: "native simple stack",
      galleryInserted: false,
    };
  } catch (error) {
    console.warn("Native simple stack failed; skipping complex JS fallback.", error);
    debugEvent("native-capture-simple:fallback-blocked", {
      camera: selectedFilter?.name ?? filterFilename,
      error: error?.message ?? String(error),
      reason: "complex-layout-js-fallback-disabled",
    });
    setStatus(`${selectedFilter?.name ?? "Camera"} native save failed. Skipped the old JS fallback to avoid a crash.`);
    return { item: null, failedComplexLayout: true };
  }
}

async function captureAndSaveNativeGifStack(filterFilename, selectedFilter) {
  const nativeBridge = getNativeBridge();
  const filter = state.filterMap.get(filterFilename);
  if (!filter || !nativeBridge?.captureAndSaveGifStack || !isNativeFinalStackSaveEligible(filterFilename, state.effects, state.importedEffects)) {
    return null;
  }

  const lutBytes = await ensureLutBytes(filterFilename);
  if (!lutBytes) {
    return null;
  }

  const isBnWFamily = selectedFilter?.groupFilename === "BNW";
  const outputSize = getFilterOutputSize(filterFilename, MOBILE_CAPTURE_WIDTH, MOBILE_CAPTURE_HEIGHT, GIF_CAPTURE_MAX_SIDE);
  const durationSeconds = Number(state.gifDuration) || 2;
  const filename = `analoguecam-${selectedFilter?.filename ?? "camera"}-${Date.now()}.gif`;
  const result = await nativeBridge.captureAndSaveGifStack({
    lutBase64: bytesToBase64(lutBytes),
    filename,
    cameraName: selectedFilter?.name ?? "camera",
    intensity: isBnWFamily ? 1 : Number(intensitySlider.value) / 100,
    width: outputSize.width,
    height: outputSize.height,
    cropFactor: getCameraCropFactor(),
    mirrored: state.cameraFacingMode === "user",
    filter: makeNativeStackFilterPayload(filter),
    effects: cloneEffectsState(state.effects),
    importedEffects: cloneImportedEffectsState(state.importedEffects),
    overlaySelections: cloneOverlaySelections(state.overlaySelections ?? {}),
    durationSeconds,
    fps: GIF_CAPTURE_FPS,
    boomerang: state.gifBoomerang,
  });

  if (!result?.item) {
    return null;
  }
  const item = result.item;
  item.width = Number(item.width) || Number(result.width) || null;
  item.height = Number(item.height) || Number(result.height) || null;
  item.mediaType = "gif";
  item.gifBoomerang = Boolean(result.boomerang);
  state.debug.lastGifCapture = {
    at: new Date().toISOString(),
    camera: selectedFilter?.name ?? filterFilename,
    saved: Boolean(result.saved),
    boomerang: Boolean(result.boomerang),
    durationSeconds,
    fps: result.metrics?.fps ?? GIF_CAPTURE_FPS,
    width: item.width,
    height: item.height,
    maxSide: GIF_CAPTURE_MAX_SIDE,
    frameCount: result.frameCount ?? result.metrics?.frameCount ?? null,
    outputFrameCount: result.outputFrameCount ?? result.metrics?.outputFrameCount ?? null,
    targetFrameCount: result.metrics?.targetFrameCount ?? null,
    frameAttempts: result.metrics?.frameAttempts ?? null,
    deadlineReached: result.metrics?.deadlineReached ?? null,
    gifBytes: result.metrics?.gifBytes ?? null,
    normalGifBytes: result.metrics?.normalGifBytes ?? null,
    loopMode: result.metrics?.loopMode ?? (result.boomerang ? "boomerang" : "normal"),
    focusResetMode: result.metrics?.focusResetMode ?? "",
    spektraApplied: result.metrics?.spektraApplied ?? null,
    metrics: result.metrics ?? null,
  };
  persistDebugHistory();
  debugEvent("native-gif-stack:success", {
    camera: selectedFilter?.name ?? filterFilename,
    durationSeconds,
    boomerang: Boolean(result.boomerang),
    frameCount: result.frameCount ?? null,
    outputFrameCount: result.outputFrameCount ?? result.metrics?.outputFrameCount ?? null,
    metrics: result.metrics ?? null,
  });
  return {
    item,
    nativeSaved: Boolean(result.saved),
    mode: "native gif stack",
  };
}

async function requestGifCapture() {
  if (state.gifCaptureInProgress || state.videoCaptureInProgress || state.cameraCaptureInProgress) {
    setStatus("Camera is busy. Wait for the current capture to finish.");
    return false;
  }
  if (!state.cameraActive || state.cameraGalleryDeferred) {
    return false;
  }

  const nativeBridge = getNativeBridge();
  if (!state.nativeCameraActive || !nativeBridge?.captureAndSaveGifStack) {
    setStatus("GIF mode needs the native iPhone camera.");
    return false;
  }

  state.gifCaptureInProgress = true;
  updateMobileCameraState();
  vibrateCapture();
  const startedAt = performance.now();
  try {
    const shotFilterFilename = await resolveShotFilterFilename();
    const selected = state.filterMap.get(shotFilterFilename);
    rerollOverlaySelections();
    setStatus(`Recording ${state.gifDuration}s GIF${state.gifBoomerang ? " boomerang" : ""}...`);
    const result = await captureAndSaveNativeGifStack(shotFilterFilename, selected);
    if (!result?.item) {
      setStatus("Failed to save GIF.");
      return false;
    }
    insertGalleryItemAtFront(result.item);
    requestGalleryRender("native-gif-insert");
    debugEvent("gif-capture", {
      camera: selected?.name ?? shotFilterFilename,
      ms: Math.round(performance.now() - startedAt),
      boomerang: state.gifBoomerang,
      durationSeconds: Number(state.gifDuration) || 2,
    });
    setStatus(`Saved ${selected?.name ?? "camera"} GIF to Photos and local gallery.`);
    return true;
  } catch (error) {
    console.error(error);
    debugEvent("gif-capture:error", { message: error?.message ?? String(error) });
    setStatus("Failed to record GIF.");
    return false;
  } finally {
    state.gifCaptureInProgress = false;
    updateMobileCameraState();
  }
}

function isGalleryVideoItem(item) {
  return item?.mediaType === "video" || /\.(mov|mp4|m4v)(?:$|\?)/i.test(String(item?.filename ?? item?.fileUrl ?? ""));
}

async function startNativeVideoRecording() {
  if (state.videoCaptureInProgress || state.gifCaptureInProgress || state.cameraCaptureInProgress) {
    setStatus("Camera is busy. Wait for the current capture to finish.");
    return false;
  }
  if (!state.cameraActive || state.cameraGalleryDeferred) {
    return false;
  }

  const nativeBridge = getNativeBridge();
  if (!state.nativeCameraActive || !nativeBridge?.startVideoRecording || !nativeBridge?.stopVideoRecording) {
    setStatus("Video mode needs the native iPhone camera.");
    return false;
  }

  state.videoCaptureInProgress = true;
  state.videoNativeRecordingActive = false;
  state.videoCaptureStopPending = false;
  updateMobileCameraState();
  vibrateCapture();
  const startedAt = performance.now();
  const shotFilterFilename = await resolveShotFilterFilename().catch(() => lookSelect.value);
  const selected = state.filterMap.get(shotFilterFilename);
  const filename = `analoguecam-${selected?.filename ?? "camera"}-${Date.now()}.mov`;
  if (state.videoCaptureStopPending) {
    state.videoCaptureInProgress = false;
    state.videoCaptureStopPending = false;
    updateMobileCameraState();
    return false;
  }
  setStatus("Recording video...");
  const startPromise = nativeBridge.startVideoRecording({
    filename,
    cameraName: selected?.name ?? "camera",
  });
  state.videoCaptureStartPromise = startPromise;

  try {
    const result = await startPromise;
    state.debug.lastVideoCapture = {
      at: new Date().toISOString(),
      camera: selected?.name ?? shotFilterFilename,
      started: Boolean(result?.recording),
      orientation: result?.orientation ?? null,
      orientationSource: result?.orientationSource ?? null,
    };
    persistDebugHistory();
    debugEvent("native-video-recording:start", {
      camera: selected?.name ?? shotFilterFilename,
      orientation: result?.orientation ?? null,
      orientationSource: result?.orientationSource ?? null,
    });
    state.videoNativeRecordingActive = Boolean(result?.recording);
    return state.videoNativeRecordingActive;
  } catch (error) {
    console.error(error);
    state.videoCaptureInProgress = false;
    state.videoNativeRecordingActive = false;
    state.videoCaptureStopPending = false;
    setStatus("Failed to start video recording.");
    debugEvent("native-video-recording:start-error", { message: error?.message ?? String(error) });
    return false;
  } finally {
    if (state.videoCaptureStartPromise === startPromise) {
      state.videoCaptureStartPromise = null;
    }
    updateMobileCameraState();
  }
}

async function stopNativeVideoRecording(reason = "release") {
  if (state.videoCaptureStartPromise) {
    state.videoCaptureStopPending = true;
    await state.videoCaptureStartPromise.catch(() => null);
  }
  if (!state.videoCaptureInProgress) {
    return false;
  }
  if (!state.videoNativeRecordingActive) {
    state.videoCaptureStopPending = true;
    return false;
  }

  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.stopVideoRecording) {
    state.videoCaptureInProgress = false;
    state.videoCaptureStopPending = false;
    updateMobileCameraState();
    return false;
  }

  state.videoCaptureStopPending = false;
  setStatus("Saving video...");
  try {
    const result = await nativeBridge.stopVideoRecording({ reason });
    state.videoNativeRecordingActive = false;
    if (result?.item) {
      const item = {
        ...result.item,
        mediaType: "video",
      };
      insertGalleryItemAtFront(item);
      requestGalleryRender("native-video-insert");
    }
    state.debug.lastVideoCapture = {
      ...(state.debug.lastVideoCapture ?? {}),
      at: new Date().toISOString(),
      saved: Boolean(result?.saved),
      durationMs: result?.durationMs ?? result?.metrics?.durationMs ?? null,
      width: result?.width ?? result?.item?.width ?? null,
      height: result?.height ?? result?.item?.height ?? null,
      orientation: result?.orientation ?? state.debug.lastVideoCapture?.orientation ?? null,
      metrics: result?.metrics ?? null,
    };
    persistDebugHistory();
    debugEvent("native-video-recording:stop", {
      reason,
      saved: Boolean(result?.saved),
      durationMs: result?.durationMs ?? result?.metrics?.durationMs ?? null,
      metrics: result?.metrics ?? null,
    });
    setStatus(result?.saved ? "Saved video to Photos and local gallery." : "Saved video to local gallery.");
    return Boolean(result?.item);
  } catch (error) {
    console.error(error);
    debugEvent("native-video-recording:stop-error", { reason, message: error?.message ?? String(error) });
    setStatus("Failed to save video.");
    return false;
  } finally {
    state.videoCaptureInProgress = false;
    state.videoNativeRecordingActive = false;
    state.videoCaptureStopPending = false;
    updateMobileCameraState();
  }
}

async function lockNativeFocus(distance = state.focusDistance) {
  const nativeBridge = getNativeBridge();
  if (!state.nativeCameraActive || !nativeBridge?.setFocusLock) {
    setStatus("Out of focus mode needs the native iPhone camera.");
    return false;
  }

  const normalizedDistance = FOCUS_DISTANCE_VALUES.has(distance) ? distance : "closest";
  try {
    const result = await nativeBridge.setFocusLock({ distance: normalizedDistance });
    state.debug.lastFocusLock = {
      at: new Date().toISOString(),
      distance: normalizedDistance,
      locked: Boolean(result?.locked),
      lensPosition: result?.lensPosition ?? null,
      targetLensPosition: result?.targetLensPosition ?? result?.lensPosition ?? null,
      actualLensPosition: result?.actualLensPosition ?? null,
      customLensPositionSupported: result?.customLensPositionSupported ?? null,
    };
    persistDebugHistory();
    debugEvent("native-focus-lock", {
      distance: normalizedDistance,
      locked: Boolean(result?.locked),
      lensPosition: result?.lensPosition ?? null,
      targetLensPosition: result?.targetLensPosition ?? result?.lensPosition ?? null,
      actualLensPosition: result?.actualLensPosition ?? null,
      customLensPositionSupported: result?.customLensPositionSupported ?? null,
    });
    setStatus(normalizedDistance === "far" ? "Focus locked far." : "Focus locked close.");
    return Boolean(result?.locked);
  } catch (error) {
    console.error(error);
    debugEvent("native-focus-lock:error", { distance: normalizedDistance, message: error?.message ?? String(error) });
    setStatus("Unable to lock focus.");
    return false;
  }
}

function handleShutterLongPressAction() {
  if (state.shutterLongPressAction === "video") {
    startNativeVideoRecording().catch((error) => {
      console.error(error);
      setStatus("Failed to start video recording.");
    });
    return;
  }
  if (state.shutterLongPressAction === "focus") {
    lockNativeFocus(state.focusDistance).catch((error) => {
      console.error(error);
      setStatus("Unable to lock focus.");
    });
    return;
  }
  requestGifCapture().catch((error) => {
    console.error(error);
    setStatus("Failed to record GIF.");
  });
}

function getScaledCaptureOutputSize(maxSide) {
  const scale = Math.min(1, Math.max(1, maxSide) / Math.max(MOBILE_CAPTURE_WIDTH, MOBILE_CAPTURE_HEIGHT));
  return {
    width: Math.max(1, Math.round(MOBILE_CAPTURE_WIDTH * scale)),
    height: Math.max(1, Math.round(MOBILE_CAPTURE_HEIGHT * scale)),
  };
}

function isLandscapeCaptureOrientation(orientation) {
  return orientation === "landscapeLeft" || orientation === "landscapeRight";
}

function getCaptureOutputSizeForOrientation(orientation) {
  return isLandscapeCaptureOrientation(orientation)
    ? { width: MOBILE_CAPTURE_HEIGHT, height: MOBILE_CAPTURE_WIDTH }
    : { width: MOBILE_CAPTURE_WIDTH, height: MOBILE_CAPTURE_HEIGHT };
}

async function cropNativeCameraBlob(blob, orientation = "portrait") {
  const image = await decodeBlobToImage(blob);
  const portraitCanvas = document.createElement("canvas");
  portraitCanvas.width = MOBILE_CAPTURE_WIDTH;
  portraitCanvas.height = MOBILE_CAPTURE_HEIGHT;
  const context = portraitCanvas.getContext("2d");
  if (!context) {
    return blob;
  }

  context.save();
  const logicalRect = { x: 0, y: 0, width: portraitCanvas.width, height: portraitCanvas.height };
  if (state.cameraFacingMode === "user") {
    context.translate(logicalRect.width, 0);
    context.scale(-1, 1);
  }
  drawImageCover(context, image, logicalRect.x, logicalRect.y, logicalRect.width, logicalRect.height, getCameraCropFactor());
  context.restore();
  const outputCanvas = rotateCaptureCanvasIfNeeded(portraitCanvas, orientation);
  return new Promise((resolve) => outputCanvas.toBlob((croppedBlob) => resolve(croppedBlob ?? blob), "image/jpeg", JPEG_EXPORT_QUALITY));
}

function rotateCaptureCanvasIfNeeded(sourceCanvas, orientation) {
  if (!isLandscapeCaptureOrientation(orientation) && orientation !== "portraitUpsideDown") {
    return sourceCanvas;
  }
  const outputCanvas = document.createElement("canvas");
  if (isLandscapeCaptureOrientation(orientation)) {
    outputCanvas.width = sourceCanvas.height;
    outputCanvas.height = sourceCanvas.width;
  } else {
    outputCanvas.width = sourceCanvas.width;
    outputCanvas.height = sourceCanvas.height;
  }
  const context = outputCanvas.getContext("2d");
  if (!context) {
    return sourceCanvas;
  }
  if (orientation === "landscapeLeft") {
    context.translate(0, outputCanvas.height);
    context.rotate(-Math.PI / 2);
    context.drawImage(sourceCanvas, 0, 0);
    return outputCanvas;
  }
  if (orientation === "landscapeRight") {
    context.translate(outputCanvas.width, 0);
    context.rotate(Math.PI / 2);
    context.drawImage(sourceCanvas, 0, 0);
    return outputCanvas;
  }
  if (orientation === "portraitUpsideDown") {
    context.translate(outputCanvas.width, outputCanvas.height);
    context.rotate(Math.PI);
    context.drawImage(sourceCanvas, 0, 0);
  }
  return outputCanvas;
}

async function captureRawCameraBlob() {
  if (!cameraPreview.videoWidth || !cameraPreview.videoHeight) {
    return null;
  }

  const captureCanvas = document.createElement("canvas");
  const targetSize = getMobileCaptureCanvasSize(cameraPreview.videoWidth, cameraPreview.videoHeight);
  captureCanvas.width = targetSize.width;
  captureCanvas.height = targetSize.height;
  const context = captureCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  drawCameraVideoToContext(context, captureCanvas.width, captureCanvas.height, { preview: false });
  return new Promise((resolve) => captureCanvas.toBlob(resolve, "image/jpeg", JPEG_EXPORT_QUALITY));
}

function getMobileCaptureCanvasSize(sourceWidth, sourceHeight) {
  return { width: MOBILE_CAPTURE_WIDTH, height: MOBILE_CAPTURE_HEIGHT };
}

function createCameraPreviewTextureSource() {
  if (!cameraPreview.videoWidth || !cameraPreview.videoHeight || !canvas.width || !canvas.height) {
    return null;
  }

  const previewCanvas = state.cameraPreviewCanvas;
  previewCanvas.width = canvas.width;
  previewCanvas.height = canvas.height;
  const context = state.cameraPreviewContext ?? previewCanvas.getContext("2d");
  if (!context) {
    return null;
  }
  state.cameraPreviewContext = context;

  drawCameraVideoToContext(context, previewCanvas.width, previewCanvas.height, { preview: true });
  return previewCanvas;
}

function drawCameraVideoToContext(context, width, height, options = {}) {
  context.save();
  if (state.cameraFacingMode === "user") {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  if (options.preview && state.cameraFacingMode !== "user") {
    drawCameraVideoStretch(context, width, height);
  } else {
    drawImageCover(context, cameraPreview, 0, 0, width, height, getCameraCropFactor());
  }
  context.restore();
}

function drawCameraVideoStretch(context, width, height) {
  const sourceWidth = cameraPreview.videoWidth;
  const sourceHeight = cameraPreview.videoHeight;
  if (!sourceWidth || !sourceHeight || width <= 0 || height <= 0) {
    return;
  }

  const cropFactor = getCameraCropFactor();
  if (cropFactor <= 1) {
    context.drawImage(cameraPreview, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
    return;
  }

  const zoomedWidth = sourceWidth / cropFactor;
  const zoomedHeight = sourceHeight / cropFactor;
  const cropX = (sourceWidth - zoomedWidth) / 2;
  const cropY = (sourceHeight - zoomedHeight) / 2;
  context.drawImage(cameraPreview, cropX, cropY, zoomedWidth, zoomedHeight, 0, 0, width, height);
}

function getCameraCropFactor() {
  return CAMERA_CROP_MODES[state.cameraCropModeIndex]?.factor ?? 1;
}

function updateCameraCropButton() {
  const mode = CAMERA_CROP_MODES[state.cameraCropModeIndex] ?? CAMERA_CROP_MODES[0];
  cameraCropToggleButton.textContent = mode.label;
  cameraCropToggleButton.setAttribute("aria-label", `${mode.label}mm camera crop`);
  if (cameraFocalLabel) {
    cameraFocalLabel.textContent = `${mode.label}mm`;
  }
}

function toggleCameraCropMode() {
  const now = performance.now();
  if (now - state.cameraCropLastToggleAt < 220) {
    return;
  }
  state.cameraCropLastToggleAt = now;
  state.cameraCropModeIndex = (state.cameraCropModeIndex + 1) % CAMERA_CROP_MODES.length;
  updateCameraCropButton();
  if (state.nativeCameraActive) {
    getNativeBridge()?.setCropFactor?.({ factor: getCameraCropFactor() })
      .then(() => scheduleNativePreviewRectUpdate())
      .catch((error) => console.error(error));
  }
  if (state.cameraActive && !state.webglContextLost && !state.randomCameraEnabled) {
    window.clearTimeout(state.cameraCropRenderTimer);
    state.cameraCropRenderTimer = window.setTimeout(() => {
      if (state.cameraActive && !state.webglContextLost && !state.randomCameraEnabled) {
        renderLiveCameraFrameNow();
      }
    }, 80);
  }
}

function enqueueCameraSave(job) {
  state.cameraSaveQueue.push(job);
  if (!state.cameraSaveProcessing) {
    state.cameraSaveProcessing = true;
    scheduleSlowCameraSaveProcessing();
  }
}

function scheduleSlowCameraSaveProcessing() {
  const run = () => {
    processNextCameraSave().catch((error) => {
      console.error(error);
      setStatus("Failed to process queued camera save.");
      state.cameraSaveProcessing = false;
    });
  };

  window.setTimeout(() => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(run, { timeout: 4200 });
      return;
    }
    window.setTimeout(run, 0);
  }, 900);
}

async function processNextCameraSave() {
  const job = state.cameraSaveQueue.shift();
  if (!job) {
    state.cameraSaveProcessing = false;
    return;
  }

  const saveStartedAt = performance.now();
  state.debug.lastQueueDelayMs = job.enqueuedAt ? saveStartedAt - job.enqueuedAt : 0;
  debugEvent("save:start", {
    camera: job.cameraName,
    queueDelayMs: Math.round(state.debug.lastQueueDelayMs),
    remaining: state.cameraSaveQueue.length,
  });
  const galleryReady = await ensureGalleryReady();
  if (!galleryReady) {
    setStatus("Local gallery storage is unavailable in this browser.");
    state.cameraSaveProcessing = false;
    return;
  }

  const previous = snapshotRenderState();
  try {
    const nativeResult = await processQueuedSaveWithNativeFinalStack(job) ?? await processQueuedSaveWithNativeCpuStack(job);
    if (nativeResult) {
      insertGalleryItemAtFront(nativeResult.item);
      requestGalleryRender("queued-native-save");
      setStatus(
        nativeResult.nativeSaved
          ? `Saved ${job.cameraName ?? "camera"} shot with ${nativeResult.mode ?? "native"} processing to Photos and local gallery.`
          : `Saved ${job.cameraName ?? "camera"} shot with ${nativeResult.mode ?? "native"} processing to local gallery.`
      );
    } else {
      const image = await decodeBlobToImage(job.rawBlob);
      await waitForNextPaint();
      stopLiveCameraRender();
      lookSelect.value = job.filterFilename;
      cameraLookSelect.value = job.filterFilename;
      intensitySlider.value = job.intensity;
      state.effects = cloneEffectsState(job.effects);
      state.importedEffects = cloneImportedEffectsState(job.importedEffects);
      state.overlaySelections = cloneOverlaySelections(job.overlaySelections ?? state.overlaySelections);
      state.source = image;
      state.sourceName = "queued-camera-save";
      state.sourceResolution = { width: image.naturalWidth, height: image.naturalHeight };
      const maxSide = getMobileSaveMaxSide(image, job);
      fitCanvasToSize(image.naturalWidth, image.naturalHeight, maxSide);
      uploadSourceTexturePixels(createScaledSourceCanvas(image, canvas.width, canvas.height) ?? image);
      await ensureLutTexture(job.filterFilename);
      await ensureCameraOverlayImages(job.filterFilename);
      fitCanvasToFilterOutputSize(job.filterFilename, image.naturalWidth, image.naturalHeight, maxSide);
      await waitForNextPaint();
      renderImage({ includeSpektraGrain: true, includeNomoOverlays: true, includeCameraStack: true });
      if (gl?.isContextLost?.()) {
        throw new Error("WebGL context was lost during queued camera save.");
      }

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_EXPORT_QUALITY));
      if (!blob) {
        throw new Error("Processed camera save did not produce a blob.");
      }

      const item = await saveGalleryBlob(blob, job.filename, job.cameraName ?? state.filterMap.get(job.filterFilename)?.name ?? null);
      insertGalleryItemAtFront(item);
      requestGalleryRender("queued-web-save");
      const nativeSaved = await saveBlobToNativePhotoLibrary(blob, job.filename);
      vibrateSaveComplete();
      setStatus(
        nativeSaved
          ? `Saved ${state.filterMap.get(job.filterFilename)?.name ?? "camera"} shot to Photos and local gallery.`
          : `Saved ${state.filterMap.get(job.filterFilename)?.name ?? "camera"} shot to local gallery.`
      );
    }
  } catch (error) {
    console.error(error);
    await saveRawCameraFallback(job);
  } finally {
    state.debug.saveCount += 1;
    state.debug.lastSaveMs = performance.now() - saveStartedAt;
    state.debug.maxSaveMs = Math.max(state.debug.maxSaveMs, state.debug.lastSaveMs);
    debugEvent("save:end", {
      camera: job.cameraName,
      ms: Math.round(state.debug.lastSaveMs),
      queue: state.cameraSaveQueue.length,
    });
    restoreRenderState(previous);
  }

  if (state.cameraSaveQueue.length) {
    scheduleSlowCameraSaveProcessing();
  } else {
    state.cameraSaveProcessing = false;
  }
}

async function processQueuedSaveWithNativeFinalStack(job) {
  const nativeBridge = getNativeBridge();
  const filter = state.filterMap.get(job.filterFilename);
  if (!nativeBridge?.processAndSavePhotoStack || !isNativeFinalStackSaveEligible(job.filterFilename, job.effects, job.importedEffects)) {
    return null;
  }

  try {
    const lutBytes = await ensureLutBytes(job.filterFilename);
    if (!lutBytes) {
      return null;
    }

    const processingBlob = job.halfSizeSave || hasSpektraGrainEnabled(job.importedEffects)
      ? await resizeBlobForMaxSide(
        job.rawBlob,
        hasSpektraGrainEnabled(job.importedEffects) ? HEAVY_CAMERA_SAVE_MAX_SIDE : Math.round(MOBILE_SAVE_MAX_SIDE / 2),
      )
      : job.rawBlob;
    const image = await decodeBlobToImage(processingBlob);
    const outputSize = getFilterOutputSize(job.filterFilename, image.naturalWidth, image.naturalHeight, getCameraSaveMaxSide(job));
    const selectedFilter = state.filterMap.get(job.filterFilename);
    const isBnWFamily = selectedFilter?.groupFilename === "BNW";
    const result = await nativeBridge.processAndSavePhotoStack({
      dataUrl: await blobToDataUrl(processingBlob),
      lutBase64: bytesToBase64(lutBytes),
      filename: job.filename,
      intensity: isBnWFamily ? 1 : Number(job.intensity) / 100,
      width: outputSize.width,
      height: outputSize.height,
      filter: makeNativeStackFilterPayload(filter),
      effects: job.effects,
      importedEffects: cloneImportedEffectsState(job.importedEffects),
      overlaySelections: job.overlaySelections ?? {},
    });

    const item = result.item ?? (
      result.dataUrl
        ? await saveGalleryBlob(await dataUrlToBlob(result.dataUrl), result.filename ?? job.filename, job.cameraName ?? null)
        : null
    );
    if (!item) {
      return null;
    }
    debugEvent("native-stack:success", {
      camera: job.cameraName,
      width: outputSize.width,
      height: outputSize.height,
      halfSize: Boolean(job.halfSizeSave),
      metrics: result.metrics ?? null,
    });
    return { item, nativeSaved: Boolean(result.saved), mode: "native stack" };
  } catch (error) {
    console.warn("Native final stack failed; falling back to JS stack.", error);
    debugEvent("native-stack:fallback", {
      camera: job.cameraName,
      error: error?.message ?? String(error),
      spektra: hasSpektraGrainEnabled(job.importedEffects),
    });
    if (hasSpektraGrainEnabled(job.importedEffects)) {
      throw new Error("Native Spektra failed; JS Spektra fallback skipped to avoid WebView crash.");
    }
    return null;
  }
}

function makeNativeStackFilterPayload(filter) {
  return {
    id: filter.id,
    name: filter.name,
    filename: filter.filename,
    groupFilename: filter.groupFilename,
    overlayAssets: filter.overlayAssets ?? {},
    filters: filter.filters ?? [],
  };
}

async function processQueuedSaveWithNativeCpuStack(job) {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.processPhoto) {
    return null;
  }

  const lutBytes = await ensureLutBytes(job.filterFilename);
  if (!lutBytes) {
    return null;
  }

  const selectedFilter = state.filterMap.get(job.filterFilename);
  const isBnWFamily = selectedFilter?.groupFilename === "BNW";
  const needsLowMemoryStack = isComplexNomoLayoutCamera(selectedFilter) || hasCameraStackOverlayAssets(selectedFilter);
  const processingBlob = needsLowMemoryStack
    ? await resizeBlobForMaxSide(job.rawBlob, HEAVY_CAMERA_SAVE_MAX_SIDE)
    : job.halfSizeSave
      ? await resizeBlobForHalfSizeSave(job.rawBlob)
      : job.rawBlob;
  const result = await nativeBridge.processPhoto({
    dataUrl: await blobToDataUrl(processingBlob),
    lutBase64: bytesToBase64(lutBytes),
    filename: job.filename,
    intensity: isBnWFamily ? 1 : Number(job.intensity) / 100,
  });

  if (!result?.dataUrl) {
    return null;
  }

  const image = await decodeBlobToImage(await dataUrlToBlob(result.dataUrl));
  const previous = snapshotRenderState();
  try {
    lookSelect.value = job.filterFilename;
    cameraLookSelect.value = job.filterFilename;
    intensitySlider.value = job.intensity;
    state.effects = cloneEffectsState(job.effects);
    state.importedEffects = cloneImportedEffectsState(job.importedEffects);
    state.overlaySelections = cloneOverlaySelections(job.overlaySelections ?? state.overlaySelections);
    await ensureCameraOverlayImages(job.filterFilename);

    const outputSize = getFilterOutputSize(job.filterFilename, image.naturalWidth, image.naturalHeight, getCameraSaveMaxSide(job));
    const processedBlob = await renderNativeProcessedImageWithCpuStack(image, outputSize.width, outputSize.height, {
      includeSpektraGrain: true,
      includeNomoOverlays: true,
      includeCameraStack: true,
    });
    const item = await saveGalleryBlob(processedBlob, result.filename ?? job.filename, job.cameraName ?? null);
    const nativeSaved = await saveBlobToNativePhotoLibrary(processedBlob, result.filename ?? job.filename);
    vibrateSaveComplete();
    return { item, nativeSaved, mode: "native LUT + JS stack" };
  } finally {
    restoreRenderState(previous);
  }
}

function isNativeFinalStackSaveEligible(filterFilename, effects, importedEffects) {
  const filter = state.filterMap.get(filterFilename);
  if (!filter || filter.custom || filter.id === RAINBOW_CAMERA_ID) {
    return false;
  }
  if (!areNativeFinalStackEffectsSupported(effects)) {
    return false;
  }
  return isNativeFinalStackCameraSupported(filter);
}

function hasSpektraGrainEnabled(importedEffects) {
  return Boolean(importedEffects?.spektraGrain?.enabled);
}

function areNativeFinalStackEffectsSupported(effects) {
  for (const [effectId, effect] of Object.entries(effects ?? {})) {
    const catalog = getEffectById(effectId);
    const value = Number(effect?.value ?? catalog?.defaultValue ?? 0);
    const defaultValue = Number(catalog?.defaultValue ?? 0);
    if (value === defaultValue) {
      continue;
    }
    if (
      NATIVE_FINAL_STACK_OVERLAY_EFFECT_IDS.has(effectId)
      || catalog?.group === "tone"
      || effectId === "sharpen"
      || effectId === "disposableSoftness"
    ) {
      continue;
    }
    return false;
  }
  return true;
}

function isNativeFinalStackCameraSupported(filter) {
  if (isComplexNomoLayoutCamera(filter)) {
    return false;
  }
  for (const effect of filter.filters ?? []) {
    const type = String(effect.type ?? "").toLowerCase();
    if (!NATIVE_FINAL_STACK_CAMERA_FILTER_TYPES.has(type)) {
      continue;
    }
    if (!isNativeFinalStackCameraEffectSupported(effect, filter)) {
      return false;
    }
  }
  return true;
}

function isComplexNomoLayoutCamera(filter) {
  if (!filter) {
    return false;
  }
  const complexIds = new Set([42, 46, 47, 49, 50, 51]);
  if (complexIds.has(filter.id)) {
    return true;
  }
  return ["INS A", "INS 70", "Lonesome", "McDonald’s", "Lunar Rabbits", "620 B"].includes(filter.name);
}

function isNativeFinalStackCameraEffectSupported(effect, filter) {
  const type = String(effect.type ?? "").toLowerCase();
  if (type === "frame" && isFrameDisabledCamera(filter)) {
    return true;
  }
  const params = effect.params ?? {};
  const fillMode = String(params.fillmode ?? "").toLowerCase();
  if (fillMode === "tiled") {
    return false;
  }
  if (params.only || params.region || params.replace === "1") {
    return false;
  }
  return true;
}

function hasCameraStackOverlayAssets(filter) {
  if (!filter || isFrameDisabledCamera(filter)) {
    return false;
  }
  const overlayAssets = filter.overlayAssets ?? {};
  return Boolean(overlayAssets.frame?.length || overlayAssets.blend?.length || overlayAssets.water?.length);
}

function getMobileSaveMaxSide(image, job = null) {
  const sourceMaxSide = Math.max(image.naturalWidth || 0, image.naturalHeight || 0);
  const textureLimit = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : MOBILE_SAVE_MAX_SIDE;
  const safeTextureLimit = Number.isFinite(textureLimit) ? Math.max(1, Math.floor(textureLimit)) : MOBILE_SAVE_MAX_SIDE;
  const filter = state.filterMap.get(job?.filterFilename ?? lookSelect.value);
  const heavyCameraStack = hasCameraStackOverlayAssets(filter)
    || (job?.effects?.nomoGrain?.value ?? state.effects.nomoGrain?.value ?? 0) > 0
    || hasSpektraGrainEnabled(job?.importedEffects ?? state.importedEffects);
  const requestedMaxSide = Math.min(getCameraSaveMaxSide(job), heavyCameraStack ? HEAVY_CAMERA_SAVE_MAX_SIDE : MOBILE_SAVE_MAX_SIDE);
  return Math.min(sourceMaxSide || requestedMaxSide, requestedMaxSide, safeTextureLimit);
}

function getCameraSaveMaxSide(job = null) {
  return (job?.halfSizeSave ?? state.halfSizeSave) ? Math.round(MOBILE_SAVE_MAX_SIDE / 2) : MOBILE_SAVE_MAX_SIDE;
}

async function resizeBlobForHalfSizeSave(blob) {
  return resizeBlobForMaxSide(blob, Math.round(MOBILE_SAVE_MAX_SIDE / 2));
}

async function resizeBlobForMaxSide(blob, maxSide) {
  const image = await decodeBlobToImage(blob);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, Math.max(1, maxSide) / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const resizeCanvas = document.createElement("canvas");
  resizeCanvas.width = width;
  resizeCanvas.height = height;
  const context = resizeCanvas.getContext("2d");
  if (!context) {
    return blob;
  }
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve) => {
    resizeCanvas.toBlob((resizedBlob) => resolve(resizedBlob ?? blob), "image/jpeg", JPEG_EXPORT_QUALITY);
  });
}

function createScaledSourceCanvas(source, width, height) {
  if (!width || !height) {
    return null;
  }

  const scaledCanvas = document.createElement("canvas");
  scaledCanvas.width = width;
  scaledCanvas.height = height;
  const context = scaledCanvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(source, 0, 0, width, height);
  return scaledCanvas;
}

async function saveRawCameraFallback(job) {
  const galleryReady = await ensureGalleryReady();
  if (!galleryReady) {
    setStatus("Failed to process queued camera save.");
    return;
  }

  const fallbackName = job.filename.replace(/\.jpe?g$/i, "-raw.jpg");
  const fallbackBlob = job.halfSizeSave ? await resizeBlobForHalfSizeSave(job.rawBlob) : job.rawBlob;
  const item = await saveGalleryBlob(fallbackBlob, fallbackName, job.cameraName ?? state.filterMap.get(job.filterFilename)?.name ?? null);
  insertGalleryItemAtFront(item);
  requestGalleryRender("queued-raw-fallback");
  setStatus("Filtered save failed, so the raw camera frame was saved instead.");
}

function snapshotRenderState() {
  return {
    source: state.source,
    sourceName: state.sourceName,
    sourceResolution: { ...state.sourceResolution },
    filterFilename: lookSelect.value,
    intensity: intensitySlider.value,
    effects: cloneEffectsState(state.effects),
    importedEffects: cloneImportedEffectsState(state.importedEffects),
    overlaySelections: cloneOverlaySelections(state.overlaySelections),
    currentCameraOverlayImages: state.currentCameraOverlayImages,
  };
}

function restoreRenderState(previous) {
  lookSelect.value = previous.filterFilename;
  cameraLookSelect.value = previous.filterFilename;
  intensitySlider.value = previous.intensity;
  state.effects = previous.effects;
  state.importedEffects = previous.importedEffects;
  state.overlaySelections = previous.overlaySelections;
  state.currentCameraOverlayImages = previous.currentCameraOverlayImages;
  syncIntensityControlState();
  updateEffectControlState();
  syncEffectInputs();
  syncImportedEffectInputs();

  if (state.nativeCameraActive) {
    renderNativeCameraPlaceholder();
    return;
  }

  if (state.cameraActive && cameraPreview.videoWidth && cameraPreview.videoHeight) {
    state.source = cameraPreview;
    state.sourceName = "mobile-live-preview";
    state.sourceResolution = {
      width: cameraPreview.videoWidth,
      height: cameraPreview.videoHeight,
    };
    renderLiveCameraFrameNow();
    startLiveCameraRender();
    return;
  }

  state.source = previous.source;
  state.sourceName = previous.sourceName;
  state.sourceResolution = previous.sourceResolution;
  if (state.source instanceof HTMLImageElement) {
    uploadSourceTexture(state.source);
    renderImage();
  }
}

function cloneEffectsState(effects) {
  return Object.fromEntries(Object.entries(effects).map(([id, effect]) => [id, { ...effect }]));
}

function cloneImportedEffectsState(importedEffects) {
  return {
    spektraGrain: {
      ...importedEffects.spektraGrain,
    },
  };
}

function decodeBlobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode queued camera frame."));
    };
    image.src = url;
  });
}

function vibrateCapture() {
  const levelPadding = state.levelGuideEnabled ? 190 : 80;
  const levelSuppressMs = state.levelGuideEnabled ? levelPadding + 245 + 1000 : 0;
  triggerHapticPattern([
    { style: "heavy", delay: levelPadding, suppressLevelMs: levelSuppressMs },
    { style: "rigid", delay: levelPadding + 245 },
  ], state.levelGuideEnabled ? [1, 190, 42, 245, 24, 220, 1] : [1, 80, 36, 205, 20]);
}

function vibrateSaveComplete() {
  // Intentionally silent. The shutter haptic is the only shooting vibration.
}

function triggerHaptic(style, pattern) {
  const nativeBridge = getNativeBridge();
  if (nativeBridge?.hapticImpact) {
    nativeBridge.hapticImpact({ style }).catch(() => {});
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function triggerHapticPattern(steps, fallbackPattern) {
  const nativeBridge = getNativeBridge();
  if (nativeBridge?.hapticImpact) {
    for (const step of steps) {
      window.setTimeout(() => {
        nativeBridge.hapticImpact({ style: step.style, suppressLevelMs: step.suppressLevelMs ?? 0 }).catch(() => {});
      }, step.delay);
    }
    return;
  }
  if (navigator.vibrate) {
    navigator.vibrate(fallbackPattern);
  }
}

function flashCameraPreview() {
  if (state.nativeCameraActive) {
    getNativeBridge()?.setPreviewFlashOverlay?.({
      tintVisible: state.cameraFlashEnabled,
      pulse: true,
    }).catch((error) => {
      console.error(error);
      debugEvent("native-preview-flash:error", { message: error?.message ?? String(error) });
    });
    return;
  }
  cameraFlash.classList.remove("is-active");
  void cameraFlash.offsetWidth;
  cameraFlash.classList.add("is-active");
}

async function setNativeScreenBrightness(brightness) {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.setScreenBrightness) {
    return null;
  }
  try {
    const result = await nativeBridge.setScreenBrightness({ brightness });
    return typeof result?.previousBrightness === "number" ? result.previousBrightness : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function startSelfieScreenFlash() {
  selfieScreenFlash?.classList.add("is-visible");
  const previousBrightness = await setNativeScreenBrightness(1);
  await delay(SELFIE_SCREEN_FLASH_SETTLE_DELAY_MS);
  return { previousBrightness };
}

async function finishSelfieScreenFlash(session) {
  selfieScreenFlash?.classList.remove("is-visible");
  if (typeof session?.previousBrightness === "number") {
    await setNativeScreenBrightness(session.previousBrightness);
  }
}

async function prepareCaptureFlash() {
  if (!state.cameraFlashEnabled) {
    return { shouldFlash: false, hardwareFlash: false, selfieFlash: false };
  }

  if (state.cameraFacingMode === "user") {
    const selfieFlashSession = await startSelfieScreenFlash();
    return { shouldFlash: true, hardwareFlash: false, selfieFlash: true, selfieFlashSession };
  }

  const hardwareFlash = await applyCameraTorch(true);
  flashCameraPreview();
  if (hardwareFlash) {
    await delay(CAMERA_FLASH_SETTLE_DELAY_MS);
  }
  return { shouldFlash: true, hardwareFlash };
}

async function finishCaptureFlash(session) {
  if (session?.hardwareFlash) {
    await applyCameraTorch(false);
  }
  if (session?.selfieFlash) {
    await finishSelfieScreenFlash(session.selfieFlashSession);
  }
}

function updateCameraFlashState() {
  cameraFlashTint.classList.toggle("is-visible", state.cameraFlashEnabled);
  cameraFlashToggleButton.setAttribute("aria-pressed", String(state.cameraFlashEnabled));
  cameraFlashToggleButton.classList.toggle("has-hardware-torch", state.cameraTorchSupported);
  document.body.classList.toggle("camera-flash-enabled", isMobileView() && state.cameraActive && state.cameraFlashEnabled);
  if (state.nativeCameraActive) {
    getNativeBridge()?.setPreviewFlashOverlay?.({
      tintVisible: state.cameraFlashEnabled,
      pulse: false,
    }).catch((error) => {
      console.error(error);
      debugEvent("native-preview-flash:error", { message: error?.message ?? String(error) });
    });
  }
}

async function toggleCameraFacing() {
  if (!state.cameraActive) {
    state.cameraFacingMode = state.cameraFacingMode === "user" ? "environment" : "user";
    return;
  }

  state.cameraFacingMode = state.cameraFacingMode === "user" ? "environment" : "user";
  await switchCameraStream();
}

async function switchCameraStream() {
  if (state.nativeCameraActive) {
    await switchNativeCamera();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || state.cameraSwitching) {
    return;
  }

  state.cameraSwitching = true;
  stopLiveCameraRender();
  canvas.style.visibility = "hidden";
  cameraPreviewSlot.classList.add("is-switching");

  try {
    await applyCameraTorch(false);
    if (state.cameraStream) {
      for (const track of state.cameraStream.getTracks()) {
        track.stop();
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: state.cameraFacingMode },
        width: { ideal: 4032 },
        height: { ideal: 3024 },
      },
      audio: false,
    });

    state.cameraStream = stream;
    cameraPreview.srcObject = stream;
    await cameraPreview.play();
    state.cameraTorchSupported = detectTorchSupport(stream);
    updateCameraFlashState();
    startLiveCameraRender();
  } finally {
    canvas.style.visibility = "";
    cameraPreviewSlot.classList.remove("is-switching");
    state.cameraSwitching = false;
  }
}

async function switchNativeCamera() {
  if (state.cameraSwitching) {
    return;
  }

  state.cameraSwitching = true;
  canvas.style.visibility = "hidden";
  cameraPreviewSlot.classList.add("is-switching");
  try {
    const result = await getNativeBridge()?.switchCamera?.({
      facingMode: state.cameraFacingMode,
      cropFactor: getCameraCropFactor(),
      previewRect: getCameraPreviewViewportRect(),
    });
    state.cameraTorchSupported = Boolean(result?.flashSupported);
    if (!NATIVE_CAMERA_PREVIEW_MODE) {
      renderNativeCameraPlaceholder();
    }
    updateCameraFlashState();
  } finally {
    canvas.style.visibility = "";
    cameraPreviewSlot.classList.remove("is-switching");
    state.cameraSwitching = false;
  }
}

async function toggleCameraFlash() {
  state.cameraFlashEnabled = !state.cameraFlashEnabled;
  if (state.nativeCameraActive) {
    await getNativeBridge()?.setFlashEnabled?.({ enabled: state.cameraFlashEnabled });
  }
  updateCameraFlashState();
  if (state.cameraFlashEnabled && !state.cameraTorchSupported) {
    setStatus("Hardware flash is not available in this browser, so flash is visual only.");
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function detectTorchSupport(stream) {
  const track = stream?.getVideoTracks?.()[0];
  if (!track?.getCapabilities) {
    return false;
  }

  const capabilities = track.getCapabilities();
  return Boolean(capabilities?.torch);
}

async function applyCameraTorch(enabled) {
  if (state.nativeCameraActive) {
    return false;
  }

  const track = state.cameraStream?.getVideoTracks?.()[0];
  if (!track?.applyConstraints || !state.cameraTorchSupported) {
    return false;
  }

  try {
    await track.applyConstraints({ advanced: [{ torch: Boolean(enabled) }] });
    return true;
  } catch (error) {
    state.cameraTorchSupported = false;
    updateCameraFlashState();
    console.error(error);
    return false;
  }
}

async function ensureGalleryReady() {
  if (state.galleryDb) {
    return true;
  }
  if (!state.galleryReadyPromise) {
    state.galleryReadyPromise = openGalleryDb()
      .then((db) => {
        state.galleryDb = db;
        return db;
      })
      .catch((error) => {
        console.error(error);
        return null;
      });
  }
  await state.galleryReadyPromise;
  return Boolean(state.galleryDb);
}

async function loadGalleryOnDemand(options = {}) {
  const shouldRender = options.render !== false;
  const renderReason = options.reason ?? "gallery-load";
  if (state.galleryLoaded && !options.force) {
    if (shouldRender && !state.galleryRenderedCount) {
      renderGalleryWhenTransitionSafe(renderReason);
    }
    return state.galleryItems;
  }
  if (state.galleryLoadPromise && !options.force) {
    const items = await state.galleryLoadPromise;
    if (shouldRender && !state.galleryRenderedCount) {
      renderGalleryWhenTransitionSafe(renderReason);
    }
    return items;
  }

  state.galleryLoadPromise = (async () => {
    const ready = await ensureGalleryReady();
    if (!ready) {
      return state.galleryItems;
    }
    state.galleryItems = await loadCombinedGalleryItems();
    state.galleryLoaded = true;
    await loadGalleryToDisplayLimit();
    if (shouldRender) {
      renderGalleryWhenTransitionSafe(renderReason);
    }
    return state.galleryItems;
  })()
    .catch((error) => {
      console.error(error);
      debugEvent("gallery:load-error", { message: error?.message ?? String(error) });
      return state.galleryItems;
    })
    .finally(() => {
      state.galleryLoadPromise = null;
    });

  return state.galleryLoadPromise;
}

function preloadGalleryInBackground(reason = "background") {
  if (state.galleryLoaded || state.galleryLoadPromise || state.galleryPreloadScheduled) {
    return;
  }

  state.galleryPreloadScheduled = true;
  const run = () => {
    state.galleryPreloadScheduled = false;
    if (state.galleryLoaded || state.galleryLoadPromise) {
      return;
    }
    debugEvent("gallery:preload-start", { reason });
    loadGalleryOnDemand({ render: false })
      .then((items) => {
        preloadGalleryThumbnailImages(items);
        scheduleGalleryHiddenRender(`${reason}:preload`);
        debugEvent("gallery:preload-end", {
          reason,
          items: items.length,
          nativeTotal: state.nativeGalleryTotal,
        });
      })
      .catch((error) => {
        console.error(error);
        debugEvent("gallery:preload-error", { reason, message: error?.message ?? String(error) });
      });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    window.setTimeout(run, 350);
  }
}

function scheduleGalleryHiddenRender(reason = "background") {
  if (!state.galleryLoaded || state.galleryHiddenRenderScheduled || (!state.galleryDirty && state.galleryRenderedCount)) {
    return;
  }

  state.galleryHiddenRenderScheduled = true;
  const run = () => {
    state.galleryHiddenRenderScheduled = false;
    if (!state.galleryLoaded || state.mobileSettingsOpen || (!state.galleryDirty && state.galleryRenderedCount)) {
      return;
    }
    if (isGalleryRenderBlockedByTransition()) {
      scheduleGalleryTransitionEndRender(reason);
      return;
    }
    renderGallery();
    debugEvent("gallery:hidden-render", {
      reason,
      items: state.galleryItems.length,
      rendered: state.galleryRenderedCount,
    });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 650 });
  } else {
    window.setTimeout(run, 300);
  }
}

function preloadGalleryThumbnailImages(items, limit = GALLERY_RENDER_BATCH_SIZE) {
  state.galleryPreloadImages = [];
  for (const item of items.slice(0, limit)) {
    let source = item.previewDataUrl
      || (item.thumbnailFileUrl
        ? getGalleryFileUrl(item.thumbnailFileUrl, item.cacheBust)
        : "");
    if (!source && item.thumbnailBlob) {
      source = URL.createObjectURL(item.thumbnailBlob);
      state.galleryObjectUrls.push(source);
    }
    if (!source) {
      continue;
    }
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    state.galleryPreloadImages.push(image);
  }
}

function preloadGalleryWindowThumbnails(items, windowInfo) {
  if (!items.length || !windowInfo) {
    return;
  }
  const columns = Math.max(1, getGalleryGridColumnCount());
  const preloadRadius = columns * GALLERY_THUMBNAIL_PRELOAD_ROWS;
  const start = Math.max(0, windowInfo.start - preloadRadius);
  const end = Math.min(items.length, windowInfo.end + preloadRadius);
  if (end <= start) {
    return;
  }
  preloadGalleryThumbnailImages(items.slice(start, end), GALLERY_THUMBNAIL_PRELOAD_MAX);
}

function openGalleryDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(GALLERY_DB_NAME, GALLERY_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GALLERY_STORE_NAME)) {
        db.createObjectStore(GALLERY_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function galleryStore(mode) {
  if (!state.galleryDb) {
    return null;
  }
  return state.galleryDb.transaction(GALLERY_STORE_NAME, mode).objectStore(GALLERY_STORE_NAME);
}

function loadGalleryItems() {
  return new Promise((resolve) => {
    const store = galleryStore("readonly");
    if (!store) {
      resolve([]);
      return;
    }

    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => resolve([]);
  });
}

async function loadCombinedGalleryItems() {
  state.nativeGalleryOffset = 0;
  state.nativeGalleryHasMore = false;
  state.nativeGalleryLoading = false;
  state.nativeGalleryTotal = 0;
  state.legacyGalleryLoaded = false;
  state.galleryWindowStartOffset = 0;
  state.galleryWindowLoadingPrevious = false;

  const initialLimit = Math.min(GALLERY_RENDER_BATCH_SIZE, getGalleryDisplayLimitCount());
  const nativePage = await loadNativeGalleryItemsPage(0, initialLimit);
  const nativeItems = nativePage.items;
  state.galleryWindowStartOffset = nativeItems[0]?.galleryOffset ?? 0;
  state.nativeGalleryOffset = Number(nativePage.nextOffset ?? nativeItems.length);
  state.nativeGalleryHasMore = nativePage.hasMore;
  state.nativeGalleryTotal = nativePage.total;

  const legacyItems = nativeItems.length ? [] : await loadLegacyGalleryItemsOnce();
  const seen = new Set();
  const combined = [];
  for (const item of [...nativeItems, ...legacyItems]) {
    const key = item.fileUrl || item.id;
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    combined.push(item);
  }
  return combined.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

async function loadNativeGalleryItems() {
  const page = await loadNativeGalleryItemsPage(0, Number.MAX_SAFE_INTEGER);
  return page.items;
}

async function loadNativeGalleryItemsPage(offset = 0, limit = GALLERY_RENDER_BATCH_SIZE) {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.listGalleryItems) {
    return { items: [], total: 0, hasMore: false };
  }
  try {
    const result = await nativeBridge.listGalleryItems({ offset, limit });
    const items = Array.isArray(result?.items) ? result.items.map(normalizeNativeGalleryItem) : [];
    return {
      items,
      total: Number(result?.total ?? items.length),
      hasMore: Boolean(result?.hasMore),
      nextOffset: Number(result?.nextOffset ?? offset + items.length),
    };
  } catch (error) {
    console.error(error);
    debugEvent("native-gallery:list-error", { message: error?.message ?? String(error) });
    return { items: [], total: 0, hasMore: false, nextOffset: offset };
  }
}

function normalizeNativeGalleryItem(nativeItem) {
  const width = Number(nativeItem?.width) || null;
  const height = Number(nativeItem?.height) || null;
  const filenameOrUrl = String(nativeItem?.filename ?? nativeItem?.fileUrl ?? "");
  const mediaType = nativeItem?.mediaType
    ?? (/\.(mov|mp4|m4v)(?:$|\?)/i.test(filenameOrUrl) ? "video" : (/\.gif(?:$|\?)/i.test(filenameOrUrl) ? "gif" : "photo"));
  return {
    ...nativeItem,
    id: nativeItem?.id ?? `${nativeItem?.fileUrl ?? "native"}-${nativeItem?.createdAt ?? Date.now()}`,
    fileUrl: nativeItem?.fileUrl ?? null,
    originalFileUrl: nativeItem?.originalFileUrl ?? nativeItem?.fileUrl ?? null,
    thumbnailFileUrl: nativeItem?.thumbnailFileUrl ?? nativeItem?.fileUrl ?? null,
    cameraName: normalizeGalleryCameraName(nativeItem?.cameraName, nativeItem?.filename),
    createdAt: Number(nativeItem?.createdAt) || Date.now(),
    width,
    height,
    aspectRatio: width && height ? width / height : null,
    displayOrientation: width && height && width > height ? "landscape" : "portrait",
    galleryOffset: Number.isFinite(Number(nativeItem?.galleryOffset)) ? Number(nativeItem.galleryOffset) : null,
    fileBacked: nativeItem?.fileBacked ?? true,
    thumbnailBacked: nativeItem?.thumbnailBacked ?? Boolean(nativeItem?.thumbnailFileUrl && nativeItem.thumbnailFileUrl !== nativeItem.fileUrl),
    processing: Boolean(nativeItem?.processing),
    mediaType,
    source: nativeItem?.source ?? "native",
  };
}

function normalizeGalleryCameraName(cameraName, filename = "") {
  if (typeof cameraName === "string" && cameraName.trim() && cameraName !== "Camera Unknown") {
    const explicit = cameraName.trim();
    const genericCameraMatch = explicit.match(/^camera\s+(\d+)$/i);
    if (!genericCameraMatch) {
      return explicit;
    }
    const filter = state.filterMap.get(`camera-${genericCameraMatch[1]}`);
    if (filter?.name) {
      return filter.name;
    }
  }
  const match = String(filename).match(/analoguecam-(.+)-\d+(?:-raw)?\.(?:jpe?g|gif|mov|mp4|m4v)$/i);
  if (!match) {
    return "Camera";
  }
  return match[1].replace(/-/g, " ").trim() || "Camera";
}

async function loadLegacyGalleryItemsOnce() {
  if (state.legacyGalleryLoaded) {
    return [];
  }
  state.legacyGalleryLoaded = true;
  return loadGalleryItems();
}

function appendUniqueGalleryItems(items, options = {}) {
  const prepend = options.prepend === true;
  const seen = new Set(state.galleryItems.map((item) => item.fileUrl || item.id).filter(Boolean));
  let appended = 0;
  for (const item of items) {
    const key = item.fileUrl || item.id;
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    if (prepend) {
      state.galleryItems.unshift(item);
    } else {
      state.galleryItems.push(item);
    }
    appended += 1;
  }
  if (appended) {
    state.galleryItems.sort((left, right) => {
      const leftOffset = Number.isFinite(Number(left.galleryOffset)) ? Number(left.galleryOffset) : Number.MAX_SAFE_INTEGER;
      const rightOffset = Number.isFinite(Number(right.galleryOffset)) ? Number(right.galleryOffset) : Number.MAX_SAFE_INTEGER;
      return leftOffset - rightOffset;
    });
    updateGalleryWindowOffsetsFromItems();
  }
  return appended;
}

function updateGalleryWindowOffsetsFromItems(options = {}) {
  const preserveNextOffset = options.preserveNextOffset !== false;
  if (!state.galleryItems.length) {
    state.galleryWindowStartOffset = 0;
    state.nativeGalleryOffset = 0;
    return;
  }
  const firstOffset = Number(state.galleryItems[0]?.galleryOffset);
  const lastOffset = Number(state.galleryItems[state.galleryItems.length - 1]?.galleryOffset);
  if (Number.isFinite(firstOffset)) {
    state.galleryWindowStartOffset = firstOffset;
  }
  if (Number.isFinite(lastOffset)) {
    state.nativeGalleryOffset = preserveNextOffset
      ? Math.max(state.nativeGalleryOffset, lastOffset + 1)
      : lastOffset + 1;
  }
}

function trimGalleryMetadataWindow(prefer = "end") {
  if (state.galleryDisplayLimit !== "infinite" || state.gallerySelectionMode) {
    return;
  }
  const extra = state.galleryItems.length - GALLERY_METADATA_WINDOW_SIZE;
  if (extra <= 0) {
    return;
  }
  if (prefer === "start") {
    state.galleryItems.splice(GALLERY_METADATA_WINDOW_SIZE);
    updateGalleryWindowOffsetsFromItems({ preserveNextOffset: false });
  } else {
    state.galleryItems.splice(0, extra);
    updateGalleryWindowOffsetsFromItems();
  }
}

function insertGalleryItemAtFront(item) {
  if (!item) {
    return;
  }
  for (const galleryItem of state.galleryItems) {
    if (Number.isFinite(Number(galleryItem.galleryOffset))) {
      galleryItem.galleryOffset = Number(galleryItem.galleryOffset) + 1;
    }
  }
  const nextItem = {
    ...item,
    galleryOffset: 0,
  };
  state.galleryItems.unshift(nextItem);
  state.galleryWindowStartOffset = 0;
  state.nativeGalleryOffset = Math.max(state.nativeGalleryOffset + 1, state.galleryItems.length);
  state.nativeGalleryTotal = Math.max(state.nativeGalleryTotal + 1, state.galleryItems.length);
  state.galleryDirty = true;
  trimGalleryMetadataWindow("start");
}

function isNativeGalleryItem(item) {
  return Boolean(item?.fileBacked && item?.fileUrl);
}

function hasNativeGalleryFile(item) {
  return Boolean(item?.fileUrl);
}

function removeGalleryItemFromState(item) {
  const key = item?.fileUrl || item?.id;
  const previousLength = state.galleryItems.length;
  state.galleryItems = state.galleryItems.filter((galleryItem) => {
    const galleryKey = galleryItem.fileUrl || galleryItem.id;
    return galleryKey !== key && galleryItem.id !== item?.id;
  });
  state.galleryRenderedCount = Math.min(state.galleryRenderedCount, state.galleryItems.length);
  galleryEmpty.hidden = state.galleryItems.length > 0;
  if (state.galleryItems.length !== previousLength) {
    state.galleryDirty = true;
  }
  return state.galleryItems.length !== previousLength;
}

async function deleteGalleryItemRecord(item) {
  if (isNativeGalleryItem(item)) {
    return;
  }
  await deleteGalleryItem(item);
}

async function loadMoreGalleryItems() {
  if (state.nativeGalleryLoading) {
    return 0;
  }
  const displayLimit = getGalleryDisplayLimitCount();
  if (Number.isFinite(displayLimit) && state.galleryItems.length >= displayLimit) {
    return 0;
  }
  state.nativeGalleryLoading = true;
  try {
    if (state.nativeGalleryHasMore) {
      let appendedTotal = 0;
      while (state.nativeGalleryHasMore && appendedTotal === 0) {
        const remaining = Number.isFinite(displayLimit)
          ? Math.max(0, displayLimit - state.galleryItems.length)
          : GALLERY_RENDER_BATCH_SIZE;
        const pageLimit = Math.min(GALLERY_RENDER_BATCH_SIZE, remaining);
        if (pageLimit <= 0) {
          return appendedTotal;
        }
        const previousOffset = state.nativeGalleryOffset;
        const page = await loadNativeGalleryItemsPage(state.nativeGalleryOffset, pageLimit);
        state.nativeGalleryOffset = Number(page.nextOffset ?? (state.nativeGalleryOffset + page.items.length));
        state.nativeGalleryHasMore = page.hasMore;
        state.nativeGalleryTotal = page.total;
        appendedTotal += appendUniqueGalleryItems(page.items);
        if (appendedTotal > 0) {
          trimGalleryMetadataWindow("end");
        }
        if (state.nativeGalleryOffset <= previousOffset) {
          break;
        }
      }
      return appendedTotal;
    }

    const legacyItems = await loadLegacyGalleryItemsOnce();
    return appendUniqueGalleryItems(legacyItems);
  } finally {
    state.nativeGalleryLoading = false;
  }
}

async function loadPreviousGalleryItems() {
  if (state.galleryWindowLoadingPrevious || state.nativeGalleryLoading || state.galleryWindowStartOffset <= 0) {
    return 0;
  }
  state.galleryWindowLoadingPrevious = true;
  try {
    const previousOffset = Math.max(0, state.galleryWindowStartOffset - GALLERY_RENDER_BATCH_SIZE);
    const limit = Math.max(0, state.galleryWindowStartOffset - previousOffset);
    if (limit <= 0) {
      return 0;
    }
    const page = await loadNativeGalleryItemsPage(previousOffset, limit);
    state.nativeGalleryTotal = page.total;
    const appended = appendUniqueGalleryItems(page.items, { prepend: true });
    if (appended > 0) {
      trimGalleryMetadataWindow("start");
    }
    return appended;
  } finally {
    state.galleryWindowLoadingPrevious = false;
  }
}

async function loadGalleryToDisplayLimit() {
  const displayLimit = getGalleryDisplayLimitCount();
  if (!Number.isFinite(displayLimit)) {
    return;
  }
  if (!state.galleryLoaded) {
    await loadGalleryOnDemand({ render: false });
  }
  while (state.galleryItems.length < displayLimit && (state.nativeGalleryHasMore || !state.legacyGalleryLoaded)) {
    const appended = await loadMoreGalleryItems();
    if (!appended) {
      break;
    }
  }
}

function getGalleryItemKey(item) {
  return item?.fileUrl || item?.id || item?.filename || "";
}

function clearGalleryLongPress() {
  if (state.galleryLongPressTimer) {
    window.clearTimeout(state.galleryLongPressTimer);
    state.galleryLongPressTimer = 0;
  }
  state.galleryLongPressPointerId = null;
}

function beginGalleryLongPress(event, item) {
  if (event.button != null && event.button !== 0) {
    return;
  }
  if (item.processing) {
    return;
  }
  clearGalleryLongPress();
  state.galleryLongPressTriggered = false;
  state.galleryLongPressPointerId = event.pointerId;
  state.galleryLongPressStartX = event.clientX;
  state.galleryLongPressStartY = event.clientY;
  state.galleryLongPressTimer = window.setTimeout(() => {
    state.galleryLongPressTimer = 0;
    state.galleryLongPressTriggered = true;
    enterGallerySelectionMode(item);
  }, 450);
}

function moveGalleryLongPress(event) {
  if (!state.galleryLongPressTimer || event.pointerId !== state.galleryLongPressPointerId) {
    return;
  }
  const dx = Math.abs(event.clientX - state.galleryLongPressStartX);
  const dy = Math.abs(event.clientY - state.galleryLongPressStartY);
  if (Math.max(dx, dy) > 10) {
    clearGalleryLongPress();
  }
}

function enterGallerySelectionMode(item) {
  const key = getGalleryItemKey(item);
  if (!key) {
    return;
  }
  state.gallerySelectionMode = true;
  state.gallerySelectedItemKeys.add(key);
  closeGalleryItem();
  updateGallerySelectionUi();
  renderGalleryWhenTransitionSafe("gallery-selection-enter");
}

function toggleGallerySelectionItem(item) {
  const key = getGalleryItemKey(item);
  if (!key) {
    return;
  }
  if (!state.gallerySelectionMode) {
    enterGallerySelectionMode(item);
    return;
  }

  if (state.gallerySelectedItemKeys.has(key)) {
    state.gallerySelectedItemKeys.delete(key);
  } else {
    state.gallerySelectedItemKeys.add(key);
  }

  if (!state.gallerySelectedItemKeys.size) {
    exitGallerySelectionMode();
    return;
  }

  updateGallerySelectionUi();
  renderGalleryWhenTransitionSafe("gallery-selection-toggle");
}

function exitGallerySelectionMode() {
  clearGalleryLongPress();
  state.gallerySelectionMode = false;
  state.gallerySelectedItemKeys.clear();
  updateGallerySelectionUi();
  renderGalleryWhenTransitionSafe("gallery-selection-exit");
}

function updateGallerySelectionUi() {
  if (!gallerySelectionBar || !gallerySelectionCount) {
    return;
  }
  const count = state.gallerySelectedItemKeys.size;
  gallerySelectionBar.hidden = !state.gallerySelectionMode;
  gallerySelectionCount.textContent = `${count} ${count === 1 ? "image" : "images"} selected`;
}

async function saveGalleryBlob(blob, filename, cameraName = null, options = {}) {
  const nativeBridge = getNativeBridge();
  if (nativeBridge?.writeGalleryItem) {
    try {
      const payload = {
        dataUrl: await blobToDataUrl(blob),
        filename,
        cameraName: cameraName ?? "camera",
      };
      if (options.originalBlob) {
        payload.originalDataUrl = await blobToDataUrl(options.originalBlob);
      }
      const result = await nativeBridge.writeGalleryItem(payload);
      if (result?.item) {
        return result.item;
      }
    } catch (error) {
      console.warn("Native gallery write failed; falling back to IndexedDB.", error);
      debugEvent("native-gallery:write-fallback", { message: error?.message ?? String(error) });
    }
  }

  const thumbnailBlob = await createGalleryThumbnailBlob(blob).catch(() => null);
  return new Promise((resolve, reject) => {
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      filename,
      blob,
      thumbnailBlob,
      cameraName,
      createdAt: Date.now(),
    };
    const store = galleryStore("readwrite");
    if (!store) {
      reject(new Error("Local gallery storage is unavailable."));
      return;
    }

    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

function saveGalleryItemRecord(nativeItem) {
  return new Promise((resolve, reject) => {
    const item = {
      id: nativeItem.id ?? (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      filename: nativeItem.filename ?? `native-${Date.now()}.jpg`,
      fileUrl: nativeItem.fileUrl ?? null,
      originalFileUrl: nativeItem.originalFileUrl ?? nativeItem.fileUrl ?? null,
      thumbnailFileUrl: nativeItem.thumbnailFileUrl ?? nativeItem.fileUrl ?? null,
      cameraName: nativeItem.cameraName ?? null,
      createdAt: Number(nativeItem.createdAt) || Date.now(),
      width: Number(nativeItem.width) || null,
      height: Number(nativeItem.height) || null,
      orientation: nativeItem.orientation ?? null,
    };
    const store = galleryStore("readwrite");
    if (!store) {
      reject(new Error("Local gallery storage is unavailable."));
      return;
    }

    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

function deleteGalleryItem(item) {
  return new Promise((resolve, reject) => {
    const store = galleryStore("readwrite");
    if (!store) {
      reject(new Error("Local gallery storage is unavailable."));
      return;
    }

    const request = store.delete(item.id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function saveGalleryItemRecordUpdate(item) {
  return new Promise((resolve, reject) => {
    const store = galleryStore("readwrite");
    if (!store) {
      reject(new Error("Local gallery storage is unavailable."));
      return;
    }

    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

function upsertPendingSpektraGalleryItem(event) {
  if (!event?.id || !event.previewDataUrl) {
    return;
  }
  const item = {
    id: event.id,
    filename: event.filename ?? `spektra-processing-${Date.now()}.jpg`,
    previewDataUrl: event.previewDataUrl,
    cameraName: event.cameraName ?? null,
    createdAt: Number(event.createdAt) || Date.now(),
    width: Number(event.width) || null,
    height: Number(event.height) || null,
    orientation: event.orientation ?? null,
    processing: true,
    processingLabel: "Spektra processing",
  };
  const index = state.galleryItems.findIndex((galleryItem) => galleryItem.id === item.id);
  if (index >= 0) {
    state.galleryItems[index] = { ...state.galleryItems[index], ...item };
    state.galleryDirty = true;
  } else {
    insertGalleryItemAtFront(item);
  }
  debugEvent("gallery:pending-spektrapreview", {
    id: item.id,
    camera: item.cameraName,
    width: item.width,
    height: item.height,
  });
  requestGalleryRender("pending-spektrapreview");
}

function replacePendingSpektraGalleryItem(pendingId, finalItem) {
  if (!pendingId) {
    return false;
  }
  const index = state.galleryItems.findIndex((item) => item.id === pendingId);
  if (index >= 0) {
    state.galleryItems[index] = finalItem;
    state.galleryDirty = true;
    requestGalleryRender("pending-spektrapreview-final");
    return true;
  }
  return false;
}

function removePendingSpektraGalleryItem(pendingId) {
  if (!pendingId) {
    return;
  }
  const nextItems = state.galleryItems.filter((item) => item.id !== pendingId);
  if (nextItems.length !== state.galleryItems.length) {
    state.galleryItems = nextItems;
    state.galleryDirty = true;
    requestGalleryRender("pending-spektrapreview-remove");
  }
}

function isGallerySurfaceVisible() {
  if (!isMobileView()) {
    return true;
  }
  return document.body.classList.contains("mobile-gallery-active")
    || document.body.classList.contains("camera-gallery-peek")
    || document.body.classList.contains("gallery-camera-returning");
}

function isGalleryRenderBlockedByTransition() {
  return state.cameraGalleryTransitioning || document.body.classList.contains("gallery-camera-returning");
}

function requestGalleryRender(reason = "gallery-update", options = {}) {
  state.galleryDirty = true;
  const surfaceVisible = isGallerySurfaceVisible();
  if (isGalleryRenderBlockedByTransition()) {
    scheduleGalleryTransitionEndRender(reason);
    return;
  }
  if (surfaceVisible && state.cameraCaptureInProgress) {
    scheduleGalleryCaptureEndRender(reason);
    return;
  }
  if (options.nextFrame) {
    scheduleGalleryFrameRender(reason);
    return;
  }
  if (options.force || surfaceVisible) {
    renderGallery();
    return;
  }
  scheduleGalleryHiddenRender(reason);
}

function scheduleGalleryCaptureEndRender(reason = "gallery-capture-end") {
  if (state.galleryCaptureEndRenderTimer) {
    return;
  }
  const scheduledAt = performance.now();
  const run = () => {
    state.galleryCaptureEndRenderTimer = 0;
    if (!state.galleryLoaded || !state.galleryDirty) {
      return;
    }
    if (state.cameraCaptureInProgress) {
      state.galleryCaptureEndRenderTimer = window.setTimeout(run, 50);
      return;
    }
    if (isGalleryRenderBlockedByTransition()) {
      scheduleGalleryTransitionEndRender(reason);
      return;
    }
    if (!isGallerySurfaceVisible()) {
      scheduleGalleryHiddenRender(reason);
      return;
    }
    window.requestAnimationFrame(() => {
      if (!state.galleryDirty || state.cameraCaptureInProgress || isGalleryRenderBlockedByTransition() || !isGallerySurfaceVisible()) {
        if (state.galleryDirty) {
          scheduleGalleryCaptureEndRender(reason);
        }
        return;
      }
      const waitMs = performance.now() - scheduledAt;
      const renderMs = renderGallery();
      debugEvent("gallery:capture-end-render", {
        reason,
        waitMs: Math.round(waitMs),
        renderMs: Math.round(renderMs),
        rendered: state.galleryRenderedCount,
      });
    });
  };
  state.galleryCaptureEndRenderTimer = window.setTimeout(run, 50);
}

function renderGalleryWhenTransitionSafe(reason = "gallery-render") {
  if (isGalleryRenderBlockedByTransition()) {
    state.galleryDirty = true;
    scheduleGalleryTransitionEndRender(reason);
    return;
  }
  if (isGallerySurfaceVisible() && state.cameraCaptureInProgress) {
    state.galleryDirty = true;
    scheduleGalleryCaptureEndRender(reason);
    return;
  }
  renderGallery();
}

function scheduleGalleryTransitionEndRender(reason = "gallery-transition-end") {
  if (state.galleryTransitionEndRenderTimer) {
    return;
  }
  const transitionToken = state.cameraGalleryTransitionToken;
  const transitionStartedAt = state.cameraGalleryOpenStartedAt || performance.now();
  const elapsed = performance.now() - transitionStartedAt;
  const scheduledAt = performance.now();
  const delay = Math.max(0, CAMERA_GALLERY_TRANSITION_MS - elapsed) + 24;
  state.galleryTransitionEndRenderTimer = window.setTimeout(() => {
    state.galleryTransitionEndRenderTimer = 0;
    if (transitionToken !== state.cameraGalleryTransitionToken || (!state.galleryDirty && state.galleryRenderedCount)) {
      return;
    }
    if (isGalleryRenderBlockedByTransition()) {
      scheduleGalleryTransitionEndRender(reason);
      return;
    }
    if (!isGallerySurfaceVisible()) {
      scheduleGalleryHiddenRender(reason);
      return;
    }
    window.requestAnimationFrame(() => {
      if ((!state.galleryDirty && state.galleryRenderedCount) || !isGallerySurfaceVisible()) {
        return;
      }
      const waitMs = performance.now() - scheduledAt;
      const renderMs = renderGallery();
      state.debug.galleryTransitionEndRenderCount += 1;
      state.debug.lastGalleryTransitionEndRenderWaitMs = Math.round(waitMs);
      state.debug.lastGalleryTransitionEndRenderMs = Math.round(renderMs);
      debugEvent("gallery:transition-end-render", {
        reason,
        waitMs: Math.round(waitMs),
        renderMs: Math.round(renderMs),
        rendered: state.galleryRenderedCount,
        captureInProgress: state.cameraCaptureInProgress,
      });
    });
  }, delay);
}

function scheduleGalleryFrameRender(reason = "gallery-frame") {
  if (state.galleryFrameRenderScheduled) {
    return;
  }
  state.galleryFrameRenderScheduled = true;
  window.requestAnimationFrame(() => {
    state.galleryFrameRenderScheduled = false;
    if (!state.galleryLoaded || !state.galleryDirty) {
      return;
    }
    if (!isGallerySurfaceVisible()) {
      scheduleGalleryHiddenRender(reason);
      return;
    }
    if (isGalleryRenderBlockedByTransition()) {
      scheduleGalleryTransitionEndRender(reason);
      return;
    }
    if (state.cameraCaptureInProgress) {
      scheduleGalleryCaptureEndRender(reason);
      return;
    }
    renderGallery();
    debugEvent("gallery:frame-render", {
      reason,
      rendered: state.galleryRenderedCount,
      captureInProgress: state.cameraCaptureInProgress,
      transitioning: state.cameraGalleryTransitioning,
    });
  });
}

function renderGallery(options = {}) {
  const renderStartedAt = performance.now();
  for (const url of state.galleryObjectUrls) {
    URL.revokeObjectURL(url);
  }
  state.galleryObjectUrls = [];

  const visibleItems = getGalleryVisibleItems();
  galleryEmpty.hidden = visibleItems.length > 0;
  if (galleryCount) {
    const total = Math.max(state.nativeGalleryTotal || 0, state.galleryItems.length);
    const visibleCount = Math.min(visibleItems.length, total);
    galleryCount.textContent = visibleCount < total
      ? `${visibleCount} of ${total} photos`
      : `${total} ${total === 1 ? "photo" : "photos"}`;
  }

  const windowInfo = getGalleryRenderWindow(visibleItems);
  state.galleryVirtualStart = windowInfo.start;
  state.galleryVirtualEnd = windowInfo.end;
  state.galleryVirtualAbsoluteStart = windowInfo.absoluteStart ?? windowInfo.start;
  state.galleryVirtualAbsoluteEnd = windowInfo.absoluteEnd ?? windowInfo.end;
  state.galleryVirtualTopHeight = windowInfo.topHeight;
  state.galleryVirtualBottomHeight = windowInfo.bottomHeight;
  state.galleryRenderedCount = windowInfo.end - windowInfo.start;
  state.galleryDirty = false;

  const fragment = document.createDocumentFragment();
  if (windowInfo.topHeight > 0) {
    fragment.append(createGallerySpacer(windowInfo.topHeight, "top"));
  }

  const renderedItems = visibleItems.slice(windowInfo.start, windowInfo.end);
  const priorityImageCount = Math.max(getGalleryGridColumnCount() * 4, GALLERY_RENDER_BATCH_SIZE);
  renderedItems.forEach((item, index) => {
    fragment.append(createGalleryCard(item, {
      priorityImage: index < priorityImageCount,
    }));
  });

  if (!renderedItems.length && visibleItems.length) {
    debugEvent("gallery:render-empty-window", {
      visible: visibleItems.length,
      start: windowInfo.start,
      end: windowInfo.end,
      virtual: Boolean(windowInfo.virtual),
    });
  }

  if (windowInfo.bottomHeight > 0) {
    fragment.append(createGallerySpacer(windowInfo.bottomHeight, "bottom"));
  }

  galleryGrid.replaceChildren(fragment);
  preloadGalleryWindowThumbnails(visibleItems, windowInfo);
  updateGallerySelectionUi();
  if (state.favoriteCameraDrawerOpen) {
    renderFavoriteCameraDrawer();
  }
  const renderMs = performance.now() - renderStartedAt;
  if (renderMs > 16) {
    debugEvent("gallery:render-slow", {
      ms: Math.round(renderMs),
      visible: visibleItems.length,
      rendered: state.galleryRenderedCount,
      virtual: Boolean(windowInfo.virtual),
      surfaceVisible: isGallerySurfaceVisible(),
    });
  }
  return renderMs;
}

function createGalleryCard(item, options = {}) {
  const itemKey = getGalleryItemKey(item);
  const card = document.createElement("article");
  card.className = "mobile-gallery__item";
  applyGalleryCardAspectRatio(card, item);
  card.classList.toggle("is-landscape", isGalleryItemLandscape(item));
  card.classList.toggle("is-processing", Boolean(item.processing));
  card.classList.toggle("is-selected", state.gallerySelectedItemKeys.has(itemKey));

  const button = document.createElement("button");
  button.type = "button";
  button.addEventListener("contextmenu", (event) => event.preventDefault());
  button.addEventListener("pointerdown", (event) => beginGalleryLongPress(event, item));
  button.addEventListener("pointermove", moveGalleryLongPress);
  button.addEventListener("pointerup", clearGalleryLongPress);
  button.addEventListener("pointercancel", clearGalleryLongPress);
  button.addEventListener("pointerleave", clearGalleryLongPress);
  button.addEventListener("click", (event) => {
    if (state.galleryLongPressTriggered) {
      event.preventDefault();
      state.galleryLongPressTriggered = false;
      return;
    }
    if (state.gallerySelectionMode) {
      event.preventDefault();
      toggleGallerySelectionItem(item);
      return;
    }
    if (item.processing) {
      setStatus(item.processingLabel ?? "Photo is still processing.");
      return;
    }
    openGalleryItem(item).catch((error) => {
      console.error(error);
      setStatus("Selected gallery image is unavailable.");
    });
  });

  const image = document.createElement("img");
  image.alt = "Local analogue shot";
  image.decoding = "async";
  image.fetchPriority = options.priorityImage ? "high" : "low";
  image.loading = options.priorityImage ? "eager" : "lazy";
  image.addEventListener("load", () => {
    if (!item.width && image.naturalWidth) {
      item.width = image.naturalWidth;
    }
    if (!item.height && image.naturalHeight) {
      item.height = image.naturalHeight;
    }
    applyGalleryCardAspectRatio(card, item);
    card.classList.toggle("is-landscape", isGalleryItemLandscape(item));
  });
  image.addEventListener("error", () => handleGalleryImageError(item, card));
  setGalleryThumbnailImage(item, image, card);

  button.append(image);
  if (state.gallerySelectedItemKeys.has(itemKey)) {
    const badge = document.createElement("span");
    badge.className = "mobile-gallery__selection-check";
    badge.textContent = "✓";
    button.append(badge);
  }
  if (item.processing) {
    const overlay = document.createElement("div");
    overlay.className = "mobile-gallery__processing";
    overlay.innerHTML = '<span class="mobile-gallery__spinner" aria-hidden="true"></span><span>Processing</span>';
    button.append(overlay);
  }
  card.append(button);
  return card;
}

function createGallerySpacer(height, position) {
  const spacer = document.createElement("div");
  spacer.className = "mobile-gallery__spacer";
  spacer.dataset.position = position;
  spacer.style.height = `${Math.max(0, Math.round(height))}px`;
  return spacer;
}

function getGalleryRenderWindow(items) {
  const totalItems = getGalleryVirtualTotal(items.length);
  if (!shouldVirtualizeGallery(totalItems)) {
    return { start: 0, end: items.length, absoluteStart: 0, absoluteEnd: items.length, topHeight: 0, bottomHeight: 0, virtual: false };
  }

  const columns = getGalleryGridColumnCount();
  const rowHeight = getGalleryVirtualRowHeight(columns, items);
  const totalRows = Math.ceil(totalItems / columns);
  const gridTop = galleryGrid.offsetTop || 0;
  const scrollTop = Math.max(0, mobileGallery.scrollTop - gridTop);
  const firstVisibleRow = Math.max(0, Math.floor(scrollTop / rowHeight));
  const visibleRows = Math.max(1, Math.ceil(mobileGallery.clientHeight / rowHeight));
  const startRow = Math.max(0, firstVisibleRow - GALLERY_VIRTUAL_OVERSCAN_ROWS);
  const endRow = Math.min(totalRows, firstVisibleRow + visibleRows + GALLERY_VIRTUAL_OVERSCAN_ROWS);
  const absoluteStart = Math.min(totalItems, startRow * columns);
  const absoluteEnd = Math.min(totalItems, Math.max(absoluteStart + columns, endRow * columns));
  const loadedStart = state.galleryWindowStartOffset;
  const loadedEnd = loadedStart + items.length;
  const start = Math.max(0, Math.min(items.length, absoluteStart - loadedStart));
  const end = Math.max(start, Math.min(items.length, absoluteEnd - loadedStart));
  const rowsBeforeRendered = Math.floor((loadedStart + start) / columns);
  const renderedRows = Math.ceil((end - start) / columns);

  state.galleryVirtualItemHeight = rowHeight;
  return {
    start,
    end,
    absoluteStart,
    absoluteEnd,
    loadedStart,
    loadedEnd,
    topHeight: rowsBeforeRendered * rowHeight,
    bottomHeight: Math.max(0, (totalRows - rowsBeforeRendered - renderedRows) * rowHeight),
    virtual: true,
  };
}

function getGalleryVirtualTotal(loadedCount = getGalleryVisibleItems().length) {
  if (state.galleryDisplayLimit !== "infinite") {
    return loadedCount;
  }
  return Math.max(state.nativeGalleryTotal || 0, state.galleryWindowStartOffset + loadedCount);
}

function shouldVirtualizeGallery(totalItems = getGalleryVirtualTotal()) {
  return state.galleryDisplayLimit === "infinite" && totalItems > GALLERY_VIRTUAL_MIN_ITEMS;
}

function getGalleryGridColumnCount() {
  if (state.galleryDisplayLimit !== "infinite") {
    return state.galleryTwoColumn ? 3 : 2;
  }
  const styles = window.getComputedStyle(galleryGrid);
  const cssColumnCount = Number.parseInt(styles.columnCount, 10);
  if (Number.isFinite(cssColumnCount) && cssColumnCount > 0) {
    return cssColumnCount;
  }
  const template = styles.gridTemplateColumns;
  const columns = template && template !== "none" ? template.split(" ").filter(Boolean).length : 1;
  return Math.max(1, columns || 1);
}

function getGalleryGridGapPx() {
  const styles = window.getComputedStyle(galleryGrid);
  return Number.parseFloat(styles.rowGap || styles.columnGap || styles.gap || "0") || 0;
}

function getGalleryVirtualRowHeight(columns = getGalleryGridColumnCount(), items = getGalleryVisibleItems()) {
  const measuredItem = galleryGrid.querySelector(".mobile-gallery__item");
  if (measuredItem) {
    const height = measuredItem.getBoundingClientRect().height;
    if (height > 0) {
      return height + getGalleryGridGapPx();
    }
  }

  const gap = getGalleryGridGapPx();
  const styles = window.getComputedStyle(galleryGrid);
  const horizontalPadding = (Number.parseFloat(styles.paddingLeft) || 0) + (Number.parseFloat(styles.paddingRight) || 0);
  const gridWidth = Math.max(1, (galleryGrid.clientWidth || mobileGallery.clientWidth || window.innerWidth || 390) - horizontalPadding);
  const itemWidth = Math.max(1, (gridWidth - gap * Math.max(0, columns - 1)) / columns);
  return (itemWidth / getGalleryEstimatedAspectRatio(items)) + gap;
}

function refreshGalleryVirtualWindowIfNeeded() {
  const items = getGalleryVisibleItems();
  if (!shouldVirtualizeGallery(getGalleryVirtualTotal(items.length))) {
    return;
  }
  const windowInfo = getGalleryRenderWindow(items);
  ensureGalleryWindowItems(windowInfo).catch((error) => console.error(error));
  const changed = windowInfo.start !== state.galleryVirtualStart
    || windowInfo.end !== state.galleryVirtualEnd
    || Math.abs(windowInfo.topHeight - state.galleryVirtualTopHeight) > 2
    || Math.abs(windowInfo.bottomHeight - state.galleryVirtualBottomHeight) > 2;
  if (changed) {
    renderGalleryWhenTransitionSafe("gallery-virtual-refresh");
  }
}

async function ensureGalleryWindowItems(windowInfo = getGalleryRenderWindow(getGalleryVisibleItems())) {
  if (!windowInfo.virtual) {
    return;
  }
  const loadedStart = state.galleryWindowStartOffset;
  const loadedEnd = loadedStart + state.galleryItems.length;
  const shouldLoadPrevious = windowInfo.absoluteStart < loadedStart + GALLERY_RENDER_BATCH_SIZE && loadedStart > 0;
  const shouldLoadNext = windowInfo.absoluteEnd > loadedEnd - GALLERY_RENDER_BATCH_SIZE && state.nativeGalleryHasMore;

  if (shouldLoadPrevious) {
    const appended = await loadPreviousGalleryItems();
    if (appended > 0) {
      renderGalleryWhenTransitionSafe("gallery-window-previous");
      return;
    }
  }

  if (shouldLoadNext) {
    const appended = await loadMoreGalleryItems();
    if (appended > 0) {
      renderGalleryWhenTransitionSafe("gallery-window-next");
    }
  }
}

function isGalleryItemLandscape(item) {
  const width = Number(item?.width);
  const height = Number(item?.height);
  if (width > 0 && height > 0) {
    return width > height;
  }
  return isLandscapeCaptureOrientation(item?.orientation);
}

function getGalleryItemAspectRatio(item) {
  const width = Number(item?.width);
  const height = Number(item?.height);
  if (width > 0 && height > 0) {
    if (isLandscapeCaptureOrientation(item?.orientation) && width < height) {
      return height / width;
    }
    return width / height;
  }
  return isLandscapeCaptureOrientation(item?.orientation)
    ? 1 / GALLERY_THUMBNAIL_ASPECT_RATIO
    : GALLERY_THUMBNAIL_ASPECT_RATIO;
}

function getGalleryEstimatedAspectRatio(items) {
  const sample = items.slice(0, Math.min(items.length, GALLERY_RENDER_BATCH_SIZE));
  if (!sample.length) {
    return GALLERY_THUMBNAIL_ASPECT_RATIO;
  }
  const total = sample.reduce((sum, item) => sum + getGalleryItemAspectRatio(item), 0);
  return Math.max(0.25, Math.min(2.2, total / sample.length));
}

function applyGalleryCardAspectRatio(card, item) {
  card.style.setProperty("--gallery-item-aspect", getGalleryItemAspectRatio(item).toFixed(4));
}

function handleGalleryImageError(item, card) {
  debugEvent("gallery:image-error", {
    id: item.id,
    filename: item.filename,
    fileBacked: isNativeGalleryItem(item),
  });
  card.remove();
  if (hasNativeGalleryFile(item)) {
    getNativeBridge()?.deleteGalleryItem?.({ fileUrl: item.fileUrl }).catch((error) => console.error(error));
  }
  deleteGalleryItemRecord(item)
    .then(() => {
      removeGalleryItemFromState(item);
      if (state.favoriteCameraDrawerOpen) {
        renderFavoriteCameraDrawer();
      }
    })
    .catch((error) => console.error(error));
}

async function renderMoreGalleryItemsIfNeeded() {
  if (!getGalleryVisibleItems().length) {
    return;
  }
  const threshold = 900;
  if (mobileGallery.scrollTop + mobileGallery.clientHeight < mobileGallery.scrollHeight - threshold) {
    return;
  }

  let visibleItems = getGalleryVisibleItems();
  const needsMoreItems = shouldVirtualizeGallery(getGalleryVirtualTotal(visibleItems.length))
    ? state.galleryVirtualAbsoluteEnd >= state.galleryWindowStartOffset + visibleItems.length - GALLERY_RENDER_BATCH_SIZE
    : state.galleryRenderedCount >= visibleItems.length;
  if (needsMoreItems) {
    const appended = await loadMoreGalleryItems();
    if (!appended) {
      return;
    }
    visibleItems = getGalleryVisibleItems();
  }

  if (shouldVirtualizeGallery(getGalleryVirtualTotal(visibleItems.length)) || state.galleryRenderedCount < visibleItems.length) {
    renderGalleryWhenTransitionSafe("gallery-render-more");
  }
}

function scheduleRenderMoreGalleryItems() {
  if (state.galleryRenderMoreScheduled) {
    return;
  }
  state.galleryRenderMoreScheduled = true;
  window.requestAnimationFrame(() => {
    state.galleryRenderMoreScheduled = false;
    refreshGalleryVirtualWindowIfNeeded();
    renderMoreGalleryItemsIfNeeded().catch((error) => console.error(error));
  });
}

function setGalleryThumbnailImage(item, image, card) {
  if (item.previewDataUrl) {
    image.src = item.previewDataUrl;
    return;
  }

  if (item.thumbnailFileUrl) {
    image.src = getGalleryFileUrl(item.thumbnailFileUrl, item.cacheBust);
    return;
  }

  if (item.thumbnailBlob) {
    const url = URL.createObjectURL(item.thumbnailBlob);
    state.galleryObjectUrls.push(url);
    image.src = url;
    return;
  }

  image.removeAttribute("src");
  generateGalleryThumbnail(item)
    .then((thumbnailBlob) => {
      if (!thumbnailBlob || !card.isConnected) {
        return;
      }
      item.thumbnailBlob = thumbnailBlob;
      const url = URL.createObjectURL(thumbnailBlob);
      state.galleryObjectUrls.push(url);
      image.src = url;
    })
    .catch(() => handleGalleryImageError(item, card));
}

async function generateGalleryThumbnail(item) {
  const blob = await getGalleryItemBlob(item);
  if (!blob) {
    return null;
  }

  const thumbnailBlob = await createGalleryThumbnailBlob(blob);
  item.thumbnailBlob = thumbnailBlob;
  await saveGalleryItemRecordUpdate(item);
  return thumbnailBlob;
}

async function createGalleryThumbnailBlob(blob) {
  const image = await decodeBlobToImage(blob);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("Invalid gallery image size.");
  }

  const scale = Math.min(1, GALLERY_THUMBNAIL_MAX_SIDE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const thumbnailCanvas = document.createElement("canvas");
  thumbnailCanvas.width = width;
  thumbnailCanvas.height = height;
  const context = thumbnailCanvas.getContext("2d");
  if (!context) {
    throw new Error("Gallery thumbnail canvas is unavailable.");
  }
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    thumbnailCanvas.toBlob((thumbnailBlob) => {
      if (thumbnailBlob) {
        resolve(thumbnailBlob);
      } else {
        reject(new Error("Failed to create gallery thumbnail."));
      }
    }, "image/jpeg", GALLERY_THUMBNAIL_QUALITY);
  });
}

function getGalleryItemUrl(item) {
  if (item.blob) {
    return URL.createObjectURL(item.blob);
  }
  if (item.fileUrl) {
    return getGalleryFileUrl(item.fileUrl, item.cacheBust);
  }
  return "";
}

function handleGalleryViewerImageError(item, token) {
  if (token !== state.selectedGalleryLoadToken || !item) {
    return;
  }
  debugEvent("gallery-viewer:image-error", {
    filename: item.filename ?? null,
    fileUrl: item.fileUrl ?? null,
    mediaType: item.mediaType ?? null,
  });
  closeGalleryItem();
  setStatus("Selected gallery image is unavailable.");
}

function showGalleryViewerItem(item, options = {}) {
  if (state.selectedGalleryObjectUrl) {
    URL.revokeObjectURL(state.selectedGalleryObjectUrl);
    state.selectedGalleryObjectUrl = "";
  }
  galleryViewerImage.onload = null;
  galleryViewerImage.onerror = null;
  galleryViewerImage.removeAttribute("src");
  galleryViewerImage.classList.remove("is-processing", "is-processing-bnw");
  if (galleryViewerVideo) {
    galleryViewerVideo.onloadeddata = null;
    galleryViewerVideo.onerror = null;
    galleryViewerVideo.pause();
    galleryViewerVideo.removeAttribute("src");
    galleryViewerVideo.load();
    galleryViewerVideo.hidden = true;
  }
  galleryViewerImage.hidden = false;
  const loadToken = ++state.selectedGalleryLoadToken;
  galleryViewerImage.dataset.loadToken = String(loadToken);
  const url = getGalleryItemUrl(item);
  if (!url) {
    return false;
  }
  if (item.blob) {
    state.selectedGalleryObjectUrl = url;
  }
  if (isGalleryVideoItem(item) && galleryViewerVideo) {
    galleryViewerImage.hidden = true;
    galleryViewerVideo.hidden = false;
    galleryViewerVideo.dataset.loadToken = String(loadToken);
    galleryViewerVideo.onloadeddata = () => {
      if (loadToken !== state.selectedGalleryLoadToken) {
        return;
      }
      galleryViewerVideo.onloadeddata = null;
      if (options.showOnLoad) {
        galleryViewer.hidden = false;
      }
    };
    galleryViewerVideo.onerror = () => handleGalleryViewerImageError(item, loadToken);
    galleryViewerVideo.src = url;
    galleryViewerVideo.load();
    return true;
  }
  galleryViewerImage.onload = () => {
    if (loadToken !== state.selectedGalleryLoadToken) {
      return;
    }
    galleryViewerImage.onload = null;
    if (options.showOnLoad) {
      galleryViewer.hidden = false;
    }
  };
  galleryViewerImage.onerror = () => handleGalleryViewerImageError(item, loadToken);
  galleryViewerImage.src = url;
  return true;
}

function getGalleryFileUrl(fileUrl, cacheBust = null) {
  if (!fileUrl) {
    return "";
  }
  const url = window.Capacitor?.convertFileSrc?.(fileUrl) ?? fileUrl;
  if (!cacheBust) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(cacheBust)}`;
}

function resolveGalleryCameraName(item) {
  const explicitName = typeof item.cameraName === "string" ? item.cameraName.trim() : "";
  if (explicitName && explicitName.toLowerCase() !== "camera" && explicitName.toLowerCase() !== "unknown") {
    return explicitName;
  }

  const filename = typeof item.filename === "string" ? item.filename : "";
  const cameraIdMatch = filename.match(/camera-(\d+)(?:\D|$)/i);
  if (cameraIdMatch) {
    const filter = state.filters.find((candidate) => candidate.filename === `camera-${cameraIdMatch[1]}`);
    if (filter?.name) {
      return filter.name;
    }
  }

  const filenameMatch = filename.match(/(camera-\d+)/i);
  if (filenameMatch) {
    const filter = state.filterMap.get(filenameMatch[1]);
    if (filter?.name) {
      return filter.name;
    }
  }

  return "";
}

function getFilterFilenameFromGalleryItem(item) {
  if (typeof item?.filterFilename === "string" && state.filterMap.has(item.filterFilename)) {
    return item.filterFilename;
  }
  const filename = typeof item?.filename === "string" ? item.filename : "";
  const match = filename.match(/camera-(\d+)(?:\D|$)/i);
  return match && state.filterMap.has(`camera-${match[1]}`) ? `camera-${match[1]}` : "";
}

function isGalleryGifItem(item) {
  return item?.mediaType === "gif" || /\.gif(?:$|\?)/i.test(String(item?.filename ?? item?.fileUrl ?? ""));
}

function getGalleryPresetFilters() {
  return state.filters.filter((filter) => filter.filename && state.filterMap.has(filter.filename));
}

function syncGalleryPresetSelect(item) {
  if (!galleryPresetSelect) {
    return;
  }
  galleryPresetSelect.innerHTML = "";
  if (isGalleryVideoItem(item)) {
    galleryPresetSelect.disabled = true;
    galleryPresetSelect.title = "Video preset editing is not available.";
    return;
  }
  const currentFilename = getFilterFilenameFromGalleryItem(item);
  const favoriteCount = state.favoriteCameraFilenames.size;

  for (const filter of getGalleryPresetFilters()) {
    const option = document.createElement("option");
    option.value = filter.filename;
    option.textContent = state.favoriteCameraFilenames.has(filter.filename) ? `★ ${filter.name}` : filter.name;
    galleryPresetSelect.append(option);
  }

  galleryPresetSelect.value = currentFilename || lookSelect.value;
  if (!galleryPresetSelect.value && galleryPresetSelect.options.length) {
    galleryPresetSelect.selectedIndex = 0;
  }
  galleryPresetSelect.disabled = !galleryPresetSelect.options.length;
  galleryPresetSelect.title = favoriteCount
    ? "Favorite cameras are marked with a star. Order matches camera mode."
    : "Order matches camera mode.";
}

function syncGalleryGifBoomerangControl(item) {
  const isGif = isGalleryGifItem(item);
  if (galleryGifBoomerangControl) {
    galleryGifBoomerangControl.hidden = !isGif;
  }
  if (galleryGifBoomerangToggle) {
    galleryGifBoomerangToggle.checked = Boolean(item?.gifBoomerang);
    galleryGifBoomerangToggle.disabled = !isGif || !hasNativeGalleryFile(item) || !getNativeBridge()?.setGalleryGifBoomerang;
  }
}

async function openGalleryItem(item) {
  state.selectedGalleryItem = item;
  galleryViewerImage.removeAttribute("src");
  if (galleryViewerVideo) {
    galleryViewerVideo.pause();
    galleryViewerVideo.removeAttribute("src");
    galleryViewerVideo.load();
    galleryViewerVideo.hidden = true;
  }
  clearGalleryPresetDraft();
  clearGalleryProcessingPreview();
  const cameraName = resolveGalleryCameraName(item);
  galleryViewerCamera.textContent = cameraName ? `Shot with ${cameraName}` : "Camera unavailable";
  syncGalleryPresetSelect(item);
  syncGalleryGifBoomerangControl(item);
  if (!showGalleryViewerItem(item, { showOnLoad: true })) {
    state.selectedGalleryItem = null;
    setStatus("Selected gallery image is unavailable.");
    return;
  }
}

function closeGalleryItem() {
  state.selectedGalleryItem = null;
  state.selectedGalleryLoadToken += 1;
  galleryViewerImage.onload = null;
  galleryViewerImage.onerror = null;
  galleryViewerImage.removeAttribute("src");
  galleryViewerImage.hidden = false;
  if (galleryViewerVideo) {
    galleryViewerVideo.onloadeddata = null;
    galleryViewerVideo.onerror = null;
    galleryViewerVideo.pause();
    galleryViewerVideo.removeAttribute("src");
    galleryViewerVideo.load();
    galleryViewerVideo.hidden = true;
  }
  clearGalleryPresetDraft();
  clearGalleryProcessingPreview();
  if (state.selectedGalleryObjectUrl) {
    URL.revokeObjectURL(state.selectedGalleryObjectUrl);
    state.selectedGalleryObjectUrl = "";
  }
  galleryViewer.hidden = true;
  galleryViewerCamera.textContent = "";
  if (galleryPresetSelect) {
    galleryPresetSelect.innerHTML = "";
    galleryPresetSelect.disabled = false;
  }
  syncGalleryGifBoomerangControl(null);
}

async function setSelectedGalleryGifBoomerang(enabled) {
  const item = state.selectedGalleryItem;
  const nativeBridge = getNativeBridge();
  if (!item || !isGalleryGifItem(item) || !hasNativeGalleryFile(item) || !nativeBridge?.setGalleryGifBoomerang) {
    setStatus("Boomerang editing is only available for local GIFs.");
    syncGalleryGifBoomerangControl(item);
    return;
  }

  galleryGifBoomerangToggle.disabled = true;
  try {
    const result = await nativeBridge.setGalleryGifBoomerang({
      fileUrl: item.fileUrl,
      originalFileUrl: item.originalFileUrl || item.fileUrl,
      boomerang: Boolean(enabled),
    });
    if (!result?.item) {
      throw new Error("Native GIF update did not return an item.");
    }
    const nextItem = {
      ...result.item,
      cacheBust: Date.now(),
    };
    state.debug.lastGalleryGifBoomerang = {
      at: new Date().toISOString(),
      camera: nextItem.cameraName ?? item.cameraName ?? null,
      boomerang: Boolean(enabled),
      frameCount: result.metrics?.frameCount ?? null,
      outputFrameCount: result.metrics?.outputFrameCount ?? null,
      gifBytes: result.metrics?.gifBytes ?? null,
      normalGifBytes: result.metrics?.normalGifBytes ?? null,
      loopMode: result.metrics?.loopMode ?? (enabled ? "boomerang" : "normal"),
      metrics: result.metrics ?? null,
    };
    persistDebugHistory();
    debugEvent("gallery-gif-boomerang", {
      boomerang: Boolean(enabled),
      frameCount: result.metrics?.frameCount ?? null,
      outputFrameCount: result.metrics?.outputFrameCount ?? null,
      loopMode: result.metrics?.loopMode ?? (enabled ? "boomerang" : "normal"),
    });
    replaceGalleryItem(item, nextItem);
    state.selectedGalleryItem = nextItem;
    showGalleryViewerItem(nextItem);
    syncGalleryGifBoomerangControl(nextItem);
    renderGalleryWhenTransitionSafe("gallery-gif-boomerang");
    setStatus(enabled ? "Boomerang applied to GIF." : "Boomerang removed from GIF.");
  } catch (error) {
    console.error(error);
    syncGalleryGifBoomerangControl(item);
    setStatus("Failed to update GIF boomerang.");
  }
}

async function deleteSelectedGalleryItem() {
  const item = state.selectedGalleryItem;
  if (!item) {
    return;
  }

  await deleteGalleryItemFromApp(item);
  closeGalleryItem();
  renderGalleryWhenTransitionSafe("gallery-delete-selected");
  setStatus("Deleted local gallery image.");
}

async function deleteGalleryItemFromApp(item) {
  if (hasNativeGalleryFile(item)) {
    try {
      const result = await getNativeBridge()?.deleteGalleryItem?.({ fileUrl: item.fileUrl });
      debugEvent("native-gallery:delete", {
        id: item.id,
        filename: item.filename,
        deleted: Boolean(result?.deleted),
      });
    } catch (error) {
      console.error(error);
      debugEvent("native-gallery:delete-error", {
        id: item.id,
        filename: item.filename,
        message: error?.message ?? String(error),
      });
    }
  }
  await deleteGalleryItemRecord(item);
  removeGalleryItemFromState(item);
}

async function deleteSelectedGalleryItemsFromApp() {
  const selectedKeys = new Set(state.gallerySelectedItemKeys);
  const items = state.galleryItems.filter((item) => selectedKeys.has(getGalleryItemKey(item)));
  if (!items.length) {
    exitGallerySelectionMode();
    return;
  }

  const confirmed = window.confirm(
    `Delete ${items.length} ${items.length === 1 ? "image" : "images"} from the app gallery? This will not delete photos from iOS Photos.`,
  );
  if (!confirmed) {
    return;
  }

  for (const item of items) {
    await deleteGalleryItemFromApp(item);
  }
  const deletedCount = items.length;
  state.gallerySelectionMode = false;
  state.gallerySelectedItemKeys.clear();
  updateGallerySelectionUi();
  renderGalleryWhenTransitionSafe("gallery-delete-selection");
  setStatus(`Deleted ${deletedCount} ${deletedCount === 1 ? "image" : "images"} from app gallery.`);
}

async function saveSelectedGalleryItem() {
  const item = state.selectedGalleryItem;
  if (!item) {
    return;
  }
  if (state.galleryPresetProcessing) {
    setStatus("Still rendering preview. Save after it finishes.");
    return;
  }

  if (state.galleryPresetDraft?.blob) {
    const draft = state.galleryPresetDraft;
    const saved = await saveBlobToNativePhotoLibrary(
      draft.blob,
      draft.filename ?? `kono-edited-${Date.now()}.jpg`,
    );
    if (!saved) {
      setStatus("Failed to save edited photo.");
      return;
    }
    try {
      await replaceSelectedGalleryItemWithDraft(item, draft);
      setStatus("Saved edited photo to KONO CAM album and updated app gallery.");
    } catch (error) {
      console.error(error);
      setStatus("Saved edited photo to KONO CAM album, but failed to update app gallery.");
    }
    return;
  }

  if (item.fileUrl && await saveNativeGalleryItemToPhotos(item)) {
    setStatus("Saved photo to KONO CAM album.");
    return;
  }

  const blob = await getGalleryItemBlob(item);
  if (!blob) {
    setStatus("Selected gallery image is unavailable.");
    return;
  }

  if (await saveBlobToNativePhotoLibrary(blob, item.filename)) {
    setStatus("Saved photo to KONO CAM album.");
    return;
  }

  const file = new File([blob], item.filename, { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Analoguecam photo" });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = item.filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function replaceSelectedGalleryItemWithDraft(item, draft) {
  if (!item || !draft?.blob) {
    return null;
  }

  let nextItem = null;
  const cacheBust = Date.now();
  if (hasNativeGalleryFile(item)) {
    const nativeBridge = getNativeBridge();
    if (!nativeBridge?.replaceGalleryItemData) {
      throw new Error("Native gallery replacement is unavailable.");
    }
    const result = await nativeBridge.replaceGalleryItemData({
      fileUrl: item.fileUrl,
      originalFileUrl: item.originalFileUrl || item.fileUrl,
      dataUrl: await blobToDataUrl(draft.blob),
      filename: draft.filename ?? item.filename,
      cameraName: draft.cameraName ?? item.cameraName ?? "camera",
    });
    nextItem = {
      ...(result?.item ?? item),
      filterFilename: draft.filterFilename ?? item.filterFilename ?? null,
      cacheBust,
    };
  } else {
    const thumbnailBlob = await createGalleryThumbnailBlob(draft.blob).catch(() => item.thumbnailBlob ?? null);
    nextItem = {
      ...item,
      blob: draft.blob,
      thumbnailBlob,
      filename: draft.filename ?? item.filename,
      cameraName: draft.cameraName ?? item.cameraName ?? null,
      filterFilename: draft.filterFilename ?? item.filterFilename ?? null,
      cacheBust,
    };
    await saveGalleryItemRecordUpdate(nextItem);
  }

  replaceGalleryItem(item, nextItem);
  state.selectedGalleryItem = nextItem;
  if (galleryViewerCamera) {
    const cameraName = resolveGalleryCameraName(nextItem);
    galleryViewerCamera.textContent = cameraName ? `Shot with ${cameraName}` : "Camera unavailable";
  }
  clearGalleryPresetDraft();
  showGalleryViewerItem(nextItem);
  syncGalleryPresetSelect(nextItem);
  renderGalleryWhenTransitionSafe("gallery-save-edited-item");
  if (state.favoriteCameraDrawerOpen) {
    renderFavoriteCameraDrawer();
  }
  return nextItem;
}

async function saveNativeGalleryItemToPhotos(item) {
  const nativeBridge = getNativeBridge();
  if (!nativeBridge?.saveGalleryItemToPhotos || !item.fileUrl) {
    return false;
  }

  try {
    const result = await nativeBridge.saveGalleryItemToPhotos({ fileUrl: item.fileUrl });
    const saved = Boolean(result?.saved);
    debugEvent("native-gallery:save-to-photos", {
      id: item.id,
      filename: item.filename,
      saved,
    });
    return saved;
  } catch (error) {
    console.error(error);
    debugEvent("native-gallery:save-to-photos-error", {
      id: item.id,
      filename: item.filename,
      message: error?.message ?? String(error),
    });
    return false;
  }
}

async function getGalleryItemBlob(item) {
  if (item.blob) {
    return item.blob;
  }
  const url = getGalleryItemUrl(item);
  if (!url) {
    return null;
  }
  const response = await fetch(url);
  return response.ok ? response.blob() : null;
}

function getGalleryOriginalUrl(item) {
  if (item.originalBlob) {
    if (state.galleryPresetPreviewObjectUrl) {
      URL.revokeObjectURL(state.galleryPresetPreviewObjectUrl);
    }
    state.galleryPresetPreviewObjectUrl = URL.createObjectURL(item.originalBlob);
    return state.galleryPresetPreviewObjectUrl;
  }
  if (item.originalFileUrl) {
    return getGalleryFileUrl(item.originalFileUrl);
  }
  return getGalleryItemUrl(item);
}

async function getGalleryOriginalBlob(item) {
  if (item.originalBlob) {
    return item.originalBlob;
  }
  const sourceUrl = getGalleryOriginalUrl(item);
  if (!sourceUrl) {
    return null;
  }
  const response = await fetch(sourceUrl);
  return response.ok ? response.blob() : null;
}

function clearGalleryProcessingPreview() {
  galleryViewerImage.classList.remove("is-processing", "is-processing-bnw");
  if (state.galleryPresetPreviewObjectUrl) {
    URL.revokeObjectURL(state.galleryPresetPreviewObjectUrl);
    state.galleryPresetPreviewObjectUrl = "";
  }
}

function clearGalleryPresetDraft(options = {}) {
  state.galleryPresetRenderToken += 1;
  if (state.galleryPresetDraft?.objectUrl) {
    URL.revokeObjectURL(state.galleryPresetDraft.objectUrl);
  }
  state.galleryPresetDraft = null;
  if (options.cancelProcessing !== false) {
    state.galleryPresetProcessing = false;
  }
}

function showGalleryProcessingPreview(item, filter) {
  clearGalleryProcessingPreview();
  const originalUrl = getGalleryOriginalUrl(item);
  if (originalUrl) {
    galleryViewerImage.src = originalUrl;
  }
  galleryViewerImage.classList.add("is-processing");
  galleryViewerImage.classList.toggle("is-processing-bnw", filter?.groupFilename === "BNW" || Boolean(filter?.isBnw));
}

function getFilterDefaultEffects(filename) {
  const effects = cloneEffectDefaults();
  const filterDefaults = state.filterEffectDefaults.get(filename);

  if (filterDefaults) {
    for (const [effectId, value] of Object.entries(filterDefaults)) {
      const effect = getEffectById(effectId);
      if (!effect || !effects[effectId]) {
        continue;
      }
      effects[effectId].value = value;
      effects[effectId].enabled = value !== effect.defaultValue;
    }
  }

  effects.nomoGrain.value = DEFAULT_NOMO_GRAIN_VALUE;
  effects.nomoGrain.enabled = DEFAULT_NOMO_GRAIN_VALUE !== getEffectById("nomoGrain").defaultValue;
  return effects;
}

function getDefaultImportedEffects() {
  return {
    spektraGrain: {
      enabled: SPEKTRA_GRAIN_EFFECT.defaultEnabled,
      preset: SPEKTRA_GRAIN_EFFECT.defaultPreset,
      mode: SPEKTRA_GRAIN_EFFECT.defaultMode,
    },
  };
}

async function applyGalleryPresetToSelectedItem(filename) {
  const item = state.selectedGalleryItem;
  const filter = state.filterMap.get(filename);
  if (!item || !filter) {
    return;
  }
  if (isGalleryVideoItem(item)) {
    setStatus("Video preset editing is not available.");
    syncGalleryPresetSelect(item);
    return;
  }

  const renderToken = ++state.galleryPresetRenderToken;
  state.galleryPresetProcessing = true;
  clearGalleryPresetDraft({ cancelProcessing: false });
  state.galleryPresetRenderToken = renderToken;
  showGalleryProcessingPreview(item, filter);
  setStatus(`Previewing ${filter.name}...`);

  try {
    const originalBlob = await getGalleryOriginalBlob(item);
    if (!originalBlob) {
      throw new Error("Original gallery image is unavailable.");
    }

    const effects = getFilterDefaultEffects(filename);
    const importedEffects = getDefaultImportedEffects();
    rerollOverlaySelections();
    const overlaySelections = cloneOverlaySelections(state.overlaySelections);
    const cameraName = filter.name ?? "camera";
    const outputFilename = `analoguecam-${filter.filename}-${Date.now()}.jpg`;
    const nativeDraft = await processGalleryPresetDraftWithNativeStack({
      item,
      originalBlob,
      filename,
      filter,
      effects,
      importedEffects,
      overlaySelections,
      outputFilename,
      cameraName,
    });
    const draft = nativeDraft ?? await processGalleryPresetDraftWithWebStack({
      item,
      originalBlob,
      filename,
      filter,
      effects,
      importedEffects,
      overlaySelections,
      outputFilename,
      cameraName,
    });
    if (renderToken !== state.galleryPresetRenderToken) {
      return;
    }

    const objectUrl = URL.createObjectURL(draft.blob);
    clearGalleryProcessingPreview();
    state.galleryPresetDraft = {
      ...draft,
      objectUrl,
      sourceKey: getGalleryItemKey(item),
    };
    galleryViewerImage.src = objectUrl;
    setStatus(`Previewing ${cameraName}. Tap Save to export.`);
  } catch (error) {
    if (renderToken !== state.galleryPresetRenderToken) {
      return;
    }
    console.error(error);
    setStatus("Failed to preview preset.");
    syncGalleryPresetSelect(item);
    const fallbackUrl = getGalleryItemUrl(item);
    if (fallbackUrl) {
      galleryViewerImage.src = fallbackUrl;
    }
  } finally {
    if (renderToken === state.galleryPresetRenderToken) {
      state.galleryPresetProcessing = false;
      galleryViewerImage.classList.remove("is-processing", "is-processing-bnw");
      if (galleryPresetSelect) {
        galleryPresetSelect.disabled = !galleryPresetSelect.options.length;
      }
    }
  }
}

async function processGalleryPresetDraftWithNativeStack(job) {
  const nativeBridge = getNativeBridge();
  if (
    !nativeBridge?.processPhotoStack
    || !isNativeFinalStackSaveEligible(job.filename, job.effects, job.importedEffects)
  ) {
    return null;
  }

  const lutBytes = await ensureLutBytes(job.filename);
  if (!lutBytes) {
    return null;
  }
  const image = await decodeBlobToImage(job.originalBlob);
  const outputSize = getFilterOutputSize(job.filename, image.naturalWidth, image.naturalHeight, getCameraSaveMaxSide());
  const isBnWFamily = job.filter?.groupFilename === "BNW";
  const result = await nativeBridge.processPhotoStack({
    dataUrl: await blobToDataUrl(job.originalBlob),
    lutBase64: bytesToBase64(lutBytes),
    filename: job.outputFilename,
    cameraName: job.cameraName,
    intensity: isBnWFamily ? 1 : Number(defaults.intensity) / 100,
    width: outputSize.width,
    height: outputSize.height,
    filter: makeNativeStackFilterPayload(job.filter),
    effects: job.effects,
    importedEffects: cloneImportedEffectsState(job.importedEffects),
    overlaySelections: job.overlaySelections,
  });
  if (!result?.dataUrl) {
    return null;
  }
  return {
    blob: await dataUrlToBlob(result.dataUrl),
    filename: result.filename ?? job.outputFilename,
    filterFilename: job.filename,
    cameraName: job.cameraName,
  };
}

async function processGalleryPresetDraftWithWebStack(job) {
  const previous = snapshotRenderState();
  try {
    const image = await decodeBlobToImage(job.originalBlob);
    lookSelect.value = job.filename;
    cameraLookSelect.value = job.filename;
    intensitySlider.value = defaults.intensity;
    state.effects = cloneEffectsState(job.effects);
    state.importedEffects = cloneImportedEffectsState(job.importedEffects);
    state.overlaySelections = cloneOverlaySelections(job.overlaySelections);
    await ensureLutTexture(job.filename);
    await ensureCameraOverlayImages(job.filename);
    fitCanvasToFilterOutputSize(job.filename, image.naturalWidth, image.naturalHeight, getMobileSaveMaxSide(image, {
      filterFilename: job.filename,
      effects: job.effects,
      importedEffects: job.importedEffects,
      halfSizeSave: state.halfSizeSave,
    }));
    uploadSourceTexture(image);
    state.source = image;
    state.sourceName = job.outputFilename;
    state.sourceResolution = { width: image.naturalWidth, height: image.naturalHeight };
    renderImage({ includeSpektraGrain: true });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_EXPORT_QUALITY));
    if (!blob) {
      throw new Error("Failed to render gallery preset.");
    }
    return {
      blob,
      filename: job.outputFilename,
      filterFilename: job.filename,
      cameraName: job.cameraName,
    };
  } finally {
    restoreRenderState(previous);
  }
}

function replaceGalleryItem(previousItem, nextItem) {
  const previousKey = previousItem?.fileUrl || previousItem?.id;
  const index = state.galleryItems.findIndex((item) => (item.fileUrl || item.id) === previousKey || item.id === previousItem?.id);
  if (index >= 0) {
    state.galleryItems[index] = nextItem;
  } else {
    insertGalleryItemAtFront(nextItem);
  }
}

async function saveBlobToNativePhotoLibrary(blob, filename) {
  const nativeBridge = window.Capacitor?.Plugins?.KonoNativeBridge;
  if (!nativeBridge?.savePhoto) {
    return false;
  }

  try {
    const dataUrl = await blobToDataUrl(blob);
    await nativeBridge.savePhoto({ dataUrl, filename });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read photo blob."));
    reader.readAsDataURL(blob);
  });
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function loadFile(file) {
  if (!file || !gl) {
    return;
  }

  loadBlob(file, file.name);
}

async function loadBlob(blob, sourceName = "nomo-edit") {
  setStatus("Loading photo...");
  const image = new Image();
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    image.onload = async () => {
      try {
        await applyLoadedImage(image, sourceName);
        resolve();
      } catch (error) {
        console.error(error);
        setStatus("Failed to process the photo.");
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus("Failed to decode the photo.");
      reject(new Error("Failed to decode the photo."));
    };

    image.src = url;
  });
}

async function applyLoadedImage(image, sourceName = "nomo-edit") {
  state.source = image;
  state.stillImage = image;
  state.sourceResolution = { width: image.naturalWidth, height: image.naturalHeight };
  state.sourceName = sourceName.replace(/\.[^/.]+$/, "") || "nomo-edit";
  state.stillSourceName = state.sourceName;
  uploadSourceTexture(image);
  resetCanvasView();
  await ensureLutTexture(lookSelect.value);
  await ensureCameraOverlayImages(lookSelect.value);
  fitCanvasToFilterOutputSize(lookSelect.value, image.naturalWidth, image.naturalHeight, STILL_IMAGE_MAX_SIDE);
  renderImage();
  setStatus(`${state.filterMap.get(lookSelect.value)?.name ?? lookSelect.value} loaded.`);
}

function fitCanvasToImage(image) {
  fitCanvasToSize(image.naturalWidth, image.naturalHeight, STILL_IMAGE_MAX_SIDE);
}

function fitCanvasToFilterOutputSize(filename, sourceWidth, sourceHeight, maxSide) {
  const size = getFilterOutputSize(filename, sourceWidth, sourceHeight, maxSide);
  fitCanvasToSize(size.width, size.height, maxSide);
}

function getFilterOutputSize(filename, sourceWidth, sourceHeight, maxSide) {
  const sizingImage = getCameraStackSizingImage(filename);
  if (!sizingImage) {
    return fitSizeWithinMax(sourceWidth, sourceHeight, maxSide);
  }

  const width = sizingImage.naturalWidth || sizingImage.width;
  const height = sizingImage.naturalHeight || sizingImage.height;
  if (!width || !height) {
    return fitSizeWithinMax(sourceWidth, sourceHeight, maxSide);
  }

  return fitSizeWithinMax(width, height, maxSide);
}

function fitSizeWithinMax(width, height, maxSide) {
  const longestSide = Math.max(width, height);
  const scale = Math.min(1, maxSide / longestSide);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function getCameraStackSizingImage(filename) {
  const filter = state.filterMap.get(filename);
  if (!filter || isFrameDisabledCamera(filter)) {
    return null;
  }

  if (isFrameCroppedToPhotoCamera(filter)) {
    return null;
  }

  if (isSourceAspectBlendCamera(filter)) {
    return null;
  }

  const overlays = state.currentCameraOverlayImages;
  if (!overlays) {
    return null;
  }

  const frameEffect = (filter.filters ?? []).find((effect) => String(effect.type ?? "").toLowerCase() === "frame" && effect.params?.region);
  if (frameEffect && overlays.frame?.length) {
    return pickOverlayImage(overlays.frame, stableOverlayIndex(frameEffect.raw, overlays.frame.length));
  }

  const fillBlendEffect = (filter.filters ?? []).find((effect) => {
    if (String(effect.type ?? "").toLowerCase() !== "blend") {
      return false;
    }
    const fillMode = String(effect.params?.fillmode ?? "").toLowerCase();
    return fillMode === "fill" || effect.params?.replace === "1";
  });
  if (fillBlendEffect && overlays.blend?.length) {
    return pickOverlayImage(overlays.blend, stableOverlayIndex(fillBlendEffect.raw, overlays.blend.length));
  }

  return null;
}

function fitCanvasToSize(width, height, maxSide) {
  const { width: nextWidth, height: nextHeight } = fitSizeWithinMax(width, height, maxSide);
  if (canvas.width === nextWidth && canvas.height === nextHeight) {
    return;
  }

  canvas.width = nextWidth;
  canvas.height = nextHeight;
  updateCanvasDisplaySize();
  ensureLookupTarget(canvas.width, canvas.height);
  ensureEffectsTarget(canvas.width, canvas.height);
}

function updateCanvasDisplaySize() {
  if (!canvas.width || !canvas.height || !workspace) {
    return;
  }

  const workspaceStyles = window.getComputedStyle(workspace);
  const horizontalPadding = Number.parseFloat(workspaceStyles.paddingLeft) + Number.parseFloat(workspaceStyles.paddingRight);
  const verticalPadding = Number.parseFloat(workspaceStyles.paddingTop) + Number.parseFloat(workspaceStyles.paddingBottom);
  const availableWidth = Math.max(0, workspace.clientWidth - horizontalPadding);
  const availableHeight = Math.max(0, workspace.clientHeight - verticalPadding);

  if (!availableWidth || !availableHeight) {
    return;
  }

  const imageRatio = canvas.width / canvas.height;
  let displayWidth = Math.min(availableWidth, canvas.width);
  let displayHeight = displayWidth / imageRatio;

  if (displayHeight > availableHeight) {
    displayHeight = Math.min(availableHeight, canvas.height);
    displayWidth = displayHeight * imageRatio;
  }

  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.style.maxWidth = `${displayWidth}px`;
  canvas.style.maxHeight = `${displayHeight}px`;
  updateCanvasViewTransform();
}

function uploadSourceTexture(image) {
  fitCanvasToImage(image);
  uploadSourceTexturePixels(image);
}

function uploadSourceTexturePixels(source) {
  if (state.sourceTexture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.sourceTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    return;
  }

  state.sourceTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.sourceTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

async function ensureLutTexture(filename) {
  if (!filename || (state.selectedFilterFilename === filename && state.lutTexture)) {
    return;
  }

  const rgbBytes = await ensureLutBytes(filename);
  uploadLutTexture(rgbBytes);
  state.lutRgbBytes = rgbBytes;
  state.selectedFilterFilename = filename;
}

async function ensureLutBytes(filename) {
  if (!filename) {
    return null;
  }
  if (state.lutByteCache.has(filename)) {
    return state.lutByteCache.get(filename);
  }
  if (state.lutBytePromises.has(filename)) {
    return state.lutBytePromises.get(filename);
  }

  const loadPromise = loadLutBytes(filename);
  state.lutBytePromises.set(filename, loadPromise);
  try {
    const rgbBytes = await loadPromise;
    state.lutByteCache.set(filename, rgbBytes);
    return rgbBytes;
  } finally {
    state.lutBytePromises.delete(filename);
  }
}

async function loadLutBytes(filename) {
  const filter = state.filterMap.get(filename);

  if (filter?.custom) {
    setStatus(`Generating ${filter.name}...`);
    return generateCustomLut(filter.recipe);
  }

  setStatus(`Decrypting ${filter?.name ?? filename}...`);
  const lutPath = filter?.lutPath ? `${CAMERA_ASSETS_ROOT}/${filter.lutPath}` : null;
  if (!lutPath) {
    throw new Error(`Camera ${filename} does not define a LUT asset.`);
  }
  const response = await fetch(lutPath);
  if (!response.ok) {
    throw new Error(`Failed to load LUT ${filename}: ${response.status}`);
  }
  const encrypted = await response.arrayBuffer();
  return decryptNomoLut(encrypted);
}

async function decryptNomoLut(encryptedBuffer) {
  const encrypted = new Uint8Array(encryptedBuffer);
  if (encrypted.byteLength % 16 !== 0) {
    throw new Error("Encrypted LUT length is not a multiple of 16.");
  }

  const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-CBC", iv: ZERO_IV }, state.aesKey, encrypted);
  const decrypted = new Uint8Array(decryptedBuffer);

  if (decrypted.byteLength < LUT_PIXEL_BYTES) {
    throw new Error(`Decrypted LUT is too small: ${decrypted.byteLength}`);
  }

  const rgb = decrypted.slice(0, LUT_PIXEL_BYTES);
  for (let index = 0; index + 2 < rgb.length; index += 3) {
    const red = rgb[index];
    rgb[index] = rgb[index + 2];
    rgb[index + 2] = red;
  }

  return rgb;
}

function uploadLutTexture(rgbBytes) {
  if (state.lutTexture) {
    gl.deleteTexture(state.lutTexture);
  }

  state.lutTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, state.lutTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, LUT_WIDTH, LUT_HEIGHT, 0, gl.RGB, gl.UNSIGNED_BYTE, rgbBytes);
}

function ensureLookupTarget(width, height) {
  state.lookupTarget = ensureRenderTarget(state.lookupTarget, width, height);
}

function ensureEffectsTarget(width, height) {
  state.effectsTarget = ensureRenderTarget(state.effectsTarget, width, height);
}

function ensureRenderTarget(target, width, height) {
  if (target && target.width === width && target.height === height) {
    return target;
  }

  if (target) {
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
  }

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { width, height, texture, framebuffer };
}

function renderImage(options = {}) {
  if (!state.source || !state.sourceTexture || !gl || !state.geometry) {
    return;
  }

  if (!state.cameraActive) {
    cameraShell.hidden = true;
  }

  if (state.showingOriginal) {
    renderBlit(state.sourceTexture);
  } else {
    renderLookupStage();
    renderEffectsStage();
    if (options.livePreview) {
      renderBlit(state.effectsTarget.texture);
    } else {
      renderPostEffectsStage(options);
    }
  }

  canvas.style.display = "block";
  emptyState.style.display = "none";
  resetButton.disabled = false;
  toggleEditsButton.disabled = false;
  downloadButton.disabled = state.showingOriginal;
}

function renderLookupStage() {
  const selectedFilter = state.filterMap.get(lookSelect.value);
  const isBnWFamily = selectedFilter?.groupFilename === "BNW";
  const effectiveIntensity = isBnWFamily ? 1 : Number(intensitySlider.value) / 100;

  gl.bindFramebuffer(gl.FRAMEBUFFER, state.lookupTarget.framebuffer);
  gl.viewport(0, 0, state.lookupTarget.width, state.lookupTarget.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(state.programs.lookup);
  gl.bindVertexArray(state.geometry.vao);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.sourceTexture);
  gl.uniform1i(state.uniforms.lookup.image, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, state.lutTexture);
  gl.uniform1i(state.uniforms.lookup.lut, 1);
  gl.uniform1f(state.uniforms.lookup.intensity, effectiveIntensity);
  gl.uniform1f(state.uniforms.lookup.gridsize, LUT_HEIGHT);
  gl.uniform1f(state.uniforms.lookup.texwidth, LUT_WIDTH);
  gl.uniform1f(state.uniforms.lookup.isBnW, isBnWFamily ? 1 : 0);
  gl.uniformMatrix4fv(state.uniforms.lookup.colorMatrix, false, COLOR_MATRIX);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function renderEffectsStage() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, state.effectsTarget.framebuffer);
  gl.viewport(0, 0, state.effectsTarget.width, state.effectsTarget.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(state.programs.effects);
  gl.bindVertexArray(state.geometry.vao);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.lookupTarget.texture);
  gl.uniform1i(state.uniforms.effects.image, 0);
  gl.uniform2f(state.uniforms.effects.texelSize, 1 / canvas.width, 1 / canvas.height);
  gl.uniform1f(state.uniforms.effects.exposure, state.effects.exposure.value);
  gl.uniform1f(state.uniforms.effects.contrast, state.effects.contrast.value);
  gl.uniform1f(state.uniforms.effects.saturation, state.effects.saturation.value);
  gl.uniform1f(state.uniforms.effects.temperature, state.effects.temperature.value);
  gl.uniform1f(state.uniforms.effects.tint, state.effects.tint.value);
  gl.uniform1f(state.uniforms.effects.fade, state.effects.fade.value);
  gl.uniform1f(state.uniforms.effects.highlight, state.effects.highlight.value);
  gl.uniform1f(state.uniforms.effects.shadow, state.effects.shadow.value);
  gl.uniform1f(state.uniforms.effects.sharpen, state.effects.sharpen.value);
  gl.uniform1f(state.uniforms.effects.vignette, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function renderPostEffectsStage(options = {}) {
  const rgba = new Uint8Array(canvas.width * canvas.height * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, state.effectsTarget.framebuffer);
  gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);

  let output = rgba;

  const includeNomoOverlays = options.includeNomoOverlays ?? !state.cameraActive;
  const includeCameraStack = options.includeCameraStack ?? includeNomoOverlays;
  if (includeNomoOverlays && isRainbowFilterSelected()) {
    output = applyRainbowCameraPass(output, canvas.width, canvas.height);
  }

  if (includeNomoOverlays && hasNomoOverlayEffects({ includeCameraStack })) {
    output = compositeNomoOverlays(output, { includeCameraStack });
  }

  const includeSpektraGrain = options.includeSpektraGrain ?? !state.cameraActive;
  if (includeSpektraGrain && state.importedEffects.spektraGrain.enabled && state.spektraProfile) {
    output = applySpektraGrainToRgba(
      output,
      canvas.width,
      canvas.height,
      state.spektraProfile,
      {
        filmFormatMm: 35.0,
        preset: state.importedEffects.spektraGrain.preset,
        mode: state.importedEffects.spektraGrain.mode,
      },
    );
  }

  uploadGrainTexture(output);
  renderBlit(state.grainTexture);
}

async function renderNativeProcessedImageWithCpuStack(image, width, height, options = {}) {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const context = outputCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to create CPU save canvas.");
  }

  context.drawImage(image, 0, 0, width, height);
  let imageData = context.getImageData(0, 0, width, height);
  let output = applyCpuManualEffects(new Uint8Array(imageData.data), width, height, state.effects);

  const includeNomoOverlays = options.includeNomoOverlays ?? true;
  const includeCameraStack = options.includeCameraStack ?? includeNomoOverlays;
  if (includeNomoOverlays && isRainbowFilterSelected()) {
    output = applyRainbowCameraPass(output, width, height);
  }

  if (includeNomoOverlays && hasNomoOverlayEffects({ includeCameraStack })) {
    output = compositeNomoOverlays(output, { includeCameraStack, width, height });
  }

  const includeSpektraGrain = options.includeSpektraGrain ?? true;
  if (includeSpektraGrain && state.importedEffects.spektraGrain.enabled && !state.spektraProfile) {
    await ensureSpektraProfileLoaded();
  }
  if (includeSpektraGrain && state.importedEffects.spektraGrain.enabled && state.spektraProfile) {
    output = applySpektraGrainToRgba(
      output,
      width,
      height,
      state.spektraProfile,
      {
        filmFormatMm: 35.0,
        preset: state.importedEffects.spektraGrain.preset,
        mode: state.importedEffects.spektraGrain.mode,
      },
    );
  }

  imageData = context.createImageData(width, height);
  imageData.data.set(output);
  context.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("CPU camera save did not produce a blob."));
      }
    }, "image/jpeg", JPEG_EXPORT_QUALITY);
  });
}

function applyCpuManualEffects(rgba, width, height, effects) {
  const exposure = Number(effects.exposure?.value ?? 0);
  const contrast = Number(effects.contrast?.value ?? 0);
  const saturation = Number(effects.saturation?.value ?? 0);
  const temperature = Number(effects.temperature?.value ?? 0);
  const tint = Number(effects.tint?.value ?? 0);
  const fade = Number(effects.fade?.value ?? 0);
  const highlight = Number(effects.highlight?.value ?? 0);
  const shadow = Number(effects.shadow?.value ?? 0);
  const sharpen = Number(effects.sharpen?.value ?? 0);
  const exposureScale = Math.pow(2, exposure);
  const output = new Uint8Array(rgba.length);

  for (let index = 0; index < rgba.length; index += 4) {
    let r = (rgba[index] / 255) * exposureScale;
    let g = (rgba[index + 1] / 255) * exposureScale;
    let b = (rgba[index + 2] / 255) * exposureScale;

    r = clamp01((r - 0.5) * (1 + contrast) + 0.5);
    g = clamp01((g - 0.5) * (1 + contrast) + 0.5);
    b = clamp01((b - 0.5) * (1 + contrast) + 0.5);

    const luma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    r = clamp01(luma + (r - luma) * (1 + saturation));
    g = clamp01(luma + (g - luma) * (1 + saturation));
    b = clamp01(luma + (b - luma) * (1 + saturation));

    r = clamp01(r + (temperature * 0.12) + (tint * 0.05));
    g = clamp01(g + (temperature * 0.03) + (tint * -0.08));
    b = clamp01(b + (temperature * -0.12) + (tint * 0.05));

    const adjustedLuma = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const highlightMask = smoothstep(0.45, 1.0, adjustedLuma) * highlight;
    const shadowMask = (1 - smoothstep(0.0, 0.55, adjustedLuma)) * shadow;
    r = r * (1 - (0.16 * highlightMask));
    g = g * (1 - (0.16 * highlightMask));
    b = b * (1 - (0.16 * highlightMask));
    r = r * (1 - shadowMask) + Math.pow(Math.max(r, 0), 0.85) * shadowMask;
    g = g * (1 - shadowMask) + Math.pow(Math.max(g, 0), 0.85) * shadowMask;
    b = b * (1 - shadowMask) + Math.pow(Math.max(b, 0), 0.85) * shadowMask;

    r = r * (1 - fade) + ((r * 0.88) + 0.12) * fade;
    g = g * (1 - fade) + ((g * 0.88) + 0.12) * fade;
    b = b * (1 - fade) + ((b * 0.88) + 0.12) * fade;

    output[index] = clampByte(r * 255);
    output[index + 1] = clampByte(g * 255);
    output[index + 2] = clampByte(b * 255);
    output[index + 3] = rgba[index + 3];
  }

  if (sharpen > 0) {
    return applyCpuSharpen(output, width, height, sharpen);
  }
  return output;
}

function applyCpuSharpen(rgba, width, height, amount) {
  const output = new Uint8Array(rgba.length);
  output.set(rgba);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const center = rgba[index + channel];
        const north = rgba[((Math.max(0, y - 1) * width + x) * 4) + channel];
        const south = rgba[((Math.min(height - 1, y + 1) * width + x) * 4) + channel];
        const west = rgba[((y * width + Math.max(0, x - 1)) * 4) + channel];
        const east = rgba[((y * width + Math.min(width - 1, x + 1)) * 4) + channel];
        const blur = (north + south + west + east) * 0.25;
        output[index + channel] = clampByte(center + (center - blur) * amount * 1.6);
      }
    }
  }
  return output;
}

function isRainbowFilterSelected() {
  return state.filterMap.get(lookSelect.value)?.id === RAINBOW_CAMERA_ID;
}

function applyRainbowCameraPass(rgba, width, height) {
  const colorIndex = selectRainbowColorIndex(rgba, width, height);
  const color = RAINBOW_CONFIG.colors[colorIndex]?.rgb ?? RAINBOW_CONFIG.colors[0].rgb;
  const output = new Uint8Array(rgba.length);
  const average = sampleAverageRgb(rgba, width, height);
  const whiteBalance = getRainbowWhiteBalanceMultipliers(average, 0.2);
  const tilt1 = RAINBOW_CONFIG.tilt1 / 100;
  const tilt2 = RAINBOW_CONFIG.tilt2 / 100;

  for (let index = 0; index < rgba.length; index += 4) {
    const y = Math.floor(index / 4 / width);
    const x = (index / 4) - y * width;
    const vertical = height > 1 ? y / (height - 1) : 0.5;
    const horizontal = width > 1 ? x / (width - 1) : 0.5;
    const tilt = 1 - (Math.abs(vertical - 0.5) * tilt2) - (Math.abs(horizontal - 0.5) * tilt1);
    const r = clampByte(applyRainbowSoftLight((rgba[index] / 255) * whiteBalance[0], color[0], 0.3) * 255 * tilt);
    const g = clampByte(applyRainbowSoftLight((rgba[index + 1] / 255) * whiteBalance[1], color[1], 0.3) * 255 * tilt);
    const b = clampByte(applyRainbowSoftLight((rgba[index + 2] / 255) * whiteBalance[2], color[2], 0.3) * 255 * tilt);
    output[index] = r;
    output[index + 1] = g;
    output[index + 2] = b;
    output[index + 3] = rgba[index + 3];
  }

  return output;
}

function applyRainbowSoftLight(base, color, alpha) {
  const clampedBase = Math.max(0, Math.min(1, base));
  const overlay = color * alpha;
  if (2 * clampedBase < 1) {
    return (2 * overlay * clampedBase) + (clampedBase * (1 - alpha));
  }
  return alpha - (2 * (1 - clampedBase) * (alpha - overlay)) + (clampedBase * (1 - alpha));
}

function selectRainbowColorIndex(rgba, width, height) {
  if (RAINBOW_CONFIG.random !== "2") {
    return stableOverlayIndex(`${state.sourceName}:rainbow`, RAINBOW_CONFIG.colors.length);
  }

  const sampleStep = Math.max(1, Math.floor(Math.sqrt((width * height) / 10000)));
  const bins = new Float32Array(8);
  let sampleCount = 0;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const offset = (y * width + x) * 4;
      const match = rainbowMainColorMatch(rgba[offset] / 255, rgba[offset + 1] / 255, rgba[offset + 2] / 255, x, y, width, height);
      if (!match) {
        sampleCount++;
        continue;
      }

      bins[match.index] += match.weight;
      sampleCount++;
    }
  }

  let selected = 0;
  let selectedWeight = 0;
  for (let index = 1; index < bins.length; index++) {
    if (bins[index] > selectedWeight) {
      selected = index;
      selectedWeight = bins[index];
    }
  }

  if (selectedWeight < sampleCount * 0.004) {
    return 0;
  }

  return selected === 7 ? 0 : selected - 1;
}

function rainbowMainColorMatch(r, g, b, x, y, width, height) {
  const colorHsv = rgbToHsv(r, g, b);
  const colorLab = rgbToRainbowLab(r, g, b);
  let minShift = 0.25;
  let minIndex = 0;

  for (let index = 0; index < RAINBOW_CONFIG.colors.length; index++) {
    const color = RAINBOW_CONFIG.colors[index].rgb;
    const colorShift = maxChannelDistance(colorLab, rgbToRainbowLab(color[0], color[1], color[2]));
    const saturationShift = Math.abs(colorHsv[1] - rgbToHsv(color[0], color[1], color[2])[1]);
    if (colorShift < minShift && saturationShift < 0.4) {
      minShift = colorShift;
      minIndex = index + 1;
    }
  }

  if (!minIndex) {
    return null;
  }

  const heavy = 1 - Math.hypot((x / Math.max(1, width - 1)) - 0.5, (y / Math.max(1, height - 1)) - 0.5);
  return {
    index: minIndex,
    weight: (1 - (minShift / 0.25) * 0.5) * heavy,
  };
}

function sampleAverageRgb(rgba, width, height) {
  const sampleStep = Math.max(1, Math.floor(Math.sqrt((width * height) / 10000)));
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const offset = (y * width + x) * 4;
      r += rgba[offset] / 255;
      g += rgba[offset + 1] / 255;
      b += rgba[offset + 2] / 255;
      count++;
    }
  }

  return count ? [r / count, g / count, b / count] : [1, 1, 1];
}

function getRainbowWhiteBalanceMultipliers(rgb, amount) {
  const luma = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  return rgb.map((channel) => channel > 0 ? (((luma / channel) - 1) * amount) + 1 : 1);
}

function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h /= 6;
    if (h < 0) {
      h += 1;
    }
  }

  return [h, max === 0 ? 0 : delta / max, max];
}

function rgbToRainbowLab(r, g, b) {
  const linear = [r, g, b].map((channel) => (
    channel > 0.04045 ? Math.pow((channel + 0.055) / 1.055, 2.4) : channel / 12.92
  ));
  const x = (linear[0] * 0.4124 + linear[1] * 0.3576 + linear[2] * 0.1805) * 100;
  const y = (linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722) * 100;
  const z = (linear[0] * 0.0193 + linear[1] * 0.1192 + linear[2] * 0.9505) * 100;
  const lab = xyzToLabComponent(x / 95.047, y / 100, z / 108.883);
  return [
    (((116 * lab[1]) - 16) / 100) * 0.78125,
    (500 * (lab[0] - lab[1])) / 127,
    (200 * (lab[1] - lab[2])) / 127,
  ];
}

function xyzToLabComponent(x, y, z) {
  return [x, y, z].map((value) => (
    value > 0.008856 ? Math.pow(value, 1 / 3) : (7.787 * value) + (16 / 116)
  ));
}

function maxChannelDistance(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function uploadGrainTexture(rgba) {
  if (!state.grainTexture) {
    state.grainTexture = gl.createTexture();
  }

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.grainTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
}

function hasNomoOverlayEffects(options = {}) {
  const includeCameraStack = options.includeCameraStack ?? true;
  const filter = state.filterMap.get(lookSelect.value);
  const cameraOverlayAssets = filter?.overlayAssets ?? {};
  const hasEnabledFrameAssets = !isFrameDisabledCamera(filter) && Boolean(cameraOverlayAssets.frame?.length);
  return (
    state.effects.nomoGrain?.value > 0 ||
    state.effects.dust?.value > 0 ||
    state.effects.lightLeak?.value > 0 ||
    state.effects.vignette?.value > 0 ||
    (includeCameraStack && Boolean(hasEnabledFrameAssets || cameraOverlayAssets.blend?.length || cameraOverlayAssets.water?.length))
  );
}

function compositeNomoOverlays(rgba, options = {}) {
  const baseCanvas = createCompositeCanvas(rgba, options.width, options.height);
  const context = baseCanvas.getContext("2d");
  const cameraOverlays = state.currentCameraOverlayImages;

  if (!context) {
    return rgba;
  }

  if (state.effects.nomoGrain.value > 0) {
    const grainImage = pickOverlayImage(cameraOverlays?.grain, state.overlaySelections.grain);
    drawOverlay(context, grainImage ?? state.nomoOverlayImages?.nomoGrain, state.effects.nomoGrain.value / 10, "overlay");
  }

  if (state.effects.dust.value > 0) {
    const dustImage = pickOverlayImage(cameraOverlays?.dust ?? state.nomoOverlayImages?.dust, state.overlaySelections.dust);
    drawOverlay(context, dustImage, state.effects.dust.value / 10, "screen", { flipXY: true });
  }

  if (state.effects.lightLeak.value > 0) {
    const leakImage = pickOverlayImage(cameraOverlays?.leak ?? state.nomoOverlayImages?.lightLeak, state.overlaySelections.lightLeak);
    drawOverlay(context, leakImage, state.effects.lightLeak.value / 10, "screen");
  }

  if (state.effects.vignette.value > 0) {
    const vignetteImage = pickOverlayImage(cameraOverlays?.vignette, state.overlaySelections.vignette);
    drawOverlay(context, vignetteImage ?? state.nomoOverlayImages?.vignette, state.effects.vignette.value / 10, "multiply", { flipXY: true });
  }

  if (options.includeCameraStack ?? true) {
    compositeCameraStackOverlays(context, cameraOverlays);
  }

  return new Uint8Array(context.getImageData(0, 0, baseCanvas.width, baseCanvas.height).data);
}

function compositeCameraStackOverlays(context, cameraOverlays) {
  const filter = state.filterMap.get(lookSelect.value);
  if (!filter || !cameraOverlays) {
    return;
  }

  for (const effect of filter.filters ?? []) {
    const type = String(effect.type ?? "").toLowerCase();
    if (type === "frame") {
      if (!isFrameDisabledCamera(filter)) {
        drawFrameOverlayList(context, cameraOverlays.frame, effect, filter);
      }
    } else if (type === "blend") {
      drawOverlayList(context, cameraOverlays.blend, effect, blendModeFromCameraEffect(effect));
    } else if (type === "water") {
      drawOverlayList(context, cameraOverlays.water, effect, "screen");
    }
  }
}

function isFrameDisabledCamera(filter) {
  return filter?.name === "620 B" || filter?.id === 51;
}

function isFrameCroppedToPhotoCamera(filter) {
  return filter?.id === 49
    || filter?.id === 50
    || filter?.name === "McDonald’s"
    || filter?.name === "Lunar Rabbits";
}

function isSourceAspectBlendCamera(filter) {
  return filter?.id === 48 || filter?.name === "135 P";
}

function drawFrameOverlayList(context, images, effect, filter) {
  if (!images?.length) {
    return;
  }

  const value = Number(effect.value ?? effect.params?.v ?? 10);
  const alpha = Number.isFinite(value) ? Math.min(1, Math.max(0, value / 10)) : 1;
  const image = pickOverlayImage(images, stableOverlayIndex(effect.raw, images.length));

  const region = parseFrameRegion(effect.params?.region);

  if (!region) {
    drawOverlay(context, image, alpha, "source-over", {
      tiled: effect.params?.fillmode === "tiled",
    });
    return;
  }

  if (isFrameCroppedToPhotoCamera(filter)) {
    drawFrameCroppedToPhoto(context, image, alpha, region, getRandomizedStackOverlayTransform(filter, effect));
    return;
  }

  drawRegionFrameOverlay(context, image, alpha, region);
}

function drawOverlayList(context, images, effect, blendMode) {
  if (!images?.length) {
    return;
  }

  const value = Number(effect.value ?? effect.params?.v ?? 10);
  const alpha = Number.isFinite(value) ? Math.min(1, Math.max(0, value / 10)) : 1;
  const image = pickOverlayImage(images, stableOverlayIndex(effect.raw, images.length));
  if (effect.params?.replace === "1") {
    drawReplaceBlendOverlay(context, image, alpha);
    return;
  }
  const filter = state.filterMap.get(lookSelect.value);
  drawOverlay(context, image, alpha, blendMode, {
    fit: isSourceAspectBlendCamera(filter) && String(effect.params?.fillmode ?? "").toLowerCase() === "fill" ? "cover" : "stretch",
    tiled: effect.params?.fillmode === "tiled",
    transform: getRandomizedStackOverlayTransform(filter, effect),
  });
}

function drawReplaceBlendOverlay(context, image, alpha) {
  if (!image || alpha <= 0) {
    return;
  }

  context.save();
  context.globalAlpha = alpha;
  context.globalCompositeOperation = "destination-over";
  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
  context.restore();
}

function parseFrameRegion(regionValue) {
  const values = String(regionValue ?? "")
    .split("|")
    .map((value) => Number(value));
  if (values.length !== 6 || values.some((value) => !Number.isFinite(value) || value < 0)) {
    return null;
  }

  const [sourceWidth, left, top, sourceHeight, right, bottom] = values;
  if (!sourceWidth || !sourceHeight || left + right >= sourceWidth || top + bottom >= sourceHeight) {
    return null;
  }

  return {
    left: left / sourceWidth,
    top: top / sourceHeight,
    width: (sourceWidth - left - right) / sourceWidth,
    height: (sourceHeight - top - bottom) / sourceHeight,
  };
}

function drawRegionFrameOverlay(context, image, alpha, region) {
  if (!image || alpha <= 0) {
    return;
  }

  const width = context.canvas.width;
  const height = context.canvas.height;
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceContext = sourceCanvas.getContext("2d");
  if (!sourceContext) {
    return;
  }

  sourceContext.drawImage(context.canvas, 0, 0);
  context.clearRect(0, 0, width, height);

  const target = {
    x: region.left * width,
    y: region.top * height,
    width: region.width * width,
    height: region.height * height,
  };
  drawImageCover(context, sourceCanvas, target.x, target.y, target.width, target.height);

  context.save();
  context.globalAlpha = alpha;
  context.globalCompositeOperation = "source-over";
  context.drawImage(image, 0, 0, width, height);
  context.restore();
}

function drawFrameCroppedToPhoto(context, image, alpha, region, transform = null) {
  const frameWidth = image.naturalWidth || image.width;
  const frameHeight = image.naturalHeight || image.height;
  const canvasWidth = context.canvas.width;
  const canvasHeight = context.canvas.height;
  if (!frameWidth || !frameHeight || !canvasWidth || !canvasHeight || alpha <= 0) {
    return;
  }

  const regionWidth = region.width * frameWidth;
  const regionHeight = region.height * frameHeight;
  if (regionWidth <= 0 || regionHeight <= 0) {
    return;
  }

  const scale = Math.max(canvasWidth / regionWidth, canvasHeight / regionHeight);
  const scaledRegionWidth = regionWidth * scale;
  const scaledRegionHeight = regionHeight * scale;
  const drawX = (canvasWidth - scaledRegionWidth) / 2 - region.left * frameWidth * scale;
  const drawY = (canvasHeight - scaledRegionHeight) / 2 - region.top * frameHeight * scale;

  context.save();
  context.globalAlpha = alpha;
  context.globalCompositeOperation = "source-over";
  drawPossiblyTransformedImage(context, image, drawX, drawY, frameWidth * scale, frameHeight * scale, transform);
  context.restore();
}

function drawImageContain(context, image, x, y, width, height) {
  const sourceWidth = image.videoWidth || image.naturalWidth || image.width;
  const sourceHeight = image.videoHeight || image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight || width <= 0 || height <= 0) {
    return;
  }

  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawImageCover(context, image, x, y, width, height, cropFactor = 1) {
  const sourceWidth = image.videoWidth || image.naturalWidth || image.width;
  const sourceHeight = image.videoHeight || image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight || width <= 0 || height <= 0) {
    return;
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let cropX = 0;
  let cropY = 0;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
    cropX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = sourceWidth / targetRatio;
    cropY = (sourceHeight - cropHeight) / 2;
  }

  const safeCropFactor = Math.max(1, Number(cropFactor) || 1);
  if (safeCropFactor > 1) {
    const zoomedWidth = cropWidth / safeCropFactor;
    const zoomedHeight = cropHeight / safeCropFactor;
    cropX += (cropWidth - zoomedWidth) / 2;
    cropY += (cropHeight - zoomedHeight) / 2;
    cropWidth = zoomedWidth;
    cropHeight = zoomedHeight;
  }

  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
}

function pickOverlayImage(images, index = 0) {
  if (!images?.length) {
    return null;
  }
  return images[Math.abs(index) % images.length];
}

function stableOverlayIndex(value, length) {
  if (!length) {
    return 0;
  }
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) % length;
}

function blendModeFromCameraEffect(effect) {
  const mode = String(effect.params?.mode ?? "normal").toLowerCase();
  if (mode === "multiply") {
    return "multiply";
  }
  if (mode === "screen") {
    return "screen";
  }
  return "source-over";
}

function createCompositeCanvas(rgba, width = canvas.width, height = canvas.height) {
  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = width;
  compositeCanvas.height = height;
  const context = compositeCanvas.getContext("2d");
  const imageData = context.createImageData(width, height);
  imageData.data.set(rgba);
  context.putImageData(imageData, 0, 0);
  return compositeCanvas;
}

function drawOverlay(context, image, alpha, blendMode, options = {}) {
  if (!image || alpha <= 0) {
    return;
  }

  context.save();
  context.globalAlpha = alpha;
  context.globalCompositeOperation = blendMode;
  if (options.flipXY) {
    context.translate(context.canvas.width, context.canvas.height);
    context.scale(-1, -1);
  }
  if (options.tiled) {
    const pattern = context.createPattern(image, "repeat");
    if (pattern) {
      context.fillStyle = pattern;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
  } else if (options.fit === "cover") {
    if (options.transform) {
      drawTransformedCover(context, image, options.transform);
    } else {
      drawImageCover(context, image, 0, 0, context.canvas.width, context.canvas.height);
    }
  } else {
    drawPossiblyTransformedImage(context, image, 0, 0, context.canvas.width, context.canvas.height, options.transform);
  }
  context.restore();
}

function getRandomizedStackOverlayTransform(filter, effect) {
  if (!filter || !isFrameCroppedToPhotoCamera(filter)) {
    return null;
  }
  const seed = stableOverlayIndex(`${state.overlaySelections.stackTransform}|${effect?.raw ?? ""}|${effect?.type ?? ""}`, 1024);
  return {
    rotation: [90, 180, 270][seed % 3],
    flipX: Math.floor(seed / 3) % 2 === 1,
    flipY: Math.floor(seed / 6) % 2 === 1,
  };
}

function drawPossiblyTransformedImage(context, image, x, y, width, height, transform) {
  if (!transform) {
    context.drawImage(image, x, y, width, height);
    return;
  }

  context.save();
  context.translate(x + width / 2, y + height / 2);
  context.rotate((transform.rotation * Math.PI) / 180);
  context.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

function drawTransformedCover(context, image, transform) {
  const offscreen = document.createElement("canvas");
  offscreen.width = context.canvas.width;
  offscreen.height = context.canvas.height;
  const offscreenContext = offscreen.getContext("2d");
  if (!offscreenContext) {
    drawImageCover(context, image, 0, 0, context.canvas.width, context.canvas.height);
    return;
  }

  drawImageCover(offscreenContext, image, 0, 0, offscreen.width, offscreen.height);
  drawPossiblyTransformedImage(context, offscreen, 0, 0, context.canvas.width, context.canvas.height, transform);
}

function renderBlit(texture) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(state.programs.blit);
  gl.bindVertexArray(state.geometry.vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(state.uniforms.blit.image, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function resetControls() {
  if (!state.source) {
    return;
  }

  intensitySlider.value = defaults.intensity;
  applyFilterEffectDefaults(lookSelect.value);
  state.importedEffects.spektraGrain.enabled = SPEKTRA_GRAIN_EFFECT.defaultEnabled;
  state.importedEffects.spektraGrain.preset = SPEKTRA_GRAIN_EFFECT.defaultPreset;
  state.importedEffects.spektraGrain.mode = SPEKTRA_GRAIN_EFFECT.defaultMode;
  syncIntensityControlState();
  updateEffectControlState();
  syncEffectInputs();
  syncImportedEffectInputs();
  setEditsVisibility(true);
  renderImageAfterSettingsChange();
}

function applyFilterEffectDefaults(filename) {
  state.effects = cloneEffectDefaults();
  const filterDefaults = state.filterEffectDefaults.get(filename);

  if (filterDefaults) {
    for (const [effectId, value] of Object.entries(filterDefaults)) {
      const effect = getEffectById(effectId);
      if (!effect || !state.effects[effectId]) {
        continue;
      }

      state.effects[effectId].value = value;
      state.effects[effectId].enabled = value !== effect.defaultValue;
    }
  }

  state.effects.nomoGrain.value = DEFAULT_NOMO_GRAIN_VALUE;
  state.effects.nomoGrain.enabled = DEFAULT_NOMO_GRAIN_VALUE !== getEffectById("nomoGrain").defaultValue;

  rerollOverlaySelections();
}

function downloadImage() {
  if (!state.source || state.showingOriginal) {
    return;
  }

  renderImage({ includeSpektraGrain: true });
  const selected = state.filterMap.get(lookSelect.value);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/jpeg", JPEG_EXPORT_QUALITY);
  link.download = `${state.sourceName}-${selected?.filename ?? "nomo"}.jpg`;
  link.click();
}

function setEditsVisibility(showEdits) {
  state.showingOriginal = !showEdits;
  toggleEditsButton.setAttribute("aria-pressed", String(state.showingOriginal));
  toggleEditsButton.textContent = state.showingOriginal ? "Show filter" : "Show original";
}

function toggleEditsVisibility() {
  if (!state.source) {
    return;
  }

  setEditsVisibility(state.showingOriginal);
  renderImage();
}

function renderImageAfterSettingsChange() {
  window.clearTimeout(state.spektraRenderTimer);
  renderImage({ includeSpektraGrain: false });

  if (!state.importedEffects.spektraGrain.enabled || state.cameraActive) {
    return;
  }

  state.spektraRenderTimer = window.setTimeout(() => {
    ensureSpektraProfileLoaded()
      .then(() => renderImage({ includeSpektraGrain: true }))
      .catch((error) => console.error(error));
  }, 650);
}

function resetCanvasView() {
  state.canvasView.zoom = 1;
  state.canvasView.panX = 0;
  state.canvasView.panY = 0;
  state.canvasView.isPanning = false;
  updateCanvasViewTransform();
}

function updateCanvasViewTransform() {
  const { zoom, panX, panY, isPanning } = state.canvasView;
  canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  canvas.classList.toggle("is-zoomed", zoom > 1.01);
  canvas.classList.toggle("is-panning", isPanning);
}

function handleWorkspaceWheel(event) {
  if (isMobileView() || !state.source || canvas.style.display === "none") {
    return;
  }

  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  const nextZoom = Math.min(6, Math.max(1, state.canvasView.zoom * (direction > 0 ? 1.12 : 0.88)));

  if (nextZoom <= 1.01) {
    state.canvasView.zoom = 1;
    state.canvasView.panX = 0;
    state.canvasView.panY = 0;
  } else {
    state.canvasView.zoom = nextZoom;
  }

  updateCanvasViewTransform();
}

function startCanvasPan(event) {
  if (isMobileView() || event.button !== 0 || state.canvasView.zoom <= 1.01) {
    return;
  }

  event.preventDefault();
  state.canvasView.isPanning = true;
  state.canvasView.lastX = event.clientX;
  state.canvasView.lastY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
  updateCanvasViewTransform();
}

function moveCanvasPan(event) {
  if (!state.canvasView.isPanning) {
    return;
  }

  event.preventDefault();
  state.canvasView.panX += event.clientX - state.canvasView.lastX;
  state.canvasView.panY += event.clientY - state.canvasView.lastY;
  state.canvasView.lastX = event.clientX;
  state.canvasView.lastY = event.clientY;
  updateCanvasViewTransform();
}

function stopCanvasPan(event) {
  if (!state.canvasView.isPanning) {
    return;
  }

  state.canvasView.isPanning = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  updateCanvasViewTransform();
}

function handleCameraSwipeStart(event) {
  if (!beginCameraSwipe(event.clientX, event.clientY, event.pointerId, event.target, event.currentTarget)) {
    return;
  }
}

function handleCameraSwipeMove(event) {
  moveCameraSwipe(event.clientX, event.clientY, event.pointerId, event);
}

function handleCameraSwipeEnd(event) {
  endCameraSwipe(event.pointerId, event.currentTarget);
}

function isCameraSwipeBlockedTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest(".camera-list-drawer")) {
    return false;
  }
  if (target.closest(".favorite-camera-drawer")) {
    return false;
  }
  return Boolean(target.closest("button, select, input, label"));
}

function setCameraGalleryPeek(enabled) {
  document.body.classList.toggle("camera-gallery-peek", enabled);
}

function setCameraGalleryDeferred(enabled) {
  document.body.classList.toggle("camera-gallery-deferred", enabled);
}

function enterWarmGalleryMode(options = {}, reason = "camera-gallery-open", startedAt = 0) {
  if (!state.cameraActive) {
    return false;
  }

  clearCameraGalleryStopTimer();
  const alreadyDeferred = state.cameraGalleryDeferred;
  const shouldCountWarmOpen = !alreadyDeferred || options.countWarmOpen === true;
  state.cameraGalleryDeferred = true;
  if (shouldCountWarmOpen) {
    state.debug.warmGalleryOpenCount += 1;
    state.debug.lastWarmGalleryOpenMs = Math.round(startedAt ? performance.now() - startedAt : CAMERA_GALLERY_TRANSITION_MS);
  }
  setCameraGalleryPeek(true);
  setCameraGalleryDeferred(true);
  mobileGallery.style.transition = "";
  mobileGallery.style.transform = "";
  updateMobileCameraState();
  debugEvent(alreadyDeferred ? "camera-gallery-transition:warm-extend" : "camera-gallery-transition:warm-start", {
    reason,
    keepWarmMs: CAMERA_GALLERY_KEEP_WARM_MS,
    counted: shouldCountWarmOpen,
    openMs: shouldCountWarmOpen ? state.debug.lastWarmGalleryOpenMs : null,
    nativeActive: state.nativeCameraActive,
    nativeReady: state.nativeCameraReady,
  });

  state.cameraGalleryStopTimer = window.setTimeout(() => {
    state.cameraGalleryStopTimer = 0;
    if (!state.cameraActive || !state.cameraGalleryDeferred || state.cameraCaptureInProgress) {
      return;
    }
    state.cameraGalleryDeferred = false;
    state.cameraGalleryOpenStartedAt = 0;
    setCameraGalleryDeferred(false);
    debugEvent("camera-gallery-transition:warm-stop", {
      reason,
      nativeActive: state.nativeCameraActive,
      nativeReady: state.nativeCameraReady,
    });
    stopCamera({ ...options, force: true, skipGalleryLoad: true });
  }, CAMERA_GALLERY_KEEP_WARM_MS);
  return true;
}

function returnFromWarmGallery(reason = "gallery-camera-open") {
  if (!state.cameraActive || !state.cameraGalleryDeferred) {
    return false;
  }

  clearCameraGalleryTransitionTimer();
  clearCameraGalleryStopTimer();
  state.pendingCameraStopOptions = null;
  mobileGallery.style.transition = "";
  mobileGallery.style.transform = "";
  const startedAt = performance.now();
  state.cameraGalleryTransitioning = true;
  state.cameraGalleryOpenStartedAt = startedAt;
  const transitionToken = state.cameraGalleryTransitionToken;
  workspace.style.transition = `transform ${CAMERA_GALLERY_TRANSITION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
  workspace.style.transform = "translate3d(0, 0, 0)";
  animateNativePreviewOffsetTo(0, CAMERA_GALLERY_TRANSITION_MS);
  debugEvent("gallery-camera-transition:warm-start", {
    reason,
    nativeActive: state.nativeCameraActive,
    nativeReady: state.nativeCameraReady,
  });

  window.setTimeout(() => {
    if (transitionToken !== state.cameraGalleryTransitionToken) {
      return;
    }
    workspace.style.transition = "";
    workspace.style.transform = "";
    mobileGallery.style.transition = "";
    mobileGallery.style.transform = "";
    state.cameraGalleryTransitioning = false;
    state.cameraGalleryDeferred = false;
    state.cameraGalleryOpenStartedAt = 0;
    setCameraGalleryPeek(false);
    setCameraGalleryDeferred(false);
    updateMobileCameraState();
    state.debug.warmGalleryReturnCount += 1;
    state.debug.lastWarmGalleryReturnMs = Math.round(performance.now() - startedAt);
    debugEvent("gallery-camera-transition:warm-end", {
      reason,
      ms: Math.round(performance.now() - startedAt),
      nativeActive: state.nativeCameraActive,
      nativeReady: state.nativeCameraReady,
    });
  }, CAMERA_GALLERY_TRANSITION_MS);
  return true;
}

function warmGalleryForOpening(reason = "camera-gallery-open") {
  if (state.galleryLoaded) {
    if (state.galleryDirty || !state.galleryRenderedCount) {
      renderGalleryWhenTransitionSafe(`${reason}:warm`);
    } else {
      const items = getGalleryVisibleItems();
      preloadGalleryWindowThumbnails(items, getGalleryRenderWindow(items));
    }
    return Promise.resolve(state.galleryItems);
  }

  return loadGalleryOnDemand({ render: true, reason: `${reason}:warm-load` })
    .then((items) => {
      debugEvent("gallery:warm-for-open", {
        reason,
        items: items.length,
        rendered: state.galleryRenderedCount,
      });
      return items;
    })
    .catch((error) => {
      console.error(error);
      debugEvent("gallery:warm-for-open-error", { reason, message: error?.message ?? String(error) });
      return state.galleryItems;
    });
}

function primeGalleryDuringCapture(reason = "capture") {
  if (state.galleryLoaded) {
    scheduleGalleryHiddenRender(reason);
    preloadGalleryThumbnailImages(state.galleryItems, Math.min(GALLERY_THUMBNAIL_PRELOAD_MAX, GALLERY_RENDER_BATCH_SIZE));
    debugEvent("gallery:prime-during-capture", {
      reason,
      items: state.galleryItems.length,
      nativeTotal: state.nativeGalleryTotal,
      loaded: true,
    });
    return;
  }
  if (state.galleryLoadPromise) {
    state.galleryLoadPromise
      .then((items) => {
        scheduleGalleryHiddenRender(reason);
        preloadGalleryThumbnailImages(items, Math.min(GALLERY_THUMBNAIL_PRELOAD_MAX, GALLERY_RENDER_BATCH_SIZE));
      })
      .catch((error) => {
        console.error(error);
        debugEvent("gallery:prime-during-capture-error", { reason, message: error?.message ?? String(error) });
      });
    return;
  }
  loadGalleryOnDemand({ render: false })
    .then((items) => {
      scheduleGalleryHiddenRender(reason);
      preloadGalleryThumbnailImages(items, Math.min(GALLERY_THUMBNAIL_PRELOAD_MAX, GALLERY_RENDER_BATCH_SIZE));
      debugEvent("gallery:prime-during-capture", {
        reason,
        items: items.length,
        nativeTotal: state.nativeGalleryTotal,
      });
    })
    .catch((error) => {
      console.error(error);
      debugEvent("gallery:prime-during-capture-error", { reason, message: error?.message ?? String(error) });
    });
}

function scheduleGalleryWarmAfterTransitionStart(reason, transitionToken) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (transitionToken !== state.cameraGalleryTransitionToken || !state.cameraGalleryTransitioning) {
        return;
      }
      warmGalleryForOpening(reason);
    });
  });
}

function openGalleryFromCamera(options = {}) {
  if (!isMobileView()) {
    stopCamera(options);
    return;
  }

  const reason = options.reason ?? "camera-gallery-open";
  const transitionStartedAt = performance.now();
  state.cameraGalleryOpenStartedAt = transitionStartedAt;
  debugEvent("camera-gallery-transition:start", {
    reason,
    captureInProgress: state.cameraCaptureInProgress,
    gifCaptureInProgress: state.gifCaptureInProgress,
    videoCaptureInProgress: state.videoCaptureInProgress,
    galleryLoaded: state.galleryLoaded,
    rendered: state.galleryRenderedCount,
  });

  if ((state.gifCaptureInProgress || state.videoCaptureInProgress) && !options.force) {
    debugEvent("camera-gallery-transition:blocked", {
      reason,
      blockedBy: state.videoCaptureInProgress ? "video-capture" : "gif-capture",
    });
    setStatus(state.videoCaptureInProgress ? "Recording video. Release shutter to stop." : "Recording GIF. Wait for it to finish.");
    return false;
  }

  if (state.cameraCaptureInProgress && !options.force) {
    primeGalleryDuringCapture(reason);
    state.pendingCameraStopOptions = {
      deferredGallery: true,
      skipGalleryLoad: true,
      reason,
    };
    debugEvent("camera-gallery-transition:pending-capture", {
      reason,
      deferred: true,
    });
    setStatus("Finishing capture before opening gallery.");
    if (!state.cameraGalleryTransitioning && !state.cameraGalleryDeferred && state.cameraActive) {
      clearCameraGalleryTransitionTimer();
      state.cameraGalleryTransitioning = true;
      state.cameraGalleryDeferred = true;
      setCameraListOpen(false);
      setFavoriteCameraDrawerOpen(false);
      setCameraGalleryPeek(true);
      setCameraGalleryDeferred(true);
      workspace.style.transition = `transform ${CAMERA_GALLERY_TRANSITION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
      workspace.style.transform = "translate3d(0, -100svh, 0)";
      animateNativePreviewOffsetTo(-window.innerHeight, CAMERA_GALLERY_TRANSITION_MS);

      const transitionToken = state.cameraGalleryTransitionToken;
      scheduleGalleryWarmAfterTransitionStart(reason, transitionToken);
      state.cameraGalleryTransitionTimer = window.setTimeout(() => {
        if (transitionToken !== state.cameraGalleryTransitionToken) {
          return;
        }
        state.cameraGalleryTransitionTimer = 0;
        state.cameraGalleryTransitioning = false;
        workspace.style.transition = "";
        debugEvent("camera-gallery-transition:deferred-visible", {
          reason,
          ms: Math.round(performance.now() - transitionStartedAt),
          galleryLoaded: state.galleryLoaded,
          rendered: state.galleryRenderedCount,
        });
      }, CAMERA_GALLERY_TRANSITION_MS);
    }
    updateMobileCameraState();
    return;
  }

  if ((!state.cameraActive && !state.cameraStarting) || state.cameraGalleryTransitioning) {
    state.mobileSettingsOpen = false;
    updateMobileCameraState();
    return;
  }

  clearCameraGalleryTransitionTimer();
  state.cameraGalleryTransitioning = true;
  setCameraListOpen(false);
  setFavoriteCameraDrawerOpen(false);
  setCameraGalleryPeek(true);
  workspace.style.transition = `transform ${CAMERA_GALLERY_TRANSITION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
  workspace.style.transform = "translate3d(0, -100svh, 0)";
  animateNativePreviewOffsetTo(-window.innerHeight, CAMERA_GALLERY_TRANSITION_MS);

  const transitionToken = state.cameraGalleryTransitionToken;
  scheduleGalleryWarmAfterTransitionStart(reason, transitionToken);
  state.cameraGalleryTransitionTimer = window.setTimeout(() => {
    if (transitionToken !== state.cameraGalleryTransitionToken) {
      return;
    }
    state.cameraGalleryTransitionTimer = 0;
    state.cameraGalleryTransitioning = false;
    workspace.style.transition = "";
    debugEvent("camera-gallery-transition:end", {
      reason,
      ms: Math.round(performance.now() - transitionStartedAt),
      galleryLoaded: state.galleryLoaded,
      rendered: state.galleryRenderedCount,
    });
    if (!enterWarmGalleryMode({ ...options, force: true, skipGalleryLoad: true }, reason, transitionStartedAt)) {
      workspace.style.transform = "";
      setCameraGalleryPeek(false);
      stopCamera({ ...options, force: true, skipGalleryLoad: true });
    }
  }, CAMERA_GALLERY_TRANSITION_MS);
}

function openCameraFromGallery(options = {}) {
  if (!isMobileView()) {
    startCamera().catch((error) => console.error(error));
    return;
  }
  const reason = options.reason ?? "gallery-camera-open";
  if (returnFromWarmGallery(reason)) {
    return;
  }
  const returnStartedAt = options.startedAt || performance.now();
  const returnToken = options.returnToken || state.galleryCameraReturnToken;
  if (state.cameraActive || state.cameraStarting) {
    if (document.body.classList.contains("gallery-camera-returning")) {
      scheduleGalleryCameraReturnFinish(returnToken, reason, returnStartedAt);
    }
    return;
  }

  clearGalleryCameraReturnTimer();
  state.galleryCameraReturnWaitingLogged = false;
  state.galleryCameraReturnRevealStarted = false;
  state.galleryCameraReturnRevealAt = 0;
  debugEvent("gallery-camera-transition:start", {
    reason,
    galleryLoaded: state.galleryLoaded,
    rendered: state.galleryRenderedCount,
  });
  state.mobileSettingsOpen = false;
  document.body.classList.add("gallery-camera-returning");
  mobileGallery.style.transition = "";
  mobileGallery.style.transform = "translate3d(0, 0, 0)";
  const nextReturnToken = state.galleryCameraReturnToken;
  startCamera({ automatic: options.automatic, preserveGalleryTransition: true }).catch((error) => {
    console.error(error);
    setStatus("Unable to open the camera.");
    finishGalleryCameraReturn(nextReturnToken, reason, returnStartedAt);
  });

  scheduleGalleryCameraReturnFinish(nextReturnToken, reason, returnStartedAt);
}

function prepareCameraReturnFromGallery(reason = "gallery-swipe-prewarm") {
  if (!isMobileView() || state.gallerySwipe.prewarmStarted || state.cameraActive || state.cameraStarting) {
    return;
  }
  state.gallerySwipe.prewarmStarted = true;
  state.gallerySwipe.prewarmReason = reason;
  clearGalleryCameraReturnTimer();
  const returnStartedAt = performance.now();
  state.gallerySwipe.prewarmStartedAt = returnStartedAt;
  state.galleryCameraReturnWaitingLogged = false;
  state.galleryCameraReturnRevealStarted = false;
  state.galleryCameraReturnRevealAt = 0;
  state.mobileSettingsOpen = false;
  document.body.classList.add("gallery-camera-returning");
  const returnToken = state.galleryCameraReturnToken;
  state.gallerySwipe.prewarmToken = returnToken;
  debugEvent("gallery-camera-transition:prewarm-start", {
    reason,
    distance: Math.round(state.gallerySwipe.distance),
    galleryLoaded: state.galleryLoaded,
    rendered: state.galleryRenderedCount,
  });
  startCamera({ preserveGalleryTransition: true }).catch((error) => {
    console.error(error);
    setStatus("Unable to open the camera.");
    finishGalleryCameraReturn(returnToken, reason, returnStartedAt);
  });
}

function cancelPreparedCameraReturnFromGallery(reason = "gallery-swipe-cancel") {
  if (!state.gallerySwipe.prewarmStarted) {
    mobileGallery.style.transform = "";
    return;
  }
  const returnToken = state.gallerySwipe.prewarmToken;
  const prewarmStartedAt = state.gallerySwipe.prewarmStartedAt || performance.now();
  state.gallerySwipe.prewarmStarted = false;
  state.gallerySwipe.prewarmReason = "";
  state.gallerySwipe.prewarmStartedAt = 0;
  state.gallerySwipe.prewarmToken = 0;
  clearGalleryCameraReturnTimer();
  document.body.classList.remove("gallery-camera-returning");
  mobileGallery.style.transition = "";
  mobileGallery.style.transform = "";
  debugEvent("gallery-camera-transition:prewarm-cancel", {
    reason,
    ms: Math.round(performance.now() - prewarmStartedAt),
    cameraActive: state.cameraActive,
    cameraStarting: state.cameraStarting,
  });
  if (state.cameraActive || state.cameraStarting) {
    stopCamera({ force: true, skipGalleryLoad: true });
  } else if (returnToken === state.galleryCameraReturnToken) {
    updateMobileCameraState();
  }
}

function scheduleGalleryCameraReturnFinish(token, reason, startedAt) {
  state.galleryCameraReturnTimer = window.setTimeout(() => {
    if (token !== state.galleryCameraReturnToken) {
      return;
    }
    const elapsed = performance.now() - startedAt;
    const cameraUiReady = state.cameraActive || state.cameraStarting;
    const expectsNativePreview = isNativeCameraAvailable() && !USE_WEB_FILTERED_CAMERA_PREVIEW;
    const cameraRevealReady = cameraUiReady && (!expectsNativePreview || state.nativeCameraReady);
    if (cameraUiReady && expectsNativePreview && !state.nativeCameraReady && !state.galleryCameraReturnWaitingLogged) {
      state.galleryCameraReturnWaitingLogged = true;
      debugEvent("gallery-camera-transition:waiting-native", {
        reason,
        elapsed: Math.round(elapsed),
        nativeActive: state.nativeCameraActive,
        nativeReady: state.nativeCameraReady,
      });
    }

    if (!state.galleryCameraReturnRevealStarted && (cameraRevealReady || elapsed >= GALLERY_CAMERA_RETURN_MAX_WAIT_MS)) {
      startGalleryCameraReturnReveal(token, reason, startedAt, elapsed >= GALLERY_CAMERA_RETURN_MAX_WAIT_MS);
    }

    if (state.galleryCameraReturnRevealStarted && performance.now() - state.galleryCameraReturnRevealAt >= CAMERA_GALLERY_TRANSITION_MS + 40) {
      finishGalleryCameraReturn(token, reason, startedAt);
      return;
    }
    scheduleGalleryCameraReturnFinish(token, reason, startedAt);
  }, 50);
}

function startGalleryCameraReturnReveal(token, reason, startedAt, timedOut = false) {
  if (token !== state.galleryCameraReturnToken || state.galleryCameraReturnRevealStarted) {
    return;
  }
  state.galleryCameraReturnRevealStarted = true;
  state.galleryCameraReturnRevealAt = performance.now();
  mobileGallery.style.transition = `transform ${CAMERA_GALLERY_TRANSITION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
  mobileGallery.style.transform = "translate3d(0, 0, 0)";
  window.requestAnimationFrame(() => {
    if (token !== state.galleryCameraReturnToken) {
      return;
    }
    mobileGallery.style.transform = `translate3d(0, ${Math.max(window.innerHeight, 1)}px, 0)`;
  });
  debugEvent("gallery-camera-transition:reveal-start", {
    reason,
    ms: Math.round(state.galleryCameraReturnRevealAt - startedAt),
    timedOut,
    nativeActive: state.nativeCameraActive,
    nativeReady: state.nativeCameraReady,
  });
}

function finishGalleryCameraReturn(token, reason = "gallery-camera-open", startedAt = performance.now()) {
  if (token !== state.galleryCameraReturnToken) {
    return;
  }
  if (state.galleryCameraReturnTimer) {
    window.clearTimeout(state.galleryCameraReturnTimer);
  }
  state.galleryCameraReturnTimer = 0;
  state.galleryCameraReturnRevealStarted = false;
  state.galleryCameraReturnRevealAt = 0;
  state.gallerySwipe.prewarmStarted = false;
  state.gallerySwipe.prewarmReason = "";
  state.gallerySwipe.prewarmStartedAt = 0;
  state.gallerySwipe.prewarmToken = 0;
  document.body.classList.remove("gallery-camera-returning");
  mobileGallery.style.transition = "";
  mobileGallery.style.transform = "";
  state.debug.coldGalleryReturnCount += 1;
  state.debug.lastColdGalleryReturnMs = Math.round(performance.now() - startedAt);
  debugEvent("gallery-camera-transition:end", {
    reason,
    ms: Math.round(performance.now() - startedAt),
    cameraActive: state.cameraActive,
    cameraStarting: state.cameraStarting,
    nativeActive: state.nativeCameraActive,
    nativeReady: state.nativeCameraReady,
  });
}

function setCameraListOpen(open) {
  state.cameraListOpen = Boolean(open && state.cameraActive && isMobileView());
  if (state.cameraListOpen && state.favoriteCameraDrawerOpen) {
    setFavoriteCameraDrawerOpen(false);
  }
  document.body.classList.toggle("camera-list-open", state.cameraListOpen);
  cameraListDrawer.setAttribute("aria-hidden", String(!state.cameraListOpen));
}

function setFavoriteCameraDrawerOpen(open) {
  state.favoriteCameraDrawerOpen = Boolean(open && state.cameraActive && isMobileView());
  if (state.favoriteCameraDrawerOpen && state.cameraListOpen) {
    setCameraListOpen(false);
  }
  document.body.classList.toggle("favorite-camera-drawer-open", state.favoriteCameraDrawerOpen);
  favoriteCameraDrawer?.setAttribute("aria-hidden", String(!state.favoriteCameraDrawerOpen));
  if (state.favoriteCameraDrawerOpen) {
    renderFavoriteCameraDrawer();
    loadGalleryOnDemand()
      .then(() => {
        if (state.favoriteCameraDrawerOpen) {
          renderFavoriteCameraDrawer();
        }
      })
      .catch((error) => console.error(error));
  } else {
    clearFavoriteCameraObjectUrls();
  }
}

function syncCameraListSelection() {
  const selected = state.randomCameraEnabled ? RANDOM_CAMERA_FILENAME : lookSelect.value;
  const favoritesKey = Array.from(state.favoriteCameraFilenames).sort().join("|");
  const nextKey = `${selected}::${favoritesKey}`;
  if (state.cameraListSelectionKey === nextKey) {
    syncFavoriteCameraSelection();
    return;
  }
  state.cameraListSelectionKey = nextKey;
  for (const button of cameraList.querySelectorAll(".camera-list__item")) {
    button.classList.toggle("is-selected", button.dataset.filename === selected);
  }
  for (const button of cameraList.querySelectorAll(".camera-list__favorite")) {
    const favorite = state.favoriteCameraFilenames.has(button.dataset.filename);
    button.classList.toggle("is-favorite", favorite);
    button.setAttribute("aria-pressed", String(favorite));
    button.textContent = favorite ? "★" : "☆";
  }
  syncFavoriteCameraSelection();
}

function syncFavoriteCameraSelection() {
  if (!favoriteCameraGrid) {
    return;
  }
  for (const card of favoriteCameraGrid.querySelectorAll(".favorite-camera-card")) {
    const selected = !state.randomCameraEnabled && card.dataset.filename === lookSelect.value;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-current", selected ? "true" : "false");
  }
}

function toggleFavoriteCamera(filename) {
  if (!state.filterMap.has(filename)) {
    return;
  }

  if (state.favoriteCameraFilenames.has(filename)) {
    state.favoriteCameraFilenames.delete(filename);
  } else {
    state.favoriteCameraFilenames.add(filename);
  }
  writeStoredFavoriteCameras();
  populateCameraDrawerList(state.filters);
  syncCameraListSelection();
  renderFavoriteCameraDrawer();
}

function clearFavoriteCameraObjectUrls() {
  for (const url of state.favoriteCameraObjectUrls) {
    URL.revokeObjectURL(url);
  }
  state.favoriteCameraObjectUrls = [];
}

function findLatestGalleryItemForCamera(filter) {
  if (!filter) {
    return null;
  }

  return state.galleryItems.find((item) => {
    if (item.cameraName === filter.name) {
      return true;
    }
    const filename = String(item.filename ?? "");
    return Boolean(filter.filename && filename.includes(filter.filename));
  }) ?? null;
}

function getFavoriteCameraThumbnailUrl(item) {
  if (!item) {
    return "";
  }
  if (item.thumbnailFileUrl) {
    return getGalleryFileUrl(item.thumbnailFileUrl, item.cacheBust);
  }
  if (item.thumbnailBlob) {
    const url = URL.createObjectURL(item.thumbnailBlob);
    state.favoriteCameraObjectUrls.push(url);
    return url;
  }
  if (item.fileUrl) {
    return getGalleryFileUrl(item.fileUrl, item.cacheBust);
  }
  if (item.blob) {
    const url = URL.createObjectURL(item.blob);
    state.favoriteCameraObjectUrls.push(url);
    return url;
  }
  return "";
}

function renderFavoriteCameraDrawer() {
  if (!favoriteCameraGrid) {
    return;
  }

  clearFavoriteCameraObjectUrls();
  favoriteCameraGrid.innerHTML = "";
  const favoriteFilters = state.filters.filter((filter) => state.favoriteCameraFilenames.has(filter.filename));

  if (!favoriteFilters.length) {
    const empty = document.createElement("p");
    empty.className = "favorite-camera-grid__empty";
    empty.textContent = "Star cameras in the camera list.";
    favoriteCameraGrid.append(empty);
    return;
  }

  for (const filter of favoriteFilters) {
    const item = findLatestGalleryItemForCamera(filter);
    const thumbnailUrl = getFavoriteCameraThumbnailUrl(item);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `favorite-camera-card${thumbnailUrl ? "" : " favorite-camera-card--empty"}`;
    card.dataset.filename = filter.filename;
    const selected = !state.randomCameraEnabled && lookSelect.value === filter.filename;
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-current", selected ? "true" : "false");
    card.addEventListener("click", () => {
      if (state.cameraSwipe.suppressNextListClick) {
        state.cameraSwipe.suppressNextListClick = false;
        return;
      }
      handleFilterSelection(filter.filename);
      setFavoriteCameraDrawerOpen(false);
    });

    if (thumbnailUrl) {
      const image = document.createElement("img");
      image.alt = "";
      image.loading = "lazy";
      image.src = thumbnailUrl;
      card.append(image);
    }

    const name = document.createElement("span");
    name.textContent = filter.name;
    card.append(name);
    favoriteCameraGrid.append(card);
  }
}

function beginCameraSwipe(clientX, clientY, pointerId, target, captureTarget) {
  if (state.cameraSwipe.active || !state.cameraActive || !isMobileView() || isCameraSwipeBlockedTarget(target)) {
    return false;
  }

  state.cameraSwipe.active = true;
  state.cameraSwipe.pointerId = pointerId;
  state.cameraSwipe.startX = clientX;
  state.cameraSwipe.startY = clientY;
  state.cameraSwipe.axis = null;
  state.cameraSwipe.distance = 0;
  state.cameraSwipe.startedInCameraList = target instanceof Element && Boolean(target.closest(".camera-list-drawer"));
  state.cameraSwipe.startedInFavoriteDrawer = target instanceof Element && Boolean(target.closest(".favorite-camera-drawer"));
  state.cameraSwipe.horizontalDirection = null;
  workspace.style.transition = "none";
  cancelNativePreviewOffsetAnimation();

  if (
    !state.cameraSwipe.startedInCameraList
    && !state.cameraSwipe.startedInFavoriteDrawer
    && captureTarget?.setPointerCapture
    && typeof pointerId === "number"
  ) {
    captureTarget.setPointerCapture(pointerId);
  }

  return true;
}

function moveCameraSwipe(clientX, clientY, pointerId, event) {
  if (!state.cameraSwipe.active || pointerId !== state.cameraSwipe.pointerId) {
    return;
  }

  const deltaX = clientX - state.cameraSwipe.startX;
  const deltaY = clientY - state.cameraSwipe.startY;

  if (!state.cameraSwipe.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 10) {
    state.cameraSwipe.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.2 ? "horizontal" : "vertical";
    if (state.cameraSwipe.axis === "horizontal") {
      state.cameraSwipe.horizontalDirection = deltaX < 0 ? "left" : "right";
    }
    if (state.cameraSwipe.axis === "vertical" && (state.cameraListOpen || state.favoriteCameraDrawerOpen)) {
      cancelCameraSwipe(pointerId, event.currentTarget);
      return;
    }
    if (state.cameraSwipe.axis === "vertical") {
      setCameraGalleryPeek(true);
    }
  }

  if (state.cameraSwipe.axis === "horizontal") {
    const direction = state.cameraSwipe.horizontalDirection ?? (deltaX < 0 ? "left" : "right");
    let distance = 0;
    if (state.cameraListOpen) {
      distance = Math.max(0, -deltaX);
    } else if (state.favoriteCameraDrawerOpen) {
      distance = Math.max(0, deltaX);
    } else {
      distance = direction === "left" ? Math.max(0, -deltaX) : Math.max(0, deltaX);
    }
    state.cameraSwipe.distance = distance;
    if (distance > 8) {
      event.preventDefault();
    }
    return;
  }

  if (state.cameraSwipe.axis !== "vertical") {
    return;
  }

  const distance = Math.max(0, -deltaY);
  state.cameraSwipe.distance = distance;
  if (distance > 8) {
    event.preventDefault();
  }

  const eased = Math.min(window.innerHeight, distance * 0.92);
  workspace.style.transform = `translate3d(0, ${-eased}px, 0)`;
  scheduleNativePreviewOffsetUpdate(-eased);
}

function cancelCameraSwipe(pointerId, captureTarget) {
  state.cameraSwipe.active = false;
  state.cameraSwipe.pointerId = null;
  state.cameraSwipe.axis = null;
  state.cameraSwipe.distance = 0;
  state.cameraSwipe.startedInCameraList = false;
  state.cameraSwipe.startedInFavoriteDrawer = false;
  state.cameraSwipe.horizontalDirection = null;
  workspace.style.transition = "";
  workspace.style.transform = "";
  setCameraGalleryPeek(false);
  animateNativePreviewOffsetTo(0, 180);
  scheduleNativePreviewRectUpdate();
  if (captureTarget?.hasPointerCapture?.(pointerId)) {
    captureTarget.releasePointerCapture(pointerId);
  }
}

function endCameraSwipe(pointerId, captureTarget) {
  if (!state.cameraSwipe.active || pointerId !== state.cameraSwipe.pointerId) {
    return;
  }

  const axis = state.cameraSwipe.axis;
  const horizontalDirection = state.cameraSwipe.horizontalDirection;
  const horizontalThreshold = Math.min(90, window.innerWidth * 0.22);
  const gesturesAllowed = !state.gifCaptureInProgress && !state.videoCaptureInProgress;
  const shouldOpenCameraList = axis === "horizontal"
    && gesturesAllowed
    && horizontalDirection === "right"
    && !state.cameraListOpen
    && !state.favoriteCameraDrawerOpen
    && state.cameraSwipe.distance > horizontalThreshold;
  const shouldOpenFavoriteDrawer = axis === "horizontal"
    && gesturesAllowed
    && horizontalDirection === "left"
    && !state.cameraListOpen
    && !state.favoriteCameraDrawerOpen
    && state.cameraSwipe.distance > horizontalThreshold;
  const shouldCloseCameraList = axis === "horizontal" && gesturesAllowed && state.cameraListOpen && state.cameraSwipe.distance > horizontalThreshold;
  const shouldCloseFavoriteDrawer = axis === "horizontal" && gesturesAllowed && state.favoriteCameraDrawerOpen && state.cameraSwipe.distance > horizontalThreshold;
  const shouldOpenGallery = axis === "vertical"
    && gesturesAllowed
    && !state.cameraListOpen
    && !state.favoriteCameraDrawerOpen
    && state.cameraSwipe.distance > Math.min(140, window.innerHeight * 0.18);
  state.cameraSwipe.active = false;
  state.cameraSwipe.pointerId = null;
  state.cameraSwipe.axis = null;
  state.cameraSwipe.startedInCameraList = false;
  state.cameraSwipe.startedInFavoriteDrawer = false;
  state.cameraSwipe.horizontalDirection = null;
  if (captureTarget?.hasPointerCapture?.(pointerId)) {
    captureTarget.releasePointerCapture(pointerId);
  }
  workspace.style.transition = "transform 220ms ease";

  if (shouldOpenCameraList || shouldCloseCameraList || shouldOpenFavoriteDrawer || shouldCloseFavoriteDrawer) {
    state.cameraSwipe.suppressNextListClick = (shouldCloseCameraList || shouldCloseFavoriteDrawer) && state.cameraSwipe.distance > 8;
    setCameraListOpen(shouldOpenCameraList);
    setFavoriteCameraDrawerOpen(shouldOpenFavoriteDrawer);
    workspace.style.transition = "";
    workspace.style.transform = "";
    setCameraGalleryPeek(false);
    animateNativePreviewOffsetTo(0, 160);
    scheduleNativePreviewRectUpdate();
    return;
  }

  if (shouldOpenGallery) {
    openGalleryFromCamera({ reason: "camera-swipe" });
    return;
  }

  workspace.style.transform = "";
  animateNativePreviewOffsetTo(0, 220);
  window.setTimeout(() => {
    workspace.style.transition = "";
    setCameraGalleryPeek(false);
    scheduleNativePreviewRectUpdate();
  }, 220);
}

function firstTouch(event) {
  return event.changedTouches[0] ?? event.touches[0] ?? null;
}

function findSwipeTouch(event) {
  for (const touch of event.changedTouches) {
    if (touch.identifier === state.cameraSwipe.pointerId) {
      return touch;
    }
  }
  return null;
}

function handleCameraSwipeTouchStart(event) {
  const touch = firstTouch(event);
  if (!touch) {
    return;
  }
  beginCameraSwipe(touch.clientX, touch.clientY, touch.identifier, event.target, null);
}

function handleCameraSwipeTouchMove(event) {
  const touch = findSwipeTouch(event);
  if (!touch) {
    return;
  }
  moveCameraSwipe(touch.clientX, touch.clientY, touch.identifier, event);
}

function handleCameraSwipeTouchEnd(event) {
  const touch = findSwipeTouch(event);
  if (!touch) {
    return;
  }
  endCameraSwipe(touch.identifier, null);
}

function handleGallerySwipeStart(event) {
  if (
    !isMobileView()
    || (state.cameraActive && !state.cameraGalleryDeferred)
    || mobileGallery.scrollTop > 0
    || window.scrollY > 0
    || state.gallerySwipe.active
  ) {
    return;
  }
  const touch = firstTouch(event);
  if (!touch) {
    return;
  }
  state.gallerySwipe.active = true;
  state.gallerySwipe.pointerId = touch.identifier;
  state.gallerySwipe.startY = touch.clientY;
  state.gallerySwipe.startScrollTop = mobileGallery.scrollTop;
  state.gallerySwipe.distance = 0;
  state.gallerySwipe.prewarmStarted = false;
  state.gallerySwipe.prewarmReason = "";
  state.gallerySwipe.prewarmStartedAt = 0;
  state.gallerySwipe.prewarmToken = 0;
}

function handleGallerySwipeMove(event) {
  if (!state.gallerySwipe.active) {
    return;
  }
  const touch = Array.from(event.changedTouches).find((candidate) => candidate.identifier === state.gallerySwipe.pointerId);
  if (!touch) {
    return;
  }
  const distance = Math.max(0, touch.clientY - state.gallerySwipe.startY);
  state.gallerySwipe.distance = distance;
  if (state.gallerySwipe.startScrollTop <= 0 && distance > 8) {
    event.preventDefault();
    mobileGallery.style.transform = `translate3d(0, ${Math.min(window.innerHeight * 0.35, distance * 0.45)}px, 0)`;
    if (distance >= GALLERY_CAMERA_PREWARM_DISTANCE) {
      prepareCameraReturnFromGallery("gallery-swipe-prewarm");
    }
  }
}

function handleGallerySwipeEnd() {
  if (!state.gallerySwipe.active) {
    return;
  }
  const shouldOpenCamera = state.gallerySwipe.distance > Math.min(120, window.innerHeight * 0.16);
  const prewarmStarted = state.gallerySwipe.prewarmStarted;
  const prewarmStartedAt = state.gallerySwipe.prewarmStartedAt;
  const prewarmToken = state.gallerySwipe.prewarmToken;
  const prewarmReason = state.gallerySwipe.prewarmReason || "gallery-swipe-prewarm";
  state.gallerySwipe.active = false;
  state.gallerySwipe.pointerId = null;
  state.gallerySwipe.startY = 0;
  state.gallerySwipe.distance = 0;
  state.gallerySwipe.prewarmStarted = false;
  state.gallerySwipe.prewarmReason = "";
  state.gallerySwipe.prewarmStartedAt = 0;
  state.gallerySwipe.prewarmToken = 0;
  if (shouldOpenCamera) {
    openCameraFromGallery({
      reason: prewarmStarted ? prewarmReason : "gallery-swipe",
      startedAt: prewarmStartedAt,
      returnToken: prewarmToken,
    });
    return;
  }
  if (prewarmStarted) {
    state.gallerySwipe.prewarmStarted = true;
    state.gallerySwipe.prewarmReason = prewarmReason;
    state.gallerySwipe.prewarmStartedAt = prewarmStartedAt;
    state.gallerySwipe.prewarmToken = prewarmToken;
    cancelPreparedCameraReturnFromGallery("gallery-swipe-cancel");
    return;
  }
  mobileGallery.style.transform = "";
}

async function selectFilter(filename, options = {}) {
  if (filename === RANDOM_CAMERA_FILENAME) {
    state.randomCameraEnabled = true;
    cameraLookSelect.value = RANDOM_CAMERA_FILENAME;
    syncCameraListSelection();
    updateMobileCameraState();
    setStatus("Random Cam enabled. Each shot will pick a different camera preset.");
    return;
  }

  if (!options.keepRandomMode) {
    state.randomCameraEnabled = false;
  }

  lookSelect.value = filename;
  cameraLookSelect.value = state.randomCameraEnabled ? RANDOM_CAMERA_FILENAME : filename;
  writeStoredSelectedCamera(filename);
  syncCameraListSelection();
  intensitySlider.value = defaults.intensity;
  applyFilterEffectDefaults(filename);
  syncIntensityControlState();
  updateEffectControlState();
  syncEffectInputs();
  updateMobileCameraState();

  if (!state.source && !state.cameraActive) {
    return;
  }

  if (options.skipPreviewWork) {
    await ensureLutBytes(filename);
    debugEvent("filter:selected-capture-only", {
      camera: state.filterMap.get(filename)?.name ?? filename,
      random: state.randomCameraEnabled,
    });
    if (!options.skipStatus) {
      setStatus(
        state.randomCameraEnabled
          ? `Random Cam picked ${state.filterMap.get(filename)?.name ?? filename}.`
          : `${state.filterMap.get(filename)?.name ?? filename} loaded.`
      );
    }
    return;
  }

  await ensureLutTexture(filename);
  if (state.cameraActive && !state.nativeCameraActive && cameraPreview.videoWidth && cameraPreview.videoHeight) {
    renderLiveCameraFrameNow();
    startLiveCameraRender();
  }
  if (!state.cameraActive) {
    await ensureCameraOverlayImages(filename);
    if (state.sourceResolution.width && state.sourceResolution.height) {
      fitCanvasToFilterOutputSize(filename, state.sourceResolution.width, state.sourceResolution.height, STILL_IMAGE_MAX_SIDE);
    }
  }
  renderImageAfterSettingsChange();
  setStatus(
    state.randomCameraEnabled
      ? `Random Cam picked ${state.filterMap.get(filename)?.name ?? filename}.`
      : `${state.filterMap.get(filename)?.name ?? filename} loaded.`
  );
}

function handleFilterSelection(filename) {
  selectFilter(filename).catch((error) => {
    console.error(error);
    setStatus("Failed to load the selected filter.");
  });
}

function isTextInputFocused() {
  const activeTag = document.activeElement?.tagName;
  return activeTag === "INPUT" || activeTag === "SELECT" || activeTag === "TEXTAREA";
}

function updateIntensityLabel() {
  const selectedFilter = state.filterMap.get(lookSelect.value);
  const isBnWFamily = selectedFilter?.groupFilename === "BNW";
  intensityValue.textContent = `${isBnWFamily ? 100 : intensitySlider.value}%`;
}

function syncIntensityControlState() {
  const selectedFilter = state.filterMap.get(lookSelect.value);
  const isBnWFamily = selectedFilter?.groupFilename === "BNW";
  intensitySlider.disabled = isBnWFamily;
  updateIntensityLabel();
}

function updateEffectControlState() {
  for (const effect of VISIBLE_EFFECTS) {
    const refs = state.effectInputs.get(effect.id);
    if (!refs) {
      continue;
    }

    if (effect.kind === "toggle") {
      refs.input.checked = state.effects[effect.id].enabled;
    } else {
      refs.input.value = String(state.effects[effect.id].value);
      if (refs.value) {
        refs.value.textContent = formatEffectValue(effect, state.effects[effect.id].value);
      }
    }
  }
}

function syncEffectInputs() {
  for (const effect of VISIBLE_EFFECTS) {
    const refs = state.effectInputs.get(effect.id);
    if (!refs) {
      continue;
    }

    if (effect.kind === "toggle") {
      refs.input.checked = state.effects[effect.id].enabled;
    } else {
      refs.input.value = String(state.effects[effect.id].value);
      refs.value.textContent = formatEffectValue(effect, state.effects[effect.id].value);
    }
  }
}

function syncImportedEffectInputs() {
  const refs = state.importedEffectInputs.get(SPEKTRA_GRAIN_EFFECT.id);
  if (refs) {
    refs.input.checked = state.importedEffects.spektraGrain.enabled;
    refs.presetSelect.value = state.importedEffects.spektraGrain.preset;
    refs.modeSelect.value = state.importedEffects.spektraGrain.mode ?? SPEKTRA_GRAIN_EFFECT.defaultMode;
    refs.presetSelect.disabled = !state.importedEffects.spektraGrain.enabled;
    refs.modeSelect.disabled = !state.importedEffects.spektraGrain.enabled;
  }

}

function formatEffectValue(effect, value) {
  if (effect.kind === "toggle") {
    return value ? "On" : "Off";
  }

  if (Number.isInteger(effect.step)) {
    return `${value > 0 ? "+" : ""}${Math.round(value)}`;
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

function cloneEffectDefaults() {
  return JSON.parse(JSON.stringify(EFFECT_DEFAULTS));
}

function cloneOverlaySelections(selections) {
  return {
    grain: selections?.grain ?? 0,
    dust: selections?.dust ?? 0,
    lightLeak: selections?.lightLeak ?? 0,
    vignette: selections?.vignette ?? 0,
    stackTransform: selections?.stackTransform ?? 0,
  };
}

function getEffectById(effectId) {
  return EFFECT_CATALOG.find((effect) => effect.id === effectId);
}

function setStatus(message) {
  statusMessage.textContent = message;
  debugEvent("status", message);
}

function debugEvent(type, details = null) {
  const entry = {
    t: new Date().toISOString(),
    session: DEBUG_SESSION_ID,
    type,
    details,
  };
  state.debug.events.push(entry);
  if (state.debug.events.length > DEBUG_EVENT_LIMIT) {
    state.debug.events.splice(0, state.debug.events.length - DEBUG_EVENT_LIMIT);
  }
  persistDebugHistory();
}

function getLatestNativeTimingEvent() {
  for (let index = state.debug.events.length - 1; index >= 0; index -= 1) {
    const event = state.debug.events[index];
    if (
      (event.type === "native-capture-stack:success"
        || event.type === "native-capture-simple:success"
        || event.type === "native-stack:success")
      && event.details?.metrics
    ) {
      return event;
    }
  }
  return null;
}

function buildDebugReport() {
  const selected = state.filterMap.get(lookSelect.value);
  const videoTrack = state.cameraStream?.getVideoTracks?.()[0];
  const trackSettings = videoTrack?.getSettings?.() ?? null;
  const latestNativeTiming = getLatestNativeTimingEvent();
  const liveAverage = state.debug.liveFrameCount
    ? state.debug.liveFrameTotalMs / state.debug.liveFrameCount
    : 0;
  const memory = performance.memory
    ? {
      usedMB: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limitMB: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
    }
    : null;

  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    location: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
      mobile: isMobileView(),
    },
    camera: {
      active: state.cameraActive,
      nativeActive: state.nativeCameraActive,
      nativeReady: state.nativeCameraReady,
      warmGallery: state.cameraGalleryDeferred,
      galleryTransitioning: state.cameraGalleryTransitioning,
      galleryReturnTransitioning: document.body.classList.contains("gallery-camera-returning"),
      keepWarmMs: CAMERA_GALLERY_KEEP_WARM_MS,
      facingMode: state.cameraFacingMode,
      flashEnabled: state.cameraFlashEnabled,
      cropFactor: getCameraCropFactor(),
      halfSizeSave: state.halfSizeSave,
      minimalMode: state.minimalMode,
      focalLabelEnabled: state.focalLabelEnabled,
      captureInProgress: state.cameraCaptureInProgress,
      gifCaptureInProgress: state.gifCaptureInProgress,
      videoCaptureInProgress: state.videoCaptureInProgress,
      shutterLongPressAction: state.shutterLongPressAction,
      gifDuration: state.gifDuration,
      gifBoomerang: state.gifBoomerang,
      focusDistance: state.focusDistance,
      lastGifCapture: state.debug.lastGifCapture,
      lastVideoCapture: state.debug.lastVideoCapture,
      lastGalleryGifBoomerang: state.debug.lastGalleryGifBoomerang,
      lastFocusLock: state.debug.lastFocusLock,
      videoWidth: cameraPreview.videoWidth,
      videoHeight: cameraPreview.videoHeight,
      trackSettings,
    },
    ui: {
      theme: state.theme,
      resolvedTheme: getResolvedTheme(),
      accentColor: state.accentColor,
    },
    renderer: {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      sourceWidth: state.sourceResolution.width,
      sourceHeight: state.sourceResolution.height,
      glMaxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : null,
      selectedCamera: selected?.name ?? lookSelect.value,
      selectedFilename: lookSelect.value,
      isBnw: Boolean(selected?.isBnw),
      memory,
    },
    livePreview: {
      frames: state.debug.liveFrameCount,
      lastMs: Math.round(state.debug.lastLiveFrameMs),
      avgMs: Math.round(liveAverage),
      maxMs: Math.round(state.debug.maxLiveFrameMs),
    },
    nativeTiming: latestNativeTiming
      ? {
        type: latestNativeTiming.type,
        camera: latestNativeTiming.details?.camera ?? null,
        at: latestNativeTiming.t,
        metrics: latestNativeTiming.details.metrics,
      }
      : null,
    debugHistory: {
      sessionId: DEBUG_SESSION_ID,
      persisted: true,
      sessions: state.debug.sessions,
      lastOpenedAt: state.debug.lastOpenedAt,
      storedEvents: state.debug.events.length,
    },
    saveQueue: {
      queued: state.cameraSaveQueue.length,
      pendingCaptures: state.cameraPendingCaptureCount,
      processing: state.cameraSaveProcessing,
      captures: state.debug.captureCount,
      lastCaptureMs: Math.round(state.debug.lastCaptureMs),
      lastCaptureBytes: state.debug.lastCaptureBytes,
      saves: state.debug.saveCount,
      lastSaveMs: Math.round(state.debug.lastSaveMs),
      maxSaveMs: Math.round(state.debug.maxSaveMs),
      lastQueueDelayMs: Math.round(state.debug.lastQueueDelayMs),
    },
    transitionPerf: {
      warmGalleryOpens: state.debug.warmGalleryOpenCount,
      warmGalleryReturns: state.debug.warmGalleryReturnCount,
      coldGalleryReturns: state.debug.coldGalleryReturnCount,
      lastWarmGalleryOpenMs: state.debug.lastWarmGalleryOpenMs,
      lastWarmGalleryReturnMs: state.debug.lastWarmGalleryReturnMs,
      lastColdGalleryReturnMs: state.debug.lastColdGalleryReturnMs,
      galleryTransitionEndRenders: state.debug.galleryTransitionEndRenderCount,
      lastGalleryTransitionEndRenderWaitMs: state.debug.lastGalleryTransitionEndRenderWaitMs,
      lastGalleryTransitionEndRenderMs: state.debug.lastGalleryTransitionEndRenderMs,
    },
    gallery: {
      items: state.galleryItems.length,
      objectUrls: state.galleryObjectUrls.length,
      rendered: state.galleryRenderedCount,
      dirty: state.galleryDirty,
      hiddenRenderScheduled: state.galleryHiddenRenderScheduled,
      frameRenderScheduled: state.galleryFrameRenderScheduled,
      captureEndRenderScheduled: Boolean(state.galleryCaptureEndRenderTimer),
      transitionEndRenderScheduled: Boolean(state.galleryTransitionEndRenderTimer),
      surfaceVisible: isGallerySurfaceVisible(),
      batchSize: GALLERY_RENDER_BATCH_SIZE,
      displayLimit: state.galleryDisplayLimit,
      displayLimitCount: Number.isFinite(getGalleryDisplayLimitCount()) ? getGalleryDisplayLimitCount() : "infinite",
      metadataWindowStart: state.galleryWindowStartOffset,
      metadataWindowMax: GALLERY_METADATA_WINDOW_SIZE,
      virtualStart: state.galleryVirtualAbsoluteStart,
      virtualEnd: state.galleryVirtualAbsoluteEnd,
      nativeOffset: state.nativeGalleryOffset,
      nativeTotal: state.nativeGalleryTotal,
      nativeHasMore: state.nativeGalleryHasMore,
      nativeLoading: state.nativeGalleryLoading,
      legacyLoaded: state.legacyGalleryLoaded,
    },
    effects: {
      manual: state.effects,
      imported: state.importedEffects,
      overlaySelections: state.overlaySelections,
    },
    recentEvents: state.debug.events.slice(-80),
  }, null, 2);
}

function refreshDebugReport() {
  if (debugReport) {
    debugReport.value = buildDebugReport();
  }
}

async function copyDebugReport() {
  refreshDebugReport();
  if (!debugReport) {
    return;
  }
  try {
    await navigator.clipboard.writeText(debugReport.value);
    setStatus("Debug report copied.");
  } catch {
    debugReport.focus();
    debugReport.select();
    document.execCommand("copy");
    setStatus("Debug report selected/copied.");
  }
}

function buildCameraSettingsReport() {
  const selected = state.filterMap.get(lookSelect.value);
  return JSON.stringify({
    camera: {
      name: selected?.name ?? lookSelect.value,
      filename: lookSelect.value,
      id: selected?.id ?? null,
      group: selected?.group ?? null,
      isBnw: Boolean(selected?.isBnw),
      overlay: getCameraOverlayKey(),
    },
    settings: {
      intensity: Number(intensitySlider.value),
      cropMode: CAMERA_CROP_MODES[state.cameraCropModeIndex] ?? CAMERA_CROP_MODES[0],
      theme: state.theme,
      accentColor: state.accentColor,
      flashEnabled: state.cameraFlashEnabled,
      facingMode: state.cameraFacingMode,
      minimalMode: state.minimalMode,
      shutterLongPressAction: state.shutterLongPressAction,
      gifDuration: state.gifDuration,
      gifBoomerang: state.gifBoomerang,
      focusDistance: state.focusDistance,
      focalLabelEnabled: state.focalLabelEnabled,
      manualEffects: cloneEffectsState(state.effects),
      importedEffects: cloneImportedEffectsState(state.importedEffects),
    },
  }, null, 2);
}

async function copyCameraSettingsReport() {
  const report = buildCameraSettingsReport();
  try {
    await navigator.clipboard.writeText(report);
    setStatus("Camera settings copied.");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = report;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    setStatus("Camera settings copied.");
  }
}

function disableControls(message) {
  revealAppUi();
  fileInput.disabled = true;
  lookSelect.disabled = true;
  cameraLookSelect.disabled = true;
  intensitySlider.disabled = true;
  startCameraButton.disabled = true;
  capturePhotoButton.disabled = true;
  cameraCaptureButton.disabled = true;
  cameraPreviewGalleryButton.disabled = true;
  cameraFlashToggleButton.disabled = true;
  cameraFacingToggleButton.disabled = true;
  cameraCropToggleButton.disabled = true;
  stopCameraButton.disabled = true;
  cameraSettingsButton.disabled = true;
  galleryCameraButton.disabled = true;
  gallerySettingsButton.disabled = true;
  gallerySaveButton.disabled = true;
  galleryCloseButton.disabled = true;
  galleryTwoColumnToggle.disabled = true;
  if (galleryDisplayLimitSelect) {
    galleryDisplayLimitSelect.disabled = true;
  }
  halfSizeSaveToggle.disabled = true;
  minimalModeToggle.disabled = true;
  levelGuideToggle.disabled = true;
  if (shutterLongPressActionSelect) {
    shutterLongPressActionSelect.disabled = true;
  }
  if (gifDurationSelect) {
    gifDurationSelect.disabled = true;
  }
  if (gifBoomerangToggle) {
    gifBoomerangToggle.disabled = true;
  }
  if (focusDistanceSelect) {
    focusDistanceSelect.disabled = true;
  }
  focalLabelToggle.disabled = true;
  refreshDebugButton.disabled = true;
  copyDebugButton.disabled = true;
  copySettingsButton.disabled = true;
  settingsGalleryButton.disabled = true;
  resetButton.disabled = true;
  toggleEditsButton.disabled = true;
  downloadButton.disabled = true;
  for (const refs of state.effectInputs.values()) {
    refs.input.disabled = true;
  }
  for (const refs of state.importedEffectInputs.values()) {
    refs.input.disabled = true;
  }
  setStatus(message);
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

async function loadOverlayImage(path) {
  if (state.overlayImageCache.has(path)) {
    return state.overlayImageCache.get(path);
  }
  if (state.overlayImagePromises.has(path)) {
    return state.overlayImagePromises.get(path);
  }

  const image = new Image();
  image.decoding = "async";
  const loadPromise = (async () => {
    image.src = path;
    await image.decode();
    state.overlayImageCache.set(path, image);
    return image;
  })();
  state.overlayImagePromises.set(path, loadPromise);
  try {
    return await loadPromise;
  } finally {
    state.overlayImagePromises.delete(path);
  }
}

function rerollOverlaySelections() {
  state.overlaySelections.grain = Math.floor(Math.random() * 997);
  state.overlaySelections.dust = Math.floor(Math.random() * NOMO_OVERLAY_PATHS.dust.length);
  state.overlaySelections.lightLeak = Math.floor(Math.random() * NOMO_OVERLAY_PATHS.lightLeak.length);
  state.overlaySelections.vignette = Math.floor(Math.random() * 997);
  state.overlaySelections.stackTransform = Math.floor(Math.random() * 9973);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function luminance([r, g, b]) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function hueDistance(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 360 - diff);
}

function rgbToHsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta > 0.00001) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }

  return [(hue + 360) % 360, saturation, lightness];
}

function hslToRgb([hue, saturation, lightness]) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const match = lightness - chroma / 2;
  let rgb = [0, 0, 0];

  if (segment >= 0 && segment < 1) rgb = [chroma, x, 0];
  else if (segment < 2) rgb = [x, chroma, 0];
  else if (segment < 3) rgb = [0, chroma, x];
  else if (segment < 4) rgb = [0, x, chroma];
  else if (segment < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return rgb.map((value) => clamp01(value + match));
}

function applyContrastRecipe(color, amount) {
  return color.map((channel) => clamp01((channel - 0.5) * amount + 0.5));
}

function applyLiftGammaGain(color, { lift = 0, gamma = 1, gain = 1 }) {
  return color.map((channel) => clamp01(Math.pow(clamp01(channel + lift), gamma) * gain));
}

function applySplitTone(color, options) {
  const luma = luminance(color);
  const shadowMask = (1 - smoothstep(0.08, 0.55, luma)) * (options.shadowStrength ?? 0);
  const highlightMask = smoothstep(0.55, 0.95, luma) * (options.highlightStrength ?? 0);
  let output = [...color];

  if (options.shadowColor) {
    output = output.map((channel, index) => clamp01(mix(channel, options.shadowColor[index], shadowMask)));
  }
  if (options.highlightColor) {
    output = output.map((channel, index) => clamp01(mix(channel, options.highlightColor[index], highlightMask)));
  }

  return output;
}

function applyHueBands(color, recipe) {
  let [hue, saturation, lightness] = rgbToHsl(color);
  const bands = [
    { target: 30, width: 30, hueShift: recipe.orangeHueShift ?? 0, satScale: recipe.orangeSatScale ?? 1 },
    { target: 55, width: 30, hueShift: recipe.yellowHueShift ?? 0, satScale: recipe.yellowSatScale ?? 1 },
    { target: 120, width: 40, hueShift: recipe.greenHueShift ?? 0, satScale: recipe.greenSatScale ?? 1 },
    { target: 215, width: 45, hueShift: recipe.blueHueShift ?? 0, satScale: recipe.blueSatScale ?? 1 },
    { target: 0, width: 30, hueShift: recipe.redHueShift ?? 0, satScale: recipe.redSatScale ?? 1 },
  ];

  for (const band of bands) {
    const mask = clamp01(1 - hueDistance(hue, band.target) / band.width);
    hue += band.hueShift * mask;
    saturation *= mix(1, band.satScale, mask);
  }

  lightness = clamp01(lightness + (recipe.lightnessOffset ?? 0));
  saturation = clamp01(saturation * (recipe.saturation ?? 1));
  return hslToRgb([(hue + 360) % 360, clamp01(saturation), lightness]);
}

function applyRecipe(color, recipeName) {
  const recipes = {
    funsaver800: { warmBias: [1.08, 1.03, 0.9], saturation: 1.12, contrast: 1.1, orangeSatScale: 1.2, yellowSatScale: 1.12, blueSatScale: 0.86, blueHueShift: -5, shadowColor: [0.11, 0.1, 0.15], shadowStrength: 0.06, highlightColor: [1.0, 0.94, 0.82], highlightStrength: 0.08, lift: 0.01, gamma: 0.96, gain: 1.03 },
    gold200: { warmBias: [1.07, 1.03, 0.93], saturation: 1.06, contrast: 1.04, orangeSatScale: 1.16, yellowSatScale: 1.14, greenHueShift: -4, greenSatScale: 0.96, blueSatScale: 0.9, highlightColor: [1.0, 0.95, 0.83], highlightStrength: 0.06, lift: 0.008, gamma: 0.98, gain: 1.02 },
    ultramax400: { warmBias: [1.06, 1.01, 0.94], saturation: 1.13, contrast: 1.12, redSatScale: 1.08, orangeSatScale: 1.12, yellowSatScale: 1.06, blueHueShift: 8, blueSatScale: 1.08, shadowColor: [0.12, 0.1, 0.16], shadowStrength: 0.08, lift: 0.0, gamma: 0.95, gain: 1.04 },
    colorplus200: { warmBias: [1.05, 1.02, 0.94], saturation: 0.94, contrast: 1.02, orangeSatScale: 1.05, yellowSatScale: 1.08, blueSatScale: 0.82, blueHueShift: -6, highlightColor: [0.98, 0.94, 0.86], highlightStrength: 0.04, lift: 0.016, gamma: 1.0, gain: 1.0 },
    proimage100: { warmBias: [1.05, 1.03, 0.95], saturation: 1.02, contrast: 1.04, yellowSatScale: 1.1, orangeSatScale: 1.08, blueSatScale: 0.92, highlightColor: [0.99, 0.95, 0.87], highlightStrength: 0.05, lift: 0.008, gamma: 0.98, gain: 1.01 },
    portra160: { warmBias: [1.02, 1.01, 0.98], saturation: 0.88, contrast: 0.96, orangeHueShift: -2, orangeSatScale: 0.92, yellowSatScale: 0.9, greenSatScale: 0.94, blueSatScale: 0.9, highlightColor: [1.0, 0.96, 0.92], highlightStrength: 0.08, lift: 0.02, gamma: 1.02, gain: 1.0 },
    portra400: { warmBias: [1.03, 1.01, 0.98], saturation: 0.84, contrast: 0.95, orangeHueShift: -3, orangeSatScale: 0.9, yellowSatScale: 0.88, greenSatScale: 0.92, blueSatScale: 0.88, shadowColor: [0.2, 0.19, 0.21], shadowStrength: 0.03, highlightColor: [1.0, 0.95, 0.92], highlightStrength: 0.1, lift: 0.03, gamma: 1.03, gain: 1.0 },
    portra800: { warmBias: [1.05, 1.02, 0.96], saturation: 0.92, contrast: 1.0, orangeSatScale: 0.98, yellowSatScale: 0.94, blueSatScale: 0.9, shadowColor: [0.18, 0.16, 0.2], shadowStrength: 0.05, highlightColor: [1.0, 0.94, 0.9], highlightStrength: 0.08, lift: 0.026, gamma: 1.01, gain: 1.01 },
    ektar100: { warmBias: [1.01, 1.0, 0.99], saturation: 1.22, contrast: 1.14, redSatScale: 1.1, yellowSatScale: 1.14, greenSatScale: 1.12, blueSatScale: 1.18, blueHueShift: -4, highlightColor: [0.99, 0.97, 0.92], highlightStrength: 0.03, lift: 0.0, gamma: 0.94, gain: 1.05 },
    trix400: { bw: true, contrast: 1.22, lift: 0.0, gamma: 0.94, gain: 1.04, highlightColor: [0.98, 0.98, 0.98], highlightStrength: 0.04 },
  };

  const recipe = recipes[recipeName];
  if (!recipe) return color;

  let output = [...color];
  if (recipe.bw) {
    const luma = luminance(output);
    output = [luma, luma, luma];
  } else {
    output = output.map((channel, index) => clamp01(channel * recipe.warmBias[index]));
    output = applyHueBands(output, recipe);
  }

  output = applyLiftGammaGain(output, recipe);
  output = applyContrastRecipe(output, recipe.contrast ?? 1);
  output = applySplitTone(output, recipe);
  return output.map((channel) => Math.round(clamp01(channel) * 255));
}

function generateCustomLut(recipeName) {
  const rgb = new Uint8Array(LUT_PIXEL_BYTES);

  for (let blueIndex = 0; blueIndex < LUT_HEIGHT; blueIndex += 1) {
    for (let greenIndex = 0; greenIndex < LUT_HEIGHT; greenIndex += 1) {
      for (let redIndex = 0; redIndex < LUT_HEIGHT; redIndex += 1) {
        const lutX = blueIndex * LUT_HEIGHT + redIndex;
        const lutY = greenIndex;
        const baseIndex = (lutY * LUT_WIDTH + lutX) * 3;
        const color = [redIndex / (LUT_HEIGHT - 1), greenIndex / (LUT_HEIGHT - 1), blueIndex / (LUT_HEIGHT - 1)];
        const transformed = applyRecipe(color, recipeName);
        rgb[baseIndex] = transformed[0];
        rgb[baseIndex + 1] = transformed[1];
        rgb[baseIndex + 2] = transformed[2];
      }
    }
  }

  return rgb;
}

fileInput.addEventListener("change", (event) => loadFile(event.target.files[0]));
startCameraButton.addEventListener("click", startCamera);
function clearShutterLongPressTimer() {
  if (state.shutterLongPressTimer) {
    window.clearTimeout(state.shutterLongPressTimer);
    state.shutterLongPressTimer = 0;
  }
  state.shutterLongPressPointerId = null;
}

function releaseShutterPointerCapture(event) {
  const target = event?.currentTarget;
  if (!target || event?.pointerId == null || !target.releasePointerCapture) {
    return;
  }
  try {
    if (!target.hasPointerCapture || target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  } catch {
    // Some WebViews throw if capture has already been released.
  }
}

function beginShutterLongPress(event) {
  if (event.button != null && event.button !== 0) {
    return;
  }
  event.preventDefault?.();
  clearShutterLongPressTimer();
  state.shutterLongPressTriggered = false;
  state.shutterPointerHandled = false;
  state.shutterLongPressPointerId = event.pointerId;
  event.currentTarget?.setPointerCapture?.(event.pointerId);
  state.shutterLongPressTimer = window.setTimeout(() => {
    state.shutterLongPressTimer = 0;
    state.shutterLongPressTriggered = true;
    handleShutterLongPressAction();
  }, SHUTTER_LONG_PRESS_MS);
}

function endShutterLongPress(event) {
  if (state.shutterLongPressPointerId != null && event.pointerId !== state.shutterLongPressPointerId) {
    return;
  }
  releaseShutterPointerCapture(event);
  const wasLongPress = state.shutterLongPressTriggered;
  const hadPendingTap = Boolean(state.shutterLongPressTimer);
  clearShutterLongPressTimer();
  event?.preventDefault?.();
  state.shutterPointerHandled = true;
  if (wasLongPress) {
    if (state.shutterLongPressAction === "video" || state.videoCaptureInProgress) {
      stopNativeVideoRecording("release").catch((error) => console.error(error));
    }
    return;
  }
  if (hadPendingTap) {
    requestCameraCapture({ source: "button" });
  }
}

function cancelShutterLongPress(event) {
  if (state.shutterLongPressPointerId != null && event.pointerId !== state.shutterLongPressPointerId) {
    return;
  }
  releaseShutterPointerCapture(event);
  clearShutterLongPressTimer();
  if (state.shutterLongPressTriggered && (state.shutterLongPressAction === "video" || state.videoCaptureInProgress)) {
    stopNativeVideoRecording("cancel").catch((error) => console.error(error));
  }
  state.shutterPointerHandled = true;
}

function handleCameraCaptureClick(event) {
  if (state.shutterPointerHandled || state.shutterLongPressTriggered) {
    event?.preventDefault?.();
    state.shutterPointerHandled = false;
    state.shutterLongPressTriggered = false;
    return;
  }
  requestCameraCapture({ source: "button" });
}

capturePhotoButton.addEventListener("click", handleCameraCaptureClick);
cameraCaptureButton.addEventListener("click", handleCameraCaptureClick);
for (const button of [capturePhotoButton, cameraCaptureButton]) {
  button?.addEventListener("pointerdown", beginShutterLongPress);
  button?.addEventListener("pointerup", endShutterLongPress);
  button?.addEventListener("pointercancel", cancelShutterLongPress);
  button?.addEventListener("pointerleave", cancelShutterLongPress);
  button?.addEventListener("contextmenu", (event) => event.preventDefault());
}
cameraPreviewGalleryButton.addEventListener("click", () => openGalleryFromCamera({ reason: "camera-gallery-button" }));
cameraFlashToggleButton.addEventListener("click", () => {
  toggleCameraFlash().catch((error) => {
    console.error(error);
    setStatus("Unable to toggle hardware flash.");
  });
});
cameraFacingToggleButton.addEventListener("click", () => {
  toggleCameraFacing().catch((error) => {
    console.error(error);
    setStatus("Unable to switch camera.");
  });
});
cameraCropToggleButton.addEventListener("click", toggleCameraCropMode);
stopCameraButton.addEventListener("click", stopCamera);
cameraSettingsButton.addEventListener("click", () => stopCamera({ settings: true }));
galleryCameraButton.addEventListener("click", () => openCameraFromGallery({ reason: "gallery-camera-button" }));
gallerySettingsButton.addEventListener("click", () => {
  state.mobileSettingsOpen = true;
  updateMobileCameraState();
});
settingsGalleryButton.addEventListener("click", () => {
  state.mobileSettingsOpen = false;
  updateMobileCameraState();
  loadGalleryOnDemand().catch((error) => console.error(error));
});
galleryTwoColumnToggle.addEventListener("change", () => {
  state.galleryTwoColumn = galleryTwoColumnToggle.checked;
  writeStoredGalleryTwoColumn(state.galleryTwoColumn);
  syncGalleryLayoutSetting();
  renderGalleryWhenTransitionSafe("gallery-layout-change");
});
galleryDisplayLimitSelect?.addEventListener("change", () => {
  state.galleryDisplayLimit = GALLERY_DISPLAY_LIMIT_VALUES.has(galleryDisplayLimitSelect.value)
    ? galleryDisplayLimitSelect.value
    : "default";
  writeStoredGalleryDisplayLimit(state.galleryDisplayLimit);
  syncGalleryDisplayLimitSetting();
  state.galleryRenderedCount = 0;
  renderGalleryWhenTransitionSafe("gallery-display-limit-change");
  loadGalleryToDisplayLimit()
    .then(() => renderGalleryWhenTransitionSafe("gallery-display-limit-loaded"))
    .catch((error) => {
      console.error(error);
      setStatus("Failed to update gallery image limit.");
    });
  setStatus(state.galleryDisplayLimit === "infinite"
    ? "Gallery limit set to Infinite. This is experimental."
    : "Gallery image limit updated.");
});
themeSelect?.addEventListener("change", () => {
  state.theme = THEME_VALUES.has(themeSelect.value) ? themeSelect.value : "system";
  writeStoredTheme(state.theme);
  syncThemeSetting();
  setStatus(`Theme set to ${themeSelect.options[themeSelect.selectedIndex]?.textContent ?? state.theme}.`);
});
accentSwatches?.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest(".accent-swatch") : null;
  if (!button) {
    return;
  }
  state.accentColor = normalizeAccentColor(button.dataset.accent);
  writeStoredAccentColor(state.accentColor);
  syncAccentColorSetting();
  setStatus("Accent color updated.");
});
accentColorInput?.addEventListener("input", () => {
  state.accentColor = normalizeAccentColor(accentColorInput.value);
  writeStoredAccentColor(state.accentColor);
  syncAccentColorSetting();
});
halfSizeSaveToggle?.addEventListener("change", () => {
  state.halfSizeSave = halfSizeSaveToggle.checked;
  writeStoredHalfSizeSave(state.halfSizeSave);
  syncHalfSizeSaveSetting();
  setStatus(state.halfSizeSave ? "Half-size camera saves enabled." : "Full-size camera saves enabled.");
});
minimalModeToggle?.addEventListener("change", () => {
  state.minimalMode = minimalModeToggle.checked;
  writeStoredMinimalMode(state.minimalMode);
  syncMinimalModeSetting();
  updateMobileCameraState();
  setStatus(state.minimalMode ? "Minimal Mode overlay enabled." : "Minimal Mode overlay disabled.");
});
focalLabelToggle?.addEventListener("change", () => {
  state.focalLabelEnabled = focalLabelToggle.checked;
  writeStoredFocalLabel(state.focalLabelEnabled);
  syncFocalLabelSetting();
  setStatus(state.focalLabelEnabled ? "Focal length label enabled." : "Focal length label disabled.");
});
refreshDebugButton?.addEventListener("click", refreshDebugReport);
copyDebugButton?.addEventListener("click", () => {
  copyDebugReport().catch((error) => {
    console.error(error);
    setStatus("Failed to copy debug report.");
  });
});
copySettingsButton?.addEventListener("click", () => {
  copyCameraSettingsReport().catch((error) => {
    console.error(error);
    setStatus("Failed to copy camera settings.");
  });
});
levelGuideToggle.addEventListener("change", () => {
  state.levelGuideEnabled = levelGuideToggle.checked;
  writeStoredLevelGuide(state.levelGuideEnabled);
  syncLevelGuideSetting();
  syncNativeLevelGuide();
});
shutterLongPressActionSelect?.addEventListener("change", () => {
  state.shutterLongPressAction = SHUTTER_LONG_PRESS_ACTION_VALUES.has(shutterLongPressActionSelect.value)
    ? shutterLongPressActionSelect.value
    : "gif";
  writeStoredShutterLongPressAction(state.shutterLongPressAction);
  syncShutterLongPressSettings();
  setStatus(state.shutterLongPressAction === "gif"
    ? "Long press shutter set to GIF mode."
    : state.shutterLongPressAction === "video"
    ? "Long press shutter set to video mode."
    : "Long press shutter set to out of focus mode.");
});
gifDurationSelect?.addEventListener("change", () => {
  state.gifDuration = GIF_DURATION_VALUES.has(gifDurationSelect.value) ? gifDurationSelect.value : "2";
  writeStoredGifDuration(state.gifDuration);
  syncShutterLongPressSettings();
  setStatus(`GIF timing set to ${state.gifDuration} seconds.`);
});
gifBoomerangToggle?.addEventListener("change", () => {
  state.gifBoomerang = gifBoomerangToggle.checked;
  writeStoredGifBoomerang(state.gifBoomerang);
  syncShutterLongPressSettings();
  setStatus(state.gifBoomerang ? "GIF boomerang loop enabled." : "GIF normal loop enabled.");
});
focusDistanceSelect?.addEventListener("change", () => {
  state.focusDistance = FOCUS_DISTANCE_VALUES.has(focusDistanceSelect.value) ? focusDistanceSelect.value : "closest";
  writeStoredFocusDistance(state.focusDistance);
  syncShutterLongPressSettings();
  setStatus(state.focusDistance === "far" ? "Out of focus mode will lock far." : "Out of focus mode will lock close.");
});
galleryDeleteButton.addEventListener("click", closeGalleryItem);
galleryViewerImage.addEventListener("click", (event) => event.stopPropagation());
galleryViewer.querySelector(".gallery-viewer__actions")?.addEventListener("click", (event) => event.stopPropagation());
galleryPresetSelect?.addEventListener("click", (event) => event.stopPropagation());
galleryPresetSelect?.addEventListener("change", () => {
  applyGalleryPresetToSelectedItem(galleryPresetSelect.value).catch((error) => {
    console.error(error);
    setStatus("Failed to apply selected gallery preset.");
  });
});
galleryGifBoomerangToggle?.addEventListener("click", (event) => event.stopPropagation());
galleryGifBoomerangToggle?.addEventListener("change", () => {
  setSelectedGalleryGifBoomerang(galleryGifBoomerangToggle.checked).catch((error) => {
    console.error(error);
    setStatus("Failed to update GIF boomerang.");
  });
});
gallerySelectionCancelButton?.addEventListener("click", exitGallerySelectionMode);
gallerySelectionDeleteButton?.addEventListener("click", () => {
  deleteSelectedGalleryItemsFromApp().catch((error) => {
    console.error(error);
    setStatus("Failed to delete selected gallery images.");
  });
});
galleryViewer.addEventListener("click", (event) => {
  if (event.target === galleryViewer) {
    closeGalleryItem();
  }
});
galleryCloseButton.addEventListener("click", () => {
  deleteSelectedGalleryItem().catch((error) => {
    console.error(error);
    setStatus("Failed to delete selected gallery image.");
  });
});
gallerySaveButton.addEventListener("click", () => {
  saveSelectedGalleryItem().catch((error) => {
    if (error?.name !== "AbortError") {
      console.error(error);
      setStatus("Failed to save selected gallery image.");
    }
  });
});

lookSelect.addEventListener("change", async () => {
  handleFilterSelection(lookSelect.value);
});

cameraLookSelect.addEventListener("change", async () => {
  handleFilterSelection(cameraLookSelect.value);
});

intensitySlider.addEventListener("input", () => {
  updateIntensityLabel();
  renderImageAfterSettingsChange();
});

window.addEventListener("keydown", async (event) => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
    return;
  }

  if (isTextInputFocused()) {
    return;
  }

  const options = Array.from(lookSelect.options);
  if (!options.length) {
    return;
  }

  const currentIndex = Math.max(0, options.findIndex((option) => option.value === lookSelect.value));
  const delta = event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = Math.min(options.length - 1, Math.max(0, currentIndex + delta));
  if (nextIndex === currentIndex) {
    return;
  }

  event.preventDefault();
  handleFilterSelection(options[nextIndex].value);
});

window.addEventListener("keydown", (event) => {
  if (event.code !== "Backslash") {
    return;
  }

  if (!state.source || isTextInputFocused() || state.beforeHoldActive) {
    return;
  }

  event.preventDefault();
  state.beforeHoldActive = true;
  state.showingOriginal = true;
  toggleEditsButton.setAttribute("aria-pressed", "true");
  toggleEditsButton.textContent = "Show filter";
  renderImage();
});

window.addEventListener("keyup", (event) => {
  if (event.code !== "Backslash") {
    return;
  }

  if (!state.source || !state.beforeHoldActive) {
    return;
  }

  event.preventDefault();
  state.beforeHoldActive = false;
  state.showingOriginal = false;
  toggleEditsButton.setAttribute("aria-pressed", "false");
  toggleEditsButton.textContent = "Show original";
  renderImage();
});

resetButton.addEventListener("click", resetControls);
toggleEditsButton.addEventListener("click", toggleEditsVisibility);
downloadButton.addEventListener("click", downloadImage);
window.addEventListener("resize", () => {
  updateCanvasDisplaySize();
  resyncNativeCameraPreview("resize");
});
window.addEventListener("pageshow", () => {
  resyncNativeCameraPreview("pageshow");
  restoreCameraModeFromLifecycle("pageshow");
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    resyncNativeCameraPreview("visibility-visible");
    restoreCameraModeFromLifecycle("visibility-visible");
    return;
  }
  prepareCameraModeForLifecycle("visibility-hidden");
  if (state.videoCaptureInProgress) {
    stopNativeVideoRecording("visibility-hidden").finally(() => {
      stopCamera({ force: true, keepCameraMode: true, skipGalleryLoad: true });
    });
    return;
  }
  stopCamera({ force: true, keepCameraMode: true, skipGalleryLoad: true });
});
window.addEventListener("pagehide", () => {
  debugEvent("session:pagehide", {
    cameraActive: state.cameraActive,
    saveProcessing: state.cameraSaveProcessing,
    queued: state.cameraSaveQueue.length,
  });
  prepareCameraModeForLifecycle("pagehide");
  if (state.videoCaptureInProgress) {
    stopNativeVideoRecording("pagehide").finally(() => {
      stopCamera({ force: true, keepCameraMode: true, skipGalleryLoad: true });
    });
    persistDebugHistory();
    return;
  }
  stopCamera({ force: true, keepCameraMode: true, skipGalleryLoad: true });
  persistDebugHistory();
});
window.addEventListener("error", (event) => {
  debugEvent("window:error", {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
  });
});
window.addEventListener("unhandledrejection", (event) => {
  debugEvent("window:unhandledrejection", {
    reason: event.reason?.message ?? String(event.reason),
  });
});
installMobileZoomGuards();
cameraShell.addEventListener("pointerdown", handleCameraSwipeStart);
cameraShell.addEventListener("pointermove", handleCameraSwipeMove);
cameraShell.addEventListener("pointerup", handleCameraSwipeEnd);
cameraShell.addEventListener("pointercancel", handleCameraSwipeEnd);
workspace.addEventListener("pointerdown", handleCameraSwipeStart);
workspace.addEventListener("pointermove", handleCameraSwipeMove);
workspace.addEventListener("pointerup", handleCameraSwipeEnd);
workspace.addEventListener("pointercancel", handleCameraSwipeEnd);
if (!window.PointerEvent) {
  workspace.addEventListener("touchstart", handleCameraSwipeTouchStart, { passive: false });
  workspace.addEventListener("touchmove", handleCameraSwipeTouchMove, { passive: false });
  workspace.addEventListener("touchend", handleCameraSwipeTouchEnd);
  workspace.addEventListener("touchcancel", handleCameraSwipeTouchEnd);
}
mobileGallery.addEventListener("touchstart", handleGallerySwipeStart, { passive: true });
mobileGallery.addEventListener("touchmove", handleGallerySwipeMove, { passive: false });
mobileGallery.addEventListener("touchend", handleGallerySwipeEnd);
mobileGallery.addEventListener("touchcancel", handleGallerySwipeEnd);
mobileGallery.addEventListener("scroll", scheduleRenderMoreGalleryItems, { passive: true });
workspace.addEventListener("wheel", handleWorkspaceWheel, { passive: false });
canvas.addEventListener("pointerdown", startCanvasPan);
canvas.addEventListener("pointermove", moveCanvasPan);
canvas.addEventListener("pointerup", stopCanvasPan);
canvas.addEventListener("pointercancel", stopCanvasPan);
canvas.addEventListener("dblclick", resetCanvasView);
