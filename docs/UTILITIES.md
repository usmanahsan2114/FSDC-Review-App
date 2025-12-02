# Utilities and Enhancements

This document details the professional enhancements and utilities available in the application.

## 1. `utils/animations.ts` - Animation System

**Purpose**: Lightweight animation utilities for modern UI/UX.
**Features**:

- Button press animations (scale effect)
- Fade in/out, Slide up
- Stagger animations for lists
- Pulse and Shake animations

## 2. `utils/formDraft.ts` - Auto-Save Form Drafts

**Purpose**: Automatically save form progress and recover drafts.
**Features**:

- Auto-save every 30 seconds
- Draft recovery on app restart
- 7-day draft expiration

## 3. `utils/recentlyViewed.ts` - Recently Viewed Tracker

**Purpose**: Track and display recently viewed reviews.
**Features**:

- Tracks last 10 viewed reviews
- 30-day automatic cleanup
- Duplicate prevention

## 4. `utils/ratingColors.ts` - Smart Rating Colors

**Purpose**: Professional color-coded rating system.
**Features**:

- 5-tier color system (Green to Red)
- Dark mode support
- Rating labels and emojis

## 5. `components/FAB.tsx` - Floating Action Button

**Purpose**: Quick access menu with animated actions.
**Features**:

- Expandable action menu
- Smooth spring animations
- Haptic feedback

## 6. `components/FormProgress.tsx` - Form Progress Indicator

**Purpose**: Visual progress tracker for multi-step forms.
**Features**:

- Animated progress bar
- Step counter
- Color changes on completion

## Integration Examples

### Adding FAB to Home Screen

```typescript
import { FAB } from "@/components/FAB";
<FAB
  actions={[
    { icon: "📝", label: "Add Review", onPress: handleAddReview },
    { icon: "📊", label: "Dashboard", onPress: handleDashboard },
  ]}
/>;
```

### Using Rating Colors

```typescript
import { getRatingColors, getRatingLabel } from "@/utils/ratingColors";
const colors = getRatingColors(rating);
<Text style={{ color: colors.text }}>{getRatingLabel(rating)}</Text>;
```
