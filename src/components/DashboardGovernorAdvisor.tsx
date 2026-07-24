// V50 RC Dashboard Governor Advisor 桥接层。

import { useMemo } from 'react';
import GovernorAdvisorPanel from './GovernorAdvisorPanel';
import { buildGovernorAdvisorPlan } from '../gameplay/governorAdvisor';
import type { GameState } from '../types/game';
import type { CommandCenterAction } from '../gameplay/commandCenterActions';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

export default function DashboardGovernorAdvisor({ state, commandActions, jumpToTab }: { state: GameState; commandActions: CommandCenterAction[]; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => localizeDeep(buildGovernorAdvisorPlan(state, commandActions, state.playerNationId), t), [state, commandActions]);
  return <GovernorAdvisorPanel plan={plan} jumpToTab={jumpToTab} />;
}
