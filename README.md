# Flight Simulator Review App

## Overview

This is a comprehensive React Native (Expo) application designed to collect, manage, and analyze reviews for flight simulator experiences. It supports workflows for both Professional training and Joyride experiences.

## Documentation

The documentation has been reorganized into the `docs/` directory.

- **[Start Here](docs/README.md)**: The main index for all documentation.
- **[Setup Guide](docs/SETUP.md)**: Installation and build instructions.
- **[Architecture](docs/ARCHITECTURE.md)**: Technical overview and state management.
- **[Workflow](docs/WORKFLOW.md)**: User and data flows.
- **[Project Status](docs/PROJECT_STATUS.md)**: Current health and completed features.

## Quick Start

1.  **Clone & Install**:
    ```bash
    git clone <repo-url>
    npm install
    ```
2.  **Supabase Setup**:
    - Create a Supabase project.
    - Run the SQL script from `docs/SUPABASE_MIGRATION_PLAN.md`.
    - Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`.
3.  **Run App**:
    ```bash
    npx expo start --clear
    ```
4.  **Import Data (Optional)**:
    - Go to **Admin Panel** -> **Data Management**.
    - Use **"Reset & Import"** to load seed data.

For detailed setup, see [docs/SETUP.md](docs/SETUP.md).
