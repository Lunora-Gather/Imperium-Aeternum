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
export function friendshipPairKey(leftUserId: string, rightUserId: string): string;
export function friendshipRowId(leftUserId: string, rightUserId: string): string;
export function messageRateRowId(kind: 'world' | 'direct', channelId: string, userId: string, nowMs: number, windowMs: number): string;
export function assertMembershipOwner<T>(membership: T, worldId: string, userId: string): T;
export function discoverableMemberIds(memberships: Array<{ userId?: string | null }>, userId: string, limit?: number): string[];
export function assertFriendshipParticipants<T>(friendship: T, userId: string, friendUserId: string): T;

