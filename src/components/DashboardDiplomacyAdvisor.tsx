// V44 Dashboard 外交顾问桥接层。

import { useMemo } from 'react';
import DiplomacyAdvisorPanel from './DiplomacyAdvisorPanel';
import { buildDiplomacyAdvisorPlan } from '../gameplay/diplomacyAdvisor';
import type { GameState } from '../types/game';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

export default function DashboardDiplomacyAdvisor({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => localizeDeep(buildDiplomacyAdvisorPlan(state, state.playerNationId), t), [state]);
  return <DiplomacyAdvisorPanel plan={plan} jumpToTab={jumpToTab} />;
}
