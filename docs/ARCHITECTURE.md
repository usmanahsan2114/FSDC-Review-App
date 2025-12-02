# Architecture

This app is a React Native + Expo (SDK 54) application using Expo Router for navigation and AsyncStorage for local-only data persistence.

- **Platform**: Expo SDK 54, React 19.1.0, React Native 0.81.5
- **Navigation**: Expo Router (file-based routes)
- **State/Persistence**: AsyncStorage (+ simple obfuscation in `utils/encryption.ts`)
- **Filesystem/Media**: `expo-file-system/legacy`, `expo-media-library`, `expo-image-picker`, `expo-camera` (custom in-app camera)
- **PDF**: `expo-print` + `expo-sharing`; base64 via `expo-image-manipulator`
- **UI**: React Native Paper + custom Theming/Responsive utilities

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

1. `add-review.tsx` collects form data
2. `review-preview.tsx` confirms and calls `saveReview`
3. `utils/dataStorage.ts` serializes to AsyncStorage (with simple obfuscation)
4. Images/signatures are saved to app documents dir via `utils/imageStorage.ts`

## Images & Media

- Camera/Gallery → `expo-image-picker`
- Saved permanently via `saveImagePermanently()` to app documents directory
- Optionally saved to device gallery (album "FSDC Reviews") via `expo-media-library`

## PDF Generation

- `utils/pdfGenerator.ts` builds HTML pages and calls `Print.printToFileAsync`
- Images are embedded by converting file paths to base64 using `expo-image-manipulator` (downscaled for reliability when multiple photos)
- Then `expo-sharing` is used to share/save the PDF; `Print.printAsync` is used for preview

## Theming & Responsiveness

- `contexts/ThemeContext.tsx` provides theme colors
- `utils/responsive.ts` and hooks (`useResponsive`, `usePerformance`) adapt dimensions, fonts and spacing across devices

## Error Boundaries

- `components/ErrorBoundary.tsx` provides a global error fallback UI

---

# App Logic and State Management

## 1. State Management Strategy

The application primarily uses **React Local State** (`useState`, `useReducer`) for UI state and **AsyncStorage** for persistent data. It does not use a global state management library (like Redux or Zustand), relying instead on data fetching hooks and context where necessary.

### Global Contexts

- **ThemeContext**: Manages Light/Dark mode preference and provides theme colors to components.

### Screen-Level State

- **`AddReviewScreen`**:
  - `formData`: Monolithic state object holding all user inputs.
  - `personalInfoFields` / `ratingCategories`: State arrays loaded from storage to render the form dynamically.
  - `isFormValid`: Memoized boolean to disable/enable submission.
- **`ReviewsListScreen`**:
  - `reviews`: Array of `Review` objects fetched from storage.
  - Filters (`searchQuery`, `filterMinRating`, etc.): Local state variables driving a `useMemo` hook to derive `filteredReviews`.

## 2. Business Logic

### Review Type Differentiation

The app distinguishes between **Professional** and **Joyride** reviews.

- **Professional**:
  - Structure defined by Admin settings (Dynamic).
  - Focused on training/simulation fidelity.
- **Joyride**:
  - Structure hardcoded in `joyrideRatingCategories` and `joyridePersonalInfoFields`.
  - Includes specific pricing/value questions.
  - _Logic_: `AddReviewScreen` checks `reviewType` param to decide which configuration to load.

### Data Persistence (`utils/dataStorage.ts`)

- **Encryption**: All review data in `AsyncStorage` is encrypted using `utils/encryption.ts`.
- **Image Optimization**:
  - Instead of storing large Base64 strings in the JSON blob (which slows down `AsyncStorage`), images are saved to the file system (`utils/imageStorage.ts`).
  - The JSON object only stores the **file path** (URI).
  - _Migration Logic_: On startup, `initializeDataStorage` checks for legacy Base64 data and converts it to files.

### PDF Generation (`utils/pdfGenerator.ts`)

- **HTML Construction**: Dynamically builds an HTML string based on the review content.
- **Image Embedding**: Converts file URIs back to Base64 on-the-fly to embed them into the HTML for the PDF engine.
- **Pagination**: Logic handles page breaks to ensure content doesn't cut off awkwardly.

## 3. Custom Component Logic

- **`StylusCanvas`**: Uses a WebView or native canvas (implementation detail) to capture touch events for handwriting. Saves result as an image.
- **`OptimizedImage`**: Wrapper around standard Image component to handle caching and transitioning, improving list scrolling performance.

## 4. Key Algorithms

- **Average Rating Calculation**:
  - Used in Preview, Detail, List, and Dashboard.
  - Formula: `Sum of all non-zero ratings / Count of non-zero ratings`.
- **Dashboard Aggregation**:
  - Iterates through all reviews to compute histograms (rating distribution) and frequency maps (top nationalities).
  - Joyride pricing: Extracts numeric values from text inputs (sanitizing currency symbols) to calculate averages.

## 5. Navigation Logic

- **Stack Navigation**: `expo-router` handles the screen stack.
- **Route Normalization**:
  - When editing a review, the `AddReviewScreen` must know if it's Joyride or Professional.
  - Logic exists to infer this from existing data fields if the navigation parameter is missing (e.g., presence of `priceSuggestion` implies Joyride).
