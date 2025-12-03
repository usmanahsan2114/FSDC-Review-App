# Supabase Migration Plan 🚀 [COMPLETED]

This document outlines the steps taken to migrate the FSDC Review App to a Supabase backend. **Use the SQL below to recreate the database if needed.**

## 1. Prerequisites (User Action Required)

Before we start coding, you need to set up the backend:

1.  **Create a Supabase Account**: Go to [supabase.com](https://supabase.com) and sign up.
2.  **Create a New Project**: Name it `fsdc-reviews` (or similar).
3.  **Get Credentials**:
    - Go to **Project Settings** -> **API**.
    - Copy the **Project URL**.
    - Copy the **anon public** key.

## 2. Database Schema

We need to create a table to store the reviews. Run this in the Supabase **SQL Editor**:

```sql
-- Create the reviews table
create table public.reviews (
  id text not null, -- Changed from uuid to text to match local ID format

We will perform the following steps in the codebase:

### Phase 1: Setup & Dependencies

1.  Install `@supabase/supabase-js` and `react-native-url-polyfill`.
2.  Set up `lib/supabase.ts` client initialization.
3.  Configure environment variables (using `expo-constants` or `.env`).

### Phase 2: Sync Logic

1.  Create `hooks/useSupabaseSync.ts`.
2.  Modify `useFormDraft` or create a new `ReviewStorage` service that:
    - Saves to Local Storage (always).
    - Attempts to push to Supabase (if online).
    - If offline, adds to a "Sync Queue".
3.  Update `ConnectivityStatus` to show "Syncing..." or "Unsynced Changes".

### Phase 3: Admin Dashboard

1.  Update the Dashboard to pull stats from Supabase (optional, or keep local for now).

## 4. What You Need To Do Now

1.  **Run the SQL** above in your Supabase dashboard.
2.  **Reply with "Ready"** and provide the **Project URL** and **Anon Key** (or set them in your environment if you prefer not to share them in chat).

---

**Note on Offline Sync**:
Since this is an Expo app used at events, **Offline First** is critical. We will keep the current `AsyncStorage` logic as the "Source of Truth" for the device, and treat Supabase as the "Backup/Central Database".
```
