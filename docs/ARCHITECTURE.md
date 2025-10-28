# Architecture

This app is a React Native + Expo (SDK 54) application using Expo Router for navigation and AsyncStorage for local-only data persistence.

- Platform: Expo SDK 54, React 19.1.0, React Native 0.81.5
- Navigation: Expo Router (file-based routes)
- State/Persistence: AsyncStorage (+ simple obfuscation in `utils/encryption.ts`)
- Filesystem/Media: `expo-file-system/legacy`, `expo-media-library`, `expo-image-picker`
- PDF: `expo-print` + `expo-sharing`; base64 via `expo-image-manipulator`
- UI: React Native Paper + custom Theming/Responsive utilities

## Folder Overview

- `app/` screens and routes
  - `(tabs)/` Home Tab
  - `add-review`, `review-preview`, `reviews-list`, `review-detail`, `admin-questions`, `dashboard`
- `components/` common UI (theming, skeletons, empty states, optimized images)
- `utils/` storage, pdf, responsive, encryption, haptics, etc.
- `contexts/` theme context
- `assets/` images/icons

## Data Model

Stored review (`utils/dataStorage.ts`):
- `id`: string
- `timestamp`: number
- `personalInfo`: dynamic key/value map (driven by Admin Questions)
- `ratings`: dynamic map of categoryKey -> number
- `overallRating`: number (derived at save)
- `textComment?`: string
- `handwrittenComment?`: string (file path)
- `photos`: string[] (file paths)

## Storage Flow

1) `add-review.tsx` collects form data
2) `review-preview.tsx` confirms and calls `saveReview`
3) `utils/dataStorage.ts` serializes to AsyncStorage (with simple obfuscation)
4) Images/signatures are saved to app documents dir via `utils/imageStorage.ts`

## Images & Media

- Camera/Gallery → `expo-image-picker`
- Saved permanently via `saveImagePermanently()` to app documents directory
- Optionally saved to device gallery (album "FSDC Reviews") via `expo-media-library`

## PDF Generation

- `utils/pdfGenerator.ts` builds HTML pages and calls `Print.printToFileAsync`
- Images are embedded by converting file paths to base64 using `expo-image-manipulator`
- Then `expo-sharing` is used to share/save the PDF

## Theming & Responsiveness

- `contexts/ThemeContext.tsx` provides theme colors
- `utils/responsive.ts` and hooks (`useResponsive`, `usePerformance`) adapt dimensions, fonts and spacing across devices

## Error Boundaries

- `components/ErrorBoundary.tsx` provides a global error fallback UI


