// V28 回合前作战会议：把路线图、预演、体检和行动中心汇总成最终推进决策。
// 纯函数，不改 GameState；Dashboard 负责展示。

import type { GameState } from '../types/game';
import type { NavigationTab } from './navigationTabs';
import { buildCommandCenterActions, type CommandCenterAction } from './commandCenterActions';
import { buildEmpireRoadmap, type EmpireRoadmap } from './empireRoadmap';
import { buildReadinessReport, type ReadinessReport } from './readiness';
import { buildTurnPreview, type TurnPreview, type TurnPreviewTone } from './turnPreview';

export type CouncilDecision = 'hold' | 'save-first' | 'advance-carefully' | 'advance';
export type CouncilPriority = 'must' | 'should' | 'could';

export interface CouncilAgendaItem {
  id: string;
  title: string;
  body: string;
  tab: NavigationTab;
  tone: TurnPreviewTone;
  priority: CouncilPriority;
}

export interface PreTurnCouncil {
  decision: CouncilDecision;
  tone: TurnPreviewTone;
  title: string;
  verdict: string;
  confidence: number;
  progress: number;
  agenda: CouncilAgendaItem[];
  blockers: CouncilAgendaItem[];
  recommendations: CouncilAgendaItem[];
  footer: string;
}

export interface PreTurnCouncilContext {
  readiness?: ReadinessReport;
  roadmap?: EmpireRoadmap;
  preview?: TurnPreview;
  commandActions?: CommandCenterAction[];
}

function clamp(v: number, min = 0, max = 100): number { return Math.max(min, Math.min(max, v)); }
function toneRank(tone: TurnPreviewTone): number { return tone === 'danger' ? 3 : tone === 'warn' ? 2 : tone === 'gold' ? 1 : tone === 'good' ? 0 : 1; }
function priorityFromTone(tone: TurnPreviewTone, index: number): CouncilPriority { return tone === 'danger' ? 'must' : tone === 'warn' || index === 0 ? 'should' : 'could'; }
function decisionTone(decision: CouncilDecision): TurnPreviewTone { return decision === 'hold' ? 'danger' : decision === 'save-first' || decision === 'advance-carefully' ? 'warn' : 'good'; }

function agendaFromPreview(preview: TurnPreview): CouncilAgendaItem[] {
  const likely = preview.likelyChanges.slice(0, 3).map((item, index) => ({
    id: `likely-${item.id}`,
    title: item.title,
    body: item.body,
    tab: item.tab,
    tone: item.tone,
    priority: priorityFromTone(item.tone, index),
  }));
  const before = preview.beforePress.slice(0, 3).map((item, index) => ({
    id: `before-${item.id}`,
    title: item.title,
    body: item.body,
    tab: item.tab,
    tone: item.tone,
    priority: priorityFromTone(item.tone, index),
  }));
  const save = {
    id: `save-${preview.saveAdvice.id}`,
    title: preview.saveAdvice.title,
    body: preview.saveAdvice.body,
    tab: preview.saveAdvice.tab,
    tone: preview.saveAdvice.tone,
    priority: preview.saveAdvice.tone === 'danger' || preview.saveAdvice.tone === 'warn' || preview.saveAdvice.tone === 'gold' ? 'should' as const : 'could' as const,
  };
  return [...before, ...likely, save];
}

function agendaFromRoadmap(roadmap: EmpireRoadmap): CouncilAgendaItem[] {
  return roadmap.steps.slice(0, 3).map((step, index) => ({
    id: `roadmap-${step.id}`,
    title: step.title,
    body: step.body,
    tab: step.tab,
    tone: step.tone,
    priority: priorityFromTone(step.tone, index),
  }));
}

function dedupeAgenda(items: CouncilAgendaItem[]): CouncilAgendaItem[] {
  const seen = new Set<string>();
  const out: CouncilAgendaItem[] = [];
  for (const item of items.sort((a, b) => {
    const p = { must: 3, should: 2, could: 1 } as Record<CouncilPriority, number>;
    const byPriority = p[b.priority] - p[a.priority];
    if (byPriority !== 0) return byPriority;
    return toneRank(b.tone) - toneRank(a.tone);
  })) {
    const key = `${item.title}|${item.tab}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.slice(0, 6);
}

function decide(readiness: ReadinessReport, preview: TurnPreview, agenda: CouncilAgendaItem[], roadmap: EmpireRoadmap): CouncilDecision {
  if (!readiness.canAdvance || !preview.canAdvance || agenda.some((item) => item.priority === 'must')) return 'hold';
  if (preview.saveAdvice.tone === 'gold' || preview.saveAdvice.tone === 'warn' || roadmap.route.progress >= 70) return 'save-first';
  if (preview.status === 'caution' || readiness.tone === 'warn' || roadmap.tier === 'strained') return 'advance-carefully';
  return 'advance';
}

function title(decision: CouncilDecision): string {
  return decision === 'hold' ? '会议结论：暂停推进'
    : decision === 'save-first' ? '会议结论：先存档再推进'
      : decision === 'advance-carefully' ? '会议结论：谨慎推进'
        : '会议结论：可以推进';
}

function verdict(decision: CouncilDecision, readiness: ReadinessReport, preview: TurnPreview, roadmap: EmpireRoadmap): string {
  if (decision === 'hold') return `体检 ${readiness.score}/100，${preview.title}。先处理阻断或红色事项，再结束本年。`;
  if (decision === 'save-first') return `${roadmap.route.label} 进度 ${roadmap.route.progress}%，当前有分支价值。先保存，再推进。`;
  if (decision === 'advance-carefully') return `体检 ${readiness.score}/100，存在黄色风险。可推进，但推进后必须先读年报。`;
  return `体检 ${readiness.score}/100，预演未发现硬风险。可结束本年并复查路线图。`;
}

function confidence(readiness: ReadinessReport, preview: TurnPreview, roadmap: EmpireRoadmap): number {
  let score = readiness.score;
  if (preview.status === 'blocked') score -= 35;
  else if (preview.status === 'danger') score -= 22;
  else if (preview.status === 'caution') score -= 10;
  if (roadmap.tier === 'collapse') score -= 25;
  else if (roadmap.tier === 'crisis') score -= 16;
  else if (roadmap.tier === 'strained') score -= 8;
  score += Math.min(10, Math.round(roadmap.route.progress / 10));
  return clamp(score);
}

export function buildPreTurnCouncil(state: GameState, context: PreTurnCouncilContext = {}): PreTurnCouncil {
  const readiness = context.readiness ?? buildReadinessReport(state);
  const commandActions = context.commandActions ?? buildCommandCenterActions(state, 5, { readiness });
  const roadmap = context.roadmap ?? buildEmpireRoadmap(state, { readiness, commandActions });
  const preview = context.preview ?? buildTurnPreview(state, { readiness, roadmap, commandActions });
  const agenda = dedupeAgenda([...agendaFromPreview(preview), ...agendaFromRoadmap(roadmap)]);
  const decision = decide(readiness, preview, agenda, roadmap);
  const conf = confidence(readiness, preview, roadmap);
  const blockers = agenda.filter((item) => item.priority === 'must');
  const recommendations = agenda.filter((item) => item.priority !== 'must').slice(0, 4);
  const progress = decision === 'hold' ? Math.min(conf, 45) : decision === 'save-first' ? Math.max(55, conf) : conf;

  return {
    decision,
    tone: decisionTone(decision),
    title: title(decision),
    verdict: verdict(decision, readiness, preview, roadmap),
    confidence: conf,
    progress,
    agenda,
    blockers,
    recommendations,
    footer: `主线：${roadmap.route.label} ${roadmap.route.progress}% · 预演：${preview.title} · 体检：${readiness.label} ${readiness.score}/100`,
  };
}
