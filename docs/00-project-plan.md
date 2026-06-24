# Imperium Aeternum — 项目开发规划（GLM-5.2 优化版）

> 本文档在用户原始《Imperium Aeternum 游戏完整规划与开发任务》基础上，针对 GLM-5.2 的能力特征（长上下文、长程工程任务、代码生成、agent 式分阶段执行）做了针对性优化。
> 原始需求保持不变，本文只调整**执行方式、阶段划分、产出契约、质量门禁**，以提升最终 MVP 的成功率。

---

## 0. 本次优化的核心思路

| # | 优化点 | 针对的 GLM-5.2 特性 | 解决的问题 |
|---|--------|--------------------|------------|
| 1 | 阶段产出契约化（固定文件清单 + 校验清单） | 长程工程任务 | 跨阶段衔接漂移、上下文遗忘 |
| 2 | 引入"冻结点"机制（每阶段输出冻结为基线） | 长上下文 | 模型在长会话中反复重写已定设计 |
| 3 | 数据先行于代码，数据阶段拆细 | 代码 + 数据驱动能力 | 数据冻结后代码生成几乎不跑偏 |
| 4 | 公式集中到 `engine/formulas.ts` + 单元测试 | 代码能力 | 公式散落组件导致调试困难 |
| 5 | 每阶段末尾设可运行验证点 | agent 式执行 | "写完没验证"的假成功 |
| 6 | MVP 代码阶段拆为 5a/5b/5c 三层递进 | 长程任务分段 | 一次性写完易崩溃、难定位 |
| 7 | 存档 schema 版本化 + migration | 长期迭代 | 后期改数据结构导致旧档失效 |
| 8 | thinking effort 分档标注 | thinking effort 可调 | 设计阶段用 high、纯数据用 medium、代码用 high |
| 9 | 每阶段自带"反例 / 不要做什么" | 长上下文下易过度扩展 | 防止 MVP 失控膨胀 |
| 10 | 文档分目录而非单文件 | 长上下文检索 | 后续阶段能精确引用前阶段产出 |

---

## 1. 项目顶层结构（冻结）

```
imperium-aeternum/
  docs/                      # 所有设计文档（冻结点）
    00-project-plan.md       # 本文件
    01-design-bible.md       # 阶段1产出
    02-system-rules.md       # 阶段2产出
    03-data-tables.md        # 阶段3产出（数据圣经）
    04-architecture.md       # 阶段4产出
    05-mvp-notes.md          # 阶段5开发日志
    06-expansion.md          # 阶段6产出
    formulas.md              # 公式总表（阶段2单独抽出，便于引用）
    decisions.md             # 关键决策记录（ADR 式）
  src/
    app/                     # 路由、布局
    components/              # 通用 UI 组件
    data/                    # JSON / TS 静态数据表
      nations.ts
      provinces.ts
      buildings.ts
      technologies.ts
      policies.ts
      governments.ts
      factions.ts
      events.ts
      national-characters.ts
    engine/                  # 纯逻辑，无 React 依赖
      formulas.ts            # 所有数值公式集中处
      economy.ts
      population.ts
      politics.ts
      military.ts
      diplomacy.ts
      technology.ts
      culture.ts
      events.ts
      ai.ts
      turn.ts                # processTurn(gameState) 总入口
      migration.ts           # 存档版本迁移
    store/
      gameStore.ts           # Zustand store
      persistence.ts         # localStorage 读写 + 版本校验
    types/
      game.ts                # 所有 interface
    utils/
      math.ts
      random.ts              # 确定性随机（带 seed）
      id.ts
    screens/                 # 页面级组件
      Dashboard.tsx
      ProvinceScreen.tsx
      EconomyScreen.tsx
      PopulationScreen.tsx
      PoliticsScreen.tsx
      MilitaryScreen.tsx
      DiplomacyScreen.tsx
      TechnologyScreen.tsx
      EventModal.tsx
      TurnReportScreen.tsx
      SaveLoadScreen.tsx
    __tests__/               # Vitest 单元测试
      formulas.test.ts
      economy.test.ts
      turn.test.ts
      ...
    App.tsx
    main.tsx
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  README.md
```

**冻结说明**：此结构一旦确认，后续阶段只能新增文件，不得随意移动已有文件。改动需记入 `docs/decisions.md`。

---

## 2. 阶段划分（6 阶段 → 7 阶段，含拆分）

原始方案是 6 阶段。我把**阶段 3（数据表）拆成 3a/3b**，**阶段 5（MVP 代码）拆成 5a/5b/5c**，让每段产出更小、更可验证。

| 阶段 | 名称 | 产出 | 可运行验证点 | thinking effort |
|------|------|------|--------------|-----------------|
| 1 | 设计圣经 | `docs/01-design-bible.md` | 文档评审 checklist | high |
| 2 | 系统规则 + 公式总表 | `docs/02-system-rules.md`、`docs/formulas.md` | 公式可手算验算 | high |
| 3a | 核心数据表（国家/省份/建筑/科技/政体） | `docs/03-data-tables.md` 上半 + 对应 `src/data/*.ts` | `tsc --noEmit` 通过 | medium |
| 3b | 内容数据表（事件/政策/派系/AI/国家性格） | `docs/03-data-tables.md` 下半 + 对应 `src/data/*.ts` | `tsc --noEmit` 通过、数据自检脚本 | medium |
| 4 | 类型 + 架构 + engine 骨架 + 公式实现 | `docs/04-architecture.md` + `src/types` + `src/engine/formulas.ts` + 单测 | `npm test` 公式单测全绿 | high |
| 5a | 状态层 + 回合结算 + 存档 | `gameStore.ts` + `turn.ts` + `persistence.ts` | 浏览器能初始化、推进 10 回合、存读档 | high |
| 5b | 7 个核心系统 engine 完整实现 | `economy/population/politics/military/diplomacy/technology/events.ts` | 单测 + 推进 50 回合无 NaN/崩溃 | high |
| 5c | 11 个 UI 页面 + 事件弹窗 + 回合结算界面 | `src/screens/*` + `components/*` | 完整可玩 MVP，能打赢/打输一局 | high |
| 6 | 扩展设计 | `docs/06-expansion.md` | 文档 | medium |

**关键改动**：
- 阶段 3 拆分：因为数据量最大，分两批避免单次产出过长导致后半段质量下降。
- 阶段 5 拆分：原方案一次性写完 MVP 风险最高。拆成"状态/回合/UI"三层，每层可独立验证。
- 阶段 4 提前到代码之前，且只产出**类型 + 公式 + 单测**，不写业务逻辑，作为后续 5a/5b 的稳定地基。

---

## 3. 每阶段的产出契约

为防止"看起来写完实际没写完"，每阶段固定三段输出：

### 3.1 产出契约模板

```markdown
## 阶段 N：XXX

### A. 交付物清单
- [ ] 文件路径 1
- [ ] 文件路径 2

### B. 关键决策记录（写入 docs/decisions.md）
- DEC-NNN：决策内容、原因、替代方案

### C. 验证清单（必须全部勾上才算完成）
- [ ] 验证点 1
- [ ] 验证点 2
```

### 3.2 各阶段验证清单（冻结）

| 阶段 | 验证清单 |
|------|----------|
| 1 | ① 一句话概念 ≤ 30 字 ② MVP 范围明确列出"做什么"和"不做什么" ③ 4 胜利 + 6 失败条件齐全 ④ 核心循环图含 9 步 ⑤ 已说明哪些系统 MVP 简化 |
| 2 | ① 8 系统每系含：目标/玩家操作/关键数值/公式/事件触发/联动/MVP 简化/扩展 ② 公式全部抽到 `formulas.md` ③ 每个变量标注取值范围 ④ ≥20 个事件样例 |
| 3a | ① 所有 `src/data/*.ts` 通过 `tsc --noEmit` ② 数据自洽（省份归属国家存在、建筑引用合法） ③ 数值在公式标注的取值范围内 |
| 3b | ① ≥20 事件含 ≥2 选项 ② 每事件触发条件可被 GameState 字段判定 ③ AI 国家性格与政体不冲突 |
| 4 | ① 所有 interface 在 `types/game.ts` ② `formulas.ts` 每公式对应 ≥1 单测 ③ `npm test` 全绿 ④ `processTurn` 签名确定 |
| 5a | ① 初始化后能推进 ≥10 回合不报错 ② 存档含 `version` 字段 ③ 读档能完整恢复 ④ 推进结果可手算对照 |
| 5b | ① 推进 50 回合无 NaN/Infinity ② 每系统单测 ≥3 个 ③ 事件能触发且选项生效 ④ AI 国家能自主行动 |
| 5c | ① 11 页面均可访问 ② 能完成一整局（开局→扩张→触发事件→赢或输） ③ 无 console error ④ 关键警告（破产/低稳定）有高亮 |
| 6 | ① 每扩展项说明依赖的 MVP 钩子 ② 标注优先级 P0/P1/P2 |

---

## 4. 冻结点机制（防止长上下文漂移）

GLM-5.2 在超长会话中可能不自觉重写早期已定内容。规则：

1. **每阶段完成后，产出文件即为冻结基线**。文件头部加：
   ```markdown
   > **FROZEN vN** — 此文档已冻结，后续阶段引用本文不得修改，改动需走 DEC-NNN。
   ```
2. **后续阶段如需推翻冻结内容**，必须在 `docs/decisions.md` 写一条 ADR：
   ```markdown
   ## DEC-007 将省份从 12 个减为 10 个
   - 背景：5a 实现时发现 12 省份 UI 过密
   - 决策：减为 10 个
   - 影响：需回改 src/data/provinces.ts、docs/03-data-tables.md
   - 替代：保留 12 但加分页（否决：增加复杂度）
   ```
3. **代码生成时，优先引用冻结文档的具体小节号**，而非凭记忆重述。例如 prompt：
   > "实现 `economy.ts`，公式严格按 `docs/formulas.md §2.1` 税收公式，不得自创。"

---

## 5. 公式集中策略（关键工程决策）

**问题**：原方案公式散落在各 engine 文件，调试时难定位、难统一调参。

**决策**：
- 所有公式集中在 `src/engine/formulas.ts`，每个公式是一个**纯函数**：
  ```ts
  export function computeTax(input: TaxInput): number {
    return input.population * input.baseTaxRate * input.taxEfficiency
         * stabilityModifier(input.stability)
         * corruptionModifier(input.corruption);
  }
  ```
- 每个公式配 ≥1 单测，单测里**手算预期值**对照。
- `engine/*.ts` 业务文件只调用 `formulas.ts`，不写公式本体。
- 调参时只改 `formulas.ts` 一处，全工程生效。
- 公式命名严格对应 `docs/formulas.md` 的小节号（如 `§2.1` → `computeTax`），便于人工核对。

**理由**：GLM-5.2 代码能力强但长文件易局部漂移，集中化让公式成为单一事实源。

---

## 6. 数据自检脚本（阶段 3 引入）

为防止数据表内部不一致（如省份引用了不存在的国家），在阶段 3 末尾产出：

`src/data/__validate__.ts`：
- 检查所有 province.ownerId 在 nations 中存在
- 检查所有 building.id 唯一
- 检查所有 event.option.effect 引用的字段在 GameState 中存在
- 检查数值字段在 `formulas.md` 标注范围内
- 检查 AI 国家性格与政体不冲突

运行：`npm run validate`，非零退出即失败。**阶段 3 完成的硬门槛。**

---

## 7. 确定性随机（避免存档不一致）

`src/utils/random.ts` 使用 seeded RNG（mulberry32 或类似）：
- 所有事件触发、AI 决策、战斗结算都走 seeded RNG。
- seed 存入 GameState，每回合推进时更新。
- **理由**：玩家读档后推同一回合，结果必须一致；否则调试和复现 bug 极困难。

---

## 8. 存档版本化（阶段 4 提前定）

```ts
interface SaveGame {
  version: number;           // 当前 1
  createdAt: string;
  gameState: GameState;
}
```

`src/engine/migration.ts`：
- `migrate(save: SaveGame): SaveGame` — 按版本号顺序应用迁移函数。
- 后续每次改 GameState 结构，版本 +1，加一个迁移函数。
- **现在就定，避免 MVP 后期改结构时旧档全废。**

---

## 9. 阶段间衔接的 Prompt 模板

为减少上下文消耗、保证衔接精确，每阶段开始时用固定模板：

```
继续 Imperium Aeternum 第 N 阶段。

冻结基线：
- docs/01-design-bible.md (FROZEN v1)
- docs/02-system-rules.md (FROZEN v1)
- docs/formulas.md (FROZEN v1)
- ...

本阶段任务：[阶段 N 的具体产出]

本阶段产出契约：
A. 交付物清单（文件路径）
B. 关键决策记录（写入 docs/decisions.md）
C. 验证清单（见 docs/00-project-plan.md §3.2）

约束：
- 不得修改冻结文档，需改走 DEC-NNN
- 公式严格引用 docs/formulas.md 小节号
- 数据范围不得超出 formulas.md 标注
- thinking effort: high/medium

完成后先自检验证清单，再输出。
```

---

## 10. thinking effort 分档建议

| 阶段 | effort | 理由 |
|------|--------|------|
| 1 设计圣经 | high | 需要权衡和取舍 |
| 2 系统规则 + 公式 | high | 公式设计影响全局 |
| 3a/3b 数据表 | medium | 大量机械产出，重在一致 |
| 4 类型 + 公式实现 | high | 类型是地基 |
| 5a 状态/回合 | high | 架构关键 |
| 5b 系统 engine | high | 业务逻辑复杂 |
| 5c UI | medium | 偏机械，按设计图实现 |
| 6 扩展设计 | medium | 不落地实现 |

---

## 11. MVP 范围再确认（防膨胀红线）

以下在 MVP 中**坚决不做**（违反即拒绝产出）：

- ❌ 即时战斗 / 战斗演出（只做战略层结算）
- ❌ 大地图（固定 10 省份，不做随机地图）
- ❌ 多语言（先中文，UI 文案集中便于后扩）
- ❌ 多存档槽（先单槽，后期扩）
- ❌ 联机（单人）
- ❌ 美术资源（用纯 CSS + SVG 几何图形）
- ❌ 音效音乐
- ❌ 复杂外交链（关系值 + 条约 + 5 种行动足够）
- ❌ 科技树超过 3 条 × 5 级
- ❌ 事件超过 30 个
- ❌ 省份超过 12 个
- ❌ AI 国家超过 4 个（含玩家共 5 国）
- ❌ 回合长度切换（固定 1 回合 = 1 年）
- ❌ 自定义国家（玩家固定从预设小国起步）

任何阶段产出若引入上述内容，视为违反契约，需重做。

---

## 12. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 长会话上下文漂移 | 冻结点 + ADR + 引用小节号而非重述 |
| 公式前后不一致 | 集中到 formulas.ts + 单测手算对照 |
| 数据表不自洽 | `npm run validate` 硬门槛 |
| 存档后期失效 | 阶段 4 就定 version + migration |
| MVP 膨胀 | §11 红线 + 每阶段"不要做什么"清单 |
| 一次性写完崩溃 | 阶段 5 拆 5a/5b/5c，每层可独立运行 |
| 调试困难 | seeded RNG + 公式单测 + 推进 N 回合烟雾测试 |
| AI 国家行为僵化 | 阶段 2 先定权重表，阶段 5b 实现时直接套用 |

---

## 13. 立即执行：第 1 阶段启动 Prompt

下一步应将以下内容作为给 GLM-5.2 的第 1 阶段启动指令（本文件已作为 `docs/00-project-plan.md` 冻结基线存在）：

```
你是 Imperium Aeternum 的首席策划 + 系统设计师 + 架构师。

请阅读并严格遵守 docs/00-project-plan.md（已冻结）。其中：
- §1 项目结构
- §2 阶段划分
- §3 产出契约
- §4 冻结点机制
- §11 MVP 红线

现在执行【阶段 1：设计圣经】。

产出：
- 文件：docs/01-design-bible.md
- 内容按 §3.2 阶段 1 验证清单组织，必须包含以下小节：
  1. 游戏一句话概念（≤30 字）
  2. 玩家扮演什么
  3. 核心乐趣
  4. 核心玩法循环（9 步图）
  5. MVP 范围（做什么 + 不做什么，引用 §11 红线）
  6. 完整版愿景
  7. 核心系统总览（8 系统 + 国家性格 + AI）
  8. MVP 中必须砍掉或简化的内容（逐系统）
  9. 下一阶段要产出的数据表预告
- 关键决策写入 docs/decisions.md（DEC-001 起）
- thinking effort: high

完成后自检 §3.2 阶段 1 全部验证点，再输出。
文件头加 `> **FROZEN v1**` 标记。
```

后续阶段（2/3a/3b/4/5a/5b/5c/6）的启动 prompt 按 §9 模板生成，本文件不再重复。

---

## 14. 与原方案的差异总结

| 维度 | 原方案 | 本优化版 |
|------|--------|----------|
| 阶段数 | 6 | 7（3 拆 3a/3b，5 拆 5a/5b/5c） |
| 产出形态 | 自由文档 | 固定契约（A 交付物 / B 决策 / C 验证） |
| 公式位置 | 散落各系统文件 | 集中 formulas.ts + 单测 |
| 数据校验 | 靠人审 | `npm run validate` 硬门槛 |
| 存档 | 直接 localStorage | version + migration |
| 防漂移 | 无 | 冻结点 + ADR + 引用小节号 |
| 防膨胀 | "不要扩展"一句话 | §11 红线 13 条 + 每阶段"不要做什么" |
| 随机数 | 未提 | seeded RNG |
| thinking effort | 未提 | 按阶段分档 |
| 可运行验证点 | 仅阶段 5 | 阶段 4 起每阶段都有 |

---

> **FROZEN v1** — 本文件为项目总规划基线。后续阶段引用本文不得修改；如需调整规划本身，走 `docs/decisions.md` DEC-NNN。
