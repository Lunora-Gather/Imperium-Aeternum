// V43 Dashboard 经济内政顾问桥接层。

import { useMemo } from 'react';
import EconomyAdvisorPanel from './EconomyAdvisorPanel';
import { buildEconomyAdvisorPlan } from '../gameplay/economyAdvisor';
import type { GameState } from '../types/game';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

export default function DashboardEconomyAdvisor({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => localizeDeep(buildEconomyAdvisorPlan(state, state.playerNationId), t), [state]);
  return <EconomyAdvisorPanel plan={plan} jumpToTab={jumpToTab} />;
}
