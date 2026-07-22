import type { NationControl } from './types';

const DEFAULT_LEASE_DAYS = 14;

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 0x01000193);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function nationControlRowId(worldId: string, nationId: string): string {
  return `ctl_${stableHash(worldId)}_${stableHash(nationId)}`;
}

export function isControlLeaseExpired(control: NationControl, now: Date): boolean {
  return !!control.leaseExpiresAt && Date.parse(control.leaseExpiresAt) <= now.getTime();
}

export function canClaimNation(control: NationControl, userId: string, now: Date): boolean {
  return control.controllerUserId === userId
    || control.status === 'available'
    || !control.controllerUserId
    || isControlLeaseExpired(control, now);
}

export function claimNationControl(control: NationControl, userId: string, now: Date, leaseDays = DEFAULT_LEASE_DAYS): NationControl {
  if (!canClaimNation(control, userId, now)) throw new Error('该国家已由其他玩家控制');
  return {
    ...control,
    controllerUserId: userId,
    status: 'controlled',
    claimedAt: control.controllerUserId === userId ? control.claimedAt : now.toISOString(),
    releasedAt: null,
    lastActiveAt: now.toISOString(),
    leaseExpiresAt: new Date(now.getTime() + leaseDays * 86_400_000).toISOString(),
    version: control.version + 1,
  };
}

export function releaseNationControl(control: NationControl, userId: string, now: Date): NationControl {
  if (control.controllerUserId !== userId) throw new Error('只有当前控制者可以释放该国家');
  return {
    ...control,
    controllerUserId: null,
    status: 'available',
    releasedAt: now.toISOString(),
    leaseExpiresAt: null,
    lastActiveAt: null,
    version: control.version + 1,
  };
}
