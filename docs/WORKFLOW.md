# Comprehensive App Workflow

This document outlines the detailed user and data flows within the Flight Simulator Review Application.

## 1. Review Submission Workflow

### A. Initiation

Users can start a review process from the Home screen (Tabs):

1.  **Professional Review**: Standard review flow for pilots/trainees.
2.  **Joyride Review**: Simplified flow for casual users/tourists.

### B. Add Review Screen (`app/add-review.tsx`)

This is the central data entry point.

- **Initialization**:
  - Determines `reviewType` from navigation parameters.
  - Loads configuration:
    - _Professional_: Fetches dynamic questions (`RatingCategory`, `PersonalInfoField`) from `AsyncStorage` (`admin_rating_categories`, `admin_personal_info_fields`).
    - _Joyride_: Uses hardcoded `joyrideRatingCategories` and `joyridePersonalInfoFields`.
  - **Edit Mode**: If `editData` param is present, hydrates state to allow editing an existing draft.
- **Data Entry**:
  - **Personal Info**: Dynamic fields (Text, Yes/No, Autocomplete for Nationality/Profession).
    - _Joyride Specifics_: Includes "Willingness to pay" and "Cost estimate" fields.
  - **Ratings**: Star rating widgets (1-5) for each configured category.
  - **Comments**:
    - _Text_: Standard multiline input.
    - _Handwriting_: Opens `StylusCanvas` modal. Saves drawing as an image to `FileSystem`.
  - **Photos**:
    - _Camera_: Captures photo, saves to internal storage AND Gallery (album "FSDC Reviews").
    - _Gallery_: Picks image, copies to internal storage.
- **Validation**: Checks required fields before proceeding.
- **Submission**: Navigates to `ReviewPreviewScreen` passing `formData` as a JSON string.

### C. Review Preview (`app/review-preview.tsx`)

- **Display**: Renders all entered data (Personal Info, Ratings, Comments, Photos) in a read-only format.
- **Logic**:
  - Calculates "Overall Rating" (Average of all category ratings).
  - Detects `reviewType` again to ensure correct display rendering (e.g., showing Joyride pricing chips).
- **Edit Capability**: "Edit" buttons for each section navigate back to `AddReviewScreen` with current data.
- **Final Submission**:
  - Calls `saveReview` (in `utils/dataStorage.ts`).
  - Encrypts data.
  - Saves to `AsyncStorage`.
  - Navigates back to Home or allows adding another review.

## 2. Review Consumption Workflow

### A. Reviews List (`app/reviews-list.tsx`)

- **Loading**: Fetches all reviews from `AsyncStorage` and decrypts them.
- **Filtering & Sorting**:
  - _Filter_: By Type (All/Professional/Joyride), Min Rating, Has Photos, Has Handwriting.
  - _Search_: Text search across name, nationality, profession, comments.
  - _Sort_: Date (Newest/Oldest), Rating (High/Low), Name (A-Z/Z-A).
- **Display**: Renders `ReviewCard` components with summary info (Name, Date, Overall Rating, Chips).
- **Actions**: View Details, Delete Review.

### B. Review Detail (`app/review-detail.tsx`)

- **Display**: Full view of a single review.
- **PDF Generation**:
  - Converts Review data to HTML (`utils/pdfGenerator.ts`).
  - Embeds base64 images (Photos, Handwriting).
  - Uses `expo-print` to generate PDF.
  - Uses `expo-sharing` to allow user to save/share the PDF.

### C. Dashboard (`app/dashboard.tsx`)

- **Analytics**: Aggregates data from all stored reviews.
- **Metrics**:
  - Total Reviews, Average Rating, Reviews This Month.
  - Top Nationalities (Bar chart).
  - Category Performance (Average rating per category).
  - Rating Distribution (Histogram of 1-5 stars).
  - _Joyride Specifics_: Average "Willingness to Pay" and "Cost Estimate".

## 3. Admin Workflow (`app/admin-questions.tsx`)

- **Management**: Allows customization of the **Professional** review form.
  - _Rating Categories_: Add, Edit, Delete questions.
  - _Personal Info Fields_: Add, Edit, Delete fields; toggle "Required" status; configure Dropdown options.
- **Persistence**: Saves configurations to `AsyncStorage` which are then loaded by `AddReviewScreen`.
- **Reset**: Option to restore default questions.

## 4. Data Management Flow

    - `images/`: Photos.
    - `signatures/`: Handwritten comments.

- **Migration**: `initializeDataStorage` checks version and migrates image data from Base64 strings to file paths if necessary to improve performance.

## 5. Synchronization Workflow (Supabase)

- **Offline-First Strategy**:
  - App always reads/writes to local `AsyncStorage`.
  - Background sync handles data consistency.
- **Sync Process**:
  1.  **Trigger**: Sync is triggered on app launch, network recovery (via `NetInfo`), and immediately after review submission.
  2.  **Logic (`utils/sync.ts`)**:
      - Checks for internet connection.
      - Finds local reviews where `isSynced === false`.
      - Upserts them to Supabase `reviews` table.
      - Updates local review to `isSynced: true` on success.
  3.  **Status**: Visual indicators (Green/Red dots) in `ReviewsListScreen` show the sync status of each review.
- **Admin Reset**:
  - "Reset & Import" button clears local storage and imports seed data.
  - Automatically triggers a sync to push fresh data to Supabase.
