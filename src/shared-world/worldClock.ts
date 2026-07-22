import { isControlLeaseExpired } from './controlLease';
import type { NationControl, NationRuntimeAssignment, SharedWorldInstance, WorldTickPlan } from './types';

export interface WorldTickContext {
  world: SharedWorldInstance;
  controls: readonly NationControl[];
  nationIds: readonly string[];
  onlineUserIds: ReadonlySet<string>;
  readyNationIds: ReadonlySet<string>;
  now: Date;
}

function assignmentForNation(context: WorldTickContext, nationId: string): NationRuntimeAssignment {
  const control = context.controls.find((entry) => entry.nationId === nationId && entry.worldId === context.world.id);
  const controllerUserId = control?.controllerUserId ?? null;
  const leaseActive = !!control && !isControlLeaseExpired(control, context.now);
  const controllerOnline = !!controllerUserId && leaseActive && context.onlineUserIds.has(controllerUserId);
  if (controllerOnline) {
    return { nationId, controllerUserId, mode: 'human_active', ready: context.readyNationIds.has(nationId) };
  }
  if (controllerUserId && leaseActive && context.world.tickPolicy.caretakerEnabled) {
    return { nationId, controllerUserId, mode: 'human_away', ready: true };
  }
  return { nationId, controllerUserId: leaseActive ? controllerUserId : null, mode: 'ai_autonomous', ready: true };
}

export function buildWorldTickPlan(context: WorldTickContext): WorldTickPlan {
  const assignments = context.nationIds.map((nationId) => assignmentForNation(context, nationId));
  const base = { worldId: context.world.id, baseRevision: context.world.revision, turn: context.world.turn, assignments };
  if (context.world.status !== 'active' || context.world.phase !== 'planning') {
    return { ...base, shouldAdvance: false, reason: 'world_inactive' };
  }
  const activeHumans = assignments.filter((entry) => entry.mode === 'human_active');
  if (context.world.tickPolicy.pauseWhenEmpty && activeHumans.length === 0) {
    return { ...base, shouldAdvance: false, reason: 'empty_world' };
  }
  const deadlineReached = Date.parse(context.world.planningDeadlineAt) <= context.now.getTime();
  if (deadlineReached) return { ...base, shouldAdvance: true, reason: 'deadline_reached' };
  if (activeHumans.every((entry) => entry.ready)) return { ...base, shouldAdvance: true, reason: 'all_active_ready' };
  return { ...base, shouldAdvance: false, reason: 'waiting_for_players' };
}
