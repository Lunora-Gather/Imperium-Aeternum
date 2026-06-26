// V29 回合后复盘：把年报变化转成年度结论、改善项、恶化项和下一年重点。
// 纯函数，不改 GameState。

import type { GameState, TurnReport } from '../types/game';
import type { NavigationTab } from './navigationTabs';
import { buildTurnReportActions, type TurnReportAction } from './turnReportActions';
import { bestVictoryRoute, buildVictoryRoutes, type VictoryRouteCard } from './victoryRoutes';

export type DebriefTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';

export interface DebriefPoint {
  id: string;
  title: string;
  body: string;
  tone: DebriefTone;
  tab: NavigationTab;
}

export interface TurnDebrief {
  score: number;
  tone: DebriefTone;
  title: string;
  verdict: string;
  improved: DebriefPoint[];
  worsened: DebriefPoint[];
  nextFocus: DebriefPoint;
  route: VictoryRouteCard;
  routes: VictoryRouteCard[];
}

function net(r: TurnReport): number { return r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption; }
function clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))); }
function scoreTone(score: number): DebriefTone { return score >= 78 ? 'gold' : score >= 62 ? 'good' : score >= 42 ? 'warn' : 'danger'; }
function point(id: string, title: string, body: string, tone: DebriefTone, tab: NavigationTab): DebriefPoint { return { id, title, body, tone, tab }; }

function scoreReport(r: TurnReport): number {
  let score = 55;
  const yearlyNet = net(r);
  score += Math.max(-22, Math.min(22, yearlyNet / 8));
  score += Math.max(-18, Math.min(18, r.foodDelta / 8));
  score += Math.max(-14, Math.min(14, r.stabilityDelta * 3));
  score += Math.max(-10, Math.min(10, r.legitimacyDelta * 2));
  score -= Math.max(0, r.unrestDelta * 2);
  score -= r.warnings.length * 6;
  score += r.provinceChanges.filter((p) => p.to === r.nationId).length * 8;
  score -= r.provinceChanges.filter((p) => p.from === r.nationId).length * 12;
  for (const w of r.warProgress) score += w.outcome === 'advance' ? 6 : w.outcome === 'repelled' ? -8 : -2;
  return clamp(score);
}

function improved(r: TurnReport): DebriefPoint[] {
  const out: DebriefPoint[] = [];
  const yearlyNet = net(r);
  if (yearlyNet > 0) out.push(point('net-positive', '财政改善', `本年净收入 +${Math.round(yearlyNet)}，国家机器有继续运转空间。`, 'good', 'economy'));
  if (r.foodDelta > 0) out.push(point('food-positive', '粮食增收', `粮食 +${Math.round(r.foodDelta)}，人口和稳定底盘更安全。`, 'good', 'province'));
  if (r.stabilityDelta > 0) out.push(point('stability-positive', '安定上升', `安定 +${Math.round(r.stabilityDelta)}，地方风险下降。`, 'good', 'politics'));
  if (r.legitimacyDelta > 0) out.push(point('legitimacy-positive', '法统回升', `法统 +${Math.round(r.legitimacyDelta)}，长期统治更稳。`, 'good', 'politics'));
  if (r.provinceChanges.some((p) => p.to === r.nationId)) out.push(point('province-gained', '疆土扩张', '本年获得新省份，征服路线推进。', 'gold', 'military'));
  if (r.warProgress.some((w) => w.outcome === 'advance')) out.push(point('war-advance', '战线推进', '战争取得推进，下一年仍要确认补给和厌战。', 'good', 'military'));
  return out.slice(0, 5);
}

function worsened(r: TurnReport): DebriefPoint[] {
  const out: DebriefPoint[] = [];
  const yearlyNet = net(r);
  if (yearlyNet < 0) out.push(point('net-negative', '财政失血', `本年净收入 ${Math.round(yearlyNet)}，需要检查税收、贸易和军费。`, yearlyNet < -40 ? 'danger' : 'warn', 'economy'));
  if (r.foodDelta < 0) out.push(point('food-negative', '粮食承压', `粮食 ${Math.round(r.foodDelta)}，需要检查省份生产和人口压力。`, r.foodDelta < -50 ? 'danger' : 'warn', 'province'));
  if (r.stabilityDelta < 0) out.push(point('stability-negative', '安定下滑', `安定 ${Math.round(r.stabilityDelta)}，下一年优先处理政治和不满。`, 'warn', 'politics'));
  if (r.legitimacyDelta < 0) out.push(point('legitimacy-negative', '法统受损', `法统 ${Math.round(r.legitimacyDelta)}，长期路线会受影响。`, 'warn', 'politics'));
  if (r.unrestDelta > 0) out.push(point('unrest-up', '不满上升', `不满 +${Math.round(r.unrestDelta)}，地方风险可能扩散。`, 'warn', 'province'));
  if (r.provinceChanges.some((p) => p.from === r.nationId)) out.push(point('province-lost', '疆土损失', '本年失去省份，必须复查军事和外交态势。', 'danger', 'military'));
  if (r.warProgress.some((w) => w.outcome === 'repelled')) out.push(point('war-repelled', '战线受挫', '战争推进受挫，前线可能缺士气、兵力或补给。', 'danger', 'military'));
  if (r.warnings.length > 0) out.push(point('warnings', '年度警告', `本年出现 ${r.warnings.length} 条警告，下一年先复查总览。`, 'warn', 'dashboard'));
  return out.slice(0, 6);
}

function focusFromAction(actions: TurnReportAction[]): DebriefPoint {
  const a = actions[0];
  if (!a) return point('focus-dashboard', '回总览复盘', '先回总览查看路线图、作战会议和下一回合预演。', 'info', 'dashboard');
  return point(`focus-${a.id}`, a.title, a.body, a.tone === 'danger' ? 'danger' : a.tone === 'warn' ? 'warn' : 'info', a.tab);
}

export function buildTurnDebrief(state: GameState): TurnDebrief | null {
  const r = state.lastReport;
  if (!r) return null;
  const score = scoreReport(r);
  const t = scoreTone(score);
  const plus = improved(r);
  const minus = worsened(r);
  const actions = buildTurnReportActions(state);
  const routes = buildVictoryRoutes(state);
  const route = bestVictoryRoute(state);
  const title = t === 'gold' ? '本年大幅推进' : t === 'good' ? '本年总体向好' : t === 'warn' ? '本年喜忧参半' : '本年形势恶化';
  const verdict = minus.length === 0
    ? `年度复盘 ${score}/100。没有明显恶化项，建议围绕 ${route.label} 继续推进。`
    : `年度复盘 ${score}/100。${minus[0].title} 是下一年首要修正点，当前最接近 ${route.label}。`;
  return { score, tone: t, title, verdict, improved: plus, worsened: minus, nextFocus: focusFromAction(actions), route, routes };
}
