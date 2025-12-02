# Feature Workflow V2: Fixes & Enhancements

This document outlines the workflow for the second phase of improvements, focusing on critical bug fixes and dynamic simulator management.

## 1. Critical Bug Fixes

### A. Fix Excel Export Error

**Issue**: `expo-file-system`'s `writeAsStringAsync` is deprecated in the main import.
**Solution**:

1.  Update `utils/exportUtils.ts` to import from `expo-file-system/legacy`.

### B. Fix Gallery Save Error

**Issue**: `MediaLibrary.requestPermissionsAsync` is requesting AUDIO permission which is missing in manifest.
**Solution**:

1.  Update `app.json` to include `expo-media-library` plugin with photo permissions.
2.  Update `app/review-preview.tsx` to request only necessary permissions (if API allows) or rely on the plugin fix.

## 2. Dynamic Simulator Management

### A. Storage Layer

**Objective**: Move Simulator Names and Types from hardcoded constants to dynamic storage.
**Steps**:

1.  Create `utils/simulatorStorage.ts`:
    - `getSimulatorTypes()`: Returns types from AsyncStorage or defaults.
    - `saveSimulatorTypes(types)`: Saves types.
    - `getSimulators()`: Returns simulators from AsyncStorage or defaults.
    - `saveSimulators(sims)`: Saves simulators.

### B. Admin Interface

**Objective**: Allow admins to add/edit/delete Simulator Names and Types.
**Steps**:

1.  Update `app/admin-questions.tsx`:
    - Add a new tab "Simulators".
    - Section 1: Manage Simulator Types (Add/Delete).
    - Section 2: Manage Simulator Names (Add/Edit/Delete).

### C. Frontend Integration

**Objective**: Ensure Dashboard and Reviews List use the dynamic data.
**Steps**:

1.  Update `app/dashboard.tsx`:
    - Fetch Simulator Names and Types on mount (using `useFocusEffect` or `useEffect`).
    - Update filters to use fetched data.
2.  Update `app/reviews-list.tsx`:
    - Fetch Simulator Names and Types on mount.
    - Update filters to use fetched data.
3.  Update `app/add-review.tsx` (and others):
    - Ensure dropdowns use the dynamic lists.

## 3. Verification

1.  **Excel**: Export and verify no crash.
2.  **Gallery**: Save review with handwriting, verify no crash and image saved.
3.  **Admin**: Add a new Sim Type and Sim Name.
4.  **Frontend**: Verify new Sim Type/Name appear in filters on Dashboard and List.
