import type { ScenarioId } from '../store/scenarioCatalog';

export type SharedWorldStatus = 'forming' | 'active' | 'paused' | 'archived';
export type SharedWorldPhase = 'planning' | 'resolving';
export type NationControlStatus = 'available' | 'controlled';
export type NationRuntimeMode = 'human_active' | 'human_away' | 'ai_autonomous';
export type SharedWorldRole = 'member' | 'moderator' | 'owner';

export interface WorldTemplate {
  id: string;
  scenarioId: ScenarioId;
  name: string;
  version: number;
  enabled: boolean;
}

export interface WorldTickPolicy {
  /** Minimum planning window after the previous resolution. */
  planningWindowSeconds: number;
  /** Stop scheduled resolutions when no controller is online. */
  pauseWhenEmpty: boolean;
  /** Offline human nations receive conservative AI orders. */
  caretakerEnabled: boolean;
  maxNationsPerUser: number;
}

export interface SharedWorldInstance {
  id: string;
  templateId: string;
  name: string;
  status: SharedWorldStatus;
  phase: SharedWorldPhase;
  turn: number;
  revision: number;
  nationCount: number;
  snapshotFileId: string | null;
  planningDeadlineAt: string;
  tickPolicy: WorldTickPolicy;
}

export interface WorldMembership {
  id: string;
  worldId: string;
  userId: string;
  role: SharedWorldRole;
  joinedAt: string;
  lastSeenAt: string;
}

export interface NationControl {
  id: string;
  worldId: string;
  nationId: string;
  nationName: string;
  controllerUserId: string | null;
  status: NationControlStatus;
  claimedAt: string | null;
  releasedAt: string | null;
  leaseExpiresAt: string | null;
  lastActiveAt: string | null;
  version: number;
}

export interface NationRuntimeAssignment {
  nationId: string;
  controllerUserId: string | null;
  mode: NationRuntimeMode;
  ready: boolean;
}

export interface WorldTickPlan {
  worldId: string;
  baseRevision: number;
  turn: number;
  shouldAdvance: boolean;
  reason: 'world_inactive' | 'empty_world' | 'waiting_for_players' | 'all_active_ready' | 'deadline_reached';
  assignments: NationRuntimeAssignment[];
}

export type SharedWorldCommandType = 'set_ready' | 'domestic_action' | 'diplomatic_action' | 'military_action';

export interface SharedWorldCommandEnvelope<TPayload = unknown> {
  worldId: string;
  nationId: string;
  baseRevision: number;
  commandType: SharedWorldCommandType;
  idempotencyKey: string;
  payload: TPayload;
}
