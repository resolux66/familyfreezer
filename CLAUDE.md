# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # Start Metro bundler (scan QR with Expo Go)
npx expo start --web    # Run in browser
npx tsc --noEmit        # TypeScript type-check (no compilation output)
npm run test:node       # Run unit tests (utility + service layer, fast)
```

**Run a single test file:**
```bash
node_modules/.bin/jest --config jest.node.config.js --maxWorkers=1 --forceExit __tests__/utils/expiry.test.ts
```

**Note on `npm test`:** The full `jest-expo` preset requires the Expo development environment due to React Native Babel deps (`react-native-worklets/plugin`). Use `npm run test:node` for utility/service tests; component tests would require a running Expo environment.

## Environment Setup

Create `.env` in the project root:
```
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=
EXPO_PUBLIC_APPWRITE_DATABASE_ID=
EXPO_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION=
EXPO_PUBLIC_APPWRITE_APPLIANCES_COLLECTION=
EXPO_PUBLIC_APPWRITE_ITEMS_COLLECTION=
EXPO_PUBLIC_APPWRITE_USER_PREFS_COLLECTION=
```

Missing vars warn in `__DEV__` mode but don't crash — see `src/lib/appwrite.config.ts`.

## Architecture

### Path alias
`@/` maps to `src/` (configured in `tsconfig.json` + `jest.node.config.js`). All internal imports use this alias.

### Data flow
```
Appwrite Cloud  ←→  src/services/  ←→  src/hooks/  ←→  React components
                    (pure async)        (TanStack Query     (className via
                    no React            useQuery/            NativeWind)
                                        useMutation)
```

- **`src/services/`** — pure async functions, no React. Safe to call from tests or Appwrite Functions. Each read query **always** includes `Query.equal('householdId', ...)` as the first filter — this is the security boundary.
- **`src/hooks/`** — TanStack Query wrappers (queries + mutations). Query key factories live here (e.g. `itemKeys`, `applianceKeys`). Invalidation targets these keys on mutation success.
- **`src/stores/`** — Zustand for device-local state only. `useAuthStore` (user session, no persistence). `useAppStore` (persists `activeHouseholdId` via AsyncStorage; `bannerDismissedDate` and `searchQuery` are intentionally not persisted).

### Multi-tenancy
Every household maps to an **Appwrite Team**. All documents (`appliances`, `items`, `households`) are created with `Permission.read/update(Role.team(teamId))`. Appwrite enforces this at the API level; the app also checks `householdId` in code for defence in depth (see `fetchAppliance`).

### Routing (Expo Router v3, file-based)
```
app/
  _layout.tsx          — GestureHandlerRootView > WebContainer > QueryClientProvider > SafeAreaProvider > AuthGate
  (auth)/              — login, register, join (unauthenticated)
  (tabs)/              — index (home), search, settings (authenticated tab bar)
  appliance/[id]/      — appliance detail; drawer/[cid] — compartment item list
  item/add.tsx         — add item (params: applianceId, compartmentId, applianceType, teamId)
  item/[id].tsx        — edit item (params: id, applianceId, compartmentId, applianceType)
```

Auth gate in `_layout.tsx` redirects unauthenticated users to `/(auth)/login` and authenticated users away from `/(auth)` — driven by `useSegments()[0]`.

### Styling
NativeWind v4 — Tailwind `className` props on React Native components. Custom colour tokens in `tailwind.config.js`: `brand`, `success`, `warn`, `danger`, `surface`. Dark mode enabled via `darkMode: 'media'`. The `nativewind-env.d.ts` reference is required for TypeScript to accept `className` props.

### Compartments
Stored as a **JSON string** in a single Appwrite string attribute (not an array attribute). `parseAppliance()` in `src/services/appliances.ts` deserialises on every read; `serialiseCompartments()` serialises on write.

### Notifications
- Client-side: `src/services/notifications.ts` registers the Expo push token and upserts it to the `user_preferences` collection (document ID = userId).
- Server-side: `functions/send-expiry-notifications/` — Appwrite Cloud Function (Node.js 18, cron `0 8 * * *`). Requires its own env vars set in the Appwrite console (`APPWRITE_API_KEY`, `DATABASE_ID`, etc.).

### Testing
`jest.node.config.js` uses `ts-jest` (bypasses Babel/React Native chain entirely). Tests live in `__tests__/utils/` and `__tests__/services/`. The `__mocks__/react-native.js` stub provides a minimal `Platform` for haptics tests.
