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
