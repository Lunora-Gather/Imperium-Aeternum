export function isControlActive(control, nowMs = Date.now()) {
  if (!control?.controllerUserId || control.status !== 'controlled') return false;
  return !control.leaseExpiresAt || Date.parse(control.leaseExpiresAt) > nowMs;
}

export function assertCommandOwnership(command, expected) {
  if (
    command.idempotencyKey !== expected.idempotencyKey
    || command.worldId !== expected.worldId
    || command.nationId !== expected.nationId
    || command.userId !== expected.userId
  ) throw new Error('行动幂等标识已被其他请求占用');
  return command;
}

export function wasWorldActiveDuringWindow(world, memberships) {
  if (!world.pauseWhenEmpty) return true;
  const deadline = Date.parse(world.planningDeadlineAt);
  const windowMs = Number(world.planningWindowSeconds) * 1000;
  if (!Number.isFinite(deadline) || !Number.isFinite(windowMs) || windowMs <= 0) return false;
  const openedAt = deadline - windowMs;
  return memberships.some((membership) => Date.parse(membership.lastSeenAt) >= openedAt);
}

export function isWorldDue(world, nowMs = Date.now()) {
  return world?.status === 'active'
    && world.phase === 'planning'
    && !!world.snapshotFileId
    && Date.parse(world.planningDeadlineAt) <= nowMs;
}

