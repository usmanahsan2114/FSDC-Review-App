# Online Backup Strategy for FSDC

## Overview

Currently, all review data is stored locally on the device. This poses a risk of data loss if the device is lost, damaged, or if the app is uninstalled. This document outlines three strategies to implement online backup, ranging from simple manual exports to a full cloud database synchronization.

## Option 1: Google Sheets Export (Low Effort / Low Cost)

**Best for**: Occasional backups, manual data analysis.

### How it works:

1.  App generates a CSV or JSON file of all reviews.
2.  Uses `expo-sharing` to share the file.
3.  User selects "Google Drive" or "Gmail" to save the file.
4.  (Advanced) App sends data directly to a Google Sheet via a Google Apps Script Web App URL.

### Pros:

- Free.
- No backend infrastructure to manage.
- Data is immediately usable in Excel/Sheets.

### Cons:

- Manual process (user must initiate).
- No two-way sync (cannot restore data easily to a new device).
- Images are hard to export (would be links or base64 strings).

## Option 2: Supabase Sync (Recommended)

**Best for**: Robust, automatic backup, multi-device support.

### How it works:

1.  Create a Supabase project (PostgreSQL database).
2.  App authenticates anonymously or via simple PIN.
3.  App syncs local SQLite/AsyncStorage data with Supabase tables (`reviews`, `images`).
4.  Images are uploaded to Supabase Storage buckets.

### Pros:

- **Real-time / Background Sync**: Data is backed up automatically.
- **Two-way Sync**: Install app on a new iPad, log in, and all data is restored.
- **Relational Data**: Better for analytics (SQL queries).
- **Image Handling**: Built-in storage for photos.
- **Offline First**: Works perfectly offline and syncs when online (using `watermelonDB` or custom sync logic).

### Cons:

- Requires setting up a Supabase project (Free tier is generous).
- More complex implementation than CSV export.

## Option 3: Custom Backend (High Effort)

**Best for**: Complete control, integration with existing FSDC IT infrastructure.

### How it works:

1.  Build a Node.js/Express server.
2.  Deploy to AWS/DigitalOcean.
3.  App sends REST/GraphQL requests to save data.

### Pros:

- Full control over data ownership.
- Can integrate with internal FSDC systems.

### Cons:

- High maintenance (server updates, security patches).
- Cost of hosting.
- Significant development time.

## Recommendation

**Option 2 (Supabase)** is the best balance of effort, features, and reliability. It provides a "set it and forget it" backup solution that ensures data safety without requiring FSDC to manage servers.

### Implementation Steps for Supabase

1.  Initialize Supabase project.
2.  Create tables: `reviews`, `simulators`.
3.  Create storage bucket: `review-images`.
4.  Install `@supabase/supabase-js`.
5.  Implement `SyncService` in the app to push local changes to Supabase.
