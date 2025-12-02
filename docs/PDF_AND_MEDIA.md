# PDF & Media Guide

## Photos
- Taken via in-app camera (no OS preview) or selected from gallery
- Saved permanently via `saveImagePermanently`
- Gallery save is optional; disabled by default to avoid modify-photo prompt

## Handwritten Comments
- Saved as image in app storage only (not in gallery)

## PDF Generation
- Build pages (personal info, average + detailed ratings, comments, handwriting, photos)
- Convert images to base64 via `expo-image-manipulator` (downscale to ~1400px width, 0.85 quality to prevent blanks with many photos)
- Create PDF with `expo-print`
- Share/Save with `expo-sharing`
 - Preview first via `Print.printAsync` (Android can Save as PDF in print UI)

## APK Requirements
- Disable Android lean builds in `app.json`
- Ensure modules: `expo-print`, `expo-sharing`, `expo-image-manipulator`

## Troubleshooting
- If share sheet not available: verify `Sharing.isAvailableAsync()`
- Blank images: confirm file path exists and base64 conversion succeeds
