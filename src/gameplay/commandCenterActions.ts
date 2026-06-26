// V38 行动中心：复用统一 NavigationTab 合约，增强建议多样化与解释力。
// 纯函数，不改 GameState；总览 UI、未来快捷栏和测试可复用。

import type { GameState, Nation } from '../types/game';
import { buildReadinessReport, type ReadinessReport } from './readiness';
import { buildStrategicBrief, type StrategicBrief } from './strategicAdvisor';
import { buildTurnReportActions, type TurnReportAction } from './turnReportActions';
import { isNavigationTab, type NavigationTab } from './navigationTabs';

export type CommandActionTone = 'normal' | 'warn' | 'danger';

export interface CommandCenterAction {
  id: string;
  label: string;
  desc: string;
  tab: NavigationTab;
  level: number;
  tone: CommandActionTone;
  source: 'readiness' | 'report' | 'strategy' | 'fallback';
  reason?: string;
}

export interface CommandCenterContext {
  readiness?: ReadinessReport;
  brief?: StrategicBrief;
  reportActions?: TurnReportAction[];
}

function tone(level: number, danger = false): CommandActionTone {
  if (danger || level >= 88) return 'danger';
  if (level >= 55) return 'warn';
  return 'normal';
}

function pushUnique(out: CommandCenterAction[], item: CommandCenterAction): void {
  const key = `${item.id}|${item.tab}`;
  if (out.some((x) => `${x.id}|${x.tab}` === key)) return;
  out.push(item);
}

function isUsefulReportAction(item: TurnReportAction): boolean {
  if (item.id === 'no-report') return false;
  if (item.tab === 'dashboard' && item.level <= 25) return false;
  return true;
}

function reasonFor(source: CommandCenterAction['source'], level: number, toneValue: CommandActionTone): string {
  if (source === 'readiness') return toneValue === 'danger' ? '回合前体检发现硬阻断，必须优先处理。' : '回合前体检发现风险项，建议推进前先处理。';
  if (source === 'report') return '年度复盘发现可修正趋势，适合在下一年开始前处理。';
  if (source === 'strategy') return level >= 75 ? '总参谋部将其列为高优先战略事项。' : '总参谋部认为它能改善中长期路线。';
  return '补充不同页面入口，避免行动建议过窄。';
}

function withReason(desc: string, reason: string): string {
  return desc.includes('依据：') ? desc : `${desc} 依据：${reason}`;
}

function actionWithReason(item: Omit<CommandCenterAction, 'reason'> & { reason?: string }): CommandCenterAction {
  const reason = item.reason ?? reasonFor(item.source, item.level, item.tone);
  return { ...item, reason, desc: withReason(item.desc, reason) };
}

export function explainCommandAction(item: CommandCenterAction): string {
  return item.reason ?? reasonFor(item.source, item.level, item.tone);
}

function fallbackActions(state: GameState, player?: Nation): CommandCenterAction[] {
  const atWar = !!player && state.wars.some((w) => w.attackerId === player.id || w.defenderId === player.id);
  const actions: CommandCenterAction[] = [];

  if (atWar) actions.push(actionWithReason({ id: 'fallback-military', label: '整备前线', desc: '检查主力位置、士气与补给，避免战争进入无效消耗。', tab: 'military', level: 42, tone: 'normal', source: 'fallback', reason: '当前有战争，行动中心补充军事入口。' }));
  if ((player?.resources.sciPt ?? 0) >= 120) actions.push(actionWithReason({ id: 'fallback-tech', label: '规划科技', desc: '科研点已有积累，可以转化为建筑、政策或长期优势。', tab: 'tech', level: 38, tone: 'normal', source: 'fallback', reason: '科研点充足，适合把资源转成长期优势。' }));
  if ((player?.resources.adminPt ?? 0) >= 8) actions.push(actionWithReason({ id: 'fallback-politics', label: '使用行政余量', desc: '行政点充足时，适合检查政策、法律和派系满意度。', tab: 'politics', level: 36, tone: 'normal', source: 'fallback', reason: '行政点充足，适合补充政治页入口。' }));

  actions.push(actionWithReason({ id: 'fallback-province', label: '发展核心省份', desc: '选择核心省份建设经济基础，保障国库和粮储。', tab: 'province', level: 30, tone: 'normal', source: 'fallback' }));
  actions.push(actionWithReason({ id: 'fallback-diplomacy', label: '经营外交', desc: '改善关系，准备贸易、联盟或下一场战争。', tab: 'diplomacy', level: 25, tone: 'normal', source: 'fallback' }));
  actions.push(actionWithReason({ id: 'fallback-save', label: '保存分支', desc: '重大决策前保留一个手动档，避免路线不可逆。', tab: 'save', level: 20, tone: 'normal', source: 'fallback' }));
  return actions;
}

function distinctTabs(actions: CommandCenterAction[]): number {
  return new Set(actions.map((a) => a.tab)).size;
}

export function arrangeCommandCenterActions(actions: CommandCenterAction[], limit: number): CommandCenterAction[] {
  const sorted = [...actions].sort((a, b) => b.level - a.level);
  const selected: CommandCenterAction[] = [];
  const selectedKeys = new Set<string>();
  const selectedTabs = new Set<NavigationTab>();
  const add = (item: CommandCenterAction) => {
    const key = `${item.id}|${item.tab}`;
    if (selected.length >= limit || selectedKeys.has(key)) return;
    selected.push(item);
    selectedKeys.add(key);
    selectedTabs.add(item.tab);
  };

  for (const item of sorted) if (item.tone === 'danger' || item.level >= 88) add(item);
  for (const item of sorted) if (!selectedTabs.has(item.tab)) add(item);
  for (const item of sorted) add(item);
  return selected.slice(0, limit);
}

export function buildCommandCenterActions(state: GameState, limit = 5, context: CommandCenterContext = {}): CommandCenterAction[] {
  const out: CommandCenterAction[] = [];
  const player = state.nations[state.playerNationId] ?? Object.values(state.nations).find((n) => n.isPlayer && !n.defeated);
  const brief = context.brief ?? buildStrategicBrief(state);
  const readiness = context.readiness ?? buildReadinessReport(state);
  const reportActions = context.reportActions ?? buildTurnReportActions(state, { brief });

  for (const item of [...readiness.blockers, ...readiness.warnings, ...readiness.advice].slice(0, 8)) {
    if (!isNavigationTab(item.tab)) continue;
    const level = item.tone === 'danger' ? 100 : item.tone === 'warn' ? 78 : 45;
    const toneValue: CommandActionTone = item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'normal';
    pushUnique(out, actionWithReason({
      id: `ready-${item.id}`,
      label: item.title,
      desc: item.detail,
      tab: item.tab,
      level,
      tone: toneValue,
      source: 'readiness',
    }));
  }

  for (const item of reportActions.filter(isUsefulReportAction).slice(0, 5)) {
    const level = Math.max(10, item.level - 4);
    const toneValue: CommandActionTone = item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'normal';
    pushUnique(out, actionWithReason({
      id: `report-${item.id}`,
      label: item.title,
      desc: item.body,
      tab: item.tab,
      level,
      tone: toneValue,
      source: 'report',
    }));
  }

  for (const item of brief.urgent.slice(0, 5)) {
    const level = item.level;
    const toneValue = tone(level, item.tone === 'danger');
    pushUnique(out, actionWithReason({
      id: `strategy-${item.title}`,
      label: item.title,
      desc: item.body,
      tab: item.tab,
      level,
      tone: toneValue,
      source: 'strategy',
    }));
  }

  const desiredDiversity = Math.min(3, limit);
  if (out.length < 3 || distinctTabs(out) < desiredDiversity) {
    for (const item of fallbackActions(state, player)) pushUnique(out, item);
  }

  return arrangeCommandCenterActions(out, limit);
}
