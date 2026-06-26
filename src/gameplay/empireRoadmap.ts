// V26 帝国路线图：在 V25 的三步路线基础上增加“依据/影响”说明。
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
  reason: string;
  impact: string;
}

export interface VictoryRoute {
  id: 'conquest' | 'economy' | 'diplomacy' | 'eternal';
  label: string;
  progress: number;
  tab: NavigationTab;
  hint: string;
}

export interface RoadmapEvidence {
  id: string;
  label: string;
  value: string;
  tone: RoadmapTone;
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
  evidence: RoadmapEvidence[];
  evidenceLine: string;
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

function sourceLabel(source: CommandCenterAction['source']): string {
  return source === 'readiness' ? '回合前体检' : source === 'report' ? '年度报告' : source === 'strategy' ? '战略参谋' : '长期规划';
}

function impactFromAction(a: CommandCenterAction): string {
  if (a.tab === 'economy') return '优先保护财政与粮食循环，避免赤字继续滚大。';
  if (a.tab === 'province') return '优先压住地方风险，给长期胜利路线留稳定基础。';
  if (a.tab === 'politics') return '优先修复国家机器，减少腐败、法统和治能的连锁损耗。';
  if (a.tab === 'military') return '优先避免战争空耗，把补给、士气和战果重新拉回主线。';
  if (a.tab === 'diplomacy') return '优先降低外部压力，为贸易、联盟或停战创造窗口。';
  if (a.tab === 'tech') return '优先把科研点转为长期效率，减少后期滚雪球落差。';
  if (a.tab === 'save') return '优先保留决策分支，降低重大操作的不可逆风险。';
  return '优先把当前最高价值行动处理掉，让下一回合更安全。';
}

function stepFromAction(a: CommandCenterAction, index: number): RoadmapStep {
  const reason = `${sourceLabel(a.source)} · 优先级 ${a.level}`;
  const impact = impactFromAction(a);
  return {
    id: `action-${a.id}`,
    title: index === 0 ? `先做：${a.label}` : a.label,
    body: `${a.desc} 依据：${reason}。影响：${impact}`,
    tab: a.tab,
    tone: a.tone === 'danger' ? 'danger' : a.tone === 'warn' ? 'warn' : 'info',
    horizon: index === 0 ? '现在' : '本年',
    reason,
    impact,
  };
}

function routeStep(route: VictoryRoute): RoadmapStep {
  const reason = `四条国运路线比较后，${route.label} 当前最高，约 ${route.progress}%`;
  const impact = '集中资源推进最接近的胜利路线，避免每年目标摇摆。';
  return {
    id: `route-${route.id}`,
    title: `胜利路线：${route.label}`,
    body: `${route.hint}。当前进度约 ${route.progress}%。依据：${reason}。影响：${impact}`,
    tab: route.tab,
    tone: route.progress >= 70 ? 'gold' : route.progress >= 45 ? 'good' : 'info',
    horizon: '长期',
    reason,
    impact,
  };
}

function buildEvidence(readiness: ReadinessReport, brief: StrategicBrief, route: VictoryRoute, commandActions: CommandCenterAction[]): RoadmapEvidence[] {
  const top = commandActions[0];
  const evidence: RoadmapEvidence[] = [
    { id: 'readiness', label: '体检', value: `${readiness.score}/100 · ${readiness.label}`, tone: readiness.tone === 'danger' ? 'danger' : readiness.tone === 'warn' ? 'warn' : 'good' },
    { id: 'strategy-score', label: '国势', value: `${Math.round(brief.score)} · ${brief.scoreLabel}`, tone: brief.score < 40 ? 'danger' : brief.score < 60 ? 'warn' : brief.score >= 78 ? 'gold' : 'good' },
    { id: 'route', label: '主线', value: `${route.label} ${route.progress}%`, tone: route.progress >= 70 ? 'gold' : route.progress >= 45 ? 'good' : 'info' },
  ];
  if (top) evidence.push({ id: 'top-action', label: '首要行动', value: `${top.label} · ${sourceLabel(top.source)}`, tone: top.tone === 'danger' ? 'danger' : top.tone === 'warn' ? 'warn' : 'info' });
  if (brief.risks.length > 0) evidence.push({ id: 'risk-count', label: '风险', value: `${brief.risks.length} 项`, tone: brief.score < 45 ? 'danger' : 'warn' });
  return evidence.slice(0, 5);
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

  const evidence = buildEvidence(readiness, brief, route, commandActions);
  const evidenceLine = evidence.map((x) => `${x.label} ${x.value}`).join(' · ');
  const riskLine = brief.risks.length > 0 ? brief.risks.slice(0, 3).join(' / ') : '暂无主要系统性风险';
  const opportunityLine = brief.opportunities[0]?.title ?? (route.progress >= 55 ? `${route.label} 接近成形` : '先打牢财政、省份和稳定基础');

  return {
    tier,
    score: Math.round(brief.score),
    headline: headline(tier),
    summary: `${brief.phase} · ${brief.doctrine}。${evidenceLine}。`,
    tone,
    route,
    steps: steps.slice(0, 3),
    riskLine,
    opportunityLine,
    evidence,
    evidenceLine,
  };
}
