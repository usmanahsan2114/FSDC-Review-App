# Developer Guide and Code Explanations

## Overview

This document provides detailed explanations for complex parts of the ReviewsApp codebase.

## Core Application Structure

### App Layout (`app/_layout.tsx`)

- **Root Layout**: Sets up `CustomThemeProvider` and `Stack` navigation.
- **Design**: Separates theme management from navigation logic.

### Tab Navigation (`app/(tabs)/_layout.tsx`)

- **Structure**: Currently single-tab (Home), designed for expansion.
- **Icons**: Uses `IconSymbol` for consistency.

## Data Management Layer

### Review Storage (`utils/dataStorage.ts`)

- **Key**: `reviews`
- **Structure**: Encrypted JSON array of review objects.
- **Features**:
  - `saveReview()`: Validates, encrypts, and persists data.
  - `getAllReviews()`: Decrypts and retrieves reviews.
  - `batchMigrateImages()`: Handles image storage optimization.
  - `syncReviewsToSupabase()`: Handles offline-first synchronization.
- **Storage**: Uses `AsyncStorage` for metadata and `expo-file-system` for images.

### Theme Management (`contexts/ThemeContext.tsx`)

- **Modes**: Light, Dark, System.
- **Persistence**: Saves preference to AsyncStorage.
- **Provider**: Wraps app to provide theme context.

## Responsive Design System

### Responsive Utilities (`utils/responsive.ts`)

- **Device Detection**: `isSmallPhone`, `isTablet`, `isLargeTablet`.
- **Scaling**: `wp` (width %), `hp` (height %), `rf` (responsive font), `rs` (responsive spacing).
- **Philosophy**: Mobile-first, consistent scaling.

## Form Management System

### Add Review Form (`app/add-review.tsx`)

- **State**: Monolithic `formData` object.
- **Validation**: Custom validation logic returning errors array.
- **Image Handling**: Supports Camera and Gallery, compresses images.
- **Submission**: Validates, transforms, and saves to storage.

## Component Architecture

### Responsive Layout (`components/ResponsiveLayout.tsx`)

- **Purpose**: Container with device-specific padding.
- **Props**: `scrollable`, `centered`, `padding`.

### Stylus Canvas (`components/StylusCanvas.tsx`)

- **Purpose**: Handwriting capture.
- **Implementation**: Uses native module or WebView fallback.

## Best Practices

- **State**: Use local state for UI, AsyncStorage for persistence.
- **Performance**: Use `FlatList` for lists, memoize expensive calculations.
- **Accessibility**: Ensure touch targets are >44px, use accessibility labels.
