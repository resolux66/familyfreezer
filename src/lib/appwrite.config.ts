// All Appwrite collection IDs and the database ID are centralised here.
// Every service file imports from this module — never hardcode IDs elsewhere.

function requireEnv(key: string, fallback: string): string {
  const value = process.env[key];
  if (!value || value === '') {
    if (__DEV__) {
      console.warn(
        `[FreezerFamily] Missing env var: ${key}. ` +
        `Add it to your .env file. Using fallback: "${fallback}"`,
      );
    }
    return fallback;
  }
  return value;
}

export const APPWRITE_ENDPOINT   = requireEnv('EXPO_PUBLIC_APPWRITE_ENDPOINT',              'https://cloud.appwrite.io/v1');
export const APPWRITE_PROJECT_ID = requireEnv('EXPO_PUBLIC_APPWRITE_PROJECT_ID',             '');
export const DATABASE_ID         = requireEnv('EXPO_PUBLIC_APPWRITE_DATABASE_ID',            'freezerfamily-db');
export const HOUSEHOLDS_COL      = requireEnv('EXPO_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION',  'households');
export const APPLIANCES_COL      = requireEnv('EXPO_PUBLIC_APPWRITE_APPLIANCES_COLLECTION',  'appliances');
export const ITEMS_COL           = requireEnv('EXPO_PUBLIC_APPWRITE_ITEMS_COLLECTION',       'items');
export const USER_PREFS_COL      = requireEnv('EXPO_PUBLIC_APPWRITE_USER_PREFS_COLLECTION',  'user_preferences');
