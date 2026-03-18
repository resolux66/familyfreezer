# FreezerFamily

A cross-platform household food inventory app for tracking what's in your fridge and freezer. Get expiry alerts before food goes to waste.

**Live demo:** [familyfreezer.jozefmrazik.co.uk](https://familyfreezer.jozefmrazik.co.uk)

## Features

- Track items across multiple fridges and freezers
- Organised by appliance and compartment (drawers/shelves)
- Expiry and best-before date alerts
- Household sharing — invite family members to view and edit
- Search across all items
- Push notifications for expiring items
- Demo mode with pre-seeded data (resets daily)

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 55, managed workflow) |
| Navigation | Expo Router v3 |
| Styling | NativeWind v4 (Tailwind CSS) |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Backend | Appwrite Cloud |
| Icons | Lucide React Native |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- An [Appwrite Cloud](https://cloud.appwrite.io) account

### Installation

```bash
git clone https://github.com/yourusername/freezerfamily.git
cd freezerfamily/familyfreezer
npm install
```

### Environment Variables

Create a `.env` file in the `familyfreezer/` directory:

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
EXPO_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION=household
EXPO_PUBLIC_APPWRITE_APPLIANCES_COLLECTION=appliances
EXPO_PUBLIC_APPWRITE_ITEMS_COLLECTION=items
EXPO_PUBLIC_APPWRITE_USER_PREFS_COLLECTION=user_preferences
```

### Run

```bash
npx expo start
```

Press `w` for web, `i` for iOS simulator, `a` for Android emulator.

## Appwrite Setup

1. Create a project in Appwrite Cloud
2. Create a database with collections: `household`, `appliances`, `items`, `user_preferences`
3. Enable **Document Security** on all collections
4. Add `Users → Create` permission to each collection
5. Add your app's hostname as a Web platform in Appwrite Console

## Demo Mode

The app includes a demo account (`demo@freezerfamily.app`) with a pre-seeded household containing realistic data. Data resets daily at midnight via an Appwrite Cloud Function (`functions/reset-demo-data`).

## Deploying (Web)

```bash
npx expo export --platform web
```

Upload the `dist/` folder to any static host (Netlify, Vercel, etc.).

## Running Tests

```bash
npm test
```

## Project Structure

```
familyfreezer/
├── app/                  # Expo Router screens
│   ├── (auth)/           # Login, register, join
│   ├── (tabs)/           # Home, search, settings
│   ├── appliance/        # Appliance detail screens
│   └── item/             # Item add/edit screens
├── src/
│   ├── components/       # UI components
│   ├── hooks/            # TanStack Query hooks
│   ├── services/         # Appwrite service functions
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Helper utilities
└── functions/
    └── reset-demo-data/  # Appwrite Cloud Function
```

## License

MIT
