// V46 Dashboard 目标教练桥接层。

import { useMemo } from 'react';
import OnboardingCoachPanel from './OnboardingCoachPanel';
import { buildOnboardingCoachPlan } from '../gameplay/onboardingCoach';
import type { GameState } from '../types/game';

export default function DashboardOnboardingCoach({ state, jumpToTab }: { state: GameState; jumpToTab: (tab: string) => void }) {
  const plan = useMemo(() => buildOnboardingCoachPlan(state, state.playerNationId), [state]);
  return <OnboardingCoachPanel plan={plan} jumpToTab={jumpToTab} />;
}
