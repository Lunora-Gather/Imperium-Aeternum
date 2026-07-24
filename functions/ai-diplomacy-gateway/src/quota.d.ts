import type { AIQuotaEntry } from './policy.js';

export interface AIQuotaReservation { plan: AIQuotaEntry[]; quota: { used: number; limit: number } }
export function reserveAIQuota(db: unknown, userId: string, env?: Record<string, string | undefined>): Promise<AIQuotaReservation>;
export function releaseAIQuota(db: unknown, plan: AIQuotaEntry[]): Promise<void>;
