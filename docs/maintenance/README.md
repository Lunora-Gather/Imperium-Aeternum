# 维护手册

## 1. 当前架构基线

核心状态只有一个事实源：`GameState`。完整回合必须经过：

```text
GameStore.nextTurn
  → advanceTurnPipeline
    → processTurn（自身隔离输入）
    → applyAmbitionsAfterTurn
    → applyPlayerFocus / applyAIStrategy
    → sanitizeState
  → 一次性写回 Zustand
```

禁止重新引入“启动时覆盖 store 方法”的安装器。回合顺序必须在 `src/gameplay/turnPipeline.ts` 中显式可见并可单测。

## 2. 核心文件职责

| 文件 | 职责 |
| --- | --- |
| `src/types/game.ts` | GameState、Nation、Province、AI 记忆和国运元数据类型 |
| `src/engine/turn.ts` | 唯一正式引擎回合入口、玩家年结和报告生成 |
| `src/engine/aiTurnPhase.ts` | AI 决策、AI 年结、AI 事件与性格刷新 |
| `src/engine/turnIntel.ts` | 世界动态、领土变化和叛军衰减阶段 |
| `src/engine/turnConsequences.ts` | 破产、崩溃、失都、法统失败与叛乱后果 |
| `src/engine/stateClone.ts` | GameState 深拷贝与瞬态缓存隔离 |
| `src/engine/turnIsolation.ts` | 旧调用方兼容入口；不得承载额外规则 |
| `src/utils/id.ts` | 存档内确定性实体 ID 分配与序列解析 |
| `src/gameplay/turnPipeline.ts` | 唯一完整回合编排入口 |
| `src/gameplay/actions/` | 玩家命令事务服务；失败零副作用，成功结构共享 |
| `src/gameplay/stateHygiene.ts` | 对旧档和运行时状态做可恢复净化 |
| `src/gameplay/stateInvariants.ts` | 只读审计，不静默修复 |
| `src/gameplay/stateOwnership.ts` | 国家与中立省份所有权合约 |
| `src/gameplay/pendingEventResolution.ts` | 待决事件原子化结算 |
| `src/store/gameStore.ts` | Zustand 薄适配层、场景切换、存读档和管线调用 |
| `src/store/scenarioCatalog.ts` | 剧本类型、目录和随机区域配置 |
| `src/store/persistence.ts` | 存档迁移、规范化和瘦身 |

## 3. 永久不变量

- `playerNationId` 必须指向存在的国家，并且只能有一个匹配的 `isPlayer`。
- 省份所有者必须是存在的国家或登记过的中立势力；`barbarian` 不是损坏引用。
- 资源、治理、省份、军队数值不得出现 `NaN` 或 `Infinity`。
- 军队必须属于其容器国家，并位于存在的省份。
- 国家必须有有效本国首都；建筑与军队 ID 不得重复。
- `entityIdCounter` 必须不小于所有已持久化实体 ID 的序列号。
- 战争不得存在无效引用或同一国家对的重复记录，`atWar` 和双向战争条约必须同步。
- 外交关系不得重复，条约与停战期必须双向一致。
- `_relMap` 是运行时缓存，不能进入存档和跨层状态。
- 事件唯一性与冷却按国家隔离；旧档无作用域历史归属玩家，损坏或重复的待决事件在净化阶段移除。
- 待决事件只能结算一次，事件链不得在同回合形成无限循环，UI 必须以调用时的最新 store 状态为准。

这些规则由 `stateInvariants.test.ts` 和 `turnPipeline.test.ts` 锁定。

## 4. 常用验证

```bash
npm run typecheck
npm run test:invariants
npm run simulate:stability
npm run simulate:benchmark
npm run check:bundle
npm test
npm run validate
npm run rc:check
```

`rc:check` 是合并与发布前的最终门禁，包含完整测试而非测试子集。
`simulate:benchmark` 使用 5 个样本输出 min/p50/p95/max/avg，适合判断性能趋势；CI 门禁仍使用较快的单样本稳定性检查。
`check:bundle` 对入口块、App 块、最大 JS、JS 总量和 CSS 总量设置预算；`rc:check` 会在生产构建后自动执行。

## 5. 改动规则

1. 引擎规则保持纯数据输入输出，不导入 React、DOM 或 Zustand。
2. 新增长期状态字段时，同步更新 `GameState`、存档迁移/规范化、净化和不变量测试。
3. 新增中立势力时，只修改 `stateOwnership.ts` 的合法所有者合约，不在各模块复制字符串判断。
4. 修复回合问题时优先在 `turnPipeline` 或 engine 修复，不在组件中补偿错误状态。
5. UI 事件不得直接修改当前 store 对象；所有玩家命令进入 `gameplay/actions` 事务边界。
6. 每个生产崩溃至少补一个不依赖浏览器的回归测试。
7. 存档压缩、预览和保存不得修改当前运行中的 GameState。
8. 不得重新增加第二套完整回合实现；迁移验证使用契约、不变量和确定性重放。
9. 不得在 `processTurn` 后叠加规则补丁；应修复对应子系统并增加边界测试。
10. 建筑产出只能通过共享的 `computeBuildingYields` 公式结算，等级与地形修正不得在 UI 或 AI 中复制。
