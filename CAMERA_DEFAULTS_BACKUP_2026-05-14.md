# Camera Defaults Backup

Generated: 2026-05-14 12:31 CEST

Purpose: backup of the current per-camera default effect settings before changing NOMO Grain to max for every camera by default.

Notes:
- Values below are the app-effective camera defaults for camera default effects only: `nomoGrain`, `dust`, `vignette`, and `lightLeak`.
- Base effect defaults remain the catalog defaults in `web/effectCatalog.js`.
- `135 GR` had an explicit app override before this backup: `nomoGrain: 10`, `dust: 5`.
- Some cameras have raw NOMO defaults that the app ignored because the corresponding APK effect is marked ignored or unsupported.

| Camera | Filename | Grain | Dust | Vignette | Light leak | Raw default keys |
|---|---:|---:|---:|---:|---:|---|
| 135 B | camera-0 | 5 | 2 | 5 | 0 | exposure, contrast, nomoGrain, dust, vignette, prism, fade, highlight |
| INS W | camera-1 | 7 | 3 | 8 | 0 | exposure, contrast, saturation, nomoGrain, dust, vignette, prism, fade, highlight, tilt |
| 135 M | camera-2 | 4 | 1 | 3 | 0 | nomoGrain, dust, vignette, prism, fade, highlight, tilt |
| INS 2 | camera-3 | 7 | 4 | 6 | 0 | exposure, contrast, saturation, nomoGrain, dust, vignette, tilt, prism, fade, highlight |
| 135 GR | camera-4 | 10 | 5 | 1 | 0 | nomoGrain, dust, vignette, tilt, prism, fade, highlight |
| FISHEYE | camera-5 | 4 | 0 | 0 | 0 | nomoGrain, fade, tilt |
| TOY K | camera-6 | 8 | 0 | 5 | 0 | nomoGrain, vignette, prism, tilt |
| 135 Ti | camera-7 | 4 | 0 | 5 | 0 | nomoGrain, vignette, fade, tilt |
| 135 SP | camera-8 | 7 | 7 | 3 | 0 | dust, vignette, nomoGrain, tilt |
| TOY F | camera-9 | 5 | 7 | 5 | 3.5 | nomoGrain, vignette, dust, lightLeak, prism, tilt |
| 135 LUNE | camera-10 | 0 | 0 | 7 | 0 | nomoGrain, vignette, prism, tilt |
| 135 PANO | camera-11 | 5 | 7 | 5 | 0 | nomoGrain, vignette, dust, tilt, prism |
| 135 T3 | camera-12 | 3 | 0 | 3 | 0 | nomoGrain, vignette, tilt |
| CAM BOY | camera-13 | 0 | 0 | 0 | 0 | - |
| TOY X | camera-14 | 5 | 0 | 5 | 0 | nomoGrain, vignette, prism, tilt |
| TOY IR | camera-15 | 5 | 0 | 7 | 0 | nomoGrain, vignette, prism, highlight, tilt |
| 120 SG | camera-16 | 3 | 0 | 0 | 0 | nomoGrain, tilt, prism |
| BOOTH | camera-17 | 5 | 0 | 5 | 0 | nomoGrain, vignette |
| EATS | camera-18 | 3 | 0 | 3 | 0 | vignette, nomoGrain, tilt |
| WETZLAR | camera-19 | 7 | 3 | 8 | 0 | nomoGrain, dust, vignette, prism, tilt |
| Swirly | camera-20 | 0 | 0 | 5 | 0 | tilt, vignette, nomoGrain, fade |
| XWide | camera-21 | 3 | 0 | 5 | 0 | vignette, nomoGrain |
| 135 M3 | camera-22 | 7 | 1.5 | 5 | 0 | nomoGrain, dust, vignette |
| Green Translucent | camera-23 | 0 | 0 | 0 | 0 | nomoGrain, tilt |
| ACTION | camera-24 | 0 | 0 | 7 | 0 | vignette, prism, tilt, nomoGrain |
| ROMA | camera-25 | 0 | 0 | 5 | 0 | vignette, nomoGrain |
| Rainbow | camera-26 | 0 | 0 | 3 | 0 | nomoGrain, dust, vignette |
| Pen | camera-27 | 7 | 7 | 0 | 0 | fade, prism, tilt, nomoGrain, dust |
| 135 Zoom | camera-28 | 4 | 0 | 5 | 0 | vignette, tilt, nomoGrain, prism |
| MOON | camera-29 | 2 | 0 | 2 | 0 | vignette, nomoGrain |
| VID 8 | camera-30 | 4 | 1 | 3 | 0 | nomoGrain, dust, vignette, prism, fade, highlight, tilt |
| DUAL | camera-31 | 3 | 0 | 4 | 0 | vignette, nomoGrain, tilt |
| 503CW | camera-32 | 3 | 0 | 3 | 0 | nomoGrain, vignette, tilt, dust |
| Happiness | camera-33 | 3 | 5 | 6 | 0 | nomoGrain, vignette, dust, prism, tilt |
| WATCH | camera-34 | 4 | 0 | 0 | 0 | nomoGrain, fade, tilt |
| #FR2 | camera-35 | 2 | 0 | 5 | 0 | nomoGrain, vignette, prism, tilt |
| 135 M6 | camera-36 | 2 | 0 | 3 | 0 | nomoGrain, vignette, tilt |
| minilux | camera-37 | 3 | 0 | 4 | 0 | nomoGrain, vignette, tilt, sharpen |
| 135 A | camera-38 | 4 | 4 | 4 | 0 | nomoGrain, vignette, prism, dust |
| 67 | camera-39 | 4 | 4 | 4 | 0 | dust, nomoGrain, vignette |
| 1234 | camera-40 | 2 | 0 | 10 | 0 | tilt, vignette, prism, nomoGrain |
| LF | camera-41 | 0 | 0 | 0 | 0 | - |
| INS A | camera-42 | 5 | 0 | 7 | 0 | vignette, prism, nomoGrain |
| 135 TC | camera-43 | 4 | 0 | 4 | 0 | nomoGrain, vignette |
| Swirly 2 | camera-44 | 3 | 0 | 4 | 0 | vignette, nomoGrain |
| 2.35 | camera-45 | 2 | 0 | 2 | 0 | nomoGrain, vignette |
| INS 70 | camera-46 | 0 | 0 | 10 | 0 | vignette |
| Lonesome | camera-47 | 0 | 0 | 0 | 0 | tilt |
| 135 P | camera-48 | 3 | 0 | 6 | 0 | prism, vignette, nomoGrain |
| McDonald’s | camera-49 | 2 | 0 | 3 | 0 | nomoGrain, vignette, prism, tilt |
| Lunar Rabbits | camera-50 | 2 | 0 | 3 | 0 | nomoGrain, vignette, prism, tilt |
| 620 B | camera-51 | 10 | 0 | 4 | 0 | vignette, nomoGrain, prism, tilt |
| 120 M7 | camera-52 | 3 | 0 | 3 | 0 | exposure, highlight, nomoGrain, vignette, tilt |
| Pink Translucent | camera-53 | 5 | 0 | 0 | 0 | nomoGrain, prism, tilt |
