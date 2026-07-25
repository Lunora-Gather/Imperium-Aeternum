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

export function friendshipPairKey(leftUserId, rightUserId) {
  return [String(leftUserId), String(rightUserId)].sort().join(':');
}

export function friendshipRowId(leftUserId, rightUserId) {
  const key = friendshipPairKey(leftUserId, rightUserId);
  return `friend_${hash(key)}_${hash(`friend:${key}`)}`;
}

export function messageRateRowId(kind, channelId, userId, nowMs, windowMs) {
  const prefix = kind === 'direct' ? 'dm' : 'wm';
  return `${prefix}_${hash(String(channelId))}_${hash(String(userId))}_${Math.floor(nowMs / windowMs).toString(36)}`;
}

export function assertMembershipOwner(membership, worldId, userId) {
  if (!membership || membership.worldId !== worldId || membership.userId !== userId) throw new Error('只有该版图成员可以使用聊天室');
  return membership;
}

export function discoverableMemberIds(memberships, userId, limit = 100) {
  return [...new Set(
    memberships
      .map((membership) => String(membership?.userId ?? '').trim())
      .filter((memberId) => memberId && memberId !== userId),
  )].slice(0, limit);
}

export function assertFriendshipParticipants(friendship, userId, friendUserId) {
  const participants = [friendship?.requesterId, friendship?.addresseeId];
  if (friendship?.status !== 'accepted' || !participants.includes(userId) || !participants.includes(friendUserId)) {
    throw new Error('只有已接受的好友可以私聊');
  }
  return friendship;
}

