export interface ControlPolicyRow {
  controllerUserId?: string | null;
  status?: string;
  leaseExpiresAt?: string | null;
}

export interface CommandPolicyRow {
  idempotencyKey: string;
  worldId: string;
  nationId: string;
  userId: string;
}

export interface WorldSchedulePolicyRow {
  status?: string;
  phase?: string;
  snapshotFileId?: string | null;
  pauseWhenEmpty?: boolean;
  planningDeadlineAt: string;
  planningWindowSeconds?: number;
}

export function isControlActive(control: ControlPolicyRow | null | undefined, nowMs?: number): boolean;
export function assertCommandOwnership<T extends CommandPolicyRow>(command: T, expected: CommandPolicyRow): T;
export function wasWorldActiveDuringWindow(world: WorldSchedulePolicyRow, memberships: { lastSeenAt: string }[]): boolean;
export function isWorldDue(world: WorldSchedulePolicyRow | null | undefined, nowMs?: number): boolean;
