// Strategic Advisor v1 — 帝国总参谋部
// 统一分析财政、粮食、战争、地方、外交、科技、派系和国运阶段。

import type { GameState, Nation, Province, TurnReport } from '../types/game';
import { getAIStrategyInfo } from './strategyFocus';

type AdvisorTab = 'dashboard' | 'province' | 'economy' | 'population' | 'politics' | 'military' | 'diplomacy' | 'tech' | 'stats' | 'chronicle' | 'save';
export type AdvisorTone = 'danger' | 'warn' | 'good' | 'info' | 'gold';

export interface StrategicItem {
  title: string;
  body: string;
  tab: AdvisorTab;
  level: number;
  tone: AdvisorTone;
  reason: string;
}

export interface StrategicBrief {
  phase: string;
  doctrine: string;
  doctrineBody: string;
  score: number;
  scoreLabel: string;
  urgent: StrategicItem[];
  opportunities: StrategicItem[];
  horizon: string[];
  risks: string[];
}

function clamp(v: number, min = 0, max = 100): number { return Math.max(min, Math.min(max, v)); }
function n(v: number): number { return Math.round(v); }
function playerOf(state: GameState): Nation | null { return state.nations[state.playerNationId] ?? Object.values(state.nations).find((x) => x.isPlayer && !x.defeated) ?? null; }
function provsOf(state: GameState, nationId: string): Province[] { return Object.values(state.provinces).filter((p) => p.ownerId === nationId); }
function netOf(r?: TurnReport | null): number { return r ? r.income.tax + r.income.trade + r.income.building - r.expense.military - r.expense.corruption : 0; }
function armySize(n?: Nation): number { return n ? n.army.reduce((s, a) => s + a.size, 0) : 0; }
function avg(xs: number[]): number { return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0; }
function trend(xs: number[]): number { const n = Math.min(5, xs.length); if (n < 2) return 0; const a = avg(xs.slice(-n)); const b = avg(xs.slice(Math.max(0, xs.length - n * 2), xs.length - n)); return a - b; }

function add(list: StrategicItem[], item: StrategicItem): void {
  if (list.some((x) => x.title === item.title)) return;
  list.push(item);
}

function scoreState(player: Nation, provs: Province[], state: GameState): number {
  const lastNet = netOf(state.lastReport);
  const avgUnrest = avg(provs.map((p) => p.unrest));
  const avgLoyalty = avg(provs.map((p) => p.loyalty));
  const wars = state.wars.filter((w) => w.attackerId === player.id || w.defenderId === player.id).length;
  let score = 62;
  score += clamp(player.resources.gold / 18, -18, 18);
  score += clamp(player.resources.food / 25, -14, 14);
  score += clamp(lastNet / 18, -14, 14);
  score += (player.government.stability - 50) * 0.28;
  score += (player.government.legitimacy - 50) * 0.18;
  score += (avgLoyalty - 50) * 0.12;
  score -= Math.max(0, avgUnrest - 35) * 0.25;
  score -= Math.max(0, player.government.corruption - 35) * 0.25;
  score -= Math.max(0, player.warExhaustion - 35) * 0.25;
  score -= wars * 6;
  return clamp(score);
}

function scoreLabel(score: number): string {
  if (score >= 80) return '鼎盛';
  if (score >= 62) return '稳健';
  if (score >= 45) return '承压';
  if (score >= 28) return '危局';
  return '崩坏边缘';
}

function weakestTech(player: Nation): 'agri' | 'mil' | 'admin' | 'culture' {
  const rows = (['agri', 'mil', 'admin', 'culture'] as const).map((id) => ({ id, v: player.tech[id] ?? 0 }));
  return rows.sort((a, b) => a.v - b.v)[0].id;
}

function labelTech(id: string): string {
  return ({ agri: '农业', mil: '军事', admin: '行政', culture: '文化' } as Record<string, string>)[id] ?? id;
}

function externalThreats(state: GameState, player: Nation): { name: string; score: number; note: string }[] {
  return Object.values(state.nations).filter((n) => n.id !== player.id && !n.defeated).map((n) => {
    const rel = state.relations.find((r) => r.from === player.id && r.to === n.id);
    const ai = getAIStrategyInfo(state, n.id);
    const desiresPlayerProvince = !!ai?.desiredProvinceId && state.provinces[ai.desiredProvinceId]?.ownerId === player.id;
    const atWar = state.wars.some((w) => [w.attackerId, w.defenderId].includes(player.id) && [w.attackerId, w.defenderId].includes(n.id));
    const score = (atWar ? 80 : 0)
      + (rel?.threat ?? 0) * 0.7
      + Math.max(0, -(rel?.relation ?? 0)) * 0.45
      + (ai?.kind === 'expansion' ? 25 : 0)
      + (ai?.rivalId === player.id ? 35 : 0)
      + (desiresPlayerProvince ? 45 : 0)
      + clamp((armySize(n) - armySize(player)) / Math.max(80, armySize(player) + 1) * 22, 0, 22);
    const note = desiresPlayerProvince ? `觊觎 ${ai?.desiredProvinceName ?? '我方省份'}` : ai?.rivalId === player.id ? '视我为宿敌' : atWar ? '战争中' : ai?.kind === 'expansion' ? '扩张倾向' : '关系/威胁偏高';
    return { name: n.name, score, note };
  }).filter((x) => x.score >= 28).sort((a, b) => b.score - a.score).slice(0, 5);
}

export function buildStrategicBrief(state: GameState): StrategicBrief {
  const player = playerOf(state);
  if (!player) {
    const item: StrategicItem = { title: '无法识别玩家国家', body: '当前存档缺少玩家国家，建议回标题页重新开始或读取其他存档。', tab: 'save', level: 100, tone: 'danger', reason: 'player-missing' };
    return { phase: '异常', doctrine: '修复存档', doctrineBody: '先恢复可玩的国家状态。', score: 0, scoreLabel: '异常', urgent: [item], opportunities: [], horizon: ['读取旧档或开始新局'], risks: ['玩家国家缺失'] };
  }

  const provs = provsOf(state, player.id);
  const last = state.lastReport;
  const net = netOf(last);
  const atWars = state.wars.filter((w) => w.attackerId === player.id || w.defenderId === player.id);
  const highRiskProvs = provs.filter((p) => p.rebellionRisk > 65 || p.unrest > 55 || p.loyalty < 35).sort((a, b) => (b.rebellionRisk + b.unrest + Math.max(0, 50 - b.loyalty)) - (a.rebellionRisk + a.unrest + Math.max(0, 50 - a.loyalty)));
  const lowFaction = [...player.factions].sort((a, b) => a.satisfaction - b.satisfaction)[0];
  const avgUnrest = avg(provs.map((p) => p.unrest));
  const avgLoyalty = avg(provs.map((p) => p.loyalty));
  const threats = externalThreats(state, player);
  const techGap = weakestTech(player);
  const goldTrend = trend(state.history.map(netOf));
  const foodTrend = trend(state.history.map((r) => r.foodDelta));
  const urgent: StrategicItem[] = [];
  const opportunities: StrategicItem[] = [];
  const risks: string[] = [];

  if (player.resources.food < 0 || (last && last.foodDelta < -80) || foodTrend < -45) {
    add(urgent, { title: '粮食系统优先', body: `粮储 ${n(player.resources.food)}，粮食趋势 ${n(foodTrend)}。先保粮，别让人口和稳定一起掉。`, tab: 'economy', level: 100, tone: 'danger', reason: 'food' });
    risks.push('粮食危机');
  }
  if (player.resources.gold < 0 || net < -80 || goldTrend < -35) {
    add(urgent, { title: '财政止血', body: `净收入 ${n(net)}，国库 ${n(player.resources.gold)}。优先调税、贸易、腐败和军费。`, tab: 'economy', level: 96, tone: 'danger', reason: 'gold' });
    risks.push('财政赤字');
  }
  if (player.government.stability < 35 || avgUnrest > 55 || highRiskProvs.length > 0) {
    add(urgent, { title: '地方与稳定', body: highRiskProvs[0] ? `${highRiskProvs[0].name} 风险最高，先驻军/安抚/降不满。` : '稳定和不满指标不佳，先压住社会风险。', tab: 'province', level: 92, tone: 'danger', reason: 'province' });
    risks.push('地方失控');
  }
  if (player.government.legitimacy < 35 || player.government.corruption > 58 || player.government.efficiency < 38) {
    add(urgent, { title: '政体修复', body: `合法 ${n(player.government.legitimacy)} / 治能 ${n(player.government.efficiency)} / 腐败 ${n(player.government.corruption)}，政治页优先修制度。`, tab: 'politics', level: 88, tone: 'warn', reason: 'politics' });
    risks.push('政治结构脆弱');
  }
  if (lowFaction && lowFaction.satisfaction < 35) {
    add(urgent, { title: '派系不满', body: `${lowFaction.id} 满意 ${n(lowFaction.satisfaction)}、权力 ${n(lowFaction.power)}。先安抚或用政策改派系温度。`, tab: 'population', level: 78, tone: 'warn', reason: 'faction' });
    risks.push('派系反弹');
  }
  if (atWars.length > 0 || player.warExhaustion > 55) {
    add(urgent, { title: '战争调度', body: atWars.length ? `正在进行 ${atWars.length} 场战争，检查前线军队、补给和厌战。` : `厌战 ${n(player.warExhaustion)}，不宜拖入长期战争。`, tab: 'military', level: player.warExhaustion > 65 ? 86 : 70, tone: player.warExhaustion > 65 ? 'danger' : 'warn', reason: 'war' });
    risks.push('战争压力');
  }
  if (threats.length > 0 && threats[0].score >= 55) {
    add(urgent, { title: '外部威胁', body: `${threats[0].name}：${threats[0].note}。外交页确认是否贸易、结盟或备战。`, tab: 'diplomacy', level: Math.min(94, threats[0].score), tone: threats[0].score > 75 ? 'danger' : 'warn', reason: 'diplomacy' });
    risks.push('邻国威胁');
  }

  if (player.resources.sciPt >= 120 || player.tech[techGap] <= 2) add(opportunities, { title: `补${labelTech(techGap)}科技`, body: `${labelTech(techGap)}是当前科技短板，补齐后能打开长期发展空间。`, tab: 'tech', level: 45, tone: 'info', reason: 'tech' });
  if (player.resources.gold > 350 && highRiskProvs.length === 0) add(opportunities, { title: '建设核心省', body: '国库较充足，适合投资首都/高人口省，扩大长期税基。', tab: 'province', level: 42, tone: 'good', reason: 'build' });
  if (player.resources.influence >= 60 && threats.length < 2) add(opportunities, { title: '外交扩网', body: '影响力充足，可贸易、结盟或缓和潜在敌人。', tab: 'diplomacy', level: 40, tone: 'good', reason: 'influence' });
  if (state.history.length >= 3) add(opportunities, { title: '查看趋势', body: '已有足够历史数据，可用统计页判断是否进入财政/粮食/厌战拐点。', tab: 'stats', level: 28, tone: 'info', reason: 'stats' });
  add(opportunities, { title: '保存分支', body: '大规模操作前保存一个手动档，避免错误路线无法回退。', tab: 'save', level: 25, tone: 'gold', reason: 'save' });

  urgent.sort((a, b) => b.level - a.level);
  opportunities.sort((a, b) => b.level - a.level);

  const score = scoreState(player, provs, state);
  let phase = '均衡经营';
  let doctrine = '稳中求进';
  let doctrineBody = '没有单点崩盘风险，优先把资源转化为科技、建筑、贸易和国运目标。';
  if (score < 35 || urgent.some((x) => x.level >= 95)) { phase = '危机处置'; doctrine = '先活下来'; doctrineBody = '本阶段不要贪扩张，先保粮、保财政、保稳定。'; }
  else if (atWars.length > 0 || threats[0]?.score >= 70) { phase = '战争/威慑'; doctrine = '先定边患'; doctrineBody = '把军队、外交和厌战放在同一张表里处理，避免战争拖垮内政。'; }
  else if (player.government.corruption > 50 || player.government.efficiency < 45) { phase = '制度整顿'; doctrine = '先修国家机器'; doctrineBody = '治能和腐败决定长期效率，先推法律、政策和行政科技。'; }
  else if (player.resources.gold > 400 && player.resources.food > 300) { phase = '扩张窗口'; doctrine = '可择机进取'; doctrineBody = '经济基础可支撑扩张，但开战前要确认外交和补给。'; }

  const horizon = [
    urgent[0] ? `今年：${urgent[0].title}` : '今年：按国运目标推进',
    urgent[1] ? `三年内：${urgent[1].title}` : opportunities[0] ? `三年内：${opportunities[0].title}` : '三年内：补科技与建筑',
    opportunities[1] ? `长期：${opportunities[1].title}` : `长期：补${labelTech(techGap)}科技并维持稳定`,
  ];

  return { phase, doctrine, doctrineBody, score, scoreLabel: scoreLabel(score), urgent: urgent.slice(0, 6), opportunities: opportunities.slice(0, 5), horizon, risks: risks.slice(0, 8) };
}
