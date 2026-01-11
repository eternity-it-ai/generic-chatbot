# Project Folder Structure

This document outlines the recommended folder structure for the Generic Chatbot project, designed for scalability, maintainability, and best practices.

## Overview

This is a **Tauri application** with:

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Python sidecar
- **Rust**: Tauri core and bindings

---

## Recommended Folder Structure

```
generic-chatbot/
│
├── 📁 src/                          # Frontend source code
│   │
│   ├── 📁 app/                      # Application-level code
│   │   ├── App.tsx                  # Root component
│   │   ├── App.css                  # Root styles
│   │   ├── main.tsx                 # Entry point
│   │   └── providers/               # Context providers
│   │       ├── ThemeProvider.tsx
│   │       └── AppProvider.tsx
│   │
│   ├── 📁 features/                  # Feature-based modules (scalable)
│   │   │
│   │   ├── 📁 chat/                  # Chat feature
│   │   │   ├── components/          # Feature-specific components
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   ├── ChatHeader.tsx
│   │   │   │   └── ChatHistory.tsx
│   │   │   ├── hooks/               # Feature-specific hooks
│   │   │   │   ├── useChat.ts
│   │   │   │   └── useChatHistory.ts
│   │   │   ├── api/                 # Feature-specific API calls
│   │   │   │   └── chat.api.ts
│   │   │   ├── types/               # Feature-specific types
│   │   │   │   └── chat.types.ts
│   │   │   └── utils/               # Feature-specific utilities
│   │   │       └── chat.utils.ts
│   │   │
│   │   ├── 📁 data-analysis/         # Data analysis feature
│   │   │   ├── components/
│   │   │   │   ├── DataHealthBox.tsx
│   │   │   │   ├── StatisticsCards.tsx
│   │   │   │   └── MetricsCards.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useDataAnalysis.ts
│   │   │   │   └── useMetadata.ts
│   │   │   ├── api/
│   │   │   │   └── analysis.api.ts
│   │   │   ├── types/
│   │   │   │   └── analysis.types.ts
│   │   │   └── utils/
│   │   │       └── analysis.utils.ts
│   │   │
│   │   ├── 📁 file-management/       # File upload/management feature
│   │   │   ├── components/
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── FileManager.tsx
│   │   │   │   └── FileDropzone.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useFileUpload.ts
│   │   │   ├── api/
│   │   │   │   └── file.api.ts
│   │   │   ├── types/
│   │   │   │   └── file.types.ts
│   │   │   └── utils/
│   │   │       └── file.utils.ts
│   │   │
│   │   ├── 📁 settings/              # Settings feature
│   │   │   ├── components/
│   │   │   │   ├── SettingsSidebar.tsx
│   │   │   │   ├── ModelSelect.tsx
│   │   │   │   └── ApiKeyInput.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useSettings.ts
│   │   │   │   └── useApiKey.ts
│   │   │   ├── api/
│   │   │   │   └── settings.api.ts
│   │   │   ├── types/
│   │   │   │   └── settings.types.ts
│   │   │   └── utils/
│   │   │       └── settings.utils.ts
│   │   │
│   │   ├── 📁 branding/              # Branding/configuration feature
│   │   │   ├── components/
│   │   │   │   ├── SetupScreen.tsx
│   │   │   │   ├── BrandingForm.tsx
│   │   │   │   └── LogoUpload.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useBranding.ts
│   │   │   ├── api/
│   │   │   │   └── branding.api.ts
│   │   │   ├── types/
│   │   │   │   └── branding.types.ts
│   │   │   └── constants/
│   │   │       └── branding.constants.ts
│   │   │
│   │   └── 📁 welcome/               # Welcome/onboarding feature
│   │       ├── components/
│   │       │   └── WelcomeScreen.tsx
│   │       ├── hooks/
│   │       │   └── useWelcome.ts
│   │       └── types/
│   │           └── welcome.types.ts
│   │
│   ├── 📁 shared/                    # Shared code across features
│   │   │
│   │   ├── 📁 ui/                     # Reusable UI components (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── ... (all shadcn components)
│   │   │   └── index.ts              # Re-export all components
│   │   │
│   │   ├── 📁 components/             # Shared business components
│   │   │   ├── LoadingIndicator.tsx
│   │   │   ├── CenterLoading.tsx
│   │   │   ├── TitleBar.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   │
│   │   ├── 📁 hooks/                  # Shared hooks
│   │   │   ├── use-mobile.ts
│   │   │   ├── use-debounce.ts
│   │   │   └── use-local-storage.ts
│   │   │
│   │   ├── 📁 lib/                    # Shared libraries
│   │   │   ├── utils.ts              # General utilities (cn, etc.)
│   │   │   ├── validators.ts         # Validation functions
│   │   │   └── formatters.ts         # Formatting functions
│   │   │
│   │   ├── 📁 api/                    # Shared API utilities
│   │   │   ├── client.ts             # API client setup
│   │   │   ├── backend.ts            # Backend communication
│   │   │   └── types.ts              # API types
│   │   │
│   │   ├── 📁 utils/                  # Shared utilities
│   │   │   ├── storage.ts            # LocalStorage utilities
│   │   │   ├── constants.ts          # App-wide constants
│   │   │   └── helpers.ts            # Helper functions
│   │   │
│   │   ├── 📁 types/                  # Shared TypeScript types
│   │   │   ├── index.ts              # Main types export
│   │   │   ├── api.types.ts         # API-related types
│   │   │   └── common.types.ts      # Common types
│   │   │
│   │   └── 📁 constants/              # Shared constants
│   │       ├── models.ts             # Model constants
│   │       └── config.ts             # App configuration
│   │
│   ├── 📁 assets/                     # Static assets
│   │   ├── images/
│   │   │   ├── eternity.png
│   │   │   └── logo.svg
│   │   ├── icons/
│   │   ├── fonts/
│   │   └── styles/
│   │       └── index.css             # Global styles
│   │
│   └── 📁 config/                     # Configuration files
│       ├── vite.config.ts
│       └── tsconfig paths (if needed)
│
├── 📁 backend/                        # Python backend
│   │
│   ├── 📁 src/                        # Source code
│   │   ├── main.py                   # Entry point
│   │   ├── app.py                    # Application setup (if using Flask/FastAPI)
│   │   │
│   │   ├── 📁 core/                   # Core functionality
│   │   │   ├── __init__.py
│   │   │   ├── state.py              # Global state management
│   │   │   └── config.py             # Configuration
│   │   │
│   │   ├── 📁 services/               # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── csv_service.py        # CSV processing
│   │   │   ├── metadata_service.py   # Metadata generation
│   │   │   ├── analysis_service.py   # Data analysis
│   │   │   └── llm_service.py        # LLM interactions
│   │   │
│   │   ├── 📁 models/                 # Data models
│   │   │   ├── __init__.py
│   │   │   ├── metadata.py           # Metadata models
│   │   │   └── response.py           # Response models
│   │   │
│   │   ├── 📁 utils/                  # Utilities
│   │   │   ├── __init__.py
│   │   │   ├── data_processing.py    # Data processing utilities
│   │   │   └── validators.py         # Validation utilities
│   │   │
│   │   └── 📁 handlers/               # Command handlers
│   │       ├── __init__.py
│   │       ├── csv_handler.py        # CSV command handlers
│   │       ├── metadata_handler.py   # Metadata handlers
│   │       └── analysis_handler.py   # Analysis handlers
│   │
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                  # Environment variables example
│   └── README.md                     # Backend documentation
│
├── 📁 src-tauri/                      # Tauri Rust code
│   │
│   ├── 📁 src/                        # Rust source
│   │   ├── main.rs                   # Entry point
│   │   ├── lib.rs                    # Library code
│   │   │
│   │   ├── 📁 commands/               # Tauri commands
│   │   │   ├── mod.rs
│   │   │   ├── backend.rs            # Backend communication
│   │   │   └── branding.rs           # Branding commands
│   │   │
│   │   ├── 📁 models/                 # Rust data models
│   │   │   ├── mod.rs
│   │   │   └── response.rs
│   │   │
│   │   └── 📁 utils/                  # Rust utilities
│   │       ├── mod.rs
│   │       └── helpers.rs
│   │
│   ├── Cargo.toml                     # Rust dependencies
│   ├── Cargo.lock
│   ├── tauri.conf.json                # Tauri configuration
│   ├── capabilities/                  # Tauri capabilities
│   │   └── default.json
│   ├── icons/                         # App icons
│   └── build.rs                       # Build script
│
├── 📁 scripts/                        # Build and utility scripts
│   ├── build-backend.bat             # Backend build script
│   ├── build-frontend.sh
│   └── setup.sh                       # Setup script
│
├── 📁 tests/                          # Test files
│   ├── 📁 frontend/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── 📁 backend/
│   │   ├── unit/
│   │   └── integration/
│   └── 📁 rust/
│       └── unit/
│
├── 📁 docs/                           # Documentation
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
│
├── 📁 build/                          # Build outputs (gitignored)
│
├── 📁 installer/                      # Installer scripts
│   └── bootstrapper.nsi
│
├── .env                               # Environment variables (gitignored)
├── .env.example                       # Environment variables template
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── components.json                    # shadcn/ui config
├── README.md
└── FOLDER_STRUCTURE.md                # This file
```

---

## Key Principles

### 1. **Feature-Based Organization**

- Each feature (`chat`, `data-analysis`, `settings`, etc.) is self-contained
- Features can be easily added, removed, or modified independently
- Reduces coupling between different parts of the application

### 2. **Shared Code Separation**

- `shared/` contains code used across multiple features
- `shared/ui/` for reusable UI components
- `shared/lib/` for utilities and helpers
- `shared/api/` for API communication

### 3. **Clear Separation of Concerns**

- **Frontend** (`src/`): React components, hooks, UI logic
- **Backend** (`backend/`): Python business logic, data processing
- **Rust** (`src-tauri/`): Tauri bindings, system integration

### 4. **Scalability**

- Easy to add new features by creating new folders in `features/`
- Each feature follows the same structure (components, hooks, api, types, utils)
- Shared code is centralized and reusable

### 5. **Type Safety**

- Types are co-located with features (`features/*/types/`)
- Shared types in `shared/types/`
- Clear type definitions for API boundaries

---

## Migration Strategy

If you want to migrate from the current structure to this recommended structure:

### Phase 1: Create New Structure

1. Create the new folder structure
2. Move shared components to `shared/ui/` and `shared/components/`
3. Move utilities to `shared/utils/` and `shared/lib/`

### Phase 2: Organize Features

1. Group related components into features:
   - Chat: `ChatMessage`, `ChatInput`, `ChatHeader` → `features/chat/`
   - Data Analysis: `DataHealthBox`, `StatisticsCards` → `features/data-analysis/`
   - Settings: `SettingsSidebar`, `ModelSelect` → `features/settings/`
   - File Management: `FileUpload`, `FileManager` → `features/file-management/`
   - Branding: `SetupScreen`, branding hooks → `features/branding/`
   - Welcome: `WelcomeScreen` → `features/welcome/`

### Phase 3: Update Imports

1. Update all import paths to use the new structure
2. Use path aliases in `tsconfig.json` for cleaner imports:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"],
         "@features/*": ["./src/features/*"],
         "@shared/*": ["./src/shared/*"],
         "@app/*": ["./src/app/*"]
       }
     }
   }
   ```

### Phase 4: Backend Organization

1. Organize Python code into `services/`, `models/`, `handlers/`
2. Separate business logic from command handling

---

## Path Aliases Configuration

Update `tsconfig.json` and `vite.config.ts` to support clean imports:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"],
      "@assets/*": ["./src/assets/*"]
    }
  }
}
```

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
});
```

---

## Benefits of This Structure

1. **Scalability**: Easy to add new features without affecting existing code
2. **Maintainability**: Clear organization makes it easy to find and modify code
3. **Testability**: Features can be tested in isolation
4. **Team Collaboration**: Multiple developers can work on different features simultaneously
5. **Code Reusability**: Shared code is centralized and easy to discover
6. **Type Safety**: Types are co-located with their usage
7. **Performance**: Features can be lazy-loaded if needed

---

## File Naming Conventions

- **Components**: PascalCase (e.g., `ChatMessage.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useChat.ts`)
- **Utilities**: camelCase (e.g., `chat.utils.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `chat.types.ts`)
- **API**: camelCase with `.api.ts` suffix (e.g., `chat.api.ts`)
- **Constants**: camelCase with `.constants.ts` suffix (e.g., `branding.constants.ts`)

---

## Next Steps

1. Review this structure and adapt it to your specific needs
2. Gradually migrate existing code to the new structure
3. Update import paths as you migrate
4. Add tests for each feature as you organize them
5. Document feature-specific logic in each feature's README (optional)

---

## Notes

- This structure follows **Feature-Sliced Design** principles where applicable
- It's compatible with **Tauri** architecture
- It supports **React** best practices
- It's designed for **TypeScript** type safety
- It's optimized for **scalability** and **maintainability**
