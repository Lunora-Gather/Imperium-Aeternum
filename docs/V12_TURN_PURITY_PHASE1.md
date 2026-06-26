# 第十二轮：回合引擎纯函数化第一阶段

本轮不做大规模玩法重写，目标是先把回合结算的输入隔离边界下沉到 engine 层，为后续逐步纯函数化战争、AI、事件和报告生成打基础。

## 已落地

### 1. 新增引擎级回合隔离边界

新增 `src/engine/turnIsolation.ts`：

- `cloneGameStateForTurn(state)`：深拷贝 GameState，并丢弃运行时缓存 `_relMap`。
- `processTurnIsolated(state)`：在隔离副本上执行旧 `processTurn()`，避免调用方传入的状态被内部 mutation 污染。

这一步不改变结算规则，只把“保护输入不被改坏”从 UI 护栏层抽到 engine 层。

### 2. 逻辑护栏复用 engine 边界

`src/gameplay/logicGuard.ts` 不再维护私有 clone 实现，改为复用 `cloneGameStateForTurn()` 与 `processTurnIsolated()`。

这样做的价值：

- 减少重复安全逻辑；
- 让 engine 层也有可复用的安全回合入口；
- 后续 store、测试、模拟器或调试工具都可以直接调用隔离入口。

### 3. 新增回归测试

新增 `src/engine/__tests__/turnIsolation.test.ts`：

- 验证 clone 是深拷贝，不共享 nations、provinces、relations、wars 等关键引用；
- 验证 `_relMap` 被清理；
- 验证 `processTurnIsolated()` 能推进回合且不污染调用方传入的原始 state。

### 4. CI 门禁补强

`.github/workflows/pr-quality.yml` 新增 `Turn isolation tests` 步骤，确保这条边界以后不会无声退化。

## 没有做的事

- 没有立刻把 `processTurn()` 整体重写成全纯函数。
- 没有重写战争、AI、事件和王朝系统。
- 没有调整玩法数值和平衡。

原因是这些系统互相耦合很深，一次性重写风险高。第一阶段先建立隔离边界，确保后续每拆一块都有安全基线。

## 下一阶段建议

下一步最值得做的是：把玩家回合中的“法律每回合效果”从 mutate 版本切换为已存在的 pure 版本，并加等价/不污染测试。

优先级暂不建议超过战争或 AI 大重构，因为法律效果范围小、收益明确、回归风险低。
