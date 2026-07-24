export interface NormalizedSummitRequest { locale: 'zh-CN' | 'zh-TW' | 'en'; turn: number; agenda: string; agendaLabel: string; stance: string; stanceLabel: string; eligible: boolean; willingness: number; likelihood: string; initiator: Record<string, string | number>; target: Record<string, string | number>; relation: Record<string, string | number>; reasons: string[]; factors: Array<{ label: string; value: number; detail: string }>; latest: null | { outcome: string; summary: string; commitments: string[] } }
export interface SummitBrief { headline: string; counterpartyPosition: string; recommendedOpening: string; risks: string[]; basis: string }
export function normalizeSummitRequest(body: unknown): NormalizedSummitRequest;
export function createSummitMessages(data: NormalizedSummitRequest): Array<{ role: string; content: string }>;
export function parseSummitBrief(content: unknown): SummitBrief;
