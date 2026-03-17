export type ExpiryStatus = 'ok' | 'expiring_soon' | 'expired' | 'none';

export interface Item {
  $id: string;
  householdId: string;
  applianceId: string;
  compartmentId: string;
  name: string;
  quantity: string;
  dateAdded: string;
  bestBefore?: string | null;
  useBy?: string | null;
  notes?: string | null;
  addedByUserId: string;
  updatedAt: string;
  expiryStatus?: ExpiryStatus;
}

export interface CreateItemInput {
  name: string;
  quantity: string;
  bestBefore?: string | null;
  useBy?: string | null;
  notes?: string | null;
}
