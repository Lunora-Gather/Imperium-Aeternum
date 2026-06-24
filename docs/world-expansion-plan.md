# Imperium Aeternum — 世界级扩展规划 v3.0

> **本文件是「制霸市场级」世界扩展的总冻结基线。**
> 创建于 2026-06-23, supersede `docs/06-expansion.md` 的省级扩展部分。
> 目标:把世界从「地中海 5 国 50 省」扩成「当今世界级 192 国 600 省 12 大洲」, 同时保证引擎、AI、UI、性能全部能扛。
> 决策机制:遵循 `docs/decisions.md` ADR 机制, 本扩展从 DEC-011 续。

---

## 0. 设计哲学(为什么这么做)

用户要的不是「更多省份」而是「**和当今世界类似的大有小、多元并存**」。这意味着:

1. **体量光谱**:从 1 省城邦到 50 省超级大国, 跨度 50×。
2. **形态光谱**:游牧汗国、商业共和国、神权祭司国、中央集权帝国、部落联盟全要能开局。
3. **地理光谱**:12 大洲、6 气候、11 地形, 含海洋、岛屿、沙漠、冻土、丛林。
4. **关系光谱**:190 国 × 190 国 = 36100 条外交关系, 必须压缩存储 + 懒计算。
5. **时间光谱**:玩家从公元前开局, 经数百年治理, 可能建成跨洲帝国。

**核心张力**:当今世界 195 主权国, 但 95% 是小国, 真正玩家会感知的只有 20-30 个有分量的对手。所以设计原则:

> **完整数据 192 国, 但引擎只对玩家邻国 + 大国做完整结算; 小国走轻量 tick。**

这是制霸市场级 4X 大作(Civ、EU、HOI)的共同做法 —— 不是所有国家每回合都完整结算, 而是分层 AI。

---

## 1. 规模目标(冻结)

| 维度 | v2 当前 | **v3 世界级** | 扩张倍数 |
|------|---------|---------------|----------|
| 国家数 | 5 | **192** | 38× |
| 省份数 | 50 | **600** | 12× |
| 大洲/区域 | 1 (地中海) | **12** | 12× |
| 文化数 | 13 | **24** | 1.8× |
| 宗教数 | 7 | **14** | 2× |
| 政体数 | 12 | **12** (不变) | 1× |
| 国家性格 | 10 | **10** (不变) | 1× |
| 外交关系条目 | 20 (5×4) | **~600** (稀疏, 非全连接) | 30× |
| AI 每回合结算国家 | 4 | **192** (分层) | 48× |
| 回合耗时目标 | <50ms | **<800ms** | — |

**为什么 192 国**:对应 UN 成员国数, 让玩家有「和当今世界类似」的真实感。
**为什么 600 省**:平均每国 3 省, 大国 30-50 省, 小国 1 省, 城邦 1 省共享。
**为什么外交稀疏**:全连接 192×191/2 = 18336 条, 内存爆炸; 只存「有互动意向」的对子, 默认关系用区域模板。

---

## 2. 体量分级(制霸关键)

按当今世界类比, 把 192 国分 5 级。这决定 AI 结算深度、初始资源、玩家可见度。

| 级别 | 数量 | 占比 | 类当今例 | 省数 | 初始金 | 初始军 | AI 结算 |
|------|------|------|----------|------|--------|--------|---------|
| **S 超级大国** | 4 | 2% | 中/美/俄/超级古帝国 | 30-50 | 2000 | 1500 | 完整 |
| **A 大国** | 12 | 6% | 德/日/印/区域霸主 | 15-25 | 1000 | 800 | 完整 |
| **B 中等国家** | 30 | 16% | 韩/越/埃及/区域强国 | 8-14 | 500 | 400 | 完整 |
| **C 小国** | 60 | 31% | 一般主权国 | 3-7 | 250 | 200 | 轻量 |
| **D 城邦/部落** | 86 | 45% | 摩纳哥/游牧部落 | 1-2 | 120 | 100 | 静态 |

**玩家**:从 S/A/B 中选一开局(默认 S 级「罗马」类比当今开局即是大国), 或选 C/D 体验「小国崛起」剧本。

**AI 结算分层**(性能核心):
- **完整结算**(每回合):玩家 + S + A + 玩家邻国 = 约 20 国
- **轻量 tick**(每回合):B + C = 约 90 国, 只跑经济/人口简化版, 不跑完整 AI 决策
- **静态 tick**(每 5 回合):D 级, 只刷人口和稳定度, 不主动行动

预估每回合:20 国完整(20ms) + 90 国轻量(30ms) + 86 国静态(5ms) ≈ 55ms, 远低于 800ms 目标。

---

## 3. 12 大洲/区域划分(地理骨架)

按当今世界类比, 把 600 �划分到 12 大洲。每洲有特色文化/宗教/地形倾向。

| 洲 ID | 名称 | 省数 | 主文化 | 主宗教 | 地形倾向 | 备注 |
|-------|------|------|--------|--------|----------|------|
| `europe_w` | 西欧 | 50 | latin/germanic/celtic | monotheism_a | plain/forest/coast | 玩家可选开局 |
| `europe_e` | 东欧 | 45 | slavic | monotheism_a | plain/forest | 含草原 |
| `europe_n` | 北欧 | 30 | nordic | animism/polytheism | tundra/forest/coast | 寒冷 |
| `mediterranean` | 地中海 | 55 | latin/hellenic | polytheism/monotheism_a | mediterranean/coast | **玩家默认开局** |
| `middle_east` | 中东 | 50 | persian/orient | monotheism_b | desert/mountain | 商贸古道 |
| `africa_n` | 北非 | 40 | african/desert | monotheism_b | desert/coast | 沿海富内陆荒 |
| `africa_s` | 南非 | 35 | african | animism/monotheism_b | jungle/savanna | 简化为 savanna=plain+jungle |
| `asia_central` | 中亚 | 40 | persian/sinic | monotheism_b/animism | desert/steppe | 游牧汗国老家 |
| `asia_east` | 东亚 | 60 | sinic | sinic_religion | plain/coast/forest | 含大帝国开局 |
| `asia_south` | 南亚 | 50 | indian | indian_religion | jungle/plain/monsoon | 高人口密度 |
| `americas` | 美洲 | 90 | sinic_offshoot/indigenous | animism/sun_worship | varied | 隔洋, 后期接触 |
| `oceania` | 大洋洲 | 55 | maritime_culture | animism/polytheism | island/ocean | 海洋省多 |

**关键设计**:`mediterranean` 是玩家默认剧本(类比当今开局即是文明发源地); `americas`/`oceania` 隔洋, 早期无接触, 后期靠航海科技解锁跨洋贸易/战争。这让游戏前期不 overwhelm 玩家, 后期有「新大陆」惊喜。

---

## 4. 文化与宗教扩展(制霸氛围)

**24 文化**(扩自现有 13):

```
latin, hellenic, orient, nordic, desert, celtic, germanic, slavic, iberian,
african, persian, indian, sinic,
// 新增 11:
sinic_offshoot(东亚文化旁支), maritime(海洋商贸文化),
 indigenous_americas(美洲原住民), indigenous_africa(非洲原生),
 nomadic(游牧), steppe(草原), mesoamerican(中美洲),
 andean(安第斯), polynesian(波利尼西亚), arab(阿拉伯), turkic(突厥)
```

**14 宗教**(扩自现有 7):

```
polytheism, monotheism_a, monotheism_b, animism, sun_worship, ancestor, mystery_cult,
// 新增 7:
sinic_religion(儒道混合), indian_religion(印度系), shamanism(萨满),
monotheism_c(第三亚伯拉罕系), dualism(二元论), fertility_cult(丰产崇拜), sea_cult(海神崇拜)
```

每文化有:命名池(国名/省名/人名)、建筑倾向、政策倾向、外交倾向。
每宗教有:容忍度、传教效率、与异教关系修正、唯一事件链。

---

## 5. 国家生成(数据驱动批量生成)

**核心决策 DEC-011**:不再手写 192 个 `NationDef`, 而是用「区域模板 + 国家模板 + 个体扰动」程序生成。手写只保证 S/A 级(16 国)有独特个性; B/C/D 级用模板生成。

### 5.1 数据结构

新建 `src/data/regions.ts`:

```typescript
export interface RegionTemplate {
  continent: ContinentId;
  culture: CultureId;
  religion: ReligionId;
  terrainBias: Terrain[];
  climate: Climate;
  // 该区域国家数量
  nationCount: { S: number; A: number; B: number; C: number; D: number };
  // 命名池
  nationNamePool: string[];
  provinceNamePool: string[];
  rulerNamePool: string[];
  // 区域特色修正
  goldMod: number;
  foodMod: number;
  militaryMod: number;
}
```

新建 `src/data/nation-templates.ts`:

```typescript
export interface NationTemplate {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  provinceCount: [number, number];  // [min, max]
  initGold: [number, number];
  initArmy: [number, number];
  initTech: { agri: number; mil: number; admin: number };
  governmentPool: GovernmentId[];
  characterPool: NationalCharacterId[];
  aiWeights: NationDef['aiWeights'];
}
```

### 5.2 生成流程

新建 `src/engine/worldgen.ts`:

```typescript
export function generateWorld(seed: number): {
  nations: NationDef[];
  provinces: ProvinceDef[];
  relations: { from: string; to: string; relation: number; trust: number }[];
}
```

流程:
1. 按 12 区域模板生成省份数(总计 600)。
2. 每区域按 `nationCount` 分配 S/A/B/C/D 国家数。
3. 每国家从模板抽政体/性格/初始资源, 加 seeded 扰动。
4. 把区域内省份分配给国家(S 级先挑, 沿海+平原优先)。
5. 生成稀疏外交关系:每国只生成与邻国(同洲+相邻洲)的初始关系, 默认区域模板值。
6. **S/A 级手写覆盖**:16 个关键国家的名字/性格/资源手写, 生成器跳过这些。

### 5.3 多剧本支持

新建 `src/data/scenarios.ts`:

```typescript
export interface Scenario {
  id: string;
  name: string;
  description: string;
  startTurn: number;          // 公元前 X 年
  playerNation: string;       // 玩家国家 id
  forcedNations?: NationDef[]; // 手写覆盖
  seed: number;
}

export const SCENARIOS: Scenario[] = [
  { id: 'mediterranean', name: '地中海崛起', description: '罗马式小国开局, 争霸地中海', startTurn: 0, playerNation: 'n01', seed: 12345 },
  { id: 'world_full', name: '世界完整', description: '192 国全开局, 自选国家', startTurn: 0, playerNation: '', seed: 23456 },
  { id: 'asia_dawn', name: '东亚曙光', description: '中华圈开局', startTurn: 0, playerNation: 'n_east_empire', seed: 34567 },
];
```

---

## 6. 核心架构重构(必做)

这是「制霸」的根本阻碍, 必须先重构。

### 6.1 DEC-012: `NationId` 从 union literal 改为 `string`

**现状**:`export type NationId = 'n01' | 'n02' | 'n03' | 'n04' | 'n05';`
**问题**:192 国无法用 union 写死, TypeScript 会爆。
**决策**:`export type NationId = string;` + branded type `NationId & { __brand: 'NationId' }` 做编译期区分。
**影响**:
- `nations.ts` 重写为数据驱动生成。
- 所有 `as NationId` 转型点重审。
- `Record<NationId, Nation>` → `Map<string, Nation>` 或 `Record<string, Nation>` + 运行时校验。
- `initRelations` 的 `target: NationId` 改为运行时校验。

### 6.2 DEC-013: 外交关系稀疏化

**现状**:`DiplomaticRelation[]` 全连接, 5 国 20 条 OK, 192 国 18336 条内存爆。
**决策**:
- 只存「有非默认关系」的对子(邻国、同盟、战争、贸易、敌对)。
- 默认关系由「区域模板 + 文化宗教差异」即时计算, 不存。
- 新增 `getDefaultRelation(from: NationId, to: NationId, state: GameState): number` API。
**影响**:`diplomacy.ts` 重写; `init.ts` 的 `buildRelations` 改为稀疏; AI 决策的「找邻国」改为查省份相邻。

### 6.3 DEC-014: AI 分层结算

**现状**:`processAITurn` 对所有 AI 完整结算, 192 国会卡死。
**决策**:三档结算:
- `processAITurnFull(state, nation)`:完整决策(S/A/玩家邻国)
- `processAITurnLite(state, nation)`:只跑经济+人口+稳定度, 不主动行动(B/C)
- `processAITurnStatic(state, nation)`:只刷人口, 每 5 回合跑一次(D)
**影响**:`ai.ts` 拆三个函数; `turn.ts` 按 tier 分派; 新增 `nation.tier` 字段。

### 6.4 DEC-015: 性能预算与监控

**目标**:每回合 <800ms(玩家可接受)。
**手段**:
- 引入 `perf.ts` 计时每个 engine 阶段。
- `turn.ts` 末尾输出 `perfLog` 到 `GameState.lastReport`。
- 单测加「50 回合耗时 <40s」断言。
- AI 决策用对象池避免 GC。
**影响**:`utils/perf.ts` 新建; `turn.test.ts` 加性能断言。

### 6.5 DEC-016: 内存预算

**估算**:192 国 × Nation(~2KB) + 600 省 × Province(~1.5KB) + 稀疏关系 600 条 × 0.1KB = ~1.3MB。
**结论**:可接受, 不需换 IndexedDB, localStorage 5MB 够用。但需:
- `GameState` 不存「派系每一帧变化」, 只存关键事件。
- `triggeredEvents` 设上限 1000, 满了丢最旧。
- `wars` 结束即移除, 不留历史。

---

## 7. UI 扩展(制霸观感)

### 7.1 DEC-017: 世界 SVG 地图

- 600 省 SVG, 用 `provinces.ts` 的 x/y 坐标渲染。
- 缩放分级:世界级(看 12 洲轮廓)→ 洲级(看国家边界)→ 国级(看省份)。
- 玩家省份高亮, 战争省份红闪, 叛乱省份黄闪。
- 性能:600 SVG path 用 `react-window` 虚拟化, 只渲染可视区。

### 7.2 DEC-018: 国家列表与筛选

- 新建 `NationListScreen`:192 国分页表, 按 tier/洲/政体筛选。
- 排序:按国力/省数/军力/科技/玩家关系。
- 点击进入 `NationDetailScreen` 看他国详情(类似当今 CIA World Factbook 观感)。

### 7.3 DEC-019: 大洲俯瞰

- 主界面顶部加 12 洲缩略图条, 点击跳转该洲中心。
- 每洲显示该洲玩家影响力、同盟、战争数。

---

## 8. 开发阶段拆分(6 阶段, 严格递进)

每阶段必须 `npm test` 全绿才进下一阶段。新增决策从 DEC-011 续。

### 阶段 W1: 架构重构(无新内容, 纯改底层)

| 任务 | 文件 | 验证 |
|------|------|------|
| `NationId` → `string` + branded | `nations.ts`, `game.ts`, 全引擎 | typecheck + 32 测试全绿 |
| 外交稀疏化 + `getDefaultRelation` | `diplomacy.ts`, `init.ts` | 烟雾测试 |
| `Nation.tier` 字段 + AI 分层函数骨架 | `ai.ts`, `game.ts`, `init.ts` | typecheck |
| `perf.ts` + 性能断言 | `utils/perf.ts`, `turn.test.ts` | 测试含耗时断言 |

**产出**:架构能扛 192 国, 但数据还是 5 国。基线不变。

### 阶段 W2: 区域与国家模板数据

| 任务 | 文件 |
|------|------|
| 12 区域模板 `regions.ts` | `src/data/regions.ts` |
| 5 级国家模板 `nation-templates.ts` | `src/data/nation-templates.ts` |
| 24 文化 + 14 宗教扩展 | `provinces.ts` 的 union, `cultures.ts`, `religions.ts` 新建 |
| `worldgen.ts` 生成器 | `src/engine/worldgen.ts` |
| `validate` 适配生成数据 | `__validate__.ts` |

**产出**:`generateWorld(seed)` 能产出合法的 192 国 + 600 省。validate 全绿。

### 阶段 W3: S/A 级手写 16 国 + 剧本

| 任务 | 文件 |
|------|------|
| 16 关键国手写覆盖(罗马/迦太基/波斯/秦/孔雀/马其顿/埃及/迦太基...) | `src/data/key-nations.ts` |
| 3 剧本定义 | `src/data/scenarios.ts` |
| `init.ts` 按 scenario 选生成或手写 | `init.ts` |

**产出**:3 个可玩剧本, 玩家可选「地中海崛起」「世界完整」「东亚曙光」。

### 阶段 W4: 引擎适配 192 国

| 任务 | 文件 |
|------|------|
| `init.ts` 批量初始化 192 国 | `init.ts` |
| `ai.ts` 三档结算落地 | `ai.ts` |
| `economy.ts` 批量结算 | `economy.ts` |
| `military.ts` 战争结算支持 192 国 | `military.ts` |
| `events.ts` 事件触发支持任意国家 | `events.ts` |
| 性能调优达 <800ms/回合 | `perf.ts` |

**产出**:50 回合烟雾测试在 192 国下跑通, 耗时 <40s。

### 阶段 W5: UI 世界地图与国家列表

| 任务 | 文件 |
|------|------|
| 600 省 SVG 地图 + 缩放 | `screens/WorldMapScreen.tsx` |
| 192 国列表筛选 | `screens/NationListScreen.tsx` |
| 国家详情页 | `screens/NationDetailScreen.tsx` |
| 12 洲俯瞰条 | `components/ContinentBar.tsx` |
| 剧本选择页 | `screens/ScenarioSelectScreen.tsx` |

**产出**:玩家能在世界地图上看到 192 国, 点开任意国看详情。

### 阶段 W6: 扩展深化(可选)

| 任务 | 备注 |
|------|------|
| 法律树 + 思潮传播 | 原 P1 C |
| 王朝系统 | 原 P1 D |
| 贸易节点路线商队船队 | 原 P1 E |
| 事件扩至 80+ 含事件链 | 原 P2 H |
| 随机地图模式 | 新增 |

---

## 9. 验收标准(制霸市场级)

| 指标 | 目标 | 验证方式 |
|------|------|----------|
| 国家数 | 192 | `npm run validate` 输出 |
| 省份数 | 600 | `npm run validate` 输出 |
| 大洲数 | 12 | `validate` 校验 |
| 文化数 | 24 | `validate` 校验 |
| 宗教数 | 14 | `validate` 校验 |
| 每回合耗时 | <800ms | `turn.test.ts` 性能断言 |
| 50 回合无 NaN | 通过 | 烟雾测试 |
| typecheck | 通过 | `npm run typecheck` |
| 单测全绿 | 32+ 全绿 | `npm test` |
| 数据自检 | 通过 | `npm run validate` |
| 可玩剧本 | 3 个 | UI 可选 |
| 世界地图可渲染 | 600 省 SVG | `npm run dev` 目测 |

---

## 10. 风险与对策

| 风险 | 概率 | 对策 |
|------|------|------|
| 192 AI 卡死 | 高 | DEC-014 分层结算 + DEC-015 性能监控 |
| localStorage 5MB 爆 | 中 | DEC-016 内存预算, 关键事件限 1000 条 |
| UI 600 SVG 卡 | 中 | DEC-017 虚拟化渲染 |
| 外交关系计算慢 | 中 | DEC-013 稀疏 + 默认关系即时算 |
| 数据生成不平衡 | 中 | S/A 手写 + B/C/D 模板 + validate 校验 |
| 玩家 overwhelmed | 高 | 默认剧本只露地中海, 其他洲后期解锁 |

---

## 11. 下一步启动指令

复制以下内容作为下一会话启动:

```
继续 Imperium Aeternum 世界级扩展 v3.0。

先阅读 docs/world-expansion-plan.md 了解总规划。
当前状态:5 国 50 省, 架构基于 union NationId, 无法扩到 192 国。

立即执行阶段 W1 架构重构(无新内容, 篡底层):
1. NationId 从 union literal 改为 string branded type
2. 外交关系稀疏化 + getDefaultRelation API
3. Nation.tier 字段 + AI 分层函数骨架(full/lite/static)
4. utils/perf.ts + 性能断言

每改完一个文件跑 npm test 确认不破坏现有 32 测试。
所有改动记入 docs/decisions.md 从 DEC-011 续。
W1 完成后才进 W2 区域模板数据。
```

---

**本规划冻结于 2026-06-23。后续会话按阶段递进, 不得跳阶段。**
