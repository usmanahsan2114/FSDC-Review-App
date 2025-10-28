# Troubleshooting

## Router bundling error (`qualified-entry`)
- Clear node_modules and lockfile → reinstall
- `expo start --clear`

## PDF blank or fails
- Ensure `android.enableDangerousExperimentalLeanBuilds: false`
- Verify `expo-image-manipulator` base64 conversion returns data
- Check `Sharing.isAvailableAsync()` and try again

## Gallery save not working (Android 13+)
- Use dev/production build; Expo Go has limitations
- Accept Media Library permission when prompted

## Text clipping
- Remove tight `lineHeight` overrides; use `ThemedText` defaults
