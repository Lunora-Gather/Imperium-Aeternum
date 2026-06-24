# Imperium Aeternum — 扩展设计 v1

> **FROZEN v1** — v2 §2 表格标注的阶段 6 产出。每扩展项含：依赖钩子 + 优先级 + 实现路径 + 红线约束。
> 所有扩展受 v2 §3.2 当前阶段红线约束（解锁需 DEC-NNN）。

---

## 0. 扩展总览

| ID | 扩展项 | 优先级 | 依赖 MVP 钩子 | 红线状态 |
|----|--------|--------|--------------|---------|
| E1 | 战争演出层 | P2 | `military.ts resolveWars` | 永久红线（不做即时战斗），只做"结算叙事增强" |
| E2 | 外交链扩展 | P1 | `diplomacy.ts getRelation` | 当前阶段红线（条约类型不扩） |
| E3 | 科技树扩展 | P2 | `technology.ts` | 当前阶段红线（不超 3×8） |
| E4 | 随机地图 | P1 | `worldgen.ts generateWorld` | 已突破（worldgen 已存在） |
| E5 | 剧本模式 | P1 | `store startScenario` | 已突破（C4 已加 3 剧本） |
| E6 | 事件链扩展 | P1 | `events.ts triggerEvent`（C1 已激活） | 当前红线（事件≤100，当前 103 需 DEC） |
| E7 | 王朝深化 | P2 | `dynasty.ts` | 无红线 |
| E8 | 阶层流动 | P2 | `population.ts` | 无红线 |
| E9 | 性能优化 | P0 | `ai.ts` 三档分层 | 无红线 |
| E10 | UI 打磨 | P1 | `screens/*` | 无红线 |

---

## E1. 战争演出层（P2，叙事增强非即时战斗）

**依赖**：`engine/military.ts resolveWars` 已返回战果。

**设计**：不做即时战斗（永久红线），在 `TurnReport` 加 `warNarrative` 字段，把战果翻译成叙事段。
- 例："本年罗马军 8000 攻迦太基 5000，因山地不利 + 补给不足，惨胜，损兵 2000，敌损 3000，未占省。"
- 触发条件：`resolveWars` 返回的 `battleResult` 含双方兵力/损失/地形/补给。
- UI：`TurnReportScreen` 加"战报"小节，用叙事流展示。

**实现路径**：
1. `military.ts` 的 `resolveWars` 返回 `{ winner, attackerLoss, defenderLoss, terrainMod, supplyMod, occupied }`
2. `turn.ts` 把战果拼成叙事字符串存入 `TurnReport.warNarrative[]`
3. `TurnReportScreen.tsx` 加战报小节

**红线**：不做单位移动、不做战术指令、不做战场画面。

---

## E2. 外交链扩展（P1）

**依赖**：`diplomacy.ts` 的 `TreatyType`（当前 none/trade/alliance/war/truce）。

**设计**：加 2 种条约类型（需 DEC 解锁当前红线）：
- `vassalage`（附庸）：附庸国每回合向宗主进贡 10% 税收，宗主有义务保护
- `guarantee`（保证）：保证国承诺保护被保证国免受第三方攻击，违约降合法性

**实现路径**：
1. `types/game.ts` 的 `TreatyType` 加 `'vassalage' | 'guarantee'`
2. `diplomacy.ts` 加 `formVassalage / formGuarantee` 函数
3. `turn.ts` 结算时附庸进贡 + 保证国参战逻辑
4. `DiplomacyScreen.tsx` 加按钮

**红线解锁**：需 DEC-NNN 说明为何扩条约类型（当前红线"复杂外交链不扩"）。

---

## E3. 科技树扩展（P2）

**依赖**：`technology.ts` 的 3 路线 × 8 级。

**设计**：当前红线"不超 3×8"。扩展方向：
- 加第 4 路线 `culture`（文化科技）：影响同化速度/文化输出/外交影响力
- 或在现有路线加"分支 specialization"（如 agri 选灌溉/轮作/梯田三 specialization）

**红线解锁**：需 DEC-NNN，且需评估对 `formulas.ts` 的影响。

---

## E4. 随机地图（P1，已实质突破）

**依赖**：`worldgen.ts generateWorld(seed)` 已存在。

**当前状态**：已落地（DEC-018），seeded 生成 205 国 597 省。C4 加了 `regionFilter` 支持区域剧本。

**剩余扩展**：
- 地形对战斗的详细修正（当前 `TERRAIN_FOOD_MOD` 只有农业，战斗修正简化）
- 河流航运路线（`hasRiver` 字段已存，未用于贸易路线增益）
- 气候灾害事件（`climate` 字段已存，可触发旱灾/寒冬事件）

**实现路径**：
1. `formulas.ts` 加 `TERRAIN_COMBAT_MOD` 表
2. `military.ts resolveBattle` 应用地形战斗修正
3. `events.ts` 加气候灾害事件（触发条件含 `climate`）

---

## E5. 剧本模式（P1，已部分突破）

**依赖**：`store startScenario / startWithNation`。

**当前状态**：6 剧本（classic/world/eastasia/W3/W5/W6）。

**剩余扩展**：
- **历史剧本**：特定年份开局（如布匿战争前夕、三国鼎立），预设国家关系/战争状态
- **挑战剧本**：限定胜利条件（如"100 回合内统一地中海"）
- **沙盒剧本**：无胜利条件，纯养成

**实现路径**：
1. `data/scenarios.ts` 新建（独立剧本定义表，含开局 `GameState` patch）
2. `store startScenario` 支持应用 patch（预设战争/关系/资源）

---

## E6. 事件链扩展（P1）

**依赖**：`events.ts applyEffect` 的 `triggerEvent`（C1 已激活）。

**当前状态**：3 链 9 事件（瘟疫/王位继承/边境冲突）。当前红线"事件≤100"，已 103 需 DEC 解锁。

**扩展方向**：
- **宗教链**：异教兴起→迫害→圣战→妥协（4 事件）
- **经济链**：商路断绝→走私→重开→繁荣（4 事件）
- **科技链**：发明→推广→争议→定型（4 事件）
- **贵族链**：逼宫→妥协→反扑→清算（4 事件）

**实现路径**：
1. `events.ts` 加 4 链 16 事件（总 119，需 DEC 解锁红线到 120）
2. 每链首 weight>0，链中/尾 weight=0
3. 加链触发测试

---

## E7. 王朝深化（P2）

**依赖**：`dynasty.ts` 已有 `tryBirthHeir / ageRulers`。

**扩展方向**：
- 统治者特性（每代 1-2 个 trait，如"雄才"/"昏庸"/"仁厚"，影响 ability 修正）
- 联姻外交（与其他国家联姻提升关系 + 产生有继承权的后代）
- 篡位事件（合法性过低时将军/贵族篡位，换 dynasty）

**实现路径**：
1. `types/game.ts` 的 `Ruler` 加 `traits: string[]`
2. `dynasty.ts` 加 `rollRulerTrait(rng)` + `marriageDiplomacy` + `usurpationCheck`
3. `Dashboard.tsx` 显示 traits

---

## E8. 阶层流动（P2）

**依赖**：`population.ts` 的 `PopulationGroup`。

**扩展方向**：
- 阶层升降：农民→工人→商人（基于基建/教育投资），商人→贵族（基于财富+政治）
- 阶层冲突：贵族 vs 商人（商业共和国）、军方 vs 民众（军政府）的动态张力
- 阶层政策：每个政策有阶层偏好，长期推行改变阶层结构

**实现路径**：
1. `population.ts` 加 `classMobility(nation, state)` 每回合阶层流动
2. `formulas.ts` 加阶层流动率公式（基于教育/基建/政策）
3. `PopulationScreen.tsx` 显示阶层流动趋势

---

## E9. 性能优化（P0，当前优先）

**依赖**：`ai.ts` 三档分层（DEC-014）。

**当前状态**：50 回合 205 国 ~4s（world-smoke.test 实测），预算 <800ms/回合。

**优化方向**：
- AI Static 档从每 5 回合改为每 10 回合（D 级 95 国，减半负载）
- `relations` 稀疏数组用 Map 替代 Array.find（当前 O(n) 查找）
- `provincesOf` 缓存（每回合多次调用，可 memoize）
- 省份 `buildings` 数组去重检查用 Set

**实现路径**：
1. `ai.ts` 的 `processAITurn` 调度逻辑改 Static 档频率
2. `GameState.relations` 改 `Map<string, DiplomaticRelation>`（key = from→to）
3. `init.ts` 的 `provincesOf` 加 WeakMap 缓存

**验收**：50 回合 205 国 < 2s（当前 4s）。

---

## E10. UI 打磨（P1）

**依赖**：`screens/*` + `components/ui.tsx`。

**扩展方向**：
- 省份详情弹窗（点击地图省份弹详情，而非切换页签）
- 资源趋势图（Dashboard 加 5 回合金/粮/稳定 sparkline）
- 事件历史回顾（EventModal 加"已处理事件"列表）
- 暗色/亮色主题打磨（当前已有切换，可加更多主题）

**实现路径**：
1. `WorldMap.tsx` 省份点击改弹窗
2. `Dashboard.tsx` 加 sparkline（需 `GameState` 存历史快照，或从 `TurnReport` 回看）
3. `EventModal.tsx` 加历史列表

---

## 优先级排序与建议执行序

| 顺序 | 扩展 | 理由 |
|------|------|------|
| 1 | E9 性能优化 | P0，影响可玩性，无红线 |
| 2 | E6 事件链扩展 | P1，C1 已激活引擎，扩内容即可 |
| 3 | E5 剧本模式 | P1，C4 已加区域剧本，历史剧本是自然延伸 |
| 4 | E10 UI 打磨 | P1，提升体验 |
| 5 | E2 外交链 | P1，需 DEC 解锁红线 |
| 6 | E7 王朝深化 | P2，无红线 |
| 7 | E8 阶层流动 | P2，无红线 |
| 8 | E4 随机地图细化 | P1，已部分落地 |
| 9 | E3 科技树扩展 | P2，需 DEC 解锁红线 |
| 10 | E1 战争演出 | P2，永久红线限制只做叙事 |

---

## 红线解锁清单

若要实施 E2/E3/E6，需在 `docs/decisions.md` 登记 DEC：
- E2：解锁"复杂外交链不扩"红线，加 vassalage/guarantee 条约
- E3：解锁"科技不超 3×8"红线，加第 4 路线或 specialization
- E6：解锁"事件≤100"红线，提到 120

每条 DEC 需含：背景、决策、影响、替代方案。

---

> 本文件为扩展设计基线，后续实施每项需走 DEC-NNN + 验证清单。
