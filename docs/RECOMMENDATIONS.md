# Recommendations & Improvements

Based on a comprehensive audit of the codebase, here are specific recommendations organized into 3 tiers of priority.

## 🥇 Tier 1: Critical & Immediate (Stability & Data Integrity)

These items should be addressed **immediately** to prevent data loss and ensure the app works reliably in an expo environment.

### 1. Form Validation (Critical) [COMPLETED]

- **Issue**: Users can currently submit incomplete or invalid data (e.g., bad emails, empty fields).
- **Action**: Implement **Zod** or **Yup** validation schema.
- **Benefit**: Prevents "garbage data" from entering the system.

---

## 🥈 Tier 2: High Value & Short Term (UX & Admin Power)

These items significantly improve the user experience and give FSDC control over the app without code changes.

### 1. Auto-Save Drafts [COMPLETED]

- **Issue**: Accidental back button press loses all typed data.
- **Action**: Save form state to `AsyncStorage` on every keystroke.
- **Benefit**: Frustration-free experience.

### 2. Offline Queue & Sync Status [COMPLETED]

- **Issue**: No visibility on whether data is safe.
- **Action**: Add a "Green Check / Red X" status indicator for data safety.
- **Benefit**: Peace of mind for booth staff.

---

## 🥉 Tier 3: Strategic & Long Term (Scale & Analytics)

These items are for when the app scales beyond a single tablet or needs centralized data.

### 1. Backend Migration (Supabase)

- **Issue**: Data is trapped on the tablet.
- **Action**: Sync data to a cloud database.
- **Benefit**: Centralized dashboard, remote monitoring, data safety.
