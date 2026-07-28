// 年报因果链：把结算结果压缩为可核对的“来源 → 结果”，不再只展示总涨跌。

import type { GameState } from '../types/game';

export type TurnCauseTone = 'good' | 'warn' | 'info';

export interface TurnCauseLine {
  id: string;
  title: string;
  detail: string;
  tone: TurnCauseTone;
}

export interface TurnCausality {
  netGold: number;
  lines: TurnCauseLine[];
}

function signed(value: number): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}${rounded}`;
}

export function buildTurnCausality(state: GameState): TurnCausality | null {
  const report = state.lastReport;
  if (!report) return null;
  const income = report.income.tax + report.income.trade + report.income.building;
  const expense = report.expense.military + report.expense.corruption;
  const netGold = Math.round(income - expense);
  const lines: TurnCauseLine[] = [{
    id: 'finance',
    title: '财政结算',
    detail: `税收 +${Math.round(report.income.tax)} + 贸易 +${Math.round(report.income.trade)} + 建筑 +${Math.round(report.income.building)} − 军费 ${Math.round(report.expense.military)} − 腐败 ${Math.round(report.expense.corruption)} = ${signed(netGold)} 金`,
    tone: netGold >= 0 ? 'good' : 'warn',
  }, {
    id: 'society',
    title: '社会结算',
    detail: `粮食 ${signed(report.foodDelta)} · 人口 ${signed(report.popDelta)} · 安定 ${signed(report.stabilityDelta)} · 法统 ${signed(report.legitimacyDelta)} · 不满 ${signed(report.unrestDelta)}`,
    tone: report.foodDelta < 0 || report.stabilityDelta < 0 || report.unrestDelta > 0 ? 'warn' : 'good',
  }];

  for (const [index, note] of (report.strategicNotes ?? []).entries()) {
    lines.push({ id: `strategy-${index}`, title: '国策与制度', detail: note, tone: 'info' });
  }
  if (report.events.length > 0) {
    lines.push({ id: 'events', title: '事件影响', detail: `本年 ${report.events.length} 起事件已计入上述资源与社会变化；可在下方逐项核对。`, tone: 'info' });
  }
  for (const [index, event] of report.worldEvents.slice(0, 3).entries()) {
    lines.push({ id: `world-${index}`, title: 'AI 与天下大势', detail: event, tone: 'info' });
  }
  return { netGold, lines };
}
