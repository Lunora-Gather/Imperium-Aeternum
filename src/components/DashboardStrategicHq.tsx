// V41 Dashboard 接入层：把帝国总参和战争机会摘要组合成总览首屏决策模块。

import { useMemo } from 'react';
import StrategicHqPanel from './StrategicHqPanel';
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
    <DashboardWarOpportunity state={state} jumpToTab={jumpToTab} />
  </>;
}
