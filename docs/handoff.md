# Imperium Aeternum — 会话交接

> **2026-06-25 最终状态**：解决按键冲突 + 全量体验与测试优化，116/116 测试全绿，自检 0 错误。

## 验证结果（硬证据）

```
npm run typecheck  → ✅
npm test           → ✅ 116/116 全绿
npm run validate   → ✅ 325 事件 / 0 错误
```

## 本次完成（按键体验优化）

| 改动 | 文件 | 验证 |
|------|------|------|
| **体验优化** 解决 EventModal 与全局/子页面快捷键冲突 | App.tsx, EconomyScreen.tsx, ProvinceScreen.tsx | typecheck ✅ + 手动逻辑走查 ✅ |
| **测试确认** 116个单元测试全部绿灯 | vitest | ✅ |

---

> **2026-06-24 最终状态**：v2 规划 + 轨道 A + C1/C2/C3 + B1/B2/B4 全部完成，48 测试全绿，0 错误。

## 验证结果（硬证据）

```
npm run typecheck  → ✅
npm test           → ✅ 48/48 全绿
npm run validate   → ✅ 103 事件 / 0 错误
```

## 本次完成（v2 轨道 A + B1/B2/B4 + C1/C2/C3）

| 改动 | 文件 | 验证 |
|------|------|------|
| **A1** PLAYER_ID 全量替换 | store/init/ai/App+12 screen | typecheck ✅ |
| **A2** 非 n01 剧本烟雾测试 | world-smoke.test.ts | ✅ |
| **A3** A 级稳定度调参 v3 | politics.ts | A 级 46→74.3 |
| **A4** AI 缺粮建农场提前 | ai.ts | 负粮国 9→1 |
| **A5** D 级 Static 档食物兜底 | ai.ts | 专项测试 ✅ |
| **B1** 数据圣经 | docs/03-data-tables.md（新建，242行） | ✅ |
| **B2** 架构文档 | docs/04-architecture.md（新建，272行） | ✅ |
| **B4** DEC-021~025 补登记 | decisions.md | ✅ |
| **遗留** validate 科技级数 + 3 重复事件 id | __validate__.ts/events.ts | validate ✅ |
| **C1 事件链**（3 链 9 事件 + triggerEvent 引擎激活） | events.ts engine + events.ts data + test | 48/48 ✅ |
| **C2 法律树**（12 法律 + 互斥） | laws.ts(新)+types+politics+init+turn+store+PoliticsScreen | 全验证 ✅ |
| **C3 贸易路线**（8 路线 + 长度修正） | trade-routes.ts(新)+types+init+economy+store+EconomyScreen | 全验证 ✅ |
| **v2 规划文档** | 00-project-plan-v2.md(491行) | ✅ |

## 三个新机制 + 两个文档闭环

| 机制 | 内容量 | 玩法影响 |
|------|--------|---------|
| **C1 事件链** | 3 链 9 事件 + triggerEvent 引擎 | 叙事连续性，危机逐步升级 |
| **C2 法律树** | 12 法律 + 互斥 | 取向性选择（贵族特权↔土地改革） |
| **C3 贸易路线** | 8 路线 + 长度修正 | 失土断线，扩张带来治理压力 |
| **B1 数据圣经** | 242 行，13 表 | 从代码反向生成，单一事实源 |
| **B2 架构文档** | 272 行，9 节 | engine 职责 + 调用关系图 |

## 下次继续

按 v2 §4 依赖图剩余：
1. **C4 更多剧本**（W3/W5/W6，A1 已解锁）
2. **B3 开发日志** `docs/05-mvp-notes.md`（从 git 历史反向生成）
3. 性能优化（50 回合 4s，可进一步优化 AI 分层）
4. UI 打磨（5 国剧本世界地图、更多反馈）

## 验证结果（硬证据）

```
npm run typecheck  → ✅
npm test           → ✅ 46/46 全绿
npm run validate   → ✅ 94 事件 / 0 错误（仅剩无害的相邻不对称 warnings）
npx tsx scripts/world-audit.ts → ✅ 0 问题国
  A 级稳定 74.3 | 负粮国 1 | 被击败 3 | 战争 14 | 贸易 284
```

## 本次完成（v2 轨道 A + C2 + C3 + B4 + 遗留修复）

| 改动 | 文件 | 验证 |
|------|------|------|
| **A1** PLAYER_ID 全量替换 | store/init/ai/App+12 screen | typecheck ✅ |
| **A2** 非 n01 剧本烟雾测试 | world-smoke.test.ts | ✅ |
| **A3** A 级稳定度调参 v3 | politics.ts | A 级 46→74.3 |
| **A4** AI 缺粮建农场提前 | ai.ts | 负粮国 9→1 |
| **A5** D 级 Static 档食物兜底 | ai.ts | 专项测试 ✅ |
| **B4** DEC-021~025 补登记 | decisions.md | ✅ |
| **遗留** validate 科技级数 + 3 重复事件 id | __validate__.ts/events.ts | validate ✅ |
| **C2 法律树**（新机制） | laws.ts(新建12条)+types+politics+init+turn+store+PoliticsScreen | 全验证 ✅ |
| **C3 贸易路线**（新机制） | trade-routes.ts(新建8条)+types+init+economy+store+EconomyScreen | 全验证 ✅ |
| **v2 规划文档** | 00-project-plan-v2.md(491行) | ✅ |

## C2 法律树（本次新功能）

- `data/laws.ts`：12 条法律，3 类（民法/刑法/行政法）
- 互斥机制：土地改革↔贵族特权、中央集权↔地方自治、严刑↔宽刑
- 效果：腐败/稳定/治能/合法/税率乘数/不满削减/叛乱削减
- 每回合 `lawPerTurnEffects()` 应用 unrest/rebellion 削减
- PoliticsScreen 加政策/法律页签切换

## C3 贸易路线（本次新功能）

- `data/trade-routes.ts`：8 条预设路线（丝绸之路/地中海商路/琥珀之路等）
- 建立条件：至少一端省份归玩家 + 前置行政科技 + 金
- 长度修正：短途×1.0 / 中途×1.3 / 长途×1.6
- 每回合收益：金 + 影响力 + 粮（部分路线）
- 路线失效：两端都不归玩家则断
- EconomyScreen 加路线显示 + 建立按钮

## 下次继续

按 v2 §4 依赖图剩余：
1. **C1 事件链**（瘟疫链/王位继承链/边境冲突链，当前 94 事件可加链条）
2. **B1 数据圣经** `docs/03-data-tables.md`（从 src/data 反向生成，含 laws/trade-routes）
3. **B2 架构文档** `docs/04-architecture.md`
4. **C4 更多剧本**（W3/W5/W6）

剩余 todo（优先级低）：超庞大扩展 B/C/D/E/F/G、整合验证 J、贸易条约频率调整

## 验证结果（硬证据）

```
npm run typecheck  → ✅
npm test           → ✅ 46/46 全绿（新增 A2 非 n01 剧本烟雾 + A5 D级食物兜底 2 测试）
npx tsx scripts/world-audit.ts → ✅ 0 问题国
  S: 2国 稳86.7 | A: 8国 稳74.3 | B: 30国 稳93.3 | C: 71国 稳91.8 | D: 95国 稳90.7
  负粮国: 1（原 9）| 零稳定: 0 | 被击败: 3 | 战争: 14 | 贸易: 284
```

## 本次完成（v2 轨道 A 全部 + B4）

| 改动 | 文件 | 验证 |
|------|------|------|
| **A1** PLAYER_ID 全量替换为 state.playerNationId | store/gameStore.ts (5处)、engine/init.ts (buildProvinces接playerId参数)、engine/ai.ts (isPlayerNeighbor)、App.tsx + 12 个 screen（全删 PLAYER_ID import） | typecheck ✅ + 46/46 ✅ |
| **A2** 非 n01 剧本烟雾测试 | __tests__/world-smoke.test.ts (新增测试：createWorldState(7777,chosenId) 推50回合无NaN) | ✅ |
| **A3** A 级稳定度调参 v3 | engine/politics.ts (分段回归力 4/2.5/1→5/3/1.5，阈值 55/70→60/75) | A 级 46→74.3 ✅ |
| **A4** AI 缺粮建农场提前触发 | engine/ai.ts (planAITurn 门槛 food<0 → food<consume*2) | 负粮国 9→1 ✅ |
| **A5** D 级 Static 档食物兜底 | engine/ai.ts (processAITurnStatic 加被动建农场，免金模拟自给) | 专项测试 ✅ |
| **B4** 补登记 v1 红线突破 ADR | docs/decisions.md (DEC-021~DEC-025) | ✅ |
| **v2 规划文档** | docs/00-project-plan-v2.md (491 行，FROZEN v2) | ✅ |

## v2 规划文档要点（docs/00-project-plan-v2.md）

- **定位**：取代 v1 的"后续阶段指导"，针对 GLM-5.2 能力 + 当前代码状态
- **三轨**：A 修复（已完成）/ B 文档闭环（B4 已完成，B1/B2/B3 待做）/ C 内容扩展（待做）
- **红线 v2**：永久 6 条 + 当前阶段 8 条（可 DEC 解锁）
- **漂移 mitigation**：会话分段契约 + 引用而非重述 + 改动边界声明
- **§8 轨道 A 精确改动契约**（PLAYER_ID 逐文件清单，已全部执行）
- **§9 各轨启动 prompt 模板**（可直接复制给 GLM-5.2）

## 关键文件索引（本会话涉及）

| 文件 | 作用 |
|------|------|
| `docs/00-project-plan-v2.md` | v2 规划基线（新增） |
| `docs/decisions.md` | DEC-021~025 新增 |
| `src/engine/politics.ts` | stabilityDelta v3 调参 |
| `src/engine/ai.ts` | A4 缺粮建农场 + A5 D级兜底 |
| `src/engine/init.ts` | buildProvinces 接 playerId 参数 |
| `src/store/gameStore.ts` | pid(s) 全量替换 PLAYER_ID |
| `src/App.tsx` + 12 screen | 全部改 state.playerNationId |
| `src/__tests__/world-smoke.test.ts` | +2 测试（A2/A5） |

## 下次继续

按 v2 §4 依赖图，A 轨完成后下一步优先级：

1. **C4 更多剧本**（A1 已解锁，但 classic/world/eastasia 三剧本已存，可补 W3/W5/W6 剧本或优化现有）
2. **B1 数据圣经** `docs/03-data-tables.md`（从 src/data/*.ts 反向生成）
3. **B2 架构文档** `docs/04-architecture.md`（从 src/engine/*.ts 反向生成）
4. **C1 事件扩到 80 + 3 条事件链**（当前 ~60 事件，high effort）
5. **C2 法律树**（新机制，high effort）
6. **C3 贸易路线**（新机制）
7. **C5 5 国剧本省份补 x/y 坐标**（让 WorldMap 在 classic 剧本下正常显示）

剩余 todo（未完成，优先级低）：
- 超庞大扩展 B/C/D/E/F/G（国家性格专属/法律树/王朝/贸易路线/阶层流动/地形细化）
- 整合验证 J
- 贸易条约仍偏少（284/1717，可再调 AI 贸易频率）
- D 级极穷（金 6836，可考虑基础收入补贴但 DEC-024 已否决）
- 0 被击败国问题已缓解（audit 显示 3 被击败）
