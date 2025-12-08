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
**Details**: These are legacy files and are not currently used in the active application flow.
**Recommendation**: Can be safely ignored or deleted.

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

### Local Data Decryption Warning

**Location**: Console Logs / `utils/encryption.ts`.
**Details**: `WARN Standard decryption failed: [SyntaxError: JSON Parse error: Unexpected character: U]`.
**Status**: Investigating. Likely due to legacy data format overlap or non-encrypted data being read as encrypted.
**Impact**: Low (Application functions normally, data is readable), but logs are noisy.

### Text Clipping (Resolved) ✅

**Location**: `components/themed-text.tsx`.
**Details**: Text was clipping on Android due to insufficient `lineHeight`.
**Resolution**: Increased `lineHeight` for `defaultSemiBold` to 26 and `technicalLabel` to 20. Confirmed fix.
