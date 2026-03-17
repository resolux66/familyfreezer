import { ID, Permission, Query, Role } from 'appwrite';

import { databases } from '@/lib/appwrite';
import { APPLIANCES_COL, DATABASE_ID } from '@/lib/appwrite.config';
import type { Appliance, Compartment, CreateApplianceInput } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Appwrite stores the compartments JSON array as a plain string attribute.
// These helpers serialise/deserialise on the way in and out.
function serialiseCompartments(compartments: Compartment[]): string {
  return JSON.stringify(compartments);
}

function parseAppliance(doc: Record<string, unknown>): Appliance {
  return {
    ...(doc as unknown as Appliance),
    compartments: typeof doc.compartments === 'string'
      ? (JSON.parse(doc.compartments) as Compartment[])
      : ((doc.compartments as Compartment[]) ?? []),
  };
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function fetchAppliances(householdId: string): Promise<Appliance[]> {
  const res = await databases.listDocuments(DATABASE_ID, APPLIANCES_COL, [
    Query.equal('householdId', householdId),  // ALWAYS filter by householdId
    Query.orderAsc('$createdAt'),
    Query.limit(100),
  ]);
  return res.documents.map(parseAppliance);
}

export async function fetchAppliance(
  householdId: string,
  applianceId: string,
): Promise<Appliance> {
  const doc = await databases.getDocument(DATABASE_ID, APPLIANCES_COL, applianceId);
  // Belt-and-suspenders check: even though Appwrite permissions prevent cross-
  // household reads, we verify householdId in code too for defence in depth.
  if ((doc as Record<string, unknown>).householdId !== householdId) {
    throw new Error('Appliance does not belong to this household.');
  }
  return parseAppliance(doc as Record<string, unknown>);
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function createAppliance(
  householdId: string,
  teamId: string,
  input: CreateApplianceInput,
): Promise<Appliance> {
  const compartments: Compartment[] = input.compartments.map((c, i) => ({
    id: ID.unique(),
    label: c.label,
    order: i,
  }));

  const doc = await databases.createDocument(
    DATABASE_ID,
    APPLIANCES_COL,
    ID.unique(),
    {
      householdId,
      name: input.name,
      type: input.type,
      compartments: serialiseCompartments(compartments),
    },
    [
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId)),
      Permission.delete(Role.team(teamId)),
    ],
  );

  return parseAppliance(doc as Record<string, unknown>);
}

export async function updateAppliance(
  applianceId: string,
  updates: Partial<{ name: string; compartments: Compartment[] }>,
): Promise<Appliance> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.compartments !== undefined) {
    payload.compartments = serialiseCompartments(updates.compartments);
  }

  const doc = await databases.updateDocument(
    DATABASE_ID, APPLIANCES_COL, applianceId, payload,
  );
  return parseAppliance(doc as Record<string, unknown>);
}

export async function deleteAppliance(applianceId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, APPLIANCES_COL, applianceId);
}
