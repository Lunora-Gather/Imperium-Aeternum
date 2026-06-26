// V25 帝国路线图：把行动中心、体检、参谋部和国运目标合成为一条可执行治理路线。
// 纯函数，不改 GameState；Dashboard 只负责展示。

import type { GameState } from '../types/game';
import type { NavigationTab } from './navigationTabs';
import { getAmbitionSnapshot, type AmbitionSnapshot } from './ambitions';
import { buildCommandCenterActions, type CommandCenterAction } from './commandCenterActions';
import { buildReadinessReport, type ReadinessReport } from './readiness';
import { buildStrategicBrief, type StrategicBrief } from './strategicAdvisor';
import { buildTurnReportActions, type TurnReportAction } from './turnReportActions';

export type RoadmapTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';
export type RoadmapTier = 'collapse' | 'crisis' | 'strained' | 'stable' | 'ascendant';

export interface RoadmapStep {
  id: string;
  title: string;
  body: string;
  tab: NavigationTab;
  tone: RoadmapTone;
  horizon: '现在' | '本年' | '长期';
}

export interface VictoryRoute {
  id: 'conquest' | 'economy' | 'diplomacy' | 'eternal';
  label: string;
  progress: number;
  tab: NavigationTab;
  hint: string;
}

export interface EmpireRoadmap {
  tier: RoadmapTier;
  score: number;
  headline: string;
  summary: string;
  tone: RoadmapTone;
  route: VictoryRoute;
  steps: RoadmapStep[];
  riskLine: string;
  opportunityLine: string;
}

export interface EmpireRoadmapContext {
  brief?: StrategicBrief;
  readiness?: ReadinessReport;
  reportActions?: TurnReportAction[];
  commandActions?: CommandCenterAction[];
  ambition?: AmbitionSnapshot;
}

function pct(current: number, target: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function toneFromTier(tier: RoadmapTier): RoadmapTone {
  return tier === 'collapse' || tier === 'crisis' ? 'danger' : tier === 'strained' ? 'warn' : tier === 'ascendant' ? 'gold' : 'good';
}

function classify(score: number, readiness: ReadinessReport): RoadmapTier {
  if (!readiness.canAdvance || readiness.tone === 'danger' || score < 25) return 'collapse';
  if (score < 42) return 'crisis';
  if (score < 60 || readiness.tone === 'warn') return 'strained';
  if (score >= 78) return 'ascendant';
  return 'stable';
}

function headline(tier: RoadmapTier): string {
  return tier === 'collapse' ? '帝国处于断裂边缘'
    : tier === 'crisis' ? '先稳住国家机器'
      : tier === 'strained' ? '压力可控，但不能空格硬跳'
        : tier === 'ascendant' ? '扩张与胜利窗口已打开'
          : '局势稳定，可以按路线推进';
}

function routeFromAmbition(a: AmbitionSnapshot): VictoryRoute {
  const routes: VictoryRoute[] = [
    { id: 'conquest', label: '征服路线', progress: pct(a.conquest.current, a.conquest.target), tab: 'military', hint: `${a.conquest.current}/${a.conquest.target} 省，且安定需 ≥40` },
    { id: 'economy', label: '富国路线', progress: Math.min(pct(a.economy.current, a.economy.target), pct(a.economy.turns, a.economy.needTurns)), tab: 'economy', hint: `国库 ${a.economy.current}/${a.economy.target}，连续 ${a.economy.turns}/${a.economy.needTurns} 年` },
    { id: 'diplomacy', label: '合纵路线', progress: Math.min(pct(a.diplomacy.influence, a.diplomacy.influenceTarget), pct(a.diplomacy.goodRelations, a.diplomacy.goodTarget)), tab: 'diplomacy', hint: `影响力 ${a.diplomacy.influence}/${a.diplomacy.influenceTarget}，高关系 ${a.diplomacy.goodRelations}/${a.diplomacy.goodTarget}` },
    { id: 'eternal', label: '永恒路线', progress: pct(a.eternal.turns, a.eternal.target), tab: 'dashboard', hint: `和平稳定 ${a.eternal.turns}/${a.eternal.target} 年` },
  ];
  return routes.sort((x, y) => y.progress - x.progress)[0];
}

function stepFromAction(a: CommandCenterAction, index: number): RoadmapStep {
  return {
    id: `action-${a.id}`,
    title: index === 0 ? `先做：${a.label}` : a.label,
    body: a.desc,
    tab: a.tab,
    tone: a.tone === 'danger' ? 'danger' : a.tone === 'warn' ? 'warn' : 'info',
    horizon: index === 0 ? '现在' : '本年',
  };
}

function routeStep(route: VictoryRoute): RoadmapStep {
  return {
    id: `route-${route.id}`,
    title: `胜利路线：${route.label}`,
    body: `${route.hint}。当前进度约 ${route.progress}%，围绕这条路线集中资源。`,
    tab: route.tab,
    tone: route.progress >= 70 ? 'gold' : route.progress >= 45 ? 'good' : 'info',
    horizon: '长期',
  };
}

export function buildEmpireRoadmap(state: GameState, context: EmpireRoadmapContext = {}): EmpireRoadmap {
  const brief = context.brief ?? buildStrategicBrief(state);
  const readiness = context.readiness ?? buildReadinessReport(state);
  const reportActions = context.reportActions ?? buildTurnReportActions(state, { brief });
  const commandActions = context.commandActions ?? buildCommandCenterActions(state, 5, { brief, readiness, reportActions });
  const ambition = context.ambition ?? getAmbitionSnapshot(state);
  const route = routeFromAmbition(ambition);
  const tier = classify(brief.score, readiness);
  const tone = toneFromTier(tier);
  const primary = commandActions[0];
  const secondary = commandActions.find((a) => a.tab !== primary?.tab) ?? commandActions[1];
  const steps = [primary, secondary].filter(Boolean).map((a, i) => stepFromAction(a as CommandCenterAction, i));
  steps.push(routeStep(route));

  const riskLine = brief.risks.length > 0 ? brief.risks.slice(0, 3).join(' / ') : '暂无主要系统性风险';
  const opportunityLine = brief.opportunities[0]?.title ?? (route.progress >= 55 ? `${route.label} 接近成形` : '先打牢财政、省份和稳定基础');

  return {
    tier,
    score: Math.round(brief.score),
    headline: headline(tier),
    summary: `${brief.phase} · ${brief.doctrine}。体检 ${readiness.score}/100，${readiness.label}。`,
    tone,
    route,
    steps: steps.slice(0, 3),
    riskLine,
    opportunityLine,
  };
}
