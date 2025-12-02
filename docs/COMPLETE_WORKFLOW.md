# FSDC Reviews App - Complete Workflow & Architecture

## 1. Overview

This document outlines the end-to-end workflow of the FSDC Reviews Application, detailing the data flow from user input to storage and analysis. It serves as a reference for understanding how the frontend and backend (local storage) interact.

## 2. Architecture

The app follows a **Offline-First** architecture using:

- **Frontend**: React Native (Expo) with TypeScript.
- **Navigation**: Expo Router (Stack & Tabs).
- **Storage**: `AsyncStorage` (Metadata/JSON) + `expo-file-system` (Images).
- **State Management**: Local React State + Context (`ThemeContext`).
- **UI Consistency**: Global `ThemeToggle` and explicit "Back" buttons for improved navigation.

## 3. End-to-End Workflow

### A. Review Creation Flow

1.  **Initiation**: User taps "Add Review" from Home or Dashboard.
2.  **Simulator Selection** (`app/add-review.tsx`):
    - **Step 1**: User selects **Aircraft** (e.g., "Mi-17").
    - **Step 2**: User selects **System Type** (e.g., "Aeromix").
    - _Data_: `simulatorId`, `simulatorName`, `simulatorType` are stored in local state.
3.  **Data Entry**:
    - User fills Personal Info (Nationality, Profession, etc.).
    - User rates categories (1-5 stars).
    - User adds text comments.
    - **Media**:
      - **Photos**: Captured via Camera or Gallery -> Saved to `FileSystem` -> Paths stored in state.
      - **Handwriting**: Drawn on Canvas -> Saved as PNG to `FileSystem` -> Path stored in state.
4.  **Preview** (`app/review-preview.tsx`):
    - Form data is passed via navigation params.
    - User reviews all entered data.
    - User confirms submission.
5.  **Persistence** (`utils/dataStorage.ts`):
    - `saveReview()` is called.
    - Images are moved to permanent storage.
    - Review object is created with timestamp and unique ID.
    - Data is encrypted and saved to `AsyncStorage`.

### B. Data Visualization Flow (Dashboard)

1.  **Loading** (`app/dashboard.tsx`):
    - `useFocusEffect` triggers `loadReviews()`.
    - `getAllReviews()` fetches encrypted data from `AsyncStorage`.
    - Data is decrypted and parsed.
2.  **Filtering**:
    - User applies filters: **Review Type** (Professional/Joyride), **Simulator**, **System Type**.
    - `useMemo` hooks recalculate stats based on active filters.
3.  **Rendering**:
    - Charts (Rating Distribution, Nationality) update dynamically.
    - Stats cards (Average Rating, Total Reviews) reflect filtered data.

### C. Review Management Flow

1.  **Listing** (`app/reviews-list.tsx`):
    - Displays all reviews in a virtualized `FlatList`.
    - Each `ReviewCard` shows Simulator Name, Type, and key ratings.
    - Supports Pull-to-Refresh to reload data.
2.  **Detail View** (`app/review-detail.tsx`):
    - Shows full review data including all rating categories.
    - Displays "Simulator Details" section.
    - Allows viewing full-screen photos and handwritten notes.
    - **PDF Generation**: Users can generate and share a PDF report of the review.

## 4. Key Data Structures

### Review Interface

```typescript
interface Review {
  id: string;
  timestamp: number;
  reviewType: "professional" | "joyride";
  personalInfo: { [key: string]: string };
  ratings: { [key: string]: number };
  overallRating: number;
  handwrittenComment?: string; // File path
  photos: string[]; // File paths
  textComment?: string;
  simulatorId?: string; // Aircraft ID
  simulatorName?: string; // Aircraft Name
  simulatorType?: string; // System Type (Aeromix/AeroSim Pro)
}
```

## 5. Performance Optimizations

- **Images**: `OptimizedImage` component uses `expo-image` for caching and performance.
- **Lists**: `FlatList` with `React.memo` components (`ReviewCard`) prevents unnecessary re-renders.
- **Calculations**: Heavy stats calculations in Dashboard are memoized using `useMemo`.
- **Storage**: Images are stored as files, not Base64 strings, to keep `AsyncStorage` lightweight and fast.
