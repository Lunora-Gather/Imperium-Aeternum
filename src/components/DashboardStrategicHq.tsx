// V50 RC Dashboard 接入层：用可折叠指挥分组收纳发布准备、Governor、目标教练、总参、风险、内政、外交和战争模块。

import { useMemo } from 'react';
import DashboardCommandGroupStack from './DashboardCommandGroupStack';
import DashboardReleaseReadiness from './DashboardReleaseReadiness';
import DashboardGovernorAdvisor from './DashboardGovernorAdvisor';
import DashboardOnboardingCoach from './DashboardOnboardingCoach';
import StrategicHqPanel from './StrategicHqPanel';
import DashboardTurnRiskCenter from './DashboardTurnRiskCenter';
import DashboardEconomyAdvisor from './DashboardEconomyAdvisor';
import DashboardDiplomacyAdvisor from './DashboardDiplomacyAdvisor';
import DashboardWarOpportunity from './DashboardWarOpportunity';
import { buildDashboardCommandGroups } from '../gameplay/dashboardCommandGroups';
import { buildStrategicHqPlan } from '../gameplay/strategicHq';
import type { GameState } from '../types/game';
import type { CommandCenterAction } from '../gameplay/commandCenterActions';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

type JumpToTab = (tab: string) => void;

export default function DashboardStrategicHq({ state, commandActions, jumpToTab }: { state: GameState; commandActions: CommandCenterAction[]; jumpToTab: JumpToTab }) {
  const plan = localizeDeep(useMemo(() => buildStrategicHqPlan(state, commandActions), [state, commandActions]), t);
  const groups = localizeDeep(useMemo(() => buildDashboardCommandGroups(state, state.playerNationId), [state]), t);

  const renderItem = (id: string) => {
    if (id === 'release') return <DashboardReleaseReadiness state={state} commandActions={commandActions} />;
    if (id === 'governor') return <DashboardGovernorAdvisor state={state} commandActions={commandActions} jumpToTab={jumpToTab} />;
    if (id === 'onboarding') return <DashboardOnboardingCoach state={state} jumpToTab={jumpToTab} />;
    if (id === 'strategic-hq') return <StrategicHqPanel plan={plan} jumpToPrimary={plan.primaryTab ? () => jumpToTab(plan.primaryTab!) : undefined} />;
    if (id === 'turn-risk') return <DashboardTurnRiskCenter state={state} jumpToTab={jumpToTab} />;
    if (id === 'economy') return <DashboardEconomyAdvisor state={state} jumpToTab={jumpToTab} />;
    if (id === 'diplomacy') return <DashboardDiplomacyAdvisor state={state} jumpToTab={jumpToTab} />;
    if (id === 'war') return <DashboardWarOpportunity state={state} jumpToTab={jumpToTab} />;
    return null;
  };

  return <DashboardCommandGroupStack groups={groups} renderItem={renderItem} />;
}
