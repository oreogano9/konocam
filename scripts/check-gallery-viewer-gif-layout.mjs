import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");
const nativeSource = readFileSync(new URL("../ios/App/App/AppDelegate.swift", import.meta.url), "utf8");

const checks = [
  {
    name: "web GIF capture requests smoother 12fps playback",
    source: appSource,
    pattern: /const GIF_CAPTURE_FPS = 12;/,
  },
  {
    name: "web GIF capture uses a higher quality 960px max side",
    source: appSource,
    pattern: /const GIF_CAPTURE_MAX_SIDE = 960;/,
  },
  {
    name: "native GIF capture defaults to 12fps and clamps up to 12fps",
    source: nativeSource,
    pattern: /fps: max\(2\.0, min\(12\.0, call\.getDouble\("fps", 12\.0\)\)\)/,
  },
  {
    name: "native GIF source frames use high quality JPEG normalization",
    source: nativeSource,
    pattern: /image\.jpegData\(compressionQuality: 0\.98\)/,
  },
  {
    name: "native GIF output uses orientation-swapped render dimensions",
    source: nativeSource,
    pattern: /let outputSize = self\.orientedOutputSize\([\s\S]*width: request\.width,[\s\S]*height: request\.height,[\s\S]*orientation: request\.captureOrientation[\s\S]*renderNativeStack\([\s\S]*width: outputSize\.width,[\s\S]*height: outputSize\.height/,
  },
  {
    name: "native GIF response reports orientation-swapped dimensions",
    source: nativeSource,
    pattern: /"orientation": self\.orientationName\(request\.captureOrientation\)[\s\S]*"width": outputSize\.width,[\s\S]*"height": outputSize\.height,/,
  },
  {
    name: "gallery viewer only shows initial overlay after selected media loads",
    source: appSource,
    pattern: /function showGalleryViewerItem\(item, options = \{\}\)[\s\S]*galleryViewerImage\.onload = \(\) => \{[\s\S]*if \(options\.showOnLoad\) \{[\s\S]*galleryViewer\.hidden = false;[\s\S]*\}[\s\S]*async function openGalleryItem\(item\)[\s\S]*if \(!showGalleryViewerItem\(item, \{ showOnLoad: true \}\)\) \{/,
  },
  {
    name: "gallery viewer recovers from image and GIF load failures",
    source: appSource,
    pattern: /function handleGalleryViewerImageError\(item, token\)[\s\S]*token !== state\.selectedGalleryLoadToken[\s\S]*debugEvent\("gallery-viewer:image-error"[\s\S]*closeGalleryItem\(\);[\s\S]*setStatus\("Selected gallery image is unavailable\."\);[\s\S]*galleryViewerImage\.onerror = \(\) => handleGalleryViewerImageError\(item, loadToken\);/,
  },
  {
    name: "gallery viewer clears stale selected media before loading",
    source: appSource,
    pattern: /function showGalleryViewerItem\(item, options = \{\}\)[\s\S]*URL\.revokeObjectURL\(state\.selectedGalleryObjectUrl\);[\s\S]*galleryViewerImage\.onload = null;[\s\S]*galleryViewerImage\.onerror = null;[\s\S]*galleryViewerImage\.removeAttribute\("src"\);[\s\S]*galleryViewerImage\.dataset\.loadToken = String\(loadToken\);[\s\S]*galleryViewerImage\.src = url;/,
  },
  {
    name: "gallery grid uses CSS columns for adaptive packing",
    source: stylesSource,
    pattern: /\.mobile-gallery__grid \{[\s\S]*column-count: 2;[\s\S]*column-gap: 0\.5rem;[\s\S]*display: block;/,
  },
  {
    name: "gallery three-column setting maps to packed CSS columns",
    source: stylesSource,
    pattern: /body\.gallery-two-column \.mobile-gallery__grid \{[\s\S]*column-count: 3;[\s\S]*\}/,
  },
  {
    name: "gallery cards avoid breaking across packed columns",
    source: stylesSource,
    pattern: /\.mobile-gallery__item \{[\s\S]*break-inside: avoid;[\s\S]*margin: 0 0 0\.5rem;/,
  },
  {
    name: "virtual gallery spacers span packed columns",
    source: stylesSource,
    pattern: /\.mobile-gallery__spacer \{[\s\S]*break-inside: avoid;[\s\S]*column-span: all;/,
  },
  {
    name: "gallery column measurement reads CSS column count",
    source: appSource,
    pattern: /function getGalleryGridColumnCount\(\)[\s\S]*const styles = window\.getComputedStyle\(galleryGrid\);[\s\S]*const cssColumnCount = Number\.parseInt\(styles\.columnCount, 10\);[\s\S]*return cssColumnCount;/,
  },
  {
    name: "virtual gallery row math reads CSS column gap",
    source: appSource,
    pattern: /function getGalleryGridGapPx\(\)[\s\S]*styles\.columnGap/,
  },
];

const failures = checks.filter((check) => !check.pattern.test(check.source));

if (failures.length) {
  console.error("Gallery viewer/GIF/layout invariant check failed:");
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log(`Gallery viewer/GIF/layout invariants ok (${checks.length} checks).`);
