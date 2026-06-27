// V49 Dashboard 发布准备中心桥接层。

import { useMemo } from 'react';
import ReleaseReadinessPanel from './ReleaseReadinessPanel';
import { buildReleaseReadinessPlan } from '../gameplay/releaseReadiness';
import type { GameState } from '../types/game';
import type { CommandCenterAction } from '../gameplay/commandCenterActions';

export default function DashboardReleaseReadiness({ state, commandActions }: { state: GameState; commandActions: CommandCenterAction[] }) {
  const plan = useMemo(() => buildReleaseReadinessPlan(state, commandActions, state.playerNationId), [state, commandActions]);
  return <ReleaseReadinessPanel plan={plan} />;
}
