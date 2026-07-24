// V45 Dashboard 推进前风险中枢桥接层。

import { useMemo } from 'react';
import TurnRiskCenterPanel from './TurnRiskCenterPanel';
import { buildTurnRiskCenterPlan } from '../gameplay/turnRiskCenter';
import type { GameState } from '../types/game';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

export default function DashboardTurnRiskCenter({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => localizeDeep(buildTurnRiskCenterPlan(state, state.playerNationId), t), [state]);
  return <TurnRiskCenterPanel plan={plan} jumpToPrimary={plan.primaryTab ? () => jumpToTab(plan.primaryTab!) : undefined} />;
}
