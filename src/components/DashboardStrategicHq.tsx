// V44 Dashboard 接入层：把帝国总参、经济内政顾问、外交顾问和战争机会摘要组合成总览首屏决策模块。

import { useMemo } from 'react';
import StrategicHqPanel from './StrategicHqPanel';
import DashboardEconomyAdvisor from './DashboardEconomyAdvisor';
import DashboardDiplomacyAdvisor from './DashboardDiplomacyAdvisor';
import DashboardWarOpportunity from './DashboardWarOpportunity';
import { buildStrategicHqPlan } from '../gameplay/strategicHq';
import type { GameState } from '../types/game';
import type { CommandCenterAction } from '../gameplay/commandCenterActions';

type JumpToTab = (tab: string) => void;

export default function DashboardStrategicHq({ state, commandActions, jumpToTab }: { state: GameState; commandActions: CommandCenterAction[]; jumpToTab: JumpToTab }) {
  const plan = useMemo(() => buildStrategicHqPlan(state, commandActions), [state, commandActions]);

  return <>
    <StrategicHqPanel
      plan={plan}
      jumpToPrimary={plan.primaryTab ? () => jumpToTab(plan.primaryTab!) : undefined}
    />
    <DashboardEconomyAdvisor state={state} jumpToTab={jumpToTab} />
    <DashboardDiplomacyAdvisor state={state} jumpToTab={jumpToTab} />
    <DashboardWarOpportunity state={state} jumpToTab={jumpToTab} />
  </>;
}
