// V44 Dashboard 外交顾问桥接层。

import { useMemo } from 'react';
import DiplomacyAdvisorPanel from './DiplomacyAdvisorPanel';
import { buildDiplomacyAdvisorPlan } from '../gameplay/diplomacyAdvisor';
import type { GameState } from '../types/game';

export default function DashboardDiplomacyAdvisor({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => buildDiplomacyAdvisorPlan(state, state.playerNationId), [state]);
  return <DiplomacyAdvisorPanel plan={plan} jumpToTab={jumpToTab} />;
}
