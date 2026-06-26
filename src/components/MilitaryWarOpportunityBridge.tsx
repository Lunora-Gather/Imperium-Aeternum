// V41 军事页战争机会桥接层：计算玩家战争机会并复用 WarOpportunityPanel 展示。
// MilitaryScreen 只需要传入 onPreview，即可把候选目标接到已有战争预演逻辑。

import { useMemo } from 'react';
import WarOpportunityPanel from './WarOpportunityPanel';
import { buildWarOpportunityAdvice } from '../gameplay/warOpportunityAdvisor';
import type { GameState } from '../types/game';

export default function MilitaryWarOpportunityBridge({ state, onPreview }: { state: GameState; onPreview: (defenderId: string, provinceId: string) => void }) {
  const advice = useMemo(() => buildWarOpportunityAdvice(state, state.playerNationId), [state]);
  return <WarOpportunityPanel advice={advice} onPreview={onPreview} />;
}
