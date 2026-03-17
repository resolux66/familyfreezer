import { Account, Client, Databases, Storage, Teams } from 'appwrite';

import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './appwrite.config';

// 📘 React Native Note — Singleton Pattern
// We create ONE Client instance for the whole app and export service objects
// that share it. Creating multiple Client instances would open multiple
// WebSocket connections to Appwrite Realtime, wasting resources.
// The module system guarantees this file only executes once per app session.

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)  // Your Appwrite API URL
  .setProject(APPWRITE_PROJECT_ID); // Scopes all requests to your project

// Each service object is a thin wrapper around the shared client.
// We export them individually so callers import only what they need:
//   import { databases } from '@/lib/appwrite'  ← fast tree-shaking
export const account   = new Account(client);    // Auth: login, register, sessions
export const databases = new Databases(client);  // NoSQL document CRUD
export const teams     = new Teams(client);      // Team (household) membership
export const storage   = new Storage(client);    // File uploads (photos — v1.1)
export { client };                               // Raw client for Realtime subscriptions
