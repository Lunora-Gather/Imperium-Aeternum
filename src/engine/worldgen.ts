// Imperium Aeternum — 世界生成器（W2）
// DEC-011: 从区域模板 + 国家模板 seeded 生成 192 国 / 600 省
// S/A 级手写覆盖，B/C/D 级模板生成

import type { NationDef, NationTier } from '../data/nations';
import type { ProvinceDef, Terrain, Climate, Elevation, CultureId, ReligionId, ProvinceType } from '../data/provinces';
import type { GovernmentId } from '../data/governments';
import type { NationalCharacterId } from '../data/national-characters';
import { REGIONS, type RegionTemplate } from '../data/regions';
import { mulberry32 } from '../utils/random';

// ── 国家模板（5 级）──
interface NationTemplate {
  tier: NationTier;
  provinceCountRange: [number, number];
  initGoldRange: [number, number];
  initArmyRange: [number, number];
  initTech: { agri: number; mil: number; admin: number };
  governmentPool: GovernmentId[];
  characterPool: NationalCharacterId[];
}

const NATION_TEMPLATES: Record<NationTier, NationTemplate> = {
  S: { tier: 'S', provinceCountRange: [15, 25], initGoldRange: [1500, 2500], initArmyRange: [1200, 1800], initTech: { agri: 2, mil: 2, admin: 2 }, governmentPool: ['empire', 'monarchy'], characterPool: ['authoritarian', 'balanced'] },
  A: { tier: 'A', provinceCountRange: [6, 12], initGoldRange: [800, 1200], initArmyRange: [600, 1000], initTech: { agri: 2, mil: 1, admin: 2 }, governmentPool: ['empire', 'monarchy', 'republic'], characterPool: ['balanced', 'commerce', 'technocracy'] },
  B: { tier: 'B', provinceCountRange: [3, 6], initGoldRange: [400, 600], initArmyRange: [300, 500], initTech: { agri: 1, mil: 1, admin: 1 }, governmentPool: ['monarchy', 'republic', 'federation'], characterPool: ['balanced', 'commerce', 'technocracy', 'welfare'] },
  C: { tier: 'C', provinceCountRange: [2, 4], initGoldRange: [200, 300], initArmyRange: [150, 250], initTech: { agri: 1, mil: 1, admin: 1 }, governmentPool: ['monarchy', 'republic', 'tribe'], characterPool: ['balanced', 'feudal', 'commerce'] },
  D: { tier: 'D', provinceCountRange: [1, 2], initGoldRange: [100, 150], initArmyRange: [80, 120], initTech: { agri: 1, mil: 1, admin: 1 }, governmentPool: ['tribe', 'junta', 'theocracy'], characterPool: ['militarism', 'feudal', 'balanced'] },
};

// ── 手写 S/A 级关键国（16 国）──
// 这些国家有独特名字/性格/资源，生成器跳过
const KEY_NATIONS: Partial<NationDef>[] = [
  // 地中海
  { id: 'n_med_rome', name: '罗马', tier: 'A', government: 'monarchy', character: 'balanced', initGold: 300, initFood: 400, initArmy: { size: 200, morale: 60, training: 50, equipment: 40 } },
  { id: 'n_med_carthage', name: '迦太基', tier: 'A', government: 'republic', character: 'commerce', initGold: 500, initFood: 350, initArmy: { size: 150, morale: 50, training: 45, equipment: 50 } },
  { id: 'n_med_syracuse', name: '叙拉古', tier: 'B', government: 'republic', character: 'technocracy', initGold: 350, initFood: 300, initArmy: { size: 180, morale: 55, training: 55, equipment: 55 } },
  // 中东
  { id: 'n_me_persia', name: '波斯帝国', tier: 'S', government: 'empire', character: 'authoritarian', initGold: 2000, initFood: 500, initArmy: { size: 1500, morale: 60, training: 55, equipment: 55 } },
  { id: 'n_me_parthia', name: '帕提亚', tier: 'A', government: 'monarchy', character: 'militarism', initGold: 800, initFood: 300, initArmy: { size: 800, morale: 65, training: 50, equipment: 50 } },
  // 东亚
  { id: 'n_ea_qin', name: '秦帝国', tier: 'S', government: 'empire', character: 'authoritarian', initGold: 1800, initFood: 600, initArmy: { size: 1600, morale: 55, training: 60, equipment: 50 } },
  { id: 'n_ea_han', name: '汉', tier: 'A', government: 'monarchy', character: 'balanced', initGold: 1000, initFood: 500, initArmy: { size: 700, morale: 50, training: 50, equipment: 45 } },
  // 南亚
  { id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', government: 'empire', character: 'welfare', initGold: 900, initFood: 450, initArmy: { size: 650, morale: 50, training: 50, equipment: 45 } },
  // 北非
  { id: 'n_na_egypt', name: '埃及', tier: 'B', government: 'theocracy', character: 'religiosity', initGold: 400, initFood: 350, initArmy: { size: 300, morale: 50, training: 45, equipment: 40 } },
  // 美洲
  { id: 'n_am_inca', name: '印加帝国', tier: 'A', government: 'empire', character: 'authoritarian', initGold: 700, initFood: 400, initArmy: { size: 600, morale: 55, training: 40, equipment: 35 } },
  { id: 'n_am_aztec', name: '阿兹特克', tier: 'B', government: 'junta', character: 'militarism', initGold: 400, initFood: 300, initArmy: { size: 400, morale: 60, training: 45, equipment: 30 } },
  { id: 'n_am_maya', name: '玛雅', tier: 'B', government: 'theocracy', character: 'technocracy', initGold: 350, initFood: 280, initArmy: { size: 200, morale: 45, training: 40, equipment: 30 } },
  // 东欧
  { id: 'n_ee_kievan', name: '基辅罗斯', tier: 'B', government: 'monarchy', character: 'balanced', initGold: 400, initFood: 350, initArmy: { size: 350, morale: 50, training: 45, equipment: 40 } },
  // 中亚
  { id: 'n_ca_xiongnu', name: '匈奴汗国', tier: 'B', government: 'nomad_khanate', character: 'militarism', initGold: 300, initFood: 200, initArmy: { size: 500, morale: 65, training: 55, equipment: 35 } },
  // 西欧
  { id: 'n_we_frank', name: '法兰克', tier: 'A', government: 'monarchy', character: 'balanced', initGold: 800, initFood: 400, initArmy: { size: 600, morale: 50, training: 45, equipment: 45 } },
  // 大洋洲
  { id: 'n_oc_srivijaya', name: '室利佛逝', tier: 'B', government: 'merchant_republic', character: 'commerce', initGold: 450, initFood: 300, initArmy: { size: 250, morale: 45, training: 40, equipment: 35 } },
];

// ── 世界生成主函数 ──
export interface WorldGenResult {
  nations: NationDef[];
  provinces: ProvinceDef[];
  relations: { from: string; to: string; relation: number; trust: number }[];
}

export function generateWorld(seed: number, playerNationId?: string, regionFilter?: string[]): WorldGenResult {
  const rng = mulberry32(seed);
  const nations: NationDef[] = [];
  const provinces: ProvinceDef[] = [];
  const relations: { from: string; to: string; relation: number; trust: number }[] = [];

  let nationCounter = 0;
  let provinceCounter = 0;

  // C4: 区域筛选剧本（W3东亚/W5地中海/W6美洲）——只生成指定洲
  const regionsToGen = regionFilter && regionFilter.length > 0
    ? REGIONS.filter((r) => regionFilter.includes(r.continent))
    : REGIONS;

  for (const region of regionsToGen) {
    // 1. 为该区域生成国家
    const regionNations = generateRegionNations(region, rng, nationCounter, playerNationId);
    nationCounter += regionNations.length;

    // 2. 为该区域生成省份
    const regionProvinces = generateRegionProvinces(region, regionNations, rng, provinceCounter);
    provinceCounter += regionProvinces.length;

    // 3. 生成区域内稀疏外交关系
    for (let i = 0; i < regionNations.length; i++) {
      for (let j = i + 1; j < regionNations.length; j++) {
        // 只为邻国生成关系（简化：同区域都算邻国）
        const baseRel = rng() > 0.5 ? 10 : -5;
        relations.push({ from: regionNations[i].id, to: regionNations[j].id, relation: baseRel, trust: 50 });
      }
    }

    nations.push(...regionNations);
    provinces.push(...regionProvinces);
  }

  return { nations, provinces, relations };
}

// ── 区域国家生成 ──
function generateRegionNations(region: RegionTemplate, rng: () => number, idOffset: number, playerNationId?: string): NationDef[] {
  const result: NationDef[] = [];
  const usedKeyNation = new Set<string>();  // 跟踪已用 keyNation，避免同 region 多 tier 重复匹配
  const tiers: NationTier[] = ['S', 'A', 'B', 'C', 'D'];
  let localId = 0;

  for (const tier of tiers) {
    const count = region.nationCount[tier];
    for (let i = 0; i < count; i++) {
      const nationId = `n_${idOffset + localId + 1}`;
      localId++;

      // 检查是否是手写关键国（修：continent 前缀与 key id 前缀不一致，改用映射表）
      const CONTINENT_KEY_PREFIX: Record<string, string> = {
        mediterranean: 'n_med_', europe_w: 'n_we_', europe_e: 'n_ee_', europe_n: 'n_en_',
        middle_east: 'n_me_', africa_n: 'n_na_', africa_s: 'n_sa_',
        asia_central: 'n_ca_', asia_east: 'n_ea_', asia_south: 'n_sa_',
        americas: 'n_am_', oceania: 'n_oc_',
      };
      const prefix = CONTINENT_KEY_PREFIX[region.continent] ?? '';
      // 修：按 tier 匹配 keyNation，且只匹配一次（usedKeyNation 跟踪）
      const keyNation = prefix ? KEY_NATIONS.find((k) => k.id?.startsWith(prefix) && k.tier === tier && !usedKeyNation.has(k.id)) : undefined;
      if (keyNation && (tier === 'S' || tier === 'A' || tier === 'B')) {
        usedKeyNation.add(keyNation.id!);
        // 用手写覆盖——保留 key.id，玩家匹配检查 key.id
        const built = buildKeyNation(keyNation, nationId, region, rng);
        built.isPlayer = playerNationId === keyNation.id;
        result.push(built);
        continue;
      }

      // 模板生成
      const tmpl = NATION_TEMPLATES[tier];
      const nameIdx = Math.floor(rng() * region.nationNamePool.length);
      const name = region.nationNamePool[nameIdx] ?? `${region.nameCn}${tier}${i + 1}`;
      const rulerIdx = Math.floor(rng() * region.rulerNamePool.length);

      const govIdx = Math.floor(rng() * tmpl.governmentPool.length);
      const charIdx = Math.floor(rng() * tmpl.characterPool.length);

      const gold = lerp(tmpl.initGoldRange[0], tmpl.initGoldRange[1], rng()) * region.goldMod;
      const armySize = lerp(tmpl.initArmyRange[0], tmpl.initArmyRange[1], rng()) * region.militaryMod;

      const isPlayer = playerNationId === nationId;

      result.push({
        id: nationId,
        name,
        isPlayer,
        tier,
        government: tmpl.governmentPool[govIdx],
        character: tmpl.characterPool[charIdx],
        capital: '', // 后续由省份分配填充
        initGold: Math.round(gold),
        initFood: Math.round(gold * 0.8 * region.foodMod),
        initWood: Math.round(gold * 0.15),
        initIron: Math.round(gold * 0.05),
        initTaxRate: 0.12 + rng() * 0.08,
        initTech: { ...tmpl.initTech },
        initArmy: { size: Math.round(armySize), morale: 50 + Math.round(rng() * 20), training: 40 + Math.round(rng() * 20), equipment: 35 + Math.round(rng() * 20) },
        ruler: { name: region.rulerNamePool[rulerIdx] ?? '无名', ability: 40 + Math.round(rng() * 25), age: 25 + Math.round(rng() * 40) },
        aiWeights: buildAIWeights(tier, rng),
        initRelations: [], // 后续由 relations 数组填充
      });
    }
  }

  return result;
}

function buildKeyNation(key: Partial<NationDef>, nationId: string, region: RegionTemplate, rng: () => number): NationDef {
  return {
    id: key.id ?? nationId,
    name: key.name ?? '未名',
    isPlayer: false,
    tier: key.tier ?? 'B',
    government: key.government ?? 'monarchy',
    character: key.character ?? 'balanced',
    capital: '',
    initGold: key.initGold ?? 300,
    initFood: key.initFood ?? 300,
    initWood: Math.round((key.initGold ?? 300) * 0.15),
    initIron: Math.round((key.initGold ?? 300) * 0.05),
    initTaxRate: 0.15,
    initTech: { agri: 1, mil: 1, admin: 1 },
    initArmy: key.initArmy ?? { size: 200, morale: 50, training: 50, equipment: 40 },
    ruler: { name: '无名', ability: 50, age: 40 },
    aiWeights: buildAIWeights(key.tier ?? 'B', rng),
    initRelations: [],
  };
}

function buildAIWeights(tier: NationTier, rng: () => number): NationDef['aiWeights'] {
  const base = { taxUp: 1.0, buildFarm: 1.0, suppress: 0.8, expandArmy: 0.8, alliance: 1.0, declareWar: 0.6, research: 1.0 };
  if (tier === 'S' || tier === 'A') {
    return { ...base, expandArmy: 1.2, declareWar: 0.9, research: 1.2 };
  }
  if (tier === 'D') {
    return { ...base, taxUp: 0.6, buildFarm: 0.5, expandArmy: 0.4, declareWar: 0.3, alliance: 1.5 };
  }
  return base;
}

// ── 单省生成辅助 ──
function addProvince(nation: NationDef, region: RegionTemplate, rng: () => number, idOffset: number, provIdx: number, result: ProvinceDef[], isCapital: boolean): void {
  const provId = `p_${idOffset + provIdx + 1}`;
  const nameIdx = Math.floor(rng() * region.provinceNamePool.length);
  const terrainIdx = Math.floor(rng() * region.terrainBias.length);
  const terrain = region.terrainBias[terrainIdx];
  const x = lerp(region.xRange[0], region.xRange[1], rng());
  const y = lerp(region.yRange[0], region.yRange[1], rng());
  const pop = isCapital ? Math.round(lerp(800, 2000, rng()) * (nation.tier === 'S' ? 2 : 1)) : Math.round(lerp(200, 800, rng()));
  result.push({
    id: provId, name: `${region.provinceNamePool[nameIdx % region.provinceNamePool.length]}${!isCapital ? ` ${provIdx}` : ''}`,
    terrain, type: isCapital ? 'capital' : (terrain === 'ocean' ? 'ocean' : 'land'),
    ownerId: nation.id, isCapital, agriBase: terrain === 'ocean' ? 0 : lerp(0.5, 1.5, rng()),
    culture: region.culture, religion: region.religion, initPop: terrain === 'ocean' ? 0 : pop,
    initClassRatio: terrain === 'ocean' ? { peasants: 0, workers: 0, merchants: 0, soldiers: 0, scholars: 0, nobles: 0, clergy: 0 } : { peasants: 0.5, workers: 0.2, merchants: 0.1, soldiers: 0.08, scholars: 0.04, nobles: 0.04, clergy: 0.04 },
    baseResources: { wood: Math.round(rng() * 5), iron: Math.round(rng() * 3) },
    adjacent: [], distToPlayerCapital: 0,
    elevation: terrain === 'mountain' ? 'high' : (terrain === 'hill' ? 'medium' : 'low'),
    climate: region.climate, hasRiver: rng() > 0.6, isTradeNode: isCapital || rng() > 0.85,
    tradeNodeTier: isCapital ? 2 : (rng() > 0.7 ? 1 : undefined) as 1 | 2 | 3 | undefined,
    fortressLevel: isCapital ? 1 : 0, x, y,
  });
  if (isCapital) nation.capital = provId;
}

// ── 区域省份生成 ──
function generateRegionProvinces(region: RegionTemplate, regionNations: NationDef[], rng: () => number, idOffset: number): ProvinceDef[] {
  const result: ProvinceDef[] = [];

  // 按国家 tier 分配省份（S 先挑，沿海+平原优先）
  // W-fix: 保证每国至少1省（D级城邦必须有地）
  const sortedNations = [...regionNations].sort((a, b) => {
    const tierOrder: Record<NationTier, number> = { S: 0, A: 1, B: 2, C: 3, D: 4 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  // 先给每国分配至少1省
  const minProvinces = sortedNations.length;
  const totalProvinces = Math.max(minProvinces, Math.round(regionNations.reduce((s, nation) => s + lerp(
    NATION_TEMPLATES[nation.tier].provinceCountRange[0],
    NATION_TEMPLATES[nation.tier].provinceCountRange[1],
    rng(),
  ), 0)));

  let provIdx = 0;
  // W-fix: Round 1 - give every nation at least 1 province (capital)
  for (const nation of sortedNations) {
    if (provIdx >= totalProvinces) break;
    addProvince(nation, region, rng, idOffset, provIdx, result, true);
    provIdx++;
  }
  // Round 2 - distribute remaining provinces by tier
  for (const nation of sortedNations) {
    const extraCount = Math.max(0, Math.round(lerp(
      NATION_TEMPLATES[nation.tier].provinceCountRange[0],
      NATION_TEMPLATES[nation.tier].provinceCountRange[1],
      rng(),
    )) - 1);
    for (let i = 0; i < extraCount && provIdx < totalProvinces; i++) {
      addProvince(nation, region, rng, idOffset, provIdx, result, false);
      provIdx++;
    }
  }

  // Fill adjacency
  // 填充相邻关系（简化：同区域同国家省份互为相邻，跨区域留空由后续连通算法处理）
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i], b = result[j];
      // 同国家且距离 < 阈值 → 相邻
      if (a.ownerId === b.ownerId) {
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < 80) {
          a.adjacent.push(b.id);
          b.adjacent.push(a.id);
        }
      }
      // 跨国家但距离很近 → 边境相邻
      else {
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < 50) {
          a.adjacent.push(b.id);
          b.adjacent.push(a.id);
        }
      }
    }
  }

  return result;
}

// ── 工具 ──
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── 统计 ──
export function worldStats(result: WorldGenResult): string {
  const tierCounts: Record<string, number> = {};
  for (const n of result.nations) tierCounts[n.tier] = (tierCounts[n.tier] ?? 0) + 1;
  return `${result.nations.length} 国 / ${result.provinces.length} 省 / ${result.relations.length} 外交关系 | S:${tierCounts['S'] ?? 0} A:${tierCounts['A'] ?? 0} B:${tierCounts['B'] ?? 0} C:${tierCounts['C'] ?? 0} D:${tierCounts['D'] ?? 0}`;
}
