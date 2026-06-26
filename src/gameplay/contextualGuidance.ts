// V33 情境式提示：根据当前局势生成“第一次遇到问题该怎么处理”的轻量引导。
// 纯函数，不改 GameState；Dashboard 展示，测试复用。

import type { GameState, Nation } from '../types/game';
import type { NavigationTab } from './navigationTabs';
import { buildChronicleDigest } from './chronicleDigest';
import { buildReadinessReport } from './readiness';
import { buildTurnDebrief } from './turnDebrief';
import { buildTurnPreview } from './turnPreview';
import { bestVictoryRoute } from './victoryRoutes';

export type GuidanceTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';
export type GuidanceCategory = 'first-turn' | 'economy' | 'food' | 'stability' | 'war' | 'diplomacy' | 'report' | 'save' | 'chronicle' | 'victory';

export interface ContextualTip {
  id: string;
  category: GuidanceCategory;
  title: string;
  body: string;
  action: string;
  tab: NavigationTab;
  tone: GuidanceTone;
  priority: number;
}

export interface ContextualGuidance {
  title: string;
  summary: string;
  tone: GuidanceTone;
  tips: ContextualTip[];
  primary: ContextualTip;
}

function netIncome(state: GameState): number {
  const r = state.lastReport;
  if (!r) return 0;
  return r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption;
}

function player(state: GameState): Nation | null {
  return state.nations[state.playerNationId] ?? null;
}

function playerWars(state: GameState): number {
  const pid = state.playerNationId;
  return state.wars.filter((w) => w.attackerId === pid || w.defenderId === pid).length;
}

function unstableProvinceCount(state: GameState): number {
  const pid = state.playerNationId;
  return Object.values(state.provinces).filter((p) => p.ownerId === pid && (p.unrest >= 50 || p.rebellionRisk >= 60 || p.loyalty < 35)).length;
}

function hostileNeighborCount(state: GameState): number {
  const pid = state.playerNationId;
  return state.relations.filter((r) => r.from === pid && (r.treaty === 'war' || r.threat >= 55 || r.relation <= -45)).length;
}

function tip(t: ContextualTip): ContextualTip { return t; }

function dedupe(tips: ContextualTip[]): ContextualTip[] {
  const seen = new Set<string>();
  return tips
    .sort((a, b) => b.priority - a.priority)
    .filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    })
    .slice(0, 5);
}

function titleFor(tone: GuidanceTone): string {
  if (tone === 'danger') return '先处理红色教学情境';
  if (tone === 'warn') return '本回合建议跟着提示修正';
  if (tone === 'gold') return '胜利路线教学窗口已打开';
  if (tone === 'good') return '可以按路线稳步推进';
  return '当前有可学习的系统提示';
}

export function buildContextualGuidance(state: GameState): ContextualGuidance {
  const n = player(state);
  const readiness = buildReadinessReport(state);
  const preview = buildTurnPreview(state, { readiness });
  const debrief = buildTurnDebrief(state);
  const chronicle = buildChronicleDigest(state);
  const route = bestVictoryRoute(state);
  const wars = playerWars(state);
  const unrest = unstableProvinceCount(state);
  const hostile = hostileNeighborCount(state);
  const net = netIncome(state);
  const tips: ContextualTip[] = [];

  if (!n) {
    const fallback = tip({ id: 'missing-player', category: 'first-turn', title: '国家资料缺失', body: '当前没有可用玩家国家。请读档或重新开始。', action: '回到开局或读档', tab: 'save', tone: 'danger', priority: 100 });
    return { title: '需要恢复游戏状态', summary: fallback.body, tone: 'danger', tips: [fallback], primary: fallback };
  }

  if (state.turn <= 1 && !state.lastReport) {
    tips.push(tip({ id: 'first-route', category: 'first-turn', title: '先选一条主线', body: `当前最接近的是 ${route.label}。第一年不要乱点，先看路线图、作战会议和下一回合预演。`, action: '查看帝国路线图', tab: route.tab, tone: 'gold', priority: 62 }));
  }

  if (state.pendingEvents.length > 0) {
    tips.push(tip({ id: 'pending-events', category: 'first-turn', title: '先处理待决事件', body: `还有 ${state.pendingEvents.length} 个待决事件。它们会阻断推进，先处理再结束本年。`, action: '回总览处理事件', tab: 'dashboard', tone: 'danger', priority: 99 }));
  }

  if (n.resources.gold < 0 || net < -35) {
    tips.push(tip({ id: 'economy-red', category: 'economy', title: '第一次财政失血', body: '国库或年度净收入已经转红。先查经济页，不要继续连跳回合。', action: '去经济页看税收/军费/腐败', tab: 'economy', tone: 'danger', priority: 92 }));
  } else if (n.resources.gold < 150) {
    tips.push(tip({ id: 'economy-low', category: 'economy', title: '国库偏薄', body: '国库还没崩，但安全垫不足。和平期优先补金库，战前一定先存档。', action: '补财政安全垫', tab: 'economy', tone: 'warn', priority: 55 }));
  }

  if (n.resources.food < 0 || (state.lastReport?.foodDelta ?? 0) < -45) {
    tips.push(tip({ id: 'food-red', category: 'food', title: '第一次粮食危机', body: '粮食正在下滑。先看省份生产、人口压力和不满，不要只靠下一回合硬熬。', action: '去省份页查粮食与不满', tab: 'province', tone: 'danger', priority: 90 }));
  }

  if (n.government.stability < 35 || unrest > 0) {
    tips.push(tip({ id: 'stability-red', category: 'stability', title: '第一次地方不稳', body: unrest > 0 ? `已有 ${unrest} 个省份出现不满、叛乱风险或低忠诚。先修地方，再谈扩张。` : '国家安定偏低。优先处理政治、派系和地方不满。', action: '去政治或省份页降风险', tab: unrest > 0 ? 'province' : 'politics', tone: 'danger', priority: 88 }));
  }

  if (wars > 0) {
    tips.push(tip({ id: 'war-first', category: 'war', title: '第一次战争不要只看兵力', body: `当前有 ${wars} 场战争。先看士气、补给、厌战和目标省份，不要只按军队人数判断。`, action: '去军事页查前线', tab: 'military', tone: 'warn', priority: 82 }));
  }

  if (hostile > 0 && wars === 0) {
    tips.push(tip({ id: 'diplomacy-threat', category: 'diplomacy', title: '邻国压力升高', body: `有 ${hostile} 个外交对象关系或威胁恶化。先看外交情报，不要等宣战后才反应。`, action: '查看外交情报', tab: 'diplomacy', tone: 'warn', priority: 72 }));
  }

  if (state.lastReport) {
    const bad = debrief?.worsened.length ?? 0;
    tips.push(tip({ id: 'read-report', category: 'report', title: '年报后先复盘', body: bad > 0 ? `年报识别到 ${bad} 个恶化点。下一年先修最红的一项，再推进路线。` : '年报没有明显恶化项。可以回总览继续看路线图和作战会议。', action: '打开年度报告', tab: 'report', tone: bad > 0 ? 'warn' : 'good', priority: bad > 0 ? 70 : 42 }));
  }

  if (route.progress >= 70 || preview.saveAdvice.tone === 'gold' || wars > 0 || n.government.stability < 35) {
    tips.push(tip({ id: 'save-window', category: 'save', title: '关键节点先存档', body: route.progress >= 70 ? `${route.label} 已接近窗口。推进前先手动存档，避免关键分支丢失。` : '战争、低稳定或重大风险前建议手动存档。', action: '打开存档页', tab: 'save', tone: route.progress >= 70 ? 'gold' : 'warn', priority: route.progress >= 70 ? 84 : 58 }));
  }

  if (!chronicle.empty && chronicle.total >= 3) {
    tips.push(tip({ id: 'chronicle-learning', category: 'chronicle', title: '用史册复盘长期主线', body: `${chronicle.chapterTitle} 已形成。史册能告诉你这局更像扩张、危机修复还是长期治世。`, action: '查看帝国史册', tab: 'dashboard', tone: chronicle.tone, priority: 36 }));
  }

  if (tips.length === 0) {
    tips.push(tip({ id: 'steady-loop', category: 'victory', title: '按核心循环推进', body: '当前没有红色教学情境。按“路线图 → 作战会议 → 预演 → 年报复盘”的循环推进即可。', action: '回总览确认路线', tab: 'dashboard', tone: 'good', priority: 20 }));
  }

  const selected = dedupe(tips);
  const primary = selected[0];
  const tone = primary.tone;
  return {
    title: titleFor(tone),
    summary: `${primary.title}：${primary.body}`,
    tone,
    tips: selected,
    primary,
  };
}
