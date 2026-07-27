# Gameplay 领域导航

`gameplay/` 连接纯引擎和界面，但自身不应依赖 React DOM 或远端 SDK。

- `actions/`：会改变游戏状态的玩家命令。
- `*Advisor.ts`、`*Assessment.ts`：只读取状态并生成建议或评估。
- `turn*.ts`、`preTurnCouncil.ts`、`commandExecutionPlan.ts`：回合前后编排与展示模型。
- `onboarding*.ts`、`noviceJourney.ts`、`launch*.ts`：新手与开局体验。
- `state*.ts`、`saveRecovery.ts`：跨层状态卫生、断言与恢复。
- `war*.ts`、`aiWar*.ts`：玩家战争预览与 AI 战争动作适配。

当前先维持文件名可搜索和低迁移成本。只有当某一子领域继续增长且拥有稳定边界时，才整体迁入子目录，避免为分类而制造大量路径改动。
