# Release Build Notes

## Android

- `app.json`:
  - `android.edgeToEdgeEnabled: true`
  - `android.enableDangerousExperimentalLeanBuilds: false` (retain modules like `expo-print`)
  - Proguard enabled (keep rules handled by Expo)
- Align versions with Expo SDK (`expo install`) before builds
- **Permissions**: `expo-media-library` (used for saving to gallery) requires a full native build (APK/IPA) or Development Build to function correctly. It may not work in standard Expo Go if permissions are not configured in the native layer.

## iOS

- Tablet support enabled; standard Expo config

## Router

- `package.json` → `main: "expo-router/entry"`

## Cache

- If bundler errors occur: remove `node_modules`, delete lockfile, reinstall, run `expo start --clear`
