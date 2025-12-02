# Setup and Rebuild Instructions

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI

### Installation

1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Run `npx expo start` to launch the development server.

## GitHub Repository Setup

If you need to set up the repository again:

1.  Initialize git: `git init`
2.  Add remote: `git remote add origin https://github.com/usmanahsan2114/sdw-review-app.git`
3.  Push: `git push -u origin main`

## Rebuild Instructions for Native Modules

### Important: Native Code Requires Rebuild

After adding native Android modules (Kotlin files) or modifying native code, you **must** rebuild the Android app. A simple Metro bundler restart is not enough.

### Steps to Fix "View config not found" Error

#### 1. Clean the Android Build

```bash
cd android
.\gradlew clean
cd ..
# Or use npm script
npm run android
```

#### 2. Rebuild the Android App

```bash
# Option 1: Using npm script (recommended)
npm run android

# Option 2: Using Expo CLI
npx expo run:android
```

#### 3. Verify Native Module Registration

Ensure `MainApplication.kt` includes `add(StylusCanvasPackage())`.

#### 4. Restart Metro Bundler

```bash
# Stop Metro bundler (Ctrl+C)
# Then restart
npm start
```

## Common Issues

### Issue: "View config not found for component `StylusCanvasView`"

**Solution**: The app hasn't been rebuilt after adding native code. Follow steps 1-2 above.

### Issue: Build fails with "Unresolved reference: StylusCanvasPackage"

**Solution**: Check that `StylusCanvasViewManager.kt` exists and contains the `StylusCanvasPackage` class.
