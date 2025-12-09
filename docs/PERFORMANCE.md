# Performance & Lightweight Guide

## Rendering

- Memoize heavy list items (done for ReviewCard)
- Avoid inline lambdas in large lists when possible
- Reduce header/controls vertical space (done)

## Images

- Use `OptimizedImage` with `contentFit="contain"` to prevent distortion
- Downscale for PDFs to ~1400px width, JPEG ~0.85 to reduce memory while keeping originals intact

## Storage

- Keep AsyncStorage payloads small; store only file paths, not base64
- Periodically cleanup orphaned images if needed

## Bundling

- Avoid lean builds on Android (keeps required modules)
- Keep dependency versions aligned with Expo SDK

## UI/UX

- Skeletons and empty states for perceived performance
- Haptics for feedback on actions

## Optional Future Tweaks

- Image cache size policy review (expo-image)
- Background precompute of averages/stats
