// V50 RC Dashboard 发布准备中心桥接层。

import { useMemo } from 'react';
import ReleaseReadinessPanel from './ReleaseReadinessPanel';
import { buildReleaseReadinessPlan } from '../gameplay/releaseReadiness';
import type { GameState } from '../types/game';
import type { CommandCenterAction } from '../gameplay/commandCenterActions';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

export default function DashboardReleaseReadiness({ state, commandActions }: { state: GameState; commandActions: CommandCenterAction[] }) {
  const plan = useMemo(() => localizeDeep(buildReleaseReadinessPlan(state, commandActions, state.playerNationId), t), [state, commandActions]);
  return <ReleaseReadinessPanel plan={plan} />;
}
