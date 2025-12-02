# Known Issues and Warnings

## Critical Issues

### 1. Data Persistence Reliability

**Location**: `storage/reviewStorage.js`
**Issue**: AsyncStorage operations lack proper error boundaries.
**Impact**: High - Data loss possible.
**Details**: No retry mechanism for failed storage operations. Silent failures in some error cases.
**Recommendation**: Implement robust error handling with retry logic and user feedback.

### 2. Memory Management Issues

**Location**: Multiple components with large lists.
**Issue**: No virtualization for large datasets.
**Impact**: High - App crashes with many reviews.
**Details**: `reviews-list.tsx` renders all reviews at once. No pagination or lazy loading.
**Recommendation**: Implement FlatList with virtualization and image lazy loading.

### 3. Image Storage Inefficiency

**Location**: `add-review.tsx`, `review-detail.tsx`
**Issue**: Images stored as base64 in AsyncStorage (legacy data).
**Impact**: High - Storage bloat and performance issues.
**Details**: Base64 encoding increases file size. AsyncStorage has size limitations.
**Recommendation**: Ensure all images are migrated to FileSystem storage (partially implemented).

## Major Issues

### 4. Navigation State Management

**Location**: Multiple navigation components.
**Issue**: Inconsistent navigation patterns (mix of expo-router and react-navigation).
**Impact**: Medium-High - UX inconsistencies.
**Recommendation**: Standardize on expo-router throughout the app.

### 5. Form Validation Gaps

**Location**: `add-review.tsx`
**Issue**: Incomplete form validation (basic regex for email, no phone validation).
**Impact**: Medium-High - Invalid data entry possible.
**Recommendation**: Implement comprehensive validation library (e.g., Yup or Zod).
**Details**: Use of type assertions (`as FormData`) bypassing type checking.
**Recommendation**: Initialize with proper default values.

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
