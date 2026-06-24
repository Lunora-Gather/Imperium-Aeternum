# Imperium Aeternum — 架构文档 v1

> **FROZEN v1** — 本文件从 `src/engine/*.ts` 实际导出反向生成。
> 含每个 engine 文件职责 + 关键函数签名 + 调用关系。

---

## 1. 总体架构

```
React UI（screens/）
    ↓ 调用
Zustand store（gameStore.ts）
    ↓ 调用
Engine 层（engine/*.ts）  ← 纯逻辑，无 React 依赖
    ↓ 调用
Data 层（data/*.ts）       ← 静态数据表
    ↓ 引用
Types（types/game.ts）     ← 所有 interface
```

**核心原则**：
- 逻辑/UI 分离：engine 不 import React，store 不含公式
- 公式集中：所有数值公式在 `engine/formulas.ts`，engine 业务文件只调用
- seeded RNG：`utils/random.ts` mulberry32，seed 存 GameState
- 数据驱动：`data/*.ts` 静态表，engine 读取不硬编码

---

## 2. 关键数据结构（`types/game.ts`）

### `GameState`（顶层状态）
```ts
{
  version: number;              // SAVE_VERSION
  turn: number;                 // 当前回合（年）
  seed: number;                 // seeded RNG
  playerNationId: string;       // C1/A1: 动态玩家国 id
  nations: Record<string, Nation>;
  provinces: Record<string, Province>;
  relations: DiplomaticRelation[];  // 稀疏（DEC-013）
  wars: War[];
  triggeredEvents: TriggeredEvent[];  // 上限 1000（DEC-016）
  eventCooldowns: EventCooldown[];
  pendingEvents: PendingEvent[];      // 待玩家选择的事件
  pendingEventOptions: null;
  lastReport: TurnReport | null;
  victory: { type: string | null };
  stableTurnsCount, bankruptTurns, lowStabilityTurns, highEconomyStableTurns: number;
}
```

### `Nation`（国家运行时状态）
关键字段：`id/name/isPlayer/tier/government/character/tendency/activeCharacterBonuses/capital/ruler/taxRate/resources/factions/tech/army/activePolicies/activeLaws(C2)/activeTradeRoutes(C3)/warExhaustion/influence/atWar/defeated`。

---

## 3. Engine 文件职责

### `engine/init.ts` — GameState 初始化
| 函数 | 签名 | 职责 |
|------|------|------|
| `createInitialState()` | `→ GameState` | 5 国手写剧本，`playerNationId='n01'` |
| `createWorldState(seed, playerNationId?)` | `→ GameState` | 205 国世界，seeded 生成 |
| `buildProvinces(playerId)` | `→ Record<string,Province>` | 省份初始化（assimilation 按 playerId） |
| `buildNations()` | `→ Record<string,Nation>` | 5 国手写 |
| `provincesOf(nationId, provinces)` | `→ Province[]` | 取某国所有省份 |
| `findRelation(relations, from, to)` | `→ DiplomaticRelation?` | 查找外交关系 |

### `engine/worldgen.ts` — 世界生成器
`generateWorld(seed, playerNationId?)` → `WorldGenResult`：产出 205 国 / 597 省 / 稀疏外交。基于 12 大洲模板（`data/regions.ts`）+ 16 关键国手写覆盖。

### `engine/turn.ts` — 回合结算总入口
`processTurn(state)` → `{ state, report }`：按序调用各 engine：
1. `settleEconomy`（玩家+AI）
2. `settlePopulation`
3. `settlePolitics` + `lawPerTurnEffects`（C2）
4. `settleTechnology`
5. `settleCultureReligion`
6. `settleDiplomacy`
7. `resolveWars`
8. `rollEvents` + `applyEffect`
9. `processAITurn`（三档分层）
10. `checkVictory`
11. `ageRulers`（王朝）
12. 清理过期 wars/triggeredEvents

`recordPlayerAction(state, actionId)`：记录玩家行为到 `tendency`，影响国家性格。

### `engine/formulas.ts` — 所有数值公式集中处
| 函数 | 对应文档 | 说明 |
|------|---------|------|
| `computeTax(input)` | §2.1 | 税收 = pop × rate × eff × stabilityMod × corruptionMod × assimilationMod |
| `stabilityTaxModifier(stability)` | — | ≥60→1.2, ≥40→1.0, ≥30→0.8, else 0.5 |
| `corruptionModifier(corruption)` | — | clamp(1 - corruption/200, 0.5, 1.0) |
| `assimilationModifier(assimilation)` | — | clamp(0.7 + assimilation/300, 0.7, 1.0) |
| `computeFood(input)` | §2.2 | agriBase × peasant × terrainMod × agriTechMod × infraMod |
| `TERRAIN_FOOD_MOD` | — | 11 地形修正表 |
| `agriTechModifier(lv)` | — | 1 + lv × 0.08 |
| `computeCorruptionLoss(tax, corruption)` | §2.3 | tax × corruption / 200 |
| `computeTrade(input)` | §2.4 | base × marketMod × dealMod × charMod × safety |
| `legitimacyDelta(...)` | §3.1 | 派系满意度/腐败/厌战/改革冲击 |
| `stabilityDelta(...)` | §3.2 | 合法性/派系加权/不满/厌战/叛乱省数 |
| `reformSuccessRate(...)` | §3.3 | 改革成功率 |
| `maxProvinces(...)` | §3.4 | 可管省数（按 tier：S:50/A:25/B:12/C:6/D:3） |

### `engine/economy.ts` — 经济系统
| 函数 | 职责 |
|------|------|
| `settleEconomy(nation, state)` | 税收/贸易/建筑/腐败/军费/粮产/木铁 + C3 贸易路线收益 |
| `establishTradeRoute(nation, routeId, state)` | C3 建立路线（政体/科技/归属/金检查） |
| `availableTradeRoutes(nation, state)` | C3 可建立路线列表（前端用） |
| `routeYieldEstimate(routeId)` | C3 路线收益估算 |
| `canAfford / spend` | 资源检查/扣除 |

### `engine/politics.ts` — 政治系统
| 函数 | 职责 |
|------|------|
| `settlePolitics(nation, state)` | 稳定度 v3 分段回归（<40:+5 / <60:+3 / <75:+1.5 / else:-2） + 合法性 + 腐败演变 |
| `enactPolicy(nation, policyId, state)` | 推行政策（政体/科技/金检查 + effects + 派系反应） |
| `enactLaw(nation, lawId, state)` | C2 推行法律（政体/科技/互斥/金 + effects + 派系反应） |
| `lawPerTurnEffects(nation, provs)` | C2 每回合法律效果（unrest/rebellion 削减） |
| `changeGovernment(nation, newGov, state)` | 切换政体 |
| `maxManageableProvinces(nation)` | 可管省数 |
| `overExtensionPenalty(nation, count)` | 超管惩罚 |

### `engine/population.ts` — 人口系统
`settlePopulation(nation, state)`：人口增长 = 基础率 × 粮食充足度 × 稳定度 × 战争 × 疾病；阶层满意度演变。

### `engine/military.ts` — 军事系统
| 函数 | 职责 |
|------|------|
| `declareWar(state, attacker, defender, provId)` | 宣战 |
| `resolveWars(state)` | 战略层结算（兵力×士气×训练×装备×科技×地形×补给） |
| `computeCombatPower(army, mods)` | 战斗力 |

### `engine/diplomacy.ts` — 外交系统
| 函数 | 职责 |
|------|------|
| `getDefaultRelation(from, to, state)` | DEC-013 默认关系即时计算（文化/宗教/距离） |
| `getRelation(from, to, state)` | 取关系值（稀疏优先，无则默认） |
| `settleDiplomacy(state)` | 每回合关系漂移 + 停战倒计时 |
| `improveRelation / establishTrade / formAlliance / breakTreaty` | 外交行动 |

### `engine/technology.ts` — 科技系统
`settleTechnology(nation, state)` + `startResearch(nation, techId)`：研发进度累积，完成后升级对应路线等级。

### `engine/culture.ts` — 文化宗教系统
`settleCultureReligion(nation, state)`：同化度/忠诚度演变，叛乱触发。

### `engine/events.ts` — 事件系统
| 函数 | 职责 |
|------|------|
| `checkTrigger(trigger, nation, state)` | 判定触发条件 |
| `rollEvents(nation, state, rng, max)` | 每回合抽取事件（权重池） |
| `applyEffect(nation, effect, state)` | 应用效果 + C1 triggerEvent 入队 pendingEvents |
| `aiChooseOption(event, rng)` | AI 按 aiWeight 选选项 |
| `recordEvent(state, nationId, eventId, optIdx)` | 记录触发 + 冷却 |

### `engine/ai.ts` — AI 三档分层（DEC-014）
| 函数 | 适用 | 职责 |
|------|------|------|
| `planAITurn(nation, state, rng)` | S/A | 完整决策（含 A4 缺粮建农场） |
| `executeAIAction(nation, action, state)` | S/A | 执行行动 |
| `processAITurnFull(nation, state, rng)` | S/A+玩家邻国 | 完整结算 |
| `processAITurnLite(nation, state, rng)` | B/C | 简化决策（建农田/市场/调税） |
| `processAITurnStatic(nation, state)` | D（每5回合） | 稳定度回归 + A5 食物兜底建农场 |
| `processAITurn(state)` | 全 AI | 按 tier 分派 |

### `engine/dynasty.ts` — 王朝系统
`tryBirthHeir` / `ageRulers` / `reignLegitimacy`：继承人生成、统治者老化即位、在位年数影响合法性。

### `engine/migration.ts` — 存档迁移
`migrate(save)`：按版本号顺序应用迁移函数。`SAVE_VERSION` 在 `types/game.ts`。

---

## 4. 状态层 `store/gameStore.ts`

Zustand store。`pid(s)` helper = `s.playerNationId || PLAYER_ID`。

| Action | 职责 |
|--------|------|
| `startScenario(id)` | 选剧本（classic 直接开；world/eastasia 需选国） |
| `startWithNation(nationId)` | 选定玩家国后开始 |
| `nextTurn` | `processTurn(cur)` + 更新 state |
| `setTaxRate` | 调税率（0-0.5） |
| `appeaseFaction / build / recruit / research / improveRelation` | 玩家行动 |
| `enactPolicy` | 推行政策（应用 effects + 派系反应 + recordPlayerAction） |
| `enactLaw` | C2 推行法律 |
| `establishTradeRoute` | C3 建立贸易路线 |
| `upgradeBuilding` | 建筑升级（成本 = costGold × 0.6 × level，max 3） |
| `save / load / clearSave / hasSave` | localStorage 存档 |

`persistence.ts`：读写 localStorage + 版本校验 + migrate。

---

## 5. UI 层 `screens/`

13 个 screen，全部用 `state.playerNationId`（A1 修复后）：

| Screen | 职责 |
|--------|------|
| `ScenarioSelect` | 开场选剧本+选国 |
| `WorldMap` | SVG 世界地图（省份色块按归属，玩家金边） |
| `Dashboard` | 总览（警报+四大核心+治理仪表+邦国摘要+王朝） |
| `ProvinceScreen` | 省份列表+详情+建筑升级+建设+征兵 |
| `EconomyScreen` | 税率滑块+收支+C3 贸易路线 |
| `PopulationScreen` | 阶层汇总+派系安抚 |
| `PoliticsScreen` | 政体+政策页签+C2 法律页签 |
| `MilitaryScreen` | 军力+战争进度+宣战+征兵 |
| `DiplomacyScreen` | 各国关系卡片+外交行动 |
| `TechnologyScreen` | 3 路线科技树+研发 |
| `EventModal` | 事件弹窗+选项效果提示 |
| `TurnReportScreen` | 回合报告叙事流 |
| `SaveLoadScreen` | 存档管理 |

`components/ui.tsx`：通用组件（Panel/Stat/StatRow/Btn/Tag/Bar/Divider/StatusDot/ResourceStrip）。

---

## 6. 调用关系图（核心）

```
App.tsx
  └─ useGameStore
       └─ processTurn (turn.ts)
            ├─ settleEconomy (economy.ts) ── formulas.ts ── data/buildings,trade-routes
            ├─ settlePopulation (population.ts)
            ├─ settlePolitics (politics.ts) ── formulas.ts ── data/governments,policies,laws
            │    └─ lawPerTurnEffects (C2)
            ├─ settleTechnology (technology.ts) ── data/technologies
            ├─ settleCultureReligion (culture.ts)
            ├─ settleDiplomacy (diplomacy.ts)
            ├─ resolveWars (military.ts)
            ├─ rollEvents (events.ts) ── data/events
            │    └─ applyEffect ── triggerEvent 入队 (C1)
            ├─ processAITurn (ai.ts) ── 三档分层
            │    ├─ processAITurnFull (S/A)
            │    ├─ processAITurnLite (B/C)
            │    └─ processAITurnStatic (D) ── A5 食物兜底
            ├─ checkVictory
            └─ ageRulers (dynasty.ts)
```

---

## 7. 测试

```
npm test → 48/48
  formulas.test    27 tests  （公式手算对照）
  worldgen.test     7 tests  （世界生成）
  turn.test         6 tests  （5 国回合结算）
  world-smoke.test  8 tests  （205 国烟雾 + A2/A5/C1 新测试）
npm run typecheck → ✅
npm run validate  → ✅ 103 事件 0 错误
```

---

## 8. 性能（DEC-015）

50 回合 205 国世界：< 4s（world-smoke.test 实测）。预算 <800ms/回合。
`utils/perf.ts` 计时工具。

---

## 9. 存档版本化（DEC-005）

`SaveGame { version, createdAt, gameState }`。`migration.ts` 按版本顺序迁移。当前 `SAVE_VERSION` 在 `types/game.ts`。
