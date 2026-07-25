import type { AIMemoryEntry, DiplomaticMemoryIncident, GameState } from '../types/game';

export function recordDiplomaticIncident(
  state: GameState,
  observerId: string,
  actorId: string,
  kind: DiplomaticMemoryIncident['kind'],
  impact: number,
  summary: string,
): void {
  state.aiMemory = state.aiMemory ?? {};
  const memory: AIMemoryEntry = state.aiMemory[observerId] ?? {
    rivalScore: 0,
    partnerScore: 0,
    watchScore: 0,
    lastUpdated: state.turn,
  };
  const incident: DiplomaticMemoryIncident = {
    actorId,
    kind,
    impact: Math.max(-30, Math.min(30, Math.round(impact))),
    turn: state.turn,
    summary,
  };
  memory.incidents = [...(memory.incidents ?? []).filter((entry) => state.turn - entry.turn <= 30), incident].slice(-8);
  memory.lastUpdated = state.turn;
  if (impact < 0) {
    memory.rivalId = actorId;
    memory.rivalScore = Math.min(100, Math.max(memory.rivalScore, Math.abs(impact) * 2.5));
  } else {
    memory.partnerId = actorId;
    memory.partnerScore = Math.min(100, Math.max(memory.partnerScore, impact * 2.5));
  }
  state.aiMemory[observerId] = memory;
}

export interface DiplomaticMemoryBrief {
  attitude: 'grateful' | 'guarded' | 'hostile' | 'neutral';
  label: string;
  score: number;
  summary: string;
  recent: DiplomaticMemoryIncident[];
}

export function getDiplomaticMemoryBrief(state: GameState, observerId: string, actorId = state.playerNationId): DiplomaticMemoryBrief {
  const recent = (state.aiMemory?.[observerId]?.incidents ?? [])
    .filter((incident) => incident.actorId === actorId && state.turn - incident.turn <= 30)
    .slice(-4);
  const score = recent.reduce((sum, incident) => {
    const age = Math.max(0, state.turn - incident.turn);
    return sum + incident.impact * Math.max(0.25, 1 - age / 40);
  }, 0);
  const rounded = Math.max(-100, Math.min(100, Math.round(score)));
  const latest = recent[recent.length - 1];
  if (rounded >= 18) return { attitude: 'grateful', label: '记得善意', score: rounded, summary: `近期的善意仍在影响其判断：${latest?.summary ?? '双方往来顺利'}。`, recent };
  if (rounded <= -35) return { attitude: 'hostile', label: '牢记敌意', score: rounded, summary: `其决策仍受旧怨驱动：${latest?.summary ?? '双方存在严重冲突'}。`, recent };
  if (rounded <= -10) return { attitude: 'guarded', label: '保持戒备', score: rounded, summary: `其仍对近期行为有所顾虑：${latest?.summary ?? '信任尚未恢复'}。`, recent };
  return { attitude: 'neutral', label: recent.length ? '旧事渐淡' : '暂无旧账', score: rounded, summary: recent.length ? '近期往来的影响正在消退，新的行动会改变其判断。' : '双方尚未留下足以影响长期判断的重大往来。', recent };
}
