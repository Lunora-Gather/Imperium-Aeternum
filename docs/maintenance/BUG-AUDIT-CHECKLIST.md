# 漏洞检查与修复清单

## 1. 复现

- 记录剧本、玩家国、回合、种子、最近动作和存档版本。
- 判断问题属于 engine、pipeline、store action、persistence 还是 UI。
- 优先构造最小 Node/Vitest 复现；只有真实渲染相关问题才依赖浏览器。
- 崩溃时保留错误栈，确认首个项目内调用点，不只处理最终 UI 症状。

## 2. 状态审计

- `playerNationId` 与唯一 `isPlayer` 是否一致。
- 是否把中立 `ownerId` 当作缺失国家。
- 国家、省份、军队是否存在非有限数值。
- 战争、外交、军队位置是否引用不存在的实体。
- 国家首都、建筑容器、`atWar` 和双向条约是否一致。
- 待决事件是否仍在队列中、是否已经写入 triggeredEvents。
- `lastReport`、`history` 和当前 turn 是否同步。
- `_relMap` 是否泄漏进存档或跨回合状态。

运行：

```bash
npm run test:invariants
```

## 3. 修复原则

- 在最靠近错误来源的纯逻辑层修复。
- 不通过改 UI 文案、隐藏按钮或吞异常掩盖错误状态。
- 不复制玩家 ID、中立势力 ID、胜利阈值或回合顺序。
- 不新增启动时 store monkey patch。
- 涉及资源扣除时使用事务 action，并检查失败返回原状态引用。
- 涉及事件和按钮时检查双击、键盘重复和旧闭包。

## 4. 回归要求

- 添加一个修复前失败、修复后通过的测试。
- 涉及状态结构时补不变量断言。
- 涉及完整回合时至少推进 5 回合。
- 涉及世界生成时至少覆盖一个非默认玩家国。
- 涉及存档时覆盖“预检不写入、迁移后可读、往返等价”。

## 5. 提交前门禁

```bash
npm run typecheck
npm run test:invariants
npm run simulate:stability
npm test
npm run validate
npm run rc:check
```

真实交互最低冒烟路径：

```text
启动页 → 经典剧本 → 确认 6 省 / 征服 67%
→ 推进首回合 → 连续处理全部待决事件
→ 确认进入第 2 年年报且每个事件仅结算一次
→ 手动存档 → 返回标题 → 读档
```
