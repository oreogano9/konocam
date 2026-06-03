import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../web/styles.css", import.meta.url), "utf8");
const nativeSource = readFileSync(new URL("../ios/App/App/AppDelegate.swift", import.meta.url), "utf8");

const checks = [
  {
    name: "web GIF capture requests smoother 15fps playback",
    source: appSource,
    pattern: /const GIF_CAPTURE_FPS = 15;/,
  },
  {
    name: "web GIF capture uses a higher quality 960px max side",
    source: appSource,
    pattern: /const GIF_CAPTURE_MAX_SIDE = 960;/,
  },
  {
    name: "native GIF capture defaults to 15fps and clamps up to 15fps",
    source: nativeSource,
    pattern: /fps: max\(2\.0, min\(15\.0, call\.getDouble\("fps", 15\.0\)\)\)/,
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
    name: "native GIF gallery metadata preserves output dimensions and orientation",
    source: nativeSource,
    pattern: /"mediaType": "gif"[\s\S]*"gifOutputFrameCount": outputFrameCount,[\s\S]*"width": outputSize\.width,[\s\S]*"height": outputSize\.height,[\s\S]*"orientation": self\.orientationName\(request\.captureOrientation\),[\s\S]*"orientationSource": request\.captureOrientationSource/,
  },
  {
    name: "native gallery repairs missing image and GIF dimensions while listing",
    source: nativeSource,
    pattern: /if !hasPositiveGalleryDimensions\(item\),[\s\S]*let data = try\? Data\(contentsOf: url\),[\s\S]*let dimensions = imagePixelSize\(from: data\)[\s\S]*item\["width"\] = dimensions\.width[\s\S]*private func hasPositiveGalleryDimensions\(_ item: JSObject\) -> Bool/,
  },
  {
    name: "gallery viewer reveals cached images/GIFs and videos without getting stuck",
    source: appSource,
    pattern: /function revealGalleryViewerForToken\(token, options = \{\}\)[\s\S]*galleryViewer\.hidden = false;[\s\S]*function updateGalleryViewerImageDimensions\(item\)[\s\S]*galleryViewerImage\.naturalWidth[\s\S]*applyGalleryViewerMediaAspect\(item\)[\s\S]*revealGalleryViewerForToken\(loadToken, options\);[\s\S]*galleryViewerVideo\.onloadedmetadata = \(\) => \{[\s\S]*applyGalleryViewerMediaAspect\(item\);[\s\S]*window\.setTimeout\(\(\) => revealGalleryViewerForToken\(loadToken, options\), 500\);[\s\S]*updateGalleryViewerImageDimensions\(item\);/,
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
    name: "gallery viewer uses an opaque black background instead of a see-through overlay",
    source: stylesSource,
    pattern: /\.gallery-viewer \{[\s\S]*background: #050505;[\s\S]*position: fixed;/,
  },
  {
    name: "gallery grid uses dense adaptive masonry rows",
    source: stylesSource,
    pattern: /\.mobile-gallery__grid \{[\s\S]*display: grid;[\s\S]*gap: 0\.5rem;[\s\S]*grid-auto-flow: dense;[\s\S]*grid-auto-rows: 6px;[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
  },
  {
    name: "gallery three-column setting maps to CSS grid columns",
    source: stylesSource,
    pattern: /body\.gallery-two-column \.mobile-gallery__grid \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*\}/,
  },
  {
    name: "gallery cards span adaptive masonry rows",
    source: stylesSource,
    pattern: /\.mobile-gallery__item \{[\s\S]*contain: content;[\s\S]*grid-row: span var\(--gallery-item-row-span, 40\);[\s\S]*margin: 0;/,
  },
  {
    name: "gallery card buttons fill adaptive masonry cells",
    source: stylesSource,
    pattern: /\.mobile-gallery__item button \{[\s\S]*height: 100%;[\s\S]*width: 100%;/,
  },
  {
    name: "virtual gallery spacers span all grid columns and enough rows",
    source: stylesSource,
    pattern: /\.mobile-gallery__spacer \{[\s\S]*display: block;[\s\S]*grid-column: 1 \/ -1;[\s\S]*grid-row: span var\(--gallery-spacer-row-span, 1\);/,
  },
  {
    name: "gallery column measurement reads CSS grid columns",
    source: appSource,
    pattern: /function getGalleryGridColumnCount\(\)[\s\S]*const styles = window\.getComputedStyle\(galleryGrid\);[\s\S]*const template = styles\.gridTemplateColumns;[\s\S]*return Math\.max\(1, columns \|\| 1\);/,
  },
  {
    name: "gallery card row span is computed from real aspect ratio",
    source: appSource,
    pattern: /function applyGalleryCardAspectRatio\(card, item\)[\s\S]*--gallery-item-row-span[\s\S]*function getGalleryItemRowSpan\(item, aspect = getGalleryItemAspectRatio\(item\)\)[\s\S]*GALLERY_GRID_ROW_HEIGHT/,
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
