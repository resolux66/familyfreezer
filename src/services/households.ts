import { ID, Permission, Query, Role } from 'appwrite';

import { databases, teams } from '@/lib/appwrite';
import { DATABASE_ID, HOUSEHOLDS_COL } from '@/lib/appwrite.config';
import type { Household } from '@/types';

export interface HouseholdMember {
  membershipId: string;
  userId:       string;
  name:         string;
  email:        string;
  roles:        string[];
  joined:       boolean;
}

export async function fetchHouseholdMembers(teamId: string): Promise<HouseholdMember[]> {
  const res = await teams.listMemberships(teamId);
  return res.memberships.map((m) => ({
    membershipId: m.$id,
    userId:       m.userId,
    name:         m.userName,
    email:        m.userEmail,
    roles:        m.roles,
    joined:       m.confirm,
  }));
}

// 📘 React Native Note — Services layer
// Service files contain pure async functions — no React hooks, no useState.
// They know HOW to talk to Appwrite but not WHEN to call it.
// This separation means the same function can be called from a TanStack Query
// hook, a unit test, or an Appwrite Function without any React dependency.

export async function createHousehold(
  userId: string,
  name: string,
  timezone: string,
): Promise<Household> {
  // 1. Create an Appwrite Team — this is the household's data fence.
  //    Every document in this household will be read-protected by this teamId.
  //    The creator is automatically added as team owner.
  const team = await teams.create(ID.unique(), name);
  const teamId = team.$id;

  // 2. Generate a random 6-char alphanumeric invite code
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // 3. Create the household document with team-scoped permissions.
  //    Permission.read(Role.team(teamId))   — any team member can read
  //    Permission.update(Role.team(teamId)) — any team member can update
  //    Permission.delete(Role.user(userId)) — only the admin can delete
  const doc = await databases.createDocument(
    DATABASE_ID,
    HOUSEHOLDS_COL,
    ID.unique(),
    {
      name,
      adminUserId: userId,
      teamId,
      inviteCode,
      inviteExpiresAt,
      inviteCodeMultiUse: false,
      householdTimezone: timezone,
    },
    [
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId)),
      Permission.delete(Role.user(userId)),
    ],
  );

  return doc as unknown as Household;
}

export async function fetchHouseholdsForUser(userId: string): Promise<Household[]> {
  // Fetch only the teams this user belongs to, then query households by those
  // teamIds. This avoids relying on Appwrite Document Security behaviour and
  // ensures each user only ever sees their own household(s).
  const userTeams = await teams.list();
  if (userTeams.total === 0) return [];

  const teamIds = userTeams.teams.map((t) => t.$id);
  const res = await databases.listDocuments(DATABASE_ID, HOUSEHOLDS_COL, [
    Query.equal('teamId', teamIds),
    Query.limit(50),
  ]);
  return res.documents as unknown as Household[];
}

export async function joinHouseholdByCode(
  code: string,
  userId: string,
  userEmail: string,
  userName: string,
): Promise<Household> {
  // 1. Find the household with this invite code
  const res = await databases.listDocuments(DATABASE_ID, HOUSEHOLDS_COL, [
    Query.equal('inviteCode', code.toUpperCase()),
    Query.limit(1),
  ]);

  if (res.documents.length === 0) {
    throw new Error('Invite code not found. Please check the code and try again.');
  }

  const household = res.documents[0] as unknown as Household;

  // 2. Validate expiry (single-use codes only)
  if (!household.inviteCodeMultiUse && household.inviteExpiresAt) {
    const expiresAt = new Date(household.inviteExpiresAt);
    if (expiresAt < new Date()) {
      throw new Error('This invite code has expired. Ask your admin to generate a new one.');
    }
  }

  // 3. Add the user to the Appwrite Team.
  //    This sends an email invitation — the user must click the link to confirm.
  //    NOTE: For instant join without email, an Appwrite Function with API key
  //    is needed (server-side membership creation). This is Phase 9+ work.
  await teams.createMembership(
    household.teamId,
    ['member'],
    userEmail,
    undefined,
    undefined,
    'freezerfamily://join',
    userName,
  );

  // 4. Mark single-use code as consumed
  if (!household.inviteCodeMultiUse) {
    await databases.updateDocument(DATABASE_ID, HOUSEHOLDS_COL, household.$id, {
      inviteCode: null,
      inviteExpiresAt: null,
    });
  }

  return household;
}

export async function generateInviteCode(
  householdId: string,
  multiUse: boolean,
): Promise<string> {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = multiUse
    ? null
    : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await databases.updateDocument(DATABASE_ID, HOUSEHOLDS_COL, householdId, {
    inviteCode: code,
    inviteExpiresAt: expiresAt,
    inviteCodeMultiUse: multiUse,
  });

  return code;
}
