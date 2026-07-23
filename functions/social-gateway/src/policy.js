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

