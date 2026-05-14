# KONO CAM iOS Local Setup

This iOS build is local-only. The GitHub/Vercel web app does not need these files.

## Current Shape

- App name: `KONO CAM`
- Bundle id: `com.konocam.app`
- iOS wrapper: Capacitor under `ios/App`
- Web source of truth: `web/`
- Native bridge: `KonoNativeBridge.savePhoto`, used only inside Capacitor to save finished JPEGs to Photos.

## Sync Web Changes Into iOS

Run this after changing files in `web/`:

```sh
npm run ios:copy
```

This copies `web/` into `ios/App/App/public` and re-registers the local native bridge.

## Open In Xcode

```sh
npm run ios:open
```

In Xcode:

1. Open target `App`.
2. Set Signing & Capabilities to your Apple ID team.
3. Keep bundle id as `com.konocam.app`, or change it if Xcode says it is unavailable.
4. If prompted, install the missing iOS platform from `Xcode > Settings > Components`.
5. Select your connected iPhone.
6. Press Run.

## AltStore Route

For an `.ipa`:

1. In Xcode, select `Any iOS Device`.
2. Use `Product > Archive`.
3. Export a development/ad-hoc `.ipa` signed with your Apple ID.
4. Install that `.ipa` through AltStore.

With a free Apple ID, expect AltStore's normal 7-day refresh behavior.

## Local Checks

```sh
npm run check:web
```

Command-line iOS builds currently require the missing iOS device platform to be installed in Xcode.
