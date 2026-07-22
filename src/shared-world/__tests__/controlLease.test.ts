import { describe, expect, it } from 'vitest';
import { canClaimNation, claimNationControl, nationControlRowId, releaseNationControl } from '../controlLease';
import type { NationControl } from '../types';

const base = (): NationControl => ({
  id: 'control', worldId: 'world-1', nationId: 'rome', nationName: '罗马', controllerUserId: null,
  status: 'available', claimedAt: null, releasedAt: null, leaseExpiresAt: null, lastActiveAt: null, version: 0,
});

describe('shared-world nation control lease', () => {
  it('produces a stable Appwrite-safe row id', () => {
    expect(nationControlRowId('world-1', 'rome')).toBe(nationControlRowId('world-1', 'rome'));
    expect(nationControlRowId('world-1', 'rome')).not.toBe(nationControlRowId('world-2', 'rome'));
    expect(nationControlRowId('world-1', 'rome').length).toBeLessThanOrEqual(36);
  });

  it('claims an available nation and blocks another user', () => {
    const now = new Date('2026-07-22T00:00:00Z');
    const claimed = claimNationControl(base(), 'user-a', now);
    expect(claimed.controllerUserId).toBe('user-a');
    expect(claimed.status).toBe('controlled');
    expect(canClaimNation(claimed, 'user-b', now)).toBe(false);
    expect(() => claimNationControl(claimed, 'user-b', now)).toThrow('已由其他玩家控制');
  });

  it('allows reclaim after lease expiry and explicit release by owner', () => {
    const now = new Date('2026-07-22T00:00:00Z');
    const claimed = { ...claimNationControl(base(), 'user-a', now), leaseExpiresAt: '2026-07-21T23:59:59Z' };
    expect(canClaimNation(claimed, 'user-b', now)).toBe(true);
    const reclaimed = claimNationControl(claimed, 'user-b', now);
    expect(reclaimed.controllerUserId).toBe('user-b');
    const released = releaseNationControl(reclaimed, 'user-b', now);
    expect(released).toMatchObject({ controllerUserId: null, status: 'available', leaseExpiresAt: null });
  });
});
