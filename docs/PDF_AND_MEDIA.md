# PDF & Media Guide

## Photos
- Taken via camera or selected from gallery
- Saved permanently via `saveImagePermanently`
- Camera photos also saved to device gallery (album: FSDC Reviews)

## Handwritten Comments
- Saved as image in app storage only (not in gallery)

## PDF Generation
- Build pages (personal info, average + detailed ratings, comments, handwriting, photos)
- Convert images to base64 via `expo-image-manipulator`
- Create PDF with `expo-print`
- Share/Save with `expo-sharing`

## APK Requirements
- Disable Android lean builds in `app.json`
- Ensure modules: `expo-print`, `expo-sharing`, `expo-image-manipulator`

## Troubleshooting
- If share sheet not available: verify `Sharing.isAvailableAsync()`
- Blank images: confirm file path exists and base64 conversion succeeds
