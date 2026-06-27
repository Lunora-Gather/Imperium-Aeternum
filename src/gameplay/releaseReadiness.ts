// V50 RC 发布准备中心：把当前构建、核心系统覆盖和验收状态整理成页面可读信息。
// 纯函数，不改 GameState；用于 Dashboard 展示预览版本是否接近发布。

import type { GameState } from '../types/game';
import { BUILD_MARK } from '../buildInfo';
import { buildDashboardCommandGroups } from './dashboardCommandGroups';
import { buildTurnRiskCenterPlan, type TurnRiskTone } from './turnRiskCenter';
import { buildGovernorAdvisorPlan } from './governorAdvisor';
import type { CommandCenterAction } from './commandCenterActions';

export interface ReleaseReadinessItem {
  id: string;
  title: string;
  body: string;
  tone: TurnRiskTone;
}

export interface ReleaseReadinessPlan {
  title: string;
  summary: string;
  tone: TurnRiskTone;
  score: number;
  buildMark: string;
  items: ReleaseReadinessItem[];
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function tone(score: number): TurnRiskTone {
  return score >= 85 ? 'good' : score >= 68 ? 'warn' : 'danger';
}

function isRecognizedReleaseMark(mark: string): boolean {
  return /^V\d+/i.test(mark) || /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(mark);
}

export function buildReleaseReadinessPlan(state: GameState, commandActions: CommandCenterAction[] = [], nationId: string = state.playerNationId): ReleaseReadinessPlan {
  const groups = buildDashboardCommandGroups(state, nationId);
  const risk = buildTurnRiskCenterPlan(state, nationId);
  const route = buildGovernorAdvisorPlan(state, commandActions, nationId);
  const groupCoverage = groups.flatMap((g) => g.itemIds).length;
  const hasGovernor = groups.some((g) => g.itemIds.includes('governor'));
  const hasRiskGate = groups.some((g) => g.itemIds.includes('turn-risk'));
  const hasExternal = groups.some((g) => g.itemIds.includes('diplomacy') && g.itemIds.includes('war'));
  const hasDomestic = groups.some((g) => g.itemIds.includes('economy'));

  const items: ReleaseReadinessItem[] = [
    { id: 'build', title: '构建标记', body: BUILD_MARK, tone: isRecognizedReleaseMark(BUILD_MARK) ? 'good' : 'warn' },
    { id: 'dashboard', title: 'Dashboard 指挥面板', body: `当前接入 ${groupCoverage} 个可验收模块。`, tone: groupCoverage >= 7 ? 'good' : 'warn' },
    { id: 'route', title: '执政路线', body: route.primaryAction ? `首要路线：${route.primaryAction.title}` : '暂无明确首要路线。', tone: hasGovernor ? 'good' : 'warn' },
    { id: 'risk', title: '推进前检查', body: `当前准备度 ${risk.readiness}，状态 ${risk.decision}。`, tone: hasRiskGate && risk.tone !== 'danger' ? 'good' : risk.tone },
    { id: 'domestic', title: '内政覆盖', body: hasDomestic ? '经济与内政顾问已接入。' : '缺少经济内政入口。', tone: hasDomestic ? 'good' : 'danger' },
    { id: 'external', title: '外部战略覆盖', body: hasExternal ? '外交与战争机会均已接入。' : '缺少外交或战争入口。', tone: hasExternal ? 'good' : 'warn' },
  ];

  const penalties = items.reduce((s, x) => s + (x.tone === 'danger' ? 16 : x.tone === 'warn' ? 7 : 0), 0);
  const score = clamp(100 - penalties - Math.max(0, 85 - route.confidence) * 0.12);
  const readinessTone = tone(score);
  const title = readinessTone === 'good' ? '发布准备：接近可验收' : readinessTone === 'warn' ? '发布准备：还需整理' : '发布准备：需要修复';
  const summary = readinessTone === 'good'
    ? `当前版本 ${BUILD_MARK} 已具备完整预览验收入口。`
    : readinessTone === 'warn'
      ? `当前版本 ${BUILD_MARK} 功能已成型，但部署或整合仍需整理。`
      : `当前版本 ${BUILD_MARK} 存在阻断项，暂不建议封版。`;

  return { title, summary, tone: readinessTone, score: Math.round(score), buildMark: BUILD_MARK, items };
}
