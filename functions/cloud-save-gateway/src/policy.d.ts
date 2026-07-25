export interface CloudSaveMetadata {
  saveVersion: number;
  turn: number;
  nationName: string;
  clientUpdatedAt: string;
}

export function normalizeCloudSavePayload(raw: string, nowMs?: number): CloudSaveMetadata;
