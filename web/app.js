import { EFFECT_CATALOG, EFFECT_DEFAULTS, EFFECT_GROUPS, VISIBLE_EFFECTS } from "./effectCatalog.js";
import { applySpektraGrainToRgba, loadSpektraProfile, SPEKTRA_GRAIN_EFFECT } from "./spektraGrain.js";

const canvas = document.querySelector("#processedCanvas");
const workspace = document.querySelector(".image-workspace");
const emptyState = document.querySelector("#emptyState");
const cameraShell = document.querySelector("#cameraShell");
const cameraPreview = document.querySelector("#cameraPreview");
const cameraPreviewSlot = document.querySelector("#cameraPreviewSlot");
const cameraPreviewGalleryButton = document.querySelector("#cameraPreviewGalleryButton");
const cameraFlash = document.querySelector("#cameraFlash");
const cameraFlashTint = document.querySelector("#cameraFlashTint");
const cameraFlashToggleButton = document.querySelector("#cameraFlashToggleButton");
const cameraPresetLabel = document.querySelector("#cameraPresetLabel");
const cameraLookSelect = document.querySelector("#cameraLookSelect");
const cameraListDrawer = document.querySelector("#cameraListDrawer");
const cameraList = document.querySelector("#cameraList");
const fileInput = document.querySelector("#fileInput");
const lookSelect = document.querySelector("#lookSelect");
const intensitySlider = document.querySelector("#intensitySlider");
const intensityValue = document.querySelector("#intensityValue");
const effectsRoot = document.querySelector("#effectsRoot");
const importedEffectsRoot = document.querySelector("#importedEffectsRoot");
const mobileGallery = document.querySelector("#mobileGallery");
const galleryGrid = document.querySelector("#galleryGrid");
const galleryEmpty = document.querySelector("#galleryEmpty");
const galleryCameraButton = document.querySelector("#galleryCameraButton");
const gallerySettingsButton = document.querySelector("#gallerySettingsButton");
const galleryViewer = document.querySelector("#galleryViewer");
const galleryViewerImage = document.querySelector("#galleryViewerImage");
const gallerySaveButton = document.querySelector("#gallerySaveButton");
const galleryCloseButton = document.querySelector("#galleryCloseButton");
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
const CAMERA_PERMISSION_GRANTED = "granted";
const CAMERA_PERMISSION_DENIED = "denied";
const CAMERA_PREVIEW_MAX_SIDE = 1280;
const STILL_IMAGE_MAX_SIDE = 2200;
const MOBILE_SAVE_MAX_SIDE = 2200;
const MOBILE_CAPTURE_ASPECT_RATIO = 3 / 4;
const JPEG_EXPORT_QUALITY = 0.98;
const COLOR_MATRIX = new Float32Array([
  0.24, 0.68, 0.08, 0.0,
  0.24, 0.68, 0.08, 0.0,
  0.24, 0.68, 0.08, 0.0,
  0.0, 0.0, 0.0, 1.0,
]);
const RAINBOW_CAMERA_ID = 26;
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
const state = {
  source: null,
  stillImage: null,
  stillSourceName: "nomo-edit",
  sourceName: "nomo-edit",
  sourceTexture: null,
  lutTexture: null,
  lookupTarget: null,
  effectsTarget: null,
  grainTexture: null,
  sourceResolution: { width: 1, height: 1 },
  showingOriginal: false,
  filters: [],
  filterMap: new Map(),
  filterEffectDefaults: new Map(),
  selectedFilterFilename: "",
  aesKey: null,
  geometry: null,
  beforeHoldActive: false,
  cameraStream: null,
  cameraActive: false,
  cameraAnimationFrame: 0,
  cameraAutostartAttempted: false,
  cameraPermissionState: readStoredCameraPermission(),
  cameraFlashEnabled: false,
  mobileSettingsOpen: false,
  galleryDb: null,
  galleryReadyPromise: null,
  galleryItems: [],
  galleryObjectUrls: [],
  selectedGalleryItem: null,
  cameraSaveQueue: [],
  cameraSaveProcessing: false,
  nomoOverlayImages: null,
  cameraOverlayCache: new Map(),
  currentCameraOverlayImages: null,
  overlaySelections: {
    grain: 0,
    dust: 0,
    lightLeak: 0,
    vignette: 0,
  },
  effects: cloneEffectDefaults(),
  effectInputs: new Map(),
  importedEffects: {
    spektraGrain: {
      enabled: SPEKTRA_GRAIN_EFFECT.defaultEnabled,
      preset: SPEKTRA_GRAIN_EFFECT.defaultPreset,
    },
  },
  spektraProfile: null,
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
  },
  cameraListOpen: false,
};

const defaults = {
  intensity: 100,
};
const CAMERA_DEFAULT_EFFECT_IDS = new Set(["nomoGrain", "dust", "vignette", "lightLeak"]);

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
  updateMobileCameraState();
  queueMobileCameraAutostart();
  setStatus(isMobileView() ? "Opening camera..." : "Open a photo to start.");
  initializeDeferredAssets();
}

function initializeDeferredAssets() {
  state.filterEffectDefaults = loadFilterEffectDefaults(state.filters);
  applyFilterEffectDefaults(lookSelect.value);
  syncEffectInputs();
  updateEffectControlState();
  ensureCameraOverlayImages(lookSelect.value)
    .then(() => renderImageAfterSettingsChange())
    .catch((error) => console.error(error));

  loadSpektraProfile(SPEKTRA_PROFILE_PATH)
    .then((profile) => {
      state.spektraProfile = profile;
      renderImageAfterSettingsChange();
    })
    .catch((error) => {
      console.error(error);
    });

  state.galleryReadyPromise = openGalleryDb()
    .then(async (db) => {
      state.galleryDb = db;
      state.galleryItems = await loadGalleryItems();
      renderGallery();
      return db;
    })
    .catch((error) => {
      console.error(error);
      return null;
    });
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

async function ensureCameraOverlayImages(filename) {
  const filter = state.filterMap.get(filename);
  if (!filter) {
    state.currentCameraOverlayImages = null;
    return null;
  }

  if (state.cameraOverlayCache.has(filename)) {
    state.currentCameraOverlayImages = state.cameraOverlayCache.get(filename);
    return state.currentCameraOverlayImages;
  }

  const overlayAssets = filter.overlayAssets ?? {};
  const loaded = {};
  await Promise.all(
    Object.entries(overlayAssets).map(async ([kind, paths]) => {
      loaded[kind] = await Promise.all(paths.map((path) => loadOverlayImage(`${CAMERA_ASSETS_ROOT}/${path}`)));
    }),
  );

  state.cameraOverlayCache.set(filename, loaded);
  state.currentCameraOverlayImages = loaded;
  return loaded;
}

async function loadFilterCatalog() {
  const allFilters = (await fetchJson(CAMERA_CATALOG_PATH)).map((camera) => ({
    ...camera,
    group: camera.group ?? "NOMO Cameras",
    groupFilename: "downloaded-nomo-cameras",
    name: camera.name ?? `Camera ${camera.id}`,
  }));

  for (const filter of allFilters) {
    state.filterMap.set(filter.filename, filter);
  }

  return allFilters;
}

function populateFilterSelect(filters) {
  lookSelect.innerHTML = "";
  cameraLookSelect.innerHTML = "";
  cameraList.innerHTML = "";
  const groups = new Map();
  const cameraGroups = new Map();

  for (const filter of filters) {
    if (!groups.has(filter.group)) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = filter.group;
      groups.set(filter.group, optgroup);
      lookSelect.append(optgroup);

      const cameraOptgroup = document.createElement("optgroup");
      cameraOptgroup.label = filter.group;
      cameraGroups.set(filter.group, cameraOptgroup);
      cameraLookSelect.append(cameraOptgroup);
    }

    const option = document.createElement("option");
    option.value = filter.filename;
    option.textContent = filter.name;
    groups.get(filter.group).append(option);

    const cameraOption = option.cloneNode(true);
    cameraGroups.get(filter.group).append(cameraOption);

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
    cameraList.append(cameraButton);
  }

  lookSelect.disabled = filters.length === 0;
  cameraLookSelect.disabled = filters.length === 0;
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

  card.append(row, presetSelect);

  card.title = SPEKTRA_GRAIN_EFFECT.anchor;

  importedEffectsRoot.append(card);
  state.importedEffectInputs.set(SPEKTRA_GRAIN_EFFECT.id, { input, presetSelect });

  input.addEventListener("input", () => {
    state.importedEffects.spektraGrain.enabled = input.checked;
    presetSelect.disabled = !input.checked;
    renderImageAfterSettingsChange();
  });

  presetSelect.addEventListener("input", () => {
    state.importedEffects.spektraGrain.preset = presetSelect.value;
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
  updateMobileCameraState();
  MOBILE_MEDIA_QUERY.addEventListener("change", handleMobileViewportChange);
}

function handleMobileViewportChange(event) {
  if (!event.matches && state.cameraActive) {
    stopCamera();
  }
  if (event.matches) {
    queueMobileCameraAutostart();
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
  const cameraSupported = Boolean(navigator.mediaDevices?.getUserMedia);
  const canOpen = mobile && cameraSupported && !state.cameraActive && !lookSelect.disabled;

  startCameraButton.disabled = !canOpen;
  capturePhotoButton.disabled = !mobile || !state.cameraActive;
  cameraCaptureButton.disabled = !mobile || !state.cameraActive;
  cameraPreviewGalleryButton.disabled = !mobile || !state.cameraActive;
  cameraFlashToggleButton.disabled = !mobile || !state.cameraActive;
  stopCameraButton.disabled = !mobile || !state.cameraActive;
  cameraSettingsButton.disabled = !mobile || !state.cameraActive;
  cameraLookSelect.disabled = !mobile || lookSelect.disabled;
  cameraLookSelect.value = lookSelect.value;
  cameraPresetLabel.textContent = state.cameraActive
    ? `Live preview: ${state.filterMap.get(lookSelect.value)?.name ?? "selected preset"}`
    : "Ready to capture with the selected preset.";
  document.body.classList.toggle("camera-mode-active", mobile && state.cameraActive);
  document.body.classList.toggle("mobile-gallery-active", mobile && !state.cameraActive && !state.mobileSettingsOpen);
  document.body.classList.toggle("mobile-settings-active", mobile && !state.cameraActive && state.mobileSettingsOpen);
  if (!mobile || !state.cameraActive) {
    setCameraGalleryPeek(false);
    setCameraListOpen(false);
  }
  syncCameraListSelection();
  updateCameraFlashState();
}

function queueMobileCameraAutostart() {
  if (!isMobileView() || state.cameraAutostartAttempted || lookSelect.disabled) {
    return;
  }

  state.cameraAutostartAttempted = true;
  window.setTimeout(async () => {
    if (isMobileView() && !state.cameraActive) {
      if (await canAutostartCameraWithoutPrompt()) {
        startCamera({ automatic: true });
      } else {
        setStatus("Tap Open camera once to grant camera access.");
      }
    }
  }, 0);
}

async function startCamera() {
  if (!isMobileView()) {
    return;
  }

  if (state.cameraActive) {
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Camera capture is not available in this browser.");
    return;
  }

  try {
    state.mobileSettingsOpen = false;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 4096 },
        height: { ideal: 2160 },
      },
      audio: false,
    });

    state.cameraStream = stream;
    state.cameraActive = true;
    cameraPreview.srcObject = stream;
    cameraPreviewSlot.append(canvas);
    await cameraPreview.play();
    state.cameraPermissionState = CAMERA_PERMISSION_GRANTED;
    writeStoredCameraPermission(CAMERA_PERMISSION_GRANTED);
    resetCanvasView();
    cameraShell.hidden = false;
    canvas.style.display = "block";
    emptyState.style.display = "none";
    updateMobileCameraState();
    startLiveCameraRender();
    setStatus("Camera ready. Live preview uses the selected preset.");
  } catch (error) {
    console.error(error);
    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      state.cameraPermissionState = CAMERA_PERMISSION_DENIED;
      writeStoredCameraPermission(CAMERA_PERMISSION_DENIED);
      setStatus("Camera permission is blocked. Enable it in Safari/site settings.");
    } else {
      setStatus("Unable to open the camera.");
    }
    updateMobileCameraState();
  }
}

function stopCamera(options = {}) {
  stopLiveCameraRender();
  setCameraGalleryPeek(false);

  if (state.cameraStream) {
    for (const track of state.cameraStream.getTracks()) {
      track.stop();
    }
  }

  state.cameraStream = null;
  state.cameraActive = false;
  state.mobileSettingsOpen = Boolean(options.settings);
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

  if (state.source) {
    renderImage();
  } else {
    emptyState.style.display = "flex";
  }
}

function startLiveCameraRender() {
  stopLiveCameraRender();
  state.cameraAnimationFrame = window.requestAnimationFrame(renderLiveCameraFrame);
}

function stopLiveCameraRender() {
  if (state.cameraAnimationFrame) {
    window.cancelAnimationFrame(state.cameraAnimationFrame);
    state.cameraAnimationFrame = 0;
  }
}

async function renderLiveCameraFrame() {
  state.cameraAnimationFrame = 0;

  if (!state.cameraActive) {
    return;
  }

  if (cameraPreview.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && cameraPreview.videoWidth && cameraPreview.videoHeight) {
    try {
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
      fitCanvasToSize(cameraPreview.videoWidth, cameraPreview.videoHeight, CAMERA_PREVIEW_MAX_SIDE);
      uploadSourceTexturePixels(cameraPreview);
      renderImage();
    } catch (error) {
      console.error(error);
      setStatus("Failed to render live camera preview.");
    }
  }

  if (state.cameraActive) {
    state.cameraAnimationFrame = window.requestAnimationFrame(renderLiveCameraFrame);
  }
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
  if (!state.cameraActive || !state.source || canvas.style.display === "none") {
    return;
  }

  vibrateCapture();
  flashCameraPreview();

  const selected = state.filterMap.get(lookSelect.value);
  const rawBlob = await captureRawCameraBlob();
  if (!rawBlob) {
    setStatus("Failed to save the camera frame.");
    return;
  }

  const filename = `analoguecam-${selected?.filename ?? "camera"}-${Date.now()}.jpg`;
  enqueueCameraSave({
    rawBlob,
    filename,
    filterFilename: lookSelect.value,
    intensity: intensitySlider.value,
    effects: cloneEffectsState(state.effects),
    importedEffects: cloneImportedEffectsState(state.importedEffects),
  });
  setStatus(`Captured ${selected?.name ?? "camera"} frame. Processing save in background.`);
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

  drawImageCover(context, cameraPreview, 0, 0, captureCanvas.width, captureCanvas.height);
  return new Promise((resolve) => captureCanvas.toBlob(resolve, "image/jpeg", JPEG_EXPORT_QUALITY));
}

function getMobileCaptureCanvasSize(sourceWidth, sourceHeight) {
  const sourceMaxSide = Math.max(sourceWidth, sourceHeight);
  const height = Math.max(1, sourceMaxSide);
  const width = Math.max(1, Math.round(height * MOBILE_CAPTURE_ASPECT_RATIO));
  return { width, height };
}

function enqueueCameraSave(job) {
  state.cameraSaveQueue.push(job);
  if (!state.cameraSaveProcessing) {
    state.cameraSaveProcessing = true;
    scheduleSlowCameraSaveProcessing();
  }
}

function scheduleSlowCameraSaveProcessing() {
  window.setTimeout(() => {
    processNextCameraSave().catch((error) => {
      console.error(error);
      setStatus("Failed to process queued camera save.");
      state.cameraSaveProcessing = false;
    });
  }, 650);
}

async function processNextCameraSave() {
  const job = state.cameraSaveQueue.shift();
  if (!job) {
    state.cameraSaveProcessing = false;
    return;
  }

  const galleryReady = await ensureGalleryReady();
  if (!galleryReady) {
    setStatus("Local gallery storage is unavailable in this browser.");
    state.cameraSaveProcessing = false;
    return;
  }

  const previous = snapshotRenderState();
  try {
    const image = await decodeBlobToImage(job.rawBlob);
    stopLiveCameraRender();
    lookSelect.value = job.filterFilename;
    cameraLookSelect.value = job.filterFilename;
    intensitySlider.value = job.intensity;
    state.effects = cloneEffectsState(job.effects);
    state.importedEffects = cloneImportedEffectsState(job.importedEffects);
    state.source = image;
    state.sourceName = "queued-camera-save";
    state.sourceResolution = { width: image.naturalWidth, height: image.naturalHeight };
    const maxSide = getMobileSaveMaxSide(image);
    fitCanvasToSize(image.naturalWidth, image.naturalHeight, maxSide);
    uploadSourceTexturePixels(createScaledSourceCanvas(image, canvas.width, canvas.height) ?? image);
    await ensureLutTexture(job.filterFilename);
    await ensureCameraOverlayImages(job.filterFilename);
    fitCanvasToFilterOutputSize(job.filterFilename, image.naturalWidth, image.naturalHeight, maxSide);
    renderImage({ includeSpektraGrain: true, includeNomoOverlays: true, includeCameraStack: true });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_EXPORT_QUALITY));
    if (!blob) {
      throw new Error("Processed camera save did not produce a blob.");
    }

    const item = await saveGalleryBlob(blob, job.filename);
    state.galleryItems.unshift(item);
    renderGallery();
    setStatus(`Saved ${state.filterMap.get(job.filterFilename)?.name ?? "camera"} shot to local gallery.`);
  } catch (error) {
    console.error(error);
    await saveRawCameraFallback(job);
  } finally {
    restoreRenderState(previous);
  }

  if (state.cameraSaveQueue.length) {
    scheduleSlowCameraSaveProcessing();
  } else {
    state.cameraSaveProcessing = false;
  }
}

function getMobileSaveMaxSide(image) {
  const sourceMaxSide = Math.max(image.naturalWidth || 0, image.naturalHeight || 0);
  const textureLimit = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : MOBILE_SAVE_MAX_SIDE;
  const safeTextureLimit = Number.isFinite(textureLimit) ? Math.max(1, Math.floor(textureLimit * 0.5)) : MOBILE_SAVE_MAX_SIDE;
  return Math.min(sourceMaxSide || MOBILE_SAVE_MAX_SIDE, MOBILE_SAVE_MAX_SIDE, safeTextureLimit);
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
  const item = await saveGalleryBlob(job.rawBlob, fallbackName);
  state.galleryItems.unshift(item);
  renderGallery();
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
    currentCameraOverlayImages: state.currentCameraOverlayImages,
  };
}

function restoreRenderState(previous) {
  lookSelect.value = previous.filterFilename;
  cameraLookSelect.value = previous.filterFilename;
  intensitySlider.value = previous.intensity;
  state.effects = previous.effects;
  state.importedEffects = previous.importedEffects;
  state.currentCameraOverlayImages = previous.currentCameraOverlayImages;
  syncIntensityControlState();
  updateEffectControlState();
  syncEffectInputs();
  syncImportedEffectInputs();

  if (state.cameraActive && cameraPreview.videoWidth && cameraPreview.videoHeight) {
    state.source = cameraPreview;
    state.sourceName = "mobile-live-preview";
    state.sourceResolution = {
      width: cameraPreview.videoWidth,
      height: cameraPreview.videoHeight,
    };
    fitCanvasToSize(cameraPreview.videoWidth, cameraPreview.videoHeight, CAMERA_PREVIEW_MAX_SIDE);
    uploadSourceTexturePixels(cameraPreview);
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
  if (navigator.vibrate) {
    navigator.vibrate([22, 28, 22]);
  }
}

function flashCameraPreview() {
  cameraFlash.classList.remove("is-active");
  void cameraFlash.offsetWidth;
  cameraFlash.classList.add("is-active");
}

function updateCameraFlashState() {
  cameraFlashTint.classList.toggle("is-visible", state.cameraFlashEnabled);
  cameraFlashToggleButton.setAttribute("aria-pressed", String(state.cameraFlashEnabled));
}

function toggleCameraFlash() {
  state.cameraFlashEnabled = !state.cameraFlashEnabled;
  updateCameraFlashState();
}

async function ensureGalleryReady() {
  if (state.galleryDb) {
    return true;
  }
  if (state.galleryReadyPromise) {
    await state.galleryReadyPromise;
  }
  return Boolean(state.galleryDb);
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

function saveGalleryBlob(blob, filename) {
  return new Promise((resolve, reject) => {
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      filename,
      blob,
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

function renderGallery() {
  for (const url of state.galleryObjectUrls) {
    URL.revokeObjectURL(url);
  }
  state.galleryObjectUrls = [];
  galleryGrid.innerHTML = "";
  galleryEmpty.hidden = state.galleryItems.length > 0;

  for (const item of state.galleryItems) {
    const url = URL.createObjectURL(item.blob);
    state.galleryObjectUrls.push(url);

    const card = document.createElement("article");
    card.className = "mobile-gallery__item";

    const button = document.createElement("button");
    button.type = "button";
    button.addEventListener("click", () => openGalleryItem(item, url));

    const image = document.createElement("img");
    image.src = url;
    image.alt = "Local analogue shot";

    button.append(image);
    card.append(button);
    galleryGrid.append(card);
  }
}

function openGalleryItem(item, url) {
  state.selectedGalleryItem = item;
  galleryViewerImage.src = url;
  galleryViewer.hidden = false;
}

function closeGalleryItem() {
  state.selectedGalleryItem = null;
  galleryViewer.hidden = true;
  galleryViewerImage.removeAttribute("src");
}

async function saveSelectedGalleryItem() {
  const item = state.selectedGalleryItem;
  if (!item) {
    return;
  }

  const file = new File([item.blob], item.filename, { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Analoguecam photo" });
    return;
  }

  const url = URL.createObjectURL(item.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = item.filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const sizingImage = getCameraStackSizingImage(filename);
  if (!sizingImage) {
    fitCanvasToSize(sourceWidth, sourceHeight, maxSide);
    return;
  }

  const width = sizingImage.naturalWidth || sizingImage.width;
  const height = sizingImage.naturalHeight || sizingImage.height;
  if (!width || !height) {
    fitCanvasToSize(sourceWidth, sourceHeight, maxSide);
    return;
  }

  fitCanvasToSize(width, height, maxSide);
}

function getCameraStackSizingImage(filename) {
  const filter = state.filterMap.get(filename);
  if (!filter || isFrameDisabledCamera(filter)) {
    return null;
  }

  if (isFrameCroppedToPhotoCamera(filter)) {
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
  const longestSide = Math.max(width, height);
  const scale = Math.min(1, maxSide / longestSide);
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));
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

  const filter = state.filterMap.get(filename);
  let rgbBytes;

  if (filter?.custom) {
    setStatus(`Generating ${filter.name}...`);
    rgbBytes = generateCustomLut(filter.recipe);
  } else {
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
    rgbBytes = await decryptNomoLut(encrypted);
  }

  uploadLutTexture(rgbBytes);
  state.selectedFilterFilename = filename;
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
    renderPostEffectsStage(options);
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
      },
    );
  }

  uploadGrainTexture(output);
  renderBlit(state.grainTexture);
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
  return clampedBase * ((alpha * clampedBase) + (2 * overlay * (1 - clampedBase))) + clampedBase * (1 - alpha);
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

  return selected === 7 ? 0 : selected;
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
  const baseCanvas = createCompositeCanvas(rgba);
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
  return filter?.id === 49 || filter?.id === 50 || filter?.name === "McDonald’s" || filter?.name === "Lunar Rabbits";
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
    drawFrameCroppedToPhoto(context, image, alpha, region);
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
  drawOverlay(context, image, alpha, blendMode, {
    tiled: effect.params?.fillmode === "tiled",
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

function drawFrameCroppedToPhoto(context, image, alpha, region) {
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
  context.drawImage(image, drawX, drawY, frameWidth * scale, frameHeight * scale);
  context.restore();
}

function drawImageCover(context, image, x, y, width, height) {
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

function createCompositeCanvas(rgba) {
  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = canvas.width;
  compositeCanvas.height = canvas.height;
  const context = compositeCanvas.getContext("2d");
  const imageData = context.createImageData(canvas.width, canvas.height);
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
  } else {
    context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
  }
  context.restore();
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
    renderImage({ includeSpektraGrain: true });
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
  return Boolean(target.closest("button, select, input, label"));
}

function setCameraGalleryPeek(enabled) {
  document.body.classList.toggle("camera-gallery-peek", enabled);
}

function setCameraListOpen(open) {
  state.cameraListOpen = Boolean(open && state.cameraActive && isMobileView());
  document.body.classList.toggle("camera-list-open", state.cameraListOpen);
  cameraListDrawer.setAttribute("aria-hidden", String(!state.cameraListOpen));
}

function syncCameraListSelection() {
  const selected = lookSelect.value;
  for (const button of cameraList.querySelectorAll(".camera-list__item")) {
    button.classList.toggle("is-selected", button.dataset.filename === selected);
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
  workspace.style.transition = "none";

  if (!state.cameraSwipe.startedInCameraList && captureTarget?.setPointerCapture && typeof pointerId === "number") {
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
    if (state.cameraSwipe.axis === "vertical" && state.cameraListOpen) {
      cancelCameraSwipe(pointerId, event.currentTarget);
      return;
    }
    if (state.cameraSwipe.axis === "vertical") {
      setCameraGalleryPeek(true);
    }
  }

  if (state.cameraSwipe.axis === "horizontal") {
    const distance = state.cameraListOpen ? Math.max(0, -deltaX) : Math.max(0, deltaX);
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
  workspace.style.transform = `translateY(${-eased}px)`;
}

function cancelCameraSwipe(pointerId, captureTarget) {
  state.cameraSwipe.active = false;
  state.cameraSwipe.pointerId = null;
  state.cameraSwipe.axis = null;
  state.cameraSwipe.distance = 0;
  state.cameraSwipe.startedInCameraList = false;
  workspace.style.transition = "";
  workspace.style.transform = "";
  setCameraGalleryPeek(false);
  if (captureTarget?.hasPointerCapture?.(pointerId)) {
    captureTarget.releasePointerCapture(pointerId);
  }
}

function endCameraSwipe(pointerId, captureTarget) {
  if (!state.cameraSwipe.active || pointerId !== state.cameraSwipe.pointerId) {
    return;
  }

  const axis = state.cameraSwipe.axis;
  const shouldOpenCameraList = axis === "horizontal" && !state.cameraListOpen && state.cameraSwipe.distance > Math.min(90, window.innerWidth * 0.22);
  const shouldCloseCameraList = axis === "horizontal" && state.cameraListOpen && state.cameraSwipe.distance > Math.min(90, window.innerWidth * 0.22);
  const shouldOpenGallery = axis === "vertical" && state.cameraSwipe.distance > Math.min(140, window.innerHeight * 0.18);
  state.cameraSwipe.active = false;
  state.cameraSwipe.pointerId = null;
  state.cameraSwipe.axis = null;
  state.cameraSwipe.startedInCameraList = false;
  if (captureTarget?.hasPointerCapture?.(pointerId)) {
    captureTarget.releasePointerCapture(pointerId);
  }
  workspace.style.transition = "transform 220ms ease";

  if (shouldOpenCameraList || shouldCloseCameraList) {
    state.cameraSwipe.suppressNextListClick = shouldCloseCameraList && state.cameraSwipe.distance > 8;
    setCameraListOpen(shouldOpenCameraList);
    workspace.style.transition = "";
    workspace.style.transform = "";
    setCameraGalleryPeek(false);
    return;
  }

  if (shouldOpenGallery) {
    setCameraListOpen(false);
    workspace.style.transform = "translateY(-100svh)";
    window.setTimeout(() => {
      workspace.style.transition = "";
      workspace.style.transform = "";
      stopCamera();
    }, 220);
    return;
  }

  workspace.style.transform = "";
  window.setTimeout(() => {
    workspace.style.transition = "";
    setCameraGalleryPeek(false);
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

async function selectFilter(filename) {
  lookSelect.value = filename;
  cameraLookSelect.value = filename;
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

  await ensureLutTexture(filename);
  if (!state.cameraActive) {
    await ensureCameraOverlayImages(filename);
    if (state.sourceResolution.width && state.sourceResolution.height) {
      fitCanvasToFilterOutputSize(filename, state.sourceResolution.width, state.sourceResolution.height, STILL_IMAGE_MAX_SIDE);
    }
  }
  renderImageAfterSettingsChange();
  setStatus(`${state.filterMap.get(filename)?.name ?? filename} loaded.`);
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
  if (!refs) {
    return;
  }
  refs.input.checked = state.importedEffects.spektraGrain.enabled;
  refs.presetSelect.value = state.importedEffects.spektraGrain.preset;
  refs.presetSelect.disabled = !state.importedEffects.spektraGrain.enabled;
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

function getEffectById(effectId) {
  return EFFECT_CATALOG.find((effect) => effect.id === effectId);
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function disableControls(message) {
  fileInput.disabled = true;
  lookSelect.disabled = true;
  cameraLookSelect.disabled = true;
  intensitySlider.disabled = true;
  startCameraButton.disabled = true;
  capturePhotoButton.disabled = true;
  cameraCaptureButton.disabled = true;
  cameraPreviewGalleryButton.disabled = true;
  cameraFlashToggleButton.disabled = true;
  stopCameraButton.disabled = true;
  cameraSettingsButton.disabled = true;
  galleryCameraButton.disabled = true;
  gallerySettingsButton.disabled = true;
  gallerySaveButton.disabled = true;
  galleryCloseButton.disabled = true;
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
  const image = new Image();
  image.decoding = "async";
  image.src = path;
  await image.decode();
  return image;
}

function rerollOverlaySelections() {
  state.overlaySelections.grain = Math.floor(Math.random() * 997);
  state.overlaySelections.dust = Math.floor(Math.random() * NOMO_OVERLAY_PATHS.dust.length);
  state.overlaySelections.lightLeak = Math.floor(Math.random() * NOMO_OVERLAY_PATHS.lightLeak.length);
  state.overlaySelections.vignette = Math.floor(Math.random() * 997);
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
function handleCameraCaptureClick() {
  const captureTask = state.cameraActive ? saveCurrentCameraFrame() : captureCameraFrame();
  captureTask.catch((error) => {
    console.error(error);
    setStatus("Failed to capture the camera frame.");
  });
}

capturePhotoButton.addEventListener("click", handleCameraCaptureClick);
cameraCaptureButton.addEventListener("click", handleCameraCaptureClick);
cameraCaptureButton.addEventListener("pointerdown", vibrateCapture);
cameraPreviewGalleryButton.addEventListener("click", () => stopCamera());
cameraFlashToggleButton.addEventListener("click", toggleCameraFlash);
stopCameraButton.addEventListener("click", stopCamera);
cameraSettingsButton.addEventListener("click", () => stopCamera({ settings: true }));
galleryCameraButton.addEventListener("click", startCamera);
gallerySettingsButton.addEventListener("click", () => {
  state.mobileSettingsOpen = true;
  updateMobileCameraState();
});
settingsGalleryButton.addEventListener("click", () => {
  state.mobileSettingsOpen = false;
  updateMobileCameraState();
});
galleryCloseButton.addEventListener("click", closeGalleryItem);
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
window.addEventListener("resize", updateCanvasDisplaySize);
window.addEventListener("pagehide", stopCamera);
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
workspace.addEventListener("wheel", handleWorkspaceWheel, { passive: false });
canvas.addEventListener("pointerdown", startCanvasPan);
canvas.addEventListener("pointermove", moveCanvasPan);
canvas.addEventListener("pointerup", stopCanvasPan);
canvas.addEventListener("pointercancel", stopCanvasPan);
canvas.addEventListener("dblclick", resetCanvasView);
