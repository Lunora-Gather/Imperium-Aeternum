// V43 Dashboard 经济内政顾问桥接层。

import { useMemo } from 'react';
import EconomyAdvisorPanel from './EconomyAdvisorPanel';
import { buildEconomyAdvisorPlan } from '../gameplay/economyAdvisor';
import type { GameState } from '../types/game';

export default function DashboardEconomyAdvisor({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => buildEconomyAdvisorPlan(state, state.playerNationId), [state]);
  return <EconomyAdvisorPanel plan={plan} jumpToTab={jumpToTab} />;
}
