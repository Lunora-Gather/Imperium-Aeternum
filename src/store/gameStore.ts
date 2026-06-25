// Imperium Aeternum — Zustand 全局状态
// 阶段 5a

import { create } from 'zustand';
import type { GameState, TurnReport, Nation } from '../types/game';
import { createInitialState, createWorldState, getRelationObj } from '../engine/init';
import { espionage as engineEspionage, dynasticMarriage as engineMarriage, culturalExport as engineCulturalExport } from '../engine/diplomacy';
import { moveArmy as engineMoveArmy, makePeace as engineMakePeace } from '../engine/military';
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
    description: '南亚、东非、中东三洲围绕印度洋的贸易争霸。孔雀、室利佛逝、埃及同台，海洋贸易国的黄金时代。',
    nationCount: '~40 国', needsNationPick: true,
    playableNations: [
      { id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', desc: '南亚霸主，福利倾向，民心稳固' },
      { id: 'n_oc_srivijaya', name: '室利佛逝', tier: 'B', desc: '海贸城邦，商团特许，贸易辐射' },
      { id: 'n_na_egypt', name: '埃及', tier: 'B', desc: '尼罗河粮仓，神权立国，古老文明' },
      { id: 'n_me_persia', name: '波斯帝国', tier: 'S', desc: '东方霸主，高压帝国，军力最强' },
    ],
    regionFilter: ['asia_south', 'africa_n', 'middle_east', 'oceania'],
  },
  {
    id: 'challenge_survival', name: '生存挑战', subtitle: '硬核 · 弱国求生',
    description: '执掌一个 D 级城邦，资源匮乏，强敌环伺。能否在 200 年内崛起为帝国？硬核玩家专属。',
    nationCount: '205 国', needsNationPick: true,
    playableNations: [
      { id: 'n_ee_kievan', name: '基辅罗斯', tier: 'B', desc: '边缘崛起，正教立国' },
      { id: 'n_oc_srivijaya', name: '室利佛逝', tier: 'B', desc: '海贸求生，商团立国' },
      { id: 'n_na_egypt', name: '埃及', tier: 'B', desc: '古老文明，神权维稳' },
      { id: 'n_am_maya', name: '玛雅', tier: 'B', desc: '城邦联盟，天文发达，分裂内斗' },
    ],
    // 无 regionFilter = 全世界，玩家选 B 级边缘国对抗 S/A 级霸主
  },
];

interface GameStore {
  state: GameState;
  log: string[];
  justProcessedTurn: boolean;  // E11: 回合结算完成标志，App 监听后切年报 tab
  // 是否在开场（剧本选择）
  scene: 'menu' | 'playing';
  // P0: 年报页"继续"按钮返回的 tab（App 在结算前写入）
  returnTab: string | null;
  setReturnTab: (t: string | null) => void;
  // P2: 跨页跳转选中省份（地图点击/骚动徽章 → 省份页选中该省）
  pendingProvinceId: string | null;
  setPendingProvince: (id: string | null) => void;
  // P2: 跨页跳转目标 tab（地图/徽章点击 → 切到省份页）
  pendingTab: string | null;
  jumpToTab: (tab: string) => void;
  consumePendingTab: () => void;
  // 开始剧本（classic 直接开；world/eastasia 需先选国再调 startWithNation）
  startScenario: (id: ScenarioId) => void;
  // 选定玩家国后正式开始（世界剧本）
  startWithNation: (nationId: string) => void;
  // 回开场菜单
  backToMenu: () => void;
  // 兼容旧接口
  newGame: () => void;
  load: () => boolean;
  save: () => void;
  clearSave: () => void;
  hasSave: () => boolean;
  // B3: 多槽位
  saveToSlot: (slot: number) => void;
  loadFromSlot: (slot: number) => boolean;
  deleteSlotSave: (slot: number) => void;
  nextTurn: () => TurnReport | null;
  clearTurnFlag: () => void;
  setTaxRate: (rate: number) => void;
  appeaseFaction: (factionId: string) => boolean;
  build: (provinceId: string, buildingDefId: string) => boolean;
  recruit: (provinceId: string, count: number) => boolean;
  research: (techId: string) => boolean;
  improveRelation: (target: string) => boolean;
  espionage: (target: string, kind: 'steal_tech' | 'foment_rebellion' | 'spy_military') => boolean;  // E17: 间谍
  dynasticMarriage: (target: string) => boolean;   // E17: 联姻
  culturalExport: (target: string) => boolean;     // E17: 文化输出
  enactPolicy: (policyId: PolicyId) => boolean;
  enactLaw: (lawId: string) => boolean;
  establishTradeRoute: (routeId: string) => boolean;
  embargoTradeRoute: (routeId: string) => boolean;   // E16: 贸易禁运
  developProvince: (provinceId: string, kind: 'reclaim' | 'garrison_deploy' | 'garrison_recall') => boolean;  // E16: 省份开发/军队调动
  moveArmy: (armyId: string, toProvinceId: string) => boolean;   // E21: 战略军队调动
  makePeace: (warId: string) => boolean;                          // E21: 主动求和
  upgradeBuilding: (provinceId: string, buildingInstanceId: string) => boolean;
  // B4: 建筑拆除——返还 30% 金，清除实例
  demolishBuilding: (provinceId: string, buildingInstanceId: string) => boolean;
  // A2: 内战操作——镇压（耗军队+金，胜则收复省+稳定-10）/谈判（割1省+合法性-15+稳定+15）
  suppressRebellion: () => boolean;
  negotiateRebellion: () => boolean;
  logMsg: (msg: string) => void;
}

// 当前待开始的剧本（菜单选完后存这里，等国选完再正式生成）
let pendingScenario: ScenarioId | null = null;
let pendingSeed = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  log: [],
  justProcessedTurn: false,
  scene: 'menu',
  returnTab: null,
  setReturnTab: (t) => set({ returnTab: t }),
  pendingProvinceId: null,
  setPendingProvince: (id) => set({ pendingProvinceId: id }),
  pendingTab: null,
  jumpToTab: (tab) => set({ pendingTab: tab }),
  consumePendingTab: () => set({ pendingTab: null }),

  startScenario: (id) => {
    pendingScenario = id;
    pendingSeed = Math.floor(Math.random() * 1e9);
    if (id === 'classic') {
      // 直接开 5 国版
      const state = createInitialState();
      set({ state, log: ['新游戏开始：地中海黎明 · 第 1 年'], scene: 'playing' });
    } else if (id === 'w7_random') {
      // P3 随机大陆——seed 驱动随机选区域 + 随机选国，直接开局
      const allRegions = ['asia_east', 'asia_central', 'asia_south', 'mediterranean', 'europe_w', 'middle_east', 'africa_n', 'americas'];
      const rng = pendingSeed;
      const region = allRegions[rng % allRegions.length];
      const state = createWorldState(pendingSeed, undefined, [region]);
      // 随机选一个 S/A 级国作为玩家
      const candidates = Object.values(state.nations).filter((n) => n.tier === 'S' || n.tier === 'A');
      const player = candidates.length > 0 ? candidates[rng % candidates.length] : Object.values(state.nations)[0];
      if (player) {
        player.isPlayer = true;
        state.playerNationId = player.id;
      }
      const regionName = { asia_east: '东亚', asia_central: '中亚', asia_south: '南亚', mediterranean: '地中海', europe_w: '西欧', middle_east: '中东', africa_n: '北非', americas: '美洲' }[region] ?? region;
      set({ state, log: [`新游戏开始：随机大陆 · ${regionName} · 你执掌 ${player?.name ?? '未知'} · 第 1 年`], scene: 'playing' });
      pendingScenario = null;
    } else {
      // world / eastasia：切到选国界面（scene 仍为 menu，但 pendingScenario 已设）
      set({ log: [`已选剧本：${SCENARIOS.find((s) => s.id === id)?.name}，请选择你的邦国`] });
    }
  },

  startWithNation: (nationId) => {
    if (!pendingScenario) return;
    const scenario = SCENARIOS.find((s) => s.id === pendingScenario);
    const state = createWorldState(pendingSeed, nationId, scenario?.regionFilter);
    const player = state.nations[nationId];
    set({
      state,
      log: [`新游戏开始：${SCENARIOS.find((s) => s.id === pendingScenario)?.name} · 你执掌 ${player?.name ?? '未知'} · 第 1 年`],
      scene: 'playing',
    });
    pendingScenario = null;
  },

  backToMenu: () => { set({ scene: 'menu', log: [] }); },

  newGame: () => { get().startScenario('classic'); },

  load: () => {
    const s = loadGame();
    if (s) {
      // E9: 存档加载后重建 transient 关系索引（不序列化）
      s._relMap = undefined;
      set({ state: s, log: ['读档成功'], scene: 'playing' });
      return true;
    }
    return false;
  },

  save: () => {
    const r = saveGame(get().state);
    if (r.ok && r.sizeKB) {
      get().logMsg(r.sizeKB > 3000 ? `已存档（${r.sizeKB}KB，容量告警）` : `已存档（${r.sizeKB}KB）`);
    } else if (r.error) {
      get().logMsg(r.error);
    }
  },

  clearSave: () => { deleteSave(); get().logMsg('已删档'); },
  hasSave: () => hasSave(),

  // B3: 多槽位实现
  saveToSlot: (slot) => {
    const r = saveGameToSlot(get().state, slot);
    if (r.ok && r.sizeKB) {
      get().logMsg(slot === 0 ? `自动存档（${r.sizeKB}KB）` : `已存档到槽位 ${slot}（${r.sizeKB}KB）`);
    } else if (r.error) {
      get().logMsg(r.error);
    }
  },
  loadFromSlot: (slot) => {
    const s = loadGameFromSlot(slot);
    if (s) {
      s._relMap = undefined;
      set({ state: s, scene: 'playing', log: [] });
      get().logMsg(`已读取槽位 ${slot} 存档`);
      return true;
    }
    get().logMsg('读档失败：存档不存在或损坏');
    return false;
  },
  deleteSlotSave: (slot) => { deleteSlot(slot); get().logMsg(`已删除槽位 ${slot} 存档`); },

  nextTurn: () => {
    const cur = get().state;
    if (cur.victory.type) return null;
    const { state: next, report } = processTurn(cur);
    set({ state: next, justProcessedTurn: true });
    if (report.warnings.length) get().logMsg(report.warnings.join('; '));
    get().logMsg(`进入第 ${next.turn + 1} 年`);
    // B3: 每 10 回合自动存档到槽位 0
    if (next.turn > 0 && next.turn % 10 === 0) {
      autoSave(next);
    }
    return report;
  },

  clearTurnFlag: () => set({ justProcessedTurn: false }),

  setTaxRate: (rate) => {
    const r = Math.max(0, Math.min(0.5, rate));
    set((s) => {
      const id = pid(s.state);
      return { state: { ...s.state, nations: { ...s.state.nations, [id]: { ...s.state.nations[id], taxRate: r } } } };
    });
    get().logMsg(`税率调整为 ${Math.round(r * 100)}%`);
  },

  appeaseFaction: (factionId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'appease');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    if (player.resources.gold < 30) { get().logMsg('金不足，无法安抚'); return false; }
    const faction = player.factions.find((f) => f.id === factionId);
    if (!faction) return false;
    faction.satisfaction = Math.min(100, faction.satisfaction + 8);
    player.resources.gold -= 30;
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`安抚了 ${factionId}（耗 1 行动点）`);
    return true;
  },

  build: (provinceId, buildingDefId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const prov = s.provinces[provinceId];
    if (!prov || prov.ownerId !== pid(s)) { get().logMsg('省份不属于玩家'); return false; }
    const commit = spendAP(player, 'build');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    // 接 BUILDINGS 表真实成本（修：原写死 80）
    const def = BUILDINGS[buildingDefId as BuildingId];
    if (!def) { get().logMsg('建筑不存在'); return false; }
    if (player.resources.gold < def.costGold) { get().logMsg(`金不足（需 ${def.costGold}）`); return false; }
    if ((player.resources.wood ?? 0) < def.costWood) { get().logMsg(`木不足（需 ${def.costWood}）`); return false; }
    if ((player.resources.iron ?? 0) < def.costIron) { get().logMsg(`铁不足（需 ${def.costIron}）`); return false; }
    // 上限检查
    const existing = prov.buildings.filter((b) => b.defId === buildingDefId).length;
    if (def.maxPerProvince > 0 && existing >= def.maxPerProvince) { get().logMsg('已达建造上限'); return false; }
    // 前置科技
    if (def.prereqTech && !hasTechLevel(player, def.prereqTech)) { get().logMsg('缺少前置科技'); return false; }
    player.resources.gold -= def.costGold;
    player.resources.wood -= def.costWood;
    player.resources.iron -= def.costIron;
    prov.buildings.push({ id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, defId: buildingDefId as never, provinceId, level: 1 });
    commit();
    // 国家性格累积
    const actionMap: Record<string, string> = { farm: 'build_farm', market: 'build_market', road: 'build_road', barracks: 'build_barracks' };
    const actId = actionMap[buildingDefId] ?? 'build_farm';
    recordPlayerAction(s, actId);
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`在 ${prov.name} 建造了 ${def.name}（耗 1 行动点）`);
    return true;
  },

  recruit: (provinceId, count) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const prov = s.provinces[provinceId];
    if (!prov || prov.ownerId !== pid(s)) return false;
    const commit = spendAP(player, 'recruit');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const goldCost = count * 1.5;
    const supplyCost = count * 0.2;
    if (player.resources.gold < goldCost || player.resources.supply < supplyCost) {
      get().logMsg('资源不足以征兵'); return false;
    }
    if (prov.population < count) { get().logMsg('人口不足'); return false; }
    prov.population -= count;
    player.resources.gold -= goldCost;
    player.resources.supply -= supplyCost;
    commit();
    // 兵加到首都军队
    let army = player.army.find((a) => a.location === player.capital);
    if (!army) {
      army = { id: `army_${Date.now()}`, ownerId: pid(s), location: player.capital, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
      player.army.push(army);
    }
    army.size += count;
    recordPlayerAction(s, 'conscription');
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`征兵 ${count} 人`);
    return true;
  },

  research: (techId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'research');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    // 接 TECHNOLOGIES 表真实成本（修：原占位扣 100）
    const def = TECHNOLOGIES.find((t) => t.id === techId);
    if (!def) { get().logMsg('科技不存在'); return false; }
    if (player.resources.sciPt < def.costSci) { get().logMsg(`科研点不足（需 ${def.costSci}）`); return false; }
    if (player.resources.gold < def.costGold) { get().logMsg(`金不足（需 ${def.costGold}）`); return false; }
    player.resources.sciPt -= def.costSci;
    player.resources.gold -= def.costGold;
    commit();
    // 直接升级对应路线等级
    if (def.branch === 'agri') player.tech.agri = Math.max(player.tech.agri, def.level);
    else if (def.branch === 'mil') player.tech.mil = Math.max(player.tech.mil, def.level);
    else if (def.branch === 'admin') player.tech.admin = Math.max(player.tech.admin, def.level);
    else if (def.branch === 'culture') player.tech.culture = Math.max(player.tech.culture, def.level);
    get().logMsg(`研发完成：${def.name}（Lv${def.level}，耗 1 行动点）`);
    recordPlayerAction(s, 'research_tech');
    set((st) => ({ state: { ...st.state } }));
    return true;
  },

  improveRelation: (target) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'improveRelation');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    if (player.resources.influence < 20) { get().logMsg('外交影响力不足'); return false; }
    player.resources.influence -= 20;
    commit();
    // E9: 用关系索引替代 .find
    const rel = getRelationObj(pid(s), target, s);
    if (rel) rel.relation = Math.min(100, rel.relation + 5);
    recordPlayerAction(s, 'appease_populace');
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`改善了与 ${target} 的关系（耗 1 行动点）`);
    return true;
  },

  // E17: 间谍活动——窃科技/煽叛乱/刺探军情
  espionage: (target, kind) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'espionage');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const r = engineEspionage(player, target, s, kind);
    if (!r.ok && !r.result) { get().logMsg(`间谍失败：${r.reason}`); return false; }
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(r.result ?? r.reason ?? '间谍行动（耗 2 行动点）');
    return r.ok;
  },

  // E17: 联姻——血脉同盟
  dynasticMarriage: (target) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'dynasticMarriage');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const r = engineMarriage(player, target, s);
    if (!r.ok) { get().logMsg(`联姻失败：${r.reason}`); return false; }
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(r.result ?? '联姻成功（耗 2 行动点）');
    return true;
  },

  // E17: 文化输出——科研点换影响力+关系
  culturalExport: (target) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'culturalExport');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const r = engineCulturalExport(player, target, s);
    if (!r.ok) { get().logMsg(`文化输出失败：${r.reason}`); return false; }
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(r.result ?? '文化输出成功（耗 1 行动点）');
    return true;
  },

  enactPolicy: (policyId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'enactPolicy');
    if (!commit) { get().logMsg('行动点不足（需 2）'); return false; }
    const def = POLICY_BY_ID[policyId];
    if (!def) { get().logMsg('政策不存在'); return false; }
    if (player.activePolicies.some((p) => p.policyId === policyId)) { get().logMsg('已推行'); return false; }
    if (def.allowedGovernments.length > 0 && !def.allowedGovernments.includes(player.government.type)) { get().logMsg('政体不允许'); return false; }
    if (def.prereqTech && !hasTechLevel(player, def.prereqTech)) { get().logMsg('缺少前置科技'); return false; }
    if (player.resources.gold < def.costGold) { get().logMsg('金不足'); return false; }
    player.resources.gold -= def.costGold;
    commit();
    player.activePolicies.push({ policyId, enactedTurn: s.turn });
    // 应用 effects
    const e = def.effects;
    if (e.taxRateMod) player.taxRate = Math.max(0, Math.min(0.5, player.taxRate + e.taxRateMod));
    if (e.corruptionMod) player.government.corruption = Math.max(0, Math.min(100, player.government.corruption + e.corruptionMod));
    if (e.stabilityMod) player.government.stability = Math.max(0, Math.min(100, player.government.stability + e.stabilityMod));
    if (e.efficiencyMod) player.government.efficiency = Math.max(0, Math.min(100, player.government.efficiency + e.efficiencyMod));
    if (e.influenceMod) player.resources.influence += Math.round(e.influenceMod);
    // P-fix: combatMod/assimilationMod/popGrowthMod/mobilizationMod/taxEffMod/influenceMod(倍率)写入 policyMods，引擎读取
    // 原先这些倍率类 effects 被静默忽略，军事改革/均田令/教育改革等政策形同虚设
    if (e.combatMod || e.assimilationMod || e.popGrowthMod || e.mobilizationMod || e.taxEffMod || e.influenceMod) {
      if (!player.policyMods) player.policyMods = {};
      if (e.combatMod) player.policyMods.combatMod = (player.policyMods.combatMod ?? 1) * e.combatMod;
      if (e.assimilationMod) player.policyMods.assimilationMod = (player.policyMods.assimilationMod ?? 0) + e.assimilationMod;
      if (e.popGrowthMod) player.policyMods.popGrowthMod = (player.policyMods.popGrowthMod ?? 1) * e.popGrowthMod;
      if (e.mobilizationMod) player.policyMods.mobilizationMod = (player.policyMods.mobilizationMod ?? 1) * e.mobilizationMod;
      if (e.taxEffMod) player.policyMods.taxEffMod = (player.policyMods.taxEffMod ?? 1) * e.taxEffMod;
      if (e.influenceMod && e.influenceMod >= 1) player.policyMods.influenceMod = (player.policyMods.influenceMod ?? 1) * e.influenceMod;
    }
    // 派系反应
    const fr = def.factionReaction;
    for (const f of player.factions) {
      const delta = fr[f.id as keyof typeof fr];
      if (delta) f.satisfaction = Math.max(0, Math.min(100, f.satisfaction + delta));
    }
    recordPlayerAction(s, 'radical_reform');
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`推行政策：${def.name}（耗 2 行动点）`);
    return true;
  },

  enactLaw: (lawId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'enactLaw');
    if (!commit) { get().logMsg('行动点不足（需 2）'); return false; }
    const def = LAWS.find((l) => l.id === lawId);
    if (!def) { get().logMsg('法律不存在'); return false; }
    const r = engineEnactLaw(player, lawId, s);
    if (!r.ok) { get().logMsg(`推行失败：${r.reason}`); return false; }
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`推行法律：${def.name}（耗 2 行动点）`);
    return true;
  },

  establishTradeRoute: (routeId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'establishTradeRoute');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const r = engineEstablishRoute(player, routeId, s);
    if (!r.ok) { get().logMsg(`建立失败：${r.reason}`); return false; }
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`建立贸易路线：${r.routeName}（耗 1 行动点）`);
    return true;
  },

  // E16: 贸易禁运——停止某条已建立路线的收益（外交筹码/节省粮道）
  embargoTradeRoute: (routeId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'embargoTradeRoute');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    if (!player.activeTradeRoutes.some((r) => r.routeId === routeId)) { get().logMsg('未建立该路线'); return false; }
    if (!player.embargoedRoutes) player.embargoedRoutes = [];
    if (player.embargoedRoutes.includes(routeId)) {
      // 解除禁运
      player.embargoedRoutes = player.embargoedRoutes.filter((r) => r !== routeId);
      get().logMsg(`解除禁运：${routeId}`);
    } else {
      player.embargoedRoutes.push(routeId);
      get().logMsg(`禁运路线：${routeId}（耗 1 行动点）`);
    }
    commit();
    set((st) => ({ state: { ...st.state } }));
    return true;
  },

  // E16: 省份开发——开垦（增产+耗金）/ 驻军部署（首都军队→省）/ 驻军召回（省→首都）
  developProvince: (provinceId, kind) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const prov = s.provinces[provinceId];
    if (!prov || prov.ownerId !== pid(s)) { get().logMsg('省份不属于玩家'); return false; }
    const commit = spendAP(player, 'developProvince');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    if (kind === 'reclaim') {
      // 开垦：耗 60 金，永久 +2 agriBase（每省 agriBase 上限 12）
      if (prov.agriBase >= 12) { get().logMsg('已开垦至极限'); return false; }
      if (player.resources.gold < 60) { get().logMsg('金不足（需 60）'); return false; }
      player.resources.gold -= 60;
      prov.agriBase = Math.min(12, prov.agriBase + 2);
      recordPlayerAction(s, 'build_farm');
      get().logMsg(`${prov.name} 开垦完成，农业基础 +2（耗 1 行动点）`);
    } else if (kind === 'garrison_deploy') {
      // 部署：从首都军队调 50 兵到省份驻军
      const capitalArmy = player.army.find((a) => a.location === player.capital);
      if (!capitalArmy || capitalArmy.size < 50) { get().logMsg('首都军队不足 50'); return false; }
      capitalArmy.size -= 50;
      prov.garrison += 50;
      get().logMsg(`${prov.name} 部署驻军 50（耗 1 行动点）`);
    } else if (kind === 'garrison_recall') {
      // 召回：省份驻军 50 回首都军队
      if (prov.garrison < 50) { get().logMsg('省份驻军不足 50'); return false; }
      prov.garrison -= 50;
      let capitalArmy = player.army.find((a) => a.location === player.capital);
      if (!capitalArmy) {
        capitalArmy = { id: `army_${Date.now()}`, ownerId: pid(s), location: player.capital, size: 0, morale: 60, training: 50, equipment: 50, supply: 80 };
        player.army.push(capitalArmy);
      }
      capitalArmy.size += 50;
      get().logMsg(`${prov.name} 召回驻军 50（耗 1 行动点）`);
    }
    commit();
    set((st) => ({ state: { ...st.state } }));
    return true;
  },

  // E21: 战略军队调动——省间移动（耗金、需己省/相邻己省/首都枢纽、合并同省军队）
  moveArmy: (armyId, toProvinceId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'moveArmy');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const army = player.army.find((a) => a.id === armyId);
    if (!army) { get().logMsg('军队不存在'); return false; }
    const fromProv = s.provinces[army.location];
    const toProv = s.provinces[toProvinceId];
    if (!fromProv || !toProv) { get().logMsg('省份不存在'); return false; }
    const r = engineMoveArmy(player, armyId, toProvinceId, fromProv, toProv);
    if (!r.ok) { get().logMsg(`调动失败：${r.reason}`); return false; }
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`${fromProv.name} 军队 ${army.size} 人调至 ${toProv.name}（耗 1 行动点）`);
    return true;
  },

  // E21: 主动求和——玩家结束某场自己参与的战争（设停战 10 年、关系略回升）
  makePeace: (warId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'makePeace');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const war = s.wars.find((w) => w.id === warId);
    if (!war) { get().logMsg('战争不存在'); return false; }
    if (war.attackerId !== pid(s) && war.defenderId !== pid(s)) { get().logMsg('非玩家战争'); return false; }
    const enemyId = war.attackerId === pid(s) ? war.defenderId : war.attackerId;
    const enemy = s.nations[enemyId];
    engineMakePeace(s, war);
    // 主动求和：关系略回升（投降姿态）、合法性微降（丧权）
    const rel = getRelationObj(pid(s), enemyId, s);
    if (rel) rel.relation = Math.min(100, rel.relation + 10);
    const p = s.nations[pid(s)];
    p.government.legitimacy = Math.max(0, p.government.legitimacy - 3);
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`与 ${enemy?.name ?? enemyId} 议和（停战 10 年，合法 -3，耗 1 行动点）`);
    return true;
  },

  upgradeBuilding: (provinceId, buildingInstanceId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const commit = spendAP(player, 'upgradeBuilding');
    if (!commit) { get().logMsg('行动点不足'); return false; }
    const prov = s.provinces[provinceId];
    if (!prov || prov.ownerId !== pid(s)) return false;
    const inst = prov.buildings.find((b) => b.id === buildingInstanceId);
    if (!inst) return false;
    const def = BUILDINGS[inst.defId as BuildingId];
    if (!def) return false;
    if (inst.level >= 3) { get().logMsg('已达最高等级'); return false; }
    const cost = Math.round(def.costGold * 0.6 * inst.level);
    if (player.resources.gold < cost) { get().logMsg(`金不足（需 ${cost}）`); return false; }
    player.resources.gold -= cost;
    inst.level += 1;
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`${prov.name} 的 ${def.name} 升至 Lv${inst.level}（耗 1 行动点）`);
    return true;
  },

  logMsg: (msg) => set((s) => ({ log: [...s.log.slice(-30), msg] })),

  // B4: 建筑拆除——返还 30% 金，清除实例
  demolishBuilding: (provinceId, buildingInstanceId) => {
    const s = get().state;
    const player = s.nations[pid(s)];
    const prov = s.provinces[provinceId];
    if (!prov || prov.ownerId !== pid(s)) return false;
    const inst = prov.buildings.find((b) => b.id === buildingInstanceId);
    if (!inst) return false;
    const def = BUILDINGS[inst.defId as BuildingId];
    if (!def) return false;
    // 返还 30% 建造成本（按当前等级累计）
    const refund = Math.round(def.costGold * 0.3 * inst.level);
    prov.buildings = prov.buildings.filter((b) => b.id !== buildingInstanceId);
    player.resources.gold += refund;
    set((st) => ({ state: { ...st.state } }));
    get().logMsg(`拆除 ${prov.name} 的 ${def.name}，返还 ${refund} 金`);
    return true;
  },

  // A2: 镇压叛乱——耗军队+金，胜则收复所有叛军省+稳定-10，内战结束
  suppressRebellion: () => {
    const s = get().state;
    const player = s.nations[pid(s)];
    if (!player.civilWar?.active) { get().logMsg('未处于内战'); return false; }
    const commit = spendAP(player, 'enactPolicy');  // 耗 2 行动点
    if (!commit) { get().logMsg('行动点不足（需 2）'); return false; }
    const armySize = player.army.reduce((sum, a) => sum + a.size, 0);
    if (armySize < 200) { get().logMsg('军队不足（需 200）'); return false; }
    if (player.resources.gold < 150) { get().logMsg('金不足（需 150）'); return false; }
    player.resources.gold -= 150;
    // 收复所有叛军省
    const rebelIds = player.civilWar.rebels;
    for (const rid of rebelIds) {
      for (const p of Object.values(s.provinces)) {
        if (p.ownerId === rid) {
          p.ownerId = pid(s);
          p.loyalty = 30;
          p.assimilation = 40;
          p.unrest = 50;
          p.rebellionRisk = 30;
          p.garrison = 0;
        }
      }
      delete s.nations[rid];
    }
    player.civilWar = { active: false, rebels: [] };
    player.government.stability = Math.max(0, player.government.stability - 10);
    addChronicle(s, { turn: s.turn, kind: 'milestone_rebellion', title: '内战平定（镇压）', desc: '玩家以武力镇压叛乱，收复失地，但国力受损。', actorId: pid(s) });
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg('镇压叛乱成功，收复失地（耗 2 行动点 + 150 金 + 稳定-10）');
    return true;
  },

  // A2: 谈判——割 1 省给叛军+合法性-15+稳定+15，内战结束
  negotiateRebellion: () => {
    const s = get().state;
    const player = s.nations[pid(s)];
    if (!player.civilWar?.active) { get().logMsg('未处于内战'); return false; }
    const commit = spendAP(player, 'enactPolicy');  // 耗 2 行动点
    if (!commit) { get().logMsg('行动点不足（需 2）'); return false; }
    const rebelIds = player.civilWar.rebels;
    // 割第一块叛军省给叛军（承认独立），其余归顺
    const firstRebel = rebelIds[0];
    const cededProv = Object.values(s.provinces).find((p) => p.ownerId === firstRebel);
    if (cededProv) {
      // 叛军保留该省，叛军 Nation 转为正常国家（去 rebellionDecay/rebelOf）
      const rebelNation = s.nations[firstRebel];
      if (rebelNation) { rebelNation.rebellionDecay = undefined; rebelNation.rebelOf = undefined; rebelNation.name = cededProv.name + '政权'; }
    }
    // 其余叛军省归顺
    for (const rid of rebelIds.slice(1)) {
      for (const p of Object.values(s.provinces)) {
        if (p.ownerId === rid) {
          p.ownerId = pid(s);
          p.loyalty = 40;
          p.assimilation = 50;
          p.unrest = 30;
          p.rebellionRisk = 20;
        }
      }
      delete s.nations[rid];
    }
    player.civilWar = { active: false, rebels: [] };
    player.government.legitimacy = Math.max(0, player.government.legitimacy - 15);
    player.government.stability = Math.min(100, player.government.stability + 15);
    addChronicle(s, { turn: s.turn, kind: 'milestone_rebellion', title: '内战平定（谈判）', desc: '玩家让步，割地换取和平，合法性受损。', actorId: pid(s) });
    commit();
    set((st) => ({ state: { ...st.state } }));
    get().logMsg('谈判成功，割 1 省换和平（耗 2 行动点 + 合法性-15 + 稳定+15）');
    return true;
  },
}));

// C2: 精确订阅 selector hooks——screen 按需迁移，减少 set 触发的全订阅重渲染
// usePlayer 只在玩家国引用变化时重渲染（配合 store 操作深拷贝玩家国后生效）
export function usePlayer(): Nation {
  return useGameStore((s) => s.state.nations[s.state.playerNationId]);
}
// usePlayerId 只在 playerNationId 变化时重渲染（开场选国后稳定）
export function usePlayerId(): string {
  return useGameStore((s) => s.state.playerNationId);
}
// usePlayerResources 精确订阅玩家资源（操作后变化最频繁）
export function usePlayerResources() {
  return useGameStore((s) => s.state.nations[s.state.playerNationId]?.resources);
}
// useTurn 精确订阅回合数
export function useTurn(): number {
  return useGameStore((s) => s.state.turn);
}
