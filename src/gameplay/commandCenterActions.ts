// V21 行动中心：支持复用总览页已算好的体检、年报行动和战略简报。
// 纯函数，不改 GameState；总览 UI、未来快捷栏和测试可复用。

import type { GameState } from '../types/game';
import { buildReadinessReport, type ReadinessReport } from './readiness';
import { buildStrategicBrief, type StrategicBrief } from './strategicAdvisor';
import { buildTurnReportActions, type TurnReportAction } from './turnReportActions';

export type CommandActionTone = 'normal' | 'warn' | 'danger';

export interface CommandCenterAction {
  id: string;
  label: string;
  desc: string;
  tab: string;
  level: number;
  tone: CommandActionTone;
  source: 'readiness' | 'report' | 'strategy' | 'fallback';
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

export function buildCommandCenterActions(state: GameState, limit = 5, context: CommandCenterContext = {}): CommandCenterAction[] {
  const out: CommandCenterAction[] = [];
  const brief = context.brief ?? buildStrategicBrief(state);
  const readiness = context.readiness ?? buildReadinessReport(state);
  const reportActions = context.reportActions ?? buildTurnReportActions(state, { brief });

  for (const item of [...readiness.blockers, ...readiness.warnings, ...readiness.advice].slice(0, 8)) {
    if (!item.tab) continue;
    const level = item.tone === 'danger' ? 100 : item.tone === 'warn' ? 78 : 45;
    pushUnique(out, {
      id: `ready-${item.id}`,
      label: item.title,
      desc: item.detail,
      tab: item.tab,
      level,
      tone: item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'normal',
      source: 'readiness',
    });
  }

  for (const item of reportActions.slice(0, 5)) {
    pushUnique(out, {
      id: `report-${item.id}`,
      label: item.title,
      desc: item.body,
      tab: item.tab,
      level: Math.max(10, item.level - 4),
      tone: item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'normal',
      source: 'report',
    });
  }

  for (const item of brief.urgent.slice(0, 5)) {
    pushUnique(out, {
      id: `strategy-${item.title}`,
      label: item.title,
      desc: item.body,
      tab: item.tab,
      level: item.level,
      tone: tone(item.level, item.tone === 'danger'),
      source: 'strategy',
    });
  }

  if (out.length < 3) {
    pushUnique(out, { id: 'fallback-province', label: '发展省份', desc: '选择核心省份建设经济基础，保障国库和粮储。', tab: 'province', level: 30, tone: 'normal', source: 'fallback' });
    pushUnique(out, { id: 'fallback-diplomacy', label: '经营外交', desc: '改善关系，准备贸易、联盟或下一场战争。', tab: 'diplomacy', level: 25, tone: 'normal', source: 'fallback' });
    pushUnique(out, { id: 'fallback-save', label: '保存分支', desc: '重大决策前保留一个手动档，避免路线不可逆。', tab: 'save', level: 20, tone: 'normal', source: 'fallback' });
  }

  return out.sort((a, b) => b.level - a.level).slice(0, limit);
}
