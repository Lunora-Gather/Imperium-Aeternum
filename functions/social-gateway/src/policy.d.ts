export interface NationIdentityControl {
  nationId?: string;
  controllerUserId?: string | null;
  status?: string;
  leaseExpiresAt?: string | null;
}

export function verifiedNationIdentity(
  control: NationIdentityControl | null | undefined,
  userId: string,
  requestedNationId: string | null | undefined,
  nowMs?: number,
): string | null;

