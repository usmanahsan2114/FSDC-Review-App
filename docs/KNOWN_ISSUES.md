# Known Issues, Warnings, and Fixes

## 1) Descenders (g/j/p/q/y) clipped on tablet
- Cause: tight `lineHeight` overrides on some text styles.
- Fix: Use ThemedText defaults or set lineHeight ≥ 1.25× fontSize and add `paddingVertical`. Home screen adjusted.

## 2) PDF not generated in APK (release)
- Cause: Android lean builds stripping needed native modules (e.g., `expo-print`).
- Fix: `app.json` → `android.enableDangerousExperimentalLeanBuilds: false`.

## 3) Expo Go cannot save to gallery on Android 13+
- Cause: permission limitations in Expo Go.
- Fix: Works in dev/production builds; request Media Library permission. In-app logic now optional.

## 4) Deprecated file system APIs
- Cause: Using `expo-file-system` methods deprecated in SDK 54.
- Fix: Use `expo-file-system/legacy` consistently.

## 5) PDF images missing/blank
- Cause: using `readAsStringAsync` for base64 conversion.
- Fix: Convert with `expo-image-manipulator` (`manipulateAsync(...,{base64:true})`).

## 6) Router build error: `expo-router/build/qualified-entry`
- Cause: cache or mismatched deps.
- Fix: Align package versions; clear node_modules + lockfile; reinstall; clear Metro cache.

## 7) Menus stuck in Reviews List
- Fix: Dynamic `key` on `Menu`, proper toggle handlers, and container `overflow: 'visible'`.

## 8) Hook order warning
- Fix: Move hooks above conditional returns.

## 9) VirtualizedList perf warning
- Fix: Memoize ReviewCard, stable deps, remove inaccurate `getItemLayout`.
