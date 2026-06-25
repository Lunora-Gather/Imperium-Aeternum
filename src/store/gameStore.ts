// Imperium Aeternum — Zustand 全局状态
// 阶段 5a

import { create } from 'zustand';
import type { GameState, TurnReport, Nation } from '../types/game';
import { createInitialState, createWorldState, getRelationObj } from '../engine/init';
import { espionage as engineEspionage, dynasticMarriage as engineMarriage, culturalExport as engineCulturalExport, improveRelation as engineImproveRelation, establishTrade as engineEstablishTrade, formAlliance as engineFormAlliance } from '../engine/diplomacy';
import { moveArmy as engineMoveArmy, makePeace as engineMakePeace, declareWar as engineDeclareWar } from '../engine/military';
import { processTurn, recordPlayerAction } from '../engine/turn';
import { addChronicle } from '../engine/chronicle';
import { saveGame, loadGame, hasSave, deleteSave, saveGameToSlot, loadGameFromSlot, deleteSlot, autoSave } from './persistence';
import { PLAYER_ID } from '../data/nations';
import { BUILDINGS } from '../data/buildings';
import type { BuildingId } from '../data/buildings';
import { TECHNOLOGIES } from '../data/technologies';
import { POLICY_BY_ID } from '../data/policies';
import type { PolicyId } from '../data/policies';
import { LAWS } from '../data/laws';
import { enactLaw as engineEnactLaw } from '../engine/politics';
import { establishTradeRoute as engineEstablishRoute, availableTradeRoutes, routeYieldEstimate } from '../engine/economy';

// P0: 动态玩家 ID（支持世界剧本任意选国）
function pid(s: GameState): string { return s.playerNationId || PLAYER_ID; }

function markSinglePlayer(state: GameState, id: string): void {
  state.playerNationId = id;
  for (const n of Object.values(state.nations)) n.isPlayer = n.id === id;
}

// P1 行动点闭环：玩家行动消耗 adminPt 的统一辅助
// 返回 true=可执行（已扣 adminPt），false=行动点不足
const ACTION_COST: Record<string, number> = {
  build: 1, recruit: 1, research: 1, appease: 1,
  enactPolicy: 2, enactLaw: 2, establishTradeRoute: 1,
  embargoTradeRoute: 1, developProvince: 1, upgradeBuilding: 1,
  improveRelation: 1, espionage: 2, dynasticMarriage: 2, culturalExport: 1,
  moveArmy: 1, makePeace: 1,
};
// P1fix: spendAP 延迟扣款——先校验，返回 commit 函数；校验失败返回 null
// 调用方在校验全部通过后才调用 commit()，避免中间态扣 adminPt 后操作失败无法回滚
function spendAP(player: Nation, action: string): (() => void) | null {
  const cost = ACTION_COST[action] ?? 1;
  if (player.resources.adminPt < cost) return null;
  return () => { player.resources.adminPt -= cost; };
}

// 前置科技检查 helper
function hasTechLevel(nation: Nation, techId: string): boolean {
  if (techId === 'admin_lv3') return nation.tech.admin >= 3;
  if (techId === 'admin_lv2') return nation.tech.admin >= 2;
  if (techId === 'agri_lv2') return nation.tech.agri >= 2;
  if (techId === 'agri_lv3') return nation.tech.agri >= 3;
  return true;
}

// 剧本定义
export type ScenarioId = 'classic' | 'world' | 'eastasia' | 'w3_eastasia' | 'w5_mediterranean' | 'w6_americas' | 'w7_random' | 'w4_europe' | 'w8_indianocean' | 'challenge_survival';
export interface ScenarioDef {
  id: ScenarioId;
  name: string;
  subtitle: string;
  description: string;
  nationCount: string;
  // 哪个剧本需要开场选国
  needsNationPick: boolean;
  // 候选玩家国（世界版给几个 S/A 级可选）
  playableNations?: { id: string; name: string; tier: string; desc: string }[];
  // C4: 区域筛选（只生成指定洲的国家/省份）
  regionFilter?: string[];
}

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'classic', name: '地中海黎明', subtitle: '5 国 · 50 省',
    description: '罗马、迦太基、叙拉古、潘诺尼亚、蛮族。经典 MVP 剧本，节奏快，适合熟悉系统。',
    nationCount: '5 国', needsNationPick: false,
  },
  {
    id: 'world', name: '万邦纪元', subtitle: '205 国 · 577 省',
    description: '横跨十二洲的完整世界。罗马、波斯、汉、秦、孔雀、印加、阿兹特克、匈奴…你将主宰青铜时代的全球秩序。',
    nationCount: '205 国', needsNationPick: true,
    playableNations: [
      { id: 'n_me_persia', name: '波斯帝国', tier: 'S', desc: '东方霸主，高压帝国，军力最强' },
      { id: 'n_ea_qin', name: '秦帝国', tier: 'S', desc: '中央集权，行政高效，扩张强劲' },
      { id: 'n_med_rome', name: '罗马', tier: 'A', desc: '平衡之国，政体稳定，潜力巨大' },
      { id: 'n_med_carthage', name: '迦太基', tier: 'A', desc: '商业共和，富甲一方，海军称雄' },
      { id: 'n_ea_han', name: '汉', tier: 'A', desc: '东方大国，人口众多，治术成熟' },
      { id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', desc: '南亚霸主，福利倾向，民心稳固' },
      { id: 'n_am_inca', name: '印加', tier: 'A', desc: '安第斯帝国，集权统治，地理险要' },
      { id: 'n_we_frank', name: '法兰克', tier: 'A', desc: '欧洲新贵，封建骑士，军事传统' },
    ],
  },
  {
    id: 'eastasia', name: '东方破晓', subtitle: '东亚剧本',
    description: '秦、汉、匈奴、孔雀、室利佛逝…东方文明的角逐。适合体验中央集权与游牧冲突。',
    nationCount: '待生成', needsNationPick: true,
    playableNations: [
      { id: 'n_ea_qin', name: '秦帝国', tier: 'S', desc: '中央集权，行政高效' },
      { id: 'n_ea_han', name: '汉', tier: 'A', desc: '东方大国，人口众多' },
      { id: 'n_ca_xiongnu', name: '匈奴汗国', tier: 'B', desc: '游牧军事，机动劫掠' },
      { id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', desc: '南亚霸主，福利倾向' },
    ],
    regionFilter: ['asia_east', 'asia_central', 'asia_south'],
  },
  // C4: 新增三个区域剧本
  {
    id: 'w3_eastasia', name: '东亚风云', subtitle: 'W3 · 东亚 3 洲',
    description: '东亚、中亚、南亚三洲角逐。秦汉匈奴孔雀同台，体验东方文明的合纵连横。',
    nationCount: '~50 国', needsNationPick: true,
    playableNations: [
      { id: 'n_ea_qin', name: '秦帝国', tier: 'S', desc: '中央集权，行政高效，扩张强劲' },
      { id: 'n_ea_han', name: '汉', tier: 'A', desc: '东方大国，人口众多，治术成熟' },
      { id: 'n_ca_xiongnu', name: '匈奴汗国', tier: 'B', desc: '游牧军事，机动劫掠' },
      { id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', desc: '南亚霸主，福利倾向，民心稳固' },
    ],
    regionFilter: ['asia_east', 'asia_central', 'asia_south'],
  },
  {
    id: 'w5_mediterranean', name: '地中海争霸', subtitle: 'W5 · 地中海 4 洲',
    description: '地中海、西欧、中东、北非四洲争霸。罗马迦太基波斯同台，古典时代的全面冲突。',
    nationCount: '~70 国', needsNationPick: true,
    playableNations: [
      { id: 'n_med_rome', name: '罗马', tier: 'A', desc: '平衡之国，政体稳定，潜力巨大' },
      { id: 'n_med_carthage', name: '迦太基', tier: 'A', desc: '商业共和，富甲一方，海军称雄' },
      { id: 'n_me_persia', name: '波斯帝国', tier: 'S', desc: '东方霸主，高压帝国，军力最强' },
      { id: 'n_na_carthage', name: '努米底亚', tier: 'B', desc: '北非骑兵，机动灵活' },
    ],
    regionFilter: ['mediterranean', 'europe_w', 'middle_east', 'africa_n'],
  },
  {
    id: 'w6_americas', name: '新大陆崛起', subtitle: 'W6 · 美洲 1 洲',
    description: '美洲一洲角逐。印加阿兹特克玛雅同台，新大陆文明的独立发展线。',
    nationCount: '~20 国', needsNationPick: true,
    playableNations: [
      { id: 'n_am_inca', name: '印加', tier: 'A', desc: '安第斯帝国，集权统治，地理险要' },
      { id: 'n_am_aztec', name: '阿兹特克', tier: 'A', desc: '中美霸主，军事传统，祭祀文化' },
      { id: 'n_am_maya', name: '玛雅', tier: 'B', desc: '城邦联盟，天文发达，分裂内斗' },
    ],
    regionFilter: ['americas'],
  },
  // P3 随机大陆——seed 驱动随机选区域，每次开局不同
  {
    id: 'w7_random', name: '随机大陆', subtitle: 'W7 · 随机洲',
    description: '随机抽取一洲开局，每次不同。考验适应力，适合老手。',
    nationCount: '~20-40 国', needsNationPick: false,
    // regionFilter 运行时随机选定（startScenario 中处理）
  },
  // ── D5 扩充：+3 剧本到 10 ──
  {
    id: 'w4_europe', name: '欧洲封建', subtitle: 'W4 · 欧洲 4 洲',
    description: '西欧、东欧、北欧、地中海四洲角逐。法兰克、罗马、基辅罗斯同台，中世纪封建的骑士与教权之争。',
    nationCount: '~60 国', needsNationPick: true,
    playableNations: [
      { id: 'n_we_frank', name: '法兰克', tier: 'A', desc: '欧洲新贵，封建骑士，军事传统' },
      { id: 'n_med_rome', name: '罗马', tier: 'A', desc: '古典遗绪，政体稳定，潜力巨大' },
      { id: 'n_ee_kievan', name: '基辅罗斯', tier: 'B', desc: '东欧新星，正教立国，商业兴起' },
      { id: 'n_med_carthage', name: '迦太基', tier: 'A', desc: '商业共和，富甲一方，海军称雄' },
    ],
    regionFilter: ['europe_w', 'europe_e', 'europe_n', 'mediterranean'],
  },
  {
    id: 'w8_indianocean', name: '印度洋贸易', subtitle: 'W8 · 印度洋 3 洲',
    description: '南亚、东非、中东三洲围绕印度洋的贸易争霸。孔雀、室利佛逝、埃及同台，海贸与港口决定国运。',
    nationCount: '~55 国', needsNationPick: true,
    playableNations: [
      { id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', desc: '南亚霸主，福利倾向，民心稳固' },
      { id: 'n_sea_srivijaya', name: '室利佛逝', tier: 'B', desc: '海贸城邦，商业灵活' },
      { id: 'n_na_egypt', name: '埃及王国', tier: 'A', desc: '尼罗河粮仓，古老王权' },
    ],
    regionFilter: ['asia_south', 'africa_e', 'middle_east'],
  },
  {
    id: 'challenge_survival', name: '帝国黄昏', subtitle: '挑战 · 高压生存',
    description: '资源匮乏、叛乱高发、外交孤立。适合熟悉系统后的高难挑战。',
    nationCount: '挑战', needsNationPick: false,
  },
];

interface GameStore {
  state: GameState;
  log: string[];
  justProcessedTurn: boolean;
