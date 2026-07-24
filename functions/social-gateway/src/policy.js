export function verifiedNationIdentity(control, userId, requestedNationId, nowMs = Date.now()) {
  if (!requestedNationId) return null;
  const active = control
    && control.nationId === requestedNationId
    && control.controllerUserId === userId
    && control.status === 'controlled'
    && (!control.leaseExpiresAt || Date.parse(control.leaseExpiresAt) > nowMs);
  if (!active) throw new Error('不能以未受你控制的国家身份发言');
  return requestedNationId;
}

function hash(value) {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 0x01000193);
  return (result >>> 0).toString(16).padStart(8, '0');
}

export function messageRateRowId(kind, channelId, userId, nowMs, windowMs) {
  const prefix = kind === 'direct' ? 'dm' : 'wm';
  return `${prefix}_${hash(String(channelId))}_${hash(String(userId))}_${Math.floor(nowMs / windowMs).toString(36)}`;
}

