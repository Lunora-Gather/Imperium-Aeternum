// V40 Dashboard 接入层：把战略计算和总参面板组合成可插即用模块。
// Dashboard 主文件只需要传入 state、commandActions 和 jumpToTab。

import { useMemo } from 'react';
import StrategicHqPanel from './StrategicHqPanel';
import { buildStrategicHqPlan } from '../gameplay/strategicHq';
import type { GameState } from '../types/game';
import type { CommandCenterAction } from '../gameplay/commandCenterActions';

type JumpToTab = (tab: string) => void;

export default function DashboardStrategicHq({ state, commandActions, jumpToTab }: { state: GameState; commandActions: CommandCenterAction[]; jumpToTab: JumpToTab }) {
  const plan = useMemo(() => buildStrategicHqPlan(state, commandActions), [state, commandActions]);
  const primaryTab = plan.summaryView.lines[0]?.actionLabel && plan.nextAction?.tab;

  return <StrategicHqPanel
    plan={plan}
    jumpToPrimary={primaryTab ? () => jumpToTab(primaryTab) : undefined}
  />;
}
