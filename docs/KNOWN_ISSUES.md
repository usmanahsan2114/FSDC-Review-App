# Known Issues and Warnings

## Critical Issues

### 1. Inconsistent Navigation Patterns

**Impact**: Medium-High - UX inconsistencies.
**Recommendation**: Standardize on expo-router throughout the app.

### Unused Import Warnings

**Location**: Various components.
**Details**: Imports like `Platform` defined but never used.
**Recommendation**: Remove unused imports.

### Any Type Usage

**Location**: `storage/reviewStorage.js`, `screens/ReviewPreviewScreen.js`.
**Details**: Missing type definitions, implicit `any`.
**Recommendation**: Define proper TypeScript interfaces.

### React Native Deprecation Warnings

**Location**: `utils/responsive.ts`.
**Details**: Usage of `Dimensions.get` instead of `useWindowDimensions` hook.
**Recommendation**: Migrate to modern React Native APIs.

### Performance Warnings

**Location**: `reviews-list.tsx`.
**Details**: Mapping over arrays instead of using `FlatList` (addressed in recent updates, verify).
**Recommendation**: Ensure `FlatList` is used for all lists.

### Expo Go Limitations

**Location**: `app/add-review.tsx`.
**Details**: Camera and FileSystem usage may have limitations in Expo Go vs Development Build.
**Recommendation**: Use Development Build for full native capability testing.
