/**
 * FreezerFamily — reset-demo-data
 *
 * Appwrite Cloud Function (Node.js 18 runtime)
 * Schedule: every day at 00:00 UTC  →  CRON: 0 0 * * *
 *
 * What it does:
 *   1. Looks up the demo user by email (demo@freezerfamily.app).
 *   2. Finds the demo household via the households collection.
 *   3. Deletes ALL existing appliances and items for that household.
 *   4. Re-creates a fixed realistic dataset:
 *        - 1 freezer  "Garage Freezer"  with 3 drawers
 *        - 1 fridge   "Kitchen Fridge"  with 2 shelves
 *        - Realistic items spread across both, including one expiring tomorrow
 *
 * Environment variables required in Appwrite console:
 *   APPWRITE_ENDPOINT      — e.g. https://cloud.appwrite.io/v1
 *   APPWRITE_PROJECT_ID    — your project ID
 *   APPWRITE_API_KEY       — server API key with full database + users access
 *   DATABASE_ID            — e.g. freezerfamily-db
 *   HOUSEHOLDS_COL         — e.g. household  (your actual collection ID)
 *   APPLIANCES_COL         — e.g. appliances
 *   ITEMS_COL              — e.g. items
 *   DEMO_EMAIL             — demo@freezerfamily.app
 *   DEMO_TEAM_ID           — the Appwrite Team ID for the demo household
 *                            (copy this from Appwrite Console → Auth → Teams)
 *
 * 📘 Appwrite Function Note — compartments are stored as a JSON string
 * The client app serialises the compartments array to a JSON string before
 * writing to Appwrite. This function must do the same.
 */

import { Client, Databases, ID, Permission, Query, Role, Teams, Users } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // ── Appwrite client setup ────────────────────────────────────────────────
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db    = new Databases(client);
  const users = new Users(client);
  const teamsService = new Teams(client);

  const DATABASE_ID    = process.env.DATABASE_ID;
  const HOUSEHOLDS_COL = process.env.HOUSEHOLDS_COL;
  const APPLIANCES_COL = process.env.APPLIANCES_COL;
  const ITEMS_COL      = process.env.ITEMS_COL;
  const DEMO_EMAIL     = process.env.DEMO_EMAIL     ?? 'demo@freezerfamily.app';
  const DEMO_TEAM_ID   = process.env.DEMO_TEAM_ID;

  if (!DEMO_TEAM_ID) {
    error('DEMO_TEAM_ID env var is not set. Aborting.');
    return res.json({ ok: false, reason: 'DEMO_TEAM_ID missing' }, 500);
  }

  // ── 1. Find the demo user ────────────────────────────────────────────────
  log(`Looking up demo user: ${DEMO_EMAIL}`);
  const userList = await users.list([Query.equal('email', DEMO_EMAIL)]);
  if (userList.total === 0) {
    error(`Demo user ${DEMO_EMAIL} not found. Create the account in Appwrite Console first.`);
    return res.json({ ok: false, reason: 'demo user not found' }, 500);
  }
  const demoUserId = userList.users[0].$id;
  log(`Demo user ID: ${demoUserId}`);

  // ── 1b. Ensure demo user is a confirmed member of the demo team ──────────
  log('Ensuring demo user is a confirmed team member…');
  const memberships = await teamsService.listMemberships(DEMO_TEAM_ID);
  const existing = memberships.memberships.find((m) => m.userId === demoUserId);
  if (existing && !existing.confirm) {
    // Unconfirmed (email invite) — delete and recreate via userId so it's auto-confirmed
    await teamsService.deleteMembership(DEMO_TEAM_ID, existing.$id);
    await teamsService.createMembership(DEMO_TEAM_ID, ['owner'], undefined, demoUserId);
    log('Replaced unconfirmed membership with confirmed membership.');
  } else if (!existing) {
    await teamsService.createMembership(DEMO_TEAM_ID, ['owner'], undefined, demoUserId);
    log('Demo user added to team as confirmed member.');
  } else {
    log('Demo user already a confirmed team member.');
  }

  // ── 2. Find the demo household ───────────────────────────────────────────
  log('Looking up demo household…');
  const householdList = await db.listDocuments(DATABASE_ID, HOUSEHOLDS_COL, [
    Query.limit(100),
  ]);
  // The demo household is the one whose teamId matches DEMO_TEAM_ID
  const householdDoc = householdList.documents.find(
    (d) => d.teamId === DEMO_TEAM_ID,
  );
  if (!householdDoc) {
    error(`No household found with teamId=${DEMO_TEAM_ID}. Create it via the app first.`);
    return res.json({ ok: false, reason: 'demo household not found' }, 500);
  }
  const householdId = householdDoc.$id;
  log(`Demo household ID: ${householdId}`);

  // ── 2b. Fix household document permissions ────────────────────────────────
  // The document permissions may reference an old team. Update them to always
  // match the current DEMO_TEAM_ID so the demo user can read the document.
  await db.updateDocument(DATABASE_ID, HOUSEHOLDS_COL, householdId, {}, [
    Permission.read(Role.team(DEMO_TEAM_ID)),
    Permission.update(Role.team(DEMO_TEAM_ID)),
    Permission.delete(Role.user(demoUserId)),
  ]);
  log('Household permissions updated.');

  // ── 3. Delete all existing items for this household ──────────────────────
  log('Deleting existing items…');
  let deletedItems = 0;
  let cursor;
  while (true) {
    const queries = [Query.equal('householdId', householdId), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await db.listDocuments(DATABASE_ID, ITEMS_COL, queries);
    if (page.documents.length === 0) break;

    await Promise.all(
      page.documents.map((d) => db.deleteDocument(DATABASE_ID, ITEMS_COL, d.$id)),
    );
    deletedItems += page.documents.length;

    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }
  log(`Deleted ${deletedItems} items.`);

  // ── 4. Delete all existing appliances for this household ─────────────────
  log('Deleting existing appliances…');
  let deletedAppliances = 0;
  cursor = undefined;
  while (true) {
    const queries = [Query.equal('householdId', householdId), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await db.listDocuments(DATABASE_ID, APPLIANCES_COL, queries);
    if (page.documents.length === 0) break;

    await Promise.all(
      page.documents.map((d) => db.deleteDocument(DATABASE_ID, APPLIANCES_COL, d.$id)),
    );
    deletedAppliances += page.documents.length;

    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1].$id;
  }
  log(`Deleted ${deletedAppliances} appliances.`);

  // ── 5. Build date helpers ────────────────────────────────────────────────
  function isoDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString();
  }

  const today     = isoDate(0);
  const teamPerms = [
    Permission.read(Role.team(DEMO_TEAM_ID)),
    Permission.update(Role.team(DEMO_TEAM_ID)),
    Permission.delete(Role.team(DEMO_TEAM_ID)),
  ];

  // ── 6. Create freezer with 3 drawers ─────────────────────────────────────
  log('Creating Garage Freezer…');
  const freezerDrawers = [
    { id: ID.unique(), label: 'Top Drawer',    order: 0 },
    { id: ID.unique(), label: 'Middle Drawer', order: 1 },
    { id: ID.unique(), label: 'Bottom Drawer', order: 2 },
  ];

  const freezer = await db.createDocument(
    DATABASE_ID, APPLIANCES_COL, ID.unique(),
    {
      householdId,
      name: 'Garage Freezer',
      type: 'freezer',
      compartments: JSON.stringify(freezerDrawers),
    },
    teamPerms,
  );
  log(`Created freezer: ${freezer.$id}`);

  const [topDrawer, midDrawer, botDrawer] = freezerDrawers;

  // ── 7. Create fridge with 2 shelves ──────────────────────────────────────
  log('Creating Kitchen Fridge…');
  const fridgeShelves = [
    { id: ID.unique(), label: 'Top Shelf',    order: 0 },
    { id: ID.unique(), label: 'Bottom Shelf', order: 1 },
  ];

  const fridge = await db.createDocument(
    DATABASE_ID, APPLIANCES_COL, ID.unique(),
    {
      householdId,
      name: 'Kitchen Fridge',
      type: 'fridge',
      compartments: JSON.stringify(fridgeShelves),
    },
    teamPerms,
  );
  log(`Created fridge: ${fridge.$id}`);

  const [topShelf, botShelf] = fridgeShelves;

  // ── 8. Create demo items ──────────────────────────────────────────────────
  // Helper to create one item
  async function addItem({ applianceId, compartmentId, name, quantity, bestBefore, useBy, notes }) {
    return db.createDocument(
      DATABASE_ID, ITEMS_COL, ID.unique(),
      {
        householdId,
        applianceId,
        compartmentId,
        name,
        quantity,
        dateAdded:     today,
        bestBefore:    bestBefore ?? null,
        useBy:         useBy      ?? null,
        notes:         notes      ?? null,
        addedByUserId: demoUserId,
        updatedAt:     today,
      },
      teamPerms,
    );
  }

  log('Creating demo items…');

  // Freezer — Top Drawer
  await addItem({ applianceId: freezer.$id, compartmentId: topDrawer.id,  name: 'Chicken Breasts',      quantity: '4 pieces',  useBy: isoDate(90) });
  await addItem({ applianceId: freezer.$id, compartmentId: topDrawer.id,  name: 'Beef Mince',           quantity: '500g',      useBy: isoDate(60) });
  await addItem({ applianceId: freezer.$id, compartmentId: topDrawer.id,  name: 'Salmon Fillets',       quantity: '2 fillets', useBy: isoDate(45) });

  // Freezer — Middle Drawer
  await addItem({ applianceId: freezer.$id, compartmentId: midDrawer.id,  name: 'Frozen Peas',          quantity: '750g bag',  bestBefore: isoDate(180) });
  await addItem({ applianceId: freezer.$id, compartmentId: midDrawer.id,  name: 'Frozen Chips',         quantity: '1kg bag',   bestBefore: isoDate(120) });
  await addItem({ applianceId: freezer.$id, compartmentId: midDrawer.id,  name: 'Pizza Margherita',     quantity: '1 pizza',   bestBefore: isoDate(30)  });

  // Freezer — Bottom Drawer  (one expiring TOMORROW — triggers expiry banner)
  await addItem({ applianceId: freezer.$id, compartmentId: botDrawer.id,  name: 'Fish Fingers',         quantity: '10 pieces', useBy: isoDate(1)   }); // ← expires tomorrow
  await addItem({ applianceId: freezer.$id, compartmentId: botDrawer.id,  name: 'Bolognese Sauce',      quantity: '2 portions', notes: 'Home-made', bestBefore: isoDate(90) });
  await addItem({ applianceId: freezer.$id, compartmentId: botDrawer.id,  name: 'Ice Cream',            quantity: '500ml tub', bestBefore: isoDate(200) });

  // Fridge — Top Shelf
  await addItem({ applianceId: fridge.$id,  compartmentId: topShelf.id,   name: 'Semi-Skimmed Milk',    quantity: '2 litres',  useBy: isoDate(5)  });
  await addItem({ applianceId: fridge.$id,  compartmentId: topShelf.id,   name: 'Greek Yoghurt',        quantity: '500g',      bestBefore: isoDate(7)  });
  await addItem({ applianceId: fridge.$id,  compartmentId: topShelf.id,   name: 'Cheddar Cheese',       quantity: '400g block', bestBefore: isoDate(21) });
  await addItem({ applianceId: fridge.$id,  compartmentId: topShelf.id,   name: 'Orange Juice',         quantity: '1 litre',   bestBefore: isoDate(4)  });

  // Fridge — Bottom Shelf
  await addItem({ applianceId: fridge.$id,  compartmentId: botShelf.id,   name: 'Leftover Pasta',       quantity: '2 portions', notes: 'Tue dinner', useBy: isoDate(2) });
  await addItem({ applianceId: fridge.$id,  compartmentId: botShelf.id,   name: 'Smoked Salmon',        quantity: '100g pack', useBy: isoDate(3)  });
  await addItem({ applianceId: fridge.$id,  compartmentId: botShelf.id,   name: 'Free-Range Eggs',      quantity: '6 eggs',    bestBefore: isoDate(14) });

  log('Demo data reset complete.');
  return res.json({ ok: true, householdId, freezerId: freezer.$id, fridgeId: fridge.$id });
};
