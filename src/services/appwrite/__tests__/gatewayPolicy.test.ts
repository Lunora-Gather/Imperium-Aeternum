import { describe, expect, it } from 'vitest';
import {
  assertCommandCategory,
  assertCommandOwnership,
  assertReadyCommandIdentity,
  assertRenewableControl,
  decodeSnapshotPayload,
  isControlActive,
  isWorldDue,
  readyCommandKey,
  wasWorldActiveDuringWindow,
} from '../../../../functions/shared-world-gateway/src/policy.js';
import {
  assertFriendshipParticipants,
  assertMembershipOwner,
  canViewProfile,
  discoverableMemberIds,
  friendshipPairKey,
  friendshipRowId,
  messageRateRowId,
  verifiedNationIdentity,
} from '../../../../functions/social-gateway/src/policy.js';
import { normalizeCloudSavePayload } from '../../../../functions/cloud-save-gateway/src/policy.js';
import { assertFreshEmailOtpSession, assertRecoverablePasswordUser } from '../../../../functions/account-gateway/src/policy.js';

describe('shared world gateway policy', () => {
  const now = Date.parse('2026-07-23T00:00:00.000Z');

  it('normalizes Appwrite JSON downloads with a null prototype', () => {
    const payload = Object.assign(Object.create(null), {
      turn: 4,
      nations: [{ id: 'rome' }],
    });

    const decoded = decodeSnapshotPayload(payload);

    expect(decoded).toEqual({ turn: 4, nations: [{ id: 'rome' }] });
    expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype);
  });

  it('decodes raw snapshot bytes', () => {
    expect(decodeSnapshotPayload(Buffer.from('{"turn":5,"nations":[]}'))).toEqual({
      turn: 5,
      nations: [],
    });
  });

  it('returns expired nation control to AI eligibility', () => {
    expect(isControlActive({ controllerUserId: 'u1', status: 'controlled', leaseExpiresAt: '2026-07-22T00:00:00.000Z' }, now)).toBe(false);
    expect(isControlActive({ controllerUserId: 'u1', status: 'controlled', leaseExpiresAt: '2026-07-24T00:00:00.000Z' }, now)).toBe(true);
  });

  it('requires real activity during the planning window before scheduled progress', () => {
    const world = { pauseWhenEmpty: true, planningDeadlineAt: '2026-07-23T00:00:00.000Z', planningWindowSeconds: 3600 };
    expect(wasWorldActiveDuringWindow(world, [{ lastSeenAt: '2026-07-22T23:30:00.000Z' }])).toBe(true);
    expect(wasWorldActiveDuringWindow(world, [{ lastSeenAt: '2026-07-22T22:30:00.000Z' }])).toBe(false);
  });

  it('only schedules initialized planning worlds after their deadline', () => {
    const world = { status: 'active', phase: 'planning', snapshotFileId: 'file', planningDeadlineAt: '2026-07-22T23:59:00.000Z' };
    expect(isWorldDue(world, now)).toBe(true);
    expect(isWorldDue({ ...world, phase: 'resolving' }, now)).toBe(false);
  });

  it('does not let an idempotency key expose another command', () => {
    const command = { idempotencyKey: 'key-123456', worldId: 'w1', nationId: 'n1', userId: 'u1' };
    expect(assertCommandOwnership(command, command)).toBe(command);
    expect(() => assertCommandOwnership(command, { ...command, userId: 'u2' })).toThrow('幂等标识');
  });

  it('uses one server-owned ready command per nation and turn', () => {
    expect(readyCommandKey('world-1', 7, 'rome')).toBe('ready:world-1:7:rome');
    expect(readyCommandKey('world-1', 8, 'rome')).not.toBe(readyCommandKey('world-1', 7, 'rome'));
  });

  it('does not let renew_control claim or revive another ruler’s nation', () => {
    const active = { controllerUserId: 'u1', status: 'controlled', leaseExpiresAt: '2026-07-24T00:00:00.000Z' };
    expect(assertRenewableControl(active, 'u1', now)).toBe(active);
    expect(() => assertRenewableControl(active, 'u2', now)).toThrow('续期');
    expect(() => assertRenewableControl({ ...active, controllerUserId: null, status: 'available' }, 'u1', now)).toThrow('续期');
    expect(() => assertRenewableControl({ ...active, leaseExpiresAt: '2026-07-22T00:00:00.000Z' }, 'u1', now)).toThrow('续期');
  });

  it('rejects command metadata that lies about the action category', () => {
    expect(assertCommandCategory('military_action', 'declare_war')).toBe('declare_war');
    expect(() => assertCommandCategory('domestic_action', 'declare_war')).toThrow('类别');
    expect(() => assertCommandCategory('military_action', '__proto__')).toThrow('类别');
  });

  it('detects ready-row collisions while permitting an explicit new controller confirmation', () => {
    const command = {
      worldId: 'world-1',
      nationId: 'rome',
      turn: 7,
      commandType: 'set_ready',
      idempotencyKey: readyCommandKey('world-1', 7, 'rome'),
      userId: 'former-controller',
    };
    expect(assertReadyCommandIdentity(command, command)).toBe(command);
    expect(() => assertReadyCommandIdentity(command, { ...command, nationId: 'gaul' })).toThrow('准备状态');
  });
});

describe('social gateway nation identity', () => {
  const now = Date.parse('2026-07-23T00:00:00.000Z');
  const control = { nationId: 'rome', controllerUserId: 'u1', status: 'controlled', leaseExpiresAt: '2026-07-24T00:00:00.000Z' };

  it('accepts only the sender’s active controlled nation', () => {
    expect(verifiedNationIdentity(control, 'u1', 'rome', now)).toBe('rome');
    expect(verifiedNationIdentity(null, 'u1', undefined, now)).toBeNull();
    expect(() => verifiedNationIdentity(control, 'u2', 'rome', now)).toThrow('未受你控制');
  });

  it('uses one atomic message row per sender and rate window', () => {
    expect(messageRateRowId('world', 'world-1', 'user-a', 10_000, 1800)).toBe(messageRateRowId('world', 'world-1', 'user-a', 10_500, 1800));
    expect(messageRateRowId('world', 'world-1', 'user-a', 10_000, 1800)).not.toBe(messageRateRowId('world', 'world-1', 'user-b', 10_000, 1800));
    expect(messageRateRowId('direct', 'pair', 'user-a', 10_000, 1200)).not.toBe(messageRateRowId('world', 'pair', 'user-a', 10_000, 1200));
  });

  it('uses the same friendship identity in both user directions', () => {
    expect(friendshipPairKey('user-a', 'user-b')).toBe(friendshipPairKey('user-b', 'user-a'));
    expect(friendshipRowId('user-a', 'user-b')).toBe(friendshipRowId('user-b', 'user-a'));
  });

  it('rechecks deterministic row identities against their stored owners', () => {
    const membership = { worldId: 'world-1', userId: 'user-a' };
    expect(assertMembershipOwner(membership, 'world-1', 'user-a')).toBe(membership);
    expect(() => assertMembershipOwner(membership, 'world-2', 'user-a')).toThrow('版图成员');

    const friendship = { requesterId: 'user-a', addresseeId: 'user-b', status: 'accepted' };
    expect(assertFriendshipParticipants(friendship, 'user-a', 'user-b')).toBe(friendship);
    expect(() => assertFriendshipParticipants(friendship, 'user-a', 'user-c')).toThrow('好友');
  });

  it('discovers only other unique members of the current world', () => {
    const memberships = [{ userId: 'self' }, { userId: 'friend-a' }, { userId: 'friend-a' }, { userId: 'friend-b' }];
    expect(discoverableMemberIds(memberships, 'self')).toEqual(['friend-a', 'friend-b']);
    expect(discoverableMemberIds(memberships, 'self', 1)).toEqual(['friend-a']);
  });

  it('exposes profiles only to self, friendship participants, or shared-world members', () => {
    const pending = { requesterId: 'user-a', addresseeId: 'user-b', status: 'pending' };
    expect(canViewProfile('user-a', 'user-a', null, false)).toBe(true);
    expect(canViewProfile('user-a', 'user-b', pending, false)).toBe(true);
    expect(canViewProfile('user-a', 'user-b', null, true)).toBe(true);
    expect(canViewProfile('user-a', 'user-b', null, false)).toBe(false);
    expect(canViewProfile('user-a', 'user-c', pending, false)).toBe(false);
  });
});

describe('cloud save gateway payload policy', () => {
  it('derives trusted metadata from the uploaded save payload', () => {
    const raw = JSON.stringify({
      version: 6,
      createdAt: '2026-07-23T00:00:00.000Z',
      gameState: { turn: 17, playerNationId: 'rome', nations: { rome: { name: '罗马' } } },
    });
    expect(normalizeCloudSavePayload(raw, Date.parse('2026-07-23T00:01:00.000Z'))).toEqual({
      saveVersion: 6,
      turn: 17,
      nationName: '罗马',
      clientUpdatedAt: '2026-07-23T00:00:00.000Z',
    });
  });

  it('rejects malformed or future-dated save payloads', () => {
    expect(() => normalizeCloudSavePayload('{"version":6}', Date.now())).toThrow('游戏状态');
    const future = JSON.stringify({ version: 6, createdAt: '2099-01-01T00:00:00.000Z', gameState: { turn: 1 } });
    expect(() => normalizeCloudSavePayload(future, Date.parse('2026-07-23T00:00:00.000Z'))).toThrow('更新时间');
    const unsupported = JSON.stringify({ version: 999, createdAt: '2026-07-23T00:00:00.000Z', gameState: { turn: 1 } });
    expect(() => normalizeCloudSavePayload(unsupported, Date.parse('2026-07-23T00:01:00.000Z'))).toThrow('存档版本');
  });
});

describe('account recovery gateway policy', () => {
  const now = Date.parse('2026-07-23T00:10:00.000Z');

  it('requires a fresh email-factor session for password recovery', () => {
    const session = { userId: 'u1', current: true, provider: 'token', factors: ['email'], $createdAt: '2026-07-23T00:05:00.000Z' };
    expect(assertFreshEmailOtpSession(session, 'u1', now)).toBe(session);
    expect(() => assertFreshEmailOtpSession({ ...session, factors: ['password'] }, 'u1', now)).toThrow('邮箱验证码');
    expect(() => assertFreshEmailOtpSession({ ...session, $createdAt: '2026-07-22T23:30:00.000Z' }, 'u1', now)).toThrow('过期');
  });

  it('updates only the verified existing password owner', () => {
    const user = { $id: 'u1', emailVerification: true, passwordUpdate: '2026-01-01T00:00:00.000Z' };
    expect(assertRecoverablePasswordUser(user, 'u1')).toBe(user);
    expect(() => assertRecoverablePasswordUser({ ...user, $id: 'u2' }, 'u1')).toThrow('验证');
    expect(() => assertRecoverablePasswordUser({ ...user, passwordUpdate: '' }, 'u1')).toThrow('没有可找回');
  });
});
