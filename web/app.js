import { EFFECT_CATALOG, EFFECT_DEFAULTS, EFFECT_GROUPS, VISIBLE_EFFECTS } from "./effectCatalog.js";
import { applySpektraGrainToRgba, loadSpektraProfile, SPEKTRA_GRAIN_EFFECT } from "./spektraGrain.js";

const canvas = document.querySelector("#processedCanvas");
const workspace = document.querySelector(".image-workspace");
const emptyState = document.querySelector("#emptyState");
const cameraShell = document.querySelector("#cameraShell");
const cameraPreview = document.querySelector("#cameraPreview");
const cameraPresetLabel = document.querySelector("#cameraPresetLabel");
const cameraLookSelect = document.querySelector("#cameraLookSelect");
const fileInput = document.querySelector("#fileInput");
const lookSelect = document.querySelector("#lookSelect");
const intensitySlider = document.querySelector("#intensitySlider");
const intensityValue = document.querySelector("#intensityValue");
const effectsRoot = document.querySelector("#effectsRoot");
const importedEffectsRoot = document.querySelector("#importedEffectsRoot");
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
const FILTER_SERIES_PATH = "./nomo/filters/series.json";
const FILTERS_ROOT = "./nomo/filters";
const LUTS_ROOT = "./nomo/dat";
const OVERLAYS_ROOT = "./nomo/overlays";
const SPECIFIC_COMBINATIONS_PATH = "./nomo/SpecificCombinations.json";
const SPEKTRA_PROFILE_PATH = "./spektrafilm/profiles/kodak_gold_200.json";
const MOBILE_MEDIA_QUERY = window.matchMedia("(max-width: 900px)");
const COLOR_MATRIX = new Float32Array([
  0.24, 0.68, 0.08, 0.0,
  0.24, 0.68, 0.08, 0.0,
  0.24, 0.68, 0.08, 0.0,
  0.0, 0.0, 0.0, 1.0,
]);

const CUSTOM_KODAK_GROUP = "Kodak Inspired (Custom)";
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
const CUSTOM_KODAK_FILTERS = [
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-funsaver-800", name: "Kodak FunSaver 800", custom: true, recipe: "funsaver800" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-gold-200", name: "Kodak Gold 200", custom: true, recipe: "gold200" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-ultramax-400", name: "Kodak UltraMax 400", custom: true, recipe: "ultramax400" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-colorplus-200", name: "Kodak ColorPlus 200", custom: true, recipe: "colorplus200" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-pro-image-100", name: "Kodak Pro Image 100", custom: true, recipe: "proimage100" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-portra-160", name: "Kodak Portra 160", custom: true, recipe: "portra160" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-portra-400", name: "Kodak Portra 400", custom: true, recipe: "portra400" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-portra-800", name: "Kodak Portra 800", custom: true, recipe: "portra800" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-ektar-100", name: "Kodak Ektar 100", custom: true, recipe: "ektar100" },
  { group: CUSTOM_KODAK_GROUP, groupFilename: "custom-kodak", filterId: -1, filename: "custom-kodak-tri-x-400", name: "Kodak Tri-X 400", custom: true, recipe: "trix400" },
];

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
  nomoOverlayImages: null,
  overlaySelections: {
    dust: 0,
    lightLeak: 0,
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
};

const defaults = {
  intensity: 100,
};

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
  state.spektraProfile = await loadSpektraProfile(SPEKTRA_PROFILE_PATH);
  state.nomoOverlayImages = await loadNomoOverlayImages();
  state.filters = await loadFilterCatalog();
  populateFilterSelect(state.filters);
  state.filterEffectDefaults = await loadFilterEffectDefaults(state.filters);
  applyFilterEffectDefaults(lookSelect.value);
  state.selectedFilterFilename = "";
  syncIntensityControlState();
  updateEffectControlState();
  updateMobileCameraState();
  queueMobileCameraAutostart();
  setStatus("Open a photo to start.");
}

async function loadNomoOverlayImages() {
  return {
    nomoGrain: await loadOverlayImage(`${OVERLAYS_ROOT}/${NOMO_OVERLAY_PATHS.nomoGrain}`),
    vignette: await loadOverlayImage(`${OVERLAYS_ROOT}/${NOMO_OVERLAY_PATHS.vignette}`),
    dust: await Promise.all(NOMO_OVERLAY_PATHS.dust.map((name) => loadOverlayImage(`${OVERLAYS_ROOT}/${name}`))),
    lightLeak: await Promise.all(NOMO_OVERLAY_PATHS.lightLeak.map((name) => loadOverlayImage(`${OVERLAYS_ROOT}/${name}`))),
  };
}

async function loadFilterCatalog() {
  const series = await fetchJson(FILTER_SERIES_PATH);
  const allFilters = [];

  for (const family of series) {
    const familyEntries = await fetchJson(`${FILTERS_ROOT}/${family.filename}.json`);
    for (const entry of familyEntries) {
      allFilters.push({
        group: family.name_en,
        groupFilename: family.filename,
        filterId: family.filter_id,
        filename: entry.filename,
        name: entry.name_en,
        nameChs: entry.name_chs,
        nameCht: entry.name_cht,
      });
    }
  }

  for (const filter of allFilters) {
    state.filterMap.set(filter.filename, filter);
  }

  for (const filter of CUSTOM_KODAK_FILTERS) {
    allFilters.push(filter);
    state.filterMap.set(filter.filename, filter);
  }

  return allFilters;
}

function populateFilterSelect(filters) {
  lookSelect.innerHTML = "";
  cameraLookSelect.innerHTML = "";
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
  }

  lookSelect.disabled = filters.length === 0;
  cameraLookSelect.disabled = filters.length === 0;
}

async function loadFilterEffectDefaults(filters) {
  const combinations = await fetchJson(SPECIFIC_COMBINATIONS_PATH);
  const defaultsByFilter = new Map();
  const filtersByMode = new Map();

  for (const filter of filters) {
    filtersByMode.set(filter.filename, filter);
    filtersByMode.set(filter.name, filter);
  }

  for (const combination of combinations) {
    const specifics = combination.specifics ?? combination.Specifics ?? [];
    const preset = specifics.find((specific) => specific.Type === "Preset");
    const filter = preset?.Mode ? filtersByMode.get(preset.Mode) : null;

    if (!filter || filter.custom) {
      continue;
    }

    const defaultsForFilter = {};
    for (const specific of specifics) {
      const mapped = mapApkSpecificToEffectDefault(specific);
      if (!mapped) {
        continue;
      }
      defaultsForFilter[mapped.id] = mapped.value;
    }

    if (Object.keys(defaultsForFilter).length) {
      defaultsByFilter.set(filter.filename, defaultsForFilter);
    }
  }

  return defaultsByFilter;
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

function updateMobileCameraState() {
  const mobile = isMobileView();
  const cameraSupported = Boolean(navigator.mediaDevices?.getUserMedia);
  const canOpen = mobile && cameraSupported && !state.cameraActive && !lookSelect.disabled;

  startCameraButton.disabled = !canOpen;
  capturePhotoButton.disabled = !mobile || !state.cameraActive;
  cameraCaptureButton.disabled = !mobile || !state.cameraActive;
  stopCameraButton.disabled = !mobile || !state.cameraActive;
  cameraSettingsButton.disabled = !mobile || !state.cameraActive;
  cameraLookSelect.disabled = !mobile || lookSelect.disabled;
  cameraLookSelect.value = lookSelect.value;
  cameraPresetLabel.textContent = state.cameraActive
    ? `Live preview: ${state.filterMap.get(lookSelect.value)?.name ?? "selected preset"}`
    : "Ready to capture with the selected preset.";
  document.body.classList.toggle("camera-mode-active", mobile && state.cameraActive);
}

function queueMobileCameraAutostart() {
  if (!isMobileView() || state.cameraAutostartAttempted || lookSelect.disabled) {
    return;
  }

  state.cameraAutostartAttempted = true;
  window.setTimeout(() => {
    if (isMobileView() && !state.cameraActive) {
      startCamera();
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
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
      },
      audio: false,
    });

    state.cameraStream = stream;
    state.cameraActive = true;
    cameraPreview.srcObject = stream;
    await cameraPreview.play();
    resetCanvasView();
    cameraShell.hidden = false;
    canvas.style.display = "block";
    emptyState.style.display = "none";
    updateMobileCameraState();
    startLiveCameraRender();
    setStatus("Camera ready. Live preview uses the selected preset.");
  } catch (error) {
    console.error(error);
    setStatus("Unable to open the camera.");
    updateMobileCameraState();
  }
}

function stopCamera() {
  stopLiveCameraRender();

  if (state.cameraStream) {
    for (const track of state.cameraStream.getTracks()) {
      track.stop();
    }
  }

  state.cameraStream = null;
  state.cameraActive = false;
  cameraPreview.srcObject = null;
  cameraShell.hidden = true;
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
      fitCanvasToSize(cameraPreview.videoWidth, cameraPreview.videoHeight, 1280);
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
  const blob = await new Promise((resolve) => captureCanvas.toBlob(resolve, "image/jpeg", 0.92));
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

  if (navigator.vibrate) {
    navigator.vibrate(35);
  }

  stopLiveCameraRender();
  renderImage({ includeSpektraGrain: true });

  const selected = state.filterMap.get(lookSelect.value);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (state.cameraActive) {
    startLiveCameraRender();
  }
  if (!blob) {
    setStatus("Failed to save the camera frame.");
    return;
  }

  const filename = `analoguecam-${selected?.filename ?? "camera"}-${Date.now()}.jpg`;
  const file = new File([blob], filename, { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Analoguecam photo" });
      setStatus("Opened save/share sheet for current camera frame.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        setStatus("Failed to open the save/share sheet.");
      }
    }
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("Saved current camera frame.");
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
  renderImage();
  setStatus(`${state.filterMap.get(lookSelect.value)?.name ?? lookSelect.value} loaded.`);
}

function fitCanvasToImage(image) {
  fitCanvasToSize(image.naturalWidth, image.naturalHeight, 2200);
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
    const response = await fetch(`${LUTS_ROOT}/${filename}.dat`);
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

  if (hasNomoOverlayEffects()) {
    output = compositeNomoOverlays(output);
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

function hasNomoOverlayEffects() {
  return (
    state.effects.nomoGrain?.value > 0 ||
    state.effects.dust?.value > 0 ||
    state.effects.lightLeak?.value > 0 ||
    state.effects.vignette?.value > 0
  );
}

function compositeNomoOverlays(rgba) {
  const baseCanvas = createCompositeCanvas(rgba);
  const context = baseCanvas.getContext("2d");

  if (!context || !state.nomoOverlayImages) {
    return rgba;
  }

  if (state.effects.nomoGrain.value > 0) {
    drawOverlay(context, state.nomoOverlayImages.nomoGrain, state.effects.nomoGrain.value / 10, "overlay");
  }

  if (state.effects.dust.value > 0) {
    const dustImage = state.nomoOverlayImages.dust[state.overlaySelections.dust % state.nomoOverlayImages.dust.length];
    drawOverlay(context, dustImage, state.effects.dust.value / 10, "screen", { flipXY: true });
  }

  if (state.effects.lightLeak.value > 0) {
    const leakImage = state.nomoOverlayImages.lightLeak[state.overlaySelections.lightLeak % state.nomoOverlayImages.lightLeak.length];
    drawOverlay(context, leakImage, state.effects.lightLeak.value / 10, "screen");
  }

  if (state.effects.vignette.value > 0) {
    drawOverlay(context, state.nomoOverlayImages.vignette, state.effects.vignette.value / 10, "multiply", { flipXY: true });
  }

  return new Uint8Array(context.getImageData(0, 0, baseCanvas.width, baseCanvas.height).data);
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
  context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
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
  link.href = canvas.toDataURL("image/jpeg", 0.92);
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

async function selectFilter(filename) {
  lookSelect.value = filename;
  cameraLookSelect.value = filename;
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
  stopCameraButton.disabled = true;
  cameraSettingsButton.disabled = true;
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
  state.overlaySelections.dust = Math.floor(Math.random() * NOMO_OVERLAY_PATHS.dust.length);
  state.overlaySelections.lightLeak = Math.floor(Math.random() * NOMO_OVERLAY_PATHS.lightLeak.length);
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
stopCameraButton.addEventListener("click", stopCamera);
cameraSettingsButton.addEventListener("click", stopCamera);

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
workspace.addEventListener("wheel", handleWorkspaceWheel, { passive: false });
canvas.addEventListener("pointerdown", startCanvasPan);
canvas.addEventListener("pointermove", moveCanvasPan);
canvas.addEventListener("pointerup", stopCanvasPan);
canvas.addEventListener("pointercancel", stopCanvasPan);
canvas.addEventListener("dblclick", resetCanvasView);
