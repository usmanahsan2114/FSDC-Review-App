# Libraries & Usage

- expo: ~54.0.20 (managed workflow)
- expo-router: ~6.0.13 (file-based routing)
- expo-image-picker: ~17.0.8 (camera/gallery)
- expo-file-system: ~19.0.16 (legacy import used for SDK 54 compatibility)
- expo-media-library: ^18.2.0 (save images to device gallery)
- expo-image-manipulator: ^14.0.7 (base64 encode for PDF)
- expo-print: ^15.0.7 (generate PDF from HTML)
- expo-sharing: ^14.0.7 (share/save PDF)
- react-native-paper: ^5.14.5 (UI components)
- react-native-star-rating-widget: ^1.9.2 (ratings)
- AsyncStorage: ^2.2.0 (local persistence)

Notes:
- Router entry: `package.json -> main: "expo-router/entry"`
- Release: disabled Android lean builds to retain modules needed by `expo-print`
