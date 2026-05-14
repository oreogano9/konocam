# KONO CAM AltStore Source

This repo can generate a shareable AltStore Classic source for KONO CAM.

## Build The IPA

```sh
npm run altstore:ipa
```

This syncs Capacitor, archives the iOS app with Xcode, and packages `dist/altstore/KONO-CAM.ipa`.

If Xcode signing fails, fix signing in `ios/App/App.xcodeproj` first, then rerun the command.

## Generate The Source

```sh
ALTSTORE_BASE_URL=https://your-domain.example/kono npm run altstore:source
```

This writes:

- `dist/altstore/source.json`
- `dist/altstore/icon.png`

It also reads the IPA size from `dist/altstore/KONO-CAM.ipa`, because AltStore requires the byte size in each version entry.

## Host The Files

Upload these files to the same HTTPS folder:

- `dist/altstore/source.json`
- `dist/altstore/KONO-CAM.ipa`
- `dist/altstore/icon.png`

Then add the source URL in AltStore:

```text
https://your-domain.example/kono/source.json
```

## Publish To GitHub Releases

The default GitHub host is:

```text
oreogano9/konocam
```

Publish the current IPA, source JSON, and icon as release assets:

```sh
npm run altstore:github
```

Then add this stable source URL in AltStore:

```text
https://github.com/oreogano9/konocam/releases/latest/download/source.json
```

The IPA is hosted as a GitHub Release asset because it is too large to commit directly to the repo.

## Updating Friends

For every shared build:

1. Bump `MARKETING_VERSION` or `CURRENT_PROJECT_VERSION` in Xcode.
2. Run `npm run altstore:ipa`.
3. Run `ALTSTORE_BASE_URL=https://your-domain.example/kono npm run altstore:source`.
4. Upload the new IPA, source JSON, and icon.

Friends still install/sign through their own AltStore setup. Free Apple IDs still have the normal AltStore refresh limits.

## Config

Editable source/app metadata lives in:

```text
altstore/source.config.json
```

Useful overrides:

```sh
ALTSTORE_BASE_URL=https://your-domain.example/kono
ALTSTORE_IPA_PATH=/absolute/path/KONO-CAM.ipa
ALTSTORE_OUTPUT=/absolute/path/source.json
ALTSTORE_ICON_URL=https://your-domain.example/kono/icon.png
ALTSTORE_DOWNLOAD_URL=https://your-domain.example/kono/KONO-CAM.ipa
ALTSTORE_RELEASE_DATE=2026-05-14T12:00:00+02:00
```
