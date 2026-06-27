// V45 Dashboard 推进前风险中枢桥接层。

import { useMemo } from 'react';
import TurnRiskCenterPanel from './TurnRiskCenterPanel';
import { buildTurnRiskCenterPlan } from '../gameplay/turnRiskCenter';
import type { GameState } from '../types/game';

export default function DashboardTurnRiskCenter({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => buildTurnRiskCenterPlan(state, state.playerNationId), [state]);
  return <TurnRiskCenterPanel plan={plan} jumpToPrimary={plan.primaryTab ? () => jumpToTab(plan.primaryTab!) : undefined} />;
}
