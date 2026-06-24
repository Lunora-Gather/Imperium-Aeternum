# Imperium Aeternum — 数据圣经 v1

> **FROZEN v1** — 本文件从 `src/data/*.ts` 实际导出反向生成，是所有数据表的单一事实源。
> 字段与代码一一对应；改数据必改本文；改本文走 DEC-NNN。

---

## 1. 数据表总览

| 表 | 文件 | 条目数 | 关键导出 | 说明 |
|----|------|--------|---------|------|
| 国家 | `data/nations.ts` | 5（手写）+ 200（worldgen） | `NATIONS`, `NATION_BY_ID`, `PLAYER_ID='n01'`, `AI_NATIONS` | 5 国手写剧本 + 200 国 seeded 生成 |
| 省份 | `data/provinces.ts` | 50（手写）+ 547（worldgen） | `PROVINCES`, `PROVINCE_BY_ID` | 含地形/海拔/气候/河流/坐标 |
| 建筑 | `data/buildings.ts` | 20 | `BUILDINGS: Record<BuildingId, BuildingDef>`, `BUILDING_LIST` | 含前置科技/上限/成本 |
| 科技 | `data/technologies.ts` | 24（3 路线 × 8 级） | `TECHNOLOGIES`, `TECH_BY_ID` | agri/mil/admin 各 8 级 |
| 政体 | `data/governments.ts` | 12 | `GOVERNMENTS`, `GOVERNMENT_LIST` | 含派系修正/解锁政策 |
| 政策 | `data/policies.ts` | 25 | `POLICIES`, `POLICY_BY_ID` | 含政体限制/前置科技/效果 |
| 派系 | `data/factions.ts` | 5 | `FACTIONS`, `FACTION_LIST` | 贵族/商人/军方/民众/神职 |
| 事件 | `data/events.ts` | 103 | `EVENTS`, `EVENT_BY_ID`, `EVENT_IDS` | 含 9 条事件链（3 链 × 3） |
| 国家性格 | `data/national-characters.ts` | 11 | `NATIONAL_CHARACTERS`, `BEHAVIOR_MAPPINGS` | 倾向值→性格激活 |
| 法律（C2） | `data/laws.ts` | 12 | `LAWS`, `LAW_BY_ID`, `LAWS_BY_CATEGORY` | 3 类（民法/刑法/行政法） |
| 贸易路线（C3） | `data/trade-routes.ts` | 8 | `TRADE_ROUTES`, `TRADE_ROUTE_BY_ID`, `LENGTH_MOD` | 长度修正×1.0/1.3/1.6 |
| 区域模板 | `data/regions.ts` | 12 | `REGIONS` | 12 大洲世界生成模板 |

---

## 2. 国家表 `NationDef`

| 字段 | 类型 | 含义 | 取值范围 |
|------|------|------|---------|
| `id` | `NationId=string` | 国家 id | `'n01'`..'n05'` 手写 / `n_xx_xxx` 生成 |
| `name` | `string` | 国名 | — |
| `isPlayer` | `boolean` | 是否玩家 | 仅 `n01` 为 true（手写剧本） |
| `tier` | `'S'\|'A'\|'B'\|'C'\|'D'` | 体量分级 | AI 分层结算依据 |
| `government` | `GovernmentId` | 政体 id | 见 §6 |
| `character` | `NationalCharacterId` | 国家性格 | 见 §10 |
| `capital` | `string` | 首都省份 id | 空字符串表示无首都 |
| `ruler` | `{ name, ability, age, heir?, reignYears? }` | 统治者 | ability 35-65 |
| `initTaxRate` | `number` | 初始税率 | 0-0.5 |
| `initGold/food/wood/iron` | `number` | 初始资源 | — |
| `initArmy` | `{ size, morale, training, equipment }` | 初始军队 | — |
| `initTech` | `{ agri, mil, admin }` | 初始科技等级 | 1-8 |
| `initRelations` | `{ target, relation, trust }[]` | 初始外交 | relation -100~100, trust 0-100 |
| `aiWeights` | `Partial<Record<AIActionId, number>>` | AI 决策权重 | 缺省由 `defaultAIWeights(tier)` 给 |

**5 国手写剧本**（`PLAYER_ID='n01'`）：罗马(n01,A)、迦太基(n02,A)、叙拉古(n03,B)、潘诺尼亚(n04,B)、蛮族(n05,C)。

---

## 3. 省份表 `ProvinceDef`

| 字段 | 类型 | 含义 | 取值 |
|------|------|------|------|
| `id` | `string` | 省份 id | `'p01'`..`'p50'` / worldgen |
| `name` | `string` | 省名 | — |
| `terrain` | `Terrain` | 地形 | plain/hill/mountain/coast/forest/desert/tundra/jungle/swamp/ocean/island |
| `type` | `ProvinceType` | 省份类型 | land/ocean/fortress/trade_node/capital |
| `ownerId` | `string` | 归属国家 | `'barbarian'` 表示无主 |
| `isCapital` | `boolean` | 是否首都 | — |
| `agriBase` | `number` | 农业基础值 | 0-2.0（海洋=0） |
| `culture` | `CultureId` | 文化 | 24 种 |
| `religion` | `ReligionId` | 宗教 | 14 种 |
| `initPop` | `number` | 初始人口 | 海洋=0 |
| `initClassRatio` | `{ peasants, workers, merchants, soldiers, scholars, nobles, clergy }` | 阶层比例 | 和≈1（陆地）/0（海洋） |
| `baseResources` | `{ wood?, iron?, stone?, luxury?, spice?, silk? }` | 基础资源 | — |
| `adjacent` | `string[]` | 相邻省份 id | 对称性由 validate 检查 |
| `distToPlayerCapital` | `number` | 到玩家首都距离 | — |
| `elevation` | `Elevation` | 海拔 | low/medium/high/peak |
| `climate` | `Climate` | 气候 | temperate/mediterranean/arid/tropical/cold/polar |
| `hasRiver` | `boolean` | 是否有河流 | 粮产+贸易 |
| `isTradeNode` | `boolean` | 是否贸易节点 | — |
| `tradeNodeTier` | `1\|2\|3` | 节点等级 | 影响贸易量 |
| `fortressLevel` | `number` | 要塞等级 | 0-3 |
| `x`, `y` | `number` | 坐标 | SVG 地图渲染 |

---

## 4. 建筑表 `BuildingDef`

20 条建筑：farm/road/market/barracks/warehouse/granary/forge/temple/library/aqueduct/walls/port/trade_post/monastery/university/citadel/arsenal/shrine/gardens 等。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `BuildingId` | 建筑 id |
| `name`, `description` | `string` | 名称/描述 |
| `costGold/wood/iron` | `number` | 建造成本 |
| `prereqTech` | `string?` | 前置科技 id |
| `maxPerProvince` | `number` | 每省上限（0=不限） |
| `effects` | `{ food?, gold?, trade?, stability?, unrest?, loyalty? }` | 每回合效果 |

升级成本 = `def.costGold * 0.6 * level`，最高 3 级。

---

## 5. 科技表 `TechnologyDef`

24 条 = 3 路线 × 8 级。每级 `prereqTech` 指向上一级。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `string` | 如 `'agri_lv3'` |
| `branch` | `'agri'\|'mil'\|'admin'` | 路线 |
| `level` | `number` | 1-8 |
| `costSci`, `costGold` | `number` | 研发成本 |
| `prereqTech` | `string?` | 前置（level 1 无） |
| `effects` | `{ foodMod?, combatMod?, taxEffMod?, corruptionMod?, maxProvinceMod? }` | 效果 |

---

## 6. 政体表 `GovernmentDef`

12 种：monarchy/republic/theocracy/military/empire/tribal/federal/tyrant/constitutional/commerce_republic/priest_king/nomad_khanate。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `GovernmentId` | 政体 id |
| `name`, `description` | `string` | — |
| `legitimacyBase/stabilityBase/efficiencyBase/corruptionBase` | `number` | 基础值 0-100 |
| `factionSatMod` | `Record<FactionId, number>` | 派系满意度修正 |
| `unlockedPolicies` | `string[]` | 解锁政策 id |

---

## 7. 政策表 `PolicyDef`

25 条。`POLICY_BY_ID: Record<PolicyId, PolicyDef>`。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `PolicyId` | 政策 id |
| `name`, `description` | `string` | — |
| `costAction`, `costGold` | `number` | 行动点/金成本 |
| `allowedGovernments` | `GovernmentId[]` | 允许政体（空=全允许） |
| `prereqTech` | `string?` | 前置科技 |
| `effects` | `{ taxRateMod?, corruptionMod?, stabilityMod?, efficiencyMod?, influenceMod?, taxEffMod? }` | 效果 |
| `factionReaction` | `Record<FactionId, number>` | 派系反应 |

---

## 8. 派系表 `FactionDef`

5 派系：nobles(贵族)/merchants(商人)/military(军方)/commoners(民众)/clergy(神职)。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `FactionId` | 派系 id |
| `name`, `description` | `string` | — |
| `initPower` | `number` | 初始权力 0-100 |
| `initSatisfaction` | `number` | 初始满意度 0-100 |
| `coupEventId` | `string` | 逼宫事件 id |

满意度 <30 触发逼宫事件。

---

## 9. 事件表 `EventDef`

103 事件（含 9 条事件链）。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `string` | 事件 id |
| `title`, `description` | `string` | — |
| `category` | `'crisis'\|'politics'\|'economy'\|'military'\|'diplomacy'\|'religion'\|'science'\|'opportunity'\|'culture'\|'population'` | 类别 |
| `trigger` | `EventTrigger` | 触发条件（多字段 AND） |
| `weight` | `number` | 自然触发权重（0=只靠 triggerEvent） |
| `cooldown` | `number` | 冷却回合 |
| `unique` | `boolean` | 是否唯一 |
| `options` | `EventOption[]` | ≥2 选项 |

`EventTrigger` 字段：`minTurn/maxTurn/minStability/maxStability/maxLegitimacy/maxFoodRatio/minCorruption/minWarExhaustion/atWar/notAtWar/hasNewTerritory/provinceCultureDiff/factionSatBelow/techLevelAbove/relationBelow/isPlayerOnly`。

`EventEffect` 字段：`gold/food/wood/iron/population/stability/legitimacy/corruption/efficiency/warExhaustion/influence/taxRate/adminPt/sciPt/relation/factionSat/triggerEvent`（C1 事件链）。

**9 条事件链**（C1）：`evt_chain_plague_1/2/3`、`evt_chain_heir_1/2/3`、`evt_chain_border_1/2/3`。链首 weight>0，链中/尾 weight=0。

---

## 10. 国家性格表 `NationalCharacterDef`

11 性格：militarism/commerce/religiosity/technocracy/authoritarian/welfare/feudal/revolutionary/maritime/centralization/balanced。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `NationalCharacterId` | — |
| `name`, `description` | `string` | — |
| `threshold` | `number` | 激活阈值 |
| `bonuses`, `penalties` | `NationalCharacterMods` | 加成/副作用 |

`BEHAVIOR_MAPPINGS`：玩家行为→倾向值累积。如 `declare_war→militarism+3`、`build_market→commerce+2`。

---

## 11. 法律表 `LawDef`（C2）

12 法律，3 类。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `string` | 法律 id |
| `name`, `description` | `string` | — |
| `category` | `'civil'\|'criminal'\|'administrative'` | 类别 |
| `costGold` | `number` | 推行成本 |
| `allowedGovernments` | `string[]` | 允许政体（空=全允许） |
| `prereqAdminLevel` | `number` | 前置行政科技等级 |
| `conflictsWith` | `string[]?` | 互斥法律 |
| `effects` | `{ corruptionMod?, stabilityMod?, efficiencyMod?, legitimacyMod?, taxEffMod?, unrestReduction?, rebellionReduction? }` | 效果 |
| `factionReaction` | `Record<string, number>` | 派系反应 |

互斥对：土地改革↔贵族特权、中央集权↔地方自治、严刑↔宽刑。

---

## 12. 贸易路线表 `TradeRouteDef`（C3）

8 路线。

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `string` | 路线 id |
| `name`, `description` | `string` | — |
| `endpoints` | `[string, string]` | 两端省份 id |
| `costGold` | `number` | 建立成本 |
| `prereqAdminLevel` | `number` | 前置行政科技 |
| `yield` | `{ gold, influence, food? }` | 每回合基础收益 |
| `length` | `'short'\|'medium'\|'long'` | 长度（修正×1.0/1.3/1.6） |

失效条件：两端省份都不归玩家。

---

## 13. 数据自检

`npm run validate` → `src/data/__validate__.ts`：
- 国家数=5、玩家恰 1、capital 引用合法
- 省份 ownerId 存在、相邻对称（warn 不对称）、阶层比例和≈1
- 建筑 id 唯一、前置科技存在
- 科技每路线 5 或 8 级、prereq 链合法
- 事件 id 唯一、≥2 选项、引用国家/派系存在
- 派系逼宫事件 id 存在

**当前状态**：5国/50省/20建筑/24科技/25政策/103事件，0 错误（仅剩无害的相邻不对称 warnings）。
