// All Appwrite collection IDs and the database ID are centralised here.
// Every service file imports from this module — never hardcode IDs elsewhere.
//
// NOTE: Expo's Metro bundler can only inline STATIC process.env.KEY references.
// Dynamic access like process.env[key] is not replaced at build time, which
// causes env vars to be empty in production web builds. Always use dot notation.

export const APPWRITE_ENDPOINT   = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT              ?? 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID            ?? '';
export const DATABASE_ID         = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID           ?? 'freezerfamily-db';
export const HOUSEHOLDS_COL      = process.env.EXPO_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION ?? 'households';
export const APPLIANCES_COL      = process.env.EXPO_PUBLIC_APPWRITE_APPLIANCES_COLLECTION ?? 'appliances';
export const ITEMS_COL           = process.env.EXPO_PUBLIC_APPWRITE_ITEMS_COLLECTION      ?? 'items';
export const USER_PREFS_COL      = process.env.EXPO_PUBLIC_APPWRITE_USER_PREFS_COLLECTION ?? 'user_preferences';
