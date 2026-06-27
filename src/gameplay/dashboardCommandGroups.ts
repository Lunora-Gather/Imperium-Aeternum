// V50 RC Dashboard 指挥分组规划：把首页顾问模块整理成可收纳的产品化布局。
// 纯函数，不改 GameState；UI 根据它决定分组、默认展开和摘要文案。

import type { GameState } from '../types/game';
import { buildOnboardingCoachPlan } from './onboardingCoach';
import { buildTurnRiskCenterPlan } from './turnRiskCenter';
import { buildEconomyAdvisorPlan } from './economyAdvisor';
import { buildDiplomacyAdvisorPlan } from './diplomacyAdvisor';
import { buildWarOpportunityAdvice } from './warOpportunityAdvisor';

export type DashboardGroupTone = 'good' | 'warn' | 'danger';
export type DashboardGroupId = 'guide' | 'risk' | 'domestic' | 'external';

export interface DashboardCommandGroup {
  id: DashboardGroupId;
  title: string;
  subtitle: string;
  tone: DashboardGroupTone;
  defaultOpen: boolean;
  itemIds: string[];
}

function worse(a: DashboardGroupTone, b: DashboardGroupTone): DashboardGroupTone {
  if (a === 'danger' || b === 'danger') return 'danger';
  if (a === 'warn' || b === 'warn') return 'warn';
  return 'good';
}

export function buildDashboardCommandGroups(state: GameState, nationId: string = state.playerNationId): DashboardCommandGroup[] {
  const coach = buildOnboardingCoachPlan(state, nationId);
  const risk = buildTurnRiskCenterPlan(state, nationId);
  const economy = buildEconomyAdvisorPlan(state, nationId);
  const diplomacy = buildDiplomacyAdvisorPlan(state, nationId);
  const war = buildWarOpportunityAdvice(state, nationId);

  const guideOpen = coach.tone === 'danger' && coach.progress < 40;
  const riskOpen = risk.tone === 'danger' || risk.decision === 'block';
  const domesticTone = worse(economy.tone, risk.blockers.some((b) => b.tab === 'economy' || b.tab === 'province') ? 'danger' : 'good');
  const externalTone = worse(diplomacy.tone, war.tone);

  return [
    {
      id: 'guide',
      title: '引导与本年目标',
      subtitle: coach.nextStep ? `下一步：${coach.nextStep.title} · ${coach.progress}%` : `目标完成 · ${coach.progress}%`,
      tone: coach.tone,
      defaultOpen: guideOpen,
      itemIds: ['release', 'onboarding', 'strategic-hq'],
    },
    {
      id: 'risk',
      title: '推进前风险',
      subtitle: `${risk.primaryCta} · 准备度 ${risk.readiness}`,
      tone: risk.tone,
      defaultOpen: riskOpen,
      itemIds: ['turn-risk'],
    },
    {
      id: 'domestic',
      title: '内政与经济',
      subtitle: `${economy.title} · 健康 ${economy.health}`,
      tone: domesticTone,
      defaultOpen: domesticTone === 'danger',
      itemIds: ['governor', 'economy'],
    },
    {
      id: 'external',
      title: '外交与战争',
      subtitle: `${diplomacy.title} / ${war.title}`,
      tone: externalTone,
      defaultOpen: externalTone === 'danger',
      itemIds: ['diplomacy', 'war'],
    },
  ];
}
