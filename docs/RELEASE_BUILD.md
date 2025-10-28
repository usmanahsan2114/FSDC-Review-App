# Release Build Notes

## Android
- `app.json`:
  - `android.edgeToEdgeEnabled: true`
  - `android.enableDangerousExperimentalLeanBuilds: false` (retain modules like `expo-print`)
  - Proguard enabled (keep rules handled by Expo)
- Align versions with Expo SDK (`expo install`) before builds

## iOS
- Tablet support enabled; standard Expo config

## Router
- `package.json` → `main: "expo-router/entry"`

## Cache
- If bundler errors occur: remove `node_modules`, delete lockfile, reinstall, run `expo start --clear`
