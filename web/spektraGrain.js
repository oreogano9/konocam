const EPSILON = 1e-10;

export const SPEKTRA_GRAIN_EFFECT = {
  id: "spektraGrain",
  label: "Spektra Grain",
  defaultEnabled: false,
  defaultPreset: "Medium",
  defaultMode: "neutral",
  presets: ["Very Low", "Low", "Medium", "Strong", "Extreme"],
  modes: [
    { value: "neutral", label: "Neutral" },
    { value: "originalDensity", label: "Original Density" },
  ],
  anchor: "import:Spektrafilm/src/spektrafilm/model/grain.py|profile:kodak_gold_200|defaults:runtime.params_schema.GrainParams",
};

const SPEKTRA_GRAIN_BASE = {
  sublayersActive: true,
  agxParticleAreaUm2: 0.05,
  agxParticleScale: [0.55, 0.7, 1.1],
  agxParticleScaleLayers: [1.5, 0.8, 0.4],
  densityMin: [0.07, 0.08, 0.12],
  uniformity: [0.99, 0.99, 0.995],
  blur: 0.8,
  blurDyeCloudsUm: 0.6,
  microStructure: [0.08, 20.0],
};

const SPEKTRA_GRAIN_PRESETS = {
  "Very Low": { agxParticleAreaUm2: 0.05, blur: 0.8 },
  Low: { agxParticleAreaUm2: 2.5375, blur: 0.975 },
  Medium: { agxParticleAreaUm2: 5.025, blur: 1.15 },
  Strong: { agxParticleAreaUm2: 7.5125, blur: 1.325 },
  Extreme: { agxParticleAreaUm2: 10.0, blur: 1.5 },
};

export async function loadSpektraProfile(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load Spektrafilm profile ${path}: ${response.status}`);
  }

  const profile = await response.json();
  const logExposure = Float32Array.from(profile.data.log_exposure);
  const densityCurves = transposeCurveTable(profile.data.density_curves);
  const densityCurveMins = densityCurves.map((curve) => findFiniteMin(curve));
  const normalizedDensityCurves = densityCurves.map((curve, channel) => {
    const output = new Float32Array(curve.length);
    for (let index = 0; index < curve.length; index += 1) {
      output[index] = Number.isFinite(curve[index]) ? curve[index] - densityCurveMins[channel] : curve[index];
    }
    return output;
  });
  const densityCurvesLayers = transposeLayerCurveTable(profile.data.density_curves_layers);
  const densityMaxLayers = computeDensityMaxLayers(densityCurvesLayers);

  return {
    logExposure,
    normalizedDensityCurves,
    densityCurvesLayers,
    densityMaxLayers,
  };
}

export function applySpektraGrainToRgba(rgba, width, height, profile, options = {}) {
  const filmFormatMm = options.filmFormatMm ?? 35.0;
  const grain = getSpektraGrainPreset(options.preset ?? SPEKTRA_GRAIN_EFFECT.defaultPreset);
  const mode = normalizeSpektraMode(options.mode);
  const pixelSizeUm = (filmFormatMm * 1000) / Math.max(width, height);
  const linearRgb = rgbaToLinearRgb(rgba);
  const logRaw = linearRgbToLogRaw(linearRgb);
  const density = interpolateExposureToDensity(logRaw, profile.logExposure, profile.normalizedDensityCurves);
  const densityLayers = interpDensityCmyLayers(density, profile.normalizedDensityCurves, profile.densityCurvesLayers);
  const grainedDensity = applyGrainToDensityLayers(
    densityLayers,
    profile.densityMaxLayers,
    width,
    height,
    pixelSizeUm,
    grain,
  );

  const output = new Uint8Array(rgba.length);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const rgbOffset = pixelIndex * 3;
    const rgbaOffset = pixelIndex * 4;
    const neutralDeltaDensity =
      (grainedDensity[rgbOffset] - density[rgbOffset]) * 0.2126 +
      (grainedDensity[rgbOffset + 1] - density[rgbOffset + 1]) * 0.7152 +
      (grainedDensity[rgbOffset + 2] - density[rgbOffset + 2]) * 0.0722;
    const neutralGain = Math.pow(10, -neutralDeltaDensity);
    for (let channel = 0; channel < 3; channel += 1) {
      const channelDeltaDensity = grainedDensity[rgbOffset + channel] - density[rgbOffset + channel];
      const channelGain = mode === "originalDensity" ? Math.pow(10, -channelDeltaDensity) : neutralGain;
      const transformed = clamp01(linearRgb[rgbOffset + channel] * channelGain);
      output[rgbaOffset + channel] = linearToSrgbByte(transformed);
    }
    output[rgbaOffset + 3] = rgba[rgbaOffset + 3];
  }

  return output;
}

export function normalizeSpektraMode(mode) {
  return mode === "originalDensity" ? "originalDensity" : SPEKTRA_GRAIN_EFFECT.defaultMode;
}

function getSpektraGrainPreset(presetName) {
  const preset = SPEKTRA_GRAIN_PRESETS[presetName] ?? SPEKTRA_GRAIN_PRESETS[SPEKTRA_GRAIN_EFFECT.defaultPreset];
  return {
    ...SPEKTRA_GRAIN_BASE,
    agxParticleAreaUm2: preset.agxParticleAreaUm2,
    blur: preset.blur,
  };
}

function applyGrainToDensityLayers(densityLayers, densityMaxLayers, width, height, pixelSizeUm, grain) {
  const densityMaxTotal = [0, 0, 0];
  for (let channel = 0; channel < 3; channel += 1) {
    for (let layer = 0; layer < 3; layer += 1) {
      densityMaxTotal[channel] += densityMaxLayers[layer][channel];
    }
  }

  const densityMaxFractions = Array.from({ length: 3 }, () => new Float32Array(3));
  const densityMinLayers = Array.from({ length: 3 }, () => new Float32Array(3));
  const adjustedDensityMaxLayers = Array.from({ length: 3 }, () => new Float32Array(3));
  const nParticlesPerPixel = Array.from({ length: 3 }, () => new Float32Array(3));
  const pixelAreaUm2 = pixelSizeUm * pixelSizeUm;

  for (let layer = 0; layer < 3; layer += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      const fraction = densityMaxLayers[layer][channel] / Math.max(densityMaxTotal[channel], EPSILON);
      densityMaxFractions[layer][channel] = fraction;
      densityMinLayers[layer][channel] = fraction * grain.densityMin[channel];
      adjustedDensityMaxLayers[layer][channel] = densityMaxLayers[layer][channel] + densityMinLayers[layer][channel];
      const particleAreaLayer =
        grain.agxParticleAreaUm2 *
        grain.agxParticleScale[channel] *
        grain.agxParticleScaleLayers[layer];
      nParticlesPerPixel[layer][channel] = (pixelAreaUm2 * fraction) / Math.max(particleAreaLayer, EPSILON);
    }
  }

  const out = new Float32Array(width * height * 3);
  for (let channel = 0; channel < 3; channel += 1) {
    for (let layer = 0; layer < 3; layer += 1) {
      const plane = new Float32Array(width * height);
      for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
        const offset = pixelIndex * 9 + layer * 3 + channel;
        plane[pixelIndex] = densityLayers[offset] + densityMinLayers[layer][channel];
      }

      const layerGrain = layerParticleModel(
        plane,
        width,
        height,
        adjustedDensityMaxLayers[layer][channel],
        nParticlesPerPixel[layer][channel],
        grain.uniformity[channel],
        channel + layer * 10,
        grain.blurDyeCloudsUm,
      );

      for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
        out[pixelIndex * 3 + channel] += layerGrain[pixelIndex];
      }
    }
  }

  addMicroStructure(out, width, height, pixelSizeUm, grain.microStructure);

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const offset = pixelIndex * 3;
    out[offset] -= grain.densityMin[0];
    out[offset + 1] -= grain.densityMin[1];
    out[offset + 2] -= grain.densityMin[2];
  }

  if (grain.blur > 0) {
    for (let channel = 0; channel < 3; channel += 1) {
      const plane = extractPlane(out, width, height, channel);
      const blurred = gaussianBlurPlane(plane, width, height, grain.blur);
      writePlane(out, blurred, width, height, channel);
    }
  }

  return out;
}

function layerParticleModel(plane, width, height, densityMax, nParticlesPerPixel, grainUniformity, seed, blurParticle) {
  const rng = createMulberry32(seed);
  const odParticle = densityMax / Math.max(nParticlesPerPixel, EPSILON);
  const grain = new Float32Array(plane.length);

  for (let index = 0; index < plane.length; index += 1) {
    const probability = clamp(plane[index] / Math.max(densityMax, EPSILON), 1e-6, 1 - 1e-6);
    const saturation = 1 - probability * grainUniformity * (1 - 1e-6);
    const lambda = (nParticlesPerPixel / Math.max(saturation, EPSILON)) * probability;
    grain[index] = samplePoisson(lambda, rng) * odParticle * saturation;
  }

  if (blurParticle > 0) {
    return gaussianBlurPlane(grain, width, height, blurParticle * Math.sqrt(Math.max(odParticle, 0)));
  }

  return grain;
}

function addMicroStructure(density, width, height, pixelSizeUm, microStructure) {
  const blurPixel = microStructure[0] / pixelSizeUm;
  const sigma = (microStructure[1] * 0.001) / pixelSizeUm;
  if (sigma <= 0.05) {
    return;
  }

  for (let channel = 0; channel < 3; channel += 1) {
    const rng = createMulberry32(1000 + channel);
    let clumping = new Float32Array(width * height);
    for (let index = 0; index < clumping.length; index += 1) {
      clumping[index] = sampleLognormalFromMeanStd(1.0, sigma, rng);
    }
    if (blurPixel > 0.4) {
      clumping = gaussianBlurPlane(clumping, width, height, blurPixel);
    }

    for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
      density[pixelIndex * 3 + channel] *= clumping[pixelIndex];
    }
  }
}

function interpolateExposureToDensity(logRaw, logExposure, densityCurves) {
  const out = new Float32Array(logRaw.length);
  for (let index = 0; index < logRaw.length; index += 3) {
    out[index] = interpolateScalar(logRaw[index], logExposure, densityCurves[0]);
    out[index + 1] = interpolateScalar(logRaw[index + 1], logExposure, densityCurves[1]);
    out[index + 2] = interpolateScalar(logRaw[index + 2], logExposure, densityCurves[2]);
  }
  return out;
}

function interpDensityCmyLayers(density, densityCurves, densityCurvesLayers) {
  const out = new Float32Array((density.length / 3) * 9);
  for (let pixelIndex = 0; pixelIndex < density.length / 3; pixelIndex += 1) {
    const densityOffset = pixelIndex * 3;
    const outOffset = pixelIndex * 9;
    for (let channel = 0; channel < 3; channel += 1) {
      const value = density[densityOffset + channel];
      for (let layer = 0; layer < 3; layer += 1) {
        out[outOffset + layer * 3 + channel] = interpolateScalar(
          value,
          densityCurves[channel],
          densityCurvesLayers[layer][channel],
        );
      }
    }
  }
  return out;
}

function rgbaToLinearRgb(rgba) {
  const out = new Float32Array((rgba.length / 4) * 3);
  for (let pixelIndex = 0; pixelIndex < rgba.length / 4; pixelIndex += 1) {
    const rgbaOffset = pixelIndex * 4;
    const outOffset = pixelIndex * 3;
    out[outOffset] = srgbToLinear(rgba[rgbaOffset] / 255);
    out[outOffset + 1] = srgbToLinear(rgba[rgbaOffset + 1] / 255);
    out[outOffset + 2] = srgbToLinear(rgba[rgbaOffset + 2] / 255);
  }
  return out;
}

function linearRgbToLogRaw(linearRgb) {
  const out = new Float32Array(linearRgb.length);
  for (let index = 0; index < linearRgb.length; index += 1) {
    out[index] = Math.log10(Math.max(linearRgb[index], 0) + EPSILON);
  }
  return out;
}

function gaussianBlurPlane(plane, width, height, sigma) {
  if (!(sigma > 0.0)) {
    return plane.slice();
  }

  const radius = Math.max(0, Math.floor(sigma * 3 + 0.5));
  if (radius === 0) {
    return plane.slice();
  }
  const kernel = buildGaussianKernel(radius, sigma);
  const horizontal = new Float32Array(plane.length);
  const output = new Float32Array(plane.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sampleX = reflectIndex(x + k, width);
        sum += plane[y * width + sampleX] * kernel[k + radius];
      }
      horizontal[y * width + x] = sum;
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sampleY = reflectIndex(y + k, height);
        sum += horizontal[sampleY * width + x] * kernel[k + radius];
      }
      output[y * width + x] = sum;
    }
  }

  return output;
}

function buildGaussianKernel(radius, sigma) {
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let index = -radius; index <= radius; index += 1) {
    const value = Math.exp(-(index * index) / (2 * sigma * sigma));
    kernel[index + radius] = value;
    sum += value;
  }
  for (let index = 0; index < kernel.length; index += 1) {
    kernel[index] /= sum;
  }
  return kernel;
}

function samplePoisson(lambda, rng) {
  if (lambda <= 0.0) {
    return 0;
  }
  if (lambda < 30.0) {
    const limit = Math.exp(-lambda);
    let product = 1.0;
    let count = 0;
    while (product > limit) {
      count += 1;
      product *= rng();
    }
    return count - 1;
  }

  const sample = Math.round(lambda + Math.sqrt(lambda) * sampleStandardNormal(rng));
  return Math.max(0, sample);
}

function sampleLognormalFromMeanStd(mean, std, rng) {
  if (mean <= 0) {
    return 1.0;
  }
  const sigma2 = Math.log(1 + (std * std) / (mean * mean));
  const sigma = Math.sqrt(Math.max(0, sigma2));
  const mu = Math.log(mean) - sigma2 / 2;
  if (sigma < 1e-6) {
    return Math.exp(mu);
  }
  return Math.exp(mu + sigma * sampleStandardNormal(rng));
}

function sampleStandardNormal(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) {
    u = rng();
  }
  while (v === 0) {
    v = rng();
  }
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function createMulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function extractPlane(data, width, height, channel) {
  const plane = new Float32Array(width * height);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    plane[pixelIndex] = data[pixelIndex * 3 + channel];
  }
  return plane;
}

function writePlane(data, plane, width, height, channel) {
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    data[pixelIndex * 3 + channel] = plane[pixelIndex];
  }
}

function transposeCurveTable(table) {
  return [0, 1, 2].map((channel) => Float32Array.from(table.map((row) => row[channel])));
}

function transposeLayerCurveTable(table) {
  return [0, 1, 2].map((layer) =>
    [0, 1, 2].map((channel) => Float32Array.from(table.map((row) => row[layer][channel]))),
  );
}

function computeDensityMaxLayers(densityCurvesLayers) {
  return densityCurvesLayers.map((layer) => layer.map((curve) => findFiniteMax(curve)));
}

function interpolateScalar(value, xs, ys) {
  if (value <= xs[0]) {
    return ys[0];
  }
  if (value >= xs[xs.length - 1]) {
    return ys[ys.length - 1];
  }

  let low = 0;
  let high = xs.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (xs[mid] <= value) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const span = xs[high] - xs[low];
  if (Math.abs(span) < EPSILON) {
    return ys[low];
  }
  const t = (value - xs[low]) / span;
  return ys[low] + (ys[high] - ys[low]) * t;
}

function findFiniteMin(values) {
  let min = Number.POSITIVE_INFINITY;
  for (let index = 0; index < values.length; index += 1) {
    if (Number.isFinite(values[index])) {
      min = Math.min(min, values[index]);
    }
  }
  return Number.isFinite(min) ? min : 0;
}

function findFiniteMax(values) {
  let max = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < values.length; index += 1) {
    if (Number.isFinite(values[index])) {
      max = Math.max(max, values[index]);
    }
  }
  return Number.isFinite(max) ? max : 0;
}

function srgbToLinear(value) {
  if (value <= 0.04045) {
    return value / 12.92;
  }
  return Math.pow((value + 0.055) / 1.055, 2.4);
}

function linearToSrgbByte(value) {
  const encoded = value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(clamp01(encoded) * 255);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function clampInt(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function reflectIndex(value, size) {
  if (size <= 1) {
    return 0;
  }
  if (value >= 0 && value < size) {
    return value;
  }
  const period = size * 2;
  let reflected = value % period;
  if (reflected < 0) {
    reflected += period;
  }
  return reflected >= size ? period - 1 - reflected : reflected;
}
