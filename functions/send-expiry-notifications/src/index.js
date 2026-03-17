/**
 * FreezerFamily — send-expiry-notifications
 *
 * Appwrite Cloud Function (Node.js 18 runtime)
 * Schedule: every day at 08:00 UTC  →  CRON: 0 8 * * *
 *
 * What it does:
 *   1. Queries ALL items whose useBy or bestBefore date falls within the
 *      next 2 days (or is already past).
 *   2. Groups them by householdId to avoid per-item database round-trips.
 *   3. For each affected household, fetches team members.
 *   4. Looks up each member's push token from user_preferences.
 *   5. Sends a single batched notification per household via Expo's
 *      push endpoint (https://exp.host/--/api/v2/push/send).
 *
 * Environment variables required in Appwrite console:
 *   APPWRITE_ENDPOINT            — e.g. https://cloud.appwrite.io/v1
 *   APPWRITE_PROJECT_ID          — your project ID
 *   APPWRITE_API_KEY             — server API key with read access to all collections
 *   DATABASE_ID                  — e.g. freezerfamily-db
 *   ITEMS_COL                    — e.g. items
 *   USER_PREFS_COL               — e.g. user_preferences
 *
 * 📘 Appwrite Function Note — server-side vs client-side SDK
 * Client SDK is permission-limited — queries only return documents the
 * logged-in user can read. An Appwrite Function runs with an API Key that
 * grants read access across all documents. This lets us query items for
 * ALL households without being restricted by team permissions.
 */

import { Client, Databases, Query, Teams } from 'node-appwrite';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export default async ({ req, res, log, error }) => {
  // ── Appwrite client setup ────────────────────────────────────────────────
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db    = new Databases(client);
  const teams = new Teams(client);

  const DATABASE_ID    = process.env.DATABASE_ID;
  const ITEMS_COL      = process.env.ITEMS_COL;
  const USER_PREFS_COL = process.env.USER_PREFS_COL;

  // ── Step 1: find items expiring within 2 days (or already expired) ───────
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const cutoff = twoDaysFromNow.toISOString().slice(0, 10); // YYYY-MM-DD

  // Fetch items where useBy ≤ cutoff OR bestBefore ≤ cutoff
  // Appwrite doesn't support OR queries, so we run two queries and merge.
  const [useByResults, bestBeforeResults] = await Promise.all([
    db.listDocuments(DATABASE_ID, ITEMS_COL, [
      Query.lessThanEqual('useBy', cutoff),
      Query.limit(500),
    ]),
    db.listDocuments(DATABASE_ID, ITEMS_COL, [
      Query.lessThanEqual('bestBefore', cutoff),
      Query.limit(500),
    ]),
  ]);

  // Deduplicate by document ID (an item might appear in both result sets)
  const itemMap = new Map();
  [...useByResults.documents, ...bestBeforeResults.documents].forEach((doc) => {
    itemMap.set(doc.$id, doc);
  });
  const expiringItems = [...itemMap.values()];

  if (expiringItems.length === 0) {
    log('No expiring items found. Nothing to notify.');
    return res.json({ sent: 0 });
  }

  log(`Found ${expiringItems.length} expiring/expired items.`);

  // ── Step 2: group items by householdId ────────────────────────────────────
  const byHousehold = new Map();
  for (const item of expiringItems) {
    if (!byHousehold.has(item.householdId)) {
      byHousehold.set(item.householdId, []);
    }
    byHousehold.get(item.householdId).push(item);
  }

  // ── Step 3 & 4: for each household, get members and their push tokens ─────
  const pushMessages = [];

  for (const [householdId, items] of byHousehold.entries()) {
    // Count expired vs expiring soon
    const today = new Date().toISOString().slice(0, 10);
    const expiredCount      = items.filter((i) => (i.useBy ?? i.bestBefore) < today).length;
    const expiringSoonCount = items.length - expiredCount;

    // Build human-readable body
    const parts = [];
    if (expiredCount > 0)      parts.push(`${expiredCount} expired`);
    if (expiringSoonCount > 0) parts.push(`${expiringSoonCount} expiring soon`);
    const body = parts.join(' · ');

    // We need the teamId to list members. Items store householdId, not teamId.
    // Strategy: read first item's householdId and look up the household doc.
    // Alternatively, look at any item — they all belong to the same household.
    // For now, we query user_preferences for any user with a token who has
    // documents in this household. Simpler approach: query USER_PREFS_COL for
    // all users, then filter by checking if they have items in this household.
    //
    // Better: items have addedByUserId. Collect unique user IDs from items.
    const userIds = [...new Set(items.map((i) => i.addedByUserId).filter(Boolean))];

    for (const userId of userIds) {
      try {
        const prefs = await db.getDocument(DATABASE_ID, USER_PREFS_COL, userId);
        if (prefs.pushToken && prefs.notificationsEnabled) {
          pushMessages.push({
            to:    prefs.pushToken,
            title: '❄️ FreezerFamily',
            body,
            data:  { householdId },
            sound: 'default',
          });
        }
      } catch {
        // User has no prefs doc — they haven't enabled notifications yet
      }
    }
  }

  if (pushMessages.length === 0) {
    log('No users have push tokens registered. Nothing sent.');
    return res.json({ sent: 0 });
  }

  // ── Step 5: send notifications via Expo push API ─────────────────────────
  // Expo's API accepts up to 100 messages per request. Chunk accordingly.
  const CHUNK_SIZE = 100;
  let sent = 0;

  for (let i = 0; i < pushMessages.length; i += CHUNK_SIZE) {
    const chunk = pushMessages.slice(i, i + CHUNK_SIZE);
    const response = await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(chunk),
    });

    if (!response.ok) {
      error(`Expo push API returned ${response.status}: ${await response.text()}`);
    } else {
      sent += chunk.length;
      log(`Sent chunk of ${chunk.length} notifications.`);
    }
  }

  log(`Total notifications dispatched: ${sent}`);
  return res.json({ sent });
};
