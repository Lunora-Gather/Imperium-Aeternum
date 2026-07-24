// V46 Dashboard 目标教练桥接层。

import { useMemo } from 'react';
import OnboardingCoachPanel from './OnboardingCoachPanel';
import { buildOnboardingCoachPlan } from '../gameplay/onboardingCoach';
import type { GameState } from '../types/game';
import { createScopedTranslator, localizeDeep } from '../i18n/scoped';
import { dashboardCatalog } from '../i18n/catalogs/dashboard';

const t = createScopedTranslator(dashboardCatalog);

export default function DashboardOnboardingCoach({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => localizeDeep(buildOnboardingCoachPlan(state, state.playerNationId), t), [state]);
  return <OnboardingCoachPanel plan={plan} jumpToTab={jumpToTab} />;
}
