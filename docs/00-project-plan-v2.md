# Imperium Aeternum — GLM-5.2 能力适配规划 v2

> **FROZEN v2** — 本文件为针对 GLM-5.2 能力特征、面向当前代码实际状态的迭代规划基线。
> 它**取代** `docs/00-project-plan.md`(v1) 的"后续阶段指导"作用，但不删除 v1（v1 仍是历史决策记录，走 DEC 撤销）。
> v1 的 §11 红线（"AI≤4 国 / 省份≤12 / 固定 10 省"）已被项目实际进展**突破**，本文件在 §3 正式登记该偏离。

---

## 0. 为什么需要 v2

### 0.1 现状摸底（2026-06-24 硬证据）

| 维度 | v1 规划要求 | 实际代码 | 偏离 |
|------|------------|---------|------|
| 国家数 | ≤4 AI + 玩家 = 5 | **205 国**（16 KEY + 189 程序生成） | 突破 |
| 省份数 | ≤12，固定 | **597 省**，seeded 随机世界 | 突破 |
| AI 档位 | 单档权重 | **三档**（Full/Lite/Static，按 tier S/A/B/C/D） | 超出 |
| 地图 | 固定 10 省 | SVG 世界地图 + 12 大洲 + seed | 突破 |
| 测试 | 公式单测 | 44 测试全绿（含 192 国 50 回合烟雾） | 达标+ |
| 阶段 1-6 文档 | 待产出 | 01/02/06 已存，03/04/05 缺 | 部分 |
| typecheck | — | ✅ 通过 | — |
| `PLAYER_ID` 硬编码 | 未提 | **P0 未完成**：13 个 screen + store + ai/init/turn 共 ~40 处仍用 `'n01'` 常量 | 阻塞多剧本选国 |

### 0.2 v1 规划的得失

**v1 做对的（v2 继承）**：
- 阶段产出契约化（A 交付物 / B 决策 / C 验证清单）→ 保留
- 冻结点 + ADR（`docs/decisions.md`）→ 保留
- 公式集中到 `engine/formulas.ts` + 单测手算对照 → 已落地，保留
- seeded RNG（`utils/random.ts` mulberry32）→ 已落地，保留
- 存档 version + migration 思路 → 保留（已实现 `SAVE_VERSION`）
- `npm run validate` 数据自检硬门槛 → 已落地（`data/__validate__.ts`），保留
- thinking effort 分档 → 保留，但**重新校准**（见 §6）

**v1 失准的（v2 修正）**：
- §11 红线 13 条把"小而精 MVP"锁死，但项目已走向"大世界 + 多剧本"路线，红线与现实脱节 → §3 重立红线
- v1 假设"从零开始按 1→6 阶段推进"，但代码已到"5c 之后 + 世界扩展"阶段 → v2 改为**增量修复 + 扩展**路线
- v1 没规划"世界生成器 / 多剧本 / 动态玩家 ID"这些已存在的大模块 → v2 §4 纳入
- v1 没给 GLM-5.2 的**长上下文漂移**针对性 mitigation（只靠冻结点）→ v2 §5 加强
- v1 没给"会话交接"格式 → 实际已演化出 `docs/handoff.md`，v2 §7 正式化

### 0.3 v2 的核心定位

> v2 不是"重新规划游戏"，而是"**给 GLM-5.2 一份贴合当前代码状态、能让它在长会话中稳定推进剩余工作的执行手册**"。

GLM-5.2 的能力特征 → v2 的对应手段：

| GLM-5.2 能力 | v2 手段 |
|--------------|---------|
| 稳定 1M context | §5 会话分段 + handoff 文档化，让单会话不必装全部历史 |
| 长程工程任务 | §4 把剩余工作拆成"修复 / 收尾 / 扩展"三轨，每轨独立可验收 |
| 代码能力 | §8 给出每个待改文件的**精确改动契约**（不只是"改 PLAYER_ID"，而是逐文件清单） |
| agent 式执行 | §9 给每轨一个可直接复制的启动 prompt，含冻结基线引用 |
| thinking effort 可调 | §6 按"修复 / 设计 / 数据 / 代码"四类重新分档 |
| 易过度扩展 | §3 重立红线 + 每轨"不做清单" |

---

## 1. 项目顶层结构（现状冻结）

当前实际目录（已超出 v1 §1，但结构健康，无需重构）：

```
imperium-aeternum/
  docs/
    00-project-plan.md         # v1（历史，保留）
    00-project-plan-v2.md      # 本文件
    01-design-bible.md         # 阶段1产出（已存）
    02-system-rules.md         # 阶段2产出（已存）
    06-expansion.md            # 阶段6产出（已存）
    world-expansion-plan.md    # 世界扩展专项（已存）
    formulas.md                # 公式总表
    decisions.md               # ADR
    handoff.md                 # 会话交接（v2 §7 正式化）
  src/
    data/        nations provinces buildings technologies policies
                 governments factions events national-characters regions
                 __validate__.ts
    engine/      formulas economy population politics military diplomacy
                 technology culture events ai turn init worldgen dynasty
    store/       gameStore persistence
    types/       game
    utils/       math random id perf
    screens/     13 个（见 §8）
    components/  ui.tsx
    __tests__/   formulas turn worldgen world-smoke
  scripts/       deep-diag diag-han diag-qin stab-detail world-audit world-evidence
```

**冻结说明**：此结构冻结。新增模块走新文件，不得移动已有文件。结构变更走 DEC-NNN。

---

## 2. 当前代码状态基线（冻结快照）

```
日期: 2026-06-24
npm run typecheck  → ✅
npm test           → ✅ 44/44
npm run validate   → ✅（v1 阶段3b 门槛）
世界: 205 国 / 597 省 / 12 洲 / 1717 稀疏外交关系
tier 分布: S:2 A:7 B:30 C:71 D:95
50 回合性能: 2.3s（world-smoke.test 实测）
玩家 50 回合后: 金 209116 粮 473099 稳 100 法 100
NaN: 0 | 问题国: 0
```

**已知遗留（按优先级）**：

| ID | 类型 | 描述 | 阻塞 |
|----|------|------|------|
| P0 | 正确性 | `PLAYER_ID='n01'` 硬编码散布在 store + 13 screen + ai/init/turn，选非 n01 剧本即崩 | 多剧本选国 |
| P1 | 完整性 | `docs/03-data-tables.md`、`04-architecture.md`、`05-mvp-notes.md` 缺失 | 文档闭环 |
| P2 | 玩法 | A 级稳定度仍偏低 ~41；9 国负粮；D 级 1 国负粮边界 | 长期对局 |
| P3 | 内容 | 事件 60（目标 80+ 含事件链）；法律树 / 贸易路线 / 更多剧本缺 | 内容厚度 |
| P4 | UI | 5 国剧本无世界地图（硬编码省份可能缺 x/y） | 小剧本体验 |

---

## 3. MVP 红线 v2（取代 v1 §11）

v1 红线已过时。v2 红线分两类：**永久红线**（任何阶段不得破）+ **当前阶段红线**（解锁需 DEC）。

### 3.1 永久红线（永久不得引入）

- ❌ 即时战斗 / 战斗演出（永远只做战略层结算）
- ❌ 联机（永远单人）
- ❌ 美术资源 / 音效音乐（永远纯 CSS + SVG 几何）
- ❌ 多语言（永远先中文，UI 文案集中）
- ❌ 自定义国家编辑器（玩家永远从预设剧本选国）
- ❌ 移植到 Godot/Unity（永远 Web，除非另立项目）

### 3.2 当前阶段红线（解锁需 DEC-NNN + 验证）

- ❌ 回合长度切换（固定 1 回合 = 1 年）
- ❌ 科技树超过 3 条 × 8 级（当前已扩到 8 级，不得再扩）
- ❌ 事件超过 100 个（当前 60，扩到 80 含事件链是 P3 目标）
- ❌ 国家数超过 250（当前 205，性能边界）
- ❌ 省份数超过 800（当前 597，性能边界）
- ❌ 多存档槽（先单槽）
- ❌ 把公式从 `formulas.ts` 散到别处（永远集中）
- ❌ 把 seeded RNG 换成 Math.random（永远 seeded）

**任何阶段产出若引入上述内容，视为违反契约，需重做。**

---

## 4. 剩余工作三轨规划

v1 的"1→6 阶段"已不适用。v2 把剩余工作拆成**三条独立轨道**，每轨有自己的验收点，可并行或串行。

### 轨道 A：正确性修复（P0 + P2）

> 目标：让"选任意剧本任意国"都能稳定跑 100 回合不崩。

| 步骤 | 产出 | 验收 |
|------|------|------|
| A1 | 完成 `PLAYER_ID` 全量替换为 `state.playerNationId`（store + 13 screen + ai/init/turn 中的玩家侧引用） | typecheck ✅ + 选非 n01 剧本能进游戏且 Dashboard 显示正确国家 |
| A2 | 加 e2e 烟雾测试：`createWorldState(seed, 'n02')` 推 50 回合无 NaN + 玩家国家非 n01 | `npm test` 全绿 |
| A3 | A 级稳定度调参（`stabilityDelta` 参数微调，目标 ~55） | `scripts/world-audit.ts` 报告 A 级均稳定 ≥ 50 |
| A4 | AI 缺粮时优先建农场（ai.ts 加决策分支） | `world-audit.ts` 报告负粮国 ≤ 3 |
| A5 | D 级负粮边界（ai.ts Static 档加最小食物兜底） | 负粮国 = 0 |

**thinking effort**: high（涉及正确性，每步都要验）
**不做**: 不重构 ai.ts 结构，只加分支；不调公式本体，只调参

### 轨道 B：文档闭环（P1）

> 目标：让 docs/ 反映真实代码，新会话能从文档自举。

| 步骤 | 产出 | 验收 |
|------|------|------|
| B1 | `docs/03-data-tables.md`：从现有 `src/data/*.ts` 反向生成数据圣经（国家/省份/建筑/科技/政体/政策/派系/事件/国家性格） | 文档与代码字段一一对应 |
| B2 | `docs/04-architecture.md`：从现有 `src/engine/*.ts` 反向生成架构文档（每个 engine 文件职责 + 关键函数签名 + 调用关系） | 含调用关系图 |
| B3 | `docs/05-mvp-notes.md`：从 git 历史和 handoff 反向生成开发日志（关键修复 + DEC 索引） | 含 DEC-001 ~ DEC-NNN 索引 |
| B4 | 更新 `docs/decisions.md`：补登记"v1 红线突破"相关 DEC（世界扩展、三档 AI、动态玩家 ID 等） | 每个偏离 v1 §11 的决策有 ADR |

**thinking effort**: medium（偏机械，重在准确）
**不做**: 不重写已存的 01/02/06；不写新设计，只记录现状

### 轨道 C：内容与体验扩展（P3 + P4）

> 目标：把"能跑"提升到"好玩"。

| 步骤 | 产出 | 验收 |
|------|------|------|
| C1 | 事件扩到 80，含 3 条事件链（瘟疫链 / 王位继承链 / 边境冲突链） | 事件链能按 turn 序列触发 |
| C2 | 法律树（`data/laws.ts` + `engine/politics.ts` 加 enactLaw） | PoliticsScreen 有法律页签 |
| C3 | 贸易路线（`data/trade-routes.ts` + `engine/economy.ts` 加路线收益） | EconomyScreen 显示路线 |
| C4 | 更多剧本 W3/W5/W6（`ScenarioSelect.tsx` 加选项） | 每剧本能开局 |
| C5 | 5 国剧本省份补 x/y 坐标 | WorldMap 在 5 国剧本下正常显示 |

**thinking effort**: C1/C2 high（含新机制），C3/C4/C5 medium
**不做**: 不做随机地图生成器扩展（已有 worldgen）；不做新政体；不做新国家性格（当前 11 够用）

### 三轨优先级与依赖

```
A1 ── A2 ── (A3/A4/A5 可并行)
                │
                └──→ C4（更多剧本依赖 A1 的动态玩家 ID）
B1/B2/B3/B4 互相独立，任何时候可做
C1/C2/C3 互相独立，任何时候可做
C5 独立
```

**建议执行顺序**：先 A1+A2（解锁多剧本），再 B4（补 ADR），然后 A3/A4/A5 与 B1/B2/B3 并行，最后 C 轨。

---

## 5. 长上下文漂移的强化 mitigation（v2 新增）

GLM-5.2 在 1M context 下仍可能漂移。v1 只靠冻结点，v2 加三层：

### 5.1 会话分段契约

每个会话**只做一轨的一步**（如 A1）。会话结束时**必须**产出 `docs/handoff.md` 更新（见 §7）。下个会话从 handoff 启动，不靠模型回忆。

### 5.2 引用而非重述

代码生成时，prompt 里**引用冻结文档的小节号**，不要求模型重述设计。例：

> ✅ "实现 A4：在 `engine/ai.ts` 的 `processAITurnFull` 里，当 `nation.resources.food < consumption*2` 时插入建农场决策。不得改其他分支。"
>
> ❌ "给 AI 加缺粮逻辑"（太宽，模型会重写整个 ai.ts）

### 5.3 改动边界声明

每个启动 prompt **显式列出可改文件清单**，清单外文件不得动。例：

> "本次可改文件：`src/engine/ai.ts`、`src/__tests__/world-smoke.test.ts`。其他文件只读。"

这能把 GLM-5.2 的"顺手重构"倾向约束在边界内。

---

## 6. thinking effort 分档 v2（取代 v1 §10）

| 工作类型 | effort | 理由 |
|---------|--------|------|
| 轨道 A（正确性修复） | **high** | 涉及玩家 ID 全量替换，漏一处即崩 |
| 轨道 B（文档闭环） | **medium** | 偏机械记录，重在准确不漏 |
| 轨道 C1/C2（新机制） | **high** | 事件链 / 法律树是新逻辑 |
| 轨道 C3/C4/C5（内容补全） | **medium** | 按现有模板填 |
| 公式调参（A3） | **high** | 数值敏感，需多轮回放验证 |
| 数据扩充（C1 事件） | **medium** | 按现有事件 schema 填 |
| UI 改动 | **medium** | 按现有 ui.tsx 组件库拼 |

---

## 7. 会话交接文档格式（`docs/handoff.md` 正式化）

`handoff.md` 已事实存在，v2 把它的格式冻结。每个会话结束**必须**更新它，结构：

```markdown
# Imperium Aeternum — 会话交接

> YYYY-MM-DD 最终状态：[一句话]

## 验证结果（硬证据）
- npm run typecheck → ✅/❌
- npm test → ✅/❌ N/N
- 其他脚本

## 本次完成
| 改动 | 文件 | 验证 |

## 未完成 / 进行中
- [ ] 任务 + 当前状态 + 卡在哪

## 关键文件索引（本会话涉及）

## 下次继续
- 优先级排序的下一步
```

**规则**：handoff 是唯一跨会话的"活文档"，可随时改。其他 docs/ 一旦 FROZEN 不得改，改走 DEC。

---

## 8. 轨道 A 精确改动契约（P0 详细清单）

> 这是 v2 给 GLM-5.2 的**最具操作性**部分：把"替换 PLAYER_ID"拆成逐文件清单。

### 8.1 替换原则

`PLAYER_ID` 在代码里有**两种用途**，替换策略不同：

| 用途 | 例子 | 替换为 |
|------|------|--------|
| 取玩家国家对象 | `state.nations[PLAYER_ID]` | `state.nations[state.playerNationId]`（screen 里）/ `state.nations[pid(s)]`（store 里已有 helper） |
| 玩家省份归属判断 | `prov.ownerId === PLAYER_ID` | `prov.ownerId === state.playerNationId` |
| 玩家外交关系查找 | `r.from === PLAYER_ID` | `r.from === state.playerNationId` |
| **数据表常量定义** | `data/nations.ts` 里 `export const PLAYER_ID` | **保留**（5 国剧本默认值 + store 的 `pid` fallback） |
| **init 里设默认值** | `init.ts` 里 `playerNationId: PLAYER_ID` | **保留**（5 国剧本默认就是 n01） |
| **测试里固定剧本** | `turn.test.ts` 里用 `PLAYER_ID` | **保留**（测试就是测 5 国默认剧本） |

### 8.2 逐文件改动清单

| 文件 | 当前 PLAYER_ID 用途 | 改动 |
|------|--------------------|------|
| `App.tsx` | L54 取 player、L58 provs、L60 atWar、L183 pendingEvents | 全改 `state.playerNationId` |
| `Dashboard.tsx` | L9/10/13 | 全改 `state.playerNationId` |
| `EconomyScreen.tsx` | L8 | 改 |
| `MilitaryScreen.tsx` | L10/11/12/16/64/91/92 | 全改 |
| `DiplomacyScreen.tsx` | L16/17/19/20/23/24/25/50 | 全改 |
| `PoliticsScreen.tsx` | L11 | 改 |
| `PopulationScreen.tsx` | L19/20 | 改 |
| `ProvinceScreen.tsx` | L24/97/115 | 改（97/115 是取 player.resources.gold） |
| `TechnologyScreen.tsx` | L14 | 改 |
| `EventModal.tsx` | L40/48/51 | 改 |
| `SaveLoadScreen.tsx` | L9/10 | 改 |
| `WorldMap.tsx` | L30/35/36/59/87 | 改 |
| `ScenarioSelect.tsx` | （需读确认是否有） | 读后定 |
| `store/gameStore.ts` | L193/222/235/270/312（ownership/army/relation） | 改为 `pid(s)`；L17 helper 已有保留 |
| `engine/ai.ts` | L7 import、L303 isPlayerNeighbor | L303 改 `state.playerNationId`；L7 import 保留（其他地方可能用） |
| `engine/init.ts` | L11 import、L114/115 assimilation/loyalty、L165 设默认 | L114/115 改 `p.ownerId === state.playerNationId`（但 init 时 state 还在建，需用本地变量）；L165 保留 |
| `engine/turn.ts` | L23 import、L28 fallback | **保留**（`findPlayerId` 已是动态逻辑，PLAYER_ID 只是 fallback） |
| `data/__validate__.ts` | L5/37 | **保留**（验证脚本就是验 5 国数据） |
| `__tests__/turn.test.ts` | L8/30/89/90/101/102/108/111/113 | **保留**（测 5 国默认剧本） |

### 8.3 `init.ts` 的特殊处理

L114-115 在 `buildProvinces` 里，此时 `state` 还没建完，拿不到 `state.playerNationId`。两种方案：

- **方案 1（推荐）**：`buildProvinces(playerId: string)` 接收参数，调用方传 `PLAYER_ID`（5 国）或生成的玩家 id（世界）。
- 方案 2：建完后二次遍历修正 assimilation/loyalty。

**推荐方案 1**，因为 `createWorldState` 已经知道玩家 id。走 DEC 登记此决策。

### 8.4 验收命令

A1 完成后必须依次跑：

```
npm run typecheck   # 必须 ✅
npm test            # 必须 44/44 ✅
npm run validate    # 必须 ✅
```

A2 加测试后再跑一次 `npm test`，预期 45/45 或更多。

---

## 9. 各轨启动 Prompt 模板（可直接复制给 GLM-5.2）

### 9.1 轨道 A1 启动 prompt

```
你是 Imperium Aeternum 的开发者。请阅读并严格遵守 docs/00-project-plan-v2.md（FROZEN v2）。

冻结基线：
- docs/00-project-plan-v2.md §8（轨道 A 精确改动契约）
- docs/handoff.md（最新会话状态）

本会话任务：【轨道 A1 — 完成 PLAYER_ID 全量替换】

可改文件（清单外只读）：
- src/App.tsx
- src/screens/Dashboard.tsx
- src/screens/EconomyScreen.tsx
- src/screens/MilitaryScreen.tsx
- src/screens/DiplomacyScreen.tsx
- src/screens/PoliticsScreen.tsx
- src/screens/PopulationScreen.tsx
- src/screens/ProvinceScreen.tsx
- src/screens/TechnologyScreen.tsx
- src/screens/EventModal.tsx
- src/screens/SaveLoadScreen.tsx
- src/screens/WorldMap.tsx
- src/screens/ScenarioSelect.tsx
- src/store/gameStore.ts
- src/engine/ai.ts
- src/engine/init.ts

替换原则（严格按 §8.1）：
- 取玩家对象 / 省份归属 / 外交关系查找 → 用 state.playerNationId（store 里用 pid(s)）
- data/nations.ts 的 PLAYER_ID 常量、init.ts 的默认值、turn.ts 的 fallback、__validate__.ts、turn.test.ts → 保留

特殊处理（§8.3）：
- init.ts 的 buildProvinces 改为接收 playerId 参数，createWorldState 传入

约束：
- 不得重构无关代码
- 不得改公式
- 不得删现有测试
- thinking effort: high

完成后依次跑并贴出结果：
  npm run typecheck
  npm test
  npm run validate
三项全绿才算完成。最后更新 docs/handoff.md。
```

### 9.2 轨道 B1 启动 prompt

```
你是 Imperium Aeternum 的文档作者。请阅读 docs/00-project-plan-v2.md §4 轨道 B。

任务：【B1 — 生成 docs/03-data-tables.md】

方法：从 src/data/*.ts 的实际导出反向生成数据圣经，不得凭记忆。
每张表列出：字段名 / 类型 / 含义 / 取值范围 / 示例。

可改文件：仅 docs/03-data-tables.md（新建）+ docs/handoff.md
其他只读。thinking effort: medium。
完成后更新 handoff。
```

### 9.3 轨道 C1 启动 prompt

```
你是 Imperium Aeternum 的内容作者。请阅读 docs/00-project-plan-v2.md §4 轨道 C1。

任务：【C1 — 事件扩到 80 + 3 条事件链】

冻结基线：
- src/data/events.ts 现有 60 事件 schema
- docs/02-system-rules.md §15 事件系统设计

新增 20 事件 + 3 条事件链（瘟疫链 / 王位继承链 / 边境冲突链）。
事件链：用 nextEventId 字段串联，按 turn 间隔触发。

可改文件：src/data/events.ts、src/__tests__/（加事件链触发测试）、docs/handoff.md
其他只读。不得改 events engine 逻辑（如需改先走 DEC）。
thinking effort: high。完成后 npm test 全绿 + 更新 handoff。
```

---

## 10. 验收门槛汇总

| 轨道 | 步骤 | 验收命令 | 预期 |
|------|------|---------|------|
| A1 | PLAYER_ID 替换 | typecheck + test + validate | 全绿，44/44 |
| A2 | 多剧本烟雾测试 | npm test | 45+/45+ |
| A3 | 稳定度调参 | scripts/world-audit.ts | A 级均稳定 ≥ 50 |
| A4 | AI 缺粮建农场 | scripts/world-audit.ts | 负粮国 ≤ 3 |
| A5 | D 级食物兜底 | scripts/world-audit.ts | 负粮国 = 0 |
| B1 | 数据圣经 | 人工对照 | 字段一一对应 |
| B2 | 架构文档 | 人工对照 | 含调用图 |
| B3 | 开发日志 | 人工对照 | DEC 索引全 |
| B4 | ADR 补登 | docs/decisions.md | 每偏离有 ADR |
| C1 | 事件扩容 | npm test | 全绿 + 事件链测试通过 |
| C2 | 法律树 | typecheck + PoliticsScreen 可用 | ✅ |
| C3 | 贸易路线 | typecheck + EconomyScreen 可用 | ✅ |
| C4 | 更多剧本 | typecheck + 每剧本能开局 | ✅ |
| C5 | 5 国省份坐标 | WorldMap 5 国剧本正常 | ✅ |

---

## 11. 风险与缓解 v2

| 风险 | v2 缓解 |
|------|---------|
| PLAYER_ID 替换漏一处导致运行时崩 | §8.2 逐文件清单 + A2 加非 n01 剧本烟雾测试 |
| GLM-5.2 长会话漂移重写 ai.ts | §5.3 改动边界声明 + 引用小节号 |
| 调参改坏现有 44 测试 | A3 必须先跑 baseline，改后全绿才算 |
| 文档 B 轨凭记忆写错 | B1/B2 强制"从代码反向生成"，不得凭记忆 |
| 内容 C 轨失控膨胀 | §3.2 红线（事件 ≤100、科技不再扩） |
| 多会话上下文丢失 | §7 handoff 强制更新 |
| 性能退化（国家/省份扩） | §3.2 红线锁 250 国 / 800 省 + world-smoke 性能断言 |

---

## 12. 与 v1 的差异总结

| 维度 | v1 | v2 |
|------|----|----|
| 定位 | 从零规划 | 增量修复 + 扩展 |
| 阶段 | 1→6 线性 | 三轨并行（A 修复 / B 文档 / C 扩展） |
| 红线 | 13 条永久（已过时） | 永久 6 + 当前阶段 8（可 DEC 解锁） |
| 现状认知 | 假设从零 | 基线快照 + 已知遗留表 |
| 漂移 mitigation | 冻结点 | 冻结点 + 会话分段 + 引用小节号 + 改动边界声明 |
| 操作性 | 给阶段目标 | §8 逐文件改动清单 + §9 可复制 prompt |
| 交接 | 未提 | handoff.md 格式冻结 |
| thinking 分档 | 按阶段 | 按工作类型（修复/文档/新机制/内容） |
| 验收 | 每阶段 checklist | 每轨每步验收命令 |

---

## 13. 立即执行

下一步应将 §9.1 的 prompt 作为给 GLM-5.2 的启动指令，执行轨道 A1（PLAYER_ID 全量替换）。这是当前唯一 P0，完成后多剧本选国即解锁，C4 才能做。

后续按 §4 的依赖图推进：A1→A2→（A3/A4/A5 与 B1/B2/B3/B4 并行）→C 轨。

---

> **FROZEN v2** — 本文件为项目迭代规划基线。后续会话引用本文不得修改；如需调整规划本身，走 `docs/decisions.md` DEC-NNN。v1 (`docs/00-project-plan.md`) 保留为历史决策记录，其 §11 红线被本文件 §3.2 取代。
