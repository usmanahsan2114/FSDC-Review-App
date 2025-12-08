# FSDC Reviews App: Audit & Strategic Recommendations (Revised)

**Date:** December 08, 2025
**Context:** Multi-device, offline-capable review system for Flight Simulation Developers (FSDC) Aerosolutions.
**Target Audience:** Aviation Professionals & Joyride Users.
**Sync Requirement:** 100% Data Sync across devices (Text & Handwritten Comments). Photos are local-only.

---

## Part 1: Flaws & Warning Errors

### 🥉 Tier 1: Critical (Must Address)

1.  **Sync Conflict (Last-Write-Wins)**

    - **The Flaw:** Currently, the app blindly overwrites data. If Tablet A and Tablet B edit the same review offline, the last one to sync "wins", potentially deleting the other's changes.
    - **The Fix (How to solve it):** Implement **Timestamp-Based Merging**.
      - Add an `updated_at` timestamp to every change.
      - Before syncing a review to Supabase, check the server's version.
      - _Logic:_ `IF (Server.updated_at > Local.updated_at) THEN (Download & Merge) ELSE (Upload Local)`.
      - For granular safety, merge specific fields (e.g., merge `ratings` but keep `text_comment`).

2.  **Photo Sync Limitation (Configuration)**
    - **The Issue:** You requested that the database only store the _device path_ for photos.
    - **The Consequence:** This means **Photos will NOT sync** between devices. Tablet B cannot display a photo that lives solely on Tablet A's hard drive.
    - **Recommendation:** This satisfies your requirement for "local storage," but be aware that while _reviews_ are synced, _photos_ remain unique to the device that took them.

### 🥈 Tier 2: Major (Optimization)

1.  **Handwritten Image Storage**
    - **Current State:** Original high-res image is saved to Gallery (Device). A highly compressed version is stored in the database (Base64).
    - **Verdict:** **Correct Strategy.** This ensures the handwritten signature/comment _does_ sync across devices (because the data is in the text field) while keeping the database relatively light.
    - **Optimization:** Ensure the compression is aggressive (JPEG q=0.1) to prevent database bloat over time.

### 🥇 Tier 3: Accepted Risks

1.  **Hardcoded PIN**
    - **Status:** **Accepted.** You mentioned "we don't need a lot of security." The current hardcoded PIN is sufficient for your operational environment to prevent accidental edits by users.

---

## Part 2: Feature Recommendations

Tailored for FSDC's constraints and "Wow" factor requirements.

### 🥉 Tier 1: The Essentials (Core Experience)

1.  **"Smart" Sync Triggers**
    - _Why:_ To ensure "100% sync" without manual button presses.
    - _Feature:_ Trigger a background sync check:
      - When the app opens.
      - When the device regains internet connection (`NetInfo` listener).
      - Every 5 minutes while the app is active.

### � Tier 2: The "Wow" Factors (Marketing & Brand)

1.  **WEBGL 3D Model Viewers**

    - _Why:_ High-tech immersion.
    - _Feature:_ Replace static aircraft photos with interactive 3D models.
    - _Implementation:_ Use `expo-gl`. Users can rotate and zoom into the wireframe/model of the **Enstrom 280-FX** or **Super Mushshak** before selecting it. This creates an immediate "premium" impression.

2.  **Live "Expo Mode" Leaderboard**
    - _Why:_ Gamification for Joyriders.
    - _Feature:_ A continuously updating "Top Pilot" leaderboard.
    - _Display:_ Cast the app (or a web dashboard) to a large TV monitor at the expo booth.
    - _Metric:_ "Most Detailed Review" or "Highest Rated Simulation".

### 🥇 Tier 3: Nice-to-Haves

1.  **Voice-to-Text Comments**
    - _Why:_ Speed.
    - _Feature:_ Simple microphone button for dictating detailed comments, useful for pilots wearing gloves or holding gear.

---

## Summary of Next Steps

1.  **Immediate:** Implement **Timestamp Merging** to fix the Conflict Resolution risk.
2.  **Next:** Prototype the **3D Model Viewer** for the "Select Simulator" screen.
3.  **Ongoing:** Maintain the **Compressed Handwriting** logic to ensure text/signatures sync flawlessly.
