// V19 年报行动路由：把“今年发生了什么”转成“下一步该去哪儿”。
// 纯函数，供年报页、未来快捷行动栏和测试复用。

import type { GameState } from '../types/game';
import { buildStrategicBrief } from './strategicAdvisor';

export type TurnReportActionTone = 'good' | 'warn' | 'danger' | 'info';
export type TurnReportActionTab = 'dashboard' | 'province' | 'economy' | 'population' | 'politics' | 'military' | 'diplomacy' | 'tech' | 'save';

export interface TurnReportAction {
  id: string;
  title: string;
  body: string;
  tab: TurnReportActionTab;
  level: number;
  tone: TurnReportActionTone;
  tag: string;
}

function toneFromLevel(level: number): TurnReportActionTone {
  if (level >= 88) return 'danger';
  if (level >= 58) return 'warn';
  return 'info';
}

function tagFromLevel(level: number): string {
  if (level >= 88) return '紧急';
  if (level >= 58) return '建议';
  return '规划';
}

function action(id: string, title: string, body: string, tab: TurnReportActionTab, level: number): TurnReportAction {
  return { id, title, body, tab, level, tone: toneFromLevel(level), tag: tagFromLevel(level) };
}

function dedupe(actions: TurnReportAction[]): TurnReportAction[] {
  const seen = new Set<string>();
  const out: TurnReportAction[] = [];
  for (const a of actions.sort((x, y) => y.level - x.level)) {
    const key = `${a.id}|${a.tab}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

export function buildTurnReportActions(state: GameState): TurnReportAction[] {
  const r = state.lastReport;
  const pid = state.playerNationId;
  const player = state.nations[pid];
  if (!r || !player) {
    return [action('no-report', '先回总览', '尚无年度报告，先回总览查看当前国情与下一回合前检查。', 'dashboard', 20)];
  }

  const actions: TurnReportAction[] = [];
  const income = r.income.tax + r.income.trade + r.income.building;
  const expense = r.expense.military + r.expense.corruption;
  const net = income - expense;
  const atWar = state.wars.some((w) => w.attackerId === pid || w.defenderId === pid);
  const pending = state.pendingEvents.some((p) => p.nationId === pid);
  const lostProvince = r.provinceChanges.some((pc) => pc.from === pid);
  const gainedProvince = r.provinceChanges.some((pc) => pc.to === pid);

  if (pending) actions.push(action('pending-event', '先处理待决事件', '还有事件没有决断，下一回合前必须先处理事件弹窗。', 'dashboard', 98));
  if (player.resources.gold < 0) actions.push(action('gold-negative', '国库已经赤字', '国库为负会拖垮长期治理，优先去经济页调税、控军费或增加收入。', 'economy', 96));
  else if (net < -30) actions.push(action('net-loss', '财政正在失血', `本年净收入 ${Math.round(net)}，建议去经济页检查税收、贸易与军费。`, 'economy', 84));

  if (player.resources.food < 0) actions.push(action('food-negative', '粮储已经见底', '粮储为负会引发连锁危机，优先去省份页处理农业、人口与不满。', 'province', 94));
  else if (r.foodDelta < -50) actions.push(action('food-loss', '粮食减产明显', '本年粮食大幅下降，建议检查农田、人口增长和省份不满。', 'province', 76));

  if (player.government.stability < 35) actions.push(action('stability-low', '安定过低', '安定过低会放大叛乱与事件风险，优先去政治页安抚派系、改善治理。', 'politics', 92));
  else if (r.stabilityDelta < -5) actions.push(action('stability-drop', '稳定正在下滑', '本年稳定度明显下降，建议检查税率、派系和近期事件影响。', 'politics', 74));

  if (player.warExhaustion >= 75) actions.push(action('war-exhaustion', '厌战接近极限', '长期战争正在消耗国家，去军事或外交页评估停战、补给和前线。', atWar ? 'military' : 'diplomacy', 90));
  if (lostProvince) actions.push(action('lost-province', '疆土出现损失', '本年有省份失去，建议立刻查看军事形势和敌方目标。', 'military', 91));
  if (atWar && r.warProgress.length === 0) actions.push(action('silent-front', '战争没有战果', '战争中但本年没有明显战果，可能缺前线军队、补给或士气。', 'military', 72));
  if (gainedProvince) actions.push(action('new-province', '新领土需要消化', '新获得省份后，建议查看忠诚、同化、不满和驻军。', 'province', 62));

  if (r.worldEvents.some((e) => e.includes('扩张战略') || e.includes('宣战') || e.includes('觊觎'))) {
    actions.push(action('world-expansion', '关注邻国动向', '周边战略或领土野心正在变化，建议查看外交与军事页。', 'diplomacy', 72));
  }
  if (player.resources.sciPt > 250) actions.push(action('science-ready', '可推进科技', '科研点已有积累，下一步可以解锁建筑、政策或治理效率。', 'tech', 44));

  const brief = buildStrategicBrief(state);
  for (const x of brief.urgent.slice(0, 4)) {
    actions.push(action(`brief-${x.title}`, x.title, x.body, x.tab as TurnReportActionTab, x.level));
  }

  if (actions.length === 0) {
    actions.push(action('stable-plan', '局势尚稳', '可以按长期目标推进：发展经济、研发科技、扩展外交或准备下一场战争。', 'dashboard', 20));
  }
  return dedupe(actions);
}
