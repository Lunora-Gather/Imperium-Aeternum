// V41 AI 战争行动适配层：把 aiWarDecision 转成 engine/ai.ts 可直接消费的 declare_war 行动。
// 保持独立，避免 engine 与 gameplay 互相强耦合；下一步可替换 chooseExpansionOpportunity。

import type { GameState } from '../types/game';
import { decideAiWar } from './aiWarDecision';

export interface AiDeclareWarActionLike {
  actionId: 'declare_war';
  weight: number;
  target: string;
  targetProvinceId: string;
  reason: 'desired' | 'revenge' | 'weak_neighbor' | 'frontier';
}

export interface AiWarActionPlan {
  action: AiDeclareWarActionLike | null;
  label: string;
  confidence: number;
  reasons: string[];
}

export type AiActionLike = AiDeclareWarActionLike | { actionId: string; weight: number; target?: string; targetProvinceId?: string; reason?: string };

function weightFromConfidence(confidence: number): number {
  if (confidence >= 85) return 18;
  if (confidence >= 75) return 14;
  if (confidence >= 66) return 11;
  return 0;
}

export function buildAiWarActionPlan(state: GameState, attackerId: string): AiWarActionPlan {
  const decision = decideAiWar(state, attackerId);
  if (decision.type !== 'declare' || !decision.candidate) {
    return {
      action: null,
      label: decision.label,
      confidence: decision.confidence,
      reasons: decision.reasons,
    };
  }

  return {
    action: {
      actionId: 'declare_war',
      weight: weightFromConfidence(decision.confidence),
      target: decision.candidate.defenderId,
      targetProvinceId: decision.candidate.targetProvinceId,
      reason: 'weak_neighbor',
    },
    label: decision.label,
    confidence: decision.confidence,
    reasons: decision.reasons,
  };
}

export function mergeAiWarActionPlan<T extends AiActionLike>(state: GameState, attackerId: string, actions: T[]): T[] {
  const plan = buildAiWarActionPlan(state, attackerId);
  const nonWar = actions.filter((a) => a.actionId !== 'declare_war');
  const oldWar = actions.filter((a) => a.actionId === 'declare_war');

  if (!plan.action) {
    // 新评估认为不该宣战时，保留非战争行动，压制旧的“只看军力比例”的宣战候选。
    return nonWar;
  }

  const bestOld = oldWar.slice().sort((a, b) => b.weight - a.weight)[0];
  const merged = plan.action as unknown as T;
  if (bestOld && bestOld.target === merged.target && bestOld.targetProvinceId === merged.targetProvinceId) {
    return [...nonWar, { ...bestOld, weight: Math.max(bestOld.weight, merged.weight), reason: bestOld.reason ?? merged.reason } as T];
  }
  return [...nonWar, merged];
}
