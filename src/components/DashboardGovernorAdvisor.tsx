// V48 Dashboard Governor Advisor 桥接层。

import { useMemo } from 'react';
import GovernorAdvisorPanel from './GovernorAdvisorPanel';
import { buildGovernorAdvisorPlan } from '../gameplay/governorAdvisor';
import type { GameState } from '../types/game';
import type { CommandCenterAction } from '../gameplay/commandCenterActions';

export default function DashboardGovernorAdvisor({ state, commandActions, jumpToTab }: { state: GameState; commandActions: CommandCenterAction[]; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => buildGovernorAdvisorPlan(state, commandActions, state.playerNationId), [state, commandActions]);
  return <GovernorAdvisorPanel plan={plan} jumpToTab={jumpToTab} />;
}
