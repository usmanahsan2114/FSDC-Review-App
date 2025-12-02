# Feature Implementation Workflow

This document outlines the workflow for implementing the requested features: Excel Export, PDF/Preview Updates, Gallery Save, and New Filters.

## 1. Review Preview & PDF Updates

### Objective

Ensure simulator details (Name and Type) are visible in the Review Preview screen and included in the generated PDF.

### Steps

1.  **Update `ReviewData` Interface**:
    - Modify `utils/pdfGenerator.ts` to include `simulatorName` and `simulatorType` in `ReviewData`.
2.  **Update `ReviewPreviewScreen` (`app/review-preview.tsx`)**:
    - Extract `simulatorName` and `simulatorType` from `formData`.
    - Display these details in the "Simulator Information" section (similar to `review-detail.tsx`).
3.  **Update PDF Generation (`utils/pdfGenerator.ts`)**:
    - Update `generatePage1HTML` to include a "Simulator Details" section with Name and Type.

## 2. Excel Export

### Objective

Allow users to export all reviews to an Excel (CSV) file from the Reviews List page. The file should be saved locally and be shareable.

### Steps

1.  **Create Export Utility (`utils/exportUtils.ts`)**:
    - Implement `generateReviewsCSV(reviews: Review[])`: Converts reviews to CSV format.
    - Include all fields: Date, Review Type, Simulator Name/Type, Personal Info, Ratings, Comments.
    - Implement `exportToExcel()`:
      - Generates filename with timestamp (e.g., `reviews_export_20231027_123045.csv`).
      - Writes file to `FileSystem.documentDirectory`.
      - Uses `Sharing.shareAsync` to share/save the file.
2.  **Update `ReviewsListScreen` (`app/reviews-list.tsx`)**:
    - Add an "Export Excel" button (icon: `file-excel` or `download`) in the header or actions area.
    - Connect button to `exportToExcel`.

## 3. Save Handwritten Comment to Gallery

### Objective

Automatically save the handwritten comment image to the device's gallery when a review is submitted.

### Steps

1.  **Update `ReviewPreviewScreen` (`app/review-preview.tsx`)**:
    - In `handleSubmitFinal`, check if `formData.handwrittenComment` exists.
    - If yes, use `MediaLibrary.createAssetAsync` (from `expo-media-library`) to save the file to the gallery.
    - Ensure `MediaLibrary` permissions are requested/handled.

## 4. New Simulator Type Filter

### Objective

Add a new filter to sort/filter reviews by "All Types of Sims" in the Reviews List.

### Steps

1.  **Update `ReviewsListScreen` (`app/reviews-list.tsx`)**:
    - Add state for `simulatorTypeFilter` (already exists in dashboard, adapt for list).
    - Add a new Filter UI element (e.g., a horizontal scrollable list or a dropdown menu) for Simulator Types.
    - Update `filteredReviews` logic to include the simulator type filter.
    - Ensure UI is consistent with the "Modern UI" guidelines.

## 5. Verification

- **Preview**: Verify Sim Name/Type are shown.
- **PDF**: Generate PDF and verify Sim Name/Type are present.
- **Excel**: Export, open file, verify all columns and data.
- **Gallery**: Submit a review with handwriting, check device gallery.
- **Filter**: Filter by Sim Type, verify list updates correctly.
