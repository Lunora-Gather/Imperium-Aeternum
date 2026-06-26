// V27 下一回合预演：在玩家按下“下一回合”前，给出安全性、可能变化和保存建议。
// 纯函数，不改 GameState，不预测随机事件结果，只基于当前状态做风险预判。

import type { GameState, Nation, Province } from '../types/game';
import type { NavigationTab } from './navigationTabs';
import { buildCommandCenterActions, type CommandCenterAction } from './commandCenterActions';
import { buildEmpireRoadmap, type EmpireRoadmap } from './empireRoadmap';
import { buildReadinessReport, type ReadinessReport } from './readiness';

export type TurnPreviewTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';
export type TurnPreviewStatus = 'blocked' | 'danger' | 'caution' | 'ready';

export interface TurnPreviewSignal {
  id: string;
  label: string;
  value: string;
  tone: TurnPreviewTone;
}

export interface TurnPreviewItem {
  id: string;
  title: string;
  body: string;
  tone: TurnPreviewTone;
  tab: NavigationTab;
}

export interface TurnPreview {
  status: TurnPreviewStatus;
  tone: TurnPreviewTone;
  canAdvance: boolean;
  title: string;
  summary: string;
  signals: TurnPreviewSignal[];
  likelyChanges: TurnPreviewItem[];
  beforePress: TurnPreviewItem[];
  saveAdvice: TurnPreviewItem;
}

export interface TurnPreviewContext {
  readiness?: ReadinessReport;
  roadmap?: EmpireRoadmap;
  commandActions?: CommandCenterAction[];
}

function n(v: number): number { return Math.round(v); }
function playerOf(state: GameState): Nation | undefined { return state.nations[state.playerNationId] ?? Object.values(state.nations).find((x) => x.isPlayer && !x.defeated); }
function provincesOfPlayer(state: GameState, player?: Nation): Province[] { return player ? Object.values(state.provinces).filter((p) => p.ownerId === player.id) : []; }
function netOf(state: GameState): number | null {
  const r = state.lastReport;
  return r ? r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption : null;
}
function toneFromStatus(status: TurnPreviewStatus): TurnPreviewTone { return status === 'blocked' || status === 'danger' ? 'danger' : status === 'caution' ? 'warn' : 'good'; }

function buildSignals(state: GameState, readiness: ReadinessReport, player?: Nation): TurnPreviewSignal[] {
  const pending = state.pendingEvents.filter((p) => p.nationId === state.playerNationId).length;
  const wars = player ? state.wars.filter((w) => w.attackerId === player.id || w.defenderId === player.id).length : 0;
  const net = netOf(state);
  const signals: TurnPreviewSignal[] = [
    { id: 'readiness', label: '体检', value: `${readiness.score}/100`, tone: readiness.tone === 'danger' ? 'danger' : readiness.tone === 'warn' ? 'warn' : 'good' },
    { id: 'events', label: '待决事件', value: String(pending), tone: pending > 0 ? 'danger' : 'good' },
  ];
  if (player) {
    signals.push({ id: 'gold', label: '国库', value: String(n(player.resources.gold)), tone: player.resources.gold < 0 ? 'danger' : player.resources.gold < 80 ? 'warn' : 'gold' });
    signals.push({ id: 'food', label: '粮储', value: String(n(player.resources.food)), tone: player.resources.food < 0 ? 'danger' : player.resources.food < 80 ? 'warn' : 'good' });
    signals.push({ id: 'stability', label: '安定', value: String(n(player.government.stability)), tone: player.government.stability < 30 ? 'danger' : player.government.stability < 50 ? 'warn' : 'good' });
    signals.push({ id: 'wars', label: '战争', value: String(wars), tone: wars > 0 ? 'warn' : 'good' });
  }
  if (net !== null) signals.push({ id: 'net', label: '上年净收', value: `${net >= 0 ? '+' : ''}${n(net)}`, tone: net < -30 ? 'danger' : net < 0 ? 'warn' : 'good' });
  return signals.slice(0, 7);
}

function likelyChanges(state: GameState, player?: Nation, provinces: Province[] = []): TurnPreviewItem[] {
  const items: TurnPreviewItem[] = [];
  const net = netOf(state);
  const last = state.lastReport;
  const wars = player ? state.wars.filter((w) => w.attackerId === player.id || w.defenderId === player.id) : [];
  const unrest = provinces.filter((p) => p.rebellionRisk > 65 || p.unrest > 55 || p.loyalty < 35);

  if (!last) items.push({ id: 'first-report', title: '将生成首份年报', body: '推进后会第一次形成财政、粮食、社会和天下大势报告。', tone: 'info', tab: 'report' });
  if (net !== null && net < 0) items.push({ id: 'gold-drop', title: '国库可能继续下降', body: `上年净收入 ${n(net)}，若不先处理经济，下一年仍可能失血。`, tone: net < -30 ? 'danger' : 'warn', tab: 'economy' });
  if (last && last.foodDelta < 0) items.push({ id: 'food-drop', title: '粮储可能继续承压', body: `上年粮食 ${n(last.foodDelta)}，建议先检查省份生产和人口压力。`, tone: last.foodDelta < -50 ? 'danger' : 'warn', tab: 'province' });
  if (player && player.government.stability < 40) items.push({ id: 'stability-risk', title: '低安定会放大事件风险', body: `当前安定 ${n(player.government.stability)}，连续推进可能让事件和地方风险更难控。`, tone: player.government.stability < 30 ? 'danger' : 'warn', tab: 'politics' });
  if (wars.length > 0) items.push({ id: 'war-roll', title: '战争会继续结算', body: `当前 ${wars.length} 场战争会继续消耗补给、士气和厌战。`, tone: player && player.warExhaustion > 65 ? 'danger' : 'warn', tab: 'military' });
  if (unrest.length > 0) items.push({ id: 'local-risk', title: '地方风险可能升级', body: `${unrest.length} 个省份有高不满、低忠诚或叛乱风险。`, tone: unrest.length >= 3 ? 'danger' : 'warn', tab: 'province' });
  if (items.length === 0) items.push({ id: 'normal-cycle', title: '常规年度结算', body: '没有明显硬风险，推进后重点看年报和路线图是否变好。', tone: 'good', tab: 'report' });
  return items.slice(0, 4);
}

function buildBeforePress(actions: CommandCenterAction[]): TurnPreviewItem[] {
  return actions.slice(0, 3).map((a, i) => ({
    id: `before-${a.id}`,
    title: i === 0 ? `先处理：${a.label}` : a.label,
    body: a.desc,
    tone: a.tone === 'danger' ? 'danger' : a.tone === 'warn' ? 'warn' : 'info',
    tab: a.tab,
  }));
}

function saveAdvice(status: TurnPreviewStatus, roadmap: EmpireRoadmap, player?: Nation): TurnPreviewItem {
  if (status === 'blocked') return { id: 'save-blocked', title: '暂不建议推进', body: '先处理阻断项。处理前可以保存分支，避免事件选择不可逆。', tone: 'danger', tab: 'save' };
  if (status === 'danger') return { id: 'save-danger', title: '推进前建议手动存档', body: '当前属于高风险推进，先保存一个手动槽位再做重大操作。', tone: 'warn', tab: 'save' };
  if (roadmap.route.progress >= 70) return { id: 'save-route', title: '胜利窗口前保存', body: `${roadmap.route.label} 已接近成形，推进前保留一个分支更安全。`, tone: 'gold', tab: 'save' };
  if (player && (player.resources.gold < 80 || player.resources.food < 80)) return { id: 'save-thin-margin', title: '资源余量偏薄', body: '国库或粮储余量不厚，连续推进前建议保留一个存档。', tone: 'warn', tab: 'save' };
  return { id: 'save-normal', title: '可正常推进', body: '当前没有明显硬风险；推进后先读年报，再回总览看路线图。', tone: 'good', tab: 'report' };
}

export function buildTurnPreview(state: GameState, context: TurnPreviewContext = {}): TurnPreview {
  const readiness = context.readiness ?? buildReadinessReport(state);
  const roadmap = context.roadmap ?? buildEmpireRoadmap(state, { readiness });
  const commandActions = context.commandActions ?? buildCommandCenterActions(state, 5, { readiness });
  const player = playerOf(state);
  const provinces = provincesOfPlayer(state, player);
  const pending = state.pendingEvents.filter((p) => p.nationId === state.playerNationId).length;
  const likely = likelyChanges(state, player, provinces);

  let status: TurnPreviewStatus = 'ready';
  if (!readiness.canAdvance || pending > 0) status = 'blocked';
  else if (readiness.tone === 'danger' || likely.some((x) => x.tone === 'danger')) status = 'danger';
  else if (readiness.tone === 'warn' || likely.some((x) => x.tone === 'warn') || roadmap.tier === 'strained') status = 'caution';

  const tone = toneFromStatus(status);
  const title = status === 'blocked' ? '现在不能安全推进'
    : status === 'danger' ? '高风险推进'
      : status === 'caution' ? '谨慎推进'
        : '可以推进';
  const summary = status === 'blocked'
    ? '存在待决事件或硬性阻断，先处理再推进。'
    : status === 'danger'
      ? '推进会触发高风险年度结算，建议先处理路线图首项并手动存档。'
      : status === 'caution'
        ? '可以推进，但最好先处理黄色风险或保存分支。'
        : '没有明显硬风险，推进后阅读年报并复查路线图。';

  return {
    status,
    tone,
    canAdvance: status !== 'blocked',
    title,
    summary,
    signals: buildSignals(state, readiness, player),
    likelyChanges: likely,
    beforePress: buildBeforePress(commandActions),
    saveAdvice: saveAdvice(status, roadmap, player),
  };
}
