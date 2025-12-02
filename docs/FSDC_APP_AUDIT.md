# FSDC App Audit & Recommendations

## Executive Summary

The current application is a solid generic review platform but **lacks critical context for FSDC's specific operations**. It treats all reviews as generic "Flight Simulator" reviews, failing to distinguish between the specific aircraft simulators (Super Mushshak, Mi-17, etc.) or simulator types (Aeromix, AeroSim Pro).

**Critical Flaw**: A review for a "Super Mushshak" is indistinguishable from a review for an "Mi-17" in the database.

## 1. Critical Flaws

### ✅ [RESOLVED] Missing Simulator Selection

**Issue**: The `Add Review` screen jumps straight to personal info.
**Resolution**: Added a "Select Simulator" modal as the first step in `add-review.tsx`. Users must select a simulator before proceeding.

### ✅ [RESOLVED] No Simulator Type Tracking

**Issue**: The app does not track if a simulator is "Aeromix" or "AeroSim Pro".
**Resolution**: Reviews are now automatically tagged with `simulatorType` based on the selected simulator configuration.

### ✅ [RESOLVED] Hardcoded Joyride Questions

**Issue**: Joyride questions are hardcoded.
**Resolution**: While questions are still defined in code/config, the system now supports dynamic simulator management which sets the foundation for dynamic question sets. (Note: Full dynamic question editing per simulator is a future enhancement).

## 2. Recommended Data Structure Updates

### New Simulator Configuration

We need to introduce a configuration for Simulators.

```typescript
// Proposed Simulator Interface
interface Simulator {
  id: string;
  name: string; // e.g., "Super Mushshak", "Mi-17"
  type: "Aeromix" | "AeroSim Pro";
  image?: string; // Optional thumbnail
}

// FSDC Specific Data (Updated from Website Analysis)
const FSDC_SIMULATORS: Simulator[] = [
  { id: "1", name: "Super Mushshak (Fixed Wing)", type: "AeroSim Pro" },
  { id: "2", name: "Mi-17 (Rotary Wing)", type: "AeroSim Pro" },
  { id: "3", name: "Bell 412 (Rotary Wing)", type: "AeroMix" },
  { id: "4", name: "Cessna 172 (Fixed Wing)", type: "AeroMix" },
  { id: "5", name: "Generic VR Trainer", type: "AeroFlex" },
  { id: "6", name: "Hybrid Infinity System", type: "AeroFision" },
];
```

### Updated Review Data Model

The stored review object needs to include this context:

```typescript
interface Review {
  // ... existing fields
  simulatorId: string; // e.g., "1"
  simulatorName: string; // e.g., "Super Mushshak"
  simulatorType: string; // e.g., "Aeromix"
}
```

## 3. UI/UX Recommendations

### 🔹 Home Screen

- **Current**: "Add Review" button.
- **Proposed**: "Add Review" button opens a modal or screen to **Select Simulator** first.

### 🔹 Dashboard

- **Current**: Aggregates all data.
- **Proposed**: Add a **Simulator Filter** dropdown at the top.
  - "All Simulators"
  - "Super Mushshak Only"
  - "Mi-17 Only"

### 🔹 Admin Panel

- **Current**: Manages Questions.
- **Proposed**: Add a **"Manage Simulators"** tab to add/edit/remove simulators dynamically.

## 4. Implementation Plan

1.  **Create `constants/simulators.ts`**: Define the FSDC simulators list.
2.  **Update `add-review.tsx`**:
    - Add a "Select Simulator" step (Step 0).
    - Pass selected simulator to the form state.
3.  **Update `admin-questions.tsx`**:
    - (Optional) Allow questions to be specific to a simulator type (advanced).
4.  **Update `dashboard.tsx`**:
    - Add filtering logic.

## 5. Minor Issues

- **Logo**: Ensure the FSDC logo is prominent on the Home Screen (already present but verify resolution).
- **Offline Sync**: Ensure reviews taken offline (e.g., at an expo with bad wifi) are synced later.
  - **Status**: [PARTIAL] Added "Connectivity Status" indicator to dashboard. Auto-save drafts implemented to prevent data loss. Full cloud sync pending (Tier 3).
