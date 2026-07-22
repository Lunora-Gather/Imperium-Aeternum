import { describe, expect, it } from 'vitest';
import { buildWorldTickPlan } from '../worldClock';
import type { NationControl, SharedWorldInstance } from '../types';

const world = (deadline = '2026-07-22T01:00:00Z'): SharedWorldInstance => ({
  id: 'world-1', templateId: 'template-main', name: '万邦纪元一号', status: 'active', phase: 'planning',
  turn: 7, revision: 12, nationCount: 3, snapshotFileId: null, planningDeadlineAt: deadline,
  tickPolicy: { planningWindowSeconds: 3600, pauseWhenEmpty: true, caretakerEnabled: true, maxNationsPerUser: 3 },
});
const control = (nationId: string, userId: string): NationControl => ({
  id: nationId, worldId: 'world-1', nationId, nationName: nationId, controllerUserId: userId, status: 'controlled',
  claimedAt: '2026-07-20T00:00:00Z', releasedAt: null, leaseExpiresAt: '2026-08-01T00:00:00Z',
  lastActiveAt: '2026-07-22T00:00:00Z', version: 1,
});

describe('living shared-world clock', () => {
  it('pauses without an online controller', () => {
    const plan = buildWorldTickPlan({ world: world(), controls: [control('rome', 'user-a')], nationIds: ['rome', 'qin', 'persia'], onlineUserIds: new Set(), readyNationIds: new Set(), now: new Date('2026-07-22T00:10:00Z') });
    expect(plan.shouldAdvance).toBe(false);
    expect(plan.reason).toBe('empty_world');
    expect(plan.assignments.map((entry) => entry.mode)).toEqual(['human_away', 'ai_autonomous', 'ai_autonomous']);
  });

  it('advances when every online human nation is ready while others auto-progress', () => {
    const plan = buildWorldTickPlan({ world: world(), controls: [control('rome', 'user-a'), control('qin', 'user-b')], nationIds: ['rome', 'qin', 'persia'], onlineUserIds: new Set(['user-a']), readyNationIds: new Set(['rome']), now: new Date('2026-07-22T00:10:00Z') });
    expect(plan.shouldAdvance).toBe(true);
    expect(plan.reason).toBe('all_active_ready');
    expect(plan.assignments).toEqual([
      expect.objectContaining({ nationId: 'rome', mode: 'human_active', ready: true }),
      expect.objectContaining({ nationId: 'qin', mode: 'human_away', ready: true }),
      expect.objectContaining({ nationId: 'persia', mode: 'ai_autonomous', ready: true }),
    ]);
  });

  it('waits for an active player until the deadline, then advances once', () => {
    const context = { world: world('2026-07-22T00:30:00Z'), controls: [control('rome', 'user-a')], nationIds: ['rome', 'qin'], onlineUserIds: new Set(['user-a']), readyNationIds: new Set<string>() };
    expect(buildWorldTickPlan({ ...context, now: new Date('2026-07-22T00:10:00Z') }).reason).toBe('waiting_for_players');
    expect(buildWorldTickPlan({ ...context, now: new Date('2026-07-22T00:31:00Z') })).toMatchObject({ shouldAdvance: true, reason: 'deadline_reached' });
  });
});
