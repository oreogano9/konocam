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
    name: "gallery viewer reveals cached images/GIFs and videos without getting stuck",
    source: appSource,
    pattern: /function revealGalleryViewerForToken\(token, options = \{\}\)[\s\S]*galleryViewer\.hidden = false;[\s\S]*galleryViewerVideo\.onloadedmetadata = \(\) => \{[\s\S]*revealGalleryViewerForToken\(loadToken, options\);[\s\S]*window\.setTimeout\(\(\) => revealGalleryViewerForToken\(loadToken, options\), 500\);[\s\S]*galleryViewerImage\.complete && galleryViewerImage\.naturalWidth > 0[\s\S]*revealGalleryViewerForToken\(loadToken, options\)/,
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
    name: "gallery grid uses CSS grid for horizontal row-major loading",
    source: stylesSource,
    pattern: /\.mobile-gallery__grid \{[\s\S]*display: grid;[\s\S]*gap: 0\.5rem;[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  },
  {
    name: "gallery three-column setting maps to CSS grid columns",
    source: stylesSource,
    pattern: /body\.gallery-two-column \.mobile-gallery__grid \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*\}/,
  },
  {
    name: "gallery cards are clean grid items",
    source: stylesSource,
    pattern: /\.mobile-gallery__item \{[\s\S]*contain: content;[\s\S]*margin: 0;/,
  },
  {
    name: "virtual gallery spacers span all grid columns",
    source: stylesSource,
    pattern: /\.mobile-gallery__spacer \{[\s\S]*display: block;[\s\S]*grid-column: 1 \/ -1;/,
  },
  {
    name: "gallery column measurement reads CSS grid columns",
    source: appSource,
    pattern: /function getGalleryGridColumnCount\(\)[\s\S]*const styles = window\.getComputedStyle\(galleryGrid\);[\s\S]*const template = styles\.gridTemplateColumns;[\s\S]*return Math\.max\(1, columns \|\| 1\);/,
  },
  {
    name: "virtual gallery row math reads CSS grid row gap",
    source: appSource,
    pattern: /function getGalleryGridGapPx\(\)[\s\S]*Number\.parseFloat\(styles\.rowGap \|\| styles\.gap \|\| "0"\)/,
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
