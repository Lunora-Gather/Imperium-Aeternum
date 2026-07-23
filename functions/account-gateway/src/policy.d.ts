export interface RecoverySession { userId: string; current: boolean; provider: string; factors: string[]; $createdAt: string }
export interface RecoveryUser { $id: string; emailVerification: boolean; passwordUpdate?: string | null }
export function assertFreshEmailOtpSession<T extends RecoverySession>(session: T | null | undefined, userId: string, nowMs?: number): T;
export function assertRecoverablePasswordUser<T extends RecoveryUser>(user: T | null | undefined, userId: string): T;
