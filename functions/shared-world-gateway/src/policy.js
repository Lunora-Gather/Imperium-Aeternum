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

const COMMAND_ACTIONS = {
  domestic_action: new Set([
    'resolve_event',
    'set_strategy_focus',
    'set_tax_rate',
    'appease_faction',
    'build',
    'research',
    'enact_policy',
    'enact_law',
    'establish_trade_route',
    'embargo_trade_route',
    'develop_province',
    'upgrade_building',
    'demolish_building',
    'suppress_rebellion',
    'negotiate_rebellion',
  ]),
  diplomatic_action: new Set([
    'improve_relation',
    'form_trade',
    'form_alliance',
    'summit',
    'espionage',
    'dynastic_marriage',
    'cultural_export',
  ]),
  military_action: new Set([
    'recruit',
    'declare_war',
    'make_peace',
    'move_army',
  ]),
};

export function assertCommandCategory(commandType, action) {
  if (!COMMAND_ACTIONS[commandType]?.has(action)) {
    throw new Error('共享行动类别与操作不匹配');
  }
  return action;
}

export function assertRenewableControl(control, userId, nowMs = Date.now()) {
  if (
    !control
    || control.controllerUserId !== userId
    || control.status !== 'controlled'
    || (control.leaseExpiresAt && Date.parse(control.leaseExpiresAt) <= nowMs)
  ) {
    throw new Error('只能续期自己仍然有效的国家控制权');
  }
  return control;
}

export function assertReadyCommandIdentity(command, expected) {
  if (
    command.worldId !== expected.worldId
    || command.nationId !== expected.nationId
    || command.turn !== expected.turn
    || command.commandType !== 'set_ready'
    || command.idempotencyKey !== expected.idempotencyKey
  ) {
    throw new Error('准备状态标识已被其他请求占用');
  }
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

export function readyCommandKey(worldId, turn, nationId) {
  return `ready:${worldId}:${turn}:${nationId}`;
}

export function decodeSnapshotPayload(payload) {
  if (payload && typeof payload === 'object'
    && !Buffer.isBuffer(payload)
    && !(payload instanceof ArrayBuffer)
    && !ArrayBuffer.isView(payload)) {
    // JSON downloads are parsed by node-appwrite before they are returned.
    // json-bigint uses null-prototype objects, so normalize the snapshot here.
    return JSON.parse(JSON.stringify(payload));
  }

  const text = typeof payload === 'string'
    ? payload
    : Buffer.from(payload).toString('utf8');
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('共享版图快照格式无效');
  }
  return parsed;
}

