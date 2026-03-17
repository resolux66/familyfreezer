export interface Household {
  $id: string;
  name: string;
  adminUserId: string;
  teamId: string;
  inviteCode: string | null;
  inviteExpiresAt: string | null;
  inviteCodeMultiUse: boolean;
  householdTimezone: string;
  createdAt: string;
}

export interface CreateHouseholdInput {
  name: string;
  householdTimezone: string;
}
